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

// PR 3 of 4 for MusicXML import: repeats, ties, and drum/unpitched parts. Slurs
// are intentionally not imported -- they're purely expressive in MusicXML (no
// pitch/duration/timing effect) and Music Blocks has no block that represents
// one; writing something half-equivalent would be worse than writing nothing.
// Wiring this into the app's Load menu is PR 4.

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

// Adds two [numerator, denominator] fractions without reducing the result --
// same choice as js/utils/utils-logic.js's rationalSum, whose own doc comment
// explains why: the "divide" block computes the reduction at runtime anyway,
// so there's nothing to gain from doing it here, and an unreduced result is
// just as correct.
const _addFractions = ([n1, d1], [n2, d2]) => [n1 * d2 + n2 * d1, d1 * d2];

// Whether two note "content" values (pitch/drum/rest, as built in
// _processPart) are the same. A real tie is always same-pitch; used to
// decide whether a <tie type="stop"/> note genuinely continues the open
// chain, or just happens to carry a tie tag that doesn't actually apply to it.
const _contentsEqual = (a, b) => {
    if (a === null || b === null) return a === b;
    if (a.type !== b.type) return false;
    return a.type === "pitch" ? a.name === b.name && a.octave === b.octave : a.name === b.name;
};

// A note's <time-modification> as [actual-notes, normal-notes], the ratio a
// tuplet is played at, or 1:1 for a note that is not in one. Anything missing or
// not a positive number is read as 1:1, so a malformed tuplet keeps its written
// length rather than becoming zero or NaN.
const _timeModification = noteEl => {
    const el = noteEl.querySelector(":scope > time-modification");
    if (el === null) return [1, 1];
    const actual = Number(_text(el, "actual-notes"));
    const normal = Number(_text(el, "normal-notes"));
    if (!(actual > 0) || !(normal > 0)) return [1, 1];
    return [actual, normal];
};

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
    const durationText = _text(noteEl, "duration");
    // A whole-measure rest lasts the measure whatever <type> it is drawn
    // with: PhotoScore writes a 3/4 bar's rest as <type>whole</type> over a
    // three-beat <duration> (musescore.org/en/node/51611, the same bug in
    // MuseScore's importer), and reading the type made every bar after it a
    // beat late. Its <duration> is the length that counts.
    // An empty or non-numeric <duration> says nothing, so it doesn't outrank
    // <type> (Number("") is 0, not "missing").
    const measureRestLength = durationText?.trim() ? Number(durationText) : NaN;
    const isMeasureRest =
        noteEl.querySelector(":scope > rest")?.getAttribute("measure") === "yes" &&
        Number.isFinite(measureRestLength) &&
        measureRestLength > 0 &&
        divisions > 0;
    if (!isMeasureRest && typeName !== null && typeName in _MXML_TYPE_DENOMINATOR) {
        const dots = noteEl.querySelectorAll(":scope > dot").length;
        const denominator = _MXML_TYPE_DENOMINATOR[typeName];
        // <type> is the note as written, so a tuplet note has to be shortened by
        // its ratio. <duration> below needs no such adjustment, having it already.
        const [actual, normal] = _timeModification(noteEl);
        return [(2 ** (dots + 1) - 1) * normal, denominator * 2 ** dots * actual];
    }

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
    // MusicXML defines <alter> as a decimal value, so equivalent integer
    // spellings such as "1.0" and "+1" must produce the same accidental.
    const normalizedAlter = Number(alter);
    const suffix =
        Number.isInteger(normalizedAlter) && normalizedAlter in _MXML_ALTER_SUFFIX
            ? _MXML_ALTER_SUFFIX[normalizedAlter]
            : "";
    return { name: step + suffix, octave };
}

/**
 * The Music Blocks drum name for an unpitched <note>, from the
 * <score-instrument><instrument-name> its <instrument id> references.
 *
 * js/mxml.js writes <instrument-name> as the drum name directly (e.g. "snare
 * drum") for any drum it recognizes, so no MIDI-number round trip is needed --
 * the text is already what a drumname block's value should be. Falls back to
 * "kick drum" when the note has no <instrument> reference or the id doesn't
 * resolve, the same default js/midi.js's own importer uses for the same reason.
 *
 * @param {Element} noteEl - a MusicXML <note> element with an <unpitched> child
 * @param {Document} doc - the whole document, since <score-instrument> lives in
 *     <part-list>, not inside the part being walked
 * @returns {string}
 */
