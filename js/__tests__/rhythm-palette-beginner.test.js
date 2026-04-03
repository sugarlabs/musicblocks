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
 * Test suite for Rhythm Palette — Beginner level blocks
 * Covers: newnote, rhythmicdot, tie, rest, tuplet4, setmasterbpm2
 * Part of issue #5607 — Music Blocks test suite project
 */

const { Palettes } = require("../palette");

// ─── Global mocks (same pattern as palette.test.js) ────────────────────────

global.LEADING = 10;
global.DEFAULTPALETTE = "rhythm";
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
global.PALETTEFILLCOLORS = { rhythm: "rhythm_fill", test: "test_fill" };
global.PALETTESTROKECOLORS = { rhythm: "rhythm_stroke", test: "test_stroke" };
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

// ─── Shared mockActivity factory ────────────────────────────────────────────

function buildMockActivity(overrides = {}) {
    return {
        cellSize: 50,
        blocks: {
            protoBlockDict: {},
            makeBlock: jest.fn(() => ({}))
        },
        hideSearchWidget: jest.fn(),
        showSearchWidget: jest.fn(),
        palettes: {},
        beginnerMode: false,
        ...overrides
    };
}

// ─── Shared DOM mock helper (matches palette.test.js beforeEach pattern) ────

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
        body: {
            appendChild: jest.fn(),
            style: { cursor: "default" }
        }
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
        if (id === "palette") {
            return {
                style: { visibility: "visible", top: "100px" },
                setAttribute: jest.fn(),
                addEventListener: jest.fn(),
                children: []
            };
        }
        return { style: {}, appendChild: jest.fn(), removeChild: jest.fn() };
    });
}

// ─── Rhythm block proto builder ─────────────────────────────────────────────

function buildProto(name, staticLabels = [""], args = 0, disabled = false) {
    return {
        name,
        palette: { name: "rhythm" },
        staticLabels,
        args,
        generator: jest.fn(() => ["fill_color stroke_color block_label arg_label_0", [], null, 12]),
        scale: 1,
        image: false,
        disabled
    };
}

// ════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ════════════════════════════════════════════════════════════════════════════

