/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const { TextEncoder } = require("util");
global.TextEncoder = TextEncoder;

const setupIntervalsActions = require("../IntervalsActions");

// Helper function to create a properly structured mouse object
function createMockMouse(hasListeners = true) {
    return { 
      MB: { 
        listeners: hasListeners ? [] : undefined 
      } 
    };
}
  
// Set up global objects and mocks
let activity, targetTurtle;

beforeAll(() => {
    // Initialize global Singer object
    global.Singer = global.Singer || {};
    
    // Set up music-related globals
    global.NOINPUTERRORMSG = "Missing or empty input";
    global.MusicBlocks = { isRun: false };
    global.Mouse = { getMouseFromTurtle: jest.fn() };
    
    // Mock musical modes
    global.MUSICALMODES = {
        "major": [2, 2, 1, 2, 2, 2, 1],
        "natural minor": [2, 1, 2, 2, 1, 2, 2],
        "dorian": [2, 1, 2, 2, 2, 1, 2],
        "phrygian": [1, 2, 2, 2, 1, 2, 2],
        "lydian": [2, 2, 2, 1, 2, 2, 1],
        "mixolydian": [2, 2, 1, 2, 2, 1, 2],
        "locrian": [1, 2, 2, 1, 2, 2, 2],
        "jazz minor": [2, 1, 2, 2, 2, 2, 1]
    };
    
    // Mock note names and steps
    global.NOTESFLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    global.NOTESSHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    global.NOTESTEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    global.NOTENAMES = ["C", "D", "E", "F", "G", "A", "B"];
    
    // Initialize ALLNOTESTEP with both flat and sharp notes
    global.ALLNOTESTEP = {};
    for (let i = 0; i < global.NOTESFLAT.length; i++) {
        global.ALLNOTESTEP[global.NOTESFLAT[i]] = i;
    }
    for (let i = 0; i < global.NOTESSHARP.length; i++) {
        global.ALLNOTESTEP[global.NOTESSHARP[i]] = i;
    }
    
    // Mock interval mappings
    global.SEMITONETOINTERVALMAP = {
        0: ["perfect unison", "diminished second"],
        1: ["minor second", "augmented unison"],
        2: ["major second", "diminished third"],
        3: ["minor third", "augmented second"],
        4: ["major third", "diminished fourth"],
        5: ["perfect fourth", "augmented third"],
        6: ["diminished fifth", "augmented fourth"],
        7: ["perfect fifth", "diminished sixth"],
        8: ["minor sixth", "augmented fifth"],
        9: ["major sixth", "diminished seventh"],
        10: ["minor seventh", "augmented sixth"],
        11: ["major seventh", "diminished octave"],
        12: ["perfect octave", "augmented seventh"]
    };
    
    global._ = jest.fn(text => text);
    
    const { GetNotesForInterval: realGetNotesForInterval } =
        require("../../../js/utils/musicutils");
    global.GetNotesForInterval = realGetNotesForInterval;
    jest.spyOn(global, "GetNotesForInterval");
    
    global.getNote = jest.fn((note, octave) => [note, octave, 0]);
    global.getModeLength = jest.fn(keySignature => {
        const mode = keySignature.split(" ")[1];
        return global.MUSICALMODES[mode] ? global.MUSICALMODES[mode].length : 7;
    });
});

beforeEach(() => {
    // Set up the target turtle
    targetTurtle = {
        singer: {
            noteDirection: 0,
            inDefineMode: false,
            defineMode: [],
            keySignature: "C major",
            movable: false,
            semitoneIntervals: [],
            ratioIntervals: [],
            chordIntervals: [],
            intervals: [],
            transposition: 0,
            lastPitch: ["C"],
            firstPitch: ["G"]
        },
        id: 0
    };

    // Set up the activity
    activity = {
        turtles: {
            ithTurtle: jest.fn().mockReturnValue(targetTurtle),
            getTurtle: jest.fn().mockReturnValue(targetTurtle)
        },
        errorMsg: jest.fn(),
        logo: {
            blocks: {
                blockList: {},
                updateBlockText: jest.fn()
            },
            synth: {
                inTemperament: "equal",
                startingPitch: "C4",
                getFrequency: jest.fn().mockReturnValue(440)
            },
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            notation: {
                notationKey: jest.fn()
            },
            temperamentSelected: [],
            statusFields: []
        }
    };

    // Alias for the blocks API
    activity.blocks = activity.logo.blocks;

    // Initialize the actual implementation
    setupIntervalsActions(activity);
});