function _drumName(noteEl, doc) {
    const instrumentId = noteEl.querySelector(":scope > instrument")?.getAttribute("id");
    if (!instrumentId) return "kick drum";
    // Matched by comparing the id in JS, not interpolated into a CSS attribute
    // selector -- an id containing a quote or other selector-special character
    // would otherwise produce a malformed (or, worse, unintended) selector.
    for (const scoreInstrument of doc.querySelectorAll("score-instrument")) {
        if (scoreInstrument.getAttribute("id") === instrumentId) {
            const name = _text(scoreInstrument, "instrument-name")?.trim();
            return name || "kick drum";
        }
    }
    return "kick drum";
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
    "7": "C#",
    // No file writes a major key this far round the circle of fifths, but a
    // minor (or other non-major) mode can land a majorTonicFifths value out
    // here: G# minor is <fifths>5</fifths>, A# minor is <fifths>7</fifths>,
    // Fb lydian is <fifths>-7</fifths> -- all ordinary, in range, real values.
    // Mirrors js/mxml.js's own _MAJOR_FIFTHS, which carries these same four
    // entries for the same reason (see its comment there).
    "8": "G#",
    "9": "D#",
    "10": "A#",
    "-8": "Fb"
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
 * Builds the block literals for one note, drum hit or rest, in the same shape
 * js/activity/abc-parser.js's _createPitchBlocks uses: a newnote wrapper
 * (divide/number/number for the fraction, vspace), then the note's content,
 * then a trailing hidden spacer.
 *
 * The content is pitch/notename/number for a pitched note, playdrum/drumname
 * for a drum hit -- js/blocks/DrumBlocks.js's PlayDrumBlock help string says
 * directly "You can use multiple Drum blocks within a Note block", and
 * js/midi.js's own importer nests playdrum inside newnote's clamp the same
 * way (patching the drum block's prev to the newnote's vspace) -- or just
 * rest2 for a rest.
 *
 * @param {number} blockId - this note's own starting block id
 * @param {[number, number]} duration - [numerator, denominator]
 * @param {{type: "pitch", name: string, octave: number}
 *     | {type: "drum", name: string} | null} content - null for a rest
 * @param {number} prevId - the previous block's id, for this note's top connection
 * @returns {Array} the pushed block literals
 */
function _createNoteBlocks(blockId, duration, content, prevId) {
    const contentBlockCount = content === null ? 1 : content.type === "pitch" ? 3 : 2;
    const hiddenId = blockId + 5 + contentBlockCount;
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

    if (content === null) {
        blocks.push([blockId + 5, "rest2", 0, 0, [blockId + 4, null]]);
    } else if (content.type === "pitch") {
        blocks.push(
            [blockId + 5, "pitch", 0, 0, [blockId + 4, blockId + 6, blockId + 7, null]],
            [blockId + 6, ["notename", { value: content.name }], 0, 0, [blockId + 5]],
            [blockId + 7, ["number", { value: content.octave }], 0, 0, [blockId + 5]]
        );
    } else {
        blocks.push(
            [blockId + 5, "playdrum", 0, 0, [blockId + 4, blockId + 6, null]],
            [blockId + 6, ["drumname", { value: content.name }], 0, 0, [blockId + 5]]
        );
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
    // <beats> can be additive: the MusicXML spec writes a 3+2/8 bar as one
    // <beats>3+2</beats>/<beat-type>8</beat-type> pair, and it holds the sum.
    // Number("3+2") is NaN, and the meter block was handed that as its beat
    // count.
    // An empty part ("3+", "3++2", or an empty <beats>) is malformed, not
    // zero, so it falls back to 4 with the rest.
    const beats = (_text(timeEl, "beats") ?? "4")
        .split("+")
        .reduce((total, part) => total + (part.trim() === "" ? NaN : Number(part)), 0);
    const beatType = Number(_text(timeEl, "beat-type") ?? "4");
    return {
        beats: Number.isFinite(beats) && beats > 0 ? beats : 4,
        beatType: Number.isFinite(beatType) && beatType > 0 ? beatType : 4
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
 * Wraps each repeat range in a "repeat" FlowClampBlock, rewiring the flat note
 * chain -- the same kind of rewiring js/activity/abc-parser.js's
 * _processRepeatFromStart/_processRepeatMid do for ABC's per-line nameddo
 * chain, simplified here since this file builds one flat newnote chain per
 * part rather than a chain of per-line action blocks.
 *
 * Deliberately simple: ranges are assumed non-overlapping and non-nested (a
 * second forward repeat seen before a backward one just moves the pending
 * start forward, rather than stacking); MusicXML's multiple-ending ("volta")
 * repeats are not handled, the same gap js/activity/abc-parser.js's own
 * header comment already documents for ABC's alternate endings.
 *
 * @param {Array<{startIndex: number, endIndex: number, times: number}>} repeats
 * @param {Array} noteBlocks - every note/rest/drum block literal for this
 *     part, already with the final note's trailing connection nulled
 *     (mutated in place: connections are redirected around each range)
 * @param {Array<number>} noteStartIds - each note's own wrapper block id, in
 *     the order notes were emitted
 * @param {Array<number>} noteEndIds - each note's own trailing hidden
 *     spacer's id, parallel to noteStartIds
 * @param {number} blockId - the next free block id
 * @returns {{blocks: Array, nextBlockId: number, firstBlockId: number}}
 *     firstBlockId is noteStartIds[0] unless a repeat covers index 0, in
 *     which case it's that repeat block's own id -- the caller's settimbre
 *     link must point to whichever one actually starts the flow now.
 */
function _applyRepeats(repeats, noteBlocks, noteStartIds, noteEndIds, blockId) {
    let firstBlockId = noteStartIds[0];
    if (repeats.length === 0) return { blocks: [], nextBlockId: blockId, firstBlockId };

    // Repeat blocks created by an earlier iteration of this loop are added
    // here too (not just the original notes), since two adjacent ranges --
    // e.g. two sequential unpaired backward repeats -- need the second
    // range's "prev" to resolve to the first range's own repeat block.
    const byId = new Map(noteBlocks.map(block => [block[0], block]));
    const repeatBlocks = [];

    for (const { startIndex, endIndex, times } of repeats) {
        const startNote = byId.get(noteStartIds[startIndex]);
        const endHidden = byId.get(noteEndIds[endIndex]);
        const prevId = startNote[4][0];
        const prevBlock = byId.get(prevId);
        const nextNoteId = endIndex + 1 < noteStartIds.length ? noteStartIds[endIndex + 1] : null;

        const repeatId = blockId;
        const countId = blockId + 1;
        blockId += 2;

        const repeatBlock = [repeatId, "repeat", 0, 0, [prevId, countId, startNote[0], nextNoteId]];
        repeatBlocks.push(repeatBlock, [countId, ["number", { value: times }], 0, 0, [repeatId]]);
        byId.set(repeatId, repeatBlock);

        if (startIndex === 0) {
            firstBlockId = repeatId;
        } else {
            // Redirect whichever of prevBlock's own connection slots
            // currently points at this range's start note -- not a
            // hardcoded index. prevBlock is a "hidden" spacer (2-element
            // connections, slot 1 is "next") for the common case, but when
            // this range immediately follows another repeat's range,
            // prevBlock is that *repeat* block instead (4-element
            // connections, slot 3 is its flow-next) -- a fixed [4][1] would
            // silently corrupt that repeat's count-argument slot instead.
            const prevSlot = prevBlock[4].indexOf(startNote[0]);
            prevBlock[4][prevSlot] = repeatId;
        }
        startNote[4][0] = repeatId;
        endHidden[4][1] = null;
        if (nextNoteId !== null) {
            byId.get(nextNoteId)[4][0] = repeatId;
        }
    }

    return { blocks: repeatBlocks, nextBlockId: blockId, firstBlockId };
}

/**
 * Walks one <part>'s <measure> elements in document order, building a
 * note/rest/drum block chain. Stops processing a measure at the first
 * <backup> (a second voice sharing the part): multi-voice parts are a
 * follow-up PR, and taking only the first voice is the safe reading rather
 * than misinterpreting the backed-up time as forward motion. <chord/>-marked
 * notes (chord members after the first) are skipped for the same reason --
 * melody-only is correct-but-incomplete, where including them without chord
 * support would just be wrong. A grace note (<grace/>, a <type> but no
 * <duration>) is skipped outright: it doesn't take up measure time, and
 * importing it as a full-length note would make every later note start late.
 *
 * Tied notes (<tie type="start"/> .. <tie type="stop"/>, possibly spanning
 * more than two notes) are merged into one note block with their durations
 * summed, rather than built as separate notes wrapped in a "tie" clamp block
 * (js/blocks/RhythmBlocks.js's TieBlock) -- musically equivalent for the
 * common case of a sustained same-pitch note, and avoids needing a second,
 * less-precedented block-wrapping mechanism alongside repeat's.
 *
 * @param {Element} partEl - a MusicXML <part> element
 * @param {number} blockId - the next free block id (the preamble's last id + 1)
 * @param {number} chainPrevId - the block id the first note should connect from
 * @param {Document} doc - the whole document, for drum-name lookups
 * @returns {{noteBlocks: Array, lastBlockId: number, producedNotes: boolean,
 *     firstBlockId: number}}
 */
function _processPart(partEl, blockId, chainPrevId, doc) {
    const noteBlocks = [];
    const noteStartIds = [];
    const noteEndIds = [];
    const repeats = [];
    let repeatPendingStart = null;
    // The last note index any repeat range (explicit or implicit) has
    // already covered, so a second unpaired backward repeat starts right
    // after the first one instead of both claiming to start from 0 --
    // "A :| B :|" is two one-note repeats, not two overlapping ranges both
    // beginning at A.
    let lastRepeatEnd = -1;
    let divisions = 1;
    let prevId = chainPrevId;
    let producedNotes = false;
    let tieDuration = null;
    let tieContent = null;

    const emitNote = (duration, content) => {
        const blocks = _createNoteBlocks(blockId, duration, content, prevId);
        noteBlocks.push(...blocks);
        noteStartIds.push(blockId);
        noteEndIds.push(blocks[blocks.length - 1][0]);
        producedNotes = true;
        prevId = blocks[blocks.length - 1][0];
        blockId = prevId + 1;
    };

    for (const measureEl of partEl.querySelectorAll(":scope > measure")) {
        const divisionsText = measureEl.querySelector(
            ":scope > attributes > divisions"
        )?.textContent;
        if (divisionsText !== undefined) divisions = Number(divisionsText);

        for (const child of measureEl.children) {
            if (child.tagName === "backup") break;

            if (child.tagName === "barline") {
                const repeatEl = child.querySelector(":scope > repeat");
                const direction = repeatEl?.getAttribute("direction");
                if (direction === "forward") {
                    repeatPendingStart = noteStartIds.length;
                } else if (direction === "backward") {
                    const times = Number(repeatEl.getAttribute("times")) || 2;
                    const startIndex = repeatPendingStart ?? lastRepeatEnd + 1;
                    const endIndex = noteStartIds.length - 1;
                    if (endIndex >= startIndex) {
                        repeats.push({ startIndex, endIndex, times });
                        lastRepeatEnd = endIndex;
                    }
                    repeatPendingStart = null;
                }
                continue;
            }

            if (child.tagName !== "note") continue;
            if (child.querySelector(":scope > chord") !== null) continue;
            if (child.querySelector(":scope > grace") !== null) continue;

            const duration = _noteDuration(child, divisions);
            const unpitchedEl = child.querySelector(":scope > unpitched");
            const pitchEl = child.querySelector(":scope > pitch");
            // A cue note shows another part's line during this one's rest
            // and MusicXML says it isn't played, but it still fills the time.
            const isRest =
                child.querySelector(":scope > rest") !== null ||
                child.querySelector(":scope > cue") !== null ||
                (pitchEl === null && unpitchedEl === null);

            let content;
            if (isRest) {
                content = null;
            } else if (unpitchedEl !== null) {
                content = { type: "drum", name: _drumName(child, doc) };
            } else {
                content = { type: "pitch", ..._pitchToNoteName(pitchEl) };
            }

            let hasTieStart = false;
            let hasTieStop = false;
            for (const tieEl of child.querySelectorAll(":scope > tie")) {
                const type = tieEl.getAttribute("type");
                if (type === "start") hasTieStart = true;
                if (type === "stop") hasTieStop = true;
            }

            // Only a note that both has a tie stop and shares the open tie's
            // pitch genuinely continues the chain -- anything else (a rest,
            // a different pitch, a note with no tie tag at all) is unrelated
            // content that happened to arrive while a tie was open. Flushing
            // the accumulated tie first, then handling this note as its own
            // independent note/new-tie, keeps that content from being
            // silently folded into the open tie's duration.
            const continuesTie =
                tieDuration !== null && hasTieStop && _contentsEqual(content, tieContent);

            if (tieDuration !== null && !continuesTie) {
                emitNote(tieDuration, tieContent);
                tieDuration = null;
                tieContent = null;
            }

            if (continuesTie) {
                const combined = _addFractions(tieDuration, duration);
                if (hasTieStart) {
                    tieDuration = combined;
                } else {
                    emitNote(combined, tieContent);
                    tieDuration = null;
                    tieContent = null;
                }
            } else if (hasTieStart && !hasTieStop) {
                tieDuration = duration;
                tieContent = content;
            } else {
                emitNote(duration, content);
            }
        }
    }

    // A file that ends mid-tie (a <tie type="start"/> with no matching stop)
    // is malformed, but the accumulated duration is still real music: emit it
    // rather than silently dropping it.
    if (tieDuration !== null) {
        emitNote(tieDuration, tieContent);
    }

    if (noteBlocks.length === 0) {
        return { noteBlocks, lastBlockId: blockId, producedNotes, firstBlockId: null };
    }

    noteBlocks[noteBlocks.length - 1][4][1] = null;

    const {
        blocks: repeatBlocks,
        nextBlockId,
        firstBlockId
    } = _applyRepeats(repeats, noteBlocks, noteStartIds, noteEndIds, blockId);

    return {
        noteBlocks: [...noteBlocks, ...repeatBlocks],
        lastBlockId: nextBlockId,
        producedNotes,
        firstBlockId
    };
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
function _buildPartBlocks(partEl, startId, title, voiceLabel, tempoBpm, doc) {
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
    const { noteBlocks, producedNotes, lastBlockId, firstBlockId } = _processPart(
        partEl,
        nextBlockId,
        settimbreId,
        doc
    );

    if (producedNotes) {
        // Link settimbre -> whatever actually starts the flow (forward), and
        // back-link that block's top dock -> settimbre, same as
        // abc-parser.js's _finalizeStaffBlocks. firstBlockId is the first
        // note's own id unless a repeat wraps starting at the very first
        // note, in which case it's that repeat block's id instead -- settimbre
        // must connect to whichever one actually comes first in the flow now.
        const settimbreBlock = preamble.find(block => block[0] === settimbreId);
        settimbreBlock[4][2] = firstBlockId;
        const firstBlock = noteBlocks.find(block => block[0] === firstBlockId);
        firstBlock[4][0] = settimbreId;
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
                tempoBpm,
                doc
            );
            allBlocks.push(...blocks);
            blockId = nextBlockId;
        });

        // Blocks.loadNewBlocks() resolves every connection by adding it to the
        // array's own position (_makeNewBlockWithConnections: connections[c] +
        // blockOffset) -- it never reads a block's own [0] id back out of the
        // data. Every id-assigning function above keeps ids consecutive and
        // gapless, so sorting by id guarantees array position matches id for
        // every block, regardless of which order the pieces above were
        // assembled in (the tempo segment, when present, is appended after
        // settimbre/voicename/hidden despite having lower ids).
        allBlocks.sort((a, b) => a[0] - b[0]);

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
