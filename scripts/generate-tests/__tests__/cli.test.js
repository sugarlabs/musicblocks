/**
 * @license
 * MusicBlocks v3.7.1
 * Copyright (C) 2026 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Contributor-usability tests for the CLI: module selection (`--module` vs the
 * positional form), --help, the --emit dry-run/preview report, and the write
 * path. These exercise the real validator and writer end to end; only the
 * provider seam (./llm-client) is ever swapped out, and only to get a
 * deterministic *valid* candidate through the pipeline for the write-path
 * tests - the two shipped providers (noop, manual with no fixture) always
 * produce a candidate the validator rejects, which the existing test suite
 * already relies on.
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const cli = require("../cli");

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const CLI_PATH = path.join(__dirname, "..", "cli.js");
const UTILS_LOGIC = "js/utils/utils-logic.js";
const UTILS_LOGIC_TESTS_DIR = path.join(REPO_ROOT, "js", "utils", "__tests__");
const GENERATED_IN_TREE = path.join(UTILS_LOGIC_TESTS_DIR, "utils-logic.generated.test.js");
const VALID_SOURCE = fs.readFileSync(
    path.join(__dirname, "fixtures", "generated", "valid-utils-logic.txt"),
    "utf8"
);

/**
 * Runs `fn` with process.stdout.write / process.stderr.write captured instead
 * of printed, and returns `{ result, stdout, stderr }`. Streams are always
 * restored, even if `fn` throws.
 */
function captureStreams(fn) {
    const out = [];
    const err = [];
    const outSpy = jest.spyOn(process.stdout, "write").mockImplementation(chunk => {
        out.push(chunk);
        return true;
    });
    const errSpy = jest.spyOn(process.stderr, "write").mockImplementation(chunk => {
        err.push(chunk);
        return true;
    });
    try {
        const result = fn();
        return { result, stdout: out.join(""), stderr: err.join("") };
    } finally {
        outSpy.mockRestore();
        errSpy.mockRestore();
    }
}

/**
 * Runs `fn(isolatedCli)` against a fresh copy of the CLI wired to a fake
 * provider that always returns `VALID_SOURCE`, regardless of the requested
 * provider name. Scoped to this one call via jest.isolateModules, so it never
 * affects any other test's (real) provider behaviour.
 */
function withValidProviderCli(fn) {
    let result;
    jest.isolateModules(() => {
        jest.doMock("../llm-client", () => ({
            createClient: () => ({
                name: "fixture",
                generate: () => ({ source: VALID_SOURCE })
            })
        }));
        result = fn(require("../cli"));
    });
    return result;
}

/** Creates a throwaway repo-like directory containing only utils-logic.js. */
function makeSandboxWithUtilsLogic() {
    const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "mb-cli-usability-"));
    fs.mkdirSync(path.join(sandbox, "js", "utils"), { recursive: true });
    fs.copyFileSync(
        path.join(REPO_ROOT, UTILS_LOGIC),
        path.join(sandbox, "js", "utils", "utils-logic.js")
    );
    return sandbox;
}

// A regression in NoopClient/ManualClient's default output, or in the writer,
// would drop a real file under the repo's own js/utils/__tests__/. Guard every
// test in this file the same way the existing --emit CLI tests do.
afterEach(() => {
    fs.rmSync(GENERATED_IN_TREE, { force: true });
});

describe("module selection: --module vs the positional form", () => {
    it("parses a bare positional module the same as --module <path>", () => {
        expect(cli.parseArgs([UTILS_LOGIC]).file).toBe(UTILS_LOGIC);
        expect(cli.parseArgs(["--module", UTILS_LOGIC]).file).toBe(UTILS_LOGIC);
        expect(cli.parseArgs([`--module=${UTILS_LOGIC}`]).file).toBe(UTILS_LOGIC);
    });

    it("produces byte-identical plan output whether the module is selected positionally or via --module", () => {
        const positional = captureStreams(() => cli.main([UTILS_LOGIC]));
        const viaOption = captureStreams(() => cli.main(["--module", UTILS_LOGIC]));

        expect(positional.result).toBe(0);
        expect(viaOption.result).toBe(0);
        expect(viaOption.stdout).toBe(positional.stdout);
        // Sanity: it is actually the plan JSON, not an empty/placeholder string.
        expect(JSON.parse(positional.stdout).file).toBe(UTILS_LOGIC);
    });

    it("rejects combining a positional module path with --module", () => {
        expect(() => cli.parseArgs(["a.js", "--module", "b.js"])).toThrow(
            /cannot combine a positional module path/
        );
        expect(() => cli.parseArgs(["--module", "b.js", "a.js"])).toThrow(
            /cannot combine a positional module path/
        );
    });

    it("requires a value after --module", () => {
        expect(() => cli.parseArgs(["--module"])).toThrow(/--module requires a path/);
        expect(() => cli.parseArgs(["--module", "--emit"])).toThrow(/--module requires a path/);
        expect(() => cli.parseArgs(["--module="])).toThrow(/--module= requires a path/);
    });
});

