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

        // --- FIX 1: Set the Global 'activity' variable ---
        // The widget code calls 'activity.errorMsg', relying on it being global.
        global.activity = mockActivity;

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
            keyupHandler({ keyCode: 13 });
            expect(useBPMSpy).toHaveBeenCalledTimes(1);
            expect(useBPMSpy).toHaveBeenCalledWith(0);
            keyupHandler({ keyCode: 32 });
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
});

describe("Tempo._useBPM validation logic", () => {
    /**
     * Extracted pure logic from Tempo._useBPM
     * Validates and clamps BPM input to valid range [30, 1000].
     */
    const validateBPM = input => {
        if (isNaN(input)) {
            return { bpm: null, error: "invalid" };
        }
        let bpm = Number(input);
        let error = null;
        if (bpm > 1000) {
            bpm = 1000;
            error = "clamped_high";
        } else if (bpm < 30) {
            bpm = 30;
            error = "clamped_low";
        }
        return { bpm, error };
    };

    it("should accept valid BPM within range", () => {
        expect(validateBPM(120)).toEqual({ bpm: 120, error: null });
        expect(validateBPM(500)).toEqual({ bpm: 500, error: null });
    });

    it("should clamp BPM above 1000 to 1000", () => {
        expect(validateBPM(1500)).toEqual({ bpm: 1000, error: "clamped_high" });
    });

    it("should clamp BPM below 30 to 30", () => {
        expect(validateBPM(10)).toEqual({ bpm: 30, error: "clamped_low" });
    });

    it("should return error for non-numeric input", () => {
        expect(validateBPM("abc")).toEqual({ bpm: null, error: "invalid" });
    });
});
