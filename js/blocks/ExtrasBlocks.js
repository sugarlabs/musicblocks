class OpenPaletteBlock extends FlowBlock {
    constructor() {
        super('openpalette');
        this.setPalette('extras');

        this.formBlock({
            name: _('open palette'),
            args: 1, argTypes: ['textin'],
            defaults: [_('rhythm')]
        });
    }

    flow(args, logo, turtle, blk) {
        if (args.length < 1) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        for (var p in logo.blocks.palettes.dict) {
            if (_(logo.blocks.palettes.dict[p].name) === args[0].toLowerCase()) {
                logo.blocks.palettes.hide();
                logo.blocks.palettes.dict[p].show();
                logo.blocks.palettes.show();
                return;
            }
        }
    }
}

class DeleteBlockBlock extends FlowBlock {
    constructor() {
        super('deleteblock');
        this.setPalette('extras');

        this.formBlock({
            //.TRANS: Move this block to the trash.
            name: _('delete block'),
            args: 1,
        });
    }

    flow(args, logo, turtle, blk) {
        if (args.length < 1) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            logo.stopTurtle = true;
            return;
        }

        if (args[0] < 0 || args[0] > logo.blocks.blockList.length - 1) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        // Is the block already in the trash?
        if (logo.blocks.blockList[args[0]].trash) {
            return;
        }

        // Disconnect the block.
        var c = logo.blocks.blockList[args[0]].connections[0];
        logo.blocks.blockList[args[0]].connections[0] = null;
        if (c !== null) {
            for (var i = 0; i < logo.blocks.blockList[c].connections.length; i++) {
                if (logo.blocks.blockList[c].connections[i] === args[0]) {
                    logo.blocks.blockList[c].connections[i] = null;
                }
            }
        }

        // Send it to the trash.
        logo.blocks.sendStackToTrash(logo.blocks.blockList[args[0]]);

        // And adjust the docs of the former connection
        logo.blocks.adjustDocks(c, true);
    }
}

class MoveBlockBlock extends FlowBlock {
    constructor() {
        super('moveblock');
        this.setPalette('extras');

        this.formBlock({
            //.TRANS: Move the position of a block on the screen.
            name: _('move block'), args: 3,
            argLabels: [_('block number'), _('x'), _('y')]
        })
    }

    flow(args, logo, turtle, blk) {
        if (args.length < 3) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        if (args[0] < 0 || args[0] > logo.blocks.blockList.length - 1) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        var x = logo.turtles.turtleX2screenX(args[1]);
        var y = logo.turtles.turtleY2screenY(args[2]);
        logo.blocks.moveBlock(args[0], x, y);
    }
}

class RunBlockBlock extends FlowBlock {
    constructor() {
        super('runblock');
        this.setPalette('extras');

        this.formBlock({
            //.TRANS: Run program beginning at this block.
            name: _('run block'), args: 1,
            argTypes: ['anyin'], defaults: [0]
        })
    }

    flow(args, logo, turtle, blk, receivedArg) {
        if (args.length < 1) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        if (typeof (args[0]) == 'string') {
            // Look for a block with logo name
            for (var i = 0; i < logo.blocks.blockList.length; i++) {
                if (logo.blocks.blockList[i].protoblock.staticLabels.length > 0 && logo.blocks.blockList[i].protoblock.staticLabels[0] == args[0]) {
                    args[0] = i;
                    return;
                }
            }
        }

        if (typeof (args[0]) == 'string') {
            args[0] = -1;
        }

        if (args[0] < 0 || args[0] > logo.blocks.blockList.length - 1) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        if (logo.blocks.blockList[args[0]].name === 'start') {
            var thisTurtle = logo.blocks.blockList[args[0]].value;
            console.debug('run start ' + thisTurtle);
            logo.initTurtle(thisTurtle);
            logo.turtles.turtleList[thisTurtle].queue = [];
            logo.parentFlowQueue[thisTurtle] = [];
            logo.unhighlightQueue[thisTurtle] = [];
            logo.parameterQueue[thisTurtle] = [];
            logo.turtles.turtleList[thisTurtle].running = true;
            logo._runFromBlock(logo, thisTurtle, args[0], 0, receivedArg);
        } else {
            return [args[0], 1];
        }
    }
}

