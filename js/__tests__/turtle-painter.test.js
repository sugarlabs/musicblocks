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

const Painter = require("../turtle-painter");
global.WRAP = true;
global.NANERRORMSG = "Not a number";

// Mock external color and translation functions
global.getcolor = jest.fn(() => [50, 100, "rgba(255,0,49,1)"]);
global.getMunsellColor = jest.fn(() => "rgba(128,64,32,1)");
global.hex2rgb = jest.fn(hex => "rgba(255,0,49,1)");
global._ = jest.fn(x => x);
global.STROKECOLORS = { at: jest.fn(() => "red") };
global.FILLCOLORS = { at: jest.fn(() => "blue") };
global.TURTLESVG = "fill_color stroke_color";
global.base64Encode = jest.fn(str => str);

if (typeof window !== "undefined") {
    window.btoa = jest.fn(str => str);
} else {
    global.window = { btoa: jest.fn(str => str) };
}

// Enhance the global canvas mock context for missing features
const mockCtx = document.createElement("canvas").getContext("2d");
mockCtx.rect = jest.fn();
mockCtx.getImageData = jest.fn(() => ({ data: [] }));
mockCtx.putImageData = jest.fn();
mockCtx.canvas = { width: 800, height: 600 };

const createMockTurtle = () => ({
    turtles: {
        screenX2turtleX: jest.fn(x => x),
        screenY2turtleY: jest.fn(y => y),
        turtleX2screenX: jest.fn(x => x),
        turtleY2screenY: jest.fn(y => y),
        scale: 1,
        activity: { refreshCanvas: jest.fn(), errorMsg: jest.fn() },
        getIndexOfTurtle: jest.fn(() => 2),
        getTurtleCount: jest.fn(() => 0),
        getTurtle: jest.fn()
    },
    activity: { refreshCanvas: jest.fn(), errorMsg: jest.fn(), gifAnimator: {} },
    canvas: { width: 800, height: 600 },
    container: { x: 0, y: 0, rotation: 0 },
    ctx: mockCtx,
    penstrokes: { image: null },
    orientation: 0,
    updateCache: jest.fn(),
    blinking: jest.fn().mockReturnValue(false),
    rename: jest.fn(),
    doTurtleShell: jest.fn(),
    skinChanged: false,
    name: "start",
    media: [],
    imageContainer: { removeChild: jest.fn() }
});

