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
                clientWidth: 500,
                clientHeight: 400,
                appendChild: jest.fn(),
                append: jest.fn(),
                insertRow: jest.fn().mockReturnValue({
                    setAttribute: jest.fn(),
                    insertCell: jest.fn().mockReturnValue({
                        appendChild: jest.fn(),
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
        insertRow: jest.fn().mockReturnValue({
            setAttribute: jest.fn(),
            insertCell: jest.fn().mockReturnValue({
                style: {},
                appendChild: jest.fn(),
                textContent: "",
                innerHTML: "",
                setAttribute: jest.fn(),
                addEventListener: jest.fn()
            })
        }),
        cells: [],
        insertCell: jest.fn().mockReturnValue({
            style: {},
            appendChild: jest.fn(),
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
            rhythmRuler._playAllCell = { innerHTML: "" };
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
            rhythmRuler._playAllCell = { innerHTML: "" };
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