class DockBlockBlock extends FlowBlock {
    constructor() {
        super('dockblock');
        this.setPalette('extras');

        this.formBlock({
            //.TRANS: We can connect a block to another block.
            name: _('connect blocks'), args: 3,
            argLabels: [
                _('target block'), _('connection number'), _('block number')
            ]
        });
    }

    flow(args, logo, turtle, blk) {
        if (args.length < 3) {
            console.debug(args.length + ' < 3');
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        if (args[0] < 0 || args[0] > logo.blocks.blockList.length - 1) {
            console.debug(args[0] + ' > ' + logo.blocks.blockList.length - 1);
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        if (args[0] === args[2]) {
            console.debug(args[0] + ' == ' + args[2]);
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        if (args[2] < 0 || args[2] > logo.blocks.blockList.length - 1) {
            console.debug(args[2] + ' > ' + logo.blocks.blockList.length - 1);
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        if (args[1] === -1) {
            // Find the last connection.
            args[1] = logo.blocks.blockList[args[0]].connections.length - 1;
        } else if (args[1] < 1 || args[1] > logo.blocks.blockList[args[0]].connections.length - 1) {
            console.debug(args[1] + ' out of bounds');
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        // Make sure there is not another block already connected.
        var c = logo.blocks.blockList[args[0]].connections[args[1]];
        if (c !== null) {
            if (logo.blocks.blockList[c].name === 'hidden') {
                // Dock to the hidden block.
                args[0] = c;
                args[1] = 1;
            } else {
                // Or disconnection the old connection.
                for (var i = 0; i < logo.blocks.blockList[c].connections.length; i++) {
                    if (logo.blocks.blockList[c].connections[i] === args[0]) {
                        logo.blocks.blockList[c].connections[i] = null;
                        return;
                    }
                }

                logo.blocks.blockList[args[0]].connections[args][1] = null;
            }
        }

        logo.blocks.blockList[args[0]].connections[args[1]] = args[2];
        logo.blocks.blockList[args[2]].connections[0] = args[0];

        logo.blocks.adjustDocks(args[0], true);
    }
}

class MakeBlockBlock extends LeftBlock {
    constructor() {
        super('makeblock');
        this.setPalette('extras');

        this.formBlock({
            //.TRANS: Create a new block programmatically.
            name: _('make block'),
            args: 1, argTypes: ['anyin'],
            outType: 'anyout',
            flows: {
                type: 'arg', types: ['anyin'], labels: ['']
            },
            defaults: [_('note')]
        });
    }

    arg(logo, turtle, blk, receivedArg) {
        logo.showBlocks();  // Force blocks to be visible.
        var blockArgs = [null];
        if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
            for (var i = 0; i < logo.blocks.blockList[blk].argClampSlots.length; i++) {
                var t = (logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i + 2], blk, receivedArg));
                blockArgs.push(t);
            }
        }
        var cblk = logo.blocks.blockList[blk].connections[1];
        var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
        var blockNumber = logo.blocks.blockList.length;

        var x = logo.turtles.turtleX2screenX(logo.turtles.turtleList[turtle].x);
        var y = logo.turtles.turtleY2screenY(logo.turtles.turtleList[turtle].y);

        // We special case note blocks.
        //.TRANS: a musical note consisting of pitch and duration
        if (name === _('note')) {
            switch (blockArgs.length) {
                case 1:
                    var p = 'sol';
                    var o = 4;
                    var v = 4;
                    return;
                case 2:
                    var p = blockArgs[1];
                    var o = 4;
                    var v = 4;
                    return;
                case 3:
                    var p = blockArgs[1];
                    var o = blockArgs[2];
                    var v = 4;
                    return;
                default:
                    var p = blockArgs[1];
                    var o = blockArgs[2];
                    var v = blockArgs[3];
                    return;
            }

            var newNote = [[0, 'newnote', x, y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', { 'value': 1 }], 0, 0, [1]], [3, ['number', { 'value': v }], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['solfege', { 'value': p }], 0, 0, [5]], [7, ['number', { 'value': o }], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
            logo.blocks.loadNewBlocks(newNote);
            return blockNumber;
        } else if (name === _('start')) {
            var newBlock = [[0, 'start', x, y, [null, null, null]]];
            logo.blocks.loadNewBlocks(newBlock);
            return blockNumber;
        } else if (name === _('silence')) {  // FIXME: others too
            var newBlock = [[0, 'rest2', x, y, [null, null]]];
            logo.blocks.loadNewBlocks(newBlock);
            return blockNumber;
        } else {
            var obj = logo.blocks.palettes.getProtoNameAndPalette(name);
            var protoblk = obj[0];
            var protoName = obj[2];
            if (protoblk === null) {
                logo.errorMsg(_('Cannot find block') + ' ' + name);
            } else {
                var newBlock = [[0, protoName, x, y, [null]]];
                for (var i = 1; i < logo.blocks.protoBlockDict[protoblk].dockTypes.length; i++) {
                    // FIXME: type check args
                    if (i < blockArgs.length) {
                        if (typeof (blockArgs[i]) === 'number') {
                            if (['anyin', 'numberin'].indexOf(logo.blocks.protoBlockDict[protoblk].dockTypes[i]) === -1) {
                                logo.errorMsg(_('Warning: block argument type mismatch'));
                            }
                            newBlock.push([i, ['number', { 'value': blockArgs[i] }], 0, 0, [0]]);
                        } else if (typeof (blockArgs[i]) === 'string') {
                            if (['anyin', 'textin'].indexOf(logo.blocks.protoBlockDict[protoblk].dockTypes[i]) === -1) {
                                logo.errorMsg(_('Warning: block argument type mismatch'));
                            }
                            newBlock.push([i, ['string', { 'value': blockArgs[i] }], 0, 0, [0]]);
                        } else {
                            newBlock[0][4].push(null);
                        }

                        newBlock[0][4].push(i);
                    } else {
                        newBlock[0][4].push(null);
                    }
                }

                logo.blocks.loadNewBlocks(newBlock);
                return blockNumber;
            }
        }
    }
}

class SaveABCBlock extends FlowBlock {
    constructor() {
        super('saveabc');
        this.setPalette('extras');

        this.formBlock({
            name: _('save as ABC'),
            args: 1, argTypes: ['textin'],
            defaults: [_('title') + '.abc']
        });
        this.hidden = true;
        this.deprecated = true;
    }


    flow(args) {
        if (args.length === 1) {
            save.afterSaveAbc(args[0]);
        }
    }
}

class SaveLilypondBlock extends FlowBlock {
    constructor() {
        super('savelilypond');
        this.setPalette('extras');

        this.formBlock({
            name: _('save as Lilypond'),
            args: 1, argTypes: ['textin'],
            defaults: [_('title') + '.ly']
        });
        this.hidden = true;
        this.deprecated = true;
    }

    flow(args) {
        if (args.length === 1) {
            save.afterSaveLilypond(args[0]);
        }
    }
}

class SaveSVGBlock extends FlowBlock {
    constructor() {
        super('savesvg');
        this.setPalette('extras');

        this.formBlock({
            name: _('save as SVG'),
            args: 1, argTypes: ['textin'],
            defaults: [_('title') + '.svg']
        });
        this.hidden = true;
        this.deprecated = true;
    }

    flow(args, logo, turtle, blk) {
        if (args[0] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        if (args.length === 1) {
            if (logo.svgBackground) {
                logo.svgOutput = '<rect x="0" y="0" height="' + logo.canvas.height + '" width="' + logo.canvas.width + '" fill="' + body.style.background + '"/> ' + logo.svgOutput;
            }

            save.saveSVG(args[0]);
        }
    }
}

class NoBackgroundBlock extends FlowBlock {
    constructor() {
        super('nobackground', _('no background'));
        this.setPalette('extras');
    }

    flow(args, logo) {
        logo.svgBackground = false;
    }
}

class ShowBlocksBlock extends FlowBlock {
    constructor() {
        super('showblocks', _('show blocks'));
        this.setPalette('extras');
    }

    flow(args, logo) {
        logo.showBlocks();
        logo.setTurtleDelay(DEFAULTDELAY);
    }
}

class HideBlocksBlock extends FlowBlock {
    constructor() {
        super('hideblocks', _('hide blocks'));
        this.setPalette('extras');
    }

    flow(args, logo) {
        logo.hideBlocks();
        logo.setTurtleDelay(0);
    }
}

class OpenProjectBlock extends FlowBlock {
    constructor() {
        super('openProject');
        this.setPalette('extras');

        this.formBlock({
            name: _('open project'),
            args: 1, argTypes: ['textin'],
            defaults: ['url']
        })
    }

    flow(args, logo, turtle, blk) {
        if (args[0] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return;
        }

        url = args[0];

        function ValidURL(str) {
            var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                '((\\d{1,3}\\.) {3}\\d{1,3}))' + // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
            if (!pattern.test(str)) {
                logo.errorMsg(_('Please enter a valid URL.'));
                return false;
            } else {
                return true;
            }
        };

        if (ValidURL(url)) {
            var win = window.open(url, '_blank')
            if (win) {
                // Browser has allowed it to be opened.
                win.focus();
            } else {
                // Broswer has blocked it.
                alert('Please allow popups for this site');
            }
        }
    }
}

class VSpaceBlock extends FlowBlock {
    constructor() {
        super('vspace', '↓');
        this.setPalette('extras');

        this.extraWidth = -10;
    }

    flow() {
        //
    }
}

class HSpaceBlock extends LeftBlock {
    constructor() {
        super('hspace', '←');
        this.setPalette('extras');

        this.extraWidth = -10;
        this.formBlock({
            args: 1, argTypes: ['anyin'],
            outType: 'anyout'
        });
    }

    arg(logo, turtle, blk, receivedArg) {
        var cblk = logo.blocks.blockList[blk].connections[1];
        return logo.parseArg(logo, turtle, cblk, blk, receivedArg);
    }
}

class WaitBlock extends FlowBlock {
    constructor() {
        super('wait', _('wait'));
        this.setPalette('extras');

        this.formBlock({
            args: 1, defaults: [1]
        });
    }

    flow(args, logo, turtle) {
        if (args.length === 1) {
            if (logo.bpm[turtle].length > 0) {
                var bpmFactor = TONEBPM / last(logo.bpm[turtle]);
            } else {
                var bpmFactor = TONEBPM / logo._masterBPM;
            }

            var noteBeatValue = bpmFactor / (1 / args[0]);
            logo.previousTurtleTime[turtle] = logo.turtleTime[turtle];
            logo.turtleTime[turtle] += noteBeatValue;
            logo._doWait(turtle, args[0]);
        }
    }
}

class CommentBlock extends FlowBlock {
    constructor() {
        super('comment');
        this.setPalette('extras');

        this.formBlock({
            name: _('comment'),
            args: 1, defaults: ['Music Blocks'],
            argTypes: ['anyin']
        });
    }

    flow(args, logo, turtle) {
        if (args[0] !== null) {
            console.debug(args[0].toString());
            if (!logo.suppressOutput[turtle] && logo.turtleDelay > 0) {
                logo.textMsg(args[0].toString());
            }
        }
    }
}

class PrintBlock extends FlowBlock {
    constructor() {
        super('print', _('print'));
        if (beginnerMode)
            this.setPalette('media');
        else
            this.setPalette('extras');

        this.formBlock({
            args: 1, defaults: ['Music Blocks'],
            argTypes: ['anyin']
        });
    }

    flow(args, logo, turtle, blk) {
        if (!logo.inStatusMatrix) {
            if (args.length === 1) {
                if (args[0] !== null) {
                    if (logo.inNoteBlock[turtle].length > 0) {
                        logo.embeddedGraphics[turtle][last(logo.inNoteBlock[turtle])].push(blk);
                        logo.markup[turtle].push(args[0].toString());
                    } else {
                        if (!logo.suppressOutput[turtle]) {
                            if (args[0] === undefined) {
                                logo.textMsg('undefined');
                            } else if (args[0] === null) {
                                logo.textMsg('null');
                            } else {
                                logo.textMsg(args[0].toString());
                            }
                        }

                        if (logo.justCounting[turtle].length === 0) {
                            logo._playbackPush(turtle, [logo.previousTurtleTime[turtle], 'print', args[0]]);
                        }
                    }
                }
            }
        }
    }
}

function setupExtrasBlocks() {
    new OpenPaletteBlock().setup();
    new DeleteBlockBlock().setup();
    new MoveBlockBlock().setup();
    new RunBlockBlock().setup();
    new DockBlockBlock().setup();
    new MakeBlockBlock().setup();
    new SaveABCBlock().setup();
    new SaveLilypondBlock().setup();
    new SaveSVGBlock().setup();
    new NoBackgroundBlock().setup();
    new ShowBlocksBlock().setup();
    new HideBlocksBlock().setup();
    new OpenProjectBlock().setup();
    new VSpaceBlock().setup();
    new HSpaceBlock().setup();
    new WaitBlock().setup();
    new CommentBlock().setup();
    new PrintBlock().setup();
}
