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

// PR 2 of 4 for MusicXML import: multi-part scores, real key-signature extraction
// from <attributes><key><fifths>, and an initial tempo from <sound tempo>. Repeats,
// ties/slurs and drum/unpitched parts are still out of scope and land in PR 3; wiring
// this into the app's Load menu is PR 4.

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

// Inverse of js/mxml.js's _MAJOR_FIFTHS: a <fifths> count -> the major-key tonic
// (ASCII sharp/flat) that carries it. Only the -7..7 range js/mxml.js's own range
// check allows through for a *major* key; see _keySignature for how a non-major
// mode's fifths count is converted back to this range before the lookup.
const _MXML_FIFTHS_TO_MAJOR_TONIC = {
    "-7": "Cb",
    "-6": "Gb",
    "-5": "Db",
    "-4": "Ab",
    "-3": "Eb",
    "-2": "Bb",
    "-1": "F",
    "0": "C",
    "1": "G",
    "2": "D",
    "3": "A",
    "4": "E",
    "5": "B",
    "6": "F#",
    "7": "C#"
};

// How far each mode's key signature sits from the major key on the same tonic.
// Restricted to the modes MusicXML's own <mode> element actually defines (the
// diatonic church modes plus the major/minor and ionian/aeolian aliases) -- not
// js/mxml.js's export-only pentatonic/blues aliases, which <mode> was never
// meant to carry and no notation program would write there.
const _MXML_MODE_FIFTHS_OFFSET = {
    major: 0,
    ionian: 0,
    lydian: 1,
    mixolydian: -1,
    dorian: -2,
    minor: -3,
    aeolian: -3,
    phrygian: -4,
    locrian: -5
};

// Maps a MusicXML <mode> value to the Music Blocks mode name in MUSICALMODES.
const _MXML_MODE_NAME = {
    major: "major",
    ionian: "major",
    lydian: "lydian",
    mixolydian: "mixolydian",
    dorian: "dorian",
    minor: "minor",
    aeolian: "minor",
    phrygian: "phrygian",
    locrian: "locrian"
};

const _MXML_ASCII_ACCIDENTAL_SUFFIX = { "#": "♯", "b": "♭", "": "" };

/**
 * A part's key signature as a Music Blocks {root, mode} pair, from its first
 * <attributes><key><fifths> (+ optional <mode>), defaulting to C major when
 * absent, unparseable, or outside the range a reasonable key signature covers.
 *
 * <fifths> alone only pins down the major key it belongs to; <mode> (when
 * present) says which of that major key's relative modes the music is
 * actually in, found by reversing js/mxml.js's own _keyFifths formula:
 * fifths = majorTonicFifths + modeOffset, so majorTonicFifths = fifths - modeOffset.
 *
 * @param {Element} partEl - a MusicXML <part> element
 * @returns {{root: string, mode: string}}
 */
function _keySignature(partEl) {
    const keyEl = partEl.querySelector("measure attributes key");
    const fifthsText = keyEl && _text(keyEl, "fifths");
    if (fifthsText === null || fifthsText === undefined) return { root: "C", mode: "major" };

    const fifths = Number(fifthsText);
    const modeText = (_text(keyEl, "mode") ?? "major").toLowerCase();
    const offset = _MXML_MODE_FIFTHS_OFFSET[modeText] ?? 0;
    const majorTonicFifths = fifths - offset;

    const tonicAscii = _MXML_FIFTHS_TO_MAJOR_TONIC[String(majorTonicFifths)];
    if (tonicAscii === undefined) return { root: "C", mode: "major" };

    const root = tonicAscii[0] + (_MXML_ASCII_ACCIDENTAL_SUFFIX[tonicAscii[1] ?? ""] ?? "");
    const mode = _MXML_MODE_NAME[modeText] ?? "major";
    return { root, mode };
}

/**
 * The first <sound tempo="..."> found anywhere in the document, in MusicXML's
 * own units (quarter notes per minute, the format's fixed convention regardless
 * of the project's actual beat unit), or null when the file stages no tempo at
 * all -- it's genuinely optional in MusicXML, so nothing is forced here.
 * @param {Document} doc
 * @returns {number|null}
 */
