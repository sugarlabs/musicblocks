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
 * Pitch number 0 is C4 (or the pitch given to Set pitch number offset) in every temperament.
 * Pitch numbers count steps of the temperament, so the offset has to be counted in the same
 * steps: a fixed 39 is C4 only in twelve-note temperaments. Uses the real musicutils.
 */

const musicUtils = require("../utils/musicutils");
Object.assign(global, musicUtils);
global.last = array => (array && array.length > 0 ? array[array.length - 1] : null);
global.DEFAULTVOLUME = 100;
global.DEFAULTVOICE = "electronic synth";

const Singer = require("../turtle-singer");

const singerIn = temperament => {
    const activity = { logo: { synth: { inTemperament: temperament, startingPitch: "C4" } } };
    const turtle = { activity };
    turtle.singer = new Singer(turtle);
    return turtle.singer;
};

// What the Pitch Number block plays (PitchActions.playPitchNumber).
const pitchNumberToPitch = (singer, n) => {
    const synth = singer.turtle.activity.logo.synth;
    return numberToPitch(
        n + singer.pitchNumberOffset,
        synth.inTemperament,
        synth.startingPitch,
        singer.pitchNumberOffset
    );
};

const TEMPERAMENTS = [
    "equal",
    "equal19",
    "equal31",
    "just intonation",
    "1/3 comma meantone",
    "1/4 comma meantone"
];

describe("pitch number 0 is C4 in every temperament", () => {
    test("the offset is C4 counted in the current temperament", () => {
        expect(singerIn("equal").pitchNumberOffset).toBe(39);
        expect(singerIn("equal19").pitchNumberOffset).toBe(
            pitchToNumber("C", 4, "C major", "equal19")
        );
        expect(singerIn("equal31").pitchNumberOffset).toBe(
            pitchToNumber("C", 4, "C major", "equal31")
        );
    });

    test.each(TEMPERAMENTS)("%s: pitch number 0 is C4", temperament => {
        expect(pitchNumberToPitch(singerIn(temperament), 0)).toEqual(["C", 4]);
    });

    test.each(TEMPERAMENTS)("%s: one octave of pitch numbers rises from C4 to C5", temperament => {
        const singer = singerIn(temperament);
        const steps = getCurrentEDO(temperament);
        let previous = 0;
        for (let n = 0; n <= steps; n++) {
            const [note, octave] = pitchNumberToPitch(singer, n);
            const hertz = pitchToFrequency(note, octave, 0, "C major", temperament);
            expect(hertz).toBeGreaterThan(previous);
            previous = hertz;
        }
        expect(pitchNumberToPitch(singer, steps)).toEqual(["C", 5]);
    });

    test("the C4 reporter reads 0 outside 12 EDO too", () => {
        // PitchBlocks' pitch number reporter: pitchToNumber(current pitch) - offset.
        const singer = singerIn("equal19");
        expect(pitchToNumber("C", 4, "C major", "equal19") - singer.pitchNumberOffset).toBe(0);
    });
});

describe("the offset follows the temperament", () => {
    test("Set pitch number offset keeps its pitch when the temperament changes", () => {
        const singer = singerIn("equal19");
        singer.setPitchNumberOffsetPitch("G", 3, "C major");
        expect(pitchNumberToPitch(singer, 0)).toEqual(["G", 3]);

        singer.turtle.activity.logo.synth.inTemperament = "equal31";
        expect(singer.pitchNumberOffset).toBe(pitchToNumber("G", 3, "C major", "equal31"));
        expect(pitchNumberToPitch(singer, 0)).toEqual(["G", 3]);
    });

    test("a number assigned directly is used as it is", () => {
        const singer = singerIn("equal19");
        singer.pitchNumberOffset = 40;
        expect(singer.pitchNumberOffset).toBe(40);
    });

    test("reset makes C4 pitch number 0 again", () => {
        const singer = singerIn("equal19");
        singer.pitchNumberOffset = 40;
        singer.reset();
        expect(pitchNumberToPitch(singer, 0)).toEqual(["C", 4]);
    });
});
