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
 * A pitch inside a Note block that has cents of its own (from Hertz, or a custom pitch such as
 * C(+35)) and a transposition that adds cents (a fraction of a semi-tone, or a ratio), through
 * Singer.processPitch with the real musicutils.
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

const C4 = pitchToFrequency("C", 4, 0, "C major");

/**
 * Plays one pitch inside a Note block and returns the frequency it was queued at, in cents
 * above C4.
 * @param {string} note
 * @param {number} octave
 * @param {number} cents - the pitch's own cents
 * @param {Object} [options] - transposition (semi-tones) and transpositionRatios
 * @returns {number}
 */
const centsAboveC4 = (note, octave, cents, options = {}) => {
    const turtle = { singer: null };
    turtle.singer = new Singer(turtle);
    Object.assign(turtle.singer, {
        inNoteBlock: [0],
        notePitches: { 0: [] },
        noteOctaves: { 0: [] },
        noteCents: { 0: [] },
        noteHertz: { 0: [] },
        noteBeatValues: { 0: [] },
        beatFactor: 1,
        transposition: options.transposition || 0,
        transpositionRatios: options.transpositionRatios || [],
        register: 0,
        invertList: [],
        intervals: [],
        semitoneIntervals: [],
        chordIntervals: [],
        ratioIntervals: [],
        keySignature: "C major",
        movable: false
    });
    const activity = {
        turtles: { ithTurtle: () => turtle },
        blocks: { blockList: {} },
        errorMsg: jest.fn()
    };
    activity.logo = {
        activity,
        synth: { inTemperament: "equal" },
        clearNoteParams: jest.fn()
    };

    Singer.processPitch(activity, note, octave, cents, 0, 0);

    const pitch = turtle.singer.notePitches[0][0];
    const pitchOctave = turtle.singer.noteOctaves[0][0];
    const pitchCents = turtle.singer.noteCents[0][0];
    // processNote plays noteHertz when it is set, and the named pitch otherwise.
    const hertz =
        turtle.singer.noteHertz[0][0] || pitchToFrequency(pitch, pitchOctave, 0, "C major");
    expect(hertz).toBeCloseTo(pitchToFrequency(pitch, pitchOctave, pitchCents, "C major"), 6);
    return 1200 * Math.log2(hertz / C4);
};

describe("cents on a pitch and cents from a transposition add up", () => {
    test("C(+35) in a 0.5 semi-tone transposition is 85 cents above C4", () => {
        expect(centsAboveC4("C", 4, 35, { transposition: 0.5 })).toBeCloseTo(85, 6);
    });

    test("C(+35) in a -0.5 semi-tone transposition is 15 cents below C4", () => {
        expect(centsAboveC4("C", 4, 35, { transposition: -0.5 })).toBeCloseTo(-15, 6);
    });

    test("C(+35) times a 3:2 ratio is a pure fifth and 35 cents above C4", () => {
        expect(centsAboveC4("C", 4, 35, { transpositionRatios: [1.5] })).toBeCloseTo(
            1200 * Math.log2(1.5) + 35,
            6
        );
    });

    test("a Hertz pitch in a 0.5 semi-tone transposition moves up 50 cents", () => {
        const [note, octave, cents] = frequencyToPitch(270);
        expect(cents).not.toBe(0);
        expect(centsAboveC4(note, octave, cents, { transposition: 0.5 })).toBeCloseTo(
            1200 * Math.log2(270 / C4) + 50,
            1
        );
    });

    test("either one alone is unchanged", () => {
        expect(centsAboveC4("C", 4, 0, { transposition: 0.5 })).toBeCloseTo(50, 6);
        expect(centsAboveC4("C", 4, 35)).toBeCloseTo(35, 6);
        expect(centsAboveC4("C", 4, 35, { transposition: 1 })).toBeCloseTo(135, 6);
    });
});
