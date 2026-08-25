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

// Shared vm sandbox for loading the real, unmodified js/activity.js into a
// Jest test without a browser. Every field here stubs a dependency that
// sits outside whatever seam a given test is exercising (Turtles, Blocks,
// Logo, the setupXController functions, etc.) so that just constructing
// Activity doesn't require real DOM/audio/canvas machinery Jest can't
// provide. Callers layer test-specific `overrides` on top (e.g. mocking or
// deliberately NOT mocking setupProjectManager) and may supply `prependCode`
// to run more real, unmodified source (such as project-manager.js) in the
// same vm context before activity.js runs.

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ACTIVITY_PATH = path.resolve(__dirname, "../../activity.js");

const createBaseSandbox = () => ({
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
    setupProjectManager: jest.fn(activity => {
        activity.projectManager = {
            doLoadAnimation: jest.fn(),
            stopLoadAnimation: jest.fn(),
            prepareExport: jest.fn(),
            runProject: jest.fn(),
            getClosestStandardNoteValue: jest.fn(),
            _loadProject: jest.fn(),
            loadStartWrapper: jest.fn(),
            showContents: jest.fn(),
            justLoadStart: jest.fn(),
            saveLocally: jest.fn(),
            newProject: jest.fn(),
            doLoad: jest.fn(),
            doMergeLoad: jest.fn(),
            start: jest.fn()
        };
    }),
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
    MYDEFINES: []
});

/**
 * Loads the real, unmodified js/activity.js into a fresh vm context.
 *
 * `overrides` is merged over the default stub set (e.g. to delete/replace
 * `setupProjectManager`). `prependCode` (if given) runs in the same context
 * before activity.js, so e.g. the real project-manager.js's own top-level
 * `setupProjectManager` becomes the one activity.js's constructor sees.
 *
 * activity.js's own last top-level statement constructs its Activity
 * singleton and feeds it into a define(["domReady!", ...], callback)
 * bootstrap call; since the sandbox's `define` is a no-op, that callback is
 * created but never invoked. The file runs entirely unmodified - no source
 * slicing - and its own `const activity = new Activity();` / `class
 * Activity` bindings are pulled out via `this.activity = activity;` /
 * `this.Activity = Activity;`, appended to the file text before running it.
 */
const loadActivitySandbox = ({ overrides = {}, prependCode = "" } = {}) => {
    const sandbox = { ...createBaseSandbox(), ...overrides };
    const code =
        fs.readFileSync(ACTIVITY_PATH, "utf8") +
        "\nthis.activity = activity;\nthis.Activity = Activity;";

    vm.createContext(sandbox);
    if (prependCode) {
        vm.runInContext(prependCode, sandbox);
    }
    vm.runInContext(code, sandbox);
    return sandbox;
};

module.exports = { loadActivitySandbox };
