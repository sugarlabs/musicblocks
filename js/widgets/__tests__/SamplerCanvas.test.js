/**
 * MusicBlocks
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

const SamplerCanvas = require("../SamplerCanvas.js");

const METHODS = ["_scale", "makeCanvas"];
const DEPS = {
    SAMPLEWIDTH: 800,
    SAMPLEHEIGHT: 400,
    EXPORTACCIDENTALNAMES: ["𝄫", "♭", "", "♯", "𝄪"],
    SOLFEGENAMES: ["do", "re", "mi", "fa", "sol", "la", "ti", "do"],
    SAMPLEOSCCOLORS: ["#3030FF", "#FF3050"]
};

const makeWidget = (deps = DEPS) => {
    const widget = {};
    SamplerCanvas.install.call(widget, deps);
    return widget;
};

describe("SamplerCanvas", () => {
    test("install adds exactly the methods moved out of SampleWidget", () => {
        expect(Object.keys(makeWidget()).sort()).toEqual([...METHODS].sort());
    });

    test("each widget gets its own methods", () => {
        const first = makeWidget();
        const second = makeWidget();
        for (const name of METHODS) {
            expect(typeof first[name]).toBe("function");
            expect(first[name]).not.toBe(second[name]);
        }
    });

    describe("_scale", () => {
        const scaledWidget = (maximized, deps) => {
            const widget = makeWidget(deps);
            const body = document.createElement("div");
            widget.widgetWindow = {
                isMaximized: () => maximized,
                getWidgetBody: () => body,
                getWidgetFrame: () => ({ getBoundingClientRect: () => ({ height: 600 }) })
            };
            body.getBoundingClientRect = () => ({ width: 1200 });
            widget.drawVisualIDs = [5];
            widget.makeCanvas = jest.fn();
            widget.reconnectSynthsToAnalyser = jest.fn();
            return widget;
        };

        beforeEach(() => {
            global.cancelAnimationFrame = jest.fn();
        });

        test("uses the injected sample size in a normal window", () => {
            const widget = scaledWidget(false, { ...DEPS, SAMPLEWIDTH: 640, SAMPLEHEIGHT: 320 });
            widget._scale();
            expect(widget.makeCanvas).toHaveBeenCalledWith(640, 320, 0, true);
            expect(widget.reconnectSynthsToAnalyser).toHaveBeenCalled();
        });

        test("fills the window when maximized", () => {
            const widget = scaledWidget(true);
            widget._scale();
            expect(widget.makeCanvas).toHaveBeenCalledWith(1200, 530, 0, true);
        });

        test("stops the old draw loop before starting a new one", () => {
            const widget = scaledWidget(false);
            widget._scale();
            expect(global.cancelAnimationFrame).toHaveBeenCalledWith(5);
            expect(widget.drawVisualIDs[0]).toBeNull();
        });

        test("reconnects synths to analyser before making canvas", () => {
            const widget = scaledWidget(false);
            widget._scale();
            const reconnectOrder = widget.reconnectSynthsToAnalyser.mock.invocationCallOrder[0];
            const makeCanvasOrder = widget.makeCanvas.mock.invocationCallOrder[0];
            expect(reconnectOrder).toBeLessThan(makeCanvasOrder);
        });
    });

    describe("makeCanvas and draw loop", () => {
        let widget;
        let body;
        let mockActivity;
        let scheduledCallbacks;

        beforeEach(() => {
            scheduledCallbacks = [];
            global.requestAnimationFrame = jest.fn(cb => {
                scheduledCallbacks.push(cb);
                return 42;
            });
            global.cancelAnimationFrame = jest.fn(id => {
                scheduledCallbacks = [];
            });
            global.platformColor = { background: "#FFFFFF", textColor: "#000000" };
            global._ = s => s;

            widget = makeWidget();
            body = document.createElement("div");
            widget.widgetWindow = {
                getWidgetBody: () => body,
                getWidgetFrame: () => ({ getBoundingClientRect: () => ({ height: 600 }) }),
                isMaximized: () => false
            };
            mockActivity = {
                logo: {
                    synth: {
                        getWaveFormValues: jest.fn(() => new Float32Array([0.1, -0.1, 0.2]))
                    }
                }
            };
            widget.activity = mockActivity;
            widget.drawVisualIDs = {};
            widget.running = true;
            widget.sampleName = "test_sample";
            widget.pitchAnalysers = {
                0: { getValue: jest.fn(() => new Float32Array([0.5, -0.5])) },
                1: { getValue: jest.fn(() => new Float32Array([0.2, -0.2])) }
            };
        });

        test("makeCanvas exposes _drawLoop function and starts drawing", () => {
            widget.makeCanvas(800, 400, 0, true);
            expect(typeof widget._drawLoop).toBe("function");
            expect(widget.drawVisualIDs[0]).toBe(42);
        });

        test("draw loop terminates and resets is_recording and record button when synth returns null during recording", () => {
            const btn = document.createElement("button");
            const img = document.createElement("img");
            img.src = "header-icons/record.svg";
            btn.appendChild(img);
            widget._recordBtn = btn;
            widget.is_recording = true;

            // When getWaveFormValues returns null (synth was disposed / torn down)
            mockActivity.logo.synth.getWaveFormValues.mockReturnValue(null);

            widget.makeCanvas(800, 400, 0, true);

            // On the frame where getWaveFormValues() returns null:
            // 1. is_recording is immediately reset to false
            expect(widget.is_recording).toBe(false);
            // 2. record button icon is restored to mic.svg
            expect(img.src).toContain("header-icons/mic.svg");
            // 3. drawVisualIDs[0] is cancelled and cleared to null
            expect(widget.drawVisualIDs[0]).toBeNull();
            // 4. No future RAF loop remains queued
            expect(scheduledCallbacks.length).toBe(0);
        });

        test("draw loop handles missing pitchAnalysers gracefully without throwing", () => {
            const btn = document.createElement("button");
            const img = document.createElement("img");
            img.src = "header-icons/record.svg";
            btn.appendChild(img);
            widget._recordBtn = btn;
            widget.is_recording = true;
            widget.pitchAnalysers = {};
            mockActivity.logo.synth.getWaveFormValues.mockReturnValue(null);
            mockActivity.logo.synth.stopRecording = jest.fn();

            expect(() => widget.makeCanvas(800, 400, 0, true)).not.toThrow();

            expect(mockActivity.logo.synth.stopRecording).toHaveBeenCalled();
            expect(widget.is_recording).toBe(false);
            expect(widget.drawVisualIDs[0]).toBeNull();
            expect(img.src).toContain("header-icons/mic.svg");
        });

        test("draw loop stops and clears drawVisualIDs when idle", () => {
            widget.is_recording = false;
            widget.running = false;
            widget.makeCanvas(800, 400, 0, false);
            expect(widget.drawVisualIDs[0]).toBeNull();
        });
    });
});
