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

_, FlowBlock, LeftBlock, FlowClampBlock, StackClampBlock, ValueBlock,
Queue, NOACTIONERRORMSG, NOINPUTERRORMSG
*/

/* exported setupActionBlocks */

/**
 * Sets up action blocks for a given activity.
 *
 * @param {string} activity - The activity associated with the action blocks.
 */
function setupActionBlocks(activity) {
    /**
     * Represents a Return block that returns a value from an action.
     *
     * @class
     * @extends FlowBlock
     */
    class ReturnBlock extends FlowBlock {
        /**
         * Constructor for the ReturnBlock class.
         */
        constructor() {
            super("return");

            /**
             * Sets the palette and help string for the Return block.
             *
             * @memberof ReturnBlock
             * @method
             * @param {string} palette - The palette to set for the block.
             * @param {string} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the Return block.
             *
             * @memberof ReturnBlock
             * @method
             * @param {Array} helpString - The help string to set for the block.
             */
            this.setHelpString([
                _("The Return block will return a value from an action."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specific details.
             *
             * @memberof ReturnBlock
             * @method
             * @param {Object} options - The options for forming the block.
             * @param {string} options.name - The name of the block.
             * @param {number} options.args - The number of arguments for the block.
             * @param {Array} options.defaults - The default values for arguments.
             * @param {Array} options.argTypes - The types of arguments.
             */
            this.formBlock({
                name: _("return"),
                args: 1,
                defaults: [100],
                argTypes: ["anyin"]
            });
        }

        /**
         * Handles the flow of the Return block.
         *
         * @memberof ReturnBlock
         * @method
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {string} turtle - The turtle associated with the flow.
         */
        flow(args, logo, turtle) {
            if (args.length === 1) {
                logo.returns[turtle].push(args[0]);
            }
        }
    }
    /**
     * Represents a Return to URL block that returns a value to a webpage.
     *
     * @class
     * @extends FlowBlock
     */
    class ReturnToURLBlock extends FlowBlock {
        /**
         * Constructor for the ReturnToURLBlock class.
         */
        constructor() {
            super("returnToUrl");

            /**
             * Sets the palette and help string for the Return to URL block.
             *
             * @memberof ReturnToURLBlock
             * @method
             * @param {string} palette - The palette to set for the block.
             * @param {string} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the Return to URL block.
             *
             * @memberof ReturnToURLBlock
             * @method
             * @param {Array} helpString - The help string to set for the block.
             */
            this.setHelpString([
                _("The Return to URL block will return a value to a webpage."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specific details.
             *
             * @memberof ReturnToURLBlock
             * @method
             * @param {Object} options - The options for forming the block.
             * @param {string} options.name - The name of the block.
             * @param {number} options.args - The number of arguments for the block.
             * @param {Array} options.defaults - The default values for arguments.
             * @param {Array} options.argTypes - The types of arguments.
             */
            this.formBlock({
                name: _("return to URL"),
                args: 1,
                defaults: [100],
                argTypes: ["anyin"]
            });
        }

        /**
         * Handles the flow of the Return to URL block.
         *
         * @memberof ReturnToURLBlock
         * @method
         * @param {Array} args - The arguments for the flow.
         */
        flow(args) {
            const URL = window.location.href;
            let urlParts;
            let outurl;

            if (URL.indexOf("?") > 0) {
                urlParts = URL.split("?");
                if (urlParts[1].indexOf("&") > 0) {
                    const newUrlParts = urlParts[1].split("&");

                    for (let i = 0; i < newUrlParts.length; i++) {
                        if (newUrlParts[i].indexOf("=") > 0) {
                            const tempargs = newUrlParts[i].split("=");
                            switch (tempargs[0].toLowerCase()) {
                                case "outurl":
                                    outurl = tempargs[1];
                                    break;
                            }
                        }
                    }
                }
            }

            if (args.length === 1) {
                const jsonRet = {};
                jsonRet["result"] = args[0];
                const json = JSON.stringify(jsonRet);
                const xmlHttp = new XMLHttpRequest();

                xmlHttp.open("POST", outurl, true);

                // Call a function when the state changes.
                xmlHttp.onreadystatechange = () => {
                    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                        alert(xmlHttp.responseText);
                    }
                };

                xmlHttp.send(json);
            }
        }
    }

    /**
     * Represents a Calculate block that returns a value calculated by an action.
     *
     * @class
     * @extends LeftBlock
     */
    class CalcBlock extends LeftBlock {
        /**
         * Constructor for the CalcBlock class.
         */
        constructor() {
            super("calc");

            /**
             * Sets the palette and help string for the Calculate block.
             *
             * @memberof CalcBlock
             * @method
             * @param {string} palette - The palette to set for the block.
             * @param {string} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the Calculate block.
             *
             * @memberof CalcBlock
             * @method
             * @param {Array} helpString - The help string to set for the block.
             */
            this.setHelpString([
                _("The Calculate block returns a value calculated by an action."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specific details.
             *
             * @memberof CalcBlock
             * @method
             * @param {Object} options - The options for forming the block.
             * @param {string} options.name - The name of the block.
             * @param {string} options.outType - The output type of the block.
             * @param {number} options.args - The number of arguments for the block.
             * @param {Array} options.defaults - The default values for arguments.
             * @param {Array} options.argTypes - The types of arguments.
             */
            this.formBlock({
                name: _("calculate"),
                outType: "anyout",
                args: 1,
                defaults: [_("action")],
                argTypes: ["anyin"]
            });
        }
    }
    /**
     * Represents a Named Calculate block that returns a value calculated by an action.
     *
     * @class
     * @extends ValueBlock
     */
    class NamedCalcBlock extends ValueBlock {
        /**
         * Constructor for the NamedCalcBlock class.
         */
        constructor() {
            super("namedcalc");

            /**
             * Sets the palette and help string for the Named Calculate block.
             *
             * @memberof NamedCalcBlock
             * @method
             * @param {string} palette - The palette to set for the block.
             * @param {string} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the Named Calculate block.
             *
             * @memberof NamedCalcBlock
             * @method
             * @param {Array} helpString - The help string to set for the block.
             */
            this.setHelpString([
                _("The Calculate block returns a value calculated by an action."),
                "documentation",
                ""
            ]);

            // Additional width for the block
            this.extraWidth = 20;

            /**
             * Forms the block with specific details.
             *
             * @memberof NamedCalcBlock
             * @method
             * @param {Object} options - The options for forming the block.
             * @param {string} options.name - The name of the block.
             */
            this.formBlock({
                name: _("action")
            });
        }

        /**
         * Handles the argument logic for the Named Calculate block.
         *
         * @memberof NamedCalcBlock
         * @method
         * @param {Object} logo - The logo object.
         * @param {string} turtle - The turtle associated with the block.
         * @param {number} blk - The block ID.
         * @param {Array} receivedArg - The received arguments.
         * @returns {number} The result of the calculation.
         */
        arg(logo, turtle, blk, receivedArg) {
            const name = activity.blocks.blockList[blk].privateData;
            let actionArgs = [];

            actionArgs = receivedArg;

            if (name in logo.actions) {
                activity.turtles.turtleList[turtle].running = true;
                logo.runFromBlockNow(
                    logo,
                    turtle,
                    logo.actions[name],
                    true,
                    actionArgs,
                    activity.turtles.turtleList[turtle].queue.length
                );
                return logo.returns[turtle].shift();
            } else {
                activity.errorMsg(NOACTIONERRORMSG, blk, name);
                return 0;
            }
        }
    }
    /**
     * Represents a Named Do Argument block used to initiate an action with arguments.
     *
     * @class
     * @extends FlowClampBlock
     */
    class NamedDoArgBlock extends FlowClampBlock {
        /**
         * Constructor for the NamedDoArgBlock class.
         */
        constructor() {
            super("nameddoArg");

            /**
             * Sets the palette and help string for the Named Do Argument block.
             *
             * @memberof NamedDoArgBlock
             * @method
             * @param {string} palette - The palette to set for the block.
             * @param {string} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the Named Do Argument block.
             *
             * @memberof NamedDoArgBlock
             * @method
             * @param {Array} helpString - The help string to set for the block.
             */
            this.setHelpString([
                _("The Do block is used to initiate an action."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specific details.
             *
             * @memberof NamedDoArgBlock
             * @method
             * @param {Object} options - The options for forming the block.
             * @param {string} options.name - The name of the block.
             */
            this.formBlock({
                name: this.lang === "ja" ? _("do1") : _("do"),
                flows: {
                    type: "arg",
                    types: ["anyin"]
                }
            });
        }

        /**
         * Handles the flow logic for the Named Do Argument block.
         *
         * @memberof NamedDoArgBlock
         * @method
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         * @param {string} turtle - The turtle associated with the block.
         * @param {number} blk - The block ID.
         * @param {Array} receivedArg - The received arguments.
         * @param {Array} actionArgs - The arguments for the action.
         * @returns {Array} An array containing the child flow and a value (1).
         */
        flow(args, logo, turtle, blk, receivedArg, actionArgs) {
            const name = activity.blocks.blockList[blk].privateData;

            while (actionArgs.length > 0) {
                actionArgs.pop();
            }

            if (activity.blocks.blockList[blk].argClampSlots.length > 0) {
                for (let i = 0; i < activity.blocks.blockList[blk].argClampSlots.length; i++) {
                    if (activity.blocks.blockList[blk].connections[i + 1] != null) {
                        const t = logo.parseArg(
                            logo,
                            turtle,
                            activity.blocks.blockList[blk].connections[i + 1],
                            blk,
                            receivedArg
                        );
                        actionArgs.push(t);
                    } else {
                        actionArgs.push(null);
                    }
                }
            }

            const tur = activity.turtles.ithTurtle(turtle);

            if (name in logo.actions) {
                if (tur.singer.justCounting.length === 0) {
                    logo.notation.notationLineBreak(turtle);
                }

                let childFlow;

                if (tur.singer.backward.length > 0) {
                    childFlow = activity.blocks.findBottomBlock(logo.actions[name]);
                    const actionBlk = activity.blocks.findTopBlock(logo.actions[name]);
                    tur.singer.backward.push(actionBlk);

                    const listenerName = "_backward_action_" + turtle + "_" + blk;
                    logo.setDispatchBlock(blk, turtle, listenerName);

                    const nextBlock = activity.blocks.blockList[actionBlk].connections[2];

                    if (nextBlock === null) {
                        tur.singer.backward.pop();
                    } else {
                        if (nextBlock in tur.endOfClampSignals) {
                            tur.endOfClampSignals[nextBlock].push(listenerName);
                        } else {
                            tur.endOfClampSignals[nextBlock] = [listenerName];
                        }
                    }

                    // eslint-disable-next-line no-unused-vars
                    const __listener = (event) => tur.singer.backward.pop();

                    logo.setTurtleListener(turtle, listenerName, __listener);
                } else {
                    childFlow = logo.actions[name];
                }

                return [childFlow, 1];
            } else {
                activity.errorMsg(NOACTIONERRORMSG, blk, name);
            }
        }
    }
    /**
     * Represents a block for named calculations.
     * @extends {LeftBlock}
     */
    class NamedCalcArgBlock extends LeftBlock {
        /**
         * Constructs a NamedCalcArgBlock.
         */
        constructor() {
            super("namedcalcArg");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Calculate block returns a value calculated by an action."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {Object} config.flows - The flow configuration.
             * @param {string} config.flows.type - The type of flow.
             * @param {string[]} config.flows.types - The allowed flow types.
             * @param {string[]} config.flows.labels - The flow labels.
             * @param {string} config.outType - The output type.
             */
            this.formBlock({
                name: _("calculate"),
                flows: {
                    type: "arg",
                    types: ["anyin"],
                    labels: [""]
                },
                outType: "anyout"
            });
        }

        /**
         * Handles the argument for the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {any} receivedArg - The received argument.
         * @returns {any} - The result of the argument handling.
         */
        arg(logo, turtle, blk, receivedArg) {
            const name = activity.blocks.blockList[blk].privateData;
            const actionArgs = [];

            if (activity.blocks.blockList[blk].argClampSlots.length > 0) {
                for (let i = 0; i < activity.blocks.blockList[blk].argClampSlots.length; i++) {
                    const t = logo.parseArg(
                        logo,
                        turtle,
                        activity.blocks.blockList[blk].connections[i + 1],
                        blk,
                        receivedArg
                    );
                    actionArgs.push(t);
                }
            }

            if (name in logo.actions) {
                // Just run the stack.
                activity.turtles.turtleList[turtle].running = true;
                logo.runFromBlockNow(
                    logo,
                    turtle,
                    logo.actions[name],
                    true,
                    actionArgs,
                    activity.turtles.turtleList[turtle].queue.length
                );
                return logo.returns[turtle].pop();
            } else {
                activity.errorMsg(NOACTIONERRORMSG, blk, name);
                return 0;
            }
        }
    }
    /**
     * Represents a block for initiating an action with arguments.
     * @extends {FlowClampBlock}
     */
    class DoArgBlock extends FlowClampBlock {
        /**
         * Constructs a DoArgBlock.
         */
        constructor() {
            super("doArg");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Do block is used to initiate an action."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {Object} config.flows - The flow configuration.
             * @param {string} config.flows.type - The type of flow.
             * @param {string[]} config.flows.types - The allowed flow types.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             * @param {string[]} config.defaults - The default values for arguments.
             */
            this.formBlock({
                name: this.lang === "ja" ? _("do1") : _("do"),
                flows: {
                    type: "arg",
                    types: ["anyin"]
                },
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("action")]
            });
        }

        /**
         * Handles the flow of the block.
         * @param {string[]} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {any} receivedArg - The received argument.
         * @param {any[]} actionArgs - The action arguments.
         * @returns {Array} - The result of the flow handling.
         */
        flow(args, logo, turtle, blk, receivedArg, actionArgs) {
            while (actionArgs.length > 0) {
                actionArgs.pop();
            }

            if (activity.blocks.blockList[blk].argClampSlots.length > 0) {
                for (let i = 0; i < activity.blocks.blockList[blk].argClampSlots.length; i++) {
                    if (activity.blocks.blockList[blk].connections[i + 2] != null) {
                        const t = logo.parseArg(
                            logo,
                            turtle,
                            activity.blocks.blockList[blk].connections[i + 2],
                            blk,
                            receivedArg
                        );
                        actionArgs.push(t);
                    } else {
                        actionArgs.push(null);
                    }
                }
            }

            if (args.length >= 1) {
                if (args[0] in logo.actions) {
                    if (activity.turtles.ithTurtle(turtle).singer.justCounting.length === 0) {
                        logo.notation.notationLineBreak(turtle);
                    }
                    return [logo.actions[args[0]], 1];
                } else {
                    activity.errorMsg(NOACTIONERRORMSG, blk, args[0]);
                }
            }
        }
    }
    /**
     * Represents a block for calculating a value based on an action with arguments.
     * @extends {LeftBlock}
     */
    class CalcArgBlock extends LeftBlock {
        /**
         * Constructs a CalcArgBlock.
         */
        constructor() {
            super("calcArg");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Calculate block returns a value calculated by an action."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.outType - The output type.
             * @param {Object} config.flows - The flow configuration.
             * @param {string} config.flows.type - The type of flow.
             * @param {string[]} config.flows.types - The allowed flow types.
             * @param {string[]} config.flows.labels - The flow labels.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             * @param {string[]} config.defaults - The default values for arguments.
             */
            this.formBlock({
                name: _("calculate"),
                outType: "anyout",
                flows: {
                    type: "arg",
                    types: ["anyin"],
                    labels: [""]
                },
                args: 1,
                argTypes: ["anyin"],
                defaults: [_("action")]
            });
        }

        /**
         * Handles the argument for the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {any} receivedArg - The received argument.
         * @returns {any} - The result of the argument handling.
         */
        arg(logo, turtle, blk, receivedArg) {
            const actionArgs = [];

            if (activity.blocks.blockList[blk].argClampSlots.length > 0) {
                for (let i = 0; i < activity.blocks.blockList[blk].argClampSlots.length; i++) {
                    const t = logo.parseArg(
                        logo,
                        turtle,
                        activity.blocks.blockList[blk].connections[i + 2],
                        blk,
                        receivedArg
                    );
                    actionArgs.push(t);
                }
            }

            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                const name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (name in logo.actions) {
                    activity.turtles.turtleList[turtle].running = true;
                    logo.runFromBlockNow(
                        logo,
                        turtle,
                        logo.actions[name],
                        true,
                        actionArgs,
                        activity.turtles.turtleList[turtle].queue.length
                    );
                    return logo.returns[turtle].pop();
                } else {
                    activity.errorMsg(NOACTIONERRORMSG, blk, name);
                    return 0;
                }
            }
        }
    }
    /**
     * Represents a block for accessing the value of an argument passed to an action.
     * @extends {LeftBlock}
     */
    class ArgBlock extends LeftBlock {
        /**
         * Constructs an ArgBlock.
         */
        constructor() {
            super("arg");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Arg block contains the value of an argument passed to an action."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {string} config.outType - The output type.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.defaults - The default values for arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: _("arg"),
                outType: "anyout",
                args: 1,
                defaults: [1],
                argTypes: ["numberin"]
            });
        }

        /**
         * Handles the argument for the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {any} receivedArg - The received argument.
         * @returns {number} - The value of the specified argument.
         */
        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];

            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                const name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                const actionArgs = receivedArg;

                if (actionArgs && actionArgs.length >= Number(name)) {
                    const value = actionArgs[Number(name) - 1];
                    return value;
                } else {
                    activity.errorMsg(_("Invalid argument"), blk);
                    return 0;
                }
            }
        }
    }
    /**
     * Represents a block for accessing the value of a named argument passed to an action.
     * @extends {LeftBlock}
     */
    class NamedArgBlock extends LeftBlock {
        /**
         * Constructs a NamedArgBlock.
         */
        constructor() {
            super("namedarg");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Arg block contains the value of an argument passed to an action."),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {Object} config.flows - The flow configuration.
             * @param {string} config.flows.type - The type of flow.
             */
            this.formBlock({
                name: _("arg") + 1,
                flows: {
                    type: "value"
                }
            });
        }

        /**
         * Handles the argument for the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {any} receivedArg - The received argument.
         * @returns {number} - The value of the specified named argument.
         */
        arg(logo, turtle, blk, receivedArg) {
            const name = activity.blocks.blockList[blk].privateData;
            const actionArgs = receivedArg;

            // If an action block with an arg is clicked,
            // the arg will have no value.
            if (actionArgs === null) {
                activity.errorMsg(_("Invalid argument"), blk);
                return 0;
            }

            if (actionArgs.length >= Number(name)) {
                const value = actionArgs[Number(name) - 1];
                return value;
            } else {
                activity.errorMsg(_("Invalid argument"), blk);
                return 0;
            }
        }
    }
    /**
     * Represents a block for initiating an action.
     * @extends {FlowBlock}
     */
    class DoBlock extends FlowBlock {
        /**
         * Constructs a DoBlock.
         */
        constructor() {
            //.TRANS: do is the do something or take an action.
            super("do");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Specifies if the block is for beginners.
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Do block is used to initiate an action.") +
                    " " +
                    _("In the example, it is used with the One of block to choose a random phase."),
                "documentation",
                null,
                "dohelp"
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.defaults - The default values for arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: this.lang === "ja" ? _("do1") : _("do"),
                args: 1,
                defaults: [_("action")],
                argTypes: ["anyin"]
            });
        }

        /**
         * Handles the flow of the block.
         * @param {string[]} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {Array} - The result of the flow handling.
         */
        flow(args, logo, turtle, blk) {
            if (args.length === 0) return;

            if (args[0] in logo.actions) {
                if (activity.turtles.ithTurtle(turtle).singer.justCounting.length === 0) {
                    logo.notation.notationLineBreak(turtle);
                }

                return [logo.actions[args[0]], 1];
            }

            // eslint-disable-next-line no-console
            console.debug("action " + args[0] + " not found");
            activity.errorMsg(NOACTIONERRORMSG, blk, args[0]);
        }
    }
    /**
     * Represents a block for listening to an event and triggering an action.
     * @extends {FlowBlock}
     */
    class ListenBlock extends FlowBlock {
        /**
         * Constructs a ListenBlock.
         */
        constructor() {
            super("listen");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Specifies if the block is for beginners.
             */
            this.beginnerBlock(true);

            /**
             * Adjusts the width of the block for the Japanese language.
             */
            if (this.lang === "ja") {
                this.extraWidth = 15;
                this.setHelpString([
                    _("The Listen block is used to listen for an event such as a mouse click."),
                    "documentation",
                    null,
                    "broadcasthelp"
                ]);
            } else {
                this.setHelpString([
                    _("The Listen block is used to listen for an event such as a mouse click.") +
                        " " +
                        _("When the event happens, an action is taken."),
                    "documentation",
                    null,
                    "broadcasthelp"
                ]);
            }

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             * @param {string[]} config.argLabels - The labels for arguments.
             * @param {string[]} config.defaults - The default values for arguments.
             */
            this.formBlock({
                name: _("on"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                argLabels: [_("event"), this.lang === "ja" ? _("do1") : _("do")],
                defaults: [_("event"), _("action")]
            });
        }

        /**
         * Handles the flow of the block.
         * @param {string[]} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @param {any} receivedArg - The received argument.
         */
        flow(args, logo, turtle, blk, receivedArg) {
            if (args.length !== 2) return;

            if (!(args[1] in logo.actions)) {
                activity.errorMsg(NOACTIONERRORMSG, blk, args[1]);
            } else {
                const tur = activity.turtles.ithTurtle(turtle);

                // eslint-disable-next-line no-unused-vars
                const __listener = (event) => {
                    if (tur.running) {
                        const queueBlock = new Queue(logo.actions[args[1]], 1, blk);
                        tur.parentFlowQueue.push(blk);
                        tur.queue.push(queueBlock);
                    } else {
                        // Since the turtle has stopped running, we
                        // must run the stack from here.
                        tur.singer.runningFromEvent = true;
                        // First, we need to reset the turtle's
                        // elapsed time since it has been falling behind.
                        const elapsedTime =
                            (new Date().getTime() - activity.logo.firstNoteTime) / 1000;
                        tur.singer.turtleTime = elapsedTime;

                        logo.runFromBlockNow(
                            logo,
                            turtle,
                            logo.actions[args[1]],
                            false,
                            receivedArg
                        );
                    }
                };

                // If there is already a listener, remove it before adding the new one
                logo.setTurtleListener(turtle, args[0], __listener);
            }
        }
    }

    /**
     * Represents a Dispatch Block used to trigger an event.
     *
     * @class
     * @extends FlowBlock
     */
    class DispatchBlock extends FlowBlock {
        /**
         * Constructor for the DispatchBlock class.
         */
        constructor() {
            super("dispatch");

            /**
             * Sets the palette and marks the block as a beginner block.
             *
             * @memberof DispatchBlock
             * @method
             * @param {string} palette - The palette to set for the block.
             * @param {string} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);
            this.beginnerBlock(true);

            /**
             * Sets the help string for the Dispatch block.
             *
             * @memberof DispatchBlock
             * @method
             * @param {Array} helpString - The help string to set for the block.
             */
            this.setHelpString([
                _("The Broadcast block is used to trigger an event."),
                "documentation",
                null,
                "broadcasthelp"
            ]);

            /**
             * Forms the block with specific details.
             *
             * @memberof DispatchBlock
             * @method
             * @param {Object} options - The options for forming the block.
             * @param {string} options.name - The name of the block.
             * @param {number} options.args - The number of arguments for the block.
             * @param {Array} options.defaults - The default values for arguments.
             * @param {Array} options.argTypes - The types of arguments.
             */
            this.formBlock({
                name: _("broadcast"),
                args: 1,
                defaults: [_("event")],
                argTypes: ["anyin"]
            });
        }

        /**
         * Handles the flow logic for the Dispatch block.
         *
         * @memberof DispatchBlock
         * @method
         * @param {Array} args - The arguments for the flow.
         * @param {Object} logo - The logo object.
         */
        flow(args, logo) {
            // Dispatch an event.
            if (args.length !== 1) return;

            // If the event is not in the event list, add it.
            if (!(args[0] in logo.eventList)) {
                const event = new Event(args[0]);
                logo.eventList[args[0]] = event;
            }

            // Trigger the event on the activity's stage.
            activity.stage.dispatchEvent(args[0]);
        }
    }
    /**
     * Represents a block for starting a voice.
     * @extends {StackClampBlock}
     */
    class StartBlock extends StackClampBlock {
        /**
         * Constructs a StartBlock.
         */
        constructor() {
            super("start");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Specifies if the block is for beginners.
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("Each Start block is a separate voice.") +
                    " " +
                    _(
                        "All of the Start blocks run at the same time when the Play button is pressed."
                    ),
                "documentation",
                ""
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {boolean} config.canCollapse - Indicates if the block can be collapsed.
             */
            this.formBlock({ name: _("start"), canCollapse: true });
        }

        /**
         * Handles the flow of the block.
         * @param {string[]} args - The arguments for the block.
         * @returns {Array} - The result of the flow handling.
         */
        flow(args) {
            if (args.length === 1) return [args[0], 1];
        }
    }
    /**
     * Represents a block for starting a drum voice.
     * @extends {StartBlock}
     */
    class StartDrumBlock extends StartBlock {
        /**
         * Constructs a StartDrumBlock.
         */
        constructor() {
            super();

            /**
             * Changes the name of the block to "startdrum".
             */
            this.changeName("startdrum");

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({ name: _("start drum") });

            /**
             * Creates a macro for the block.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             * @returns {Array} - The macro generated by the block.
             */
            this.makeMacro((x, y) => [
                [0, "start", x, y, [null, 1, null]],
                [1, "setdrum", 0, 0, [0, 2, null, 3]],
                [2, ["drumname", { value: "kick drum" }], 0, 0, [1]],
                [3, "hidden", 0, 0, [1, null]]
            ]);
        }
    }
    /**
     * Represents a block for grouping together blocks to be used more than once.
     * @extends {StackClampBlock}
     */
    class ActionBlock extends StackClampBlock {
        /**
         * Constructs an ActionBlock.
         */
        constructor() {
            super("action");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Specifies if the block is for beginners.
             */
            this.beginnerBlock(true);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _(
                    "The Action block is used to group together blocks so that they can be used more than once."
                ) +
                    " " +
                    _("It is often used for storing a phrase of music that is repeated."),
                "documentation",
                null,
                "actionhelp"
            ]);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {boolean} config.canCollapse - Indicates if the block can be collapsed.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {string[]} config.argLabels - The labels for arguments.
             * @param {string[]} config.defaults - The default values for arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                canCollapse: true,
                name: _("action"),
                args: 1,
                argLabels: [""],
                defaults: [_("action")],
                argTypes: ["anyin"]
            });

            /**
             * Creates a macro for the block.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             * @returns {Array} - The macro generated by the block.
             */
            this.makeMacro((x, y) => [
                [0, "action", x, y, [null, 1, 2, null]],
                [1, ["text", { value: _("action") }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        /**
         * Handles the flow of the block.
         * @param {string[]} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {Array} - The result of the flow handling.
         */
        flow(args, logo, turtle, blk) {
            if (args.length === 0) return;

            if (args[0] in logo.actions) {
                if (activity.turtles.ithTurtle(turtle).singer.justCounting.length === 0) {
                    logo.notation.notationLineBreak(turtle);
                }

                return [logo.actions[args[0]], 1];
            }

            // eslint-disable-next-line no-console
            console.debug("action " + args[0] + " not found");
            activity.errorMsg(NOACTIONERRORMSG, blk, args[0]);
        }
    }
    /**
     * Represents a block for initiating an action with a specified name.
     * @extends {FlowBlock}
     */
    class NamedDoBlock extends FlowBlock {
        /**
         * Constructs a NamedDoBlock.
         */
        constructor() {
            super("nameddo");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Sets the help string for the block.
             * @type {string[]}
             */
            this.setHelpString([
                _("The Do block is used to initiate an action."),
                "documentation",
                ""
            ]);

            /**
             * Adjusts the width of the block.
             */
            this.extraWidth = 30;

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             */
            this.formBlock({ name: _("action") });

            /**
             * Indicates whether the block is hidden.
             */
            this.hidden = true;
        }

        /**
         * Handles the flow of the block.
         * @param {string[]} args - The arguments for the block.
         * @param {Logo} logo - The logo instance.
         * @param {string} turtle - The turtle identifier.
         * @param {string} blk - The block identifier.
         * @returns {Array} - The result of the flow handling.
         */
        flow(args, logo, turtle, blk) {
            const name = activity.blocks.blockList[blk].privateData;

            if (!(name in logo.actions)) {
                activity.errorMsg(NOACTIONERRORMSG, blk, name);
            }

            const tur = activity.turtles.ithTurtle(turtle);

            if (tur.singer.justCounting.length === 0) {
                logo.notation.notationLineBreak(turtle);
            }

            let childFlow;

            if (tur.singer.backward.length > 0) {
                childFlow = activity.blocks.findBottomBlock(logo.actions[name]);
                const actionBlk = activity.blocks.findTopBlock(logo.actions[name]);
                tur.singer.backward.push(actionBlk);

                const listenerName = "_backward_action_" + turtle + "_" + blk;
                logo.setDispatchBlock(blk, turtle, listenerName);

                const nextBlock = activity.blocks.blockList[actionBlk].connections[2];

                if (nextBlock === null) {
                    tur.singer.backward.pop();
                } else {
                    if (nextBlock in tur.endOfClampSignals) {
                        tur.endOfClampSignals[nextBlock].push(listenerName);
                    } else {
                        tur.endOfClampSignals[nextBlock] = [listenerName];
                    }
                }

                // eslint-disable-next-line no-unused-vars
                const __listener = (event) => tur.singer.backward.pop();

                logo.setTurtleListener(turtle, listenerName, __listener);
            } else {
                childFlow = logo.actions[name];
            }

            return [childFlow, 1];
        }
    }
    /**
     * Represents a block for defining a custom temperament.
     * @extends {StackClampBlock}
     */
    class Temperament1Block extends StackClampBlock {
        /**
         * Constructs a Temperament1Block.
         */
        constructor() {
            super("temperament1");

            /**
             * Sets the palette for the block.
             * @param {string} "action" - The palette category.
             * @param {Activity} activity - The activity associated with the block.
             */
            this.setPalette("action", activity);

            /**
             * Forms the block with specified configuration.
             * @param {Object} config - The configuration object.
             * @param {string} config.name - The name of the block.
             * @param {number} config.args - The number of arguments.
             * @param {boolean} config.canCollapse - Indicates if the block can be collapsed.
             * @param {string[]} config.argLabels - The labels for arguments.
             * @param {string[]} config.defaults - The default values for arguments.
             * @param {string[]} config.argTypes - The allowed argument types.
             */
            this.formBlock({
                name: _("define temperament"),
                args: 1,
                canCollapse: true,
                argLabels: [""],
                defaults: ["custom"],
                argTypes: ["text"]
            });

            /**
             * Creates a macro for the block.
             * @param {number} x - The x-coordinate.
             * @param {number} y - The y-coordinate.
             * @returns {Array} - The macro generated by the block.
             */
            this.makeMacro((x, y) => [
                [0, "temperament1", x, y, [null, 1, 2, null]],
                [1, ["text", { value: "custom" }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);

            /**
             * Indicates whether the block is hidden.
             */
            this.hidden = true;
        }

        /**
         * Handles the flow of the block.
         */
        flow() {}
    }

    new ReturnBlock().setup(activity);
    new ReturnToURLBlock().setup(activity);
    new CalcBlock().setup(activity);
    new NamedCalcBlock().setup(activity);
    new NamedDoArgBlock().setup(activity);
    new NamedCalcArgBlock().setup(activity);
    new DoArgBlock().setup(activity);
    new CalcArgBlock().setup(activity);
    new ArgBlock().setup(activity);
    new NamedArgBlock().setup(activity);
    new DoBlock().setup(activity);
    new ListenBlock().setup(activity);
    new DispatchBlock().setup(activity);
    new StartDrumBlock().setup(activity);
    new StartBlock().setup(activity);
    new ActionBlock().setup(activity);
    new NamedDoBlock().setup(activity);
    new Temperament1Block().setup(activity);
}
