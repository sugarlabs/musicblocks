class IntBlock extends LeftBlock {
    constructor() {
        super('int');
        this.setPalette('number');

        this.formBlock({
            name: _('int'),
            args: 1,
            defaults: [100]
        });
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

class ModBlock extends LeftBlock {
    constructor() {
        super('mod');
        this.setPalette('number');

        this.formBlock({
            name: _('mod'), args: 2,
            defaults: [100, 10]
        });
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'mod']);
        } else {
            var cblk1 = logo.blocks.blockList[blk].connections[1];
            var cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.blocks.blockList[blk].value = 0;
            } else {
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                if (typeof(a) === 'number' && typeof(b) === 'number') {
                    logo.blocks.blockList[blk].value = logo._doMod(a, b);
                } else {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.blocks.blockList[blk].value = 0;
                }
            }
        }
    }
}

class PowerBlock extends LeftBlock {
    constructor() {
        super('power');
        this.setPalette('number');

        this.fontsize = 14;
        this.formBlock({
            name: '^', args: 2, defaults: [2, 4]
        });
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'power']);
        } else {
            var cblk1 = logo.blocks.blockList[blk].connections[1];
            var cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    logo.blocks.blockList[blk].value = a;
                } else {
                    logo.blocks.blockList[blk].value = 0;
                }
            } else {
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                if (typeof(a) === 'number' && typeof(b) === 'number') {

                    logo.blocks.blockList[blk].value = logo._doPower(a, b);
                } else {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.blocks.blockList[blk].value = 0;
                }
            }
        }
    }
}

class SqrtBlock extends LeftBlock {
    constructor() {
        super('sqrt');
        this.setPalette('number');

        this.formBlock({
            name: _('sqrt'), args: 1, defaults: [64]
        });
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, logo.blocks.blockList[blk].name]);
        } else {
            var cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.blocks.blockList[blk].value = 0;
            } else {
                var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (typeof(a) === 'number') {
                    if (a < 0) {
                        logo.errorMsg(NOSQRTERRORMSG, blk);
                        a = -a;
                    }

                    logo.blocks.blockList[blk].value = logo._doSqrt(a);
                } else {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.blocks.blockList[blk].value = 0;
                }
            }
        }
    }
}

class AbsBlock extends LeftBlock {
    constructor() {
        super('abs');
        this.setPalette('number');

        this.formBlock({
            name: _('abs'), args: 1
        });
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, logo.blocks.blockList[blk].name]);
        } else {
            var cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.blocks.blockList[blk].value = 0;
            } else {
                var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (typeof(a) === 'number') {
                    logo.blocks.blockList[blk].value = Math.abs(a);
                } else {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.blocks.blockList[blk].value = 0;
                }
            }
        }
    }
}

class DivideBlock extends LeftBlock {
    constructor() {
        super('divide');
        this.setPalette('number');

        this.fontsize = 9;
        this.formBlock({
            name: this.lang === 'ja' ? '➗' : '/', args: 2,
            defaults: [1, 4]
        });
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'divide']);
        } else {
            var cblk1 = logo.blocks.blockList[blk].connections[1];
            var cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    logo.blocks.blockList[blk].value = a;
                } else {
                    logo.blocks.blockList[blk].value = 0;
                }
            } else {
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                if (typeof(a) === 'number' && typeof(b) === 'number') {
                    logo.blocks.blockList[blk].value = logo._doDivide(a, b);
                } else {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.blocks.blockList[blk].value = 0;
                }
            }
        }
    }
}

