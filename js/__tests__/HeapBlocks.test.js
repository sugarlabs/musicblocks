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

    test("returns top of heap with index -1 on non-empty heap", () => {
        logo.turtleHeaps[0] = [10, 20, 30];
        logo.parseArg.mockReturnValue(-1);

        const result = indexHeapBlock.arg(logo, 0, 1, null);
        expect(result).toBe(30);
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });

    test("reports 'empty heap' and returns 0 with index -1 on empty heap", () => {
        logo.turtleHeaps[0] = [];
        logo.parseArg.mockReturnValue(-1);

        const result = indexHeapBlock.arg(logo, 0, 1, null);
        expect(result).toBe(0);
        expect(activity.errorMsg).toHaveBeenCalledWith("empty heap");
    });

    test("reports error and floors when index < 1", () => {
        logo.turtleHeaps[0] = [10, 20, 30];
        logo.parseArg.mockReturnValue(0.5);

        const result = indexHeapBlock.arg(logo, 0, 1, null);
        expect(result).toBe(10);
        expect(activity.errorMsg).toHaveBeenCalledWith("Index must be > 0.");
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
});
