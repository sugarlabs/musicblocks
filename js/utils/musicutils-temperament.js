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

   _, isUnsafeObjectKey
 */

/*
   exported

   getCurrentEDO, EDO_NOTE_NAMES, SHARP_NAMES, generateNoteNames,
   getEdoNoteNamePosition, octaveRatio, INITIALTEMPERAMENTS, TEMPERAMENTS,
   PreDefinedTemperaments, INTERVAL_CENTS, INTERVAL_ORDER, TEMPERAMENT,
   setOctaveRatio, getOctaveRatio, ratioToWheelAngle, getTemperamentsList,
   getTemperament, getTemperamentKeys, addTemperamentToList,
   deleteTemperamentFromList, addTemperamentToDictionary, updateTemperaments,
   isCustomTemperament, temperamentHasRatios, isTrueEDO, isEquallyTempered,
   isNonEDO, getTemperamentRatio, getTemperamentCents, getTemperamentName,
   MusicUtilsTemperament
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var {
        SHARP,
        FLAT,
        DOUBLESHARP,
        DOUBLEFLAT,
        EQUIVALENTSHARPS,
        EQUIVALENTFLATS,
        PITCHES2,
        PITCHES,
        DEFAULTTEMPERAMENT
    } = MusicUtilsConstants;
}

/**
 * Returns the number of pitches in the given temperament's octave.
 * Falls back to 12-EDO if temperament is not found.
 * @param {string} temperament - temperament key (e.g., "equal", "equal19")
 * @returns {number} number of pitches per octave
 */
var getCurrentEDO = temperament => {
    if (!temperament) return 12;
    const t = getTemperament(temperament);
    return t && t.pitchNumber ? t.pitchNumber : 12;
};

var EDO_NOTE_NAMES = {};

var SHARP_NAMES = [
    "C",
    "C" + SHARP,
    "D",
    "D" + SHARP,
    "E",
    "F",
    "F" + SHARP,
    "G",
    "G" + SHARP,
    "A",
    "A" + SHARP,
    "B"
];

/**
 * Generates a note name table for any EDO.
 *
 * Examples:
 *   generateNoteNames(5)  → ["C", "D", "E", "G", "A"]
 *   generateNoteNames(7)  → ["C", "D", "E", "F", "G", "A", "B"]
 *   generateNoteNames(12) → ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"]
 *   generateNoteNames(19) → ["C", "C♯", "D♭", "D", "D♯", "E♭", "E", "E♯", "F", "F♯", "G♭", "G", "G♯", "A♭", "A", "A♯", "B♭", "B", "B♯"]
 *
 * For 12-EDO: returns the standard 12-tone chromatic names.
 * For small EDOs (5, 7): returns the subset of natural letters without accidentals.
 * For EDO > 12: interleaves sharp and flat accidentals between naturals.
 * Results are cached in EDO_NOTE_NAMES.
 * @param {number} edo - number of steps per octave
 * @returns {string[]} array of note names, length = edo
 */
function generateNoteNames(edo) {
    if (EDO_NOTE_NAMES[edo]) {
        return EDO_NOTE_NAMES[edo];
    }

    const naturals = ["C", "D", "E", "F", "G", "A", "B"];
    const naturalPos12 = [0, 2, 4, 5, 7, 9, 11];

    if (edo === 12) {
        EDO_NOTE_NAMES[edo] = SHARP_NAMES;
        return SHARP_NAMES;
    }

    if (edo === 7) {
        EDO_NOTE_NAMES[edo] = naturals;
        return naturals;
    }

    if (edo === 5) {
        const pentatonic = ["C", "D", "E", "G", "A"];
        EDO_NOTE_NAMES[edo] = pentatonic;
        return pentatonic;
    }

    // Compute ideal step counts for each of the 7 intervals, rounding down.
    // Distribute remaining steps to intervals with the largest fractional part.
    const intervals = [];
    let totalFloor = 0;
    for (let n = 0; n < 7; n++) {
        const posDiff = (naturalPos12[(n + 1) % 7] - naturalPos12[n] + 12) % 12;
        const ideal = (edo * posDiff) / 12;
        const floored = Math.floor(ideal);
        intervals.push({ index: n, frac: ideal - floored, steps: floored });
        totalFloor += floored;
    }

    let remaining = edo - totalFloor;
    intervals.sort((a, b) => b.frac - a.frac);
    for (let i = 0; i < remaining; i++) {
        intervals[i].steps++;
    }
    intervals.sort((a, b) => a.index - b.index);

    const repeatChar = (ch, count) => {
        let s = "";
        for (let i = 0; i < count; i++) s += ch;
        return s;
    };

    const names = [];
    for (let n = 0; n < 7; n++) {
        const natural = naturals[n];
        const nextNatural = naturals[(n + 1) % 7];
        const edoSteps = intervals[n].steps;

        // A letter with zero allocated steps contributes no note names at
        // all (not even its own natural). Pushing it unconditionally was
        // the bug: it forced names.length to always be >= 7, even for
        // EDOs smaller than 7 (e.g. edo=4 allocates steps to only 4 of the
        // 7 letters, leaving 3 letters with 0 steps).
        if (edoSteps < 1) {
            continue;
        }

        names.push(natural);

        const numAccidentals = edoSteps - 1;
        const sharpCount = Math.ceil(numAccidentals / 2);
        const flatCount = Math.floor(numAccidentals / 2);

        for (let s = 1; s <= sharpCount; s++) {
            names.push(natural + repeatChar(SHARP, s));
        }
        for (let f = flatCount; f >= 1; f--) {
            names.push(nextNatural + repeatChar(FLAT, f));
        }
    }

    EDO_NOTE_NAMES[edo] = names;
    return names;
}

/**
 * Returns the index of a note name in an EDO-specific name table.
 *
 * Examples:
 *   getEdoNoteNamePosition("C♯", 12)  → 1
 *   getEdoNoteNamePosition("D♭", 19)  → 2
 *   getEdoNoteNamePosition("E♯", 19)  → 7
 *   getEdoNoteNamePosition("G",   7)  → 4
 *   getEdoNoteNamePosition("C♯",  7)  → -1 (not in 7-EDO)
 *
 * @param {string} name - note name (e.g., "C♯", "D♭")
 * @param {number} edo - number of steps per octave
 * @returns {number} position in the EDO name table, or -1 if not found
 */