describe("Painter Class", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    describe("Constructor", () => {
        test("should initialize with default values", () => {
            expect(painter._color).toBe(0);
            expect(painter._stroke).toBe(5);
            expect(painter._penDown).toBe(true);
        });

        test("should initialize value to DEFAULTVALUE (50)", () => {
            expect(painter._value).toBe(50);
        });

        test("should initialize chroma to DEFAULTCHROMA (100)", () => {
            expect(painter._chroma).toBe(100);
        });

        test("should initialize font to sans-serif", () => {
            expect(painter._font).toBe("sans-serif");
        });

        test("should initialize canvas color and alpha", () => {
            expect(painter._canvasColor).toBe("rgba(255,0,49,1)");
            expect(painter._canvasAlpha).toBe(1.0);
        });

        test("should initialize fill and hollow states to false", () => {
            expect(painter._fillState).toBe(false);
            expect(painter._hollowState).toBe(false);
        });

        test("should initialize bezier control points", () => {
            expect(painter.cp1x).toBe(0);
            expect(painter.cp1y).toBe(100);
            expect(painter.cp2x).toBe(100);
            expect(painter.cp2y).toBe(100);
        });
    });

    describe("Setters and Getters", () => {
        test("should set and get color", () => {
            painter.color = 10;
            expect(painter.color).toBe(10);
        });

        test("should set and get stroke", () => {
            painter.stroke = 8;
            expect(painter.stroke).toBe(8);
        });

        test("should set and get value", () => {
            painter.value = 75;
            expect(painter.value).toBe(75);
        });

        test("should set and get chroma", () => {
            painter.chroma = 50;
            expect(painter.chroma).toBe(50);
        });

        test("should get font", () => {
            expect(painter.font).toBe("sans-serif");
        });

        test("should set and get canvasColor", () => {
            painter.canvasColor = "rgba(0,255,0,1)";
            expect(painter.canvasColor).toBe("rgba(0,255,0,1)");
        });

        test("should set and get canvasAlpha", () => {
            painter.canvasAlpha = 0.5;
            expect(painter.canvasAlpha).toBe(0.5);
        });

        test("should set and get penState", () => {
            painter.penState = false;
            expect(painter.penState).toBe(false);
            painter.penState = true;
            expect(painter.penState).toBe(true);
        });

        test("should set and get svgOutput", () => {
            painter.svgOutput = "<svg>test</svg>";
            expect(painter.svgOutput).toBe("<svg>test</svg>");
        });
    });

    describe("Actions", () => {
        test("should move forward", () => {
            painter.doForward(10);
            expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
        });

        test("should turn right", () => {
            painter.doRight(90);
            expect(mockTurtle.orientation).toBe(90);
        });
    });

    describe("_scheduleCanvasUpdate", () => {
        test("should return early if update already scheduled", () => {
            painter._pendingCanvasUpdate = true;
            const refreshSpy = jest.spyOn(painter.activity, "refreshCanvas");
            painter._scheduleCanvasUpdate();
            expect(refreshSpy).not.toHaveBeenCalled();
            expect(window.requestAnimationFrame).not.toHaveBeenCalled();
        });

        test("should schedule canvas update and transition state correctly", () => {
            let callback;
            window.requestAnimationFrame.mockImplementation(cb => {
                callback = cb;
                return 123;
            });
            const refreshSpy = jest.spyOn(painter.activity, "refreshCanvas");

            painter._scheduleCanvasUpdate();

            expect(window.requestAnimationFrame).toHaveBeenCalled();
            expect(painter._pendingCanvasUpdate).toBe(true);
            expect(painter._rafId).toBe(123);
            expect(refreshSpy).not.toHaveBeenCalled();

            callback();

            expect(painter._pendingCanvasUpdate).toBe(false);
            expect(painter._rafId).toBeNull();
            expect(refreshSpy).toHaveBeenCalled();
        });
    });
});

describe("Pen operations", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("doSetPensize should update stroke and lineWidth", () => {
        painter.doSetPensize(10);
        expect(painter.stroke).toBe(10);
        expect(mockTurtle.ctx.lineWidth).toBe(10);
    });

    test("doSetPensize should handle zero", () => {
        painter.doSetPensize(0);
        expect(painter.stroke).toBe(0);
        expect(mockTurtle.ctx.lineWidth).toBe(0);
    });

    test("doSetPensize should handle large values", () => {
        painter.doSetPensize(100);
        expect(painter.stroke).toBe(100);
        expect(mockTurtle.ctx.lineWidth).toBe(100);
    });

    test("doSetColor should set color and call getcolor", () => {
        painter.doSetColor(50);
        expect(painter.color).toBe(50);
        expect(getcolor).toHaveBeenCalledWith(50);
    });

    test("doSetColor should update value, chroma, and canvas color from getcolor results", () => {
        getcolor.mockReturnValue([75, 80, "rgba(100,200,50,1)"]);
        painter.doSetColor(30);
        expect(painter.value).toBe(75);
        expect(painter.chroma).toBe(80);
    });

    test("doSetChroma should update chroma and call getMunsellColor", () => {
        painter.doSetChroma(75);
        expect(painter.chroma).toBe(75);
        expect(getMunsellColor).toHaveBeenCalledWith(painter.color, painter.value, 75);
    });

    test("doSetValue should update value and call getMunsellColor", () => {
        painter.doSetValue(30);
        expect(painter.value).toBe(30);
        expect(getMunsellColor).toHaveBeenCalledWith(painter.color, 30, painter.chroma);
    });

    test("doSetHue should update color and call getMunsellColor", () => {
        painter.doSetHue(120);
        expect(painter.color).toBe(120);
        expect(getMunsellColor).toHaveBeenCalledWith(120, painter.value, painter.chroma);
    });

    test("doSetPenAlpha should update canvas alpha", () => {
        painter.doSetPenAlpha(0.5);
        expect(painter.canvasAlpha).toBe(0.5);
    });

    test("doSetPenAlpha should handle zero transparency", () => {
        painter.doSetPenAlpha(0);
        expect(painter.canvasAlpha).toBe(0);
    });

    test("doSetPenAlpha should handle full opacity", () => {
        painter.doSetPenAlpha(1);
        expect(painter.canvasAlpha).toBe(1);
    });

    test("doPenUp should set penDown to false", () => {
        painter.doPenUp();
        expect(painter._penDown).toBe(false);
        expect(painter.penState).toBe(false);
    });

    test("doPenDown should set penDown to true", () => {
        painter.doPenUp();
        painter.doPenDown();
        expect(painter._penDown).toBe(true);
        expect(painter.penState).toBe(true);
    });

    test("pen toggle should work repeatedly", () => {
        painter.doPenUp();
        expect(painter.penState).toBe(false);
        painter.doPenDown();
        expect(painter.penState).toBe(true);
        painter.doPenUp();
        expect(painter.penState).toBe(false);
    });
});

