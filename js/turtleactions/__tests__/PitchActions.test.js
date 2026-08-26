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
    ACCIDENTALNAMES: musicUtils.ACCIDENTALNAMES,
    ACCIDENTALVALUES: musicUtils.ACCIDENTALVALUES,
    NOTESFLAT: musicUtils.NOTESFLAT,
    NOTESSHARP: musicUtils.NOTESSHARP,
    NOTESTEP: musicUtils.NOTESTEP,
    MUSICALMODES: musicUtils.MUSICALMODES,
    SHARP: musicUtils.SHARP,
    FLAT: musicUtils.FLAT,
    getCurrentEDO: musicUtils.getCurrentEDO,
    getModeLength: musicUtils.getModeLength
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
        // Add temperament globals only for this test
        global.isCustomTemperament = musicUtils.isCustomTemperament;
        global.isTrueEDO = musicUtils.isTrueEDO;
        global.TEMPERAMENT = musicUtils.TEMPERAMENT;

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
                inLegoWidget: false,
                inPitchSlider: false,
                pitchBlocks: [],
                phraseMaker: {
                    addRowBlock: jest.fn(),
                    rowLabels: [],
                    rowArgs: []
                },
                legoWidget: {
                    addRowBlock: jest.fn(),
                    rowLabels: [],
                    rowArgs: []
                },
                pitchSlider: {},
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

    afterEach(() => {
        // Clean up globals to prevent test pollution
        delete global.isCustomTemperament;
        delete global.isTrueEDO;
        delete global.TEMPERAMENT;
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
            turtle.singer.invertList = [["C", 4, "even"]];
            // delta_temp=3 makes transposition_temp = 2*3 = 6, distinguishable from 2/3.
            jest.spyOn(Singer, "calculateInvert").mockReturnValue(3);
            const spy = jest.spyOn(global, "getNote");
            Singer.PitchActions.stepPitch(3, 0, blkId);
            // getNote's 3rd argument is transposition_temp; only reached if the
            // inverted branch actually runs.
            expect(spy.mock.calls[0][2]).toBe(6);
            spy.mockRestore();
        });

        // Regression coverage for #8189: closing a nested Invert block used to
        // unconditionally clear a separate `tur.singer.inverted` cache flag, even
        // while an outer Invert block was still open, causing stepPitch to skip
        // un-inverting when it shouldn't. That cache flag has since been removed
        // entirely — stepPitch now reads `invertList.length` directly — so these
        // tests assert the observable behavior stays correct across nesting.
        test("nested Invert: stepPitch still un-inverts after an inner Invert closes while an outer one remains open", () => {
            const callbacks = [];
            activity.logo.setTurtleListener = (_t, _n, cb) => callbacks.push(cb);

            Singer.PitchActions.invert("C", 4, "even", 0, "outerBlk");
            Singer.PitchActions.invert("C", 4, "even", 0, "innerBlk");
            expect(turtle.singer.invertList).toHaveLength(2);

            callbacks[1](); // inner Invert block's clamp closes
            expect(turtle.singer.invertList).toHaveLength(1); // outer still open

            turtle.singer.lastNotePlayed = ["A4", 4];
            Singer.calculateInvert.mockClear();
            Singer.PitchActions.stepPitch(3, 0, blkId);

            expect(Singer.calculateInvert).toHaveBeenCalled();
        });

        test("nested Invert: stepPitch stops un-inverting once every Invert block has closed", () => {
            const callbacks = [];
            activity.logo.setTurtleListener = (_t, _n, cb) => callbacks.push(cb);

            Singer.PitchActions.invert("C", 4, "even", 0, "outerBlk");
            Singer.PitchActions.invert("C", 4, "even", 0, "innerBlk");

            callbacks[1](); // inner closes
            callbacks[0](); // outer closes
            expect(turtle.singer.invertList).toHaveLength(0);

            turtle.singer.lastNotePlayed = ["A4", 4];
            Singer.calculateInvert.mockClear();
            Singer.PitchActions.stepPitch(3, 0, blkId);

            expect(Singer.calculateInvert).not.toHaveBeenCalled();
        });

        test("reset-to-default guard only fires when inMatrix, inMusicKeyboard, and inNoteBlock are all clear", () => {
            // inMatrix=true blocks the reset even though the other two terms are satisfied,
            // proving the guard is a genuine `&&` and not `||`/always-true.
            Singer.addScalarTransposition.mockClear();
            turtle.singer.lastNotePlayed = ["A4", 4];
            activity.logo.inMatrix = true;
            activity.logo.inMusicKeyboard = false;
            turtle.singer.inNoteBlock = [];
            Singer.PitchActions.stepPitch(1, 0, blkId);
            expect(Singer.addScalarTransposition).toHaveBeenCalledWith(activity.logo, 0, "A", 4, 1);
        });

        test("reset-to-default guard fires even when lastNotePlayed was not null", () => {
            Singer.addScalarTransposition.mockClear();
            turtle.singer.lastNotePlayed = ["A4", 4];
            activity.logo.inMatrix = false;
            activity.logo.inMusicKeyboard = false;
            turtle.singer.inNoteBlock = [];
            Singer.PitchActions.stepPitch(1, 0, blkId);
            expect(Singer.addScalarTransposition).toHaveBeenCalledWith(activity.logo, 0, "G", 4, 1);
        });

        test("justCounting guard requires BOTH justCounting non-empty AND lastNotePlayed null", () => {
            // justCounting non-empty but lastNotePlayed already set → guard must stay false.
            turtle.singer.justCounting = [1];
            turtle.singer.lastNotePlayed = ["A4", 4];
            turtle.singer.previousNotePlayed = ["X9", 9];
            Singer.PitchActions.stepPitch(2, 0, blkId);
            expect(turtle.singer.previousNotePlayed).toEqual(["X9", 9]);
        });

        test("justCounting guard: empty justCounting does not satisfy the length check", () => {
            // inMatrix=true blocks the earlier reset-to-G4 guard so lastNotePlayed stays
            // genuinely null here, isolating the justCounting.length check itself.
            activity.logo.inMatrix = true;
            turtle.singer.justCounting = [];
            turtle.singer.lastNotePlayed = null;
            turtle.singer.previousNotePlayed = ["X9", 9];
            Singer.PitchActions.stepPitch(2, 0, blkId);
            expect(turtle.singer.previousNotePlayed).toEqual(["X9", 9]);
        });

        test("non-numeric lastNotePlayed is sliced into pitch name and octave correctly", () => {
            Singer.addScalarTransposition.mockClear();
            turtle.singer.lastNotePlayed = ["F#4", 4];
            activity.logo.inMatrix = true; // avoid the reset-to-G4 guard
            Singer.PitchActions.stepPitch(1, 0, blkId);
            expect(Singer.addScalarTransposition).toHaveBeenCalledWith(
                activity.logo,
                0,
                "F#",
                4,
                1
            );
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

        // Ground-truth values below were obtained by running the real
        // Singer.PitchActions.playNthModalPitch (via the real musicUtils.keySignatureToMode,
        // not the per-test override used above) against these inputs, not derived by hand.
        test("C major: exact scale-degree and octave-crossing boundaries", () => {
            global.keySignatureToMode = musicUtils.keySignatureToMode;
            turtle.singer.keySignature = "C major";
            const spy = jest.spyOn(Singer, "processPitch");
            const cases = [
                { number: 0, expected: ["C", 4] }, // identity: deltaOctave=0, deltaSemi=0
                { number: 7, expected: ["C", 5] }, // one full octave up (modeLength=7)
                { number: -1, expected: ["B", 4] }, // isNegativeArg branch, no octave change
                { number: -7, expected: ["C", 3] } // one full octave down
            ];
            for (const { number, expected } of cases) {
                spy.mockClear();
                Singer.PitchActions.playNthModalPitch(number, 4, 0, blkId);
                expect([spy.mock.calls[0][1], spy.mock.calls[0][2]]).toEqual(expected);
            }
            spy.mockRestore();
        });

        test("G major: deltaSemi crosses the reference boundary on the very first upward step", () => {
            // In G major the key note (ref) sits at semitone 7; stepping to scale degree 1
            // (A) already crosses that boundary, so the octave increments on the very first
            // step — a non-obvious case that exercises the semitones/ref comparison directly.
            global.keySignatureToMode = musicUtils.keySignatureToMode;
            turtle.singer.keySignature = "G major";
            const spy = jest.spyOn(Singer, "processPitch");
            Singer.PitchActions.playNthModalPitch(1, 4, 0, blkId);
            expect([spy.mock.calls[0][1], spy.mock.calls[0][2]]).toEqual(["A", 5]);
            spy.mockRestore();
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

        test("no error when temperament is custom but transpositions net to zero", () => {
            turtle.singer.inDefineMode = false;
            turtle.singer.scalarTransposition = 0;
            turtle.singer.transposition = 0;
            global.isCustomTemperament = () => true;
            const spyErr = jest.spyOn(activity, "errorMsg");
            Singer.PitchActions.playPitchNumber(5, 0, blkId);
            expect(spyErr).not.toHaveBeenCalled();
            spyErr.mockRestore();
        });

        test("no error when temperament is not custom, even with non-zero transpositions", () => {
            turtle.singer.inDefineMode = false;
            turtle.singer.scalarTransposition = 1;
            turtle.singer.transposition = 0;
            global.isCustomTemperament = () => false;
            const spyErr = jest.spyOn(activity, "errorMsg");
            Singer.PitchActions.playPitchNumber(5, 0, blkId);
            expect(spyErr).not.toHaveBeenCalled();
            spyErr.mockRestore();
        });

        test("error fires from the sum of the transpositions, not their difference", () => {
            // scalarTransposition=1, transposition=1 → sum=2 (non-zero, should error);
            // a mutated subtraction would give 0 (would not error).
            turtle.singer.inDefineMode = false;
            turtle.singer.scalarTransposition = 1;
            turtle.singer.transposition = 1;
            global.isCustomTemperament = () => true;
            const spyErr = jest.spyOn(activity, "errorMsg");
            Singer.PitchActions.playPitchNumber(5, 0, blkId);
            expect(spyErr).toHaveBeenCalled();
            spyErr.mockRestore();
        });

        test("numberToPitch receives pitchNumber offset by addition, not subtraction", () => {
            turtle.singer.inDefineMode = false;
            turtle.singer.pitchNumberOffset = 5;
            global.isCustomTemperament = () => false;
            const spy = jest.spyOn(global, "numberToPitch");
            Singer.PitchActions.playPitchNumber(10, 0, blkId);
            expect(spy.mock.calls[0][0]).toBe(15); // 10 + 5
            spy.mockRestore();
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

    test("playHertz exports Hertz rounded to 2 decimal places for Lilypond", () => {
        turtle.singer.notePitches = { 1: [] };
        turtle.singer.noteOctaves = { 1: [] };
        turtle.singer.noteCents = { 1: [] };
        turtle.singer.inNoteBlock = [1];
        activity.logo.runningLilypond = true;

        // Simulate a microtonal pitch producing a long decimal frequency
        Singer.processPitch.mockImplementation(() => {
            turtle.singer.notePitches[1].push("A");
            turtle.singer.noteOctaves[1].push(4);
            turtle.singer.noteCents[1].push(23); // non-clean cents value
        });

        const spyMark = jest.spyOn(activity.logo.notation, "notationMarkup");

        Singer.PitchActions.playHertz(440, 0, blkId);

        expect(spyMark).toHaveBeenCalled();

        const exportedHertz = spyMark.mock.calls.at(-1)[1];

        // proves value is rounded to 2 decimal places
        expect(exportedHertz).toBe(Number(exportedHertz.toFixed(2)));

        spyMark.mockRestore();
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

    describe("playHertz Lilypond guard — individual condition checks", () => {
        // Each test keeps runningLilypond=true and inNoteBlock non-empty (so blockId !== null,
        // already covered above) and makes exactly one other guard term falsy, to prove each
        // term actually gates the export rather than the guard being effectively always-true.
        beforeEach(() => {
            turtle.singer.inNoteBlock = [blkId];
            activity.logo.runningLilypond = true;
            Singer.processPitch.mockImplementation(() => {});
        });

        test("notePitches missing entirely → guard short-circuits, no export", () => {
            delete turtle.singer.notePitches;
            turtle.singer.noteOctaves = { [blkId]: [] };
            turtle.singer.noteCents = { [blkId]: [] };
            const spyMark = jest.spyOn(activity.logo.notation, "notationMarkup");
            Singer.PitchActions.playHertz(445, 0, blkId);
            expect(spyMark).not.toHaveBeenCalled();
            spyMark.mockRestore();
        });

        test("noteOctaves missing entirely → guard short-circuits, no export", () => {
            turtle.singer.notePitches = { [blkId]: [] };
            delete turtle.singer.noteOctaves;
            turtle.singer.noteCents = { [blkId]: [] };
            const spyMark = jest.spyOn(activity.logo.notation, "notationMarkup");
            Singer.PitchActions.playHertz(445, 0, blkId);
            expect(spyMark).not.toHaveBeenCalled();
            spyMark.mockRestore();
        });

        test("noteCents missing entirely → guard short-circuits, no export", () => {
            turtle.singer.notePitches = { [blkId]: [] };
            turtle.singer.noteOctaves = { [blkId]: [] };
            delete turtle.singer.noteCents;
            const spyMark = jest.spyOn(activity.logo.notation, "notationMarkup");
            Singer.PitchActions.playHertz(445, 0, blkId);
            expect(spyMark).not.toHaveBeenCalled();
            spyMark.mockRestore();
        });

        test("notePitches[blockId] missing (buffers initialized but not for this blockId) → no export", () => {
            turtle.singer.notePitches = {}; // no entry for blkId
            turtle.singer.noteOctaves = { [blkId]: [] };
            turtle.singer.noteCents = { [blkId]: [] };
            const spyMark = jest.spyOn(activity.logo.notation, "notationMarkup");
            Singer.PitchActions.playHertz(445, 0, blkId);
            expect(spyMark).not.toHaveBeenCalled();
            spyMark.mockRestore();
        });

        test("notePitches[blockId].length not greater than startLength (processPitch pushed nothing new) → no export", () => {
            // startLength is captured from notePitches[blockId].length before processPitch runs;
            // a no-op processPitch (see beforeEach) leaves the length unchanged, so
            // "length > startLength" is false even though every other term is true.
            turtle.singer.notePitches = { [blkId]: ["existing"] };
            turtle.singer.noteOctaves = { [blkId]: [4] };
            turtle.singer.noteCents = { [blkId]: [0] };
            const spyMark = jest.spyOn(activity.logo.notation, "notationMarkup");
            Singer.PitchActions.playHertz(445, 0, blkId);
            expect(spyMark).not.toHaveBeenCalled();
            spyMark.mockRestore();
        });
    });

    test("playSynthFrequency preserves matrix row frequency", () => {
        activity.logo.inMatrix = true;
        activity.blocks.blockList[blkId] = { name: "square" };

        Singer.PitchActions.playSynthFrequency(440, 0, blkId);

        expect(activity.logo.phraseMaker.addRowBlock).toHaveBeenCalledWith(blkId);
        expect(activity.logo.phraseMaker.rowLabels).toContain("square");
        expect(activity.logo.phraseMaker.rowArgs).toContain(440);
        expect(activity.logo.pitchBlocks).toContain(blkId);
    });

    test("playSynthFrequency (matrix): does not duplicate an already-tracked pitchBlock", () => {
        activity.logo.inMatrix = true;
        activity.blocks.blockList[blkId] = { name: "square" };
        activity.logo.pitchBlocks = [blkId];

        Singer.PitchActions.playSynthFrequency(440, 0, blkId);

        expect(activity.logo.pitchBlocks).toEqual([blkId]);
    });

    test("playSynthFrequency (legoWidget): does not duplicate an already-tracked pitchBlock", () => {
        activity.logo.inLegoWidget = true;
        activity.blocks.blockList[blkId] = { name: "triangle" };
        activity.logo.pitchBlocks = [blkId];

        Singer.PitchActions.playSynthFrequency(440, 0, blkId);

        expect(activity.logo.pitchBlocks).toEqual([blkId]);
    });

    test("playSynthFrequency preserves pitch slider frequency", () => {
        activity.logo.inPitchSlider = true;
        activity.logo.pitchSlider.frequency = null;

        Singer.PitchActions.playSynthFrequency(440, 0, blkId);

        expect(activity.logo.pitchSlider.frequency).toBe(440);
    });

    describe("playSynthFrequency: legoWidget and default synth-push paths", () => {
        test("inLegoWidget path records row block, label, and args", () => {
            activity.logo.inLegoWidget = true;
            activity.logo.inMatrix = false;
            activity.blocks.blockList[blkId] = { name: "triangle" };

            Singer.PitchActions.playSynthFrequency(440, 0, blkId);

            expect(activity.logo.legoWidget.addRowBlock).toHaveBeenCalledWith(blkId);
            expect(activity.logo.legoWidget.rowLabels).toContain("triangle");
            expect(activity.logo.legoWidget.rowArgs).toContain(440);
            expect(activity.logo.pitchBlocks).toContain(blkId);
        });

        test("default synth-push path stores pitch/octave/cents/hertz/beat for a symbolic (0-cent) note", () => {
            turtle.singer.inNoteBlock = [blkId];
            turtle.singer.oscList = { [blkId]: [] };
            turtle.singer.notePitches = { [blkId]: [] };
            turtle.singer.noteOctaves = { [blkId]: [] };
            turtle.singer.noteCents = { [blkId]: [] };
            turtle.singer.noteHertz = { [blkId]: [] };
            turtle.singer.noteBeatValues = { [blkId]: [] };
            turtle.singer.beatFactor = 1.5;
            activity.blocks.blockList[blkId] = { name: "sine" };

            Singer.PitchActions.playSynthFrequency(440, 0, blkId); // 440Hz → A4, 0 cents

            expect(turtle.singer.oscList[blkId]).toContain("sine");
            expect(turtle.singer.noteCents[blkId]).toEqual([0]);
            expect(turtle.singer.noteHertz[blkId]).toEqual([0]);
            expect(turtle.singer.noteBeatValues[blkId]).toEqual([1.5]);
            expect(turtle.singer.pushedNote).toBe(true);
        });

        test("default synth-push path computes noteHertz for a microtonal (non-zero-cent) note", () => {
            turtle.singer.inNoteBlock = [blkId];
            turtle.singer.oscList = { [blkId]: [] };
            turtle.singer.notePitches = { [blkId]: [] };
            turtle.singer.noteOctaves = { [blkId]: [] };
            turtle.singer.noteCents = { [blkId]: [] };
            turtle.singer.noteHertz = { [blkId]: [] };
            turtle.singer.noteBeatValues = { [blkId]: [] };
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList[blkId] = { name: "sine" };

            Singer.PitchActions.playSynthFrequency(445, 0, blkId); // 445Hz → microtonal, non-zero cents

            const [pitch, octave, cents] = musicUtils.frequencyToPitch(445);
            const expectedHertz = musicUtils.pitchToFrequency(
                pitch,
                octave,
                cents,
                turtle.singer.keySignature,
                activity.logo.synth.inTemperament
            );
            expect(cents).not.toBe(0);
            expect(turtle.singer.noteCents[blkId]).toEqual([cents]);
            expect(turtle.singer.noteHertz[blkId]).toEqual([expectedHertz]);
            expect(turtle.singer.pushedNote).toBe(true);
        });
    });

    describe("Tests for setAccidental", () => {
        test("named accidental from ACCIDENTALNAMES applies its value", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            Singer.PitchActions.setAccidental(ACCIDENTALNAMES[1], 0, blkId);
            expect(turtle.singer.transposition).toBe(1);
            expect(dsp).toHaveBeenCalledWith(blkId, 0, "_accidental_0_" + blkId);
            dsp.mockRestore();
        });
        test("bare 'sharp' fallback applies +1 and registers a listener", () => {
            const listenerSpy = jest.spyOn(activity.logo, "setTurtleListener");
            Singer.PitchActions.setAccidental("sharp", 0, blkId);
            expect(turtle.singer.transposition).toBe(1);
            expect(listenerSpy).toHaveBeenCalledWith(
                0,
                "_accidental_0_" + blkId,
                expect.any(Function)
            );
        });
        test("bare 'flat' fallback applies -1", () => {
            Singer.PitchActions.setAccidental("flat", 0, blkId);
            expect(turtle.singer.transposition).toBe(-1);
        });
        test("invalid accidental → default case leaves transposition unchanged", () => {
            Singer.PitchActions.setAccidental("foo", 0, blkId);
            expect(turtle.singer.transposition).toBe(0);
        });
        test("blk defined but not in blockList → does not dispatch, only registers the turtle listener", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            const tl = jest.spyOn(activity.logo, "setTurtleListener");
            Singer.PitchActions.setAccidental("sharp", 0, 999); // 999 is not a key in blockList
            expect(dsp).not.toHaveBeenCalled();
            expect(tl).toHaveBeenCalledWith(0, "_accidental_0_999", expect.any(Function));
            dsp.mockRestore();
            tl.mockRestore();
        });
        test("blk undefined and MusicBlocks.isRun false → dispatches to neither blockList nor Mouse listeners", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            const fakeMouse = { MB: { listeners: [] } };
            const originalGetMouse = Mouse.getMouseFromTurtle;
            Mouse.getMouseFromTurtle = () => fakeMouse;
            MusicBlocks.isRun = false;
            Singer.PitchActions.setAccidental("sharp", 0);
            expect(dsp).not.toHaveBeenCalled();
            expect(fakeMouse.MB.listeners).not.toContain("_accidental_0_undefined");
            dsp.mockRestore();
            Mouse.getMouseFromTurtle = originalGetMouse;
        });
        test("invertList non-empty flips the applied sign, and the undo listener flips it back", () => {
            turtle.singer.invertList = [["C", 4, "even"]];
            const callbacks = [];
            activity.logo.setTurtleListener = (_t, _n, cb) => callbacks.push(cb);
            const before = turtle.singer.transposition;
            Singer.PitchActions.setAccidental("sharp", 0, blkId); // value=+1, flipped to -1 while inverted
            expect(turtle.singer.transposition).toBe(before - 1);
            callbacks[0]();
            expect(turtle.singer.transposition).toBe(before);
        });
    });

    describe("Tests for transpositions", () => {
        test("setScalarTranspose blockList path", () => {
            Singer.PitchActions.setScalarTranspose(1, 0, blkId);
            expect(turtle.singer.scalarTransposition).toBe(1);
            expect(turtle.singer.scalarTranspositionValues).toContain(1);
        });
        test("setScalarTranspose MusicBlocks.isRun path", () => {
            MusicBlocks.isRun = true;
            Singer.PitchActions.setScalarTranspose(1, 0);
            expect(turtle.singer.scalarTransposition).toBe(1);
            expect(turtle.singer.scalarTranspositionValues).toContain(1);
            MusicBlocks.isRun = false;
        });
        test("setScalarTranspose: blk defined but not in blockList → does not dispatch, only registers the turtle listener", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            const tl = jest.spyOn(activity.logo, "setTurtleListener");
            Singer.PitchActions.setScalarTranspose(1, 0, 999); // 999 is not a key in blockList
            expect(dsp).not.toHaveBeenCalled();
            expect(tl).toHaveBeenCalledWith(0, "_scalar_transposition_0", expect.any(Function));
            dsp.mockRestore();
            tl.mockRestore();
        });
        test("setScalarTranspose: blk undefined and MusicBlocks.isRun false → dispatches to neither blockList nor Mouse listeners", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            const fakeMouse = { MB: { listeners: [] } };
            const originalGetMouse = Mouse.getMouseFromTurtle;
            Mouse.getMouseFromTurtle = () => fakeMouse;
            MusicBlocks.isRun = false;
            Singer.PitchActions.setScalarTranspose(1, 0);
            expect(dsp).not.toHaveBeenCalled();
            expect(fakeMouse.MB.listeners).not.toContain("_scalar_transposition_0");
            dsp.mockRestore();
            Mouse.getMouseFromTurtle = originalGetMouse;
        });
        test("setScalarTranspose: invertList non-empty flips the applied sign, and the undo listener flips it back", () => {
            turtle.singer.invertList = [["C", 4, "even"]];
            const callbacks = [];
            activity.logo.setTurtleListener = (_t, _n, cb) => callbacks.push(cb);
            const before = turtle.singer.scalarTransposition;
            Singer.PitchActions.setScalarTranspose(3, 0, blkId); // flipped to -3 while inverted
            expect(turtle.singer.scalarTransposition).toBe(before - 3);
            callbacks[0]();
            expect(turtle.singer.scalarTransposition).toBe(before);
        });
        test("setSemitoneTranspose both paths", () => {
            Singer.PitchActions.setSemitoneTranspose(1, 0, blkId);
            MusicBlocks.isRun = true;
            Singer.PitchActions.setSemitoneTranspose(1, 0);
            MusicBlocks.isRun = false;
        });
        test("setSemitoneTranspose: blk defined but not in blockList → does not dispatch, only registers the turtle listener", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            const tl = jest.spyOn(activity.logo, "setTurtleListener");
            Singer.PitchActions.setSemitoneTranspose(1, 0, 999);
            expect(dsp).not.toHaveBeenCalled();
            expect(tl).toHaveBeenCalledWith(0, "_transposition_0", expect.any(Function));
            dsp.mockRestore();
            tl.mockRestore();
        });
        test("setSemitoneTranspose: blk undefined and MusicBlocks.isRun false → dispatches to neither blockList nor Mouse listeners", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            const fakeMouse = { MB: { listeners: [] } };
            const originalGetMouse = Mouse.getMouseFromTurtle;
            Mouse.getMouseFromTurtle = () => fakeMouse;
            MusicBlocks.isRun = false;
            Singer.PitchActions.setSemitoneTranspose(1, 0);
            expect(dsp).not.toHaveBeenCalled();
            expect(fakeMouse.MB.listeners).not.toContain("_transposition_0");
            dsp.mockRestore();
            Mouse.getMouseFromTurtle = originalGetMouse;
        });
        test("setSemitoneTranspose: invertList non-empty flips the applied sign, and the undo listener flips it back", () => {
            turtle.singer.invertList = [["C", 4, "even"]];
            const callbacks = [];
            activity.logo.setTurtleListener = (_t, _n, cb) => callbacks.push(cb);
            const before = turtle.singer.transposition;
            Singer.PitchActions.setSemitoneTranspose(4, 0, blkId); // flipped to -4 while inverted
            expect(turtle.singer.transposition).toBe(before - 4);
            callbacks[0]();
            expect(turtle.singer.transposition).toBe(before);
        });
        test("setRatioTranspose both paths", () => {
            Singer.PitchActions.setRatioTranspose(2, 0, blkId);
            expect(turtle.singer.transpositionRatios).toContain(2);
            MusicBlocks.isRun = true;
            Singer.PitchActions.setRatioTranspose(2, 0);
            expect(turtle.singer.transpositionRatios).toContain(2);
            MusicBlocks.isRun = false;
        });
        test("setRatioTranspose: blk defined but not in blockList → does not dispatch, only registers the turtle listener", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            const tl = jest.spyOn(activity.logo, "setTurtleListener");
            Singer.PitchActions.setRatioTranspose(2, 0, 999);
            expect(dsp).not.toHaveBeenCalled();
            expect(tl).toHaveBeenCalledWith(0, "_transposition_ratio_0", expect.any(Function));
            dsp.mockRestore();
            tl.mockRestore();
        });
        test("setRatioTranspose: blk undefined and MusicBlocks.isRun false → dispatches to neither blockList nor Mouse listeners", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            const fakeMouse = { MB: { listeners: [] } };
            const originalGetMouse = Mouse.getMouseFromTurtle;
            Mouse.getMouseFromTurtle = () => fakeMouse;
            MusicBlocks.isRun = false;
            Singer.PitchActions.setRatioTranspose(2, 0);
            expect(dsp).not.toHaveBeenCalled();
            expect(fakeMouse.MB.listeners).not.toContain("_transposition_ratio_0");
            dsp.mockRestore();
            Mouse.getMouseFromTurtle = originalGetMouse;
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
            // 3 is odd (3 % 2 !== 0), so this exercises the "odd" branch specifically.
            Singer.PitchActions.invert("C", 4, 3, 0, blkId);
            const last = turtle.singer.invertList.pop();
            expect(last[2]).toBe("odd");
        });
        test("invalid mode ignored", () => {
            const before = turtle.singer.invertList.length;
            Singer.PitchActions.invert("C", 4, "nonsense", 0, blkId);
            expect(turtle.singer.invertList.length).toBe(before);
        });
        test("string 'odd' mode is accepted directly (not only via numeric normalization)", () => {
            Singer.PitchActions.invert("C", 4, "odd", 0, blkId);
            const last = turtle.singer.invertList.pop();
            expect(last[2]).toBe("odd");
        });
        test("blk defined but not in blockList → does not dispatch, only registers the turtle listener", () => {
            const dsp = jest.spyOn(activity.logo, "setDispatchBlock");
            const tl = jest.spyOn(activity.logo, "setTurtleListener");
            Singer.PitchActions.invert("C", 4, "even", 0, 999);
            expect(dsp).not.toHaveBeenCalled();
            expect(tl).toHaveBeenCalledWith(0, "_invert_0", expect.any(Function));
            dsp.mockRestore();
            tl.mockRestore();
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
        test("undefined input also throws (distinguishes the guard from a null-only check)", () => {
            // number !== null is true for undefined, so this only throws correctly if the
            // typeof-number check is genuinely required too, not just the null check.
            expect(() => Singer.PitchActions.numToPitch(undefined, "pitch", 0)).toThrow(
                "NoArgError"
            );
        });
        test("numToPitch adds pitchNumberOffset (not subtracts) before converting", () => {
            turtle.singer.pitchNumberOffset = 5;
            const spy = jest.spyOn(global, "numberToPitch");
            Singer.PitchActions.numToPitch(10, "pitch", 0);
            expect(spy.mock.calls[0][0]).toBe(15); // Math.floor(10) + 5
            spy.mockRestore();
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
            // Ground truth obtained by running the real implementation (not derived by hand):
            // C4 → E4 is a 4-semitone gap (deltapitch=4) covered in 3 upward scalar steps.
            expect(val).toBe(3);
        });
        test("deltascalarpitch returns a negative count when last < previous", () => {
            turtle.singer.previousNotePlayed = ["D4", 4];
            turtle.singer.lastNotePlayed = ["C4", 4];
            const count = Singer.PitchActions.deltaPitch("deltascalarpitch", 0);
            // Ground truth obtained by running the real implementation: D4 → C4 is a
            // 2-semitone gap covered in 2 downward scalar steps.
            expect(count).toBe(-2);
        });
        test("deltapitch/deltascalarpitch return 0 at the exact zero-delta boundary (same note)", () => {
            turtle.singer.previousNotePlayed = ["C4", 4];
            turtle.singer.lastNotePlayed = ["C4", 4];
            expect(Singer.PitchActions.deltaPitch("deltapitch", 0)).toBe(0);
            expect(Singer.PitchActions.deltaPitch("deltascalarpitch", 0)).toBe(0);
        });
        test("deltascalarpitch terminates (does not hang) when the temperament yields a zero step size", () => {
            // Regression test for a real bug found during mutation analysis: getStepSizeUp/Down
            // returns the raw `transposition` argument (which _calculate always passes as the
            // literal 0) whenever isCustomTemperament() is true and the temperament has no
            // .ratios table (confirmed directly against musicUtils, not assumed). With nhalf=0,
            // `delta` never changes, so the original `while (delta > 0)` / `while (delta < 0)`
            // loop never terminated — the `if (i > 100) return;` inside _calculate only returned
            // from that inner closure and never broke the outer loop. Fixed by adding `&& i < 100`
            // to both while conditions, giving an explicit, unambiguous cap of exactly 100
            // iterations regardless of step size. This test itself is safe even if the fix
            // regresses, because Jest's own test timeout will fail it rather than hang the
            // whole process.
            turtle.singer.previousNotePlayed = ["C4", 4];
            turtle.singer.lastNotePlayed = ["E4", 4];
            activity.logo.synth.inTemperament = "totally-not-a-real-temperament";
            expect(
                musicUtils.getStepSizeUp("C major", "C", 0, "totally-not-a-real-temperament")
            ).toBe(0);
            const result = Singer.PitchActions.deltaPitch("deltascalarpitch", 0);
            expect(result).toBe(100); // exactly 100 iterations, matching the i < 100 cap
        }, 10000);

        test("deltascalarpitch terminates in the downward direction too", () => {
            turtle.singer.previousNotePlayed = ["E4", 4];
            turtle.singer.lastNotePlayed = ["C4", 4];
            activity.logo.synth.inTemperament = "totally-not-a-real-temperament";
            const result = Singer.PitchActions.deltaPitch("deltascalarpitch", 0);
            expect(result).toBe(-100);
        }, 10000);
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
        test("falls back to 1 when the temperament lookup returns a non-number (custom temperament with no ratios table)", () => {
            // musicUtils._getStepSize returns the raw `transposition` argument, un-typechecked,
            // when isCustomTemperament(temperament) is true and the temperament has no .ratios
            // table. consonantStepSize passes `undefined` as that argument, so the lookup itself
            // returns `undefined` here — confirmed directly against musicUtils, not assumed.
            turtle.singer.lastNotePlayed = ["F#4", 4];
            activity.logo.synth.inTemperament = "totally-not-a-real-temperament";
            expect(
                musicUtils.getStepSizeDown("C", "F#", undefined, "totally-not-a-real-temperament")
            ).toBeUndefined();
            expect(Singer.PitchActions.consonantStepSize("down", 0)).toBe(1);
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

        test('setAccidental fallback for _("sharp") applies delta and registers a reversing listener', () => {
            const callbacks = [];
            activity.logo.setTurtleListener = (_turtle, _name, cb) => callbacks.push(cb);
            const before = turtle.singer.transposition;
            Singer.PitchActions.setAccidental(_("sharp"), 0, blkId);
            expect(turtle.singer.transposition).toBe(before + 1);
            expect(callbacks).toHaveLength(1);
            callbacks[0]();
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

        test("invert listener callback pops the pushed entry off invertList", () => {
            turtle.singer.invertList = [];
            Singer.PitchActions.invert("C", 4, "even", 0, blkId);
            expect(turtle.singer.invertList).toHaveLength(0);
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

    describe("numToPitch temperament awareness", () => {
        test("default temperament works (12-EDO)", () => {
            const result = Singer.PitchActions.numToPitch(0, "pitch", 0);
            expect(result).toEqual(expect.any(String));
        });

        test("uses synth.inTemperament for numberToPitch call", () => {
            // activity.logo.synth.inTemperament is "equal" in the mock
            // Ensure no crash and returns valid pitch
            const pitch = Singer.PitchActions.numToPitch(39, "pitch", 0);
            const octave = Singer.PitchActions.numToPitch(39, "octave", 0);
            expect(typeof pitch).toBe("string");
            expect(typeof octave).toBe("number");
        });
    });

    describe("setPitchNumberOffset temperament awareness", () => {
        test("passes inTemperament to pitchToNumber", () => {
            const original = global.pitchToNumber;
            global.pitchToNumber = jest.fn(() => 0);
            Singer.PitchActions.setPitchNumberOffset("C", 4, 0);
            const callArgs = global.pitchToNumber.mock.calls[0];
            expect(callArgs.length).toBe(4);
            expect(callArgs[3]).toBe("equal");
            global.pitchToNumber = original;
        });
    });

    describe("deltaPitch temperament awareness", () => {
        test("uses inTemperament for getStepSizeUp/Down", () => {
            turtle.singer.previousNotePlayed = ["C4", 4];
            turtle.singer.lastNotePlayed = ["E4", 4];
            const originalUp = global.getStepSizeUp;
            const originalDown = global.getStepSizeDown;
            global.getStepSizeUp = jest.fn(() => 2);
            global.getStepSizeDown = jest.fn(() => -2);
            Singer.PitchActions.deltaPitch("deltascalarpitch", 0);
            const allCalls = [
                ...global.getStepSizeUp.mock.calls,
                ...global.getStepSizeDown.mock.calls
            ];
            const hasTemperament = allCalls.some(args => args[3] === "equal");
            expect(hasTemperament).toBe(true);
            global.getStepSizeUp = originalUp;
            global.getStepSizeDown = originalDown;
        });
    });
});