function getEdoNoteNamePosition(name, edo) {
    const normalizedName = name
        .replaceAll("#", SHARP)
        .replaceAll("b", FLAT)
        .replaceAll(DOUBLESHARP, SHARP + SHARP)
        .replaceAll(DOUBLEFLAT, FLAT + FLAT);

    const names = generateNoteNames(edo);
    let idx = names.indexOf(normalizedName);
    if (idx !== -1) return idx;

    // Fallback: try sharp equivalent (12-EDO only — non-12 EDO has distinct pitch classes)
    if (edo === 12 && normalizedName in EQUIVALENTSHARPS) {
        idx = names.indexOf(EQUIVALENTSHARPS[normalizedName]);
        if (idx !== -1) return idx;
    }
    if (edo === 12 && normalizedName in EQUIVALENTFLATS) {
        idx = names.indexOf(EQUIVALENTFLATS[normalizedName]);
        if (idx !== -1) return idx;
    }

    // Try 12-EDO proportional fallback for notes not in the EDO name set
    const pos12 = PITCHES2.indexOf(normalizedName);
    if (pos12 !== -1) {
        return Math.round((pos12 / 12) * edo) % edo;
    }
    const posFlat = PITCHES.indexOf(normalizedName);
    if (posFlat !== -1) {
        return Math.round((posFlat / 12) * edo) % edo;
    }

    return -1;
}

/**
 * Octave ratio.
 * @type {number}
 */
var octaveRatio = 2;

/**
 * Initial temperaments available for selection.
 * @constant {Array<Array<string>>}
 */
var INITIALTEMPERAMENTS = [
    [_("Equal (12EDO)"), "equal", "equal"],
    [_("Equal (5EDO)"), "equal5", "equal5"],
    [_("Equal (7EDO)"), "equal7", "equal7"],
    [_("Equal (17EDO)"), "equal17", "equal17"],
    [_("Equal (19EDO)"), "equal19", "equal19"],
    [_("Equal (31EDO)"), "equal31", "equal31"],
    [_("5-limit Just Intonation"), "just intonation", "just intonation"],
    [_("Pythagorean (3-limit JI)"), "Pythagorean", "Pythagorean"],
    [_("Meantone") + " (1/3)", "1/3 comma meantone", "meantone (1/3)"],
    [_("Meantone") + " (1/4)", "1/4 comma meantone", "meantone (1/4)"]
];

/**
 * Array of available temperaments.
 * @type {Array<Array<string>>}
 */
var TEMPERAMENTS = [
    [_("Equal (12EDO)"), "equal", "equal"],
    [_("Equal (5EDO)"), "equal5", "equal5"],
    [_("Equal (7EDO)"), "equal7", "equal7"],
    [_("Equal (17EDO)"), "equal17", "equal17"],
    [_("Equal (19EDO)"), "equal19", "equal19"],
    [_("Equal (31EDO)"), "equal31", "equal31"],
    [_("5-limit Just Intonation"), "just intonation", "just intonation"],
    [_("Pythagorean (3-limit JI)"), "Pythagorean", "Pythagorean"],
    [`${_("Meantone")} (1/3)`, "1/3 comma meantone", "meantone (1/3)"],
    [`${_("Meantone")} (1/4)`, "1/4 comma meantone", "meantone (1/4)"],
    [_("custom"), "custom", "custom"]
];

/**
 * Predefined temperaments for quick access.
 * @constant {Object}
 */
var PreDefinedTemperaments = {
    "equal": true,
    "equal5": true,
    "equal7": true,
    "equal17": true,
    "equal19": true,
    "equal31": true,
    "just intonation": true,
    "Pythagorean": true,
    "1/3 comma meantone": true,
    "1/4 comma meantone": true
};

/**
 * Precise cents values for exact interval ratios.
 * Used to calculate temperament-dependent frequencies without approximation.
 * @constant {Object}
 */
var INTERVAL_CENTS = {
    "1/1": 1200 * Math.log2(1 / 1),
    "2/1": 1200 * Math.log2(2 / 1),
    "3/2": 1200 * Math.log2(3 / 2),
    "4/3": 1200 * Math.log2(4 / 3),
    "5/4": 1200 * Math.log2(5 / 4),
    "5/3": 1200 * Math.log2(5 / 3),
    "6/5": 1200 * Math.log2(6 / 5),
    "8/5": 1200 * Math.log2(8 / 5),
    "9/8": 1200 * Math.log2(9 / 8),
    "9/5": 1200 * Math.log2(9 / 5),
    "15/8": 1200 * Math.log2(15 / 8),
    "15/16": 1200 * Math.log2(15 / 16),
    "16/15": 1200 * Math.log2(16 / 15),
    "16/9": 1200 * Math.log2(16 / 9),
    "24/25": 1200 * Math.log2(24 / 25),
    "25/24": 1200 * Math.log2(25 / 24),
    "25/18": 1200 * Math.log2(25 / 18),
    "25/16": 1200 * Math.log2(25 / 16),
    "32/25": 1200 * Math.log2(32 / 25),
    "36/25": 1200 * Math.log2(36 / 25),
    "45/32": 1200 * Math.log2(45 / 32),
    "72/125": 1200 * Math.log2(72 / 125),
    "75/64": 1200 * Math.log2(75 / 64),
    "81/64": 1200 * Math.log2(81 / 64),
    "96/125": 1200 * Math.log2(96 / 125),
    "125/72": 1200 * Math.log2(125 / 72),
    "125/96": 1200 * Math.log2(125 / 96),
    "125/64": 1200 * Math.log2(125 / 64),
    "128/81": 1200 * Math.log2(128 / 81),
    "128/125": 1200 * Math.log2(128 / 125),
    "144/125": 1200 * Math.log2(144 / 125),
    "243/128": 1200 * Math.log2(243 / 128),
    "256/243": 1200 * Math.log2(256 / 243),
    "729/512": 1200 * Math.log2(729 / 512),
    "1024/729": 1200 * Math.log2(1024 / 729),
    "7/5": 1200 * Math.log2(7 / 5),
    "7/4": 1200 * Math.log2(7 / 4),
    "21/16": 1200 * Math.log2(21 / 16)
};

/**
 * Canonical interval ordering for consistent lookup and synthesis.
 * All temperament objects should reference this ordering for stability.
 * @constant {string[]}
 */
var INTERVAL_ORDER = [
    "perfect 1",
    "minor 2",
    "major 2",
    "minor 3",
    "major 3",
    "perfect 4",
    "diminished 5",
    "perfect 5",
    "minor 6",
    "major 6",
    "minor 7",
    "major 7",
    "perfect 8"
];

/**
 * Temperament settings and interval ratios.
 * @constant {Object}
 */
