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

describe("GlobalTag", () => {
    let tag;
    let mockPlanet;

    beforeEach(() => {
        addChipContainer("primarychips");
        addChipContainer("morechips");
        global._ = str => str;

        mockPlanet = {
            GlobalPlanet: {
                selectSpecialTag: jest.fn(),
                refreshTagList: jest.fn()
            },
            TagsManifest: {
                1: { TagName: "Music", IsDisplayTag: "1" },
                2: { TagName: "Art", IsDisplayTag: "0" },
                3: { TagName: "Math", IsDisplayTag: "1" }
            }
        };

        tag = new GlobalTag(mockPlanet);
    });

    afterEach(() => {
        document.body.innerHTML = "";
        delete global._;
        jest.restoreAllMocks();
    });

    describe("regression tests for toTitleCase", () => {
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
            const tag2 = new GlobalTag(makePlanet("music"));
            expect(() => tag2.init({ id: 1 })).not.toThrow();
        });

        it("GlobalTag.render() sets textContent via toTitleCase", () => {
            const tag2 = new GlobalTag(makePlanet("art"));
            tag2.init({ id: 1 });
            expect(tag2.tagElement.textContent).toBe("Art");
        });

        it("display tag is appended to #primarychips", () => {
            const tag2 = new GlobalTag(makePlanet("game", "1"));
            tag2.init({ id: 1 });
            expect(document.getElementById("primarychips").children.length).toBeGreaterThan(0);
        });

        it("non-display tag is appended to #morechips", () => {
            const tag2 = new GlobalTag(makePlanet("sensors", "0"));
            tag2.init({ id: 1 });
            expect(document.getElementById("morechips").children.length).toBeGreaterThan(0);
        });

        it("special tag render() also does not throw", () => {
            const tag2 = new GlobalTag(makePlanet());
            expect(() => tag2.init({ name: "All Projects", func: jest.fn() })).not.toThrow();
        });
    });

    describe("constructor", () => {
        it("should initialize with default values", () => {
            expect(tag.Planet).toBe(mockPlanet);
            expect(tag.id).toBeNull();
            expect(tag.name).toBeNull();
            expect(tag.func).toBeNull();
            expect(tag.IsDisplayTag).toBeNull();
            expect(tag.specialTag).toBeNull();
            expect(tag.tagElement).toBeNull();
            expect(tag.selected).toBe(false);
            expect(tag.selectedClass).toBeNull();
        });

        it("should reference globalPlanet from Planet", () => {
            expect(tag.globalPlanet).toBe(mockPlanet.GlobalPlanet);
        });
    });

    describe("init with regular tag (has id)", () => {
        it("should initialize as a non-special tag", () => {
            tag.init({ id: "1" });
            expect(tag.specialTag).toBe(false);
            expect(tag.id).toBe("1");
            expect(tag.name).toBe("Music");
            expect(tag.func).toBeNull();
            expect(tag.selectedClass).toBe("selected");
        });

        it("should set IsDisplayTag based on TagsManifest", () => {
            tag.init({ id: "1" });
            expect(tag.IsDisplayTag).toBe(true);

            const tag2 = new GlobalTag(mockPlanet);
            tag2.init({ id: "2" });
            expect(tag2.IsDisplayTag).toBe(false);
        });

        it("should render into primarychips for display tags", () => {
            tag.init({ id: "1" });
            const chips = document.getElementById("primarychips");
            expect(chips.children.length).toBe(1);
        });

        it("should render into morechips for non-display tags", () => {
            tag.init({ id: "2" });
            const chips = document.getElementById("morechips");
            expect(chips.children.length).toBe(1);
        });
    });

    describe("init with special tag (no id)", () => {
        it("should initialize as a special tag", () => {
            const mockFunc = jest.fn();
            tag.init({ name: "All Projects", func: mockFunc });

            expect(tag.specialTag).toBe(true);
            expect(tag.IsDisplayTag).toBe(true);
            expect(tag.id).toBeNull();
            expect(tag.name).toBe("All Projects");
            expect(tag.func).toBe(mockFunc);
            expect(tag.selectedClass).toBe("selected-special");
        });

        it("should render special tags into primarychips", () => {
            tag.init({ name: "My Projects", func: jest.fn() });
            const chips = document.getElementById("primarychips");
            expect(chips.children.length).toBe(1);
        });
    });

    describe("render", () => {
        it("should create a div element with chipselect and cursor classes", () => {
            tag.init({ id: "1" });
            expect(tag.tagElement.classList.contains("chipselect")).toBe(true);
            expect(tag.tagElement.classList.contains("cursor")).toBe(true);
        });

        it("should set text content from translated and title-cased name", () => {
            const spy = jest.spyOn(global, "toTitleCase");
            tag.init({ id: "1" });
            expect(spy).toHaveBeenCalled();
            expect(tag.tagElement.textContent).toBe("Music");
        });

        it("should add selectedClass when tag is selected before rendering", () => {
            tag.selected = true;
            tag.selectedClass = "selected";
            tag.name = "Music";
            tag.IsDisplayTag = true;
            tag.id = "1";
            tag.specialTag = false;

            tag.render();

            expect(tag.tagElement.classList.contains("selected")).toBe(true);
        });

        it("should not add selectedClass when tag is not selected", () => {
            tag.init({ id: "1" });
            expect(tag.tagElement.classList.contains("selected")).toBe(false);
        });
    });

    describe("select", () => {
        it("should add the selectedClass and set selected to true", () => {
            tag.init({ id: "1" });
            tag.select();

            expect(tag.tagElement.classList.contains("selected")).toBe(true);
            expect(tag.selected).toBe(true);
        });
    });

    describe("unselect", () => {
        it("should remove the selectedClass and set selected to false", () => {
            tag.init({ id: "1" });
            tag.select();
            tag.unselect();

            expect(tag.tagElement.classList.contains("selected")).toBe(false);
            expect(tag.selected).toBe(false);
        });
    });

    describe("onTagClick", () => {
        it("should call selectSpecialTag when clicking an unselected special tag", () => {
            tag.init({ name: "All Projects", func: jest.fn() });
            tag.selected = false;

            tag.onTagClick();

            expect(mockPlanet.GlobalPlanet.selectSpecialTag).toHaveBeenCalledWith(tag);
        });

        it("should select a non-special tag and refresh when unselected", () => {
            tag.init({ id: "1" });
            tag.selected = false;

            tag.onTagClick();

            expect(tag.selected).toBe(true);
            expect(mockPlanet.GlobalPlanet.refreshTagList).toHaveBeenCalled();
        });

        it("should unselect a non-special tag and refresh when already selected", () => {
            tag.init({ id: "1" });
            tag.select();

            tag.onTagClick();

            expect(tag.selected).toBe(false);
            expect(mockPlanet.GlobalPlanet.refreshTagList).toHaveBeenCalled();
        });

        it("should toggle selected special tag via unselect and refresh", () => {
            tag.init({ name: "All Projects", func: jest.fn() });
            tag.select();

            tag.onTagClick();

            expect(tag.selected).toBe(false);
            expect(mockPlanet.GlobalPlanet.refreshTagList).toHaveBeenCalled();
        });
    });
});
