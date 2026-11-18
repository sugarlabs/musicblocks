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
 * Semi-tone transposition in the meantone temperaments, whose pitches are a table of ratios
 * that are not evenly spaced. A semitone is 100 cents, and getNote should land on the
 * temperament's nearest pitch, as rounding semitones to steps does in an EDO.
 */

global._ = str => str;

const musicutils = require("../musicutils");
const { getNote, pitchToFrequency } = musicutils;

const QUARTER = "1/4 comma meantone";
const THIRD = "1/3 comma meantone";

const transpose = (note, octave, semitones, temperament, keySignature = "C major", movable) =>
    getNote(note, octave, semitones, keySignature, movable, null, jest.fn(), temperament);

const centsAboveC4 = ([note, octave, cents], temperament) =>
    1200 *
    Math.log2(
        pitchToFrequency(note, octave, cents, "C major", temperament) /
            pitchToFrequency("C", 4, 0, "C major", temperament)
    );

describe("semi-tone transposition in 1/4-comma meantone", () => {
    test.each([
        [1, "D♭", 4],
        [2, "D", 4],
        [3, "E♭", 4],
        [4, "E", 4],
        [5, "F", 4],
        [7, "G", 4],
        [8, "A♭", 4],
        [9, "A", 4],
        [10, "B♭", 4],
        [11, "B", 4],
        [12, "C", 5],
        [-1, "B", 3],
        [-5, "G", 3],
        [-7, "F", 3],
        [-12, "C", 3]
    ])("C4 moved %i semitones is %s%i", (semitones, note, octave) => {
        expect(transpose("C", 4, semitones, QUARTER)).toEqual([note, octave, 0]);
    });

    test("a fifth up is a meantone fifth, not a diminished fifth", () => {
        // Four meantone fifths make a pure major third (5/4), so one is 696.6 cents. The
        // table's ratios are rounded to six places, hence two decimals of a cent.
        const fifth = 300 * Math.log2(5);
        expect(centsAboveC4(transpose("C", 4, 7, QUARTER), QUARTER)).toBeCloseTo(fifth, 2);
        expect(centsAboveC4(transpose("C", 4, 4, QUARTER), QUARTER)).toBeCloseTo(
            1200 * Math.log2(5 / 4),
            2
        );
    });

    test.each([
        ["E", 4, "B", 4],
        ["B♭", 3, "F", 4],
        ["F♯", 4, "C♯", 5],
        ["G", 4, "D", 5]
    ])("%s%i up a fifth is %s%i", (note, octave, toNote, toOctave) => {
        expect(transpose(note, octave, 7, QUARTER)).toEqual([toNote, toOctave, 0]);
    });

    test("the fraction of a transposition stays cents on the moved pitch", () => {
        expect(transpose("C", 4, 7.5, QUARTER)).toEqual(["G", 4, 50]);
        expect(transpose("C", 4, -7.5, QUARTER)).toEqual(["F", 3, -50]);
    });

    test("solfege and movable Do resolve before they are transposed", () => {
        expect(transpose("sol", 4, 7, QUARTER)).toEqual(["D", 5, 0]);
        // Movable mi in G major is B; a major third above it is D♯.
        expect(transpose("mi", 4, 4, QUARTER, "G major", true)).toEqual(["D♯", 4, 0]);
    });

    test("no transposition leaves the note alone", () => {
        expect(transpose("E", 4, 0, QUARTER)).toEqual(["E", 4, 0]);
    });
});

describe("semi-tone transposition in 1/3-comma meantone", () => {
    test.each([
        [4, "E", 4],
        [5, "F", 4],
        [7, "G", 4],
        [-7, "F", 3]
    ])("C4 moved %i semitones is %s%i", (semitones, note, octave) => {
        expect(transpose("C", 4, semitones, THIRD)).toEqual([note, octave, 0]);
    });

    test("half a semitone more is cents on G, not on G♯", () => {
        expect(transpose("C", 4, 7.5, THIRD)).toEqual(["G", 4, 50]);
    });
});

describe("temperaments with even steps or twelve pitches are not affected", () => {
    test.each([
        ["equal", 7, "G"],
        ["equal19", 7, "G"],
        ["just intonation", 7, "G"],
        ["Pythagorean", 4, "E"]
    ])("%s: C4 moved %i semitones is %s4", (temperament, semitones, note) => {
        expect(transpose("C", 4, semitones, temperament)[0]).toBe(note);
    });
});