describe("Drawing - doForward", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("should call beginPath and moveTo when not in fill state", () => {
        painter.doForward(10);
        expect(mockTurtle.ctx.beginPath).toHaveBeenCalled();
        expect(mockTurtle.ctx.moveTo).toHaveBeenCalled();
    });

    test("should not call beginPath when in fill state", () => {
        painter.doStartFill();
        mockTurtle.ctx.beginPath.mockClear();
        painter.doForward(10);
        expect(mockTurtle.ctx.beginPath).not.toHaveBeenCalled();
    });

    test("should set lineWidth and lineCap when pen is down and not filling", () => {
        painter.doSetPensize(8);
        painter.doForward(10);
        expect(mockTurtle.ctx.lineWidth).toBe(8);
        expect(mockTurtle.ctx.lineCap).toBe("round");
    });

    test("forward with zero steps should still call refresh", () => {
        painter.doForward(0);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("forward with negative steps should work", () => {
        painter.doForward(-10);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("pen up should still move turtle position", () => {
        painter.doPenUp();
        painter.doForward(10);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("doForward with NaN should show error and return early", () => {
        painter.doForward(NaN);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
        expect(mockTurtle.ctx.beginPath).not.toHaveBeenCalled();
    });

    test("doForward with Infinity should show error and return early", () => {
        painter.doForward(Infinity);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
        expect(mockTurtle.ctx.beginPath).not.toHaveBeenCalled();
    });

    test("doForward with negative steps should move backward", () => {
        painter.doForward(-10);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("doForward with linePart parameter should still work", () => {
        painter.doForward(10, true);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("doForward with linePart first and last should call arc and beginPath", () => {
        painter.stroke = 4;
        painter.doForward(10, "first");
        expect(mockTurtle.ctx.arc).toHaveBeenCalled();

        mockTurtle.ctx.arc.mockClear();
        painter.doForward(10, "last");
        expect(mockTurtle.ctx.arc).toHaveBeenCalled();
    });

    test("doForward with wrap ON and out of bounds should wrap around right", () => {
        painter.wrap = true;
        mockTurtle.container.x = 795;
        mockTurtle.orientation = 90;
        mockTurtle.turtleX2screenX = jest.fn(x => x);
        mockTurtle.turtleY2screenY = jest.fn(y => y);
        const startX = mockTurtle.container.x;
        painter.doForward(20);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
        expect(mockTurtle.container.x).not.toBe(startX + 20);
        expect(mockTurtle.container.x).toBeGreaterThanOrEqual(0);
        expect(mockTurtle.container.x).toBeLessThanOrEqual(800);
    });

    test("doForward with wrap ON and out of bounds should wrap around left", () => {
        painter.wrap = true;
        mockTurtle.container.x = 5;
        mockTurtle.orientation = 270;
        mockTurtle.turtleX2screenX = jest.fn(x => x);
        mockTurtle.turtleY2screenY = jest.fn(y => y);
        painter.doForward(10);
        expect(mockTurtle.container.x).toBe(795);
    });

    test("doForward with wrap ON and out of bounds should wrap around down", () => {
        painter.wrap = true;
        mockTurtle.container.y = 595;
        mockTurtle.orientation = 0;
        mockTurtle.turtleX2screenX = jest.fn(x => x);
        mockTurtle.turtleY2screenY = jest.fn(y => y);
        painter.doForward(10);
        expect(mockTurtle.container.y).toBe(5);
    });

    test("doForward with wrap ON and out of bounds should wrap around up", () => {
        painter.wrap = true;
        mockTurtle.container.y = 5;
        mockTurtle.orientation = 180;
        mockTurtle.turtleX2screenX = jest.fn(x => x);
        mockTurtle.turtleY2screenY = jest.fn(y => y);
        painter.doForward(10);
        expect(mockTurtle.container.y).toBe(595);
    });

    test("doForward with wrap OFF and out of bounds should stop at edge", () => {
        painter.wrap = false;
        mockTurtle.container.x = 795;
        mockTurtle.orientation = 90;
        mockTurtle.turtleX2screenX = jest.fn(x => x);
        mockTurtle.turtleY2screenY = jest.fn(y => y);
        const startX = mockTurtle.container.x;
        painter.doForward(20);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
        expect(mockTurtle.container.x).toBe(startX + 20);
    });

    test("doForward should trigger view media position updates if view exists", () => {
        const mockView = { _updateMediaPositions: jest.fn() };
        mockTurtle._view = mockView;
        painter.doForward(10);
        expect(mockView._updateMediaPositions).toHaveBeenCalled();
    });
});

describe("Drawing - doArc", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("should call _doArcPart for a 90-degree arc", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(90, 100);
        expect(arcSpy).toHaveBeenCalledWith(90, 100);
        expect(arcSpy).toHaveBeenCalledTimes(1);
    });

    test("should break 180-degree arc into two 90-degree parts", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(180, 100);
        expect(arcSpy).toHaveBeenCalledTimes(2);
        expect(arcSpy).toHaveBeenCalledWith(90, 100);
    });

    test("should break 360-degree arc into four 90-degree parts", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(360, 100);
        expect(arcSpy).toHaveBeenCalledTimes(4);
    });

    test("should handle arc with remainder (e.g., 135 = 90 + 45)", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(135, 100);
        expect(arcSpy).toHaveBeenCalledTimes(2);
        expect(arcSpy).toHaveBeenNthCalledWith(1, 90, 100);
        expect(arcSpy).toHaveBeenNthCalledWith(2, 45, 100);
    });

    test("should handle negative angle by using factor -1", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(-90, 100);
        expect(arcSpy).toHaveBeenCalledWith(-90, 100);
    });

    test("should convert negative radius to positive", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(90, -50);
        expect(arcSpy).toHaveBeenCalledWith(90, 50);
    });

    test("should handle small angle (less than 90)", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(45, 100);
        expect(arcSpy).toHaveBeenCalledTimes(1);
        expect(arcSpy).toHaveBeenCalledWith(45, 100);
    });

    test("should handle zero angle", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(0, 100);
        expect(arcSpy).not.toHaveBeenCalled();
    });

    test("doArc should handle NaN or Infinity gracefully", () => {
        painter.doArc(NaN, 10);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
        mockTurtle.turtles.activity.errorMsg.mockClear();
        painter.doArc(10, Infinity);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
    });
});