var TEMPERAMENT = {
    "equal": {
        "perfect 1": Math.pow(2, 0 / 12),
        "minor 2": Math.pow(2, 1 / 12),
        "augmented 1": Math.pow(2, 1 / 12),
        "major 2": Math.pow(2, 2 / 12),
        "augmented 2": Math.pow(2, 3 / 12),
        "minor 3": Math.pow(2, 3 / 12),
        "major 3": Math.pow(2, 4 / 12),
        "augmented 3": Math.pow(2, 5 / 12),
        "diminished 4": Math.pow(2, 4 / 12),
        "perfect 4": Math.pow(2, 5 / 12),
        "augmented 4": Math.pow(2, 6 / 12),
        "diminished 5": Math.pow(2, 6 / 12),
        "perfect 5": Math.pow(2, 7 / 12),
        "augmented 5": Math.pow(2, 8 / 12),
        "minor 6": Math.pow(2, 8 / 12),
        "major 6": Math.pow(2, 9 / 12),
        "augmented 6": Math.pow(2, 10 / 12),
        "minor 7": Math.pow(2, 10 / 12),
        "major 7": Math.pow(2, 11 / 12),
        "augmented 7": Math.pow(2, 12 / 12),
        "diminished 8": Math.pow(2, 11 / 12),
        "perfect 8": Math.pow(2, 12 / 12),
        "pitchNumber": 12,
        "isEDO": true,
        "noteLabels": ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        "ratios": [
            1,
            Math.pow(2, 1 / 12),
            Math.pow(2, 2 / 12),
            Math.pow(2, 3 / 12),
            Math.pow(2, 4 / 12),
            Math.pow(2, 5 / 12),
            Math.pow(2, 6 / 12),
            Math.pow(2, 7 / 12),
            Math.pow(2, 8 / 12),
            Math.pow(2, 9 / 12),
            Math.pow(2, 10 / 12),
            Math.pow(2, 11 / 12)
        ],
        "octaveRatio": 2,
        "interval": INTERVAL_ORDER
    },
    "equal5": {
        "isEDO": true,
        "edo": 5,
        "name": "Equal (5EDO)",
        "description": "5 Equal Divisions of the Octave",
        "ratios": [
            1,
            Math.pow(2, 1 / 5),
            Math.pow(2, 2 / 5),
            Math.pow(2, 3 / 5),
            Math.pow(2, 4 / 5)
        ],
        "octaveRatio": 2,
        "generator": null,
        "pitchNumber": 5,
        "perfect 1": Math.pow(2, 0 / 5),
        "minor 2": Math.pow(2, 1 / 5),
        "augmented 1": Math.pow(2, 1 / 5),
        "major 2": Math.pow(2, 2 / 5),
        "augmented 2": Math.pow(2, 2 / 5),
        "minor 3": Math.pow(2, 2 / 5),
        "major 3": Math.pow(2, 3 / 5),
        "augmented 3": Math.pow(2, 3 / 5),
        "diminished 4": Math.pow(2, 3 / 5),
        "perfect 4": Math.pow(2, 3 / 5),
        "augmented 4": Math.pow(2, 4 / 5),
        "diminished 5": Math.pow(2, 4 / 5),
        "perfect 5": Math.pow(2, 5 / 5),
        "augmented 5": Math.pow(2, 5 / 5),
        "minor 6": Math.pow(2, 5 / 5),
        "major 6": Math.pow(2, 5 / 5),
        "augmented 6": Math.pow(2, 5 / 5),
        "minor 7": Math.pow(2, 5 / 5),
        "major 7": Math.pow(2, 5 / 5),
        "augmented 7": Math.pow(2, 5 / 5),
        "diminished 8": Math.pow(2, 5 / 5),
        "perfect 8": Math.pow(2, 5 / 5),
        "interval": ["perfect 1", "minor 2", "major 2", "major 3", "augmented 4", "perfect 5"]
    },
    "equal7": {
        "isEDO": true,
        "edo": 7,
        "name": "Equal (7EDO)",
        "description": "7 Equal Divisions of the Octave",
        "ratios": [
            1,
            Math.pow(2, 1 / 7),
            Math.pow(2, 2 / 7),
            Math.pow(2, 3 / 7),
            Math.pow(2, 4 / 7),
            Math.pow(2, 5 / 7),
            Math.pow(2, 6 / 7)
        ],
        "octaveRatio": 2,
        "generator": null,
        "pitchNumber": 7,
        "perfect 1": Math.pow(2, 0 / 7),
        "minor 2": Math.pow(2, 1 / 7),
        "augmented 1": Math.pow(2, 1 / 7),
        "major 2": Math.pow(2, 2 / 7),
        "augmented 2": Math.pow(2, 2 / 7),
        "minor 3": Math.pow(2, 3 / 7),
        "major 3": Math.pow(2, 3 / 7),
        "augmented 3": Math.pow(2, 4 / 7),
        "diminished 4": Math.pow(2, 4 / 7),
        "perfect 4": Math.pow(2, 4 / 7),
        "augmented 4": Math.pow(2, 5 / 7),
        "diminished 5": Math.pow(2, 4 / 7),
        "perfect 5": Math.pow(2, 5 / 7),
        "augmented 5": Math.pow(2, 6 / 7),
        "minor 6": Math.pow(2, 5 / 7),
        "major 6": Math.pow(2, 6 / 7),
        "augmented 6": Math.pow(2, 7 / 7),
        "minor 7": Math.pow(2, 6 / 7),
        "major 7": Math.pow(2, 6 / 7),
        "augmented 7": Math.pow(2, 7 / 7),
        "diminished 8": Math.pow(2, 7 / 7),
        "perfect 8": Math.pow(2, 7 / 7),
        "interval": [
            "perfect 1",
            "minor 2",
            "major 2",
            "major 3",
            "perfect 4",
            "perfect 5",
            "major 6",
            "perfect 8"
        ]
    },
    "equal17": {
        "isEDO": true,
        "edo": 17,
        "name": "Equal (17EDO)",
        "description": "17 Equal Divisions of the Octave",
        "ratios": [
            1,
            Math.pow(2, 1 / 17),
            Math.pow(2, 2 / 17),
            Math.pow(2, 3 / 17),
            Math.pow(2, 4 / 17),
            Math.pow(2, 5 / 17),
            Math.pow(2, 6 / 17),
            Math.pow(2, 7 / 17),
            Math.pow(2, 8 / 17),
            Math.pow(2, 9 / 17),
            Math.pow(2, 10 / 17),
            Math.pow(2, 11 / 17),
            Math.pow(2, 12 / 17),
            Math.pow(2, 13 / 17),
            Math.pow(2, 14 / 17),
            Math.pow(2, 15 / 17),
            Math.pow(2, 16 / 17)
        ],
        "octaveRatio": 2,
        "pitchNumber": 17,
        "perfect 1": Math.pow(2, 0 / 17),
        "augmented 1": Math.pow(2, 1 / 17),
        "minor 2": Math.pow(2, 2 / 17),
        "major 2": Math.pow(2, 3 / 17),
        "augmented 2": Math.pow(2, 4 / 17),
        "minor 3": Math.pow(2, 5 / 17),
        "major 3": Math.pow(2, 6 / 17),
        "perfect 4": Math.pow(2, 7 / 17),
        "augmented 4": Math.pow(2, 8 / 17),
        "diminished 5": Math.pow(2, 9 / 17),
        "perfect 5": Math.pow(2, 10 / 17),
        "augmented 5": Math.pow(2, 11 / 17),
        "minor 6": Math.pow(2, 12 / 17),
        "major 6": Math.pow(2, 13 / 17),
        "augmented 6": Math.pow(2, 14 / 17),
        "minor 7": Math.pow(2, 15 / 17),
        "major 7": Math.pow(2, 16 / 17),
        "perfect 8": Math.pow(2, 17 / 17),
        "interval": [
            "perfect 1",
            "augmented 1",
            "minor 2",
            "major 2",
            "augmented 2",
            "minor 3",
            "major 3",
            "perfect 4",
            "augmented 4",
            "diminished 5",
            "perfect 5",
            "augmented 5",
            "minor 6",
            "major 6",
            "augmented 6",
            "minor 7",
            "major 7",
            "perfect 8"
        ]
    },
    "equal19": {
        "isEDO": true,
        "edo": 19,
        "name": "Equal (19EDO)",
        "description": "19 Equal Divisions of the Octave",
        "ratios": [
            1,
            Math.pow(2, 1 / 19),
            Math.pow(2, 2 / 19),
            Math.pow(2, 3 / 19),
            Math.pow(2, 4 / 19),
            Math.pow(2, 5 / 19),
            Math.pow(2, 6 / 19),
            Math.pow(2, 7 / 19),
            Math.pow(2, 8 / 19),
            Math.pow(2, 9 / 19),
            Math.pow(2, 10 / 19),
            Math.pow(2, 11 / 19),
            Math.pow(2, 12 / 19),
            Math.pow(2, 13 / 19),
            Math.pow(2, 14 / 19),
            Math.pow(2, 15 / 19),
            Math.pow(2, 16 / 19),
            Math.pow(2, 17 / 19),
            Math.pow(2, 18 / 19)
        ],
        "octaveRatio": 2,
        "generator": null,
        "pitchNumber": 19,
        "perfect 1": Math.pow(2, 0 / 19),
        "minor 2": Math.pow(2, 2 / 19),
        "augmented 1": Math.pow(2, 1 / 19),
        "major 2": Math.pow(2, 3 / 19),
        "augmented 2": Math.pow(2, 4 / 19),
        "minor 3": Math.pow(2, 5 / 19),
        "major 3": Math.pow(2, 6 / 19),
        "augmented 3": Math.pow(2, 7 / 19),
        "diminished 4": Math.pow(2, 7 / 19),
        "perfect 4": Math.pow(2, 8 / 19),
        "augmented 4": Math.pow(2, 9 / 19),
        "diminished 5": Math.pow(2, 10 / 19),
        "perfect 5": Math.pow(2, 11 / 19),
        "augmented 5": Math.pow(2, 12 / 19),
        "minor 6": Math.pow(2, 13 / 19),
        "major 6": Math.pow(2, 14 / 19),
        "augmented 6": Math.pow(2, 15 / 19),
        "minor 7": Math.pow(2, 16 / 19),
        "major 7": Math.pow(2, 17 / 19),
        "augmented 7": Math.pow(2, 18 / 19),
        "diminished 8": Math.pow(2, 18 / 19),
        "perfect 8": Math.pow(2, 19 / 19),
        "interval": [
            "perfect 1",
            "augmented 1",
            "minor 2",
            "major 2",
            "augmented 2",
            "minor 3",
            "major 3",
            "augmented 3",
            "perfect 4",
            "augmented 4",
            "diminished 5",
            "perfect 5",
            "augmented 5",
            "minor 6",
            "major 6",
            "augmented 6",
            "minor 7",
            "major 7",
            "augmented 7",
            "perfect 8"
        ]
    },
    "equal31": {
        "isEDO": true,
        "edo": 31,
        "name": "Equal (31EDO)",
        "description": "31 Equal Divisions of the Octave",
        "ratios": [
            1,
            Math.pow(2, 1 / 31),
            Math.pow(2, 2 / 31),
            Math.pow(2, 3 / 31),
            Math.pow(2, 4 / 31),
            Math.pow(2, 5 / 31),
            Math.pow(2, 6 / 31),
            Math.pow(2, 7 / 31),
            Math.pow(2, 8 / 31),
            Math.pow(2, 9 / 31),
            Math.pow(2, 10 / 31),
            Math.pow(2, 11 / 31),
            Math.pow(2, 12 / 31),
            Math.pow(2, 13 / 31),
            Math.pow(2, 14 / 31),
            Math.pow(2, 15 / 31),
            Math.pow(2, 16 / 31),
            Math.pow(2, 17 / 31),
            Math.pow(2, 18 / 31),
            Math.pow(2, 19 / 31),
            Math.pow(2, 20 / 31),
            Math.pow(2, 21 / 31),
            Math.pow(2, 22 / 31),
            Math.pow(2, 23 / 31),
            Math.pow(2, 24 / 31),
            Math.pow(2, 25 / 31),
            Math.pow(2, 26 / 31),
            Math.pow(2, 27 / 31),
            Math.pow(2, 28 / 31),
            Math.pow(2, 29 / 31),
            Math.pow(2, 30 / 31)
        ],
        "octaveRatio": 2,
        "generator": null,
        "pitchNumber": 31,
        "perfect 1": Math.pow(2, 0 / 31),
        "diminished 2": Math.pow(2, 1 / 31),
        "augmented 1": Math.pow(2, 2 / 31),
        "minor 2": Math.pow(2, 3 / 31),
        "mid 2": Math.pow(2, 4 / 31),
        "major 2": Math.pow(2, 5 / 31),
        "up-major 2": Math.pow(2, 6 / 31),
        "down-minor 3": Math.pow(2, 7 / 31),
        "minor 3": Math.pow(2, 8 / 31),
        "mid 3": Math.pow(2, 9 / 31),
        "major 3": Math.pow(2, 10 / 31),
        "up-major 3": Math.pow(2, 11 / 31),
        "down 4": Math.pow(2, 12 / 31),
        "perfect 4": Math.pow(2, 13 / 31),
        "up 4": Math.pow(2, 14 / 31),
        "down-diminished 5": Math.pow(2, 15 / 31),
        "up-augmented 4": Math.pow(2, 16 / 31),
        "down 5": Math.pow(2, 17 / 31),
        "perfect 5": Math.pow(2, 18 / 31),
        "up 5": Math.pow(2, 19 / 31),
        "down-minor 6": Math.pow(2, 20 / 31),
        "minor 6": Math.pow(2, 21 / 31),
        "mid 6": Math.pow(2, 22 / 31),
        "major 6": Math.pow(2, 23 / 31),
        "up-major 6": Math.pow(2, 24 / 31),
        "down-minor 7": Math.pow(2, 25 / 31),
        "minor 7": Math.pow(2, 26 / 31),
        "mid 7": Math.pow(2, 27 / 31),
        "major 7": Math.pow(2, 28 / 31),
        "up-major 7": Math.pow(2, 29 / 31),
        "down 8": Math.pow(2, 30 / 31),
        "perfect 8": Math.pow(2, 31 / 31),
        "octave": Math.pow(2, 31 / 31),
        "interval": [
            "perfect 1",
            "diminished 2",
            "augmented 1",
            "minor 2",
            "mid 2",
            "major 2",
            "up-major 2",
            "down-minor 3",
            "minor 3",
            "mid 3",
            "major 3",
            "up-major 3",
            "down 4",
            "perfect 4",
            "up 4",
            "down-diminished 5",
            "up-augmented 4",
            "down 5",
            "perfect 5",
            "up 5",
            "down-minor 6",
            "minor 6",
            "mid 6",
            "major 6",
            "up-major 6",
            "down-minor 7",
            "minor 7",
            "mid 7",
            "major 7",
            "up-major 7",
            "down 8",
            "perfect 8"
        ]
    },
    "just intonation": {
        "isEDO": false,
        "edo": 12,
        "name": "5-limit Just Intonation",
        "description": "Pure integer ratios based on the 5-limit prime limit system",
        // Cents are derived from ratios: cents = 1200 * log2(ratio)
        // Example: perfect 5 = 3/2 ratio → 1200 * log2(1.5) ≈ 702 cents
        // In 12-EDO, perfect 5 = 700 cents (slightly flat vs JI's pure 702 cents)
        "noteLabels": ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        "ratios": [
            1 / 1,
            16 / 15,
            9 / 8,
            6 / 5,
            5 / 4,
            4 / 3,
            45 / 32,
            3 / 2,
            8 / 5,
            5 / 3,
            9 / 5,
            15 / 8
        ],
        "octaveRatio": 2,
        "generator": null,
        "perfect 1": { ratio: 1 / 1, cents: 1200 * Math.log2(1 / 1) },
        "minor 2": { ratio: 16 / 15, cents: 1200 * Math.log2(16 / 15) },
        "augmented 1": { ratio: 16 / 15, cents: 1200 * Math.log2(16 / 15) },
        "major 2": { ratio: 9 / 8, cents: 1200 * Math.log2(9 / 8) },
        "augmented 2": { ratio: 6 / 5, cents: 1200 * Math.log2(6 / 5) },
        "minor 3": { ratio: 6 / 5, cents: 1200 * Math.log2(6 / 5) },
        "major 3": { ratio: 5 / 4, cents: 1200 * Math.log2(5 / 4) },
        "augmented 3": { ratio: 4 / 3, cents: 1200 * Math.log2(4 / 3) },
        "diminished 4": { ratio: 5 / 4, cents: 1200 * Math.log2(5 / 4) },
        "perfect 4": { ratio: 4 / 3, cents: 1200 * Math.log2(4 / 3) },
        "augmented 4": { ratio: 45 / 32, cents: 1200 * Math.log2(45 / 32) },
        "diminished 5": { ratio: 45 / 32, cents: 1200 * Math.log2(45 / 32) },
        "perfect 5": { ratio: 3 / 2, cents: 1200 * Math.log2(3 / 2) },
        "augmented 5": { ratio: 8 / 5, cents: 1200 * Math.log2(8 / 5) },
        "minor 6": { ratio: 8 / 5, cents: 1200 * Math.log2(8 / 5) },
        "major 6": { ratio: 5 / 3, cents: 1200 * Math.log2(5 / 3) },
        "augmented 6": { ratio: 16 / 9, cents: 1200 * Math.log2(16 / 9) },
        "minor 7": { ratio: 16 / 9, cents: 1200 * Math.log2(16 / 9) },
        "major 7": { ratio: 15 / 8, cents: 1200 * Math.log2(15 / 8) },
        "augmented 7": { ratio: 2 / 1, cents: 1200 * Math.log2(2 / 1) },
        "diminished 8": { ratio: 15 / 8, cents: 1200 * Math.log2(15 / 8) },
        "perfect 8": { ratio: 2 / 1, cents: 1200 * Math.log2(2 / 1) },
        "pitchNumber": 12,
        "interval": INTERVAL_ORDER
    },
    "Pythagorean": {
        "isEDO": false,
        "edo": 12,
        "name": "Pythagorean Tuning",
        "description":
            "Tuning system based on pure perfect fifths (3/2 ratio) from ancient Greek theory",
        // All intervals derived by stacking 3/2 ratios (fifths).
        // Example: major 3 = 81/64 ≈ 408 cents (vs JI's 5/4 = 386 cents, 12-EDO's 400 cents)
        // Pythagorean major 3 is noticeably sharp compared to JI's pure major third.
        "noteLabels": ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
        "ratios": [
            1 / 1,
            256 / 243,
            9 / 8,
            32 / 27,
            81 / 64,
            4 / 3,
            729 / 512,
            3 / 2,
            128 / 81,
            27 / 16,
            16 / 9,
            243 / 128
        ],
        "octaveRatio": 2,
        "generator": 3 / 2,
        "perfect 1": { ratio: 1 / 1, cents: 1200 * Math.log2(1 / 1) },
        "minor 2": { ratio: 256 / 243, cents: 1200 * Math.log2(256 / 243) },
        "augmented 1": { ratio: 256 / 243, cents: 1200 * Math.log2(256 / 243) },
        "major 2": { ratio: 9 / 8, cents: 1200 * Math.log2(9 / 8) },
        "augmented 2": { ratio: 32 / 27, cents: 1200 * Math.log2(32 / 27) },
        "minor 3": { ratio: 32 / 27, cents: 1200 * Math.log2(32 / 27) },
        "major 3": { ratio: 81 / 64, cents: 1200 * Math.log2(81 / 64) },
        "augmented 3": { ratio: 4 / 3, cents: 1200 * Math.log2(4 / 3) },
        "diminished 4": { ratio: 81 / 64, cents: 1200 * Math.log2(81 / 64) },
        "perfect 4": { ratio: 4 / 3, cents: 1200 * Math.log2(4 / 3) },
        "augmented 4": { ratio: 729 / 512, cents: 1200 * Math.log2(729 / 512) },
        "diminished 5": { ratio: 729 / 512, cents: 1200 * Math.log2(729 / 512) },
        "perfect 5": { ratio: 3 / 2, cents: 1200 * Math.log2(3 / 2) },
        "augmented 5": { ratio: 128 / 81, cents: 1200 * Math.log2(128 / 81) },
        "minor 6": { ratio: 128 / 81, cents: 1200 * Math.log2(128 / 81) },
        "major 6": { ratio: 27 / 16, cents: 1200 * Math.log2(27 / 16) },
        "augmented 6": { ratio: 16 / 9, cents: 1200 * Math.log2(16 / 9) },
        "minor 7": { ratio: 16 / 9, cents: 1200 * Math.log2(16 / 9) },
        "major 7": { ratio: 243 / 128, cents: 1200 * Math.log2(243 / 128) },
        "augmented 7": { ratio: 2 / 1, cents: 1200 * Math.log2(2 / 1) },
        "diminished 8": { ratio: 243 / 128, cents: 1200 * Math.log2(243 / 128) },
        "perfect 8": { ratio: 2 / 1, cents: 1200 * Math.log2(2 / 1) },
        "pitchNumber": 12,
        "interval": INTERVAL_ORDER
    },
    "1/3 comma meantone": {
        "isEDO": false,
        "edo": 19,
        "name": "1/3 Comma Meantone",
        "description": "Meantone temperament with 1/3 syntonic comma (quarter-comma meantone)",
        "noteLabels": [
            "C",
            "C" + SHARP,
            "D" + FLAT,
            "D",
            "D" + SHARP,
            "E" + FLAT,
            "E",
            "E" + SHARP,
            "F",
            "F" + SHARP,
            "G" + FLAT,
            "G",
            "G" + SHARP,
            "A" + FLAT,
            "A",
            "A" + SHARP,
            "B" + FLAT,
            "B",
            "B" + SHARP
        ],
        // 1/3-comma meantone ratios (19 pitches per octave).
        // Generated by stacking fifths tempered narrow by 1/3 of a syntonic comma (81/80):
        //   Tempered Fifth = (3/2) * (80/81)^(1/3) ≈ 1.493762
        // Pitch ratios are octave-reduced (1.0 to 2.0) across the 19-note circle of fifths.
        "ratios": [
            1, 1.037156, 1.075693, 1.115656, 1.157109, 1.200103, 1.244694, 1.290943, 1.338902,
            1.38865, 1.440247, 1.493762, 1.549255, 1.60682, 1.666524, 1.728445, 1.792668, 1.859266,
            1.92835
        ],
        "octaveRatio": 2,
        "generator": 5 / 4,
        "pitchNumber": 19,
        "perfect 1": 1 / 1,
        "minor 2": 1.075693,
        "augmented 1": 1.037156,
        "major 2": 1.115656,
        "augmented 2": 1.157109,
        "minor 3": 1.200103,
        "major 3": 1.244694,
        "augmented 3": 1.290943,
        "diminished 4": 1.290943,
        "perfect 4": 1.338902,
        "augmented 4": 1.38865,
        "diminished 5": 1.440247,
        "perfect 5": 1.493762,
        "augmented 5": 1.549255,
        "minor 6": 1.60682,
        "major 6": 1.666524,
        "augmented 6": 1.728445,
        "minor 7": 1.792668,
        "major 7": 1.859266,
        "augmented 7": 1.92835,
        "diminished 8": 1.92835,
        "perfect 8": 2 / 1,
        "interval": [
            "perfect 1",
            "augmented 1",
            "minor 2",
            "major 2",
            "augmented 2",
            "minor 3",
            "major 3",
            "augmented 3",
            "perfect 4",
            "augmented 4",
            "diminished 5",
            "perfect 5",
            "augmented 5",
            "minor 6",
            "major 6",
            "augmented 6",
            "minor 7",
            "major 7",
            "augmented 7",
            "perfect 8"
        ]
    },
    "1/4 comma meantone": {
        "isEDO": false,
        "edo": 21,
        "name": "1/4 Comma Meantone",
        "description": "Meantone temperament with 1/4 syntonic comma",
        "noteLabels": [
            "C",
            "C" + SHARP,
            "D" + FLAT,
            "D",
            "D" + SHARP,
            "E" + FLAT,
            "E",
            "F" + FLAT,
            "E" + SHARP,
            "F",
            "F" + SHARP,
            "G" + FLAT,
            "G",
            "G" + SHARP,
            "A" + FLAT,
            "A",
            "A" + SHARP,
            "B" + FLAT,
            "B",
            "C" + FLAT,
            "B" + SHARP
        ],
        "ratios": [
            1,
            25 / 24,
            16 / 15,
            9 / 8,
            75 / 64,
            6 / 5,
            5 / 4,
            32 / 25,
            125 / 96,
            4 / 3,
            25 / 18,
            36 / 25,
            3 / 2,
            25 / 16,
            8 / 5,
            5 / 3,
            125 / 72,
            9 / 5,
            15 / 8,
            48 / 25,
            125 / 64
        ],
        "octaveRatio": 2,
        "generator": 5 / 4,
        "pitchNumber": 21,
        "perfect 1": 1 / 1,
        "minor 2": 16 / 15,
        "augmented 1": 25 / 24,
        "major 2": 9 / 8,
        "augmented 2": 75 / 64,
        "minor 3": 6 / 5,
        "major 3": 5 / 4,
        "diminished 4": 32 / 25,
        "augmented 3": 125 / 96,
        "perfect 4": 4 / 3,
        "augmented 4": 25 / 18,
        "diminished 5": 36 / 25,
        "perfect 5": 3 / 2,
        "augmented 5": 25 / 16,
        "minor 6": 8 / 5,
        "major 6": 5 / 3,
        "augmented 6": 125 / 72,
        "minor 7": 9 / 5,
        "major 7": 15 / 8,
        "diminished 8": 48 / 25,
        "augmented 7": 125 / 64,
        "perfect 8": 2 / 1,
        "interval": [
            "perfect 1",
            "augmented 1",
            "minor 2",
            "major 2",
            "augmented 2",
            "minor 3",
            "major 3",
            "diminished 4",
            "augmented 3",
            "perfect 4",
            "augmented 4",
            "diminished 5",
            "perfect 5",
            "augmented 5",
            "minor 6",
            "major 6",
            "augmented 6",
            "minor 7",
            "major 7",
            "diminished 8",
            "augmented 7",
            "perfect 8"
        ]
    },
    "custom": {
        "0": Math.pow(2, 0 / 12),
        "1": Math.pow(2, 1 / 12),
        "2": Math.pow(2, 2 / 12),
        "3": Math.pow(2, 3 / 12),
        "4": Math.pow(2, 4 / 12),
        "5": Math.pow(2, 5 / 12),
        "6": Math.pow(2, 6 / 12),
        "7": Math.pow(2, 7 / 12),
        "8": Math.pow(2, 8 / 12),
        "9": Math.pow(2, 9 / 12),
        "10": Math.pow(2, 10 / 12),
        "11": Math.pow(2, 11 / 12),
        "perfect 1": Math.pow(2, 0 / 12),
        "minor 2": Math.pow(2, 1 / 12),
        "major 2": Math.pow(2, 2 / 12),
        "minor 3": Math.pow(2, 3 / 12),
        "major 3": Math.pow(2, 4 / 12),
        "perfect 4": Math.pow(2, 5 / 12),
        "diminished 5": Math.pow(2, 6 / 12),
        "perfect 5": Math.pow(2, 7 / 12),
        "minor 6": Math.pow(2, 8 / 12),
        "major 6": Math.pow(2, 9 / 12),
        "minor 7": Math.pow(2, 10 / 12),
        "major 7": Math.pow(2, 11 / 12),
        "perfect 8": Math.pow(2, 12 / 12),
        "pitchNumber": 12,
        "interval": [
            "perfect 1",
            "minor 2",
            "major 2",
            "minor 3",
            "major 3",
            "perfect 4",
            "diminished 5",
            "perfect 5",
            "minor 6",
            "major 6",
            "minor 7",
            "major 7",
            "perfect 8"
        ]
    }
};

