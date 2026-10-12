/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks Contributors
 *
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

const ChordBuilderAudio = require("../ChordBuilderAudio.js");

describe("ChordBuilderAudio", () => {
    let mockActivity;
    let mockSynth;
    let audio;

    beforeEach(() => {
        jest.useFakeTimers();

        mockSynth = {
            trigger: jest.fn(),
            stop: jest.fn()
        };

        mockActivity = {
            logo: {
                synth: mockSynth
            }
        };

        audio = new ChordBuilderAudio(mockActivity);
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    describe("Constructor", () => {
        it("initializes with default state", () => {
            expect(audio.isPlaying).toBe(false);
            expect(audio.activeStep).toBe(-1);
            expect(audio.logo).toBe(mockActivity.logo);
        });

        it("accepts dependency injection for logo and timers", () => {
            const customLogo = { synth: { trigger: jest.fn(), stop: jest.fn() } };
            const customTimerManager = { setTimeout: jest.fn(), clearAllTimeouts: jest.fn() };
            const customAudio = new ChordBuilderAudio(null, {
                logo: customLogo,
                timerManager: customTimerManager
            });

            expect(customAudio.logo).toBe(customLogo);
            expect(customAudio._timerManager).toBe(customTimerManager);
        });
    });

    describe("assignOctaves", () => {
        it("returns empty array for invalid input", () => {
            expect(audio.assignOctaves(null)).toEqual([]);
            expect(audio.assignOctaves([])).toEqual([]);
            expect(audio.assignOctaves("not an array")).toEqual([]);
        });

        it("assigns base octave to ascending triad without octave wrap", () => {
            const notes = ["C", "E", "G"];
            expect(audio.assignOctaves(notes, 4)).toEqual(["C4", "E4", "G4"]);
        });

        it("increments octave when notes wrap around C (e.g. G to D)", () => {
            const notes = ["G", "B", "D"];
            expect(audio.assignOctaves(notes, 4)).toEqual(["G4", "B4", "D5"]);
        });

        it("handles seventh chords across multiple octaves correctly", () => {
            const notes = ["A", "C", "E", "G"];
            expect(audio.assignOctaves(notes, 4)).toEqual(["A4", "C5", "E5", "G5"]);
        });

        it("handles sharps and flats correctly", () => {
            const sharpNotes = ["F#", "A#", "C#"];
            expect(audio.assignOctaves(sharpNotes, 3)).toEqual(["F#3", "A#3", "C#4"]);

            const flatNotes = ["Eb", "G", "Bb"];
            expect(audio.assignOctaves(flatNotes, 4)).toEqual(["Eb4", "G4", "Bb4"]);
        });
    });

    describe("playChord", () => {
        it("returns false if synth is unavailable", () => {
            const noSynthAudio = new ChordBuilderAudio({});
            expect(noSynthAudio.playChord({ notes: ["C", "E", "G"] })).toBe(false);
        });

        it("returns false if chord has no notes", () => {
            expect(audio.playChord(null)).toBe(false);
            expect(audio.playChord([])).toBe(false);
            expect(audio.playChord({ notes: [] })).toBe(false);
        });

        it("triggers synth for each note in the chord with strum offset", () => {
            const chord = { notes: ["C", "E", "G"] };
            const res = audio.playChord(chord, 0.5, {
                octave: 4,
                voice: "piano",
                strum: 0.03,
                turtle: 1
            });

            expect(res).toBe(true);
            expect(mockSynth.trigger).toHaveBeenCalledTimes(3);

            // Check note pitches and strum offsets
            expect(mockSynth.trigger).toHaveBeenNthCalledWith(
                1,
                1, // turtle
                "C4",
                0.5,
                "piano",
                null,
                null,
                false,
                0 // 0 * strum
            );
            expect(mockSynth.trigger).toHaveBeenNthCalledWith(
                2,
                1,
                "E4",
                0.5,
                "piano",
                null,
                null,
                false,
                0.03 // 1 * strum
            );
            expect(mockSynth.trigger).toHaveBeenNthCalledWith(
                3,
                1,
                "G4",
                0.5,
                "piano",
                null,
                null,
                false,
                0.06 // 2 * strum
            );
        });

        it("accepts direct array of notes", () => {
            const res = audio.playChord(["D", "F", "A"], 0.4);
            expect(res).toBe(true);
            expect(mockSynth.trigger).toHaveBeenCalledTimes(3);
            expect(mockSynth.trigger).toHaveBeenNthCalledWith(
                1,
                0,
                "D4",
                0.4,
                "piano",
                null,
                null,
                false,
                0
            );
        });
    });

    describe("playProgression", () => {
        it("returns early and calls onDone if progression is empty", () => {
            const onDone = jest.fn();
            audio.playProgression([], 120, null, onDone);

            expect(audio.isPlaying).toBe(false);
            expect(onDone).toHaveBeenCalled();
            expect(mockSynth.trigger).not.toHaveBeenCalled();
        });

        it("plays progression steps sequentially with timing and callbacks", () => {
            const progression = [
                { name: "C", notes: ["C", "E", "G"] },
                { name: "G", notes: ["G", "B", "D"] },
                { name: "Am", notes: ["A", "C", "E"] },
                { name: "F", notes: ["F", "A", "C"] }
            ];

            const onStep = jest.fn();
            const onDone = jest.fn();

            // At 120 BPM, beatsPerChord = 2 (default):
            // secondsPerBeat = 0.5s -> stepDuration = 1.0s (1000ms)
            audio.playProgression(progression, 120, onStep, onDone);

            expect(audio.isPlaying).toBe(true);

            // Step 0 triggers immediately
            jest.advanceTimersByTime(10);
            expect(onStep).toHaveBeenCalledWith(0, progression[0]);
            expect(audio.activeStep).toBe(0);

            // Advance to Step 1 (at 1000ms)
            jest.advanceTimersByTime(1000);
            expect(onStep).toHaveBeenCalledWith(1, progression[1]);
            expect(audio.activeStep).toBe(1);

            // Advance to Step 2 (at 2000ms)
            jest.advanceTimersByTime(1000);
            expect(onStep).toHaveBeenCalledWith(2, progression[2]);
            expect(audio.activeStep).toBe(2);

            // Advance to Step 3 (at 3000ms)
            jest.advanceTimersByTime(1000);
            expect(onStep).toHaveBeenCalledWith(3, progression[3]);
            expect(audio.activeStep).toBe(3);

            // Complete playback (at 4000ms)
            jest.advanceTimersByTime(1000);
            expect(audio.isPlaying).toBe(false);
            expect(audio.activeStep).toBe(-1);
            expect(onDone).toHaveBeenCalled();
        });

        it("clamps invalid or extreme BPM values", () => {
            const progression = [{ name: "C", notes: ["C", "E", "G"] }];
            audio.playProgression(progression, -50); // should clamp to 30
            expect(audio.isPlaying).toBe(true);
        });
    });

    describe("stop", () => {
        it("clears timers, resets playing flag, and calls synth stop", () => {
            const progression = [
                { name: "C", notes: ["C", "E", "G"] },
                { name: "G", notes: ["G", "B", "D"] }
            ];
            const onDone = jest.fn();

            audio.playProgression(progression, 120, null, onDone);
            expect(audio.isPlaying).toBe(true);

            audio.stop();

            expect(audio.isPlaying).toBe(false);
            expect(audio.activeStep).toBe(-1);
            expect(mockSynth.stop).toHaveBeenCalled();
            expect(onDone).toHaveBeenCalled();

            // After stopping, no further steps should trigger
            mockSynth.trigger.mockClear();
            jest.advanceTimersByTime(5000);
            expect(mockSynth.trigger).not.toHaveBeenCalled();
        });

        it("does not call onDone again if stop() is called after playback completion", () => {
            const progression = [{ name: "C", notes: ["C", "E", "G"] }];
            const onDone = jest.fn();

            audio.playProgression(progression, 120, null, onDone);
            jest.advanceTimersByTime(2000);
            expect(onDone).toHaveBeenCalledTimes(1);

            audio.stop();
            expect(onDone).toHaveBeenCalledTimes(1);
        });
    });
});
