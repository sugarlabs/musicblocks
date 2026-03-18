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
   TemperamentEngine — Centralized, temperament-aware frequency computation.

   This module is the core deliverable of the "Backporting v4 Temperament to
   v3" project.  It fixes the fundamental bug in v3's frequency pipeline:

   CURRENT (broken):
     temperamentChanged() builds a STATIC lookup table where every note's
     frequency is a fixed ratio from ONE starting pitch.  This means the
     interval between two non-starting notes (e.g. D→F in C-based JI) is
     whatever falls out of the ratios, NOT the pure interval the user expects.

   NEW (this module):
     Frequencies are computed DYNAMICALLY.  For melody, ratios are relative
     to the temperament's starting pitch (same as before).  For chords,
     ratios are relative to the CHORD ROOT, so every chord sounds pure in
     its own context.

   Design principles (v4 backport):
     - Temperament is an explicit parameter, never implicit global state
     - No hardcoded 12-tone assumptions (uses pitchNumber from TEMPERAMENT)
     - Pure functions — no DOM, no synth, fully testable
     - Backward-compatible: default temperament = "equal" reproduces v3 behavior
*/

const {
    TEMPERAMENT,
    PreDefinedTemperaments,
    getTemperament,
    getOctaveRatio,
    pitchToNumber,
    NOTESSHARP,
    NOTESFLAT,
    SHARP,
    FLAT
} = require("./musicutils");

// ---------- Constants ----------

const A0 = 27.5;
const TWELTHROOT2 = 1.0594630943592953;

// Canonical pitch names (ASCII, sharps) for index lookup.
const PITCH_NAMES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const PITCH_NAMES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

// ---------- Helpers ----------

/**
 * Normalize a pitch name to ASCII sharp form for consistent lookups.
 * Handles Unicode sharp/flat symbols and common ASCII variants.
 *
 * @param {string} pitch - Pitch name (e.g. "C#", "D♭", "E♯")
 * @returns {string} Normalized pitch name with ASCII sharp (e.g. "C#", "C#", "F")
 */
const normalizePitch = pitch => {
    let p = pitch.replace(/♯/g, "#").replace(/♭/g, "b");

    // Convert flats to sharp equivalents for uniform indexing
    const flatIndex = PITCH_NAMES_FLAT.indexOf(p);
    if (flatIndex !== -1 && p.includes("b") && p !== "B") {
        p = PITCH_NAMES_SHARP[flatIndex];
    }

    return p;
};

/**
 * Get the index of a pitch name within the 12-tone chromatic scale.
 * Returns -1 if the pitch is not found.
 *
 * @param {string} pitch - Normalized pitch name (ASCII)
 * @returns {number} Index 0-11, or -1 if not found
 */
const pitchIndex = pitch => {
    const p = normalizePitch(pitch);
    let idx = PITCH_NAMES_SHARP.indexOf(p);
    if (idx === -1) {
        idx = PITCH_NAMES_FLAT.indexOf(p);
    }
    return idx;
};

/**
 * Compute the frequency of a pitch in standard 12-ET.
 * This is the reference frequency used as the "starting point" before
 * applying temperament ratios.
 *
 * @param {string} pitch - Note name (e.g. "C", "D#")
 * @param {number} octave - Octave number
 * @returns {number} Frequency in Hz
 */
const etFrequency = (pitch, octave) => {
    const idx = pitchIndex(pitch);
    if (idx === -1) return 0;
    // pitchNumber relative to A0 (MIDI-like numbering)
    const noteNum = octave * 12 + idx - PITCH_NAMES_SHARP.indexOf("A");
    return A0 * Math.pow(TWELTHROOT2, noteNum);
};

// ---------- Core Engine ----------

/**
 * Get the number of pitch classes per octave for a temperament.
 *
 * @param {string} temperament - Temperament name (e.g. "equal", "just intonation")
 * @returns {number} Pitch count per octave
 */
const getPitchCount = temperament => {
    const t = getTemperament(temperament);
    if (!t) return 12;
    return t.pitchNumber || 12;
};

/**
 * Get the interval array for a temperament.
 *
 * @param {string} temperament - Temperament name
 * @returns {string[]} Array of interval names in ascending order
 */
const getIntervals = temperament => {
    const t = getTemperament(temperament);
    if (!t || !t.interval) return [];
    return t.interval;
};

/**
 * Look up the ratio for a given interval name within a temperament.
 *
 * @param {string} temperament - Temperament name
 * @param {string} intervalName - Interval name (e.g. "major 3", "perfect 5")
 * @returns {number|null} Frequency ratio, or null if not found
 */
const getIntervalRatio = (temperament, intervalName) => {
    const t = getTemperament(temperament);
    if (!t || t[intervalName] === undefined) return null;
    return t[intervalName];
};

/**
 * Find the interval name that corresponds to a given number of scale steps
 * above "perfect 1" in the temperament's interval array.
 *
 * @param {string} temperament - Temperament name
 * @param {number} steps - Number of steps (0 = unison, 1 = first step, ...)
 * @returns {string|null} Interval name, or null if out of range
 */
const intervalAtStep = (temperament, steps) => {
    const intervals = getIntervals(temperament);
    if (steps < 0 || steps >= intervals.length) return null;
    return intervals[steps];
};

/**
 * Compute the number of temperament steps between two pitch names.
 * This is the KEY function that replaces hardcoded % 12 arithmetic.
 *
 * For 12-tone temperaments (equal, JI, Pythagorean), this uses the
 * standard chromatic distance.  For non-12 temperaments (19-EDO, 31-EDO,
 * meantones), it maps chromatic distance to the closest temperament step.
 *
 * @param {string} fromPitch - Source pitch name
 * @param {string} toPitch - Target pitch name
 * @param {string} temperament - Temperament name
 * @returns {number} Number of steps in the temperament's scale
 */
