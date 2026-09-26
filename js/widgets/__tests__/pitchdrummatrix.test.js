/**
 * MusicBlocks v3.6.2
 *
 * @author Lakshay
 *
 * @copyright 2026 Lakshay
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

const PitchDrumMatrix = require("../pitchdrummatrix.js");

// --- Global Mocks ---
global._ = msg => msg;
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorSelected: "#d0d0d0",
    selectorBackgroundHOVER: "#e0e0e0"
};
const defaultDocByIdImpl = () => ({
    style: {},
    innerHTML: "",
    rows: [],
    insertRow: jest.fn(() => ({
        insertCell: jest.fn(() => ({
            style: {},
            innerHTML: "",
            setAttribute: jest.fn(),
            addEventListener: jest.fn(),
            appendChild: jest.fn()
        })),
        setAttribute: jest.fn(),
        style: {}
    })),
    appendChild: jest.fn(),
    setAttribute: jest.fn()
});

global.docById = jest.fn(defaultDocByIdImpl);
global.getNote = jest.fn(() => ["C", "", 4]);
global.getDrumName = jest.fn(() => null);
global.getDrumIcon = jest.fn(() => "icon.svg");
global.getDrumSynthName = jest.fn(() => "kick");
global.MATRIXSOLFEHEIGHT = 30;
global.MATRIXSOLFEWIDTH = 80;
global.SOLFEGECONVERSIONTABLE = {};
global.Singer = { RhythmActions: { getNoteValue: jest.fn(() => 0.25) } };

window.innerWidth = 1200;
window.innerHeight = 600;
window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        addButton: jest.fn().mockReturnValue({ onclick: null }),
        getWidgetBody: jest.fn().mockReturnValue({
            append: jest.fn(),
            appendChild: jest.fn(),
            style: {}
        }),
        sendToCenter: jest.fn(),
        onclose: null,
        onmaximize: null,
        timerManager: {
            setTimeout: (callback, delay) => setTimeout(callback, delay)
        },
        destroy: jest.fn()
    })
};

global.document = {
    createElement: jest.fn(() => ({
        style: {},
        innerHTML: "",
        appendChild: jest.fn(),
        append: jest.fn(),
        setAttribute: jest.fn(),
        addEventListener: jest.fn()
    }))
};

describe("PitchDrumMatrix Widget", () => {
    let pdm;

    beforeEach(() => {
        pdm = new PitchDrumMatrix();
    });

    afterEach(() => {
        jest.clearAllMocks();
        docById.mockImplementation(defaultDocByIdImpl);
    });

    // --- Constructor Tests ---
    describe("constructor", () => {
        test("should initialize with empty rowLabels", () => {
            expect(pdm.rowLabels).toEqual([]);
        });

        test("should initialize with empty rowArgs", () => {
            expect(pdm.rowArgs).toEqual([]);
        });

        test("should initialize with empty drums", () => {
            expect(pdm.drums).toEqual([]);
        });

        test("should initialize _rests to 0", () => {
            expect(pdm._rests).toBe(0);
        });

        test("should initialize _playing to false", () => {
            expect(pdm._playing).toBe(false);
        });

        test("should initialize empty _rowBlocks", () => {
            expect(pdm._rowBlocks).toEqual([]);
        });

        test("should initialize empty _colBlocks", () => {
            expect(pdm._colBlocks).toEqual([]);
        });

        test("should initialize empty _blockMap", () => {
            expect(pdm._blockMap).toEqual([]);
        });
    });

    // --- Static Constants Tests ---
    describe("static constants", () => {
        test("should have correct BUTTONDIVWIDTH", () => {
            expect(PitchDrumMatrix.BUTTONDIVWIDTH).toBe(295);
        });

        test("should have correct DRUMNAMEWIDTH", () => {
            expect(PitchDrumMatrix.DRUMNAMEWIDTH).toBe(50);
        });

        test("should have correct OUTERWINDOWWIDTH", () => {
            expect(PitchDrumMatrix.OUTERWINDOWWIDTH).toBe(128);
        });

        test("should have correct INNERWINDOWWIDTH", () => {
            expect(PitchDrumMatrix.INNERWINDOWWIDTH).toBe(50);
        });

        test("should have correct BUTTONSIZE", () => {
            expect(PitchDrumMatrix.BUTTONSIZE).toBe(53);
        });

        test("should have correct ICONSIZE", () => {
            expect(PitchDrumMatrix.ICONSIZE).toBe(32);
        });
    });

    // --- Data Management Tests ---
    describe("data management", () => {
        test("should store row labels", () => {
            pdm.rowLabels.push("C");
            pdm.rowLabels.push("D");
            pdm.rowLabels.push("E");
            expect(pdm.rowLabels).toEqual(["C", "D", "E"]);
        });

        test("should store row args (octaves)", () => {
            pdm.rowArgs.push(4);
            pdm.rowArgs.push(4);
            pdm.rowArgs.push(5);
            expect(pdm.rowArgs).toEqual([4, 4, 5]);
        });

        test("should store drums", () => {
            pdm.drums.push("kick drum");
            pdm.drums.push("snare drum");
            expect(pdm.drums).toHaveLength(2);
        });

        test("should count rests", () => {
            pdm._rests = 0;
            pdm._rests += 1;
            pdm._rests += 1;
            expect(pdm._rests).toBe(2);
        });

        test("should store row block numbers", () => {
            pdm._rowBlocks.push(10);
            pdm._rowBlocks.push(20);
            expect(pdm._rowBlocks).toEqual([10, 20]);
        });

        test("should store column block numbers", () => {
            pdm._colBlocks.push(30);
            pdm._colBlocks.push(40);
            expect(pdm._colBlocks).toEqual([30, 40]);
        });

        test("should store block map entries", () => {
            pdm._blockMap.push([0, 1]);
            pdm._blockMap.push([1, 0]);
            expect(pdm._blockMap).toHaveLength(2);
            expect(pdm._blockMap[0]).toEqual([0, 1]);
        });
    });

    describe("block and node methods", () => {
        test("clearBlocks resets the row and column block arrays", () => {
            pdm._rowBlocks = [10, 20];
            pdm._colBlocks = [30];

            pdm.clearBlocks();

            expect(pdm._rowBlocks).toEqual([]);
            expect(pdm._colBlocks).toEqual([]);
        });

        test("addRowBlock appends a pitch block", () => {
            pdm.addRowBlock(10);
            pdm.addRowBlock(20);

            expect(pdm._rowBlocks).toEqual([10, 20]);
        });

        test("addColBlock appends a drum block", () => {
            pdm.addColBlock(30);
            pdm.addColBlock(40);

            expect(pdm._colBlocks).toEqual([30, 40]);
        });

        test("addNode adds new intersections", () => {
            pdm.addNode(0, 1);
            pdm.addNode(1, 0);

            expect(pdm._blockMap).toEqual([
                [0, 1],
                [1, 0]
            ]);
        });

        test("addNode ignores a duplicate intersection", () => {
            pdm.addNode(0, 1);
            pdm.addNode(0, 1);

            expect(pdm._blockMap).toEqual([[0, 1]]);
        });

        test("removeNode marks a matching intersection as removed", () => {
            pdm.addNode(0, 1);
            pdm.addNode(1, 0);

            pdm.removeNode(0, 1);

            expect(pdm._blockMap).toEqual([
                [-1, -1],
                [1, 0]
            ]);
        });

        test("removeNode leaves the map unchanged when nothing matches", () => {
            pdm.addNode(0, 1);

            pdm.removeNode(5, 5);

            expect(pdm._blockMap).toEqual([[0, 1]]);
        });
    });

    describe("_get_save_lock", () => {
        test("returns the current save lock state", () => {
            pdm._save_lock = false;
            expect(pdm._get_save_lock()).toBe(false);

            pdm._save_lock = true;
            expect(pdm._get_save_lock()).toBe(true);
        });
    });

    // --- Playing State Tests ---
    describe("playing state", () => {
        test("should toggle playing state", () => {
            expect(pdm._playing).toBe(false);
            pdm._playing = !pdm._playing;
            expect(pdm._playing).toBe(true);
            pdm._playing = !pdm._playing;
            expect(pdm._playing).toBe(false);
        });
    });

    // --- Save Lock Tests ---
    describe("save lock", () => {
        test("should initialize _save_lock as undefined before init", () => {
            // _save_lock is set in init, not constructor
            expect(pdm._save_lock).toBeUndefined();
        });
    });

    // --- _setPlayButtonIcon Tests ---
    describe("_setPlayButtonIcon", () => {
        let mockActivity;

        beforeEach(() => {
            mockActivity = {
                logo: {
                    synth: { stop: jest.fn() },
                    turtleDelay: 0
                },
                hideMsgs: jest.fn(),
                textMsg: jest.fn()
            };
            pdm.init(mockActivity);
        });

        test("should set play icon when state is 'play'", () => {
            const appendChildSpy = jest.fn();
            pdm.playButton = {
                textContent: "",
                appendChild: appendChildSpy
            };

            pdm._setPlayButtonIcon("play");

            // Should clear existing content first
            expect(pdm.playButton.textContent).toBe("\u00A0\u00A0");
            // Should append img and text node (2 calls)
            expect(appendChildSpy).toHaveBeenCalledTimes(2);
        });

        test("should set stop icon when state is 'stop'", () => {
            const appendChildSpy = jest.fn();
            pdm.playButton = {
                textContent: "",
                appendChild: appendChildSpy
            };

            pdm._setPlayButtonIcon("stop");

            expect(pdm.playButton.textContent).toBe("\u00A0\u00A0");
            expect(appendChildSpy).toHaveBeenCalledTimes(2);
        });

        test("should create img element with correct play attributes", () => {
            const appendedElements = [];
            pdm.playButton = {
                textContent: "",
                appendChild: el => appendedElements.push(el)
            };

            pdm._setPlayButtonIcon("play");

            const img = appendedElements[0];
            expect(img.src).toContain("header-icons/play-button.svg");
            expect(img.title).toBe("Play");
            expect(img.alt).toBe("Play");
            expect(img.getAttribute("height")).toBe(String(PitchDrumMatrix.ICONSIZE));
            expect(img.getAttribute("width")).toBe(String(PitchDrumMatrix.ICONSIZE));
        });

        test("should create img element with correct stop attributes", () => {
            const appendedElements = [];
            pdm.playButton = {
                textContent: "",
                appendChild: el => appendedElements.push(el)
            };

            pdm._setPlayButtonIcon("stop");

            const img = appendedElements[0];
            expect(img.src).toContain("header-icons/stop-button.svg");
            expect(img.title).toBe("Stop");
            expect(img.alt).toBe("Stop");
            expect(img.getAttribute("height")).toBe(String(PitchDrumMatrix.ICONSIZE));
            expect(img.getAttribute("width")).toBe(String(PitchDrumMatrix.ICONSIZE));
        });
    });

    // --- Init & Close Cleanup Tests ---
    describe("onclose cleanup", () => {
        test("should set _playing to false and stop synth when closed", () => {
            const mockStop = jest.fn();
            const mockHideMsgs = jest.fn();
            const mockActivity = {
                logo: {
                    synth: {
                        stop: mockStop
                    },
                    turtleDelay: 0
                },
                hideMsgs: mockHideMsgs,
                textMsg: jest.fn()
            };

            pdm.init(mockActivity);
            pdm._playing = true;

            expect(typeof pdm.widgetWindow.onclose).toBe("function");

            // Trigger onclose
            pdm.widgetWindow.onclose();

            expect(pdm._playing).toBe(false);
            expect(mockStop).toHaveBeenCalled();
            expect(mockHideMsgs).toHaveBeenCalled();
            expect(pdm.widgetWindow.destroy).toHaveBeenCalled();
        });
    });

    // --- _playPitchDrum Tests ---
    describe("_playPitchDrum", () => {
        beforeEach(() => {
            pdm.widgetWindow = {
                timerManager: {
                    setTimeout: (callback, delay) => setTimeout(callback, delay)
                }
            };
        });

        test("should return early without accessing DOM if not playing", () => {
            pdm._playing = false;
            docById.mockClear();

            pdm._playPitchDrum(0, []);

            expect(docById).not.toHaveBeenCalled();
        });

        test("should execute logic if playing", () => {
            pdm._playing = true;

            // Mock simple cell structure
            const mockCell = { style: {} };
            const mockRow = { cells: [mockCell] };
            const mockTable = { rows: [mockRow] };

            pdm._pdmTable = mockTable;
            pdm._pdmDrumTable = mockTable;
            pdm._pdmCellTables = [mockTable];

            // We mock _setPairCell because it's called internally
            pdm._setPairCell = jest.fn();

            pdm._playPitchDrum(0, [[0, 0]]);

            expect(pdm._setPairCell).toHaveBeenCalled();
        });

        test("should play the next pair after the playback timeout", () => {
            jest.useFakeTimers();
            pdm._playing = true;

            const pitchCell0 = { style: {} };
            const pitchCell1 = { style: {} };
            pdm._pdmTable = {
                rows: [{ cells: [pitchCell0] }, { cells: [pitchCell1] }]
            };
            pdm._pdmDrumTable = { rows: [{ cells: [] }] };
            pdm._pdmCellTables = [{ rows: [{ cells: [{}, {}] }] }, { rows: [{ cells: [{}, {}] }] }];
            pdm._setPairCell = jest.fn();

            pdm._playPitchDrum(0, [
                [0, 0],
                [1, 0]
            ]);

            expect(pdm._setPairCell).toHaveBeenCalledTimes(1);
            expect(pdm._setPairCell).toHaveBeenCalledWith(0, 0, expect.anything(), true);

            jest.advanceTimersByTime(1000);

            expect(pdm._setPairCell).toHaveBeenCalledTimes(2);
            expect(pdm._setPairCell).toHaveBeenCalledWith(1, 0, expect.anything(), true);

            jest.useRealTimers();
        });

        test("should not attempt to modify style of rows when playing turns false during timeout", () => {
            jest.useFakeTimers();
            pdm._playing = true;

            const mockCell = { style: {} };
            const mockRow = { cells: [mockCell] };
            const mockTable = {
                rows: {
                    length: 2,
                    0: { cells: [mockCell] },
                    1: { cells: [mockCell] }
                }
            };

            const rowsAccessSpy = jest.fn();
            Object.defineProperty(mockTable, "rows", {
                get: () => {
                    rowsAccessSpy();
                    return {
                        length: 2,
                        0: { cells: [mockCell] }
                    };
                }
            });

            pdm._pdmTable = mockTable;
            pdm._pdmDrumTable = mockTable;
            pdm._pdmCellTables = [mockTable];
            pdm._setPairCell = jest.fn();

            pdm._playPitchDrum(0, [[0, 0]]);

            rowsAccessSpy.mockClear();
            pdm._playing = false;

            jest.runAllTimers();

            expect(rowsAccessSpy).not.toHaveBeenCalled();
            jest.useRealTimers();
        });
    });

    // --- _playAll Timer Guard Tests ---
    describe("_playAll timer guard", () => {
        test("should not attempt to update icon when playing turns false during timeout", () => {
            jest.useFakeTimers();

            const mockActivity = {
                logo: {
                    synth: {
                        stop: jest.fn()
                    },
                    turtleDelay: 0
                },
                hideMsgs: jest.fn(),
                textMsg: jest.fn()
            };
            pdm.init(mockActivity);

            const mockCell = { style: { backgroundColor: "black" } };
            const mockRow = { cells: [mockCell] };
            const mockTable = { rows: [mockRow, mockRow] };

            pdm._pdmTable = mockTable;
            pdm._pdmDrumTable = mockTable;
            pdm._pdmCellTables = [mockTable];

            pdm._setPairCell = jest.fn();
            pdm._playing = true;

            pdm.playButton.appendChild = jest.fn();

            pdm._playAll();

            pdm.playButton.appendChild.mockClear();
            pdm._playing = false;

            jest.runAllTimers();

            expect(pdm.playButton.appendChild).not.toHaveBeenCalled();
            jest.useRealTimers();
        });

        test("should update icon and set _playing to false when playback finishes successfully", () => {
            jest.useFakeTimers();

            const mockActivity = {
                logo: {
                    synth: {
                        stop: jest.fn()
                    },
                    turtleDelay: 0
                },
                hideMsgs: jest.fn(),
                textMsg: jest.fn()
            };
            pdm.init(mockActivity);

            const mockCell = { style: { backgroundColor: "black" } };
            const mockRow = { cells: [mockCell] };
            const mockTable = { rows: [mockRow, mockRow] };

            pdm._pdmTable = mockTable;
            pdm._pdmDrumTable = mockTable;
            pdm._pdmCellTables = [mockTable];

            pdm._setPairCell = jest.fn();
            pdm._playing = true;

            pdm.playButton.appendChild = jest.fn();

            pdm._playAll();

            pdm.playButton.appendChild.mockClear();

            jest.runAllTimers();

            expect(pdm._playing).toBe(false);
            expect(pdm.playButton.appendChild).toHaveBeenCalled();
            jest.useRealTimers();
        });

        test("should display a message when playing all with an empty grid", () => {
            const mockActivity = {
                logo: {
                    synth: {
                        stop: jest.fn()
                    },
                    turtleDelay: 0
                },
                hideMsgs: jest.fn(),
                textMsg: jest.fn()
            };
            pdm.init(mockActivity);

            const mockTable = { rows: [] };
            pdm._pdmTable = mockTable;

            pdm._playing = true;
            pdm._playAll();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Click in the grid to map notes to drums.",
                3000
            );
        });
    });

    // --- makeClickable and _clear Tests ---
    describe("UI interactions (Coverage)", () => {
        test("should apply color on click via makeClickable", () => {
            pdm._playing = false;
            pdm.rowLabels = ["C", "D"];
            pdm.rowArgs = [4, 4];

            const cell00 = {
                id: "0,0",
                style: {},
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            };
            const cell01 = {
                id: "0,1",
                style: {},
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            };
            const cell10 = {
                id: "1,0",
                style: {},
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            };

            pdm._pdmCellTables = [
                { rows: [{ cells: [cell00, cell01] }] },
                { rows: [{ cells: [cell10, {}] }] }
            ];
            pdm._pdmTable = { rows: [{}, {}, {}] }; // length 3 so loop runs 2 times
            pdm._pdmDrumTable = { rows: [{ cells: [{}, {}] }, {}, {}] };

            pdm.makeClickable();

            // makeClickable assigns onclick
            expect(typeof cell00.onclick).toBe("function");

            // Trigger the click listener on cell00 manually
            const clickHandler = cell00.onclick;
            pdm._getBackgroundColor = jest.fn(() => "blue");
            pdm._setCellPitchDrum = jest.fn();

            clickHandler({ target: cell00 });

            expect(cell00.style.backgroundColor).toBe("black");
            expect(pdm._setCellPitchDrum).toHaveBeenCalledWith("0", "0", true);
        });

        test("should clear the grid and handle _clear", () => {
            const mockActivity = {
                logo: { synth: { stop: jest.fn() } },
                hideMsgs: jest.fn(),
                textMsg: jest.fn()
            };
            pdm.init(mockActivity);

            pdm._playing = true;
            pdm.playButton = { replaceChildren: jest.fn() };

            const cell00 = { style: { backgroundColor: "black" } };
            const cell01 = { style: { backgroundColor: "black" } };
            pdm._pdmCellTables = [{ rows: [{ cells: [cell00, cell01] }] }];
            pdm._pdmTable = { rows: [{}, {}] }; // length 2 so loop runs 1 time

            pdm._getBackgroundColor = jest.fn(() => "white");
            pdm._setCellPitchDrum = jest.fn();

            pdm._clear();

            expect(cell00.style.backgroundColor).toBe(platformColor.selectorBackground);
            expect(pdm._setCellPitchDrum).toHaveBeenCalled();
        });
    });

    describe("_setPairCell delayed drum", () => {
        const setupPairCell = () => {
            global.normalizeNoteAccidentals = note => note;
            Singer.defaultBPMFactor = 1;

            const mockActivity = {
                logo: {
                    synth: {
                        trigger: jest.fn(),
                        stop: jest.fn()
                    },
                    turtleDelay: 0
                },
                hideMsgs: jest.fn(),
                textMsg: jest.fn(),
                turtles: {
                    ithTurtle: jest.fn(() => ({ singer: { keySignature: "C major" } }))
                },
                errorMsg: jest.fn()
            };

            pdm.init(mockActivity);
            pdm._pdmTable = {
                rows: [{ cells: [{ dataset: { noteArg: "sol", octave: "4" } }] }]
            };
            pdm._pdmDrumTable = {
                rows: [{ cells: [{ querySelector: () => ({ title: "kick" }) }] }]
            };
            return mockActivity;
        };

        test("should play the delayed drum while the widget is still open", () => {
            jest.useFakeTimers();
            const mockActivity = setupPairCell();

            pdm._setPairCell(0, 0, {}, true);

            expect(mockActivity.logo.synth.trigger).toHaveBeenCalledTimes(1);

            jest.runAllTimers();

            expect(mockActivity.logo.synth.trigger).toHaveBeenCalledTimes(2);
            expect(mockActivity.logo.synth.trigger).toHaveBeenLastCalledWith(
                0,
                "C2",
                0.125,
                "kick",
                null,
                null
            );

            jest.useRealTimers();
            delete Singer.defaultBPMFactor;
        });

        test("should not play the delayed drum after the widget is closed", () => {
            jest.useFakeTimers();
            const mockActivity = setupPairCell();

            const pendingTimeouts = [];
            pdm.widgetWindow.timerManager = {
                setTimeout(callback, delay) {
                    const id = setTimeout(callback, delay);
                    pendingTimeouts.push(id);
                    return id;
                },
                clearAll() {
                    pendingTimeouts.forEach(id => clearTimeout(id));
                    pendingTimeouts.length = 0;
                }
            };
            pdm.widgetWindow.destroy.mockImplementation(() => {
                pdm.widgetWindow.timerManager.clearAll();
            });

            pdm._setPairCell(0, 0, {}, true);

            expect(mockActivity.logo.synth.trigger).toHaveBeenCalledTimes(1);

            pdm.widgetWindow.onclose();
            jest.runAllTimers();

            expect(mockActivity.logo.synth.trigger).toHaveBeenCalledTimes(1);
            expect(mockActivity.logo.synth.trigger).not.toHaveBeenCalledWith(
                0,
                "C2",
                0.125,
                "kick",
                null,
                null
            );

            jest.useRealTimers();
            pdm.widgetWindow.destroy.mockReset();
            delete Singer.defaultBPMFactor;
        });
    });

    // --- Additional Coverage Tests for init, DOM callbacks, _addDrum, makeClickable, _save, _scale, _setCellPitchDrum ---
    describe("init & full DOM table setup", () => {
        let mockActivity;
        let createdElements;
        let elementsByIdMap;

        beforeEach(() => {
            createdElements = [];
            elementsByIdMap = {};

            const createMockDOMElement = tagName => {
                const el = {
                    tagName: tagName.toUpperCase(),
                    style: {},
                    dataset: {},
                    children: [],
                    rows: [],
                    cells: [],
                    textContent: "",
                    className: "",
                    setAttribute: jest.fn((key, val) => {
                        el[key] = val;
                        if (key === "id") elementsByIdMap[val] = el;
                    }),
                    getAttribute: jest.fn(key => el[key]),
                    appendChild: jest.fn(child => {
                        if (child) {
                            el.children.push(child);
                            if (child.tagName === "TR") el.rows.push(child);
                            if (child.tagName === "TD" || child.tagName === "TH")
                                el.cells.push(child);
                        }
                        return child;
                    }),
                    append: jest.fn((...args) => {
                        args.forEach(arg => {
                            if (arg && typeof arg === "object") {
                                el.children.push(arg);
                                if (arg.tagName === "TR") el.rows.push(arg);
                                if (arg.tagName === "TD" || arg.tagName === "TH")
                                    el.cells.push(arg);
                            }
                        });
                    }),
                    querySelector: jest.fn(selector => {
                        if (selector === "img") {
                            return el.children.find(c => c && c.tagName === "IMG") || null;
                        }
                        return null;
                    }),
                    getElementsByTagName: jest.fn(tag => {
                        if (tag.toLowerCase() === "svg")
                            return [{ setAttribute: jest.fn(), style: {} }];
                        return [];
                    }),
                    insertRow: jest.fn(() => {
                        const row = createMockDOMElement("tr");
                        el.rows.push(row);
                        return row;
                    }),
                    insertCell: jest.fn(() => {
                        const cell = createMockDOMElement("td");
                        el.cells.push(cell);
                        return cell;
                    })
                };
                Object.defineProperty(el, "id", {
                    get() {
                        return el._id || "";
                    },
                    set(val) {
                        el._id = val;
                        elementsByIdMap[val] = el;
                    }
                });
                return el;
            };

            global.document.createElement = jest.fn(tag => createMockDOMElement(tag));
            global.docById = jest.fn(id => elementsByIdMap[id] || createMockDOMElement("div"));

            mockActivity = {
                logo: {
                    synth: { stop: jest.fn(), trigger: jest.fn() },
                    turtleDelay: 0
                },
                blocks: {
                    palettes: {
                        dict: {
                            music: { hideMenu: jest.fn() }
                        }
                    },
                    loadNewBlocks: jest.fn()
                },
                turtles: {
                    ithTurtle: jest.fn(() => ({ singer: { keySignature: "C major" } }))
                },
                refreshCanvas: jest.fn(),
                hideMsgs: jest.fn(),
                textMsg: jest.fn(),
                errorMsg: jest.fn()
            };
        });

        test("should build tables, note rows, rests, and drum columns during init", () => {
            pdm.rowLabels = ["sol", "rest", "snare"];
            pdm.rowArgs = [4, 4, 0];

            global.getDrumName.mockImplementation(name => (name === "snare" ? "snare drum" : null));

            const buttons = {};
            const mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest.fn((icon, size, label) => {
                    const btn = {
                        onclick: null,
                        icon,
                        label,
                        appendChild: jest.fn(),
                        textContent: ""
                    };
                    buttons[label] = btn;
                    return btn;
                }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(),
                    appendChild: jest.fn(),
                    style: {}
                }),
                sendToCenter: jest.fn(),
                onclose: null,
                onmaximize: null,
                timerManager: {
                    setTimeout: (callback, delay) => setTimeout(callback, delay)
                },
                destroy: jest.fn()
            };
            window.widgetWindows.windowFor.mockReturnValue(mockWidgetWindow);

            pdm.init(mockActivity);

            expect(pdm._rests).toBe(1);
            expect(pdm.drums).toEqual(["snare drum"]);
            expect(buttons["Play"]).toBeDefined();
            expect(buttons["Save"]).toBeDefined();
            expect(buttons["Clear"]).toBeDefined();

            // Test Play button click handler
            buttons["Play"].onclick();
            expect(pdm._playing).toBe(true);

            buttons["Play"].onclick();
            expect(pdm._playing).toBe(false);

            // Test Clear button click handler
            buttons["Clear"].onclick();

            // Test Save button click handler and debounce lock
            jest.useFakeTimers();
            buttons["Save"].onclick();
            expect(pdm._save_lock).toBe(true);

            // Second click while locked is ignored
            buttons["Save"].onclick();

            jest.advanceTimersByTime(1000);
            expect(pdm._save_lock).toBe(false);
            jest.useRealTimers();

            // Test onmaximize handler when maximized is true and false
            mockWidgetWindow._maximized = true;
            mockWidgetWindow.onmaximize();
            expect(mockWidgetWindow.getWidgetBody().style.position).toBe("absolute");

            mockWidgetWindow._maximized = false;
            mockWidgetWindow.onmaximize();
            expect(mockWidgetWindow.getWidgetBody().style.position).toBe("relative");
        });

        test("should handle mouseover and mouseout events on drum cells", () => {
            pdm.rowLabels = ["sol"];
            pdm.rowArgs = [4];
            global.getDrumName.mockImplementation(name => (name === "snare" ? "snare drum" : null));
            pdm.drums = ["snare drum"];

            const mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest
                    .fn()
                    .mockReturnValue({ onclick: null, appendChild: jest.fn(), textContent: "" }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(),
                    style: {}
                }),
                onclose: null,
                onmaximize: null,
                timerManager: { setTimeout: jest.fn() },
                destroy: jest.fn()
            };
            window.widgetWindows.windowFor.mockReturnValue(mockWidgetWindow);

            pdm.init(mockActivity);

            const rowCells = pdm._pdmCellTables[0].rows[0].cells;
            const cell = rowCells[0];
            expect(cell).toBeDefined();
            expect(typeof cell.onmouseover).toBe("function");
            expect(typeof cell.onmouseout).toBe("function");

            cell.onmouseover();
            cell.onmouseout();
        });

        test("makeClickable sets up click listeners and restores blockMap entries", () => {
            pdm.rowLabels = ["sol", "la"];
            pdm.rowArgs = [4, 4];
            global.getDrumName.mockReturnValue(null);

            const mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest
                    .fn()
                    .mockReturnValue({ onclick: null, appendChild: jest.fn(), textContent: "" }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(),
                    style: {}
                }),
                onclose: null,
                onmaximize: null,
                timerManager: { setTimeout: jest.fn() },
                destroy: jest.fn()
            };
            window.widgetWindows.windowFor.mockReturnValue(mockWidgetWindow);

            pdm.init(mockActivity);

            // Manually add drum cells
            pdm.drums = ["snare drum"];
            pdm._addDrum(0);

            // Setup _rowBlocks, _colBlocks, and _blockMap
            pdm._rowBlocks = [101, 102];
            pdm._colBlocks = [201];
            pdm.addNode(101, 201);

            pdm.makeClickable();

            const cell = pdm._pdmCellTables[0].rows[0].cells[0];
            expect(cell.style.backgroundColor).toBe("black");

            // Click cell to toggle off (black -> selectorBackground)
            cell.onclick({ target: cell });
            expect(cell.style.backgroundColor).toBe(platformColor.selectorBackground);

            // Click cell to toggle on (selectorBackground -> black)
            cell.onclick({ target: cell });
            expect(cell.style.backgroundColor).toBe("black");
        });

        test("_setCellPitchDrum replaces old selected drum in row when playNote is true", () => {
            pdm.rowLabels = ["sol"];
            pdm.rowArgs = [4];
            pdm.drums = ["snare drum", "kick drum"];

            const mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest
                    .fn()
                    .mockReturnValue({ onclick: null, appendChild: jest.fn(), textContent: "" }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(),
                    style: {}
                }),
                onclose: null,
                onmaximize: null,
                timerManager: { setTimeout: jest.fn() },
                destroy: jest.fn()
            };
            window.widgetWindows.windowFor.mockReturnValue(mockWidgetWindow);

            pdm.init(mockActivity);

            pdm._rowBlocks = [10];
            pdm._colBlocks = [100, 200];

            const cell0 = pdm._pdmCellTables[0].rows[0].cells[0];
            const cell1 = pdm._pdmCellTables[0].rows[0].cells[1];
            cell0.style.backgroundColor = "black";
            cell0.id = "0,0";
            cell1.id = "0,1";

            pdm.addNode(10, 100);

            // Selecting column 1 should clear column 0
            pdm._setCellPitchDrum(1, 0, true);

            expect(cell0.style.backgroundColor).toBe(platformColor.selectorBackground);
            expect(pdm._blockMap).toEqual([
                [-1, -1],
                [10, 200]
            ]);
        });

        test("_save creates and loads action stack when grid has selections", () => {
            pdm.rowLabels = ["sol"];
            pdm.rowArgs = [4];
            pdm.drums = ["snare drum"];

            const mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest.fn().mockReturnValue({ onclick: null }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(),
                    style: {}
                }),
                onclose: null,
                onmaximize: null,
                timerManager: { setTimeout: jest.fn() },
                destroy: jest.fn()
            };
            window.widgetWindows.windowFor.mockReturnValue(mockWidgetWindow);

            pdm.init(mockActivity);

            const cell = pdm._pdmCellTables[0].rows[0].cells[0];
            cell.style.backgroundColor = "black";

            global.getDrumSynthName.mockReturnValue("snare");
            global.SOLFEGECONVERSIONTABLE = { C: "do", G: "sol" };

            pdm._save();

            expect(mockActivity.blocks.palettes.dict.music.hideMenu).toHaveBeenCalledWith(true);
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
            expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalled();
            const stack = mockActivity.blocks.loadNewBlocks.mock.calls[0][0];
            expect(stack[0]).toEqual([
                0,
                ["action", { collapsed: true }],
                100,
                100,
                [null, 1, 2, null]
            ]);
        });

        test("_save returns early if no cells are selected", () => {
            pdm.rowLabels = ["sol"];
            pdm.rowArgs = [4];
            pdm.drums = ["snare drum"];

            const mockWidgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest.fn().mockReturnValue({ onclick: null }),
                getWidgetBody: jest.fn().mockReturnValue({
                    append: jest.fn(),
                    style: {}
                }),
                onclose: null,
                onmaximize: null,
                timerManager: { setTimeout: jest.fn() },
                destroy: jest.fn()
            };
            window.widgetWindows.windowFor.mockReturnValue(mockWidgetWindow);

            pdm.init(mockActivity);

            pdm._save();

            expect(mockActivity.blocks.loadNewBlocks).not.toHaveBeenCalled();
        });

        test("_scale handles widget scaling and SVG dimensions", () => {
            jest.useFakeTimers();

            const svgElement = { setAttribute: jest.fn(), style: {} };
            const widgetBody = {
                style: {},
                children: [{ style: {} }],
                getElementsByTagName: jest.fn().mockReturnValue([svgElement]),
                offsetHeight: 400
            };

            pdm.getWidgetFrame = jest.fn().mockReturnValue({ offsetHeight: 800 });
            pdm.getDragElement = jest.fn().mockReturnValue({ offsetHeight: 50 });
            pdm.getWidgetBody = jest.fn().mockReturnValue(widgetBody);
            pdm.isMaximized = jest.fn().mockReturnValue(true);

            pdm._scale();

            expect(svgElement.style.pointerEvents).toBe("none");
            expect(svgElement.setAttribute).toHaveBeenCalledWith(
                "height",
                expect.stringContaining("px")
            );

            jest.advanceTimersByTime(100);
            expect(svgElement.style.pointerEvents).toBe("auto");

            jest.useRealTimers();
        });
    });
});
