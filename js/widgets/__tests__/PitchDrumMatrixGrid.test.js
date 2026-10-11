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
global.getDrumIcon = name => (DRUMS.includes(name) ? "images/" + name + ".svg" : "images/drum.svg");
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 80;

const PitchDrumMatrixGrid = global.PitchDrumMatrixGrid;
const METHODS = ["_makeRows", "_makeDrumRow", "_addDrum"];

describe("PitchDrumMatrixGrid", () => {
    let pdm;

    // Builds the empty pdm table the way init does, then the rows.
    const grid = (labels, args, drums = []) => {
        document.body.innerHTML = "";
        pdm = new PitchDrumMatrix();
        pdm._cellScale = 1;
        pdm.rowLabels = labels;
        pdm.rowArgs = args;
        pdm.drums = drums;
        const table = document.createElement("table");
        table.id = "pdmTable";
        document.body.appendChild(table);
        pdm._pdmTable = table;
        pdm._pdmCellTables = [];
        const drumRow = pdm._makeRows();
        pdm._makeDrumRow(drumRow);
        return pdm;
    };
    const rowLabels = () =>
        [...pdm._pdmTable.rows].slice(0, -1).map(row => row.cells[0].textContent);
    const drumImages = () => [...pdm._pdmDrumTable.rows[0].cells].map(c => c.querySelector("img"));

    test("holds exactly the methods moved out of PitchDrumMatrix", () => {
        const names = Object.getOwnPropertyNames(PitchDrumMatrixGrid.prototype).filter(
            name => name !== "constructor"
        );
        expect(names.sort()).toEqual([...METHODS].sort());
    });

    test("installModules puts the same functions on PitchDrumMatrix.prototype", () => {
        expect(PitchDrumMatrix.installModules()).toBe(true);
        for (const name of METHODS) {
            expect(PitchDrumMatrix.prototype[name]).toBe(PitchDrumMatrixGrid.prototype[name]);
        }
    });

    test("makes a labelled row for each pitch, plus the drum row", () => {
        grid(["do", "re"], [4, 5]);

        expect(rowLabels()).toEqual(["do4", "re5"]);
        expect(pdm._pdmTable.rows).toHaveLength(3);
        const label = pdm._pdmTable.rows[1].cells[0];
        expect(label.dataset.noteArg).toBe("re");
        expect(label.dataset.octave).toBe("5");
        expect(pdm._pdmCellTables.map(t => t.id)).toEqual(["pdmCellTable0", "pdmCellTable1"]);
    });

    test("skips rests, however they are written", () => {
        grid(["do", "rest", "R", "re"], [4, 4, 4, 4]);

        expect(rowLabels()).toEqual(["do4", "re4"]);
    });

    test("makes a drum named as a pitch into a column", () => {
        grid(["do", "snare drum"], [4, 4]);

        expect(rowLabels()).toEqual(["do4"]);
        expect(pdm.drums).toEqual(["snare drum"]);
        expect(drumImages().map(img => img.title)).toEqual(["snare drum"]);
    });

    test("adds a cell to every row and a name for each drum", () => {
        grid(["do", "re"], [4, 4], DRUMS);

        for (const table of pdm._pdmCellTables) {
            expect(table.rows[0].cells).toHaveLength(2);
        }
        expect(document.getElementById("1,1")).not.toBeNull();
        expect(drumImages().map(img => img.title)).toEqual(DRUMS);
        expect(drumImages().map(img => img.getAttribute("src"))).toEqual([
            "images/kick drum.svg",
            "images/snare drum.svg"
        ]);
    });

    test("sizes the drum cells in pixels", () => {
        grid(["do"], [4], ["kick drum"]);

        const cell = document.getElementById("0,0");
        expect(cell.style.width).toBe("50px");
        expect(cell.style.minWidth).toBe("50px");
        expect(pdm._pdmDrumTable.rows[0].cells[0].style.width).toBe("50px");
    });

    test("highlights a cell under the mouse, but not a selected one", () => {
        grid(["do"], [4], ["kick drum"]);
        const cell = document.getElementById("0,0");

        const hover = type => cell.dispatchEvent(new window.MouseEvent(type));

        hover("mouseover");
        expect(cell.style.backgroundColor).toBe(platformColor.selectorSelected);
        hover("mouseout");
        expect(cell.style.backgroundColor).toBe(platformColor.selectorBackground);

        cell.style.backgroundColor = "black";
        hover("mouseover");
        expect(cell.style.backgroundColor).toBe("black");
    });

    test("names a drum played from a URL after the URL", () => {
        const url = "https://example.com/clap.wav";
        grid(["do"], [4], ["kick drum", url]);

        const img = drumImages()[1];
        expect(img.title).toBe(url);
        expect(img.alt).toBe(url);
        expect(img.getAttribute("src")).toBe("images/drum.svg");
    });
});
