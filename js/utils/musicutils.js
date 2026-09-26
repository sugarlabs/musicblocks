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
        WHOLENOTE,
        HALFNOTE,
        QUARTERNOTE,
        EIGHTHNOTE,
        SIXTEENTHNOTE,
        THIRTYSECONDNOTE,
        SIXTYFOURTHNOTE,
        SHARP,
        FLAT,
        CENTSSYMBOL,
        NATURAL,
        DOUBLESHARP,
        DOUBLEFLAT,
        NSYMBOLS,
        BTOFLAT,
        STOSHARP,
        CHROMATIC_SOLFEGE,
        NOTESSHARP,
        NOTESFLAT,
        NOTESFLAT2,
        EQUIVALENTFLATS,
        EQUIVALENTSHARPS,
        EQUIVALENTNATURALS,
        EQUIVALENTACCIDENTALS,
        CONVERT_DOWN,
        CONVERT_DOUBLE_DOWN,
        CONVERT_UP,
        CONVERT_DOUBLE_UP,
        EXTRATRANSPOSITIONS,
        SOLFEGENAMES,
        SOLFEGENAMES1,
        NOTENAMES,
        ALLNOTENAMES,
        NOTENAMES1,
        PITCHES,
        PITCHES1,
        PITCHES2,
        PITCHES3,
        NOTESTABLE,
        FIXEDSOLFEGE,
        NOTESTEP,
        ALLNOTESTEP,
        SHARPPREFERENCE,
        FLATPREFERENCE,
        SOLFNOTES,
        SCALENOTES,
        SEMITONES,
        POWER2,
        A0,
        C10,
        YSTAFFNOTEHEIGHT,
        YSTAFFOCTAVEHEIGHT,
        ACCIDENTALNAMES,
        ACCIDENTALVALUES,
        INTERVALVALUES,
        MODE_PIE_MENUS,
        MODEPIEMENU_GROUP_RING,
        MODEPIEMENU_NAME_RING,
        PITCH_COLLECTIONS,
        PITCH_COLLECTION_ALIASES,
        MAQAMTABLE,
        MIDI_INSTRUMENTS,
        DRUM_MIDI_MAP,
        REVERSE_DRUM_MIDI_MAP,
        DEFAULTINVERT,
        DEFAULTVOICE,
        DEFAULTNOISE,
        DEFAULTDRUM,
        DEFAULTMODE,
        DEFAULTFILTERTYPE,
        SOLFMAPPER,
        ACCIDENTAL_SEMITONE_MAP
    } = MusicUtilsConstants;
    var MusicUtilsI18n =
        (typeof window !== "undefined" && window.MusicUtilsI18n) ||
        (typeof require !== "undefined" ? require("./musicutils-i18n") : {});
    var {
        SOLFEGECONVERSIONTABLE,
        FIXEDSOLFEGE1,
        SEMITONETOINTERVALMAP,
        INVERTMODES,
        FILTERTYPES,
        OSCTYPES
    } = MusicUtilsI18n;
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
}

const _b64Cache = new Map();

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

/**
 * Strip at most two leading microtonal ^ / v prefixes (the temperament
 * widget uses them for cents display, e.g. "^C" or "vvD♭"). Limiting to
 * two keeps any accidental real articulation prefix from being removed.
 * @param {string} note
 * @returns {string}
 */
const stripMicrotonalPrefix = s => s.replace(/^[v^]{1,2}/, "");
function normalizeNoteAccidentals(note) {
    const map = { "♭": "b", "♯": "#", "𝄫": "bb", "𝄪": "x" };
    // Strip at most two leading ^ / v so "^C"/"vvD♭" resolve but "^^^C" keeps a "^"
    return stripMicrotonalPrefix(note).replace(/[♭♯𝄫𝄪]/gu, m => map[m]);
}

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
 * Image URL for a whole note.
 * @constant {string}
 */
const wholeNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(WHOLENOTE));
const halfNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(HALFNOTE));
const quarterNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(QUARTERNOTE));
const eighthNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(EIGHTHNOTE));
const sixteenthNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(SIXTEENTHNOTE));
const thirtysecondNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(THIRTYSECONDNOTE));
const sixtyfourthNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(SIXTYFOURTHNOTE));

/**
 * Map from note duration to corresponding note symbols.
 * @constant {Object.<number, string>}
 */

const NOTESYMBOLS = {
    1: wholeNoteImg,
    2: halfNoteImg,
    4: quarterNoteImg,
    8: eighthNoteImg,
    16: sixteenthNoteImg,
    32: thirtysecondNoteImg,
    64: sixtyfourthNoteImg
};

/**
 * Numeric values representing the intervals in different chords.
 * @constant {Array<Array<Array<number>>>}
 */
const CHORDVALUES = [
    //scalar
    [
        [0, 0],
        [2, 0],
        [4, 0]
    ],
    [
        [2, 0],
        [4, 0],
        [7, 0]
    ],
    [
        [-3, 0],
        [0, 0],
        [2, 0]
    ],
    [
        [0, 0],
        [2, 0],
        [4, 0],
        [6, 0]
    ],
    [
        [2, 0],
        [4, 0],
        [6, 0],
        [7, 0]
    ],
    [
        [-3, 0],
        [-1, 0],
        [0, 0],
        [2, 0]
    ],
    [
        [-1, 0],
        [0, 0],
        [2, 0],
        [4, 0]
    ],
    [
        [0, 0],
        [2, 0],
        [4, 0],
        [6, 0],
        [8, 0]
    ],
    [
        [0, 0],
        [2, 0],
        [4, 0],
        [6, 0],
        [12, 0]
    ],
    //semitone
    [
        [0, 0],
        [0, 4],
        [0, 7]
    ],
    [
        [0, 0],
        [0, 3],
        [0, 7]
    ],
    [
        [0, 0],
        [0, 4],
        [0, 8]
    ],
    [
        [0, 0],
        [0, 3],
        [0, 6]
    ],
    [
        [0, 0],
        [0, 4],
        [0, 7],
        [0, 11]
    ],
    [
        [0, 0],
        [0, 3],
        [0, 7],
        [0, 10]
    ],
    [
        [0, 0],
        [0, 4],
        [0, 7],
        [0, 10]
    ],
    [
        [0, 0],
        [0, 3],
        [0, 7],
        [0, 11]
    ],
    [
        [0, 0],
        [0, 3],
        [0, 6],
        [0, 9]
    ],
    [
        [0, 0],
        [0, 3],
        [0, 6],
        [0, 10]
    ],
    // custom is always at the end of the list
    [
        [0, 0],
        [0, 4],
        [0, 7]
    ]
];

/**
 * Set a custom chord.
 * @function
 * @param {Array<Array<number>>} chord - Custom chord values.
 */
const setCustomChord = chord => {
    CHORDVALUES[CHORDVALUES.length - 1] = chord;
};

/** Custom modes saved by the mode widget; corrupt data yields []. */
const getSavedCustomModes = () => {
    try {
        const customModes = JSON.parse(localStorage.getItem("customModes") || "[]");
        return Array.isArray(customModes)
            ? customModes.filter(m => m && typeof m.name === "string")
            : [];
    } catch (e) {
        return [];
    }
};

/**
 * Builds the fixed 12-slot mode-name list for a group ("custom" padded with blanks).
 * @param {string} grp
 * @param {Array} [customModeNames]
 * @returns {Array}
 */
const getModeNamesForGroup = (grp, customModeNames = []) => {
    if (grp !== "custom") {
        return MODE_PIE_MENUS[grp].slice();
    }
    const names = customModeNames.slice(0, 12);
    while (names.length < 12) {
        names.push(" ");
    }
    return names;
};

/** Display label for a mode (major/ionian and minor/aeolian pairs translated). */
const getModeLabel = modename => {
    switch (modename) {
        case "ionian":
        case "major":
            return `${_("major")} / ${_("ionian")}`;
        case "aeolian":
        case "minor":
            return `${_("minor")} / ${_("aeolian")}`;
        default:
            return modename === " " ? " " : _(modename);
    }
};

/** Inverse of getModeLabel; falls back to the label itself. */
const getModeNameFromLabel = (label, modes) => {
    if (label === `${_("major")} / ${_("ionian")}`) {
        return "major";
    }
    if (label === `${_("minor")} / ${_("aeolian")}`) {
        return "aeolian";
    }
    for (const m of modes) {
        if (_(m) === label) {
            return m;
        }
    }
    return label;
};

/** Per-slice colors: blank slots get emptyColor, real modes filledColor. */
const getModeSliceColors = (modes, colors) =>
    modes.map(modename => (modename === " " ? colors.emptyColor : colors.filledColor));

/** Re-renders a mode-name wheel in place with new labels/colors. */
const updateModeWheelItems = (wheel, labels, colors) => {
    for (let i = 0; i < wheel.navItems.length; i++) {
        const item = wheel.navItems[i];
        item.title = labels[i];
        item.basicNavTitleMax.title = labels[i];
        item.basicNavTitleMin.title = labels[i];
        item.hoverNavTitleMax.title = labels[i];
        item.hoverNavTitleMin.title = labels[i];
        item.selectedNavTitleMax.title = labels[i];
        item.selectedNavTitleMin.title = labels[i];
        item.initNavTitle.title = labels[i];
        item.fillAttr = colors[i];
        item.sliceHoverAttr.fill = colors[i];
        item.slicePathAttr.fill = colors[i];
        item.sliceSelectedAttr.fill = colors[i];
        // refreshWheel() never rewrites text content, so push the label directly.
        if (item.navTitle && typeof item.navTitle.attr === "function") {
            item.navTitle.attr({ text: labels[i] });
        }
    }
    wheel.refreshWheel();
};

/** Group-ring title font, scaled to wheel radius. */
const getModeGroupTitleFont = wheelRadius => `100 ${Math.round(0.08 * wheelRadius)}px sans-serif`;

/** Name-ring label font sized to fit its slice arc. */
const getModeSliceFont = (wheelRadius, sliceCount, labelLen) => {
    const arcPx = (2 * Math.PI * 0.575 * wheelRadius) / sliceCount;
    const size = Math.floor((arcPx * 0.85) / (labelLen * 0.6));
    const minSize = Math.round(0.06 * wheelRadius);
    const maxSize = Math.round(0.12 * wheelRadius);
    const clamped = Math.min(maxSize, Math.max(minSize, size));
    return `100 ${clamped}px sans-serif`;
};

/** Applies shared donut-slice config to a wheelnav instance. */
const configureWheel = (wheel, opts) => {
    wheel.colors = opts.colors;
    wheel.slicePathFunction = slicePath().DonutSlice;
    wheel.slicePathCustom = slicePath().DonutSliceCustomization();
    wheel.slicePathCustom.minRadiusPercent = opts.minRadius;
    wheel.slicePathCustom.maxRadiusPercent = opts.maxRadius;
    if (opts.clickModeRotate !== undefined) {
        wheel.clickModeRotate = opts.clickModeRotate;
    }
    if (opts.selectionPaths) {
        wheel.sliceSelectedPathCustom = wheel.slicePathCustom;
        wheel.sliceInitPathCustom = wheel.slicePathCustom;
    }
    wheel.navAngle = -90;
    wheel.animatetime = 0;
    if (opts.titleRotateAngle !== undefined) {
        wheel.titleRotateAngle = opts.titleRotateAngle;
    }
    if (opts.titleFont !== undefined) {
        wheel.titleFont = opts.titleFont;
    }
};

// The table contains the intervals that define the modes.
// All of these modes assume 12 semitones per octave.
// See http://www.pianoscales.org <== this is in no way definitive

const MUSICALMODES = {};
for (const count in PITCH_COLLECTIONS) {
    const collections = PITCH_COLLECTIONS[count];
    for (const name in collections) {
        MUSICALMODES[name] = collections[name];
    }
}

for (const alias in PITCH_COLLECTION_ALIASES) {
    MUSICALMODES[alias] = MUSICALMODES[PITCH_COLLECTION_ALIASES[alias]];
}

// User definition overrides this constant.
MUSICALMODES["custom"] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

/**
 * Get midi map for Instruments.
 * @function
 * @returns {Object}
 */
const getMidiInstrument = () => {
    return MIDI_INSTRUMENTS;
};

/**
 * Get midi map for Drums.
 * @function
 * @returns {Object}
 */
const getMidiDrum = () => {
    return DRUM_MIDI_MAP;
};

/**
 * Get reversed midi map for drum.
 * @function
 * @returns {Object}
 */
const getReverseDrumMidi = () => {
    return REVERSE_DRUM_MIDI_MAP;
};

/**
 * Custom mode from the musical modes dictionary.
 * @constant {Object}
 */
const customMode = MUSICALMODES["custom"];

/**
 * Get the invert mode name based on its identifier.
 * @function
 * @param {string} name - The identifier of the invert mode.
 * @returns {string} The name of the invert mode.
 */
