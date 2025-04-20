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
            style: { visibility: "visible", top: "100px" },
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

        global.document.getElementById = global.docById;
    
        mockActivity = {
            cellSize: 50,
            blocks: {
                protoBlockDict: {
                    "myDo_testAction": {},
                    "myCalc_testAction": {},
                    "myDoArg_testAction": {},
                    "myCalcArg_testAction": {}
                },
                makeBlock: jest.fn(() => ({}))
            },
            hideSearchWidget: jest.fn(),
            showSearchWidget: jest.fn(),
            _hideMenus: jest.fn(),
            showPalette: jest.fn(),
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

    test("setSearch updates blaw", () => {
        let paletteSearch = palettes.setSearch("show","hide");
        expect(paletteSearch.activity.hideSearchWidget).toBe("hide");
        expect(paletteSearch.activity.showSearchWidget).toBe("show");
    });
    test("getSearchPos updates", () => {
        let searchPos = palettes.getSearchPos();
        expect(searchPos).toStrictEqual([palettes.cellSize,palettes.top + palettes.cellSize * 1.75]);
    });
    test("getPluginMacroExpansion updates coordinates and returns the macro object", () => {

        palettes.pluginMacros = {
            myBlock: [
                ["some", "macro", 0, 0]
            ]
        };
      
        const result = palettes.getPluginMacroExpansion("myBlock", 42, 99);
      
        expect(result).toEqual([["some", "macro", 42, 99]]);
    });
      
    test("countProtoBlocks returns the number of protoblocks in the specified palette", () => {

        mockActivity.blocks.protoBlockDict = {
            blockA: { palette: { name: "alpha" } },
            blockB: { palette: { name: "beta" } },
            blockC: { palette: { name: "alpha" } },
            blockD: { palette: null }
        };

        expect(palettes.countProtoBlocks("alpha")).toBe(2);
    });
    test("getProtoNameAndPalette returns correct block info when block is visible", () => {
        palettes.activity = {
            blocks: {
                protoBlockDict: {
                    foo: {
                        name: "foo",
                        hidden: false,
                        palette: { name: "custom" }
                    }
                }
            }
        };
      
        const result = palettes.getProtoNameAndPalette("foo");
      
        expect(result).toEqual(["foo", "custom", "foo"]);
    });
    test("setBlocks sets the blocks and returns the instance", () => {
        
        const mockBlocks = [{ name: "block1" }, { name: "block2" }];
      
        const result = palettes.setBlocks(mockBlocks);
      
        expect(palettes.blocks).toEqual(mockBlocks);
        expect(result).toBe(palettes);
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
    test("add name function check", () => {
        const newPalette = palettes.add("User");
        expect(newPalette.dict.User.name).toBe("User");
    });
    test("_loadPaletteButtonHandler sets event handlers for row", () => {
        palettes.showPalette = jest.fn();
        palettes._hideMenus = jest.fn();

        const mockRow = {
            onmouseover: null,
            onmouseout: null,
            onclick: null,
            onmouseup: null,
            onmouseleave: null,
        };

        mockRow.addEventListener = jest.fn((event, handler) => {
            mockRow[event] = handler;
        });

        palettes._loadPaletteButtonHandler("search", mockRow);

        mockRow.onmouseover();
        expect(document.body.style.cursor).toBe("text");

        mockRow.onclick();
        expect(palettes._hideMenus).toHaveBeenCalled();
        expect(mockActivity.showSearchWidget).toHaveBeenCalled();

        palettes._loadPaletteButtonHandler("palette1", mockRow);
        mockRow.onmouseover();
        expect(document.body.style.cursor).toBe("pointer");

        mockRow.onclick();
        expect(palettes.showPalette).toHaveBeenCalledWith("palette1");

        mockRow.onmouseup();
        expect(document.body.style.cursor).toBe("default");

        mockRow.onmouseleave();
        expect(document.body.style.cursor).toBe("default");
    });

    test("removeActionPrototype removes the correct action block and updates palettes", () => {

        const mockRemove = jest.fn();
        palettes.dict = {
            "action": {
                protoList: [
                    { name: "nameddo", defaults: ["testAction"] },
                    { name: "namedcalc", defaults: ["otherAction"] }
                ],
                remove: mockRemove
            }
        };
    

        palettes.updatePalettes = jest.fn();
    

        palettes.removeActionPrototype("testAction");
    

        expect(mockRemove).toHaveBeenCalledWith(
            { name: "nameddo", defaults: ["testAction"] },
            "testAction"
        );
    


        expect(mockActivity.blocks.protoBlockDict["myDo_testAction"]).toBe(undefined);
        expect(mockActivity.blocks.protoBlockDict["myCalc_testAction"]).toStrictEqual({});
        expect(mockActivity.blocks.protoBlockDict["myDoArg_testAction"]).toStrictEqual({});
        expect(mockActivity.blocks.protoBlockDict["myCalcArg_testAction"]).toStrictEqual({});
    

        expect(palettes.updatePalettes).toHaveBeenCalledWith("action");
    });
    test("deltaY Method Updates Palette Position Correctly", () => {
        const mockStyle = { top: "100px" };
        global.docById = jest.fn((id) => {
            if (id === "palette") {
                return { style: mockStyle };
            }
            return null;
        });

        global.document.getElementById = global.docById;
    
        palettes.deltaY(30);
    
        expect(docById("palette").style.top).toBe("130px");
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
