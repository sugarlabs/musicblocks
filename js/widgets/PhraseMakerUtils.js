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

/**
 * @file PhraseMakerUtils.js
 * @description Pure utility/helper functions and constants for PhraseMaker.
 */

const PhraseMakerUtils = {
    /**
     * Graphics commands associated with the matrix.
     * @type {Array<string>}
     */
    MATRIXGRAPHICS: [
        "forward",
        "back",
        "right",
        "left",
        "setheading",
        "setcolor",
        "setshade",
        "sethue",
        "setgrey",
        "settranslucency",
        "setpensize"
    ],

    /**
     * Secondary graphics commands associated with the matrix.
     * @type {Array<string>}
     */
    MATRIXGRAPHICS2: ["arc", "setxy"],

    /**
     * Synthesizer/sound parameters associated with the matrix.
     * @type {Array<string>}
     */
    MATRIXSYNTHS: ["sine", "triangle", "sawtooth", "square", "hertz"], // Deprecated

    /**
     * Generates a data URI from the provided file content.
     * @param {string} file - The file content to be converted into a data URI.
     * @returns {string} The data URI representing the file content.
     */
    generateDataURI(file) {
        const data = "data: text/html;charset=utf-8, " + encodeURIComponent(file);
        return data;
    },

    /**
     * Recalculates and adjusts notes based on tuplet rhythms.
     * @param {Array<Array>} tupletRhythms - The tuplet rhythms to process.
     * @param {Function} last - Utility function to get the last element of an array.
     * @returns {Array<Array>} The adjusted notes.
     */
    recalculateBlocks(tupletRhythms, last) {
        if (!tupletRhythms || tupletRhythms.length === 0) {
            return [];
        }
        const adjustedNotes = [];
        adjustedNotes.push([tupletRhythms[0][2], 1]);
        let startidx = 1;
        for (let i = 1; i < tupletRhythms.length; i++) {
            if (tupletRhythms[i][2] === last(adjustedNotes)[0]) {
                startidx += 1;
            } else {
                adjustedNotes[adjustedNotes.length - 1][1] = startidx;
                adjustedNotes.push([tupletRhythms[i][2], 1]);
                startidx = 1;
            }
        }
        if (startidx > 1) {
            adjustedNotes[adjustedNotes.length - 1][1] = startidx;
        }
        return adjustedNotes;
    }
};

// Export for global use
window.PhraseMakerUtils = PhraseMakerUtils;

// Export for RequireJS/AMD
if (typeof define === "function" && define.amd) {
    define([], function () {
        return PhraseMakerUtils;
    });
}

// Export for Node.js/CommonJS (for testing)
if (typeof module !== "undefined" && module.exports) {
    module.exports = PhraseMakerUtils;
}
