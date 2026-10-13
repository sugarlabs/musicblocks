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

const LETTERS = { "do": "C", "re": "D", "mi": "E", "fa♯": "F♯" };
global.getNote = (note, octave) => [LETTERS[note] || note, octave];
global.getDrumSynthName = name => name;
global.SOLFEGECONVERSIONTABLE = { "C": "do", "D": "re", "E": "mi", "F♯": "fa♯" };

const PitchDrumMatrixSave = global.PitchDrumMatrixSave;
const METHODS = ["_get_save_lock", "_save"];

describe("PitchDrumMatrixSave", () => {
    let pdm;

    // A pdm table with a row per [label, octave] and a drum name per drum, and
    // the cells of `selected` ([row, col]) marked as selected.
    const matrix = (rows, drums, selected) => {
        pdm = new PitchDrumMatrix();
        pdm.activity = {
            blocks: { palettes: { dict: { drum: { hideMenu: jest.fn() } } } },
            refreshCanvas: jest.fn(),
            turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) },
            errorMsg: jest.fn()
        };
        pdm.activity.blocks.loadNewBlocks = jest.fn();
        const table = document.createElement("table");
        pdm._pdmCellTables = [];
        for (const [label, octave] of rows) {
            const row = table.insertRow();
            const labelCell = row.insertCell();
            labelCell.dataset.noteArg = label;
            labelCell.dataset.octave = String(octave);
            const cells = document.createElement("table");
            const cellRow = cells.insertRow();
            drums.forEach(() => cellRow.insertCell());
            pdm._pdmCellTables.push(cells);
        }
        table.insertRow();
        pdm._pdmTable = table;
        const drumTable = document.createElement("table");
        const drumRow = drumTable.insertRow();
        for (const drum of drums) {
            const img = document.createElement("img");
            img.title = drum;
            drumRow.insertCell().appendChild(img);
        }
        pdm._pdmDrumTable = drumTable;
        for (const [row, col] of selected) {
            pdm._pdmCellTables[row].rows[0].cells[col].style.backgroundColor = "black";
        }
        return pdm;
    };
    const saved = () => pdm.activity.blocks.loadNewBlocks.mock.calls[0][0];
    const blockAt = (stack, index) => stack.find(block => block[0] === index);
    const pairs = stack =>
        stack
            .filter(block => block[1] === "mapdrum")
            .map(mapdrum => {
                const drum = blockAt(stack, mapdrum[4][1]);
                const pitch = blockAt(stack, mapdrum[4][2]);
                return [
                    drum[1][0] + ":" + drum[1][1].value,
                    blockAt(stack, pitch[4][1])[1][1].value,
                    blockAt(stack, pitch[4][2])[1][1].value
                ];
            });

    test("holds exactly the methods moved out of PitchDrumMatrix", () => {
        const names = Object.getOwnPropertyNames(PitchDrumMatrixSave.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchDrumMatrix.prototype", () => {
        expect(PitchDrumMatrix.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchDrumMatrix.prototype[name]).toBe(PitchDrumMatrixSave.prototype[name]);
        }
    });

    test("_get_save_lock gives the save lock", () => {
        pdm = new PitchDrumMatrix();
        pdm._save_lock = true;
        expect(pdm._get_save_lock()).toBe(true);
        pdm._save_lock = false;
        expect(pdm._get_save_lock()).toBe(false);
    });

    test("saves nothing when no cell is selected", () => {
        matrix([["do", 4]], ["kick drum"], []);

        pdm._save();

        expect(pdm.activity.blocks.loadNewBlocks).not.toHaveBeenCalled();
        expect(pdm.activity.blocks.palettes.dict.drum.hideMenu).toHaveBeenCalledWith(true);
    });

    test("saves a collapsed action named drums with a map pitch to drum for each pair", () => {
        matrix(
            [
                ["do", 4],
                ["re", 5]
            ],
            ["kick drum", "snare drum"],
            [
                [0, 1],
                [1, 0]
            ]
        );

        pdm._save();

        const stack = saved();
        expect(stack[0][1]).toEqual(["action", { collapsed: true }]);
        expect(stack[1][1]).toEqual(["text", { value: "drums" }]);
        expect(pairs(stack)).toEqual([
            ["drumname:snare drum", "do", 4],
            ["drumname:kick drum", "re", 5]
        ]);
    });

    test("chains the map pitch to drum blocks through their hidden blocks", () => {
        matrix(
            [
                ["do", 4],
                ["mi", 4]
            ],
            ["kick drum"],
            [
                [0, 0],
                [1, 0]
            ]
        );

        pdm._save();

        const stack = saved();
        const mapdrums = stack.filter(block => block[1] === "mapdrum");
        expect(mapdrums[0][4][0]).toBe(0);
        const firstHidden = blockAt(stack, mapdrums[0][4][3]);
        expect(firstHidden[4]).toEqual([mapdrums[0][0], mapdrums[1][0]]);
        expect(mapdrums[1][4][0]).toBe(firstHidden[0]);
        expect(blockAt(stack, mapdrums[1][4][3])[4]).toEqual([mapdrums[1][0], null]);
    });

    test("saves a sharp as its solfege", () => {
        matrix([["fa♯", 3]], ["kick drum"], [[0, 0]]);

        pdm._save();

        expect(pairs(saved())).toEqual([["drumname:kick drum", "fa♯", 3]]);
    });

    test("saves a drum played from a URL in a text block", () => {
        const url = "https://example.com/clap.wav";
        matrix([["do", 4]], ["kick drum", url], [[0, 1]]);

        pdm._save();

        expect(pairs(saved())).toEqual([["text:" + url, "do", 4]]);
    });
});
