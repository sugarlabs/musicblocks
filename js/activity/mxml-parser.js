// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global DOMParser */

/* exported setupActivityMxmlParser */

// PR 1 of 4 for MusicXML import: pitch, duration and rests from a single part, at a
// default key of C major. Multi-part scores, real key-signature extraction, repeats,
// ties/slurs and drum/unpitched parts are out of scope here and land in follow-up PRs.

// Maps a MusicXML <alter> value to the Music Blocks Unicode accidental suffix
// appended to the bare step letter. Double sharp/flat use the standard MB symbols.
const _MXML_ALTER_SUFFIX = {
    "-2": "𝄫",
    "-1": "♭",
    "0": "",
    "1": "♯",
    "2": "𝄪"
};

// Maps a MusicXML <type> element (note-value name) to its denominator as a Music
// Blocks fraction, e.g. "quarter" -> 4 (a quarter note is 1/4).
const _MXML_TYPE_DENOMINATOR = {
    "whole": 1,
    "half": 2,
    "quarter": 4,
    "eighth": 8,
    "16th": 16,
    "32nd": 32,
    "64th": 64,
    "128th": 128,
    "256th": 256
};

const _text = (parent, tag) => parent.querySelector(`:scope > ${tag}`)?.textContent ?? null;

/**
 * A note's length as a Music Blocks [numerator, denominator] fraction.
 *
 * Prefers <type> (+ a <dot/> count), the semantic note-value name real-world
 * MusicXML files carry, since it reads directly as a fraction with no rounding.
 * Falls back to <duration>/divisions (quarter-note-relative) when <type> is
 * absent, which is what this project's own exporter (js/mxml.js) relies on --
 * necessary for round-tripping a file this project wrote itself.
 *
 * A note with d dots lasts (2^(d+1) - 1) / (denominator * 2^d) of a whole note,
 * the same closed-form multiplier js/mxml.js's own exporter comments reference.
 *
 * @param {Element} noteEl - a MusicXML <note> element
 * @param {number} divisions - <divisions> in force for this measure (divisions
 *     per quarter note)
 * @returns {[number, number]} [numerator, denominator]
 */
function _noteDuration(noteEl, divisions) {
    const typeName = _text(noteEl, "type");
    if (typeName !== null && typeName in _MXML_TYPE_DENOMINATOR) {
        const dots = noteEl.querySelectorAll(":scope > dot").length;
        const denominator = _MXML_TYPE_DENOMINATOR[typeName];
        return [2 ** (dots + 1) - 1, denominator * 2 ** dots];
    }

    const durationText = _text(noteEl, "duration");
    if (durationText !== null && divisions > 0) {
        // duration is in divisions; a quarter note is `divisions` divisions long.
        return [Number(durationText), divisions * 4];
    }

    // Malformed note with neither <type> nor <duration>: treat as a quarter note
    // rather than producing a zero/NaN-length block.
    return [1, 4];
}

/**
 * A <pitch> element's step+alter as a Music Blocks note name, and its octave.
 * @param {Element} pitchEl - a MusicXML <pitch> element
 * @returns {{name: string, octave: number}}
 */
function _pitchToNoteName(pitchEl) {
    const step = _text(pitchEl, "step") ?? "C";
    const alter = _text(pitchEl, "alter") ?? "0";
    const octave = Number(_text(pitchEl, "octave") ?? "4");
    const suffix = _MXML_ALTER_SUFFIX[alter] ?? "";
    return { name: step + suffix, octave };
}

/**
 * Builds the block literals for one note or rest, in the same shape
 * js/activity/abc-parser.js's _createPitchBlocks uses: a newnote wrapper
 * (divide/number/number for the fraction, vspace), then either a pitch
 * (notename/number) or a rest2, then a trailing hidden spacer.
 *
 * @param {number} blockId - this note's own starting block id
 * @param {[number, number]} duration - [numerator, denominator]
 * @param {{name: string, octave: number}|null} pitch - null for a rest
 * @param {number} prevId - the previous block's id, for this note's top connection
 * @returns {Array} the pushed block literals
 */
