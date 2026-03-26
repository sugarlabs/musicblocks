/**
 * @license
 * MusicBlocks v3.7.0
 * Copyright (C) 2025 Mohd Ali Khan
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
 * Test suite for Pitch Palette — Beginner level blocks
 * Covers: pitch, steppitch, hertz, currentpitch, deltapitch,
 *         consonantstepsizeup, consonantstepsizedown, duplicatenotes
 * Part of issue #5607 — Music Blocks test suite project
 */

const { Palettes } = require("../palette");

// ─── Global mocks ────────────────────────────────────────────────────────────

global.LEADING = 10;
global.DEFAULTPALETTE = "pitch";
global.MULTIPALETTES = [
    ["rhythm", "pitch"],
    ["flow", "action"],
    ["graphics", "pen"]
];
global.PALETTEICONS = {
    search: "<svg></svg>",
    rhythm: "<svg></svg>",
    pitch: "<svg></svg>",
    flow: "<svg></svg>",
    action: "<svg></svg>",
    graphics: "<svg></svg>",
    pen: "<svg></svg>",
    myblocks: "<svg></svg>",
    music: "<svg background_fill_color stroke_color fill_color></svg>",
    logic: "<svg background_fill_color stroke_color fill_color></svg>",
    artwork: "<svg background_fill_color stroke_color fill_color></svg>"
};
global.MULTIPALETTEICONS = ["music", "logic", "artwork"];
global.SKIPPALETTES = ["heap", "dictionary"];
global.toTitleCase = str => str.charAt(0).toUpperCase() + str.slice(1);
global._ = str => str;
global.platformColor = {
    selectorSelected: "#000",
    paletteBackground: "#fff",
    strokeColor: "#333",
    fillColor: "#666",
    paletteLabelBackground: "#ccc",
    paletteLabelSelected: "#aaa",
    hoverColor: "#ddd",
    paletteText: "#000",
    textColor: "#111"
};
global.base64Encode = str => str;
global.localStorage = { kanaPreference: "default" };
global.i18nSolfege = jest.fn(() => "sol");
global.NUMBERBLOCKDEFAULT = 1;
global.TEXTWIDTH = 100;
global.STRINGLEN = 10;
global.DEFAULTBLOCKSCALE = 1;
global.STANDARDBLOCKHEIGHT = 18;
global.DISABLEDFILLCOLOR = "disabled_fill";
global.DISABLEDSTROKECOLOR = "disabled_stroke";
global.PALETTEFILLCOLORS = { pitch: "pitch_fill", test: "test_fill" };
global.PALETTESTROKECOLORS = { pitch: "pitch_stroke", test: "test_stroke" };
global.CLOSEICON = "<svg fill_color></svg>";
global.safeSVG = str => str;
global.blockIsMacro = jest.fn(() => false);
global.getMacroExpansion = jest.fn();
global.last = arr => arr[arr.length - 1];
global.getTextWidth = jest.fn(() => 10);
global.SVG = class {
    constructor() {
        this.docks = [];
    }
    setScale() {}
    setExpand() {}
    setOutie() {}
    basicBox() {
        return "fill_color stroke_color block_label arg_label_0";
    }
    basicBlock() {
        return "fill_color stroke_color block_label";
    }
    getHeight() {
        return 12;
    }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupDocMocks() {
    global.document = {
        createElement: jest.fn(() => ({
            id: "",
            setAttribute: jest.fn(),
            classList: { add: jest.fn() },
            appendChild: jest.fn(),
            style: {},
            innerHTML: "",
            childNodes: [{ style: {} }]
        })),
        getElementById: jest.fn(() => null),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        body: { appendChild: jest.fn(), style: { cursor: "default" } }
    };
    global.window = Object.assign(global.window || {}, {
        btoa: jest.fn(str => str),
        innerHeight: 800
    });
    global.Image = class {
        constructor() {
            this.src = "";
            this.width = 0;
            this.height = 0;
            this.style = {};
        }
    };
    global.docById = jest.fn(id => {
        if (id === "palette")
            return {
                style: { visibility: "visible", top: "100px" },
                setAttribute: jest.fn(),
                addEventListener: jest.fn(),
                children: []
            };
        return { style: {}, appendChild: jest.fn(), removeChild: jest.fn() };
    });
}

function buildMockActivity() {
    return {
        cellSize: 50,
        blocks: { protoBlockDict: {}, makeBlock: jest.fn(() => ({})) },
        hideSearchWidget: jest.fn(),
        showSearchWidget: jest.fn(),
        palettes: {},
        beginnerMode: false
    };
}

function buildProto(name, staticLabels = [""], args = 0, disabled = false) {
    return {
        name,
        palette: { name: "pitch" },
        staticLabels,
        args,
        generator: jest.fn(() => ["fill_color stroke_color block_label arg_label_0", [], null, 12]),
        scale: 1,
        image: false,
        disabled
    };
}

function makeBlockInfo(palettes, name, defaults = [], staticLabels = [""], args = 0) {
    const palette = palettes.dict["pitch"];
    return palette.model.makeBlockInfo(
        0,
        { name, defaults, staticLabels, image: false, scale: 1, hidden: false },
        name,
        name
    );
}

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════════════════

describe("Pitch Palette — Beginner Blocks", () => {
    let mockActivity;
    let palettes;

    beforeEach(() => {
        setupDocMocks();
        mockActivity = buildMockActivity();
        palettes = new Palettes(mockActivity);
        palettes.add("pitch");
        global.window = { btoa: jest.fn(str => str) };
    });

    // ── 1. Palette registration ────────────────────────────────────────────

    describe("Palette registration", () => {
        test("pitch palette is added to palettes dict", () => {
            expect(palettes.dict["pitch"]).toBeDefined();
        });

        test("pitch palette has an empty protoList on creation", () => {
            expect(palettes.dict["pitch"].protoList).toEqual([]);
        });

        test("pitch palette model has a blocks array", () => {
            expect(Array.isArray(palettes.dict["pitch"].model.blocks)).toBe(true);
        });

        test("pitch palette is separate from rhythm palette", () => {
            palettes.add("rhythm");
            expect(palettes.dict["pitch"]).not.toBe(palettes.dict["rhythm"]);
        });
    });

    // ── 2. pitch block ────────────────────────────────────────────────────

    describe("pitch block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { pitch: buildProto("pitch", [""], 2) };
        });

        test("countProtoBlocks counts pitch block in pitch palette", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(1);
        });

        test("makeBlockInfo label for pitch falls back to blkname", () => {
            const info = makeBlockInfo(palettes, "pitch", ["G", 4]);
            expect(info.label).toBe("pitch");
        });

        test("pitch artwork contains pitch fill color", () => {
            const info = makeBlockInfo(palettes, "pitch", ["G", 4]);
            expect(info.artwork).toContain("pitch_fill");
        });

        test("pitch artwork64 is valid base64 data URI", () => {
            const info = makeBlockInfo(palettes, "pitch", ["G", 4]);
            expect(info.artwork64).toMatch(/^data:image\/svg\+xml;base64,/);
        });

        test("pitch block is not hidden", () => {
            const info = makeBlockInfo(palettes, "pitch", ["G", 4]);
            expect(info.hidden).toBe(false);
        });
    });

    // ── 3. steppitch block ────────────────────────────────────────────────

    describe("steppitch block (Step in pitch)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { steppitch: buildProto("steppitch", [""], 1) };
        });

        test("countProtoBlocks counts steppitch", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(1);
        });

        test("makeBlockInfo label for steppitch", () => {
            const info = makeBlockInfo(palettes, "steppitch", [1]);
            expect(info.label).toBe("steppitch");
        });

        test("steppitch artwork is not empty", () => {
            const info = makeBlockInfo(palettes, "steppitch", [1]);
            expect(info.artwork.length).toBeGreaterThan(0);
        });
    });

    // ── 4. hertz block ────────────────────────────────────────────────────

    describe("hertz block (Pitch in hertz)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { hertz: buildProto("hertz", [""], 1) };
        });

        test("countProtoBlocks counts hertz", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(1);
        });

        test("makeBlockInfo label for hertz", () => {
            const info = makeBlockInfo(palettes, "hertz", [392]);
            expect(info.label).toBe("hertz");
        });

        test("hertz artwork contains fill color", () => {
            const info = makeBlockInfo(palettes, "hertz", [392]);
            expect(info.artwork).toContain("pitch_fill");
        });
    });

    // ── 5. currentpitch block ─────────────────────────────────────────────

    describe("currentpitch block (Current pitch)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { currentpitch: buildProto("currentpitch") };
        });

        test("countProtoBlocks counts currentpitch", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(1);
        });

        test("makeBlockInfo label for currentpitch", () => {
            const info = makeBlockInfo(palettes, "currentpitch");
            expect(info.label).toBe("currentpitch");
        });

        test("currentpitch is not disabled by default", () => {
            expect(buildProto("currentpitch").disabled).toBe(false);
        });
    });

    // ── 6. deltapitch block ───────────────────────────────────────────────

    describe("deltapitch block (Change in pitch)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { deltapitch: buildProto("deltapitch") };
        });

        test("countProtoBlocks counts deltapitch", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(1);
        });

        test("makeBlockInfo label for deltapitch", () => {
            const info = makeBlockInfo(palettes, "deltapitch");
            expect(info.label).toBe("deltapitch");
        });
    });

    // ── 7. consonantstepsizeup block ──────────────────────────────────────

    describe("consonantstepsizeup block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                consonantstepsizeup: buildProto("consonantstepsizeup")
            };
        });

        test("countProtoBlocks counts consonantstepsizeup", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(1);
        });

        test("makeBlockInfo label for consonantstepsizeup", () => {
            const info = makeBlockInfo(palettes, "consonantstepsizeup");
            expect(info.label).toBe("consonantstepsizeup");
        });
    });

    // ── 8. consonantstepsizedown block ────────────────────────────────────

    describe("consonantstepsizedown block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                consonantstepsizedown: buildProto("consonantstepsizedown")
            };
        });

        test("countProtoBlocks counts consonantstepsizedown", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(1);
        });

        test("makeBlockInfo label for consonantstepsizedown", () => {
            const info = makeBlockInfo(palettes, "consonantstepsizedown");
            expect(info.label).toBe("consonantstepsizedown");
        });
    });

    // ── 9. duplicatenotes block ───────────────────────────────────────────

    describe("duplicatenotes block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                duplicatenotes: buildProto("duplicatenotes", [""], 1)
            };
        });

        test("countProtoBlocks counts duplicatenotes", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(1);
        });

        test("makeBlockInfo label for duplicatenotes", () => {
            const info = makeBlockInfo(palettes, "duplicatenotes", [2]);
            expect(info.label).toBe("duplicatenotes");
        });

        test("duplicatenotes artwork64 is valid data URI", () => {
            const info = makeBlockInfo(palettes, "duplicatenotes", [2]);
            expect(info.artwork64).toMatch(/^data:image\/svg\+xml;base64,/);
        });
    });

    // ── 10. All pitch beginner blocks together ─────────────────────────────

    describe("All pitch beginner blocks together", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                pitch: buildProto("pitch", [""], 2),
                steppitch: buildProto("steppitch", [""], 1),
                hertz: buildProto("hertz", [""], 1),
                currentpitch: buildProto("currentpitch"),
                deltapitch: buildProto("deltapitch"),
                consonantstepsizeup: buildProto("consonantstepsizeup"),
                consonantstepsizedown: buildProto("consonantstepsizedown"),
                duplicatenotes: buildProto("duplicatenotes", [""], 1)
            };
        });

        test("countProtoBlocks returns 8 for all beginner pitch blocks", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(8);
        });

        test("countProtoBlocks returns 0 for rhythm palette when only pitch blocks present", () => {
            expect(palettes.countProtoBlocks("rhythm")).toBe(0);
        });

        test("countProtoBlocks returns 0 for empty protoBlockDict", () => {
            mockActivity.blocks.protoBlockDict = {};
            expect(palettes.countProtoBlocks("pitch")).toBe(0);
        });

        test("blocks with null palette are excluded from pitch count", () => {
            mockActivity.blocks.protoBlockDict = {
                pitch: buildProto("pitch"),
                broken: { palette: null, name: "broken", hidden: false }
            };
            expect(palettes.countProtoBlocks("pitch")).toBe(1);
        });
    });

    // ── 11. Disabled pitch block ──────────────────────────────────────────

    describe("Disabled pitch block", () => {
        test("disabled pitch block uses disabled fill and stroke colors", () => {
            mockActivity.blocks.protoBlockDict = { pitch: buildProto("pitch", [""], 2, true) };
            const info = makeBlockInfo(palettes, "pitch", ["G", 4]);
            expect(info.artwork).toContain("disabled_fill");
            expect(info.artwork).toContain("disabled_stroke");
        });

        test("enabled pitch block does NOT use disabled colors", () => {
            mockActivity.blocks.protoBlockDict = { pitch: buildProto("pitch", [""], 2, false) };
            const info = makeBlockInfo(palettes, "pitch", ["G", 4]);
            expect(info.artwork).not.toContain("disabled_fill");
        });
    });

    // ── 12. notename block (label mapping) ────────────────────────────────

    describe("notename block (label mapping)", () => {
        test("makeBlockInfo returns 'G' label for notename block", () => {
            mockActivity.blocks.protoBlockDict = { notename: buildProto("notename") };
            const palette = palettes.dict["pitch"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "notename",
                    defaults: [""],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "notename",
                "notename"
            );
            expect(info.label).toBe("G");
        });
    });

    // ── 13. getProtoNameAndPalette for pitch blocks ───────────────────────

    describe("getProtoNameAndPalette for pitch blocks", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                pitch: { name: "pitch", palette: { name: "pitch" }, hidden: false }
            };
        });

        test("returns correct name and palette for pitch block", () => {
            const result = palettes.getProtoNameAndPalette("pitch");
            expect(result[0]).toBe("pitch");
            expect(result[1]).toBe("pitch");
        });

        test("returns nulls for non-existent pitch block", () => {
            const result = palettes.getProtoNameAndPalette("nonexistent");
            expect(result).toEqual([null, null, null]);
        });

        test("skips hidden pitch blocks", () => {
            mockActivity.blocks.protoBlockDict = {
                pitch: { name: "pitch", palette: { name: "pitch" }, hidden: true }
            };
            const result = palettes.getProtoNameAndPalette("pitch");
            expect(result).toEqual([null, null, null]);
        });
    });

    // ── 14. Deduplication ─────────────────────────────────────────────────

    describe("Pitch palette protoList deduplication", () => {
        test("adding same pitch block twice stores it only once", () => {
            const palette = palettes.dict["pitch"];
            const proto = buildProto("pitch");
            palette.add(proto);
            palette.add(proto);
            expect(palette.protoList.length).toBe(1);
        });

        test("adding different pitch blocks stores all of them", () => {
            const palette = palettes.dict["pitch"];
            palette.add(buildProto("pitch"));
            palette.add(buildProto("steppitch"));
            palette.add(buildProto("hertz"));
            expect(palette.protoList.length).toBe(3);
        });
    });
});
