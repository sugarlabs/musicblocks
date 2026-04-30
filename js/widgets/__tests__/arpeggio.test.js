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
    });
});
