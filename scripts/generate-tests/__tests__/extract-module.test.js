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

const { parseSource, extractModule, extractFile, stringifyPlan } = require("../extract-module");
const cli = require("../cli");

const FIXTURES = path.join(__dirname, "fixtures");
const readFixture = name => fs.readFileSync(path.join(FIXTURES, name), "utf8");

describe("extract-module: simple-module fixture", () => {
    const plan = extractModule(readFixture("simple-module.js"), "simple-module.js");

    it("records the file name and detected source type", () => {
        expect(plan.file).toBe("simple-module.js");
        expect(plan.sourceType).toBe("script");
    });

    it("resolves the namespace object assigned to module.exports", () => {
        expect(plan.exports.map(e => e.name)).toEqual([
            "clamp",
            "normalizePath",
            "parseFlag",
            "required"
        ]);
        expect(plan.exports.every(e => e.kind === "function")).toBe(true);
        expect(plan.exports.every(e => e.via === "SimpleModule")).toBe(true);
    });

    it("reports parameter names, arity and rest parameters", () => {
        const clamp = plan.exports.find(e => e.name === "clamp");
        expect(clamp.params).toEqual(["value", "min", "max"]);
        expect(clamp.arity).toBe(1); // stops at the first default

        const normalizePath = plan.functions.find(f => f.name === "normalizePath");
        expect(normalizePath.params).toEqual(["...segments"]);
        expect(normalizePath.arity).toBe(0);
        expect(normalizePath.hasRestParam).toBe(true);
    });

    it("counts branches, returns and throws per function without entering nested scopes", () => {
        const clamp = plan.functions.find(f => f.name === "clamp");
        expect(clamp).toMatchObject({ branches: 4, returns: 3, throws: 0 });

        const parseFlag = plan.functions.find(f => f.name === "parseFlag");
        expect(parseFlag).toMatchObject({ branches: 3, returns: 2, throws: 0 });

        const required = plan.functions.find(f => f.name === "required");
        expect(required).toMatchObject({ branches: 2, returns: 1, throws: 1 });
    });

    it("detects require() dependencies and free global references", () => {
        expect(plan.dependencies).toEqual(["path"]);
        expect(plan.referencedGlobals).toEqual(
            expect.arrayContaining(["Error", "Number", "String"])
        );
        expect(plan.referencedGlobals).not.toContain("path"); // bound by the require() call
        expect(plan.referencedGlobals).not.toContain("value"); // a parameter
    });

    it("keeps shorthand object properties as referenced globals", () => {
        const shorthand = extractModule(
            "const result = { Tone, helper };\nfunction helper() {}\n",
            "shorthand.js"
        );
        expect(shorthand.referencedGlobals).toContain("Tone");
        expect(shorthand.referencedGlobals).not.toContain("helper"); // declared below
        expect(shorthand.referencedGlobals).not.toContain("result");
    });

    it("does not treat a non-shorthand property key as a reference", () => {
        const keyed = extractModule("const result = { Tone: 1 };\n", "keyed.js");
        expect(keyed.referencedGlobals).not.toContain("Tone");
    });

    it("ignores calls to a locally declared require", () => {
        const shadowed = extractModule(
            "function require(x) { return x; }\nrequire('not-a-dependency');\n",
            "shadowed-require.js"
        );
        expect(shadowed.dependencies).toEqual([]);
    });

    it("extracts leading JSDoc blocks and their tags", () => {
        const clampDoc = plan.jsdoc.find(d => d.target === "clamp");
        expect(clampDoc.description).toBe("Clamps a number to a range.");
        expect(clampDoc.tags).toEqual([
            { tag: "param", text: "{number} value - the input value." },
            { tag: "param", text: "{number} min - lower bound." },
            { tag: "param", text: "{number} max - upper bound." },
            { tag: "returns", text: "{number} the clamped value." }
        ]);
    });

    it("does not attach the file banner comment to the first declaration", () => {
        expect(plan.jsdoc.map(d => d.target)).not.toContain("path");
    });

    it("aggregates whole-file totals", () => {
        expect(plan.totals).toEqual({ branches: 12, returns: 7, throws: 1 });
    });

    it("matches the committed expected plan byte-for-byte", () => {
        const expected = readFixture("simple-module.plan.json");
        expect(
            stringifyPlan(extractFile("scripts/generate-tests/__tests__/fixtures/simple-module.js"))
        ).toBe(expected);
    });
});

