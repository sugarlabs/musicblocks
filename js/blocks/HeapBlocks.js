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

   _, ValueBlock, LeftBlock, FlowBlock, NOINPUTERRORMSG, NANERRORMSG
 */

/* exported setupHeapBlocks */

function setupHeapBlocks(activity) {
    /**
     * Represents a HeapBlock, a type of ValueBlock that returns the heap.
     * @extends {ValueBlock}
     */
    class HeapBlock extends ValueBlock {
        /**
         * Constructs a HeapBlock.
         */
        constructor() {
            // Call the constructor of the parent class (ValueBlock)
            super("heap");

            /**
             * Sets the palette for the HeapBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the HeapBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([_("The Heap block returns the heap."), "documentation", ""]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   outType: string
             * } - The block formation parameters.
             */
            this.formBlock({
                name: _("heap"),
                outType: "numberout"
            });
        }

        /**
         * Returns the heap as a JSON string.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         * @returns {string} - The JSON string representation of the heap.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "heap"]);
            } else {
                return JSON.stringify(logo.turtleHeaps[turtle]);
            }
        }
    }
    /**
     * Represents a ShowHeapBlock, a type of FlowBlock that displays the contents of the heap.
     * @extends {FlowBlock}
     */
    class ShowHeapBlock extends FlowBlock {
        /**
         * Constructs a ShowHeapBlock.
         */
        constructor() {
            // Call the constructor of the parent class (FlowBlock)
            super("showHeap");

            /**
             * Sets the palette for the ShowHeapBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as hidden and deprecated.
             * @type {boolean}
             */
            this.hidden = this.deprecated = true;

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the ShowHeapBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _(
                    "The Show-heap block displays the contents of the heap at the top of the screen."
                ),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string
             * } - The block formation parameters.
             */
            this.formBlock({
                // .TRANS: Display the heap contents
                name: _("show heap")
            });
        }

        /**
         * Displays the contents of the heap at the top of the screen.
         * @param {Array} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         */
        flow(args, logo, turtle) {
            if (!(turtle in logo.turtleHeaps)) {
                logo.turtleHeaps[turtle] = [];
            }

            // Display the contents of the heap as a JSON string
            activity.textMsg(JSON.stringify(logo.turtleHeaps[turtle]));
        }
    }
    /**
     * Represents a HeapLengthBlock, a type of ValueBlock that returns the length of the heap.
     * @extends {ValueBlock}
     */
    class HeapLengthBlock extends ValueBlock {
        /**
         * Constructs a HeapLengthBlock.
         */
        constructor() {
            // Call the constructor of the parent class (ValueBlock)
            super("heapLength");

            /**
             * Sets the palette for the HeapLengthBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the HeapLengthBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _("The Heap-length block returns the length of the heap."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   outType: string
             * } - The block formation parameters.
             */
            this.formBlock({
                // .TRANS: How many entries are in the heap?
                name: _("heap length"),
                outType: "numberout"
            });
        }

        /**
         * Returns the length of the heap.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         * @returns {number} - The length of the heap.
         */
        arg(logo, turtle, blk) {
            if (!(turtle in logo.turtleHeaps)) {
                logo.turtleHeaps[turtle] = [];
            }

            // If in status matrix, push information to the status fields
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "heapLength"]);
            } else {
                // Return the length of the heap
                return logo.turtleHeaps[turtle].length;
            }
        }
    }
    /**
     * Represents a HeapEmptyBlock, a type of ValueBlock that returns true if the heap is empty.
     * @extends {ValueBlock}
     */
    class HeapEmptyBlock extends ValueBlock {
        /**
         * Constructs a HeapEmptyBlock.
         */
        constructor() {
            // Call the constructor of the parent class (ValueBlock)
            super("heapEmpty");

            /**
             * Sets the palette for the HeapEmptyBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the HeapEmptyBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _("The Heap-empty? block returns true if the heap is empty."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   outType: string
             * } - The block formation parameters.
             */
            this.formBlock({
                //.TRANS: Is the heap empty?
                name: _("heap empty?"),
                outType: "booleanout"
            });
        }

        /**
         * Returns true if the heap is empty.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @returns {boolean} - True if the heap is empty, false otherwise.
         */
        arg(logo, turtle) {
            // Check if the turtle is in the logo's turtleHeaps
            if (turtle in logo.turtleHeaps)
                // Return true if the length of the heap is 0, indicating it's empty
                return logo.turtleHeaps[turtle].length === 0;

            // Return true if the turtle is not in the logo's turtleHeaps
            return true;
        }
    }
    /**
     * Represents an EmptyHeapBlock, a type of FlowBlock that empties the heap.
     * @extends {FlowBlock}
     */
    class EmptyHeapBlock extends FlowBlock {
        /**
         * Constructs an EmptyHeapBlock.
         */
        constructor() {
            // Call the constructor of the parent class (FlowBlock)
            super("emptyHeap");

            /**
             * Sets the palette for the EmptyHeapBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the EmptyHeapBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([_("The Empty-heap block empties the heap."), "documentation", ""]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string
             * } - The block formation parameters.
             */
            this.formBlock({
                //.TRANS: empty the heap
                name: _("empty heap")
            });
        }

        /**
         * Empties the heap.
         * @param {Array} args - Arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         */
        flow(args, logo, turtle) {
            // Set the turtle's heap to an empty array, effectively emptying the heap
            logo.turtleHeaps[turtle] = [];
        }
    }
    /**
     * Represents a ReverseHeapBlock, a type of FlowBlock that reverses the order of the heap.
     * @extends {FlowBlock}
     */
    class ReverseHeapBlock extends FlowBlock {
        /**
         * Constructs a ReverseHeapBlock.
         */
        constructor() {
            // Call the constructor of the parent class (FlowBlock)
            super("reverseHeap");

            /**
             * Sets the palette for the ReverseHeapBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the ReverseHeapBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _("The Reverse-heap block reverses the order of the heap."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string
             * } - The block formation parameters.
             */
            this.formBlock({
                //.TRANS: reverse the order of the heap
                name: _("reverse heap")
            });
        }

        /**
         * Reverses the order of the heap.
         * @param {Array} args - Arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         */
        flow(args, logo, turtle) {
            // Reverse the order of the turtle's heap
            logo.turtleHeaps[turtle] = logo.turtleHeaps[turtle].reverse();
        }
    }
    /**
     * Represents an IndexHeapBlock, a type of LeftBlock that returns a value in the heap at a specified location.
     * @extends {LeftBlock}
     */
    class IndexHeapBlock extends LeftBlock {
        /**
         * Constructs an IndexHeapBlock.
         */
        constructor() {
            // Call the constructor of the parent class (LeftBlock)
            super("indexHeap");

            /**
             * Sets the palette for the IndexHeapBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the IndexHeapBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _("The Index-heap block returns a value in the heap at a specified location."),
                "documentation",
                ""
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
                //.TRANS: retrieve a value from the heap at index position in the heap
                name: _("index heap"),
                args: 1,
                defaults: [1]
            });
        }

        /**
         * Retrieves a value from the heap at a specified index position.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         * @param {number} receivedArg - The received argument.
         * @returns {number} The value in the heap at the specified location.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            let a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            if (typeof a === "number") {
                if (!(turtle in logo.turtleHeaps)) {
                    logo.turtleHeaps[turtle] = [];
                }

                if (a === -1) {
                    // -1 to access the top of the heap
                    a = logo.turtleHeaps[turtle].length;
                } else if (a < 1) {
                    a = 1;
                    activity.errorMsg(_("Index must be > 0."));
                }

                if (a > 1000) {
                    a = 1000;
                    activity.errorMsg(_("Maximum heap size is 1000."));
                }

                // If index > heap length, grow the heap.
                while (logo.turtleHeaps[turtle].length < a) {
                    logo.turtleHeaps[turtle].push(0);
                }

                return logo.turtleHeaps[turtle][a - 1];
            }
            activity.errorMsg(NANERRORMSG, blk);
            return 0;
        }
    }

    /**
     * Represents a SetHeapEntryBlock, a type of FlowBlock that sets a value in the heap at the specified location.
     * @extends {FlowBlock}
     */
    class SetHeapEntryBlock extends FlowBlock {
        /**
         * Constructs a SetHeapEntryBlock.
         */
        constructor() {
            // Call the constructor of the parent class (FlowBlock)
            super("setHeapEntry");

            /**
             * Sets the palette for the SetHeapEntryBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the SetHeapEntryBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _("The Set-heap entry block sets a value in he heap at the specified location."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   args: number,
             *   argTypes: string[],
             *   defaults: number[],
             *   argLabels: string[]
             * } - The block formation parameters.
             */
            this.formBlock({
                name: _("set heap"),
                args: 2,
                argTypes: ["numberin", "anyin"],
                defaults: [1, 100],
                //.TRANS: value1 is a numeric value (JAPANESE ONLY)
                argLabels: [_("index"), this.lang === "ja" ? _("value1") : _("value")]
            });
        }

        /**
         * Sets a value in the heap at the specified location.
         * @param {number[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null || args[1] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (typeof args[0] !== "number" || typeof args[1] !== "number") {
                activity.errorMsg(NANERRORMSG, blk);
                return;
            }

            if (!(turtle in logo.turtleHeaps)) {
                logo.turtleHeaps[turtle] = [];
            }

            let idx = Math.floor(args[0]);
            if (idx < 1) {
                activity.errorMsg(_("Index must be > 0."));
                idx = 1;
            }

            if (idx > 1000) {
                activity.errorMsg(_("Maximum heap size is 1000."));
                idx = 1000;
            }

            // If index > heap length, grow the heap.
            while (logo.turtleHeaps[turtle].length < idx) {
                logo.turtleHeaps[turtle].push(0);
            }

            logo.turtleHeaps[turtle][idx - 1] = args[1];
        }
    }

    /**
     * Represents a PopBlock, a type of ValueBlock that removes the value at the top of the heap.
     * @extends {ValueBlock}
     */
    class PopBlock extends ValueBlock {
        /**
         * Constructs a PopBlock.
         */
        constructor() {
            // Call the constructor of the parent class (ValueBlock)
            super("pop");

            /**
             * Sets the palette for the PopBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the PopBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _("The Pop block removes the value at the top of the heap."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   outType: string
             * } - The block formation parameters.
             */
            this.formBlock({
                //.TRANS: pop a value off the top of the heap
                name: _("pop")
            });
        }

        /**
         * Removes the value at the top of the heap.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @returns {number} The value removed from the top of the heap.
         */
        arg(logo, turtle) {
            if (turtle in logo.turtleHeaps && logo.turtleHeaps[turtle].length > 0) {
                return logo.turtleHeaps[turtle].pop();
            }
            activity.errorMsg(_("empty heap"));
            return 0;
        }
    }
    /**
     * Represents a PushBlock, a type of FlowBlock that adds a value to the top of the heap.
     * @extends {FlowBlock}
     */
    class PushBlock extends FlowBlock {
        /**
         * Constructs a PushBlock.
         */
        constructor() {
            // Call the constructor of the parent class (FlowBlock)
            super("push");

            /**
             * Sets the palette for the PushBlock.
             * @type {string}
             */
            this.setPalette("heap", activity);

            /**
             * Sets the block as a beginner block.
             * @type {boolean}
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the PushBlock.
             * @param {string[]} [] - An array with help string information.
             */
            this.setHelpString([
                _("The Push block adds a value to the top of the heap."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified parameters.
             * @param {Object} {
             *   name: string,
             *   args: number,
             *   argTypes: string[],
             *   defaults: any[]
             * } - The block formation parameters.
             */
            this.formBlock({
                //.TRANS: push a value onto the top of the heap
                name: _("push"),
                args: 1,
                argTypes: ["anyin"],
                defaults: [1]
            });
        }

        /**
         * Adds a value to the top of the heap.
         * @param {any[]} args - The arguments passed to the block.
         * @param {object} logo - The logo object.
         * @param {number} turtle - The turtle number.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            if (args[0] === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }

            if (!(turtle in logo.turtleHeaps)) {
                logo.turtleHeaps[turtle] = [];
            }

            logo.turtleHeaps[turtle].push(args[0]);
        }
    }

    new HeapBlock().setup(activity);
    new ShowHeapBlock().setup(activity);
    new HeapLengthBlock().setup(activity);
    new HeapEmptyBlock().setup(activity);
    new EmptyHeapBlock().setup(activity);
    new ReverseHeapBlock().setup(activity);
    new IndexHeapBlock().setup(activity);
    new SetHeapEntryBlock().setup(activity);
    new PopBlock().setup(activity);
    new PushBlock().setup(activity);
}
