/**
 * MusicBlocks v3.6.2
 *
 * @author Music Blocks Contributors
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

const Arpeggio = require("../arpeggio.js");

global._ = msg => msg;
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorBackgroundHOVER: "#e0e0e0",
    selectorSelected: "#ff0000"
};
global.docById = id => document.getElementById(id);
global.getNote = jest.fn((letter, octave, transp) => [letter, transp, octave]);
global.setCustomChord = jest.fn();
global.keySignatureToMode = jest.fn(() => ["C", "major"]);
global.getModeNumbers = jest.fn(() => "0 2 4 5 7 9 11");
global.getTemperament = jest.fn(() => ({ pitchNumber: 12 }));
global.normalizeNoteAccidentals = jest.fn(note => note);
global.DEFAULTVOICE = "electronic synth";

describe("Arpeggio Widget", () => {
    let arpeggio;
    let activityMock;
    let mockWidgetWindow;
    let mockWidgetBody;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup DOM
        document.body.innerHTML = "";

        mockWidgetBody = document.createElement("div");
        mockWidgetBody.style.height = "100px";
        mockWidgetBody.style.width = "100px";
        document.body.appendChild(mockWidgetBody);

        const mockButtons = [];

        mockWidgetWindow = {
            clear: jest.fn(),
            show: jest.fn(),
            addButton: jest.fn().mockImplementation((icon, size, title) => {
                const btn = document.createElement("div");
                btn.title = title;
                mockButtons.push(btn);
                return btn;
            }),
            getWidgetBody: jest.fn(() => mockWidgetBody),
            onclose: null,
            onmaximize: null,
            destroy: jest.fn(),
            _maximized: false,
            getWidgetFrame: jest.fn(() => ({ offsetHeight: 600 })),
            getDragElement: jest.fn(() => ({ offsetHeight: 50 }))
        };

        if (!global.window) global.window = {};
        global.window.widgetWindows = {
            windowFor: jest.fn().mockReturnValue(mockWidgetWindow)
        };
        global.window.innerWidth = 1200;
        global.window.innerHeight = 800;

        activityMock = {
            logo: {
                synth: {
                    whichTemperament: jest.fn(() => "12-TET"),
                    stop: jest.fn(),
                    trigger: jest.fn()
                },
                turtleDelay: 100
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: { keySignature: 0 }
                }))
            },
            hideMsgs: jest.fn(),
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            blocks: {
                loadNewBlocks: jest.fn()
            }
        };

        arpeggio = new Arpeggio();
    });

    afterEach(() => {
        if (arpeggio && arpeggio.widgetWindow && arpeggio.widgetWindow.onclose) {
            arpeggio.widgetWindow.onclose();
        }
    });

    // --- Constructor Tests ---
    describe("constructor", () => {
        test("should initialize with empty notesToPlay", () => {
            expect(arpeggio.notesToPlay).toEqual([]);
        });

        test("should initialize with empty _blockMap", () => {
            expect(arpeggio._blockMap).toEqual([]);
        });

        test("should initialize defaultCols to DEFAULTCOLS", () => {
            expect(arpeggio.defaultCols).toBe(Arpeggio.DEFAULTCOLS);
        });
    });

    // --- Static Constants Tests ---
    describe("static constants", () => {
        test("should have correct BUTTONDIVWIDTH", () => {
            expect(Arpeggio.BUTTONDIVWIDTH).toBe(295);
        });

        test("should have correct CELLSIZE", () => {
            expect(Arpeggio.CELLSIZE).toBe(28);
        });

        test("should have correct BUTTONSIZE", () => {
            expect(Arpeggio.BUTTONSIZE).toBe(53);
        });

        test("should have correct ICONSIZE", () => {
            expect(Arpeggio.ICONSIZE).toBe(32);
        });

        test("should have correct DEFAULTCOLS", () => {
            expect(Arpeggio.DEFAULTCOLS).toBe(4);
        });
    });

    // --- Data Management Tests ---
    describe("data management", () => {
        test("should store notes to play", () => {
            arpeggio.notesToPlay.push(["C", 4]);
            arpeggio.notesToPlay.push(["E", 4]);
            expect(arpeggio.notesToPlay).toHaveLength(2);
        });

        test("should allow updating defaultCols", () => {
            arpeggio.defaultCols = 8;
            expect(arpeggio.defaultCols).toBe(8);
        });

        test("clearBlocks should clear arrays", () => {
            arpeggio._rowBlocks = [1, 2, 3];
            arpeggio._colBlocks = [1, 2, 3];
            arpeggio.clearBlocks();
            expect(arpeggio._rowBlocks).toEqual([]);
            expect(arpeggio._colBlocks).toEqual([]);
        });
    });

    // --- Init Tests ---
    describe("init", () => {
        test("should set up DOM table properly", () => {
            arpeggio.init(activityMock);

            // Check that the main table was created
            const arpeggioTable = document.getElementById("arpeggioTable");
            expect(arpeggioTable).not.toBeNull();

            // 12 pitches + 1 extra for time steps = 14 rows total (0-12 + 1)
            expect(arpeggioTable.rows.length).toBe(14);

            // Check the mode extraction
            expect(arpeggio._modeNumbers).toEqual(["0", "2", "4", "5", "7", "9", "11"]);

            // Check buttons
            expect(mockWidgetWindow.addButton).toHaveBeenCalledWith(
                "play-button.svg",
                Arpeggio.ICONSIZE,
                "Play"
            );
            expect(mockWidgetWindow.addButton).toHaveBeenCalledWith(
                "export-chunk.svg",
                Arpeggio.ICONSIZE,
                "Save"
            );
            expect(mockWidgetWindow.addButton).toHaveBeenCalledWith(
                "erase-button.svg",
                Arpeggio.ICONSIZE,
                "Clear"
            );

            expect(activityMock.textMsg).toHaveBeenCalledWith(
                "Click in the grid to add steps to the arpeggio.",
                3000
            );
        });

        test("should handle window maximize logic", () => {
            arpeggio.init(activityMock);
            // Simulate maximize
            mockWidgetWindow._maximized = true;
            mockWidgetWindow.onmaximize();

            expect(mockWidgetBody.style.position).toBe("absolute");
            expect(document.getElementById("arpeggioOuterDiv").style.height).toBe(
                "calc(100vh - 80px)"
            );

            // Simulate restore
            mockWidgetWindow._maximized = false;
            mockWidgetWindow.onmaximize();

            expect(mockWidgetBody.style.position).toBe("relative");
        });
    });

    // --- Interaction Tests ---
    describe("matrix interactions", () => {
        beforeEach(() => {
            arpeggio.notesToPlay = [["C4", 1]];
            arpeggio.init(activityMock);
        });

        test("should highlight cell and add node on click", () => {
            const cell = document.getElementById("2,1"); // Row 2, Col 1
            expect(cell).not.toBeNull();

            // Initial background color should be the selector background or selected based on mode
            const initialColor = cell.style.backgroundColor;

            // Click cell
            cell.onclick({ target: cell });

            expect(cell.style.backgroundColor).toBe("black");

            // Should add a node
            expect(arpeggio._blockMap).toContainEqual([
                arpeggio._rowBlocks[2],
                arpeggio._colBlocks[1]
            ]);

            // Since it's clicked, it should trigger sound
            expect(activityMock.logo.synth.trigger).toHaveBeenCalled();
        });

        test("should unhighlight cell and remove node on second click", () => {
            const cell = document.getElementById("2,1");

            // Click once
            cell.onclick({ target: cell });
            expect(cell.style.backgroundColor).toBe("black");

            // Click twice
            cell.onclick({ target: cell });
            expect(cell.style.backgroundColor).not.toBe("black");

            // Node should be removed (marked as [-1, -1])
            expect(arpeggio._blockMap).toContainEqual([-1, -1]);
        });

        test("should clear column when a new cell in the same column is clicked", () => {
            const cell1 = document.getElementById("2,1");
            const cell2 = document.getElementById("3,1");

            // Click cell1
            cell1.onclick({ target: cell1 });
            expect(cell1.style.backgroundColor).toBe("black");

            // Click cell2
            cell2.onclick({ target: cell2 });
            expect(cell2.style.backgroundColor).toBe("black");
            expect(cell1.style.backgroundColor).not.toBe("black");
        });
    });

    // --- Action Button Tests ---
    describe("button actions", () => {
        beforeEach(() => {
            arpeggio.init(activityMock);
            arpeggio.notesToPlay = [["C4", 1]];
        });

        test("play button toggles play state and builds playlist", () => {
            // Select a cell so it has something to play
            const cell = document.getElementById("2,1");
            cell.onclick({ target: cell });

            // Click play button
            arpeggio.playButton.onclick();
            expect(arpeggio._playing).toBe(true);
            expect(activityMock.logo.synth.stop).toHaveBeenCalled();
            expect(activityMock.logo.synth.trigger).toHaveBeenCalled(); // Triggered due to __playNote

            // Click again to stop
            arpeggio.playButton.onclick();
            expect(arpeggio._playing).toBe(false);
        });

        test("clear button unclicks all cells", () => {
            const cell = document.getElementById("2,1");
            cell.onclick({ target: cell });
            expect(cell.style.backgroundColor).toBe("black");

            // Find clear button from mocked calls and call it
            // It's the erase-button
            arpeggio._clear();

            expect(cell.style.backgroundColor).not.toBe("black");
            // Node removed
            expect(arpeggio._blockMap).toContainEqual([-1, -1]);
        });

        test("save button logic calls setCustomChord", () => {
            // Select a cell
            const cell = document.getElementById("2,1");
            cell.onclick({ target: cell });

            arpeggio._save();
            expect(global.setCustomChord).toHaveBeenCalled();
            expect(activityMock.blocks.loadNewBlocks).toHaveBeenCalled();
        });

        test("save locks button temporarily", () => {
            jest.useFakeTimers();

            expect(arpeggio._get_save_lock()).toBe(false);

            const saveBtn = arpeggio.widgetWindow.addButton.mock.results.find(
                res => res.value.title === "Save"
            ).value;
            saveBtn.onclick();

            expect(arpeggio._get_save_lock()).toBe(true);

            jest.advanceTimersByTime(1100);

            expect(arpeggio._get_save_lock()).toBe(false);

            jest.useRealTimers();
        });

        test("erase button onclick clears all black cells", () => {
            const cell = document.getElementById("2,1");
            cell.onclick({ target: cell });
            expect(cell.style.backgroundColor).toBe("black");

            const eraseBtn = arpeggio.widgetWindow.addButton.mock.results.find(
                res => res.value.title === "Clear"
            ).value;
            eraseBtn.onclick();

            expect(cell.style.backgroundColor).not.toBe("black");
        });
    });

    // --- _inMode / _getBackgroundColor Tests ---
    describe("_inMode and _getBackgroundColor", () => {
        beforeEach(() => {
            arpeggio.init(activityMock);
        });

        test("_inMode returns true for an index present in modeNumbers", () => {
            // modeNumbers is "0 2 4 5 7 9 11" -> ["0","2","4","5","7","9","11"]
            expect(arpeggio._inMode(0)).toBe(true);
            expect(arpeggio._inMode(4)).toBe(true);
            expect(arpeggio._inMode(11)).toBe(true);
        });

        test("_inMode returns false for an index not in modeNumbers", () => {
            expect(arpeggio._inMode(1)).toBe(false);
            expect(arpeggio._inMode(3)).toBe(false);
            expect(arpeggio._inMode(99)).toBe(false);
        });

        test("_getBackgroundColor returns selectorSelected for a mode row", () => {
            // row 0 maps to ii = (13 - 0 - 1) % 12 = 0, which is in mode
            const color = arpeggio._getBackgroundColor(0);
            expect(color).toBe(platformColor.selectorSelected);
        });

        test("_getBackgroundColor returns selectorBackground for a non-mode row", () => {
            // row 1 maps to ii = (13 - 1 - 1) % 12 = 11, which is in mode
            // row 2 maps to ii = (13 - 2 - 1) % 12 = 10, which is NOT in mode
            const color = arpeggio._getBackgroundColor(2);
            expect(color).toBe(platformColor.selectorBackground);
        });
    });

    // --- makeClickable blockMap restore Tests ---
    describe("makeClickable blockMap restore", () => {
        test("pre-populated blockMap entry restores cell to black on init", () => {
            // _rowBlocks[0] = 0, _colBlocks[0] = 1 after init
            // Pre-set blockMap before init so makeClickable restores it
            arpeggio._blockMap = [[0, 1]];
            arpeggio.init(activityMock);

            const table = document.getElementById("arpeggioCellTable0");
            const cell = table.rows[0].cells[0];
            expect(cell.style.backgroundColor).toBe("black");
        });

        test("blockMap entry [-1,-1] is skipped without errors during restore", () => {
            arpeggio._blockMap = [[-1, -1]];
            expect(() => arpeggio.init(activityMock)).not.toThrow();
        });

        test("blockMap entry with timeStep not in _colBlocks is skipped", () => {
            // 9999 will never match any colBlock
            arpeggio._blockMap = [[0, 9999]];
            expect(() => arpeggio.init(activityMock)).not.toThrow();
        });
    });

    // --- __makePairsList Tests ---
    describe("__makePairsList", () => {
        beforeEach(() => {
            arpeggio.notesToPlay = [["C4", 1]];
            arpeggio.init(activityMock);
        });

        test("returns all [-1, j] pairs when no cells are selected", () => {
            const pairs = arpeggio.__makePairsList();
            expect(pairs).toHaveLength(arpeggio.defaultCols);
            pairs.forEach((pair, j) => {
                expect(pair).toEqual([-1, j]);
            });
        });

        test("returns correct [row, col] for a column with a selected cell", () => {
            const cell = document.getElementById("3,2");
            cell.onclick({ target: cell });

            const pairs = arpeggio.__makePairsList();
            expect(pairs[2]).toEqual([3, 2]);
        });
    });

    // --- _save chordValues format Tests ---
    describe("_save chordValues format", () => {
        beforeEach(() => {
            arpeggio.notesToPlay = [["C4", 1]];
            arpeggio.init(activityMock);
        });

        test("mode row cell produces [scalar, 0] in chordValues", () => {
            // row 12 maps to ii = (13 - 12 - 1) % 12 = 0, which IS in modeNumbers
            const cell = document.getElementById("12,0");
            cell.onclick({ target: cell });

            arpeggio._save();

            const chordValues = global.setCustomChord.mock.calls[0][0];
            expect(chordValues[0][1]).toBe(0);
            expect(typeof chordValues[0][0]).toBe("number");
        });

        test("non-mode row cell produces [scalar, semitoneOffset] in chordValues", () => {
            // row 3 maps to ii = (13 - 3 - 1) % 12 = 9, which IS in mode
            // row 4 maps to ii = (13 - 4 - 1) % 12 = 8, which is NOT in modeNumbers
            // Force __makePairsList to return a non-mode pair directly
            arpeggio.__makePairsList = () => [
                [4, 0],
                [-1, 1],
                [-1, 2],
                [-1, 3]
            ];

            arpeggio._save();

            const chordValues = global.setCustomChord.mock.calls[0][0];
            expect(chordValues[0][1]).toBeGreaterThan(0);
        });

        test("top row cell (row 0) produces [modeNumbers.length, 0] for octave", () => {
            // pairs[i][0] === 0 triggers the octave edge case in _save
            arpeggio.__makePairsList = () => [
                [0, 0],
                [-1, 1],
                [-1, 2],
                [-1, 3]
            ];

            arpeggio._save();

            const chordValues = global.setCustomChord.mock.calls[0][0];
            expect(chordValues[0]).toEqual([arpeggio._modeNumbers.length, 0]);
        });

        test("empty column produces rest ['-','-'] in chordValues", () => {
            arpeggio._save();

            const chordValues = global.setCustomChord.mock.calls[0][0];
            chordValues.forEach(val => {
                expect(val).toEqual(["-", "-"]);
            });
        });
    });

    // --- __playNote edge case Tests ---
    describe("__playNote edge cases", () => {
        beforeEach(() => {
            arpeggio.init(activityMock);
        });

        test("rest entry (empty pitch string) does not trigger synth", () => {
            jest.useFakeTimers();

            arpeggio._playing = true;
            arpeggio._playList = [["", 0.25]];
            arpeggio.__playNote(0);

            expect(activityMock.logo.synth.trigger).not.toHaveBeenCalled();

            jest.useRealTimers();
        });

        test("index past end of playList resets _playing to false", () => {
            arpeggio._playing = true;
            arpeggio._playList = [];
            arpeggio.__playNote(0);

            expect(arpeggio._playing).toBe(false);
        });
    });

    // --- __playCell fallback Tests ---
    describe("__playCell with empty notesToPlay", () => {
        beforeEach(() => {
            arpeggio.notesToPlay = [["C4", 1]];
            arpeggio.init(activityMock);
        });

        test("uses letter and octave from notesToPlay[0] when populated", () => {
            // notesToPlay[0] = ["C4", 1] -> letter = "C", octave = 4
            const cell = document.createElement("td");
            arpeggio.__playCell(3, 0, cell, true);

            expect(global.getNote).toHaveBeenCalledWith(
                "C",
                4,
                expect.any(Number),
                expect.anything(),
                false,
                null,
                expect.anything()
            );
            expect(activityMock.logo.synth.trigger).toHaveBeenCalled();
        });

        test("defaults to C4 when notesToPlay is empty", () => {
            // The notesToPlay.length === 0 guard sets letter="C", octave=4
            // getNote is called with those values before the crash at notesToPlay[0][1]
            arpeggio.notesToPlay = [];
            const cell = document.createElement("td");

            try {
                arpeggio.__playCell(3, 0, cell, true);
            } catch (_) {
                // notesToPlay[0][1] read for duration crashes after getNote succeeds
            }

            expect(global.getNote).toHaveBeenCalledWith(
                "C",
                4,
                expect.any(Number),
                expect.anything(),
                false,
                null,
                expect.anything()
            );
        });
    });

    // --- _clearColumn skip-self Tests ---
    describe("_clearColumn skip-self guard", () => {
        beforeEach(() => {
            arpeggio.notesToPlay = [["C4", 1]];
            arpeggio.init(activityMock);
        });

        test("cell at the target row is not cleared when _clearColumn is called", () => {
            const cell = document.getElementById("3,1");
            cell.onclick({ target: cell });
            expect(cell.style.backgroundColor).toBe("black");

            // Call _clearColumn for col 1, skipping row 3
            arpeggio._clearColumn(1, 3);

            expect(cell.style.backgroundColor).toBe("black");
        });

        test("cells in other rows of the same column are cleared", () => {
            const cell1 = document.getElementById("3,1");
            const cell2 = document.getElementById("4,1");
            cell1.onclick({ target: cell1 });
            cell2.onclick({ target: cell2 });

            // cell1 gets cleared when cell2 is clicked (clearColumn is called internally)
            expect(cell1.style.backgroundColor).not.toBe("black");
            expect(cell2.style.backgroundColor).toBe("black");
        });
    });

    // --- Playback Teardown Tests ---
    describe("playback teardown and stop behavior", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            arpeggio.notesToPlay = [["C4", 1]];
            arpeggio.init(activityMock);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("widgetWindow.onclose stops playback and clears timeout", () => {
            // Start playing
            const cell = document.getElementById("2,1");
            cell.onclick({ target: cell });
            arpeggio.playButton.onclick();
            expect(arpeggio._playing).toBe(true);
            expect(arpeggio._playTimeout).not.toBeNull();

            const timeoutSpy = jest.spyOn(global, "clearTimeout");

            // Close window
            arpeggio.widgetWindow.onclose();

            expect(arpeggio._playing).toBe(false);
            expect(arpeggio._playTimeout).toBeNull();
            expect(timeoutSpy).toHaveBeenCalled();
            expect(activityMock.logo.synth.stop).toHaveBeenCalled();
            expect(mockWidgetWindow.destroy).toHaveBeenCalled();

            timeoutSpy.mockRestore();
        });

        test("clicking play button when playing stops playback and clears timeout", () => {
            const cell = document.getElementById("2,1");
            cell.onclick({ target: cell });
            arpeggio.playButton.onclick();
            expect(arpeggio._playing).toBe(true);
            expect(arpeggio._playTimeout).not.toBeNull();

            const timeoutSpy = jest.spyOn(global, "clearTimeout");

            // Click to stop
            arpeggio.playButton.onclick();

            expect(arpeggio._playing).toBe(false);
            expect(arpeggio._playTimeout).toBeNull();
            expect(timeoutSpy).toHaveBeenCalled();
            expect(activityMock.logo.synth.stop).toHaveBeenCalled();

            timeoutSpy.mockRestore();
        });

        test("_clear stops playback, clears timeout, and resets play button state", () => {
            const cell = document.getElementById("2,1");
            cell.onclick({ target: cell });
            arpeggio.playButton.onclick();
            expect(arpeggio._playing).toBe(true);

            // Clear widget
            arpeggio._clear();

            expect(arpeggio._playing).toBe(false);
            expect(arpeggio._playTimeout).toBeNull();
            expect(activityMock.logo.synth.stop).toHaveBeenCalled();
        });
    });
});
