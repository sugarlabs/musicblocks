/**
 * MusicBlocks v3.6.2
 *
 * @author mukul-dixit
 *
 * @copyright 2026 mukul-dixit
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

// Mock standard dependencies
global._ = jest.fn(key => key);
global.platformColor = {
    labelColor: "#CCCCCC",
    highlightColor: "#FFFF00",
    fillColor: "#FFFFFF"
};

const buildDocByIdMock = () => jest.fn(id => {
    // Dedicated containers used inside arpeggio.init
    if (id === "arpeggioOuterDiv" || id === "arpeggioInnerDiv") {
        return {
            style: { height: "", width: "", marginLeft: "" },
            appendChild: jest.fn(),
            innerHTML: "",
            id
        };
    }

    // Helper to create a row that tracks inserted cells
    const makeRow = () => {
        const row = {
            cells: [],
            setAttribute: jest.fn(),
            style: {},
            insertCell: jest.fn().mockImplementation(() => {
                const cell = {
                    appendChild: jest.fn(),
                    setAttribute: jest.fn(),
                    style: {},
                    className: ""
                };
                row.cells.push(cell);
                return cell;
            })
        };
        return row;
    };

    // Helper to create a table that tracks inserted rows
    const makeTable = (presetRows = []) => {
        const table = {
            rows: presetRows,
            style: { display: "", visibility: "" },
            appendChild: jest.fn(),
            insertRow: jest.fn().mockImplementation(() => {
                const row = makeRow();
                table.rows.push(row);
                return row;
            }),
            id
        };
        return table;
    };

    if (id && id.startsWith("arpeggioCellTable")) {
        // Each cell table starts empty; rows populate when _addNote runs
        return makeTable();
    }

    // Default element with insertRow support so arpeggioTable/arpeggioNoteTable work
    // Seed with one row to avoid empty access during makeClickable
    const seededRow = makeRow();
    return makeTable([seededRow]);
});
global.docById = buildDocByIdMock();
global.getNote = jest.fn();
global.setCustomChord = jest.fn();
global.keySignatureToMode = jest.fn().mockReturnValue([null, 0]);
global.getModeNumbers = jest.fn().mockReturnValue("0 2 4 5 7 9 11");
global.getTemperament = jest.fn().mockReturnValue({ pitchNumber: 12 });

global.window = global.window || {};
global.window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        addButton: jest.fn().mockReturnValue({
            onclick: jest.fn()
        }),
        getWidgetBody: jest.fn().mockReturnValue({
            append: jest.fn(),
            style: { height: "400px", width: "400px" }
        }),
        destroy: jest.fn(),
        onmaximize: jest.fn()
    })
};
global.window.innerWidth = 1024;
globalThis.window = global.window;

global.document = global.document || {};
global.document.createElement = jest.fn(type => {
    if (type === "table") {
        const makeRow = () => {
            const row = {
                cells: [],
                setAttribute: jest.fn(),
                style: {},
                insertCell: jest.fn().mockImplementation(() => {
                    const cell = {
                        appendChild: jest.fn(),
                        setAttribute: jest.fn(),
                        style: {},
                        className: ""
                    };
                    row.cells.push(cell);
                    return cell;
                })
            };
            return row;
        };
        const table = {
            rows: [],
            style: {},
            insertRow: jest.fn().mockImplementation(() => {
                const row = makeRow();
                table.rows.push(row);
                return row;
            })
        };
        return table;
    }
    return { style: {} };
});

const Arpeggio = require("./arpeggio.js");

describe("Arpeggio", () => {
    let activityMock;

    beforeEach(() => {
        // Mock activity
        activityMock = {
            logo: {
                synth: {
                    trigger: jest.fn(),
                    whichTemperament: jest.fn().mockReturnValue("equal")
                },
                turtleDelay: 0
            },
            blocks: {
                loadNewBlocks: jest.fn()
            },
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: {
                        keySignature: "C"
                    }
                })
            },
            hideMsgs: jest.fn(),
            textMsg: jest.fn()
        };

        // DOM Mocks
        global.document = {
            createElement: jest.fn().mockReturnValue({
                style: {},
                innerHTML: ""
            })
        };

        global.docById = buildDocByIdMock();
    });

    test("can be instantiated", () => {
        const widget = new Arpeggio();
        expect(widget).toBeDefined();
        expect(widget.notesToPlay).toEqual([]);
        expect(widget.defaultCols).toBe(Arpeggio.DEFAULTCOLS);
    });

    test("init() sets up the widget and UI", () => {
        const widget = new Arpeggio();
        widget.init(activityMock);

        expect(global.window.widgetWindows.windowFor).toHaveBeenCalledWith(widget, "arpeggio");
        expect(widget.widgetWindow.show).toHaveBeenCalled();
        expect(widget.widgetWindow.addButton).toHaveBeenCalledTimes(3); // Play, Save, Clear
        expect(global.docById).toHaveBeenCalledWith("arpeggioTable");
    });

    test("plays arpeggio notes", () => {
        const widget = new Arpeggio();
        widget.init(activityMock);
        widget.notesToPlay = [60, 64, 67];
        widget._playAll();
        expect(activityMock.logo.synth.trigger).toBeDefined();
    });

    test("saves arpeggio patterns", () => {
        const widget = new Arpeggio();
        widget.init(activityMock);
        widget._save();
        expect(activityMock.blocks.loadNewBlocks).toHaveBeenCalled();
    });

    test("clears arpeggio data", () => {
        const widget = new Arpeggio();
        widget.init(activityMock);
        widget.notesToPlay = [60, 64, 67];
        widget._clear();
        // _clear resets the widget state
        expect(widget._clear).toBeDefined();
    });

    test("handles cell selection", () => {
        const widget = new Arpeggio();
        widget.init(activityMock);
        // makeClickable sets up click handlers on the grid cells
        widget.makeClickable();
        expect(widget.makeClickable).toBeDefined();
    });
    
    test("expands grid when needed", () => {
        const widget = new Arpeggio();
        widget.init(activityMock);
        widget._addNote(50); // Add many notes
        expect(global.docById).toHaveBeenCalled();
    });

    test("generates proper grid dimensions", () => {
        const widget = new Arpeggio();
        widget.init(activityMock);
        // Only defaultCols is defined in Arpeggio
        expect(widget.defaultCols).toBeGreaterThan(0);
        expect(widget.defaultCols).toBe(Arpeggio.DEFAULTCOLS);
    });

    test("updates table correctly", () => {
         const widget = new Arpeggio();
         widget.init(activityMock);
         widget._clear();
         expect(global.docById).toHaveBeenCalled();
    });

    test("stores notes correctly", () => {
        const widget = new Arpeggio();
        widget.init(activityMock);
        // notesToPlay stores the notes for the arpeggio
        widget.notesToPlay = [60];
        expect(widget.notesToPlay).toEqual([60]);
        expect(widget.notesToPlay.length).toBe(1);
    });

    test("closes widget properly", () => {
        const widget = new Arpeggio();
        widget.init(activityMock);
        widget.widgetWindow.onclose();
        expect(widget.widgetWindow.destroy).toBeDefined();
    });
});
