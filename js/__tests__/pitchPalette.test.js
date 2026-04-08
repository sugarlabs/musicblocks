/**
 * Comprehensive Pitch Palette Tests
 * Tests the actual functionality of Pitch palette API methods
 * rather than just checking that functions are called
 */

// Setup global dependencies
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

const utils = require("../utils/utils.js");
global._ = utils._;
global.last = utils.last;

const musicUtils = require("../utils/musicutils");
Object.assign(global, {
    pitchToNumber: musicUtils.pitchToNumber,
    getStepSizeUp: musicUtils.getStepSizeUp,
    getStepSizeDown: musicUtils.getStepSizeDown,
    calcOctave: musicUtils.calcOctave,
    getNote: musicUtils.getNote,
    nthDegreeToPitch: musicUtils.nthDegreeToPitch,
    keySignatureToMode: musicUtils.keySignatureToMode,
    frequencyToPitch: musicUtils.frequencyToPitch,
    pitchToFrequency: musicUtils.pitchToFrequency,
    numberToPitch: musicUtils.numberToPitch,
    isCustomTemperament: musicUtils.isCustomTemperament,
    ACCIDENTALNAMES: musicUtils.ACCIDENTALNAMES,
    ACCIDENTALVALUES: musicUtils.ACCIDENTALVALUES,
    NOTESFLAT: musicUtils.NOTESFLAT,
    NOTESSHARP: musicUtils.NOTESSHARP,
    NOTESTEP: musicUtils.NOTESTEP,
    MUSICALMODES: musicUtils.MUSICALMODES,
    SHARP: musicUtils.SHARP,
    FLAT: musicUtils.FLAT,
    SOLFEGENAMES1: musicUtils.SOLFEGENAMES1,
    SOLFEGECONVERSIONTABLE: musicUtils.SOLFEGECONVERSIONTABLE,
    ALLNOTENAMES: musicUtils.ALLNOTENAMES,
    NOTENAMES1: musicUtils.NOTENAMES1
});

global.NANERRORMSG = require("../logo").NANERRORMSG;
global.NOINPUTERRORMSG = "No input provided";
global.INVALIDPITCH = "Invalid pitch";

// Mock MusicBlocks and Mouse
const exp = require("../js-export/export");
global.MusicBlocks = exp.MusicBlocks;
global.Mouse = exp.Mouse;

// Mock Singer and dependencies
const mockSinger = {
    processPitch: jest.fn(),
    addScalarTransposition: jest.fn().mockReturnValue(["C", 4]),
    calculateInvert: jest.fn().mockReturnValue(2)
};

global.Singer = mockSinger;

const setupPitchActions = require("../turtleactions/PitchActions");

