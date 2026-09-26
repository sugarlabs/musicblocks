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

const { platformColor } = require("../utils/platformstyle");
global.platformColor = platformColor;
global.makeKeyboardAccessible = require("../utils/dom-helpers").makeKeyboardAccessible;

jest.mock("../utils/platformstyle", () => ({
    platformColor: { stopIconColor: "#ea174c" }
}));

global.jQuery = jest.fn(() => ({
    on: jest.fn(),
    trigger: jest.fn(),
    tooltip: jest.fn(),
    dropdown: jest.fn()
}));
global.jQuery.noConflict = jest.fn(() => global.jQuery);

global.window = {
    localStorage: { languagePreference: "en" },
    navigator: { language: "en-US" },
    document: {
        getElementById: jest.fn(() => ({ style: {} }))
    },
    getComputedStyle: jest.fn(() => ({ display: "block", visibility: "visible" }))
};

global.localStorage = window.localStorage;

const ToolbarUI = require("../toolbar-ui");

const createMockElement = id => ({
    id,
    style: {},
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    innerHTML: "",
    classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
    },
    appendChild: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    contains: jest.fn(() => false),
    click: jest.fn(),
    focus: jest.fn()
});

document.getElementById = jest.fn(createMockElement);
global.docById = id => document.getElementById(id);

describe("ToolbarUI - Visual Helpers", () => {
    let toolbar;
    let mockStopBtn;

    beforeEach(() => {
        mockStopBtn = createMockElement("stop");
        global.document.getElementById = jest.fn(id => {
            if (id === "stop") return mockStopBtn;
            return createMockElement(id);
        });
        toolbar = new ToolbarUI();
    });

    test("highlightStop sets display and color", () => {
        toolbar.highlightStop("red");
        expect(mockStopBtn.style.display).toBe("inline-block");
        expect(mockStopBtn.style.color).toBe("red");
    });

    test("resetStop sets display to none and color to white", () => {
        toolbar.resetStop();
        expect(mockStopBtn.style.display).toBe("none");
        expect(mockStopBtn.style.color).toBe("white");
    });

    test("dimThenRestoreStop dims stop button color then restores it", () => {
        jest.useFakeTimers();
        toolbar.dimThenRestoreStop("green");
        expect(mockStopBtn.style.color).toBe("white");

        jest.advanceTimersByTime(500);
        expect(mockStopBtn.style.color).toBe("green");
        jest.useRealTimers();
    });

    test("dimThenRestoreStop clears any existing dim timeout on consecutive calls", () => {
        jest.useFakeTimers();
        toolbar.dimThenRestoreStop("green");
        expect(mockStopBtn.style.color).toBe("white");

        // Call again with a new color before the first one completes
        toolbar.dimThenRestoreStop("blue");

        // Fast forward 500ms
        jest.advanceTimersByTime(500);
        // The color should be blue, not green
        expect(mockStopBtn.style.color).toBe("blue");
        jest.useRealTimers();
    });

    test("dispose cancels any pending dim timeout", () => {
        jest.useFakeTimers();
        toolbar.dimThenRestoreStop("green");
        expect(mockStopBtn.style.color).toBe("white");

        toolbar.dispose();

        jest.advanceTimersByTime(500);
        // Color should NOT be green because the timer was cancelled
        expect(mockStopBtn.style.color).toBe("white");
        jest.useRealTimers();
    });

    test("init method sets beginner/advanced mode styles and calls resetStop", () => {
        const mockActivity = { beginnerMode: true };
        const mockBeginnerModeBtn = createMockElement("beginnerMode");
        const mockAdvancedModeBtn = createMockElement("advancedMode");

        global.document.getElementById = jest.fn(id => {
            if (id === "beginnerMode") return mockBeginnerModeBtn;
            if (id === "advancedMode") return mockAdvancedModeBtn;
            if (id === "stop") return mockStopBtn;
            return createMockElement(id);
        });

        // Initialize $j (mocked jQuery)
        global.$j = jest.fn(() => ({
            tooltip: jest.fn(),
            dropdown: jest.fn(),
            on: jest.fn()
        }));

        global._THIS_IS_MUSIC_BLOCKS_ = true;
        global._ = jest.fn(x => x);

        toolbar.init(mockActivity);

        expect(mockBeginnerModeBtn.style.display).toBe("none");
        expect(mockAdvancedModeBtn.style.display).toBe("block");
        expect(mockStopBtn.style.display).toBe("none"); // resetStop is called
    });
    test("init sets aria-label alongside data-tooltip so toolbar buttons have an accessible name", () => {
        const mockActivity = { beginnerMode: true };
        const mockPlayBtn = createMockElement("play");

        global.document.getElementById = jest.fn(id => {
            if (id === "play") return mockPlayBtn;
            if (id === "stop") return mockStopBtn;
            return createMockElement(id);
        });

        global.$j = jest.fn(() => ({
            tooltip: jest.fn(),
            dropdown: jest.fn(),
            on: jest.fn()
        }));

        global._THIS_IS_MUSIC_BLOCKS_ = true;
        global._ = jest.fn(x => x);

        toolbar.init(mockActivity);

        expect(mockPlayBtn.setAttribute).toHaveBeenCalledWith("data-tooltip", "Play");
        expect(mockPlayBtn.setAttribute).toHaveBeenCalledWith("aria-label", "Play");
    });

    test("renderWrapIcon sets aria-label alongside data-tooltip, and updates both on toggle", () => {
        const mockWrapIcon = createMockElement("wrapTurtle");
        global.document.getElementById = jest.fn(id => {
            if (id === "wrapTurtle") return mockWrapIcon;
            return createMockElement(id);
        });
        global.$j = jest.fn(() => ({ tooltip: jest.fn() }));
        global._ = jest.fn(x => x);
        global.WRAP = false;

        toolbar.activity = { helpfulWheelItems: [], textMsg: jest.fn() };
        toolbar.renderWrapIcon();

        expect(mockWrapIcon.setAttribute).toHaveBeenCalledWith("data-tooltip", "Turtle Wrap Off");
        expect(mockWrapIcon.setAttribute).toHaveBeenCalledWith("aria-label", "Turtle Wrap Off");

        mockWrapIcon.onclick();

        expect(mockWrapIcon.setAttribute).toHaveBeenCalledWith("data-tooltip", "Turtle Wrap On");
        expect(mockWrapIcon.setAttribute).toHaveBeenCalledWith("aria-label", "Turtle Wrap On");
    });

    test("resetStop cancels any pending dimThenRestoreStop timer", () => {
        jest.useFakeTimers();
        toolbar.dimThenRestoreStop("green");
        // dim timer is now queued
        toolbar.resetStop();
        // advance past the 500ms; the stale restore must NOT run
        jest.advanceTimersByTime(500);
        // stop button should remain hidden and white, not restored to green
        expect(mockStopBtn.style.display).toBe("none");
        expect(mockStopBtn.style.color).toBe("white");
        jest.useRealTimers();
    });

    test("renderNewProjectIcon marks the modal container with dialog semantics when shown", () => {
        // A prior test in this file overrides document.getElementById with a
        // mock; restore the real jsdom implementation for this test since we
        // need genuine DOM elements and attributes.
        delete global.document.getElementById;

        document.body.innerHTML =
            '<div id="modal-container" style="display: none;"></div>' +
            '<ul id="newdropdown"></ul>';

        global._ = jest.fn(x => x);

        toolbar.renderNewProjectIcon(jest.fn());

        const modalContainer = document.getElementById("modal-container");
        expect(modalContainer.getAttribute("role")).toBe("dialog");
        expect(modalContainer.getAttribute("aria-modal")).toBe("true");
        expect(modalContainer.getAttribute("aria-label")).toBe("New project confirmation");
        expect(modalContainer.style.display).toBe("flex");
    });
});

