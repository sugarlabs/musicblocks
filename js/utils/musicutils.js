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

   _, last, DRUMNAMES, NOISENAMES, VOICENAMES, INVALIDPITCH,
   CUSTOMSAMPLES, globalActivity, isUnsafeObjectKey
 */

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var {
        SHARP,
        FLAT,
        CENTSSYMBOL,
        NATURAL,
        DOUBLESHARP,
        DOUBLEFLAT,
        BTOFLAT,
        STOSHARP,
        CHROMATIC_SOLFEGE,
        NOTESSHARP,
        NOTESFLAT,
        EQUIVALENTFLATS,
        EQUIVALENTSHARPS,
        EQUIVALENTNATURALS,
        EQUIVALENTACCIDENTALS,
        CONVERT_DOWN,
        CONVERT_DOUBLE_DOWN,
        CONVERT_UP,
        CONVERT_DOUBLE_UP,
        SOLFEGENAMES,
        SOLFEGENAMES1,
        NOTENAMES,
        ALLNOTENAMES,
        NOTENAMES1,
        PITCHES,
        PITCHES1,
        PITCHES2,
        PITCHES3,
        FIXEDSOLFEGE,
        NOTESTEP,
        ALLNOTESTEP,
        SHARPPREFERENCE,
        FLATPREFERENCE,
        SOLFNOTES,
        SCALENOTES,
        SEMITONES,
        A0,
        YSTAFFNOTEHEIGHT,
        YSTAFFOCTAVEHEIGHT,
        ACCIDENTALNAMES,
        ACCIDENTALVALUES,
        INTERVALVALUES,
        MODEPIEMENU_GROUP_RING,
        MODEPIEMENU_NAME_RING,
        DEFAULTINVERT,
        DEFAULTMODE
    } = MusicUtilsConstants;
    var MusicUtilsI18n =
        (typeof window !== "undefined" && window.MusicUtilsI18n) ||
        (typeof require !== "undefined" ? require("./musicutils-i18n") : {});
    var { SOLFEGECONVERSIONTABLE, FIXEDSOLFEGE1, SEMITONETOINTERVALMAP } = MusicUtilsI18n;
    var MusicUtilsTemperament =
        (typeof window !== "undefined" && window.MusicUtilsTemperament) ||
        (typeof require !== "undefined" ? require("./musicutils-temperament") : {});
    var {
        getCurrentEDO,
        generateNoteNames,
        getEdoNoteNamePosition,
        INITIALTEMPERAMENTS,
        TEMPERAMENTS,
        PreDefinedTemperaments,
        INTERVAL_CENTS,
        INTERVAL_ORDER,
        TEMPERAMENT,
        setOctaveRatio,
        getOctaveRatio,
        ratioToWheelAngle,
        getTemperamentsList,
        getTemperament,
        getTemperamentKeys,
        addTemperamentToList,
        deleteTemperamentFromList,
        addTemperamentToDictionary,
        updateTemperaments,
        isCustomTemperament,
        temperamentHasRatios,
        isTrueEDO,
        isEquallyTempered,
        isNonEDO,
        getTemperamentRatio,
        getTemperamentCents,
        getTemperamentName
    } = MusicUtilsTemperament;
    var MusicUtilsPitch =
        (typeof window !== "undefined" && window.MusicUtilsPitch) ||
        (typeof require !== "undefined" ? require("./musicutils-pitch") : {});
    var {
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
    } = MusicUtilsPitch;
    var MusicUtilsLookups =
        (typeof window !== "undefined" && window.MusicUtilsLookups) ||
        (typeof require !== "undefined" ? require("./musicutils-lookups") : {});
    var {
        getInvertMode,
        getIntervalNumber,
        getIntervalDirection,
        getIntervalRatio,
        getDrumIndex,
        getDrumName,
        getDrumSymbol,
        getFilterTypes,
        getOscillatorTypes,
        getDrumIcon,
        getDrumSynthName,
        getNoiseName,
        getNoiseIcon,
        getNoiseSynthName,
        getVoiceName,
        getVoiceIcon,
        getVoiceSynthName
    } = MusicUtilsLookups;
    var MusicUtilsRhythm =
        (typeof window !== "undefined" && window.MusicUtilsRhythm) ||
        (typeof require !== "undefined" ? require("./musicutils-rhythm") : {});
    var { reducedFraction, calcNoteValueToDisplay, durationToNoteValue, convertFactor } =
        MusicUtilsRhythm;
    var MusicUtilsSolfege =
        (typeof window !== "undefined" && window.MusicUtilsSolfege) ||
        (typeof require !== "undefined" ? require("./musicutils-solfege") : {});
    var { noteIsSolfege, splitSolfege, i18nSolfege, splitScaleDegree, convertFromSolfege } =
        MusicUtilsSolfege;
    var MusicUtilsModeWheel =
        (typeof window !== "undefined" && window.MusicUtilsModeWheel) ||
        (typeof require !== "undefined" ? require("./musicutils-modewheel") : {});
    var {
        getSavedCustomModes,
        getModeNamesForGroup,
        getModeLabel,
        getModeNameFromLabel,
        getModeSliceColors,
        updateModeWheelItems,
        getModeGroupTitleFont,
        getModeSliceFont,
        configureWheel
    } = MusicUtilsModeWheel;
    var MusicUtilsModeCore =
        (typeof window !== "undefined" && window.MusicUtilsModeCore) ||
        (typeof require !== "undefined" ? require("./musicutils-modecore") : {});
    var {
        MUSICALMODES,
        customMode,
        getModeNumbers,
        getNonEDOModeSteps,
        getArticulation,
        modeMapper,
        getCustomNote,
        GetNotesForInterval,
        base64Encode,
        MOVABLE_TONIC_DEGREE,
        scalePatternToEDO,
        PITCH_COLLECTIONS_EDO_OVERRIDES,
        getModePattern
    } = MusicUtilsModeCore;
    var UtilsLogic =
        (typeof window !== "undefined" && window.UtilsLogic) ||
        (typeof require !== "undefined" ? require("./utils-logic") : {});
    var { toFraction, isInt } = UtilsLogic;
    var MusicUtilsPitchScale =
        (typeof window !== "undefined" && window.MusicUtilsPitchScale) ||
        (typeof require !== "undefined" ? require("./musicutils-pitchscale") : {});
    var {
        keySignatureToMode,
        getScaleAndHalfSteps,
        getSharpFlatPreference,
        pitchToNumber,
        getNoteFromInterval,
        numberToPitch,
        getNote
    } = MusicUtilsPitchScale;
}
/*
   Global Locations
    js/utils/utils.js
        _, last
    js/utils/synthutils.js
        VOICENAMES, DRUMNAMES, NOISENAMES
    js/logo.js
        INVALIDPITCH
 */

