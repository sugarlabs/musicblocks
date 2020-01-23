class SetTemperamentBlock extends FlowBlock {
    constructor() {
        super('settemperament', _('set temperament'));
        this.setPalette('intervals');
        this.formBlock({
            args: 3,
            argLabels: [_('temperament'), _('pitch'), _('octave')]
        });
        this.makeMacro((x, y) => [
            [0, 'settemperament', x, y, [null, 1, 2, 3, null]],
            [1, ['temperamentname', {'value': 'equal'}], 0, 0, [0]],
            [2, ['notename', {'value': 'C'}], 0, 0, [0]],
            [3, ['number', {'value': 4}], 0, 0, [0]]
        ]);
    }

    flow(args, that) {
        that.synth.inTemperament = args[0];
        that.synth.startingPitch = args[1] + '' + args[2];

        that.temperamentSelected.push(args[0]);
        var len = that.temperamentSelected.length;

        if (that.temperamentSelected[len - 1] !== that.temperamentSelected[len - 2]) {
            that.synth.changeInTemperament = true;
        }
    }
}

class TemperamentNameBlock extends ValueBlock {
    constructor() {
        super('temperamentname');
        this.setPalette('tone');
        this.hidden = true;
        this.formBlock({ outType: 'anyout' });
    }
}

class ModeNameBlock extends ValueBlock {
    constructor() {
        super('modename');
        this.setPalette('intervals');
        this.formBlock({ outType: 'textout' });
        this.extraWidth = 50;
        this.hidden = true;
    }
}

class DoublyBlock extends LeftBlock {
    constructor() {
        // TRANS: doubly means to apply an augmentation or diminishment twice
        super('doubly', _('doubly'));
        this.setPalette('intervals');
        this.formBlock({
            outType: 'anyout', args: 1,
            argTypes: ['anyin']
        });
    }

    arg(that, turtle, blk, receivedArg) {
        var cblk = that.blocks.blockList[blk].connections[1];
        //find block at end of chain
        if (cblk === null) {
            that.errorMsg(NOINPUTERRORMSG, blk);
            return 0;
        } else {
            var currentblock = cblk;
            while (true) {
                var blockToCheck = that.blocks.blockList[currentblock];
                if (blockToCheck.name === 'intervalname') {
                    // Augmented or diminished only
                    if (blockToCheck.value[0] === 'a') {
                        return that.parseArg(that, turtle, cblk, blk, receivedArg) + 1;
                    } else if (blockToCheck.value[0] === 'd') {
                        return that.parseArg(that, turtle, cblk, blk, receivedArg) - 1;
                    } else {
                        return that.parseArg(that, turtle, cblk, blk, receivedArg);
                    }
                } else if (blockToCheck.name !== 'doubly') {
                    var value = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    if (typeof(value) === 'number') {
                        return value * 2;
                    } else if (typeof(value) === 'string') {
                        return value + value;
                    } else {
                        return value;
                    }
                }

                currentblock=that.blocks.blockList[currentblock].connections[1];
                if (currentblock == null) {
                    return 0;
                }
            }
        }
    }
}

class IntervalNameBlock extends ValueBlock {
    constructor() {
        super('intervalname');
        this.setPalette('intervals');
        this.formBlock({ outType: 'numberout' });
    }
}

class MeasureIntervalSemitonesBlock extends LeftBlock {
    constructor() {
        super('measureintervalsemitones');
        this.setPalette('intervals');
        this.formBlock({
            //.TRANS: measure the distance between two pitches in semi-tones
            name: _('semi-tone interval measure'),
            flows: { labels: [''], type: 'flow' }
        });
    }

