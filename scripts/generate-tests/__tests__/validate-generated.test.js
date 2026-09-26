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

const { extractFile } = require("../extract-module");
const { validateGeneratedTest } = require("../validate-generated");

const utilsLogicPlan = () => extractFile("js/utils/utils-logic.js");
const languageUtilsPlan = () => extractFile("js/utils/language-utils.js");

const FIXTURES = path.join(__dirname, "fixtures", "generated");
const fixture = name => fs.readFileSync(path.join(FIXTURES, name), "utf8");

/**
 * Wraps a test body around a real require of utils-logic so a candidate only has
 * to vary the interesting part.
 */
const withUtilsLogic = body =>
    `const { clampNumber, GCD } = require("../utils-logic");\n\n${body}\n`;

describe("validateGeneratedTest: a good candidate", () => {
    it("accepts a legitimate Music Blocks-style Jest test", () => {
        const result = validateGeneratedTest(fixture("valid-utils-logic.txt"), {
            plan: utilsLogicPlan()
        });
        expect(result).toMatchObject({ valid: true, errors: [] });
    });

    it("accepts a multi-describe test that exercises several behaviours", () => {
        const result = validateGeneratedTest(fixture("valid-language-utils.txt"), {
            plan: languageUtilsPlan()
        });
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual([]);
    });

    it("accepts multiple it() cases in one generated file", () => {
        const source = withUtilsLogic(`
describe("clampNumber", () => {
    it("keeps an in-range value", () => {
        expect(clampNumber(5, 0, 10)).toBe(5);
    });
    it("clamps an over-range value", () => {
        expect(clampNumber(99, 0, 10)).toBe(10);
    });
    it("clamps an under-range value", () => {
        expect(clampNumber(-1, 0, 10)).toBe(0);
    });
});`);
        expect(validateGeneratedTest(source, { plan: utilsLogicPlan() }).valid).toBe(true);
    });

    it("is deterministic for the same input", () => {
        const a = validateGeneratedTest(fixture("valid-utils-logic.txt"), {
            plan: utilsLogicPlan()
        });
        const b = validateGeneratedTest(fixture("valid-utils-logic.txt"), {
            plan: utilsLogicPlan()
        });
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
});

describe("validateGeneratedTest: structural rejections", () => {
    it("rejects empty source", () => {
        const result = validateGeneratedTest("   \n  ", { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/empty/);
    });

    it("rejects a syntax error", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(
                'describe("x", () => { it("y", () => { expect(clampNumber(1,0,2).toBe(1); }); });'
            ),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/does not parse/);
    });

    it("rejects a file with no it()/test() cases", () => {
        const result = validateGeneratedTest(withUtilsLogic('describe("clampNumber", () => {});'), {
            plan: utilsLogicPlan()
        });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/no it\(\)\/test\(\) cases/);
    });
});

