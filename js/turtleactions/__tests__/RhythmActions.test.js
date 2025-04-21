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

// Import the actual module - no need for complex mocks
const { setupRhythmActions } = require("../RhythmActions");

// Set up globals needed by the implementation
global._ = jest.fn(text => text);
global.Singer = global.Singer || {};
global.TONEBPM =60;
global.MusicBlocks = { isRun: false };
global.Mouse = { getMouseFromTurtle: jest.fn() };
global.last = arr => arr[arr.length - 1];

// Mock for Singer.processNote
global.Singer.processNote = jest.fn();
global.Singer.masterBPM = 60;

describe("RhythmActions", () => {
    let activity, targetTurtle;
    
    beforeEach(() => {
        // Set up standard mocks and environment
        activity = {
            turtles: {
                ithTurtle: jest.fn(),
                getTurtle: jest.fn()
            },
            errorMsg: jest.fn(),
            logo: {
                clearNoteParams: jest.fn(),
                runFromBlockNow: jest.fn(),
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                notation: {
                    notationTuplet: jest.fn(),
                    notationVoices: jest.fn(),
                    notationSwing: jest.fn(),
                    notationRemoveTie: jest.fn(),
                    notationStaging: {0: []}
                },
                pitchBlocks: [],
                drumBlocks: [],
                synth: { setNoteFrequency: jest.fn() }
            },
            blocks: {
                blockList: {
                    42: { name: "note" },
                    43: { name: "newnote" },
                    44: { name: "osctime" }
                }
            },
            stage: { dispatchEvent: jest.fn() }
        };

        targetTurtle = {
            id: 0,
            singer: {
                noteValue: {},
                beatFactor: 1,
                notesPlayed: [0, 1],
                embeddedGraphics: {},
                inNoteBlock: [],
                notePitches: {},
                noteOctaves: {},
                noteCents: {},
                noteHertz: {},
                noteBeat: {},
                noteBeatValues: {},
                oscList: {},
                noteDrums: {},
                dotCount: 0,
                swing: [],
                swingTarget: [],
                swingCarryOver: 0,
                tie: false,
                tieNotePitches: [],
                tieNoteExtras: [],
                tieCarryOver: 0,
                pushedNote: false,
                bpm: [60],
                beatList: [], 
                factorList: [],
                justCounting: [],
                multipleVoices: false,
                lastNotePlayed: null,
                pickup: 0,
                beatsPerMeasure: 4,
                noteValuePerBeat: 1/4,
                currentBeat: 0,
                currentMeasure: 0,
                neighborArgBeat: [],
                neighborArgCurrentBeat: [],
                neighborNoteValue: 1/16,
                inNeighbor: []
            },
            doWait: jest.fn()
        };

        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
        activity.turtles.getTurtle.mockReturnValue(targetTurtle);
        
        setupRhythmActions(activity);
    });

    test("should handle note playback", () => {
        const blk = 42;
        const enqueueCallback = jest.fn();
        
        
        
        targetTurtle.singer.beatList = ["everybeat", 1, "offbeat", 2];
        targetTurtle.singer.factorList = [2, 4];
        
        Singer.RhythmActions.playNote(1/4, "note", 0, blk, enqueueCallback);
        
        expect(targetTurtle.singer.inNoteBlock).toContain(blk);
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
        expect(targetTurtle.singer.noteValue[blk]).toBe(4);
        expect(enqueueCallback).toHaveBeenCalled();
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__everybeat_0__");
    });
    
    test("should handle note playback with various beat patterns", () => {
        const blk = 42;
        const enqueueCallback = jest.fn();
        
        activity.stage.dispatchEvent.mockClear();
        
        targetTurtle.singer.notesPlayed = [4, 1];
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.beatList = [2];
        targetTurtle.singer.factorList = [2];
        
        Singer.RhythmActions.playNote(1/4, "note", 0, blk, enqueueCallback);
        
        expect(enqueueCallback).toHaveBeenCalled();
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__beat_2_0__");
        
        activity.stage.dispatchEvent.mockClear();
        enqueueCallback.mockClear();
        targetTurtle.singer.inNoteBlock = [];
        targetTurtle.singer.notesPlayed = [5, 1];
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.beatList = ["everybeat"];
        
        Singer.RhythmActions.playNote(1/4, "note", 0, blk, enqueueCallback);
        
        expect(enqueueCallback).toHaveBeenCalled();
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__everybeat_0__");
    });
    
    test("should handle note playback with neighbor notes", () => {
        const blk = 42;
        const enqueueCallback = jest.fn();
        
        targetTurtle.singer.inNeighbor = ["something"];
        targetTurtle.singer.neighborNoteValue = 1/16;
        
        Singer.RhythmActions.playNote(1/4, "note", 0, blk, enqueueCallback);
        
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();
        
        expect(targetTurtle.singer.neighborArgBeat.length).toBe(1);
        expect(targetTurtle.singer.neighborArgCurrentBeat.length).toBe(1);
    });
    
    test("should handle note playback with multiple voices", () => {
        const blk1 = 42;
        const blk2 = 43;
        const enqueueCallback = jest.fn();
        
        // First note adds to inNoteBlock
        Singer.RhythmActions.playNote(1/4, "note", 0, blk1, enqueueCallback);
        
        // Second note should trigger multipleVoices
        Singer.RhythmActions.playNote(1/4, "note", 0, blk2, enqueueCallback);
        
        expect(targetTurtle.singer.multipleVoices).toBe(true);
        
        // Trigger the listener to check notation handling
        const listener = activity.logo.setTurtleListener.mock.calls[1][2];
        listener();
        
        expect(activity.logo.notation.notationVoices).toHaveBeenCalledWith(0, 2);
    });
    
    test("should add rest in note block", () => {
        const blk = 42;

        targetTurtle.singer.inNoteBlock.push(blk);
        targetTurtle.singer.notePitches[blk] = [];
        targetTurtle.singer.noteOctaves[blk] = [];
        targetTurtle.singer.noteCents[blk] = [];
        targetTurtle.singer.noteHertz[blk] = [];
        targetTurtle.singer.noteBeatValues[blk] = [];
        
        Singer.RhythmActions.playRest(0);

        expect(targetTurtle.singer.pushedNote).toBe(true);
        expect(targetTurtle.singer.notePitches[blk]).toContain("rest");
        expect(targetTurtle.singer.noteOctaves[blk]).toContain(4);
        expect(targetTurtle.singer.noteCents[blk]).toContain(0);
        expect(targetTurtle.singer.noteHertz[blk]).toContain(0);
        expect(targetTurtle.singer.noteBeatValues[blk]).toContain(1); 
    });
    
    test("should apply rhythmic dots correctly", () => {
        targetTurtle.singer.beatFactor = 1;
        targetTurtle.singer.dotCount = 0;
        
        Singer.RhythmActions.doRhythmicDot(1, 0);
        
        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1/1.5, 10);
    });
    
    test("should handle error cases in rhythmic dots", () => {
        targetTurtle.singer.beatFactor = 1;
        targetTurtle.singer.dotCount = 0;
        
        Singer.RhythmActions.doRhythmicDot(-1, 0, 42);
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            expect.stringContaining("note value of 0"), 
            42
        );
        
        targetTurtle.singer.beatFactor = 1;
        targetTurtle.singer.dotCount = 0;
        
        Singer.RhythmActions.doRhythmicDot(-2, 0);
        
        expect(targetTurtle.singer.dotCount).toBeCloseTo(-0.5, 10);
    });
    
    test("should handle dot restoration through listener", () => {
        targetTurtle.singer.beatFactor = 1;
        targetTurtle.singer.dotCount = 0;
        
        // Apply a dot
        Singer.RhythmActions.doRhythmicDot(2, 0);
        
        // Get the listener that was registered
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        
        // Verify initial state
        expect(targetTurtle.singer.dotCount).toBe(2);
        
        // Call the listener to restore the original state
        listener();
        
        expect(targetTurtle.singer.dotCount).toBe(0);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1, 10);
    });
    
    test("should handle tie creation correctly", () => {
        Singer.RhythmActions.doTie(0, 42);
        
        expect(targetTurtle.singer.tie).toBe(true);
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
    });
    
    test("should handle tie completion through listener", () => {
        // Setup tie state
        Singer.RhythmActions.doTie(0, 42);
        
        // Create tied notes
        targetTurtle.singer.tieCarryOver = 1/4;
        targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.6]];
        targetTurtle.singer.tieNoteExtras = [43, {}, {}, {}, {}];
        
        // Get the listener that was registered
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        
        // Call the listener to complete the tie
        listener();
        
        // Verify the tied note was processed
        expect(Singer.processNote).toHaveBeenCalled();
        expect(targetTurtle.singer.tieNotePitches).toEqual([]);
        expect(targetTurtle.singer.tie).toBe(false);
    });
    
    test("should handle tie with additional carry-over note", () => {
        // Setup initial tie
        Singer.RhythmActions.doTie(0, 42);
        
        // Setup tie with carry-over note and a notation staging
        activity.logo.notation.notationStaging = { 0: ["note1", "note2"] };
        
        // Setup tieCarryOver and tieNoteExtras for second note processing
        const saveBlk = 43;
        targetTurtle.singer.tieCarryOver = 1/4;
        targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.6]]; 
        targetTurtle.singer.tieNoteExtras = [
            saveBlk, 
            { oscType: "sine" }, // oscList
            { value: 1 },        // noteBeat
            [1],                 // noteBeatValues
            ["drum1"]            // noteDrums
        ];
        
        // Add justCounting to test that branch
        targetTurtle.singer.justCounting = [];
        
        // Get the listener
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        
        // Call the listener to complete the tie
        listener();
        
        // Verify the tied note was processed
        expect(Singer.processNote).toHaveBeenCalledWith(
            activity, 
            1/4,  
            false, 
            saveBlk,
            0      
        );
        
        // Check doWait was called to wait for the note
        expect(targetTurtle.doWait).toHaveBeenCalled();
    });
    
    test("should multiply note values", () => {
        targetTurtle.singer.beatFactor = 1;
        
        Singer.RhythmActions.multiplyNoteValue(2, 0);
        
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(0.5, 10);
    });
    
    test("should restore note values through listener", () => {
        targetTurtle.singer.beatFactor = 1;
        
        Singer.RhythmActions.multiplyNoteValue(2, 0);
        
        // Get the listener
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];

        expect(targetTurtle.singer.beatFactor).toBeCloseTo(0.5, 10);
        
        // Call the listener to restore
        listener();
        
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1, 10);
    });
    
    test("should add swing rhythm", () => {
        Singer.RhythmActions.addSwing(8, 4, 0);
        
        expect(targetTurtle.singer.swing[0]).toBeCloseTo(1/8, 10);
        expect(targetTurtle.singer.swingTarget[0]).toBeCloseTo(1/4, 10);
    });
    
    test("should handle swing with suppressOutput", () => {
        targetTurtle.singer.suppressOutput = true;
        
        Singer.RhythmActions.addSwing(8, 4, 0);
        
        expect(activity.logo.notation.notationSwing).toHaveBeenCalled();
        expect(targetTurtle.singer.swing.length).toBe(0);
        expect(targetTurtle.singer.swingTarget.length).toBe(0);
    });
    
    test("should remove swing through listener", () => {
        // Add swing
        Singer.RhythmActions.addSwing(8, 4, 0);
        
        // Get the listener
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        
        // Verify swing was added
        expect(targetTurtle.singer.swing.length).toBe(1);
        expect(targetTurtle.singer.swingTarget.length).toBe(1);
        
        // Call the listener to remove the swing
        listener();
        
        // Swing should be removed
        expect(targetTurtle.singer.swing.length).toBe(0);
        expect(targetTurtle.singer.swingTarget.length).toBe(0);
        expect(targetTurtle.singer.swingCarryOver).toBe(0);
    });
    
    test("should handle swing with suppressOutput in listener", () => {
        // Add swing
        targetTurtle.singer.suppressOutput = false;
        Singer.RhythmActions.addSwing(8, 4, 0);
        
        // Set suppressOutput before calling listener
        targetTurtle.singer.suppressOutput = true;
        
        // Get the listener
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        
        // Call the listener
        listener();
        
        expect(targetTurtle.singer.swing.length).toBe(1);
        expect(targetTurtle.singer.swingTarget.length).toBe(1);
    });
    
    test("should get note value correctly from noteValue", () => {
        // Set up the note value structure correctly
        const blk = 42;
        targetTurtle.singer.inNoteBlock = [blk];
        targetTurtle.singer.noteValue[blk] = 4; 
        
        const result = Singer.RhythmActions.getNoteValue(0);
        
        expect(result).toBeCloseTo(4, 10);
    });
    
    test("should get note value from lastNotePlayed", () => {
        targetTurtle.singer.inNoteBlock = [];
        targetTurtle.singer.lastNotePlayed = ["C4", 1/4];
        
        const result = Singer.RhythmActions.getNoteValue(0);
        
        expect(result).toBeCloseTo(4, 10);
    });
    
    test("should get note value from notePitches when available", () => {
        const blk = 42;
        targetTurtle.singer.inNoteBlock = [blk];
        targetTurtle.singer.noteValue[blk] = null;
        targetTurtle.singer.lastNotePlayed = null;
        
        targetTurtle.singer.notePitches[blk] = ["C4"];
        targetTurtle.singer.noteBeat[blk] = 1/8;
        
        const result = Singer.RhythmActions.getNoteValue(0);
        
        expect(result).toBeCloseTo(8, 10);
    });
    
    test("should return 0 when no note information is available", () => {
        targetTurtle.singer.inNoteBlock = [42];
        targetTurtle.singer.noteValue[42] = null;
        targetTurtle.singer.lastNotePlayed = null;
        targetTurtle.singer.notePitches[42] = [];
        
        const result = Singer.RhythmActions.getNoteValue(0);
        
        expect(result).toBe(0);
    });
    
    test("should handle zero note value", () => {
        const blk = 42;
        targetTurtle.singer.inNoteBlock = [blk];
        targetTurtle.singer.noteValue[blk] = 0;
        
        const result = Singer.RhythmActions.getNoteValue(0);
        
        expect(result).toBe(0);
    });

    test("should handle MusicBlocks.isRun in playNote", () => {
        const blk = undefined;
        const enqueueCallback = jest.fn();
        
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.RhythmActions.playNote(1/4, "note", 0, blk, enqueueCallback);
        
        expect(mockMouse.MB.listeners).toContain("_playnote_0");
        
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should handle MusicBlocks.isRun in doRhythmicDot", () => {
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.RhythmActions.doRhythmicDot(1, 0, undefined);
        
        expect(mockMouse.MB.listeners).toContain("_dot_0");
        
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should handle tie removal from Lilypond list", () => {
        const blk = 42;
        targetTurtle.singer.inNoteBlock = [blk];
        targetTurtle.singer.notePitches[blk] = ["C4", "E4"];
        Singer.RhythmActions.doTie(0, blk);
        
        // Set up tieCarryOver
        targetTurtle.singer.tieCarryOver = 0.25;
        
        // Set up tieNoteExtras with a valid block ID from our mock
        targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.6]];
        targetTurtle.singer.tieNoteExtras = [44, {}, {}, {}, {}];
        
        // Ensure justCounting is empty
        targetTurtle.singer.justCounting = [];
        
        // Get the listener
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        
        listener();
        
        expect(activity.logo.notation.notationRemoveTie).toHaveBeenCalledTimes(2);
    });
    
    test("should handle MusicBlocks.isRun in doTie", () => {
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.RhythmActions.doTie(0, undefined); 
        
        expect(mockMouse.MB.listeners).toContain("_tie_0");
        
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should handle MusicBlocks.isRun in multiplyNoteValue", () => {
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.RhythmActions.multiplyNoteValue(2, 0, undefined);
        
        expect(mockMouse.MB.listeners).toContain("_multiplybeat_0");
        
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should handle MusicBlocks.isRun in addSwing", () => {
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.RhythmActions.addSwing(8, 4, 0, undefined);
        
        expect(mockMouse.MB.listeners).toContain("_swing_0");
        
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should handle null/undefined note values properly", () => {
        const blk = 42;
        
        targetTurtle.singer.inNoteBlock = [blk];
        targetTurtle.singer.noteValue[blk] = null;
        targetTurtle.singer.lastNotePlayed = null;
        targetTurtle.singer.notePitches = {};
        
        let result = Singer.RhythmActions.getNoteValue(0);
        expect(result).toBe(0);
        
        targetTurtle.singer.noteValue[blk] = undefined;
        
        result = Singer.RhythmActions.getNoteValue(0);
        expect(result).toBe(0);
        
        targetTurtle.singer.notePitches[blk] = [];
        
        result = Singer.RhythmActions.getNoteValue(0);
        expect(result).toBe(0);
    });
});