class MultiplyBlock extends LeftBlock {
    constructor() {
        super('multiply');
        this.setPalette('number');

        this.fontsize = 14;
        this.formBlock({
            name: '×', args: 2,
            argTypes: ['anyin', 'anyin'],
            defaults: [1, 12]
        });
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'multiply']);
        } else {
            var cblk1 = logo.blocks.blockList[blk].connections[1];
            var cblk2 = logo.blocks.blockList[blk].connections[2];
            var cblk0 = logo.blocks.blockList[blk].connections[0];
            var noteBlock = logo.blocks.blockList[cblk0].connections[1];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    logo.blocks.blockList[blk].value = a;
                } else if (cblk2 !== null) {
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = b;
                } else {
                    logo.blocks.blockList[blk].value = 0;
                }
            } else {
                // We have a special case for certain keywords
                // associated with octaves: current, next, and
                // previous.
                if (typeof(logo.blocks.blockList[cblk1].value) === 'string') {
                    var a = calcOctave(logo.currentOctave[turtle], logo.blocks.blockList[cblk1].value, logo.lastNotePlayed[turtle], logo.blocks.blockList[noteBlock].value);
                } else {
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                }

                if (typeof(logo.blocks.blockList[cblk2].value) === 'string') {
                    var b = calcOctave(logo.currentOctave[turtle], logo.blocks.blockList[cblk2].value, logo.lastNotePlayed[turtle], logo.blocks.blockList[noteBlock].value);
                } else {
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                }

                logo.blocks.blockList[blk].value = logo._doMultiply(a, b);
            }
        }
    }
}

class NegBlock extends LeftBlock {
    constructor() {
        super('neg');
        this.setPalette('number');
        
        this.fontsize = 14;
        this.formBlock({
            name: '–', args: 1,
            argTypes: 'anyin', outType: 'anyout'
        });
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'neg']);
        } else {
            var cblk = logo.blocks.blockList[blk].connections[1];
            if (cblk !== null) {
                var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (typeof(a) === 'number') {
                    logo.blocks.blockList[blk].value = logo._doMinus(0, a);
                } else if (typeof(a) === 'string') {
                    var obj = a.split('');
                    logo.blocks.blockList[blk].value = obj.reverse().join('');
                } else {
                    logo.blocks.blockList[blk].value = a;
                }
            } else {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.blocks.blockList[blk].value = 0;
            }
        }
    }
}

class MinusBlock extends LeftBlock {
    constructor() {
        super('minus');
        this.setPalette('number');

        this.fontsize = 14;
        this.formBlock({
            name: '–', args: 2, defaults: [8, 4],
            argTypes: ['anyin', 'anyin']
        });
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'minus']);
        } else {
            var cblk1 = logo.blocks.blockList[blk].connections[1];
            var cblk2 = logo.blocks.blockList[blk].connections[2];
            var cblk0 = logo.blocks.blockList[blk].connections[0];
            var noteBlock = logo.blocks.blockList[cblk0].connections[1];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    logo.blocks.blockList[blk].value = a;
                } else if (cblk2 !== null) {
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = -b;
                } else {
                    logo.blocks.blockList[blk].value = 0;
                }
            } else {
                // We have a special case for certain keywords
                // associated with octaves: current, next, and
                // previous.
                if (typeof(logo.blocks.blockList[cblk1].value) === 'string') {
                    var a = calcOctave(logo.currentOctave[turtle], logo.blocks.blockList[cblk1].value, logo.lastNotePlayed[turtle],  logo.blocks.blockList[noteBlock].value);
                } else {
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                }

                if (typeof(logo.blocks.blockList[cblk2].value) === 'string') {
                    var b = calcOctave(logo.currentOctave[turtle], logo.blocks.blockList[cblk2].value, logo.lastNotePlayed[turtle],  logo.blocks.blockList[noteBlock].value);
                } else {
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                }

                logo.blocks.blockList[blk].value = logo._doMinus(a, b);
            }
        }
    }
}

class PlusBlock extends LeftBlock {
    constructor() {
        super('plus');
        this.setPalette('number');

        this.fontsize = 14;
        this.formBlock({
            name: '+', outType: 'anyout', args: 2,
            defaults: [2, 2], argTypes: ['anyin', 'anyin']
        });
    }