/*
   exported

   SHARP, FLAT, NATURAL, DOUBLESHARP, DOUBLEFLAT,
   SYNTHSVG, RSYMBOLS, NOTENAMES, ALLNOTENAMES, NOTENAMES1,
   SOLFEGENAMES, SOLFEGENAMES1, SOLFNOTES,
   WESTERN2EISOLFEGENAMES, PITCHES, PITCHES1, PITCHES3, SCALENOTES,
   EASTINDIANSOLFNOTES, DRUMS, GRAPHICS, SOLFATTRS, DEGREES,
   MATRIXSOLFEWIDTH,
   EIGHTHNOTEWIDTH, MATRIXBUTTONHEIGHT, MATRIXBUTTONHEIGHT2,
   MATRIXSOLFEHEIGHT, NOTESYMBOLS, SELECTORSTRINGS, ACCIDENTALLABELS,
   ACCIDENTALNAMES, ACCIDENTALVALUES, INTERVALS, MODE_PIE_MENUS,
   DEFAULTINVERT, DEFAULTINTERVAL, DEFAULTEFFECT,
   DEFAULTMODE, DEFAULTOSCILLATORTYPE, DEFAULTACCIDENTAL,
   getInvertMode, getIntervalNumber, getIntervalDirection,
   getModeNumbers, getDrumIndex, getDrumName, getDrumSymbol,
   getFilterTypes, getOscillatorTypes, getDrumIcon, getDrumSynthName,
   getNoiseName, getNoiseIcon, getNoiseSynthName, getVoiceName,
   getVoiceIcon, getVoiceSynthName, getTemperamentKeys,
   getTemperamentName, getStepSizeUp, getStepSizeDown, getModeLength,
   nthDegreeToPitch, getInterval, _parse_pitch_string, calcNoteValueToDisplay,
   durationToNoteValue, noteToFrequency, computeTargetPitchFrequency, getSolfege, splitScaleDegree,
   getNumNote, calcOctave, calcOctaveInterval, isInt,
   convertFromSolfege, getPitchInfo, i18nSolfege,
   convertFactor, getReverseDrumMidi, getOctaveRatio, setOctaveRatio, getTemperamentsList,
   addTemperamentToList, getTemperament, deleteTemperamentFromList,
   addTemperamentToDictionary, buildScale, CHORDNAMES, CHORDVALUES,
   DEFAULTCHORD, DEFAULTVOICE, setCustomChord, EQUIVALENTACCIDENTALS,
   INTERVALVALUES, MUSICALMODES, getIntervalRatio, frequencyToPitch, NOTESTEP,
   GetNotesForInterval,ALLNOTESTEP,NOTENAMES,SEMITONETOINTERVALMAP,
   SEMITONES, CHROMATIC_SOLFEGE, INTERVAL_CENTS,
    INTERVAL_ORDER, generateNoteNames, getEdoNoteNamePosition,
    scalePatternToEDO, PITCH_COLLECTIONS_EDO_OVERRIDES, getModePattern,
    getNonEDOModeSteps,
    MODEPIEMENU_SLOT_COUNT, MODEPIEMENU_GROUP_RING, MODEPIEMENU_NAME_RING,
    MODEPIEMENU_NAME_TITLE_RADIUS, MODEPIEMENU_FONT_FAMILY,
    MODEPIEMENU_GROUP_FONT_RATIO, MODEPIEMENU_NAME_FONT_MIN_RATIO,
    MODEPIEMENU_NAME_FONT_MAX_RATIO, getSavedCustomModes, getModeNamesForGroup,
    getModeLabel, getModeNameFromLabel, getModeSliceColors,
    updateModeWheelItems, getModeGroupTitleFont, getModeSliceFont,
    isNonEDO, getNonEDOModeSteps, getNonEDOFrequency,
    configureWheel
*/

// Is there a "proper" double-sharp symbol as well? I see this from wikipedia: U+1D12A 𝄪 MUSICAL SYMBOL DOUBLE SHARP (HTML &#119082;) (https://en.wikipedia.org/wiki/Double_sharp)

/**
 * semitone/intervalnumber --> lettergap/notenamesgap -->intervalnames
 * @constant {Object.<number, Object.<number,string>}
 */

//The "original solfege" https://en.wikipedia.org/wiki/Solf%C3%A8ge#Origin
// const ARETINIANSOLFNOTES = ['si', 'la', 'sol', 'fa', 'mi', 're', 'ut'];
// https://en.wikipedia.org/wiki/Iroha
// const IROHASOLFNOTES = ['ro', 'i', 'to', 'he', 'ho', 'ni', 'ha'];
// const IROHASOLFNOTESJA = ['ロ','イ','ト','へ','ホ','二','ハ'];

/**
 * Map from note duration to corresponding note symbols.
 * @constant {Object.<number, string>}
 */

/**
 * Compute the frequency and pitch info for a note degree under a non-EDO
 * temperament (ratio-based: just intonation, meantone, etc.). Returns null
 * when the temperament is equally tempered or has no note labels.
 * @function
 * @param {number} note - degree index (0 = root, n = octave)
 * @param {number} baseOctave - starting octave
 * @param {string} temperamentKey - key in TEMPERAMENT
 * @param {string} keySignature - key signature for pitch spelling
 * @returns {{ freq: number, noteName: string, octave: number } | null}
 */
const getNonEDOFrequency = (note, baseOctave, temperamentKey, keySignature) => {
    const t = TEMPERAMENT[temperamentKey];
    const labels =
        t && Array.isArray(t.noteLabels) && !isEquallyTempered(temperamentKey)
            ? t.noteLabels
            : null;
    if (!labels || !labels[note % labels.length]) {
        return null;
    }
    const idx = note % labels.length;
    const octave = baseOctave + Math.floor(note / labels.length);
    const freq = pitchToFrequency(labels[idx], octave, 0, keySignature, temperamentKey);
    return { freq, noteName: labels[idx], octave };
};

/**
 * Get notes based on the provided tuning object.
 * @param {Object} tur - The tuning object containing singer information.
 * @returns {Object} - An object containing the firstNote, secondNote, and octave.
 */

/**
 * Build the scale based on the given key signature.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     current temperament's EDO is used (legacy behavior).
 * @returns {Array} An array containing the scale and the corresponding intervals.
 */