function _findTempo(doc) {
    const soundEl = doc.querySelector("sound[tempo]");
    if (!soundEl) return null;
    const tempo = Number(soundEl.getAttribute("tempo"));
    return Number.isFinite(tempo) && tempo > 0 ? tempo : null;
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
 * Builds the start/turtlename/meter/setkey2/[tempo]/settimbre preamble for one
 * part, in the same spirit js/activity/abc-parser.js's _buildStartBlock uses --
 * but computed from named segment-start ids rather than literal numbers or
 * array-position arithmetic (preamble.length - N once silently pointed at the
 * wrong block when the preamble's shape changed; naming each segment's start
 * makes that class of bug impossible to reintroduce by construction).
 *
 * @param {number} startId - the first free block id
 * @param {string} title - the score's title, from <work-title> or <movement-title>
 * @param {string} voiceLabel - this part's turtle name, e.g. "Voice 1"
 * @param {{beats: number, beatType: number}} timeSignature
 * @param {{root: string, mode: string}} keySignature
 * @param {number|null} tempoBpm - quarter notes per minute, or null to omit
 *     the tempo block entirely (MusicXML tempo is optional)
 * @returns {{preamble: Array, settimbreId: number, nextBlockId: number}}
 */
function _buildPreamble(startId, title, voiceLabel, timeSignature, keySignature, tempoBpm) {
    const startSeg = startId; // start, print, text, setturtlename2, text -- 5 blocks
    const meterSeg = startSeg + 5; // meter, number, divide, number, number, vspace -- 6 blocks
    const keySeg = meterSeg + 6; // setkey2, notename, modename -- 3 blocks
    const tempoSeg = keySeg + 3; // setbpm3, number, divide, number, number, vspace -- 6 blocks, optional
    const timbreSeg = tempoSeg + (tempoBpm !== null ? 6 : 0); // settimbre, voicename, hidden -- 3 blocks
    const nextBlockId = timbreSeg + 3;
    const afterKeySeg = tempoBpm !== null ? tempoSeg : timbreSeg;
    const beforeTimbreSeg = tempoBpm !== null ? tempoSeg + 5 : keySeg;

    const preamble = [
        [startSeg, ["start", { collapsed: false }], 100, 100, [null, startSeg + 1, null]],
        [startSeg + 1, "print", 0, 0, [startSeg, startSeg + 2, startSeg + 3]],
        [startSeg + 2, ["text", { value: title }], 0, 0, [startSeg + 1]],
        [startSeg + 3, "setturtlename2", 0, 0, [startSeg + 1, startSeg + 4, meterSeg]],
        [startSeg + 4, ["text", { value: voiceLabel }], 0, 0, [startSeg + 3]],

        [meterSeg, "meter", 0, 0, [startSeg + 3, meterSeg + 1, meterSeg + 2, meterSeg + 5]],
        [meterSeg + 1, ["number", { value: timeSignature.beats }], 0, 0, [meterSeg]],
        [meterSeg + 2, "divide", 0, 0, [meterSeg, meterSeg + 3, meterSeg + 4]],
        [meterSeg + 3, ["number", { value: 1 }], 0, 0, [meterSeg + 2]],
        [meterSeg + 4, ["number", { value: timeSignature.beatType }], 0, 0, [meterSeg + 2]],
        [meterSeg + 5, "vspace", 0, 0, [meterSeg, keySeg]],

        [keySeg, "setkey2", 0, 0, [meterSeg + 5, keySeg + 1, keySeg + 2, afterKeySeg]],
        [keySeg + 1, ["notename", { value: keySignature.root }], 0, 0, [keySeg]],
        [keySeg + 2, ["modename", { value: keySignature.mode }], 0, 0, [keySeg]],

        // Connection to the first note/rest is resolved by the caller, once it
        // knows whether the part produced any note blocks at all.
        [timbreSeg, "settimbre", 0, 0, [beforeTimbreSeg, timbreSeg + 1, null, timbreSeg + 2]],
        [timbreSeg + 1, ["voicename", { value: "guitar" }], 0, 0, [timbreSeg]],
        [timbreSeg + 2, "hidden", 0, 0, [timbreSeg, null]]
    ];

    if (tempoBpm !== null) {
        // A MusicXML tempo counts quarter notes per minute, while this block counts
        // beats of the time signature's note value (see MeterActions.setBPM) --
        // same conversion js/midi.js's finalizeTracks() uses for its setbpm3 block.
        const bpmValue = (tempoBpm * timeSignature.beatType) / 4;
        preamble.push(
            [tempoSeg, ["setbpm3"], 0, 0, [keySeg, tempoSeg + 1, tempoSeg + 2, tempoSeg + 5]],
            [tempoSeg + 1, ["number", { value: bpmValue }], 0, 0, [tempoSeg]],
            [tempoSeg + 2, "divide", 0, 0, [tempoSeg, tempoSeg + 3, tempoSeg + 4]],
            [tempoSeg + 3, ["number", { value: 1 }], 0, 0, [tempoSeg + 2]],
            [tempoSeg + 4, ["number", { value: timeSignature.beatType }], 0, 0, [tempoSeg + 2]],
            [tempoSeg + 5, "vspace", 0, 0, [tempoSeg, timbreSeg]]
        );
    }

    return { preamble, settimbreId: timbreSeg, nextBlockId };
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
 * Builds one part's full preamble + note chain, and links them together.
 * @param {Element} partEl - a MusicXML <part> element
 * @param {number} startId - the first free block id
 * @param {string} title - the score's shared title
 * @param {string} voiceLabel - this part's turtle name, e.g. "Voice 1"
 * @param {number|null} tempoBpm - shared across every part, same as a MIDI
 *     file's tempo applies to every track
 * @returns {{blocks: Array, nextBlockId: number}}
 */
function _buildPartBlocks(partEl, startId, title, voiceLabel, tempoBpm) {
    const timeSignature = _initialTimeSignature(partEl);
    const keySignature = _keySignature(partEl);
    const { preamble, settimbreId, nextBlockId } = _buildPreamble(
        startId,
        title,
        voiceLabel,
        timeSignature,
        keySignature,
        tempoBpm
    );
    const { noteBlocks, producedNotes, lastBlockId } = _processPart(
        partEl,
        nextBlockId,
        settimbreId
    );

    if (producedNotes) {
        // Link settimbre -> first note (forward), and back-link the first
        // note's top dock -> settimbre, same as abc-parser.js's _finalizeStaffBlocks.
        const settimbreBlock = preamble.find(block => block[0] === settimbreId);
        settimbreBlock[4][2] = noteBlocks[0][0];
        noteBlocks[0][4][0] = settimbreId;
    }

    return { blocks: [...preamble, ...noteBlocks], nextBlockId: lastBlockId };
}

/**
 * Attaches parseMXML to the activity instance, mirroring how
 * js/activity/abc-parser.js attaches parseABC. See the file header for what
 * this PR covers and what's deferred to follow-ups.
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

        const partEls = doc.querySelectorAll("score-partwise > part");
        if (partEls.length === 0) {
            this.errorMsg("Could not find a part to import in this MusicXML file.");
            return null;
        }

        const title =
            doc.querySelector("work > work-title")?.textContent ??
            doc.querySelector("movement-title")?.textContent ??
            "title";
        const tempoBpm = _findTempo(doc);

        let blockId = 0;
        const allBlocks = [];
        partEls.forEach((partEl, index) => {
            const { blocks, nextBlockId } = _buildPartBlocks(
                partEl,
                blockId,
                title,
                `Voice ${index + 1}`,
                tempoBpm
            );
            allBlocks.push(...blocks);
            blockId = nextBlockId;
        });

        this.blocks.loadNewBlocks(allBlocks);
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