    arg(logo) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'plus']);
        } else {
            var cblk1 = logo.blocks.blockList[blk].connections[1];
            var cblk2 = logo.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                if (cblk1 !== null) {
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    logo.blocks.blockList[blk].value = a;
                } else if (cblk2 !== null) {
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = b;
                } else {
                    logo.blocks.blockList[blk].value = 0;
                }
            } else {
                // We have a special case for certain keywords
                // associated with octaves: current, next, and
                // previous. In the case of plus, since we use it
                // for string concatenation as well, we check to
                // see if the block is connected to a pitch block
                // before assuming octave.

                var cblk0 = logo.blocks.blockList[blk].connections[0];
                if (cblk0 !== null && logo.blocks.blockList[cblk0].name === 'pitch') {
                    var noteBlock = logo.blocks.blockList[cblk0].connections[1];
                    if (typeof(logo.blocks.blockList[cblk1].value) === 'string') {
                        var a = calcOctave(logo.currentOctave[turtle], logo.blocks.blockList[cblk1].value, logo.lastNotePlayed[turtle], logo.blocks.blockList[noteBlock].value);
                    } else {
                        var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    }

                    if (typeof(logo.blocks.blockList[cblk2].value) === 'string') {
                        var b = calcOctave(logo.currentOctave[turtle], logo.blocks.blockList[cblk2].value, logo.lastNotePlayed[turtle], logo.blocks.blockList[noteBlock].value);
                    } else {
                        var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    }
                } else {
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                }

                logo.blocks.blockList[blk].value = logo._doPlus(a, b);
            }
        }
    }
}

class OneOfBlock extends LeftBlock {
    constructor() {
        super('oneOf');
        this.setPalette('number');

        this.formBlock({
            name: _('one of'), args: 2,
            argLabels: [_('this'), _('logo')],
            outType: 'anyout', argTypes: ['anyin', 'anyin'],
            defaults: [-90, 90]
        });

        this.makeMacro((x, y) => [
            [0, 'oneOf',  x, y, [null, 1, 2, null]],
            [1, ['solfege', {'value': 'do'}], 0, 0, [0]],
            [2, ['solfege', {'value': 'sol'}], 0, 0, [0]]
        ]);
    }

    arg(logo) {
        var cblk1 = logo.blocks.blockList[blk].connections[1];
        var cblk2 = logo.blocks.blockList[blk].connections[2];
        if (cblk1 === null || cblk2 === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            if (cblk1 !== null) {
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                logo.blocks.blockList[blk].value = a;
            } else if (cblk2 !== null) {
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                logo.blocks.blockList[blk].value = b;
            } else {
                logo.blocks.blockList[blk].value = 0;
            }
        } else {
            var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            logo.blocks.blockList[blk].value = logo._doOneOf(a, b);
        }
    }
}

class RandomBlock extends LeftBlock {
    constructor() {
        super('random');
        this.setPalette('number');

        this.formBlock({
            name: _('random'), args: 2,
            argLabels: [_('min'), _('max')],
            argTypes: ['anyin', 'anyin'], defaults: [0, 12]
        });
    }

    arg(logo) {
        var cblk1 = that.blocks.blockList[blk].connections[1];
        var cblk2 = that.blocks.blockList[blk].connections[2];
        if (cblk1 === null || cblk2 === null) {
            that.errorMsg(NOINPUTERRORMSG, blk);
            that.blocks.blockList[blk].value = 0;
        } else {
            var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
            var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
            if (typeof(a) === 'number' && typeof(b) === 'number') {
                that.blocks.blockList[blk].value = that._doRandom(a, b);
            } else if (typeof(a) === 'string' && typeof(b) === 'string' && SOLFEGENAMES.indexOf(a) != -1 && SOLFEGENAMES.indexOf(b) != -1) {
                var ai = SOLFEGENAMES.indexOf(a);
                var bi = SOLFEGENAMES.indexOf(b);
                if (ai > bi) {
                    ai = SOLFEGENAMES.indexOf(b);
                    bi = SOLFEGENAMES.indexOf(a);
                }

                var ii = that._doRandom(ai, bi);
                that.blocks.blockList[blk].value = SOLFEGENAMES[ii];
            } else {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.blocks.blockList[blk].value = false
            }
        }
    }
}

class NumberBlock extends ValueBlock {
    constructor() {
        super('number');
        this.setPalette('number');
    }
}


function setupNumberBlocks() {
    new IntBlock().setup();
    new ModBlock().setup();
    new PowerBlock().setup();
    new SqrtBlock().setup();
    new AbsBlock().setup();
    new DivideBlock().setup();
    new MultiplyBlock().setup();
    new NegBlock().setup();
    new MinusBlock().setup();
    new PlusBlock().setup();
    new OneOfBlock().setup();
    new RandomBlock().setup();
    new NumberBlock().setup();
}
