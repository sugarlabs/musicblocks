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

const { Palettes, initPalettes } = require("../palette");

global.LEADING = 10;
global.DEFAULTPALETTE = "default";
global.MULTIPALETTES = ["palette1", "palette2"];
global.PALETTEICONS = { "search": "<svg></svg>", "palette1": "<svg></svg>", "palette2": "<svg></svg>" };
global.MULTIPALETTEICONS = ["palette1", "palette2"];
global.SKIPPALETTES = [];
global.toTitleCase = (str) => str.charAt(0).toUpperCase() + str.slice(1);
global._ = (str) => str;
global.platformColor = {
    selectorSelected: "#000",
    paletteBackground: "#fff",
    strokeColor: "#333",
    fillColor: "#666",
    paletteLabelBackground: "#ccc",
    hoverColor: "#ddd",
    paletteText: "#000"
};

describe("Palettes Class", () => {
    let mockActivity;
    let palettes;

    beforeEach(() => {
        const paletteMock = {
            style: { visibility: "visible" },
            children: [
                {
                    children: [
                        {},
                        {
                            children: [
                                {},
                                {
                                    parentNode: { removeChild: jest.fn() },
                                    appendChild: jest.fn(() => ({})),
                                }
                            ]
                        }
                    ]
                }
            ]
        };

        global.docById = jest.fn((id) => {
            if (id === "PaletteBody") {
                return { parentNode: { removeChild: jest.fn() } };
            }
            if (id === "palette") {
                return {
                    ...paletteMock,
                    children: [
                        { children: [{}, { children: [{}, { removeChild: jest.fn(), appendChild: jest.fn(() => ({})) }] }] }
                    ],
                };
            }
            return { style: {}, appendChild: jest.fn(), removeChild: jest.fn() };
        });
    
        mockActivity = {
            cellSize: 50,
            blocks: { protoBlockDict: {}, makeBlock: jest.fn(() => ({})) },
            hideSearchWidget: jest.fn(),
            showSearchWidget: jest.fn(),
            palettes: {},
        };
        
        palettes = new Palettes(mockActivity);
    });

    test("constructor initializes properties correctly", () => {
        expect(palettes.activity).toBe(mockActivity);
        expect(palettes.cellSize).toBe(Math.floor(50 * 0.5 + 0.5));
    });

    test("init method sets halfCellSize", () => {
        palettes.init();
        expect(palettes.halfCellSize).toBe(Math.floor(palettes.cellSize / 2));
    });

    test("setSize updates cellSize", () => {
        palettes.setSize(100);
        expect(palettes.cellSize).toBe(Math.floor(100 * 0.5 + 0.5));
    });

    test("setMobile updates mobile flag and hides menus", () => {
        const spyHideMenus = jest.spyOn(palettes, "_hideMenus");
        palettes.setMobile(true);
        expect(palettes.mobile).toBe(true);
        expect(spyHideMenus).toHaveBeenCalled();
    });

    test("getProtoNameAndPalette returns correct values", () => {
        mockActivity.blocks.protoBlockDict = {
            testBlock: { name: "testBlock", palette: { name: "testPalette" }, hidden: false }
        };
        expect(palettes.getProtoNameAndPalette("testBlock")).toEqual(["testBlock", "testPalette", "testBlock"]);
    });

    test("hide and show functions modify visibility", () => {
        palettes.hide();
        console.log("Visibility after hide:", docById("palette").style.visibility);
        expect(docById("palette").style.visibility).toBe("hidden");
        palettes.show();
        console.log("Visibility after show:", docById("palette").style.visibility);
        expect(docById("palette").style.visibility).toBe("visible");
    });
});

describe("initPalettes function", () => {
    let palettes;

    beforeEach(() => {
        palettes = { add: jest.fn(), init_selectors: jest.fn(), makePalettes: jest.fn(), show: jest.fn() };
        global.BUILTINPALETTES = ["default"];
    });

    test("initPalettes initializes palettes correctly", async () => {
        await initPalettes(palettes);
        expect(palettes.add).toHaveBeenCalledWith("default");
        expect(palettes.init_selectors).toHaveBeenCalled();
        expect(palettes.makePalettes).toHaveBeenCalledWith(0);
        expect(palettes.show).toHaveBeenCalled();
    });
});
