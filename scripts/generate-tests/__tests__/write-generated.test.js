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

const fs = require("fs");
const os = require("os");
const path = require("path");

const { extractFile } = require("../extract-module");
const {
    GENERATED_SUFFIX,
    generatedTestPathFor,
    assertSafeTestPath,
    safeWrite,
    writeGeneratedTest
} = require("../write-generated");

const GENERATED_REL = `js/utils/__tests__/utils-logic${GENERATED_SUFFIX}`;

// Repository root resolved from this file's location, not from process.cwd()
// (which only happens to equal the repo root because Jest's rootDir does).
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");

const FIXTURES = path.join(__dirname, "fixtures", "generated");
const validSource = fs.readFileSync(path.join(FIXTURES, "valid-utils-logic.txt"), "utf8");
const utilsLogicPlan = () => extractFile("js/utils/utils-logic.js");

// Probe symlink support synchronously to use it.skip when unsupported (e.g. Windows without Dev Mode), avoiding false passes.
const symlinkSupported = (() => {
    const probe = fs.mkdtempSync(path.join(os.tmpdir(), "mb-symlink-probe-"));
    try {
        fs.symlinkSync(probe, path.join(probe, "link"), "dir");
        return true;
    } catch (err) {
        if (err.code === "EPERM" || err.code === "EACCES") {
            return false;
        }
        throw err;
    } finally {
        fs.rmSync(probe, { recursive: true, force: true });
    }
})();

let sandbox;
beforeEach(() => {
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "mb-write-generated-"));
});
afterEach(() => {
    fs.rmSync(sandbox, { recursive: true, force: true });
});

describe("generatedTestPathFor", () => {
    it("derives a deterministic __tests__ path with the generated suffix", () => {
        expect(generatedTestPathFor("js/utils/utils-logic.js")).toBe(
            `js/utils/__tests__/utils-logic${GENERATED_SUFFIX}`
        );
        expect(generatedTestPathFor("js/utils/utils-logic.js")).toBe(
            generatedTestPathFor("js/utils/utils-logic.js")
        );
    });

    it("rejects an absolute module path", () => {
        expect(() => generatedTestPathFor("/etc/passwd.js")).toThrow(/repo-relative/);
    });

    it("rejects a traversing module path", () => {
        expect(() => generatedTestPathFor("js/../../evil.js")).toThrow(/".."/);
    });

    it("rejects a non-js module path", () => {
        expect(() => generatedTestPathFor("js/utils/data.json")).toThrow(/\.js file/);
    });
});

describe("assertSafeTestPath", () => {
    const root = "/repo";

    it("accepts a normal generated test path", () => {
        expect(assertSafeTestPath(`js/utils/__tests__/x${GENERATED_SUFFIX}`, root)).toBe(
            path.resolve(root, `js/utils/__tests__/x${GENERATED_SUFFIX}`)
        );
    });

    it("rejects an absolute path", () => {
        expect(() => assertSafeTestPath(`/repo/js/__tests__/x${GENERATED_SUFFIX}`, root)).toThrow(
            /absolute output path/
        );
    });

    it("rejects a path that traverses upward", () => {
        expect(() =>
            assertSafeTestPath(`js/utils/__tests__/../../../x${GENERATED_SUFFIX}`, root)
        ).toThrow(/traverses upward/);
    });

    it("rejects a path outside a __tests__ directory", () => {
        expect(() => assertSafeTestPath(`js/utils/x${GENERATED_SUFFIX}`, root)).toThrow(
            /outside a __tests__/
        );
    });

    it("rejects a path without the generated suffix", () => {
        expect(() => assertSafeTestPath("js/utils/__tests__/x.test.js", root)).toThrow(
            /must end in/
        );
    });

    it("is documented as lexical-only: it does not resolve symlinks", () => {
        // A path that is lexically fine is accepted here; the real-path guard
        // that catches a symlinked directory lives in safeWrite (see below).
        expect(assertSafeTestPath(`js/x/__tests__/y${GENERATED_SUFFIX}`, root)).toBe(
            path.resolve(root, `js/x/__tests__/y${GENERATED_SUFFIX}`)
        );
    });
});

