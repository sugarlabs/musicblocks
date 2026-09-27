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

   reducedFraction, toFraction, calcNoteValueToDisplay, durationToNoteValue,
   isInt, convertFactor, MusicUtilsRhythm
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var { NSYMBOLS, POWER2 } = MusicUtilsConstants;
}

/**
 * Get the reduced fraction representation of a fraction.
 * @function
 * @param {number} a - The numerator.
 * @param {number} b - The denominator.
 * @returns {string} The reduced fraction as a string.
 */
var reducedFraction = (a, b) => {
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
var toFraction = d => {
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
var calcNoteValueToDisplay = (a, b) => {
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
var durationToNoteValue = duration => {
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
 * Check if a value is an integer.
 * @function
 * @param {*} value - The value to check.
 * @returns {boolean} True if the value is an integer, false otherwise.
 */
var isInt = value => {
    return !isNaN(parseFloat(value)) && Number.isInteger(Number(value));
};

/**
 * Convert a duration factor to a string representation.
 * @function
 * @param {number} factor - The duration factor to convert.
 * @returns {string|null} The string representation of the duration factor.
 */
var convertFactor = factor => {
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

var MusicUtilsRhythm = {
    reducedFraction,
    toFraction,
    calcNoteValueToDisplay,
    durationToNoteValue,
    isInt,
    convertFactor
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsRhythm;
}

if (typeof window !== "undefined") {
    window.MusicUtilsRhythm = MusicUtilsRhythm;
}