/**
 * Set the global octave ratio.
 * @function
 * @param {number} newOctaveRatio - The new octave ratio to set.
 * @returns {void}
 */
var setOctaveRatio = newOctaveRatio => {
    octaveRatio = newOctaveRatio;
};

/**
 * Get the current global octave ratio.
 * @function
 * @returns {number} The current octave ratio.
 */
var getOctaveRatio = () => {
    return octaveRatio;
};

/**
 * Converts a frequency ratio to a circle-of-notes wheel angle in degrees.
 * @function
 * @param {number} ratio - The ratio relative to the tonic.
 * @param {number} base - The octave ratio (e.g. 2 for a 2:1 octave).
 * @returns {number} The wheel angle in degrees.
 */
var ratioToWheelAngle = (ratio, base) => 270 + 360 * (Math.log10(ratio) / Math.log10(base));

/**
 * Get the list of available temperaments.
 * @function
 * @returns {Array<Array<string>>} The list of available temperaments.
 */
var getTemperamentsList = () => {
    return TEMPERAMENTS;
};

/**
 * Get the interval ratios for a specific temperament.
 * @function
 * @param {string} entry - The name of the temperament.
 * @returns {Object} The interval ratios for the specified temperament.
 */
var getTemperament = entry => {
    if (TEMPERAMENT[entry]) {
        return TEMPERAMENT[entry];
    }
    if (typeof entry === "string") {
        const edoMatch = entry.match(/^(\d+)-?[eE][dD][oO]$/i);
        if (edoMatch) {
            const key = edoMatch[1] === "12" ? "equal" : "equal" + edoMatch[1];
            if (TEMPERAMENT[key]) {
                return TEMPERAMENT[key];
            }
        }
    }
    return undefined;
};