const getInvertMode = name => {
    for (const interval in INVERTMODES) {
        if (
            INVERTMODES[interval][0] === name ||
            INVERTMODES[interval][1].toLowerCase() === name.toLowerCase()
        ) {
            if (INVERTMODES[interval][0] !== "") {
                return INVERTMODES[interval][0];
            } else {
                return INVERTMODES[interval][1];
            }
        }
    }

    // console.debug(name + " not found in INVERTMODES");
    return name;
};

/**
 * Get the number of semi-tones for a specific interval.
 * @function
 * @param {string} name - The name of the interval.
 * @returns {number} The number of semi-tones for the interval.
 */
const getIntervalNumber = name => {
    return INTERVALVALUES[name][0];
};

/**
 * Get the direction of the interval (-1 down, 0 neutral, 1 up).
 * @function
 * @param {string} name - The name of the interval.
 * @returns {number} The direction of the interval.
 */
const getIntervalDirection = name => {
    return INTERVALVALUES[name][1];
};

/**
 * Get the ratio for a specific interval.
 * @function
 * @param {string} name - The name of the interval.
 * @returns {number} The ratio for the interval.
 */
const getIntervalRatio = name => {
    return INTERVALVALUES[name][2];
};

/**
 * Get the mode numbers for a specific mode name.
 * @function
 * @param {string} name - The name of the mode.
 * @returns {string} The mode numbers.
 */
const getModeNumbers = name => {
    const __convert = obj => {
        let n = 0;
        let m = "";
        for (let i = 0; i < obj.length; i++) {
            m += n.toString();
            if (i < obj.length - 1) {
                m += " ";
            }

            n += obj[i];
        }

        return m;
    };

    const lowercaseName = name.toLowerCase();
    for (const mode in MUSICALMODES) {
        if (mode.toLowerCase() === lowercaseName) {
            return __convert(MUSICALMODES[mode]);
        }
    }

    // console.debug(name + " not found in MUSICALMODES");
    return "";
};

/**
 * Get the drum index based on its name.
 * @function
 * @param {string} name - The name of the drum.
 * @returns {number} The index of the drum, or -1 if not found.
 */
const getDrumIndex = name => {
    if (name === "") {
        // console.debug("getDrumName passed blank name. Returning " + DEFAULTDRUM);
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        name = DEFAULTDRUM;
    }

    for (let drum = 0; drum < DRUMNAMES.length; drum++) {
        if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase()) {
            return drum;
        } else if (DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
            return drum;
        }
    }

    return -1;
};

/**
 * Get the drum name based on its identifier.
 * @function
 * @param {string} name - The identifier of the drum.
 * @returns {string|null} The name of the drum, or null if not found.
 */
const getDrumName = name => {
    if (name === "") {
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        return null;
    }

    for (let drum = 0; drum < DRUMNAMES.length; drum++) {
        if (DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[drum][0];
        } else if (DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[drum][1];
        }
    }

    return null;
};

/**
 * Get the drum symbol based on its name.
 * @function
 * @param {string} name - The name of the drum.
 * @returns {string} The symbol of the drum, or "hh" if not found.
 */
const getDrumSymbol = name => {
    if (name === "") {
        return "hh";
    }

    for (let drum = 0; drum < DRUMNAMES.length; drum++) {
        if (
            DRUMNAMES[drum][0].toLowerCase() === name.toLowerCase() ||
            DRUMNAMES[drum][1].toLowerCase() === name.toLowerCase()
        ) {
            return DRUMNAMES[drum][3];
        }
    }

    // console.debug(name + " not found in DRUMNAMES");
    return "hh";
};

/**
 * Get the filter type based on its name.
 * @function
 * @param {string} name - The name of the filter type.
 * @returns {string} The filter type, or the default filter type if not found.
 */
const getFilterTypes = name => {
    if (name === "") {
        name = DEFAULTFILTERTYPE;
    }

    for (let type = 0; type < FILTERTYPES.length; type++) {
        if (FILTERTYPES[type][0].toLowerCase() === name.toLowerCase()) {
            return FILTERTYPES[type][0];
        } else if (FILTERTYPES[type][1].toLowerCase() === name.toLowerCase()) {
            return FILTERTYPES[type][1];
        }
    }

    // console.debug(name + " not found in FILTERTYPES");
    return DEFAULTFILTERTYPE;
};

/**
 * Get the oscillator type based on its name.
 * @function
 * @param {string} name - The name of the oscillator type.
 * @returns {string|null} The oscillator type, or null if not found.
 */
const getOscillatorTypes = name => {
    if (name === "") {
        name = null; // DEFAULTOSCILLATORTYPE;
    }

    for (let type = 0; type < OSCTYPES.length; type++) {
        if (OSCTYPES[type][0].toLowerCase() === name.toLowerCase()) {
            return OSCTYPES[type][0];
        } else if (OSCTYPES[type][1].toLowerCase() === name.toLowerCase()) {
            return OSCTYPES[type][1];
        }
    }

    // console.debug(name + " not found in OSCTYPES");
    return null; // DEFAULTOSCILLATORTYPE;
};

/**
 * Get the drum icon file path based on its name.
 * @function
 * @param {string} name - The name of the drum.
 * @returns {string} The file path of the drum icon, or the default drum icon path if not found.
 */
const getDrumIcon = name => {
    if (name === "") {
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        return "images/drum.svg";
    }

    for (let i = 0; i < DRUMNAMES.length; i++) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[i][2];
        }
    }

    // console.debug(name + " not found in DRUMNAMES");
    return "images/drum.svg";
};

/**
 * Get the drum synth name based on its identifier.
 * @function
 * @param {string} name - The identifier of the drum synth.
 * @returns {string|null} The name of the drum synth, or null if not found.
 */
const getDrumSynthName = name => {
    if (name === null || name === undefined) {
        // console.debug("getDrumSynthName passed null name. Returning null");
        return null;
    } else if (name === "") {
        name = DEFAULTDRUM;
    } else if (name.slice(0, 4) === "http") {
        return name;
    }

    for (let i = 0; i < DRUMNAMES.length; i++) {
        if (DRUMNAMES[i][0] === name || DRUMNAMES[i][1].toLowerCase() === name.toLowerCase()) {
            return DRUMNAMES[i][1];
        }
    }

    // console.debug(name + " not found in DRUMNAMES");
    return DEFAULTDRUM;
};

/**
 * Get the noise name based on its identifier.
 * @function
 * @param {string} name - The identifier of the noise.
 * @returns {string} The name of the noise, or the default noise if not found.
 */
const getNoiseName = name => {
    if (name === "") {
        name = DEFAULTNOISE;
    }

    for (let i = 0; i < NOISENAMES.length; i++) {
        if (NOISENAMES[i][1] === name) {
            if (NOISENAMES[i][0] !== "") {
                return NOISENAMES[i][0];
            } else {
                return NOISENAMES[i][1];
            }
        }
    }

    return DEFAULTNOISE;
};

/**
 * Get the noise icon file path based on its name.
 * @function
 * @param {string} name - The name of the noise.
 * @returns {string} The file path of the noise icon, or the default noise icon path if not found.
 */
const getNoiseIcon = name => {
    if (name === "") {
        name = DEFAULTNOISE;
    } else if (name.slice(0, 4) === "http") {
        return "images/noises.svg";
    }

    for (let i = 0; i < NOISENAMES.length; i++) {
        if (NOISENAMES[i][0] === name || NOISENAMES[i][1] === name) {
            return NOISENAMES[i][2];
        }
    }

    // console.debug(name + " not found in NOISENAMES");
    return "images/synth.svg";
};

/**
 * Get the noise synth name based on its identifier.
 * @function
 * @param {string|null} name - The identifier of the noise synth.
 * @returns {string|null} The name of the noise synth, or null if not found.
 */
const getNoiseSynthName = name => {
    if (name === null || name === undefined) {
        return null;
    } else if (name === "") {
        name = DEFAULTNOISE;
    }

    for (let i = 0; i < NOISENAMES.length; i++) {
        if (NOISENAMES[i][0] === name || NOISENAMES[i][1] === name) {
            return NOISENAMES[i][1];
        }
    }

    // console.debug(name + " not found in NOISENAMES");
    return DEFAULTNOISE;
};

/**
 * Get the voice name based on its identifier.
 * @function
 * @param {string} name - The identifier of the voice.
 * @returns {string|null} The name of the voice, or null if not found.
 */
const getVoiceName = name => {
    if (name === "") {
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) === "http") {
        return null;
    }

    for (let i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name) {
            if (VOICENAMES[i][0] !== "") {
                return VOICENAMES[i][0];
            } else if (VOICENAMES[i][1] === name) {
                return VOICENAMES[i][1];
            }
        }
    }

    return DEFAULTVOICE;
};

/**
 * Get the voice icon file path based on its identifier.
 * @function
 * @param {string} name - The identifier of the voice.
 * @returns {string} The file path of the voice icon, or the default voice icon path if not found.
 */
const getVoiceIcon = name => {
    if (name === "") {
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) === "http") {
        return "images/voices.svg";
    }

    for (let i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name || VOICENAMES[i][1] === name) {
            return VOICENAMES[i][2];
        }
    }

    for (let i = 0; i < CUSTOMSAMPLES.length; i++) {
        if (CUSTOMSAMPLES[i][0] === name || CUSTOMSAMPLES[i][1] === name) {
            return CUSTOMSAMPLES[i][0];
        }
    }

    // console.debug(name + " not found in VOICENAMES");
    return "images/voices.svg";
};

/**
 * Get the voice synth name based on its identifier.
 * @function
 * @param {string|null} name - The identifier of the voice synth.
 * @returns {string|null} The name of the voice synth, or null if not found.
 */
const getVoiceSynthName = name => {
    if (name === null || name === undefined) {
        return null;
    } else if (name === "") {
        name = DEFAULTVOICE;
    } else if (name.slice(0, 4) === "http") {
        return name;
    }

    for (let i = 0; i < VOICENAMES.length; i++) {
        if (VOICENAMES[i][0] === name || VOICENAMES[i][1] === name) {
            return VOICENAMES[i][1];
        }
    }

    // console.debug(name + " not found in VOICENAMES");
    return DEFAULTVOICE;
};

/**
 * Integer step pattern for a mode under a non-EDO temperament: each
 * cumulative semitone offset of the 12-EDO mode pattern is mapped to the
 * index of the nearest ratio, then positions are differenced. This gives
 * the builder wheel unequal-temperament geometry (e.g. meantone major is
 * not the proportional rescale of 12-EDO semitones).
 * @function
 * @param {string} mode - mode name in MUSICALMODES
 * @param {string} temperament - temperament key in TEMPERAMENT
 * @returns {Array|null} step counts, or null when impossible
 */
const getNonEDOModeSteps = (mode, temperament) => {
    const pattern = MUSICALMODES[mode];
    const t = getTemperament(temperament);
    if (!pattern || !t || !Array.isArray(t.ratios) || t.ratios.length === 0) {
        return null;
    }
    const n = t.pitchNumber || t.ratios.length;
    const positions = [0];
    let cum = 0;
    for (let k = 0; k < pattern.length - 1; k++) {
        cum += pattern[k];
        const target = Math.pow(2, cum / 12);
        let best = 0;
        let bestDiff = Infinity;
        for (let r = 1; r < n; r++) {
            const ratio = Number(t.ratios[r]);
            if (!isFinite(ratio) || ratio <= 0) {
                continue;
            }
            const diff = Math.abs(Math.log2(ratio / target));
            if (diff < bestDiff) {
                bestDiff = diff;
                best = r;
            }
        }
        // Keep positions monotonically increasing; if the nearest ratio
        // falls at or before the previous degree, bump forward by 1 to
        // avoid collapsing two degrees onto the same pitch. This can
        // produce a step of 1 that doesn't correspond to a real ratio
        // interval — acceptable for typical ratio tables (12+ entries)
        // where this path is rarely hit.
        if (best <= positions[positions.length - 1]) {
            best = positions[positions.length - 1] + 1;
        }
        if (best >= n) {
            return null;
        }
        positions.push(best);
    }
    const steps = [];
    for (let p = 1; p < positions.length; p++) {
        steps.push(positions[p] - positions[p - 1]);
    }
    // Close back to the octave: the ratios table holds no octave entry, so
    // the final mode step spans from the last mapped degree to pitchNumber.
    const last = positions[positions.length - 1];
    if (last >= n) {
        return null;
    }
    steps.push(n - last);
    return steps;
};

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
 * Convert a note string to an object containing the note and octave.
 * @function
 * @param {string} note - The note string.
 * @returns {Array} An array containing the note and octave.
 */