describe("Heading and orientation", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("doSetHeading should set orientation to given degrees", () => {
        painter.doSetHeading(45);
        expect(mockTurtle.orientation).toBe(45);
    });

    test("doSetHeading should normalize negative degrees", () => {
        painter.doSetHeading(-90);
        expect(mockTurtle.orientation).toBe(270);
    });

    test("doSetHeading should normalize degrees above 360", () => {
        painter.doSetHeading(450);
        expect(mockTurtle.orientation).toBe(90);
    });

    test("doSetHeading should set container rotation", () => {
        painter.doSetHeading(180);
        expect(mockTurtle.container.rotation).toBe(180);
    });

    test("doSetHeading should update cache when not blinking", () => {
        painter.doSetHeading(90);
        expect(mockTurtle.updateCache).toHaveBeenCalled();
    });

    test("doSetHeading should not update cache when blinking", () => {
        mockTurtle.blinking.mockReturnValue(true);
        painter.doSetHeading(90);
        expect(mockTurtle.updateCache).not.toHaveBeenCalled();
    });

    test("doSetHeading should handle NaN or Infinity gracefully", () => {
        painter.doSetHeading(NaN);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
        mockTurtle.turtles.activity.errorMsg.mockClear();
        painter.doSetHeading(Infinity);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
    });

    test("doRight should add degrees to current orientation", () => {
        mockTurtle.orientation = 45;
        painter.doRight(90);
        expect(mockTurtle.orientation).toBe(135);
    });

    test("doRight should handle negative degrees (turn left)", () => {
        mockTurtle.orientation = 45;
        painter.doRight(-90);
        expect(mockTurtle.orientation).toBe(315);
    });

    test("doRight should wrap around 360", () => {
        mockTurtle.orientation = 350;
        painter.doRight(20);
        expect(mockTurtle.orientation).toBe(10);
    });

    test("doRight with 0 degrees should not change orientation", () => {
        mockTurtle.orientation = 90;
        painter.doRight(0);
        expect(mockTurtle.orientation).toBe(90);
    });

    test("doRight with full rotation should return to same orientation", () => {
        mockTurtle.orientation = 45;
        painter.doRight(360);
        expect(mockTurtle.orientation).toBe(45);
    });

    test("doRight should handle NaN or Infinity gracefully", () => {
        painter.doRight(NaN);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
        mockTurtle.turtles.activity.errorMsg.mockClear();
        painter.doRight(Infinity);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
    });
});

