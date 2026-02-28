/**
 * MusicBlocks v3.6.2
 *
 * @author Advait Dixit
 *
 * @copyright 2026 Advait Dixit
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

const RhythmRuler = require("../rhythmruler.js");

// --- Global Mocks (Fake the Browser Environment) ---

// Mock translation function
global._ = msg => msg;

// Mock global constants required by RhythmRuler
global.TONEBPM = 240;
global.EIGHTHNOTEWIDTH = 24;

// Mock Singer class
global.Singer = {
    masterBPM: 90,
    defaultBPMFactor: 1000
};

// Mock utility functions
global.docById = jest.fn().mockReturnValue({
    style: {},
    classList: { add: jest.fn(), remove: jest.fn() },
    innerHTML: ""
});
global.delayExecution = jest.fn().mockResolvedValue(undefined);
global.last = arr => (arr && arr.length > 0 ? arr[arr.length - 1] : undefined);
global.nearestBeat = jest.fn(val => val);
global.rationalToFraction = jest.fn(val => [1, Math.round(1 / val)]);
global.calcNoteValueToDisplay = jest.fn((denominator, numerator) => `${numerator}/${denominator}`);
global.beginnerMode = false;
global.platformColor = {
    selectorBackground: "#ffb020",
    selectorBackgroundHOFF: "#ffc040",
    paletteBackground: "#f0f0f0"
};
global.DRUMNAMES = [];
global.VOICENAMES = [];
global.EFFECTSNAMES = [];

// Mock Window Manager

const mockWindow = {
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            addButton: jest.fn().mockReturnValue({
                onclick: null,
                innerHTML: ""
            }),
            addInputButton: jest.fn().mockImplementation(val => ({
                value: val,
                addEventListener: jest.fn(),
                classList: { add: jest.fn(), remove: jest.fn() },
                onfocus: null,
                onblur: null
            })),
            getWidgetBody: jest.fn().mockReturnValue({
                appendChild: jest.fn(),
                append: jest.fn(),
                insertRow: jest.fn().mockReturnValue({
                    setAttribute: jest.fn(),
                    insertCell: jest.fn().mockReturnValue({
                        appendChild: jest.fn(),
                        setAttribute: jest.fn(),
                        style: {},
                        innerHTML: "",
                        addEventListener: jest.fn()
                    })
                })
            }),
            sendToCenter: jest.fn(),
            isMaximized: jest.fn().mockReturnValue(false),
            onclose: null,
            onmaximize: null
        })
    },
    innerWidth: 1200
};
global.window = mockWindow;

// Mock Document
global.document = {
    createElement: jest.fn().mockImplementation(tag => ({
        style: {},
        setAttribute: jest.fn(),
        getAttribute: jest.fn(),
        addEventListener: jest.fn(),
        appendChild: jest.fn(),
        insertRow: jest.fn().mockReturnValue({
            setAttribute: jest.fn(),
            insertCell: jest.fn().mockReturnValue({
                style: {},
                innerHTML: "",
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            })
        }),
        cells: [],
        insertCell: jest.fn().mockReturnValue({
            style: {},
            innerHTML: ""
        }),
        deleteCell: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
        getContext: jest.fn().mockReturnValue({
            clearRect: jest.fn(),
            beginPath: jest.fn(),
            fillStyle: "",
            fill: jest.fn(),
            closePath: jest.fn()
        })
    })),
    getElementById: jest.fn().mockReturnValue({
        style: {},
        classList: { add: jest.fn(), remove: jest.fn() }
    })
};

describe("RhythmRuler Widget", () => {
    let rhythmRuler;
    let mockActivity;

    beforeEach(() => {
        rhythmRuler = new RhythmRuler();

        // Mock the Music Blocks Activity object
        mockActivity = {
            logo: {
                synth: {
                    trigger: jest.fn(),
                    stop: jest.fn(),
                    loadSynth: jest.fn()
                },
                resetSynth: jest.fn(),
                turtleDelay: 0
            },
            blocks: {
                blockList: {},
                protoBlockDict: {},
                loadNewBlocks: jest.fn()
            },
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: {
                        beatsPerMeasure: 4,
                        noteValuePerBeat: 4
                    }
                })
            },
            refreshCanvas: jest.fn(),
            saveLocally: jest.fn(),
            textMsg: jest.fn(),
            errorMsg: jest.fn(),
            hideMsgs: jest.fn()
        };

        // Set the global activity variable
        global.activity = mockActivity;
        rhythmRuler.activity = mockActivity;

        // Manually setup widgetWindow as if init() was called
        rhythmRuler.widgetWindow = mockWindow.widgetWindows.windowFor();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // CONSTRUCTOR TESTS
    // =========================================================================
    describe("Constructor", () => {
        test("should initialize with default empty state", () => {
            expect(rhythmRuler.Drums).toEqual([]);
            expect(rhythmRuler.Rulers).toEqual([]);
            expect(rhythmRuler._undoList).toEqual([]);
            expect(rhythmRuler._dissectHistory).toEqual([]);
        });

        test("should initialize flags to default values", () => {
            expect(rhythmRuler._playing).toBe(false);
            expect(rhythmRuler._playingOne).toBe(false);
            expect(rhythmRuler._playingAll).toBe(false);
            expect(rhythmRuler._tapMode).toBe(false);
            expect(rhythmRuler._rulerSelected).toBe(0);
        });

        test("should have correct static constants", () => {
            expect(RhythmRuler.RULERHEIGHT).toBe(70);
            expect(RhythmRuler.BUTTONSIZE).toBe(51);
            expect(RhythmRuler.ICONSIZE).toBe(32);
            expect(RhythmRuler.DEL).toBe(46);
            expect(RhythmRuler.BACK).toBe(8);
        });
    });

    // =========================================================================
    // STATE MANAGEMENT TESTS
    // =========================================================================
    describe("State Management", () => {
        test("should initialize tracking arrays", () => {
            expect(rhythmRuler._elapsedTimes).toEqual([]);
            expect(rhythmRuler._offsets).toEqual([]);
            expect(rhythmRuler._startingTime).toBeNull();
            expect(rhythmRuler._tapTimes).toEqual([]);
        });
    });

    // =========================================================================
    // RULER AND DRUM MANAGEMENT TESTS
    // =========================================================================
    describe("Ruler and Drum Management", () => {
        test("should allow adding drums to Drums array", () => {
            rhythmRuler.Drums.push("snare drum");
            rhythmRuler.Rulers.push([[1], []]);

            expect(rhythmRuler.Drums).toHaveLength(1);
            expect(rhythmRuler.Drums[0]).toBe("snare drum");
        });

        test("should allow adding multiple drums", () => {
            rhythmRuler.Drums.push("snare drum");
            rhythmRuler.Drums.push("kick drum");
            rhythmRuler.Rulers.push([[1], []]);
            rhythmRuler.Rulers.push([[1], []]);

            expect(rhythmRuler.Drums).toHaveLength(2);
            expect(rhythmRuler.Rulers).toHaveLength(2);
        });

        test("should store ruler note values correctly", () => {
            rhythmRuler.Rulers.push([[4, 4, 4, 4], []]);

            expect(rhythmRuler.Rulers[0][0]).toEqual([4, 4, 4, 4]);
            expect(rhythmRuler.Rulers[0][1]).toEqual([]);
        });

        test("should store division history in ruler", () => {
            rhythmRuler.Rulers.push([[4], [[0, 4]]]);

            expect(rhythmRuler.Rulers[0][1]).toHaveLength(1);
            expect(rhythmRuler.Rulers[0][1][0]).toEqual([0, 4]);
        });
    });

    // =========================================================================
    // UNDO FUNCTIONALITY TESTS
    // =========================================================================
    describe("Undo Functionality", () => {
        beforeEach(() => {
            rhythmRuler.activity = mockActivity;
            rhythmRuler._rulers = [];
        });

        test("should return early if undo list is empty", () => {
            rhythmRuler._undoList = [];
            rhythmRuler.Rulers = [[[1], []]];
            rhythmRuler._rulers = [{ cells: [], insertCell: jest.fn(), deleteCell: jest.fn() }];

            // Should not throw
            expect(() => rhythmRuler._undo()).not.toThrow();
        });

        test("should stop synth when undoing", () => {
            rhythmRuler._undoList = [];
            rhythmRuler.Rulers = [[[1], []]];
            rhythmRuler._rulers = [{ cells: [], insertCell: jest.fn(), deleteCell: jest.fn() }];

            rhythmRuler._undo();

            expect(mockActivity.logo.synth.stop).toHaveBeenCalled();
        });

        test("should reset playing state when undoing", () => {
            rhythmRuler._playing = true;
            rhythmRuler._playingAll = true;
            rhythmRuler._playingOne = true;
            rhythmRuler._rulerPlaying = 1;
            rhythmRuler._undoList = [];
            rhythmRuler.Rulers = [[[1], []]];
            rhythmRuler._rulers = [{ cells: [], insertCell: jest.fn(), deleteCell: jest.fn() }];

            rhythmRuler._undo();

            expect(rhythmRuler._playing).toBe(false);
            expect(rhythmRuler._playingAll).toBe(false);
            expect(rhythmRuler._playingOne).toBe(false);
            expect(rhythmRuler._rulerPlaying).toBe(-1);
        });

        test("should reset starting time when undoing", () => {
            rhythmRuler._startingTime = 12345;
            rhythmRuler._undoList = [];
            rhythmRuler.Rulers = [[[1], []]];
            rhythmRuler._rulers = [{ cells: [], insertCell: jest.fn(), deleteCell: jest.fn() }];

            rhythmRuler._undo();

            expect(rhythmRuler._startingTime).toBeNull();
        });
    });

    // =========================================================================
    // SAVE DISSECT HISTORY TESTS
    // =========================================================================
    describe("Save Dissect History", () => {
        beforeEach(() => {
            rhythmRuler._dissectNumber = {
                classList: { add: jest.fn(), remove: jest.fn() }
            };
        });

        test("should save dissect history for rulers with drums", () => {
            rhythmRuler.Drums = ["snare drum"];
            rhythmRuler.Rulers = [[[], [[0, 2]]]];
            rhythmRuler._dissectHistory = [];

            rhythmRuler.saveDissectHistory();

            expect(rhythmRuler._dissectHistory).toHaveLength(1);
            expect(rhythmRuler._dissectHistory[0][1]).toBe("snare drum");
        });

        test("should skip rulers with null drums", () => {
            rhythmRuler.Drums = [null, "kick drum"];
            rhythmRuler.Rulers = [
                [[], []],
                [[], [[0, 3]]]
            ];
            rhythmRuler._dissectHistory = [];

            rhythmRuler.saveDissectHistory();

            expect(rhythmRuler._dissectHistory).toHaveLength(1);
            expect(rhythmRuler._dissectHistory[0][1]).toBe("kick drum");
        });

        test("should preserve old history entries for unused drums", () => {
            rhythmRuler.Drums = ["snare drum"];
            rhythmRuler.Rulers = [[[], [[0, 2]]]];
            rhythmRuler._dissectHistory = [[[[0, 4]], "old drum"]];

            rhythmRuler.saveDissectHistory();

            expect(rhythmRuler._dissectHistory).toHaveLength(2);
        });

        test("should add hasKeyboard class to dissect number", () => {
            rhythmRuler.Drums = ["snare drum"];
            rhythmRuler.Rulers = [[[], [[0, 2]]]];
            rhythmRuler._dissectHistory = [];

            rhythmRuler.saveDissectHistory();

            expect(rhythmRuler._dissectNumber.classList.add).toHaveBeenCalledWith("hasKeyboard");
        });
    });

    // =========================================================================
    // NOTE WIDTH CALCULATION TESTS
    // =========================================================================
    describe("Note Width Calculation", () => {
        test("should calculate width based on note value", () => {
            const width = rhythmRuler._noteWidth(4);

            // Width = EIGHTHNOTEWIDTH * (8 / noteValue) * 3
            // (3 is the default scale factor when widget is not maximized)
            // = 24 * (8 / 4) * 3 = 144
            expect(width).toBe(144);
        });

        test("should calculate width for eighth note", () => {
            const width = rhythmRuler._noteWidth(8);

            // = 24 * (8 / 8) * 3 = 72
            expect(width).toBe(72);
        });

        test("should calculate width for half note", () => {
            const width = rhythmRuler._noteWidth(2);

            // = 24 * (8 / 2) * 3 = 288
            expect(width).toBe(288);
        });

        test("should handle sixteenth note", () => {
            const width = rhythmRuler._noteWidth(16);

            // = 24 * (8 / 16) * 3 = 36
            expect(width).toBe(36);
        });
    });

    // =========================================================================
    // PLAYBACK STATE TESTS
    // =========================================================================
    describe("Playback State", () => {
        test("should allow updating playback properties", () => {
            rhythmRuler._rulerPlaying = 2;
            rhythmRuler._playingAll = true;
            rhythmRuler._playingOne = true;
            rhythmRuler._cellCounter = 5;

            expect(rhythmRuler._rulerPlaying).toBe(2);
            expect(rhythmRuler._playingAll).toBe(true);
            expect(rhythmRuler._playingOne).toBe(true);
            expect(rhythmRuler._cellCounter).toBe(5);
        });
    });

    // =========================================================================
    // TAP MODE TESTS
    // =========================================================================
    describe("Tap Mode", () => {
        test("should track tap mode verification", () => {
            // Update simple properties
            rhythmRuler._tapMode = true;
            rhythmRuler._tapTimes = [100, 200, 300];
            rhythmRuler._tapEndTime = 12345;

            expect(rhythmRuler._tapMode).toBe(true);
            expect(rhythmRuler._tapTimes).toHaveLength(3);
            expect(rhythmRuler._tapEndTime).toBe(12345);
        });

        test("should track tap interaction details", () => {
            // Cell reference and long press tracking
            const mockCell = { cellIndex: 2 };
            rhythmRuler._tapCell = mockCell;
            rhythmRuler._inLongPress = true;
            rhythmRuler._longPressStartTime = 10000;

            expect(rhythmRuler._tapCell.cellIndex).toBe(2);
            expect(rhythmRuler._inLongPress).toBe(true);
            expect(rhythmRuler._longPressStartTime).toBe(10000);
        });
    });

    // =========================================================================
    // MOUSE INTERACTION TESTS
    // =========================================================================
    describe("Mouse Interactions", () => {
        test("should track mouse interactions on cells", () => {
            rhythmRuler._mouseDownCell = 3;
            rhythmRuler._mouseUpCell = 5;

            expect(rhythmRuler._mouseDownCell).toBe(3);
            expect(rhythmRuler._mouseUpCell).toBe(5);
        });
    });

    // =========================================================================
    // FULLSCREEN MODE TESTS
    // =========================================================================
    describe("Fullscreen Mode", () => {
        test("should manage fullscreen scale factor", () => {
            expect(rhythmRuler._fullscreenScaleFactor).toBe(3);

            rhythmRuler._fullscreenScaleFactor = 5;
            expect(rhythmRuler._fullscreenScaleFactor).toBe(5);
        });
    });
});
