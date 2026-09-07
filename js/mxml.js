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

/* global saveMxmlOutput:writable,voiceNum:writable */
/* exported saveMxmlOutput */

// Indices into a notationStaging entry that this file cares about beyond the note-value
// (index 1) and dot-count (index 2) it already used. These mirror NOTATIONTUPLETVALUE and
// NOTATIONROUNDDOWN in js/logoconstants.js; they're duplicated here (rather than declared as
// globals) because mxml.js is loaded as a standalone module in tests, without those globals.
const MXML_TUPLETVALUE = 3;
const MXML_ROUNDDOWN = 4;

const _gcd = (a, b) => (b === 0 ? a : _gcd(b, a % b));

// Tuplet durations (e.g. 32/8 * 2/3) are rarely exact in binary floating point, so
// measure-overflow comparisons tolerate this much slop rather than misreading
// accumulated rounding noise as the measure actually running out of room.
const DIVISIONS_EPSILON = 1e-6;

saveMxmlOutput = logo => {
    const ignore = ["voice two", "voice one", "one voice"];
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

    const addMeasureAttributes = (measure, div, beats, beatType) => {
        add(
            `<measure number="${measure}"> <attributes> <divisions>${div}</divisions> <key> <fifths>0</fifths> </key> <time> <beats>${beats}</beats> <beat-type>${beatType}</beat-type> </time> <clef>  <sign>G</sign> <line>2</line> </clef> </attributes>`
        );
    };

    add("<?xml version='1.0' encoding='UTF-8'?>");
    add(
        '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">'
    );
    add('<score-partwise version="3.1">');
    indent++;
    add("<part-list>");
    indent++;

    Object.keys(logo.notation.notationStaging).forEach(voice => {
        if (logo.notation.notationStaging[voice].length === 0) return;
        voiceNum = parseInt(voice, 10) + 1;
        add(`<score-part id="P${voiceNum}">`);
        indent++;
        add(`<part-name> Voice #${voiceNum} </part-name>`);
        indent--;
        add("</score-part>");
    });
    indent--;
    add("</part-list>");
    indent--;

    Object.keys(logo.notation.notationStaging).forEach(voice => {
        if (logo.notation.notationStaging[voice].length === 0) return;
        voiceNum = parseInt(voice, 10) + 1;
        indent++;
        add(`<part id="P${voiceNum}">`);
        indent++;

        let currMeasure = 1,
            divisions = 32,
            beats = 4,
            beatType = 4;
        let beatsChanged = false,
            newDivisions = -1,
            newBeats = -1,
            newBeatType = -1;
        let openedMeasureTag = false,
            queuedTempo = null,
            firstMeasure = true;
        indent++;
        let divisionsLeft = divisions;
        const notes = logo.notation.notationStaging[voice];

        for (let i = 0; i < notes.length; i++) {
            const obj = notes[i];
            if (["tie", "begin slur", "end slur"].includes(obj) || ignore.includes(obj)) continue;

            if (obj === "key") {
                i += 2;
                continue;
            }

            if (obj === "begin crescendo") {
                addDirection("crescendo");
                continue;
            }

            if (obj === "begin decrescendo") {
                addDirection("diminuendo");
                continue;
            }

            if (obj === "end crescendo" || obj === "end decrescendo") {
                add("<direction>");
                indent++;
                add("<direction-type>");
                indent++;
                add('<wedge type="stop"/>');
                indent--;
                add("</direction-type>");
                indent--;
                add("</direction>");
                continue;
            }

            if (obj === "tempo") {
                const bpm = notes[i + 1];
                const beatMeasure = notes[i + 2];
                const bpmAdjusted = Math.floor(bpm * (4 / beatMeasure));
                if (openedMeasureTag) {
                    add(`<sound tempo="${bpmAdjusted}"/>`);
                } else {
                    queuedTempo = `<sound tempo="${bpmAdjusted}"/>`;
                }
                i += 2;
                continue;
            }

            if (obj === "meter") {
                newBeats = notes[i + 1];
                newBeatType = notes[i + 2];
                newDivisions = newBeats * (1 / newBeatType / (1 / 32));
                i += 2;
                beatsChanged = true;
                continue;
            }

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
                    const roundDown = obj[MXML_ROUNDDOWN];
                    const noteValue = tupletRatio[0] * tupletRatio[1];
                    const divisor = _gcd(noteValue, roundDown);
                    const actualNotes = noteValue / divisor;
                    const normalNotes = roundDown / divisor;
                    // Exact (fractional) duration, used for measure-break accounting so
                    // rounding error on a single note can't drift subsequent boundaries.
                    preciseDur = (32 / roundDown) * (normalNotes / actualNotes);
                    // <duration> must be an integer; 32 divisions per whole note isn't
                    // evenly divisible by every tuplet ratio, so round for display only.
                    dur = Math.max(1, Math.round(preciseDur));
                    timeModification = { actualNotes, normalNotes };
                } else {
                    preciseDur = (32 / obj[1]) * (2 - 1 / Math.pow(2, obj[2]));
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
                    if (divisionsLeft === divisions) {
                        if (firstMeasure) {
                            addMeasureAttributes(currMeasure, divisions, beats, beatType);
                            firstMeasure = false;
                        } else if (beatsChanged) {
                            beats = newBeats;
                            beatType = newBeatType;
                            divisions = newDivisions;
                            divisionsLeft = divisions;
                            addMeasureAttributes(currMeasure, newDivisions, newBeats, newBeatType);
                            beatsChanged = false;
                        } else {
                            add(`<measure number="${currMeasure}">`);
                        }
                        openedMeasureTag = true;
                        if (queuedTempo !== null) {
                            add(queuedTempo);
                            queuedTempo = null;
                        }
                    }
                    divisionsLeft -= preciseDur;
                }

                const alter = p[1] === "\u266d" ? -1 : p[1] === "\u266F" ? 1 : 0;

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
                if (notes[i + 1] === "tie") {
                    add('<tie type="start"/>');
                } else if (notes[i - 1] === "tie") {
                    add('<tie type="stop"/>');
                }
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
                add("<articulations>");
                indent++;
                if (obj[6]) add('<staccato placement="below"/>');
                indent--;
                add("</articulations>");
                indent--;
                if (notes[i - 1] === "begin slur") {
                    indent++;
                    add('<slur type="start"/>');
                    indent--;
                }
                if (notes[i + 1] === "end slur") {
                    indent++;
                    add('<slur type="stop"/>');
                    indent--;
                }
                add("</notations>");
                add("</note>");
                isChordNote = true;
            }
        }

        indent--;
        if (openedMeasureTag) {
            indent++;
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
    add("</score-partwise>");

    let mi = 1e5;
    for (let i = 0; i < res.length - 1; i++) {
        if ((res[i] === "P" || res[i] === "#") && "123456789".includes(res[i + 1])) {
            mi = Math.min(mi, parseInt(res[i + 1], 10));
        }
    }

    res = res.split("");
    for (let i = 0; i < res.length - 1; i++) {
        if ((res[i] === "P" || res[i] === "#") && "123456789".includes(res[i + 1])) {
            res[i + 1] = parseInt(res[i + 1], 10) - mi + 1;
        }
    }
    res = res.join("");

    return res;
};
if (typeof module !== "undefined" && module.exports) {
    module.exports = saveMxmlOutput;
}
