/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
 *
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

const Turtles = require("../turtles");
const { setupGridController } = require("../activity/grid-controller.js");

global.createjs = {
    Container: jest.fn().mockImplementation(() => ({
        addChild: jest.fn(),
        removeAllChildren: jest.fn(),
        on: jest.fn(),
        removeAllEventListeners: jest.fn()
    })),
    Bitmap: jest.fn().mockImplementation(() => ({}))
};

global.importMembers = jest.fn();
global.setupRhythmActions = jest.fn();
global.setupMeterActions = jest.fn();
global.setupPitchActions = jest.fn();
global.setupIntervalsActions = jest.fn();
global.setupToneActions = jest.fn();
global.setupOrnamentActions = jest.fn();
global.setupVolumeActions = jest.fn();
global.setupDrumActions = jest.fn();
global.setupDictActions = jest.fn();

global.LEADING = 35;
global.CARTESIANBUTTON = "";
global.CLEARBUTTON = "";
global.COLLAPSEBUTTON = "";
global.EXPANDBUTTON = "";
global.MBOUNDARY = "";
global.piemenuGrid = {};
global.base64Encode = jest.fn(str => str);

global.Turtle = jest.fn().mockImplementation(() => ({
    painter: {
        doSetHeading: jest.fn(),
        doSetPensize: jest.fn(),
        doSetChroma: jest.fn(),
        doSetValue: jest.fn(),
        doSetColor: jest.fn()
    },
    rename: jest.fn(),
    container: {
        scaleX: 1,
        scaleY: 1,
        scale: 1,
        on: jest.fn(),
        removeAllEventListeners: jest.fn()
    }
}));

/**
 * Helper to mix TurtlesModel and TurtlesView prototype methods into a Turtles instance,
 * mimicking what importMembers does at runtime.
 */
function mixinPrototypes(turtles) {
    const modelProto = Turtles.TurtlesModel.prototype;
    const viewProto = Turtles.TurtlesView.prototype;

    for (const key of Object.getOwnPropertyNames(modelProto)) {
        if (key !== "constructor" && !(key in turtles)) {
            const descriptor = Object.getOwnPropertyDescriptor(modelProto, key);
            Object.defineProperty(turtles, key, descriptor);
        }
    }

    for (const key of Object.getOwnPropertyNames(viewProto)) {
        if (key !== "constructor" && !(key in turtles)) {
            const descriptor = Object.getOwnPropertyDescriptor(viewProto, key);
            Object.defineProperty(turtles, key, descriptor);
        }
    }
}

function closeHelpfulWheel() {
    const helpfulWheelDiv = document.getElementById("helpfulWheelDiv");
    const wasOpen = Boolean(helpfulWheelDiv && helpfulWheelDiv.style.display !== "none");
    if (wasOpen) helpfulWheelDiv.style.display = "none";
    return wasOpen;
}

describe("Turtles Class", () => {
    let activityMock;
    let turtles;

    beforeEach(() => {
        activityMock = {
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            refreshCanvas: jest.fn(),
            turtleContainer: new createjs.Container(),
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            closeHelpfulWheel
        };

        turtles = new Turtles(activityMock);
        turtles.activity = activityMock;
        turtles.getTurtleCount = jest.fn().mockReturnValue(0);
        turtles.getTurtle = jest.fn(() => ({
            container: {
                scaleX: 1,
                scaleY: 1,
                scale: 1
            }
        }));

        turtles.pushTurtle = jest.fn();
        turtles.addTurtleStageProps = jest.fn();
        turtles.createArtwork = jest.fn();
        turtles.createHitArea = jest.fn();
        turtles.addTurtleGraphicProps = jest.fn();
        turtles.isShrunk = jest.fn().mockReturnValue(false);
        document.body.innerHTML = '<div id="loader"></div>';
        window.jQuery = jest.fn().mockReturnValue({
            tooltip: jest.fn()
        });
    });

    test("should initialize properly", () => {
        expect(turtles.activity).not.toBeUndefined();
        expect(global.importMembers).toHaveBeenCalledWith(turtles, "", [activityMock]);
    });

    test("should call initActions on construction", () => {
        const spy = jest.spyOn(turtles, "initActions");
        turtles.initActions();
        expect(spy).toHaveBeenCalled();
    });

    test("should add a turtle properly", () => {
        turtles.addTurtle({}, { id: 1, name: "TestTurtle" });

        expect(turtles.getTurtleCount).toHaveBeenCalled();
        expect(turtles.pushTurtle).toHaveBeenCalled();
        expect(turtles.addTurtleStageProps).toHaveBeenCalled();
        expect(turtles.createArtwork).toHaveBeenCalled();
        expect(turtles.createHitArea).toHaveBeenCalled();
        expect(turtles.addTurtleGraphicProps).toHaveBeenCalled();
        expect(turtles.isShrunk).toHaveBeenCalled();
    });

    test("should toggle running state correctly", () => {
        turtles.markAllAsStopped();
        expect(activityMock.refreshCanvas).toHaveBeenCalled();
    });
});

describe("markAllAsStopped", () => {
    let activityMock;
    let turtles;

    beforeEach(() => {
        activityMock = {
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            refreshCanvas: jest.fn(),
            turtleContainer: new createjs.Container(),
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            closeHelpfulWheel
        };

        turtles = new Turtles(activityMock);
        turtles.activity = activityMock;
    });

    test("should set running to false for all turtles", () => {
        const turtle1 = { running: true };
        const turtle2 = { running: true };
        const turtle3 = { running: true };

        turtles._turtleList = [turtle1, turtle2, turtle3];
        turtles.getTurtleCount = jest.fn().mockReturnValue(3);
        turtles.getTurtle = jest.fn(i => turtles._turtleList[i]);

        turtles.markAllAsStopped();

        expect(turtle1.running).toBe(false);
        expect(turtle2.running).toBe(false);
        expect(turtle3.running).toBe(false);
    });

    test("should call refreshCanvas after stopping all turtles", () => {
        turtles.getTurtleCount = jest.fn().mockReturnValue(0);
        turtles.markAllAsStopped();

        expect(activityMock.refreshCanvas).toHaveBeenCalled();
    });

    test("should handle empty turtle list", () => {
        turtles._turtleList = [];
        turtles.getTurtleCount = jest.fn().mockReturnValue(0);

        turtles.markAllAsStopped();

        expect(activityMock.refreshCanvas).toHaveBeenCalled();
    });

    test("should stop turtles that are already stopped without error", () => {
        const turtle1 = { running: false };
        const turtle2 = { running: true };

        turtles._turtleList = [turtle1, turtle2];
        turtles.getTurtleCount = jest.fn().mockReturnValue(2);
        turtles.getTurtle = jest.fn(i => turtles._turtleList[i]);

        turtles.markAllAsStopped();

        expect(turtle1.running).toBe(false);
        expect(turtle2.running).toBe(false);
    });
});

