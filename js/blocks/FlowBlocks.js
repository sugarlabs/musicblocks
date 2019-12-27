class BackwardBlock extends BaseBlock {
    constructor() {
        super('backward');
        this.setPalette('flow');

        this.formBlock({
            name: _('backward'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: ['']
            }
        });
    }

    flow(args, logo, turtle, blk) {
        logo.backward[turtle].push(blk);
        // Set child to bottom block inside clamp
        let childFlow = logo.blocks.findBottomBlock(args[0]);
        let childFlowCount = 1;

        var listenerName = '_backward_' + turtle + '_' + blk;
        logo._setDispatchBlock(blk, turtle, listenerName);

        var nextBlock = logo.blocks.blockList[blk].connections[2];
        if (nextBlock == null) {
            logo.backward[turtle].pop();
        } else {
            if (nextBlock in logo.endOfClampSignals[turtle]) {
                logo.endOfClampSignals[turtle][nextBlock].push(listenerName);
            } else {
                logo.endOfClampSignals[turtle][nextBlock] = [listenerName];
            }
        }

        var __listener = function () {
            logo.backward[turtle].pop();
        };

        logo._setListener(turtle, listenerName, __listener);
        return [childFlow, childFlowCount];

    }
}

class DuplicateBlock extends BaseBlock {
    constructor() {
        super('duplicatenotes');
        this.setPalette('flow');

        this.formBlock({
            name: _('duplicate'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: ['']
            },
            args: 1,
            argDefaults: [2]
        });
    }

    flow(args, logo, turtle, blk, receivedArg) {
        if (args[1] === undefined) return [];

        if (args[0] === null || typeof (args[0]) !== 'number' || args[0] < 1) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg0 = 2;
        } else {
            var arg0 = args[0];
        }

        var factor = Math.floor(arg0);
        if (factor < 1) {
            logo.errorMsg(ZERODIVIDEERRORMSG, blk);
            logo.stopTurtle = true;
        } else {
            logo.duplicateFactor[turtle] *= factor;

            // Queue each block in the clamp.
            var listenerName = '_duplicate_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __lookForOtherTurtles = function (blk, turtle) {
                for (var t in logo.connectionStore) {
                    if (t !== turtle.toString()) {
                        for (var b in logo.connectionStore[t]) {
                            if (b === blk.toString()) {
                                return t;
                            }
                        }
                    }
                }

                return null;
            }

            logo.inDuplicate[turtle] = true;

            var __listener = function (event) {
                logo.inDuplicate[turtle] = false;
                logo.duplicateFactor[turtle] /= factor;

                // Check for a race condition.
                // FIXME: Do something about the race condition.
                if (logo.connectionStoreLock) {
                    console.debug('LOCKED');
                }

                logo.connectionStoreLock = true;

                // The last turtle should restore the broken connections.
                if (__lookForOtherTurtles(blk, turtle) == null) {
                    var n = logo.connectionStore[turtle][blk].length;
                    for (var i = 0; i < n; i++) {
                        var obj = logo.connectionStore[turtle][blk].pop();
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

            logo._setListener(turtle, listenerName, __listener);

            // Test for race condition.
            // FIXME: Do something about the race condition.
            if (logo.connectionStoreLock) {
                console.debug('LOCKED');
            }

            logo.connectionStoreLock = true;

            // Check to see if another turtle has already disconnected
            // these blocks.
            var otherTurtle = __lookForOtherTurtles(blk, turtle);
            if (otherTurtle != null) {
                // Copy the connections and queue the blocks.
                logo.connectionStore[turtle][blk] = [];
                for (var i = logo.connectionStore[otherTurtle][blk].length; i > 0; i--) {
                    var obj = [logo.connectionStore[otherTurtle][blk][i - 1][0], logo.connectionStore[otherTurtle][blk][i - 1][1], logo.connectionStore[otherTurtle][blk][i - 1][2]];
                    logo.connectionStore[turtle][blk].push(obj);
                    var child = obj[0];
                    if (logo.blocks.blockList[child].name === 'hidden') {
                        child = logo.blocks.blockList[child].connections[0];
                    }

                    var queueBlock = new Queue(child, factor, blk, receivedArg);
                    logo.parentFlowQueue[turtle].push(blk);
                    logo.turtles.turtleList[turtle].queue.push(queueBlock);
                }
            } else {
                var child = logo.blocks.findBottomBlock(args[1]);
                while (child != blk) {
                    if (logo.blocks.blockList[child].name !== 'hidden') {
                        var queueBlock = new Queue(child, factor, blk, receivedArg);
                        logo.parentFlowQueue[turtle].push(blk);
                        logo.turtles.turtleList[turtle].queue.push(queueBlock);
                    }

                    child = logo.blocks.blockList[child].connections[0];
                }

                // Break the connections between blocks in the clamp so
                // that when we run the queues, only the individual blocks
                // run.
                logo.connectionStore[turtle][blk] = [];
                var child = args[1];
                while (child != null) {
                    var lastConnection = logo.blocks.blockList[child].connections.length - 1;
                    var nextBlk = logo.blocks.blockList[child].connections[lastConnection];
                    // Don't disconnect a hidden block from its parent.
                    if (nextBlk != null && logo.blocks.blockList[nextBlk].name === 'hidden') {
                        logo.connectionStore[turtle][blk].push([nextBlk, 1, logo.blocks.blockList[nextBlk].connections[1]]);
                        child = logo.blocks.blockList[nextBlk].connections[1];
                        logo.blocks.blockList[nextBlk].connections[1] = null;
                    } else {
                        logo.connectionStore[turtle][blk].push([child, lastConnection, nextBlk]);
                        logo.blocks.blockList[child].connections[lastConnection] = null;
                        child = nextBlk;
                    }

                    if (child != null) {
                        logo.blocks.blockList[child].connections[0] = null;
                    }
                }
            }

            logo.connectionStoreLock = false;
        }

        return [];
    }
}

class DefaultCaseBlock extends BaseBlock {
    constructor() {
        super('defaultcase');
        this.setPalette('flow');

        this.formBlock({
            name: _('default'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: ['']
            }
        });
    }

