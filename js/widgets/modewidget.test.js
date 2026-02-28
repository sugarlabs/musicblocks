/**
 * MusicBlocks v3.6.2
 *
 * @author Ashutosh Kumar
 *
 * @copyright 2026 Ashutosh Kumar
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const ModeWidget = require("./modewidget.js");

// --- 1. Global Mocks ---
global._ = msg => msg;
global.platformColor = {
    selectorBackground: "#FFFFFF",
    selectorBackgroundHOVER: "#EEEEEE",
    modeWheelcolors: ["#FF0000", "#00FF00"],
    orange: "#FFA500"
};
global.DEFAULTVOICE = "piano";
global.last = arr => arr[arr.length - 1];

// Mock utils
global.docById = jest.fn().mockImplementation(id => ({
    style: {},
    innerHTML: "",
    appendChild: jest.fn(),
    rows: [{ cells: [{ innerHTML: "" }] }, { cells: [{ innerHTML: "" }] }],
    insertRow: jest.fn().mockReturnValue({
        insertCell: jest.fn().mockReturnValue({
            style: {},
            innerHTML: ""
        })
    })
}));

global.getNote = jest.fn().mockReturnValue(["C", "4"]);
global.keySignatureToMode = jest.fn().mockReturnValue(["C", "ionian"]);
global.MUSICALMODES = {
    ionian: [2, 2, 1, 2, 2, 2, 1]
};

// Mock slicePath
global.slicePath = jest.fn().mockReturnValue({
    DonutSlice: jest.fn(),
    DonutSliceCustomization: jest.fn().mockReturnValue({})
});

// Mock wheelnav
global.wheelnav = jest.fn().mockImplementation(() => ({
    raphael: {},
    colors: [],
    slicePathFunction: null,
    slicePathCustom: {},
    sliceSelectedPathCustom: {},
    sliceInitPathCustom: {},
    navItems: [],
    createWheel: jest.fn().mockImplementation(function (labels) {
        this.navItems = labels.map(() => ({
            navItem: {
                hide: jest.fn(),
                show: jest.fn()
            },
            navigateFunction: null
        }));
    })
}));

// Mock Window
if (typeof window === "undefined") {
    global.window = {};
}
window.innerWidth = 1024;
window.widgetWindows = {
    windowFor: jest.fn().mockReturnValue({
        clear: jest.fn(),
        show: jest.fn(),
        destroy: jest.fn(),
        updateTitle: jest.fn(),
        addButton: jest.fn().mockImplementation(() => ({
            onclick: () => {}
        })),
        getWidgetBody: jest.fn().mockReturnValue({
            append: jest.fn(),
            getElementsByTagName: jest.fn().mockReturnValue([
                {
                    style: {},
                    setAttribute: jest.fn()
                }
            ])
        }),
        getWidgetFrame: jest.fn().mockReturnValue({ offsetHeight: 500 }),
        getDragElement: jest.fn().mockReturnValue({ offsetHeight: 20 }),
        isMaximized: jest.fn().mockReturnValue(false),
        sendToCenter: jest.fn()
    })
};

// Mock Document
if (typeof document === "undefined") {
    global.document = {};
}
document.createElement = jest.fn().mockImplementation(tag => ({
    style: {},
    innerHTML: "",
    append: jest.fn(),
    insertRow: jest.fn().mockReturnValue({
        insertCell: jest.fn().mockReturnValue({
            style: {},
            innerHTML: ""
        })
    }),
    getElementById: jest.fn().mockReturnValue({ src: "" })
}));
document.getElementById = document.createElement; // For internal usage

describe("ModeWidget", () => {
    let modeWidget;
    let mockActivity;

    beforeEach(() => {
        mockActivity = {
            logo: {
                modeBlock: 1,
                resetSynth: jest.fn(),
                synth: {
                    trigger: jest.fn(),
                    stop: jest.fn()
                }
            },
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: { keySignature: ["C"] }
                })
            },
            textMsg: jest.fn(),
            hideMsgs: jest.fn(),
            errorMsg: jest.fn()
        };

        modeWidget = new ModeWidget(mockActivity);
    });

    test("should initialize correctly", () => {
        expect(global.wheelnav).toHaveBeenCalledTimes(3); // noteWheel, playWheel, etc.
        expect(global.keySignatureToMode).toHaveBeenCalled();
        expect(mockActivity.textMsg).toHaveBeenCalled();
    });

    test("should handle Play/Stop button toggle", () => {
        jest.useFakeTimers();
        const widgetWindow = window.widgetWindows.windowFor();
        const playBtnMock = widgetWindow.addButton.mock.results[0].value;

        // Start
        expect(modeWidget._playing).toBe(false);
        playBtnMock.onclick();
        expect(modeWidget._playing).toBe(true);
        expect(mockActivity.logo.resetSynth).toHaveBeenCalled();

        // Stop
        playBtnMock.onclick();
        expect(modeWidget._playing).toBe(false);
        jest.useRealTimers();
    });

    test("should rotate mode pattern right", () => {
        // Setup: Need true at index 11 so that after 1 right shift (new[0] = old[11]), index 0 is true.
        // This ensures the recursion stops after 1 rotation.
        modeWidget._selectedNotes = [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            true
        ];

        // Wait for rotation animations
        jest.useFakeTimers();
        modeWidget._rotateRight();

        // Fast forward through animations (12 * ROTATESPEED)
        jest.advanceTimersByTime(12 * 150 + 100);

        expect(modeWidget._locked).toBe(false);
        jest.useRealTimers();
    });

    test("should rotate mode pattern left", () => {
        // Setup: Need true at index 1 so that after 1 left shift (new[0] = old[1]), index 0 is true.
        modeWidget._selectedNotes = [
            false,
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false
        ];

        jest.useFakeTimers();
        modeWidget._rotateLeft();
        jest.advanceTimersByTime(12 * 150 + 100);

        expect(modeWidget._locked).toBe(false);
        jest.useRealTimers();
    });

    test("should invert mode pattern", () => {
        modeWidget._selectedNotes = [
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            true,
            false
        ]; // C and B

        jest.useFakeTimers();
        modeWidget._invert(); // Inverts pairs around current axis
        jest.advanceTimersByTime(6 * 150);

        expect(modeWidget._locked).toBe(false);
        jest.useRealTimers();
    });
});
