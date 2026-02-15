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
    myblocks: "<svg></svg>"
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
    paletteText: "#000"
};
global.base64Encode = str => str;
global.localStorage = { kanaPreference: "default" };

describe("Palettes Class", () => {
    let mockActivity;
    let palettes;

    beforeEach(() => {
        const paletteMock = {
            style: { visibility: "visible", top: "100px" },
            children: [
                {
                    children: [
                        {
                            children: [
                                {
                                    insertCell: jest.fn(() => ({
                                        appendChild: jest.fn(),
                                        style: {}
                                    }))
                                }
                            ]
                        },
                        {
                            children: [
                                {},
                                {
                                    parentNode: { removeChild: jest.fn() },
                                    appendChild: jest.fn(() => ({})),
                                    insertRow: jest.fn(() => ({
                                        insertCell: jest.fn(() => ({
                                            appendChild: jest.fn(),
                                            style: {}
                                        })),
                                        style: {},
                                        addEventListener: jest.fn()
                                    }))
                                }
                            ]
                        }
                    ],
                    style: { border: "" }
                }
            ]
        };

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
            body: {
                appendChild: jest.fn(),
                style: { cursor: "default" }
            }
        };

        global.docById = jest.fn(id => {
            if (id === "PaletteBody") {
                return { parentNode: { removeChild: jest.fn() } };
            }
            if (id === "palette") {
                return {
                    ...paletteMock,
                    children: [
                        {
                            children: [
                                {
                                    children: [
                                        {
                                            insertCell: jest.fn(() => ({
                                                appendChild: jest.fn(),
                                                style: {}
                                            }))
                                        }
                                    ]
                                },
                                {
                                    children: [
                                        {},
                                        {
                                            removeChild: jest.fn(),
                                            appendChild: jest.fn(() => ({})),
                                            parentNode: { removeChild: jest.fn() },
                                            insertRow: jest.fn(() => ({
                                                insertCell: jest.fn(() => ({
                                                    appendChild: jest.fn(),
                                                    style: {},
                                                    textContent: ""
                                                })),
                                                style: {},
                                                addEventListener: jest.fn()
                                            }))
                                        }
                                    ]
                                }
                            ],
                            style: { border: "" }
                        }
                    ]
                };
            }
            return { style: {}, appendChild: jest.fn(), removeChild: jest.fn() };
        });

        mockActivity = {
            cellSize: 50,
            blocks: {
                protoBlockDict: {},
                makeBlock: jest.fn(() => ({}))
            },
            hideSearchWidget: jest.fn(),
            showSearchWidget: jest.fn(),
            palettes: {},
            beginnerMode: false
        };

        palettes = new Palettes(mockActivity);
    });

    describe("Constructor", () => {
        test("initializes properties correctly", () => {
            expect(palettes.activity).toBe(mockActivity);
            expect(palettes.cellSize).toBe(Math.floor(50 * 0.5 + 0.5));
        });

        test("initializes paletteWidth correctly", () => {
            expect(palettes.paletteWidth).toBe(55 * 3);
        });

        test("initializes empty dictionaries", () => {
            expect(palettes.dict).toEqual({});
            expect(palettes.buttons).toEqual({});
            expect(palettes.labels).toEqual({});
        });

        test("initializes default state values", () => {
            expect(palettes.visible).toBe(true);
            expect(palettes.mobile).toBe(false);
            expect(palettes.activePalette).toBeNull();
        });

        test("initializes plugin arrays", () => {
            expect(palettes.pluginMacros).toEqual({});
            expect(palettes.pluginPalettes).toEqual([]);
        });
    });

    describe("init method", () => {
        test("sets halfCellSize", () => {
            palettes.init();
            expect(palettes.halfCellSize).toBe(Math.floor(palettes.cellSize / 2));
        });
    });

    describe("setSize method", () => {
        test("updates cellSize and returns this", () => {
            const result = palettes.setSize(100);
            expect(palettes.cellSize).toBe(Math.floor(100 * 0.5 + 0.5));
            expect(result).toBe(palettes);
        });

        test("handles small sizes", () => {
            palettes.setSize(10);
            expect(palettes.cellSize).toBe(Math.floor(10 * 0.5 + 0.5));
        });

        test("handles large sizes", () => {
            palettes.setSize(200);
            expect(palettes.cellSize).toBe(Math.floor(200 * 0.5 + 0.5));
        });
    });

    describe("setMobile method", () => {
        test("updates mobile flag and hides menus when true", () => {
            const spyHideMenus = jest.spyOn(palettes, "_hideMenus");
            const result = palettes.setMobile(true);

            expect(palettes.mobile).toBe(true);
            expect(spyHideMenus).toHaveBeenCalled();
            expect(result).toBe(palettes);
        });

        test("updates mobile flag but does not hide menus when false", () => {
            const spyHideMenus = jest.spyOn(palettes, "_hideMenus");
            palettes.setMobile(false);

            expect(palettes.mobile).toBe(false);
            expect(spyHideMenus).not.toHaveBeenCalled();
        });
    });

    describe("setSearch method", () => {
        test("sets showSearchWidget and hideSearchWidget on activity", () => {
            const showFn = jest.fn();
            const hideFn = jest.fn();

            const result = palettes.setSearch(showFn, hideFn);

            expect(mockActivity.showSearchWidget).toBe(showFn);
            expect(mockActivity.hideSearchWidget).toBe(hideFn);
            expect(result).toBe(palettes);
        });
    });

    describe("getSearchPos method", () => {
        test("returns correct search position", () => {
            const pos = palettes.getSearchPos();

            expect(pos).toEqual([palettes.cellSize, palettes.top + palettes.cellSize * 1.75]);
        });
    });

    describe("getPluginMacroExpansion method", () => {
        test("returns macro expansion and updates coordinates", () => {
            palettes.pluginMacros = {
                testMacro: [[0, "block", 0, 0, [null]]]
            };

            const result = palettes.getPluginMacroExpansion("testMacro", 100, 200);

            expect(result[0][2]).toBe(100);
            expect(result[0][3]).toBe(200);
        });

        test("returns null for non-existent macro", () => {
            palettes.pluginMacros = {};

            const result = palettes.getPluginMacroExpansion("nonExistent", 0, 0);

            expect(result).toBeUndefined();
        });
    });

    describe("countProtoBlocks method", () => {
        test("counts blocks in a palette", () => {
            mockActivity.blocks.protoBlockDict = {
                block1: { palette: { name: "rhythm" } },
                block2: { palette: { name: "rhythm" } },
                block3: { palette: { name: "pitch" } },
                block4: { palette: null }
            };

            const count = palettes.countProtoBlocks("rhythm");

            expect(count).toBe(2);
        });

        test("returns 0 for empty palette", () => {
            mockActivity.blocks.protoBlockDict = {};

            const count = palettes.countProtoBlocks("rhythm");

            expect(count).toBe(0);
        });

        test("returns 0 for non-existent palette", () => {
            mockActivity.blocks.protoBlockDict = {
                block1: { palette: { name: "rhythm" } }
            };

            const count = palettes.countProtoBlocks("nonExistent");

            expect(count).toBe(0);
        });
    });

    describe("getProtoNameAndPalette method", () => {
        test("returns correct values for existing block by name", () => {
            mockActivity.blocks.protoBlockDict = {
                testBlock: { name: "testBlock", palette: { name: "testPalette" }, hidden: false }
            };

            const result = palettes.getProtoNameAndPalette("testBlock");

            expect(result).toEqual(["testBlock", "testPalette", "testBlock"]);
        });

        test("returns correct values for existing block by key", () => {
            mockActivity.blocks.protoBlockDict = {
                blockKey: { name: "differentName", palette: { name: "testPalette" }, hidden: false }
            };

            const result = palettes.getProtoNameAndPalette("blockKey");

            expect(result).toEqual(["blockKey", "testPalette", "differentName"]);
        });

        test("returns nulls for non-existent block", () => {
            mockActivity.blocks.protoBlockDict = {};

            const result = palettes.getProtoNameAndPalette("nonExistent");

            expect(result).toEqual([null, null, null]);
        });

        test("skips hidden blocks", () => {
            mockActivity.blocks.protoBlockDict = {
                hiddenBlock: { name: "hiddenBlock", palette: { name: "test" }, hidden: true }
            };

            const result = palettes.getProtoNameAndPalette("hiddenBlock");

            expect(result).toEqual([null, null, null]);
        });
    });

    describe("hide and show methods", () => {
        test("hide sets visibility to hidden", () => {
            palettes.hide();
            expect(docById("palette").style.visibility).toBe("hidden");
        });

        test("show sets visibility to visible", () => {
            palettes.show();
            expect(docById("palette").style.visibility).toBe("visible");
        });
    });

    describe("showPalette method", () => {
        test("returns early when mobile is true", () => {
            palettes.mobile = true;
            palettes.dict = {
                testPalette: { showMenu: jest.fn() }
            };

            palettes.showPalette("testPalette");

            expect(palettes.dict.testPalette.showMenu).not.toHaveBeenCalled();
        });

        test("shows palette and sets activePalette when not mobile", () => {
            palettes.mobile = false;
            palettes.dict = {
                testPalette: { showMenu: jest.fn() }
            };

            palettes.showPalette("testPalette");

            expect(palettes.dict.testPalette.showMenu).toHaveBeenCalledWith(true);
            expect(palettes.activePalette).toBe("testPalette");
        });
    });

    describe("_hideMenus method", () => {
        test("calls hideSearchWidget", () => {
            palettes._hideMenus();

            expect(mockActivity.hideSearchWidget).toHaveBeenCalledWith(true);
        });

        test("removes PaletteBody if it exists", () => {
            const mockRemove = jest.fn();
            global.docById = jest.fn(id => {
                if (id === "PaletteBody") {
                    return { parentNode: { removeChild: mockRemove } };
                }
                return null;
            });

            palettes._hideMenus();

            expect(mockRemove).toHaveBeenCalled();
        });
    });

    describe("updatePalettes method", () => {
        test("handles null showPalette parameter", () => {
            palettes.updatePalettes(null);
            // Should not throw
        });

        test("hides and shows palette when it exists and was open", () => {
            const mockHideMenu = jest.fn();
            const mockShow = jest.fn();
            palettes.dict = {
                testPalette: { hideMenu: mockHideMenu, show: mockShow }
            };
            global.docById = jest.fn(id => {
                if (id === "PaletteBody") return {};
                return { style: {} };
            });

            palettes.updatePalettes("testPalette");

            expect(mockHideMenu).toHaveBeenCalled();
            expect(mockShow).toHaveBeenCalled();
        });

        test("hides palette when mobile is true", () => {
            const spyHide = jest.spyOn(palettes, "hide");
            palettes.mobile = true;

            palettes.updatePalettes("test");

            expect(spyHide).toHaveBeenCalled();
        });
    });

    describe("setBlocks method", () => {
        test("sets blocks property and returns this", () => {
            const mockBlocks = { test: true };

            const result = palettes.setBlocks(mockBlocks);

            expect(palettes.blocks).toBe(mockBlocks);
            expect(result).toBe(palettes);
        });
    });

    describe("add method", () => {
        test("adds new palette to dict and returns this", () => {
            const result = palettes.add("newPalette");

            expect(palettes.dict["newPalette"]).toBeDefined();
            expect(result).toBe(palettes);
        });
    });

    describe("removeActionPrototype method", () => {
        test("does not throw when action palette has empty protoList", () => {
            palettes.dict = {
                action: {
                    protoList: []
                }
            };

            expect(() => palettes.removeActionPrototype("nonExistent")).not.toThrow();
        });

        test("does not update when no matching block found", () => {
            const mockUpdatePalettes = jest.spyOn(palettes, "updatePalettes");
            palettes.dict = {
                action: {
                    protoList: [{ name: "someOtherBlock", defaults: ["otherAction"] }]
                }
            };

            palettes.removeActionPrototype("nonExistent");

            expect(mockUpdatePalettes).not.toHaveBeenCalled();
        });
    });

    describe("clear method", () => {
        test("clears dict and resets state", () => {
            // Setup document mock for clear method
            global.document = {
                createElement: jest.fn(() => ({
                    id: "",
                    setAttribute: jest.fn(),
                    classList: { add: jest.fn() },
                    innerHTML: "",
                    childNodes: [{ style: {} }]
                })),
                body: { appendChild: jest.fn() }
            };
            global.docById = jest.fn(id => {
                if (id === "palette") {
                    return { parentNode: { removeChild: jest.fn() } };
                }
                return null;
            });

            palettes.dict = { test: { hideMenu: jest.fn() } };
            palettes.visible = true;
            palettes.activePalette = "test";

            palettes.clear();

            expect(palettes.dict).toEqual({});
            expect(palettes.visible).toBe(false);
            expect(palettes.activePalette).toBeNull();
        });

        test("handles errors gracefully", () => {
            // Make docById throw to test error handling
            global.docById = jest.fn(() => {
                throw new Error("Test error");
            });
            palettes.dict = {};

            // Should not throw due to try-catch
            expect(() => palettes.clear()).not.toThrow();
        });
    });

    describe("getInfo method", () => {
        test("logs info for each palette", () => {
            const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
            palettes.dict = {
                test1: { getInfo: () => "info1" },
                test2: { getInfo: () => "info2" }
            };

            palettes.getInfo();

            expect(consoleSpy).toHaveBeenCalledWith("info1");
            expect(consoleSpy).toHaveBeenCalledWith("info2");

            consoleSpy.mockRestore();
        });
    });
});