describe("Coordinate Conversion", () => {
    let activityMock;
    let turtles;

    beforeEach(() => {
        activityMock = {
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            refreshCanvas: jest.fn(),
            turtleContainer: new createjs.Container(),
            canvas: { width: 1200, height: 900, style: {} },
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            closeHelpfulWheel
        };

        turtles = new Turtles(activityMock);
        turtles.activity = activityMock;
        mixinPrototypes(turtles);
        turtles._canvas = activityMock.canvas;
        turtles._scale = 1.0;
    });

    describe("screenX2turtleX", () => {
        test("should convert screen center X to turtle X of 0", () => {
            // canvas.width=1200, scale=1.0 => center = 1200/(2*1) = 600
            const result = turtles.screenX2turtleX(600);
            expect(result).toBe(0);
        });

        test("should convert screen X 0 to negative turtle X", () => {
            // 0 - 600 = -600
            const result = turtles.screenX2turtleX(0);
            expect(result).toBe(-600);
        });

        test("should convert screen X at right edge to positive turtle X", () => {
            // 1200 - 600 = 600
            const result = turtles.screenX2turtleX(1200);
            expect(result).toBe(600);
        });

        test("should account for scale factor", () => {
            turtles._scale = 2.0;
            // center = 1200/(2*2) = 300
            // 450 - 300 = 150
            const result = turtles.screenX2turtleX(450);
            expect(result).toBe(150);
        });
    });

    describe("screenY2turtleY", () => {
        test("should convert screen center Y to turtle Y of 0", () => {
            // canvas.height=900, scale=1.0 => center = 900/(2*1) = 450
            // _invertY(450) = 450 - 450 = 0
            const result = turtles.screenY2turtleY(450);
            expect(result).toBe(0);
        });

        test("should convert screen Y 0 to positive turtle Y (inverted)", () => {
            // _invertY(0) = 450 - 0 = 450
            const result = turtles.screenY2turtleY(0);
            expect(result).toBe(450);
        });

        test("should convert screen Y at bottom to negative turtle Y", () => {
            // _invertY(900) = 450 - 900 = -450
            const result = turtles.screenY2turtleY(900);
            expect(result).toBe(-450);
        });

        test("should account for scale factor", () => {
            turtles._scale = 2.0;
            // center = 900/(2*2) = 225
            // _invertY(100) = 225 - 100 = 125
            const result = turtles.screenY2turtleY(100);
            expect(result).toBe(125);
        });
    });

    describe("turtleX2screenX", () => {
        test("should convert turtle X of 0 to screen center X", () => {
            // center = 1200/(2*1) = 600; 600 + 0 = 600
            const result = turtles.turtleX2screenX(0);
            expect(result).toBe(600);
        });

        test("should convert positive turtle X to screen X right of center", () => {
            // 600 + 100 = 700
            const result = turtles.turtleX2screenX(100);
            expect(result).toBe(700);
        });

        test("should convert negative turtle X to screen X left of center", () => {
            // 600 + (-200) = 400
            const result = turtles.turtleX2screenX(-200);
            expect(result).toBe(400);
        });

        test("should account for scale factor", () => {
            turtles._scale = 0.5;
            // center = 1200/(2*0.5) = 1200; 1200 + 50 = 1250
            const result = turtles.turtleX2screenX(50);
            expect(result).toBe(1250);
        });
    });

    describe("turtleY2screenY", () => {
        test("should convert turtle Y of 0 to screen center Y", () => {
            // _invertY(0) = 450 - 0 = 450
            const result = turtles.turtleY2screenY(0);
            expect(result).toBe(450);
        });

        test("should convert positive turtle Y to screen Y above center", () => {
            // _invertY(100) = 450 - 100 = 350
            const result = turtles.turtleY2screenY(100);
            expect(result).toBe(350);
        });

        test("should convert negative turtle Y to screen Y below center", () => {
            // _invertY(-200) = 450 - (-200) = 650
            const result = turtles.turtleY2screenY(-200);
            expect(result).toBe(650);
        });
    });

    describe("round-trip conversion", () => {
        test("screenX -> turtleX -> screenX should return original value", () => {
            const screenX = 300;
            const turtleX = turtles.screenX2turtleX(screenX);
            const backToScreen = turtles.turtleX2screenX(turtleX);
            expect(backToScreen).toBe(screenX);
        });

        test("screenY -> turtleY -> screenY should return original value", () => {
            const screenY = 200;
            const turtleY = turtles.screenY2turtleY(screenY);
            const backToScreen = turtles.turtleY2screenY(turtleY);
            expect(backToScreen).toBe(screenY);
        });

        test("round-trip should work with non-default scale", () => {
            turtles._scale = 1.5;
            const screenX = 400;
            const turtleX = turtles.screenX2turtleX(screenX);
            const backToScreen = turtles.turtleX2screenX(turtleX);
            expect(backToScreen).toBe(screenX);
        });
    });
});

describe("setBackgroundColor", () => {
    let activityMock;
    let turtles;

    beforeEach(() => {
        activityMock = {
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            refreshCanvas: jest.fn(),
            turtleContainer: new createjs.Container(),
            canvas: { width: 1200, height: 900, style: {} },
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            closeHelpfulWheel
        };

        turtles = new Turtles(activityMock);
        turtles.activity = activityMock;
        mixinPrototypes(turtles);
        turtles._canvas = activityMock.canvas;
        turtles._scale = 1.0;
        global.platformColor = { background: "#ffffff" };
        turtles._backgroundColor = platformColor.background;
        turtles.makeBackground = jest.fn();
        turtles._borderContainer = new createjs.Container();
    });

    test("should set default background color when index is -1", () => {
        turtles.setBackgroundColor(-1);

        expect(turtles._backgroundColor).toBe(platformColor.background);
        expect(activityMock.refreshCanvas).toHaveBeenCalled();
    });

    test("should set background color from turtle painter when index is valid", () => {
        const mockTurtle = {
            painter: {
                canvasColor: "#ff0000"
            }
        };
        turtles.getTurtle = jest.fn().mockReturnValue(mockTurtle);

        turtles.setBackgroundColor(0);

        expect(turtles._backgroundColor).toBe("#ff0000");
        expect(activityMock.refreshCanvas).toHaveBeenCalled();
    });

    test("should call makeBackground when setting color", () => {
        turtles.setBackgroundColor(-1);

        expect(turtles.makeBackground).toHaveBeenCalled();
    });

    test("should store background color before calling makeBackground", () => {
        turtles.makeBackground = jest.fn(() => {
            expect(turtles._backgroundColor).toBe(platformColor.background);
        });

        turtles.setBackgroundColor(-1);

        expect(turtles.makeBackground).toHaveBeenCalled();
    });
});

