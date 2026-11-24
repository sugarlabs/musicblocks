/**
 * @license
 * MusicBlocks
 * Copyright (C) 2026 Music Blocks Contributors
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

/**
 * Invert outside 12 EDO, through the real note-name pipeline: Singer.processPitch with the real
 * musicutils (getNote, pitchToNumber, generateNoteNames, ...), no stand-ins. calculateInvert
 * measures in steps of the temperament, so the reflected note has to be built in steps too.
 */

const musicUtils = require("../utils/musicutils");
Object.assign(global, musicUtils);
global.last = array => (array && array.length > 0 ? array[array.length - 1] : null);
global.deepClone = value => JSON.parse(JSON.stringify(value));
global.clampNumber = require("../utils/utils-logic").clampNumber;
global.DEFAULTVOLUME = 100;
global.DEFAULTVOICE = "electronic synth";
global.TARGETBPM = 120;
global.TONEBPM = 60;

const Singer = require("../turtle-singer");

/**
 * Runs one pitch block through Singer.processPitch and returns what it queued.
 * @param {string} temperament
 * @param {string} note
 * @param {number} octave
 * @param {Array} invertList - [axis note, axis octave, "even" | "odd" | "scalar"], innermost last
 * @param {Object} [options]
 * @returns {{ pitches: string[], octaves: number[], cents: number[] }}
 */
const playInverted = (temperament, note, octave, invertList, options = {}) => {
    const turtle = { singer: null };
    turtle.singer = new Singer(turtle);
    const inNoteBlock = options.standAlone ? [] : [0];
    Object.assign(turtle.singer, {
        inNoteBlock,
        notePitches: { 0: [] },
        noteOctaves: { 0: [] },
        noteCents: { 0: [] },
        noteHertz: { 0: [] },
        noteBeatValues: { 0: [] },
        beatFactor: 1,
        transposition: options.transposition || 0,
        register: 0,
        invertList,
        intervals: options.intervals || [],
        semitoneIntervals: [],
        chordIntervals: [],
        ratioIntervals: [],
        keySignature: "C major",
        movable: false,
        pitchNumberOffset: 0
    });

    const activity = {
        turtles: { ithTurtle: () => turtle },
        blocks: { blockList: {} },
        errorMsg: jest.fn()
    };
    activity.logo = {
        activity,
        synth: { inTemperament: temperament },
        clearNoteParams: jest.fn()
    };

    // A stand-alone pitch pushes itself onto inNoteBlock, keyed by its own block (0), and
    // schedules itself: read what it queued at that hand-off, before it is cleared.
    let queued = null;
    const processNote = jest.spyOn(Singer, "processNote").mockImplementation(() => {
        queued = {
            pitches: [...turtle.singer.notePitches[0]],
            octaves: [...turtle.singer.noteOctaves[0]],
            cents: [...turtle.singer.noteCents[0]]
        };
    });

    Singer.processPitch(activity, note, octave, options.cents || 0, 0, 0);
    processNote.mockRestore();

    return (
        queued || {
            pitches: turtle.singer.notePitches[0],
            octaves: turtle.singer.noteOctaves[0],
            cents: turtle.singer.noteCents[0]
        }
    );
};

const stepOf = (temperament, note, octave) => pitchToNumber(note, octave, "C major", temperament);