/**
 * Get the keys of the temperament dictionary.
 * @function
 * @returns {Array<string>} The keys of the temperament dictionary.
 */
var getTemperamentKeys = () => {
    const keys = [];
    for (const k in TEMPERAMENT) {
        keys.push(k);
    }

    return keys;
};

/**
 * Add a new temperament entry to the list.
 * @function
 * @param {Array<string>} newEntry - The new temperament entry to add.
 * @returns {void}
 */
var addTemperamentToList = newEntry => {
    const isDuplicate = TEMPERAMENTS.some(
        entry =>
            entry.length === newEntry.length &&
            entry.every((value, index) => value === newEntry[index])
    );
    if (isDuplicate) {
        return;
    }
    TEMPERAMENTS.push(newEntry);
};

/**
 * Delete a temperament entry from the list.
 * @function
 * @param {string} oldEntry - The name of the temperament to delete.
 * @returns {void}
 */
var deleteTemperamentFromList = oldEntry => {
    delete TEMPERAMENT[oldEntry];
};

/**
 * Add a new temperament entry to the dictionary.
 * @function
 * @param {string} entryName - The name of the temperament.
 * @param {Object} entryValue - The interval ratios for the temperament.
 * @returns {void}
 */
var addTemperamentToDictionary = (entryName, entryValue) => {
    if (isUnsafeObjectKey(entryName)) return;
    TEMPERAMENT[entryName] = entryValue;
};

