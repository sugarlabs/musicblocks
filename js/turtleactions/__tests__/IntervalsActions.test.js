/**
 * @license
 * MusicBlocks v3.6.2
 * Copyright (C) 2025 Anubhab
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
const { setupIntervalsActions } = require("../IntervalsActions");

describe("setupIntervalsActions", () => {
    let activity;
    let turtle;
    let logo;

    beforeEach(() => {
        jest.resetModules();

        global._ = x => x;
        global.NOINPUTERRORMSG = "NOINPUT";

        // Mock temperament globals only for this test
        global.isCustomTemperament = jest.fn(() => false);
        global.isTrueEDO = jest.fn(() => true);
        global.TEMPERAMENT = { equal: { pitchNumber: 12 } };

        // Set up test-specific mocks for SEMITONETOINTERVALMAP and ALLNOTESTEP
        global.SEMITONETOINTERVALMAP = Array(13)
            .fill(null)
            .map(() => Array(7).fill("perfect"));

        global.MUSICALMODES = {
            major: [2, 2, 1, 2, 2, 2, 1],
            minor: [2, 1, 2, 2, 1, 2, 2],
            custom: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        };

        global.ALLNOTESTEP = {
            "Cb": 0,
            "C": 1,
            "C#": 2,
            "Db": 2,
            "D": 3,
            "D#": 4,
            "Eb": 4,
            "E": 5,
            "E#": 6,
            "Fb": 5,
            "F": 6,
            "F#": 7,
            "Gb": 7,
            "G": 8,
            "G#": 9,
            "Ab": 9,
            "A": 10,
            "A#": 11,
            "Bb": 11,
            "B": 12,
            "B#": 0
        };

        global.pitchToNumber = jest.fn((note, octave, keySig, temperament) => {
            return global.ALLNOTESTEP[note] || 0;
        });

        global.GetNotesForInterval = jest.fn(() => ({
            firstNote: "C",
            secondNote: "G",
            octave: 0
        }));

        global.getNote = jest.fn(() => ["C"]);
        global.getModeLength = jest.fn(() => 7);
        global.getCurrentEDO = jest.fn(() => 12);

        global.MusicBlocks = { isRun: false };
        global.Mouse = { getMouseFromTurtle: jest.fn() };

        global.Singer = {};

        turtle = {
            singer: {
                keySignature: "C major",
                transposition: 0,
                movable: false,
                intervals: [],
                chordIntervals: [],
                semitoneIntervals: [],
                ratioIntervals: [],
                noteDirection: 1,
                defineMode: []
            }
        };

        logo = {
            synth: {
                inTemperament: null,
                startingPitch: null,
                changeInTemperament: false
            },
            notation: {
                notationKey: jest.fn()
            },
            temperamentSelected: [],
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn()
        };

        activity = {
            turtles: {
                ithTurtle: () => turtle
            },
            blocks: {
                blockList: {},
                updateBlockText: jest.fn()
            },
            logo,
            errorMsg: jest.fn()
        };

        setupIntervalsActions(activity);
    });

    afterEach(() => {
        // Clean up globals to prevent test pollution
        delete global.isCustomTemperament;
        delete global.isTrueEDO;
        delete global.TEMPERAMENT;
    });

    describe("GetModename", () => {
        test("returns exact mode key from MUSICALMODES", () => {
            expect(Singer.IntervalsActions.GetModename("major")).toBe("major");
            expect(Singer.IntervalsActions.GetModename("minor")).toBe("minor");
        });

        test("returns 'major' as fallback when no match is found", () => {
            expect(Singer.IntervalsActions.GetModename("nonexistent")).toBe("major");
            expect(Singer.IntervalsActions.GetModename("invalidMode")).toBe("major");
        });

        test("handles invalid input gracefully", () => {
            expect(Singer.IntervalsActions.GetModename(null)).toBe("major");
            expect(Singer.IntervalsActions.GetModename(undefined)).toBe("major");
            expect(Singer.IntervalsActions.GetModename("")).toBe("major");
            expect(Singer.IntervalsActions.GetModename(123)).toBe("major");
        });

        test("matches localized mode name via _() function", () => {
            // Mock _() to return a localized version
            global._ = x => (x === "minor" ? "moll" : x);

            // When searching for localized name, it should find the original key
            expect(Singer.IntervalsActions.GetModename("moll")).toBe("minor");

            // Reset the mock
            global._ = x => x;
        });

        test("prefers exact key match over localized match", () => {
            // Create a fresh MUSICALMODES where "moll" comes before a mode that localizes to "moll"
            const originalModes = global.MUSICALMODES;
            global.MUSICALMODES = {
                moll: [2, 1, 2, 2, 1, 3, 1],
                minor: [2, 1, 2, 2, 1, 2, 2]
            };

            // Mock _() to translate "minor" to "moll"
            global._ = x => (x === "minor" ? "moll" : x);

            // "moll" should match the exact key "moll" since it's checked in the condition first
            expect(Singer.IntervalsActions.GetModename("moll")).toBe("moll");

            // Restore original
            global.MUSICALMODES = originalModes;
            global._ = x => x;
        });
    });

    test("GetIntervalNumber base case", () => {
        expect(typeof Singer.IntervalsActions.GetIntervalNumber(0)).toBe("number");
    });

    test("GetIntervalNumber octave > 1", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "C",
            octave: 2
        });
        expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBeGreaterThan(12);
    });

    test("GetIntervalNumber octave < -1", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "D",
            octave: -3
        });
        expect(typeof Singer.IntervalsActions.GetIntervalNumber(0)).toBe("number");
    });

    test("GetIntervalNumber handles B to B# enharmonic (same octave)", () => {
        // B (12) to B# (0) should be 1 semitone (minor second), not 12
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "B",
            secondNote: "B#",
            octave: 0
        });
        expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(1);
    });

    test("GetIntervalNumber handles B to Cb enharmonic (same octave)", () => {
        // B (12) to Cb (0) should be 1 semitone (minor second), not 12
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "B",
            secondNote: "Cb",
            octave: 0
        });
        expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(1);
    });

    test("GetIntervalNumber handles C to Cb (same octave)", () => {
        // C (1) to Cb (0) should be 1 semitone
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "Cb",
            octave: 0
        });
        expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(1);
    });

    test("GetIntervalNumber handles Cb to B (same octave)", () => {
        // Cb (0) to B (12) should be 1 semitone (wrap-around)
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "Cb",
            secondNote: "B",
            octave: 0
        });
        expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(1);
    });

    test("GetIntervalNumber handles normal interval correctly", () => {
        // C (1) to G (8) should be 7 semitones (perfect fifth)
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "G",
            octave: 0
        });
        expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(7);
    });

    test("GetCurrentInterval normal", () => {
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    test("GetCurrentInterval perfect octave above", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "C",
            octave: 2
        });
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    test("GetCurrentInterval perfect octave below", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "C",
            octave: -1
        });
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    test("GetCurrentInterval octave < -1", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "G",
            secondNote: "C",
            octave: -2
        });
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    test("GetCurrentInterval totalIntervals > 21", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "B",
            octave: 3
        });
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    describe("GetCurrentInterval with custom temperaments", () => {
        beforeEach(() => {
            logo.synth.inTemperament = "custom_edo19";
            global.TEMPERAMENT.custom_edo19 = { pitchNumber: 19 };

            // Extend SEMITONETOINTERVALMAP so indices up to 24 are accessible
            global.SEMITONETOINTERVALMAP = Array(25)
                .fill(null)
                .map(() => Array(7).fill("test_interval"));
        });

        test("19-EDO overflow guard triggers at > 28 (not > 21)", () => {
            // C→B (diff=11), octave=1 → totalIntervals = 11 + 19 = 30
            // 30 > 28 → trigger overflow, reduce by 19 → 11
            const notes = { firstNote: "C", secondNote: "B", octave: 1 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            const result = Singer.IntervalsActions.GetCurrentInterval(0);
            // lastWord = ", plus one octave" → "test_interval, plus one octave"
            expect(result).toContain("plus");
            expect(result).toContain("octave");
        });

        test("19-EDO overflow with multiple octaves uses correct plural", () => {
            // C→C (forwardDiff=0 → base=1), octave=2 → totalIntervals = 1 + 19 + 19 = 39
            // 39 > 28 → trigger overflow, reduce: 39-19=20, 20-19=1
            const notes = { firstNote: "C", secondNote: "C", octave: 2 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            const result = Singer.IntervalsActions.GetCurrentInterval(0);
            // lastWord = ", plus two octaves"
            expect(result).toContain("two");
            expect(result).toContain("octaves");
        });

        test("19-EDO small interval skips overflow guard", () => {
            // C→D# (diff=3), octave=0 → totalIntervals = 3
            // 3 > 28 → false, no overflow
            const notes = { firstNote: "C", secondNote: "D#", octave: 0 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            const result = Singer.IntervalsActions.GetCurrentInterval(0);
            expect(result).toBe("test_interval"); // no lastWord
        });

        test("12-EDO regression: same behavior as before temperament fix", () => {
            // Reset to default 12-EDO temperament
            logo.synth.inTemperament = null;
            delete global.TEMPERAMENT.custom_edo19;

            // Use default mock SEMITONETOINTERVALMAP (13×7 "perfect")
            global.SEMITONETOINTERVALMAP = Array(13)
                .fill(null)
                .map(() => Array(7).fill("perfect"));

            // C→G (diff=7), octave=0 → totalIntervals = 7
            const notes = { firstNote: "C", secondNote: "G", octave: 0 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            const result = Singer.IntervalsActions.GetCurrentInterval(0);
            // SEMITONETOINTERVALMAP[7][4] = "perfect", no lastWord
            expect(result).toBe("perfect");
        });
    });

    describe("GetModename exact-vs-localized match precedence", () => {
        afterEach(() => {
            global._ = x => x;
        });

        test("prioritizes exact mode name over localized mode name", () => {
            // With a non-identity _(), "_mode === mode" and "_(_mode) === mode" are genuinely
            // different conditions. This confirms the exact-match clause is what finds "minor"
            // here, not an incidental side effect of _() being the identity function elsewhere.
            global._ = x => `${x}_localized`;

            expect(Singer.IntervalsActions.GetModename("minor")).toBe("minor");
        });
    });

    describe("GetIntervalNumber precise octave and wrap-around values", () => {
        // Same note letter on both ends keeps letterGap out of play, isolating the
        // octave-sign handling (below-wrap at line ~110, Math.abs at line ~113).
        test("octave === -1 wraps a single octave below", () => {
            GetNotesForInterval.mockReturnValueOnce({
                firstNote: "C",
                secondNote: "C",
                octave: -1
            });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(11);
        });

        test("octave === -2 combines the below-wrap with the Math.abs(octave) accumulation", () => {
            GetNotesForInterval.mockReturnValueOnce({
                firstNote: "C",
                secondNote: "C",
                octave: -2
            });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(35);
        });

        test("octave === 1 accumulates one temperament length without the below-wrap", () => {
            GetNotesForInterval.mockReturnValueOnce({ firstNote: "C", secondNote: "C", octave: 1 });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(13);
        });

        test("overflow-guard boundary: totalIntervals === temperamentLength + 9 is exact, not exceeded", () => {
            GetNotesForInterval.mockReturnValueOnce({ firstNote: "C", secondNote: "A", octave: 1 });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(21);
        });

        test("one semitone past the overflow-guard boundary still returns the raw (unreduced) count", () => {
            // GetIntervalNumber never reduces the value itself; the reduction only
            // happens later, in GetCurrentInterval. This pins the raw input to that step.
            GetNotesForInterval.mockReturnValueOnce({
                firstNote: "C",
                secondNote: "A#",
                octave: 1
            });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(22);
        });

        test("uses the absolute step difference, not the sum, when the forward (wrap-around) distance is larger", () => {
            // G (8) -> E (5): |8-5| = 3, but the forward distance (8 -> ... -> E going up)
            // is 9. The smaller of the two (3) is correct; the raw sum (13) is not,
            // and would incorrectly lose out to the forward distance in the min().
            GetNotesForInterval.mockReturnValueOnce({ firstNote: "G", secondNote: "E", octave: 0 });
            expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBe(3);
        });
    });

    describe("GetCurrentInterval precise wording assertions", () => {
        test.each([
            [-2, "perfect,  two octaves below"],
            [-3, "perfect,  three octaves below"],
            [-4, "perfect,  four octaves below"],
            [-5, "perfect,  five octaves below"],
            [-6, "perfect,  six octaves below"],
            [-7, "perfect,  seven octaves below"],
            [-8, "perfect,  eight octaves below"],
            [-9, "perfect,  nine octaves below"]
        ])("octave === %i produces %j", (octave, expected) => {
            const notes = { firstNote: "C", secondNote: "C", octave };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe(expected);
        });

        test("octave === -1 omits the octave-count prefix that only applies when octave < -1", () => {
            const notes = { firstNote: "C", secondNote: "C", octave: -1 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("perfect below");
        });

        test("overflow-guard 'plus one octave' wording uses singular octave and the 'one' word", () => {
            const notes = { firstNote: "C", secondNote: "B", octave: 1 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("perfect, plus one octave");
        });

        test("overflow-guard boundary: exactly temperamentLength + 9 reports raw step count, unreduced", () => {
            const notes = { firstNote: "C", secondNote: "A", octave: 1 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("21 steps");
        });

        test("overflow-guard boundary: one past temperamentLength + 9 triggers the reduction and suffix", () => {
            const notes = { firstNote: "C", secondNote: "A#", octave: 1 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("perfect, plus one octave");
        });

        test("falls back to 'N steps' when SEMITONETOINTERVALMAP has no entry for the interval", () => {
            // G -> C, octave 1: letter-gap wraps and totalIntervals (17) has no
            // corresponding row in the default 13-row SEMITONETOINTERVALMAP mock.
            const notes = { firstNote: "G", secondNote: "C", octave: 1 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("17 steps");
        });

        test("falls back to 'N steps' when the row exists but has no entry for the computed letter gap", () => {
            // The real SEMITONETOINTERVALMAP (js/utils/musicutils.js) is sparse: each row only
            // defines the couple of letterGap keys matching that interval's conventional
            // spellings, not all 7. Mirror that shape here instead of the dense array fixture
            // used elsewhere in this file, so the missing-key fallback actually gets exercised.
            global.SEMITONETOINTERVALMAP = {
                1: { 0: "augmented unison", 1: "minor second" }
            };

            // B -> C, octave 0: a natural half-step (totalIntervals 1), but spelled with
            // letters 6 apart (B is index 6, C is index 0), which isn't one of row 1's keys.
            const notes = { firstNote: "B", secondNote: "C", octave: 0 };
            GetNotesForInterval.mockReturnValueOnce(notes);
            GetNotesForInterval.mockReturnValueOnce(notes);

            const result = Singer.IntervalsActions.GetCurrentInterval(0);
            expect(result).toBe("1 steps");
            expect(result).not.toContain("undefined");
        });

        describe("letter-gap direction and wrap-around", () => {
            beforeEach(() => {
                // Each letterGap column maps to a distinct label so the returned
                // string directly reveals which letterGap value the code computed.
                global.SEMITONETOINTERVALMAP = Array(60)
                    .fill(null)
                    .map(() => ["lg0", "lg1", "lg2", "lg3", "lg4", "lg5", "lg6"]);
            });

            afterEach(() => {
                // Restore the default fixture so it can't leak into other describe blocks.
                global.SEMITONETOINTERVALMAP = Array(13)
                    .fill(null)
                    .map(() => Array(7).fill("perfect"));
            });

            test("wraps the letter gap when the first letter index exceeds the second and octave !== 0", () => {
                // G (index 4) -> C (index 0): raw gap 4, wrapped to NOTENAMES.length - 4 = 3.
                const notes = { firstNote: "G", secondNote: "C", octave: 1 };
                GetNotesForInterval.mockReturnValueOnce(notes);
                GetNotesForInterval.mockReturnValueOnce(notes);

                expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("lg3");
            });

            test("does not wrap the letter gap when octave === 0, even if the first index exceeds the second", () => {
                const notes = { firstNote: "G", secondNote: "C", octave: 0 };
                GetNotesForInterval.mockReturnValueOnce(notes);
                GetNotesForInterval.mockReturnValueOnce(notes);

                expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("lg4");
            });

            test("computes an asymmetric letter gap correctly (D -> G, no wrap needed)", () => {
                // D (index 1) -> G (index 4): gap is |4-1| = 3, not index2+index1 = 5.
                const notes = { firstNote: "D", secondNote: "G", octave: 0 };
                GetNotesForInterval.mockReturnValueOnce(notes);
                GetNotesForInterval.mockReturnValueOnce(notes);

                expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("lg3");
            });

            test("computes an asymmetric wrapped letter gap correctly (G -> D, wrap needed)", () => {
                // G (index 4) -> D (index 1): raw gap 3, wrapped to NOTENAMES.length - 3 = 4.
                const notes = { firstNote: "G", secondNote: "D", octave: 1 };
                GetNotesForInterval.mockReturnValueOnce(notes);
                GetNotesForInterval.mockReturnValueOnce(notes);

                expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("lg4");
            });

            test("uses only the note letter, ignoring accidentals, when computing the letter gap", () => {
                // C# -> G#: substring(0, 1) must strip the "#" so this behaves like C -> G.
                const notes = { firstNote: "C#", secondNote: "G#", octave: 0 };
                GetNotesForInterval.mockReturnValueOnce(notes);
                GetNotesForInterval.mockReturnValueOnce(notes);

                expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("lg4");
            });

            test("does not wrap when the first letter index equals the second, even with octave !== 0", () => {
                // C -> C: index1 === index2, so the wrap condition (index1 > index2) must
                // stay strictly false here rather than treating equal indices as a match.
                const notes = { firstNote: "C", secondNote: "C", octave: 1 };
                GetNotesForInterval.mockReturnValueOnce(notes);
                GetNotesForInterval.mockReturnValueOnce(notes);

                expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("lg0");
            });

            test("re-derives the letter gap for octave < 0 independently of the earlier wrap", () => {
                // G -> C, octave -1: the initial wrap (line ~142) sets letterGap to 3,
                // then the octave < 0 branch (line ~183) re-derives it from scratch to 4.
                // Skipping that re-derivation would leave the stale value of 3.
                const notes = { firstNote: "G", secondNote: "C", octave: -1 };
                GetNotesForInterval.mockReturnValueOnce(notes);
                GetNotesForInterval.mockReturnValueOnce(notes);

                expect(Singer.IntervalsActions.GetCurrentInterval(0)).toBe("lg4 below");
            });
        });
    });

    test("setKey updates keySignature", () => {
        Singer.IntervalsActions.setKey("C", "major", 0);
        expect(getNote).toHaveBeenCalledWith(
            "C",
            4,
            0,
            "C major",
            false,
            null,
            activity.errorMsg,
            null
        );
        expect(turtle.singer.keySignature).toBe("C major");
        expect(logo.notation.notationKey).toHaveBeenCalledWith(0, "C", "major");
    });

    test("getCurrentKey / Mode / Length", () => {
        turtle.singer.keySignature = "Db dorian";
        expect(Singer.IntervalsActions.getCurrentKey(0)).toBe("Db");
        expect(Singer.IntervalsActions.getCurrentMode(0)).toBe("dorian");
        expect(Singer.IntervalsActions.getModeLength(0)).toBe(7);
    });

    test("setMovableDo", () => {
        Singer.IntervalsActions.setMovableDo(true, 0);
        expect(turtle.singer.movable).toBe(true);
    });

    test("setScalarInterval push + pop", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setScalarInterval(2.5, 0, "blk");
        expect(activity.errorMsg).not.toHaveBeenCalled();
        expect(turtle.singer.intervals).toEqual([2]);
        listener();
        expect(turtle.singer.intervals.length).toBe(0);
    });

    test("setScalarInterval error on null", () => {
        Singer.IntervalsActions.setScalarInterval(null, 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        expect(turtle.singer.intervals).toEqual([1]);
    });

    test("setScalarInterval treats a non-number argument as invalid input", () => {
        Singer.IntervalsActions.setScalarInterval("two", 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        expect(turtle.singer.intervals).toEqual([1]);
    });

    test("setScalarInterval rounds a negative value up with Math.ceil", () => {
        Singer.IntervalsActions.setScalarInterval(-2.5, 0, "blk");
        expect(turtle.singer.intervals).toEqual([-2]);
    });

    test("setScalarInterval dispatches to setDispatchBlock when blk is registered", () => {
        activity.blocks.blockList.blk = {};
        Singer.IntervalsActions.setScalarInterval(2, 0, "blk");
        expect(logo.setDispatchBlock).toHaveBeenCalledWith("blk", 0, "_interval_0");
    });

    test("setScalarInterval does not dispatch when blk is not registered", () => {
        Singer.IntervalsActions.setScalarInterval(2, 0, "unregistered_blk");
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("setScalarInterval does not dispatch when blk is undefined even if 'undefined' is a stray blockList key", () => {
        activity.blocks.blockList["undefined"] = {};
        Singer.IntervalsActions.setScalarInterval(2, 0, undefined);
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("setScalarInterval does not throw when MusicBlocks is entirely undefined", () => {
        delete global.MusicBlocks;
        expect(() => Singer.IntervalsActions.setScalarInterval(2, 0, undefined)).not.toThrow();
    });

    test("setScalarInterval does not push a mouse listener when no mouse is found", () => {
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => null);
        expect(() => Singer.IntervalsActions.setScalarInterval(2, 0, undefined)).not.toThrow();
    });

    test("setScalarInterval MusicBlocks.isRun adds to mouse listeners", () => {
        const mockMouse = { MB: { listeners: [] } };
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

        Singer.IntervalsActions.setScalarInterval(2, 0, undefined);

        expect(mockMouse.MB.listeners).toContain("_interval_0");
    });

    test("setChordInterval push + pop", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setChordInterval([1, 0], 0, "blk");
        expect(activity.errorMsg).not.toHaveBeenCalled();
        expect(turtle.singer.chordIntervals.length).toBe(1);
        listener();
        expect(turtle.singer.chordIntervals.length).toBe(0);
    });

    test("setChordInterval does not dispatch when blk is not registered", () => {
        Singer.IntervalsActions.setChordInterval([1, 0], 0, "unregistered_blk");
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("setChordInterval does not dispatch when blk is undefined even if 'undefined' is a stray blockList key", () => {
        activity.blocks.blockList["undefined"] = {};
        Singer.IntervalsActions.setChordInterval([1, 0], 0, undefined);
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("setChordInterval does not throw when MusicBlocks is entirely undefined", () => {
        delete global.MusicBlocks;
        expect(() => Singer.IntervalsActions.setChordInterval([1, 0], 0, undefined)).not.toThrow();
    });

    test("setChordInterval does not push a mouse listener when no mouse is found", () => {
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => null);
        expect(() => Singer.IntervalsActions.setChordInterval([1, 0], 0, undefined)).not.toThrow();
    });

    test("setChordInterval error on null", () => {
        Singer.IntervalsActions.setChordInterval(null, 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        expect(turtle.singer.chordIntervals).toContainEqual([1, 0]);
    });

    test("setChordInterval dispatches to setDispatchBlock when blk is registered", () => {
        activity.blocks.blockList.blk = {};
        Singer.IntervalsActions.setChordInterval([1, 0], 0, "blk");
        expect(logo.setDispatchBlock).toHaveBeenCalledWith("blk", 0, "_chord_interval_0");
    });

    test("setChordInterval MusicBlocks.isRun adds to mouse listeners", () => {
        const mockMouse = { MB: { listeners: [] } };
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

        Singer.IntervalsActions.setChordInterval([2, 1], 0, undefined);

        expect(mockMouse.MB.listeners).toContain("_chord_interval_0");
    });

    test("setSemitoneInterval zero ignored", () => {
        Singer.IntervalsActions.setSemitoneInterval(0, 0);
        expect(turtle.singer.semitoneIntervals.length).toBe(0);
    });

    test("setSemitoneInterval push + pop", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setSemitoneInterval(2.5, 0, "blk");
        expect(activity.errorMsg).not.toHaveBeenCalled();
        expect(turtle.singer.semitoneIntervals).toEqual([[2, 1]]);
        listener();
        expect(turtle.singer.semitoneIntervals.length).toBe(0);
    });

    test("setSemitoneInterval error on null", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setSemitoneInterval(null, 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        // Default value of 1 should be used
        expect(turtle.singer.semitoneIntervals.length).toBe(1);
    });

    test("setSemitoneInterval treats a non-number argument as invalid input", () => {
        Singer.IntervalsActions.setSemitoneInterval("two", 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        expect(turtle.singer.semitoneIntervals).toEqual([[1, 1]]);
    });

    test("setSemitoneInterval rounds a negative value up with Math.ceil", () => {
        Singer.IntervalsActions.setSemitoneInterval(-2.5, 0, "blk");
        expect(turtle.singer.semitoneIntervals).toEqual([[-2, 1]]);
    });

    test("setSemitoneInterval does not dispatch when blk is not registered", () => {
        Singer.IntervalsActions.setSemitoneInterval(2, 0, "unregistered_blk");
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("setSemitoneInterval does not dispatch when blk is undefined even if 'undefined' is a stray blockList key", () => {
        activity.blocks.blockList["undefined"] = {};
        Singer.IntervalsActions.setSemitoneInterval(2, 0, undefined);
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("setSemitoneInterval does not throw when MusicBlocks is entirely undefined", () => {
        delete global.MusicBlocks;
        expect(() => Singer.IntervalsActions.setSemitoneInterval(2, 0, undefined)).not.toThrow();
    });

    test("setSemitoneInterval does not push a mouse listener when no mouse is found", () => {
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => null);
        expect(() => Singer.IntervalsActions.setSemitoneInterval(2, 0, undefined)).not.toThrow();
    });

    test("setSemitoneInterval dispatches to setDispatchBlock when blk is registered", () => {
        activity.blocks.blockList.blk = {};
        Singer.IntervalsActions.setSemitoneInterval(2, 0, "blk");
        expect(logo.setDispatchBlock).toHaveBeenCalledWith("blk", 0, "_semitone_interval_0");
    });

    test("setSemitoneInterval MusicBlocks.isRun adds to mouse listeners", () => {
        const mockMouse = { MB: { listeners: [] } };
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

        Singer.IntervalsActions.setSemitoneInterval(3, 0, undefined);

        expect(mockMouse.MB.listeners).toContain("_semitone_interval_0");
    });

    test("setRatioInterval push + pop", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setRatioInterval(1.5, 0, "blk");
        expect(activity.errorMsg).not.toHaveBeenCalled();
        expect(turtle.singer.ratioIntervals).toEqual([1.5]);
        listener();
        expect(turtle.singer.ratioIntervals.length).toBe(0);
    });

    test("setRatioInterval does not dispatch when blk is not registered", () => {
        Singer.IntervalsActions.setRatioInterval(1.5, 0, "unregistered_blk");
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("setRatioInterval does not dispatch when blk is undefined even if 'undefined' is a stray blockList key", () => {
        activity.blocks.blockList["undefined"] = {};
        Singer.IntervalsActions.setRatioInterval(1.5, 0, undefined);
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("setRatioInterval does not throw when MusicBlocks is entirely undefined", () => {
        delete global.MusicBlocks;
        expect(() => Singer.IntervalsActions.setRatioInterval(1.5, 0, undefined)).not.toThrow();
    });

    test("setRatioInterval does not push a mouse listener when no mouse is found", () => {
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => null);
        expect(() => Singer.IntervalsActions.setRatioInterval(1.5, 0, undefined)).not.toThrow();
    });

    test("setRatioInterval error on null", () => {
        Singer.IntervalsActions.setRatioInterval(null, 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        // Default value of 1 should be used
        expect(turtle.singer.ratioIntervals).toContain(1);
    });

    test("setRatioInterval treats a non-number argument as invalid input", () => {
        Singer.IntervalsActions.setRatioInterval("two", 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        expect(turtle.singer.ratioIntervals).toContain(1);
    });

    test("setRatioInterval dispatches to setDispatchBlock when blk is registered", () => {
        activity.blocks.blockList.blk = {};
        Singer.IntervalsActions.setRatioInterval(1.5, 0, "blk");
        expect(logo.setDispatchBlock).toHaveBeenCalledWith("blk", 0, "_ratio_interval_0");
    });

    test("setRatioInterval MusicBlocks.isRun adds to mouse listeners", () => {
        const mockMouse = { MB: { listeners: [] } };
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

        Singer.IntervalsActions.setRatioInterval(2.0, 0, undefined);

        expect(mockMouse.MB.listeners).toContain("_ratio_interval_0");
    });

    test("defineMode success path", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        activity.blocks.blockList.blk = { connections: [null, "text1"] };
        activity.blocks.blockList.text1 = { name: "text" };

        Singer.IntervalsActions.defineMode("custom", 0, "blk");

        turtle.singer.defineMode.push(0, 4, 7);
        listener();

        expect(activity.errorMsg).not.toHaveBeenCalled();
        expect(MUSICALMODES.custom).toEqual([4, 3, 5]);
    });

    test("defineMode does not dispatch when blk is undefined even if 'undefined' is a stray blockList key", () => {
        activity.blocks.blockList["undefined"] = {};
        Singer.IntervalsActions.defineMode("custom", 0, undefined);
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("defineMode does not throw when MusicBlocks is entirely undefined", () => {
        delete global.MusicBlocks;
        expect(() => Singer.IntervalsActions.defineMode("custom", 0, undefined)).not.toThrow();
    });

    test("defineMode does not push a mouse listener when no mouse is found", () => {
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => null);
        expect(() => Singer.IntervalsActions.defineMode("custom", 0, undefined)).not.toThrow();
    });

    test("defineMode excludes negative pitch numbers and flags EDOBOUNDEXCEEDED", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.defineMode("custom", 0, undefined);
        turtle.singer.defineMode.push(-5, 3);
        listener();
        expect(activity.errorMsg).toHaveBeenCalledWith(EDOBOUNDEXCEEDED, null);
    });

    test("defineMode raises no errors when every pitch number is already valid and unique", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.defineMode("custom", 0, undefined);
        turtle.singer.defineMode.push(0, 3, 5);
        listener();
        expect(activity.errorMsg).not.toHaveBeenCalled();
        expect(MUSICALMODES.custom).toEqual([3, 2, 7]);
    });

    test("defineMode does not flag overflow when the pitch count exactly equals the temperament length", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.defineMode("custom", 0, undefined);
        turtle.singer.defineMode.push(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11);
        listener();
        expect(activity.errorMsg).not.toHaveBeenCalledWith(EDOBOUNDEXCEEDED, null);
    });

    test("defineMode keeps a leading duplicate zero's step as 0, not wrapped to the temperament length", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.defineMode("custom", 0, undefined);
        turtle.singer.defineMode.push(0, 0, 5);
        listener();
        expect(MUSICALMODES.custom).toEqual([0, 7]);
    });

    test("defineMode listener does not update block text when there is no connected child block", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        activity.blocks.blockList.blk = { connections: [null] };
        Singer.IntervalsActions.defineMode("custom", 0, "blk");
        turtle.singer.defineMode.push(0, 4, 7);
        expect(() => listener()).not.toThrow();
        expect(activity.blocks.updateBlockText).not.toHaveBeenCalled();
    });

    test("defineMode listener does not update block text when the connected block is not a text block", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        activity.blocks.blockList.blk = { connections: [null, "other1"] };
        activity.blocks.blockList.other1 = { name: "" };
        Singer.IntervalsActions.defineMode("custom", 0, "blk");
        turtle.singer.defineMode.push(0, 4, 7);
        listener();
        expect(activity.blocks.updateBlockText).not.toHaveBeenCalled();
    });

    test("defineMode listener does not update block text when blk is not registered", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.defineMode("custom", 0, "unregistered_blk");
        turtle.singer.defineMode.push(0, 4, 7);
        listener();
        expect(activity.blocks.updateBlockText).not.toHaveBeenCalled();
    });

    test("defineMode listener does not update block text when there is no connection array to read", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        activity.blocks.blockList.blk = { connections: [null] };
        activity.blocks.blockList["undefined"] = { name: "text" };
        Singer.IntervalsActions.defineMode("custom", 0, "blk");
        turtle.singer.defineMode.push(0, 4, 7);
        listener();
        expect(activity.blocks.updateBlockText).not.toHaveBeenCalled();
    });

    test("defineMode listener does not update block text when blk is undefined even if 'undefined' is a stray blockList key", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        activity.blocks.blockList["undefined"] = { connections: [null, "text1"] };
        activity.blocks.blockList.text1 = { name: "text" };
        Singer.IntervalsActions.defineMode("custom", 0, undefined);
        turtle.singer.defineMode.push(0, 4, 7);
        listener();
        expect(activity.blocks.updateBlockText).not.toHaveBeenCalled();
    });

    test("defineMode error paths", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        activity.blocks.blockList.blk = { connections: [null, "text1"] };
        activity.blocks.blockList.text1 = { name: "text" };

        Singer.IntervalsActions.defineMode(null, 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, "blk");

        turtle.singer.defineMode.push(4);
        turtle.singer.defineMode.push(12);
        turtle.singer.defineMode.push(4);

        listener();

        expect(activity.errorMsg).toHaveBeenCalledWith(EDOBOUNDEXCEEDED, null);
        // A null mode name still falls back to the "custom" key, not an empty string.
        expect(MUSICALMODES.custom).toEqual([4, 0]);
    });

    test("defineMode sets dispatch, resets turtle state, and lowercases the mode name", () => {
        activity.blocks.blockList.blk = {};
        Singer.IntervalsActions.defineMode("Custom", 0, "blk");

        expect(logo.setDispatchBlock).toHaveBeenCalledWith("blk", 0, "_definemode_0");
        expect(turtle.singer.inDefineMode).toBe(true);
        expect(turtle.singer.defineMode).toEqual([]);
    });

    test("defineMode does not dispatch when blk is not registered", () => {
        Singer.IntervalsActions.defineMode("custom", 0, "unregistered_blk");
        expect(logo.setDispatchBlock).not.toHaveBeenCalled();
    });

    test("defineMode listener normalizes pitch numbers, auto-adds missing 0, skips duplicates, and updates the linked text block", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        activity.blocks.blockList.blk = { connections: [null, "text1"] };
        activity.blocks.blockList.text1 = { name: "text" };

        Singer.IntervalsActions.defineMode("Custom", 0, "blk");

        turtle.singer.defineMode.push(9, 7, 4, 7);
        listener();

        expect(activity.errorMsg).toHaveBeenCalledWith(_("Adding missing pitch number 0."));
        expect(activity.errorMsg).toHaveBeenCalledWith(_("Ignoring duplicate pitch numbers."));
        expect(MUSICALMODES.custom).toEqual([4, 3, 0, 3]);
        expect(activity.blocks.updateBlockText).toHaveBeenCalledWith("text1");
        expect(turtle.singer.inDefineMode).toBe(false);
    });

    test("defineMode does not crash when blk is undefined (JS-Export path)", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        // blk is not passed — simulates JS-Export / headless execution
        Singer.IntervalsActions.defineMode("pentatonic", 0, undefined);

        turtle.singer.defineMode.push(0, 2, 4, 7, 9);

        // Should not throw a TypeError even though blk is undefined
        expect(() => listener()).not.toThrow();
        expect(MUSICALMODES.pentatonic).toBeDefined();
    });

    test("defineMode MusicBlocks.isRun adds to mouse listeners", () => {
        const mockMouse = { MB: { listeners: [] } };
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

        Singer.IntervalsActions.defineMode("custom", 0, undefined);

        expect(mockMouse.MB.listeners).toContain("_definemode_0");
    });

    test("defineMode flags EDOBOUNDEXCEEDED when more pitch numbers than the temperament length are defined", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        Singer.IntervalsActions.defineMode("custom", 0, undefined);

        // 13 in-range (0-11) pitch numbers for a default 12-EDO temperament
        // exceeds temperamentLength even though none of them are individually out of bounds.
        turtle.singer.defineMode.push(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0);
        listener();

        expect(activity.errorMsg).toHaveBeenCalledWith(EDOBOUNDEXCEEDED, null);
    });

    test("setTemperament state changes", () => {
        Singer.IntervalsActions.setTemperament("equal", "C", 4);
        expect(logo.synth.inTemperament).toBe("equal");
        expect(logo.synth.startingPitch).toBe("C4");
    });

    test("setTemperament change flag", () => {
        Singer.IntervalsActions.setTemperament("equal", "C", 4);
        Singer.IntervalsActions.setTemperament("pythagorean", "C", 4);
        expect(logo.synth.changeInTemperament).toBe(true);
    });

    test("setTemperament does not flag a change on the very first call when the temperament is unset", () => {
        Singer.IntervalsActions.setTemperament(undefined, "C", 4);
        expect(logo.synth.changeInTemperament).toBe(false);
    });

    test("setTemperament flags a change once a real temperament follows unset entries", () => {
        Singer.IntervalsActions.setTemperament(undefined, "C", 4);
        Singer.IntervalsActions.setTemperament(undefined, "C", 4);
        Singer.IntervalsActions.setTemperament("equal", "C", 4);
        expect(logo.synth.changeInTemperament).toBe(true);
    });

    test("setTemperament rebuilds the custom mode when the EDO changes", () => {
        global.getCurrentEDO = jest.fn(() => 19);
        Singer.IntervalsActions.setTemperament("equal19", "C", 4);
        expect(MUSICALMODES.custom).toEqual(new Array(19).fill(1));
    });

    test("setTemperament leaves the custom mode untouched when the EDO is unchanged", () => {
        global.getCurrentEDO = jest.fn(() => 12);
        // A sentinel value distinct from what a rebuild would produce (Array(12).fill(1))
        // so an unwanted rebuild is observable.
        MUSICALMODES.custom = new Array(12).fill(9);
        Singer.IntervalsActions.setTemperament("equal", "C", 4);
        expect(MUSICALMODES.custom).toEqual(new Array(12).fill(9));
    });

    describe("getTemperamentLength", () => {
        beforeEach(() => {
            delete global.TEMPERAMENT.custom_edo19;
            global.TEMPERAMENT = {
                "equal": { pitchNumber: 12 },
                "equal19": { pitchNumber: 19 },
                "equal31": { pitchNumber: 31 },
                "just intonation": { pitchNumber: 12 },
                "1/3 comma meantone": { pitchNumber: 19 }
            };
        });

        test("returns 12 for equal temperament", () => {
            logo.synth.inTemperament = "equal";
            expect(Singer.IntervalsActions.getTemperamentLength()).toBe(12);
        });

        test("returns 19 for equal19", () => {
            logo.synth.inTemperament = "equal19";
            expect(Singer.IntervalsActions.getTemperamentLength()).toBe(19);
        });

        test("returns 31 for equal31", () => {
            logo.synth.inTemperament = "equal31";
            expect(Singer.IntervalsActions.getTemperamentLength()).toBe(31);
        });

        test("returns 12 for just intonation", () => {
            logo.synth.inTemperament = "just intonation";
            expect(Singer.IntervalsActions.getTemperamentLength()).toBe(12);
        });

        test("returns 19 for 1/3 comma meantone", () => {
            logo.synth.inTemperament = "1/3 comma meantone";
            expect(Singer.IntervalsActions.getTemperamentLength()).toBe(19);
        });

        test("falls back to 12 when no temperament is set", () => {
            logo.synth.inTemperament = undefined;
            expect(Singer.IntervalsActions.getTemperamentLength()).toBe(12);
        });
    });
});
