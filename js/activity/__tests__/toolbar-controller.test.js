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

const { setupToolbarController, ToolbarController } = require("../toolbar-controller.js");

// ---------------------------------------------------------------------------
// Helpers to create mock Activity and dependencies
// ---------------------------------------------------------------------------

function makeMockActivity() {
    return {
        DEFAULTDELAY: 500,
        TURTLESTEP: -1,
        cleanupIdleWatcher: jest.fn(),
        turtles: {
            running: jest.fn().mockReturnValue(false),
            turtleList: []
        },
        logo: {
            turtleDelay: 500,
            _alreadyRunning: false,
            runLogoCommands: jest.fn(),
            step: jest.fn(),
            doStopTurtles: jest.fn(),
            stepQueue: {},
            synth: {
                resume: jest.fn()
            }
        }
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("setupToolbarController", () => {
    test("attaches toolbarController instance to activity", () => {
        const activity = makeMockActivity();
        setupToolbarController(activity);

        expect(activity.toolbarController).toBeInstanceOf(ToolbarController);
        expect(activity.toolbarController.runMode).toBe("normal");
    });
});

describe("ToolbarController.runFast", () => {
    let activity;
    let controller;

    beforeEach(() => {
        activity = makeMockActivity();
        setupToolbarController(activity);
        controller = activity.toolbarController;
    });

    test("sets turtleDelay to 0 and resumes synth", () => {
        controller.runFast(null, 500);

        expect(activity.logo.turtleDelay).toBe(0);
        expect(activity.logo.synth.resume).toHaveBeenCalled();
    });

    test("starts logo commands when turtles are not running", () => {
        activity.turtles.running.mockReturnValue(false);
        const env = { run: true };
        controller.runFast(env, 500);

        expect(activity.logo.runLogoCommands).toHaveBeenCalledWith(null, env);
    });

    test("calls logo.step when turtles are running and delay is not 0", () => {
        activity.turtles.running.mockReturnValue(true);
        controller.runFast(null, 250); // delay is not 0

        expect(activity.logo.step).toHaveBeenCalled();
    });

    test("stops turtles and triggers delayed restart when turtles are running and currentDelay is 0", () => {
        jest.useFakeTimers();
        activity.turtles.running.mockReturnValue(true);
        const env = { run: true };
        controller.runFast(env, 0); // delay is 0

        expect(activity.logo.doStopTurtles).toHaveBeenCalled();
        expect(activity.logo.runLogoCommands).not.toHaveBeenCalled();

        jest.advanceTimersByTime(500);

        expect(activity.logo.runLogoCommands).toHaveBeenCalledWith(null, env);
        jest.useRealTimers();
    });
});

describe("ToolbarController.runSlow", () => {
    let activity;
    let controller;

    beforeEach(() => {
        activity = makeMockActivity();
        setupToolbarController(activity);
        controller = activity.toolbarController;
    });

    test("sets runMode to slow and configures delay to DEFAULTDELAY", () => {
        controller.runSlow();

        expect(controller.runMode).toBe("slow");
        expect(activity.logo.turtleDelay).toBe(500);
        expect(activity.logo.synth.resume).toHaveBeenCalled();
        expect(activity.logo.runLogoCommands).toHaveBeenCalled();
    });

    test("steps logo if turtles are already running", () => {
        activity.turtles.running.mockReturnValue(true);
        controller.runSlow();

        expect(activity.logo.step).toHaveBeenCalled();
        expect(activity.logo.runLogoCommands).not.toHaveBeenCalled();
    });
});

describe("ToolbarController.runStep", () => {
    let activity;
    let controller;

    beforeEach(() => {
        activity = makeMockActivity();
        setupToolbarController(activity);
        controller = activity.toolbarController;
    });

    test("sets runMode to step and handles initial mode switch", () => {
        activity.logo.stepQueue = {}; // count is 0
        activity.logo.turtleDelay = 500; // not step mode

        const result = controller.runStep();

        expect(controller.runMode).toBe("step");
        expect(activity.logo.turtleDelay).toBe(-1);
        expect(activity.logo.runLogoCommands).toHaveBeenCalled();
        expect(activity.logo.step).toHaveBeenCalled();
        expect(result).toBe("started");
    });

    test("just steps when already in step mode with turtles running", () => {
        activity.logo.stepQueue = { turtle0: [1, 2] };
        activity.turtles.running.mockReturnValue(true);
        activity.logo.turtleDelay = -1; // already in step mode

        const result = controller.runStep();

        expect(activity.logo.runLogoCommands).not.toHaveBeenCalled();
        expect(activity.logo.step).toHaveBeenCalled();
        expect(result).toBeNull();
    });

    test("stops turtles and returns stopped if step queue is empty", () => {
        activity.logo.stepQueue = { turtle0: [] };
        activity.logo.turtleDelay = -1; // step mode

        const result = controller.runStep();

        expect(activity.logo.doStopTurtles).toHaveBeenCalled();
        expect(result).toBe("stopped");
    });
});

describe("ToolbarController.hardStop", () => {
    let activity;
    let controller;

    beforeEach(() => {
        activity = makeMockActivity();
        setupToolbarController(activity);
        controller = activity.toolbarController;
    });

    test("stops logo turtles and returns true", () => {
        const result = controller.hardStop(false);

        expect(activity.logo.doStopTurtles).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    test("bypasses stop on blur if _THIS_IS_MUSIC_BLOCKS_ is true", () => {
        global._THIS_IS_MUSIC_BLOCKS_ = true;
        const result = controller.hardStop(true);

        expect(activity.logo.doStopTurtles).not.toHaveBeenCalled();
        expect(result).toBe(false);
        delete global._THIS_IS_MUSIC_BLOCKS_;
    });
});

describe("ToolbarController._clearAllTurtles", () => {
    test("calls doClear on each turtle painter", () => {
        const painter0 = { doClear: jest.fn() };
        const painter1 = { doClear: jest.fn() };
        const activity = makeMockActivity();
        activity.turtles.turtleList = [{ painter: painter0 }, { painter: painter1 }];
        setupToolbarController(activity);
        const controller = activity.toolbarController;

        controller._clearAllTurtles();

        expect(painter0.doClear).toHaveBeenCalledWith(true, true, true);
        expect(painter1.doClear).toHaveBeenCalledWith(true, true, true);
    });

    test("is a no-op when turtleList is empty", () => {
        const activity = makeMockActivity();
        setupToolbarController(activity);
        const controller = activity.toolbarController;

        expect(() => controller._clearAllTurtles()).not.toThrow();
    });
});
