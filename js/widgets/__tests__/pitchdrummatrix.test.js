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
        test("should return early without accessing DOM if not playing", () => {
            pdm._playing = false;
            docById.mockClear();

            pdm._playPitchDrum(0, []);

            expect(docById).not.toHaveBeenCalled();
        });

        test("should access DOM if playing", () => {
            pdm._playing = true;
            docById.mockClear();

            // Mock simple cell structure for docById calls
            const mockCell = { style: {} };
            const mockRow = { cells: [mockCell] };
            const mockTable = { rows: [mockRow] };
            docById.mockReturnValue(mockTable);

            // We mock _setPairCell because it's called internally
            pdm._setPairCell = jest.fn();

            pdm._playPitchDrum(0, [[0, 0]]);

            expect(docById).toHaveBeenCalledWith("pdmTable");
            expect(docById).toHaveBeenCalledWith("pdmDrumTable");
            expect(docById).toHaveBeenCalledWith("pdmCellTable0");
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

            docById.mockReturnValue(mockTable);
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

            docById.mockImplementation(id => {
                if (id === "pdmTable" || id === "pdmDrumTable") {
                    return mockTable;
                }
                if (id === "pdmCellTable0") {
                    return { rows: [mockRow] };
                }
                return { style: {} };
            });

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

            docById.mockImplementation(id => {
                if (id === "pdmTable" || id === "pdmDrumTable") {
                    return mockTable;
                }
                if (id === "pdmCellTable0") {
                    return { rows: [mockRow] };
                }
                return { style: {} };
            });

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
            docById.mockReturnValue(mockTable);

            pdm._playing = true;
            pdm._playAll();

            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                "Click in the grid to map notes to drums.",
                3000
            );
        });
    });
});
