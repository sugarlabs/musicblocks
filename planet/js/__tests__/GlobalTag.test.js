/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks Contributors
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
 * Regression tests for:
 *   ReferenceError: toTitleCase is not defined
 *
 * After PR #7302/#7303/#7304 moved toTitleCase from js/utils/utils.js into
 * js/utils/utils-logic.js, GlobalTag.render() started throwing a ReferenceError
 * because planet/index.html did not load utils-logic.js before GlobalTag.js.
 *
 * Fix: planet/index.html now loads ../js/utils/utils-logic.js before
 * ../js/utils/utils.js so that Object.assign(window, UtilsLogic) runs first,
 * putting toTitleCase on window before GlobalTag.js is parsed.
 *
 * These tests mirror that load order in Jest: require utils-logic, assign its
 * exports to global, then require GlobalTag — exactly as the browser does.
 */

// Replicate planet/index.html load order after the fix:
//  1. utils-logic.js → Object.assign(window, UtilsLogic) makes toTitleCase global
//  2. GlobalTag.js   → uses toTitleCase as a global
const UtilsLogic = require("../../../js/utils/utils-logic");
Object.assign(global, UtilsLogic);

const GlobalTag = require("../GlobalTag");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addChipContainer(id) {
    const el = document.createElement("div");
    el.id = id;
    document.body.appendChild(el);
    return el;
}

function makePlanet(tagName = "music", isDisplay = "1") {
    return {
        TagsManifest: { 1: { TagName: tagName, IsDisplayTag: isDisplay } },
        GlobalPlanet: {
            selectSpecialTag: jest.fn(),
            refreshTagList: jest.fn()
        }
    };
}

// ---------------------------------------------------------------------------
// Regression: toTitleCase must be reachable when GlobalTag.render() runs
// ---------------------------------------------------------------------------

describe("GlobalTag – regression: toTitleCase dependency after utils modularization", () => {
    beforeEach(() => {
        addChipContainer("primarychips");
        addChipContainer("morechips");
        global._ = str => str; // identity stub for translation helper
    });

    afterEach(() => {
        document.body.innerHTML = "";
        delete global._;
    });

    it("toTitleCase is defined on global after loading utils-logic", () => {
        expect(typeof global.toTitleCase).toBe("function");
    });

    it("toTitleCase capitalises the first letter of a string", () => {
        expect(global.toTitleCase("hello")).toBe("Hello");
    });

    it("toTitleCase returns undefined for non-string input", () => {
        expect(global.toTitleCase(123)).toBeUndefined();
    });

    it("toTitleCase returns empty string for empty input", () => {
        expect(global.toTitleCase("")).toBe("");
    });

    it("GlobalTag.render() does not throw ReferenceError for toTitleCase", () => {
        const tag = new GlobalTag(makePlanet("music"));
        expect(() => tag.init({ id: 1 })).not.toThrow();
    });

    it("GlobalTag.render() sets textContent via toTitleCase", () => {
        const tag = new GlobalTag(makePlanet("art"));
        tag.init({ id: 1 });
        // _ is identity stub, toTitleCase("art") === "Art"
        expect(tag.tagElement.textContent).toBe("Art");
    });

    it("display tag is appended to #primarychips", () => {
        const tag = new GlobalTag(makePlanet("game", "1"));
        tag.init({ id: 1 });
        expect(document.getElementById("primarychips").children.length).toBeGreaterThan(0);
    });

    it("non-display tag is appended to #morechips", () => {
        const tag = new GlobalTag(makePlanet("sensors", "0"));
        tag.init({ id: 1 });
        expect(document.getElementById("morechips").children.length).toBeGreaterThan(0);
    });

    it("special tag render() also does not throw", () => {
        const tag = new GlobalTag(makePlanet());
        expect(() => tag.init({ name: "All Projects", func: jest.fn() })).not.toThrow();
    });
});