function _createNoteBlocks(blockId, duration, pitch, prevId) {
    const hiddenId = blockId + (pitch ? 8 : 6);
    const blocks = [
        [
            blockId,
            ["newnote", { collapsed: true }],
            0,
            0,
            [prevId, blockId + 1, blockId + 4, hiddenId]
        ],
        [blockId + 1, "divide", 0, 0, [blockId, blockId + 2, blockId + 3]],
        [blockId + 2, ["number", { value: duration[0] }], 0, 0, [blockId + 1]],
        [blockId + 3, ["number", { value: duration[1] }], 0, 0, [blockId + 1]],
        [blockId + 4, "vspace", 0, 0, [blockId, blockId + 5]]
    ];

    if (pitch) {
        blocks.push(
            [blockId + 5, "pitch", 0, 0, [blockId + 4, blockId + 6, blockId + 7, null]],
            [blockId + 6, ["notename", { value: pitch.name }], 0, 0, [blockId + 5]],
            [blockId + 7, ["number", { value: pitch.octave }], 0, 0, [blockId + 5]]
        );
    } else {
        blocks.push([blockId + 5, "rest2", 0, 0, [blockId + 4, null]]);
    }

    blocks.push([hiddenId, "hidden", 0, 0, [blockId, hiddenId + 1]]);
    return blocks;
}

/**
 * The time signature in force at the start of the first part, from its first
 * <attributes><time>, defaulting to 4/4 when absent.
 * @param {Element} partEl - a MusicXML <part> element
 * @returns {{beats: number, beatType: number}}
 */
function _initialTimeSignature(partEl) {
    const timeEl = partEl.querySelector("measure attributes time");
    if (!timeEl) return { beats: 4, beatType: 4 };
    return {
        beats: Number(_text(timeEl, "beats") ?? "4"),
        beatType: Number(_text(timeEl, "beat-type") ?? "4")
    };
}

/**
 * Builds the start/meter/setkey2/settimbre preamble, in the same shape
 * js/activity/abc-parser.js's _buildStartBlock uses. Key is hardcoded to C
 * major -- real key-signature extraction from <attributes><key><fifths> is a
 * follow-up PR, not this one.
 *
 * @param {string} title - the score's title, from <work-title> or <movement-title>
 * @param {{beats: number, beatType: number}} timeSignature
 * @returns {{preamble: Array, settimbreId: number}} preamble blocks, and the
 *     settimbre block's id, which the first note/rest connects its top dock to
 */
function _buildPreamble(title, timeSignature) {
    const preamble = [
        [0, ["start", { collapsed: false }], 100, 100, [null, 1, null]],
        [1, "print", 0, 0, [0, 2, 3]],
        [2, ["text", { value: title }], 0, 0, [1]],
        [3, "meter", 0, 0, [1, 4, 5, 8]],
        [4, ["number", { value: timeSignature.beats }], 0, 0, [3]],
        [5, "divide", 0, 0, [3, 6, 7]],
        [6, ["number", { value: 1 }], 0, 0, [5]],
        [7, ["number", { value: timeSignature.beatType }], 0, 0, [5]],
        [8, "vspace", 0, 0, [3, 9]],
        [9, "setkey2", 0, 0, [8, 10, 11, 12]],
        [10, ["notename", { value: "c" }], 0, 0, [9]],
        [11, ["modename", { value: "major" }], 0, 0, [9]],
        // Connection to the first note/rest is resolved by the caller, once it
        // knows whether the part produced any note blocks at all.
        [12, "settimbre", 0, 0, [9, 13, null, 14]],
        [13, ["voicename", { value: "guitar" }], 0, 0, [12]],
        [14, "hidden", 0, 0, [12, null]]
    ];
    return { preamble, settimbreId: 12 };
}