    flow(args, logo, turtle) {
        var switchBlk = last(logo.switchBlocks[turtle]);
        if (switchBlk === null) {
            logo.errorMsg(_('The Case Block must be used inside of a Switch Block.'), blk);
            logo.stopTurtle = true;
            return [];
        }

        logo.switchCases[turtle][switchBlk].push(['__default__', args[0]]);
        return [];
    }
}

class CaseBlock extends BaseBlock {
    constructor() {
        super('case');
        this.setPalette('flow');

        this.formBlock({
            name: _('case'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: ['']
            },
            args: 1,
            argTypes: ['anyin']
        });
    }

    flow(args, logo, turtle) {
        var switchBlk = last(logo.switchBlocks[turtle]);
        if (switchBlk === null) {
            logo.errorMsg(_('The Case Block must be used inside of a Switch Block.'), blk);
            logo.stopTurtle = true;
            return [];
        }

        logo.switchCases[turtle][switchBlk].push([args[0], args[1]]);
        return [];
    }
}

class SwitchBlock extends BaseBlock {
    constructor() {
        super('switch');
        this.setPalette('flow');
        
        this.formBlock({
            name: _('switch'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: ['']
            },
            args: 1,
            argTypes: ['anyin']
        });

        this.makeMacro((x, y) => [
            [0, 'switch', x, y, [null, 1, 2, 5]],
            [1, ['number', { 'value': 1 }], 0, 0, [0]],
            [2, 'case', 0, 0, [0, 3, null, 4]],
            [3, ['number', { 'value': 1 }], 0, 0, [2]],
            [4, 'defaultcase', 0, 0, [2, null, null]],
            [5, 'hidden', 0, 0, [0, null]]
        ])
    }

    flow(args, logo, turtle, blk) {
        logo.switchBlocks[turtle].push(blk);
        logo.switchCases[turtle][blk] = [];

        var listenerName = '_switch_' + blk + '_' + turtle;
        logo._setDispatchBlock(blk, turtle, listenerName);

        var __listener = function () {
            var switchBlk = last(logo.switchBlocks[turtle]);
            // Run the cases here.
            var argBlk = logo.blocks.blockList[switchBlk].connections[1];
            if (argBlk == null) {
                var switchCase = '__default__';
            } else {
                var switchCase = logo.parseArg(logo, turtle, argBlk, logo.receievedArg);
            }

            var caseFlow = null;
            for (var i = 0; i < logo.switchCases[turtle][switchBlk].length; i++) {
                if (logo.switchCases[turtle][switchBlk][i][0] === switchCase) {
                    caseFlow = logo.switchCases[turtle][switchBlk][i][1];
                    break;
                } else if (logo.switchCases[turtle][switchBlk][i][0] === '__default__') {
                    caseFlow = logo.switchCases[turtle][switchBlk][i][1];
                }
            }

            if (caseFlow != null) {
                var queueBlock = new Queue(caseFlow, 1, switchBlk, null);
                logo.parentFlowQueue[turtle].push(switchBlk);
                logo.turtles.turtleList[turtle].queue.push(queueBlock);
            }

            // Clean up afterward.
            logo.switchCases[turtle][switchBlk] = [];
            logo.switchBlocks[turtle].pop();
        };

        logo._setListener(turtle, listenerName, __listener);

        return [args[1], 1];
    }
}

class ClampBlock extends BaseBlock {
    constructor() {
        super('clamp');
        this.setPalette('flow');

        this.hidden = true;

        this.formBlock({
            name: '',
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: ['']
            }
        }, false);
    }

