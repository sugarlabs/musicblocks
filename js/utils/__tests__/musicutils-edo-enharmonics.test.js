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

const { getNote } = require("../musicutils");

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
});
