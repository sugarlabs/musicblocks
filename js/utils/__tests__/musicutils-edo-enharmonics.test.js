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

global._ = str => str;

const { getNote, generateNoteNames } = require("../musicutils");
const { _edoEnharmonicSlot } = require("../musicutils-pitchscale");

describe("getNote: enharmonics outside 12 EDO", () => {
    const note = (name, temperament) =>
        getNote(name, 4, 0, "C major", false, null, () => {}, temperament).slice(0, 2);

    it("plays F♭ and C♭ at E♯ and B♯ in 19 EDO, not at E and B", () => {
        // The 19-EDO table writes that pitch E♯; the 12-EDO fallback made F♭ an E.
        expect(note("F♭", "equal19")).toEqual(["E♯", 4]);
        expect(note("C♭", "equal19")).toEqual(["B♯", 3]);
        expect(note("F♭", "1/3 comma meantone")).toEqual(["E♯", 4]);
    });

    it("reads fixed-Do solfege with an accidental as that letter and accidental", () => {
        // mi♯ is E♯, not E plus a 12-EDO semitone (F).
        expect(note("mi♯", "equal19")).toEqual(["E♯", 4]);
        expect(note("fa♭", "equal19")).toEqual(["E♯", 4]);
        expect(note("ti♯", "equal19")).toEqual(["B♯", 4]);
        expect(note("do♭", "equal19")).toEqual(["B♯", 3]);
        expect(note("mi♯", "equal31")).toEqual(["E♯", 4]);
        expect(note("fa♭", "equal31")).toEqual(["F♭", 4]);
        expect(note("fa♯", "equal19")).toEqual(["F♯", 4]);
    });

    it("leaves 12 EDO and tables that don't space accidentals as meantone alone", () => {
        expect(note("F♭", "equal")).toEqual(["E", 4]);
        expect(note("mi♯", "equal")).toEqual(["F", 4]);
        expect(note("E♯", "equal17")).toEqual(["F", 4]);
        expect(note("F♭", "equal17")).toEqual(["E", 4]);
    });

    it("keeps C♭ in the lowest octave there is", () => {
        // C♭2 is B♯1, but C♭1 can't go to octave 0: the clamp holds it at
        // octave 1, as it holds B0.
        const lowest = (name, octave) =>
            getNote(name, octave, 0, "C major", false, null, () => {}, "equal19").slice(0, 2);
        expect(lowest("C♭", 2)).toEqual(["B♯", 1]);
        expect(lowest("C♭", 1)).toEqual(["B♯", 1]);
        expect(lowest("B", 0)).toEqual(["B", 1]);
    });
});

describe("_edoEnharmonicSlot", () => {
    const edo19 = generateNoteNames(19);

    it("finds a missing single sharp or flat one chromatic step from its letter", () => {
        expect(_edoEnharmonicSlot(edo19, "F♭")).toEqual(["E♯", 0]);
        expect(_edoEnharmonicSlot(edo19, "C♭")).toEqual(["B♯", -1]);
    });

    it("gives up on what it can't place", () => {
        expect(_edoEnharmonicSlot([], "C♭")).toBeNull();
        // Without C, D, E and F there is no chromatic step to measure.
        expect(_edoEnharmonicSlot(["G", "A", "B"], "C♭")).toBeNull();
        // Only one sharp or flat: naturals and double accidentals go elsewhere.
        expect(_edoEnharmonicSlot(edo19, "C")).toBeNull();
        expect(_edoEnharmonicSlot(edo19, "C𝄪")).toBeNull();
        expect(_edoEnharmonicSlot(edo19, "H♯")).toBeNull();
    });
});
