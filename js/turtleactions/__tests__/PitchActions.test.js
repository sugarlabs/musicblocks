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

global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

const utils = require("../../utils/utils.js");
global._ = utils._;
global.last = utils.last;

const musicUtils = require("../../utils/musicutils");
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
    FLAT: musicUtils.FLAT
});

global.NANERRORMSG = require("../../logo").NANERRORMSG;

const exp = require("../../../js/js-export/export");
global.MusicBlocks = exp.MusicBlocks;
global.Mouse = exp.Mouse;

global.Singer = {
    processPitch: jest.fn(),
    addScalarTransposition: jest.fn().mockReturnValue(["C", 4]),
    calculateInvert: jest.fn().mockReturnValue(2)
};

const setupPitchActions = require("../PitchActions");

describe("Tests for Singer.PitchActions setup", () => {
    let activity, turtle, blkId;

    beforeEach(() => {
        blkId = 1;
        turtle = {
            singer: {
                inNoteBlock: [],
                justCounting: [],
                lastNotePlayed: null,
                previousNotePlayed: null,
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
                currentOctave: 4
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
                setDispatchBlock(name, t, l) {
                    /* record listener */
                },
                setTurtleListener() {
                    /* record cleanup */
                },
                stopTurtle: false,
                notation: { notationMarkup() {} }
            },
            errorMsg() {
                /* record error */
            }
        };
        setupPitchActions(activity);
        Singer.processPitch.mockImplementation(() => {});
    });

    test("playPitch → always calls processPitch", () => {
        const spy = jest.spyOn(Singer, "processPitch");
        Singer.PitchActions.playPitch("C", 4, 0, 0, blkId);
        expect(spy).toHaveBeenCalledWith(activity, "C", 4, 0, 0, blkId);
        spy.mockRestore();
    });

    describe("Tests for stepPitch", () => {
        test("non‑number value → error path", () => {
            Singer.PitchActions.stepPitch("foo", 0, blkId);
            expect(activity.logo.stopTurtle).toBe(true);
        });

        test("first‑call default assignment + justCounting branch", () => {
            turtle.singer.justCounting = [1];
            turtle.singer.lastNotePlayed = null;
            Singer.PitchActions.stepPitch(2, 0, blkId);
            expect(turtle.singer.lastNotePlayed[0]).toBe("G4");
        });

        test("inverted path", () => {
            turtle.singer.lastNotePlayed = ["A4", 4];
            turtle.singer.inverted = true;
            jest.spyOn(Singer, "calculateInvert").mockReturnValue(1);
            jest.spyOn(getNote, "bind");
            Singer.PitchActions.stepPitch(3, 0, blkId);
        });

        test("stepPitch handles numeric‑frequency lastNotePlayed branch", () => {
            turtle.singer.lastNotePlayed = [440];
            turtle.singer.inNoteBlock = [];
            activity.logo.inMatrix = false;
            activity.logo.inMusicKeyboard = false;
            Singer.PitchActions.stepPitch(1, 0, blkId);
            expect(Array.isArray(turtle.singer.lastNotePlayed)).toBe(true);
            expect(typeof turtle.singer.lastNotePlayed[0]).toBe("string");
        });

        test("justCounting with null previous/last sets both to G4", () => {
            turtle.singer.justCounting = [0];
            turtle.singer.lastNotePlayed = null;
            turtle.singer.previousNotePlayed = null;
            turtle.singer.inNoteBlock = [1];
            Singer.PitchActions.stepPitch(2, 0, blkId);
            expect(turtle.singer.previousNotePlayed).toEqual(["G4", 4]);
            expect(turtle.singer.lastNotePlayed).toEqual(["G4", 4]);
        });

        test("when lastNotePlayed=null but inNoteBlock nonempty → fourth‐if sets default", () => {
            turtle.singer.lastNotePlayed = null;
            turtle.singer.inNoteBlock = [1];
            activity.logo.inMatrix = false;
            activity.logo.inMusicKeyboard = false;
            turtle.singer.justCounting = [];
            Singer.PitchActions.stepPitch(1, 0, blkId);
            expect(turtle.singer.lastNotePlayed).toEqual(["G4", 4]);
        });

        test("numeric lastNotePlayed → frequencyToPitch branch", () => {
            turtle.singer.lastNotePlayed = [440];
            turtle.singer.inNoteBlock = [1];
            activity.logo.inMatrix = false;
            activity.logo.inMusicKeyboard = false;
            const spy = jest.spyOn(global, "frequencyToPitch");
            Singer.PitchActions.stepPitch(2, 0, blkId);
            expect(spy).toHaveBeenCalledWith(440);
            spy.mockRestore();
        });
    });

    describe("Tests for playNthModalPitch", () => {
        test("float rounding + negative arg + FLAT/SHARP adjustments", () => {
            turtle.singer.lastNotePlayed = ["C4", 4];
            global.keySignatureToMode = () => ["Db", "minor"];
            Singer.PitchActions.playNthModalPitch(-2.7, 3.1, 0, blkId);
        });

        test("playNthModalPitch covers SHARP adjustment branch", () => {
            global.keySignatureToMode = () => ["F#", "minor"];
            expect(() => {
                Singer.PitchActions.playNthModalPitch(5.2, 3, 0, blkId);
            }).not.toThrow();
        });
    });

    describe("Tests for playPitchNumber", () => {
        test("defineMode push", () => {
            turtle.singer.inDefineMode = true;
            Singer.PitchActions.playPitchNumber(7, 0, blkId);
            expect(turtle.singer.defineMode).toContain(7);
        });

        test("customTemperament error + else real play", () => {
            turtle.singer.inDefineMode = false;
            jest.spyOn(isCustomTemperament, "bind").mockReturnValue(true);
            Singer.PitchActions.playPitchNumber(5, 0, blkId);
            jest.spyOn(Singer, "processPitch");
            jest.spyOn(isCustomTemperament, "bind").mockReturnValue(false);
            Singer.PitchActions.playPitchNumber(5, 0, blkId);
            expect(Singer.processPitch).toHaveBeenCalled();
        });

        test("errorMsg called with correct localized string on custom temperament + nonzero transposition", () => {
            turtle.singer.inDefineMode = false;
            turtle.singer.scalarTransposition = 1;
            turtle.singer.transposition = 0;
            global.isCustomTemperament = () => true;
            const expected = _(
                "Scalar transpositions are equal to Semitone transpositions for custom temperament."
            );
            const spyErr = jest.spyOn(activity, "errorMsg");
            Singer.PitchActions.playPitchNumber(5, 0, blkId);
            expect(spyErr).toHaveBeenCalledWith(expected);
            spyErr.mockRestore();
        });
    });

    test("Tests for playHertz (symbolic/440Hz)", () => {
        turtle.singer.notePitches = { 1: [] };
        turtle.singer.noteOctaves = { 1: [] };
        turtle.singer.noteCents = { 1: [] };
        turtle.singer.inNoteBlock = [1];
        activity.logo.runningLilypond = true;

        // Mock processPitch to simulate adding a symbolic note (0 cents)
        Singer.processPitch.mockImplementation(() => {
            turtle.singer.notePitches[1].push("A");
            turtle.singer.noteOctaves[1].push(4);
            turtle.singer.noteCents[1].push(0);
        });

        jest.spyOn(activity.logo.notation, "notationMarkup");
        Singer.PitchActions.playHertz(440, 0, blkId);

        // Should NOT call markup for symbolic note
        expect(activity.logo.notation.notationMarkup).not.toHaveBeenCalled();
    });

    test("Tests for playHertz (microtonal/445Hz)", () => {
        turtle.singer.notePitches = { 1: [] };
        turtle.singer.noteOctaves = { 1: [] };
        turtle.singer.noteCents = { 1: [] };
        turtle.singer.inNoteBlock = [1];
        activity.logo.runningLilypond = true;

        // Mock processPitch to simulate adding a microtonal note (e.g. 20 cents)
        Singer.processPitch.mockImplementation(() => {
            turtle.singer.notePitches[1].push("A");
            turtle.singer.noteOctaves[1].push(4);
            turtle.singer.noteCents[1].push(20);
        });

        const spyMark = jest.spyOn(activity.logo.notation, "notationMarkup");
        Singer.PitchActions.playHertz(445, 0, blkId);

        // Should call markup for microtonal note
        // transformedHertz calculated from A4 + 20 cents
        expect(spyMark).toHaveBeenCalled();
    });

    test("playHertz notationMarkup occurs only when both inNoteBlock AND runningLilypond AND microtonal", () => {
        const spyMark = jest.spyOn(activity.logo.notation, "notationMarkup");
        turtle.singer.inNoteBlock = [1];
        turtle.singer.notePitches = { 1: [] };
        turtle.singer.noteOctaves = { 1: [] };
        turtle.singer.noteCents = { 1: [] };

        // Microtonal setup
        Singer.processPitch.mockImplementation(() => {
            turtle.singer.notePitches[1].push("A");
            turtle.singer.noteOctaves[1].push(4);
            turtle.singer.noteCents[1].push(50);
        });

        activity.logo.runningLilypond = true;
        Singer.PitchActions.playHertz(440, 0, blkId); // 440 input doesn't matter, mock storage dictates 50 cents
        expect(spyMark).toHaveBeenCalled(); // Called because cents=50

        spyMark.mockClear();
        // Reset storage for next case
        turtle.singer.notePitches[1] = [];
        turtle.singer.noteOctaves[1] = [];
        turtle.singer.noteCents[1] = [];

        activity.logo.runningLilypond = false;
        Singer.PitchActions.playHertz(440, 0, blkId);
        expect(spyMark).not.toHaveBeenCalled();

        spyMark.mockClear();
        // Reset storage
        turtle.singer.notePitches[1] = [];
        turtle.singer.noteOctaves[1] = [];
        turtle.singer.noteCents[1] = [];

        turtle.singer.inNoteBlock = []; // No note block
        activity.logo.runningLilypond = true;
        Singer.PitchActions.playHertz(440, 0, blkId);
        expect(spyMark).not.toHaveBeenCalled();

        spyMark.mockRestore();
    });

    describe("Tests for setAccidental", () => {
        test("named accidental path", () => {
            Singer.PitchActions.setAccidental("sharp", 0, blkId);
        });
        test("invalid accidental → default case", () => {
            Singer.PitchActions.setAccidental("foo", 0, blkId);
        });
    });

    describe("Tests for transpositions", () => {
        test("setScalarTranspose blockList path", () => {
            Singer.PitchActions.setScalarTranspose(1, 0, blkId);
        });
        test("setScalarTranspose MusicBlocks.isRun path", () => {
            MusicBlocks.isRun = true;
            Singer.PitchActions.setScalarTranspose(1, 0);
            MusicBlocks.isRun = false;
        });
        test("setSemitoneTranspose both paths", () => {
            Singer.PitchActions.setSemitoneTranspose(1, 0, blkId);
            MusicBlocks.isRun = true;
            Singer.PitchActions.setSemitoneTranspose(1, 0);
            MusicBlocks.isRun = false;
        });
        test("setRatioTranspose both paths", () => {
            Singer.PitchActions.setRatioTranspose(2, 0, blkId);
            MusicBlocks.isRun = true;
            Singer.PitchActions.setRatioTranspose(2, 0);
            MusicBlocks.isRun = false;
        });
    });

    describe("Tests for setRegister", () => {
        test("floors the value", () => {
            Singer.PitchActions.setRegister(5.7, 0);
            expect(turtle.singer.register).toBe(5);
        });
    });

    describe("Tests for invert", () => {
        test("numeric mode normalization", () => {
            Singer.PitchActions.invert("C", 4, 3, 0, blkId);
        });
        test("invalid mode ignored", () => {
            Singer.PitchActions.invert("C", 4, "nonsense", 0, blkId);
        });
    });

    describe("Tests for numToPitch", () => {
        test("valid number→returns pitch/octave", () => {
            expect(Singer.PitchActions.numToPitch(5, "pitch", 0)).toEqual(expect.any(String));
            expect(Singer.PitchActions.numToPitch(5, "octave", 0)).toEqual(expect.any(Number));
        });
        test("invalid input → throws", () => {
            expect(() => Singer.PitchActions.numToPitch(null, "pitch", 0)).toThrow("NoArgError");
        });
    });

    describe("Tests for setPitchNumberOffset", () => {
        test("sets offset via calcOctave + pitchToNumber", () => {
            Singer.PitchActions.setPitchNumberOffset("D", 5, 0);
            expect(typeof turtle.singer.pitchNumberOffset).toBe("number");
        });
    });

    describe("Tests for deltaPitch", () => {
        test("no previousNote → returns 0", () => {
            turtle.singer.previousNotePlayed = null;
            expect(Singer.PitchActions.deltaPitch("deltapitch", 0)).toBe(0);
        });
        test("scalar delta path", () => {
            turtle.singer.previousNotePlayed = ["C4", 4];
            turtle.singer.lastNotePlayed = ["E4", 4];
            const val = Singer.PitchActions.deltaPitch("deltascalarpitch", 0);
            expect(typeof val).toBe("number");
        });
        test("deltascalarpitch returns a negative count when last < previous", () => {
            turtle.singer.previousNotePlayed = ["D4", 4];
            turtle.singer.lastNotePlayed = ["C4", 4];
            const count = Singer.PitchActions.deltaPitch("deltascalarpitch", 0);
            expect(count).toBeLessThan(0);
        });
    });

    describe("Tests for consonantStepSize", () => {
        test("with lastNote → uses slice path", () => {
            turtle.singer.lastNotePlayed = ["F#4", 4];
            expect(Singer.PitchActions.consonantStepSize("down", 0)).toEqual(
                musicUtils.getStepSizeDown("C", "F#")
            );
        });
        test("no lastNote → default G", () => {
            turtle.singer.lastNotePlayed = null;
            expect(Singer.PitchActions.consonantStepSize("up", 0)).toEqual(
                musicUtils.getStepSizeUp("C", "G")
            );
        });
    });

    describe("Tests for listener & dispatch registration", () => {
        test("invert pushes even/odd/scalar and ignores bad modes", () => {
            Singer.PitchActions.invert("C", 4, 2, 0, blkId);
            let last = turtle.singer.invertList.pop();
            expect(last[2]).toBe("even");
            Singer.PitchActions.invert("C", 4, "scalar", 0, blkId);
            last = turtle.singer.invertList.pop();
            expect(last[2]).toBe("scalar");

            const len = turtle.singer.invertList.length;
            Singer.PitchActions.invert("C", 4, "nope", 0, blkId);
            expect(turtle.singer.invertList.length).toBe(len);
        });

        test("deltaPitch returns actual semitone difference", () => {
            turtle.singer.previousNotePlayed = ["C4", 4];
            turtle.singer.lastNotePlayed = ["D4", 4];
            expect(Singer.PitchActions.deltaPitch("deltapitch", 0)).toBe(2);
        });
    });

    describe("transpose listener registration & value arrays", () => {
        let dsp, tl, fakeMouse;

        beforeEach(() => {
            dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            tl = jest.spyOn(activity.logo, "setTurtleListener");
            fakeMouse = { MB: { listeners: [] } };
            Mouse.getMouseFromTurtle = () => fakeMouse;
        });

        afterEach(() => {
            dsp.mockRestore();
            tl.mockRestore();
            MusicBlocks.isRun = false;
        });

        test("setScalarTranspose: blockList path", () => {
            Singer.PitchActions.setScalarTranspose(5, 0, blkId);
            expect(turtle.singer.scalarTranspositionValues.pop()).toBe(5);
            expect(dsp).toHaveBeenCalledWith(blkId, 0, "_scalar_transposition_0");
            expect(tl).toHaveBeenCalledWith(0, "_scalar_transposition_0", expect.any(Function));
        });

        test("setScalarTranspose: MusicBlocks.isRun path", () => {
            MusicBlocks.isRun = true;
            Singer.PitchActions.setScalarTranspose(2, 0);
            expect(fakeMouse.MB.listeners).toContain("_scalar_transposition_0");
            expect(tl).toHaveBeenCalledWith(0, "_scalar_transposition_0", expect.any(Function));
        });

        test("setSemitoneTranspose: blockList path", () => {
            Singer.PitchActions.setSemitoneTranspose(3, 0, blkId);
            expect(turtle.singer.transpositionValues.pop()).toBe(3);
            expect(dsp).toHaveBeenCalledWith(blkId, 0, "_transposition_0");
            expect(tl).toHaveBeenCalledWith(0, "_transposition_0", expect.any(Function));
        });

        test("setSemitoneTranspose: MusicBlocks.isRun path", () => {
            MusicBlocks.isRun = true;
            Singer.PitchActions.setSemitoneTranspose(4, 0);
            expect(fakeMouse.MB.listeners).toContain("_transposition_0");
            expect(tl).toHaveBeenCalledWith(0, "_transposition_0", expect.any(Function));
        });

        test("setRatioTranspose: blockList path", () => {
            Singer.PitchActions.setRatioTranspose(7, 0, blkId);
            expect(turtle.singer.transpositionRatios.pop()).toBe(7);
            expect(dsp).toHaveBeenCalledWith(blkId, 0, "_transposition_ratio_0");
            expect(tl).toHaveBeenCalledWith(0, "_transposition_ratio_0", expect.any(Function));
        });

        test("setRatioTranspose: MusicBlocks.isRun path", () => {
            MusicBlocks.isRun = true;
            Singer.PitchActions.setRatioTranspose(9, 0);
            expect(fakeMouse.MB.listeners).toContain("_transposition_ratio_0");
            expect(tl).toHaveBeenCalledWith(0, "_transposition_ratio_0", expect.any(Function));
        });
    });

    describe("low‑level listener callbacks for Accidental / Transpose / Invert", () => {
        let fakeMouse;

        beforeEach(() => {
            activity.logo.setTurtleListener = (_turtle, _name, cb) => cb();
            fakeMouse = { MB: { listeners: [] } };
            Mouse.getMouseFromTurtle = () => fakeMouse;
        });

        afterEach(() => {
            MusicBlocks.isRun = false;
        });

        test('setAccidental early‑return for _("sharp") & _("flat")', () => {
            const before = turtle.singer.transposition;
            Singer.PitchActions.setAccidental(_("sharp"), 0, blkId);
            Singer.PitchActions.setAccidental(_("flat"), 0, blkId);
            expect(turtle.singer.transposition).toBe(before);
        });

        test("setAccidental run‑mode pushes listener and its callback reverses delta", () => {
            MusicBlocks.isRun = true;
            const before = turtle.singer.transposition;
            const acc = ACCIDENTALNAMES[0];
            Singer.PitchActions.setAccidental(acc, 0 /*turtle, /* blk undefined → run‑path */);
            expect(fakeMouse.MB.listeners).toContain("_accidental_0_undefined");
            expect(turtle.singer.transposition).toBe(before);
        });

        test("setScalarTranspose listener callback pops & reverses", () => {
            const before = turtle.singer.scalarTransposition;
            Singer.PitchActions.setScalarTranspose(4, 0, blkId);
            expect(turtle.singer.scalarTransposition).toBe(before);
        });

        test("setSemitoneTranspose listener callback pops & reverses", () => {
            const before = turtle.singer.transposition;
            Singer.PitchActions.setSemitoneTranspose(5, 0, blkId);
            expect(turtle.singer.transposition).toBe(before);
        });

        test("setRatioTranspose listener callback pops ratio", () => {
            turtle.singer.transpositionRatios = [];
            Singer.PitchActions.setRatioTranspose(7, 0, blkId);
            expect(turtle.singer.transpositionRatios).toHaveLength(0);
        });

        test("invert listener callback pops & clears inverted flag", () => {
            turtle.singer.invertList = [];
            turtle.singer.inverted = true;
            Singer.PitchActions.invert("C", 4, "even", 0, blkId);
            expect(turtle.singer.invertList).toHaveLength(0);
            expect(turtle.singer.inverted).toBe(false);
        });

        test("setAccidental blockList listener callback reverses delta", () => {
            activity.logo.setTurtleListener = (_t, _n, cb) => cb();
            const before = turtle.singer.transposition;
            const acc = ACCIDENTALNAMES[0];
            Singer.PitchActions.setAccidental(acc, 0, blkId);
            expect(turtle.singer.transposition).toBe(before);
        });
    });

    describe("playNthModalPitch unicode FLAT/SHARP ref‑adjustment", () => {
        test("FLAT symbol branch", () => {
            global.keySignatureToMode = () => ["B" + FLAT, "major"];
            const spy = jest.spyOn(Singer, "processPitch");
            Singer.PitchActions.playNthModalPitch(4.5, 2, 0, blkId);
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        test("SHARP symbol branch", () => {
            global.keySignatureToMode = () => ["F" + SHARP, "minor"];
            const spy = jest.spyOn(Singer, "processPitch");
            Singer.PitchActions.playNthModalPitch(2.2, 3, 0, blkId);
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe("invert: MusicBlocks.isRun listener path", () => {
        let fakeMouse;
        beforeEach(() => {
            MusicBlocks.isRun = true;
            fakeMouse = { MB: { listeners: [] } };
            Mouse.getMouseFromTurtle = () => fakeMouse;
        });
        afterEach(() => {
            MusicBlocks.isRun = false;
        });
        test("pushes listenerName into Mouse.MB.listeners", () => {
            Singer.PitchActions.invert("C", 4, "even", 0 /*turtle*/ /*blk*/);
            expect(fakeMouse.MB.listeners).toContain("_invert_0");
        });
    });

    describe("default listener‑only path", () => {
        let tl;
        beforeEach(() => {
            MusicBlocks.isRun = false;
            tl = jest.spyOn(activity.logo, "setTurtleListener");
        });
        afterEach(() => {
            tl.mockRestore();
        });

        test("setAccidental registers listener only", () => {
            const acc = ACCIDENTALNAMES[0];
            Singer.PitchActions.setAccidental(acc, 0 /*turtle*/);
            expect(tl).toHaveBeenCalledWith(0, "_accidental_0_undefined", expect.any(Function));
        });

        test("setScalarTranspose registers listener only", () => {
            Singer.PitchActions.setScalarTranspose(3, 0);
            expect(tl).toHaveBeenCalledWith(0, "_scalar_transposition_0", expect.any(Function));
        });

        test("setSemitoneTranspose registers listener only", () => {
            Singer.PitchActions.setSemitoneTranspose(2, 0);
            expect(tl).toHaveBeenCalledWith(0, "_transposition_0", expect.any(Function));
        });

        test("setRatioTranspose registers listener only", () => {
            Singer.PitchActions.setRatioTranspose(5, 0);
            expect(tl).toHaveBeenCalledWith(0, "_transposition_ratio_0", expect.any(Function));
        });

        test("invert registers listener only", () => {
            Singer.PitchActions.invert("C", 4, "even", 0);
            expect(tl).toHaveBeenCalledWith(0, "_invert_0", expect.any(Function));
        });
    });
});
