/**
 * @license
 * MusicBlocks
 * Copyright (C) 2026 Music Blocks Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Setup global mocks
global._ = str => str;
global.Notation = jest.fn().mockImplementation(() => ({
    doUpdateNotation: jest.fn()
}));
global.Synth = jest.fn().mockImplementation(() => ({}));
global.Singer = {
    setSynthVolume: jest.fn(),
    setMasterVolume: jest.fn(),
    masterBPM: 90,
    defaultBPMFactor: 1
};
global.instruments = {};
global.instrumentsFilters = {};
global.instrumentsEffects = {};
global.DEFAULTVOICE = "electronic synth";
global.last = arr => arr[arr.length - 1];
global.delayExecution = jest.fn((ms, callback) => callback());

// Mock Tone.js
global.Tone = {
    Transport: {
        state: "stopped",
        scheduleOnce: jest.fn().mockReturnValue(123),
        clear: jest.fn()
    }
};

const { Logo, TURTLESTEP } = require("../logo");

describe("Logo Timing (Tone.Transport)", () => {
    let mockActivity;
    let logo;
    let mockTurtle;

    beforeEach(() => {
        mockTurtle = {
            usingToneTimer: false,
            delayTimeout: null,
            delayParameters: {},
            singer: {
                suppressOutput: false,
                justCounting: []
            },
            doWait: jest.fn()
        };

        mockActivity = {
            blocks: {
                blockList: [],
                findStacks: jest.fn(),
                stackList: [],
                visible: true,
                unhighlight: jest.fn()
            },
            turtles: {
                turtleList: [mockTurtle],
                getTurtleCount: jest.fn(() => 1),
                ithTurtle: jest.fn(() => mockTurtle),
                getTurtle: jest.fn(() => mockTurtle)
            },
            saveLocally: jest.fn()
        };

        logo = new Logo(mockActivity);
        logo.turtleDelay = 500; // Not step mode
        logo.stepQueue = [];

        jest.useFakeTimers();
        global.Tone.Transport.scheduleOnce.mockClear();
        global.Tone.Transport.clear.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("uses setTimeout when Tone.Transport is stopped", () => {
        global.Tone.Transport.state = "stopped";
        logo.runFromBlockNow = jest.fn();
        const spy = jest.spyOn(global, "setTimeout");

        logo.runFromBlock(logo, 0, 10, false, null);

        expect(spy).toHaveBeenCalled();
        expect(global.Tone.Transport.scheduleOnce).not.toHaveBeenCalled();
        expect(mockTurtle.usingToneTimer).toBe(false);
    });

    test("uses Tone.Transport.scheduleOnce when Tone.Transport is started", () => {
        global.Tone.Transport.state = "started";
        logo.runFromBlockNow = jest.fn();
        
        // Mock turtle wait time
        mockTurtle.waitTime = 1000;
        logo.turtleDelay = 500;

        logo.runFromBlock(logo, 0, 10, false, null);

        expect(global.Tone.Transport.scheduleOnce).toHaveBeenCalled();
        // Check delay calculation: (500 + 1000) / 1000 = 1.5s
        expect(global.Tone.Transport.scheduleOnce).toHaveBeenCalledWith(
            expect.any(Function), 
            "+1.5"
        );
        expect(mockTurtle.usingToneTimer).toBe(true);
        expect(mockTurtle.delayTimeout).toBe(123);
    });

    test("clearTurtleRun clears Tone timer if usingToneTimer is true", () => {
        mockTurtle.usingToneTimer = true;
        mockTurtle.delayTimeout = 123;
        mockTurtle.delayParameters = { blk: 10, flow: false, arg: null };
        logo.runFromBlockNow = jest.fn();

        logo.clearTurtleRun(0);

        expect(global.Tone.Transport.clear).toHaveBeenCalledWith(123);
        expect(mockTurtle.delayTimeout).toBeNull();
        expect(logo.runFromBlockNow).toHaveBeenCalled();
    });

    test("clearTurtleRun clears setTimeout if usingToneTimer is false", () => {
        mockTurtle.usingToneTimer = false;
        mockTurtle.delayTimeout = 456;
        mockTurtle.delayParameters = { blk: 10, flow: false, arg: null };
        logo.runFromBlockNow = jest.fn();
        const spy = jest.spyOn(global, "clearTimeout");

        logo.clearTurtleRun(0);

        expect(spy).toHaveBeenCalledWith(456);
        expect(global.Tone.Transport.clear).not.toHaveBeenCalled();
        expect(mockTurtle.delayTimeout).toBeNull();
    });
});