    arg(that, turtle, blk) {
        var cblk = that.blocks.blockList[blk].connections[1];
        if (cblk == null) {
            that.errorMsg(NOINPUTERRORMSG, blk);
            return 0;
        } else {
            var saveSuppressStatus = that.suppressOutput[turtle];

            // We need to save the state of the boxes and heap
            // although there is a potential of a boxes
            // collision with other turtles.
            var saveBoxes = JSON.stringify(that.boxes);
            var saveTurtleHeaps = JSON.stringify(that.turtleHeaps[turtle]);
            // And the turtle state
            var saveX = that.turtles.turtleList[turtle].x;
            var saveY = that.turtles.turtleList[turtle].y;
            var saveColor = that.turtles.turtleList[turtle].color;
            var saveValue = that.turtles.turtleList[turtle].value;
            var saveChroma = that.turtles.turtleList[turtle].chroma;
            var saveStroke = that.turtles.turtleList[turtle].stroke;
            var saveCanvasAlpha = that.turtles.turtleList[turtle].canvasAlpha;
            var saveOrientation = that.turtles.turtleList[turtle].orientation;
            var savePenState = that.turtles.turtleList[turtle].penState;

            that.suppressOutput[turtle] = true;

            that.justCounting[turtle].push(true);
            that.justMeasuring[turtle].push(true);

            for (var b in that.endOfClampSignals[turtle]) {
                that.butNotThese[turtle][b] = [];
                for (var i = 0; i < that.endOfClampSignals[turtle][b].length; i++) {
                    that.butNotThese[turtle][b].push(i);
                }
            }

            var actionArgs = [];
            var saveNoteCount = that.notesPlayed[turtle];
            that.turtles.turtleList[turtle].running = true;
            that._runFromBlockNow(that, turtle, cblk, true, actionArgs, that.turtles.turtleList[turtle].queue.length);
            if (that.firstPitch[turtle].length > 0 && that.lastPitch[turtle].length > 0) {
                return last(that.lastPitch[turtle]) - last(that.firstPitch[turtle]);
                that.firstPitch[turtle].pop();
                that.lastPitch[turtle].pop();
            } else {
                return 0;
                that.errorMsg(_('You must use two pitch blocks when measuring an interval.'));
            }

            that.notesPlayed[turtle] = saveNoteCount;

            // Restore previous state
            that.boxes = JSON.parse(saveBoxes);
            that.turtleHeaps[turtle] = JSON.parse(saveTurtleHeaps);

            that.turtles.turtleList[turtle].doPenUp();
            that.turtles.turtleList[turtle].doSetXY(saveX, saveY);
            that.turtles.turtleList[turtle].color = saveColor;
            that.turtles.turtleList[turtle].value = saveValue;
            that.turtles.turtleList[turtle].chroma = saveChroma;
            that.turtles.turtleList[turtle].stroke = saveStroke;
            that.turtles.turtleList[turtle].canvasAlpha = saveCanvasAlpha;
            that.turtles.turtleList[turtle].doSetHeading(saveOrientation);
            that.turtles.turtleList[turtle].penState = savePenState;

            that.justCounting[turtle].pop();
            that.justMeasuring[turtle].pop();
            that.suppressOutput[turtle] = saveSuppressStatus;

            // FIXME: we need to handle cascading.
            that.butNotThese[turtle] = {};
        }
    }
}

class MeasureIntervalScalarBlock extends LeftBlock {
    constructor() {
        super('measureintervalscalar');
        this.setPalette('intervals');
        this.formBlock({
            //.TRANS: measure the distance between two pitches in steps of musical scale
            name: _('scalar interval measure'),
            flows: { labels: [''], type: 'flow' }
        });
    }

