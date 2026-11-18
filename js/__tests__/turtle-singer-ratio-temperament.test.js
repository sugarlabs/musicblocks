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
 * Ratio interval and Transpose by ratio multiply a frequency, then name the result. The name
 * has to come from the current temperament, or the cents are measured from a pitch that is
 * not the one that plays them. Runs Singer.processPitch through the real musicutils.
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
 * Plays C4 in a Note block and returns, for each pitch queued, how many cents it is above C4
 * in that temperament.
 * @param {string} temperament
 * @param {Object} singerState - ratioIntervals or transpositionRatios
 * @returns {number[]}
 */
const centsAboveC4 = (temperament, singerState) => {
    const turtle = { singer: null };
    turtle.singer = new Singer(turtle);
    Object.assign(
        turtle.singer,
        {
            inNoteBlock: [0],
            notePitches: { 0: [] },
            noteOctaves: { 0: [] },
            noteCents: { 0: [] },
            noteHertz: { 0: [] },
            noteBeatValues: { 0: [] },
            beatFactor: 1,
            transposition: 0,
            transpositionRatios: [],
            register: 0,
            invertList: [],
            intervals: [],
            semitoneIntervals: [],
            chordIntervals: [],
            ratioIntervals: [],
            keySignature: "C major",
            movable: false
        },
        singerState
    );
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

    Singer.processPitch(activity, "C", 4, 0, 0, 0);

    const c4 = pitchToFrequency("C", 4, 0, "C major", temperament);
    return turtle.singer.notePitches[0].map((pitch, i) => {
        // processNote plays noteHertz when it is set, and the named pitch otherwise.
        const hertz =
            turtle.singer.noteHertz[0][i] ||
            pitchToFrequency(pitch, turtle.singer.noteOctaves[0][i], 0, "C major", temperament);
        return 1200 * Math.log2(hertz / c4);
    });
};

// frequencyToPitch rounds what is left over to a tenth of a cent and drops less than half a
// cent, so that is as close as a ratio can come out.
const HALF_A_CENT = 0.51;

// Outside 12 EDO, pitchToFrequency also has to read the cents as cents for these to come out
// exact; the equal temperaments are covered with that fix.
describe.each([
    "equal",
    "just intonation",
    "Pythagorean",
    "1/3 comma meantone",
    "1/4 comma meantone"
])("ratios in %s", temperament => {
    test("a Ratio interval of 3:2 is a pure fifth above the note", () => {
        const [root, fifth] = centsAboveC4(temperament, { ratioIntervals: [1.5] });
        expect(root).toBeCloseTo(0, 6);
        expect(Math.abs(fifth - 1200 * Math.log2(1.5))).toBeLessThan(HALF_A_CENT);
    });

    test("Transpose by ratio 5:4 is a pure major third above the note", () => {
        const [third] = centsAboveC4(temperament, { transpositionRatios: [1.25] });
        expect(Math.abs(third - 1200 * Math.log2(1.25))).toBeLessThan(HALF_A_CENT);
    });
});

test("in just intonation, the 3:2 above C4 is its own G4, with no cents", () => {
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
        transposition: 0,
        transpositionRatios: [],
        register: 0,
        invertList: [],
        intervals: [],
        semitoneIntervals: [],
        chordIntervals: [],
        ratioIntervals: [1.5],
        keySignature: "C major",
        movable: false
    });
    const activity = { turtles: { ithTurtle: () => turtle }, blocks: { blockList: {} } };
    activity.logo = {
        activity,
        synth: { inTemperament: "just intonation" },
        clearNoteParams: jest.fn()
    };

    Singer.processPitch(activity, "C", 4, 0, 0, 0);

    expect(turtle.singer.notePitches[0]).toEqual(["C", "G"]);
    expect(turtle.singer.noteCents[0]).toEqual([0, 0]);
});
