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

describe("HarmonyUtils.classifyConsonance", () => {
    const midi = number => edo(number - 69);
    const classify = (low, high) =>
        HarmonyUtils.classifyConsonance(HarmonyUtils.describeInterval(low, high));

    it("follows the counterpoint table for every 12-EDO interval up to three octaves", () => {
        const table = {
            0: "perfect",
            1: "dissonant",
            2: "dissonant",
            3: "imperfect",
            4: "imperfect",
            5: "dissonant", // a fourth above the bass
            6: "dissonant",
            7: "perfect",
            8: "imperfect",
            9: "imperfect",
            10: "dissonant",
            11: "dissonant"
        };
        for (let semitones = 0; semitones <= 36; semitones++) {
            expect([semitones, classify(midi(60), midi(60 + semitones))]).toEqual([
                semitones,
                table[semitones % 12]
            ]);
        }
    });

    it("classifies just intervals the same way", () => {
        expect(classify(200, 300)).toBe("perfect"); // 3:2
        expect(classify(200, 250)).toBe("imperfect"); // 5:4
        expect(classify(200, 320)).toBe("imperfect"); // 8:5
        expect(classify(300, 400)).toBe("dissonant"); // 4:3
        expect(classify(200, 400)).toBe("perfect"); // 2:1
    });

    it("counts tempered fifths but not the neighbouring steps of 31-EDO", () => {
        const step = (n, size) => classify(200, 200 * Math.pow(2, size / n));
        expect(step(19, 11)).toBe("perfect"); // 695 cents
        expect(step(31, 18)).toBe("perfect"); // 697 cents
        expect(step(31, 17)).toBe("dissonant"); // 658 cents, nearest semitone a fifth
        expect(step(31, 19)).toBe("dissonant"); // 735 cents
        expect(step(31, 1)).toBe("dissonant"); // 39 cents, nearest semitone a unison
    });

    it("returns null for an invalid interval", () => {
        expect(HarmonyUtils.classifyConsonance(null)).toBeNull();
        expect(HarmonyUtils.classifyConsonance({ played: NaN, semitones: 7 })).toBeNull();
    });
});

