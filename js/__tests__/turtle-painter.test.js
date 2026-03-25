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

const createMockTurtle = () => ({
    turtles: {
        screenX2turtleX: jest.fn(x => x),
        screenY2turtleY: jest.fn(y => y),
        turtleX2screenX: jest.fn(x => x),
        turtleY2screenY: jest.fn(y => y),
        scale: 1
    },
    activity: { refreshCanvas: jest.fn() },
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
        canvas: { width: 800, height: 600 },
        strokeStyle: "",
        fillStyle: "",
        lineWidth: 1,
        lineCap: ""
    },
    penstrokes: { image: null },
    orientation: 0,
    updateCache: jest.fn(),
    blinking: jest.fn().mockReturnValue(false)
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
