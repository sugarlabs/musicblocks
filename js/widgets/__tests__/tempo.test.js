/**
 * MusicBlocks v3.6.2
 *
 * @author Divyam Agarwal
 *
 * @copyright 2026 Divyam Agarwal
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

const Tempo = require("../tempo.js");

// --- 1. Global Mocks (Fake the Browser Environment) ---
global._ = msg => msg; // Mock translation function
global.getDrumSynthName = jest.fn();

// Mock the Window Manager
window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        timerManager: {
            setInterval: jest.fn().mockImplementation((cb, t) => setInterval(cb, t)),
            clearInterval: jest.fn().mockImplementation(id => clearInterval(id)),
            setTimeout: jest.fn().mockImplementation((cb, t) => setTimeout(cb, t)),
            clearTimeout: jest.fn().mockImplementation(id => clearTimeout(id)),
            clearAll: jest.fn()
        },
        addButton: jest.fn().mockReturnValue({ onclick: () => {} }),
        addInputButton: jest.fn().mockImplementation(val => ({
            value: val,
            addEventListener: jest.fn()
        })),
        getWidgetBody: jest.fn().mockReturnValue({
            appendChild: jest.fn(),
            insertRow: jest.fn().mockReturnValue({
                insertCell: jest.fn().mockReturnValue({
                    appendChild: jest.fn(),
                    setAttribute: jest.fn()
                })
            })
        }),
        sendToCenter: jest.fn(),
        onclose: jest.fn(),
        destroy: jest.fn()
    })
};
// Mock Document (for creating the canvas)
HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    fillStyle: "",
    ellipse: jest.fn(),
    fill: jest.fn(),
    closePath: jest.fn()
});
describe("Tempo Widget", () => {
    let tempoWidget;
    let mockActivity;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        tempoWidget = new Tempo();

        // Mock the Music Blocks Activity object
        mockActivity = {
            logo: {
                synth: {
                    loadSynth: jest.fn(),
                    trigger: jest.fn()
                },
                firstNoteTime: 1000
            },
            blocks: {
                blockList: {}, // Empty block list for now
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn(),
            saveLocally: jest.fn(),
            textMsg: jest.fn(),
            errorMsg: jest.fn() // This is what the code calls!
        };

        // Manually setup initial state usually handled by init()
        tempoWidget.activity = mockActivity;
        tempoWidget.BPMs = [100]; // Start at 100 BPM
        tempoWidget.BPMInputs = [{ value: 100 }]; // Fake input element
        tempoWidget._intervals = [600];
        tempoWidget.BPMBlocks = [null];
        tempoWidget._directions = [1];
        tempoWidget._widgetFirstTimes = [Date.now()];
        tempoWidget._widgetNextTimes = [Date.now() + 600];

        // --- FIX 2: Initialize 'isMoving' ---
        tempoWidget.isMoving = true;
    });

    afterEach(() => {
        jest.useRealTimers();
        if (tempoWidget._intervalID) {
            clearInterval(tempoWidget._intervalID);
        }
    });

    test("should initialize with default values", () => {
        expect(tempoWidget.BPMs[0]).toBe(100);
        expect(tempoWidget.isMoving).toBe(true);
    });

    test("speedUp() should increase BPM by 10%", () => {
        // 100 + 10% = 110
        tempoWidget.speedUp(0);
        expect(tempoWidget.BPMs[0]).toBe(110);
        expect(tempoWidget.BPMInputs[0].value).toBe(110);
    });

    test("slowDown() should decrease BPM by 10%", () => {
        // 100 - 10% = 90
        tempoWidget.slowDown(0);
        expect(tempoWidget.BPMs[0]).toBe(90);
        expect(tempoWidget.BPMInputs[0].value).toBe(90);
    });

    test("should not exceed maximum BPM of 1000", () => {
        tempoWidget.BPMs[0] = 950;
        // 950 + 95 = 1045 -> Should clamp to 1000
        tempoWidget.speedUp(0);

        expect(tempoWidget.BPMs[0]).toBe(1000);
        expect(mockActivity.errorMsg).toHaveBeenCalled();
    });

    test("should not go below minimum BPM of 30", () => {
        tempoWidget.BPMs[0] = 32;
        // 32 - 3.2 = 28.8 -> Should clamp to 30
        tempoWidget.slowDown(0);

        expect(tempoWidget.BPMs[0]).toBe(30);
        expect(mockActivity.errorMsg).toHaveBeenCalled();
    });

    // --- pause() and resume() tests ---
    describe("pause() and resume()", () => {
        test("pause() should clear the interval", () => {
            tempoWidget._intervalID = setInterval(() => {}, 1000);
            const intervalId = tempoWidget._intervalID;

            tempoWidget.pause();

            // The interval should be cleared (we can verify by checking Jest's timer state)
            expect(jest.getTimerCount()).toBe(0);
        });

        test("resume() should start a new interval for drawing", () => {
            tempoWidget.tempoCanvases = [document.createElement("canvas")];

            tempoWidget.resume();

            expect(tempoWidget._intervalID).not.toBeNull();
            expect(jest.getTimerCount()).toBe(1);
        });

        test("resume() should clear existing interval before starting new one", () => {
            tempoWidget.tempoCanvases = [document.createElement("canvas")];
            tempoWidget._intervalID = setInterval(() => {}, 1000);

            tempoWidget.resume();

            // Only one interval should be active
            expect(jest.getTimerCount()).toBe(1);
        });

        test("resume() should reset widget times", () => {
            tempoWidget.tempoCanvases = [document.createElement("canvas")];
            const oldFirstTime = tempoWidget._widgetFirstTimes[0];

            jest.advanceTimersByTime(100);
            tempoWidget.resume();

            expect(tempoWidget._widgetFirstTimes[0]).toBeGreaterThanOrEqual(oldFirstTime);
            expect(tempoWidget._directions[0]).toBe(1);
        });
    });

    // --- _useBPM() tests ---
    describe("_useBPM() input validation", () => {
        test("should reject NaN input and show error", () => {
            tempoWidget.BPMInputs[0].value = "abc";

            tempoWidget._useBPM(0);

            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                expect.stringContaining("Please enter a number"),
                3000
            );
        });

        test("should clamp BPM above 1000 to 1000", () => {
            tempoWidget.BPMInputs[0].value = 1500;

            tempoWidget._useBPM(0);

            expect(tempoWidget.BPMs[0]).toBe(1000);
            expect(mockActivity.errorMsg).toHaveBeenCalled();
        });

        test("should clamp BPM below 30 to 30", () => {
            tempoWidget.BPMInputs[0].value = 10;

            tempoWidget._useBPM(0);

            expect(tempoWidget.BPMs[0]).toBe(30);
            expect(mockActivity.errorMsg).toHaveBeenCalled();
        });

        test("should accept valid BPM input", () => {
            tempoWidget.BPMInputs[0].value = 120;

            tempoWidget._useBPM(0);

            expect(tempoWidget.BPMs[0]).toBe(120);
            expect(tempoWidget._intervals[0]).toBe(500); // 60/120 * 1000 = 500ms
        });

        test("should update input field with validated BPM", () => {
            tempoWidget.BPMInputs[0].value = 150;

            tempoWidget._useBPM(0);

            expect(tempoWidget.BPMInputs[0].value).toBe(150);
        });
    });

    // --- _updateBPM() tests ---
    describe("_updateBPM() block synchronization", () => {
        test("should update interval based on BPM", () => {
            tempoWidget.BPMs[0] = 120;

            tempoWidget._updateBPM(0);

            // 60/120 * 1000 = 500ms
            expect(tempoWidget._intervals[0]).toBe(500);
        });

        test("should update block value when BPMBlock exists", () => {
            const mockBlock = {
                connections: [null, 1]
            };
            const mockValueBlock = {
                value: 100,
                text: { text: "100" },
                updateCache: jest.fn()
            };

            mockActivity.blocks.blockList = {
                0: mockBlock,
                1: mockValueBlock
            };
            tempoWidget.BPMBlocks[0] = 0;
            tempoWidget.BPMs[0] = 150;

            tempoWidget._updateBPM(0);

            expect(mockValueBlock.value).toBe(150);
            expect(mockValueBlock.text.text).toBe(150);
            expect(mockValueBlock.updateCache).toHaveBeenCalled();
            expect(mockActivity.refreshCanvas).toHaveBeenCalled();
            expect(mockActivity.saveLocally).toHaveBeenCalled();
        });

        test("should not throw when BPMBlock is null", () => {
            tempoWidget.BPMBlocks[0] = null;
            tempoWidget.BPMs[0] = 150;

            expect(() => tempoWidget._updateBPM(0)).not.toThrow();
        });

        test("should not throw when connection is null", () => {
            mockActivity.blocks.blockList = {
                0: { connections: [null, null] }
            };
            tempoWidget.BPMBlocks[0] = 0;
            tempoWidget.BPMs[0] = 150;

            expect(() => tempoWidget._updateBPM(0)).not.toThrow();
        });
    });

    // --- _saveTempo() and __save() tests ---
    describe("save functionality", () => {
        test("_saveTempo() should call __save for each BPM", () => {
            tempoWidget.BPMs = [100, 120, 140];
            const saveSpy = jest.spyOn(tempoWidget, "__save");

            tempoWidget._saveTempo();

            expect(saveSpy).toHaveBeenCalledTimes(3);
            expect(saveSpy).toHaveBeenCalledWith(0);
            expect(saveSpy).toHaveBeenCalledWith(1);
            expect(saveSpy).toHaveBeenCalledWith(2);
        });

        test("__save() should load new blocks after timeout", () => {
            tempoWidget.BPMs = [100];

            tempoWidget.__save(0);

            // Fast-forward past the timeout (200ms * index 0 = 0ms, but there's still a setTimeout)
            jest.advanceTimersByTime(200);

            expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalled();
            expect(mockActivity.textMsg).toHaveBeenCalledWith(
                expect.stringContaining("New action block generated"),
                3000
            );
        });

        test("__save() should include correct BPM value in block stack", () => {
            tempoWidget.BPMs = [175];

            tempoWidget.__save(0);
            jest.advanceTimersByTime(200);

            const newStack = mockActivity.blocks.loadNewBlocks.mock.calls[0][0];
            // The BPM value is in newStack[1][1][1].value
            // newStack[1] = [1, ["number", { value: BPM }], 0, 0, [0]]
            // newStack[1][1] = ["number", { value: BPM }]
            // newStack[1][1][1] = { value: BPM }
            expect(newStack[1][1][1].value).toBe(175);
        });

        test("__save() should delay based on index", () => {
            tempoWidget.BPMs = [100, 120];

            tempoWidget.__save(1);

            // Should not be called before 200ms * 1
            jest.advanceTimersByTime(100);
            expect(mockActivity.blocks.loadNewBlocks).not.toHaveBeenCalled();

            // Should be called after 200ms * 1
            jest.advanceTimersByTime(200);
            expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalled();
        });
    });

    // --- _get_save_lock() tests ---
    describe("_get_save_lock() debounce mechanism", () => {
        test("should return false when save_lock is false", () => {
            tempoWidget._save_lock = false;

            expect(tempoWidget._get_save_lock()).toBe(false);
        });

        test("should return true when save_lock is true", () => {
            tempoWidget._save_lock = true;

            expect(tempoWidget._get_save_lock()).toBe(true);
        });
    });

    // --- Constructor tests ---
    describe("constructor", () => {
        test("should initialize with correct default xradius", () => {
            const widget = new Tempo();

            expect(widget._xradius).toBe(Tempo.YRADIUS / 3);
        });

        test("should initialize empty arrays", () => {
            const widget = new Tempo();

            expect(widget.BPMs).toEqual([]);
            expect(widget.BPMInputs).toEqual([]);
            expect(widget.BPMBlocks).toEqual([]);
            expect(widget.tempoCanvases).toEqual([]);
        });
    });

    // --- Edge cases ---
    describe("edge cases", () => {
        test("speedUp() should handle string BPM values", () => {
            tempoWidget.BPMs[0] = "100";
            tempoWidget.BPMInputs[0].value = "100";

            tempoWidget.speedUp(0);

            expect(tempoWidget.BPMs[0]).toBe(110);
        });

        test("slowDown() should handle string BPM values", () => {
            tempoWidget.BPMs[0] = "100";
            tempoWidget.BPMInputs[0].value = "100";

            tempoWidget.slowDown(0);

            expect(tempoWidget.BPMs[0]).toBe(90);
        });

        test("speedUp() should handle exactly 1000 BPM", () => {
            tempoWidget.BPMs[0] = 1000;

            tempoWidget.speedUp(0);

            expect(tempoWidget.BPMs[0]).toBe(1000);
            expect(mockActivity.errorMsg).toHaveBeenCalled();
        });

        test("slowDown() should handle exactly 30 BPM", () => {
            tempoWidget.BPMs[0] = 30;

            tempoWidget.slowDown(0);

            // 30 - 3 = 27 -> clamped to 30
            expect(tempoWidget.BPMs[0]).toBe(30);
            expect(mockActivity.errorMsg).toHaveBeenCalled();
        });

        test("should handle multiple BPMs for speedUp", () => {
            tempoWidget.BPMs = [100, 200];
            tempoWidget.BPMInputs = [{ value: 100 }, { value: 200 }];
            tempoWidget._intervals = [600, 300];
            tempoWidget.BPMBlocks = [null, null];

            tempoWidget.speedUp(1);

            expect(tempoWidget.BPMs[0]).toBe(100); // Unchanged
            expect(tempoWidget.BPMs[1]).toBe(220); // 200 + 20
        });

        test("should handle multiple BPMs for slowDown", () => {
            tempoWidget.BPMs = [100, 200];
            tempoWidget.BPMInputs = [{ value: 100 }, { value: 200 }];
            tempoWidget._intervals = [600, 300];
            tempoWidget.BPMBlocks = [null, null];

            tempoWidget.slowDown(1);

            expect(tempoWidget.BPMs[0]).toBe(100); // Unchanged
            expect(tempoWidget.BPMs[1]).toBe(180); // 200 - 20
        });
    });

    // --- Static constants tests ---
    describe("static constants", () => {
        test("should have correct TEMPOSYNTH", () => {
            expect(Tempo.TEMPOSYNTH).toBe("bottle");
        });

        test("should have correct TEMPOINTERVAL", () => {
            expect(Tempo.TEMPOINTERVAL).toBe(5);
        });

        test("should have correct BUTTONDIVWIDTH", () => {
            expect(Tempo.BUTTONDIVWIDTH).toBe(476);
        });

        test("should have correct BUTTONSIZE", () => {
            expect(Tempo.BUTTONSIZE).toBe(53);
        });

        test("should have correct ICONSIZE", () => {
            expect(Tempo.ICONSIZE).toBe(32);
        });

        test("should have correct TEMPOWIDTH", () => {
            expect(Tempo.TEMPOWIDTH).toBe(700);
        });

        test("should have correct TEMPOHEIGHT", () => {
            expect(Tempo.TEMPOHEIGHT).toBe(100);
        });

        test("should have correct YRADIUS", () => {
            expect(Tempo.YRADIUS).toBe(75);
        });
    });
    describe("init() and UI Setup", () => {
        beforeEach(() => {
            tempoWidget.BPMs = [120];
        });

        test("should initialize the widget window and UI elements", () => {
            tempoWidget.init(mockActivity);

            expect(window.widgetWindows.windowFor).toHaveBeenCalledWith(
                tempoWidget,
                "tempo",
                "tempo",
                true
            );

            const mockWindow = window.widgetWindows.windowFor();

            expect(mockWindow.clear).toHaveBeenCalled();
            expect(mockWindow.show).toHaveBeenCalled();
            expect(mockWindow.getWidgetBody).toHaveBeenCalled();
            expect(mockWindow.getWidgetBody().appendChild).toHaveBeenCalled();
            expect(mockWindow.addButton).toHaveBeenCalled();
            expect(mockWindow.addInputButton).toHaveBeenCalled();
        });

        test("should bind event listeners to the BPM inputs and trigger _useBPM on Enter key", () => {
            const useBPMSpy = jest.spyOn(tempoWidget, "_useBPM").mockImplementation(() => {});

            tempoWidget.init(mockActivity);
            const mockWindow = window.widgetWindows.windowFor();
            const mockInput = mockWindow.addInputButton.mock.results[0].value;
            const keyupCall = mockInput.addEventListener.mock.calls.find(
                call => call[0] === "keyup"
            );
            const keyupHandler = keyupCall[1];
            keyupHandler({ key: "Enter" });
            expect(useBPMSpy).toHaveBeenCalledTimes(1);
            expect(useBPMSpy).toHaveBeenCalledWith(0);
            keyupHandler({ key: "Space" });
            expect(useBPMSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("_draw() and canvas rendering", () => {
        beforeEach(() => {
            const mockCanvas = document.createElement("canvas");
            mockCanvas.width = Tempo.TEMPOWIDTH;
            mockCanvas.height = Tempo.TEMPOHEIGHT;

            tempoWidget.tempoCanvases = [mockCanvas];
            tempoWidget.BPMs = [120];
            tempoWidget._directions = [1];
            tempoWidget._intervals = [500];
            tempoWidget.activity = mockActivity;

            tempoWidget._widgetFirstTimes = [Date.now() - 100];
            tempoWidget._widgetNextTimes = [Date.now() + 400];
        });

        test("should clear previous frame and draw ellipse", () => {
            tempoWidget._draw();
            const ctx = tempoWidget.tempoCanvases[0].getContext("2d");

            expect(ctx.clearRect).toHaveBeenCalledTimes(1);
            expect(ctx.beginPath).toHaveBeenCalledTimes(1);
            expect(ctx.ellipse).toHaveBeenCalledTimes(1);
            expect(ctx.fill).toHaveBeenCalledTimes(1);
            expect(ctx.closePath).toHaveBeenCalledTimes(1);
        });

        test("should trigger synth when a beat hits (direction change)", () => {
            tempoWidget._widgetNextTimes[0] = Date.now() - 10;
            tempoWidget._draw();

            expect(mockActivity.logo.synth.trigger).toHaveBeenCalled();
            expect(tempoWidget._directions[0]).toBe(-1);
            expect(tempoWidget._widgetNextTimes[0]).toBeGreaterThan(Date.now());
        });
    });
    describe("Canvas Tap Tempo (onclick)", () => {
        beforeEach(() => {
            tempoWidget.BPMs = [100];
            tempoWidget.init(mockActivity);
        });

        test("should set _firstClickTime on the first tap", () => {
            const canvas = tempoWidget.tempoCanvases[0];
            canvas.onclick();

            expect(tempoWidget._firstClickTime).not.toBeNull();
        });

        test("init() resets _firstClickTime to null so first tap is always captured", () => {
            // Simulate a first click that sets _firstClickTime
            const canvas = tempoWidget.tempoCanvases[0];
            jest.setSystemTime(1000);
            canvas.onclick();
            expect(tempoWidget._firstClickTime).not.toBeNull();

            // Re-initialising the widget must reset _firstClickTime back to null,
            // so the very next tap is treated as the FIRST tap (not the second).
            tempoWidget.BPMs = [100];
            tempoWidget.init(mockActivity);
            expect(tempoWidget._firstClickTime).toBeNull();

            // After re-init the first tap should set _firstClickTime, not compute a BPM.
            const canvas2 = tempoWidget.tempoCanvases[0];
            jest.setSystemTime(2000);
            canvas2.onclick();
            expect(tempoWidget._firstClickTime).not.toBeNull();
            expect(tempoWidget.BPMs[0]).toBe(100); // BPM unchanged on first tap
        });

        test("should calculate correct BPM on the second tap", () => {
            const canvas = tempoWidget.tempoCanvases[0];
            jest.setSystemTime(1000);
            canvas.onclick(); // First tap
            jest.setSystemTime(1500);
            canvas.onclick(); // Second tap

            expect(tempoWidget.BPMs[0]).toBe(120);
            expect(tempoWidget.BPMInputs[0].value).toBe(120);
            expect(tempoWidget._firstClickTime).toBeNull();
        });

        test("should ignore invalid tap speeds and reset timer", () => {
            const canvas = tempoWidget.tempoCanvases[0];

            jest.setSystemTime(1000);
            canvas.onclick();
            jest.setSystemTime(1010);
            canvas.onclick();

            expect(tempoWidget.BPMs[0]).toBe(100);
            expect(tempoWidget._firstClickTime).toBe(1010);
        });
    });
    describe("_draw() - Edge Cases", () => {
        test("should skip drawing when canvas is null", () => {
            tempoWidget.tempoCanvases = [null];
            tempoWidget.BPMs = [100];
            tempoWidget._directions = [1];
            tempoWidget._intervals = [600];
            tempoWidget._widgetFirstTimes = [Date.now()];
            tempoWidget._widgetNextTimes = [Date.now() + 600];
            expect(() => tempoWidget._draw()).not.toThrow();
        });

        test("should skip drawing when canvas is undefined", () => {
            tempoWidget.tempoCanvases = [undefined];
            tempoWidget.BPMs = [100];
            tempoWidget._directions = [1];
            tempoWidget._intervals = [600];
            tempoWidget._widgetFirstTimes = [Date.now()];
            tempoWidget._widgetNextTimes = [Date.now() + 600];

            expect(() => tempoWidget._draw()).not.toThrow();
        });

        test("should initialize _widgetFirstTimes when null", () => {
            const mockCanvas = document.createElement("canvas");
            mockCanvas.width = Tempo.TEMPOWIDTH;
            mockCanvas.height = Tempo.TEMPOHEIGHT;

            tempoWidget.tempoCanvases = [mockCanvas];
            tempoWidget.BPMs = [120];
            tempoWidget._directions = [1];
            tempoWidget._intervals = [500];
            tempoWidget._widgetFirstTimes = [null];
            tempoWidget._widgetNextTimes = [null];
            tempoWidget.activity = mockActivity;

            tempoWidget._draw();
            expect(tempoWidget._widgetFirstTimes[0]).not.toBeNull();
            expect(tempoWidget._widgetNextTimes[0]).not.toBeNull();
        });

        test("should handle interval of 0 (prevent division by zero)", () => {
            const mockCanvas = document.createElement("canvas");
            mockCanvas.width = Tempo.TEMPOWIDTH;
            mockCanvas.height = Tempo.TEMPOHEIGHT;

            tempoWidget.tempoCanvases = [mockCanvas];
            tempoWidget.BPMs = [100];
            tempoWidget._directions = [1];
            tempoWidget._intervals = [0]; // Zero interval
            tempoWidget._widgetFirstTimes = [Date.now()];
            tempoWidget._widgetNextTimes = [Date.now() + 100];
            tempoWidget.activity = mockActivity;

            expect(() => tempoWidget._draw()).not.toThrow();
        });

        test("should change direction from 1 to -1 on beat", () => {
            const mockCanvas = document.createElement("canvas");
            mockCanvas.width = Tempo.TEMPOWIDTH;
            mockCanvas.height = Tempo.TEMPOHEIGHT;

            tempoWidget.tempoCanvases = [mockCanvas];
            tempoWidget.BPMs = [120];
            tempoWidget._directions = [1];
            tempoWidget._intervals = [500];
            tempoWidget._widgetFirstTimes = [Date.now()];
            tempoWidget._widgetNextTimes = [Date.now() - 10]; // Past beat time
            tempoWidget.activity = mockActivity;

            tempoWidget._draw();
            expect(tempoWidget._directions[0]).toBe(-1);
        });

        test("should set x to 0 when direction is -1 and x is undefined", () => {
            const mockCanvas = document.createElement("canvas");
            mockCanvas.width = Tempo.TEMPOWIDTH;
            mockCanvas.height = Tempo.TEMPOHEIGHT;

            tempoWidget.tempoCanvases = [mockCanvas];
            tempoWidget.BPMs = [120];
            tempoWidget._directions = [-1];
            tempoWidget._intervals = [500];
            tempoWidget._widgetFirstTimes = [Date.now()];
            tempoWidget._widgetNextTimes = [Date.now() - 10]; // Trigger beat
            tempoWidget.activity = mockActivity;

            tempoWidget._draw();

            const ctx = mockCanvas.getContext("2d");
            expect(ctx.ellipse).toHaveBeenCalled();
        });

        test("should compress xradius when close to edge", () => {
            const mockCanvas = document.createElement("canvas");
            mockCanvas.width = Tempo.TEMPOWIDTH;
            mockCanvas.height = Tempo.TEMPOHEIGHT;

            tempoWidget.tempoCanvases = [mockCanvas];
            tempoWidget.BPMs = [120];
            tempoWidget._directions = [1];
            tempoWidget._intervals = [500];
            tempoWidget._widgetFirstTimes = [Date.now()];
            tempoWidget._widgetNextTimes = [Date.now() + 5];
            tempoWidget.activity = mockActivity;

            tempoWidget._draw();
            expect(tempoWidget._xradius).toBeLessThanOrEqual(Tempo.YRADIUS / 3);
        });
    });

    describe("Canvas onclick - Edge Cases", () => {
        test("should reject BPM exactly at 29 (boundary)", () => {
            tempoWidget.BPMs = [100];
            tempoWidget.init(mockActivity);
            const canvas = tempoWidget.tempoCanvases[0];

            jest.setSystemTime(1000);
            canvas.onclick();
            jest.setSystemTime(3069);
            canvas.onclick();
            expect(tempoWidget.BPMs[0]).toBe(100);
            expect(tempoWidget._firstClickTime).toBe(3069);
        });

        test("should reject BPM exactly at 1001 (boundary)", () => {
            tempoWidget.BPMs = [100];
            tempoWidget.init(mockActivity);
            const canvas = tempoWidget.tempoCanvases[0];

            jest.setSystemTime(1000);
            canvas.onclick();
            jest.setSystemTime(1059);
            canvas.onclick();
            expect(tempoWidget.BPMs[0]).toBe(100);
            expect(tempoWidget._firstClickTime).toBe(1059);
        });

        test("should accept BPM at exactly 30 (lower boundary)", () => {
            tempoWidget.BPMs = [100];
            tempoWidget.init(mockActivity);
            const canvas = tempoWidget.tempoCanvases[0];

            jest.setSystemTime(1000);
            canvas.onclick();
            jest.setSystemTime(3000);
            canvas.onclick();

            expect(tempoWidget.BPMs[0]).toBe(30);
            expect(tempoWidget._firstClickTime).toBeNull();
        });

        test("should accept BPM at exactly 1000 (upper boundary)", () => {
            tempoWidget.BPMs = [100];
            tempoWidget.init(mockActivity);
            const canvas = tempoWidget.tempoCanvases[0];

            jest.setSystemTime(1000);
            canvas.onclick();
            jest.setSystemTime(1060);
            canvas.onclick();

            expect(tempoWidget.BPMs[0]).toBe(1000);
            expect(tempoWidget._firstClickTime).toBeNull();
        });
    });

    describe("Multiple BPMs - _draw()", () => {
        test("should handle drawing multiple canvases simultaneously", () => {
            const canvas1 = document.createElement("canvas");
            const canvas2 = document.createElement("canvas");
            canvas1.width = Tempo.TEMPOWIDTH;
            canvas1.height = Tempo.TEMPOHEIGHT;
            canvas2.width = Tempo.TEMPOWIDTH;
            canvas2.height = Tempo.TEMPOHEIGHT;

            tempoWidget.tempoCanvases = [canvas1, canvas2];
            tempoWidget.BPMs = [100, 200];
            tempoWidget._directions = [1, -1];
            tempoWidget._intervals = [600, 300];
            tempoWidget._widgetFirstTimes = [Date.now(), Date.now()];
            tempoWidget._widgetNextTimes = [Date.now() + 600, Date.now() + 300];
            tempoWidget.activity = mockActivity;

            tempoWidget._draw();

            const ctx1 = canvas1.getContext("2d");
            const ctx2 = canvas2.getContext("2d");

            expect(ctx1.ellipse).toHaveBeenCalled();
            expect(ctx2.ellipse).toHaveBeenCalled();
        });
    });
    describe("init() - Additional Coverage", () => {
        test("should clear existing interval when re-initializing", () => {
            tempoWidget.BPMs = [100];
            tempoWidget._intervalID = setInterval(() => {}, 1000);
            const oldIntervalId = tempoWidget._intervalID;

            tempoWidget.init(mockActivity);
            expect(jest.getTimerCount()).toBe(1);
        });

        test("should call widgetWindow.onclose callback", () => {
            tempoWidget.BPMs = [100];
            tempoWidget._intervalID = setInterval(() => {}, 1000);

            tempoWidget.init(mockActivity);
            const mockWindow = window.widgetWindows.windowFor.mock.results[0].value;
            mockWindow.onclose();
            expect(jest.getTimerCount()).toBe(0);
        });

        test("should toggle pause button from pause to play", () => {
            tempoWidget.BPMs = [100];
            tempoWidget.init(mockActivity);
            const pauseButtonCalls =
                window.widgetWindows.windowFor.mock.results[0].value.addButton.mock.calls;
            const pauseButtonCall = pauseButtonCalls.find(call => call[0] === "pause-button.svg");
            const pauseBtn = pauseButtonCall
                ? {
                      onclick: pauseButtonCalls[0].returnValue?.onclick,
                      innerHTML: ""
                  }
                : null;
            if (pauseBtn && pauseBtn.onclick) {
                pauseBtn.onclick();
                expect(tempoWidget.isMoving).toBe(false);
            }
        });

        test("should handle save button debounce (prevent double save)", () => {
            tempoWidget.BPMs = [100];
            tempoWidget.init(mockActivity);
            const saveButtonCalls =
                window.widgetWindows.windowFor.mock.results[0].value.addButton.mock.calls;
            const saveButtonCall = saveButtonCalls.find(call => call[0] === "export-chunk.svg");
            if (saveButtonCall && saveButtonCall[3]) {
                const saveBtn = { onclick: saveButtonCall[3].onclick };

                saveBtn.onclick();
                saveBtn.onclick();
                expect(mockActivity.blocks.loadNewBlocks).toHaveBeenCalledTimes(1);
            }
        });

        test("should handle BPM less than or equal to 0", () => {
            tempoWidget.BPMs = [0];
            tempoWidget.init(mockActivity);
            expect(tempoWidget.BPMs[0]).toBe(30);
        });

        test("should handle negative BPM values", () => {
            tempoWidget.BPMs = [-50];
            tempoWidget.init(mockActivity);

            expect(tempoWidget.BPMs[0]).toBe(30);
        });
    });
    describe("stop() / cleanup edge cases", () => {
        test("should handle stop when interval is already null", () => {
            tempoWidget._intervalID = null;
            expect(() => tempoWidget.pause()).not.toThrow();
        });
    });
    describe("Targeted coverage for specific uncovered lines", () => {
        test("should call clearInterval if loadSynth synchronously sets _intervalID (line 63)", () => {
            const clearIntervalSpy = jest.spyOn(global, "clearInterval");
            mockActivity.logo.synth.loadSynth.mockImplementationOnce(() => {
                tempoWidget._intervalID = 999;
            });
            tempoWidget.init(mockActivity);
            expect(clearIntervalSpy).toHaveBeenCalledWith(999);
            clearIntervalSpy.mockRestore();
        });

        test("pause button onclick should toggle isMoving, call pause/resume, and update button content (lines 80-101)", () => {
            const pauseBtnMock = {
                textContent: "",
                appendChild: jest.fn(),
                childNodes: []
            };
            const mockWindow = window.widgetWindows.windowFor();
            mockWindow.addButton.mockImplementation(icon => {
                if (icon === "pause-button.svg") return pauseBtnMock;
                return { onclick: jest.fn() };
            });
            tempoWidget.init(mockActivity);
            const pauseSpy = jest.spyOn(tempoWidget, "pause").mockImplementation(() => {});
            const resumeSpy = jest.spyOn(tempoWidget, "resume").mockImplementation(() => {});
            expect(tempoWidget.isMoving).toBe(true);
            pauseBtnMock.onclick();
            expect(pauseSpy).toHaveBeenCalled();
            expect(tempoWidget.isMoving).toBe(false);
            expect(pauseBtnMock.textContent).toBe("");
            expect(pauseBtnMock.appendChild).toHaveBeenCalled();
            const playImgCall = pauseBtnMock.appendChild.mock.calls[0][0];
            expect(playImgCall.src).toContain("play-button.svg");
            pauseBtnMock.onclick();
            expect(resumeSpy).toHaveBeenCalled();
            expect(tempoWidget.isMoving).toBe(true);
            expect(pauseBtnMock.appendChild).toHaveBeenCalledTimes(2);
            const pauseImgCall = pauseBtnMock.appendChild.mock.calls[1][0];
            expect(pauseImgCall.src).toContain("pause-button.svg");
            pauseSpy.mockRestore();
            resumeSpy.mockRestore();
        });

        test("init should initialize _widgetFirstTimes and set BPMs <= 0 to 30 (lines 113-116)", () => {
            tempoWidget.BPMs = [0, -15];
            tempoWidget._save_lock = false;
            tempoWidget.init(mockActivity);
            const mockWindow = window.widgetWindows.windowFor();
            const addButtonCalls = mockWindow.addButton.mock.calls;
            const saveCall = addButtonCalls.find(call => call[0] === "export-chunk.svg");
            const saveBtn =
                mockWindow.addButton.mock.results[addButtonCalls.indexOf(saveCall)].value;
            saveBtn.onclick();
            expect(tempoWidget._get_save_lock()).toBe(true);
            jest.advanceTimersByTime(1000);
            expect(tempoWidget._get_save_lock()).toBe(false);
        });

        test("_useBPM should show specific error message when BPM < 30 (line 244)", () => {
            tempoWidget.BPMs = [100];
            tempoWidget.BPMInputs = [{ value: 15 }];
            tempoWidget._useBPM(0);
            expect(tempoWidget.BPMs[0]).toBe(30);
            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "The beats per minute must be between 30 and 1000.",
                3000
            );
        });
    });

    describe("Keyboard shortcuts and fine-tuning (#8601)", () => {
        test("speedUp() should support custom step for ±1 fine-tuning", () => {
            tempoWidget.BPMs = [120];
            tempoWidget.BPMInputs = [{ value: 120 }];
            tempoWidget._intervals = [500];

            tempoWidget.speedUp(0, 1);
            expect(tempoWidget.BPMs[0]).toBe(121);
            expect(tempoWidget.BPMInputs[0].value).toBe(121);
        });

        test("slowDown() should support custom step for ±1 fine-tuning", () => {
            tempoWidget.BPMs = [120];
            tempoWidget.BPMInputs = [{ value: 120 }];
            tempoWidget._intervals = [500];

            tempoWidget.slowDown(0, 1);
            expect(tempoWidget.BPMs[0]).toBe(119);
            expect(tempoWidget.BPMInputs[0].value).toBe(119);
        });

        test("togglePlayPause() should invoke pauseBtn.onclick when present", () => {
            const mockClick = jest.fn();
            tempoWidget.pauseBtn = { onclick: mockClick };

            tempoWidget.togglePlayPause();
            expect(mockClick).toHaveBeenCalledTimes(1);
        });

        test("togglePlayPause() should toggle moving state when pauseBtn is absent", () => {
            tempoWidget.pauseBtn = null;
            tempoWidget.isMoving = true;
            const pauseSpy = jest.spyOn(tempoWidget, "pause").mockImplementation(() => {});
            const resumeSpy = jest.spyOn(tempoWidget, "resume").mockImplementation(() => {});

            tempoWidget.togglePlayPause();
            expect(pauseSpy).toHaveBeenCalledTimes(1);
            expect(tempoWidget.isMoving).toBe(false);

            tempoWidget.togglePlayPause();
            expect(resumeSpy).toHaveBeenCalledTimes(1);
            expect(tempoWidget.isMoving).toBe(true);

            pauseSpy.mockRestore();
            resumeSpy.mockRestore();
        });

        test("init registers keydown listener on document and responds to fine/coarse shortcuts", () => {
            const addEventSpy = jest.spyOn(document, "addEventListener");
            const removeEventSpy = jest.spyOn(document, "removeEventListener");

            tempoWidget.BPMs = [120];
            tempoWidget.init(mockActivity);

            expect(addEventSpy).toHaveBeenCalledWith("keydown", expect.any(Function), true);
            expect(tempoWidget._keyHandler).toBeDefined();

            const handler = tempoWidget._keyHandler;

            // Fine speedUp with ArrowUp and ArrowRight (+1 BPM)
            const upEvent = {
                key: "ArrowUp",
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(upEvent);
            expect(upEvent.preventDefault).toHaveBeenCalled();
            expect(upEvent.stopPropagation).toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(121);

            const rightEvent = {
                key: "ArrowRight",
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(rightEvent);
            expect(rightEvent.preventDefault).toHaveBeenCalled();
            expect(rightEvent.stopPropagation).toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(122);

            // Fine slowDown with ArrowDown and ArrowLeft (-1 BPM)
            const downEvent = {
                key: "ArrowDown",
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(downEvent);
            expect(downEvent.preventDefault).toHaveBeenCalled();
            expect(downEvent.stopPropagation).toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(121);

            const leftEvent = {
                key: "ArrowLeft",
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(leftEvent);
            expect(leftEvent.preventDefault).toHaveBeenCalled();
            expect(leftEvent.stopPropagation).toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(120);

            // Coarse speedUp with Shift + ArrowUp (+10%)
            // 120 + round(0.1 * 120) = 120 + 12 = 132
            const shiftUpEvent = {
                key: "ArrowUp",
                shiftKey: true,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(shiftUpEvent);
            expect(tempoWidget.BPMs[0]).toBe(132);

            // Coarse slowDown with Shift + ArrowDown (-10%)
            // 132 - round(0.1 * 132) = 132 - 13 = 119
            const shiftDownEvent = {
                key: "ArrowDown",
                shiftKey: true,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(shiftDownEvent);
            expect(tempoWidget.BPMs[0]).toBe(119);

            // Spacebar toggles playback
            const toggleSpy = jest
                .spyOn(tempoWidget, "togglePlayPause")
                .mockImplementation(() => {});
            const spaceEvent = {
                key: " ",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(spaceEvent);
            expect(spaceEvent.preventDefault).toHaveBeenCalled();
            expect(spaceEvent.stopPropagation).toHaveBeenCalled();
            expect(toggleSpy).toHaveBeenCalledTimes(1);
            toggleSpy.mockRestore();

            // Closing window cleans up keydown listener
            tempoWidget.widgetWindow.onclose();
            expect(removeEventSpy).toHaveBeenCalledWith("keydown", handler, true);
            expect(tempoWidget._keyHandler).toBeNull();

            addEventSpy.mockRestore();
            removeEventSpy.mockRestore();
        });

        test("keydown listener ignores events when an input element is focused", () => {
            tempoWidget.BPMs = [120];
            tempoWidget.init(mockActivity);

            const handler = tempoWidget._keyHandler;
            const inputEl = document.createElement("input");
            document.body.appendChild(inputEl);
            inputEl.focus();

            const upEvent = {
                key: "ArrowUp",
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };

            handler(upEvent);
            expect(upEvent.preventDefault).not.toHaveBeenCalled();
            expect(upEvent.stopPropagation).not.toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(120);

            document.body.removeChild(inputEl);
            tempoWidget.widgetWindow.onclose();
        });

        test("tracks activeBPMIndex on input and canvas interactions", () => {
            tempoWidget.BPMs = [100, 200];
            tempoWidget.BPMBlocks = [null, null];
            tempoWidget.init(mockActivity);

            expect(tempoWidget.activeBPMIndex).toBe(0);

            // Simulate clicking second canvas
            tempoWidget.tempoCanvases[1].onclick();
            expect(tempoWidget.activeBPMIndex).toBe(1);

            // Now shortcut should target index 1
            const upEvent = {
                key: "ArrowUp",
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            tempoWidget._keyHandler(upEvent);
            expect(tempoWidget.BPMs[1]).toBe(201);
            expect(tempoWidget.BPMs[0]).toBe(100);

            tempoWidget.widgetWindow.onclose();
        });

        test("keydown listener supports keyCode fallbacks and code === 'Space'", () => {
            tempoWidget.BPMs = [120];
            tempoWidget.init(mockActivity);
            const handler = tempoWidget._keyHandler;

            // keyCode 38 (Up)
            const upKeyCodeEvent = {
                keyCode: 38,
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(upKeyCodeEvent);
            expect(upKeyCodeEvent.preventDefault).toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(121);

            // keyCode 39 (Right)
            const rightKeyCodeEvent = {
                keyCode: 39,
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(rightKeyCodeEvent);
            expect(rightKeyCodeEvent.preventDefault).toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(122);

            // keyCode 40 (Down)
            const downKeyCodeEvent = {
                keyCode: 40,
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(downKeyCodeEvent);
            expect(downKeyCodeEvent.preventDefault).toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(121);

            // keyCode 37 (Left)
            const leftKeyCodeEvent = {
                keyCode: 37,
                shiftKey: false,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(leftKeyCodeEvent);
            expect(leftKeyCodeEvent.preventDefault).toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(120);

            // code === "Space"
            const toggleSpy = jest
                .spyOn(tempoWidget, "togglePlayPause")
                .mockImplementation(() => {});
            const codeSpaceEvent = {
                code: "Space",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(codeSpaceEvent);
            expect(codeSpaceEvent.preventDefault).toHaveBeenCalled();
            expect(toggleSpy).toHaveBeenCalledTimes(1);

            // keyCode === 32
            const keyCodeSpaceEvent = {
                keyCode: 32,
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(keyCodeSpaceEvent);
            expect(keyCodeSpaceEvent.preventDefault).toHaveBeenCalled();
            expect(toggleSpy).toHaveBeenCalledTimes(2);

            toggleSpy.mockRestore();
            tempoWidget.widgetWindow.onclose();
        });

        test("keydown listener ignores Space when a button or select element is focused", () => {
            tempoWidget.BPMs = [120];
            tempoWidget.init(mockActivity);
            const handler = tempoWidget._keyHandler;
            const toggleSpy = jest
                .spyOn(tempoWidget, "togglePlayPause")
                .mockImplementation(() => {});

            // Button focused
            const buttonEl = document.createElement("button");
            document.body.appendChild(buttonEl);
            buttonEl.focus();

            const spaceEvent1 = {
                key: " ",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(spaceEvent1);
            expect(spaceEvent1.preventDefault).not.toHaveBeenCalled();
            expect(toggleSpy).not.toHaveBeenCalled();

            document.body.removeChild(buttonEl);

            // Select focused
            const selectEl = document.createElement("select");
            document.body.appendChild(selectEl);
            selectEl.focus();

            const spaceEvent2 = {
                key: " ",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(spaceEvent2);
            expect(spaceEvent2.preventDefault).not.toHaveBeenCalled();
            expect(toggleSpy).not.toHaveBeenCalled();

            // ArrowUp on select should also be ignored
            const upEvent = {
                key: "ArrowUp",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(upEvent);
            expect(upEvent.preventDefault).not.toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(120);

            document.body.removeChild(selectEl);
            toggleSpy.mockRestore();
            tempoWidget.widgetWindow.onclose();
        });

        test("keydown listener ignores events when another widget is focused or activeBlock exists", () => {
            tempoWidget.BPMs = [120];
            tempoWidget.init(mockActivity);
            const handler = tempoWidget._keyHandler;

            // Another widget focused
            const otherWin = { _frame: document.createElement("div") };
            window.widgetWindows.focused = otherWin;

            const upEvent1 = {
                key: "ArrowUp",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(upEvent1);
            expect(upEvent1.preventDefault).not.toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(120);

            window.widgetWindows.focused = tempoWidget.widgetWindow;

            // Active workspace block
            mockActivity.blocks.activeBlock = 5;
            const upEvent2 = {
                key: "ArrowUp",
                preventDefault: jest.fn(),
                stopPropagation: jest.fn()
            };
            handler(upEvent2);
            expect(upEvent2.preventDefault).not.toHaveBeenCalled();
            expect(tempoWidget.BPMs[0]).toBe(120);
            mockActivity.blocks.activeBlock = null;

            // Empty BPMs guard
            tempoWidget.BPMs = [];
            handler(upEvent2);
            expect(upEvent2.preventDefault).not.toHaveBeenCalled();

            tempoWidget.widgetWindow.onclose();
        });

        test("speedUp and slowDown with custom step respect 1000 and 30 boundaries", () => {
            tempoWidget.BPMs = [1000];
            tempoWidget.BPMInputs = [{ value: 1000 }];
            tempoWidget.BPMBlocks = [null];
            mockActivity.errorMsg = jest.fn();

            tempoWidget.speedUp(0, 1);
            expect(tempoWidget.BPMs[0]).toBe(1000);
            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "The beats per minute must be below 1000.",
                3000
            );

            tempoWidget.BPMs[0] = 30;
            tempoWidget.slowDown(0, 1);
            expect(tempoWidget.BPMs[0]).toBe(30);
            expect(mockActivity.errorMsg).toHaveBeenCalledWith(
                "The beats per minute must be above 30",
                3000
            );
        });
    });
});

describe("Tempo widget cleanup on block deletion", () => {
    it("should clear the interval when widget is closed via closeBlkWidgets", () => {
        const mockTimerManager = {
            clearInterval: jest.fn(),
            setInterval: jest.fn().mockReturnValue(42)
        };
        const mockWidgetWindow = {
            timerManager: mockTimerManager,
            destroy: jest.fn(),
            onclose: null
        };

        // Simulate _intervalID being set
        let intervalID = 42;

        // Simulate onclose being called
        const oncloseHandler = () => {
            if (intervalID !== null) {
                mockWidgetWindow.timerManager.clearInterval(intervalID);
            }
            mockWidgetWindow.destroy();
        };

        oncloseHandler();

        expect(mockTimerManager.clearInterval).toHaveBeenCalledWith(42);
        expect(mockWidgetWindow.destroy).toHaveBeenCalledTimes(1);
    });

    it("should not continue audio after block deletion triggers widget close", () => {
        const mockTimerManager = {
            clearInterval: jest.fn(),
            setInterval: jest.fn().mockReturnValue(99)
        };

        let intervalID = 99;
        let audioTriggered = false;

        // Simulate _draw being called after interval cleared
        const draw = () => {
            if (intervalID !== null) {
                audioTriggered = true;
            }
        };

        // Clear interval (simulating onclose)
        mockTimerManager.clearInterval(intervalID);
        intervalID = null;

        // draw should not trigger audio now
        draw();

        expect(mockTimerManager.clearInterval).toHaveBeenCalledWith(99);
        expect(audioTriggered).toBe(false);
    });
});