describe("HarmonyUtils.findHiddenPerfects", () => {
    const midi = number => edo(number - 69);
    const voice = (id, number, label = String(number)) => ({
        voice: id,
        label,
        frequency: midi(number)
    });
    const kinds = (before, after) =>
        HarmonyUtils.findHiddenPerfects(before, after).map(hidden => hidden.kind);

    it("finds hidden fifths when the upper voice leaps", () => {
        // C4/E4 to D4/A4: both up, into a fifth, the upper voice by a fourth.
        const result = HarmonyUtils.findHiddenPerfects(
            [voice(2, 64, "E4"), voice(1, 60, "C4")],
            [voice(1, 62, "D4"), voice(2, 69, "A4")]
        );
        expect(result).toEqual([
            {
                kind: "fifths",
                voices: [1, 2],
                from: ["C4", "E4"],
                to: ["D4", "A4"],
                frequencies: [midi(62), midi(69)]
            }
        ]);
    });

    it("finds hidden octaves, and fifths from an octave or as a twelfth", () => {
        // A3/F4 to C4/C5: into an octave, the upper voice by a fifth.
        expect(kinds([voice(1, 57), voice(2, 65)], [voice(1, 60), voice(2, 72)])).toEqual([
            "octaves"
        ]);
        // D3/E4 to E3/B4: a twelfth reached the same way is a hidden fifth.
        expect(kinds([voice(1, 50), voice(2, 64)], [voice(1, 52), voice(2, 71)])).toEqual([
            "fifths"
        ]);
        // G3/G4 to A3/E5: from an octave into a twelfth.
        expect(kinds([voice(1, 55), voice(2, 67)], [voice(1, 57), voice(2, 76)])).toEqual([
            "fifths"
        ]);
    });

    it("allows the upper voice to move by step", () => {
        // A3/B4 to C4/C5 (a semitone), G3/Bb4 to A3/C5 (a whole tone).
        expect(kinds([voice(1, 57), voice(2, 71)], [voice(1, 60), voice(2, 72)])).toEqual([]);
        expect(kinds([voice(1, 55), voice(2, 70)], [voice(1, 57), voice(2, 72)])).toEqual([]);
    });

    it("ignores contrary, oblique and parallel motion and crossing voices", () => {
        // Contrary motion into a fifth: C4/E5 to E4/B4.
        expect(kinds([voice(1, 60), voice(2, 76)], [voice(1, 64), voice(2, 71)])).toEqual([]);
        // The lower voice holds.
        expect(kinds([voice(1, 62), voice(2, 64)], [voice(1, 62), voice(2, 69)])).toEqual([]);
        // Already a fifth: parallel fifths, which findParallels() reports.
        expect(kinds([voice(1, 60), voice(2, 67)], [voice(1, 64), voice(2, 71)])).toEqual([]);
        // Unison to octave: parallel octaves.
        expect(kinds([voice(1, 60), voice(2, 60)], [voice(1, 62), voice(2, 74)])).toEqual([]);
        // The voices cross.
        expect(kinds([voice(1, 60), voice(2, 62)], [voice(1, 74), voice(2, 67)])).toEqual([]);
    });

    it("does not count a 31-EDO step near a fifth as a fifth", () => {
        const cents = (id, size) => ({
            voice: id,
            label: "",
            frequency: 200 * Math.pow(2, size / 1200)
        });
        // Both voices up, the upper by 358 cents, into a 658-cent interval.
        expect(kinds([cents(1, 0), cents(2, 400)], [cents(1, 100), cents(2, 758)])).toEqual([]);
        // The same move into a 697-cent 31-EDO fifth is a hidden fifth.
        expect(kinds([cents(1, 0), cents(2, 400)], [cents(1, 100), cents(2, 797)])).toEqual([
            "fifths"
        ]);
    });

    it("finds the same hidden fifth from a unison whichever voice is listed first", () => {
        // C4/C4 to D4/A4: both up, into a fifth, the upper voice by a sixth.
        const up = [voice(1, 60), voice(2, 60)];
        expect(kinds(up, [voice(1, 62), voice(2, 69)])).toEqual(["fifths"]);
        expect(kinds(up, [voice(1, 69), voice(2, 62)])).toEqual(["fifths"]);
    });

    it("needs exactly two valid voices", () => {
        expect(HarmonyUtils.findHiddenPerfects(null, [])).toEqual([]);
        expect(kinds([voice(1, 60)], [voice(1, 62)])).toEqual([]);
        expect(kinds([voice(1, 60), voice(2, 64)], [voice(1, 62)])).toEqual([]);
        expect(
            kinds([voice(1, 60), voice(2, 64)], [voice(1, 62), { voice: 2, frequency: NaN }])
        ).toEqual([]);
    });

    it("agrees with the textbook rule for every two-voice move within two octaves", () => {
        // In semitones: both voices move the same way without crossing, into a
        // fifth or octave (compound included) they did not form before, and
        // the upper voice leaps (three semitones or more).
        const perfect = size => {
            if (size === 0) return "unison";
            if (size % 12 === 0) return "octave";
            return size % 12 === 7 ? "fifth" : null;
        };
        const expected = (a1, b1, a2, b2) => {
            // From a unison, the lower voice is the one that ends lower.
            const [low1, high1, low2, high2] =
                a1 < b1 || (a1 === b1 && a2 <= b2) ? [a1, b1, a2, b2] : [b1, a1, b2, a2];
            if (low2 >= high2) return null;
            const lowMove = low2 - low1;
            const highMove = high2 - high1;
            if (lowMove * highMove <= 0 || Math.abs(highMove) < 3) return null;
            const was = perfect(high1 - low1);
            const now = perfect(high2 - low2);
            if (now === "fifth" && was !== "fifth") return "fifths";
            if (now === "octave" && was !== "octave" && was !== "unison") return "octaves";
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

describe("HarmonyUtils.noteToPitchClass", () => {
    it("converts standard note names to pitch classes (0-11)", () => {
        expect(HarmonyUtils.noteToPitchClass("C")).toBe(0);
        expect(HarmonyUtils.noteToPitchClass("C#")).toBe(1);
        expect(HarmonyUtils.noteToPitchClass("Db")).toBe(1);
        expect(HarmonyUtils.noteToPitchClass("D")).toBe(2);
        expect(HarmonyUtils.noteToPitchClass("D#")).toBe(3);
        expect(HarmonyUtils.noteToPitchClass("Eb")).toBe(3);
        expect(HarmonyUtils.noteToPitchClass("E")).toBe(4);
        expect(HarmonyUtils.noteToPitchClass("F")).toBe(5);
        expect(HarmonyUtils.noteToPitchClass("F#")).toBe(6);
        expect(HarmonyUtils.noteToPitchClass("Gb")).toBe(6);
        expect(HarmonyUtils.noteToPitchClass("G")).toBe(7);
        expect(HarmonyUtils.noteToPitchClass("G#")).toBe(8);
        expect(HarmonyUtils.noteToPitchClass("Ab")).toBe(8);
        expect(HarmonyUtils.noteToPitchClass("A")).toBe(9);
        expect(HarmonyUtils.noteToPitchClass("A#")).toBe(10);
        expect(HarmonyUtils.noteToPitchClass("Bb")).toBe(10);
        expect(HarmonyUtils.noteToPitchClass("B")).toBe(11);
    });

    it("strips octaves and normalizes accidentals", () => {
        expect(HarmonyUtils.noteToPitchClass("C4")).toBe(0);
        expect(HarmonyUtils.noteToPitchClass("G3")).toBe(7);
        expect(HarmonyUtils.noteToPitchClass("F♯5")).toBe(6);
        expect(HarmonyUtils.noteToPitchClass("B♭2")).toBe(10);
        expect(HarmonyUtils.noteToPitchClass("A-1")).toBe(9);
    });

    it("parses frequencies in Hz", () => {
        expect(HarmonyUtils.noteToPitchClass("440Hz")).toBe(9); // A
        expect(HarmonyUtils.noteToPitchClass("261.63Hz")).toBe(0); // C
    });

    it("parses Solfege syllables", () => {
        expect(HarmonyUtils.noteToPitchClass("Do")).toBe(0);
        expect(HarmonyUtils.noteToPitchClass("Re")).toBe(2);
        expect(HarmonyUtils.noteToPitchClass("Mi")).toBe(4);
        expect(HarmonyUtils.noteToPitchClass("Fa")).toBe(5);
        expect(HarmonyUtils.noteToPitchClass("Sol")).toBe(7);
        expect(HarmonyUtils.noteToPitchClass("La")).toBe(9);
        expect(HarmonyUtils.noteToPitchClass("Ti")).toBe(11);
    });

    it("returns null for invalid inputs", () => {
        expect(HarmonyUtils.noteToPitchClass(null)).toBeNull();
        expect(HarmonyUtils.noteToPitchClass(undefined)).toBeNull();
        expect(HarmonyUtils.noteToPitchClass("")).toBeNull();
        expect(HarmonyUtils.noteToPitchClass("invalid")).toBeNull();
        expect(HarmonyUtils.noteToPitchClass("NaNHz")).toBeNull();
    });
});

describe("HarmonyUtils.parseKey", () => {
    it("parses valid key signature strings and arrays", () => {
        expect(HarmonyUtils.parseKey("C major")).toEqual(["C", "major"]);
        expect(HarmonyUtils.parseKey("A minor")).toEqual(["A", "minor"]);
        expect(HarmonyUtils.parseKey("A natural minor")).toEqual(["A", "natural minor"]);
        expect(HarmonyUtils.parseKey("A harmonic minor")).toEqual(["A", "harmonic minor"]);
        expect(HarmonyUtils.parseKey("G")).toEqual(["G", "major"]);
        expect(HarmonyUtils.parseKey(["D", "minor"])).toEqual(["D", "minor"]);
    });

    it("returns null for nullish or empty key signatures", () => {
        expect(HarmonyUtils.parseKey(null)).toBeNull();
        expect(HarmonyUtils.parseKey(undefined)).toBeNull();
        expect(HarmonyUtils.parseKey("")).toBeNull();
    });
});

describe("HarmonyUtils.romanNumeral", () => {
    describe("Diatonic chords in major keys", () => {
        it.each([
            ["C", "major", "C major", "I", "I in C major"],
            ["D", "minor", "C major", "ii", "ii in C major"],
            ["E", "minor", "C major", "iii", "iii in C major"],
            ["F", "major", "C major", "IV", "IV in C major"],
            ["G", "major", "C major", "V", "V in C major"],
            ["G", "dominant 7th", "C major", "V7", "V7 in C major"],
            ["A", "minor", "C major", "vi", "vi in C major"],
            ["B", "diminished", "C major", "vii°", "vii° in C major"],
            ["B", "half-diminished 7th", "C major", "viiø7", "viiø7 in C major"],
            ["C", "major 7th", "C major", "Imaj7", "Imaj7 in C major"],
            ["D", "minor 7th", "C major", "ii7", "ii7 in C major"]
        ])("analyzes %s %s in %s as %s", (root, quality, key, expectedRoman, expectedFormatted) => {
            const res = HarmonyUtils.romanNumeral(root, quality, key, root);
            expect(res).not.toBeNull();
            expect(res.roman).toBe(expectedRoman);
            expect(res.formatted).toBe(expectedFormatted);
            expect(res.inversion).toBe(0);
        });
    });

    describe("Inversions", () => {
        it("identifies 1st inversion triad (3rd in bass)", () => {
            const res = HarmonyUtils.romanNumeral("C", "major", "C major", "E");
            expect(res).not.toBeNull();
            expect(res.roman).toBe("I⁶");
            expect(res.inversion).toBe(1);
            expect(res.inversionName).toBe("1st inversion");
            expect(res.figuredBass).toBe("⁶");
            expect(res.formatted).toBe("I⁶ (1st inversion) in C major");
        });

        it("identifies 2nd inversion triad (5th in bass)", () => {
            const res = HarmonyUtils.romanNumeral("C", "major", "C major", "G");
            expect(res).not.toBeNull();
            expect(res.roman).toBe("I⁶⁴");
            expect(res.inversion).toBe(2);
            expect(res.inversionName).toBe("2nd inversion");
            expect(res.figuredBass).toBe("⁶⁴");
            expect(res.formatted).toBe("I⁶⁴ (2nd inversion) in C major");
        });

        it("identifies 1st inversion seventh chord (3rd in bass)", () => {
            const res = HarmonyUtils.romanNumeral("G", "dominant 7th", "C major", "B");
            expect(res).not.toBeNull();
            expect(res.roman).toBe("V⁶₅");
            expect(res.inversion).toBe(1);
            expect(res.inversionName).toBe("1st inversion");
            expect(res.figuredBass).toBe("⁶₅");
            expect(res.formatted).toBe("V⁶₅ (1st inversion) in C major");
        });

        it("identifies 2nd inversion seventh chord (5th in bass)", () => {
            const res = HarmonyUtils.romanNumeral("G", "dominant 7th", "C major", "D");
            expect(res).not.toBeNull();
            expect(res.roman).toBe("V⁴₃");
            expect(res.inversion).toBe(2);
            expect(res.inversionName).toBe("2nd inversion");
            expect(res.figuredBass).toBe("⁴₃");
            expect(res.formatted).toBe("V⁴₃ (2nd inversion) in C major");
        });

        it("identifies 3rd inversion seventh chord (7th in bass)", () => {
            const res = HarmonyUtils.romanNumeral("G", "dominant 7th", "C major", "F");
            expect(res).not.toBeNull();
            expect(res.roman).toBe("V⁴₂");
            expect(res.inversion).toBe(3);
            expect(res.inversionName).toBe("3rd inversion");
            expect(res.figuredBass).toBe("⁴₂");
            expect(res.formatted).toBe("V⁴₂ (3rd inversion) in C major");
        });

        it("falls back to slash notation for non-chord bass notes", () => {
            const res = HarmonyUtils.romanNumeral("C", "major", "C major", "A");
            expect(res).not.toBeNull();
            expect(res.inversion).toBe(-1);
            expect(res.roman).toBe("I/A");
            expect(res.formatted).toBe("I/A in C major");
        });

        it("verifies chord membership before assigning an inversion (e.g. Eb is not in C major)", () => {
            const res = HarmonyUtils.romanNumeral("C", "major", "C major", "Eb");
            expect(res).not.toBeNull();
            expect(res.inversion).toBe(-1);
            expect(res.inversionName).toBeNull();
            expect(res.roman).toBe("I/Eb");
            expect(res.formatted).toBe("I/Eb in C major");
        });

        it("assigns 1st inversion to Eb when chord is C minor", () => {
            const res = HarmonyUtils.romanNumeral("C", "minor", "C minor", "Eb");
            expect(res).not.toBeNull();
            expect(res.inversion).toBe(1);
            expect(res.inversionName).toBe("1st inversion");
            expect(res.roman).toBe("i⁶");
            expect(res.formatted).toBe("i⁶ (1st inversion) in C minor");
        });
    });

    describe("Borrowed and chromatic chords", () => {
        it.each([
            ["Bb", "major", "C major", "♭VII", "♭VII in C major"],
            ["Ab", "major", "C major", "♭VI", "♭VI in C major"],
            ["Eb", "major", "C major", "♭III", "♭III in C major"],
            ["Db", "major", "C major", "♭II", "♭II in C major"],
            ["F#", "diminished", "C major", "♯iv°", "♯iv° in C major"]
        ])(
            "identifies %s %s in %s as %s",
            (root, quality, key, expectedRoman, expectedFormatted) => {
                const res = HarmonyUtils.romanNumeral(root, quality, key, root);
                expect(res).not.toBeNull();
                expect(res.roman).toBe(expectedRoman);
                expect(res.formatted).toBe(expectedFormatted);
            }
        );
    });

    describe("Minor keys", () => {
        it.each([
            ["A", "minor", "A minor", "i", "i in A minor"],
            ["B", "diminished", "A minor", "ii°", "ii° in A minor"],
            ["C", "major", "A minor", "III", "III in A minor"],
            ["D", "minor", "A minor", "iv", "iv in A minor"],
            ["E", "major", "A minor", "V", "V in A minor"],
            ["E", "dominant 7th", "A minor", "V7", "V7 in A minor"],
            ["F", "major", "A minor", "VI", "VI in A minor"],
            ["G", "major", "A minor", "VII", "VII in A minor"],
            ["G#", "diminished", "A minor", "vii°", "vii° in A minor"],
            ["G#", "fully-diminished 7th", "A minor", "vii°7", "vii°7 in A minor"]
        ])("analyzes %s %s in %s as %s", (root, quality, key, expectedRoman, expectedFormatted) => {
            const res = HarmonyUtils.romanNumeral(root, quality, key, root);
            expect(res).not.toBeNull();
            expect(res.roman).toBe(expectedRoman);
            expect(res.formatted).toBe(expectedFormatted);
        });

        it("handles minor key inversions", () => {
            const res = HarmonyUtils.romanNumeral("A", "minor", "A minor", "C");
            expect(res).not.toBeNull();
            expect(res.roman).toBe("i⁶");
            expect(res.inversion).toBe(1);
            expect(res.formatted).toBe("i⁶ (1st inversion) in A minor");
        });

        it("handles minor mode variants and modal keys", () => {
            expect(HarmonyUtils.romanNumeral("C", "major", "A natural minor").formatted).toBe(
                "III in A natural minor"
            );
            expect(
                HarmonyUtils.romanNumeral("G#", "diminished", "A harmonic minor").formatted
            ).toBe("vii° in A harmonic minor");
            expect(HarmonyUtils.romanNumeral("F", "major", "D dorian").formatted).toBe(
                "III in D dorian"
            );
        });
    });

    describe("Other keys", () => {
        it("analyzes chords in G major", () => {
            expect(HarmonyUtils.romanNumeral("G", "major", "G major").formatted).toBe(
                "I in G major"
            );
            expect(HarmonyUtils.romanNumeral("D", "dominant 7th", "G major").formatted).toBe(
                "V7 in G major"
            );
            expect(HarmonyUtils.romanNumeral("C", "major", "G major").formatted).toBe(
                "IV in G major"
            );
        });

        it("analyzes chords in F major", () => {
            expect(HarmonyUtils.romanNumeral("F", "major", "F major").formatted).toBe(
                "I in F major"
            );
            expect(HarmonyUtils.romanNumeral("Bb", "major", "F major").formatted).toBe(
                "IV in F major"
            );
            expect(HarmonyUtils.romanNumeral("C", "dominant 7th", "F major").formatted).toBe(
                "V7 in F major"
            );
        });

        it("analyzes chords in D minor", () => {
            expect(HarmonyUtils.romanNumeral("D", "minor", "D minor").formatted).toBe(
                "i in D minor"
            );
            expect(HarmonyUtils.romanNumeral("A", "dominant 7th", "D minor").formatted).toBe(
                "V7 in D minor"
            );
            expect(HarmonyUtils.romanNumeral("Bb", "major", "D minor").formatted).toBe(
                "VI in D minor"
            );
        });
    });

    describe("Defensive edge cases", () => {
        it("returns null for missing, null, or empty arguments", () => {
            expect(HarmonyUtils.romanNumeral(null, "major", "C major")).toBeNull();
            expect(HarmonyUtils.romanNumeral("C", null, "C major")).toBeNull();
            expect(HarmonyUtils.romanNumeral("C", "major", null)).toBeNull();
            expect(HarmonyUtils.romanNumeral("C", "major", "")).toBeNull();
            expect(HarmonyUtils.romanNumeral(undefined, undefined, undefined)).toBeNull();
        });

        it("returns null for invalid pitch or key", () => {
            expect(HarmonyUtils.romanNumeral("invalid", "major", "C major")).toBeNull();
            expect(HarmonyUtils.romanNumeral("C", "major", "invalidKey")).toBeNull();
        });

        it("rejects unknown pitch labels even when pitchToNumber returns default numeric pitch", () => {
            const origPitchToNumber = global.pitchToNumber;
            global.pitchToNumber = jest.fn(() => 39); // In Music Blocks, unknown label returns 39 (C4)
            try {
                expect(HarmonyUtils.noteToPitchClass("invalid")).toBeNull();
                expect(HarmonyUtils.noteToPitchClass("foo")).toBeNull();
                expect(HarmonyUtils.noteToPitchClass("Cxyz")).toBeNull();
                expect(HarmonyUtils.romanNumeral("invalid", "major", "C major")).toBeNull();
            } finally {
                global.pitchToNumber = origPitchToNumber;
            }
        });

        it("normalizes natural signs in note labels (♮ and natural)", () => {
            expect(HarmonyUtils.noteToPitchClass("C♮")).toBe(0);
            expect(HarmonyUtils.noteToPitchClass("C♮4")).toBe(0);
            expect(HarmonyUtils.noteToPitchClass("Cnatural")).toBe(0);
            expect(HarmonyUtils.noteToPitchClass("F♮")).toBe(5);
        });

        it("handles array keys before keySignatureToMode fallback", () => {
            const origKeySigToMode = global.keySignatureToMode;
            // In browser runtime, keySignatureToMode defaults non-string inputs to ["C", "major"]
            global.keySignatureToMode = jest.fn(key => {
                if (typeof key !== "string") {
                    return ["C", "major"];
                }
                return ["C", "major"];
            });
            try {
                expect(HarmonyUtils.parseKey(["D", "minor"])).toEqual(["D", "minor"]);
                expect(HarmonyUtils.parseKey(["invalid", "minor"])).toBeNull();
            } finally {
                global.keySignatureToMode = origKeySigToMode;
            }
        });

        it("does not accept default keySignatureToMode result for invalid key strings", () => {
            const origKeySigToMode = global.keySignatureToMode;
            global.keySignatureToMode = jest.fn(() => ["C", "major"]);
            try {
                expect(HarmonyUtils.parseKey("invalidKey")).toBeNull();
                expect(HarmonyUtils.romanNumeral("C", "major", "invalidKey")).toBeNull();
            } finally {
                global.keySignatureToMode = origKeySigToMode;
            }
        });

        it("handles note labels with octave numbers and Hz strings", () => {
            const res1 = HarmonyUtils.romanNumeral("C4", "major", "C major", "C4");
            expect(res1).not.toBeNull();
            expect(res1.roman).toBe("I");

            const res2 = HarmonyUtils.romanNumeral("261.63Hz", "major", "C major", "261.63Hz");
            expect(res2).not.toBeNull();
            expect(res2.roman).toBe("I");
        });
    });
});
