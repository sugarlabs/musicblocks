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

   _, last, ZERODIVIDEERRORMSG, Queue, FlowBlock, ValueBlock,
   FlowClampBlock, NOINPUTERRORMSG, POSNUMBER, BaseBlock
*/

/* exported setupFlowBlocks */

function setupFlowBlocks(activity) {
    /**
     * Represents a block for running code in reverse order (Musical retrograde).
     * @extends {FlowClampBlock}
     */
    class BackwardBlock extends FlowClampBlock {
        /**
         * Constructs a BackwardBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("backward");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);
            // Set the block as a beginner block
            this.beginnerBlock(true);

            // Set the help string for the block
            this.setHelpString([
                _("The Backward block runs code in reverse order (Musical retrograde)."),
                "documentation",
                ""
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("backward")
            });

            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "backward", x, y, [null, 1, null]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handles the flow of the backward block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {Array} - An array containing the child flow and child flow count.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            // Push the current block to the backward stack
            tur.singer.backward.push(blk);

            // Set child to bottom block inside clamp
            const childFlow = activity.blocks.findBottomBlock(args[0]);
            const childFlowCount = 1;

            // Set up the listener for the backward block
            const listenerName = "_backward_" + turtle + "_" + blk;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // Get the next block in the sequence
            const nextBlock = activity.blocks.blockList[blk].connections[2];

            // Pop the backward stack if there is no next block
            if (nextBlock === null) {
                tur.singer.backward.pop();
            } else {
                // Register the listener for the end of the clamp
                if (nextBlock in tur.endOfClampSignals) {
                    tur.endOfClampSignals[nextBlock].push(listenerName);
                } else {
                    tur.endOfClampSignals[nextBlock] = [listenerName];
                }
            }

            // Set up the listener function
            const __listener = (event) => tur.singer.backward.pop();

            // Set the turtle listener
            logo.setTurtleListener(turtle, listenerName, __listener);

            // Return the child flow and child flow count
            return [childFlow, childFlowCount];
        }
    }

    /**
     * Represents a block for running each block multiple times (Musical duplication).
     * @extends {FlowClampBlock}
     */
    class DuplicateBlock extends FlowClampBlock {
        /**
         * Constructs a DuplicateBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("duplicatenotes");

            // Set the palette, piemenuValuesC1, and activity for the block
            this.setPalette("flow", activity);
            this.piemenuValuesC1 = [2, 3, 4, 5, 6, 7, 8];

            // Set the help string for the block
            this.setHelpString([
                _("The Duplicate block will run each block multiple times.") +
                    " " +
                    _(
                        "The output of the example is: Sol, Sol, Sol, Sol, Re, Re, Re, Re, Sol, Sol, Sol, Sol."
                    ),
                "documentation",
                null,
                "duphelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("duplicate"),
                args: 1,
                defaults: [2]
            });

            // Define the macro for creating the block
            this.makeMacro((x, y) => [
                [0, "duplicatenotes", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 2 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handles the flow of the duplicate block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @param {object} receivedArg - The received arguments.
         */
        flow(args, logo, turtle, blk, receivedArg) {
            if (args[1] === undefined) return;

            let arg0;
            if (args[0] === null || typeof args[0] !== "number" || args[0] < 1) {
                // Handle invalid input for the number of duplicates
                activity.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = 2;
            } else {
                arg0 = args[0];
            }

            const factor = Math.floor(arg0);
            if (factor < 1) {
                // Handle invalid input for the duplication factor
                activity.errorMsg(ZERODIVIDEERRORMSG, blk);
                logo.stopTurtle = true;
            } else {
                const tur = activity.turtles.ithTurtle(turtle);

                // Update the duplicate factor in the turtle singer
                tur.singer.duplicateFactor *= factor;

                // Queue each block in the clamp
                const listenerName = "_duplicate_" + turtle;
                logo.setDispatchBlock(blk, turtle, listenerName);

                // Function to look for other turtles in the connection store
                const __lookForOtherTurtles = (blk, turtle) => {
                    for (const t in logo.connectionStore) {
                        if (t !== turtle.toString()) {
                            for (const b in logo.connectionStore[t]) {
                                if (b === blk.toString()) {
                                    return t;
                                }
                            }
                        }
                    }
                    return null;
                };

                tur.singer.inDuplicate = true;

                // Listener function for handling the end of duplication
                const __listener = (event) => {
                    tur.singer.inDuplicate = false;
                    tur.singer.duplicateFactor /= factor;

                    // Check for a race condition
                    // FIXME: Do something about the race condition
                    if (logo.connectionStoreLock) {
                        console.debug("LOCKED");
                    }

                    logo.connectionStoreLock = true;

                    // The last turtle should restore the broken connections
                    if (__lookForOtherTurtles(blk, turtle) === null) {
                        const n = logo.connectionStore[turtle][blk].length;
                        for (let i = 0; i < n; i++) {
                            const obj = logo.connectionStore[turtle][blk].pop();
                            activity.blocks.blockList[obj[0]].connections[obj[1]] = obj[2];
                            if (obj[2] != null) {
                                activity.blocks.blockList[obj[2]].connections[0] = obj[0];
                            }
                        }
                    } else {
                        delete logo.connectionStore[turtle][blk];
                    }

                    logo.connectionStoreLock = false;
                };

                // Set the turtle listener
                logo.setTurtleListener(turtle, listenerName, __listener);

                // Test for race condition
                // FIXME: Do something about the race condition
                if (logo.connectionStoreLock) {
                    console.debug("LOCKED");
                }

                logo.connectionStoreLock = true;

                // Check to see if another turtle has already disconnected these blocks
                const otherTurtle = __lookForOtherTurtles(blk, turtle);
                if (otherTurtle != null) {
                    // Copy the connections and queue the blocks
                    logo.connectionStore[turtle][blk] = [];
                    for (let i = logo.connectionStore[otherTurtle][blk].length; i > 0; i--) {
                        const obj = [
                            logo.connectionStore[otherTurtle][blk][i - 1][0],
                            logo.connectionStore[otherTurtle][blk][i - 1][1],
                            logo.connectionStore[otherTurtle][blk][i - 1][2]
                        ];
                        logo.connectionStore[turtle][blk].push(obj);
                        let child = obj[0];
                        if (activity.blocks.blockList[child].name === "hidden") {
                            child = activity.blocks.blockList[child].connections[0];
                        }

                        const queueBlock = new Queue(child, factor, blk, receivedArg);
                        tur.parentFlowQueue.push(blk);
                        tur.queue.push(queueBlock);
                    }
                } else {
                    let child = activity.blocks.findBottomBlock(args[1]);
                    while (child != blk) {
                        if (activity.blocks.blockList[child].name !== "hidden") {
                            const queueBlock = new Queue(child, factor, blk, receivedArg);
                            tur.parentFlowQueue.push(blk);
                            tur.queue.push(queueBlock);
                        }

                        child = activity.blocks.blockList[child].connections[0];
                    }

                    // Break the connections between blocks in the clamp so
                    // that when we run the queues, only the individual blocks
                    // run
                    logo.connectionStore[turtle][blk] = [];
                    child = args[1];
                    while (child != null) {
                        const lastConnection =
                            activity.blocks.blockList[child].connections.length - 1;
                        const nextBlk =
                            activity.blocks.blockList[child].connections[lastConnection];
                        // Don't disconnect a hidden block from its parent
                        if (
                            nextBlk != null &&
                            activity.blocks.blockList[nextBlk].name === "hidden"
                        ) {
                            logo.connectionStore[turtle][blk].push([
                                nextBlk,
                                1,
                                activity.blocks.blockList[nextBlk].connections[1]
                            ]);
                            child = activity.blocks.blockList[nextBlk].connections[1];
                            activity.blocks.blockList[nextBlk].connections[1] = null;
                        } else {
                            logo.connectionStore[turtle][blk].push([
                                child,
                                lastConnection,
                                nextBlk
                            ]);
                            activity.blocks.blockList[child].connections[lastConnection] = null;
                            child = nextBlk;
                        }

                        if (child != null) {
                            activity.blocks.blockList[child].connections[0] = null;
                        }
                    }
                }

                logo.connectionStoreLock = false;
            }
        }
    }

    /**
     * Represents a block for defining the default action inside a Switch block.
     * @extends {FlowClampBlock}
     */
    class DefaultCaseBlock extends FlowClampBlock {
        /**
         * Constructs a DefaultCaseBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("defaultcase");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString([
                _("The Default block is used inside of a Switch to define the default action."),
                "documentation",
                null,
                "switchhelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("default")
            });

            // Update the dock values for caseout and casein
            this.updateDockValue(0, "caseout");
            this.updateDockValue(2, "casein");
        }

        /**
         * Handles the flow of the default case block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const switchBlk = last(logo.switchBlocks[turtle]);
            if (switchBlk === null) {
                // Handle the case when the Default Case block is not inside a Switch block
                activity.errorMsg(_("The Case Block must be used inside of a Switch Block."), blk);
                logo.stopTurtle = true;
                return;
            }

            const i = logo.switchCases[turtle][switchBlk].length;
            // logo.switchCases[turtle][switchBlk].push(["__default__", args[0]]);
            logo.switchCases[turtle][switchBlk][i - 1].push(["__default__", args[0]]);
        }
    }

    /**
     * Represents a block for defining matches inside a Switch block.
     * @extends {FlowClampBlock}
     */
    class CaseBlock extends FlowClampBlock {
        /**
         * Constructs a CaseBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("case");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString([
                _("The Case block is used inside of a Switch to define matches."),
                "documentation",
                null,
                "switchhelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("case"),
                args: 1,
                argTypes: ["anyin"]
            });

            // Update the dock values for caseout and casein
            this.updateDockValue(0, "caseout");
            this.updateDockValue(3, "casein");
        }

        /**
         * Handles the flow of the case block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            const switchBlk = last(logo.switchBlocks[turtle]);
            if (switchBlk === null) {
                // Handle the case when the Case block is not inside a Switch block
                activity.errorMsg(_("The Case Block must be used inside of a Switch Block."), blk);
                logo.stopTurtle = true;
                return;
            }

            const i = logo.switchCases[turtle][switchBlk].length;
            // logo.switchCases[turtle][switchBlk].push([args[0], args[1]]);
            logo.switchCases[turtle][switchBlk][i - 1].push([args[0], args[1]]);
        }
    }

    /**
     * Represents a block for implementing switch-case functionality.
     * @extends {FlowClampBlock}
     */
    class SwitchBlock extends FlowClampBlock {
        /**
         * Constructs a SwitchBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("switch");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString([
                _("The Switch block will run the code in the matching Case."),
                "documentation",
                null,
                "switchhelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("switch"),
                args: 1,
                argTypes: ["anyin"]
            });

            // Create the macro for the block
            this.makeMacro((x, y) => [
                [0, "switch", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "case", 0, 0, [0, 3, null, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, "defaultcase", 0, 0, [2, null, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);

            // Update the dock value for casein
            this.updateDockValue(2, "casein");
        }

        /**
         * Handles the flow of the switch block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {Array} - An array containing the next block and its count.
         */
        flow(args, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            // Push the current switch block and create an empty case for it
            logo.switchBlocks[turtle].push(blk);
            if (blk in logo.switchCases[turtle]) {
                logo.switchCases[turtle][blk].push([]);
            } else {
                logo.switchCases[turtle][blk] = [[]];
            }

            // Set up the listener for the switch block
            const listenerName = "_switch_" + blk + "_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            // Define the listener function
            const __listener = () => {
                const switchBlk = last(logo.switchBlocks[turtle]);

                // Run the cases here.
                let switchCase;
                const argBlk = activity.blocks.blockList[switchBlk].connections[1];
                if (argBlk == null) {
                    switchCase = "__default__";
                } else {
                    switchCase = logo.parseArg(logo, turtle, argBlk, logo.receivedArg);
                }

                let caseFlow = null;
                for (let i = 0; i < last(logo.switchCases[turtle][switchBlk]).length; i++) {
                    if (last(logo.switchCases[turtle][switchBlk])[i][0] === switchCase) {
                        caseFlow = last(logo.switchCases[turtle][switchBlk])[i][1];
                        break;
                    } else if (last(logo.switchCases[turtle][switchBlk])[i][0] === "__default__") {
                        caseFlow = last(logo.switchCases[turtle][switchBlk])[i][1];
                    }
                }

                if (caseFlow != null) {
                    const queueBlock = new Queue(caseFlow, 1, switchBlk, null);
                    tur.parentFlowQueue.push(switchBlk);
                    tur.queue.push(queueBlock);
                }

                // Clean up afterward.
                logo.switchCases[turtle][switchBlk].pop();
                logo.switchBlocks[turtle].pop();
            };

            // Set the turtle listener
            logo.setTurtleListener(turtle, listenerName, __listener);

            // Return the next block and its count
            return [args[1], 1];
        }
    }

    /**
     * Represents a hidden clamp block for controlling flow.
     * @extends {FlowClampBlock}
     */
    class ClampBlock extends FlowClampBlock {
        /**
         * Constructs a ClampBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("clamp");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString();

            // Mark the block as hidden
            this.hidden = true;

            // Form the block with specific parameters
            this.formBlock(
                {
                    name: ""
                },
                false
            );
        }

        /**
         * Handles the flow of the clamp block.
         * @param {Array} args - The arguments for the block.
         * @returns {Array} - An array containing the next block and its count.
         */
        flow(args) {
            if (args.length === 1) return [args[0], 1];
        }
    }

    /**
     * Represents a block for breaking out of a loop.
     * @extends {BaseBlock}
     */
    class BreakBlock extends BaseBlock {
        /**
         * Constructs a BreakBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("break");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString([
                _("The Stop block will stop a loop") +
                    ": " +
                    _("Forever, Repeat, While, or Until."),
                "documentation",
                ""
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("stop"),
                flows: {
                    top: true,
                    bottom: "tail",
                    type: ""
                }
            });
        }

        /**
         * Handles the flow of the break block.
         * @param {Array} _ - The arguments for the block (not used).
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         */
        flow(_, logo, turtle, blk) {
            const tur = activity.turtles.ithTurtle(turtle);

            // Perform the break operation
            logo.doBreak(tur);

            // Since we pop the queue, we need to unhighlight our parent
            const parentBlk = activity.blocks.blockList[blk].connections[0];
            if (parentBlk != null) {
                if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                    tur.unhighlightQueue.push(parentBlk);
                }
            }
        }
    }

    /**
     * Represents a block for waiting until a condition is true.
     * @extends {FlowBlock}
     */
    class WaitForBlock extends FlowBlock {
        /**
         * Constructs a WaitForBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("waitFor");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString([
                _("The Waitfor block will wait until the condition is true."),
                "documentation",
                null,
                "waitforhelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("wait for"),
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        /**
         * Handles the flow of the wait-for block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         */
        flow(args, logo, turtle, blk) {
            if (args.length !== 1) return;

            const tur = activity.turtles.ithTurtle(turtle);

            if (!args[0]) {
                // Requeue.
                const parentBlk = activity.blocks.blockList[blk].connections[0];
                const queueBlock = new Queue(blk, 1, parentBlk);
                tur.parentFlowQueue.push(parentBlk);
                tur.queue.push(queueBlock);
                tur.doWait(0.05);
            } else {
                // Since a wait-for block was requeued each
                // time, we need to flush the queue of all but
                // the last one, otherwise the child of the
                // while block is executed multiple times.
                const queueLength = tur.queue.length;
                let kept_one = false;
                for (let i = queueLength - 1; i > 0; i--) {
                    if (tur.queue[i].parentBlk === blk) {
                        if (kept_one) {
                            tur.queue.pop();
                        } else {
                            kept_one = true;
                        }
                    }
                }

                // We need to reset the turtle time
                if (logo.firstNoteTime === null) {
                    logo.firstNoteTime = new Date().getTime();
                }

                const elapsedTime = (new Date().getTime() - this.firstNoteTime) / 1000;
                tur.singer.turtleTime = elapsedTime;
                tur.singer.previousTurtleTime = elapsedTime;
            }
        }
    }

    /**
     * Represents a block for repeating until a condition is true.
     * @extends {FlowClampBlock}
     */
    class UntilBlock extends FlowClampBlock {
        /**
         * Constructs an UntilBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("until");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString([
                _("The Until block will repeat until the condition is true."),
                "documentation",
                null,
                "untilhelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("until"),
                flows: {
                    labels: [this.lang === "ja" ? _("do2") : _("do")]
                },
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        /**
         * Handles the flow of the until block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {Array} - An array containing the next block and its count.
         */
        flow(args, logo, turtle, blk) {
            if (args.length !== 2) return;

            const tur = activity.turtles.ithTurtle(turtle);

            if (!args[0]) {
                // We will add the outflow of the until block
                // each time through, so we pop it off so as
                // to not accumulate multiple copies.
                const queueLength = tur.queue.length;
                if (queueLength > 0) {
                    if (tur.queue[queueLength - 1].parentBlk === blk) {
                        tur.queue.pop();
                    }
                }
                // Requeue
                const parentBlk = activity.blocks.blockList[blk].connections[0];
                const queueBlock = new Queue(blk, 1, parentBlk);
                tur.parentFlowQueue.push(parentBlk);
                tur.queue.push(queueBlock);
            } else {
                // Since an until block was requeued each
                // time, we need to flush the queue of all but
                // the last one, otherwise the child of the
                // until block is executed multiple times.
                const queueLength = tur.queue.length;
                for (let i = queueLength - 1; i > 0; i--) {
                    if (tur.queue[i].parentBlk === blk) {
                        tur.queue.pop();
                    }
                }
            }

            // Queue the child flow.
            return [args[1], 1];
        }
    }

    /**
     * Represents a block for repeating while a condition is true.
     * @extends {FlowClampBlock}
     */
    class WhileBlock extends FlowClampBlock {
        /**
         * Constructs a WhileBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("while");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString([
                _("The While block will repeat while the condition is true."),
                "documentation",
                null,
                "whilehelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("while"),
                flows: {
                    labels: [this.lang === "ja" ? _("do2") : _("do")]
                },
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        /**
         * Handles the flow of the while block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {Array} - An array containing the next block and its count.
         */
        flow(args, logo, turtle, blk) {
            // While is tricky because we need to recalculate
            // args[0] each time, so we requeue the While block
            // itself.
            if (args.length !== 2) return;

            const tur = activity.turtles.ithTurtle(turtle);

            if (args[0]) {
                // We will add the outflow of the while block
                // each time through, so we pop it off so as
                // to not accumulate multiple copies.
                const queueLength = tur.queue.length;
                if (queueLength > 0) {
                    if (tur.queue[queueLength - 1].parentBlk === blk) {
                        tur.queue.pop();
                    }
                }

                const parentBlk = activity.blocks.blockList[blk].connections[0];
                const queueBlock = new Queue(blk, 1, parentBlk);
                tur.parentFlowQueue.push(parentBlk);
                tur.queue.push(queueBlock);

                // and queue the interior child flow.
                return [args[1], 1];
            } else {
                // Since a while block was requeued each time,
                // we need to flush the queue of all but the
                // last one, otherwise the child of the while
                // block is executed multiple times.
                const queueLength = tur.queue.length;
                for (let i = queueLength - 1; i > 0; i--) {
                    if (tur.queue[i].parentBlk === blk) {
                        tur.queue.pop();
                    }
                }
            }

            // Queue the child flow.
            return [args[1], 1];
        }
    }

    /**
     * Represents a block for conditionally executing one of two flows.
     * @extends {FlowClampBlock}
     */
    class IfThenElseBlock extends FlowClampBlock {
        /**
         * Constructs an IfThenElseBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("ifthenelse");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);
            this.beginnerBlock(true);

            if (activity.beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _(
                        "Conditionals lets your program take different actions depending on the condition."
                    ) +
                        " " +
                        _("In this example if the mouse button is pressed a snare drum will play."),
                    "documentation",
                    null,
                    "elifhelp"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "Conditionals lets your program take different actions depending on the condition."
                    ) +
                        " " +
                        _(
                            "In this example if the mouse button is pressed a snare drum will play, else a kick drum will play."
                        ),
                    "documentation",
                    null,
                    "elifhelp"
                ]);
            }

            // Form the block with specific parameters
            this.formBlock({
                name: _("if"),
                flows: {
                    labels: [_("then"), _("else")]
                },
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        /**
         * Handles the flow of the if-then-else block.
         * @param {Array} args - The arguments for the block.
         * @returns {Array} - An array containing the next block and its count.
         */
        flow(args) {
            if (args.length !== 3) return;
            if (args[0]) return [args[1], 1];
            return [args[2], 1];
        }
    }

    /**
     * Represents a block for conditionally executing a flow.
     * @extends {FlowClampBlock}
     */
    class IfBlock extends FlowClampBlock {
        /**
         * Constructs an IfBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("if");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);
            this.beginnerBlock(true);

            if (activity.beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _(
                        "Conditionals lets your program take different actions depending on the condition."
                    ) +
                        " " +
                        _("In this example if the mouse button is pressed a snare drum will play."),
                    "documentation",
                    null,
                    "ifhelp"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "Conditionals lets your program take different actions depending on the condition."
                    ) +
                        " " +
                        _("In this example if the mouse button is pressed a snare drum will play."),
                    "documentation",
                    null,
                    "ifhelp"
                ]);
            }

            // Form the block with specific parameters
            this.formBlock({
                name: _("if"),
                flows: {
                    labels: [_("then")]
                },
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        /**
         * Handles the flow of the if block.
         * @param {Array} args - The arguments for the block.
         * @returns {Array} - An array containing the next block and its count.
         */
        flow(args) {
            if (args.length === 2 && args[0]) return [args[1], 1];
        }
    }

    /**
     * Represents a block for repeating a flow forever.
     * @extends {FlowClampBlock}
     */
    class ForeverBlock extends FlowClampBlock {
        /**
         * Constructs a ForeverBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("forever");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);
            this.beginnerBlock(true);

            // Set the help string for the block
            this.setHelpString([
                _("The Forever block will repeat the contained blocks forever.") +
                    " " +
                    _(
                        "In this example of a simple drum machine a kick drum will play 1/4 notes forever."
                    ),
                "documentation",
                null,
                "foreverhelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("forever")
            });
        }

        /**
         * Handles the flow of the forever block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @returns {Array} - An array containing the next block and its count.
         */
        flow(args, logo, turtle) {
            if (args.length !== 1) return;

            return [args[0], activity.turtles.ithTurtle(turtle).singer.suppressOutput ? 20 : -1];
        }
    }

    /**
     * Represents a block for repeating a flow a specified number of times.
     * @extends {FlowClampBlock}
     */
    class RepeatBlock extends FlowClampBlock {
        /**
         * Constructs a RepeatBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("repeat");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);
            this.beginnerBlock(true);

            // Set the help string for the block
            this.setHelpString([
                _("The Repeat block will repeat the contained blocks.") +
                    " " +
                    _("In this example the note will be played 4 times."),
                "documentation",
                null,
                "repeathelp"
            ]);

            // Form the block with specific parameters
            this.formBlock({
                name: _("repeat"),
                args: 1,
                argLabels: [""],
                defaults: [4]
            });
        }

        /**
         * Handles the flow of the repeat block.
         * @param {Array} args - The arguments for the block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         * @returns {Array} - An array containing the next block and its count.
         */
        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let arg;
            if (args[0] === null || typeof args[0] !== "number" || args[0] < 1) {
                if (args[0] < 0) activity.errorMsg(POSNUMBER, blk);
                return [null, 0];
            } else {
                arg = args[0];
            }

            return [args[1], Math.floor(arg)];
        }
    }

    /**
     * Represents a block for providing a duplicate factor value.
     * @extends {ValueBlock}
     */
    class DuplicateFactorBlock extends ValueBlock {
        /**
         * Constructs a DuplicateFactorBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("duplicatefactor", _("duplicate factor"));

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString();
            this.hidden = true;
        }

        /**
         * Handles the argument for the duplicate factor block.
         * @param {object} logo - The logo object.
         * @param {object} turtle - The turtle object.
         * @param {number} blk - The block number.
         */
        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                activity.blocks.blockList[activity.blocks.blockList[blk].connections[0]].name ===
                    "print"
            ) {
                logo.statusFields.push([blk, "duplicate"]);
            } else {
                activity.blocks.blockList[blk].value =
                    activity.turtles.ithTurtle(turtle).singer.duplicateFactor;
            }
        }
    }

    /**
     * Represents a hidden block without flow.
     * @extends {FlowBlock}
     */
    class HiddenNoFlowBlock extends FlowBlock {
        /**
         * Constructs a HiddenNoFlowBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("hiddennoflow");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString();
            this.dockTypes[this.dockTypes.length - 1] = "unavailable";
            this.size = 0;
            this.hidden = true;
        }

        /**
         * Does not handle any flow for the hidden no flow block.
         */
        flow() {}
    }

    /**
     * Represents a hidden block with flow.
     * @extends {FlowBlock}
     */
    class HiddenBlock extends FlowBlock {
        /**
         * Constructs a HiddenBlock instance.
         */
        constructor() {
            // Call the constructor of the parent class
            super("hidden");

            // Set the palette and activity for the block
            this.setPalette("flow", activity);

            // Set the help string for the block
            this.setHelpString();
            this.size = 0;
            this.hidden = true;
        }

        /**
         * Does not handle any flow for the hidden block.
         */
        flow() {}
    }

    new BackwardBlock().setup(activity);
    new DuplicateBlock().setup(activity);
    new DefaultCaseBlock().setup(activity);
    new CaseBlock().setup(activity);
    new SwitchBlock().setup(activity);
    new ClampBlock().setup(activity);
    new BreakBlock().setup(activity);
    new WaitForBlock().setup(activity);
    new UntilBlock().setup(activity);
    new WhileBlock().setup(activity);
    new IfThenElseBlock().setup(activity);
    new IfBlock().setup(activity);
    new ForeverBlock().setup(activity);
    new RepeatBlock().setup(activity);
    new DuplicateFactorBlock().setup(activity);
    new HiddenNoFlowBlock().setup(activity);
    new HiddenBlock().setup(activity);
}
