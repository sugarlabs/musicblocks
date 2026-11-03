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
        removeChild: jest.fn(),
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
        const turtle1 = { running: true, stopBlink: jest.fn() };
        const turtle2 = { running: true, stopBlink: jest.fn() };
        const turtle3 = { running: true, stopBlink: jest.fn() };

        turtles._turtleList = [turtle1, turtle2, turtle3];
        turtles.getTurtleCount = jest.fn().mockReturnValue(3);
        turtles.getTurtle = jest.fn(i => turtles._turtleList[i]);

        turtles.markAllAsStopped();

        expect(turtle1.running).toBe(false);
        expect(turtle2.running).toBe(false);
        expect(turtle3.running).toBe(false);
    });

    test("should stop any pending blink on every turtle", () => {
        const turtle1 = { running: true, stopBlink: jest.fn() };
        const turtle2 = { running: false, stopBlink: jest.fn() };

        turtles._turtleList = [turtle1, turtle2];
        turtles.getTurtleCount = jest.fn().mockReturnValue(2);
        turtles.getTurtle = jest.fn(i => turtles._turtleList[i]);

        turtles.markAllAsStopped();

        expect(turtle1.stopBlink).toHaveBeenCalledTimes(1);
        expect(turtle2.stopBlink).toHaveBeenCalledTimes(1);
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
        const turtle1 = { running: false, stopBlink: jest.fn() };
        const turtle2 = { running: true, stopBlink: jest.fn() };

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

    test("should clear queue when applying a new scale while unlocked", () => {
        turtles._queue = [640, 480, 1.5];
        turtles._locked = false;
        turtles.doScale(800, 600, 2.0);

        expect(turtles._queue).toEqual([]);
        expect(turtles._scale).toBe(2.0);
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

        global.window.widgetWindows = {
            _handleResize: jest.fn()
        };

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
        delete global.window.widgetWindows;
    });

    test("collapse removes highlight classes from auxiliary toolbar button", () => {
        const btn = document.getElementById("toggleAuxBtn");
        btn.className = "blue darken-1";

        turtles.collapse();

        expect(global.window.widgetWindows._handleResize).toHaveBeenCalledTimes(1);
        expect(btn.classList.contains("blue")).toBe(false);
        expect(btn.classList.contains("darken-1")).toBe(false);
        expect(turtles.hideMenu).toHaveBeenCalled();
        expect(turtles.setStageScale).toHaveBeenCalledWith(0.25);
        expect(activityMock.hideGrids).toHaveBeenCalled();
        expect(activityMock.__tick).toHaveBeenCalled();
    });

    test("collapse does not resize widget windows when auxiliary toolbar is already hidden", () => {
        const auxToolbar = document.getElementById("aux-toolbar");
        auxToolbar.style.display = "none";

        turtles.collapse();

        expect(global.window.widgetWindows._handleResize).not.toHaveBeenCalled();
    });

    test("expand removes highlight classes from auxiliary toolbar button", () => {
        const btn = document.getElementById("toggleAuxBtn");
        btn.className = "blue darken-1";

        turtles.expand();

        expect(global.window.widgetWindows._handleResize).toHaveBeenCalledTimes(1);
        expect(btn.classList.contains("blue")).toBe(false);
        expect(btn.classList.contains("darken-1")).toBe(false);
        expect(turtles.hideMenu).toHaveBeenCalled();
        expect(turtles.setStageScale).toHaveBeenCalledWith(1.0);
    });

    test("keeps canvas buttons below the auxiliary toolbar after resize", () => {
        const originalPlatformColor = global.platformColor;
        const originalMakeKeyboardAccessible = global.makeKeyboardAccessible;
        const hardwareConcurrency = Object.getOwnPropertyDescriptor(
            navigator,
            "hardwareConcurrency"
        );

        global.platformColor = { ruleColor: "#000" };
        global.makeKeyboardAccessible = jest.fn();
        global.Image = class extends originalImage {
            constructor() {
                super();
                Object.defineProperty(this, "src", {
                    configurable: true,
                    set: () => {
                        this.onload?.();
                    }
                });
            }
        };
        Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, value: 1 });
        jest.useFakeTimers();

        try {
            activityMock.toolbarHeight = 0;
            document.getElementById("aux-toolbar").style.display = "none";
            turtles._locked = false;
            turtles.makeBackground();

            const buttonIds = ["Grid", "Clear", "Collapse"];
            const baseTop = 70 + LEADING + 6;
            buttonIds.forEach(id => {
                expect(document.getElementById(id).style.top).toBe(`${baseTop}px`);
            });

            // Opening the menu shifts existing buttons; fullscreen then rebuilds them on resize.
            activityMock.toolbarHeight = 64;
            document.getElementById("aux-toolbar").style.display = "block";
            buttonIds.forEach(id => {
                document.getElementById(id).style.top = `${baseTop + 64}px`;
            });
            const oldGrid = document.getElementById("Grid");
            turtles._resizeHandler();
            jest.advanceTimersByTime(150);

            expect(document.getElementById("Grid")).not.toBe(oldGrid);
            buttonIds.forEach(id => {
                expect(document.getElementById(id).style.top).toBe(`${baseTop + 64}px`);
            });

            activityMock.toolbarHeight = 0;
            document.getElementById("aux-toolbar").style.display = "none";
            turtles._resizeHandler();
            jest.advanceTimersByTime(150);
            buttonIds.forEach(id => {
                expect(document.getElementById(id).style.top).toBe(`${baseTop}px`);
            });
        } finally {
            jest.useRealTimers();
            global.platformColor = originalPlatformColor;
            global.makeKeyboardAccessible = originalMakeKeyboardAccessible;
            if (hardwareConcurrency) {
                Object.defineProperty(navigator, "hardwareConcurrency", hardwareConcurrency);
            } else {
                delete navigator.hardwareConcurrency;
            }
        }
    });

    test("debounces canvas button rebuild during rapid resize events on multicore systems", () => {
        const originalPlatformColor = global.platformColor;
        const originalMakeKeyboardAccessible = global.makeKeyboardAccessible;
        const hardwareConcurrency = Object.getOwnPropertyDescriptor(
            navigator,
            "hardwareConcurrency"
        );

        global.platformColor = { ruleColor: "#000" };
        global.makeKeyboardAccessible = jest.fn();
        global.Image = class extends originalImage {
            constructor() {
                super();
                Object.defineProperty(this, "src", {
                    configurable: true,
                    set: () => {
                        this.onload?.();
                    }
                });
            }
        };
        Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, value: 8 });
        jest.useFakeTimers();

        try {
            turtles._locked = false;
            turtles.makeBackground();

            const initialGrid = document.getElementById("Grid");

            // Fire multiple resize events in rapid succession (simulating window drag)
            turtles._resizeHandler();
            turtles._resizeHandler();
            turtles._resizeHandler();

            // Several animation frames pass, but the debounce has not settled
            jest.advanceTimersByTime(100);
            expect(document.getElementById("Grid")).toBe(initialGrid);

            // Once debounce timer settles, button rebuild should have executed
            jest.advanceTimersByTime(50);
            expect(document.getElementById("Grid")).not.toBe(initialGrid);
        } finally {
            jest.useRealTimers();
            global.platformColor = originalPlatformColor;
            global.makeKeyboardAccessible = originalMakeKeyboardAccessible;
            if (hardwareConcurrency) {
                Object.defineProperty(navigator, "hardwareConcurrency", hardwareConcurrency);
            } else {
                delete navigator.hardwareConcurrency;
            }
        }
    });

    test("preserves collapsed state and button visibility when resize settles", () => {
        const originalPlatformColor = global.platformColor;
        const originalMakeKeyboardAccessible = global.makeKeyboardAccessible;

        global.platformColor = { ruleColor: "#000" };
        global.makeKeyboardAccessible = jest.fn();
        global.Image = class extends originalImage {
            constructor() {
                super();
                Object.defineProperty(this, "src", {
                    configurable: true,
                    set: () => {
                        this.onload?.();
                    }
                });
            }
        };
        jest.useFakeTimers();

        try {
            turtles._locked = false;
            turtles.makeBackground();

            // Set canvas to collapsed state
            turtles._isShrunk = true;

            // Trigger resize
            turtles._resizeHandler();
            jest.advanceTimersByTime(150);

            // Collapsed boundary and expand button should be visible, others hidden
            expect(turtles._collapsedBoundary.visible).toBe(true);
            expect(turtles._expandedBoundary.visible).toBe(false);
            expect(turtles._expandButton.style.visibility).toBe("visible");
            expect(turtles._collapseButton.style.visibility).toBe("hidden");
            expect(turtles.gridButton.style.visibility).toBe("hidden");
        } finally {
            jest.useRealTimers();
            global.platformColor = originalPlatformColor;
            global.makeKeyboardAccessible = originalMakeKeyboardAccessible;
        }
    });

    test("replays queued resize from _queue through doScale when __makeAllButtons unlocks", () => {
        const originalPlatformColor = global.platformColor;
        const originalMakeKeyboardAccessible = global.makeKeyboardAccessible;

        let pendingOnload = null;
        global.platformColor = { ruleColor: "#000" };
        global.makeKeyboardAccessible = jest.fn();
        global.Image = class extends originalImage {
            constructor() {
                super();
                Object.defineProperty(this, "src", {
                    configurable: true,
                    set: () => {
                        pendingOnload = () => this.onload?.();
                    }
                });
            }
        };

        try {
            turtles._locked = false;
            turtles.makeBackground();
            // Trigger first boundary image load
            pendingOnload?.();
            // Trigger second boundary image load -> completes initial build and unlocks
            pendingOnload?.();
            expect(turtles._locked).toBe(false);

            // Now start a new background build so that _locked becomes true
            turtles.makeBackground();
            expect(turtles._locked).toBe(true);

            // While locked, a doScale call arrives and gets queued
            turtles.doScale(800, 600, 2.0);
            expect(turtles._queue).toEqual([800, 600, 2.0]);
            expect(turtles._scale).not.toBe(2.0);

            // First image loads -> calls __makeBoundary2
            pendingOnload?.();
            // Second image loads -> calls __makeAllButtons, which clears queue and replays doScale
            pendingOnload?.();

            expect(turtles._queue).toEqual([]);
            expect(turtles._scale).toBe(2.0);
            expect(turtles._w).toBe(400); // 800 / 2.0
            expect(turtles._h).toBe(300); // 600 / 2.0
        } finally {
            global.platformColor = originalPlatformColor;
            global.makeKeyboardAccessible = originalMakeKeyboardAccessible;
        }
    });

    test("ignores out-of-order image callbacks from superseded boundary builds", () => {
        const originalPlatformColor = global.platformColor;
        const originalMakeKeyboardAccessible = global.makeKeyboardAccessible;

        const onloads = [];
        global.platformColor = { ruleColor: "#000" };
        global.makeKeyboardAccessible = jest.fn();
        global.Image = class extends originalImage {
            constructor() {
                super();
                Object.defineProperty(this, "src", {
                    configurable: true,
                    set: () => {
                        const cb = () => this.onload?.();
                        onloads.push(cb);
                    }
                });
            }
        };

        try {
            turtles._locked = false;
            // Build 1 starts
            turtles.makeBackground();
            const build1Image1 = onloads.shift();

            // Build 2 starts before Build 1 loads
            turtles._locked = false;
            turtles.makeBackground();
            const build2Image1 = onloads.shift();

            // Build 2 image 1 finishes
            build2Image1?.();
            const build2Image2 = onloads.shift();
            // Build 2 image 2 finishes -> completes build 2
            build2Image2?.();

            const latestExpanded = turtles._expandedBoundary;
            const latestCollapsed = turtles._collapsedBoundary;

            // Delayed Build 1 image 1 loads out of order
            build1Image1?.();

            // Boundaries must NOT have been replaced by the superseded build
            expect(turtles._expandedBoundary).toBe(latestExpanded);
            expect(turtles._collapsedBoundary).toBe(latestCollapsed);
        } finally {
            global.platformColor = originalPlatformColor;
            global.makeKeyboardAccessible = originalMakeKeyboardAccessible;
        }
    });

    test("cancels pending resize timeout when makeBackground re-renders", () => {
        const originalPlatformColor = global.platformColor;
        const originalMakeKeyboardAccessible = global.makeKeyboardAccessible;

        global.platformColor = { ruleColor: "#000" };
        global.makeKeyboardAccessible = jest.fn();
        global.Image = class extends originalImage {
            constructor() {
                super();
                Object.defineProperty(this, "src", {
                    configurable: true,
                    set: () => {
                        this.onload?.();
                    }
                });
            }
        };
        jest.useFakeTimers();

        try {
            turtles._locked = false;
            turtles.makeBackground();

            // Fire resize to schedule 150ms timeout
            turtles._resizeHandler();
            expect(turtles._resizeTimeout).not.toBeNull();

            // Re-render occurs within debounce window (e.g. via setBackgroundColor or doScale)
            turtles._locked = false;
            turtles.makeBackground();

            // The pending timeout must have been cancelled and cleared
            expect(turtles._resizeTimeout).toBeNull();
        } finally {
            jest.useRealTimers();
            global.platformColor = originalPlatformColor;
            global.makeKeyboardAccessible = originalMakeKeyboardAccessible;
        }
    });

    test("removes previous expanded and collapsed boundaries from borderContainer when replacing them", () => {
        const originalPlatformColor = global.platformColor;
        const originalMakeKeyboardAccessible = global.makeKeyboardAccessible;

        global.platformColor = { ruleColor: "#000" };
        global.makeKeyboardAccessible = jest.fn();
        global.Image = class extends originalImage {
            constructor() {
                super();
                Object.defineProperty(this, "src", {
                    configurable: true,
                    set: () => {
                        this.onload?.();
                    }
                });
            }
        };

        try {
            const firstExpanded = turtles._expandedBoundary;
            const firstCollapsed = turtles._collapsedBoundary;

            turtles._borderContainer.removeChild.mockClear();

            // Re-render occurs (e.g. on settled resize)
            turtles._locked = false;
            turtles.makeBackground();

            // Previous boundaries must have been removed from borderContainer
            expect(turtles._borderContainer.removeChild).toHaveBeenCalledWith(firstExpanded);
            expect(turtles._borderContainer.removeChild).toHaveBeenCalledWith(firstCollapsed);
        } finally {
            global.platformColor = originalPlatformColor;
            global.makeKeyboardAccessible = originalMakeKeyboardAccessible;
        }
    });

    test("restores expanded boundary if detached by makeBackground during collapsed boundary load", () => {
        const originalPlatformColor = global.platformColor;
        const originalMakeKeyboardAccessible = global.makeKeyboardAccessible;
        global.platformColor = { background: "#ffffff", ruleColor: "#000000" };
        global.makeKeyboardAccessible = jest.fn();

        const imageInstances = [];
        global.Image = class extends originalImage {
            constructor() {
                super();
                this.onload = null;
                imageInstances.push(this);
            }
            set src(_val) {
                // Do not auto-fire onload, control manually
            }
            get src() {
                return "";
            }
        };

        const children = [];
        turtles._borderContainer = {
            children,
            addChild: jest.fn(child => children.push(child)),
            removeChild: jest.fn(child => {
                const idx = children.indexOf(child);
                if (idx !== -1) children.splice(idx, 1);
            }),
            removeAllChildren: jest.fn(() => {
                children.length = 0;
            })
        };

        try {
            turtles._locked = false;
            turtles.makeBackground();

            // First image is the expanded boundary
            expect(imageInstances.length).toBe(1);
            const expandedImg = imageInstances[0];
            expandedImg.onload();

            // At this point, expanded boundary is in borderContainer and second image is created
            expect(turtles._expandedBoundary).not.toBeNull();
            expect(children).toContain(turtles._expandedBoundary);
            expect(imageInstances.length).toBe(2);
            const collapsedImg = imageInstances[1];

            // An intervening makeBackground() runs while _locked is still true
            turtles.makeBackground();
            expect(children).not.toContain(turtles._expandedBoundary);

            // Now collapsed boundary image finishes loading
            collapsedImg.onload();

            // Expanded boundary must have been restored into borderContainer
            expect(children).toContain(turtles._expandedBoundary);
            expect(turtles._expandedBoundary.visible).toBe(true);
            expect(children).toContain(turtles._collapsedBoundary);
        } finally {
            global.platformColor = originalPlatformColor;
            global.makeKeyboardAccessible = originalMakeKeyboardAccessible;
        }
    });

    test("Escape key on canvas buttons exits keyboard navigation", () => {
        const listeners = [];
        const originalCreateElement = document.createElement;
        document.createElement = function (tag) {
            const el = originalCreateElement.call(document, tag);
            const originalAddEventListener = el.addEventListener;
            el.addEventListener = function (event, handler) {
                if (event === "keydown") listeners.push(handler);
                originalAddEventListener.call(this, event, handler);
            };
            return el;
        };

        const originalJQuery = window.jQuery;
        const mockJQuery = jest.fn(() => ({
            tooltip: jest.fn(),
            each: jest.fn(function (cb) {
                cb.call(document.createElement("div"));
                return this;
            })
        }));
        mockJQuery.noConflict = jest.fn(() => mockJQuery);
        window.jQuery = mockJQuery;
        global.jQuery = mockJQuery;
        const originalMakeKeyboardAccessible = global.makeKeyboardAccessible;
        global.makeKeyboardAccessible = jest.fn();

        const originalImage = global.Image;
        global.Image = function () {
            const img = document.createElement("img");
            const originalSetAttribute = img.setAttribute;
            img.setAttribute = jest.fn(function (name, value) {
                return originalSetAttribute.call(img, name, value);
            });
            Object.defineProperty(img, "src", {
                set: function (val) {
                    this.setAttribute("src", val);
                    if (typeof this.onload === "function") {
                        this.onload();
                    }
                },
                get: function () {
                    return this.getAttribute("src");
                }
            });
            return img;
        };

        const activityMock = {
            toolbarHeight: 0,
            loading: false,
            getCanvasPadding: jest.fn(() => ({ paddingTop: 0, paddingLeft: 0 })),
            refreshCanvas: jest.fn()
        };
        const turtles = new Turtles(activityMock);
        mixinPrototypes(turtles);
        turtles.activity = activityMock; // Manually assign activity just in case importMembers is mocked
        turtles._borderContainer = {
            removeAllChildren: jest.fn(),
            addChild: jest.fn(),
            removeChild: jest.fn()
        };
        turtles._canvas = { style: {}, getContext: jest.fn(), width: 1200, height: 900 };
        turtles.stage = { addChild: jest.fn() };
        turtles._backgroundColor = "white"; // Add to prevent crash
        turtles._expandedBoundary = null;
        turtles._collapsedBoundary = null;
        turtles._expandButton = null;
        turtles._collapseButton = null;
        turtles.gridButton = null;
        turtles._clearButton = null;

        window._focusCycleManager = { exitKeyboardNavigation: jest.fn() };

        turtles.makeBackground();

        expect(listeners.length).toBeGreaterThan(0);

        const handler = listeners[0];

        handler({ key: "A", preventDefault: jest.fn(), stopPropagation: jest.fn() });
        expect(window._focusCycleManager.exitKeyboardNavigation).not.toHaveBeenCalled();

        const preventDefault = jest.fn();
        const stopPropagation = jest.fn();
        handler({ key: "Escape", preventDefault, stopPropagation });

        expect(preventDefault).toHaveBeenCalled();
        expect(stopPropagation).toHaveBeenCalled();
        expect(window._focusCycleManager.exitKeyboardNavigation).toHaveBeenCalled();

        document.createElement = originalCreateElement;
        window.jQuery = originalJQuery;
        global.makeKeyboardAccessible = originalMakeKeyboardAccessible;
        global.Image = originalImage;
        delete window._focusCycleManager;
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

    it("keeps a companion reference valid when an earlier turtle is removed", () => {
        const a = makeTurtle();
        const b = makeTurtle();
        const c = makeTurtle();
        b.companionTurtle = 2;
        model._turtleList = [a, b, c];

        model.removeTurtle(0);

        const companionIndex = model._turtleList[0].companionTurtle;
        expect(model._turtleList[companionIndex]).toBe(c);
    });

    it("clears a companion reference when its target is removed", () => {
        const owner = makeTurtle();
        const target = makeTurtle();
        owner.companionTurtle = 1;
        model._turtleList = [owner, target];

        model.removeTurtle(1);

        expect(owner.companionTurtle).toBeUndefined();
    });

    it("preserves a companion reference when a later turtle is removed", () => {
        const target = makeTurtle();
        const owner = makeTurtle({ companionTurtle: 0 });
        const third = makeTurtle();
        model._turtleList = [target, owner, third];

        model.removeTurtle(2);

        expect(model._turtleList[owner.companionTurtle]).toBe(target);
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

describe("Turtle hover scaling and lifecycle", () => {
    let activityMock;
    let turtles;
    let eventListeners;
    let mockTurtle;

    beforeEach(() => {
        eventListeners = {};
        mockTurtle = {
            id: 1,
            name: "start",
            running: false,
            container: {
                scaleX: 1,
                scaleY: 1,
                scale: 1,
                on: jest.fn((event, handler) => {
                    eventListeners[event] = handler;
                }),
                removeAllEventListeners: jest.fn()
            }
        };

        activityMock = {
            stage: {
                addChild: jest.fn(),
                removeChild: jest.fn(),
                dispatchEvent: jest.fn()
            },
            refreshCanvas: jest.fn(),
            turtleContainer: new createjs.Container(),
            hideAuxMenu: jest.fn(),
            hideGrids: jest.fn(),
            _doCartesianPolar: jest.fn(),
            closeHelpfulWheel
        };

        global.Turtle = jest.fn().mockImplementation(() => mockTurtle);

        turtles = new Turtles(activityMock);
        turtles.activity = activityMock;
        turtles.getTurtleCount = jest.fn().mockReturnValue(0);
        turtles.pushTurtle = jest.fn();
        turtles.addTurtleStageProps = jest.fn();
        turtles.createArtwork = jest.fn();
        turtles.createHitArea = jest.fn();
        turtles.addTurtleGraphicProps = jest.fn();
        turtles.isShrunk = jest.fn().mockReturnValue(false);

        document.body.innerHTML = '<div id="loader"></div>';
        turtles.add({ name: "start", value: 0 }, { id: 1, name: "start" });
    });

    test("scales up turtle container by 1.2 on mouseover and restores on mouseout", () => {
        expect(eventListeners.mouseover).toBeDefined();
        expect(eventListeners.mouseout).toBeDefined();

        eventListeners.mouseover();
        expect(mockTurtle.container.scaleX).toBeCloseTo(1.2);
        expect(mockTurtle._isHovered).toBe(true);

        eventListeners.mouseout();
        expect(mockTurtle.container.scaleX).toBeCloseTo(1);
        expect(mockTurtle._isHovered).toBe(false);
    });

    test("does not compound scale on duplicate mouseover events", () => {
        eventListeners.mouseover();
        expect(mockTurtle.container.scaleX).toBeCloseTo(1.2);

        // Second mouseover while still hovered should be ignored
        eventListeners.mouseover();
        expect(mockTurtle.container.scaleX).toBeCloseTo(1.2);
    });

    test("restores original scale on mouseout even if turtle is running", () => {
        mockTurtle.container.scaleX = 4;
        mockTurtle.container.scaleY = 4;
        mockTurtle.container.scale = 4;

        eventListeners.mouseover();
        expect(mockTurtle.container.scaleX).toBeCloseTo(4 * 1.2);
        expect(mockTurtle.container.scaleY).toBeCloseTo(4 * 1.2);
        expect(mockTurtle.container.scale).toBeCloseTo(4 * 1.2);

        // Turtle starts running while hovered
        mockTurtle.running = true;

        // Mouse leaves while running
        eventListeners.mouseout();

        // Scale should be restored to base values across all dimensions
        expect(mockTurtle.container.scaleX).toBeCloseTo(4);
        expect(mockTurtle.container.scaleY).toBeCloseTo(4);
        expect(mockTurtle.container.scale).toBeCloseTo(4);
        expect(mockTurtle._isHovered).toBe(false);
    });

    test("ignores mouseout if turtle was not hovered", () => {
        mockTurtle.container.scaleX = 1;
        eventListeners.mouseout();
        expect(mockTurtle.container.scaleX).toBe(1);
    });
});
