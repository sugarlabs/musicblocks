// Copyright (c) 2020-21 Walter Bender
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

   _, FlowBlock, LeftBlock, NOINPUTERRORMSG, Turtle
*/

/* exported setupDictBlocks */

function setupDictBlocks(activity) {
    /**
     * Represents a block used to display the contents of a dictionary at the top of the screen.
     * @extends {FlowBlock}
     */
    class ShowDictBlock extends FlowBlock {
        /**
         * Constructs a ShowDictBlock.
         */
        constructor() {
            super("showDict");

            /**
             * Sets the palette for the block.
             * @param {string} "dictionary" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("dictionary", activity);

            /**
             * Indicates whether the block is a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Indicates whether the block is hidden.
             * @type {boolean}
             */
            this.hidden = true;

            /**
             * Indicates whether the block is deprecated.
             * @type {boolean}
             */
            this.deprecated = true;

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _(
                    "The Show-dictionary block displays the contents of the dictionary at the top of the screen."
                ),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.args - The argument for the block.
             * @param {string[]} config.defaults - The default values for the arguments.
             */
            this.formBlock({
                name: _("show dictionary"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("My Dictionary")]
            });
        }

        /**
         * Handles the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The Logo instance.
         * @param {Turtle} turtle - The Turtle instance.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            Turtle.DictActions.showDict(args[0], turtle);
        }
    }
    /**
     * Represents a block used to return a dictionary.
     * @extends {LeftBlock}
     */
    class DictBlock extends LeftBlock {
        /**
         * Constructs a DictBlock.
         */
        constructor() {
            super("dictionary");

            /**
             * Sets the palette for the block.
             * @param {string} "dictionary" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("dictionary", activity);

            /**
             * Indicates whether the block is a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Dictionary block returns a dictionary."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.args - The argument for the block.
             * @param {string[]} config.defaults - The default values for the arguments.
             */
            this.formBlock({
                name: _("dictionary"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("My Dictionary")]
            });
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The Logo instance.
         * @param {Turtle} turtle - The Turtle instance.
         * @param {string} blk - The block identifier.
         * @param {string} receivedArg - The received argument.
         * @returns {object} The dictionary obtained from the specified argument.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            return Turtle.DictActions.getDict(a, turtle);
        }
    }
    /**
     * Represents a block used to return a value in the dictionary for a specified key.
     * @extends {LeftBlock}
     */
    class GetDictBlock extends LeftBlock {
        /**
         * Constructs a GetDictBlock.
         */
        constructor() {
            super("getDict");

            /**
             * Sets the palette for the block.
             * @param {string} "dictionary" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("dictionary", activity);

            /**
             * Indicates whether the block is a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Get-dict block returns a value in the dictionary for a specified key."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.args - The argument for the block.
             * @param {string[]} config.argTypes - The types of arguments for the block.
             * @param {string[]} config.argLabels - The labels for the arguments.
             * @param {string[]} config.defaults - The default values for the arguments.
             */
            this.formBlock({
                name: _("get value"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                argLabels: [_("name"), this.lang === "ja" ? _("key2") : _("key")],
                defaults: [_("My Dictionary"), this.lang === "ja" ? _("key2") : _("key")]
            });
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The Logo instance.
         * @param {Turtle} turtle - The Turtle instance.
         * @param {string} blk - The block identifier.
         * @param {string} receivedArg - The received argument.
         * @returns {object} The value obtained from the specified dictionary and key.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const k = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

            return Turtle.DictActions.getValue(a, k, turtle, blk);
        }
    }
    /**
     * Represents a block used to set a value in the dictionary for a specified key.
     * @extends {FlowBlock}
     */
    class SetDictBlock extends FlowBlock {
        /**
         * Constructs a SetDictBlock.
         */
        constructor() {
            super("setDict");

            /**
             * Sets the palette for the block.
             * @param {string} "dictionary" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("dictionary", activity);

            /**
             * Indicates whether the block is a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Set-dict block sets a value in the dictionary for a specified key."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.args - The argument for the block.
             * @param {string[]} config.argTypes - The types of arguments for the block.
             * @param {string[]} config.argLabels - The labels for the arguments.
             * @param {string[]} config.defaults - The default values for the arguments.
             */
            this.formBlock({
                name: _("set value"),
                args: 3,
                argTypes: ["anyin", "anyin", "anyin"],
                argLabels: [_("name"), this.lang === "ja" ? _("key2") : _("key"), _("value")],
                defaults: [_("My Dictionary"), this.lang === "ja" ? _("key2") : _("key"), 0]
            });
        }

        /**
         * Handles the flow of the block.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The Logo instance.
         * @param {Turtle} turtle - The Turtle instance.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null || args[2] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            Turtle.DictActions.setValue(...args, turtle);
        }
    }
    /**
     * Represents a block used to return a value in the dictionary for a specified key.
     * @extends {LeftBlock}
     */
    class GetDictBlock2 extends LeftBlock {
        /**
         * Constructs a GetDictBlock2.
         */
        constructor() {
            super("getDict2");

            /**
             * Sets the palette for the block.
             * @param {string} "dictionary" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("dictionary", activity);

            /**
             * Indicates whether the block is a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Get-dict block returns a value in the dictionary for a specified key."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.args - The argument for the block.
             * @param {string[]} config.argTypes - The types of arguments for the block.
             * @param {string[]} config.defaults - The default values for the arguments.
             */
            this.formBlock({
                //.TRANS: retrieve a value from the dictionary with a given key
                name: _("get value"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [this.lang === "ja" ? _("key2") : _("key")]
            });
        }

        /**
         * Gets the value from the dictionary for a specified key.
         * @param {Logo} logo - The Logo instance.
         * @param {Turtle} turtle - The Turtle instance.
         * @param {string} blk - The block identifier.
         * @param {Object} receivedArg - The received argument.
         * @returns {*} The value from the dictionary.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            if (cblk1 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            const a = activity.turtles.ithTurtle(turtle).name;
            const k = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);

            return Turtle.DictActions.getValue(a, k, turtle, blk);
        }
    }
    /**
     * Represents a block used to set a value in the dictionary for a specified key.
     * @extends {FlowBlock}
     */
    class SetDictBlock2 extends FlowBlock {
        /**
         * Constructs a SetDictBlock2.
         */
        constructor() {
            super("setDict2");

            /**
             * Sets the palette for the block.
             * @param {string} "dictionary" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("dictionary", activity);

            /**
             * Indicates whether the block is a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Set-dict block sets a value in the dictionary for a specified key."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.args - The argument for the block.
             * @param {string[]} config.argTypes - The types of arguments for the block.
             * @param {string[]} config.argLabels - The labels for the arguments.
             * @param {string[]} config.defaults - The default values for the arguments.
             */
            this.formBlock({
                //.TRANS: set a value in the dictionary for a given key
                name: _("set value"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                argLabels: [this.lang === "ja" ? _("key2") : _("key"), _("value")],
                defaults: [this.lang === "ja" ? _("key2") : _("key"), 0]
            });
        }

        /**
         * Sets the value in the dictionary for a specified key.
         * @param {Array} args - The arguments for the block.
         * @param {Logo} logo - The Logo instance.
         * @param {Turtle} turtle - The Turtle instance.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            Turtle.DictActions.setValue(activity.turtles.ithTurtle(turtle).name, ...args, turtle);
        }
    }

    new DictBlock().setup(activity);
    new ShowDictBlock().setup(activity);
    new SetDictBlock().setup(activity);
    new GetDictBlock().setup(activity);
    new SetDictBlock2().setup(activity);
    new GetDictBlock2().setup(activity);
}