describe("FocusCycleManager - dispose", () => {
    beforeEach(() => {
        jest.spyOn(document, "addEventListener").mockImplementation(() => {});
        jest.spyOn(document, "removeEventListener").mockImplementation(() => {});
    });
    test("dispose removes all document-level event listeners", () => {
        const { FocusCycleManager } = require("../toolbar-ui");
        const manager = new FocusCycleManager();
        manager.init();

        const removeCount = global.document.removeEventListener.mock.calls.length;
        manager.dispose();

        const calls = global.document.removeEventListener.mock.calls;
        const newCalls = calls.slice(removeCount);
        const events = newCalls.map(c => c[0]);
        expect(events).toContain("keydown");
        expect(events).toContain("mousedown");
        expect(events).toContain("focusin");
    });
});

describe("ToolbarUI keyboard activation", () => {
    test("activates the button that received focus instead of the first button", () => {
        const toolbarElement = document.createElement("div");
        toolbarElement.id = "toolbars";
        const playButton = document.createElement("a");
        playButton.id = "play";
        const newFileButton = document.createElement("a");
        newFileButton.id = "newFile";
        toolbarElement.append(playButton, newFileButton);
        document.body.appendChild(toolbarElement);

        const auxToolbar = document.createElement("div");
        auxToolbar.id = "aux-toolbar";
        auxToolbar.style.display = "none";
        document.body.appendChild(auxToolbar);

        const elements = {
            "toolbars": toolbarElement,
            "aux-toolbar": auxToolbar,
            "play": playButton,
            "newFile": newFileButton
        };
        document.getElementById = jest.fn(id => elements[id] || null);
        global.docById = id => document.getElementById(id);

        playButton.onclick = jest.fn();
        newFileButton.onclick = jest.fn();

        const toolbar = new ToolbarUI();
        toolbar.setupKeyboardNavigation();
        newFileButton.focus();
        newFileButton.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })
        );

        expect(newFileButton.onclick).toHaveBeenCalled();
        expect(playButton.onclick).not.toHaveBeenCalled();
    });
});
