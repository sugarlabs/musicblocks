/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
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

global.PitchDrumMatrixWindow = require("../PitchDrumMatrixWindow.js");
global.PitchDrumMatrixGrid = require("../PitchDrumMatrixGrid.js");
global.PitchDrumMatrixBlocks = require("../PitchDrumMatrixBlocks.js");
global.PitchDrumMatrixCells = require("../PitchDrumMatrixCells.js");
global.PitchDrumMatrixPlayback = require("../PitchDrumMatrixPlayback.js");
global.PitchDrumMatrixSave = require("../PitchDrumMatrixSave.js");
global.PitchDrumMatrix = require("../pitchdrummatrix.js");

const PitchDrumMatrixBlocks = global.PitchDrumMatrixBlocks;
const METHODS = [
    "clearBlocks",
    "addRowBlock",
    "addColBlock",
    "hasPitchRows",
    "addNode",
    "removeNode",
    "_rowRepeat",
    "_rowOf",
    "restoreSavedCells",
    "_storeCells"
];

describe("PitchDrumMatrixBlocks", () => {
    let pdm;

    beforeEach(() => {
        pdm = new PitchDrumMatrix();
    });

    test("holds exactly the methods moved out of PitchDrumMatrix", () => {
        const names = Object.getOwnPropertyNames(PitchDrumMatrixBlocks.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchDrumMatrix.prototype", () => {
        expect(PitchDrumMatrix.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchDrumMatrix.prototype[name]).toBe(PitchDrumMatrixBlocks.prototype[name]);
            expect(
                Object.getOwnPropertyDescriptor(PitchDrumMatrix.prototype, name).enumerable
            ).toBe(false);
        }
    });

    test("records the pitch block of each row and the drum block of each column", () => {
        pdm.addRowBlock(10);
        pdm.addRowBlock(11);
        pdm.addColBlock(20);

        expect(pdm._rowBlocks).toEqual([10, 11]);
        expect(pdm._colBlocks).toEqual([20]);
    });

    test("clearBlocks forgets the rows and columns but keeps the block map", () => {
        pdm.addRowBlock(10);
        pdm.addColBlock(20);
        pdm.addNode(10, 20);

        pdm.clearBlocks();

        expect(pdm._rowBlocks).toEqual([]);
        expect(pdm._colBlocks).toEqual([]);
        expect(pdm._blockMap).toEqual([[10, 20, 0]]);
    });

    test("hasPitchRows is true once a pitch block is a row", () => {
        expect(pdm.hasPitchRows()).toBe(false);

        pdm.addColBlock(20);
        expect(pdm.hasPitchRows()).toBe(false);

        pdm.addRowBlock(10);
        expect(pdm.hasPitchRows()).toBe(true);
    });

    test("addNode adds each pair once", () => {
        pdm.addNode(10, 20);
        pdm.addNode(10, 20);
        pdm.addNode(10, 21);

        expect(pdm._blockMap).toEqual([
            [10, 20, 0],
            [10, 21, 0]
        ]);
    });

    test("addNode keeps a pair for each row of a repeated pitch block", () => {
        pdm.addNode(10, 20, 0);
        pdm.addNode(10, 20, 1);
        pdm.addNode(10, 20, 1);

        expect(pdm._blockMap).toEqual([
            [10, 20, 0],
            [10, 20, 1]
        ]);
    });

    test("removeNode removes only the pair for that row", () => {
        pdm.addNode(10, 20, 0);
        pdm.addNode(10, 20, 1);

        pdm.removeNode(10, 20, 1);

        expect(pdm._blockMap).toEqual([[10, 20, 0]]);
    });

    test("removeNode treats a pair without a row as the first row", () => {
        pdm._blockMap = [[10, 20]];

        pdm.removeNode(10, 20);

        expect(pdm._blockMap).toEqual([]);
    });

    test("removeNode leaves the map alone when nothing matches", () => {
        pdm.addNode(10, 20);

        pdm.removeNode(10, 21);
        pdm.removeNode(11, 20);

        expect(pdm._blockMap).toEqual([[10, 20, 0]]);
    });

    test("_rowRepeat counts the earlier rows of the same pitch block", () => {
        [10, 11, 10, 10].forEach(blk => pdm.addRowBlock(blk));

        expect([0, 1, 2, 3].map(row => pdm._rowRepeat(row))).toEqual([0, 0, 1, 2]);
    });

    test("_rowOf finds the row back from the pitch block and its repeat", () => {
        [10, 11, 10, 10].forEach(blk => pdm.addRowBlock(blk));

        expect(pdm._rowOf(10, 0)).toBe(0);
        expect(pdm._rowOf(11, 0)).toBe(1);
        expect(pdm._rowOf(10, 1)).toBe(2);
        expect(pdm._rowOf(10, 2)).toBe(3);
    });

    test("_rowOf gives -1 for a pitch block or repeat that isn't there", () => {
        [10, 10].forEach(blk => pdm.addRowBlock(blk));

        expect(pdm._rowOf(10, 2)).toBe(-1);
        expect(pdm._rowOf(12, 0)).toBe(-1);
    });

    describe("cells saved with the project", () => {
        let block;

        // The matrix opened by block 5, with rows for pitch blocks 10 and 11 and drums 20 and 21.
        beforeEach(() => {
            block = { name: "pitchdrummatrix" };
            pdm.activity = { blocks: { blockList: { 5: block } } };
            pdm.blockNo = 5;
            [10, 11].forEach(blk => pdm.addRowBlock(blk));
            [20, 21].forEach(blk => pdm.addColBlock(blk));
        });

        test("addNode and removeNode keep the cells on the block that opened the matrix", () => {
            pdm.addNode(10, 20);
            pdm.addNode(11, 21, 1);
            expect(block.drumCells).toEqual([
                [10, 20, 0],
                [11, 21, 1]
            ]);

            pdm.removeNode(10, 20);
            expect(block.drumCells).toEqual([[11, 21, 1]]);
        });

        test("keeps the saved cells of pitches and drums this run didn't reach", () => {
            block.drumCells = [
                [12, 20, 0],
                [10, 22, 0],
                [10, 21, 0]
            ];

            pdm.addNode(11, 20);

            expect(block.drumCells).toEqual([
                [12, 20, 0],
                [10, 22, 0],
                [11, 20, 0]
            ]);
        });

        test("doesn't put the cells of another matrix on this block", () => {
            pdm._blockMap = [[40, 50, 0]];

            pdm.addNode(10, 20);

            expect(block.drumCells).toEqual([[10, 20, 0]]);
        });

        test("does nothing without the block that opened the matrix", () => {
            pdm.blockNo = null;

            pdm.addNode(10, 20);

            expect(pdm._blockMap).toEqual([[10, 20, 0]]);
            expect(block.drumCells).toBeUndefined();
        });

        test("restoreSavedCells adds the saved cells to the block map once", () => {
            pdm._blockMap = [[10, 20, 0]];
            block.drumCells = [
                [10, 20, 0],
                [11, 21, 1]
            ];

            pdm.restoreSavedCells();
            pdm.restoreSavedCells();

            expect(pdm._blockMap).toEqual([
                [10, 20, 0],
                [11, 21, 1]
            ]);
        });

        test("a cell cleared in this session stays cleared", () => {
            block.drumCells = [[10, 20, 0]];
            pdm.restoreSavedCells();

            pdm.removeNode(10, 20);
            pdm.restoreSavedCells();

            expect(pdm._blockMap).toEqual([]);
        });

        test("restoreSavedCells ignores a block without saved cells", () => {
            pdm.restoreSavedCells();
            pdm.blockNo = 6;
            pdm.restoreSavedCells();

            expect(pdm._blockMap).toEqual([]);
        });
    });
});
