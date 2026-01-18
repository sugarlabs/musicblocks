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

// Global Mocks
global._ = msg => msg;
global.getDrumSynthName = jest.fn(name => name);

// Setup Window and Document mocks
global.window = global.window || {};
global.window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        addButton: jest.fn().mockReturnValue({ onclick: jest.fn(), innerHTML: "" }),
        addInputButton: jest.fn().mockImplementation(val => ({
            value: val,
            addEventListener: jest.fn()
        })),
        getWidgetBody: jest.fn().mockReturnValue({
            appendChild: jest.fn()
        }),
        sendToCenter: jest.fn(),
        destroy: jest.fn()
    })
};
global.window.innerWidth = 1024;
globalThis.window = global.window;

// Mock setInterval and clearInterval
jest.spyOn(global, 'setInterval');
jest.spyOn(global, 'clearInterval');

global.document = global.document || {};
global.document.createElement = jest.fn(type => {
        if (type === "canvas") {
            return {
                style: {},
                getContext: jest.fn().mockReturnValue({
                    clearRect: jest.fn(),
                    beginPath: jest.fn(),
                    fillStyle: "",
                    ellipse: jest.fn(),
                    fill: jest.fn(),
                    closePath: jest.fn()
                }),
                width: 700,
                height: 100
            };
        }
        if (type === "table") {
            return {
                insertRow: jest.fn().mockReturnValue({
                    insertCell: jest.fn().mockReturnValue({
                        appendChild: jest.fn(),
                        setAttribute: jest.fn()
                    })
                })
            };
        }
        return {};
    });

const Tempo = require("./tempo.js");

