/**
 * MusicBlocks v3.6.2
 *
 * @author Alok Dangre
 *
 * @copyright 2025 Alok Dangre
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

const { setupBoxesBlocks } = require("../BoxesBlocks");

let createdBlocks = {};

class DummyFlowBlock {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName || name;
        createdBlocks[name] = this;
    }
    setPalette(palette, activity) { return this; }
    beginnerBlock(flag) { return this; }
    setHelpString(helpArr) { return this; }
    formBlock(config) {
        this.config = config;
        return this;
    }
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) { return this; }
    flow() { }
}

class DummyValueBlock {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName || name;
        createdBlocks[name] = this;
        this.extraWidth = 0;
    }
    setPalette(palette, activity) { return this; }
    beginnerBlock(flag) { return this; }
    setHelpString(helpArr) { return this; }
    formBlock(config) {
        this.config = config;
        return this;
    }
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) { return this; }
}

class DummyLeftBlock {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName || name;
        createdBlocks[name] = this;
    }
    setPalette(palette, activity) { return this; }
    beginnerBlock(flag) { return this; }
    setHelpString(helpArr) { return this; }
    formBlock(config) {
        this.config = config;
        return this;
    }
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) { return this; }
}

global.FlowBlock = DummyFlowBlock;
global.ValueBlock = DummyValueBlock;
global.LeftBlock = DummyLeftBlock;
global._ = jest.fn((str) => str);

global.NOINPUTERRORMSG = "No input provided";
global.NOBOXERRORMSG = "No box error";
global.SOLFEGENAMES = ["do", "re", "mi", "fa", "so", "la", "ti", "do"];

describe("setupBoxesBlocks", () => {
    let activity, logo;
    const blkId = 100;

    beforeEach(() => {
        createdBlocks = {};

        activity = {
            errorMsg: jest.fn(),
            blocks: {
                blockList: {}
            },
            blockSetter: jest.fn((logo, cblk, value, turtle) => {
                const key = activity.blocks.blockList[cblk].privateData || activity.blocks.blockList[cblk].value;
                logo.boxes[key] = value;
            }),
            beginnerMode: false
        };

        logo = {
            boxes: {},
            statusFields: [],
            updatingStatusMatrix: false,
            inStatusMatrix: false,
            parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => receivedArg),
            receivedArg: undefined
        };

        setupBoxesBlocks(activity);
    });

    describe("IncrementBlock", () => {
        let incrementBlock;
        beforeEach(() => {
            incrementBlock = createdBlocks["increment"];
            activity.blocks.blockList[blkId] = { connections: [null, 200] };
        });

        test('should update box value when connection is "text"', () => {
            activity.blocks.blockList[200] = { name: "text", value: "myBox" };
            logo.boxes["myBox"] = 5;
            incrementBlock.flow([10, 2], logo, "turtle0", blkId);
            expect(logo.boxes["myBox"]).toBe(7);
        });

        test('should use SOLFEGENAMES branch when connection is "namedbox"', () => {
            activity.blocks.blockList[200] = { name: "namedbox", value: "do" };
            activity.blocks.blockSetter = jest.fn();
            incrementBlock.flow([10, 2], logo, "turtle0", blkId);
            expect(activity.blocks.blockSetter).toHaveBeenCalledWith(logo, 200, "mi", "turtle0");
        });

        test("should call blockSetter with default increment if no special case applies", () => {
            activity.blocks.blockList[200] = { name: "other", value: "unused" };
            activity.blocks.blockSetter = jest.fn();
            incrementBlock.flow([10, 3], logo, "turtle0", blkId);
            expect(activity.blocks.blockSetter).toHaveBeenCalledWith(logo, 200, 13, "turtle0");
        });

        test("should catch error and call errorMsg when blockSetter throws", () => {
            activity.blocks.blockList[200] = { name: "other", value: "unused" };
            activity.blocks.blockSetter = jest.fn(() => { throw new Error("fail"); });
            incrementBlock.flow([10, 2], logo, "turtle0", blkId);
            expect(activity.errorMsg).toHaveBeenCalledWith("Block does not support incrementing.", 200);
        });
    });

    describe("IncrementOneBlock", () => {
        let incrementOneBlock;
        const testBlk = 110;
        beforeEach(() => {
            incrementOneBlock = createdBlocks["incrementOne"];
            activity.blocks.blockList[testBlk] = { connections: [null, 210] };
            activity.blocks.blockList[210] = { name: "other", value: "unused" };
            activity.blocks.blockSetter = jest.fn();
        });

        test("should set second argument to 1 and call parent flow", () => {
            incrementOneBlock.flow([10], logo, "turtle0", testBlk);
            expect(activity.blocks.blockSetter).toHaveBeenCalledWith(logo, 210, 11, "turtle0");
        });
    });

    describe("DecrementOneBlock", () => {
        let decrementOneBlock;
        const testBlk = 120;
        beforeEach(() => {
            decrementOneBlock = createdBlocks["decrementOne"];
            activity.blocks.blockList[testBlk] = { connections: [null, 220] };
            activity.blocks.blockList[220] = { name: "other", value: "unused" };
            activity.blocks.blockSetter = jest.fn();
        });

        test("should set second argument to -1 and call parent flow", () => {
            decrementOneBlock.flow([10], logo, "turtle0", testBlk);
            expect(activity.blocks.blockSetter).toHaveBeenCalledWith(logo, 220, 9, "turtle0");
        });
    });

    describe("BoxBlock", () => {
        let boxBlock;
        const testBlk = 130;
        beforeEach(() => {
            boxBlock = createdBlocks["box"];
            activity.blocks.blockList[testBlk] = { connections: [null, 300] };
            activity.blocks.blockList[300] = { value: "boxKey" };
            logo.receivedArg = "boxKey";
            logo.boxes["boxKey"] = 99;
        });

        test("updateParameter should return the box value if exists", () => {
            const result = boxBlock.updateParameter(logo, "turtle0", testBlk);
            expect(result).toBe(99);
        });

        test("updateParameter should call errorMsg and return 0 if box missing", () => {
            delete logo.boxes["boxKey"];
            const result = boxBlock.updateParameter(logo, "turtle0", testBlk);
            expect(activity.errorMsg).toHaveBeenCalledWith("No box error", testBlk, "boxKey");
            expect(result).toBe(0);
        });

        test("setter should update box value if box exists", () => {
            boxBlock.setter(logo, 123, "turtle0", testBlk);
            expect(logo.boxes["boxKey"]).toBe(123);
        });

        test("setter should call errorMsg if box missing", () => {
            delete logo.boxes["boxKey"];
            boxBlock.setter(logo, 456, "turtle0", testBlk);
            expect(activity.errorMsg).toHaveBeenCalledWith("No box error", testBlk, "boxKey");
        });

        test("arg should call errorMsg and return 0 if connection is null", () => {
            activity.blocks.blockList[testBlk] = { connections: [null, null] };
            const result = boxBlock.arg(logo, "turtle0", testBlk, "boxKey");
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", testBlk);
            expect(result).toBe(0);
        });

        test("arg should return box value if exists", () => {
            activity.blocks.blockList[testBlk] = { connections: [null, 300] };
            const result = boxBlock.arg(logo, "turtle0", testBlk, "boxKey");
            expect(result).toBe(99);
        });

        test("arg should call errorMsg and return 0 if box missing", () => {
            delete logo.boxes["boxKey"];
            const result = boxBlock.arg(logo, "turtle0", testBlk, "boxKey");
            expect(activity.errorMsg).toHaveBeenCalledWith("No box error", testBlk, "boxKey");
            expect(result).toBe(0);
        });
    });

    describe("NamedBoxBlock", () => {
        let namedBoxBlock;
        const testBlk = 140;
        beforeEach(() => {
            namedBoxBlock = createdBlocks["namedbox"];
            activity.blocks.blockList[testBlk] = { privateData: "namedBoxKey", connections: [] };
            logo.boxes["namedBoxKey"] = 77;
        });

        test("updateParameter should return the named box value if exists", () => {
            const result = namedBoxBlock.updateParameter(logo, "turtle0", testBlk);
            expect(result).toBe(77);
        });

        test("updateParameter should call errorMsg and return 0 if missing", () => {
            delete logo.boxes["namedBoxKey"];
            const result = namedBoxBlock.updateParameter(logo, "turtle0", testBlk);
            expect(activity.errorMsg).toHaveBeenCalledWith("No box error", testBlk, "namedBoxKey");
            expect(result).toBe(0);
        });

        test("setter should update the named box value if exists", () => {
            namedBoxBlock.setter(logo, 88, "turtle0", testBlk);
            expect(logo.boxes["namedBoxKey"]).toBe(88);
        });

        test("arg should return the named box value when not in status matrix", () => {
            const result = namedBoxBlock.arg(logo, "turtle0", testBlk);
            expect(result).toBe(77);
        });

        test("arg should call errorMsg and return 0 if box missing", () => {
            delete logo.boxes["namedBoxKey"];
            const result = namedBoxBlock.arg(logo, "turtle0", testBlk);
            expect(activity.errorMsg).toHaveBeenCalledWith("No box error", testBlk, "namedBoxKey");
            expect(result).toBe(0);
        });
    });

    describe("StoreIn2Block", () => {
        let storeIn2Block;
        const testBlk = 150;
        beforeEach(() => {
            storeIn2Block = createdBlocks["storein2"];
            activity.blocks.blockList[testBlk] = { privateData: "storeKey" };
        });

        test("flow should store the given value in logo.boxes using privateData", () => {
            storeIn2Block.flow([999], logo, "turtle0", testBlk);
            expect(logo.boxes["storeKey"]).toBe(999);
        });
    });

    describe("StoreInBlock", () => {
        let storeInBlock;
        beforeEach(() => {
            storeInBlock = createdBlocks["storein"];
        });

        test("flow should store the value in logo.boxes using the first argument as key", () => {
            storeInBlock.flow(["myBox", 555], logo);
            expect(logo.boxes["myBox"]).toBe(555);
        });

        test("flow should do nothing if args length is not 2", () => {
            storeInBlock.flow([1], logo);
            expect(Object.keys(logo.boxes).length).toBe(0);
        });
    });

    describe("Box2Block", () => {
        let box2Block;
        const testBlk = 160;
        beforeEach(() => {
            box2Block = createdBlocks["box2"];
            box2Block.macro = jest.fn((x, y) => [[0, ["namedbox", { value: "box2" }], x, y, [null]]]);
        });

        test("should create a macro returning expected configuration", () => {
            const macroConfig = box2Block.macro(10, 20);
            expect(macroConfig[0][1][0]).toBe("namedbox");
            expect(macroConfig[0][1][1].value).toBe("box2");
        });
    });

    describe("StoreBox2Block", () => {
        let storeBox2Block;
        const testBlk = 170;
        beforeEach(() => {
            storeBox2Block = createdBlocks["storebox2"];
            activity.blocks.blockList[testBlk] = { privateData: "box2Key" };
            storeBox2Block.flow = function (args, logo, turtle, blk) {
                if (args.length !== 1) return;
                const privateData = activity.blocks.blockList[blk].privateData;
                const value = args[0];
                logo.boxes[privateData] = value;
            };
        });

        test("flow should store the value in logo.boxes for Box2", () => {
            storeBox2Block.flow([888], logo, "turtle0", testBlk);
            expect(logo.boxes["box2Key"]).toBe(888);
        });
    });

    describe("Box1Block", () => {
        let box1Block;
        const testBlk = 180;
        beforeEach(() => {
            box1Block = createdBlocks["box1"];
            box1Block.macro = jest.fn((x, y) => [[0, ["namedbox", { value: "box1" }], x, y, [null]]]);
        });

        test("should create a macro returning expected configuration", () => {
            const macroConfig = box1Block.macro(5, 15);
            expect(macroConfig[0][1][0]).toBe("namedbox");
            expect(macroConfig[0][1][1].value).toBe("box1");
        });
    });

    describe("StoreBox1Block", () => {
        let storeBox1Block;
        const testBlk = 190;
        beforeEach(() => {
            storeBox1Block = createdBlocks["storebox1"];
            activity.blocks.blockList[testBlk] = { privateData: "box1Key" };
            storeBox1Block.flow = function (args, logo, turtle, blk) {
                if (args.length !== 1) return;
                const privateData = activity.blocks.blockList[blk].privateData;
                const value = args[0];
                logo.boxes[privateData] = value;
            };
        });

        test("flow should store the value in logo.boxes for Box1", () => {
            storeBox1Block.flow([777], logo, "turtle0", testBlk);
            expect(logo.boxes["box1Key"]).toBe(777);
        });
    });
});
