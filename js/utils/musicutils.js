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
    var { FIXEDSOLFEGE1, SEMITONETOINTERVALMAP } = MusicUtilsI18n;
    var MusicUtilsTemperament =
        (typeof window !== "undefined" && window.MusicUtilsTemperament) ||
        (typeof require !== "undefined" ? require("./musicutils-temperament") : {});
    var {
        getCurrentEDO,
        parseEDOTemperament,
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
        getModeGroupTitleFont,
        getModeSliceFont
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
    var UtilsLogic =
        (typeof window !== "undefined" && window.UtilsLogic) ||
        (typeof require !== "undefined" ? require("./utils-logic") : {});
    var { toFraction, isInt } = UtilsLogic;
    var MusicUtilsPitchInfo =
        (typeof window !== "undefined" && window.MusicUtilsPitchInfo) ||
        (typeof require !== "undefined" ? require("./musicutils-pitchinfo") : {});
    var { getStepSizeUp, getStepSizeDown, getPitchInfo } = MusicUtilsPitchInfo;
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
    getModeGroupTitleFont, getModeSliceFont,
    isNonEDO, getNonEDOModeSteps, getNonEDOFrequency,
    parseEDOTemperament
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
        parseEDOTemperament,
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
        getModeGroupTitleFont,
        getModeSliceFont,
        getNonEDOFrequency
    };
}
