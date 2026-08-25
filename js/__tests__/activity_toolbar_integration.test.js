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

const { loadActivitySandbox } = require("./helpers/activity-vm-sandbox");

// This test only exercises Activity's own toolbar-delegation methods, so
// setupProjectManager stays mocked (the shared helper's default) rather than
// wiring in the real ProjectManager - that real wiring is covered by
// activity-projectmanager-integration.test.js.
const loadActivityClass = () => loadActivitySandbox().Activity;

describe("Activity Toolbar Integration", () => {
    let Activity;
    let activity;
    let mockElement;

    beforeAll(() => {
        Activity = loadActivityClass();
    });

    beforeEach(() => {
        // Setup clean mocks for each test
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

        // Inject toolbar mock
        activity.toolbar = {
            highlightStop: jest.fn(),
            resetStop: jest.fn(),
            dimThenRestoreStop: jest.fn(),
            stopIconColorWhenPlaying: "blue"
        };

        // Inject toolbarController mock
        activity.toolbarController = {
            runFast: jest.fn(),
            runSlow: jest.fn(),
            runStep: jest.fn(),
            hardStop: jest.fn()
        };

        // Inject turtles and blocks mocks
        activity.turtles = {
            running: jest.fn(() => false),
            isShrunk: jest.fn(() => false)
        };

        activity.blocks = {
            activeBlock: null,
            hideBlocks: jest.fn(),
            showBlocks: jest.fn()
        };

        activity.logo = {
            _alreadyRunning: false,
            doStopTurtles: jest.fn(),
            turtleDelay: 0,
            tempo: {
                isMoving: false,
                pause: jest.fn(),
                resume: jest.fn()
            }
        };

        activity.paste = {
            style: { visibility: "hidden" }
        };

        activity.searchWidget = {
            style: { visibility: "hidden" }
        };

        activity.helpfulSearchWidget = {
            style: { visibility: "hidden" }
        };

        global.window.widgetWindows = {
            isOpen: jest.fn(() => false),
            openWindows: {}
        };

        global.hideDOMLabel = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("_doFastButton", () => {
        test("calls highlightStop and delegates runFast when not already running", () => {
            activity.turtles.running.mockReturnValue(false);
            activity.logo.turtleDelay = 100;

            activity._doFastButton("normal-env");

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("red");
            expect(activity.toolbarController.runFast).toHaveBeenCalledWith("normal-env", 100);
        });

        test("calls dimThenRestoreStop when running and currentDelay is 0", () => {
            activity.turtles.running.mockReturnValue(true);
            activity.logo.turtleDelay = 0;

            activity._doFastButton("normal-env");

            expect(activity.toolbar.dimThenRestoreStop).toHaveBeenCalledWith("red");
            expect(activity.toolbarController.runFast).toHaveBeenCalledWith("normal-env", 0);
        });
    });

    describe("_doStepButton", () => {
        test("calls highlightStop when didRunStart is 'started'", () => {
            activity.toolbarController.runStep.mockReturnValue("started");

            activity._doStepButton();

            expect(activity.toolbar.highlightStop).toHaveBeenCalledWith("blue");
            expect(activity.toolbar.resetStop).not.toHaveBeenCalled();
        });

        test("calls resetStop when didRunStart is 'stopped'", () => {
            activity.toolbarController.runStep.mockReturnValue("stopped");

            activity._doStepButton();

            expect(activity.toolbar.resetStop).toHaveBeenCalled();
            expect(activity.toolbar.highlightStop).not.toHaveBeenCalled();
        });
    });

    describe("_doHardStopButton", () => {
        test("calls resetStop when stopped successfully", () => {
            activity.toolbarController.hardStop.mockReturnValue(true);

            activity._doHardStopButton(false);

            expect(activity.toolbar.resetStop).toHaveBeenCalled();
        });

        test("does not call resetStop when stopped unsuccessfully", () => {
            activity.toolbarController.hardStop.mockReturnValue(false);

            activity._doHardStopButton(false);

            expect(activity.toolbar.resetStop).not.toHaveBeenCalled();
        });
    });

    describe("onStopTurtle", () => {
        test("calls resetStop when execution finishes", () => {
            activity.onStopTurtle();

            expect(activity.toolbar.resetStop).toHaveBeenCalled();
        });
    });
});