describe("invalid module selection", () => {
    it("exits 1 with the offending path named, for both selection forms", () => {
        const positional = captureStreams(() => cli.main(["does/not/exist.js"]));
        const viaOption = captureStreams(() => cli.main(["--module", "does/not/exist.js"]));

        expect(positional.result).toBe(1);
        expect(viaOption.result).toBe(1);
        expect(positional.stderr).toMatch(/does\/not\/exist\.js/);
        expect(viaOption.stderr).toMatch(/does\/not\/exist\.js/);
        expect(viaOption.stderr).toMatch(/unable to read file/);
    });
});

describe("--help output", () => {
    // Invoked as a real subprocess: --help calls process.exit(0) directly, so
    // it cannot safely be called in-process without hijacking the test worker.
    it("documents module selection, the dry-run preview, writing, and safety restrictions", () => {
        const stdout = execFileSync(process.execPath, [CLI_PATH, "--help"], {
            cwd: REPO_ROOT,
            encoding: "utf8"
        });

        expect(stdout).toMatch(/--module <module\.js>/);
        expect(stdout).toMatch(/dry-run \/ preview/);
        expect(stdout).toMatch(/--write/);
        expect(stdout).toMatch(/never overwrites/i);
        expect(stdout).toMatch(/CANDIDATE/);
        expect(stdout).toMatch(/npm run generate-tests/);
    });

    it("exits 0", () => {
        expect(() =>
            execFileSync(process.execPath, [CLI_PATH, "--help"], { cwd: REPO_ROOT })
        ).not.toThrow();
    });
});

describe("dry-run / preview (--emit without --write)", () => {
    it("reports plan counts, the rejection reason, and the intended path - and writes nothing", () => {
        expect(fs.existsSync(GENERATED_IN_TREE)).toBe(false);

        const { result, stdout, stderr } = captureStreams(() =>
            cli.main(["--module", UTILS_LOGIC, "--emit"])
        );

        expect(result).toBe(1);
        expect(stdout).toMatch(/module: js\/utils\/utils-logic\.js/);
        expect(stdout).toMatch(/exports: \d+, functions: \d+, classes: \d+/);
        expect(stdout).toMatch(/candidates generated: 1, accepted: 0, rejected: 1/);
        expect(stderr).toMatch(/invalid: .*no meaningful assertions/);
        expect(stderr).toMatch(
            /candidate rejected; nothing written \(intended path: js\/utils\/__tests__\/utils-logic\.generated\.test\.js\)/
        );
        expect(fs.existsSync(GENERATED_IN_TREE)).toBe(false);
    });

    it("--emit --write also creates no file when the candidate is rejected", () => {
        const { result } = captureStreams(() =>
            cli.main(["--module", UTILS_LOGIC, "--emit", "--write"])
        );
        expect(result).toBe(1);
        expect(fs.existsSync(GENERATED_IN_TREE)).toBe(false);
    });

    it("the manual provider's default (no registered fixture) is rejected the same way", () => {
        const { result, stderr } = captureStreams(() =>
            cli.main(["--module", UTILS_LOGIC, "--emit=manual"])
        );
        expect(result).toBe(1);
        expect(stderr.length).toBeGreaterThan(0);
        expect(fs.existsSync(GENERATED_IN_TREE)).toBe(false);
    });
});