/**
 * Walks one <part>'s <measure> elements in document order, building a note/rest
 * block chain. Stops processing a measure at the first <backup> (a second voice
 * sharing the part): multi-voice parts are a follow-up PR, and taking only the
 * first voice is the safe reading rather than misinterpreting the backed-up time
 * as forward motion. <chord/>-marked notes (chord members after the first) are
 * skipped for the same reason -- melody-only is correct-but-incomplete, where
 * including them without chord support would just be wrong.
 *
 * @param {Element} partEl - a MusicXML <part> element
 * @param {number} blockId - the next free block id (the preamble's last id + 1)
 * @param {number} chainPrevId - the block id the first note should connect from
 * @returns {{noteBlocks: Array, lastBlockId: number, producedNotes: boolean}}
 */
function _processPart(partEl, blockId, chainPrevId) {
    const noteBlocks = [];
    let divisions = 1;
    let prevId = chainPrevId;
    let producedNotes = false;

    for (const measureEl of partEl.querySelectorAll(":scope > measure")) {
        const divisionsText = measureEl.querySelector(
            ":scope > attributes > divisions"
        )?.textContent;
        if (divisionsText !== undefined) divisions = Number(divisionsText);

        for (const child of measureEl.children) {
            if (child.tagName === "backup") break;
            if (child.tagName !== "note") continue;
            if (child.querySelector(":scope > chord") !== null) continue;

            const duration = _noteDuration(child, divisions);
            const pitchEl = child.querySelector(":scope > pitch");
            const isRest = child.querySelector(":scope > rest") !== null || pitchEl === null;
            const pitch = isRest ? null : _pitchToNoteName(pitchEl);

            const blocks = _createNoteBlocks(blockId, duration, pitch, prevId);
            noteBlocks.push(...blocks);
            producedNotes = true;
            prevId = blocks[blocks.length - 1][0];
            blockId = prevId + 1;
        }
    }

    if (noteBlocks.length > 0) {
        noteBlocks[noteBlocks.length - 1][4][1] = null;
    }

    return { noteBlocks, lastBlockId: blockId, producedNotes };
}

/**
 * Attaches parseMXML to the activity instance, mirroring how
 * js/activity/abc-parser.js attaches parseABC. See the file header for what
 * this first PR covers and what's deferred to follow-ups.
 *
 * @param {object} activityInstance - The activity instance.
 */
const setupActivityMxmlParser = activityInstance => {
    activityInstance.parseMXML = async function (xmlText) {
        const doc = new DOMParser().parseFromString(xmlText, "application/xml");
        const parserError = doc.querySelector("parsererror");
        if (parserError) {
            this.errorMsg(`Could not parse the MusicXML file: ${parserError.textContent}`);
            return null;
        }

        const partEl = doc.querySelector("score-partwise > part");
        if (!partEl) {
            this.errorMsg("Could not find a part to import in this MusicXML file.");
            return null;
        }

        const title =
            doc.querySelector("work > work-title")?.textContent ??
            doc.querySelector("movement-title")?.textContent ??
            "title";
        const timeSignature = _initialTimeSignature(partEl);

        const { preamble, settimbreId } = _buildPreamble(title, timeSignature);
        const { noteBlocks, producedNotes } = _processPart(
            partEl,
            preamble[preamble.length - 1][0] + 1,
            settimbreId
        );

        if (producedNotes) {
            // Link settimbre -> first note (forward), and back-link the first
            // note's top dock -> settimbre, same as abc-parser.js's _finalizeStaffBlocks.
            const settimbreBlock = preamble.find(block => block[0] === settimbreId);
            settimbreBlock[4][2] = noteBlocks[0][0];
            noteBlocks[0][4][0] = settimbreId;
        }

        this.blocks.loadNewBlocks([...preamble, ...noteBlocks]);
        return null;
    };
};

// AMD module definition -- mirrors the pattern used in js/activity/abc-parser.js.
if (typeof define === "function" && define.amd) {
    define(function () {
        return { setupActivityMxmlParser };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupActivityMxmlParser };
}