describe("doScale", () => {
    let activityMock;
    let turtles;

    beforeEach(() => {
        activityMock = {
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            refreshCanvas: jest.fn(),
            turtleContainer: new createjs.Container(),
            canvas: { width: 1200, height: 900, style: {} },
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            closeHelpfulWheel
        };

        turtles = new Turtles(activityMock);
        turtles.activity = activityMock;
        mixinPrototypes(turtles);
        turtles._canvas = activityMock.canvas;
        turtles._scale = 1.0;
        turtles._locked = false;
        turtles._queue = [];
        turtles._backgroundColor = "#ffffff";
        turtles.makeBackground = jest.fn();
        turtles._borderContainer = new createjs.Container();
    });

    test("should update scale, width, and height when not locked", () => {
        turtles.doScale(800, 600, 2.0);

        expect(turtles._scale).toBe(2.0);
        expect(turtles._w).toBe(400); // 800 / 2.0
        expect(turtles._h).toBe(300); // 600 / 2.0
    });

    test("should queue values when locked", () => {
        turtles._locked = true;
        turtles.doScale(800, 600, 2.0);

        expect(turtles._queue).toEqual([800, 600, 2.0]);
    });

    test("should not change scale when locked", () => {
        turtles._locked = true;
        const originalScale = turtles._scale;
        turtles.doScale(800, 600, 2.0);

        expect(turtles._scale).toBe(originalScale);
    });
});

describe("setStageScale", () => {
    let activityMock;
    let turtles;

    beforeEach(() => {
        activityMock = {
            stage: { addChild: jest.fn(), removeChild: jest.fn(), scaleX: 1, scaleY: 1 },
            refreshCanvas: jest.fn(),
            turtleContainer: new createjs.Container(),
            canvas: { width: 1200, height: 900, style: {} },
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            closeHelpfulWheel
        };

        turtles = new Turtles(activityMock);
        turtles.activity = activityMock;
        mixinPrototypes(turtles);
        turtles._canvas = activityMock.canvas;
        turtles._stage = {
            scaleX: 1,
            scaleY: 1,
            addChild: jest.fn()
        };
    });

    test("should set scaleX and scaleY on the stage", () => {
        turtles.setStageScale(0.5);

        expect(turtles.stage.scaleX).toBe(0.5);
        expect(turtles.stage.scaleY).toBe(0.5);
    });

    test("should call refreshCanvas after setting scale", () => {
        turtles.setStageScale(0.75);

        expect(activityMock.refreshCanvas).toHaveBeenCalled();
    });
});

describe("aux toolbar collapse and expand", () => {
    let activityMock;
    let turtles;
    let originalImage;
    let originalDocById;

    beforeEach(() => {
        originalImage = global.Image;
        // Extend the real Image so DOM methods like setAttribute work,
        // but trigger onload when src is set (needed by makeBackground internals).
        global.Image = class extends originalImage {
            set src(_value) {
                if (typeof this.onload === "function") {
                    this.onload();
                }
            }
            get src() {
                return "";
            }
        };

        originalDocById = global.docById;
        global.docById = jest.fn(id => document.getElementById(id));
        global._ = jest.fn(str => str);

        window.jQuery = jest.fn().mockReturnValue({
            tooltip: jest.fn()
        });
        window.jQuery.noConflict = jest.fn(() => () => ({
            each: jest.fn()
        }));

        activityMock = {
            stage: {
                addChild: jest.fn(),
                removeChild: jest.fn(),
                removeAllEventListeners: jest.fn(),
                on: jest.fn(),
                x: 0,
                y: 0
            },
            refreshCanvas: jest.fn(),
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            helpfulWheelItems: [
                { label: "Expand", display: false },
                { label: "Collapse", display: true },
                { label: "Grid", display: true }
            ],
            __tick: jest.fn(),
            _doCartesianPolar: jest.fn(),
            closeHelpfulWheel
        };

        document.body.innerHTML = `
            <div id="aux-toolbar" style="display:block"></div>
            <div id="menu"></div>
            <button id="toggleAuxBtn" class="blue darken-1"></button>
            <div id="helpfulWheelDiv" style="display:block"></div>
            <div id="buttoncontainerTOP"></div>
        `;

        turtles = new Turtles(activityMock);
        turtles.activity = activityMock;
        mixinPrototypes(turtles);
        turtles._stage = activityMock.stage;
        turtles._w = 1200;
        turtles._h = 900;
        turtles.hideMenu = jest.fn();
        turtles.setStageScale = jest.fn();
        turtles.getTurtleCount = jest.fn().mockReturnValue(0);
        turtles.getTurtle = jest.fn();
        turtles.masterStage = {
            removeChild: jest.fn(),
            addChild: jest.fn(),
            addChildAt: jest.fn()
        };
        turtles._borderContainer = new createjs.Container();
        turtles._collapsedBoundary = { visible: false };
        turtles._expandedBoundary = { visible: true };
        turtles._canvas = { style: {} };
        turtles.currentGrid = null;

        // Call the real makeBackground to create the real collapse/expand closures
        turtles.makeBackground();

        // Stub UI objects that collapse()/expand() access but are created
        // asynchronously inside makeBackground() (via Image.onload chain).
        turtles._expandButton ??= {
            style: { visibility: "hidden" }
        };
        turtles._collapseButton ??= {
            style: { visibility: "visible" }
        };
        turtles.gridButton ??= {
            style: { visibility: "visible" },
            scaleX: 1,
            scaleY: 1,
            scale: 1,
            x: 0,
            visible: true
        };
        turtles._clearButton ??= {
            scaleX: 1,
            scaleY: 1,
            scale: 1,
            x: 0
        };
    });

    afterEach(() => {
        global.Image = originalImage;
        global.docById = originalDocById;
    });

    test("collapse removes highlight classes from auxiliary toolbar button", () => {
        const btn = document.getElementById("toggleAuxBtn");
        btn.className = "blue darken-1";

        turtles.collapse();

        expect(btn.classList.contains("blue")).toBe(false);
        expect(btn.classList.contains("darken-1")).toBe(false);
        expect(turtles.hideMenu).toHaveBeenCalled();
        expect(turtles.setStageScale).toHaveBeenCalledWith(0.25);
        expect(activityMock.hideGrids).toHaveBeenCalled();
        expect(activityMock.__tick).toHaveBeenCalled();
    });

    test("expand removes highlight classes from auxiliary toolbar button", () => {
        const btn = document.getElementById("toggleAuxBtn");
        btn.className = "blue darken-1";

        turtles.expand();

        expect(btn.classList.contains("blue")).toBe(false);
        expect(btn.classList.contains("darken-1")).toBe(false);
        expect(turtles.hideMenu).toHaveBeenCalled();
        expect(turtles.setStageScale).toHaveBeenCalledWith(1.0);
    });
});

