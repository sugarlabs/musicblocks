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
// Jest test without a browser. This intentionally stubs only what the
// Activity constructor itself touches directly (the setupXController
// functions it calls in sequence, hideDOMLabel, ErrorHandler, PluginDialog,
// performance) - verified empirically by trimming the sandbox until
// construction stopped succeeding. Activity's heavier dependencies (Turtles,
// Blocks, Logo, etc.) are never referenced during construction itself: they
// are wired up later by setupDependencies(), which only runs from the
// domReady bootstrap callback below - and since this sandbox's `define` is a
// no-op, that callback is never invoked. Callers layer test-specific
// `overrides` on top (e.g. mocking or deliberately NOT mocking
// setupProjectManager) and may supply `prependCode` to run more real,
// unmodified source (such as project-manager.js) in the same vm context
// before activity.js runs.

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
    PluginDialog: class {
        constructor() {}
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
    performance: global.performance || { now: () => Date.now() }
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

const PROJECT_MANAGER_PATH = path.resolve(__dirname, "../../project-manager.js");

// project-manager.js only exposes its module-local `setupProjectManager`
// onto `window` inside its AMD branch (what RequireJS triggers in the
// browser). Appending these assignments is the vm-sandbox equivalent of
// that - pulling `setupProjectManager`/`ProjectManager` onto the shared
// context the same way `this.activity = activity;` does for activity.js
// above - so activity.js's constructor calls the real setupProjectManager
// instead of the default mocked one above.
const REAL_PROJECT_MANAGER_CODE =
    fs.readFileSync(PROJECT_MANAGER_PATH, "utf8") +
    "\nthis.setupProjectManager = setupProjectManager;\nthis.ProjectManager = ProjectManager;";

/**
 * Loads real, unmodified activity.js AND project-manager.js into one vm
 * context, so activity.js's constructor wires up a real ProjectManager
 * instead of the default sandbox's mocked one. `overrides` covers the
 * handful of extra globals project-manager.js's methods read at call time
 * (e.g. `pubsub`, `DATAOBJS`) on top of the base Activity stub set.
 */
const loadActivityWithRealProjectManager = (overrides = {}) =>
    loadActivitySandbox({ overrides, prependCode: REAL_PROJECT_MANAGER_CODE });

module.exports = { loadActivitySandbox, loadActivityWithRealProjectManager };