describe("safeWrite", () => {
    it("writes a validated candidate to its deterministic location", () => {
        const report = safeWrite(validSource, {
            modulePath: "js/utils/utils-logic.js",
            cwd: sandbox
        });
        expect(report).toMatchObject({
            path: `js/utils/__tests__/utils-logic${GENERATED_SUFFIX}`,
            written: true,
            created: true,
            dryRun: false
        });
        expect(fs.readFileSync(report.absolutePath, "utf8")).toBe(validSource);
    });

    it("dry-run reports the exact path and writes nothing", () => {
        const report = safeWrite(validSource, {
            modulePath: "js/utils/utils-logic.js",
            cwd: sandbox,
            dryRun: true
        });
        expect(report).toMatchObject({ written: false, dryRun: true });
        expect(fs.existsSync(report.absolutePath)).toBe(false);
    });

    it("never overwrites an existing file (wx create fails, EEXIST is mapped)", () => {
        const first = safeWrite(validSource, {
            modulePath: "js/utils/utils-logic.js",
            cwd: sandbox
        });
        // A file now sits at the target path (here a hand-written test). The
        // second call must not clobber it: safeWrite has no stat pre-check, it
        // opens with the `wx` flag and maps the resulting EEXIST to a clear
        // error.
        fs.writeFileSync(first.absolutePath, "// a hand-written test\n");
        expect(() =>
            safeWrite(validSource, { modulePath: "js/utils/utils-logic.js", cwd: sandbox })
        ).toThrow(/refusing to overwrite an existing test/);
        expect(fs.readFileSync(first.absolutePath, "utf8")).toBe("// a hand-written test\n");
    });

    it("refuses to write empty source", () => {
        expect(() =>
            safeWrite("   ", { modulePath: "js/utils/utils-logic.js", cwd: sandbox })
        ).toThrow(/empty source/);
    });

    it("refuses an absolute module path", () => {
        expect(() =>
            safeWrite(validSource, { modulePath: path.join(sandbox, "x.js"), cwd: sandbox })
        ).toThrow(/repo-relative/);
    });

    (symlinkSupported ? it : it.skip)(
        "refuses to write through a __tests__ symlink that escapes the repo",
        () => {
            const outside = fs.mkdtempSync(path.join(os.tmpdir(), "mb-outside-"));
            try {
                fs.mkdirSync(path.join(sandbox, "js", "utils"), { recursive: true });
                fs.symlinkSync(outside, path.join(sandbox, "js", "utils", "__tests__"), "dir");
                expect(() =>
                    safeWrite(validSource, { modulePath: "js/utils/utils-logic.js", cwd: sandbox })
                ).toThrow(/real path resolves outside the repository/);
                // even a dry run refuses it
                expect(() =>
                    safeWrite(validSource, {
                        modulePath: "js/utils/utils-logic.js",
                        cwd: sandbox,
                        dryRun: true
                    })
                ).toThrow(/real path resolves outside the repository/);
                expect(fs.readdirSync(outside)).toEqual([]);
            } finally {
                fs.rmSync(outside, { recursive: true, force: true });
            }
        }
    );
});

describe("writeGeneratedTest: validate-then-write", () => {
    it("writes a valid candidate and reports the path", () => {
        const result = writeGeneratedTest(validSource, { plan: utilsLogicPlan(), cwd: sandbox });
        expect(result).toMatchObject({ valid: true, written: true });
        expect(result.path).toBe(`js/utils/__tests__/utils-logic${GENERATED_SUFFIX}`);
        expect(fs.existsSync(path.join(sandbox, result.path))).toBe(true);
    });

    it("never writes an invalid candidate but still reports the would-be path", () => {
        const bad = `
const target = require("../utils-logic");
describe("utils-logic", () => {
    it("exists", () => { expect(target).toBeDefined(); });
});
`;
        const result = writeGeneratedTest(bad, { plan: utilsLogicPlan(), cwd: sandbox });
        expect(result.valid).toBe(false);
        expect(result.written).toBe(false);
        // path is kept for diagnostics even though nothing was written
        expect(result.path).toBe(GENERATED_REL);
        expect(fs.existsSync(path.join(sandbox, GENERATED_REL))).toBe(false);
    });

    it("fails fast on a malformed module path, before source validation", () => {
        const result = writeGeneratedTest(validSource, {
            modulePath: "js/../../evil.js",
            cwd: sandbox
        });
        expect(result.valid).toBe(false);
        expect(result.written).toBe(false);
        expect(result.path).toBeNull();
        expect(result.validation.errors.join(" ")).toMatch(/".."/);
    });

    it("dry-run validates and resolves the path without writing", () => {
        const result = writeGeneratedTest(validSource, {
            plan: utilsLogicPlan(),
            cwd: sandbox,
            dryRun: true
        });
        expect(result.valid).toBe(true);
        expect(result.written).toBe(false);
        expect(result.path).toBe(`js/utils/__tests__/utils-logic${GENERATED_SUFFIX}`);
        expect(fs.existsSync(path.join(sandbox, result.path))).toBe(false);
    });

    it("does not overwrite: the safe writer throws through the pipeline", () => {
        writeGeneratedTest(validSource, { plan: utilsLogicPlan(), cwd: sandbox });
        expect(() =>
            writeGeneratedTest(validSource, { plan: utilsLogicPlan(), cwd: sandbox })
        ).toThrow(/refusing to overwrite/);
    });
});

describe("write-generated does not touch the real source tree", () => {
    it("has no generated test committed under js/utils/__tests__", () => {
        const dir = path.join(REPO_ROOT, "js", "utils", "__tests__");
        const generated = fs.readdirSync(dir).filter(f => f.endsWith(GENERATED_SUFFIX));
        expect(generated).toEqual([]);
    });
});
