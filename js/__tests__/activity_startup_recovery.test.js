const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { PubSub } = require("../pubsub");

const activityPath = path.resolve(__dirname, "../activity.js");
const activityCode = fs.readFileSync(activityPath, "utf8");

const extractFn = (startMarker, endMarker) => {
    const start = activityCode.indexOf(startMarker);
    const end = activityCode.indexOf(endMarker, start);
    return activityCode.slice(start, end).trimEnd();
};

const runProjectCode = extractFn(
    "        this.runProject = env => {",
    "        const standardDurations = ["
);

const loadProjectCode = extractFn(
    "        this._loadProject = (projectID, flags) => {",
    "        setupActivityAbcParser(this);"
);

const loadLoadStart = () => {
    const activityPath = path.resolve(__dirname, "../activity.js");
    let code = fs.readFileSync(activityPath, "utf8");

    const startPoint = code.indexOf("const loadStart = async that => {");
    const endPoint = code.indexOf("        this.loadStartWrapper = async", startPoint);
    if (startPoint === -1 || endPoint === -1) {
        throw new Error("Could not locate loadStart in activity.js");
    }
    code = code.slice(startPoint, endPoint);
    code += "\nthis.loadStart = loadStart;";

    const recoverable = jest.fn();
    const pubsub = new PubSub();
    const sandbox = {
        ErrorHandler: {
            recoverable,
            capture: jest.fn(),
            warn: jest.fn(),
            userFacing: jest.fn()
        },
        window: global.window,
        document: global.document,
        console,
        _: key => key,
        define: () => {},
        require: () => {},
        setTimeout,
        createjs: {},
        Turtles: class {},
        Palettes: class {},
        Blocks: class {},
        Logo: class {},
        LanguageBox: class {},
        ThemeBox: class {},
        SaveInterface: class {},
        StatsWindow: class {},
        Trashcan: class {},
        PasteBox: class {},
        HelpWidget: class {},
        globalActivity: null,
        _THIS_IS_MUSIC_BLOCKS_: true,
        LEADING: 0,
        MYDEFINES: [],
        setupActivityAbcParser: () => {},
        pubsub
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    return { loadStart: sandbox.loadStart, recoverable, pubsub };
};

describe("Activity startup recovery", () => {
    let loadStart;
    let recoverable;
    let pubsub;

    beforeAll(() => {
        ({ loadStart, recoverable, pubsub } = loadLoadStart());
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("clears malformed session data and falls back to a clean start", async () => {
        const removeItem = jest.fn();
        const activity = {
            storage: {
                currentProject: "Corrupt Project",
                removeItem,
                ["SESSIONCorrupt Project"]: '{"broken":'
            },
            planet: null,
            sessionData: null,
            turtles: {
                running: jest.fn(() => true)
            },
            stage: {
                update: jest.fn(),
                dispatchEvent: jest.fn()
            },
            logo: {
                turtleHeaps: [],
                turtleDicts: [],
                notation: {
                    notationStaging: [],
                    notationDrumStaging: []
                }
            },
            blocks: {
                loadNewBlocks: jest.fn()
            },
            justLoadStart: jest.fn(),
            doLoadAnimation: jest.fn(),
            update: false
        };

        await loadStart(activity);

        expect(recoverable).toHaveBeenCalledTimes(1);
        const [errorArg, contextArg] = recoverable.mock.calls[0];
        expect(errorArg).toBeDefined();
        expect(errorArg.name).toBe("SyntaxError");
        expect(errorArg.message).toMatch(/Unexpected end of JSON input/);
        expect(contextArg).toEqual({ operation: "loadSessionData" });
        expect(recoverable).toHaveBeenCalledWith(errorArg, contextArg);
        expect(removeItem).toHaveBeenCalledWith("SESSIONCorrupt Project");
        expect(activity.justLoadStart).toHaveBeenCalledTimes(1);
        expect(activity.blocks.loadNewBlocks).not.toHaveBeenCalled();
        expect(activity.update).toBe(true);

        pubsub.emit("finishedLoading");
    });
});

describe("Activity.runProject – pubsub.off defensive unsubscribe", () => {
    let sandbox;
    let pubsub;

    beforeEach(() => {
        pubsub = new PubSub();

        sandbox = {
            pubsub,
            _changeBlockVisibility: jest.fn(),
            _doFastButton: jest.fn(),
            setTimeout: () => {}
        };
        vm.createContext(sandbox);
        vm.runInContext(runProjectCode, sandbox);
    });

    it("calls pubsub.off(finishedLoading) immediately when invoked", () => {
        const offSpy = jest.spyOn(pubsub, "off");
        sandbox.runProject(null);
        expect(offSpy).toHaveBeenCalledWith("finishedLoading", expect.any(Function));
    });
});

describe("Activity._loadProject – pubsub listener lifecycle", () => {
    let sandbox;
    let pubsub;
    let fakeTimers;

    beforeEach(() => {
        pubsub = new PubSub();
        fakeTimers = [];

        sandbox = {
            pubsub,
            planet: {
                getCurrentProjectName: jest.fn(() => "Test Project"),
                openProjectFromPlanet: jest.fn(),
                initialiseNewProject: jest.fn()
            },
            loadStart: jest.fn(),
            loading: false,
            firstRun: true,
            update: false,
            doLoadAnimation: jest.fn(),
            textMsg: jest.fn(),
            loadStartWrapper: jest.fn(),
            _toggleCollapsibleStacks: jest.fn(),
            _changeBlockVisibility: jest.fn(),
            turtles: { getTurtleCount: jest.fn(() => 0) },
            ErrorHandler: { recoverable: jest.fn(), warn: jest.fn() },
            _: x => x,
            document: { body: { style: { cursor: "" } } },
            setTimeout: (fn, delay) => {
                fakeTimers.push({ fn, delay });
            }
        };
        vm.createContext(sandbox);
        vm.runInContext(loadProjectCode, sandbox);
    });

    it("registers a finishedLoading listener before returning", () => {
        const onSpy = jest.spyOn(pubsub, "on");
        sandbox._loadProject("project-1");
        expect(onSpy).toHaveBeenCalledWith("finishedLoading", expect.any(Function));
    });

    it("unregisters the finishedLoading listener after the deferred callback fires", () => {
        sandbox._loadProject("project-1");
        const offSpy = jest.spyOn(pubsub, "off");

        pubsub.emit("finishedLoading");

        const inner = fakeTimers.find(t => t.delay === 1000);
        expect(inner).toBeDefined();
        inner.fn();

        expect(offSpy).toHaveBeenCalledWith("finishedLoading", expect.any(Function));
    });
});
