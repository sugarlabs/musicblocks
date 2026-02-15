// Provide global mocks for logo.js dependencies
global._ = jest.fn(str => str);
global.Notation = jest.fn();
global.Synth = jest.fn(() => ({
    newTone: jest.fn(),
    createDefaultSynth: jest.fn(),
    start: jest.fn()
}));
global.instruments = {};
global.instrumentsFilters = {};
global.instrumentsEffects = {};
global.Singer = {
    setSynthVolume: jest.fn(),
    setMasterVolume: jest.fn()
};
global.Tone = {
    UserMedia: jest.fn(() => ({
        open: jest.fn()
    }))
};
global.CAMERAVALUE = "camera";
global.doUseCamera = jest.fn();
global.VIDEOVALUE = "video";
global.last = jest.fn(arr => arr[arr.length - 1]);
global.getIntervalDirection = jest.fn();
global.getIntervalNumber = jest.fn();
global.mixedNumber = jest.fn();
global.rationalToFraction = jest.fn();
global.doStopVideoCam = jest.fn();
global.StatusMatrix = jest.fn();
global.getStatsFromNotation = jest.fn();
global.delayExecution = jest.fn();
global.DEFAULTVOICE = "default";

const Logo = require("../logo").Logo;
const LogoDependencies = require("../LogoDependencies");

// Mock dependencies for testing
function createMockBlocks() {
    return {
        blockList: [],
        unhighlightAll: jest.fn(),
        bringToTop: jest.fn(),
        showBlocks: jest.fn(),
        hideBlocks: jest.fn(),
        sameGeneration: jest.fn(() => false),
        visible: true
    };
}

function createMockTurtles() {
    return {
        turtleList: [],
        ithTurtle: jest.fn(() => ({
            listeners: {},
            singer: {
                inDuplicate: false,
                backward: [],
                synthVolume: {}
            },
            endOfClampSignals: {},
            parameterQueue: []
        })),
        getTurtle: jest.fn(() => ({
            painter: { color: 50 },
            companionTurtle: null,
            running: false
        })),
        getTurtleCount: jest.fn(() => 0),
        add: jest.fn(),
        markAllAsStopped: jest.fn()
    };
}

function createMockStage() {
    return {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
    };
}

describe("Logo with LogoDependencies", () => {
    let mockDeps;

    beforeEach(() => {
        mockDeps = {
            blocks: createMockBlocks(),
            turtles: createMockTurtles(),
            stage: createMockStage(),
            errorHandler: jest.fn(),
            messageHandler: {
                hide: jest.fn()
            },
            storage: {
                saveLocally: jest.fn()
            },
            config: {
                showBlocksAfterRun: false
            },
            callbacks: {
                onStopTurtle: jest.fn(),
                onRunTurtle: jest.fn()
            },
            meSpeak: null
        };
    });

    test("Logo accepts LogoDependencies object", () => {
        const logo = new Logo(mockDeps);
        expect(logo.deps).toBe(mockDeps);
        expect(logo.activity.blocks).toBe(mockDeps.blocks);
    });

    test("Logo maintains backward compatibility with Activity facade", () => {
        const mockActivity = {
            blocks: createMockBlocks(),
            turtles: createMockTurtles(),
            stage: createMockStage(),
            errorMsg: jest.fn(),
            hideMsgs: jest.fn(),
            saveLocally: jest.fn(),
            showBlocksAfterRun: false,
            onStopTurtle: jest.fn(),
            onRunTurtle: jest.fn(),
            meSpeak: null
        };

        const logo = new Logo(mockActivity);
        expect(logo.activity).toBe(mockActivity);
        expect(logo.deps.blocks).toBe(mockActivity.blocks);
    });

    test("Error handler is called correctly", () => {
        const deps = new LogoDependencies(mockDeps);
        const logo = new Logo(deps);
        logo.activity.errorMsg("Test error");
        expect(mockDeps.errorHandler).toHaveBeenCalledWith("Test error");
    });

    test("Config properties work with getters/setters", () => {
        const logo = new Logo(mockDeps);
        expect(logo.activity.showBlocksAfterRun).toBe(false);
        logo.activity.showBlocksAfterRun = true;
        expect(mockDeps.config.showBlocksAfterRun).toBe(true);
    });
});

describe("LogoDependencies.fromActivity", () => {
    test("Creates LogoDependencies from Activity object", () => {
        const mockActivity = {
            blocks: createMockBlocks(),
            turtles: createMockTurtles(),
            stage: createMockStage(),
            errorMsg: jest.fn(),
            hideMsgs: jest.fn(),
            saveLocally: jest.fn(),
            showBlocksAfterRun: false,
            onStopTurtle: jest.fn(),
            onRunTurtle: jest.fn(),
            meSpeak: null
        };

        const deps = LogoDependencies.fromActivity(mockActivity);
        expect(deps.blocks).toBe(mockActivity.blocks);
        expect(deps.turtles).toBe(mockActivity.turtles);
    });
});
