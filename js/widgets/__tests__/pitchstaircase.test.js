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

const PitchStaircase = require("../pitchstaircase.js");

// --- Global Mocks ---
global._ = msg => msg;
global.platformColor = {
    labelColor: "#90c100",
    selectorBackground: "#f0f0f0",
    selectorBackgroundHOVER: "#e0e0e0"
};
global.SYNTHSVG = "<svg>SVGWIDTH XSCALE STOKEWIDTH</svg>";
global.DEFAULTVOICE = "electronic synth";
global.frequencyToPitch = jest.fn(f => ["A", "", 4]);
global.base64Encode = jest.fn(s => s);
global.PREVIEWVOLUME = 0.5;
global.normalizeNoteAccidentals = jest.fn(n => n);

window.innerWidth = 1200;
window.btoa = jest.fn(s => s);
window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        addButton: jest.fn().mockReturnValue({ onclick: null }),
        addInputButton: jest.fn().mockReturnValue({
            value: "3",
            addEventListener: jest.fn()
        }),
        addDivider: jest.fn(),
        getWidgetBody: jest.fn().mockReturnValue({
            appendChild: jest.fn(),
            append: jest.fn(),
            style: {}
        }),
        sendToCenter: jest.fn(),
        onclose: null,
        onmaximize: null,
        destroy: jest.fn()
    })
};

if (typeof document !== "undefined") {
    jest.spyOn(document, "getElementsByClassName").mockImplementation(() => {
        return [
            {
                style: {}
            }
        ];
    });
}

