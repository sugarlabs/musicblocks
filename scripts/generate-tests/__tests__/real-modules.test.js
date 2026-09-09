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
 * Validates the AST extractor against real Music Blocks utility modules and a
 * set of small syntactic edge cases.
 *
 * The two target modules (js/utils/utils-logic.js and js/utils/language-utils.js)
 * have committed expected plans under __tests__/fixtures/. These act as structural
 * snapshots: any change to a module's exported surface, parameters, branch/return/
 * throw counts, dependencies, referenced globals or JSDoc changes the generated
 * plan and fails the byte-for-byte comparison here, so a regression is obvious in
 * review. The fixtures are only ever read - `--check` never rewrites them.
 */

const fs = require("fs");
const path = require("path");

const { extractModule, extractFile, stringifyPlan } = require("../extract-module");
const cli = require("../cli");

const FIXTURES = path.join(__dirname, "fixtures");

const TARGETS = [
    {
        source: "js/utils/utils-logic.js",
        expected: "scripts/generate-tests/__tests__/fixtures/utils-logic.plan.json"
    },
    {
        source: "js/utils/language-utils.js",
        expected: "scripts/generate-tests/__tests__/fixtures/language-utils.plan.json"
    }
];

describe("real modules: committed expected plans", () => {
    it.each(TARGETS)("$source matches its expected plan byte-for-byte", ({ source, expected }) => {
        const generated = stringifyPlan(extractFile(source));
        expect(generated).toBe(fs.readFileSync(expected, "utf8"));
    });

    it("plans utils-logic.js: every pure helper is an exported function", () => {
        const plan = extractFile("js/utils/utils-logic.js");
        const names = plan.exports.map(e => e.name);

        expect(plan.exports).toHaveLength(28);
        expect(plan.exports.every(e => e.kind === "function")).toBe(true);
        expect(plan.exports.every(e => e.via === "UtilsLogic")).toBe(true);
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
        expect(plan.classes).toEqual([]);

        // A representative helper with a default parameter.
        expect(plan.exports.find(e => e.name === "clampNumber")).toMatchObject({
            params: ["val", "min", "max", "fallback"],
            arity: 3
        });
        // GCD is a `function` declaration, not an arrow - still picked up.
        expect(plan.functions.find(f => f.name === "GCD")).toMatchObject({ arity: 2, branches: 0 });
        // No helper throws; the module is defensive and returns fallbacks.
        expect(plan.totals.throws).toBe(0);
    });

    it("plans language-utils.js without expanding the nested data map", () => {
        const plan = extractFile("js/utils/language-utils.js");
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
        expect(plan.functions).toEqual([
            {
                name: "normalizeLanguageCode",
                params: ["language"],
                arity: 1,
                hasRestParam: false,
                isAsync: false,
                isGenerator: false,
                returns: 3,
                throws: 0,
                branches: 4
            }
        ]);
        expect(plan.jsdoc.map(d => d.target)).toEqual([
            "LANGUAGE_CODE_TO_LOCALE",
            "normalizeLanguageCode"
        ]);
    });
});

describe("real modules: --check verifies without writing", () => {
    it.each(TARGETS)("--check passes for $source", ({ source, expected }) => {
        expect(cli.main([source, "--check", expected])).toBe(0);
    });

    it("--check fails when the derived plan does not match the expected file", () => {
        // language-utils.js checked against utils-logic's plan: a real mismatch.
        expect(
            cli.main([
                "js/utils/language-utils.js",
                "--check",
                "scripts/generate-tests/__tests__/fixtures/utils-logic.plan.json"
            ])
        ).toBe(1);
    });

    it("--check leaves the expected fixture untouched on mismatch", () => {
        const target = path.join(FIXTURES, "language-utils.plan.json");
        const before = fs.readFileSync(target, "utf8");
        cli.main([
            "js/utils/utils-logic.js",
            "--check",
            "scripts/generate-tests/__tests__/fixtures/language-utils.plan.json"
        ]);
        expect(fs.readFileSync(target, "utf8")).toBe(before);
    });
});

