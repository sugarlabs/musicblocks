// Copyright (c) 2016-23 Walter Bender
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

   _, INVALIDPITCH
 */

/*
   exported

   stripMicrotonalPrefix, normalizeNoteAccidentals, noteToObj,
   frequencyToPitch, numberToPitchSharp, getNumber, _parse_pitch_string,
   _calculate_pitch_number, parseNoteString, noteToPitchOctave, getNumNote,
   calcOctave, calcOctaveInterval, MusicUtilsPitch
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var {
        A0,
        C10,
        PITCHES,
        PITCHES2,
        NOTESTEP,
        DOUBLEFLAT,
        DOUBLESHARP,
        FLAT,
        SHARP,
        ACCIDENTAL_SEMITONE_MAP,
        EQUIVALENTSHARPS,
        EQUIVALENTFLATS,
        EQUIVALENTNATURALS,
        NOTESSHARP,
        NOTESFLAT,
        NOTESTABLE,
        SOLFEGENAMES1
    } = MusicUtilsConstants;
    var MusicUtilsI18n =
        (typeof window !== "undefined" && window.MusicUtilsI18n) ||
        (typeof require !== "undefined" ? require("./musicutils-i18n") : {});
    var { FIXEDSOLFEGE1 } = MusicUtilsI18n;
    var MusicUtilsTemperament =
        (typeof window !== "undefined" && window.MusicUtilsTemperament) ||
        (typeof require !== "undefined" ? require("./musicutils-temperament") : {});
    var { getCurrentEDO, getTemperament, generateNoteNames, isTrueEDO, TEMPERAMENT } =
        MusicUtilsTemperament;
}

/**
 * Strip at most two leading microtonal ^ / v prefixes (the temperament
 * widget uses them for cents display, e.g. "^C" or "vvD♭"). Limiting to
 * two keeps any accidental real articulation prefix from being removed.
 * @param {string} note
 * @returns {string}
 */
var stripMicrotonalPrefix = s => s.replace(/^[v^]{1,2}/, "");

function normalizeNoteAccidentals(note) {
    const map = { "♭": "b", "♯": "#", "𝄫": "bb", "𝄪": "x" };
    // Strip at most two leading ^ / v so "^C"/"vvD♭" resolve but "^^^C" keeps a "^"
    return stripMicrotonalPrefix(note).replace(/[♭♯𝄫𝄪]/gu, m => map[m]);
}

/**
 * Convert a note string to an object containing the note and octave.
 * @function
 * @param {string} note - The note string.
 * @returns {Array} An array containing the note and octave.
 */
var noteToObj = note => {
    if (typeof note !== "string" || note.length === 0) {
        return [note, 4];
    }
    const match = note.match(/^(.*?)(-?\d+)$/);
    if (match) {
        return [match[1], parseInt(match[2], 10)];
    }
    return [note, 4];
};

/**
 * Convert a frequency to pitch, returning the note, octave, and cents.
 * @function
 * @param {number} hz - The frequency in hertz.
 * @param {string} [temperament="equal"] - The temperament to use.
 * @returns {Array} An array containing the note, octave, and cents.
 */
