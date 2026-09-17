// Copyright (c) 2019-20 Marcus Chong
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global saveMxmlOutput:writable */
/* exported saveMxmlOutput */

// Indices into a notationStaging entry that this file cares about beyond the note-value
// (index 1) and dot-count (index 2) it already used. These mirror NOTATIONTUPLETVALUE and
// NOTATIONROUNDDOWN in js/logoconstants.js; they're duplicated here (rather than declared as
// globals) because mxml.js is loaded as a standalone module in tests, without those globals.
const MXML_TUPLETVALUE = 3;
const MXML_ROUNDDOWN = 4;

const _gcd = (a, b) => (b === 0 ? a : _gcd(b, a % b));
const _lcm = (a, b) => (a * b) / _gcd(a, b);

// Tuplet durations can still land off an integer in extreme cases (e.g. a tuplet fine
// enough to need more resolution than DIVISIONS_PER_WHOLE_NOTE provides), so
// measure-overflow comparisons tolerate this much slop rather than misreading residual
// floating-point noise as the measure actually running out of room.
const DIVISIONS_EPSILON = 1e-6;

// Base resolution (divisions per whole note) when a voice has no tuplets, matching the
// value this file has always used. It's scaled up per voice -- see
// _resolveDivisionsPerWholeNote -- so that a voice containing tuplets gets an exact,
// integer <duration> for them instead of the nearest-integer approximation this
// constant alone could represent.
const DIVISIONS_PER_WHOLE_NOTE = 32;

/**
 * Converts a LilyPond duration, the form notation.js stages pickups and tempo beats in
 * (convertFactor() in js/utils/musicutils.js), to a length in whole notes.
 * @param {string} duration - space-separated note values, each optionally dotted,
 *   e.g. "4", "8.", "2 8 16".
 * @returns {number} whole notes, or NaN if the duration isn't in that form.
 */
const _lilypondDurationToWholeNotes = duration => {
    let wholeNotes = 0;
    for (const token of String(duration).trim().split(/\s+/)) {
        const match = /^(\d+)(\.*)$/.exec(token);
        if (match === null || Number(match[1]) === 0) return NaN;
        wholeNotes += (1 / Number(match[1])) * (2 - 1 / Math.pow(2, match[2].length));
    }
    return wholeNotes;
};

// How many arguments notation.js stages after each marker that takes any.
const MXML_MARKER_ARGUMENTS = new Map([
    ["key", 2],
    ["meter", 2],
    ["tempo", 2],
    ["pickup", 1],
    ["markup", 1],
    ["markdown", 1]
]);

/**
 * Lists the markers staged from `start` up to the next note. Each marker's arguments are
 * skipped, so an argument (such as print text reading "tie") is never taken for a marker.
 * @param {Array} notes - logo.notation.notationStaging[voice]
 * @param {number} start - index of the first entry after a note, or 0
 * @returns {string[]}
 */
const _markersUntilNextNote = (notes, start) => {
    const markers = [];
    let k = start;
    while (k < notes.length && !Array.isArray(notes[k])) {
        markers.push(notes[k]);
        k += 1 + (MXML_MARKER_ARGUMENTS.get(notes[k]) || 0);
    }
    return markers;
};

/**
 * Escapes free text for a <words> element.
 * @param {string|number} text
 * @returns {string}
 */
const _escapeWords = text =>
    String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Reduces a tuplet note's staging fields to a MusicXML actual-notes/normal-notes pair.
 * @param {[number, number]} tupletRatio - obj[MXML_TUPLETVALUE]: an
 *   [oddFactor, powerOfTwoFactor] factoring of the note's true note-value denominator.
 * @param {number} roundDown - obj[MXML_ROUNDDOWN]: the nearest power-of-two note value.
 * @returns {{actualNotes: number, normalNotes: number}}
 */
const _tupletNotesRatio = (tupletRatio, roundDown) => {
    const noteValue = tupletRatio[0] * tupletRatio[1];
    const divisor = _gcd(noteValue, roundDown);
    return { actualNotes: noteValue / divisor, normalNotes: roundDown / divisor };
};

