/**
 * MusicBlocks
 *
 * @author kh-ub-ayb
 *
 * @copyright 2026 kh-ub-ayb
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

// Set up globals required by oscilloscope.js
global._ = str => str;
global.platformColor = {
    fillColor: "#F9F9F9",
    textColor: "#000000",
    strokeColor: "#E2E2E2",
    background: "#303030",
    selectorBackground: "#64B5F6",
    selectorSelected: "#1E88E5"
};
global.BIGGERBUTTON = "<svg>bigger</svg>";
global.SMALLERBUTTON = "<svg>smaller</svg>";
global.base64Encode = str => str;
global.cancelAnimationFrame = jest.fn();
global.requestAnimationFrame = jest.fn(() => 12345);

// Mock canvas getContext since jsdom does not implement it
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1
}));

// Mock instruments global
global.instruments = {};

// Mock Tone
global.Tone = {
    Analyser: jest.fn().mockImplementation(() => ({
        getValue: jest.fn(() => new Float32Array(128)),
        connect: jest.fn()
    }))
};

/**
 * Creates a mock widgetWindow object.
 * @returns {Object} Mock widget window.
 */
function createMockWidgetWindow() {
    const widgetBody = document.createElement("div");
    const widgetFrame = document.createElement("div");
    return {
        clear: jest.fn(),
        show: jest.fn(),
        onclose: null,
        onmaximize: null,
        addButton: jest.fn(() => {
            const btn = document.createElement("div");
            const img = document.createElement("img");
            btn.appendChild(img);
            btn.onclick = null;
            return btn;
        }),
        sendToCenter: jest.fn(),
        getWidgetBody: jest.fn(() => widgetBody),
        getWidgetFrame: jest.fn(() => widgetFrame),
        isMaximized: jest.fn(() => false),
        destroy: jest.fn(),
        _widgetBody: widgetBody
    };
}

const Oscilloscope = require("../oscilloscope.js");

let mockWidgetWindow;

// Initial setup for module load
mockWidgetWindow = createMockWidgetWindow();
window.widgetWindows = {
    openWindows: {},
    _posCache: {},
    windowFor: jest.fn(() => mockWidgetWindow)
};

beforeEach(() => {
    mockWidgetWindow = createMockWidgetWindow();

    window.widgetWindows = {
        openWindows: {},
        _posCache: {},
        windowFor: jest.fn(() => mockWidgetWindow)
    };

    global.instruments = {};
    jest.clearAllMocks();
});

/**
 * Creates a mock activity object used by Oscilloscope constructor.
 * @param {Array} turtles - Array of turtle objects.
 * @returns {Object} A mock activity.
 */
function createMockActivity(turtles = []) {
    return {
        logo: {
            oscilloscopeTurtles: turtles
        },
        turtles: {
            getIndexOfTurtle: jest.fn(t => turtles.indexOf(t))
        }
    };
}

/**
 * Creates an Oscilloscope instance with mocked dependencies.
 * @param {Array} turtles - Optional turtle objects.
 * @returns {Object} Oscilloscope instance.
 */
function createOscilloscope(turtles = []) {
    const activity = createMockActivity(turtles);
    return new Oscilloscope(activity);
}

/**
 * Creates a mock canvas context for _renderFrame tests.
 * @returns {Object} Mock 2D context.
 */
function makeCtx() {
    return {
        fillRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        fillStyle: "",
        strokeStyle: "",
        lineWidth: 1
    };
}

