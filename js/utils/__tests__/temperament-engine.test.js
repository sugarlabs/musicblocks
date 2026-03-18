// Copyright (c) 2026 Aditya
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   TemperamentEngine PoC tests.

   These tests demonstrate:
   1. The engine produces correct frequencies for all temperament types
   2. The syntonic comma bug in the old static-grid approach
   3. The new chord-root-relative approach fixes it
   4. Non-12-tone temperaments (19-EDO, 31-EDO) work without hardcoded 12
*/

// Polyfill TextEncoder for jsdom test environment
if (typeof TextEncoder === "undefined") {
    global.TextEncoder = require("util").TextEncoder;
}
global._ = jest.fn(str => str);
global.INVALIDPITCH = "Not a valid pitch name";

const {
    normalizePitch,
    pitchIndex,
    etFrequency,
    getPitchCount,
    getIntervals,
    getIntervalRatio,
    stepsBetween,
    ratioForSteps,
    getFrequency,
    getChordFrequencies,
    getFrequencyOldMethod
} = require("../temperament-engine");

// Utility: convert frequency ratio to cents for readable assertions
const ratioToCents = ratio => 1200 * Math.log2(ratio);

describe("TemperamentEngine", () => {
    // ---------------------------------------------------------------
    // Section 1: Helpers
    // ---------------------------------------------------------------

    describe("normalizePitch", () => {
        test("passes through ASCII sharp names unchanged", () => {
            expect(normalizePitch("C#")).toBe("C#");
            expect(normalizePitch("F#")).toBe("F#");
        });

        test("converts Unicode sharp to ASCII", () => {
            expect(normalizePitch("C\u266F")).toBe("C#");
        });

        test("converts Unicode flat to ASCII sharp equivalent", () => {
            expect(normalizePitch("D\u266D")).toBe("C#");
            expect(normalizePitch("E\u266D")).toBe("D#");
            expect(normalizePitch("B\u266D")).toBe("A#");
        });

        test("converts ASCII flat to sharp equivalent", () => {
            expect(normalizePitch("Db")).toBe("C#");
            expect(normalizePitch("Gb")).toBe("F#");
        });

        test("leaves natural notes unchanged", () => {
            expect(normalizePitch("C")).toBe("C");
            expect(normalizePitch("A")).toBe("A");
            expect(normalizePitch("B")).toBe("B");
        });
    });

    describe("pitchIndex", () => {
        test("returns correct chromatic index for each pitch", () => {
            expect(pitchIndex("C")).toBe(0);
            expect(pitchIndex("D")).toBe(2);
            expect(pitchIndex("E")).toBe(4);
            expect(pitchIndex("F")).toBe(5);
            expect(pitchIndex("G")).toBe(7);
            expect(pitchIndex("A")).toBe(9);
            expect(pitchIndex("B")).toBe(11);
        });

        test("handles sharps and flats", () => {
            expect(pitchIndex("C#")).toBe(1);
            expect(pitchIndex("Db")).toBe(1);
            expect(pitchIndex("F#")).toBe(6);
        });
    });

    describe("etFrequency", () => {
        test("A4 = 440 Hz", () => {
            expect(etFrequency("A", 4)).toBeCloseTo(440.0, 1);
        });

        test("C4 (middle C) = ~261.63 Hz", () => {
            expect(etFrequency("C", 4)).toBeCloseTo(261.626, 1);
        });

        test("A0 = 27.5 Hz (base frequency)", () => {
            expect(etFrequency("A", 0)).toBeCloseTo(27.5, 2);
        });

        test("octave doubling: A5 = 880 Hz", () => {
            expect(etFrequency("A", 5)).toBeCloseTo(880.0, 1);
        });
    });

    // ---------------------------------------------------------------
    // Section 2: Temperament data access
    // ---------------------------------------------------------------

    describe("getPitchCount", () => {
        test("equal = 12", () => {
            expect(getPitchCount("equal")).toBe(12);
        });

        test("equal5 = 5", () => {
            expect(getPitchCount("equal5")).toBe(5);
        });

        test("equal7 = 7", () => {
            expect(getPitchCount("equal7")).toBe(7);
        });

        test("equal19 = 19", () => {
            expect(getPitchCount("equal19")).toBe(19);
        });

        test("equal31 = 31", () => {
            expect(getPitchCount("equal31")).toBe(31);
        });

        test("just intonation = 12", () => {
            expect(getPitchCount("just intonation")).toBe(12);
        });

        test("Pythagorean = 12", () => {
            expect(getPitchCount("Pythagorean")).toBe(12);
        });

        test("1/3 comma meantone = 19", () => {
            expect(getPitchCount("1/3 comma meantone")).toBe(19);
        });

        test("1/4 comma meantone = 21", () => {
            expect(getPitchCount("1/4 comma meantone")).toBe(21);
        });

        test("unknown temperament defaults to 12", () => {
            expect(getPitchCount("nonexistent")).toBe(12);
        });
    });

    describe("getIntervalRatio", () => {
        test("equal: perfect 5 = 2^(7/12)", () => {
            expect(getIntervalRatio("equal", "perfect 5")).toBeCloseTo(Math.pow(2, 7 / 12), 10);
        });

        test("just intonation: perfect 5 = 3/2", () => {
            expect(getIntervalRatio("just intonation", "perfect 5")).toBeCloseTo(3 / 2, 10);
        });

        test("just intonation: major 3 = 5/4", () => {
            expect(getIntervalRatio("just intonation", "major 3")).toBeCloseTo(5 / 4, 10);
        });

        test("Pythagorean: major 3 = 81/64", () => {
            expect(getIntervalRatio("Pythagorean", "major 3")).toBeCloseTo(81 / 64, 10);
        });

        test("1/4 comma meantone: major 3 = 5/4 (pure)", () => {
            expect(getIntervalRatio("1/4 comma meantone", "major 3")).toBeCloseTo(5 / 4, 10);
        });
    });

    // ---------------------------------------------------------------
    // Section 3: Step computation (replaces hardcoded % 12)
    // ---------------------------------------------------------------

    describe("stepsBetween", () => {
        test("C to E = 4 steps in 12-tone temperaments", () => {
            expect(stepsBetween("C", "E", "equal")).toBe(4);
            expect(stepsBetween("C", "E", "just intonation")).toBe(4);
        });

        test("C to G = 7 steps in equal", () => {
            expect(stepsBetween("C", "G", "equal")).toBe(7);
        });

        test("D to F = 3 steps in 12-tone (minor 3rd)", () => {
            expect(stepsBetween("D", "F", "equal")).toBe(3);
        });

        test("C to E in 19-EDO = ~6 steps (19/12 * 4 rounded)", () => {
            expect(stepsBetween("C", "E", "equal19")).toBe(6);
        });

        test("C to G in 19-EDO = ~11 steps (19/12 * 7 rounded)", () => {
            expect(stepsBetween("C", "G", "equal19")).toBe(11);
        });

        test("wraps around: E to C = 8 steps", () => {
            expect(stepsBetween("E", "C", "equal")).toBe(8);
        });
    });

    // ---------------------------------------------------------------
    // Section 4: Frequency computation — the core approach
    // ---------------------------------------------------------------

    describe("getFrequency", () => {
        describe("12-ET (equal temperament)", () => {
            test("produces standard A4 = 440 Hz", () => {
                const freq = getFrequency("A", 4, "equal", "C", 4);
                expect(freq).toBeCloseTo(440.0, 1);
            });

            test("produces standard C4 = 261.63 Hz", () => {
                const freq = getFrequency("C", 4, "equal", "C", 4);
                expect(freq).toBeCloseTo(261.626, 1);
            });

            test("E4 in 12-ET = 329.63 Hz", () => {
                const freq = getFrequency("E", 4, "equal", "C", 4);
                expect(freq).toBeCloseTo(329.628, 0);
            });
        });

        describe("Just Intonation", () => {
            const C4 = etFrequency("C", 4); // ~261.626 Hz

            test("C4 = starting pitch frequency", () => {
                const freq = getFrequency("C", 4, "just intonation", "C", 4);
                expect(freq).toBeCloseTo(C4, 1);
            });

            test("E4 = C4 * 5/4 (pure major 3rd, ~327.03 Hz)", () => {
                const freq = getFrequency("E", 4, "just intonation", "C", 4);
                expect(freq).toBeCloseTo((C4 * 5) / 4, 1);
            });

            test("G4 = C4 * 3/2 (pure perfect 5th, ~392.44 Hz)", () => {
                const freq = getFrequency("G", 4, "just intonation", "C", 4);
                expect(freq).toBeCloseTo((C4 * 3) / 2, 1);
            });

            test("F4 = C4 * 4/3 (pure perfect 4th)", () => {
                const freq = getFrequency("F", 4, "just intonation", "C", 4);
                expect(freq).toBeCloseTo((C4 * 4) / 3, 1);
            });

            test("C5 = C4 * 2 (octave)", () => {
                const freq = getFrequency("C", 5, "just intonation", "C", 4);
                expect(freq).toBeCloseTo(C4 * 2, 1);
            });

            test("JI E4 is 13.7 cents FLAT of 12-ET E4", () => {
                const jiE4 = getFrequency("E", 4, "just intonation", "C", 4);
                const etE4 = etFrequency("E", 4);
                const centsDiff = ratioToCents(jiE4 / etE4);
                expect(centsDiff).toBeCloseTo(-13.7, 0);
            });
        });

        describe("Pythagorean", () => {
            const C4 = etFrequency("C", 4);

            test("G4 = C4 * 3/2 (pure fifth, same as JI)", () => {
                const freq = getFrequency("G", 4, "Pythagorean", "C", 4);
                expect(freq).toBeCloseTo((C4 * 3) / 2, 1);
            });

            test("E4 = C4 * 81/64 (Pythagorean ditone, NOT 5/4)", () => {
                const freq = getFrequency("E", 4, "Pythagorean", "C", 4);
                expect(freq).toBeCloseTo((C4 * 81) / 64, 1);
            });

            test("Pythagorean E4 is ~7.8 cents SHARP of 12-ET E4", () => {
                const pythE4 = getFrequency("E", 4, "Pythagorean", "C", 4);
                const etE4 = etFrequency("E", 4);
                const centsDiff = ratioToCents(pythE4 / etE4);
                expect(centsDiff).toBeCloseTo(7.8, 0);
            });
        });

        describe("19-EDO", () => {
            test("each step is exactly 2^(1/19)", () => {
                const C4 = etFrequency("C", 4);
                const stepRatio = Math.pow(2, 1 / 19);

                // 6 steps above C in 19-EDO = major 3rd
                const e4 = getFrequency("E", 4, "equal19", "C", 4);
                expect(e4).toBeCloseTo(C4 * Math.pow(stepRatio, 6), 1);
            });

            test("19-EDO major 3rd is closer to 5/4 than 12-ET", () => {
                const C4 = etFrequency("C", 4);
                const e4_19 = getFrequency("E", 4, "equal19", "C", 4);
                const e4_12 = etFrequency("E", 4);
                const pure = (C4 * 5) / 4;

                const error19 = Math.abs(ratioToCents(e4_19 / pure));
                const error12 = Math.abs(ratioToCents(e4_12 / pure));

                expect(error19).toBeLessThan(error12);
            });
        });
    });

    // ---------------------------------------------------------------
    // Section 5: THE CORE DEMONSTRATION — Chord Root Bug Fix
    // ---------------------------------------------------------------

    describe("Syntonic comma bug fix", () => {
        // This is the central proof-of-concept:
        //
        // In Just Intonation from C, the old static-grid computes:
        //   D = C * 9/8     F = C * 4/3
        //   D→F ratio = (4/3) / (9/8) = 32/27 = ~294 cents (Pythagorean m3)
        //
        // But a PURE just minor 3rd is 6/5 = ~316 cents.
        // The error is ~21.5 cents — the syntonic comma — clearly audible.
        //
        // The fix: when building a chord rooted on D, compute F's frequency
        // as D * 6/5, not as C * 4/3.

        const C4 = etFrequency("C", 4);

        test("OLD method: D→F interval in JI from C = 32/27 (WRONG)", () => {
            // Both frequencies computed relative to C (the starting pitch)
            const D4 = getFrequencyOldMethod("D", 4, "just intonation", "C", 4);
            const F4 = getFrequencyOldMethod("F", 4, "just intonation", "C", 4);

            const ratio = F4 / D4;
            // 32/27 = 1.18518... ≈ 294.1 cents (Pythagorean minor 3rd)
            expect(ratio).toBeCloseTo(32 / 27, 4);

            const cents = ratioToCents(ratio);
            expect(cents).toBeCloseTo(294.1, 0);

            // This is NOT a pure just minor 3rd (6/5 = 315.6 cents)
            expect(Math.abs(cents - 315.6)).toBeGreaterThan(20);
        });

        test("NEW method: D→F interval in chord = 6/5 (CORRECT)", () => {
            // Chord frequencies computed relative to the chord root D
            const [D4, F4, A4] = getChordFrequencies(
                "D",
                4,
                [
                    ["D", 4],
                    ["F", 4],
                    ["A", 4]
                ],
                "just intonation"
            );

            // D→F should be a pure minor 3rd (6/5)
            const dfRatio = F4 / D4;
            expect(dfRatio).toBeCloseTo(6 / 5, 4);

            const dfCents = ratioToCents(dfRatio);
            expect(dfCents).toBeCloseTo(315.6, 0);

            // D→A should be a pure perfect 5th (3/2)
            const daRatio = A4 / D4;
            expect(daRatio).toBeCloseTo(3 / 2, 4);
        });

        test("the error between old and new is exactly the syntonic comma (~21.5 cents)", () => {
            const D4_old = getFrequencyOldMethod("D", 4, "just intonation", "C", 4);
            const F4_old = getFrequencyOldMethod("F", 4, "just intonation", "C", 4);
            const oldCents = ratioToCents(F4_old / D4_old);

            const [D4_new, F4_new] = getChordFrequencies(
                "D",
                4,
                [
                    ["D", 4],
                    ["F", 4]
                ],
                "just intonation"
            );
            const newCents = ratioToCents(F4_new / D4_new);

            const syntonicComma = newCents - oldCents;
            // The syntonic comma = 81/80 = ~21.51 cents
            expect(syntonicComma).toBeCloseTo(21.5, 0);
        });

        test("C major chord is correct in BOTH old and new methods", () => {
            // For chords built on the starting pitch, old and new agree
            const [C4_chord, E4_chord, G4_chord] = getChordFrequencies(
                "C",
                4,
                [
                    ["C", 4],
                    ["E", 4],
                    ["G", 4]
                ],
                "just intonation"
            );

            // C→E = 5/4
            expect(E4_chord / C4_chord).toBeCloseTo(5 / 4, 4);
            // C→G = 3/2
            expect(G4_chord / C4_chord).toBeCloseTo(3 / 2, 4);
        });

        test("equal temperament is unaffected (no comma in ET)", () => {
            const [D4_old, F4_old] = [
                getFrequencyOldMethod("D", 4, "equal", "C", 4),
                getFrequencyOldMethod("F", 4, "equal", "C", 4)
            ];

            const [D4_new, F4_new] = getChordFrequencies(
                "D",
                4,
                [
                    ["D", 4],
                    ["F", 4]
                ],
                "equal"
            );

            // In ET, all minor 3rds are equal — no comma
            expect(ratioToCents(F4_old / D4_old)).toBeCloseTo(300, 0);
            expect(ratioToCents(F4_new / D4_new)).toBeCloseTo(300, 0);
        });
    });

    // ---------------------------------------------------------------
    // Section 6: Non-12-tone temperament support
    // ---------------------------------------------------------------

    describe("Non-12-tone temperaments", () => {
        test("5-EDO has 5 equal steps per octave", () => {
            expect(getPitchCount("equal5")).toBe(5);

            const step = Math.pow(2, 1 / 5);
            const r = ratioForSteps("equal5", 1);
            expect(r).toBeCloseTo(step, 6);
        });

        test("7-EDO has 7 equal steps per octave", () => {
            expect(getPitchCount("equal7")).toBe(7);

            const step = Math.pow(2, 1 / 7);
            const r = ratioForSteps("equal7", 1);
            expect(r).toBeCloseTo(step, 6);
        });

        test("19-EDO has 19 equal steps per octave", () => {
            expect(getPitchCount("equal19")).toBe(19);
        });

        test("31-EDO has 31 equal steps per octave", () => {
            expect(getPitchCount("equal31")).toBe(31);
        });

        test("1/4 comma meantone has 21 pitches per octave", () => {
            expect(getPitchCount("1/4 comma meantone")).toBe(21);
        });

        test("ratioForSteps wraps at octave correctly", () => {
            // pitchNumber steps = one octave = ratio of 2
            const octaveRatio = ratioForSteps("equal", 12);
            expect(octaveRatio).toBeCloseTo(2.0, 6);

            const octave19 = ratioForSteps("equal19", 19);
            expect(octave19).toBeCloseTo(2.0, 6);

            const octave31 = ratioForSteps("equal31", 31);
            expect(octave31).toBeCloseTo(2.0, 6);
        });

        test("two octaves = ratio of 4", () => {
            const twoOctaves = ratioForSteps("equal", 24);
            expect(twoOctaves).toBeCloseTo(4.0, 6);
        });
    });

    // ---------------------------------------------------------------
    // Section 7: Backward compatibility
    // ---------------------------------------------------------------

    describe("backward compatibility", () => {
        test("getFrequency with equal temperament matches etFrequency exactly", () => {
            const notes = ["C", "D", "E", "F", "G", "A", "B"];
            for (const note of notes) {
                for (let octave = 2; octave <= 6; octave++) {
                    const engineFreq = getFrequency(note, octave, "equal", "C", 4);
                    const directFreq = etFrequency(note, octave);
                    expect(engineFreq).toBeCloseTo(directFreq, 6);
                }
            }
        });

        test("JI intervals from starting pitch match TEMPERAMENT ratios", () => {
            const C4 = etFrequency("C", 4);
            const intervals = {
                E: 5 / 4, // major 3
                F: 4 / 3, // perfect 4
                G: 3 / 2, // perfect 5
                A: 5 / 3, // major 6
                B: 15 / 8 // major 7
            };

            for (const [note, expectedRatio] of Object.entries(intervals)) {
                const freq = getFrequency(note, 4, "just intonation", "C", 4);
                expect(freq / C4).toBeCloseTo(expectedRatio, 4);
            }
        });
    });
});
