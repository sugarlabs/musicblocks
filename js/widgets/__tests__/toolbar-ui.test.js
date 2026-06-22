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

const { platformColor } = require("../../utils/platformstyle");
global.platformColor = platformColor;

jest.mock("../../utils/platformstyle", () => ({
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
    click: jest.fn(),
    focus: jest.fn()
});

global.document = {
    getElementById: jest.fn(createMockElement),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    body: {
        style: {}
    }
};
global.docById = id => global.document.getElementById(id);

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
});
