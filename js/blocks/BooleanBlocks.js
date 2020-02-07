function setupBooleanBlocks() {

class NotBlock extends BooleanBlock {
    constructor() {
        super('not');
        this.setPalette('boolean');

        this.formBlock({
            name: _('not'),
            args: 1, argTypes: ['booleanin']
        })
    }

    arg(logo, turtle, blk, receivedArg) {
        var cblk = logo.blocks.blockList[blk].connections[1];
        if (cblk === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        }
        var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
        try {
            return !a;
        } catch (e) {
            console.debug(e);
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        }
    }
}

class AndBlock extends BooleanBlock {
    constructor() {
        super('and');
        this.setPalette('boolean');
        this.formBlock({
            name: _('and'),
            args: 2, argTypes: ['booleanin', 'booleanin']
        });
    }

    arg(logo, turtle, blk, receivedArg) {
        var cblk1 = logo.blocks.blockList[blk].connections[1];
        var cblk2 = logo.blocks.blockList[blk].connections[2];
        if (cblk1 === null || cblk2 === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        } else {
            var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return a && b;
        }
    }
}

class OrBlock extends BooleanBlock {
    constructor() {
        super('or');
        this.setPalette('boolean');
        this.formBlock({
            name: _('or'),
            args: 2, argTypes: ['booleanin', 'booleanin']
        });
    }

    arg(logo, turtle, blk, receivedArg) {
        var cblk1 = logo.blocks.blockList[blk].connections[1];
        var cblk2 = logo.blocks.blockList[blk].connections[2];
        if (cblk1 === null || cblk2 === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        } else {
            var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return a || b;
        }
    }
}

class GreaterBlock extends BooleanBlock {
    constructor() {
        super('greater');
        this.setPalette('boolean');
        this.fontsize = 14;
        this.formBlock({
            name: '>',
            args: 2, argTypes: ['numberin', 'numberin']
        });
    }

    arg(logo, turtle, blk, receivedArg) {
        var cblk1 = logo.blocks.blockList[blk].connections[1];
        var cblk2 = logo.blocks.blockList[blk].connections[2];
        if (cblk1 === null || cblk2 === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        }

        var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
        var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
        try {
            return Number(a) > Number(b);
        } catch (e) {
            console.debug(e);
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        }
    }
}

class LessBlock extends BooleanBlock {
    constructor() {
        super('less');
        this.setPalette('boolean');
        this.fontsize = 14;
        this.formBlock({
            name: '<',
            args: 2, argTypes: ['numberin', 'numberin']
        });
    }

    arg(logo, turtle, blk, receivedArg) {
        var cblk1 = logo.blocks.blockList[blk].connections[1];
        var cblk2 = logo.blocks.blockList[blk].connections[2];
        if (cblk1 === null || cblk2 === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        }
        var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
        var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
        try {
            return Number(a) < Number(b);
        } catch (e) {
            console.debug(e);
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        }
    }
}

class EqualBlock extends BooleanBlock {
    constructor() {
        super('equal');
        this.setPalette('boolean');
        this.fontsize = 14;
        this.formBlock({
            name: '=',
            args: 2, argTypes: ['anyin', 'anyin']
        });
    }

    arg(logo, turtle, blk, receivedArg) {
        var cblk1 = logo.blocks.blockList[blk].connections[1];
        var cblk2 = logo.blocks.blockList[blk].connections[2];
        if (cblk1 === null || cblk2 === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false;
        }
        var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
        var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
        try {
            return a === b;
        } catch (e) {
            console.debug(e);
            logo.errorMsg(NOINPUTERRORMSG, blk);
            return false
        }
    }
}

class StaticBooleanBlock extends BooleanBlock {
    constructor() {
        super('boolean');
        this.setPalette('boolean');
    }

    arg(logo, turtle, blk) {
        if (typeof(logo.blocks.blockList[blk].value) === 'string') {
            return logo.blocks.blockList[blk].value === _('true') || logo.blocks.blockList[blk].value === 'true';
        }
        return logo.blocks.blockList[blk].value;
    }
}


    new NotBlock().setup();
    new AndBlock().setup();
    new OrBlock().setup();
    new GreaterBlock().setup();
    new LessBlock().setup();
    new EqualBlock().setup();
    new StaticBooleanBlock().setup();
}
