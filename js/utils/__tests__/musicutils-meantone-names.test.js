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
 * getNote in 1/4-comma meantone keeps the note names the temperament lists. Its F♭ and C♭ are
 * pitches of their own, 41 cents above E and B, but the EDO name table getNote resolves
 * through has neither, so they came back as E and B.
 */

global._ = str => str;

const { getNote, getTemperament, pitchToFrequency } = require("../musicutils");

const MEANTONE = "1/4 comma meantone";
const note = (name, octave, transposition = 0, temperament = MEANTONE) =>
    getNote(name, octave, transposition, "C major", false, null, jest.fn(), temperament);

describe("note names of 1/4-comma meantone", () => {
    test("F♭ and C♭ stay F♭ and C♭", () => {
        expect(note("F♭", 4)).toEqual(["F♭", 4, 0]);
        expect(note("C♭", 4)).toEqual(["C♭", 4, 0]);
    });

    test("F♭ is its own pitch, 41 cents above E", () => {
        const [name, octave] = note("F♭", 4);
        const cents =
            1200 *
            Math.log2(
                pitchToFrequency(name, octave, 0, "C major", MEANTONE) /
                    pitchToFrequency("E", 4, 0, "C major", MEANTONE)
            );
        expect(cents).toBeCloseTo(41.1, 1);
    });

    test("every name it lists comes back as itself", () => {
        for (const label of getTemperament(MEANTONE).noteLabels) {
            expect(note(label, 4)).toEqual([label, 4, 0]);
        }
    });

    test("ASCII accidentals and lower case are read the same", () => {
        expect(note("fb", 4)).toEqual(["F♭", 4, 0]);
        expect(note("Cb", 5)).toEqual(["C♭", 5, 0]);
        expect(note("g#", 3)).toEqual(["G♯", 3, 0]);
    });

    test("a fraction of a semitone stays cents on the same name", () => {
        expect(note("F♭", 4, 0.5)).toEqual(["F♭", 4, 50]);
        expect(note("F♭", 4, -0.25)).toEqual(["F♭", 4, -25]);
    });
});

describe("other temperaments are not affected", () => {
    test.each([
        ["equal", "F♭", ["E", 4, 0]],
        ["just intonation", "E", ["E", 4, 0]],
        ["1/3 comma meantone", "E♯", ["E♯", 4, 0]]
    ])("%s: %s4", (temperament, name, expected) => {
        expect(note(name, 4, 0, temperament)).toEqual(expected);
    });
});
