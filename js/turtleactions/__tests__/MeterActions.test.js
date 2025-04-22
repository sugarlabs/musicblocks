/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const setupMeterActions = require("../MeterActions");

describe("setupMeterActions", () => {
    let activity;
    let targetTurtle;

    beforeAll(() => {
        global.Singer = {
            MeterActions: {},
            RhythmActions: {
                getNoteValue: jest.fn(() => 1),
            },
        };
        global.TONEBPM = 240;
        global.Queue = jest.fn((action, duration, blk) => ({ action, duration, blk }));
        global.last = jest.fn((array) => array[array.length - 1]);
        global._ = jest.fn((msg) => msg);
        global.rationalToFraction = jest.fn((value) => [value * 4, 4]);
    });

    beforeEach(() => {
        activity = {
            turtles: {
                ithTurtle: jest.fn(),
                turtleList: [],
                addTurtle: jest.fn(),
                getTurtle: jest.fn((id) => targetTurtle),
                getTurtleCount: jest.fn(() => 1),
            },
            blocks: {
                blockList: { 1: {} },
            },
            logo: {
                actions: { "testAction": "testAction" },
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                initTurtle: jest.fn(),
                prepSynths: jest.fn(),
                runFromBlockNow: jest.fn(),
                notation: {
                    notationMeter: jest.fn(),
                    notationPickup: jest.fn(),
                },
            },
            errorMsg: jest.fn(),
            stage: {
                dispatchEvent: jest.fn(),
            },
        };

        targetTurtle = {
            id: 0,
            singer: {
                beatsPerMeasure: 0,
                noteValuePerBeat: 0,
                beatList: [],
                factorList: [],
                defaultStrongBeats: false,
                bpm: [],
                notesPlayed: [0, 1],
                pickup: 0,
                drift: 0,
            },
            queue: [],
            parentFlowQueue: [],
            unhighlightQueue: [],
            parameterQueue: [],
        };

        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
        setupMeterActions(activity);
    });

    it("should set the meter correctly", () => {
        Singer.MeterActions.setMeter(4, 4, 0);
        expect(targetTurtle.singer.beatsPerMeasure).toBe(4);
        expect(targetTurtle.singer.noteValuePerBeat).toBe(1 / 4);
        expect(activity.logo.notation.notationMeter).toHaveBeenCalledWith(0, 4, 1 / 4);
    });

    describe("default strong beats for various time signatures", () => {
        test.each([
            [4, 1/4, [1, 3]],
            [2, 1/4, [1]],
            [3, 1/4, [1]],
            [6, 1/8, [1, 4]],
        ])("should set default strong beats for %i/%f time", (beats, noteValue, expectedBeats) => {
            targetTurtle.singer.beatList = [];
            Singer.MeterActions.setMeter(beats, noteValue, 0);
            expectedBeats.forEach(b => expect(targetTurtle.singer.beatList).toContain(b));
            expect(targetTurtle.singer.defaultStrongBeats).toBe(true);
        });
    });

    it("should handle non-standard time signatures without adding default beats", () => {
        targetTurtle.singer.beatList = [];
        Singer.MeterActions.setMeter(5, 1/4, 0);
        expect(targetTurtle.singer.beatList.length).toBe(0);
        expect(targetTurtle.singer.defaultStrongBeats).toBe(false);
    });

    describe("setPickup", () => {
        test.each([
            [2, 0, 2, true],
            [-2, 0, 0, false]
        ])("setPickup(%i, %i) should result in pickup %i", (pickup, blk, expected, valid) => {
            Singer.MeterActions.setPickup(pickup, blk);
            expect(targetTurtle.singer.pickup).toBe(expected);
            if (valid) {
                expect(activity.logo.notation.notationPickup).toHaveBeenCalledWith(blk, pickup);
            }
        });
    });

    describe("BPM settings", () => {
        test.each([
            [120, 0.25, [], 120, undefined],
            [10,  0.25, ["1/4 beats per minute must be greater than 30"], 30, 1],
            [5000,0.25, ["maximum 1/4 beats per minute is 1000"], 1000, 1],
        ])(
            "setBPM(%i) should handle %s range", (bpm, factor, errors, expected, errBlk) => {
            activity.errorMsg.mockClear();
            Singer.MeterActions.setBPM(bpm, factor, 0, errBlk);
            if (errors.length) {
                errors.forEach(msg => expect(activity.errorMsg).toHaveBeenCalledWith(msg, errBlk));
            }
            expect(targetTurtle.singer.bpm).toContain(expected);
        });
    });

    describe("master BPM settings", () => {
        test.each([
            [100, [], 100],
            [500, [], 500],
            [10,  ["1/4 beats per minute must be greater than 30"], 30],
            [5000,["maximum 1/4 beats per minute is 1000"], 1000],
        ])(
            "setMasterBPM(%i) should result in masterBPM %i", (bpm, errors, expected) => {
            activity.errorMsg.mockClear();
            Singer.MeterActions.setMasterBPM(bpm, 0.25, 1);
            if (errors.length) {
                errors.forEach(msg => expect(activity.errorMsg).toHaveBeenCalledWith(msg, 1));
            }
            expect(Singer.masterBPM).toBe(expected);
            if (!errors.length) expect(Singer.defaultBPMFactor).toBe(TONEBPM / expected);
        });
    });

    it("should set a listener for every beat", () => {
        activity.turtles.turtleList = [{ companionTurtle: null }];
        activity.turtles.addTurtle = jest.fn();
        activity.logo.prepSynths = jest.fn();
        targetTurtle.id = 0;

        Singer.MeterActions.onEveryBeatDo("testAction", false, null, 0, 1);

        expect(activity.turtles.addTurtle).toHaveBeenCalled();
        expect(activity.logo.prepSynths).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            1,
            "__everybeat_1__",
            expect.any(Function)
        );
    });

    it("should handle running turtle in onEveryBeatDo listener", () => {
        targetTurtle.id = 0;
        targetTurtle.companionTurtle = 1;
        
        const companionTurtle = {
            id: 1,
            running: true,
            singer: { bpm: [] },
            queue: [],
            parentFlowQueue: [],
            unhighlightQueue: [],
            parameterQueue: []
        };
        
        activity.turtles.ithTurtle.mockImplementation((id) => {
            return id === 0 ? targetTurtle : companionTurtle;
        });
        
        global.setInterval = jest.fn(() => 12345);
        
        Singer.MeterActions.onEveryBeatDo("testAction", false, null, 0, 1);

        const listenerFunc = activity.logo.setTurtleListener.mock.calls[0][2];
        listenerFunc();
        
        expect(companionTurtle.queue.length).toBe(1);
        expect(companionTurtle.parentFlowQueue).toContain(1);
    });

    it("should handle non-running turtle in onEveryBeatDo listener", () => {
        targetTurtle.id = 0;
        targetTurtle.companionTurtle = 1;
        
        const companionTurtle = {
            id: 1,
            running: false,
            singer: { bpm: [] },
            queue: [],
            parentFlowQueue: [],
            unhighlightQueue: [],
            parameterQueue: []
        };
        
        activity.turtles.ithTurtle.mockImplementation((id) => {
            return id === 0 ? targetTurtle : companionTurtle;
        });
        
        global.setInterval = jest.fn(() => 12345);
        
        Singer.MeterActions.onEveryBeatDo("testAction", false, null, 0, 1);

        const listenerFunc = activity.logo.setTurtleListener.mock.calls[0][2];
        listenerFunc();
        
        expect(activity.logo.runFromBlockNow).toHaveBeenCalledWith(
            activity.logo,
            1,
            "testAction",
            false,
            null
        );
    });

    it("should clear existing interval when setting up a new one", () => {
        targetTurtle.companionTurtle = 1;
        
        const companionTurtle = {
            id: 1,
            interval: 12345,
            singer: { bpm: [] },
            queue: [],
            parentFlowQueue: [],
            unhighlightQueue: [],
            parameterQueue: []
        };
        
        activity.turtles.ithTurtle.mockImplementation((id) => {
            return id === 0 ? targetTurtle : companionTurtle;
        });
        
        global.clearInterval = jest.fn();
        global.setInterval = jest.fn(() => 54321);
        
        Singer.MeterActions.onEveryBeatDo("testAction", false, null, 0, 1);
        
        expect(clearInterval).toHaveBeenCalledWith(12345);
        expect(setInterval).toHaveBeenCalled();
    });

    it("should set a listener for every note", () => {
        Singer.MeterActions.onEveryNoteDo("testAction", false, null, 0, 1);
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
        expect(targetTurtle.singer.beatList).toContain("everybeat");
    });

    it("should setup listener for strong beat", () => {
        targetTurtle.id = 0;
        targetTurtle.singer.beatsPerMeasure = 4;
        Singer.MeterActions.onStrongBeatDo(1, "testAction", false, null, 0, 1);
        
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            0, "__beat_1_0__", expect.any(Function)
        );
        expect(targetTurtle.singer.beatList).toContain(1);
    });

    it("should clear default strong beats when adding custom strong beat", () => {
        targetTurtle.singer.defaultStrongBeats = true;
        targetTurtle.singer.beatList = [1, 3, 5, "everybeat", "offbeat"];
        targetTurtle.singer.beatsPerMeasure = 6;
        
        Singer.MeterActions.onStrongBeatDo(2, "testAction", false, null, 0, 1);


        expect(targetTurtle.singer.beatList).not.toContain(1);
        expect(targetTurtle.singer.beatList).not.toContain(3);
        expect(targetTurtle.singer.beatList).not.toContain(5);
        expect(targetTurtle.singer.beatList).toContain("everybeat");
        expect(targetTurtle.singer.beatList).toContain("offbeat");
        expect(targetTurtle.singer.beatList).toContain(2);
        expect(targetTurtle.singer.defaultStrongBeats).toBe(false);
    });

    it("should handle beat greater than beatsPerMeasure", () => {
        targetTurtle.singer.beatsPerMeasure = 4;
        targetTurtle.singer.factorList = [];
        
        Singer.MeterActions.onStrongBeatDo(5, "testAction", false, null, 0, 1);
        
        expect(targetTurtle.singer.factorList).toContain(5);
        expect(targetTurtle.singer.beatList).not.toContain(5);
    });

    it("should set up listener for weak beat", () => {
        targetTurtle.id = 0;
        Singer.MeterActions.onWeakBeatDo("testAction", false, null, 0, 1);
        
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            0, "__offbeat_0__", expect.any(Function)
        );
        expect(targetTurtle.singer.beatList).toContain("offbeat");
    });

    it("should increment drift counter and set up listener", () => {
        targetTurtle.singer.drift = 0;
        global.clearInterval = jest.fn();
        
        Singer.MeterActions.setNoClock(0, 1);
        
        expect(targetTurtle.singer.drift).toBe(1);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_drift_0");
        const listenerFunc = activity.logo.setTurtleListener.mock.calls[0][2];
        targetTurtle.singer.drift = 2;
        listenerFunc();
        expect(targetTurtle.singer.drift).toBe(1);
    });

    it("should handle MusicBlocks.isRun condition", () => {
        global.MusicBlocks = { isRun: true };
        const mockMouse = { MB: { listeners: [] } };
        global.Mouse = {
            getMouseFromTurtle: jest.fn(() => mockMouse)
        };
        
        Singer.MeterActions.setNoClock(0);
        
        expect(mockMouse.MB.listeners).toContain("_drift_0");
    });

    test.each([
        [null],
        [0]
    ])('should return 0 when noteValue is %p', (noteValue) => {
        const result = Singer.MeterActions.getNotesPlayed(noteValue, 0);
        expect(result).toBe(0);
    });

    it("should calculate notes played correctly", () => {
        targetTurtle.singer.notesPlayed = [12, 3];
        const result = Singer.MeterActions.getNotesPlayed(2, 0);
        expect(result).toBe(2);
    });

    it("should calculate whole notes played correctly", () => {
        targetTurtle.singer.notesPlayed = [4, 1];
        const wholeNotes = Singer.MeterActions.getWholeNotesPlayed(0);
        expect(wholeNotes).toBe(4);
    });

    it("should return 0 when notes played is less than pickup", () => {
        targetTurtle.singer.notesPlayed = [1, 1];
        targetTurtle.singer.pickup = 2;
        const result = Singer.MeterActions.getBeatCount(0);
        expect(result).toBe(0);
    });

    it("should calculate beat count correctly", () => {
        targetTurtle.singer.notesPlayed = [5, 1];
        targetTurtle.singer.pickup = 1;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;
        
        const result = Singer.MeterActions.getBeatCount(0);
        expect(result).toBe(1);
    });

    it("should return 0 for measure count when notes played is less than pickup", () => {
        targetTurtle.singer.notesPlayed = [1, 1];
        targetTurtle.singer.pickup = 2;
        const result = Singer.MeterActions.getMeasureCount(0);
        expect(result).toBe(0);
    });

    it("should calculate measure count correctly", () => {
        targetTurtle.singer.notesPlayed = [9, 1]; 
        targetTurtle.singer.pickup = 1;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;
        
        const result = Singer.MeterActions.getMeasureCount(0);
        expect(result).toBe(3);
    });

    test.each([
        [[], 80, 80],
        [[80, 120], undefined, 120]
    ])('getBPM with singer.bpm %p and masterBPM %p returns %p', (bpmArray, _, expected) => {
        targetTurtle.singer.bpm = bpmArray;
        Singer.masterBPM = 80;
        const result = Singer.MeterActions.getBPM(0);
        expect(result).toBe(expected);
    });


    it("should return the correct beat factor", () => {
        targetTurtle.singer.noteValuePerBeat = 0.25;
        const factor = Singer.MeterActions.getBeatFactor(0);
        expect(factor).toBe(0.25);
    });

    it("should return the correct meter format", () => {
        targetTurtle.singer.beatsPerMeasure = 4;
        targetTurtle.singer.noteValuePerBeat = 1;
        
        const meter = Singer.MeterActions.getCurrentMeter(0);
        expect(meter).toBe("4:1");
    });
    
    describe("invalid inputs and dispatch behaviors", () => {
        beforeEach(() => {
            targetTurtle.singer.beatList = [];
            activity.logo.setDispatchBlock.mockClear();
            activity.stage.dispatchEvent.mockClear();
            global.MusicBlocks = { isRun: false };
            delete activity.turtles.ithTurtle(0).companionTurtle;
        });

        test.each([
            [0, 1/4, 'beatsPerMeasure', 4],
            [4, 0, 'noteValuePerBeat', 4]
        ])('setMeter(%p, %p) defaults %s to %i', (beats, noteValue, prop, expected) => {
            Singer.MeterActions.setMeter(beats, noteValue, 0);
            expect(targetTurtle.singer[prop]).toBe(expected);
        });

        it("immediately dispatches the beat event once", () => {
            Singer.MeterActions.onEveryBeatDo("testAction", false, null, 0, 1);
            const turbo = activity.turtles.getTurtle(0).companionTurtle;
            const eventName = `__everybeat_${turbo}__`;
            expect(activity.stage.dispatchEvent).toHaveBeenCalledWith(eventName);
        });

        it("handles setNoClock without blk and isRun=false", () => {
            Singer.MeterActions.setNoClock(0);
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
                0, "_drift_0", expect.any(Function)
            );
        });
    });
    
    describe("listener invocation", () => {
        beforeEach(() => {
            targetTurtle.queue = [];
            targetTurtle.parentFlowQueue = [];
        });

        test.each([
            ["every note", "onEveryNoteDo", ["testAction", false, null, 0, 1], "__everybeat_0__", 1],
            ["strong beat", "onStrongBeatDo", [2, "testAction", false, null, 0, 3], "__beat_2_0__", 3],
            ["weak beat", "onWeakBeatDo", ["testAction", false, null, 0, 4], "__offbeat_0__", 4],
        ])("should enqueue action on %s listener", (_desc, method, args, eventName, blk) => {
            Singer.MeterActions[method](...args);
            const listener = activity.logo.setTurtleListener.mock.calls
                .find(c => c[1] === eventName)[2];
            listener();
            expect(targetTurtle.parentFlowQueue).toContain(blk);
            expect(targetTurtle.queue[0].action).toBe("testAction");
        });
    });

    it("should return last BPM value when turtle-specific BPM is set", () => {
        targetTurtle.singer.bpm = [80, 120];
        const result = Singer.MeterActions.getBPM(0);
        expect(last).toHaveBeenCalledWith([80, 120]);
        expect(result).toBe(120);
    });

    it("should dispatch event on every‑beat interval callback", () => {
        let intervalCallback;
        global.setInterval = jest.fn((cb, ms) => {
            intervalCallback = cb;
            return 555;
        });
        activity.stage.dispatchEvent.mockClear();
        targetTurtle.id = 0;
        delete activity.turtles.getTurtle(0).companionTurtle;
        Singer.MeterActions.onEveryBeatDo("testAction", false, null, 0, 1);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledTimes(1);
        expect(setInterval).toHaveBeenCalled();
        activity.stage.dispatchEvent.mockClear();
        intervalCallback();
        const turbo = activity.turtles.getTurtle(0).companionTurtle;
        const expectedEvent = `__everybeat_${turbo}__`;
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith(expectedEvent);
    });

    it("should use turtle-specific BPM for interval timer", () => {
        let intervalMs;
        global.setInterval = jest.fn((cb, ms) => { intervalMs = ms; return 999; });
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.bpm = [30, 120];
        Singer.masterBPM = 60;
        Singer.MeterActions.onEveryBeatDo("testAction", false, null, 0, 1);
        expect(last).toHaveBeenCalledWith([30, 120]);
        expect(intervalMs).toBe(2000);
    });
    
    it("should set listener when Mouse.getMouseFromTurtle returns null", () => {
        global.MusicBlocks = { isRun: true };
        global.Mouse.getMouseFromTurtle = jest.fn(() => null);
        Singer.MeterActions.setNoClock(0);
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
            0, "_drift_0", expect.any(Function)
        );
    });
});