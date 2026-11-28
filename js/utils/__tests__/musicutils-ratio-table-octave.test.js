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
 * The octave of a C♭ in 1/4-comma meantone, whose table lists C♭ (1124 cents) at the top of
 * each row. C♭5 is the pitch just below C5, as in 12 EDO and in the synth's own note table.
 */

global._ = str => str;

const {
    pitchToFrequency,
    frequencyToPitch,
    numberToPitch,
    getTemperament,
    ratioTableOctaveShift
} = require("../musicutils");

const MEANTONE = "1/4 comma meantone";
const centsAboveC4 = (note, octave, temperament = MEANTONE) =>
    1200 *
    Math.log2(
        pitchToFrequency(note, octave, 0, "C major", temperament) /
            pitchToFrequency("C", 4, 0, "C major", temperament)
    );

describe("C♭ in 1/4-comma meantone", () => {
    test("C♭4 is just below C4 and C♭5 just below C5", () => {
        // Seven meantone fifths below C: 76 cents under the C above it.
        expect(centsAboveC4("C♭", 4)).toBeCloseTo(-76.0, 1);
        expect(centsAboveC4("C♭", 5)).toBeCloseTo(1124.0, 1);
    });

    test("it sits where 12 EDO puts C♭: below its own C", () => {
        expect(centsAboveC4("C♭", 4, "equal")).toBeCloseTo(-100, 6);
        expect(centsAboveC4("C♭", 4)).toBeLessThan(0);
    });

    test("B♯ and every other label keep their octave", () => {
        expect(centsAboveC4("B♯", 4)).toBeCloseTo(1158.9, 1);
        expect(centsAboveC4("B", 4)).toBeCloseTo(1082.9, 1);
        expect(centsAboveC4("F♭", 4)).toBeCloseTo(427.4, 1);
    });

    test("frequencyToPitch names the pitch just below C5 C♭5", () => {
        const hz = pitchToFrequency("C", 5, 0, "C major", MEANTONE) * Math.pow(2, -76.0 / 1200);
        const [note, octave, cents] = frequencyToPitch(hz, MEANTONE);
        expect([note, octave]).toEqual(["C♭", 5]);
        expect(Math.abs(cents)).toBeLessThan(0.5);
    });

    test("pitch numbers count C♭ in the octave it is written in", () => {
        // From C4, the table's row is C … B, C♭, B♯: its 20th pitch is C♭5.
        const t = getTemperament(MEANTONE);
        const index = t.noteLabels.indexOf("C♭");
        expect(numberToPitch(index, MEANTONE, "C4", 0)).toEqual(["C♭", 5]);
        expect(numberToPitch(index + 1, MEANTONE, "C4", 0)).toEqual(["B♯", 4]);
    });

    test.each([3, 4, 5])("every label in octave %i names itself back", octave => {
        for (const label of getTemperament(MEANTONE).noteLabels) {
            const hz = pitchToFrequency(label, octave, 0, "C major", MEANTONE);
            expect(frequencyToPitch(hz, MEANTONE).slice(0, 2)).toEqual([label, octave]);
        }
    });
});

describe("ratioTableOctaveShift", () => {
    test.each([
        ["C♭", 1.91, 1],
        ["C𝄫", 1.82, 1],
        ["Cb", 1.91, 1],
        ["B♯", 1.95, 0],
        ["B♯", 1.02, -1],
        ["C♯", 1.04, 0],
        ["C", 1, 0],
        ["E♭", 1.2, 0],
        ["F♭", 1.28, 0]
    ])("%s at ratio %f moves %i octave(s)", (label, ratio, shift) => {
        expect(ratioTableOctaveShift(label, ratio)).toBe(shift);
    });
});

describe("pitch numbers in a ratio temperament that starts away from C", () => {
    // Set Temperament can start a temperament on any pitch (just intonation tuned to A,
    // say); pitch numbers then count from that pitch, and the octave still changes at C.
    const rising = (temperament, start) => {
        let previous = 0;
        for (let n = -30; n <= 30; n++) {
            const [note, octave] = numberToPitch(n, temperament, start, 0);
            const hertz = pitchToFrequency(note, octave, 0, "C major", temperament);
            if (!(hertz > previous)) {
                return `${n}: ${note}${octave}`;
            }
            previous = hertz;
        }
        return "rising";
    };

    test.each([
        ["just intonation", "A4"],
        ["just intonation", "F#4"],
        ["Pythagorean", "D4"],
        ["1/3 comma meantone", "A4"],
        [MEANTONE, "G3"],
        [MEANTONE, "C4"]
    ])("%s from %s rises with every pitch number", (temperament, start) => {
        expect(rising(temperament, start)).toBe("rising");
    });

    test("the pitch after B is in the next octave", () => {
        expect(numberToPitch(3, "just intonation", "A4", 0)).toEqual(["C", 5]);
        expect(numberToPitch(-1, "just intonation", "C4", 0)).toEqual(["B", 3]);
    });

    test("a sharp start is found in a table that writes sharps as #", () => {
        expect(numberToPitch(0, "just intonation", "F#4", 0)).toEqual(["F#", 4]);
        expect(numberToPitch(0, "just intonation", "F♯4", 0)).toEqual(["F#", 4]);
    });
});