describe("real modules: deterministic output", () => {
    it.each([...TARGETS.map(t => t.source), "js/utils/musicutils.js", "js/utils/mathutils.js"])(
        "%s produces identical JSON across repeated runs",
        source => {
            const runs = Array.from({ length: 4 }, () => stringifyPlan(extractFile(source)));
            expect(new Set(runs).size).toBe(1);
        }
    );

    it("does not embed absolute paths or environment data in a plan", () => {
        const text = stringifyPlan(extractFile("js/utils/utils-logic.js"));
        expect(text).not.toContain(process.cwd());
        expect(text).not.toMatch(/\/(Users|home)\//);
        expect(JSON.parse(text).file).toBe("js/utils/utils-logic.js");
    });
});

describe("edge cases: export shapes", () => {
    it("reports an empty export set for a module that exports nothing", () => {
        const plan = extractModule("const x = 1;\nfunction unused() {\n    return x;\n}\n", "e.js");
        expect(plan.exports).toEqual([]);
        expect(plan.functions.map(f => f.name)).toEqual(["unused"]);
    });

    it("lists every member of a multi-export namespace object", () => {
        const plan = extractModule(
            "function a() {}\nfunction b() {}\nfunction c() {}\nmodule.exports = { a, b, c };\n",
            "multi.js"
        );
        expect(plan.exports.map(e => e.name)).toEqual(["a", "b", "c"]);
        expect(plan.exports.every(e => e.kind === "function")).toBe(true);
    });

    it("describes a class with several methods, an accessor and a static method", () => {
        const plan = extractModule(
            [
                "class Widget {",
                "    constructor(x) { this.x = x; }",
                "    render() { return this.x; }",
                "    get width() { return this.x; }",
                "    static blank() { return new Widget(0); }",
                "}",
                "module.exports = { Widget };"
            ].join("\n"),
            "widget.js"
        );
        const widget = plan.classes.find(c => c.name === "Widget");
        expect(
            widget.methods.map(m => `${m.isStatic ? "static " : ""}${m.kind} ${m.name}`)
        ).toEqual(["constructor constructor", "method render", "get width", "static method blank"]);
        expect(plan.exports).toEqual([
            { name: "Widget", kind: "class", superClass: null, methods: widget.methods, via: null }
        ]);
    });
});

describe("edge cases: structural counts", () => {
    it("attributes branches, returns and throws to the directly enclosing function", () => {
        const plan = extractModule(
            [
                "function outer(a) {",
                "    if (a) {",
                "        return function inner(b) {",
                "            if (b) {",
                "                if (b > 1) { throw new Error('too big'); }",
                "            }",
                "            return b;",
                "        };",
                "    }",
                "    return null;",
                "}"
            ].join("\n"),
            "nested.js"
        );
        // Only `outer` is a top-level function; `inner` is not listed.
        expect(plan.functions.map(f => f.name)).toEqual(["outer"]);
        expect(plan.functions[0]).toMatchObject({ branches: 1, returns: 2, throws: 0 });
        // The whole-file totals do see inside `inner`.
        expect(plan.totals).toEqual({ branches: 3, returns: 3, throws: 1 });
    });

    it("counts conditional expressions as branches", () => {
        const plan = extractModule(
            "function sign(n) {\n    return n > 0 ? 'pos' : n < 0 ? 'neg' : 'zero';\n}\n",
            "sign.js"
        );
        expect(plan.functions[0]).toMatchObject({ branches: 2, returns: 1 });
    });

    it("counts every throw statement in a guard function", () => {
        const plan = extractModule(
            [
                "function guard(x) {",
                "    if (x == null) { throw new Error('missing'); }",
                "    if (x < 0) { throw new RangeError('negative'); }",
                "    return x;",
                "}"
            ].join("\n"),
            "guard.js"
        );
        expect(plan.functions[0]).toMatchObject({ throws: 2, branches: 2, returns: 1 });
        expect(plan.totals.throws).toBe(2);
    });
});

describe("edge cases: dependencies and JSDoc", () => {
    it("collects and sorts require() dependency strings", () => {
        const plan = extractModule(
            [
                "const p = require('path');",
                "const fs = require('fs');",
                "module.exports = {",
                "    go() {",
                "        return fs.existsSync(p.join('.'));",
                "    }",
                "};"
            ].join("\n"),
            "deps.js"
        );
        expect(plan.dependencies).toEqual(["fs", "path"]);
    });

    it("splits a leading JSDoc block into a description and tags", () => {
        const plan = extractModule(
            [
                "/**",
                " * Doubles a number.",
                " *",
                " * @param {number} n - the input.",
                " * @returns {number} twice n.",
                " */",
                "function double(n) {",
                "    return n * 2;",
                "}"
            ].join("\n"),
            "doc.js"
        );
        expect(plan.jsdoc).toEqual([
            {
                target: "double",
                description: "Doubles a number.",
                tags: [
                    { tag: "param", text: "{number} n - the input." },
                    { tag: "returns", text: "{number} twice n." }
                ]
            }
        ]);
    });

    it("does not attach a JSDoc block separated from a declaration by a blank line", () => {
        const plan = extractModule(
            "/**\n * Not attached to anything.\n */\n\n\nfunction detached() {}\n",
            "detached.js"
        );
        expect(plan.jsdoc).toEqual([]);
    });
});

describe("edge cases: malformed syntax", () => {
    it.each([
        ["an unterminated object literal", "const x = {"],
        ["a bare assignment with no target", "const = 5;"],
        ["a function with no parameter list close", "function broken( {"]
    ])("reports %s as an error carrying the file name, without side effects", (_label, src) => {
        expect(() => extractModule(src, "malformed.js")).toThrow(/^malformed\.js:/);
    });
});
