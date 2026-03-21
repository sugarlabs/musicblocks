/**
 * MusicBlocks
 *
 * @author kh-ub-ayb
 *
 * @copyright 2026 kh-ub-ayb
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

const PhraseMakerGrid = require("../PhraseMakerGrid.js");

/**
 * Creates a fresh mock PhraseMaker instance for testing.
 * @returns {Object} A mock PhraseMaker with all required fields.
 */
function createMockPM() {
    return {
        _rowBlocks: [10, 20, 30],
        _colBlocks: [
            [100, 0],
            [200, 0]
        ],
        _rowMap: [0, 1, 2],
        _rowOffset: [0, 0, 0],
        _blockMap: {},
        _blockMapHelper: [],
        _noteBlocks: false,
        blockNo: 0,
        _deps: {
            last: arr => arr[arr.length - 1]
        },
        activity: {
            blocks: {
                blockList: []
            }
        }
    };
}

describe("PhraseMakerGrid", () => {
    describe("Module Export", () => {
        test("exports PhraseMakerGrid object", () => {
            expect(PhraseMakerGrid).toBeDefined();
            expect(typeof PhraseMakerGrid).toBe("object");
        });

        test("has clearBlocks method", () => {
            expect(typeof PhraseMakerGrid.clearBlocks).toBe("function");
        });

        test("has addRowBlock method", () => {
            expect(typeof PhraseMakerGrid.addRowBlock).toBe("function");
        });

        test("has addColBlock method", () => {
            expect(typeof PhraseMakerGrid.addColBlock).toBe("function");
        });

        test("has addNode method", () => {
            expect(typeof PhraseMakerGrid.addNode).toBe("function");
        });

        test("has removeNode method", () => {
            expect(typeof PhraseMakerGrid.removeNode).toBe("function");
        });

        test("has mapNotesBlocks method", () => {
            expect(typeof PhraseMakerGrid.mapNotesBlocks).toBe("function");
        });

        test("has lookForNoteBlocksOrRepeat method", () => {
            expect(typeof PhraseMakerGrid.lookForNoteBlocksOrRepeat).toBe("function");
        });

        test("has syncMarkedBlocks method", () => {
            expect(typeof PhraseMakerGrid.syncMarkedBlocks).toBe("function");
        });
    });

    describe("clearBlocks", () => {
        test("resets _rowBlocks to empty array", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);

            expect(pm._rowBlocks).toEqual([]);
        });

        test("resets _colBlocks to empty array", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);

            expect(pm._colBlocks).toEqual([]);
        });

        test("resets _rowMap to empty array", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);

            expect(pm._rowMap).toEqual([]);
        });

        test("resets _rowOffset to empty array", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);

            expect(pm._rowOffset).toEqual([]);
        });

        test("clears all four arrays in one call", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);

            expect(pm._rowBlocks).toHaveLength(0);
            expect(pm._colBlocks).toHaveLength(0);
            expect(pm._rowMap).toHaveLength(0);
            expect(pm._rowOffset).toHaveLength(0);
        });

        test("does not modify other pm properties", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);

            expect(pm._blockMap).toBeDefined();
            expect(pm.blockNo).toBe(0);
        });
    });

    describe("addRowBlock", () => {
        test("appends rowBlock to _rowBlocks", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addRowBlock(pm, 42);

            expect(pm._rowBlocks).toContain(42);
        });

        test("pushes current _rowBlocks length to _rowMap", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addRowBlock(pm, 42);

            expect(pm._rowMap).toEqual([0]);
        });

        test("pushes 0 to _rowOffset", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addRowBlock(pm, 42);

            expect(pm._rowOffset).toEqual([0]);
        });

        test("adds multiple row blocks sequentially", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addRowBlock(pm, 10);
            PhraseMakerGrid.addRowBlock(pm, 20);
            PhraseMakerGrid.addRowBlock(pm, 30);

            expect(pm._rowBlocks).toEqual([10, 20, 30]);
            expect(pm._rowMap).toEqual([0, 1, 2]);
            expect(pm._rowOffset).toEqual([0, 0, 0]);
        });

        test("handles duplicate rowBlock by offsetting with 1000000", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addRowBlock(pm, 5);
            PhraseMakerGrid.addRowBlock(pm, 5);

            expect(pm._rowBlocks).toHaveLength(2);
            expect(pm._rowBlocks[0]).toBe(5);
            expect(pm._rowBlocks[1]).toBe(5 + 1000000);
        });

        test("handles triple duplicate by offsetting incrementally", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addRowBlock(pm, 7);
            PhraseMakerGrid.addRowBlock(pm, 7);
            PhraseMakerGrid.addRowBlock(pm, 7);

            expect(pm._rowBlocks).toHaveLength(3);
            expect(pm._rowBlocks[0]).toBe(7);
            expect(pm._rowBlocks[1]).toBe(7 + 1000000);
            expect(pm._rowBlocks[2]).toBe(7 + 2000000);
        });
    });

    describe("addColBlock", () => {
        test("adds a single column block entry", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addColBlock(pm, 100, 1);

            expect(pm._colBlocks).toEqual([[100, 0]]);
        });

        test("adds multiple entries for n > 1", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addColBlock(pm, 100, 3);

            expect(pm._colBlocks).toEqual([
                [100, 0],
                [100, 1],
                [100, 2]
            ]);
        });

        test("increments start index for repeated rhythm blocks", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addColBlock(pm, 100, 2);
            PhraseMakerGrid.addColBlock(pm, 100, 2);

            expect(pm._colBlocks).toEqual([
                [100, 0],
                [100, 1],
                [100, 2],
                [100, 3]
            ]);
        });

        test("handles different rhythm blocks independently", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addColBlock(pm, 100, 2);
            PhraseMakerGrid.addColBlock(pm, 200, 2);

            expect(pm._colBlocks).toEqual([
                [100, 0],
                [100, 1],
                [200, 0],
                [200, 1]
            ]);
        });

        test("adds nothing when n is 0", () => {
            const pm = createMockPM();
            PhraseMakerGrid.clearBlocks(pm);
            PhraseMakerGrid.addColBlock(pm, 100, 0);

            expect(pm._colBlocks).toEqual([]);
        });
    });

    describe("addNode", () => {
        test("creates _blockMap entry if undefined", () => {
            const pm = createMockPM();
            PhraseMakerGrid.addNode(pm, 10, 100, 0, 5);

            expect(pm._blockMap[5]).toBeDefined();
            expect(Array.isArray(pm._blockMap[5])).toBe(true);
        });

        test("adds node with correct structure [rowBlock, [rhythmBlock, n], j]", () => {
            const pm = createMockPM();
            PhraseMakerGrid.addNode(pm, 10, 100, 0, 5);

            expect(pm._blockMap[5]).toEqual([[10, [100, 0], 0]]);
        });

        test("increments j for duplicate rowBlock/rhythmBlock/n combination", () => {
            const pm = createMockPM();
            PhraseMakerGrid.addNode(pm, 10, 100, 0, 5);
            PhraseMakerGrid.addNode(pm, 10, 100, 0, 5);

            expect(pm._blockMap[5]).toHaveLength(2);
            expect(pm._blockMap[5][0][2]).toBe(0);
            expect(pm._blockMap[5][1][2]).toBe(1);
        });

        test("does not increment j for different rowBlock", () => {
            const pm = createMockPM();
            PhraseMakerGrid.addNode(pm, 10, 100, 0, 5);
            PhraseMakerGrid.addNode(pm, 20, 100, 0, 5);

            expect(pm._blockMap[5][0][2]).toBe(0);
            expect(pm._blockMap[5][1][2]).toBe(0);
        });

        test("does not increment j for different rhythmBlock", () => {
            const pm = createMockPM();
            PhraseMakerGrid.addNode(pm, 10, 100, 0, 5);
            PhraseMakerGrid.addNode(pm, 10, 200, 0, 5);

            expect(pm._blockMap[5][0][2]).toBe(0);
            expect(pm._blockMap[5][1][2]).toBe(0);
        });

        test("uses separate arrays for different blk values", () => {
            const pm = createMockPM();
            PhraseMakerGrid.addNode(pm, 10, 100, 0, 5);
            PhraseMakerGrid.addNode(pm, 20, 200, 1, 8);

            expect(pm._blockMap[5]).toHaveLength(1);
            expect(pm._blockMap[8]).toHaveLength(1);
        });

        test("preserves existing _blockMap entries for same blk", () => {
            const pm = createMockPM();
            pm._blockMap[5] = [[99, [999, 0], 0]];
            PhraseMakerGrid.addNode(pm, 10, 100, 0, 5);

            expect(pm._blockMap[5]).toHaveLength(2);
            expect(pm._blockMap[5][0]).toEqual([99, [999, 0], 0]);
        });
    });

    describe("removeNode", () => {
        test("removes a matching node from _blockMap", () => {
            const pm = createMockPM();
            pm.blockNo = 5;
            pm._blockMap[5] = [[10, [100, 0], 0]];

            PhraseMakerGrid.removeNode(pm, 10, 100, 0);

            expect(pm._blockMap[5]).toHaveLength(0);
        });

        test("removes only the matching node, leaving others", () => {
            const pm = createMockPM();
            pm.blockNo = 5;
            pm._blockMap[5] = [
                [10, [100, 0], 0],
                [20, [200, 1], 0]
            ];

            PhraseMakerGrid.removeNode(pm, 10, 100, 0);

            expect(pm._blockMap[5]).toHaveLength(1);
            expect(pm._blockMap[5][0][0]).toBe(20);
        });

        test("does not remove nodes with different rowBlock", () => {
            const pm = createMockPM();
            pm.blockNo = 5;
            pm._blockMap[5] = [[10, [100, 0], 0]];

            PhraseMakerGrid.removeNode(pm, 99, 100, 0);

            expect(pm._blockMap[5]).toHaveLength(1);
        });

        test("does not remove nodes with different rhythmBlock", () => {
            const pm = createMockPM();
            pm.blockNo = 5;
            pm._blockMap[5] = [[10, [100, 0], 0]];

            PhraseMakerGrid.removeNode(pm, 10, 999, 0);

            expect(pm._blockMap[5]).toHaveLength(1);
        });

        test("does not remove nodes with different n", () => {
            const pm = createMockPM();
            pm.blockNo = 5;
            pm._blockMap[5] = [[10, [100, 0], 0]];

            PhraseMakerGrid.removeNode(pm, 10, 100, 9);

            expect(pm._blockMap[5]).toHaveLength(1);
        });

        test("uses pm.blockNo to determine which blockMap entry to modify", () => {
            const pm = createMockPM();
            pm.blockNo = 7;
            pm._blockMap[5] = [[10, [100, 0], 0]];
            pm._blockMap[7] = [[10, [100, 0], 0]];

            PhraseMakerGrid.removeNode(pm, 10, 100, 0);

            // Only blockMap[7] affected (pm.blockNo = 7), blockMap[5] untouched
            expect(pm._blockMap[5]).toHaveLength(1);
            expect(pm._blockMap[7]).toHaveLength(0);
        });
    });

    describe("mapNotesBlocks", () => {
        /**
         * Creates a mock PM with a simple block chain for mapNotesBlocks testing.
         * Chain: blockNo(0) -> conn[1]=1 -> {name, conn: [..., next]} -> ...
         */
        function createChainedPM(blocks) {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm.activity.blocks.blockList = [];

            // Block 0 is the start block, connections[1] points to first child
            pm.activity.blocks.blockList[0] = { name: "start", connections: [null, 1] };

            blocks.forEach((b, i) => {
                const blockIdx = i + 1;
                const nextIdx = i + 2 < blocks.length + 1 ? i + 2 : null;
                pm.activity.blocks.blockList[blockIdx] = {
                    name: b,
                    connections: [0, nextIdx]
                };
            });

            return pm;
        }

        test("returns block IDs matching the given block name", () => {
            const pm = createChainedPM(["newnote", "vspace", "newnote"]);
            const result = PhraseMakerGrid.mapNotesBlocks(pm, "newnote");

            expect(result).toEqual([1, 3]);
        });

        test("returns empty array when no blocks match", () => {
            const pm = createChainedPM(["vspace", "hidden"]);
            const result = PhraseMakerGrid.mapNotesBlocks(pm, "newnote");

            expect(result).toEqual([]);
        });

        test("returns [blk, name] pairs when withName is true", () => {
            const pm = createChainedPM(["newnote", "vspace", "newnote"]);
            const result = PhraseMakerGrid.mapNotesBlocks(pm, "newnote", true);

            expect(result).toEqual([
                [1, "newnote"],
                [3, "newnote"]
            ]);
        });

        test("with 'all' blockName, excludes hidden, vspace, hiddennoflow", () => {
            const pm = createChainedPM(["newnote", "hidden", "vspace", "hiddennoflow", "repeat"]);
            const result = PhraseMakerGrid.mapNotesBlocks(pm, "all");

            expect(result).toEqual([1, 5]);
        });

        test("with 'all' and withName, returns pairs excluding filtered names", () => {
            const pm = createChainedPM(["newnote", "hidden", "repeat"]);
            const result = PhraseMakerGrid.mapNotesBlocks(pm, "all", true);

            expect(result).toEqual([
                [1, "newnote"],
                [3, "repeat"]
            ]);
        });

        test("returns single block when chain has only one block", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm.activity.blocks.blockList = [
                { name: "start", connections: [null, 1] },
                { name: "pitch", connections: [0, null] }
            ];
            const result = PhraseMakerGrid.mapNotesBlocks(pm, "pitch");

            expect(result).toEqual([1]);
        });

        test("handles block chain that terminates with null connection", () => {
            const pm = createChainedPM(["newnote"]);
            const result = PhraseMakerGrid.mapNotesBlocks(pm, "newnote");

            expect(result).toEqual([1]);
        });
    });

    describe("lookForNoteBlocksOrRepeat", () => {
        test("sets _noteBlocks to true when newnote block found", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._blockMap[0] = [[10, [1, 0], 0]];
            pm.activity.blocks.blockList[1] = { name: "newnote" };

            PhraseMakerGrid.lookForNoteBlocksOrRepeat(pm);

            expect(pm._noteBlocks).toBe(true);
        });

        test("sets _noteBlocks to true when repeat block found", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._blockMap[0] = [[10, [2, 0], 0]];
            pm.activity.blocks.blockList[2] = { name: "repeat" };

            PhraseMakerGrid.lookForNoteBlocksOrRepeat(pm);

            expect(pm._noteBlocks).toBe(true);
        });

        test("sets _noteBlocks to false when no newnote or repeat found", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._blockMap[0] = [[10, [1, 0], 0]];
            pm.activity.blocks.blockList[1] = { name: "pitch" };

            PhraseMakerGrid.lookForNoteBlocksOrRepeat(pm);

            expect(pm._noteBlocks).toBe(false);
        });

        test("skips blocks with blk === -1", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._blockMap[0] = [[10, [-1, 0], 0]];

            PhraseMakerGrid.lookForNoteBlocksOrRepeat(pm);

            expect(pm._noteBlocks).toBe(false);
        });

        test("skips null blockList entries", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._blockMap[0] = [[10, [5, 0], 0]];
            pm.activity.blocks.blockList[5] = null;

            PhraseMakerGrid.lookForNoteBlocksOrRepeat(pm);

            expect(pm._noteBlocks).toBe(false);
        });

        test("skips undefined blockList entries", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._blockMap[0] = [[10, [99, 0], 0]];
            // blockList[99] is undefined

            PhraseMakerGrid.lookForNoteBlocksOrRepeat(pm);

            expect(pm._noteBlocks).toBe(false);
        });

        test("stops scanning after finding first newnote", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._blockMap[0] = [
                [10, [1, 0], 0],
                [20, [2, 0], 0]
            ];
            pm.activity.blocks.blockList[1] = { name: "newnote" };
            pm.activity.blocks.blockList[2] = { name: "pitch" };

            PhraseMakerGrid.lookForNoteBlocksOrRepeat(pm);

            expect(pm._noteBlocks).toBe(true);
        });

        test("resets _noteBlocks to false at start of each call", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._noteBlocks = true;
            pm._blockMap[0] = [[10, [1, 0], 0]];
            pm.activity.blocks.blockList[1] = { name: "pitch" };

            PhraseMakerGrid.lookForNoteBlocksOrRepeat(pm);

            expect(pm._noteBlocks).toBe(false);
        });

        test("handles empty blockMap", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._blockMap[0] = [];

            PhraseMakerGrid.lookForNoteBlocksOrRepeat(pm);

            expect(pm._noteBlocks).toBe(false);
        });
    });

    describe("syncMarkedBlocks", () => {
        test("filters out entries with rowBlock === -1", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._colBlocks = [[100, 0]];
            pm._blockMap[0] = [[-1, [100, 0], 0]];
            pm._blockMapHelper = [[[100, 0], [0]]];

            PhraseMakerGrid.syncMarkedBlocks(pm);

            expect(pm._blockMap[0]).toEqual([]);
        });

        test("maps blockMap entries through blockMapHelper", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._colBlocks = [
                [100, 0],
                [100, 1]
            ];
            pm._blockMap[0] = [[10, [100, 0], 0]];
            pm._blockMapHelper = [
                [
                    [100, 0],
                    [0, 1]
                ]
            ];

            PhraseMakerGrid.syncMarkedBlocks(pm);

            expect(pm._blockMap[0]).toEqual([
                [10, [100, 0], 0],
                [10, [100, 1], 0]
            ]);
        });

        test("deduplicates resulting entries", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._colBlocks = [[100, 0]];
            pm._blockMap[0] = [
                [10, [100, 0], 0],
                [10, [100, 0], 0]
            ];
            pm._blockMapHelper = [[[100, 0], [0]]];

            PhraseMakerGrid.syncMarkedBlocks(pm);

            expect(pm._blockMap[0]).toEqual([[10, [100, 0], 0]]);
        });

        test("handles empty blockMap", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._blockMap[0] = [];
            pm._blockMapHelper = [];

            PhraseMakerGrid.syncMarkedBlocks(pm);

            expect(pm._blockMap[0]).toEqual([]);
        });

        test("handles no matching helpers", () => {
            const pm = createMockPM();
            pm.blockNo = 0;
            pm._colBlocks = [[100, 0]];
            pm._blockMap[0] = [[10, [999, 0], 0]];
            pm._blockMapHelper = [[[100, 0], [0]]];

            PhraseMakerGrid.syncMarkedBlocks(pm);

            // No match for [999, 0] in helper, so result is empty
            expect(pm._blockMap[0]).toEqual([]);
        });

        test("uses pm.blockNo to select correct blockMap entry", () => {
            const pm = createMockPM();
            pm.blockNo = 3;
            pm._colBlocks = [[100, 0]];
            pm._blockMap[3] = [[10, [100, 0], 0]];
            pm._blockMapHelper = [[[100, 0], [0]]];

            PhraseMakerGrid.syncMarkedBlocks(pm);

            expect(pm._blockMap[3]).toEqual([[10, [100, 0], 0]]);
        });
    });
});
