// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

const {
    setupKeyboardShortcutController,
    KeyboardShortcutController
} = require("../keyboard-shortcut-controller.js");

// ---------------------------------------------------------------------------
// Globals required by the controller
// ---------------------------------------------------------------------------

beforeAll(() => {
    if (typeof global._ !== "function") {
        global._ = s => s;
    }
    global.platformColor = { stopIconcolor: "red" };
    global.STANDARDBLOCKHEIGHT = 55;
    global.disableHorizScrollIcon = document.createElement("div");
    global.disableHorizScrollIcon.style.display = "block";

    window.widgetWindows = {
        isOpen: jest.fn(() => false),
        openWindows: {}
    };
});

beforeEach(() => {
    ["labelDiv", "lilypondModal", "planet-iframe", "wheelDiv"].forEach(id => {
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement("div");
            el.id = id;
            document.body.appendChild(el);
        }
        el.style.display = "none";
    });
});

afterEach(() => {
    jest.clearAllMocks();
    window.widgetWindows.isOpen.mockReturnValue(false);
    document.body.innerHTML = "";
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMinimalActivity() {
    return {
        keyboardEnableFlag: true,
        printText: null,
        isInputON: false,
        searchWidget: { style: { visibility: "hidden" } },
        helpfulSearchWidget: { style: { visibility: "hidden" } },
        paste: { style: { visibility: "hidden" }, value: "" },
        turtles: { running: jest.fn(() => false) },
        toolbar: { highlightStop: jest.fn() },
        logo: { doStopTurtles: jest.fn() },
        blocks: {},
        save: {},
        textMsg: jest.fn(),
        refreshCanvas: jest.fn(),
        _doFastButton: jest.fn(),
        _doHardStopButton: jest.fn(),
        pasted: jest.fn(),
        currentKey: "",
        currentKeyCode: 0
    };
}

// ---------------------------------------------------------------------------
// Setup / wiring
// ---------------------------------------------------------------------------

describe("setupKeyboardShortcutController", () => {
    test("attaches KeyboardShortcutController instance to activity", () => {
        const activity = makeMinimalActivity();
        setupKeyboardShortcutController(activity);

        expect(activity._keyboardShortcutController).toBeInstanceOf(KeyboardShortcutController);
    });

    test("attaches __keyPressed, getCurrentKeyCode, clearCurrentKeyCode wrappers", () => {
        const activity = makeMinimalActivity();
        setupKeyboardShortcutController(activity);

        expect(typeof activity.__keyPressed).toBe("function");
        expect(typeof activity.getCurrentKeyCode).toBe("function");
        expect(typeof activity.clearCurrentKeyCode).toBe("function");
    });
});

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe("KeyboardShortcutController constructor", () => {
    test("stores activity reference and initializes inTempoWidget to false", () => {
        const activity = makeMinimalActivity();
        const controller = new KeyboardShortcutController(activity);

        expect(controller.activity).toBe(activity);
        expect(controller.inTempoWidget).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// State management (getCurrentKeyCode / clearCurrentKeyCode)
// ---------------------------------------------------------------------------

describe("getCurrentKeyCode", () => {
    test("returns 0 when no key has been pressed", () => {
        const activity = makeMinimalActivity();
        setupKeyboardShortcutController(activity);

        expect(activity.getCurrentKeyCode()).toBe(0);
    });

    test("returns the current key code value set on activity", () => {
        const activity = makeMinimalActivity();
        setupKeyboardShortcutController(activity);

        activity.currentKeyCode = 65;
        expect(activity.getCurrentKeyCode()).toBe(65);

        activity.currentKeyCode = 32;
        expect(activity.getCurrentKeyCode()).toBe(32);
    });
});

describe("clearCurrentKeyCode", () => {
    test("clears currentKey to empty string", () => {
        const activity = makeMinimalActivity();
        setupKeyboardShortcutController(activity);

        activity.currentKey = "A";
        activity.currentKeyCode = 65;
        activity.clearCurrentKeyCode();

        expect(activity.currentKey).toBe("");
    });

    test("clears currentKeyCode to 0", () => {
        const activity = makeMinimalActivity();
        setupKeyboardShortcutController(activity);

        activity.currentKey = "Space";
        activity.currentKeyCode = 32;
        activity.clearCurrentKeyCode();

        expect(activity.currentKeyCode).toBe(0);
    });

    test("clears both currentKey and currentKeyCode simultaneously", () => {
        const activity = makeMinimalActivity();
        setupKeyboardShortcutController(activity);

        activity.currentKey = "Enter";
        activity.currentKeyCode = 13;
        activity.clearCurrentKeyCode();

        expect(activity.currentKey).toBe("");
        expect(activity.currentKeyCode).toBe(0);
    });
});

// ---------------------------------------------------------------------------
// handleKeyEvent early returns (guard conditions)
// ---------------------------------------------------------------------------

describe("handleKeyEvent early returns", () => {
    let controller;
    let activity;

    beforeEach(() => {
        activity = makeMinimalActivity();
        controller = new KeyboardShortcutController(activity);
    });

    test("returns early when keyboardEnableFlag is false", () => {
        activity.keyboardEnableFlag = false;
        const event = { keyCode: 65 };

        // Should not throw even without DOM elements
        expect(() => controller.handleKeyEvent(event)).not.toThrow();
        // currentKeyCode should not be set when returning early
        expect(activity.currentKeyCode).toBe(0);
    });

    test("returns early when slider is open and arrow keys are pressed", () => {
        window.widgetWindows.isOpen.mockReturnValue(true);
        const event = {
            keyCode: 38, // UP
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        };

        controller.handleKeyEvent(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
    });

    test("does not prevent default for non-arrow keys when slider is open", () => {
        window.widgetWindows.isOpen.mockReturnValue(true);
        const event = {
            keyCode: 65, // 'A'
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        };

        controller.handleKeyEvent(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------------------
// Keyboard shortcut execution (Alt+R, Alt+Enter, Space)
// ---------------------------------------------------------------------------

describe("Alt+R shortcut", () => {
    let controller;
    let activity;

    beforeEach(() => {
        activity = makeMinimalActivity();
        setupKeyboardShortcutController(activity);
        controller = activity._keyboardShortcutController;
    });

    test("Alt+R calls _doFastButton via __keyPressed", () => {
        const event = {
            altKey: true,
            keyCode: 82,
            key: "r",
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        };

        activity.__keyPressed(event);

        expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
        expect(activity._doFastButton).toHaveBeenCalled();
    });
});

describe("Space shortcut", () => {
    let controller;
    let activity;

    beforeEach(() => {
        activity = makeMinimalActivity();
        setupKeyboardShortcutController(activity);
        controller = activity._keyboardShortcutController;
    });

    test("Space calls _doFastButton when not running and no open widgets", () => {
        const event = {
            keyCode: 32,
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        };

        activity.__keyPressed(event);

        expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
        expect(activity._doFastButton).toHaveBeenCalled();
    });

    test("Space calls _doHardStopButton when running", () => {
        activity.turtles.running.mockReturnValue(true);
        const event = {
            keyCode: 32,
            preventDefault: jest.fn(),
            stopPropagation: jest.fn()
        };

        activity.__keyPressed(event);

        expect(activity._doHardStopButton).toHaveBeenCalled();
    });
});
