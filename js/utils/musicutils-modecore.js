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
   exported

   _b64Cache, wholeNoteImg, halfNoteImg, quarterNoteImg, eighthNoteImg,
   sixteenthNoteImg, thirtysecondNoteImg, sixtyfourthNoteImg, CHORDVALUES,
   setCustomChord, MUSICALMODES, customMode, getModeNumbers,
   getNonEDOModeSteps, getArticulation, modeMapper, getCustomNote,
   GetNotesForInterval, base64Encode, MOVABLE_TONIC_DEGREE, scalePatternToEDO,
   PITCH_COLLECTIONS_EDO_OVERRIDES, getModePattern, MusicUtilsModeCore
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

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
        DOUBLEFLAT,
        DOUBLESHARP,
        PITCH_COLLECTIONS,
        PITCH_COLLECTION_ALIASES
    } = MusicUtilsConstants;
    var MusicUtilsTemperament =
        (typeof window !== "undefined" && window.MusicUtilsTemperament) ||
        (typeof require !== "undefined" ? require("./musicutils-temperament") : {});
    var { getTemperament } = MusicUtilsTemperament;
    var MusicUtilsPitch =
        (typeof window !== "undefined" && window.MusicUtilsPitch) ||
        (typeof require !== "undefined" ? require("./musicutils-pitch") : {});
    var { stripMicrotonalPrefix, normalizeNoteAccidentals } = MusicUtilsPitch;
    var UtilsLogic =
        (typeof window !== "undefined" && window.UtilsLogic) ||
        (typeof require !== "undefined" ? require("./utils-logic") : {});
    var { last } = UtilsLogic;
}

var _b64Cache = new Map();

/**
 * Image URL for a whole note.
 * @constant {string}
 */
var wholeNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(WHOLENOTE));

var halfNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(HALFNOTE));

var quarterNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(QUARTERNOTE));

var eighthNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(EIGHTHNOTE));

var sixteenthNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(SIXTEENTHNOTE));

var thirtysecondNoteImg =
    "data:image/svg+xml;base64," + window.btoa(base64Encode(THIRTYSECONDNOTE));

var sixtyfourthNoteImg = "data:image/svg+xml;base64," + window.btoa(base64Encode(SIXTYFOURTHNOTE));

/**
 * Numeric values representing the intervals in different chords.
 * @constant {Array<Array<Array<number>>>}
 */
var CHORDVALUES = [
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
var setCustomChord = chord => {
    CHORDVALUES[CHORDVALUES.length - 1] = chord;
};

var MUSICALMODES = {};

// The table contains the intervals that define the modes.
// All of these modes assume 12 semitones per octave.
// See http://www.pianoscales.org <== this is in no way definitive

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
 * Custom mode from the musical modes dictionary.
 * @constant {Object}
 */
var customMode = MUSICALMODES["custom"];

/**
 * Get the mode numbers for a specific mode name.
 * @function
 * @param {string} name - The name of the mode.
 * @returns {string} The mode numbers.
 */
var getModeNumbers = name => {
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
var getNonEDOModeSteps = (mode, temperament) => {
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
var getArticulation = note => {
    const stripped = stripMicrotonalPrefix(note);
    const match = stripped.match(/^(?:sol|do|re|mi|fa|la|ti|[A-G])(.*)/);
    return match ? match[1] : stripped;
};

/**
 * Map common modes into their major/minor equivalent.
 * @function
 * @param {string} key - The key of the mode.
 * @param {string} mode - The mode to map.
 * @returns {Array} An array containing the mapped key and mode.
 */
var modeMapper = (key, mode) => {
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
 * Get the custom note representation for a given note in a custom temperament.
 * @function
 * @param {string|Array} note - The note or an array representing the note and its attributes.
 * @returns {string} The custom note representation.
 */
var getCustomNote = note => {
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

var GetNotesForInterval = tur => {
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

// Movable-do syllable of the tonic (0 = do) for modes that rotate solfege.
// Shared by getNoteFromSolfege (input) and getSolfege (display).
var MOVABLE_TONIC_DEGREE = {
    dorian: 1,
    phrygian: 2,
    lydian: 3,
    mixolydian: 4,
    minor: 5,
    aeolian: 5,
    locrian: 6
};

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
var scalePatternToEDO = (pattern, edo) => {
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
var PITCH_COLLECTIONS_EDO_OVERRIDES = {};

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
var getModePattern = (mode, edo = 12) => {
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

var MusicUtilsModeCore = {
    _b64Cache,
    wholeNoteImg,
    halfNoteImg,
    quarterNoteImg,
    eighthNoteImg,
    sixteenthNoteImg,
    thirtysecondNoteImg,
    sixtyfourthNoteImg,
    CHORDVALUES,
    setCustomChord,
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
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsModeCore;
}

if (typeof window !== "undefined") {
    window.MusicUtilsModeCore = MusicUtilsModeCore;
}