describe("initPalettes function", () => {
    let palettes;

    beforeEach(() => {
        palettes = {
            add: jest.fn().mockReturnThis(),
            init_selectors: jest.fn(),
            makePalettes: jest.fn(),
            show: jest.fn()
        };
        global.BUILTINPALETTES = ["rhythm", "pitch", "flow"];
    });

    test("adds all built-in palettes", async () => {
        await initPalettes(palettes);

        expect(palettes.add).toHaveBeenCalledWith("rhythm");
        expect(palettes.add).toHaveBeenCalledWith("pitch");
        expect(palettes.add).toHaveBeenCalledWith("flow");
    });

    test("initializes selectors", async () => {
        await initPalettes(palettes);

        expect(palettes.init_selectors).toHaveBeenCalled();
    });

    test("makes palettes with index 0", async () => {
        await initPalettes(palettes);

        expect(palettes.makePalettes).toHaveBeenCalledWith(0);
    });

    test("shows palettes after initialization", async () => {
        await initPalettes(palettes);

        expect(palettes.show).toHaveBeenCalled();
    });

    test("handles empty BUILTINPALETTES", async () => {
        global.BUILTINPALETTES = [];

        await initPalettes(palettes);

        expect(palettes.add).not.toHaveBeenCalled();
    });
});