describe("validateGeneratedTest: the real module under test", () => {
    it("rejects a candidate that never requires the module", () => {
        const source = `
describe("clampNumber", () => {
    it("does something", () => {
        expect(1 + 1).toBe(2);
    });
});
`;
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/does not import the module under test/);
    });

    it("rejects a candidate that mocks the module under test", () => {
        const source =
            'jest.mock("../utils-logic");\n' +
            withUtilsLogic(`
describe("clampNumber", () => {
    it("uses the mock", () => {
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`);
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/mocks the module under test/);
    });

    it("rejects a candidate that also imports an unrelated production module", () => {
        const source =
            'const other = require("../../logo.js");\n' +
            withUtilsLogic(`
describe("clampNumber", () => {
    it("still asserts something", () => {
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`);
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(
            /imports "\.\.\/\.\.\/logo\.js", which is not the module under test/
        );
    });

    it.each(["../utils-logic", "../utils-logic.js", "./../utils-logic", "./../utils-logic.js"])(
        "accepts the equivalent relative require %p",
        spec => {
            const source =
                `const { clampNumber } = require("${spec}");\n` +
                'describe("clampNumber", () => {\n' +
                '    it("clamps", () => { expect(clampNumber(9, 0, 3)).toBe(3); });\n' +
                "});\n";
            expect(validateGeneratedTest(source, { plan: utilsLogicPlan() }).valid).toBe(true);
        }
    );

    it("does not accept a look-alike module whose basename only shares a prefix", () => {
        const source =
            'const x = require("../utils-logic-extra");\n' +
            'describe("x", () => { it("y", () => { expect(x.f(1)).toBe(1); }); });\n';
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/does not import the module under test/);
    });

    it("rejects the correct module plus an unrelated production import", () => {
        const source =
            withUtilsLogic(`
describe("clampNumber", () => {
    it("clamps", () => { expect(clampNumber(9, 0, 3)).toBe(3); });
});`) + 'const helper = require("../language-utils");\n';
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(
            /imports "\.\.\/language-utils", which is not the module under test/
        );
    });

    it("does not accept a bare (package-style) specifier as the module import", () => {
        const source =
            'const { clampNumber } = require("utils-logic");\n' +
            'describe("x", () => { it("y", () => { expect(clampNumber(9, 0, 3)).toBe(3); }); });\n';
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/does not import the module under test/);
    });

    it("rejects an arbitrary npm package import (P1: bare specifiers are not trusted)", () => {
        const source =
            withUtilsLogic(`
describe("clampNumber", () => {
    it("clamps", () => { expect(clampNumber(9, 0, 3)).toBe(3); });
});`) + 'const rimraf = require("rimraf");\n';
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/imports the package "rimraf"/);
    });

    it("rejects a Node core module that is not on any allow-list", () => {
        const source =
            withUtilsLogic(`
describe("clampNumber", () => {
    it("clamps", () => { expect(clampNumber(9, 0, 3)).toBe(3); });
});`) + 'const os = require("os");\n';
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/imports the package "os"/);
    });

    it("permits a package named in options.allowedModules", () => {
        const source =
            withUtilsLogic(`
describe("clampNumber", () => {
    it("clamps", () => { expect(clampNumber(9, 0, 3)).toBe(3); });
});`) + 'const { EOL } = require("os");\n';
        const result = validateGeneratedTest(source, {
            plan: utilsLogicPlan(),
            allowedModules: ["os"]
        });
        expect(result.valid).toBe(true);
    });

    it("still rejects fs / child_process even when allow-listed", () => {
        const source =
            'const fs = require("fs");\nconst cp = require("child_process");\n' +
            withUtilsLogic(`
describe("clampNumber", () => {
    it("clamps", () => { expect(clampNumber(9, 0, 3)).toBe(3); });
});`);
        const result = validateGeneratedTest(source, {
            plan: utilsLogicPlan(),
            allowedModules: ["fs", "child_process"]
        });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/filesystem module/);
        expect(result.errors.join(" ")).toMatch(/spawn processes or threads/);
    });
});

describe("validateGeneratedTest: assertion quality", () => {
    it("rejects a candidate with no expect() calls", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(
                'describe("clampNumber", () => { it("runs", () => { clampNumber(1, 0, 2); }); });'
            ),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/no expect\(\) assertions/);
    });

    it("rejects expect(true).toBe(true) style fake assertions", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("pretends to test", () => {
        expect(true).toBe(true);
        expect(1).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/no meaningful assertions/);
    });

    it("rejects a test that only checks the import exists", () => {
        const source = `
const target = require("../utils-logic");

describe("utils-logic", () => {
    it("is importable", () => {
        expect(target).toBeDefined();
    });
});
`;
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/no meaningful assertions/);
    });

    it("rejects a snapshot-only test", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("matches the snapshot", () => {
        expect(clampNumber(5, 0, 10)).toMatchSnapshot();
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/snapshot assertions/);
    });

    it("allows a snapshot alongside a concrete assertion", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("clamps and is stable", () => {
        expect(clampNumber(5, 0, 10)).toBe(5);
        expect(clampNumber(5, 0, 10)).toMatchSnapshot();
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });

    it.each([
        ["toEqual on a computed object", "expect(deepClone({ a: 1 })).toEqual({ a: 1 });"],
        ["toContain on a computed array", 'expect(toArray("x")).toContain("x");'],
        ["toBeTruthy on a call result", 'expect(isValidHex("#fff")).toBeTruthy();'],
        ["toThrow on a wrapped call", 'expect(() => safeJSONParse("{", undefined)).not.toThrow();'],
        ["toBeCloseTo on arithmetic", "expect(GCD(8, 12)).toBeCloseTo(4);"]
    ])("treats a real value passed to %s as a meaningful assertion", (_label, line) => {
        const source =
            'const { deepClone, toArray, isValidHex, safeJSONParse, GCD } = require("../utils-logic");\n' +
            `describe("meaningful", () => { it("asserts", () => { ${line} }); });\n`;
        const result = validateGeneratedTest(source, { plan: utilsLogicPlan() });
        expect(result.valid).toBe(true);
    });

    it.each(["expect(5).toEqual(5);", 'expect("x").toStrictEqual("x");', "expect(0).toBeFalsy();"])(
        "still rejects the literal-vs-literal assertion %p",
        line => {
            const result = validateGeneratedTest(
                withUtilsLogic(`describe("x", () => { it("y", () => { ${line} }); });`),
                { plan: utilsLogicPlan() }
            );
            expect(result.valid).toBe(false);
            expect(result.errors.join(" ")).toMatch(/no meaningful assertions/);
        }
    );
});