const buildScale = (keySignature, edo) => {
    // FIX ME: temporary hard-coded fix to avoid errors in pitch preview
    if (keySignature === "C♭ major") {
        const scale = [
            "C" + FLAT,
            "D" + FLAT,
            "E" + FLAT,
            "F" + FLAT,
            "G" + FLAT,
            "A" + FLAT,
            "B" + FLAT,
            "C" + FLAT
        ];
        return [scale, [2, 2, 1, 2, 2, 2, 1]];
    } else if (keySignature === "F♭ major") {
        const scale = [
            "F" + FLAT,
            "G" + FLAT,
            "A" + FLAT,
            "B" + DOUBLEFLAT,
            "C" + FLAT,
            "D" + FLAT,
            "E" + FLAT,
            "F" + FLAT
        ];
        return [scale, [2, 2, 1, 2, 2, 2, 1]];
    }

    let obj = keySignatureToMode(keySignature);
    let myKeySignature = obj[0];
    if (myKeySignature === "C" + FLAT) {
        obj = keySignatureToMode("B " + obj[1]);
        myKeySignature = obj[0];
    }

    // Determine active EDO: an explicit parameter wins; otherwise fall back to
    // the global temperament state so existing callers keep working unchanged.
    // Guard on falsy (not just undefined) so null/0/NaN never leak into the
    // non-12 EDO branch and produce a degenerate step pattern.
    let currentEDO = edo;
    if (!currentEDO) {
        currentEDO = 12;
        if (typeof globalActivity !== "undefined" && globalActivity?.logo?.synth?.inTemperament) {
            currentEDO = getCurrentEDO(globalActivity.logo.synth.inTemperament);
        }
    }

    // For non-12 EDO: convert 12-EDO semitone intervals to EDO step counts
    // using cumulative positions to preserve the total interval sum.
    if (currentEDO !== 12) {
        const edoNames = generateNoteNames(currentEDO);
        let idx = edoNames.indexOf(myKeySignature);
        if (idx === -1) {
            idx = 0;
        }

        // For "custom" (chromatic) mode in non-12 EDO, getModePattern returns a
        // full EDO-length scale with step=1 for every pitch class, instead of
        // converting the hardcoded 12-element customMode array (which would only
        // produce ~12 notes and leave many pitch classes unreachable).
        const edoHalfSteps = getModePattern(obj[1], currentEDO);

        const scale = [myKeySignature];
        let ii = idx;
        for (let i = 0; i < edoHalfSteps.length; i++) {
            ii = (ii + edoHalfSteps[i] + edoNames.length) % edoNames.length;
            scale.push(edoNames[ii]);
        }
        return [scale, edoHalfSteps];
    }

    const halfSteps = getModePattern(obj[1], currentEDO);

    // SHARPPREFERENCE and FLATPREFERENCE are keyed only on "<key> major" and
    // "<key> minor", but keySignatureToMode() returns the raw mode name --
    // "natural minor", "aeolian", "lydian", "dorian" and so on. Map the mode
    // onto its major/minor equivalent first, exactly as getSharpFlatPreference()
    // does, otherwise the lookup misses for every mode the pie menu offers and
    // the scale falls through to the wrong spelling.
    const preferenceMode = modeMapper(obj[0], obj[1]);
    const preferenceKey = preferenceMode[0] + " " + preferenceMode[1];

    let thisScale;
    if (NOTESFLAT.includes(myKeySignature)) {
        if (SHARPPREFERENCE.includes(preferenceKey)) {
            thisScale = NOTESSHARP;
        } else {
            thisScale = NOTESFLAT;
        }
    } else {
        if (FLATPREFERENCE.includes(preferenceKey)) {
            thisScale = NOTESFLAT;
        } else {
            thisScale = NOTESSHARP;
        }
    }

    let idx = thisScale.indexOf(myKeySignature);
    if (idx === -1) {
        idx = 0;
    }

    const scale = [myKeySignature];
    let ii = idx;
    for (let i = 0; i < halfSteps.length; i++) {
        ii += halfSteps[i];
        scale.push(thisScale[ii % thisScale.length]);
    }

    // Make sure there are no repeated letter names for seven step scales
    if (scale.length < 9) {
        for (let i = 0; i < scale.length - 1; i++) {
            if (i === 0) {
                if (scale[i][0] === scale[i + 1][0]) {
                    if (scale[i + 1] in CONVERT_UP) {
                        scale[i + 1] = CONVERT_UP[scale[i + 1]];
                    }
                }
            } else {
                // Do we go up or down?
                if (thisScale === NOTESSHARP) {
                    if (scale[i][0] === scale[i + 1][0]) {
                        // We need to go down.
                        if (scale[i] in CONVERT_DOWN) {
                            scale[i] = CONVERT_DOWN[scale[i]];
                        }
                    }
                } else {
                    if (scale[i - 1][0] === scale[i][0]) {
                        // We need to go up.
                        if (scale[i] in CONVERT_UP) {
                            scale[i] = CONVERT_UP[scale[i]];
                        }
                    }
                }
            }
        }
        // Final check -- we may need to use double sharps or double flats.
        if (myKeySignature.length === 2 && myKeySignature[1] === SHARP) {
            for (let i = scale.length - 1; i > 0; i--) {
                if (scale[i][0] === scale[i - 1][0]) {
                    if (scale[i - 1] in CONVERT_DOWN) {
                        scale[i - 1] = CONVERT_DOWN[scale[i - 1]];
                    } else if (scale[i - 1] in CONVERT_DOUBLE_DOWN) {
                        scale[i - 1] = CONVERT_DOUBLE_DOWN[scale[i - 1]];
                    }
                }
            }
        } else if (myKeySignature.length === 2 && myKeySignature[1] === FLAT) {
            for (let i = 0; i < scale.length - 2; i++) {
                if (scale[i][0] === scale[i + 1][0]) {
                    if (scale[i + 1] in CONVERT_UP) {
                        scale[i + 1] = CONVERT_UP[scale[i + 1]];
                    } else if (scale[i + 1] in CONVERT_DOUBLE_UP) {
                        scale[i + 1] = CONVERT_DOUBLE_UP[scale[i + 1]];
                    }
                }
            }
        }
    }
    return [scale, halfSteps];
};

/**
 * Get the step size (number of half-steps) to the next note in the given key signature.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @param {string} direction - The direction of the step ("up" or "down").
 * @param {number} transposition - The transposition value.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     temperament's own EDO is used (legacy behavior).
 * @returns {number} The step size in half-steps.
 * @example
 * // 12-EDO: C major scale steps
 * _getStepSize("C major", "C", "up", 0, "equal")     // 2 (C→D)
 * _getStepSize("C major", "E", "up", 0, "equal")     // 1 (E→F)
 * // 19-EDO: C major scale steps (wider intervals)
 * _getStepSize("C major", "C", "up", 0, "equal", 19) // 3 (C→D)
 * _getStepSize("C major", "E", "up", 0, "equal", 19) // 2 (E→F)
 * // 31-EDO: C major scale steps
 * _getStepSize("C major", "C", "up", 0, "equal", 31) // 5 (C→D)
 * _getStepSize("C major", "E", "up", 0, "equal", 31) // 3 (E→F)
 */
