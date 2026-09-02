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
const path = require("path");
const http = require("http");
const https = require("https");

const { extractFile, parseSource } = require("../extract-module");
const { buildGenerationRequest } = require("../generation-request");
const {
    NoopClient,
    ManualClient,
    createClient,
    generateTests,
    NOT_YET_IMPLEMENTED
} = require("../llm-client");
const cli = require("../cli");

const SCRIPT_DIR = path.join(__dirname, "..");
const utilsLogicPlan = () => extractFile("js/utils/utils-logic.js");

describe("createClient", () => {
    it("returns a NoopClient by default", () => {
        const client = createClient();
        expect(client).toBeInstanceOf(NoopClient);
        expect(client.name).toBe("noop");
    });

    it("returns providers by name, case-insensitively", () => {
        expect(createClient("noop")).toBeInstanceOf(NoopClient);
        expect(createClient("MANUAL")).toBeInstanceOf(ManualClient);
    });

    it("rejects a named-but-unimplemented provider with a helpful message", () => {
        for (const name of NOT_YET_IMPLEMENTED) {
            expect(() => createClient(name)).toThrow(/not implemented in this repository yet/);
        }
    });

    it("rejects an unknown provider", () => {
        expect(() => createClient("wat")).toThrow(/unknown test-generation provider/);
    });
});

describe("NoopClient", () => {
    const request = buildGenerationRequest(utilsLogicPlan());

    it("returns Jest source referencing the real module", () => {
        const { source, meta } = new NoopClient().generate(request);
        expect(source).toContain('const target = require("../utils-logic");');
        expect(source).toContain('describe("js/utils/utils-logic.js"');
        expect(source).toContain("it.todo(");
        expect(source.trimStart().startsWith("/**")).toBe(true); // license header
        expect(meta).toMatchObject({ client: "noop", generated: false });
        expect(meta.exports).toEqual(request.module.exportNames);
    });

    it("returns source that actually parses as JavaScript", () => {
        // The provider boundary promises "generated test source"; prove the
        // NoopClient's output is syntactically valid, not just that it contains
        // the right substrings. parseSource throws on a syntax error.
        const plans = [
            utilsLogicPlan(),
            extractFile("js/utils/language-utils.js"),
            extractFile("js/utils/musicutils.js"),
            { file: "js/no-exports.js", exports: [] },
            { file: "js/weird.js", exports: [{ name: "a-b", kind: "value" }] }
        ];
        for (const plan of plans) {
            const { source } = new NoopClient().generate(buildGenerationRequest(plan));
            expect(() => parseSource(source, "noop-output.js")).not.toThrow();
        }
    });

    it("builds the module import relative to a custom target test path", () => {
        const customRequest = buildGenerationRequest(utilsLogicPlan(), {
            targetTestPath: "custom/here.test.js"
        });
        const { source } = new NoopClient().generate(customRequest);
        expect(source).toContain('const target = require("../js/utils/utils-logic");');
    });

    it("escapes request-derived strings in the generated source", () => {
        const hostilePlan = {
            file: 'js/quoted"directory/module.js',
            exports: [{ name: 'quoted"export', kind: "value" }]
        };
        const { source } = new NoopClient().generate(buildGenerationRequest(hostilePlan));
        expect(source).toContain('describe("js/quoted\\"directory/module.js"');
        expect(source).toContain('it.todo("quoted\\"export: describe the behaviour under test")');
        expect(() => parseSource(source, "noop-escaped-output.js")).not.toThrow();
    });

    it("is deterministic for a given request", () => {
        const a = new NoopClient().generate(request).source;
        const b = new NoopClient().generate(request).source;
        expect(a).toBe(b);
    });

    it("handles a plan with no exports", () => {
        const { source } = new NoopClient().generate(
            buildGenerationRequest({ file: "js/x.js", exports: [] })
        );
        expect(source).toContain("module exposes no direct exports");
        expect(() => parseSource(source, "noop-output.js")).not.toThrow();
    });
});

describe("ManualClient", () => {
    const request = buildGenerationRequest(utilsLogicPlan());

    it("returns a pre-registered response verbatim", () => {
        const client = new ManualClient({
            responses: { "js/utils/utils-logic.js": "// hand written test\n" }
        });
        const { source, meta } = client.generate(request);
        expect(source).toBe("// hand written test\n");
        expect(meta).toMatchObject({ origin: "fixture" });
    });

    it("falls back to the prompt in a comment when nothing is registered", () => {
        const { source, meta } = new ManualClient().generate(request);
        expect(meta).toMatchObject({ origin: "prompt" });
        expect(source.startsWith("/*")).toBe(true);
        expect(source).toContain("# Jest test generation request");
        // the embedded prompt must not prematurely close the block comment
        expect(source.slice(2, -3)).not.toContain("*/");
    });

    it("wraps the prompt in a comment that still parses as JavaScript", () => {
        const { source } = new ManualClient().generate(request);
        expect(() => parseSource(source, "manual-output.js")).not.toThrow();
    });

    it("escapes a block-comment terminator in the module path", () => {
        const hostileRequest = buildGenerationRequest({ file: "js/bad*/path.js" });
        const { source } = new ManualClient().generate(hostileRequest);
        expect(source).toContain("js/bad*\\/path.js");
        expect(() => parseSource(source, "manual-escaped-output.js")).not.toThrow();
    });
});

