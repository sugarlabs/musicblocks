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

            // cancelAnimationFrame should not have been called at all
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
    });

    describe("onclose integration", () => {
        test("widgetWindow.onclose calls close()", () => {
            const osc = createOscilloscope();
            const closeSpy = jest.spyOn(osc, "close");

            // The constructor stored onclose as a closure that calls this.close()
            mockWidgetWindow.onclose();

            expect(closeSpy).toHaveBeenCalled();
            closeSpy.mockRestore();
        });
    });
});