const _getStepSize = (keySignature, pitch, direction, transposition, temperament, edo) => {
    // Returns how many half-steps to the next note in this key.
    if (temperament === undefined) {
        temperament = "equal";
    }
    let currentEDO = edo;
    if (!currentEDO) {
        currentEDO = getCurrentEDO(temperament);
    }

    let thisPitch = pitch;
    // Thread the EDO into the scale builder so the scale/step data always
    // matches the temperament being measured instead of the global
    // temperament state (12-EDO stays byte-for-byte identical).
    const obj = buildScale(keySignature, currentEDO);
    const scale = obj[0];
    const halfSteps = obj[1];

    if (thisPitch in BTOFLAT) {
        thisPitch = BTOFLAT[thisPitch];
    } else if (thisPitch in STOSHARP) {
        thisPitch = STOSHARP[thisPitch];
    }

    /**
     * Check if two pitches are logically equivalent.
     * @function
     * @param {string} s1 - The first pitch.
     * @param {string} s2 - The second pitch.
     * @returns {boolean} True if the pitches are logically equivalent, otherwise false.
     */
    const logicalEquals = (s1, s2) => {
        if (s1 === s2) {
            return true;
        } else if (s1 === "E" + SHARP && s2 === "F") {
            return true;
        } else if (s1 === "E" && s2 === "F" + FLAT) {
            return true;
        } else if (s1 === "F" && s2 === "E♯") {
            return true;
        } else if (s1 === "F" + FLAT && s2 === "E") {
            return true;
        } else if (s1 === "B" + SHARP && s2 === "C") {
            return true;
        } else if (s1 === "B" && s2 === "C" + FLAT) {
            return true;
        } else if (s1 === "C" && s2 === "B♯") {
            return true;
        } else if (s1 === "C" + FLAT && s2 === "B") {
            return true;
        } else if (s1 === "B" + DOUBLEFLAT && s2 === "A") {
            return true;
        } else if (s1 === "F" + DOUBLESHARP && s2 === "G") {
            return true;
        }
        return false;
    };

    let ii = scale.findIndex(scale => logicalEquals(scale, pitch));
    if (ii !== -1) {
        if (direction === "up") {
            return halfSteps[ii];
        } else {
            if (ii > 0) {
                return -halfSteps[ii - 1];
            } else {
                return -last(halfSteps);
            }
        }
    }

    if (currentEDO === 12 && ii === -1) {
        if (thisPitch in EQUIVALENTFLATS) {
            ii = scale.indexOf(EQUIVALENTFLATS[thisPitch]);
        }
    }

    if (currentEDO === 12 && ii === -1) {
        if (thisPitch in EQUIVALENTSHARPS) {
            ii = scale.indexOf(EQUIVALENTSHARPS[thisPitch]);
        }
    }

    if (currentEDO === 12 && ii === -1) {
        if (thisPitch in EQUIVALENTNATURALS) {
            ii = scale.indexOf(EQUIVALENTNATURALS[thisPitch]);
        }
    }

    if (ii !== -1) {
        if (direction === "up") {
            return halfSteps[ii];
        } else {
            if (ii > 0) {
                return -halfSteps[ii - 1];
            } else {
                return -last(halfSteps);
            }
        }
    }

    // Pitch is not in the consonant scale of this key, so we need to
    // shift up or down to the next note in the key.
    let offset = 0;
    if (currentEDO === 12) {
        let startIndex = PITCHES.indexOf(thisPitch);
        if (startIndex !== -1) {
            // Convert starting 12-EDO index to approximate EDO step position
            let edoStep = Math.round((startIndex * currentEDO) / PITCHES.length);
            let guard = 0;
            while (!scale.some(s => logicalEquals(s, thisPitch))) {
                if (guard++ > currentEDO + 12) {
                    break;
                }
                if (direction === "up") {
                    edoStep += 1;
                    offset += 1;
                } else {
                    edoStep -= 1;
                    offset -= 1;
                }
                const posInOctave = ((edoStep % currentEDO) + currentEDO) % currentEDO;
                const nameIndex =
                    Math.round((posInOctave * PITCHES.length) / currentEDO) % PITCHES.length;
                thisPitch = PITCHES[nameIndex];
            }

            return offset;
        }

        startIndex = PITCHES2.indexOf(thisPitch);
        if (startIndex !== -1) {
            let edoStep = Math.round((startIndex * currentEDO) / PITCHES2.length);
            let guard = 0;
            while (!scale.some(s => logicalEquals(s, thisPitch))) {
                if (guard++ > currentEDO + 12) {
                    break;
                }
                if (direction === "up") {
                    edoStep += 1;
                    offset += 1;
                } else {
                    edoStep -= 1;
                    offset -= 1;
                }
                const posInOctave = ((edoStep % currentEDO) + currentEDO) % currentEDO;
                const nameIndex =
                    Math.round((posInOctave * PITCHES2.length) / currentEDO) % PITCHES2.length;
                thisPitch = PITCHES2[nameIndex];
            }

            return offset;
        }
    } else {
        // EDO-native fallback: walk the EDO's own note positions instead of
        // the hardcoded 12-EDO PITCHES/PITCHES2 tables.
        const edoNames = generateNoteNames(currentEDO);
        let edoIndex = getEdoNoteNamePosition(thisPitch, currentEDO);
        if (edoIndex !== -1) {
            let guard = 0;
            while (!scale.some(s => logicalEquals(s, thisPitch))) {
                if (guard++ > currentEDO + 12) {
                    break;
                }
                if (direction === "up") {
                    edoIndex += 1;
                    offset += 1;
                } else {
                    edoIndex -= 1;
                    offset -= 1;
                }
                const posInOctave = ((edoIndex % currentEDO) + currentEDO) % currentEDO;
                thisPitch = edoNames[posInOctave];
            }

            return offset;
        }
    }

    // Should never get here, but just in case.

    console.debug(thisPitch + " not found");
    return 0;
};

/**
 * Get the step size (number of half-steps) to the next note in the upward direction.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @param {number} transposition - The transposition value.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     temperament's own EDO is used (legacy behavior).
 * @returns {number} The step size in half-steps.
 */
const getStepSizeUp = (keySignature, pitch, transposition, temperament, edo) => {
    return _getStepSize(keySignature, pitch, "up", transposition, temperament, edo);
};

/**
 * Get the step size (number of half-steps) to the next note in the downward direction.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @param {number} transposition - The transposition value.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     temperament's own EDO is used (legacy behavior).
 * @returns {number} The step size in half-steps.
 */
const getStepSizeDown = (keySignature, pitch, transposition, temperament, edo) => {
    return _getStepSize(keySignature, pitch, "down", transposition, temperament, edo);
};

/**
 * Get the length of the mode (number of notes) for the given key signature.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     global temperament state is used (legacy behavior).
 * @returns {number} The length of the mode.
 * @example
 * getModeLength("C major")          // 7 (always 7 for major)
 * getModeLength("C major", 19)      // 7 (same mode, different EDO)
 * getModeLength("C major", 31)      // 7
 * getModeLength("C chromatic")      // 12 (chromatic scale)
 * getModeLength("C chromatic", 19)  // 19 (19-note chromatic)
 */
const getModeLength = (keySignature, edo) => {
    return buildScale(keySignature, edo)[1].length;
};

/**
 * Map scale degree to pitch or vice versa for a chosen mode.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {number} scaleDegree - The scale degree.
 * @param {boolean} movable - Indicates if movable do is present.
 * @param {string} pitch - The pitch (note name).
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     global temperament state is used (legacy behavior).
 * @returns {string|Array} The pitch corresponding to the scale degree or vice versa.
 * @example
 * // 12-EDO: degree → pitch
 * scaleDegreeToPitchMapping("C major", 3, true, null)     // "E"
 * // 19-EDO: degree → pitch (same note names, different frequencies)
 * scaleDegreeToPitchMapping("C major", 3, true, null, 19) // "E"
 * // 31-EDO: degree → pitch
 * scaleDegreeToPitchMapping("C major", 5, true, null, 31) // "G"
 */
