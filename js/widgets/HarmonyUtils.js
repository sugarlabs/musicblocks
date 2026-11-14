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

   INTERVALVALUES, CHORDNAMES, CHORDVALUES, pitchToNumber,
   keySignatureToMode, normalizeNoteAccidentals, frequencyToPitch,
   MAQAMTABLE, _
 */
/*
    Globals location
     - js/utils/musicutils-constants.js
         INTERVALVALUES, CHORDNAMES, MAQAMTABLE
     - js/utils/musicutils-modecore.js
         CHORDVALUES
     - js/utils/musicutils-pitchscale.js
         pitchToNumber, keySignatureToMode
     - js/utils/musicutils-pitch.js
         normalizeNoteAccidentals, frequencyToPitch
     - js/loader.js / js/utils/utils.js
         _ (localization)
*/
/* exported HarmonyUtils */

/**
 * @file HarmonyUtils.js
 * @description Pure helpers for the Harmony row of the Status widget: name the
 * intervals and chord formed by the notes sounding at one moment, compare
 * each played frequency ratio with its just-intonation ideal, sort intervals
 * into consonances and dissonances, and find parallel and hidden fifths and
 * octaves between voices.
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
     * Cents an interval may be off a perfect fifth, octave or unison and still
     * count as one in findParallels(): tempered fifths such as 19-EDO (695) or
     * 5-EDO (720) count, other steps such as 31-EDO 658 and 735 do not.
     * @type {number}
     */
    PERFECT_TOLERANCE: 25,

    /**
     * Cents a voice moves by and still moves "by step" in hidden fifths and
     * octaves: a whole tone is 200 cents (189 in 19-EDO, 194 in 31-EDO), an
     * augmented second 300.
     * @type {number}
     */
    STEP_LIMIT: 250,

    /**
     * Names the perfect interval between two frequencies, within
     * PERFECT_TOLERANCE cents.
     * @param {number} lowFreq
     * @param {number} highFreq
     * @returns {string|null} "unison", "octave" (compound included), "fifth"
     *     (compound included) or null.
     */
    perfectKind(lowFreq, highFreq) {
        const tolerance = HarmonyUtils.PERFECT_TOLERANCE;
        const size = Math.abs(1200 * Math.log2(highFreq / lowFreq));
        const simple = size % 1200;
        if (size < tolerance) {
            return "unison";
        }
        if (simple < tolerance || simple > 1200 - tolerance) {
            return "octave";
        }
        return Math.abs(simple - 700) < tolerance ? "fifth" : null;
    },

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
    },

    /**
     * Finds voices that move in parallel fifths, octaves or unisons from one
     * moment to the next: both voices change pitch in the same direction, and
     * they form the same perfect interval (compound intervals included) before
     * and after the move.
     * @param {Array<{voice: *, label: string, frequency: number}>} before - One
     *     note per voice, e.g. { voice: 1, label: "C4", frequency: 261.63 }.
     * @param {Array<{voice: *, label: string, frequency: number}>} after - The
     *     next note of the same voices.
     * @returns {Array<Object>} { kind, voices, from, to } for each pair of voices,
     *     where `kind` is "fifths", "octaves" or "unisons", `voices` holds the two
     *     voice ids, and `from` and `to` their labels before and after the move.
     */
    findParallels(before, after) {
        const isValid = note => note && note.frequency > 0 && isFinite(note.frequency);
        const cents = (low, high) => 1200 * Math.log2(high / low);
        const perfect = HarmonyUtils.perfectKind;

        const moves = (before || [])
            .filter(isValid)
            .map(note => [note, (after || []).find(next => next && next.voice === note.voice)])
            .filter(([, next]) => isValid(next));

        const parallels = [];
        for (let i = 0; i < moves.length; i++) {
            for (let j = i + 1; j < moves.length; j++) {
                const [from1, to1] = moves[i];
                const [from2, to2] = moves[j];
                // A change of less than a cent is the same note.
                const move1 = cents(from1.frequency, to1.frequency);
                const move2 = cents(from2.frequency, to2.frequency);
                if (Math.abs(move1) < 1 || Math.abs(move2) < 1 || move1 * move2 < 0) {
                    continue;
                }

                const was = perfect(from1.frequency, from2.frequency);
                const now = perfect(to1.frequency, to2.frequency);
                let kind = null;
                if (was === "unison" && now === "unison") {
                    kind = "unisons";
                } else if (was && now && was !== "fifth" && now !== "fifth") {
                    kind = "octaves";
                } else if (was === "fifth" && now === "fifth") {
                    kind = "fifths";
                }

                if (kind) {
                    parallels.push({
                        kind,
                        voices: [from1.voice, from2.voice],
                        from: [from1.label, from2.label],
                        to: [to1.label, to2.label]
                    });
                }
            }
        }
        return parallels;
    },

    /**
     * Sorts an interval above the bass into the classes of counterpoint:
     * perfect consonances (unison, fifth and octave, compound included),
     * imperfect consonances (thirds and sixths) and dissonances (seconds,
     * sevenths, the tritone, and the fourth, which is dissonant above the
     * bass). A unison, fifth or octave must be within PERFECT_TOLERANCE cents,
     * so a 658-cent 31-EDO step, named a fifth by its nearest semitone, is
     * dissonant.
     * @param {Object} interval - An entry of analyze().intervals or a
     *     describeInterval() result.
     * @returns {string|null} "perfect", "imperfect", "dissonant", or null if
     *     the interval is not valid.
     */
    classifyConsonance(interval) {
        if (!interval || !(interval.played > 0) || !isFinite(interval.played)) {
            return null;
        }
        if (HarmonyUtils.perfectKind(1, interval.played)) {
            return "perfect";
        }
        const simple = ((interval.semitones % 12) + 12) % 12;
        return [3, 4, 8, 9].includes(simple) ? "imperfect" : "dissonant";
    },

    /**
     * Finds hidden (direct) fifths or octaves between two voices: both move
     * the same way, without crossing, into a perfect fifth or octave
     * (compound included) that they did not already form, and the upper voice
     * leaps. Counterpoint allows this between the outer voices only when the
     * upper voice moves by step, so callers check the outer voices.
     * @param {Array<{voice: *, label: string, frequency: number}>} before - The
     *     two voices at one moment.
     * @param {Array<{voice: *, label: string, frequency: number}>} after - The
     *     same two voices at the next moment.
     * @returns {Array<Object>} At most one { kind, voices, from, to }, where
     *     `kind` is "fifths" or "octaves" and the voices are listed low to high.
     */
    findHiddenPerfects(before, after) {
        const isValid = note => note && note.frequency > 0 && isFinite(note.frequency);
        const cents = (low, high) => 1200 * Math.log2(high / low);
        if (!Array.isArray(before) || !Array.isArray(after) || before.length !== 2) {
            return [];
        }

        const pairs = before
            .filter(isValid)
            .map(note => [note, after.find(next => next && next.voice === note.voice)])
            .filter(([, next]) => isValid(next));
        if (pairs.length !== 2) {
            return [];
        }

        // Low to high before the move (from a unison, by where they go); the
        // same order after it, or they cross.
        pairs.sort((a, b) => a[0].frequency - b[0].frequency || a[1].frequency - b[1].frequency);
        const [[lowFrom, lowTo], [highFrom, highTo]] = pairs;
        if (lowTo.frequency >= highTo.frequency) {
            return [];
        }

        const lowMove = cents(lowFrom.frequency, lowTo.frequency);
        const highMove = cents(highFrom.frequency, highTo.frequency);
        if (Math.abs(lowMove) < 1 || Math.abs(highMove) < 1 || lowMove * highMove < 0) {
            return [];
        }
        if (Math.abs(highMove) <= HarmonyUtils.STEP_LIMIT) {
            return [];
        }

        const was = HarmonyUtils.perfectKind(lowFrom.frequency, highFrom.frequency);
        const now = HarmonyUtils.perfectKind(lowTo.frequency, highTo.frequency);
        let kind = null;
        // Moving from the same perfect interval is parallel motion, not hidden.
        if (now === "fifth" && was !== "fifth") {
            kind = "fifths";
        } else if (now === "octave" && was !== "octave" && was !== "unison") {
            kind = "octaves";
        }
        if (!kind) {
            return [];
        }

        return [
            {
                kind,
                voices: [lowFrom.voice, highFrom.voice],
                from: [lowFrom.label, highFrom.label],
                to: [lowTo.label, highTo.label],
                frequencies: [lowTo.frequency, highTo.frequency]
            }
        ];
    },

    /**
     * Roman numeral degree labels in major keys indexed by semitone offset from tonic.
     * @type {Object<number, string>}
     */
    MAJOR_DEGREE_MAP: {
        0: "I",
        1: "♭II",
        2: "II",
        3: "♭III",
        4: "III",
        5: "IV",
        6: "♯IV",
        7: "V",
        8: "♭VI",
        9: "VI",
        10: "♭VII",
        11: "VII"
    },

    /**
     * Roman numeral degree labels in minor keys indexed by semitone offset from tonic.
     * @type {Object<number, string>}
     */
    MINOR_DEGREE_MAP: {
        0: "I",
        1: "♭II",
        2: "II",
        3: "III",
        4: "♯III",
        5: "IV",
        6: "♯IV",
        7: "V",
        8: "VI",
        9: "♯VI",
        10: "VII",
        11: "VII"
    },

    /**
     * Expected semitone intervals above the root for chord members (3rd, 5th, 7th),
     * used to verify whether a bass note belongs to the chord or requires a slash-bass fallback.
     * @type {Object<string, {third: number, fifth: number, seventh?: number}>}
     */
    CHORD_MEMBER_INTERVALS: {
        "major": { third: 4, fifth: 7 },
        "minor": { third: 3, fifth: 7 },
        "augmented": { third: 4, fifth: 8 },
        "diminished": { third: 3, fifth: 6 },
        "major 7th": { third: 4, fifth: 7, seventh: 11 },
        "minor 7th": { third: 3, fifth: 7, seventh: 10 },
        "dominant 7th": { third: 4, fifth: 7, seventh: 10 },
        "minor-major 7th": { third: 3, fifth: 7, seventh: 11 },
        "fully-diminished 7th": { third: 3, fifth: 6, seventh: 9 },
        "half-diminished 7th": { third: 3, fifth: 6, seventh: 10 }
    },

    /**
     * Pitch class (0-11) for a given note name or frequency.
     * @param {string|number} note - Note label (e.g. "C4", "F#", "Bb3") or frequency.
     * @returns {number|null} Pitch class from 0 to 11, or null if invalid.
     */
    noteToPitchClass(note) {
        if (!note && note !== 0) {
            return null;
        }
        let clean = String(note).trim();
        if (clean.endsWith("Hz")) {
            const freq = parseFloat(clean);
            if (!(freq > 0) || !isFinite(freq)) {
                return null;
            }
            if (typeof frequencyToPitch === "function") {
                clean = frequencyToPitch(freq)[0];
            } else {
                const semitonesFromA4 = Math.round(12 * Math.log2(freq / 440));
                return (((9 + semitonesFromA4) % 12) + 12) % 12;
            }
        } else {
            clean = clean.replace(/-?\d+$/, "");
        }

        // Normalize natural signs (e.g. C♮, Cnatural) before accidentals
        clean = clean.replace(/[♮]|_?natural/gi, "");

        if (typeof normalizeNoteAccidentals === "function") {
            clean = normalizeNoteAccidentals(clean);
        }

        const baseMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        const solfegeMap = {
            DO: 0,
            RE: 2,
            MI: 4,
            FA: 5,
            SOL: 7,
            SO: 7,
            LA: 9,
            TI: 11,
            SI: 11
        };

        const upper = clean.toUpperCase();
        let pc = null;
        let accStart = 1;

        for (const solf of Object.keys(solfegeMap)) {
            if (upper.startsWith(solf)) {
                pc = solfegeMap[solf];
                accStart = solf.length;
                break;
            }
        }

        if (pc === null) {
            const letter = upper.charAt(0);
            if (letter in baseMap) {
                pc = baseMap[letter];
                accStart = 1;
            }
        }

        // If a root was identified, process complete Unicode accidentals locally
        if (pc !== null) {
            const accs = Array.from(clean.slice(accStart));
            let validAccidentals = true;
            let hasExternalAccidental = false;
            for (const acc of accs) {
                if (acc === "#" || acc === "♯") {
                    pc += 1;
                } else if (acc === "b" || acc === "♭" || acc === "-") {
                    pc -= 1;
                } else if (acc === "𝄪" || acc === "x") {
                    pc += 2;
                } else if (acc === "𝄫") {
                    pc -= 2;
                } else if (acc === "*") {
                    hasExternalAccidental = true;
                } else {
                    validAccidentals = false;
                    break;
                }
            }

            if (validAccidentals && !hasExternalAccidental) {
                return ((pc % 12) + 12) % 12;
            }

            // If trailing accidentals included "*" (Music Blocks double-sharp symbol),
            // delegate to pitchToNumber
            if (validAccidentals && hasExternalAccidental && typeof pitchToNumber === "function") {
                const step = pitchToNumber(clean, 4, "C major", "equal");
                if (step !== undefined && !isNaN(step)) {
                    return (((step - 3) % 12) + 12) % 12;
                }
            }
        }

        return null;
    },

    /**
     * Checks whether a mode name is a recognized musical mode or maqam.
     * @param {string} modeName
     * @returns {boolean}
     */
    isValidMode(modeName) {
        if (!modeName || typeof modeName !== "string") {
            return false;
        }
        const clean = modeName.trim().toLowerCase();
        if (typeof MUSICALMODES !== "undefined" && MUSICALMODES) {
            for (const m in MUSICALMODES) {
                if (m.toLowerCase() === clean) {
                    return true;
                }
            }
        }
        if (typeof MAQAMTABLE !== "undefined" && MAQAMTABLE) {
            for (const mq in MAQAMTABLE) {
                if (mq.toLowerCase() === clean || String(MAQAMTABLE[mq]).toLowerCase() === clean) {
                    return true;
                }
            }
        }
        const standardModes = [
            "major",
            "minor",
            "natural minor",
            "harmonic minor",
            "melodic minor",
            "dorian",
            "phrygian",
            "lydian",
            "mixolydian",
            "aeolian",
            "locrian",
            "ionian",
            "chromatic",
            "pentatonic",
            "whole tone",
            "blues"
        ];
        return standardModes.includes(clean);
    },

    /**
     * Parses a key signature into tonic and mode name.
     * @param {string|number|Array} keySignature - E.g. "C major", "A minor", "G", 0, etc.
     * @returns {[string, string]|null} [tonic, mode] or null if invalid.
     */
    parseKey(keySignature) {
        if (keySignature === null || keySignature === undefined || keySignature === "") {
            return null;
        }

        // 1. Array inputs must be handled BEFORE calling keySignatureToMode,
        // because keySignatureToMode expects a string and defaults arrays to ["C", "major"].
        if (Array.isArray(keySignature)) {
            if (keySignature.length >= 1 && keySignature[0]) {
                const tonic = String(keySignature[0]).trim();
                if (HarmonyUtils.noteToPitchClass(tonic) === null) {
                    return null;
                }
                const rawMode =
                    keySignature.length >= 2 &&
                    keySignature[1] !== undefined &&
                    keySignature[1] !== null
                        ? String(keySignature[1]).trim()
                        : "major";
                if (!HarmonyUtils.isValidMode(rawMode)) {
                    return null;
                }
                return [tonic, rawMode];
            }
            return null;
        }

        // 2. Numeric inputs (e.g. 0, pitch numbers)
        if (typeof keySignature === "number" && !isNaN(keySignature) && isFinite(keySignature)) {
            if (typeof numberToPitch === "function") {
                const res = numberToPitch(keySignature);
                if (Array.isArray(res) && res[0]) {
                    return [res[0], "major"];
                }
            }
            // A-based pitch numbering matching Music Blocks' numberToPitch
            // (pitch 0 = A0, pitch 1 = A♯0, pitch 2 = B0, pitch 3 = C1, pitch 39 = C4)
            const aBasedPitches = ["A", "A♯", "B", "C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯"];
            const idx = ((Math.round(keySignature) % 12) + 12) % 12;
            return [aBasedPitches[idx], "major"];
        }

        // 3. Validate string input
        if (typeof keySignature === "string") {
            const trimmed = keySignature.trim();
            if (!trimmed) {
                return null;
            }

            // Check if input is a recognized Maqam name (e.g. "rast", "bayati")
            if (
                typeof MAQAMTABLE !== "undefined" &&
                Object.prototype.hasOwnProperty.call(MAQAMTABLE, trimmed.toLowerCase())
            ) {
                if (typeof keySignatureToMode === "function") {
                    return keySignatureToMode(trimmed);
                }
                return [trimmed, "maqam"];
            }

            // Extract tonic candidate and test whether it's a valid pitch
            let parts = trimmed.split(/\s+/);
            let tonicCandidate = parts[0];
            let modeCandidate = parts.length > 1 ? parts.slice(1).join(" ") : "major";

            // Support "Am", "Cm" shorthand
            if (parts.length === 1 && tonicCandidate.length > 1 && tonicCandidate.endsWith("m")) {
                tonicCandidate = tonicCandidate.slice(0, -1);
                modeCandidate = "minor";
            }

            // If the tonic candidate cannot be parsed into a pitch class, the key signature is invalid
            if (HarmonyUtils.noteToPitchClass(tonicCandidate) === null) {
                return null;
            }

            // Reject invalid/unrecognized mode names before delegating
            if (!HarmonyUtils.isValidMode(modeCandidate)) {
                return null;
            }

            // Now that we've verified the key input is non-garbage, delegate to keySignatureToMode if present
            if (typeof keySignatureToMode === "function") {
                const parsed = keySignatureToMode(trimmed);
                if (
                    Array.isArray(parsed) &&
                    parsed.length >= 2 &&
                    parsed[0] &&
                    HarmonyUtils.isValidMode(parsed[1])
                ) {
                    return parsed;
                }
            }

            return [tonicCandidate, modeCandidate];
        }

        return null;
    },

    /**
     * Analyzes a chord relative to a key signature and returns its Roman numeral analysis.
     * @param {string|number} rootNote - Root of the chord (e.g. "C", "G3", "440Hz").
     * @param {string} chordName - CHORDNAMES entry (e.g. "major", "minor", "dominant 7th").
     * @param {string|number|Array} keySignature - Active key signature (e.g. "C major", "A minor").
     * @param {string|number} [bassNote] - Lowest sounding note in the chord (for inversion detection).
     * @returns {Object|null} Analysis object or null if inputs are missing/invalid:
     *   { roman, degree, quality, inversion, inversionName, figuredBass, keyTonic, keyMode, formatted }
     */
    romanNumeral(rootNote, chordName, keySignature, bassNote) {
        if (
            !rootNote ||
            !chordName ||
            keySignature === null ||
            keySignature === undefined ||
            keySignature === ""
        ) {
            return null;
        }

        const parsedKey = HarmonyUtils.parseKey(keySignature);
        if (!parsedKey) {
            return null;
        }
        const [keyTonic, mode] = parsedKey;

        const rootPc = HarmonyUtils.noteToPitchClass(rootNote);
        const tonicPc = HarmonyUtils.noteToPitchClass(keyTonic);
        if (rootPc === null || tonicPc === null) {
            return null;
        }

        const delta = (((rootPc - tonicPc) % 12) + 12) % 12;
        const normMode = typeof mode === "string" ? mode.toLowerCase() : "";
        const isMinorKey =
            normMode.includes("minor") ||
            normMode === "aeolian" ||
            normMode === "dorian" ||
            normMode === "phrygian" ||
            normMode === "locrian";

        const degreeMap = isMinorKey
            ? HarmonyUtils.MINOR_DEGREE_MAP
            : HarmonyUtils.MAJOR_DEGREE_MAP;
        const baseDegree = degreeMap[delta];
        if (!baseDegree) {
            return null;
        }

        const isSeventh = chordName.includes("7th");
        const isMinor =
            chordName === "minor" || chordName === "minor 7th" || chordName === "minor-major 7th";
        const isDiminished = chordName.includes("diminished");

        let degreeText = baseDegree;
        if (isMinorKey && delta === 11 && !isDiminished) {
            degreeText = "♯VII";
        }

        if (isMinor || isDiminished) {
            degreeText = degreeText.toLowerCase();
        }

        let inversion = 0;
        let inversionName = null;
        let figuredBass = "";
        let slashBass = null;

        if (bassNote) {
            const bassPc = HarmonyUtils.noteToPitchClass(bassNote);
            if (bassPc !== null && bassPc !== rootPc) {
                const bassDelta = (((bassPc - rootPc) % 12) + 12) % 12;
                const members = HarmonyUtils.CHORD_MEMBER_INTERVALS[chordName];
                if (members && bassDelta === members.third) {
                    inversion = 1;
                    inversionName = "1st inversion";
                    figuredBass = isSeventh ? "⁶₅" : "⁶";
                } else if (members && bassDelta === members.fifth) {
                    inversion = 2;
                    inversionName = "2nd inversion";
                    figuredBass = isSeventh ? "⁴₃" : "⁶⁴";
                } else if (members && isSeventh && bassDelta === members.seventh) {
                    inversion = 3;
                    inversionName = "3rd inversion";
                    figuredBass = "⁴₂";
                } else {
                    inversion = -1;
                    slashBass = String(bassNote).replace(/-?\d+$/, "");
                }
            }
        }

        let roman = degreeText;

        if (chordName === "major" || chordName === "minor") {
            roman += figuredBass;
        } else if (chordName === "diminished") {
            roman += "°" + figuredBass;
        } else if (chordName === "augmented") {
            roman += "+" + figuredBass;
        } else if (chordName === "dominant 7th" || chordName === "minor 7th") {
            roman += figuredBass || "7";
        } else if (chordName === "major 7th") {
            roman += "maj" + (figuredBass || "7");
        } else if (chordName === "half-diminished 7th") {
            roman += "ø" + (figuredBass || "7");
        } else if (chordName === "fully-diminished 7th") {
            roman += "°" + (figuredBass || "7");
        } else if (chordName === "minor-major 7th") {
            roman += "m(maj" + (figuredBass || "7") + ")";
        } else {
            roman += figuredBass;
        }

        if (slashBass) {
            roman += "/" + slashBass;
        }

        const i18n = text => (typeof _ === "function" ? _(text) : text);
        let formatted = roman;
        if (inversionName) {
            formatted += " (" + i18n(inversionName) + ")";
        }
        const keyLabel =
            typeof keySignature === "string" && keySignature.trim()
                ? keySignature
                : keyTonic + " " + i18n(mode);
        formatted += " " + i18n("in") + " " + keyLabel;

        return {
            roman,
            degree: baseDegree,
            quality: chordName,
            inversion,
            inversionName,
            figuredBass,
            keyTonic,
            keyMode: mode,
            formatted
        };
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
