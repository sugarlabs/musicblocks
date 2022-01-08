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

   _, FlowBlock, NOINPUTERRORMSG, Singer, ValueBlock, mixedNumber,
   FlowClampBlock, DEFAULTDRUM, Queue, i18nSolfege
 */

/* exported setupRhythmBlocks */

function setupRhythmBlocks(activity) {
    class MyNoteValueBlock extends ValueBlock {
        constructor() {
            //.TRANS: the value (e.g., 1/4 note) of the note being played.
            super("mynotevalue", _("note value"));
            this.setPalette("rhythm", activity);
            this.parameter = true;
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Note value block is the value of the duration of the note currently being played."),
                "documentation",
                null,
                "everybeathelp"
            ]);
        }

        updateParameter(logo, turtle, blk) {
            return mixedNumber(activity.blocks.blockList[blk].value);
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "mynotevalue"]);
            } else {
                return Singer.RhythmActions.getNoteValue(activity.turtles.companionTurtle(turtle));
            }
        }
    }

    class SkipFactorBlock extends ValueBlock {
        constructor() {
            super("skipfactor", "skip factor");
            this.setPalette("rhythm", activity);
            this.setHelpString();
            this.parameter = true;
            this.hidden = true;
        }

        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name === "print"
            ) {
                logo.statusFields.push([blk, "skip"]);
            } else {
                return activity.turtles.ithTurtle(turtle).singer.skipFactor;
            }
        }
    }

    class MillisecondsBlock extends FlowClampBlock {
        constructor() {
            super("osctime");
            this.setPalette("rhythm", activity);
            this.setHelpString([
                _("The Milliseconds block is similar to a Note block except that it uses time (in MS) to specify the note duration."),
                "documentation",
                null,
                "osctimehelp"
            ]);

            this.formBlock({
                name: _("milliseconds"),
                args: 1,
                defaults: [200],
                canCollapse: true
            });

            this.makeMacro((x, y) => [
                [0, "osctime", x, y, [null, 2, 1, 7]],
                [1, "vspace", 0, 0, [0, 5]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1000 }], 0, 0, [2]],
                [4, "divide", 0, 0, [2, 8, 9]],
                [5, "hertz", 0, 0, [1, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]],
                [8, ["number", { value: 3 }], 0, 0, [4]],
                [9, ["number", { value: 2 }], 0, 0, [4]]
            ]);
        }

        flow(args, logo, turtle, blk, receivedArg) {
            if (args[1] === undefined)
                return;

            if (args[0] === null || typeof args[0] !== "number")
                activity.errorMsg(NOINPUTERRORMSG, blk);
            else if (args[0] <= 0)
                activity.errorMsg(_("Note value must be greater than 0."), blk);
            const value = args[0] === null || typeof args[0] !== "number" ? 1 / 4 : Math.abs(args[0]);

            const _callback = () => {
                const tur = activity.turtles.ithTurtle(turtle);

                const queueBlock = new Queue(args[1], 1, blk, receivedArg);
                tur.parentFlowQueue.push(blk);
                tur.queue.push(queueBlock);
            };

            Singer.RhythmActions.playNote(value, "osctime", turtle, blk, _callback);

            return [args[1], 1];
        }
    }

    class SwingBlock extends FlowClampBlock {
        constructor() {
            super("swing");
            this.setPalette("rhythm", activity);
            this.setHelpString();

            this.formBlock({
                name: _("swing"),
                args: 1,
                defaults: [32]
            });
            this.makeMacro((x, y) => [
                [0, "swing", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 32 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.swing.push(args[0]);
            tur.singer.swingTarget.push(null);

            tur.singer.swingCarryOver = 0;

            const listenerName = "_swing_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = event => {
                if (!tur.singer.suppressOutput) {
                    tur.singer.swingTarget.pop();
                    tur.singer.swing.pop();
                }

                tur.singer.swingCarryOver = 0;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class NewSwingBlock extends FlowClampBlock {
        constructor() {
            super("newswing");
            this.setPalette("rhythm", activity);
            this.setHelpString();

            this.formBlock({
                //.TRANS: swing is a rhythmic variation that emphasises the offbeat
                name: _("swing"),
                args: 1,
                defaults: [1 / 24]
            });
            this.makeMacro((x, y) => [
                [0, "newswing", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 16 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.swing.push(1 / args[0]);
            tur.singer.swingTarget.push(null);

            tur.singer.swingCarryOver = 0;

            const listenerName = "_swing_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = event => {
                if (!tur.singer.suppressOutput) {
                    tur.singer.swingTarget.pop();
                    tur.singer.swing.pop();
                }

                tur.singer.swingCarryOver = 0;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class NewSwing2Block extends FlowClampBlock {
        constructor() {
            super("newswing2");
            this.setPalette("rhythm", activity);
            this.setHelpString([
                _("The Swing block works on pairs of notes (specified by note value), adding some duration (specified by swing value) to the first note and taking the same amount from the second note."),
                "documentation",
                null,
                "swinghelp"
            ]);

            this.formBlock({
                name: _("swing"),
                args: 2,
                defaults: [1 / 24, 1 / 8],
                argLabels: [
                    //.TRANS: the amount to shift to the offbeat note
                    _("swing value"),
                    _("note value")
                ],
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "newswing2", x, y, [null, 1, 6, 9, 10]],
                [1, "hspace", 0, 0, [0, 2]],
                [2, "hspace", 0, 0, [1, 3]],
                [3, "divide", 0, 0, [2, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 24 }], 0, 0, [3]],
                [6, "divide", 0, 0, [0, 7, 8]],
                [7, ["number", { value: 1 }], 0, 0, [6]],
                [8, ["number", { value: 8 }], 0, 0, [6]],
                [9, "vspace", 0, 0, [0, null]],
                [10, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[2] === undefined)
                return;

            if (
                args[0] === null || typeof args[0] !== "number" || args[0] <= 0 ||
                args[1] === null || typeof args[1] !== "number" || args[1] <= 0
            )   activity.errorMsg(NOINPUTERRORMSG, blk);
            const arg0 =
                args[0] === null || typeof args[0] !== "number" || args[0] <= 0 ? 1 / 24 : args[0];
            const arg1 =
                args[1] === null || typeof args[1] !== "number" || args[1] <= 0 ? 1 / 8 : args[1];

            Singer.RhythmActions.addSwing(arg0, arg1, turtle, blk);

            return [args[2], 1];
        }
    }

    class SkipNotesBlock extends FlowClampBlock {
        constructor() {
            super("skipnotes");
            this.setPalette("rhythm", activity);
            this.setHelpString([
                _("The Skip notes block will cause notes to be skipped."),
                "documentation",
                null,
                "skiphelp"
            ]);

            this.formBlock({
                //.TRANS: substitute rests on notes being skipped
                name: _("skip notes"),
                args: 1,
                defaults: [2],
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "skipnotes", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 2 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);
            const arg = args[0] === null ? 0 : args[0];
            tur.singer.skipFactor += arg;

            const listenerName = "_skip_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = event => {
                tur.singer.skipFactor -= arg;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class MultiplyBeatFactorBlock extends FlowClampBlock {
        constructor() {
            super("multiplybeatfactor");
            this.setPalette("rhythm", activity);
            this.setHelpString([
                _("The Multiply note value block changes the duration of notes by changing their note values."),
                "documentation",
                null,
                "multiplybeathelp"
            ]);

            this.formBlock({
                //.TRANS: speed up note duration by some factor, e.g. convert 1/4 to 1/8 notes by using a factor of 2
                name: _("multiply note value"),
                args: 1,
                defaults: [2],
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "multiplybeatfactor", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 2 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined)
                return;

            let factor = args[0];
            if (factor === null || typeof factor !== "number" || factor <= 0) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                factor = 2;
            }

            Singer.RhythmActions.multiplyNoteValue(factor, turtle, blk);

            return [args[1], 1];
        }
    }

    class TieBlock extends FlowClampBlock {
        constructor() {
            super("tie");
            this.setPalette("rhythm", activity);

            this.beginnerBlock(true);
            this.setHelpString([
                _("The Tie block works on pairs of notes, combining them into one note."),
                "documentation",
                null,
                "tiehelp"
            ]);

            this.formBlock({
                //.TRANS: tie notes together into one longer note
                name: _("tie"),
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "tie", x, y, [null, null, 1]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === undefined)
                return;

            Singer.RhythmActions.doTie(turtle, blk);

            return [args[0], 1];
        }
    }

    class RhythmicDotBlock extends FlowClampBlock {
        constructor() {
            super("rhythmicdot");
            this.setPalette("rhythm", activity);
            this.setHelpString();

            this.formBlock({
                name: _("dot"),
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "rhythmicdot", x, y, [null, null, 1]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) activity.errorMsg(NOINPUTERRORMSG, blk);
            let arg = 1;

            const tur = activity.turtles.ithTurtle(turtle);
            const currentDotFactor = 2 - 1 / Math.pow(2, tur.singer.dotCount);
            tur.singer.beatFactor *= currentDotFactor;
            if (arg >= 0) {
                tur.singer.dotCount += arg;
            } else if (arg === -1) {
                activity.errorMsg(_("An argument of -1 results in a note value of 0."), blk);
                arg = 0;
            } else {
                tur.singer.dotCount += 1 / arg;
            }

            const newDotFactor = 2 - 1 / Math.pow(2, tur.singer.dotCount);
            tur.singer.beatFactor /= newDotFactor;

            const listenerName = "_dot_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = event => {
                const currentDotFactor = 2 - 1 / Math.pow(2, tur.singer.dotCount);
                tur.singer.beatFactor *= currentDotFactor;
                tur.singer.dotCount -= arg >= 0 ? arg : 1 / arg;
                const newDotFactor = 2 - 1 / Math.pow(2, tur.singer.dotCount);
                tur.singer.beatFactor /= newDotFactor;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[0], 1];
        }
    }

    class RhythmicDot2Block extends FlowClampBlock {
        constructor() {
            super("rhythmicdot2");
            this.setPalette("rhythm", activity);
            this.piemenuValuesC1 = [1, 2, 3];
            this.setHelpString([
                _("The Dot block extends the duration of a note by 50%.") +
                    " " +
                    _("Eg a dotted quarter note will play for 3/8 (1/4 + 1/8) of a beat."),
                "documentation",
                null,
                "dothelp"
            ]);

            this.formBlock({
                //.TRANS: a dotted note is played for 1.5x its value, e.g., 1/8. --> 3/16
                name: _("dot"),
                args: 1,
                defaults: [1],
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "rhythmicdot2", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            if (args[0] === null) activity.errorMsg(NOINPUTERRORMSG, blk);
            const arg = args[0] === null ? 0 : args[0];

            Singer.RhythmActions.doRhythmicDot(arg, turtle ,blk);

            return [args[1], 1];
        }
    }

    class Rest2Block extends FlowBlock {
        constructor() {
            super("rest2", _("silence"));
            this.setPalette("rhythm", activity);
            this.beginnerBlock(true);
            this.setHelpString([
                _("A rest of the specified note value duration can be constructed using a Silence block."),
                "documentation",
                null,
                "rest2"
            ]);

            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 6]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "rest2", 0, 0, [4, null]],
                [6, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle) {
            Singer.RhythmActions.playRest(turtle);
        }
    }

    class Note4Block extends FlowClampBlock {
        constructor() {
            super("note4");
            this.setPalette("rhythm", activity);
            this.beginnerBlock(true);

            this.formBlock({
                name:
                    this.lang === "ja"
                        ? //.TRANS: Japanese only: note value block for drum
                        _("note value drum")
                        : _("note value") + " " + _("drum"),
                args: 1,
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "playdrum", 0, 0, [4, 6, null]],
                [6, ["drumname", { value: DEFAULTDRUM }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow() {}
    }

    class _NoteValueBlock extends FlowClampBlock {
        constructor(name, value) {
            super(name);
            this.setPalette("rhythm", activity);
            this.setHelpString();

            this.formBlock({
                name: _("note value") + " " + value,
                args: 1,
                canCollapse: true
            });
        }

        flow() {}
    }

    class Note3Block extends _NoteValueBlock {
        constructor() {
            super("note3", _("392 hertz"));
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "hertz", 0, 0, [4, 6, null]],
                [6, ["number", { value: 392 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow() {}
    }

    class Note5Block extends _NoteValueBlock {
        constructor() {
            super("note5", "7");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "pitchnumber", 0, 0, [4, 6, null]],
                [6, ["number", { value: 7 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow() {}
    }

    class Note7Block extends _NoteValueBlock {
        constructor() {
            super("note7", "4 4");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 8]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "nthmodalpitch", 0, 0, [4, 6, 7, null]],
                [6, ["number", { value: 4 }], 0, 0, [5]],
                [7, ["number", { value: 4 }], 0, 0, [5]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow() {}
    }

    class Note8Block extends _NoteValueBlock {
        constructor() {
            super("note8", "scale degree");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 8]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "pitch", 0, 0, [4, 6, 7, null]],
                [6, ["scaledegree2", { value: "5" }], 0, 0, [5]],
                [7, ["number", { value: 4 }], 0, 0, [5]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow() {}
    }

    class Note6Block extends _NoteValueBlock {
        constructor() {
            super("note6", "+1");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 7]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "steppitch", 0, 0, [4, 6, null]],
                [6, ["number", { value: 1 }], 0, 0, [5]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow() {}
    }

    class Note2Block extends _NoteValueBlock {
        constructor() {
            super("note2", "G4");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 8]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "pitch", 0, 0, [4, 6, 7, null]],
                [6, ["notename", { value: "G" }], 0, 0, [5]],
                [7, ["number", { value: 4 }], 0, 0, [5]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow() {}
    }

    class Note1Block extends _NoteValueBlock {
        constructor() {
            super("note1", i18nSolfege("sol") + "4");
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 8]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "pitch", 0, 0, [4, 6, 7, null]],
                [6, ["solfege", { value: "sol" }], 0, 0, [5]],
                [7, ["number", { value: 4 }], 0, 0, [5]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow() {}
    }

    class NoteBlock extends FlowClampBlock {
        constructor() {
            super("note");
            this.setPalette("rhythm", activity);
            this.setHelpString();

            this.formBlock({
                name: "deprecated note value",
                args: 1,
                defaults: [4],
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 8 }], 0, 0, [0]],
                [2, "pitch", 0, 0, [0, 3, 4, null]],
                [3, ["solfege", { value: "sol" }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = this.deprecated = true;
        }

        flow(args, logo, turtle, blk, receivedArg) {
            // Should never happen, but if it does, nothing to do
            if (args[1] === undefined)
                return;

            if (args[0] === null || typeof args[0] !== "number")
                activity.errorMsg(NOINPUTERRORMSG, blk);
            else if (args[0] <= 0)
                activity.errorMsg(_("Note value must be greater than 0."), blk);
            const value = args[0] === null || typeof args[0] !== "number" ? 1 / 4 : Math.abs(args[0]);

            const _callback = () => {
                const tur = activity.turtles.ithTurtle(turtle);

                const queueBlock = new Queue(args[1], 1, blk, receivedArg);
                tur.parentFlowQueue.push(blk);
                tur.queue.push(queueBlock);
            };

            Singer.RhythmActions.playNote(value, "note", turtle, blk, _callback);

            return [args[1], 1];
        }
    }

    class NewNoteBlock extends FlowClampBlock {
        constructor() {
            super("newnote");
            this.setPalette("rhythm", activity);
            this.beginnerBlock(true);
            this.setHelpString([
                _("The Note block is a container for one or more Pitch blocks.") +
                    " " +
                    _("The Note block specifies the duration (note value) of its contents."),
                "documentation",
                null,
                "note1"
            ]);

            this.formBlock({
                name: _("note"),
                args: 1,
                argLabels: [this.lang === "ja" ? _("value2") : _("value")],
                defaults: [1 / 4],
                canCollapse: true
            });
            this.makeMacro((x, y) => [
                [0, "newnote", x, y, [null, 1, 4, 8]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, 5]],
                [5, "pitch", 0, 0, [4, 6, 7, null]],
                [6, ["solfege", { value: "sol" }], 0, 0, [5]],
                [7, ["number", { value: 4 }], 0, 0, [5]],
                [8, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk, receivedArg) {
            // Should never happen, but if it does, nothing to do
            if (args[1] === undefined)
                return;

            if (args[0] === null || typeof args[0] !== "number")
                activity.errorMsg(NOINPUTERRORMSG, blk);
            else if (args[0] <= 0)
                activity.errorMsg(_("Note value must be greater than 0."), blk);

            const value = args[0] === null || typeof args[0] !== "number" ? 1 / 4 : Math.abs(args[0]);

            const _callback = () => {
                const tur = activity.turtles.ithTurtle(turtle);

                const queueBlock = new Queue(args[1], 1, blk, receivedArg);
                tur.parentFlowQueue.push(blk);
                tur.queue.push(queueBlock);
            };

            Singer.RhythmActions.playNote(value, "newnote", turtle, blk, _callback);

            return [args[1], 1];
        }
    }

    class DefineFrequencyBlock extends FlowClampBlock {
        constructor() {
            super("definefrequency");
            this.setPalette("rhythm", activity);
            this.setHelpString();

            this.formBlock({
                name: _("define frequency"),
                args: 1
            });
            this.hidden = true;
        }
    }

    class OctaveSpaceBlock extends FlowBlock {
        constructor() {
            super("octavespace", _("octave space"));
            this.setPalette("rhythm", activity);
            this.setHelpString();

            this.formBlock({
                args: 1
            });
            this.hidden = true;
        }
    }

    new MyNoteValueBlock().setup(activity);
    new SkipFactorBlock().setup(activity);
    new MillisecondsBlock().setup(activity);
    new SwingBlock().setup(activity);
    new NewSwingBlock().setup(activity);
    new NewSwing2Block().setup(activity);
    new SkipNotesBlock().setup(activity);
    new MultiplyBeatFactorBlock().setup(activity);
    new TieBlock().setup(activity);
    new RhythmicDotBlock().setup(activity);
    new RhythmicDot2Block().setup(activity);
    new Rest2Block().setup(activity);
    new Note4Block().setup(activity);
    new Note3Block().setup(activity);
    new Note5Block().setup(activity);
    new Note8Block().setup(activity);
    new Note7Block().setup(activity);
    new Note6Block().setup(activity);
    new Note2Block().setup(activity);
    new Note1Block().setup(activity);
    new NoteBlock().setup(activity);
    new NewNoteBlock().setup(activity);
    new DefineFrequencyBlock().setup(activity);
    new OctaveSpaceBlock().setup(activity);
}
