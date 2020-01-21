function _playSynthBlock(args, logo, turtle, blk) {
    if (args.length === 1) {
        var obj = frequencyToPitch(args[0]);
        // obj[2] is cents
        if (logo.inMatrix) {
            logo.pitchTimeMatrix.addRowBlock(blk);
            if (logo.pitchBlocks.indexOf(blk) === -1) {
                logo.pitchBlocks.push(blk);
            }

            logo.pitchTimeMatrix.rowLabels.push(logo.blocks.blockList[blk].name);
            logo.pitchTimeMatrix.rowArgs.push(args[0]);
        } else if (logo.inPitchSlider) {
            logo.pitchSlider.Sliders.push([args[0], 0, 0]);
        } else {
            logo.oscList[turtle][last(logo.inNoteBlock[turtle])].push(logo.blocks.blockList[blk].name);

            // We keep track of pitch and octave for notation purposes.
            logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(obj[0]);
            logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(obj[1]);
            logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(obj[2]);
            if (obj[2] !== 0) {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(pitchToFrequency(obj[0], obj[1], obj[2], logo.keySignature[turtle]));
            } else {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(0);
            }

            logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])].push(logo.beatFactor[turtle]);
            logo.pushedNote[turtle] = true;
        }
    }
}

function _playPitch(args, logo, turtle, blk) {
    var useSolfegeName = false;
    if (logo.blocks.blockList[blk].name === 'pitchnumber') {
        if (args.length !== 1 || args[0] == null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg0 = 7;
        } else {
            var arg0 = args[0];
        }

        if (typeof(arg0) !== 'number') {
            logo.errorMsg(NANERRORMSG, blk);
            arg0 = 7;
        }

        if (logo.inDefineMode[turtle]) {
            logo.defineMode[turtle].push(Math.floor(arg0));
            return;
        } else {
            // In number to pitch we assume A0 == 0. Here we
            // assume logo C4 == 0, so we need an offset of 39.
            var obj = numberToPitch(Math.floor(arg0 + logo.pitchNumberOffset[turtle]), logo.synth.inTemperament, logo.synth.startingPitch, logo.pitchNumberOffset[turtle]);

            if (logo.synth.inTemperament == 'custom' && (logo.scalarTransposition[turtle] + logo.transposition[turtle]) !== 0) {
                logo.errorMsg(_('Scalar transpositions are equal to Semitone transpositions for custom temperament.'));
            }

            note = obj[0];
            octave = obj[1];
            cents = 0;
            logo.currentNote = note;
        }
    } else if (logo.blocks.blockList[blk].name === 'customNote') {
        if (args[0] == null || args[1] == null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            logo.stopTurtle = true;
            return;
        } else {
            note = args[0];
            octave = args[1];
        }
    } else {
        if (args[0] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg0 = 'sol';
        } else {
            var arg0 = args[0];
        }

        if (args[1] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg1 = 4;
        } else {
            var arg1 = args[1];
        }

        if (typeof(arg0) === 'number' && logo.blocks.blockList[blk].name === 'pitch') {
            // We interpret numbers two different ways:
            // (1) a positive integer between 1 and 12 is taken to be
            // a moveable solfege, e.g., 1 == do; 2 == re...
            // (2) if frequency is input, ignore octave (arg1).
            // Negative numbers will throw an error.
            if (arg0 < 13) { // moveable solfege
                if (arg0 < 1) {
                    console.debug(arg0);
                    logo.errorMsg(INVALIDPITCH, blk);
                    arg0 = 7;  // throws an error
                }

                note = scaleDegreeToPitch(logo.keySignature[turtle], Math.floor(arg0));
                logo.currentNote = note;
                var octave = Math.floor(calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], logo.currentNote));
                var cents = 0;
            } else {
                if (arg0 < A0 || arg0 > C8) {
                    logo.errorMsg(INVALIDPITCH, blk);
                    console.debug(arg0);
                    arg0 = 398;
                }

                var obj = frequencyToPitch(arg0);
                var note = obj[0];
                logo.currentNote = note;
                var octave = obj[1];
                var cents = obj[2];
            }
        } else if (typeof(arg0) === 'number' && logo.blocks.blockList[blk].name == 'scaledegree') {
            //  (0, 4) --> ti 3; (-1, 4) --> la 3, (-6, 4) --> do 3
            //  (1, 4) --> do 4; ( 2, 4) --> re 4; ( 8, 4) --> do 5
            if (arg0 < 1) {
                arg0 -= 2;
            }

            if (arg0 < 0) {
                var neg = true;
                arg0 = -arg0;
            } else {
                var neg = false;
            }

            if (arg0 === 0) {
                console.debug(arg0);
                logo.errorMsg(INVALIDPITCH, blk);
                note = 7;
            }

            var obj = keySignatureToMode(logo.keySignature[turtle]);
            var modeLength = MUSICALMODES[obj[1]].length;
            var scaleDegree = Math.floor(arg0 - 1) % modeLength;
            scaleDegree += 1;

            if (neg) {
                if (scaleDegree > 1) {
                    scaleDegree = modeLength - scaleDegree + 2;
                }

                note = scaleDegreeToPitch(logo.keySignature[turtle], scaleDegree);
                logo.currentNote = note;
                var deltaOctave = Math.floor((arg0 + modeLength - 2) / modeLength);
                var octave = Math.floor(calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], logo.currentNote)) - deltaOctave;
            } else {
                note = scaleDegreeToPitch(logo.keySignature[turtle], scaleDegree);
                logo.currentNote = note;
                var deltaOctave = Math.floor((arg0 - 1) / modeLength);
                var octave = Math.floor(calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], logo.currentNote)) + deltaOctave;
            }

            console.debug('logo.currentNote = ' + logo.currentNote);
            var cents = 0;
        } else {
            var cents = 0;
            var note = arg0;
            if (SOLFEGENAMES.indexOf(arg0) !== -1 || SOLFEGENAMES.indexOf(arg0) !== -1) {
                useSolfegeName = true;
            }

            logo.currentNote = note;
            if (calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], logo.currentNote) < 0) {
                console.debug('minimum allowable octave is 0');
                var octave = 0;
            } else if (calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], logo.currentNote) > 9) {
                // Humans can only hear 10 octaves.
                console.debug('clipping octave at 9');
                var octave = 9;
            } else {
                // Octave must be a whole number.
                var octave = Math.floor(calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], logo.currentNote));
            }
        }
    }

    var noteObj = logo._addScalarTransposition(turtle, note, octave, logo.scalarTransposition[turtle]);
    note = noteObj[0];
    logo.currentNote = note;
    octave = noteObj[1];

    if (logo.inNeighbor[turtle].length > 0) {
        var noteObj = getNote(note, octave, logo.transposition[turtle], logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
        logo.neighborArgNote1[turtle].push(noteObj[0] + noteObj[1]);
        if (logo.blocks.blockList[last(logo.inNeighbor[turtle])].name === 'neighbor2') {
            var noteObj2 = logo._addScalarTransposition(turtle, note, octave, parseInt(logo.neighborStepPitch[turtle]));
            if (logo.transposition[turtle] !== 0) {
                noteObj2 = getNote(noteObj2[0], noteObj2[1], logo.transposition[turtle], logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
            }
        } else {
            var noteObj2 = getNote(note, octave, logo.transposition[turtle] + parseInt(logo.neighborStepPitch[turtle]), logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
        }
        logo.neighborArgNote2[turtle].push(noteObj2[0] + noteObj2[1]);
    }

    var delta = 0;

    if (logo.justMeasuring[turtle].length > 0) {
        var transposition = 2 * delta;
        if (turtle in logo.transposition) {
            transposition += logo.transposition[turtle];
        }

        var noteObj = getNote(note, octave, transposition, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
        if (!logo.validNote) {
            logo.errorMsg(INVALIDPITCH, blk);
            logo.stopTurtle = true;
            return;
        }

        var n = logo.justMeasuring[turtle].length;
        var pitchNumber = pitchToNumber(noteObj[0], noteObj[1], logo.keySignature[turtle]) - logo.pitchNumberOffset[turtle];
        if (logo.firstPitch[turtle].length < n) {
            logo.firstPitch[turtle].push(pitchNumber);
        } else if (logo.lastPitch[turtle].length < n) {
            logo.lastPitch[turtle].push(pitchNumber);
        }
    } else if (logo.inPitchDrumMatrix) {
        if (note.toLowerCase() !== 'rest') {
            logo.pitchDrumMatrix.addRowBlock(blk);
            if (logo.pitchBlocks.indexOf(blk) === -1) {
                logo.pitchBlocks.push(blk);
            }
        }

        if (!(logo.invertList[turtle].length === 0)) {
            delta += logo._calculateInvert(turtle, note, octave);
        }

        if (logo.duplicateFactor[turtle].length > 0) {
            var duplicateFactor = logo.duplicateFactor[turtle];
        } else {
            var duplicateFactor = 1;
        }

        for (var i = 0; i < duplicateFactor; i++) {
            // Apply transpositions
            var transposition = 2 * delta;
            if (turtle in logo.transposition) {
                transposition += logo.transposition[turtle];
            }

            var nnote = getNote(note, octave, transposition, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
            if (noteIsSolfege(note)) {
                nnote[0] = getSolfege(nnote[0]);
            }

            if (logo.drumStyle[turtle].length > 0) {
                logo.pitchDrumMatrix.drums.push(last(logo.drumStyle[turtle]));
            } else {
                logo.pitchDrumMatrix.rowLabels.push(nnote[0]);
                logo.pitchDrumMatrix.rowArgs.push(nnote[1]);
            }
        }
    } else if (logo.inMatrix) {
        if (note.toLowerCase() !== 'rest') {
            logo.pitchTimeMatrix.addRowBlock(blk);
            if (logo.pitchBlocks.indexOf(blk) === -1) {
                logo.pitchBlocks.push(blk);
            }
        }

        if (!(logo.invertList[turtle].length === 0)) {
            delta += logo._calculateInvert(turtle, note, octave);
        }

        if (logo.duplicateFactor[turtle].length > 0) {
            var duplicateFactor = logo.duplicateFactor[turtle];
        } else {
            var duplicateFactor = 1;
        }

        for (var i = 0; i < duplicateFactor; i++) {
            var transposition = 2 * delta;
            if (turtle in logo.transposition) {
                transposition += logo.transposition[turtle];
            }

            var noteObj = getNote(note, octave, transposition, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
            logo.previousNotePlayed[turtle] = logo.lastNotePlayed[turtle];
            logo.lastNotePlayed[turtle] = [noteObj[0] + noteObj[1], 4];

            if (logo.keySignature[turtle][0] === 'C' && logo.keySignature[turtle][1].toLowerCase() === 'major' && noteIsSolfege(note)) {
                noteObj[0] = getSolfege(noteObj[0]);
            }

            // If we are in a setdrum clamp, override the pitch.
            if (logo.drumStyle[turtle].length > 0) {
                logo.pitchTimeMatrix.rowLabels.push(last(logo.drumStyle[turtle]));
                logo.pitchTimeMatrix.rowArgs.push(-1);
            } else {
                // Was the pitch arg a note name or solfege name?
                if (useSolfegeName && noteObj[0] in SOLFEGECONVERSIONTABLE) {
                    logo.pitchTimeMatrix.rowLabels.push(SOLFEGECONVERSIONTABLE[noteObj[0]]);
                } else {
                    logo.pitchTimeMatrix.rowLabels.push(noteObj[0]);
                }

                logo.pitchTimeMatrix.rowArgs.push(noteObj[1]);
            }
        }
    } else if (logo.inNoteBlock[turtle].length > 0) {

        function addPitch(note, octave, cents, direction) {
            t = transposition + logo.register[turtle] * 12;
            var noteObj = getNote(note, octave, t, logo.keySignature[turtle], logo.moveable[turtle], direction, logo.errorMsg, logo.synth.inTemperament);
            if (!logo.validNote) {
                logo.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
            }

            if (logo.drumStyle[turtle].length > 0) {
                var drumname = last(logo.drumStyle[turtle]);
                logo.pitchDrumTable[turtle][noteObj[0] + noteObj[1]] = drumname;
            }

            logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[0]);
            logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[1]);
            logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(cents);
            if (cents !== 0) {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(pitchToFrequency(noteObj[0], noteObj[1], cents, logo.keySignature[turtle]));
            } else {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(0);
            }

            return noteObj;
        }

        if (!(logo.invertList[turtle].length === 0)) {
            delta += logo._calculateInvert(turtle, note, octave);
        }

        var transposition = 2 * delta;
        if (turtle in logo.transposition) {
            transposition += logo.transposition[turtle];
        }

        var noteObj1 = addPitch(note, octave, cents);
        // Only apply the transposition to the base note of an interval
        transposition = 0;

        if (turtle in logo.intervals && logo.intervals[turtle].length > 0) {
            for (var i = 0; i < logo.intervals[turtle].length; i++) {
                var ii = getInterval(logo.intervals[turtle][i], logo.keySignature[turtle], noteObj1[0]);
                var noteObj2 = getNote(noteObj1[0], noteObj1[1], ii, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
                addPitch(noteObj2[0], noteObj2[1], cents);
            }
        }

        if (turtle in logo.semitoneIntervals && logo.semitoneIntervals[turtle].length > 0) {
            for (var i = 0; i < logo.semitoneIntervals[turtle].length; i++) {
                var noteObj2 = getNote(noteObj1[0], noteObj1[1], logo.semitoneIntervals[turtle][i][0], logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
                addPitch(noteObj2[0], noteObj2[1], cents, logo.semitoneIntervals[turtle][i][1]);
            }
        }

        if (logo.inNoteBlock[turtle].length > 0) {
            logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])].push(logo.beatFactor[turtle]);
        }

        logo.pushedNote[turtle] = true;
    } else if (logo.drumStyle[turtle].length > 0) {
        var drumname = last(logo.drumStyle[turtle]);
        var noteObj1 = getNote(note, octave, transposition, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg);
        logo.pitchDrumTable[turtle][noteObj1[0] + noteObj1[1]] = drumname;
    } else if (logo.inPitchStaircase) {
        var frequency = pitchToFrequency(arg0, calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], arg0), 0, logo.keySignature[turtle]);
        var noteObj1 = getNote(arg0, calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], arg0), 0, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg);

        var flag = 0;

        for (var i = 0 ; i < logo.pitchStaircase.Stairs.length; i++) {
            if (logo.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                logo.pitchStaircase.Stairs.splice(i, 0, [noteObj1[0], noteObj1[1], parseFloat(frequency), 1, 1]);
                flag = 1;
                return;
            }

            if (logo.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                logo.pitchStaircase.Stairs.splice(i, 1, [noteObj1[0], noteObj1[1], parseFloat(frequency), 1, 1]);
                flag = 1;
                return;
            }
        }

        if (flag === 0) {
            logo.pitchStaircase.Stairs.push([noteObj1[0], noteObj1[1], parseFloat(frequency), 1, 1]);
        }

        logo.pitchStaircase.stairPitchBlocks.push(blk);
    } else if (logo.inMusicKeyboard) {
        if (!(logo.invertList[turtle].length === 0)) {
            delta += logo._calculateInvert(turtle, note, octave);
        }

        // Apply transpositions
        var transposition = 2 * delta;
        if (turtle in logo.transposition) {
            transposition += logo.transposition[turtle];
        }

        var nnote = getNote(note, octave, transposition, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg);
        if (noteIsSolfege(note)) {
            nnote[0] = getSolfege(nnote[0]);
        }

        if (logo.drumStyle[turtle].length === 0) {
            logo.musicKeyboard.instruments.push(last(logo.instrumentNames[turtle]));
            logo.musicKeyboard.noteNames.push(nnote[0]);
            logo.musicKeyboard.octaves.push(nnote[1]);
            logo.musicKeyboard.addRowBlock(blk);
            logo.lastNotePlayed[turtle] = [noteObj[0] + noteObj[1], 4];
        }
    } else {
        if (true) { // logo.blocks.blockList[blk].connections[0] == null && last(logo.blocks.blockList[blk].connections) == null) {
            // Play a stand-alone pitch block as a quarter note.
            logo.clearNoteParams(turtle, blk, []);
            if (logo.currentCalculatedOctave[turtle] == undefined) {
                logo.currentCalculatedOctave[turtle] = 4;
            }

            if (logo.blocks.blockList[blk].name == 'scaledegree') {
                var noteObj = getNote(logo.currentNote, calcOctave(logo.currentCalculatedOctave[turtle], arg1, logo.lastPitchPlayed[turtle], logo.currentNote), 0, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg);
            } else {
                var noteObj = getNote(arg0, calcOctave(logo.currentCalculatedOctave[turtle], arg1, logo.lastPitchPlayed[turtle], arg0), 0, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg);
            }

            if (!logo.validNote) {
                logo.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
            }

            logo.inNoteBlock[turtle].push(blk);
            logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[0]);
            logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[1]);
            logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(cents);
            if (cents !== 0) {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(pitchToFrequency(noteObj[0], noteObj[1], cents, logo.keySignature[turtle]));
            } else {
                logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(0);
            }

            if (logo.bpm[turtle].length > 0) {
                var bpmFactor = TONEBPM / last(logo.bpm[turtle]);
            } else {
                var bpmFactor = TONEBPM / logo._masterBPM;
            }

            var noteBeatValue = 4;
            var beatValue = bpmFactor / noteBeatValue;

            __callback = function () {
                var j = logo.inNoteBlock[turtle].indexOf(blk);
                logo.inNoteBlock[turtle].splice(j, 1);
            };

            logo._processNote(noteBeatValue, blk, turtle, __callback);
        } else {
            logo.errorMsg(_('Pitch Block: Did you mean to use a Note block?'), blk);
        }
    }
}

