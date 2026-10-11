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

const DRUMS = ["kick drum", "snare drum"];
global._ = s => s;
global.platformColor = {
    labelColor: "rgb(144, 193, 0)",
    selectorBackground: "rgb(100, 181, 246)",
    selectorSelected: "rgb(208, 208, 208)"
};
global.docById = id => document.getElementById(id);
global.getDrumName = name => (DRUMS.includes(name) ? name : null);
global.getDrumIcon = () => "icon.svg";
global.getDrumSynthName = name => name;
global.getNote = (note, octave) => [note, octave];
global.normalizeNoteAccidentals = note => note;
global.Singer = { defaultBPMFactor: 1 };
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 80;

const PitchDrumMatrixCells = global.PitchDrumMatrixCells;
const METHODS = ["makeClickable", "_setCellPitchDrum", "_setPairCell"];

describe("PitchDrumMatrixCells", () => {
    let pdm;
    let trigger;

    // A grid with a row per pitch block in `rowBlocks` and a column per drum.
    const grid = (rowBlocks, blockMap = []) => {
        document.body.innerHTML = "";
        trigger = jest.fn();
        pdm = new PitchDrumMatrix();
        pdm.activity = {
            logo: { synth: { trigger } },
            turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) },
            errorMsg: jest.fn()
        };
        pdm.widgetWindow = {
            timerManager: { setTimeout: (callback, delay) => setTimeout(callback, delay) }
        };
        pdm._cellScale = 1;
        pdm.rowLabels = rowBlocks.map(() => "C");
        pdm.rowArgs = rowBlocks.map(() => 4);
        pdm.drums = [...DRUMS];
        rowBlocks.forEach(blk => pdm.addRowBlock(blk));
        pdm.addColBlock(30);
        pdm.addColBlock(31);
        pdm._blockMap = blockMap;
        const table = document.createElement("table");
        table.id = "pdmTable";
        document.body.appendChild(table);
        pdm._pdmTable = table;
        pdm._pdmCellTables = [];
        pdm._makeDrumRow(pdm._makeRows());
        pdm.makeClickable();
        return pdm;
    };
    const click = (row, col) => document.getElementById(row + "," + col).click();
    const selected = () =>
        pdm._pdmCellTables.map(table =>
            [...table.rows[0].cells]
                .map(cell => (cell.style.backgroundColor === "black" ? 1 : 0))
                .join("")
        );

    afterEach(() => {
        jest.useRealTimers();
    });

    test("holds exactly the methods moved out of PitchDrumMatrix", () => {
        const names = Object.getOwnPropertyNames(PitchDrumMatrixCells.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchDrumMatrix.prototype", () => {
        expect(PitchDrumMatrix.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchDrumMatrix.prototype[name]).toBe(PitchDrumMatrixCells.prototype[name]);
        }
    });

    test("clicking a cell selects it and maps its pitch block to its drum block", () => {
        grid([20, 21]);

        click(1, 0);

        expect(selected()).toEqual(["00", "10"]);
        expect(pdm._blockMap).toEqual([[21, 30, 0]]);
    });

    test("clicking a selected cell clears it and its mapping", () => {
        grid([20]);
        click(0, 1);

        click(0, 1);

        expect(selected()).toEqual(["00"]);
        expect(pdm._blockMap).toEqual([]);
    });

    test("a row has one drum: picking another replaces it", () => {
        grid([20]);
        click(0, 0);

        click(0, 1);

        expect(selected()).toEqual(["01"]);
        expect(pdm._blockMap).toEqual([[20, 31, 0]]);
    });

    test("clicking plays the pitch, then the drum a moment later", () => {
        jest.useFakeTimers();
        grid([20]);

        click(0, 1);
        expect(trigger).toHaveBeenCalledTimes(1);
        expect(trigger).toHaveBeenLastCalledWith(0, "C4", 0.125, "default", null, null);

        jest.advanceTimersByTime(250);
        expect(trigger).toHaveBeenCalledTimes(2);
        expect(trigger).toHaveBeenLastCalledWith(0, "C2", 0.125, "snare drum", null, null);
    });

    test("a delayed drum from playback is dropped once that run is over", () => {
        jest.useFakeTimers();
        grid([20]);
        pdm._playing = true;
        pdm._playRun = 1;
        const cell = pdm._pdmCellTables[0].rows[0].cells[0];

        pdm._setPairCell(0, 0, cell, true, 1);
        pdm._playRun = 2;
        jest.advanceTimersByTime(250);

        expect(trigger).toHaveBeenCalledTimes(1);
    });

    test("marks the pairs kept from an earlier run, without playing them", () => {
        grid([20, 21], [[21, 31, 0]]);

        expect(selected()).toEqual(["00", "01"]);
        expect(trigger).not.toHaveBeenCalled();
    });

    test("skips a kept pair whose pitch or drum block is gone", () => {
        grid(
            [20],
            [
                [22, 30, 0],
                [20, 32, 0]
            ]
        );

        expect(selected()).toEqual(["00"]);
    });

    test("puts a kept pair back on its own row of a repeated pitch block", () => {
        grid(
            [20, 20],
            [
                [20, 31, 1],
                [20, 30, 0]
            ]
        );

        expect(selected()).toEqual(["10", "01"]);
    });

    test("puts a kept pair without a row on the first row of its pitch block", () => {
        grid([20, 20], [[20, 30]]);

        expect(selected()).toEqual(["10", "00"]);
    });
});
