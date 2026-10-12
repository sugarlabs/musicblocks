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

   _
 */

/*
   exported

   noteIsSolfege, splitSolfege, getI18nSolfNotes, splitI18nSolfege,
   i18nSolfege, splitScaleDegree, convertFromSolfege, MusicUtilsSolfege
 */

// var, not const or let: a hoisted var in musicutils.js cannot redeclare a top-level const or let.

if (typeof module !== "undefined" && module.exports) {
    var MusicUtilsConstants =
        (typeof window !== "undefined" && window.MusicUtilsConstants) ||
        (typeof require !== "undefined" ? require("./musicutils-constants") : {});
    var { SHARP, FLAT, SOLFNOTES, NATURAL, EQUIVALENTNATURALS } = MusicUtilsConstants;
    var MusicUtilsI18n =
        (typeof window !== "undefined" && window.MusicUtilsI18n) ||
        (typeof require !== "undefined" ? require("./musicutils-i18n") : {});
    var { SOLFEGECONVERSIONTABLE, FIXEDSOLFEGE1 } = MusicUtilsI18n;
}

/**
 * Check if a note string is in solfege.
 * @function
 * @param {string} note - The note string.
 * @returns {boolean} True if the note is in solfege, false otherwise.
 */
var noteIsSolfege = note => {
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
 * Split a solfege value into pitch and attributes.
 * @function
 * @param {string} value - The solfege value.
 * @returns {Array} An array containing pitch and attributes.
 */
var splitSolfege = value => {
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

var getI18nSolfNotes = () => {
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

var splitI18nSolfege = value => {
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
var i18nSolfege = note => {
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
var splitScaleDegree = value => {
    if (!value) {
        return [5, NATURAL];
    }

    const note = value.slice(0, 1);
    const attr = value.slice(1);
    return [note, attr];
};

/**
 * Convert a solfege note to a common letter class.
 * @function
 * @param {string} note - The solfege note.
 * @returns {string} The converted note.
 */
var convertFromSolfege = note => {
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

var MusicUtilsSolfege = {
    noteIsSolfege,
    splitSolfege,
    getI18nSolfNotes,
    splitI18nSolfege,
    i18nSolfege,
    splitScaleDegree,
    convertFromSolfege
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicUtilsSolfege;
}

if (typeof window !== "undefined") {
    window.MusicUtilsSolfege = MusicUtilsSolfege;
}
