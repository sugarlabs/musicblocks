/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

global._ = jest.fn(str => str);
global._THIS_IS_TURTLE_BLOCKS_ = true;
const {
    createDefaultStack,
    LOGOJA1,
    NUMBERBLOCKDEFAULT,
    DEFAULTPALETTE,
    TITLESTRING
} = require("../turtledefs");

global.GUIDEURL = "guide url";
global.RUNBUTTON = "RUNBUTTON";
global.STOPBUTTON = "STOPBUTTON";
global.HELPTURTLEBUTTON = "HELPTURTLEBUTTON";
global.LANGUAGEBUTTON = "LANGUAGEBUTTON";

if (GUIDEURL === "guide url") {
    GUIDEURL = "https://github.com/sugarlabs/turtleblocksjs/tree/master/guide/README.md";
}

describe("turtledefs.js", () => {
    test("LOGOJA1 should be properly initialized", () => {
        expect(LOGOJA1).toBeDefined();
        expect(typeof LOGOJA1).toBe("string");
    });

    test("NUMBERBLOCKDEFAULT should be initialized correctly", () => {
        expect(NUMBERBLOCKDEFAULT).toBeDefined();
        expect(NUMBERBLOCKDEFAULT).toBe(100);
    });

    test("DEFAULTPALETTE should have correct value", () => {
        expect(DEFAULTPALETTE).toBe("turtle");
    });

    test("GUIDEURL should default to the correct URL", () => {
        expect(GUIDEURL).toBe(
            "https://github.com/sugarlabs/turtleblocksjs/tree/master/guide/README.md"
        );
    });

    test("TITLESTRING should be defined", () => {
        expect(TITLESTRING).toBeDefined();
    });

    test("createDefaultStack function should be callable", () => {
        expect(typeof createDefaultStack).toBe("function");
    });
});
describe("Music Blocks mode (_THIS_IS_TURTLE_BLOCKS_ = false)", () => {
    let mb;

    beforeAll(() => {
        const buttons = [
            "ADVANCEDBUTTON",
            "BIGGERBUTTON",
            "CARTESIANBUTTON",
            "CLEARBUTTON",
            "COLLAPSEBLOCKSBUTTON",
            "COLLAPSEBUTTON",
            "GOHOMEBUTTON",
            "HELPBUTTON",
            "HIDEBLOCKSBUTTON",
            "LANGUAGEBUTTON",
            "LOADBUTTON",
            "MENUBUTTON",
            "NEWBUTTON",
            "PLANETBUTTON",
            "PLUGINSDELETEBUTTON",
            "RESTORETRASHBUTTON",
            "RHYTHMPALETTEICON",
            "RUNBUTTON",
            "SAVEBUTTON",
            "SCROLLUNLOCKBUTTON",
            "TABBUTTON_LIGHT",
            "TABBUTTON_DARK",
            "SLOWBUTTON",
            "SMALLERBUTTON",
            "STATSBUTTON",
            "STEPBUTTON",
            "STOPTURTLEBUTTON",
            "WRAPTURTLEBUTTON",
            "MOUSEPALETTEICON",
            "FULLSCREENBUTTON",
            "PLUGINSBUTTON",
            "OPENMERGEBUTTON",
            "PITCHPREVIEWBUTTON",
            "JAVASCRIPTBUTTON",
            "RECORDHELPBUTTON",
            "DARKMODEBUTTON",
            "SELECTHELPBUTTON",
            "BLOCKMENUBUTTON",
            "CANVASMENUBUTTON",
            "RHYTHMPALETTEHELPICON",
            "PITCHPREVIEWHELPBUTTON"
        ];
        buttons.forEach(b => {
            global[b] = b;
        });

        global._ = jest.fn(str => str);
        global._THIS_IS_TURTLE_BLOCKS_ = false;
        global._THIS_IS_MUSIC_BLOCKS_ = true;
        global.window = { btoa: jest.fn(s => s) };
        global.localStorage = { languagePreference: undefined };
        global.navigator = { language: "en" };
        global.base64Encode = jest.fn(s => s);

        jest.resetModules();
        mb = require("../turtledefs");
    });

    it("TITLESTRING should be Music Blocks", () => {
        expect(mb.TITLESTRING).toBe("Music Blocks");
    });

    it("NUMBERBLOCKDEFAULT should be 4", () => {
        expect(mb.NUMBERBLOCKDEFAULT).toBe(4);
    });

    it("DEFAULTPALETTE should be rhythm", () => {
        expect(mb.DEFAULTPALETTE).toBe("rhythm");
    });

    it("LOGOJA1 should be defined as SVG string", () => {
        expect(mb.LOGOJA1).toBeDefined();
        expect(typeof mb.LOGOJA1).toBe("string");
        expect(mb.LOGOJA1).toContain("svg");
    });

    it("createDefaultStack should be callable", () => {
        expect(typeof mb.createDefaultStack).toBe("function");
    });

    it("createDefaultStack should not throw when called", () => {
        expect(() => mb.createDefaultStack()).not.toThrow();
    });
});