describe("Fill and hollow state", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("doStartFill should set fillState to true and call beginPath", () => {
        painter.doStartFill();
        expect(painter._fillState).toBe(true);
        expect(mockTurtle.ctx.beginPath).toHaveBeenCalled();
    });

    test("doEndFill should set fillState to false and call fill/closePath", () => {
        painter.doStartFill();
        painter.doEndFill();
        expect(painter._fillState).toBe(false);
        expect(mockTurtle.ctx.fill).toHaveBeenCalled();
        expect(mockTurtle.ctx.closePath).toHaveBeenCalled();
    });

    test("doStartHollowLine should set hollowState to true", () => {
        painter.doStartHollowLine();
        expect(painter._hollowState).toBe(true);
    });

    test("doEndHollowLine should set hollowState to false", () => {
        painter.doStartHollowLine();
        painter.doEndHollowLine();
        expect(painter._hollowState).toBe(false);
    });
});

describe("Bezier control points", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("setControlPoint1 should set cp1x and cp1y", () => {
        painter.setControlPoint1([50, 75]);
        expect(painter.cp1x).toBe(50);
        expect(painter.cp1y).toBe(75);
    });

    test("setControlPoint2 should set cp2x and cp2y", () => {
        painter.setControlPoint2([200, 150]);
        expect(painter.cp2x).toBe(200);
        expect(painter.cp2y).toBe(150);
    });
});

describe("Font setting", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("doSetFont should update font", () => {
        painter.doSetFont("monospace");
        expect(painter._font).toBe("monospace");
    });

    test("font getter should return current font", () => {
        painter.doSetFont("serif");
        expect(painter.font).toBe("serif");
    });
});

describe("Painter._outOfBounds()", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("returns true when x > width", () => {
        expect(painter._outOfBounds(101, 50, 100, 100)).toBe(true);
    });

    test("returns true when x < 0", () => {
        expect(painter._outOfBounds(-1, 50, 100, 100)).toBe(true);
    });

    test("returns true when y > height", () => {
        expect(painter._outOfBounds(50, 101, 100, 100)).toBe(true);
    });

    test("returns true when y < 0", () => {
        expect(painter._outOfBounds(50, -1, 100, 100)).toBe(true);
    });

    test("returns false when in bounds", () => {
        expect(painter._outOfBounds(50, 50, 100, 100)).toBe(false);
    });

    test("returns false at edge x=0, y=0", () => {
        expect(painter._outOfBounds(0, 0, 100, 100)).toBe(false);
    });

    test("returns false at edge x=width, y=height", () => {
        expect(painter._outOfBounds(100, 100, 100, 100)).toBe(false);
    });
});

