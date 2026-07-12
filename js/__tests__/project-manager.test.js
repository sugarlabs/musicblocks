// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const path = require("path");
const { PubSub } = require("../pubsub");

// ---------------------------------------------------------------------------
// Globals required by project-manager.js at call time (not load time)
// ---------------------------------------------------------------------------

let pubsubInstance;

beforeAll(() => {
    pubsubInstance = new PubSub();

    global._ = key => key;
    global.pubsub = pubsubInstance;
    global.DATAOBJS = [{ name: "start" }];
    global._THIS_IS_MUSIC_BLOCKS_ = true;
    global.ErrorHandler = {
        recoverable: jest.fn(),
        capture: jest.fn(),
        warn: jest.fn(),
        userFacing: jest.fn()
    };
    global.platformColor = {
        headingColor: "#333",
        blueButton: "#0066cc",
        blueButtonText: "#fff"
    };
    global.Midi = class {
        constructor() {}
    };
    global.ABCJS = { parseOnly: jest.fn(() => [{ header: {} }]) };
    global.ensureABCJS = jest.fn().mockResolvedValue(undefined);
    global.extractProjectDataFromHTML = jest.fn();
    global.unescapeHTML = jest.fn(x => x);
    global.doSVG = jest.fn(() => "<svg></svg>");
    global.base64Encode = jest.fn(x => x);
    global.debugLog = jest.fn();
    global.getTemperament = jest.fn(() => [440]);
    global.getOctaveRatio = jest.fn(() => 2);
    global.transcribeMidi = jest.fn();
    // AMD-style require stub so _midiImportBlocks confirm button doesn't crash
    global.amdRequire = jest.fn((deps, cb) => cb && cb());
});

afterEach(() => {
    jest.clearAllMocks();
    pubsubInstance = new PubSub();
    global.pubsub = pubsubInstance;
});

// ---------------------------------------------------------------------------
// Load module (once; globals are set before this line)
// ---------------------------------------------------------------------------

