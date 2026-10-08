/**
 * @license
 * MusicBlocks v3.4.1
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

global._ = str => str;
global.NOINPUTERRORMSG = "NO INPUT";
global.NANERRORMSG = "NOT A NUMBER";

class MockBlock {
    constructor(name) {
        this.name = name;
    }
    setPalette() {}
    beginnerBlock() {}
    setHelpString() {}
    formBlock() {}
    setup(act) {
        if (act && act.blocks) {
            act.blocks[this.name] = this;
        }
    }
}

global.ValueBlock = MockBlock;
global.LeftBlock = MockBlock;
global.FlowBlock = MockBlock;
global.FlowClampBlock = MockBlock;
global.BooleanBlock = MockBlock;
global._THIS_IS_MUSIC_BLOCKS_ = true;

const { setupHeapBlocks } = require("../blocks/HeapBlocks");
const { setupEnsembleBlocks } = require("../blocks/EnsembleBlocks");

describe("HeapBlocks - IndexHeapBlock", () => {
    let activity;
    let logo;
    let indexHeapBlock;

    beforeEach(() => {
        activity = {
            errorMsg: jest.fn(),
            blocks: {
                blockList: {
                    1: { connections: [null, 2] }
                }
            }
        };
        logo = {
            turtleHeaps: {},
            parseArg: jest.fn()
        };
        setupHeapBlocks(activity);
        indexHeapBlock = activity.blocks.indexHeap;
    });

    test("floors fractional index (e.g., 2.5 returns slot 2)", () => {
        logo.turtleHeaps[0] = [10, 20, 30];
        logo.parseArg.mockReturnValue(2.5);

        const result = indexHeapBlock.arg(logo, 0, 1, null);
        expect(result).toBe(20);
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });

    test("returns elements using negative indices up to -heap_length", () => {
        logo.turtleHeaps[0] = [10, 20, 30];

        // -1 returns 30 (last)
        logo.parseArg.mockReturnValue(-1);
        expect(indexHeapBlock.arg(logo, 0, 1, null)).toBe(30);

        // -2 returns 20 (second to last)
        logo.parseArg.mockReturnValue(-2);
        expect(indexHeapBlock.arg(logo, 0, 1, null)).toBe(20);

        // -3 returns 10 (third to last / first)
        logo.parseArg.mockReturnValue(-3);
        expect(indexHeapBlock.arg(logo, 0, 1, null)).toBe(10);
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });

    test("reports error and defaults to slot 1 when negative index < -heap_length", () => {
        logo.turtleHeaps[0] = [10, 20, 30];
        logo.parseArg.mockReturnValue(-4);

        const result = indexHeapBlock.arg(logo, 0, 1, null);
        expect(result).toBe(10);
        expect(activity.errorMsg).toHaveBeenCalledWith("Index must be > 0.");
    });

    test("reports 'empty heap' and returns 0 with any negative index on empty heap", () => {
        logo.turtleHeaps[0] = [];
        logo.parseArg.mockReturnValue(-2);

        const result = indexHeapBlock.arg(logo, 0, 1, null);
        expect(result).toBe(0);
        expect(activity.errorMsg).toHaveBeenCalledWith("empty heap");
    });

    test("reports error and floors when index < 1 (e.g., 0.5 or 0)", () => {
        logo.turtleHeaps[0] = [10, 20, 30];
        logo.parseArg.mockReturnValue(0.5);

        const result = indexHeapBlock.arg(logo, 0, 1, null);
        expect(result).toBe(10);
        expect(activity.errorMsg).toHaveBeenCalledWith("Index must be > 0.");
    });
});

describe("HeapBlocks - SetHeapEntryBlock", () => {
    let activity;
    let logo;
    let setHeapEntryBlock;

    beforeEach(() => {
        activity = {
            errorMsg: jest.fn(),
            blocks: {}
        };
        logo = {
            turtleHeaps: { 0: [10, 20, 30] }
        };
        setupHeapBlocks(activity);
        setHeapEntryBlock = activity.blocks.setHeapEntry;
    });

    test("sets value using negative indices up to -heap_length", () => {
        setHeapEntryBlock.flow([-1, 99], logo, 0, 1);
        expect(logo.turtleHeaps[0]).toEqual([10, 20, 99]);

        setHeapEntryBlock.flow([-2, 88], logo, 0, 1);
        expect(logo.turtleHeaps[0]).toEqual([10, 88, 99]);

        setHeapEntryBlock.flow([-3, 77], logo, 0, 1);
        expect(logo.turtleHeaps[0]).toEqual([77, 88, 99]);
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });

    test("reports error and defaults to slot 1 when negative index < -heap_length", () => {
        setHeapEntryBlock.flow([-4, 55], logo, 0, 1);
        expect(activity.errorMsg).toHaveBeenCalledWith("Index must be > 0.");
        expect(logo.turtleHeaps[0][0]).toBe(55);
    });
});

describe("EnsembleBlocks - TurtleHeapBlock (mouse index heap)", () => {
    let activity;
    let logo;
    let turtleHeapBlock;

    beforeEach(() => {
        activity = {
            errorMsg: jest.fn(),
            turtles: {
                turtleList: [0],
                ithTurtle: () => ({ name: "Mr. Mouse", inTrash: false })
            },
            blocks: {
                blockList: {
                    1: { connections: [null, 2, 3] }
                }
            }
        };
        logo = {
            turtleHeaps: { 0: [10, 20, 30] },
            parseArg: jest.fn((lg, turtle, cblk) => {
                if (cblk === 2) return "Mr. Mouse";
                if (cblk === 3) return 2.5;
            })
        };
        setupEnsembleBlocks(activity);
        turtleHeapBlock = activity.blocks.turtleheap;
    });

    test("floors fractional index in mouse index heap", () => {
        const result = turtleHeapBlock.arg(logo, 0, 1, null);
        expect(result).toBe(20);
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });

    test("supports negative indices in mouse index heap", () => {
        logo.parseArg.mockImplementation((lg, turtle, cblk) => {
            if (cblk === 2) return "Mr. Mouse";
            if (cblk === 3) return -2;
        });
        const result = turtleHeapBlock.arg(logo, 0, 1, null);
        expect(result).toBe(20);
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });
});
