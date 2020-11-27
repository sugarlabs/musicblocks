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

saveMxmlOutput = function(logo) {
    console.log("data is ");
    console.log(logo);

    console.log("notationStaging is");
    console.log(logo.notationStaging);

    // temporary until I get more things sorted out
    const ignore = ["voice two", "voice one", "one voice"];
    let res = "";
    let indent = 0;

    let add = function(str) {
        for (let i = 0; i < indent; i++) {
            res += "    ";
        }
        res += str + "\n";
    };

    add("<?xml version='1.0' encoding='UTF-8'?>");
    add(
        '<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">'
    );
    add('<score-partwise version="3.1">');
    indent++;
    add("<part-list>");
    indent++;

    let voice;
    // Why is logo.notation.notationStaging an object and not an array?
    Object.keys(logo.notation.notationStaging).forEach(voice => {
        if (logo.notation.notationStaging[voice].length === 0) {
            return;
        }
        console.log("voice is " + voice);
        voiceNum = parseInt(voice) + 1;
        add('<score-part id="P' + voiceNum + '">');
        indent++;
        add("<part-name> Voice #" + voiceNum + " </part-name>");
        indent--;
        add("</score-part>");
    });
    indent--;
    add("</part-list>");
    indent--;

    Object.keys(logo.notation.notationStaging).forEach(voice => {
        if (logo.notation.notationStaging[voice].length === 0) {
            return;
        }
        voiceNum = parseInt(voice) + 1;
        console.log("hello");
        indent++;
        add('<part id="P' + voiceNum + '">');
        indent++;

        // assume 4/4 time, 32 divisions bc smallest note is 1/32
        // key is C by default
        let currMeasure = 1;
        let divisions = 32;
        let beats = 4;
        let beatType = 4;
        let beatsChanged = false;
        let newDivisions = -1;
        let newBeats = -1;
        let newBeatType = -1;
        let openedMeasureTag = false;
        let queuedTempo = null;
        let firstMeasure = true;
        indent++;
        let divisionsLeft = divisions;
        let notes = logo.notation.notationStaging[voice];

        console.log(notes);
        let cnter = 0;
        console.log(notes.length);

        for (let i = 0; i < notes.length; i += 1) {
            // obj = [note, duration, dotCount, tupletValue, roundDown, insideChord, staccato]
            let obj = notes[i];
            if (["tie", "begin slur", "end slur"].includes(obj)) {
                continue;
            }

            if (ignore.includes(obj)) {
                continue;
            }

            // ignore key
            if (obj === "key") {
                i += 2;
                continue;
            }

            if (obj === "begin crescendo") {
                add('<direction placement="above">');
                indent++;
                add("<direction-type>");
                indent++;
                add('<wedge type="crescendo"/>');
                indent--;
                add("</direction-type>");
                indent--;
                add("</direction>");
                continue;
            }

            if (obj === "begin decrescendo") {
                add('<direction placement="above">');
                indent++;
                add("<direction-type>");
                indent++;
                add('<wedge type="diminuendo"/>');
                indent--;
                add("</direction-type>");
                indent--;
                add("</direction>");
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
                let bpm = notes[i + 1];
                let beatMeasure = notes[i + 2];
                let bpmAdjusted = Math.floor(bpm * (4 / beatMeasure));

                if (openedMeasureTag) {
                    add('<sound tempo="' + bpmAdjusted + '"/>');
                } else {
                    queuedTempo = '<sound tempo="' + bpmAdjusted + '"/>';
                }
                i += 2;
                continue;
            }

            if (obj === "meter") {
                newBeats = notes[i + 1];
                newBeatType = notes[i + 2];

                // divisions per beat == how many 1/32 notes fit in one beat?
                newDivisions = newBeats * (1 / newBeatType / (1 / 32));
                console.log("newDivisions is " + newDivisions);
                i += 2;
                beatsChanged = true;
                continue;
            }
            // cnter++;
            // if(cnter > 10) break;
            console.log(obj);

            console.log("i is " + i);

            // We only add </chord> tag to the non-first elements in a chord
            let isChordNote = false;
            for (let p of obj[0]) {
                console.log("pitch is " + obj[0][0]);
                console.log("type of duration note is " + obj[1]);
                console.log("number of dots is " + obj[2]);

                let dur = 32 / obj[1];
                for (let j = 0; j < obj[2]; j++) dur += dur / 2;

                if (divisionsLeft < dur && !isChordNote) {
                    if (openedMeasureTag) {
                        console.log(
                            "adding closing measure tag to voice " + voiceNum
                        );
                        console.log("data is now");
                        console.log(res);
                        // throw "big chungus";
                        add("</measure>");
                        currMeasure++;
                        divisionsLeft = divisions;
                        openedMeasureTag = false;
                    }
                }

                if (!isChordNote) {
                    if (divisionsLeft === divisions) {
                        if (firstMeasure) {
                            add(
                                '<measure number="' +
                                    currMeasure +
                                    '"> <attributes> <divisions>' +
                                    divisions +
                                    "</divisions> <key> <fifths>0</fifths> </key> <time> <beats>" +
                                    beats +
                                    "</beats> <beat-type>" +
                                    beatType +
                                    "</beat-type> </time> <clef>  <sign>G</sign> <line>2</line> </clef> </attributes>"
                            );
                            firstMeasure = false;
                        } else if (beatsChanged) {
                            beats = newBeats;
                            beatType = newBeatType;
                            divisions = newDivisions;
                            divisionsLeft = divisions;
                            console.log("newdivisions is nows " + newDivisions);
                            add(
                                '<measure number="' +
                                    currMeasure +
                                    '"> <attributes> <divisions>' +
                                    newDivisions +
                                    "</divisions> <key> <fifths>0</fifths> </key> <time> <beats>" +
                                    newBeats +
                                    "</beats> <beat-type>" +
                                    newBeatType +
                                    "</beat-type> </time> <clef>  <sign>G</sign> <line>2</line> </clef> </attributes>"
                            );
                            beatsChanged = false;
                        } else {
                            add('<measure number="' + currMeasure + '">');
                        }
                        openedMeasureTag = true;
                        if (queuedTempo !== null) {
                            add(queuedTempo);
                            queuedTempo = null;
                        }
                    }
                    divisionsLeft -= dur;
                }

                let alter;

                if (p[1] === "\u266d") {
                    alter = -1; // flat
                } else if (p[1] === "\u266F") {
                    alter = 1; // sharp
                } else {
                    alter = 0; // no accidental
                }

                console.log("alter is " + alter);

                add("<note>");
                indent++;
                if (isChordNote) add("<chord/>");

                if (p[0] === "R") {
                    add("<rest/>");
                } else {
                    add("<pitch>");
                    indent++;
                    add("<step>" + p[0] + "</step>");
                    if (alter != 0) {
                        add("<alter>" + alter + "</alter>");
                    }
                    add("<octave>" + p[p.length - 1] + "</octave>");
                    indent--;
                    add("</pitch>");
                }

                add("<duration>" + dur + "</duration>");
                if (notes[i + 1] === "tie") {
                    add('<tie type="start"/>');
                } else if (notes[i - 1] === "tie") {
                    add('<tie type="stop"/>');
                }
                indent--;

                add("<notations>");
                indent++;
                add("<articulations>");
                indent++;
                if (obj[6]) {
                    add('<staccato placement="below"/>');
                }
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

    // Filter voices
    let mi = 1e5;
    for (let i = 0; i < res.length - 1; i++) {
        if (
            (res[i] === "P" || res[i] === "#") &&
            "123456789".includes(res[i + 1])
        ) {
            mi = Math.min(mi, parseInt(res[i + 1]));
        }
    }

    console.log("mi is " + mi);
    res = res.split("");
    for (let i = 0; i < res.length - 1; i++) {
        if (
            (res[i] === "P" || res[i] === "#") &&
            "123456789".includes(res[i + 1])
        ) {
            console.log("replacing");
            res[i + 1] = parseInt(res[i + 1]) - mi + 1;
        }
    }
    res = res.join("");

    return res;
};