    arg(that, turtle, blk) {
        var cblk = that.blocks.blockList[blk].connections[1];
        if (cblk == null) {
            that.errorMsg(NOINPUTERRORMSG, blk);
            return 0;
        } else {
            var saveSuppressStatus = that.suppressOutput[turtle];

            // We need to save the state of the boxes and heap
            // although there is a potential of a boxes
            // collision with other turtles.
            var saveBoxes = JSON.stringify(that.boxes);
            var saveTurtleHeaps = JSON.stringify(that.turtleHeaps[turtle]);
            // And the turtle state
            var saveX = that.turtles.turtleList[turtle].x;
            var saveY = that.turtles.turtleList[turtle].y;
            var saveColor = that.turtles.turtleList[turtle].color;
            var saveValue = that.turtles.turtleList[turtle].value;
            var saveChroma = that.turtles.turtleList[turtle].chroma;
            var saveStroke = that.turtles.turtleList[turtle].stroke;
            var saveCanvasAlpha = that.turtles.turtleList[turtle].canvasAlpha;
            var saveOrientation = that.turtles.turtleList[turtle].orientation;
            var savePenState = that.turtles.turtleList[turtle].penState;

            that.suppressOutput[turtle] = true;

            that.justCounting[turtle].push(true);
            that.justMeasuring[turtle].push(true);

            for (var b in that.endOfClampSignals[turtle]) {
                that.butNotThese[turtle][b] = [];
                for (var i = 0; i < that.endOfClampSignals[turtle][b].length; i++) {
                    that.butNotThese[turtle][b].push(i);
                }
            }

            var actionArgs = [];
            var saveNoteCount = that.notesPlayed[turtle];
            that.turtles.turtleList[turtle].running = true;
            that._runFromBlockNow(that, turtle, cblk, true, actionArgs, that.turtles.turtleList[turtle].queue.length);

            if (that.firstPitch[turtle].length > 0 && that.lastPitch[turtle].length > 0) {
                return that._scalarDistance(turtle, last(that.firstPitch[turtle]), last(that.lastPitch[turtle]));

                that.firstPitch[turtle].pop();
                that.lastPitch[turtle].pop();
            } else {
                return 0;
                that.errorMsg(_('You must use two pitch blocks when measuring an interval.'));
            }

            that.notesPlayed[turtle] = saveNoteCount;

            // Restore previous state
            that.boxes = JSON.parse(saveBoxes);
            that.turtleHeaps[turtle] = JSON.parse(saveTurtleHeaps);

            that.turtles.turtleList[turtle].doPenUp();
            that.turtles.turtleList[turtle].doSetXY(saveX, saveY);
            that.turtles.turtleList[turtle].color = saveColor;
            that.turtles.turtleList[turtle].value = saveValue;
            that.turtles.turtleList[turtle].chroma = saveChroma;
            that.turtles.turtleList[turtle].stroke = saveStroke;
            that.turtles.turtleList[turtle].canvasAlpha = saveCanvasAlpha;
            that.turtles.turtleList[turtle].doSetHeading(saveOrientation);
            that.turtles.turtleList[turtle].penState = savePenState;

            that.justCounting[turtle].pop();
            that.justMeasuring[turtle].pop();
            that.suppressOutput[turtle] = saveSuppressStatus;

            // FIXME: we need to handle cascading.
            that.butNotThese[turtle] = {};
        }
    }
}

function makeSemitoneIntervalMacroBlocks() {
    class SemitoneIntervalMacroBlock extends FlowBlock {
        constructor(type, value, isDown) {
            super((isDown ? 'down' : '') + type + value,
                  _((isDown ? 'down ' : '') + type) + ' ' + value);
            this.setPalette('intervals');
            this.makeMacro((x, y) => [
                [0, 'semitoneinterval', x, y, [null, 1, 6, 7]],
                ...[isDown
                    ? [1, 'minus', 0, 0, [0, 8, 3]]
                    : [1, 'plus', 0, 0, [0, 2, 3]]
                ],
                [2, ['intervalname', {'value': type + ' ' + value}], 0, 0, [1]],
                [3, 'multiply', 0, 0, [1, 4, 5]],
                [4, ['number', {'value': 0}], 0, 0, [3]],
                [5, ['number', {'value': 12}], 0, 0, [3]],
                [6, 'vspace', 0, 0, [0, null]],
                [7, 'hidden', 0, 0, [0, null]],
                ...(isDown ? [[8, 'neg', 0, 0, [1, 2]]] : [])
            ]);
        }
    }
    for (let i = 2; i <= 8; i++)
        new SemitoneIntervalMacroBlock('diminished', i).setup();
    for (let i = 1; i <= 8; i++)
        new SemitoneIntervalMacroBlock('augmented', i).setup();
    for (let i in [8, 5, 4])
        new SemitoneIntervalMacroBlock('perfect', i).setup();
    new SemitoneIntervalMacroBlock('minor', 6, true).setup();
    new SemitoneIntervalMacroBlock('minor', 3, true).setup();
    for (let i in [7, 6, 3, 2])
        new SemitoneIntervalMacroBlock('minor', i).setup();
    new SemitoneIntervalMacroBlock('major', 6, true).setup();
    new SemitoneIntervalMacroBlock('major', 3, true).setup();
    for (let i in [7, 6, 3, 2])
        new SemitoneIntervalMacroBlock('major', i).setup();
}