const noteToObj = note => {
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
const frequencyToPitch = (hz, temperament) => {
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
 * Get the articulation (accidental/direction) suffix from a note string by
 * stripping the leading note-name prefix.
 *
 * Valid prefixes are the seven solfege syllables (do, re, mi, fa, sol, la, ti)
 * and the seven letter note names (A–G). The prefix is matched only at the
 * start of the string so that custom note names that happen to contain these
 * letters elsewhere are not mangled.
 *
 * @function
 * @param {string} note - The note string (e.g. "C♯", "sol♭", "A^^").
 * @returns {string} Whatever follows the note-name prefix (the articulation),
 *     or the full string unchanged if no recognised prefix is found.
 */
const getArticulation = note => {
    const stripped = stripMicrotonalPrefix(note);
    const match = stripped.match(/^(?:sol|do|re|mi|fa|la|ti|[A-G])(.*)/);
    return match ? match[1] : stripped;
};

/**
 * Convert a key signature to mode, returning an array with the key and mode.
 * @function
 * @param {string} keySignature - The key signature string.
 * @returns {Array} An array containing the key and mode.
 */
const keySignatureToMode = keySignature => {
    // Convert from "A Minor" to "A" and "MINOR"
    if (keySignature === "" || keySignature === null) {
        return ["C", "major"];
    }

    // Maqams have special names for certain keys.
    if (keySignature.toLowerCase() in MAQAMTABLE) {
        keySignature = MAQAMTABLE[keySignature.toLowerCase()];
    }

    let parts = keySignature.split(" ");

    // A special case to test: m used for minor.
    let minorMode = false;
    if (parts.length === 1 && parts[0][parts[0].length - 1] === "m") {
        minorMode = true;
        parts[0] = parts[0].slice(0, parts[0].length - 1);
    }

    let key;
    if (parts[0] in BTOFLAT) {
        key = BTOFLAT[parts[0]];
    } else if (parts[0] in STOSHARP) {
        key = STOSHARP[parts[0]];
    } else {
        key = parts[0];
    }

    if (key === "C" + FLAT) {
        parts = keySignature.split(" ");
        key = "C" + FLAT;
    } else if (key === "B" + SHARP) {
        parts = keySignature.split(" ");
        key = "B" + SHARP;
    } else if (key === "F" + FLAT) {
        parts = keySignature.split(" ");
        key = "F" + FLAT;
    } else if (SOLFEGENAMES1.includes(key)) {
        // This conversion will be a bit iffy depending upon the current mode.

        key = getNote(key, 4, 0, "C Major", false)[0];
    } else if (!NOTESSHARP.includes(key) && !NOTESFLAT.includes(key)) {
        console.debug("Invalid key or missing name; reverting to C.");
        // Is is possible that the key was left out?
        keySignature = "C " + keySignature;
        parts = keySignature.split(" ");
        key = "C";
    }

    if (minorMode) {
        return [key, "natural minor"];
    }

    // Reassemble remaining parts to get mode name
    let mode = "";
    for (let i = 1; i < parts.length; i++) {
        if (parts[i] !== "") {
            if (mode === "") {
                mode = parts[i];
            } else {
                mode += " " + parts[i];
            }
        }
    }

    if (mode === "") {
        mode = "major";
    }

    // Resolve the mode name case-insensitively. Built-in modes are registered
    // lowercase, but user-defined modes keep their original casing (e.g.
    // "MyMode"), so lowercasing the incoming name would fail the lookup.
    let modeKey = mode;
    if (!(modeKey in MUSICALMODES)) {
        for (const m in MUSICALMODES) {
            if (m.toLowerCase() === mode.toLowerCase()) {
                modeKey = m;
                break;
            }
        }
    }

    if (modeKey in MUSICALMODES) {
        return [key, modeKey];
    } else {
        console.debug("Invalid mode name: " + mode + " reverting to major.");
        return [key, "major"];
    }
};

/**
 * Get the scale and solfege with half-steps for a given key signature.
 * @function
 * @param {string} keySignature - The key signature string.
 * @param {number} [edo] - Number of steps per octave (defaults to 12).
 * @returns {Array} An array containing the scale notes, solfege with half-steps, key signature, and mode.
 */
const getScaleAndHalfSteps = (keySignature, edo = 12) => {
    // Determine scale and half-step pattern from key signature
    const obj = keySignatureToMode(keySignature);
    let myKeySignature = obj[0];
    const halfSteps = getModePattern(obj[1], edo);

    if (edo !== 12) {
        // EDO-native scale: 12-EDO solfege slots are a 12-EDO-only concept, so
        // the step pattern is returned in the solfege slot for non-12 EDO.
        const edoNames = generateNoteNames(edo);
        if (myKeySignature in EXTRATRANSPOSITIONS) {
            myKeySignature = EXTRATRANSPOSITIONS[myKeySignature][0];
        }
        return [edoNames, halfSteps, myKeySignature, obj[1]];
    }

    const solfege = [];

    if (halfSteps.length === 7) {
        for (let i = 0; i < halfSteps.length; i++) {
            solfege.push(SOLFEGENAMES[i]);
            for (let j = 1; j < halfSteps[i]; j++) {
                solfege.push("");
            }
        }
    } else if (halfSteps.length > 7) {
        // If there are more than 7 notes, we need to add accidentals.
        for (let i = 0; i < halfSteps.length; i++) {
            if (!solfege.includes(SOLFMAPPER[i])) {
                solfege.push(SOLFMAPPER[i]);
            } else {
                solfege.push(SOLFMAPPER[i] + SHARP);
            }

            for (let j = 1; j < halfSteps[i]; j++) {
                solfege.push("");
            }
        }
    } else {
        // If there are fewer than 7 notes, choose a solfege based on the mode spacing.
        let n;
        let solf;
        for (let i = 0; i < halfSteps.length; i++) {
            n = 0;
            solf = SOLFMAPPER[solfege.length];
            // Ensure there are no duplicates.
            while (solfege.includes(solf)) {
                n += 1;
                solf = SOLFMAPPER[solfege.length + n];
            }

            solfege.push(solf);

            for (let j = 1; j < halfSteps[i]; j++) {
                solfege.push("");
            }
        }
    }

    let thisScale = NOTESSHARP;
    if (NOTESFLAT.includes(myKeySignature)) {
        thisScale = NOTESFLAT;
    }

    if (myKeySignature in EXTRATRANSPOSITIONS) {
        myKeySignature = EXTRATRANSPOSITIONS[myKeySignature][0];
    }
    return [thisScale, solfege, myKeySignature, obj[1]];
};

/**
 * Map common modes into their major/minor equivalent.
 * @function
 * @param {string} key - The key of the mode.
 * @param {string} mode - The mode to map.
 * @returns {Array} An array containing the mapped key and mode.
 */
const modeMapper = (key, mode) => {
    // map common modes into their major/minor equivalent
    // console.debug(key + ' ' + mode + ' >>');
    key = key.toLowerCase();
    mode = mode.toLowerCase();

    switch (mode) {
        case "ionian":
            mode = "major";
            break;
        case "dorian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "a" + SHARP;
                    break;
                case "d":
                    key = "c";
                    break;
                case "e":
                    key = "d";
                    break;
                case "f":
                    key = "c";
                    mode = "minor";
                    break;
                case "g":
                    key = "f";
                    break;
                case "a":
                    key = "g";
                    break;
                case "b":
                    key = "a";
                    break;
                case "c" + SHARP:
                    key = "b";
                    break;
                case "d" + SHARP:
                    key = "c" + SHARP;
                    break;
                case "f" + SHARP:
                    key = "e";
                    break;
                case "g" + SHARP:
                    key = "f" + SHARP;
                    break;
                case "a" + SHARP:
                    key = "g" + SHARP;
                    break;
                case "d" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "e" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "d";
                    mode = "minor";
                    break;
                case "a" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "f";
                    mode = "minor";
                    break;
            }
            break;
        case "phrygian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "g" + SHARP;
                    break;
                case "d":
                    key = "a" + SHARP;
                    break;
                case "e":
                    key = "c";
                    break;
                case "f":
                    key = "d" + FLAT;
                    break;
                case "g":
                    key = "c";
                    mode = "minor";
                    break;
                case "a":
                    key = "f";
                    break;
                case "b":
                    key = "g";
                    break;
                case "c" + SHARP:
                    key = "a";
                    break;
                case "d" + SHARP:
                    key = "b";
                    break;
                case "f" + SHARP:
                    key = "d";
                    break;
                case "g" + SHARP:
                    key = "e";
                    break;
                case "a" + SHARP:
                    key = "b";
                    break;
                case "d" + FLAT:
                    key = "g" + FLAT;
                    mode = "minor";
                    break;
                case "e" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "d";
                    break;
                case "a" + FLAT:
                    key = "d" + FLAT;
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
            }
            break;
        case "lydian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "g";
                    break;
                case "d":
                    key = "a";
                    break;
                case "e":
                    key = "b";
                    break;
                case "f":
                    key = "c";
                    break;
                case "g":
                    key = "d";
                    break;
                case "a":
                    key = "e";
                    break;
                case "b":
                    key = "b";
                    break;
                case "c" + SHARP:
                    key = "g" + SHARP;
                    break;
                case "d" + SHARP:
                    key = "a" + SHARP;
                    break;
                case "f" + SHARP:
                    key = "b";
                    break;
                case "g" + SHARP:
                    key = "c";
                    mode = "minor";
                    break;
                case "a" + SHARP:
                    key = "f";
                    break;
                case "d" + FLAT:
                    key = "f";
                    mode = "minor";
                    break;
                case "e" + FLAT:
                    key = "g";
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "d" + FLAT;
                    mode = "minor";
                    break;
                case "a" + FLAT:
                    key = "c";
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "d";
                    mode = "minor";
                    break;
            }
            break;
        case "mixolydian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "f";
                    break;
                case "d":
                    key = "g";
                    break;
                case "e":
                    key = "a";
                    break;
                case "f":
                    key = "a" + SHARP;
                    break;
                case "g":
                    key = "c";
                    break;
                case "a":
                    key = "d";
                    break;
                case "b":
                    key = "e";
                    break;
                case "c" + SHARP:
                    key = "f" + SHARP;
                    break;
                case "d" + SHARP:
                    key = "g" + SHARP;
                    break;
                case "f" + SHARP:
                    key = "b";
                    break;
                case "g" + SHARP:
                    key = "c" + SHARP;
                    break;
                case "a" + SHARP:
                    key = "c";
                    mode = "minor";
                    break;
                case "d" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "e" + FLAT:
                    key = "f";
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "a" + FLAT:
                    key = "e" + FLAT;
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "c";
                    mode = "minor";
                    break;
            }
            break;
        case "locrian":
            mode = "major";
            switch (key) {
                case "c":
                    key = "b";
                    break;
                case "d":
                    key = "c";
                    mode = "minor";
                    break;
                case "e":
                    key = "f";
                    break;
                case "f":
                    key = "g" + FLAT;
                    break;
                case "g":
                    key = "g" + SHARP;
                    break;
                case "a":
                    key = "a" + SHARP;
                    break;
                case "b":
                    key = "c";
                    break;
                case "c" + SHARP:
                    key = "d";
                    break;
                case "d" + SHARP:
                    key = "e";
                    break;
                case "f" + SHARP:
                    key = "g";
                    break;
                case "g" + SHARP:
                    key = "a";
                    break;
                case "a" + SHARP:
                    key = "b";
                    break;
                case "d" + FLAT:
                    key = "d";
                    break;
                case "e" + FLAT:
                    key = "d" + FLAT;
                    mode = "minor";
                    break;
                case "g" + FLAT:
                    key = "f";
                    mode = "minor";
                    break;
                case "a" + FLAT:
                    key = "g" + FLAT;
                    mode = "minor";
                    break;
                case "b" + FLAT:
                    key = "d" + FLAT;
                    mode = "minor";
                    break;
            }
            break;
        case "aeolian":
            mode = "minor";
            break;
        case "natural minor":
            mode = "minor";
            break;
        case "major":
        case "minor":
        default:
            break;
    }

    // console.debug('>> ' + key + ' ' + mode);
    return [key, mode];
};

/**
 * Get the preference for using sharp, flat, or natural based on the key signature.
 * @function
 * @param {string} keySignature - The key signature.
 * @returns {string} The preference for using sharp, flat, or natural.
 */
const getSharpFlatPreference = keySignature => {
    const obj = keySignatureToMode(keySignature);
    const obj2 = modeMapper(obj[0], obj[1]);
    const ks = obj2[0] + " " + obj2[1];

    if (SHARPPREFERENCE.includes(ks)) {
        return "sharp";
    } else if (FLATPREFERENCE.includes(ks)) {
        return "flat";
    } else {
        return "natural";
    }
};

/**
 * Get the custom note representation for a given note in a custom temperament.
 * @function
 * @param {string|Array} note - The note or an array representing the note and its attributes.
 * @returns {string} The custom note representation.
 */
