// Copyright (c) 2026 Music Blocks contributors
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
   global

   INTERVALVALUES, CHORDNAMES, CHORDVALUES
 */
/*
    Globals location
     - js/utils/musicutils-constants.js
         INTERVALVALUES, CHORDNAMES
     - js/utils/musicutils-modecore.js
         CHORDVALUES
*/
/* exported HarmonyUtils */

/**
 * @file HarmonyUtils.js
 * @description Pure helpers for the Harmony row of the Status widget: name the
 * intervals and chord formed by the notes sounding at one moment, and compare
 * each played frequency ratio with its just-intonation ideal.
 */

const HarmonyUtils = {
    /**
     * INTERVALVALUES key used to name each simple interval, indexed by semitones.
     * @type {Array<string>}
     */
    INTERVAL_KEYS: [
        "perfect 1",
        "minor 2",
        "major 2",
        "minor 3",
        "major 3",
        "perfect 4",
        "augmented 4",
        "perfect 5",
        "minor 6",
        "major 6",
        "minor 7",
        "major 7"
    ],

    /**
     * Describes the interval between two frequencies.
     * The interval is named after the nearest 12-semitone step, so that it
     * stays readable in other temperaments; `cents` then shows how far the
     * played ratio is from the just ratio of that interval.
     * @param {number} lowFreq - Frequency of the lower note, in Hz.
     * @param {number} highFreq - Frequency of the upper note, in Hz.
     * @returns {Object|null} { name, octaves, semitones, ideal, played, cents },
     *     where `name` is an INTERVALVALUES key and `octaves` counts the extra
     *     octaves of a compound interval. Null if a frequency is invalid.
     */
    describeInterval(lowFreq, highFreq) {
        if (!(lowFreq > 0) || !(highFreq > 0) || !isFinite(lowFreq) || !isFinite(highFreq)) {
            return null;
        }

        const played = highFreq / lowFreq;
        const semitones = Math.round(12 * Math.log2(played));
        let octaves = Math.floor(semitones / 12);
        const simple = semitones - 12 * octaves;

        let name = HarmonyUtils.INTERVAL_KEYS[simple];
        if (simple === 0 && octaves > 0) {
            name = "perfect 8";
            octaves -= 1;
        }

        const ideal = INTERVALVALUES[name][2] * Math.pow(2, octaves);

        return {
            name,
            octaves,
            semitones,
            ideal,
            played,
            cents: 1200 * Math.log2(played / ideal)
        };
    },

    /**
     * Finds the semitone chord (from CHORDNAMES/CHORDVALUES) built from a set
     * of pitch classes, trying each pitch class as the root so inversions match.
     * @param {Array<number>} pitchClasses - Pitch classes, 0-11.
     * @returns {Object|null} { name, root } where `name` is a CHORDNAMES entry
     *     and `root` is the matching pitch class, or null if nothing matches.
     */
    findChord(pitchClasses) {
        const unique = [...new Set(pitchClasses)];
        if (unique.length < 3) {
            return null;
        }

        // The last entry is the user-defined custom chord.
        for (let i = 0; i < CHORDVALUES.length - 1; i++) {
            const chord = CHORDVALUES[i];
            if (chord.length !== unique.length || !chord.every(step => step[0] === 0)) {
                continue;
            }

            const shape = chord
                .map(step => step[1])
                .sort((a, b) => a - b)
                .join(",");

            for (const root of unique) {
                const relative = unique
                    .map(pc => (((pc - root) % 12) + 12) % 12)
                    .sort((a, b) => a - b)
                    .join(",");
                if (relative === shape) {
                    return { name: CHORDNAMES[i], root };
                }
            }
        }

        return null;
    },

    /**
     * Analyzes the notes sounding at one moment.
     * @param {Array<{label: string, frequency: number}>} voices - One entry per
     *     sounding note, e.g. { label: "E4", frequency: 329.63 }.
     * @returns {Object} { voices, intervals, chord }: `voices` sorted from low to
     *     high, `intervals` from the lowest voice to each other voice, and `chord`
     *     as { name, root } with `root` the label of the root voice, or null.
     */
    analyze(voices) {
        const sorted = (voices || [])
            .filter(voice => voice && voice.frequency > 0 && isFinite(voice.frequency))
            .sort((a, b) => a.frequency - b.frequency);

        if (sorted.length < 2) {
            return { voices: sorted, intervals: [], chord: null };
        }

        const bass = sorted[0];
        const intervals = sorted
            .slice(1)
            .map(voice =>
                Object.assign(
                    { from: bass.label, to: voice.label },
                    HarmonyUtils.describeInterval(bass.frequency, voice.frequency)
                )
            );

        const pitchClasses = [0].concat(intervals.map(interval => interval.semitones % 12));
        const found = HarmonyUtils.findChord(pitchClasses);
        let chord = null;
        if (found) {
            const rootVoice = sorted[pitchClasses.indexOf(found.root)];
            chord = { name: found.name, root: rootVoice.label };
        }

        return { voices: sorted, intervals, chord };
    }
};

if (typeof window !== "undefined") {
    window.HarmonyUtils = HarmonyUtils;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return HarmonyUtils;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = HarmonyUtils;
}