class PerfectBlock extends FlowClampBlock {
    constructor() {
        super('perfect');
        this.setPalette('intervals');
        this.formBlock({
            name: _('perfect'),
            args: 1, defaults: [5]
        });
        this.hidden = true;
    }
}

class SemitoneIntervalBlock extends FlowClampBlock {
    constructor() {
        super('semitoneinterval');
        this.setPalette('intervals');
        this.formBlock({
            //.TRANS: calculate a relative step between notes based on semi-tones
            name: _('semi-tone interval') + ' (+/–)',
            args: 1, defaults: [5]
        });
        this.makeMacro((x, y) => [
            [0, 'semitoneinterval', x, y, [null, 1, 6, 7]],
            [1, 'plus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 5}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, ['number', {'value': 12}], 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, null]],
            [7, 'hidden', 0, 0, [0, null]]
        ]);
    }

    flow(args, that, turtle, blk) {
        if (args[1] === undefined) {
            // Nothing to do.
            return;
        }

        let arg;
        if (args[0] === null || typeof(args[0]) !== 'number') {
            that.errorMsg(NOINPUTERRORMSG, blk);
            arg = 1;
        } else {
            arg = args[0];
        }

        let i = arg > 0 ? Math.floor(arg) : Math.ceil(arg);
        if (i !== 0) {
            that.semitoneIntervals[turtle].push([i, that.noteDirection[turtle]]);
            that.noteDirection[turtle] = 0;

            var listenerName = '_semitone_interval_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function () {
                that.semitoneIntervals[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
        }

        return [args[1], 1];
    }
}

function makeIntervalMacroBlocks() {
    class ChordIntervalMacroBlock extends FlowBlock {
        constructor(name, display, value1, value2) {
            super(name, display);
            this.setPalette('intervals');
            this.makeMacro((x, y) => [
                [0, 'interval', x, y, [null, 1, 3, 2]],
                [1, ['number', {'value': value1}], 0, 0, [0]],
                [2, 'hidden', 0, 0, [0, null]],
                [3, 'interval', 0, 0, [0, 4, 6, 5]],
                [4, ['number', {'value': value2}], 0, 0, [3]],
                [5, 'hidden', 0, 0, [3, null]],
                [6, ['newnote', {'collapsed': false}], 0, 0, [3, 7, 10, 14]],
                [7, 'divide', 0, 0, [6, 8, 9]],
                [8, ['number', {'value': 1}], 0, 0, [7]],
                [9, ['number', {'value': 1}], 0, 0, [7]],
                [10, 'vspace', 0, 0, [6, 11]],
                [11, 'pitch', 0, 0, [10, 12, 13, null]],
                [12, ['solfege', {'value': 'do'}], 0, 0, [11]],
                [13, ['number', {'value': 4}], 0, 0, [11]],
                [14, 'hidden', 0, 0, [6, null]]
            ]);
        }
    }
    class IntervalMacroBlock extends FlowBlock {
        constructor(name, value, down) {
            super((down ? 'down' : '') + name + 'interval', _((down ? 'down ' : '') + name));
            this.setPalette('intervals');
            this.makeMacro((x, y) => [
                [0, 'interval', x, y, [null, 1, 6, 8]],
                [1, down ? 'minus' : 'plus',  0, 0, [0, 2, 3]],
                [2, ['number', {'value':  value}], 0, 0, [1]],
                [3, 'multiply', 0, 0, [1, 4, 5]],
                [4, ['number', {'value': 0}], 0, 0, [3]],
                [5, 'modelength', 0, 0, [3]],
                [6, 'vspace', 0, 0, [0, 7]],
                [7, 'vspace', 0, 0, [6, null]],
                [8, 'hidden', 0, 0, [0, null]]
            ]);
        }
    }
    let lang = localStorage.languagePreference || navigator.language;

    new ChordIntervalMacroBlock('chordV',
        lang === 'ja' ? _('chord5') : (_('chord') + ' V'),
        3, 2).setup();
    new ChordIntervalMacroBlock('chordIV',
        lang === 'ja' ? _('chord4') : (_('chord') + ' IV'),
        5, 2).setup();
    new ChordIntervalMacroBlock('chordI',
        lang === 'ja' ? _('chord1') : (_('chord') + ' I'),
        4, 2).setup();

    //.TRANS: down <n>th means the note is <n - 1> scale degrees below current note
    //.TRANS: <n>th means the note is the <n - 1> scale degrees above current note
    new IntervalMacroBlock('sixth', -5, true).setup();
    new IntervalMacroBlock('third', -2, true).setup();
    new IntervalMacroBlock('seventh', 6, true).setup();
    new IntervalMacroBlock('sixth', 5, true).setup();
    new IntervalMacroBlock('fifth', 4, true).setup();
    new IntervalMacroBlock('fourth', 3, true).setup();
    new IntervalMacroBlock('third', 2, true).setup();
    new IntervalMacroBlock('second', 1, true).setup();
    new IntervalMacroBlock('unison', 0, true).setup();
}

class ScalarIntervalBlock extends FlowClampBlock {
    constructor() {
        super('interval');
        this.setPalette('intervals');
        this.formBlock({
            //.TRANS: calculate a relative step between notes based on semi-tones
            name: _('scalar interval') + ' (+/–)',
            args: 1, defaults: [5]
        });
        this.makeMacro((x, y) => [
            [0, 'interval', x, y, [null, 1, null, 2]],
            [1, ['number', {'value': 5}], 0, 0, [0]],
            [2, 'hidden', 0, 0, [0, null]]
        ]);
    }

    flow(args, that, turtle, blk, receivedArg, actionArgs, isflow) {
        if (args[1] === undefined) {
            // Nothing to do.
            return;
        }

        let arg;
        if (args[0] === null || typeof(args[0]) !== 'number') {
            that.errorMsg(NOINPUTERRORMSG, blk);
            arg = 1;
        } else {
            arg = args[0];
        }

        let i = arg > 0 ? Math.floor(arg) : Math.ceil(arg);
        that.intervals[turtle].push(i);

        var listenerName = '_interval_' + turtle;
        that._setDispatchBlock(blk, turtle, listenerName);

        var __listener = function (event) {
            that.intervals[turtle].pop();
        };

        that._setListener(turtle, listenerName, __listener);

        return [args[1], 1];
    }
}

class DefineModeBlock extends FlowClampBlock {
    constructor() {
        super('definemode');
        this.setPalette('intervals');
        this.formBlock({
            //.TRANS: define a custom mode
            name: _('define mode'),
            args: 1, argTypes: ['textin'], defaults: _('custom')
        });
        this.makeMacro((x, y) => [
            [0, 'definemode', x, y, [null, 1, 2, 16]],
            [1, ['modename', {'value': 'custom'}], 0, 0, [0]],
            [2, 'pitchnumber', 0, 0, [0, 3, 4]],
            [3, ['number', {'value': 0}], 0, 0, [2]],
            [4, 'pitchnumber', 0, 0, [2, 5, 6]],
            [5, ['number', {'value': 2}], 0, 0, [4]],
            [6, 'pitchnumber', 0, 0, [4, 7, 8]],
            [7, ['number', {'value': 4}], 0, 0, [6]],
            [8, 'pitchnumber', 0, 0, [6, 9, 10]],
            [9, ['number', {'value': 5}], 0, 0, [8]],
            [10, 'pitchnumber', 0, 0, [8, 11, 12]],
            [11, ['number', {'value': 7}], 0, 0, [10]],
            [12, 'pitchnumber', 0, 0, [10, 13, 14]],
            [13, ['number', {'value': 9}], 0, 0, [12]],
            [14, 'pitchnumber', 0, 0, [12, 15, null]],
            [15, ['number', {'value': 11}], 0, 0, [14]],
            [16, 'hidden', 0, 0, [0, null]]
        ]);
    }

    flow(args, that, turtle, blk) {
        if (args[1] === undefined) {
            // nothing to do
            return;
        }

        that.inDefineMode[turtle] = true;
        that.defineMode[turtle] = [];

        if (args[0] === null) {
            that.errorMsg(NOINPUTERRORMSG, blk);
            var modeName = 'custom';
        } else {
            var modeName = args[0].toLowerCase();
        }

        var listenerName = '_definemode_' + turtle;
        that._setDispatchBlock(blk, turtle, listenerName);

        var __listener = function (event) {
            MUSICALMODES[modeName] = [];
            if (that.defineMode[turtle].indexOf(0) === -1) {
                that.defineMode[turtle].push(0);
                that.errorMsg(_('Adding missing pitch number 0.'));
            }

            var pitchNumbers = that.defineMode[turtle].sort(
                function(a, b) {
                    return a[0] - b[0];
                });

            for (var i = 0; i < pitchNumbers.length; i++) {
                if (pitchNumbers[i] < 0 || pitchNumbers[i] > 11) {
                    that.errorMsg(_('Ignoring pitch numbers less than zero or greater than eleven.'));
                    continue;
                }

                if (i > 0 && pitchNumbers[i] === pitchNumbers[i - 1]) {
                    that.errorMsg(_('Ignoring duplicate pitch numbers.'));
                    continue;
                }

                if (i < pitchNumbers.length - 1) {
                    MUSICALMODES[modeName].push(pitchNumbers[i + 1] - pitchNumbers[i]);
                } else {
                    MUSICALMODES[modeName].push(12 - pitchNumbers[i]);
                }
            }

            var cblk = that.blocks.blockList[blk].connections[1];
            if (that.blocks.blockList[cblk].name === 'modename') {
                that.blocks.updateBlockText(cblk);
            }

            that.inDefineMode[turtle] = false;
        };

        that._setListener(turtle, listenerName, __listener);

        return [args[1], 1];
    }
}

class MoveableBlock extends FlowBlock {
    constructor() {
        super('movable', _('moveable Do'));  // legacy typo
        this.setPalette('intervals');
        this.formBlock({
            args: 1, argTypes: ['booleanin']
        });
        this.makeMacro((x, y) => [
            [0, 'movable', x, y, [null, 1, null]],
            [1, ['boolean', {'value':  true}], 0, 0, [0]]
        ]);
    }

    flow(args, that, turtle) {
        if (args.length === 1) {
            that.moveable[turtle] = args[0];
        }
    }
}

class ModeLengthBlock extends ValueBlock {
    constructor() {
        //.TRANS:  mode length is the number of notes in the mode, e.g., 7 for major and minor scales; 12 for chromatic scales
        super('modelength', _('mode length'));
        this.setPalette('intervals');
    }

    arg(that, turtle, blk) {
        if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
            that.statusFields.push([blk, 'modelength']);
        } else {
            return getModeLength(that.keySignature[turtle]);
        }
    }
}

class CurrentModeBlock extends ValueBlock {
    constructor() {
        //.TRANS: the mode in music is 'major', 'minor', etc.
        super('currentmode', _('current mode'));
        this.setPalette('intervals');
    }

