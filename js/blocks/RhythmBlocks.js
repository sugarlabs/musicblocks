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
    /**
     * Represents a block that provides the value (e.g., 1/4 note) of the note being played.
     * @class
     * @extends ValueBlock
     */
    class MyNoteValueBlock extends ValueBlock {
        /**
         * Creates an instance of MyNoteValueBlock.
         */
        constructor() {
            //.TRANS: the value (e.g., 1/4 note) of the note being played.
            super("mynotevalue", _("note value"));
            this.setPalette("rhythm", activity);
            this.parameter = true;
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "The Note value block is the value of the duration of the note currently being played."
                ),
                "documentation",
                null,
                "everybeathelp"
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {mixedNumber} The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return mixedNumber(activity.blocks.blockList[blk].value);
        }

        /**
         * Retrieves the argument value.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {number} The note value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "mynotevalue"]);
            } else {
                return Singer.RhythmActions.getNoteValue(activity.turtles.companionTurtle(turtle));
            }
        }
    }

    /**
     * Represents a block that provides the skip factor value.
     * @class
     * @extends ValueBlock
     */
    class SkipFactorBlock extends ValueBlock {
        /**
         * Creates an instance of SkipFactorBlock.
         */
        constructor() {
            super("skipfactor", "skip factor");
            this.setPalette("rhythm", activity);
            this.setHelpString();
            this.parameter = true;
            this.hidden = true;
        }

        /**
         * Updates the parameter of the block.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {number} The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Retrieves the argument value.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {number} The skip factor value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "skip"]);
            } else {
                return activity.turtles.ithTurtle(turtle).singer.skipFactor;
            }
        }
    }

    /**
     * Represents a block that uses time (in MS) to specify note duration.
     * @class
     * @extends FlowClampBlock
     */
    class MillisecondsBlock extends FlowClampBlock {
        /**
         * Creates an instance of MillisecondsBlock.
         */
        constructor() {
            super("osctime");
            this.setPalette("rhythm", activity);
            this.setHelpString([
                _(
                    "The Milliseconds block is similar to a Note block except that it uses time (in MS) to specify the note duration."
                ),
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

        /**
         * Handles the flow of the block.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @param {object} receivedArg - Received argument.
         * @returns {Array} An array containing the queue block information.
         */
        flow(args, logo, turtle, blk, receivedArg) {
            if (args[1] === undefined) return;

            if (args[0] === null || typeof args[0] !== "number")
                activity.errorMsg(NOINPUTERRORMSG, blk);
            else if (args[0] <= 0) activity.errorMsg(_("Note value must be greater than 0."), blk);
            const value =
                args[0] === null || typeof args[0] !== "number" ? 1 / 4 : Math.abs(args[0]);

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

    /**
     * Represents a block for swing in rhythm.
     * @class
     * @extends FlowClampBlock
     */
    class SwingBlock extends FlowClampBlock {
        /**
         * Creates an instance of SwingBlock.
         */
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

        /**
         * Handles the flow of the swing block.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {Array} An array containing the queue block information.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.swing.push(args[0]);
            tur.singer.swingTarget.push(null);

            tur.singer.swingCarryOver = 0;

            const listenerName = "_swing_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => {
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

    /**
     * Represents a block for new swing in rhythm.
     * @class
     * @extends FlowClampBlock
     */
    class NewSwingBlock extends FlowClampBlock {
        /**
         * Creates an instance of NewSwingBlock.
         */
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

        /**
         * Handles the flow of the new swing block.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {Array} An array containing the queue block information.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.swing.push(1 / args[0]);
            tur.singer.swingTarget.push(null);

            tur.singer.swingCarryOver = 0;

            const listenerName = "_swing_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => {
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

    /**
     * Represents a block for new swing with two notes in rhythm.
     * @class
     * @extends FlowClampBlock
     */
    class NewSwing2Block extends FlowClampBlock {
        /**
         * Creates an instance of NewSwing2Block.
         */
        constructor() {
            super("newswing2");
            this.setPalette("rhythm", activity);
            this.setHelpString([
                _(
                    "The Swing block works on pairs of notes (specified by note value), adding some duration (specified by swing value) to the first note and taking the same amount from the second note."
                ),
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

        /**
         * Handles the flow of the new swing with two notes block.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {Array} An array containing the queue block information.
         */
        flow(args, logo, turtle, blk) {
            if (args[2] === undefined) return;

            if (
                args[0] === null ||
                typeof args[0] !== "number" ||
                args[0] <= 0 ||
                args[1] === null ||
                typeof args[1] !== "number" ||
                args[1] <= 0
            )
                activity.errorMsg(NOINPUTERRORMSG, blk);
            const arg0 =
                args[0] === null || typeof args[0] !== "number" || args[0] <= 0 ? 1 / 24 : args[0];
            const arg1 =
                args[1] === null || typeof args[1] !== "number" || args[1] <= 0 ? 1 / 8 : args[1];

            Singer.RhythmActions.addSwing(arg0, arg1, turtle, blk);

            return [args[2], 1];
        }
    }

    /**
     * Represents a block for skipping notes in rhythm.
     * @class
     * @extends FlowClampBlock
     */
    class SkipNotesBlock extends FlowClampBlock {
        /**
         * Creates an instance of SkipNotesBlock.
         */
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

        /**
         * Handles the flow of the skip notes block.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {Array} An array containing the queue block information.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);
            const arg = args[0] === null ? 0 : args[0];
            tur.singer.skipFactor += arg;

            const listenerName = "_skip_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => {
                tur.singer.skipFactor -= arg;
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    /**
     * Represents a block for multiplying note values to change the duration of notes.
     * @class
     * @extends FlowClampBlock
     */
    class MultiplyBeatFactorBlock extends FlowClampBlock {
        /**
         * Creates an instance of MultiplyBeatFactorBlock.
         */
        constructor() {
            super("multiplybeatfactor");
            this.setPalette("rhythm", activity);
            this.setHelpString([
                _(
                    "The Multiply note value block changes the duration of notes by changing their note values."
                ),
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

        /**
         * Handles the flow of the multiply note value block.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {Array} An array containing the queue block information.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let factor = args[0];
            if (factor === null || typeof factor !== "number" || factor <= 0) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                factor = 2;
            }

            Singer.RhythmActions.multiplyNoteValue(factor, turtle, blk);

            return [args[1], 1];
        }
    }

    /**
     * Represents a block for tying pairs of notes together into one longer note.
     * @class
     * @extends FlowClampBlock
     */
    class TieBlock extends FlowClampBlock {
        /**
         * Creates an instance of TieBlock.
         */
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

        /**
         * Handles the flow of the tie block.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {Array} An array containing the queue block information.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) return;

            Singer.RhythmActions.doTie(turtle, blk);

            return [args[0], 1];
        }
    }

    /**
     * Represents a block for handling rhythmic dots, adjusting note values based on the dot count.
     * @class
     * @extends FlowClampBlock
     */
    class RhythmicDotBlock extends FlowClampBlock {
        /**
         * Creates an instance of RhythmicDotBlock.
         */
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

        /**
         * Handles the flow of the rhythmic dot block.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {Array} An array containing the queue block information.
         */
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
            const __listener = (event) => {
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

    /**
     * Represents a block for handling rhythmic dots with a different implementation.
     * Extends FlowClampBlock.
     * @class
     * @extends FlowClampBlock
     */
    class RhythmicDot2Block extends FlowClampBlock {
        /**
         * Creates an instance of RhythmicDot2Block.
         */
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

        /**
         * Handles the flow of the rhythmic dot block with a different implementation.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         * @param {number} blk - Block identifier.
         * @returns {Array} An array containing the queue block information.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) activity.errorMsg(NOINPUTERRORMSG, blk);
            const arg = args[0] === null ? 0 : args[0];

            Singer.RhythmActions.doRhythmicDot(arg, turtle, blk);

            return [args[1], 1];
        }
    }

    /**
     * Represents a block for handling rests with a different implementation.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class Rest2Block extends FlowBlock {
        /**
         * Creates an instance of Rest2Block.
         */
        constructor() {
            super("rest2", _("silence"));
            this.setPalette("rhythm", activity);
            this.beginnerBlock(true);
            this.setHelpString([
                _(
                    "A rest of the specified note value duration can be constructed using a Silence block."
                ),
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

        /**
         * Handles the flow of the rest block with a different implementation.
         * @param {Array} args - Block arguments.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle identifier.
         */
        flow(args, logo, turtle) {
            Singer.RhythmActions.playRest(turtle);
        }
    }

    /**
     * Represents a block for handling drum notes with a duration of 1/4 beat.
     * Extends FlowClampBlock.
     * @class
     * @extends FlowClampBlock
     */
    class Note4Block extends FlowClampBlock {
        /**
         * Creates an instance of Note4Block.
         */
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

        /**
         * Overrides the flow method to provide an empty implementation.
         */
        flow() {}
    }

    /**
     * Represents a generic note value block for rhythm.
     * Extends FlowClampBlock.
     * @class
     * @extends FlowClampBlock
     */
    class _NoteValueBlock extends FlowClampBlock {
        /**
         * Creates an instance of _NoteValueBlock.
         * @param {string} name - The name of the block.
         * @param {string} value - The value associated with the block.
         */
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

        /**
         * Overrides the flow method to provide an empty implementation.
         */
        flow() {}
    }

    /**
     * Represents a note value block for a specific hertz value (392 hertz).
     * Extends _NoteValueBlock.
     * @class
     * @extends _NoteValueBlock
     */
    class Note3Block extends _NoteValueBlock {
        /**
         * Creates an instance of Note3Block.
         */
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

        /**
         * Overrides the flow method to provide an empty implementation.
         */
        flow() {}
    }

    /**
     * Represents a note value block for a specific pitch number (7).
     * Extends _NoteValueBlock.
     * @class
     * @extends _NoteValueBlock
     */
    class Note5Block extends _NoteValueBlock {
        /**
         * Creates an instance of Note5Block.
         */
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

        /**
         * Overrides the flow method to provide an empty implementation.
         */
        flow() {}
    }

    /**
     * Represents a note value block for a specific pitch number (4 4).
     * Extends _NoteValueBlock.
     * @class
     * @extends _NoteValueBlock
     */
    class Note7Block extends _NoteValueBlock {
        /**
         * Creates an instance of Note7Block.
         */
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

        /**
         * Overrides the flow method to provide an empty implementation.
         */
        flow() {}
    }

    /**
     * Represents a note value block for a specific scale degree.
     * Extends _NoteValueBlock.
     * @class
     * @extends _NoteValueBlock
     */
    class Note8Block extends _NoteValueBlock {
        /**
         * Creates an instance of Note8Block.
         */
        constructor() {
            super("note8", _("scale degree"));
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

        /**
         * Overrides the flow method to provide an empty implementation.
         */
        flow() {}
    }

    /**
     * Represents a note value block for a specific scale degree.
     * Extends _NoteValueBlock.
     * @class
     * @extends _NoteValueBlock
     */
    class Note6Block extends _NoteValueBlock {
        /**
         * Creates an instance of Note6Block.
         */
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

        /**
         * Overrides the flow method to provide an empty implementation.
         */
        flow() {}
    }

    /**
     * Represents a note value block for a specific pitch.
     * Extends _NoteValueBlock.
     * @class
     * @extends _NoteValueBlock
     */
    class Note2Block extends _NoteValueBlock {
        /**
         * Creates an instance of Note2Block.
         */
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

        /**
         * Overrides the flow method to provide an empty implementation.
         */
        flow() {}
    }

    /**
     * Represents a note value block for a specific solfege pitch.
     * Extends _NoteValueBlock.
     * @class
     * @extends _NoteValueBlock
     */
    class Note1Block extends _NoteValueBlock {
        /**
         * Creates an instance of Note1Block.
         */
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

        /**
         * Overrides the flow method to provide an empty implementation.
         */
        flow() {}
    }

    /**
     * Represents a deprecated note value block.
     * Extends FlowClampBlock.
     * @class
     * @extends FlowClampBlock
     */
    class NoteBlock extends FlowClampBlock {
        /**
         * Creates an instance of NoteBlock.
         */
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

        /**
         * Overrides the flow method to handle note value and pitch.
         * @param {number[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle index.
         * @param {object} blk - The block object.
         * @param {object} receivedArg - The received argument.
         * @returns {number[]} An array containing the processed arguments.
         */
        flow(args, logo, turtle, blk, receivedArg) {
            // Should never happen, but if it does, nothing to do
            if (args[1] === undefined) return;

            if (args[0] === null || typeof args[0] !== "number")
                activity.errorMsg(NOINPUTERRORMSG, blk);
            else if (args[0] <= 0) activity.errorMsg(_("Note value must be greater than 0."), blk);
            const value =
                args[0] === null || typeof args[0] !== "number" ? 1 / 4 : Math.abs(args[0]);

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

    /**
     * Represents a Note block.
     * Extends FlowClampBlock.
     * @class
     * @extends FlowClampBlock
     */
    class NewNoteBlock extends FlowClampBlock {
        /**
         * Creates an instance of NewNoteBlock.
         */
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

        /**
         * Overrides the flow method to handle note value, pitch, and delayed notes.
         * @param {number[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle index.
         * @param {object} blk - The block object.
         * @param {object} receivedArg - The received argument.
         * @returns {number[]} An array containing the processed arguments.
         */
        flow(args, logo, turtle, blk, receivedArg) {
            // Should never happen, but if it does, nothing to do
            if (args[1] === undefined) return;

            if (args[0] === null || typeof args[0] !== "number")
                activity.errorMsg(NOINPUTERRORMSG, blk);
            else if (args[0] <= 0) activity.errorMsg(_("Note value must be greater than 0."), blk);

            const value =
                args[0] === null || typeof args[0] !== "number" ? 1 / 4 : Math.abs(args[0]);

            const _callback = () => {
                const tur = activity.turtles.ithTurtle(turtle);

                const queueBlock = new Queue(args[1], 1, blk, receivedArg);
                tur.parentFlowQueue.push(blk);
                tur.queue.push(queueBlock);
            };

            const tur = activity.turtles.ithTurtle(turtle);
            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.delayedNotes.push([blk, value]);
            }
            Singer.RhythmActions.playNote(value, "newnote", turtle, blk, _callback);
            return [args[1], 1];
        }
    }

    /**
     * Represents a Define Frequency block.
     * Extends FlowClampBlock.
     * @class
     * @extends FlowClampBlock
     */
    class DefineFrequencyBlock extends FlowClampBlock {
        /**
         * Creates an instance of DefineFrequencyBlock.
         */
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

    /**
     * Represents an Octave Space block.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class OctaveSpaceBlock extends FlowBlock {
        /**
         * Creates an instance of OctaveSpaceBlock.
         */
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