    flow(args) {
        if (args.length === 1)
            return [args[0], 1];
        return [];
    }
}

class BreakBlock extends BaseBlock {
    constructor() {
        super('break');
        this.setPalette('flow');
        //this.staticLabels.push(_('stop'));

        //this.adjustWidthToLabel();
        //this.basicBlockNoFlow();

        this.formBlock({
            name: _('stop'),
            flows: {
                top: true, bottom: 'tail',
                type: ''
            }
        });
    }

    flow(_, logo, turtle, blk) {
        logo._doBreak(turtle);
        // Since we pop the queue, we need to unhighlight our
        // parent.
        var parentBlk = logo.blocks.blockList[blk].connections[0];
        if (parentBlk != null) {
            if (!logo.suppressOutput[turtle] && logo.justCounting[turtle].length === 0) {
                logo.unhighlightQueue[turtle].push(parentBlk);
            }
        }

        return [];
    }
}

class WaitForBlock extends BaseBlock {
    constructor() {
        super('waitFor');
        this.setPalette('flow');

        this.formBlock({
            name: _('wait for'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: ['']
            },
            args: 'onebool',
        });
    }

    flow(args, logo, turtle, blk) {
        if (args.length !== 1) return [];

        if (!args[0]) {
            // Requeue.
            var parentBlk = logo.blocks.blockList[blk].connections[0];
            var queueBlock = new Queue(blk, 1, parentBlk);
            logo.parentFlowQueue[turtle].push(parentBlk);
            logo.turtles.turtleList[turtle].queue.push(queueBlock);
            logo._doWait(0.05);
        } else {
            // Since a wait for block was requeued each
            // time, we need to flush the queue of all but
            // the last one, otherwise the child of the
            // while block is executed multiple times.
            var queueLength = logo.turtles.turtleList[turtle].queue.length;
            var kept_one = false;
            for (var i = queueLength - 1; i > 0; i--) {
                if (logo.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                    if (kept_one) {
                        logo.turtles.turtleList[turtle].queue.pop();
                    } else {
                        kept_one = true;
                    }
                }
            }

            // We need to reset the turtle time.
            if (logo.firstNoteTime == null) {
                var d = new Date();
                logo.firstNoteTime = d.getTime();
            }

            var d = new Date();
            var elapsedTime = (d.getTime() - this.firstNoteTime) / 1000;
            logo.turtleTime[turtle] = elapsedTime;
            logo.previousTurtleTime[turtle] = elapsedTime;
        }

        return [];
    }
}

class UntilBlock extends BaseBlock {
    constructor() {
        super('until');
        this.setPalette('flow');

        let language = localStorage.languagePreference || navigator.language;

        this.formBlock({
            name: _('until'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: [language === 'js' ? _('do2') : _('do')]
            },
            args: 'onebool',
        });
    }

    flow(args, logo, turtle, blk) {
        if (args.length !== 2) return [];

        if (!args[0]) {
            // We will add the outflow of the until block
            // each time through, so we pop it off so as
            // to not accumulate multiple copies.
            var queueLength = logo.turtles.turtleList[turtle].queue.length;
            if (queueLength > 0) {
                if (logo.turtles.turtleList[turtle].queue[queueLength - 1].parentBlk === blk) {
                    logo.turtles.turtleList[turtle].queue.pop();
                }
            }
            // Requeue.
            var parentBlk = logo.blocks.blockList[blk].connections[0];
            var queueBlock = new Queue(blk, 1, parentBlk);
            logo.parentFlowQueue[turtle].push(parentBlk);
            logo.turtles.turtleList[turtle].queue.push(queueBlock);
        } else {
            // Since an until block was requeued each
            // time, we need to flush the queue of all but
            // the last one, otherwise the child of the
            // until block is executed multiple times.
            var queueLength = logo.turtles.turtleList[turtle].queue.length;
            for (var i = queueLength - 1; i > 0; i--) {
                if (logo.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                    logo.turtles.turtleList[turtle].queue.pop();
                }
            }
        }

        // Queue the child flow.
        return [args[1], 1];
    }
}