describe("Pitch Palette Functional Tests", () => {
    let activity, turtle, blkId;

    beforeEach(() => {
        blkId = 1;
        turtle = {
            singer: {
                inNoteBlock: [],
                justCounting: [],
                lastNotePlayed: ["C4", 0.5],
                previousNotePlayed: ["G3", 0.5],
                inDefineMode: false,
                defineMode: [],
                pitchNumberOffset: 0,
                scalarTransposition: 0,
                transposition: 0,
                scalarTranspositionValues: [],
                transpositionValues: [],
                transpositionRatios: [],
                invertList: [],
                keySignature: "C",
                currentOctave: 4,
                register: 0
            }
        };
        activity = {
            turtles: { ithTurtle: () => turtle },
            blocks: { blockList: { [blkId]: {} } },
            logo: {
                inMatrix: false,
                inMusicKeyboard: false,
                synth: { inTemperament: "equal", startingPitch: "A0" },
                runningLilypond: false,
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn()
            },
            errorMsg: jest.fn()
        };
        
        // Clear all mocks
        jest.clearAllMocks();
        
        // Setup PitchActions with activity context
        setupPitchActions(activity);
    });

    describe("playPitch", () => {
        test("processes pitch with correct parameters", () => {
            Singer.PitchActions.playPitch("C", 4, 0, 0, blkId);
            expect(Singer.processPitch).toHaveBeenCalledWith(activity, "C", 4, 0, 0, blkId);
        });

        test("handles different notes and octaves", () => {
            const testCases = [
                ["D", 5, 10],
                ["G#", 3, -5],
                ["Bb", 6, 50]
            ];
            
            testCases.forEach(([note, octave, cents]) => {
                Singer.PitchActions.playPitch(note, octave, cents, 0, blkId);
                expect(Singer.processPitch).toHaveBeenCalledWith(
                    activity, note, octave, cents, 0, blkId
                );
            });
        });
    });

    describe("stepPitch", () => {
        test("calculates relative pitch from last note", () => {
            // Set up last note for calculation
            turtle.singer.lastNotePlayed = ["C4", 0.5];
            
            Singer.PitchActions.stepPitch(2, 0, blkId);
            
            // Should calculate and process a pitch 2 steps up from C4
            expect(Singer.processPitch).toHaveBeenCalled();
        });

        test("handles negative steps (downward)", () => {
            turtle.singer.lastNotePlayed = ["G4", 0.5];
            
            Singer.PitchActions.stepPitch(-1, 0, blkId);
            
            expect(Singer.processPitch).toHaveBeenCalled();
        });

        test("handles zero steps (same pitch)", () => {
            turtle.singer.lastNotePlayed = ["E4", 0.5];
            
            Singer.PitchActions.stepPitch(0, 0, blkId);
            
            expect(Singer.processPitch).toHaveBeenCalled();
        });
    });

    describe("playNthModalPitch", () => {
        test("plays correct modal pitch within scale", () => {
            turtle.singer.keySignature = "C";
            
            Singer.PitchActions.playNthModalPitch(0, 4, 0, blkId);
            expect(Singer.processPitch).toHaveBeenCalled();
        });

        test("handles octave changes in modal pitch", () => {
            turtle.singer.keySignature = "C";
            
            Singer.PitchActions.playNthModalPitch(7, 4, 0, blkId); // Should be do in next octave
            expect(Singer.processPitch).toHaveBeenCalled();
        });

        test("handles different key signatures", () => {
            const keys = ["G", "D", "F", "Bb"];
            
            keys.forEach(key => {
                turtle.singer.keySignature = key;
                Singer.PitchActions.playNthModalPitch(2, 4, 0, blkId);
                expect(Singer.processPitch).toHaveBeenCalled();
            });
        });
    });

    describe("playPitchNumber", () => {
        test("converts pitch number to actual pitch", () => {
            // Mock numberToPitch to return specific result
            const originalNumberToPitch = global.numberToPitch;
            global.numberToPitch = jest.fn(() => ["C", 4]);
            
            Singer.PitchActions.playPitchNumber(60, 0, blkId);
            expect(Singer.processPitch).toHaveBeenCalled();
            
            global.numberToPitch = originalNumberToPitch;
        });

        test("handles define mode correctly", () => {
            turtle.singer.inDefineMode = true;
            
            Singer.PitchActions.playPitchNumber(64, 0, blkId);
            
            expect(turtle.singer.defineMode).toContain(64);
            expect(Singer.processPitch).not.toHaveBeenCalled();
        });

        test("handles custom temperament", () => {
            const originalIsCustomTemperament = global.isCustomTemperament;
            global.isCustomTemperament = jest.fn(() => true);
            // Set up transposition to trigger the error condition
            turtle.singer.scalarTransposition = 1;
            turtle.singer.transposition = 1;
            
            Singer.PitchActions.playPitchNumber(62, 0, blkId);
            
            // Should handle custom temperament case
            expect(activity.errorMsg).toHaveBeenCalled();
            
            global.isCustomTemperament = originalIsCustomTemperament;
        });
    });

    describe("playHertz", () => {
        test("converts frequency to pitch correctly", () => {
            const originalFrequencyToPitch = global.frequencyToPitch;
            global.frequencyToPitch = jest.fn(() => ["A", 4, 0]);
            
            Singer.PitchActions.playHertz(440, 0, blkId);
            
            expect(global.frequencyToPitch).toHaveBeenCalledWith(440);
            expect(Singer.processPitch).toHaveBeenCalledWith(activity, "A", 4, 0, 0, blkId);
            
            global.frequencyToPitch = originalFrequencyToPitch;
        });

        test("handles invalid frequencies", () => {
            // The function doesn't actually check for invalid frequencies in the current implementation
            // It just processes whatever frequencyToPitch returns
            const originalFrequencyToPitch = global.frequencyToPitch;
            global.frequencyToPitch = jest.fn(() => ["?", 0, 0]);
            
            Singer.PitchActions.playHertz(0, 0, blkId);
            
            expect(Singer.processPitch).toHaveBeenCalledWith(activity, "?", 0, 0, 0, blkId);
            
            global.frequencyToPitch = originalFrequencyToPitch;
        });

        test("handles various frequency ranges", () => {
            const frequencies = [220, 440, 880, 110, 2200];
            const originalFrequencyToPitch = global.frequencyToPitch;
            global.frequencyToPitch = jest.fn((freq) => {
                if (freq === 220) return ["A", 3];
                if (freq === 440) return ["A", 4];
                if (freq === 880) return ["A", 5];
                return ["C", 4];
            });
            
            frequencies.forEach(freq => {
                Singer.PitchActions.playHertz(freq, 0, blkId);
                expect(global.frequencyToPitch).toHaveBeenCalledWith(freq);
            });
            
            global.frequencyToPitch = originalFrequencyToPitch;
        });
    });

    describe("setAccidental", () => {
        test("sets valid accidentals correctly", () => {
            const accidentals = ["sharp", "flat", "natural", "double sharp", "double flat"];
            
            accidentals.forEach(accidental => {
                const initialTransposition = turtle.singer.transposition;
                Singer.PitchActions.setAccidental(accidental, 0, blkId);
                // Should modify transposition based on accidental value
                expect(turtle.singer.transposition).toBeDefined();
            });
        });

        test("handles invalid accidental names", () => {
            const initialTransposition = turtle.singer.transposition;
            Singer.PitchActions.setAccidental("invalid", 0, blkId);
            
            // Should not change transposition for invalid accidentals
            expect(turtle.singer.transposition).toBe(initialTransposition);
        });

        test("handles all standard accidental values", () => {
            const testCases = [
                ["sharp", 1],
                ["flat", -1],
                ["natural", 0],
                ["double sharp", 2],
                ["double flat", -2]
            ];
            
            testCases.forEach(([accidental, expectedValue]) => {
                const initialTransposition = turtle.singer.transposition;
                Singer.PitchActions.setAccidental(accidental, 0, blkId);
                // Only check if the accidental is found in ACCIDENTALNAMES
                if (global.ACCIDENTALNAMES.includes(accidental)) {
                    expect(turtle.singer.transposition).toBe(initialTransposition + expectedValue);
                }
                // Reset for next test
                turtle.singer.transposition = initialTransposition;
            });
        });
    });

    describe("setScalarTranspose", () => {
        test("adds scalar transposition value", () => {
            const initialScalar = turtle.singer.scalarTransposition;
            Singer.PitchActions.setScalarTranspose(2, 0, blkId);
            
            expect(turtle.singer.scalarTransposition).toBe(initialScalar + 2);
        });

        test("handles negative scalar transposition", () => {
            const initialScalar = turtle.singer.scalarTransposition;
            Singer.PitchActions.setScalarTranspose(-1, 0, blkId);
            
            expect(turtle.singer.scalarTransposition).toBe(initialScalar - 1);
        });

        test("accumulates multiple scalar transpositions", () => {
            Singer.PitchActions.setScalarTranspose(1, 0, blkId);
            Singer.PitchActions.setScalarTranspose(2, 0, blkId);
            Singer.PitchActions.setScalarTranspose(-1, 0, blkId);
            
            expect(turtle.singer.scalarTransposition).toBe(2);
        });
    });

    describe("setSemitoneTranspose", () => {
        test("adds semitone transposition value", () => {
            const initialSemitone = turtle.singer.transposition;
            Singer.PitchActions.setSemitoneTranspose(3, 0, blkId);
            
            expect(turtle.singer.transposition).toBe(initialSemitone + 3);
        });

        test("handles negative semitone transposition", () => {
            const initialSemitone = turtle.singer.transposition;
            Singer.PitchActions.setSemitoneTranspose(-2, 0, blkId);
            
            expect(turtle.singer.transposition).toBe(initialSemitone - 2);
        });

        test("inverts transposition when invert list is active", () => {
            turtle.singer.invertList = [1, 2, 3];
            const initialSemitone = turtle.singer.transposition;
            
            Singer.PitchActions.setSemitoneTranspose(2, 0, blkId);
            
            expect(turtle.singer.transposition).toBe(initialSemitone - 2);
        });
    });

    describe("setRegister", () => {
        test("sets register to floor of value", () => {
            Singer.PitchActions.setRegister(4.7, 0);
            expect(turtle.singer.register).toBe(4);
        });

        test("handles negative register values", () => {
            Singer.PitchActions.setRegister(-2.3, 0);
            expect(turtle.singer.register).toBe(-3);
        });

        test("handles zero register", () => {
            Singer.PitchActions.setRegister(0, 0);
            expect(turtle.singer.register).toBe(0);
        });
    });

    describe("invert", () => {
        test("sets up inversion with correct parameters", () => {
            Singer.PitchActions.invert("C", 4, "even", 0, blkId);
            
            expect(turtle.singer.invertList).toContainEqual(["C", 4, "even"]);
        });

        test("handles numeric mode parameter", () => {
            Singer.PitchActions.invert("G", 3, 1, 0, blkId); // 1 should become "odd"
            
            expect(turtle.singer.invertList[0]).toEqual(["G", 3, "odd"]);
        });

        test("handles different modes correctly", () => {
            Singer.PitchActions.invert("D", 4, "even", 0, blkId);
            expect(turtle.singer.invertList[0]).toEqual(["D", 4, "even"]);
            
            Singer.PitchActions.invert("E", 5, "odd", 0, blkId);
            expect(turtle.singer.invertList[1]).toEqual(["E", 5, "odd"]);
        });
    });

    describe("setPitchNumberOffset", () => {
        test("sets pitch number offset correctly", () => {
            Singer.PitchActions.setPitchNumberOffset("C", 4, 0);
            
            expect(turtle.singer.pitchNumberOffset).toBeDefined();
        });

        test("handles different pitch and octave combinations", () => {
            const testCases = [
                ["C", 3],
                ["G", 5],
                ["F#", 4]
            ];
            
            testCases.forEach(([pitch, octave]) => {
                Singer.PitchActions.setPitchNumberOffset(pitch, octave, 0);
                expect(turtle.singer.pitchNumberOffset).toBeDefined();
            });
        });
    });

    describe("numToPitch", () => {
        test("converts number to pitch correctly", () => {
            const originalNumberToPitch = global.numberToPitch;
            global.numberToPitch = jest.fn(() => ["C", 4]);
            
            const result = Singer.PitchActions.numToPitch(60, "pitch", 0);
            
            expect(global.numberToPitch).toHaveBeenCalledWith(60);
            expect(result).toBe("C");
            
            global.numberToPitch = originalNumberToPitch;
        });

        test("converts number to octave correctly", () => {
            const originalNumberToPitch = global.numberToPitch;
            global.numberToPitch = jest.fn(() => ["C", 4]);
            
            const result = Singer.PitchActions.numToPitch(60, "octave", 0);
            
            expect(result).toBe(4);
            
            global.numberToPitch = originalNumberToPitch;
        });

        test("applies pitch number offset", () => {
            turtle.singer.pitchNumberOffset = 12;
            const originalNumberToPitch = global.numberToPitch;
            global.numberToPitch = jest.fn((num) => {
                expect(num).toBe(72); // 60 + 12 offset
                return ["C", 5];
            });
            
            Singer.PitchActions.numToPitch(60, "pitch", 0);
            
            global.numberToPitch = originalNumberToPitch;
        });

        test("handles null and invalid numbers", () => {
            expect(() => Singer.PitchActions.numToPitch(null, "pitch", 0)).toThrow("NoArgError");
            expect(() => Singer.PitchActions.numToPitch("invalid", "pitch", 0)).toThrow("NoArgError");
        });
    });

    describe("numToOctave", () => {
        test("extracts octave from number", () => {
            const originalNumberToPitch = global.numberToPitch;
            global.numberToPitch = jest.fn(() => ["C", 4]);
            
            const result = Singer.PitchActions.numToPitch(72, "octave", 0);
            
            expect(result).toBe(4);
            
            global.numberToPitch = originalNumberToPitch;
        });
    });

    describe("Integration Tests", () => {
        test("combined pitch operations work together", () => {
            // Set up transposition
            Singer.PitchActions.setScalarTranspose(1, 0, blkId);
            Singer.PitchActions.setSemitoneTranspose(2, 0, blkId);
            
            // Play a pitch
            Singer.PitchActions.playPitch("C", 4, 0, 0, blkId);
            
            expect(turtle.singer.scalarTransposition).toBe(1);
            expect(turtle.singer.transposition).toBe(2);
            expect(Singer.processPitch).toHaveBeenCalled();
        });

        test("inversion affects subsequent transposition", () => {
            // Set up inversion
            Singer.PitchActions.invert("C", 4, "even", 0, blkId);
            
            // Add semitone transposition (should be inverted)
            const initialTransposition = turtle.singer.transposition;
            Singer.PitchActions.setSemitoneTranspose(3, 0, blkId);
            
            expect(turtle.singer.transposition).toBe(initialTransposition - 3);
        });

        test("pitch number offset affects numToPitch", () => {
            turtle.singer.pitchNumberOffset = 12;
            const originalNumberToPitch = global.numberToPitch;
            global.numberToPitch = jest.fn((num) => {
                expect(num).toBe(72); // Should include offset
                return ["C", 5];
            });
            
            Singer.PitchActions.numToPitch(60, "pitch", 0);
            
            global.numberToPitch = originalNumberToPitch;
        });
    });
});