/**
 * Update the list of available temperaments.
 * @function
 * @returns {void}
 */
var updateTemperaments = () => {
    TEMPERAMENTS = [...INITIALTEMPERAMENTS];
    for (const i in TEMPERAMENT) {
        if (!(i in PreDefinedTemperaments)) {
            TEMPERAMENTS.push([_(i), i, i]);
        }
    }
};

/**
 * Check if a given temperament is custom.
 * @function
 * @param {string} temperament - The name of the temperament.
 * @returns {boolean} True if the temperament is custom, false otherwise.
 */
var isCustomTemperament = temperament => {
    // Treat invalid/null temperaments as custom to avoid errors
    if (!temperament || typeof temperament !== "string") {
        return true;
    }
    return !(temperament in PreDefinedTemperaments);
};

/**
 * Detect whether a temperament carries usable per-pitch ratio data.
 *
 * Two storage formats exist:
 *  - EDO/derived temperaments expose a `ratios` array.
 *  - The temperament editor saves custom temperaments with per-pitch numeric
 *    keys such as `"0": [ratio, note, octave]` (and no `ratios` array).
 *
 * The scalar-step code previously only checked the `ratios` array, so
 * editor-saved custom temperaments (which hold the ratios in numeric keys)
 * were wrongly treated as "no ratios" and stepped by a raw offset instead of
 * following the mode pattern. That produced degenerate playback for custom
 * EDO temperaments with a saved mode.
 * @function
 * @param {string} temperament - The temperament key.
 * @returns {boolean} True if per-pitch ratio data is available.
 */
