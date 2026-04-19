// Minimal repro: doForward(Infinity) never terminates under wrap mode
// because the wrap loop's only exit condition is `steps -= 5` and
// `Infinity - 5 === Infinity`.

const Painter = require("../turtle-painter");

global.WRAP = true;
global.NANERRORMSG = "Not a number.";
global.getcolor = jest.fn(() => [50, 100, "rgba(255,0,49,1)"]);
global.getMunsellColor = jest.fn(() => "rgba(128,64,32,1)");
global.hex2rgb = jest.fn(() => "rgba(255,0,49,1)");

const createMockTurtle = () => ({
    turtles: {
        screenX2turtleX: x => x,
        screenY2turtleY: y => y,
        turtleX2screenX: x => x,
        turtleY2screenY: y => y,
        scale: 1,
        activity: { errorMsg: jest.fn() }
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

describe("BUG: TurtlePainter.doForward with Infinity hangs the main thread", () => {
    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation(cb => cb());
    });
    afterEach(() => {
        window.requestAnimationFrame.mockRestore();
    });

    test("doForward(10) completes quickly in wrap mode (sanity check)", () => {
        const painter = new Painter(createMockTurtle());
        let iterations = 0;
        const spy = jest.spyOn(painter, "_move").mockImplementation(() => {
            iterations++;
            if (iterations > 1000) throw new Error("UNEXPECTED_RUNAWAY");
        });
        painter.doForward(10);
        // Only one _move call is expected because the new point
        // stays in bounds (0 + 10 < 600), so we skip the wrap branch.
        expect(iterations).toBeLessThan(10);
        spy.mockRestore();
    });

    test("doForward(Infinity) shows error and returns early — no movement, no infinite loop", () => {
        const mockTurtle = createMockTurtle();
        const painter = new Painter(mockTurtle);
        let iterations = 0;
        const spy = jest.spyOn(painter, "_move").mockImplementation(() => {
            iterations++;
        });

        painter.doForward(Infinity);
        expect(iterations).toBe(0);
        expect(mockTurtle.turtles.activity.errorMsg).toHaveBeenCalledWith(global.NANERRORMSG);
        spy.mockRestore();
    });
});