describe("candidate generation (--generate)", () => {
    it("prints the raw candidate source, identically for both selection forms, and writes nothing", () => {
        const before = fs.readdirSync(UTILS_LOGIC_TESTS_DIR);
        const positional = captureStreams(() => cli.main([UTILS_LOGIC, "--generate"]));
        const viaOption = captureStreams(() => cli.main(["--module", UTILS_LOGIC, "--generate"]));

        expect(positional.result).toBe(0);
        expect(viaOption.result).toBe(0);
        expect(viaOption.stdout).toBe(positional.stdout);
        expect(positional.stdout).toMatch(/describe\(/);
        expect(fs.readdirSync(UTILS_LOGIC_TESTS_DIR)).toEqual(before);
    });
});

describe("write path behavior (mocked provider seam, real validator + writer)", () => {
    it("--emit --write creates the file at the deterministic path with the exact candidate source", () => {
        const sandbox = makeSandboxWithUtilsLogic();
        const cwd = process.cwd();
        try {
            process.chdir(sandbox);
            const { result, stdout } = captureStreams(() =>
                withValidProviderCli(isolated =>
                    isolated.main(["--module", "js/utils/utils-logic.js", "--emit", "--write"])
                )
            );
            const written = path.join(
                sandbox,
                "js",
                "utils",
                "__tests__",
                "utils-logic.generated.test.js"
            );

            expect(result).toBe(0);
            expect(stdout).toMatch(/accepted: 1, rejected: 0/);
            expect(stdout).toMatch(/wrote js\/utils\/__tests__\/utils-logic\.generated\.test\.js/);
            expect(fs.existsSync(written)).toBe(true);
            expect(fs.readFileSync(written, "utf8")).toBe(VALID_SOURCE);
        } finally {
            process.chdir(cwd);
            fs.rmSync(sandbox, { recursive: true, force: true });
        }
    });

    it("never overwrites a file already at the generated path, and leaves it untouched", () => {
        const sandbox = makeSandboxWithUtilsLogic();
        const cwd = process.cwd();
        try {
            process.chdir(sandbox);
            const targetDir = path.join(sandbox, "js", "utils", "__tests__");
            const targetFile = path.join(targetDir, "utils-logic.generated.test.js");
            fs.mkdirSync(targetDir, { recursive: true });
            fs.writeFileSync(targetFile, "// a hand-written test\n");

            const { result, stderr } = captureStreams(() =>
                withValidProviderCli(isolated =>
                    isolated.main(["--module", "js/utils/utils-logic.js", "--emit", "--write"])
                )
            );

            expect(result).toBe(1);
            expect(stderr).toMatch(/refusing to overwrite an existing test/);
            expect(fs.readFileSync(targetFile, "utf8")).toBe("// a hand-written test\n");
        } finally {
            process.chdir(cwd);
            fs.rmSync(sandbox, { recursive: true, force: true });
        }
    });

    it("--emit (no --write) previews an accepted candidate without creating any file", () => {
        const sandbox = makeSandboxWithUtilsLogic();
        const cwd = process.cwd();
        try {
            process.chdir(sandbox);
            const { result, stdout } = captureStreams(() =>
                withValidProviderCli(isolated =>
                    isolated.main(["--module", "js/utils/utils-logic.js", "--emit"])
                )
            );
            const wouldBeWritten = path.join(
                sandbox,
                "js",
                "utils",
                "__tests__",
                "utils-logic.generated.test.js"
            );

            expect(result).toBe(0);
            expect(stdout).toMatch(/accepted: 1, rejected: 0/);
            expect(stdout).toMatch(/candidate is valid; would write/);
            expect(stdout).toMatch(/pass --write to create it/);
            expect(fs.existsSync(wouldBeWritten)).toBe(false);
        } finally {
            process.chdir(cwd);
            fs.rmSync(sandbox, { recursive: true, force: true });
        }
    });
});

describe("incompatible CLI options", () => {
    it("rejects --write without --emit", () => {
        expect(() => cli.parseArgs(["a.js", "--module", "b.js", "--write"])).toThrow(
            /cannot combine a positional module path/
        );
        expect(() => cli.parseArgs(["a.js", "--write"])).toThrow(/--write only applies/);
    });

    it("rejects combining --emit with another mode even when the module is given via --module", () => {
        expect(() => cli.parseArgs(["--module", "a.js", "--emit", "--check"])).toThrow(
            /mutually exclusive/
        );
        expect(() => cli.parseArgs(["--module", "a.js", "--prompt", "--generate"])).toThrow(
            /mutually exclusive/
        );
    });

    it("reports an unknown option with a pointer to --help", () => {
        expect(() => cli.parseArgs(["a.js", "--bogus"])).toThrow(/run --help/);
    });
});

describe("deterministic output", () => {
    it("running the same command twice yields identical stdout", () => {
        const first = captureStreams(() => cli.main(["--module", UTILS_LOGIC]));
        const second = captureStreams(() => cli.main(["--module", UTILS_LOGIC]));
        expect(first.stdout).toBe(second.stdout);

        const firstPrompt = captureStreams(() => cli.main(["--module", UTILS_LOGIC, "--prompt"]));
        const secondPrompt = captureStreams(() => cli.main(["--module", UTILS_LOGIC, "--prompt"]));
        expect(firstPrompt.stdout).toBe(secondPrompt.stdout);
    });
});

describe("existing safety guarantees hold for --module too", () => {
    it("--module cannot be used to make --emit write outside the repository", () => {
        const outside = fs.mkdtempSync(path.join(os.tmpdir(), "mb-cli-outside-"));
        try {
            const strayModule = path.join(outside, "stray.js");
            fs.writeFileSync(strayModule, "function f(x) { return x; }\nmodule.exports = { f };\n");

            let code;
            expect(() => {
                ({ result: code } = captureStreams(() =>
                    cli.main(["--module", strayModule, "--emit"])
                ));
            }).not.toThrow();

            expect(code).toBe(1);
            // Nothing was created anywhere under the outside-the-repo directory.
            expect(fs.readdirSync(outside)).toEqual(["stray.js"]);
        } finally {
            fs.rmSync(outside, { recursive: true, force: true });
        }
    });

    it("--module still only reads and parses the target - it never requires or executes it", () => {
        const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "mb-cli-side-effect-"));
        try {
            const marker = path.join(sandbox, "__side_effect__.txt");
            const hostile = path.join(sandbox, "hostile.js");
            fs.writeFileSync(
                hostile,
                `require("fs").writeFileSync(${JSON.stringify(marker)}, "x");\nmodule.exports = {};\n`
            );

            captureStreams(() => cli.main(["--module", hostile]));
            captureStreams(() => cli.main(["--module", hostile, "--generate"]));

            expect(fs.existsSync(marker)).toBe(false);
        } finally {
            fs.rmSync(sandbox, { recursive: true, force: true });
        }
    });
});
