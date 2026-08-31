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
const {
    buildGenerationRequest,
    normalizePlan,
    summarizeModule,
    defaultTestPath,
    DEFAULT_INSTRUCTIONS,
    DEFAULT_TEST_REQUIREMENTS,
    DEFAULT_CONVENTIONS
} = require("../generation-request");

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
        }
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
    jsdoc: [{ target: "clamp", description: "Clamps a number.", tags: [] }],
    totals: { branches: 4, returns: 3, throws: 1 }
};

describe("buildGenerationRequest: structure", () => {
    it("carries the plan, module summary and the three instruction blocks", () => {
        const request = buildGenerationRequest(functionPlan);
        expect(Object.keys(request).sort()).toEqual([
            "conventions",
            "instructions",
            "module",
            "plan",
            "targetTestPath",
            "testRequirements"
        ]);
        expect(request.instructions).toEqual(DEFAULT_INSTRUCTIONS);
        expect(request.testRequirements).toEqual(DEFAULT_TEST_REQUIREMENTS);
        expect(request.conventions).toEqual(DEFAULT_CONVENTIONS);
    });

    it("summarises the module from the plan", () => {
        const request = buildGenerationRequest(functionPlan);
        expect(request.module).toEqual({
            path: "js/utils/example.js",
            sourceType: "script",
            exportCount: 1,
            exportNames: ["clamp"],
            hasClasses: false,
            hasThrows: true,
            hasBranches: true,
            dependencyCount: 1
        });
    });

    it("derives the conventional test path but lets the caller override it", () => {
        expect(buildGenerationRequest(functionPlan).targetTestPath).toBe(
            "js/utils/__tests__/example.test.js"
        );
        expect(
            buildGenerationRequest(functionPlan, { targetTestPath: "custom/where.test.js" })
                .targetTestPath
        ).toBe("custom/where.test.js");
    });

    it("lets the caller replace any instruction block", () => {
        const request = buildGenerationRequest(functionPlan, {
            instructions: ["only this"],
            testRequirements: ["and this"],
            conventions: ["plus this"]
        });
        expect(request.instructions).toEqual(["only this"]);
        expect(request.testRequirements).toEqual(["and this"]);
        expect(request.conventions).toEqual(["plus this"]);
    });

    it("ignores an empty or non-string override and keeps the defaults", () => {
        const request = buildGenerationRequest(functionPlan, {
            instructions: [],
            conventions: [1, 2, 3]
        });
        expect(request.instructions).toEqual(DEFAULT_INSTRUCTIONS);
        expect(request.conventions).toEqual(DEFAULT_CONVENTIONS);
    });
});

describe("buildGenerationRequest: determinism", () => {
    it("returns byte-for-byte identical JSON for the same plan", () => {
        const a = JSON.stringify(buildGenerationRequest(functionPlan));
        const b = JSON.stringify(buildGenerationRequest(functionPlan));
        expect(a).toBe(b);
    });

    it("does not mutate the plan it is given", () => {
        const frozen = JSON.stringify(functionPlan);
        buildGenerationRequest(functionPlan);
        expect(JSON.stringify(functionPlan)).toBe(frozen);
    });

    it("sorts export names regardless of plan order", () => {
        const shuffled = {
            ...functionPlan,
            exports: [
                { name: "zeta", kind: "function", params: [], arity: 0 },
                { name: "alpha", kind: "function", params: [], arity: 0 }
            ]
        };
        expect(summarizeModule(normalizePlan(shuffled)).exportNames).toEqual(["alpha", "zeta"]);
    });
});

describe("buildGenerationRequest: partial and malformed plans", () => {
    it("throws a TypeError when the plan is not an object", () => {
        expect(() => buildGenerationRequest(null)).toThrow(TypeError);
        expect(() => buildGenerationRequest("nope")).toThrow(TypeError);
        expect(() => buildGenerationRequest([])).toThrow(TypeError);
    });

    it("fills in every missing list on an incomplete plan", () => {
        const request = buildGenerationRequest({ file: "x.js" });
        expect(request.plan).toEqual({
            file: "x.js",
            sourceType: "script",
            exports: [],
            functions: [],
            classes: [],
            dependencies: [],
            referencedGlobals: [],
            jsdoc: [],
            totals: { branches: 0, returns: 0, throws: 0 }
        });
        expect(request.module.exportCount).toBe(0);
        expect(request.module.hasThrows).toBe(false);
    });

    it("recovers a usable path even when file is absent", () => {
        expect(buildGenerationRequest({}).module.path).toBe("<unknown>");
        expect(defaultTestPath("")).toBe("<unknown>.test.js");
    });

    it("coerces non-numeric totals to zero", () => {
        const plan = normalizePlan({ file: "x.js", totals: { branches: "lots", throws: NaN } });
        expect(plan.totals).toEqual({ branches: 0, returns: 0, throws: 0 });
    });
});

describe("buildGenerationRequest: class and empty-export plans", () => {
    it("marks a plan that only exports classes", () => {
        const plan = {
            file: "js/thing.js",
            classes: [{ name: "Thing", superClass: null, methods: [] }],
            exports: [{ name: "Thing", kind: "class", superClass: null, methods: [], via: null }],
            totals: { branches: 0, returns: 0, throws: 0 }
        };
        const request = buildGenerationRequest(plan);
        expect(request.module.hasClasses).toBe(true);
        expect(request.module.exportNames).toEqual(["Thing"]);
    });

    it("handles a plan with no exports at all", () => {
        const request = buildGenerationRequest({ file: "js/side-effects.js", functions: [] });
        expect(request.module.exportCount).toBe(0);
        expect(request.module.exportNames).toEqual([]);
    });
});

describe("buildGenerationRequest: real Music Blocks modules", () => {
    it.each([
        "js/utils/utils-logic.js",
        "js/utils/language-utils.js",
        "js/utils/musicutils.js",
        "js/utils/mathutils.js"
    ])("builds a request for %s straight from the extractor", modulePath => {
        const request = buildGenerationRequest(extractFile(modulePath));
        expect(request.module.path).toBe(modulePath);
        expect(request.plan.file).toBe(modulePath);
        expect(request.instructions.length).toBeGreaterThan(0);
        // the summary agrees with the plan it was derived from
        expect(request.module.exportCount).toBe(request.plan.exports.length);
        expect(request.module.hasThrows).toBe(request.plan.totals.throws > 0);
    });

    it("lists utils-logic exports sorted in the summary", () => {
        const request = buildGenerationRequest(extractFile("js/utils/utils-logic.js"));
        const names = request.module.exportNames;
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
        expect(names).toEqual(expect.arrayContaining(["clampNumber", "deepClone", "GCD"]));
    });
});