describe("PitchStaircase Widget", () => {
    let psc;

    beforeEach(() => {
        psc = new PitchStaircase();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // --- Constructor Tests ---
    describe("constructor", () => {
        test("should initialize with empty Stairs", () => {
            expect(psc.Stairs).toEqual([]);
        });

        test("should initialize with empty stairPitchBlocks", () => {
            expect(psc.stairPitchBlocks).toEqual([]);
        });

        test("should initialize with empty _stepTables", () => {
            expect(psc._stepTables).toEqual([]);
        });

        test("should initialize _musicRatio1 as null", () => {
            expect(psc._musicRatio1).toBeNull();
        });

        test("should initialize _musicRatio2 as null", () => {
            expect(psc._musicRatio2).toBeNull();
        });
    });

    // --- Static Constants Tests ---
    describe("static constants", () => {
        test("should have correct BUTTONDIVWIDTH", () => {
            expect(PitchStaircase.BUTTONDIVWIDTH).toBe(476);
        });

        test("should have correct OUTERWINDOWWIDTH", () => {
            expect(PitchStaircase.OUTERWINDOWWIDTH).toBe(685);
        });

        test("should have correct INNERWINDOWWIDTH", () => {
            expect(PitchStaircase.INNERWINDOWWIDTH).toBe(600);
        });

        test("should have correct BUTTONSIZE", () => {
            expect(PitchStaircase.BUTTONSIZE).toBe(53);
        });

        test("should have correct ICONSIZE", () => {
            expect(PitchStaircase.ICONSIZE).toBe(32);
        });

        test("should have correct DEFAULTFREQUENCY", () => {
            expect(PitchStaircase.DEFAULTFREQUENCY).toBe(220.0);
        });
    });

    // --- Stairs Data Tests ---
    describe("stairs data management", () => {
        test("should allow adding stairs", () => {
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs.push(["B", "", 246.94]);
            psc.Stairs.push(["C", "", 261.63]);
            expect(psc.Stairs).toHaveLength(3);
        });

        test("should allow accessing stair properties", () => {
            psc.Stairs.push(["A", "", 220.0]);
            expect(psc.Stairs[0][0]).toBe("A");
            expect(psc.Stairs[0][1]).toBe("");
            expect(psc.Stairs[0][2]).toBe(220.0);
        });

        test("should allow removing stairs", () => {
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs.push(["B", "", 246.94]);
            psc.Stairs.splice(0, 1);
            expect(psc.Stairs).toHaveLength(1);
            expect(psc.Stairs[0][0]).toBe("B");
        });

        test("should track stairPitchBlocks", () => {
            psc.stairPitchBlocks.push(10);
            psc.stairPitchBlocks.push(20);
            expect(psc.stairPitchBlocks).toEqual([10, 20]);
        });

        test("should allow clearing stairs", () => {
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs = [];
            expect(psc.Stairs).toHaveLength(0);
        });
    });

    // --- Frequency Tests ---
    describe("frequency handling", () => {
        test("should store frequencies in stairs", () => {
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs.push(["A", "", 440.0]);
            expect(psc.Stairs[0][2]).toBe(220.0);
            expect(psc.Stairs[1][2]).toBe(440.0);
        });

        test("should maintain frequency order when sorted", () => {
            psc.Stairs.push(["C", "", 261.63]);
            psc.Stairs.push(["A", "", 220.0]);
            psc.Stairs.sort((a, b) => a[2] - b[2]);
            expect(psc.Stairs[0][2]).toBe(220.0);
            expect(psc.Stairs[1][2]).toBe(261.63);
        });
    });

    // --- _get_save_lock Tests ---
    describe("_get_save_lock", () => {
        test("returns current save lock state", () => {
            psc._save_lock = false;
            expect(psc._get_save_lock()).toBe(false);
            psc._save_lock = true;
            expect(psc._get_save_lock()).toBe(true);
        });

        test("returns undefined when _save_lock is not set", () => {
            expect(psc._get_save_lock()).toBeUndefined();
        });
    });

    // --- _undo Tests ---
    describe("_undo", () => {
        test("returns false when history is empty", () => {
            psc._history = [];
            psc._makeStairs = jest.fn();
            expect(psc._undo()).toBe(false);
        });

        test("removes the last added stair and returns true", () => {
            psc.Stairs = [
                ["A", "", 220.0],
                ["B", "", 246.94],
                ["C", "", 261.63]
            ];
            psc._history = [2]; // index 2 was last added
            psc._makeStairs = jest.fn();
            psc._refresh = function () {
                this._makeStairs(true);
            };

            const result = psc._undo();
            expect(result).toBe(true);
            expect(psc.Stairs).toHaveLength(2);
            expect(psc.Stairs[0][0]).toBe("A");
            expect(psc.Stairs[1][0]).toBe("B");
        });

        test("handles multiple undos sequentially", () => {
            psc.Stairs = [
                ["A", "", 220.0],
                ["B", "", 246.94],
                ["C", "", 261.63]
            ];
            psc._history = [1, 2];
            psc._makeStairs = jest.fn();
            psc._refresh = function () {
                this._makeStairs(true);
            };

            psc._undo();
            expect(psc.Stairs).toHaveLength(2);
            psc._undo();
            expect(psc.Stairs).toHaveLength(1);
            expect(psc.Stairs[0][0]).toBe("A");
        });

        test("returns false after all undos are exhausted", () => {
            psc.Stairs = [["A", "", 220.0]];
            psc._history = [0];
            psc._makeStairs = jest.fn();
            psc._refresh = function () {
                this._makeStairs(true);
            };

            expect(psc._undo()).toBe(true);
            expect(psc._undo()).toBe(false);
        });
    });

    // --- _refresh Tests ---
    describe("_refresh", () => {
        test("calls _makeStairs with true", () => {
            psc._makeStairs = jest.fn();
            psc._refresh();
            expect(psc._makeStairs).toHaveBeenCalledWith(true);
        });
    });

    // --- init and close behavior Tests ---
    describe("init and close behavior", () => {
        let mockActivity;

        beforeEach(() => {
            mockActivity = {
                logo: {
                    synth: {
                        setMasterVolume: jest.fn(),
                        stop: jest.fn()
                    }
                },
                textMsg: jest.fn(),
                palettes: {
                    dict: {}
                }
            };
        });

        test("should set master volume to PREVIEWVOLUME and clear/show widget window on init", () => {
            psc.init(mockActivity);

            expect(mockActivity.logo.synth.setMasterVolume).toHaveBeenCalledWith(
                global.PREVIEWVOLUME
            );
            expect(psc.closed).toBe(false);
            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                psc,
                "pitch staircase",
                "pitch staircase",
                true
            );
        });

        test("should stop synth, set closed to true, and restore master volume to PREVIEWVOLUME on close", () => {
            psc.init(mockActivity);

            const widgetWindow = window.widgetWindows.windowFor();
            expect(widgetWindow.onclose).toBeDefined();

            // Clear calls from init
            mockActivity.logo.synth.setMasterVolume.mockClear();

            widgetWindow.onclose();

            expect(mockActivity.logo.synth.stop).toHaveBeenCalled();
            expect(mockActivity.logo.synth.setMasterVolume).toHaveBeenCalledWith(
                global.PREVIEWVOLUME
            );
            expect(psc.closed).toBe(true);
            expect(widgetWindow.destroy).toHaveBeenCalled();
        });
    });

    // --- _playOne Tests ---
    describe("_playOne", () => {
        test("triggers the synth with the cell frequency and toggles the active class", () => {
            jest.useFakeTimers();

            psc.activity = { logo: { synth: { trigger: jest.fn() } } };
            const stepCell = {
                classList: { add: jest.fn(), remove: jest.fn() },
                getAttribute: jest.fn(() => "220")
            };

            psc._playOne(stepCell);

            expect(stepCell.classList.add).toHaveBeenCalledWith("active");
            expect(psc.activity.logo.synth.trigger).toHaveBeenCalledWith(
                0,
                220,
                1,
                global.DEFAULTVOICE,
                null,
                null
            );

            expect(stepCell.classList.remove).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1000);
            expect(stepCell.classList.remove).toHaveBeenCalledWith("active");

            jest.useRealTimers();
        });
    });

    // --- _playAll Tests ---
    describe("_playAll", () => {
        const makeStepCell = () => ({ classList: { add: jest.fn(), remove: jest.fn() } });

        test("triggers every stair note and clears the active class after the timeout", () => {
            jest.useFakeTimers();

            psc.Stairs = [
                ["A", "", 220.0],
                ["B", "", 246.94]
            ];
            const cells = [makeStepCell(), makeStepCell()];
            psc._stepTables = cells.map(cell => ({ rows: [{ cells: [null, cell] }] }));
            psc.activity = { logo: { synth: { trigger: jest.fn() } } };

            psc._playAll();

            expect(global.normalizeNoteAccidentals).toHaveBeenCalledTimes(2);
            expect(psc.activity.logo.synth.trigger).toHaveBeenCalledTimes(2);
            cells.forEach(cell => expect(cell.classList.add).toHaveBeenCalledWith("active"));

            jest.advanceTimersByTime(1000);
            cells.forEach(cell => expect(cell.classList.remove).toHaveBeenCalledWith("active"));

            jest.useRealTimers();
        });
    });

    // --- playUpAndDown Tests ---
    describe("playUpAndDown", () => {
        test("plays the last stair then walks downward via _playNext", () => {
            psc.Stairs = [
                ["A", "", 220.0],
                ["B", "", 246.94],
                ["C", "", 261.63]
            ];
            const lastCell = { classList: { add: jest.fn(), remove: jest.fn() } };
            psc._stepTables = [
                { rows: [{ cells: [null, {}] }] },
                { rows: [{ cells: [null, {}] }] },
                { rows: [{ cells: [null, lastCell] }] }
            ];
            psc.activity = { logo: { synth: { trigger: jest.fn() } } };
            psc._playNext = jest.fn();

            psc.playUpAndDown();

            expect(lastCell.classList.add).toHaveBeenCalledWith("active");
            expect(psc.activity.logo.synth.trigger).toHaveBeenCalled();
            expect(psc._playNext).toHaveBeenCalledWith(1, -1);
        });
    });

    // --- _dissectStair Tests ---
    describe("_dissectStair", () => {
        const makeEvent = id => ({ target: { getAttribute: jest.fn(() => String(id)) } });

        beforeEach(() => {
            psc._musicRatio1 = { value: "3" };
            psc._musicRatio2 = { value: "2" };
            psc._history = [];
            psc._makeStairs = jest.fn();
        });

        test("returns early without rebuilding when the frequency is not a known stair", () => {
            psc.Stairs = [["A", "", 220.0, 1, 1, 220.0, 4]];

            psc._dissectStair(makeEvent(999));

            expect(psc.Stairs).toHaveLength(1);
            expect(psc._makeStairs).not.toHaveBeenCalled();
        });

        test("inserts a new lower-frequency step and rebuilds the staircase", () => {
            psc.Stairs = [["A", "", 220.0, 1, 1, 220.0, 4]];

            psc._dissectStair(makeEvent(220));

            expect(psc.Stairs).toHaveLength(2);
            expect(psc.Stairs[0][2]).toBeCloseTo(330);
            expect(psc._history).toContain(0);
            expect(psc._makeStairs).toHaveBeenCalled();
        });

        test("sanitises invalid ratio inputs to their defaults", () => {
            psc._musicRatio1 = { value: "not-a-number" };
            psc._musicRatio2 = { value: "-5" };
            psc.Stairs = [["A", "", 220.0, 1, 1, 220.0, 4]];

            psc._dissectStair(makeEvent(220));

            expect(psc._musicRatio1.value).toBe(3);
            expect(psc._musicRatio2.value).toBe(2);
        });

        test("replaces an existing step when the computed frequency already exists", () => {
            psc.Stairs = [
                ["A", "", 330.0, 1, 1, 330.0, 4],
                ["A", "", 220.0, 1, 1, 220.0, 4]
            ];

            psc._dissectStair(makeEvent(220));

            expect(psc.Stairs).toHaveLength(2);
            expect(psc._makeStairs).toHaveBeenCalled();
        });
    });

    // --- _makeStairs Tests ---
    describe("_makeStairs", () => {
        test("renders a row and step table for each stair using the real DOM", () => {
            psc._pscTable = document.createElement("table");
            psc._cellScale = 1;
            psc._stepTables = [];
            psc.Stairs = [
                ["A", "", 220.0, 1, 1, 220.0, 4],
                ["B", "", 246.94, 1, 1, 246.94, 4]
            ];

            psc._makeStairs();

            expect(psc._stepTables).toHaveLength(2);
            expect(psc._pscTable.rows).toHaveLength(2);
            expect(psc._stepTables[0].rows[0].cells.length).toBe(2);
        });

        test("wires a click handler on the step cell that dissects the stair", () => {
            psc._pscTable = document.createElement("table");
            psc._cellScale = 1;
            psc._stepTables = [];
            psc.Stairs = [["A", "", 220.0, 1, 1, 220.0, 4]];
            psc._dissectStair = jest.fn();

            psc._makeStairs();

            const stepCell = psc._stepTables[0].rows[0].cells[1];
            stepCell.dispatchEvent(new window.Event("click"));
            expect(psc._dissectStair).toHaveBeenCalled();
        });
    });

    // --- _save Tests ---
    describe("_save", () => {
        let mockActivity;

        beforeEach(() => {
            mockActivity = {
                palettes: { dict: { foo: { hideMenu: jest.fn() } } },
                refreshCanvas: jest.fn(),
                blocks: { loadNewBlocks: jest.fn() },
                textMsg: jest.fn()
            };
            psc.activity = mockActivity;
            global.activity = { textMsg: jest.fn() };
        });

        afterEach(() => {
            delete global.activity;
        });

        test("hides palettes, refreshes the canvas, and loads a generated block stack", () => {
            psc.Stairs = [["A", "", 220.0, 1, 1, 220.0, 4]];

            psc._save();

            expect(mockActivity.palettes.dict.foo.hideMenu).toHaveBeenCalledWith(true);
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
            expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalledWith(expect.any(Array));
            expect(global.activity.textMsg).toHaveBeenCalled();
        });

        test("emits a pitch block when the pitch has zero cents", () => {
            global.frequencyToPitch.mockReturnValueOnce(["A", "", 0]);
            psc.Stairs = [["A", "", 220.0, 1, 1, 220.0, 4]];

            psc._save();

            const stack = mockActivity.blocks.loadNewBlocks.mock.calls[0][0];
            expect(stack.some(block => block[1] === "pitch")).toBe(true);
        });

        test("emits a hertz block when the pitch has non-zero cents", () => {
            psc.Stairs = [["A", "", 220.0, 1, 1, 220.0, 4]];

            psc._save();

            const stack = mockActivity.blocks.loadNewBlocks.mock.calls[0][0];
            expect(stack.some(block => block[1] === "hertz")).toBe(true);
        });
    });

    // --- init button handlers Tests ---
    describe("init button handlers", () => {
        let mockActivity;
        let buttons;
        let widgetWindow;
        let wfbElement;

        beforeEach(() => {
            buttons = {};
            widgetWindow = {
                clear: jest.fn(),
                show: jest.fn(),
                addButton: jest.fn((icon, size, label) => {
                    const button = { onclick: null };
                    buttons[label] = button;
                    return button;
                }),
                addInputButton: jest.fn(value => ({ value, addEventListener: jest.fn() })),
                addDivider: jest.fn(),
                getWidgetBody: jest.fn(() => ({ append: jest.fn(), style: {} })),
                destroy: jest.fn(),
                onclose: null,
                onmaximize: null,
                _maximized: false
            };
            window.widgetWindows.windowFor = jest.fn(() => widgetWindow);

            wfbElement = { style: {} };
            document.getElementsByClassName.mockReturnValue([wfbElement]);

            mockActivity = {
                logo: { synth: { setMasterVolume: jest.fn(), stop: jest.fn() } },
                textMsg: jest.fn(),
                palettes: { dict: {} }
            };

            psc.init(mockActivity);
        });

        test("Play chord button plays all stairs", () => {
            psc._playAll = jest.fn();
            buttons["Play chord"].onclick();
            expect(psc._playAll).toHaveBeenCalled();
        });

        test("Play scale button plays up and down", () => {
            psc.playUpAndDown = jest.fn();
            buttons["Play scale"].onclick();
            expect(psc.playUpAndDown).toHaveBeenCalled();
        });

        test("Undo button removes the last stair", () => {
            psc._undo = jest.fn();
            buttons["Undo"].onclick();
            expect(psc._undo).toHaveBeenCalled();
        });

        test("Clear button repeatedly undoes until exhausted", () => {
            psc._undo = jest
                .fn()
                .mockReturnValueOnce(true)
                .mockReturnValueOnce(true)
                .mockReturnValue(false);
            buttons["Clear"].onclick();
            expect(psc._undo).toHaveBeenCalledTimes(3);
        });

        test("Save button saves once and holds a debounce lock", () => {
            jest.useFakeTimers();
            psc._save = jest.fn();

            buttons["Save"].onclick();
            expect(psc._save).toHaveBeenCalledTimes(1);
            expect(psc._save_lock).toBe(true);

            buttons["Save"].onclick();
            expect(psc._save).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(1000);
            expect(psc._save_lock).toBe(false);

            jest.useRealTimers();
        });

        test("onmaximize grows the widget body when maximized", () => {
            widgetWindow._maximized = true;
            widgetWindow.onmaximize();
            expect(wfbElement.style.maxHeight).toBe(16 * PitchStaircase.BUTTONSIZE + "px");

            widgetWindow._maximized = false;
            widgetWindow.onmaximize();
            expect(wfbElement.style.maxHeight).toBe(10 * PitchStaircase.BUTTONSIZE + "px");
        });
    });

    // --- _playNext closed guard Tests ---
    describe("_playNext closed guard", () => {
        test("should not trigger synth when closed is true inside _playNext setTimeout", () => {
            jest.useFakeTimers();

            // Set up stairs and stepTables so we don't throw TypeError when accessing them
            psc.Stairs = [["A", "", 220.0]];
            const mockCell = { classList: { add: jest.fn(), remove: jest.fn() } };
            const mockRow = { cells: [null, mockCell] };
            psc._stepTables = [{ rows: [mockRow] }];

            psc.activity = {
                logo: {
                    synth: {
                        trigger: jest.fn()
                    }
                }
            };

            // Call _playNext with index 0 and next 1
            psc.closed = false;
            psc._playNext(0, 1);

            // Now close the widget before the timeout fires
            psc.closed = true;

            // Fast-forward time so the setTimeout callback runs
            jest.advanceTimersByTime(1000);

            // Assert trigger was not called
            expect(psc.activity.logo.synth.trigger).not.toHaveBeenCalled();

            jest.useRealTimers();
        });

        test("should trigger synth when closed is false inside _playNext setTimeout", () => {
            jest.useFakeTimers();

            psc.Stairs = [["A", "", 220.0]];
            const mockCell = { classList: { add: jest.fn(), remove: jest.fn() } };
            const mockRow = { cells: [null, mockCell] };
            psc._stepTables = [{ rows: [mockRow] }];

            psc.activity = {
                logo: {
                    synth: {
                        trigger: jest.fn()
                    }
                }
            };

            psc.closed = false;
            psc._playNext(0, 1);

            jest.advanceTimersByTime(1000);

            expect(psc.activity.logo.synth.trigger).toHaveBeenCalled();

            jest.useRealTimers();
        });
    });
});
