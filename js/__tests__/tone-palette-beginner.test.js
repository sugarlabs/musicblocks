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
 * Test suite for Tone Palette - Beginner level blocks
 * Covers: settimbre, vibrato, chorus, distortion, tremolo,
 *         phaser, neighbor2, setvoice
 * Part of issue #5607 - Music Blocks test suite project
 */

const { Palettes } = require("../palette");

// ─── Global mocks ─────────────────────────────────────────────────────────────

global.LEADING = 10;
global.DEFAULTPALETTE = "tone";
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
    tone: "<svg></svg>",
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
global.PALETTEFILLCOLORS = { tone: "tone_fill", test: "test_fill" };
global.PALETTESTROKECOLORS = { tone: "tone_stroke", test: "test_stroke" };
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        palette: { name: "tone" },
        staticLabels,
        args,
        generator: jest.fn(() => ["fill_color stroke_color block_label arg_label_0", [], null, 12]),
        scale: 1,
        image: false,
        disabled
    };
}

function getInfo(palettes, name, defaults = [], staticLabels = [""], hidden = false) {
    const palette = palettes.dict["tone"];
    return palette.model.makeBlockInfo(
        0,
        { name, defaults, staticLabels, image: false, scale: 1, hidden },
        name,
        name
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ══════════════════════════════════════════════════════════════════════════════

describe("Tone Palette - Beginner Blocks", () => {
    let mockActivity;
    let palettes;

    beforeEach(() => {
        setupDocMocks();
        mockActivity = buildMockActivity();
        palettes = new Palettes(mockActivity);
        palettes.add("tone");
        global.window = { btoa: jest.fn(str => str) };
    });

    // ── 1. Palette Registration ──────────────────────────────────────────────

    describe("Palette registration", () => {
        test("tone palette is added to palettes dict", () => {
            expect(palettes.dict["tone"]).toBeDefined();
        });

        test("tone palette has empty protoList on creation", () => {
            expect(palettes.dict["tone"].protoList).toEqual([]);
        });

        test("tone palette model has a blocks array", () => {
            expect(Array.isArray(palettes.dict["tone"].model.blocks)).toBe(true);
        });

        test("tone palette is independent from rhythm and pitch palettes", () => {
            palettes.add("rhythm");
            palettes.add("pitch");
            expect(palettes.dict["tone"]).not.toBe(palettes.dict["rhythm"]);
            expect(palettes.dict["tone"]).not.toBe(palettes.dict["pitch"]);
        });
    });

    // ── 2. settimbre block ───────────────────────────────────────────────────

    describe("settimbre block (Set timbre)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { settimbre: buildProto("settimbre", [""], 1) };
        });

        test("countProtoBlocks counts settimbre in tone palette", () => {
            expect(palettes.countProtoBlocks("tone")).toBe(1);
        });

        test("makeBlockInfo label for settimbre", () => {
            const info = getInfo(palettes, "settimbre", ["guitar"]);
            expect(info.label).toBe("settimbre");
        });

        test("settimbre artwork contains tone fill color", () => {
            const info = getInfo(palettes, "settimbre", ["guitar"]);
            expect(info.artwork).toContain("tone_fill");
        });

        test("settimbre artwork64 is valid base64 data URI", () => {
            const info = getInfo(palettes, "settimbre", ["guitar"]);
            expect(info.artwork64).toMatch(/^data:image\/svg\+xml;base64,/);
        });

        test("settimbre block is not hidden by default", () => {
            const info = getInfo(palettes, "settimbre", ["guitar"]);
            expect(info.hidden).toBe(false);
        });
    });

    // ── 3. vibrato block ─────────────────────────────────────────────────────

    describe("vibrato block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { vibrato: buildProto("vibrato", [""], 2) };
        });

        test("countProtoBlocks counts vibrato", () => {
            expect(palettes.countProtoBlocks("tone")).toBe(1);
        });

        test("makeBlockInfo label for vibrato", () => {
            const info = getInfo(palettes, "vibrato", [5, 2]);
            expect(info.label).toBe("vibrato");
        });

        test("vibrato artwork is not empty", () => {
            const info = getInfo(palettes, "vibrato", [5, 2]);
            expect(info.artwork.length).toBeGreaterThan(0);
        });

        test("vibrato is not disabled", () => {
            expect(buildProto("vibrato").disabled).toBe(false);
        });
    });

    // ── 4. chorus block ──────────────────────────────────────────────────────

    describe("chorus block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { chorus: buildProto("chorus", [""], 3) };
        });

        test("countProtoBlocks counts chorus in tone palette", () => {
            expect(palettes.countProtoBlocks("tone")).toBe(1);
        });

        test("makeBlockInfo label for chorus", () => {
            const info = getInfo(palettes, "chorus", [1.5, 3.5, 70]);
            expect(info.label).toBe("chorus");
        });

        test("chorus artwork contains fill color", () => {
            const info = getInfo(palettes, "chorus", [1.5, 3.5, 70]);
            expect(info.artwork).toContain("tone_fill");
        });
    });

    // ── 5. distortion block ──────────────────────────────────────────────────

    describe("distortion block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { distortion: buildProto("distortion", [""], 1) };
        });

        test("countProtoBlocks counts distortion", () => {
            expect(palettes.countProtoBlocks("tone")).toBe(1);
        });

        test("makeBlockInfo label for distortion", () => {
            const info = getInfo(palettes, "distortion", [40]);
            expect(info.label).toBe("distortion");
        });

        test("distortion artwork64 is valid data URI", () => {
            const info = getInfo(palettes, "distortion", [40]);
            expect(info.artwork64).toMatch(/^data:image\/svg\+xml;base64,/);
        });
    });

    // ── 6. tremolo block ─────────────────────────────────────────────────────

    describe("tremolo block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { tremolo: buildProto("tremolo", [""], 2) };
        });

        test("countProtoBlocks counts tremolo", () => {
            expect(palettes.countProtoBlocks("tone")).toBe(1);
        });

        test("makeBlockInfo label for tremolo", () => {
            const info = getInfo(palettes, "tremolo", [10, 50]);
            expect(info.label).toBe("tremolo");
        });

        test("tremolo is not disabled by default", () => {
            expect(buildProto("tremolo").disabled).toBe(false);
        });
    });

    // ── 7. phaser block ──────────────────────────────────────────────────────

    describe("phaser block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { phaser: buildProto("phaser", [""], 3) };
        });

        test("countProtoBlocks counts phaser", () => {
            expect(palettes.countProtoBlocks("tone")).toBe(1);
        });

        test("makeBlockInfo label for phaser", () => {
            const info = getInfo(palettes, "phaser", [0.5, 3, 392]);
            expect(info.label).toBe("phaser");
        });

        test("phaser artwork contains tone fill", () => {
            const info = getInfo(palettes, "phaser", [0.5, 3, 392]);
            expect(info.artwork).toContain("tone_fill");
        });
    });

    // ── 8. neighbor2 block ───────────────────────────────────────────────────

    describe("neighbor2 block (Neighbor note)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { neighbor2: buildProto("neighbor2", [""], 2) };
        });

        test("countProtoBlocks counts neighbor2", () => {
            expect(palettes.countProtoBlocks("tone")).toBe(1);
        });

        test("makeBlockInfo label for neighbor2", () => {
            const info = getInfo(palettes, "neighbor2", [1, 1]);
            expect(info.label).toBe("neighbor2");
        });

        test("neighbor2 artwork is not empty", () => {
            const info = getInfo(palettes, "neighbor2", [1, 1]);
            expect(info.artwork.length).toBeGreaterThan(0);
        });
    });

    // ── 9. setvoice block ────────────────────────────────────────────────────

    describe("setvoice block (voicename label mapping)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { voicename: buildProto("voicename") };
        });

        test("countProtoBlocks counts voicename in tone palette", () => {
            expect(palettes.countProtoBlocks("tone")).toBe(1);
        });

        test("makeBlockInfo returns voice name label for voicename block", () => {
            const info = getInfo(palettes, "voicename", []);
            expect(info.label).toBe("voice name");
        });
    });

    // ── 10. All tone beginner blocks together ─────────────────────────────────

    describe("All tone beginner blocks together", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                settimbre: buildProto("settimbre", [""], 1),
                vibrato: buildProto("vibrato", [""], 2),
                chorus: buildProto("chorus", [""], 3),
                distortion: buildProto("distortion", [""], 1),
                tremolo: buildProto("tremolo", [""], 2),
                phaser: buildProto("phaser", [""], 3),
                neighbor2: buildProto("neighbor2", [""], 2),
                voicename: buildProto("voicename")
            };
        });

        test("countProtoBlocks returns 8 for all beginner tone blocks", () => {
            expect(palettes.countProtoBlocks("tone")).toBe(8);
        });

        test("countProtoBlocks returns 0 for rhythm palette with tone blocks", () => {
            expect(palettes.countProtoBlocks("rhythm")).toBe(0);
        });

        test("countProtoBlocks returns 0 for empty protoBlockDict", () => {
            mockActivity.blocks.protoBlockDict = {};
            expect(palettes.countProtoBlocks("tone")).toBe(0);
        });

        test("blocks with null palette excluded from tone count", () => {
            mockActivity.blocks.protoBlockDict = {
                settimbre: buildProto("settimbre"),
                broken: { palette: null, name: "broken", hidden: false }
            };
            expect(palettes.countProtoBlocks("tone")).toBe(1);
        });
    });

    // ── 11. Disabled tone block ───────────────────────────────────────────────

    describe("Disabled tone block handling", () => {
        test("disabled settimbre uses disabled_fill and disabled_stroke", () => {
            mockActivity.blocks.protoBlockDict = {
                settimbre: buildProto("settimbre", [""], 1, true)
            };
            const info = getInfo(palettes, "settimbre", ["guitar"]);
            expect(info.artwork).toContain("disabled_fill");
            expect(info.artwork).toContain("disabled_stroke");
        });

        test("enabled settimbre does NOT use disabled colors", () => {
            mockActivity.blocks.protoBlockDict = {
                settimbre: buildProto("settimbre", [""], 1, false)
            };
            const info = getInfo(palettes, "settimbre", ["guitar"]);
            expect(info.artwork).not.toContain("disabled_fill");
        });
    });

    // ── 12. getProtoNameAndPalette for tone blocks ────────────────────────────

    describe("getProtoNameAndPalette for tone blocks", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                settimbre: { name: "settimbre", palette: { name: "tone" }, hidden: false }
            };
        });

        test("returns correct name and palette for settimbre", () => {
            const result = palettes.getProtoNameAndPalette("settimbre");
            expect(result[0]).toBe("settimbre");
            expect(result[1]).toBe("tone");
        });

        test("returns nulls for non-existent tone block", () => {
            const result = palettes.getProtoNameAndPalette("nonexistent");
            expect(result).toEqual([null, null, null]);
        });

        test("skips hidden tone blocks", () => {
            mockActivity.blocks.protoBlockDict = {
                settimbre: { name: "settimbre", palette: { name: "tone" }, hidden: true }
            };
            const result = palettes.getProtoNameAndPalette("settimbre");
            expect(result).toEqual([null, null, null]);
        });
    });

    // ── 13. Deduplication ─────────────────────────────────────────────────────

    describe("Tone palette deduplication", () => {
        test("adding same tone block twice stores it only once", () => {
            const palette = palettes.dict["tone"];
            const proto = buildProto("settimbre");
            palette.add(proto);
            palette.add(proto);
            expect(palette.protoList.length).toBe(1);
        });

        test("adding 3 different tone blocks stores all 3", () => {
            const palette = palettes.dict["tone"];
            palette.add(buildProto("settimbre"));
            palette.add(buildProto("vibrato"));
            palette.add(buildProto("chorus"));
            expect(palette.protoList.length).toBe(3);
        });
    });
});