class RestBlock extends ValueBlock {
    constructor() {
        super('rest');
        this.setPalette('pitch');
        this.hidden = this.deprecated = true;
    }
}

class SquareBlock extends FlowBlock {
    constructor() {
        //.TRANS: square wave
        super('square', _('square'));
        this.setPalette('pitch');
        this.formBlock({ args: 1, defaults: [440] });
        this.makeMacro((x, y) => [
            [0, 'newnote', x, y, [null, 1, 4, 7]],
            [1, 'divide', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 1}], 0, 0, [1]],
            [3, ['number', {'value': 4}], 0, 0, [1]],
            [4, 'vspace', 0, 0, [0, 5]],
            [5, 'square', 0, 0, [4, 6, null]],
            [6, ['number', {'value': 392}], 0, 0, [5]],
            [7, 'hidden', 0, 0, [0, null]]
        ]);
        this.hidden = this.deprecated = true;
    }

    flow(args, logo, turtle, blk) {
        _playSynthBlock(args, logo, turtle, blk)
    }
}

class TriangleBlock extends FlowBlock {
    constructor() {
        //.TRANS: triangle wave
        super('triangle', _('triangle'));
        this.setPalette('pitch');
        this.formBlock({ args: 1, defaults: [440] });
        this.makeMacro((x, y) => [
            [0, 'newnote', x, y, [null, 1, 4, 7]],
            [1, 'divide', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 1}], 0, 0, [1]],
            [3, ['number', {'value': 4}], 0, 0, [1]],
            [4, 'vspace', 0, 0, [0, 5]],
            [5, 'triangle', 0, 0, [4, 6, null]],
            [6, ['number', {'value': 392}], 0, 0, [5]],
            [7, 'hidden', 0, 0, [0, null]]
        ]);
        this.hidden = this.deprecated = true;
    }

    flow(args, logo, turtle, blk) {
        _playSynthBlock(args, logo, turtle, blk)
    }
}

