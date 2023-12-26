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

   _, FlowBlock, NOINPUTERRORMSG, ValueBlock, FlowClampBlock,
   LeftBlock, Singer, DEFAULTVOLUME, NANERRORMSG, last, VOICENAMES,
   DRUMNAMES, DEFAULTVOICE, DEFAULTDRUM
 */

/* exported setupVolumeBlocks */

function setupVolumeBlocks(activity) {
    /**
     * Represents a SynthVolumeBlock.
     * Extends LeftBlock.
     * @class
     * @extends LeftBlock
     */
    class SynthVolumeBlock extends LeftBlock {
        /**
         * Creates an instance of SynthVolumeBlock.
         */
        constructor() {
            // The volume for this synth
            super("synthvolumefactor", _("synth volume"));
            this.setPalette("volume", activity);
            this.parameter = true;
            this.setHelpString([
                _("The Synth volume block returns the current volume of the current synthesizer."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("piano")]
            });

            this.makeMacro((x, y) => [
                [0, "synthvolumefactor", x, y, [null, 1]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]]
            ]);
        }

        /**
         * Updates the parameter of the block.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle index.
         * @param {string} blk - Block ID.
         * @returns {object} The updated parameter.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Handles the arguments of the block.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle index.
         * @param {string} blk - Block ID.
         * @param {object} receivedArg - Received argument.
         * @returns {number} The synth volume.
         */
        arg(logo, turtle, blk, receivedArg) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "synth volume"]);
            } else {
                const cblk = activity.blocks.blockList[blk].connections[1];
                if (cblk !== null) {
                    const targetSynth = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    return Singer.VolumeActions.getSynthVolume(targetSynth, turtle);
                }
                return 0;
            }
        }
    }

    /**
     * Represents a MasterVolumeBlock.
     * Extends ValueBlock.
     * @class
     * @extends ValueBlock
     */
    class MasterVolumeBlock extends ValueBlock {
        /**
         * Creates an instance of MasterVolumeBlock.
         */
        constructor() {
            // The volume at which notes are played
            super("notevolumefactor", _("master volume"));
            this.setPalette("volume", activity);
            this.parameter = true;
            this.setHelpString([
                _("The Master volume block returns the master volume."),
                "documentation",
                ""
            ]);
        }

        /**
         * Sets the master volume.
         * @param {object} logo - Logo object.
         * @param {number} value - Volume value.
         * @param {number} turtle - Turtle index.
         */
        setter(logo, value, turtle) {
            const len = Singer.masterVolume.length;
            Singer.masterVolume[len - 1] = value;
            if (!activity.turtles.ithTurtle(turtle).singer.suppressOutput) {
                Singer.VolumeActions.setMasterVolume(logo, value);
            }
        }

        /**
         * Updates the parameter of the block.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle index.
         * @param {string} blk - Block ID.
         * @returns {object} The updated parameter.
         */
        updateParameter(logo, turtle, blk) {
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Handles the arguments of the block.
         * @param {object} logo - Logo object.
         * @param {number} turtle - Turtle index.
         * @param {string} blk - Block ID.
         * @returns {number} The master volume.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "volume"]);
            } else {
                return Singer.VolumeActions.masterVolume;
            }
        }
    }

    /**
     * Represents a PPPBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class PPPBlock extends FlowBlock {
        /**
         * Creates an instance of PPPBlock.
         */
        constructor() {
            super("ppp", "ppp");
            this.setPalette("volume", activity);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 10 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a PPBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class PPBlock extends FlowBlock {
        /**
         * Creates an instance of PPBlock.
         */
        constructor() {
            super("pp", "pp");
            this.setPalette("volume", activity);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 20 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a PBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class PBlock extends FlowBlock {
        /**
         * Creates an instance of PBlock.
         */
        constructor() {
            super("p", "p");
            this.setPalette("volume", activity);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 30 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents an MPBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class MPBlock extends FlowBlock {
        /**
         * Creates an instance of MPBlock.
         */
        constructor() {
            super("mp", "mp");
            this.setPalette("volume", activity);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 40 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents an MFBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class MFBlock extends FlowBlock {
        /**
         * Creates an instance of MFBlock.
         */
        constructor() {
            super("mf", "mf");
            this.setPalette("volume", activity);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 50 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents an FBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class FBlock extends FlowBlock {
        /**
         * Creates an instance of FBlock.
         */
        constructor() {
            super("f", "f");
            this.setPalette("volume", activity);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 60 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents an FFBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class FFBlock extends FlowBlock {
        /**
         * Creates an instance of FFBlock.
         */
        constructor() {
            super("ff", "ff");
            this.setPalette("volume", activity);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 80 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents an FFFBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class FFFBlock extends FlowBlock {
        /**
         * Creates an instance of FFFBlock.
         */
        constructor() {
            super("fff", "fff");
            this.setPalette("volume", activity);
            this.setHelpString();
            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 100 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a SetSynthVolume2Block.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class SetSynthVolume2Block extends FlowBlock {
        /**
         * Creates an instance of SetSynthVolume2Block.
         */
        constructor() {
            super("setsynthvolume2", _("set synth volume"));
            this.setPalette("volume", activity);
            this.setHelpString();
            this.formBlock({
                args: 2,
                defaults: [DEFAULTVOICE, 50],
                argTypes: ["textin", "numberin"],
                argLabels: [_("synth"), _("volume")]
            });
            this.hidden = true;
        }

        /**
         * Handles the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {Array} - An array containing the result and a flag indicating a successful flow.
         */
        flow(args, logo, turtle, blk) {
            // set synth volume in clamp form
            if (args[2] === undefined) {
                // Nothing to do.
                return;
            }

            let arg0, arg1;
            if (args[0] === null || typeof args[0] !== "string") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = DEFAULTVOICE;
            } else {
                arg0 = args[0];
            }

            if (args[1] === null || typeof args[1] !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg1 = 50;
            } else {
                if (args[1] < 0) {
                    arg1 = 0;
                } else if (args[1] > 100) {
                    arg1 = 100;
                } else {
                    arg1 = args[1];
                }

                if (arg1 === 0) {
                    activity.errorMsg(_("Setting volume to 0."), blk);
                }
            }

            let synth = null;

            if (arg0 === DEFAULTVOICE || arg0 === _(DEFAULTVOICE)) {
                synth = DEFAULTVOICE;
            } else if (arg0 === "custom" || args[0] === _("custom")) {
                synth = "custom";
            }

            if (synth === null) {
                for (const voice in VOICENAMES) {
                    if (VOICENAMES[voice][0] === arg0) {
                        synth = VOICENAMES[voice][1];
                        break;
                    } else if (VOICENAMES[voice][1] === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                for (const drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0].replace("-", " ") === arg0) {
                        synth = DRUMNAMES[drum][1];
                        break;
                    } else if (DRUMNAMES[drum][1].replace("-", " ") === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                activity.errorMsg(_("Synth not found"), blk);
                synth = DEFAULTVOICE;
            }

            const tur = activity.turtles.ithTurtle(turtle);

            if (tur.singer.instrumentNames.indexOf(synth) === -1) {
                tur.singer.instrumentNames.push(synth);
                logo.synth.loadSynth(turtle, synth);

                if (tur.singer.synthVolume[synth] === undefined) {
                    tur.singer.synthVolume[synth] = [DEFAULTVOLUME];
                    tur.singer.crescendoInitialVolume[synth] = [DEFAULTVOLUME];
                }
            }

            tur.singer.synthVolume[synth].push(arg1);
            if (!tur.singer.suppressOutput) {
                Singer.setSynthVolume(logo, turtle, synth, arg1);
            }

            const listenerName = "_synthvolume_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => {
                tur.singer.synthVolume[synth].pop();
                // Restore previous volume
                if (
                    tur.singer.justCounting.length === 0 &&
                    tur.singer.synthVolume[synth].length > 0
                ) {
                    Singer.setSynthVolume(logo, turtle, synth, last(tur.singer.synthVolume[synth]));
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[2], 1];
        }
    }

    /**
     * Represents a SetDrumVolumeBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class SetDrumVolumeBlock extends FlowBlock {
        /**
         * Creates an instance of SetDrumVolumeBlock.
         */
        constructor() {
            // .TRANS: set the loudness level
            super("setdrumvolume", _("set drum volume"));
            this.setPalette("volume", activity);
            this.beginnerBlock(true);

            this.formBlock({
                args: 2,
                defaults: [DEFAULTDRUM, 50],
                argTypes: ["textin", "numberin"],
                argLabels: [_("drum"), _("volume")]
            });

            this.makeMacro((x, y) => [
                [0, "setsynthvolume", x, y, [null, 1, 2, null]],
                [1, ["drumname", { value: DEFAULTDRUM }], 0, 0, [0]],
                [2, ["number", { value: 50 }], 0, 0, [0, null]]
            ]);
        }
    }

    /**
     * Represents a SetSynthVolumeBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class SetSynthVolumeBlock extends FlowBlock {
        /**
         * Creates an instance of SetSynthVolumeBlock.
         */
        constructor() {
            super("setsynthvolume", _("set synth volume"));
            this.setPalette("volume", activity);
            this.piemenuValuesC2 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set synth volume block will change the volume of a particular synth,") +
                    " " +
                    _("eg guitar violin snare drum etc.") +
                    " " +
                    _("The default volume is 50.") +
                    " " +
                    _("The range is 0 for silence to 100 for full volume."),
                "documentation",
                ""
            ]);

            this.formBlock({
                args: 2,
                defaults: [DEFAULTVOICE, 50],
                argTypes: ["textin", "numberin"],
                argLabels: [_("synth"), _("volume")]
            });

            this.makeMacro((x, y) => [
                [0, "setsynthvolume", x, y, [null, 1, 2, null]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 50 }], 0, 0, [0, null]]
            ]);
        }

        /**
         * Handles the flow of the SetSynthVolumeBlock.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         */
        flow(args, logo, turtle, blk) {
            let arg0 = args[0];
            if (arg0 === null || typeof arg0 !== "string") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = DEFAULTVOICE;
            }

            let arg1;
            if (args[1] === null || typeof args[1] !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg1 = 50;
            } else {
                arg1 = Math.max(Math.min(args[1], 100), 0);

                if (arg1 === 0) {
                    activity.errorMsg(_("Setting volume to 0."), blk);
                }
            }

            Singer.VolumeActions.setSynthVolume(arg0, arg1, turtle);
        }
    }

    /**
     * Represents a SetPanBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class SetPanBlock extends FlowBlock {
        /**
         * Creates an instance of SetPanBlock.
         */
        constructor() {
            // .TRANS: set the distribution of volume
            super("setpanning", _("set panning"));
            this.setPalette("volume", activity);
            this.piemenuValuesC1 = [100, 80, 60, 40, 20, 0, -20, -40, -60, -80, -100];
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set Panning block sets the panning for all synthesizers."),
                "documentation",
                ""
            ]);

            this.formBlock({ args: 1, defaults: [0] });
        }

        /**
         * Handles the flow of the SetPanBlock.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         */
        flow(args, logo, turtle, blk) {
            if (args.length === 1) {
                if (typeof args[0] !== "number") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else {
                    if (args[0] === 100 || args[0] === -100) {
                        activity.errorMsg(
                            _("Warning: Sound is coming out from only the left or right side."),
                            blk
                        );
                    }
                    Singer.VolumeActions.setPanning(args[0], turtle);
                }
            }
        }
    }

    /**
     * Represents a SetNoteVolumeBlock.
     * Extends FlowBlock.
     * @class
     * @extends FlowBlock
     */
    class SetNoteVolumeBlock extends FlowBlock {
        /**
         * Creates an instance of SetNoteVolumeBlock.
         */
        constructor() {
            // .TRANS: set the loudness level
            super("setnotevolume", _("set master volume"));
            this.setPalette("volume", activity);
            this.piemenuValuesC1 = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Set master volume block sets the volume for all synthesizers."),
                "documentation",
                ""
            ]);

            this.formBlock({ args: 1, defaults: [50] });
        }

        /**
         * Handles the flow of the SetNoteVolumeBlock.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         */
        flow(args, logo, turtle, blk) {
            if (args.length === 1) {
                if (typeof args[0] !== "number") {
                    activity.errorMsg(NANERRORMSG, blk);
                } else {
                    Singer.VolumeActions.setMasterVolume(args[0], turtle, blk);
                }
            }
        }
    }

    /**
     * Represents a SetNoteVolume2Block.
     * Extends FlowClampBlock.
     * @class
     * @extends FlowClampBlock
     */
    class SetNoteVolume2Block extends FlowClampBlock {
        /**
         * Creates an instance of SetNoteVolume2Block.
         */
        constructor() {
            super("setnotevolume2");
            this.setPalette("volume", activity);
            this.setHelpString();
            this.formBlock({
                // .TRANS: set the loudness level
                name: _("set master volume"),
                args: 1,
                defaults: [50]
            });

            this.makeMacro((x, y) => [
                [0, "setsynthvolume2", x, y, [null, 1, 2, null, 3]],
                [1, ["voicename", { value: DEFAULTVOICE }], 0, 0, [0]],
                [2, ["number", { value: 50 }], 0, 0, [0]],
                [3, "hidden", 0, 0, [0, null]]
            ]);

            this.hidden = true;
            this.deprecated = true;
        }

        /**
         * Handles the flow of the SetNoteVolume2Block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         */
        flow(args, logo, turtle, blk) {
            // master volume in clamp form
            // Used by fff ff f p pp ppp blocks
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let arg;
            if (args[0] === null || typeof args[0] !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 50;
            } else {
                if (args[0] < 0) {
                    arg = 0;
                } else if (args[0] > 100) {
                    arg = 100;
                } else {
                    arg = args[0];
                }

                if (arg === 0) {
                    activity.errorMsg(_("Setting volume to 0."), blk);
                }
            }

            const tur = activity.turtles.ithTurtle(turtle);

            Singer.masterVolume.push(arg);
            if (!tur.singer.suppressOutput) {
                Singer.setMasterVolume(logo, arg);
            }

            const listenerName = "_volume_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => {
                Singer.masterVolume.pop();
                // Restore previous volume
                if (tur.singer.justCounting.length === 0 && Singer.masterVolume.length > 0) {
                    Singer.setMasterVolume(logo, last(Singer.masterVolume));
                }
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    /**
     * Represents an ArticulationBlock.
     * Extends FlowClampBlock.
     * @class
     * @extends FlowClampBlock
     */
    class ArticulationBlock extends FlowClampBlock {
        /**
         * Creates an instance of ArticulationBlock.
         */
        constructor() {
            super("articulation");
            this.setPalette("volume", activity);
            this.piemenuValuesC1 = [-25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25];
            this.setHelpString([
                _("The Set relative volume block changes the volume of the contained notes."),
                "documentation",
                null,
                "articulationhelp"
            ]);
            this.formBlock({
                // .TRANS: set an articulation (change in volume)
                name: _("set relative volume"),
                args: 1,
                defaults: [50]
            });
            this.makeMacro((x, y) => [
                [0, "articulation", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 25 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handles the flow of the ArticulationBlock.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {Array} - The result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let arg = args[0];
            if (arg === null || typeof arg !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 0;
            }

            Singer.VolumeActions.setRelativeVolume(arg, turtle, blk);

            return [args[1], 1];
        }
    }

    /**
     * Represents a DecrescendoBlock.
     * Extends FlowClampBlock.
     * @class
     * @extends FlowClampBlock
     */
    class DecrescendoBlock extends FlowClampBlock {
        /**
         * Creates an instance of DecrescendoBlock.
         * @param {string} [name] - The name of the block.
         */
        constructor(name) {
            super(name || "decrescendo");
            this.setPalette("volume", activity);
            this.piemenuValuesC1 = [1, 2, 3, 4, 5, 10, 15, 20];
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Decrescendo block will decrease the volume of the contained notes by a specified amount for every note played."
                ) +
                    " " +
                    _(
                        "For example if you have 7 notes in sequence contained in a Decrescendo block with a value of 5 the final note will be at 35% less than the starting volume."
                    ),
                "documentation",
                null,
                "crescendohelp"
            ]);

            this.formBlock({
                // .TRANS: a gradual increase in loudness
                name: _("decrescendo"),
                args: 1,
                defaults: [5]
            });
            this.makeMacro((x, y) => [
                [0, "decrescendo", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 5 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handles the flow of the DecrescendoBlock.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {Array} - The result of the flow.
         */
        flow(args, logo, turtle, blk) {
            if (args.length > 1 && args[0] !== 0) {
                Singer.VolumeActions.doCrescendo(
                    activity.blocks.blockList[blk].name,
                    args[0],
                    turtle,
                    blk
                );

                return [args[1], 1];
            }
        }
    }

    /**
     * Represents a CrescendoBlock.
     * Extends DecrescendoBlock.
     * @class
     * @extends DecrescendoBlock
     */
    class CrescendoBlock extends DecrescendoBlock {
        /**
         * Creates an instance of CrescendoBlock.
         */
        constructor() {
            super("crescendo");
            this.setPalette("volume", activity);
            this.piemenuValuesC1 = [1, 2, 3, 4, 5, 10, 15, 20];
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Crescendo block will increase the volume of the contained notes by a specified amount for every note played."
                ) +
                    " " +
                    _(
                        "For example if you have 7 notes in sequence contained in a Crescendo block with a value of 5 the final note will be at 35% more than the starting volume."
                    ),
                "documentation",
                null,
                "crescendohelp"
            ]);

            this.formBlock({
                // .TRANS: a gradual increase in loudness
                name: _("crescendo"),
                args: 1,
                defaults: [5]
            });
            this.makeMacro((x, y) => [
                [0, "crescendo", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 5 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }
    }

    new MasterVolumeBlock().setup(activity);
    new SynthVolumeBlock().setup(activity);
    new PPPBlock().setup(activity);
    new PPBlock().setup(activity);
    new PBlock().setup(activity);
    new MPBlock().setup(activity);
    new MFBlock().setup(activity);
    new FBlock().setup(activity);
    new FFBlock().setup(activity);
    new FFFBlock().setup(activity);
    new SetSynthVolume2Block().setup(activity);
    new SetDrumVolumeBlock().setup(activity);
    new SetSynthVolumeBlock().setup(activity);
    new SetPanBlock().setup(activity);
    new SetNoteVolumeBlock().setup(activity);
    new SetNoteVolume2Block().setup(activity);
    new ArticulationBlock().setup(activity);
    new DecrescendoBlock().setup(activity);
    new CrescendoBlock().setup(activity);
}