const getCustomNote = note => {
    // For custom temperament note
    if (note instanceof Array) {
        note = note[0];
    }

    let centsInfo = "";
    if (note.includes("(")) {
        centsInfo = note.substring(note.indexOf("("), note.length);
    }

    note = note.replace(centsInfo, "");
    const articulation = getArticulation(note);
    note = note.replace(articulation, "");

    switch (articulation) {
        case "bb":
        case DOUBLEFLAT:
            note = note + "𝄫" + centsInfo;
            break;
        case "b":
        case FLAT:
            note = note + "♭" + centsInfo;
            break;
        case "##":
        case "*":
        case "x":
        case DOUBLESHARP:
            note = note + "𝄪" + centsInfo;
            break;
        case "#":
        case SHARP:
            note = note + "♯" + centsInfo;
            break;
        default:
            note = note + articulation + centsInfo;
            break;
    }
    return note;
};

/**
 * Convert a pitch, octave, and key signature to a numeric representation.
 * @function
 * @param {string} pitch - The pitch name (e.g., C, D, E).
 * @param {number} octave - The octave number.
 * @param {string} keySignature - The key signature.
 * @param {string} [temperament="equal"] - The temperament to use.
 * @returns {number} The numeric representation of the pitch.
 */
const pitchToNumber = (pitch, octave, keySignature, temperament) => {
    const currentEDO = getCurrentEDO(temperament);
    // Calculate the pitch index based on pitch and octave.
    if (pitch.toUpperCase() === "R") {
        return 0;
    }
    const originalPitch = pitch;
    // Check for flat, sharp, double flat, or double sharp.
    let transposition = 0;
    const len = pitch.length;
    let lastOne, lastTwo;
    if (len > 1) {
        if (len > 2) {
            lastTwo = pitch.slice(len - 2);
            //Unsure why slice is not working for double flats and double sharps.
            lastOne = pitch.substring(1, len);
            if (lastTwo === "bb") {
                pitch = pitch.substring(0, 1);
                transposition -= 2;
            } else if (lastOne === DOUBLEFLAT) {
                pitch = pitch.substring(0, 1);
                transposition -= 2;
            } else if (lastTwo === "##" || lastTwo === "*" || lastTwo === DOUBLESHARP) {
                pitch = pitch.substring(0, 1);
                transposition += 2;
            } else if (
                lastTwo === "#b" ||
                lastTwo === SHARP + FLAT ||
                lastTwo === "b#" ||
                lastTwo === FLAT + SHARP
            ) {
                // Not sure this could occur... but just in case.
                pitch = pitch.slice(0, len - 2);
            }
        }

        if (pitch.length > 1) {
            lastOne = pitch.slice(len - 1);
            if (lastOne === "b" || lastOne === FLAT) {
                pitch = pitch.slice(0, len - 1);
                transposition -= 1;
            } else if (lastOne === "#" || lastOne === SHARP) {
                pitch = pitch.slice(0, len - 1);
                transposition += 1;
            } else if (lastOne === "x" || lastOne === "*") {
                pitch = pitch.slice(0, len - 1);
                transposition += 2;
            }
        }
    }

    // For EDO > 12, use the EDO-specific name table for ALL pitches
    // (naturals and accidentals alike) so that the A reference is
    // consistent with the table's natural positions.
    if (currentEDO !== 12) {
        const names = generateNoteNames(currentEDO);
        let aIndex = names.indexOf("A");
        if (aIndex === -1) {
            // For EDO < 10, A may not appear in the note name table.
            // Use its proportional position from 12-EDO (A is at index 9).
            aIndex = Math.round((9 / 12) * currentEDO);
        }
        const normalizedPitch = originalPitch
            .replace(/^([a-g])/, (_, letter) => letter.toUpperCase())
            .replaceAll("#", SHARP)
            .replaceAll("b", FLAT);
        let edoPos = names.indexOf(normalizedPitch);
        if (edoPos === -1) {
            // Fallback: try the 12-EDO arrays with proportional mapping
            const fallbackPos = PITCHES2.indexOf(normalizedPitch);
            if (fallbackPos !== -1) {
                edoPos = Math.round((fallbackPos / 12) * currentEDO);
            } else {
                const sharpPos = PITCHES.indexOf(normalizedPitch);
                if (sharpPos !== -1) {
                    edoPos = Math.round((sharpPos / 12) * currentEDO);
                }
            }
        }
        if (edoPos !== -1) {
            return octave * currentEDO + edoPos - aIndex;
        }
    }

    // 12-EDO or fallback path: use PITCHES array with transposition.
    if (transposition !== 0) {
        const edoPos = getEdoNoteNamePosition(originalPitch, currentEDO);
        if (edoPos !== -1) {
            return octave * currentEDO + edoPos - PITCHES.indexOf("A");
        }
    }

    let pitchNumber = 0;
    if (PITCHES.includes(pitch.toUpperCase())) {
        pitchNumber = PITCHES.indexOf(pitch.toUpperCase());
    } else {
        // obj[1] is the solfege mapping for the current key/mode
        const obj = getScaleAndHalfSteps(keySignature);
        if (obj[1].includes(pitch.toLowerCase())) {
            pitchNumber = obj[1].indexOf(pitch.toLowerCase());
        } else {
            console.debug("pitch " + pitch + " not found in mode.");
            // Try an equivalent pitch.
            if (pitch.toLowerCase() in FIXEDSOLFEGE1) {
                const thisPitch = FIXEDSOLFEGE1[pitch.toLowerCase()];
                pitchNumber = obj[0].indexOf(thisPitch);
            } else {
                pitchNumber = 0;
            }
        }
    }
    // We start at A0.
    return octave * currentEDO + pitchNumber - PITCHES.indexOf("A") + transposition;
};

/**
 * Convert a numeric representation to a pitch with sharps.
 * @function
 * @param {number} i - The numeric representation of the pitch.
 * @returns {Array} An array containing the pitch and octave.
 */