class SineBlock extends FlowBlock {
    constructor() {
        //.TRANS: sine wave
        super('sine', _('sine'));
        this.setPalette('pitch');
        this.formBlock({ args: 1, defaults: [440] });
        this.makeMacro((x, y) => [
            [0, 'newnote', x, y, [null, 1, 4, 7]],
            [1, 'divide', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 1}], 0, 0, [1]],
            [3, ['number', {'value': 4}], 0, 0, [1]],
            [4, 'vspace', 0, 0, [0, 5]],
            [5, 'sine', 0, 0, [4, 6, null]],
            [6, ['number', {'value': 392}], 0, 0, [5]],
            [7, 'hidden', 0, 0, [0, null]]
        ]);
        this.hidden = this.deprecated = true;
    }

    flow(args, logo, turtle, blk) {
        _playSynthBlock(args, logo, turtle, blk)
    }
}

class SawtoothBlock extends FlowBlock {
    constructor() {
        //.TRANS: sawtooth wave
        super('sawtooth', _('sawtooth'));
        this.setPalette('pitch');
        this.formBlock({ args: 1, defaults: [440] });
        this.makeMacro((x, y) => [
            [0, 'newnote', x, y, [null, 1, 4, 7]],
            [1, 'divide', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 1}], 0, 0, [1]],
            [3, ['number', {'value': 4}], 0, 0, [1]],
            [4, 'vspace', 0, 0, [0, 5]],
            [5, 'sawtooth', 0, 0, [4, 6, null]],
            [6, ['number', {'value': 392}], 0, 0, [5]],
            [7, 'hidden', 0, 0, [0, null]]
        ]);
        this.hidden = this.deprecated = true;
    }

    flow(args, logo, turtle, blk) {
        _playSynthBlock(args, logo, turtle, blk)
    }
}

class InvertModeBlock extends ValueBlock {
    constructor() {
        super('invertmode');
        this.setPalette('pitch');
        this.formBlock({ outType: 'textout' });
        this.hidden = true;
    }
}

class TranspositionFactorBlock extends ValueBlock {
    constructor() {
        //.TRANS: musical transposition (adjustment of pitch up or down)
        super('transpositionfactor', _('transposition'));
        this.setPalette('pitch');
        this.hidden = true;
    }

    arg(logo, turtle, blk) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'transposition']);
        } else {
            return logo.transposition[turtle];
        }
    }
}

class ConsonantStepSizeDownBlock extends ValueBlock {
    constructor() {
        //.TRANS: step down one note in current musical scale
        super('constonantstepsizedown', _('scalar step down'));
        this.setPalette('pitch');
    }

    arg(logo, turtle) {
        if (logo.lastNotePlayed[turtle] !== null) {
            var len = logo.lastNotePlayed[turtle][0].length;
            return getStepSizeDown(logo.keySignature[turtle], logo.lastNotePlayed[turtle][0].slice(0, len - 1));
        } else {
            return getStepSizeDown(logo.keySignature[turtle], 'A');
        }
    }
}

class ConsonantStepSizeUpBlock extends ValueBlock {
    constructor() {
        //.TRANS: step up one note in current musical scale
        super('consonantstepsizeup', _('scalar step up'));
        this.setPalette('pitch');
    }

    arg(logo, turtle) {
        if (logo.lastNotePlayed[turtle] !== null) {
            var len = logo.lastNotePlayed[turtle][0].length;
            return getStepSizeUp(logo.keySignature[turtle], logo.lastNotePlayed[turtle][0].slice(0, len - 1));
        } else {
            return getStepSizeUp(logo.keySignature[turtle], 'A');
        }
    }
}

class DeltaPitchBlock extends ValueBlock {
    constructor(name, displayName) {
        //.TRANS: the change measured in half-steps between the current pitch and the previous pitch
        super(name || 'deltapitch', displayName || _('change in pitch'));
        this.setPalette('pitch');
    }

