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
 * Test suite for Action Palette - Beginner level blocks
 * Covers: nameddo, storein, namedbox, namedcalc,
 *         nameddoArg, namedcalcArg, outputtools
 * Part of issue #5607 - Music Blocks test suite project
 */

const { Palettes } = require("../palette");

// ─── Global mocks ─────────────────────────────────────────────────────────────

global.LEADING = 10;
global.DEFAULTPALETTE = "action";
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
global.PALETTEFILLCOLORS = { action: "action_fill", test: "test_fill" };
global.PALETTESTROKECOLORS = { action: "action_stroke", test: "test_stroke" };
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

function buildProto(name, paletteName = "action", staticLabels = [""], args = 0, disabled = false) {
    return {
        name,
        palette: { name: paletteName },
        staticLabels,
        args,
        generator: jest.fn(() => ["fill_color stroke_color block_label arg_label_0", [], null, 12]),
        scale: 1,
        image: false,
        disabled
    };
}

function getInfo(palettes, paletteName, name, defaults = [], staticLabels = [""], hidden = false) {
    const palette = palettes.dict[paletteName];
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

describe("Action Palette - Beginner Blocks", () => {
    let mockActivity;
    let palettes;

    beforeEach(() => {
        setupDocMocks();
        mockActivity = buildMockActivity();
        palettes = new Palettes(mockActivity);
        palettes.add("action");
        global.window = { btoa: jest.fn(str => str) };
    });

    // ── 1. Palette Registration ──────────────────────────────────────────────

    describe("Palette registration", () => {
        test("action palette is added to palettes dict", () => {
            expect(palettes.dict["action"]).toBeDefined();
        });

        test("action palette has empty protoList on creation", () => {
            expect(palettes.dict["action"].protoList).toEqual([]);
        });

        test("action palette model has a blocks array", () => {
            expect(Array.isArray(palettes.dict["action"].model.blocks)).toBe(true);
        });

        test("action palette is independent from other palettes", () => {
            palettes.add("rhythm");
            palettes.add("pitch");
            expect(palettes.dict["action"]).not.toBe(palettes.dict["rhythm"]);
            expect(palettes.dict["action"]).not.toBe(palettes.dict["pitch"]);
        });
    });

    // ── 2. nameddo block ─────────────────────────────────────────────────────

    describe("nameddo block (Action)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                nameddo: buildProto("nameddo", "action", [""], 1)
            };
        });

        test("countProtoBlocks counts nameddo in action palette", () => {
            expect(palettes.countProtoBlocks("action")).toBe(1);
        });

        test("makeBlockInfo label for nameddo defaults to action", () => {
            const info = getInfo(palettes, "action", "nameddo", ["action"]);
            expect(info.label).toBe("action");
        });

        test("nameddo artwork contains action fill color", () => {
            const info = getInfo(palettes, "action", "nameddo", ["action"]);
            expect(info.artwork).toContain("action_fill");
        });

        test("nameddo artwork64 is valid base64 data URI", () => {
            const info = getInfo(palettes, "action", "nameddo", ["action"]);
            expect(info.artwork64).toMatch(/^data:image\/svg\+xml;base64,/);
        });

        test("nameddo block is not hidden by default", () => {
            const info = getInfo(palettes, "action", "nameddo", ["action"]);
            expect(info.hidden).toBe(false);
        });

        test("nameddo with undefined default falls back to blkname", () => {
            const info = getInfo(palettes, "action", "nameddo", [undefined]);
            expect(info.label).toBe("nameddo");
        });
    });

    // ── 3. storein block ─────────────────────────────────────────────────────

    describe("storein block (Store in box)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                storein: buildProto("storein", "action", ["store in box"], 2)
            };
        });

        test("countProtoBlocks counts storein in action palette", () => {
            expect(palettes.countProtoBlocks("action")).toBe(1);
        });

        test("makeBlockInfo label for storein", () => {
            const info = getInfo(palettes, "action", "storein", ["box"], "store in box".split(" "));
            expect(typeof info.label).toBe("string");
        });

        test("storein artwork contains action fill color", () => {
            const info = getInfo(palettes, "action", "storein", ["box"]);
            expect(info.artwork).toContain("action_fill");
        });

        test("storein is not disabled by default", () => {
            expect(buildProto("storein").disabled).toBe(false);
        });
    });

    // ── 4. namedbox block ────────────────────────────────────────────────────

    describe("namedbox block (Box)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                namedbox: buildProto("namedbox", "action", [""], 1)
            };
        });

        test("countProtoBlocks counts namedbox in action palette", () => {
            expect(palettes.countProtoBlocks("action")).toBe(1);
        });

        test("makeBlockInfo label for namedbox with undefined default", () => {
            const info = getInfo(palettes, "action", "namedbox", [undefined]);
            expect(info.label).toBe("namedbox");
        });

        test("namedbox artwork is not empty", () => {
            const info = getInfo(palettes, "action", "namedbox", [undefined]);
            expect(info.artwork.length).toBeGreaterThan(0);
        });

        test("namedbox artwork64 is valid data URI", () => {
            const info = getInfo(palettes, "action", "namedbox", [undefined]);
            expect(info.artwork64).toMatch(/^data:image\/svg\+xml;base64,/);
        });
    });

    // ── 5. namedcalc block ───────────────────────────────────────────────────

    describe("namedcalc block (Function)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                namedcalc: buildProto("namedcalc", "action", [""], 1)
            };
        });

        test("countProtoBlocks counts namedcalc in action palette", () => {
            expect(palettes.countProtoBlocks("action")).toBe(1);
        });

        test("makeBlockInfo label for namedcalc with undefined default", () => {
            const info = getInfo(palettes, "action", "namedcalc", [undefined]);
            expect(info.label).toBe("namedcalc");
        });

        test("namedcalc is not disabled by default", () => {
            expect(buildProto("namedcalc").disabled).toBe(false);
        });
    });

    // ── 6. nameddoArg block ──────────────────────────────────────────────────

    describe("nameddoArg block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                nameddoArg: buildProto("nameddoArg", "action", [""], 2)
            };
        });

        test("countProtoBlocks counts nameddoArg in action palette", () => {
            expect(palettes.countProtoBlocks("action")).toBe(1);
        });

        test("makeBlockInfo label for nameddoArg", () => {
            const info = getInfo(palettes, "action", "nameddoArg", [undefined]);
            expect(info.label).toBe("nameddoArg");
        });

        test("nameddoArg artwork contains fill color", () => {
            const info = getInfo(palettes, "action", "nameddoArg", [undefined]);
            expect(info.artwork).toContain("action_fill");
        });
    });

    // ── 7. namedcalcArg block ────────────────────────────────────────────────

    describe("namedcalcArg block", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                namedcalcArg: buildProto("namedcalcArg", "action", [""], 2)
            };
        });

        test("countProtoBlocks counts namedcalcArg in action palette", () => {
            expect(palettes.countProtoBlocks("action")).toBe(1);
        });

        test("makeBlockInfo label for namedcalcArg", () => {
            const info = getInfo(palettes, "action", "namedcalcArg", [undefined]);
            expect(info.label).toBe("namedcalcArg");
        });

        test("namedcalcArg artwork64 is valid data URI", () => {
            const info = getInfo(palettes, "action", "namedcalcArg", [undefined]);
            expect(info.artwork64).toMatch(/^data:image\/svg\+xml;base64,/);
        });
    });

    // ── 8. outputtools block (pitch converter) ───────────────────────────────

    describe("outputtools block (pitch converter label)", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                outputtools: buildProto("outputtools", "action", [""], 1)
            };
        });

        test("countProtoBlocks counts outputtools in action palette", () => {
            expect(palettes.countProtoBlocks("action")).toBe(1);
        });

        test("makeBlockInfo returns pitch converter label for outputtools", () => {
            const info = getInfo(palettes, "action", "outputtools", ["letter class"]);
            expect(info.label).toBe("pitch converter");
        });

        test("outputtools artwork contains fill color", () => {
            const info = getInfo(palettes, "action", "outputtools", ["letter class"]);
            expect(info.artwork).toContain("action_fill");
        });
    });

    // ── 9. All action beginner blocks together ────────────────────────────────

    describe("All action beginner blocks together", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                nameddo: buildProto("nameddo", "action", [""], 1),
                storein: buildProto("storein", "action", ["store in box"], 2),
                namedbox: buildProto("namedbox", "action", [""], 1),
                namedcalc: buildProto("namedcalc", "action", [""], 1),
                nameddoArg: buildProto("nameddoArg", "action", [""], 2),
                namedcalcArg: buildProto("namedcalcArg", "action", [""], 2),
                outputtools: buildProto("outputtools", "action", [""], 1)
            };
        });

        test("countProtoBlocks returns 7 for all beginner action blocks", () => {
            expect(palettes.countProtoBlocks("action")).toBe(7);
        });

        test("countProtoBlocks returns 0 for rhythm palette", () => {
            expect(palettes.countProtoBlocks("rhythm")).toBe(0);
        });

        test("countProtoBlocks returns 0 for empty protoBlockDict", () => {
            mockActivity.blocks.protoBlockDict = {};
            expect(palettes.countProtoBlocks("action")).toBe(0);
        });

        test("blocks with null palette excluded from action count", () => {
            mockActivity.blocks.protoBlockDict = {
                nameddo: buildProto("nameddo", "action"),
                broken: { palette: null, name: "broken", hidden: false }
            };
            expect(palettes.countProtoBlocks("action")).toBe(1);
        });
    });

    // ── 10. Disabled action block ─────────────────────────────────────────────

    describe("Disabled action block handling", () => {
        test("disabled nameddo uses disabled_fill and disabled_stroke", () => {
            mockActivity.blocks.protoBlockDict = {
                nameddo: buildProto("nameddo", "action", [""], 1, true)
            };
            const info = getInfo(palettes, "action", "nameddo", ["action"]);
            expect(info.artwork).toContain("disabled_fill");
            expect(info.artwork).toContain("disabled_stroke");
        });

        test("enabled nameddo does NOT use disabled colors", () => {
            mockActivity.blocks.protoBlockDict = {
                nameddo: buildProto("nameddo", "action", [""], 1, false)
            };
            const info = getInfo(palettes, "action", "nameddo", ["action"]);
            expect(info.artwork).not.toContain("disabled_fill");
        });
    });

    // ── 11. getProtoNameAndPalette for action blocks ──────────────────────────

    describe("getProtoNameAndPalette for action blocks", () => {
        beforeEach(() => {
            mockActivity.blocks.protoBlockDict = {
                nameddo: { name: "nameddo", palette: { name: "action" }, hidden: false }
            };
        });

        test("returns correct name and palette for nameddo", () => {
            const result = palettes.getProtoNameAndPalette("nameddo");
            expect(result[0]).toBe("nameddo");
            expect(result[1]).toBe("action");
        });

        test("returns nulls for non-existent action block", () => {
            const result = palettes.getProtoNameAndPalette("nonexistent");
            expect(result).toEqual([null, null, null]);
        });

        test("skips hidden action blocks", () => {
            mockActivity.blocks.protoBlockDict = {
                nameddo: { name: "nameddo", palette: { name: "action" }, hidden: true }
            };
            const result = palettes.getProtoNameAndPalette("nameddo");
            expect(result).toEqual([null, null, null]);
        });
    });

    // ── 12. Deduplication ─────────────────────────────────────────────────────

    describe("Action palette deduplication", () => {
        test("adding same action block twice stores it only once", () => {
            const palette = palettes.dict["action"];
            const proto = buildProto("nameddo");
            palette.add(proto);
            palette.add(proto);
            expect(palette.protoList.length).toBe(1);
        });

        test("adding 4 different action blocks stores all 4", () => {
            const palette = palettes.dict["action"];
            palette.add(buildProto("nameddo"));
            palette.add(buildProto("storein"));
            palette.add(buildProto("namedbox"));
            palette.add(buildProto("namedcalc"));
            expect(palette.protoList.length).toBe(4);
        });
    });
});
