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
// back real Activity state.
//
// Both js/project-manager.js and js/activity.js run here completely
// unmodified. Unrelated Activity dependencies (Turtles, Blocks, Logo, the
// various setupXController functions, etc.) are stubbed in the sandbox
// below purely to keep construction from touching real DOM/audio/canvas
// machinery Jest can't provide - they sit outside the Activity<->
// ProjectManager seam this test is about, not on either side of it.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const PROJECT_MANAGER_CODE =
    fs.readFileSync(path.resolve(__dirname, "../project-manager.js"), "utf8") +
    "\nthis.setupProjectManager = setupProjectManager;\nthis.ProjectManager = ProjectManager;";

// activity.js's own last top-level statement is `const activity = new
// Activity();`, immediately followed by a define(["domReady!", ...], ...)
// bootstrap call. Rather than slicing the source at that statement (which
// would couple this test to exact source text), the whole file is run
// unmodified: the sandbox's `define` stub is a no-op, so that bootstrap
// callback is created but never invoked, and the file's own singleton
// construction becomes the Activity instance under test. `this.activity =
// activity;` and `this.Activity = Activity;` just pull those two top-level
// bindings out of the vm script's lexical scope, the same way the sibling
// activity_toolbar_integration.test.js already does for `Activity`.
const ACTIVITY_CODE =
    fs.readFileSync(path.resolve(__dirname, "../activity.js"), "utf8") +
    "\nthis.activity = activity;\nthis.Activity = Activity;";

const loadActivityAndProjectManager = () => {
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
    // declared dependency of "activity", loaded first so setupProjectManager
    // exists in scope before Activity's constructor calls it.
    vm.runInContext(PROJECT_MANAGER_CODE, sandbox);
    vm.runInContext(ACTIVITY_CODE, sandbox);
    return {
        activity: sandbox.activity,
        Activity: sandbox.Activity,
        ProjectManager: sandbox.ProjectManager
    };
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
    let ProjectManager;
    let mockElement;
    let activity;

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

        // A fresh vm context/module load per test, not just a fresh instance
        // from a shared loaded module, so no state (e.g. the module-level
        // `let globalActivity`) can leak between tests.
        ({ activity, ProjectManager } = loadActivityAndProjectManager());

        activity.turtles = {
            getTurtle: jest.fn(() => ({
                id: 0,
                x: 0,
                y: 0,
                orientation: 0,
                painter: { color: 0, value: 50, stroke: 5, chroma: 100 }
            }))
        };
        activity.blocks = { blockList: makeBlockList() };
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
    });

    it("prepareExport() reads the real Activity's block/turtle state through the real ProjectManager", () => {
        const parsed = JSON.parse(activity.projectManager.prepareExport());

        expect(parsed).toHaveLength(2);
        const [startEntry, noteEntry] = parsed;

        // The "start" block's exported args carry this turtle's real id -
        // only obtainable by actually calling through to the real
        // activity.turtles.getTurtle(), not by echoing static block data.
        expect(startEntry[1][0]).toBe("start");
        expect(startEntry[1][1]).toMatchObject({ id: 0 });

        // The "note" block's connection (originally block index 0) resolves
        // to the "start" block's position in the real activity.blocks.blockList
        // - a value ProjectManager had to compute from that real array, not
        // one it could have produced from a mock.
        expect(noteEntry[0]).toBe(1);
        expect(noteEntry[4]).toEqual([0, null]);
    });

    it("prepareExport() mutates the real Activity instance it was called through, not a detached copy", () => {
        // Seeded to the opposite of what prepareExport() sets, so the
        // assertion below proves a real mutation happened.
        activity.hasMatrixDataBlock = true;

        activity.projectManager.prepareExport();

        expect(activity.hasMatrixDataBlock).toBe(false);
    });
});
