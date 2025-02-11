const Painter = require("../turtle-painter"); 
global.WRAP = true;  
const mockTurtle = {
    turtles: { 
        screenX2turtleX: jest.fn(), 
        screenY2turtleY: jest.fn(), 
        turtleX2screenX: jest.fn(), 
        turtleY2screenY: jest.fn(), 
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
        canvas: { width: 800, height: 600 }
    },
    penstrokes: { image: null },
    orientation: 0,
    updateCache: jest.fn(),
    blinking: jest.fn().mockReturnValue(false)
};

describe("Painter Class", () => {
    let painter;

    beforeEach(() => {
        painter = new Painter(mockTurtle);
    });

    describe("Constructor", () => {
        test("should initialize with default values", () => {
            expect(painter._color).toBe(0);
            expect(painter._stroke).toBe(5);
            expect(painter._penDown).toBe(true);
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