class WhileBlock extends BaseBlock {
    constructor() {
        super('while');
        this.setPalette('flow');

        let language = localStorage.languagePreference || navigator.language;

        this.formBlock({
            name: _('while'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: [language === 'js' ? _('do2') : _('do')]
            },
            args: 'onebool',
        });
    }

    flow(args, logo, turtle, blk) {
        // While is tricky because we need to recalculate
        // args[0] each time, so we requeue the While block
        // itself.
        if (args.length !== 2) return [];

        if (args[0]) {
            // We will add the outflow of the while block
            // each time through, so we pop it off so as
            // to not accumulate multiple copies.
            var queueLength = logo.turtles.turtleList[turtle].queue.length;
            if (queueLength > 0) {
                if (logo.turtles.turtleList[turtle].queue[queueLength - 1].parentBlk === blk) {
                    logo.turtles.turtleList[turtle].queue.pop();
                }
            }

            var parentBlk = logo.blocks.blockList[blk].connections[0];
            var queueBlock = new Queue(blk, 1, parentBlk);
            logo.parentFlowQueue[turtle].push(parentBlk);
            logo.turtles.turtleList[turtle].queue.push(queueBlock);

            // and queue the interior child flow.
            return [args[1], 1];
        } else {
            // Since a while block was requeued each time,
            // we need to flush the queue of all but the
            // last one, otherwise the child of the while
            // block is executed multiple times.
            var queueLength = logo.turtles.turtleList[turtle].queue.length;
            for (var i = queueLength - 1; i > 0; i--) {
                if (logo.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                    // if (logo.turtles.turtleList[turtle].queue[i].blk === blk) {
                    logo.turtles.turtleList[turtle].queue.pop();
                }
            }
        }
    }
}

class IfThenElseBlock extends BaseBlock {
    constructor() {
        super('ifthenelse');
        this.setPalette('flow');

        this.formBlock({
            name: _('if'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: [_('then'), _('else')]
            },
            args: 'onebool',
        });
    }

    flow(args) {
        if (args.length !== 3) return [];
        if (args[0])
            return [args[1], 1];
        return [args[2], 1];
    }
}

class IfBlock extends BaseBlock {
    constructor() {
        super('iff');
        this.setPalette('flow');

        this.formBlock({
            name: _('if'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: [_('then')]
            },
            args: 'onebool',
        });
    }

    flow(args) {
        if (args.length !== 2) return [];
        if (args[0])
            return [args[1], 1];
        return [];
    }
}

class ForeverBlock extends BaseBlock {
    constructor() {
        super('forever');
        this.setPalette('flow');

        this.formBlock({
            name: _('forever'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: ['']
            }
        });
    }

    flow(args, logo, turtle) {
        if (args.length !== 1) return [];

        return [args[0], logo.suppressOutput[turtle] ? 20 : -1];
    }
}

class RepeatBlock extends BaseBlock {
    constructor() {
        super('repeat');
        this.setPalette('flow');

        this.formBlock({
            name: _('repeat'),
            flows: {
                top: true, bottom: true,
                type: 'flow', labels: ['']
            },
            args: 1,
            argLabels: [''],
            argDefaults: [4]
        });
    }

    flow(args, logo) {
        if (args[1] === undefined) return [];

        let arg;
        if (args[0] === null || typeof (args[0]) !== 'number' || args[0] < 1) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            arg = 1;
        } else {
            arg = args[0];
        }

        return [args[1], Math.floor(arg)];
    }
}


function setupFlowBlocks() {
    new BackwardBlock();
    new DuplicateBlock();
    new DefaultCaseBlock();
    new CaseBlock();
    new SwitchBlock();
    new ClampBlock();
    new BreakBlock();
    new WaitForBlock();
    new UntilBlock();
    new WhileBlock();
    new IfThenElseBlock();
    new IfBlock();
    new ForeverBlock();
    new RepeatBlock();
}
