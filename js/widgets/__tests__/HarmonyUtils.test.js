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

describe("HarmonyUtils.findParallels", () => {
    // 12-EDO frequency of a MIDI note number.
    const midi = number => edo(number - 69);
    const voice = (id, number, label = String(number)) => ({
        voice: id,
        label,
        frequency: midi(number)
    });
    const kinds = (before, after) =>
        HarmonyUtils.findParallels(before, after).map(parallel => parallel.kind);

    it("finds parallel fifths when both voices move up", () => {
        const result = HarmonyUtils.findParallels(
            [voice(1, 60, "C4"), voice(2, 67, "G4")],
            [voice(1, 62, "D4"), voice(2, 69, "A4")]
        );
        expect(result).toEqual([
            { kind: "fifths", voices: [1, 2], from: ["C4", "G4"], to: ["D4", "A4"] }
        ]);
    });

    it("finds parallel octaves and unisons, compound intervals included", () => {
        expect(kinds([voice(1, 48), voice(2, 60)], [voice(1, 50), voice(2, 62)])).toEqual([
            "octaves"
        ]);
        expect(kinds([voice(1, 48), voice(2, 72)], [voice(1, 47), voice(2, 71)])).toEqual([
            "octaves"
        ]);
        expect(kinds([voice(1, 60), voice(2, 60)], [voice(1, 62), voice(2, 62)])).toEqual([
            "unisons"
        ]);
        // A twelfth moving to a twelfth is a compound fifth.
        expect(kinds([voice(1, 48), voice(2, 67)], [voice(1, 50), voice(2, 69)])).toEqual([
            "fifths"
        ]);
        // Unison to octave: both are octaves of each other.
        expect(kinds([voice(1, 60), voice(2, 60)], [voice(1, 62), voice(2, 74)])).toEqual([
            "octaves"
        ]);
    });

    it("ignores contrary and oblique motion", () => {
        // C4/G4 to D4/G3: a fifth to a fifth, but the voices move apart.
        expect(kinds([voice(1, 60), voice(2, 67)], [voice(1, 62), voice(2, 55)])).toEqual([]);
        // The upper voice holds its note.
        expect(kinds([voice(1, 60), voice(2, 67)], [voice(1, 55), voice(2, 67)])).toEqual([]);
    });

    it("ignores other intervals and unequal fifths", () => {
        // Fourths, thirds, and a diminished fifth moving to a perfect fifth.
        expect(kinds([voice(1, 60), voice(2, 65)], [voice(1, 62), voice(2, 67)])).toEqual([]);
        expect(kinds([voice(1, 60), voice(2, 64)], [voice(1, 62), voice(2, 65)])).toEqual([]);
        expect(kinds([voice(1, 71), voice(2, 77)], [voice(1, 72), voice(2, 79)])).toEqual([]);
    });

    it("counts just-tuned fifths as fifths", () => {
        const before = [
            { voice: 1, label: "a", frequency: 200 },
            { voice: 2, label: "b", frequency: 300 }
        ];
        const after = [
            { voice: 1, label: "c", frequency: 225 },
            { voice: 2, label: "d", frequency: 337.5 }
        ];
        expect(kinds(before, after)).toEqual(["fifths"]);
    });

    it("counts tempered fifths but not the neighbouring steps of finer temperaments", () => {
        // Voice 1 moves up one step of an n-EDO; voice 2 sits `size` steps above.
        const moveInEdo = (n, size, step = 1) => {
            const pitch = steps => ({
                voice: 0,
                label: "",
                frequency: 200 * Math.pow(2, steps / n)
            });
            return kinds(
                [Object.assign(pitch(0), { voice: 1 }), Object.assign(pitch(size), { voice: 2 })],
                [
                    Object.assign(pitch(step), { voice: 1 }),
                    Object.assign(pitch(size + step), { voice: 2 })
                ]
            );
        };
        expect(moveInEdo(19, 11)).toEqual(["fifths"]); // 695 cents
        expect(moveInEdo(31, 18)).toEqual(["fifths"]); // 697 cents
        expect(moveInEdo(5, 3)).toEqual(["fifths"]); // 720 cents
        expect(moveInEdo(7, 4)).toEqual(["fifths"]); // 686 cents
        expect(moveInEdo(31, 17)).toEqual([]); // 658 cents
        expect(moveInEdo(31, 19)).toEqual([]); // 735 cents
        // One 31-EDO step (39 cents) is a move; both voices make it.
        expect(moveInEdo(31, 31)).toEqual(["octaves"]);
        // The meantone wolf fifth (737 cents) is not a fifth.
        expect(
            kinds(
                [
                    { voice: 1, label: "", frequency: 200 },
                    { voice: 2, label: "", frequency: 200 * Math.pow(2, 737 / 1200) }
                ],
                [
                    { voice: 1, label: "", frequency: 210 },
                    { voice: 2, label: "", frequency: 210 * Math.pow(2, 737 / 1200) }
                ]
            )
        ).toEqual([]);
    });

    it("matches voices by id and skips voices without a valid next note", () => {
        expect(
            kinds([voice(2, 67), voice(1, 60)], [voice(1, 62), voice(2, 69), voice(3, 40)])
        ).toEqual(["fifths"]);
        expect(kinds([voice(1, 60), voice(2, 67)], [voice(1, 62)])).toEqual([]);
        expect(
            kinds(
                [voice(1, 60), voice(2, 67)],
                [voice(1, 62), { voice: 2, label: "x", frequency: NaN }]
            )
        ).toEqual([]);
        expect(HarmonyUtils.findParallels(null, undefined)).toEqual([]);
    });

    it("checks every pair of voices", () => {
        const result = HarmonyUtils.findParallels(
            [voice(1, 48), voice(2, 60), voice(3, 67)],
            [voice(1, 50), voice(2, 62), voice(3, 69)]
        );
        expect(result.map(parallel => [parallel.kind, parallel.voices])).toEqual([
            ["octaves", [1, 2]],
            ["fifths", [1, 3]],
            ["fifths", [2, 3]]
        ]);
    });

    it("agrees with the textbook rule for every two-voice move within two octaves", () => {
        // Parallel when both voices move the same way and the interval between
        // them is a perfect fifth, octave or unison (plus octaves) both times.
        const perfect = semitones => {
            const size = Math.abs(semitones);
            if (size === 0) return "unison";
            if (size % 12 === 0) return "octave";
            return size % 12 === 7 ? "fifth" : null;
        };
        const expected = (a1, b1, a2, b2) => {
            const sameWay = (a2 - a1) * (b2 - b1) > 0;
            const was = perfect(b1 - a1);
            const now = perfect(b2 - a2);
            if (!sameWay || !was || !now) return null;
            if (was === "unison" && now === "unison") return "unisons";
            if (was === "fifth" && now === "fifth") return "fifths";
            if (was !== "fifth" && now !== "fifth") return "octaves";
            return null;
        };

        let checked = 0;
        for (let a1 = 48; a1 <= 72; a1++) {
            for (let b1 = 48; b1 <= 72; b1++) {
                for (let a2 = 48; a2 <= 72; a2++) {
                    for (let b2 = 48; b2 <= 72; b2++) {
                        const want = expected(a1, b1, a2, b2);
                        const got = kinds(
                            [voice(1, a1), voice(2, b1)],
                            [voice(1, a2), voice(2, b2)]
                        );
                        if (got.length !== (want ? 1 : 0) || (want && got[0] !== want)) {
                            throw new Error(`${a1} ${b1} -> ${a2} ${b2}: ${got} != ${want}`);
                        }
                        checked++;
                    }
                }
            }
        }
        expect(checked).toBe(25 ** 4);
    });
});
