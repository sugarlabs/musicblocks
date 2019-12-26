class IntBlock extends BaseBlock {
    constructor() {
        super('int');

        this.setPalette('number');
        this.staticLabels.push(_('int'));

        this.adjustWidthToLabel();
        this.oneArgMathBlock();
        this.defaults.push(100);
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'int']);
        } else {
            var cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.blocks.blockList[blk].value = 0;
            } else {
                var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (typeof(a) === 'number') {
                    logo.blocks.blockList[blk].value = Math.floor(a);
                } else {
                    try {
                        logo.blocks.blockList[blk].value = Math.floor(Number(a));
                    } catch (e) {
                        console.debug(e);
                        logo.errorMsg(NANERRORMSG, blk);
                        logo.blocks.blockList[blk].value = 0;
                    }
                }
            }
        }
    }
}


function setupNumberBlocks() {
    new IntBlock();
}
