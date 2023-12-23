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

   _, ValueBlock, LeftBlock, FlowBlock, NOINPUTERRORMSG, Singer,
   NOACTIONERRORMSG, TONEBPM, FlowClampBlock
 */

/* exported setupMeterBlocks */

function setupMeterBlocks(activity) {
    /**
     * Represents a block that provides the current musical meter (time signature).
     * @class
     * @extends ValueBlock
     */
    class CurrentMeterBlock extends ValueBlock {
        /**
         * Constructs a CurrentMeterBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: musical meter (time signature), e.g., 4:4
            super("currentmeter", _("current meter"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.parameter = true;
            this.setHelpString();
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "currentmeter"]);
            } else {
                return Singer.MeterActions.getCurrentMeter(turtle);
            }
        }
    }

    /**
     * Represents a block that returns the ratio of the note value to the meter note value.
     * @class
     * @extends ValueBlock
     */
    class BeatFactorBlock extends ValueBlock {
        /**
         * Constructs a BeatFactorBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: number of beats per minute
            super("beatfactor", _("beat factor"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString([
                _(
                    "The Beat factor block returns the ratio of the note value to the meter note value."
                ),
                "documentation",
                ""
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Sets the value of the beat factor for the turtle.
         * @param {Logo} logo - The logo object.
         * @param {*} value - The value to set.
         * @param {number} turtle - The turtle identifier.
         */
        setter(logo, value, turtle) {
            activity.turtles.ithTurtle(turtle).singer.beatFactor = value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "beatfactor"]);
            } else {
                return Singer.MeterActions.getBeatFactor(turtle);
            }
        }
    }

    /**
     * Represents a block that returns the current beats per minute.
     * @class
     * @extends ValueBlock
     */
    class BPMFactorBlock extends ValueBlock {
        /**
         * Constructs a BPMFactorBlock instance.
         * @constructor
         */
        constructor() {
            super("bpmfactor");

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString([
                _("The Beats per minute block returns the current beats per minute."),
                "documentation",
                ""
            ]);

            // Form block with name for the beats per minute
            this.formBlock({
                //.TRANS: number of beats played per minute
                name: this.lang === "ja" ? _("beats per minute2") : _("beats per minute")
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Sets the beats per minute value for the turtle.
         * @param {Logo} logo - The logo object.
         * @param {*} value - The value to set.
         * @param {number} turtle - The turtle identifier.
         */
        setter(logo, value, turtle) {
            const tur = activity.turtles.ithTurtle(turtle);

            const len = tur.singer.bpm.length;
            if (len > 0) {
                tur.singer.bpm[len - 1] = value;
            } else {
                tur.singer.bpm.push(value);
            }
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "bpm"]);
            } else {
                return Singer.MeterActions.getBPM(turtle);
            }
        }
    }

    /**
     * Represents a block that returns the count of the current musical measure in the meter.
     * @class
     * @extends ValueBlock
     */
    class MeasureValueBlock extends ValueBlock {
        /**
         * Constructs a MeasureValueBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: count of current musical measure in meter
            super("measurevalue", _("measure count"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString([
                _("The Measure count block returns the current measure."),
                "documentation",
                ""
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "measurevalue"]);
            } else {
                return Singer.MeterActions.getMeasureCount(turtle);
            }
        }
    }

    /**
     * Represents a block that returns the count of the current beat in the meter.
     * @class
     * @extends ValueBlock
     */
    class BeatValueBlock extends ValueBlock {
        /**
         * Constructs a BeatValueBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: count of current beat in the meter
            super("beatvalue", _("beat count"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set help string for the block based on beginner mode and language
            if (activity.beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _("The Beat count block is the number of the current beat,") +
                        " " +
                        _(
                            "In the figure, it is used to take an action on the first beat of each measure."
                        ),
                    "documentation",
                    null,
                    "everybeathelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Beat count block is the number of the current beat,") +
                        " " +
                        _("eg 1, 2, 3, or 4.") +
                        " " +
                        _(
                            "In the figure, it is used to take an action on the first beat of each measure."
                        ),
                    "documentation",
                    null,
                    "beatvaluehelp"
                ]);
            }
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "beatvalue"]);
            } else {
                return Singer.MeterActions.getBeatCount(turtle);
            }
        }
    }

    /**
     * Represents a block that counts the number of contained notes.
     * @class
     * @extends LeftBlock
     */
    class NoteCounterBlock extends LeftBlock {
        /**
         * Constructs a NoteCounterBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: count the number of notes
            super("notecounter", _("sum note values"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString([
                _("The Note counter block can be used to count the number of contained notes."),
                "documentation",
                null,
                "notecounterhelp"
            ]);

            // Form block with flows type
            this.formBlock({
                flows: {
                    labels: [""],
                    type: "flow"
                }
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The argument value.
         */
        arg(logo, turtle, blk) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                return Singer.noteCounter(logo, turtle, cblk);
            }
        }
    }

    /**
     * Represents a block that counts the number of contained notes using an alternative method.
     * @class
     * @extends LeftBlock
     */
    class NoteCounterBlock2 extends LeftBlock {
        /**
         * Constructs a NoteCounterBlock2 instance.
         * @constructor
         */
        constructor() {
            //.TRANS: count the number of notes
            super("notecounter2", _("note counter"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.parameter = true;

            // Set help string for the block
            this.setHelpString([
                _("The Note counter block can be used to count the number of contained notes."),
                "documentation",
                null,
                "notecounterhelp"
            ]);

            // Form block with flows type
            this.formBlock({
                flows: {
                    labels: [""],
                    type: "flow"
                }
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The argument value.
         */
        arg(logo, turtle, blk) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                return Singer.numberOfNotes(logo, turtle, cblk);
            }
        }
    }

    /**
     * Represents a block that returns the total number of whole notes played.
     * @class
     * @extends ValueBlock
     */
    class ElapsedNotesBlock extends ValueBlock {
        /**
         * Constructs an ElapsedNotesBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: number of whole notes that have been played
            super("elapsednotes", _("whole notes played"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.parameter = true;
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([
                _("The Whole notes played block returns the total number of whole notes played."),
                "documentation",
                null,
                "elapsedhelp"
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The argument value.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "elapsednotes"]);
            } else {
                return Singer.MeterActions.getWholeNotesPlayed(turtle);
            }
        }
    }

    /**
     * Represents a block that returns the number of notes that have been played.
     * @class
     * @extends LeftBlock
     */
    class ElapsedNotes2Block extends LeftBlock {
        /**
         * Constructs an ElapsedNotes2Block instance.
         * @constructor
         */
        constructor() {
            //.TRANS: number of notes that have been played
            super("elapsednotes2", _("notes played"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.beginnerBlock(true);
            this.parameter = true;

            // Set help string for the block based on beginner mode and language
            if (activity.beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _("The Beat count block is the number of the current beat,") +
                        " " +
                        _(
                            "In the figure, it is used to take an action on the first beat of each measure."
                        ),
                    "documentation",
                    null,
                    "everybeathelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Beat count block is the number of the current beat,") +
                        " " +
                        _("eg 1, 2, 3, or 4.") +
                        " " +
                        _(
                            "In the figure, it is used to take an action on the first beat of each measure."
                        ),
                    "documentation",
                    null,
                    "beatvaluehelp"
                ]);
            }

            // Form block with args type
            this.formBlock({
                args: 1
            });

            // Make a macro with divide block
            this.makeMacro((x, y) => [
                [0, "elapsednotes2", x, y, [null, 1]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]]
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Returns the argument value for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {number} receivedArg - The received argument value.
         * @returns {*} - The argument value.
         */
        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "elapsednotes2"]);
            } else {
                const cblk = activity.blocks.blockList[blk].connections[1];
                const noteValue = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                return Singer.MeterActions.getNotesPlayed(noteValue, turtle);
            }
        }
    }

    /**
     * Represents a block that decouples the notes from the master clock.
     * @class
     * @extends FlowClampBlock
     */
    class DriftBlock extends FlowClampBlock {
        /**
         * Constructs a DriftBlock instance.
         * @constructor
         */
        constructor() {
            super("drift");

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.setHelpString([
                _("The No clock block decouples the notes from the master clock."),
                "documentation",
                ""
            ]);

            // Form block with name "no clock"
            this.formBlock({
                //.TRANS: don't lock notes to master clock
                name: _("no clock")
            });

            // Make a macro with hidden block
            this.makeMacro((x, y) => [
                [0, "drift", x, y, [null, null, 1]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {Array} - The result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === undefined) return;

            Singer.MeterActions.setNoClock(turtle, blk);

            return [args[0], 1];
        }
    }

    /**
     * Represents a block that specifies actions to take on weak (off) beats.
     * @class
     * @extends FlowBlock
     */
    class OffBeatDoBlock extends FlowBlock {
        /**
         * Constructs an OffBeatDoBlock instance.
         * @constructor
         */
        constructor() {
            // .TRANS: on musical 'offbeat' do some action
            super("offbeatdo", _("on weak beat do"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.setHelpString([
                _("The On-weak-beat block lets you specify actions to take on weak (off) beats."),
                "documentation",
                null,
                "everybeathelp"
            ]);

            // Form block with args type
            this.formBlock({
                args: 1,
                argTypes: ["textin"],
                defaults: [_("action")]
            });
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {number} receivedArg - The received argument value.
         * @param {Array} actionArgs - The arguments for the action.
         * @param {boolean} isflow - Indicates if the block is part of a flow.
         */
        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            if (!(args[0] in logo.actions)) {
                activity.errorMsg(NOACTIONERRORMSG, blk, args[1]);
            } else {
                Singer.MeterActions.onWeakBeatDo(args[0], isflow, receivedArg, turtle, blk);
            }
        }
    }

    /**
     * Represents a block that specifies actions to take on specified beats.
     * @class
     * @extends FlowBlock
     */
    class OnBeatDoBlock extends FlowBlock {
        /**
         * Constructs an OnBeatDoBlock instance.
         * @constructor
         */
        constructor() {
            // .TRANS: 'on' musical 'beat' 'do' some action
            super("onbeatdo", _("on strong beat"));

            // Set palette, activity, and piemenuValuesC1 for the block
            this.setPalette("meter", activity);
            this.piemenuValuesC1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

            // Set help string for the block
            this.setHelpString([
                _("The On-strong-beat block lets you specify actions to take on specified beats."),
                "documentation",
                null,
                "everybeathelp"
            ]);

            // Form block with args type
            this.formBlock({
                args: 2,
                argTypes: ["numberin", "textin"],
                defaults: [1, _("action")],
                argLabels: [_("beat"), this.lang === "ja" ? _("do1") : _("do")]
            });
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {number} receivedArg - The received argument value.
         * @param {Array} actionArgs - The arguments for the action.
         * @param {boolean} isflow - Indicates if the block is part of a flow.
         */
        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            if (args.length === 2) {
                if (!(args[1] in logo.actions)) {
                    activity.errorMsg(NOACTIONERRORMSG, blk, args[1]);
                } else {
                    Singer.MeterActions.onStrongBeatDo(
                        args[0],
                        args[1],
                        isflow,
                        receivedArg,
                        turtle,
                        blk
                    );
                }
            }
        }
    }

    /**
     * Represents a block that specifies actions to take on every beat.
     * @class
     * @extends FlowBlock
     */
    class EveryBeatDoBlockNew extends FlowBlock {
        /**
         * Constructs an EveryBeatDoBlockNew instance.
         * @constructor
         */
        constructor() {
            // .TRANS: on every beat, do some action
            super("everybeatdonew", _("on every beat do"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([
                _("The On-every-beat block lets you specify actions to take on every beat."),
                "documentation",
                null,
                "everybeathelp"
            ]);

            // Form block with args type
            this.formBlock({
                args: 1,
                argTypes: ["textin"],
                defaults: [_("action")]
            });

            // Make a macro with everybeatdonew block
            this.makeMacro((x, y) => {
                return [
                    [0, ["everybeatdonew", {}], x, y, [null, 1, null]],
                    [1, ["text", { value: "action" }], 0, 0, [0]]
                ];
            });
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {number} receivedArg - The received argument value.
         * @param {Array} actionArgs - The arguments for the action.
         * @param {boolean} isflow - Indicates if the block is part of a flow.
         */
        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            if (!(args[0] in logo.actions)) {
                activity.errorMsg(NOACTIONERRORMSG, blk, args[1]);
            } else {
                Singer.MeterActions.onEveryBeatDo(args[0], isflow, receivedArg, turtle, blk);
            }
        }
    }

    /**
     * Represents a block that specifies actions to take on every note.
     * @class
     * @extends FlowBlock
     */
    class EveryBeatDoBlock extends FlowBlock {
        /**
         * Constructs an EveryBeatDoBlock instance.
         * @constructor
         */
        constructor() {
            // .TRANS: on every note played, do some action
            super("everybeatdo", _("on every note do"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([
                _("The On-every-note block lets you specify actions to take on every note."),
                "documentation",
                null,
                "everybeathelp"
            ]);

            // Form block with args type
            this.formBlock({
                args: 1,
                argTypes: ["textin"],
                defaults: [_("action")]
            });
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {number} receivedArg - The received argument value.
         * @param {Array} actionArgs - The arguments for the action.
         * @param {boolean} isflow - Indicates if the block is part of a flow.
         */
        flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow) {
            // Set up a listener for every beat for this turtle.
            if (!(args[0] in logo.actions)) {
                activity.errorMsg(NOACTIONERRORMSG, blk, args[1]);
            } else {
                Singer.MeterActions.onEveryNoteDo(args[0], isflow, receivedArg, turtle, blk);
            }
        }
    }

    /**
     * Represents a block that sets the number of 1/4 notes per minute for every voice.
     * @class
     * @extends FlowBlock
     */
    class SetMasterBPM2Block extends FlowBlock {
        /**
         * Constructs a SetMasterBPM2Block instance.
         * @constructor
         */
        constructor() {
            //.TRANS: sets tempo by defining a beat and beats per minute
            super("setmasterbpm2", _("master beats per minute"));

            // Set palette, activity, piemenuValuesC1, and beginnerBlock for the block
            this.setPalette("meter", activity);
            this.piemenuValuesC1 = [
                42, 46, 50, 54, 58, 63, 69, 76, 84, 90, 96, 104, 112, 120, 132, 144, 160, 176, 192,
                208
            ];
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([
                _(
                    "The Master beats per minute block sets the number of 1/4 notes per minute for every voice."
                ),
                "documentation",
                null,
                "setmasterbpm2"
            ]);

            // Form block with args type
            this.formBlock({
                args: 2,
                defaults: [90, 1 / 4],
                argLabels: [_("bpm"), _("beat value")]
            });

            // Make a macro with setmasterbpm2 block
            this.makeMacro((x, y) => [
                [0, "setmasterbpm2", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 90 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args.length === 2 && typeof args[0] === "number" && typeof args[1] === "number") {
                Singer.MeterActions.setMasterBPM(args[0], args[1], blk);

                logo.notation.notationTempo(turtle, args[0], args[1]);
            }

            if (logo.inTempo) {
                logo.tempo.BPMBlocks.push(blk);
                const bpmnumberblock = activity.blocks.blockList[blk].connections[1];
                logo.tempo.BPMs.push(activity.blocks.blockList[bpmnumberblock].text.text);
            }
        }
    }

    /**
     * Represents a block that sets the master beats per minute.
     * @class
     * @extends FlowBlock
     */
    class SetMasterBPMBlock extends FlowBlock {
        /**
         * Constructs a SetMasterBPMBlock instance.
         * @constructor
         */
        constructor() {
            super("setmasterbpm", _("master beats per minute"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);

            // Form block with args type
            this.formBlock({
                args: 1,
                defaults: [90]
            });

            // Hide the block
            this.hidden = true;
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args.length === 1 && typeof args[0] === "number") {
                if (args[0] < 30) {
                    activity.errorMsg(_("Beats per minute must be > 30."), blk);
                    Singer.masterBPM = 30;
                } else if (args[0] > 1000) {
                    activity.errorMsg(_("Maximum beats per minute is 1000."), blk);
                    Singer.masterBPM = 1000;
                } else {
                    Singer.masterBPM = args[0];
                }

                Singer.defaultBPMFactor = TONEBPM / Singer.masterBPM;
            }

            if (logo.inTempo) {
                logo.tempo.BPMBlocks.push(blk);
                const bpmnumberblock = activity.blocks.blockList[blk].connections[1];
                logo.tempo.BPMs.push(activity.blocks.blockList[bpmnumberblock].text.text);
            }
        }
    }

    /**
     * Represents a block that sets the beats per minute.
     * @class
     * @extends FlowBlock
     */
    class SetBPM3Block extends FlowBlock {
        /**
         * Constructs a SetBPM3Block instance.
         * @constructor
         */
        constructor() {
            //.TRANS: sets tempo by defining a beat and beats per minute
            super("setbpm3", _("beats per minute"));

            // Set palette, piemenuValuesC1, beginnerBlock, and activity for the block
            this.setPalette("meter", activity);
            this.piemenuValuesC1 = [
                42, 46, 50, 54, 58, 63, 69, 76, 84, 90, 96, 104, 112, 120, 132, 144, 160, 176, 192,
                208
            ];
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([
                _("The Beats per minute block sets the number of 1/4 notes per minute."),
                "documentation",
                null,
                "bpmhelp"
            ]);

            // Form block with args type
            this.formBlock({
                args: 2,
                defaults: [90, 1 / 4],
                argLabels: [_("bpm"), _("beat value")]
            });

            // Make a macro with setbpm3 block
            this.makeMacro((x, y) => [
                [0, "setbpm3", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 90 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args.length === 2 && typeof args[0] === "number" && typeof args[1] === "number") {
                Singer.MeterActions.setBPM(args[0], args[1], turtle, blk);

                logo.notation.notationTempo(turtle, args[0], args[1]);
            }

            if (logo.inTempo) {
                logo.tempo.BPMBlocks.push(blk);
                const bpmnumberblock = activity.blocks.blockList[blk].connections[1];
                logo.tempo.BPMs.push(activity.blocks.blockList[bpmnumberblock].text.text);
            }
        }
    }

    /**
     * Represents a block that sets the beats per minute with flow clamp.
     * @class
     * @extends FlowClampBlock
     */
    class SetBPM2Block extends FlowClampBlock {
        /**
         * Constructs a SetBPM2Block instance.
         * @constructor
         */
        constructor() {
            super("setbpm2");

            // Set palette and activity for the block
            this.setPalette("meter", activity);

            // Form block with args type
            this.formBlock({
                // .TRANS: sets tempo for notes contained in block
                name: _("beats per minute"),
                args: 2,
                argLabels: [_("bpm"), _("beat value")],
                defaults: [90, 1 / 4]
            });

            // Make a macro with setbpm2 block
            this.makeMacro((x, y) => [
                [0, "setbpm2", x, y, [null, 1, 3, 2, 6]],
                [1, ["number", { value: 90 }], 0, 0, [0]],
                [2, "vspace", 0, 0, [0, null]],
                [3, "divide", 0, 0, [0, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 4 }], 0, 0, [3]],
                [6, "hidden", 0, 0, [0, null]]
            ]);

            // Hide the block
            this.hidden = true;
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (args.length === 3 && typeof args[0] === "number" && typeof args[1] == "number") {
                let bpm = (args[0] * args[1]) / 0.25;
                if (args[0] < 30) {
                    activity.errorMsg(_("Beats per minute must be > 30."));
                    bpm = 30;
                } else if (args[0] > 1000) {
                    activity.errorMsg(_("Maximum beats per minute is 1000."));
                    bpm = 1000;
                }

                logo.notation.notationTempo(turtle, args[0], args[1]);
                tur.singer.bpm.push(bpm);

                const listenerName = "_bpm_" + turtle;
                logo.setDispatchBlock(blk, turtle, listenerName);

                // eslint-disable-next-line no-unused-vars
                const __listener = (event) => {
                    tur.singer.bpm.pop();
                };

                logo.setTurtleListener(turtle, listenerName, __listener);

                return [args[2], 1];
            }
        }
    }

    /**
     * Represents a block that sets the beats per minute with flow clamp.
     * @class
     * @extends FlowClampBlock
     */
    class SetBPMBlock extends FlowClampBlock {
        /**
         * Constructs a SetBPMBlock instance.
         * @constructor
         */
        constructor() {
            super("setbpm");

            // Set palette and activity for the block
            this.setPalette("meter", activity);

            // Form block with args type
            this.formBlock({
                // .TRANS: old block to set tempo using only bpm for notes contained in block
                name: _("beats per minute"),
                args: 1,
                defaults: [90]
            });

            // Make a macro with setbpm block
            this.makeMacro((x, y) => [
                [0, "setbpm", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 90 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);

            // Hide the block
            this.hidden = true;
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {Array} - Returns an array with the result of the flow.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (args.length === 2 && typeof args[0] === "number") {
                let bpm;
                if (args[0] < 30) {
                    activity.errorMsg(_("Beats per minute must be > 30."), blk);
                    bpm = 30;
                } else if (args[0] > 1000) {
                    activity.errorMsg(_("Maximum beats per minute is 1000."), blk);
                    bpm = 1000;
                } else {
                    bpm = args[0];
                }

                tur.singer.bpm.push(bpm);

                const listenerName = "_bpm_" + turtle;
                logo.setDispatchBlock(blk, turtle, listenerName);

                // eslint-disable-next-line no-unused-vars
                const __listener = (event) => {
                    tur.singer.bpm.pop();
                };

                logo.setTurtleListener(turtle, listenerName, __listener);

                return [args[1], 1];
            }
        }
    }

    /**
     * Represents a block that sets the pickup time for notes.
     * @class
     * @extends FlowBlock
     */
    class PickupBlock extends FlowBlock {
        /**
         * Constructs a PickupBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: anacrusis
            super("pickup", _("pickup"));

            // Set palette and activity for the block
            this.setPalette("meter", activity);

            // Set help string for the block
            this.setHelpString([
                _(
                    "The Pickup block is used to accommodate any notes that come in before the beat."
                ),
                "documentation",
                null,
                "pickup"
            ]);

            // Set extra width for the block
            this.extraWidth = 15;

            // Form block with args type
            this.formBlock({
                args: 1,
                defaults: [0]
            });

            // Make a macro with pickup block
            this.makeMacro((x, y) => [
                [0, "pickup", x, y, [null, 1, 4]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 0 }], 0, 0, [1]],
                [3, ["number", { value: 4 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            const arg0 = args[0];
            if (args.length !== 1 || typeof args[0] !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            Singer.MeterActions.setPickup(arg0, turtle, activity);
        }
    }

    /**
     * Represents a block that sets the musical meter (time signature).
     * @class
     * @extends FlowBlock
     */
    class MeterBlock extends FlowBlock {
        /**
         * Constructs a MeterBlock instance.
         * @constructor
         */
        constructor() {
            //.TRANS: musical meter (time signature), e.g., 4:4
            super("meter", _("meter"));

            // Set palette, piemenuValuesC1, beginnerBlock, and activity for the block
            this.setPalette("meter", activity);
            this.piemenuValuesC1 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
            this.beginnerBlock(true);

            // Set help string for the block
            this.setHelpString([
                _(
                    "The beat of the music is determined by the Meter block (by default, 4 1/4 notes per measure)."
                ),
                "documentation",
                null,
                "meter"
            ]);

            // Set extra width for the block
            this.extraWidth = 15;

            // Form block with args type
            this.formBlock({
                args: 2,
                defaults: [4, 1 / 4],
                argLabels: [_("number of beats"), _("note value")]
            });

            // Make a macro with meter block
            this.makeMacro((x, y) => [
                [0, "meter", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 4 }], 0, 0, [0]],
                [2, "divide", 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, "vspace", 0, 0, [0, null]]
            ]);
        }

        /**
         * Executes the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo object.
         * @param {number} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            const arg0 = args[0] === null || typeof args[0] !== "number" ? 4 : args[0];
            const arg1 = args[1] === null || typeof args[1] !== "number" ? 1 / 4 : args[1];

            if (
                args[0] === null ||
                typeof args[0] !== "number" ||
                args[1] === null ||
                typeof args[1] !== "number"
            ) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
            }

            if (logo.insideMeterWidget) logo._meterBlock = blk;
            if (logo.inMusicKeyboard) logo.musicKeyboard.meterArgs = args;

            Singer.MeterActions.setMeter(arg0, arg1, turtle);
        }
    }

    new CurrentMeterBlock().setup(activity);
    new BeatFactorBlock().setup(activity);
    new BPMFactorBlock().setup(activity);
    new MeasureValueBlock().setup(activity);
    new BeatValueBlock().setup(activity);
    new NoteCounterBlock().setup(activity);
    new NoteCounterBlock2().setup(activity);
    new ElapsedNotesBlock().setup(activity);
    new ElapsedNotes2Block().setup(activity);
    new DriftBlock().setup(activity);
    new OffBeatDoBlock().setup(activity);
    new OnBeatDoBlock().setup(activity);
    new EveryBeatDoBlockNew().setup(activity);
    new EveryBeatDoBlock().setup(activity);
    new SetMasterBPM2Block().setup(activity);
    new SetMasterBPMBlock().setup(activity);
    new SetBPM3Block().setup(activity);
    new SetBPM2Block().setup(activity);
    new SetBPMBlock().setup(activity);
    new PickupBlock().setup(activity);
    new MeterBlock().setup(activity);
}
