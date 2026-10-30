/**
 * @license
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

const { TextEncoder } = require("util");

global.TextEncoder = TextEncoder;
global._ = jest.fn(str => str);

const constants = require("../../utils/musicutils-constants");
const modecore = require("../../utils/musicutils-modecore");

global.INTERVALVALUES = constants.INTERVALVALUES;
global.CHORDNAMES = constants.CHORDNAMES;
global.CHORDVALUES = modecore.CHORDVALUES;

const HarmonyUtils = require("../HarmonyUtils");

// 12-EDO frequencies, A4 = 440 Hz.
const edo = semitonesFromA4 => 440 * Math.pow(2, semitonesFromA4 / 12);
const C4 = edo(-9);
const E4 = edo(-5);
const G4 = edo(-2);

describe("HarmonyUtils.describeInterval", () => {
    it("names a 12-EDO major third and measures it against 5:4", () => {
        const interval = HarmonyUtils.describeInterval(C4, E4);
        expect(interval.name).toBe("major 3");
        expect(interval.octaves).toBe(0);
        expect(interval.ideal).toBeCloseTo(1.25, 10);
        expect(interval.played).toBeCloseTo(1.2599, 4);
        expect(interval.cents).toBeCloseTo(13.69, 2);
    });

    it("measures a 12-EDO fifth as about two cents flat of 3:2", () => {
        const interval = HarmonyUtils.describeInterval(C4, G4);
        expect(interval.name).toBe("perfect 5");
        expect(interval.cents).toBeCloseTo(-1.96, 2);
    });

    it("reports zero cents for a just major third", () => {
        const interval = HarmonyUtils.describeInterval(200, 250);
        expect(interval.name).toBe("major 3");
        expect(interval.cents).toBeCloseTo(0, 10);
    });

    it("names unisons and octaves", () => {
        expect(HarmonyUtils.describeInterval(C4, C4).name).toBe("perfect 1");

        const octave = HarmonyUtils.describeInterval(C4, 2 * C4);
        expect(octave.name).toBe("perfect 8");
        expect(octave.octaves).toBe(0);
        expect(octave.cents).toBeCloseTo(0, 10);

        const twoOctaves = HarmonyUtils.describeInterval(C4, 4 * C4);
        expect(twoOctaves.name).toBe("perfect 8");
        expect(twoOctaves.octaves).toBe(1);
        expect(twoOctaves.ideal).toBeCloseTo(4, 10);
    });

    it("splits a compound interval into the simple interval plus octaves", () => {
        const tenth = HarmonyUtils.describeInterval(C4, 2 * E4);
        expect(tenth.name).toBe("major 3");
        expect(tenth.octaves).toBe(1);
        expect(tenth.ideal).toBeCloseTo(2.5, 10);
        expect(tenth.cents).toBeCloseTo(13.69, 2);
    });

    it("rounds a microtonal interval to the nearest step and keeps the offset in cents", () => {
        // 30 cents above a 12-EDO major third
        const interval = HarmonyUtils.describeInterval(C4, C4 * Math.pow(2, 430 / 1200));
        expect(interval.name).toBe("major 3");
        expect(interval.cents).toBeCloseTo(43.69, 2);
    });

    it("returns null for missing or invalid frequencies", () => {
        expect(HarmonyUtils.describeInterval(0, E4)).toBeNull();
        expect(HarmonyUtils.describeInterval(C4, -1)).toBeNull();
        expect(HarmonyUtils.describeInterval(C4, NaN)).toBeNull();
        expect(HarmonyUtils.describeInterval(Infinity, E4)).toBeNull();
        expect(HarmonyUtils.describeInterval(undefined, E4)).toBeNull();
    });
});

describe("HarmonyUtils.findChord", () => {
    it.each([
        [[0, 4, 7], "major"],
        [[0, 3, 7], "minor"],
        [[0, 4, 8], "augmented"],
        [[0, 3, 6], "diminished"],
        [[0, 4, 7, 11], "major 7th"],
        [[0, 3, 7, 10], "minor 7th"],
        [[0, 4, 7, 10], "dominant 7th"],
        [[0, 3, 7, 11], "minor-major 7th"],
        [[0, 3, 6, 9], "fully-diminished 7th"],
        [[0, 3, 6, 10], "half-diminished 7th"]
    ])("recognizes %j as %s", (pitchClasses, name) => {
        expect(HarmonyUtils.findChord(pitchClasses)).toEqual({ name, root: 0 });
    });

    it("finds the root of an inversion", () => {
        // E G C: first-inversion C major
        expect(HarmonyUtils.findChord([4, 7, 0])).toEqual({ name: "major", root: 0 });
    });

    it("ignores doubled pitch classes", () => {
        expect(HarmonyUtils.findChord([0, 4, 7, 0])).toEqual({ name: "major", root: 0 });
    });

    it("returns null for dyads and unknown shapes", () => {
        expect(HarmonyUtils.findChord([0, 4])).toBeNull();
        expect(HarmonyUtils.findChord([0, 1, 2])).toBeNull();
    });
});

describe("HarmonyUtils.analyze", () => {
    it("measures each voice against the lowest one and names the chord", () => {
        const result = HarmonyUtils.analyze([
            { label: "G4", frequency: G4 },
            { label: "C4", frequency: C4 },
            { label: "E4", frequency: E4 }
        ]);

        expect(result.voices.map(voice => voice.label)).toEqual(["C4", "E4", "G4"]);
        expect(result.intervals.map(i => [i.from, i.to, i.name])).toEqual([
            ["C4", "E4", "major 3"],
            ["C4", "G4", "perfect 5"]
        ]);
        expect(result.chord).toEqual({ name: "major", root: "C4" });
    });

    it("reports the root voice of an inverted chord", () => {
        const result = HarmonyUtils.analyze([
            { label: "E4", frequency: E4 },
            { label: "G4", frequency: G4 },
            { label: "C5", frequency: 2 * C4 }
        ]);
        expect(result.chord).toEqual({ name: "major", root: "C5" });
    });

    it("returns no intervals for a single note or silence", () => {
        expect(HarmonyUtils.analyze([{ label: "C4", frequency: C4 }])).toEqual({
            voices: [{ label: "C4", frequency: C4 }],
            intervals: [],
            chord: null
        });
        expect(HarmonyUtils.analyze([])).toEqual({ voices: [], intervals: [], chord: null });
        expect(HarmonyUtils.analyze(undefined)).toEqual({ voices: [], intervals: [], chord: null });
    });

    it("skips voices without a usable frequency", () => {
        const result = HarmonyUtils.analyze([
            { label: "C4", frequency: C4 },
            { label: "R", frequency: null },
            { label: "E4", frequency: E4 },
            null
        ]);
        expect(result.intervals).toHaveLength(1);
        expect(result.intervals[0].name).toBe("major 3");
        expect(result.chord).toBeNull();
    });
});