describe("extract-module: class-module fixture", () => {
    const plan = extractModule(readFixture("class-module.js"), "class-module.js");

    it("resolves classes exported via an object literal", () => {
        expect(plan.exports.map(e => e.name)).toEqual(["Base", "Counter"]);
        expect(plan.exports.every(e => e.kind === "class")).toBe(true);
    });

    it("records the superclass name", () => {
        expect(plan.exports.find(e => e.name === "Counter").superClass).toBe("Base");
        expect(plan.exports.find(e => e.name === "Base").superClass).toBeNull();
    });

    it("describes constructor, methods, accessors and static members", () => {
        const counter = plan.classes.find(c => c.name === "Counter");
        const byKey = counter.methods.map(m => `${m.isStatic ? "static " : ""}${m.kind} ${m.name}`);
        expect(byKey).toEqual([
            "constructor constructor",
            "method tick",
            "get value",
            "set value",
            "static method fromArray"
        ]);

        const ctor = counter.methods.find(m => m.kind === "constructor");
        expect(ctor.params).toEqual(["name", "start", "step"]);
        expect(ctor.arity).toBe(1);

        const setter = counter.methods.find(m => m.kind === "set");
        expect(setter.params).toEqual(["next"]);
    });

    it("counts a throw inside a method and the module-guard branch", () => {
        expect(plan.totals).toEqual({ branches: 3, returns: 4, throws: 1 });
    });

    it("has no top-level functions", () => {
        expect(plan.functions).toEqual([]);
    });

    it("qualifies class-member JSDoc targets with the class name", () => {
        const targets = plan.jsdoc.map(d => d.target);
        expect(targets).toEqual(expect.arrayContaining(["Base.constructor", "Counter.tick"]));
        expect(targets).not.toContain("constructor");
        expect(targets).not.toContain("tick");
    });
});

describe("extract-module: export detection stays at module scope", () => {
    it("ignores module.exports assigned inside a nested function", () => {
        const plan = extractModule(
            "function later() {\n    module.exports = { foo };\n}\nfunction foo() {}\n",
            "later.js"
        );
        expect(plan.exports).toEqual([]);
    });

    it("ignores exports.x assigned inside a nested function", () => {
        const plan = extractModule(
            "function configure() {\n    exports.bar = 1;\n}\n",
            "configure.js"
        );
        expect(plan.exports).toEqual([]);
    });

    it("still resolves the top-level typeof-module guard", () => {
        const plan = extractModule(
            [
                "function helper() {}",
                'if (typeof module !== "undefined" && module.exports) {',
                "    module.exports = { helper };",
                "}"
            ].join("\n"),
            "guarded.js"
        );
        expect(plan.exports.map(e => e.name)).toEqual(["helper"]);
    });
});

describe("extract-module: export de-duplication", () => {
    const plan = extractModule(
        [
            "const cfg = { a: 1 };",
            "function fn() {}",
            "exports.thing = fn;", // { thing, function }
            "exports.thing = cfg;", // { thing, object } - different kind, kept
            "exports.dup = fn;",
            "exports.dup = fn;" // { dup, function } twice - collapsed
        ].join("\n"),
        "dedupe.js"
    );

    it("keys de-duplication on both name and kind", () => {
        const thing = plan.exports.filter(e => e.name === "thing");
        expect(thing.map(e => e.kind).sort()).toEqual(["function", "object"]);
    });

    it("collapses entries that match on name and kind", () => {
        expect(plan.exports.filter(e => e.name === "dup")).toHaveLength(1);
    });

    it("emits no control characters in the plan JSON", () => {
        // eslint-disable-next-line no-control-regex
        expect(/[\u0000-\u0008\u000e-\u001f]/.test(stringifyPlan(plan))).toBe(false);
    });
});

describe("extract-module: real repository modules", () => {
    it("plans js/utils/language-utils.js without expanding nested data maps", () => {
        const plan = extractFile("js/utils/language-utils.js");
        expect(plan.file).toBe("js/utils/language-utils.js");
        expect(plan.exports).toEqual([
            { name: "LANGUAGE_CODE_TO_LOCALE", kind: "object", via: "LanguageUtils" },
            {
                name: "normalizeLanguageCode",
                kind: "function",
                params: ["language"],
                arity: 1,
                hasRestParam: false,
                via: "LanguageUtils"
            }
        ]);
    });

    it("plans js/utils/utils-logic.js and lists its pure helpers as exports", () => {
        const plan = extractFile("js/utils/utils-logic.js");
        const names = plan.exports.map(e => e.name);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
        expect(names).toEqual(
            expect.arrayContaining(["clampNumber", "deepClone", "GCD", "safeJSONParse"])
        );
        expect(plan.exports.find(e => e.name === "clampNumber")).toMatchObject({
            kind: "function",
            params: ["val", "min", "max", "fallback"],
            arity: 3
        });
        expect(plan.classes).toEqual([]);
    });

    it("produces identical output on repeated runs", () => {
        const once = stringifyPlan(extractFile("js/utils/utils-logic.js"));
        const twice = stringifyPlan(extractFile("js/utils/utils-logic.js"));
        expect(twice).toBe(once);
    });
});

