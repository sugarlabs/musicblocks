global.importMembers = jest.fn((instance, name, args) => {
    instance.activity = args[0] || mockActivity;
});

const Turtles = require("../turtles");
const mockActivity = {
    stage: { addChild: jest.fn(), removeChild: jest.fn(), dispatchEvent: jest.fn() },
    turtleContainer: { addChild: jest.fn() },
    canvas: {},
    refreshCanvas: jest.fn(),
    hideAuxMenu: jest.fn(),
    hideGrids: jest.fn(),
    _doCartesianPolar: jest.fn()
};

global.createjs = {
    Container: jest.fn(() => ({ addChild: jest.fn(), removeAllEventListeners: jest.fn(), on: jest.fn() })),
    Bitmap: jest.fn()
};

global.importMembers = jest.fn();
global.setupRhythmActions = jest.fn(() => {});
global.setupMeterActions = jest.fn(() => {});
global.setupPitchActions = jest.fn(() => {});
global.setupIntervalsActions = jest.fn(() => {});
global.setupToneActions = jest.fn(() => {});
global.setupOrnamentActions = jest.fn(() => {});
global.setupVolumeActions = jest.fn(() => {});
global.setupDrumActions = jest.fn(() => {});
global.setupDictActions = jest.fn(() => {});
global._ = jest.fn(str => str);
global.Turtle = jest.fn(() => ({ container: {}, painter: {} }));
global.last = jest.fn(arr => arr[arr.length - 1]);

describe("Turtles class", () => {
    let turtles;

    beforeEach(() => {
        jest.clearAllMocks();

        // Spy on prototype methods
        jest.spyOn(Turtles.prototype, "initActions");

        // Ensure `this.activity` is set
        turtles = new Turtles(mockActivity);
        turtles.activity = mockActivity; // Force assignment
    });

    test("constructor should initialize correctly", () => {
        expect(importMembers).toHaveBeenCalledWith(turtles, "", [mockActivity]);
        expect(turtles.initActions).toHaveBeenCalled(); // Now tracked by Jest spy
    });

    test("initActions should set up all turtle actions", () => {
        expect(turtles.activity).toBeDefined(); // Ensure activity is set
        turtles.initActions();
        expect(setupRhythmActions).toHaveBeenCalledWith(mockActivity);
        expect(setupMeterActions).toHaveBeenCalledWith(mockActivity);
        expect(setupPitchActions).toHaveBeenCalledWith(mockActivity);
        expect(setupIntervalsActions).toHaveBeenCalledWith(mockActivity);
        expect(setupToneActions).toHaveBeenCalledWith(mockActivity);
        expect(setupOrnamentActions).toHaveBeenCalledWith(mockActivity);
        expect(setupVolumeActions).toHaveBeenCalledWith(mockActivity);
        expect(setupDrumActions).toHaveBeenCalledWith(mockActivity);
        expect(setupDictActions).toHaveBeenCalledWith(mockActivity);
    });

    test("addTurtle should add a turtle and scale if shrunk", () => {
        turtles.isShrunk = jest.fn(() => true);
        turtles.add = jest.fn();
        const mockTurtle = { container: {} };
        last.mockReturnValue(mockTurtle);

        turtles.addTurtle({}, {});

        expect(turtles.add).toHaveBeenCalled();
        expect(mockTurtle.container.scaleX).toBe(4);
        expect(mockTurtle.container.scaleY).toBe(4);
    });

    test("markAllAsStopped should set all turtles' running to false", () => {
        turtles._turtleList = [{ running: true }, { running: true }];
        turtles.markAllAsStopped();

        expect(turtles._turtleList[0].running).toBe(false);
        expect(turtles._turtleList[1].running).toBe(false);
        expect(mockActivity.refreshCanvas).toHaveBeenCalled(); // Should now pass
    });

    test("getter and setter methods should function correctly", () => {
        turtles.masterStage = "stage1";
        expect(turtles.masterStage).toBe("stage1");
        turtles.canvas = "canvas1";
        expect(turtles.canvas).toBe("canvas1");
    });
});
