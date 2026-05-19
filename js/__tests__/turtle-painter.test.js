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

// Mock external color functions
global.getcolor = jest.fn(() => [50, 100, "rgba(255,0,49,1)"]);
global.getMunsellColor = jest.fn(() => "rgba(128,64,32,1)");
global.hex2rgb = jest.fn(hex => "rgba(255,0,49,1)");
global.NANERRORMSG = "NaN error";

const createMockTurtle = () => {
    const activity = {
        refreshCanvas: jest.fn(),
        errorMsg: jest.fn(),
        gifAnimator: null
    };

    return {
        turtles: {
            screenX2turtleX: jest.fn(x => x),
            screenY2turtleY: jest.fn(y => y),
            turtleX2screenX: jest.fn(x => x),
            turtleY2screenY: jest.fn(y => y),
            scale: 1,
            getTurtleCount: jest.fn(() => 0),
            getTurtle: jest.fn(),
            getIndexOfTurtle: jest.fn(() => 0),
            stage: { removeChild: jest.fn() },
            canvas1: null,
            c1ctx: null,
            gx: 0,
            gy: 0,
            activity
        },
        activity,
        container: { x: 0, y: 0, rotation: 0 },
        ctx: {
            beginPath: jest.fn(),
            clearRect: jest.fn(),
            stroke: jest.fn(),
            closePath: jest.fn(),
            moveTo: jest.fn(),
            lineTo: jest.fn(),
            arc: jest.fn(),
            fill: jest.fn(),
            putImageData: jest.fn(),
            getImageData: jest.fn(() => ({ data: [] })),
            canvas: { width: 800, height: 600 },
            strokeStyle: "",
            fillStyle: "",
            lineWidth: 1,
            lineCap: "",
            bezierCurveTo: jest.fn()
        },
        canvas: {},
        penstrokes: { image: null },
        orientation: 0,
        x: 0,
        y: 0,
        updateCache: jest.fn(),
        blinking: jest.fn().mockReturnValue(false),
        inTrash: false,
        media: [],
        imageContainer: { removeChild: jest.fn() },
        _view: null,
        _bitmap: null,
        skinChanged: false,
        name: "start"
    };
};

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

        test("should initialize SVG output as empty string", () => {
            expect(painter._svgOutput).toBe("");
            expect(painter._svgPath).toBe(false);
        });

        test("should initialize performance optimization fields", () => {
            expect(painter._cachedCanvas).toBeNull();
            expect(painter._pendingCanvasUpdate).toBe(false);
            expect(painter._rafId).toBeNull();
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
        // beginPath is called inside doForward only if !fillState
        // Since fillState is true, beginPath should not be called again from doForward
        // (it was called once in doStartFill)
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
        // Should still process the movement (refreshCanvas called)
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("should reject NaN input and call errorMsg", () => {
        painter.doForward(NaN);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("should reject Infinity input and call errorMsg", () => {
        painter.doForward(Infinity);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("should reject -Infinity input and call errorMsg", () => {
        painter.doForward(-Infinity);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("should trigger wrap logic when turtle goes out of bounds", () => {
        global.WRAP = true;
        // Place turtle near edge so next step goes out of bounds
        mockTurtle.container.x = 790;
        mockTurtle.container.y = 300;
        mockTurtle.turtles.screenX2turtleX = jest.fn(x => x);
        mockTurtle.turtles.screenY2turtleY = jest.fn(y => y);
        mockTurtle.turtles.turtleX2screenX = jest.fn(x => x);
        mockTurtle.turtles.turtleY2screenY = jest.fn(y => y);
        painter.doForward(100);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("should NOT wrap when WRAP is false", () => {
        global.WRAP = false;
        painter.doForward(100);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
        global.WRAP = true;
    });

    test("should use instance wrap override when set", () => {
        painter.wrap = false;
        painter.doForward(100);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
        painter.wrap = null;
    });

    test("should call view._updateMediaPositions if view exists", () => {
        const mockUpdateFn = jest.fn();
        mockTurtle._view = { _updateMediaPositions: mockUpdateFn };
        painter.doForward(10);
        expect(mockUpdateFn).toHaveBeenCalled();
    });

    test("should handle forward with linePart first", () => {
        painter.doForward(10, "first");
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("should handle forward with linePart last", () => {
        painter.doForward(10, "last");
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("canvas color starting with # triggers hex2rgb in processColor", () => {
        painter._canvasColor = "#ff0031";
        painter.doForward(10);
        expect(hex2rgb).toHaveBeenCalled();
    });

    test("should handle wrap with negative steps", () => {
        global.WRAP = true;
        mockTurtle.container.x = 5;
        mockTurtle.container.y = 5;
        painter.doForward(-200);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
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

    test("should reject NaN angle and call errorMsg", () => {
        painter.doArc(NaN, 100);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("should reject NaN radius and call errorMsg", () => {
        painter.doArc(90, NaN);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("should handle large arc (720 degrees = eight 90-degree parts)", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(720, 100);
        expect(arcSpy).toHaveBeenCalledTimes(8);
    });

    test("should handle negative arc with remainder (-135)", () => {
        const arcSpy = jest.spyOn(painter, "_doArcPart");
        painter.doArc(-135, 50);
        expect(arcSpy).toHaveBeenCalledTimes(2);
        expect(arcSpy).toHaveBeenNthCalledWith(1, -90, 50);
        expect(arcSpy).toHaveBeenNthCalledWith(2, -45, 50);
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

    test("doSetHeading should reject NaN and call errorMsg", () => {
        painter.doSetHeading(NaN);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("doSetHeading should normalize exactly 360 to 0", () => {
        painter.doSetHeading(360);
        expect(mockTurtle.orientation).toBe(0);
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

    test("doRight should reject NaN and call errorMsg", () => {
        painter.doRight(NaN);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("doRight should not update cache when blinking", () => {
        mockTurtle.blinking.mockReturnValue(true);
        painter.doRight(45);
        expect(mockTurtle.updateCache).not.toHaveBeenCalled();
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

    test("doForward in fill state should not call beginPath on ctx", () => {
        painter.doStartFill();
        mockTurtle.ctx.beginPath.mockClear();
        painter.doForward(10);
        // beginPath should NOT be called again from doForward when fillState is true
        expect(mockTurtle.ctx.beginPath).not.toHaveBeenCalled();
    });

    test("doEndFill should call closeSVG (no svgPath set = no-op)", () => {
        painter.doStartFill();
        painter.doEndFill();
        // closeSVG with _svgPath = false is a no-op; just ensure no error
        expect(painter._fillState).toBe(false);
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

    test("setControlPoint1 with negative values", () => {
        painter.setControlPoint1([-50, -75]);
        expect(painter.cp1x).toBe(-50);
        expect(painter.cp1y).toBe(-75);
    });

    test("setControlPoint2 with zero values", () => {
        painter.setControlPoint2([0, 0]);
        expect(painter.cp2x).toBe(0);
        expect(painter.cp2y).toBe(0);
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

    test("doSetFont should call updateCache", () => {
        painter.doSetFont("Arial");
        expect(mockTurtle.updateCache).toHaveBeenCalled();
    });
});

describe("closeSVG", () => {
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

    test("closeSVG should do nothing when _svgPath is false", () => {
        painter._svgPath = false;
        const initialOutput = painter._svgOutput;
        painter.closeSVG();
        expect(painter._svgOutput).toBe(initialOutput);
    });

    test("closeSVG should append SVG style when _svgPath is true (no fill)", () => {
        painter._svgPath = true;
        painter._fillState = false;
        painter._canvasColor = "rgba(255,0,0,1)";
        painter.closeSVG();
        expect(painter._svgPath).toBe(false);
        expect(painter._svgOutput).toContain("stroke");
        expect(painter._svgOutput).toContain("none");
    });

    test("closeSVG should include fill color when fillState is true", () => {
        painter._svgPath = true;
        painter._fillState = true;
        painter._canvasColor = "rgba(0,255,0,1)";
        painter.closeSVG();
        expect(painter._svgOutput).toContain("fill-opacity");
    });

    test("closeSVG called on doPenUp should close any open path", () => {
        painter._svgPath = true;
        painter._canvasColor = "rgba(255,0,0,1)";
        painter.doPenUp();
        expect(painter._svgPath).toBe(false);
    });
});

describe("_getCanvasDimensions caching", () => {
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

    test("should return correct dimensions on first call", () => {
        const dims = painter._getCanvasDimensions();
        expect(dims.width).toBe(800);
        expect(dims.height).toBe(600);
    });

    test("should cache canvas reference and reuse on second call", () => {
        painter._getCanvasDimensions();
        const dims2 = painter._getCanvasDimensions();
        expect(dims2.width).toBe(800);
        expect(dims2.height).toBe(600);
    });

    test("should update cache if canvas reference changes", () => {
        painter._getCanvasDimensions();
        // Swap canvas reference
        mockTurtle.ctx.canvas = { width: 1024, height: 768 };
        const dims2 = painter._getCanvasDimensions();
        expect(dims2.width).toBe(1024);
        expect(dims2.height).toBe(768);
    });
});

describe("_scheduleCanvasUpdate RAF batching", () => {
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

    test("should call refreshCanvas via RAF", () => {
        painter._scheduleCanvasUpdate();
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("should not call RAF again if already pending", () => {
        // Prevent the RAF callback from running immediately for this test
        window.requestAnimationFrame.mockImplementation(() => {});
        painter._pendingCanvasUpdate = true;
        painter._scheduleCanvasUpdate();
        expect(window.requestAnimationFrame).not.toHaveBeenCalled();
    });
});

describe("_outOfBounds", () => {
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

    test("should return false for in-bounds coordinates", () => {
        expect(painter._outOfBounds(100, 100, 800, 600)).toBe(false);
    });

    test("should return true when x exceeds width", () => {
        expect(painter._outOfBounds(900, 100, 800, 600)).toBe(true);
    });

    test("should return true when x is negative", () => {
        expect(painter._outOfBounds(-1, 100, 800, 600)).toBe(true);
    });

    test("should return true when y exceeds height", () => {
        expect(painter._outOfBounds(100, 700, 800, 600)).toBe(true);
    });

    test("should return true when y is negative", () => {
        expect(painter._outOfBounds(100, -1, 800, 600)).toBe(true);
    });

    test("should return false at exact boundary", () => {
        expect(painter._outOfBounds(800, 600, 800, 600)).toBe(false);
    });
});

describe("_processColor", () => {
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

    test("should set strokeStyle and fillStyle from rgba color", () => {
        painter._canvasColor = "rgba(255,0,0,1)";
        painter._canvasAlpha = 1;
        painter._processColor();
        expect(mockTurtle.ctx.strokeStyle).toContain("rgba(255,0,0,");
        expect(mockTurtle.ctx.fillStyle).toContain("rgba(255,0,0,");
    });

    test("should convert hex color to rgb before setting styles", () => {
        painter._canvasColor = "#ff0031";
        painter._processColor();
        expect(hex2rgb).toHaveBeenCalledWith("ff0031");
    });

    test("should apply custom alpha value", () => {
        painter._canvasColor = "rgba(100,200,50,1)";
        painter._canvasAlpha = 0.5;
        painter._processColor();
        expect(mockTurtle.ctx.strokeStyle).toContain("0.5");
    });
});

describe("doSetXY", () => {
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

    test("should move turtle to specified coordinates", () => {
        painter.doSetXY(100, 200);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("should reject NaN x coordinate", () => {
        painter.doSetXY(NaN, 100);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("should reject NaN y coordinate", () => {
        painter.doSetXY(100, NaN);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("should reject Infinity x coordinate", () => {
        painter.doSetXY(Infinity, 100);
        expect(mockTurtle.activity.errorMsg).toHaveBeenCalled();
    });

    test("should call beginPath when not in fill state", () => {
        painter.doSetXY(50, 50);
        expect(mockTurtle.ctx.beginPath).toHaveBeenCalled();
    });

    test("should NOT call beginPath when in fill state", () => {
        painter.doStartFill();
        mockTurtle.ctx.beginPath.mockClear();
        painter.doSetXY(50, 50);
        expect(mockTurtle.ctx.beginPath).not.toHaveBeenCalled();
    });

    test("should call view._updateMediaPositions if view exists", () => {
        const mockUpdateFn = jest.fn();
        mockTurtle._view = { _updateMediaPositions: mockUpdateFn };
        painter.doSetXY(50, 50);
        expect(mockUpdateFn).toHaveBeenCalled();
    });

    test("pen up during doSetXY should still update position", () => {
        painter.doPenUp();
        painter.doSetXY(50, 50);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });
});

describe("_move method coverage", () => {
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

    test("_move with pen down and NOT hollow should call lineTo", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter._svgPath = true; // already in path so won't open a new one
        painter._move(0, 0, 10, 10, false, null);
        expect(mockTurtle.ctx.lineTo).toHaveBeenCalledWith(10, 10);
    });

    test("_move with pen up should call moveTo", () => {
        painter._penDown = false;
        painter._move(0, 0, 10, 10, false, null);
        expect(mockTurtle.ctx.moveTo).toHaveBeenCalledWith(10, 10);
    });

    test("_move with invert=true should convert coordinates", () => {
        painter._penDown = true;
        painter._move(0, 0, 10, 10, true, null);
        expect(mockTurtle.turtles.turtleX2screenX).toHaveBeenCalled();
        expect(mockTurtle.turtles.turtleY2screenY).toHaveBeenCalled();
    });

    test("_move with pen down and hollow should perform hollow line draw", () => {
        painter._penDown = true;
        painter._hollowState = true;
        painter._canvasColor = "rgba(255,0,0,1)";
        painter._move(0, 0, 10, 10, false, null);
        expect(mockTurtle.ctx.stroke).toHaveBeenCalled();
        expect(mockTurtle.ctx.closePath).toHaveBeenCalled();
    });

    test("_move starts new SVG path if not yet in a path (pen down, normal)", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter._svgPath = false;
        painter._move(0, 0, 10, 10, false, null);
        expect(painter._svgPath).toBe(true);
        expect(painter._svgOutput).toContain("M ");
    });

    test("_move with linePart=first should call arc for cap", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter._move(0, 0, 10, 10, false, "first");
        expect(mockTurtle.ctx.arc).toHaveBeenCalled();
    });

    test("_move with linePart=last should call arc for end cap", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter._move(0, 0, 10, 10, false, "last");
        expect(mockTurtle.ctx.arc).toHaveBeenCalled();
    });

    test("_move with fill state should not call closePath", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter._fillState = true;
        painter._svgPath = true;
        painter._move(0, 0, 10, 10, false, null);
        // closePath should NOT be called while in fill state
        expect(mockTurtle.ctx.closePath).not.toHaveBeenCalled();
    });
});

describe("_doArcPart with hollow state", () => {
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

    test("_doArcPart with hollow state should draw hollow arc", () => {
        painter._penDown = true;
        painter._hollowState = true;
        painter._canvasColor = "rgba(255,0,0,1)";
        painter._doArcPart(90, 50);
        expect(mockTurtle.ctx.stroke).toHaveBeenCalled();
        expect(mockTurtle.ctx.closePath).toHaveBeenCalled();
    });

    test("_doArcPart with fill state should not call beginPath from lineWidth block", () => {
        painter._penDown = true;
        painter._fillState = true;
        mockTurtle.ctx.beginPath.mockClear();
        painter._doArcPart(90, 50);
        expect(mockTurtle.ctx.beginPath).not.toHaveBeenCalled();
    });

    test("_doArcPart negative angle (anticlockwise)", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter._doArcPart(-90, 50);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("_doArcPart pen up should not call stroke", () => {
        painter._penDown = false;
        painter._doArcPart(90, 50);
        // With pen up, the arc method calls moveTo, not stroke
        expect(mockTurtle.ctx.moveTo).toHaveBeenCalled();
    });

    test("_doArcPart lineWidth update when different from stroke", () => {
        mockTurtle.ctx.lineWidth = 1;
        painter._stroke = 8;
        painter._penDown = true;
        painter._fillState = false;
        painter._doArcPart(45, 30);
        expect(mockTurtle.ctx.lineWidth).toBe(8);
    });
});

describe("doBezier", () => {
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

    test("doBezier with pen down (normal) should update turtle position", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter.setControlPoint1([10, 20]);
        painter.setControlPoint2([30, 40]);
        painter.doBezier(50, 60);
        expect(mockTurtle.x).toBe(50);
        expect(mockTurtle.y).toBe(60);
    });

    test("doBezier with pen up should still update position", () => {
        painter._penDown = false;
        painter.doBezier(100, 200);
        expect(mockTurtle.x).toBe(100);
        expect(mockTurtle.y).toBe(200);
    });

    test("doBezier with hollow state should call stroke and closePath", () => {
        painter._penDown = true;
        painter._hollowState = true;
        painter._canvasColor = "rgba(255,0,0,1)";
        painter.setControlPoint1([10, 10]);
        painter.setControlPoint2([20, 20]);
        painter.doBezier(30, 30);
        expect(mockTurtle.ctx.stroke).toHaveBeenCalled();
        expect(mockTurtle.ctx.closePath).toHaveBeenCalled();
    });

    test("doBezier should call doSetHeading at the end", () => {
        painter._penDown = true;
        painter._hollowState = false;
        const headingSpy = jest.spyOn(painter, "doSetHeading");
        painter.doBezier(50, 50);
        expect(headingSpy).toHaveBeenCalled();
    });

    test("doBezier with pen down should update container position", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter.doBezier(75, 80);
        expect(mockTurtle.container.x).not.toBeUndefined();
        expect(mockTurtle.container.y).not.toBeUndefined();
    });

    test("doBezier with existing svgPath should not add another M command", () => {
        painter._penDown = true;
        painter._hollowState = false;
        painter._svgPath = true;
        painter._svgOutput = '<path d="M 0,0 ';
        painter.doBezier(50, 50);
        // Should not add another M
        const mCount = (painter._svgOutput.match(/M /g) || []).length;
        expect(mCount).toBe(1);
    });
});

describe("_svgArc helper", () => {
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

    test("should append coordinates to svgOutput", () => {
        painter._svgOutput = "";
        painter._svgArc(4, 100, 100, 50, 0, Math.PI / 2, false, false);
        expect(painter._svgOutput).not.toBe("");
    });

    test("should call lineTo when drawOnCanvas is true", () => {
        painter._svgArc(4, 100, 100, 50, 0, Math.PI / 2, false, true);
        expect(mockTurtle.ctx.lineTo).toHaveBeenCalled();
    });

    test("should handle anticlockwise arc with diff adjustment", () => {
        painter._svgOutput = "";
        painter._svgArc(4, 0, 0, 50, Math.PI / 2, 0, true, false);
        expect(painter._svgOutput).not.toBe("");
    });

    test("should NOT call lineTo when drawOnCanvas is false", () => {
        painter._svgArc(4, 0, 0, 50, 0, Math.PI / 2, false, false);
        expect(mockTurtle.ctx.lineTo).not.toHaveBeenCalled();
    });
});

describe("_svgBezier helper", () => {
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

    test("should append bezier curve points to svgOutput", () => {
        painter._svgOutput = "";
        painter._svgBezier(4, 0, 0, 10, 10, 20, 20, 30, 30, false);
        expect(painter._svgOutput).not.toBe("");
    });

    test("should call lineTo when drawOnCanvas is true", () => {
        painter._svgBezier(4, 0, 0, 10, 10, 20, 20, 30, 30, true);
        expect(mockTurtle.ctx.lineTo).toHaveBeenCalled();
    });
});

describe("_estimateBezierSteps helper", () => {
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

    test("should return at least 12 steps", () => {
        const steps = painter._estimateBezierSteps(0, 0, 1, 1, 2, 2, 3, 3);
        expect(steps).toBeGreaterThanOrEqual(12);
    });

    test("should return more steps for a more curved path", () => {
        const straightSteps = painter._estimateBezierSteps(0, 0, 10, 0, 20, 0, 30, 0);
        const curvedSteps = painter._estimateBezierSteps(0, 0, 100, 100, 200, -100, 300, 0);
        expect(curvedSteps).toBeGreaterThanOrEqual(straightSteps);
    });
});

describe("doClearMedia", () => {
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

    test("should do nothing when media array is empty", () => {
        mockTurtle.media = [];
        painter.doClearMedia();
        expect(mockTurtle.imageContainer.removeChild).not.toHaveBeenCalled();
    });

    test("should do nothing when media is undefined/null-length", () => {
        mockTurtle.media = [];
        painter.doClearMedia();
        // No errors thrown
        expect(mockTurtle.media.length).toBe(0);
    });

    test("should remove media items and clear the array", () => {
        const mockItem = { type: "image" };
        mockTurtle.media = [mockItem];
        painter.doClearMedia();
        expect(mockTurtle.imageContainer.removeChild).toHaveBeenCalled();
        expect(mockTurtle.media.length).toBe(0);
    });

    test("should stop GIF animation if gifAnimator present", () => {
        const stopFn = jest.fn();
        const gifItem = { type: "gif", stop: stopFn };
        mockTurtle.media = [gifItem];
        mockTurtle.activity.gifAnimator = {};
        painter.doClearMedia();
        expect(stopFn).toHaveBeenCalled();
    });

    test("should not call stop for non-gif items", () => {
        const stopFn = jest.fn();
        const imageItem = { type: "image", stop: stopFn };
        mockTurtle.media = [imageItem];
        mockTurtle.activity.gifAnimator = {};
        painter.doClearMedia();
        expect(stopFn).not.toHaveBeenCalled();
    });
});

describe("doClear", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        mockTurtle = createMockTurtle();
        // Required globals for doClear
        global.TURTLESVG = "<svg>turtle</svg>";
        global.FILLCOLORS = { at: jest.fn(() => "#fff") };
        global.STROKECOLORS = { at: jest.fn(() => "#000") };
        global._ = jest.fn(s => s);
        global.base64Encode = jest.fn(s => s);
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
    });

    test("doClear with all resets should reset position and pen", () => {
        painter.doClear(true, false, true);
        expect(mockTurtle.x).toBe(0);
        expect(mockTurtle.y).toBe(0);
        expect(mockTurtle.orientation).toBe(0);
    });

    test("doClear with resetPen should reset color and stroke defaults", () => {
        painter.color = 99;
        painter.stroke = 20;
        painter.doClear(true, false, false);
        expect(painter.stroke).toBe(5); // DEFAULTSTROKE
        expect(painter._font).toBe("sans-serif");
    });

    test("doClear should reset penDown to true", () => {
        painter._penDown = false;
        painter.doClear(false, false, false);
        expect(painter._penDown).toBe(true);
    });

    test("doClear should reset fillState and hollowState to false", () => {
        painter._fillState = true;
        painter._hollowState = true;
        painter.doClear(false, false, false);
        expect(painter._fillState).toBe(false);
        expect(painter._hollowState).toBe(false);
    });

    test("doClear should reset svgOutput to empty", () => {
        painter._svgOutput = "some content";
        painter.doClear(false, false, false);
        expect(painter._svgOutput).toBe("");
    });

    test("doClear should call clearRect", () => {
        painter.doClear(false, false, false);
        expect(mockTurtle.ctx.clearRect).toHaveBeenCalled();
    });

    test("doClear should call scheduleCanvasUpdate", () => {
        painter.doClear(false, false, false);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("doClear with c1ctx should clear scroll canvas too", () => {
        const clearRect2 = jest.fn();
        const beginPath2 = jest.fn();
        mockTurtle.turtles.c1ctx = { clearRect: clearRect2, beginPath: beginPath2 };
        painter.doClear(false, false, false);
        expect(clearRect2).toHaveBeenCalled();
    });

    test("doClear with hex canvasColor should convert to rgb", () => {
        getMunsellColor.mockReturnValue("#aabbcc");
        painter.doClear(true, false, false);
        expect(hex2rgb).toHaveBeenCalled();
    });

    test("doClear should call doClearMedia", () => {
        const clearMediaSpy = jest.spyOn(painter, "doClearMedia");
        painter.doClear(false, false, false);
        expect(clearMediaSpy).toHaveBeenCalled();
    });
});

describe("doScrollXY", () => {
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

    test("should create canvas1 when it does not exist", () => {
        mockTurtle.turtles.canvas1 = null;
        const createElementSpy = jest.spyOn(document, "createElement").mockReturnValue({
            width: 0,
            height: 0,
            getContext: jest.fn(() => ({
                rect: jest.fn(),
                fillStyle: "",
                fill: jest.fn(),
                putImageData: jest.fn(),
                getImageData: jest.fn(() => ({ data: [] })),
                beginPath: jest.fn()
            }))
        });
        painter.doScrollXY(10, 20);
        expect(createElementSpy).toHaveBeenCalledWith("canvas");
        createElementSpy.mockRestore();
    });

    test("should call putImageData when canvas1 already exists", () => {
        const c1ctxMock = {
            putImageData: jest.fn(),
            getImageData: jest.fn(() => ({ data: [] })),
            rect: jest.fn(),
            fill: jest.fn()
        };
        mockTurtle.turtles.canvas1 = { width: 1600, height: 1200 };
        mockTurtle.turtles.c1ctx = c1ctxMock;
        mockTurtle.turtles.gx = 0;
        mockTurtle.turtles.gy = 0;
        painter.doScrollXY(10, 20);
        expect(c1ctxMock.putImageData).toHaveBeenCalled();
    });

    test("should clamp scroll coordinates within bounds", () => {
        const c1ctxMock = {
            putImageData: jest.fn(),
            getImageData: jest.fn(() => ({ data: [] }))
        };
        mockTurtle.turtles.canvas1 = {};
        mockTurtle.turtles.c1ctx = c1ctxMock;
        mockTurtle.turtles.gx = -100;
        mockTurtle.turtles.gy = -100;
        painter.doScrollXY(0, 0);
        expect(mockTurtle.turtles.gx).toBeGreaterThanOrEqual(0);
        expect(mockTurtle.turtles.gy).toBeGreaterThanOrEqual(0);
    });

    test("should draw under turtle if pen is down during scroll", () => {
        const c1ctxMock = {
            putImageData: jest.fn(),
            getImageData: jest.fn(() => ({ data: [] }))
        };
        mockTurtle.turtles.canvas1 = {};
        mockTurtle.turtles.c1ctx = c1ctxMock;

        // Add a second turtle with pen down
        const secondTurtle = createMockTurtle();
        secondTurtle.painter = new Painter(secondTurtle);
        secondTurtle.painter._penDown = true;
        secondTurtle.inTrash = false;

        mockTurtle.turtles.getTurtleCount = jest.fn(() => 1);
        mockTurtle.turtles.getTurtle = jest.fn(() => secondTurtle);

        painter.doScrollXY(5, 5);
        expect(mockTurtle.ctx.stroke).toHaveBeenCalled();
    });

    test("should skip turtles that are in trash during scroll", () => {
        const c1ctxMock = {
            putImageData: jest.fn(),
            getImageData: jest.fn(() => ({ data: [] }))
        };
        mockTurtle.turtles.canvas1 = {};
        mockTurtle.turtles.c1ctx = c1ctxMock;

        const trashedTurtle = createMockTurtle();
        trashedTurtle.inTrash = true;

        mockTurtle.turtles.getTurtleCount = jest.fn(() => 1);
        mockTurtle.turtles.getTurtle = jest.fn(() => trashedTurtle);

        const strokeCallsBefore = mockTurtle.ctx.stroke.mock.calls.length;
        painter.doScrollXY(5, 5);
        // stroke should not be called for the trashed turtle's drawing
        expect(mockTurtle.ctx.stroke.mock.calls.length).toBe(strokeCallsBefore);
    });
});

describe("Hollow line drawing via doForward", () => {
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

    test("doForward in hollow state should call stroke", () => {
        painter.doStartHollowLine();
        painter.doForward(20);
        expect(mockTurtle.ctx.stroke).toHaveBeenCalled();
    });

    test("doForward in hollow state with thin stroke (< 3) uses step 0.5", () => {
        painter._stroke = 2;
        painter.doStartHollowLine();
        painter.doForward(20);
        expect(mockTurtle.ctx.stroke).toHaveBeenCalled();
    });

    test("doForward in hollow state with thick stroke uses step calculation", () => {
        painter._stroke = 10;
        painter.doStartHollowLine();
        painter.doForward(20);
        expect(mockTurtle.ctx.stroke).toHaveBeenCalled();
    });
});

describe("Wrap boundary crossing", () => {
    let painter;
    let mockTurtle;

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
        global.WRAP = true;
        mockTurtle = createMockTurtle();
        painter = new Painter(mockTurtle);
    });

    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
        jest.clearAllMocks();
        global.WRAP = true;
    });

    test("turtle wraps from right edge to left", () => {
        mockTurtle.container.x = 799;
        mockTurtle.container.y = 300;
        mockTurtle.orientation = 90; // facing right
        painter.doForward(50);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("turtle wraps from bottom edge to top", () => {
        mockTurtle.container.x = 400;
        mockTurtle.container.y = 599;
        mockTurtle.orientation = 0; // facing down (in screen coords)
        painter.doForward(50);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("wrap is disabled per-instance override", () => {
        painter.wrap = false;
        mockTurtle.container.x = 799;
        painter.doForward(100);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });
});

describe("Edge cases and integration", () => {
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

    test("full sequence: penUp, move, penDown, draw arc", () => {
        painter.doPenUp();
        painter.doForward(50);
        painter.doPenDown();
        painter.doArc(90, 30);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("full sequence: set color then draw", () => {
        getcolor.mockReturnValue([60, 90, "rgba(50,200,100,1)"]);
        painter.doSetColor(20);
        painter.doForward(10);
        expect(mockTurtle.ctx.strokeStyle).not.toBe("");
    });

    test("fill cycle: start fill, draw, end fill", () => {
        painter.doStartFill();
        painter.doForward(30);
        painter.doRight(90);
        painter.doForward(30);
        painter.doEndFill();
        expect(mockTurtle.ctx.fill).toHaveBeenCalled();
        expect(painter._fillState).toBe(false);
    });

    test("hollow arc: start hollow, doArc, end hollow", () => {
        painter.doStartHollowLine();
        painter.doArc(180, 50);
        painter.doEndHollowLine();
        expect(painter._hollowState).toBe(false);
    });

    test("bezier then arc then forward", () => {
        painter.setControlPoint1([10, 20]);
        painter.setControlPoint2([30, 40]);
        painter.doBezier(50, 50);
        painter.doArc(45, 20);
        painter.doForward(15);
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("setting lineCap to round is idempotent (already round)", () => {
        mockTurtle.ctx.lineCap = "round";
        painter.doForward(10);
        // Should not re-assign unnecessarily but should not throw
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("lineWidth assignment skipped when already equal to stroke", () => {
        mockTurtle.ctx.lineWidth = 5; // same as default stroke
        painter.doForward(10);
        // Should work correctly without re-assigning
        expect(mockTurtle.activity.refreshCanvas).toHaveBeenCalled();
    });

    test("doSetColor with string argument should parse to number", () => {
        painter.doSetColor("25");
        expect(painter.color).toBe(25);
    });

    test("doSetValue with string argument should parse to number", () => {
        painter.doSetValue("80");
        expect(painter.value).toBe(80);
    });

    test("doSetChroma with string argument should parse to number", () => {
        painter.doSetChroma("60");
        expect(painter.chroma).toBe(60);
    });

    test("doSetHue with string argument should parse to number", () => {
        painter.doSetHue("200");
        expect(painter.color).toBe(200);
    });
});