    arg(logo, turtle, blk) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'mypitch']);
        } else if (logo.previousNotePlayed[turtle] == null) {
            return 0;
        } else {
            var len = logo.previousNotePlayed[turtle][0].length;
            var pitch = logo.previousNotePlayed[turtle][0].slice(0, len - 1);
            var octave = parseInt(logo.previousNotePlayed[turtle][0].slice(len - 1));
            var obj = [pitch, octave];
            var previousValue = pitchToNumber(obj[0], obj[1], logo.keySignature[turtle]);
            len = logo.lastNotePlayed[turtle][0].length;
            pitch = logo.lastNotePlayed[turtle][0].slice(0, len - 1);
            octave = parseInt(logo.lastNotePlayed[turtle][0].slice(len - 1));
            obj = [pitch, octave];
            var delta = pitchToNumber(obj[0], obj[1], logo.keySignature[turtle]) - previousValue;
            if (logo.blocks.blockList[blk].name === 'deltapitch') {
                // half-step difference
                return delta;
            } else {
                // convert to scalar steps
                var scalarDelta = 0;
                var i = 0;
                if (delta > 0) {
                    while(delta > 0) {
                        i += 1;
                        var nhalf = getStepSizeUp(logo.keySignature[turtle], pitch, 0, 'equal');
                        delta -= nhalf;
                        scalarDelta += 1;
                        obj = getNote(pitch, octave, nhalf, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
                        pitch = obj[0];
                        octave = obj[1];
                        if (i > 100) {
                            return;
                        }
                    }

                    return scalarDelta;
                } else {
                    while(delta < 0) {
                        i += 1;
                        var nhalf = getStepSizeDown(logo.keySignature[turtle], pitch, 0, 'equal');
                        delta -= nhalf;
                        scalarDelta -= 1;
                        obj = getNote(pitch, octave, nhalf, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
                        pitch = obj[0];
                        octave = obj[1];
                        if (i > 100) {
                            return;
                        }
                    }
                    return scalarDelta;
                }
            }
        }
    }
}

class DeltaPitch2Block extends DeltaPitchBlock {
    constructor() {
        //.TRANS: the change measured in scale-steps between the current pitch and the previous pitch
        super('deltapitch2', _('scalar change in pitch'));
    }
}

class MyPitchBlock extends ValueBlock {
    constructor() {
        //.TRANS: convert current note to piano key (1-88)
        super('mypitch', _('pitch number'));
        this.setPalette('pitch');
    }

    arg(logo, turtle, blk) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'mypitch']);
        } else {
            var value = null;
            if (logo.lastNotePlayed[turtle] !== null) {
                if (typeof(logo.lastNotePlayed[turtle][0]) === 'string') {
                    var len = logo.lastNotePlayed[turtle][0].length;
                    var pitch = logo.lastNotePlayed[turtle][0].slice(0, len - 1);
                    var octave = parseInt(logo.lastNotePlayed[turtle][0].slice(len - 1));
                    var obj = [pitch, octave];
                } else {
                    // Hertz?
                    var obj = frequencyToPitch(logo.lastNotePlayed[turtle][0]);
                }
            } else if (logo.inNoteBlock[turtle] in logo.notePitches[turtle] && logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].length > 0) {
                var obj = getNote(logo.notePitches[turtle][last(logo.inNoteBlock[turtle])][0], logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])][0], 0, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg);
            } else {
                if (logo.lastNotePlayed[turtle] !== null) {
                    console.debug('Cannot find a note ');
                    logo.errorMsg(INVALIDPITCH, blk);
                }

                var obj = ['G', 4];
            }

            value = pitchToNumber(obj[0], obj[1], logo.keySignature[turtle]) - logo.pitchNumberOffset[turtle];
            return value;
        }
    }
}

class PitchInHertzBlock extends ValueBlock {
    constructor() {
        //.TRANS: the current pitch expressed in Hertz
        super('pitchinhertz', _('pitch in hertz'));
        this.setPalette('pitch');
    }

    arg(logo, turtle, blk) {
        if (logo.inStatusMatrix && logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name === 'print') {
            logo.statusFields.push([blk, 'pitchinhertz']);
        } else {
            if (logo.lastNotePlayed[turtle] !== null) {
                return logo.synth._getFrequency(logo.lastNotePlayed[turtle][0], logo.synth.changeInTemperament);
            }
        }
    }
}

class MIDIBlock extends FlowBlock {
    constructor() {
        //.TRANS: MIDI is a technical standard for electronic music
        super('midi', _('MIDI'));
        this.setPalette('pitch');
    }
}

class SetPitchNumberOffsetBlock extends FlowBlock {
    constructor() {
        //.TRANS: set an offset associated with the numeric piano keyboard mapping
        super('setpitchnumberoffset', _('set pitch number offset'));
        this.setPalette('pitch');
        this.formBlock({
            args: 2, defaults: ['C', 4],
            argTypes: ['notein', 'anyin'],
            argLabels: [
                //.TRANS: name2 is name as in name of pitch (JAPANESE ONLY)
                this.lang === 'ja' ? _('name2') : _('name'),
                _('octave')
            ]
        });
    }

    flow(args, logo, turtle, blk) {
        if (args[0] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg0 = 'C';
        } else {
            var arg0 = args[0];
        }

        if (args[1] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg1 = 4;
        } else {
            var arg1 = args[1];
        }

        var octave = Math.floor(calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], arg0));
        logo.pitchNumberOffset[turtle] = pitchToNumber(arg0, octave, logo.keySignature[turtle]);
    }
}

class Number2PitchBlock extends LeftBlock {
    constructor(name, displayName) {
        //.TRANS: convert piano key number (1-88) to pitch
        super(name || 'number2pitch', displayName || _('number to pitch'));
        this.setPalette('pitch');
        this.formBlock({
            args: 1, defaults: [55]
        });
    }

    arg(logo, turtle, blk, receivedArg) {
        var cblk = logo.blocks.blockList[blk].connections[1];
        var num = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
        if (num != null && typeof(num) === 'number') {
            var obj = numberToPitch(num + logo.pitchNumberOffset[turtle]);
            if (logo.blocks.blockList[blk].name === 'number2pitch') {
                return obj[0];
            } else {
                return obj[1];
            }
        } else {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            logo.stopTurtle = true;
        }
    }
}

class Number2OctaveBlock extends Number2PitchBlock {
    constructor() {
        //.TRANS: convert piano key number (1-88) to octave
        super('number2octave', _('number to octave'));
    }
}

class AccidentalNameBlock extends ValueBlock {
    constructor() {
        super('accidentalname');
        this.setPalette('pitch');
        this.formBlock({ outType: 'textout' });
    }
}

class EastIndianSolfegeBlock extends ValueBlock {
    constructor() {
        super('eastindiansolfege');
        this.setPalette('pitch');
        this.formBlock({ outType: 'solfegeout' });
    }
}

class NoteNameBlock extends ValueBlock {
    constructor() {
        super('notename');
        this.setPalette('pitch');
        this.formBlock({ outType: 'noteout' });
    }
}

class SolfegeBlock extends ValueBlock {
    constructor() {
        super('solfege');
        this.setPalette('pitch');
        this.formBlock({ outType: 'solfegeout' });
    }
}

class CustomNoteBlock extends ValueBlock {
    constructor() {
        super('customNote');
        this.setPalette('pitch');
        this.hidden = true;
    }
}

class Invert1Block extends FlowClampBlock {
    constructor() {
        super('invert1');
        this.setPalette('pitch');
        this.formBlock({
            //.TRANS: pitch inversion rotates a pitch around another pitch
            name: _('invert'), args: 3,
            defaults: ['sol', 4, _('even')],
            argTypes: ['solfegein', 'anyin', 'anyin'],
            argLabels: [
                //.TRANS: name2 is name as in name of pitch (JAPANESE ONLY)
                this.lang === 'ja' ? _('name2') : _('name'),
                _('octave'),
                //.TRANS: invert based on even or odd number or musical scale
                _('even') + '/' + _('odd') + '/' + _('scalar')
            ]
        });
        this.makeMacro((x, y) => [
            [0, 'invert1', x, y, [null, 1, 2, 3, null, 4]],
            [1, ['solfege', {'value': 'sol'}], 0, 0, [0]],
            [2, ['number', {'value': 4}], 0, 0, [0]],
            [3, ['invertmode', {'value': 'even'}], 0, 0, [0]],
            [4, 'hidden', 0, 0, [0, null]]
        ]);
    }

