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

   _, last, Singer, FlowBlock, ValueBlock, FlowClampBlock,
   DEFAULTDRUM, DEFAULTEFFECT, NOINPUTERRORMSG, DEFAULTNOISE
*/

/* exported setupDrumBlocks */

function setupDrumBlocks(activity) {
    /**
     * Represents a block used to select a noise synthesizer.
     * @extends {ValueBlock}
     */
    class NoiseNameBlock extends ValueBlock {
        /**
         * Constructs a NoiseNameBlock.
         */
        constructor() {
            // Call the constructor of the parent class (ValueBlock)
            super("noisename", _("noise name"));

            /**
             * Sets the palette for the block.
             * @param {string} "drum" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("drum", activity);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.outType - The output type of the block.
             */
            this.formBlock({ outType: "textout" });

            /**
             * Sets the extra width for the block.
             * @type {number}
             */
            this.extraWidth = 50;

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Noise name block is used to select a noise synthesizer."),
                "documentation",
                ""
            ]);
        }
    }
    /**
     * Represents a block used to select a drum.
     * @extends {ValueBlock}
     */
    class DrumNameBlock extends ValueBlock {
        /**
         * Constructs a DrumNameBlock.
         */
        constructor() {
            // Call the constructor of the parent class (ValueBlock)
            super("drumname", _("drum name"));

            /**
             * Sets the palette for the block.
             * @param {string} "drum" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("drum", activity);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.outType - The output type of the block.
             */
            this.formBlock({ outType: "textout" });

            /**
             * Sets the extra width for the block.
             * @type {number}
             */
            this.extraWidth = 50;

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Drum name block is used to select a drum."),
                "documentation",
                null,
                "note4"
            ]);
        }
    }
    /**
     * Represents a block used to select a sound effect.
     * @extends {ValueBlock}
     */
    class EffectsNameBlock extends ValueBlock {
        /**
         * Constructs an EffectsNameBlock.
         */
        constructor() {
            // Call the constructor of the parent class (ValueBlock)
            super("effectsname", _("effects name"));

            /**
             * Sets the palette for the block.
             * @param {string} "drum" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("drum", activity);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.outType - The output type of the block.
             */
            this.formBlock({ outType: "textout" });

            /**
             * Sets the extra width for the block.
             * @type {number}
             */
            this.extraWidth = 50;

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Effects name block is used to select a sound effect."),
                "documentation",
                null,
                "effectshelp"
            ]);
        }
    }
    /**
     * Represents a block that generates white, pink, or brown noise.
     * @extends {FlowBlock}
     */
    class PlayNoiseBlock extends FlowBlock {
        /**
         * Constructs a PlayNoiseBlock.
         */
        constructor() {
            // Call the constructor of the parent class (FlowBlock)
            super("playnoise", _("noise"));

            /**
             * Sets the palette for the block.
             * @param {string} "drum" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("drum", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Play noise block will generate white, pink, or brown noise."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {Object} config.args - The arguments for the block.
             * @param {string[]} config.defaults - The default values for arguments.
             * @param {string[]} config.argTypes - The types of arguments.
             */
            this.formBlock({
                args: 1,
                defaults: [_("white noise")],
                argTypes: ["anyin"]
            });

            /**
             * Creates a macro for the block with specified configuration.
             * @param {number} x - The x-coordinate for the macro.
             * @param {number} y - The y-coordinate for the macro.
             * @returns {Array[]} - The macro configuration.
             */
            this.makeMacro((x, y) => [
                [0, "playnoise", x, y, [null, 1, null]],
                [1, ["noisename", { value: DEFAULTNOISE }], 0, 0, [0]]
            ]);
        }

        /**
         * Handles the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            let arg = args[0];
            if (args.length !== 1 || arg == null || typeof arg !== "string") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = "noise1";
            }

            Singer.DrumActions.playNoise(arg, turtle, blk);
        }
    }
    /**
     * Creates PlayDrumMacroBlock instances and sets up the drum macros for the activity.
     */
    function _createPlayDrumMacros() {
        /**
         * Represents a PlayDrumMacroBlock, a specialized type of FlowBlock for drum macros.
         * @extends {FlowBlock}
         */
        class PlayDrumMacroBlock extends FlowBlock {
            /**
             * Constructs a PlayDrumMacroBlock.
             * @param {string} name - The name of the drum macro block.
             * @param {string} [displayName] - The display name of the drum macro block.
             * @param {boolean} [isDrum] - Indicates whether the block represents a drum.
             * @param {string} [drumName] - The drum name associated with the block.
             */
            constructor(name, displayName, isDrum, drumName) {
                // Call the constructor of the parent class (FlowBlock)
                if (displayName === undefined) {
                    super(name, _(name));
                } else {
                    super(name, _(displayName));
                }

                /**
                 * Sets the palette for the block.
                 * @param {string} "drum" - The palette category.
                 * @param {Activity} activity - The activity associated with the block.
                 */
                this.setPalette("drum", activity);

                /**
                 * Forms the block with specified configuration.
                 * @param {Object} config - The configuration object.
                 * @param {Object} config.args - The arguments for the block.
                 */
                this.formBlock({ args: 1 });

                /**
                 * Creates a macro for the block with specified configuration.
                 * @param {number} x - The x-coordinate for the macro.
                 * @param {number} y - The y-coordinate for the macro.
                 * @returns {Array[]} - The macro configuration.
                 */
                this.makeMacro((x, y) => [
                    [0, "playdrum", x, y, [null, 1, null]],
                    [
                        1,
                        [
                            isDrum ? "drumname" : "effectsname",
                            {
                                value: drumName || (isDrum ? displayName || name : name)
                            }
                        ],
                        0,
                        0,
                        [0]
                    ]
                ]);
            }
        }

        // Create instances of PlayDrumMacroBlock and set up drum macros for the activity
        new PlayDrumMacroBlock("duck").setup(activity);
        new PlayDrumMacroBlock("cat").setup(activity);
        new PlayDrumMacroBlock("cricket").setup(activity);
        new PlayDrumMacroBlock("dog").setup(activity);
        new PlayDrumMacroBlock("bottle").setup(activity);
        new PlayDrumMacroBlock("bubbles").setup(activity);
        new PlayDrumMacroBlock("chine", "chime", true).setup(activity);
        new PlayDrumMacroBlock("clang").setup(activity);
        new PlayDrumMacroBlock("clap").setup(activity);
        new PlayDrumMacroBlock("slap").setup(activity);
        new PlayDrumMacroBlock("crash").setup(activity);
        new PlayDrumMacroBlock("splash").setup(activity);
        new PlayDrumMacroBlock("cowbell", "cow bell", true).setup(activity);
        new PlayDrumMacroBlock("ridebell", "ride bell", true).setup(activity);
        new PlayDrumMacroBlock("fingercymbals", "finger cymbals", true).setup(activity);
        new PlayDrumMacroBlock("trianglebell", "triangle bell", true).setup(activity);
        new PlayDrumMacroBlock("hihat", "hi hat", true).setup(activity);
        new PlayDrumMacroBlock("darbuka", "darbuka drum", true).setup(activity);
        new PlayDrumMacroBlock("cup", "cup drum", true).setup(activity);
        new PlayDrumMacroBlock("floortom", "floor tom", true, "floor tom tom").setup(activity);
        new PlayDrumMacroBlock("tom", "tom tom", true).setup(activity);
        new PlayDrumMacroBlock("kick", "kick drum", true).setup(activity);
        new PlayDrumMacroBlock("snare", "snare drum", true).setup(activity);
    }
    /**
     * Class representing a MapDrumBlock, extending FlowClampBlock.
     */
    class MapDrumBlock extends FlowClampBlock {
        /**
         * Create a MapDrumBlock.
         */
        constructor() {
            super("mapdrum");

            /**
             * Set the palette and help string for the block.
             */
            this.setPalette("drum", activity);
            this.setHelpString([
                _("Replace every instance of a pitch with a drum sound."),
                "documentation",
                null,
                "mapdrumhelp"
            ]);

            /**
             * Form the block with specified parameters.
             */
            this.formBlock({
                //.TRANS: map a pitch to a drum sound
                name: _("map pitch to drum"),
                args: 1,
                argTypes: ["anyin"]
            });

            /**
             * Make a macro with specified parameters.
             */
            this.makeMacro((x, y) => [
                [0, "mapdrum", x, y, [null, 1, 3, 2]],
                [1, ["drumname", { value: "kick drum" }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]],
                [3, "pitch", 0, 0, [0, 4, 5, null]],
                [4, ["solfege", { value: "sol" }], 0, 0, [3]],
                [5, ["number", { value: 4 }], 0, 0, [3]]
            ]);
        }

        /**
         * Perform the flow of the block.
         *
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {Object} blk - The block object.
         * @returns {Array} - The result of the flow.
         */
        flow(args, logo, turtle, blk) {
            Singer.DrumActions.mapPitchToDrum(args[0], turtle, blk);

            return [args[1], 1];
        }
    }
    /**
     * Class representing a SetDrumBlock, extending FlowClampBlock.
     */
    class SetDrumBlock extends FlowClampBlock {
        /**
         * Create a SetDrumBlock.
         */
        constructor() {
            super("setdrum");

            /**
             * Set the palette and configure as a beginner block.
             */
            this.setPalette("drum", activity);
            this.beginnerBlock(true);

            /**
             * Set the help string based on beginner mode and language.
             */
            if (activity.beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _(
                        "The Set drum block will select a drum sound to replace the pitch of any contained notes."
                    ),
                    "documentation",
                    null,
                    "rhythmruler2"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Set drum block will select a drum sound to replace the pitch of any contained notes."
                    ) +
                        " " +
                        _("In the example above, a kick drum sound will be played instead of sol."),
                    "documentation",
                    null,
                    "setdrumhelp"
                ]);
            }

            /**
             * Form the block with specified parameters.
             */
            this.formBlock({
                //.TRANS: set the current drum sound for playback
                name: _("set drum"),
                args: 1,
                argTypes: ["anyin"]
            });

            /**
             * Make a macro with specified parameters.
             */
            this.makeMacro((x, y) => [
                [0, "setdrum", x, y, [null, 1, 2, 7]],
                [1, ["drumname", { value: DEFAULTDRUM }], 0, 0, [0]],
                [2, "rhythm2", 0, 0, [0, 3, 4, null]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, "divide", 0, 0, [2, 5, 6]],
                [5, ["number", { value: 1 }], 0, 0, [4]],
                [6, ["number", { value: 1 }], 0, 0, [4]],
                [7, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Perform the flow of the block.
         *
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {Object} blk - The block object.
         * @returns {Array} - The result of the flow.
         */
        flow(args, logo, turtle, blk) {
            Singer.DrumActions.setDrum(args[0], turtle, blk);

            return [args[1], 1];
        }
    }

    /**
     * Class representing a PlayEffectBlock, extending FlowBlock.
     */
    class PlayEffectBlock extends FlowBlock {
        /**
         * Create a PlayEffectBlock.
         */
        constructor() {
            super("playeffect", _("sound effect"));

            /**
             * Set the palette, configure as a beginner block, and form the block.
             */
            this.setPalette("drum", activity);
            this.beginnerBlock(true);
            this.formBlock({ args: 1, argTypes: ["anyin"] });

            /**
             * Make a macro with specified parameters.
             */
            this.makeMacro((x, y) => [
                [0, "playdrum", x, y, [null, 1, null]],
                [1, ["effectsname", { value: DEFAULTEFFECT }], 0, 0, [0]]
            ]);
        }
    }
    /**
     * Class representing a PlayDrumBlock, extending FlowBlock.
     */
    class PlayDrumBlock extends FlowBlock {
        /**
         * Create a PlayDrumBlock.
         */
        constructor() {
            super("playdrum", _("drum"));

            /**
             * Set the palette, configure as a beginner block, and form the block.
             */
            this.setPalette("drum", activity);
            this.beginnerBlock(true);

            /**
             * Set the help string for the block.
             */
            this.setHelpString([
                _("You can use multiple Drum blocks within a Note block."),
                "documentation",
                null,
                "note4"
            ]);

            /**
             * Form the block with specified parameters.
             */
            this.formBlock({ args: 1, argTypes: ["anyin"] });

            /**
             * Make a macro with specified parameters.
             */
            this.makeMacro((x, y) => [
                [0, "playdrum", x, y, [null, 1, null]],
                [1, ["drumname", { value: DEFAULTDRUM }], 0, 0, [0]]
            ]);
        }

        /**
         * Perform the flow of the block.
         *
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {Object} turtle - The turtle object.
         * @param {Object} blk - The block object.
         */
        flow(args, logo, turtle, blk) {
            let arg = args[0];

            /**
             * Validate input and handle errors.
             */
            if (args.length !== 1 || arg == null || typeof arg !== "string") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = DEFAULTDRUM;
            }

            let drumname = Singer.DrumActions.GetDrumname(args[0]);

            const tur = activity.turtles.ithTurtle(turtle);

            // If we are in a setdrum clamp, override the drum name
            if (tur.singer.drumStyle.length > 0) {
                drumname = last(tur.singer.drumStyle);
            }

            /**
             * Handle different contexts for playing the drum.
             */
            if (logo.inPitchDrumMatrix) {
                // Handle Pitch Drum Matrix context
                logo.pitchDrumMatrix.drums.push(drumname);
                logo.pitchDrumMatrix.addColBlock(blk);
                if (logo.drumBlocks.indexOf(blk) === -1) {
                    logo.drumBlocks.push(blk);
                }
            } else if (logo.inMatrix) {
                // Handle Matrix context
                logo.phraseMaker.rowLabels.push(drumname);
                logo.phraseMaker.rowArgs.push(-1);

                logo.phraseMaker.addRowBlock(blk);
                if (logo.drumBlocks.indexOf(blk) === -1) {
                    logo.drumBlocks.push(blk);
                }
            } else if (logo.inMusicKeyboard) {
                // Handle Music Keyboard context
                logo.musicKeyboard.instruments.push(drumname);
                logo.musicKeyboard.noteNames.push("drum");
                logo.musicKeyboard.octaves.push(null);
                logo.musicKeyboard.addRowBlock(blk);
            } else if (
                tur.singer.inNoteBlock.length > 0 ||
                (activity.blocks.blockList[blk].connections[0] == null &&
                    last(activity.blocks.blockList[blk].connections) == null)
            ) {
                // Handle other contexts
                Singer.DrumActions.playDrum(args[0], turtle, blk);
            } else {
                // eslint-disable-next-line no-console
                console.debug("PLAY DRUM ERROR: missing context");
                return;
            }

            /**
             * Handle note-related context.
             */
            if (tur.singer.inNoteBlock.length > 0) {
                tur.singer.noteBeatValues[last(tur.singer.inNoteBlock)].push(tur.singer.beatFactor);
            }

            tur.singer.pushedNote = true;
        }
    }

    new NoiseNameBlock().setup(activity);
    new DrumNameBlock().setup(activity);
    new EffectsNameBlock().setup(activity);
    new PlayNoiseBlock().setup(activity);
    _createPlayDrumMacros();
    new MapDrumBlock().setup(activity);
    new SetDrumBlock().setup(activity);
    new PlayEffectBlock().setup(activity);
    new PlayDrumBlock().setup(activity);
}
