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
const LegoBricksExport = global.LegoBricksExport;
const METHODS = [
    "_savePhrase",
    "_collectNotesToPlay",
    "_filterSmallSegments",
    "_analyzeColumnBoundaries",
    "_convertRowToPitch",
    "_exportPhrase",
    "_clearPhrase"
];

const row = (note, segments) => ({
    note,
    colorSegments: segments.map(([color, duration]) => ({ color, duration }))
});

describe("LegoBricksExport", () => {
    let widget;
    let loaded;

    beforeEach(() => {
        global._ = text => text;
        widget = new LegoWidget();
        loaded = null;
        widget.activity = {
            textMsg: jest.fn(),
            hideMsgs: jest.fn(),
            refreshCanvas: jest.fn(),
            blocks: {
                palettes: { dict: { rhythm: { hideMenu: jest.fn() } } },
                loadNewBlocks: jest.fn(stack => {
                    loaded = stack;
                })
            }
        };
    });

    afterEach(() => {
        delete global._;
    });

    test("holds exactly the methods moved out of LegoWidget", () => {
        const target = {};
        LegoBricksExport.call(target);
        expect(Object.keys(target).sort()).toEqual([...METHODS].sort());
    });

    test("installModules sets the same methods on each widget instance", () => {
        const target = {};
        LegoBricksExport.call(target);
        for (const name of METHODS) {
            expect(Object.prototype.hasOwnProperty.call(widget, name)).toBe(true);
            expect(widget[name].toString()).toBe(target[name].toString());
        }
    });

    describe("_savePhrase", () => {
        test("asks for a scan first", () => {
            widget.colorData = [];
            widget._savePhrase();
            expect(widget.activity.textMsg).toHaveBeenCalledWith(
                "No color data to save. Please scan an image first."
            );
            expect(widget.activity.blocks.loadNewBlocks).not.toHaveBeenCalled();
        });

        test("writes an action stack with one note block per column", () => {
            widget.colorData = [
                row("E4", [
                    ["red", 2000],
                    ["green", 2000]
                ]),
                row("C4", [
                    ["red", 2000],
                    ["blue", 2000]
                ])
            ];

            widget._savePhrase();

            expect(widget.activity.blocks.palettes.dict.rhythm.hideMenu).toHaveBeenCalledWith(true);
            expect(loaded[0][1]).toEqual(["action", { collapsed: true }]);
            expect(loaded.filter(block => block[1] === "newnote")).toHaveLength(2);

            const solfege = loaded.filter(block => block[1][0] === "solfege");
            // First column plays both rows, second column only the blue C4.
            expect(solfege.map(block => block[1][1].value)).toEqual(["mi", "do", "do"]);
            expect(widget.activity.textMsg).toHaveBeenLastCalledWith(
                "LEGO phrase saved as action blocks with 2 notes."
            );
        });

        test("saves a sharp row as a pitch, not a rest", () => {
            widget.colorData = [row("F♯4", [["red", 2000]])];

            widget._savePhrase();

            expect(loaded.some(block => block[1] === "rest2")).toBe(false);
            const pitch = loaded.find(block => block[1] === "pitch");
            const [solfege, octave] = pitch[4].slice(1, 3).map(i => loaded[i][1][1].value);
            expect(solfege).toBe("fa♯");
            expect(octave).toBe(4);
        });

        test("saves a column that only shows the background as a rest", () => {
            widget.colorData = [row("C4", [["green", 2000]])];
            widget._savePhrase();
            expect(loaded.filter(block => block[1] === "rest2")).toHaveLength(1);
        });
    });

    describe("_collectNotesToPlay", () => {
        test("turns column length into a note value", () => {
            widget.colorData = [
                row("C4", [
                    ["red", 1200],
                    ["blue", 2000],
                    ["red", 3500]
                ])
            ];
            widget._collectNotesToPlay();
            expect(widget._notesToPlay.map(note => note.noteValue)).toEqual([4, 2, 1]);
        });

        test("does not repeat a pitch in a column", () => {
            widget.colorData = [row("C4", [["red", 2000]]), row("C4", [["blue", 2000]])];
            widget._collectNotesToPlay();
            expect(widget._notesToPlay[0].pitches).toEqual([{ solfege: "do", octave: 4 }]);
        });
    });

    describe("_filterSmallSegments", () => {
        test("drops boundaries closer than a second and keeps the end", () => {
            expect(widget._filterSmallSegments([0, 400, 1500, 1900, 3000])).toEqual([
                0, 1500, 3000
            ]);
        });

        test("merges a short trailing segment into the one before it", () => {
            expect(widget._filterSmallSegments([0, 1500, 3000, 3300])).toEqual([0, 1500, 3300]);
        });

        test("leaves two boundaries alone", () => {
            expect(widget._filterSmallSegments([0, 300])).toEqual([0, 300]);
        });
    });

    test("_analyzeColumnBoundaries collects every row's color changes", () => {
        widget.colorData = [
            row("C4", [
                ["red", 1000],
                ["blue", 1000]
            ]),
            undefined,
            row("D4", [
                ["red", 1300],
                ["blue", 1500]
            ])
        ];
        // 1300 is within 500ms of 1000 and merges into it.
        expect(widget._analyzeColumnBoundaries()).toEqual([0, 1000, 2000, 2800]);
    });

    test("_exportPhrase reports the selected cells and rows", () => {
        widget.matrixData.selectedCells.add("0-1");
        widget._exportPhrase();
        const message = widget.activity.textMsg.mock.calls[0][0];
        expect(message).toContain('"selectedCells":["0-1"]');
        expect(message).toContain('"label":"High C (Do)"');
    });

    describe("_clearPhrase", () => {
        test("drops the scan, the column lines and the selected cells", () => {
            widget.gridOverlay = document.createElement("div");
            const columnLine = document.createElement("div");
            columnLine.className = "column-line";
            widget.gridOverlay.appendChild(columnLine);
            widget.colorData = [row("C4", [["red", 2000]])];
            widget._notesToPlay = [{}];
            widget.matrixData.selectedCells.add("1-1");
            widget.matrixTable = document.createElement("table");
            const cell = widget.matrixTable.insertRow().insertCell();
            cell.dataset.cellId = "1-1";
            cell.style.backgroundColor = "red";
            const dot = document.createElement("span");
            dot.className = "cell-dot";
            cell.appendChild(dot);

            widget._clearPhrase();

            expect(widget.gridOverlay.querySelector(".column-line")).toBeNull();
            expect(widget.colorData).toEqual([]);
            expect(widget._notesToPlay).toEqual([]);
            expect(widget.matrixData.selectedCells.size).toBe(0);
            expect(cell.style.backgroundColor).toBe("");
            expect(cell.querySelector(".cell-dot")).toBeNull();
            expect(widget.activity.textMsg).toHaveBeenCalledWith("Phrase cleared");
        });

        test("stops a running scan without downloading a visualization", () => {
            widget.isPlaying = true;
            widget.colorData = [row("C4", [["red", 2000]])];
            widget._setWidgetTimeout = jest.fn();

            widget._clearPhrase();

            expect(widget.isPlaying).toBe(false);
            expect(widget._setWidgetTimeout).not.toHaveBeenCalled();
            expect(widget.hasGeneratedVisualization).toBe(false);
        });
    });
});