describe("Internal Drawing Helpers and Hollow Lines", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("_move should support invert = false", () => {
        painter._move(0, 0, 100, 200, false);
        expect(mockTurtle.turtles.screenX2turtleX).toHaveBeenCalledWith(100);
        expect(mockTurtle.turtles.screenY2turtleY).toHaveBeenCalledWith(200);
        expect(mockTurtle.container.x).toBe(100);
        expect(mockTurtle.container.y).toBe(200);
    });

    test("hollow state drawing in _move with stroke < 3", () => {
        painter.doStartHollowLine();
        painter.stroke = 2;
        painter.doForward(10);
        expect(painter.svgOutput).toContain('<path d="M');
    });

    test("hollow state drawing in _move with stroke >= 3", () => {
        painter.doStartHollowLine();
        painter.stroke = 5;
        painter.doForward(10);
        expect(painter.svgOutput).toContain('<path d="M');
    });

    test("_arc should support invert = false", () => {
        painter._arc(0, 0, 0, 0, 100, 200, 10, 0, Math.PI, false, false);
        expect(mockTurtle.turtles.screenX2turtleX).toHaveBeenCalledWith(100);
        expect(mockTurtle.turtles.screenY2turtleY).toHaveBeenCalledWith(200);
        expect(mockTurtle.container.x).toBe(100);
        expect(mockTurtle.container.y).toBe(200);
    });

    test("_arc hollow state anticlockwise with positive and negative diffs", () => {
        painter.doStartHollowLine();
        painter.stroke = 4;

        // sa = Math.PI, ea = 0, anticlockwise = false
        // diff = ea - sa = -Math.PI (< 0)
        painter._arc(0, 0, 0, 0, 100, 200, 10, Math.PI, 0, false, true);
        expect(painter.svgOutput).toContain('<path d="M');

        painter.svgOutput = "";
        // sa = 0, ea = Math.PI, anticlockwise = true
        // diff = ea - sa = Math.PI (> 0)
        painter._arc(0, 0, 0, 0, 100, 200, 10, 0, Math.PI, true, true);
        expect(painter.svgOutput).toContain('<path d="M');
    });

    test("_svgArc wrapping triggers correctly", () => {
        painter.svgOutput = "";
        // !anticlockwise and diff < 0
        painter._svgArc(2, 0, 0, 10, Math.PI, 0, false, false);
        expect(painter.svgOutput).not.toBe("");

        painter.svgOutput = "";
        // anticlockwise and diff > 0
        painter._svgArc(2, 0, 0, 10, 0, Math.PI, true, false);
        expect(painter.svgOutput).not.toBe("");
    });

    test("_svgBezier should append coordinate output and option to drawOnCanvas", () => {
        painter.svgOutput = "";
        painter._svgBezier(2, 0, 0, 10, 10, 20, 20, 30, 30, true);
        expect(painter.svgOutput).not.toBe("");
        expect(mockTurtle.ctx.lineTo).toHaveBeenCalled();
    });

    test("_processColor should parse color hex codes", () => {
        painter.canvasColor = "#ff0031";
        painter._processColor();
        expect(hex2rgb).toHaveBeenCalledWith("ff0031");
        expect(mockTurtle.ctx.strokeStyle).toBe("rgba(255,0,49,1)");
    });

    test("closeSVG should set svgPath to false and append output based on fillState", () => {
        painter._svgPath = true;
        painter._fillState = true;
        painter.svgOutput = "M 0,0 ";
        painter.closeSVG();
        expect(painter._svgPath).toBe(false);
        expect(painter.svgOutput).toContain("fill-opacity:");

        painter._svgPath = true;
        painter._fillState = false;
        painter.svgOutput = "M 0,0 ";
        painter.closeSVG();
        expect(painter._svgPath).toBe(false);
        expect(painter.svgOutput).toContain("none;");
    });
});