    flow(args, logo, turtle, blk) {
        if (args[3] === undefined) {
            // Nothing to do...
            return;
        }

        if (args[0] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg0 = 'sol';
        } else {
            var arg0 = args[0];
        }

        if (args[1] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg1 = 4;
        } else {
            var arg1 = args[1];
        }

        if (args[2] === null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg2 = 'even';
        } else {
            var arg2 = args[2];
        }

        if (typeof(arg2) === 'number') {
            if (arg2 % 2 === 0) {
                arg2 = 'even';
            } else {
                arg2 = 'odd';
            }
        }

        if (arg2 === _('even')) {
            args2 = 'even';
        } else if (arg2 === _('odd')) {
            args2 = 'odd';
        } else if (arg2 === _('scalar')) {
            args2 = 'scalar';
        }

        if (arg2 === 'even' || arg2 === 'odd' || arg2 === 'scalar') {
            var octave = calcOctave(logo.currentOctave[turtle], arg1, logo.lastNotePlayed[turtle], arg0);
            logo.invertList[turtle].push([arg0, octave, arg2]);
        }

        var listenerName = '_invert_' + turtle;
        logo._setDispatchBlock(blk, turtle, listenerName);

        var __listener = function (event) {
            logo.invertList[turtle].pop();
        };

        logo._setListener(turtle, listenerName, __listener);

        return [args[3], 1];
    }
}

class Invert2Block extends FlowClampBlock {
    constructor(name, displayName) {
        //.TRANS: pitch inversion rotates a pitch around another pitch (odd number)
        super(name || 'invert2', displayName || _('invert (odd)'));
        this.setPalette('pitch');
        this.formBlock({
            args: 2, defaults: ['sol', 4],
            argTypes: ['solfegein', 'anyin'],
            argLabels: [_('note'), _('octave')]
        });
        this.hidden = this.deprecated = true;
    }

    flow(args, logo, turtle, blk) {
        if (logo.blocks.blockList[blk].name === 'invert') {
            logo.invertList[turtle].push([args[0], args[1], 'even']);
        } else {
            logo.invertList[turtle].push([args[0], args[1], 'odd']);
        }
        var listenerName = '_invert_' + turtle;
        logo._setDispatchBlock(blk, turtle, listenerName);

        var __listener = function (event) {
            logo.invertList[turtle].pop();
        };

        logo._setListener(turtle, listenerName, __listener);

        return [args[2], 1];
    }
}

class InvertBlock extends Invert2Block {
    constructor() {
        //.TRANS: pitch inversion rotates a pitch around another pitch (even number)
        super('invert', _('invert (even)'));
        this.setPalette('pitch');
        this.formBlock({
            args: 2, defaults: ['sol', 4],
            argTypes: ['solfegein', 'anyin'],
            argLabels: [_('note'), _('octave')]
        });
        this.hidden = true;
    }
}

class RegisterBlock extends FlowBlock {
    constructor() {
        //.TRANS: register is the octave of the current pitch
        super('register', _('register'));
        this.setPalette('pitch');
        this.formBlock({
            args: 1, defaults: [0]
        });
    }

    flow(args, logo, turtle) {
        if (args[0] !== null && typeof(args[0]) === 'number') {
            logo.register[turtle] = Math.floor(args[0]);
        }
    }
}

class SetTranspositionBlock extends FlowClampBlock {
    constructor() {
        super('settransposition');
        this.setPalette('pitch');
        this.formBlock({
            //.TRANS: adjust the amount of shift (up or down) of a pitch
            name: _('semi-tone transpose'),
            args: 1, defaults: ['1']
        });
    }

    flow(args, logo, turtle, blk) {
        if (args[1] === undefined) {
            // Nothing to do.
            return;
        }

        if (args[0] !== null && typeof(args[0]) === 'number') {
            var transValue = args[0];
            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] -= transValue;
            } else {
                logo.transposition[turtle] += transValue;
            }

            logo.transpositionValues[turtle].push(transValue);

            var listenerName = '_transposition_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                var transValue = logo.transpositionValues[turtle].pop();
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] += transValue;
                } else {
                    logo.transposition[turtle] -= transValue;
                }
            };

            logo._setListener(turtle, listenerName, __listener);

            return [args[1], 1];
        }
    }
}

class OctaveBlock extends FlowBlock {
    constructor() {
        //.TRANS: adjusts the shift up or down by one octave (twelve half-steps in the interval between two notes, one having twice or half the frequency in Hz of the other.)
        super('octave', _('octave'));
        this.setPalette('pitch');
    }
}

class CustomPitchBlock extends FlowBlock {
    constructor() {
        super('custompitch', _('custom pitch'));
        this.setPalette('pitch');
        this.hidden = true;
    }

    flow(args, logo, turtle, blk) {
        if (args[0] == null || args[1] == null) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            logo.stopTurtle = true;
        } else {
            note = args[0];
            octave = args[1];
        }
    }
}

class DownSixthBlock extends FlowBlock {
    constructor() {
        //.TRANS: down sixth means the note is five scale degrees below current note
        super('downsixth', _('down sixth'));
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, 6, 8]],
            [1, 'minus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': -5}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, 'modelength', 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, 7]],
            [7, 'vspace', 0, 0, [6, null]],
            [8, 'hidden', 0, 0, [0, null]]
        ]);
    }
}

class DownThirdBlock extends FlowBlock {
    constructor() {
        //.TRANS: down third means the note is two scale degrees below current note
        super('downthird', _('down third'));
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, 6, 8]],
            [1, 'minus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': -2}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, 'modelength', 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, 7]],
            [7, 'vspace', 0, 0, [6, null]],
            [8, 'hidden', 0, 0, [0, null]]
        ]);
    }
}

class SeventhBlock extends FlowBlock {
    constructor() {
        //.TRANS: seventh means the note is the six scale degrees above current note
        super('seventh', _('seventh'));
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, 6, 8]],
            [1, 'plus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 6}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, 'modelength', 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, 7]],
            [7, 'vspace', 0, 0, [6, null]],
            [8, 'hidden', 0, 0, [0, null]]
        ]);
    }
}

class SixthBlock extends FlowBlock {
    constructor() {
        //.TRANS: sixth means the note is the five scale degrees above current note
        super('sixth', _('sixth'));
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, 6, 8]],
            [1, 'plus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 5}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, 'modelength', 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, 7]],
            [7, 'vspace', 0, 0, [6, null]],
            [8, 'hidden', 0, 0, [0, null]]
        ]);
    }
}

class FifthBlock extends FlowBlock {
    constructor() {
        //.TRANS: fifth means the note is the four scale degrees above current note
        super('fifth', _('fifth'));
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, 6, 8]],
            [1, 'plus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 4}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, 'modelength', 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, 7]],
            [7, 'vspace', 0, 0, [6, null]],
            [8, 'hidden', 0, 0, [0, null]]
        ]);
    }
}

class FourthBlock extends FlowBlock {
    constructor() {
        //.TRANS: fourth means the note is three scale degrees above current note
        super('fourth', _('fourth'));
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, 6, 7]],
            [1, 'plus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 3}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, 'modelength', 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, null]],
            [7, 'hidden', 0, 0, [0, null]]
        ]);
    }
}

class ThirdBlock extends FlowBlock {
    constructor() {
        //.TRANS: third means the note is two scale degrees above current note
        super('third', _('third'));
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, 6, 8]],
            [1, 'plus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 2}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, 'modelength', 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, 7]],
            [7, 'vspace', 0, 0, [6, null]],
            [8, 'hidden', 0, 0, [0, null]]
        ]);
    }
}

class SecondBlock extends FlowBlock {
    constructor() {
        //.TRANS: second means the note is one scale degree above current note
        super('second', _('second'));
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, 6, 8]],
            [1, 'plus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 1}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, 'modelength', 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, 7]],
            [7, 'vspace', 0, 0, [6, null]],
            [8, 'hidden', 0, 0, [0, null]]
        ]);
    }
}

class UnisonBlock extends FlowBlock {
    constructor() {
        //.TRANS: unison means the note is the same as the current note
        super('unison', _('unison'));
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, 6, 8]],
            [1, 'plus', 0, 0, [0, 2, 3]],
            [2, ['number', {'value': 0}], 0, 0, [1]],
            [3, 'multiply', 0, 0, [1, 4, 5]],
            [4, ['number', {'value': 0}], 0, 0, [3]],
            [5, 'modelength', 0, 0, [3]],
            [6, 'vspace', 0, 0, [0, 7]],
            [7, 'vspace', 0, 0, [6, null]],
            [8, 'hidden', 0, 0, [0, null]]
        ]);
    }
}