const scaleDegreeToPitchMapping = (keySignature, scaleDegree, movable, pitch, edo) => {
    if (pitch === null) {
        scaleDegree -= 1;
    }
    // Subtract one to make it zero-based as we're working with arrays

    // Info variables according to chosen mode
    const chosenMode = keySignatureToMode(keySignature);
    const obj1 = buildScale(keySignature, edo);
    const chosenModeScale = obj1[0];
    const chosenModePattern = obj1[1];

    // Pitch numbers of the chosen mode
    const semitones = [0];

    // Scale degrees defined for chosen mode;
    // Rest would require arbitration
    const definedScaleDegree = [];

    // Final 7 note scale combining chosen mode and arbitration
    let finalScale = [];
    const sd = [];

    // if movable do is present just return the major/perfect tones
    if (movable) {
        finalScale = buildScale(chosenMode[0] + " major", edo)[0];

        if (pitch === null) {
            return finalScale[scaleDegree];
        }
        if (scaleDegree === null) {
            for (const i in finalScale) {
                if (finalScale[i][0] === pitch[0]) {
                    sd.push(String(Number(i) + 1));
                    if (finalScale[i] === pitch) {
                        sd.push(NATURAL);
                    } else {
                        if (finalScale[i].includes(SHARP)) {
                            sd.push(FLAT);
                        } else if (finalScale[i].includes(FLAT)) {
                            sd.push(FLAT);
                        } else if (pitch.includes(SHARP)) {
                            sd.push(SHARP);
                        } else if (pitch.includes(FLAT)) {
                            sd.push(FLAT);
                        }
                    }
                }
            }
            return sd;
        }
    } else {
        // For 7 note systems scale degrees have a one-one relation
        if (chosenModePattern.length === 7) {
            if (pitch === null) {
                return chosenModeScale[scaleDegree];
            }
            if (scaleDegree === null) {
                for (const i in chosenModeScale) {
                    if (chosenModeScale[i][0] === pitch[0]) {
                        sd.push(String(Number(i) + 1));
                        if (chosenModeScale[i] === pitch) {
                            sd.push(NATURAL);
                        } else {
                            if (chosenModeScale[i].includes(SHARP)) {
                                sd.push(FLAT);
                            } else if (chosenModeScale[i].includes(FLAT)) {
                                sd.push(FLAT);
                            } else if (pitch.includes(SHARP)) {
                                sd.push(SHARP);
                            } else if (pitch.includes(FLAT)) {
                                sd.push(FLAT);
                            }
                        }
                    }
                }
                return sd;
            }
        } else if (chosenModePattern.length < 7) {
            // Major scale of the choosen key is used as fallback
            const majorScale = buildScale(chosenMode[0] + " major", edo)[0];

            // according to the choosenModePattern, calculate defined scale degrees
            for (let i = 0; i < chosenModePattern.length; i++) {
                switch (semitones[i]) {
                    case 0:
                        definedScaleDegree.push(1);
                        break;
                    case 1:
                    case 2:
                        definedScaleDegree.push(2);
                        break;
                    case 3:
                    case 4:
                        definedScaleDegree.push(3);
                        break;
                    case 5:
                        definedScaleDegree.push(4);
                        break;
                    case 6:
                        if (definedScaleDegree[definedScaleDegree.length - 1] !== 4) {
                            definedScaleDegree.push(4);
                        } else if (semitones[i] + chosenModePattern[i] !== 7) {
                            definedScaleDegree.push(5);
                        } else {
                            // Keep indices aligned with chosenModeScale
                            definedScaleDegree.push(null);
                        }
                        break;
                    case 7:
                        definedScaleDegree.push(5);
                        break;
                    case 8:
                    case 9:
                        definedScaleDegree.push(6);
                        break;
                    case 10:
                    case 11:
                        definedScaleDegree.push(7);
                        break;
                    default:
                        continue;
                }

                semitones.push(semitones[i] + chosenModePattern[i]);
            }

            // For scale degrees which are defined --> Use choosen Mode's notes
            // For scale degrees which are undefined --> Use fallback notes
            for (let i = 0; i < 7; i++) {
                const k = definedScaleDegree.indexOf(i + 1);
                if (k !== -1) {
                    finalScale.push(chosenModeScale[k]);
                } else {
                    finalScale.push(majorScale[i]);
                }
            }

            if (pitch === null) {
                return finalScale[scaleDegree];
            }
            if (scaleDegree === null) {
                for (const i in finalScale) {
                    if (finalScale[i][0] === pitch[0]) {
                        sd.push(String(Number(i) + 1));
                        if (finalScale[i] === pitch) {
                            sd.push(NATURAL);
                        } else {
                            if (finalScale[i].includes(SHARP)) {
                                sd.push(FLAT);
                            } else if (finalScale[i].includes(FLAT)) {
                                sd.push(FLAT);
                            } else if (pitch.includes(SHARP)) {
                                sd.push(SHARP);
                            } else if (pitch.includes(FLAT)) {
                                sd.push(FLAT);
                            }
                        }
                    }
                }
                return sd;
            }
        } else {
            // For scales with greater than 7 notes
            // All scales degrees are defined, just prefer the perfect/major ones

            for (let i = 0; i < chosenModePattern.length; i++) {
                semitones.push(semitones[i] + chosenModePattern[i]);
            }

            for (let i = 0; i < semitones.length; i++) {
                switch (semitones[i]) {
                    case 0:
                        finalScale.push(chosenModeScale[i]);
                        break;
                    case 1:
                        if (semitones[i + 1] === 2) {
                            finalScale.push(chosenModeScale[i + 1]);
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 2:
                        if (semitones[i - 1] === 1) {
                            continue;
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 3:
                        if (semitones[i + 1] === 4) {
                            finalScale.push(chosenModeScale[i + 1]);
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 4:
                        if (semitones[i - 1] === 3) {
                            continue;
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 5:
                        finalScale.push(chosenModeScale[i]);
                        break;
                    case 6:
                        if (
                            (semitones[i - 1] === 5 && semitones[i + 1] !== 7) ||
                            (semitones[i - 1] !== 5 && semitones[i + 1] === 7)
                        ) {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 7:
                        finalScale.push(chosenModeScale[i]);
                        break;
                    case 8:
                        if (semitones[i + 1] === 9) {
                            finalScale.push(chosenModeScale[i + 1]);
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 9:
                        if (semitones[i - 1] === 8) {
                            continue;
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 10:
                        if (semitones[i + 1] === 11) {
                            finalScale.push(chosenModeScale[i + 1]);
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    case 11:
                        if (semitones[i - 1] === 10) {
                            continue;
                        } else {
                            finalScale.push(chosenModeScale[i]);
                        }
                        break;
                    default:
                        // console.debug("No case for " + semitones[i]);
                        break;
                }
            }

            if (pitch === null) {
                return finalScale[scaleDegree];
            }
            if (scaleDegree === null) {
                for (const i in finalScale) {
                    if (finalScale[i][0] === pitch[0]) {
                        sd.push(String(Number(i) + 1));
                        if (finalScale[i] === pitch) {
                            sd.push(NATURAL);
                        } else {
                            if (finalScale[i].includes(SHARP)) {
                                sd.push(FLAT);
                            } else if (finalScale[i].includes(FLAT)) {
                                sd.push(FLAT);
                            } else if (pitch.includes(SHARP)) {
                                sd.push(SHARP);
                            } else if (pitch.includes(FLAT)) {
                                sd.push(FLAT);
                            }
                        }
                    }
                }
                return sd;
            }
        }
    }
};

/**
 * Get the note corresponding to the nth scale degree in the given key signature.
 * Used for movable solfege.
 * @function
 * @param {string} keySignature - The key signature.
 * @param {number} scaleDegree - The scale degree.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     global temperament state is used (legacy behavior).
 * @returns {string} The note corresponding to the scale degree in the current key signature.
 * @example
 * // 12-EDO: C major scale degrees
 * nthDegreeToPitch("C major", 1)     // ["C", 0]
 * nthDegreeToPitch("C major", 4)     // ["F", 0]
 * // 19-EDO: same scale degrees, 19-EDO frequencies
 * nthDegreeToPitch("C major", 1, 19) // ["C", 0]
 * nthDegreeToPitch("C major", 4, 19) // ["F", 0]
 * // 31-EDO
 * nthDegreeToPitch("C major", 5, 31) // ["G", 0]
 */
const nthDegreeToPitch = (keySignature, scaleDegree, edo) => {
    // Returns note corresponding to scale degree in current key
    // signature. Used for movable solfege.
    const scale = buildScale(keySignature, edo)[0];
    const modeLength = scale.length - 1;

    // Scale degree is specified as do === 1, re === 2, etc., so we need
    // to subtract 1 to make it zero-based.
    scaleDegree = Math.floor(Number(scaleDegree));
    const degree = scaleDegree - 1;

    const octaveOffset = Math.floor(degree / modeLength);
    const index = ((degree % modeLength) + modeLength) % modeLength;

    return [scale[index], octaveOffset];
};

/**
 * Get the relative interval (steps within the current key and mode) based on the
 * position (pitch) in the scale.
 * @function
 * @param {number} interval - The interval value.
 * @param {string} keySignature - The key signature.
 * @param {string} pitch - The pitch (note name).
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     global temperament state is used (legacy behavior).
 * @returns {number} The relative interval value.
 * @example
 * // 12-EDO: interval from E in C major = 4 semitones (E→G#)
 * getInterval(2, "C major", "E")     // 3 (E→F, 1 scale step)
 * // 19-EDO: same scale step, different EDO spacing
 * getInterval(2, "C major", "E", 19) // 2 (E→F in 19-EDO)
 * // 31-EDO
 * getInterval(2, "C major", "E", 31) // 3 (E→F in 31-EDO)
 */
const getInterval = (interval, keySignature, pitch, edo) => {
    // Step size interval based on the position (pitch) in the scale
    const obj = buildScale(keySignature, edo);
    const scale = obj[0];
    const halfSteps = obj[1];
    // Offet is used in the case that the pitch is not in the current scale.
    // let offset = 0;

    if (SOLFEGENAMES.includes(pitch)) {
        pitch = FIXEDSOLFEGE[pitch];
    }

    let ii;
    if (pitch in BTOFLAT) {
        pitch = BTOFLAT[pitch];
        ii = scale.indexOf(pitch);
    } else if (pitch in STOSHARP) {
        pitch = STOSHARP[pitch];
        ii = scale.indexOf(pitch);
    } else if (scale.includes(pitch)) {
        ii = scale.indexOf(pitch);
    } else {
        ii = scale.indexOf(pitch);
        if (ii === -1) {
            if (pitch in EQUIVALENTFLATS) {
                ii = scale.indexOf(EQUIVALENTFLATS[pitch]);
            }
        }

        if (ii === -1) {
            if (pitch in EQUIVALENTSHARPS) {
                ii = scale.indexOf(EQUIVALENTSHARPS[pitch]);
            }
        }

        if (ii === -1) {
            if (pitch in EQUIVALENTNATURALS) {
                ii = scale.indexOf(EQUIVALENTNATURALS[pitch]);
            }
        }

        let counter = 0;
        if (ii === -1) {
            // Pitch is not in the consonant scale of this key, so we need to
            // shift up or down for a close match, step up or down, and then
            // compensate for the shift.
            if (PITCHES.includes(pitch)) {
                while (!scale.includes(pitch)) {
                    counter += 1;
                    if (counter > 24) {
                        break;
                    }
                    let i = PITCHES.indexOf(pitch);
                    if (interval > 0) {
                        i += 1;
                        pitch = PITCHES[i % PITCHES.length];
                        // offset -= 1;
                    } else {
                        i -= 1;
                        if (i < 0) {
                            i += PITCHES.length;
                        }
                        pitch = PITCHES[i];
                        // offset += 1;
                    }
                }

                ii = scale.indexOf(pitch);
            } else {
                if (PITCHES2.includes(pitch)) {
                    while (!scale.includes(pitch)) {
                        counter += 1;
                        if (counter > 24) {
                            break;
                        }
                        let i = PITCHES2.indexOf(pitch);
                        if (interval > 0) {
                            i += 1;
                            pitch = PITCHES2[i % PITCHES2.length];
                            // offset -= 1;
                        } else {
                            i -= 1;
                            if (i < 0) {
                                i += PITCHES2.length;
                            }
                            pitch = PITCHES2[i];
                            // offset += 1;
                        }
                    }

                    ii = scale.indexOf(pitch);
                } else {
                    // Should never happen.

                    console.debug(pitch + " not found");
                    return 0;
                }
            }
        }
    }

    // What do we do with the offset? Is it ignored? Or does it count
    // as one step in the interval?

    let j = 0;
    if (interval === 0) {
        return 0;
    } else if (interval > 0) {
        for (let k = 0; k < interval; k++) {
            j += halfSteps[(ii + k) % halfSteps.length];
        }
        return j;
    } else {
        for (let k = 0; k > interval; k--) {
            let z = (ii + k - 1) % halfSteps.length;
            while (z < 0) {
                z += halfSteps.length;
            }
            j -= halfSteps[z];
        }
        return j;
    }
};

/**
 * Calculate the frequency based on pitch, octave, cents, and key signature.
 * @function
 * @param {string} pitch - The pitch of the note.
 * @param {number} octave - The octave of the note.
 * @param {number} cents - The cents to adjust the frequency.
 * @param {string} keySignature - The key signature.
 * @param {string} [temperament="equal"] - The temperament to use.
 * @returns {number} The calculated frequency.
 */
const pitchToFrequency = (pitch, octave, cents, keySignature, temperament) => {
    const currentEDO = getCurrentEDO(temperament);
    const t = getTemperament(temperament);
    if (t && !t.isEDO && t.noteLabels && t.ratios) {
        const noteIdx = t.noteLabels.indexOf(pitch);
        if (noteIdx !== -1) {
            const aIdx = t.noteLabels.indexOf("A");
            const baseRefFreq = A0 / t.ratios[aIdx];
            let freq = baseRefFreq * t.ratios[noteIdx] * Math.pow(2, octave);
            if (cents !== 0) {
                freq *= Math.pow(2, cents / 1200);
            }
            return freq;
        }
    }

    const pitchNumber = pitchToNumber(pitch, octave, keySignature, temperament);

    // NOTE: stretched-octave powerBase (widget) vs engine getOctaveRatio() diverge here — this function hard-codes base 2; widget ratioToCents generalizes to powerBase. Full unification deferred.
    // Frequency = A0 * 2^(pitchNumber / currentEDO)
    // With cents offset: Frequency = A0 * 2^((pitchNumber * 100 + cents) / (currentEDO * 100))
    // This works because 1 semitone = 100 cents, and 2^(1/1200) is the cents resolution.
    // Example: 19-EDO, A4 (pitchNumber=48), 0 cents → 27.5 * 2^(48/19) ≈ 440 Hz
    // Example: 19-EDO, A4 + 50 cents → 27.5 * 2^((48*100+50)/(19*100)) ≈ 447.8 Hz
    if (cents === 0) {
        return A0 * Math.pow(2, 1 / currentEDO) ** pitchNumber;
    } else {
        return A0 * Math.pow(2, 1 / (currentEDO * 100)) ** (pitchNumber * 100 + cents);
    }
};

/**
 * Convert a note string to frequency based on the key signature.
 * @function
 * @param {string} note - The note string.
 * @param {string} keySignature - The key signature.
 * @returns {number} The calculated frequency.
 */
const noteToFrequency = (note, keySignature, temperament) => {
    const obj = noteToPitchOctave(note);
    return pitchToFrequency(obj[0], obj[1], 0, keySignature, temperament);
};

/**
 * Compute the equal-temperament frequency of a target pitch string used by
 * the sampler tuner.
 *
 * Accepts notes in the form `<letter><accidental?><octave>` where the
 * accidental is one of `#`, `b`, `##`, `bb`, `♯`, `♭`, `𝄪`, `𝄫`, `x`, or `*`,
 * and the octave is a (signed) integer. Examples: `"C4"`, `"Bb4"`,
 * `"C##5"`, `"D𝄫3"`.
 *
 * @function
 * @param {string} noteWithOctave - The target pitch including its octave.
 * @param {string} [temperament="equal"] - The temperament to use.
 * @returns {number} Frequency in Hz, or `NaN` if the input cannot be parsed.
 */
const computeTargetPitchFrequency = (noteWithOctave, temperament) => {
    if (typeof noteWithOctave !== "string" || noteWithOctave.length < 2) {
        return NaN;
    }
    const match = noteWithOctave.match(
        /^((?:[a-g]|do|re|mi|fa|sol|la|ti|si|ut|sa|ga|ma|pa|dha|ni)(?:##|bb|[#b♯♭𝄪𝄫x*♮])?)(-?\d+)$/iu
    );
    if (!match) {
        return NaN;
    }
    const pitch = match[1].replace(/♮/gu, "");
    const octave = parseInt(match[2], 10);
    const freq = pitchToFrequency(pitch, octave, 0, "C major", temperament || "equal");
    return typeof freq === "number" && isFinite(freq) && freq > 0 ? freq : NaN;
};

if (typeof window !== "undefined") {
    window.computeTargetPitchFrequency = computeTargetPitchFrequency;
}

/**
 * Convert a note to its solfege representation.
 * @function
 * @param {string} note - The note to convert.
 * @param {string} keySignature - The key signature.
 * @param {boolean} movable - Indicates if movable do is present.
 * @param {string} temperament - The temperament used for pitch calculation.
 * @param {number} [edo] - Number of steps per octave. When omitted, the
 *     temperament's EDO (and the global temperament state for the scale
 *     builder) is used (legacy behavior).
 * @returns {string} The solfege representation.
 * @example
 * // 12-EDO: C major
 * getSolfege("E", "C major", true, "equal")     // "mi"
 * // 19-EDO: same solfege names, different frequencies
 * getSolfege("E", "C major", true, "equal", 19) // "mi"
 * // 31-EDO
 * getSolfege("G", "C major", true, "equal", 31) // "sol"
 */
const getSolfege = (note, keySignature, movable, temperament, edo) => {
    if (noteIsSolfege(note)) {
        return note;
    }

    if (movable && keySignature) {
        let currentEDO = edo;
        if (!currentEDO) {
            currentEDO = getCurrentEDO(temperament);
        }
        const scaleResult = buildScale(keySignature, currentEDO);
        if (!scaleResult) return SOLFEGECONVERSIONTABLE[note];

        const scale = scaleResult[0];

        // 1) exact match
        let index = scale.indexOf(note);

        // 2) normalized accidental match
        if (index === -1) {
            const altNote = note.replace("#", SHARP).replace("b", FLAT);
            index = scale.indexOf(altNote);
        }

        // Modes with fewer than 7 notes: use the same solfege that
        // getNoteFromSolfege resolves, so display and input agree.
        if (index !== -1 && currentEDO === 12 && scale.length - 1 < 7) {
            const halfSteps = scaleResult[1];
            let offset = 0;
            for (let i = 0; i < index; i++) {
                offset += halfSteps[i];
            }
            return getScaleAndHalfSteps(keySignature)[1][offset];
        }

        const mode = Array.isArray(keySignature)
            ? keySignature[1].toLowerCase()
            : keySignatureToMode(keySignature)[1];
        const tonicDegree = Object.prototype.hasOwnProperty.call(MOVABLE_TONIC_DEGREE, mode)
            ? MOVABLE_TONIC_DEGREE[mode]
            : 0;

        // diatonic note
        if (index !== -1 && index < SOLFEGENAMES.length) {
            return SOLFEGENAMES[(index + tonicDegree) % 7].toLowerCase();
        }

        // 3) chromatic fallback (interval based)
        const tonic = scale[0];
        const tonicPitch = pitchToNumber(tonic, 4, keySignature, temperament);
        const notePitch = pitchToNumber(note, 4, keySignature, temperament);

        // semitones from tonic (EDO-aware)
        let semitones = (((notePitch - tonicPitch) % currentEDO) + currentEDO) % currentEDO;

        if (tonicDegree > 0) {
            // Shift so the tonic lands on its syllable (e.g. la for minor);
            // the relative major is (12 - tonicSemitones) up in 12-EDO terms.
            const tonicSemitones = [0, 2, 4, 5, 7, 9, 11][tonicDegree];
            const relativeMajorSteps = Math.round(((12 - tonicSemitones) * currentEDO) / 12);
            semitones = (semitones + currentEDO - relativeMajorSteps) % currentEDO;
        }

        // Map EDO semitones to nearest 12-tone CHROMATIC_SOLFEGE index
        const chromaticSize = CHROMATIC_SOLFEGE.length;
        const solfegeIndex = Math.round((semitones * chromaticSize) / currentEDO) % chromaticSize;
        return CHROMATIC_SOLFEGE[solfegeIndex].toLowerCase();
    }

    return SOLFEGECONVERSIONTABLE[note];
};

/**
 * Get pitch information based on the note or pitch provided.
 * @function
 * @param {string|number|Object} activity - Activity object or note/pitch (1-arg case).
 * @param {string} [type] - The type of pitch info to return (4-arg case).
 * @param {string|number} [currentNote] - The current note (4-arg case).
 * @param {Object} [tur] - The turtle object (4-arg case).
 * @returns {Object|string} If called with one argument, returns { name, octave, pitchNumber }. Otherwise returns legacy values.
 */
const getPitchInfo = function (activity, type, currentNote, tur) {
    // Determine temperament
    let temperament = "equal";
    if (arguments.length === 1) {
        // 1-arg case: try to get from global activity
        if (typeof globalActivity !== "undefined" && globalActivity?.logo?.synth?.inTemperament) {
            temperament = globalActivity.logo.synth.inTemperament;
        }
    } else if (arguments.length === 4 && activity?.logo?.synth?.inTemperament) {
        // 4-arg case: get from activity
        temperament = activity.logo.synth.inTemperament;
    }

    if (arguments.length === 1) {
        const noteOrPitch = activity;
        let name, octave, pitchNumber;

        if (typeof noteOrPitch === "number") {
            const currentEDO = getCurrentEDO(temperament);
            pitchNumber = noteOrPitch;
            octave = Math.floor(pitchNumber / currentEDO) - 1;
            const edoNames = generateNoteNames(currentEDO);
            name = edoNames[pitchNumber % currentEDO];
        } else if (typeof noteOrPitch === "string") {
            [name, octave] = _parse_pitch_string(noteOrPitch);
            pitchNumber = _calculate_pitch_number(name, octave, 0, temperament);
        } else {
            return INVALIDPITCH;
        }

        if (pitchNumber === INVALIDPITCH) {
            return { name: null, octave: null, pitchNumber: INVALIDPITCH };
        }

        return {
            name: name.replaceAll(SHARP, "#").replaceAll(FLAT, "b"),
            octave: parseInt(octave, 10),
            pitchNumber: pitchNumber
        };
    }

    // Legacy behavior for 4 arguments
    let pitch;
    let octave;
    let obj;
    let cents;
    if (Number(currentNote)) {
        // If it is a frequency, convert it to a pitch/octave.
        obj = frequencyToPitch(currentNote);
        pitch = obj[0];
        octave = obj[1];
        cents = obj[2];
    } else {
        // Turn the note into pitch and octave.
        [pitch, octave] = _parse_pitch_string(currentNote);
    }
    // Remap double sharps/double flats.
    if (pitch.includes(DOUBLESHARP)) {
        pitch = pitch.replace(DOUBLESHARP, "");
        if (pitch === "B") {
            pitch = "C" + SHARP;
        } else {
            pitch = NOTESSHARP[NOTESSHARP.indexOf(pitch) + 2];
        }
    } else if (pitch.includes(DOUBLEFLAT)) {
        pitch = pitch.replace(DOUBLEFLAT, "");
        if (pitch === "C") {
            pitch = "B" + FLAT;
        } else {
            pitch = NOTESFLAT[NOTESFLAT.indexOf(pitch) - 2];
        }
    }
    // Map the pitch to the current scale.
    pitch = pitch.replaceAll("#", SHARP).replaceAll("b", FLAT);
    if (
        getCurrentEDO(temperament) === 12 &&
        !buildScale(tur.singer.keySignature)[0].includes(pitch)
    ) {
        if (pitch in EQUIVALENTFLATS) {
            pitch = EQUIVALENTFLATS[pitch];
        } else if (pitch in EQUIVALENTSHARPS) {
            pitch = EQUIVALENTSHARPS[pitch];
        }
    }

    try {
        switch (type) {
            case "alphabet":
                return pitch;
            case "alphabet class":
            case "letter class":
                return pitch[0];
            case "solfege syllable":
            case "solfege class":
                if (type === "solfege class") {
                    // Remove sharps and flats.
                    pitch = pitch.replace(SHARP, "").replace(FLAT, "");
                }
                if (tur.singer.movable === false) {
                    return SOLFEGECONVERSIONTABLE[pitch];
                }
                return SOLFEGENAMES[buildScale(tur.singer.keySignature)[0].indexOf(pitch)];
            case "pitch class":
                return (
                    (pitchToNumber(pitch, octave, tur.singer.keySignature) - 3) %
                    getCurrentEDO(temperament)
                );
            case "scalar class":
                return scaleDegreeToPitchMapping(
                    tur.singer.keySignature,
                    null,
                    tur.singer.movable,
                    pitch
                )[0];
            case "scale degree":
                obj = scaleDegreeToPitchMapping(
                    tur.singer.keySignature,
                    null,
                    tur.singer.movable,
                    pitch
                );
                return obj[0] + obj[1];
            case "nth degree":
                return buildScale(tur.singer.keySignature)[0].indexOf(pitch);
            case "staff y":
                // These numbers are in relation to the staff artwork.
                return (
                    ["C", "D", "E", "F", "G", "A", "B"].indexOf(pitch[0]) * YSTAFFNOTEHEIGHT +
                    (octave - 4) * YSTAFFOCTAVEHEIGHT
                );
            case "pitch number":
                return _calculate_pitch_number(
                    pitch,
                    octave,
                    tur?.singer?.pitchNumberOffset || 0,
                    temperament
                );
            case "pitch in hertz":
                // This function ignores cents.
                return activity.logo.synth._getFrequency(
                    pitch + octave,
                    activity.logo.synth.changeInTemperament
                );
            case "pitch to color":
                if (NOTESSHARP.includes(pitch)) {
                    return NOTESSHARP.indexOf(pitch) * 8.33;
                } else if (NOTESFLAT.includes(pitch)) {
                    return NOTESFLAT.indexOf(pitch) * 8.33;
                }

                console.debug("Pitch not found: " + pitch);
                return 0;
            case "pitch to shade":
                return octave * 12.5;
            default:
                return "__INVALID_INPUT__";
        }
    } catch {
        console.debug("Waiting for note to play");
    }
};
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        updateTemperaments,
        ratioToWheelAngle,
        scaleDegreeToPitchMapping,
        buildScale,
        getNote,
        getModeLength,
        nthDegreeToPitch,
        getInterval,
        _parse_pitch_string,
        _calculate_pitch_number,
        _getStepSize,
        reducedFraction,
        toFraction,
        durationToNoteValue,
        calcNoteValueToDisplay,
        noteToPitchOctave,
        pitchToFrequency,
        noteIsSolfege,
        getSolfege,
        splitSolfege,
        i18nSolfege,
        splitScaleDegree,
        getNumNote,
        calcOctave,
        calcOctaveInterval,
        isInt,
        convertFromSolfege,
        convertFactor,
        getPitchInfo,
        noteToFrequency,
        computeTargetPitchFrequency,
        normalizeNoteAccidentals,
        TEMPERAMENT,
        INTERVAL_CENTS,
        INTERVAL_ORDER,
        setOctaveRatio,
        getOctaveRatio,
        TEMPERAMENTS,
        INITIALTEMPERAMENTS,
        PreDefinedTemperaments,
        getTemperamentsList,
        getTemperament,
        getTemperamentKeys,
        addTemperamentToList,
        deleteTemperamentFromList,
        addTemperamentToDictionary,
        DEFAULTINVERT,
        DEFAULTMODE,
        customMode,
        getInvertMode,
        getIntervalNumber,
        getIntervalDirection,
        getIntervalRatio,
        generateNoteNames,
        getEdoNoteNamePosition,

        getModeNumbers,
        getDrumIndex,
        getDrumName,
        getDrumSymbol,
        getFilterTypes,
        getOscillatorTypes,
        getDrumIcon,
        getDrumSynthName,
        getNoiseName,
        getNoiseIcon,
        getNoiseSynthName,
        getVoiceName,
        getVoiceIcon,
        getVoiceSynthName,
        isCustomTemperament,
        temperamentHasRatios,
        isTrueEDO,
        isEquallyTempered,
        isNonEDO,
        getTemperamentRatio,
        getTemperamentCents,
        getTemperamentName,
        getCurrentEDO,
        noteToObj,
        frequencyToPitch,
        stripMicrotonalPrefix,
        getArticulation,
        keySignatureToMode,
        getScaleAndHalfSteps,
        scalePatternToEDO,
        PITCH_COLLECTIONS_EDO_OVERRIDES,
        getModePattern,
        getNonEDOModeSteps,
        modeMapper,
        getSharpFlatPreference,
        getCustomNote,
        pitchToNumber,
        numberToPitchSharp,
        getNumber,
        getNoteFromInterval,
        numberToPitch,
        GetNotesForInterval,
        parseNoteString,
        base64Encode,
        getStepSizeUp,
        getStepSizeDown,
        ACCIDENTALNAMES,
        ACCIDENTALVALUES,
        NOTESFLAT,
        NOTESSHARP,
        NOTESTEP,
        ALLNOTESTEP,
        MUSICALMODES,
        SEMITONES,
        SCALENOTES,
        PITCHES,
        PITCHES1,
        PITCHES3,
        SHARP,
        FLAT,
        NATURAL,
        DOUBLESHARP,
        DOUBLEFLAT,
        CENTSSYMBOL,
        NOTENAMES,
        SOLFEGENAMES,
        SOLFEGENAMES1,
        SOLFNOTES,
        ALLNOTENAMES,
        NOTENAMES1,
        SEMITONETOINTERVALMAP,
        EQUIVALENTACCIDENTALS,
        INTERVALVALUES,
        FIXEDSOLFEGE,
        FIXEDSOLFEGE1,
        MODEPIEMENU_GROUP_RING,
        MODEPIEMENU_NAME_RING,
        getSavedCustomModes,
        getModeNamesForGroup,
        getModeLabel,
        getModeNameFromLabel,
        getModeSliceColors,
        updateModeWheelItems,
        getModeGroupTitleFont,
        getModeSliceFont,
        getNonEDOFrequency,
        configureWheel
    };
}