    arg(that, turtle, blk) {
        if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
            that.statusFields.push([blk, 'currentmode']);
        } else {
            var obj = that.keySignature[turtle].split(' ');
            return obj[1];
        }
    }
}

class KeyBlock extends ValueBlock {
    constructor() {
        //.TRANS: the key is a group of pitches with which a music composition is created
        super('key', _('current key'));
        this.setPalette('intervals');
    }

    arg(that, turtle, blk) {
        if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
            that.statusFields.push([blk, 'key']);
        } else {
            return that.keySignature[turtle][0];
        }
    }
}

class SetKeyBlock extends FlowBlock {
    constructor() {
        //.TRANS: set the key and mode, e.g. C Major
        super('setkey', _('set key'));
        this.setPalette('intervals');
        this.formBlock({
            args: 1, argTypes: ['textin'], defaults: ['C']
        });
        this.hidden = true;
        this.deprecated = true;
    }

    flow(args, that, turtle) {
        if (args.length === 1) {
            that.keySignature[turtle] = args[0];
        }
    }
}

class SetKey2Block extends FlowBlock {
    constructor() {
        //.TRANS: set the key and mode, e.g. C Major
        super('setkey2', _('set key'));
        this.setPalette('intervals');
        this.formBlock({
            args: 2, argTypes: ['anyin', 'anyin'],
            argLabels: [
                //.TRANS: key, e.g., C in C Major
                _('key'),
                //.TRANS: mode, e.g., Major in C Major
                _('mode')
            ]
        });
        this.makeMacro((x, y) => [
            [0, 'setkey2', x, y, [null, 1, 2, null]],
            [1, ['notename', {'value': 'C'}], 0, 0, [0]],
            [2, ['modename', {'value': 'major'}], 0, 0, [0]]
        ]);
    }