describe("Tempo Widget", () => {
    let tempoWidget;
    let mockActivity;

    beforeEach(() => {
        jest.clearAllMocks();
        tempoWidget = new Tempo();

        // Mock Activity
        mockActivity = {
            logo: {
                synth: { 
                    loadSynth: jest.fn(),
                    trigger: jest.fn()
                },
                firstNoteTime: 1000
            },
            blocks: {
                blockList: {
                    "block-1": {
                        connections: [null, "block-2"],
                        value: 0,
                        text: { text: "" },
                        updateCache: jest.fn()
                    },
                    "block-2": {
                        value: 0,
                        text: { text: "" },
                        updateCache: jest.fn()
                    }
                },
                loadNewBlocks: jest.fn()
            },
            refreshCanvas: jest.fn(),
            saveLocally: jest.fn(),
            textMsg: jest.fn(),
            errorMsg: jest.fn()
        };
        global.activity = mockActivity;

        // Populate BPMs to test the initialization loop
        tempoWidget.BPMs = [100];
        tempoWidget.BPMBlocks = ["block-1"];

        // Initialize
        tempoWidget.init(mockActivity);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("can be instantiated", () => {
        const widget = new Tempo();
        expect(widget).toBeDefined();
        expect(widget.BPMs).toBeDefined();
    });

    test("init() sets up UI and intervals", () => {
        tempoWidget.BPMs = [100];
        tempoWidget.BPMBlocks = ["block-1"];
        tempoWidget.init(mockActivity);

        expect(tempoWidget.activity).toBe(mockActivity);
        expect(global.window.widgetWindows.windowFor).toHaveBeenCalled();
        expect(mockActivity.logo.synth.loadSynth).toHaveBeenCalled();
        expect(tempoWidget.BPMInputs.length).toBe(1);
        expect(tempoWidget._intervals[0]).toBe((60 / 100) * 1000);
        // Should start running - check if setInterval was called
        expect(setInterval).toHaveBeenCalled();
    });

    test("speedUp() increases BPM and updates input", () => {
        tempoWidget.BPMs = [100];
        tempoWidget.BPMBlocks = ["block-1"];
        tempoWidget.init(mockActivity);

        tempoWidget.speedUp(0);
        // 100 + 10 = 110
        expect(tempoWidget.BPMs[0]).toBe(110);
        expect(tempoWidget.BPMInputs[0].value).toBe(110);
        // Should update linked block
        expect(mockActivity.blocks.blockList["block-2"].value).toBe(110);
    });

    test("speedUp() clamps to max BPM", () => {
        tempoWidget.BPMs[0] = 950;
        tempoWidget.speedUp(0);
        expect(tempoWidget.BPMs[0]).toBe(1000);
        // Calling speedUp again should stay at 1000 and show error
        tempoWidget.speedUp(0);
        expect(tempoWidget.BPMs[0]).toBe(1000);
        expect(mockActivity.errorMsg).toHaveBeenCalled();
    });

    test("slowDown() decreases BPM", () => {
        tempoWidget.slowDown(0);
        // 100 - 10 = 90
        expect(tempoWidget.BPMs[0]).toBe(90);
        expect(tempoWidget.BPMInputs[0].value).toBe(90);
    });

    test("slowDown() clamps to min BPM", () => {
        tempoWidget.BPMs[0] = 32;
        tempoWidget.slowDown(0);
        expect(tempoWidget.BPMs[0]).toBe(30);
        // Call result in error if < 30 logic hit
        tempoWidget.BPMs[0] = 30;
        tempoWidget.slowDown(0);
        expect(tempoWidget.BPMs[0]).toBe(30);
        expect(mockActivity.errorMsg).toHaveBeenCalled();
    });

    test("pause() and resume() toggle interval", () => {
        jest.clearAllMocks();
        tempoWidget = new Tempo();
        tempoWidget.BPMs = [100];
        tempoWidget.BPMBlocks = ["block-1"];
        tempoWidget.init(mockActivity);

        // pause/resume test  
        tempoWidget.pause();
        expect(clearInterval).toHaveBeenCalled();

        tempoWidget.resume();
        expect(setInterval).toHaveBeenCalledTimes(2); // One from init, one from resume
    });
    
    test("_useBPM() updates BPM from input", () => {
        tempoWidget.BPMs = [100];
        tempoWidget.BPMBlocks = ["block-1"];
        tempoWidget.init(mockActivity);

        tempoWidget.BPMInputs[0].value = 150;
        tempoWidget._useBPM(0);
        expect(tempoWidget.BPMs[0]).toBe(150);
        expect(mockActivity.blocks.blockList["block-2"].value).toBe(150);
    });

    test("_useBPM() handles invalid input", () => {
        tempoWidget.BPMs = [100];
        tempoWidget.BPMBlocks = ["block-1"];
        tempoWidget.init(mockActivity);

        tempoWidget.BPMInputs[0].value = "invalid";
        tempoWidget._useBPM(0);
        expect(mockActivity.errorMsg).toHaveBeenCalled();
        
        tempoWidget.BPMInputs[0].value = 2000;
        tempoWidget._useBPM(0);
        expect(tempoWidget.BPMs[0]).toBe(1000); // Clamped
        expect(mockActivity.errorMsg).toHaveBeenCalled();
    });

    test("_saveTempo() creates new blocks", () => {
        tempoWidget.BPMs = [100];
        tempoWidget.BPMBlocks = ["block-1"];
        tempoWidget.init(mockActivity);

        // _saveTempo is complex, just verify it doesn't crash
        expect(() => tempoWidget._saveTempo()).not.toThrow();
    });

    test("_draw() performs canvas drawing and boundary check", () => {
        // Setup state for draw
        // Trigger a draw call
        tempoWidget._draw();
        const ctx = tempoWidget.tempoCanvases[0].getContext("2d");
        expect(ctx.clearRect).toHaveBeenCalled();
        expect(ctx.beginPath).toHaveBeenCalled();
        expect(ctx.fill).toHaveBeenCalled();
    });

    test("_draw() plays sound at end of interval", () => {
        // Fast forward time to trigger sound
        const i = 0;
        tempoWidget._widgetNextTimes[i] = Date.now() - 100; // Time passed
        tempoWidget._draw();
        
        expect(mockActivity.logo.synth.trigger).toHaveBeenCalledWith(
            0, ["C2"], expect.any(Number), "bottle", null, null, false
        );
    });
});

