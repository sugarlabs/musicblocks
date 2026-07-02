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
            _doCartesianPolar: jest.fn()
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
            _doCartesianPolar: jest.fn()
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
            _doCartesianPolar: jest.fn()
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
            _doCartesianPolar: jest.fn()
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
            _doCartesianPolar: jest.fn()
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
            _doCartesianPolar: jest.fn()
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
            _doCartesianPolar: jest.fn()
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
            _doCartesianPolar: jest.fn()
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