var frequencyToPitch = (hz, temperament) => {
    const currentEDO = getCurrentEDO(temperament);
    const t = getTemperament(temperament);
    if (t && !t.isEDO && t.noteLabels && t.ratios) {
        const aIdx = t.noteLabels.indexOf("A");
        const baseRefFreq = A0 / t.ratios[aIdx];
        const approxOctave = Math.floor(Math.log(hz / baseRefFreq) / Math.log(2));

        let bestNote = t.noteLabels[0];
        let bestOctave = 0;
        let bestCents = Infinity;

        for (let o = Math.max(0, approxOctave - 1); o <= approxOctave + 1; o++) {
            for (let i = 0; i < t.noteLabels.length; i++) {
                const freq = baseRefFreq * t.ratios[i] * Math.pow(2, o);
                const centsDiff = 1200 * (Math.log(hz / freq) / Math.log(2));
                if (Math.abs(centsDiff) < Math.abs(bestCents)) {
                    bestCents = centsDiff;
                    bestNote = t.noteLabels[i];
                    bestOctave = o;
                }
            }
        }

        if (Math.abs(bestCents) < 0.5) {
            bestCents = 0;
        }

        return [bestNote, bestOctave, Math.round(bestCents * 10) / 10];
    }

    // 1200 cents = one octave (constant for all temperaments)
    const centsPerStep = 1200 / currentEDO;

    // Calculate the pitch and octave based on frequency, rounding to
    // the nearest cent.

    if (hz < A0) {
        return ["A", 0, 0];
    } else if (hz > C10) {
        return ["C", 10, 0];
    }

    const steps = currentEDO * (Math.log(hz / A0) / Math.log(2));
    const roundedSteps = Math.round(steps);
    let cents = (steps - roundedSteps) * centsPerStep;
    if (cents > centsPerStep / 2) {
        cents -= centsPerStep;
    } else if (cents <= -centsPerStep / 2) {
        cents += centsPerStep;
    }
    if (Math.abs(cents) < 0.5) {
        cents = 0;
    }

    const stepIndex = ((roundedSteps % currentEDO) + currentEDO) % currentEDO;

    if (currentEDO !== 12) {
        const names = generateNoteNames(currentEDO);
        const aIndex = names.indexOf("A");
        const tableIndex = (stepIndex + aIndex) % currentEDO;
        const pitchName = names[tableIndex];
        const octaveNumber = Math.floor((roundedSteps + aIndex) / currentEDO);
        return [pitchName, octaveNumber, cents];
    }

    const nameIndex = Math.round((stepIndex / currentEDO) * 12);
    const pitchName = PITCHES[(nameIndex + PITCHES.indexOf("A")) % PITCHES.length];
    const octaveNumber = Math.floor((roundedSteps + PITCHES.indexOf("A")) / currentEDO);

    return [pitchName, octaveNumber, cents];
};

/**
 * Convert a numeric representation to a pitch with sharps.
 * @function
 * @param {number} i - The numeric representation of the pitch.
 * @returns {Array} An array containing the pitch and octave.
 */
var numberToPitchSharp = (i, temperament) => {
    if (typeof i !== "number" || !Number.isFinite(i)) {
        return ["A", 0];
    }
    const currentEDO = getCurrentEDO(temperament);
    if (currentEDO === 12) {
        const octave = Math.floor((i + PITCHES2.indexOf("A")) / 12);
        const stepIndex = ((i % 12) + 12) % 12;
        const nameIndex = Math.round((stepIndex / 12) * 12);
        return [PITCHES2[(nameIndex + PITCHES2.indexOf("A")) % 12], octave];
    }
    const edoNames = generateNoteNames(currentEDO);
    let aIndex = edoNames.indexOf("A");
    if (aIndex === -1) {
        aIndex = Math.round((9 / 12) * currentEDO);
    }
    const octave = Math.floor((i + aIndex) / currentEDO);
    const stepIndex = ((i % currentEDO) + currentEDO) % currentEDO;
    const nameIndex = Math.round((stepIndex / currentEDO) * currentEDO);
    return [edoNames[(nameIndex + aIndex) % currentEDO], octave];
};

/**
 * Convert a note and octave to a numeric representation.
 * @function
 * @param {string} notename - The note name (e.g., C, D, E, etc.).
 * @param {number} octave - The octave number.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     temperament's EDO is used (legacy behavior).
 * @returns {number} The numeric representation of the note.
 * @example
 * getNumber("C", 4, "equal")     // 12-EDO: 37
 * getNumber("C", 4, "equal", 19) // 19-EDO: 57
 * getNumber("C", 4, "equal", 31) // 31-EDO: 93
 * getNumber("A", 4, "equal")     // 12-EDO: 69 (MIDI A4)
 */
var getNumber = (notename, octave, temperament, edo) => {
    // Converts a note, e.g., C, and octave to a number
    let currentEDO = edo;
    if (!currentEDO) {
        currentEDO = getCurrentEDO(temperament);
    }
    let num;
    if (octave < 0) {
        num = 0;
    } else if (octave > 10) {
        num = 9 * currentEDO;
    } else {
        num = currentEDO * (octave - 1);
    }

    notename = String(notename);
    if (notename.substring(0, 1) in NOTESTEP) {
        num += Math.round((NOTESTEP[notename.substring(0, 1)] / 12) * currentEDO);
        if (notename.length >= 1) {
            const delta = notename.substring(1);
            if (delta === "bb" || delta === DOUBLEFLAT) {
                num -= 2;
            } else if (delta === "##" || delta === "*" || delta === DOUBLESHARP) {
                num += 2;
            } else if (delta === "b" || delta === FLAT) {
                num -= 1;
            } else if (delta === "#" || delta === SHARP) {
                num += 1;
            }
        }
    }

    return num;
};

