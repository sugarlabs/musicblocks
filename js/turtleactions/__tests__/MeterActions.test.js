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

    it("should set up default strong beats for 4/4 time", () => {
        targetTurtle.singer.beatList = [];
        Singer.MeterActions.setMeter(4, 1/4, 0);
        expect(targetTurtle.singer.beatList).toContain(1);
        expect(targetTurtle.singer.beatList).toContain(3);
        expect(targetTurtle.singer.defaultStrongBeats).toBe(true);
    });

    it("should set up default strong beats for 2/4 time", () => {
        targetTurtle.singer.beatList = [];
        Singer.MeterActions.setMeter(2, 1/4, 0);
        expect(targetTurtle.singer.beatList).toContain(1);
        expect(targetTurtle.singer.defaultStrongBeats).toBe(true);
    });

    it("should set up default strong beats for 3/4 time", () => {
        targetTurtle.singer.beatList = [];
        Singer.MeterActions.setMeter(3, 1/4, 0);
        expect(targetTurtle.singer.beatList).toContain(1);
        expect(targetTurtle.singer.defaultStrongBeats).toBe(true);
    });

    it("should set up default strong beats for 6/8 time", () => {
        targetTurtle.singer.beatList = [];
        Singer.MeterActions.setMeter(6, 1/8, 0);
        expect(targetTurtle.singer.beatList).toContain(1);
        expect(targetTurtle.singer.beatList).toContain(4);
        expect(targetTurtle.singer.defaultStrongBeats).toBe(true);
    });

    it("should handle non-standard time signatures without adding default beats", () => {
        targetTurtle.singer.beatList = [];
        Singer.MeterActions.setMeter(5, 1/4, 0);
        expect(targetTurtle.singer.beatList.length).toBe(0);
        expect(targetTurtle.singer.defaultStrongBeats).toBe(false);
    });

    it("should set the pickup value correctly", () => {
        Singer.MeterActions.setPickup(2, 0);
        expect(targetTurtle.singer.pickup).toBe(2);
        expect(activity.logo.notation.notationPickup).toHaveBeenCalledWith(0, 2);
    });

    it("should handle negative pickup values", () => {
        Singer.MeterActions.setPickup(-2, 0);
        expect(targetTurtle.singer.pickup).toBe(0);
    });

    it("should set BPM within range", () => {
        Singer.MeterActions.setBPM(120, 0.25, 0, 1);
        expect(targetTurtle.singer.bpm).toContain(120);
    });

    it("should handle BPM below range", () => {
        Singer.MeterActions.setBPM(10, 0.25, 0, 1);
        expect(activity.errorMsg).toHaveBeenCalledWith("1/4 beats per minute must be greater than 30", 1);
        expect(targetTurtle.singer.bpm).toContain(30);
    });

    it("should handle BPM above range", () => {
        Singer.MeterActions.setBPM(5000, 0.25, 0, 1);
        expect(activity.errorMsg).toHaveBeenCalledWith("maximum 1/4 beats per minute is 1000", 1);
        expect(targetTurtle.singer.bpm).toContain(1000);
    });

    it("should set the master BPM correctly", () => {
        Singer.MeterActions.setMasterBPM(100, 0.25, 1);
        expect(Singer.masterBPM).toBe(100);
        expect(Singer.defaultBPMFactor).toBe(TONEBPM / 100);
    });

    it("should set the master BPM correctly for exact middle of the range", () => {
        // Clear any previous calls to errorMsg
        activity.errorMsg.mockClear();
        Singer.MeterActions.setMasterBPM(500, 0.25, 1);
        expect(Singer.masterBPM).toBe(500);
        expect(Singer.defaultBPMFactor).toBe(TONEBPM / 500);
        
        // Verify no error message was displayed
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });


    it("should handle master BPM below range", () => {
        Singer.MeterActions.setMasterBPM(10, 0.25, 1);
        expect(activity.errorMsg).toHaveBeenCalledWith("1/4 beats per minute must be greater than 30", 1);
        expect(Singer.masterBPM).toBe(30);
        expect(Singer.defaultBPMFactor).toBe(TONEBPM / 30);
    });

    it("should handle master BPM above range", () => {
        Singer.MeterActions.setMasterBPM(5000, 0.25, 1);
        expect(activity.errorMsg).toHaveBeenCalledWith("maximum 1/4 beats per minute is 1000", 1);
        expect(Singer.masterBPM).toBe(1000);
    });

    // Tests for onEveryBeatDo
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
        // Setup with existing companion turtle
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
        
        // Get and execute the listener function when turtle is running
        const listenerFunc = activity.logo.setTurtleListener.mock.calls[0][2];
        listenerFunc();
        
        expect(companionTurtle.queue.length).toBe(1);
        expect(companionTurtle.parentFlowQueue).toContain(1);
    });

    it("should handle non-running turtle in onEveryBeatDo listener", () => {
        // Setup with non-running companion turtle
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
        
        // Get and execute the listener function
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
        // Setup with companion turtle that has an interval
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
        
        // Should keep special beats but remove default number beats
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
        
        // Extract and call the listener function
        const listenerFunc = activity.logo.setTurtleListener.mock.calls[0][2];
        // Test the decrement functionality
        targetTurtle.singer.drift = 2;
        listenerFunc();
        expect(targetTurtle.singer.drift).toBe(1);
    });

    it("should handle MusicBlocks.isRun condition", () => {
        // Setup environment
        global.MusicBlocks = { isRun: true };
        const mockMouse = { MB: { listeners: [] } };
        global.Mouse = {
            getMouseFromTurtle: jest.fn(() => mockMouse)
        };
        
        Singer.MeterActions.setNoClock(0);
        
        expect(mockMouse.MB.listeners).toContain("_drift_0");
    });

    it("should return 0 when noteValue is null", () => {
        const result = Singer.MeterActions.getNotesPlayed(null, 0);
        expect(result).toBe(0);
    });

    it("should return 0 when noteValue is 0", () => {
        const result = Singer.MeterActions.getNotesPlayed(0, 0);
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

    it("should return master BPM when no turtle-specific BPM is set", () => {
        targetTurtle.singer.bpm = [];
        Singer.masterBPM = 80;
        const result = Singer.MeterActions.getBPM(0);
        expect(result).toBe(80);
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

        it("defaults beatsPerMeasure to 4 when beatCount ≤ 0", () => {
            Singer.MeterActions.setMeter(0, 1/4, 0);
            expect(targetTurtle.singer.beatsPerMeasure).toBe(4);
        });

        it("defaults noteValuePerBeat to 4 when noteValue ≤ 0", () => {
            Singer.MeterActions.setMeter(4, 0, 0);
            expect(targetTurtle.singer.noteValuePerBeat).toBe(4);
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

        it("should enqueue action on every note listener", () => {
            Singer.MeterActions.onEveryNoteDo("testAction", false, null, 0, 1);
            const listener = activity.logo.setTurtleListener.mock.calls
                .find(c => c[1] === "__everybeat_0__")[2];
            listener();
            expect(targetTurtle.parentFlowQueue).toContain(1);
            expect(targetTurtle.queue[0].action).toBe("testAction");
        });

        it("should enqueue action on strong beat listener", () => {
            targetTurtle.id = 0;
            Singer.MeterActions.onStrongBeatDo(2, "testAction", false, null, 0, 3);
            const listener = activity.logo.setTurtleListener.mock.calls
                .find(c => c[1] === "__beat_2_0__")[2];
            listener();
            expect(targetTurtle.parentFlowQueue).toContain(3);
            expect(targetTurtle.queue[0].action).toBe("testAction");
        });

        it("should enqueue action on weak beat listener", () => {
            targetTurtle.id = 0;
            Singer.MeterActions.onWeakBeatDo("testAction", false, null, 0, 4);
            const listener = activity.logo.setTurtleListener.mock.calls
                .find(c => c[1] === "__offbeat_0__")[2];
            listener();
            expect(targetTurtle.parentFlowQueue).toContain(4);
            expect(targetTurtle.queue[0].action).toBe("testAction");
        });
    });
});