class SetScalarTranspositionBlock extends FlowClampBlock {
    constructor() {
        super('setscalartransposition');
        this.setPalette('pitch');
        this.formBlock({
            //.TRANS: adjust the amount of shift (up or down) of a pitch by musical scale (scalar) steps
            name: _('scalar transpose') + ' (+/–)',
            args: 1, defaults: ['1']
        });
        this.makeMacro((x, y) => [
            [0, 'setscalartransposition', x, y, [null, 1, null, 2]],
            [1, ['number', {'value': 1}], 0, 0, [0]],
            [2, 'hidden', 0, 0, [0, null]]
        ]);
        // Note: Inverted to usual; only appears in beginner mode.
        if (!beginnerMode || !beginnerBlock(this.name)) {
            this.hidden = true;
        }
    }

    flow(args, logo, turtle, blk) {
        if (args[1] === undefined) {
            // Nothing to do.
            return;
        }

        if (args[0] === null || typeof(args[0]) !== 'number') {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var transValue = 0;
        } else {
            var transValue = args[0];
        }

        if (!(logo.invertList[turtle].length === 0)) {
            logo.scalarTransposition[turtle] -= transValue;
        } else {
            logo.scalarTransposition[turtle] += transValue;
        }

        logo.scalarTranspositionValues[turtle].push(transValue);

        var listenerName = '_scalar_transposition_' + turtle;
        logo._setDispatchBlock(blk, turtle, listenerName);

        var __listener = function (event) {
            var transValue = logo.scalarTranspositionValues[turtle].pop();
            if (!(logo.invertList[turtle].length === 0)) {
                logo.scalarTransposition[turtle] += transValue;
            } else {
                logo.scalarTransposition[turtle] -= transValue;
            }
        };

        logo._setListener(turtle, listenerName, __listener);

        return [args[1], 1];
    }
}

class AccidentalBlock extends FlowClampBlock {
    constructor() {
        super('accidental');
        this.setPalette('pitch');
        this.formBlock({
            //.TRANS: An accidental is a modification to a pitch, e.g., sharp or flat.
            name: _('accidental'),
            args: 1
        });
        this.makeMacro((x, y) => [
            [0, 'accidental', x, y, [null, 11, 1, 10]],
            [1, 'newnote', x, y, [0, 2, 5, 9]],
            [2, 'divide', 0, 0, [1, 3, 4]],
            [3, ['number', {'value': 1}], 0, 0, [2]],
            [4, ['number', {'value': 4}], 0, 0, [2]],
            [5, 'vspace', 0, 0, [1, 6]],
            [6, 'pitch', 0, 0, [5, 7, 8, null]],
            [7, ['solfege', {'value': 'sol'}], 0, 0, [6]],
            [8, ['number', {'value': 4}], 0, 0, [6]],
            [9, 'hidden', 0, 0, [1, null]],
            [10, 'hidden', 0, 0, [0, null]],
            [11, ['accidentalname', {value: 'natural' + ' ♮'}], 0, 0, [0]]
        ]);
    }

    flow(args, logo, turtle, blk) {
        if (args[1] === undefined) {
            // Nothing to do.
            return;
        }

        if (args[0] === null || typeof(args[0]) !== 'string') {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            var arg = 'sharp';
        } else {
            var arg = args[0];
        }

        var i = ACCIDENTALNAMES.indexOf(arg);
        if (i === -1) {
            switch (arg) {
            case _('sharp'):
                value = 1;
                return;
            case _('flat'):
                value = -1;
                return;
            default:
                value = 0;
                return;
            }
        } else {
            value = ACCIDENTALVALUES[i];
        }

        if (!(logo.invertList[turtle].length === 0)) {
            logo.transposition[turtle] -= value;
        } else {
            logo.transposition[turtle] += value;
        }

        var listenerName = '_accidental_' + turtle + '_' + blk;
        logo._setDispatchBlock(blk, turtle, listenerName);

        var __listener = function (event) {
            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] += value;
            } else {
                logo.transposition[turtle] -= value;
            }
        };

        logo._setListener(turtle, listenerName, __listener);

        return [args[1], 1];
    }
}

class FlatBlock extends FlowClampBlock {
    constructor() {
        super('flat');
        this.setPalette('pitch');
        //.TRANS: flat is a half-step down in pitch
        this.formBlock({ name: _('flat') + ' ♭' });
        this.makeMacro((x, y) => [
            [0, 'accidental', x, y, [null, 11, 1, 10]],
            [1, 'newnote', x, y, [0, 2, 5, 9]],
            [2, 'divide', 0, 0, [1, 3, 4]],
            [3, ['number', {'value': 1}], 0, 0, [2]],
            [4, ['number', {'value': 4}], 0, 0, [2]],
            [5, 'vspace', 0, 0, [1, 6]],
            [6, 'pitch', 0, 0, [5, 7, 8, null]],
            [7, ['solfege', {'value': 'sol'}], 0, 0, [6]],
            [8, ['number', {'value': 4}], 0, 0, [6]],
            [9, 'hidden', 0, 0, [1, null]],
            [10, 'hidden', 0, 0, [0, null]],
            [11, ['accidentalname', {value: 'flat' + ' ♭'}], 0, 0, [0]]
        ]);
    }

    flow(args, logo, turtle, blk) {
        if (args[0] === undefined) {
            // Nothing to do.
            return;
        }

        if (!(logo.invertList[turtle].length === 0)) {
            logo.transposition[turtle] += 1;
        } else {
            logo.transposition[turtle] -= 1;
        }

        var listenerName = '_flat_' + turtle;
        logo._setDispatchBlock(blk, turtle, listenerName);

        var __listener = function (event) {
            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] -= 1;
            } else {
                logo.transposition[turtle] += 1;
            }
        };

        logo._setListener(turtle, listenerName, __listener);

        return [args[0], 1];
    }
}

class SharpBlock extends FlowClampBlock {
    constructor() {
        super('sharp');
        this.setPalette('pitch');
        //.TRANS: sharp is a half-step up in pitch
        this.formBlock({name: _('sharp') + ' ♯' });
        this.makeMacro((x, y) => [
            [0, 'accidental', x, y, [null, 11, 1, 10]],
            [1, 'newnote', x, y, [0, 2, 5, 9]],
            [2, 'divide', 0, 0, [1, 3, 4]],
            [3, ['number', {'value': 1}], 0, 0, [2]],
            [4, ['number', {'value': 4}], 0, 0, [2]],
            [5, 'vspace', 0, 0, [1, 6]],
            [6, 'pitch', 0, 0, [5, 7, 8, null]],
            [7, ['solfege', {'value': 'sol'}], 0, 0, [6]],
            [8, ['number', {'value': 4}], 0, 0, [6]],
            [9, 'hidden', 0, 0, [1, null]],
            [10, 'hidden', 0, 0, [0, null]],
            [11, ['accidentalname', {value: 'sharp' + ' ♯'}], 0, 0, [0]]
        ]);
    }

    flow(args, logo, turtle, blk) {
        if (args[0] === undefined) {
            // Nothing to do.
            return;
        }

        if (!(logo.invertList[turtle].length === 0)) {
            logo.transposition[turtle] -= 1;
        } else {
            logo.transposition[turtle] += 1;
        }

        var listenerName = '_sharp_' + turtle;
        logo._setDispatchBlock(blk, turtle, listenerName);

        var __listener = function (event) {
            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] += 1;
            } else {
                logo.transposition[turtle] -= 1;
            }
        };

        logo._setListener(turtle, listenerName, __listener);

        return [args[0], 1];
    }
}

class HertzBlock extends FlowBlock {
    constructor() {
        //.TRANS: a measure of frequency: one cycle per second
        super('hertz', _('hertz'));
        this.setPalette('pitch');
        this.formBlock({
            args: 1, defaults: [
                this.lang === 'ja' ? 440 : 392
            ]
        });
    }

