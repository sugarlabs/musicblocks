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

const setupPitchActions = require("../PitchActions");

let activity, targetTurtle;

beforeAll(() => {
    global.Singer = {
        processPitch: jest.fn(),
        addScalarTransposition: jest.fn().mockReturnValue(["C", 4]),
        calculateInvert: jest.fn().mockReturnValue(2)
    };
    
    // Set up music-related globals
    global.NANERRORMSG = "Not a number error";
    global.ACCIDENTALNAMES = ["sharp", "flat"];
    global.ACCIDENTALVALUES = [1, -1];
    global.NOTESFLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
    global.NOTESSHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    global.NOTESTEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    global.MUSICALMODES = {
        major: [2, 2, 1, 2, 2, 2, 1],
        minor: [2, 1, 2, 2, 1, 2, 2]
    };
    global.FLAT = "b";
    global.SHARP = "#";
    global.SOLFNOTES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
    global.FIXEDSOLFEGE = {
        "do": "C", "re": "D", "mi": "E", "fa": "F",
        "sol": "G", "la": "A", "ti": "B"
    };
    global.MusicBlocks = { isRun: false };
    global.Mouse = { getMouseFromTurtle: jest.fn() };
    
    // Set up required global functions
    global._ = jest.fn(msg => msg);
    global.nthDegreeToPitch = jest.fn(() => "C");
    global.pitchToNumber = jest.fn(pitch => {
        if (pitch === "C") return 60;
        if (pitch === "D") return 62;
        if (pitch === "E") return 64;
        return 0;
    });
    global.getStepSizeUp = jest.fn(() => 2);
    global.getStepSizeDown = jest.fn(() => -2);
    global.getNote = jest.fn((pitch, octave) => [pitch, octave]);
    global.calcOctave = jest.fn(() => 4);
    global.frequencyToPitch = jest.fn(() => ["C", 4, 0]);
    global.numberToPitch = jest.fn(() => ["C", 4]);
    global.keySignatureToMode = jest.fn(() => ["C", "major"]);
    global.isCustomTemperament = jest.fn(() => false);
});

beforeEach(() => {
    targetTurtle = {
        singer: {
            justCounting: [],
            pitchNumberOffset: 0,
            currentOctave: 4,
            lastNotePlayed: ["C4", 4],
            previousNotePlayed: ["C4", 4],
            inNoteBlock: [],
            pitchNumberOffset: 0,
            scalarTransposition: 0,
            transposition: 0,
            scalarTranspositionValues: [],
            transpositionValues: [],
            transpositionRatios: [],
            invertList: [],
            inverted: false,
            register: 0,
            keySignature: "C major",
            noteDirection: 0,
            inDefineMode: false,
            defineMode: []
        },
        id: 0
    };

    // Set up the activity
    activity = {
        turtles: {
            ithTurtle: jest.fn().mockReturnValue(targetTurtle),
            getTurtle: jest.fn().mockReturnValue(targetTurtle)
        },
        blocks: {
            blockList: { 1: {}, 42: { name: "pitch" } },
        },
        logo: {
            synth: {
                inTemperament: jest.fn().mockReturnValue("equal"),
                startingPitch: "C4"
            },
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            runningLilypond: false,
            notation: {
                notationMarkup: jest.fn()
            },
            inMatrix: false,
            inMusicKeyboard: false,
            stopTurtle: false
        },
        errorMsg: jest.fn(),
    };

    setupPitchActions(activity);
});

