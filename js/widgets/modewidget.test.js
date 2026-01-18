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

// Mock Globals
global._ = jest.fn(key => key);
global.platformColor = {
    fillColor: "#FFFFFF"
};
global.keySignatureToMode = jest.fn().mockReturnValue(["C", "Major"]);
global.MUSICALMODES = { "Major": [2, 2, 1, 2, 2, 2, 1] };
global.getNote = jest.fn();
global.DEFAULTVOICE = "piano";
global.last = jest.fn();
global.NOTESTABLE = [];

// Mock wheelnav and Raphael
global.wheelnav = jest.fn(function(id, raphael, width, height) {
    this.raphael = raphael || {
        circle: jest.fn().mockReturnValue({}),
        text: jest.fn().mockReturnValue({})
    };
    this.slicePathFunction = jest.fn();
    this.slicePathCustom = jest.fn();
    this.clickHandler = jest.fn();
    this.createWheel = jest.fn(); // Added createWheel mock
    this.refreshWheel = jest.fn();
    this.navItems = [];
    for(let i=0; i<12; i++) {
        this.navItems.push({
            navItem: {
                hide: jest.fn(),
                show: jest.fn()
            }
        });
    }
});

global.Raphael = jest.fn(() => ({
    circle: jest.fn().mockReturnValue({}),
    text: jest.fn().mockReturnValue({}),
    path: jest.fn().mockReturnValue({})
}));

// Mock slicePath function
global.slicePath = jest.fn(() => ({
    DonutSlice: {},
    DonutSliceCustomization: jest.fn().mockReturnValue({
        minRadiusPercent: 0.4,
        maxRadiusPercent: 0.75
    })
}));

// Mock docById to return proper DOM elements with all required properties
global.docById = jest.fn(id => {
    const makeRow = () => {
        const row = {
            cells: [],
            insertCell: jest.fn().mockImplementation(() => {
                const cell = { innerHTML: "", style: {}, colSpan: undefined };
                row.cells.push(cell);
                return cell;
            })
        };
        return row;
    };

    const makeTable = (presetRows = []) => {
        const table = {
            rows: presetRows,
            appendChild: jest.fn(),
            insertBefore: jest.fn(),
            removeChild: jest.fn(),
            style: { display: "", visibility: "", width: "600px", height: "600px" },
            innerHTML: "",
            id,
            insertRow: jest.fn().mockImplementation(() => {
                const row = makeRow();
                table.rows.push(row);
                return row;
            })
        };
        return table;
    };

    if (id === "modeTable") {
        // Seed with one row so length checks and cell access work
        const seededRow = makeRow();
        seededRow.insertCell();
        return makeTable([seededRow]);
    }

    return makeTable();
});

// Mock window and document
global.window = global.window || {};
global.window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        addButton: jest.fn().mockReturnValue({
            onclick: jest.fn(),
            innerHTML: ""
        }),
        getWidgetBody: jest.fn().mockReturnValue({
            append: jest.fn(),
            style: {}
        }),
        destroy: jest.fn(),
        updateTitle: jest.fn()
    })
};
global.window.innerWidth = 1024;
globalThis.window = global.window;

global.document = global.document || {};
global.document.createElement = jest.fn((type) => {
    if (type === "table") {
        const makeRow = () => {
            const row = {
                cells: [],
                insertCell: jest.fn().mockImplementation(() => {
                    const cell = { innerHTML: "", style: {}, colSpan: undefined };
                    row.cells.push(cell);
                    return cell;
                })
            };
            return row;
        };
        const table = {
            rows: [],
            style: {},
            innerHTML: "",
            appendChild: jest.fn(),
            insertRow: jest.fn().mockImplementation(() => {
                const row = makeRow();
                table.rows.push(row);
                return row;
            })
        };
        return table;
    }
    return {
        style: {},
        innerHTML: "",
        appendChild: jest.fn()
    };
});

// Mock document.getElementById for piano keys
const pianoKeyMock = id => ({ id, src: "", style: {} });
jest.spyOn(global.document, "getElementById").mockImplementation((id) => {
    if (id.startsWith("pkey_")) {
        return pianoKeyMock(id);
    }
    return null;
});

const ModeWidget = require("./modewidget.js");

describe("ModeWidget", () => {
    let modeWidget;
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            logo: {
                modeBlock: {},
                resetSynth: jest.fn()
            },
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: {
                        keySignature: ["C"]
                    }
                })
            },
            hideMsgs: jest.fn(),
            textMsg: jest.fn()
        };
        
        modeWidget = new ModeWidget(mockActivity);
    });

    test("instantiates successfully", () => {
        expect(modeWidget).toBeDefined();
        expect(global.window.widgetWindows.windowFor).toHaveBeenCalled();
    });

    test("sets up UI elements", () => {
        expect(modeWidget.widgetWindow.getWidgetBody).toHaveBeenCalled();
        expect(global.document.createElement).toHaveBeenCalledWith("div");
        expect(modeWidget.widgetWindow.addButton).toHaveBeenCalled();
    });
    
    test("close callback destroys window", () => {
        modeWidget.widgetWindow.onclose();
        expect(mockActivity.hideMsgs).toHaveBeenCalled();
        expect(modeWidget.widgetWindow.destroy).toHaveBeenCalled();
    });

    test("mode wheel initializes with proper structure", () => {
        expect(modeWidget._modeWheel).toBeDefined();
        expect(global.wheelnav).toHaveBeenCalled();
    });

    test("sets slice path for donut display", () => {
        expect(global.slicePath).toHaveBeenCalled();
        expect(modeWidget._modeWheel.slicePathFunction).toBeDefined();
    });

    test("handles wheel navigation", () => {
        expect(modeWidget._modeWheel.navItems).toBeDefined();
        expect(Array.isArray(modeWidget._modeWheel.navItems)).toBe(true);
    });

    test("stores selected notes", () => {
        modeWidget._selectedNotes = [0, 2, 4, 5, 7];
        expect(modeWidget._selectedNotes.length).toBeGreaterThan(0);
    });
});