describe("Rhythm Palette — Beginner Blocks", () => {
    let mockActivity;
    let palettes;

    beforeEach(() => {
        setupDocMocks();
        mockActivity = buildMockActivity();
        palettes = new Palettes(mockActivity);
        palettes.add("rhythm");
        global.window = { btoa: jest.fn(str => str) };
    });

    // ── 1. Palette registration ────────────────────────────────────────────

    describe("Palette registration", () => {
        test("rhythm palette is added to palettes dict", () => {
            expect(palettes.dict["rhythm"]).toBeDefined();
        });

        test("rhythm palette has an empty protoList on creation", () => {
            expect(palettes.dict["rhythm"].protoList).toEqual([]);
        });

        test("rhythm palette has a model with a blocks array", () => {
            expect(Array.isArray(palettes.dict["rhythm"].model.blocks)).toBe(true);
        });
    });

    // ── 2. newnote block ──────────────────────────────────────────────────

    describe("newnote block (Note value)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { newnote: buildProto("newnote", [""], 2) };
        });

        test("countProtoBlocks counts newnote in rhythm palette", () => {
            const count = palettes.countProtoBlocks("rhythm");
            expect(count).toBe(1);
        });

        test("makeBlockInfo returns correct label for newnote", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "newnote",
                    defaults: [1 / 4],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "newnote",
                "newnote"
            );
            // label falls back to blkname when staticLabel is empty
            expect(info.label).toBe("newnote");
        });

        test("makeBlockInfo artwork contains rhythm fill color", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "newnote",
                    defaults: [1 / 4],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "newnote",
                "newnote"
            );
            expect(info.artwork).toContain("rhythm_fill");
        });

        test("newnote is not hidden", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "newnote",
                    defaults: [1 / 4],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "newnote",
                "newnote"
            );
            expect(info.hidden).toBe(false);
        });

        test("newnote artwork contains base64 data URI", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "newnote",
                    defaults: [1 / 4],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "newnote",
                "newnote"
            );
            expect(info.artwork64).toContain("data:image/svg+xml;base64,");
        });
    });

    // ── 3. rhythmicdot block ──────────────────────────────────────────────

    describe("rhythmicdot block (Dotted note)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { rhythmicdot: buildProto("rhythmicdot") };
        });

        test("countProtoBlocks counts rhythmicdot in rhythm palette", () => {
            expect(palettes.countProtoBlocks("rhythm")).toBe(1);
        });

        test("makeBlockInfo returns label for rhythmicdot", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "rhythmicdot",
                    defaults: [],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "rhythmicdot",
                "rhythmicdot"
            );
            expect(info.label).toBe("rhythmicdot");
        });

        test("rhythmicdot artwork is not empty", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "rhythmicdot",
                    defaults: [],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "rhythmicdot",
                "rhythmicdot"
            );
            expect(info.artwork.length).toBeGreaterThan(0);
        });
    });

    // ── 4. tie block ─────────────────────────────────────────────────────

    describe("tie block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { tie: buildProto("tie") };
        });

        test("countProtoBlocks counts tie in rhythm palette", () => {
            expect(palettes.countProtoBlocks("rhythm")).toBe(1);
        });

        test("makeBlockInfo label for tie falls back to blkname", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "tie",
                    defaults: [],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "tie",
                "tie"
            );
            expect(info.label).toBe("tie");
        });

        test("tie block is not disabled", () => {
            const palette = palettes.dict["rhythm"];
            const proto = buildProto("tie");
            expect(proto.disabled).toBe(false);
        });
    });

    // ── 5. rest2 block ────────────────────────────────────────────────────

    describe("rest2 block (Rest)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { rest2: buildProto("rest2") };
        });

        test("countProtoBlocks counts rest2 in rhythm palette", () => {
            expect(palettes.countProtoBlocks("rhythm")).toBe(1);
        });

        test("makeBlockInfo label for rest2", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "rest2",
                    defaults: [],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "rest2",
                "rest2"
            );
            expect(info.label).toBe("rest2");
        });

        test("rest2 artwork contains fill color", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "rest2",
                    defaults: [],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "rest2",
                "rest2"
            );
            expect(info.artwork).toContain("rhythm_fill");
        });
    });

    // ── 6. tuplet4 block ──────────────────────────────────────────────────

    describe("tuplet4 block (Tuplet)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = { tuplet4: buildProto("tuplet4", [""], 2) };
        });

        test("countProtoBlocks counts tuplet4 in rhythm palette", () => {
            expect(palettes.countProtoBlocks("rhythm")).toBe(1);
        });

        test("makeBlockInfo label for tuplet4", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "tuplet4",
                    defaults: [1, 3],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "tuplet4",
                "tuplet4"
            );
            expect(info.label).toBe("tuplet4");
        });

        test("tuplet4 artwork64 is a valid base64 data URI", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "tuplet4",
                    defaults: [1, 3],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "tuplet4",
                "tuplet4"
            );
            expect(info.artwork64).toMatch(/^data:image\/svg\+xml;base64,/);
        });
    });

    // ── 7. setmasterbpm2 block ────────────────────────────────────────────

    describe("setmasterbpm2 block (Master beats per minute)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                setmasterbpm2: buildProto("setmasterbpm2", [""], 2)
            };
        });

        test("countProtoBlocks counts setmasterbpm2 in rhythm palette", () => {
            expect(palettes.countProtoBlocks("rhythm")).toBe(1);
        });

        test("makeBlockInfo label for setmasterbpm2", () => {
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "setmasterbpm2",
                    defaults: [90, 1 / 4],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "setmasterbpm2",
                "setmasterbpm2"
            );
            expect(info.label).toBe("setmasterbpm2");
        });

        test("setmasterbpm2 is not disabled by default", () => {
            expect(buildProto("setmasterbpm2").disabled).toBe(false);
        });
    });

    // ── 8. Multiple rhythm blocks together ────────────────────────────────

    describe("Multiple rhythm beginner blocks in palette", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                newnote: buildProto("newnote", [""], 2),
                rhythmicdot: buildProto("rhythmicdot"),
                tie: buildProto("tie"),
                rest2: buildProto("rest2"),
                tuplet4: buildProto("tuplet4", [""], 2),
                setmasterbpm2: buildProto("setmasterbpm2", [""], 2)
            };
        });

        test("countProtoBlocks returns 6 for all beginner rhythm blocks", () => {
            expect(palettes.countProtoBlocks("rhythm")).toBe(6);
        });

        test("countProtoBlocks returns 0 for a different palette", () => {
            expect(palettes.countProtoBlocks("pitch")).toBe(0);
        });

        test("countProtoBlocks returns 0 for empty protoBlockDict", () => {
            mockActivity.blocks.protoBlockDict = {};
            expect(palettes.countProtoBlocks("rhythm")).toBe(0);
        });

        test("blocks with null palette are not counted in rhythm", () => {
            mockActivity.blocks.protoBlockDict = {
                newnote: buildProto("newnote"),
                brokenBlock: { palette: null, name: "broken", hidden: false }
            };
            expect(palettes.countProtoBlocks("rhythm")).toBe(1);
        });
    });

    // ── 9. Disabled rhythm block ──────────────────────────────────────────

    describe("Disabled rhythm block handling", () => {
        test("disabled newnote block artwork uses disabled fill color", () => {
            mockActivity.blocks.protoBlockDict = {
                newnote: buildProto("newnote", [""], 2, true) // disabled = true
            };
            const palette = palettes.dict["rhythm"];
            const info = palette.model.makeBlockInfo(
                0,
                {
                    name: "newnote",
                    defaults: [1 / 4],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                },
                "newnote",
                "newnote"
            );
            expect(info.artwork).toContain("disabled_fill");
            expect(info.artwork).toContain("disabled_stroke");
        });
    });

    // ── 10. getProtoNameAndPalette for rhythm blocks ───────────────────────

    describe("getProtoNameAndPalette for rhythm blocks", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                newnote: {
                    name: "newnote",
                    palette: { name: "rhythm" },
                    hidden: false
                }
            };
        });

        test("returns correct name and palette for newnote", () => {
            const result = palettes.getProtoNameAndPalette("newnote");
            expect(result[0]).toBe("newnote");
            expect(result[1]).toBe("rhythm");
        });

        test("returns nulls for a block not in the dict", () => {
            const result = palettes.getProtoNameAndPalette("nonexistent");
            expect(result).toEqual([null, null, null]);
        });

        test("skips hidden rhythm blocks", () => {
            mockActivity.blocks.protoBlockDict = {
                newnote: { name: "newnote", palette: { name: "rhythm" }, hidden: true }
            };
            const result = palettes.getProtoNameAndPalette("newnote");
            expect(result).toEqual([null, null, null]);
        });
    });

    // ── 11. Palette add deduplication ─────────────────────────────────────

    describe("Rhythm palette protoList deduplication", () => {
        test("adding same rhythm protoBlock twice only stores it once", () => {
            const palette = palettes.dict["rhythm"];
            const proto = buildProto("newnote");
            palette.add(proto);
            palette.add(proto);
            expect(palette.protoList.length).toBe(1);
        });

        test("adding two different rhythm blocks stores both", () => {
            const palette = palettes.dict["rhythm"];
            palette.add(buildProto("newnote"));
            palette.add(buildProto("tie"));
            expect(palette.protoList.length).toBe(2);
        });
    });
});
