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
 * Scalar step (Singer.addScalarTransposition) in 1/4-comma meantone walks the scale buildScale
 * spells for its 21 pitches, through the real musicutils. With the 12-EDO step pattern
 * stretched over the 21-name table, C major stepped C D E♭ E♯ G♭ A B.
 */

const musicUtils = require("../utils/musicutils");
Object.assign(global, musicUtils);
global.last = array => (array && array.length > 0 ? array[array.length - 1] : null);
global.DEFAULTVOLUME = 100;
global.DEFAULTVOICE = "electronic synth";

const Singer = require("../turtle-singer");

const stepThrough = (keySignature, temperament, direction) => {
    const turtle = { singer: null };
    turtle.singer = new Singer(turtle);
    turtle.singer.keySignature = keySignature;
    turtle.singer.movable = false;
    const activity = { turtles: { ithTurtle: () => turtle }, errorMsg: jest.fn() };
    const logo = { activity, synth: { inTemperament: temperament } };
    const tonic = keySignature.split(" ")[0];
    const notes = [];
    for (let step = 0; step <= 7; step++) {
        const [note, octave] = Singer.addScalarTransposition(logo, 0, tonic, 4, direction * step);
        notes.push(note + octave);
    }
    return notes;
};

describe("scalar steps in 1/4-comma meantone", () => {
    test.each([
        ["C major", "C4 D4 E4 F4 G4 A4 B4 C5", "C4 B3 A3 G3 F3 E3 D3 C3"],
        ["G major", "G4 A4 B4 C5 D5 E5 F♯5 G5", "G4 F♯4 E4 D4 C4 B3 A3 G3"],
        ["F major", "F4 G4 A4 B♭4 C5 D5 E5 F5", "F4 E4 D4 C4 B♭3 A3 G3 F3"],
        ["D major", "D4 E4 F♯4 G4 A4 B4 C♯5 D5", "D4 C♯4 B3 A3 G3 F♯3 E3 D3"],
        ["A minor", "A4 B4 C5 D5 E5 F5 G5 A5", "A4 G4 F4 E4 D4 C4 B3 A3"]
    ])("%s steps through its scale up and down", (keySignature, up, down) => {
        expect(stepThrough(keySignature, "1/4 comma meantone", 1).join(" ")).toBe(up);
        expect(stepThrough(keySignature, "1/4 comma meantone", -1).join(" ")).toBe(down);
    });

    test("1/3-comma meantone and 12 EDO step the same scale", () => {
        for (const temperament of ["equal", "1/3 comma meantone"]) {
            expect(stepThrough("G major", temperament, 1).join(" ")).toBe(
                "G4 A4 B4 C5 D5 E5 F♯5 G5"
            );
        }
    });
});