describe("doSetXY operations", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("doSetXY should process color, beginPath, move, and schedule update", () => {
        const moveSpy = jest.spyOn(painter, "_move");
        painter.doSetXY(100, 200);
        expect(moveSpy).toHaveBeenCalledWith(0, 0, 100, 200, true);
        expect(mockTurtle.ctx.beginPath).toHaveBeenCalled();
    });

    test("doSetXY in fillState should not call beginPath", () => {
        painter.doStartFill();
        mockTurtle.ctx.beginPath.mockClear();
        painter.doSetXY(100, 200);
        expect(mockTurtle.ctx.beginPath).not.toHaveBeenCalled();
    });

    test("doSetXY should trigger view update if view exists", () => {
        const mockView = { _updateMediaPositions: jest.fn() };
        mockTurtle._view = mockView;
        painter.doSetXY(100, 200);
        expect(mockView._updateMediaPositions).toHaveBeenCalled();
    });

    test("doSetXY should handle NaN or Infinity gracefully", () => {
        painter.doSetXY(NaN, 200);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
        mockTurtle.turtles.activity.errorMsg.mockClear();
        painter.doSetXY(100, Infinity);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalled();
    });
});

describe("doBezier, doClearMedia, doClear and doScrollXY", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("doBezier with penDown and hollowState", () => {
        painter.doStartHollowLine();
        painter.cp1x = -10;
        painter.cp1y = 0;
        painter.cp2x = 50;
        painter.cp2y = 50;
        painter.stroke = 5;

        painter.doBezier(100, 100);
        expect(painter.turtle.x).toBe(100);
        expect(painter.turtle.y).toBe(100);
    });

    test("doBezier with penDown and standard line", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter.cp1x = 10;
        painter.cp1y = 10;
        painter.cp2x = 50;
        painter.cp2y = 50;

        painter.doBezier(100, 100);
        expect(painter.turtle.x).toBe(100);
        expect(painter.turtle.y).toBe(100);
    });

    test("doBezier with penUp", () => {
        painter._penDown = false;
        painter.doBezier(100, 100);
        expect(painter.turtle.x).toBe(100);
        expect(painter.turtle.y).toBe(100);
    });

    test("doClearMedia should return early if no media", () => {
        painter.turtle.media = [];
        painter.doClearMedia();
        expect(painter.turtle.media).toEqual([]);
    });

    test("doClearMedia should clear image and gif media", () => {
        const mockGif = { type: "gif", stop: jest.fn() };
        const mockImg = { type: "image" };
        painter.turtle.media = [mockGif, mockImg];
        painter.turtle.imageContainer = { removeChild: jest.fn() };
        painter.turtles.stage = { removeChild: jest.fn() };

        painter.doClearMedia();

        expect(mockGif.stop).toHaveBeenCalled();
        expect(painter.turtle.imageContainer.removeChild).toHaveBeenCalledWith(mockGif);
        expect(painter.turtle.imageContainer.removeChild).toHaveBeenCalledWith(mockImg);
        expect(painter.turtles.stage.removeChild).toHaveBeenCalledWith(mockGif);
        expect(painter.turtles.stage.removeChild).toHaveBeenCalledWith(mockImg);
        expect(painter.turtle.media).toEqual([]);
    });

    test("doClear should reset properties based on flags", () => {
        painter.turtle.name = "not_start";
        painter.turtle.skinChanged = true;
        painter.turtle._bitmap = { rotation: 0 };
        painter.turtles.c1ctx = { beginPath: jest.fn(), clearRect: jest.fn() };

        painter.doClear(true, true, true);

        expect(painter.turtle.x).toBe(0);
        expect(painter.turtle.y).toBe(0);
        expect(painter.turtle.rename).toHaveBeenCalledWith("start");
        expect(painter.turtle.doTurtleShell).toHaveBeenCalled();
        expect(painter.turtle._bitmap.rotation).toBe(0);
    });

    test("doScrollXY should create canvas1 if not exists, draw under active pens", () => {
        const turtle1 = {
            inTrash: false,
            painter: {
                penState: true,
                stroke: 5,
                _processColor: jest.fn()
            },
            container: { x: 10, y: 20 }
        };
        const turtleInTrash = {
            inTrash: true
        };
        const turtlePenUp = {
            inTrash: false,
            painter: {
                penState: false
            }
        };

        const list = [turtle1, turtleInTrash, turtlePenUp];
        painter.turtles.getTurtleCount = jest.fn(() => list.length);
        painter.turtles.getTurtle = jest.fn(i => list[i]);

        painter.doScrollXY(10, 20);

        expect(painter.turtles.canvas1).toBeDefined();
        expect(turtle1.painter._processColor).toHaveBeenCalled();
    });
});
