/**
 * @license
 * MusicBlocks
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

const ALL_BUTTON_GLOBALS = [
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
    "MENUBUTTON",
    "MOUSEPALETTEICON",
    "NEWBUTTON",
    "OPENMERGEBUTTON",
    "PITCHPREVIEWBUTTON",
    "PITCHPREVIEWHELPBUTTON",
    "PLANETBUTTON",
    "PLUGINSBUTTON",
    "PLUGINSDELETEBUTTON",
    "RECORDHELPBUTTON",
    "RESTORETRASHBUTTON",
    "RHYTHMPALETTEHELPICON",
    "RHYTHMPALETTEICON",
    "RUNBUTTON",
    "SAVEBUTTON",
    "SCROLLUNLOCKBUTTON",
    "SELECTHELPBUTTON",
    "SLOWBUTTON",
    "SMALLERBUTTON",
    "STATSBUTTON",
    "STEPBUTTON",
    "STOPTURTLEBUTTON",
    "TABBUTTON_DARK",
    "TABBUTTON_LIGHT",
    "WRAPTURTLEBUTTON"
];

const setupGlobalEnvironment = ({ isTurtle = false, translationFn = str => str } = {}) => {
    ALL_BUTTON_GLOBALS.forEach(btn => {
        global[btn] = btn;
    });
    global._ = jest.fn(translationFn);
    global._THIS_IS_TURTLE_BLOCKS_ = isTurtle;
    global._THIS_IS_MUSIC_BLOCKS_ = !isTurtle;
    global.window = {
        btoa: str => Buffer.from(str, "binary").toString("base64")
    };
    global.localStorage = { languagePreference: undefined };
    Object.defineProperty(global, "navigator", {
        value: { language: "en" },
        configurable: true,
        writable: true
    });
    global.screen = { width: 1200 };
    global.base64Encode = jest.fn(s => s);
    global.getSystemThemePreference = jest.fn(() => "light");

    jest.resetModules();
    return require("../turtledefs");
};

const decodeDataUri = uri => {
    const base64Str = uri.replace(/^data:image\/svg\+xml;base64,/, "");
    return Buffer.from(base64Str, "base64").toString("binary");
};

describe("turtledefs.js - Toolbar button name validators", () => {
    let mb;

    beforeEach(() => {
        mb = setupGlobalEnvironment({ isTurtle: false });
    });

    describe("getMainToolbarButtonNames", () => {
        const expectedMainButtons = [
            "popdown-palette",
            "run",
            "step",
            "step-music",
            "stop-turtle",
            "hard-stop-turtle",
            "palette",
            "help",
            "sugarizer-stop",
            "beginner",
            "advanced",
            "planet",
            "planet-disabled",
            "open",
            "save",
            "new"
        ];

        test.each(expectedMainButtons)("returns true for valid button name: '%s'", name => {
            expect(mb.getMainToolbarButtonNames(name)).toBe(true);
        });

        test("returns false for auxiliary toolbar button names", () => {
            const auxButtons = [
                "paste-disabled",
                "Cartesian",
                "compile",
                "utility",
                "restore-trash",
                "hide-blocks",
                "collapse-blocks",
                "go-home"
            ];
            auxButtons.forEach(name => {
                expect(mb.getMainToolbarButtonNames(name)).toBe(false);
            });
        });

        test("returns false for arbitrary and empty strings", () => {
            expect(mb.getMainToolbarButtonNames("")).toBe(false);
            expect(mb.getMainToolbarButtonNames("not-a-button")).toBe(false);
            expect(mb.getMainToolbarButtonNames("RUN")).toBe(false);
            expect(mb.getMainToolbarButtonNames("Save")).toBe(false);
            expect(mb.getMainToolbarButtonNames("   run   ")).toBe(false);
        });

        test("safely handles non-string and missing inputs without throwing", () => {
            expect(mb.getMainToolbarButtonNames(undefined)).toBe(false);
            expect(mb.getMainToolbarButtonNames(null)).toBe(false);
            expect(mb.getMainToolbarButtonNames(123)).toBe(false);
            expect(mb.getMainToolbarButtonNames({})).toBe(false);
            expect(mb.getMainToolbarButtonNames([])).toBe(false);
            expect(mb.getMainToolbarButtonNames(true)).toBe(false);
            expect(mb.getMainToolbarButtonNames(Symbol("run"))).toBe(false);
        });
    });

    describe("getAuxToolbarButtonNames", () => {
        const expectedAuxButtons = [
            "paste-disabled",
            "Cartesian",
            "compile",
            "utility",
            "restore-trash",
            "hide-blocks",
            "collapse-blocks",
            "go-home"
        ];

        test.each(expectedAuxButtons)("returns true for valid aux button name: '%s'", name => {
            expect(mb.getAuxToolbarButtonNames(name)).toBe(true);
        });

        test("returns false for main toolbar button names", () => {
            const mainButtons = ["run", "step", "help", "planet", "save", "new"];
            mainButtons.forEach(name => {
                expect(mb.getAuxToolbarButtonNames(name)).toBe(false);
            });
        });

        test("returns false for case mismatches and unknown strings", () => {
            expect(mb.getAuxToolbarButtonNames("cartesian")).toBe(false);
            expect(mb.getAuxToolbarButtonNames("CARTESIAN")).toBe(false);
            expect(mb.getAuxToolbarButtonNames("unknown-aux")).toBe(false);
            expect(mb.getAuxToolbarButtonNames("")).toBe(false);
            expect(mb.getAuxToolbarButtonNames("compile-btn")).toBe(false);
        });

        test("safely handles non-string and missing inputs without throwing", () => {
            expect(mb.getAuxToolbarButtonNames(undefined)).toBe(false);
            expect(mb.getAuxToolbarButtonNames(null)).toBe(false);
            expect(mb.getAuxToolbarButtonNames(0)).toBe(false);
            expect(mb.getAuxToolbarButtonNames({})).toBe(false);
            expect(mb.getAuxToolbarButtonNames([])).toBe(false);
            expect(mb.getAuxToolbarButtonNames(false)).toBe(false);
            expect(mb.getAuxToolbarButtonNames(Symbol("compile"))).toBe(false);
        });
    });
});

describe("turtledefs.js - Music Blocks configuration and palette grouping", () => {
    let mb;

    beforeEach(() => {
        mb = setupGlobalEnvironment({ isTurtle: false });
    });

    test("exports correct core constants in Music Blocks mode", () => {
        expect(mb.TITLESTRING).toBe("Music Blocks");
        expect(mb.NUMBERBLOCKDEFAULT).toBe(4);
        expect(mb.DEFAULTPALETTE).toBe("rhythm");
        expect(mb.GUIDEURL).toBe("Docs/guide/index.html");
        expect(typeof mb.VERSION).toBe("string");
        expect(mb.VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    test("BUILTINPALETTES contains exactly 25 built-in palettes in expected order", () => {
        const expected = [
            "search",
            "rhythm",
            "meter",
            "pitch",
            "intervals",
            "tone",
            "ornament",
            "volume",
            "drum",
            "flow",
            "action",
            "boxes",
            "widgets",
            "graphics",
            "pen",
            "number",
            "boolean",
            "media",
            "sensors",
            "heap",
            "dictionary",
            "ensemble",
            "extras",
            "program",
            "myblocks"
        ];
        expect(mb.BUILTINPALETTES).toEqual(expected);
        expect(mb.BUILTINPALETTES).toHaveLength(25);
        expect(new Set(mb.BUILTINPALETTES).size).toBe(25);
    });

    test("BUILTINPALETTESFORL23N maps each palette through translation function", () => {
        expect(mb.BUILTINPALETTESFORL23N).toHaveLength(25);
        expect(mb.BUILTINPALETTESFORL23N[0]).toBe("search");
        expect(mb.BUILTINPALETTESFORL23N[1]).toBe("rhythm");
        expect(mb.BUILTINPALETTESFORL23N[23]).toBe("program");
        expect(mb.BUILTINPALETTESFORL23N[24]).toBe("my blocks");
    });

    test("MULTIPALETTES arranges palettes into 3 specific categorized groups (Music, Logic, Artwork)", () => {
        expect(mb.MULTIPALETTES).toHaveLength(3);

        const musicGroup = mb.MULTIPALETTES[0];
        const logicGroup = mb.MULTIPALETTES[1];
        const artworkGroup = mb.MULTIPALETTES[2];

        expect(musicGroup).toEqual([
            "rhythm",
            "meter",
            "pitch",
            "intervals",
            "tone",
            "ornament",
            "volume",
            "drum",
            "widgets"
        ]);
        expect(logicGroup).toEqual([
            "flow",
            "action",
            "boxes",
            "number",
            "boolean",
            "heap",
            "dictionary",
            "extras",
            "program",
            "myblocks"
        ]);
        expect(artworkGroup).toEqual(["graphics", "pen", "media", "sensors", "ensemble"]);

        const allMultiPalettes = [...musicGroup, ...logicGroup, ...artworkGroup];
        allMultiPalettes.forEach(palette => {
            expect(mb.BUILTINPALETTES).toContain(palette);
        });
    });

    test("SKIPPALETTES skips only advanced programming palettes in Music Blocks beginner mode", () => {
        expect(mb.SKIPPALETTES).toEqual(["heap", "dictionary", "extras", "program"]);
        expect(mb.SKIPPALETTES).toHaveLength(4);

        expect(mb.SKIPPALETTES).not.toContain("rhythm");
        expect(mb.SKIPPALETTES).not.toContain("pitch");
        expect(mb.SKIPPALETTES).not.toContain("flow");
        expect(mb.SKIPPALETTES).not.toContain("widgets");
    });

    test("MULTIPALETTEICONS and MULTIPALETTENAMES align with Music Blocks group ordering", () => {
        expect(mb.MULTIPALETTEICONS).toEqual(["music", "logic", "artwork"]);
        expect(mb.MULTIPALETTENAMES).toEqual(["music", "logic", "artwork"]);
    });

    test("preserves custom localized GUIDEURL when translated", () => {
        const localized = setupGlobalEnvironment({
            isTurtle: false,
            translationFn: str => (str === "guide url" ? "Docs/guide/index.ja.html" : str)
        });
        expect(localized.GUIDEURL).toBe("Docs/guide/index.ja.html");
    });
});

describe("turtledefs.js - Turtle Blocks mode configuration and palette grouping", () => {
    let tb;

    beforeEach(() => {
        tb = setupGlobalEnvironment({ isTurtle: true });
    });

    test("exports correct core constants in Turtle Blocks mode", () => {
        expect(tb.TITLESTRING).toBe("Turtle Blocks");
        expect(tb.NUMBERBLOCKDEFAULT).toBe(100);
        expect(tb.DEFAULTPALETTE).toBe("turtle");
        expect(tb.GUIDEURL).toBe("TurtleDocs/guide/index.html");
        expect(tb.LOGODEFAULT).toContain("<svg");
        expect(tb.LOGOJA).toBe(tb.LOGODEFAULT);
        expect(tb.LOGOJA1).toBe(tb.LOGODEFAULT);
    });

    test("MULTIPALETTES puts Artwork first in Turtle Blocks mode", () => {
        expect(tb.MULTIPALETTES).toHaveLength(3);

        const artworkGroup = tb.MULTIPALETTES[0];
        const logicGroup = tb.MULTIPALETTES[1];
        const musicGroup = tb.MULTIPALETTES[2];

        expect(artworkGroup).toEqual(["graphics", "pen", "media", "sensors", "ensemble"]);
        expect(logicGroup).toEqual([
            "flow",
            "action",
            "boxes",
            "number",
            "boolean",
            "heap",
            "dictionary",
            "extras",
            "program",
            "myblocks"
        ]);
        expect(musicGroup).toEqual([
            "rhythm",
            "meter",
            "pitch",
            "intervals",
            "tone",
            "ornament",
            "volume",
            "drum",
            "widgets"
        ]);
    });

    test("SKIPPALETTES skips both advanced logic and all music palettes in Turtle Blocks beginner mode", () => {
        expect(tb.SKIPPALETTES).toEqual([
            "heap",
            "dictionary",
            "extras",
            "program",
            "meter",
            "pitch",
            "intervals",
            "tone",
            "ornament",
            "volume",
            "drum",
            "widgets"
        ]);
        expect(tb.SKIPPALETTES).toHaveLength(12);
    });

    test("MULTIPALETTEICONS and MULTIPALETTENAMES put artwork first in Turtle Blocks", () => {
        expect(tb.MULTIPALETTEICONS).toEqual(["artwork", "logic", "music"]);
        expect(tb.MULTIPALETTENAMES).toEqual(["artwork", "logic", "music"]);
    });

    test("preserves custom localized GUIDEURL in Turtle Blocks mode", () => {
        const localized = setupGlobalEnvironment({
            isTurtle: true,
            translationFn: str => (str === "guide url" ? "TurtleDocs/guide/index.es.html" : str)
        });
        expect(localized.GUIDEURL).toBe("TurtleDocs/guide/index.es.html");
    });
});

describe("turtledefs.js - Language Preference & Fallback Engine (getLanguagePreference)", () => {
    let mb;

    beforeEach(() => {
        mb = setupGlobalEnvironment({ isTurtle: false });
    });

    test("returns localStorage.languagePreference when defined", () => {
        localStorage.languagePreference = "ja";
        expect(mb.getLanguagePreference()).toBe("ja");
    });

    test("falls back to navigator.language when localStorage is undefined", () => {
        delete localStorage.languagePreference;
        Object.defineProperty(global.navigator, "language", {
            value: "fr",
            configurable: true
        });
        expect(mb.getLanguagePreference()).toBe("fr");
    });

    test("safely catches SecurityError in restricted environments and falls back to navigator", () => {
        const originalStorage = global.localStorage;
        Object.defineProperty(global, "localStorage", {
            get: () => {
                throw new Error("SecurityError: The operation is insecure.");
            },
            configurable: true
        });

        try {
            Object.defineProperty(global.navigator, "language", {
                value: "es",
                configurable: true
            });
            expect(() => mb.getLanguagePreference()).not.toThrow();
            expect(mb.getLanguagePreference()).toBe("es");
        } finally {
            Object.defineProperty(global, "localStorage", {
                value: originalStorage,
                configurable: true,
                writable: true
            });
        }
    });

    test("returns undefined when both localStorage throws and navigator is undefined", () => {
        const originalStorage = global.localStorage;
        const originalNavigator = global.navigator;
        Object.defineProperty(global, "localStorage", {
            get: () => {
                throw new Error("SecurityError");
            },
            configurable: true
        });
        delete global.navigator;

        try {
            expect(mb.getLanguagePreference()).toBeUndefined();
        } finally {
            Object.defineProperty(global, "localStorage", {
                value: originalStorage,
                configurable: true,
                writable: true
            });
            global.navigator = originalNavigator;
        }
    });

    test("preserves language suffixes without truncation", () => {
        localStorage.languagePreference = "ja-kana";
        expect(mb.getLanguagePreference()).toBe("ja-kana");

        localStorage.languagePreference = "zh-CN";
        expect(mb.getLanguagePreference()).toBe("zh-CN");

        localStorage.languagePreference = "en-US";
        expect(mb.getLanguagePreference()).toBe("en-US");

        localStorage.languagePreference = "pt-BR";
        expect(mb.getLanguagePreference()).toBe("pt-BR");
    });
});

describe("turtledefs.js - Japanese Locale Normalization & Matching (isJapanese)", () => {
    let mb;

    beforeEach(() => {
        mb = setupGlobalEnvironment({ isTurtle: false });
    });

    test("recognizes standard and regional Japanese locale tags regardless of case", () => {
        const japaneseLocales = [
            "ja",
            "JA",
            "Ja",
            "ja-JP",
            "ja-jp",
            "JA-JP",
            "ja_JP",
            "ja_jp",
            "JA_JP",
            "ja-kana",
            "JA-KANA",
            "ja-Latn",
            "  ja-JP  ",
            "  ja  "
        ];
        japaneseLocales.forEach(tag => {
            expect(mb.isJapanese(tag)).toBe(true);
        });
    });

    test("rejects non-Japanese locales and partial substring matches", () => {
        const nonJapaneseLocales = [
            "en",
            "en-US",
            "fr",
            "de",
            "es",
            "zh-CN",
            "it",
            "j",
            "japanese",
            "japan",
            "jam"
        ];
        nonJapaneseLocales.forEach(tag => {
            expect(mb.isJapanese(tag)).toBe(false);
        });
    });

    test("returns false for non-string types safely", () => {
        const invalidTypes = [null, undefined, 123, NaN, true, false, {}, [], () => {}];
        invalidTypes.forEach(val => {
            expect(mb.isJapanese(val)).toBe(false);
        });
    });
});

describe("turtledefs.js - Default Stack Generator Engine (createDefaultStack)", () => {
    describe("Turtle Blocks Default Stack", () => {
        let tb;

        beforeEach(() => {
            tb = setupGlobalEnvironment({ isTurtle: true });
            global.screen = { width: 1500 };
            tb.createDefaultStack();
        });

        test("generates exact 8-block stack with geometric square algorithm", () => {
            expect(tb.DATAOBJS).toHaveLength(8);
            expect(window.DATAOBJS).toBe(tb.DATAOBJS);

            // Block 0: start block positioned at screen.width / 3 = 500
            expect(tb.DATAOBJS[0]).toEqual([0, "start", 500, 100, [null, 1, null]]);

            // Block 1: repeat block with 4 connections
            expect(tb.DATAOBJS[1]).toEqual([1, "repeat", 0, 0, [0, 2, 4, 3]]);

            // Block 2: number 4 connected to repeat
            expect(tb.DATAOBJS[2]).toEqual([2, ["number", { value: 4 }], 0, 0, [1]]);

            // Block 3: hidden clamp end connected to repeat
            expect(tb.DATAOBJS[3]).toEqual([3, "hidden", 0, 0, [1, null]]);

            // Block 4: forward block connected to repeat, number(100), and right
            expect(tb.DATAOBJS[4]).toEqual([4, "forward", 0, 0, [1, 5, 6]]);

            // Block 5: number 100 connected to forward
            expect(tb.DATAOBJS[5]).toEqual([5, ["number", { value: 100 }], 0, 0, [4]]);

            // Block 6: right block connected to forward and number(90)
            expect(tb.DATAOBJS[6]).toEqual([6, "right", 0, 0, [4, 7, null]]);

            // Block 7: number 90 connected to right
            expect(tb.DATAOBJS[7]).toEqual([7, ["number", { value: 90 }], 0, 0, [6]]);
        });

        test("preserves bidirectional connection integrity across stack", () => {
            const data = tb.DATAOBJS;
            // start.flowOut -> repeat.flowIn
            expect(data[0][4][1]).toBe(1);
            expect(data[1][4][0]).toBe(0);

            // repeat.arg -> number 4
            expect(data[1][4][1]).toBe(2);
            expect(data[2][4][0]).toBe(1);

            // forward.arg -> number 100
            expect(data[4][4][1]).toBe(5);
            expect(data[5][4][0]).toBe(4);

            // right.arg -> number 90
            expect(data[6][4][1]).toBe(7);
            expect(data[7][4][0]).toBe(6);
        });
    });

    describe("Music Blocks English / International Default Stack", () => {
        let mb;

        beforeEach(() => {
            mb = setupGlobalEnvironment({ isTurtle: false });
            global.screen = { width: 1000 };
            localStorage.languagePreference = "en";
            mb.createDefaultStack();
        });

        test("generates exact 31-block stack with guitar timbre and 3-note melody", () => {
            expect(mb.DATAOBJS).toHaveLength(31);
            expect(window.DATAOBJS).toBe(mb.DATAOBJS);

            // Start block positioned at screen.width / 2 + 28 = 528
            expect(mb.DATAOBJS[0]).toEqual([0, "start", 528, 100, [null, 1, null]]);

            // Block 1: settimbre connected to voicename guitar
            expect(mb.DATAOBJS[1]).toEqual([1, "settimbre", 0, 0, [0, 2, 4, 3]]);
            expect(mb.DATAOBJS[2]).toEqual([2, ["voicename", { value: "guitar" }], 0, 0, [1]]);

            // Note 1: sol4, duration 1/4
            expect(mb.DATAOBJS[4]).toEqual([4, "newnote", 0, 0, [1, 5, 8, 12]]);
            expect(mb.DATAOBJS[5]).toEqual([5, "divide", 0, 0, [4, 6, 7]]);
            expect(mb.DATAOBJS[6]).toEqual([6, ["number", { value: 1 }], 0, 0, [5]]);
            expect(mb.DATAOBJS[7]).toEqual([7, ["number", { value: 4 }], 0, 0, [5]]);
            expect(mb.DATAOBJS[10]).toEqual([10, ["solfege", { value: "sol" }], 0, 0, [9]]);
            expect(mb.DATAOBJS[11]).toEqual([11, ["number", { value: 4 }], 0, 0, [9]]);

            // Note 2: mi4, duration 1/4
            expect(mb.DATAOBJS[13]).toEqual([13, "newnote", 0, 0, [12, 14, 17, 21]]);
            expect(mb.DATAOBJS[14]).toEqual([14, "divide", 0, 0, [13, 15, 16]]);
            expect(mb.DATAOBJS[15]).toEqual([15, ["number", { value: 1 }], 0, 0, [14]]);
            expect(mb.DATAOBJS[16]).toEqual([16, ["number", { value: 4 }], 0, 0, [14]]);
            expect(mb.DATAOBJS[19]).toEqual([19, ["solfege", { value: "mi" }], 0, 0, [18]]);
            expect(mb.DATAOBJS[20]).toEqual([20, ["number", { value: 4 }], 0, 0, [18]]);

            // Note 3: sol4, duration 1/2
            expect(mb.DATAOBJS[22]).toEqual([22, "newnote", 0, 0, [21, 23, 26, 30]]);
            expect(mb.DATAOBJS[23]).toEqual([23, "divide", 0, 0, [22, 24, 25]]);
            expect(mb.DATAOBJS[24]).toEqual([24, ["number", { value: 1 }], 0, 0, [23]]);
            expect(mb.DATAOBJS[25]).toEqual([25, ["number", { value: 2 }], 0, 0, [23]]);
            expect(mb.DATAOBJS[28]).toEqual([28, ["solfege", { value: "sol" }], 0, 0, [27]]);
            expect(mb.DATAOBJS[29]).toEqual([29, ["number", { value: 4 }], 0, 0, [27]]);

            // Clamp end
            expect(mb.DATAOBJS[30]).toEqual([30, "hidden", 0, 0, [22, null]]);
        });
    });

    describe("Music Blocks Japanese Stack & Regional Tag Handling", () => {
        let mb;

        beforeEach(() => {
            mb = setupGlobalEnvironment({ isTurtle: false });
        });

        const verifyJapaneseStack = () => {
            mb.createDefaultStack();
            expect(mb.DATAOBJS).toHaveLength(40);

            // Note 1: do4, duration 1/2
            expect(mb.DATAOBJS[10]).toEqual([10, ["solfege", { value: "do" }], 0, 0, [9]]);
            expect(mb.DATAOBJS[7]).toEqual([7, ["number", { value: 2 }], 0, 0, [5]]);

            // Note 2: mi4, duration 1/4
            expect(mb.DATAOBJS[19]).toEqual([19, ["solfege", { value: "mi" }], 0, 0, [18]]);
            expect(mb.DATAOBJS[16]).toEqual([16, ["number", { value: 4 }], 0, 0, [14]]);

            // Note 3: sol4, duration 1/4
            expect(mb.DATAOBJS[28]).toEqual([28, ["solfege", { value: "sol" }], 0, 0, [27]]);
            expect(mb.DATAOBJS[25]).toEqual([25, ["number", { value: 4 }], 0, 0, [23]]);

            // Note 4: do5, duration 1/1
            expect(mb.DATAOBJS[31]).toEqual([31, "newnote", 0, 0, [30, 32, 35, 39]]);
            expect(mb.DATAOBJS[37]).toEqual([37, ["solfege", { value: "do" }], 0, 0, [36]]);
            expect(mb.DATAOBJS[38]).toEqual([38, ["number", { value: 5 }], 0, 0, [36]]);
            expect(mb.DATAOBJS[33]).toEqual([33, ["number", { value: 1 }], 0, 0, [32]]);
            expect(mb.DATAOBJS[34]).toEqual([34, ["number", { value: 1 }], 0, 0, [32]]);

            // Final clamp end
            expect(mb.DATAOBJS[39]).toEqual([39, "hidden", 0, 0, [31, null]]);
        };

        test("selects Japanese stack when language is 'ja'", () => {
            localStorage.languagePreference = "ja";
            verifyJapaneseStack();
        });

        test("selects Japanese stack when regional language is 'ja-JP'", () => {
            localStorage.languagePreference = "ja-JP";
            verifyJapaneseStack();
        });

        test("selects Japanese stack when underscore tag 'ja_JP' is used", () => {
            localStorage.languagePreference = "ja_JP";
            verifyJapaneseStack();
        });

        test("selects Japanese stack when kana locale 'ja-kana' is set", () => {
            localStorage.languagePreference = "ja-kana";
            verifyJapaneseStack();
        });

        test("selects Japanese stack when mixed-case tags 'ja-JP', 'JA', 'JA-JP' or 'JA_JP' are used", () => {
            const mixedCase = ["ja-JP", "JA", "JA-JP", "ja_JP", "JA_JP", "ja-KANA", "  ja-jp  "];
            mixedCase.forEach(lang => {
                localStorage.languagePreference = lang;
                verifyJapaneseStack();
            });
        });

        test("selects Japanese stack from navigator.language when storage is empty", () => {
            delete localStorage.languagePreference;
            Object.defineProperty(global.navigator, "language", {
                value: "ja-JP",
                configurable: true
            });
            verifyJapaneseStack();
        });

        test("defaults to English stack for other non-Japanese locales", () => {
            const nonJapanese = ["en", "en-US", "fr", "de", "es", "zh-CN", "it"];
            nonJapanese.forEach(lang => {
                localStorage.languagePreference = lang;
                mb.createDefaultStack();
                expect(mb.DATAOBJS).toHaveLength(31);
                expect(mb.DATAOBJS[10]).toEqual([10, ["solfege", { value: "sol" }], 0, 0, [9]]);
            });
        });
    });
});

describe("turtledefs.js - Help Content Generator Engine (createHelpContent)", () => {
    let mb;

    beforeEach(() => {
        mb = setupGlobalEnvironment({ isTurtle: false });
    });

    describe("Defensive invocation and parameter safety", () => {
        test("executes safely when activity is omitted (undefined)", () => {
            expect(() => mb.createHelpContent()).not.toThrow();
            expect(mb.HELPCONTENT).toBeDefined();
            expect(mb.HELPCONTENT.length).toBeGreaterThan(0);
        });

        test("executes safely when activity is an empty object", () => {
            expect(() => mb.createHelpContent({})).not.toThrow();
            expect(mb.HELPCONTENT.length).toBeGreaterThan(0);
        });

        test("executes safely when activity.storage is undefined", () => {
            expect(() => mb.createHelpContent({ storage: undefined })).not.toThrow();
            const tabEntry = mb.HELPCONTENT.find(e => e[0] === "Tab Navigation");
            expect(tabEntry).toBeDefined();
            expect(typeof tabEntry[2]).toBe("function");
            expect(typeof tabEntry[2]()).toBe("string");
        });
    });

    describe("Advanced Mode vs Beginner Mode Content Filtering in Music Blocks", () => {
        const findEntry = (entries, title) => entries.find(e => e[0] === title);

        test("includes advanced-only tools and detailed save options in Advanced Mode", () => {
            mb.createHelpContent({ beginnerMode: false });
            const content = mb.HELPCONTENT;

            // Advanced-only items must be present
            expect(findEntry(content, "Record")).toBeDefined();
            expect(findEntry(content, "Display statistics")).toBeDefined();
            expect(findEntry(content, "Load plugin")).toBeDefined();
            expect(findEntry(content, "Delete plugin")).toBeDefined();
            expect(findEntry(content, "Enable scrolling")).toBeDefined();
            expect(findEntry(content, "JavaScript Editor")).toBeDefined();
            expect(findEntry(content, "Contextual Menu for Canvas")).toBeDefined();
            expect(findEntry(content, "Select")).toBeDefined();

            // Save option has full export formats
            const saveEntry = findEntry(content, "Save project");
            expect(saveEntry).toBeDefined();
            expect(saveEntry[1]).toContain("MIDI");
            expect(saveEntry[1]).toContain("WAV");
            expect(saveEntry[1]).toContain("ABC");
        });

        test("filters out advanced tools and simplifies save options in Beginner Mode", () => {
            mb.createHelpContent({ beginnerMode: true });
            const content = mb.HELPCONTENT;

            // Advanced-only items must NOT be present
            expect(findEntry(content, "Record")).toBeUndefined();
            expect(findEntry(content, "Display statistics")).toBeUndefined();
            expect(findEntry(content, "Load plugin")).toBeUndefined();
            expect(findEntry(content, "Delete plugin")).toBeUndefined();
            expect(findEntry(content, "Enable scrolling")).toBeUndefined();
            expect(findEntry(content, "JavaScript Editor")).toBeUndefined();
            expect(findEntry(content, "Contextual Menu for Canvas")).toBeUndefined();
            expect(findEntry(content, "Select")).toBeUndefined();

            // Save option is simplified for beginner mode
            const saveEntry = findEntry(content, "Save project");
            expect(saveEntry).toBeDefined();
            expect(saveEntry[1]).toContain("HTML");
            expect(saveEntry[1]).toContain("PNG");
            expect(saveEntry[1]).not.toContain("MIDI");
            expect(saveEntry[1]).not.toContain("MusicXML");
        });

        test("includes Mr. Mouse and Palette buttons only in Music Blocks mode", () => {
            mb.createHelpContent({ beginnerMode: false });
            expect(findEntry(mb.HELPCONTENT, "Meet Mr. Mouse!")).toBeDefined();
            expect(findEntry(mb.HELPCONTENT, "Palette buttons")).toBeDefined();
            expect(findEntry(mb.HELPCONTENT, "Tab Navigation")).toBeDefined();
            expect(findEntry(mb.HELPCONTENT, "About")[3]).toBe(
                "https://github.com/sugarlabs/musicblocks"
            );
        });
    });

    describe("Turtle Blocks Help Content Differences", () => {
        let tb;

        beforeEach(() => {
            tb = setupGlobalEnvironment({ isTurtle: true });
        });

        test("excludes music-specific help entries in Turtle Blocks mode", () => {
            tb.createHelpContent({ beginnerMode: false });
            const content = tb.HELPCONTENT;

            expect(content.find(e => e[0] === "Meet Mr. Mouse!")).toBeUndefined();
            expect(content.find(e => e[0] === "Palette buttons")).toBeUndefined();
            expect(content.find(e => e[0] === "Tab Navigation")).toBeUndefined();
        });

        test("links to Turtle Blocks GitHub repository and Guide in About section", () => {
            tb.createHelpContent({ beginnerMode: false });
            const aboutEntry = tb.HELPCONTENT.find(e => e[0] === "About");
            expect(aboutEntry).toBeDefined();
            expect(aboutEntry[3]).toBe("https://github.com/sugarlabs/turtleblocksjs");
            expect(aboutEntry[4]).toBe("Turtle Blocks GitHub repository");

            const guideEntry = tb.HELPCONTENT.find(e => e[0] === "Guide");
            expect(guideEntry).toBeDefined();
            expect(guideEntry[3]).toBe("TurtleDocs/guide/index.html");
            expect(guideEntry[4]).toBe("Turtle Blocks Guide");
        });

        test("Turtle Blocks save descriptions cover SVG and PNG turtle artwork", () => {
            tb.createHelpContent({ beginnerMode: false });
            const saveEntry = tb.HELPCONTENT.find(e => e[0] === "Save");
            expect(saveEntry).toBeDefined();
            expect(saveEntry[1]).toContain("SVG");
            expect(saveEntry[1]).toContain("PNG");
        });
    });

    describe("Japanese Locale Logo Resolution in createHelpContent", () => {
        let mb;

        beforeEach(() => {
            mb = setupGlobalEnvironment({ isTurtle: false });
        });

        test("uses LOGOJA when language is 'ja'", () => {
            localStorage.languagePreference = "ja";
            mb.createHelpContent({});
            const welcome = mb.HELPCONTENT[0];
            expect(decodeDataUri(welcome[2])).toBe(mb.LOGOJA);
        });

        test("uses LOGOJA when language is regional 'ja-JP'", () => {
            localStorage.languagePreference = "ja-JP";
            mb.createHelpContent({});
            const welcome = mb.HELPCONTENT[0];
            expect(decodeDataUri(welcome[2])).toBe(mb.LOGOJA);
        });

        test("uses LOGOJA when language is 'ja-kana'", () => {
            localStorage.languagePreference = "ja-kana";
            mb.createHelpContent({});
            const welcome = mb.HELPCONTENT[0];
            expect(decodeDataUri(welcome[2])).toBe(mb.LOGOJA);
        });

        test("uses LOGOJA when mixed-case Japanese locale tags are used", () => {
            const mixedCase = ["JA", "JA-JP", "JA_JP", "ja-KANA", "  ja-jp  "];
            mixedCase.forEach(lang => {
                localStorage.languagePreference = lang;
                mb.createHelpContent({});
                const welcome = mb.HELPCONTENT[0];
                expect(decodeDataUri(welcome[2])).toBe(mb.LOGOJA);
            });
        });

        test("uses LOGODEFAULT when language is English or other languages", () => {
            localStorage.languagePreference = "en";
            mb.createHelpContent({});
            const welcome = mb.HELPCONTENT[0];
            expect(decodeDataUri(welcome[2])).toBe(mb.LOGODEFAULT);
        });
    });
});

describe("turtledefs.js - Tab Navigation Dynamic Theme Icon Engine", () => {
    let mb, activity;

    const getTabEntry = () => mb.HELPCONTENT.find(e => e[0] === "Tab Navigation");
    const getResolvedIcon = () => decodeDataUri(getTabEntry()[2]());

    beforeEach(() => {
        mb = setupGlobalEnvironment({ isTurtle: false });
        activity = { beginnerMode: false, storage: {} };
        mb.createHelpContent(activity);
    });

    test("defers icon calculation to invocation time as an executable function", () => {
        const entry = getTabEntry();
        expect(entry).toBeDefined();
        expect(typeof entry[2]).toBe("function");
    });

    test("returns TABBUTTON_LIGHT when themePreference is 'light'", () => {
        activity.storage.themePreference = "light";
        expect(getResolvedIcon()).toBe("TABBUTTON_LIGHT");
    });

    test("returns TABBUTTON_DARK when themePreference is 'dark'", () => {
        activity.storage.themePreference = "dark";
        expect(getResolvedIcon()).toBe("TABBUTTON_DARK");
    });

    test("returns TABBUTTON_DARK when themePreference is 'highcontrast' (black background)", () => {
        activity.storage.themePreference = "highcontrast";
        expect(getResolvedIcon()).toBe("TABBUTTON_DARK");
    });

    test("falls back to getSystemThemePreference() when no storage preference is set", () => {
        delete activity.storage.themePreference;

        getSystemThemePreference.mockReturnValue("dark");
        expect(getResolvedIcon()).toBe("TABBUTTON_DARK");

        getSystemThemePreference.mockReturnValue("light");
        expect(getResolvedIcon()).toBe("TABBUTTON_LIGHT");
    });

    test("safely defaults to light when getSystemThemePreference is undefined", () => {
        delete activity.storage.themePreference;
        global.getSystemThemePreference = undefined;
        expect(getResolvedIcon()).toBe("TABBUTTON_LIGHT");
    });

    test("dynamically responds to storage changes across repeated calls", () => {
        activity.storage.themePreference = "light";
        expect(getResolvedIcon()).toBe("TABBUTTON_LIGHT");

        activity.storage.themePreference = "dark";
        expect(getResolvedIcon()).toBe("TABBUTTON_DARK");

        activity.storage.themePreference = "light";
        expect(getResolvedIcon()).toBe("TABBUTTON_LIGHT");
    });
});

describe("turtledefs.js - Module and Window Export Integrity", () => {
    let mb;

    beforeEach(() => {
        mb = setupGlobalEnvironment({ isTurtle: false });
    });

    test("exports all required functions and helpers via module.exports", () => {
        expect(typeof mb.createDefaultStack).toBe("function");
        expect(typeof mb.createHelpContent).toBe("function");
        expect(typeof mb.getLanguagePreference).toBe("function");
        expect(typeof mb.isJapanese).toBe("function");
        expect(typeof mb.getMainToolbarButtonNames).toBe("function");
        expect(typeof mb.getAuxToolbarButtonNames).toBe("function");
    });

    test("exports all expected constants via module.exports", () => {
        expect(typeof mb.VERSION).toBe("string");
        expect(typeof mb.TITLESTRING).toBe("string");
        expect(typeof mb.NUMBERBLOCKDEFAULT).toBe("number");
        expect(typeof mb.DEFAULTPALETTE).toBe("string");
        expect(typeof mb.GUIDEURL).toBe("string");
        expect(typeof mb.LOGODEFAULT).toBe("string");
        expect(typeof mb.LOGOJA).toBe("string");
        expect(typeof mb.LOGOJA1).toBe("string");
    });

    test("provides dynamic getters for stateful/rebound arrays", () => {
        expect(Array.isArray(mb.BUILTINPALETTES)).toBe(true);
        expect(Array.isArray(mb.BUILTINPALETTESFORL23N)).toBe(true);
        expect(Array.isArray(mb.MULTIPALETTES)).toBe(true);
        expect(Array.isArray(mb.SKIPPALETTES)).toBe(true);
        expect(Array.isArray(mb.MULTIPALETTEICONS)).toBe(true);
        expect(Array.isArray(mb.MULTIPALETTENAMES)).toBe(true);

        // Mutated DATAOBJS after createDefaultStack is accessible via getter
        expect(mb.DATAOBJS).toBeUndefined();
        mb.createDefaultStack();
        expect(Array.isArray(mb.DATAOBJS)).toBe(true);
        expect(mb.DATAOBJS.length).toBeGreaterThan(0);

        // Mutated HELPCONTENT after createHelpContent is accessible via getter
        expect(mb.HELPCONTENT).toBeUndefined();
        mb.createHelpContent({});
        expect(Array.isArray(mb.HELPCONTENT)).toBe(true);
        expect(mb.HELPCONTENT.length).toBeGreaterThan(0);
    });

    test("mirrors all exports onto global window object for browser runtime", () => {
        expect(window.createDefaultStack).toBe(mb.createDefaultStack);
        expect(window.createHelpContent).toBe(mb.createHelpContent);
        expect(window.getLanguagePreference).toBe(mb.getLanguagePreference);
        expect(window.isJapanese).toBe(mb.isJapanese);
        expect(window.getMainToolbarButtonNames).toBe(mb.getMainToolbarButtonNames);
        expect(window.getAuxToolbarButtonNames).toBe(mb.getAuxToolbarButtonNames);
        expect(window.VERSION).toBe(mb.VERSION);
        expect(window.TITLESTRING).toBe(mb.TITLESTRING);
        expect(window.NUMBERBLOCKDEFAULT).toBe(mb.NUMBERBLOCKDEFAULT);
        expect(window.DEFAULTPALETTE).toBe(mb.DEFAULTPALETTE);
        expect(window.BUILTINPALETTES).toBe(mb.BUILTINPALETTES);
        expect(window.BUILTINPALETTESFORL23N).toBe(mb.BUILTINPALETTESFORL23N);
        expect(window.MULTIPALETTES).toBe(mb.MULTIPALETTES);
        expect(window.SKIPPALETTES).toBe(mb.SKIPPALETTES);
        expect(window.MULTIPALETTEICONS).toBe(mb.MULTIPALETTEICONS);
        expect(window.MULTIPALETTENAMES).toBe(mb.MULTIPALETTENAMES);
    });
});

describe("turtledefs.js - Screen coordinate responsiveness across viewport sizes", () => {
    test.each([
        [600, 328],
        [1024, 540],
        [1440, 748],
        [1920, 988],
        [2560, 1308]
    ])(
        "positions Music Blocks start block at width/2 + 28 for screen width %d -> x: %d",
        (width, expectedX) => {
            const mb = setupGlobalEnvironment({ isTurtle: false });
            global.screen = { width };
            mb.createDefaultStack();
            expect(mb.DATAOBJS[0][2]).toBe(expectedX);
            expect(mb.DATAOBJS[0][3]).toBe(100);
        }
    );

    test.each([
        [600, 200],
        [900, 300],
        [1200, 400],
        [1500, 500],
        [2100, 700]
    ])(
        "positions Turtle Blocks start block at width/3 for screen width %d -> x: %d",
        (width, expectedX) => {
            const tb = setupGlobalEnvironment({ isTurtle: true });
            global.screen = { width };
            tb.createDefaultStack();
            expect(tb.DATAOBJS[0][2]).toBe(expectedX);
            expect(tb.DATAOBJS[0][3]).toBe(100);
        }
    );
});

describe("turtledefs.js - Stack connection graph continuity and reference integrity", () => {
    const validateStackIntegrity = (stack, totalExpectedBlocks) => {
        expect(stack).toHaveLength(totalExpectedBlocks);
        stack.forEach(([index, descriptor, , , connections]) => {
            expect(typeof index).toBe("number");
            expect(descriptor).toBeDefined();
            expect(Array.isArray(connections)).toBe(true);

            connections.forEach(conn => {
                if (conn !== null) {
                    expect(conn).toBeGreaterThanOrEqual(0);
                    expect(conn).toBeLessThan(totalExpectedBlocks);
                    // Targeted connection exists in stack
                    expect(stack[conn]).toBeDefined();
                }
            });
        });
    };

    test("English default stack has zero dangling connection pointers across 31 blocks", () => {
        const mb = setupGlobalEnvironment({ isTurtle: false });
        localStorage.languagePreference = "en";
        mb.createDefaultStack();
        validateStackIntegrity(mb.DATAOBJS, 31);
    });

    test("Japanese default stack has zero dangling connection pointers across 40 blocks", () => {
        const mb = setupGlobalEnvironment({ isTurtle: false });
        localStorage.languagePreference = "ja";
        mb.createDefaultStack();
        validateStackIntegrity(mb.DATAOBJS, 40);
    });

    test("Turtle Blocks default stack has zero dangling connection pointers across 8 blocks", () => {
        const tb = setupGlobalEnvironment({ isTurtle: true });
        tb.createDefaultStack();
        validateStackIntegrity(tb.DATAOBJS, 8);
    });
});

describe("turtledefs.js - Exhaustive Help Content Icon and Data URI Mapping", () => {
    let mb;

    beforeEach(() => {
        mb = setupGlobalEnvironment({ isTurtle: false });
        mb.createHelpContent({ beginnerMode: false });
    });

    const expectedButtonMappings = [
        ["Play", "RUNBUTTON"],
        ["Stop", "STOPTURTLEBUTTON"],
        ["Record", "RECORDHELPBUTTON"],
        ["Toggle Fullscreen", "FULLSCREENBUTTON"],
        ["New project", "NEWBUTTON"],
        ["Load project from file", "LOADBUTTON"],
        ["Save project", "SAVEBUTTON"],
        ["Load samples from server", "PLANETBUTTON"],
        ["Expand/collapse option toolbar", "MENUBUTTON"],
        ["Help", "HELPBUTTON"],
        ["Run slowly", "SLOWBUTTON"],
        ["Run step by step", "STEPBUTTON"],
        ["Display statistics", "STATSBUTTON"],
        ["Load plugin", "PLUGINSBUTTON"],
        ["Delete plugin", "PLUGINSDELETEBUTTON"],
        ["Enable scrolling", "SCROLLUNLOCKBUTTON"],
        ["Change theme", "DARKMODEBUTTON"],
        ["Merge with current project", "OPENMERGEBUTTON"],
        ["Wrap Turtle", "WRAPTURTLEBUTTON"],
        ["Set Pitch Preview", "PITCHPREVIEWHELPBUTTON"],
        ["JavaScript Editor", "JAVASCRIPTBUTTON"],
        ["Restore", "RESTORETRASHBUTTON"],
        ["Switch mode", "ADVANCEDBUTTON"],
        ["Select language", "LANGUAGEBUTTON"],
        ["Contextual Menu for Blocks", "BLOCKMENUBUTTON"],
        ["Delete", "EMPTYTRASHCONFIRMBUTTON"],
        ["Copy", "COPYBUTTON"],
        ["Extract", "EXTRACTBUTTON"],
        ["Contextual Menu for Canvas", "CANVASMENUBUTTON"],
        ["Grid", "CARTESIANBUTTON"],
        ["Clear", "CLEARBUTTON"],
        ["Collapse", "COLLAPSEBUTTON"],
        ["Home", "GOHOMEBUTTON"],
        ["Show/hide blocks", "HIDEBLOCKSBUTTON"],
        ["Expand/collapse blocks", "COLLAPSEBLOCKSBUTTON"],
        ["Decrease block size", "SMALLERBUTTON"],
        ["Increase block size", "BIGGERBUTTON"],
        ["Select", "SELECTHELPBUTTON"],
        ["Palette buttons", "RHYTHMPALETTEHELPICON"]
    ];

    test.each(expectedButtonMappings)(
        "binds entry '%s' with exact expected button icon constant '%s'",
        (title, expectedIcon) => {
            const entry = mb.HELPCONTENT.find(e => e[0] === title);
            expect(entry).toBeDefined();
            expect(decodeDataUri(entry[2])).toBe(expectedIcon);
        }
    );
});
