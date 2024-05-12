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

   _, FlowBlock, ValueBlock, LeftBlock, NOINPUTERRORMSG, SOLFEGENAMES,
   NOBOXERRORMSG
*/

/* exported setupBoxesBlocks */

function setupBoxesBlocks(activity) {
    /**
     * Represents a block used to increment the value stored in a box.
     * @extends {FlowBlock}
     */
    class IncrementBlock extends FlowBlock {
        /**
         * Constructs an IncrementBlock.
         * @param {string} [name="increment"] - The name of the block.
         */
        constructor(name) {
            super(name || "increment");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

            /**
             * Sets whether the block is suitable for beginners.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block based on the language and beginner mode.
             * @type {string[]}
             */
            if (activity.beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _("The Add-to block is used to add to the value stored in a box."),
                    "documentation",
                    ""
                ]);
            } else {
                this.setHelpString([
                    _("The Add-to block is used to add to the value stored in a box.") +
                        " " +
                        _("It can also be used with other blocks such as Color and Pen size."),
                    "documentation",
                    ""
                ]);
            }

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({
                name: _("add"),
                args: 2,
                argLabels: [_("to"), this.lang === "ja" ? _("value1") : _("value")],
                argTypes: ["anyin", "anyin"]
            });
        }

        /**
         * Handles the flow of the block.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            // If the 2nd arg is not set, default to 1.
            const i = args.length === 2 ? args[1] : 1;

            if (args.length > 0) {
                const cblk = activity.blocks.blockList[blk].connections[1];

                if (activity.blocks.blockList[cblk].name === "text") {
                    // Work-around to #1302
                    // Look for a namedbox with this text value.
                    const name = activity.blocks.blockList[cblk].value;
                    if (name in logo.boxes) {
                        logo.boxes[name] = logo.boxes[name] + i;
                        return;
                    }
                }

                let value = args[0] + i;

                // A special case for solfege stored in boxes.
                if (activity.blocks.blockList[cblk].name === "namedbox") {
                    let j = SOLFEGENAMES.indexOf(activity.blocks.blockList[cblk].value);
                    if (j !== -1) {
                        j = j >= SOLFEGENAMES.length ? 0 : j;
                        value = SOLFEGENAMES[j + i];
                    }
                }

                try {
                    activity.blocks.blockSetter(logo, cblk, value, turtle);
                } catch (e) {
                    activity.errorMsg(_("Block does not support incrementing."), cblk);
                }
            }
        }
    }
    /**
     * Represents a block used to add one to the value stored in a box.
     * @extends {IncrementBlock}
     */
    class IncrementOneBlock extends IncrementBlock {
        /**
         * Constructs an IncrementOneBlock.
         */
        constructor() {
            super("incrementOne");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

            /**
             * Sets whether the block is suitable for beginners.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Add-1-to block adds one to the value stored in a box."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({
                name: _("add 1 to"),
                args: 1,
                argTypes: ["anyin"],
                argLabels: [""]
            });
        }

        /**
         * Handles the flow of the block with the argument set to 1.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            args[1] = 1;
            super.flow(args, logo, turtle, blk);
        }
    }
    /**
     * Represents a block used to subtract one from the value stored in a box.
     * @extends {IncrementBlock}
     */
    class DecrementOneBlock extends IncrementBlock {
        /**
         * Constructs a DecrementOneBlock.
         */
        constructor() {
            super("decrementOne");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

            /**
             * Sets whether the block is suitable for beginners.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Subtract-1-from block subtracts one from the value stored in a box."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({
                name: _("subtract 1 from"),
                args: 1,
                argTypes: ["anyin"],
                argLabels: [""]
            });
        }

        /**
         * Handles the flow of the block with the argument set to -1.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            args[1] = -1;
            super.flow(args, logo, turtle, blk);
        }
    }
    /**
     * Represents a block that returns the value stored in a box.
     * @extends {LeftBlock}
     */
    class BoxBlock extends LeftBlock {
        /**
         * Constructs a BoxBlock.
         */
        constructor() {
            super("box");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

            /**
             * Indicates whether the block accepts a parameter.
             * @type {boolean}
             */
            this.parameter = true;

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Box block returns the value stored in a box."),
                "documentation",
                null,
                "box1help"
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({
                name: _("box"),
                outType: "anyout",
                args: 1,
                defaults: [_("box")],
                argTypes: ["anyin"]
            });
        }

        /**
         * Updates the parameter based on the value stored in a box.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {number} The value stored in the specified box.
         */
        updateParameter(logo, turtle, blk) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            const boxname = logo.parseArg(logo, turtle, cblk, blk, logo.receivedArg);

            if (boxname in logo.boxes) {
                return logo.boxes[boxname];
            } else {
                activity.errorMsg(NOBOXERRORMSG, blk, boxname);
                return 0;
            }
        }

        /**
         * Sets the value stored in a box.
         * @param {Logo} logo - The logo instance.
         * @param {number} value - The value to be set in the box.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        setter(logo, value, turtle, blk) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            const name = logo.parseArg(logo, turtle, cblk, blk, logo.receivedArg);

            if (name in logo.boxes) {
                logo.boxes[name] = value;
            } else {
                activity.errorMsg(NOBOXERRORMSG, blk, name);
            }
        }

        /**
         * Retrieves the value stored in a box.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {Object} receivedArg - The received arguments.
         * @returns {number} The value stored in the specified box.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];

            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }

            const name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            if (name in logo.boxes) {
                return logo.boxes[name];
            } else {
                activity.errorMsg(NOBOXERRORMSG, blk, name);
                return 0;
            }
        }
    }
    /**
     * Represents a block that returns the value stored in a named box.
     * @extends {ValueBlock}
     */
    class NamedBoxBlock extends ValueBlock {
        /**
         * Constructs a NamedBoxBlock.
         */
        constructor() {
            super("namedbox");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

            /**
             * Indicates whether the block is a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Indicates whether the block accepts a parameter.
             * @type {boolean}
             */
            this.parameter = true;

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Box block returns the value stored in a box."),
                "documentation",
                ""
            ]);

            /**
             * Sets additional width for the block.
             * @type {number}
             */
            this.extraWidth = 20;

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.outType - The type of output.
             */
            this.formBlock({
                name: _("box"),
                outType: "anyout"
            });
        }

        /**
         * Updates the parameter based on the value stored in a named box.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {number} The value stored in the specified named box.
         */
        updateParameter(logo, turtle, blk) {
            const name = activity.blocks.blockList[blk].privateData;

            if (name in logo.boxes) {
                return logo.boxes[name];
            } else {
                activity.errorMsg(NOBOXERRORMSG, blk, name);
                return 0;
            }
        }

        /**
         * Sets the value stored in a named box.
         * @param {Logo} logo - The logo instance.
         * @param {number} value - The value to be set in the named box.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        setter(logo, value, turtle, blk) {
            const name = activity.blocks.blockList[blk].privateData;

            if (name in logo.boxes) {
                logo.boxes[name] = value;
            } else {
                activity.errorMsg(NOBOXERRORMSG, blk, name);
            }
        }

        /**
         * Retrieves the value stored in a named box.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {number} The value stored in the specified named box.
         */
        arg(logo, turtle, blk) {
            const name = activity.blocks.blockList[blk].privateData;

            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, activity.blocks.blockList[blk].name]);
            } else if (!logo.updatingStatusMatrix) {
                if (name in logo.boxes) {
                    return logo.boxes[name];
                } else {
                    activity.errorMsg(NOBOXERRORMSG, blk, name);
                    return 0;
                }
            }
        }
    }
    /**
     * Represents a block that stores a value in a box.
     * @extends {FlowBlock}
     */
    class StoreIn2Block extends FlowBlock {
        /**
         * Constructs a StoreIn2Block.
         */
        constructor() {
            super("storein2");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

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
                _("The Store in block will store a value in a box."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The types of arguments.
             * @param {number[]} config.defaults - The default values of arguments.
             */
            this.formBlock({
                name: _("store in box"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [4]
            });
        }

        /**
         * Stores a value in a box.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         */
        flow(args, logo, turtle, blk) {
            if (args.length !== 1) return;

            /**
             * The private data associated with the block.
             * @type {string}
             */
            const privateData = activity.blocks.blockList[blk].privateData;

            /**
             * The value to be stored in the box.
             * @type {*}
             */
            const value = args[0];

            // Store the value in the box.
            logo.boxes[privateData] = value;
        }
    }
    /**
     * Represents a block that stores a value in a box.
     * @extends {FlowBlock}
     */
    class StoreInBlock extends FlowBlock {
        /**
         * Constructs a StoreInBlock.
         */
        constructor() {
            super("storein");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

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
                _("The Store in block will store a value in a box."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The types of arguments.
             * @param {number[]} config.defaults - The default values of arguments.
             * @param {string[]} config.argLabels - The labels for arguments.
             */
            this.formBlock({
                name: _("store in"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                defaults: [_("box"), 4],
                argLabels: this.lang === "ja" ? [_("name1"), _("value1")] : [_("name"), _("value")]
            });
        }

        /**
         * Stores a value in a box.
         * @param {Array} args - The arguments passed to the block.
         * @param {Logo} logo - The logo instance.
         */
        flow(args, logo) {
            if (args.length !== 2) return;

            /**
             * The name of the box to store the value.
             * @type {string}
             */
            const boxName = args[0];

            /**
             * The value to be stored in the box.
             * @type {*}
             */
            const value = args[1];

            // Store the value in the box.
            logo.boxes[boxName] = value;
        }
    }
    /**
     * Represents a block that returns the value stored in Box2.
     * @extends {ValueBlock}
     */
    class Box2Block extends ValueBlock {
        /**
         * Constructs a Box2Block.
         */
        constructor() {
            super("box2");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

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
                _("The Box2 block returns the value stored in Box2."),
                "documentation",
                null,
                "box2help"
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({ name: _("box2") });

            /**
             * Makes a macro for the block.
             * @param {number} x - The x-coordinate of the macro.
             * @param {number} y - The y-coordinate of the macro.
             * @returns {Array} - The macro configuration.
             */
            this.makeMacro((x, y) => [[0, ["namedbox", { value: "box2" }], x, y, [null]]]);
        }
    }
    /**
     * Represents a block used to store a value in Box2.
     * @extends {FlowBlock}
     */
    class StoreBox2Block extends FlowBlock {
        /**
         * Constructs a StoreBox2Block.
         */
        constructor() {
            super("storebox2");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

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
                _("The Store in Box2 block is used to store a value in Box2."),
                "documentation",
                null,
                "box2help"
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({
                name: _("store in box2"),
                args: 1,
                defaults: [4]
            });

            /**
             * Makes a macro for the block.
             * @param {number} x - The x-coordinate of the macro.
             * @param {number} y - The y-coordinate of the macro.
             * @returns {Array} - The macro configuration.
             */
            this.makeMacro((x, y) => [
                [0, ["storein2", { value: "box2" }], x, y, [null, 1, null]],
                [1, ["number", { value: 4 }], x, y, [0]]
            ]);
        }
    }
    /**
     * Represents a block that returns the value stored in Box1.
     * @extends {ValueBlock}
     */
    class Box1Block extends ValueBlock {
        /**
         * Constructs a Box1Block.
         */
        constructor() {
            super("box1");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

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
                _("The Box1 block returns the value stored in Box1."),
                "documentation",
                null,
                "box1help"
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({ name: _("box1") });

            /**
             * Makes a macro for the block.
             * @param {number} x - The x-coordinate of the macro.
             * @param {number} y - The y-coordinate of the macro.
             * @returns {Array} - The macro configuration.
             */
            this.makeMacro((x, y) => [[0, ["namedbox", { value: "box1" }], x, y, [null]]]);
        }
    }
    /**
     * Represents a block used to store a value in Box1.
     * @extends {FlowBlock}
     */
    class StoreBox1Block extends FlowBlock {
        /**
         * Constructs a StoreBox1Block.
         */
        constructor() {
            super("storebox1");

            /**
             * Sets the palette for the block.
             * @param {string} "boxes" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boxes", activity);

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
                _("The Store in Box1 block is used to store a value in Box1."),
                "documentation",
                null,
                "box1help"
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.args - The argument for the block.
             * @param {string[]} config.defaults - The default values for the arguments.
             */
            this.formBlock({
                name: _("store in box1"),
                args: 1,
                defaults: [4]
            });

            /**
             * Makes a macro for the block.
             * @param {number} x - The x-coordinate of the macro.
             * @param {number} y - The y-coordinate of the macro.
             * @returns {Array} - The macro configuration.
             */
            this.makeMacro((x, y) => [
                [0, ["storein2", { value: "box1" }], x, y, [null, 1, null]],
                [1, ["number", { value: 4 }], x, y, [0]]
            ]);
        }
    }

    new DecrementOneBlock().setup(activity);
    new IncrementOneBlock().setup(activity);
    new IncrementBlock().setup(activity);
    new BoxBlock().setup(activity);
    new NamedBoxBlock().setup(activity);
    new StoreIn2Block().setup(activity);
    new StoreInBlock().setup(activity);
    new Box2Block().setup(activity);
    new StoreBox2Block().setup(activity);
    new Box1Block().setup(activity);
    new StoreBox1Block().setup(activity);
}
