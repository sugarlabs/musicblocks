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

const { setupHeapBlocks } = require("../HeapBlocks");

describe("setupHeapBlocks", () => {
    let activity, logo, createdBlocks;

    class DummyValueBlock {
        constructor(name, displayName) {
            this.name = name;
            this.displayName = displayName;
            createdBlocks[name] = this;
        }
        setPalette() { return this; }
        beginnerBlock() { return this; }
        setHelpString() { return this; }
        formBlock() { return this; }
        setup() { return this; }
    }

    class DummyFlowBlock {
        constructor(name, displayName) {
            this.name = name;
            this.displayName = displayName;
            createdBlocks[name] = this;
        }
        setPalette() { return this; }
        beginnerBlock() { return this; }
        setHelpString() { return this; }
        formBlock() { return this; }
        makeMacro() { return this; }
        setup() { return this; }
    }

    class DummyLeftBlock {
        constructor(name, displayName) {
            this.name = name;
            this.displayName = displayName;
            createdBlocks[name] = this;
        }
        setPalette() { return this; }
        beginnerBlock() { return this; }
        setHelpString() { return this; }
        formBlock() { return this; }
        setup() { return this; }
    }

    beforeEach(() => {
        createdBlocks = {};

        global._ = jest.fn((str) => str);
        global.ValueBlock = DummyValueBlock;
        global.FlowBlock = DummyFlowBlock;
        global.LeftBlock = DummyLeftBlock;
        global.NOINPUTERRORMSG = "No input provided";
        global.NANERRORMSG = "Not a number";

        activity = {
            errorMsg: jest.fn(),
            textMsg: jest.fn(),
            blocks: {
                blockList: {}
            }
        };

        logo = {
            inStatusMatrix: false,
            turtleHeaps: {},
            statusFields: [],
            parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => receivedArg)
        };

        activity.blocks.blockList = {
            10: { connections: [20] },
            20: { name: "print" }
        };

        setupHeapBlocks(activity);
    });

    function setTurtleHeap(turtle, heapArray) {
        logo.turtleHeaps[turtle] = heapArray;
    }

    describe("HeapBlock", () => {
        it("should return JSON string of the turtle heap when not in status matrix", () => {
            const turtle = 0;
            setTurtleHeap(turtle, [1, 2, 3]);
            const heapBlock = createdBlocks["heap"];
            logo.inStatusMatrix = false;
            const result = heapBlock.arg(logo, turtle, 99);
            expect(result).toEqual(JSON.stringify([1, 2, 3]));
        });

        it("should push to statusFields when in status matrix and connected to print", () => {
            const turtle = 0;
            setTurtleHeap(turtle, [4, 5]);
            const heapBlock = createdBlocks["heap"];
            logo.inStatusMatrix = true;
            const blk = 10;
            const result = heapBlock.arg(logo, turtle, blk);
            expect(result).toBeUndefined();
            expect(logo.statusFields).toContainEqual([blk, "heap"]);
        });
    });

    describe("ShowHeapBlock", () => {
        it("should display the turtle heap as JSON string via activity.textMsg", () => {
            const turtle = 0;
            setTurtleHeap(turtle, [7, 8, 9]);
            const showHeapBlock = createdBlocks["showHeap"];
            showHeapBlock.flow([], logo, turtle);
            expect(activity.textMsg).toHaveBeenCalledWith(JSON.stringify([7, 8, 9]));
        });

        it("should create an empty heap if turtle heap is undefined", () => {
            const turtle = 1;
            delete logo.turtleHeaps[turtle];
            const showHeapBlock = createdBlocks["showHeap"];
            showHeapBlock.flow([], logo, turtle);
            expect(logo.turtleHeaps[turtle]).toEqual([]);
            expect(activity.textMsg).toHaveBeenCalledWith("[]");
        });
    });

    describe("HeapLengthBlock", () => {
        it("should return the length of the turtle heap when not in status matrix", () => {
            const turtle = 0;
            setTurtleHeap(turtle, [10, 20, 30, 40]);
            const heapLengthBlock = createdBlocks["heapLength"];
            logo.inStatusMatrix = false;
            const result = heapLengthBlock.arg(logo, turtle, 99);
            expect(result).toEqual(4);
        });

        it("should push to statusFields when in status matrix and connected to print", () => {
            const turtle = 0;
            setTurtleHeap(turtle, [1]);
            const heapLengthBlock = createdBlocks["heapLength"];
            logo.inStatusMatrix = true;
            const blk = 10;
            const result = heapLengthBlock.arg(logo, turtle, blk);
            expect(result).toBeUndefined();
            expect(logo.statusFields).toContainEqual([blk, "heapLength"]);
        });
    });

    describe("HeapEmptyBlock", () => {
        it("should return true if the heap is empty", () => {
            const turtle = 0;
            setTurtleHeap(turtle, []);
            const heapEmptyBlock = createdBlocks["heapEmpty"];
            const result = heapEmptyBlock.arg(logo, turtle);
            expect(result).toBe(true);
        });

        it("should return false if the heap is not empty", () => {
            const turtle = 0;
            setTurtleHeap(turtle, [5]);
            const heapEmptyBlock = createdBlocks["heapEmpty"];
            const result = heapEmptyBlock.arg(logo, turtle);
            expect(result).toBe(false);
        });

        it("should return true if turtle heap is undefined", () => {
            const turtle = 2;
            delete logo.turtleHeaps[turtle];
            const heapEmptyBlock = createdBlocks["heapEmpty"];
            const result = heapEmptyBlock.arg(logo, turtle);
            expect(result).toBe(true);
        });
    });

    describe("EmptyHeapBlock", () => {
        it("should empty the turtle heap", () => {
            const turtle = 0;
            setTurtleHeap(turtle, [1, 2, 3]);
            const emptyHeapBlock = createdBlocks["emptyHeap"];
            emptyHeapBlock.flow([], logo, turtle);
            expect(logo.turtleHeaps[turtle]).toEqual([]);
        });
    });

    describe("ReverseHeapBlock", () => {
        it("should reverse the turtle heap", () => {
            const turtle = 0;
            setTurtleHeap(turtle, [1, 2, 3, 4]);
            const reverseHeapBlock = createdBlocks["reverseHeap"];
            reverseHeapBlock.flow([], logo, turtle);
            expect(logo.turtleHeaps[turtle]).toEqual([4, 3, 2, 1]);
        });
    });

    describe("IndexHeapBlock", () => {
        let indexHeapBlock;
        const blk = 50;
        beforeEach(() => {
            activity.blocks.blockList[blk] = { connections: [null, 100] };
            activity.blocks.blockList[100] = { name: "dummy" };
            indexHeapBlock = createdBlocks["indexHeap"];
            setTurtleHeap(0, [10, 20, 30]);
        });

        it("should call errorMsg if connections[1] is null", () => {
            activity.blocks.blockList[blk] = { connections: [null, null] };
            indexHeapBlock.arg(logo, 0, blk, 2);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", blk);
        });

        it("should return the value at the given index when valid", () => {
            logo.parseArg.mockReturnValue(2);
            const result = indexHeapBlock.arg(logo, 0, blk, 2);
            expect(result).toEqual(20);
        });

        it("should treat -1 as the top of the heap", () => {
            logo.parseArg.mockReturnValue(-1);
            const result = indexHeapBlock.arg(logo, 0, blk, -1);
            expect(result).toEqual(30);
        });

        it("should adjust index < 1 and call errorMsg", () => {
            logo.parseArg.mockReturnValue(0);
            const result = indexHeapBlock.arg(logo, 0, blk, 0);
            expect(activity.errorMsg).toHaveBeenCalledWith("Index must be > 0.");
            expect(result).toEqual(10);
        });

        it("should adjust index > 1000 and call errorMsg", () => {
            logo.parseArg.mockReturnValue(1500);
            setTurtleHeap(0, []);
            const result = indexHeapBlock.arg(logo, 0, blk, 1500);
            expect(activity.errorMsg).toHaveBeenCalledWith("Maximum heap size is 1000.");
            expect(result).toEqual(0);
            expect(logo.turtleHeaps[0].length).toEqual(1000);
        });

        it("should call errorMsg and return 0 if parseArg is not a number", () => {
            logo.parseArg.mockReturnValue("not a number");
            const result = indexHeapBlock.arg(logo, 0, blk, "not a number");
            expect(activity.errorMsg).toHaveBeenCalledWith("Not a number", blk);
            expect(result).toEqual(0);
        });
    });

    describe("SetHeapEntryBlock", () => {
        let setHeapEntryBlock;
        const blk = 60;
        beforeEach(() => {
            setHeapEntryBlock = createdBlocks["setHeapEntry"];
            setTurtleHeap(0, [1, 2, 3]);
        });

        it("should call errorMsg if any argument is null", () => {
            setHeapEntryBlock.flow([null, 99], logo, 0, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", blk);
        });

        it("should call errorMsg if arguments are not numbers", () => {
            setHeapEntryBlock.flow(["a", 99], logo, 0, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith("Not a number", blk);
        });

        it("should adjust index < 1 and set the value at index 1", () => {
            setHeapEntryBlock.flow([0, 55], logo, 0, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith("Index must be > 0.");
            expect(logo.turtleHeaps[0][0]).toEqual(55);
        });

        it("should adjust index > 1000 and set the value at index 1000", () => {
            setHeapEntryBlock.flow([1500, 77], logo, 0, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith("Maximum heap size is 1000.");
            expect(logo.turtleHeaps[0].length).toEqual(1000);
            expect(logo.turtleHeaps[0][999]).toEqual(77);
        });

        it("should set the heap entry for valid input", () => {
            setHeapEntryBlock.flow([2, 88], logo, 0, blk);
            expect(logo.turtleHeaps[0][1]).toEqual(88);
        });
    });

    describe("PopBlock", () => {
        it("should pop and return the top value from the heap if nonempty", () => {
            setTurtleHeap(0, [100, 200, 300]);
            const popBlock = createdBlocks["pop"];
            const result = popBlock.arg(logo, 0);
            expect(result).toEqual(300);
            expect(logo.turtleHeaps[0]).toEqual([100, 200]);
        });

        it("should call errorMsg and return 0 if the heap is empty", () => {
            setTurtleHeap(0, []);
            const popBlock = createdBlocks["pop"];
            const result = popBlock.arg(logo, 0);
            expect(activity.errorMsg).toHaveBeenCalledWith("empty heap");
            expect(result).toEqual(0);
        });
    });

    describe("PushBlock", () => {
        it("should push a value onto the heap", () => {
            setTurtleHeap(0, [5]);
            const pushBlock = createdBlocks["push"];
            pushBlock.flow([42], logo, 0, 70);
            expect(logo.turtleHeaps[0]).toEqual([5, 42]);
        });

        it("should call errorMsg if the value to push is null", () => {
            setTurtleHeap(0, [5]);
            const pushBlock = createdBlocks["push"];
            pushBlock.flow([null], logo, 0, 70);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", 70);
        });
    });
});
