// Copyright (c) 2019 Bottersnike
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

   _, ValueBlock, NOINPUTERRORMSG, NANERRORMSG, last, FlowBlock,
   FlowClampBlock, Singer, numberToPitch, frequencyToPitch, getNote,
   INVALIDPITCH, pitchToNumber, LeftBlock, SHARP, FLAT, DOUBLEFLAT,
   DOUBLESHARP, NATURAL, FIXEDSOLFEGE, SOLFEGENAMES1, buildScale,
   NOTENAMES, NOTENAMES1, getPitchInfo, YSTAFFOCTAVEHEIGHT,
   YSTAFFNOTEHEIGHT, MUSICALMODES, keySignatureToMode, ALLNOTENAMES,
   nthDegreeToPitch, A0, C8, calcOctave, SOLFEGECONVERSIONTABLE,
   NOTESFLAT, NOTESSHARP, NOTESTEP, scaleDegreeToPitchMapping
 */

/* exported setupPitchBlocks */

function setupPitchBlocks(activity) {
    class RestBlock extends ValueBlock {
        constructor() {
            super("rest");
            this.setPalette("pitch", activity);
            this.hidden = this.deprecated = true;
        }
    }

    class SquareBlock extends FlowBlock {
        constructor() {
            super("square", _("square"));
            this.setPalette("pitch", activity);
            this.formBlock({ args: 1, defaults: [440] });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "square", 0, 0, [4, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            Singer.playSynthBlock(args, activity, logo, turtle, blk);
        }
    }

    class TriangleBlock extends FlowBlock {
        constructor() {
            super("triangle", _("triangle"));
            this.setPalette("pitch", activity);
            this.formBlock({ args: 1, defaults: [440] });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "triangle", 0, 0, [4, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            Singer.playSynthBlock(args, activity, logo, turtle, blk);
        }
    }

    class SineBlock extends FlowBlock {
        constructor() {
            super("sine", _("sine"));
            this.setPalette("pitch", activity);
            this.formBlock({ args: 1, defaults: [440] });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "sine", 0, 0, [4, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            Singer.playSynthBlock(args, activity, logo, turtle, blk);
        }
    }

    class SawtoothBlock extends FlowBlock {
        constructor() {
            super("sawtooth", _("sawtooth"));
            this.setPalette("pitch", activity);
            this.formBlock({ args: 1, defaults: [440] });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "sawtooth", 0, 0, [4, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            Singer.playSynthBlock(args, logo, turtle, blk);
        }
    }

    class InvertModeBlock extends ValueBlock {
        constructor() {
            super("invertmode");
            this.setPalette("pitch", activity);
            this.formBlock({ outType: "textout" });
            this.hidden = true;
        }
    }

    class TranspositionFactorBlock extends ValueBlock {
        constructor() {
            //.TRANS: musical transposition (adjustment of pitch up or down)
            super("transpositionfactor", _("transposition"));
            this.setPalette("pitch", activity);
            this.hidden = true;
            this.parameter = true;
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "transposition"]);
            } else {
                return activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle)).singer
                    .transposition;
            }
        }
    }

    class ConsonantStepSizeDownBlock extends ValueBlock {
        constructor() {
            //.TRANS: step down one note in current musical scale
            super("consonantstepsizedown", _("scalar step down"));
            this.setPalette("pitch", activity);
            this.parameter = true;
            this.setHelpString([
                _("The Scalar step down block returns the number of semi-tones down to the previous note in the current key and mode."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle) {
            return Singer.PitchActions.consonantStepSize("down", turtle);
        }
    }

    class ConsonantStepSizeUpBlock extends ValueBlock {
        constructor() {
            //.TRANS: step up one note in current musical scale
            super("consonantstepsizeup", _("scalar step up"));
            this.setPalette("pitch", activity);
            this.parameter = true;
            this.setHelpString([
                _("The Scalar step up block returns the number of semi-tones up to the next note in the current key and mode."),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle) {
            return Singer.PitchActions.consonantStepSize("up", turtle);
        }
    }

    class DeltaPitchBlock extends ValueBlock {
        constructor(name, displayName) {
            //.TRANS: the change measured in half-steps between the current pitch and the previous pitch
            super(name || "deltapitch", displayName || _("change in pitch"));
            this.setPalette("pitch", activity);
            this.parameter = true;
            this.setHelpString([
                _("The Change in pitch block is the difference (in half steps) between the current pitch being played and the previous pitch played."),
                "documentation",
                null,
                "deltapitchhelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "mypitch"]);
            }

            return Singer.PitchActions.deltaPitch(activity.blocks.blockList[blk].name, turtle);
        }
    }

    class DeltaPitch2Block extends DeltaPitchBlock {
        constructor() {
            //.TRANS: the change measured in scale-steps between the current pitch and the previous pitch
            super("deltapitch2", _("scalar change in pitch"));
        }
    }

    class MyPitchBlock extends ValueBlock {
        constructor() {
            //.TRANS: convert current note to piano key (1-88)
            super("mypitch", _("pitch number"));
            this.setPalette("pitch", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.hidden = true;
            this.setHelpString([
                _("The Pitch number block is the value of the pitch of the note currently being played."),
                "documentation",
                null,
                "everybeathelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        setter(logo, value, turtle) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            tur.singer.previousNotePlayed = tur.singer.lastNotePlayed;
            const obj = numberToPitch(Math.floor(value) + tur.singer.pitchNumberOffset);
            tur.singer.lastNotePlayed = [obj[0] + obj[1], tur.singer.lastNotePlayed[1]];
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "mypitch"]);
            } else {
                const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

                let value = null;
                let obj;
                if (tur.singer.lastNotePlayed !== null) {
                    if (typeof tur.singer.lastNotePlayed[0] === "string") {
                        const len = tur.singer.lastNotePlayed[0].length;
                        const pitch = tur.singer.lastNotePlayed[0].slice(0, len - 1);
                        const octave = parseInt(tur.singer.lastNotePlayed[0].slice(len - 1));
                        obj = [pitch, octave];
                    } else {
                        // Hertz?
                        obj = frequencyToPitch(tur.singer.lastNotePlayed[0]);
                    }
                } else if (
                    tur.singer.inNoteBlock in tur.singer.notePitches &&
                    tur.singer.notePitches[last(tur.singer.inNoteBlock)].length > 0
                ) {
                    obj = getNote(
                        tur.singer.notePitches[last(tur.singer.inNoteBlock)][0],
                        tur.singer.noteOctaves[last(tur.singer.inNoteBlock)][0],
                        0,
                        tur.singer.keySignature,
                        tur.singer.moveable,
                        null,
                        activity.errorMsg
                    );
                } else {
                    if (tur.singer.lastNotePlayed !== null) {
                        activity.errorMsg(INVALIDPITCH, blk);
                    }

                    obj = ["G", 4];
                }

                value =
                    pitchToNumber(obj[0], obj[1], tur.singer.keySignature) -
                    tur.singer.pitchNumberOffset;
                return value;
            }
        }
    }

    class PitchInHertzBlock extends ValueBlock {
        constructor() {
            //.TRANS: the current pitch expressed in Hertz
            super("pitchinhertz", _("pitch in hertz"));
            this.setPalette("pitch", activity);
            this.parameter = true;
            this.hidden = true;
            this.setHelpString([
                _("The Pitch in Hertz block is the value in Hertz of the pitch of the note currently being played."),
                "documentation",
                ""
            ]);
            this.beginnerBlock(true);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "pitchinhertz"]);
            } else {
                const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

                if (tur.singer.lastNotePlayed !== null) {
                    return logo.synth._getFrequency(
                        tur.singer.lastNotePlayed[0],
                        logo.synth.changeInTemperament
                    );
                }
            }
        }
    }

    class CurrentPitchBlock extends ValueBlock {
        constructor() {
            super("currentpitch", _("current pitch"));
            this.setPalette("pitch", activity);
            this.beginnerBlock(true);
            this.parameter = true;
            this.formBlock({ outType: "pitchout" });
            this.setHelpString([
                _("The Current Pitch block is used with the Pitch Converter block. In the example above, current pitch, sol 4, is displayed as 392 hertz."),
                "documentation",
                null,
                "currentpitchhelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            if (
                !logo.inStatusMatrix ||
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name !==
                    "outputtools"
            ) {
                if (tur.singer.lastNotePlayed !== null) {
                    return tur.singer.lastNotePlayed[0];
                }
            }

            if (tur.singer.lastNotePlayed === null) {
                return "G4";
            }
            return tur.singer.lastNotePlayed[0];
        }
    }

    class OutputToolsBlocks extends LeftBlock {
        constructor() {
            super("outputtools", _("pitch converter"));
            this.setPalette("pitch", activity);
            this.beginnerBlock(true);
            this.extraWidth = 50;
            this.setHelpString([
                _("This block converts the pitch value of the last note played into different formats such as hertz, letter name, pitch number, et al."),
                "documentation",
                null,
                "outputtoolshelp"
            ]);
            this.extraSearchTerms = [
                _("pitch number"),
                _("pitch in hertz"),
                _("letter class"),
                _("solfege class"),
                _("staff y"),
                _("solfege syllable"),
                _("pitch class"),
                _("scalar class"),
                _("scale degree"),
                _("nth degree"),
                _("pitch to shade"),
                _("pitch to color")
            ];
            this.formBlock({
                args: 1,
                argTypes: ["anyin"]
            });
            this.parameter = false;
            this.makeMacro((x, y) => [
                [0, ["outputtools", { value: "letter class" }], x, y, [null, 1, null]],
                [1, ["currentpitch"], 0, 0, [0]]
            ]);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "outputtools"]);
            } else {
                const cblk1 = activity.blocks.blockList[blk].connections[1];
                const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
                let arg1;
                let notePlayed;
                if (cblk1 != null) {
                    arg1 = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                }
                if (activity.blocks.blockList[cblk1].name === "notename") {
                    notePlayed = arg1 + (tur.singer.currentOctave ? tur.singer.currentOctave : 4);
                } else if (
                    activity.blocks.blockList[cblk1].name === "solfege" ||
                    activity.blocks.blockList[cblk1].name === "eastindiansolfege"
                ) {
                    let sol = arg1;
                    let attr;
                    if (sol.indexOf(SHARP) != -1) {
                        attr = SHARP;
                    } else if (sol.indexOf(FLAT) != -1) {
                        attr = FLAT;
                    } else if (sol.indexOf(DOUBLEFLAT) != -1) {
                        attr = DOUBLEFLAT;
                    } else if (sol.indexOf(DOUBLESHARP) != -1) {
                        attr = DOUBLESHARP;
                    } else {
                        attr = NATURAL;
                    }
                    if (attr != NATURAL) {
                        sol = sol.replace(attr, "");
                    }
                    notePlayed = FIXEDSOLFEGE[sol];
                    if (attr != NATURAL) {
                        notePlayed += attr;
                    }
                    notePlayed += tur.singer.currentOctave ? tur.singer.currentOctave : 4;
                } else if (activity.blocks.blockList[cblk1].name === "number") {
                    // less than 55 hertz (A1)
                    if (activity.blocks.blockList[cblk1].value < 55) {
                        const obj = numberToPitch(
                            activity.blocks.blockList[cblk1].value + tur.singer.pitchNumberOffset
                        );
                        notePlayed = obj[0] + obj[1];
                    } else {
                        notePlayed = arg1;
                    }
                } else if (activity.blocks.blockList[cblk1].name === "scaledegree2") {
                    notePlayed = scaleDegreeToPitchMapping(
                        tur.singer.keySignature,
                        activity.blocks.blockList[cblk1].value,
                        tur.singer.moveable,
                        null
                    );
                    notePlayed += tur.singer.currentOctave ? tur.singer.currentOctave : 4;
                } else {
                    if (typeof arg1 === "string") {
                        // Is it a number encoded as a string?
                        const foundNumber = Number(arg1);
                        if (isNaN(foundNumber)) {
                            // Check to see if the octave was included.
                            const lastChar = arg1.charAt(arg1.length - 1);
                            let foundOctave = "";
                            if ("12345678".indexOf(lastChar) !== -1) {
                                foundOctave = lastChar;
                                arg1 = arg1.slice(0, arg1.length - 1);
                            }
                            if (SOLFEGENAMES1.indexOf(arg1) !== -1) {
                                let sol = arg1;
                                let attr;
                                if (sol.indexOf(SHARP) != -1) {
                                    attr = SHARP;
                                } else if (sol.indexOf(FLAT) != -1) {
                                    attr = FLAT;
                                } else if (sol.indexOf(DOUBLEFLAT) != -1) {
                                    attr = DOUBLEFLAT;
                                } else if (sol.indexOf(DOUBLESHARP) != -1) {
                                    attr = DOUBLESHARP;
                                } else {
                                    attr = NATURAL;
                                }
                                if (attr != NATURAL) {
                                    sol = sol.replace(attr, "");
                                }
                                notePlayed = FIXEDSOLFEGE[sol];
                                if (attr != NATURAL) {
                                    notePlayed += attr;
                                }
                                if (foundOctave.length === 0) {
                                    notePlayed += tur.singer.currentOctave
                                        ? tur.singer.currentOctave
                                        : 4;
                                } else {
                                    notePlayed += foundOctave;
                                }
                            } else if (NOTENAMES1.indexOf(arg1) !== -1) {
                                if (foundOctave.length === 0) {
                                    notePlayed =
                                        arg1 +
                                        (tur.singer.currentOctave ? tur.singer.currentOctave : 4);
                                } else {
                                    notePlayed = arg1 + foundOctave;
                                }
                            } else if (ALLNOTENAMES.indexOf(arg1) !== -1) {
                                // Why would the accidental be "b or #"?
                                if (foundOctave.length === 0) {
                                    notePlayed =
                                        arg1 +
                                        (tur.singer.currentOctave ? tur.singer.currentOctave : 4);
                                } else {
                                    notePlayed = arg1 + foundOctave;
                                }
                            } else {
                                notePlayed = arg1;
                            }
                        } else {
                            // less than 55 hertz (A1)
                            if (foundNumber < 55) {
                                const obj = numberToPitch(
                                    foundNumber + tur.singer.pitchNumberOffset
                                );
                                notePlayed = obj[0] + obj[1];
                            } else {
                                notePlayed = foundNumber;
                            }
                        }
                    } else if (typeof arg1 === "number") {
                        // less than 55 hertz (A1)
                        if (activity.blocks.blockList[cblk1].value < 55) {
                            const obj = numberToPitch(
                                activity.blocks.blockList[cblk1].value +
                                    tur.singer.pitchNumberOffset
                            );
                            notePlayed = obj[0] + obj[1];
                        } else {
                            notePlayed = arg1;
                        }
                    } else {
                        notePlayed = arg1;
                    }
                }
                return getPitchInfo(
                    activity,
                    activity.blocks.blockList[blk].privateData,
                    notePlayed,
                    tur
                );
            }
        }
    }

    class MIDIBlock extends FlowBlock {
        constructor() {
            //.TRANS: MIDI is a technical standard for electronic music
            super("midi", _("MIDI"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "setpitchnumberoffset", x, y, [null, 1, 2, null]],
                [1, ["notename", { value: "C" }], 0, 0, [0]],
                [2, ["number", { value: -1 }], 0, 0, [0]]
            ]);
        }
    }

    class SetPitchNumberOffsetBlock extends FlowBlock {
        constructor() {
            //.TRANS: set an offset associated with the numeric piano keyboard mapping
            super("setpitchnumberoffset", _("set pitch number offset"));
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("The Set pitch number offset block is used to set the offset for mapping pitch numbers to pitch and octave."),
                "documentation",
                null,
                "pitchnumberhelp"
            ]);
            this.formBlock({
                args: 2,
                defaults: ["C", 4],
                argTypes: ["anyin", "anyin"],
                argLabels: [
                    //.TRANS: name2 is name as in name of pitch (JAPANESE ONLY)
                    this.lang === "ja" ? _("name2") : _("name"),
                    _("octave")
                ]
            });
            this.makeMacro((x, y) => [
                [0, "setpitchnumberoffset", x, y, [null, 1, 2, null]],
                [1, ["notename", { value: "C" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) activity.errorMsg(NOINPUTERRORMSG, blk);

            const arg0 = args[0] === null ? "C" : args[0];
            const arg1 = args[1] === null ? 4 : args[1];
            Singer.PitchActions.setPitchNumberOffset(arg0, arg1, turtle, activity);
        }
    }

    class Number2PitchBlock extends LeftBlock {
        constructor(name, displayName) {
            //.TRANS: convert piano key number (1-88) to pitch
            super(name || "number2pitch", displayName || _("number to pitch"));
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("The Number to pitch block will convert a pitch number to a pich name."),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [55]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            const num = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            try {
                const outType =
                    activity.blocks.blockList[blk].name === "number2pitch" ? "pitch" : "octave";
                return Singer.PitchActions.numToPitch(num, outType, turtle);
            } catch (e) {
                if (e === "NoArgError") {
                    activity.errorMsg(NOINPUTERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    // eslint-disable-next-line no-console
                    console.error(e);
                }
            }
        }
    }

    class Number2OctaveBlock extends Number2PitchBlock {
        constructor() {
            //.TRANS: convert piano key number (1-88) to octave
            super("number2octave", _("number to octave"));
            this.setHelpString([
                _("The Number to octave block will convert a pitch number to an octave."),
                "documentation",
                ""
            ]);
        }
    }

    class StaffYToPitch extends LeftBlock {
        constructor() {
            super("ytopitch", _("y to pitch"));
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("Y to pitch block will convert a staff y position to corresponding pitch notation."),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [50]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk0 = activity.blocks.blockList[blk].connections[0];
            const cblk1 = activity.blocks.blockList[blk].connections[1];

            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            const obj = keySignatureToMode(tur.singer.keySignature);
            const modeLength = MUSICALMODES[obj[1]].length;
            const thisScale = buildScale(tur.singer.keySignature)[0];

            let arg1 = 0;
            if (cblk1 !== null) {
                arg1 = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            }

            let posY = arg1 + YSTAFFNOTEHEIGHT / 2;
            const o = Math.floor(posY / YSTAFFOCTAVEHEIGHT);
            posY %= YSTAFFOCTAVEHEIGHT;
            const o2 = o + 4;
            let noteIdx = Math.floor(posY / YSTAFFNOTEHEIGHT);

            if (cblk0 === null) {
                if (cblk1 === null) {
                    return "G4";
                }
                while (noteIdx < 0) {
                    noteIdx += NOTENAMES.length;
                }
                const note = NOTENAMES[noteIdx];
                return note + o2;
            } else if (activity.blocks.blockList[cblk0].name == "pitchnumber") {
                if (cblk1 === null) {
                    return 7;
                }

                let lc = noteIdx;
                // Calculate the offset relative to the current key.
                const idx = NOTENAMES.indexOf(obj[0][0]);
                lc -= idx;
                if (lc < 0) {
                    lc += modeLength;
                }

                const thisNote = thisScale[lc];

                // Now that we have the note, look for its pitch number.
                lc = NOTESSHARP.indexOf(thisNote);
                if (lc === -1) {
                    lc = NOTESFLAT.indexOf(thisNote);
                }

                // Since we are using the staff, it is OK to assume 12
                // half-steps per octave.
                return lc + 12 * o;
            } else if (activity.blocks.blockList[cblk0].name == "nthmodalpitch") {
                if (cblk1 === null) {
                    return 5;
                }

                // Calculate the offset relative to the current key.
                let lc = noteIdx - NOTENAMES.indexOf(obj[0][0]);
                if (lc < 0) {
                    lc += modeLength;
                }
                return lc + o * modeLength;
            } else if (activity.blocks.blockList[cblk0].name == "print") {
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, "ytopitch"]);
                }
                if (cblk1 === null) {
                    return "G4";
                }
                while (noteIdx < 0) {
                    noteIdx += NOTENAMES.length;
                }
                const note = NOTENAMES[noteIdx];
                return note + o2;
            } else if (activity.blocks.blockList[cblk0].name == "pitch") {
                if (cblk1 === null) {
                    return ["sol", 4];
                }

                // Calculate the offset relative to the current key.
                let lc = noteIdx - NOTENAMES.indexOf(obj[0][0]);
                if (lc < 0) {
                    lc += modeLength;
                }
                return [thisScale[lc], o2];
            } else {
                if (cblk1 === null) {
                    return "G4";
                }
                while (noteIdx < 0) {
                    noteIdx += NOTENAMES.length;
                }
                const note = NOTENAMES[noteIdx];
                return note + o2;
            }
        }
    }

    class AccidentalNameBlock extends ValueBlock {
        constructor() {
            super("accidentalname", _("accidental selector"));
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("The Accidental selector block is used to choose between double-sharp, sharp, natural, flat, and double-flat."),
                "documentation",
                ""
            ]);
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
        }
    }

    class EastIndianSolfegeBlock extends ValueBlock {
        constructor() {
            super("eastindiansolfege", _("east indian solfege"));
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("Pitch can be specified in terms of ni dha pa ma ga re sa."),
                "documentation",
                null,
                "eihelp"
            ]);
            this.formBlock({ outType: "solfegeout" });
        }
    }

    class NoteNameBlock extends ValueBlock {
        constructor() {
            super("notename", _("note name"));
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("Pitch can be specified in terms of C D E F G A B."),
                "documentation",
                null,
                "note2"
            ]);
            this.formBlock({ outType: "noteout" });
        }
    }

    class SolfegeBlock extends ValueBlock {
        constructor() {
            super("solfege", _("solfege"));
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("Pitch can be specified in terms of do re mi fa sol la ti."),
                "documentation",
                null,
                "note1"
            ]);
            this.formBlock({ outType: "solfegeout" });
        }
    }

    class CustomNoteBlock extends ValueBlock {
        constructor() {
            super("customNote");
            this.setPalette("pitch", activity);
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                return;
            } else {
                const note = args[0];
                const octave = args[1];
                return Singer.processPitch(activity, note, octave, 0);
            }
        }
    }

    class Invert1Block extends FlowClampBlock {
        constructor() {
            super("invert1");
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("The Invert block rotates any contained notes around a target note."),
                "documentation",
                null,
                "inverthelp"
            ]);
            this.formBlock({
                //.TRANS: pitch inversion rotates a pitch around another pitch
                name: _("invert"),
                args: 3,
                defaults: ["sol", 4, _("even")],
                argTypes: ["solfegein", "anyin", "anyin"],
                argLabels: [
                    this.lang === "ja" ? _("name2") : _("name"),
                    _("octave"),
                    //.TRANS: invert based on even or odd number or musical scale
                    _("even") + "/" + _("odd") + "/" + _("scalar")
                ]
            });
            this.makeMacro((x, y) => [
                [0, "invert1", x, y, [null, 1, 2, 3, null, 4]],
                [1, ["solfege", { value: "sol" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]],
                [3, ["invertmode", { value: "even" }], 0, 0, [0]],
                [4, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[3] === undefined) return;

            if (args[0] === null || args[1] === null || args[2] === null)
                activity.errorMsg(NOINPUTERRORMSG, blk);

            const arg0 = args[0] === null ? "sol" : args[0];
            const arg1 = args[1] === null ? 4 : args[1];
            const arg2 = args[2] === null ? "even" : args[2];

            Singer.PitchActions.invert(arg0, arg1, arg2, turtle, blk);

            return [args[3], 1];
        }
    }

    class Invert2Block extends FlowClampBlock {
        constructor(name, displayName) {
            //.TRANS: pitch inversion rotates a pitch around another pitch (odd number)
            super(name || "invert2", displayName || _("invert (odd)"));
            this.setPalette("pitch", activity);
            this.formBlock({
                args: 2,
                defaults: ["sol", 4],
                argTypes: ["solfegein", "anyin"],
                argLabels: [_("note"), _("octave")]
            });
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (activity.blocks.blockList[blk].name === "invert") {
                tur.singer.invertList.push([args[0], args[1], "even"]);
            } else {
                tur.singer.invertList.push([args[0], args[1], "odd"]);
            }
            const listenerName = "_invert_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => tur.singer.invertList.pop();
            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[2], 1];
        }
    }

    class InvertBlock extends Invert2Block {
        constructor() {
            //.TRANS: pitch inversion rotates a pitch around another pitch (even number)
            super("invert", _("invert (even)"));
            this.setPalette("pitch", activity);
            this.formBlock({
                args: 2,
                defaults: ["sol", 4],
                argTypes: ["solfegein", "anyin"],
                argLabels: [_("note"), _("octave")]
            });
            this.makeMacro((x, y) => [
                [0, "invert", x, y, [null, 1, 2, null, 3]],
                [1, ["solfege", { value: "sol" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = true;
        }
    }

    class RegisterBlock extends FlowBlock {
        constructor() {
            //.TRANS: register is the octave of the current pitch
            super("register", _("register"));
            this.setPalette("pitch", activity);
            this.piemenuValuesC1 = [-3, -2, -1, 0, 1, 2, 3];
            this.setHelpString([
                _("The Register block provides an easy way to modify the register (octave) of the notes that follow it."),
                "documentation",
                null,
                "registerhelp"
            ]);
            this.formBlock({
                args: 1,
                defaults: [0]
            });
        }

        flow(args, logo, turtle) {
            if (args[0] !== null && typeof args[0] === "number") {
                Singer.PitchActions.setRegister(args[0], turtle);
            }
        }
    }

    class SetTranspositionBlock extends FlowClampBlock {
        constructor() {
            super("settransposition");
            this.setPalette("pitch", activity);
            this.piemenuValuesC1 = [
                -12,
                -11,
                -10,
                -9,
                -8,
                -7,
                -6,
                -5,
                -4,
                -3,
                -2,
                -1,
                0,
                1,
                2,
                3,
                4,
                5,
                6,
                7,
                8,
                9,
                10,
                11,
                12
            ];
            this.setHelpString([
                _("The Semi-tone transposition block will shift the pitches contained inside Note blocks up (or down) by half steps.") +
                    " " +
                    _("In the example shown above, sol is shifted up to sol#."),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: adjust the amount of shift (up or down) of a pitch
                name: _("semi-tone transpose"),
                args: 1,
                defaults: ["1"]
            });
            this.makeMacro((x, y) => [
                [0, "settransposition", x, y, [null, 1, 6, 7]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, ["number", { value: 12 }], 0, 0, [3]],
                [6, "vspace", 0, 0, [0, null]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            if (args[0] !== null && typeof args[0] === "number") {
                Singer.PitchActions.setSemitoneTranspose(args[0], turtle, blk);

                return [args[1], 1];
            }
        }
    }


    class SetRatioTranspositionBlock extends FlowClampBlock {
        constructor() {
            super("setratio");
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("The Ratio transposition block will shift the pitches contained inside Note blocks up (or down) by a ratio"),
                "documentation",
                ""
            ]);
            this.formBlock({
                //.TRANS: adjust the amount of shift (up or down) of a pitch
                name: _("ratio transpose"),
                args: 1,
                defaults: [3 / 2]
            });
            this.makeMacro((x, y) => [
                [0, "setratio", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 3 }], 0, 0, [1]],
                [3, ["number", { value: 2 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            if (args[0] !== null && typeof args[0] === "number" && args[0] > 0) {
                Singer.PitchActions.setRatioTranspose(args[0], turtle, blk);

                return [args[1], 1];
            }
        }
    }

    class OctaveBlock extends FlowBlock {
        constructor() {
            //.TRANS: adjusts the shift up or down by one octave (twelve half-steps in the interval between two notes, one having twice or half the frequency in Hz of the other.)
            super("octave", _("octave"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "settransposition", x, y, [null, 1, 4, 5]],
                [1, "multiply", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 12 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class CustomPitchBlock extends FlowBlock {
        constructor() {
            super("custompitch", _("custom pitch"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "pitch", x, y, [null, 1, 2, null]],
                [1, ["customNote", { value: "C(+0%)" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]]
            ]);
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
            } else {
                return Singer.PitchActions.playPitch(args[0], args[1], 0, turtle, blk);
            }
        }
    }

    class DownSixthBlock extends FlowBlock {
        constructor() {
            //.TRANS: down sixth means the note is five scale degrees below current note
            super("downsixth", _("down sixth"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "minus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: -5 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class DownThirdBlock extends FlowBlock {
        constructor() {
            //.TRANS: down third means the note is two scale degrees below current note
            super("downthird", _("down third"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "minus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: -2 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class SeventhBlock extends FlowBlock {
        constructor() {
            //.TRANS: seventh means the note is the six scale degrees above current note
            super("seventh", _("seventh"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 6 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class SixthBlock extends FlowBlock {
        constructor() {
            //.TRANS: sixth means the note is the five scale degrees above current note
            super("sixth", _("sixth"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 5 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class FifthBlock extends FlowBlock {
        constructor() {
            //.TRANS: fifth means the note is the four scale degrees above current note
            super("fifth", _("fifth"));
            this.setPalette("pitch", activity);
            this.beginnerBlock(true);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 4 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class FourthBlock extends FlowBlock {
        constructor() {
            //.TRANS: fourth means the note is three scale degrees above current note
            super("fourth", _("fourth"));
            this.setPalette("pitch", activity);
            this.beginnerBlock(true);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 7]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 3 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, null]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class ThirdBlock extends FlowBlock {
        constructor() {
            //.TRANS: third means the note is two scale degrees above current note
            super("third", _("third"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 2 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class SecondBlock extends FlowBlock {
        constructor() {
            //.TRANS: second means the note is one scale degree above current note
            super("second", _("second"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class UnisonBlock extends FlowBlock {
        constructor() {
            //.TRANS: unison means the note is the same as the current note
            super("unison", _("unison"));
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, 6, 8]],
                [1, "plus", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 0 }], 0, 0, [1]],
                [3, "multiply", 0, 0, [1, 4, 5]],
                [4, ["number", { value: 0 }], 0, 0, [3]],
                [5, "modelength", 0, 0, [3]],
                [6, "vspace", 0, 0, [0, 7]],
                [7, "vspace", 0, 0, [6, null]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    class SetScalarTranspositionBlock extends FlowClampBlock {
        constructor() {
            super("setscalartransposition");
            this.setPalette("pitch", activity);
            this.piemenuValuesC1 = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
            this.setHelpString([
                _("The Scalar transposition block will shift the pitches contained inside Note blocks up (or down) the scale.") +
                    " " +
                    _("In the example shown above, sol is shifted up to la."),
                "documentation",
                null,
                "scalartranshelp"
            ]);
            this.formBlock({
                //.TRANS: adjust the amount of shift (up or down) of a pitch by musical scale (scalar) steps
                name: _("scalar transpose") + " (+/–)",
                args: 1,
                defaults: ["1"]
            });
            this.makeMacro((x, y) => [
                [0, "setscalartransposition", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
            // Note: Inverted to usual; only appears in beginner mode.
            if (!activity.beginnerMode || !this.beginnerModeBlock) {
                this.hidden = true;
            }
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let transValue = args[0];
            if (transValue === null || typeof transValue !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                transValue = 0;
            }

            Singer.PitchActions.setScalarTranspose(transValue, turtle, blk);

            return [args[1], 1];
        }
    }

    class AccidentalBlock extends FlowClampBlock {
        constructor() {
            super("accidental");
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("The Accidental block is used to create sharps and flats"),
                "documentation",
                null,
                "accidental"
            ]);
            this.formBlock({
                //.TRANS: An accidental is a modification to a pitch, e.g., sharp or flat.
                name: _("accidental override"),
                args: 1
            });
            this.makeMacro((x, y) => [
                [0, "accidental", x, y, [null, 11, 1, 10]],
                [1, "newnote", x, y, [0, 2, 5, 9]],
                [2, "divide", 0, 0, [1, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [1, 6]],
                [6, "pitch", 0, 0, [5, 7, 8, null]],
                [7, ["solfege", { value: "sol" }], 0, 0, [6]],
                [8, ["number", { value: 4 }], 0, 0, [6]],
                [9, "hidden", 0, 0, [1, null]],
                [10, "hidden", 0, 0, [0, null]],
                [11, ["accidentalname", { value: "natural" + " ♮" }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let arg = args[0];
            if (arg === null || typeof arg !== "string") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = "sharp";
            }

            Singer.PitchActions.setAccidental(arg, turtle, blk);

            return [args[1], 1];
        }
    }

    class FlatBlock extends FlowClampBlock {
        constructor() {
            super("flat");
            this.setPalette("pitch", activity);
            //.TRANS: flat is a half-step down in pitch
            this.formBlock({ name: _("flat") + " ♭" });
            this.makeMacro((x, y) => [
                [0, "accidental", x, y, [null, 11, 1, 10]],
                [1, "newnote", x, y, [0, 2, 5, 9]],
                [2, "divide", 0, 0, [1, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [1, 6]],
                [6, "pitch", 0, 0, [5, 7, 8, null]],
                [7, ["solfege", { value: "sol" }], 0, 0, [6]],
                [8, ["number", { value: 4 }], 0, 0, [6]],
                [9, "hidden", 0, 0, [1, null]],
                [10, "hidden", 0, 0, [0, null]],
                [11, ["accidentalname", { value: "flat" + " ♭" }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) return;

            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));
            tur.singer.transposition += tur.singer.invertList.length > 0 ? 1 : -1;

            const listenerName = "_flat_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) =>
                (tur.singer.transposition += tur.singer.invertList.length > 0 ? -1 : 1);

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class SharpBlock extends FlowClampBlock {
        constructor() {
            super("sharp");
            this.setPalette("pitch", activity);
            //.TRANS: sharp is a half-step up in pitch
            this.formBlock({ name: _("sharp") + " ♯" });
            this.makeMacro((x, y) => [
                [0, "accidental", x, y, [null, 11, 1, 10]],
                [1, "newnote", x, y, [0, 2, 5, 9]],
                [2, "divide", 0, 0, [1, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [1, 6]],
                [6, "pitch", 0, 0, [5, 7, 8, null]],
                [7, ["solfege", { value: "sol" }], 0, 0, [6]],
                [8, ["number", { value: 4 }], 0, 0, [6]],
                [9, "hidden", 0, 0, [1, null]],
                [10, "hidden", 0, 0, [0, null]],
                [11, ["accidentalname", { value: "sharp" + " ♯" }], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) return;

            Singer.PitchActions.setSharp(turtle, blk);

            return [args[0], 1];
        }
    }

    class HertzBlock extends FlowBlock {
        constructor() {
            //.TRANS: a measure of frequency: one cycle per second
            super("hertz", _("hertz"));
            this.setPalette("pitch", activity);
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Hertz block (in combination with a Number block) will play a sound at the specified frequency."),
                "documentation",
                null,
                "note3"
            ]);
            this.formBlock({
                args: 1,
                defaults: [this.lang === "ja" ? 440 : 392]
            });
        }

        flow(args, logo, turtle, blk) {
            let arg = args[0];
            if (arg === null || typeof arg !== "number" || arg <= 0) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 392;
            }

            const obj = frequencyToPitch(arg);

            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            if (obj[0] === "?") {
                activity.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
            } else if (logo.inMatrix) {
                logo.phraseMaker.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.phraseMaker.rowLabels.push(activity.blocks.blockList[blk].name);
                logo.phraseMaker.rowArgs.push(arg.toFixed(0));
                // convert hertz to note/octave
                const note = obj;
                tur.singer.lastNotePlayed = [note[0] + note[1], 4];
            } else if (logo.inMusicKeyboard) {
                logo.musicKeyboard.instruments.push(last(tur.singer.instrumentNames));
                logo.musicKeyboard.noteNames.push("hertz");
                logo.musicKeyboard.octaves.push(arg);
                logo.musicKeyboard.addRowBlock(blk);
                // convert hertz to note/octave
                const note = obj;
                tur.singer.lastNotePlayed = [note[0] + note[1], 4];
            } else if (logo.inPitchStaircase) {
                const frequency = arg;
                const note = obj;
                let flag = 0;

                for (let i = 0; i < logo.pitchStaircase.Stairs.length; i++) {
                    if (logo.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                        logo.pitchStaircase.Stairs.splice(i, 0, [
                            note[0],
                            note[1],
                            parseFloat(frequency)
                        ]);
                        flag = 1;
                        return;
                    }
                    if (logo.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                        logo.pitchStaircase.Stairs.splice(i, 1, [
                            note[0],
                            note[1],
                            parseFloat(frequency)
                        ]);
                        flag = 1;
                        return;
                    }
                }

                if (flag === 0) {
                    logo.pitchStaircase.Stairs.push([note[0], note[1], parseFloat(frequency)]);
                }

                logo.pitchStaircase.stairPitchBlocks.push(blk);
            } else if (logo.inPitchSlider) {
                logo.pitchSlider.frequencies.push(args[0]);
            } else {
                try {
                    return Singer.PitchActions.playHertz(arg, turtle, blk);
                } catch (e) {
                    if (e === "NoNoteError") {
                        activity.errorMsg(_("Hertz Block: Did you mean to use a Note block?"), blk);
                    } else {
                        // eslint-disable-next-line no-console
                        console.error(e);
                    }
                }
            }
        }
    }

    class PitchNumberBlock extends FlowBlock {
        constructor() {
            //.TRANS: a mapping of pitch to the 88 piano keys
            super("pitchnumber", _("pitch number"));
            this.setPalette("pitch", activity);
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Pitch Number block will play a pitch associated by its number, e.g. 0 for C and 7 for G."),
                "documentation",
                null,
                "note5"
            ]);
            this.formBlock({
                args: 1,
                defaults: [7]
            });
        }

        flow(args, logo, turtle, blk) {
            let arg0;
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = 7; // set default value to 7th semitone
            } else if (typeof args[0] !== "number") {
                activity.errorMsg(NANERRORMSG, blk);
                arg0 = 7;
            } else {
                // If args[0] is a float value then round-off to the nearest integer
                arg0 = Math.round(args[0]);
            }

            return Singer.PitchActions.playPitchNumber(arg0, turtle, blk);
        }
    }

    // Used as a support for older projects. New implementation is NthModalPitch
    class ScaleDegreeBlock extends FlowBlock {
        constructor() {
            //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
            super("scaledegree", _("nth modal pitch"));
            this.setPalette("pitch", activity);
            this.setHelpString([
                _("n^th Modal Pitch takes the pattern of pitches in semitones for a mode and makes each point a degree of the mode,") +
                    " " +
                    _("starting from 1 and regardless of tonal framework (i.e. not always 8 notes in the octave)"),
                "documentation",
                ""
            ]);
            // No need to show this in the palette
            this.hidden = true;
            this.formBlock({
                args: 2,
                defaults: [4, 4], // 4 is G in C Major
                argLabels: [_("number"), _("octave")],
                argTypes: ["numberin", "anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            // Default value is G4 or (sol, 4)

            const arg0 = args[0] !== null ? args[0] : "sol";
            const arg1 = args[1] !== null ? args[1] : 4;

            if (args[0] === null || args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
            }

            if (typeof arg0 === "number") {
                return Singer.PitchActions.playNthModalPitch(arg0, arg1, turtle, blk);
            } else {
                activity.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
                return;
            }
        }
    }

    class NthModalPitchBlock extends FlowBlock {
        constructor() {
            //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
            super("nthmodalpitch", _("nth modal pitch"));
            this.setPalette("pitch", activity);
            this.piemenuValuesC1 = [7, 6, 5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6, -7];
            this.setHelpString([
                _("N^th Modal Pitch takes a number as an input as the n^th degree for the given mode. 0 is the first position, 1 is the second, -1 is the note before the first etc.") +
                    " " +
                    _("The pitches change according to the mode specified without any need for respellings."),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 2,
                defaults: [4, 4], // 4 is G in C Major
                argLabels: [_("number"), _("octave")],
                argTypes: ["numberin", "anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            // Default value is G4 or (sol, 4)

            const arg0 = args[0] !== null ? args[0] : "sol";
            const arg1 = args[1] !== null ? args[1] : 4;

            if (args[0] === null || args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
            }

            if (typeof arg0 === "number") {
                return Singer.PitchActions.playNthModalPitch(arg0, arg1, turtle, blk);
            } else {
                activity.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
                return;
            }
        }
    }

    class ScaleDegree2Block extends ValueBlock {
        constructor() {
            //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
            super("scaledegree2", _("scale degree"));
            this.setPalette("pitch", activity);
            this.extraWidth = 10;
            this.setHelpString([
                _("Scale Degree is a common convention in music. Scale Degree offers seven possible positions in the scale (1-7) and can be modified via accidentals.") +
                    " " +
                    _("Scale Degree 1 is always the first pitch in a given scale, regardless of octave."),
                "documentation",
                ""
            ]);
            this.formBlock({
                outType: "scaledegreeout"
            });
            this.makeMacro((x, y) => [
                [0, "pitch", x, y, [null, 1, 2, null]],
                [1, ["scaledegree2", { value: "5" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]]
            ]);
        }

        arg(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }
    }

    class StepPitchBlock extends FlowBlock {
        constructor() {
            //.TRANS: step some number of notes in current musical scale
            super("steppitch", _("scalar step") + " (+/–)");
            this.setPalette("pitch", activity);
            this.piemenuValuesC1 = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Scalar Step block (in combination with a Number block) will play the next pitch in a scale,") +
                    " " +
                    _("eg if the last note played was sol, Scalar Step 1 will play la."),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [1],
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            return Singer.PitchActions.stepPitch(args[0], turtle, blk);
        }
    }

    class Pitch2Block extends FlowBlock {
        constructor() {
            super("pitch2", _("pitch") + " " + "G4");
            this.setPalette("pitch", activity);
            this.makeMacro((x, y) => [
                [0, "pitch", x, y, [null, 1, 2, null]],
                [1, ["notename", { value: "G" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]]
            ]);
        }
    }

    class PitchBlock extends FlowBlock {
        constructor() {
            //.TRANS: we specify pitch in terms of a name and an octave. The name can be CDEFGAB or Do Re Mi Fa Sol La Ti. Octave is a number between 1 and 8.
            super("pitch", _("pitch"));
            this.setPalette("pitch", activity);
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Pitch block specifies the pitch name and octave of a note that together determine the frequency of the note."),
                "documentation",
                null,
                "note1"
            ]);
            this.formBlock({
                args: 2,
                defaults: ["sol", 4],
                argTypes: ["solfegein", "anyin"],
                argLabels: [this.lang === "ja" ? _("name2") : _("name"), _("octave")]
            });
        }

        flow(args, logo, turtle, blk) {
            // Default value is G4 or (sol, 4)
            let arg0 = args[0] !== null ? args[0] : "sol";
            let arg1 = args[1] !== null ? args[1] : 4;
            // is arg0 of the form C,4 or sol,5
            if (typeof arg0 === "object") {
                arg1 = arg0[1];
                arg0 = arg0[0];
            }

            if (arg0 === null || arg1 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
            }

            const tur = activity.turtles.ithTurtle(activity.turtles.companionTurtle(turtle));

            let note, octave, cents;

            // Is the arg a scaledegree block?
            const c = activity.blocks.blockList[blk].connections[1];
            let cname = null;
            if (c !== null) {
                cname = activity.blocks.blockList[c].name;
            }

            if (cname === "scaledegree2" || !isNaN(Number(arg0[0])) || !isNaN(Number(arg0[1]))) {
                let scaledegree = activity.blocks.blockList[c].value;
                let attr;

                if (scaledegree.indexOf(SHARP) !== -1) {
                    attr = SHARP;
                } else if (scaledegree.indexOf(FLAT) !== -1) {
                    attr = FLAT;
                } else if (scaledegree.indexOf(DOUBLESHARP) !== -1) {
                    attr = DOUBLESHARP;
                } else if (scaledegree.indexOf(DOUBLEFLAT) !== -1) {
                    attr = DOUBLEFLAT;
                } else {
                    attr = NATURAL;
                }

                scaledegree = Number(scaledegree.replace(attr, ""));
                if (attr != NATURAL) {
                    note += attr;
                }

                const obj = keySignatureToMode(tur.singer.keySignature);

                const isNegativeArg = scaledegree <= 0 ? true : false;
                let sd;
                if (isNegativeArg) {
                    const multiplier = Math.floor(Math.abs(scaledegree) / 7);
                    sd = scaledegree + (multiplier + 1) * 7;
                } else {
                    sd = Math.floor(scaledegree) % 7;
                    if (sd == 0) sd = 7;
                }
                scaledegree = Math.abs(scaledegree);

                let ref = NOTESTEP[obj[0].substr(0, 1)] - 1;
                if (obj[0].substr(1) === FLAT) {
                    ref--;
                } else if (obj[0].substr(1) === SHARP) {
                    ref++;
                }
                note = scaleDegreeToPitchMapping(
                    tur.singer.keySignature,
                    sd,
                    tur.singer.moveable,
                    null
                );
                let semitones = ref;

                semitones +=
                    NOTESFLAT.indexOf(note) !== -1
                        ? NOTESFLAT.indexOf(note) - ref
                        : NOTESSHARP.indexOf(note) - ref;

                /** calculates changes in reference octave which occur a semitone before the reference key */
                const deltaOctave = isNegativeArg
                    ? Math.floor((scaledegree + 1) / 7)
                    : Math.floor((scaledegree - 1) / 7);

                /** calculates changes in octave when crossing B */
                const deltaSemi = isNegativeArg
                    ? semitones > ref
                        ? 1
                        : 0
                    : semitones < ref
                        ? 1
                        : 0;

                octave =
                    (isNegativeArg ? -1 : 1) * (deltaOctave + deltaSemi) +
                    Math.floor(
                        calcOctave(tur.singer.currentOctave, arg1, tur.singer.lastNotePlayed, note)
                    );
                cents = 0;
            } else if (typeof arg0 === "number" || !isNaN(Number(arg0))) {
                arg0 = Number(arg0);

                // We interpret numbers two different ways:
                //  (1) a positive integer between 1 and 12 is taken to be a moveable solfege, e.g. 1 : do, 2 : re ...
                //  (2) if frequency is input, ignore octave (arg1)
                // Negative numbers will throw an error.

                if (arg0 <= 12) {
                    // moveable solfege
                    if (arg0 < 1) {
                        activity.errorMsg(INVALIDPITCH, blk);
                        arg0 = 7; // set default value to 7th semitone
                    }

                    note = nthDegreeToPitch(tur.singer.keySignature, Math.round(arg0));
                    octave = Math.floor(
                        calcOctave(tur.singer.currentOctave, arg1, tur.singer.lastNotePlayed, note)
                    );
                    cents = 0;
                } else {
                    if (arg0 < A0 || arg0 > C8) {
                        activity.errorMsg(INVALIDPITCH, blk);
                        arg0 = 392; // set default to 392 hertz (G4)
                    }

                    [note, octave, cents] = frequencyToPitch(arg0);
                }
            } else {
                // If 1st arg is a random block with solfeges, arg0 is an array as [note, octave]
                if (typeof arg0 === "object") {
                    arg1 = arg0[1];
                    arg0 = arg0[0];
                }

                // Check if string ends with accidental
                if (
                    SOLFEGENAMES1.indexOf(arg0.toLowerCase()) !== -1 ||
                    NOTENAMES1.indexOf(arg0.toUpperCase()) !== -1
                ) {
                    // Store accidental
                    let accSym = arg0.charAt(arg0.length - 1);
                    if ([SHARP, FLAT, DOUBLESHARP, DOUBLEFLAT].indexOf(accSym) === -1) {
                        accSym = NATURAL;
                    } else {
                        arg0 = arg0.substr(0, arg0.length - 1);
                    }
                    note =
                        NOTENAMES.indexOf(arg0.toUpperCase()) !== -1
                            ? SOLFEGECONVERSIONTABLE[arg0.toUpperCase()]
                            : arg0;
                    note = accSym !== NATURAL ? note + accSym : note; // add accidental

                    octave = Math.floor(
                        calcOctave(tur.singer.currentOctave, arg1, tur.singer.lastNotePlayed, note)
                    );
                    cents = 0;
                } else {
                    octave = calcOctave(
                        tur.singer.currentOctave,
                        arg1,
                        tur.singer.lastNotePlayed,
                        arg0
                    );

                    // Octave must be an integer in [0, 9]
                    [note, octave, cents] = [arg0, Math.floor(Math.min(9, Math.max(0, octave))), 0];
                }
            }

            return Singer.PitchActions.playPitch(note, octave, cents, turtle, blk);
        }
    }

    new ConsonantStepSizeDownBlock().setup(activity);
    new ConsonantStepSizeUpBlock().setup(activity);
    new RestBlock().setup(activity);
    new SquareBlock().setup(activity);
    new TriangleBlock().setup(activity);
    new SineBlock().setup(activity);
    new SawtoothBlock().setup(activity);
    new InvertModeBlock().setup(activity);
    new TranspositionFactorBlock().setup(activity);
    new DeltaPitchBlock().setup(activity);
    new DeltaPitch2Block().setup(activity);
    new MyPitchBlock().setup(activity);
    new PitchInHertzBlock().setup(activity);
    new Number2PitchBlock().setup(activity);
    new Number2OctaveBlock().setup(activity);
    new StaffYToPitch().setup(activity);
    new OutputToolsBlocks().setup(activity);
    new CurrentPitchBlock().setup(activity);
    new CustomNoteBlock().setup(activity);
    new MIDIBlock().setup(activity);
    new SetPitchNumberOffsetBlock().setup(activity);
    new Invert1Block().setup(activity);
    new Invert2Block().setup(activity);
    new InvertBlock().setup(activity);
    new RegisterBlock().setup(activity);
    new SetRatioTranspositionBlock().setup(activity);
    new SetTranspositionBlock().setup(activity);
    new OctaveBlock().setup(activity);
    new DownSixthBlock().setup(activity);
    new DownThirdBlock().setup(activity);
    new SeventhBlock().setup(activity);
    new SixthBlock().setup(activity);
    new FifthBlock().setup(activity);
    new FourthBlock().setup(activity);
    new ThirdBlock().setup(activity);
    new SecondBlock().setup(activity);
    new UnisonBlock().setup(activity);
    new SetScalarTranspositionBlock().setup(activity);
    new AccidentalNameBlock().setup(activity);
    new AccidentalBlock().setup(activity);
    new FlatBlock().setup(activity);
    new SharpBlock().setup(activity);
    new ScaleDegree2Block().setup(activity);
    new EastIndianSolfegeBlock().setup(activity);
    new NoteNameBlock().setup(activity);
    new SolfegeBlock().setup(activity);
    new HertzBlock().setup(activity);
    new PitchNumberBlock().setup(activity);
    new ScaleDegreeBlock().setup(activity);
    new NthModalPitchBlock().setup(activity);
    new StepPitchBlock().setup(activity);
    new CustomPitchBlock().setup(activity);
    new Pitch2Block().setup(activity);
    new PitchBlock().setup(activity);
}