describe("IntervalsActions", () => {
    describe("Mode and Key Operations", () => {
        const modeCases = [
            ["major", "major"],
            ["natural minor", "natural minor"],
            ["dorian", "dorian"],
            ["minor", "major"],
            ["unknown_mode", "major"]
        ];
        test.each(modeCases)("GetModename(%s) → %s", (input, expected) => {
            expect(Singer.IntervalsActions.GetModename(input)).toBe(expected);
        });

        test("localization handling in GetModename", () => {
            global._ = jest.fn(text => ({
                major: "dúr", minor: "moll", moll: "minor", dorian: "dorian"
            }[text] || text));
            expect(Singer.IntervalsActions.GetModename("dúr")).toBe("major");
            expect(Singer.IntervalsActions.GetModename("moll")).toBe("major");
            global._ = jest.fn(text => text);
        });

        test("setKey and getters", () => {
            Singer.IntervalsActions.setKey("D", "minor", 0);
            expect(targetTurtle.singer.keySignature).toBe("D major");
            expect(activity.logo.notation.notationKey).toHaveBeenCalledWith(0, "D", "major");
            expect(Singer.IntervalsActions.getCurrentKey(0)).toBe("D");
            expect(Singer.IntervalsActions.getCurrentMode(0)).toBe("major");
            expect(Singer.IntervalsActions.getModeLength(0)).toBe(7);
        });

        test("getCurrentMode with invalid inputs and direct cases", () => {
            ["C", "", null, undefined].forEach(sig => {
                targetTurtle.singer.keySignature = sig;
                expect(() => Singer.IntervalsActions.getCurrentMode(0)).not.toThrow();
            });
            targetTurtle.singer.keySignature = "D dorian";
            expect(Singer.IntervalsActions.getCurrentMode(0)).toBe("dorian");
        });
    });

    describe("Interval Calculations", () => {
        test("should calculate all interval types correctly", () => {
            global.GetNotesForInterval.mockReturnValueOnce({
                firstNote: "C", secondNote: "G", octave: 0
            });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(7);
            global.GetNotesForInterval.mockReturnValueOnce({
                firstNote: "C", secondNote: "E", octave: 1
            });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(16);
            global.GetNotesForInterval.mockReturnValueOnce({
                firstNote: "G", secondNote: "C", octave: 0
            });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(7);
            global.GetNotesForInterval.mockReturnValueOnce({
                firstNote: "G", secondNote: "C", octave: -1
            });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(7);
        });

        test("GetIntervalNumber: descending positive octave branch", () => {
            global.GetNotesForInterval.mockReturnValueOnce({
                firstNote: "E", secondNote: "C", octave: 1
            });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(20);
        });

        test("GetIntervalNumber: negative octave flip branch", () => {
            global.GetNotesForInterval.mockReturnValueOnce({
                firstNote: "G", secondNote: "C", octave: -1
            });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(7);
        });

        test("should handle complex intervals with octaves", () => {
            // Set up necessary mocks for larger intervals
            const originalMap = {...global.SEMITONETOINTERVALMAP};
            
            // Add mappings for intervals beyond the octave
            for (let i = 13; i <= 28; i++) {
                global.SEMITONETOINTERVALMAP[i] = [`interval${i}a`, `interval${i}b`];
            }
            
            try {
                // Test intervals with octave displacement
                global.GetNotesForInterval.mockReturnValueOnce({
                    firstNote: "C", 
                    secondNote: "G",
                    octave: 1
                });
                
                const originalGetIntervalNumber = Singer.IntervalsActions.GetIntervalNumber;
                Singer.IntervalsActions.GetIntervalNumber = jest.fn().mockReturnValueOnce(19);
                
                const result = Singer.IntervalsActions.GetCurrentInterval(0);
                expect(result).toBeDefined();
                
                // Test multiple octaves
                global.GetNotesForInterval.mockReturnValueOnce({
                    firstNote: "C",
                    secondNote: "E",
                    octave: 2
                });
                
                Singer.IntervalsActions.GetIntervalNumber = jest.fn().mockReturnValueOnce(28);
                
                // Set up translation for "plus" and "octaves"
                global._ = jest.fn(word => {
                    if (word === "plus") return "plus";
                    if (word === "octave" || word === "octaves") return "octave";
                    if (word === "two") return "two";
                    return word;
                });
                
                const resultLarge = Singer.IntervalsActions.GetCurrentInterval(0);
                expect(resultLarge).toBeDefined();
                
                // Restore mocks
                Singer.IntervalsActions.GetIntervalNumber = originalGetIntervalNumber;
                global._ = jest.fn(text => text);
            } finally {
                // Always restore the original map
                global.SEMITONETOINTERVALMAP = originalMap;
            }
        });

        test("should handle complex octave and letter gap scenarios", () => {
            global.NOTENAMES = ["C", "D", "E", "F", "G", "A", "B"];
            global.GetNotesForInterval.mockReturnValueOnce({
                firstNote: "G",
                secondNote: "C",
                octave: 1
            });
            const originalMap = {...global.SEMITONETOINTERVALMAP};
            for (let i = 13; i <= 24; i++) {
                global.SEMITONETOINTERVALMAP[i] = [`interval${i}a`, `interval${i}b`];
            }
            const result = Singer.IntervalsActions.GetCurrentInterval(0);
            global.SEMITONETOINTERVALMAP = originalMap;
            
            expect(result).toBeDefined();
            global.GetNotesForInterval
              .mockReturnValueOnce({ firstNote: "C", secondNote: "C", octave: 2 })
              .mockReturnValueOnce({ firstNote: "C", secondNote: "C", octave: 2 });
            
            // Mock for consistent translation text
            global._ = jest.fn(text => {
                if (text === "octaves") return "octaves";
                return text;
            });
            
            // Direct call to test plural octave text path
            const pluralResult = Singer.IntervalsActions.GetCurrentInterval(0);
            
            // Reset mock
            global._.mockReset();
            expect(pluralResult).toBeDefined();
            expect(pluralResult).toContain("octaves");
        });
        
    });

    describe("Define Mode", () => {
        test("should create custom modes from pitch numbers", () => {
            // Set up block structure for test
            const blk = 1;
            activity.logo.blocks.blockList = {
                1: { connections: [null, 2, 3] },
                2: { value: 0 },
                3: { connections: [1, 4, 5] },
                4: { value: 4 },
                5: { connections: [3, 6, 7] },
                6: { value: 7 },
                7: { connections: [5, 8, null] },
                8: { value: 12 }
            };
            
            // Call defineMode and execute the listener
            Singer.IntervalsActions.defineMode("custom", 0, blk);
            const listener = activity.logo.setTurtleListener.mock.calls[0][2];
            listener();
            
            expect(global.MUSICALMODES.custom).toEqual([12]);
            
            // Test with invalid inputs
            Singer.IntervalsActions.defineMode(null, 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 1);
            
            // Test with invalid pitch numbers
            activity.logo.blocks.blockList = {
                1: { connections: [null, 2, 3] },
                2: { value: -1 }, 
                3: { connections: [1, 4, 5] },
                4: { value: 13 },
                5: { connections: [3, 6, null] },
                6: { value: 5 }
            };
            
            Singer.IntervalsActions.defineMode("test_range", 0, blk);
            const calls = activity.logo.setTurtleListener.mock.calls;
            const listener2 = calls[calls.length - 1][2];
            listener2();
            
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, blk);
        });
        
        test("should handle MusicBlocks.isRun path in defineMode", () => {
            const originalIsRun = global.MusicBlocks.isRun;
            global.MusicBlocks.isRun = true;
            
            // Test with null mouse (should not throw)
            global.Mouse.getMouseFromTurtle.mockReturnValueOnce(null);
            Singer.IntervalsActions.defineMode("test_mode", 0);
            
            // Test with proper mouse object
            const mockMouse = createMockMouse();
            global.Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
            Singer.IntervalsActions.defineMode("test_direct", 0);
            
            // Verify the listener was added
            expect(mockMouse.MB.listeners).toContain("_definemode_0");
            
            // Restore original
            global.MusicBlocks.isRun = originalIsRun;
        });

        test("should test all branches in GetModename mode lookup", () => {
            // Mock global MUSICALMODES
            const originalMusicalmodes = {...global.MUSICALMODES};
            global.MUSICALMODES = {
                "major": [2, 2, 1, 2, 2, 2, 1],
                "testmode": [2, 1, 2, 2, 2, 1, 2]
            };
            
            global._ = jest.fn(mode => {
                if (mode === "testmode") return "localized_testmode";
                return mode;
            });
            
            expect(Singer.IntervalsActions.GetModename("localized_testmode")).toBe("testmode");
            
            // Restore originals
            global.MUSICALMODES = originalMusicalmodes;
            global._.mockReset();
        });
        
    });

    describe("Interval Setting Methods", () => {
        test("should handle all scalar interval cases", () => {
            // Regular interval
            Singer.IntervalsActions.setScalarInterval(2, 0);
            expect(targetTurtle.singer.intervals[0]).toBe(2);
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
                0, "_interval_0", expect.any(Function)
            );
            
            // Test listener function
            const listener = activity.logo.setTurtleListener.mock.calls[0][2];
            listener();
            expect(targetTurtle.singer.intervals.length).toBe(0);
            
            // Test type validation
            Singer.IntervalsActions.setScalarInterval(null, 0, 42);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 42);
            expect(targetTurtle.singer.intervals[0]).toBe(1);
            
            // Test various value types
            Singer.IntervalsActions.setScalarInterval("string", 0, 42);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 42);
            
            Singer.IntervalsActions.setScalarInterval(true, 0, 42);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 42);
            
            Singer.IntervalsActions.setScalarInterval({}, 0, 42);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 42);
            
            // Test MusicBlocks.isRun path
            const originalIsRun = global.MusicBlocks.isRun;
            global.MusicBlocks.isRun = true;
            
            const mockMouse = createMockMouse();
            global.Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
            
            // Test with proper mock
            Singer.IntervalsActions.setScalarInterval(123, 0);
            expect(mockMouse.MB.listeners).toContain("_interval_0");
            
            global.MusicBlocks.isRun = originalIsRun;
        });
        
        test("should handle all chord interval cases", () => {
            // Regular chord interval
            Singer.IntervalsActions.setChordInterval([3, 1], 0);
            expect(targetTurtle.singer.chordIntervals).toContainEqual([3, 1]);
            
            // Test null input
            Singer.IntervalsActions.setChordInterval(null, 0, 42);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 42);
            expect(targetTurtle.singer.chordIntervals[1]).toEqual([1, 0]); // Default
            
            // Test MusicBlocks.isRun path
            const originalIsRun = global.MusicBlocks.isRun;
            global.MusicBlocks.isRun = true;
            
            const mockMouse = createMockMouse();
            global.Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
            
            Singer.IntervalsActions.setChordInterval([4, 3], 0);
            expect(mockMouse.MB.listeners).toContain("_chord_interval_0");
            
            global.MusicBlocks.isRun = originalIsRun;
        });
        
        test("should handle all semitone interval cases", () => {
            // Regular semitone interval
            Singer.IntervalsActions.setSemitoneInterval(3, 0);
            expect(targetTurtle.singer.semitoneIntervals[0]).toEqual([3, 0]);
            
            // Zero value (should be ignored)
            Singer.IntervalsActions.setSemitoneInterval(0, 0);
            expect(targetTurtle.singer.semitoneIntervals.length).toBe(1);
            
            // Negative interval with noteDirection
            targetTurtle.singer.noteDirection = 1;
            Singer.IntervalsActions.setSemitoneInterval(-3, 0);
            expect(targetTurtle.singer.semitoneIntervals[1]).toEqual([-3, 1]);
            expect(targetTurtle.singer.noteDirection).toBe(0);
            
            // Invalid input
            Singer.IntervalsActions.setSemitoneInterval(null, 0, 42);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 42);
        });
        
        test("should handle all ratio interval cases", () => {
            // Regular ratio interval
            Singer.IntervalsActions.setRatioInterval(1.5, 0);
            expect(targetTurtle.singer.ratioIntervals).toContain(1.5);
            
            // Test MusicBlocks.isRun path
            const originalIsRun = global.MusicBlocks.isRun;
            global.MusicBlocks.isRun = true;
            
            const mockMouse = createMockMouse();
            global.Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
            
            Singer.IntervalsActions.setRatioInterval(1.5, 0);
            expect(mockMouse.MB.listeners).toContain("_ratio_interval_0");
            
            global.MusicBlocks.isRun = originalIsRun;
            
            // Invalid input
            Singer.IntervalsActions.setRatioInterval("invalid", 0, 42);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 42);
        });
    });

    describe("Other Settings", () => {
        test("should handle movable do settings", () => {
            Singer.IntervalsActions.setMovableDo(true, 0);
            expect(targetTurtle.singer.movable).toBe(true);
            
            Singer.IntervalsActions.setMovableDo(false, 0);
            expect(targetTurtle.singer.movable).toBe(false);
        });
        
        test("should handle temperament settings", () => {
            Singer.IntervalsActions.setTemperament("pythagorean", "A", 4);
            expect(activity.logo.synth.inTemperament).toBe("pythagorean");
            expect(activity.logo.synth.startingPitch).toBe("A4");
            expect(activity.logo.temperamentSelected).toContain("pythagorean");
        });

        test("setTemperament does not set changeInTemperament when re‑selecting same", () => {
            activity.logo.temperamentSelected = ["equal"];
            activity.logo.synth.changeInTemperament = false;
            Singer.IntervalsActions.setTemperament("equal", "B", 3);
            expect(activity.logo.synth.changeInTemperament).toBe(false);
        });

        test("setTemperament sets changeInTemperament on new temperament", () => {
            activity.logo.temperamentSelected = ["just"];
            activity.logo.synth.changeInTemperament = false;
            Singer.IntervalsActions.setTemperament("equal", "C", 5);
            expect(activity.logo.synth.changeInTemperament).toBe(true);
        });
    });

    describe("Coverage: dispatch‐block and GetCurrentInterval edge branches", () => {
        const BLK = 9;

        beforeAll(() => {
            global._ = text => text;
        });

        beforeEach(() => {
            activity.blocks.blockList = {
                [BLK]: { /* no name needed */ }
            };
        });

        test("setScalarInterval uses setDispatchBlock when blk provided", () => {
            activity.logo.setDispatchBlock.mockClear();
            Singer.IntervalsActions.setScalarInterval(5, 0, BLK);
            expect(activity.logo.setDispatchBlock)
                .toHaveBeenCalledWith(BLK, 0, "_interval_0");
        });

        test("setChordInterval uses setDispatchBlock when blk provided", () => {
            activity.logo.setDispatchBlock.mockClear();
            Singer.IntervalsActions.setChordInterval([2,1], 0, BLK);
            expect(activity.logo.setDispatchBlock)
                .toHaveBeenCalledWith(BLK, 0, "_chord_interval_0");
        });

        test("setSemitoneInterval uses setDispatchBlock when blk provided", () => {
            activity.logo.setDispatchBlock.mockClear();
            // non-zero triggers the block
            Singer.IntervalsActions.setSemitoneInterval(2, 0, BLK);
            expect(activity.logo.setDispatchBlock)
                .toHaveBeenCalledWith(BLK, 0, "_semitone_interval_0");
        });

        test("setRatioInterval uses setDispatchBlock when blk provided", () => {
            activity.logo.setDispatchBlock.mockClear();
            Singer.IntervalsActions.setRatioInterval(1.2, 0, BLK);
            expect(activity.logo.setDispatchBlock)
                .toHaveBeenCalledWith(BLK, 0, "_ratio_interval_0");
        });

        test("defineMode updates block text when cblk.name==='text'", () => {
            // build a two‐layer blockList with a 'text' block
            activity.blocks.blockList = {
                [BLK]:     { connections: [null, 11, null] },
                11:        { name: "text" },
            };
            activity.logo.blocks.updateBlockText.mockClear();
            Singer.IntervalsActions.defineMode("custom", 0, BLK);
            // grab and run the listener
            const listener = activity.logo.setTurtleListener.mock.calls.pop()[2];
            listener();
            expect(activity.blocks.updateBlockText).toHaveBeenCalledWith(11);
        });

        test("GetCurrentInterval: perfect unison below and above", () => {
            global.GetNotesForInterval.mockReturnValue({
                firstNote: "C", secondNote: "C", octave: -1
            });
            const below = Singer.IntervalsActions.GetCurrentInterval(0);
            expect(below.toLowerCase()).toContain("below");
            global.GetNotesForInterval.mockReturnValue({
                firstNote: "C", secondNote: "C", octave: 2
            });
            const above = Singer.IntervalsActions.GetCurrentInterval(0);
            expect(above.toLowerCase()).toContain("above");
        });
    });

    describe("Raw‐GetNotesForInterval branches (no mocks)", () => {
        beforeAll(() => {
            global._ = t => t;
        });

        test("GetIntervalNumber: negative octave & totalIntervals adjustment", () => {
            global.GetNotesForInterval
              .mockReturnValueOnce({ firstNote: "D", secondNote: "C", octave: -1 });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(2);
        });

        test("GetIntervalNumber: big negative octave resets octave, then loops", () => {
            global.GetNotesForInterval
              .mockReturnValueOnce({ firstNote: "C", secondNote: "C", octave: -4 });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(48);
        });

        test("GetCurrentInterval: totalIntervals>21 branch", () => {
            global.GetNotesForInterval
              .mockReturnValueOnce({ firstNote: "C", secondNote: "C", octave: -4 });
            const s = Singer.IntervalsActions.GetCurrentInterval(0).toLowerCase();
            expect(s).toContain("perfect");
            expect(s).toContain("octaves");
        });
        
        test("GetCurrentInterval: plus branch when totalIntervals >21 & octave≥1", () => {
            global.GetNotesForInterval.mockReturnValueOnce({
                firstNote: "C", secondNote: "D", octave: 2
            });
            const s = Singer.IntervalsActions.GetCurrentInterval(0).toLowerCase();
            expect(s).toContain("plus");
        });
        test("GetCurrentInterval: non‑unison negative letterGap branch", () => {
            global.GetNotesForInterval.mockReturnValueOnce({
                firstNote: "G", secondNote: "E", octave: -1
            });
            const s = Singer.IntervalsActions.GetCurrentInterval(0).toLowerCase();
            expect(s).toContain("below");
        });

        test("GetCurrentInterval: perfect unison below and above", () => {
            global.GetNotesForInterval
              .mockReturnValueOnce({ firstNote: "C", secondNote: "C", octave: -1 });
            expect(Singer.IntervalsActions.GetCurrentInterval(0))
              .toMatch(/perfect octave below/i);

            global.GetNotesForInterval
              .mockReturnValueOnce({ firstNote: "C", secondNote: "C", octave: 2 });
            expect(Singer.IntervalsActions.GetCurrentInterval(0))
              .toMatch(/Two perfect octaves above/i);
        });
    });
});