describe("validateGeneratedTest: private API", () => {
    it("rejects access to a _-prefixed member", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("internal", () => {
    it("reaches inside", () => {
        expect(GCD._reduce(4, 2)).toBe(2);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/private, "_"-prefixed members/);
    });

    it("rejects destructuring a _-prefixed member", () => {
        const result = validateGeneratedTest(
            'const { _secret } = require("../utils-logic");\n' +
                'describe("x", () => { it("y", () => { expect(_secret(1)).toBe(1); }); });\n',
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/private, "_"-prefixed members/);
    });

    it('rejects computed (string-literal) private access, e.g. target["_reduce"]', () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("internal", () => {
    it("reaches inside with a computed key", () => {
        expect(GCD["_reduce"](4, 2)).toBe(2);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/private, "_"-prefixed members: _reduce/);
    });
});

describe("validateGeneratedTest: filesystem and production safety", () => {
    it("rejects requiring fs", () => {
        const result = validateGeneratedTest(
            'const fs = require("fs");\n' +
                withUtilsLogic(`
describe("clampNumber", () => {
    it("writes a file", () => {
        fs.writeFileSync("x.txt", "boom");
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/filesystem module/);
        expect(result.errors.join(" ")).toMatch(/unsafe filesystem operation/);
    });

    it("rejects an unsafe write even when fs is aliased", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("writes via a helper", () => {
        writeFileSync("x", "y");
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan(), allowedGlobals: ["writeFileSync"] }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/unsafe filesystem operation/);
    });

    it('rejects a computed (string-literal) unsafe fs call, e.g. fs["writeFileSync"]', () => {
        const result = validateGeneratedTest(
            'const nodeFs = require("fs");\n' +
                withUtilsLogic(`
describe("clampNumber", () => {
    it("writes through a computed member", () => {
        nodeFs["writeFileSync"]("x", "y");
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/unsafe filesystem operation: writeFileSync/);
    });

    it("rejects spawning a child process", () => {
        const result = validateGeneratedTest(
            'const cp = require("child_process");\n' +
                withUtilsLogic(
                    'describe("x", () => { it("y", () => { cp.execSync("ls"); expect(clampNumber(1,0,2)).toBe(1); }); });'
                ),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/spawn processes/);
    });

    it("does NOT treat a same-named method on an arbitrary receiver as an fs op", () => {
        // `remove`, `move`, `rm`, `cp` are all in UNSAFE_FS_CALLS but also common
        // method names. Only real fs receivers should trip the check.
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("cleans up a DOM node", () => {
        const element = document.createElement("div");
        document.body.appendChild(element);
        element.remove();
        const seq = [1, 2, 3];
        seq.copyWithin(0, 1);
        expect(clampNumber(seq.length, 0, 10)).toBe(3);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
        expect(result.errors.join(" ")).not.toMatch(/filesystem/);
    });

    it("does NOT flag a locally declared function that shares an fs name", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
function remove(list, i) {
    return list.filter((_, k) => k !== i);
}

describe("clampNumber", () => {
    it("uses a local helper", () => {
        expect(remove([1, 2, 3], 1)).toEqual([1, 3]);
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });

    it('still flags a real fs receiver, incl. destructured off require("fs")', () => {
        const result = validateGeneratedTest(
            'const { rmSync } = require("fs");\n' +
                withUtilsLogic(`
describe("clampNumber", () => {
    it("deletes a path", () => {
        rmSync("/tmp/x", { recursive: true });
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/unsafe filesystem operation: rmSync/);
    });

    it("rejects a forbidden static ESM import alongside a valid require of the target", () => {
        const result = validateGeneratedTest(
            'import fs from "fs";\n' +
                withUtilsLogic(`
describe("clampNumber", () => {
    it("still imports the target too", () => {
        fs.writeFileSync("x", "y");
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/filesystem module \("fs"\)/);
        expect(result.errors.join(" ")).toMatch(/unsafe filesystem operation/);
    });

    it("rejects a dynamic import() of a process module", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("dynamically imports child_process", async () => {
        const cp = await import("child_process");
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/spawn processes or threads/);
    });

    it("rejects an unrelated static ESM import", () => {
        const result = validateGeneratedTest(
            'import { normalizeLanguageCode } from "../language-utils";\n' +
                withUtilsLogic(`
describe("clampNumber", () => {
    it("imports another module via ESM", () => {
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(
            /imports "\.\.\/language-utils", which is not the module under test/
        );
    });

    it("accepts a static ESM import of the target module itself", () => {
        const result = validateGeneratedTest(
            'import { clampNumber } from "../utils-logic";\n' +
                'describe("clampNumber", () => {\n' +
                '    it("clamps", () => { expect(clampNumber(9, 0, 3)).toBe(3); });\n' +
                "});\n",
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });

    it("rejects a candidate that assigns module.exports", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
module.exports = { clampNumber };

describe("clampNumber", () => {
    it("clamps", () => {
        expect(clampNumber(9, 0, 3)).toBe(3);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/module\.exports/);
    });

    it("rejects a candidate that assigns exports.foo", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
exports.helper = clampNumber;

describe("clampNumber", () => {
    it("clamps", () => {
        expect(clampNumber(9, 0, 3)).toBe(3);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/module\.exports/);
    });
});

describe("validateGeneratedTest: determinism of the test itself", () => {
    it("rejects Math.random with no control", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("uses randomness", () => {
        expect(clampNumber(Math.random(), 0, 1)).toBeLessThanOrEqual(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/Math\.random without deterministic control/);
    });

    it("accepts Math.random when it is spied on", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("uses controlled randomness", () => {
        jest.spyOn(Math, "random").mockReturnValue(0.5);
        expect(clampNumber(Math.random(), 0, 1)).toBe(0.5);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });

    it("rejects a bare setTimeout without fake timers", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("waits", () => {
        setTimeout(() => {}, 10);
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/useFakeTimers/);
    });

    it("accepts setTimeout with jest.useFakeTimers()", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("waits deterministically", () => {
        jest.useFakeTimers();
        setTimeout(() => {}, 10);
        jest.runAllTimers();
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });

    it("warns (does not reject) on an uncontrolled Date.now", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("stamps a time", () => {
        const t = Date.now();
        expect(clampNumber(t, 0, t)).toBe(t);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
        expect(result.warnings.join(" ")).toMatch(/Date\.now/);
    });
});

describe("validateGeneratedTest: undeclared globals and duplicate titles", () => {
    it("rejects an undeclared global from another subsystem", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("leans on activity", () => {
        expect(clampNumber(activity.foo, 0, 10)).toBe(0);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/undeclared globals: activity/);
    });

    it("permits a global listed in the plan's referencedGlobals (tier 2)", () => {
        // utils-logic references `document`; a test may use it too.
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("touches the dom", () => {
        const el = document.createElement("div");
        expect(clampNumber(el.childNodes.length, 0, 10)).toBe(0);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });

    it("caller-supplied allowedGlobals (tier 3) permits only the named identifier", () => {
        const body = `
describe("clampNumber", () => {
    it("uses two project globals", () => {
        expect(clampNumber(platformColor.x, 0, wheelnav.y)).toBe(0);
    });
});`;
        // platformColor is allow-listed; wheelnav is not -> still rejected, and
        // only wheelnav is named.
        const partial = validateGeneratedTest(withUtilsLogic(body), {
            plan: utilsLogicPlan(),
            allowedGlobals: ["platformColor"]
        });
        expect(partial.valid).toBe(false);
        expect(partial.errors.join(" ")).toMatch(/undeclared globals: wheelnav/);
        expect(partial.errors.join(" ")).not.toMatch(/platformColor/);

        // both allow-listed -> passes
        const both = validateGeneratedTest(withUtilsLogic(body), {
            plan: utilsLogicPlan(),
            allowedGlobals: ["platformColor", "wheelnav"]
        });
        expect(both.valid).toBe(true);
    });

    it("allowedGlobals cannot switch off another rule (aliased fs write still caught)", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("tries to sneak a write past the global check", () => {
        writeFileSync("x", "y");
        expect(clampNumber(1, 0, 2)).toBe(1);
    });
});`),
            { plan: utilsLogicPlan(), allowedGlobals: ["writeFileSync"] }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/unsafe filesystem operation/);
        // the global check itself no longer fires for the now-allowed name
        expect(result.errors.join(" ")).not.toMatch(/undeclared globals/);
    });

    it("rejects duplicate test titles in the same describe", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("clamps", () => { expect(clampNumber(9, 0, 3)).toBe(3); });
    it("clamps", () => { expect(clampNumber(-9, 0, 3)).toBe(0); });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/duplicate test titles/);
    });

    it("allows the same it() title under different describe blocks", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("handles the boundary", () => { expect(clampNumber(3, 0, 3)).toBe(3); });
});
describe("GCD", () => {
    it("handles the boundary", () => { expect(GCD(3, 3)).toBe(3); });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });

    it("rejects a title that collides with one already in the suite", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("clamps an over-range value", () => { expect(clampNumber(9, 0, 3)).toBe(3); });
});`),
            {
                plan: utilsLogicPlan(),
                existingTitles: ["clampNumber › clamps an over-range value"]
            }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/already used elsewhere/);
    });
});

describe("validateGeneratedTest: parameterized (it.each) tests", () => {
    it("recognises an it.each(table)(...) title and accepts a real assertion", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it.each([
        [5, 0, 10, 5],
        [42, 0, 10, 10],
        [-7, 0, 10, 0]
    ])("clamps %p into [%p, %p]", (v, lo, hi, want) => {
        expect(clampNumber(v, lo, hi)).toBe(want);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });

    it("flows it.each titles through the no-test-case check", () => {
        // an it.each with no assertion in its body must still count as a test
        // case, so this fails on 'no meaningful assertions', not 'no it()/test()'
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it.each([[1], [2]])("case %p", n => {
        clampNumber(n, 0, 5);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/no expect\(\) assertions/);
        expect(result.errors.join(" ")).not.toMatch(/no it\(\)\/test\(\) cases/);
    });

    it("detects a duplicate title between a plain it() and an it.each()", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it("clamps", () => { expect(clampNumber(9, 0, 3)).toBe(3); });
    it.each([[1]])("clamps", n => { expect(clampNumber(n, 0, 3)).toBe(1); });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(false);
        expect(result.errors.join(" ")).toMatch(/duplicate test titles/);
    });

    it("recognises describe.each and it.concurrent.each", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe.each([[0], [1]])("clampNumber batch %p", offset => {
    it.concurrent.each([[3], [4]])("clamps with offset %p", v => {
        expect(clampNumber(v + offset, 0, 20)).toBeGreaterThanOrEqual(0);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });

    it("recognises the it.each`table` tagged-template form", () => {
        const result = validateGeneratedTest(
            withUtilsLogic(`
describe("clampNumber", () => {
    it.each\`
        value | want
        \${5}  | \${5}
        \${99} | \${10}
    \`("clamps $value to $want", ({ value, want }) => {
        expect(clampNumber(value, 0, 10)).toBe(want);
    });
});`),
            { plan: utilsLogicPlan() }
        );
        expect(result.valid).toBe(true);
    });
});

describe("validateGeneratedTest: without a plan", () => {
    it("still checks syntax and assertion quality but warns about the skipped checks", () => {
        const result = validateGeneratedTest(
            'describe("x", () => { it("y", () => { expect(2 + 2).toBe(4); }); });\n'
        );
        expect(result.valid).toBe(true);
        expect(result.warnings.join(" ")).toMatch(/no module path supplied/);
    });
});
