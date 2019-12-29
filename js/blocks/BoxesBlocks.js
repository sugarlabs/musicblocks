class IncrementBlock extends FlowBlock {
    constructor(name) {
        super(name || 'increment');
        this.setPalette('boxes');

        let language = localStorage.languagePreference || navigator.language;
        this.formBlock({
            name: _('add'),
            args: 2,
            argLabels: [_('to'), language === 'ja' ? _('value1') : _('value')],
            argTypes: ['anyin', 'anyin']
        });
    }

    flow(args, logo, turtle, blk) {
        // If the 2nd arg is not set, default to 1.
        let i = args.length === 2 ? args[1]  : 1

        if (args.length > 0) {
            var cblk = logo.blocks.blockList[blk].connections[1];
            if (logo.blocks.blockList[cblk].name === 'text') {
                // Work-around to #1302
                // Look for a namedbox with this text value.
                var name = this.blocks.blockList[cblk].value;
                if (name in this.boxes) {
                    this.boxes[name] = this.boxes[name] + i;
                    return;
                }
            }

            var settingBlk = logo.blocks.blockList[blk].connections[1];
            logo._blockSetter(settingBlk, args[0] + i, turtle);
        }
    }
}

class IncrementOneBlock extends IncrementBlock {
    constructor() {
        super('incrementOne');
        this.setPalette('boxes');

        this.formBlock({ name: _('add 1 to'), args: 1, argTypes: ['anyin'], argLabels: [''] });
    }

    flow(args, logo, turtle, blk) {
        args[1] = 1;
        super.flow(args, logo, turtle, blk);
    }
}

class BoxBlock extends BaseBlock {
    constructor() {
        super('box');
        this.setPalette('boxes');

        this.formBlock({
            //.TRANS: a container into which to put something
            name: _('box'),
            flows: { left: true, type: null },
            outType: 'anyout',
            args: 1, argDefaults: [_('box')],
            argTypes: ['anyin'],
        })
        this.parameter = true;
    }

    arg(logo) {
        var cblk = logo.blocks.blockList[blk].connections[1];
        if (cblk === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            logo.blocks.blockList[blk].value = 0;
        }

        var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
        if (name in logo.boxes) {
            logo.blocks.blockList[blk].value = logo.boxes[name];
        } else {
            logo.errorMsg(NOBOXERRORMSG, blk, name);
            logo.blocks.blockList[blk].value = 0;
        }
    }
}

class NamedBoxBlock extends ValueBlock {
    constructor() {
        super('namedbox');
        this.setPalette('boxes');

        this.extraWidth = 20;
        this.formBlock({
            name: _('box'),
            outType: 'anyout'
        })
    }

    arg(logo) {
        var name = logo.blocks.blockList[blk].privateData;
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, logo.blocks.blockList[blk].name]);
        } else if (!logo.updatingStatusMatrix) {
            if (name in logo.boxes) {
                logo.blocks.blockList[blk].value = logo.boxes[name];
            } else {
                logo.errorMsg(NOBOXERRORMSG, blk, name);
                logo.blocks.blockList[blk].value = 0;
            }
        }
    }
}

class StoreIn2Block extends FlowBlock {
    constructor() {
        super('storein2');
        this.setPalette('boxes');

        this.formBlock({
            name: _('store in box'),
            args: 1, argTypes: ['anyin'],
            argDefaults: [4],
        });
    }

    args(logo) {
        if (args.length !== 1) return;
        logo.boxes[logo.blocks.blockList[blk].privateData] = args[0];
    }
}

class StoreInBlock extends FlowBlock {
    constructor() {
        super('storein');
        this.setPalette('boxes');

        let language = localStorage.languagePreference || navigator.language;
        this.formBlock({
            //.TRANS: put something into a container for later reference
            name: _('store in'),
            args: 2, argTypes: ['anyin', 'anyin'],
            argDefaults: [_('box'), 4],
            //.TRANS: name1 is name as in name of box, value1 is value as in the numeric value stored in a box (JAPANESE ONLY)
            argLabels: (language === 'ja' ? [_('name1'), _('value1')]
                                          : [_('name'), _('name')])
        })
    }

    args(logo) {
        if (args.length !== 1) return;
        logo.boxes[args[0]] = args[1];
    }
}

class Box2Block extends ValueBlock {
    constructor() {
        super('box2');
        this.setPalette('boxes');

        this.formBlock({ name: _('box 2') });
        this.makeMacro((x, y) => [
            [0, ['namedbox', {'value': _('box2')}], x, y, [null]]
        ]);
    }
}

class StoreBox2Block extends FlowBlock {
    constructor() {
        super('storebox2');
        this.setPalette('boxes');

        this.formBlock({ name: _('store in box 2'), args: 1, argDefaults: [4] });
        this.makeMacro((x, y) => [
            [0, ['storein2', {'value': _('box2')}], x, y, [null, 1, null]],
            [1, ['number', {'value': 4}], x, y, [0]]
        ]);
    }
}

class Box1Block extends ValueBlock {
    constructor() {
        super('box1');
        this.setPalette('boxes');

        this.formBlock({ name: _('box 1') });
        this.makeMacro((x, y) => [
            [0, ['namedbox', {'value': _('box1')}], x, y, [null]]
        ]);
    }
}

class StoreBox1Block extends FlowBlock {
    constructor() {
        super('storebox1');
        this.setPalette('boxes');

        this.formBlock({ name: _('store in box 1'), args: 1, argDefaults: [4] });
        this.makeMacro((x, y) => [
            [0, ['storein2', {'value': _('box1')}], x, y, [null, 1, null]],
            [1, ['number', {'value': 4}], x, y, [0]]
        ]);
    }
}


function setupBoxesBlocks() {
    new IncrementOneBlock().setup();
    new IncrementBlock().setup();
    new BoxBlock().setup();
    new NamedBoxBlock().setup();
    new StoreIn2Block().setup();
    new StoreInBlock().setup();
    new Box2Block().setup();
    new StoreBox2Block().setup();
    new Box1Block().setup();
    new StoreBox1Block().setup();
}