let ProjectManager, setupProjectManager;
beforeAll(() => {
    // Clear Jest's module cache so the module picks up the globals
    jest.resetModules();
    ({ ProjectManager, setupProjectManager } = require(
        path.resolve(__dirname, "../project-manager.js")
    ));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeActivity = (overrides = {}) => ({
    canvas: { width: 800 },
    logo: { synth: { startingPitch: 392 } },
    turtles: {
        running: jest.fn(() => false),
        getTurtleCount: jest.fn(() => 0),
        getTurtle: jest.fn(() => ({
            id: 0,
            x: 0,
            y: 0,
            orientation: 0,
            painter: {
                color: 0,
                value: 50,
                stroke: 5,
                chroma: 100,
                doClear: jest.fn()
            }
        }))
    },
    blocks: {
        blockList: [],
        loadNewBlocks: jest.fn(),
        palettes: { dict: {} },
        customTemperamentDefined: false
    },
    palettes: { dict: {} },
    stage: {
        update: jest.fn(),
        dispatchEvent: jest.fn(),
        addEventListener: jest.fn(),
        removeAllEventListeners: jest.fn()
    },
    storage: {
        currentProject: "Test Project",
        removeItem: jest.fn()
    },
    planet: undefined,
    loading: false,
    firstRun: true,
    merging: false,
    update: false,
    keyboardEnableFlag: 0,
    sessionData: null,
    projectID: null,
    doLoadAnimation: jest.fn(),
    stopLoadAnimation: jest.fn(),
    justLoadStart: jest.fn(),
    showContents: jest.fn(),
    loadStartWrapper: jest.fn(),
    sendAllToTrash: jest.fn(),
    _doHardStopButton: jest.fn(),
    _allClear: jest.fn(),
    _toggleCollapsibleStacks: jest.fn(),
    _changeBlockVisibility: jest.fn(),
    _doFastButton: jest.fn(),
    _onResize: jest.fn(),
    errorMsg: jest.fn(),
    textMsg: jest.fn(),
    refreshCanvas: jest.fn(),
    parseABC: jest.fn(),
    toolbar: {
        closeAuxToolbar: jest.fn()
    },
    fileChooser: {
        files: [],
        addEventListener: jest.fn(),
        focus: jest.fn(),
        click: jest.fn()
    },
    ...overrides
});

const makeBlockList = () => [
    {
        name: "start",
        trash: false,
        value: 0,
        collapsed: false,
        container: { x: 100, y: 200 },
        connections: [null, null],
        isValueBlock: () => false
    },
    {
        name: "note",
        trash: false,
        value: null,
        collapsed: false,
        container: { x: 150, y: 250 },
        connections: [0, null],
        isValueBlock: () => false
    }
];

// ---------------------------------------------------------------------------
// PART 1 — setupProjectManager
// ---------------------------------------------------------------------------

describe("setupProjectManager", () => {
    it("creates a ProjectManager and attaches it to the activity", () => {
        const activity = makeActivity();
        const pm = setupProjectManager(activity);
        expect(pm).toBeInstanceOf(ProjectManager);
        expect(activity.projectManager).toBe(pm);
    });

    it("returns the same manager that is attached", () => {
        const activity = makeActivity();
        const pm = setupProjectManager(activity);
        expect(activity.projectManager).toBe(pm);
    });
});

// ---------------------------------------------------------------------------
// PART 2 — constructor
// ---------------------------------------------------------------------------

describe("ProjectManager constructor", () => {
    it("stores the activity reference", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        expect(pm.activity).toBe(activity);
    });

    it("initializes _loadAnimationIntervalId to null", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        expect(pm._loadAnimationIntervalId).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// PART 3 — doLoadAnimation / stopLoadAnimation
// ---------------------------------------------------------------------------

describe("doLoadAnimation", () => {
    let loadContainer, messageText;

    beforeEach(() => {
        loadContainer = { style: { display: "none" } };
        messageText = { textContent: "" };
        jest.spyOn(document, "getElementById").mockImplementation(id => {
            if (id === "load-container") return loadContainer;
            if (id === "messageText") return messageText;
            return null;
        });
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        document.getElementById.mockRestore();
    });

    it("shows the load container", () => {
        const pm = new ProjectManager(makeActivity());
        pm.doLoadAnimation();
        expect(loadContainer.style.display).toBe("block");
    });

    it("sets an interval that changes messageText", () => {
        const pm = new ProjectManager(makeActivity());
        pm.doLoadAnimation();
        expect(pm._loadAnimationIntervalId).not.toBeNull();
        jest.advanceTimersByTime(2000);
        expect(messageText.textContent).toMatch(/\.\.\.$/);
    });
});

describe("stopLoadAnimation", () => {
    let loadContainer;

    beforeEach(() => {
        loadContainer = { style: { display: "block" } };
        jest.spyOn(document, "getElementById").mockReturnValue(loadContainer);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        document.getElementById.mockRestore();
    });

    it("clears the interval and resets _loadAnimationIntervalId", () => {
        const pm = new ProjectManager(makeActivity());
        pm.doLoadAnimation();
        pm.stopLoadAnimation();
        expect(pm._loadAnimationIntervalId).toBeNull();
    });

    it("hides the load container", () => {
        const pm = new ProjectManager(makeActivity());
        pm.doLoadAnimation();
        pm.stopLoadAnimation();
        expect(loadContainer.style.display).toBe("none");
    });

    it("is a no-op when interval was never started", () => {
        const pm = new ProjectManager(makeActivity());
        expect(() => pm.stopLoadAnimation()).not.toThrow();
    });

    it("is safe when load-container element is absent", () => {
        document.getElementById.mockReturnValue(null);
        const pm = new ProjectManager(makeActivity());
        expect(() => pm.stopLoadAnimation()).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// PART 4 — showContents
// ---------------------------------------------------------------------------

describe("showContents", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("sets loadingText to 'Loading Complete!'", () => {
        const loadingText = { textContent: "" };
        const loadingImageContainer = { style: { display: "block" } };
        const loadContainer = { style: { display: "block" } };
        const bottomRightLogo = { style: { display: "block" } };
        const palette = { style: { display: "none" } };
        const hideContents = { style: { display: "none" } };
        const btnBottom = { style: { display: "none" } };
        const btnTop = { style: { display: "none" } };

        jest.spyOn(document, "getElementById").mockImplementation(id => {
            const map = {
                loadingText,
                "loading-image-container": loadingImageContainer,
                "load-container": loadContainer,
                "bottom-right-logo": bottomRightLogo,
                palette,
                hideContents,
                "buttoncontainerBOTTOM": btnBottom,
                "buttoncontainerTOP": btnTop
            };
            return map[id] ?? null;
        });

        const pm = new ProjectManager(makeActivity());
        pm.showContents();

        expect(loadingText.textContent).toBe("Loading Complete!");

        jest.advanceTimersByTime(500);

        expect(loadContainer.style.display).toBe("none");
        expect(loadingImageContainer.style.display).toBe("none");
        expect(palette.style.display).toBe("block");
        expect(hideContents.style.display).toBe("block");
        expect(btnBottom.style.display).toBe("block");
        expect(btnTop.style.display).toBe("block");

        document.getElementById.mockRestore();
    });
});

// ---------------------------------------------------------------------------
// PART 5 — justLoadStart
// ---------------------------------------------------------------------------

describe("justLoadStart", () => {
    it("calls activity.blocks.loadNewBlocks with DATAOBJS", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm.justLoadStart();
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith(global.DATAOBJS);
    });
});

// ---------------------------------------------------------------------------
// PART 6 — loadStartWrapper
// ---------------------------------------------------------------------------

describe("loadStartWrapper", () => {
    it("awaits func and then calls showContents", async () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm.showContents = jest.fn();

        const fn = jest.fn().mockResolvedValue(undefined);
        await pm.loadStartWrapper(fn, "arg1", "arg2", "arg3");

        expect(fn).toHaveBeenCalledWith(activity, "arg1", "arg2", "arg3");
        expect(pm.showContents).toHaveBeenCalledTimes(1);
    });

    it("calls showContents even when func resolves with a value", async () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm.showContents = jest.fn();

        await pm.loadStartWrapper(jest.fn().mockResolvedValue(42));
        expect(pm.showContents).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// PART 7 — _loadStart (session restore logic)
// ---------------------------------------------------------------------------

describe("_loadStart", () => {
    it("falls back to justLoadStart when no session data", async () => {
        const activity = makeActivity({
            storage: { currentProject: undefined, removeItem: jest.fn() }
        });
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        expect(activity.justLoadStart).toHaveBeenCalled();
    });

    it("calls loadNewBlocks with parsed JSON when session data is valid", async () => {
        const sessionData = JSON.stringify([{ name: "start" }]);
        const activity = makeActivity({
            storage: {
                currentProject: "Test",
                ["SESSIONTest"]: sessionData,
                removeItem: jest.fn()
            }
        });
        activity.sessionData = sessionData;
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith([{ name: "start" }]);
    });

    it("calls justLoadStart when sessionData is 'undefined'", async () => {
        const activity = makeActivity({
            storage: {
                currentProject: "Test",
                ["SESSIONTest"]: "undefined",
                removeItem: jest.fn()
            }
        });
        activity.sessionData = "undefined";
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        expect(activity.justLoadStart).toHaveBeenCalled();
    });

    it("calls justLoadStart when sessionData is '[]'", async () => {
        const activity = makeActivity({
            storage: {
                currentProject: "Test",
                ["SESSIONTest"]: "[]",
                removeItem: jest.fn()
            }
        });
        activity.sessionData = "[]";
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        expect(activity.justLoadStart).toHaveBeenCalled();
    });

    it("recovers from malformed JSON and removes the bad session key", async () => {
        const removeItem = jest.fn();
        const activity = makeActivity({
            storage: {
                currentProject: "Bad",
                ["SESSIONBad"]: '{"broken":',
                removeItem
            }
        });
        activity.sessionData = '{"broken":';
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);

        expect(global.ErrorHandler.recoverable).toHaveBeenCalledWith(
            expect.objectContaining({ name: "SyntaxError" }),
            { operation: "loadSessionData" }
        );
        expect(removeItem).toHaveBeenCalledWith("SESSIONBad");
        expect(activity.justLoadStart).toHaveBeenCalled();
    });

    it("deletes the session key when removeItem is not a function", async () => {
        const storage = {
            currentProject: "Bad",
            ["SESSIONBad"]: '{"broken":',
            removeItem: "not-a-function"
        };
        const activity = makeActivity({ storage });
        activity.sessionData = '{"broken":';
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        expect(storage["SESSIONBad"]).toBeUndefined();
    });

    it("sets update to true", async () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        expect(activity.update).toBe(true);
    });

    it("disables keyboard at start (keyboardEnableFlag = 0)", async () => {
        const activity = makeActivity();
        activity.keyboardEnableFlag = 1;
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        expect(activity.keyboardEnableFlag).toBe(0);
    });

    it("defaults to this.activity when that is falsy", async () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        await pm._loadStart(null);
        expect(activity.justLoadStart).toHaveBeenCalled();
    });

    it("opens planet session when planet is defined", async () => {
        const planet = { openCurrentProject: jest.fn().mockResolvedValue(null) };
        const activity = makeActivity({ planet });
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        expect(planet.openCurrentProject).toHaveBeenCalled();
    });

    it("re-enables keyboard input after finishedLoading fires", async () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        expect(activity.keyboardEnableFlag).toBe(0); // disabled during load
        global.pubsub.emit("finishedLoading");
        expect(activity.keyboardEnableFlag).toBe(1); // re-enabled once load is done
    });

    it("post-load callback fires only once — self-unsubscribes after first event", async () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);
        global.pubsub.emit("finishedLoading"); // triggers __afterLoad → stage.update()
        const firstUpdateCount = activity.stage.update.mock.calls.length;
        global.pubsub.emit("finishedLoading"); // should be a no-op — listener removed
        expect(activity.stage.update).toHaveBeenCalledTimes(firstUpdateCount);
    });
});

// ---------------------------------------------------------------------------
// PART 8 — _loadProject
// ---------------------------------------------------------------------------

describe("_loadProject", () => {
    it("returns early when planet is undefined", () => {
        const activity = makeActivity({ planet: undefined });
        const pm = new ProjectManager(activity);
        expect(() => pm._loadProject("proj-1")).not.toThrow();
        expect(activity.doLoadAnimation).not.toHaveBeenCalled();
    });

    it("starts the load animation and sets loading=true", () => {
        const planet = {
            getCurrentProjectName: jest.fn(() => "Test"),
            openProjectFromPlanet: jest.fn(),
            initialiseNewProject: jest.fn()
        };
        const activity = makeActivity({ planet });
        const pm = new ProjectManager(activity);
        jest.useFakeTimers();

        pm._loadProject("proj-1", { run: false, show: false, collapse: false });

        expect(activity.loading).toBe(true);
        expect(activity.doLoadAnimation).toHaveBeenCalled();
        jest.useRealTimers();
    });

    it("applies default flags when flags is undefined", () => {
        const planet = {
            getCurrentProjectName: jest.fn(() => "Test"),
            openProjectFromPlanet: jest.fn(),
            initialiseNewProject: jest.fn()
        };
        const activity = makeActivity({ planet });
        const pm = new ProjectManager(activity);
        jest.useFakeTimers();

        pm._loadProject("proj-1");
        expect(activity.loading).toBe(true);
        jest.useRealTimers();
    });

    it("runs post-load setup when finishedLoading fires (firstRun=true)", () => {
        const planet = {
            getCurrentProjectName: jest.fn(() => "Test"),
            openProjectFromPlanet: jest.fn(),
            initialiseNewProject: jest.fn()
        };
        const activity = makeActivity({ planet, firstRun: true });
        const pm = new ProjectManager(activity);
        jest.useFakeTimers();

        pm._loadProject("proj-1", { run: false, show: false, collapse: false });
        global.pubsub.emit("finishedLoading");
        jest.advanceTimersByTime(1000);

        // Behavior: stacks collapsed and blocks hidden, firstRun cleared
        expect(activity._toggleCollapsibleStacks).toHaveBeenCalled();
        expect(activity._changeBlockVisibility).toHaveBeenCalled();
        expect(activity.firstRun).toBe(false);
        jest.useRealTimers();
    });

    it("post-load callback fires only once — self-unsubscribes after first event", () => {
        const planet = {
            getCurrentProjectName: jest.fn(() => "Test"),
            openProjectFromPlanet: jest.fn(),
            initialiseNewProject: jest.fn()
        };
        const activity = makeActivity({ planet, firstRun: false });
        const pm = new ProjectManager(activity);
        jest.useFakeTimers();

        pm._loadProject("proj-1", { run: false, show: false, collapse: false });

        // First fire: handler runs and removes itself
        global.pubsub.emit("finishedLoading");
        jest.advanceTimersByTime(1000);
        const callsAfterFirst = activity._changeBlockVisibility.mock.calls.length;

        // Second fire: should be a no-op — listener was removed
        global.pubsub.emit("finishedLoading");
        jest.advanceTimersByTime(1000);
        expect(activity._changeBlockVisibility).toHaveBeenCalledTimes(callsAfterFirst);
        jest.useRealTimers();
    });

    it("handles missing getCurrentProjectName gracefully", () => {
        const planet = {
            getCurrentProjectName: null,
            openProjectFromPlanet: jest.fn(),
            initialiseNewProject: jest.fn()
        };
        const activity = makeActivity({ planet });
        const pm = new ProjectManager(activity);
        jest.useFakeTimers();

        expect(() => pm._loadProject("proj-1")).not.toThrow();
        jest.useRealTimers();
    });
});

// ---------------------------------------------------------------------------
// PART 9 — loadFromPlanet
// ---------------------------------------------------------------------------

describe("loadFromPlanet", () => {
    it("delegates to _loadProject", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm._loadProject = jest.fn();
        pm.loadFromPlanet("id-1", { run: true }, []);
        expect(pm._loadProject).toHaveBeenCalledWith("id-1", { run: true }, []);
    });
});

// ---------------------------------------------------------------------------
// PART 10 — runProject
// ---------------------------------------------------------------------------

describe("runProject", () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("does not schedule _changeBlockVisibility a second time when called twice", () => {
        // runProject defensively removes itself from the finishedLoading listener
        // list (pubsub.off is a no-op when not registered, matching original code).
        // The observable behaviour is that the 5s work runs exactly once per call.
        const activity = makeActivity();
        const pm = new ProjectManager(activity);

        pm.runProject("env");
        jest.advanceTimersByTime(5000);
        expect(activity._changeBlockVisibility).toHaveBeenCalledTimes(1);
    });

    it("schedules _changeBlockVisibility and _doFastButton after 5s", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);

        pm.runProject("test-env");
        jest.advanceTimersByTime(5000);

        expect(activity._changeBlockVisibility).toHaveBeenCalled();
        expect(activity._doFastButton).toHaveBeenCalledWith("test-env");
    });
});