    flow(args, logo, turtle, blk) {
        let arg;
        if (args[0] === null || typeof(args[0]) !== 'number' || args[0] <= 0) {
            logo.errorMsg(NOINPUTERRORMSG, blk);
            arg = 392;
        } else {
            arg = args[0];
        }

        var obj = frequencyToPitch(arg);
        var note = obj[0];
        var octave = obj[1];
        var cents = obj[2];
        var delta = 0;

        function addPitch(note, octave, cents, frequency, direction) {
            let t = transposition + logo.register[turtle] * 12;
            var noteObj = getNote(note, octave, t, logo.keySignature[turtle], logo.moveable[turtle], direction, logo.errorMsg, logo.synth.inTemperament);
            if (logo.drumStyle[turtle].length > 0) {
                var drumname = last(logo.drumStyle[turtle]);
                logo.pitchDrumTable[turtle][noteObj[0] + noteObj[1]] = drumname;
            }

            logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[0]);
            logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[1]);
            logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(cents);
            logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(frequency);
            return noteObj;
        }

        if (note === '?') {
            logo.errorMsg(INVALIDPITCH, blk);
            logo.stopTurtle = true;
        } else if (logo.justMeasuring[turtle].length > 0) {
            // TODO: account for cents
            var noteObj = getNote(note, octave, 0, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg);

            var n = logo.justMeasuring[turtle].length;
            var pitchNumber = pitchToNumber(noteObj[0], noteObj[1], logo.keySignature[turtle]) - logo.pitchNumberOffset[turtle];
            if (logo.firstPitch[turtle].length < n) {
                logo.firstPitch[turtle].push(pitchNumber);
            } else if (logo.lastPitch[turtle].length < n) {
                logo.lastPitch[turtle].push(pitchNumber);
            }
        } else if (logo.inMatrix) {
            logo.pitchTimeMatrix.addRowBlock(blk);
            if (logo.pitchBlocks.indexOf(blk) === -1) {
                logo.pitchBlocks.push(blk);
            }

            logo.pitchTimeMatrix.rowLabels.push(logo.blocks.blockList[blk].name);
            logo.pitchTimeMatrix.rowArgs.push(arg);
            // convert hertz to note/octave
            var note = frequencyToPitch(arg);
            logo.lastNotePlayed[turtle] = [note[0] + note[1], 4];
        } else if (logo.inMusicKeyboard) {
            logo.musicKeyboard.instruments.push(last(logo.instrumentNames[turtle]));
            logo.musicKeyboard.noteNames.push('hertz');
            logo.musicKeyboard.octaves.push(arg);
            logo.musicKeyboard.addRowBlock(blk);
            // convert hertz to note/octave
            var note = frequencyToPitch(arg);
            logo.lastNotePlayed[turtle] = [note[0] + note[1], 4];
        } else if (logo.inNoteBlock[turtle].length > 0) {
            if (!(logo.invertList[turtle].length === 0)) {
                delta += logo._calculateInvert(turtle, note, octave);
            }

            var noteObj1 = addPitch(note, octave, cents, arg);

            if (turtle in logo.intervals && logo.intervals[turtle].length > 0) {
                for (var i = 0; i < logo.intervals[turtle].length; i++) {
                    var ii = getInterval(logo.intervals[turtle][i], logo.keySignature[turtle], noteObj1[0]);
                    var noteObj2 = getNote(noteObj1[0], noteObj1[1], ii, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
                    addPitch(noteObj2[0], noteObj2[1], cents, 0);
                }
            }

            if (turtle in logo.semitoneIntervals && logo.semitoneIntervals[turtle].length > 0) {
                for (var i = 0; i < logo.semitoneIntervals[turtle].length; i++) {
                    var noteObj2 = getNote(noteObj1[0], noteObj1[1], logo.semitoneIntervals[turtle][i][0], logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
                    addPitch(noteObj2[0], noteObj2[1], cents, 0, logo.semitoneIntervals[turtle][i][1]);
                }
            }

            logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])].push(logo.beatFactor[turtle]);
            logo.pushedNote[turtle] = true;
        } else if (logo.inPitchStaircase) {
            var frequency = arg;
            var note = frequencyToPitch(arg);
            var flag = 0;

            for (var i = 0 ; i < logo.pitchStaircase.Stairs.length; i++) {
                if (logo.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                    logo.pitchStaircase.Stairs.splice(i, 0, [note[0], note[1], parseFloat(frequency)]);
                    flag = 1;
                    return;
                }
                if (logo.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                    logo.pitchStaircase.Stairs.splice(i, 1, [note[0], note[1], parseFloat(frequency)]);
                    flag = 1;
                    return;
                }
            }

            if (flag === 0) {
                logo.pitchStaircase.Stairs.push([note[0], note[1], parseFloat(frequency)]);
            }

            logo.pitchStaircase.stairPitchBlocks.push(blk);
        } else if (logo.inPitchSlider) {
            logo.pitchSlider.Sliders.push([args[0], 0, 0]);
        } else {
            logo.errorMsg(_('Hertz Block: Did you mean to use a Note block?'), blk);
        }
    }
}

class PitchNumberBlock extends FlowBlock {
    constructor() {
        //.TRANS: a mapping of pitch to the 88 piano keys
        super('pitchnumber', _('pitch number'));
        this.setPalette('pitch');
        this.formBlock({
            args: 1, defaults: [7]
        });
    }

    flow(args, logo, turtle, blk) {
        return _playPitch(args, logo, turtle, blk)
    }
}

class ScaleDegreeBlock extends FlowBlock {
    constructor() {
        //.TRANS: a numeric mapping of the notes in an octave based on the musical mode
        super('scaledegree', _('scale degree'));
        this.setPalette('pitch');
        this.formBlock({
            args: 2, defaults: [5, 4],  // 5 is G in C Majoe
            argLabels: [_('number'), _('octave')],
            argTypes: ['numberin', 'anyin']
        });
    }

    flow(args, logo, turtle, blk) {
        return _playPitch(args, logo, turtle, blk)
    }
}

class StepPitchBlock extends FlowBlock {
    constructor() {
        //.TRANS: step some number of notes in current musical scale
        super('steppitch', _('scalar step') + ' (+/–)');
        this.setPalette('pitch');
        this.formBlock({
            args: 1, defaults: [1],
            argTypes: ['anyin']
        });
    }

