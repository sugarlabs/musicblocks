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

function setupActionBlocks(activity) {
    class ReturnBlock extends FlowBlock {
        constructor() {
            super("return");
            this.setPalette("action", activity);
            this.setHelpString([
                _("The Return block will return a value from an action."),
                "documentation",
                ""
            ]);
            this.formBlock({
                name: _("return"),
                args: 1,
                defaults: [100],
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle) {
            if (args.length === 1) {
                logo.returns[turtle].push(args[0]);
            }
        }
    }

    class ReturnToURLBlock extends FlowBlock {
        constructor() {
            super("returnToUrl");
            this.setPalette("action", activity);
            this.setHelpString([
                _("The Return to URL block will return a value to a webpage."),
                "documentation",
                ""
            ]);

            //.TRANS: return value from a function to a URL
            this.formBlock({
                name: _("return to URL"),
                args: 1,
                defaults: [100],
                argTypes: ["anyin"]
            });
        }

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
                xmlHttp.onreadystatechange = function() {
                    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                        alert(xmlHttp.responseText);
                    }
                };

                xmlHttp.send(json);
            }
        }
    }

    class CalcBlock extends LeftBlock {
        constructor() {
            super("calc");
            this.setPalette("action", activity);
            this.setHelpString([
                _(
                    "The Calculate block returns a value calculated by an action."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("calculate"),
                outType: "anyout",
                args: 1,
                defaults: [_("action")],
                argTypes: ["anyin"]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            let actionArgs = [];
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                const name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                actionArgs = receivedArg;
                // logo.getBlockAtStartOfArg(blk);
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
    }

    class NamedCalcBlock extends ValueBlock {
        constructor() {
            super("namedcalc");
            this.setPalette("action", activity);
            this.setHelpString([
                _(
                    "The Calculate block returns a value calculated by an action."
                ),
                "documentation",
                ""
            ]);

            this.extraWidth = 20;
            this.formBlock({
                name: _("action")
            });
        }

        flow(args, logo, turtle, blk, receivedArg) {
            const name = activity.blocks.blockList[blk].privateData;
            let actionArgs = [];

            actionArgs = receivedArg;
            // logo.getBlockAtStartOfArg(blk);
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

    class NamedDoArgBlock extends FlowClampBlock {
        constructor() {
            super("nameddoArg");
            this.setPalette("action", activity);
            this.setHelpString([
                _("The Do block is used to initiate an action."),
                "documentation",
                ""
            ]);

            //.TRANS: translate do1 the same as do (take an action) (JAPANESE ONLY)
            this.formBlock({
                name: this.lang === "ja" ? _("do1") : _("do"),
                flows: {
                    type: "arg",
                    types: ["anyin"]
                }
            });
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs) {
            const name = activity.blocks.blockList[blk].privateData;
            while (actionArgs.length > 0) {
                actionArgs.pop();
            }

            if (activity.blocks.blockList[blk].argClampSlots.length > 0) {
                for (
                    let i = 0;
                    i < activity.blocks.blockList[blk].argClampSlots.length;
                    i++
                ) {
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
                    const __listener = event => tur.singer.backward.pop();

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

    class NamedCalcArgBlock extends LeftBlock {
        constructor() {
            super("namedcalcArg");
            this.setPalette("action", activity);
            this.setHelpString([
                _(
                    "The Calculate block returns a value calculated by an action."
                ),
                "documentation",
                ""
            ]);

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

        arg(logo, turtle, blk, receivedArg) {
            const name = activity.blocks.blockList[blk].privateData;
            const actionArgs = [];
            // logo.getBlockAtStartOfArg(blk);
            if (activity.blocks.blockList[blk].argClampSlots.length > 0) {
                for (
                    let i = 0;
                    i < activity.blocks.blockList[blk].argClampSlots.length;
                    i++
                ) {
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

    class DoArgBlock extends FlowClampBlock {
        constructor() {
            super("doArg");
            this.setPalette("action", activity);
            this.setHelpString([
                _("The Do block is used to initiate an action."),
                "documentation",
                ""
            ]);

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

        flow(args, logo, turtle, blk, receivedArg, actionArgs) {
            while (actionArgs.length > 0) {
                actionArgs.pop();
            }

            if (activity.blocks.blockList[blk].argClampSlots.length > 0) {
                for (
                    let i = 0;
                    i < activity.blocks.blockList[blk].argClampSlots.length;
                    i++
                ) {
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

    class CalcArgBlock extends LeftBlock {
        constructor() {
            super("calcArg");
            this.setPalette("action", activity);
            this.setHelpString([
                _(
                    "The Calculate block returns a value calculated by an action."
                ),
                "documentation",
                ""
            ]);

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

        arg(logo, turtle, blk, receivedArg) {
            const actionArgs = [];
            // logo.getBlockAtStartOfArg(blk);
            if (activity.blocks.blockList[blk].argClampSlots.length > 0) {
                for (
                    let i = 0;
                    i < activity.blocks.blockList[blk].argClampSlots.length;
                    i++
                ) {
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

    class ArgBlock extends LeftBlock {
        constructor() {
            super("arg");
            this.setPalette("action", activity);
            this.setHelpString([
                _(
                    "The Arg block contains the value of an argument passed to an action."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("arg"),
                outType: "anyout",
                args: 1,
                defaults: [1],
                argTypes: ["numberin"]
            });
        }

        arg(logo, turtle, blk, receivedArg) {
            const cblk = activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                const name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                const action_args = receivedArg;
                if (action_args && action_args.length >= Number(name)) {
                    const value = action_args[Number(name) - 1];
                    return value;
                } else {
                    activity.errorMsg(_("Invalid argument"), blk);
                    return 0;
                }
            }

            // return [0, 0, activity.blocks.blockList[blk].value];
        }
    }

    class NamedArgBlock extends LeftBlock {
        constructor() {
            super("namedarg");
            this.setPalette("action", activity);
            this.setHelpString([
                _(
                    "The Arg block contains the value of an argument passed to an action."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("arg") + 1,
                flows: {
                    type: "value"
                }
            });
        }

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
            // return activity.blocks.blockList[blk].value;
        }
    }

    class DoBlock extends FlowBlock {
        constructor() {
            //.TRANS: do is the do something or take an action.
            super("do");
            this.setPalette("action", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Do block is used to initiate an action.") +
                    " " +
                    _(
                        "In the example, it is used with the One of block to choose a random phase."
                    ),
                "documentation",
                null,
                "dohelp"
            ]);

            this.formBlock({
                name: this.lang === "ja" ? _("do1") : _("do"),
                args: 1,
                defaults: [_("action")],
                argTypes: ["anyin"]
            });
        }

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

    class ListenBlock extends FlowBlock {
        constructor() {
            super("listen");
            this.setPalette("action", activity);
            this.beginnerBlock(true);

            if (this.lang === "ja") {
                this.extraWidth = 15;
                this.setHelpString([
                    _(
                        "The Listen block is used to listen for an event such as a mouse click."
                    ),
                    "documentation",
                    null,
                    "broadcasthelp"
                ]);
            } else {
                this.setHelpString([
                    _(
                        "The Listen block is used to listen for an event such as a mouse click."
                    ) +
                        " " +
                        _("When the event happens, an action is taken."),
                    "documentation",
                    null,
                    "broadcasthelp"
                ]);
            }

            this.formBlock({
                //.TRANS: an event, such as user actions (mouse clicks, key presses)
                name: _("on"),
                args: 2,
                argTypes: ["anyin", "anyin"],
                //.TRANS: do1 is do (take) an action (JAPANESE ONLY)
                argLabels: [
                    _("event"),
                    this.lang === "ja" ? _("do1") : _("do")
                ],
                defaults: [_("event"), _("action")]
            });
        }

        flow(args, logo, turtle, blk, receivedArg) {
            if (args.length !== 2) return;

            if (!(args[1] in logo.actions)) {
                activity.errorMsg(NOACTIONERRORMSG, blk, args[1]);
            } else {
                const tur = activity.turtles.ithTurtle(turtle);

                // eslint-disable-next-line no-unused-vars
                const __listener = event => {
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
                        const elapsedTime = (new Date().getTime() - activity.logo.firstNoteTime) / 1000;
                        tur.singer.turtleTime = elapsedTime;

                        logo.runFromBlockNow(
                            logo, turtle, logo.actions[args[1]], false, receivedArg
                        );
                    }
                };

                // If there is already a listener, remove it before adding the new one
                logo.setTurtleListener(turtle, args[0], __listener);
            }
        }
    }

    class DispatchBlock extends FlowBlock {
        constructor() {
            super("dispatch");
            this.setPalette("action", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Broadcast block is used to trigger an event."),
                "documentation",
                null,
                "broadcasthelp"
            ]);

            //.TRANS: dispatch an event to trigger a listener
            this.formBlock({
                name: _("broadcast"),
                args: 1,
                defaults: [_("event")],
                argTypes: ["anyin"]
            });
        }

        flow(args, logo) {
            // Dispatch an event.
            if (args.length !== 1) return;

            // If the event is not in the event list, add it.
            if (!(args[0] in logo.eventList)) {
                const event = new Event(args[0]);
                logo.eventList[args[0]] = event;
            }
            activity.stage.dispatchEvent(args[0]);
        }
    }

    class StartBlock extends StackClampBlock {
        constructor() {
            super("start");
            this.setPalette("action", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _("Each Start block is a separate voice.") +
                    " " +
                    _(
                        "All of the Start blocks run at the same time when the Play button is pressed."
                    ),
                "documentation",
                ""
            ]);

            this.formBlock({ name: _("start"), canCollapse: true });
        }

        flow(args) {
            if (args.length === 1) return [args[0], 1];
        }
    }

    class StartDrumBlock extends StartBlock {
        constructor() {
            super();
            this.changeName("startdrum");

            this.formBlock({ name: _("start drum") });

            this.makeMacro((x, y) => [
                [0, "start", x, y, [null, 1, null]],
                [1, "setdrum", 0, 0, [0, 2, null, 3]],
                [2, ["drumname", { value: "kick drum" }], 0, 0, [1]],
                [3, "hidden", 0, 0, [1, null]]
            ]);
        }
    }

    class ActionBlock extends StackClampBlock {
        constructor() {
            super("action");
            this.setPalette("action", activity);
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Action block is used to group together blocks so that they can be used more than once."
                ) +
                    " " +
                    _(
                        "It is often used for storing a phrase of music that is repeated."
                    ),
                "documentation",
                null,
                "actionhelp"
            ]);

            this.formBlock({
                canCollapse: true,
                name: _("action"),
                args: 1,
                argLabels: [""],
                defaults: [_("action")],
                argTypes: ["anyin"]
            });
            this.makeMacro((x, y) => [
                [0, "action", x, y, [null, 1, 2, null]],
                [1, ["text", { value: _("action") }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

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

    class NamedDoBlock extends FlowBlock {
        constructor() {
            super("nameddo");
            this.setPalette("action", activity);
            this.setHelpString([
                _("The Do block is used to initiate an action."),
                "documentation",
                ""
            ]);

            this.extraWidth = 30;
            this.formBlock({ name: _("action") });
            this.hidden = true;
        }

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
                const __listener = event => tur.singer.backward.pop();

                logo.setTurtleListener(turtle, listenerName, __listener);
            } else {
                childFlow = logo.actions[name];
            }

            return [childFlow, 1];
        }
    }

    class Temperament1Block extends StackClampBlock {
        constructor() {
            super("temperament1");
            this.setPalette("action", activity);
            this.setHelpString();

            this.formBlock({
                name: _("define temperament"),
                args: 1,
                canCollapse: true,
                argLabels: [""],
                defaults: ["custom"],
                argTypes: ["text"]
            });
            this.makeMacro((x, y) => [
                [0, "temperament1", x, y, [null, 1, 2, null]],
                [1, ["text", { value: "custom" }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
            this.hidden = true;
        }

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