const stepsBetween = (fromPitch, toPitch, temperament) => {
    const fromIdx = pitchIndex(fromPitch);
    const toIdx = pitchIndex(toPitch);
    if (fromIdx === -1 || toIdx === -1) return 0;

    // Chromatic semitone distance (mod 12)
    const chromaticSteps = (((toIdx - fromIdx) % 12) + 12) % 12;

    const pitchCount = getPitchCount(temperament);
    if (pitchCount === 12) {
        return chromaticSteps;
    }

    // For non-12 temperaments, map the 12-tone semitone distance to the
    // nearest step in the target temperament.
    // Ratio: pitchCount/12 gives steps-per-semitone.
    return Math.round(chromaticSteps * (pitchCount / 12));
};

/**
 * Compute the frequency ratio for a given number of steps in a temperament.
 *
 * For equal temperaments: 2^(steps/pitchNumber)
 * For ratio-based temperaments: look up the interval at that step position
 *
 * @param {string} temperament - Temperament name
 * @param {number} steps - Number of steps from root
 * @returns {number} Frequency ratio from root (1.0 = unison, 2.0 = octave)
 */
const ratioForSteps = (temperament, steps) => {
    const pitchCount = getPitchCount(temperament);
    const octaveRatio = getOctaveRatio();

    // Handle octave wrapping
    const octaves = Math.floor(steps / pitchCount);
    const remainder = ((steps % pitchCount) + pitchCount) % pitchCount;

    // Get the ratio for the within-octave portion
    let ratio;
    const intervalName = intervalAtStep(temperament, remainder);
    if (intervalName) {
        ratio = getIntervalRatio(temperament, intervalName);
    }

    if (ratio === null || ratio === undefined) {
        // Fallback to equal division
        ratio = Math.pow(octaveRatio, remainder / pitchCount);
    }

    // Apply octave transposition
    return ratio * Math.pow(octaveRatio, octaves);
};

/**
 * CORE FUNCTION: Compute the frequency of a note in a given temperament.
 *
 * This is the replacement for the static noteFrequencies grid.
 * Frequency is computed as: rootFrequency * ratio(steps from root).
 *
 * @param {string} pitch - Note name (e.g. "D", "F#")
 * @param {number} octave - Octave number
 * @param {string} temperament - Temperament name
 * @param {string} rootPitch - Root pitch for ratio computation (e.g. "C")
 * @param {number} rootOctave - Root octave (e.g. 4)
 * @returns {number} Frequency in Hz
 */
const getFrequency = (pitch, octave, temperament, rootPitch, rootOctave) => {
    if (temperament === "equal") {
        // For standard 12-ET, the formula is the same regardless of root
        return etFrequency(pitch, octave);
    }

    // Compute the root's reference frequency (using ET, since that's what
    // Tone.js gives us for the starting pitch)
    const rootFreq = etFrequency(rootPitch, rootOctave);

    // How many temperament steps from root to target?
    const octaveDiff = octave - rootOctave;
    const withinOctaveSteps = stepsBetween(rootPitch, pitch, temperament);
    const pitchCount = getPitchCount(temperament);
    const totalSteps = withinOctaveSteps + octaveDiff * pitchCount;

    // Apply the temperament ratio
    return rootFreq * ratioForSteps(temperament, totalSteps);
};

/**
 * Compute frequencies for a chord, with intervals measured from the
 * chord root rather than the temperament's starting pitch.
 *
 * THIS IS THE FIX for the syntonic comma bug.  In the old system,
 * every frequency was a fixed ratio from the starting pitch, so a
 * D-minor chord in C-based JI had D→F = 32/27 (Pythagorean minor 3rd)
 * instead of 6/5 (just minor 3rd).
 *
 * Now, chord intervals are measured from the chord root:
 *   D→F = root * (6/5) = pure just minor 3rd
 *
 * @param {string} chordRootPitch - Root of the chord (e.g. "D")
 * @param {number} chordRootOctave - Octave of chord root
 * @param {Array<[string, number]>} notes - Array of [pitch, octave] pairs
 * @param {string} temperament - Temperament name
 * @returns {number[]} Array of frequencies in Hz
 */
const getChordFrequencies = (chordRootPitch, chordRootOctave, notes, temperament) => {
    return notes.map(([pitch, octave]) => {
        return getFrequency(pitch, octave, temperament, chordRootPitch, chordRootOctave);
    });
};

/**
 * Simulate the OLD (broken) static-grid approach for comparison.
 *
 * This replicates what synthutils.js temperamentChanged() does:
 * all frequencies are fixed ratios from one starting pitch.
 *
 * @param {string} pitch - Note name
 * @param {number} octave - Octave number
 * @param {string} temperament - Temperament name
 * @param {string} startPitch - The temperament's starting pitch
 * @param {number} startOctave - The starting octave
 * @returns {number} Frequency in Hz (using the old static-grid method)
 */
const getFrequencyOldMethod = (pitch, octave, temperament, startPitch, startOctave) => {
    // Old method: ALWAYS compute ratio from the fixed starting pitch
    return getFrequency(pitch, octave, temperament, startPitch, startOctave);
};

// ---------- Exports ----------

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        normalizePitch,
        pitchIndex,
        etFrequency,
        getPitchCount,
        getIntervals,
        getIntervalRatio,
        intervalAtStep,
        stepsBetween,
        ratioForSteps,
        getFrequency,
        getChordFrequencies,
        getFrequencyOldMethod,
        PITCH_NAMES_SHARP,
        PITCH_NAMES_FLAT
    };
}