    flow(args, logo, turtle, blk) {
        // Similar to pitch but calculated from previous note played.
        if (!logo.inMatrix && !logo.inMusicKeyboard && logo.inNoteBlock[turtle].length === 0) {
            logo.errorMsg(_('The Scalar Step Block must be used inside of a Note Block.'), blk);
            logo.stopTurtle = true;
            return;
        }

        if (typeof(args[0]) !== 'number') {
            logo.errorMsg(NANERRORMSG, blk);
            logo.stopTurtle = true;
            return;
        }

        // If we are just counting notes we don't care about the pitch.
        if (logo.justCounting[turtle].length > 0 && logo.lastNotePlayed[turtle] == null) {
            console.debug('Just counting, so spoofing last note played.');
            logo.previousNotePlayed[turtle] = ['G4', 4];
            logo.lastNotePlayed[turtle] = ['G4', 4];
        }

        if (logo.lastNotePlayed[turtle] == null) {
            logo.errorMsg(_('The Scalar Step Block must be preceded by a Pitch Block.'), blk);
            logo.lastNotePlayed[turtle] = ['G4', 4];
            // logo.stopTurtle = true;
            // return;
        }

        function addPitch(note, octave, cents, direction) {
            t = transposition + logo.register[turtle] * 12;
            var noteObj = getNote(note, octave, t, logo.keySignature[turtle], true, direction, logo.errorMsg, logo.synth.inTemperament);

            if (logo.drumStyle[turtle].length > 0) {
                var drumname = last(logo.drumStyle[turtle]);
                if (EFFECTSNAMES.indexOf(drumname) === -1) {
                    logo.pitchDrumTable[turtle][noteObj[0] + noteObj[1]] = drumname;
                } else {
                    logo.pitchDrumTable[turtle][noteObj[0] + noteObj[1]] = effectsname;
                }
            }

            if (!logo.inMatrix && !logo.inMusicKeyboard) {
                logo.notePitches[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[0]);
                logo.noteOctaves[turtle][last(logo.inNoteBlock[turtle])].push(noteObj[1]);
                logo.noteCents[turtle][last(logo.inNoteBlock[turtle])].push(cents);
                if (cents !== 0) {
                    logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(pitchToFrequency(noteObj[0], noteObj[1], cents, logo.keySignature[turtle]));
                } else {
                    logo.noteHertz[turtle][last(logo.inNoteBlock[turtle])].push(0);
                }
            }

            return noteObj;
        }

        var len = logo.lastNotePlayed[turtle][0].length;

        var noteObj = logo._addScalarTransposition(turtle, logo.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(logo.lastNotePlayed[turtle][0].slice(len - 1)), args[0]);

        var delta = 0;
        if (!(logo.invertList[turtle].length === 0)) {
            delta += logo._calculateInvert(turtle, noteObj[0], noteObj[1]);
        }

        var transposition = 2 * delta;
        if (turtle in logo.transposition) {
            transposition += logo.transposition[turtle];
        }

        var noteObj1 = addPitch(noteObj[0], noteObj[1], 0);
        // Only apply the transposition to the base note of an interval
        transposition = 0;

        if (logo.inMatrix) {
            logo.pitchTimeMatrix.addRowBlock(blk);
            if (logo.pitchBlocks.indexOf(blk) === -1) {
                logo.pitchBlocks.push(blk);
            }

            if (logo.pitchTimeMatrix.rowLabels.length > 0) {
                if (last(logo.pitchTimeMatrix.rowLabels) === 'hertz') {
                    var freq = pitchToFrequency(noteObj[0], noteObj[1], 0, logo.keySignature[turtle]);
                    logo.pitchTimeMatrix.rowLabels.push('hertz');
                    logo.pitchTimeMatrix.rowArgs.push(parseInt(freq));
                } else {
                    if (SOLFEGENAMES1.indexOf(last(logo.pitchTimeMatrix.rowLabels)) !== -1) {
                        logo.pitchTimeMatrix.rowLabels.push(SOLFEGECONVERSIONTABLE[noteObj1[0]]);
                    } else {
                        logo.pitchTimeMatrix.rowLabels.push(noteObj1[0]);
                    }

                    logo.pitchTimeMatrix.rowArgs.push(noteObj1[1]);
                }
            } else {
                logo.pitchTimeMatrix.rowLabels.push(noteObj1[0]);
                logo.pitchTimeMatrix.rowArgs.push(noteObj1[1]);
            }

            logo.previousNotePlayed[turtle] = logo.lastNotePlayed[turtle];
            logo.lastNotePlayed[turtle] = [noteObj1[0] + noteObj1[1], 4];
        } else if (logo.inMusicKeyboard) {
            if (logo.drumStyle[turtle].length === 0) {
                logo.musicKeyboard.instruments.push(last(logo.instrumentNames[turtle]));
                if (logo.musicKeyboard.noteNames.length > 0) {
                    if (last(logo.musicKeyboard.noteNames) === 'hertz') {
                        var freq = pitchToFrequency(noteObj[0], noteObj[1], 0, logo.keySignature[turtle]);
                        logo.musicKeyboard.noteNames.push('hertz');
                        logo.musicKeyboard.octaves.push(parseInt(freq));
                    } else {
                        if (SOLFEGENAMES1.indexOf(last(logo.musicKeyboard.noteNames)) !== -1) {
                            logo.musicKeyboard.noteNames.push(SOLFEGECONVERSIONTABLE[noteObj1[0]]);
                        } else {
                            logo.musicKeyboard.noteNames.push(noteObj1[0]);
                        }

                        logo.musicKeyboard.octaves.push(noteObj1[1]);
                    }
                } else {
                    logo.musicKeyboard.noteNames.push(noteObj1[0]);
                    logo.musicKeyboard.octaves.push(noteObj1[1]);
                }

                logo.musicKeyboard.addRowBlock(blk);
                logo.lastNotePlayed[turtle] = [noteObj1[0] + noteObj1[1], 4];
            }
        }

        if (turtle in logo.intervals && logo.intervals[turtle].length > 0) {
            for (var i = 0; i < logo.intervals[turtle].length; i++) {
                var ii = getInterval(logo.intervals[turtle][i], logo.keySignature[turtle], noteObj1[0]);
                var noteObj2 = getNote(noteObj1[0], noteObj1[1], ii, logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }
        }

        if (turtle in logo.semitoneIntervals && logo.semitoneIntervals[turtle].length > 0) {
            for (var i = 0; i < logo.semitoneIntervals[turtle].length; i++) {
                var noteObj2 = getNote(noteObj1[0], noteObj1[1], logo.semitoneIntervals[turtle][i][0], logo.keySignature[turtle], logo.moveable[turtle], null, logo.errorMsg, logo.synth.inTemperament);
                addPitch(noteObj2[0], noteObj2[1], 0, logo.semitoneIntervals[turtle][i][1]);
            }
        }

        if (logo.inNoteBlock[turtle].length > 0) {
            logo.noteBeatValues[turtle][last(logo.inNoteBlock[turtle])].push(logo.beatFactor[turtle]);
        }

        logo.pushedNote[turtle] = true;
    }
}

class Pitch2Block extends FlowBlock {
    constructor() {
        super('pitch2', _('pitch') + ' ' + 'G4');
        this.setPalette('pitch');
        this.makeMacro((x, y) => [
            [0, 'pitch', x, y, [null, 1, 2, null]],
            [1, ['notename', {'value': 'G'}], 0, 0, [0]],
            [2, ['number', {'value': 4}], 0, 0, [0]]
        ]);
    }
}

class PitchBlock extends FlowBlock {
    constructor() {
        //.TRANS: we specify pitch in terms of a name and an octave. The name can be CDEFGAB or Do Re Mi Fa Sol La Ti. Octave is a number between 1 and 8.
        super('pitch', _('pitch'));
        this.setPalette('pitch');
        this.formBlock({
            args: 2, defaults: ['sol', 4],
            argTypes: ['solfegein', 'anyin'],
            argLabels: [
                //.TRANS: name2 is name as in name of pitch (JAPANESE ONLY)
                this.lang === 'ja' ? _('name2') : _('name'),
                _('octave')
            ]
        })
    }

    flow(args, logo, turtle, blk) {
        return _playPitch(args, logo, turtle, blk)
    }
}

function setupPitchBlocks() {
    new ConsonantStepSizeDownBlock().setup();
    new ConsonantStepSizeUpBlock().setup();
    new RestBlock().setup();
    new SquareBlock().setup();
    new TriangleBlock().setup();
    new SineBlock().setup();
    new SawtoothBlock().setup();
    new InvertModeBlock().setup();
    new TranspositionFactorBlock().setup();
    new DeltaPitchBlock().setup();
    new DeltaPitch2Block().setup();
    new MyPitchBlock().setup();
    new PitchInHertzBlock().setup();
    new MIDIBlock().setup();
    new SetPitchNumberOffsetBlock().setup();
    new Number2PitchBlock().setup();
    new Number2OctaveBlock().setup();
    new AccidentalNameBlock().setup();
    new EastIndianSolfegeBlock().setup();
    new NoteNameBlock().setup();
    new SolfegeBlock().setup();
    new CustomNoteBlock().setup();
    new Invert1Block().setup();
    new Invert2Block().setup();
    new InvertBlock().setup();
    new RegisterBlock().setup();
    new SetTranspositionBlock().setup();
    new OctaveBlock().setup();
    new CustomPitchBlock().setup();
    new DownSixthBlock().setup();
    new DownThirdBlock().setup();
    new SeventhBlock().setup();
    new SixthBlock().setup();
    new FifthBlock().setup();
    new FourthBlock().setup();
    new ThirdBlock().setup();
    new SecondBlock().setup();
    new UnisonBlock().setup();
    new SetScalarTranspositionBlock().setup();
    new AccidentalBlock().setup();
    new FlatBlock().setup();
    new SharpBlock().setup();
    new HertzBlock().setup();
    new PitchNumberBlock().setup();
    new ScaleDegreeBlock().setup();
    new StepPitchBlock().setup();
    new Pitch2Block().setup();
    new PitchBlock().setup();
}