describe("extract-module: parsing and error handling", () => {
    it("reports a parse error with the file name and location, without throwing anything else", () => {
        expect(() => parseSource("const x = {", "broken.js")).toThrow(/^broken\.js:/);
        try {
            parseSource("function (", "bad-input.js");
        } catch (err) {
            expect(err.file).toBe("bad-input.js");
            expect(err.message).toContain("bad-input.js");
            expect(err.loc).toBeDefined();
        }
    });

    it("attaches the file name when the file cannot be read", () => {
        expect(() => extractFile("does/not/exist.js")).toThrow(
            /does\/not\/exist\.js: unable to read file/
        );
    });

    it("returns an empty exports list for a module with no detectable exports", () => {
        const plan = extractModule(
            "function helper(a) { return a * 2; }\nhelper(21);\n",
            "no-exports.js"
        );
        expect(plan.exports).toEqual([]);
        expect(plan.functions.map(f => f.name)).toEqual(["helper"]);
        expect(plan.referencedGlobals).toEqual([]);
    });

    it("detects an ES module export and switches source type", () => {
        const plan = extractModule(
            "export function add(a, b) { return a + b; }\nexport default add;\n",
            "esm.js"
        );
        expect(plan.sourceType).toBe("module");
        expect(plan.exports.map(e => e.name).sort()).toEqual(["add", "default"]);
    });

    it("does not require, import or execute the analysed source", () => {
        const marker = path.join(FIXTURES, "__side_effect__.txt");
        const source = `require("fs").writeFileSync(${JSON.stringify(marker)}, "x");\nmodule.exports = {};\n`;
        extractModule(source, "hostile.js");
        expect(fs.existsSync(marker)).toBe(false);
    });
});

describe("cli helpers", () => {
    it("parses a bare file argument", () => {
        expect(cli.parseArgs(["a.js"])).toEqual({ file: "a.js", check: false, expected: null });
    });

    it("parses --check with an optional explicit expected path", () => {
        expect(cli.parseArgs(["a.js", "--check"])).toEqual({
            file: "a.js",
            check: true,
            expected: null
        });
        expect(cli.parseArgs(["a.js", "--check", "b.json"])).toEqual({
            file: "a.js",
            check: true,
            expected: "b.json"
        });
        expect(cli.parseArgs(["a.js", "--check=b.json"])).toEqual({
            file: "a.js",
            check: true,
            expected: "b.json"
        });
    });

    it("derives the default expected-plan path from the source path", () => {
        expect(cli.expectedPathFor("dir/mod.js", null)).toBe("dir/mod.plan.json");
        expect(cli.expectedPathFor("dir/mod.js", "custom.json")).toBe("custom.json");
    });

    it("rejects unknown options and missing files", () => {
        expect(() => cli.parseArgs(["--bogus"])).toThrow(/unknown option/);
        expect(() => cli.parseArgs([])).toThrow(/usage:/);
    });

    it("--check returns 0 when the committed plan matches and 1 when it differs", () => {
        expect(
            cli.main(["scripts/generate-tests/__tests__/fixtures/simple-module.js", "--check"])
        ).toBe(0);
        expect(
            cli.main([
                "scripts/generate-tests/__tests__/fixtures/simple-module.js",
                "--check",
                "scripts/generate-tests/__tests__/fixtures/class-module.plan.json"
            ])
        ).toBe(1);
    });

    it("--check reports a malformed expected plan as a clean failure", () => {
        const badPlan = path.join(FIXTURES, "__malformed__.plan.json");
        fs.writeFileSync(badPlan, "{ not valid json");
        try {
            expect(
                cli.main([
                    "scripts/generate-tests/__tests__/fixtures/simple-module.js",
                    "--check",
                    "scripts/generate-tests/__tests__/fixtures/__malformed__.plan.json"
                ])
            ).toBe(1);
        } finally {
            fs.unlinkSync(badPlan);
        }
    });

    it("--check reports a missing expected plan as a clean failure", () => {
        expect(
            cli.main([
                "scripts/generate-tests/__tests__/fixtures/simple-module.js",
                "--check",
                "scripts/generate-tests/__tests__/fixtures/__nope__.plan.json"
            ])
        ).toBe(1);
    });
});
