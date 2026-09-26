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

const { extractFile } = require("../extract-module");
const { buildGenerationRequest } = require("../generation-request");
const { buildPrompt, buildPromptFromPlan } = require("../prompt-builder");

const functionPlan = {
    file: "js/utils/example.js",
    sourceType: "script",
    exports: [
        {
            name: "clamp",
            kind: "function",
            params: ["value", "min", "max"],
            arity: 1,
            hasRestParam: false,
            via: "Example"
        },
        { name: "TABLE", kind: "object", via: "Example" }
    ],
    functions: [
        {
            name: "clamp",
            params: ["value", "min", "max"],
            arity: 1,
            hasRestParam: false,
            isAsync: false,
            isGenerator: false,
            returns: 3,
            throws: 1,
            branches: 4
        }
    ],
    classes: [],
    dependencies: ["path"],
    referencedGlobals: ["Math", "Number"],
    jsdoc: [
        {
            target: "clamp",
            description: "Clamps a number to a range.",
            tags: [
                { tag: "param", text: "{number} value - the input." },
                { tag: "returns", text: "{number} the clamped value." }
            ]
        }
    ],
    totals: { branches: 4, returns: 3, throws: 1 }
};

const classPlan = {
    file: "js/counter.js",
    sourceType: "script",
    exports: [
        {
            name: "Counter",
            kind: "class",
            superClass: "Base",
            methods: [
                {
                    name: "constructor",
                    kind: "constructor",
                    isStatic: false,
                    params: ["start"],
                    arity: 1
                },
                { name: "tick", kind: "method", isStatic: false, params: ["by"], arity: 1 },
                { name: "value", kind: "get", isStatic: false, params: [], arity: 0 }
            ],
            via: null
        }
    ],
    functions: [],
    classes: [
        {
            name: "Counter",
            superClass: "Base",
            methods: [
                {
                    name: "constructor",
                    kind: "constructor",
                    isStatic: false,
                    params: ["start"],
                    arity: 1
                },
                { name: "tick", kind: "method", isStatic: false, params: ["by"], arity: 1 },
                { name: "value", kind: "get", isStatic: false, params: [], arity: 0 }
            ]
        }
    ],
    dependencies: [],
    referencedGlobals: ["RangeError"],
    jsdoc: [],
    totals: { branches: 2, returns: 3, throws: 1 }
};

describe("buildPrompt: content", () => {
    const prompt = buildPromptFromPlan(functionPlan);

    it("names the target module and its module system", () => {
        expect(prompt).toContain("Source path: js/utils/example.js");
        expect(prompt).toContain("Module system: script (CommonJS)");
        expect(prompt).toContain("Suggested test path: js/utils/__tests__/example.test.js");
    });

    it("lists exported functions with their parameters and objects by kind", () => {
        expect(prompt).toContain("- clamp(value, min, max) - function, arity 1");
        expect(prompt).toContain("- TABLE - object");
    });

    it("includes per-function branch/return/throw counts", () => {
        expect(prompt).toContain("- clamp(value, min, max): 4 branch(es), 3 return(s), 1 throw(s)");
    });

    it("includes dependencies and referenced globals", () => {
        expect(prompt).toMatch(/## Dependencies \(require \/ import\)\n- path/);
        expect(prompt).toMatch(/## Referenced globals\n- Math\n- Number/);
    });

    it("includes JSDoc descriptions and tags", () => {
        expect(prompt).toContain("### clamp");
        expect(prompt).toContain("Clamps a number to a range.");
        expect(prompt).toContain("- @param {number} value - the input.");
        expect(prompt).toContain("- @returns {number} the clamped value.");
    });

    it("carries the behaviour-oriented instructions, not 'test every node'", () => {
        expect(prompt).toContain("Test observable behaviour through the module's public exports");
        expect(prompt).toContain("Do not mock the module under test");
        expect(prompt).toContain("Do not try to generate a test for every AST node");
        expect(prompt).toContain("never emit code that edits files on disk");
        expect(prompt).not.toMatch(/generate a test for every (node|export)/i);
    });

    it("states the project conventions", () => {
        expect(prompt).toContain("The Jest test environment is jsdom");
        expect(prompt).toContain("Tests live in a __tests__/ directory");
    });

    it("ends with exactly one trailing newline", () => {
        expect(prompt.endsWith("\n")).toBe(true);
        expect(prompt.endsWith("\n\n")).toBe(false);
    });
});

describe("buildPrompt: classes, throws and branches", () => {
    const prompt = buildPromptFromPlan(classPlan);

    it("renders a class, its superclass and its members", () => {
        expect(prompt).toContain("- Counter extends Base");
        expect(prompt).toContain("  - constructor(start)");
        expect(prompt).toContain("  - tick(by)");
        expect(prompt).toContain("  - get value()");
    });

    it("reports whole-file control flow", () => {
        expect(prompt).toContain("- Branch points: 2");
        expect(prompt).toContain("- Throw statements: 1");
    });

    it("keeps the class-testing requirement", () => {
        expect(prompt).toContain("construct real instances and assert on observable state");
    });
});

describe("buildPrompt: empty and malformed plans", () => {
    it("handles a plan with no exports", () => {
        const prompt = buildPromptFromPlan({ file: "js/nothing.js" });
        expect(prompt).toContain("(no exports detected");
        expect(prompt).toMatch(/## Dependencies \(require \/ import\)\n- \(none\)/);
        expect(prompt).toMatch(/## JSDoc\n- \(none\)/);
    });

    it("still builds from a partial plan object", () => {
        const prompt = buildPromptFromPlan({
            file: "x.js",
            exports: [{ name: "a", kind: "value" }]
        });
        expect(prompt).toContain("- a - value");
    });

    it("throws a TypeError when handed a non-object request", () => {
        expect(() => buildPrompt(null)).toThrow(TypeError);
    });
});

describe("buildPrompt: determinism and ordering", () => {
    it("produces identical output on repeated runs", () => {
        expect(buildPromptFromPlan(functionPlan)).toBe(buildPromptFromPlan(functionPlan));
    });

    it("does not depend on the key order of the request object", () => {
        const request = buildGenerationRequest(functionPlan);
        const reordered = {
            conventions: request.conventions,
            plan: request.plan,
            testRequirements: request.testRequirements,
            module: request.module,
            targetTestPath: request.targetTestPath,
            instructions: request.instructions
        };
        expect(buildPrompt(reordered)).toBe(buildPrompt(request));
    });

    it("keeps plan lists in the order the deterministic extractor emitted them", () => {
        const prompt = buildPromptFromPlan(functionPlan);
        expect(prompt.indexOf("- Math")).toBeLessThan(prompt.indexOf("- Number"));
    });
});

describe("buildPrompt: real Music Blocks modules", () => {
    it.each(["js/utils/utils-logic.js", "js/utils/language-utils.js"])(
        "renders a stable prompt for %s",
        modulePath => {
            const plan = extractFile(modulePath);
            const once = buildPromptFromPlan(plan);
            const twice = buildPrompt(buildGenerationRequest(plan));
            expect(twice).toBe(once);
            expect(once).toContain(`Source path: ${modulePath}`);
            expect(once).not.toMatch(/\/(Users|home)\//); // no absolute paths leak in
        }
    );

    it("mentions each real utils-logic export by name in the prompt", () => {
        const plan = extractFile("js/utils/utils-logic.js");
        const prompt = buildPromptFromPlan(plan);
        for (const entry of plan.exports) {
            expect(prompt).toContain(entry.name);
        }
    });
});
