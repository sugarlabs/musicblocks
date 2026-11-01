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

/* global DEFAULTVOICE, ManagedTimer */

/**
 * @file ChordBuilderAudio.js
 * @description Audio playback and sequencing logic for the Chord Progression Builder widget.
 * Handles triggering polyphonic/strummed chords through the MusicBlocks synth engine
 * and sequencing progression steps with tempo control.
 */
class ChordBuilderAudio {
    /**
     * @param {object} activity - The main MusicBlocks activity instance.
     * @param {object} [deps] - Optional dependency injection overrides for testing.
     */
    constructor(activity, deps = {}) {
        this.activity = activity;
        this._deps = deps;

        this.logo = deps.logo || (activity && activity.logo) || null;
        this.isPlaying = false;
        this.activeStep = -1;

        /**
         * Timer manager for managing widget timeouts safely.
         * @type {ManagedTimer|null}
         * @private
         */
        this._timerManager =
            deps.timerManager || (typeof ManagedTimer !== "undefined" ? new ManagedTimer() : null);

        /**
         * Set of active timeout IDs for cleanup.
         * @type {Set<number>}
         * @private
         */
        this._activeTimeouts = new Set();
    }

    /**
     * Sets a timeout using ManagedTimer if available, with tracked fallback.
     * @private
     * @param {Function} callback
     * @param {number} delayMs
     * @returns {number}
     */
    _setTimeout(callback, delayMs) {
        if (this._timerManager && typeof this._timerManager.setTimeout === "function") {
            return this._timerManager.setTimeout(callback, delayMs);
        }
        const id = setTimeout(() => {
            this._activeTimeouts.delete(id);
            callback();
        }, delayMs);
        this._activeTimeouts.add(id);
        return id;
    }

    /**
     * Clears all pending playback timeouts.
     * @private
     */
    _clearTimers() {
        if (this._timerManager && typeof this._timerManager.clearAllTimeouts === "function") {
            this._timerManager.clearAllTimeouts();
        }
        for (const id of this._activeTimeouts) {
            clearTimeout(id);
        }
        this._activeTimeouts.clear();
    }

    /**
     * Maps note names in a chord to pitches with proper octave wrapping.
     * E.g. ["C", "E", "G"] at octave 4 -> ["C4", "E4", "G4"].
     * If higher notes wrap around C (e.g. ["G", "B", "D"] -> G4, B4, D5),
     * octave is incremented so notes ascend musically.
     *
     * @param {string[]} notes - Array of note names (e.g. ["C", "E", "G"]).
     * @param {number} [baseOctave=4] - Base octave for the root note.
     * @returns {string[]} Notes with octave numbers (e.g. ["C4", "E4", "G4"]).
     */
    assignOctaves(notes, baseOctave = 4) {
        if (!Array.isArray(notes) || notes.length === 0) {
            return [];
        }

        const LETTER_ORDER = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
        const ACCIDENTAL_OFFSETS = {
            "#": 1,
            "♯": 1,
            "##": 2,
            "x": 2,
            "𝄪": 2,
            "b": -1,
            "♭": -1,
            "bb": -2,
            "𝄫": -2
        };

        const result = [];
        let currentOctave = baseOctave;
        let lastLetter = -1;
        let lastAccidental = 0;

        for (let i = 0; i < notes.length; i++) {
            const note = notes[i];
            const cleanNote = typeof note === "string" ? note.trim() : String(note);
            const letter = cleanNote.charAt(0).toUpperCase();
            const letterIndex = LETTER_ORDER[letter];
            const accidental = cleanNote.slice(1);
            const accidentalOffset = ACCIDENTAL_OFFSETS[accidental] || 0;

            if (i > 0 && letterIndex !== undefined && lastLetter !== -1) {
                if (
                    letterIndex < lastLetter ||
                    (letterIndex === lastLetter && accidentalOffset < lastAccidental)
                ) {
                    currentOctave++;
                }
            }

            lastLetter = letterIndex !== undefined ? letterIndex : -1;
            lastAccidental = accidentalOffset;
            result.push(`${cleanNote}${currentOctave}`);
        }

        return result;
    }

