/**
 * @license
 * MusicBlocks v3.7.0
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
global.DISABLEDFILLCOLOR = "disabled_fill";
global.DISABLEDSTROKECOLOR = "disabled_stroke";
global.PALETTEFILLCOLORS = { test: "test_fill" };
global.PALETTESTROKECOLORS = { test: "test_stroke" };
global.last = arr => arr[arr.length - 1];
global.getTextWidth = jest.fn(() => 10);
global.STANDARDBLOCKHEIGHT = 18;
global.CLOSEICON = "<svg fill_color></svg>";
global.safeSVG = str => str;
global.blockIsMacro = jest.fn(() => false);
global.getMacroExpansion = jest.fn();

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

    describe("init_selectors method", () => {
        test("creates selector buttons for each multipalette", () => {
            const spyMakeSelectorButton = jest
                .spyOn(palettes, "_makeSelectorButton")
                .mockImplementation(() => {});

            palettes.init_selectors();

            expect(spyMakeSelectorButton).toHaveBeenCalledTimes(MULTIPALETTES.length);
        });
    });

    describe("_makeSelectorButton method", () => {
        test("creates a selector cell and hooks hover handlers", () => {
            const tdMock = { style: {}, appendChild: jest.fn() };
            const trMock = { insertCell: jest.fn(() => tdMock), children: [{}, { children: [] }] };
            const paletteElement = {
                children: [
                    {
                        children: [{ children: [{ children: [trMock] }] }, { children: [{}, {}] }],
                        style: { border: "" }
                    }
                ]
            };

            global.docById = jest.fn(id => (id === "palette" ? paletteElement : null));
            global.document.getElementById = jest.fn(() => null);
            const appendSpy = jest.spyOn(document.body, "appendChild");
            palettes.showSelection = jest.fn();
            palettes.makePalettes = jest.fn();

            palettes._makeSelectorButton(0);

            tdMock.onmouseover();

            expect(trMock.insertCell).toHaveBeenCalled();
            expect(appendSpy).toHaveBeenCalled();
            expect(palettes.showSelection).toHaveBeenCalled();
            expect(palettes.makePalettes).toHaveBeenCalled();
        });
    });

    describe("makeSearchButton method", () => {
        test("sets label styles for kana and default", () => {
            palettes._loadPaletteButtonHandler = jest.fn();
            const icon = {};

            const createListBody = () => {
                const handlers = {};
                const row = {
                    insertCell: jest.fn(),
                    style: {},
                    addEventListener: jest.fn((event, handler) => {
                        handlers[event] = handler;
                    })
                };
                const imgCell = { appendChild: jest.fn(), style: {} };
                const labelCell = { textContent: "", style: {} };
                row.insertCell.mockReturnValueOnce(imgCell).mockReturnValueOnce(labelCell);
                return {
                    listBody: { insertRow: jest.fn(() => row) },
                    row,
                    labelCell
                };
            };

            global.localStorage.kanaPreference = "kana";
            const kanaList = createListBody();
            palettes.makeSearchButton("search", icon, kanaList.listBody);
            expect(kanaList.labelCell.style.fontSize).toBe("12px");

            global.localStorage.kanaPreference = "default";
            const defaultList = createListBody();
            palettes.makeSearchButton("search", icon, defaultList.listBody);
            expect(defaultList.labelCell.style.fontSize).toBe("16px");
        });
    });

    describe("makeButton method", () => {
        test("adds hover handlers and sets label styles", () => {
            palettes._loadPaletteButtonHandler = jest.fn();
            const icon = {};

            const createListBody = () => {
                const handlers = {};
                const row = {
                    insertCell: jest.fn(),
                    style: {},
                    addEventListener: jest.fn((event, handler) => {
                        handlers[event] = handler;
                    })
                };
                const imgCell = { appendChild: jest.fn(), style: {} };
                const labelCell = { textContent: "", style: {} };
                row.insertCell.mockReturnValueOnce(imgCell).mockReturnValueOnce(labelCell);
                return {
                    listBody: { insertRow: jest.fn(() => row) },
                    row,
                    labelCell,
                    handlers
                };
            };

            global.localStorage.kanaPreference = "kana";
            const kanaList = createListBody();
            palettes.makeButton("rhythm", icon, kanaList.listBody);
            kanaList.handlers.mouseover();
            expect(kanaList.row.style.backgroundColor).toBe(platformColor.hoverColor);
            kanaList.handlers.mouseout();
            expect(kanaList.row.style.backgroundColor).toBe(platformColor.paletteBackground);
            expect(kanaList.labelCell.style.fontSize).toBe("12px");

            global.localStorage.kanaPreference = "default";
            const defaultList = createListBody();
            palettes.makeButton("rhythm", icon, defaultList.listBody);
            expect(defaultList.labelCell.style.fontSize).toBe("16px");
        });
    });

    describe("deltaY method", () => {
        test("adjusts palette top position", () => {
            const paletteElement = { style: { top: "100px" } };
            global.document.getElementById = jest.fn(() => paletteElement);

            palettes.deltaY(20);

            expect(paletteElement.style.top).toBe("120px");
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

    describe("PaletteModel makeBlockInfo", () => {
        test("update rebuilds blocks list", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = { name: "box" };
            palette.protoList = [block];
            palette.model.makeBlockInfo = jest.fn(() => ({ blk: 0 }));

            palette.model.update();

            expect(palette.model.blocks).toHaveLength(1);
            expect(palette.model.makeBlockInfo).toHaveBeenCalledWith("0", block, "box", "box");
        });

        test("builds artwork and label for storein", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "storein",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { storein: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "storein",
                defaults: [_("box")],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "storein", "storein");

            expect(info.label).toBe("store in");
            expect(info.artwork).toContain("test_fill");
            expect(info.artwork64).toContain("data:image/svg+xml;base64,");
        });

        test("uses disabled colors for disabled blocks", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "box",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: true
            };
            mockActivity.blocks.protoBlockDict = { box: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "box",
                defaults: ["box1"],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "box", "box");

            expect(info.artwork).toContain("disabled_fill");
            expect(info.artwork).toContain("disabled_stroke");
        });

        test("truncates long labels for nameddo", () => {
            const originalGetTextWidth = global.getTextWidth;
            global.getTextWidth = jest.fn(() => TEXTWIDTH + 1);
            global.window = { btoa: jest.fn(str => str) };

            const protoBlock = {
                name: "nameddo",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { nameddo: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "nameddo",
                defaults: ["averylongactionname"],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "nameddo", "nameddo");

            expect(info.label.endsWith("...")).toBe(true);
            global.getTextWidth = originalGetTextWidth;
        });

        test("clears label for image blocks", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "box",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: true,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { box: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "box",
                defaults: ["box1"],
                staticLabels: [""],
                image: true,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "box", "box");

            expect(info.label).toBe("");
        });

        test("handles storein2 and namedarg defaults", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "storein2",
                palette: { name: "test" },
                staticLabels: ["mybox"],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            const protoNamedArg = {
                name: "namedarg",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = {
                storein2: protoBlock,
                namedarg: protoNamedArg
            };
            palettes.add("test");
            const palette = palettes.dict.test;

            const storeBlock = {
                name: "storein2",
                defaults: ["boxA"],
                staticLabels: ["store in box"],
                image: false,
                scale: 1,
                hidden: false
            };
            const namedArgBlock = {
                name: "namedarg",
                defaults: [undefined],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };

            const storeInfo = palette.model.makeBlockInfo(0, storeBlock, "storein2", "storein2");
            const argInfo = palette.model.makeBlockInfo(1, namedArgBlock, "namedarg", "namedarg");

            expect(storeInfo.label).toBe("store in box");
            expect(argInfo.label).toBe("arg 1");
        });

        test("handles nameddoArg and namedcalc defaults", () => {
            global.window = { btoa: jest.fn(str => str) };
            const buildProto = name => ({
                name,
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            });

            const protoNamedDoArg = buildProto("nameddoArg");
            const protoNamedCalc = buildProto("namedcalc");
            const protoNamedCalcArg = buildProto("namedcalcArg");

            mockActivity.blocks.protoBlockDict = {
                nameddoArg: protoNamedDoArg,
                namedcalc: protoNamedCalc,
                namedcalcArg: protoNamedCalcArg
            };
            palettes.add("test");
            const palette = palettes.dict.test;

            const namedDoArg = {
                name: "nameddoArg",
                defaults: [undefined],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };
            const namedCalc = {
                name: "namedcalc",
                defaults: [undefined],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };
            const namedCalcArg = {
                name: "namedcalcArg",
                defaults: [undefined],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };

            const doArgInfo = palette.model.makeBlockInfo(
                0,
                namedDoArg,
                "nameddoArg",
                "nameddoArg"
            );
            const calcInfo = palette.model.makeBlockInfo(1, namedCalc, "namedcalc", "namedcalc");
            const calcArgInfo = palette.model.makeBlockInfo(
                2,
                namedCalcArg,
                "namedcalcArg",
                "namedcalcArg"
            );

            expect(doArgInfo.label).toBe("nameddoArg");
            expect(calcInfo.label).toBe("namedcalc");
            expect(calcArgInfo.label).toBe("namedcalcArg");
        });

        test("uses outputtools label", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "outputtools",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { outputtools: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "outputtools",
                defaults: [""],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "outputtools", "outputtools");

            expect(info.label).toBe("pitch converter");
        });

        test("uses staticLabels for comparison blocks", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "less",
                palette: { name: "test" },
                staticLabels: ["<"],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { less: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "less",
                defaults: [""],
                staticLabels: ["<"],
                image: false,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "less", "less");

            expect(info.label).toBe("<");
        });

        test("maps labels for common block names", () => {
            global.window = { btoa: jest.fn(str => str) };
            const labelCases = [
                ["grid", "grid"],
                ["text", "text"],
                ["drumname", "drum"],
                ["effectsname", "effect"],
                ["solfege", "sol"],
                ["eastindiansolfege", "sargam"],
                ["scaledegree2", "scale degree"],
                ["modename", "mode name"],
                ["invertmode", "invert mode"],
                ["voicename", "voice name"],
                ["customNote", "custom pitch"],
                ["temperamentname", "temperament"],
                ["accidentalname", "accidental"],
                ["notename", "G"],
                ["intervalname", "interval name"],
                ["boolean", "true"],
                ["number", "1"],
                ["outputtools", "pitch converter"]
            ];

            palettes.add("test");
            const palette = palettes.dict.test;

            labelCases.forEach(([name, expected]) => {
                const protoBlock = {
                    name,
                    palette: { name: "test" },
                    staticLabels: [""],
                    args: 0,
                    generator: jest.fn(() => [
                        "fill_color stroke_color block_label arg_label_0",
                        [],
                        null,
                        12
                    ]),
                    scale: 1,
                    image: false,
                    disabled: false
                };
                mockActivity.blocks.protoBlockDict = { [name]: protoBlock };
                const block = {
                    name,
                    defaults: [""],
                    staticLabels: [""],
                    image: false,
                    scale: 1,
                    hidden: false
                };

                const info = palette.model.makeBlockInfo(0, block, name, name);
                expect(info.label).toBe(expected);
            });
        });

        test("handles loadFile default label and custom modname", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoLoad = {
                name: "loadFile",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            const protoCustom = {
                name: "box",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { loadFile: protoLoad, box: protoCustom };
            palettes.add("test");
            const palette = palettes.dict.test;

            const loadBlock = {
                name: "loadFile",
                defaults: [""],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };
            const customBlock = {
                name: "box",
                defaults: ["custom"],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };

            const loadInfo = palette.model.makeBlockInfo(0, loadBlock, "loadFile", "loadFile");
            const customInfo = palette.model.makeBlockInfo(1, customBlock, "box", "custom");

            expect(loadInfo.label).toBe("open file");
            expect(customInfo.label).toBe("custom");
        });

        test("storein2 uses alternate label when not store in box", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "storein2",
                palette: { name: "test" },
                staticLabels: ["boxB"],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { storein2: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "storein2",
                defaults: ["boxB"],
                staticLabels: ["boxB"],
                image: false,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "storein2", "storein2");

            expect(info.label).toBe("store in boxB");
        });

        test("falls back to blkname when label is empty", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "custom",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { custom: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "custom",
                defaults: [""],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "custom", "custom");

            expect(info.label).toBe("custom");
        });

        test("replaces argument labels for multiple args", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "box",
                palette: { name: "test" },
                staticLabels: ["a0", "a1"],
                args: 1,
                generator: jest.fn(() => ["arg_label_0 arg_label_1", [], null, 12]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { box: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "box",
                defaults: ["box1"],
                staticLabels: ["a0", "a1"],
                image: false,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "box", "box");

            expect(info.artwork).toContain("a1");
        });

        test("handles namedbox with undefined default", () => {
            global.window = { btoa: jest.fn(str => str) };
            const protoBlock = {
                name: "namedbox",
                palette: { name: "test" },
                staticLabels: [""],
                args: 0,
                generator: jest.fn(() => [
                    "fill_color stroke_color block_label arg_label_0",
                    [],
                    null,
                    12
                ]),
                scale: 1,
                image: false,
                disabled: false
            };
            mockActivity.blocks.protoBlockDict = { namedbox: protoBlock };
            palettes.add("test");
            const palette = palettes.dict.test;
            const block = {
                name: "namedbox",
                defaults: [undefined],
                staticLabels: [""],
                image: false,
                scale: 1,
                hidden: false
            };

            const info = palette.model.makeBlockInfo(0, block, "namedbox", "namedbox");

            expect(info.label).toBe("namedbox");
        });
    });

    describe("Palette methods", () => {
        test("hide and show toggle menu", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            palette.hideMenu = jest.fn();
            palette.showMenu = jest.fn();

            palette.hide();
            palette.show();

            expect(palette.hideMenu).toHaveBeenCalled();
            expect(palette.showMenu).toHaveBeenCalledWith(true);
        });

        test("_hideMenuItems hides search widget and removes palette body", () => {
            const paletteBody = {};
            const paletteElement = { removeChild: jest.fn() };
            global.docById = jest.fn(id => {
                if (id === "PaletteBody") return paletteBody;
                if (id === "palette") return paletteElement;
                return null;
            });
            palettes.add("search");
            const palette = palettes.dict.search;

            palette._hideMenuItems();

            expect(mockActivity.hideSearchWidget).toHaveBeenCalledWith(true);
            expect(paletteElement.removeChild).toHaveBeenCalledWith(paletteBody);
        });

        test("setupGrabScroll updates scrollTop on drag", () => {
            const paletteList = { scrollTop: 100 };
            document.body.style.cursor = "default";

            palettes.add("test");
            const palette = palettes.dict.test;
            palette.setupGrabScroll(paletteList);

            paletteList.onmousedown({ clientY: 10 });
            paletteList.onmousemove({ clientY: 5 });

            expect(paletteList.scrollTop).toBe(105);
            paletteList.onmouseup();
            expect(document.body.style.cursor).toBe("default");
        });

        test("remove deletes protoList entry and model block", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoBlock = { name: "nameddo" };
            palette.protoList = [protoBlock];
            palette.model.blocks = [{ blkname: "nameddo", modname: "myAction" }];

            palette.remove(protoBlock, "myAction");

            expect(palette.protoList).toEqual([]);
            expect(palette.model.blocks).toEqual([]);
        });

        test("remove deletes storein model block", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoBlock = { name: "storein" };
            palette.protoList = [protoBlock];
            palette.model.blocks = [{ blkname: "storein", modname: "store in box1" }];

            palette.remove(protoBlock, "box1");

            expect(palette.model.blocks).toEqual([]);
        });

        test("add ignores duplicates", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoBlock = { name: "box" };

            palette.add(protoBlock);
            palette.add(protoBlock);

            expect(palette.protoList.length).toBe(1);
        });

        test("makeBlockFromSearch creates block and hides search", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoblk = { name: "box", defaults: ["box1"] };
            mockActivity.blocks.blockList = [];
            mockActivity.blocks.makeBlock = jest.fn(() => "newBlock");
            const callback = jest.fn();

            palette.makeBlockFromSearch(protoblk, "box", callback);

            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("box", "box1");
            expect(callback).toHaveBeenCalledWith("newBlock");
            expect(mockActivity.hideSearchWidget).toHaveBeenCalled();
        });

        test("_makeBlockFromPalette handles null protoblk", () => {
            palettes.add("test");
            const palette = palettes.dict.test;

            const result = palette._makeBlockFromPalette(null, "box", jest.fn());

            expect(result).toBeUndefined();
        });

        test("_makeBlockFromPalette uses namedbox default when undefined", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            mockActivity.blocks.blockList = [];
            mockActivity.blocks.makeBlock = jest.fn(() => "created");
            const callback = jest.fn();

            const protoblk = { name: "namedbox", defaults: [undefined] };
            const result = palette._makeBlockFromPalette(protoblk, "namedbox", callback);

            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("namedbox", "box");
            expect(callback).toHaveBeenCalledWith("created");
            expect(result).toBe("created");
        });

        test("_makeBlockFromPalette calls macro path", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const callback = jest.fn();
            const protoblk = { name: "box", defaults: ["box1"] };

            mockActivity.blocks.blockList = [{}, {}];
            const originalBlockIsMacro = global.blockIsMacro;
            global.blockIsMacro = jest.fn(() => true);
            palette._makeBlockFromProtoblock = jest.fn();

            palette._makeBlockFromPalette(protoblk, "box", callback);

            expect(palette._makeBlockFromProtoblock).toHaveBeenCalledWith(
                protoblk,
                true,
                "box1",
                null,
                100,
                100
            );
            expect(callback).toHaveBeenCalledWith(2);
            global.blockIsMacro = originalBlockIsMacro;
        });

        test("_makeBlockFromPalette uses plugin macro path", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const callback = jest.fn();
            const protoblk = { name: "box", defaults: ["box1"] };

            mockActivity.blocks.blockList = [{}, {}];
            const originalBlockIsMacro = global.blockIsMacro;
            global.blockIsMacro = jest.fn(() => false);
            palettes.pluginMacros = { box1: [[0, "box", 0, 0, [null]]] };
            palette._makeBlockFromProtoblock = jest.fn();

            const result = palette._makeBlockFromPalette(protoblk, "box", callback);

            expect(palette._makeBlockFromProtoblock).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith(2);
            expect(result).toBe(2);
            global.blockIsMacro = originalBlockIsMacro;
        });

        test("_makeBlockFromPalette handles specific block types", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            mockActivity.blocks.blockList = [];
            mockActivity.blocks.makeBlock = jest.fn(() => "blk");
            const callback = jest.fn();

            palette._makeBlockFromPalette({ name: "do", defaults: ["act"] }, "do", callback);
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("do", "act");

            palette._makeBlockFromPalette(
                { name: "storein2", defaults: ["box1"], staticLabels: ["Box A"] },
                "storein2",
                callback
            );
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("storein2", "Box A");

            palette._makeBlockFromPalette(
                { name: "namedarg", defaults: ["argX"] },
                "namedarg",
                callback
            );
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("namedarg", "argX");

            palette._makeBlockFromPalette(
                { name: "nameddo", defaults: [undefined] },
                "nameddo",
                callback
            );
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("nameddo", "action");

            palette._makeBlockFromPalette(
                { name: "nameddoArg", defaults: ["doArg"] },
                "nameddoArg",
                callback
            );
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("nameddoArg", "doArg");

            palette._makeBlockFromPalette(
                { name: "namedcalc", defaults: ["calcAction"] },
                "namedcalc",
                callback
            );
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("namedcalc", "calcAction");

            palette._makeBlockFromPalette(
                { name: "namedcalcArg", defaults: ["calcArg"] },
                "namedcalcArg",
                callback
            );
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("namedcalcArg", "calcArg");

            palette._makeBlockFromPalette(
                { name: "outputtools", defaults: [undefined] },
                "outputtools",
                callback
            );
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith(
                "outputtools",
                "letter class"
            );

            palette._makeBlockFromPalette(
                { name: "outputtools", defaults: ["letters"] },
                "outputtools",
                callback
            );
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("outputtools", "letters");

            palette._makeBlockFromPalette({ name: "custom" }, "nameddo", callback);
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("nameddo", "action");

            palette._makeBlockFromPalette({ name: "custom" }, "customblk", callback);
            expect(mockActivity.blocks.makeBlock).toHaveBeenCalledWith("customblk", "__NOARG__");
        });

        test("_makeBlockFromProtoblock runs drag-group callback", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoblk = { name: "box", defaults: ["box1"] };

            mockActivity.palettes = palettes;
            mockActivity.blocks = {
                blockList: [{ container: { x: 0, y: 0 } }],
                dragGroup: [0, 1],
                makeBlock: jest.fn(() => 0),
                findDragGroup: jest.fn(),
                moveBlockRelative: jest.fn(),
                blockMoved: jest.fn(),
                checkBounds: jest.fn(),
                findTopBlock: jest.fn(() => 0),
                moveBlock: jest.fn()
            };
            global.blockIsMacro = jest.fn(() => false);
            global.getMacroExpansion = jest.fn(() => null);
            palettes.pluginMacros = {};

            palette._makeBlockFromProtoblock(protoblk, true, "box", null, 10, 20);

            expect(mockActivity.blocks.findDragGroup).toHaveBeenCalledWith(0);
            expect(mockActivity.blocks.moveBlockRelative).toHaveBeenCalledTimes(2);
            expect(mockActivity.blocks.blockMoved).toHaveBeenCalledWith(0);
            expect(mockActivity.blocks.checkBounds).toHaveBeenCalled();
            expect(mockActivity.blocks.moveBlock).toHaveBeenCalled();
        });

        test("hideMenu removes outside click listener", () => {
            const palDiv = { childNodes: [{ style: {} }], removeChild: jest.fn() };
            global.docById = jest.fn(id => {
                if (id === "palette") return palDiv;
                return null;
            });

            palettes.add("test");
            const palette = palettes.dict.test;
            const outsideListener = jest.fn();
            palette._outsideClickListener = outsideListener;
            const removeListenerSpy = jest.spyOn(document, "removeEventListener");

            palette.hideMenu();

            expect(removeListenerSpy).toHaveBeenCalledWith("click", outsideListener);
        });

        test("showMenu creates header and menu container", () => {
            const palDiv = {
                childNodes: [{ style: {} }],
                appendChild: jest.fn(),
                removeChild: jest.fn()
            };
            const paletteBody = {
                insertAdjacentHTML: jest.fn(),
                style: {},
                childNodes: [{ style: {} }, { style: {} }],
                children: [
                    {
                        insertRow: jest.fn(() => ({
                            style: {},
                            innerHTML: "",
                            children: [{ style: {}, appendChild: jest.fn() }]
                        }))
                    },
                    {}
                ]
            };
            const elementFactory = tag => {
                if (tag === "table") return paletteBody;
                return {
                    style: {},
                    appendChild: jest.fn(),
                    children: [],
                    classList: { add: jest.fn() }
                };
            };
            global.document.createElement = jest.fn(elementFactory);
            global.docById = jest.fn(id => {
                if (id === "palette") return palDiv;
                if (id === "PaletteBody") return null;
                return null;
            });

            palettes.add("test");
            const palette = palettes.dict.test;
            palette._showMenuItems = jest.fn();

            palette.showMenu(true);

            expect(palDiv.appendChild).toHaveBeenCalledWith(paletteBody);
            expect(palette.menuContainer).toBe(paletteBody);
            expect(palette._showMenuItems).toHaveBeenCalled();
        });

        test("_showMenuItems renders a basic block", () => {
            const paletteList = {
                insertRow: jest.fn(() => ({
                    insertCell: jest.fn(() => ({
                        style: {},
                        appendChild: jest.fn()
                    }))
                }))
            };
            global.docById = jest.fn(id => {
                if (id === "PaletteBody_items") return paletteList;
                return null;
            });

            palettes.add("test");
            const palette = palettes.dict.test;
            palette.protoList = [{ name: "box" }];
            palette.model.update = jest.fn(() => {
                palette.model.blocks = [
                    {
                        blkname: "box",
                        modname: "box",
                        artwork: "<svg></svg>",
                        hidden: false,
                        image: false
                    }
                ];
            });

            palette._showMenuItems();

            expect(paletteList.insertRow).toHaveBeenCalled();
        });

        test("_showMenuItems handles image blocks and drag events", () => {
            const paletteList = {
                insertRow: jest.fn(() => ({
                    insertCell: jest.fn(() => {
                        let capturedImg;
                        return {
                            style: {},
                            appendChild: jest.fn(img => {
                                capturedImg = img;
                            }),
                            get _capturedImg() {
                                return capturedImg;
                            }
                        };
                    })
                }))
            };
            global.docById = jest.fn(id => {
                if (id === "PaletteBody_items") return paletteList;
                return null;
            });
            global.mediaPALETTE = "<svg></svg>";
            global.cameraPALETTE = "<svg></svg>";
            global.videoPALETTE = "<svg></svg>";
            mockActivity.pluginsImages = { customimg: "<svg></svg>" };
            document.addEventListener = jest.fn();
            document.removeEventListener = jest.fn();

            palettes.add("test");
            const palette = palettes.dict.test;
            mockActivity.blocksContainer = { x: 0, y: 0 };
            palette._makeBlockFromProtoblock = jest.fn();
            palette.protoList = [{ name: "media" }, { name: "customimg" }];
            palette.model.update = jest.fn(() => {
                palette.model.blocks = [
                    {
                        blkname: "media",
                        modname: "media",
                        artwork: "<svg></svg>",
                        hidden: false,
                        image: true
                    },
                    {
                        blkname: "customimg",
                        modname: "customimg",
                        artwork: "<svg></svg>",
                        hidden: false,
                        image: true
                    }
                ];
            });

            palette._showMenuItems();

            const itemCell =
                paletteList.insertRow.mock.results[0].value.insertCell.mock.results[0].value;
            const img = itemCell._capturedImg;
            img.offsetWidth = 10;
            img.offsetHeight = 10;
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            img.onmouseover();
            expect(document.body.style.cursor).toBe("pointer");
            img.onmouseleave();
            expect(document.body.style.cursor).toBe("default");
            expect(img.ondragstart()).toBe(false);

            img.onmousedown({
                pageX: 10,
                pageY: 20,
                preventDefault: jest.fn()
            });
            const mouseMoveHandler = document.addEventListener.mock.calls.find(
                call => call[0] === "mousemove"
            )[1];
            mouseMoveHandler({
                type: "mousemove",
                pageX: 15,
                pageY: 25,
                preventDefault: jest.fn()
            });
            img.onmouseup({});
        });

        test("_showMenuItems handles touch drag", () => {
            const paletteList = {
                insertRow: jest.fn(() => ({
                    insertCell: jest.fn(() => {
                        let capturedImg;
                        return {
                            style: {},
                            appendChild: jest.fn(img => {
                                capturedImg = img;
                            }),
                            get _capturedImg() {
                                return capturedImg;
                            }
                        };
                    })
                }))
            };
            global.docById = jest.fn(id => {
                if (id === "PaletteBody_items") return paletteList;
                return null;
            });
            document.addEventListener = jest.fn();
            document.removeEventListener = jest.fn();

            palettes.add("test");
            const palette = palettes.dict.test;
            palette._makeBlockFromProtoblock = jest.fn();
            mockActivity.blocksContainer = { x: 0, y: 0 };
            palette.protoList = [{ name: "media" }];
            palette.model.update = jest.fn(() => {
                palette.model.blocks = [
                    {
                        blkname: "media",
                        modname: "media",
                        artwork: "<svg></svg>",
                        hidden: false,
                        image: true
                    }
                ];
            });

            palette._showMenuItems();

            const itemCell =
                paletteList.insertRow.mock.results[0].value.insertCell.mock.results[0].value;
            const img = itemCell._capturedImg;
            img.offsetWidth = 10;
            img.offsetHeight = 10;
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();

            img.ontouchstart({
                touches: [{ clientX: 10, clientY: 20 }],
                preventDefault: jest.fn()
            });
            const touchMoveHandler = document.addEventListener.mock.calls.find(
                call => call[0] === "touchmove"
            )[1];
            touchMoveHandler({
                type: "touchmove",
                touches: [{ clientX: 12, clientY: 22 }],
                preventDefault: jest.fn()
            });
            img.ontouchend({});
        });

        test("_showMenuItems hides palette when mobile", () => {
            const paletteList = {
                insertRow: jest.fn(() => ({
                    insertCell: jest.fn(() => ({
                        style: {},
                        appendChild: jest.fn()
                    }))
                }))
            };
            const palDiv = { childNodes: [{ style: {} }], removeChild: jest.fn() };
            global.docById = jest.fn(id => {
                if (id === "PaletteBody_items") return paletteList;
                if (id === "palette") return palDiv;
                return null;
            });

            palettes.add("test");
            const palette = palettes.dict.test;
            palette.palettes.mobile = true;
            const hideSpy = jest.spyOn(palette, "hide");
            palette.protoList = [{ name: "box" }];
            palette.model.update = jest.fn(() => {
                palette.model.blocks = [
                    {
                        blkname: "box",
                        modname: "box",
                        artwork: "<svg></svg>",
                        hidden: false,
                        image: false
                    }
                ];
            });

            palette._showMenuItems();

            expect(hideSpy).toHaveBeenCalled();
        });

        test("_makeBlockFromProtoblock creates status macro", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoblk = { name: "status" };

            mockActivity.palettes = palettes;
            mockActivity.blocks = {
                blockList: [],
                dragGroup: [],
                findDragGroup: jest.fn(),
                moveBlockRelative: jest.fn(),
                blockMoved: jest.fn(),
                checkBounds: jest.fn(),
                loadNewBlocks: jest.fn(blocks => {
                    mockActivity.blocks.blockList = blocks.map(() => ({
                        container: { x: 0, y: 0 },
                        collapseToggle: jest.fn()
                    }));
                }),
                findTopBlock: jest.fn(() => 0),
                moveBlock: jest.fn()
            };
            global.StatusMatrix = jest.fn(() => ({
                init: jest.fn(),
                updateAll: jest.fn()
            }));
            mockActivity.logo = { statusMatrix: null, statusFields: [] };

            palette._makeBlockFromProtoblock(protoblk, true, "status", null, 10, 20);

            expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalled();
            expect(mockActivity.blocks.moveBlock).toHaveBeenCalled();
            expect(mockActivity.logo.statusMatrix.init).toHaveBeenCalledWith(mockActivity);
            expect(mockActivity.logo.statusMatrix.updateAll).toHaveBeenCalled();
        });

        test("_makeBlockFromProtoblock skips duplicate status", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoblk = { name: "status" };

            mockActivity.blocks = {
                blockList: [{ name: "status", trash: false }]
            };
            mockActivity.logo = { statusMatrix: null, statusFields: [] };
            global.StatusMatrix = jest.fn();

            palette._makeBlockFromProtoblock(protoblk, true, "status", null, 10, 20);

            expect(global.StatusMatrix).not.toHaveBeenCalled();
        });

        test("_makeBlockFromProtoblock builds status fields from variables and boxes", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoblk = { name: "status" };

            global.activity = mockActivity;

            mockActivity.blocks = {
                blockList: [
                    { name: "x", trash: false, value: 1 },
                    { name: "namedbox", trash: false, overrideName: "myBox" }
                ],
                dragGroup: [],
                findDragGroup: jest.fn(),
                moveBlockRelative: jest.fn(),
                blockMoved: jest.fn(),
                checkBounds: jest.fn(),
                loadNewBlocks: jest.fn(blocks => {
                    mockActivity.blocks.blockList = blocks.map(() => ({
                        container: { x: 0, y: 0 },
                        collapseToggle: jest.fn()
                    }));
                }),
                findTopBlock: jest.fn(() => 0),
                moveBlock: jest.fn()
            };
            mockActivity.palettes = palettes;
            global.StatusMatrix = jest.fn(() => ({ init: jest.fn(), updateAll: jest.fn() }));
            mockActivity.logo = { statusMatrix: null, statusFields: [] };

            palette._makeBlockFromProtoblock(protoblk, true, "status", null, 10, 20);

            expect(mockActivity.logo.statusFields.length).toBeGreaterThan(0);
        });

        test("_makeBlockFromProtoblock loads macro expansion", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoblk = { name: "box" };

            global.getMacroExpansion = jest.fn(() => [[0, "box", 0, 0, [null]]]);
            mockActivity.palettes = palettes;
            mockActivity.blocks = {
                blockList: [{ container: { x: 0, y: 0 } }],
                loadNewBlocks: jest.fn(blocks => {
                    mockActivity.blocks.blockList = blocks.map(() => ({
                        container: { x: 0, y: 0 }
                    }));
                }),
                findTopBlock: jest.fn(() => 0),
                moveBlock: jest.fn()
            };

            palette._makeBlockFromProtoblock(protoblk, true, "box", null, 10, 20);

            expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalled();
            expect(mockActivity.blocks.moveBlock).toHaveBeenCalled();
        });

        test("_makeBlockFromProtoblock loads plugin macro expansion", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoblk = { name: "box" };

            global.getMacroExpansion = jest.fn(() => null);
            palettes.pluginMacros = { box: [[0, "box", 0, 0, [null]]] };
            jest.spyOn(palettes, "getPluginMacroExpansion");
            mockActivity.palettes = palettes;
            mockActivity.blocks = {
                blockList: [{ container: { x: 0, y: 0 } }],
                loadNewBlocks: jest.fn(blocks => {
                    mockActivity.blocks.blockList = blocks.map(() => ({
                        container: { x: 0, y: 0 }
                    }));
                }),
                findTopBlock: jest.fn(() => 0),
                moveBlock: jest.fn()
            };

            palette._makeBlockFromProtoblock(protoblk, true, "box", null, 10, 20);

            expect(palettes.getPluginMacroExpansion).toHaveBeenCalled();
            expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalled();
        });

        test("_makeBlockFromProtoblock loads myblocks macro", () => {
            jest.useFakeTimers();
            palettes.add("myblocks");
            const palette = palettes.dict.myblocks;
            palette.name = "myblocks";
            const protoblk = { name: "macro_block" };

            mockActivity.macroDict = {
                testmacro: [
                    [0, "raw", 0, 0, [null]],
                    [1, ["text", "hi"], 0, 0, [0]],
                    [2, ["text", 5], 0, 0, [1]],
                    [3, ["number", { value: "7" }], 0, 0, [2]],
                    [4, ["number", "3"], 0, 0, [3]],
                    [5, ["number", 8], 0, 0, [4]],
                    [6, ["text", { value: "bye" }], 0, 0, [5]]
                ]
            };
            mockActivity.palettes = palettes;
            const collapseToggle = jest.fn();
            mockActivity.blocks = {
                blockList: [{ container: { x: 0, y: 0 }, collapseToggle }],
                loadNewBlocks: jest.fn(blocks => {
                    mockActivity.blocks.blockList = blocks.map(() => ({
                        container: { x: 0, y: 0 },
                        collapseToggle
                    }));
                }),
                findTopBlock: jest.fn(() => 0),
                moveBlock: jest.fn()
            };

            palette._makeBlockFromProtoblock(protoblk, true, "macro_testmacro", null, 10, 20);
            jest.advanceTimersByTime(500);

            const loadArg = mockActivity.blocks.loadNewBlocks.mock.calls[0][0];
            expect(loadArg[0][1]).toBe("raw");
            expect(loadArg[1][1]).toEqual(["text", "hi"]);
            expect(loadArg[2][1]).toEqual(["text", "5"]);
            expect(loadArg[3][1]).toEqual(["number", 7]);
            expect(loadArg[4][1]).toEqual(["number", 3]);
            expect(loadArg[5][1]).toEqual(["number", 8]);
            expect(loadArg[6][1]).toEqual(["text", { value: "bye" }]);
            expect(collapseToggle).toHaveBeenCalled();
            jest.useRealTimers();
        });

        test("_makeBlockFromProtoblock falls back to palette block creation", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            const protoblk = { name: "box" };

            global.getMacroExpansion = jest.fn(() => null);
            palettes.pluginMacros = {};
            palette._makeBlockFromPalette = jest.fn(() => 0);
            mockActivity.palettes = palettes;
            mockActivity.blocks = {
                blockList: [{ container: { x: 0, y: 0 } }],
                moveBlock: jest.fn()
            };

            palette._makeBlockFromProtoblock(protoblk, true, "box", null, 10, 20);

            expect(palette._makeBlockFromPalette).toHaveBeenCalled();
            expect(mockActivity.blocks.moveBlock).toHaveBeenCalled();
        });

        test("outside click listener hides menu", () => {
            palettes.add("test");
            const palette = palettes.dict.test;
            palette.menuContainer = { contains: jest.fn(() => false) };
            const hideSpy = jest.spyOn(palette, "hideMenu");
            const palDiv = { childNodes: [{ style: {} }], removeChild: jest.fn() };
            global.docById = jest.fn(id => (id === "palette" ? palDiv : null));

            palette._outsideClickListener = event => {
                if (palette.menuContainer && palette.menuContainer.contains(event.target)) {
                    return;
                }
                palette.hideMenu();
                document.removeEventListener("click", palette._outsideClickListener);
                palette._outsideClickListener = null;
            };

            palette._outsideClickListener({ target: {} });

            expect(hideSpy).toHaveBeenCalled();
        });
    });

    describe("showSelection method", () => {
        test("updates selected and unselected backgrounds", () => {
            global.window = { btoa: jest.fn(str => str) };
            global.Image = class {
                constructor() {
                    this.src = "";
                }
            };
            const tr = {
                children: MULTIPALETTES.map(() => ({
                    children: [{ src: "" }, { style: { background: "" } }]
                }))
            };

            palettes.showSelection(1, tr);

            expect(tr.children[1].children[1].style.background).toBe(
                platformColor.paletteLabelSelected
            );
            expect(tr.children[0].children[1].style.background).toBe(
                platformColor.paletteLabelBackground
            );
        });
    });

    describe("makePalettes method", () => {
        test("skips beginner palettes and empty myblocks", () => {
            const originalMultiPalettes = global.MULTIPALETTES;
            const originalSkipPalettes = global.SKIPPALETTES;

            global.MULTIPALETTES = [["heap", "myblocks", "rhythm"]];
            global.SKIPPALETTES = ["heap"];

            const listBody = { parentNode: { removeChild: jest.fn() } };
            const palette = {
                children: [
                    {
                        children: [
                            {},
                            {
                                children: [{}, listBody],
                                appendChild: jest.fn(() => ({}))
                            }
                        ]
                    }
                ]
            };
            global.docById = jest.fn(() => palette);
            global.document.createElement = jest.fn(() => ({}));

            mockActivity.beginnerMode = true;
            jest.spyOn(palettes, "makeSearchButton").mockImplementation(() => {});
            const makeButtonSpy = jest.spyOn(palettes, "makeButton").mockImplementation(() => {});
            jest.spyOn(palettes, "countProtoBlocks").mockReturnValue(0);

            palettes.makePalettes(0);

            expect(makeButtonSpy).toHaveBeenCalledTimes(1);
            expect(makeButtonSpy).toHaveBeenCalledWith(
                "rhythm",
                expect.any(Object),
                expect.any(Object)
            );

            global.MULTIPALETTES = originalMultiPalettes;
            global.SKIPPALETTES = originalSkipPalettes;
        });

        test("includes myblocks when it has blocks", () => {
            const originalMultiPalettes = global.MULTIPALETTES;
            global.MULTIPALETTES = [["myblocks"]];

            const listBody = { parentNode: { removeChild: jest.fn() } };
            const palette = {
                children: [
                    {
                        children: [
                            {},
                            {
                                children: [{}, listBody],
                                appendChild: jest.fn(() => ({}))
                            }
                        ]
                    }
                ]
            };
            global.docById = jest.fn(() => palette);
            global.document.createElement = jest.fn(() => ({}));

            jest.spyOn(palettes, "makeSearchButton").mockImplementation(() => {});
            const makeButtonSpy = jest.spyOn(palettes, "makeButton").mockImplementation(() => {});
            jest.spyOn(palettes, "countProtoBlocks").mockReturnValue(2);

            palettes.makePalettes(0);

            expect(makeButtonSpy).toHaveBeenCalledWith(
                "myblocks",
                expect.any(Object),
                expect.any(Object)
            );

            global.MULTIPALETTES = originalMultiPalettes;
        });
    });

    describe("_loadPaletteButtonHandler method", () => {
        test("search button opens search widget", () => {
            const row = {};
            const hideSpy = jest.spyOn(palettes, "_hideMenus");
            const showSpy = jest.spyOn(mockActivity, "showSearchWidget");

            palettes._loadPaletteButtonHandler("search", row);
            row.onmouseover();
            row.onclick();

            expect(document.body.style.cursor).toBe("text");
            expect(hideSpy).toHaveBeenCalled();
            expect(showSpy).toHaveBeenCalled();
        });

        test("palette button schedules showPalette on hover", () => {
            jest.useFakeTimers();
            const row = {};
            const showSpy = jest.spyOn(palettes, "showPalette").mockImplementation(() => {});

            palettes._loadPaletteButtonHandler("rhythm", row);
            row.onmouseover();
            jest.advanceTimersByTime(400);

            expect(document.body.style.cursor).toBe("pointer");
            expect(showSpy).toHaveBeenCalledWith("rhythm");

            jest.useRealTimers();
        });

        test("palette button cancels timeout on mouseout", () => {
            jest.useFakeTimers();
            const row = {};
            const showSpy = jest.spyOn(palettes, "showPalette").mockImplementation(() => {});

            palettes._loadPaletteButtonHandler("rhythm", row);
            row.onmouseover();
            row.onmouseout();
            jest.advanceTimersByTime(400);

            expect(showSpy).not.toHaveBeenCalled();

            jest.useRealTimers();
        });

        test("mouseup and mouseleave reset cursor", () => {
            const row = {};

            palettes._loadPaletteButtonHandler("rhythm", row);
            document.body.style.cursor = "pointer";

            row.onmouseup();
            expect(document.body.style.cursor).toBe("default");

            document.body.style.cursor = "pointer";
            row.onmouseleave();
            expect(document.body.style.cursor).toBe("default");
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

        test("hides menu but does not show when palette body is closed", () => {
            const mockHideMenu = jest.fn();
            const mockShow = jest.fn();
            palettes.dict = {
                testPalette: { hideMenu: mockHideMenu, show: mockShow }
            };
            global.docById = jest.fn(id => {
                if (id === "PaletteBody") return null;
                return { style: {} };
            });

            palettes.updatePalettes("testPalette");

            expect(mockHideMenu).toHaveBeenCalled();
            expect(mockShow).not.toHaveBeenCalled();
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

        test("removes matching action prototype and updates palettes", () => {
            const updateSpy = jest.spyOn(palettes, "updatePalettes");
            palettes.dict = {
                action: {
                    protoList: [{ name: "nameddo", defaults: ["doThis"] }],
                    remove: jest.fn(),
                    hideMenu: jest.fn(),
                    show: jest.fn()
                }
            };
            mockActivity.blocks.protoBlockDict = { myDo_doThis: {} };
            global.docById = jest.fn(id => {
                if (id === "PaletteBody") return {};
                return { style: {} };
            });

            palettes.removeActionPrototype("doThis");

            expect(palettes.dict.action.remove).toHaveBeenCalled();
            expect(updateSpy).toHaveBeenCalledWith("action");
        });

        test("removes other action prototype variants", () => {
            const updateSpy = jest.spyOn(palettes, "updatePalettes").mockImplementation(() => {});

            palettes.dict = {
                action: {
                    protoList: [{ name: "namedcalc", defaults: ["calcName"] }],
                    remove: jest.fn()
                }
            };
            mockActivity.blocks.protoBlockDict = { myCalc_calcName: {} };
            palettes.removeActionPrototype("calcName");
            expect(mockActivity.blocks.protoBlockDict["myCalc_calcName"]).toBeUndefined();

            palettes.dict.action.protoList = [{ name: "nameddoArg", defaults: ["doArgName"] }];
            mockActivity.blocks.protoBlockDict = { myDoArg_doArgName: {} };
            palettes.removeActionPrototype("doArgName");
            expect(mockActivity.blocks.protoBlockDict["myDoArg_doArgName"]).toBeUndefined();

            palettes.dict.action.protoList = [{ name: "namedcalcArg", defaults: ["calcArgName"] }];
            mockActivity.blocks.protoBlockDict = { myCalcArg_calcArgName: {} };
            palettes.removeActionPrototype("calcArgName");
            expect(mockActivity.blocks.protoBlockDict["myCalcArg_calcArgName"]).toBeUndefined();

            expect(updateSpy).toHaveBeenCalledWith("action");
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
