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

   _, BooleanBlock, NOINPUTERRORMSG
*/

/* exported setupBooleanBlocks */

function setupBooleanBlocks(activity) {
    /**
     * Represents a block for the logical NOT operator.
     * @extends {BooleanBlock}
     */
    class NotBlock extends BooleanBlock {
        /**
         * Constructs a NotBlock.
         */
        constructor() {
            super("not");

            /**
             * Sets the palette for the block.
             * @param {string} "boolean" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boolean", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Not block is the logical not operator."),
                "documentation",
                ""
            ]);

            /**
             * Specifies the parameter of the block.
             */
            this.parameter = true;

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: _("not"),
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {string} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {boolean} receivedArg - The received argument.
         * @returns {boolean} - The result of the argument handling.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];

            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }

            const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);

            try {
                return !a;
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(e);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }
    /**
     * Represents a block for the logical AND operator.
     * @extends {BooleanBlock}
     */
    class AndBlock extends BooleanBlock {
        /**
         * Constructs an AndBlock.
         */
        constructor() {
            super("and");

            /**
             * Sets the palette for the block.
             * @param {string} "boolean" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boolean", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The And block is the logical and operator."),
                "documentation",
                ""
            ]);

            /**
             * Specifies the parameter of the block.
             */
            this.parameter = true;

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: _("and"),
                args: 2,
                argTypes: ["booleanin", "booleanin"]
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {string} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {boolean} receivedArg - The received argument.
         * @returns {boolean} - The result of the argument handling.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            } else {
                const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                return a && b;
            }
        }
    }
    /**
     * Represents a block for the logical OR operator.
     * @extends {BooleanBlock}
     */
    class OrBlock extends BooleanBlock {
        /**
         * Constructs an OrBlock.
         */
        constructor() {
            super("or");

            /**
             * Sets the palette for the block.
             * @param {string} "boolean" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boolean", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Or block is the logical or operator."),
                "documentation",
                ""
            ]);

            /**
             * Specifies the parameter of the block.
             */
            this.parameter = true;

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: _("or"),
                args: 2,
                argTypes: ["booleanin", "booleanin"]
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {string} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {boolean} receivedArg - The received argument.
         * @returns {boolean} - The result of the argument handling.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            } else {
                const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                return a || b;
            }
        }
    }
    /**
     * Represents a block for the logical XOR operator.
     * @extends {BooleanBlock}
     */
    class XorBlock extends BooleanBlock {
        /**
         * Constructs an XorBlock.
         */
        constructor() {
            super("xor");

            /**
             * Sets the palette for the block.
             * @param {string} "boolean" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boolean", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The XOR block is the logical XOR operator."),
                "documentation",
                ""
            ]);

            /**
             * Specifies the parameter of the block.
             */
            this.parameter = true;

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: _("xor"),
                args: 2,
                argTypes: ["booleanin", "booleanin"]
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {string} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {boolean} receivedArg - The received argument.
         * @returns {boolean} - The result of the argument handling.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            } else {
                const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                return (a && !b) || (!a && b);
            }
        }
    }
    /**
     * Represents a block for the greater-than comparison.
     * @extends {BooleanBlock}
     */
    class GreaterBlock extends BooleanBlock {
        /**
         * Constructs a GreaterBlock.
         */
        constructor() {
            super("greater");

            /**
             * Sets the palette for the block.
             * @param {string} "boolean" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boolean", activity);

            /**
             * Sets the beginner status for the block.
             * @param {boolean} true - The beginner status.
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _(
                    "The Greater-than block returns True if the top number is greater than the bottom number."
                ),
                "documentation",
                ""
            ]);

            /**
             * Sets the font size for the block.
             * @type {number}
             */
            this.fontsize = 14;

            /**
             * Specifies the parameter of the block.
             */
            this.parameter = true;

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: ">",
                args: 2,
                argTypes: ["numberin", "numberin"]
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {string} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {number} receivedArg - The received argument.
         * @returns {boolean} - The result of the argument handling.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }

            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

            try {
                return Number(a) > Number(b);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(e);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }
    /**
     * Represents a block for the less-than comparison.
     * @extends {BooleanBlock}
     */
    class LessBlock extends BooleanBlock {
        /**
         * Constructs a LessBlock.
         */
        constructor() {
            super("less");

            /**
             * Sets the palette for the block.
             * @param {string} "boolean" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boolean", activity);

            /**
             * Sets the beginner status for the block.
             * @param {boolean} true - The beginner status.
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _(
                    "The Less-than block returns True if the top number is less than the bottom number."
                ),
                "documentation",
                ""
            ]);

            /**
             * Sets the font size for the block.
             * @type {number}
             */
            this.fontsize = 14;

            /**
             * Specifies the parameter of the block.
             */
            this.parameter = true;

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: "<",
                args: 2,
                argTypes: ["numberin", "numberin"]
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {string} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {number} receivedArg - The received argument.
         * @returns {boolean} - The result of the argument handling.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }

            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

            try {
                return Number(a) < Number(b);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(e);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }
    /**
     * Represents a block for the equality comparison.
     * @extends {BooleanBlock}
     */
    class EqualBlock extends BooleanBlock {
        /**
         * Constructs an EqualBlock.
         */
        constructor() {
            super("equal");

            /**
             * Sets the palette for the block.
             * @param {string} "boolean" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boolean", activity);

            /**
             * Sets the beginner status for the block.
             * @param {boolean} true - The beginner status.
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Equal block returns True if the two numbers are equal."),
                "documentation",
                ""
            ]);

            /**
             * Sets the font size for the block.
             * @type {number}
             */
            this.fontsize = 14;

            /**
             * Specifies the parameter of the block.
             */
            this.parameter = true;

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: "=",
                args: 2,
                argTypes: ["anyin", "anyin"]
            });
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {string} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            if (activity.blocks.blockList[blk].value) {
                return _("true");
            } else {
                return _("false");
            }
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {number} receivedArg - The received argument.
         * @returns {boolean} - The result of the argument handling.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk1 = activity.blocks.blockList[blk].connections[1];
            const cblk2 = activity.blocks.blockList[blk].connections[2];

            if (cblk1 === null || cblk2 === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }

            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);

            try {
                return a === b;
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug(e);
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return false;
            }
        }
    }
    /**
     * Represents a static boolean block.
     * @extends {BooleanBlock}
     */
    class StaticBooleanBlock extends BooleanBlock {
        /**
         * Constructs a StaticBooleanBlock.
         */
        constructor() {
            super("boolean");

            /**
             * Sets the palette for the block.
             * @param {string} "boolean" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("boolean", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Boolean block is used to specify true or false."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({
                name: "boolean"
            });
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {boolean} - The result of the argument handling.
         */
        arg(logo, turtle, blk) {
            if (typeof activity.blocks.blockList[blk].value === "string") {
                return (
                    activity.blocks.blockList[blk].value === _("true") ||
                    activity.blocks.blockList[blk].value === "true"
                );
            }
            return activity.blocks.blockList[blk].value;
        }
    }

    new NotBlock().setup(activity);
    new XorBlock().setup(activity);
    new AndBlock().setup(activity);
    new OrBlock().setup(activity);
    new GreaterBlock().setup(activity);
    new LessBlock().setup(activity);
    new EqualBlock().setup(activity);
    new StaticBooleanBlock().setup(activity);
}