    /**
     * Plays a single chord through the synth.
     *
     * @param {object|string[]} chord - Chord object ({ notes: [...] }) or array of note strings.
     * @param {number} [duration=0.5] - Duration of chord in seconds.
     * @param {object} [options={}] - Options (octave, voice, strum, turtle).
     * @returns {boolean} Whether audio was triggered.
     */
    playChord(chord, duration = 0.5, options = {}) {
        if (!this.logo || !this.logo.synth || typeof this.logo.synth.trigger !== "function") {
            return false;
        }

        const rawNotes = Array.isArray(chord)
            ? chord
            : chord && Array.isArray(chord.notes)
              ? chord.notes
              : [];

        if (rawNotes.length === 0) {
            return false;
        }

        const baseOctave = options.octave !== undefined ? options.octave : 4;
        const voice =
            options.voice || (typeof DEFAULTVOICE !== "undefined" ? DEFAULTVOICE : "piano");
        const strum = options.strum !== undefined ? options.strum : 0.02;
        const turtle = options.turtle !== undefined ? options.turtle : 0;

        const pitchedNotes = this.assignOctaves(rawNotes, baseOctave);

        for (let i = 0; i < pitchedNotes.length; i++) {
            const noteStr = pitchedNotes[i];
            const futureOffset = i * strum;
            this.logo.synth.trigger(
                turtle,
                noteStr,
                duration,
                voice,
                null, // paramsEffects
                null, // paramsFilters
                false, // setNote
                futureOffset
            );
        }

        return true;
    }

    /**
     * Sequentially plays through a progression array of chords.
     *
     * @param {object[]} progression - Array of chord objects.
     * @param {number} [bpm=120] - Tempo in beats per minute.
     * @param {Function} [onStep=null] - Callback invoked on each step: (index, chord).
     * @param {Function} [onDone=null] - Callback invoked when playback finishes or stops.
     * @param {object} [options={}] - Options (octave, voice, beatsPerChord).
     */
    playProgression(progression, bpm = 120, onStep = null, onDone = null, options = {}) {
        this.stop();

        if (!Array.isArray(progression) || progression.length === 0) {
            if (typeof onDone === "function") {
                onDone();
            }
            return;
        }

        const safeBpm = Math.max(30, Math.min(300, Number(bpm) || 120));
        const beatsPerChord = options.beatsPerChord || 2; // Default half-note per chord
        const secondsPerBeat = 60 / safeBpm;
        const stepDurationSec = secondsPerBeat * beatsPerChord;
        const stepDurationMs = stepDurationSec * 1000;

        this.isPlaying = true;
        this._onDoneCallback = onDone;

        progression.forEach((chord, index) => {
            const delayMs = index * stepDurationMs;

            this._setTimeout(() => {
                if (!this.isPlaying) return;

                this.activeStep = index;
                if (typeof onStep === "function") {
                    onStep(index, chord);
                }

                this.playChord(chord, stepDurationSec * 0.9, options);
            }, delayMs);
        });

        // Schedule playback completion
        const totalDurationMs = progression.length * stepDurationMs;
        this._setTimeout(() => {
            if (!this.isPlaying) return;

            this.isPlaying = false;
            this.activeStep = -1;
            this._onDoneCallback = null;
            if (typeof onDone === "function") {
                onDone();
            }
        }, totalDurationMs);
    }

    /**
     * Stops any currently playing progression and resets state.
     */
    stop() {
        this._clearTimers();
        this.isPlaying = false;
        this.activeStep = -1;

        if (this.logo && this.logo.synth && typeof this.logo.synth.stop === "function") {
            this.logo.synth.stop();
        }

        if (typeof this._onDoneCallback === "function") {
            const cb = this._onDoneCallback;
            this._onDoneCallback = null;
            cb();
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ChordBuilderAudio;
}
