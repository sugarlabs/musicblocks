function setupPitchBlocks() {
    class RestBlock extends ValueBlock {
        constructor() {
            super("rest");
            this.setPalette("pitch");
            this.hidden = this.deprecated = true;
        }
    }

    class SquareBlock extends FlowBlock {
        constructor() {
            super("square", _("square"));
            this.setPalette("pitch");
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
            Singer.playSynthBlock(args, logo, turtle, blk);
        }
    }

    class TriangleBlock extends FlowBlock {
        constructor() {
            super("triangle", _("triangle"));
            this.setPalette("pitch");
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
            Singer.playSynthBlock(args, logo, turtle, blk);
        }
    }

    class SineBlock extends FlowBlock {
        constructor() {
            super("sine", _("sine"));
            this.setPalette("pitch");
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
            Singer.playSynthBlock(args, logo, turtle, blk);
        }
    }

    class SawtoothBlock extends FlowBlock {
        constructor() {
            super("sawtooth", _("sawtooth"));
            this.setPalette("pitch");
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
            this.setPalette("pitch");
            this.formBlock({ outType: "textout" });
            this.hidden = true;
        }
    }

    class TranspositionFactorBlock extends ValueBlock {
        constructor() {
            //.TRANS: musical transposition (adjustment of pitch up or down)
            super("transpositionfactor", _("transposition"));
            this.setPalette("pitch");
            this.hidden = true;
            this.parameter = true;
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "transposition"]);
            } else {
                return logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle)).singer.transposition;
            }
        }
    }

    class ConsonantStepSizeDownBlock extends ValueBlock {
        constructor() {
            //.TRANS: step down one note in current musical scale
            super("consonantstepsizedown", _("scalar step down"));
            this.setPalette("pitch");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Scalar step down block returns the number of semi-tones down to the previous note in the current key and mode."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle) {
            return Singer.PitchActions.consonantStepSize("down", turtle);
        }
    }

    class ConsonantStepSizeUpBlock extends ValueBlock {
        constructor() {
            //.TRANS: step up one note in current musical scale
            super("consonantstepsizeup", _("scalar step up"));
            this.setPalette("pitch");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Scalar step up block returns the number of semi-tones up to the next note in the current key and mode."
                ),
                "documentation",
                ""
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle) {
            return Singer.PitchActions.consonantStepSize("up", turtle);
        }
    }

    class DeltaPitchBlock extends ValueBlock {
        constructor(name, displayName) {
            //.TRANS: the change measured in half-steps between the current pitch and the previous pitch
            super(name || "deltapitch", displayName || _("change in pitch"));
            this.setPalette("pitch");
            this.parameter = true;
            this.setHelpString([
                _(
                    "The Change in pitch block is the difference (in half steps) between the current pitch being played and the previous pitch played."
                ),
                "documentation",
                null,
                "deltapitchhelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "mypitch"]);
            }

            return Singer.PitchActions.deltaPitch(logo.blocks.blockList[blk].name, turtle);
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
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.parameter = true;
            this.hidden = true;
            this.setHelpString([
                _(
                    "The Pitch number block is the value of the pitch of the note currently being played."
                ),
                "documentation",
                null,
                "everybeathelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        setter(logo, value, turtle, blk) {
            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            tur.singer.previousNotePlayed = tur.singer.lastNotePlayed;
            let obj = numberToPitch(Math.floor(value) + tur.singer.pitchNumberOffset);
            tur.singer.lastNotePlayed = [obj[0] + obj[1], tur.singer.lastNotePlayed[1]];
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "mypitch"]);
            } else {
                let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

                let value = null;
                let obj;
                if (tur.singer.lastNotePlayed !== null) {
                    if (typeof tur.singer.lastNotePlayed[0] === "string") {
                        let len = tur.singer.lastNotePlayed[0].length;
                        let pitch = tur.singer.lastNotePlayed[0].slice(
                            0,
                            len - 1
                        );
                        let octave = parseInt(tur.singer.lastNotePlayed[0].slice(len - 1));
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
                        logo.errorMsg
                    );
                } else {
                    if (tur.singer.lastNotePlayed !== null) {
                        console.debug("Cannot find a note ");
                        logo.errorMsg(INVALIDPITCH, blk);
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
            this.setPalette("pitch");
            this.parameter = true;
            this.hidden = true;
            this.setHelpString([
                _(
                    "The Pitch in Hertz block is the value in Hertz of the pitch of the note currently being played."
                ),
                "documentation",
                ""
            ]);
            this.beginnerBlock(true);
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "pitchinhertz"]);
            } else {
                let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

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
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.parameter = true;
            this.formBlock({ outType: "pitchout" });
        }

        updateParameter(logo, turtle, blk) {
            return logo.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "outputtools"
            ) {
            } else {
                let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

                if (tur.singer.lastNotePlayed !== null) {
                    return tur.singer.lastNotePlayed[0];
                }
            }
        }
    }


    class OutputToolsBlocks extends LeftBlock {
        constructor() {
            super("outputtools");
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.extraWidth = 40;
            this.setHelpString([
                _("This block converts the pitch value of the last note played into different formats such as hertz, letter name, pitch number, et al."),
                "documentation",
                null,
                "outputtoolshelp"
            ]);
            this.formBlock({
                args: 1,
                argTypes: ["anyin"]
            });
            this.parameter = false;
            this.makeMacro((x, y) => [
                [0, ["outputtools", { value: "letter class"} ], x, y, [null, 1, null]],
                [1, ["currentpitch"], 0, 0, [0]],
            ]);
        }

        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "outputtools"]);
            } else {
                let cblk1 = logo.blocks.blockList[blk].connections[1];
                let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));
                let arg1;
                let notePlayed;
                if (cblk1 != null) {
                    arg1 = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                }
                if (logo.blocks.blockList[cblk1].name === "notename") {
                    notePlayed = arg1 + (tur.singer.currentOctave ? tur.singer.currentOctave : 4);
                } else if (
                    logo.blocks.blockList[cblk1].name === "solfege" ||
                    logo.blocks.blockList[cblk1].name === "eastindiansolfege"
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
                    notePlayed += (tur.singer.currentOctave ? tur.singer.currentOctave : 4);
                } else if (logo.blocks.blockList[cblk1].name === "number") {
                    // less than 55 hertz (A1)
                    if (logo.blocks.blockList[cblk1].value < 55) {
                        let obj = numberToPitch(
                            logo.blocks.blockList[cblk1].value + tur.singer.pitchNumberOffset
                        );
                        notePlayed = obj[0] + obj[1];
                    } else {
                        notePlayed = arg1;
                    }
                } else if (logo.blocks.blockList[cblk1].name === "scaledegree2") {
                    notePlayed = scaleDegreeToPitchMapping(
                        tur.singer.keySignature,
                        logo.blocks.blockList[cblk1].value,
                        tur.singer.moveable,
                        null
                    );
                    notePlayed += (tur.singer.currentOctave ? tur.singer.currentOctave : 4);
                } else {
                    if (typeof(arg1) === "string") {
                        // Is it a number encoded as a string?
                        let foundNumber = Number(arg1);
                        if (isNaN(foundNumber)) {
                            // Check to see if the octave was included.
                            let lastChar = arg1.charAt(arg1.length - 1);
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
                                    notePlayed += (tur.singer.currentOctave ? tur.singer.currentOctave : 4);
                                } else {
                                    notePlayed += foundOctave;
                                }
                            } else if (NOTENAMES.indexOf(arg1) !== -1) {
                                if (foundOctave.length === 0) {
                                    notePlayed = arg1 + (tur.singer.currentOctave ? tur.singer.currentOctave : 4);
                                } else {
                                    notePlayed = arg1 + foundOctave;
                                }
                            } else {
                                notePlayed = arg1;
                            }
                        } else {
                            // less than 55 hertz (A1)
                            if (foundNumber < 55) {
                                let obj = numberToPitch(
                                    foundNumber + tur.singer.pitchNumberOffset
                                );
                                notePlayed = obj[0] + obj[1];
                            } else {
                                notePlayed = foundNumber;
                            }
                        }
                    } else if (typeof(arg1) === "number") {
                        // less than 55 hertz (A1)
                        if (logo.blocks.blockList[cblk1].value < 55) {
                            let obj = numberToPitch(
                                logo.blocks.blockList[cblk1].value + tur.singer.pitchNumberOffset
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
                    logo.blocks.blockList[blk].privateData, notePlayed, tur
                );
            }
        }

    }

    class MIDIBlock extends FlowBlock {
        constructor() {
            //.TRANS: MIDI is a technical standard for electronic music
            super("midi", _("MIDI"));
            this.setPalette("pitch");
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
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Set pitch number offset block is used to set the offset for mapping pitch numbers to pitch and octave."
                ),
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
                [2, ["number", { value: 4}], 0, 0, [0]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null)
                logo.errorMsg(NOINPUTERRORMSG, blk);

            let arg0 = args[0] === null ? "C" : args[0];
            let arg1 = args[1] === null ? 4 : args[1];
            Singer.PitchActions.setPitchNumberOffset(arg0, arg1, turtle);
        }
    }

    class Number2PitchBlock extends LeftBlock {
        constructor(name, displayName) {
            //.TRANS: convert piano key number (1-88) to pitch
            super(name || "number2pitch", displayName || _("number to pitch"));
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Number to pitch block will convert a pitch number to a pich name."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [55]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk = logo.blocks.blockList[blk].connections[1];
            let num = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            try {
                let outType =
                    logo.blocks.blockList[blk].name === "number2pitch" ? "pitch" : "octave";
                return Singer.PitchActions.numToPitch(num, outType, turtle);
            } catch (e) {
                if (e === "NoArgError") {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
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
                _(
                    "The Number to octave block will convert a pitch number to an octave."
                ),
                "documentation",
                ""
            ]);
        }
    }

    class StaffYToPitch extends LeftBlock {
        constructor(name, displayName) {
            super("ytopitch", _("y to pitch"));
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "Y to pitch block will convert a staff y position to corresponding pitch notation."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({
                args: 1,
                defaults: [50]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let cblk0 = logo.blocks.blockList[blk].connections[0];
            let cblk1 = logo.blocks.blockList[blk].connections[1];
            let arg1 = null;
            if (cblk1 !== null) {
                arg1 = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            }
            if (cblk0 === null) {
                if (cblk1 === null) {
                    return ("G4");
                }
                let posY2 = arg1 + YSTAFFNOTEHEIGHT / 2;
                let o2 = Math.floor(posY2 / YSTAFFOCTAVEHEIGHT) + 4;
                posY2 %= YSTAFFOCTAVEHEIGHT;
                let noteIdx = Math.floor(posY2 / YSTAFFNOTEHEIGHT);
                while (noteIdx < 0) {
                    noteIdx += NOTENAMES.length;
                }
                let note = NOTENAMES[noteIdx];
                return (note + o2);
            } else if (logo.blocks.blockList[cblk0].name == "pitchnumber") {
                if (cblk1 === null) {
                    return (7);
                }
                let posY = arg1 + YSTAFFNOTEHEIGHT / 2;
                let o = Math.floor(posY / YSTAFFOCTAVEHEIGHT);
                posY %= YSTAFFOCTAVEHEIGHT;
                let lc = 0;
                for (let i = 0; i < posY / YSTAFFNOTEHEIGHT; i++) {
                    lc += MUSICALMODES["major"][i];
                }
                return (lc + (12 * o));
            } else if (logo.blocks.blockList[cblk0].name == "nthmodalpitch") {
                if (cblk1 === null) {
                    return (5);
                }
                let posY1 = arg1 + YSTAFFNOTEHEIGHT / 2;
                let o1 = Math.floor(posY1 / YSTAFFOCTAVEHEIGHT);
                posY1 %= YSTAFFOCTAVEHEIGHT;
                let lc1 = posY1 / YSTAFFNOTEHEIGHT;
                return (lc1 + (o1 * 7));
            } else if (logo.blocks.blockList[cblk0].name == "print") {
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, "ytopitch"]);
                }
                if (cblk1 === null) {
                    return ("G4");
                }
                let posY2 = arg1 + YSTAFFNOTEHEIGHT / 2;
                let o2 = Math.floor(posY2 / YSTAFFOCTAVEHEIGHT) + 4;
                posY2 %= YSTAFFOCTAVEHEIGHT;
                let noteIdx = Math.floor(posY2 / YSTAFFNOTEHEIGHT);
                while (noteIdx < 0) {
                    noteIdx += NOTENAMES.length;
                }
                let note = NOTENAMES[noteIdx];
                return (note + o2);
            } else if (logo.blocks.blockList[cblk0].name == "pitch") {
                if (cblk1 === null) {
                    return ["sol", 4];
                }
                let posY3 = arg1 + YSTAFFNOTEHEIGHT / 2;
                let o3 = Math.floor(posY3 / YSTAFFOCTAVEHEIGHT) + 4;
                posY3 %= YSTAFFOCTAVEHEIGHT;
                let noteIdx = Math.floor(posY3 / YSTAFFNOTEHEIGHT);
                while (noteIdx < 0) {
                    noteIdx += SOLFEGENAMES.length;
                }
                let sol = SOLFEGENAMES[noteIdx];
                return [sol, o3];
            } else {
                if (cblk1 === null) {
                    return ("G4");
                }
                let posY2 = arg1 + YSTAFFNOTEHEIGHT / 2;
                let o2 = Math.floor(posY2 / YSTAFFOCTAVEHEIGHT) + 4;
                posY2 %= YSTAFFOCTAVEHEIGHT;
                let noteIdx = Math.floor(posY2 / YSTAFFNOTEHEIGHT);
                while (noteIdx < 0) {
                    noteIdx += NOTENAMES.length;
                }
                let note = NOTENAMES[noteIdx];
                return (note + o2);
            }
        }
    }

    class AccidentalNameBlock extends ValueBlock {
        constructor() {
            super("accidentalname");
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Accidental selector block is used to choose between double-sharp, sharp, natural, flat, and double-flat."
                ),
                "documentation",
                ""
            ]);
            this.formBlock({ outType: "textout" });
            this.extraWidth = 50;
        }
    }

    class EastIndianSolfegeBlock extends ValueBlock {
        constructor() {
            super("eastindiansolfege");
            this.setPalette("pitch");
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
            super("notename");
            this.setPalette("pitch");
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
            super("solfege");
            this.setPalette("pitch");
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
            this.setPalette("pitch");
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                return;
            } else {
                let note = args[0];
                let octave = args[1];
                return Singer.processPitch(note, octave, 0);
            }
        }
    }

    class Invert1Block extends FlowClampBlock {
        constructor() {
            super("invert1");
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Invert block rotates any contained notes around a target note."
                ),
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
            if (args[3] === undefined)
                return;

            if (args[0] === null || args[1] === null || args[2] === null)
                logo.errorMsg(NOINPUTERRORMSG, blk);

            let arg0 = args[0] === null ? "sol" : args[0];
            let arg1 = args[1] === null ? 4 : args[1];
            let arg2 = args[2] === null ? "even" : args[2];

            Singer.PitchActions.invert(arg0, arg1, arg2, turtle, blk);

            return [args[3], 1];
        }
    }

    class Invert2Block extends FlowClampBlock {
        constructor(name, displayName) {
            //.TRANS: pitch inversion rotates a pitch around another pitch (odd number)
            super(name || "invert2", displayName || _("invert (odd)"));
            this.setPalette("pitch");
            this.formBlock({
                args: 2,
                defaults: ["sol", 4],
                argTypes: ["solfegein", "anyin"],
                argLabels: [_("note"), _("octave")]
            });
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (logo.blocks.blockList[blk].name === "invert") {
                tur.singer.invertList.push([args[0], args[1], "even"]);
            } else {
                tur.singer.invertList.push([args[0], args[1], "odd"]);
            }
            let listenerName = "_invert_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = event => tur.singer.invertList.pop();
            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[2], 1];
        }
    }

    class InvertBlock extends Invert2Block {
        constructor() {
            //.TRANS: pitch inversion rotates a pitch around another pitch (even number)
            super("invert", _("invert (even)"));
            this.setPalette("pitch");
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
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Register block provides an easy way to modify the register (octave) of the notes that follow it."
                ),
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
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Semi-tone transposition block will shift the pitches contained inside Note blocks up (or down) by half steps."
                ) +
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
            if (args[1] === undefined)
                return;

            if (args[0] !== null && typeof args[0] === "number") {
                Singer.PitchActions.setSemitoneTranspose(args[0], turtle, blk);

                return [args[1], 1];
            }
        }
    }

    class OctaveBlock extends FlowBlock {
        constructor() {
            //.TRANS: adjusts the shift up or down by one octave (twelve half-steps in the interval between two notes, one having twice or half the frequency in Hz of the other.)
            super("octave", _("octave"));
            this.setPalette("pitch");
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
            this.setPalette("pitch");
            this.makeMacro((x, y) => [
                [0, "pitch", x, y, [null, 1, 2, null]],
                [1, ["customNote", { value: "C(+0)" }], 0, 0, [0]],
                [2, ["number", { value: 4 }], 0, 0, [0]]
            ]);
            this.hidden = true;
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
            } else {
                note = args[0];
                octave = args[1];
            }
        }
    }

    class DownSixthBlock extends FlowBlock {
        constructor() {
            //.TRANS: down sixth means the note is five scale degrees below current note
            super("downsixth", _("down sixth"));
            this.setPalette("pitch");
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
            this.setPalette("pitch");
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
            this.setPalette("pitch");
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
            this.setPalette("pitch");
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
            this.setPalette("pitch");
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
            this.setPalette("pitch");
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
            this.setPalette("pitch");
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
            this.setPalette("pitch");
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
            this.setPalette("pitch");
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
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "The Scalar transposition block will shift the pitches contained inside Note blocks up (or down) the scale."
                ) +
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
            if (!beginnerMode || !this.beginnerModeBlock) {
                this.hidden = true;
            }
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined)
                return;

            let transValue = args[0];
            if (transValue === null || typeof transValue !== "number") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                transValue = 0;
            }

            Singer.PitchActions.setScalarTranspose(transValue, turtle, blk);

            return [args[1], 1];
        }
    }

    class AccidentalBlock extends FlowClampBlock {
        constructor() {
            super("accidental");
            this.setPalette("pitch");
            this.setHelpString([
                _("The Accidental block is used to create sharps and flats"),
                "documentation",
                null,
                "accidental"
            ]);
            this.formBlock({
                //.TRANS: An accidental is a modification to a pitch, e.g., sharp or flat.
                name: _("accidental"),
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
            if (args[1] === undefined)
                return;

            let arg = args[0];
            if (arg === null || typeof arg !== "string") {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = "sharp";
            }

            Singer.PitchActions.setAccidental(arg, turtle, blk);

            return [args[1], 1];
        }
    }

    class FlatBlock extends FlowClampBlock {
        constructor() {
            super("flat");
            this.setPalette("pitch");
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
            if (args[0] === undefined)
                return;

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));
            tur.singer.transposition += tur.singer.invertList.length > 0 ? 1 : -1;

            let listenerName = "_flat_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener =
                event => tur.singer.transposition += tur.singer.invertList.length > 0 ? -1 : 1;

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class SharpBlock extends FlowClampBlock {
        constructor() {
            super("sharp");
            this.setPalette("pitch");
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
            if (args[0] === undefined)
                return;

            Singer.PitchActions.setSharp(turtle, blk);

            return [args[0], 1];
        }
    }

    class HertzBlock extends FlowBlock {
        constructor() {
            //.TRANS: a measure of frequency: one cycle per second
            super("hertz", _("hertz"));
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Hertz block (in combination with a Number block) will play a sound at the specified frequency."
                ),
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
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg = 392;
            }

            let obj = frequencyToPitch(arg);

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            if (obj[0] === "?") {
                logo.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
            } else if (logo.inMatrix) {
                logo.pitchTimeMatrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                logo.pitchTimeMatrix.rowLabels.push(logo.blocks.blockList[blk].name);
                logo.pitchTimeMatrix.rowArgs.push(arg);
                // convert hertz to note/octave
                let note = obj;
                tur.singer.lastNotePlayed = [note[0] + note[1], 4];
            } else if (logo.inMusicKeyboard) {
                logo.musicKeyboard.instruments.push(last(tur.singer.instrumentNames));
                logo.musicKeyboard.noteNames.push("hertz");
                logo.musicKeyboard.octaves.push(arg);
                logo.musicKeyboard.addRowBlock(blk);
                // convert hertz to note/octave
                let note = obj;
                tur.singer.lastNotePlayed = [note[0] + note[1], 4];
            } else if (logo.inPitchStaircase) {
                let frequency = arg;
                let note = obj;
                let flag = 0;

                for (let i = 0; i < logo.pitchStaircase.Stairs.length; i++) {
                    if (logo.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                        logo.pitchStaircase.Stairs.splice(
                            i, 0, [note[0], note[1], parseFloat(frequency)]
                        );
                        flag = 1;
                        return;
                    }
                    if (logo.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                        logo.pitchStaircase.Stairs.splice(
                            i, 1, [note[0], note[1], parseFloat(frequency)]
                        );
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
                        logo.errorMsg(_("Hertz Block: Did you mean to use a Note block?"), blk);
                    } else {
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
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Pitch Number block will play a pitch associated by its number, e.g. 0 for C and 7 for G."
                ),
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
            console.log(args);
            let arg0;
            if (args[0] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = 7;       // set default value to 7th semitone
            } else if (typeof args[0] !== "number") {
                logo.errorMsg(NANERRORMSG, blk);
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
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "n^th Modal Pitch takes the pattern of pitches in semitones for a mode and makes each point a degree of the mode,"
                ) +
                    " " +
                    _(
                        "starting from 1 and regardless of tonal framework (i.e. not always 8 notes in the octave)"
                    ),
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

            let arg0 = args[0] !== null ? args[0] : "sol";
            let arg1 = args[1] !== null ? args[1] : 4;

            if (args[0] === null || args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
            }

            if (typeof arg0 === "number") {
                return Singer.PitchActions.playNthModalPitch(arg0, arg1, turtle, blk);
            } else {
                logo.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
                return;
            }
        }
    }

    class NthModalPitchBlock extends FlowBlock {
        constructor() {
            //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
            super("nthmodalpitch", _("nth modal pitch"));
            this.setPalette("pitch");
            this.setHelpString([
                _(
                    "N^th Modal Pitch takes a number as an input as the n^th degree for the given mode. 0 is the first position, 1 is the second, -1 is the note before the first etc."
                ) +
                    " " +
                    _(
                        "The pitches change according to the mode specified without any need for respellings."
                    ),
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

            let arg0 = args[0] !== null ? args[0] : "sol";
            let arg1 = args[1] !== null ? args[1] : 4;

            if (args[0] === null || args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
            }

            if (typeof arg0 === "number") {
                return Singer.PitchActions.playNthModalPitch(arg0, arg1, turtle, blk);
            } else {
                logo.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
                return;
            }
        }
    }

    class ScaleDegree2Block extends ValueBlock {
        constructor() {
            //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
            super("scaledegree2");
            this.setPalette("pitch");
            this.extraWidth = 10;
            this.setHelpString([
                _(
                    "Scale Degree is a common convention in music. Scale Degree offers seven possible positions in the scale (1-7) and can be modified via accidentals."
                ) +
                    " " +
                    _(
                        "Scale Degree 1 is always the first pitch in a given scale, regardless of octave."
                    ),
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
            return logo.blocks.blockList[blk].value;
        }
    }

    class StepPitchBlock extends FlowBlock {
        constructor() {
            //.TRANS: step some number of notes in current musical scale
            super("steppitch", _("scalar step") + " (+/–)");
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Scalar Step block (in combination with a Number block) will play the next pitch in a scale,"
                ) +
                    " " +
                    _(
                        "eg if the last note played was sol, Scalar Step 1 will play la."
                    ),
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
            this.setPalette("pitch");
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
            this.setPalette("pitch");
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Pitch block specifies the pitch name and octave of a note that together determine the frequency of the note."
                ),
                "documentation",
                null,
                "note1"
            ]);
            this.formBlock({
                args: 2,
                defaults: ["sol", 4],
                argTypes: ["solfegein", "anyin"],
                argLabels: [
                    this.lang === "ja" ? _("name2") : _("name"),
                    _("octave")
                ]
            });
        }

        flow(args, logo, turtle, blk) {
            // Default value is G4 or (sol, 4)
            let arg0 = args[0] !== null ? args[0] : "sol";
            let arg1 = args[1] !== null ? args[1] : 4;

            if (args[0] === null || args[1] === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
            }

            let tur = logo.turtles.ithTurtle(logo.turtles.companionTurtle(turtle));

            let note, octave, cents;

            // is the arg a scaledegree block?
            let c = logo.blocks.blockList[blk].connections[1];
            let cname = null;
            if (c !== null) {
                cname = logo.blocks.blockList[c].name;
            }

            if (cname === "scaledegree2" || !isNaN(Number(arg0[0])) || !isNaN(Number(arg0[1]))) {
                let scaledegree = logo.blocks.blockList[c].value;
                let attr;

                if (scaledegree.indexOf(SHARP) !==-1) {
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

                let obj = keySignatureToMode(tur.singer.keySignature);
                
                let isNegativeArg = (scaledegree <= 0) ? true : false;
                let sd;
                if (isNegativeArg) {
                    let multiplier = Math.floor(Math.abs(scaledegree) / 7);
                    sd = scaledegree + ((multiplier + 1) * 7);
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
                    tur.singer.keySignature, sd, tur.singer.moveable, null
                );
                let semitones = ref;
                
                semitones +=
                NOTESFLAT.indexOf(note) !== -1 ?
                    NOTESFLAT.indexOf(note) - ref : NOTESSHARP.indexOf(note) - ref;
                
                /** calculates changes in reference octave which occur a semitone before the reference key */
                let deltaOctave = isNegativeArg ? Math.floor((scaledegree + 1) / 7) : Math.floor((scaledegree - 1) / 7);
                
                /** calculates changes in octave when crossing B */
                let deltaSemi = isNegativeArg ?
                    (semitones > ref ? 1 : 0) : (semitones < ref ? 1 : 0);
                
                octave = ((isNegativeArg ? -1 : 1) * (deltaOctave + deltaSemi)) + Math.floor(
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
                        logo.errorMsg(INVALIDPITCH, blk);
                        arg0 = 7;   // set default value to 7th semitone
                    }

                    note = nthDegreeToPitch(tur.singer.keySignature, Math.round(arg0));
                    octave = Math.floor(
                        calcOctave(tur.singer.currentOctave, arg1, tur.singer.lastNotePlayed, note)
                    );
                    cents = 0;
                } else {
                    if (arg0 < A0 || arg0 > C8) {
                        logo.errorMsg(INVALIDPITCH, blk);
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
                        NOTENAMES.indexOf(arg0.toUpperCase()) !== -1 ?
                            SOLFEGECONVERSIONTABLE[arg0.toUpperCase()] : arg0;
                    note = accSym !== NATURAL ? note + accSym : note;   // add accidental

                    octave = Math.floor(
                        calcOctave(tur.singer.currentOctave, arg1, tur.singer.lastNotePlayed, note)
                    );
                    cents = 0;
                } else {
                    octave =
                        calcOctave(tur.singer.currentOctave, arg1, tur.singer.lastNotePlayed, arg0);

                    // Octave must be an integer in [0, 9]
                    [note, octave, cents] =
                        [arg0, Math.floor(Math.min(9, Math.max(0, octave))), 0];
                }
            }

            return Singer.PitchActions.playPitch(note, octave, cents, turtle, blk);
        }
    }

    new ConsonantStepSizeDownBlock().setup();
    new ConsonantStepSizeUpBlock().setup();
    new RestBlock().setup();
    new SquareBlock().setup();
    new TriangleBlock().setup();
    new SineBlock().setup();
    new SawtoothBlock().setup();
    new InvertModeBlock().setup();
    new TranspositionFactorBlock().setup();
    new DeltaPitchBlock().setup();
    new DeltaPitch2Block().setup();
    new MyPitchBlock().setup();
    new PitchInHertzBlock().setup();
    new Number2PitchBlock().setup();
    new Number2OctaveBlock().setup();
    new StaffYToPitch().setup();
    new OutputToolsBlocks().setup();
    new CurrentPitchBlock().setup();
    new CustomNoteBlock().setup();
    new MIDIBlock().setup();
    new SetPitchNumberOffsetBlock().setup();
    new Invert1Block().setup();
    new Invert2Block().setup();
    new InvertBlock().setup();
    new RegisterBlock().setup();
    new SetTranspositionBlock().setup();
    new OctaveBlock().setup();
    new CustomPitchBlock().setup();
    new DownSixthBlock().setup();
    new DownThirdBlock().setup();
    new SeventhBlock().setup();
    new SixthBlock().setup();
    new FifthBlock().setup();
    new FourthBlock().setup();
    new ThirdBlock().setup();
    new SecondBlock().setup();
    new UnisonBlock().setup();
    new SetScalarTranspositionBlock().setup();
    new AccidentalNameBlock().setup();
    new AccidentalBlock().setup();
    new FlatBlock().setup();
    new SharpBlock().setup();
    new ScaleDegree2Block().setup();
    new EastIndianSolfegeBlock().setup();
    new NoteNameBlock().setup();
    new SolfegeBlock().setup();
    new HertzBlock().setup();
    new PitchNumberBlock().setup();
    new ScaleDegreeBlock().setup();
    new NthModalPitchBlock().setup();
    new StepPitchBlock().setup();
    new Pitch2Block().setup();
    new PitchBlock().setup();
}
