// Copyright (c) 2014-2017 Walter Bender
// Copyright (c) 2015 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const DEFAULTVOLUME = 50;
const TONEBPM = 240;  // Seems to be the default.
const TARGETBPM = 90;  // What we'd like to use for beats per minute
const DEFAULTDELAY = 500; // milleseconds
const TURTLESTEP = -1;  // Run in step-by-step mode
const NOTEDIV = 8;  // Number of steps to divide turtle graphics
const OSCVOLUMEADJUSTMENT = 1.5  // The oscillator runs hot. We need
                                 // to scale back its volume.

const NOMICERRORMSG = 'The microphone is not available.';
const NANERRORMSG = 'Not a number.';
const NOSTRINGERRORMSG = 'Not a string.';
const NOBOXERRORMSG = 'Cannot find box';
const NOACTIONERRORMSG = 'Cannot find action.';
const NOINPUTERRORMSG = 'Missing argument.';
const NOSQRTERRORMSG = 'Cannot take square root of negative number.';
const ZERODIVIDEERRORMSG = 'Cannot divide by zero.';
const EMPTYHEAPERRORMSG = 'empty heap.';
const INVALIDPITCH = 'Not a valid pitch name';
const POSNUMBER = 'Argument must be a positive number';

function Logo(pitchtimematrix, pitchdrummatrix, rhythmruler,
              pitchstaircase, tempo, pitchslider,
              canvas, blocks, turtles, stage,
              refreshCanvas, textMsg, errorMsg, hideMsgs, onStopTurtle,
              onRunTurtle, getStageX, getStageY,
              getStageMouseDown, getCurrentKeyCode,
              clearCurrentKeyCode, meSpeak, saveLocally) {

    this.canvas = canvas;
    this.blocks = blocks;
    this.turtles = turtles;
    this.stage = stage;
    this.refreshCanvas = refreshCanvas;
    this.textMsg = textMsg;
    this.errorMsg = errorMsg;
    this.hideMsgs = hideMsgs;
    this.onStopTurtle = onStopTurtle;
    this.onRunTurtle = onRunTurtle;
    this.getStageX = getStageX;
    this.getStageY = getStageY;
    this.getStageMouseDown = getStageMouseDown;
    this.getCurrentKeyCode = getCurrentKeyCode;
    this.clearCurrentKeyCode = clearCurrentKeyCode;
    this.meSpeak = meSpeak;
    this.saveLocally = saveLocally;

    this.evalFlowDict = {};
    this.evalArgDict = {};
    this.evalParameterDict = {};
    this.evalSetterDict = {};
    this.evalOnStartList = {};
    this.evalOnStopList = {};
    this.eventList = {};

    this.boxes = {};
    this.actions = {};
    this.returns = [];
    this.turtleHeaps = {};
    this.invertList = {};

    // When we leave a clamp block, we need to dispatch a signal.
    this.endOfClampSignals = {};

    this.time = 0;
    this.firstNoteTime = null;
    this.waitTimes = {};
    this.turtleDelay = 0;
    this.sounds = [];
    this.cameraID = null;
    this.stopTurtle = false;
    this.lastKeyCode = null;
    this.saveTimeout = 0;

    // Music-related attributes
    this.notesPlayed = {};

    // pitch-drum matrix
    this.showPitchDrumMatrix = false;
    this.inPitchDrumMatrix = false;

    //rhythm-ruler
    this.inRhythmRuler = false;

    this.inPitchStairCase = false;

    this.inTempo = false;

    this.inPitchSlider = false;

    this._currentDrumBlock = null;

    // pitch-rhythm matrix
    this.inMatrix = false;
    this.keySignature = {};
    this.tupletRhythms = [];
    this.addingNotesToTuplet = false;
    this.drumBlocks = [];
    this.pitchBlocks = [];
    this.inNoteBlock = [];
    this.whichNoteBlock = [];

    // parameters used by pitch
    this.transposition = {};

    // parameters used by notes
    this._masterBPM = TARGETBPM;
    this.defaultBPMFactor = TONEBPM / this._masterBPM;

    this.beatFactor = {};
    this.dotCount = {};
    this.noteBeat = {};
    this.oscList = {};
    this.noteDrums = {};
    this.notePitches = {};
    this.noteOctaves = {};
    this.noteCents = {};
    this.noteHertz = {};
    this.noteTranspositions = {};
    this.noteBeatValues = {};

    this.lastNotePlayed = {};
    this.noteStatus = {};

    this.pitchNumberOffset = 39;  // C4

    // graphics listeners during note play
    this.forwardListener = {};
    this.rightListener = {};
    this.arcListener = {};

    // status of note being played
    // Deprecated (ref lastNotePlayed)
    this.currentNotes = {};
    this.currentOctaves = {};

    // parameters used by the note block
    this.bpm = {};
    this.turtleTime = [];
    this.noteDelay = 0;
    this.playedNote = {};
    this.playedNoteTimes = {};
    this.pushedNote = {};
    this.duplicateFactor = {};
    this.skipFactor = {};
    this.skipIndex = {};
    this.crescendoDelta = {};
    this.crescendoVolume = {};
    this.crescendoInitialVolume = {};
    this.intervals = {};
    this.perfect = {};
    this.diminished = {};
    this.augmented = {};
    this.major = {};
    this.minor = {};
    this.staccato = {};
    this.swing = {};
    this.swingTarget = {};
    this.swingCarryOver = {};
    this.tie = {};
    this.tieNote = {};
    this.tieCarryOver = {};
    this.polyVolume = {};
    this.validNote = true;
    this.drift = {};
    this.drumStyle = {};
    this.voices = {};
    this.backward = {};
    this.vibratoIntensity = {};
    this.vibratoRate = {};
    this.justCounting = {};
    // When counting notes or generating lilypond output...
    this.suppressOutput = {};

    // scale factor for turtle graphics embedded in notes
    this.dispatchFactor = {};

    // tuplet
    this.tuplet = false;
    this.tupletParams = [];

    // pitch to drum mapping
    this.pitchDrumTable = {};

    // parameters used by notations
    this.checkingLilypond = false;
    this.checkingLilypond = false;
    this.lilypondNotes = {};
    this.lilypondStaging = {};
    this.lilypondOutput = getLilypondHeader();
    this.runningLilypond = false;
    this.numerator = 3;
    this.denominator = 4;

    // Load the default synthesizer
    this.synth = new Synth();
    this.synth.loadSynth('poly');

    // Mide widget
    this.modeWidget = new ModeWidget();
    this._modeBlock = null;

    // Status matrix
    this.statusMatrix = new StatusMatrix();
    this.inStatusMatrix = false;
    this.statusFields = [];

    // When running in step-by-step mode, the next command to run is
    // queued here.
    this.stepQueue = {};
    this.unhighlightStepQueue = {};

    // Control points for bezier curves
    this.cp1x = {};
    this.cp1y = {};
    this.cp2x = {};
    this.cp2y = {};

    this.svgOutput = '';
    this.svgBackground = true;

    this.mic = new Tone.UserMedia();
    this.limit = 1024;
    this.analyser = new Tone.Analyser({
                        "type" : "waveform",
                        "size" : this.limit
                    });
    this.mic.connect(this.analyser);
                    

    // Used to pause between each block as the program executes.
    this.setTurtleDelay = function(turtleDelay) {
        this.turtleDelay = turtleDelay;
        this.noteDelay = 0;
    };

    // Used to pause between each note as the program executes.
    this.setNoteDelay = function(noteDelay) {
        this.noteDelay = noteDelay;
        this.turtleDelay = 0;
    };

    this.step = function() {
        // Take one step for each turtle in excuting Logo commands.
        for (var turtle in this.stepQueue) {
            if (this.stepQueue[turtle].length > 0) {
                if (turtle in this.unhighlightStepQueue && this.unhighlightStepQueue[turtle] != null) {
                    this.blocks.unhighlight(this.unhighlightStepQueue[turtle]);
                    this.unhighlightStepQueue[turtle] = null;
                }
                var blk = this.stepQueue[turtle].pop();
                if (blk != null) {
                    this._runFromBlockNow(this, turtle, blk, 0, null);
                }
            }
        }
    };

    this.stepNote = function() {
        // Step through one note for each turtle in excuting Logo
        // commands, but run through other blocks at full speed.
        var tempStepQueue = {};
        var notesFinish = {};
        var thisNote = {};
        var logo = this;
        __stepNote();

        function __stepNote() {
            for (var turtle in logo.stepQueue) {
                // Have we already played a note for this turtle?
                if (turtle in logo.playedNote && logo.playedNote[turtle]) {
                    continue;
                }
                if (logo.stepQueue[turtle].length > 0) {
                    if (turtle in logo.unhighlightStepQueue && logo.unhighlightStepQueue[turtle] != null) {
                        logo.blocks.unhighlight(logo.unhighlightStepQueue[turtle]);
                        logo.unhighlightStepQueue[turtle] = null;
                    }
                    var blk = logo.stepQueue[turtle].pop();
                    if (blk != null && blk !== notesFinish[turtle]) {
                        var block = logo.blocks.blockList[blk];
                        if (block.name === 'newnote') {
                            tempStepQueue[turtle] = blk;
                            notesFinish[turtle] = last(block.connections);
                            if (notesFinish[turtle] == null) { // end of flow
                                notesFinish[turtle] = last(logo.turtles.turtleList[turtle].queue) && last(logo.turtles.turtleList[turtle].queue).blk;
                                // catch case of null - end of project
                            }
                            // logo.playedNote[turtle] = true;
                            logo.playedNoteTimes[turtle] = logo.playedNoteTimes[turtle] || 0;
                            thisNote[turtle] = Math.pow(logo.parseArg(logo, turtle, block.connections[1], blk, null), -1);
                            logo.playedNoteTimes[turtle] += thisNote[turtle];
                            // Keep track of how long the note played for, so we can go back and play it again if needed
                        }
                        logo._runFromBlockNow(logo, turtle, blk, 0, null);
                    } else {
                        logo.playedNote[turtle] = true;
                    }
                }
            }

            // At this point, some turtles have played notes and others
            // have not. We need to keep stepping until they all have.
            var keepGoing = false;
            for (var turtle in logo.stepQueue) {
                if (logo.stepQueue[turtle].length > 0 && !logo.playedNote[turtle]) {
                    keepGoing = true;
                    break;
                }
            }
            if (keepGoing) {
                __stepNote();
                // logo.step();
            } else {
                var notesArray = [];
                for (var turtle in logo.playedNote) {
                    logo.playedNote[turtle] = false;
                    notesArray.push(logo.playedNoteTimes[turtle]);
                }

                // If some notes are supposed to play for longer, add
                // them back to the queue
                var shortestNote = Math.min.apply(null, notesArray);
                var continueFrom;
                for (var turtle in logo.playedNoteTimes) {
                    if (logo.playedNoteTimes[turtle] > shortestNote) {
                        continueFrom = tempStepQueue[turtle];
                        // Subtract the time, as if we haven't played it yet
                        logo.playedNoteTimes[turtle] -= thisNote[turtle];
                    } else {
                        continueFrom = notesFinish[turtle];
                    }
                    logo._runFromBlock(logo, turtle, continueFrom, 0, null);
                }
                if (shortestNote === Math.max.apply(null, notesArray)) {
                    logo.playedNoteTimes = {};
                }
            }
        };
    };

    this.doStopTurtle = function() {
        // The stop button was pressed. Stop the turtle and clean up a
        // few odds and ends.
        this.stopTurtle = true;
        this.turtles.markAsStopped();

        for (var sound in this.sounds) {
            this.sounds[sound].stop();
        }
        this.sounds = [];

        this.synth.stopSound('default');
        this.synth.stop();

        if (this.cameraID != null) {
            doStopVideoCam(this.cameraID, this.setCameraID);
        }

        this.onStopTurtle();
        this.blocks.bringToTop();

        this.stepQueue = {};
        this.unhighlightQueue = {};
    };

    this._clearParameterBlocks = function() {
        for (var blk in this.blocks.blockList) {
            if (this.blocks.blockList[blk].parameter) {
                this.blocks.blockList[blk].text.text = '';
                this.blocks.blockList[blk].container.updateCache();
            }
        }
        this.refreshCanvas();
    };

    this._updateParameterBlock = function(logo, turtle, blk) {
        // Update the label on parameter blocks.
        if (this.blocks.blockList[blk].protoblock.parameter) {
            var name = this.blocks.blockList[blk].name;
            var value = 0;
            switch (name) {
            case 'and':
            case 'or':
            case 'not':
            case 'less':
            case 'greater':
            case 'equal':
                if (this.blocks.blockList[blk].value) {
                    value = _('true');
                } else {
                    value = _('false');
                }
                break;
            case 'random':
            case 'mod':
            case 'sqrt':
            case 'int':
            case 'plus':
            case 'minus':
            case 'multiply':
            case 'power':
            case 'divide':
                value = this.blocks.blockList[blk].value;
                break;
            case 'namedbox':
                var name = this.blocks.blockList[blk].privateData;
                if (name in this.boxes) {
                    value = this.boxes[name];
                } else {
                    this.errorMsg(NOBOXERRORMSG, blk, name);
                }
                break;
            case 'box':
                var cblk = this.blocks.blockList[blk].connections[1];
                var boxname = this.parseArg(logo, turtle, cblk, blk);
                if (boxname in this.boxes) {
                    value = this.boxes[boxname];
                } else {
                    this.errorMsg(NOBOXERRORMSG, blk, boxname);
                }
                break;
            case 'x':
                value = toFixed2(this.turtles.turtleList[turtle].x.toFixed(2));
                break;
            case 'y':
                value = toFixed2(this.turtles.turtleList[turtle].y);
                break;
            case 'heading':
                value = toFixed2(this.turtles.turtleList[turtle].orientation);
                break;
            case 'color':
            case 'hue':
                value = toFixed2(this.turtles.turtleList[turtle].color);
                break;
            case 'shade':
                value = toFixed2(this.turtles.turtleList[turtle].value);
                break;
            case 'grey':
                value = toFixed2(this.turtles.turtleList[turtle].chroma);
                break;
            case 'pensize':
                value = toFixed2(this.turtles.turtleList[turtle].stroke);
                break;
            case 'time':
                var d = new Date();
                value = (d.getTime() - this.time) / 1000;
                break;
            case 'mousex':
                value = toFixed2(this.getStageX());
                break;
            case 'mousey':
                value = toFixed2(this.getStageY());
                break;
            case 'keyboard':
                value = this.lastKeyCode;
                break;
            case 'loudness':
                if (logo.mic == null) {
                    logo.errorMsg(NOMICERRORMSG);
                    value = 0;
                } else { 
                    var values = logo.analyser.analyse();
                    var sum = 0;
                    for (var k = 0; k < logo.limit; k++){
                        sum += (values[k] * values[k]);
                    }
                    value = Math.round(Math.sqrt(sum / logo.limit));
                }
                break;
            case 'consonantstepsizeup':
                if (this.lastNotePlayed[turtle] !== null) {
                    var len = this.lastNotePlayed[turtle][0].length;
                    value = getStepSizeUp(this.keySignature[turtle], this.lastNotePlayed[turtle][0].slice(0, len - 1));
                } else {
                    value = getStepSizeUp(this.keySignature[turtle], 'A');
                }
                break;
            case 'consonantstepsizedown':
                if (this.lastNotePlayed[turtle] !== null) {
                    var len = this.lastNotePlayed[turtle][0].length;
                    value = getStepSizeDown(this.keySignature[turtle], this.lastNotePlayed[turtle][0].slice(0, len - 1));
                } else {
                    value = getStepSizeDown(this.keySignature[turtle], 'A');
                }
                break;
            case 'transpositionfactor':
                value = this.transposition[turtle];
                break;
            case 'staccatofactor':
                value = last(this.staccato[turtle]);
                break;
            case 'slurfactor':
                value = -last(this.staccato[turtle]);
               break;
            case 'beatfactor':
                value = this.beatFactor[turtle];
                break;
            case 'elapsednotes':
                value = this.notesPlayed[turtle];
                break;
            case 'duplicatefactor':
                value = this.duplicateFactor[turtle];
                break;
            case 'skipfactor':
                value = this.skipFactor[turtle];
                break;
            case 'notevolumefactor':
                // FIX ME: bias and scaling
                value = last(this.polyVolume[turtle]);
                break;
            case 'turtlepitch':
                if (this.lastNotePlayed[turtle] !== null) {
                    var len = this.lastNotePlayed[turtle][0].length;
                    value = pitchToNumber(this.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(this.lastNotePlayed[turtle][0].slice(len - 1)), this.keySignature[turtle]) - logo.pitchNumberOffset;
                } else {
                    console.log('Could not find a note for turtle ' + turtle);
                    value = pitchToNumber('A', 4, this.keySignature[turtle])  - logo.pitchNumberOffset;
                }
                break;
                // Deprecated
            case 'currentnote':
                value = this.currentNotes[turtle];
                break;
                // Deprecated
            case 'currentoctave':
                value = this.currentoctave[turtle];
                break;
            case 'bpmfactor':
                if (this.bpm[turtle].length > 0) {
                    value = last(this.bpm[turtle]);
                } else {
                    value = this._masterBPM;
                }
                break;
            default:
                if (name in this.evalParameterDict) {
                    eval(this.evalParameterDict[name]);
                } else {
                    return;
                }
                break;
            }

            if (typeof(value) === 'string') {
                if (value.length > 6) {
                    value = value.substr(0, 5) + '...';
                }
                this.blocks.blockList[blk].text.text = value;
            } else {
                this.blocks.blockList[blk].text.text = mixedNumber(value);
            }
            this.blocks.blockList[blk].container.updateCache();
            this.refreshCanvas();
        }
    };

    this.runLogoCommands = function(startHere, env) {
        // Save the state before running.
        this.saveLocally();

        for (var arg in this.evalOnStartList) {
            eval(this.evalOnStartList[arg]);
        }

        this.stopTurtle = false;
        this.blocks.unhighlightAll();
        this.blocks.bringToTop(); // Draw under blocks.

        this.hideMsgs();

        // We run the Logo commands here.
        var d = new Date();
        this.time = d.getTime();
        this.firstNoteTime = null;

        // Ensure we have at least one turtle.
        if (this.turtles.turtleList.length === 0) {
            this.turtles.add(null);
        }

        for (var turtle in this.forwardListener) {
            for (var b in this.forwardListener[turtle]) {
                for (var i = 0; i < this.forwardListener[turtle][b].length; i++) {
                    this.stage.removeEventListener('_forward_' + turtle, this.forwardListener[turtle][b][i], false);
                }
            }
        }

        for (var turtle in this.rightListener) {
            for (var b in this.rightListener[turtle]) {
                for (var i = 0; i < this.rightListener[turtle][b].length; i++) {
                    this.stage.removeEventListener('_right_' + turtle, this.rightListener[turtle][b][i], false);
                }
            }
        }

        for (var turtle in this.arcListener) {
            for (var b in this.arcListener[turtle]) {
                for (var i = 0; i < this.arcListener[turtle][b].length; i++) {
                    this.stage.removeEventListener('_arc_' + turtle, this.arcListener[turtle][b][i], false);
                }
            }
        }

        this._masterBPM = TARGETBPM;
        this.defaultBPMFactor = TONEBPM / this._masterBPM;

        // Each turtle needs to keep its own wait time and music
        // states.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.turtleTime[turtle] = 0;
            this.waitTimes[turtle] = 0;
            this.endOfClampSignals[turtle] = {};
            this.cp1x[turtle] = 0;
            this.cp1y[turtle] = 100;
            this.cp2x[turtle] = 100;
            this.cp2y[turtle] = 100;
            this.inNoteBlock[turtle] = 0;
            this.transposition[turtle] = 0;
            this.noteBeat[turtle] = [];
            this.noteCents[turtle] = [];
            this.noteHertz[turtle] = [];
            this.lastNotePlayed[turtle] = null;
            this.noteStatus[turtle] = null;
            this.noteDrums[turtle] = [];
            this.notePitches[turtle] = [];
            this.noteOctaves[turtle] = [];
            this.currentNotes[turtle] = 'G';
            this.currentOctaves[turtle] = 4;
            this.noteTranspositions[turtle] = [];
            this.noteBeatValues[turtle] = [];
            this.forwardListener[turtle] = {};
            this.rightListener[turtle] = {};
            this.arcListener[turtle] = {};
            this.beatFactor[turtle] = 1;
            this.dotCount[turtle] = 0;
            this.invertList[turtle] = [];
            this.duplicateFactor[turtle] = 1;
            this.skipFactor[turtle] = 1;
            this.skipIndex[turtle] = 0;
            this.notesPlayed[turtle] = 0;
            this.keySignature[turtle] = 'C ' + _('major');
            this.pushedNote[turtle] = false;
            this.polyVolume[turtle] = [DEFAULTVOLUME];
            this.oscList[turtle] = [];
            this.bpm[turtle] = [];
            this.crescendoDelta[turtle] = [];
            this.crescendoInitialVolume[turtle] = [];
            this.crescendoVolume[turtle] = [];
            this.intervals[turtle] = [];
            this.perfect[turtle] = [];
            this.diminished[turtle] = [];
            this.augmented[turtle] = [];
            this.major[turtle] = [];
            this.minor[turtle] = [];
            this.staccato[turtle] = [];
            this.swing[turtle] = [];
            this.swingTarget[turtle] = [];
            this.swingCarryOver[turtle] = 0;
            this.tie[turtle] = false;
            this.tieNote[turtle] = [];
            this.tieCarryOver[turtle] = 0;
            this.drift[turtle] = 0;
            this.drumStyle[turtle] = [];
            this.voices[turtle] = [];
            this.pitchDrumTable[turtle] = {};
            this.backward[turtle] = [];
            this.vibratoIntensity[turtle] = [];
            this.vibratoRate[turtle] = [];
            this.dispatchFactor[turtle] = 1;
            this.justCounting[turtle] = false;
            this.suppressOutput[turtle] = this.runningLilypond;
        }

        this.pitchNumberOffset = 39;  // C4

        if (!this.suppressOutput[turtle]) {
            this._setSynthVolume(DEFAULTVOLUME, Math.max(this.turtles.turtleList.length - 1), 0);
        }

        this.inPitchDrumMatrix = false;
        this.inMatrix = false;
        this.inRhythmRuler = false;
        this._currentDrumBlock = null;
        this.inStatusMatrix = false;
        this.pitchBlocks = [];
        this.drumBlocks = [];
        this.tuplet = false;
        this._modeBlock = null;

        // Remove any listeners that might be still active
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            for (var listener in this.turtles.turtleList[turtle].listeners) {
                this.stage.removeEventListener(listener, this.turtles.turtleList[turtle].listeners[listener], false);
            }
            this.turtles.turtleList[turtle].listeners = {};
        }

        // First we need to reconcile the values in all the value
        // blocks with their associated textareas.
        // FIXME: Do we still need this check???
        for (var blk = 0; blk < this.blocks.blockList.length; blk++) {
            if (this.blocks.blockList[blk].label != null) {
                if (this.blocks.blockList[blk].labelattr != null && this.blocks.blockList[blk].labelattr.value !== '♮') {
                    this.blocks.blockList[blk].value = this.blocks.blockList[blk].label.value + this.blocks.blockList[blk].labelattr.value;
                } else {
                    this.blocks.blockList[blk].value = this.blocks.blockList[blk].label.value;
                }
            }
        }

        // Init the graphic state.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.turtles.turtleList[turtle].container.x = this.turtles.turtleX2screenX(this.turtles.turtleList[turtle].x);
            this.turtles.turtleList[turtle].container.y = this.turtles.turtleY2screenY(this.turtles.turtleList[turtle].y);
        }

        // Set up status block
        if (docById('statusmatrix').style.visibility === 'visible') {
            this.statusMatrix.init(this);
        }

        // Execute turtle code here...  Find the start block (or the
        // top of each stack) and build a list of all of the named
        // action stacks.
        var startBlocks = [];
        this.blocks.findStacks();
        this.actions = {};
        for (var blk = 0; blk < this.blocks.stackList.length; blk++) {
            if (this.blocks.blockList[this.blocks.stackList[blk]].name === 'start' || this.blocks.blockList[this.blocks.stackList[blk]].name === 'drum') {
                // Don't start on a start block in the trash.
                if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                    // Don't start on a start block with no connections.
                    if (this.blocks.blockList[this.blocks.stackList[blk]].connections[1] != null) {
                        startBlocks.push(this.blocks.stackList[blk]);
                    }
                }
            } else if (this.blocks.blockList[this.blocks.stackList[blk]].name === 'action') {
                // Does the action stack have a name?
                var c = this.blocks.blockList[this.blocks.stackList[blk]].connections[1];
                var b = this.blocks.blockList[this.blocks.stackList[blk]].connections[2];
                if (c != null && b != null) {
                    // Don't use an action block in the trash.
                    if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                        this.actions[this.blocks.blockList[c].value] = b;
                    }
                }
            }
        }

        this.svgOutput = '';
        this.svgBackground = true;

        this.parentFlowQueue = {};
        this.unhightlightQueue = {};
        this.parameterQueue = {};

        if (this.turtleDelay === 0) {
            // Don't update parameters when running full speed.
            this._clearParameterBlocks();
        }

        this.onRunTurtle();

        // And mark all turtles as not running.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.turtles.turtleList[turtle].running = false;
        }

        // (2) Execute the stack.
        // A bit complicated because we have lots of corner cases:
        if (startHere != null) {
            // console.log('startHere is ' + this.blocks.blockList[startHere].name);

            // If a block to start from was passed, find its
            // associated turtle, i.e., which turtle should we use?
            var turtle = 0;
            while(blocks.turtles.turtleList[turtle].trash && turtle < this.turtles.turtleList.length) {
                turtle += 1;
            }
            if (this.blocks.blockList[startHere].name === 'start' || this.blocks.blockList[startHere].name === 'drum') {
                var turtle = this.blocks.blockList[startHere].value;
                // console.log('starting on start with turtle ' + turtle);
            // } else {
                // console.log('starting on ' + this.blocks.blockList[startHere].name + ' with turtle ' + turtle);
            }

            this.turtles.turtleList[turtle].queue = [];
            this.parentFlowQueue[turtle] = [];
            this.unhightlightQueue[turtle] = [];
            this.parameterQueue[turtle] = [];
            this.turtles.turtleList[turtle].running = true;
            this._runFromBlock(this, turtle, startHere, 0, env);
        } else if (startBlocks.length > 0) {
            // If there are start blocks, run them all.
            for (var b = 0; b < startBlocks.length; b++) {
                var turtle = this.blocks.blockList[startBlocks[b]].value;
                this.turtles.turtleList[turtle].queue = [];
                this.parentFlowQueue[turtle] = [];
                this.unhightlightQueue[turtle] = [];
                this.parameterQueue[turtle] = [];
                if (!this.turtles.turtleList[turtle].trash) {
                    this.turtles.turtleList[turtle].running = true;
                    this._runFromBlock(this, turtle, startBlocks[b], 0, env);
                }
            }
        } else {
            // console.log('nothing to run');
            if (this.suppressOutput[turtle]) {
                this.errorMsg(NOACTIONERRORMSG, null, _('start'));
                this.suppressOutput[turtle] = false;
                this.checkingLilypond = false;
                // Reset cursor.
                document.body.style.cursor = 'default';
            }
        }
        this.refreshCanvas();
    };

    this._runFromBlock = function(logo, turtle, blk, isflow, receivedArg) {
        if (blk == null) {
            return;
        }

        var delay = logo.turtleDelay + logo.waitTimes[turtle];
        logo.waitTimes[turtle] = 0;

        if (!logo.stopTurtle) {
            if (logo.turtleDelay === TURTLESTEP) {
                // Step mode
                if (!(turtle in logo.stepQueue)) {
                    logo.stepQueue[turtle] = [];
                }
                logo.stepQueue[turtle].push(blk);
            } else {
                setTimeout(function() {
                    logo._runFromBlockNow(logo, turtle, blk, isflow, receivedArg);
                }, delay);
            }
        }
    };

    this._blockSetter = function(blk, value, turtle) {
        var turtleObj = this.turtles.turtleList[turtle];

        switch (this.blocks.blockList[blk].name) {
        case 'x':
            turtleObj.doSetXY(value, turtleObj.x);
            break;
        case 'y':
            turtleObj.doSetXY(turtleObj.y, value);
            break;
        case 'heading':
            turtleObj.doSetHeading(value);
            break;
        case 'color':
            turtleObj.doSetColor(value);
            break;
        case 'shade':
            turtleObj.doSetValue(value);
            break;
        case 'grey':
            turtleObj.doSetChroma(value);
            break;
        case 'pensize':
            turtleObj.doSetPensize(value);
            break;
        case 'namedbox':
            var name = this.blocks.blockList[blk].privateData;
            if (name in this.boxes) {
                this.boxes[name] = value;
            } else {
                this.errorMsg(NOBOXERRORMSG, blk, name);
            }
            break;
        case 'box':
            var cblk = this.blocks.blockList[blk].connections[1];
            var name = this.parseArg(this, turtle, cblk, blk);
            if (name in this.boxes) {
                this.boxes[name] = value;
            } else {
                this.errorMsg(NOBOXERRORMSG, blk, name);
            }
            break;
        case 'bpmfactor':
            var len = this.bpm[turtle].length;
            if (len > 0) {
                this.bpm[turtle][len - 1] = value;
            }
            break;
        case 'transpositionfactor':
            var len = this.transposition[turtle].length;
            if (len > 0) {
                this.transposition[turtle][len - 1] = value;
            }
            break;
        case 'staccatofactor':
            var len = this.staccato[turtle].length;
            if (len > 0) {
                this.staccato[turtle][len - 1] = value;
            }
            break;
        case 'slurfactor':
            // Slur is stored as a negative staccato.
            var len = this.staccato[turtle].length;
            if (len > 0) {
                this.staccato[turtle][len - 1] = -value;
            }
            break;
        case 'beatfactor':
            this.beatFactor[turtle] = value;
            break;
        case 'duplicatefactor':
            var len = this.duplicateFactor[turtle].length;
            if (len > 0) {
                this.duplicateFactor[turtle][len - 1] = value;
            }
            break;
        case 'skipfactor':
            var len = this.skipFactor[turtle].length;
            if (len > 0) {
                this.skipFactor[turtle][len - 1] = value;
            }
            break;
        case 'turtlepitch':
            var obj = numberToPitch(value + this.pitchNumberOffset);
            this.lastNotePlayed[turtle] = [obj[0]+obj[1], this.lastNotePlayed[turtle][1]];
            break;
        // Deprecated
        case 'currentnote':
            // A bit ugly because the setter call added the value
            // to the current note.
            var len = this.currentNotes[turtle].length;
            value = parseInt(value.slice(len));
            var newNoteObj = getNote(this.currentNotes[turtle], this.currentOctaves[turtle], value, this.keySignature[turtle]);
            this.currentNotes[turtle] = newNoteObj[0];
            this.currentOctaves[turtle] = newNoteObj[1];
            break;
        // Deprecated
        case 'currentoctave':
            this.currentOctaves[turtle] = Math.round(value);
            if (this.currentOctaves[turtle] < 1) {
                this.currentOctaves[turtle] = 1;
            }
            break;
        case 'notevolumefactor':
            var len = this.transposition[turtle].length;
            this.polyVolume[turtle][len - 1] = value;
            this._setSynthVolume(value, turtle);
            break;
        default:
            if (this.blocks.blockList[blk].name in this.evalSetterDict) {
                eval(this.evalSetterDict[this.blocks.blockList[blk].name]);
                break;
            }
            this.errorMsg(_('Block does not support incrementing.'), blk);
        }
    };

    this._runFromBlockNow = function(logo, turtle, blk, isflow, receivedArg, queueStart) {
        // Run a stack of blocks, beginning with blk.

        // Sometimes we don't want to unwind the entire queue.
        if (queueStart === undefined) {
            queueStart = 0;
        }

        // (1) Evaluate any arguments (beginning with connection[1]);
        var args = [];
        if (logo.blocks.blockList[blk].protoblock.args > 0) {
            for (var i = 1; i < logo.blocks.blockList[blk].protoblock.args + 1; i++) {
                if (logo.blocks.blockList[blk].protoblock.dockTypes[i] === 'in' && logo.blocks.blockList[blk].connections[i] == null){
                    console.log('skipping null inflow args');
                } else {
                    args.push(logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i], blk, receivedArg));
                }
            }
        }

        // (2) Run function associated with the block;
        if (logo.blocks.blockList[blk].isValueBlock()) {
            var nextFlow = null;
        } else {
            // All flow blocks have a nextFlow, but it can be null
            // (i.e., end of a flow).
            if (logo.backward[turtle].length > 0) {
                // We only run backwards in the "first generation" children.
                if (logo.blocks.blockList[last(logo.backward[turtle])].name === 'backward') {
                    var c = 1;
                } else {
                    var c = 2;
                }
                if (!logo.blocks.sameGeneration(logo.blocks.blockList[last(logo.backward[turtle])].connections[c], blk)) {
                    var nextFlow = last(logo.blocks.blockList[blk].connections);
                } else {
                    var nextFlow = logo.blocks.blockList[blk].connections[0];
                    if (logo.blocks.blockList[nextFlow].name === 'action' || logo.blocks.blockList[nextFlow].name === 'backward') {
                        nextFlow = null;
                    } else {
                        if (!logo.blocks.sameGeneration(logo.blocks.blockList[last(logo.backward[turtle])].connections[c], nextFlow)) {
                            var nextFlow = last(logo.blocks.blockList[blk].connections);
                        } else {
                            var nextFlow = logo.blocks.blockList[blk].connections[0];
                        }
                    }
                }
            } else {
                var nextFlow = last(logo.blocks.blockList[blk].connections);
            }

            if (nextFlow === -1) {
                nextFlow = null;
            }

            var queueBlock = new Queue(nextFlow, 1, blk, receivedArg);
            if (nextFlow != null) {  // This could be the last block
                logo.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }

        // Some flow blocks have childflows, e.g., repeat.
        var childFlow = null;
        var childFlowCount = 0;
        var actionArgs = [];

        if (logo.turtleDelay !== 0) {
            logo.blocks.highlight(blk, false);
        }

        switch (logo.blocks.blockList[blk].name) {
        case 'dispatch':
            // Dispatch an event.
            if (args.length === 1) {
                // If the event is not in the event list, add it.
                if (!(args[0] in logo.eventList)) {
                    var event = new Event(args[0]);
                    logo.eventList[args[0]] = event;
                }
                logo.stage.dispatchEvent(args[0]);
            }
            break;
        case 'listen':
            if (args.length === 2) {
                if (!(args[1] in logo.actions)) {
                    logo.errorMsg(NOACTIONERRORMSG, blk, args[1]);
                    logo.stopTurtle = true;
                } else {
                    var __listener = function (event) {
                        if (logo.turtles.turtleList[turtle].running) {
                            var queueBlock = new Queue(logo.actions[args[1]], 1, blk);
                            logo.parentFlowQueue[turtle].push(blk);
                            logo.turtles.turtleList[turtle].queue.push(queueBlock);
                        } else {
                            // Since the turtle has stopped
                            // running, we need to run the stack
                            // from here.
                            if (isflow) {
                                logo._runFromBlockNow(logo, turtle, logo.actions[args[1]], isflow, receivedArg);
                            } else {
                                logo._runFromBlock(logo, turtle, logo.actions[args[1]], isflow, receivedArg);
                            }
                        }
                    };

                    // If there is already a listener, remove it
                    // before adding the new one.
                    logo._setListener(turtle, args[0], __listener);
                }
            }
            break;
        case 'start':
        case 'drum':
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }
            break;
        case 'nameddo':
            var name = logo.blocks.blockList[blk].privateData;
            if (name in logo.actions) {
                if (!logo.justCounting[turtle]) {
                    lilypondLineBreak(logo, turtle);
                }

                if (logo.backward[turtle].length > 0) {
                    childFlow = logo.blocks.findBottomBlock(logo.actions[name]);
                    var actionBlk = logo.blocks.findTopBlock(logo.actions[name]);
                    logo.backward[turtle].push(actionBlk);

                    var listenerName = '_backward_action_' + turtle + '_' + blk;

                    var nextBlock = this.blocks.blockList[actionBlk].connections[2];
                    if (nextBlock == null) {
                        logo.backward[turtle].pop();
                    } else {
                        logo.endOfClampSignals[turtle][nextBlock] = [listenerName];
                    }

                    var __listener = function(event) {
                        logo.backward[turtle].pop();
                    };

                    logo._setListener(turtle, listenerName, __listener);
                } else {
                    childFlow = logo.actions[name];
                }

                childFlowCount = 1;
            } else {
                logo.errorMsg(NOACTIONERRORMSG, blk, name);
                logo.stopTurtle = true;
            }
            break;
            // If we clicked on an action block, treat it like a do
            // block.
        case 'action':
        case 'do':
            if (args.length > 0) {
                if (args[0] in logo.actions) {
                    if (!logo.justCounting[turtle]) {
                        lilypondLineBreak(logo, turtle);
                    }
                    childFlow = logo.actions[args[0]];
                    childFlowCount = 1;
                } else {
                    console.log('action ' + args[0] + ' not found');
                    logo.errorMsg(NOACTIONERRORMSG, blk, args[0]);
                    logo.stopTurtle = true;
                }
            }
            break;
        case 'nameddoArg':
            var name = logo.blocks.blockList[blk].privateData;
            while(actionArgs.length > 0) {
                actionArgs.pop();
            }
            if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                for (var i = 0; i < logo.blocks.blockList[blk].argClampSlots.length; i++){
                    var t = (logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i + 1], blk, receivedArg));
                    actionArgs.push(t);
                }
            }
            if (name in logo.actions) {
                if (!logo.justCounting[turtle]) {
                    lilypondLineBreak(logo, turtle);
                }

                if (logo.backward[turtle].length > 0) {
                    childFlow = logo.blocks.findBottomBlock(logo.actions[name]);
                    var actionBlk = logo.blocks.findTopBlock(logo.actions[name]);
                    logo.backward[turtle].push(actionBlk);

                    var listenerName = '_backward_action_' + turtle + '_' + blk;

                    var nextBlock = this.blocks.blockList[actionBlk].connections[2];
                    if (nextBlock == null) {
                        logo.backward[turtle].pop();
                    } else {
                        logo.endOfClampSignals[turtle][nextBlock] = [listenerName];
                    }

                    var __listener = function(event) {
                        logo.backward[turtle].pop();
                    };

                    logo._setListener(turtle, listenerName, __listener);
                } else {
                    childFlow = logo.actions[name]
                }

                childFlowCount = 1;
            } else{
                logo.errorMsg(NOACTIONERRORMSG, blk, name);
                logo.stopTurtle = true;
            }
            break;
        case 'doArg':
            while(actionArgs.length > 0) {
                actionArgs.pop();
            }
            if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                for (var i = 0; i < logo.blocks.blockList[blk].argClampSlots.length; i++){
                    var t = (logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i + 2], blk, receivedArg));
                    actionArgs.push(t);
                }
            }
            if (args.length >= 1) {
                if (args[0] in logo.actions) {
                    if (!logo.justCounting[turtle]) {
                        lilypondLineBreak(logo, turtle);
                    }
                    actionName = args[0];
                    childFlow = logo.actions[args[0]];
                    childFlowCount = 1;
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, args[0]);
                    logo.stopTurtle = true;
                }
            }
            break;
        case 'forever':
            if (args.length === 1) {
                childFlow = args[0];
                // If we are running in non-interactive mode, we
                // need to put a bounds on "forever".
                if (logo.suppressOutput[turtle]) {
                    childFlowCount = 10;
                } else {
                    childFlowCount = -1;
                }
            }
            break;
        case 'hidden':
        case 'hiddennoflow':
            // Hidden block is used at end of clamps and actions to
            // trigger listeners.
            break;
        case 'break':
            logo._doBreak(turtle);
            // Since we pop the queue, we need to unhighlight our
            // parent.
            var parentBlk = logo.blocks.blockList[blk].connections[0];
            if (parentBlk != null) {
                logo.unhightlightQueue[turtle].push(parentBlk);
            }
            break;
        case 'wait':
            if (args.length === 1) {
                logo._doWait(turtle, args[0]);
            }
            break;
        case 'print':
            if (!logo.inStatusMatrix) {
                if (args.length === 1) {
                    if (args[0] !== null) {
                        logo.textMsg(args[0].toString());
                    }
                }
            }
            break;
        case 'speak':
            if (args.length === 1) {
                if (logo.meSpeak) {
                    var text = args[0];
                    var new_text = "";
                    for (var i = 0; i < text.length; i++){
                        if ((text[i] >= 'a' && text[i] <= 'z') || (text[i] >= 'A' && text[i] <= 'Z') || text[i] === ',' || text[i] === '.' || text[i] === ' ')
                            new_text += text[i];
                    }
                    logo.meSpeak.speak(new_text);
                }
            }
            break;
        case 'repeat':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (args[0] <= 0) {
                    logo.errorMsg(POSNUMBER,blk);
                } else {
                    childFlow = args[1];
                    childFlowCount = Math.floor(args[0]);
                }
            }
            break;
        case 'clamp':
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }
            break;
        case 'until':
            // Similar to 'while'
            if (args.length === 2) {
                // Queue the child flow.
                childFlow = args[1];
                childFlowCount = 1;
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
            }
            break;
        case 'waitFor':
            if (args.length === 1) {
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
                    for (var i = queueLength - 1; i > 0; i--) {
                        if (logo.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                            logo.turtles.turtleList[turtle].queue.pop();
                        }
                    }
                }
            }
            break;
        case 'if':
            if (args.length === 2) {
                if (args[0]) {
                    childFlow = args[1];
                    childFlowCount = 1;
                }
            }
            break;
        case 'ifthenelse':
            if (args.length === 3) {
                if (args[0]) {
                    childFlow = args[1];
                    childFlowCount = 1;
                } else {
                    childFlow = args[2];
                    childFlowCount = 1;
                }
            }
            break;
        case 'while':
            // While is tricky because we need to recalculate
            // args[0] each time, so we requeue the While block
            // itself.
            if (args.length === 2) {
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
                    childFlow = args[1];
                    childFlowCount = 1;
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
                console.log('childFlow: ' + childFlow);
                console.log('parentFlow: ' + last(logo.parentFlowQueue[turtle]));
            }
            break;
        case 'storein':
            if (args.length === 2) {
                logo.boxes[args[0]] = args[1];
            }
            break;
        case 'incrementOne':
            var i = 1;
        case 'increment':
            // If the 2nd arg is not set, default to 1.
            if (args.length === 2) {
                var i = args[1];
            }

            if (args.length >= 1) {
                var settingBlk = logo.blocks.blockList[blk].connections[1];
                logo._blockSetter(settingBlk, args[0] + i, turtle);
            }
            break;
        case 'clear':
            logo.svgBackground = true;
            logo.turtles.turtleList[turtle].doClear();
            break;
        case 'setxy':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push([args[0], args[1]]);
                } else {
                    logo.turtles.turtleList[turtle].doSetXY(args[0], args[1]);
                }
            }
            break;
        case 'arc':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push([args[0], args[1]]);
                } else if (logo.inNoteBlock[turtle] > 0) {
                    if (!logo.suppressOutput[turtle]) {
                        var delta = args[0] / NOTEDIV;
                        var listenerName = '_arc_' + turtle + '_' + logo.whichNoteBlock[turtle];

                        var __listener = function (event) {
                            logo.turtles.turtleList[turtle].doArc(delta * logo.dispatchFactor[turtle], args[1]);
                        };

                        if (logo.whichNoteBlock[turtle] in logo.arcListener[turtle]) {
                            logo.arcListener[turtle][logo.whichNoteBlock[turtle]].push(__listener);
                        } else {
                            logo.arcListener[turtle][logo.whichNoteBlock[turtle]] = [__listener];
                        }

                        logo.stage.addEventListener(listenerName, __listener, false);
                    }
                } else {
                    logo.turtles.turtleList[turtle].doArc(args[0], args[1]);
                }
            }
            break;
        case 'bezier':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo.turtles.turtleList[turtle].doBezier(logo.cp1x[turtle], logo.cp1y[turtle], logo.cp2x[turtle], logo.cp2y[turtle], args[0], args[1]);
                }
            }
            break;
        case 'controlpoint1':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo.cp1x[turtle] = args[0];
                    logo.cp1y[turtle] = args[1];
                }
            }
            break;
        case 'controlpoint2':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo.cp2x[turtle] = args[0];
                    logo.cp2y[turtle] = args[1];
                }
            }
            break;
        case 'return':
            if (args.length === 1) {
                logo.returns.push(args[0]);
            }
            break;
        case 'returnToUrl':
            var URL = window.location.href;
            var urlParts;
            var outurl;
            if (URL.indexOf('?') > 0) {
                var urlParts = URL.split('?');
                if (urlParts[1].indexOf('&') >0) {
                    var newUrlParts = urlParts[1].split('&');
                    for (var i = 0; i < newUrlParts.length; i++) {
                        if (newUrlParts[i].indexOf('=') > 0) {
                            var tempargs = newUrlParts[i].split('=');
                            switch (tempargs[0].toLowerCase()) {
                            case 'outurl':
                                outurl = tempargs[1];
                                break;
                            }
                        }
                    }
                }
            }
            if (args.length === 1) {
                var jsonRet = {};
                jsonRet['result'] = args[0];
                var json= JSON.stringify(jsonRet);
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open('POST',outurl, true);
                // Call a function when the state changes.
                xmlHttp.onreadystatechange = function() {
                    if(xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                        alert(xmlHttp.responseText);
                    }
                };

                xmlHttp.send(json);
            }
            break;
        case 'forward':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else if (logo.inNoteBlock[turtle] > 0) {
                    if (!logo.suppressOutput[turtle]) {
                        var dist = args[0] / NOTEDIV;
                        var listenerName = '_forward_' + turtle + '_' + logo.whichNoteBlock[turtle];

                        var __listener = function (event) {
                            logo.turtles.turtleList[turtle].doForward(dist * logo.dispatchFactor[turtle]);
                        };

                        if (logo.whichNoteBlock[turtle] in logo.forwardListener[turtle]) {
                            logo.forwardListener[turtle][logo.whichNoteBlock[turtle]].push(__listener);
                        } else {
                            logo.forwardListener[turtle][logo.whichNoteBlock[turtle]] = [__listener];
                        }

                        logo.stage.addEventListener(listenerName, __listener, false);
                    }
                } else {
                    logo.turtles.turtleList[turtle].doForward(args[0]);
                }
            }
            break;
        case 'back':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else if (logo.inNoteBlock[turtle] > 0) {
                    if (!logo.suppressOutput[turtle]) {
                        var dist = -args[0] / NOTEDIV;
                        var listenerName = '_forward_' + turtle + '_' + logo.whichNoteBlock[turtle];

                        var __listener = function (event) {
                            logo.turtles.turtleList[turtle].doForward(dist * logo.dispatchFactor[turtle]);
                        };

                        if (logo.whichNoteBlock[turtle] in logo.forwardListener[turtle]) {
                            logo.forwardListener[turtle][logo.whichNoteBlock[turtle]].push(__listener);
                        } else {
                            logo.forwardListener[turtle][logo.whichNoteBlock[turtle]] = [__listener];
                        }

                        logo.stage.addEventListener(listenerName, __listener, false);
                    }
                } else {
                    logo.turtles.turtleList[turtle].doForward(-args[0]);
                }
            }
            break;
        case 'right':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else if (logo.inNoteBlock[turtle] > 0) {
                    if (!logo.suppressOutput[turtle]) {
                        var delta = args[0] / NOTEDIV;
                        var listenerName = '_right_' + turtle + '_' + logo.whichNoteBlock[turtle];

                        var __listener = function (event) {
                            logo.turtles.turtleList[turtle].doRight(delta * logo.dispatchFactor[turtle]);
                        };

                        if (logo.whichNoteBlock[turtle] in logo.rightListener[turtle]) {
                            logo.rightListener[turtle][logo.whichNoteBlock[turtle]].push(__listener);
                        } else {
                            logo.rightListener[turtle][logo.whichNoteBlock[turtle]] = [__listener];
                        }

                        logo.stage.addEventListener(listenerName, __listener, false);
                    }
                } else {
                    logo.turtles.turtleList[turtle].doRight(args[0]);
                }
            }
            break;
        case 'left':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else if (logo.inNoteBlock[turtle] > 0) {
                    if (!logo.suppressOutput[turtle]) {
                        var delta = -args[0] / NOTEDIV;
                        var listenerName = '_right_' + turtle + '_' + logo.whichNoteBlock[turtle];

                        var __listener = function (event) {
                            logo.turtles.turtleList[turtle].doRight(delta * logo.dispatchFactor[turtle]);
                        };

                        if (logo.whichNoteBlock[turtle] in logo.rightListener[turtle]) {
                            logo.rightListener[turtle][logo.whichNoteBlock[turtle]].push(__listener);
                        } else {
                            logo.rightListener[turtle][logo.whichNoteBlock[turtle]] = [__listener];
                        }

                        logo.stage.addEventListener(listenerName, __listener, false);
                    }
                } else {
                    logo.turtles.turtleList[turtle].doRight(-args[0]);
                }
            }
            break;
        case 'setheading':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else {
                    logo.turtles.turtleList[turtle].doSetHeading(args[0]);
                }
            }
            break;
        case 'show':
            if (args.length === 2) {
                if (typeof(args[1]) === 'string') {
                    var len = args[1].length;
                    if (len === 14 && args[1].substr(0, 14) === CAMERAVALUE) {
                        doUseCamera(args, logo.turtles, turtle, false, logo.cameraID, logo.setCameraID, logo.errorMsg);
                    } else if (len === 13 && args[1].substr(0, 13) === VIDEOVALUE) {
                        doUseCamera(args, logo.turtles, turtle, true, logo.cameraID, logo.setCameraID, logo.errorMsg);
                    } else if (len > 10 && args[1].substr(0, 10) === 'data:image') {
                        logo.turtles.turtleList[turtle].doShowImage(args[0], args[1]);
                    } else if (len > 8 && args[1].substr(0, 8) === 'https://') {
                        logo.turtles.turtleList[turtle].doShowURL(args[0], args[1]);
                    } else if (len > 7 && args[1].substr(0, 7) === 'http://') {
                        logo.turtles.turtleList[turtle].doShowURL(args[0], args[1]);
                    } else if (len > 7 && args[1].substr(0, 7) === 'file://') {
                        logo.turtles.turtleList[turtle].doShowURL(args[0], args[1]);
                    } else {
                        logo.turtles.turtleList[turtle].doShowText(args[0], args[1]);
                    }
                } else if (typeof(args[1]) === 'object' && logo.blocks.blockList[logo.blocks.blockList[blk].connections[2]].name === 'loadFile') {
                    if (args[1]) {
                        logo.turtles.turtleList[turtle].doShowText(args[0], args[1][1]);
                    } else {
                        logo.errorMsg(_('You must select a file.'));
                    }
                } else {
                    logo.turtles.turtleList[turtle].doShowText(args[0], args[1]);
                }
            }
            break;
        case 'turtleshell':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo.turtles.turtleList[turtle].doTurtleShell(args[0], args[1]);
                }
            }
            break;
        case 'setturtlename':
            var foundTargetTurtle = false;
            if (args.length === 2) {
                for (var i = 0; i < logo.turtles.turtleList.length; i++) {
                    if (logo.turtles.turtleList[i].name === args[0]) {
                        logo.turtles.turtleList[i].rename(args[1]);
                        foundTargetTurtle = true;
                        break;
                    }
                }
            }
            if (!foundTargetTurtle) {
                logo.errorMsg('Could not find turtle ' + args[0], blk);
            }
            break;
        case 'startTurtle':
            var targetTurtle = logo._getTargetTurtle(args);
            if (targetTurtle == null) {
                logo.errorMsg('Cannot find turtle: ' + args[0], blk)
            } else {
                if (logo.turtles.turtleList[targetTurtle].running) {
                    logo.errorMsg('Turtle is already running.', blk);
                    break;
                }
                logo.turtles.turtleList[targetTurtle].queue = [];
                logo.turtles.turtleList[targetTurtle].running = true;
                logo.parentFlowQueue[targetTurtle] = [];
                logo.unhightlightQueue[targetTurtle] = [];
                logo.parameterQueue[targetTurtle] = [];
                // Find the start block associated with this turtle.
                var foundStartBlock = false;
                for (var i = 0; i < logo.blocks.blockList.length; i++) {
                    if (logo.blocks.blockList[i] === logo.turtles.turtleList[targetTurtle].startBlock) {
                        foundStartBlock = true;
                        break;
                    }
                }
                if (foundStartBlock) {
                    logo._runFromBlock(logo, targetTurtle, i, isflow, receivedArg);
                } else {
                    logo.errorMsg('Cannot find start block for turtle: ' + args[0], blk)
                }
            }
            break;
        case 'stopTurtle':
            var targetTurtle = logo._getTargetTurtle(args);
            if (targetTurtle == null) {
                logo.errorMsg('Cannot find turtle: ' + args[0], blk)
            } else {
                logo.turtles.turtleList[targetTurtle].queue = [];
                logo.parentFlowQueue[targetTurtle] = [];
                logo.unhightlightQueue[targetTurtle] = [];
                logo.parameterQueue[targetTurtle] = [];
                logo._doBreak(targetTurtle);
            }
            break;
        case 'setcolor':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else {
                    logo.turtles.turtleList[turtle].doSetColor(args[0]);
                }
            }
            break;
        case 'setfont':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.turtles.turtleList[turtle].doSetFont(args[0]);
                } else {
                    logo.errorMsg(NOSTRINGERRORMSG, blk);
                    logo.stopTurtle = true;
                }
            }
            break;
        case 'sethue':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else {
                    logo.turtles.turtleList[turtle].doSetHue(args[0]);
                }
            }
            break;
        case 'setshade':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else {
                    logo.turtles.turtleList[turtle].doSetValue(args[0]);
                }
            }
            break;
        case 'settranslucency':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else {
                    args[0] %= 101;
                    var alpha = 1.0 - (args[0] / 100);
                    logo.turtles.turtleList[turtle].doSetPenAlpha(alpha);
                }
            }
            break;
        case 'setgrey':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else {
                    logo.turtles.turtleList[turtle].doSetChroma(args[0]);
                }
            }
            break;
        case 'setpensize':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else {
                    logo.turtles.turtleList[turtle].doSetPensize(args[0]);
                }
            }
            break;
        case 'fill':
            logo.turtles.turtleList[turtle].doStartFill();

            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_fill_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                logo.turtles.turtleList[turtle].doEndFill();
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
            // Deprecated
        case 'beginfill':
            logo.turtles.turtleList[turtle].doStartFill();
            break;
            // Deprecated
        case 'endfill':
            logo.turtles.turtleList[turtle].doEndFill();
            break;
        case 'hollowline':
            logo.turtles.turtleList[turtle].doStartHollowLine();

            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_hollowline_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                logo.turtles.turtleList[turtle].doEndHollowLine();
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
            // Deprecated
        case 'beginhollowline':
            logo.turtles.turtleList[turtle].doStartHollowLine();
            break;
            // Deprecated
        case 'endhollowline':
            logo.turtles.turtleList[turtle].doEndHollowLine();
            break;
        case 'fillscreen':
            if (args.length === 3) {
                var hue = logo.turtles.turtleList[turtle].color;
                var value = logo.turtles.turtleList[turtle].value;
                var chroma = logo.turtles.turtleList[turtle].chroma;
                logo.turtles.turtleList[turtle].doSetHue(args[0]);
                logo.turtles.turtleList[turtle].doSetValue(args[1]);
                logo.turtles.turtleList[turtle].doSetChroma(args[2]);
                logo.setBackgroundColor(turtle);
                logo.turtles.turtleList[turtle].doSetHue(hue);
                logo.turtles.turtleList[turtle].doSetValue(value);
                logo.turtles.turtleList[turtle].doSetChroma(chroma);
            }
            break;
        case 'nobackground':
            logo.svgBackground = false;
            break;
        case 'background':
            logo.setBackgroundColor(turtle);
            break;
        case 'penup':
            logo.turtles.turtleList[turtle].doPenUp();
            break;
        case 'pendown':
            logo.turtles.turtleList[turtle].doPenDown();
            break;
        case 'openProject':
            url = args[0];

            function ValidURL(str) {
                var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                                         '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                                         '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                                         '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                                         '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                                         '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
                if(!pattern.test(str)) {
                    logo.errorMsg('Please enter a valid URL.');
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
            break;
        case 'vspace':
            break;
        case 'playback':
            var sound = new Howl({
                urls: [args[0]]
            });
            logo.sounds.push(sound);
            sound.play();
            break;
        case 'stopplayback':
            for (var sound in logo.sounds) {
                logo.sounds[sound].stop();
            }
            logo.sounds = [];
            break;
        case 'stopvideocam':
            if (cameraID != null) {
                doStopVideoCam(logo.cameraID, logo.setCameraID);
            }
            break;
        case 'showblocks':
            logo.showBlocks();
            logo.setTurtleDelay(DEFAULTDELAY);
            break;
        case 'hideblocks':
            logo.hideBlocks();
            logo.setTurtleDelay(0);
            break;
        case 'savesvg':
            if (args.length === 1) {
                if (logo.svgBackground) {
                    logo.svgOutput = '<rect x="0" y="0" height="' + this.canvas.height + '" width="' + this.canvas.width + '" fill="' + body.style.background + '"/> ' + logo.svgOutput;
                }
                doSaveSVG(logo, args[0]);
            }
            break;
        case 'showHeap':
            if (!(turtle in logo.turtleHeaps)) {
                logo.turtleHeaps[turtle] = [];
            }
            logo.textMsg(JSON.stringify(logo.turtleHeaps[turtle]));
            break;
        case 'emptyHeap':
            logo.turtleHeaps[turtle] = [];
            break;
        case 'push':
            if (args.length === 1) {
                if (!(turtle in logo.turtleHeaps)) {
                    logo.turtleHeaps[turtle] = [];
                }
                logo.turtleHeaps[turtle].push(args[0]);
            }
            break;
        case 'saveHeap':
            function downloadFile(filename, mimetype, content) {
                var download = document.createElement('a');
                download.setAttribute('href', 'data:' + mimetype + ';charset-utf-8,' + content);
                download.setAttribute('download', filename);
                document.body.appendChild(download);
                download.click();
                document.body.removeChild(download);
            };

            if (args[0] && turtle in logo.turtleHeaps) {
                downloadFile(args[0], 'text/json', JSON.stringify(logo.turtleHeaps[turtle]));
            }
            break;
        case 'loadHeap':
            var block = logo.blocks.blockList[blk];
            if (turtle in logo.turtleHeaps) {
                var oldHeap = logo.turtleHeaps[turtle];
            } else {
                var oldHeap = [];
            }
            var c = block.connections[1];
            if (c != null && blocks.blockList[c].name === 'loadFile') {
                if (args.length !== 1) {
                    logo.errorMsg(_('You must select a file.'));
                } else {
                    try {
                        logo.turtleHeaps[turtle] = JSON.parse(blocks.blockList[c].value[1]);
                        if (!Array.isArray(logo.turtleHeaps[turtle])) {
                            throw 'is not array';
                        }
                    } catch (e) {
                        logo.turtleHeaps[turtle] = oldHeap;
                        logo.errorMsg(_('The file you selected does not contain a valid heap.'));
                    }
                }
            } else {
                logo.errorMsg(_('The loadHeap block needs a loadFile block.'))
            }
            break;
        case 'loadHeapFromApp':
            var data = [];
            var url = args[1];
            var name = args [0]
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open('GET', url, false );
            xmlHttp.send();
            if (xmlHttp.readyState === 4  && xmlHttp.status === 200){
                console.log(xmlHttp.responseText);
                try {
                    var data = JSON.parse(xmlHttp.responseText);
                } catch (e) {
                    console.log(e);
                    logo.errorMsg(_('Error parsing JSON data:') + e);
                }
            }
            else if (xmlHttp.readyState === 4 && xmlHttp.status !== 200) {
                console.log('fetched the wrong page or network error...');
                logo.errorMsg(_('404: Page not found'));
                break;
            }
            else {
                logo.errorMsg('xmlHttp.readyState: ' + xmlHttp.readyState);
                break;
            }
            if (name in logo.turtleHeaps){
                var oldHeap = turtleHeaps[turtle];
            } else {
                var oldHeap = [];
            }
            logo.turtleHeaps[name] = data;
            break;
        case 'saveHeapToApp':
            var name = args[0];
            var url = args[1];
            if (name in logo.turtleHeaps) {
                var data = JSON.stringify(logo.turtleHeaps[name]);
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open('POST', url, true);
                xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                xmlHttp.send(data);
            } else {
                logo.errorMsg(_('turtleHeaps does not contain a valid heap for') + ' ' + name);
            }
            break;
        case 'setHeapEntry':
            if (args.length === 2) {
                if (!(turtle in logo.turtleHeaps)) {
                    logo.turtleHeaps[turtle] = [];
                }
                var idx = Math.floor(args[0]);
                if (idx < 1) {
                    logo.errorMsg(_('Index must be > 0.'))
                }
                // If index > heap length, grow the heap.
                while (logo.turtleHeaps[turtle].length < idx) {
                    logo.turtleHeaps[turtle].push(null);
                }
                logo.turtleHeaps[turtle][idx - 1] = args[1];
            }
            break;

            // Actions for music-related blocks
        case 'savelilypond':
            if (args.length === 1) {
                saveLilypondOutput(logo, args[0]);
            }
            break;
        case 'setmasterbpm':
            if (args.length === 1 && typeof(args[0] === 'number')) {
                if (args[0] < 30) {
                    logo.errorMsg(_('Beats per minute must be > 30.'))
                    logo._masterBPM = 30;
                } else if (args[0] > 1000) {
                    logo.errorMsg(_('Maximum beats per minute is 1000.'))
                    logo._masterBPM = 1000;
                } else {
                    logo._masterBPM = args[0];
                }
                logo.defaultBPMFactor = TONEBPM / this._masterBPM;
            }
            if (this.inTempo) {
                tempo.BPMBlock = blk;
                var bpmnumberblock = blocks.blockList[blk].connections[1]
                tempo.BPM = blocks.blockList[bpmnumberblock].text.text;
            }
            break;
        case 'setbpm':
            if (args.length === 2 && typeof(args[0] === 'number')) {
                if (args[0] < 30) {
                    logo.errorMsg(_('Beats per minute must be > 30.'))
                    var bpm = 30;
                } else if (args[0] > 1000) {
                    logo.errorMsg(_('Maximum beats per minute is 1000.'))
                    var bpm = 1000;
                } else {
                    var bpm = args[0];
                }

                logo.bpm[turtle].push(bpm);

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_bpm_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.bpm[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        // Deprecated
        case 'setkey':
            if (args.length === 1) {
                logo.keySignature[turtle] = args[0];
            }
            break;
        case 'setkey2':
            if (args.length === 2) {
                var modename = 'major';
                for (var i = 0; i < MODENAMES.length; i++) {
                    if (MODENAMES[i][0] === args[1]) {
                        modename = MODENAMES[i][1];
                        logo._modeBlock = logo.blocks.blockList[blk].connections[2];
                        console.log(modename);
                        break;
                    }
                }
                logo.keySignature[turtle] = args[0] + ' ' + modename;
            }
            break;
        case 'rhythmruler':
            console.log("running rhythmruler");

            childFlow = args[1];
            childFlowCount = 1;
            // To do: restore previous state
            rhythmruler.Rulers = [];
            rhythmruler.Drums = [];
            logo.inRhythmRuler = true;

            var listenerName = '_rhythmruler_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                rhythmruler.init(logo);
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'pitchstaircase':
            pitchstaircase.Stairs = [];

            childFlow = args[0];
            childFlowCount = 1;
            logo.inPitchStairCase = true;

            var listenerName = '_pitchstaircase_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                pitchstaircase.init(logo);
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'tempo':
            console.log("running Tempo");
            childFlow = args[0];
            childFlowCount = 1;
            logo.inTempo = true;

            var listenerName = '_tempo_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                tempo.init(logo);
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'pitchslider':
            pitchslider.Sliders = [];

            childFlow = args[0];
            childFlowCount = 1;
            logo.inPitchSlider = true;

            var listenerName = '_pitchslider_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                pitchslider.init(logo);
                logo.inPitchSlider = false;
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'pitchdrummatrix':
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }
            logo.inPitchDrumMatrix = true;
            pitchdrummatrix.rowLabels = [];
            pitchdrummatrix.rowArgs = [];
            pitchdrummatrix.drums = [];
            pitchdrummatrix.clearBlocks();

            var listenerName = '_pitchdrummatrix_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (pitchdrummatrix.drums.length === 0 || pitchdrummatrix.rowLabels.length === 0) {
                    logo.errorMsg(_('You must have at least one pitch block and one drum block in the matrix.'), blk);
                } else {
                    // Process queued up rhythms.
                    pitchdrummatrix.init(logo);
                    pitchdrummatrix.makeClickable();
                }
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'modewidget':
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }

            var listenerName = '_modewidget_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                console.log(logo.keySignature[turtle]);
                logo.modeWidget.init(logo, logo._modeBlock);
            }

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'status':
            logo.statusMatrix.init(logo);
            logo.statusFields = [];
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }

            logo.inStatusMatrix = true;

            var listenerName = '_status_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                logo.statusMatrix.init(logo);
                logo.inStatusMatrix = false;
            }

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'matrix':
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }
            logo.inMatrix = true;
            pitchtimematrix.rowLabels = [];
            pitchtimematrix.rowArgs = [];
            pitchtimematrix.graphicsBlocks = [];
            pitchtimematrix.clearBlocks();

            logo.tupletRhythms = [];
            logo.tupletParams = [];
            logo.addingNotesToTuplet = false;

            var listenerName = '_matrix_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (logo.tupletRhythms.length === 0 || pitchtimematrix.rowLabels.length === 0) {
                    logo.errorMsg(_('You must have at least one pitch block and one rhythm block in the matrix.'), blk);
                } else {
                    // Process queued up rhythms.
                    pitchtimematrix.init(logo);

                    for (var i = 0; i < logo.tupletRhythms.length; i++) {
                        // We have two cases: (1) notes in a tuplet;
                        // and (2) rhythm block outside of a
                        // tuplet. Rhythm blocks in a tuplet are
                        // converted to notes.
                        switch (logo.tupletRhythms[i][0]) {
                        case 'notes':
                            var tupletParam = [logo.tupletParams[logo.tupletRhythms[i][1]]];
                            tupletParam.push([]);
                            for (var j = 2; j < logo.tupletRhythms[i].length; j++) {
                                tupletParam[1].push(logo.tupletRhythms[i][j]);
                            }
                            pitchtimematrix.addTuplet(tupletParam);
                            break;
                        case 'simple':
                            var tupletParam = [logo.tupletParams[logo.tupletRhythms[i][1]]];
                            tupletParam.push([]);
                            for (var j = 2; j < logo.tupletRhythms[i].length; j++) {
                                tupletParam[1].push(logo.tupletRhythms[i][j]);
                            }
                            pitchtimematrix.addTuplet(tupletParam);
                            break;
                        default:
                            pitchtimematrix.addNotes(logo.tupletRhythms[i][1], logo.tupletRhythms[i][2]);
                            break;
                        }
                    }

                    pitchtimematrix.makeClickable();
                }
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'invert1':
            if (typeof(args[2]) === 'number') {
                if (args[2] % 2 === 0){
                    args[2] = 'even';
                } else {
                    args[2] = 'odd';
                }
            } 
            
            if (args[2] === _('even')) {
                args2 = 'even';
            }

            if (args[2] === _('odd')) {
                args2 = 'odd';
            }

            if (args[2] === 'even' || args[2] === 'odd'){
                logo.invertList[turtle].push([args[0], args[1], args[2]]);
            } else {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                break;
            }

            childFlow = args[3];
            childFlowCount = 1;
            var listenerName = '_invert_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.invertList[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'invert2':
        case 'invert':
            // Deprecated
            if (logo.blocks.blockList[blk].name === 'invert') {
                logo.invertList[turtle].push([args[0], args[1], 'even']);
            } else {
                logo.invertList[turtle].push([args[0], args[1], 'odd']);
            }
            childFlow = args[2];
            childFlowCount = 1;

            var listenerName = '_invert_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                logo.invertList[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'backward':
            logo.backward[turtle].push(blk);
            // Set child to bottom block inside clamp
            childFlow = logo.blocks.findBottomBlock(args[0]);
            childFlowCount = 1;

            var listenerName = '_backward_' + turtle + '_' + blk;

            var nextBlock = this.blocks.blockList[blk].connections[1];
            if (nextBlock == null) {
                logo.backward[turtle].pop();
            } else {
                logo.endOfClampSignals[turtle][nextBlock] = [listenerName];
            }

            var __listener = function(event) {
                logo.backward[turtle].pop();
                // Since a backward block was requeued each
                // time, we need to flush it from the queue.
                // logo.turtles.turtleList[turtle].queue.pop();
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'rest2':
            logo.notePitches[turtle].push('rest');
            logo.noteOctaves[turtle].push(4);
            logo.noteCents[turtle].push(0);
            logo.noteHertz[turtle].push(0);
            logo.noteBeatValues[turtle].push(1);
            logo.pushedNote[turtle] = true;
            break;
        case 'steppitch':
            // Similar to pitch but calculated from previous note played.
            if (logo.inNoteBlock[turtle] === 0) {
                logo.errorMsg(_('The Step Pitch Block must be used inside of a Note Block.'), blk);
                logo.stopTurtle = true;
                break;
            }

            if (typeof(args[0]) !== 'number') {
                logo.errorMsg(NANERRORMSG, blk);
                logo.stopTurtle = true;
                break;
            }

            if (logo.lastNotePlayed[turtle] == null) {
                logo.errorMsg('The Step Pitch Block must be preceded by a Pitch Block.', blk);
                logo.stopTurtle = true;
                break;
            }

            function addPitch(note, octave, cents) {
                if (logo.drumStyle[turtle].length > 0) {
                    var drumname = last(logo.drumStyle[turtle]);
                    var note2 = logo.getNote(note, octave, transposition, logo.keySignature[turtle]);
                    logo.pitchDrumTable[turtle][note2[0] + note2[1]] = drumname;
                }
                logo.notePitches[turtle].push(note);
                logo.noteOctaves[turtle].push(octave);
                logo.noteCents[turtle].push(cents);
                if (cents !== 0) {
                    logo.noteHertz[turtle].push(pitchToFrequency(note, octave, cents, logo.keySignature[turtle]));
                } else {
                    logo.noteHertz[turtle].push(0);
                }
            }

            var len = logo.lastNotePlayed[turtle][0].length;
            if (args[0] >= 1) {
                var n = Math.floor(args[0]);
                var value = getStepSizeUp(logo.keySignature[turtle], logo.lastNotePlayed[turtle][0].slice(0, len - 1));
                var noteObj = logo.getNote(logo.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(logo.lastNotePlayed[turtle][0].slice(len - 1)), value, logo.keySignature[turtle]);
                for (var i = 1; i < n; i++) {
                    var value = getStepSizeUp(logo.keySignature[turtle], noteObj[0]);
                    noteObj = logo.getNote(noteObj[0], noteObj[1], value, logo.keySignature[turtle]);
                }
            } else if (args[0] <= -1) {
                var n = -Math.ceil(args[0]);
                value = getStepSizeDown(logo.keySignature[turtle], logo.lastNotePlayed[turtle][0].slice(0, len - 1));
                var noteObj = logo.getNote(logo.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(logo.lastNotePlayed[turtle][0].slice(len - 1)), value, logo.keySignature[turtle]);
                for (var i = 1; i < n; i++) {
                    var value = getStepSizeDown(logo.keySignature[turtle], noteObj[0]);
                    noteObj = logo.getNote(noteObj[0], noteObj[1], value, logo.keySignature[turtle]);
                }
            } else {  // Repeat last pitch played.
                var noteObj = logo.getNote(logo.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(logo.lastNotePlayed[turtle][0].slice(len - 1)), 0, logo.keySignature[turtle]);
            }

            var delta = 0;
            if (!(logo.invertList[turtle].length === 0)) {
                var len = logo.invertList[turtle].length;
                var note1 = logo.getNote(noteObj[0], noteObj[1], 0, logo.keySignature[turtle]);
                var num1 = getNumber(note1[0], note1[1]);
                for (var i = len - 1; i > -1; i--) {
                    var note2 = logo.getNote(logo.invertList[turtle][i][0], logo.invertList[turtle][i][1], 0, logo.keySignature[turtle]);
                    var num2 = getNumber(note2[0], note2[1]);
                    // var a = getNumNote(num1, 0);
                    if (logo.invertList[turtle][i][2] === 'even') {
                        delta += num2 - num1;
                    } else {  // odd
                        delta += num2 - num1 + 0.5;
                    }
                    num1 += 2 * delta;
                }
            }

            addPitch(noteObj[0], noteObj[1], 0);

            if (turtle in logo.intervals && logo.intervals[turtle].length > 0) {
                for (var i = 0; i < logo.intervals[turtle].length; i++) {
                    var ii = getInterval(logo.intervals[turtle][i], logo.keySignature[turtle], noteObj[0]);
                    var noteObj2 = logo.getNote(noteObj[0], noteObj[1], ii, logo.keySignature[turtle]);
                    addPitch(noteObj2[0], noteObj2[1], 0);
                }
            }

            if (turtle in logo.perfect && logo.perfect[turtle].length > 0) {
                var noteObj2 = logo.getNote(noteObj[0], noteObj[1], calcPerfect(last(logo.perfect[turtle])), logo.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in logo.diminished && logo.diminished[turtle].length > 0) {
                var noteObj2 = logo.getNote(noteObj[0], noteObj[1], calcDiminished(last(logo.diminished[turtle])), logo.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in logo.augmented && logo.augmented[turtle].length > 0) {
                var noteObj2 = logo.getNote(noteObj[0], noteObj[1], calcAugmented(last(logo.augmented[turtle])), logo.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in logo.major && logo.major[turtle].length > 0) {
                var noteObj2 = logo.getNote(noteObj[0], noteObj[1], calcMajor(last(logo.major[turtle])), logo.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in logo.minor && logo.minor[turtle].length > 0) {
                var noteObj2 = logo.getNote(noteObj[0], noteObj[1], calcMinor(last(logo.minor[turtle])), logo.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in logo.transposition) {
                logo.noteTranspositions[turtle].push(logo.transposition[turtle] + 2 * delta);
            } else {
                logo.noteTranspositions[turtle].push(2 * delta);
            }

            if (turtle in logo.beatFactor) {
                logo.noteBeatValues[turtle].push(logo.beatFactor[turtle]);
            } else {
                logo.noteBeatValues[turtle].push(1);
            }

            logo.pushedNote[turtle] = true;
            break;
        case 'playdrum':
            if (args.length !== 1 || args[0] == null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                break;
            }

            if (typeof(args[0]) !== 'string') {
                logo.errorMsg(NANERRORMSG, blk);
                logo.stopTurtle = true;
                break;
            }

            var drumname = 'kick';
            if (args[0].slice(0, 4) === 'http') {
                drumname = args[0];
            } else {
                for (var drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0] === args[0]) {
                        drumname = DRUMNAMES[drum][1];
                        break;
                    } else if (DRUMNAMES[drum][1] === args[0]) {
                        drumname = args[0];
                        break;
                    }
                }
            }

            // If we are in a setdrum clamp, override the drum name.
            if (logo.drumStyle[turtle].length > 0) {
                drumname = last(logo.drumStyle[turtle]);
            }

            if (logo.inPitchDrumMatrix) {
                pitchdrummatrix.drums.push(drumname);
                pitchdrummatrix.addColBlock(blk);
                if (logo.drumBlocks.indexOf(blk) === -1) {
                    logo.drumBlocks.push(blk);
                }
            } else if (logo.inMatrix) {
                pitchtimematrix.rowLabels.push(drumname);
                pitchtimematrix.rowArgs.push(-1);

                pitchtimematrix.addRowBlock(blk);
                if (logo.drumBlocks.indexOf(blk) === -1) {
                    logo.drumBlocks.push(blk);
                }
            } else if (logo.inNoteBlock[turtle] > 0) {
                logo.noteDrums[turtle].push(drumname);
            } else {
                logo.errorMsg(_('Drum Block: Did you mean to use a Note block?'), blk);
                break;
            }

            if (turtle in logo.beatFactor) {
                logo.noteBeatValues[turtle].push(logo.beatFactor[turtle]);
            } else {
                logo.noteBeatValues[turtle].push(1);
            }

            logo.pushedNote[turtle] = true;
            break;
        case 'setpitchnumberoffset':
            if (args.length !== 2 || args[0] == null || args[1] == null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                break;
            }

            logo.pitchNumberOffset = pitchToNumber(args[0], args[1], logo.keySignature[turtle]);
            break;
        case 'pitchnumber':
        case 'scaledegree':
        case 'pitch':
            calcOctave = function(arg) {
                switch(arg) {
                case 1:
                case _('next'):
                case 'next':
                    return Math.min(logo.currentOctaves[turtle] + 1, 10);
                case -1:
                case _('previous'):
                case 'previous':
                    return Math.max(logo.currentOctaves[turtle] - 1, 1);
                case _('current'):
                case 'current':
                case 0:
                    return logo.currentOctaves[turtle];
                default:
                    return arg;
                }
            };

            if (logo.blocks.blockList[blk].name == 'pitchnumber') {
                if (args.length !== 1 || args[0] == null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    logo.stopTurtle = true;
                    break;
                }

                if (typeof(args[0]) !== 'number') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                    break;
                }

                // In number to pitch we assume A0 == 0. Here we
                // assume that C4 == 0, so we need an offset of 39.
                var obj = numberToPitch(Math.floor(args[0] + logo.pitchNumberOffset));
                note = obj[0];
                octave = obj[1];
                cents = 0;
            } else {
                if (args.length !== 2 || args[0] == null || args[1] == null) {
                    logo.errorMsg(NOINPUTERRORMSG, blk);
                    logo.stopTurtle = true;
                    break;
                }

                /*
                if (typeof(args[1]) !== 'number') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                    break;
                }
                */

                if (typeof(args[0]) === 'number' && logo.blocks.blockList[blk].name == 'pitch') {
                    // We interpret numbers two different ways:
                    // (1) a positive integer between 1 and 12 is taken to be
                    // a moveable solfege, e.g., 1 == do; 2 == re...
                    // (2) if frequency is input, ignore octave (args[1]).
                    // Negative numbers will throw an error.
                    if (args[0] < 1) {
                        note = '?'; // throws an error
                    } else if (args[0] < 13) { // moveable solfege
                        note = scaleDegreeToPitch(logo.keySignature[turtle], Math.floor(args[0]));
                        var octave = Math.floor(calcOctave(args[1]));
                        var cents = 0;
                    } else if (args[0] < A0 || args[0] > C8) {
                        note = '?'; // throws an error
                    } else {
                        var obj = frequencyToPitch(args[0]);
                        var note = obj[0];
                        var octave = obj[1];
                        var cents = obj[2];
                    }

                    if (note === '?') {
                        logo.errorMsg(INVALIDPITCH, blk);
                        logo.stopTurtle = true;
                        break;
                    }
                } else if (typeof(args[0]) === 'number' && logo.blocks.blockList[blk].name == 'scaledegree') {
                    if (args[0] < 0) {
                        var neg = true;
                        args[0] = -args[0];
                    } else {
                        var neg = false;
                    }

                    if (args[0] == 0) {
                        note = '?'; // throws an error
                    } else {
                        var obj = keySignatureToMode(logo.keySignature[turtle]);
                        var modeLength = MUSICALMODES[obj[1]].length;
                        var scaleDegree = Math.floor(args[0] - 1) % modeLength;
                        scaleDegree += 1;

                        if (neg) {
                            // -1, 4 --> do 4; -2, 4 --> ti 3; -8, 4 --> do 3
                            if (scaleDegree > 1) {
                                scaleDegree = modeLength - scaleDegree + 2;
                            }
                            note = scaleDegreeToPitch(logo.keySignature[turtle], scaleDegree);
                            var deltaOctave = Math.floor((args[0] + modeLength - 2) / modeLength);
                            var octave = Math.floor(calcOctave(args[1])) - deltaOctave;
                        } else {
                            //  1, 4 --> do 4;  2, 4 --> re 4;  8, 4 --> do 5
                            note = scaleDegreeToPitch(logo.keySignature[turtle], scaleDegree);
                            var deltaOctave = Math.floor((args[0] - 1) / modeLength);
                            var octave = Math.floor(calcOctave(args[1])) + deltaOctave;
                        }
                        var cents = 0;
                    }

                    if (note === '?') {
                        logo.errorMsg(INVALIDPITCH, blk);
                        logo.stopTurtle = true;
                        break;
                    }
                } else {
                    var cents = 0;
                    var note = args[0];
                    if (calcOctave(args[1]) < 1) {
                        console.log('minimum allowable octave is 1');
                        var octave = 1;
                    } else if (calcOctave(args[1]) > 10) {
                        // Humans can only hear 10 octaves.
                        console.log('clipping octave at 10');
                        var octave = 10;
                    } else {
                        // Octave must be a whole number.
                        var octave = Math.floor(calcOctave(args[1]));
                    }

                    logo.getNote(note, octave, 0, logo.keySignature[turtle]);
                    if (!logo.validNote) {
                        logo.errorMsg(INVALIDPITCH, blk);
                        logo.stopTurtle = true;
                        break;
                    }
                }
            }

            var delta = 0;

            if (logo.inPitchDrumMatrix) {
                if (note.toLowerCase() !== 'rest') {
                    pitchdrummatrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                }
                if (!(logo.invertList[turtle].length === 0)) {
                    var delta = 0;
                    var len = logo.invertList[turtle].length;
                    // Get an anchor note and its corresponding
                    // number, which is used to calculate delta.
                    var note1 = logo.getNote(note, octave, 0, logo.keySignature[turtle]);
                    var num1 = logo.getNumber(note1[0], note1[1]);
                    for (var i = len - 1; i > -1; i--) {
                        // Note from which delta is calculated.
                        var note2 = logo.getNote(logo.invertList[turtle][i][0], logo.invertList[turtle][i][1], 0, logo.keySignature[turtle]);
                        var num2 = getNumber(note2[0], note2[1]);
                        // var a = getNumNote(num1, 0);
                        if (logo.invertList[turtle][i][2] === 'even') {
                            delta += num2 - num1;
                        } else {  // odd
                            delta += num2 - num1 + 0.5;
                        }
                        num1 += 2 * delta;
                    }
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

                    var nnote = logo.getNote(note, octave, transposition, logo.keySignature[turtle]);
                    if (noteIsSolfege(note)) {
                        nnote[0] = getSolfege(nnote[0]);
                    }

                    if (logo.drumStyle[turtle].length > 0) {
                        pitchdrummatrix.drums.push(last(logo.drumStyle[turtle]));
                    } else {
                        pitchdrummatrix.rowLabels.push(nnote[0]);
                        pitchdrummatrix.rowArgs.push(nnote[1]);
                    }
                }
            } else if (logo.inMatrix) {
                if (note.toLowerCase() !== 'rest') {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                }

                if (!(logo.invertList[turtle].length === 0)) {
                    var delta = 0;
                    var len = logo.invertList[turtle].length;
                    // Get an anchor note and its corresponding
                    // number, which is used to calculate delta.
                    var note1 = logo.getNote(note, octave, 0, logo.keySignature[turtle]);
                    var num1 = logo.getNumber(note1[0], note1[1]);
                    for (var i = len - 1; i > -1; i--) {
                        // Note from which delta is calculated.
                        var note2 = logo.getNote(logo.invertList[turtle][i][0], logo.invertList[turtle][i][1], 0, logo.keySignature[turtle]);
                        var num2 = getNumber(note2[0], note2[1]);
                        // var a = getNumNote(num1, 0);
                        if (logo.invertList[turtle][i][2] === 'even') {
                            delta += num2 - num1;
                        } else {  // odd
                            delta += num2 - num1 + 0.5;
                        }
                        num1 += 2 * delta;
                    }
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

                    var nnote = logo.getNote(note, octave, transposition, logo.keySignature[turtle]);
                    if (noteIsSolfege(note)) {
                        nnote[0] = getSolfege(nnote[0]);
                    }

                    // If we are in a setdrum clamp, override the pitch.
                    if (logo.drumStyle[turtle].length > 0) {
                        pitchtimematrix.rowLabels.push(last(logo.drumStyle[turtle]));
                        pitchtimematrix.rowArgs.push(-1);
                    } else {
                        pitchtimematrix.rowLabels.push(nnote[0]);
                        pitchtimematrix.rowArgs.push(nnote[1]);
                    }
                }
            } else if (logo.inNoteBlock[turtle] > 0) {

                function addPitch(note, octave, cents) {
                    if (logo.drumStyle[turtle].length > 0) {
                        var drumname = last(logo.drumStyle[turtle]);
                        var note2 = logo.getNote(note, octave, transposition, logo.keySignature[turtle]);
                        logo.pitchDrumTable[turtle][note2[0]+note2[1]] = drumname;
                    }
                    logo.notePitches[turtle].push(note);
                    logo.noteOctaves[turtle].push(octave);
                    logo.noteCents[turtle].push(cents);
                    if (cents !== 0) {
                        logo.noteHertz[turtle].push(pitchToFrequency(note, octave, cents, logo.keySignature[turtle]));
                    } else {
                        logo.noteHertz[turtle].push(0);
                    }
                }

                if (!(logo.invertList[turtle].length === 0)) {
                    var len = logo.invertList[turtle].length;
                    var note1 = logo.getNote(note, octave, 0, logo.keySignature[turtle]);
                    var num1 = getNumber(note1[0], note1[1]);
                    for (var i = len - 1; i > -1; i--) {
                        var note2 = logo.getNote(logo.invertList[turtle][i][0], logo.invertList[turtle][i][1], 0, logo.keySignature[turtle]);
                        var num2 = getNumber(note2[0], note2[1]);
                        // var a = getNumNote(num1, 0);
                        if (logo.invertList[turtle][i][2] === 'even') {
                            delta += num2 - num1;
                        } else {  // odd
                            delta += num2 - num1 + 0.5;
                        }
                        num1 += 2 * delta;
                    }
                }

                addPitch(note, octave, cents);

                if (turtle in logo.intervals && logo.intervals[turtle].length > 0) {
                    for (var i = 0; i < logo.intervals[turtle].length; i++) {
                        var ii = getInterval(logo.intervals[turtle][i], logo.keySignature[turtle], note);
                        var noteObj = logo.getNote(note, octave, ii, logo.keySignature[turtle]);
                        addPitch(noteObj[0], noteObj[1], cents);
                    }
                }

                if (turtle in logo.perfect && logo.perfect[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcPerfect(last(logo.perfect[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in logo.diminished && logo.diminished[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcDiminished(last(logo.diminished[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in logo.augmented && logo.augmented[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcAugmented(last(logo.augmented[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in logo.major && logo.major[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcMajor(last(logo.major[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in logo.minor && logo.minor[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcMinor(last(logo.minor[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in logo.transposition) {
                    logo.noteTranspositions[turtle].push(logo.transposition[turtle] + 2 * delta);
                } else {
                    logo.noteTranspositions[turtle].push(2 * delta);
                }

                if (turtle in logo.beatFactor) {
                    logo.noteBeatValues[turtle].push(logo.beatFactor[turtle]);
                } else {
                    logo.noteBeatValues[turtle].push(1);
                }

                logo.pushedNote[turtle] = true;
            } else if (logo.drumStyle[turtle].length > 0) {
                var drumname = last(logo.drumStyle[turtle]);
                var note2 = logo.getNote(note, octave, transposition, logo.keySignature[turtle]);
                logo.pitchDrumTable[turtle][note2[0]+note2[1]] = drumname;
            } else if (logo.inPitchStairCase) {
                var frequency = pitchToFrequency(args[0], calcOctave(args[1]), 0, logo.keySignature[turtle]);
                var note = logo.getNote(args[0], calcOctave(args[1]), 0, logo.keySignature[turtle]);
                var flag = 0;

                for (var i = 0 ; i < pitchstaircase.Stairs.length; i++) {
                    if (pitchstaircase.Stairs[i][2] < parseFloat(frequency)) {
                        pitchstaircase.Stairs.splice(i, 0, [note[0], note[1], parseFloat(frequency), 1, 1]);
                        flag = 1;
                        break;
                    }

                    if (pitchstaircase.Stairs[i][2] === parseFloat(frequency)) {
                        pitchstaircase.Stairs.splice(i, 1, [note[0], note[1], parseFloat(frequency), 1, 1]);
                        flag = 1;
                        break;
                    }
                }

                if (flag === 0) {
                    pitchstaircase.Stairs.push([note[0], note[1], parseFloat(frequency), 1, 1]);
                }
            }
            else {
                logo.errorMsg(_('Pitch Block: Did you mean to use a Note block?'), blk);
            }
            break;
        case 'rhythm2':
        case 'rhythm':
            if (args.length < 2 || typeof(args[0]) !== 'number' || typeof(args[1]) !== 'number' || args[0] < 1 || args[1] <= 0) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                break;
            }

            if (logo.blocks.blockList[blk].name === 'rhythm2') {
                var noteBeatValue = 1 / args[1];
            } else {
                var noteBeatValue = args[1];
            }

            if (logo.inMatrix) {
                pitchtimematrix.addColBlock(blk, args[0]);
                for (var i = 0; i < args[0]; i++) {
                    logo._processNote(noteBeatValue, blk, turtle);
                }
            } else if (logo.inRhythmRuler) {
                var drumIndex = rhythmruler.Drums.indexOf(logo._currentDrumBlock);
                if (drumIndex !== -1) {
                    for (var i = 0; i < args[0]; i++) {
                        rhythmruler.Rulers[drumIndex][0].push(noteBeatValue);
                    }
                }
            } else {
                logo.errorMsg(_('Rhythm Block: Did you mean to use a Matrix block?'), blk);
            }
            break;

            // &#x1D15D; &#x1D15E; &#x1D15F; &#x1D160; &#x1D161; &#x1D162; &#x1D163; &#x1D164;
        case 'wholeNote':
            logo._processNote(1, blk, turtle);
            break;
        case 'halfNote':
            logo._processNote(2, blk, turtle);
            break;
        case 'quarterNote':
            logo._processNote(4, blk, turtle);
            break;
        case 'eighthNote':
            logo._processNote(8, blk, turtle);
            break;
        case 'sixteenthNote':
            logo._processNote(16, blk, turtle);
            break;
        case 'thirtysecondNote':
            logo._processNote(32, blk, turtle);
            break;
        case 'sixtyfourthNote':
            logo._processNote(64, blk, turtle);
            break;
        case 'meter':
            // See Issue #337
            break;
        case 'osctime':
        case 'newnote':
        case 'note':
            // We queue up the child flow of the note clamp and
            // once all of the children are run, we trigger a
            // _playnote_ event, then wait for the note to play.
            // The note can be specified by pitch or synth blocks.
            // The osctime block specifies the duration in
            // milleseconds while the note block specifies
            // duration as a beat value. Note: we should consider
            // the use of the global timer in Tone.js for more
            // accuracy.

            // A note can contain multiple pitch blocks to create
            // a chord. The chord is accumuated in these arrays,
            // which are used when we play the note.
            logo.oscList[turtle] = [];
            logo.noteBeat[turtle] = [];
            logo.notePitches[turtle] = [];
            logo.noteOctaves[turtle] = [];
            logo.noteCents[turtle] = [];
            logo.noteHertz[turtle] = [];
            logo.noteTranspositions[turtle] = [];
            logo.noteBeatValues[turtle] = [];
            logo.noteDrums[turtle] = [];

            // Ensure that note duration is positive.
            if (args[0] < 0) {
                logo.errorMsg(_('Note value must be greater than 0'), blk);
                var noteBeatValue = 0;
            } else {
                if (logo.blocks.blockList[blk].name === 'newnote') {
                    var noteBeatValue = 1 / args[0];
                } else {
                    var noteBeatValue = args[0];
                }
            }

            logo.inNoteBlock[turtle] += 1;
            logo.whichNoteBlock[turtle] = blk;

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_playnote_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                logo._processNote(noteBeatValue, blk, turtle);
                logo.inNoteBlock[turtle] -= 1;
                logo.pitchBlocks = [];
                logo.drumBlocks = [];
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'rhythmicdot':
            // Dotting a note will increase its play time by
            // a(2 - 1/2^n)
            var currentDotFactor = 2 - (1 / Math.pow(2, logo.dotCount[turtle]));
            logo.beatFactor[turtle] *= currentDotFactor;
            logo.dotCount[turtle] += 1;
            var newDotFactor = 2 - (1 / Math.pow(2, logo.dotCount[turtle]));
            logo.beatFactor[turtle] /= newDotFactor;
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_dot_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                var currentDotFactor = 2 - (1 / Math.pow(2, logo.dotCount[turtle]));
                logo.beatFactor[turtle] *= currentDotFactor;
                logo.dotCount[turtle] -= 1;
                var newDotFactor = 2 - (1 / Math.pow(2, logo.dotCount[turtle]));
                logo.beatFactor[turtle] /= newDotFactor;
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'crescendo':
            if (args.length > 1 && args[0] !== 0) {
                logo.crescendoDelta[turtle].push(args[0]);
                logo.crescendoVolume[turtle].push(last(logo.polyVolume[turtle]));
                logo.crescendoInitialVolume[turtle].push(last(logo.polyVolume[turtle]));
                logo.polyVolume[turtle].push(last(logo.crescendoVolume[turtle]));

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_crescendo_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.crescendoDelta[turtle].pop();
                    logo.crescendoVolume[turtle].pop();
                    logo.polyVolume[turtle].pop();
                    logo.crescendoInitialVolume[turtle].pop();
                    if (!logo.justCounting[turtle]) {
                        lilypondEndCrescendo(logo, turtle);
                    }
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'darbuka':
        case 'clang':
        case 'bottle':
        case 'duck':
        case 'snare':
        case 'hihat':
        case 'tom':
        case 'kick':
        case 'pluck':
        case 'triangle1':
        case 'slap':
        case 'frogs':
        case 'fingercymbals':
        case 'cup':
        case 'cowbell':
        case 'splash':
        case 'ridebell':
        case 'floortom':
        case 'crash':
        case 'chine':
        case 'dog':
        case 'cat':
        case 'clap':
        case 'bubbles':
        case 'cricket':
            logo.drumStyle[turtle].push(blocks.blockList[blk].name);
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_drum_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                logo.drumStyle[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'setdrum':
            var drumname = 'kick';
            for (var drum in DRUMNAMES) {
                if (DRUMNAMES[drum][0] === args[0]) {
                    drumname = DRUMNAMES[drum][1];
                } else if (DRUMNAMES[drum][1] === args[0]) {
                    drumname = args[0];
                }
            }

            logo.drumStyle[turtle].push(drumname);
            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_setdrum_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                logo.drumStyle[turtle].pop();
            };

            logo._setListener(turtle, listenerName, __listener);
            if (logo.inRhythmRuler) {
                logo._currentDrumBlock = blk;
                rhythmruler.Drums.push(blk);
                rhythmruler.Rulers.push([[],[]]);
            }
            break;
        case 'setvoice':
            var voicename = null;
            for (var voice in VOICENAMES) {
                if (VOICENAMES[voice][0] === args[0]) {
                    voicename = VOICENAMES[voice][1];
                } else if (VOICENAMES[voice][1] === args[0]) {
                    voicename = args[0];
                }
            }

            // Maybe it is a drum?
            if (voicename == null) {
                for (var drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0] === args[0]) {
                        voicename = DRUMNAMES[drum][1];
                    } else if (DRUMNAMES[drum][1] === args[0]) {
                        voicename = args[0];
                    }
                }
            }

            if (voicename == null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);

                childFlow = args[1];
                childFlowCount = 1;
            } else {
                logo.voices[turtle].push(voicename);
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_setvoice_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.voices[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'vibrato':
            var intensity = args[0];
            var rate = args[1];

            if (intensity < 1 || intensity > 100) {
                logo.errorMsg(_('Vibrato intensity must be between 1 and 100.'), blk);
                logo.stopTurtle = true;
            }

            if (rate <= 0) {
                logo.errorMsg(_('Vibrato rate must be greater than 0.'), blk);
                logo.stopTurtle = true;
            }

            childFlow = args[2];
            childFlowCount = 1;

            logo.vibratoIntensity[turtle].push(intensity / 100);
            logo.vibratoRate[turtle].push(Math.floor(Math.pow(rate, -1)));

            var listenerName = '_vibrato_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);
            var __listener = function (event) {
               logo.vibratoIntensity[turtle].pop();
               logo.vibratoRate[turtle].pop();
            };
            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'interval':
            if (typeof(args[0]) !== 'number') {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                break;
            }

            if (args[0] > 0) {
                var i = Math.floor(args[0]);
            } else {
                var i = Math.ceil(args[0]);
            }

            if (i !== 0) {
                logo.intervals[turtle].push(i);

                var listenerName = '_interval_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.intervals[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            }

            childFlow = args[1];
            childFlowCount = 1;
            break;
        case 'perfectx':
            if (args[0] < 0) {
                var interval = mod12(-args[0]);
            } else {
                var interval = mod12(args[0]);
            }
            var deltaOctave = calcOctaveInterval(args[1]);
            if ([1, 4, 5, 8].indexOf(interval) !== -1) {
                logo.perfect[turtle].push([args[0], deltaOctave]);

                var listenerName = '_perfect_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.perfect[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Perfect Block must be 1, 4, 5, or 8'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'perfect':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            if ([1, 4, 5, 8].indexOf(mod12Arg) !== -1) {
                logo.perfect[turtle].push([args[0], 0]);

                var listenerName = '_perfect_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.perfect[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Perfect Block must be 1, 4, 5, or 8'), blk);
            }

            childFlow = args[1];
            childFlowCount = 1;
            break;
        case 'diminishedx':
            if (args[0] < 0) {
                var interval = mod12(-args[0]);
            } else {
                var interval = mod12(args[0]);
            }
            var deltaOctave = calcOctaveInterval(args[1]);
            if ([1, 2, 3, 4, 5, 6, 7, 8].indexOf(interval) !== -1) {
                logo.diminished[turtle].push([args[0], deltaOctave]);

                var listenerName = '_diminished_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.diminished[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Diminished Block must be 1, 2, 3, 4, 5, 6, 7, or 8'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'diminished':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            if ([1, 2, 3, 4, 5, 6, 7, 8].indexOf(mod12Arg) !== -1) {
                logo.diminished[turtle].push([args[0], 0]);

                var listenerName = '_diminished_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.diminished[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Diminished Block must be 1, 2, 3, 4, 5, 6, 7, or 8'), blk);
            }

            childFlow = args[1];
            childFlowCount = 1;
            break;
        case 'augmentedx':
            if (args[0] < 0) {
                var interval = mod12(-args[0]);
            } else {
                var interval = mod12(args[0]);
            }
            var deltaOctave = calcOctaveInterval(args[1]);
            if ([1, 2, 3, 4, 5, 6, 7, 8].indexOf(interval) !== -1) {
                logo.augmented[turtle].push([args[0], deltaOctave]);

                var listenerName = '_augmented_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.augmented[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Augmented Block must be 1, 2, 3, 4, 5, 6, 7, or 8'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'augmented':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            if ([1, 2, 3, 4, 5, 6, 7, 8].indexOf(mod12Arg) !== -1) {
		logo.augmented[turtle].push([args[0], 0]);

                var listenerName = '_tritone_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.augmented[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Augmented Block must be 1, 2, 3, 4, 5, 6, 7, or 8'), blk);
            }

            childFlow = args[1];
            childFlowCount = 1;
            break;
        case 'majorx':
            if (args[0] < 0) {
                var interval = mod12(-args[0]);
            } else {
                var interval = mod12(args[0]);
            }
            var deltaOctave = calcOctaveInterval(args[1]);
            if ([2, 3, 6, 7].indexOf(interval) !== -1) {
                logo.major[turtle].push([args[0], deltaOctave]);

                var listenerName = '_major_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.major[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Major Block must be 2, 3, 6, or 7'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'major':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            var octaveArg = args[1];
            if ([2, 3, 6, 7].indexOf(mod12Arg) !== -1) {
                logo.major[turtle].push([args[0], 0]);

                var listenerName = '_major_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.major[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Major Block must be 2, 3, 6, or 7'), blk);
            }

            childFlow = args[1];
            childFlowCount = 1;
            break;
        case 'minorx':
            if (args[0] < 0) {
                var interval = mod12(-args[0]);
            } else {
                var interval = mod12(args[0]);
            }
            var deltaOctave = calcOctaveInterval(args[1]);
            if ([2, 3, 6, 7].indexOf(interval) !== -1) {
                logo.minor[turtle].push([args[0], deltaOctave]);

                var listenerName = '_minor_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.minor[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Minor Block must be 2, 3, 6, or 7'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'minor':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            if ([2, 3, 6, 7].indexOf(mod12Arg) !== -1) {
                logo.minor[turtle].push([args[0], 0]);

                var listenerName = '_minor_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.minor[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            } else {
                logo.errorMsg(_('Input to Minor Block must be 2, 3, 6, or 7'), blk);
            }

            childFlow = args[1];
            childFlowCount = 1;
            break;
        case 'newstaccato':
        case 'staccato':
            if (args.length > 1) {
                if (logo.blocks.blockList[blk].name === 'newstaccato') {
                    logo.staccato[turtle].push(1 / args[0]);
                } else {
                    logo.staccato[turtle].push(args[0]);
                }
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_staccato_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.staccato[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'newslur':
        case 'slur':
            if (args.length > 1) {
                if (logo.blocks.blockList[blk].name === 'newslur') {
                    logo.staccato[turtle].push(-1 / args[0]);
                } else {
                    logo.staccato[turtle].push(-args[0]);
                }

                if (!logo.justCounting[turtle]) {
                    lilypondBeginSlur(logo, turtle);
                }

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_staccato_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.staccato[turtle].pop();
                    if (!logo.justCounting[turtle]) {
                        lilypondEndSlur(logo, turtle);
                    }
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'drift':
            logo.drift[turtle] += 1;
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_drift_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                logo.drift[turtle] -= 1;
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'tie':
            // Tie notes together in pairs.
            logo.tie[turtle] = true;
            logo.tieNote[turtle] = [];
            logo.tieCarryOver[turtle] = 0;
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_tie_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                logo.tie[turtle] = false;
                // If tieCarryOver > 0, we have one more note to
                // play.
                if (logo.tieCarryOver[turtle] > 0) {
                    if (!logo.justCounting[turtle]) {
                        // Remove the note from the Lilypond list.
                        for (var i = 0; i < logo.notePitches[turtle].length; i++) {
                            lilypondRemoveTie(logo, turtle);
                        }
                    }
                    var noteValue = logo.tieCarryOver[turtle];
                    logo.tieCarryOver[turtle] = 0;
                    logo._processNote(noteValue, blk, turtle);
                }
                logo.tieNote[turtle] = [];
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'newswing':
        case 'newswing2':
        case 'swing':
            // Grab a bit from the next note to give to the current note.
            if (logo.blocks.blockList[blk].name === 'newswing2') {
                logo.swing[turtle].push(1 / args[0]);
                logo.swingTarget[turtle].push(1 / args[1]);
                childFlow = args[2];
            } else if (logo.blocks.blockList[blk].name === 'newswing') {
                logo.swing[turtle].push(1 / args[0]);
                logo.swingTarget[turtle].push(null);
                childFlow = args[1];
            } else {
                logo.swing[turtle].push(args[0]);
                logo.swingTarget[turtle].push(null);
                childFlow = args[1];
            }
            logo.swingCarryOver[turtle] = 0;

            childFlowCount = 1;

            var listenerName = '_swing_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                logo.swingTarget[turtle].pop();
                logo.swing[turtle].pop();
                logo.swingCarryOver[turtle] = 0;
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'duplicatenotes':
            var factor = args[0];
            if (factor === 0) {
                logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                logo.stopTurtle = true;
            } else {
                logo.duplicateFactor[turtle] *= factor;
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_duplicate_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.duplicateFactor[turtle] /= factor;
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'skipnotes':
            var factor = args[0];
            if (factor === 0) {
                logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                logo.stopTurtle = true;
            } else {
                logo.skipFactor[turtle] *= factor;
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_skip_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.skipFactor[turtle] /= factor;
                    if (logo.skipFactor[turtle] === 1) {
                        logo.skipIndex[turtle] = 0;
                    }
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'multiplybeatfactor':
            var factor = args[0];
            if (factor === 0) {
                logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                logo.stopTurtle = true;
            } else {
                logo.beatFactor[turtle] *= factor;
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_multiplybeat_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.beatFactor[turtle] /= factor;
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'dividebeatfactor':
            var factor = args[0];
            if (factor === 0) {
                logo.errorMsg(ZERODIVIDEERRORMSG, blk);
                logo.stopTurtle = true;
            } else {
                logo.beatFactor[turtle] /= factor;
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_dividebeat_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    logo.beatFactor[turtle] /= factor;
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'settransposition':
            var transValue = args[0];
            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] -= transValue;
            } else {
                logo.transposition[turtle] += transValue;
            }

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_transposition_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] += transValue;
                } else {
                    logo.transposition[turtle] -= transValue;
                }
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'sharp':
            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] -= 1;
            } else {
                logo.transposition[turtle] += 1;
            }
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_sharp_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] += 1;
                } else {
                    logo.transposition[turtle] -= 1;
                }
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'flat':
            if (!(logo.invertList[turtle].length === 0)) {
                logo.transposition[turtle] += 1;
            } else {
                logo.transposition[turtle] -= 1;
            }
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_flat_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function(event) {
                if (!(logo.invertList[turtle].length === 0)) {
                    logo.transposition[turtle] -= 1;
                } else {
                    logo.transposition[turtle] += 1;
                }
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'articulation':
            if (args.length === 2 && typeof(args[0]) === 'number' && args[0] > 0) {
                var newVolume = last(logo.polyVolume[turtle]) * (100 + args[0]) / 100;
                if (newVolume > 100) {
                    console.log('articulated volume exceeds 100%. clipping');
                    newVolume = 100;
                }
                logo.polyVolume[turtle].push(newVolume);
                logo._setSynthVolume(newVolume, turtle);
                if (!logo.justCounting[turtle]) {
                    lilypondBeginArticulation(logo, turtle);
                }

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_articulation_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function(event) {
                    logo.polyVolume[turtle].pop();
                    if (!logo.justCounting[turtle]) {
                        lilypondEndArticulation(logo, turtle);
                    }
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'setnotevolume2':
            if (args.length === 2 && typeof(args[0]) === 'number') {
                logo.polyVolume[turtle].push(args[0]);
                logo._setSynthVolume(args[0], turtle);

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_volume_' + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function(event) {
                    logo.polyVolume[turtle].pop();
                };

                logo._setListener(turtle, listenerName, __listener);
            }
            break;
            // Deprecated
        case 'setnotevolume':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    logo.errorMsg(NANERRORMSG, blk);
                    logo.stopTurtle = true;
                } else {
                    logo._setSynthVolume(args[0], turtle);
                }
            }
            break;
            // Deprecated P5 tone generator replaced by macro.
        case 'tone':
            break;
        case 'hertz':
            if (args.length !== 1 || args[0] == null) {
                logo.errorMsg(NOINPUTERRORMSG, blk);
                logo.stopTurtle = true;
                break;
            }

            if (typeof(args[0]) !== 'number') {
                logo.errorMsg(NANERRORMSG, blk);
                logo.stopTurtle = true;
                break;
            }

            var obj = frequencyToPitch(args[0]);
            var note = obj[0];
            var octave = obj[1];
            var cents = obj[2];
            var delta = 0;

            if (note === '?') {
                logo.errorMsg(INVALIDPITCH, blk);
                logo.stopTurtle = true;
            } else if (logo.inMatrix) {
                pitchtimematrix.addRowBlock(blk);
                if (logo.pitchBlocks.indexOf(blk) === -1) {
                    logo.pitchBlocks.push(blk);
                }

                pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                pitchtimematrix.rowArgs.push(args[0]);
            } else if (logo.inNoteBlock[turtle] > 0) {

                function addPitch(note, octave, cents, frequency) {
                    if (logo.drumStyle[turtle].length > 0) {
                        var drumname = last(logo.drumStyle[turtle]);
                        var note2 = logo.getNote(note, octave, transposition, logo.keySignature[turtle]);
                        logo.pitchDrumTable[turtle][note2[0] + note2[1]] = drumname;
                    }
                    logo.notePitches[turtle].push(note);
                    logo.noteOctaves[turtle].push(octave);
                    logo.noteCents[turtle].push(cents);
                    logo.noteHertz[turtle].push(frequency);
                }

                if (!(logo.invertList[turtle].length === 0)) {
                    var len = logo.invertList[turtle].length;
                    var note1 = logo.getNote(note, octave, 0, logo.keySignature[turtle]);
                    var num1 = getNumber(note1[0], note1[1]);
                    for (var i = len - 1; i > -1; i--) {
                        var note2 = logo.getNote(logo.invertList[turtle][i][0], logo.invertList[turtle][i][1], 0, logo.keySignature[turtle]);
                        var num2 = getNumber(note2[0], note2[1]);
                        // var a = getNumNote(num1, 0);
                        if (logo.invertList[turtle][i][2] === 'even') {
                            delta += num2 - num1;
                        } else {  // odd
                            delta += num2 - num1 + 0.5;
                        }
                        num1 += 2 * delta;
                    }
                }

                addPitch(note, octave, cents, args[0]);

                if (turtle in logo.intervals && logo.intervals[turtle].length > 0) {
                    for (var i = 0; i < logo.intervals[turtle].length; i++) {
                        var ii = getInterval(logo.intervals[turtle][i], logo.keySignature[turtle], note);
                        var noteObj = logo.getNote(note, octave, ii, logo.keySignature[turtle]);
                        addPitch(noteObj[0], noteObj[1], cents, 0);
                    }
                }

                if (turtle in logo.perfect && logo.perfect[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcPerfect(last(logo.perfect[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in logo.diminished && logo.diminished[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcDiminished(last(logo.diminished[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in logo.augmented && logo.augmented[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcAugmented(last(logo.augmented[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in logo.major && logo.major[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcMajor(last(logo.major[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in logo.minor && logo.minor[turtle].length > 0) {
                    var noteObj = logo.getNote(note, octave, calcMinor(last(logo.minor[turtle])), logo.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in logo.transposition) {
                    logo.noteTranspositions[turtle].push(logo.transposition[turtle] + 2 * delta);
                } else {
                    logo.noteTranspositions[turtle].push(2 * delta);
                }

                if (turtle in logo.beatFactor) {
                    logo.noteBeatValues[turtle].push(logo.beatFactor[turtle]);
                } else {
                    logo.noteBeatValues[turtle].push(1);
                }

                logo.pushedNote[turtle] = true;
            } else if (logo.inPitchStairCase) {
                var frequency = args[0];
                var note = frequencyToPitch(args[0]);
                var flag = 0;

                for (var i = 0 ; i < pitchstaircase.Stairs.length; i++) {
                    if (pitchstaircase.Stairs[i][2] < parseFloat(frequency)) {
                        pitchstaircase.Stairs.splice(i, 0, [note[0], note[1], parseFloat(frequency)]);
                        flag = 1;
                        break;
                    }
                    if (pitchstaircase.Stairs[i][2] === parseFloat(frequency)) {
                        pitchstaircase.Stairs.splice(i, 1, [note[0], note[1], parseFloat(frequency)]);
                        flag = 1;
                        break;
                    }
                }

                if (flag === 0) {
                    pitchstaircase.Stairs.push([note[0], note[1], parseFloat(frequency)]);
                }
            } else if (logo.inPitchSlider) {
                console.log('pushing ' + args[0]);
                pitchslider.Sliders.push([args[0], 0, 0]);
            } else {
                logo.errorMsg(_('Hertz Block: Did you mean to use a Note block?'), blk);
            }
            break;
            // deprecated
        case 'triangle':
        case 'sine':
        case 'square':
        case 'sawtooth':
            if (args.length === 1) {
                var obj = frequencyToPitch(args[0]);
                // obj[2] is cents
                if (logo.inMatrix) {
                    pitchtimematrix.addRowBlock(blk);
                    if (logo.pitchBlocks.indexOf(blk) === -1) {
                        logo.pitchBlocks.push(blk);
                    }
                    pitchtimematrix.rowLabels.push(logo.blocks.blockList[blk].name);
                    pitchtimematrix.rowArgs.push(args[0]);
                } else if (logo.inPitchSlider) {
                    pitchslider.Sliders.push([args[0], 0, 0]);
                } else {
                    logo.oscList[turtle].push(logo.blocks.blockList[blk].name);

                    // We keep track of pitch and octave for notation purposes.
                    logo.notePitches[turtle].push(obj[0]);
                    logo.noteOctaves[turtle].push(obj[1]);
                    logo.noteCents[turtle].push(obj[2]);
                    if (obj[2] !== 0) {
                        logo.noteHertz[turtle].push(pitchToFrequency(obj[0], obj[1], obj[2], logo.keySignature[turtle]));
                    } else {
                        logo.noteHertz[turtle].push(0);
                    }

                    if (turtle in logo.transposition) {
                        logo.noteTranspositions[turtle].push(logo.transposition[turtle]);
                    } else {
                        logo.noteTranspositions[turtle].push(0);
                    }

                    if (turtle in logo.beatFactor) {
                        logo.noteBeatValues[turtle].push(logo.beatFactor[turtle]);
                    } else {
                        logo.noteBeatValues[turtle].push(1);
                    }

                    logo.pushedNote[turtle] = true;
                }
            }
            break;
            // Deprecated
        case 'playfwd':
            pitchtimematrix.playDirection = 1;
            logo._runFromBlock(logo, turtle, args[0]);
            break;
            // Deprecated
        case 'playbwd':
            pitchtimematrix.playDirection = -1;
            logo._runFromBlock(logo, turtle, args[0]);
            break;
        case 'stuplet':
            if (logo.inMatrix) {
                pitchtimematrix.addColBlock(blk, args[0]);
                var noteBeatValue = (1 / args[1]) * logo.beatFactor[turtle];
                if (logo.tuplet === true) {
                    // The simple-tuplet block is inside.
                    for (var i = 0; i < args[0]; i++) {
                        if (!logo.addingNotesToTuplet) {
                            logo.tupletRhythms.push(['notes', 0]);
                            logo.addingNotesToTuplet = true;
                        }
                        logo._processNote(noteBeatValue, blk, turtle);
                    }
                } else {
                    logo.tupletParams.push([1, noteBeatValue]);
                    var obj = ['simple', 0];
                    for (var i = 0; i < args[0]; i++) {
                        obj.push((1 / args[1]) * logo.beatFactor[turtle]);
                    }
                    logo.tupletRhythms.push(obj);
                }
            }
            break;
        case 'tuplet2':
        case 'tuplet3':
            if (logo.inMatrix) {
                if (logo.blocks.blockList[blk].name === 'tuplet3') {
                    logo.tupletParams.push([args[0], (1 / args[1]) * logo.beatFactor[turtle]]);
                } else {
                    logo.tupletParams.push([args[0], args[1] * logo.beatFactor[turtle]]);
                }
                logo.tuplet = true;
                logo.addingNotesToTuplet = false;
            } else {
                logo.errorMsg(_('Tuplet Block: Did you mean to use a Matrix block?'), blk);
            }
            childFlow = args[2];
            childFlowCount = 1;

            var listenerName = '_tuplet_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (logo.inMatrix) {
                    logo.tuplet = false;
                    logo.addingNotesToTuplet = false;
                } else {
                }
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        case 'tuplet4':
            if (logo.inMatrix) {
                logo.tupletParams.push([1, (1 / args[0]) * logo.beatFactor[turtle]]);
                logo.tuplet = true;
                logo.addingNotesToTuplet = false;
            } else {
                logo.errorMsg(_('Tuplet Block: Did you mean to use a Matrix block?'), blk);
            }
            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_tuplet_' + turtle;
            logo._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (logo.inMatrix) {
                    logo.tuplet = false;
                    logo.addingNotesToTuplet = false;
                } else {
                }
            };

            logo._setListener(turtle, listenerName, __listener);
            break;
        default:
            if (logo.blocks.blockList[blk].name in logo.evalFlowDict) {
                eval(logo.evalFlowDict[logo.blocks.blockList[blk].name]);
            } else {
                // Could be an arg block, so we need to print its value.
                if (logo.blocks.blockList[blk].isArgBlock()) {
                    args.push(logo.parseArg(logo, turtle, blk));
                    console.log('block: ' + blk + ' turtle: ' + turtle);
                    console.log('block name: ' + logo.blocks.blockList[blk].name);
                    console.log('block value: ' + logo.blocks.blockList[blk].value);
                    if (logo.blocks.blockList[blk].value == null) {
                        logo.textMsg('null block value');
                    } else {
                        logo.textMsg(logo.blocks.blockList[blk].value.toString());
                    }
                } else {
                    logo.errorMsg('I do not know how to ' + logo.blocks.blockList[blk].name + '.', blk);
                }
                logo.stopTurtle = true;
            }
            break;
        }

        // (3) Queue block below the current block.

        // Is the block in a queued clamp?
        if (blk in logo.endOfClampSignals[turtle]) {
            for (var i = logo.endOfClampSignals[turtle][blk].length - 1; i >= 0; i--) {
                var signal = logo.endOfClampSignals[turtle][blk][i];
                if (signal != null) {
                    logo.stage.dispatchEvent(logo.endOfClampSignals[turtle][blk][i]);
                    // Mark issued signals as null
                    logo.endOfClampSignals[turtle][blk][i] = null;
                }
            }
            var cleanSignals = [];
            for (var i = 0; i < logo.endOfClampSignals[turtle][blk].length; i++) {
                if (logo.endOfClampSignals[turtle][blk][i] != null) {
                    cleanSignals.push(logo.endOfClampSignals[turtle][blk][i]);
                }
            }
            logo.endOfClampSignals[turtle][blk] = cleanSignals;
        }

        if (docById('statusmatrix').style.visibility === 'visible') {
            logo.statusMatrix.updateAll();
        }

        // If there is a child flow, queue it.
        if (childFlow != null) {
            if (logo.blocks.blockList[blk].name==='doArg' || logo.blocks.blockList[blk].name==='nameddoArg') {
                var queueBlock = new Queue(childFlow, childFlowCount, blk, actionArgs);
            } else {
                var queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
            }
            // We need to keep track of the parent block to the child
            // flow so we can unlightlight the parent block after the
            // child flow completes.
            logo.parentFlowQueue[turtle].push(blk);
            logo.turtles.turtleList[turtle].queue.push(queueBlock);
        }

        var nextBlock = null;
        var parentBlk = null;
        // Run the last flow in the queue.
        if (logo.turtles.turtleList[turtle].queue.length > queueStart) {
            nextBlock = last(logo.turtles.turtleList[turtle].queue).blk;
            parentBlk = last(logo.turtles.turtleList[turtle].queue).parentBlk;
            passArg = last(logo.turtles.turtleList[turtle].queue).args;
            // Since the forever block starts at -1, it will never === 1.
            if (last(logo.turtles.turtleList[turtle].queue).count === 1) {
                // Finished child so pop it off the queue.
                logo.turtles.turtleList[turtle].queue.pop();
            } else {
                // Decrement the counter for repeating logo flow.
                last(logo.turtles.turtleList[turtle].queue).count -= 1;
            }
        }

        if (nextBlock != null) {
            if (parentBlk !== blk) {
                // The wait block waits waitTimes longer than other
                // blocks before it is unhighlighted.
                if (logo.turtleDelay === TURTLESTEP) {
                    logo.unhighlightStepQueue[turtle] = blk;
                } else if (logo.turtleDelay > 0) {
                    setTimeout(function() {
                        logo.blocks.unhighlight(blk);
                    }, logo.turtleDelay + logo.waitTimes[turtle]);
                }
            }

            if ((logo.backward[turtle].length > 0 && logo.blocks.blockList[blk].connections[0] == null) || (logo.backward[turtle].length === 0 && last(logo.blocks.blockList[blk].connections) == null)) {
                // If we are at the end of the child flow, queue the
                // unhighlighting of the parent block to the flow.
                if (logo.parentFlowQueue[turtle].length > 0 && logo.turtles.turtleList[turtle].queue.length > 0 && last(logo.turtles.turtleList[turtle].queue).parentBlk !== last(logo.parentFlowQueue[turtle])) {
                    logo.unhightlightQueue[turtle].push(last(logo.parentFlowQueue[turtle]));

                    // logo.unhightlightQueue[turtle].push(logo.parentFlowQueue[turtle].pop());
                } else if (logo.unhightlightQueue[turtle].length > 0) {
                    // The child flow is finally complete, so unhighlight.
                    if (logo.turtleDelay !== 0) {
                        setTimeout(function() {
                            logo.blocks.unhighlight(logo.unhightlightQueue[turtle].pop());
                        }, logo.turtleDelay);
                    }
                }
            }

            if (logo.turtleDelay !== 0) {
                for (var pblk in logo.parameterQueue[turtle]) {
                    logo._updateParameterBlock(logo, turtle, logo.parameterQueue[turtle][pblk]);
                }
            }

            if (isflow){
                logo._runFromBlockNow(logo, turtle, nextBlock, isflow, passArg, queueStart);
            }
            else{
                logo._runFromBlock(logo, turtle, nextBlock, isflow, passArg);
            }
        } else {
            // Make sure any unissued signals are dispatched.
            for (var b in logo.endOfClampSignals[turtle]) {
                for (var i = 0; i < logo.endOfClampSignals[turtle][b].length; i++) {
                    if (logo.endOfClampSignals[turtle][b][i] != null) {
                        logo.stage.dispatchEvent(logo.endOfClampSignals[turtle][b][i]);
                    }
                }
            }

            if (turtle in logo.forwardListener) {
                for (var b in logo.forwardListener[turtle]) {
                    for (var i = 0; i < this.forwardListener[turtle][b].length; i++) {
                        logo.stage.removeEventListener('_forward_' + turtle, logo.forwardListener[turtle][b][i], false);
                    }
                }
            }

            if (turtle in logo.rightListener) {
                for (var b in logo.rightListener[turtle]) {
                    for (var i = 0; i < this.rightListener[turtle][b].length; i++) {
                        logo.stage.removeEventListener('_right_' + turtle, logo.rightListener[turtle][b][i], false);
                    }
                }
            }

            if (turtle in logo.arcListener) {
                for (var b in logo.arcListener[turtle]) {
                    for (var i = 0; i < this.arcListener[turtle][b].length; i++) {
                        logo.stage.removeEventListener('_arc_' + turtle, logo.arcListener[turtle][b][i], false);
                    }
                }
            }

            // Make sure SVG path is closed.
            logo.turtles.turtleList[turtle].closeSVG();

            // Mark the turtle as not running.
            logo.turtles.turtleList[turtle].running = false;
            if (!logo.turtles.running() && queueStart === 0) {
                logo.onStopTurtle();
            }

            // Because flow can come from calc blocks, we are not
            // ensured that the turtle is really finished running
            // yet. Hence the timeout.
            __checkLilypond = function() {
                if (!logo.turtles.running() && queueStart === 0 && logo.suppressOutput[turtle] && !logo.justCounting[turtle]) {
                    console.log('saving lilypond output: ' + logo.lilypondStaging);
                    saveLilypondOutput(logo, _('My Project') + '.ly');
                    logo.suppressOutput[turtle] = false;
                    logo.checkingLilypond = false;
                    logo.runningLilypond = false;
                    // Reset cursor.
                    document.body.style.cursor = 'default';
                } else if (logo.suppressOutput[turtle]) {
                    setTimeout(function() {
                        __checkLilypond();
                    }, 250);
                }
            };

            if (!logo.turtles.running() && queueStart === 0 && logo.suppressOutput[turtle] && !logo.justCounting[turtle]) {
                if (!logo.checkingLilypond) {
                    logo.checkingLilypond = true;
                    setTimeout(function() {
                        __checkLilypond();
                    }, 250);
                }
            }

            // Nothing else to do... so cleaning up.
            if (logo.turtles.turtleList[turtle].queue.length === 0 || blk !== last(logo.turtles.turtleList[turtle].queue).parentBlk) {
                setTimeout(function() {
                    logo.blocks.unhighlight(blk);
                }, logo.turtleDelay);
            }

            // Unhighlight any parent blocks still highlighted.
            for (var b in logo.parentFlowQueue[turtle]) {
                logo.blocks.unhighlight(logo.parentFlowQueue[turtle][b]);
            }

            // Make sure the turtles are on top.
            var i = logo.stage.getNumChildren() - 1;
            logo.stage.setChildIndex(logo.turtles.turtleList[turtle].container, i);
            logo.refreshCanvas();

            for (var arg in logo.evalOnStopList) {
                eval(logo.evalOnStopList[arg]);
            }

        }

        clearTimeout(this.saveTimeout);

        var me = this;
        this.saveTimeout = setTimeout(function () {
            // Save at the end to save an image
            // console.log('in saveTimeout');
            me.saveLocally();
        }, DEFAULTDELAY * 1.5);
    };

    this._setSynthVolume = function(vol, turtle) {
        if (vol > 100) {
            vol = 100;
        } else if (vol < 0) {
            vol = 0;
        }

        this.synth.setVolume(vol);
    };

    this._processNote = function(noteValue, blk, turtle) {
        if (this.bpm[turtle].length > 0) {
            var bpmFactor = TONEBPM / last(this.bpm[turtle]);
        } else {
            var bpmFactor = TONEBPM / this._masterBPM;
        }

        if (this.blocks.blockList[blk].name === 'osctime') {
            // Convert msecs to note value.
            if (noteValue == 0) {
                var noteBeatValue = 0;
            } else {
                var noteBeatValue = (bpmFactor * 1000) / noteValue;
            }
        } else {
            var noteBeatValue = noteValue;
        }

        // How best to expose this in the UI? What units?
        this.notesPlayed[turtle] += (1 / noteValue);

        var vibratoRate = 0;
        var vibratoValue = 0;
        var vibratoIntensity = 0;
        var doVibrato = false;
        if (this.vibratoRate[turtle].length > 0) {
            vibratoRate = last(this.vibratoRate[turtle]);
            vibratoIntensity = last(this.vibratoIntensity[turtle]);
            doVibrato = true;
        }

        var carry = 0;

        if (this.crescendoDelta[turtle].length === 0) {
            this._setSynthVolume(last(this.polyVolume[turtle]), turtle);
        }

        if (this.inMatrix) {
            if (this.inNoteBlock[turtle] > 0) {
                pitchtimematrix.addColBlock(blk, 1);
                for (var i = 0; i < this.pitchBlocks.length; i++) {
                    pitchtimematrix.addNode(this.pitchBlocks[i], blk, 0);
                }
                for (var i = 0; i < this.drumBlocks.length; i++) {
                    pitchtimematrix.addNode(this.drumBlocks[i], blk, 0);
                }
            }
            noteBeatValue *= this.beatFactor[turtle];
            if (this.tuplet === true) {
                if (this.addingNotesToTuplet) {
                    var i = this.tupletRhythms.length - 1;
                    this.tupletRhythms[i].push(noteBeatValue);
                } else {
                    this.tupletRhythms.push(['notes', this.tupletParams.length - 1, noteBeatValue]);
                    this.addingNotesToTuplet = true;
                }
            } else {
                this.tupletRhythms.push(['', 1, noteBeatValue]);
            }
        } else {
            // We start the music clock as the first note is being
            // played.
            if (this.firstNoteTime == null && !this.suppressOutput[turtle]) {
                var d = new Date();
                this.firstNoteTime = d.getTime();
            }

            // Calculate a lag: In case this turtle has fallen behind,
            // we need to catch up.
            var d = new Date();
            var elapsedTime = (d.getTime() - this.firstNoteTime) / 1000;
            if (this.drift[turtle] === 0) {
                // How far behind is this turtle lagging?
                var turtleLag = elapsedTime - this.turtleTime[turtle];
            } else {
                // When we are "drifting", we don't bother with lag.
                var turtleLag = 0;
            }
            // If we are in a tie, depending upon parity, we either
            // add the duration from the previous note to the current
            // note, or we cache the duration and set the wait to
            // zero. FIXME: Will not work when using dup and skip.
            if (this.tie[turtle]) {
                // We need to check to see if we are tying together
                // similar notes.
                if (this.tieCarryOver[turtle] > 0) {
                    var match = true;
                    if (this.tieNote[turtle].length !== this.notePitches[turtle].length) {
                        match = false;
                    } else {
                        for (var i = 0; i < this.tieNote[turtle].length; i++) {
                            if (this.tieNote[turtle][i][0] != this.notePitches[turtle][i]) {
                                match = false;
                                break;
                            }

                            if (this.tieNote[turtle][i][1] != this.noteOctaves[turtle][i]) {
                                match = false;
                                break;
                            }
                        }
                    }
                    if (!match) {
                        var tmpBeatValue = this.tieCarryOver[turtle];
                        this.tieCarryOver[turtle] = 0;
                        this.tie[turtle] = false;

                        // Save the current note.
                        var saveNote = [];
                        for (var i = 0; i < this.notePitches[turtle].length; i++) {
                            saveNote.push([this.notePitches[turtle][i], this.noteOctaves[turtle][i], this.noteCents[turtle][i], this.noteHertz[turtle][i]]);
                        }

                        // Swap in the previous note.
                        this.notePitches[turtle] = [];
                        this.noteOctaves[turtle] = [];
                        this.noteCents[turtle] = [];
                        this.noteHertz[turtle] = [];
                        for (var i = 0; i < this.tieNote[turtle].length; i++) {
                            this.notePitches[turtle].push(this.tieNote[turtle][i][0]);
                            this.noteOctaves[turtle].push(this.tieNote[turtle][i][1]);
                            this.noteCents[turtle].push(this.tieNote[turtle][i][2]);
                            this.noteHertz[turtle].push(this.tieNote[turtle][i][3]);
                        }
                        this.tieNote[turtle] = [];

                        if (!this.justCounting[turtle]) {
                            // Remove the note from the Lilypond list.
                            for (var i = 0; i < this.notePitches[turtle].length; i++) {
                                lilypondRemoveTie(this, turtle);
                            }
                        }

                        this._processNote(tmpBeatValue, blk, turtle);

                        // Restore the current note.
                        this.tie[turtle] = true;
                        this.notePitches[turtle] = [];
                        this.noteOctaves[turtle] = [];
                        this.noteCents[turtle] = [];
                        this.noteHertz[turtle] = [];
                        for (var i = 0; i < saveNote.length; i++) {
                            this.notePitches[turtle].push(saveNote[i][0]);
                            this.noteOctaves[turtle].push(saveNote[i][1]);
                            this.noteCents[turtle].push(saveNote[i][2]);
                            this.noteHertz[turtle].push(saveNote[i][3]);
                        }
                    }
                }

                if (this.tieCarryOver[turtle] === 0) {
                    this.tieNote[turtle] = [];
                    this.tieCarryOver[turtle] = noteBeatValue;
                    for (var i = 0; i < this.notePitches[turtle].length; i++) {
                        this.tieNote[turtle].push([this.notePitches[turtle][i], this.noteOctaves[turtle][i], this.noteCents[turtle][i], this.noteHertz[turtle][i]]);
                    }
                    noteBeatValue = 0;
                } else {
                    carry = this.tieCarryOver[turtle];
                    noteBeatValue = 1 / ((1 / noteBeatValue) + (1 / this.tieCarryOver[turtle]));
                    this.tieCarryOver[turtle] = 0;
                }
            }

            // If we are in a swing, depending upon parity, we either
            // add the duration from the current note or we substract
            // duration from the next note. Swing is triggered by an
            // initial notevalue. When that notevalue is encountered
            // again, the swing terminates, e.g., 8->4->4->4->8
            // 8->4->4->4->8
            // FIXME: Will not work when using dup and skip.
            // FIXME: Could behave weirdly with tie.
            if (this.swing[turtle].length > 0) {
                // Deprecated
                // newswing2 takes the target as an argument
                if (last(this.swingTarget[turtle]) == null) {
                    // When we start a swing we need to keep track of
                    // the initial beat value.
                    this.swingTarget[turtle][this.swingTarget[turtle].length - 1] = noteBeatValue;
                }

                var swingValue = last(this.swing[turtle]);
                // If this notevalue matches the target, either we are
                // starting a swing or ending a swing.
                if (noteBeatValue === last(this.swingTarget[turtle])) {
                    if (this.swingCarryOver[turtle] === 0) {
                        noteBeatValue = 1 / ((1 / noteBeatValue) + (1 / swingValue));
                        this.swingCarryOver[turtle] = swingValue;
                    } else {
                        if (noteBeatValue === swingValue) {
                            noteBeatValue = 0;
                        } else {
                            noteBeatValue = 1 / ((1 / noteBeatValue) - (1 / swingValue));
                        }
                        this.swingCarryOver[turtle] = 0;
                    }

                    if (noteBeatValue < 0) {
                        noteBeatValue = 0;
                    }
                }
            }

            // Duration is the duration of the note to be
            // played. doWait sets the wait time for the turtle before
            // the next block is executed.
            var duration = noteBeatValue * this.beatFactor[turtle];  // beat value
            if (duration > 0 && !this.suppressOutput[turtle]) {
                this.turtleTime[turtle] += ((bpmFactor / duration) + (this.noteDelay / 1000)) * this.duplicateFactor[turtle];
            }

            if (!this.suppressOutput[turtle]) {
                if (duration > 0) {
                    this._doWait(turtle, Math.max(((bpmFactor / duration) + (this.noteDelay / 1000)) * this.duplicateFactor[turtle] - turtleLag, 0));
                }
            }

            var waitTime = 0;
            for (var j = 0; j < this.duplicateFactor[turtle]; j++) {
                if (this.skipFactor[turtle] > 1 && this.skipIndex[turtle] % this.skipFactor[turtle] > 0) {
                    this.skipIndex[turtle] += 1;
                    // Lessen delay time by one note since we are
                    // skipping a note.
                    if (duration > 0) {
                        this.waitTimes[turtle] -= ((bpmFactor / duration) + (this.noteDelay / 1000)) * 1000;
                        if (this.waitTimes[turtle] < 0) {
                            this.waitTimes[turtle] = 0;
                        }
                    }
                    continue;
                }

                if (this.skipFactor[turtle] > 1) {
                    this.skipIndex[turtle] += 1;
                }

                if (!this.suppressOutput[turtle]) {
                    if (j > 0) {
                        if (duration > 0) {
                            waitTime += (bpmFactor * 1000 / duration);
                        }
                    }
                } else {
                    waitTime = 0;
                }

                __playnote = function(logo) {
                    var notes = [];
                    var drums = [];
                    var insideChord = -1;
                    if ((logo.notePitches[turtle].length + logo.oscList[turtle].length) > 1) {
                        if (turtle in logo.lilypondStaging && !logo.justCounting[turtle]) {
                            var insideChord = logo.lilypondStaging[turtle].length + 1;
                        } else {
                            var insideChord = 1;
                        }
                    }

                    logo.noteBeat[turtle] = noteBeatValue;
                    
                    // Do not process a note if its duration is equal
                    // to infinity or NaN.
                    if (!isFinite(duration)) {
                        return;
                    }

                    // Use the beatValue of the first note in
                    // the group since there can only be one.
                    if (logo.staccato[turtle].length > 0) {
                        var staccatoBeatValue = last(logo.staccato[turtle]);
                        if (staccatoBeatValue < 0) {
                            // slur
                            var beatValue = bpmFactor / ((noteBeatValue) * logo.noteBeatValues[turtle][0]) + bpmFactor / (-staccatoBeatValue * logo.noteBeatValues[turtle][0]);
                        } else if (staccatoBeatValue > noteBeatValue) {
                            // staccato
                            var beatValue = bpmFactor / (staccatoBeatValue * logo.noteBeatValues[turtle][0]);
                        } else {
                            var beatValue = bpmFactor / (noteBeatValue * logo.noteBeatValues[turtle][0]);
                        }
                    } else {
                        var beatValue = bpmFactor / (noteBeatValue * logo.noteBeatValues[turtle][0]);
                    }

                    if (doVibrato)
                        vibratoValue = beatValue * (duration / vibratoRate);

                    logo._dispatchTurtleSignals(turtle, beatValue, blk, noteBeatValue);
                    // Process pitches
                    if (logo.notePitches[turtle].length > 0) {
                        for (var i = 0; i < logo.notePitches[turtle].length; i++) {
                            if (logo.notePitches[turtle][i] === 'rest') {
                                note = 'R';
                            } else {
                                var noteObj = logo.getNote(logo.notePitches[turtle][i], logo.noteOctaves[turtle][i], logo.noteTranspositions[turtle][i], logo.keySignature[turtle]);

                                // If the cents for this note != 0, then
                                // we need to convert to frequency and add
                                // in the cents.
                                if (logo.noteCents[turtle][i] !== 0) {
                                    if (logo.noteHertz[turtle][i] !== 0 && logo.noteTranspositions[turtle][i] === 0) {
                                        var note = logo.noteHertz[turtle][i];
                                    } else {
                                        var note = Math.floor(pitchToFrequency(noteObj[0], noteObj[1], logo.noteCents[turtle][i], logo.keySignature[turtle]));
                                    }
                                } else {
                                    var note = noteObj[0] + noteObj[1];
                                }
                            }

                            if (note !== 'R') {
                                notes.push(note);
                            }

                            if (duration > 0) {
                                if (carry > 0) {
                                    if (i === 0 && !logo.justCounting[turtle]) {
                                        lilypondInsertTie(logo, turtle);
                                    }
                                    originalDuration = 1 / ((1 / duration) - (1 / carry));
                                } else {
                                    originalDuration = duration;
                                }
                                if (!logo.justCounting[turtle]) {
                                    updateLilypondNotation(logo, note, originalDuration, turtle, insideChord);
                                }
                            } else if (logo.tieCarryOver[turtle] > 0) {
                                if (!logo.justCounting[turtle]) {
                                    updateLilypondNotation(logo, note, logo.tieCarryOver[turtle], turtle, insideChord);
                                }
                            } else {
                                // console.log('duration == ' + duration + ' and tieCarryOver === 0 and drift is ' + drift);
                            }
                        }

                        if (!logo.justCounting[turtle]) {
                            console.log("notes to play " + notes + ' ' + noteBeatValue);
                        } else {
                            console.log("notes to count " + notes + ' ' + noteBeatValue);
                        }

                        if (!logo.suppressOutput[turtle]) {
                            logo.turtles.turtleList[turtle].blink(duration,last(logo.polyVolume[turtle]));
                        }

                        if (notes.length > 0) {
                            var len = notes[0].length;

                            // Deprecated
                            if (typeof(notes[i]) === 'string') {
                                logo.currentNotes[turtle] = notes[0].slice(0, len - 1);
                                logo.currentOctaves[turtle] = parseInt(notes[0].slice(len - 1));
                            }

                            if (logo.turtles.turtleList[turtle].drum) {
                                for (var i = 0; i < notes.length; i++) {
                                    notes[i] = notes[i].replace(/♭/g, 'b').replace(/♯/g, '#'); // 'C2'; // Remove pitch

                                }
                            } else {
                                for (var i = 0; i < notes.length; i++) {
                                    if (typeof(notes[i]) === 'string') {
                                        notes[i] = notes[i].replace(/♭/g, 'b').replace(/♯/g, '#');
                                    }
                                }
                            }

                            if (!logo.suppressOutput[turtle] && duration > 0) {
                                if (logo.oscList[turtle].length > 0) {
                                    if (notes.length > 1) {
                                        logo.errorMsg(last(logo.oscList[turtle]) + ': ' +  _('synth cannot play chords.'), blk);
                                    }
                                    logo.synth.trigger(notes, beatValue, last(logo.oscList[turtle]), [vibratoIntensity, vibratoValue]);
                                } else if (logo.drumStyle[turtle].length > 0) {
                                    logo.synth.trigger(notes, beatValue, last(logo.drumStyle[turtle]));
                                } else if (logo.turtles.turtleList[turtle].drum) {
                                    logo.synth.trigger(notes, beatValue, 'drum');
                                } else {
                                    // Look for any notes in the chord that might be in the pitchDrumTable.
                                    for (var d = 0; d < notes.length; d++) {
                                        if (notes[d] in logo.pitchDrumTable[turtle]) {
                                            logo.synth.trigger(notes[d], beatValue, logo.pitchDrumTable[turtle][notes[d]]);
                                        } else if (turtle in logo.voices && last(logo.voices[turtle])) {
                                            logo.synth.trigger(notes[d], beatValue, last(logo.voices[turtle]), [vibratoIntensity, vibratoValue]);
                                        } else {
                                            logo.synth.trigger(notes[d], beatValue, 'default', [vibratoIntensity, vibratoValue]);
                                        }
                                    }
                                }

                                logo.synth.start();
                            }

                            logo.lastNotePlayed[turtle] = [notes[0], noteBeatValue];
                            logo.noteStatus[turtle] = [notes, noteBeatValue];
                        }
                    }

                    // Process drums
                    if (logo.noteDrums[turtle].length > 0) {
                        for (var i = 0; i < logo.noteDrums[turtle].length; i++) {
                            drums.push(logo.noteDrums[turtle][i]);
                        }

                        // console.log("drums to play " + drums + ' ' + noteBeatValue);

                        if (!logo.suppressOutput[turtle] && duration > 0) {
                            for (var i = 0; i < drums.length; i++) {
                                if (logo.drumStyle[turtle].length > 0) {
                                    logo.synth.trigger(['C2'], beatValue, last(logo.drumStyle[turtle]));
                                } else {
                                    logo.synth.trigger(['C2'], beatValue, drums[i]);
                                }
                            }
                        }
                    }
                };

                if (waitTime === 0 || this.suppressOutput[turtle]) {
                    __playnote(this);
                } else {
                    var logo = this;
                    setTimeout(function() {
                        __playnote(logo);
                    }, waitTime + this.noteDelay);
                }

                if (this.crescendoDelta[turtle].length > 0) {
                    if (last(this.crescendoVolume[turtle]) === last(this.crescendoInitialVolume[turtle]) && !this.justCounting[turtle]) {
                        lilypondBeginCrescendo(this, turtle, last(this.crescendoDelta[turtle]));
                    }
                    var len = this.crescendoVolume[turtle].length
                    this.crescendoVolume[turtle][len - 1] += this.crescendoDelta[turtle][len - 1];
                    this._setSynthVolume(this.crescendoVolume[turtle][len - 1], turtle);
                    var len2 = this.polyVolume[turtle].length;
                    this.polyVolume[turtle][len2 - 1] = this.crescendoVolume[turtle][len - 1];
                }
            }
            this.pushedNote[turtle] = false;
        }
    };

    this._dispatchTurtleSignals = function(turtle, beatValue, blk, noteBeatValue) {
        // When turtle commands (forward, right, arc) are inside of Notes,
        // they are progressive.
        var logo = this;
        var stepTime = beatValue * 1000 / (NOTEDIV + 4);

        // We want to update the turtle graphics every 50ms with a note.
        // FIXME: Do this more efficiently
        if (stepTime > 200) {
            logo.dispatchFactor[turtle] = 0.25;
        } else if (stepTime > 100) {
            logo.dispatchFactor[turtle] = 0.5;
        } else if (stepTime > 50) {
            logo.dispatchFactor[turtle] = 1;
        } else if (stepTime > 25) {
            logo.dispatchFactor[turtle] = 2;
        } else if (stepTime > 12.5) {
            logo.dispatchFactor[turtle] = 4;
        } else {
            logo.dispatchFactor[turtle] = 8;
        }

        for (var t = 0; t < (NOTEDIV / logo.dispatchFactor[turtle]); t++) {
            setTimeout(function() {
                if (turtle in logo.forwardListener && blk in logo.forwardListener[turtle]) {
                    logo.stage.dispatchEvent('_forward_' + turtle + '_' + blk);
                }
                if (turtle in logo.rightListener && blk in logo.rightListener[turtle]) {
                    logo.stage.dispatchEvent('_right_' + turtle + '_' + blk);
                }
                if (turtle in logo.arcListener && blk in logo.arcListener[turtle]) {
                    logo.stage.dispatchEvent('_arc_' + turtle + '_' + blk);
                }
            // (NOTEDIV + 4) is a workaround so that the graphics
            // finish a bit ahead of the note in order t minimize the
            // risk that there is overlap with the next note scheduled
            // to trigger.
            }, t * stepTime * logo.dispatchFactor[turtle]);
        }

        setTimeout(function() {
            if (turtle in logo.forwardListener && blk in logo.forwardListener[turtle]) {
                for (var i = 0; i < logo.forwardListener[turtle][blk].length; i++) {
                    logo.stage.removeEventListener('_forward_' + turtle + '_' + blk, logo.forwardListener[turtle][blk][i], false);
                }
                delete logo.forwardListener[turtle][blk];
            }

            if (turtle in logo.rightListener && blk in logo.rightListener[turtle]) {
                for (var i = 0; i < logo.rightListener[turtle][blk].length; i++) {
                    logo.stage.removeEventListener('_right_' + turtle + '_' + blk, logo.rightListener[turtle][blk][i], false);
                }
                delete logo.rightListener[turtle][blk];
            }

            if (turtle in logo.arcListener && blk in logo.arcListener[turtle]) {
                for (var i = 0; i < logo.arcListener[turtle][blk].length; i++) {
                    logo.stage.removeEventListener('_arc_' + turtle + '_' + blk, logo.arcListener[turtle][blk][i], false);
                }
                delete logo.arcListener[turtle][blk];
            }

        }, beatValue * 1000);
    };

    this._setListener = function(turtle, listenerName, listener) {
        if (listenerName in this.turtles.turtleList[turtle].listeners) {
            this.stage.removeEventListener(listenerName, this.turtles.turtleList[turtle].listeners[listenerName], false);
        }
        this.turtles.turtleList[turtle].listeners[listenerName] = listener;
        this.stage.addEventListener(listenerName, listener, false);
    };

    this._setDispatchBlock = function(blk, turtle, listenerName) {
        if (this.backward[turtle].length > 0) {
            if (this.blocks.blockList[last(this.backward[turtle])].name === 'backward') {
                var c = 1;
            } else {
                var c = 2;
            }
            if (this.blocks.sameGeneration(this.blocks.blockList[last(this.backward[turtle])].connections[c], blk)) {
                var nextBlock = this.blocks.blockList[blk].connections[0];
                this.endOfClampSignals[turtle][nextBlock] = [listenerName];
            } else {
                var nextBlock = null;
            }
        } else {
            var nextBlock = last(this.blocks.blockList[blk].connections);
        }

        if (nextBlock == null) {
            return;
        }

        this.endOfClampSignals[turtle][nextBlock] = [listenerName];
    };

    this._getTargetTurtle = function(args) {
        // The target turtle name can be a string or an int. Make
        // sure there is a turtle by this name and then find the
        // associated start block.

        var targetTurtle = args[0];

        // We'll compare the names as strings.
        if (typeof(targetTurtle) === 'number') {
            targetTurtle = targetTurtle.toString();
        }

        for (var i = 0; i < this.turtles.turtleList.length; i++) {
            var turtleName = this.turtles.turtleList[i].name;
            if (typeof(turtleName) === 'number') {
                turtleName = turtleName.toString();
            }
            if (turtleName === targetTurtle) {
                return i;
            }
        }

        return null;
    };

    this._loopBlock = function(name) {
        return ['forever', 'repeat', 'while', 'until'].indexOf(name) !== -1;
    };

    this._doBreak = function(turtle) {
        // Look for a parent loopBlock in queue and set its count to 1.
        var parentLoopBlock = null;
        var loopBlkIdx = -1;
        var queueLength = this.turtles.turtleList[turtle].queue.length;
        for (var i = queueLength - 1; i > -1; i--) {
            if (this._loopBlock(this.blocks.blockList[this.turtles.turtleList[turtle].queue[i].blk].name)) {
                // while or until
                loopBlkIdx = this.turtles.turtleList[turtle].queue[i].blk;
                parentLoopBlock = this.blocks.blockList[loopBlkIdx];
                // Flush the parent from the queue.
                this.turtles.turtleList[turtle].queue.pop();
                break;
            } else if (this._loopBlock(this.blocks.blockList[this.turtles.turtleList[turtle].queue[i].parentBlk].name)) {
                // repeat or forever
                loopBlkIdx = this.turtles.turtleList[turtle].queue[i].parentBlk;
                parentLoopBlock = this.blocks.blockList[loopBlkIdx];
                // Flush the parent from the queue.
                this.turtles.turtleList[turtle].queue.pop();
                break;
            }
        }
        if (parentLoopBlock == null) {
            // In this case, we flush the child flow.
            this.turtles.turtleList[turtle].queue.pop();
            return;
        }

        // For while and until, we need to add any childflow from the
        // parent to the queue.
        if (parentLoopBlock.name === 'while' || parentLoopBlock.name === 'until') {
            var childFlow = last(parentLoopBlock.connections);
            if (childFlow != null) {
                var queueBlock = new Queue(childFlow, 1, loopBlkIdx);
                // We need to keep track of the parent block to the
                // child flow so we can unlightlight the parent block
                // after the child flow completes.
                this.parentFlowQueue[turtle].push(loopBlkIdx);
                this.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }
    };

    this.parseArg = function(logo, turtle, blk, parentBlk, receivedArg) {
        // Retrieve the value of a block.
        if (blk == null) {
            logo.errorMsg('Missing argument.', parentBlk);
            logo.stopTurtle = true;
            return null
        }

        if (logo.blocks.blockList[blk].protoblock.parameter) {
            if (turtle in logo.parameterQueue) {
                if (logo.parameterQueue[turtle].indexOf(blk) === -1) {
                    logo.parameterQueue[turtle].push(blk);
                }
            } else {
                // console.log('turtle ' + turtle + ' has no parameterQueue');
            }
        }

        if (logo.blocks.blockList[blk].isValueBlock()) {
            if (logo.blocks.blockList[blk].name === 'number' && typeof(logo.blocks.blockList[blk].value) === 'string') {
                try {
                    logo.blocks.blockList[blk].value = Number(logo.blocks.blockList[blk].value);
                } catch (e) {
                    console.log(e);
                }
            }
            return logo.blocks.blockList[blk].value;
        } else if (logo.blocks.blockList[blk].isArgBlock() || logo.blocks.blockList[blk].isArgClamp() || logo.blocks.blockList[blk].isArgFlowClampBlock()) {
            switch (logo.blocks.blockList[blk].name) {
            case 'loudness':
                    var values = logo.analyser.analyse();
                    var sum = 0;
                    for(var k=0; k<logo.limit; k++){
                            sum += (values[k] * values[k]);
                    }
                    var rms = Math.sqrt(sum/logo.limit);
                try {   
                    if (!logo.mic.open()) {
                        logo.mic.open();
                        logo.blocks.blockList[blk].value = 0;
                    } else {
                        logo.blocks.blockList[blk].value = Math.round(rms);
                    }
                } catch (e) {  // MORE DEBUGGING
                    console.log(e);
                    logo.mic.open();
                    logo.blocks.blockList[blk].value = Math.round(rms);
                }
                break;
            case 'eval':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var cblk2 = logo.blocks.blockList[blk].connections[2];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                // Restricted to math methods
                logo.blocks.blockList[blk].value = Number(eval('Math.' + a.replace(/x/g, b.toString())));
                break;
            case 'arg':
                var cblk = logo.blocks.blockList[blk].connections[1];
                var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                var action_args=receivedArg
                if(action_args.length >= Number(name)){
                    var value = action_args[Number(name)-1];
                    logo.blocks.blockList[blk].value = value;
                }else {
                    logo.errorMsg('Invalid argument',blk);
                    logo.stopTurtle = true;
                }
                return logo.blocks.blockList[blk].value;
                break;
            case 'box':
                var cblk = logo.blocks.blockList[blk].connections[1];
                var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (name in logo.boxes) {
                    logo.blocks.blockList[blk].value = logo.boxes[name];
                } else {
                    logo.errorMsg(NOBOXERRORMSG, blk, name);
                    logo.stopTurtle = true;
                    logo.blocks.blockList[blk].value = null;
                }
                break;
            case 'turtlename':
                logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].name;
                break;
            case 'namedbox':
                var name = logo.blocks.blockList[blk].privateData;
                if (name in logo.boxes) {
                    logo.blocks.blockList[blk].value = logo.boxes[name];
                } else {
                    logo.errorMsg(NOBOXERRORMSG, blk, name);
                    logo.stopTurtle = true;
                    logo.blocks.blockList[blk].value = null;
                }
                break;
            case 'namedarg' :
                var name = logo.blocks.blockList[blk].privateData;
                var action_args = receivedArg;
                if(action_args.length >= Number(name)){
                    var value = action_args[Number(name)-1];
                    logo.blocks.blockList[blk].value = value;
                }else {
                    logo.errorMsg('Invalid argument',blk);
                }
                return logo.blocks.blockList[blk].value;
                break;
            case 'sqrt':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, logo.blocks.blockList[blk].name]);
                } else {
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    if (a < 0) {
                        logo.errorMsg(NOSQRTERRORMSG, blk);
                        logo.stopTurtle = true;
                        a = -a;
                    }
                    logo.blocks.blockList[blk].value = logo._doSqrt(a);
                }
                break;
            case 'int':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'int']);
                } else {
                    var cblk = logo.blocks.blockList[blk].connections[1];
                    var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                    logo.blocks.blockList[blk].value = Math.floor(a);
                }
                break;
            case 'mod':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'mod']);
                } else {
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo._doMod(a, b);
                }
                break;
            case 'not':
                var cblk = logo.blocks.blockList[blk].connections[1];
                var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                logo.blocks.blockList[blk].value = !a;
                break;
            case 'greater':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var cblk2 = logo.blocks.blockList[blk].connections[2];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                logo.blocks.blockList[blk].value = (Number(a) > Number(b));
                break;
            case 'equal':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var cblk2 = logo.blocks.blockList[blk].connections[2];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                logo.blocks.blockList[blk].value = (a === b);
                break;
            case 'less':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var cblk2 = logo.blocks.blockList[blk].connections[2];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                var result = (Number(a) < Number(b));
                logo.blocks.blockList[blk].value = result;
                break;
            case 'random':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var cblk2 = logo.blocks.blockList[blk].connections[2];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                logo.blocks.blockList[blk].value = logo._doRandom(a, b);
                break;
            case 'oneOf':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var cblk2 = logo.blocks.blockList[blk].connections[2];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                logo.blocks.blockList[blk].value = logo._doOneOf(a, b);
                break;
            case 'plus':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'plus']);
                } else {
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo._doPlus(a, b);
                }
                break;
            case 'multiply':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'multiply']);
                } else {
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo._doMultiply(a, b);
                }
                break;
            case 'power':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'power']);
                } else {
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo._doPower(a, b);
                }
                break;   
            case 'divide':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'divide']);
                } else {
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo._doDivide(a, b);
                }
                break;
            case 'minus':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'minus']);
                } else {
                    var cblk1 = logo.blocks.blockList[blk].connections[1];
                    var cblk2 = logo.blocks.blockList[blk].connections[2];
                    var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                    var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                    logo.blocks.blockList[blk].value = logo._doMinus(a, b);
                }
                break;
            case 'neg':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                logo.blocks.blockList[blk].value = logo._doMinus(0, a);
                break;
            case 'toascii':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                logo.blocks.blockList[blk].value = String.fromCharCode(a);
                break;
            case 'myclick':
                console.log('[click' + logo.turtles.turtleList[turtle].name + ']');
                logo.blocks.blockList[blk].value = 'click' + logo.turtles.turtleList[turtle].name;
                break;
            case 'heading':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'heading']);
                } else {
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].orientation;
                }
                break;
            case 'x':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'x']);
                } else {
                    logo.blocks.blockList[blk].value = logo.turtles.screenX2turtleX(logo.turtles.turtleList[turtle].container.x);
                }
                break;
            case 'y':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'y']);
                } else {
                    logo.blocks.blockList[blk].value = logo.turtles.screenY2turtleY(logo.turtles.turtleList[turtle].container.y);
                }
                break;
            case 'xturtle':
            case 'yturtle':
                var cblk = logo.blocks.blockList[blk].connections[1];
                var targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                for (var i = 0; i < logo.turtles.turtleList.length; i++) {
                    var logoTurtle = logo.turtles.turtleList[i];
                    if (targetTurtle === logoTurtle.name) {
                        if (logo.blocks.blockList[blk].name === 'yturtle') {
                            logo.blocks.blockList[blk].value = logo.turtles.screenY2turtleY(logoTurtle.container.y);
                        } else {
                            logo.blocks.blockList[blk].value = logo.turtles.screenX2turtleX(logoTurtle.container.x);
                        }
                        break;
                    }
                }
                if (i === logo.turtles.turtleList.length) {
                    logo.errorMsg('Could not find turtle ' + targetTurtle, blk);
                    logo.blocks.blockList[blk].value = 0;
                }
                break;
            case 'bpmfactor':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'bpm']);
                } else if (logo.bpm[turtle].length > 0) {
                    logo.blocks.blockList[blk].value = last(logo.bpm[turtle]);
                } else {
                    logo.blocks.blockList[blk].value = logo._masterBPM;
                }
                break;
            case 'staccatofactor':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'staccato']);
                } else if (logo.staccato[turtle].length > 0) {
                    logo.blocks.blockList[blk].value = last(logo.staccato[turtle]);
                } else {
                    logo.blocks.blockList[blk].value = 0;
                }
                break;
            case 'slurfactor':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'slur']);
                } else if (logo.staccato[turtle].length > 0) {
                    logo.blocks.blockList[blk].value = -last(logo.staccato[turtle]);
                } else {
                    logo.blocks.blockList[blk].value = 0;
                }
                break;
            case 'key':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'key']);
                } else {
                    logo.blocks.blockList[blk].value = logo.keySignature[turtle];
                }
                break;
            case 'consonantstepsizeup':
                if (logo.lastNotePlayed[turtle] !== null) {
                    var len = logo.lastNotePlayed[turtle][0].length;
                    logo.blocks.blockList[blk].value = getStepSizeUp(logo.keySignature[turtle], logo.lastNotePlayed[turtle][0].slice(0, len - 1));
                } else {
                    logo.blocks.blockList[blk].value = getStepSizeUp(logo.keySignature[turtle], 'A');
                }
                break;
            case 'consonantstepsizedown':
                if (logo.lastNotePlayed[turtle] !== null) {
                    var len = logo.lastNotePlayed[turtle][0].length;
                    logo.blocks.blockList[blk].value = getStepSizeDown(logo.keySignature[turtle], logo.lastNotePlayed[turtle][0].slice(0, len - 1));
                } else {
                    logo.blocks.blockList[blk].value = getStepSizeDown(logo.keySignature[turtle], 'A');
                }
                break;
            case 'transpositionfactor':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'transposition']);
                } else {
                    logo.blocks.blockList[blk].value = logo.transposition[turtle];
                }
                break;
            case 'duplicatefactor':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'duplicate']);
                } else {
                    logo.blocks.blockList[blk].value = logo.duplicateFactor[turtle];
                }
                break;
            case 'skipfactor':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'skip']);
                } else {
                    logo.blocks.blockList[blk].value = logo.skipFactor[turtle];
                }
                break;
            case 'notevolumefactor':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'volume']);
                } else {
                    logo.blocks.blockList[blk].value = last(logo.polyVolume[turtle]);
                }
                break;
            case 'elapsednotes':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'elapsednotes']);
                } else {
                    logo.blocks.blockList[blk].value = logo.notesPlayed[turtle];
                }
                break;
            case 'beatfactor':
                logo.blocks.blockList[blk].value = logo.beatFactor[turtle];
                break;
            case 'number2pitch':
            case 'number2octave':
                var cblk = logo.blocks.blockList[blk].connections[1];
                var num = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (num != null && typeof(num) === 'number') {
                    var obj = numberToPitch(num + logo.pitchNumberOffset);
                    if (logo.blocks.blockList[blk].name === 'number2pitch') {
                        logo.blocks.blockList[blk].value = obj[0];
                    } else {
                        logo.blocks.blockList[blk].value = obj[1];
                    }
                } else {
                    logo.errorMsg('Invalid argument', blk);
                    logo.stopTurtle = true;
                }
                break;
            case 'turtlepitch':
                var value = null;
                var cblk = logo.blocks.blockList[blk].connections[1];
                var targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                for (var i = 0; i < logo.turtles.turtleList.length; i++) {
                    var logoTurtle = logo.turtles.turtleList[i];
                    if (targetTurtle === logoTurtle.name) {
                        if (logo.lastNotePlayed[turtle] !== null) {
                            var len = logo.lastNotePlayed[turtle][0].length;
                            var pitch = logo.lastNotePlayed[turtle][0].slice(0, len - 1);
                            var octave = parseInt(logo.lastNotePlayed[turtle][0].slice(len - 1));

                            var obj = [pitch, octave];
                        } else if(logo.notePitches[i].length > 0) {
                            var obj = logo.getNote(logo.notePitches[i][0], logo.noteOctaves[i][0], logo.noteTranspositions[i][0], logo.keySignature[i]);
                        } else {
                            console.log('Could not find a note for turtle ' + turtle);
                            var obj = ['C', 0];
                        }
                        value = pitchToNumber(obj[0], obj[1], logo.keySignature[turtle]) - logo.pitchNumberOffset;
                        logo.blocks.blockList[blk].value = value;
                    }
                }
                if (value == null) {
                    logo.errorMsg('Could not find turtle ' + targetTurtle, blk);
                    logo.blocks.blockList[blk].value = 0;
                }
                break;
            case 'turtlenote':
                var value = null;
                var cblk = logo.blocks.blockList[blk].connections[1];
                var targetTurtle = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                for (var i = 0; i < logo.turtles.turtleList.length; i++) {
                    var logoTurtle = logo.turtles.turtleList[i];
                    if (targetTurtle === logoTurtle.name) {
                        if (logo.lastNotePlayed[turtle] !== null) {
                            value = logo.lastNotePlayed[turtle][1];
                        } else if(logo.notePitches[i].length > 0) {
                            value = logo.noteBeat[i];
                        } else {
                            console.log('Could not find a note for turtle ' + turtle);
                            value = -1;
                        }
                        logo.blocks.blockList[blk].value = value;
                    }
                }
                if (value == null) {
                    logo.errorMsg('Could not find turtle ' + targetTurtle, blk);
                    logo.blocks.blockList[blk].value = -1;
                }
                break;
            // Deprecated
            case 'currentnote':
                logo.blocks.blockList[blk].value = logo.currentNotes[turtle];
                break;
            // Deprecated
            case 'currentoctave':
                logo.blocks.blockList[blk].value = logo.currentOctaves[turtle];
                break;
            case 'color':
            case 'hue':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'color']);
                } else {
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].color;
                }
                break;
            case 'shade':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'shade']);
                } else {
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].value;
                }
                break;
            case 'grey':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'grey']);
                } else {
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].chroma;
                }
                break;
            case 'pensize':
                if (logo.inStatusMatrix) {
                    logo.statusFields.push([blk, 'pensize']);
                } else {
                    logo.blocks.blockList[blk].value = logo.turtles.turtleList[turtle].stroke;
                }
                break;
            case 'and':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var cblk2 = logo.blocks.blockList[blk].connections[2];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                logo.blocks.blockList[blk].value = a && b;
                break;
            case 'or':
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var cblk2 = logo.blocks.blockList[blk].connections[2];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                logo.blocks.blockList[blk].value = a || b;
                break;
            case 'time':
                var d = new Date();
                logo.blocks.blockList[blk].value = (d.getTime() - logo.time) / 1000;
                break;
            case 'hspace':
                var cblk = logo.blocks.blockList[blk].connections[1];
                var v = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                logo.blocks.blockList[blk].value = v;
                break;
            case 'mousex':
                logo.blocks.blockList[blk].value = logo.getStageX();
                break;
            case 'mousey':
                logo.blocks.blockList[blk].value = logo.getStageY();
                break;
            case 'mousebutton':
                logo.blocks.blockList[blk].value = logo.getStageMouseDown();
                break;
            case 'keyboard':
                logo.lastKeyCode = logo.getCurrentKeyCode();
                logo.blocks.blockList[blk].value = logo.lastKeyCode;
                logo.clearCurrentKeyCode();
                break;
            case 'getred':
            case 'getgreen':
            case 'getblue':
                var colorString = logo.turtles.turtleList[turtle].canvasColor;
                // 'rgba(255,0,49,1)' or '#ff0031'
                if (colorString[0] === "#") {
                    colorString = hex2rgb(colorString.split("#")[1]);
                }
                var obj = colorString.split('(');
                var obj = obj[1].split(',');
                switch (logo.blocks.blockList[blk].name) {
                case 'getred':
                    logo.blocks.blockList[blk].value = parseInt(Number(obj[0]) / 2.55);
                    break;
                case 'getgreen':
                    logo.blocks.blockList[blk].value = parseInt(Number(obj[1]) / 2.55);
                    break;
                case 'getblue':
                    logo.blocks.blockList[blk].value = parseInt(Number(obj[2]) / 2.55);
                    break;
                }
                break;
            case 'getcolorpixel':
                var wasVisible = logo.turtles.turtleList[turtle].container.visible;
                logo.turtles.turtleList[turtle].container.visible = false;
                var x = logo.turtles.turtleList[turtle].container.x;
                var y = logo.turtles.turtleList[turtle].container.y;
                logo.refreshCanvas();
                var ctx = logo.canvas.getContext('2d');
                var imgData = ctx.getImageData(x, y, 1, 1).data;
                var color = searchColors(imgData[0], imgData[1], imgData[2]);
                if (imgData[3] === 0) {
                    color = body.style.background.substring(body.style.background.indexOf('(') + 1, body.style.background.lastIndexOf(')')).split(/,\s*/),
                    color = searchColors(color[0], color[1], color[2]);
                }
                logo.blocks.blockList[blk].value = color;
                if (wasVisible) {
                    logo.turtles.turtleList[turtle].container.visible = true;
                }
                break;
            case 'loadFile':
                // No need to do anything here.
                break;
            case 'tofrequency':
                var block = logo.blocks.blockList[blk];
                var cblk1 = logo.blocks.blockList[blk].connections[1];
                var cblk2 = logo.blocks.blockList[blk].connections[2];
                var a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
                var b = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
                block.value = Math.round(pitchToFrequency(a, b, 0, logo.keySignature[turtle]));
                break;
            case 'pop':
                var block = logo.blocks.blockList[blk];
                if (turtle in logo.turtleHeaps && logo.turtleHeaps[turtle].length > 0) {
                    block.value = logo.turtleHeaps[turtle].pop();
                } else {
                    logo.errorMsg(_('empty heap'));
                    block.value = null;
                }
                break;
            case 'indexHeap':
                var block = logo.blocks.blockList[blk];
                var cblk = logo.blocks.blockList[blk].connections[1];
                var a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (!(turtle in logo.turtleHeaps)) {
                    logo.turtleHeaps[turtle] = [];
                }
                // If index > heap length, grow the heap.
                while (logo.turtleHeaps[turtle].length < a) {
                    logo.turtleHeaps[turtle].push(null);
                }
                block.value = logo.turtleHeaps[turtle][a - 1];
                break;
            case 'heapLength':
                var block = logo.blocks.blockList[blk];
                if (!(turtle in logo.turtleHeaps)) {
                    logo.turtleHeaps[turtle] = [];
                }
                // console.log(logo.turtleHeaps[turtle].length);
                block.value = logo.turtleHeaps[turtle].length;
                break;
            case 'heapEmpty':
                var block = logo.blocks.blockList[blk];
                if (turtle in logo.turtleHeaps) {
                    block.value = (logo.turtleHeaps[turtle].length === 0);
                } else {
                    block.value = true;
                }
                break;
            case 'notecounter':
                var saveCountingStatus = logo.justCounting[turtle];
                var saveSuppressStatus = logo.suppressOutput[turtle];
                logo.suppressOutput[turtle] = true;
                logo.justCounting[turtle] = true;
                var actionArgs = [];
                var saveNoteCount = logo.notesPlayed[turtle];
                var cblk = logo.blocks.blockList[blk].connections[1];
                if (cblk == null) {
                    logo.blocks.blockList[blk].value = 0;
                } else {
                    logo.turtles.turtleList[turtle].running = true;
                    logo._runFromBlockNow(logo, turtle, cblk, true, actionArgs, logo.turtles.turtleList[turtle].queue.length);
                    logo.blocks.blockList[blk].value = logo.notesPlayed[turtle] - saveNoteCount;
                    logo.notesPlayed[turtle] = saveNoteCount;
                }
                logo.justCounting[turtle] = saveCountingStatus;
                logo.suppressOutput[turtle] = saveSuppressStatus;
                break;
            case 'calc':
                var actionArgs = [];
                var cblk = logo.blocks.blockList[blk].connections[1];
                var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                actionArgs = receivedArg;
                // logo.getBlockAtStartOfArg(blk);
                if (name in logo.actions) {
                    logo.turtles.turtleList[turtle].running = true;
                    logo._runFromBlockNow(logo, turtle, logo.actions[name], true, actionArgs, logo.turtles.turtleList[turtle].queue.length);
                    logo.blocks.blockList[blk].value = logo.returns.shift();
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, name);
                    logo.stopTurtle = true;
                }
                break;
            case 'namedcalc':
                var name = logo.blocks.blockList[blk].privateData;
                var actionArgs = [];

                actionArgs = receivedArg;
                // logo.getBlockAtStartOfArg(blk);
                if (name in logo.actions) {
                    logo.turtles.turtleList[turtle].running = true;
                    logo._runFromBlockNow(logo, turtle, logo.actions[name], true, actionArgs, logo.turtles.turtleList[turtle].queue.length);
                    logo.blocks.blockList[blk].value = logo.returns.shift();
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, name);
                    logo.stopTurtle = true;
                }
                break;
            case 'calcArg':
                var actionArgs = [];
                // logo.getBlockAtStartOfArg(blk);
                if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                    for (var i = 0; i < logo.blocks.blockList[blk].argClampSlots.length; i++){
                        var t = (logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i + 2], blk, receivedArg));
                        actionArgs.push(t);
                    }
                }
                var cblk = logo.blocks.blockList[blk].connections[1];
                var name = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                if (name in logo.actions) {
                    logo.turtles.turtleList[turtle].running = true;
                    logo._runFromBlockNow(logo, turtle, logo.actions[name], true, actionArgs, logo.turtles.turtleList[turtle].queue.length);
                    logo.blocks.blockList[blk].value = logo.returns.pop();
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, name);
                    logo.stopTurtle = true;
                }
                break;
            case 'namedcalcArg':
                var name = logo.blocks.blockList[blk].privateData;
                var actionArgs = [];
                // logo.getBlockAtStartOfArg(blk);
                if (logo.blocks.blockList[blk].argClampSlots.length > 0) {
                    for (var i = 0; i < logo.blocks.blockList[blk].argClampSlots.length; i++){
                        var t = (logo.parseArg(logo, turtle, logo.blocks.blockList[blk].connections[i + 1], blk, receivedArg));
                        actionArgs.push(t);
                    }
                }
                if (name in logo.actions) {
                    // Just run the stack.
                    logo.turtles.turtleList[turtle].running = true;
                    logo._runFromBlockNow(logo, turtle, logo.actions[name], true, actionArgs, logo.turtles.turtleList[turtle].queue.length);
                    logo.blocks.blockList[blk].value = logo.returns.pop();
                } else {
                    logo.errorMsg(NOACTIONERRORMSG, blk, name);
                    logo.stopTurtle = true;
                }
                break;
            case 'doArg':
                return blk;
                break;
            case 'nameddoArg':
                return blk;
                break;
            case 'returnValue':
                if (logo.returns.length > 0) {
                    logo.blocks.blockList[blk].value = logo.returns.pop();
                } else {
                    console.log('WARNING: No return value.');
                    logo.blocks.blockList[blk].value = 0;
                }
                break;
            default:
                if (logo.blocks.blockList[blk].name in logo.evalArgDict) {
                    eval(logo.evalArgDict[logo.blocks.blockList[blk].name]);
                } else {
                    console.log('ERROR: I do not know how to ' + logo.blocks.blockList[blk].name);
                }
                break;
            }
            return logo.blocks.blockList[blk].value;
        } else {
            return blk;
        }
    };

    this._doWait = function(turtle, secs) {
        this.waitTimes[turtle] = Number(secs) * 1000;
    };

    // Math functions
    this._doRandom = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.floor(Math.random() * (Number(b) - Number(a) + 1) + Number(a));
    };

    this._doOneOf = function(a, b) {
        if (Math.random() < 0.5) {
            return a;
        } else {
            return b;
        }
    };

    this._doMod = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) % Number(b);
    };

    this._doSqrt = function(a) {
        if (typeof(a) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.sqrt(Number(a));
    };

    this._doPlus = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            if (typeof(a) === 'string') {
                var aString = a;
            } else {
                var aString = a.toString();
            }

            if (typeof(b) === 'string') {
                var bString = b;
            } else {
                var bString = b.toString();
            }

            return aString + bString;
        } else {
            return Number(a) + Number(b);
        }
    };

    this._doMinus = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) - Number(b);
    };

    this._doMultiply = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) * Number(b);
    };

    this._doPower = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.pow(a, b);
    };
    
    this._doDivide = function(a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        if (Number(b) === 0) {
            this.errorMsg(ZERODIVIDEERRORMSG);
            this.stopTurtle = true;
            return 0;
        } else {
            return Number(a) / Number(b);
        }
    };

    this.setBackgroundColor = function(turtle) {
        /// Change body background in DOM to current color.
        var body = document.body;
        if (turtle === -1) {
            var c = platformColor.background;
        } else {
            var c = this.turtles.turtleList[turtle].canvasColor;
        }

        body.style.background = c;
        document.querySelector('.canvasHolder').style.background = c;
        this.svgOutput = '';
    };

    this.setCameraID = function(id) {
        this.cameraID = id;
    };

    this.hideBlocks = function() {
        // Hide all the blocks.
        this.blocks.hide();
        this.refreshCanvas();
    };

    this.showBlocks = function() {
        // Show all the blocks.
        this.blocks.show();
        this.blocks.bringToTop();
        this.refreshCanvas();
    };

    this.getNote = function (solfege, octave, transposition, keySignature) {
        this.validNote = true;
        var sharpFlat = false;

        octave = Math.round(octave);
        transposition = Math.round(transposition);
        if (typeof(solfege) === 'number') {
            solfege = solfege.toString();
        }

        // Check for double flat or double sharp.
        var len = solfege.length;
        if (len > 2) {
            var lastTwo = solfege.slice(len - 2);
            if (lastTwo === 'bb' || lastTwo === '♭♭') {
                solfege = solfege.slice(0, len - 1);
                transposition -= 1;
            } else if (lastTwo === '##' || lastTwo === '♯♯') {
                solfege = solfege.slice(0, len - 1);
                transposition += 1;
            } else if (lastTwo === '#b' || lastTwo === '♯♭' || lastTwo === 'b#' || lastTwo === '♭♯') {
                // Not sure this could occur... but just in case.
                solfege = solfege.slice(0, len - 2);
            }
        }

        // Already a note? No need to convert from solfege.
        if (solfege in BTOFLAT) {
            solfege = BTOFLAT[solfege];
        } else if (solfege in STOSHARP) {
            solfege = STOSHARP[solfege];
        }

        if (solfege in EXTRATRANSPOSITIONS) {
            octave += EXTRATRANSPOSITIONS[solfege][1];
            note = EXTRATRANSPOSITIONS[solfege][0];
        } else if (NOTESSHARP.indexOf(solfege.toUpperCase()) !== -1) {
            note = solfege.toUpperCase();
        } else if (NOTESFLAT.indexOf(solfege) !== -1) {
            note = solfege;
        } else if (NOTESFLAT2.indexOf(solfege) !== -1) {
            // Convert to uppercase, e.g., d♭ -> D♭.
            note = NOTESFLAT[notesFlat2.indexOf(solfege)];
        } else {
            // Not a note, so convert from Solfege.
            // Could be mi#<sub>4</sub> (from matrix) or mi# (from note).
            if (solfege.substr(-1) === '>') {
                // Read octave and solfege from HTML
                octave = parseInt(solfege.slice(solfege.indexOf('>') + 1, solfege.indexOf('/') - 1));
                solfege = solfege.substr(0, solfege.indexOf('<'));
            }

            if(['#', '♯', '♭', 'b'].indexOf(solfege.substr(-1)) !== -1) {
                sharpFlat = true;
            }

            if (!keySignature) {
                keySignature = 'C';
            }

            var obj = getScaleAndHalfSteps(keySignature);
            var thisScale = obj[0];
            var halfSteps = obj[1];
            var myKeySignature = obj[2];
            var mode = obj[3];

            // Ensure it is a valid key signature.
            offset = thisScale.indexOf(myKeySignature);
            if (offset === -1) {
                console.log('WARNING: Key ' + myKeySignature + ' not found in ' + thisScale + '. Using default of C');
                var offset = 0;
                var thisScale = NOTESSHARP;
            }

            if (sharpFlat) {
                if (solfege.substr(-1) === '#') {
                    offset += 1;
                } else if (solfege.substr(-1) === '♯') {
                    offset += 1;
                } else if (solfege.substr(-1) === '♭') {
                    offset -= 1;
                } else if(solfege.substr(-1) === 'b') {
                    offset -= 1;
                }
            }

            // Reverse any i18n
            // solfnotes_ is used in the interface for i18n
            //.TRANS: the note names must be separated by single spaces 
            var solfnotes_ = _('ti la sol fa mi re do').split(' ');
            if (solfnotes_.indexOf(solfege.substr(0, 2).toLowerCase()) !== -1) {
                var solfegePart = SOLFNOTES[solfnotes_.indexOf(solfege.substr(0, 2).toLowerCase())];
            } else if (solfnotes_.indexOf(solfege.substr(0, 3).toLowerCase()) !== -1) {
                var solfegePart = SOLFNOTES[solfnotes_.indexOf(solfege.substr(0, 3).toLowerCase())];
            } else {
                var solfegePart = solfege.substr(0, 2).toLowerCase();
            }

            if (solfege.toLowerCase().substr(0, 4) === 'rest') {
                return ['R', ''];
            } else if (halfSteps.indexOf(solfegePart) !== -1) {
                var index = halfSteps.indexOf(solfegePart) + offset;
                if (index > 11) {
                    index -= 12;
                    octave += 1;
                }
                note = thisScale[index];
            } else {
                console.log('WARNING: Note ' + solfege + ' not found in ' + halfSteps + '. Returning REST');
                // this.validNote = false;
                this.errorMsg(INVALIDPITCH, null);
                return ['R', ''];
            }

            if (note in EXTRATRANSPOSITIONS) {
                octave += EXTRATRANSPOSITIONS[note][1];
                note = EXTRATRANSPOSITIONS[note][0];
            }
        }

        if (transposition && transposition !== 0) {
            if (transposition < 0) {
                deltaOctave = -Math.floor(-transposition / 12);
                deltaNote = -(-transposition % 12);
            } else {
                deltaOctave = Math.floor(transposition / 12);
                deltaNote = transposition % 12;
            }

            octave += deltaOctave;

            if (NOTESSHARP.indexOf(note) !== -1) {
                i = NOTESSHARP.indexOf(note);
                i += deltaNote;
                if (i < 0) {
                    i += 12;
                    octave -= 1;
                } else if (i > 11) {
                    i -= 12;
                    octave += 1;
                }
                note = NOTESSHARP[i];
            } else if (NOTESFLAT.indexOf(note) !== -1) {
                i = NOTESFLAT.indexOf(note);
                i += deltaNote;
                if (i < 0) {
                    i += 12;
                    octave -= 1;
                } else if (i > 11) {
                    i -= 12;
                    octave += 1;
                }
                note = NOTESFLAT[i];
            } else {
                console.log('note not found? ' + note);
            }
        }

        if (octave < 1) {
            return [note, 1];
        } else if (octave > 10) {
            return [note, 10];
        } else {
            return [note, octave];
        }
    };

};
