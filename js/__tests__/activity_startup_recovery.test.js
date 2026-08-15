const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { PubSub } = require("../pubsub");

const loadProjectManager = () => {
    const pmPath = path.resolve(__dirname, "../project-manager.js");
    let code = fs.readFileSync(pmPath, "utf8");
    code += "\nthis.ProjectManager = ProjectManager;";

    const pubsub = new PubSub();
    const sandbox = {
        window: global.window,
        document: global.document,
        console,
        _: key => key,
        define: () => {},
        require: () => {},
        module: { exports: {} },
        setTimeout,
        pubsub,
        DATAOBJS: [],
        _THIS_IS_MUSIC_BLOCKS_: true,
        ErrorHandler: {
            recoverable: jest.fn(),
            capture: jest.fn(),
            warn: jest.fn(),
            userFacing: jest.fn()
        },
        platformColor: { headingColor: "#000", blueButton: "#00f", blueButtonText: "#fff" },
        Midi: class {},
        ABCJS: { parseOnly: jest.fn(() => []) },
        ensureABCJS: jest.fn(),
        extractProjectDataFromHTML: jest.fn(),
        unescapeHTML: jest.fn(x => x),
        doSVG: jest.fn(() => ""),
        base64Encode: jest.fn(x => x),
        debugLog: jest.fn(),
        getTemperament: jest.fn(() => []),
        getOctaveRatio: jest.fn(() => 2),
        transcribeMidi: jest.fn()
    };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);

    return { ProjectManager: sandbox.ProjectManager, pubsub, ErrorHandler: sandbox.ErrorHandler };
};

describe("Activity startup recovery", () => {
    let ProjectManager;
    let pubsub;
    let recoverable;

    beforeAll(() => {
        ({
            ProjectManager,
            pubsub,
            ErrorHandler: { recoverable }
        } = loadProjectManager());
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

        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);

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
    let ProjectManager;
    let pubsub;

    beforeEach(() => {
        ({ ProjectManager, pubsub } = loadProjectManager());
    });

    it("calls pubsub.off(finishedLoading) immediately when invoked", () => {
        const activity = {
            _changeBlockVisibility: jest.fn(),
            _doFastButton: jest.fn()
        };
        const pm = new ProjectManager(activity);
        const offSpy = jest.spyOn(pubsub, "off");
        pm.runProject(null);
        expect(offSpy).toHaveBeenCalledWith("finishedLoading", expect.any(Function));
    });
});

describe("Activity._loadProject – pubsub listener lifecycle", () => {
    let ProjectManager;
    let pubsub;
    let fakeTimers;
    let sandboxSetTimeout;

    beforeEach(() => {
        fakeTimers = [];
        sandboxSetTimeout = (fn, delay) => {
            fakeTimers.push({ fn, delay });
        };

        const pmPath = path.resolve(__dirname, "../project-manager.js");
        let code = fs.readFileSync(pmPath, "utf8");
        code += "\nthis.ProjectManager = ProjectManager;";

        pubsub = new PubSub();
        const ErrorHandler = {
            recoverable: jest.fn(),
            capture: jest.fn(),
            warn: jest.fn()
        };
        const sandbox = {
            window: global.window,
            document: global.document,
            console,
            _: key => key,
            define: () => {},
            require: () => {},
            module: { exports: {} },
            setTimeout: sandboxSetTimeout,
            pubsub,
            DATAOBJS: [],
            _THIS_IS_MUSIC_BLOCKS_: true,
            ErrorHandler,
            platformColor: { headingColor: "#000", blueButton: "#00f", blueButtonText: "#fff" },
            Midi: class {},
            ABCJS: { parseOnly: jest.fn(() => []) },
            ensureABCJS: jest.fn(),
            extractProjectDataFromHTML: jest.fn(),
            unescapeHTML: jest.fn(x => x),
            doSVG: jest.fn(() => ""),
            base64Encode: jest.fn(x => x),
            debugLog: jest.fn(),
            getTemperament: jest.fn(() => []),
            getOctaveRatio: jest.fn(() => 2),
            transcribeMidi: jest.fn()
        };
        vm.createContext(sandbox);
        vm.runInContext(code, sandbox);
        ProjectManager = sandbox.ProjectManager;
    });

    const makeActivity = fakeTimers => ({
        planet: {
            getCurrentProjectName: jest.fn(() => "Test Project"),
            openProjectFromPlanet: jest.fn(),
            initialiseNewProject: jest.fn()
        },
        loading: false,
        firstRun: true,
        update: false,
        doLoadAnimation: jest.fn(),
        textMsg: jest.fn(),
        loadStartWrapper: jest.fn(),
        _toggleCollapsibleStacks: jest.fn(),
        _changeBlockVisibility: jest.fn(),
        turtles: { getTurtleCount: jest.fn(() => 0) },
        ErrorHandler: { recoverable: jest.fn(), warn: jest.fn() }
    });

    it("registers a finishedLoading listener before returning", () => {
        const activity = makeActivity(fakeTimers);
        const pm = new ProjectManager(activity);
        const onSpy = jest.spyOn(pubsub, "on");
        pm._loadProject("project-1");
        expect(onSpy).toHaveBeenCalledWith("finishedLoading", expect.any(Function));
    });

    it("unregisters the finishedLoading listener after the deferred callback fires", () => {
        const activity = makeActivity(fakeTimers);
        const pm = new ProjectManager(activity);
        pm._loadProject("project-1");
        const offSpy = jest.spyOn(pubsub, "off");

        pubsub.emit("finishedLoading");

        const inner = fakeTimers.find(t => t.delay === 1000);
        expect(inner).toBeDefined();
        inner.fn();

        expect(offSpy).toHaveBeenCalledWith("finishedLoading", expect.any(Function));
    });
});