var temperamentHasRatios = temperament => {
    const t = getTemperament(temperament);
    if (!t || typeof t !== "object") {
        return false;
    }
    if (Array.isArray(t.ratios) && t.ratios.length > 0) {
        return true;
    }
    // Editor-saved custom temperaments store ratios in numeric pitch keys.
    return Boolean(t["0"] && Array.isArray(t["0"]) && typeof t["0"][0] === "number");
};

/**
 * Check if a temperament is a true equal division of the octave (EDO).
 * True EDOs have uniform step sizes; non-equal temperaments (JI, meantone,
 * Pythagorean) have unequal intervals despite having a pitch count.
 * @function
 * @param {string} temperament - The name of the temperament.
 * @returns {boolean} True if the temperament is a true equal division.
 */
var isTrueEDO = temperament => {
    if (!temperament || typeof temperament !== "string") {
        return false;
    }
    return temperament.startsWith("equal");
};

/**
 * Detect whether a temperament is an equal division of the octave regardless of
 * how it was registered. Unlike `isTrueEDO` (which only matches names starting
 * with "equal") this also catches user-defined equal temperaments that the
 * temperament editor saved under arbitrary keys such as "custom" or "custom1".
 *
 * A temperament is treated as equally tempered when:
 *  - it explicitly flags `isEDO`, or
 *  - its numeric pitch entries are arrays whose ratios match 2^(i / pitchNumber)
 *    within tolerance (the editor stores ratios inside the numeric keys, not in a
 *    `ratios` array).
 *
 * @function
 * @param {string} temperament - The temperament key.
 * @returns {boolean} True if the temperament is an equal division of the octave.
 */
