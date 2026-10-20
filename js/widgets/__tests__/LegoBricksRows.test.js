/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

global.LegoBricksRows = require("../LegoBricksRows");
global.LegoBricksLayout = require("../LegoBricksLayout");
global.LegoBricksExport = require("../LegoBricksExport");
global.LegoBricksMedia = require("../LegoBricksMedia");
global.LegoBricksEyeDropper = require("../LegoBricksEyeDropper");
global.LegoBricksColor = require("../LegoBricksColor");
global.LegoBricksPlayback = require("../LegoBricksPlayback");
global.LegoBricksVisualization = require("../LegoBricksVisualization");
global.LegoWidget = require("../legobricks");

const LegoWidget = global.LegoWidget;
const LegoBricksRows = global.LegoBricksRows;
const METHODS = [
    "clearBlocks",
    "addRowBlock",
    "_generateRowsFromPitchBlocks",
    "_calculateFallbackFrequency",
    "_initializeRowHeaders"
];

describe("LegoBricksRows", () => {
    let widget;

    beforeEach(() => {
        widget = new LegoWidget();
        widget.activity = {
            turtles: { ithTurtle: () => ({ singer: { keySignature: "C major" } }) }
        };
    });

    afterEach(() => {
        delete global.noteToFrequency;
    });

    test("holds exactly the methods moved out of LegoWidget", () => {
        const target = {};
        LegoBricksRows.call(target);
        expect(Object.keys(target).sort()).toEqual([...METHODS].sort());
    });

    test("installModules sets the same methods on each widget instance", () => {
        const target = {};
        LegoBricksRows.call(target);
        for (const name of METHODS) {
            expect(Object.prototype.hasOwnProperty.call(widget, name)).toBe(true);
            expect(widget[name].toString()).toBe(target[name].toString());
        }
    });

    describe("row blocks", () => {
        test("addRowBlock gives a repeated block a unique id", () => {
            widget.addRowBlock(7);
            widget.addRowBlock(7);
            widget.addRowBlock(9);

            expect(widget._rowBlocks).toEqual([7, 1000007, 9]);
            expect(widget._rowMap).toEqual([0, 1, 2]);
            expect(widget._rowOffset).toEqual([0, 0, 0]);
        });

        test("clearBlocks forgets every row block", () => {
            widget.addRowBlock(7);
            widget.clearBlocks();
            expect(widget._rowBlocks).toEqual([]);
            expect(widget._rowMap).toEqual([]);
            expect(widget._rowOffset).toEqual([]);
        });
    });

    describe("_generateRowsFromPitchBlocks", () => {
        test("sorts the pitches from high to low and adds the control row", () => {
            global.noteToFrequency = jest.fn(note => ({ C4: 261.63, G4: 392, E4: 329.63 })[note]);
            widget.rowLabels = ["C", "G", "E"];
            widget.rowArgs = [4, 4, 4];

            widget._generateRowsFromPitchBlocks();

            expect(widget.matrixData.rows.map(r => r.note)).toEqual(["G4", "E4", "C4", undefined]);
            expect(widget.matrixData.rows[3]).toEqual(
                expect.objectContaining({ type: "control", label: "Zoom Controls" })
            );
            expect(global.noteToFrequency).toHaveBeenCalledWith("C4", "C major");
        });

        test("skips drum rows", () => {
            widget.rowLabels = ["C", "kick drum"];
            widget.rowArgs = [4, -1];
            widget._generateRowsFromPitchBlocks();
            expect(widget.matrixData.rows.filter(r => r.type === "pitch")).toHaveLength(1);
        });

        test("labels solfege rows with their capitalized name", () => {
            widget.rowLabels = ["sol", "do"];
            widget.rowArgs = [4, 4];
            widget._generateRowsFromPitchBlocks();
            expect(widget.matrixData.rows.map(r => r.label)).toEqual([
                "So (4)",
                "Do (4)",
                "Zoom Controls"
            ]);
        });

        test("falls back to the built-in table when noteToFrequency throws", () => {
            global.noteToFrequency = jest.fn(() => {
                throw new Error("bad key");
            });
            widget.rowLabels = ["A", "C"];
            widget.rowArgs = [3, 4];
            widget._generateRowsFromPitchBlocks();
            expect(widget.matrixData.rows[0].frequency).toBeCloseTo(261.63);
            expect(widget.matrixData.rows[1].frequency).toBeCloseTo(220);
        });

        test("shows three default rows when there are no pitch blocks", () => {
            widget.rowLabels = [];
            widget.rowArgs = [];
            widget._generateRowsFromPitchBlocks();
            expect(widget.matrixData.rows.map(r => r.note)).toEqual(["E4", "D4", "C4", undefined]);
        });
    });

    test("_calculateFallbackFrequency handles letter and solfege names across octaves", () => {
        expect(widget._calculateFallbackFrequency("A", 4)).toBeCloseTo(440);
        expect(widget._calculateFallbackFrequency("la", 5)).toBeCloseTo(880);
        expect(widget._calculateFallbackFrequency("c", 3)).toBeCloseTo(130.815);
        expect(widget._calculateFallbackFrequency("xyz", 4)).toBeCloseTo(261.63);
    });

    describe("_initializeRowHeaders", () => {
        beforeEach(() => {
            widget.rowHeaderTable = document.createElement("table");
            widget.matrixData.rows = [
                { type: "pitch", label: "So (4)", note: "G4" },
                { type: "control", label: "Zoom Controls" }
            ];
            widget._playNote = jest.fn();
            widget._initializeRowHeaders();
        });

        test("draws one header per row with a divider under all but the last", () => {
            const rows = widget.rowHeaderTable.rows;
            expect(rows).toHaveLength(2);
            expect(rows[0].textContent).toBe("So (4)");
            expect(rows[0].querySelectorAll("div")).toHaveLength(2);
            expect(rows[1].querySelectorAll("div")).toHaveLength(1);
        });

        test("a pitch header plays its note and gives press feedback", () => {
            const cell = widget.rowHeaderTable.rows[0].cells[0];
            expect(cell.style.cursor).toBe("pointer");

            cell.onmousedown();
            expect(cell.style.transform).toBe("scale(0.98)");
            cell.onmouseleave();
            expect(cell.style.transform).toBe("");

            cell.onclick();
            expect(widget._playNote).toHaveBeenCalledWith("G4");
        });

        test("the control header is not clickable", () => {
            const cell = widget.rowHeaderTable.rows[1].cells[0];
            expect(cell.style.cursor).toBe("default");
            expect(cell.onclick).toBeNull();
        });

        test("redrawing replaces the old headers", () => {
            widget._initializeRowHeaders();
            expect(widget.rowHeaderTable.rows).toHaveLength(2);
        });
    });
});
