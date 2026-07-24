// Copyright (c) 2026 Shivang Kumar Dubey
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global ABCJS */
/* exported extractNotes, compareAssignment */

/**
 * Extracts a flat array of pitch integers from a parsed ABCJS tune.
 * Pitch integers are diatonic: 0 = C4, 1 = D4, 7 = C5, etc.
 *
 * @param {Object} tune - A single tune from ABCJS.parseOnly()
 * @returns {number[]}
 */
function extractNotes(tune) {
    const notes = [];
    tune.lines?.forEach(line => {
        line.staff?.forEach(staff => {
            staff.voices?.forEach(voice => {
                voice.forEach(element => {
                    if (element.el_type === "note" && element.pitches?.length > 0) {
                        notes.push(element.pitches[0].pitch);
                    }
                });
            });
        });
    });
    return notes;
}

/**
 * Compares a student's ABC output against a target ABC string.
 * Only the first tune in each file is compared; multi-tune ABC files are
 * not fully supported (saveAbcOutput always produces a single tune).
 * Scores based on how many notes match in sequence (pitch only).
 *
 * @param {string} targetABC - The assignment target
 * @param {string} studentABC - The student's current output
 * @returns {{ score: number, matched: number, total: number }}
 */
function compareAssignment(targetABC, studentABC) {
    const targetTunes = ABCJS.parseOnly(targetABC);
    const studentTunes = ABCJS.parseOnly(studentABC);

    if (!targetTunes.length || !studentTunes.length) {
        return { score: 0, matched: 0, total: 0 };
    }

    const targetNotes = extractNotes(targetTunes[0]);
    const studentNotes = extractNotes(studentTunes[0]);

    if (targetNotes.length === 0) {
        return { score: 0, matched: 0, total: 0 };
    }

    let matched = 0;
    const len = Math.min(targetNotes.length, studentNotes.length);
    for (let i = 0; i < len; i++) {
        if (targetNotes[i] === studentNotes[i]) {
            matched++;
        }
    }

    return {
        score: Math.round((matched / targetNotes.length) * 100),
        matched,
        total: targetNotes.length
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { extractNotes, compareAssignment };
}
