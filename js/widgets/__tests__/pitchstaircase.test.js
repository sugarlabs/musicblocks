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
global.Singer = { masterVolume: [50] };
global.last = arr => arr[arr.length - 1];

window.innerWidth = 1200;
window.btoa = jest.fn(s => s);
window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        addButton: jest.fn().mockImplementation(() => {
            return {
                onclick: null,
                replaceChildren: jest.fn(),
                classList: {
                    contains: jest.fn().mockReturnValue(false)
                }
            };
        }),
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

        test("should stop synth, set closed to true, and restore project master volume on close", () => {
            psc.init(mockActivity);

            const widgetWindow = window.widgetWindows.windowFor();
            expect(widgetWindow.onclose).toBeDefined();

            // Clear calls from init
            mockActivity.logo.synth.setMasterVolume.mockClear();

            widgetWindow.onclose();

            expect(mockActivity.logo.synth.stop).toHaveBeenCalled();
            expect(mockActivity.logo.synth.setMasterVolume).toHaveBeenCalledWith(
                global.Singer.masterVolume[global.Singer.masterVolume.length - 1]
            );
            expect(psc.closed).toBe(true);
            expect(widgetWindow.destroy).toHaveBeenCalled();
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

    describe("play buttons visual feedback and toggling stop", () => {
        let mockPlayCell;
        let mockStepCell;
        let mockSynth;

        beforeEach(() => {
            jest.useFakeTimers();
            jest.clearAllTimers();

            mockPlayCell = {
                getAttribute: jest.fn().mockReturnValue("0"),
                replaceChildren: jest.fn(),
                classList: {
                    contains: jest.fn().mockImplementation(cls => cls === "pitch-staircase-btn")
                }
            };

            mockStepCell = {
                classList: {
                    add: jest.fn(),
                    remove: jest.fn()
                },
                getAttribute: jest.fn().mockReturnValue("220.0"),
                style: {}
            };

            mockSynth = {
                trigger: jest.fn(),
                stop: jest.fn(),
                setMasterVolume: jest.fn()
            };

            psc.activity = {
                logo: {
                    synth: mockSynth
                }
            };
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("_playOne should change row icon to stop and then back to play", () => {
            psc._playOne(mockStepCell, mockPlayCell);

            // Verify icon changed to stop-button.svg
            expect(mockPlayCell.replaceChildren).toHaveBeenCalled();
            let img1 = mockPlayCell.replaceChildren.mock.calls[0][1];
            expect(img1.getAttribute("src")).toBe("header-icons/stop-button.svg");
            expect(psc._playingRowIndex).toBe(0);

            // Advance timers by 1000ms
            jest.advanceTimersByTime(1000);

            // Verify icon changed back to play-button.svg
            let img2 = mockPlayCell.replaceChildren.mock.calls[1][1];
            expect(img2.getAttribute("src")).toBe("header-icons/play-button.svg");
            expect(psc._playingRowIndex).toBeNull();
        });

        test("row click mid-play should stop row and synth", () => {
            // First click plays
            psc.Stairs = [["A", "", 220.0]];
            psc._stepTables = [{ rows: [{ cells: [null, mockStepCell] }] }];

            // Re-bind onclick handler mock logic in init or manually as in _makeStairs
            const playCellClick = () => {
                const i = Number(mockPlayCell.getAttribute("id"));
                const stepCell = psc._stepTables[i].rows[0].cells[1];
                if (psc._playingRowIndex === i) {
                    clearTimeout(psc._rowStopTimeout);
                    stepCell.classList.remove("active");
                    stepCell.style.backgroundColor = platformColor.selectorBackground;
                    psc._setButtonIcon(mockPlayCell, "play-button.svg", _("Play"));
                    psc.activity.logo.synth.stop();
                    psc._playingRowIndex = null;
                } else {
                    psc._playOne(stepCell, mockPlayCell);
                }
            };

            // Play the row
            playCellClick();
            expect(mockSynth.trigger).toHaveBeenCalled();
            expect(psc._playingRowIndex).toBe(0);

            // Click again to stop
            mockPlayCell.replaceChildren.mockClear();
            playCellClick();

            expect(mockSynth.stop).toHaveBeenCalled();
            expect(psc._playingRowIndex).toBeNull();
            let img = mockPlayCell.replaceChildren.mock.calls[0][1];
            expect(img.getAttribute("src")).toBe("header-icons/play-button.svg");
        });

        test("_playAll and header button click mid-play should play and stop", () => {
            psc.Stairs = [["A", "", 220.0]];
            psc._stepTables = [{ rows: [{ cells: [null, mockStepCell] }] }];

            const mockHeaderButton = {
                replaceChildren: jest.fn(),
                classList: {
                    contains: jest.fn().mockReturnValue(false)
                }
            };
            psc._playAllButton = mockHeaderButton;

            const playAllClick = () => {
                if (psc._isPlayingAll) {
                    clearTimeout(psc._playAllTimeout);
                    for (let i = 0; i < psc.Stairs.length; i++) {
                        const stepCell = psc._stepTables[i].rows[0].cells[1];
                        stepCell.classList.remove("active");
                    }
                    psc._setButtonIcon(psc._playAllButton, "play-chord.svg", _("Play chord"));
                    psc.activity.logo.synth.stop();
                    psc._isPlayingAll = false;
                } else {
                    psc._playAll();
                }
            };

            // Start playing chord
            playAllClick();
            expect(mockSynth.trigger).toHaveBeenCalled();
            expect(psc._isPlayingAll).toBe(true);
            let img1 = mockHeaderButton.replaceChildren.mock.calls[0][0];
            expect(img1.getAttribute("src")).toBe("header-icons/stop-button.svg");

            // Stop playing chord
            mockHeaderButton.replaceChildren.mockClear();
            playAllClick();
            expect(mockSynth.stop).toHaveBeenCalled();
            expect(psc._isPlayingAll).toBe(false);
            let img2 = mockHeaderButton.replaceChildren.mock.calls[0][0];
            expect(img2.getAttribute("src")).toBe("header-icons/play-chord.svg");
        });

        test("playUpAndDown and header button click mid-play should play and stop scale", () => {
            psc.Stairs = [
                ["A", "", 220.0],
                ["B", "", 240.0]
            ];
            const mockRowA = { cells: [null, mockStepCell] };
            const mockRowB = { cells: [null, mockStepCell] };
            psc._stepTables = [{ rows: [mockRowA] }, { rows: [mockRowB] }];

            const mockHeaderButton = {
                replaceChildren: jest.fn(),
                classList: {
                    contains: jest.fn().mockReturnValue(false)
                }
            };
            psc._playScaleButton = mockHeaderButton;

            const playScaleClick = () => {
                if (psc._isPlayingScale) {
                    psc._scaleStopped = true;
                    clearTimeout(psc._scaleTimeout);
                    for (let i = 0; i < psc.Stairs.length; i++) {
                        const stepCell = psc._stepTables[i].rows[0].cells[1];
                        stepCell.classList.remove("active");
                    }
                    psc._setButtonIcon(psc._playScaleButton, "play-scale.svg", _("Play scale"));
                    psc.activity.logo.synth.stop();
                    psc._isPlayingScale = false;
                } else {
                    psc.playUpAndDown();
                }
            };

            // Start playing scale
            playScaleClick();
            expect(mockSynth.trigger).toHaveBeenCalled();
            expect(psc._isPlayingScale).toBe(true);
            let img1 = mockHeaderButton.replaceChildren.mock.calls[0][0];
            expect(img1.getAttribute("src")).toBe("header-icons/stop-button.svg");

            // Stop playing scale
            mockHeaderButton.replaceChildren.mockClear();
            playScaleClick();
            expect(mockSynth.stop).toHaveBeenCalled();
            expect(psc._isPlayingScale).toBe(false);
            expect(psc._scaleStopped).toBe(true);
            let img2 = mockHeaderButton.replaceChildren.mock.calls[0][0];
            expect(img2.getAttribute("src")).toBe("header-icons/play-scale.svg");
        });

        test("init should register and allow toggling play/stop on playAll and playScale buttons", () => {
            psc.Stairs = [["A", "", 220.0]];

            psc.init({
                logo: {
                    synth: mockSynth
                },
                textMsg: jest.fn(),
                palettes: {
                    dict: {}
                }
            });

            // 1. Play All Button
            expect(psc._playAllButton.onclick).toBeDefined();
            // Start playing all
            psc._playAllButton.onclick();
            expect(mockSynth.trigger).toHaveBeenCalled();
            expect(psc._isPlayingAll).toBe(true);
            expect(psc._playAllButton.replaceChildren).toHaveBeenCalled();

            // Stop playing all
            mockSynth.stop.mockClear();
            psc._playAllButton.onclick();
            expect(mockSynth.stop).toHaveBeenCalled();
            expect(psc._isPlayingAll).toBe(false);

            // 2. Play Scale Button
            expect(psc._playScaleButton.onclick).toBeDefined();
            // Start playing scale
            psc._playScaleButton.onclick();
            expect(psc._isPlayingScale).toBe(true);

            // Stop playing scale
            mockSynth.stop.mockClear();
            psc._playScaleButton.onclick();
            expect(mockSynth.stop).toHaveBeenCalled();
            expect(psc._isPlayingScale).toBe(false);
            expect(psc._scaleStopped).toBe(true);
        });

        test("init should register and allow toggling play/stop on row play button", () => {
            psc.Stairs = [["A", "", 220.0]];

            psc.init({
                logo: {
                    synth: mockSynth
                },
                textMsg: jest.fn(),
                palettes: {
                    dict: {}
                }
            });

            const playCell = psc._stepTables[0].rows[0].cells[0];
            const stepCell = psc._stepTables[0].rows[0].cells[1];
            expect(playCell.onclick).toBeDefined();

            // Mock getAttribute to prevent returning null in tests
            playCell.setAttribute("id", "0");
            stepCell.setAttribute("id", "220.0");

            // Mock replaceChildren on cell
            playCell.replaceChildren = jest.fn();

            // Start playing row
            playCell.onclick();
            expect(mockSynth.trigger).toHaveBeenCalled();
            expect(psc._playingRowIndex).toBe(0);

            // Stop playing row
            mockSynth.stop.mockClear();
            playCell.onclick();
            expect(mockSynth.stop).toHaveBeenCalled();
            expect(psc._playingRowIndex).toBeNull();
        });

        test("_playAll should terminate naturally after 1000ms", () => {
            psc.Stairs = [["A", "", 220.0]];
            psc._stepTables = [{ rows: [{ cells: [null, mockStepCell] }] }];
            psc._playAllButton = {
                replaceChildren: jest.fn(),
                classList: {
                    contains: jest.fn().mockReturnValue(false)
                }
            };

            psc._playAll();
            expect(psc._isPlayingAll).toBe(true);

            jest.advanceTimersByTime(1000);
            expect(psc._isPlayingAll).toBe(false);
        });

        test("playUpAndDown should play full scale down then up and terminate naturally", () => {
            psc.Stairs = [
                ["A", "", 220.0],
                ["B", "", 240.0]
            ];
            const mockRowA = { cells: [null, mockStepCell] };
            const mockRowB = { cells: [null, mockStepCell] };
            psc._stepTables = [{ rows: [mockRowA] }, { rows: [mockRowB] }];

            psc._playScaleButton = {
                replaceChildren: jest.fn(),
                classList: {
                    contains: jest.fn().mockReturnValue(false)
                }
            };

            // Start playing scale
            psc.playUpAndDown();
            expect(mockSynth.trigger).toHaveBeenCalledTimes(1);
            expect(psc._isPlayingScale).toBe(true);

            // 1. First step timeout (t3) to play index 0 (going down)
            jest.advanceTimersByTime(1000);
            expect(mockSynth.trigger).toHaveBeenCalledTimes(2);

            // 2. Next timeout (t3) will trigger index -1
            jest.advanceTimersByTime(1000);

            // t1 schedules highlights cleanup in 1000ms, t2 schedules _playNext(0, 1) in 200ms
            jest.advanceTimersByTime(200); // Trigger t2: _playNext(0, 1) going up
            expect(mockSynth.trigger).toHaveBeenCalledTimes(3);

            // _playNext(0, 1) schedules t3 in 1000ms
            jest.advanceTimersByTime(1000); // Trigger t3: plays index 1 going up
            expect(mockSynth.trigger).toHaveBeenCalledTimes(4);

            // _playNext(1, 1) schedules t3 in 1000ms (to index === 2 boundary)
            jest.advanceTimersByTime(1000);

            // Terminate in 1000ms
            jest.advanceTimersByTime(1000); // Trigger termination timeout

            expect(psc._isPlayingScale).toBe(false);
            let img = psc._playScaleButton.replaceChildren.mock.calls[1][0];
            expect(img.getAttribute("src")).toBe("header-icons/play-scale.svg");
        });

        test("_setButtonIcon should handle invalid or mock cells gracefully", () => {
            psc._setButtonIcon(null, "play-button.svg", "Play");
            psc._setButtonIcon({}, "play-button.svg", "Play");
        });
    });
});