/**
 * Scans a voice's staged notes for tuplets and returns the smallest whole-number
 * multiple of DIVISIONS_PER_WHOLE_NOTE that every tuplet's actual-notes count divides
 * evenly -- so every tuplet note in the voice gets an exact <duration> instead of a
 * rounded approximation. Returns DIVISIONS_PER_WHOLE_NOTE unchanged when there are no
 * tuplets, so voices without tuplets are completely unaffected by this fix.
 * @param {Array} notes - logo.notation.notationStaging[voice]
 * @returns {number}
 */
const _resolveDivisionsPerWholeNote = notes => {
    let scaleFactor = 1;
    for (const entry of notes) {
        if (!Array.isArray(entry) || !Array.isArray(entry[MXML_TUPLETVALUE])) continue;
        const { actualNotes } = _tupletNotesRatio(entry[MXML_TUPLETVALUE], entry[MXML_ROUNDDOWN]);
        scaleFactor = _lcm(scaleFactor, actualNotes);
    }
    return DIVISIONS_PER_WHOLE_NOTE * scaleFactor;
};

saveMxmlOutput = logo => {
    const ignore = ["voice one", "voice two", "voice three", "voice four", "one voice"];
    let res = "";
    let indent = 0;

    const add = str => {
        res += "    ".repeat(indent) + str + "\n";
    };

    const addDirection = type => {
        add('<direction placement="above">');
        indent++;
        add("<direction-type>");
        indent++;
        add(`<wedge type="${type}"/>`);
        indent--;
        add("</direction-type>");
        indent--;
        add("</direction>");
    };

    const addWords = (text, placement) => {
        add(`<direction placement="${placement}">`);
        indent++;
        add("<direction-type>");
        indent++;
        add(`<words>${_escapeWords(text)}</words>`);
        indent--;
        add("</direction-type>");
        indent--;
        add("</direction>");
    };

    const addWedgeStop = () => {
        add("<direction>");
        indent++;
        add("<direction-type>");
        indent++;
        add('<wedge type="stop"/>');
        indent--;
        add("</direction-type>");
        indent--;
        add("</direction>");
    };

    const addMeasureAttributes = (measure, div, beats, beatType, implicit = false) => {
        add(
            `<measure number="${measure}"${implicit ? ' implicit="yes"' : ""}> <attributes> <divisions>${div}</divisions> <key> <fifths>0</fifths> </key> <time> <beats>${beats}</beats> <beat-type>${beatType}</beat-type> </time> <clef>  <sign>G</sign> <line>2</line> </clef> </attributes>`
        );
    };

    const staging =
        logo && logo.notation && logo.notation.notationStaging ? logo.notation.notationStaging : {};
    // A voice is only written when it stages a pitched note. One with only markers, or
    // only drum hits (whose pitch list is empty), would produce an empty <part>; one with
    // only rests, or drum hits and rests, would produce a staff of rests with the drum
    // hits missing.
    const activeVoices = Object.keys(staging).filter(
        voice =>
            Array.isArray(staging[voice]) &&
            staging[voice].some(
                entry =>
                    Array.isArray(entry) &&
                    Array.isArray(entry[0]) &&
                    entry[0].some(pitch => pitch[0] !== "R")
            )
    );

    add("<?xml version='1.0' encoding='UTF-8'?>");
    add(
        '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">'
    );
    add('<score-partwise version="3.1">');
    indent++;
    add("<part-list>");
    indent++;

    if (activeVoices.length === 0) {
        add('<score-part id="P1">');
        indent++;
        add("<part-name> Voice #1 </part-name>");
        indent--;
        add("</score-part>");
    } else {
        activeVoices.forEach((voice, index) => {
            const partNum = index + 1;
            add(`<score-part id="P${partNum}">`);
            indent++;
            add(`<part-name> Voice #${partNum} </part-name>`);
            indent--;
            add("</score-part>");
        });
    }
    indent--;
    add("</part-list>");
    indent--;

    if (activeVoices.length === 0) {
        indent++;
        add('<part id="P1">');
        indent++;
        addMeasureAttributes(1, DIVISIONS_PER_WHOLE_NOTE / 4, 4, 4);
        indent++;
        add("<barline>");
        indent++;
        add("<bar-style>light-heavy</bar-style>");
        indent--;
        add("</barline>");
        indent--;
        add("</measure>");
        indent--;
        add("</part>");
        indent--;
    } else {
        activeVoices.forEach((voice, index) => {
            const partNum = index + 1;
            indent++;
            add(`<part id="P${partNum}">`);
            indent++;

            const notes = staging[voice];
            // Scaled once per voice so every tuplet note in it gets an exact <duration>
            // instead of a rounded one; identical to DIVISIONS_PER_WHOLE_NOTE (32, this
            // file's long-standing resolution) when the voice has no tuplets at all.
            const divisionsPerWholeNote = _resolveDivisionsPerWholeNote(notes);
            const divisionsPerQuarterNote = divisionsPerWholeNote / 4;

            let currMeasure = 1,
                divisions = divisionsPerWholeNote,
                beats = 4,
                beatType = 4;
            let beatsChanged = false,
                newDivisions = -1,
                newBeats = -1,
                newBeatType = -1;
            let openedMeasureTag = false,
                firstMeasure = true;
            // Length of the pickup in divisions, or 0 when the first measure is a full one.
            let pickupDivisions = 0;
            // Nesting depth of the relative-volume and harmonic blocks around the current note.
            let articulationDepth = 0,
                harmonicsDepth = 0;
            // Index of the last staged note, or -1 before the first.
            let previousNote = -1;
            // <direction> and <sound> belong inside a <measure>, at the note they precede.
            // Markers are staged before it's known whether that note still fits the current
            // measure, so they're held here and written just ahead of the next note.
            let pendingDirections = [];
            const flushPendingDirections = () => {
                pendingDirections.forEach(write => write());
                pendingDirections = [];
            };
            indent++;
            let divisionsLeft = divisions;

            for (let i = 0; i < notes.length; i++) {
                const obj = notes[i];
                if (["tie", "begin slur", "end slur"].includes(obj) || ignore.includes(obj))
                    continue;

                if (obj === "key") {
                    i += 2;
                    continue;
                }

                if (obj === "begin crescendo") {
                    pendingDirections.push(() => addDirection("crescendo"));
                    continue;
                }

                if (obj === "begin decrescendo") {
                    pendingDirections.push(() => addDirection("diminuendo"));
                    continue;
                }

                if (obj === "end crescendo" || obj === "end decrescendo") {
                    pendingDirections.push(addWedgeStop);
                    continue;
                }

                if (obj === "tempo") {
                    const bpm = notes[i + 1];
                    // The beat is staged as a LilyPond duration ("4", "4.", "4 16"), not a number.
                    const beatWholeNotes = _lilypondDurationToWholeNotes(notes[i + 2]);
                    // MusicXML tempo is a decimal, so a dotted beat can give e.g. 67.5; rounding
                    // only trims floating-point noise.
                    const bpmAdjusted = Math.round(bpm * beatWholeNotes * 4 * 1000) / 1000;
                    if (Number.isFinite(bpmAdjusted) && bpmAdjusted > 0) {
                        pendingDirections.push(() => add(`<sound tempo="${bpmAdjusted}"/>`));
                    }
                    i += 2;
                    continue;
                }

                if (obj === "meter") {
                    newBeats = notes[i + 1];
                    newBeatType = notes[i + 2];
                    newDivisions = newBeats * (1 / newBeatType / (1 / divisionsPerWholeNote));
                    i += 2;
                    beatsChanged = true;
                    continue;
                }

                if (obj === "pickup") {
                    // Only a pickup staged before the first note can shorten the first measure.
                    const pickupWholeNotes = _lilypondDurationToWholeNotes(notes[i + 1]);
                    if (firstMeasure && pickupWholeNotes > 0) {
                        pickupDivisions = pickupWholeNotes * divisionsPerWholeNote;
                    }
                    i += 1;
                    continue;
                }

                // Markup normally follows the note it annotates and is written together with
                // that note; this handles markup that no note claimed.
                if (obj === "markup" || obj === "markdown") {
                    const text = notes[i + 1];
                    const placement = obj === "markup" ? "above" : "below";
                    if (text !== undefined) {
                        pendingDirections.push(() => addWords(text, placement));
                    }
                    i += 1;
                    continue;
                }

                if (obj === "swing") {
                    pendingDirections.push(() => addWords("swing", "above"));
                    continue;
                }

                if (obj === "begin articulation") {
                    articulationDepth++;
                    continue;
                }

                if (obj === "end articulation") {
                    articulationDepth = Math.max(0, articulationDepth - 1);
                    continue;
                }

                if (obj === "begin harmonics") {
                    harmonicsDepth++;
                    continue;
                }

                if (obj === "end harmonics") {
                    harmonicsDepth = Math.max(0, harmonicsDepth - 1);
                    continue;
                }

                // Anything else that isn't a staged note is a marker with no MusicXML
                // counterpart here. Iterating it as a pitch list would turn its characters
                // into notes, so it's skipped.
                if (!Array.isArray(obj)) continue;

                // Notation.doUpdateNotation stages a note's markup (a Hertz value, or print
                // block text) immediately after the note.
                const attachedWords = [];
                let next = i + 1;
                while (notes[next] === "markup" || notes[next] === "markdown") {
                    if (notes[next + 1] !== undefined) {
                        const placement = notes[next] === "markup" ? "above" : "below";
                        attachedWords.push([notes[next + 1], placement]);
                    }
                    next += 2;
                }

                // Ties and slurs are markers staged between notes, in whatever order the blocks
                // produced them and possibly among other markers, so every marker in the gap is
                // read rather than only the adjacent entry.
                const markersBefore = _markersUntilNextNote(notes, previousNote + 1);
                const markersAfter = _markersUntilNextNote(notes, i + 1);
                const tieStop = markersBefore.includes("tie");
                const slurStart = markersBefore.includes("begin slur");
                const tieStart = markersAfter.includes("tie");
                const slurStop = markersAfter.includes("end slur");
                previousNote = i;

                let isChordNote = false;
                for (const p of obj[0]) {
                    // obj[2] is the dot count; 2 - 1/2^dotCount is the same multiplier
                    // durationToNoteValue() (musicutils.js) uses to derive it, so this stays
                    // consistent with how the dot count was assigned in the first place.
                    //
                    // A tuplet note (e.g. from Simple/Advanced Tuplet) doesn't have a
                    // power-of-two note value, so durationToNoteValue() can't express it as
                    // obj[1]/obj[2] and instead returns the sentinel obj[1] = 1, obj[2] = 0,
                    // carrying the note's real shape in obj[MXML_TUPLETVALUE] (an
                    // [oddFactor, powerOfTwoFactor] factoring of its note-value denominator)
                    // and obj[MXML_ROUNDDOWN] (the nearest power-of-two note value). Treating
                    // the sentinel as a real note value previously collapsed every tuplet
                    // note's duration to a full measure (32 divisions) and threw off measure
                    // boundaries for the rest of the voice -- see issue #8559.
                    const tupletRatio = obj[MXML_TUPLETVALUE];
                    let preciseDur, dur, timeModification;

                    if (Array.isArray(tupletRatio)) {
                        const { actualNotes, normalNotes } = _tupletNotesRatio(
                            tupletRatio,
                            obj[MXML_ROUNDDOWN]
                        );
                        // divisionsPerWholeNote was scaled (see _resolveDivisionsPerWholeNote)
                        // to be an exact multiple of every tuplet's actualNotes count in this
                        // voice, so this is already a whole number, not an approximation.
                        preciseDur =
                            (divisionsPerWholeNote / obj[MXML_ROUNDDOWN]) *
                            (normalNotes / actualNotes);
                        // Rounding only guards extreme cases (e.g. a tuplet fine enough that
                        // divisionsPerWholeNote can't represent it exactly); it's a no-op here.
                        dur = Math.max(1, Math.round(preciseDur));
                        timeModification = { actualNotes, normalNotes };
                    } else {
                        preciseDur =
                            (divisionsPerWholeNote / obj[1]) * (2 - 1 / Math.pow(2, obj[2]));
                        dur = preciseDur;
                        timeModification = null;
                    }

                    if (divisionsLeft < preciseDur - DIVISIONS_EPSILON && !isChordNote) {
                        if (openedMeasureTag) {
                            add("</measure>");
                            currMeasure++;
                            divisionsLeft = divisions;
                            openedMeasureTag = false;
                        }
                    }

                    if (!isChordNote) {
                        if (!openedMeasureTag) {
                            // Applying a pending meter here, rather than only on later
                            // measures, keeps a meter staged before the first note from
                            // being deferred to the second measure.
                            if (beatsChanged) {
                                beats = newBeats;
                                beatType = newBeatType;
                                divisions = newDivisions;
                                divisionsLeft = divisions;
                            }
                            if (firstMeasure || beatsChanged) {
                                // A pickup shorter than a full measure becomes implicit
                                // measure 0, so the first full measure is still numbered 1.
                                const isPickup =
                                    firstMeasure &&
                                    pickupDivisions > 0 &&
                                    pickupDivisions < divisions - DIVISIONS_EPSILON;
                                if (isPickup) {
                                    currMeasure = 0;
                                    divisionsLeft = pickupDivisions;
                                }
                                addMeasureAttributes(
                                    currMeasure,
                                    divisionsPerQuarterNote,
                                    beats,
                                    beatType,
                                    isPickup
                                );
                                firstMeasure = false;
                                beatsChanged = false;
                            } else {
                                add(`<measure number="${currMeasure}">`);
                            }
                            openedMeasureTag = true;
                        }
                        divisionsLeft -= preciseDur;
                    }

                    const alter = p[1] === "\u266d" ? -1 : p[1] === "\u266F" ? 1 : 0;

                    if (!isChordNote) {
                        flushPendingDirections();
                        attachedWords.forEach(([text, placement]) => addWords(text, placement));
                    }
                    add("<note>");
                    indent++;
                    if (isChordNote) add("<chord/>");

                    if (p[0] === "R") {
                        add("<rest/>");
                    } else {
                        add("<pitch>");
                        indent++;
                        add(`<step>${p[0]}</step>`);
                        if (alter !== 0) add(`<alter>${alter}</alter>`);
                        add(`<octave>${p[p.length - 1]}</octave>`);
                        indent--;
                        add("</pitch>");
                    }

                    add(`<duration>${dur}</duration>`);
                    // The middle of three tied notes both stops one tie and starts the next.
                    if (tieStop) add('<tie type="stop"/>');
                    if (tieStart) add('<tie type="start"/>');
                    if (timeModification) {
                        add("<time-modification>");
                        indent++;
                        add(`<actual-notes>${timeModification.actualNotes}</actual-notes>`);
                        add(`<normal-notes>${timeModification.normalNotes}</normal-notes>`);
                        indent--;
                        add("</time-modification>");
                    }
                    indent--;

                    add("<notations>");
                    indent++;
                    // <tie> only sets playback; notation programs draw the tie from <tied>.
                    if (tieStop) add('<tied type="stop"/>');
                    if (tieStart) add('<tied type="start"/>');
                    add("<articulations>");
                    indent++;
                    if (articulationDepth > 0) add("<accent/>");
                    if (obj[6]) add('<staccato placement="below"/>');
                    indent--;
                    add("</articulations>");
                    if (harmonicsDepth > 0) {
                        add("<technical>");
                        indent++;
                        add("<harmonic/>");
                        indent--;
                        add("</technical>");
                    }
                    indent--;
                    if (slurStart) {
                        indent++;
                        add('<slur type="start"/>');
                        indent--;
                    }
                    if (slurStop) {
                        indent++;
                        add('<slur type="stop"/>');
                        indent--;
                    }
                    add("</notations>");
                    add("</note>");
                    isChordNote = true;
                }
                // The markup attached to this note has already been written. A note with no
                // pitches (drum only) writes nothing, so its markup is left for the next note.
                if (obj[0].length > 0) i = next - 1;
            }

            indent--;
            if (openedMeasureTag) {
                indent++;
                // Markers staged after the last note still belong to the final measure.
                flushPendingDirections();
                add("<barline>");
                indent++;
                add("<bar-style>light-heavy</bar-style>");
                indent--;
                add("</barline>");
                indent--;
                add("</measure>");
            }
            indent--;
            add("</part>");
            indent--;
        });
    }
    add("</score-partwise>");

    return res;
};
if (typeof module !== "undefined" && module.exports) {
    module.exports = saveMxmlOutput;
}
