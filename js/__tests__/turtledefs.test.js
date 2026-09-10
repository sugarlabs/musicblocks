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
            "PITCHPREVIEWHELPBUTTON",
            "EMPTYTRASHCONFIRMBUTTON",
            "COPYBUTTON",
            "EXTRACTBUTTON"
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

    describe("getLanguagePreference & restricted storage (#7005)", () => {
        afterEach(() => {
            delete localStorage.languagePreference;
        });

        const withThrowingLocalStorage = fn => {
            const originalLocalStorage = global.localStorage;
            Object.defineProperty(global, "localStorage", {
                get: () => {
                    throw new Error("SecurityError: The operation is insecure.");
                },
                configurable: true
            });
            try {
                fn();
            } finally {
                Object.defineProperty(global, "localStorage", {
                    value: originalLocalStorage,
                    configurable: true,
                    writable: true
                });
            }
        };

        it("should return localStorage.languagePreference when defined", () => {
            localStorage.languagePreference = "ja";
            expect(mb.getLanguagePreference()).toBe("ja");
        });

        it("should fallback to navigator.language when localStorage.languagePreference is undefined", () => {
            delete localStorage.languagePreference;
            expect(mb.getLanguagePreference()).toBe(navigator.language);
        });

        it("should safely fallback to navigator.language when localStorage access throws SecurityError", () => {
            withThrowingLocalStorage(() => {
                expect(() => mb.getLanguagePreference()).not.toThrow();
                expect(mb.getLanguagePreference()).toBe(navigator.language);
            });
        });

        it("createDefaultStack should initialize default stack when localStorage access throws SecurityError", () => {
            withThrowingLocalStorage(() => {
                expect(() => mb.createDefaultStack()).not.toThrow();
                expect(window.DATAOBJS).toBeDefined();
                expect(window.DATAOBJS.length).toBeGreaterThan(0);
                expect(window.DATAOBJS[10]).toEqual([10, ["solfege", { value: "sol" }], 0, 0, [9]]);
            });
        });

        it("createHelpContent should initialize help content when localStorage access throws SecurityError", () => {
            withThrowingLocalStorage(() => {
                expect(() => mb.createHelpContent({})).not.toThrow();
                expect(window.HELPCONTENT).toBeDefined();
                expect(window.HELPCONTENT.length).toBeGreaterThan(0);
                expect(window.HELPCONTENT[0][2]).toBe(
                    `data:image/svg+xml;base64,${window.btoa(base64Encode(mb.LOGODEFAULT))}`
                );
            });
        });

        it("createDefaultStack should execute and produce Japanese stack when language is ja", () => {
            localStorage.languagePreference = "ja";
            expect(() => mb.createDefaultStack()).not.toThrow();
            expect(window.DATAOBJS).toBeDefined();
            expect(window.DATAOBJS[10]).toEqual([10, ["solfege", { value: "do" }], 0, 0, [9]]);
        });

        it("createHelpContent should select Japanese logo when language is ja", () => {
            localStorage.languagePreference = "ja";
            expect(() => mb.createHelpContent({})).not.toThrow();
            expect(window.HELPCONTENT).toBeDefined();
            expect(window.HELPCONTENT[0][2]).toBe(
                `data:image/svg+xml;base64,${window.btoa(base64Encode(mb.LOGOJA))}`
            );
        });

        it("should preserve language suffixes without truncation (e.g. ja-kana, zh-CN, en-US)", () => {
            localStorage.languagePreference = "ja-kana";
            expect(mb.getLanguagePreference()).toBe("ja-kana");

            localStorage.languagePreference = "zh-CN";
            expect(mb.getLanguagePreference()).toBe("zh-CN");

            localStorage.languagePreference = "en-US";
            expect(mb.getLanguagePreference()).toBe("en-US");
        });
    });
});