describe("Palettes edge cases", () => {
    let mockActivity;
    let palettes;

    beforeEach(() => {
        global.docById = jest.fn(() => ({
            style: { visibility: "visible", top: "100px" }
        }));

        mockActivity = {
            cellSize: 50,
            blocks: { protoBlockDict: {} },
            hideSearchWidget: jest.fn(),
            showSearchWidget: jest.fn(),
            beginnerMode: false
        };

        palettes = new Palettes(mockActivity);
    });

    test("handles beginner mode skipping palettes", () => {
        mockActivity.beginnerMode = true;
        global.SKIPPALETTES = ["heap", "dictionary"];

        // Test that countProtoBlocks works correctly
        mockActivity.blocks.protoBlockDict = {
            block1: { palette: { name: "heap" } }
        };

        const count = palettes.countProtoBlocks("heap");
        expect(count).toBe(1); // countProtoBlocks doesn't skip, makePalettes does
    });

    test("handles null palette in protoBlockDict", () => {
        mockActivity.blocks.protoBlockDict = {
            nullPaletteBlock: { palette: null, name: "test", hidden: false }
        };

        const count = palettes.countProtoBlocks("anyPalette");
        expect(count).toBe(0);
    });

    test("setSize with zero results in zero cellSize", () => {
        palettes.setSize(0);
        expect(palettes.cellSize).toBe(0); // Math.floor(0 * 0.5 + 0.5) = Math.floor(0.5) = 0
    });
});