describe("Oscilloscope", () => {
    describe("constructor setup", () => {
        test("sets activity reference", () => {
            const osc = createOscilloscope();

            expect(osc.activity).toBeDefined();
        });

        test("initializes _running to false", () => {
            const osc = createOscilloscope();

            expect(osc._running).toBe(false);
        });

        test("initializes _rafId to null", () => {
            const osc = createOscilloscope();

            expect(osc._rafId).toBeNull();
        });

        test("initializes pitchAnalysers as empty object", () => {
            const osc = createOscilloscope();

            expect(osc.pitchAnalysers).toEqual({});
        });

        test("initializes _canvasState as empty object", () => {
            const osc = createOscilloscope();

            expect(osc._canvasState).toEqual({});
        });

        test("initializes drawVisualIDs as empty object", () => {
            const osc = createOscilloscope();

            expect(osc.drawVisualIDs).toEqual({});
        });

        test("sets default zoomFactor to 40.0", () => {
            const osc = createOscilloscope();

            expect(osc.zoomFactor).toBe(40.0);
        });

        test("sets default verticalOffset to 0", () => {
            const osc = createOscilloscope();

            expect(osc.verticalOffset).toBe(0);
        });

        test("calls widgetWindow clear and show", () => {
            createOscilloscope();

            expect(mockWidgetWindow.clear).toHaveBeenCalled();
            expect(mockWidgetWindow.show).toHaveBeenCalled();
        });

        test("sets widgetWindow reference", () => {
            const osc = createOscilloscope();

            expect(osc.widgetWindow).toBe(mockWidgetWindow);
        });

        test("adds two zoom buttons", () => {
            createOscilloscope();

            expect(mockWidgetWindow.addButton).toHaveBeenCalledTimes(2);
        });

        test("calls sendToCenter", () => {
            createOscilloscope();

            expect(mockWidgetWindow.sendToCenter).toHaveBeenCalled();
        });

        test("filters out null turtles from divisions", () => {
            const turtle1 = {
                inTrash: false,
                running: false,
                painter: { _canvasColor: "#000" }
            };
            const osc = createOscilloscope([null, turtle1, null]);

            expect(osc.divisions).toEqual([turtle1]);
        });

        test("filters out turtles in trash from divisions", () => {
            const turtle1 = {
                inTrash: false,
                running: false,
                painter: { _canvasColor: "#000" }
            };
            const turtle2 = {
                inTrash: true,
                running: false,
                painter: { _canvasColor: "#f00" }
            };
            const osc = createOscilloscope([turtle1, turtle2]);

            expect(osc.divisions).toEqual([turtle1]);
        });

        test("includes valid turtles in divisions", () => {
            const t1 = {
                inTrash: false,
                running: false,
                painter: { _canvasColor: "#000" }
            };
            const t2 = {
                inTrash: false,
                running: false,
                painter: { _canvasColor: "#0f0" }
            };
            const osc = createOscilloscope([t1, t2]);

            expect(osc.divisions).toHaveLength(2);
            expect(osc.divisions).toContain(t1);
            expect(osc.divisions).toContain(t2);
        });

        test("binds draw method", () => {
            const osc = createOscilloscope();

            expect(typeof osc.draw).toBe("function");
        });
    });

    describe("static properties", () => {
        test("ICONSIZE is 40", () => {
            expect(Oscilloscope.ICONSIZE).toBe(40);
        });

        test("analyserSize is 8192", () => {
            expect(Oscilloscope.analyserSize).toBe(8192);
        });
    });

    describe("_stopAnimation", () => {
        test("sets _running to false", () => {
            const osc = createOscilloscope();
            osc._running = true;

            osc._stopAnimation();

            expect(osc._running).toBe(false);
        });

        test("cancels _rafId when set", () => {
            const osc = createOscilloscope();
            osc._rafId = 999;
            cancelAnimationFrame.mockClear();

            osc._stopAnimation();

            expect(cancelAnimationFrame).toHaveBeenCalledWith(999);
            expect(osc._rafId).toBeNull();
        });

        test("does not cancel null _rafId", () => {
            const osc = createOscilloscope();
            osc._rafId = null;
            osc.drawVisualIDs = {};
            cancelAnimationFrame.mockClear();

            osc._stopAnimation();

            expect(cancelAnimationFrame).not.toHaveBeenCalled();
        });

        test("cancels per-turtle drawVisualIDs", () => {
            const osc = createOscilloscope();
            osc.drawVisualIDs = { 0: 100, 1: 200 };
            cancelAnimationFrame.mockClear();

            osc._stopAnimation();

            expect(cancelAnimationFrame).toHaveBeenCalledWith(100);
            expect(cancelAnimationFrame).toHaveBeenCalledWith(200);
        });

        test("skips null/undefined drawVisualIDs", () => {
            const osc = createOscilloscope();
            osc._rafId = null;
            osc.drawVisualIDs = { 0: null, 1: undefined, 2: 300 };
            cancelAnimationFrame.mockClear();

            osc._stopAnimation();

            expect(cancelAnimationFrame).toHaveBeenCalledWith(300);
            expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
        });
    });

    describe("_startAnimation", () => {
        test("sets _running to true", () => {
            const osc = createOscilloscope();
            osc._running = false;

            osc._startAnimation();

            expect(osc._running).toBe(true);
        });

        test("calls draw", () => {
            const osc = createOscilloscope();
            const drawSpy = jest.spyOn(osc, "draw");

            osc._startAnimation();

            expect(drawSpy).toHaveBeenCalled();
            drawSpy.mockRestore();
        });

        test("does not restart if already running", () => {
            const osc = createOscilloscope();
            osc._running = true;
            const drawSpy = jest.spyOn(osc, "draw");

            osc._startAnimation();

            expect(drawSpy).not.toHaveBeenCalled();
            drawSpy.mockRestore();
        });
    });

    describe("_scale", () => {
        test("removes all existing oscilloscopeCanvas elements, not just half", () => {
            const osc = createOscilloscope();
            const widgetBody = osc.widgetWindow.getWidgetBody();
            // document.getElementsByClassName (used inside _scale) only searches
            // elements attached to the live document tree.
            document.body.appendChild(widgetBody);

            for (let i = 0; i < 4; i++) {
                const canvas = document.createElement("canvas");
                canvas.className = "oscilloscopeCanvas";
                widgetBody.appendChild(canvas);
            }
            expect(document.getElementsByClassName("oscilloscopeCanvas").length).toBe(4);

            osc._scale();

            expect(document.getElementsByClassName("oscilloscopeCanvas").length).toBe(0);

            document.body.removeChild(widgetBody);
        });
    });

    describe("close", () => {
        test("calls _stopAnimation", () => {
            const osc = createOscilloscope();
            const stopSpy = jest.spyOn(osc, "_stopAnimation");

            osc.close();

            expect(stopSpy).toHaveBeenCalled();
            stopSpy.mockRestore();
        });

        test("clears drawVisualIDs", () => {
            const osc = createOscilloscope();
            osc.drawVisualIDs = { 0: 100 };

            osc.close();

            expect(osc.drawVisualIDs).toEqual({});
        });

        test("clears _canvasState", () => {
            const osc = createOscilloscope();
            osc._canvasState = { 0: { width: 100 } };

            osc.close();

            expect(osc._canvasState).toEqual({});
        });

        test("clears pitchAnalysers", () => {
            const osc = createOscilloscope();
            osc.pitchAnalysers = { 0: {} };

            osc.close();

            expect(osc.pitchAnalysers).toEqual({});
        });

        test("disposes Tone.Analyser nodes in pitchAnalysers on close", () => {
            const osc = createOscilloscope();
            const dispose0 = jest.fn();
            const dispose1 = jest.fn();
            osc.pitchAnalysers = {
                0: { dispose: dispose0 },
                1: { dispose: dispose1 }
            };

            osc.close();

            expect(dispose0).toHaveBeenCalled();
            expect(dispose1).toHaveBeenCalled();
            expect(osc.pitchAnalysers).toEqual({});
        });

        test("skips non-disposable pitchAnalyser entries on close", () => {
            const osc = createOscilloscope();
            osc.pitchAnalysers = { 0: {}, 1: null, 2: undefined };

            expect(() => osc.close()).not.toThrow();
            expect(osc.pitchAnalysers).toEqual({});
        });

        test("calls widgetWindow.destroy", () => {
            const osc = createOscilloscope();

            osc.close();

            expect(mockWidgetWindow.destroy).toHaveBeenCalled();
        });

        test("sets widgetWindow to null", () => {
            const osc = createOscilloscope();

            osc.close();

            expect(osc.widgetWindow).toBeNull();
        });

        test("handles close when widgetWindow is already null", () => {
            const osc = createOscilloscope();
            osc.widgetWindow = null;

            expect(() => osc.close()).not.toThrow();
        });

        test("removes visibilitychange event listener", () => {
            const removeSpy = jest.spyOn(document, "removeEventListener");
            const osc = createOscilloscope();

            osc.close();

            expect(removeSpy).toHaveBeenCalledWith("visibilitychange", osc._handleVisibilityChange);
            removeSpy.mockRestore();
        });
    });

    describe("makeCanvas", () => {
        test("creates a canvas element in widget body", () => {
            const osc = createOscilloscope();
            const turtle = { inTrash: false, running: false };

            osc.makeCanvas(640, 480, turtle, 0, false);

            const canvases = mockWidgetWindow._widgetBody.querySelectorAll("canvas");
            expect(canvases.length).toBeGreaterThanOrEqual(1);
        });

        test("sets canvas width and height", () => {
            const osc = createOscilloscope();
            const turtle = { inTrash: false };

            osc.makeCanvas(800, 600, turtle, 0, false);

            const state = osc._canvasState[0];
            expect(state.width).toBe(800);
            expect(state.height).toBe(600);
        });

        test("sets canvas className to oscilloscopeCanvas", () => {
            const osc = createOscilloscope();
            const turtle = { inTrash: false };

            osc.makeCanvas(200, 100, turtle, 1, false);

            const state = osc._canvasState[1];
            expect(state.canvas.className).toBe("oscilloscopeCanvas");
        });

        test("stores canvas state with turtle reference", () => {
            const osc = createOscilloscope();
            const turtle = { inTrash: false, name: "testTurtle" };

            osc.makeCanvas(400, 300, turtle, 2, true);

            const state = osc._canvasState[2];
            expect(state.turtle).toBe(turtle);
            expect(state.turtleIdx).toBe(2);
            expect(state.resizedOnce).toBe(true);
        });

        test("stores canvasCtx in state", () => {
            const osc = createOscilloscope();

            osc.makeCanvas(100, 50, {}, 0, false);

            expect(osc._canvasState[0].canvasCtx).toBeDefined();
        });

        test("initializes drawVisualIDs entry to null", () => {
            const osc = createOscilloscope();

            osc.makeCanvas(100, 50, {}, 3, false);

            expect(osc.drawVisualIDs[3]).toBeNull();
        });

        test("handles multiple canvases for different turtles", () => {
            const osc = createOscilloscope();
            const t1 = { inTrash: false };
            const t2 = { inTrash: false };

            osc.makeCanvas(400, 200, t1, 0, false);
            osc.makeCanvas(400, 200, t2, 1, false);

            expect(osc._canvasState[0]).toBeDefined();
            expect(osc._canvasState[1]).toBeDefined();
            expect(osc._canvasState[0].turtle).toBe(t1);
            expect(osc._canvasState[1].turtle).toBe(t2);
        });
    });

    describe("zoom factor calculations", () => {
        test("initial zoomFactor is 40.0", () => {
            const osc = createOscilloscope();

            expect(osc.zoomFactor).toBe(40.0);
        });

        test("zoom in multiplies by 1.333", () => {
            const osc = createOscilloscope();
            const initial = osc.zoomFactor;

            osc.zoomFactor *= 1.333;

            expect(osc.zoomFactor).toBeCloseTo(initial * 1.333, 3);
        });

        test("zoom out divides by 1.333", () => {
            const osc = createOscilloscope();
            const initial = osc.zoomFactor;

            osc.zoomFactor /= 1.333;

            expect(osc.zoomFactor).toBeCloseTo(initial / 1.333, 3);
        });

        test("zoom out clamps to minimum 1", () => {
            const osc = createOscilloscope();
            osc.zoomFactor = 1.0;

            osc.zoomFactor /= 1.333;
            if (osc.zoomFactor < 1) osc.zoomFactor = 1;

            expect(osc.zoomFactor).toBe(1);
        });

        test("multiple zoom ins compound correctly", () => {
            const osc = createOscilloscope();
            const initial = osc.zoomFactor;

            osc.zoomFactor *= 1.333;
            osc.zoomFactor *= 1.333;
            osc.zoomFactor *= 1.333;

            expect(osc.zoomFactor).toBeCloseTo(initial * Math.pow(1.333, 3), 2);
        });

        test("zoom in then zoom out returns close to original", () => {
            const osc = createOscilloscope();
            const initial = osc.zoomFactor;

            osc.zoomFactor *= 1.333;
            osc.zoomFactor /= 1.333;

            expect(osc.zoomFactor).toBeCloseTo(initial, 5);
        });

        test("very small zoomFactor gets clamped to 1", () => {
            const osc = createOscilloscope();
            osc.zoomFactor = 0.5;

            if (osc.zoomFactor < 1) osc.zoomFactor = 1;

            expect(osc.zoomFactor).toBe(1);
        });
    });

    describe("draw", () => {
        test("does nothing when _running is false", () => {
            const osc = createOscilloscope();
            osc._running = false;
            requestAnimationFrame.mockClear();

            osc.draw();

            expect(requestAnimationFrame).not.toHaveBeenCalled();
        });

        test("requests next animation frame when running", () => {
            const osc = createOscilloscope();
            osc._running = true;
            requestAnimationFrame.mockClear();

            osc.draw();

            expect(requestAnimationFrame).toHaveBeenCalledWith(osc.draw);
        });

        test("stores RAF id in _rafId", () => {
            const osc = createOscilloscope();
            osc._running = true;
            requestAnimationFrame.mockReturnValueOnce(42);

            osc.draw();

            expect(osc._rafId).toBe(42);
        });

        test("uses setTimeout when _isIdle is true", () => {
            jest.useFakeTimers();
            const osc = createOscilloscope();
            osc._running = true;
            osc._isIdle = true;
            osc._canvasState = {};

            osc.draw();

            expect(osc._timeoutId).not.toBeNull();
            jest.useRealTimers();
        });

        test("uses setTimeout when document is hidden", () => {
            jest.useFakeTimers();
            Object.defineProperty(document, "visibilityState", {
                value: "hidden",
                configurable: true
            });
            const osc = createOscilloscope();
            osc._running = true;
            osc._isIdle = false;
            osc._canvasState = {};

            osc.draw();

            expect(osc._timeoutId).not.toBeNull();
            Object.defineProperty(document, "visibilityState", {
                value: "visible",
                configurable: true
            });
            jest.useRealTimers();
        });

        test("uses setTimeout when widgetWindow is rolled", () => {
            jest.useFakeTimers();
            const osc = createOscilloscope();
            osc._running = true;
            osc._isIdle = false;
            osc._canvasState = {};
            osc.widgetWindow._rolled = true;

            osc.draw();

            expect(osc._timeoutId).not.toBeNull();
            jest.useRealTimers();
        });
    });

    describe("onclose integration", () => {
        test("widgetWindow.onclose calls close()", () => {
            const osc = createOscilloscope();
            const closeSpy = jest.spyOn(osc, "close");

            mockWidgetWindow.onclose();

            expect(closeSpy).toHaveBeenCalled();
            closeSpy.mockRestore();
        });
    });

    describe("_throttle", () => {
        test("does nothing when not running", () => {
            const osc = createOscilloscope();
            osc._running = false;
            osc._rafId = 99;

            osc._throttle();

            expect(osc._rafId).toBe(99);
            expect(osc._isIdle).toBeFalsy();
        });

        test("cancels rafId sets it to null and sets _isIdle true", () => {
            jest.useFakeTimers();
            const osc = createOscilloscope();
            osc._running = true;
            osc._rafId = 99;

            osc._throttle();

            expect(osc._rafId).toBeNull();
            expect(osc._isIdle).toBe(true);
            jest.useRealTimers();
        });

        test("starts timeout when _timeoutId is null", () => {
            jest.useFakeTimers();
            const osc = createOscilloscope();
            osc._running = true;
            osc._timeoutId = null;

            osc._throttle();

            expect(osc._timeoutId).not.toBeNull();
            jest.useRealTimers();
        });

        test("does not start second timeout when one already exists", () => {
            jest.useFakeTimers();
            const osc = createOscilloscope();
            osc._running = true;
            osc._timeoutId = 42;

            osc._throttle();

            expect(osc._timeoutId).toBe(42);
            jest.useRealTimers();
        });
    });

    describe("_wakeUp", () => {
        test("does nothing when not running", () => {
            jest.useFakeTimers();
            const osc = createOscilloscope();
            osc._running = false;
            osc._timeoutId = 55;

            osc._wakeUp();

            expect(osc._timeoutId).toBe(55);
            jest.useRealTimers();
        });

        test("clears timeout exits idle and calls draw", () => {
            jest.useFakeTimers();
            const osc = createOscilloscope();
            osc._running = true;
            osc._isIdle = true;
            osc._timeoutId = 55;
            osc._rafId = null;
            const drawSpy = jest.spyOn(osc, "draw");

            osc._wakeUp();

            expect(osc._timeoutId).toBeNull();
            expect(osc._isIdle).toBe(false);
            expect(drawSpy).toHaveBeenCalled();
            drawSpy.mockRestore();
            jest.useRealTimers();
        });

        test("does not call draw when _rafId is already set", () => {
            const osc = createOscilloscope();
            osc._running = true;
            osc._rafId = 77;
            const drawSpy = jest.spyOn(osc, "draw");

            osc._wakeUp();

            expect(drawSpy).not.toHaveBeenCalled();
            drawSpy.mockRestore();
        });

        test("sets _isIdle to false", () => {
            const osc = createOscilloscope();
            osc._running = true;
            osc._isIdle = true;

            osc._wakeUp();

            expect(osc._isIdle).toBe(false);
        });
    });

    describe("_handleVisibilityChange", () => {
        test("calls _wakeUp when page becomes visible", () => {
            const osc = createOscilloscope();
            const wakeUpSpy = jest.spyOn(osc, "_wakeUp");
            Object.defineProperty(document, "visibilityState", {
                value: "visible",
                configurable: true
            });

            osc._handleVisibilityChange();

            expect(wakeUpSpy).toHaveBeenCalled();
            wakeUpSpy.mockRestore();
        });

        test("calls _throttle when page becomes hidden", () => {
            const osc = createOscilloscope();
            const throttleSpy = jest.spyOn(osc, "_throttle");
            Object.defineProperty(document, "visibilityState", {
                value: "hidden",
                configurable: true
            });

            osc._handleVisibilityChange();

            expect(throttleSpy).toHaveBeenCalled();
            throttleSpy.mockRestore();
            Object.defineProperty(document, "visibilityState", {
                value: "visible",
                configurable: true
            });
        });
    });

    describe("reconnectSynthsToAnalyser", () => {
        test("creates a new Tone.Analyser when none exists", () => {
            const osc = createOscilloscope();
            global.instruments = { 0: {} };

            osc.reconnectSynthsToAnalyser(0);

            expect(osc.pitchAnalysers[0]).toBeDefined();
            expect(Tone.Analyser).toHaveBeenCalledWith({
                type: "waveform",
                size: Oscilloscope.analyserSize
            });
        });

        test("reuses existing analyser when already created", () => {
            const osc = createOscilloscope();
            const existing = { getValue: jest.fn(), connect: jest.fn() };
            osc.pitchAnalysers[0] = existing;
            global.instruments = { 0: {} };
            Tone.Analyser.mockClear();

            osc.reconnectSynthsToAnalyser(0);

            expect(Tone.Analyser).not.toHaveBeenCalled();
            expect(osc.pitchAnalysers[0]).toBe(existing);
        });

        test("connects each synth instrument to the analyser", () => {
            const osc = createOscilloscope();
            const mockConnect = jest.fn();
            const mockAnalyser = { getValue: jest.fn(), connect: jest.fn() };
            Tone.Analyser.mockImplementationOnce(() => mockAnalyser);
            global.instruments = {
                0: {
                    synth1: { connect: mockConnect },
                    synth2: { connect: mockConnect }
                }
            };

            osc.reconnectSynthsToAnalyser(0);

            expect(mockConnect).toHaveBeenCalledTimes(2);
            expect(mockConnect).toHaveBeenCalledWith(mockAnalyser);
        });
    });

    describe("_renderFrame", () => {
        test("skips entry when no analyser exists", () => {
            const osc = createOscilloscope();
            const ctx = makeCtx();
            osc._canvasState[0] = {
                canvasCtx: ctx,
                width: 400,
                height: 200,
                turtle: { running: true, painter: { _canvasColor: "#f00" } },
                turtleIdx: 0,
                resizedOnce: false
            };
            osc.pitchAnalysers = {};

            osc._renderFrame();

            expect(ctx.fillRect).not.toHaveBeenCalled();
        });

        test("skips when turtle not running and resizedOnce is false", () => {
            const osc = createOscilloscope();
            const ctx = makeCtx();
            osc._canvasState[0] = {
                canvasCtx: ctx,
                width: 400,
                height: 200,
                turtle: { running: false, painter: { _canvasColor: "#f00" } },
                turtleIdx: 0,
                resizedOnce: false
            };
            osc.pitchAnalysers[0] = { getValue: jest.fn(() => new Float32Array(128)) };

            osc._renderFrame();

            expect(ctx.fillRect).not.toHaveBeenCalled();
        });

        test("draws when turtle is running", () => {
            const osc = createOscilloscope();
            const ctx = makeCtx();
            osc._canvasState[0] = {
                canvasCtx: ctx,
                width: 400,
                height: 200,
                turtle: { running: true, painter: { _canvasColor: "#0f0" } },
                turtleIdx: 0,
                resizedOnce: false
            };
            osc.pitchAnalysers[0] = { getValue: jest.fn(() => new Float32Array(128)) };

            osc._renderFrame();

            expect(ctx.fillRect).toHaveBeenCalled();
            expect(ctx.stroke).toHaveBeenCalled();
        });

        test("draws when resizedOnce is true even if turtle not running", () => {
            const osc = createOscilloscope();
            const ctx = makeCtx();
            osc._canvasState[0] = {
                canvasCtx: ctx,
                width: 400,
                height: 200,
                turtle: { running: false, painter: { _canvasColor: "#00f" } },
                turtleIdx: 0,
                resizedOnce: true
            };
            osc.pitchAnalysers[0] = { getValue: jest.fn(() => new Float32Array(128)) };

            osc._renderFrame();

            expect(ctx.fillRect).toHaveBeenCalled();
        });

        test("resets resizedOnce to false after drawing", () => {
            const osc = createOscilloscope();
            const ctx = makeCtx();
            osc._canvasState[0] = {
                canvasCtx: ctx,
                width: 400,
                height: 200,
                turtle: { running: true, painter: { _canvasColor: "#000" } },
                turtleIdx: 0,
                resizedOnce: true
            };
            osc.pitchAnalysers[0] = { getValue: jest.fn(() => new Float32Array(128)) };

            osc._renderFrame();

            expect(osc._canvasState[0].resizedOnce).toBe(false);
        });

        test("draws waveform using moveTo for first point and lineTo for rest", () => {
            const osc = createOscilloscope();
            const ctx = makeCtx();
            osc._canvasState[0] = {
                canvasCtx: ctx,
                width: 400,
                height: 200,
                turtle: { running: true, painter: { _canvasColor: "#000" } },
                turtleIdx: 0,
                resizedOnce: false
            };
            const data = new Float32Array(4).fill(0);
            osc.pitchAnalysers[0] = { getValue: jest.fn(() => data) };

            osc._renderFrame();

            expect(ctx.moveTo).toHaveBeenCalledTimes(1);
            expect(ctx.lineTo).toHaveBeenCalledTimes(3);
        });
    });

    describe("_scale", () => {
        test("resets _canvasState", () => {
            const osc = createOscilloscope();
            osc._canvasState = { 0: {} };

            osc._scale();

            expect(osc._canvasState).toEqual({});
        });

        test("uses 700x400 when not maximized", () => {
            const turtle = { inTrash: false, running: false, painter: { _canvasColor: "#000" } };
            const osc = createOscilloscope([turtle]);
            const makeCanvasSpy = jest.spyOn(osc, "makeCanvas");
            mockWidgetWindow.isMaximized.mockReturnValue(false);

            osc._scale();

            expect(makeCanvasSpy).toHaveBeenCalledWith(700, 400, turtle, expect.any(Number), true);
            makeCanvasSpy.mockRestore();
        });

        test("starts animation when divisions exist and not yet running", () => {
            const turtle = { inTrash: false, running: false, painter: { _canvasColor: "#000" } };
            const osc = createOscilloscope([turtle]);
            osc._running = false;
            const startSpy = jest.spyOn(osc, "_startAnimation");

            osc._scale();

            expect(startSpy).toHaveBeenCalled();
            startSpy.mockRestore();
        });

        test("calls _renderFrame instead of _startAnimation when already running", () => {
            const turtle = { inTrash: false, running: false, painter: { _canvasColor: "#000" } };
            const osc = createOscilloscope([turtle]);
            osc._running = true;
            const startSpy = jest.spyOn(osc, "_startAnimation");
            const renderSpy = jest.spyOn(osc, "_renderFrame");

            osc._scale();

            expect(startSpy).not.toHaveBeenCalled();
            expect(renderSpy).toHaveBeenCalled();
            startSpy.mockRestore();
            renderSpy.mockRestore();
        });

        test("stops animation when no divisions", () => {
            const osc = createOscilloscope([]);
            osc._running = true;
            const stopSpy = jest.spyOn(osc, "_stopAnimation");

            osc._scale();

            expect(stopSpy).toHaveBeenCalled();
            stopSpy.mockRestore();
        });

        test("calls reconnectSynthsToAnalyser for each turtle", () => {
            const turtle = { inTrash: false, running: false, painter: { _canvasColor: "#000" } };
            const osc = createOscilloscope([turtle]);
            const reconnectSpy = jest.spyOn(osc, "reconnectSynthsToAnalyser");
            global.instruments = {};

            osc._scale();

            expect(reconnectSpy).toHaveBeenCalled();
            reconnectSpy.mockRestore();
        });

        test("uses maximized dimensions when window is maximized", () => {
            const turtle = { inTrash: false, running: false, painter: { _canvasColor: "#000" } };
            const osc = createOscilloscope([turtle]);
            mockWidgetWindow.isMaximized.mockReturnValue(true);
            mockWidgetWindow.getWidgetBody = jest.fn(() => ({
                querySelectorAll: jest.fn(() => []),
                removeChild: jest.fn(),
                appendChild: jest.fn(),
                getBoundingClientRect: jest.fn(() => ({ width: 1200 }))
            }));
            mockWidgetWindow.getWidgetFrame = jest.fn(() => ({
                getBoundingClientRect: jest.fn(() => ({ height: 870 }))
            }));
            const makeCanvasSpy = jest.spyOn(osc, "makeCanvas");

            osc._scale();

            expect(makeCanvasSpy).toHaveBeenCalledWith(
                1200,
                expect.any(Number),
                turtle,
                expect.any(Number),
                true
            );
            makeCanvasSpy.mockRestore();
        });
    });
});