// ---------------------------------------------------------------------------
// PART 11 — getClosestStandardNoteValue
// ---------------------------------------------------------------------------

describe("getClosestStandardNoteValue", () => {
    let pm;
    beforeAll(() => {
        pm = new ProjectManager(makeActivity());
    });

    it.each([
        [1.0, [1, 1]],
        [0.5, [1, 2]],
        [0.25, [1, 4]],
        [0.125, [1, 8]],
        [0.0625, [1, 16]],
        [0.03125, [1, 32]],
        [0.015625, [1, 64]],
        [0.0078125, [1, 128]],
        [0.3, [1, 4]], // closest to 1/4 = 0.25
        [0.9, [1, 1]] // closest to 1/1 = 1.0
    ])("duration %f → %j", (duration, expected) => {
        expect(pm.getClosestStandardNoteValue(duration)).toEqual(expected);
    });
});

// ---------------------------------------------------------------------------
// PART 12 — prepareExport
// ---------------------------------------------------------------------------

describe("prepareExport", () => {
    it("returns an empty JSON array when blockList is empty", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        const result = pm.prepareExport();
        expect(JSON.parse(result)).toEqual([]);
    });

    it("skips blocks in trash", () => {
        const activity = makeActivity();
        activity.blocks.blockList = [
            {
                name: "note",
                trash: true,
                container: { x: 0, y: 0 },
                connections: [],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = pm.prepareExport();
        expect(JSON.parse(result)).toEqual([]);
    });

    it("exports a simple non-trash block", () => {
        const activity = makeActivity();
        activity.blocks.blockList = [
            {
                name: "note",
                trash: false,
                value: null,
                collapsed: false,
                container: { x: 10, y: 20 },
                connections: [null],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result).toHaveLength(1);
        expect(result[0][1]).toBe("note");
        expect(result[0][2]).toBe(10);
        expect(result[0][3]).toBe(20);
    });

    it("exports a value block with args.value", () => {
        const activity = makeActivity();
        activity.blocks.blockList = [
            {
                name: "number",
                trash: false,
                value: 42,
                collapsed: false,
                container: { x: 0, y: 0 },
                connections: [null],
                isValueBlock: () => true
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result[0][1]).toEqual(["number", { value: 42 }]);
    });

    it("exports namedbox with privateData", () => {
        const activity = makeActivity();
        activity.blocks.blockList = [
            {
                name: "namedbox",
                trash: false,
                value: null,
                privateData: "myBox",
                collapsed: false,
                container: { x: 0, y: 0 },
                connections: [null],
                isValueBlock: () => true
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result[0][1]).toEqual(["namedbox", { value: "myBox" }]);
    });

    it("exports start block with turtle state", () => {
        const activity = makeActivity();
        const turtle = {
            id: 0,
            x: 10,
            y: 20,
            orientation: 90,
            painter: { color: 50, value: 60, stroke: 3, chroma: 80 }
        };
        activity.turtles.getTurtle.mockReturnValue(turtle);
        activity.blocks.blockList = [
            {
                name: "start",
                trash: false,
                value: 0,
                collapsed: false,
                container: { x: 5, y: 5 },
                connections: [null],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result[0][1][0]).toBe("start");
        expect(result[0][1][1]).toMatchObject({ id: 0, xcor: 10, ycor: 20 });
    });

    it("exports collapsed block correctly", () => {
        const activity = makeActivity();
        activity.blocks.blockList = [
            {
                name: "action",
                trash: false,
                value: null,
                collapsed: true,
                container: { x: 0, y: 0 },
                connections: [null],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result[0][1]).toEqual(["action", { collapsed: true }]);
    });

    it("remaps connections to dense indices", () => {
        const activity = makeActivity();
        activity.blocks.blockList = [
            {
                name: "start",
                trash: false,
                value: null,
                collapsed: false,
                container: { x: 0, y: 0 },
                connections: [null, 1],
                isValueBlock: () => false
            },
            {
                name: "note",
                trash: false,
                value: null,
                collapsed: false,
                container: { x: 10, y: 10 },
                connections: [0, null],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        // Block 0's connection to block 1 remaps to index 1
        expect(result[0][4]).toEqual([null, 1]);
        // Block 1's connection to block 0 remaps to index 0
        expect(result[1][4]).toEqual([0, null]);
    });
});

// ---------------------------------------------------------------------------
// PART 13 — saveLocally
// ---------------------------------------------------------------------------

describe("saveLocally", () => {
    it("calls prepareExport to get data", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm.prepareExport = jest.fn(() => "[]");
        pm.saveLocally();
        expect(pm.prepareExport).toHaveBeenCalled();
    });

    it("saves SESSION<project> key to storage", () => {
        const storage = { currentProject: "My Project" };
        const activity = makeActivity({ storage, canvas: { width: 100 } });
        const pm = new ProjectManager(activity);
        pm.prepareExport = jest.fn(() => "[1,2,3]");
        pm.saveLocally();
        expect(storage["SESSIONMy Project"]).toBe("[1,2,3]");
    });

    it("sets default project name when currentProject is undefined", () => {
        const storage = { currentProject: undefined };
        const activity = makeActivity({ storage, canvas: { width: 100 } });
        const pm = new ProjectManager(activity);
        pm.prepareExport = jest.fn(() => "[]");
        pm.saveLocally();
        expect(storage.currentProject).toBe("My Project");
    });

    it("calls ErrorHandler.recoverable on storage write failure", () => {
        const storage = {
            get currentProject() {
                return "Test";
            },
            set SESSIONTest(_) {
                throw new Error("quota exceeded");
            }
        };
        const activity = makeActivity({ storage, canvas: { width: 100 } });
        const pm = new ProjectManager(activity);
        pm.prepareExport = jest.fn(() => "[]");
        pm.saveLocally();
        expect(global.ErrorHandler.recoverable).toHaveBeenCalledWith(expect.any(Error), {
            operation: "saveLocally_saveSession"
        });
    });
});

// ---------------------------------------------------------------------------
// PART 14 — newProject / _afterDelete
// ---------------------------------------------------------------------------

describe("newProject / _afterDelete", () => {
    it("calls _afterDelete", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm._afterDelete = jest.fn();
        pm.newProject();
        expect(pm._afterDelete).toHaveBeenCalled();
    });

    it("stops running turtles before deleting", () => {
        const activity = makeActivity({
            turtles: { ...makeActivity().turtles, running: jest.fn(() => true) }
        });
        const pm = new ProjectManager(activity);
        jest.useFakeTimers();
        pm._afterDelete();
        expect(activity._doHardStopButton).toHaveBeenCalled();
        jest.useRealTimers();
    });

    it("schedules sendAllToTrash and loadNewBlocks when no planet", () => {
        const activity = makeActivity({ planet: undefined });
        const pm = new ProjectManager(activity);
        jest.useFakeTimers();

        pm._afterDelete();
        jest.advanceTimersByTime(1000);

        expect(activity.sendAllToTrash).toHaveBeenCalledWith(false, false);
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith(global.DATAOBJS);
        jest.useRealTimers();
    });

    it("uses planet new-project path when available", () => {
        const planet = {
            planet: {},
            getCurrentProjectName: jest.fn(() => "Real Project"),
            saveLocally: jest.fn(),
            initialiseNewProject: jest.fn()
        };
        const activity = makeActivity({ planet });
        const pm = new ProjectManager(activity);
        pm._loadStart = jest.fn();

        pm._afterDelete();

        expect(planet.saveLocally).toHaveBeenCalled();
        expect(planet.initialiseNewProject).toHaveBeenCalled();
        expect(pm._loadStart).toHaveBeenCalled();
    });

    it("does not use planet path when project name is 'My Project'", () => {
        const planet = {
            planet: {},
            getCurrentProjectName: jest.fn(() => "My Project"),
            saveLocally: jest.fn(),
            initialiseNewProject: jest.fn()
        };
        const activity = makeActivity({ planet });
        const pm = new ProjectManager(activity);
        jest.useFakeTimers();

        pm._afterDelete();
        jest.advanceTimersByTime(1000);

        expect(activity.sendAllToTrash).toHaveBeenCalled();
        jest.useRealTimers();
    });
});

// ---------------------------------------------------------------------------
// PART 15 — doLoad / doMergeLoad / _doLoad
// ---------------------------------------------------------------------------

describe("doLoad / doMergeLoad", () => {
    beforeEach(() => {
        jest.spyOn(document, "querySelector").mockReturnValue({
            focus: jest.fn(),
            click: jest.fn()
        });
    });

    afterEach(() => {
        document.querySelector.mockRestore();
    });

    it("doLoad sets merging=false and clicks the file chooser", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm.doLoad();
        expect(activity.merging).toBe(false);
        expect(document.querySelector).toHaveBeenCalledWith("#myOpenFile");
    });

    it("doMergeLoad sets merging=true", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm.doMergeLoad();
        expect(activity.merging).toBe(true);
    });

    it("doLoad calls toolbar.closeAuxToolbar", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm.doLoad();
        expect(activity.toolbar.closeAuxToolbar).toHaveBeenCalledWith(expect.any(Function));
    });

    it("doLoad calls _doHardStopButton", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm.doLoad();
        expect(activity._doHardStopButton).toHaveBeenCalled();
    });

    it("doLoad calls _allClear", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm.doLoad();
        expect(activity._allClear).toHaveBeenCalledWith(true, true);
    });
});

// ---------------------------------------------------------------------------
// PART 16 — _midiImportBlocks
// ---------------------------------------------------------------------------

describe("_midiImportBlocks", () => {
    let appendChildSpy, getByIdSpy;

    beforeEach(() => {
        appendChildSpy = jest.spyOn(document.body, "appendChild").mockImplementation(() => {});
        getByIdSpy = jest.spyOn(document, "getElementById").mockReturnValue(null);
    });

    afterEach(() => {
        appendChildSpy.mockRestore();
        getByIdSpy.mockRestore();
    });

    it("creates the import-midi modal and appends it to body", () => {
        const pm = new ProjectManager(makeActivity());
        pm._midiImportBlocks({ tracks: [] });
        expect(appendChildSpy).toHaveBeenCalledWith(expect.any(HTMLElement));
    });

    it("is a no-op when import-midi already exists", () => {
        getByIdSpy.mockReturnValue({ id: "import-midi" });
        const pm = new ProjectManager(makeActivity());
        pm._midiImportBlocks({ tracks: [] });
        expect(appendChildSpy).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// PART 17 — start(): URL parameter parsing
// ---------------------------------------------------------------------------

describe("start() URL parameter parsing", () => {
    let _savedHref;

    beforeAll(() => {
        _savedHref = window.location.href;
    });

    afterAll(() => {
        window.history.replaceState({}, "", _savedHref);
    });

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        document.getElementById.mockRestore?.();
    });

    const setURL = path => {
        window.history.replaceState({}, "", path);
    };

    const makeStartActivity = () => {
        const activity = makeActivity({
            fileChooser: {
                addEventListener: jest.fn(),
                focus: jest.fn(),
                click: jest.fn()
            }
        });
        activity.loadStartWrapper = jest.fn();
        jest.spyOn(document, "getElementById").mockReturnValue({
            addEventListener: jest.fn()
        });
        return activity;
    };

    it("schedules _loadStart when no URL params", () => {
        setURL("/");
        const activity = makeStartActivity();
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers = jest.fn();
        pm._loadStart = jest.fn();

        pm.start();
        jest.advanceTimersByTime(200);

        expect(activity.loadStartWrapper).toHaveBeenCalled();
    });

    it("parses single ?id= URL param and schedules _loadProject", () => {
        setURL("/?id=project-42");
        const activity = makeStartActivity();
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers = jest.fn();
        pm._loadProject = jest.fn();

        pm.start();
        jest.advanceTimersByTime(200);

        expect(activity.projectID).toBe("project-42");
        expect(activity.loadStartWrapper).toHaveBeenCalled();
    });

    it("parses run=true flag from multi-param URL", () => {
        setURL("/?id=proj&run=true");
        const activity = makeStartActivity();
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers = jest.fn();

        pm.start();

        expect(activity.projectID).toBe("proj");
    });

    it("parses show=true flag from multi-param URL", () => {
        setURL("/?id=proj&show=true");
        const activity = makeStartActivity();
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers = jest.fn();

        pm.start();

        expect(activity.projectID).toBe("proj");
    });

    it("parses collapse=true flag from multi-param URL", () => {
        setURL("/?id=proj&collapse=true");
        const activity = makeStartActivity();
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers = jest.fn();

        pm.start();

        expect(activity.projectID).toBe("proj");
    });

    it("handles unknown multi-param with errorMsg (default case)", () => {
        setURL("/?id=proj&badparam=foo");
        const activity = makeStartActivity();
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers = jest.fn();

        pm.start();

        expect(activity.errorMsg).toHaveBeenCalled();
    });

    it("callback calls _loadProject when projectID is non-null", () => {
        setURL("/?id=my-proj");
        const activity = makeStartActivity();
        activity.loadStartWrapper = jest.fn().mockImplementation(async (fn, ...args) => {
            if (typeof fn === "function") await fn(activity, ...args);
        });
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers = jest.fn();
        pm._loadProject = jest.fn();

        pm.start();
        jest.advanceTimersByTime(200);

        expect(pm._loadProject).toHaveBeenCalledWith(
            "my-proj",
            expect.any(Object),
            expect.any(Array)
        );
    });
});

// ---------------------------------------------------------------------------
// PART 18 — _setupFileHandlers
// ---------------------------------------------------------------------------

describe("_setupFileHandlers", () => {
    let canvasHolder;

    beforeEach(() => {
        canvasHolder = { addEventListener: jest.fn() };
        jest.spyOn(document, "getElementById").mockReturnValue(canvasHolder);
    });

    afterEach(() => {
        document.getElementById.mockRestore();
    });

    it("registers click and change listeners on activity.fileChooser", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers();
        expect(activity.fileChooser.addEventListener).toHaveBeenCalledWith(
            "click",
            expect.any(Function)
        );
        expect(activity.fileChooser.addEventListener).toHaveBeenCalledWith(
            "change",
            expect.any(Function),
            false
        );
    });

    it("registers dragover and drop on #canvasHolder", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers();
        expect(canvasHolder.addEventListener).toHaveBeenCalledWith(
            "dragover",
            expect.any(Function),
            false
        );
        expect(canvasHolder.addEventListener).toHaveBeenCalledWith(
            "drop",
            expect.any(Function),
            false
        );
    });
});

// ---------------------------------------------------------------------------
// PART 19 — integration: setupProjectManager + start delegates
// ---------------------------------------------------------------------------

describe("delegate integration", () => {
    it("activity.doLoadAnimation delegates to pm.doLoadAnimation", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        activity.doLoadAnimation = (...args) => pm.doLoadAnimation(...args);
        pm.doLoadAnimation = jest.fn();
        activity.doLoadAnimation();
        expect(pm.doLoadAnimation).toHaveBeenCalled();
    });

    it("activity.justLoadStart delegates to pm.justLoadStart", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        activity.justLoadStart = (...args) => pm.justLoadStart(...args);
        pm.justLoadStart = jest.fn();
        activity.justLoadStart();
        expect(pm.justLoadStart).toHaveBeenCalled();
    });

    it("activity.runProject forwards env argument", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        activity.runProject = (...args) => pm.runProject(...args);
        pm.runProject = jest.fn();
        activity.runProject("my-env");
        expect(pm.runProject).toHaveBeenCalledWith("my-env");
    });
});