describe("Tab Navigation help icon follows the theme", () => {
    let mb, activity;

    /** Find the entry createHelpContent pushed for Tab Navigation. */
    const tabEntry = () => mb.HELPCONTENT.find(entry => entry[0] === "Tab Navigation");

    /** Resolve that entry's icon and name the artwork constant it chose. */
    const chosenIcon = () => atob(tabEntry()[2]().replace("data:image/svg+xml;base64,", ""));

    beforeAll(() => {
        // Every artwork constant createHelpContent reaches for; each stands in
        // for itself so an entry's data URI names the icon it chose.
        [
            "ADVANCEDBUTTON",
            "BIGGERBUTTON",
            "BLOCKMENUBUTTON",
            "CANVASMENUBUTTON",
            "CARTESIANBUTTON",
            "CLEARBUTTON",
            "COLLAPSEBLOCKSBUTTON",
            "COLLAPSEBUTTON",
            "COPYBUTTON",
            "DARKMODEBUTTON",
            "EMPTYTRASHCONFIRMBUTTON",
            "EXTRACTBUTTON",
            "FULLSCREENBUTTON",
            "GOHOMEBUTTON",
            "HELPBUTTON",
            "HIDEBLOCKSBUTTON",
            "JAVASCRIPTBUTTON",
            "LANGUAGEBUTTON",
            "LOADBUTTON",
            "LOGO",
            "MENUBUTTON",
            "MOUSEPALETTEICON",
            "NEWBUTTON",
            "OPENMERGEBUTTON",
            "PITCHPREVIEWHELPBUTTON",
            "PLANETBUTTON",
            "PLUGINSBUTTON",
            "PLUGINSDELETEBUTTON",
            "RECORDHELPBUTTON",
            "RESTORETRASHBUTTON",
            "RHYTHMPALETTEHELPICON",
            "RUNBUTTON",
            "SAVEBUTTON",
            "SCROLLUNLOCKBUTTON",
            "SELECTHELPBUTTON",
            "SLOWBUTTON",
            "SMALLERBUTTON",
            "STATSBUTTON",
            "STEPBUTTON",
            "STOPTURTLEBUTTON",
            "WRAPTURTLEBUTTON"
        ].forEach(b => {
            global[b] = b;
        });
        global._ = jest.fn(str => str);
        global.base64Encode = jest.fn(str => str);
        global._THIS_IS_TURTLE_BLOCKS_ = false;
        global._THIS_IS_MUSIC_BLOCKS_ = true;
        global.getSystemThemePreference = jest.fn(() => "light");
        jest.resetModules();
        mb = require("../turtledefs");
    });

    beforeEach(() => {
        activity = { beginnerMode: false, storage: {} };
        mb.createHelpContent(activity);
    });

    test("the entry exists and defers its icon to display time", () => {
        const entry = tabEntry();
        expect(entry).toBeDefined();
        // Not a baked data URI: the theme is not knowable when the help content
        // is built, so the icon has to be resolved when the page is shown.
        expect(typeof entry[2]).toBe("function");
    });

    test("uses the dark icon under the dark theme", () => {
        activity.storage.themePreference = "dark";
        expect(chosenIcon()).toBe("TABBUTTON_DARK");
    });

    test("uses the dark icon under highcontrast, which is black-backgrounded", () => {
        activity.storage.themePreference = "highcontrast";
        expect(chosenIcon()).toBe("TABBUTTON_DARK");
    });

    test("uses the light icon under the light theme", () => {
        activity.storage.themePreference = "light";
        expect(chosenIcon()).toBe("TABBUTTON_LIGHT");
    });

    test("falls back to the system preference when none is stored", () => {
        getSystemThemePreference.mockReturnValue("dark");
        expect(chosenIcon()).toBe("TABBUTTON_DARK");
        getSystemThemePreference.mockReturnValue("light");
        expect(chosenIcon()).toBe("TABBUTTON_LIGHT");
    });

    test("re-reads the theme on each call, so switching while open takes effect", () => {
        activity.storage.themePreference = "light";
        expect(chosenIcon()).toBe("TABBUTTON_LIGHT");
        activity.storage.themePreference = "dark";
        expect(chosenIcon()).toBe("TABBUTTON_DARK");
    });
});
