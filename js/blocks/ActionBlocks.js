function setupActionBlocks() {
    class ReturnBlock extends FlowBlock {
        constructor() {
            super("return");
            this.setPalette("action");
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
            this.setPalette("action");
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
            var URL = window.location.href;
            var urlParts;
            var outurl;
            if (URL.indexOf("?") > 0) {
                var urlParts = URL.split("?");
                if (urlParts[1].indexOf("&") > 0) {
                    var newUrlParts = urlParts[1].split("&");
                    for (var i = 0; i < newUrlParts.length; i++) {
                        if (newUrlParts[i].indexOf("=") > 0) {
                            var tempargs = newUrlParts[i].split("=");
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
                var jsonRet = {};
                jsonRet["result"] = args[0];
                var json = JSON.stringify(jsonRet);
                var xmlHttp = new XMLHttpRequest();
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
            this.setPalette("action");
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
            var actionArgs = [];
            var cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                actionArgs = receivedArg;
                // logo.getBlockAtStartOfArg(blk);
                if (name in logo.actions) {
                    logo.turtles.turtleList[turtle].running = true;
                    logo._runFromBlockNow(
                        logo,
                        turtle,
                        logo.actions[name],
                        true,
                        actionArgs,
                        logo.turtles.turtleList[turtle].queue.length
                    );
                    return logo.returns[turtle].shift();
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, name);
                    return 0;
                }
            }
        }
    }

    class NamedCalcBlock extends ValueBlock {
        constructor() {
            super("namedcalc");
            this.setPalette("action");
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
            var name = logo.blocks.blockList[blk].privateData;
            var actionArgs = [];

            actionArgs = receivedArg;
            // logo.getBlockAtStartOfArg(blk);
            if (name in logo.actions) {
                logo.turtles.turtleList[turtle].running = true;
                logo._runFromBlockNow(
                    logo,
                    turtle,
                    logo.actions[name],
                    true,
                    actionArgs,
                    logo.turtles.turtleList[turtle].queue.length
                );
                return logo.returns[turtle].shift();
            } else {
                logo.errorMsg(NOACTIONERRORMSG, blk, name);
                return 0;
            }
        }
    }

    class NamedDoArgBlock extends FlowClampBlock {
        constructor() {
            super("nameddoArg");
            this.setPalette("action");
            this.setHelpString([
                _("The Do block is used to initiate an action."),
                "documentation",
                ""
            ]);

            //.TRANS: do1 is do (take) an action (JAPANESE ONLY)
            //.TRANS: take (do) some action
            this.formBlock({
                name: this.lang === "ja" ? _("do1") : _("do"),
                flows: {
                    type: "arg",
                    types: ["anyin"]
                }
            });
        }

        flow(args, logo, turtle, blk, receivedArg, actionArgs) {
            var name = logo.blocks.blockList[blk].privateData;
            while (actionArgs.length > 0) {
                actionArgs.pop();
            }

            if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                for (
                    var i = 0;
                    i < logo.blocks.blockList[blk].argClampSlots.length;
                    i++
                ) {
                    if (logo.blocks.blockList[blk].connections[i + 1] != null) {
                        var t = logo.parseArg(
                            logo,
                            turtle,
                            logo.blocks.blockList[blk].connections[i + 1],
                            blk,
                            receivedArg
                        );
                        actionArgs.push(t);
                    } else {
                        actionArgs.push(null);
                    }
                }
            }

            if (name in logo.actions) {
                if (logo.justCounting[turtle].length === 0) {
                    logo.notationLineBreak(turtle);
                }

                let childFlow;
                if (logo.backward[turtle].length > 0) {
                    childFlow = logo.blocks.findBottomBlock(logo.actions[name]);
                    var actionBlk = logo.blocks.findTopBlock(
                        logo.actions[name]
                    );
                    logo.backward[turtle].push(actionBlk);

                    var listenerName = "_backward_action_" + turtle + "_" + blk;
                    logo._setDispatchBlock(blk, turtle, listenerName);

                    var nextBlock =
                        logo.blocks.blockList[actionBlk].connections[2];
                    if (nextBlock == null) {
                        logo.backward[turtle].pop();
                    } else {
                        if (nextBlock in logo.endOfClampSignals[turtle]) {
                            logo.endOfClampSignals[turtle][nextBlock].push(
                                listenerName
                            );
                        } else {
                            logo.endOfClampSignals[turtle][nextBlock] = [
                                listenerName
                            ];
                        }
                    }

                    var __listener = function(event) {
                        logo.backward[turtle].pop();
                    };

                    logo._setListener(turtle, listenerName, __listener);
                } else {
                    childFlow = logo.actions[name];
                }

                return [childFlow, 1];
            } else {
                logo.errorMsg(NOACTIONERRORMSG, blk, name);
            }
        }
    }

    class NamedCalcArgBlock extends LeftBlock {
        constructor() {
            super("namedcalcArg");
            this.setPalette("action");
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
            var name = logo.blocks.blockList[blk].privateData;
            var actionArgs = [];
            // logo.getBlockAtStartOfArg(blk);
            if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                for (
                    var i = 0;
                    i < logo.blocks.blockList[blk].argClampSlots.length;
                    i++
                ) {
                    var t = logo.parseArg(
                        logo,
                        turtle,
                        logo.blocks.blockList[blk].connections[i + 1],
                        blk,
                        receivedArg
                    );
                    actionArgs.push(t);
                }
            }
            if (name in logo.actions) {
                // Just run the stack.
                logo.turtles.turtleList[turtle].running = true;
                logo._runFromBlockNow(
                    logo,
                    turtle,
                    logo.actions[name],
                    true,
                    actionArgs,
                    logo.turtles.turtleList[turtle].queue.length
                );
                return logo.returns[turtle].pop();
            } else {
                logo.errorMsg(NOACTIONERRORMSG, blk, name);
                return 0;
            }
        }
    }

    class DoArgBlock extends FlowClampBlock {
        constructor() {
            super("doArg");
            this.setPalette("action");
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

            if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                for (
                    var i = 0;
                    i < logo.blocks.blockList[blk].argClampSlots.length;
                    i++
                ) {
                    if (logo.blocks.blockList[blk].connections[i + 2] != null) {
                        var t = logo.parseArg(
                            logo,
                            turtle,
                            logo.blocks.blockList[blk].connections[i + 2],
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
                    if (logo.justCounting[turtle].length === 0) {
                        logo.notationLineBreak(turtle);
                    }
                    return [logo.actions[args[0]], 1];
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, args[0]);
                }
            }
        }
    }

    class CalcArgBlock extends LeftBlock {
        constructor() {
            super("calcArg");
            this.setPalette("action");
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
            var actionArgs = [];
            // logo.getBlockAtStartOfArg(blk);
            if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                for (
                    var i = 0;
                    i < logo.blocks.blockList[blk].argClampSlots.length;
                    i++
                ) {
                    var t = logo.parseArg(
                        logo,
                        turtle,
                        logo.blocks.blockList[blk].connections[i + 2],
                        blk,
                        receivedArg
                    );
                    actionArgs.push(t);
                }
            }
            var cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (name in logo.actions) {
                    logo.turtles.turtleList[turtle].running = true;
                    logo._runFromBlockNow(
                        logo,
                        turtle,
                        logo.actions[name],
                        true,
                        actionArgs,
                        logo.turtles.turtleList[turtle].queue.length
                    );
                    return logo.returns[turtle].pop();
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, name);
                    return 0;
                }
            }
        }
    }

    class ArgBlock extends LeftBlock {
        constructor() {
            super("arg");
            this.setPalette("action");
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
            var cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            } else {
                var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                var action_args = receivedArg;
                if (action_args && action_args.length >= Number(name)) {
                    var value = action_args[Number(name) - 1];
                    return value;
                } else {
                    logo.errorMsg(_("Invalid argument"), blk);
                    return 0;
                }
            }

            // return [0, 0, logo.blocks.blockList[blk].value];
        }
    }

    class NamedArgBlock extends LeftBlock {
        constructor() {
            super("namedarg");
            this.setPalette("action");
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
            var name = logo.blocks.blockList[blk].privateData;
            var actionArgs = receivedArg;

            // If an action block with an arg is clicked,
            // the arg will have no value.
            if (actionArgs == null) {
                logo.errorMsg(_("Invalid argument"), blk);
                return 0;
            }

            if (actionArgs.length >= Number(name)) {
                var value = actionArgs[Number(name) - 1];
                return value;
            } else {
                logo.errorMsg(_("Invalid argument"), blk);
                return 0;
            }

            return logo.blocks.blockList[blk].value;
        }
    }

    class DoBlock extends FlowBlock {
        constructor() {
            super("do");
            this.setPalette("action");
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
                if (logo.justCounting[turtle].length === 0) {
                    logo.notationLineBreak(turtle);
                }

                return [logo.actions[args[0]], 1];
            }

            console.debug("action " + args[0] + " not found");
            logo.errorMsg(NOACTIONERRORMSG, blk, args[0]);
        }
    }

    class ListenBlock extends FlowBlock {
        constructor() {
            super("listen");
            this.setPalette("action");
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
                logo.errorMsg(NOACTIONERRORMSG, blk, args[1]);
            } else {
                var __listener = function(event) {
                    if (logo.turtles.turtleList[turtle].running) {
                        var queueBlock = new Queue(
                            logo.actions[args[1]],
                            1,
                            blk
                        );
                        logo.parentFlowQueue[turtle].push(blk);
                        logo.turtles.turtleList[turtle].queue.push(queueBlock);
                    } else {
                        // Since the turtle has stopped
                        // running, we must run the stack
                        // from here.
                        logo._runFromBlockNow(
                            logo,
                            turtle,
                            logo.actions[args[1]],
                            false,
                            receivedArg
                        );
                    }
                };

                // If there is already a listener, remove it
                // before adding the new one.
                logo._setListener(turtle, args[0], __listener);
            }
        }
    }

    class DispatchBlock extends FlowBlock {
        constructor() {
            super("dispatch");
            this.setPalette("action");
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
                argTypes: ["textin"]
            });
        }

        flow(args, logo) {
            // Dispatch an event.
            if (args.length !== 1) return;

            // If the event is not in the event list, add it.
            if (!(args[0] in logo.eventList)) {
                var event = new Event(args[0]);
                logo.eventList[args[0]] = event;
            }
            logo.stage.dispatchEvent(args[0]);
        }
    }

    class StartBlock extends StackClampBlock {
        constructor() {
            super("start");
            this.setPalette("action");
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
            this.setPalette("action");
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
                defaults: [_("action")]
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
                if (logo.justCounting[turtle].length === 0) {
                    logo.notationLineBreak(turtle);
                }

                return [logo.actions[args[0]], 1];
            }

            console.debug("action " + args[0] + " not found");
            logo.errorMsg(NOACTIONERRORMSG, blk, args[0]);
        }
    }

    class NamedDoBlock extends FlowBlock {
        constructor() {
            super("nameddo");
            this.setPalette("action");
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
            var name = logo.blocks.blockList[blk].privateData;
            if (!(name in logo.actions)) {
                logo.errorMsg(NOACTIONERRORMSG, blk, name);
            }
            if (logo.justCounting[turtle].length === 0) {
                logo.notationLineBreak(turtle);
            }

            let childFlow;
            if (logo.backward[turtle].length > 0) {
                childFlow = logo.blocks.findBottomBlock(logo.actions[name]);
                var actionBlk = logo.blocks.findTopBlock(logo.actions[name]);
                logo.backward[turtle].push(actionBlk);

                var listenerName = "_backward_action_" + turtle + "_" + blk;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var nextBlock = logo.blocks.blockList[actionBlk].connections[2];
                if (nextBlock == null) {
                    logo.backward[turtle].pop();
                } else {
                    if (nextBlock in logo.endOfClampSignals[turtle]) {
                        logo.endOfClampSignals[turtle][nextBlock].push(
                            listenerName
                        );
                    } else {
                        logo.endOfClampSignals[turtle][nextBlock] = [
                            listenerName
                        ];
                    }
                }

                var __listener = function(event) {
                    logo.backward[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                childFlow = logo.actions[name];
            }

            return [childFlow, 1];
        }
    }

    class Temperament1Block extends StackClampBlock {
        constructor() {
            super("temperament1");
            this.setPalette("action");
            this.setHelpString();

            this.formBlock({
                name: _("define temperament"),
                args: 1
            });
            this.hidden = true;
        }

        flow() {}
    }

    new ReturnBlock().setup();
    new ReturnToURLBlock().setup();
    new CalcBlock().setup();
    new NamedCalcBlock().setup();
    new NamedDoArgBlock().setup();
    new NamedCalcArgBlock().setup();
    new DoArgBlock().setup();
    new CalcArgBlock().setup();
    new ArgBlock().setup();
    new NamedArgBlock().setup();
    new DoBlock().setup();
    new ListenBlock().setup();
    new DispatchBlock().setup();
    new StartDrumBlock().setup();
    new StartBlock().setup();
    new ActionBlock().setup();
    new NamedDoBlock().setup();
}