var isEquallyTempered = temperament => {
    const t = getTemperament(temperament);
    if (!t || typeof t !== "object") return false;
    if (t.isEDO === true) return true;
    if (t.isEDO === false) return false;
    if (t.ratios) {
        if (!Array.isArray(t.ratios) || t.ratios.length < 2) return false;
        const n = Number.isInteger(t.pitchNumber) ? t.pitchNumber : t.ratios.length;
        // 1e-9 is safe: stored ratios are exact Math.pow values or full-precision
        // editor output (toFixed(3) is display-only, never persisted).
        for (let i = 0; i < t.ratios.length; i++) {
            if (Math.abs(t.ratios[i] - Math.pow(2, i / n)) > 1e-9) return false;
        }
        return true;
    }
    const n = t.pitchNumber;
    if (!Number.isInteger(n) || n < 2) return false;
    for (let i = 0; i < n; i++) {
        const entry = t["" + i];
        if (!Array.isArray(entry) || typeof entry[0] !== "number") return false;
        if (Math.abs(entry[0] - Math.pow(2, i / n)) > 1e-9) return false;
    }
    return true;
};

/**
 * Detect a non-equal (just/meantone/Pythagorean) temperament that still carries
 * usable per-pitch ratio data. Used to route note/scale math down the
 * ratio-aware (cents-based) path instead of the EDO step path.
 *
 *   isNonEDO = temperamentHasRatios(t) && !isEDO && !isEquallyTempered(t)
 *
 * An explicit `isEDO === false` always wins (over the 1e-9 equality probe) so a
 * declared JI/meantone temperament is never mis-classified as EDO.
 * @function
 * @param {string} temperament - The temperament key.
 * @returns {boolean}
 */
var isNonEDO = temperament => {
    const t = getTemperament(temperament);
    if (!t || typeof t !== "object") {
        return false;
    }
    if (t.isEDO === true) {
        return false;
    }
    if (t.isEDO === false) {
        return temperamentHasRatios(temperament);
    }
    return temperamentHasRatios(temperament) && !isEquallyTempered(temperament);
};

/**
 * Extract ratio from a temperament interval value.
 * Handles both legacy numeric format and new {ratio, cents} object format.
 * @function
 * @param {number|Object} value - The interval value (ratio number or object with ratio property).
 * @returns {number} The ratio value.
 */
var getTemperamentRatio = value => {
    if (typeof value === "number") {
        return value;
    } else if (value && typeof value === "object" && typeof value.ratio === "number") {
        return value.ratio;
    }
    return 1;
};

/**
 * Extract cents from a temperament interval value.
 * Handles both legacy numeric format and new {ratio, cents} object format.
 * @function
 * @param {number|Object} value - The interval value (ratio number or object with cents property).
 * @returns {number} The cents value.
 */
var getTemperamentCents = value => {
    if (typeof value === "number") {
        return 1200 * Math.log2(value);
    } else if (value && typeof value === "object" && typeof value.cents === "number") {
        return value.cents;
    }
    return 0;
};

/**
 * Get the name of a temperament based on its identifier.
 * @function
 * @param {string} name - The identifier of the temperament.
 * @returns {string} The name of the temperament, or the default temperament name if not found.
 */
var getTemperamentName = name => {
    if (name === "") {
        name = DEFAULTTEMPERAMENT;
    }

    for (let i = 0; i < TEMPERAMENTS.length; i++) {
        if (TEMPERAMENTS[i][0].toLowerCase() === name.toLowerCase()) {
            return TEMPERAMENTS[i][1];
        } else if (TEMPERAMENTS[i][1].toLowerCase() === name.toLowerCase()) {
            return TEMPERAMENTS[i][1];
        }
    }

    // console.debug(name + " not found in TEMPERAMENTS");
    return DEFAULTTEMPERAMENT;
};

var MusicUtilsTemperament = {
    getCurrentEDO,
    EDO_NOTE_NAMES,
    SHARP_NAMES,
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
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsTemperament;
}

if (typeof window !== "undefined") {
    window.MusicUtilsTemperament = MusicUtilsTemperament;
}