describe("PitchActions tests", () => {
    test("should play a pitch correctly", () => {
        Singer.PitchActions.playPitch("C", 4, 0, 0, 42);
        
        expect(global.Singer.processPitch).toHaveBeenCalledWith(
            activity, "C", 4, 0, 0, 42
        );
    });

    test("should handle step pitch correctly", () => {
        global.Singer.addScalarTransposition.mockReturnValueOnce(["D", 4]);
        
        Singer.PitchActions.stepPitch(1, 0, 42);
        
        expect(global.Singer.addScalarTransposition).toHaveBeenCalledWith(
            activity.logo, 0, expect.any(String), expect.any(Number), 1
        );
        expect(global.Singer.processPitch).toHaveBeenCalled();
    });

    test("should handle error in step pitch", () => {
        Singer.PitchActions.stepPitch("invalid", 0, 42);
        
        expect(activity.errorMsg).toHaveBeenCalledWith(
            global.NANERRORMSG, 42
        );
        expect(activity.logo.stopTurtle).toBe(true);
    });

    test("should play nth modal pitch", () => {
        global.keySignatureToMode.mockReturnValueOnce(["C", "major"]);
        global.nthDegreeToPitch.mockReturnValueOnce("G");
        
        Singer.PitchActions.playNthModalPitch(5, 4, 0, 42);
        
        expect(global.keySignatureToMode).toHaveBeenCalledWith("C major");
        expect(global.nthDegreeToPitch).toHaveBeenCalled();
        expect(global.Singer.processPitch).toHaveBeenCalled();
    });

    test("should play pitch number", () => {
        global.numberToPitch.mockReturnValueOnce(["D", 4]);
        
        Singer.PitchActions.playPitchNumber(5, 0, 42);
        
        expect(global.numberToPitch).toHaveBeenCalled();
        expect(global.Singer.processPitch).toHaveBeenCalledWith(
            activity, "D", 4, 0, 0, 42
        );
    });

    test("should play hertz", () => {
        global.frequencyToPitch.mockReturnValueOnce(["A", 4, 0]);
        
        Singer.PitchActions.playHertz(440, 0, 42);
        
        expect(global.frequencyToPitch).toHaveBeenCalledWith(440);
        expect(global.Singer.processPitch).toHaveBeenCalledWith(
            activity, "A", 4, 0, 0, 42
        );
    });

    test("should set accidental", () => {
        Singer.PitchActions.setAccidental("sharp", 0, 42);
        
        expect(targetTurtle.singer.transposition).toBe(1);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
        
        // Get the listener function and call it
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();
        
        // Check that transposition is back to 0
        expect(targetTurtle.singer.transposition).toBe(0);
    });

    test("should set scalar transposition", () => {
        Singer.PitchActions.setScalarTranspose(2, 0, 42);
        
        expect(targetTurtle.singer.scalarTransposition).toBe(2);
        expect(targetTurtle.singer.scalarTranspositionValues).toContain(2);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
        
        // Get the listener function and call it
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();
        
        // Check that scalar transposition is back to 0
        expect(targetTurtle.singer.scalarTransposition).toBe(0);
    });

    test("should set semitone transposition", () => {
        Singer.PitchActions.setSemitoneTranspose(2, 0, 42);
        
        expect(targetTurtle.singer.transposition).toBe(2);
        expect(targetTurtle.singer.transpositionValues).toContain(2);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
        
        // Get the listener function and call it
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();
        
        // Check that transposition is back to 0
        expect(targetTurtle.singer.transposition).toBe(0);
    });

    test("should handle ratio transposition", () => {
        Singer.PitchActions.setRatioTranspose(1.5, 0, 42);
        
        expect(targetTurtle.singer.transpositionRatios).toContain(1.5);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
        
        // Get the listener function and call it
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();
        
        // Check that ratio is removed
        expect(targetTurtle.singer.transpositionRatios.length).toBe(0);
    });

    test("should set register", () => {
        Singer.PitchActions.setRegister(5, 0);
        expect(targetTurtle.singer.register).toBe(5);
        
        Singer.PitchActions.setRegister(3.7, 0);
        expect(targetTurtle.singer.register).toBe(3);
    });

    test("should handle pitch inversion", () => {
        Singer.PitchActions.invert("C", 4, "even", 0, 42);
        
        expect(targetTurtle.singer.invertList).toContainEqual(["C", 4, "even"]);
        expect(activity.logo.setDispatchBlock).toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
        
        // Get the listener function and call it
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();
        
        // Check that inversion is removed
        expect(targetTurtle.singer.invertList.length).toBe(0);
        expect(targetTurtle.singer.inverted).toBe(false);
    });

    test("should convert number to pitch", () => {
        global.numberToPitch.mockReturnValueOnce(["D", 4]);
        
        const result = Singer.PitchActions.numToPitch(5, "pitch", 0);
        
        expect(global.numberToPitch).toHaveBeenCalled();
        expect(result).toBe("D");
        
        // Test octave output
        global.numberToPitch.mockReturnValueOnce(["G", 5]);
        const octave = Singer.PitchActions.numToPitch(12, "octave", 0);
        expect(octave).toBe(5);
        
        // Test error handling
        expect(() => {
            Singer.PitchActions.numToPitch(null, "pitch", 0);
        }).toThrow("NoArgError");
    });

    test("should set pitch number offset", () => {
        global.calcOctave.mockReturnValueOnce(4);
        global.pitchToNumber.mockReturnValueOnce(60);
        
        Singer.PitchActions.setPitchNumberOffset("C", 4, 0);
        
        expect(global.calcOctave).toHaveBeenCalled();
        expect(global.pitchToNumber).toHaveBeenCalled();
        expect(targetTurtle.singer.pitchNumberOffset).toBe(60);
    });

    test("should calculate delta pitch", () => {
        targetTurtle.singer.previousNotePlayed = ["C4", 4];
        targetTurtle.singer.lastNotePlayed = ["E4", 4];
        
        global.pitchToNumber.mockReturnValueOnce(60)
            .mockReturnValueOnce(64);
        
        const result = Singer.PitchActions.deltaPitch("deltapitch", 0);
        
        expect(global.pitchToNumber).toHaveBeenCalledTimes(2);
        expect(result).toBe(4);
    });
    
    test("should calculate scalar delta pitch", () => {
        targetTurtle.singer.previousNotePlayed = ["C4", 4];
        targetTurtle.singer.lastNotePlayed = ["E4", 4];
        
        global.pitchToNumber.mockReturnValueOnce(60)
            .mockReturnValueOnce(64);
        global.getStepSizeUp.mockReturnValueOnce(2)
            .mockReturnValueOnce(2);
        global.getNote.mockReturnValueOnce(["D", 4])
            .mockReturnValueOnce(["E", 4]);
        
        const result = Singer.PitchActions.deltaPitch("deltascalarpitch", 0);
        
        expect(result).toBe(2);
    });

    test("should get consonant step size", () => {
        const upStepSize = Singer.PitchActions.consonantStepSize("up", 0);
        expect(global.getStepSizeUp).toHaveBeenCalled();
        expect(upStepSize).toBe(2);
        
        const downStepSize = Singer.PitchActions.consonantStepSize("down", 0);
        expect(global.getStepSizeDown).toHaveBeenCalled();
        expect(downStepSize).toBe(-2);
    });
    
    test("should handle MusicBlocks.isRun in setAccidental", () => {
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.PitchActions.setAccidental("sharp", 0, undefined);
        
        expect(mockMouse.MB.listeners).toContain("_accidental_0_undefined");
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should handle MusicBlocks.isRun in setScalarTranspose", () => {
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.PitchActions.setScalarTranspose(2, 0, undefined);
        
        expect(mockMouse.MB.listeners).toContain("_scalar_transposition_0");
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should handle MusicBlocks.isRun in setSemitoneTranspose", () => {
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.PitchActions.setSemitoneTranspose(2, 0, undefined);
        
        expect(mockMouse.MB.listeners).toContain("_transposition_0");
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should handle MusicBlocks.isRun in setRatioTranspose", () => {
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.PitchActions.setRatioTranspose(1.5, 0, undefined);
        
        expect(mockMouse.MB.listeners).toContain("_transposition_ratio_0");
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should handle MusicBlocks.isRun in invert", () => {
        const originalIsRun = MusicBlocks.isRun;
        MusicBlocks.isRun = true;
        
        const mockMouse = { MB: { listeners: [] }};
        Mouse.getMouseFromTurtle.mockReturnValueOnce(mockMouse);
        
        Singer.PitchActions.invert("C", 4, "even", 0, undefined);
        
        expect(mockMouse.MB.listeners).toContain("_invert_0");
        MusicBlocks.isRun = originalIsRun;
    });
    
    test("should floor non-integer values in setRegister", () => {
        // Test with decimal value
        Singer.PitchActions.setRegister(5.7, 0);
        expect(targetTurtle.singer.register).toBe(5);
        
        // Test with negative decimal value
        Singer.PitchActions.setRegister(-2.3, 0);
        expect(targetTurtle.singer.register).toBe(-3);
    });
    
    test("should handle various input types in invert mode parameter", () => {
        // Test with number for even
        Singer.PitchActions.invert("C", 4, 2, 0, 42);
        expect(targetTurtle.singer.invertList[0][2]).toBe("even");
        
        // Test with number for odd
        targetTurtle.singer.invertList = [];
        Singer.PitchActions.invert("C", 4, 3, 0, 42);
        expect(targetTurtle.singer.invertList[0][2]).toBe("odd");
        
        // Test with localized string
        targetTurtle.singer.invertList = [];
        global._.mockImplementation(text => {
            if (text === "even") return "EVEN_LOCALIZED";
            if (text === "odd") return "ODD_LOCALIZED";
            if (text === "scalar") return "SCALAR_LOCALIZED";
            return text;
        });
        
        Singer.PitchActions.invert("C", 4, "EVEN_LOCALIZED", 0, 42);
        expect(targetTurtle.singer.invertList[0][2]).toBe("even");
        
        targetTurtle.singer.invertList = [];
        Singer.PitchActions.invert("C", 4, "ODD_LOCALIZED", 0, 42);
        expect(targetTurtle.singer.invertList[0][2]).toBe("odd");
        
        targetTurtle.singer.invertList = [];
        Singer.PitchActions.invert("C", 4, "SCALAR_LOCALIZED", 0, 42);
        expect(targetTurtle.singer.invertList[0][2]).toBe("scalar");
    });
    
    test("should throw error for null input in numToPitch", () => {
        expect(() => {
            Singer.PitchActions.numToPitch(null, "pitch", 0);
        }).toThrow("NoArgError");
    });
    
    test("should handle safety limit in deltaPitch loop", () => {
        targetTurtle.singer.previousNotePlayed = ["C4", 4];
        targetTurtle.singer.lastNotePlayed = ["C10", 4];
        
        global.pitchToNumber.mockReturnValueOnce(60)
            .mockReturnValueOnce(180);
        
        global.getStepSizeUp.mockImplementation(() => 0.01);
        global.getNote.mockImplementation(() => ["C", 4]);
        
        const result = Singer.PitchActions.deltaPitch("deltascalarpitch", 0);
        
        expect(result).not.toBeUndefined();
    });
    
    test("should handle null lastNotePlayed in consonantStepSize", () => {
        global.getStepSizeUp.mockImplementation(() => 2);
        
        targetTurtle.singer.lastNotePlayed = null;
        
        const upResult = Singer.PitchActions.consonantStepSize("up", 0);
        const downResult = Singer.PitchActions.consonantStepSize("down", 0);
        
        expect(global.getStepSizeUp).toHaveBeenCalledWith("C major", "G");
        expect(global.getStepSizeDown).toHaveBeenCalledWith("C major", "G");
        
        expect(upResult).toBe(2);
        expect(downResult).toBe(-2);
    });
    
    test("should handle frequency in lastNotePlayed for stepPitch", () => {
        // Start with a clean state
        global.frequencyToPitch.mockClear();
        activity.logo.inMatrix = true;
        
        targetTurtle.singer.lastNotePlayed = [440, 1/4];
        
        // Set up mock to return correctly
        global.frequencyToPitch.mockReturnValueOnce(["A", 4, 0]);
        global.Singer.addScalarTransposition.mockReturnValueOnce(["B", 4]);
        
        // Call the method
        Singer.PitchActions.stepPitch(1, 0, 42);
        
        expect(global.frequencyToPitch).toHaveBeenCalledWith(440);
    });
    
    test("should handle stepPitch with justCounting", () => {
        
        
        
        activity.logo.inMatrix = true;
        targetTurtle.singer.justCounting = [true];
        targetTurtle.singer.lastNotePlayed = null;
        
        // Reset previousNotePlayed to make the test consistent
        targetTurtle.singer.previousNotePlayed = null;
        
        // Call stepPitch
        Singer.PitchActions.stepPitch(1, 0, 42);
        
        expect(targetTurtle.singer.previousNotePlayed).toEqual(["G4", 4]);
        expect(targetTurtle.singer.lastNotePlayed).toEqual(["G4", 4]);
    });

    test("should handle key signatures with sharps/flats in playNthModalPitch", () => {
        // Set up mocks for a key signature with a sharp
        global.keySignatureToMode.mockReturnValueOnce(["F#", "major"]);
        global.nthDegreeToPitch.mockReturnValueOnce("F#");
        
        // Call with positive number to test key signature with sharp
        Singer.PitchActions.playNthModalPitch(7, 4, 0, 42);
        
        // Verify correct processing with sharp note
        expect(global.Singer.processPitch).toHaveBeenCalledWith(
            activity, "F#", expect.any(Number), 0, 0, 42
        );
        
        // Set up mocks for a key signature with a flat
        global.keySignatureToMode.mockReturnValueOnce(["Bb", "major"]);
        global.nthDegreeToPitch.mockReturnValueOnce("Bb");
        
        // Call with positive number to test key signature with flat
        Singer.PitchActions.playNthModalPitch(7, 4, 0, 42);
        
        // Verify correct processing with flat note
        expect(global.Singer.processPitch).toHaveBeenCalledWith(
            activity, "Bb", expect.any(Number), 0, 0, 42
        );
    });
    
    test("should handle negative and decimal values in playNthModalPitch", () => {
        // Set up mocks
        global.keySignatureToMode.mockReturnValueOnce(["C", "major"]);
        global.nthDegreeToPitch.mockReturnValueOnce("E");
        
        // Test with negative input (should hit isNegativeArg branch)
        Singer.PitchActions.playNthModalPitch(-3, 4, 0, 42);
        
        // Verify correct processing of negative input
        expect(global.Singer.processPitch).toHaveBeenCalledWith(
            activity, "E", expect.any(Number), 0, 0, 42
        );
        
        // Test with decimal input (should be rounded)
        global.keySignatureToMode.mockReturnValueOnce(["C", "major"]);
        global.nthDegreeToPitch.mockReturnValueOnce("D");
        
        Singer.PitchActions.playNthModalPitch(2.7, 4, 0, 42);
        
        // Verify correct rounding behavior
        expect(global.Singer.processPitch).toHaveBeenCalledWith(
            activity, "D", expect.any(Number), 0, 0, 42
        );
    });

    
    test("should handle defineMode in playPitchNumber", () => {
        // Set up turtle in define mode
        targetTurtle.singer.inDefineMode = true;
        targetTurtle.singer.defineMode = [];
        
        // Clear any previous calls to processPitch
        global.Singer.processPitch.mockClear();
        
        // Call the method
        Singer.PitchActions.playPitchNumber(60, 0, 42);
        
        // Should add to defineMode array but not call processPitch
        expect(targetTurtle.singer.defineMode).toContain(60);
        expect(global.Singer.processPitch).not.toHaveBeenCalled();
        
        // Reset state
        targetTurtle.singer.inDefineMode = false;
    });
    
    test("should handle custom temperament in playPitchNumber", () => {
        // Set up custom temperament with transposition
        global.isCustomTemperament.mockReturnValueOnce(true);
        targetTurtle.singer.scalarTransposition = 2;
        targetTurtle.singer.transposition = 2;
        
        // Mock numberToPitch to return expected values
        global.numberToPitch.mockReturnValueOnce(["C", 4]);
        
        // Call the method
        Singer.PitchActions.playPitchNumber(60, 0, 42);
        
        // Should show error message about equal transpositions
        expect(activity.errorMsg).toHaveBeenCalledWith(
            expect.stringContaining("Scalar transpositions are equal to Semitone transpositions")
        );
        
        // Should still process the pitch
        expect(global.Singer.processPitch).toHaveBeenCalled();
        
        // Reset state
        targetTurtle.singer.scalarTransposition = 0;
        targetTurtle.singer.transposition = 0;
    });

    
    test("should handle invertList in setSemitoneTranspose", () => {
        // Setup with invertList to test sign flipping
        targetTurtle.singer.invertList = [["C", 4, "even"]];
        targetTurtle.singer.transposition = 0;
        
        // Call the method
        Singer.PitchActions.setSemitoneTranspose(2, 0, 42);
        
        // With invertList, the transposition value should be negated
        expect(targetTurtle.singer.transposition).toBe(-2);
        
        // Reset state
        targetTurtle.singer.invertList = [];
        targetTurtle.singer.transposition = 0;
    });
    
    test("should handle alternative accidental inputs in setAccidental", () => {
        // Test with localized string for "sharp"
        global._.mockImplementation(text => {
            if (text === "sharp") return "SHARP_LOCALIZED";
            if (text === "flat") return "FLAT_LOCALIZED";
            return text;
        });
        
        Singer.PitchActions.setAccidental("SHARP_LOCALIZED", 0, 42);
        expect(targetTurtle.singer.transposition).toBe(1);
        
        // Reset
        targetTurtle.singer.transposition = 0;
        
        Singer.PitchActions.setAccidental("FLAT_LOCALIZED", 0, 42);
        expect(targetTurtle.singer.transposition).toBe(-1);
        
        // Reset
        targetTurtle.singer.transposition = 0;
        
        // Test with unrecognized accidental
        Singer.PitchActions.setAccidental("unknown", 0, 42);
        expect(targetTurtle.singer.transposition).toBe(0);
        
        // Reset mock
        global._.mockImplementation(msg => msg);
    });
    
    test("should handle null previousNotePlayed in deltaPitch", () => {
        // Set previousNotePlayed to null
        targetTurtle.singer.previousNotePlayed = null;
        
        // Call deltaPitch
        const result = Singer.PitchActions.deltaPitch("deltapitch", 0);
        
        // Should return 0 when previousNotePlayed is null
        expect(result).toBe(0);
        
        // Reset state
        targetTurtle.singer.previousNotePlayed = ["C4", 4];
    });
    
    test("should handle invert with different mode types", () => {
        // Clear any existing invertList entries
        targetTurtle.singer.invertList = [];
        
        // Test with string mode "scalar"
        Singer.PitchActions.invert("C", 4, "scalar", 0, 42);
        expect(targetTurtle.singer.invertList).toContainEqual(["C", 4, "scalar"]);
        
        // Reset
        targetTurtle.singer.invertList = [];
        
        Singer.PitchActions.invert("C", 4, 2, 0, 42);
        expect(targetTurtle.singer.invertList).toContainEqual(["C", 4, "even"]);
        
        // Reset
        targetTurtle.singer.invertList = [];
        
        Singer.PitchActions.invert("C", 4, "invalid", 0, 42);
        expect(targetTurtle.singer.invertList.length).toBe(0);
    });



    test("should handle error cases in numToPitch", () => {
        expect(() => {
            Singer.PitchActions.numToPitch(null, "pitch", 0);
        }).toThrow("NoArgError");
        
        expect(() => {
            Singer.PitchActions.numToPitch("not a number", "pitch", 0);
        }).toThrow("NoArgError");
        
        global.numberToPitch.mockReturnValueOnce(["D", 4]);
        const result = Singer.PitchActions.numToPitch(5, "pitch", 0);
        expect(result).toBe("D");
    });

    


    test("should handle inverted notes in stepPitch", () => {
        // Setup inverted state
        targetTurtle.singer.invertList = [["C", 4, "even"]];
        targetTurtle.singer.inverted = true;
        
        // Mock the required functions
        global.Singer.calculateInvert.mockReturnValueOnce(2);
        global.getNote.mockReturnValueOnce(["E", 4]);
        global.Singer.addScalarTransposition.mockReturnValueOnce(["F", 4]);
        
        // Call stepPitch
        Singer.PitchActions.stepPitch(1, 0, 42);
        
        // Should call calculateInvert and process the pitch
        expect(global.Singer.calculateInvert).toHaveBeenCalled();
        expect(global.getNote).toHaveBeenCalled();
        expect(global.Singer.processPitch).toHaveBeenCalled();
        
        // Reset state
        targetTurtle.singer.invertList = [];
        targetTurtle.singer.inverted = false;
    });
    
    test("should handle playHertz with running Lilypond", () => {
        // Setup conditions for lilypond notation
        targetTurtle.singer.inNoteBlock = [true];
        activity.logo.runningLilypond = true;
        
        // Call playHertz
        Singer.PitchActions.playHertz(440, 0, 42);
        
        // Should call notation.notationMarkup
        expect(activity.logo.notation.notationMarkup).toHaveBeenCalledWith(0, 440);
        
        // Reset state
        targetTurtle.singer.inNoteBlock = [];
        activity.logo.runningLilypond = false;
    });

    test("should handle complete edge cases in playNthModalPitch", () => {
        global.keySignatureToMode.mockReturnValueOnce(["E", "major"]);
        global.nthDegreeToPitch.mockReturnValueOnce("F#");
        
        Singer.PitchActions.playNthModalPitch(-3.5, 4, 0, 42);
        
        // Verify correct processing occurred
        expect(global.Singer.processPitch).toHaveBeenCalled();
        
        // Test with exactly zero to cover a different path
        global.keySignatureToMode.mockReturnValueOnce(["Bb", "minor"]);
        global.nthDegreeToPitch.mockReturnValueOnce("Bb");
        
        Singer.PitchActions.playNthModalPitch(0, 4, 0, 42);
        
        expect(global.Singer.processPitch).toHaveBeenCalledWith(
            activity, "Bb", expect.any(Number), 0, 0, 42
        );
    });



    test("should handle playHertz with all possible note block conditions", () => {
        // Test with inNoteBlock and runningLilypond both true
        targetTurtle.singer.inNoteBlock = [true];
        activity.logo.runningLilypond = true;
        
        Singer.PitchActions.playHertz(440, 0, 42);
        
        expect(activity.logo.notation.notationMarkup).toHaveBeenCalledWith(0, 440);
        
        // Reset state
        targetTurtle.singer.inNoteBlock = [];
        activity.logo.runningLilypond = false;
    });
    
    test("should handle defineMode case in playPitchNumber completely", () => {
        // Set up conditions to test defineMode
        targetTurtle.singer.inDefineMode = true;
        targetTurtle.singer.defineMode = [];
        
        // Clear previous calls to processPitch
        global.Singer.processPitch.mockClear();
        
        // Call with various inputs to ensure full coverage
        Singer.PitchActions.playPitchNumber(60, 0, 42);
        Singer.PitchActions.playPitchNumber(62, 0, 42);
        
        // Verify nothing processed but values added to defineMode
        expect(global.Singer.processPitch).not.toHaveBeenCalled();
        expect(targetTurtle.singer.defineMode).toContain(60);
        expect(targetTurtle.singer.defineMode).toContain(62);
        
        // Reset state
        targetTurtle.singer.inDefineMode = false;
        targetTurtle.singer.defineMode = [];
    });
});
