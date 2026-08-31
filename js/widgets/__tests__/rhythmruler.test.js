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
const ManagedTimer = require("../../utils/ManagedTimer.js");

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
global.deepClone = value => JSON.parse(JSON.stringify(value));
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
global.getComputedStyle = jest.fn().mockReturnValue({ backgroundColor: "#303030" });
global.ManagedTimer = ManagedTimer;

// Mock Window Manager

const mockWindow = {
    widgetWindows: {
        windowFor: jest.fn().mockReturnValue({
            clear: jest.fn(),
            show: jest.fn(),
            destroy: jest.fn(),
            addButton: jest.fn().mockReturnValue({
                onclick: null,
                innerHTML: "",
                replaceChildren: jest.fn(),
                appendChild: jest.fn()
            }),
            addInputButton: jest.fn().mockImplementation(val => ({
                value: val,
                addEventListener: jest.fn(),
                classList: { add: jest.fn(), remove: jest.fn() },
                onfocus: null,
                onblur: null
            })),
            getWidgetBody: jest.fn().mockReturnValue({
                clientWidth: 500,
                clientHeight: 400,
                appendChild: jest.fn(),
                append: jest.fn(),
                insertRow: jest.fn().mockReturnValue({
                    setAttribute: jest.fn(),
                    insertCell: jest.fn().mockReturnValue({
                        appendChild: jest.fn(),
                        replaceChildren: jest.fn(),
                        setAttribute: jest.fn(),
                        style: {},
                        textContent: "",
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
        replaceChildren: jest.fn(),
        insertRow: jest.fn().mockReturnValue({
            setAttribute: jest.fn(),
            insertCell: jest.fn().mockReturnValue({
                style: {},
                appendChild: jest.fn(),
                textContent: "",
                innerHTML: "",
                replaceChildren: jest.fn(),
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            })
        }),
        cells: [],
        insertCell: jest.fn().mockReturnValue({
            style: {},
            appendChild: jest.fn(),
            replaceChildren: jest.fn(),
            textContent: "",
            innerHTML: ""
        }),
        deleteCell: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
        parentNode: { style: { backgroundColor: "#303030" } },
        getContext: jest.fn().mockReturnValue({
            clearRect: jest.fn(),
            beginPath: jest.fn(),
            arc: jest.fn(),
            fillStyle: "",
            strokeStyle: "",
            lineWidth: 1,
            font: "",
            textAlign: "",
            textBaseline: "",
            fill: jest.fn(),
            stroke: jest.fn(),
            closePath: jest.fn(),
            fillText: jest.fn()
        })
    })),
    createTextNode: jest.fn().mockImplementation(text => ({ nodeType: 3, textContent: text })),
    getElementById: jest.fn().mockReturnValue({
        style: {},
        classList: { add: jest.fn(), remove: jest.fn() },
        replaceChildren: jest.fn()
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
        if (rhythmRuler && typeof rhythmRuler._clearWidgetTimers === "function") {
            rhythmRuler._clearWidgetTimers();
        }
        jest.useRealTimers();
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
    // NOTE VALUE DISPLAY TESTS
    // =========================================================================
    describe("Note Value Display", () => {
        test("should render note value markup as DOM nodes", () => {
            const cell = {
                appendChild: jest.fn(),
                textContent: "old"
            };

            global.calcNoteValueToDisplay.mockReturnValueOnce("1<br>&mdash;<br>4<br>note");

            rhythmRuler.__setNoteValueDisplay(cell, 4, 1);

            const appendedNodes = cell.appendChild.mock.calls.map(call => call[0]);
            expect(cell.textContent).toBe("");
            expect(appendedNodes.map(node => node.textContent)).toEqual([
                "1",
                "",
                "\u2014",
                "",
                "4",
                "",
                "note"
            ]);
            expect(cell.appendChild).toHaveBeenCalledTimes(7);
        });

        test("should append silence label as text", () => {
            const cell = {
                appendChild: jest.fn(),
                textContent: ""
            };

            global.calcNoteValueToDisplay.mockReturnValueOnce("1<br>&mdash;<br>4<br>note");

            rhythmRuler.__setNoteValueDisplay(cell, 4, 1, "silence");

            const appendedNodes = cell.appendChild.mock.calls.map(call => call[0]);
            expect(appendedNodes[appendedNodes.length - 1].textContent).toBe(" silence");
        });
    });

    // =========================================================================
    // TIMER LIFECYCLE TESTS
    // =========================================================================
    describe("Timer Lifecycle", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        test("should track and clear widget timeouts", () => {
            const callback = jest.fn();

            const timerId = rhythmRuler._setWidgetTimeout(callback, 1000);

            expect(rhythmRuler._timerManager.activeTimeoutCount).toBe(1);
            expect(rhythmRuler._clearWidgetTimeout(timerId)).toBe(true);

            jest.advanceTimersByTime(1000);

            expect(callback).not.toHaveBeenCalled();
            expect(rhythmRuler._timerManager.activeTimeoutCount).toBe(0);
        });

        test("should clear all widget timeouts and intervals", () => {
            const timeoutCallback = jest.fn();
            const intervalCallback = jest.fn();

            rhythmRuler._setWidgetTimeout(timeoutCallback, 1000);
            rhythmRuler._setWidgetInterval(intervalCallback, 100);

            expect(rhythmRuler._timerManager.activeCount).toBe(2);
            expect(rhythmRuler._clearWidgetTimers()).toBe(2);

            jest.advanceTimersByTime(1000);

            expect(timeoutCallback).not.toHaveBeenCalled();
            expect(intervalCallback).not.toHaveBeenCalled();
            expect(rhythmRuler._timerManager.activeCount).toBe(0);
        });

        test("__pause should clear pending playback timers", () => {
            const callback = jest.fn();
            rhythmRuler._playAllCell = {
                innerHTML: "",
                replaceChildren: jest.fn(),
                appendChild: jest.fn()
            };
            rhythmRuler.Rulers = [[[4], []]];
            rhythmRuler._playing = true;
            jest.spyOn(rhythmRuler, "_calculateZebraStripes").mockImplementation();
            jest.spyOn(rhythmRuler, "_refreshCircularView").mockImplementation();

            rhythmRuler._setWidgetTimeout(callback, 1000);
            rhythmRuler.__pause();
            jest.advanceTimersByTime(1000);

            expect(callback).not.toHaveBeenCalled();
            expect(rhythmRuler._timerManager.activeCount).toBe(0);
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
            const oldHistory = [[0, 4]];
            rhythmRuler._dissectHistory = [[oldHistory, "old drum"]];

            rhythmRuler.saveDissectHistory();
            oldHistory[0][1] = 8;

            expect(rhythmRuler._dissectHistory).toHaveLength(2);
            expect(rhythmRuler._dissectHistory[1][0][0][1]).toBe(4);
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
    // DISSECTION TESTS
    // =========================================================================
    describe("Dissection", () => {
        beforeEach(() => {
            rhythmRuler.activity = mockActivity;
            mockActivity.errorMsg = jest.fn();
            mockActivity.hideMsgs = jest.fn();
        });

        test("__dissectByNumber should display errorMsg if subdivision exceeds 256", () => {
            rhythmRuler._rulerSelected = 0;
            rhythmRuler._rulers = [{ deleteCell: jest.fn() }];
            rhythmRuler.Rulers = [[[64], []]];

            const cell = { cellIndex: 0 };

            rhythmRuler.__dissectByNumber(cell, 5, true);

            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "Maximum value of 256 has been exceeded."
            );
            expect(mockActivity.hideMsgs).not.toHaveBeenCalled();
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

    // =========================================================================
    // CIRCULAR VIEW TESTS
    // =========================================================================
    describe("Circular View", () => {
        function createMockCanvas() {
            return {
                width: 0,
                height: 0,
                style: { display: "", margin: "" },
                parentNode: { style: { backgroundColor: "#303030" } },
                addEventListener: jest.fn(),
                getBoundingClientRect: jest.fn().mockReturnValue({ left: 0, top: 0 }),
                getContext: jest.fn().mockReturnValue({
                    clearRect: jest.fn(),
                    beginPath: jest.fn(),
                    arc: jest.fn(),
                    moveTo: jest.fn(),
                    lineTo: jest.fn(),
                    closePath: jest.fn(),
                    fill: jest.fn(),
                    stroke: jest.fn(),
                    fillText: jest.fn(),
                    fillStyle: "",
                    strokeStyle: "",
                    lineWidth: 1,
                    font: "",
                    textAlign: "",
                    textBaseline: ""
                })
            };
        }

        test("should initialize circular view state to false", () => {
            expect(rhythmRuler._circularView).toBe(false);
            expect(rhythmRuler._circularCanvas).toBeNull();
            expect(rhythmRuler._circularHighlight).toEqual({});
        });

        test("should toggle _circularView flag", () => {
            expect(rhythmRuler._circularView).toBe(false);
            rhythmRuler._circularView = true;
            expect(rhythmRuler._circularView).toBe(true);
            rhythmRuler._circularView = false;
            expect(rhythmRuler._circularView).toBe(false);
        });

        test("_toggleCircularView should show canvas and hide table when switching to circular", () => {
            rhythmRuler._rhythmRulerTable = { style: {} };
            rhythmRuler.Rulers = [[[4, 4, 4, 4], []]];
            rhythmRuler._rulers = [{ cells: [] }];
            rhythmRuler._circularView = true;
            // Pre-set the canvas so _toggleCircularView skips document.createElement
            rhythmRuler._circularCanvas = createMockCanvas();

            rhythmRuler._toggleCircularView();

            expect(rhythmRuler._circularCanvas.style.display).toBe("block");
            expect(rhythmRuler._rhythmRulerTable.style.display).toBe("none");
        });

        test("_toggleCircularView should hide canvas when switching to linear", () => {
            // Setup: create a mock canvas first
            rhythmRuler._rhythmRulerTable = { style: {} };
            rhythmRuler._circularCanvas = { style: {}, addEventListener: jest.fn() };
            rhythmRuler.Rulers = [[[4, 4, 4, 4], []]];
            rhythmRuler._rulers = [
                {
                    children: [],
                    cells: [{ style: {} }, { style: {} }, { style: {} }, { style: {} }]
                }
            ];
            rhythmRuler._circularView = false;

            rhythmRuler._toggleCircularView();

            expect(rhythmRuler._circularCanvas.style.display).toBe("none");
            expect(rhythmRuler._rhythmRulerTable.style.display).toBe("");
        });

        test("_drawCircularView should not crash with empty rulers", () => {
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler._rhythmRulerTable = { style: {} };
            rhythmRuler.Rulers = [];

            expect(() => rhythmRuler._drawCircularView()).not.toThrow();
        });

        test("_drawCircularView should not crash with single ruler", () => {
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler._rhythmRulerTable = { style: {} };
            rhythmRuler.Rulers = [[[4, 4, 4, 4], []]];

            expect(() => rhythmRuler._drawCircularView()).not.toThrow();
        });

        test("_drawCircularView should not crash with multiple rulers (concentric)", () => {
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler._rhythmRulerTable = { style: {} };
            rhythmRuler.Rulers = [
                [[4, 4, 4, 4], []],
                [[3, 3, 3], []],
                [[8, 8, 8, 8, 8, 8, 8, 8], []]
            ];

            expect(() => rhythmRuler._drawCircularView()).not.toThrow();
        });

        test("_drawCircularView should handle rests (negative note values)", () => {
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler._rhythmRulerTable = { style: {} };
            rhythmRuler.Rulers = [[[4, -4, 4, 4], []]];

            expect(() => rhythmRuler._drawCircularView()).not.toThrow();
        });

        test("_drawCircularView should handle playback highlights", () => {
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler._rhythmRulerTable = { style: {} };
            rhythmRuler.Rulers = [[[4, 4, 4, 4], []]];
            rhythmRuler._playing = true;
            rhythmRuler._circularHighlight = { 0: 2 };

            expect(() => rhythmRuler._drawCircularView()).not.toThrow();
        });

        test("_onCircularMouseDown should not record a hit while playing", () => {
            rhythmRuler._playing = true;
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler.Rulers = [[[4, 4, 4, 4], []]];

            rhythmRuler._onCircularMouseDown({ clientX: 100, clientY: 100 });
            expect(rhythmRuler._circularDownHit).toBeNull();
        });

        test("_onCircularMouseUp should not act while playing", () => {
            rhythmRuler._playing = true;
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler.Rulers = [[[4, 4, 4, 4], []]];

            const dissectSpy = jest.spyOn(rhythmRuler, "__dissectByNumber").mockImplementation();
            const tieSpy = jest.spyOn(rhythmRuler, "__tie").mockImplementation();
            rhythmRuler._onCircularMouseUp({ clientX: 100, clientY: 100 });
            expect(dissectSpy).not.toHaveBeenCalled();
            expect(tieSpy).not.toHaveBeenCalled();
        });

        test("same-slice mousedown+mouseup should trigger dissect", () => {
            rhythmRuler._playing = false;
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler.Rulers = [[[4, 4, 4, 4], []]];
            rhythmRuler._rulers = [
                { cells: [{ style: {} }, { style: {} }, { style: {} }, { style: {} }] }
            ];
            rhythmRuler._dissectNumber = { value: "2" };

            // Pretend both events landed on the same slice.
            jest.spyOn(rhythmRuler, "_hitTestCircular").mockReturnValue({
                rulerIndex: 0,
                cellIndex: 1
            });
            const dissectSpy = jest.spyOn(rhythmRuler, "__dissectByNumber").mockImplementation();
            jest.spyOn(rhythmRuler, "saveDissectHistory").mockImplementation();
            jest.spyOn(rhythmRuler, "_drawCircularView").mockImplementation();

            rhythmRuler._onCircularMouseDown({});
            rhythmRuler._onCircularMouseUp({});

            expect(dissectSpy).toHaveBeenCalledTimes(1);
        });

        test("cross-slice swipe on same ruler should trigger __tie", () => {
            rhythmRuler._playing = false;
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler.Rulers = [[[4, 4, 4, 4], []]];
            rhythmRuler._rulers = [
                { cells: [{ style: {} }, { style: {} }, { style: {} }, { style: {} }] }
            ];

            const hitSpy = jest.spyOn(rhythmRuler, "_hitTestCircular");
            hitSpy.mockReturnValueOnce({ rulerIndex: 0, cellIndex: 0 });
            hitSpy.mockReturnValueOnce({ rulerIndex: 0, cellIndex: 2 });

            const tieSpy = jest.spyOn(rhythmRuler, "__tie").mockImplementation();
            jest.spyOn(rhythmRuler, "saveDissectHistory").mockImplementation();
            jest.spyOn(rhythmRuler, "_drawCircularView").mockImplementation();

            rhythmRuler._onCircularMouseDown({});
            rhythmRuler._onCircularMouseUp({});

            expect(tieSpy).toHaveBeenCalledTimes(1);
            expect(rhythmRuler._rulerSelected).toBe(0);
        });

        test("cross-ruler swipe should NOT tie (falls through to dissect)", () => {
            rhythmRuler._playing = false;
            rhythmRuler._circularCanvas = createMockCanvas();
            rhythmRuler.Rulers = [
                [[4, 4, 4, 4], []],
                [[4, 4, 4, 4], []]
            ];
            rhythmRuler._rulers = [
                { cells: [{ style: {} }, { style: {} }, { style: {} }, { style: {} }] },
                { cells: [{ style: {} }, { style: {} }, { style: {} }, { style: {} }] }
            ];
            rhythmRuler._dissectNumber = { value: "2" };

            const hitSpy = jest.spyOn(rhythmRuler, "_hitTestCircular");
            hitSpy.mockReturnValueOnce({ rulerIndex: 0, cellIndex: 1 });
            hitSpy.mockReturnValueOnce({ rulerIndex: 1, cellIndex: 2 });

            const tieSpy = jest.spyOn(rhythmRuler, "__tie").mockImplementation();
            const dissectSpy = jest.spyOn(rhythmRuler, "__dissectByNumber").mockImplementation();
            jest.spyOn(rhythmRuler, "saveDissectHistory").mockImplementation();
            jest.spyOn(rhythmRuler, "_drawCircularView").mockImplementation();

            rhythmRuler._onCircularMouseDown({});
            rhythmRuler._onCircularMouseUp({});

            expect(tieSpy).not.toHaveBeenCalled();
            expect(dissectSpy).toHaveBeenCalledTimes(1);
        });

        test("__pause should clear circular highlights", () => {
            rhythmRuler._circularHighlight = { 0: 2, 1: 1 };
            rhythmRuler._playing = true;
            rhythmRuler._playAllCell = {
                innerHTML: "",
                replaceChildren: jest.fn(),
                appendChild: jest.fn()
            };
            rhythmRuler.Rulers = [[[4], []]];
            rhythmRuler._rulers = [
                {
                    children: [],
                    cells: [{ style: {} }]
                }
            ];

            rhythmRuler.__pause();

            expect(rhythmRuler._circularHighlight).toEqual({});
        });
    });
});

describe("RhythmRuler widget timer fallback (no ManagedTimer)", () => {
    let rhythmRuler;

    beforeEach(() => {
        jest.useFakeTimers();
        rhythmRuler = new RhythmRuler();
        rhythmRuler._timerManager = null;
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe("_setWidgetTimeout", () => {
        it("tracks the timeout and runs the callback, then stops tracking it", () => {
            const callback = jest.fn();

            const id = rhythmRuler._setWidgetTimeout(callback, 100);
            expect(rhythmRuler._activeTimeouts.has(id)).toBe(true);

            jest.advanceTimersByTime(100);

            expect(callback).toHaveBeenCalledTimes(1);
            expect(rhythmRuler._activeTimeouts.has(id)).toBe(false);
        });
    });

    describe("_clearWidgetTimeout", () => {
        it("returns false for null or undefined ids", () => {
            expect(rhythmRuler._clearWidgetTimeout(null)).toBe(false);
            expect(rhythmRuler._clearWidgetTimeout(undefined)).toBe(false);
        });

        it("cancels a tracked timeout before it fires", () => {
            const callback = jest.fn();
            const id = rhythmRuler._setWidgetTimeout(callback, 100);

            expect(rhythmRuler._clearWidgetTimeout(id)).toBe(true);
            expect(rhythmRuler._activeTimeouts.has(id)).toBe(false);

            jest.advanceTimersByTime(100);
            expect(callback).not.toHaveBeenCalled();
        });

        it("returns false for an untracked id", () => {
            expect(rhythmRuler._clearWidgetTimeout(999999)).toBe(false);
        });
    });

    describe("_setWidgetInterval", () => {
        it("tracks the interval and runs the callback repeatedly", () => {
            const callback = jest.fn();

            const id = rhythmRuler._setWidgetInterval(callback, 100);
            expect(rhythmRuler._activeIntervals.has(id)).toBe(true);

            jest.advanceTimersByTime(250);
            expect(callback).toHaveBeenCalledTimes(2);

            rhythmRuler._clearWidgetInterval(id);
        });
    });

    describe("_clearWidgetInterval", () => {
        it("returns false for null or undefined ids", () => {
            expect(rhythmRuler._clearWidgetInterval(null)).toBe(false);
            expect(rhythmRuler._clearWidgetInterval(undefined)).toBe(false);
        });

        it("cancels a tracked interval", () => {
            const callback = jest.fn();
            const id = rhythmRuler._setWidgetInterval(callback, 100);

            expect(rhythmRuler._clearWidgetInterval(id)).toBe(true);
            expect(rhythmRuler._activeIntervals.has(id)).toBe(false);

            jest.advanceTimersByTime(300);
            expect(callback).not.toHaveBeenCalled();
        });

        it("returns false for an untracked id", () => {
            expect(rhythmRuler._clearWidgetInterval(999999)).toBe(false);
        });
    });

    describe("_clearWidgetTimers", () => {
        it("cancels every tracked timer and returns the count", () => {
            rhythmRuler._setWidgetTimeout(jest.fn(), 100);
            rhythmRuler._setWidgetTimeout(jest.fn(), 200);
            rhythmRuler._setWidgetInterval(jest.fn(), 100);

            const count = rhythmRuler._clearWidgetTimers();

            expect(count).toBe(3);
            expect(rhythmRuler._activeTimeouts.size).toBe(0);
            expect(rhythmRuler._activeIntervals.size).toBe(0);
            expect(rhythmRuler._longPressBeep).toBeNull();
        });
    });
});

describe("RhythmRuler widget timer delegation (with ManagedTimer)", () => {
    let rhythmRuler;

    beforeEach(() => {
        rhythmRuler = new RhythmRuler();
    });

    it("_setWidgetTimeout delegates to the timer manager", () => {
        const callback = jest.fn();
        rhythmRuler._timerManager = { setTimeout: jest.fn().mockReturnValue(42) };

        expect(rhythmRuler._setWidgetTimeout(callback, 100)).toBe(42);
        expect(rhythmRuler._timerManager.setTimeout).toHaveBeenCalledWith(callback, 100);
    });

    it("_setWidgetInterval delegates to the timer manager", () => {
        const callback = jest.fn();
        rhythmRuler._timerManager = { setInterval: jest.fn().mockReturnValue(7) };

        expect(rhythmRuler._setWidgetInterval(callback, 100)).toBe(7);
        expect(rhythmRuler._timerManager.setInterval).toHaveBeenCalledWith(callback, 100);
    });

    it("_clearWidgetTimers adds the manager count to the tracked timer count", () => {
        rhythmRuler._timerManager = { clearAll: jest.fn().mockReturnValue(5) };
        rhythmRuler._activeTimeouts.add(1);
        rhythmRuler._activeIntervals.add(2);

        expect(rhythmRuler._clearWidgetTimers()).toBe(7);
    });

    it("_clearWidgetTimeout returns true when the manager clears the timeout", () => {
        rhythmRuler._timerManager = { clearTimeout: jest.fn().mockReturnValue(true) };

        expect(rhythmRuler._clearWidgetTimeout(5)).toBe(true);
        expect(rhythmRuler._timerManager.clearTimeout).toHaveBeenCalledWith(5);
    });

    it("_clearWidgetInterval returns true when the manager clears the interval", () => {
        rhythmRuler._timerManager = { clearInterval: jest.fn().mockReturnValue(true) };

        expect(rhythmRuler._clearWidgetInterval(5)).toBe(true);
        expect(rhythmRuler._timerManager.clearInterval).toHaveBeenCalledWith(5);
    });
});

describe("RhythmRuler _get_save_lock", () => {
    it("returns the current save lock state", () => {
        const rhythmRuler = new RhythmRuler();

        rhythmRuler._save_lock = false;
        expect(rhythmRuler._get_save_lock()).toBe(false);

        rhythmRuler._save_lock = true;
        expect(rhythmRuler._get_save_lock()).toBe(true);
    });
});

describe("RhythmRuler _getDrumName safety and _saveMachine coverage", () => {
    let rhythmRuler;

    beforeEach(() => {
        rhythmRuler = new RhythmRuler();
        rhythmRuler.activity = {
            blocks: {
                blockList: {}
            },
            palettes: {
                dict: {
                    main: { hideMenu: jest.fn() }
                }
            },
            refreshCanvas: jest.fn()
        };
        rhythmRuler._rulers = [{}];
        rhythmRuler.Rulers = [[[4, 4, 4, 4]]];
    });

    it("returns 'snare drum' when Drums is undefined", () => {
        rhythmRuler.Drums = undefined;
        expect(rhythmRuler._getDrumName(0)).toBe("snare drum");
    });

    it("returns 'snare drum' when Drums array entry is undefined", () => {
        rhythmRuler.Drums = [];
        expect(rhythmRuler._getDrumName(0)).toBe("snare drum");
    });

    it("returns 'snare drum' when Drums array entry is null", () => {
        rhythmRuler.Drums = [null];
        expect(rhythmRuler._getDrumName(0)).toBe("snare drum");
    });

    it("returns 'snare drum' when drum block is missing from blockList", () => {
        rhythmRuler.Drums = [99];
        expect(rhythmRuler._getDrumName(0)).toBe("snare drum");
    });

    it("returns 'snare drum' when drum block has missing/null connections", () => {
        rhythmRuler.Drums = [1];
        rhythmRuler.activity.blocks.blockList = {
            1: { connections: [null, null] }
        };
        expect(rhythmRuler._getDrumName(0)).toBe("snare drum");
    });

    it("returns 'snare drum' when connected block is missing or lacks a valid string value", () => {
        rhythmRuler.Drums = [1];
        rhythmRuler.activity.blocks.blockList = {
            1: { connections: [null, 2] },
            2: { value: 123 }
        };
        expect(rhythmRuler._getDrumName(0)).toBe("snare drum");
    });

    it("returns connected drum name when drum block and value are valid", () => {
        rhythmRuler.Drums = [1];
        rhythmRuler.activity.blocks.blockList = {
            1: { connections: [null, 2] },
            2: { value: "bass drum" }
        };
        expect(rhythmRuler._getDrumName(0)).toBe("bass drum");
    });

    it("executes _saveMachine safely with null drum", () => {
        global.DRUMNAMES = [["snare-drum", "snare drum"]];
        rhythmRuler.Drums = [null];
        rhythmRuler._saveDrumMachine = jest.fn();
        expect(() => rhythmRuler._saveMachine(0)).not.toThrow();
    });

    it("executes _saveMachine safely with valid drum block", () => {
        global.DRUMNAMES = [["snare-drum", "snare drum"]];
        rhythmRuler.Drums = [1];
        rhythmRuler.activity.blocks.blockList = {
            1: { connections: [null, 2] },
            2: { value: "snare drum" }
        };
        rhythmRuler._saveDrumMachine = jest.fn();
        rhythmRuler._saveMachine(0);
        expect(rhythmRuler._saveDrumMachine).toHaveBeenCalledWith(0, "snare drum", false);
    });

    it("executes _saveMachine safely with missing drum connections", () => {
        global.DRUMNAMES = [["snare-drum", "snare drum"]];
        rhythmRuler.Drums = [1];
        rhythmRuler.activity.blocks.blockList = {
            1: { connections: [null, null] }
        };
        rhythmRuler._saveDrumMachine = jest.fn();
        rhythmRuler._saveMachine(0);
        expect(rhythmRuler._saveDrumMachine).toHaveBeenCalledWith(0, "snare drum", false);
    });

    it("executes _saveVoiceMachine safely with missing drum connections", () => {
        jest.useFakeTimers();
        rhythmRuler.Drums = [1];
        rhythmRuler.activity.blocks.blockList = {
            1: { connections: [null, null] }
        };
        expect(() => rhythmRuler._saveVoiceMachine(0, "voice")).not.toThrow();
        jest.advanceTimersByTime(100);
        jest.useRealTimers();
    });

    describe("RhythmRuler - Dissection and Subdivision Engine", () => {
        let cell;
        let mockRuler;

        beforeEach(() => {
            cell = {
                cellIndex: 0,
                style: { width: "100px", backgroundColor: "#ffb020" },
                textContent: "1/4",
                replaceChildren: jest.fn(),
                setAttribute: jest.fn(),
                parentNode: {
                    cells: []
                }
            };
            cell.parentNode.cells.push(cell);

            mockRuler = {
                cells: [cell],
                deleteCell: jest.fn(),
                insertCell: jest.fn().mockImplementation(() => ({
                    style: {},
                    setAttribute: jest.fn(),
                    replaceChildren: jest.fn(),
                    addEventListener: jest.fn(),
                    textContent: ""
                }))
            };

            rhythmRuler._rulers = [mockRuler];
            rhythmRuler.Rulers = [[[4], []]];
            rhythmRuler.Drums = [null];
            rhythmRuler._rulerSelected = 0;
            rhythmRuler._undoList = [];
            rhythmRuler._dissectNumber = { value: "2" };
            rhythmRuler.widgetWindow = {
                isMaximized: jest.fn(() => false),
                getWidgetBody: jest.fn(() => ({
                    clientWidth: 400,
                    clientHeight: 400,
                    append: jest.fn()
                }))
            };
            rhythmRuler.activity = {
                errorMsg: jest.fn(),
                hideMsgs: jest.fn(),
                logo: {
                    synth: {
                        stop: jest.fn()
                    }
                }
            };
            rhythmRuler._setButtonIcon = jest.fn();
            rhythmRuler._calculateZebraStripes = jest.fn();
            rhythmRuler._refreshCircularView = jest.fn();
            rhythmRuler.__addCellEventHandlers = jest.fn();
            rhythmRuler.__setNoteValueDisplay = jest.fn();
        });

        test("__dissectByNumber splits cell into equal subdivisions", () => {
            rhythmRuler.__dissectByNumber(cell, 2, true);

            expect(rhythmRuler.Rulers[0][0]).toEqual([8, 8]);
            expect(rhythmRuler._undoList.length).toBe(1);
            expect(rhythmRuler._undoList[0][0]).toBe("dissect");
            expect(rhythmRuler._calculateZebraStripes).toHaveBeenCalledWith(0);
            expect(rhythmRuler._refreshCircularView).toHaveBeenCalled();
        });

        test("__dissectByNumber rejects division when note value exceeds 256", () => {
            rhythmRuler.Rulers[0][0] = [128];

            rhythmRuler.__dissectByNumber(cell, 4, true);

            expect(rhythmRuler.activity.errorMsg).toHaveBeenCalled();
            expect(rhythmRuler._undoList.length).toBe(0);
        });

        test("__dissectByNumber safely returns and preserves state on invalid parameters", () => {
            const initialRulerValues = [...rhythmRuler.Rulers[0][0]];

            rhythmRuler.__dissectByNumber(undefined, 2, true);
            expect(rhythmRuler.Rulers[0][0]).toEqual(initialRulerValues);
            expect(rhythmRuler._undoList).toHaveLength(0);
            expect(mockRuler.deleteCell).not.toHaveBeenCalled();

            rhythmRuler.__dissectByNumber(cell, "invalid", true);
            expect(rhythmRuler.Rulers[0][0]).toEqual(initialRulerValues);
            expect(rhythmRuler._undoList).toHaveLength(0);
            expect(mockRuler.deleteCell).not.toHaveBeenCalled();
        });

        test("__divideFromList divides cell into custom list of subdivisions", () => {
            rhythmRuler.__divideFromList(cell, [8, 16, 16], true);

            expect(rhythmRuler.Rulers[0][0]).toEqual([8, 16, 16]);
            expect(rhythmRuler._undoList.length).toBe(1);
            expect(rhythmRuler._undoList[0][0]).toBe("tap");
            expect(rhythmRuler._calculateZebraStripes).toHaveBeenCalledWith(0);
            expect(rhythmRuler._refreshCircularView).toHaveBeenCalled();
        });

        test("__divideFromList safely returns and preserves state on invalid arguments", () => {
            const initialRulerValues = [...rhythmRuler.Rulers[0][0]];

            rhythmRuler.__divideFromList(undefined, [8, 8], true);
            expect(rhythmRuler.Rulers[0][0]).toEqual(initialRulerValues);
            expect(rhythmRuler._undoList).toHaveLength(0);
            expect(mockRuler.deleteCell).not.toHaveBeenCalled();

            rhythmRuler.__divideFromList(cell, "not-an-object", true);
            expect(rhythmRuler.Rulers[0][0]).toEqual(initialRulerValues);
            expect(rhythmRuler._undoList).toHaveLength(0);
            expect(mockRuler.deleteCell).not.toHaveBeenCalled();
        });

        test("_tap activates tap mode and updates button icon", () => {
            rhythmRuler._tapButton = {};
            rhythmRuler._tap();

            expect(rhythmRuler._tapMode).toBe(true);
            expect(rhythmRuler._setButtonIcon).toHaveBeenCalledWith(
                rhythmRuler._tapButton,
                "tap-active-button.svg",
                "tap a rhythm"
            );
        });
    });

    describe("RhythmRuler - Tie and Rest State Engine", () => {
        let cellA, cellB;
        let mockRuler;

        beforeEach(() => {
            cellA = {
                cellIndex: 0,
                style: { width: "50px", backgroundColor: "#ffb020" },
                textContent: "1/8",
                getAttribute: jest.fn(() => "0"),
                parentNode: null
            };
            cellB = {
                cellIndex: 1,
                style: { width: "50px", backgroundColor: "#ffb020" },
                textContent: "1/8",
                getAttribute: jest.fn(() => "0"),
                parentNode: null
            };

            const parent = {
                getAttribute: jest.fn(() => "0"),
                cells: [cellA, cellB],
                deleteCell: jest.fn(idx => {
                    parent.cells.splice(idx, 1);
                }),
                insertCell: jest.fn().mockImplementation(() => ({
                    style: {},
                    setAttribute: jest.fn(),
                    replaceChildren: jest.fn(),
                    addEventListener: jest.fn(),
                    textContent: ""
                }))
            };
            cellA.parentNode = parent;
            cellB.parentNode = parent;

            mockRuler = parent;
            rhythmRuler._rulers = [mockRuler];
            rhythmRuler.Rulers = [[[8, 8], []]];
            rhythmRuler.Drums = [null];
            rhythmRuler._rulerSelected = 0;
            rhythmRuler._undoList = [];
            rhythmRuler._playing = false;
            rhythmRuler.widgetWindow = {
                isMaximized: jest.fn(() => false)
            };
            rhythmRuler._calculateZebraStripes = jest.fn();
            rhythmRuler._refreshCircularView = jest.fn();
            rhythmRuler.__addCellEventHandlers = jest.fn();
            rhythmRuler.__setNoteValueDisplay = jest.fn();
        });

        test("_tieRuler initiates tie when cell and parent node are valid", () => {
            rhythmRuler._mouseDownCell = cellA;
            rhythmRuler._mouseUpCell = cellB;

            const fakeEvent = { currentTarget: cellA };
            rhythmRuler._tieRuler(fakeEvent, mockRuler);

            expect(rhythmRuler._undoList.length).toBe(1);
            expect(rhythmRuler._undoList[0][0]).toBe("tie");
            expect(rhythmRuler.Rulers[0][0]).toEqual([4]);
        });

        test("_tieRuler handles reverse drag selection correctly", () => {
            rhythmRuler._mouseDownCell = cellB;
            rhythmRuler._mouseUpCell = cellA;

            const fakeEvent = { currentTarget: cellB };
            rhythmRuler._tieRuler(fakeEvent, mockRuler);

            expect(rhythmRuler._undoList.length).toBe(1);
            expect(rhythmRuler.Rulers[0][0]).toEqual([4]);
            expect(rhythmRuler._mouseDownCell).toBe(cellA);
            expect(rhythmRuler._mouseUpCell).toBe(cellB);
        });

        test("_tieRuler ignores tie operations when widget is currently playing", () => {
            rhythmRuler._playing = true;
            rhythmRuler._mouseDownCell = cellA;
            rhythmRuler._mouseUpCell = cellB;

            rhythmRuler._tieRuler({ currentTarget: cellA }, mockRuler);

            expect(rhythmRuler._undoList.length).toBe(0);
        });

        test("__tie safely ignores tie when mouseDown and mouseUp cells are identical", () => {
            rhythmRuler._mouseDownCell = cellA;
            rhythmRuler._mouseUpCell = cellA;

            rhythmRuler.__tie(true);

            expect(rhythmRuler._undoList.length).toBe(0);
        });

        test("__tie safely ignores tie when mouseDown or mouseUp cell is null", () => {
            rhythmRuler._mouseDownCell = null;
            rhythmRuler._mouseUpCell = cellB;

            rhythmRuler.__tie(true);

            expect(rhythmRuler._undoList.length).toBe(0);
        });

        test("__toggleRestState toggles between positive note and negative rest value", () => {
            cellA.removeEventListener = jest.fn();
            cellA.addEventListener = jest.fn();

            rhythmRuler.__toggleRestState(cellA, true);

            expect(rhythmRuler.Rulers[0][0][0]).toBe(-8);
            expect(rhythmRuler._undoList.length).toBe(1);
            expect(rhythmRuler._undoList[0][0]).toBe("rest");

            rhythmRuler.__toggleRestState(cellA, true);
            expect(rhythmRuler.Rulers[0][0][0]).toBe(8);
        });
    });

    describe("RhythmRuler - Polyrhythmic Merging & Math Engine", () => {
        beforeEach(() => {
            rhythmRuler.Rulers = [
                [[4, 4], []],
                [[8, 8, 8, 8], []]
            ];
            rhythmRuler.Drums = [null, null];
        });

        test("_mergeRulers calculates combined polyrhythmic note values array", () => {
            const merged = rhythmRuler._mergeRulers();

            expect(Array.isArray(merged)).toBe(true);
            expect(merged.length).toBeGreaterThan(0);
            expect(merged).toEqual([8, 8, 8, 8]);
        });

        test("_mergeRulers handles 3-against-2 polyrhythms correctly", () => {
            rhythmRuler.Rulers = [
                [[2, 2], []], // Half notes (0.5, 1.0)
                [[3, 3, 3], []] // Triplets (0.333, 0.666, 1.0)
            ];

            const merged = rhythmRuler._mergeRulers();

            expect(merged).toHaveLength(4);
            expect(merged[0]).toBeCloseTo(3);
            expect(merged[1]).toBeCloseTo(6);
            expect(merged[2]).toBeCloseTo(6);
            expect(merged[3]).toBeCloseTo(3);
        });

        test("_get_save_lock returns save lock status", () => {
            rhythmRuler._save_lock = false;
            expect(rhythmRuler._get_save_lock()).toBe(false);
            rhythmRuler._save_lock = true;
            expect(rhythmRuler._get_save_lock()).toBe(true);
        });
    });

    describe("RhythmRuler - History Restoration & Replay Engine", () => {
        let mockRuler;
        let cell0, cell1;

        beforeEach(() => {
            cell0 = {
                style: { width: "50px" },
                cellIndex: 0,
                removeEventListener: jest.fn(),
                addEventListener: jest.fn(),
                parentNode: null
            };
            cell1 = {
                style: { width: "50px" },
                cellIndex: 1,
                removeEventListener: jest.fn(),
                addEventListener: jest.fn(),
                parentNode: null
            };

            const parent = {
                getAttribute: jest.fn(() => "0"),
                cells: [cell0, cell1],
                deleteCell: jest.fn(idx => {
                    parent.cells.splice(idx, 1);
                }),
                insertCell: jest.fn().mockImplementation(() => ({
                    style: {},
                    setAttribute: jest.fn(),
                    replaceChildren: jest.fn(),
                    addEventListener: jest.fn(),
                    textContent: ""
                }))
            };
            cell0.parentNode = parent;
            cell1.parentNode = parent;

            mockRuler = parent;
            rhythmRuler._rulers = [mockRuler];
            rhythmRuler.Rulers = [[[8, 8], [[0, 2]]]];
            rhythmRuler.Drums = [0];
            rhythmRuler._rulerSelected = 0;
            rhythmRuler._undoList = [];
            rhythmRuler._dissectNumber = {
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            rhythmRuler.widgetWindow = {
                isMaximized: jest.fn(() => false)
            };
            rhythmRuler.activity = {
                logo: {
                    synth: {
                        stop: jest.fn()
                    }
                }
            };
            rhythmRuler.__setNoteValueDisplay = jest.fn();
            rhythmRuler.__addCellEventHandlers = jest.fn();
            rhythmRuler._calculateZebraStripes = jest.fn();
            rhythmRuler._refreshCircularView = jest.fn();
        });

        test("_undo safely returns when undo list is empty", () => {
            rhythmRuler._undoList = [];
            expect(() => rhythmRuler._undo()).not.toThrow();
            expect(rhythmRuler.activity.logo.synth.stop).toHaveBeenCalled();
        });

        test("_undo restores previous state for dissect action", () => {
            rhythmRuler._undoList.push(["dissect", 0]);

            rhythmRuler._undo();

            expect(rhythmRuler.Rulers[0][0][0]).toBe(4);
        });

        test("_undo restores previous state for rest action", () => {
            rhythmRuler.Rulers = [[[-8, 8], [0]]];
            rhythmRuler._undoList.push(["rest", 0]);

            rhythmRuler._undo();

            expect(rhythmRuler.Rulers[0][0][0]).toBe(8);
        });

        test("_restoreDissectHistory replays recorded rest, dissect, divide, and tie operations", () => {
            const cell0 = { cellIndex: 0 };
            const cell1 = { cellIndex: 1 };
            const cell2 = { cellIndex: 2 };
            rhythmRuler._rulers = [{ cells: [cell0, cell1, cell2] }];
            rhythmRuler.Drums = [0];
            rhythmRuler._dissectHistory = [
                [
                    [
                        0, // toggle rest at cell 0
                        [1, 2], // dissect cell 1 into 2
                        [2, [8, 8]], // divide cell 2 from list
                        [
                            [0, 8],
                            [1, 8]
                        ] // tie cell 0 and 1
                    ],
                    0 // drum index 0
                ]
            ];
            rhythmRuler.__toggleRestState = jest.fn();
            rhythmRuler.__dissectByNumber = jest.fn();
            rhythmRuler.__divideFromList = jest.fn();
            rhythmRuler.__tie = jest.fn(() => {
                expect(rhythmRuler._mouseDownCell).toBe(cell0);
                expect(rhythmRuler._mouseUpCell).toBe(cell1);
            });

            rhythmRuler._restoreDissectHistory();

            expect(rhythmRuler._rulerSelected).toBe(0);
            expect(rhythmRuler.__toggleRestState).toHaveBeenCalledWith(cell0, false);
            expect(rhythmRuler.__dissectByNumber).toHaveBeenCalledWith(cell1, 2, false);
            expect(rhythmRuler.__divideFromList).toHaveBeenCalledWith(cell2, [8, 8], false);
            expect(rhythmRuler._mouseDownCell).toBeNull();
            expect(rhythmRuler._mouseUpCell).toBeNull();
            expect(rhythmRuler.__tie).toHaveBeenCalledWith(false);
        });

        test("saveDissectHistory saves dissect history to internal state", () => {
            rhythmRuler._dissectHistory = [[["old"], 1]];
            rhythmRuler.Rulers = [[[8, 8], [[0, 2]]]];
            rhythmRuler.Drums = [0];

            rhythmRuler.saveDissectHistory();

            expect(rhythmRuler._dissectHistory.length).toBe(2);
            expect(rhythmRuler._dissectNumber.classList.add).toHaveBeenCalledWith("hasKeyboard");
        });
    });

    describe("RhythmRuler - Block Serialization and Save Pipelines", () => {
        let mockRulerElement;

        beforeEach(() => {
            mockRulerElement = {
                cells: [
                    { textContent: "1/4", style: { backgroundColor: "#ffb020" } },
                    { textContent: "1/4", style: { backgroundColor: "#303030" } }
                ]
            };

            rhythmRuler._rulers = [mockRulerElement];
            rhythmRuler.Rulers = [[[4, -4], []]];
            rhythmRuler.Drums = [null];
            rhythmRuler.activity = {
                palettes: {
                    dict: {
                        rhythm: { hideMenu: jest.fn() }
                    }
                },
                blocks: {
                    blockList: [{ name: "start", connections: [null, null] }],
                    loadNewBlocks: jest.fn(),
                    adjustDocks: jest.fn(),
                    clampBlocksToCheck: []
                },
                refreshCanvas: jest.fn(),
                textMsg: jest.fn()
            };
            rhythmRuler._rulerSelected = 0;
            rhythmRuler.blockNo = 0;
            rhythmRuler.styleRhythmRuler = jest.fn();
        });

        test("_save generates action stack with note and rest blocks", () => {
            jest.useFakeTimers();
            rhythmRuler.docById = jest.fn(() => mockRulerElement);

            rhythmRuler._save(0);

            jest.advanceTimersByTime(1000);
            expect(rhythmRuler.activity.palettes.dict.rhythm.hideMenu).toHaveBeenCalled();
            expect(rhythmRuler.activity.blocks.loadNewBlocks).toHaveBeenCalled();
            const stack = rhythmRuler.activity.blocks.loadNewBlocks.mock.calls[0][0];
            expect(stack).toHaveLength(16);
            expect(stack[0][1]).toEqual(["action", { collapsed: true }]);
            expect(stack[1][1]).toEqual(["text", { value: "snare drum rhythm" }]);
            expect(stack[2][1]).toBe("rhythm2");
            expect(stack[3][1]).toEqual(["number", { value: 1 }]);
            expect(stack[4][1]).toBe("divide");
            expect(stack[5][1]).toEqual(["number", { value: 1 }]);
            expect(stack[6][1]).toEqual(["number", { value: 4 }]);
            expect(stack[7][1]).toBe("vspace");
            expect(stack[8][1]).toBe("hidden");
            expect(stack[9][1]).toBe("rhythm2");
            expect(stack[15][1]).toBe("hidden");
            expect(stack[15][4]).toEqual([14, null]);
            jest.useRealTimers();
        });

        test("_saveTuplets generates tuplet-specific action blocks", () => {
            jest.useFakeTimers();
            rhythmRuler.docById = jest.fn(() => mockRulerElement);

            rhythmRuler._saveTuplets(0);

            jest.advanceTimersByTime(1000);
            expect(rhythmRuler.activity.blocks.loadNewBlocks).toHaveBeenCalled();
            const stack = rhythmRuler.activity.blocks.loadNewBlocks.mock.calls[0][0];
            expect(stack).toHaveLength(16);
            expect(stack[0][1]).toEqual(["action", { collapsed: true }]);
            expect(stack[1][1]).toEqual(["text", { value: "rhythm" }]);
            expect(stack[2][1]).toBe("stuplet");
            expect(stack[3][1]).toEqual(["number", { value: 1 }]);
            expect(stack[4][1]).toBe("divide");
            expect(stack[5][1]).toEqual(["number", { value: 1 }]);
            expect(stack[6][1]).toEqual(["number", { value: 4 }]);
            expect(stack[7][1]).toBe("vspace");
            expect(stack[8][1]).toBe("hidden");
            expect(stack[9][1]).toBe("stuplet");
            expect(stack[15][1]).toBe("hidden");
            expect(stack[15][4]).toEqual([14, null]);
            jest.useRealTimers();
        });

        test("_saveTupletsMerged serializes merged note values array", () => {
            jest.useFakeTimers();
            rhythmRuler._saveTupletsMerged([4, 4, 8, 8]);

            jest.advanceTimersByTime(1000);
            expect(rhythmRuler.activity.blocks.loadNewBlocks).toHaveBeenCalled();
            const stack = rhythmRuler.activity.blocks.loadNewBlocks.mock.calls[0][0];
            expect(stack).toHaveLength(16);
            expect(stack[0][1]).toEqual(["action", { collapsed: true }]);
            expect(stack[1][1]).toEqual(["text", { value: "rhythm" }]);
            expect(stack[2][1]).toBe("rhythm2");
            expect(stack[3][1]).toEqual(["number", { value: 2 }]);
            expect(stack[4][1]).toBe("divide");
            expect(stack[5][1]).toEqual(["number", { value: 1 }]);
            expect(stack[6][1]).toEqual(["number", { value: 4 }]);
            expect(stack[9][1]).toBe("rhythm2");
            expect(stack[10][1]).toEqual(["number", { value: 2 }]);
            expect(stack[11][1]).toBe("divide");
            expect(stack[12][1]).toEqual(["number", { value: 1 }]);
            expect(stack[13][1]).toEqual(["number", { value: 8 }]);
            expect(stack[15][1]).toBe("hidden");
            expect(stack[15][4]).toEqual([14, null]);
            jest.useRealTimers();
        });

        test("_saveDrumMachine generates drum synth action stack with effect params", () => {
            jest.useFakeTimers();
            rhythmRuler.docById = jest.fn(() => mockRulerElement);

            rhythmRuler._saveDrumMachine(0, "snare drum", true);

            jest.advanceTimersByTime(1000);
            expect(rhythmRuler.activity.blocks.loadNewBlocks).toHaveBeenCalled();
            const stack = rhythmRuler.activity.blocks.loadNewBlocks.mock.calls[0][0];
            expect(stack).toHaveLength(18);
            expect(stack[0][1]).toEqual(["action", { collapsed: true }]);
            expect(stack[1][1]).toEqual(["text", { value: "snare drum action" }]);
            expect(stack[2][1]).toBe("newnote");
            expect(stack[3][1]).toBe("divide");
            expect(stack[4][1]).toEqual(["number", { value: 1 }]);
            expect(stack[5][1]).toEqual(["number", { value: 4 }]);
            expect(stack[6][1]).toBe("vspace");
            expect(stack[7][1]).toBe("playdrum");
            expect(stack[8][1]).toEqual(["effectsname", { value: "snare drum" }]);
            expect(stack[9][1]).toBe("hidden");
            expect(stack[10][1]).toBe("newnote");
            expect(stack[14][1]).toBe("vspace");
            expect(stack[15][1]).toBe("rest2");
            expect(stack[17][1]).toBe("hidden");
            jest.useRealTimers();
        });

        test("_saveVoiceMachine generates vocal synth action stack", () => {
            jest.useFakeTimers();
            rhythmRuler.docById = jest.fn(() => mockRulerElement);

            rhythmRuler._saveVoiceMachine(0, "electronic synth");

            jest.advanceTimersByTime(1000);
            expect(rhythmRuler.activity.blocks.loadNewBlocks).toHaveBeenCalled();
            const stack = rhythmRuler.activity.blocks.loadNewBlocks.mock.calls[0][0];
            expect(stack).toHaveLength(22);
            expect(stack[0][1]).toEqual(["action", { collapsed: true }]);
            expect(stack[1][1]).toEqual(["text", { value: "guitar action" }]);
            expect(stack[2][1]).toBe("settimbre");
            expect(stack[3][1]).toEqual(["voicename", { value: "electronic synth" }]);
            expect(stack[4][1]).toBe("hidden");
            expect(stack[5][1]).toBe("newnote");
            expect(stack[10][1]).toBe("pitch");
            expect(stack[11][1]).toEqual(["notename", { value: "C" }]);
            expect(stack[12][1]).toEqual(["number", { value: 4 }]);
            expect(stack[14][1]).toBe("newnote");
            expect(stack[19][1]).toBe("rest2");
            expect(stack[21][1]).toBe("hidden");
            jest.useRealTimers();
        });
    });

    describe("RhythmRuler - Playback Scheduler and Tone Triggering Engine", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            rhythmRuler.Rulers = [
                [[4, 4], []],
                [[8, 8, 8, 8], []]
            ];
            rhythmRuler.Drums = [null, null];
            rhythmRuler.activity = {
                logo: {
                    synth: {
                        stop: jest.fn(),
                        trigger: jest.fn(),
                        start: jest.fn()
                    },
                    resetSynth: jest.fn()
                }
            };
            rhythmRuler._playing = false;
            rhythmRuler._playingAll = false;
            rhythmRuler._playingOne = false;
            rhythmRuler._offsets = [0, 0];
            rhythmRuler._elapsedTimes = [0, 0];
            rhythmRuler._playAllCell = {};
            rhythmRuler._setButtonIcon = jest.fn();
            rhythmRuler._calculateZebraStripes = jest.fn();
            rhythmRuler._refreshCircularView = jest.fn();
            rhythmRuler._clearWidgetTimers = jest.fn();
            rhythmRuler.__loop = jest.fn();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("playAll starts playback via __resume when not playing", () => {
            rhythmRuler.playAll();

            expect(rhythmRuler._playing).toBe(true);
            expect(rhythmRuler._playingAll).toBe(true);
            expect(rhythmRuler._setButtonIcon).toHaveBeenCalledWith(
                rhythmRuler._playAllCell,
                "pause-button.svg",
                "Pause"
            );
        });

        test("playAll pauses and schedules restart when already playing all", () => {
            rhythmRuler._playing = true;
            rhythmRuler._playingAll = true;
            rhythmRuler._setWidgetTimeout = jest.fn();
            rhythmRuler.__resume = jest.fn();

            rhythmRuler.playAll();

            expect(rhythmRuler._setButtonIcon).toHaveBeenCalledWith(
                rhythmRuler._playAllCell,
                "play-button.svg",
                "Play all"
            );
            expect(rhythmRuler._setWidgetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
            expect(rhythmRuler.__resume).not.toHaveBeenCalled();

            // Trigger the scheduled callback
            const timeoutCb = rhythmRuler._setWidgetTimeout.mock.calls[0][0];
            timeoutCb();
            expect(rhythmRuler.__resume).toHaveBeenCalled();
        });

        test("_playAll initializes starting time and initiates loops for each ruler", () => {
            rhythmRuler._playAll();

            expect(rhythmRuler.activity.logo.synth.stop).toHaveBeenCalled();
            expect(rhythmRuler.activity.logo.resetSynth).toHaveBeenCalledWith(0);
            expect(typeof rhythmRuler._startingTime).toBe("number");
            expect(rhythmRuler.__loop).toHaveBeenCalledTimes(2);
        });

        test("_playOne plays isolated ruler track", () => {
            rhythmRuler._rulerSelected = 0;

            rhythmRuler._playOne();

            expect(rhythmRuler.activity.logo.synth.stop).toHaveBeenCalled();
            expect(typeof rhythmRuler._startingTime).toBe("number");
            expect(rhythmRuler.__loop).toHaveBeenCalledWith(0, 0, 0);
        });
    });

    describe("RhythmRuler - Circular Polyrhythmic View & Canvas Engine", () => {
        let mockCanvas;
        let mockCtx;
        let origCreateElement;

        beforeEach(() => {
            origCreateElement = global.document.createElement;
            mockCtx = {
                clearRect: jest.fn(),
                beginPath: jest.fn(),
                arc: jest.fn(),
                fill: jest.fn(),
                stroke: jest.fn(),
                closePath: jest.fn(),
                moveTo: jest.fn(),
                lineTo: jest.fn(),
                fillText: jest.fn(),
                fillStyle: "",
                strokeStyle: "",
                lineWidth: 1,
                font: "",
                textAlign: "",
                textBaseline: ""
            };

            mockCanvas = {
                width: 400,
                height: 400,
                style: {},
                getContext: jest.fn(() => mockCtx),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                parentNode: {
                    removeChild: jest.fn(),
                    backgroundColor: "#303030"
                },
                getBoundingClientRect: jest.fn(() => ({
                    left: 50,
                    top: 50,
                    width: 400,
                    height: 400
                }))
            };

            rhythmRuler.Rulers = [
                [[4, 4, 4, 4], []],
                [[8, 8, 8, 8, 8, 8, 8, 8], []]
            ];
            rhythmRuler.Drums = [null, null];
            rhythmRuler._circularView = false;
            rhythmRuler._circularCanvas = null;
            rhythmRuler._rhythmRulerTable = { style: {} };
            rhythmRuler.widgetWindow = {
                getWidgetBody: jest.fn(() => ({
                    clientWidth: 400,
                    clientHeight: 400,
                    append: jest.fn()
                }))
            };
            rhythmRuler._calculateZebraStripes = jest.fn();
        });

        afterEach(() => {
            global.document.createElement = origCreateElement;
        });

        test("_toggleCircularView creates canvas and activates circular view", () => {
            rhythmRuler._circularView = true;
            global.document.createElement = jest.fn(() => mockCanvas);

            rhythmRuler._toggleCircularView();

            expect(rhythmRuler._rhythmRulerTable.style.display).toBe("none");
            expect(rhythmRuler._circularCanvas).toBeDefined();
            expect(rhythmRuler._circularCanvas.style.display).toBe("block");
        });

        test("_toggleCircularView restores linear table view when deactivated", () => {
            rhythmRuler._circularView = false;
            rhythmRuler._circularCanvas = mockCanvas;

            rhythmRuler._toggleCircularView();

            expect(mockCanvas.style.display).toBe("none");
            expect(rhythmRuler._rhythmRulerTable.style.display).toBe("");
            expect(rhythmRuler._calculateZebraStripes).toHaveBeenCalled();
        });

        test("_getRingGeometry computes layout metrics with inner hole and gaps", () => {
            const geom = rhythmRuler._getRingGeometry(400, 2);

            expect(geom.innerHoleRadius).toBe(40); // 400 * 0.1
            expect(geom.outerLimit).toBe(188); // 400 * 0.47
            expect(geom.ringGap).toBe(2);
            expect(geom.ringThickness).toBe((148 - 2) / 2);
        });

        test("_getRingGeometry handles single ring geometry without divide-by-zero", () => {
            const geom = rhythmRuler._getRingGeometry(400, 1);

            expect(geom.innerHoleRadius).toBe(40);
            expect(geom.outerLimit).toBe(188);
            expect(geom.ringThickness).toBe(148);
        });

        test("_drawCircularView renders multi-ruler concentric rings to canvas context", () => {
            rhythmRuler._circularCanvas = mockCanvas;

            rhythmRuler._drawCircularView();

            expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 380, 380);
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.arc).toHaveBeenCalled();
            expect(mockCtx.fill).toHaveBeenCalled();
        });

        test("_refreshCircularView skips render when circular canvas is null", () => {
            rhythmRuler._circularCanvas = null;
            expect(() => rhythmRuler._refreshCircularView()).not.toThrow();
        });
    });

    describe("RhythmRuler - Circular Pointer Gesture Engine", () => {
        let mockCanvas;

        beforeEach(() => {
            mockCanvas = {
                width: 400,
                height: 400,
                style: {},
                getContext: jest.fn(() => ({
                    clearRect: jest.fn(),
                    beginPath: jest.fn(),
                    arc: jest.fn(),
                    fill: jest.fn(),
                    stroke: jest.fn(),
                    closePath: jest.fn(),
                    moveTo: jest.fn(),
                    lineTo: jest.fn(),
                    fillText: jest.fn()
                })),
                parentNode: {
                    backgroundColor: "#303030"
                },
                getBoundingClientRect: jest.fn(() => ({
                    left: 0,
                    top: 0,
                    width: 400,
                    height: 400
                }))
            };

            rhythmRuler.Rulers = [
                [[4, 4, 4, 4], []],
                [[8, 8, 8, 8, 8, 8, 8, 8], []]
            ];
            rhythmRuler.Drums = [null, null];
            rhythmRuler._circularCanvas = mockCanvas;
            rhythmRuler._circularDownHit = null;
            rhythmRuler._circularDragTo = null;
            rhythmRuler._playing = false;
            rhythmRuler._dissectNumber = {
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            rhythmRuler.widgetWindow = {
                getWidgetBody: jest.fn(() => ({
                    clientWidth: 400,
                    clientHeight: 400
                }))
            };
        });

        test("_hitTestCircular resolves polar coordinates to exact ruler and cell indices", () => {
            // Point at 12 o'clock in Ring 0 (radius = 100, center = 200,200) -> Ruler 0, Cell 0
            const hitTopRing0 = rhythmRuler._hitTestCircular({ clientX: 200, clientY: 100 });
            expect(hitTopRing0).toEqual({ rulerIndex: 0, cellIndex: 0 });

            // Point at 6 o'clock in Ring 0 (radius = 100, angle = PI) -> Ruler 0, Cell 2
            const hitBottomRing0 = rhythmRuler._hitTestCircular({ clientX: 200, clientY: 300 });
            expect(hitBottomRing0).toEqual({ rulerIndex: 0, cellIndex: 2 });

            // Point at 12 o'clock in Ring 1 (radius = 160, center = 200,200) -> Ruler 1, Cell 0
            const hitTopRing1 = rhythmRuler._hitTestCircular({ clientX: 200, clientY: 40 });
            expect(hitTopRing1).toEqual({ rulerIndex: 1, cellIndex: 0 });
        });

        test("_hitTestCircular returns null when pointer is outside rings", () => {
            const hit = rhythmRuler._hitTestCircular({ clientX: 10, clientY: 10 });
            expect(hit).toBeNull();
        });

        test("_onCircularMouseDown stores down hit position", () => {
            rhythmRuler._hitTestCircular = jest.fn(() => ({ rulerIndex: 0, cellIndex: 2 }));

            rhythmRuler._onCircularMouseDown({ clientX: 200, clientY: 100 });

            expect(rhythmRuler._circularDownHit).toEqual({ rulerIndex: 0, cellIndex: 2 });
            expect(rhythmRuler._circularDragTo).toEqual({ rulerIndex: 0, cellIndex: 2 });
        });

        test("_onCircularMouseMove updates drag destination when pointer crosses cell boundary", () => {
            rhythmRuler._circularDownHit = { rulerIndex: 0, cellIndex: 0 };
            rhythmRuler._circularDragTo = { rulerIndex: 0, cellIndex: 0 };
            rhythmRuler._drawCircularView = jest.fn();
            rhythmRuler._hitTestCircular = jest.fn(() => ({ rulerIndex: 0, cellIndex: 1 }));

            rhythmRuler._onCircularMouseMove({ clientX: 250, clientY: 100 });

            expect(rhythmRuler._circularDragTo).toEqual({ rulerIndex: 0, cellIndex: 1 });
            expect(rhythmRuler._drawCircularView).toHaveBeenCalled();
        });

        test("_onCircularMouseUp performs tie when down and up hit different cells on same ruler", () => {
            rhythmRuler._circularDownHit = { rulerIndex: 0, cellIndex: 0 };
            rhythmRuler._circularDragTo = { rulerIndex: 0, cellIndex: 1 };
            rhythmRuler._hitTestCircular = jest.fn(() => ({ rulerIndex: 0, cellIndex: 1 }));
            rhythmRuler._tieCircular = jest.fn();

            rhythmRuler._onCircularMouseUp({ clientX: 250, clientY: 100 });

            expect(rhythmRuler._tieCircular).toHaveBeenCalledWith(0, 0, 1);
            expect(rhythmRuler._circularDownHit).toBeNull();
        });

        test("_onCircularMouseUp performs single-cell dissection when clicking in place", () => {
            const mockCell = { style: {} };
            rhythmRuler._rulers = [{ cells: [mockCell] }];
            rhythmRuler._circularDownHit = { rulerIndex: 0, cellIndex: 0 };
            rhythmRuler._hitTestCircular = jest.fn(() => ({ rulerIndex: 0, cellIndex: 0 }));
            rhythmRuler._dissectNumber = {
                value: "3",
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            rhythmRuler.__dissectByNumber = jest.fn();
            rhythmRuler.saveDissectHistory = jest.fn();
            rhythmRuler._drawCircularView = jest.fn();

            rhythmRuler._onCircularMouseUp({ clientX: 200, clientY: 100 });

            expect(rhythmRuler.__dissectByNumber).toHaveBeenCalledWith(mockCell, 3, true);
            expect(rhythmRuler.saveDissectHistory).toHaveBeenCalled();
            expect(rhythmRuler._drawCircularView).toHaveBeenCalled();
        });

        test("_tieCircular configures linear tie cells and triggers tie operation", () => {
            const cell1 = { style: {} };
            const cell2 = { style: {} };
            rhythmRuler._rulers = [{ cells: [cell1, cell2] }];
            rhythmRuler.__tie = jest.fn(() => {
                expect(rhythmRuler._mouseDownCell).toBe(cell1);
                expect(rhythmRuler._mouseUpCell).toBe(cell2);
            });
            rhythmRuler.saveDissectHistory = jest.fn();
            rhythmRuler._drawCircularView = jest.fn();

            rhythmRuler._tieCircular(0, 0, 1);

            expect(rhythmRuler._rulerSelected).toBe(0);
            expect(rhythmRuler._mouseDownCell).toBeNull();
            expect(rhythmRuler._mouseUpCell).toBeNull();
            expect(rhythmRuler.__tie).toHaveBeenCalledWith(true);
            expect(rhythmRuler.saveDissectHistory).toHaveBeenCalled();
            expect(rhythmRuler._drawCircularView).toHaveBeenCalled();

            // Reverse slice index order (fromCell > toCell)
            rhythmRuler._tieCircular(0, 1, 0);
            expect(rhythmRuler.__tie).toHaveBeenCalledWith(true);

            // Invalid ruler or missing cells return safely without triggering tie
            rhythmRuler.__tie.mockClear();
            rhythmRuler._tieCircular(99, 0, 1);
            rhythmRuler._tieCircular(0, 0, 99);
            expect(rhythmRuler.__tie).not.toHaveBeenCalled();
        });
    });

    describe("RhythmRuler - Note Width, Display Formatting & Responsive Scaling", () => {
        beforeEach(() => {
            rhythmRuler.widgetWindow = {
                isMaximized: jest.fn(() => false)
            };
            rhythmRuler._fullscreenScaleFactor = 5;
        });

        test("_noteWidth calculates scaled pixel width based on note duration", () => {
            // EIGHTHNOTEWIDTH (24) * (8 / 4) * 3 = 24 * 2 * 3 = 144
            const quarterWidth = rhythmRuler._noteWidth(4);
            expect(quarterWidth).toBe(144);

            // Eighth note: 24 * (8 / 8) * 3 = 72
            const eighthWidth = rhythmRuler._noteWidth(8);
            expect(eighthWidth).toBe(72);
        });

        test("_noteWidth scales using fullscreen factor when window is maximized", () => {
            rhythmRuler.widgetWindow.isMaximized = jest.fn(() => true);

            // 24 * (8 / 4) * 5 = 240
            const maxQuarterWidth = rhythmRuler._noteWidth(4);
            expect(maxQuarterWidth).toBe(240);
        });

        test("__setNoteValueDisplay constructs formatted text nodes inside cell", () => {
            const mockCell = {
                textContent: "",
                appendChild: jest.fn()
            };
            const origCalc = global.calcNoteValueToDisplay;
            global.calcNoteValueToDisplay = jest.fn(() => "1<br>&mdash;<br>4");

            try {
                rhythmRuler.__setNoteValueDisplay(mockCell, 1, 4, "sec");

                expect(global.calcNoteValueToDisplay).toHaveBeenCalledWith(1, 4);
                expect(mockCell.textContent).toBe("");
                expect(mockCell.appendChild).toHaveBeenCalledTimes(6);
                expect(mockCell.appendChild.mock.calls[0][0].textContent).toBe("1");
                expect(mockCell.appendChild.mock.calls[1][0].nodeName).toBe("BR");
                expect(mockCell.appendChild.mock.calls[2][0].textContent).toBe("\u2014");
                expect(mockCell.appendChild.mock.calls[3][0].nodeName).toBe("BR");
                expect(mockCell.appendChild.mock.calls[4][0].textContent).toBe("4");
                expect(mockCell.appendChild.mock.calls[5][0].textContent).toBe(" sec");
            } finally {
                global.calcNoteValueToDisplay = origCalc;
            }
        });
    });

    describe("RhythmRuler - Dissect Click & Tap Event Handling", () => {
        let mockCell;
        let mockRuler;

        beforeEach(() => {
            mockCell = {
                cellIndex: 0,
                style: { width: "100px" },
                parentNode: {
                    getAttribute: jest.fn(() => "0")
                },
                replaceChildren: jest.fn(),
                appendChild: jest.fn()
            };
            mockRuler = {
                cells: [mockCell],
                deleteCell: jest.fn(),
                insertCell: jest.fn().mockImplementation(() => ({
                    style: {},
                    setAttribute: jest.fn(),
                    replaceChildren: jest.fn(),
                    addEventListener: jest.fn(),
                    textContent: ""
                }))
            };

            rhythmRuler._rulers = [mockRuler];
            rhythmRuler.Rulers = [[[4], []]];
            rhythmRuler.Drums = [null];
            rhythmRuler._rulerSelected = 0;
            rhythmRuler._tapMode = false;
            rhythmRuler._tapCell = null;
            rhythmRuler._tapTimes = [];
            rhythmRuler._bpmFactor = 1000;
            rhythmRuler._dissectNumber = {
                value: "4",
                classList: { add: jest.fn(), remove: jest.fn() }
            };
            rhythmRuler.widgetWindow = {
                isMaximized: () => false
            };
            rhythmRuler._calculateZebraStripes = jest.fn();
            rhythmRuler._refreshCircularView = jest.fn();
            rhythmRuler.__addCellEventHandlers = jest.fn();
            rhythmRuler.__setNoteValueDisplay = jest.fn();
            rhythmRuler.__dissectByNumber = jest.fn();
            rhythmRuler.saveDissectHistory = jest.fn();
            rhythmRuler._setWidgetTimeout = jest.fn((cb, time) => cb());
            rhythmRuler._setWidgetInterval = jest.fn(() => 1);
            rhythmRuler._clearWidgetInterval = jest.fn();
            rhythmRuler._setButtonIcon = jest.fn();
            rhythmRuler.activity = {
                turtles: {
                    ithTurtle: () => ({
                        singer: { beatsPerMeasure: 4 }
                    })
                },
                logo: {
                    synth: {
                        trigger: jest.fn()
                    }
                }
            };
        });

        test("_dissectRuler reads dissectNumber input and triggers __dissectByNumber", () => {
            const fakeEvent = { currentTarget: mockCell };

            rhythmRuler._dissectRuler(fakeEvent, "0");

            expect(rhythmRuler.__dissectByNumber).toHaveBeenCalledWith(mockCell, 4, true);
            expect(rhythmRuler.saveDissectHistory).toHaveBeenCalled();
        });

        test("_dissectRuler defaults subdivision count to 2 when input is non-numeric", () => {
            rhythmRuler._dissectNumber.value = "invalid";
            const fakeEvent = { currentTarget: mockCell };

            rhythmRuler._dissectRuler(fakeEvent, "0");

            expect(rhythmRuler.__dissectByNumber).toHaveBeenCalledWith(mockCell, 2, true);
        });

        test("_dissectRuler ignores clicks when playback is active", () => {
            rhythmRuler._playing = true;
            const fakeEvent = { currentTarget: mockCell };

            rhythmRuler._dissectRuler(fakeEvent, "0");

            expect(rhythmRuler.__dissectByNumber).not.toHaveBeenCalled();
        });

        test("_dissectRuler cancels tap mode when clicking on a rest note", () => {
            rhythmRuler._tapMode = true;
            rhythmRuler.Rulers = [[[-4], []]];
            rhythmRuler._tapButton = {};

            const fakeEvent = { currentTarget: mockCell };
            rhythmRuler._dissectRuler(fakeEvent, "0");

            expect(rhythmRuler._tapMode).toBe(false);
            expect(rhythmRuler._tapCell).toBeNull();
            expect(rhythmRuler._setButtonIcon).toHaveBeenCalled();
        });

        test("_dissectRuler schedules count-off and starts tapping for valid note", () => {
            rhythmRuler._tapMode = true;
            rhythmRuler.__startTapping = jest.fn();
            const fakeEvent = { currentTarget: mockCell };

            rhythmRuler._dissectRuler(fakeEvent, "0");

            expect(rhythmRuler._tapCell).toBe(mockCell);
            expect(rhythmRuler.activity.logo.synth.trigger).toHaveBeenCalled();
            expect(rhythmRuler.__startTapping).toHaveBeenCalled();
        });

        test("_dissectRuler appends timestamp on subsequent taps during active tap mode", () => {
            rhythmRuler._tapMode = true;
            rhythmRuler._tapTimes = [1000];
            const fakeEvent = { currentTarget: mockCell };

            rhythmRuler._dissectRuler(fakeEvent, "0");

            expect(rhythmRuler._tapTimes.length).toBe(2);
        });
    });

    describe("RhythmRuler - Visual Zebra Striping & Layout Styling", () => {
        let cellA, cellB;
        let mockRuler;
        let origPlatformColor;
        let origDocById;

        beforeEach(() => {
            origPlatformColor = global.platformColor;
            origDocById = global.docById;
            cellA = { style: {} };
            cellB = { style: {} };
            mockRuler = {
                cells: [cellA, cellB],
                children: [cellA, cellB]
            };

            rhythmRuler._rulers = [mockRuler];
            rhythmRuler._rulerSelected = 0;
            global.platformColor = {
                selectorBackground: "#ffb020",
                selectorSelected: "#ff8000"
            };
        });

        afterEach(() => {
            global.platformColor = origPlatformColor;
            global.docById = origDocById;
        });

        test("_calculateZebraStripes alternates background colors for even ruler", () => {
            rhythmRuler._rulerSelected = 0;

            rhythmRuler._calculateZebraStripes(0);

            expect(cellA.style.backgroundColor).toBe("#ffb020");
            expect(cellB.style.backgroundColor).toBe("#ff8000");
            expect(cellA.style.borderRadius).toBe("10px");
        });

        test("_calculateZebraStripes inverts colors for odd selected ruler", () => {
            rhythmRuler._rulerSelected = 1;

            rhythmRuler._calculateZebraStripes(0);

            expect(cellA.style.backgroundColor).toBe("#ff8000");
            expect(cellB.style.backgroundColor).toBe("#ffb020");
        });

        test("_scale adjusts note widths based on fullscreen scale factor", () => {
            cellA.style.width = "100px";
            cellB.style.width = "100px";

            rhythmRuler._fullscreenScaleFactor = 6;
            rhythmRuler.widgetWindow = {
                isMaximized: () => true,
                getWidgetBody: () => ({
                    getBoundingClientRect: () => ({ width: 1200 })
                })
            };

            rhythmRuler._scale();

            expect(cellA.style.width).toBe("200px"); // 100 * (6 / 3) = 200px
        });

        test("_scale restores original widths when un-maximized", () => {
            cellA.style.width = "200px";
            cellB.style.width = "200px";

            rhythmRuler._fullscreenScaleFactor = 6;
            rhythmRuler.widgetWindow = {
                isMaximized: () => false
            };

            rhythmRuler._scale();

            expect(cellA.style.width).toBe("100px"); // 200 / (6 / 3) = 100px
        });

        test("_positionWheel calculates coordinates and positions wheelDiv", () => {
            const wheelMock = {
                style: { display: "block" }
            };
            global.docById = jest.fn(() => wheelMock);
            rhythmRuler._left = 100;
            rhythmRuler._top = 200;
            rhythmRuler.activity = {
                canvas: { width: 1000, height: 800 }
            };

            rhythmRuler._positionWheel();

            expect(wheelMock.style.position).toBe("absolute");
            expect(wheelMock.style.width).toBe("300px");
            expect(wheelMock.style.height).toBe("300px");
            expect(wheelMock.style.left).toBe("125px");
            expect(wheelMock.style.top).toBe("260px");

            // When top >= 300, wheel positions above the block (top = y - 300)
            rhythmRuler._top = 400;
            rhythmRuler._positionWheel();
            expect(wheelMock.style.top).toBe("100px");
        });

        test("_positionWheel skips positioning when wheelDiv display is none", () => {
            const wheelMock = {
                style: { display: "none" }
            };
            global.docById = jest.fn(() => wheelMock);

            rhythmRuler._positionWheel();

            expect(wheelMock.style.position).toBeUndefined();
        });
    });

    describe("RhythmRuler - UI Controls, Buttons, and AMD Module Interface", () => {
        beforeEach(() => {
            rhythmRuler.Rulers = [
                [
                    [4, 4],
                    ["hist1", "hist2"]
                ]
            ];
            rhythmRuler.Drums = [null];
            rhythmRuler._playAllCell = {};
            rhythmRuler.activity = {
                canvas: { width: 800, height: 600 },
                getStageScale: () => 1,
                logo: {
                    synth: {
                        stop: jest.fn()
                    },
                    resetSynth: jest.fn()
                }
            };
            rhythmRuler._tapButton = {};
            rhythmRuler._setButtonIcon = jest.fn();
            rhythmRuler._refreshCircularView = jest.fn();
        });

        test("_clear resets all active rulers, state flags, and stops synth playback", () => {
            rhythmRuler._playing = true;
            rhythmRuler._playingAll = true;
            rhythmRuler._rulerPlaying = 0;
            rhythmRuler._startingTime = 12345;
            rhythmRuler._undo = jest.fn(() => {
                rhythmRuler.Rulers[0][1].pop();
            });

            rhythmRuler._clear();

            expect(rhythmRuler.activity.logo.synth.stop).toHaveBeenCalled();
            expect(rhythmRuler.activity.logo.resetSynth).toHaveBeenCalledWith(0);
            expect(rhythmRuler._playing).toBe(false);
            expect(rhythmRuler._playingAll).toBe(false);
            expect(rhythmRuler._playingOne).toBe(false);
            expect(rhythmRuler._rulerPlaying).toBe(-1);
            expect(rhythmRuler._startingTime).toBeNull();
            expect(rhythmRuler._setButtonIcon).toHaveBeenCalledWith(
                rhythmRuler._playAllCell,
                "play-button.svg",
                "Play all"
            );
            expect(rhythmRuler._undo).toHaveBeenCalledTimes(2);
            expect(rhythmRuler.Rulers[0][1]).toHaveLength(0);
            expect(rhythmRuler._refreshCircularView).toHaveBeenCalled();
        });

        test("RhythmRuler.dependencies declares AMD dependencies", () => {
            expect(Array.isArray(RhythmRuler.dependencies)).toBe(true);
            expect(RhythmRuler.dependencies).toEqual(["widgets/rhythmruler"]);
        });
    });
});
