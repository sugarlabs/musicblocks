function setupFlowBlocks() {
    class BackwardBlock extends FlowClampBlock {
        constructor() {
            super("backward");
            this.setPalette("flow");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Backward block runs code in reverse order (Musical retrograde)."
                ),
                "documentation",
                ""
            ]);

            this.formBlock({
                name: _("backward")
            });
            this.makeMacro((x, y) => [
                [0, "backward", x, y, [null, 1, null]],
                [1, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            tur.singer.backward.push(blk);
            // Set child to bottom block inside clamp
            let childFlow = logo.blocks.findBottomBlock(args[0]);
            let childFlowCount = 1;

            let listenerName = "_backward_" + turtle + "_" + blk;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let nextBlock = logo.blocks.blockList[blk].connections[2];
            if (nextBlock === null) {
                tur.singer.backward.pop();
            } else {
                if (nextBlock in tur.endOfClampSignals) {
                    tur.endOfClampSignals[nextBlock].push(listenerName);
                } else {
                    tur.endOfClampSignals[nextBlock] = [listenerName];
                }
            }

            let __listener = event => tur.singer.backward.pop();

            logo.setTurtleListener(turtle, listenerName, __listener);
            return [childFlow, childFlowCount];
        }
    }

    class DuplicateBlock extends FlowClampBlock {
        constructor() {
            super("duplicatenotes");
            this.setPalette("flow");
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

            this.formBlock({
                name: _("duplicate"),
                args: 1,
                defaults: [2]
            });
            this.makeMacro((x, y) => [
                [0, "duplicatenotes", x, y, [null, 1, null, 2]],
                [1, ["number", { value: 2 }], 0, 0, [0]],
                [2, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk, receivedArg) {
            if (args[1] === undefined) return;

            let arg0;
            if (
                args[0] === null ||
                typeof args[0] !== "number" ||
                args[0] < 1
            ) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                arg0 = 2;
            } else {
                arg0 = args[0];
            }

            let factor = Math.floor(arg0);
            if (factor < 1) {
                logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                logo.stopTurtle = true;
            } else {
                let tur = logo.turtles.ithTurtle(turtle);

                tur.singer.duplicateFactor *= factor;

                // Queue each block in the clamp.
                let listenerName = "_duplicate_" + turtle;
                logo.setDispatchBlock(blk, turtle, listenerName);

                let __lookForOtherTurtles = function(blk, turtle) {
                    for (let t in logo.connectionStore) {
                        if (t !== turtle.toString()) {
                            for (let b in logo.connectionStore[t]) {
                                if (b === blk.toString()) {
                                    return t;
                                }
                            }
                        }
                    }

                    return null;
                };

                tur.singer.inDuplicate = true;

                let __listener = event => {
                    tur.singer.inDuplicate = false;
                    tur.singer.duplicateFactor /= factor;

                    // Check for a race condition.
                    // FIXME: Do something about the race condition.
                    if (logo.connectionStoreLock) {
                        console.debug("LOCKED");
                    }

                    logo.connectionStoreLock = true;

                    // The last turtle should restore the broken connections.
                    if (__lookForOtherTurtles(blk, turtle) === null) {
                        let n = logo.connectionStore[turtle][blk].length;
                        for (let i = 0; i < n; i++) {
                            let obj = logo.connectionStore[turtle][blk].pop();
                            logo.blocks.blockList[obj[0]].connections[obj[1]] = obj[2];
                            if (obj[2] != null) {
                                logo.blocks.blockList[obj[2]].connections[0] = obj[0];
                            }
                        }
                    } else {
                        delete logo.connectionStore[turtle][blk];
                    }

                    logo.connectionStoreLock = false;
                };

                logo.setTurtleListener(turtle, listenerName, __listener);

                // Test for race condition.
                // FIXME: Do something about the race condition.
                if (logo.connectionStoreLock) {
                    console.debug("LOCKED");
                }

                logo.connectionStoreLock = true;

                // Check to see if another turtle has already disconnected these blocks
                let otherTurtle = __lookForOtherTurtles(blk, turtle);
                if (otherTurtle != null) {
                    // Copy the connections and queue the blocks.
                    logo.connectionStore[turtle][blk] = [];
                    for (let i = logo.connectionStore[otherTurtle][blk].length; i > 0; i--) {
                        let obj = [
                            logo.connectionStore[otherTurtle][blk][i - 1][0],
                            logo.connectionStore[otherTurtle][blk][i - 1][1],
                            logo.connectionStore[otherTurtle][blk][i - 1][2]
                        ];
                        logo.connectionStore[turtle][blk].push(obj);
                        let child = obj[0];
                        if (logo.blocks.blockList[child].name === "hidden") {
                            child = logo.blocks.blockList[child].connections[0];
                        }

                        let queueBlock = new Queue(child, factor, blk, receivedArg);
                        tur.parentFlowQueue.push(blk);
                        tur.queue.push(queueBlock);
                    }
                } else {
                    let child = logo.blocks.findBottomBlock(args[1]);
                    while (child != blk) {
                        if (logo.blocks.blockList[child].name !== "hidden") {
                            let queueBlock = new Queue(child, factor, blk, receivedArg);
                            tur.parentFlowQueue.push(blk);
                            tur.queue.push(queueBlock);
                        }

                        child = logo.blocks.blockList[child].connections[0];
                    }

                    // Break the connections between blocks in the clamp so
                    // that when we run the queues, only the individual blocks
                    // run.
                    logo.connectionStore[turtle][blk] = [];
                    child = args[1];
                    while (child != null) {
                        let lastConnection =
                            logo.blocks.blockList[child].connections.length - 1;
                        let nextBlk =
                            logo.blocks.blockList[child].connections[
                                lastConnection
                            ];
                        // Don't disconnect a hidden block from its parent.
                        if (
                            nextBlk != null &&
                            logo.blocks.blockList[nextBlk].name === "hidden"
                        ) {
                            logo.connectionStore[turtle][blk].push([
                                nextBlk,
                                1,
                                logo.blocks.blockList[nextBlk].connections[1]
                            ]);
                            child =
                                logo.blocks.blockList[nextBlk].connections[1];
                            logo.blocks.blockList[
                                nextBlk
                            ].connections[1] = null;
                        } else {
                            logo.connectionStore[turtle][blk].push([
                                child,
                                lastConnection,
                                nextBlk
                            ]);
                            logo.blocks.blockList[child].connections[
                                lastConnection
                            ] = null;
                            child = nextBlk;
                        }

                        if (child != null) {
                            logo.blocks.blockList[child].connections[0] = null;
                        }
                    }
                }

                logo.connectionStoreLock = false;
            }
        }
    }

    class DefaultCaseBlock extends FlowClampBlock {
        constructor() {
            super("defaultcase");
            this.setPalette("flow");
            this.setHelpString([
                _(
                    "The Default block is used inside of a Switch to define the default action."
                ),
                "documentation",
                null,
                "switchhelp"
            ]);

            this.formBlock({
                name: _("default")
            });
        }

        flow(args, logo, turtle, blk) {
            let switchBlk = last(logo.switchBlocks[turtle]);
            if (switchBlk === null) {
                logo.errorMsg(
                    _("The Case Block must be used inside of a Switch Block."),
                    blk
                );
                logo.stopTurtle = true;
                return;
            }

            logo.switchCases[turtle][switchBlk].push(["__default__", args[0]]);
        }
    }

    class CaseBlock extends FlowClampBlock {
        constructor() {
            super("case");
            this.setPalette("flow");
            this.setHelpString([
                _(
                    "The Case block is used inside of a Switch to define matches."
                ),
                "documentation",
                null,
                "switchhelp"
            ]);

            this.formBlock({
                name: _("case"),
                args: 1,
                argTypes: ["anyin"]
            });
        }

        flow(args, logo, turtle, blk) {
            let switchBlk = last(logo.switchBlocks[turtle]);
            if (switchBlk === null) {
                logo.errorMsg(
                    _("The Case Block must be used inside of a Switch Block."),
                    blk
                );
                logo.stopTurtle = true;
                return;
            }

            logo.switchCases[turtle][switchBlk].push([args[0], args[1]]);
        }
    }

    class SwitchBlock extends FlowClampBlock {
        constructor() {
            super("switch");
            this.setPalette("flow");
            this.setHelpString([
                _("The Switch block will run the code in the matching Case."),
                "documentation",
                null,
                "switchhelp"
            ]);

            this.formBlock({
                name: _("switch"),
                args: 1,
                argTypes: ["anyin"]
            });

            this.makeMacro((x, y) => [
                [0, "switch", x, y, [null, 1, 2, 5]],
                [1, ["number", { value: 1 }], 0, 0, [0]],
                [2, "case", 0, 0, [0, 3, null, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, "defaultcase", 0, 0, [2, null, null]],
                [5, "hidden", 0, 0, [0, null]]
            ]);
        }

        flow(args, logo, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            logo.switchBlocks[turtle].push(blk);
            logo.switchCases[turtle][blk] = [];

            let listenerName = "_switch_" + blk + "_" + turtle;
            logo.setDispatchBlock(blk, turtle, listenerName);

            let __listener = function() {
                let switchBlk = last(logo.switchBlocks[turtle]);
                // Run the cases here.
                let switchCase;
                let argBlk = logo.blocks.blockList[switchBlk].connections[1];
                if (argBlk == null) {
                    switchCase = "__default__";
                } else {
                    switchCase = logo.parseArg(
                        logo,
                        turtle,
                        argBlk,
                        logo.receievedArg
                    );
                }

                let caseFlow = null;
                for (let i = 0; i < logo.switchCases[turtle][switchBlk].length; i++) {
                    if (logo.switchCases[turtle][switchBlk][i][0] === switchCase) {
                        caseFlow = logo.switchCases[turtle][switchBlk][i][1];
                        break;
                    } else if (logo.switchCases[turtle][switchBlk][i][0] === "__default__") {
                        caseFlow = logo.switchCases[turtle][switchBlk][i][1];
                    }
                }

                if (caseFlow != null) {
                    let queueBlock = new Queue(caseFlow, 1, switchBlk, null);
                    tur.parentFlowQueue.push(switchBlk);
                    tur.queue.push(queueBlock);
                }

                // Clean up afterward.
                logo.switchCases[turtle][switchBlk] = [];
                logo.switchBlocks[turtle].pop();
            };

            logo.setTurtleListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }

    class ClampBlock extends FlowClampBlock {
        constructor() {
            super("clamp");
            this.setPalette("flow");
            this.setHelpString();

            this.hidden = true;

            this.formBlock(
                {
                    name: ""
                },
                false
            );
        }

        flow(args) {
            if (args.length === 1) return [args[0], 1];
        }
    }

    class BreakBlock extends BaseBlock {
        constructor() {
            super("break");
            this.setPalette("flow");
            this.setHelpString([
                _("The Stop block will stop a loop") +
                    ": " +
                    _("Forever, Repeat, While, or Until."),
                "documentation",
                ""
            ]);
            //this.staticLabels.push(_('stop'));

            //this.adjustWidthToLabel();
            //this.basicBlockNoFlow();

            this.formBlock({
                name: _("stop"),
                flows: {
                    top: true,
                    bottom: "tail",
                    type: ""
                }
            });
        }

        flow(_, logo, turtle, blk) {
            let tur = logo.turtles.ithTurtle(turtle);

            logo.doBreak(tur);
            // Since we pop the queue, we need to unhighlight our parent
            let parentBlk = logo.blocks.blockList[blk].connections[0];
            if (parentBlk != null) {
                if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                    tur.unhighlightQueue.push(parentBlk);
                }
            }
        }
    }

    class WaitForBlock extends FlowBlock {
        constructor() {
            super("waitFor");
            this.setPalette("flow");
            this.setHelpString([
                _("The Waitfor block will wait until the condition is true."),
                "documentation",
                null,
                "waitforhelp"
            ]);

            this.formBlock({
                name: _("wait for"),
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length !== 1) return;

            let tur = logo.turtles.ithTurtle(turtle);

            if (!args[0]) {
                // Requeue.
                let parentBlk = logo.blocks.blockList[blk].connections[0];
                let queueBlock = new Queue(blk, 1, parentBlk);
                tur.parentFlowQueue.push(parentBlk);
                tur.queue.push(queueBlock);
                tur.doWait(0.05);
            } else {
                // Since a wait for block was requeued each
                // time, we need to flush the queue of all but
                // the last one, otherwise the child of the
                // while block is executed multiple times.
                let queueLength = tur.queue.length;
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

                let elapsedTime = (new Date().getTime() - this.firstNoteTime) / 1000;
                tur.singer.turtleTime = elapsedTime;
                tur.singer.previousTurtleTime = elapsedTime;
            }
        }
    }

    class UntilBlock extends FlowClampBlock {
        constructor() {
            super("until");
            this.setPalette("flow");
            this.setHelpString([
                _("The Until block will repeat until the condition is true."),
                "documentation",
                null,
                "untilhelp"
            ]);

            this.formBlock({
                name: _("until"),
                flows: {
                    labels: [this.lang === "js" ? _("do2") : _("do")]
                },
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args.length !== 2) return;

            let tur = logo.turtles.ithTurtle(turtle);

            if (!args[0]) {
                // We will add the outflow of the until block
                // each time through, so we pop it off so as
                // to not accumulate multiple copies.
                let queueLength = tur.queue.length;
                if (queueLength > 0) {
                    if (tur.queue[queueLength - 1].parentBlk === blk) {
                        tur.queue.pop();
                    }
                }
                // Requeue
                let parentBlk = logo.blocks.blockList[blk].connections[0];
                let queueBlock = new Queue(blk, 1, parentBlk);
                tur.parentFlowQueue.push(parentBlk);
                tur.queue.push(queueBlock);
            } else {
                // Since an until block was requeued each
                // time, we need to flush the queue of all but
                // the last one, otherwise the child of the
                // until block is executed multiple times.
                let queueLength = tur.queue.length;
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

    class WhileBlock extends FlowClampBlock {
        constructor() {
            super("while");
            this.setPalette("flow");
            this.setHelpString([
                _("The While block will repeat while the condition is true."),
                "documentation",
                null,
                "whilehelp"
            ]);

            this.formBlock({
                name: _("while"),
                flows: {
                    labels: [this.lang === "js" ? _("do2") : _("do")]
                },
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        flow(args, logo, turtle, blk) {
            // While is tricky because we need to recalculate
            // args[0] each time, so we requeue the While block
            // itself.
            if (args.length !== 2) return;

            let tur = logo.turtles.ithTurtle(turtle);

            if (args[0]) {
                // We will add the outflow of the while block
                // each time through, so we pop it off so as
                // to not accumulate multiple copies.
                let queueLength = tur.queue.length;
                if (queueLength > 0) {
                    if (tur.queue[queueLength - 1].parentBlk === blk) {
                        tur.queue.pop();
                    }
                }

                let parentBlk = logo.blocks.blockList[blk].connections[0];
                let queueBlock = new Queue(blk, 1, parentBlk);
                tur.parentFlowQueue.push(parentBlk);
                tur.queue.push(queueBlock);

                // and queue the interior child flow.
                return [args[1], 1];
            } else {
                // Since a while block was requeued each time,
                // we need to flush the queue of all but the
                // last one, otherwise the child of the while
                // block is executed multiple times.
                let queueLength = tur.queue.length;
                for (let i = queueLength - 1; i > 0; i--) {
                    if (tur.queue[i].parentBlk === blk) {
                        tur.queue.pop();
                    }
                }
            }
        }
    }

    class IfThenElseBlock extends FlowClampBlock {
        constructor() {
            super("ifthenelse");
            this.setPalette("flow");
            this.beginnerBlock(true);

            if (beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _(
                        "Conditionals lets your program take different actions depending on the condition."
                    ) +
                        " " +
                        _(
                            "In this example if the mouse button is pressed a snare drum will play."
                        ),
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

            this.formBlock({
                name: _("if"),
                flows: {
                    labels: [_("then"), _("else")]
                },
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        flow(args) {
            if (args.length !== 3) return;
            if (args[0]) return [args[1], 1];
            return [args[2], 1];
        }
    }

    class IfBlock extends FlowClampBlock {
        constructor() {
            super("if");
            this.setPalette("flow");
            this.beginnerBlock(true);

            if (beginnerMode && this.lang === "ja") {
                this.setHelpString([
                    _(
                        "Conditionals lets your program take different actions depending on the condition."
                    ) +
                        " " +
                        _(
                            "In this example if the mouse button is pressed a snare drum will play."
                        ),
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
                        _(
                            "In this example if the mouse button is pressed a snare drum will play."
                        ),
                    "documentation",
                    null,
                    "ifhelp"
                ]);
            }

            this.formBlock({
                name: _("if"),
                flows: {
                    labels: [_("then")]
                },
                args: 1,
                argTypes: ["booleanin"]
            });
        }

        flow(args) {
            if (args.length === 2 && args[0]) return [args[1], 1];
        }
    }

    class ForeverBlock extends FlowClampBlock {
        constructor() {
            super("forever");
            this.setPalette("flow");
            this.beginnerBlock(true);

            this.setHelpString([
                _(
                    "The Forever block will repeat the contained blocks forever."
                ) +
                    " " +
                    _(
                        "In this example of a simple drum machine a kick drum will play 1/4 notes forever."
                    ),
                "documentation",
                null,
                "foreverhelp"
            ]);

            this.formBlock({
                name: _("forever")
            });
        }

        flow(args, logo, turtle) {
            if (args.length !== 1) return;

            return [args[0], logo.turtles.ithTurtle(turtle).singer.suppressOutput ? 20 : -1];
        }
    }

    class RepeatBlock extends FlowClampBlock {
        constructor() {
            super("repeat");
            this.setPalette("flow");
            this.beginnerBlock(true);

            this.setHelpString([
                _("The Repeat block will repeat the contained blocks.") +
                    " " +
                    _("In this example the note will be played 4 times."),
                "documentation",
                null,
                "repeathelp"
            ]);

            this.formBlock({
                name: _("repeat"),
                args: 1,
                argLabels: [""],
                defaults: [4]
            });
        }

        flow(args, logo, turtle, blk) {
            if (args[1] === undefined) return;

            let arg;
            if (
                args[0] === null ||
                typeof args[0] !== "number" ||
                args[0] < 1
            ) {
                if (args[0] < 0)
                    logo.errorMsg(POSNUMBER, blk);
                return [null , 0];
            } else {
                arg = args[0];
            }

            return [args[1], Math.floor(arg)];
        }
    }

    class DuplicateFactorBlock extends ValueBlock {
        constructor() {
            //.TRANS: factor used in determining how many duplications to make
            super("duplicatefactor", _("duplicate factor"));
            this.setPalette("flow");
            this.setHelpString();
            this.hidden = true;
        }

        arg(logo, turtle, blk) {
            if (
                logo.inStatusMatrix &&
                logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]]
                    .name === "print"
            ) {
                logo.statusFields.push([blk, "duplicate"]);
            } else {
                logo.blocks.blockList[blk].value =
                    logo.turtles.ithTurtle(turtle).singer.duplicateFactor;
            }
        }
    }

    class HiddenNoFlowBlock extends FlowBlock {
        constructor() {
            super("hiddennoflow");
            this.setPalette("flow");
            this.setHelpString();
            this.dockTypes[this.dockTypes.length - 1] = "unavailable";
            this.size = 0;
            this.hidden = true;
        }

        flow() {}
    }

    class HiddenBlock extends FlowBlock {
        constructor() {
            super("hidden");
            this.setPalette("flow");
            this.setHelpString();
            this.size = 0;
            this.hidden = true;
        }

        flow() {}
    }

    new BackwardBlock().setup();
    new DuplicateBlock().setup();
    new DefaultCaseBlock().setup();
    new CaseBlock().setup();
    new SwitchBlock().setup();
    new ClampBlock().setup();
    new BreakBlock().setup();
    new WaitForBlock().setup();
    new UntilBlock().setup();
    new WhileBlock().setup();
    new IfThenElseBlock().setup();
    new IfBlock().setup();
    new ForeverBlock().setup();
    new RepeatBlock().setup();
    new DuplicateFactorBlock().setup();
    new HiddenNoFlowBlock().setup();
    new HiddenBlock().setup();
}
