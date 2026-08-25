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

// This test proves the wiring boundary between the real Activity and the
// real ProjectManager: activity_toolbar_integration.test.js loads a real
// Activity but stubs out setupProjectManager entirely, and
// project-manager.test.js exercises a real ProjectManager against a plain
// fake object standing in for Activity. Neither proves that constructing a
// real Activity produces a real, correctly-wired ProjectManager that reads
// back real Activity state. This test loads both js/activity.js and
// js/project-manager.js into one vm sandbox (unmodified, via
// setupProjectManager(this) at construction time, same as the browser load
// order in js/loader.js) and never mocks either side of that seam.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const loadActivityAndProjectManager = () => {
    const projectManagerCode =
        fs.readFileSync(path.resolve(__dirname, "../project-manager.js"), "utf8") +
        "\nthis.setupProjectManager = setupProjectManager;\nthis.ProjectManager = ProjectManager;";

    const activityPath = path.resolve(__dirname, "../activity.js");
    let activityCode = fs.readFileSync(activityPath, "utf8");
    const splitPoint = activityCode.indexOf("const activity = new Activity();");
    if (splitPoint !== -1) {
        activityCode = activityCode.substring(0, splitPoint);
    }
    activityCode += "\nthis.Activity = Activity;";

    const sandbox = {
        window: global.window,
        document: global.document,
        console: global.console,
        navigator: global.navigator,
        _: key => key,
        define: () => {},
        require: () => {},
        setTimeout,
        setInterval,
        createjs: {
            DOMElement: class {
                constructor() {}
            }
        },
        jQuery: {
            browser: { mozilla: false }
        },
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
        PluginDialog: class {
            constructor() {}
        },
        GIFAnimator: class {},
        i18next: {
            changeLanguage: jest.fn()
        },
        ErrorHandler: {
            capture: jest.fn(),
            recoverable: jest.fn()
        },
        setupActivityIdleWatcher: jest.fn(),
        setupKeyboardController: jest.fn(activity => {
            activity.keyboardController = {
                getCurrentKeyCode: jest.fn(),
                clearCurrentKeyCode: jest.fn(),
                __keyPressed: jest.fn(),
                dispose: jest.fn()
            };
        }),
        setupPluginController: jest.fn(),
        setupToolbarController: jest.fn(),
        setupAlertController: jest.fn(),
        setupAlertRenderer: jest.fn(),
        setupPaletteLoader: jest.fn(),
        setupSearchUI: jest.fn(() => ({
            createSearchUI: jest.fn(),
            show: jest.fn(),
            hide: jest.fn(),
            focusInput: jest.fn(),
            updateQuery: jest.fn(),
            helpfulSearchDiv: null
        })),
        setupSearchController: jest.fn(),
        setupWorkspaceLayoutController: jest.fn(),
        setupSelectionController: jest.fn(),
        setupTrashController: jest.fn(),
        setupHelpController: jest.fn(),
        setupBlockScaleController: jest.fn(),
        setupContextMenuController: jest.fn(),
        hideDOMLabel: jest.fn(),
        setupActivityRecorder: jest.fn(),
        setupActivityAbcParser: jest.fn(),
        AlertController: {
            MSG_TIMEOUT: 60000,
            ERROR_MSG_TIMEOUT: 15000
        },
        performance: global.performance || { now: () => Date.now() },
        platformColor: { stopIconcolor: "red" },
        globalActivity: null,
        LEADING: 0,
        MYDEFINES: [],
        // globals project-manager.js's methods read at call time (not at
        // load/declare time, so none of these run just by evaluating the file)
        pubsub: { off: jest.fn() },
        DATAOBJS: [{ name: "start" }],
        Midi: class {
            constructor() {}
        },
        ABCJS: { parseOnly: jest.fn(() => [{ header: {} }]) },
        ensureABCJS: jest.fn().mockResolvedValue(undefined),
        extractProjectDataFromHTML: jest.fn(),
        unescapeHTML: jest.fn(x => x),
        doSVG: jest.fn(() => "<svg></svg>"),
        base64Encode: jest.fn(x => x),
        debugLog: jest.fn(),
        getTemperament: jest.fn(() => [440]),
        getOctaveRatio: jest.fn(() => 2),
        transcribeMidi: jest.fn(),
        _THIS_IS_MUSIC_BLOCKS_: true
    };

    vm.createContext(sandbox);
    // Load order mirrors js/loader.js's shim config: "project-manager" is a
    // declared dependency of "activity", loaded first so window/global
    // setupProjectManager exists before Activity's constructor calls it.
    vm.runInContext(projectManagerCode, sandbox);
    vm.runInContext(activityCode, sandbox);
    return { Activity: sandbox.Activity, ProjectManager: sandbox.ProjectManager };
};

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

describe("Activity <-> ProjectManager integration", () => {
    let Activity;
    let ProjectManager;
    let mockElement;
    let activity;

    beforeAll(() => {
        ({ Activity, ProjectManager } = loadActivityAndProjectManager());
    });

    beforeEach(() => {
        mockElement = {
            id: "",
            classList: {
                contains: jest.fn(() => false),
                add: jest.fn(),
                remove: jest.fn()
            },
            style: {
                display: "none",
                visibility: "hidden"
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            appendChild: jest.fn(),
            querySelector: jest.fn(() => null),
            querySelectorAll: jest.fn(() => []),
            innerHTML: "",
            offsetHeight: 40
        };

        document.getElementById = jest.fn(id => {
            if (id === "samplerPrompt") return null;
            return mockElement;
        });
        document.getElementsByClassName = jest.fn(() => []);

        window.platformColor = { stopIconcolor: "red" };
        global.platformColor = window.platformColor;

        activity = new Activity();
    });

    afterEach(() => {
        delete window.hidePrintText;
        delete window.hideErrorText;
        document.body.className = "";
        activity = null;
        jest.clearAllMocks();
    });

    it("wires a real ProjectManager back to the real Activity during construction", () => {
        expect(activity.projectManager).toBeInstanceOf(ProjectManager);
        expect(activity.projectManager.activity).toBe(activity);
        expect(activity.projectManager._loadAnimationIntervalId).toBeNull();
    });

    it("runs a real project operation (prepareExport) against the real Activity's block/turtle state", () => {
        activity.blocks = { blockList: makeBlockList() };
        activity.turtles = {
            getTurtle: jest.fn(() => ({
                id: 0,
                x: 0,
                y: 0,
                orientation: 0,
                painter: { color: 0, value: 50, stroke: 5, chroma: 100 }
            }))
        };

        const exported = activity.projectManager.prepareExport();

        expect(JSON.parse(exported)).toEqual([
            [
                0,
                [
                    "start",
                    {
                        id: 0,
                        collapsed: false,
                        xcor: 0,
                        ycor: 0,
                        heading: 0,
                        color: 0,
                        shade: 50,
                        pensize: 5,
                        grey: 100
                    }
                ],
                100,
                200,
                [null, null]
            ],
            [1, "note", 150, 250, [0, null]]
        ]);
        // prepareExport() sets this flag on the same activity instance it was
        // called through, not on some detached copy - a second observable
        // sign the call went through the real Activity, not a mock.
        expect(activity.hasMatrixDataBlock).toBe(false);
    });
});