const numberToPitchSharp = (i, temperament) => {
    const currentEDO = getCurrentEDO(temperament);
    if (currentEDO === 12) {
        if (i < 0) {
            let n = 0;
            while (i < 0) {
                i += 12;
                n += 1;
            }
            const octave = Math.floor((i + PITCHES2.indexOf("A")) / 12) - n;
            const nameIndex = Math.round(((i % 12) / 12) * 12);
            return [PITCHES2[(nameIndex + PITCHES2.indexOf("A")) % 12], octave];
        } else {
            const octave = Math.floor((i + PITCHES2.indexOf("A")) / 12);
            const nameIndex = Math.round(((i % 12) / 12) * 12);
            return [PITCHES2[(nameIndex + PITCHES2.indexOf("A")) % 12], octave];
        }
    }
    const edoNames = generateNoteNames(currentEDO);
    let aIndex = edoNames.indexOf("A");
    if (aIndex === -1) {
        aIndex = Math.round((9 / 12) * currentEDO);
    }
    if (i < 0) {
        let n = 0;
        while (i < 0) {
            i += currentEDO;
            n += 1;
        }
        const octave = Math.floor((i + aIndex) / currentEDO) - n;
        const nameIndex = (i + aIndex) % currentEDO;
        return [edoNames[nameIndex], octave];
    } else {
        const octave = Math.floor((i + aIndex) / currentEDO);
        const nameIndex = (i + aIndex) % currentEDO;
        return [edoNames[nameIndex], octave];
    }
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
const getNumber = (notename, octave, temperament, edo) => {
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
 * Get the note based on a given pitch and interval.
 * @function
 * @param {string} pitch - The pitch, including the note name and octave (e.g., "C4").
 * @param {string} interval - The interval for which the note needs to be determined (e.g., "major 3rd").
 * @param {string} [temperament="equal"] - The temperament to use for pitch calculations.
 * @returns {Array} An array containing the note and octave.
 */
const getNoteFromInterval = (pitch, interval, temperament) => {
    if (temperament === undefined) {
        temperament = "equal";
    }
    const pitch1 = pitch.substring(0, 1);
    const parsed = parseNoteString(pitch);
    const note1 = parsed[0];
    const octave1 = parsed[1];
    const number = pitchToNumber(note1, octave1, "C major", temperament);
    const pitches = ["C", "D", "E", "F", "G", "A", "B"];
    const priorAttrs = [DOUBLEFLAT, FLAT, "", SHARP, DOUBLESHARP];

    /**
     * Find the note that corresponds to a major interval.
     * @function
     * @param {string} interval - The interval for which the note needs to be determined (e.g., "major 3rd").
     * @returns {Array} An array containing the note and octave.
     */
    const findMajorInterval = interval => {
        //For eg. If you are asked to write a major 3rd then the
        //letters must be 3 apart.
        //Eg Ab - C or D - F. This is irrelevant of whether the first
        //note is a sharp or flat, eg G# - B.
        //Then need to work out if you need a sharp or flat on the
        //second note.
        //A Major 3rd is 4 semitones. So, Ab - C needs to be Ab - C; D
        //- F is D- F#; G# - B is G# - B#.
        //Same technique is used to code the findMajorInterval.
        const halfSteps = INTERVALVALUES[interval][0];
        // const direction = INTERVALVALUES[interval][1];

        let note = numberToPitch(number + halfSteps, temperament);
        const num = interval.split(" ");
        const pitchIndex = pitches.indexOf(pitch1);
        let index = pitchIndex + Number(num[num.length - 1]) - 1;
        let octave = octave1;
        if (index > 6) {
            index = index - 7;
            octave = octave1 + 1;
        }
        const id = pitches[index];
        if (note[0].substring(0, 1) === id) {
            return [note[0], octave];
        } else if (note[0].substring(0, 1) !== id) {
            note = numberToPitchSharp(number + halfSteps, temperament);
            if (note[0] === id) {
                return [note[0], octave];
            } else {
                const steps = getNumber(id, octave) - getNumber(note1, octave1);
                const naturalIndex = priorAttrs.indexOf("");
                const attr = priorAttrs[naturalIndex + halfSteps - steps];
                note = id + attr + "";
                return [note, octave];
            }
        }
    };

    /**
     * Find notes for intervals other than major intervals.
     * @function
     * @param {string} interval - The interval for which the note needs to be determined.
     * @returns {Array} An array containing the note and octave.
     */
    const findOtherIntervals = interval => {
        const num = interval.split(" ");
        let majorNote;
        let accidental;
        let index1;

        if (
            interval === "minor 2" ||
            interval === "minor 3" ||
            interval === "minor 6" ||
            interval === "minor 7"
        ) {
            //Major intervals lowered by a half step become minor.
            majorNote = findMajorInterval("major " + num[num.length - 1]);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        // Diminished intervals for perfect intervals (lowered by half step)
        else if (interval === "down 4" || interval === "down 5" || interval === "down 8") {
            // Mapping to the corresponding perfect interval
            if (interval === "down 4") {
                majorNote = findMajorInterval("perfect 4");
            } else if (interval === "down 5") {
                majorNote = findMajorInterval("perfect 5");
            } else if (interval === "down 8") {
                majorNote = findMajorInterval("perfect 8");
            }

            // Lowering by one half step
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        // Special case: doubly diminished 5th (very diminished)
        else if (interval === "down-diminished 5") {
            majorNote = findMajorInterval("perfect 5");
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);

            // Lowering by Two half steps for "very diminished"
            if (index1 <= 1) {
                // If already at flat or double flat, add another flat
                accidental = priorAttrs[0] + FLAT;
            } else {
                // Go down two accidentals in the array
                accidental = priorAttrs[index1 - 2];
            }
        }

        // Special case: diminished 2nd (from unison)
        else if (interval === "diminished 2") {
            majorNote = findMajorInterval("perfect 1");
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        // Handle standard diminished intervals not covered by microtonal cases
        else if (interval.startsWith("diminished ")) {
            const intervalNum = interval.split(" ")[1];
            let baseInterval;
            if (["4", "5", "8"].includes(intervalNum)) {
                // Perfect-based
                baseInterval = "perfect " + intervalNum;
            } else {
                // Major-based
                baseInterval = "major " + intervalNum;
            }

            majorNote = findMajorInterval(baseInterval);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);

            // Lower by one half-step from the base interval
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        // Augmented intervals for perfect intervals (raised by half step)
        else if (interval === "up 4" || interval === "up 5" || interval === "up-augmented 4") {
            // Mapping to the corresponding perfect interval
            if (interval === "up 4" || interval === "up-augmented 4") {
                majorNote = findMajorInterval("perfect 4");
            } else if (interval === "up 5") {
                majorNote = findMajorInterval("perfect 5");
            }

            // Raise by one half step
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        // Special case: augmented unison
        else if (interval === "augmented 1") {
            majorNote = findMajorInterval("perfect 1");
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        // Standard augmented intervals
        else if (
            interval === "augmented 2" ||
            interval === "augmented 3" ||
            interval === "augmented 4" ||
            interval === "augmented 5" ||
            interval === "augmented 6" ||
            interval === "augmented 7" ||
            interval === "augmented 8"
        ) {
            const intervalNum = interval.split(" ")[1];
            if (["1", "4", "5", "8"].includes(intervalNum)) {
                // Perfect-based augmented intervals
                majorNote = findMajorInterval("perfect " + intervalNum);
            } else {
                // Major-based augmented intervals
                majorNote = findMajorInterval("major " + intervalNum);
            }
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        // Handle "up-major" intervals (raised major)
        else if (
            interval === "up-major 2" ||
            interval === "up-major 3" ||
            interval === "up-major 6" ||
            interval === "up-major 7"
        ) {
            let intervalNum;
            intervalNum = interval.split(" ")[1];
            majorNote = findMajorInterval("major " + intervalNum);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 4) {
                accidental = priorAttrs[index1] + SHARP;
            } else {
                accidental = priorAttrs[index1 + 1];
            }
        }

        // Handle "down-minor" intervals (lowered minor - like diminished)
        else if (
            interval === "down-minor 3" ||
            interval === "down-minor 6" ||
            interval === "down-minor 7"
        ) {
            const intervalNum = interval.split(" ")[1];
            majorNote = findMajorInterval("major " + intervalNum);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);

            // Lower by an additional half step (total of two half steps below major)
            if (index1 <= 1) {
                accidental = priorAttrs[0] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 2]; // Go down two accidentals
            }
        }

        // Handle neutral/mid intervals (between major and minor)
        else if (
            interval === "mid 2" ||
            interval === "mid 3" ||
            interval === "mid 6" ||
            interval === "mid 7"
        ) {
            const intervalNum = interval.split(" ")[1];
            majorNote = findMajorInterval("major " + intervalNum);
            accidental = majorNote[0].substring(1, majorNote[0].length);
            index1 = priorAttrs.indexOf(accidental);
            if (index1 === 0) {
                accidental = priorAttrs[index1] + FLAT;
            } else {
                accidental = priorAttrs[index1 - 1];
            }
        }

        return [majorNote[0].substring(0, 1) + accidental + "", majorNote[1]];
    };

    if (
        interval === "major 2" ||
        interval === "major 3" ||
        interval === "major 6" ||
        interval === "major 7" ||
        interval === "perfect 4" ||
        interval === "perfect 5" ||
        interval === "perfect 8" ||
        interval === "perfect 1"
    ) {
        return findMajorInterval(interval);
    } else {
        return findOtherIntervals(interval);
    }
};

/**
 * Convert a pitch number to a pitch name (note and octave).
 * @function
 * @param {number} i - The pitch number.
 * @param {string} [temperament="equal"] - The temperament to use (default is "equal").
 * @param {string} [startPitch="A"] - The starting pitch name (default is "A").
 * @param {number} [offset=0] - The offset value (default is 0).
 * @returns {Array} An array containing the note and octave.
 */
const numberToPitch = (i, temperament, startPitch, offset, activity) => {
    // Calculate the pitch and octave based on index.
    // We start at A0.
    if (temperament === undefined) {
        temperament = "equal";
    }
    const currentEDO = getCurrentEDO(temperament);

    let n = 0;
    let pitchNumber;
    if (i < 0) {
        while (i < 0) {
            i += currentEDO;
            n += 1; // Count octave bump ups.
        }

        if (isTrueEDO(temperament)) {
            if (currentEDO === 12) {
                const nameIndex = Math.round(((i % currentEDO) / currentEDO) * 12);
                return [
                    PITCHES[(nameIndex + PITCHES.indexOf("A")) % 12],
                    Math.floor((i + PITCHES.indexOf("A")) / currentEDO) - n
                ];
            } else {
                const edoNames = generateNoteNames(currentEDO);
                let aIndex = edoNames.indexOf("A");
                if (aIndex === -1) {
                    aIndex = Math.round((9 / 12) * currentEDO);
                }
                const nameIndex = (((i + aIndex) % currentEDO) + currentEDO) % currentEDO;
                return [edoNames[nameIndex], Math.floor((i + aIndex) / currentEDO) - n];
            }
        } else {
            pitchNumber = Math.floor(i - offset);
        }
    } else {
        if (isTrueEDO(temperament)) {
            if (currentEDO === 12) {
                const nameIndex = Math.round(((i % currentEDO) / currentEDO) * 12);
                return [
                    PITCHES[(nameIndex + PITCHES.indexOf("A")) % 12],
                    Math.floor((i + PITCHES.indexOf("A")) / currentEDO)
                ];
            } else {
                const edoNames = generateNoteNames(currentEDO);
                let aIndex = edoNames.indexOf("A");
                if (aIndex === -1) {
                    aIndex = Math.round((9 / 12) * currentEDO);
                }
                const nameIndex = (((i + aIndex) % currentEDO) + currentEDO) % currentEDO;
                return [edoNames[nameIndex], Math.floor((i + aIndex) / currentEDO)];
            }
        } else {
            pitchNumber = Math.floor(i - offset);
        }
    }

    let interval;
    if (isCustomTemperament(temperament)) {
        // The index may be outside of the octave.
        // Ensure the temperament exists in TEMPERAMENT before accessing it
        if (!TEMPERAMENT[temperament] || !TEMPERAMENT[temperament]["pitchNumber"]) {
            // Fallback to equal temperament if custom temperament is not found
            if (activity && activity.errorMsg) {
                activity.errorMsg(
                    _("Invalid temperament. Falling back to equal temperament."),
                    3000
                );
            }
            temperament = "equal";
        }
        const octaveLength = TEMPERAMENT[temperament]["pitchNumber"];
        const pitchIdx = pitchNumber % octaveLength;
        const octaveFactor = Math.floor(pitchNumber / octaveLength);

        pitchNumber = pitchIdx + "";
        if (TEMPERAMENT[temperament][pitchNumber] === undefined) {
            // If custom temperament is not defined, then it will
            // store equal temperament notes.
            for (let j = 0; j < octaveLength; j++) {
                const number = "" + j;
                const intervalIndex = Math.round((j * 12) / octaveLength) % 12;
                interval = TEMPERAMENT["equal"]["interval"][intervalIndex];
                TEMPERAMENT[temperament][number] = [
                    Math.pow(2, j / octaveLength),
                    getNoteFromInterval(startPitch, interval)[0],
                    getNoteFromInterval(startPitch, interval)[1]
                ];
            }

            return [
                TEMPERAMENT[temperament][pitchNumber][1],
                TEMPERAMENT[temperament][pitchNumber][2]
            ];
        } else {
            // Add in octave factor from above.
            const o = Number(TEMPERAMENT[temperament][pitchNumber][2]) + octaveFactor;
            return [TEMPERAMENT[temperament][pitchNumber][1], o];
        }
    } else {
        const temperamentPitchNumber = TEMPERAMENT[temperament]["pitchNumber"] || 12;
        const t = TEMPERAMENT[temperament];
        const noteNames =
            t && t.noteLabels ? t.noteLabels : generateNoteNames(temperamentPitchNumber);

        // Determine the starting note's position in the EDO name table.
        let startPos = 0;
        let baseOctave = 4;
        if (startPitch) {
            const octMatch = startPitch.match(/(-?\d+)$/);
            if (octMatch) {
                baseOctave = parseInt(octMatch[1], 10);
                startPitch = startPitch.slice(0, -octMatch[1].length);
            }
            const normalized = startPitch.replace(/#/g, SHARP).replace(/b/g, FLAT);
            const pos = noteNames.indexOf(normalized);
            if (pos !== -1) {
                startPos = pos;
            }
        }

        const idx =
            ((pitchNumber % temperamentPitchNumber) + temperamentPitchNumber) %
            temperamentPitchNumber;
        const octaveOffset = Math.floor(pitchNumber / temperamentPitchNumber);
        const noteName =
            noteNames[
                (((startPos + idx) % temperamentPitchNumber) + temperamentPitchNumber) %
                    temperamentPitchNumber
            ];
        return [noteName, baseOctave + octaveOffset];
    }
};

/**
 * Get notes based on the provided tuning object.
 * @param {Object} tur - The tuning object containing singer information.
 * @returns {Object} - An object containing the firstNote, secondNote, and octave.
 */

const GetNotesForInterval = tur => {
    const noteStatus = tur.singer.noteStatus;
    const notePitches = tur.singer.notePitches;
    const intervals = tur.singer.intervals;
    const noteOctave = tur.singer.noteOctaves;
    let firstNote = "C",
        secondNote = "C",
        octave = 0;
    if (noteStatus && noteStatus[0]) {
        firstNote = noteStatus[0][0].replace(/\d/g, ""); //removing all numbers like '1'
        if (!noteStatus[0][1]) {
            return { firstNote, secondNote: firstNote, octave };
        }
        secondNote = noteStatus[0][1].replace(/\d/g, "");
        const octavea = parseInt(noteStatus[0][0].replace(/[^0-9]/g, ""), 10);
        const octaveb = parseInt(noteStatus[0][1].replace(/[^0-9]/g, ""), 10);
        octave = octaveb - octavea;
    } else if (notePitches && notePitches[last(tur.singer.inNoteBlock)]?.length) {
        // Outside a note block there is no pitch list to read from, so keep
        // the C to C default instead of indexing into undefined.
        const pitchBlk = notePitches[last(tur.singer.inNoteBlock)];
        firstNote = pitchBlk[0];
        secondNote = pitchBlk[pitchBlk.length - 1];
    }

    if (intervals && intervals.length) {
        octave = Math.floor(intervals[0] / 7);
    } else if (noteOctave && noteOctave[last(tur.singer.inNoteBlock)]) {
        const octaveblk = noteOctave[last(tur.singer.inNoteBlock)];
        octave = octaveblk[octaveblk.length - 1] - octaveblk[0];
    }

    firstNote = normalizeNoteAccidentals(firstNote);
    secondNote = normalizeNoteAccidentals(secondNote);

    return { firstNote, secondNote, octave };
};

/**
 * Encodes a string to Base64 format.
 * @param {string} str - The string to encode.
 * @returns {string} - The Base64 encoded string.
 */
function base64Encode(str) {
    if (_b64Cache.has(str)) {
        return _b64Cache.get(str);
    }
    const encoder = new TextEncoder();
    const uint8Array = encoder.encode(str);
    // String.fromCharCode(...uint8Array) throws RangeError for inputs > ~128KB.
    // Use a loop instead — identical output, no argument-count limit.
    let binaryString = "";
    for (let i = 0; i < uint8Array.length; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    if (_b64Cache.size > 1000) {
        _b64Cache.clear();
    }
    _b64Cache.set(str, binaryString);
    return binaryString;
}

/**
 * Resolve a solfege note argument (e.g. "do", "re♯") to a note name for the
 * given key signature and octave length. Shared by the 12-EDO and microtonal
 * EDO paths in getNote().
 * @function
 * @param {string} noteArg - The note argument (expected to be solfege).
 * @param {string} keySignature - The key signature (e.g. "C major").
 * @param {boolean} movable - Whether movable-do solfege is in effect.
 * @param {number} octaveLength - The number of steps in the octave.
 * @param {number} octave - The current octave (adjusted in the return value).
 * @param {number} transpositionFloor - The current transposition floor (adjusted in the return value).
 * @returns {Array|null} [note, octave, transpositionFloor] on success, or null
 *   if noteArg is not a resolvable solfege name.
 */
const getNoteFromSolfege = (
    noteArg,
    keySignature,
    movable,
    octaveLength,
    octave,
    transpositionFloor
) => {
    let sharpFlat = false;
    if (["#", SHARP, FLAT, "b"].includes(noteArg.slice(-1))) {
        sharpFlat = true;
    }

    if (!keySignature) {
        keySignature = "C major";
    }

    let obj;

    if (movable) {
        obj = getScaleAndHalfSteps(keySignature);
    } else {
        obj = getScaleAndHalfSteps("C major");
    }

    let thisScale = obj[0];
    const halfSteps = obj[1];
    const myKeySignature = obj[2];
    const mode = obj[3];
    let offset;
    if (movable) {
        // Ensure it is a valid key signature.
        offset = thisScale.indexOf(myKeySignature);
        if (offset === -1) {
            console.debug(
                "WARNING: Key " +
                    myKeySignature +
                    " not found in " +
                    thisScale +
                    ". Using default of C"
            );
            offset = 0;
            thisScale = NOTESSHARP;
        }

        // We need to set the octave relative to the tonic.
        // Starting from C_4 (note_octave)
        // All keys C# -- F# would remain in octave four
        // All keys Gb -- B would be in octave three (since
        // going down is closer than going up)
        if (offset > 5) {
            transpositionFloor -= octaveLength; // go down one octave
        }
    } else {
        offset = 0;
    }

    if (sharpFlat) {
        if (noteArg.slice(-1) === "#") {
            offset += 1;
        } else if (noteArg.slice(-1) === SHARP) {
            offset += 1;
        } else if (noteArg.slice(-1) === FLAT) {
            offset -= 1;
        } else if (noteArg.slice(-1) === "b") {
            offset -= 1;
        }
    }

    let solfegePart;
    if (halfSteps.includes(noteArg.slice(0, 1).toLowerCase())) {
        solfegePart = noteArg.slice(0, 1).toLowerCase();
    } else if (halfSteps.includes(noteArg.slice(0, 2).toLowerCase())) {
        solfegePart = noteArg.slice(0, 2).toLowerCase();
    } else if (halfSteps.includes(noteArg.slice(0, 3).toLowerCase())) {
        solfegePart = noteArg.slice(0, 3).toLowerCase();
    } else {
        // The note should already be translated, but just in case...
        // Reverse any i18n
        // solfnotes_ is used in the interface for i18n
        const i18nObj = splitI18nSolfege(noteArg);
        if (SOLFNOTES.includes(i18nObj[0])) {
            solfegePart = i18nObj[0];
        } else {
            solfegePart = noteArg.slice(0, 2).toLowerCase();
        }
    }

    if (movable) {
        let i;
        switch (mode) {
            case "dorian":
                i = SOLFEGENAMES.indexOf(solfegePart);
                if (i > 0) {
                    transpositionFloor += octaveLength;
                }

                transpositionFloor -= octaveLength;
                i += 6;
                if (i > 6) {
                    i -= 7;
                }

                solfegePart = SOLFEGENAMES[i];
                break;
            case "phrygian":
                i = SOLFEGENAMES.indexOf(solfegePart);
                if (i > 1) {
                    transpositionFloor += octaveLength;
                }

                i += 5;
                if (i > 6) {
                    i -= 7;
                }

                solfegePart = SOLFEGENAMES[i];
                break;
            case "lydian":
                i = SOLFEGENAMES.indexOf(solfegePart);
                if (i > 2) {
                    transpositionFloor += octaveLength;
                }

                i += 4;
                if (i > 6) {
                    i -= 7;
                }

                solfegePart = SOLFEGENAMES[i];
                break;
            case "mixolydian":
                i = SOLFEGENAMES.indexOf(solfegePart);
                if (i > 3) {
                    transpositionFloor += octaveLength;
                }

                i += 3;
                if (i > 6) {
                    i -= 7;
                }

                solfegePart = SOLFEGENAMES[i];
                break;
            case "minor":
            case "aeolian":
                i = SOLFEGENAMES.indexOf(solfegePart);
                if (i > 4) {
                    transpositionFloor += octaveLength;
                }

                i += 2;
                if (i > 6) {
                    i -= 7;
                }

                solfegePart = SOLFEGENAMES[i];
                break;
            case "locrian":
                i = SOLFEGENAMES.indexOf(solfegePart);
                if (i > 5) {
                    transpositionFloor += octaveLength;
                }

                i += 1;
                if (i > 6) {
                    i -= 7;
                }

                solfegePart = SOLFEGENAMES[i];
                break;
            case "major":
            case "ionian":
            default:
                break;
        }
    }

    let index;
    if (halfSteps.includes(solfegePart)) {
        index = halfSteps.indexOf(solfegePart) + offset;
        if (index >= thisScale.length) {
            index -= thisScale.length;
            octave += 1;
        } else if (index < 0) {
            index += thisScale.length;
            octave -= 1;
        }

        let note = thisScale[index];
        // In non-12 EDO temperaments, enharmonic spellings are distinct
        // pitches, so the resolved note must honor the input's accidental.
        if (octaveLength !== 12 && sharpFlat) {
            if (noteArg.slice(-1) === "#" || noteArg.slice(-1) === SHARP) {
                note = NOTESSHARP[index];
            } else {
                note = NOTESFLAT[index];
            }
        }

        if (octaveLength === 12 && note in EXTRATRANSPOSITIONS) {
            octave += EXTRATRANSPOSITIONS[note][1];
            note = EXTRATRANSPOSITIONS[note][0];
        }

        return [note, octave, transpositionFloor];
    }

    return null;
};

/**
 * Get the note based on various parameters.
 * @function
 * @param {string|number} noteArg - The note name or pitch number.
 * @param {number} octave - The octave value.
 * @param {number} transposition - The transposition value (semitones, or EDO steps if isAlreadyEdoSteps is true).
 * @param {string} keySignature - The key signature (default is "C major").
 * @param {boolean} movable - Whether the key signature is movable (default is false).
 * @param {string} direction - The direction of the note (unused parameter).
 * @param {string} errorMsg - The error message (unused parameter).
 * @param {string} [temperament="equal"] - The temperament to use (default is "equal").
 * @param {boolean} [isAlreadyEdoSteps=false] - If true, transposition is already in EDO steps; skip semitone-to-EDO conversion.
 * @param {boolean} [clampIndex=false] - If true, clamp pitch index to 0..edo-1 instead of wrapping across octaves.
 * @returns {Array} An array containing the note, octave, and cents
 */
function getNote(
    noteArg,
    octave,
    transposition,
    keySignature,
    movable,
    direction,
    errorMsg,
    temperament,
    isAlreadyEdoSteps,
    clampIndex
) {
    if (typeof noteArg === "number") {
        noteArg = noteArg.toString();
    }
    if (temperament === undefined) {
        temperament = "equal";
    }

    const octaveLength =
        TEMPERAMENT[temperament] && typeof TEMPERAMENT[temperament].pitchNumber === "number"
            ? TEMPERAMENT[temperament].pitchNumber
            : 12;

    let rememberFlat = false;
    let rememberSharp = false;
    let transpositionFloor = 0;
    let transpositionCents = 0;

    if (transposition === undefined) {
        transposition = 0;
    }

    // transposition = Math.round(transposition);
    if (transposition < 0) {
        transposition = -transposition;
        transpositionFloor = Math.floor(transposition);
        transpositionCents = transposition - transpositionFloor;
        transpositionFloor = -transpositionFloor;
        transpositionCents = -transpositionCents * 100;
        transposition = -transposition;
    } else {
        transpositionFloor = Math.floor(transposition);
        transpositionCents = (transposition - transpositionFloor) * 100;
    }

    // Scale transposition from semitones to EDO steps.
    // Use the original transposition value (not the already-floored transpositionFloor)
    // to preserve fractional precision during conversion.
    // Skip this conversion if transposition is already in EDO steps (non-equal temperaments).
    if (octaveLength !== 12 && !isAlreadyEdoSteps) {
        transpositionFloor = Math.round((transposition * octaveLength) / 12);
    }

    if (typeof noteArg !== "number") {
        // Could be mi#<sub>4</sub> (from matrix) or mi# (from note).
        if (noteArg.slice(-1) === ">") {
            // Read octave and solfege from HTML
            octave = parseInt(
                noteArg.slice(noteArg.indexOf(">") + 1, noteArg.indexOf("/") - 1),
                10
            );
            const noteEnd = noteArg.indexOf("<");
            noteArg = noteEnd === -1 ? "" : noteArg.slice(0, noteEnd);
        }
        if (
            noteArg.toLowerCase().slice(0, 4) === "rest" ||
            noteArg.toLowerCase().slice(0, 4) === "r"
        ) {
            return ["R", "", 0];
        }
        // Could be a number as a string (with or without an accidental.
        let noteAsNumber = noteArg;
        if (["#", SHARP, FLAT, "b"].includes(noteArg.slice(-1))) {
            noteAsNumber = noteArg.slice(0, noteArg.length - 1);
        }
        if (!isNaN(noteAsNumber)) {
            if (["#", SHARP].includes(noteArg.slice(-1))) {
                transpositionFloor += Math.round(octaveLength / 12);
            } else if (["b", FLAT].includes(noteArg.slice(-1))) {
                transpositionFloor -= Math.round(octaveLength / 12);
            }
            noteArg = Number(noteAsNumber);
        }
    }

    octave = Math.round(octave);

    if (typeof noteArg === "number") {
        // Assume it is a pitch number.
        if (!keySignature) {
            keySignature = "C major";
        }
        let kOffset = 0;
        if (movable) {
            kOffset = PITCHES.indexOf(keySignature.split(" ")[0]);
            if (kOffset === -1) {
                kOffset = PITCHES2.indexOf(keySignature.split(" ")[0]);
            }
            if (kOffset === -1) {
                kOffset = 0;

                console.log("Cannot find " + keySignature.split(" ")[0] + ". Reverting to C");
            }
        }
        if (octaveLength === 12) {
            if (getSharpFlatPreference(keySignature) === "sharp") {
                noteArg = PITCHES2[(noteArg + kOffset) % octaveLength];
            } else {
                noteArg = PITCHES[(noteArg + kOffset) % octaveLength];
            }
        } else {
            const edoNames = generateNoteNames(octaveLength);
            noteArg = edoNames[(noteArg + kOffset) % octaveLength];
        }
    }

    let note;
    let articulation;

    if (
        temperament in PreDefinedTemperaments ||
        (isCustomTemperament(temperament) && isEquallyTempered(temperament))
    ) {
        // Check for double flat or double sharp. Since bb and x behave
        // funny with string operations, we jump through some hoops.
        articulation = getArticulation(noteArg);
        noteArg = noteArg.replace(articulation, "");

        switch (articulation) {
            case "bb":
            case "♭♭":
            case DOUBLEFLAT:
                noteArg += "b";
                rememberFlat = true;
                transpositionFloor -= 1;
                break;
            case "b":
            case FLAT:
                noteArg += "b";
                rememberFlat = true;
                break;
            case "##":
            case "♯♯":
            case "*":
            case "x":
            case DOUBLESHARP:
                noteArg += "#";
                rememberSharp = true;
                transpositionFloor += 1;
                break;
            case "#":
            case SHARP:
                noteArg += "#";
                rememberSharp = true;
                break;
            case "b#":
            case "#b":
            case FLAT + SHARP:
            case SHARP + FLAT:
            default:
                noteArg += articulation;
                break;
        }

        // Already a note? No need to convert from solfege.
        if (rememberSharp) {
            if (noteArg in STOSHARP) {
                noteArg = STOSHARP[noteArg];
            }
        } else if (noteArg in BTOFLAT) {
            noteArg = BTOFLAT[noteArg];
        } else if (noteArg in STOSHARP) {
            noteArg = STOSHARP[noteArg];
        }

        if (octaveLength !== 12) {
            // For microtonal EDOs, check the EDO-specific name table first.
            // This ensures EDO-native entries (e.g. B♯ in 19-EDO at position 18)
            // are resolved without going through 12-EDO EXTRATRANSPOSITIONS, which
            // would prematurely convert them to enharmonic equivalents and corrupt
            // the octave calculation.
            const edoNames = generateNoteNames(octaveLength);
            const normalizedName = noteArg.replaceAll("#", SHARP).replaceAll("b", FLAT);
            const edoIdx = edoNames.indexOf(normalizedName);
            if (edoIdx !== -1) {
                note = edoNames[edoIdx];
            } else if (noteArg in EXTRATRANSPOSITIONS) {
                octave += EXTRATRANSPOSITIONS[noteArg][1];
                note = EXTRATRANSPOSITIONS[noteArg][0];
            } else if (NOTESSHARP.includes(noteArg.toUpperCase())) {
                note = noteArg.toUpperCase();
            } else if (NOTESFLAT.includes(noteArg)) {
                note = noteArg;
            } else if (NOTESFLAT2.includes(noteArg)) {
                note = NOTESFLAT[NOTESFLAT2.indexOf(noteArg)];
            } else {
                // Fall back to solfege resolution so microtonal EDOs accept
                // solfege names (e.g. "do", "re♯") just like 12-EDO does.
                const solfegeNote = getNoteFromSolfege(
                    noteArg,
                    keySignature,
                    movable,
                    octaveLength,
                    octave,
                    transpositionFloor
                );
                if (solfegeNote !== null && edoNames.includes(solfegeNote[0])) {
                    note = solfegeNote[0];
                    octave = solfegeNote[1];
                    transpositionFloor = solfegeNote[2];
                } else if (errorMsg !== undefined) {
                    console.debug(
                        "WARNING: EDO note [" +
                            noteArg +
                            "] (normalized: " +
                            normalizedName +
                            ") not found in generateNoteNames(" +
                            octaveLength +
                            ")"
                    );
                    errorMsg(INVALIDPITCH, null);
                    return ["R", "", 0];
                } else {
                    return ["R", "", 0];
                }
            }
        } else if (noteArg in EXTRATRANSPOSITIONS) {
            octave += EXTRATRANSPOSITIONS[noteArg][1];
            note = EXTRATRANSPOSITIONS[noteArg][0];
        } else if (NOTESSHARP.includes(noteArg.toUpperCase())) {
            note = noteArg.toUpperCase();
        } else if (NOTESFLAT.includes(noteArg)) {
            note = noteArg;
        } else if (NOTESFLAT2.includes(noteArg)) {
            // Convert to uppercase, e.g., d♭ -> D♭.
            note = NOTESFLAT[NOTESFLAT2.indexOf(noteArg)];
        } else {
            const solfegeNote = getNoteFromSolfege(
                noteArg,
                keySignature,
                movable,
                octaveLength,
                octave,
                transpositionFloor
            );
            if (solfegeNote === null) {
                console.debug(
                    "WARNING: Note [" + noteArg + "] not found in the scale. Returning REST"
                );
                if (errorMsg !== undefined) {
                    errorMsg(INVALIDPITCH, null);
                }

                return ["R", "", 0];
            }

            note = solfegeNote[0];
            octave = solfegeNote[1];
            transpositionFloor = solfegeNote[2];
        }

        if (transpositionFloor && transpositionFloor !== 0) {
            let deltaOctave, deltaNote;
            if (transpositionFloor < 0) {
                deltaOctave = -Math.floor(-transpositionFloor / octaveLength);
                deltaNote = -(-transpositionFloor % octaveLength);
            } else {
                deltaOctave = Math.floor(transpositionFloor / octaveLength);
                deltaNote = transpositionFloor % octaveLength;
            }

            octave += deltaOctave;

            if (deltaNote !== 0) {
                const foundIdx = getEdoNoteNamePosition(note, octaveLength);
                if (foundIdx !== -1) {
                    let i = foundIdx + deltaNote;
                    const nameTableLength = generateNoteNames(octaveLength).length;
                    if (clampIndex) {
                        // Clamp to valid range instead of wrapping across octaves.
                        if (i < 0 || i >= nameTableLength) {
                            i = Math.max(0, Math.min(i, nameTableLength - 1));
                        }
                    } else {
                        if (i < 0) {
                            i += nameTableLength;
                            octave -= 1;
                        } else if (i >= nameTableLength) {
                            i -= nameTableLength;
                            octave += 1;
                        }
                    }
                    note = generateNoteNames(octaveLength)[i];
                } else {
                    console.debug("note not found in EDO table? " + note);
                }
            }
        }

        // Try to find a note in the current keySignature
        // When converting through EQUIVALENTNATURALS, B↔C crosses an SPN
        // octave boundary (B♯4 = C5, C♭4 = B3). Adjust the octave so the
        // note letter's SPN position matches the actual pitch register.
        switch (getSharpFlatPreference(keySignature)) {
            case "flat":
                if (octaveLength === 12 && note in EQUIVALENTFLATS) {
                    note = EQUIVALENTFLATS[note];
                }
                break;
            case "sharp":
                if (octaveLength === 12 && note in EQUIVALENTSHARPS) {
                    note = EQUIVALENTSHARPS[note];
                }
                break;
            case "natural":
                if (octaveLength === 12 && note in EQUIVALENTNATURALS) {
                    const origLetter = note.charAt(0);
                    note = EQUIVALENTNATURALS[note];
                    const newLetter = note.charAt(0);
                    if (origLetter === "B" && newLetter === "C") {
                        octave += 1;
                    } else if (origLetter === "C" && newLetter === "B") {
                        octave -= 1;
                    }
                }
                break;
            default:
                break;
        }

        // Consider the note direction (in the case of intervals)
        if (direction !== undefined) {
            switch (direction) {
                case -1:
                    if (octaveLength === 12 && note in EQUIVALENTFLATS) {
                        note = EQUIVALENTFLATS[note];
                    }
                    break;
                case 1:
                    if (octaveLength === 12 && note in EQUIVALENTSHARPS) {
                        note = EQUIVALENTSHARPS[note];
                    }
                    break;
                default:
                    break;
            }
        }

        // Preserve input accidental style only when no transposition was applied.
        // When transpositionFloor is non-zero, EQUIVALENTSHARPS/EQUIVALENTFLATS could
        // undo the pitch change (e.g. E♭→D♯ changes the actual pitch in microtonal
        // temperaments where they are not enharmonically equivalent).
        if (transpositionFloor === 0) {
            if (rememberSharp) {
                if (octaveLength === 12 && note in EQUIVALENTSHARPS) {
                    note = EQUIVALENTSHARPS[note];
                }
            } else if (rememberFlat) {
                if (octaveLength === 12 && note in EQUIVALENTFLATS) {
                    note = EQUIVALENTFLATS[note];
                }
            }
        }
    } else if (isCustomTemperament(temperament)) {
        note = getCustomNote(noteArg);
        let pitchNumber = null;
        // Ensure the temperament exists before accessing it
        if (TEMPERAMENT[temperament]) {
            for (const number in TEMPERAMENT[temperament]) {
                if (number !== "pitchNumber" && number !== "interval") {
                    if (note === TEMPERAMENT[temperament][number][3]) {
                        if (typeof number === "string") {
                            pitchNumber = Number(number);
                        } else {
                            pitchNumber = number;
                        }
                        break;
                    } else if (note === TEMPERAMENT[temperament][number][1]) {
                        if (typeof number === "string") {
                            pitchNumber = Number(number);
                        } else {
                            pitchNumber = number;
                        }
                        break;
                    }
                }
            }
        }

        if (pitchNumber === null || pitchNumber === "null") {
            return getNote(
                noteArg,
                octave,
                transpositionFloor,
                keySignature,
                movable,
                direction,
                errorMsg
                // No temperament arg is passed so the note will not
                // be processed as a custom temperament.
            );
        }

        let inOctave = octave;
        // octaveLength already defined at top of function
        let deltaOctave, deltaNote;
        if (transpositionFloor !== 0) {
            if (transpositionFloor < 0) {
                deltaOctave = -Math.floor(-transpositionFloor / octaveLength);
                deltaNote = -(-transpositionFloor % octaveLength);
            } else {
                deltaOctave = Math.floor(transpositionFloor / octaveLength);
                deltaNote = transpositionFloor % octaveLength;
            }

            inOctave += deltaOctave;
            pitchNumber += deltaNote;
        }

        if (pitchNumber < 0) {
            pitchNumber = pitchNumber + octaveLength;
            inOctave = inOctave - 1;
        } else if (pitchNumber >= octaveLength) {
            pitchNumber = pitchNumber - octaveLength;
            inOctave = inOctave + 1;
        }
        pitchNumber = pitchNumber + "";
        if (TEMPERAMENT[temperament][pitchNumber].length > 3) {
            note = TEMPERAMENT[temperament][pitchNumber][3];
        } else {
            note = TEMPERAMENT[temperament][pitchNumber][1];
        }
        octave = inOctave;
    } else {
        // Return E# as E#, Fb as Fb etc. for different temperament systems.
        articulation = getArticulation(noteArg);
        noteArg = noteArg.replace(articulation, "");

        if (SOLFEGENAMES.includes(noteArg)) {
            noteArg = FIXEDSOLFEGE[noteArg];
        }

        switch (articulation) {
            case "bb":
            case DOUBLEFLAT:
                noteArg += "𝄫";
                break;
            case "b":
            case FLAT:
                noteArg += "b";
                break;
            case "##":
            case "*":
            case "x":
            case DOUBLESHARP:
                noteArg += "𝄪";
                break;
            case "#":
            case SHARP:
                noteArg += "#";
                break;
            case "b#":
            case "#b":
            case FLAT + SHARP:
            case SHARP + FLAT:
            default:
                noteArg += articulation;
                break;
        }

        note = noteArg;

        let deltaOctave, deltaNote;
        if (transpositionFloor && transpositionFloor !== 0) {
            if (transpositionFloor < 0) {
                deltaOctave = -Math.floor(-transpositionFloor / octaveLength);
                deltaNote = -(-transpositionFloor % octaveLength);
            } else {
                deltaOctave = Math.floor(transpositionFloor / octaveLength);
                deltaNote = transpositionFloor % octaveLength;
            }

            octave += deltaOctave;

            let pitch, note1, octave1;
            if (deltaNote > 0) {
                pitch = note + "" + octave;
                for (const interval in INTERVALVALUES) {
                    if (deltaNote === INTERVALVALUES[interval][0]) {
                        note1 = getNoteFromInterval(pitch, interval);
                        break;
                    }
                }
            } else if (deltaNote < 0) {
                octave1 = octave - 1;
                pitch = note + "" + octave1;
                for (const interval in INTERVALVALUES) {
                    if (octaveLength + deltaNote === INTERVALVALUES[interval][0]) {
                        note1 = getNoteFromInterval(pitch, interval);
                        break;
                    }
                }
            } else if (deltaNote === 0) {
                pitch = note + "" + octave;
                note1 = getNoteFromInterval(pitch, "perfect 1");
            }
            note = note1[0];
            octave = note1[1];
        }
    }

    if (octave < 1) {
        return [note, 1, transpositionCents];
    } else if (octave > 10) {
        return [note, 10, transpositionCents];
    } else {
        return [note, octave, transpositionCents];
    }
}

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
 * Convert a step pattern from its native EDO to steps in the given EDO.
 *
 * Uses cumulative positions (not per-interval rounding) so the total interval
 * sum is preserved as closely as possible. Each step is at least 1 so stepping
 * never gets stuck on a repeated note. When the pattern's steps already sum to
 * the requested EDO this is the identity.
 * @function
 * @param {Array} pattern - The source step pattern (e.g. major [2, 2, 1, 2, 2, 2, 1]).
 * @param {number} edo - Number of steps per octave.
 * @returns {Array} The converted step pattern in the target EDO.
 */
const scalePatternToEDO = (pattern, edo) => {
    const srcSum = pattern.reduce((a, b) => a + b, 0);
    if (srcSum === edo) {
        return pattern.slice();
    }
    const result = [];
    let cumSrc = 0;
    let cumDst = 0;
    for (let i = 0; i < pattern.length; i++) {
        cumSrc += pattern[i];
        const newCumPos = Math.round((cumSrc * edo) / srcSum);
        let step = newCumPos - cumDst;
        // When EDO < scale degrees (e.g. 5-EDO major), cumulative rounding
        // can produce 0-length intervals. Ensure minimum step of 1 so that
        // stepping never gets stuck on a repeated note.
        if (step < 1) {
            step = 1;
        }
        result.push(step);
        cumDst += step;
    }
    return result;
};

/**
 * Optional per-EDO overrides for the standard 12-EDO mode patterns.
 *
 * Keyed by edo, then by mode name. When an override exists it takes priority
 * over the naive scalePatternToEDO conversion of MUSICALMODES.
 * @constant
 * @type {Object}
 */
const PITCH_COLLECTIONS_EDO_OVERRIDES = {};

/**
 * Get the step pattern for a mode in the given EDO (or temperament).
 *
 * Lookup order: PITCH_COLLECTIONS_EDO_OVERRIDES[edo][mode] first, then the
 * scalePatternToEDO conversion of MUSICALMODES[mode]. For the "custom"
 * (chromatic) mode, 12-EDO uses the stored customMode pattern and non-12 EDO
 * returns a full EDO-length step-1 pattern.
 *
 * When `temperament` is a non-EDO temperament (JI, meantone, Pythagorean), the
 * EDO step model does not apply, so the returned array is a list of per-step
 * CENTS (the actual interval size between consecutive scale degrees derived
 * from the temperament's ratios). Consumers that render proportional slices or
 * compute active tabs should use these cents directly.
 * @function
 * @param {string} mode - The mode name (e.g. "major").
 * @param {number} edo - Number of steps per octave.
 * @returns {Array} Integer step pattern.
 */
const getModePattern = (mode, edo = 12) => {
    const overrides = PITCH_COLLECTIONS_EDO_OVERRIDES[edo];
    if (overrides && Object.prototype.hasOwnProperty.call(overrides, mode)) {
        return overrides[mode].slice();
    }
    if (mode.toLowerCase() === "custom") {
        if (edo === 12) {
            return customMode.slice();
        }
        return new Array(edo).fill(1);
    }
    if (mode in MUSICALMODES) {
        return scalePatternToEDO(MUSICALMODES[mode], edo);
    }
    return scalePatternToEDO(MUSICALMODES.major, edo);
};

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
                        } else if (semitones[i] + chosenModeScale[i] !== 7) {
                            definedScaleDegree.push(5);
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
            let k = 0;
            for (let i = 0; i < 7; i++) {
                if (definedScaleDegree.includes(i + 1)) {
                    finalScale.push(chosenModeScale[k]);
                    k++;
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
 * Get the reduced fraction representation of a fraction.
 * @function
 * @param {number} a - The numerator.
 * @param {number} b - The denominator.
 * @returns {string} The reduced fraction as a string.
 */
const reducedFraction = (a, b) => {
    const greatestCommonMultiple = (a, b) => {
        return b === 0 ? a : greatestCommonMultiple(b, a % b);
    };

    const gcm = greatestCommonMultiple(a, b);

    if ([1, 2, 4, 8, 16].includes(b / gcm)) {
        return a / gcm + "<br>&mdash;<br>" + b / gcm + "<br>" + NSYMBOLS[b / gcm];
    } else {
        return a / gcm + "<br>&mdash;<br>" + b / gcm + "<br><br>";
    }
};

/**
 * Convert a floating-point number to its approximate fractional representation.
 * @function
 * @param {number} d - The floating-point number.
 * @returns {Array} An array containing the numerator and denominator of the fraction.
 */
const toFraction = d => {
    // Convert float to its approximate fractional representation.
    let flip = false;
    if (d > 1) {
        flip = true;
        d = 1 / d;
    }

    let df = 1.0;
    let top = 1;
    let bot = 1;

    let iterGuard = 0;
    while (Math.abs(df - d) > 0.00000001) {
        if (iterGuard++ > 10000) {
            break;
        }
        if (df < d) {
            top += 1;
        } else {
            bot += 1;
            top = parseInt(d * bot, 10);
        }
        df = top / bot;
    }

    if (flip) {
        const tmp = top;
        top = bot;
        bot = tmp;
    }

    return [top, bot];
};

/**
 * Calculate the note value to display based on numerator and denominator.
 * @function
 * @param {number} a - The numerator.
 * @param {number} b - The denominator.
 * @returns {string} The note value to display.
 */
const calcNoteValueToDisplay = (a, b) => {
    const noteValue = a / b;
    let noteValueToDisplay = null;

    if (noteValue in NSYMBOLS) {
        noteValueToDisplay =
            "1<br>&mdash;<br>" + noteValue.toString() + "<br>" + NSYMBOLS[noteValue];
    } else {
        noteValueToDisplay = reducedFraction(b, a);
    }

    let value;
    let obj;
    let d0, d1;
    if (parseInt(noteValue, 10) < noteValue) {
        noteValueToDisplay = parseInt(noteValue * 1.5, 10);
        if (noteValueToDisplay in NSYMBOLS) {
            value = b / a; // * noteValueToDisplay;
            obj = toFraction(value);
            Number.isInteger(obj[0]) ? (d0 = 0) : (d0 = 2);
            Number.isInteger(obj[1]) ? (d1 = 0) : (d1 = 2);
            noteValueToDisplay =
                // value.toFixed(2) +
                obj[0].toFixed(d0) +
                "<br>&mdash;<br>" +
                // noteValueToDisplay.toString() +
                obj[1].toFixed(d1) +
                "<br>" +
                NSYMBOLS[noteValueToDisplay] +
                ".";
        } else {
            noteValueToDisplay = parseInt(noteValue * 1.75, 10);
            if (noteValueToDisplay in NSYMBOLS) {
                value = b / a; // * noteValueToDisplay;
                obj = toFraction(value);
                Number.isInteger(obj[0]) ? (d0 = 0) : (d0 = 2);
                Number.isInteger(obj[1]) ? (d1 = 0) : (d1 = 2);
                noteValueToDisplay =
                    // value.toFixed(2) +
                    obj[0].toFixed(d0) +
                    "<br>&mdash;<br>" +
                    // noteValueToDisplay.toString() +
                    obj[1].toFixed(d1) +
                    "<br>" +
                    NSYMBOLS[noteValueToDisplay] +
                    "..";
            } else {
                noteValueToDisplay = reducedFraction(b, a);
            }
        }
    }

    return noteValueToDisplay;
};

/**
 * Convert a duration value to its note value representation.
 * @function
 * @param {number} duration - The duration value.
 * @returns {Array} An array containing the note value, number of dots, and tuplet factor.
 */
const durationToNoteValue = duration => {
    // returns [note value, no. of dots, tuplet factor]

    let currentDotFactor;
    let d;
    // Try to find a match or a dotted match.
    for (let dotCount = 0; dotCount < 3; dotCount++) {
        currentDotFactor = 2 - 1 / Math.pow(2, dotCount);
        d = duration * currentDotFactor;
        if (POWER2.includes(d)) {
            return [d, dotCount, null];
        }
    }

    // First, round down.
    let roundDown = duration;
    for (let i = 1; i < POWER2.length; i++) {
        // Rounding down
        if (roundDown < POWER2[i]) {
            roundDown = POWER2[i - 1];
            break;
        }
    }

    if (!POWER2.includes(roundDown)) {
        roundDown = 128;
    }

    // Convert duration into parts based on POW2 factors
    // e.g., 1 / 6 ==> [3, 2], 1 / 12 ==> [3, 4]
    let j = 1;
    while (Math.floor(duration / j) * j === duration) {
        j = j * 2;
        if (j > duration / 2) {
            break;
        }
    }

    j = j / 2;

    return [1, 0, [duration / j, j], roundDown];
};

/**
 * Parse a note string into note name and octave.
 * This function correctly handles multi-digit octaves by using regex.
 * @function
 * @param {string} note - The note string (e.g., "C4", "C#10", "Db-1").
 * @returns {Array} An array containing [noteName, octave].
 */
const parseNoteString = note => {
    // Regex to match note name and octave (one or more digits, optional negative sign)
    // Matches valid note prefixes (Western, Solfege, Carnatic) and optional accidentals followed by octave
    const match = note.match(
        /^((?:[a-g]|do|re|mi|fa|sol|la|ti|si|ut|sa|ga|ma|pa|dha|ni)(?:[#b♯♭𝄪𝄫x♮]*))(-?\d+)$/iu
    );
    if (match) {
        return [match[1], Number(match[2])];
    }
    // Fallback to original behavior if regex doesn't match (for edge cases)
    const len = note.length;
    const lastChar = note.charAt(len - 1);
    const octave = lastChar && !isNaN(lastChar) ? Number(lastChar) : NaN;
    return [note.substring(0, len - 1), octave];
};

/**
 * Convert a note string to pitch and octave.
 * @function
 * @param {string} note - The note string.
 * @returns {Array} An array containing pitch and octave.
 */
const noteToPitchOctave = note => {
    return parseNoteString(note);
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
 * Check if a note string is in solfege.
 * @function
 * @param {string} note - The note string.
 * @returns {boolean} True if the note is in solfege, false otherwise.
 */
const noteIsSolfege = note => {
    if (SOLFEGECONVERSIONTABLE[note] !== undefined) {
        return false;
    }
    // Check normalized version (ASCII to Unicode)
    const altNote = note.replace("#", SHARP).replace("b", FLAT);
    if (SOLFEGECONVERSIONTABLE[altNote] !== undefined) {
        return false;
    }
    return true;
};

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

        const isMinor = Array.isArray(keySignature)
            ? keySignature[1].toLowerCase() === "minor"
            : keySignature.toLowerCase().includes("minor");

        // diatonic note
        if (index !== -1 && index < SOLFEGENAMES.length) {
            let solfegeIndex = index;

            // minor movable-do → la-based
            if (isMinor) {
                solfegeIndex = (index + 5) % 7;
            }

            return SOLFEGENAMES[solfegeIndex].toLowerCase();
        }

        // 3) chromatic fallback (interval based)
        const tonic = scale[0];
        const tonicPitch = pitchToNumber(tonic, 4, keySignature, temperament);
        const notePitch = pitchToNumber(note, 4, keySignature, temperament);

        // semitones from tonic (EDO-aware)
        let semitones = (((notePitch - tonicPitch) % currentEDO) + currentEDO) % currentEDO;

        if (isMinor) {
            // For minor, relative major is 3 semitones up in 12-EDO terms.
            // Map to the current EDO and compute la-based offset.
            const relativeMajorSteps = Math.round((3 * currentEDO) / 12);
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
 * Split a solfege value into pitch and attributes.
 * @function
 * @param {string} value - The solfege value.
 * @returns {Array} An array containing pitch and attributes.
 */
const splitSolfege = value => {
    // Separate the pitch from any attributes, e.g., # or b
    if (value !== null && typeof value === "string") {
        let note, attr;
        if (SOLFNOTES.includes(value)) {
            note = value;
            attr = "";
        } else if (value.slice(0, 3) === "sol") {
            note = "sol";
            if (value.length === 4) {
                attr = value[3];
            } else {
                attr = value[3] + value[4];
            }
        } else {
            note = value.slice(0, 2);
            if (value.length === 3) {
                attr = value[2];
            } else {
                attr = value[2] + value[3];
            }
        }

        return [note, attr];
    }

    return ["sol", ""];
};

const getI18nSolfNotes = () => {
    //.TRANS: the note names must be separated by single spaces
    const solfnotes = _("ti la sol fa mi re do");
    if (typeof solfnotes !== "string") {
        return SOLFNOTES;
    }

    const translated = solfnotes.trim().split(/\s+/);
    if (translated.length !== SOLFNOTES.length || translated.some(note => note.length === 0)) {
        return SOLFNOTES;
    }

    return translated;
};

const splitI18nSolfege = value => {
    if (value !== null && typeof value === "string") {
        const solfnotes = getI18nSolfNotes();
        const lowerValue = value.toLowerCase();
        const matches = solfnotes
            .map((note, i) => ({ note, i }))
            .sort((a, b) => b.note.length - a.note.length);

        for (const match of matches) {
            const lowerNote = match.note.toLowerCase();
            if (lowerValue === lowerNote || lowerValue.startsWith(lowerNote)) {
                return [SOLFNOTES[match.i], value.slice(match.note.length)];
            }
        }
    }

    return splitSolfege(value);
};

/**
 * Internationalize a solfege note using i18n.
 * @function
 * @param {string} note - The solfege note.
 * @returns {string} The internationalized solfege note.
 */
const i18nSolfege = note => {
    // solfnotes_ is used in the interface for i18n
    const solfnotes_ = getI18nSolfNotes();
    const sourceObj = splitSolfege(note);
    const obj = splitI18nSolfege(note);

    if (!SOLFNOTES.includes(sourceObj[0]) && SOLFNOTES.includes(obj[0])) {
        return obj[0] + obj[1];
    }

    const i = SOLFNOTES.indexOf(obj[0]);
    if (i !== -1) {
        return solfnotes_[i] + obj[1];
    } else {
        // Check if the note is in a different language.
        const i = Object.values(solfnotes_).indexOf(obj[0]);
        if (i !== -1) {
            return SOLFNOTES[i] + obj[1];
        }
    }
    // Wasn't solfege so it doesn't need translation.
    return note;
};

/**
 * Split a scale degree value into note and attributes.
 * @function
 * @param {string} value - The scale degree value.
 * @returns {Array} An array containing note and attributes.
 */
const splitScaleDegree = value => {
    if (!value) {
        return [5, NATURAL];
    }

    const note = value.slice(0, 1);
    const attr = value.slice(1);
    return [note, attr];
};

/**
 * Convert a number to a note with octave.
 * @function
 * @param {number} value - The number representing the note.
 * @param {number} delta - The delta to adjust the value.
 * @returns {Array} An array containing the note and octave.
 */
const getNumNote = (value, delta, temperament) => {
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
const calcOctave = (currentOctave, arg, lastNotePlayed, currentNote, temperament) => {
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
const calcOctaveInterval = arg => {
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

/**
 * Check if a value is an integer.
 * @function
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is an integer, false otherwise.
 */
const isInt = value => {
    return !isNaN(parseFloat(value)) && Number.isInteger(Number(value));
};

/**
 * Convert a solfege note to a common letter class.
 * @function
 * @param {string} note - The solfege note.
 * @returns {string} The converted note.
 */
const convertFromSolfege = note => {
    if (typeof note === "string") {
        const unicodeNote = note.replace("#", SHARP).replace("b", FLAT);
        if (unicodeNote in FIXEDSOLFEGE1) {
            note = FIXEDSOLFEGE1[unicodeNote];
        }
    }
    // Convert to common letter class
    if (note in FIXEDSOLFEGE1) {
        note = FIXEDSOLFEGE1[note];
    }
    if (note in EQUIVALENTNATURALS) {
        note = EQUIVALENTNATURALS[note];
    }
    return note;
};

/**
 * Convert a duration factor to a string representation.
 * @function
 * @param {number} factor - The duration factor to convert.
 * @returns {string|null} The string representation of the duration factor.
 */
const convertFactor = factor => {
    switch (factor) {
        case 0.0625: // 1/16
            return "16";
        case 0.125: // 1/8
            return "8";
        case 0.09375: // 3/32
            return "16.";
        case 0.1875: // 3/16
            return "8.";
        case 0.21875: // 7/32
            return "8..";
        case 0.25: // 1/4
            return "4";
        case 0.3125: // 5/16
            return "4 16";
        case 0.375: // 3/8
            return "4.";
        case 0.4375: // 7/16
            return "4..";
        case 0.5: // 1/2
            return "2";
        case 0.5625: // 9/16
            return "2 16";
        case 0.625: // 5/8
            return "2 8";
        case 0.6875: // 11/16
            return "2 8 16";
        case 0.75: // 3/4
            return "2.";
        case 0.8125: // 13/16
            return "2 4 16";
        case 0.875: // 7/8
            return "2..";
        case 0.9375: // 15/16
            return "2 4 8 16";
        case 1: // 1/1
            return "1";
        default:
            return null;
    }
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
