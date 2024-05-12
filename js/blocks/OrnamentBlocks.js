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

   _, ValueBlock, NOINPUTERRORMSG, NANERRORMSG, last, Singer,
   FlowClampBlock
 */

/* exported setupOrnamentBlocks */

function setupOrnamentBlocks(activity) {
    /**
     * Represents a StaccatoFactorBlock, a specialized type of ValueBlock for handling staccato factors.
     * @extends {ValueBlock}
     */
    class StaccatoFactorBlock extends ValueBlock {
        /**
         * Constructs a StaccatoFactorBlock.
         */
        constructor() {
            // Call the constructor of the parent class (ValueBlock)
            super("staccatofactor", _("staccato factor"));

            /**
             * Indicates that this block is a parameter.
             * @type {boolean}
             */
            this.parameter = true;

            /**
             * Sets the palette for the block.
             * @param {string} "ornament" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("ornament", activity);

            /**
             * Sets the help string for the block.
             * @param {string[]} [] - An empty array since the help string is not specified.
             */
            this.setHelpString();

            /**
             * Indicates that this block is hidden.
             * @type {boolean}
             */
            this.hidden = true;
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The Logo object.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {string} blk - The block ID.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            // Return the value of the block
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The Logo object.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {string} blk - The block ID.
         * @returns {*} - The result of the argument handling.
         */
        arg(logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                // Push staccato status to the status fields
                logo.statusFields.push([blk, "staccato"]);
            } else if (tur.singer.staccato.length > 0) {
                // Return the last staccato factor
                return last(tur.singer.staccato);
            } else {
                // Return 0 if there are no staccato factors
                return 0;
            }
        }
    }
    /**
     * Represents a SlurFactorBlock, a specialized type of ValueBlock for handling slur factors.
     * @extends {ValueBlock}
     */
    class SlurFactorBlock extends ValueBlock {
        /**
         * Constructs a SlurFactorBlock.
         */
        constructor() {
            // Call the constructor of the parent class (ValueBlock)
            super("slurfactor", _("slur factor"));

            /**
             * Sets the palette for the block.
             * @param {string} "ornament" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("ornament", activity);

            /**
             * Sets the help string for the block.
             * @param {string[]} [] - An empty array since the help string is not specified.
             */
            this.setHelpString();

            /**
             * Indicates that this block is a parameter.
             * @type {boolean}
             */
            this.parameter = true;

            /**
             * Indicates that this block is hidden.
             * @type {boolean}
             */
            this.hidden = true;
        }

        /**
         * Updates the parameter of the block.
         * @param {Logo} logo - The Logo object.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {string} blk - The block ID.
         * @returns {*} - The updated parameter value.
         */
        updateParameter(logo, turtle, blk) {
            // Return the value of the block
            return activity.blocks.blockList[blk].value;
        }

        /**
         * Handles the argument of the block.
         * @param {Logo} logo - The Logo object.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {string} blk - The block ID.
         * @returns {*} - The result of the argument handling.
         */
        arg(logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                // Push slur status to the status fields
                logo.statusFields.push([blk, "slur"]);
            } else if (tur.singer.staccato.length > 0) {
                // Return the negative of the last staccato factor for slur
                return -last(tur.singer.staccato);
            } else {
                // Return 0 if there are no staccato factors
                return 0;
            }
        }
    }
    /**
     * Represents a NeighborBlock, a specialized type of FlowClampBlock for handling neighbor notes.
     * @extends {FlowClampBlock}
     */
    class NeighborBlock extends FlowClampBlock {
        /**
         * Constructs a NeighborBlock.
         * @param {string} [name] - The name of the block, defaults to "neighbor" if not provided.
         */
        constructor(name) {
            // Call the constructor of the parent class (FlowClampBlock)
            super(name || "neighbor");

            /**
             * Sets the palette for the block.
             * @param {string} "ornament" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("ornament", activity);

            /**
             * Sets the piemenu values for the first connection.
             * @type {number[]}
             */
            this.piemenuValuesC1 = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];

            /**
             * Sets the help string for the block.
             * @param {string[]} [] - An empty array since the help string is not specified.
             */
            this.setHelpString();

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   args: number,
             *   defaults: number[],
             *   argLabels: string[]
             * } - The block formation parameters.
             */
            this.formBlock({
                //.TRANS: the neighbor refers to a neighboring note, e.g., D is a neighbor of C
                name: _("neighbor") + " (+/–)",
                args: 2,
                defaults: [1, 1 / 16],
                argLabels: [_("semi-tone interval"), _("note value")]
            });

            /**
             * Makes a macro for the block with specified coordinates.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             */
            this.makeMacro((x, y) => [
                [0, "neighbor", x, y, [null, 1, 3, 2, 6]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "vspace", 0, 0, [0, null]],
                [3, "divide", 0, 0, [0, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 16 }], 0, 0, [3]],
                [6, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handles the flow of the block.
         * @param {number[]} args - The arguments provided to the block.
         * @param {Logo} logo - The Logo object.
         * @param {Turtle} turtle - The turtle associated with the block.
         * @param {string} blk - The block ID.
         * @returns {number[]} - The result of the flow operation.
         */
        flow(args, logo, turtle, blk) {
            if (typeof args[0] !== "number" || typeof args[1] !== "number") {
                // Display an error message if arguments are not numbers
                activity.errorMsg(NANERRORMSG, blk);
                // Stop the turtle
                logo.stopTurtle = true;
                // Return undefined
                return;
            }

            // Perform the neighbor action
            Singer.OrnamentActions.doNeighbor(args[0], args[1], turtle, blk);

            // Return the result of the flow operation
            return [args[2], 1];
        }
    }
    /**
     * Represents a Neighbor2Block, a specialized type of NeighborBlock for rapidly switching between neighboring pitches.
     * @extends {NeighborBlock}
     */
    class Neighbor2Block extends NeighborBlock {
        /**
         * Constructs a Neighbor2Block.
         */
        constructor() {
            // Call the constructor of the parent class (NeighborBlock)
            super("neighbor2");

            /**
             * Sets the piemenu values for the first connection.
             * @type {number[]}
             */
            this.piemenuValuesC1 = [-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7];

            /**
             * Sets the block as a beginner block.
             * @param {boolean} true - Indicates that the block is a beginner block.
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @param {string[]} [] - An empty array since the help string is not specified.
             */
            this.setHelpString([
                _("The Neighbor block rapidly switches between neighboring pitches."),
                "documentation",
                null,
                "neighbor2help"
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   args: number,
             *   defaults: number[],
             *   argLabels: string[]
             * } - The block formation parameters.
             */
            this.formBlock({
                name: _("neighbor") + " (+/–)",
                args: 2,
                defaults: [1, 1 / 16],
                argLabels: [_("scalar interval"), _("note value")]
            });

            /**
             * Makes a macro for the block with specified coordinates.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             */
            this.makeMacro((x, y) => [
                [0, "neighbor2", x, y, [null, 1, 3, 2, 6]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "vspace", 0, 0, [0, null]],
                [3, "divide", 0, 0, [0, 4, 5]],
                [4, ["number", { value: 1 }], 0, 0, [3]],
                [5, ["number", { value: 16 }], 0, 0, [3]],
                [6, "hidden", 0, 0, [0, null]]
            ]);
        }
    }
    /**
     * Represents a GlideBlock, a type of FlowClampBlock for creating a glissando effect by blending overlapping successive notes.
     * @extends {FlowClampBlock}
     */
    class GlideBlock extends FlowClampBlock {
        /**
         * Constructs a GlideBlock.
         */
        constructor() {
            // Call the constructor of the parent class (FlowClampBlock)
            super("glide");

            /**
             * Sets the palette for the GlideBlock.
             * @type {string}
             */
            this.setPalette("ornament", activity);

            /**
             * Sets the help string for the GlideBlock.
             * @param {string[]} [] - An empty array since the help string is not specified.
             */
            this.setHelpString();

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   args: number,
             *   defaults: number[]
             * } - The block formation parameters.
             */
            this.formBlock({
                name: _("glide"),
                args: 1,
                defaults: [1 / 16]
            });

            /**
             * Makes a macro for the GlideBlock with specified coordinates.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             */
            this.makeMacro((x, y) => [
                [0, "glide", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 16 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);

            /**
             * Sets the block as hidden.
             * @type {boolean}
             */
            this.hidden = true;
        }

        /**
         * Handles the flow of the GlideBlock.
         * @param {number[]} args - The arguments passed to the block.
         * @param {Logo} logo - The Logo instance.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {number[]} - The result of the block execution.
         */
        flow(args, logo, turtle, blk) {
            // TODO: Duration should be the sum of all the notes (like
            // in a tie). If we set the synth portamento and use
            // setNote for all but the first note, it should produce a
            // glissando.
            if (args[1] === undefined) {
                // Nothing to do.
                return;
            }

            let arg;
            if (args[0] === null || typeof args[0] !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 16;
            } else {
                arg = args[0];
            }

            const tur = activity.turtles.ithTurtle(turtle);

            tur.singer.glide.push(arg);

            if (tur.singer.justCounting.length === 0) {
                logo.notation.notationBeginSlur(turtle);
            }

            tur.singer.glideOverride = Singer.noteCounter(logo, turtle, args[1]);
            // eslint-disable-next-line no-console
            console.debug("length of glide " + tur.singer.glideOverride);

            const listenerName = "_glide_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // eslint-disable-next-line no-unused-vars
            const __listener = (event) => {
                if (tur.singer.justCounting.length === 0) {
                    logo.notation.notationEndSlur(turtle);
                }

                tur.singer.glide.pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }
    /**
     * Represents a SlurBlock, a type of FlowClampBlock for creating a legato effect by overlapping successive notes.
     * @extends {FlowClampBlock}
     */
    class SlurBlock extends FlowClampBlock {
        /**
         * Constructs a SlurBlock.
         * @param {string} [name] - The name of the SlurBlock.
         */
        constructor(name) {
            // Call the constructor of the parent class (FlowClampBlock)
            super(name || "slur");

            /**
             * Sets the palette for the SlurBlock.
             * @type {string}
             */
            this.setPalette("ornament", activity);

            /**
             * Sets the help string for the SlurBlock.
             * @param {string[]} [] - An empty array since the help string is not specified.
             */
            this.setHelpString();

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   args: number,
             *   defaults: number[]
             * } - The block formation parameters.
             */
            this.formBlock({
                name: _("slur"),
                args: 1,
                defaults: [16]
            });

            /**
             * Makes a macro for the SlurBlock with specified coordinates.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             */
            this.makeMacro((x, y) => [
                [0, "slur", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 16 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);

            /**
             * Sets the block as hidden.
             * @type {boolean}
             */
            this.hidden = true;
        }

        /**
         * Handles the flow of the SlurBlock.
         * @param {number[]} args - The arguments passed to the block.
         * @param {Logo} logo - The Logo instance.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {number[]} - The result of the block execution.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let arg = args[0];
            if (arg === null || typeof arg !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 16;
            }

            Singer.OrnamentActions.setSlur(arg, turtle, blk);

            return [args[1], 1];
        }
    }
    /**
     * Represents a StaccatoBlock, a type of FlowClampBlock for creating a staccato effect by shortening the duration of notes.
     * @extends {FlowClampBlock}
     */
    class StaccatoBlock extends FlowClampBlock {
        /**
         * Constructs a StaccatoBlock.
         * @param {string} [name] - The name of the StaccatoBlock.
         */
        constructor(name) {
            // Call the constructor of the parent class (FlowClampBlock)
            super(name || "staccato");

            /**
             * Sets the palette for the StaccatoBlock.
             * @type {string}
             */
            this.setPalette("ornament", activity);

            /**
             * Sets the help string for the StaccatoBlock.
             * @param {string[]} [] - An empty array since the help string is not specified.
             */
            this.setHelpString();

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   args: number,
             *   defaults: number[]
             * } - The block formation parameters.
             */
            this.formBlock({
                name: _("staccato"),
                args: 1,
                defaults: [32]
            });

            /**
             * Makes a macro for the StaccatoBlock with specified coordinates.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             */
            this.makeMacro((x, y) => [
                [0, "staccato", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 32 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);

            /**
             * Sets the block as hidden.
             * @type {boolean}
             */
            this.hidden = true;
        }

        /**
         * Handles the flow of the StaccatoBlock.
         * @param {number[]} args - The arguments passed to the block.
         * @param {Logo} logo - The Logo instance.
         * @param {number} turtle - The turtle index.
         * @param {number} blk - The block index.
         * @returns {number[]} - The result of the block execution.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let arg = args[0];
            if (arg === null || typeof arg !== "number") {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1 / 32;
            }

            Singer.OrnamentActions.setStaccato(arg, turtle, blk);

            return [args[1], 1];
        }
    }
    /**
     * Represents a NewSlurBlock, a type of SlurBlock that lengthens the sustain of notes while maintaining the specified rhythmic value.
     * @extends {SlurBlock}
     */
    class NewSlurBlock extends SlurBlock {
        /**
         * Constructs a NewSlurBlock.
         */
        constructor() {
            // Call the constructor of the parent class (SlurBlock)
            super("newslur");

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the NewSlurBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _(
                    "The Slur block lengthens the sustain of notes while maintaining the specified rhythmic value of the notes."
                ),
                "documentation",
                null,
                "slurhelp"
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   args: number,
             *   defaults: number[]
             * } - The block formation parameters.
             */
            this.formBlock({
                name: _("slur"),
                args: 1,
                defaults: [1 / 16]
            });

            /**
             * Makes a macro for the NewSlurBlock with specified coordinates.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             */
            this.makeMacro((x, y) => [
                [0, "newslur", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 16 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);

            /**
             * Sets the block as not hidden.
             * @type {boolean}
             */
            this.hidden = false;
        }
    }
    /**
     * Represents a NewStaccatoBlock, a type of StaccatoBlock that shortens the length of the actual note while maintaining the specified rhythmic value.
     * @extends {StaccatoBlock}
     */
    class NewStaccatoBlock extends StaccatoBlock {
        /**
         * Constructs a NewStaccatoBlock.
         */
        constructor() {
            // Call the constructor of the parent class (StaccatoBlock)
            super("newstaccato");

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the NewStaccatoBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _(
                    "The Staccato block shortens the length of the actual note while maintaining the specified rhythmic value of the notes."
                ),
                "documentation",
                null,
                "staccatohelp"
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   args: number,
             *   defaults: number[]
             * } - The block formation parameters.
             */
            this.formBlock({
                //.TRANS: play each note sharply detached from the others
                name: _("staccato"),
                args: 1,
                defaults: [1 / 32]
            });

            /**
             * Makes a macro for the NewStaccatoBlock with specified coordinates.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             */
            this.makeMacro((x, y) => [
                [0, "newstaccato", x, y, [null, 1, 4, 5]],
                [1, "divide", 0, 0, [0, 2, 3]],
                [2, ["number", { value: 1 }], 0, 0, [1]],
                [3, ["number", { value: 32 }], 0, 0, [1]],
                [4, "vspace", 0, 0, [0, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);

            /**
             * Sets the block as not hidden.
             * @type {boolean}
             */
            this.hidden = false;
        }
    }

    new StaccatoFactorBlock().setup(activity);
    new SlurFactorBlock().setup(activity);
    new NeighborBlock().setup(activity);
    new Neighbor2Block().setup(activity);
    new GlideBlock().setup(activity);
    new SlurBlock().setup(activity);
    new StaccatoBlock().setup(activity);
    new NewSlurBlock().setup(activity);
    new NewStaccatoBlock().setup(activity);
}
