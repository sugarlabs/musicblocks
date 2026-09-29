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

   INVALIDPITCH, globalActivity
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
        NOTESSHARP,
        NOTESFLAT,
        EQUIVALENTFLATS,
        EQUIVALENTSHARPS,
        EQUIVALENTACCIDENTALS,
        SOLFEGENAMES,
        SOLFEGENAMES1,
        NOTENAMES,
        ALLNOTENAMES,
        NOTENAMES1,
        PITCHES,
        PITCHES1,
        PITCHES3,
        FIXEDSOLFEGE,
        NOTESTEP,
        ALLNOTESTEP,
        SOLFNOTES,
        SCALENOTES,
        SEMITONES,
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
        scalePatternToEDO,
        PITCH_COLLECTIONS_EDO_OVERRIDES,
        getModePattern
    } = MusicUtilsModeCore;
    var UtilsLogic =
        (typeof window !== "undefined" && window.UtilsLogic) ||
        (typeof require !== "undefined" ? require("./utils-logic") : {});
    var { toFraction, isInt } = UtilsLogic;
    var MusicUtilsBuildScale =
        (typeof window !== "undefined" && window.MusicUtilsBuildScale) ||
        (typeof require !== "undefined" ? require("./musicutils-buildscale") : {});
    var {
        getNonEDOFrequency,
        buildScale,
        _getStepSize,
        getModeLength,
        scaleDegreeToPitchMapping,
        nthDegreeToPitch,
        getInterval,
        pitchToFrequency,
        noteToFrequency,
        computeTargetPitchFrequency,
        getSolfege
    } = MusicUtilsBuildScale;
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
 * Get notes based on the provided tuning object.
 * @param {Object} tur - The tuning object containing singer information.
 * @returns {Object} - An object containing the firstNote, secondNote, and octave.
 */

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

if (typeof window !== "undefined") {
    window.computeTargetPitchFrequency = computeTargetPitchFrequency;
}

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