describe("invert outside 12 EDO", () => {
    test("12 EDO is unchanged: C4 inverted around E4 is G♯4", () => {
        const played = playInverted("equal", "C", 4, [["E", 4, "even"]]);
        expect([played.pitches[0], played.octaves[0]]).toEqual(["G♯", 4]);
    });

    test("19 EDO: C4 inverted around E4 is G♯4, not C5", () => {
        const played = playInverted("equal19", "C", 4, [["E", 4, "even"]]);
        expect([played.pitches[0], played.octaves[0]]).toEqual(["G♯", 4]);
        expect(played.cents[0]).toBe(0);
    });

    test("19 EDO: G4 inverted around C4 is F3, not A2", () => {
        const played = playInverted("equal19", "G", 4, [["C", 4, "even"]]);
        expect([played.pitches[0], played.octaves[0]]).toEqual(["F", 3]);
    });

    test.each(["equal17", "equal19", "equal31", "1/3 comma meantone"])(
        "%s: the inverted note is as many steps above the axis as the note is below it",
        temperament => {
            const played = playInverted(temperament, "C", 4, [["E", 4, "even"]]);
            const c4 = stepOf(temperament, "C", 4);
            const e4 = stepOf(temperament, "E", 4);
            expect(stepOf(temperament, played.pitches[0], played.octaves[0])).toBe(e4 + (e4 - c4));
        }
    );

    test("19 EDO: odd inversion around C4 moves C4 up one step", () => {
        const played = playInverted("equal19", "C", 4, [["C", 4, "odd"]]);
        expect(stepOf("equal19", played.pitches[0], played.octaves[0])).toBe(
            stepOf("equal19", "C", 4) + 1
        );
    });

    test("19 EDO: nested inversions reflect twice", () => {
        // C4 around D4 is E4; E4 around E4 stays E4.
        const played = playInverted("equal19", "C", 4, [
            ["E", 4, "even"],
            ["D", 4, "even"]
        ]);
        expect([played.pitches[0], played.octaves[0]]).toEqual(["E", 4]);
    });

    test("19 EDO: a transposition still applies after the inversion", () => {
        // G♯4 up one semitone, which is two steps of 19 EDO, as everywhere else.
        const played = playInverted("equal19", "C", 4, [["E", 4, "even"]], {
            transposition: 1
        });
        expect(stepOf("equal19", played.pitches[0], played.octaves[0])).toBe(
            stepOf("equal19", "G♯", 4) + 2
        );
    });

    test("19 EDO: a stand-alone pitch block is inverted the same way", () => {
        const played = playInverted("equal19", "C", 4, [["E", 4, "even"]], {
            standAlone: true
        });
        expect([played.pitches[0], played.octaves[0]]).toEqual(["G♯", 4]);
    });

    test("19 EDO: intervals are built on the inverted note", () => {
        // A scalar third above G♯4 in C major.
        const played = playInverted("equal19", "C", 4, [["E", 4, "even"]], {
            intervals: [3]
        });
        expect(played.pitches.length).toBe(2);
        expect([played.pitches[0], played.octaves[0]]).toEqual(["G♯", 4]);
        expect(stepOf("equal19", played.pitches[1], played.octaves[1])).toBeGreaterThan(
            stepOf("equal19", "G♯", 4)
        );
    });

    test("19 EDO: cents on the note are reflected too", () => {
        // C4 + 35 cents around C4 is C4 - 35 cents.
        const played = playInverted("equal19", "C", 4, [["C", 4, "even"]], { cents: 35 });
        const sounding =
            (stepOf("equal19", played.pitches[0], played.octaves[0]) * 1200) / 19 + played.cents[0];
        expect(sounding).toBeCloseTo((stepOf("equal19", "C", 4) * 1200) / 19 - 35, 6);
    });
});

describe("Singer.moveByEdoSteps", () => {
    const activity = {
        errorMsg: jest.fn(),
        logo: { synth: { inTemperament: "equal19" } }
    };
    const tur = { singer: { keySignature: "C major", movable: false } };

    test("moves by whole steps without adding cents", () => {
        expect(Singer.moveByEdoSteps(activity, tur, "C", 4, 0, 12, 19)).toEqual(["G♯", 4, 0]);
    });

    test("carries a fraction of a step as cents of that step", () => {
        const [note, octave, cents] = Singer.moveByEdoSteps(activity, tur, "C", 4, 0, 1.5, 19);
        // 1.5 steps rounds to 2 steps, less half a step of 1200 / 19 cents.
        expect([note, octave]).toEqual(["D♭", 4]);
        expect(cents).toBeCloseTo(-600 / 19, 6);
    });
});

describe("an inverted solfege note keeps its solfege label in the Phrase Maker", () => {
    const rowLabelFor = temperament => {
        const turtle = { singer: null };
        turtle.singer = new Singer(turtle);
        Object.assign(turtle.singer, {
            inNoteBlock: [],
            transposition: 0,
            register: 0,
            invertList: [["E", 4, "even"]],
            arpeggio: [],
            keySignature: "C major",
            movable: false,
            pitchNumberOffset: 0
        });
        const phraseMaker = { addRowBlock: jest.fn(), rowLabels: [], rowArgs: [] };
        const activity = {
            turtles: { ithTurtle: () => turtle },
            blocks: { blockList: {} },
            errorMsg: jest.fn()
        };
        activity.logo = {
            activity,
            synth: { inTemperament: temperament },
            inMatrix: true,
            phraseMaker,
            pitchBlocks: []
        };
        Singer.processPitch(activity, "do", 4, 0, 0, 0);
        return phraseMaker.rowLabels[0];
    };

    test("do inverted around E4 is labelled as in 12 EDO", () => {
        const label = rowLabelFor("equal19");
        expect(noteIsSolfege(label)).toBe(true);
        expect(label).toBe(rowLabelFor("equal"));
    });
});