describe("generateTests pipeline", () => {
    it("runs plan -> request -> prompt -> client and returns the pieces", async () => {
        const result = await generateTests(utilsLogicPlan());
        expect(result.client).toBe("noop");
        expect(result.prompt).toContain("Source path: js/utils/utils-logic.js");
        expect(result.request.module.path).toBe("js/utils/utils-logic.js");
        expect(result.source).toContain("describe(");
        expect(() => parseSource(result.source, "pipeline-output.js")).not.toThrow();
        expect(result.meta.generated).toBe(false);
    });

    it("accepts an explicit provider name", async () => {
        const result = await generateTests(utilsLogicPlan(), { provider: "manual" });
        expect(result.client).toBe("manual");
    });

    it("accepts a custom client instance and forwards request options", async () => {
        const seen = {};
        const custom = {
            name: "spy",
            generate(request) {
                seen.request = request;
                return { source: "// spy\n", meta: { client: "spy" } };
            }
        };
        const result = await generateTests(utilsLogicPlan(), {
            client: custom,
            targetTestPath: "custom/here.test.js"
        });
        expect(result.client).toBe("spy");
        expect(result.source).toBe("// spy\n");
        expect(seen.request.targetTestPath).toBe("custom/here.test.js");
    });

    it("rejects a provider whose generate() returns no source", async () => {
        const broken = { name: "broken", generate: () => ({}) };
        await expect(generateTests(utilsLogicPlan(), { client: broken })).rejects.toThrow(
            /returned no source string/
        );
    });

    it("propagates the TypeError from an invalid plan", async () => {
        await expect(generateTests(null)).rejects.toThrow(TypeError);
    });
});

describe("safety: the generation layer performs no I/O", () => {
    it("does not reference fs, network or fetch in its own source", () => {
        for (const name of ["generation-request.js", "prompt-builder.js", "llm-client.js"]) {
            const src = fs.readFileSync(path.join(SCRIPT_DIR, name), "utf8");
            expect(src).not.toMatch(/require\((["'])(fs|http|https|net|child_process)\1\)/);
            expect(src).not.toMatch(/\bfetch\s*\(/);
            expect(src).not.toMatch(/writeFileSync|createWriteStream/);
        }
    });

    it("makes no HTTP requests while generating", async () => {
        const httpSpy = jest.spyOn(http, "request");
        const httpsSpy = jest.spyOn(https, "request");
        await generateTests(utilsLogicPlan(), { provider: "manual" });
        await generateTests(utilsLogicPlan(), { provider: "noop" });
        expect(httpSpy).not.toHaveBeenCalled();
        expect(httpsSpy).not.toHaveBeenCalled();
    });

    it("writes nothing to the source tree when the CLI generates", () => {
        const before = fs.readdirSync(SCRIPT_DIR).sort();
        expect(cli.main(["js/utils/utils-logic.js", "--generate"])).toBe(0);
        expect(cli.main(["js/utils/utils-logic.js", "--prompt"])).toBe(0);
        expect(fs.readdirSync(SCRIPT_DIR).sort()).toEqual(before);
    });
});

describe("cli: --prompt and --generate", () => {
    it("parses the new flags", () => {
        expect(cli.parseArgs(["m.js", "--prompt"])).toMatchObject({ prompt: true, generate: null });
        expect(cli.parseArgs(["m.js", "--generate"])).toMatchObject({ generate: "noop" });
        expect(cli.parseArgs(["m.js", "--generate=manual"])).toMatchObject({ generate: "manual" });
    });

    it("rejects combining mode flags", () => {
        expect(() => cli.parseArgs(["m.js", "--prompt", "--check"])).toThrow(/mutually exclusive/);
        expect(() => cli.parseArgs(["m.js", "--generate=x", "--prompt"])).toThrow(
            /mutually exclusive/
        );
    });

    it("rejects an empty --generate= value", () => {
        expect(() => cli.parseArgs(["m.js", "--generate="])).toThrow(/requires a provider name/);
    });

    it("--generate exits 1 for an unknown provider", () => {
        expect(cli.main(["js/utils/utils-logic.js", "--generate=openai"])).toBe(1);
    });

    it("--prompt and --generate exit 1 for an unreadable source file", () => {
        expect(cli.main(["does/not/exist.js", "--prompt"])).toBe(1);
        expect(cli.main(["does/not/exist.js", "--generate"])).toBe(1);
    });
});