describe("TurtlesModel doGrid initialization order", () => {
    // Regression guard for the bug where setupGridController() was called after
    // new Turtles(), causing TurtlesModel to capture undefined for _doGrid and
    // making activity.turtles.doGrid() throw at runtime.
    // activity.js must call setupGridController() before new Turtles().

    function makeModelActivity() {
        return {
            stage: new createjs.Container(),
            turtleContainer: new createjs.Container(),
            canvas: {},
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            closeHelpfulWheel
        };
    }

    // In the test environment importMembers is mocked, so new Turtles() does not
    // run the TurtlesModel constructor.  Use Reflect.construct to create an
    // object whose prototype is Turtles.prototype (giving it the doGrid getter)
    // while executing the TurtlesModel constructor (which captures _doGrid).
    // This mirrors what importMembers does at runtime.
    function buildTurtles(activity) {
        return Reflect.construct(Turtles.TurtlesModel, [activity], Turtles);
    }

    test("doGrid is callable when setupGridController runs before Turtles construction", () => {
        const activity = makeModelActivity();
        setupGridController(activity);
        const turtles = buildTurtles(activity);

        expect(typeof turtles.doGrid).toBe("function");
        expect(() => turtles.doGrid(0)).not.toThrow();
    });

    test("calling doGrid dispatches to activity._doCartesianPolar", () => {
        const activity = makeModelActivity();
        setupGridController(activity);
        // Spy after setupGridController so the spy is what TurtlesModel captures
        const spy = jest.spyOn(activity, "_doCartesianPolar");
        const turtles = buildTurtles(activity);

        turtles.doGrid(0);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test("setupGridController does not access activity.turtles during initialisation", () => {
        // Verifies it is safe to call setupGridController before new Turtles().
        const activity = makeModelActivity();
        Object.defineProperty(activity, "turtles", {
            get() {
                throw new Error("activity.turtles must not be read during setupGridController");
            },
            configurable: true
        });

        expect(() => setupGridController(activity)).not.toThrow();
    });
});

describe("turtleCount", () => {
    let turtles;

    beforeEach(() => {
        turtles = {
            getTurtleCount: jest.fn(),
            getTurtle: jest.fn(),
            turtleCount: Turtles.TurtlesModel.prototype.turtleCount
        };
    });

    test("counts all turtles when there are no companions and none in trash", () => {
        turtles.getTurtleCount.mockReturnValue(3);
        turtles.getTurtle.mockImplementation(t => ({ companionTurtle: undefined, inTrash: false }));

        expect(turtles.turtleCount()).toBe(3);
    });

    test("does not count turtles in trash", () => {
        turtles.getTurtleCount.mockReturnValue(3);
        turtles.getTurtle.mockImplementation(t => ({
            companionTurtle: undefined,
            inTrash: t === 1
        }));

        expect(turtles.turtleCount()).toBe(2);
    });

    test("does not count turtles that are claimed as companions", () => {
        turtles.getTurtleCount.mockReturnValue(3);
        // 0 points to 1
        turtles.getTurtle.mockImplementation(t => {
            if (t === 0) return { companionTurtle: 1, inTrash: false };
            return { companionTurtle: undefined, inTrash: false };
        });

        // Turtle 0: points to 1. Not claimed. Counted.
        // Turtle 1: claimed by 0. Not counted.
        // Turtle 2: Not claimed. Counted.
        expect(turtles.turtleCount()).toBe(2);
    });

    test("counts self-referencing turtles if no one else claims them first", () => {
        turtles.getTurtleCount.mockReturnValue(1);
        turtles.getTurtle.mockImplementation(t => ({ companionTurtle: t, inTrash: false }));

        expect(turtles.turtleCount()).toBe(1);
    });

    test("does not count a self-referencing turtle if someone else claims it first", () => {
        turtles.getTurtleCount.mockReturnValue(2);
        // 0 points to 1. 1 points to 1.
        turtles.getTurtle.mockImplementation(t => {
            if (t === 0) return { companionTurtle: 1, inTrash: false };
            if (t === 1) return { companionTurtle: 1, inTrash: false };
        });

        expect(turtles.turtleCount()).toBe(1);
    });
});

// ---------------------------------------------------------------------------
// removeTurtle — stage cleanup
// ---------------------------------------------------------------------------

describe("TurtlesModel.removeTurtle", () => {
    let stage;
    let model;

    // importMembers is mocked in this file, so new Turtles() never runs the
    // TurtlesModel constructor. Construct the model directly, the same way the
    // doGrid tests above do, so removeTurtle is actually present.
    const makeModel = () => {
        stage = { addChild: jest.fn(), removeChild: jest.fn() };
        const activity = {
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            turtleContainer: stage,
            canvas: {},
            hideAuxMenu: jest.fn(),
            doClear: jest.fn(),
            hideGrids: jest.fn(),
            refreshCanvas: jest.fn()
        };
        return new Turtles.TurtlesModel(activity);
    };

    const makeTurtle = (overrides = {}) => ({
        imageContainer: { id: "image" },
        penstrokes: { id: "pen" },
        container: { id: "body" },
        ...overrides
    });

    beforeEach(() => {
        model = makeModel();
        stage.addChild.mockClear();
        stage.removeChild.mockClear();
    });

    // add() attaches imageContainer, penstrokes and container to the stage for
    // every turtle. Leaving them behind keeps the turtle in the display list,
    // so it still costs a walk on every frame and whatever it displayed stays
    // on screen.
    it("detaches the three children that were attached to the stage", () => {
        const turtle = makeTurtle();
        model._turtleList = [turtle];

        model.removeTurtle(0);

        expect(stage.removeChild).toHaveBeenCalledWith(turtle.imageContainer);
        expect(stage.removeChild).toHaveBeenCalledWith(turtle.penstrokes);
        expect(stage.removeChild).toHaveBeenCalledWith(turtle.container);
        expect(stage.removeChild).toHaveBeenCalledTimes(3);
    });

    it("drops the turtle from the list", () => {
        const a = makeTurtle();
        const b = makeTurtle();
        model._turtleList = [a, b];

        model.removeTurtle(0);

        expect(model._turtleList).toEqual([b]);
    });

    it("still clears a pending interval", () => {
        const clearSpy = jest.spyOn(global, "clearInterval");
        const turtle = makeTurtle({ interval: 4242 });
        model._turtleList = [turtle];

        model.removeTurtle(0);

        expect(clearSpy).toHaveBeenCalledWith(4242);
        expect(turtle.interval).toBeUndefined();
        clearSpy.mockRestore();
    });

    it("skips children the turtle never had", () => {
        const turtle = makeTurtle({ imageContainer: null, penstrokes: null });
        model._turtleList = [turtle];

        expect(() => model.removeTurtle(0)).not.toThrow();
        expect(stage.removeChild).toHaveBeenCalledTimes(1);
        expect(stage.removeChild).toHaveBeenCalledWith(turtle.container);
    });

    it("removes the turtle even when the stage is unavailable", () => {
        const turtle = makeTurtle();
        model._turtleList = [turtle];
        model._stage = null;

        expect(() => model.removeTurtle(0)).not.toThrow();
        expect(model._turtleList).toEqual([]);
    });

    it.each([
        ["a negative index", -1],
        ["an index past the end", 5]
    ])("leaves the list untouched for %s", (label, index) => {
        const turtle = makeTurtle();
        model._turtleList = [turtle];

        model.removeTurtle(index);

        expect(model._turtleList).toEqual([turtle]);
        expect(stage.removeChild).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// TurtlesModel: the turtle list
//
// Every lookup in the codebase goes through these, and getTurtle throws rather
// than returning undefined, so the callers above it rely on that. The model is
// constructed directly because importMembers is mocked in this file, so a bare
// new Turtles() never runs the model constructor.
// ---------------------------------------------------------------------------

describe("TurtlesModel turtle list", () => {
    let model;

    /**
     * Builds a model with the activity fields its constructor reads.
     * @returns {Object} A TurtlesModel with an empty turtle list.
     */
    function makeModel() {
        const activity = {
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            turtleContainer: { addChild: jest.fn(), removeChild: jest.fn() },
            canvas: { width: 1200, height: 900 },
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            refreshCanvas: jest.fn()
        };
        return new Turtles.TurtlesModel(activity);
    }

    /**
     * Builds a turtle with the fields these methods actually read.
     * @param {Object} overrides - fields to set on the turtle
     * @returns {Object} A turtle stand-in.
     */
    const makeTurtle = (overrides = {}) => ({
        running: false,
        companionTurtle: null,
        container: { x: 0, y: 0 },
        ...overrides
    });

    beforeEach(() => {
        model = makeModel();
    });

    describe("constructor", () => {
        it("wires the stage and the callbacks the view later calls", () => {
            const activity = {
                stage: { addChild: jest.fn(), removeChild: jest.fn() },
                turtleContainer: { addChild: jest.fn(), removeChild: jest.fn() },
                canvas: { width: 800 },
                hideAuxMenu: jest.fn(),
                hideGrids: jest.fn(),
                _doCartesianPolar: jest.fn(),
                refreshCanvas: jest.fn()
            };

            const m = new Turtles.TurtlesModel(activity);

            expect(m._masterStage).toBe(activity.stage);
            expect(m._stage).toBe(activity.turtleContainer);
            expect(m._canvas).toBe(activity.canvas);
            expect(m._hideMenu).toBe(activity.hideAuxMenu);
            expect(m._hideGrids).toBe(activity.hideGrids);
            expect(m._doGrid).toBe(activity._doCartesianPolar);
        });

        it("attaches its border container to the stage", () => {
            const turtleContainer = { addChild: jest.fn(), removeChild: jest.fn() };
            const activity = {
                stage: { addChild: jest.fn(), removeChild: jest.fn() },
                turtleContainer,
                canvas: {},
                hideAuxMenu: jest.fn(),
                hideGrids: jest.fn(),
                _doCartesianPolar: jest.fn(),
                refreshCanvas: jest.fn()
            };

            const m = new Turtles.TurtlesModel(activity);

            expect(turtleContainer.addChild).toHaveBeenCalledWith(m._borderContainer);
        });

        it("starts with an empty turtle list", () => {
            expect(model._turtleList).toEqual([]);
            expect(model.getTurtleCount()).toBe(0);
        });
    });

    describe("initializeTurtleList", () => {
        it("replaces the list with the one it is given", () => {
            const a = makeTurtle();
            const b = makeTurtle();
            model.pushTurtle(makeTurtle());

            model.initializeTurtleList([a, b]);

            expect(model._turtleList).toEqual([a, b]);
            expect(model.getTurtleCount()).toBe(2);
        });

        it("accepts an empty list, which is how the workspace is cleared", () => {
            model.pushTurtle(makeTurtle());

            model.initializeTurtleList([]);

            expect(model._turtleList).toEqual([]);
            expect(model.getTurtleCount()).toBe(0);
        });
    });

    describe("pushTurtle", () => {
        it("appends the turtle and the count follows", () => {
            const first = makeTurtle();
            const second = makeTurtle();

            model.pushTurtle(first);
            model.pushTurtle(second);

            expect(model._turtleList).toEqual([first, second]);
            expect(model.getTurtleCount()).toBe(2);
        });

        it("ignores a turtle that is already in the list", () => {
            const turtle = makeTurtle();

            model.pushTurtle(turtle);
            model.pushTurtle(turtle);

            expect(model._turtleList).toEqual([turtle]);
            expect(model.getTurtleCount()).toBe(1);
        });

        it("keeps two turtles that merely look alike", () => {
            // Membership is by identity, so equal-looking turtles are distinct.
            model.pushTurtle(makeTurtle());
            model.pushTurtle(makeTurtle());

            expect(model.getTurtleCount()).toBe(2);
        });
    });

    describe("getTurtle", () => {
        it("returns the turtle at that position", () => {
            const first = makeTurtle();
            const second = makeTurtle();
            model.initializeTurtleList([first, second]);

            expect(model.getTurtle(0)).toBe(first);
            expect(model.getTurtle(1)).toBe(second);
        });

        it.each([
            ["an index past the end", 5],
            ["a negative index", -1],
            ["an index into an empty list", 0]
        ])("throws for %s", (_label, index) => {
            if (index !== 0) model.initializeTurtleList([makeTurtle()]);

            expect(() => model.getTurtle(index)).toThrow(`Turtle ${index} not found`);
        });

        it("returns turtle 0 rather than treating the index as unset", () => {
            const only = makeTurtle();
            model.initializeTurtleList([only]);

            expect(model.getTurtle(0)).toBe(only);
        });
    });

    describe("getIndexOfTurtle", () => {
        it("reports the position of a turtle in the list", () => {
            const first = makeTurtle();
            const second = makeTurtle();
            const third = makeTurtle();
            model.initializeTurtleList([first, second, third]);

            expect(model.getIndexOfTurtle(first)).toBe(0);
            expect(model.getIndexOfTurtle(second)).toBe(1);
            expect(model.getIndexOfTurtle(third)).toBe(2);
        });

        it("reports minus one for a turtle that is not in the list", () => {
            model.initializeTurtleList([makeTurtle()]);

            expect(model.getIndexOfTurtle(makeTurtle())).toBe(-1);
        });

        it("reports minus one when the list is empty", () => {
            expect(model.getIndexOfTurtle(makeTurtle())).toBe(-1);
        });
    });

    describe("ithTurtle", () => {
        it("resolves to the same turtle getTurtle returns", () => {
            const first = makeTurtle();
            const second = makeTurtle();
            model.initializeTurtleList([first, second]);

            expect(model.ithTurtle(0)).toBe(first);
            expect(model.ithTurtle(1)).toBe(second);
        });

        it("throws on a missing index, the same as getTurtle", () => {
            expect(() => model.ithTurtle(3)).toThrow("Turtle 3 not found");
        });
    });

    describe("running", () => {
        it("is false when no turtle is running", () => {
            model.initializeTurtleList([makeTurtle(), makeTurtle()]);

            expect(model.running()).toBe(false);
        });

        it("is false for an empty list", () => {
            expect(model.running()).toBe(false);
        });

        it.each([
            ["the first", 0],
            ["the last", 2]
        ])("is true when %s turtle is running", (_label, index) => {
            const turtles = [makeTurtle(), makeTurtle(), makeTurtle()];
            turtles[index].running = true;
            model.initializeTurtleList(turtles);

            expect(model.running()).toBe(true);
        });
    });

    describe("companionTurtle", () => {
        it("finds the turtle that claims the given one as its companion", () => {
            const turtles = [
                makeTurtle({ companionTurtle: null }),
                makeTurtle({ companionTurtle: 0 }),
                makeTurtle({ companionTurtle: null })
            ];
            model.initializeTurtleList(turtles);

            expect(model.companionTurtle(0)).toBe(1);
        });

        it("returns the index unchanged when no turtle claims it", () => {
            model.initializeTurtleList([makeTurtle(), makeTurtle()]);

            expect(model.companionTurtle(1)).toBe(1);
        });

        it("returns the index unchanged for an empty list", () => {
            expect(model.companionTurtle(4)).toBe(4);
        });

        it("matches a companion index of 0, rather than skipping it as unset", () => {
            // 0 is a real turtle index, so a truth test here would miss it.
            model.initializeTurtleList([makeTurtle({ companionTurtle: 0 })]);

            expect(model.companionTurtle(0)).toBe(0);
        });

        it("returns the first claimer when more than one turtle claims it", () => {
            model.initializeTurtleList([
                makeTurtle({ companionTurtle: null }),
                makeTurtle({ companionTurtle: 0 }),
                makeTurtle({ companionTurtle: 0 })
            ]);

            expect(model.companionTurtle(0)).toBe(1);
        });
    });
});

// ---------------------------------------------------------------------------
// TurtlesView: the stage view
//
// Built directly, for the same reason as the model.
// ---------------------------------------------------------------------------

describe("Turtles.TurtlesView", () => {
    let savedPlatformColor;
    let addEventListenerSpy;

    beforeEach(() => {
        savedPlatformColor = global.platformColor;
        global.platformColor = { background: "#f5f5f5" };
        addEventListenerSpy = jest.spyOn(window, "addEventListener");
    });

    afterEach(() => {
        global.platformColor = savedPlatformColor;
        addEventListenerSpy.mockRestore();
    });

    describe("constructor", () => {
        it("starts at full scale on a stage of the documented size", () => {
            const view = new Turtles.TurtlesView();

            expect(view._scale).toBe(1.0);
            expect(view._w).toBe(1200);
            expect(view._h).toBe(900);
        });

        it("starts expanded, unlocked, with nothing queued", () => {
            const view = new Turtles.TurtlesView();

            expect(view._isShrunk).toBe(false);
            expect(view._locked).toBe(false);
            expect(view._queue).toEqual([]);
        });

        it("starts with no boundaries, buttons or grid attached", () => {
            const view = new Turtles.TurtlesView();

            expect(view._expandedBoundary).toBeNull();
            expect(view._collapsedBoundary).toBeNull();
            expect(view._expandButton).toBeNull();
            expect(view._collapseButton).toBeNull();
            expect(view._clearButton).toBeNull();
            expect(view.gridButton).toBeNull();
            expect(view.currentGrid).toBeNull();
            expect(view._resizeTimer).toBeNull();
        });

        it("takes its background from the platform colour", () => {
            const view = new Turtles.TurtlesView();

            expect(view._backgroundColor).toBe("#f5f5f5");
        });

        it("listens for resize so the stage can follow the window", () => {
            new Turtles.TurtlesView();

            expect(addEventListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
        });
    });

    describe("isShrunk", () => {
        it("reports the collapsed state rather than a fresh value", () => {
            const view = new Turtles.TurtlesView();

            expect(view.isShrunk()).toBe(false);

            view._isShrunk = true;

            expect(view.isShrunk()).toBe(true);
        });
    });

    describe("setGridLabel", () => {
        it("stores the label it is given", () => {
            const view = new Turtles.TurtlesView();

            view.setGridLabel("Cartesian");

            expect(view._gridLabel).toBe("Cartesian");
        });

        it("accepts an empty label, which clears the button text", () => {
            const view = new Turtles.TurtlesView();
            view.setGridLabel("Polar");

            view.setGridLabel("");

            expect(view._gridLabel).toBe("");
        });
    });

    describe("deltaY", () => {
        it("shifts the stage down by the offset", () => {
            const view = new Turtles.TurtlesView();
            view.stage = { y: 100 };

            view.deltaY(25);

            expect(view.stage.y).toBe(125);
        });

        it("shifts the stage up for a negative offset", () => {
            const view = new Turtles.TurtlesView();
            view.stage = { y: 100 };

            view.deltaY(-40);

            expect(view.stage.y).toBe(60);
        });

        it("accumulates across calls rather than replacing the offset", () => {
            const view = new Turtles.TurtlesView();
            view.stage = { y: 0 };

            view.deltaY(10);
            view.deltaY(10);
            view.deltaY(5);

            expect(view.stage.y).toBe(25);
        });

        it("leaves the stage where it is for an offset of zero", () => {
            const view = new Turtles.TurtlesView();
            view.stage = { y: 70 };

            view.deltaY(0);

            expect(view.stage.y).toBe(70);
        });
    });
});

// ---------------------------------------------------------------------------
// The Turtles accessors
//
// Callers reach the stage, the canvas and the grid callbacks only through
// these, so a setter wired to the wrong field would drop writes silently.
// ---------------------------------------------------------------------------

describe("Turtles accessors", () => {
    let turtles;
    let borderContainer;

    beforeEach(() => {
        const activity = {
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            refreshCanvas: jest.fn(),
            turtleContainer: new createjs.Container(),
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn()
        };
        turtles = new Turtles(activity);
        turtles.activity = activity;

        // importMembers is mocked here, so the fields the model constructor
        // would have set are supplied the same way it supplies them.
        borderContainer = { id: "border" };
        turtles._borderContainer = borderContainer;
        turtles._turtleList = [];
        turtles._scale = 1;
    });

    describe("stage", () => {
        it("stores the stage and reads the same one back", () => {
            const stage = { addChild: jest.fn() };

            turtles.stage = stage;

            expect(turtles._stage).toBe(stage);
            expect(turtles.stage).toBe(stage);
        });

        it("attaches the border container to the incoming stage", () => {
            const stage = { addChild: jest.fn() };

            turtles.stage = stage;

            expect(stage.addChild).toHaveBeenCalledWith(borderContainer);
        });

        it("attaches the border to the replacement when the stage changes", () => {
            const first = { addChild: jest.fn() };
            const second = { addChild: jest.fn() };

            turtles.stage = first;
            turtles.stage = second;

            expect(second.addChild).toHaveBeenCalledWith(borderContainer);
            expect(turtles.stage).toBe(second);
        });
    });

    describe("canvas", () => {
        it("stores the canvas and reads the same one back", () => {
            const canvas = { width: 800, height: 600 };

            turtles.canvas = canvas;

            expect(turtles._canvas).toBe(canvas);
            expect(turtles.canvas).toBe(canvas);
        });

        it("accepts null, which is how the canvas is detached", () => {
            turtles.canvas = { width: 1 };

            turtles.canvas = null;

            expect(turtles.canvas).toBeNull();
        });
    });

    describe("the grid and clear callbacks", () => {
        it.each([
            ["doClear", "_doClear"],
            ["hideGrids", "_hideGrids"],
            ["doGrid", "_doGrid"]
        ])("%s stores the function in %s and reads it back", (accessor, field) => {
            const fn = jest.fn();

            turtles[accessor] = fn;

            expect(turtles[field]).toBe(fn);
            expect(turtles[accessor]).toBe(fn);
        });

        it.each([["doClear"], ["hideGrids"], ["doGrid"]])(
            "%s hands back a function that is still callable",
            accessor => {
                const fn = jest.fn(() => "ran");

                turtles[accessor] = fn;
                const result = turtles[accessor]("arg");

                expect(fn).toHaveBeenCalledWith("arg");
                expect(result).toBe("ran");
            }
        );

        it("keeps the three callbacks separate from one another", () => {
            const clear = jest.fn();
            const hide = jest.fn();
            const grid = jest.fn();

            turtles.doClear = clear;
            turtles.hideGrids = hide;
            turtles.doGrid = grid;

            expect(turtles.doClear).toBe(clear);
            expect(turtles.hideGrids).toBe(hide);
            expect(turtles.doGrid).toBe(grid);
        });
    });

    describe("turtleList and scale", () => {
        it("turtleList reports the list the model holds", () => {
            const list = [{ id: "a" }, { id: "b" }];
            turtles._turtleList = list;

            expect(turtles.turtleList).toBe(list);
        });

        it("turtleList reports an empty list rather than undefined", () => {
            turtles._turtleList = [];

            expect(turtles.turtleList).toEqual([]);
        });

        it("scale reports the current scale factor", () => {
            turtles._scale = 0.75;

            expect(turtles.scale).toBe(0.75);
        });

        it("scale reports a scale of 0 rather than falling back to a default", () => {
            turtles._scale = 0;

            expect(turtles.scale).toBe(0);
        });
    });
});

// ---------------------------------------------------------------------------
// TurtlesModel: attaching a turtle to the stage
//
// These three run once per turtle as it is created. Between them they decide
// what the turtle owns on the stage, where it starts, how big its click target
// is, and which of the saved properties are restored.
// ---------------------------------------------------------------------------

describe("TurtlesModel stage and graphic properties", () => {
    let model;
    let stage;
    let savedCreatejs;
    let rafCallbacks;
    let savedRaf;

    beforeEach(() => {
        savedCreatejs = global.createjs;
        // The shared mock at the top of this file has no Shape, and its
        // graphics calls do not chain, which createHitArea relies on.
        global.createjs = {
            Container: jest.fn().mockImplementation(() => ({
                id: "container",
                x: 0,
                y: 0,
                addChild: jest.fn(),
                removeAllChildren: jest.fn(),
                on: jest.fn(),
                removeAllEventListeners: jest.fn()
            })),
            Bitmap: jest.fn().mockImplementation(() => ({ id: "bitmap" })),
            Shape: jest.fn().mockImplementation(() => ({
                x: 0,
                y: 0,
                graphics: {
                    beginFill: jest.fn(function () {
                        return this;
                    }),
                    drawEllipse: jest.fn(function () {
                        return this;
                    })
                }
            }))
        };

        // requestAnimationFrame never fires on its own here, so the callbacks
        // are recorded and run by hand.
        rafCallbacks = [];
        savedRaf = global.requestAnimationFrame;
        global.requestAnimationFrame = jest.fn(cb => {
            rafCallbacks.push(cb);
            return rafCallbacks.length;
        });

        stage = { addChild: jest.fn(), removeChild: jest.fn() };
        model = new Turtles.TurtlesModel({
            stage: { addChild: jest.fn(), removeChild: jest.fn() },
            turtleContainer: stage,
            canvas: { width: 1200, height: 900 },
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            refreshCanvas: jest.fn()
        });
        stage.addChild.mockClear();

        // Supplied the way importMembers supplies them on a real Turtles.
        model.turtleX2screenX = jest.fn(x => x + 600);
        model.turtleY2screenY = jest.fn(y => 450 - y);
    });

    afterEach(() => {
        global.createjs = savedCreatejs;
        global.requestAnimationFrame = savedRaf;
    });

    /**
     * Builds a turtle shaped the way these methods expect to receive one.
     * @returns {Object} A turtle stand-in with a painter.
     */
    const makeTurtle = () => ({
        x: 0,
        y: 0,
        rename: jest.fn(),
        painter: {
            doSetHeading: jest.fn(),
            doSetPensize: jest.fn(),
            doSetChroma: jest.fn(),
            doSetValue: jest.fn(),
            doSetColor: jest.fn()
        }
    });

    describe("addTurtleStageProps", () => {
        it("gives the turtle its own image container, penstrokes and body", () => {
            const turtle = makeTurtle();

            model.addTurtleStageProps(turtle, false, {});

            expect(turtle.imageContainer).toBeDefined();
            expect(turtle.penstrokes).toBeDefined();
            expect(turtle.container).toBeDefined();
        });

        it("attaches all three to the stage, so removeTurtle has three to detach", () => {
            const turtle = makeTurtle();

            model.addTurtleStageProps(turtle, false, {});

            expect(stage.addChild).toHaveBeenCalledWith(turtle.imageContainer);
            expect(stage.addChild).toHaveBeenCalledWith(turtle.penstrokes);
            expect(stage.addChild).toHaveBeenCalledWith(turtle.container);
            expect(stage.addChild).toHaveBeenCalledTimes(3);
        });

        it("places the body at the screen position for the turtle coordinates", () => {
            const turtle = makeTurtle();

            model.addTurtleStageProps(turtle, true, { xcor: 40, ycor: 30 });

            expect(turtle.x).toBe(40);
            expect(turtle.y).toBe(30);
            expect(turtle.container.x).toBe(640);
            expect(turtle.container.y).toBe(420);
        });

        it("leaves the coordinates alone when no block info is available", () => {
            const turtle = makeTurtle();
            turtle.x = 11;
            turtle.y = 22;

            model.addTurtleStageProps(turtle, false, { xcor: 40, ycor: 30 });

            expect(turtle.x).toBe(11);
            expect(turtle.y).toBe(22);
        });

        it.each([
            ["only xcor", { xcor: 40 }, 40, 22],
            ["only ycor", { ycor: 30 }, 11, 30],
            ["neither", {}, 11, 22]
        ])("restores %s from the saved info", (_label, infoDict, expectedX, expectedY) => {
            const turtle = makeTurtle();
            turtle.x = 11;
            turtle.y = 22;

            model.addTurtleStageProps(turtle, true, infoDict);

            expect(turtle.x).toBe(expectedX);
            expect(turtle.y).toBe(expectedY);
        });

        it("restores a coordinate of 0 rather than treating it as absent", () => {
            const turtle = makeTurtle();
            turtle.x = 11;
            turtle.y = 22;

            model.addTurtleStageProps(turtle, true, { xcor: 0, ycor: 0 });

            expect(turtle.x).toBe(0);
            expect(turtle.y).toBe(0);
        });
    });

    describe("createHitArea", () => {
        it("gives the turtle body a hit area", () => {
            const turtle = makeTurtle();
            turtle.container = { hitArea: null };

            model.createHitArea(turtle);

            expect(turtle.container.hitArea).not.toBeNull();
            expect(turtle.container.hitArea.x).toBe(0);
            expect(turtle.container.hitArea.y).toBe(0);
        });

        it("draws the sensor as the documented ellipse", () => {
            const turtle = makeTurtle();
            turtle.container = { hitArea: null };

            model.createHitArea(turtle);

            const { graphics } = turtle.container.hitArea;
            expect(graphics.beginFill).toHaveBeenCalledWith("#FFF");
            expect(graphics.drawEllipse).toHaveBeenCalledWith(-27, -27, 55, 55);
        });

        it("replaces a hit area that is already there", () => {
            const turtle = makeTurtle();
            const previous = { id: "old" };
            turtle.container = { hitArea: previous };

            model.createHitArea(turtle);

            expect(turtle.container.hitArea).not.toBe(previous);
        });
    });

    describe("addTurtleGraphicProps", () => {
        it("defers the work to the next frame rather than doing it inline", () => {
            const turtle = makeTurtle();

            model.addTurtleGraphicProps(turtle, true, { heading: 90 });

            expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
            expect(turtle.painter.doSetHeading).not.toHaveBeenCalled();
        });

        it("restores every saved property once the frame runs", () => {
            const turtle = makeTurtle();

            model.addTurtleGraphicProps(turtle, true, {
                heading: 90,
                pensize: 8,
                grey: 70,
                shade: 40,
                color: 25,
                name: "Mr. Mouse"
            });
            rafCallbacks[0]();

            expect(turtle.painter.doSetHeading).toHaveBeenCalledWith(90);
            expect(turtle.painter.doSetPensize).toHaveBeenCalledWith(8);
            expect(turtle.painter.doSetChroma).toHaveBeenCalledWith(70);
            expect(turtle.painter.doSetValue).toHaveBeenCalledWith(40);
            expect(turtle.painter.doSetColor).toHaveBeenCalledWith(25);
            expect(turtle.rename).toHaveBeenCalledWith("Mr. Mouse");
        });

        it("restores only the properties that were saved", () => {
            const turtle = makeTurtle();

            model.addTurtleGraphicProps(turtle, true, { heading: 90, color: 25 });
            rafCallbacks[0]();

            expect(turtle.painter.doSetHeading).toHaveBeenCalledWith(90);
            expect(turtle.painter.doSetColor).toHaveBeenCalledWith(25);
            expect(turtle.painter.doSetPensize).not.toHaveBeenCalled();
            expect(turtle.painter.doSetChroma).not.toHaveBeenCalled();
            expect(turtle.painter.doSetValue).not.toHaveBeenCalled();
            expect(turtle.rename).not.toHaveBeenCalled();
        });

        it("restores a value of 0 rather than skipping it as unset", () => {
            const turtle = makeTurtle();

            model.addTurtleGraphicProps(turtle, true, { heading: 0, shade: 0, color: 0 });
            rafCallbacks[0]();

            expect(turtle.painter.doSetHeading).toHaveBeenCalledWith(0);
            expect(turtle.painter.doSetValue).toHaveBeenCalledWith(0);
            expect(turtle.painter.doSetColor).toHaveBeenCalledWith(0);
        });

        it("restores nothing when no block info is available", () => {
            const turtle = makeTurtle();

            model.addTurtleGraphicProps(turtle, false, {
                heading: 90,
                pensize: 8,
                name: "Mr. Mouse"
            });
            rafCallbacks[0]();

            expect(turtle.painter.doSetHeading).not.toHaveBeenCalled();
            expect(turtle.painter.doSetPensize).not.toHaveBeenCalled();
            expect(turtle.rename).not.toHaveBeenCalled();
        });
    });
});