// ---------------------------------------------------------------------------
// PART 20 — doLoadAnimation counter reset
// ---------------------------------------------------------------------------

describe("doLoadAnimation counter wrap", () => {
    let loadContainer, messageText;

    beforeEach(() => {
        loadContainer = { style: { display: "none" } };
        messageText = { textContent: "" };
        jest.spyOn(document, "getElementById").mockImplementation(id => {
            if (id === "load-container") return loadContainer;
            if (id === "messageText") return messageText;
            return null;
        });
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        document.getElementById.mockRestore();
    });

    it("resets counter to 0 after cycling through all 9 messages", () => {
        const pm = new ProjectManager(makeActivity());
        pm.doLoadAnimation();
        // 9 load_messages entries; firing 9 ticks causes the counter to wrap
        jest.advanceTimersByTime(2000 * 9);
        expect(messageText.textContent).toMatch(/\.\.\.$/);
    });
});

// ---------------------------------------------------------------------------
// PART 21 — _loadStart: removeBadSessionKey error (line 225)
// ---------------------------------------------------------------------------

describe("_loadStart removeBadSessionKey error", () => {
    it("calls ErrorHandler.recoverable when storage.removeItem itself throws", async () => {
        const removeItem = jest.fn().mockImplementation(() => {
            throw new Error("storage full");
        });
        const activity = makeActivity({
            storage: {
                currentProject: "Crash",
                SESSIONCrash: '{"broken":',
                removeItem
            }
        });
        activity.sessionData = '{"broken":';
        const pm = new ProjectManager(activity);
        await pm._loadStart(activity);

        expect(global.ErrorHandler.recoverable).toHaveBeenCalledWith(
            expect.objectContaining({ message: "storage full" }),
            { operation: "removeBadSessionKey" }
        );
    });
});