    flow(args, that, turtle, blk) {
        if (args.length === 2) {
            var modename = 'major';
            for (var mode in MUSICALMODES) {
                if (mode === args[1] || _(mode) === args[1]) {
                    modename = mode;
                    that._modeBlock = that.blocks.blockList[blk].connections[2];
                    break;
                }
            }

            // Check to see if there are any transpositions on the key.
            if (turtle in that.transposition) {
                var noteObj = getNote(args[0], 4, that.transposition[turtle], that.keySignature[turtle], false, null, that.errorMsg, that.synth.inTemperament);
                that.keySignature[turtle] = noteObj[0] + ' ' + modename;
                that.notationKey(turtle, noteObj[0], modename);
            } else {
                that.keySignature[turtle] = args[0] + ' ' + modename;
                that.notationKey(turtle, args[0], modename);
            }

            if (that.insideModeWidget) {
                // Ensure that the mode for Turtle 0 is set, since it
                // is used by the mode widget.
                that.keySignature[0] = args[0] + ' ' + modename;
                that.notationKey(0, args[0], modename);
            }
        }
    }
}

function setupIntervalsBlocks() {
    new SetTemperamentBlock().setup();
    new TemperamentNameBlock().setup();
    new ModeNameBlock().setup();
    new DoublyBlock().setup();
    new IntervalNameBlock().setup();
    new MeasureIntervalSemitonesBlock().setup();
    new MeasureIntervalScalarBlock().setup();
    makeSemitoneIntervalMacroBlocks();
    new PerfectBlock().setup();
    new SemitoneIntervalBlock().setup();
    makeIntervalMacroBlocks();
    new ScalarIntervalBlock().setup();
    new DefineModeBlock().setup();
    new MoveableBlock().setup();
    new ModeLengthBlock().setup();
    new CurrentModeBlock().setup();
    new KeyBlock().setup();
    new SetKeyBlock().setup();
    new SetKey2Block().setup();
}