/**
 * MusicBlocks v3.6.2
 *
 * @author vyagh
 *
 * @copyright 2025 vyagh
 *
 * @license
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

const { setupProgramBlocks } = jest.requireActual("../ProgramBlocks");

global._ = s => s;
global.NOINPUTERRORMSG = "NO_INPUT";
global.XMLHttpRequest = jest.fn();
global.getTargetTurtle = jest.fn();
global.Turtle = {
    DictActions: {
        setDictValue: jest.fn(),
        SerializeDict: jest.fn(() => "{}")
    }
};

class BaseBlock {
    constructor(name) {
        this.name = name;
        this.dockTypes = [null];
        this.size = 1;
        this.lang = "en";
        this.hidden = false;
    }

    setPalette(palette) {
        this.palette = palette;
    }

    setHelpString(help) {
        this.help = help;
    }

    formBlock(defn) {
        this.formDefn = defn;
    }

    setup(activity) {
        activity.registeredBlocks = activity.registeredBlocks || {};
        activity.registeredBlocks[this.name] = this;
        return this;
    }
}

class FlowBlock extends BaseBlock {
    constructor(name) {
        super(name);
    }

    flow() {}
}

class LeftBlock extends BaseBlock {
    constructor(name) {
        super(name);
    }

    arg() {}
}

global.BaseBlock = BaseBlock;
global.FlowBlock = FlowBlock;
global.LeftBlock = LeftBlock;

describe("ProgramBlocks", () => {
    let activity;
    let logo;

    beforeEach(() => {
        jest.clearAllMocks();

        activity = {
            registeredBlocks: {},
            blocks: {
                blockList: [],
                palettes: {
                    dict: {},
                    hide: jest.fn(),
                    show: jest.fn(),
                    getProtoNameAndPalette: jest.fn()
                },
                moveBlock: jest.fn(),
                adjustDocks: jest.fn(),
                sendStackToTrash: jest.fn(),
                showBlocks: jest.fn(),
                loadNewBlocks: jest.fn(),
                protoBlockDict: {}
            },
            turtles: {
                turtleX2screenX: jest.fn(x => x),
                turtleY2screenY: jest.fn(y => y),
                ithTurtle: jest.fn(() => ({
                    doWait: jest.fn()
                }))
            },
            errorMsg: jest.fn(),
            save: {
                download: jest.fn()
            }
        };

        logo = {
            turtleHeaps: {},
            turtleDicts: {},
            runFromBlock: jest.fn(),
            initTurtle: jest.fn()
        };

        global.XMLHttpRequest = jest.fn().mockImplementation(() => ({
            open: jest.fn(),
            send: jest.fn(),
            setRequestHeader: jest.fn(),
            readyState: 4,
            status: 200,
            responseText: '{"test": "data"}'
        }));

        setupProgramBlocks(activity);
    });

    const getBlock = name => activity.registeredBlocks[name];

    describe("Block Registration", () => {
        test("registers all 15 program blocks", () => {
            const expectedBlocks = [
                "loadHeapFromApp",
                "saveHeapToApp",
                "loadHeap",
                "setHeap",
                "loadDict",
                "setDictionary",
                "saveHeap",
                "saveDict",
                "openpalette",
                "deleteblock",
                "moveblock",
                "runblock",
                "dockblock",
                "makeblock",
                "openProject"
            ];

            expectedBlocks.forEach(blockName => {
                expect(activity.registeredBlocks).toHaveProperty(blockName);
            });

            expect(Object.keys(activity.registeredBlocks).length).toBe(15);
        });

        test("all blocks have correct palette set", () => {
            Object.values(activity.registeredBlocks).forEach(block => {
                expect(block.palette).toBe("program");
            });
        });
    });

    describe("LoadHeapFromAppBlock", () => {
        test("handles null arguments", () => {
            const block = getBlock("loadHeapFromApp");
            block.flow([null, "localhost"], logo, 0, 1);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 1);
        });

        test("loads heap from successful HTTP request", async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                text: jest.fn().mockResolvedValue('["item1", "item2"]')
            });

            const block = getBlock("loadHeapFromApp");
            block.flow(["testHeap", "http://test.com"], logo, 0, 1);

            // Wait for the async fetch to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(global.fetch).toHaveBeenCalledWith("http://test.com");
            expect(logo.turtleHeaps.testHeap).toEqual(["item1", "item2"]);
        });

        test("handles 404 error", async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                status: 404
            });

            const block = getBlock("loadHeapFromApp");
            block.flow(["testHeap", "http://test.com"], logo, 0, 1);

            // Wait for the async fetch to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(activity.errorMsg).toHaveBeenCalledWith("404: Page not found");
        });

        test("handles JSON parse error", async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                text: jest.fn().mockResolvedValue("invalid json")
            });

            const block = getBlock("loadHeapFromApp");
            block.flow(["testHeap", "http://test.com"], logo, 0, 1);

            // Wait for the async fetch to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(activity.errorMsg).toHaveBeenCalled();
        });

        test("handles network error", async () => {
            global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

            const block = getBlock("loadHeapFromApp");
            block.flow(["testHeap", "http://test.com"], logo, 0, 1);

            // Wait for the async fetch to complete
            await new Promise(resolve => setTimeout(resolve, 0));

            // Should not throw, error is handled gracefully
            expect(global.fetch).toHaveBeenCalled();
        });
    });

    describe("SaveHeapToAppBlock", () => {
        test("handles null arguments", () => {
            const block = getBlock("saveHeapToApp");
            block.flow([null, "localhost"], logo, 0, 1);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 1);
        });

        test("saves heap to URL", () => {
            const mockHttp = {
                open: jest.fn(),
                send: jest.fn(),
                setRequestHeader: jest.fn()
            };
            global.XMLHttpRequest.mockImplementation(() => mockHttp);

            logo.turtleHeaps.testHeap = ["data1", "data2"];
            const block = getBlock("saveHeapToApp");
            block.flow(["testHeap", "http://test.com"], logo, 0, 1);

            expect(mockHttp.open).toHaveBeenCalledWith("POST", "http://test.com", true);
            expect(mockHttp.setRequestHeader).toHaveBeenCalledWith(
                "Content-Type",
                "application/json;charset=UTF-8"
            );
            expect(mockHttp.send).toHaveBeenCalledWith('["data1","data2"]');
        });

        test("handles missing heap", () => {
            const block = getBlock("saveHeapToApp");
            block.flow(["nonexistent", "http://test.com"], logo, 0, 1);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Cannot find a valid heap for nonexistent"
            );
        });
    });

    describe("LoadHeapBlock", () => {
        test("loads heap from file", () => {
            const blk = 10;
            activity.blocks.blockList[blk] = {
                connections: [null, 20]
            };
            activity.blocks.blockList[20] = {
                name: "loadFile",
                value: ["filename", '["heap1", "heap2"]']
            };

            const block = getBlock("loadHeap");
            block.flow([[null, null]], logo, 0, blk);

            expect(logo.turtleHeaps[0]).toEqual(["heap1", "heap2"]);
        });

        test("handles invalid JSON in file", () => {
            const blk = 10;
            activity.blocks.blockList[blk] = {
                connections: [null, 20]
            };
            activity.blocks.blockList[20] = {
                name: "loadFile",
                value: ["filename", "not valid json"]
            };

            const block = getBlock("loadHeap");
            block.flow([[null, null]], logo, 0, blk);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                "The file you selected does not contain a valid heap."
            );
        });

        test("handles non-array heap data", () => {
            const blk = 10;
            activity.blocks.blockList[blk] = {
                connections: [null, 20]
            };
            activity.blocks.blockList[20] = {
                name: "loadFile",
                value: ["filename", '{"not": "array"}']
            };

            const block = getBlock("loadHeap");
            block.flow([[null, null]], logo, 0, blk);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                "The file you selected does not contain a valid heap."
            );
        });

        test("requires loadFile block", () => {
            const blk = 10;
            activity.blocks.blockList[blk] = {
                connections: [null, 20]
            };
            activity.blocks.blockList[20] = {
                name: "otherBlock"
            };

            const block = getBlock("loadHeap");
            block.flow([[null, null]], logo, 0, blk);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                "The loadHeap block needs a loadFile block."
            );
        });
    });

    describe("SetHeapBlock", () => {
        test("sets heap from JSON", () => {
            const blk = 10;
            activity.blocks.blockList[blk] = {
                connections: [null, 20]
            };
            activity.blocks.blockList[20] = {
                value: '["item1", "item2"]'
            };

            const block = getBlock("setHeap");
            block.flow([null], logo, 0, blk);

            expect(logo.turtleHeaps[0]).toEqual(["item1", "item2"]);
        });

        test("handles invalid JSON", () => {
            const blk = 10;
            activity.blocks.blockList[blk] = {
                connections: [null, 20]
            };
            activity.blocks.blockList[20] = {
                value: "invalid"
            };

            const block = getBlock("setHeap");
            block.flow([null], logo, 0, blk);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                "The block you selected does not contain a valid heap."
            );
        });

        test("requires connection", () => {
            const blk = 10;
            activity.blocks.blockList[blk] = {
                connections: [null, null]
            };

            const block = getBlock("setHeap");
            block.flow([null], logo, 0, blk);

            expect(activity.errorMsg).toHaveBeenCalledWith("The Set heap block needs a heap.");
        });
    });

    describe("SaveHeapBlock", () => {
        test("saves heap to file", () => {
            logo.turtleHeaps[0] = ["data1", "data2"];

            const block = getBlock("saveHeap");
            block.flow(["test.json"], logo, 0);

            expect(activity.save.download).toHaveBeenCalledWith(
                "json",
                'data:text/json;charset-utf-8,["data1","data2"]',
                "test.json"
            );
        });

        test("handles null filename", () => {
            logo.turtleHeaps[0] = ["data"];

            const block = getBlock("saveHeap");
            block.flow([null], logo, 0);

            expect(activity.save.download).not.toHaveBeenCalled();
        });

        test("handles missing heap", () => {
            const block = getBlock("saveHeap");
            block.flow(["test.json"], logo, 0);

            expect(activity.save.download).not.toHaveBeenCalled();
        });
    });

    describe("LoadDictBlock", () => {
        test("loads dictionary from file", () => {
            const blk = 10;
            const turtle = 0;
            logo.turtleDicts[turtle] = {};
            global.getTargetTurtle.mockReturnValue(null);

            activity.blocks.blockList[blk] = {
                connections: [null, null, 20]
            };
            activity.blocks.blockList[20] = {
                name: "loadFile",
                value: ["filename", '{"key1": "value1"}']
            };

            const block = getBlock("loadDict");
            block.flow(["MyDict", [null, null]], logo, turtle, blk);

            expect(logo.turtleDicts[turtle]).toHaveProperty("MyDict");
        });

        test("handles null arguments", () => {
            const block = getBlock("loadDict");
            block.flow([null, null], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });

        test("requires loadFile block", () => {
            const blk = 10;
            activity.blocks.blockList[blk] = {
                connections: [null, null, 20]
            };
            activity.blocks.blockList[20] = {
                name: "otherBlock"
            };

            const block = getBlock("loadDict");
            block.flow(["MyDict", [null, null]], logo, 0, blk);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                "The load dictionary block needs a load file block."
            );
        });

        test("handles invalid JSON", () => {
            const blk = 10;
            const turtle = 0;
            logo.turtleDicts[turtle] = {};

            activity.blocks.blockList[blk] = {
                connections: [null, null, 20]
            };
            activity.blocks.blockList[20] = {
                name: "loadFile",
                value: ["filename", "invalid json"]
            };

            const block = getBlock("loadDict");
            block.flow(["MyDict", [null, null]], logo, turtle, blk);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                "The file you selected does not contain a valid dictionary."
            );
        });
    });

    describe("SetDictBlock", () => {
        test("sets dictionary from JSON", () => {
            const blk = 10;
            const turtle = 0;
            logo.turtleDicts[turtle] = {};
            global.getTargetTurtle.mockReturnValue(null);

            activity.blocks.blockList[blk] = {
                connections: [null, null, 20]
            };
            activity.blocks.blockList[20] = {
                value: '{"key1": "value1"}'
            };

            const block = getBlock("setDictionary");
            block.flow(["MyDict", {}], logo, turtle, blk);

            expect(logo.turtleDicts[turtle]).toHaveProperty("MyDict");
        });

        test("handles null arguments", () => {
            const block = getBlock("setDictionary");
            block.flow([null, null], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });

        test("handles invalid JSON", () => {
            const blk = 10;
            const turtle = 0;
            logo.turtleDicts[turtle] = {};

            activity.blocks.blockList[blk] = {
                connections: [null, null, 20]
            };
            activity.blocks.blockList[20] = {
                value: "invalid"
            };

            const block = getBlock("setDictionary");
            block.flow(["MyDict", {}], logo, turtle, blk);

            expect(activity.errorMsg).toHaveBeenCalledWith(
                "The block you selected does not contain a valid dictionary."
            );
        });
    });

    describe("SaveDictBlock", () => {
        test("saves dictionary to file", () => {
            const turtle = 0;
            logo.turtleDicts[turtle] = {
                MyDict: { key: "value" }
            };
            global.getTargetTurtle.mockReturnValue(null);

            const block = getBlock("saveDict");
            block.flow(["MyDict", "dict.json"], logo, turtle, 10);

            expect(activity.save.download).toHaveBeenCalledWith(
                "json",
                'data:text/json;charset-utf-8,{"key":"value"}',
                "dict.json"
            );
        });

        test("handles null arguments", () => {
            const block = getBlock("saveDict");
            block.flow([null, null], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });

        test("saves turtle dictionary", () => {
            const turtle = 0;
            logo.turtleDicts[turtle] = {};
            global.getTargetTurtle.mockReturnValue(5);
            global.Turtle.DictActions.SerializeDict.mockReturnValue('{"turtle":"dict"}');

            const block = getBlock("saveDict");
            block.flow(["TurtleDict", "dict.json"], logo, turtle, 10);

            expect(activity.save.download).toHaveBeenCalledWith(
                "json",
                'data:text/json;charset-utf-8,{"turtle":"dict"}',
                "dict.json"
            );
        });
    });

    describe("OpenPaletteBlock", () => {
        test("opens specified palette", () => {
            activity.blocks.palettes.dict = {
                rhythm: {
                    name: "rhythm",
                    show: jest.fn()
                }
            };

            const block = getBlock("openpalette");
            block.flow(["rhythm"], logo, 0, 10);

            expect(activity.blocks.palettes.hide).toHaveBeenCalled();
            expect(activity.blocks.palettes.dict.rhythm.show).toHaveBeenCalled();
            expect(activity.blocks.palettes.show).toHaveBeenCalled();
        });

        test("handles missing arguments", () => {
            const block = getBlock("openpalette");
            block.flow([], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });
    });

    describe("DeleteBlock", () => {
        test("deletes a block and sends to trash", () => {
            const block = getBlock("deleteblock");
            // Mock blockList
            activity.blocks.blockList = [
                {
                    connections: [10],
                    trash: false
                }
            ];
            // Mock connected block
            activity.blocks.blockList[10] = {
                connections: [0] // connected back to 0
            };

            block.flow([0], logo, 0, 5);

            expect(activity.blocks.sendStackToTrash).toHaveBeenCalledWith(
                activity.blocks.blockList[0]
            );
            expect(activity.blocks.adjustDocks).toHaveBeenCalled();
        });

        test("handles invalid block number", () => {
            const block = getBlock("deleteblock");
            activity.blocks.blockList = []; // Empty
            block.flow([0], logo, 0, 5);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 5);
        });

        test("ignores if already in trash", () => {
            const block = getBlock("deleteblock");
            activity.blocks.blockList = [{ trash: true }];
            block.flow([0], logo, 0, 5);
            expect(activity.blocks.sendStackToTrash).not.toHaveBeenCalled();
        });
    });

    describe("MoveBlock", () => {
        test("moves block to new coordinates", () => {
            const block = getBlock("moveblock");
            activity.blocks.blockList = [{}];

            block.flow([0, 100, 200], logo, 0, 5);

            expect(activity.turtles.turtleX2screenX).toHaveBeenCalledWith(100);
            expect(activity.turtles.turtleY2screenY).toHaveBeenCalledWith(200);
            expect(activity.blocks.moveBlock).toHaveBeenCalledWith(0, 100, 200);
        });

        test("handles invalid args", () => {
            const block = getBlock("moveblock");
            block.flow([], logo, 0, 5);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 5);
        });
    });

    describe("RunBlock", () => {
        test("runs block by ID", () => {
            const block = getBlock("runblock");
            activity.blocks.blockList = [{ name: "start", value: 0 }];

            block.flow([0], logo, 0, 5);

            expect(logo.initTurtle).toHaveBeenCalledWith(0);
            expect(logo.runFromBlock).toHaveBeenCalled();
        });

        test("resolves block name to ID", () => {
            const block = getBlock("runblock");
            activity.blocks.blockList = [
                {
                    name: "something",
                    protoblock: { staticLabels: ["myBlock"] }
                }
            ];

            const args = ["myBlock"];
            block.flow(args, logo, 0, 5);
            expect(args[0]).toBe(0);
        });
    });

    describe("DockBlock", () => {
        test("connects two blocks", () => {
            const block = getBlock("dockblock");
            activity.blocks.blockList = [
                { connections: [null, null] }, // block 0
                { connections: [null] }, // block 1
                { connections: [null] } // block 2
            ];

            // args: [target, connectionNum, blockToConnect]
            block.flow([0, 1, 2], logo, 0, 5);

            expect(activity.blocks.blockList[0].connections[1]).toBe(2);
            expect(activity.blocks.blockList[2].connections[0]).toBe(0);
            expect(activity.blocks.adjustDocks).toHaveBeenCalledWith(0, true);
        });

        test("handles connection to -1 (last)", () => {
            const block = getBlock("dockblock");
            activity.blocks.blockList = [
                { connections: [null, null, null] },
                {},
                { connections: [null] }
            ];

            block.flow([0, -1, 2], logo, 0, 5);
            expect(activity.blocks.blockList[0].connections[2]).toBe(2);
        });

        test("errors on invalid input", () => {
            const block = getBlock("dockblock");
            block.flow([], logo, 0, 5);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 5);
        });
    });

    describe("MakeBlock", () => {
        test("creates new note block", () => {
            const block = getBlock("makeblock");
            activity.blocks.blockList = [
                { connections: [null, 10], argClampSlots: [] },
                { connections: [null] },
                { connections: [null] }
            ];
            // Mock parsing
            logo.parseArg = jest
                .fn()
                .mockReturnValueOnce("note") // for name
                .mockReturnValue("sol"); // for args

            // Mock getProtoNameAndPalette for safety if traversed
            activity.blocks.palettes.getProtoNameAndPalette.mockReturnValue([null, null, null]);

            const result = block.arg(logo, 0, 0, null);

            expect(activity.blocks.loadNewBlocks).toHaveBeenCalled();
            expect(result).toBe(activity.blocks.blockList.length);
        });
    });

    describe("OpenProjectBlock", () => {
        let originalOpen;
        let originalAlert;

        beforeAll(() => {
            originalOpen = window.open;
            originalAlert = window.alert;
        });

        afterAll(() => {
            window.open = originalOpen;
            window.alert = originalAlert;
        });

        test("opens valid URL", () => {
            const block = getBlock("openProject");
            const mockWindow = { focus: jest.fn() };

            // Mock window.open
            delete window.open;
            window.open = jest.fn(() => mockWindow);

            block.flow(["http://example.com"], logo, 0, 5);

            expect(window.open).toHaveBeenCalledWith("http://example.com", "_blank");
            expect(mockWindow.focus).toHaveBeenCalled();
        });

        test("validates URL", () => {
            const block = getBlock("openProject");

            // Mock window.open and alert
            delete window.open;
            window.open = jest.fn();
            delete window.alert;
            window.alert = jest.fn();

            block.flow(["invalid-url"], logo, 0, 5);

            expect(window.open).not.toHaveBeenCalled();
            expect(activity.errorMsg).toHaveBeenCalled();
        });
    });

    describe("Block Properties", () => {
        test("LoadHeapFromAppBlock has correct form", () => {
            const block = getBlock("loadHeapFromApp");
            expect(block.formDefn.args).toBe(2);
            expect(block.formDefn.argTypes).toEqual(["textin", "textin"]);
            expect(block.formDefn.defaults).toEqual(["appName", "localhost"]);
        });

        test("SaveHeapBlock has correct form", () => {
            const block = getBlock("saveHeap");
            expect(block.formDefn.args).toBe(1);
            expect(block.formDefn.argTypes).toEqual(["textin"]);
            expect(block.formDefn.defaults).toEqual(["heap.json"]);
        });

        test("LoadDictBlock has correct form with labels", () => {
            const block = getBlock("loadDict");
            expect(block.formDefn.args).toBe(2);
            expect(block.formDefn.argLabels).toEqual(["name", "file"]);
        });

        test("MakeBlock has correct form", () => {
            const block = getBlock("makeblock");
            expect(block.formDefn.outType).toBe("numberout");
        });
    });
});