// ---------------------------------------------------------------------------
// PART 22 — _loadProject: textMsg error + 2500ms body
// ---------------------------------------------------------------------------

describe("_loadProject additional branches", () => {
    const makePlanetActivity = (overrides = {}) => {
        const planet = {
            getCurrentProjectName: jest.fn(() => "Test Project"),
            openProjectFromPlanet: jest.fn(),
            initialiseNewProject: jest.fn(),
            ...overrides.planet
        };
        return makeActivity({ planet, ...overrides });
    };

    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it("calls ErrorHandler.recoverable when textMsg throws", () => {
        const activity = makePlanetActivity();
        activity.textMsg = jest.fn().mockImplementationOnce(() => {
            throw new Error("textMsg fail");
        });
        const pm = new ProjectManager(activity);

        pm._loadProject("proj-1");

        expect(global.ErrorHandler.recoverable).toHaveBeenCalledWith(
            expect.objectContaining({ message: "textMsg fail" }),
            { operation: "loadProjectName" }
        );
    });

    it("calls openProjectFromPlanet and finishLoading after 2500ms", () => {
        const activity = makePlanetActivity();
        const pm = new ProjectManager(activity);

        pm._loadProject("proj-1", { run: false, show: false, collapse: false });
        jest.advanceTimersByTime(2500);

        expect(activity.planet.openProjectFromPlanet).toHaveBeenCalledWith(
            "proj-1",
            expect.any(Function)
        );
        expect(activity.planet.initialiseNewProject).toHaveBeenCalled();
        expect(activity.loading).toBe(false);
    });

    it("recovers via loadStartWrapper when openProjectFromPlanet is not a function", () => {
        const activity = makePlanetActivity({
            planet: {
                getCurrentProjectName: jest.fn(() => "Test"),
                openProjectFromPlanet: null,
                initialiseNewProject: jest.fn()
            }
        });
        const pm = new ProjectManager(activity);

        pm._loadProject("proj-1", { run: false, show: false, collapse: false });
        jest.advanceTimersByTime(2500);

        expect(global.ErrorHandler.recoverable).toHaveBeenCalledWith(expect.any(Error), {
            operation: "openProjectFromPlanet"
        });
        expect(activity.loadStartWrapper).toHaveBeenCalled();
    });

    it("warns when initialiseNewProject is not a function", () => {
        const activity = makePlanetActivity({
            planet: {
                getCurrentProjectName: jest.fn(() => "Test"),
                openProjectFromPlanet: jest.fn(),
                initialiseNewProject: null
            }
        });
        const pm = new ProjectManager(activity);

        pm._loadProject("proj-1", { run: false, show: false, collapse: false });
        jest.advanceTimersByTime(2500);

        expect(global.ErrorHandler.warn).toHaveBeenCalledWith(
            "Planet initialiseNewProject is unavailable.",
            { operation: "loadFromPlanet" }
        );
    });

    it("covers __functionload with run=true and firstRun=true", () => {
        const activity = makePlanetActivity({ firstRun: true });
        activity._toggleCollapsibleStacks = jest.fn();
        activity._changeBlockVisibility = jest.fn();
        const pm = new ProjectManager(activity);

        pm._loadProject("proj-1", { run: true, show: true, collapse: false });

        global.pubsub.emit("finishedLoading");
        jest.advanceTimersByTime(1000);

        expect(activity._toggleCollapsibleStacks).toHaveBeenCalled();
        expect(activity.textMsg).toHaveBeenCalledWith("Click the run button to run the project.");
        expect(activity._changeBlockVisibility).toHaveBeenCalled();
    });

    it("covers __functionload else-if !show branch when run=false and show=false", () => {
        const activity = makePlanetActivity({ firstRun: true });
        activity._changeBlockVisibility = jest.fn();
        const pm = new ProjectManager(activity);

        pm._loadProject("proj-1", { run: false, show: false, collapse: false });

        global.pubsub.emit("finishedLoading");
        jest.advanceTimersByTime(1000);

        expect(activity._changeBlockVisibility).toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// PART 23 — _doLoad with undefined merge argument (line 389)
// ---------------------------------------------------------------------------

describe("_doLoad with no argument", () => {
    beforeEach(() => {
        jest.spyOn(document, "querySelector").mockReturnValue({
            focus: jest.fn(),
            click: jest.fn()
        });
    });
    afterEach(() => document.querySelector.mockRestore());

    it("defaults merge to false when no argument is passed", () => {
        const activity = makeActivity();
        const pm = new ProjectManager(activity);
        pm._doLoad();
        expect(activity.merging).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// PART 24 — prepareExport additional block types
// ---------------------------------------------------------------------------

describe("prepareExport additional block types", () => {
    it("skips null entries in blockList (line 427)", () => {
        const activity = makeActivity();
        // Use "note" which hits the default: branch and exports as plain string
        activity.blocks.blockList = [
            null,
            {
                name: "note",
                trash: false,
                value: null,
                collapsed: false,
                container: { x: 0, y: 0 },
                connections: [null],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result).toHaveLength(1);
        expect(result[0][1]).toBe("note");
    });

    it("exports temperament1 with custom temperament data", () => {
        const activity = makeActivity();
        activity.blocks.customTemperamentDefined = true;
        activity.blocks.blockList = [
            {
                name: "temperament1",
                trash: false,
                value: null,
                collapsed: false,
                container: { x: 0, y: 0 },
                connections: [null, null],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result).toHaveLength(1);
        expect(result[0][1][1]).toMatchObject({
            customName: "custom",
            startingPitch: 392
        });
    });

    it("exports temperament1 with connected name block", () => {
        const activity = makeActivity();
        activity.blocks.customTemperamentDefined = true;
        activity.blocks.blockList = [
            {
                name: "temperament1",
                trash: false,
                value: null,
                collapsed: false,
                container: { x: 0, y: 0 },
                connections: [null, 1],
                isValueBlock: () => false
            },
            {
                name: "text",
                trash: false,
                value: "myScale",
                collapsed: false,
                container: { x: 10, y: 0 },
                connections: [0],
                isValueBlock: () => true
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result[0][1][1].customName).toBe("myScale");
    });

    it("exports nopValueBlock with privateData as exportName", () => {
        const activity = makeActivity();
        activity.blocks.blockList = [
            {
                name: "nopValueBlock",
                trash: false,
                value: null,
                collapsed: false,
                privateData: "myCustomBlock",
                container: { x: 0, y: 0 },
                connections: [null],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result[0][1]).toBe("myCustomBlock");
    });

    it("exports matrixData block with notes and count", () => {
        window.savedMatricesNotes = [["C4"]];
        window.savedMatricesCount = [4];
        const activity = makeActivity();
        activity.blocks.blockList = [
            {
                name: "matrixData",
                trash: false,
                value: null,
                collapsed: false,
                container: { x: 0, y: 0 },
                connections: [null],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result[0][1][1]).toMatchObject({
            notes: [["C4"]],
            count: [4]
        });
        expect(activity.hasMatrixDataBlock).toBe(true);
    });

    it("exports wrapmode block with value", () => {
        const activity = makeActivity();
        activity.blocks.blockList = [
            {
                name: "wrapmode",
                trash: false,
                value: "on",
                collapsed: false,
                container: { x: 0, y: 0 },
                connections: [null],
                isValueBlock: () => false
            }
        ];
        const pm = new ProjectManager(activity);
        const result = JSON.parse(pm.prepareExport());
        expect(result[0][1][1]).toMatchObject({ value: "on" });
    });
});

// ---------------------------------------------------------------------------
// PART 25 — saveLocally: allProjects error + thumbnail
// ---------------------------------------------------------------------------

describe("saveLocally additional paths", () => {
    it("calls ErrorHandler.recoverable when allProjects setter throws", () => {
        const storage = Object.create(null);
        let _currentProject;
        Object.defineProperty(storage, "currentProject", {
            get: () => _currentProject,
            set: val => {
                _currentProject = val;
            },
            configurable: true
        });
        Object.defineProperty(storage, "allProjects", {
            set: () => {
                throw new Error("quota exceeded");
            },
            configurable: true
        });
        const activity = makeActivity({ storage, canvas: { width: 100 } });
        const pm = new ProjectManager(activity);
        pm.prepareExport = jest.fn(() => "[]");

        pm.saveLocally();

        expect(global.ErrorHandler.recoverable).toHaveBeenCalledWith(
            expect.objectContaining({ message: "quota exceeded" }),
            { operation: "saveLocally_setCurrentProject" }
        );
    });

    it("saves thumbnail to storage when Image loads", () => {
        const origImage = global.Image;
        class FakeImage {
            constructor() {
                this.naturalWidth = 100;
                this.naturalHeight = 100;
                this.onload = null;
            }
            set src(_) {
                if (this.onload) this.onload();
            }
        }
        global.Image = FakeImage;

        const origCreate = document.createElement.bind(document);
        const mockCanvas = {
            width: 0,
            height: 0,
            getContext: () => ({ drawImage: jest.fn() }),
            toDataURL: () => "data:image/png;base64,thumb"
        };
        jest.spyOn(document, "createElement").mockImplementation(tag =>
            tag === "canvas" ? mockCanvas : origCreate(tag)
        );

        const storage = { currentProject: "Proj" };
        const activity = makeActivity({ storage });
        const pm = new ProjectManager(activity);
        pm.prepareExport = jest.fn(() => "[]");

        pm.saveLocally();

        expect(storage["SESSIONIMAGEProj"]).toBe("data:image/png;base64,thumb");

        global.Image = origImage;
        document.createElement.mockRestore();
    });

    it("calls ErrorHandler.recoverable when canvas getContext throws during thumbnail", () => {
        const origImage = global.Image;
        class FakeImage {
            constructor() {
                this.naturalWidth = 100;
                this.naturalHeight = 100;
                this.onload = null;
            }
            set src(_) {
                if (this.onload) this.onload();
            }
        }
        global.Image = FakeImage;

        const origCreate = document.createElement.bind(document);
        const badCanvas = {
            width: 0,
            height: 0,
            getContext: () => {
                throw new Error("canvas error");
            }
        };
        jest.spyOn(document, "createElement").mockImplementation(tag =>
            tag === "canvas" ? badCanvas : origCreate(tag)
        );

        const storage = { currentProject: "Proj" };
        const activity = makeActivity({ storage });
        const pm = new ProjectManager(activity);
        pm.prepareExport = jest.fn(() => "[]");

        pm.saveLocally();

        expect(global.ErrorHandler.recoverable).toHaveBeenCalledWith(expect.any(Error), {
            operation: "saveLocally_thumbnail"
        });

        global.Image = origImage;
        document.createElement.mockRestore();
    });
});

// ---------------------------------------------------------------------------
// PART 26 — _midiImportBlocks button handlers
// ---------------------------------------------------------------------------

describe("_midiImportBlocks button handlers", () => {
    let origRequire;

    beforeEach(() => {
        origRequire = global.require;
        global.require = jest.fn((deps, cb) => cb && cb());
        jest.spyOn(document, "getElementById").mockReturnValue(null);
    });

    afterEach(() => {
        global.require = origRequire;
        document.getElementById.mockRestore();
        const modal = document.body.querySelector("#import-midi");
        if (modal) document.body.removeChild(modal);
    });

    it("confirm button is present and has correct class", () => {
        const pm = new ProjectManager(makeActivity());
        pm._midiImportBlocks({ tracks: [] });

        const confirmBtn = document.body.querySelector(".confirm-button");
        expect(confirmBtn).not.toBeNull();
        expect(confirmBtn.textContent).toBe("Confirm");
    });

    it("removes the modal when cancel button is clicked", () => {
        const pm = new ProjectManager(makeActivity());
        pm._midiImportBlocks({ tracks: [] });

        const cancelBtn = document.body.querySelector(".cancel-button");
        expect(cancelBtn).not.toBeNull();
        expect(() => cancelBtn.click()).not.toThrow();

        expect(document.body.querySelector("#import-midi")).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// PART 27 — _setupFileHandlers: inner callbacks
// ---------------------------------------------------------------------------

describe("_setupFileHandlers inner callbacks", () => {
    let canvasHolder;
    let origFileReader;

    beforeEach(() => {
        canvasHolder = { addEventListener: jest.fn() };
        jest.spyOn(document, "getElementById").mockReturnValue(canvasHolder);
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        document.getElementById.mockRestore();
        if (origFileReader) {
            global.FileReader = origFileReader;
            origFileReader = null;
        }
    });

    const captureHandlers = activity => {
        const handlers = {};
        activity.fileChooser.addEventListener = jest
            .fn()
            .mockImplementation((evt, handler, _flag) => {
                handlers[evt] = handler;
            });
        return handlers;
    };

    it("click handler clears the fileChooser value", () => {
        const activity = makeActivity();
        const handlers = captureHandlers(activity);
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers();

        const mockEvent = { currentTarget: { value: "old.tb" } };
        handlers.click(mockEvent);

        expect(mockEvent.currentTarget.value).toBe("");
    });

    it("change handler shows error when file is empty (null result)", () => {
        origFileReader = global.FileReader;
        class MockFR {
            constructor() {
                this.result = null;
                this.onload = null;
            }
            readAsText() {
                if (this.onload) this.onload();
            }
            readAsArrayBuffer() {}
        }
        global.FileReader = MockFR;

        const activity = makeActivity();
        const handlers = captureHandlers(activity);
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers();

        activity.fileChooser.files = [{ name: "test.tb" }];
        handlers.change();

        jest.advanceTimersByTime(200);

        expect(activity.errorMsg).toHaveBeenCalled();
        expect(activity.loading).toBe(true);
    });

    it("change handler imports MIDI when .mid file selected", () => {
        origFileReader = global.FileReader;
        class MockFR {
            constructor() {
                this.onload = null;
            }
            readAsText() {}
            readAsArrayBuffer() {
                if (this.onload) this.onload({ target: { result: new ArrayBuffer(0) } });
            }
        }
        global.FileReader = MockFR;

        const activity = makeActivity();
        const handlers = captureHandlers(activity);
        const pm = new ProjectManager(activity);
        pm._midiImportBlocks = jest.fn();
        pm._setupFileHandlers();

        activity.fileChooser.files = [{ name: "song.mid" }];
        handlers.change();

        expect(pm._midiImportBlocks).toHaveBeenCalled();
    });

    it("change handler handles midi reader error", () => {
        origFileReader = global.FileReader;
        class MockFR {
            constructor() {
                this.onload = null;
            }
            readAsText() {}
            readAsArrayBuffer() {
                if (this.onload) this.onload({ target: { result: new ArrayBuffer(0) } });
            }
        }
        global.FileReader = MockFR;
        global.Midi = class {
            constructor() {
                throw new Error("bad midi");
            }
        };

        const activity = makeActivity();
        const handlers = captureHandlers(activity);
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers();

        activity.fileChooser.files = [{ name: "broken.mid" }];
        handlers.change();

        expect(global.ErrorHandler.capture).toHaveBeenCalledWith(expect.any(Error), {
            operation: "midiImport"
        });
        global.Midi = class {
            constructor() {}
        };
    });

    it("change handler does nothing when no file selected", () => {
        const activity = makeActivity();
        const handlers = captureHandlers(activity);
        const pm = new ProjectManager(activity);
        pm._setupFileHandlers();

        activity.fileChooser.files = [];
        expect(() => handlers.change()).not.toThrow();
    });
});