/**
 * Parses a pitch string into its note name and octave components.
 * Handles single and double accidentals (#, b, ♯, ♭, x, 𝄪, 𝄫).
 * @param {string} str - The pitch string (e.g. "C4", "A#10", "F𝄪5").
 * @returns {Array} An array containing [normalizedNoteName, octave].
 */
function _parse_pitch_string(str) {
    const match = str.match(/^([A-Ga-g])([#b♭♯𝄪𝄫x]*)(-?\d+)$/u);
    if (match) {
        const baseLetter = match[1].toUpperCase();
        const accidentalStr = match[2];
        const octave = parseInt(match[3], 10);

        if (!accidentalStr) {
            // No accidentals; return as-is
            return [baseLetter, octave];
        }

        // Sum up semitone offsets for all accidental characters.
        // 𝄪 and 𝄫 are multi-byte but treated as single code points by spread.
        const accidentalChars = [...accidentalStr];
        const semitoneOffset = accidentalChars.reduce(
            (sum, char) => sum + (ACCIDENTAL_SEMITONE_MAP[char] || 0),
            0
        );

        // Build a normalized name using canonical SHARP/FLAT symbols.
        let normalizedName;
        if (semitoneOffset === 0) {
            normalizedName = baseLetter;
        } else if (semitoneOffset === 1) {
            normalizedName = baseLetter + SHARP;
        } else if (semitoneOffset === -1) {
            normalizedName = baseLetter + FLAT;
        } else if (semitoneOffset === 2) {
            normalizedName = baseLetter + DOUBLESHARP;
        } else if (semitoneOffset === -2) {
            normalizedName = baseLetter + DOUBLEFLAT;
        } else {
            // For unusual combinations, keep semitone representation as extra sharps/flats
            const sym = semitoneOffset > 0 ? SHARP : FLAT;
            normalizedName = baseLetter + sym.repeat(Math.abs(semitoneOffset));
        }

        return [normalizedName, octave];
    }
    // Fallback: no octave digit found – normalize accidentals and default octave to 4
    return [str.replaceAll("#", SHARP).replaceAll("b", FLAT), 4];
}

/**
 * Calculates a pitch number from a note name and octave.
 * @param {string} noteName - The name of the note (e.g. "C", "C#").
 * @param {number} octave - The octave number.
 * @param {number} applyOffset - The offset to apply.
 * @param {string} temperament - The temperament to use (default "equal").
 * @returns {number|string} The calculated pitch number or INVALIDPITCH if calculation fails.
 */
function _calculate_pitch_number(noteName, octave, applyOffset = 0, temperament) {
    if (typeof noteName !== "string") {
        return INVALIDPITCH;
    }
    const currentEDO = getCurrentEDO(temperament);

    let name = noteName
        .replaceAll("x", DOUBLESHARP)
        .replaceAll("*", DOUBLESHARP)
        .replaceAll("#", SHARP)
        .replaceAll("b", FLAT);

    // Non-equal temperaments: look up directly against the temperament's own noteLabels.
    // Do NOT use generateNoteNames() which produces EDO-specific names.
    const t = temperament ? getTemperament(temperament) : null;
    if (t && !isTrueEDO(temperament) && t.noteLabels && t.ratios) {
        const noteIdx = t.noteLabels.indexOf(name);
        if (noteIdx !== -1) {
            const aIdx = t.noteLabels.indexOf("A");
            const offset = aIdx !== -1 ? aIdx : 0;
            const result =
                (parseInt(octave, 10) + 1) * t.ratios.length + noteIdx - offset - applyOffset;
            return result;
        }
        return INVALIDPITCH;
    }

    // For non-12 EDO: normalize double accidentals to repeated single characters
    // to match the EDO name table (generateNoteNames uses SHARP/FLAT repeated).
    // Must happen before EQUIVALENT lookups so the EDO table match is tried first.
    if (currentEDO !== 12) {
        name = name.replaceAll(DOUBLESHARP, SHARP + SHARP).replaceAll(DOUBLEFLAT, FLAT + FLAT);
    }

    // For non-12 EDO: look up directly in the EDO-specific name table first.
    // Do NOT use EQUIVALENTNATURALS which maps to 12-EDO enharmonic equivalents.
    if (currentEDO !== 12) {
        const edoNames = generateNoteNames(currentEDO);
        let edoIndex = edoNames.indexOf(name);
        if (edoIndex === -1) {
            // Try EQUIVALENTSHARPS / EQUIVALENTFLATS for single-accidental aliases
            if (EQUIVALENTSHARPS[name]) {
                edoIndex = edoNames.indexOf(EQUIVALENTSHARPS[name]);
            } else if (EQUIVALENTFLATS[name]) {
                edoIndex = edoNames.indexOf(EQUIVALENTFLATS[name]);
            }
        }
        if (edoIndex !== -1) {
            const aIndex = edoNames.indexOf("A");
            const offset = aIndex !== -1 ? aIndex : Math.round((9 / 12) * currentEDO);
            return (parseInt(octave, 10) + 1) * currentEDO + edoIndex - offset - applyOffset;
        }
        // Name not found in EDO table — return INVALIDPITCH rather than
        // falling back to 12-EDO arrays which would give wrong results.
        console.debug(
            "WARNING: _calculate_pitch_number: [" +
                name +
                '] (from input "' +
                noteName +
                '") not found in generateNoteNames(' +
                currentEDO +
                ")"
        );
        return INVALIDPITCH;
    }

    // 12-EDO path: use EQUIVALENT lookups then NOTESSHARP / NOTESFLAT.
    if (EQUIVALENTSHARPS[name]) {
        name = EQUIVALENTSHARPS[name];
    } else if (EQUIVALENTFLATS[name]) {
        name = EQUIVALENTFLATS[name];
    } else if (EQUIVALENTNATURALS[name]) {
        name = EQUIVALENTNATURALS[name];
    }

    let pitchIndex = NOTESSHARP.indexOf(name);
    if (pitchIndex === -1) {
        pitchIndex = NOTESFLAT.indexOf(name);
    }

    if (pitchIndex === -1) {
        return INVALIDPITCH;
    }

    return (parseInt(octave, 10) + 1) * currentEDO + pitchIndex - applyOffset;
}

/**
 * Parse a note string into note name and octave.
 * This function correctly handles multi-digit octaves by using regex.
 * @function
 * @param {string} note - The note string (e.g., "C4", "C#10", "Db-1").
 * @returns {Array} An array containing [noteName, octave].
 */
var parseNoteString = note => {
    if (!note) return ["", NaN];

    // Regex to match note name and octave:
    // 1. Optional microtonal prefixes (^ or v)
    // 2. Base note name (Western, Solfege, Carnatic)
    // 3. Optional accidentals
    // 4. Octave (one or more digits, optional negative sign)
    const match = note.match(
        /^([\^v]*(?:[a-g]|do|re|mi|fa|sol|la|ti|si|ut|sa|ga|ma|pa|dha|ni)(?:[#b♯♭𝄪𝄫x♮]*))(-?\d+)$/iu
    );

    if (match) {
        return [match[1], Number(match[2])];
    }

    // If completely unparseable, return the whole string as the note with NaN octave.
    // This is safer than silently chopping off the last character.
    return [note, NaN];
};

/**
 * Convert a note string to pitch and octave.
 * @function
 * @param {string} note - The note string.
 * @returns {Array} An array containing pitch and octave.
 */
var noteToPitchOctave = note => {
    return parseNoteString(note);
};

/**
 * Convert a number to a note with octave.
 * @function
 * @param {number} value - The number representing the note.
 * @param {number} delta - The delta to adjust the value.
 * @returns {Array} An array containing the note and octave.
 */
var getNumNote = (value, delta, temperament) => {
    // Converts from number to note.
    // Respects the active temperament octave size so that non-12-EDO
    // tuning systems wrap correctly instead of always assuming 12 semitones.
    let num = value + delta;

    const octaveSize =
        temperament && TEMPERAMENT[temperament] && TEMPERAMENT[temperament]["pitchNumber"]
            ? TEMPERAMENT[temperament]["pitchNumber"]
            : 12;

    let octave = Math.floor(num / octaveSize);
    num = ((num % octaveSize) + octaveSize) % octaveSize;

    const tableIndex = Math.round((num / octaveSize) * 12) % 12;
    const note = NOTESTABLE[tableIndex];

    if (note === "ti") {
        octave -= 1;
    }

    return [note, octave + 1];
};

/**
 * Calculate the octave based on the current octave, argument, last note played, and current note.
 * @function
 * @param {number} currentOctave - The current octave.
 * @param {(number|string)} arg - The argument for octave calculation.
 * @param {Array} lastNotePlayed - The last note played.
 * @param {string} currentNote - The current note.
 * @returns {number} The calculated octave.
 */
var calcOctave = (currentOctave, arg, lastNotePlayed, currentNote, temperament) => {
    // Calculate the octave based on the current Octave and the arg,
    // which can be a number, a 'number' as a string, 'current',
    // 'previous', or 'next'.

    if (typeof arg === "number") {
        return Math.max(1, Math.min(Math.floor(arg), 9));
    }

    const currentEDO = getCurrentEDO(temperament);

    // The relative octave for tritones are arbitrated as being in the
    // current octave, so we need to determine the number of half
    // steps between lastNotePlayed and currentNote.
    let note, changedCurrent;

    if (SOLFEGENAMES1.includes(currentNote)) {
        note = FIXEDSOLFEGE1[currentNote];
    } else {
        note = currentNote;
    }

    const stepCurrentNote = getNumber(note, currentOctave, temperament);
    const stepUpCurrentNote = getNumber(note, currentOctave + 1, temperament);
    const stepDownCurrentNote = getNumber(note, currentOctave - 1, temperament);

    if (lastNotePlayed !== null) {
        lastNotePlayed = noteToObj(lastNotePlayed[0])[0];
    } else {
        lastNotePlayed = "G";
    }

    const stepLastNotePlayed = getNumber(lastNotePlayed, currentOctave, temperament);

    const halfSteps = Math.abs(stepLastNotePlayed - stepCurrentNote);
    const halfStepsUp = Math.abs(stepLastNotePlayed - stepUpCurrentNote);
    const halfStepsDown = Math.abs(stepLastNotePlayed - stepDownCurrentNote);

    const octaveThreshold = Math.round(currentEDO / 4);

    if (halfSteps <= octaveThreshold || isNaN(halfSteps)) {
        changedCurrent = currentOctave;
    } else if (halfStepsDown <= halfStepsUp) {
        changedCurrent = Math.max(currentOctave - 1, 1);
    } else if (halfStepsUp < halfStepsDown) {
        changedCurrent = Math.min(currentOctave + 1, 9);
    } else {
        changedCurrent = currentOctave;
    }

    switch (arg) {
        case _("current"):
        case "current":
            return changedCurrent;
        case _("next"):
        case "next":
            return Math.min(changedCurrent + 1, 9);
        case _("previous"):
        case "previous":
            return Math.max(changedCurrent - 1, 1);
        default: {
            // A "number" passed as a string (e.g. "2") is a documented argument,
            // but changedCurrent is always >= 1, so testing it for truthiness
            // first made the numeric conversion unreachable and silently
            // ignored the requested octave.
            const parsed = typeof arg === "string" && arg.trim() !== "" ? Number(arg) : NaN;
            if (!isNaN(parsed)) {
                return Math.max(1, Math.min(Math.floor(parsed), 9));
            }

            return changedCurrent;
        }
    }
};

/**
 * Calculate the octave value based on the argument for intervals.
 * @function
 * @param {(number|string)} arg - The argument for interval octave calculation.
 * @returns {number} The calculated octave value.
 */
var calcOctaveInterval = arg => {
    // Used by intervals to determine octave to use in an interval.
    let value = 0;
    switch (arg) {
        case 1:
        case _("next"):
        case "next":
            value = 1;
            break;
        case -1:
        case _("previous"):
        case "previous":
            value = -1;
            break;
        case _("current"):
        case "current":
        case 0:
            value = 0;
            break;
        case 2:
            value = 2;
            break;
        case -2:
            value = -2;
            break;
        default:
            console.debug("Interval octave must be between -2 and 2.");
            value = 0;
            break;
    }

    return value;
};

var MusicUtilsPitch = {
    stripMicrotonalPrefix,
    normalizeNoteAccidentals,
    noteToObj,
    frequencyToPitch,
    numberToPitchSharp,
    getNumber,
    _parse_pitch_string,
    _calculate_pitch_number,
    parseNoteString,
    noteToPitchOctave,
    getNumNote,
    calcOctave,
    calcOctaveInterval
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsPitch;
}

if (typeof window !== "undefined") {
    window.MusicUtilsPitch = MusicUtilsPitch;
}
