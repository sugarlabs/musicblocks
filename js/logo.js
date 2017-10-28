// Copyright (c) 2014-2017 Walter Bender
// Copyright (c) 2015 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundatioff; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const DEFAULTVOLUME = 50;
const TONEBPM = 240;  // Seems to be the default.
const TARGETBPM = 90;  // What we'd like to use for beats per minute
const DEFAULTDELAY = 500;  // milleseconds
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

const NOTATIONNOTE = 0;
const NOTATIONDURATION = 1;
const NOTATIONDOTCOUNT = 2;
const NOTATIONTUPLETVALUE = 3;
const NOTATIONROUNDDOWN = 4;
const NOTATIONINSIDECHORD = 5;
const NOTATIONSTACCATO = 6;

function Logo () {

    this.canvas = null;
    this.blocks = null;
    this.turtles = null;
    this.stage = null;
    this.refreshCanvas = null;
    this.textMsg = null;
    this.errorMsg = null;
    this.hideMsgs = null;
    this.onStopTurtle = null;
    this.onRunTurtle = null;
    this.getStageX = null;
    this.getStageY = null;
    this.getStageMouseDown = null;
    this.getCurrentKeyCode = null;
    this.clearCurrentKeyCode = null;
    this.meSpeak = null;
    this.saveLocally = null;

    this.pitchTimeMatrix = null;
    this.pitchDrumMatrix = null;
    this.rhythmRuler = null;
    this.timbre = null;
    this.pitchStaircase = null;
    this.tempo = null;
    this.pitchSlider = null;
    this.modeWidget = null;
    this.statusMatrix = null;
    this.playbackWidget = null;

    this.attack = {};
    this.decay = {};
    this.sustain = {};
    this.release = {};

    this.evalFlowDict = {};
    this.evalArgDict = {};
    this.evalParameterDict = {};
    this.evalSetterDict = {};
    this.evalOnStartList = {};
    this.evalOnStopList = {};
    this.eventList = {};
    this.receivedArg = null;

    this.parentFlowQueue = {};
    this.unhighlightQueue = {};
    this.parameterQueue = {};

    this.boxes = {};
    this.actions = {};
    this.returns = [];
    this.turtleHeaps = {};
    this.invertList = {};
    this.beatList = {};

    // We store each case arg and flow by switch block no. and turtle.
    this.switchCases = {};
    this.switchBlocks = {};

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

    // Movable solfege?
    this.movable = false;

    // When you run Music Blocks, you are "compiling" your code. The
    // compiled code is stored in the playbackQueue, which can be used
    // to playback the performance without the overhead of
    // interpreting the code.
    this.playbackQueue = {};
    this.playbackTime = 0;

    // Widget-related attributes
    this.showPitchDrumMatrix = false;
    this.inPitchDrumMatrix = false;
    this.inRhythmRuler = false;
    this.rhythmRulerMeasure = null;
    this.inPitchStaircase = false;
    this.inTempo = false;
    this.inPitchSlider = false;
    this._currentDrumBlock = null;
    this.inTimbre = false;
    this.inSetTimbre = {};

    // pitch-rhythm matrix
    this.inMatrix = false;
    this.keySignature = {};
    this.tupletRhythms = [];
    this.addingNotesToTuplet = false;
    this.drumBlocks = [];
    this.pitchBlocks = [];
    this.inNoteBlock = [];
    this.multipleVoices = [];

    // parameters used by pitch
    this.transposition = {};
    this.transpositionValues = {};

    // parameters used by notes
    this._masterBPM = TARGETBPM;
    this.defaultBPMFactor = TONEBPM / this._masterBPM;

    this.beatFactor = {};
    this.dotCount = {};
    this.noteBeat = {};
    this.noteValue = {};
    this.oscList = {};
    this.noteDrums = {};
    this.notePitches = {};
    this.noteOctaves = {};
    this.noteCents = {};
    this.noteHertz = {};
    this.noteTranspositions = {};
    this.noteBeatValues = {};
    this.embeddedGraphics = {};
    this.lastNotePlayed = {};
    this.noteStatus = {};

    this.pitchNumberOffset = 39;  // C4

    // status of note being played
    // Deprecated (ref lastNotePlayed)
    this.currentNotes = {};
    this.currentOctaves = {};

    // parameters used in time signature
    this.pickup = {};
    this.beatsPerMeasure = {};
    this.noteValuePerBeat = {};
    this.currentBeat = {};
    this.currentMeasure = {};

    // parameters used by the note block
    this.bpm = {};
    this.previousTurtleTime = [];
    this.turtleTime = [];
    this.noteDelay = 0;
    this.playedNote = {};
    this.playedNoteTimes = {};
    this.pushedNote = {};
    this.connectionStore = {};
    this.connectionStoreLock = false;
    this.duplicateFactor = {};
    this.inDuplicate = {};
    this.skipFactor = {};
    this.skipIndex = {};
    this.instrumentNames = {};
    this.inCrescendo = {};
    this.crescendoDelta = {};
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
    this.masterVolume = [];
    this.synthVolume = {};
    this.validNote = true;
    this.drift = {};
    this.drumStyle = {};
    this.voices = {};
    this.backward = {};

    // Effects parameters
    this.vibratoIntensity = {};
    this.vibratoRate = {};
    this.distortionAmount = {};
    this.tremoloFrequency = {};
    this.tremoloDepth = {};
    this.rate = {};
    this.octaves = {};
    this.baseFrequency = {};
    this.chorusRate = {};
    this.delayTime = {};
    this.chorusDepth = {};

    // When counting notes or generating lilypond output...
    this.justCounting = {};
    this.suppressOutput = {};

    // scale factor for turtle graphics embedded in notes
    this.dispatchFactor = {};

    // tuplet
    this.tuplet = false;
    this.tupletParams = [];

    // pitch to drum mapping
    this.pitchDrumTable = {};

    // parameters used by notations
    this.notationStaging = {};
    this.notationOutput = getLilypondHeader();
    this.notationNotes = {};
    this.runningLilypond = false;
    this.checkingCompletionState = false;
    this.compiling = false;

    // A place to save turtle state in order to store it after a compile
    this._saveX = {};
    this._saveY = {};
    this._saveColor = {};
    this._saveValue = {};
    this._saveChroma = {};
    this._saveStroke = {};
    this._saveCanvasAlpha = {};
    this._saveOrientation = {};
    this._savePenState = {};

    if (_THIS_IS_MUSIC_BLOCKS_) {
        // Load the default synthesizer
        this.synth = new Synth();
        this.synth.createDefaultSynth();
    }
    else {
        this.turtleOscs = {};
    }

    // Mode widget
    this._modeBlock = null;

    // Status matrix
    this.inStatusMatrix = false;
    this.updatingStatusMatrix = false;
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

    if (_THIS_IS_MUSIC_BLOCKS_) {
        this.mic = new Tone.UserMedia();
        this.limit = 1024;
        this.analyser = new Tone.Analyser({
                        "type" : "waveform",
                        "size" : this.limit
        });
        this.mic.connect(this.analyser);
    } else {
        try {
            this.mic = new p5.AudioIn()
        } catch (e) {
            console.log(e);
            console.log(NOMICERRORMSG);
            this.mic = null;
        }
    }

    this.setSetPlaybackStatus = function (setPlaybackStatus) {
        this.setPlaybackStatus = setPlaybackStatus;
        return this;
    };

    this.setCanvas = function (canvas) {
        this.canvas = canvas;
        return this;
    };

    this.setBlocks = function (blocks) {
        this.blocks = blocks;
        return this;
    };

    this.setTurtles = function (turtles) {
        this.turtles = turtles;
        return this;
    };

    this.setStage = function (stage) {
        this.stage = stage;
        return this;
    };

    this.setRefreshCanvas = function (refreshCanvas) {
        this.refreshCanvas = refreshCanvas;
        return this;
    };

    this.setTextMsg = function (textMsg) {
        this.textMsg = textMsg;
        return this;
    };

    this.setHideMsgs = function (hideMsgs) {
        this.hideMsgs = hideMsgs;
        return this;
    };

    this.setErrorMsg = function (errorMsg) {
        this.errorMsg = errorMsg;
        return this;
    };

    this.setOnStopTurtle = function (onStopTurtle) {
        this.onStopTurtle = onStopTurtle;
        return this;
    };

    this.setOnRunTurtle = function (onRunTurtle) {
        this.onRunTurtle = onRunTurtle;
        return this;
    };

    this.setGetStageX = function (getStageX) {
        this.getStageX = getStageX;
        return this;
    };

    this.setGetStageY = function (getStageY) {
        this.getStageY = getStageY;
        return this;
    };

    this.setGetStageMouseDown = function (getStageMouseDown) {
        this.getStageMouseDown = getStageMouseDown;
        return this;
    };

    this.setGetCurrentKeyCode = function (getCurrentKeyCode) {
        this.getCurrentKeyCode = getCurrentKeyCode;
        return this;
    };

    this.setClearCurrentKeyCode = function (clearCurrentKeyCode) {
        this.clearCurrentKeyCode = clearCurrentKeyCode;
        return this;
    };

    this.setMeSpeak = function (meSpeak) {
        this.meSpeak = meSpeak;
        return this;
    };

    this.setSaveLocally = function (saveLocally) {
        this.saveLocally = saveLocally;
        return this;
    };

    // Used to pause between each block as the program executes.
    this.setTurtleDelay = function (turtleDelay) {
        this.turtleDelay = turtleDelay;
        this.noteDelay = 0;
    };

    // Used to pause between each note as the program executes.
    this.setNoteDelay = function (noteDelay) {
        this.noteDelay = noteDelay;
        this.turtleDelay = 0;
    };

    this.step = function () {
        // Take one step for each turtle in excuting Logo commands.
        for (var turtle in this.stepQueue) {
            if (this.stepQueue[turtle].length > 0) {
                if (turtle in this.unhighlightStepQueue && this.unhighlightStepQueue[turtle] != null) {
                    if (this.blocks.visible) {
                        this.blocks.unhighlight(this.unhighlightStepQueue[turtle]);
                    }
                    this.unhighlightStepQueue[turtle] = null;
                }
                var blk = this.stepQueue[turtle].pop();
                if (blk != null) {
                    this._runFromBlockNow(this, turtle, blk, 0, null);
                }
            }
        }
    };

    this.stepNote = function () {
        // Step through one note for each turtle in excuting Logo
        // commands, but run through other blocks at full speed.
        var tempStepQueue = {};
        var notesFinish = {};
        var thisNote = {};
        var that = this;

        __stepNote();

        function __stepNote() {
            for (var turtle in that.stepQueue) {
                // Have we already played a note for this turtle?
                if (turtle in that.playedNote && that.playedNote[turtle]) {
                    continue;
                }
                if (that.stepQueue[turtle].length > 0) {
                    if (turtle in that.unhighlightStepQueue && that.unhighlightStepQueue[turtle] != null) {
                        if (that.blocks.visible) {
                            that.blocks.unhighlight(that.unhighlightStepQueue[turtle]);
                        }
                        that.unhighlightStepQueue[turtle] = null;
                    }
                    var blk = that.stepQueue[turtle].pop();
                    if (blk != null && blk !== notesFinish[turtle]) {
                        var block = that.blocks.blockList[blk];
                        if (block.name === 'newnote') {
                            tempStepQueue[turtle] = blk;
                            notesFinish[turtle] = last(block.connections);
                            if (notesFinish[turtle] == null) { // end of flow
                                notesFinish[turtle] = last(that.turtles.turtleList[turtle].queue) && last(that.turtles.turtleList[turtle].queue).blk;
                                // catch case of null - end of project
                            }
                            // that.playedNote[turtle] = true;
                            that.playedNoteTimes[turtle] = that.playedNoteTimes[turtle] || 0;
                            thisNote[turtle] = Math.pow(that.parseArg(that, turtle, block.connections[1], blk, that.receivedArg), -1);
                            that.playedNoteTimes[turtle] += thisNote[turtle];
                            // Keep track of how long the note played for, so we can go back and play it again if needed
                        }
                        that._runFromBlockNow(that, turtle, blk, 0, null);
                    } else {
                        that.playedNote[turtle] = true;
                    }
                }
            }

            // At this point, some turtles have played notes and others
            // have not. We need to keep stepping until they all have.
            var keepGoing = false;
            for (var turtle in that.stepQueue) {
                if (that.stepQueue[turtle].length > 0 && !that.playedNote[turtle]) {
                    keepGoing = true;
                    break;
                }
            }
            if (keepGoing) {
                __stepNote();
                // that.step();
            } else {
                var notesArray = [];
                for (var turtle in that.playedNote) {
                    that.playedNote[turtle] = false;
                    notesArray.push(that.playedNoteTimes[turtle]);
                }

                // If some notes are supposed to play for longer, add
                // them back to the queue
                var shortestNote = Math.min.apply(null, notesArray);
                var continueFrom;
                for (var turtle in that.playedNoteTimes) {
                    if (that.playedNoteTimes[turtle] > shortestNote) {
                        continueFrom = tempStepQueue[turtle];
                        // Subtract the time, as if we haven't played it yet
                        that.playedNoteTimes[turtle] -= thisNote[turtle];
                    } else {
                        continueFrom = notesFinish[turtle];
                    }
                    that._runFromBlock(that, turtle, continueFrom, 0, null);
                }
                if (shortestNote === Math.max.apply(null, notesArray)) {
                    that.playedNoteTimes = {};
                }
            }
        };
    };

    this.doStopTurtle = function () {
        // The stop button was pressed. Stop the turtle and clean up a
        // few odds and ends.
        this.stopTurtle = true;
        this.turtles.markAsStopped();
        this.playbackTime = 0;

        for (var sound in this.sounds) {
            this.sounds[sound].stop();
        }

        this.sounds = [];

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.synth.stopSound('default');
            this.synth.stop();
        }

        if (this.cameraID != null) {
            doStopVideoCam(this.cameraID, this.setCameraID);
        }

        this.onStopTurtle();
        this.blocks.bringToTop();

        this.stepQueue = {};
        this.unhighlightQueue = {};

        this._restoreConnections();

        document.body.style.cursor = 'default';
    };

    this._restoreConnections = function () {
        // Restore any broken connections made in duplicate notes clamps.
        for (var turtle in this.connectionStore) {
            for (var blk in this.connectionStore[turtle]) {
                var n = this.connectionStore[turtle][blk].length;
                for (var i = 0; i < n; i++) {
                    var obj = this.connectionStore[turtle][blk].pop();
                    this.blocks.blockList[obj[0]].connections[obj[1]] = obj[2];
                    if (obj[2] != null) {
                        this.blocks.blockList[obj[2]].connections[0] = obj[0];
                    }
                }
            }
        }
    };

    this._clearParameterBlocks = function () {
        for (var blk = 0; blk < this.blocks.blockList.length; blk++) {
            switch (this.blocks.blockList[blk].name) {
            case 'and':
            case 'or':
            case 'not':
            case 'less':
            case 'greater':
            case 'equal':
            case 'random':
            case 'mod':
            case 'sqrt':
            case 'abs':
            case 'int':
            case 'plus':
            case 'minus':
            case 'multiply':
            case 'power':
            case 'divide':
            case 'namedbox':
            case 'box':
            case 'x':
            case 'y':
            case 'heading':
            case 'color':
            case 'hue':
            case 'shade':
            case 'grey':
            case 'pensize':
            case 'time':
            case 'mousex':
            case 'mousey':
            case 'keyboard':
            case 'loudness':
            case 'consonantstepsizeup':
            case 'consonantstepsizedown':
            case 'transpositionfactor':
            case 'staccatofactor':
            case 'slurfactor':
            case 'beatfactor':
            case 'elapsednotes':
            case 'duplicatefactor':
            case 'skipfactor':
            case 'notevolumefactor':
            case 'currentnote':
            case 'currentoctave':
            case 'bpmfactor':
            case 'beatvalue':
            case 'measurevalue':
            case 'mypitch':
            case 'mynotevalue':
                this.blocks.blockList[blk].text.text = '';
                this.blocks.blockList[blk].container.updateCache();
                break;
            }
        }
        this.refreshCanvas();
    };

    this._updateParameterBlock = function (that, turtle, blk) {
        // Update the label on parameter blocks.
        var logo = that;  // For plugin backward compatibility

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
            case 'abs':
            case 'int':
            case 'plus':
            case 'minus':
            case 'multiply':
            case 'power':
                value = toFixed2(this.blocks.blockList[blk].value);
                break;
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
                var boxname = this.parseArg(that, turtle, cblk, blk, this.receivedArg);
                if (boxname in this.boxes) {
                    value = this.boxes[boxname];
                } else {
                    this.errorMsg(NOBOXERRORMSG, blk, boxname);
                }
                break;
            case 'x':
                value = toFixed2(this.turtles.turtleList[turtle].x);
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
                if (this.mic == null) {
                    this.errorMsg(NOMICERRORMSG);
                    value = 0;
                } else {
                    if (_THIS_IS_TURTLE_BLOCKS) {
                        value = Math.round(this.mic.getLevel() * 1000);
                    } else {
                        var values = this.analyser.analyse();
                        var sum = 0;
                        for (var k = 0; k < this.limit; k++) {
                            sum += (values[k] * values[k]);
                        }
                        value = Math.round(Math.sqrt(sum / this.limit));
                    }
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
            case 'notevolumefactor':  // master volume
                value = last(this.masterVolume);
                break;
            case 'mypitch':
                if (this.lastNotePlayed[turtle] !== null) {
                    var len = this.lastNotePlayed[turtle][0].length;
                    value = pitchToNumber(this.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(this.lastNotePlayed[turtle][0].slice(len - 1)), this.keySignature[turtle]) - this.pitchNumberOffset;
                } else {
                    value = pitchToNumber('G', 4, this.keySignature[turtle])  - this.pitchNumberOffset;
                }

                value = value.toString();
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
            case 'beatvalue':
                value = this.currentBeat[turtle];
                break;
            case 'measurevalue':
                value = this.currentMeasure[turtle];
                break;
            case 'mynotevalue':
                value = null;
                if (this.noteValue[turtle][last(this.inNoteBlock[turtle])] !== null) {
                    value = 1 / this.noteValue[turtle][last(this.inNoteBlock[turtle])];
                } else if (this.lastNotePlayed[turtle] !== null) {
                    value = this.lastNotePlayed[turtle][1];
                } else if (this.notePitches[turtle][last(this.inNoteBlock[turtle])].length > 0) {
                    value = this.noteBeat[turtle][last(this.inNoteBlock[turtle])];
                } else {
                    value = -1;
                }

                if (value !== 0) {
                    value = mixedNumber(1 / value);
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
            } else if (name === 'divide') {
                this.blocks.blockList[blk].text.text = mixedNumber(value);
            }

            this.blocks.blockList[blk].container.updateCache();
            this.refreshCanvas();
        }
    };

    this.runLogoCommands = function (startHere, env) {
        // Restore any broken connections.
        this._restoreConnections();

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

        this._masterBPM = TARGETBPM;
        this.defaultBPMFactor = TONEBPM / this._masterBPM;
        this.masterVolume = [DEFAULTVOLUME];
        this.movable = false;

        // Each turtle needs to keep its own wait time and music
        // states.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.previousTurtleTime[turtle] = 0;
            this.turtleTime[turtle] = 0;
            this.waitTimes[turtle] = 0;
            this.endOfClampSignals[turtle] = {};
            this.cp1x[turtle] = 0;
            this.cp1y[turtle] = 100;
            this.cp2x[turtle] = 100;
            this.cp2y[turtle] = 100;
            this.inNoteBlock[turtle] = [];
            this.multipleVoices[turtle] = false;
            this.transposition[turtle] = 0;
            this.transpositionValues[turtle] = [];
            this.noteBeat[turtle] = {};
            this.noteValue[turtle] = {};
            this.noteCents[turtle] = {};
            this.noteHertz[turtle] = {};
            this.lastNotePlayed[turtle] = null;
            this.noteStatus[turtle] = null;
            this.noteDrums[turtle] = {};
            this.notePitches[turtle] = {};
            this.noteOctaves[turtle] = {};
            this.currentNotes[turtle] = 'G';
            this.currentOctaves[turtle] = 4;
            this.noteTranspositions[turtle] = [];
            this.noteBeatValues[turtle] = {};
            this.embeddedGraphics[turtle] = {};
            this.beatFactor[turtle] = 1;
            this.dotCount[turtle] = 0;
            this.invertList[turtle] = [];
            this.beatList[turtle] = [];
            this.switchCases[turtle] = {};
            this.switchBlocks[turtle] = [];
            this.connectionStore[turtle] = {};
            this.connectionStoreLock = false;
            this.duplicateFactor[turtle] = 1;
            this.inDuplicate[turtle] = false;
            this.skipFactor[turtle] = 1;
            this.skipIndex[turtle] = 0;
            this.notesPlayed[turtle] = 0;
            this.playbackQueue[turtle] = [];
            this.keySignature[turtle] = 'C ' + _('major');
            this.pushedNote[turtle] = false;
            this.oscList[turtle] = {};
            this.bpm[turtle] = [90];
            this.inSetTimbre[turtle] = false;
            this.instrumentNames[turtle] = [];
            this.inCrescendo[turtle] = [];
            this.crescendoDelta[turtle] = [];
            this.crescendoInitialVolume[turtle] = {'default': [DEFAULTVOLUME]};
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
            this.tremoloDepth[turtle] = [];
            this.tremoloFrequency[turtle] = [];
            this.distortionAmount[turtle] = [];
            this.attack[turtle] = [];
            this.decay[turtle] = [];
            this.sustain[turtle] = [];
            this.release[turtle] = [];
            this.rate[turtle] = [];
            this.octaves[turtle] = [];
            this.baseFrequency[turtle] = [];
            this.chorusRate[turtle] = [];
            this.delayTime[turtle] = [];
            this.chorusDepth[turtle] = [];
            this.dispatchFactor[turtle] = 1;
            this.pickup[turtle] = 0;
            this.synthVolume[turtle] = {'default': [DEFAULTVOLUME]};
            this.beatsPerMeasure[turtle] = 4;  // Default is 4/4 time.
            this.noteValuePerBeat[turtle] = 4;
            this.currentBeat[turtle] = 0;
            this.currentMeasure[turtle] = 0;
            this.justCounting[turtle] = false;
            this.suppressOutput[turtle] = this.runningLilypond || this.compiling;
            if (this.compiling) {
                this._saveX[turtle] = this.turtles.turtleList[turtle].x;
                this._saveY[turtle] = this.turtles.turtleList[turtle].y;
                this._saveColor[turtle] = this.turtles.turtleList[turtle].color;
                this._saveValue[turtle] = this.turtles.turtleList[turtle].value;
                this._saveChroma[turtle] = this.turtles.turtleList[turtle].chroma;
                this._saveStroke[turtle] = this.turtles.turtleList[turtle].stroke;
                this._saveCanvasAlpha[turtle] = this.turtles.turtleList[turtle].canvasAlpha;
                this._saveOrientation[turtle] = this.turtles.turtleList[turtle].orientation;
                this._savePenState[turtle] = this.turtles.turtleList[turtle].penState;
            }
        }

        this.pitchNumberOffset = 39;  // C4

        if (!this.suppressOutput[turtle]) {
            this._setMasterVolume(DEFAULTVOLUME);
            for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
                for (var synth in this.synthVolume[turtle]) {
                    this._setSynthVolume(synth, DEFAULTVOLUME);
                }
            }
        }

        this.inPitchDrumMatrix = false;
        this.inMatrix = false;
        this.inTimbre = false;
        this.inRhythmRuler = false;
        this.rhythmRulerMeasure = null;
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
        if (docById('statusDiv').style.visibility === 'visible') {
            this.statusMatrix.init(this);
        }

        // Execute turtle code here...  Find the start block (or the
        // top of each stack) and build a list of all of the named
        // action stacks.
        var startBlocks = [];
        this.blocks.findStacks();
        this.actions = {};
        for (var blk = 0; blk < this.blocks.stackList.length; blk++) {
            if (['start', 'drum', 'status'].indexOf(this.blocks.blockList[this.blocks.stackList[blk]].name) !== -1) {
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

        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            if (turtle in this.parentFlowQueue) {
                this.parentFlowQueue[turtle] = [];
            }

            if (turtle in this.unhighlightQueue) {
                this.unhighlightQueue[turtle] = [];
            }

            if (turtle in this.parameterQueue) {
                this.parameterQueue[turtle] = [];
            }
        }

        if (this.turtleDelay === 0) {
            // Don't update parameters when running full speed.
            this._clearParameterBlocks();
        }

        this.onRunTurtle();

        // Make sure that there is atleast one turtle.
        if (this.turtles.turtleList.length === 0) {
            console.log('No start block... adding a turtle');
            this.turtles.addTurtle(null);
        }

        // And mark all turtles as not running.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.turtles.turtleList[turtle].running = false;
        }

        // (2) Execute the stack.
        // A bit complicated because we have lots of corner cases:
        if (startHere != null) {
            // If a block to start from was passed, find its
            // associated turtle, i.e., which turtle should we use?
            var turtle = 0;
            while (this.turtles.turtleList[turtle].trash && turtle < this.turtles.turtleList.length) {
                turtle += 1;
            }

            if (['start', 'drum'].indexOf(this.blocks.blockList[startHere].name) !== -1) {
                turtle = this.blocks.blockList[startHere].value;
            }

            this.turtles.turtleList[turtle].queue = [];
            this.parentFlowQueue[turtle] = [];
            this.unhighlightQueue[turtle] = [];
            this.parameterQueue[turtle] = [];
            this.turtles.turtleList[turtle].running = true;
            this._runFromBlock(this, turtle, startHere, 0, env);
        } else if (startBlocks.length > 0) {
            var delayStart = 0;
            // Look for a status block
            for (var b = 0; b < startBlocks.length; b++) {
                if (this.blocks.blockList[startBlocks[b]].name === 'status'  && !this.blocks.blockList[startBlocks[b]].trash) {
                    var turtle = 0;
                    this.turtles.turtleList[turtle].queue = [];
                    this.parentFlowQueue[turtle] = [];
                    this.unhighlightQueue[turtle] = [];
                    this.parameterQueue[turtle] = [];
                    this.turtles.turtleList[turtle].running = true;
                    delayStart = 250;
                    this._runFromBlock(this, turtle, startBlocks[b], 0, env);
                }
            }

            var that = this;

            setTimeout(function () {
                if (delayStart !== 0) {
                    // Launching status block would have hidden the
                    // Stop Button so show it again.
                    that.onRunTurtle();
                }

                // If there are start blocks, run them all.
                for (var b = 0; b < startBlocks.length; b++) {
                    if (that.blocks.blockList[startBlocks[b]].name !== 'status') {
                        var turtle = that.blocks.blockList[startBlocks[b]].value;
                        that.turtles.turtleList[turtle].queue = [];
                        that.parentFlowQueue[turtle] = [];
                        that.unhighlightQueue[turtle] = [];
                        that.parameterQueue[turtle] = [];
                        if (!that.turtles.turtleList[turtle].trash) {
                            that.turtles.turtleList[turtle].running = true;
                            that._runFromBlock(that, turtle, startBlocks[b], 0, env);
                        }
                    }
                }
            }, delayStart);
        } else {
            console.log('Empty start block: ' + turtle + ' ' + this.suppressOutput[turtle]);
            if (this.suppressOutput[turtle] || this.suppressOutput[turtle] == undefined) {
                this.errorMsg(NOACTIONERRORMSG, null, _('start'));
                this.suppressOutput[turtle] = false;
                this.checkingCompletionState = false;
                // Reset cursor.
                document.body.style.cursor = 'default';
            }
        }

        this.refreshCanvas();
    };

    this._runFromBlock = function (that, turtle, blk, isflow, receivedArg) {
        if (blk == null) {
            return;
        }

        var logo = that;  // For plugin backward compatibility

        this.receivedArg = receivedArg;

        var delay = that.turtleDelay + that.waitTimes[turtle];
        that.waitTimes[turtle] = 0;

        if (!that.stopTurtle) {
            if (that.turtleDelay === TURTLESTEP) {
                // Step mode
                if (!(turtle in that.stepQueue)) {
                    that.stepQueue[turtle] = [];
                }
                that.stepQueue[turtle].push(blk);
            } else {
                setTimeout(function () {
                    that._runFromBlockNow(that, turtle, blk, isflow, receivedArg);
                }, delay);
            }
        }
    };

    this._blockSetter = function (blk, value, turtle) {
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
            var name = this.parseArg(this, turtle, cblk, blk, this.receivedArg);
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
        case 'mypitch':
            var obj = numberToPitch(value + this.pitchNumberOffset);
            this.lastNotePlayed[turtle] = [obj[0] + obj[1], this.lastNotePlayed[turtle][1]];
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
        case 'notevolumefactor':  // master volume
            var len = this.masterVolume.length;
            this.masterVolume[len - 1] = value;
            if (!this.suppressOutput[turtle]) {
                this._setMasterVolume(value);
            }

            if (!this.justCounting[turtle]) {
                this.playbackQueue[turtle].push([this.previousTurtleTime[turtle], 'setvolume', value]);
            }
            break;
        default:
            if (this.blocks.blockList[blk].name in this.evalSetterDict) {
                eval(this.evalSetterDict[this.blocks.blockList[blk].name]);
                break;
            }
            this.errorMsg(_('Block does not support incrementing.'), blk);
        }
    };


    this._runFromBlockNow = function (that, turtle, blk, isflow, receivedArg, queueStart) {
        // Run a stack of blocks, beginning with blk.
        var logo = that;  // For plugin backward compatibility
        this.receivedArg = receivedArg;

        // Sometimes we don't want to unwind the entire queue.
        if (queueStart === undefined) {
            queueStart = 0;
        }

        // (1) Evaluate any arguments (beginning with connection[1]);
        var args = [];
        if (that.blocks.blockList[blk].protoblock.args > 0) {
            for (var i = 1; i < that.blocks.blockList[blk].protoblock.args + 1; i++) {
                if (that.blocks.blockList[blk].protoblock.dockTypes[i] === 'in' && that.blocks.blockList[blk].connections[i] == null) {
                    console.log('skipping null inflow args');
                } else {
                    args.push(that.parseArg(that, turtle, that.blocks.blockList[blk].connections[i], blk, receivedArg));
                }
            }
        }

        // (2) Run function associated with the block;
        if (that.blocks.blockList[blk].isValueBlock()) {
            var nextFlow = null;
        } else {
            // All flow blocks have a last connection (nextFlow), but
            // it can be null (i.e., end of a flow).
            if (that.backward[turtle].length > 0) {
                // We only run backwards in the "first generation" children.
                if (that.blocks.blockList[last(that.backward[turtle])].name === 'backward') {
                    var c = 1;
                } else {
                    var c = 2;
                }

                if (!that.blocks.sameGeneration(that.blocks.blockList[last(that.backward[turtle])].connections[c], blk)) {
                    var nextFlow = last(that.blocks.blockList[blk].connections);
                } else {
                    var nextFlow = that.blocks.blockList[blk].connections[0];
                    if (that.blocks.blockList[nextFlow].name === 'action' || that.blocks.blockList[nextFlow].name === 'backward') {
                        nextFlow = null;
                    } else {
                        if (!that.blocks.sameGeneration(that.blocks.blockList[last(that.backward[turtle])].connections[c], nextFlow)) {
                            var nextFlow = last(that.blocks.blockList[blk].connections);
                        } else {
                            var nextFlow = that.blocks.blockList[blk].connections[0];
                        }
                    }
                }
            } else {
                var nextFlow = last(that.blocks.blockList[blk].connections);
            }

            if (nextFlow === -1) {
                nextFlow = null;
            }

            var queueBlock = new Queue(nextFlow, 1, blk, receivedArg);
            if (nextFlow != null) {  // This could be the last block
                that.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }

        // Some flow blocks have childflows, e.g., repeat.
        var childFlow = null;
        var childFlowCount = 0;
        var actionArgs = [];

        if (that.blocks.visible) {
            if (!that.suppressOutput[turtle] && !that.justCounting[turtle]) {
                that.blocks.highlight(blk, false);
            }
        }

        switch (that.blocks.blockList[blk].name) {
        case 'dispatch':
            // Dispatch an event.
            if (args.length === 1) {
                // If the event is not in the event list, add it.
                if (!(args[0] in that.eventList)) {
                    var event = new Event(args[0]);
                    that.eventList[args[0]] = event;
                }
                that.stage.dispatchEvent(args[0]);
            }
            break;
        case 'listen':
            if (args.length === 2) {
                if (!(args[1] in that.actions)) {
                    that.errorMsg(NOACTIONERRORMSG, blk, args[1]);
                    that.stopTurtle = true;
                } else {
                    var __listener = function (event) {
                        if (that.turtles.turtleList[turtle].running) {
                            var queueBlock = new Queue(that.actions[args[1]], 1, blk);
                            that.parentFlowQueue[turtle].push(blk);
                            that.turtles.turtleList[turtle].queue.push(queueBlock);
                        } else {
                            // Since the turtle has stopped
                            // running, we need to run the stack
                            // from here.
                            if (isflow) {
                                that._runFromBlockNow(that, turtle, that.actions[args[1]], isflow, receivedArg);
                            } else {
                                that._runFromBlock(that, turtle, that.actions[args[1]], isflow, receivedArg);
                            }
                        }
                    };

                    // If there is already a listener, remove it
                    // before adding the new one.
                    that._setListener(turtle, args[0], __listener);
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
            var name = that.blocks.blockList[blk].privateData;
            if (name in that.actions) {
                if (!that.justCounting[turtle]) {
                    that.notationLineBreak(turtle);
                }

                if (that.backward[turtle].length > 0) {
                    childFlow = that.blocks.findBottomBlock(that.actions[name]);
                    var actionBlk = that.blocks.findTopBlock(that.actions[name]);
                    that.backward[turtle].push(actionBlk);

                    var listenerName = '_backward_action_' + turtle + '_' + blk;
                    that._setDispatchBlock(blk, turtle, listenerName);

                    var nextBlock = that.blocks.blockList[actionBlk].connections[2];
                    if (nextBlock == null) {
                        that.backward[turtle].pop();
                    } else {
                        if (nextBlock in that.endOfClampSignals[turtle]) {
                            that.endOfClampSignals[turtle][nextBlock].push(listenerName);
                        } else {
                            that.endOfClampSignals[turtle][nextBlock] = [listenerName];
                        }
                    }

                    var __listener = function (event) {
                        that.backward[turtle].pop();
                    };

                    that._setListener(turtle, listenerName, __listener);
                } else {
                    childFlow = that.actions[name];
                }

                childFlowCount = 1;
            } else {
                that.errorMsg(NOACTIONERRORMSG, blk, name);
                that.stopTurtle = true;
            }
            break;
            // If we clicked on an action block, treat it like a do
            // block.
        case 'action':
        case 'do':
            if (args.length > 0) {
                if (args[0] in that.actions) {
                    if (!that.justCounting[turtle]) {
                        that.notationLineBreak(turtle);
                    }
                    childFlow = that.actions[args[0]];
                    childFlowCount = 1;
                } else {
                    console.log('action ' + args[0] + ' not found');
                    that.errorMsg(NOACTIONERRORMSG, blk, args[0]);
                    that.stopTurtle = true;
                }
            }
            break;
        case 'nameddoArg':
            var name = that.blocks.blockList[blk].privateData;
            while(actionArgs.length > 0) {
                actionArgs.pop();
            }
            if (that.blocks.blockList[blk].argClampSlots.length > 0) {
                for (var i = 0; i < that.blocks.blockList[blk].argClampSlots.length; i++) {
                    var t = (that.parseArg(that, turtle, that.blocks.blockList[blk].connections[i + 1], blk, receivedArg));
                    actionArgs.push(t);
                }
            }
            if (name in that.actions) {
                if (!that.justCounting[turtle]) {
                    that.notationLineBreak(turtle);
                }

                if (that.backward[turtle].length > 0) {
                    childFlow = that.blocks.findBottomBlock(that.actions[name]);
                    var actionBlk = that.blocks.findTopBlock(that.actions[name]);
                    that.backward[turtle].push(actionBlk);

                    var listenerName = '_backward_action_' + turtle + '_' + blk;
                    that._setDispatchBlock(blk, turtle, listenerName);

                    var nextBlock = that.blocks.blockList[actionBlk].connections[2];
                    if (nextBlock == null) {
                        that.backward[turtle].pop();
                    } else {
                        if (nextBlock in that.endOfClampSignals[turtle]) {
                            that.endOfClampSignals[turtle][nextBlock].push(listenerName);
                        } else {
                            that.endOfClampSignals[turtle][nextBlock] = [listenerName];
                        }
                    }

                    var __listener = function (event) {
                        that.backward[turtle].pop();
                    };

                    that._setListener(turtle, listenerName, __listener);
                } else {
                    childFlow = that.actions[name]
                }

                childFlowCount = 1;
            } else{
                that.errorMsg(NOACTIONERRORMSG, blk, name);
                that.stopTurtle = true;
            }
            break;
        case 'doArg':
            while(actionArgs.length > 0) {
                actionArgs.pop();
            }
            if (that.blocks.blockList[blk].argClampSlots.length > 0) {
                for (var i = 0; i < that.blocks.blockList[blk].argClampSlots.length; i++) {
                    var t = (that.parseArg(that, turtle, that.blocks.blockList[blk].connections[i + 2], blk, receivedArg));
                    actionArgs.push(t);
                }
            }
            if (args.length >= 1) {
                if (args[0] in that.actions) {
                    if (!that.justCounting[turtle]) {
                        that.notationLineBreak(turtle);
                    }
                    actionName = args[0];
                    childFlow = that.actions[args[0]];
                    childFlowCount = 1;
                } else {
                    that.errorMsg(NOACTIONERRORMSG, blk, args[0]);
                    that.stopTurtle = true;
                }
            }
            break;
        case 'forever':
            if (args.length === 1) {
                childFlow = args[0];
                // If we are running in non-interactive mode, we
                // need to put a bounds on "forever".
                if (that.suppressOutput[turtle]) {
                    childFlowCount = 20;
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
            that._doBreak(turtle);
            // Since we pop the queue, we need to unhighlight our
            // parent.
            var parentBlk = that.blocks.blockList[blk].connections[0];
            if (parentBlk != null) {
                if (!that.suppressOutput[turtle] && !that.justCounting[turtle]) {
                    that.unhighlightQueue[turtle].push(parentBlk);
                }
            }
            break;
        case 'wait':
            if (args.length === 1) {
                that._doWait(turtle, args[0]);
            }
            break;
        case 'print':
            if (!that.inStatusMatrix) {
                if (args.length === 1) {
                    if (args[0] !== null) {
                        if (that.inNoteBlock[turtle].length > 0) {
                            that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                        } else {
                            if (!that.suppressOutput[turtle]) {
                                that.textMsg(args[0].toString());
                            }

                            if (!that.justCounting[turtle]) {
                                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'print', args[0]]);
                            }
                        }
                    }
                }
            }
            break;
        case 'speak':
            if (args.length === 1) {
                if (that.meSpeak) {
                    if (that.inNoteBlock[turtle].length > 0) {
                        that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                    } else {
                        if (!that.suppressOutput[turtle]) {
                            that._processSpeak(args[0]);
                        }

                        if (!that.justCounting[turtle]) {
                            that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'speak', args[0]]);
                        }
                    }
                }
            }
            break;
        case 'repeat':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (args[0] <= 0) {
                    that.errorMsg(POSNUMBER,blk);
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
                    var queueLength = that.turtles.turtleList[turtle].queue.length;
                    if (queueLength > 0) {
                        if (that.turtles.turtleList[turtle].queue[queueLength - 1].parentBlk === blk) {
                            that.turtles.turtleList[turtle].queue.pop();
                        }
                    }
                    // Requeue.
                    var parentBlk = that.blocks.blockList[blk].connections[0];
                    var queueBlock = new Queue(blk, 1, parentBlk);
                    that.parentFlowQueue[turtle].push(parentBlk);
                    that.turtles.turtleList[turtle].queue.push(queueBlock);
                } else {
                    // Since an until block was requeued each
                    // time, we need to flush the queue of all but
                    // the last one, otherwise the child of the
                    // until block is executed multiple times.
                    var queueLength = that.turtles.turtleList[turtle].queue.length;
                    for (var i = queueLength - 1; i > 0; i--) {
                        if (that.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                            that.turtles.turtleList[turtle].queue.pop();
                        }
                    }
                }
            }
            break;
        case 'movable':
            if (args.length === 1) {
                that.movable = args[0];
            }
            break;
        case 'waitFor':
            if (args.length === 1) {
                if (!args[0]) {
                    // Requeue.
                    var parentBlk = that.blocks.blockList[blk].connections[0];
                    var queueBlock = new Queue(blk, 1, parentBlk);
                    that.parentFlowQueue[turtle].push(parentBlk);
                    that.turtles.turtleList[turtle].queue.push(queueBlock);
                    that._doWait(0.05);
                } else {
                    // Since a wait for block was requeued each
                    // time, we need to flush the queue of all but
                    // the last one, otherwise the child of the
                    // while block is executed multiple times.
                    var queueLength = that.turtles.turtleList[turtle].queue.length;
                    for (var i = queueLength - 1; i > 0; i--) {
                        if (that.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                            that.turtles.turtleList[turtle].queue.pop();
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
                    var queueLength = that.turtles.turtleList[turtle].queue.length;
                    if (queueLength > 0) {
                        if (that.turtles.turtleList[turtle].queue[queueLength - 1].parentBlk === blk) {
                            that.turtles.turtleList[turtle].queue.pop();
                        }
                    }

                    var parentBlk = that.blocks.blockList[blk].connections[0];
                    var queueBlock = new Queue(blk, 1, parentBlk);
                    that.parentFlowQueue[turtle].push(parentBlk);
                    that.turtles.turtleList[turtle].queue.push(queueBlock);

                    // and queue the interior child flow.
                    childFlow = args[1];
                    childFlowCount = 1;
                } else {
                    // Since a while block was requeued each time,
                    // we need to flush the queue of all but the
                    // last one, otherwise the child of the while
                    // block is executed multiple times.
                    var queueLength = that.turtles.turtleList[turtle].queue.length;
                    for (var i = queueLength - 1; i > 0; i--) {
                        if (that.turtles.turtleList[turtle].queue[i].parentBlk === blk) {
                            // if (that.turtles.turtleList[turtle].queue[i].blk === blk) {
                            that.turtles.turtleList[turtle].queue.pop();
                        }
                    }
                }
            }
            break;
        case 'storein':
            if (args.length === 2) {
                that.boxes[args[0]] = args[1];
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
                var settingBlk = that.blocks.blockList[blk].connections[1];
                that._blockSetter(settingBlk, args[0] + i, turtle);
            }
            break;
        case 'clear':
            if (that.inMatrix) {
                // ignore clear block in matrix
            } else if (that.inNoteBlock[turtle].length > 0) {
                that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
            } else {
                if (that.suppressOutput[turtle]) {
                    var savedPenState = that.turtles.turtleList[turtle].penState;
                    that.turtles.turtleList[turtle].penState = false;
                    that.turtles.turtleList[turtle].doSetXY(0, 0);
                    that.turtles.turtleList[turtle].doSetHeading(0);
                    that.turtles.turtleList[turtle].penState = savedPenState;
                } else {
                    that.svgBackground = true;
                    that.turtles.turtleList[turtle].doClear(true, true, true);
                }

                if (!that.justCounting[turtle]) {
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'clear']);
                }
            }
            break;
        case 'setxy':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push([args[0], args[1]]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    if (that.suppressOutput[turtle]) {
                        var savedPenState = that.turtles.turtleList[turtle].penState;
                        that.turtles.turtleList[turtle].penState = false;
                        that.turtles.turtleList[turtle].doSetXY(args[0], args[1]);
                        that.turtles.turtleList[turtle].penState = savedPenState;
                    } else {
                        that.turtles.turtleList[turtle].doSetXY(args[0], args[1]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setxy', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'arc':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push([args[0], args[1]]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    if (that.suppressOutput[turtle]) {
                        var savedPenState = that.turtles.turtleList[turtle].penState;
                        that.turtles.turtleList[turtle].penState = false;
                        that.turtles.turtleList[turtle].doArc(args[0], args[1]);
                        that.turtles.turtleList[turtle].penState = savedPenState;
                    } else {
                        that.turtles.turtleList[turtle].doArc(args[0], args[1]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'arc', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'bezier':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    if (that.suppressOutput[turtle]) {
                        var savedPenState = that.turtles.turtleList[turtle].penState;
                        that.turtles.turtleList[turtle].penState = false;
                        that.turtles.turtleList[turtle].doBezier(that.cp1x[turtle], that.cp1y[turtle], that.cp2x[turtle], that.cp2y[turtle], args[0], args[1]);
                        that.turtles.turtleList[turtle].penState = savedPenState;
                    } else {
                        that.turtles.turtleList[turtle].doBezier(that.cp1x[turtle], that.cp1y[turtle], that.cp2x[turtle], that.cp2y[turtle], args[0], args[1]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'bezier', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'controlpoint1':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.cp1x[turtle] = args[0];
                    that.cp1y[turtle] = args[1];
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'controlpoint1', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'controlpoint2':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.cp2x[turtle] = args[0];
                    that.cp2y[turtle] = args[1];
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'controlpoint2', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'return':
            if (args.length === 1) {
                that.returns.push(args[0]);
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
                xmlHttp.onreadystatechange = function () {
                    if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                        alert(xmlHttp.responseText);
                    }
                };

                xmlHttp.send(json);
            }
            break;
        case 'forward':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    if (that.suppressOutput[turtle]) {
                        var savedPenState = that.turtles.turtleList[turtle].penState;
                        that.turtles.turtleList[turtle].penState = false;
                        that.turtles.turtleList[turtle].doForward(args[0]);
                        that.turtles.turtleList[turtle].penState = savedPenState;
                    } else {
                        that.turtles.turtleList[turtle].doForward(args[0]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'forward', args[0]]);
                    }
                }
            }
            break;
        case 'back':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    if (that.suppressOutput[turtle]) {
                        var savedPenState = that.turtles.turtleList[turtle].penState;
                        that.turtles.turtleList[turtle].penState = false;
                        that.turtles.turtleList[turtle].doForward(-args[0]);
                        that.turtles.turtleList[turtle].penState = savedPenState;
                    } else {
                        that.turtles.turtleList[turtle].doForward(-args[0]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'forward', -args[0]]);
                    }
                }
            }
            break;
        case 'right':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    if (that.suppressOutput[turtle]) {
                        var savedPenState = that.turtles.turtleList[turtle].penState;
                        that.turtles.turtleList[turtle].penState = false;
                        that.turtles.turtleList[turtle].doRight(args[0]);
                        that.turtles.turtleList[turtle].penState = savedPenState;
                    } else {
                        that.turtles.turtleList[turtle].doRight(args[0]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'right', args[0]]);
                    }
                }
            }
            break;
        case 'left':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    if (that.suppressOutput[turtle]) {
                        var savedPenState = that.turtles.turtleList[turtle].penState;
                        that.turtles.turtleList[turtle].penState = false;
                        that.turtles.turtleList[turtle].doRight(-args[0]);
                        that.turtles.turtleList[turtle].penState = savedPenState;
                    } else {
                        that.turtles.turtleList[turtle].doRight(-args[0]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'right', -args[0]]);
                    }
                }
            }
            break;
        case 'setheading':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.turtles.turtleList[turtle].doSetHeading(args[0]);
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setheading', args[0]]);
                    }
                }
            }
            break;
        case 'show':
            if (args.length === 2) {
                if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    if (!that.suppressOutput[turtle]) {
                        that._processShow(turtle, args[0], args[1]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'show', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'turtleshell':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else {
                    that.turtles.turtleList[turtle].doTurtleShell(args[0], args[1]);
                }
            }
            break;
        case 'setturtlename':
            var foundTargetTurtle = false;
            if (args[0] === -1) {
                that.turtles.turtleList[turtle].rename(args[1]);
                foundTargetTurtle = true;
            } else if (typeof(args[0]) === 'number') {
                var i = Math.floor(args[0]);
                if (i >= 0 && i <  that.turtles.turtleList.length) {
                    that.turtles.turtleList[i].rename(args[1]);
                    foundTargetTurtle = true;
                }
            } else {
                for (var i = 0; i < that.turtles.turtleList.length; i++) {
                    if (that.turtles.turtleList[i].name === args[0]) {
                        that.turtles.turtleList[i].rename(args[1]);
                        foundTargetTurtle = true;
                        break;
                    }
                }
            }

            if (!foundTargetTurtle) {
                that.errorMsg('Could not find mouse ' + args[0], blk);
                that.turtles.turtleList[turtle].rename(args[1]);
            }
            break;
        case 'setturtlename2':
            if (args[0] != null) {
                that.turtles.turtleList[turtle].rename(args[0]);
            }
            break;
        case 'startTurtle':
            var targetTurtle = that._getTargetTurtle(args);
            if (targetTurtle == null) {
                that.errorMsg('Cannot find mouse: ' + args[0], blk)
            } else {
                if (that.turtles.turtleList[targetTurtle].running) {
                    that.errorMsg('Turtle is already running.', blk);
                    break;
                }
                that.turtles.turtleList[targetTurtle].queue = [];
                that.turtles.turtleList[targetTurtle].running = true;
                that.parentFlowQueue[targetTurtle] = [];
                that.unhighlightQueue[targetTurtle] = [];
                that.parameterQueue[targetTurtle] = [];
                // Find the start block associated with this turtle.
                var foundStartBlock = false;
                for (var i = 0; i < that.blocks.blockList.length; i++) {
                    if (that.blocks.blockList[i] === that.turtles.turtleList[targetTurtle].startBlock) {
                        foundStartBlock = true;
                        break;
                    }
                }
                if (foundStartBlock) {
                    that._runFromBlock(that, targetTurtle, i, isflow, receivedArg);
                } else {
                    that.errorMsg('Cannot find start block for turtle: ' + args[0], blk)
                }
            }
            break;
        case 'stopTurtle':
            var targetTurtle = that._getTargetTurtle(args);
            if (targetTurtle == null) {
                that.errorMsg('Cannot find mouse: ' + args[0], blk)
            } else {
                that.turtles.turtleList[targetTurtle].queue = [];
                that.parentFlowQueue[targetTurtle] = [];
                that.unhighlightQueue[targetTurtle] = [];
                that.parameterQueue[targetTurtle] = [];
                console.log('stopping ' + targetTurtle);
                that._doBreak(targetTurtle);
            }
            break;
        case 'turtlesync':
            var targetTurtle = that._getTargetTurtle(args);
            if (targetTurtle == null) {
                that.errorMsg('Cannot find mouse: ' + args[0], blk)
            } else {
                that.turtleTime[turtle] = that.turtleTime[targetTurtle];
            }
            break;
        case 'setcolor':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.turtles.turtleList[turtle].doSetColor(args[0]);
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setcolor', args[0]]);
                    }
                }
            }
            break;
        case 'setfont':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.turtles.turtleList[turtle].doSetFont(args[0]);
                } else {
                    that.errorMsg(NOSTRINGERRORMSG, blk);
                    that.stopTurtle = true;
                }
            }
            break;
        case 'sethue':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.turtles.turtleList[turtle].doSetHue(args[0]);
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'sethue', args[0]]);
                    }
                }
            }
            break;
        case 'setshade':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.turtles.turtleList[turtle].doSetValue(args[0]);
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setshade', args[0]]);
                    }
                }
            }
            break;
        case 'settranslucency':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    args[0] %= 101;
                    var alpha = 1.0 - (args[0] / 100);
                    that.turtles.turtleList[turtle].doSetPenAlpha(alpha);
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'settranslucency', args[0]]);
                    }
                }
            }
            break;
        case 'setgrey':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.turtles.turtleList[turtle].doSetChroma(args[0]);
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setgrey', args[0]]);
                    }
                }
            }
            break;
        case 'setpensize':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.turtles.turtleList[turtle].doSetPensize(args[0]);
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setpensize', args[0]]);
                    }
                }
            }
            break;
        case 'fill':
            if (that.inNoteBlock[turtle].length > 0) {
                that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
            } else {
                if (that.suppressOutput[turtle]) {
                    var savedPenState = that.turtles.turtleList[turtle].penState;
                    that.turtles.turtleList[turtle].penState = false;
                    that.turtles.turtleList[turtle].doStartFill();
                    that.turtles.turtleList[turtle].penState = savedPenState;
                } else {
                    that.turtles.turtleList[turtle].doStartFill();
                }

                if (!that.justCounting[turtle]) {
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'fill']);
                }
            }

            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_fill_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    if (that.suppressOutput[turtle]) {
                        var savedPenState = that.turtles.turtleList[turtle].penState;
                        that.turtles.turtleList[turtle].penState = false;
                        that.turtles.turtleList[turtle].doEndFill();
                        that.turtles.turtleList[turtle].penState = savedPenState;
                    } else {
                        that.turtles.turtleList[turtle].doEndFill();
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'fill']);
                    }
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
            // Deprecated
        case 'beginfill':
            that.turtles.turtleList[turtle].doStartFill();
            break;
            // Deprecated
        case 'endfill':
            that.turtles.turtleList[turtle].doEndFill();
            break;
        case 'hollowline':
            if (that.inNoteBlock[turtle].length > 0) {
                that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
            } else {
                that.turtles.turtleList[turtle].doStartHollowLine();
                if (!that.justCounting[turtle]) {
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'hollowline']);
                }
            }

            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_hollowline_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.turtles.turtleList[turtle].doEndHollowLine();
                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'hollowline']);
                    }
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
            // Deprecated
        case 'beginhollowline':
            that.turtles.turtleList[turtle].doStartHollowLine();
            break;
            // Deprecated
        case 'endhollowline':
            that.turtles.turtleList[turtle].doEndHollowLine();
            break;
        case 'fillscreen':
            if (args.length === 3) {
                var hue = that.turtles.turtleList[turtle].color;
                var value = that.turtles.turtleList[turtle].value;
                var chroma = that.turtles.turtleList[turtle].chroma;
                that.turtles.turtleList[turtle].doSetHue(args[0]);
                that.turtles.turtleList[turtle].doSetValue(args[1]);
                that.turtles.turtleList[turtle].doSetChroma(args[2]);
                that.setBackgroundColor(turtle);
                that.turtles.turtleList[turtle].doSetHue(hue);
                that.turtles.turtleList[turtle].doSetValue(value);
                that.turtles.turtleList[turtle].doSetChroma(chroma);
            }
            break;
        case 'nobackground':
            that.svgBackground = false;
            break;
        case 'background':
            that.setBackgroundColor(turtle);
            break;
        case 'penup':
            if (that.inNoteBlock[turtle].length > 0) {
                that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
            } else {
                that.turtles.turtleList[turtle].doPenUp();
                if (!that.justCounting[turtle]) {
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'penup']);
                }
            }
            break;
        case 'pendown':
            if (that.inNoteBlock[turtle].length > 0) {
                that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
            } else {
                that.turtles.turtleList[turtle].doPenDown();
                if (!that.justCounting[turtle]) {
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'pendown']);
                }
            }
            break;
        case 'openProject':
            url = args[0];

            function ValidURL(str) {
                var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                                         '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                                         '((\\d{1,3}\\.) {3}\\d{1,3}))'+ // OR ip (v4) address
                                         '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                                         '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                                         '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
                if (!pattern.test(str)) {
                    that.errorMsg('Please enter a valid URL.');
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
            that.sounds.push(sound);
            sound.play();
            break;
        case 'stopplayback':
            for (var sound in that.sounds) {
                that.sounds[sound].stop();
            }
            that.sounds = [];
            break;
        case 'stopvideocam':
            if (cameraID != null) {
                doStopVideoCam(that.cameraID, that.setCameraID);
            }
            break;
        case 'showblocks':
            that.showBlocks();
            that.setTurtleDelay(DEFAULTDELAY);
            break;
        case 'hideblocks':
            that.hideBlocks();
            that.setTurtleDelay(0);
            break;
        case 'savesvg':
            if (args.length === 1) {
                if (that.svgBackground) {
                    that.svgOutput = '<rect x="0" y="0" height="' + that.canvas.height + '" width="' + that.canvas.width + '" fill="' + body.style.background + '"/> ' + that.svgOutput;
                }
                doSaveSVG(that, args[0]);
            }
            break;
        case 'showHeap':
            if (!(turtle in that.turtleHeaps)) {
                that.turtleHeaps[turtle] = [];
            }
            that.textMsg(JSON.stringify(that.turtleHeaps[turtle]));
            break;
        case 'emptyHeap':
            that.turtleHeaps[turtle] = [];
            break;
        case 'push':
            if (args.length === 1) {
                if (!(turtle in that.turtleHeaps)) {
                    that.turtleHeaps[turtle] = [];
                }
                that.turtleHeaps[turtle].push(args[0]);
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

            if (args[0] && turtle in that.turtleHeaps) {
                downloadFile(args[0], 'text/json', JSON.stringify(that.turtleHeaps[turtle]));
            }
            break;
        case 'loadHeap':
            var block = that.blocks.blockList[blk];
            if (turtle in that.turtleHeaps) {
                var oldHeap = that.turtleHeaps[turtle];
            } else {
                var oldHeap = [];
            }
            var c = block.connections[1];
            if (c != null && that.blocks.blockList[c].name === 'loadFile') {
                if (args.length !== 1) {
                    that.errorMsg(_('You must select a file.'));
                } else {
                    try {
                        that.turtleHeaps[turtle] = JSON.parse(that.blocks.blockList[c].value[1]);
                        if (!Array.isArray(that.turtleHeaps[turtle])) {
                            throw 'is not array';
                        }
                    } catch (e) {
                        that.turtleHeaps[turtle] = oldHeap;
                        that.errorMsg(_('The file you selected does not contain a valid heap.'));
                    }
                }
            } else {
                that.errorMsg(_('The loadHeap block needs a loadFile block.'))
            }
            break;
        case 'loadHeapFromApp':
            var data = [];
            var url = args[1];
            var name = args [0]
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open('GET', url, false );
            xmlHttp.send();
            if (xmlHttp.readyState === 4  && xmlHttp.status === 200) {
                console.log(xmlHttp.responseText);
                try {
                    var data = JSON.parse(xmlHttp.responseText);
                } catch (e) {
                    console.log(e);
                    that.errorMsg(_('Error parsing JSON data:') + e);
                }
            }
            else if (xmlHttp.readyState === 4 && xmlHttp.status !== 200) {
                console.log('fetched the wrong page or network error...');
                that.errorMsg(_('404: Page not found'));
                break;
            }
            else {
                that.errorMsg('xmlHttp.readyState: ' + xmlHttp.readyState);
                break;
            }
            if (name in that.turtleHeaps) {
                var oldHeap = turtleHeaps[turtle];
            } else {
                var oldHeap = [];
            }
            that.turtleHeaps[name] = data;
            break;
        case 'saveHeapToApp':
            var name = args[0];
            var url = args[1];
            if (name in that.turtleHeaps) {
                var data = JSON.stringify(that.turtleHeaps[name]);
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open('POST', url, true);
                xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                xmlHttp.send(data);
            } else {
                that.errorMsg(_('turtleHeaps does not contain a valid heap for') + ' ' + name);
            }
            break;
        case 'setHeapEntry':
            if (args.length === 2) {
                if (!(turtle in that.turtleHeaps)) {
                    that.turtleHeaps[turtle] = [];
                }
                var idx = Math.floor(args[0]);
                if (idx < 1) {
                    that.errorMsg(_('Index must be > 0.'))
                }
                // If index > heap length, grow the heap.
                while (that.turtleHeaps[turtle].length < idx) {
                    that.turtleHeaps[turtle].push(null);
                }
                that.turtleHeaps[turtle][idx - 1] = args[1];
            }
            break;

            // Actions for music-related blocks
        case 'savelilypond':
            if (args.length === 1) {
                saveLilypondOutput(that, args[0]);
            }
            break;
        case 'amsynth':
            var harmonicity;
            that.timbre.AMSynthParams = [];
            if (that.timbre.osc.length != 0) {
                that.errorMsg(_("Unable to use synth due to existing oscillator"));
                //that.stopTurtle = true;
            }

            if (args.length === 1 && typeof(args[0]) === 'number') {
                if (args[0] < 0) {
                    that.errorMsg(_('The input cannot be negative.'));
                }
                harmonicity = args[0];
            }

            if (that.inTimbre) {
                that.timbre.amSynthParamvals['harmonicity'] = harmonicity;
                that.synth.createSynth(that.timbre.instrumentName, 'amsynth', that.timbre.amSynthParamvals);

                that.timbre.AMSynthesizer.push(blk);
                that.timbre.AMSynthParams.push(harmonicity);
            }
            break;
        case 'fmsynth':
            var modulationIndex;
            that.timbre.FMSynthParams = [];
            if (that.timbre.osc.length != 0) {
                that.errorMsg(_("Unable to use synth due to existing oscillator"));
                //that.stopTurtle = true;
            }
            if (args.length === 1 && typeof(args[0]) === 'number') {
                if (args[0] < 0) {
                    that.errorMsg(_('The input cannot be negative.'));
                }
                modulationIndex = args[0];
            }
            if (that.inTimbre) {
                that.timbre.fmSynthParamvals['modulationIndex'] = modulationIndex;
                that.synth.createSynth(that.timbre.instrumentName, 'fmsynth', that.timbre.fmSynthParamvals);

                that.timbre.FMSynthesizer.push(blk);
                that.timbre.FMSynthParams.push(modulationIndex);
            }
            break;
        case 'duosynth':
            var synthVibratoRate;
            var synthVibratoAmount;
            if (that.timbre.osc.length != 0) {
                that.errorMsg(_("Unable to use synth due to existing oscillator"));
            }

            that.timbre.duoSynthParams = [];
            if (args.length === 2 && typeof(args[0]) === 'number') {
                synthVibratoRate = args[0];
                synthVibratoAmount = args[1];
            }

            if (that.inTimbre) {
                that.timbre.duoSynthParamVals['vibratoRate'] = synthVibratoRate;
                that.timbre.duoSynthParamVals['vibratoAmount'] = synthVibratoAmount;
                that.synth.createSynth(that.timbre.instrumentName, 'duosynth', that.timbre.duoSynthParamVals);

                that.timbre.duoSynthesizer.push(blk);
                that.timbre.duoSynthParams.push(synthVibratoRate);
                that.timbre.duoSynthParams.push(synthVibratoAmount);
            }
            break;
        case 'saveabc':
            if (args.length === 1) {
                saveAbcOutput(that, args[0]);
            }
            break;
        case 'setmasterbpm':
            if (args.length === 1 && typeof(args[0] === 'number')) {
                if (args[0] < 30) {
                    that.errorMsg(_('Beats per minute must be > 30.'))
                    that._masterBPM = 30;
                } else if (args[0] > 1000) {
                    that.errorMsg(_('Maximum beats per minute is 1000.'))
                    that._masterBPM = 1000;
                } else {
                    that._masterBPM = args[0];
                }
                that.defaultBPMFactor = TONEBPM / that._masterBPM;
            }

            if (that.inTempo) {
                that.tempo.BPMBlocks.push(blk);
                var bpmnumberblock = that.blocks.blockList[blk].connections[1]
                that.tempo.BPMs.push(that.blocks.blockList[bpmnumberblock].text.text);
            }
            break;
        case 'setbpm':
            if (args.length === 2 && typeof(args[0] === 'number')) {
                if (args[0] < 30) {
                    that.errorMsg(_('Beats per minute must be > 30.'))
                    var bpm = 30;
                } else if (args[0] > 1000) {
                    that.errorMsg(_('Maximum beats per minute is 1000.'))
                    var bpm = 1000;
                } else {
                    var bpm = args[0];
                }

                that.bpm[turtle].push(bpm);

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_bpm_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.bpm[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
        // Deprecated
        case 'setkey':
            if (args.length === 1) {
                that.keySignature[turtle] = args[0];
            }
            break;
        case 'setkey2':
            if (args.length === 2) {
                var modename = 'major';
                for (var i = 0; i < MODENAMES.length; i++) {
                    if (MODENAMES[i][0] === args[1]) {
                        modename = MODENAMES[i][1];
                        that._modeBlock = that.blocks.blockList[blk].connections[2];
                        console.log(modename);
                        break;
                    }
                }
                that.keySignature[turtle] = args[0] + ' ' + modename;
            }
            break;
        case 'rhythmruler2':
        case 'rhythmruler':
            if (that.blocks.blockList[blk].name === 'rhythmruler') {
                childFlow = args[1];
            } else {
                childFlow = args[0];
            }

            childFlowCount = 1;

            if (that.rhythmRuler == null) {
                that.rhythmRuler = new RhythmRuler();
            }

            that.rhythmRuler.Rulers = [];
            that.rhythmRuler.Drums = [];
            that.inRhythmRuler = true;

            var listenerName = '_rhythmruler_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.rhythmRuler.init(that);
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'pitchstaircase':
            if (that.pitchStaircase == null) {
                that.pitchStaircase = new PitchStaircase();
            }

            that.pitchStaircase.Stairs = [];

            childFlow = args[0];
            childFlowCount = 1;
            that.inPitchStaircase = true;

            var listenerName = '_pitchstaircase_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.pitchStaircase.init(that);
                that.inPitchStaircase = false;
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'tempo':
            childFlow = args[0];
            childFlowCount = 1;

            if (that.tempo == null) {
                that.tempo = new Tempo();
            }

            that.inTempo = true;
            that.tempo.BPMblocks = [];
            that.tempo.BPMs = [];

            var listenerName = '_tempo_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.tempo.init(that);
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'pitchslider':
            if (that.pitchSlider == null) {
                that.pitchSlider = new PitchSlider();
            }

            that.pitchSlider.Sliders = [];

            childFlow = args[0];
            childFlowCount = 1;
            that.inPitchSlider = true;

            var listenerName = '_pitchslider_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.pitchSlider.init(that);
                that.inPitchSlider = false;
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'pitchdrummatrix':
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }

            if (that.pitchDrumMatrix == null) {
                that.pitchDrumMatrix = new PitchDrumMatrix();
            }

            that.inPitchDrumMatrix = true;
            that.pitchDrumMatrix.rowLabels = [];
            that.pitchDrumMatrix.rowArgs = [];
            that.pitchDrumMatrix.drums = [];
            that.pitchDrumMatrix.clearBlocks();

            var listenerName = '_pitchdrummatrix_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (that.pitchDrumMatrix.drums.length === 0 || that.pitchDrumMatrix.rowLabels.length === 0) {
                    that.errorMsg(_('You must have at least one pitch block and one drum block in the matrix.'), blk);
                } else {
                    // Process queued up rhythms.
                    that.pitchDrumMatrix.init(that);
                    that.pitchDrumMatrix.makeClickable();
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'timbre':
            if (that.timbre == null) {
                that.timbre = new TimbreWidget();
            }

            that.inTimbre = true;

            if (typeof(args[0]) === 'string') {
                // CLear out the instrument because we will recreate it in the widget.
                that.timbre.instrumentName = args[0];
                instrumentsEffects[that.timbre.instrumentName] = {};
                instrumentsEffects[that.timbre.instrumentName]['vibratoActive'] = false;
                instrumentsEffects[that.timbre.instrumentName]['distortionActive'] = false;
                instrumentsEffects[that.timbre.instrumentName]['tremoloActive'] = false;
                instrumentsEffects[that.timbre.instrumentName]['phaserActive'] = false;
                instrumentsEffects[that.timbre.instrumentName]['chorusActive'] = false;
                instrumentsFilters[that.timbre.instrumentName] = [];
            } else {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            childFlow = args[1];
            childFlowCount = 1;

            that.timbre.blockNo = blk;
            that.timbre.env = [];
            that.timbre.ENVs = [];
            that.timbre.fil = [];
            that.timbre.filterParams = [];
            that.timbre.osc = [];
            that.timbre.oscParams = [];
            that.timbre.tremoloEffect = [];
            that.timbre.tremoloParams = [];
            that.timbre.vibratoEffect = [];
            that.timbre.vibratoParams = [];
            that.timbre.chorusEffect = [];
            that.timbre.chorusParams = [];
            that.timbre.phaserEffect = [];
            that.timbre.phaserParams = [];
            that.timbre.distortionEffect = [];
            that.timbre.distortionParams = [];
            that.timbre.AMSynthesizer = [];
            that.timbre.AMSynthParams = [];
            that.timbre.FMSynthesizer = [];
            that.timbre.FMSynthParams = [];
            that.timbre.duoSynthesizer = [];
            that.timbre.duoSynthParams = [];
            that.timbre.notesToPlay = [];

            var listenerName = '_timbre_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.timbre.init(that);
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'modewidget':
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }

            if (that.modeWidget == null) {
                that.modeWidget = new ModeWidget();
            }

            var listenerName = '_modewidget_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                console.log(that.keySignature[turtle]);
                that.modeWidget.init(that, that._modeBlock);
            }

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'status':
            if (that.statusMatrix == null) {
                that.statusMatrix = new StatusMatrix();
            }

            that.statusMatrix.init(that);
            that.statusFields = [];
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }

            that.inStatusMatrix = true;

            var listenerName = '_status_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.statusMatrix.init(that);
                that.inStatusMatrix = false;
            }

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'matrix':
            if (args.length === 1) {
                childFlow = args[0];
                childFlowCount = 1;
            }

            that.inMatrix = true;

            if (that.pitchTimeMatrix == null) {
                that.pitchTimeMatrix = new PitchTimeMatrix();
            }

            that.pitchTimeMatrix.rowLabels = [];
            that.pitchTimeMatrix.rowArgs = [];
            that.pitchTimeMatrix.graphicsBlocks = [];
            that.pitchTimeMatrix.clearBlocks();

            that.tupletRhythms = [];
            that.tupletParams = [];
            that.addingNotesToTuplet = false;

            var listenerName = '_matrix_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (that.tupletRhythms.length === 0 || that.pitchTimeMatrix.rowLabels.length === 0) {
                    that.errorMsg(_('You must have at least one pitch block and one rhythm block in the matrix.'), blk);
                } else {
                    // Process queued up rhythms.
                    that.pitchTimeMatrix.init(that);

                    for (var i = 0; i < that.tupletRhythms.length; i++) {
                        // We have two cases: (1) notes in a tuplet;
                        // and (2) rhythm block outside of a
                        // tuplet. Rhythm blocks in a tuplet are
                        // converted to notes.
                        switch (that.tupletRhythms[i][0]) {
                        case 'notes':
                        case 'simple':
                            var tupletParam = [that.tupletParams[that.tupletRhythms[i][1]]];
                            tupletParam.push([]);
                            for (var j = 2; j < that.tupletRhythms[i].length; j++) {
                                tupletParam[1].push(that.tupletRhythms[i][j]);
                            }
                            that.pitchTimeMatrix.addTuplet(tupletParam);
                            break;
                        default:
                            that.pitchTimeMatrix.addNotes(that.tupletRhythms[i][1], that.tupletRhythms[i][2]);
                            break;
                        }
                    }

                    that.pitchTimeMatrix.makeClickable();
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'envelope':
            var synth_source = "sine";
            if (args.length === 4 && typeof(args[0] === 'number')) {
                if (args[0] < 0 || args[0] > 100) {
                    that.errorMsg(_('Attack value should be from 0 to 100.'));
                }
                if (args[1] < 0 || args[1] > 100) {
                    that.errorMsg(_('Decay value should be from 0 to 100.'));
                }
                if (args[2] < 0 || args[2] > 100) {
                    that.errorMsg(_('Sustain value should be from 0 to 100.'));
                }
                if (args[3] < 0 || args[3] > 100) {
                    that.errorMsg(_('Release value should be from 0-100.'));
                }

                that.attack[turtle].push(args[0] / 100);
                that.decay[turtle].push(args[1] / 100);
                that.sustain[turtle].push(args[2] / 100);
                that.release[turtle].push(args[3] / 100);
            }

            if (that.inTimbre) {
                that.timbre.synthVals['envelope']['attack'] = last(that.attack[turtle]);
                that.timbre.synthVals['envelope']['decay'] = last(that.decay[turtle]);
                that.timbre.synthVals['envelope']['sustain'] = last(that.sustain[turtle]);
                that.timbre.synthVals['envelope']['release'] = last(that.release[turtle]);

                if (that.timbre.env.length != 0) {
                    that.errorMsg(_("You are adding multiple envelope blocks."));
                } else {
                    // Create the synth for the instrument.
                    that.synth.createSynth(that.timbre.instrumentName, that.timbre.synthVals['oscillator']['source'], that.timbre.synthVals);
                }

                that.timbre.env.push(blk);
                that.timbre.ENVs.push(Math.round(last(that.attack[turtle]) * 100));
                that.timbre.ENVs.push(Math.round(last(that.decay[turtle]) * 100));
                that.timbre.ENVs.push(Math.round(last(that.sustain[turtle]) * 100));
                that.timbre.ENVs.push(Math.round(last(that.release[turtle]) * 100));
            }
            break;
        case 'filter':
            var filtertype = DEFAULTFILTERTYPE;
            var freq ;
            var rollOff ;

            if (args.length === 3 && typeof(args[1] === 'number')) {
                for (var ftype in FILTERTYPES) {
                    if (FILTERTYPES[ftype][0] === args[0]) {
                        filtertype = FILTERTYPES[ftype][1];
                    } else if (FILTERTYPES[ftype][1] === args[0]) {
                        filtertype = args[0];
                    }
                }

                if ([-12, -24, -48, -96].indexOf(args[1]) === -1) {
                    //.TRANS: rolloff is the steepness of a change in frequency.
                    that.errorMsg(_('Rolloff value should be either -12, -24, -48, or -96 decibels/octave.'));
                }

                rollOff = args[1];
                freq = args[2];

                if (that.inTimbre) {
                    if (!(that.timbre.instrumentName in instrumentsFilters)) {
                        instrumentsFilters[that.timbre.instrumentName] = [];
                    }
                    // Add the filter to the instrument
                    instrumentsFilters[that.timbre.instrumentName].push({'filterType': filtertype, 'filterRolloff': rollOff, 'filterFrequency': freq});

                    that.timbre.fil.push(blk);
                    that.timbre.filterParams.push(filtertype);
                    that.timbre.filterParams.push(rollOff);
                    that.timbre.filterParams.push(freq);
                }
            }
            break;
        case 'oscillator':
            var oscillatorType = DEFAULTOSCILLATORTYPE;
            var partials ;

            if (args.length === 2 && typeof(args[1] === 'number')) {
                for (var otype in OSCTYPES) {
                    if (OSCTYPES[otype][0] === args[0]) {
                        oscillatorType = OSCTYPES[otype][1];
                    } else if (OSCTYPES[otype][1] === args[0]) {
                        oscillatorType = args[0];
                    }
                }

                partials = args[1];
            }

            if (that.inTimbre) {
                if (that.timbre.osc.length != 0) {
                    that.errorMsg(_("You are adding multiple oscillator blocks."));
                } else {
                    that.timbre.oscParams = [];
                    that.synth.createSynth(that.timbre.instrumentName, oscillatorType, that.timbre.synthVals);
                }

                that.timbre.osc.push(blk);
                that.timbre.oscParams.push(oscillatorType);
                that.timbre.oscParams.push(partials);
            }
            break;
        case 'invert1':
            if (typeof(args[2]) === 'number') {
                if (args[2] % 2 === 0) {
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

            if (args[2] === 'even' || args[2] === 'odd') {
                var octave = calcOctave(that.currentOctaves[turtle], args[1]);
                that.invertList[turtle].push([args[0], octave, args[2]]);
            } else {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            childFlow = args[3];
            childFlowCount = 1;
            var listenerName = '_invert_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.invertList[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'switch':
            that.switchBlocks[turtle].push(blk);
            that.switchCases[turtle][blk] = [];

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_switch_' + blk + '_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                var switchBlk = last(that.switchBlocks[turtle]);
                // Run the cases here.
                var argBlk = that.blocks.blockList[switchBlk].connections[1];
                if (argBlk == null) {
                    var switchCase = '__default__';
                } else {
                    var switchCase = that.parseArg(that, turtle, argBlk, that.receievedArg);
                }

                var caseFlow = null;
                for (var i = 0; i < that.switchCases[turtle][switchBlk].length; i++) {
                    if (that.switchCases[turtle][switchBlk][i][0] === switchCase) {
                        caseFlow = that.switchCases[turtle][switchBlk][i][1];
                        break;
                    } else if (that.switchCases[turtle][switchBlk][i][0] === '__default__') {
                        caseFlow = that.switchCases[turtle][switchBlk][i][1];
                    }
                }

                if (caseFlow != null) {
                    var queueBlock = new Queue(caseFlow, 1, switchBlk, null);
                    that.parentFlowQueue[turtle].push(switchBlk);
                    that.turtles.turtleList[turtle].queue.push(queueBlock);
                }

                // Clean up afterward.
                that.switchCases[turtle][switchBlk] = [];
                that.switchBlocks[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'defaultcase':
        case 'case':
            var switchBlk = last(that.switchBlocks[turtle]);
            if (switchBlk === null) {
                that.errorMsg(_('The Case Block must be used inside of a Switch Block.'), blk);
                that.stopTurtle = true;
                break;
            }

            if (that.blocks.blockList[blk].name === 'defaultcase') {
                that.switchCases[turtle][switchBlk].push(['__default__', args[0]]);
            } else {
                that.switchCases[turtle][switchBlk].push([args[0], args[1]]);
            }
            break;
        case 'invert2':
        case 'invert':
            // Deprecated
            if (that.blocks.blockList[blk].name === 'invert') {
                that.invertList[turtle].push([args[0], args[1], 'even']);
            } else {
                that.invertList[turtle].push([args[0], args[1], 'odd']);
            }
            childFlow = args[2];
            childFlowCount = 1;

            var listenerName = '_invert_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.invertList[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'backward':
            that.backward[turtle].push(blk);
            // Set child to bottom block inside clamp
            childFlow = that.blocks.findBottomBlock(args[0]);
            childFlowCount = 1;

            var listenerName = '_backward_' + turtle + '_' + blk;
            that._setDispatchBlock(blk, turtle, listenerName);

            var nextBlock = that.blocks.blockList[blk].connections[2];
            if (nextBlock == null) {
                that.backward[turtle].pop();
            } else {
                if (nextBlock in that.endOfClampSignals[turtle]) {
                    that.endOfClampSignals[turtle][nextBlock].push(listenerName);
                } else {
                    that.endOfClampSignals[turtle][nextBlock] = [listenerName];
                }
            }

            var __listener = function (event) {
                that.backward[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'rest2':
            that.notePitches[turtle][last(that.inNoteBlock[turtle])].push('rest');
            that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(4);
            that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(0);
            that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(0);
            if (that.inNoteBlock[turtle].length > 0) {
                if (turtle in that.beatFactor) {
                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
                } else {
                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(1);
                }
            }

            that.pushedNote[turtle] = true;
            break;
        case 'steppitch':
            // Similar to pitch but calculated from previous note played.
            if (that.inNoteBlock[turtle].length === 0) {
                that.errorMsg(_('The Step Pitch Block must be used inside of a Note Block.'), blk);
                that.stopTurtle = true;
                break;
            }

            if (typeof(args[0]) !== 'number') {
                that.errorMsg(NANERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            // If we are just counting notes we don't care about the pitch.
            if (that.justCounting[turtle] && that.lastNotePlayed[turtle] == null) {
                console.log('Just counting, so spoofing last note played.');
                that.lastNotePlayed[turtle] = ['G4', 4];
            }

            if (that.lastNotePlayed[turtle] == null) {
                that.errorMsg('The Step Pitch Block must be preceded by a Pitch Block.', blk);
                that.stopTurtle = true;
                break;
            }

            function addPitch(note, octave, cents) {
                if (that.drumStyle[turtle].length > 0) {
                    var drumname = last(that.drumStyle[turtle]);
                    var note2 = that.getNote(note, octave, transposition, that.keySignature[turtle]);
                    that.pitchDrumTable[turtle][note2[0] + note2[1]] = drumname;
                }

                that.notePitches[turtle][last(that.inNoteBlock[turtle])].push(note);
                that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(octave);
                that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(cents);
                if (cents !== 0) {
                    that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(pitchToFrequency(note, octave, cents, that.keySignature[turtle]));
                } else {
                    that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(0);
                }
            }

            var len = that.lastNotePlayed[turtle][0].length;
            if (args[0] >= 1) {
                var n = Math.floor(args[0]);
                var value = getStepSizeUp(that.keySignature[turtle], that.lastNotePlayed[turtle][0].slice(0, len - 1));
                var noteObj = that.getNote(that.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(that.lastNotePlayed[turtle][0].slice(len - 1)), value, that.keySignature[turtle]);
                for (var i = 1; i < n; i++) {
                    var value = getStepSizeUp(that.keySignature[turtle], noteObj[0]);
                    noteObj = that.getNote(noteObj[0], noteObj[1], value, that.keySignature[turtle]);
                }
            } else if (args[0] <= -1) {
                var n = -Math.ceil(args[0]);
                value = getStepSizeDown(that.keySignature[turtle], that.lastNotePlayed[turtle][0].slice(0, len - 1));
                var noteObj = that.getNote(that.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(that.lastNotePlayed[turtle][0].slice(len - 1)), value, that.keySignature[turtle]);
                for (var i = 1; i < n; i++) {
                    var value = getStepSizeDown(that.keySignature[turtle], noteObj[0]);
                    noteObj = that.getNote(noteObj[0], noteObj[1], value, that.keySignature[turtle]);
                }
            } else {  // Repeat last pitch played.
                var noteObj = that.getNote(that.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(that.lastNotePlayed[turtle][0].slice(len - 1)), 0, that.keySignature[turtle]);
            }

            var delta = 0;
            if (!(that.invertList[turtle].length === 0)) {
                var len = that.invertList[turtle].length;
                var note1 = that.getNote(noteObj[0], noteObj[1], 0, that.keySignature[turtle]);
                var num1 = getNumber(note1[0], note1[1]);
                for (var i = len - 1; i > -1; i--) {
                    var note2 = that.getNote(that.invertList[turtle][i][0], that.invertList[turtle][i][1], 0, that.keySignature[turtle]);
                    var num2 = getNumber(note2[0], note2[1]);
                    // var a = getNumNote(num1, 0);
                    if (that.invertList[turtle][i][2] === 'even') {
                        delta += num2 - num1;
                    } else {  // odd
                        delta += num2 - num1 + 0.5;
                    }
                    num1 += 2 * delta;
                }
            }

            addPitch(noteObj[0], noteObj[1], 0);

            if (turtle in that.intervals && that.intervals[turtle].length > 0) {
                for (var i = 0; i < that.intervals[turtle].length; i++) {
                    var ii = getInterval(that.intervals[turtle][i], that.keySignature[turtle], noteObj[0]);
                    var noteObj2 = that.getNote(noteObj[0], noteObj[1], ii, that.keySignature[turtle]);
                    addPitch(noteObj2[0], noteObj2[1], 0);
                }
            }

            if (turtle in that.perfect && that.perfect[turtle].length > 0) {
                var noteObj2 = that.getNote(noteObj[0], noteObj[1], calcPerfect(last(that.perfect[turtle])), that.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in that.diminished && that.diminished[turtle].length > 0) {
                var noteObj2 = that.getNote(noteObj[0], noteObj[1], calcDiminished(last(that.diminished[turtle])), that.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in that.augmented && that.augmented[turtle].length > 0) {
                var noteObj2 = that.getNote(noteObj[0], noteObj[1], calcAugmented(last(that.augmented[turtle])), that.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in that.major && that.major[turtle].length > 0) {
                var noteObj2 = that.getNote(noteObj[0], noteObj[1], calcMajor(last(that.major[turtle])), that.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in that.minor && that.minor[turtle].length > 0) {
                var noteObj2 = that.getNote(noteObj[0], noteObj[1], calcMinor(last(that.minor[turtle])), that.keySignature[turtle]);
                addPitch(noteObj2[0], noteObj2[1], 0);
            }

            if (turtle in that.transposition) {
                that.noteTranspositions[turtle].push(that.transposition[turtle] + 2 * delta);
            } else {
                that.noteTranspositions[turtle].push(2 * delta);
            }

            if (that.inNoteBlock[turtle].length > 0) {
                if (turtle in that.beatFactor) {
                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
                } else {
                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(1);
                }
            }

            that.pushedNote[turtle] = true;
            break;
        case 'playdrum':
            if (args.length !== 1 || args[0] == null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            if (typeof(args[0]) !== 'string') {
                that.errorMsg(NANERRORMSG, blk);
                that.stopTurtle = true;
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
            if (that.drumStyle[turtle].length > 0) {
                drumname = last(that.drumStyle[turtle]);
            }

            if (that.inPitchDrumMatrix) {
                that.pitchDrumMatrix.drums.push(drumname);
                that.pitchDrumMatrix.addColBlock(blk);
                if (that.drumBlocks.indexOf(blk) === -1) {
                    that.drumBlocks.push(blk);
                }
            } else if (that.inMatrix) {
                that.pitchTimeMatrix.rowLabels.push(drumname);
                that.pitchTimeMatrix.rowArgs.push(-1);

                that.pitchTimeMatrix.addRowBlock(blk);
                if (that.drumBlocks.indexOf(blk) === -1) {
                    that.drumBlocks.push(blk);
                }
            } else if (that.inNoteBlock[turtle].length > 0) {
                that.noteDrums[turtle][last(that.inNoteBlock[turtle])].push(drumname);
                if (that.synthVolume[turtle][drumname] == undefined) {
                    that.synthVolume[turtle][drumname] = [DEFAULTVOLUME];
                    that.crescendoInitialVolume[turtle][drumname] = [DEFAULTVOLUME];
                }
            } else {
                that.errorMsg(_('Drum Block: Did you mean to use a Note block?'), blk);
                break;
            }

            if (that.inNoteBlock[turtle].length > 0) {
                if (turtle in that.beatFactor) {
                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
                } else {
                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(1);
                }
            }

            that.pushedNote[turtle] = true;
            break;
        case 'setpitchnumberoffset':
            if (args.length !== 2 || args[0] == null || args[1] == null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            var octave = Math.floor(calcOctave(that.currentOctaves[turtle], args[1]));
            that.pitchNumberOffset = pitchToNumber(args[0], octave, that.keySignature[turtle]);
            break;
        case 'pitchnumber':
        case 'scaledegree':
        case 'pitch':
            if (that.blocks.blockList[blk].name === 'pitchnumber') {
                if (args.length !== 1 || args[0] == null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.stopTurtle = true;
                    break;
                }

                if (typeof(args[0]) !== 'number') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                    break;
                }

                // In number to pitch we assume A0 == 0. Here we
                // assume that C4 == 0, so we need an offset of 39.
                var obj = numberToPitch(Math.floor(args[0] + that.pitchNumberOffset));
                note = obj[0];
                octave = obj[1];
                cents = 0;
            } else {
                if (args.length !== 2 || args[0] == null || args[1] == null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.stopTurtle = true;
                    break;
                }

                if (typeof(args[0]) === 'number' && that.blocks.blockList[blk].name === 'pitch') {
                    // We interpret numbers two different ways:
                    // (1) a positive integer between 1 and 12 is taken to be
                    // a moveable solfege, e.g., 1 == do; 2 == re...
                    // (2) if frequency is input, ignore octave (args[1]).
                    // Negative numbers will throw an error.
                    if (args[0] < 1) {
                        note = '?'; // throws an error
                    } else if (args[0] < 13) { // moveable solfege
                        note = scaleDegreeToPitch(that.keySignature[turtle], Math.floor(args[0]));
                        var octave = Math.floor(calcOctave(that.currentOctaves[turtle], args[1]));
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
                        that.errorMsg(INVALIDPITCH, blk);
                        that.stopTurtle = true;
                        break;
                    }
                } else if (typeof(args[0]) === 'number' && that.blocks.blockList[blk].name == 'scaledegree') {
                    //  (0, 4) --> ti 3; (-1, 4) --> la 3, (-6, 4) --> do 3
                    //  (1, 4) --> do 4; ( 2, 4) --> re 4; ( 8, 4) --> do 5
                    if (args[0] < 1) {
                        args[0] -= 2;
                    }

                    if (args[0] < 0) {
                        var neg = true;
                        args[0] = -args[0];
                    } else {
                        var neg = false;
                    }

                    if (args[0] === 0) {
                        note = '?'; // throws an error
                    } else {
                        var obj = keySignatureToMode(that.keySignature[turtle]);
                        var modeLength = MUSICALMODES[obj[1]].length;
                        var scaleDegree = Math.floor(args[0] - 1) % modeLength;
                        scaleDegree += 1;

                        if (neg) {
                            if (scaleDegree > 1) {
                                scaleDegree = modeLength - scaleDegree + 2;
                            }
                            note = scaleDegreeToPitch(that.keySignature[turtle], scaleDegree);
                            var deltaOctave = Math.floor((args[0] + modeLength - 2) / modeLength);
                            var octave = Math.floor(calcOctave(that.currentOctaves[turtle], args[1])) - deltaOctave;
                        } else {
                            note = scaleDegreeToPitch(that.keySignature[turtle], scaleDegree);
                            var deltaOctave = Math.floor((args[0] - 1) / modeLength);
                            var octave = Math.floor(calcOctave(that.currentOctaves[turtle], args[1])) + deltaOctave;
                        }
                        var cents = 0;
                    }

                    if (note === '?') {
                        that.errorMsg(INVALIDPITCH, blk);
                        that.stopTurtle = true;
                        break;
                    }
                } else {
                    var cents = 0;
                    var note = args[0];
                    if (calcOctave(that.currentOctaves[turtle], args[1]) < 0) {
                        console.log('minimum allowable octave is 0');
                        var octave = 0;
                    } else if (calcOctave(that.currentOctaves[turtle], args[1]) > 10) {
                        // Humans can only hear 10 octaves.
                        console.log('clipping octave at 10');
                        var octave = 10;
                    } else {
                        // Octave must be a whole number.
                        var octave = Math.floor(calcOctave(that.currentOctaves[turtle], args[1]));
                    }

                    that.getNote(note, octave, 0, that.keySignature[turtle]);
                    if (!that.validNote) {
                        that.errorMsg(INVALIDPITCH, blk);
                        that.stopTurtle = true;
                        break;
                    }
                }
            }

            var delta = 0;

            if (that.inPitchDrumMatrix) {
                if (note.toLowerCase() !== 'rest') {
                    that.pitchDrumMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                }

                if (!(that.invertList[turtle].length === 0)) {
                    var delta = 0;
                    var len = that.invertList[turtle].length;
                    // Get an anchor note and its corresponding
                    // number, which is used to calculate delta.
                    var note1 = that.getNote(note, octave, 0, that.keySignature[turtle]);
                    var num1 = that.getNumber(note1[0], note1[1]);
                    for (var i = len - 1; i > -1; i--) {
                        // Note from which delta is calculated.
                        var note2 = that.getNote(that.invertList[turtle][i][0], that.invertList[turtle][i][1], 0, that.keySignature[turtle]);
                        var num2 = getNumber(note2[0], note2[1]);
                        // var a = getNumNote(num1, 0);
                        if (that.invertList[turtle][i][2] === 'even') {
                            delta += num2 - num1;
                        } else {  // odd
                            delta += num2 - num1 + 0.5;
                        }
                        num1 += 2 * delta;
                    }
                }

                if (that.duplicateFactor[turtle].length > 0) {
                    var duplicateFactor = that.duplicateFactor[turtle];
                } else {
                    var duplicateFactor = 1;
                }

                for (var i = 0; i < duplicateFactor; i++) {
                    // Apply transpositions
                    var transposition = 2 * delta;
                    if (turtle in that.transposition) {
                        transposition += that.transposition[turtle];
                    }

                    var nnote = that.getNote(note, octave, transposition, that.keySignature[turtle]);
                    if (noteIsSolfege(note)) {
                        nnote[0] = getSolfege(nnote[0]);
                    }

                    if (that.drumStyle[turtle].length > 0) {
                        that.pitchDrumMatrix.drums.push(last(that.drumStyle[turtle]));
                    } else {
                        that.pitchDrumMatrix.rowLabels.push(nnote[0]);
                        that.pitchDrumMatrix.rowArgs.push(nnote[1]);
                    }
                }
            } else if (that.inMatrix) {
                if (note.toLowerCase() !== 'rest') {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                }

                if (!(that.invertList[turtle].length === 0)) {
                    var delta = 0;
                    var len = that.invertList[turtle].length;
                    // Get an anchor note and its corresponding
                    // number, which is used to calculate delta.
                    var note1 = that.getNote(note, octave, 0, that.keySignature[turtle]);
                    var num1 = that.getNumber(note1[0], note1[1]);
                    for (var i = len - 1; i > -1; i--) {
                        // Note from which delta is calculated.
                        var note2 = that.getNote(that.invertList[turtle][i][0], that.invertList[turtle][i][1], 0, that.keySignature[turtle]);
                        var num2 = getNumber(note2[0], note2[1]);
                        // var a = getNumNote(num1, 0);
                        if (that.invertList[turtle][i][2] === 'even') {
                            delta += num2 - num1;
                        } else {  // odd
                            delta += num2 - num1 + 0.5;
                        }
                        num1 += 2 * delta;
                    }
                }

                if (that.duplicateFactor[turtle].length > 0) {
                    var duplicateFactor = that.duplicateFactor[turtle];
                } else {
                    var duplicateFactor = 1;
                }

                for (var i = 0; i < duplicateFactor; i++) {
                    // Apply transpositions
                    var transposition = 2 * delta;
                    if (turtle in that.transposition) {
                        transposition += that.transposition[turtle];
                    }

                    var nnote = that.getNote(note, octave, transposition, that.keySignature[turtle]);
                    if (noteIsSolfege(note)) {
                        nnote[0] = getSolfege(nnote[0]);
                    }

                    // If we are in a setdrum clamp, override the pitch.
                    if (that.drumStyle[turtle].length > 0) {
                        that.pitchTimeMatrix.rowLabels.push(last(that.drumStyle[turtle]));
                        that.pitchTimeMatrix.rowArgs.push(-1);
                    } else {
                        that.pitchTimeMatrix.rowLabels.push(nnote[0]);
                        that.pitchTimeMatrix.rowArgs.push(nnote[1]);
                    }
                }
            } else if (that.inNoteBlock[turtle].length > 0) {

                function addPitch(note, octave, cents) {
                    if (that.drumStyle[turtle].length > 0) {
                        var drumname = last(that.drumStyle[turtle]);
                        var note2 = that.getNote(note, octave, transposition, that.keySignature[turtle]);
                        that.pitchDrumTable[turtle][note2[0]+note2[1]] = drumname;
                    }
                    that.notePitches[turtle][last(that.inNoteBlock[turtle])].push(note);
                    that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(octave);
                    that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(cents);
                    if (cents !== 0) {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(pitchToFrequency(note, octave, cents, that.keySignature[turtle]));
                    } else {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(0);
                    }
                }

                if (!(that.invertList[turtle].length === 0)) {
                    var len = that.invertList[turtle].length;
                    var note1 = that.getNote(note, octave, 0, that.keySignature[turtle]);
                    var num1 = getNumber(note1[0], note1[1]);
                    for (var i = len - 1; i > -1; i--) {
                        var note2 = that.getNote(that.invertList[turtle][i][0], that.invertList[turtle][i][1], 0, that.keySignature[turtle]);
                        var num2 = getNumber(note2[0], note2[1]);
                        // var a = getNumNote(num1, 0);
                        if (that.invertList[turtle][i][2] === 'even') {
                            delta += num2 - num1;
                        } else {  // odd
                            delta += num2 - num1 + 0.5;
                        }
                        num1 += 2 * delta;
                    }
                }

                addPitch(note, octave, cents);

                if (turtle in that.intervals && that.intervals[turtle].length > 0) {
                    for (var i = 0; i < that.intervals[turtle].length; i++) {
                        var ii = getInterval(that.intervals[turtle][i], that.keySignature[turtle], note);
                        var noteObj = that.getNote(note, octave, ii, that.keySignature[turtle]);
                        addPitch(noteObj[0], noteObj[1], cents);
                    }
                }

                if (turtle in that.perfect && that.perfect[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcPerfect(last(that.perfect[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in that.diminished && that.diminished[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcDiminished(last(that.diminished[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in that.augmented && that.augmented[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcAugmented(last(that.augmented[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in that.major && that.major[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcMajor(last(that.major[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in that.minor && that.minor[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcMinor(last(that.minor[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents);
                }

                if (turtle in that.transposition) {
                    that.noteTranspositions[turtle].push(that.transposition[turtle] + 2 * delta);
                } else {
                    that.noteTranspositions[turtle].push(2 * delta);
                }

                if (that.inNoteBlock[turtle].length > 0) {
                    if (turtle in that.beatFactor) {
                        that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
                    } else {
                        that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(1);
                    }
                }

                that.pushedNote[turtle] = true;
            } else if (that.drumStyle[turtle].length > 0) {
                var drumname = last(that.drumStyle[turtle]);
                var note2 = that.getNote(note, octave, transposition, that.keySignature[turtle]);
                that.pitchDrumTable[turtle][note2[0]+note2[1]] = drumname;
            } else if (that.inPitchStaircase) {
                var frequency = pitchToFrequency(args[0], calcOctave(that.currentOctaves[turtle], args[1]), 0, that.keySignature[turtle]);
                var note = that.getNote(args[0], calcOctave(that.currentOctaves[turtle], args[1]), 0, that.keySignature[turtle]);
                var flag = 0;

                for (var i = 0 ; i < that.pitchStaircase.Stairs.length; i++) {
                    if (that.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                        that.pitchStaircase.Stairs.splice(i, 0, [note[0], note[1], parseFloat(frequency), 1, 1]);
                        flag = 1;
                        break;
                    }

                    if (that.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                        that.pitchStaircase.Stairs.splice(i, 1, [note[0], note[1], parseFloat(frequency), 1, 1]);
                        flag = 1;
                        break;
                    }
                }

                if (flag === 0) {
                    that.pitchStaircase.Stairs.push([note[0], note[1], parseFloat(frequency), 1, 1]);
                }
            }
            else {
                that.errorMsg(_('Pitch Block: Did you mean to use a Note block?'), blk);
            }
            break;
        case 'rhythm2':
        case 'rhythm':
            if (args.length < 2 || typeof(args[0]) !== 'number' || typeof(args[1]) !== 'number' || args[0] < 1 || args[1] <= 0) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            if (that.blocks.blockList[blk].name === 'rhythm2') {
                var noteBeatValue = 1 / args[1];
            } else {
                var noteBeatValue = args[1];
            }

            if (that.inMatrix) {
                that.pitchTimeMatrix.addColBlock(blk, args[0]);
                for (var i = 0; i < args[0]; i++) {
                    that._processNote(noteBeatValue, blk, turtle);
                }
            } else if (that.inRhythmRuler) {
                // We don't check for balance since we want to support
                // polyphonic rhythms.
                if (that.rhythmRulerMeasure === null) {
                    that.rhythmRulerMeasure = args[0] * args[1];
                } else if (that.rhythmRulerMeasure != (args[0] * args[1])) {
                    that.textMsg(_('polyphonic rhythm'));
                }

                // Since there maybe more than one instance of the
                // same drum, e.g., if a repeat is used, we look from
                // end of the list instead of the beginning of the
                // list.

                var drumIndex = -1;
                for (var i = 0; i < that.rhythmRuler.Drums.length; i++) {
                    var j = that.rhythmRuler.Drums.length - i - 1;
                    if (that.rhythmRuler.Drums[j] === that._currentDrumBlock) {
                        drumIndex = j;
                        break;
                    }
                }

                if (drumIndex !== -1) {
                    for (var i = 0; i < args[0]; i++) {
                        that.rhythmRuler.Rulers[drumIndex][0].push(noteBeatValue);
                    }
                }
            } else {
                that.errorMsg(_('Rhythm Block: Did you mean to use a Matrix block?'), blk);
            }
            break;

            // &#x1D15D; &#x1D15E; &#x1D15F; &#x1D160; &#x1D161; &#x1D162; &#x1D163; &#x1D164;
        case 'wholeNote':
            that._processNote(1, blk, turtle);
            break;
        case 'halfNote':
            that._processNote(2, blk, turtle);
            break;
        case 'quarterNote':
            that._processNote(4, blk, turtle);
            break;
        case 'eighthNote':
            that._processNote(8, blk, turtle);
            break;
        case 'sixteenthNote':
            that._processNote(16, blk, turtle);
            break;
        case 'thirtysecondNote':
            that._processNote(32, blk, turtle);
            break;
        case 'sixtyfourthNote':
            that._processNote(64, blk, turtle);
            break;
        case 'pickup':
            if (args.length !== 1 || typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            if (args[0] < 0) {
                that.pickup[turtle] = 0;
            } else {
                that.pickup[turtle] = args[0];
            }

            that.notationPickup(turtle, that.pickup[turtle]);
            break;
        case 'offbeatdo':
            // Set up a listener for this turtle/offbeat combo.
            if (!(args[0] in that.actions)) {
                that.errorMsg(NOACTIONERRORMSG, blk, args[1]);
                that.stopTurtle = true;
            } else {
                var __listener = function (event) {
                    if (that.turtles.turtleList[turtle].running) {
                        var queueBlock = new Queue(that.actions[args[0]], 1, blk);
                        that.parentFlowQueue[turtle].push(blk);
                        that.turtles.turtleList[turtle].queue.push(queueBlock);
                    } else {
                        // Since the turtle has stopped
                        // running, we need to run the stack
                        // from here.
                        if (isflow) {
                            that._runFromBlockNow(that, turtle, that.actions[args[0]], isflow, receivedArg);
                        } else {
                            that._runFromBlock(that, turtle, that.actions[args[0]], isflow, receivedArg);
                        }
                    }
                };

                var eventName = '__offbeat_' + turtle + '__';
                that._setListener(turtle, eventName, __listener);

                that.beatList[turtle].push('offbeat');
            }
            break;
        case 'onbeatdo':
            // Set up a listener for this turtle/onbeat combo.
            if (args.length === 2) {
                if (!(args[1] in that.actions)) {
                    that.errorMsg(NOACTIONERRORMSG, blk, args[1]);
                    that.stopTurtle = true;
                } else {
                    var __listener = function (event) {
                        if (that.turtles.turtleList[turtle].running) {
                            var queueBlock = new Queue(that.actions[args[1]], 1, blk);
                            that.parentFlowQueue[turtle].push(blk);
                            that.turtles.turtleList[turtle].queue.push(queueBlock);
                        } else {
                            // Since the turtle has stopped
                            // running, we need to run the stack
                            // from here.
                            if (isflow) {
                                that._runFromBlockNow(that, turtle, that.actions[args[1]], isflow, receivedArg);
                            } else {
                                that._runFromBlock(that, turtle, that.actions[args[1]], isflow, receivedArg);
                            }
                        }
                    };

                    var eventName = '__beat_' + args[0] + '_' + turtle + '__';
                    that._setListener(turtle, eventName, __listener);

                    that.beatList[turtle].push(args[0]);
                }
            }
            break;
        case 'meter':
            if (args.length !== 2 || typeof(args[0]) !== 'number' || typeof(args[1]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            if (args[0] <= 0) {
                that.beatsPerMeasure[turtle] = 4;
            } else {
                that.beatsPerMeasure[turtle] = args[0];
            }

            if (args[1] <= 0) {
                that.noteValuePerBeat[turtle] = 4;
            } else {
                that.noteValuePerBeat[turtle] = 1 / args[1];
            }

            that.notationMeter(turtle, that.beatsPerMeasure[turtle], that.noteValuePerBeat[turtle]);
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

            // Use the outer most note when nesting to determine the beat.
            if (that.inNoteBlock[turtle].length === 0) {
                if (that.notesPlayed[turtle] < that.pickup[turtle]) {
                    var beatValue = 0;
                    var measureValue = 0;
                } else {
                    var beatValue = (((that.notesPlayed[turtle] - that.pickup[turtle]) * that.noteValuePerBeat[turtle]) % that.beatsPerMeasure[turtle]) + 1;
                    var measureValue = Math.floor(((that.notesPlayed[turtle] - that.pickup[turtle]) * that.noteValuePerBeat[turtle]) / that.beatsPerMeasure[turtle]) + 1;
                }

                that.currentBeat[turtle] = beatValue;
                that.currentMeasure[turtle] = measureValue;
            }

            childFlow = args[1];
            childFlowCount = 1;

            // And only trigger from the outer most note when nesting.
            if (that.inNoteBlock[turtle].length === 0) {
                // Queue any beat actions.
                if (that.beatList[turtle].indexOf(beatValue) !== -1) {
                    // Put the childFlow into the queue before the beat
                    // action so that the beat action is at the end of the
                    // FILO.
                    var queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
                    that.parentFlowQueue[turtle].push(blk);
                    that.turtles.turtleList[turtle].queue.push(queueBlock);
                    childFlow = null;

                    var eventName = '__beat_' + beatValue + '_' + turtle + '__';
                    that.stage.dispatchEvent(eventName);
                } else if (that.beatList[turtle].indexOf('offbeat') !== -1) {
                    // Put the childFlow into the queue before the beat
                    // action so that the beat action is at the end of the
                    // FILO.
                    var queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
                    that.parentFlowQueue[turtle].push(blk);
                    that.turtles.turtleList[turtle].queue.push(queueBlock);
                    childFlow = null;

                    var eventName = '__offbeat_' + turtle + '__';
                    that.stage.dispatchEvent(eventName);
                }
            }

            // A note can contain multiple pitch blocks to create
            // a chord. The chord is accumuated in these arrays,
            // which are used when we play the note.
            that.oscList[turtle][blk] = [];
            that.noteBeat[turtle][blk] = [];
            that.noteBeatValues[turtle][blk] = [];
            that.noteValue[turtle][blk] = null;
            that.notePitches[turtle][blk] = [];
            that.noteOctaves[turtle][blk] = [];
            that.noteCents[turtle][blk] = [];
            that.noteHertz[turtle][blk] = [];
            that.noteDrums[turtle][blk] = [];
            that.embeddedGraphics[turtle][blk] = [];

            // Some clamp blocks already handle nesting.
            if (that.inNoteBlock[turtle].length === 0) {
                that.noteTranspositions[turtle] = [];
            }

            // Ensure that note duration is positive.
            if (args[0] < 0) {
                //.TRANS: Note value is the note duration.
                that.errorMsg(_('Note value must be greater than 0.'), blk);
                var noteBeatValue = 0;
            } else {
                if (that.blocks.blockList[blk].name === 'newnote') {
                    var noteBeatValue = 1 / args[0];
                } else {
                    var noteBeatValue = args[0];
                }
            }

            that.inNoteBlock[turtle].push(blk);
            if (that.inNoteBlock[turtle].length > 1) {
                that.multipleVoices[turtle] = true;
            }

            if (turtle in that.dotCount) {
                that.noteValue[turtle][last(that.inNoteBlock[turtle])] = (1 / noteBeatValue) * (2 - (1 / Math.pow(2, that.dotCount[turtle])));
            } else {
                that.noteValue[turtle][last(that.inNoteBlock[turtle])] = 1 / noteBeatValue;
            }

            var listenerName = '_playnote_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (that.multipleVoices[turtle]) {
                    that.notationVoices(turtle, that.inNoteBlock[turtle].length);
                }

                that._processNote(1 / that.noteValue[turtle][last(that.inNoteBlock[turtle])], last(that.inNoteBlock[turtle]), turtle);
                delete that.oscList[turtle][last(that.inNoteBlock[turtle])];
                delete that.noteBeat[turtle][last(that.inNoteBlock[turtle])];
                delete that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])];
                delete that.noteValue[turtle][last(that.inNoteBlock[turtle])];
                delete that.notePitches[turtle][last(that.inNoteBlock[turtle])];
                delete that.noteOctaves[turtle][last(that.inNoteBlock[turtle])];
                delete that.noteCents[turtle][last(that.inNoteBlock[turtle])];
                delete that.noteHertz[turtle][last(that.inNoteBlock[turtle])];
                delete that.noteDrums[turtle][last(that.inNoteBlock[turtle])];
                delete that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])];
                that.inNoteBlock[turtle].splice(-1, 1);

                if (that.multipleVoices[turtle] && that.inNoteBlock[turtle].length === 0) {
                    that.notationVoices(turtle, that.inNoteBlock[turtle].length);
                    that.multipleVoices[turtle] = false;
               }

                // FIXME: broken when nesting
                that.pitchBlocks = [];
                that.drumBlocks = [];
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'rhythmicdot':
            // Dotting a note will increase its play time by
            // a(2 - 1/2^n)
            var currentDotFactor = 2 - (1 / Math.pow(2, that.dotCount[turtle]));
            that.beatFactor[turtle] *= currentDotFactor;
            that.dotCount[turtle] += 1;
            var newDotFactor = 2 - (1 / Math.pow(2, that.dotCount[turtle]));
            that.beatFactor[turtle] /= newDotFactor;
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_dot_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                var currentDotFactor = 2 - (1 / Math.pow(2, that.dotCount[turtle]));
                that.beatFactor[turtle] *= currentDotFactor;
                that.dotCount[turtle] -= 1;
                var newDotFactor = 2 - (1 / Math.pow(2, that.dotCount[turtle]));
                that.beatFactor[turtle] /= newDotFactor;
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'settimbre':
            if (args[0] == null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                childFlow = args[1];
                childFlowCount = 1;
            } else {
                that.inSetTimbre[turtle] = true;

                var synth = args[0];
                for (var voice in VOICENAMES) {
                    if (VOICENAMES[voice][0] === args[0]) {
                        synth = VOICENAMES[voice][1];
                        break;
                    } else if (VOICENAMES[voice][1] === args[0]) {
                        synth = args[0];
                        break;
                    }
                }

                that.instrumentNames[turtle].push(synth);
                that.synth.loadSynth(synth);

                if (that.synthVolume[turtle][synth] == undefined) {
                    that.synthVolume[turtle][synth] = [DEFAULTVOLUME];
                    that.crescendoInitialVolume[turtle][synth] = [DEFAULTVOLUME];
                }

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_settimbre_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.inSetTimbre[turtle] = false;
                    that.instrumentNames[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'crescendo':
            if (args.length > 1 && args[0] !== 0) {
                that.crescendoDelta[turtle].push(args[0]);
                for (var synth in that.synthVolume[turtle]) {
                    var vol = last(that.synthVolume[turtle][synth]);
                    that.synthVolume[turtle][synth].push(vol);
                    that.crescendoInitialVolume[turtle][synth].push(vol);
                }

                that.inCrescendo[turtle].push(true);

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_crescendo_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    if (!that.justCounting[turtle]) {
                        that.notationEndCrescendo(turtle, last(that.crescendoDelta[turtle]));
                    }

                    that.crescendoDelta[turtle].pop();
                    for (var synth in that.synthVolume[turtle]) {
                        var len = that.synthVolume[turtle][synth].length;
                        that.synthVolume[turtle][synth][len - 1] = last(that.crescendoInitialVolume[turtle][synth]);
                        that.crescendoInitialVolume[turtle][synth].pop();
                    }

                };

                that._setListener(turtle, listenerName, __listener);
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
            that.drumStyle[turtle].push(that.blocks.blockList[blk].name);
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_drum_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.drumStyle[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
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

            that.drumStyle[turtle].push(drumname);
            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_setdrum_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.drumStyle[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            if (that.inRhythmRuler) {
                that._currentDrumBlock = blk;
                that.rhythmRuler.Drums.push(blk);
                that.rhythmRuler.Rulers.push([[],[]]);
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
                that.errorMsg(NOINPUTERRORMSG, blk);

                childFlow = args[1];
                childFlowCount = 1;
            } else {
                that.voices[turtle].push(voicename);
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_setvoice_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.voices[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'vibrato':
            var intensity = args[0];
            var rate = args[1];

            if (intensity < 1 || intensity > 100) {
                that.errorMsg(_('Vibrato intensity must be between 1 and 100.'), blk);
                that.stopTurtle = true;
            }

            if (rate <= 0) {
                that.errorMsg(_('Vibrato rate must be greater than 0.'), blk);
                that.stopTurtle = true;
            }

            childFlow = args[2];
            childFlowCount = 1;

            that.vibratoIntensity[turtle].push(intensity / 100);
            that.vibratoRate[turtle].push(1 / rate);

            var listenerName = '_vibrato_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
               that.vibratoIntensity[turtle].pop();
               that.vibratoRate[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);

            if (that.inTimbre) {
                instrumentsEffects[that.timbre.instrumentName]['vibratoActive'] = true;
                that.timbre.vibratoEffect.push(blk);
                that.timbre.vibratoParams.push(last(that.vibratoIntensity[turtle]) * 100);
                instrumentsEffects[that.timbre.instrumentName]['vibratoIntensity'] = that.vibratoIntensity[turtle];
                that.timbre.vibratoParams.push(last(that.vibratoRate[turtle]));
                instrumentsEffects[that.timbre.instrumentName]['vibratoFrequency'] = rate;
            }
            break;
        case 'dis':
            var distortion = (args[0] / 100);
            if (distortion < 0 || distortion > 1) {
                that.errorMsg(_('Distortion must be from 0 to 100.'), blk);
                that.stopTurtle = true;
            }
            childFlow = args[1];
            childFlowCount = 1;

            that.distortionAmount[turtle].push(distortion);

            var listenerName = '_distortion_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
               that.distortionAmount[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);

            if (that.inTimbre) {
                instrumentsEffects[that.timbre.instrumentName]['distortionActive'] = true;
                that.timbre.distortionEffect.push(blk);
                that.timbre.distortionParams.push(last(that.distortionAmount[turtle]) * 100);
                instrumentsEffects[that.timbre.instrumentName]['distortionAmount'] = distortion;
            }
            break;
        case 'tremolo':
            var frequency = args[0];
            var depth = (args[1] / 100);

            if (depth < 0 || depth > 1) {
                //.TRANS: Depth is the intesity of the tremolo effect.
                that.errorMsg(_('Depth is out of range.'), blk);
                that.stopTurtle = true;
            }

            childFlow = args[2];
            childFlowCount = 1;

            that.tremoloFrequency[turtle].push(frequency);
            that.tremoloDepth[turtle].push(depth);

            var listenerName = '_tremolo_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
               that.tremoloFrequency[turtle].pop();
               that.tremoloDepth[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            if (that.inTimbre) {
                instrumentsEffects[that.timbre.instrumentName]['tremoloActive'] = true;
                that.timbre.tremoloEffect.push(blk);
                that.timbre.tremoloParams.push(last(that.tremoloFrequency[turtle]));
                instrumentsEffects[that.timbre.instrumentName]['tremoloFrequency'] = frequency;
                that.timbre.tremoloParams.push(last(that.tremoloDepth[turtle]) * 100);
                instrumentsEffects[that.timbre.instrumentName]['tremoloDepth'] = depth;
            }
            break;
        case 'phaser':
            var rate = args[0];
            var octaves = args[1];
            var baseFrequency = args[2];

            childFlow = args[3];
            childFlowCount = 1;

            that.rate[turtle].push(rate);
            that.octaves[turtle].push(octaves);
            that.baseFrequency[turtle].push(baseFrequency);

            var listenerName = '_phaser_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.rate[turtle].pop();
                that.octaves[turtle].pop();
                that.baseFrequency[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            if (that.inTimbre) {
                instrumentsEffects[that.timbre.instrumentName]['phaserActive'] = true;
                that.timbre.phaserEffect.push(blk);
                that.timbre.phaserParams.push(last(that.rate[turtle]));
                instrumentsEffects[that.timbre.instrumentName]['rate'] = rate;
                that.timbre.phaserParams.push(last(that.octaves[turtle]));
                instrumentsEffects[that.timbre.instrumentName]['octaves'] = octaves;
                that.timbre.phaserParams.push(last(that.baseFrequency[turtle]));
                instrumentsEffects[that.timbre.instrumentName]['baseFrequency'] = baseFrequency;
            }
            break;
        case 'chorus':
            var chorusRate = args[0];
            var delayTime = args[1];
            var chorusDepth = (args[2] / 100);

            if (chorusDepth < 0 || chorusDepth > 1) {
                //.TRANS: Depth is the intesity of the chorus effect.
                that.errorMsg(_('Depth is out of range.'), blk);
                that.stopTurtle = true;
            }

            childFlow = args[3];
            childFlowCount = 1;

            that.chorusRate[turtle].push(chorusRate);
            that.delayTime[turtle].push(delayTime);
            that.chorusDepth[turtle].push(chorusDepth);

            var listenerName = '_chorus_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.chorusRate[turtle].pop();
                that.delayTime[turtle].pop();
                that.chorusDepth[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);

            if (that.inTimbre) {
                instrumentsEffects[that.timbre.instrumentName]['chorusActive'] = true;
                that.timbre.chorusEffect.push(blk);
                that.timbre.chorusParams.push(last(that.chorusRate[turtle]));
                instrumentsEffects[that.timbre.instrumentName]['chorusRate'] = chorusRate;
                that.timbre.chorusParams.push(last(that.delayTime[turtle]));
                instrumentsEffects[that.timbre.instrumentName]['delayTime'] = delayTime;
                that.timbre.chorusParams.push(last(that.chorusDepth[turtle]) * 100);
                instrumentsEffects[that.timbre.instrumentName]['chorusDepth'] = chorusDepth;
            }
            break;
        case 'interval':
            if (typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            if (args[0] > 0) {
                var i = Math.floor(args[0]);
            } else {
                var i = Math.ceil(args[0]);
            }

            if (i !== 0) {
                that.intervals[turtle].push(i);

                var listenerName = '_interval_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.intervals[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
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
                that.perfect[turtle].push([args[0], deltaOctave]);

                var listenerName = '_perfect_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.perfect[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Perfect Block must be 1, 4, 5, or 8'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'perfect':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            if ([1, 4, 5, 8].indexOf(mod12Arg) !== -1) {
                that.perfect[turtle].push([args[0], 0]);

                var listenerName = '_perfect_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.perfect[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Perfect Block must be 1, 4, 5, or 8'), blk);
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
                that.diminished[turtle].push([args[0], deltaOctave]);

                var listenerName = '_diminished_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.diminished[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Diminished Block must be 1, 2, 3, 4, 5, 6, 7, or 8'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'diminished':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            if ([1, 2, 3, 4, 5, 6, 7, 8].indexOf(mod12Arg) !== -1) {
                that.diminished[turtle].push([args[0], 0]);

                var listenerName = '_diminished_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.diminished[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Diminished Block must be 1, 2, 3, 4, 5, 6, 7, or 8'), blk);
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
                that.augmented[turtle].push([args[0], deltaOctave]);

                var listenerName = '_augmented_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.augmented[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Augmented Block must be 1, 2, 3, 4, 5, 6, 7, or 8'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'augmented':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            if ([1, 2, 3, 4, 5, 6, 7, 8].indexOf(mod12Arg) !== -1) {
                that.augmented[turtle].push([args[0], 0]);

                var listenerName = '_tritone_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.augmented[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Augmented Block must be 1, 2, 3, 4, 5, 6, 7, or 8'), blk);
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
                that.major[turtle].push([args[0], deltaOctave]);

                var listenerName = '_major_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.major[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Major Block must be 2, 3, 6, or 7'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'major':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            var octaveArg = args[1];
            if ([2, 3, 6, 7].indexOf(mod12Arg) !== -1) {
                that.major[turtle].push([args[0], 0]);

                var listenerName = '_major_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.major[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Major Block must be 2, 3, 6, or 7'), blk);
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
                that.minor[turtle].push([args[0], deltaOctave]);

                var listenerName = '_minor_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.minor[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Minor Block must be 2, 3, 6, or 7'), blk);
            }

            childFlow = args[2];
            childFlowCount = 1;
            break;
        case 'minor':
            // Deprecated
            var mod12Arg = mod12(args[0]);
            if ([2, 3, 6, 7].indexOf(mod12Arg) !== -1) {
                that.minor[turtle].push([args[0], 0]);

                var listenerName = '_minor_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.minor[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            } else {
                that.errorMsg(_('Input to Minor Block must be 2, 3, 6, or 7'), blk);
            }

            childFlow = args[1];
            childFlowCount = 1;
            break;
        case 'newstaccato':
        case 'staccato':
            if (args.length > 1) {
                if (that.blocks.blockList[blk].name === 'newstaccato') {
                    that.staccato[turtle].push(1 / args[0]);
                } else {
                    that.staccato[turtle].push(args[0]);
                }
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_staccato_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.staccato[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'newslur':
        case 'slur':
            if (args.length > 1) {
                if (that.blocks.blockList[blk].name === 'newslur') {
                    that.staccato[turtle].push(-1 / args[0]);
                } else {
                    that.staccato[turtle].push(-args[0]);
                }

                if (!that.justCounting[turtle]) {
                    that.notationBeginSlur(turtle);
                }

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_staccato_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.staccato[turtle].pop();
                    if (!that.justCounting[turtle]) {
                        that.notationEndSlur(turtle);
                    }
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'drift':
            that.drift[turtle] += 1;
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_drift_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.drift[turtle] -= 1;
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'tie':
            // Tie notes together in pairs.
            that.tie[turtle] = true;
            that.tieNote[turtle] = [];
            that.tieCarryOver[turtle] = 0;
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_tie_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.tie[turtle] = false;
                // If tieCarryOver > 0, we have one more note to
                // play.
                if (that.tieCarryOver[turtle] > 0) {
                    if (!that.justCounting[turtle]) {
                        // Remove the note from the Lilypond list.
                        for (var i = 0; i < that.notePitches[turtle][last(that.inNoteBlock[turtle])].length; i++) {
                            that.notationRemoveTie(turtle);
                        }
                    }
                    var noteValue = that.tieCarryOver[turtle];
                    that.tieCarryOver[turtle] = 0;
                    that._processNote(noteValue, blk, turtle);
                }
                that.tieNote[turtle] = [];
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'newswing':
        case 'newswing2':
        case 'swing':
            // Grab a bit from the next note to give to the current note.
            if (that.blocks.blockList[blk].name === 'newswing2') {
                that.swing[turtle].push(1 / args[0]);
                that.swingTarget[turtle].push(1 / args[1]);
                childFlow = args[2];
            } else if (that.blocks.blockList[blk].name === 'newswing') {
                that.swing[turtle].push(1 / args[0]);
                that.swingTarget[turtle].push(null);
                childFlow = args[1];
            } else {
                that.swing[turtle].push(args[0]);
                that.swingTarget[turtle].push(null);
                childFlow = args[1];
            }
            that.swingCarryOver[turtle] = 0;

            childFlowCount = 1;

            var listenerName = '_swing_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.swingTarget[turtle].pop();
                that.swing[turtle].pop();
                that.swingCarryOver[turtle] = 0;
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'duplicatenotes':
            var factor = Math.floor(args[0]);
            if (factor < 1) {
                that.errorMsg(ZERODIVIDEERRORMSG, blk);
                that.stopTurtle = true;
            } else {
                that.duplicateFactor[turtle] *= factor;

                // Queue each block in the clamp.
                var listenerName = '_duplicate_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __lookForOtherTurtles = function (blk, turtle) {
                    for (var t in that.connectionStore) {
                        if (t !== turtle.toString()) {
                            for (var b in that.connectionStore[t]) {
                                if (b === blk.toString()) {
                                    return t;
                                }
                            }
                        }
                    }

                    return null;
                }

                that.inDuplicate[turtle] = true;

                var __listener = function (event) {
                    that.inDuplicate[turtle] = false;
                    that.duplicateFactor[turtle] /= factor;

                    // Check for a race condition.
                    // FIXME: Do something about the race condition.
                    if (that.connectionStoreLock) {
                        console.log('LOCKED');
                    }

                    that.connectionStoreLock = true;

                    // The last turtle should restore the broken connections.
                    if (__lookForOtherTurtles(blk, turtle) == null) {
                        var n = that.connectionStore[turtle][blk].length;
                        for (var i = 0; i < n; i++) {
                            var obj = that.connectionStore[turtle][blk].pop();
                            that.blocks.blockList[obj[0]].connections[obj[1]] = obj[2];
                            if (obj[2] != null) {
                                that.blocks.blockList[obj[2]].connections[0] = obj[0];
                            }
                        }
                    } else {
                        delete that.connectionStore[turtle][blk];
                    }

                    that.connectionStoreLock = false;
                };

                that._setListener(turtle, listenerName, __listener);

                // Test for race condition.
                // FIXME: Do something about the race condition.
                if (that.connectionStoreLock) {
                    console.log('LOCKED');
                }

                that.connectionStoreLock = true;

                // Check to see if another turtle has already disconnected
                // these blocks.
                var otherTurtle = __lookForOtherTurtles(blk, turtle);
                if (otherTurtle != null) {
                    // Copy the connections and queue the blocks.
                    that.connectionStore[turtle][blk] = [];
                    for (var i = that.connectionStore[otherTurtle][blk].length; i > 0; i--) {
                        var obj = [that.connectionStore[otherTurtle][blk][i - 1][0], that.connectionStore[otherTurtle][blk][i - 1][1], that.connectionStore[otherTurtle][blk][i - 1][2]];
                        that.connectionStore[turtle][blk].push(obj);
                        var child = obj[0];
                        if (that.blocks.blockList[child].name === 'hidden') {
                            child = that.blocks.blockList[child].connections[0];
                        }

                        var queueBlock = new Queue(child, factor, blk, receivedArg);
                        that.parentFlowQueue[turtle].push(blk);
                        that.turtles.turtleList[turtle].queue.push(queueBlock);
                    }
                } else {
                    var child = that.blocks.findBottomBlock(args[1]);
                    while (child != blk) {
                        if (that.blocks.blockList[child].name !== 'hidden') {
                            var queueBlock = new Queue(child, factor, blk, receivedArg);
                            that.parentFlowQueue[turtle].push(blk);
                            that.turtles.turtleList[turtle].queue.push(queueBlock);
                        }

                        child = that.blocks.blockList[child].connections[0];
                    }

                    // Break the connections between blocks in the clamp so
                    // that when we run the queues, only the individual blocks
                    // run.
                    that.connectionStore[turtle][blk] = [];
                    var child = args[1];
                    while (child != null) {
                        var lastConnection = that.blocks.blockList[child].connections.length - 1;
                        var nextBlk = that.blocks.blockList[child].connections[lastConnection];
                        // Don't disconnect a hidden block from its parent.
                        if (nextBlk != null && that.blocks.blockList[nextBlk].name === 'hidden') {
                            that.connectionStore[turtle][blk].push([nextBlk, 1, that.blocks.blockList[nextBlk].connections[1]]);
                            child = that.blocks.blockList[nextBlk].connections[1];
                            that.blocks.blockList[nextBlk].connections[1] = null;
                        } else {
                            that.connectionStore[turtle][blk].push([child, lastConnection, nextBlk]);
                            that.blocks.blockList[child].connections[lastConnection] = null;
                            child = nextBlk;
                        }

                        if (child != null) {
                            that.blocks.blockList[child].connections[0] = null;
                        }
                    }
                }

                that.connectionStoreLock = false;
            }
            break;
        case 'skipnotes':
            var factor = args[0];
            if (factor === 0) {
                that.errorMsg(ZERODIVIDEERRORMSG, blk);
                that.stopTurtle = true;
            } else {
                that.skipFactor[turtle] *= factor;
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_skip_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.skipFactor[turtle] /= factor;
                    if (that.skipFactor[turtle] === 1) {
                        that.skipIndex[turtle] = 0;
                    }
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'multiplybeatfactor':
            var factor = args[0];
            if (factor === 0) {
                that.errorMsg(ZERODIVIDEERRORMSG, blk);
                that.stopTurtle = true;
            } else {
                that.beatFactor[turtle] *= factor;
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_multiplybeat_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.beatFactor[turtle] /= factor;
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'dividebeatfactor':
            var factor = args[0];
            if (factor === 0) {
                that.errorMsg(ZERODIVIDEERRORMSG, blk);
                that.stopTurtle = true;
            } else {
                that.beatFactor[turtle] /= factor;
                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_dividebeat_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.beatFactor[turtle] *= factor;
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'settransposition':
            var transValue = args[0];
            if (!(that.invertList[turtle].length === 0)) {
                that.transposition[turtle] -= transValue;
            } else {
                that.transposition[turtle] += transValue;
            }

            that.transpositionValues[turtle].push(transValue);

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_transposition_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                var transValue = that.transpositionValues[turtle].pop();
                if (!(that.invertList[turtle].length === 0)) {
                    that.transposition[turtle] += transValue;
                } else {
                    that.transposition[turtle] -= transValue;
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'sharp':
            if (!(that.invertList[turtle].length === 0)) {
                that.transposition[turtle] -= 1;
            } else {
                that.transposition[turtle] += 1;
            }

            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_sharp_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (!(that.invertList[turtle].length === 0)) {
                    that.transposition[turtle] += 1;
                } else {
                    that.transposition[turtle] -= 1;
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'flat':
            if (!(that.invertList[turtle].length === 0)) {
                that.transposition[turtle] += 1;
            } else {
                that.transposition[turtle] -= 1;
            }

            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_flat_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (!(that.invertList[turtle].length === 0)) {
                    that.transposition[turtle] -= 1;
                } else {
                    that.transposition[turtle] += 1;
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'articulation':
            if (args.length === 2 && typeof(args[0]) === 'number' && args[0] > 0) {
                for (var synth in that.synthVolume[turtle]) {
                    var newVolume = last(that.synthVolume[turtle][synth]) * (100 + args[0]) / 100;
                    if (newVolume > 100) {
                        console.log('articulated volume exceeds 100%. clipping');
                        newVolume = 100;
                    }

                    that.synthVolume[turtle][synth].push(newVolume);
                    if (!this.suppressOutput[turtle]) {
                        that._setSynthVolume(synth, newVolume);
                    }
                }

                if (!that.justCounting[turtle]) {
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setsynthvolume', synth, newVolume]);
                }

                if (!that.justCounting[turtle]) {
                    that.notationBeginArticulation(turtle);
                }

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_articulation_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    for (var synth in that.synthVolume[turtle]) {
                        that.synthVolume[turtle][synth].pop();
                        that._setSynthVolume(synth, last(that.synthVolume[turtle][synth]));
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setsynthvolume', synth, last(that.synthVolume[turtle][synth])]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.notationEndArticulation(turtle);
                    }
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
            // Deprecated
        case 'setnotevolume2':  // master volume
            if (args.length === 2 && typeof(args[0]) === 'number') {
                that.masterVolume.push(args[0]);
                if (!this.suppressOutput[turtle]) {
                    that._setMasterVolume(args[0]);
                }

                if (!that.justCounting[turtle]) {
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setvolume', args[0]]);
                }

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_volume_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.masterVolume.pop();
                };

                that._setListener(turtle, listenerName, __listener);
            }
            break;
        case 'setnotevolume':  // master volume
            if (args.length === 1) {
                if (typeof(args[0]) !== 'number') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else {
                    that.masterVolume.push(args[0]);
                    if (!this.suppressOutput[turtle]) {
                        that._setMasterVolume(args[0]);
                    }

                    if (!that.justCounting[turtle]) {
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setvolume', args[0]]);
                    }
                }
            }
            break;
        case 'setsynthvolume':
            if (args.length === 2) {
                // fixme: check for valid synth
                if (typeof(args[1]) !== 'number') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else {
                    var synth = null;

                    if (args[0] === 'default' || args[0] ===  _('default')) {
                        synth = 'default';
                    } else if (args[0] === 'default' || args[0] ===  _('default')) {
                        synth = 'custom';
		    }

                    if (synth == null) {
			for (var voice in VOICENAMES) {
			    if (VOICENAMES[voice][0] === args[0]) {
				synth = VOICENAMES[voice][1];
				break;
			    } else if (VOICENAMES[voice][1] === args[0]) {
				synth = args[0];
				break;
			    }
			}
                    }

                    if (synth == null) {
			for (var drum in DRUMNAMES) {
			    if (DRUMNAMES[drum][0] === args[0]) {
				synth = DRUMNAMES[drum][1];
				break;
			    } else if (DRUMNAMES[drum][1] === args[0]) {
				synth = args[0];
				break;
			    }
			}
                    }

                    if (synth == null) {
                        that.errorMsg(synth + 'not found', blk);
                        synth = 'default';
                    }

                    if (!this.suppressOutput[turtle]) {
                        that.synthVolume[turtle][synth] = args[1];
                        that._setSynthVolume(synth, args[1]);
                    }

                    if (!that.justCounting[turtle]) {
                        // fixme: not yet implemented in playback
                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'setsynthvolume', synth, args[1]]);
                    }
                }
            }
            break;
            // Deprecated P5 tone generator replaced by macro.
        case 'tone':
            break;
        case 'tone2':
            if (_THIS_IS_TURTLE_BLOCKS_) {
                if (typeof(that.turtleOscs[turtle]) === 'undefined') {
                    that.turtleOscs[turtle] = new p5.TriOsc();
                }

                osc = that.turtleOscs[turtle];
                osc.stop();
                osc.start();
                osc.amp(0);

                osc.freq(args[0]);
                osc.fade(0.5, 0.2);

                setTimeout(function(osc) {
                    osc.fade(0, 0.2);
                }, args[1], osc);
            }
            break;
        case 'hertz':
            if (args.length !== 1 || args[0] == null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            if (typeof(args[0]) !== 'number') {
                that.errorMsg(NANERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            var obj = frequencyToPitch(args[0]);
            var note = obj[0];
            var octave = obj[1];
            var cents = obj[2];
            var delta = 0;

            if (note === '?') {
                that.errorMsg(INVALIDPITCH, blk);
                that.stopTurtle = true;
            } else if (that.inMatrix) {
                that.pitchTimeMatrix.addRowBlock(blk);
                if (that.pitchBlocks.indexOf(blk) === -1) {
                    that.pitchBlocks.push(blk);
                }

                that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                that.pitchTimeMatrix.rowArgs.push(args[0]);
            } else if (that.inNoteBlock[turtle].length > 0) {

                function addPitch(note, octave, cents, frequency) {
                    if (that.drumStyle[turtle].length > 0) {
                        var drumname = last(that.drumStyle[turtle]);
                        var note2 = that.getNote(note, octave, transposition, that.keySignature[turtle]);
                        that.pitchDrumTable[turtle][note2[0] + note2[1]] = drumname;
                    }
                    that.notePitches[turtle][last(that.inNoteBlock[turtle])].push(note);
                    that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(octave);
                    that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(cents);
                    that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(frequency);
                }

                if (!(that.invertList[turtle].length === 0)) {
                    var len = that.invertList[turtle].length;
                    var note1 = that.getNote(note, octave, 0, that.keySignature[turtle]);
                    var num1 = getNumber(note1[0], note1[1]);
                    for (var i = len - 1; i > -1; i--) {
                        var note2 = that.getNote(that.invertList[turtle][i][0], that.invertList[turtle][i][1], 0, that.keySignature[turtle]);
                        var num2 = getNumber(note2[0], note2[1]);
                        // var a = getNumNote(num1, 0);
                        if (that.invertList[turtle][i][2] === 'even') {
                            delta += num2 - num1;
                        } else {  // odd
                            delta += num2 - num1 + 0.5;
                        }
                        num1 += 2 * delta;
                    }
                }

                addPitch(note, octave, cents, args[0]);

                if (turtle in that.intervals && that.intervals[turtle].length > 0) {
                    for (var i = 0; i < that.intervals[turtle].length; i++) {
                        var ii = getInterval(that.intervals[turtle][i], that.keySignature[turtle], note);
                        var noteObj = that.getNote(note, octave, ii, that.keySignature[turtle]);
                        addPitch(noteObj[0], noteObj[1], cents, 0);
                    }
                }

                if (turtle in that.perfect && that.perfect[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcPerfect(last(that.perfect[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in that.diminished && that.diminished[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcDiminished(last(that.diminished[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in that.augmented && that.augmented[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcAugmented(last(that.augmented[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in that.major && that.major[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcMajor(last(that.major[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in that.minor && that.minor[turtle].length > 0) {
                    var noteObj = that.getNote(note, octave, calcMinor(last(that.minor[turtle])), that.keySignature[turtle]);
                    addPitch(noteObj[0], noteObj[1], cents, 0);
                }

                if (turtle in that.transposition) {
                    that.noteTranspositions[turtle].push(that.transposition[turtle] + 2 * delta);
                } else {
                    that.noteTranspositions[turtle].push(2 * delta);
                }

                if (turtle in that.beatFactor) {
                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
                } else {
                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(1);
                }

                that.pushedNote[turtle] = true;
            } else if (that.inPitchStaircase) {
                var frequency = args[0];
                var note = frequencyToPitch(args[0]);
                var flag = 0;

                for (var i = 0 ; i < that.pitchStaircase.Stairs.length; i++) {
                    if (that.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                        that.pitchStaircase.Stairs.splice(i, 0, [note[0], note[1], parseFloat(frequency)]);
                        flag = 1;
                        break;
                    }
                    if (that.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                        that.pitchStaircase.Stairs.splice(i, 1, [note[0], note[1], parseFloat(frequency)]);
                        flag = 1;
                        break;
                    }
                }

                if (flag === 0) {
                    that.pitchStaircase.Stairs.push([note[0], note[1], parseFloat(frequency)]);
                }
            } else if (that.inPitchSlider) {
                that.pitchSlider.Sliders.push([args[0], 0, 0]);
            } else {
                that.errorMsg(_('Hertz Block: Did you mean to use a Note block?'), blk);
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
                if (that.inMatrix) {
                    that.pitchTimeMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                    that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                    that.pitchTimeMatrix.rowArgs.push(args[0]);
                } else if (that.inPitchSlider) {
                    that.pitchSlider.Sliders.push([args[0], 0, 0]);
                } else {
                    that.oscList[turtle][last(that.inNoteBlock[turtle])].push(that.blocks.blockList[blk].name);

                    // We keep track of pitch and octave for notation purposes.
                    that.notePitches[turtle][last(that.inNoteBlock[turtle])].push(obj[0]);
                    that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(obj[1]);
                    that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(obj[2]);
                    if (obj[2] !== 0) {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(pitchToFrequency(obj[0], obj[1], obj[2], that.keySignature[turtle]));
                    } else {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(0);
                    }

                    if (turtle in that.transposition) {
                        that.noteTranspositions[turtle].push(that.transposition[turtle]);
                    } else {
                        that.noteTranspositions[turtle].push(0);
                    }

                    if (turtle in that.beatFactor) {
                        that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
                    } else {
                        that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(1);
                    }

                    that.pushedNote[turtle] = true;
                }
            }
            break;
            // Deprecated
        case 'playfwd':
            that.pitchTimeMatrix.playDirection = 1;
            that._runFromBlock(that, turtle, args[0]);
            break;
            // Deprecated
        case 'playbwd':
            that.pitchTimeMatrix.playDirection = -1;
            that._runFromBlock(that, turtle, args[0]);
            break;
        case 'stuplet':
            if (that.inMatrix) {
                that.pitchTimeMatrix.addColBlock(blk, args[0]);
                var noteBeatValue = (1 / args[1]) * that.beatFactor[turtle];
                if (that.tuplet === true) {
                    // The simple-tuplet block is inside.
                    for (var i = 0; i < args[0]; i++) {
                        if (!that.addingNotesToTuplet) {
                            that.tupletRhythms.push(['notes', 0]);
                            that.addingNotesToTuplet = true;
                        }
                        that._processNote(noteBeatValue, blk, turtle);
                    }
                } else {
                    that.tupletParams.push([1, noteBeatValue]);
                    var obj = ['simple', 0];
                    for (var i = 0; i < args[0]; i++) {
                        obj.push((1 / args[1]) * that.beatFactor[turtle]);
                    }
                    that.tupletRhythms.push(obj);
                }
            }
            break;
        case 'tuplet2':
        case 'tuplet3':
            if (that.inMatrix) {
                if (that.blocks.blockList[blk].name === 'tuplet3') {
                    that.tupletParams.push([args[0], (1 / args[1]) * that.beatFactor[turtle]]);
                } else {
                    that.tupletParams.push([args[0], args[1] * that.beatFactor[turtle]]);
                }
                that.tuplet = true;
                that.addingNotesToTuplet = false;
            } else {
                that.errorMsg(_('Tuplet Block: Did you mean to use a Matrix block?'), blk);
            }
            childFlow = args[2];
            childFlowCount = 1;

            var listenerName = '_tuplet_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (that.inMatrix) {
                    that.tuplet = false;
                    that.addingNotesToTuplet = false;
                } else {
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'tuplet4':
            if (that.inMatrix) {
                that.tupletParams.push([1, (1 / args[0]) * that.beatFactor[turtle]]);
                that.tuplet = true;
                that.addingNotesToTuplet = false;
            } else {
                that.errorMsg(_('Tuplet Block: Did you mean to use a Matrix block?'), blk);
            }
            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_tuplet_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (that.inMatrix) {
                    that.tuplet = false;
                    that.addingNotesToTuplet = false;
                } else {
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        default:
            if (that.blocks.blockList[blk].name in that.evalFlowDict) {
                eval(that.evalFlowDict[that.blocks.blockList[blk].name]);
            } else {
                // Could be an arg block, so we need to print its value.
                if (that.blocks.blockList[blk].isArgBlock() || ['anyout', 'numberout', 'textout'].indexOf(that.blocks.blockList[blk].protoblock.dockTypes[0]) !== -1) {
                    args.push(that.parseArg(that, turtle, blk, that.receievedArg));
                    if (that.blocks.blockList[blk].value == null) {
                        that.textMsg('null block value');
                    } else {
                        that.textMsg(that.blocks.blockList[blk].value.toString());
                    }
                } else {
                    that.errorMsg('I do not know how to ' + that.blocks.blockList[blk].name + '.', blk);
                }
                that.stopTurtle = true;
            }
            break;
        }

        // (3) Queue block below the current block.

        // Is the block in a queued clamp?
        if (blk in that.endOfClampSignals[turtle]) {
            var n = that.endOfClampSignals[turtle][blk].length;
            for (var i = 0; i < n; i++) {
                var signal = that.endOfClampSignals[turtle][blk].pop();
                if (signal != null) {
                    that.stage.dispatchEvent(signal);
                }
            }
        }

        if (docById('statusDiv').style.visibility === 'visible') {
            if (!that.inStatusMatrix) {
                that.statusMatrix.updateAll();
            }
        }

        // If there is a child flow, queue it.
        if (childFlow != null) {
            if (that.blocks.blockList[blk].name==='doArg' || that.blocks.blockList[blk].name==='nameddoArg') {
                var queueBlock = new Queue(childFlow, childFlowCount, blk, actionArgs);
            } else {
                var queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
            }

            // We need to keep track of the parent block to the child
            // flow so we can unlightlight the parent block after the
            // child flow completes.
            if (that.parentFlowQueue[turtle] != undefined) {
                that.parentFlowQueue[turtle].push(blk);
                that.turtles.turtleList[turtle].queue.push(queueBlock);
            } else {
                console.log('cannot find queue for turtle ' + turtle);
            }
        }

        var nextBlock = null;
        var parentBlk = null;

        // Run the last flow in the queue.
        if (that.turtles.turtleList[turtle].queue.length > queueStart) {
            nextBlock = last(that.turtles.turtleList[turtle].queue).blk;
            parentBlk = last(that.turtles.turtleList[turtle].queue).parentBlk;
            passArg = last(that.turtles.turtleList[turtle].queue).args;
            // Since the forever block starts at -1, it will never === 1.
            if (last(that.turtles.turtleList[turtle].queue).count === 1) {
                // Finished child so pop it off the queue.
                that.turtles.turtleList[turtle].queue.pop();
            } else {
                // Decrement the counter for repeating that flow.
                last(that.turtles.turtleList[turtle].queue).count -= 1;
            }
        }

        if (nextBlock != null) {
            if (parentBlk !== blk) {
                // The wait block waits waitTimes longer than other
                // blocks before it is unhighlighted.
                if (that.turtleDelay === TURTLESTEP) {
                    that.unhighlightStepQueue[turtle] = blk;
                } else {
                    if (!that.suppressOutput[turtle] && !that.justCounting[turtle]) {
                        setTimeout(function () {
                            if (that.blocks.visible) {
                                that.blocks.unhighlight(blk);
                            }
                        }, that.turtleDelay + that.waitTimes[turtle]);
                    }
                }
            }

            if ((that.backward[turtle].length > 0 && that.blocks.blockList[blk].connections[0] == null) || (that.backward[turtle].length === 0 && last(that.blocks.blockList[blk].connections) == null)) {
                if (!that.suppressOutput[turtle] && !that.justCounting[turtle]) {
                    // If we are at the end of the child flow, queue the
                    // unhighlighting of the parent block to the flow.
                    if (that.unhighlightQueue[turtle] === undefined) {
                        console.log('cannot find highlight queue for turtle ' + turtle);
                    } else if (that.parentFlowQueue[turtle].length > 0 && that.turtles.turtleList[turtle].queue.length > 0 && last(that.turtles.turtleList[turtle].queue).parentBlk !== last(that.parentFlowQueue[turtle])) {
                        that.unhighlightQueue[turtle].push(last(that.parentFlowQueue[turtle]));
                        // that.unhighlightQueue[turtle].push(that.parentFlowQueue[turtle].pop());
                    } else if (that.unhighlightQueue[turtle].length > 0) {
                        // The child flow is finally complete, so unhighlight.
                        setTimeout(function () {
                            if (that.blocks.visible) {
                                that.blocks.unhighlight(that.unhighlightQueue[turtle].pop());
                            } else {
                                that.unhighlightQueue[turtle].pop();
                            }
                        }, that.turtleDelay);
                    }
                }
            }

            // We don't update parameter blocks when running full speed.
            if (that.turtleDelay !== 0) {
                for (var pblk in that.parameterQueue[turtle]) {
                    that._updateParameterBlock(that, turtle, that.parameterQueue[turtle][pblk]);
                }
            }

            if (isflow) {
                that._runFromBlockNow(that, turtle, nextBlock, isflow, passArg, queueStart);
            }
            else{
                that._runFromBlock(that, turtle, nextBlock, isflow, passArg);
            }
        } else {
            // Make sure any unissued signals are dispatched.
            for (var b in that.endOfClampSignals[turtle]) {
                for (var i = 0; i < that.endOfClampSignals[turtle][b].length; i++) {
                    if (that.endOfClampSignals[turtle][b][i] != null) {
                        that.stage.dispatchEvent(that.endOfClampSignals[turtle][b][i]);
                    }
                }
            }

            // Make sure SVG path is closed.
            that.turtles.turtleList[turtle].closeSVG();

            // Mark the turtle as not running.
            that.turtles.turtleList[turtle].running = false;
            if (!that.turtles.running() && queueStart === 0) {
                that.onStopTurtle();
            }

            // Because flow can come from calc blocks, we are not
            // ensured that the turtle is really finished running
            // yet. Hence the timeout.
            __checkCompletionState = function () {
                if (!that.turtles.running() && queueStart === 0 && !that.justCounting[turtle]) {
                    if (that.runningLilypond) {
                        console.log('saving lilypond output:');
                        console.log(that.notationStaging);
                        saveLilypondOutput(that, _('My Project') + '.ly');
                        that.runningLilypond = false;
                    } else if (that.suppressOutput[turtle]) {
                        console.log('finishing compiling');
                        that.setPlaybackStatus();
                        that.compiling = false;
                        for (t in that.turtles.turtleList) {
                            that.turtles.turtleList[t].doPenUp();
                            that.turtles.turtleList[t].doSetXY(that._saveX[t], that._saveY[t]);
                            that.turtles.turtleList[t].color = that._saveColor[t];
                            that.turtles.turtleList[t].value = that._saveValue[t];
                            that.turtles.turtleList[t].chroma = that._saveChroma[t];
                            that.turtles.turtleList[t].stroke = that._saveStroke[t];
                            that.turtles.turtleList[t].canvasAlpha = that._saveCanvasAlpha[t];
                            that.turtles.turtleList[t].doSetHeading(that._saveOrientation[t]);
                            that.turtles.turtleList[t].penState = that._savePenState[t];
                        }
                    }

                    // Give the last note time to play.
                    setTimeout(function () {
                        that.suppressOutput[turtle] = false;
                        that.checkingCompletionState = false;

                        // Reset the cursor...
                        document.body.style.cursor = 'default';

                        // And save the session.
                        that.saveLocally();
                    }, 1000);
                } else if (that.suppressOutput[turtle]) {
                    setTimeout(function () {
                        __checkCompletionState();
                    }, 250);
                }
            };

            if (!that.turtles.running() && queueStart === 0 && !that.justCounting[turtle]) {
                if (!that.checkingCompletionState) {
                    that.checkingCompletionState = true;
                    setTimeout(function () {
                        __checkCompletionState();
                    }, 250);
                }
            }

            if (!that.suppressOutput[turtle] && !that.justCounting[turtle]) {
                // Nothing else to do... so cleaning up.
                if (that.turtles.turtleList[turtle].queue.length === 0 || blk !== last(that.turtles.turtleList[turtle].queue).parentBlk) {
                    setTimeout(function () {
                        if (that.blocks.visible) {
                            that.blocks.unhighlight(blk);
                        }
                    }, that.turtleDelay);
                }

                // Unhighlight any parent blocks still highlighted.
                for (var b in that.parentFlowQueue[turtle]) {
                    if (that.blocks.visible) {
                        that.blocks.unhighlight(that.parentFlowQueue[turtle][b]);
                    }
                }

                // Make sure the turtles are on top.
                var i = that.stage.getNumChildren() - 1;
                that.stage.setChildIndex(that.turtles.turtleList[turtle].container, i);
                that.refreshCanvas();
            }

            for (var arg in that.evalOnStopList) {
                eval(that.evalOnStopList[arg]);
            }

            if (!that.turtles.running() && queueStart === 0) {
                // TODO: Enable playback button here
                console.log('fin');
            }
        }
    };

    this._setMasterVolume = function (volume) {
        if (volume > 100) {
            volume = 100;
        } else if (volume < 0) {
            volume = 0;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.synth.setMasterVolume(volume);
        }
    };

    this._setSynthVolume = function (synth, volume) {
        if (volume > 100) {
            volume = 100;
        } else if (volume < 0) {
            volume = 0;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.synth.setVolume(synth, volume);
        }
    };

    this._processNote = function (noteValue, blk, turtle) {
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

        var vibratoRate = 0;
        var vibratoValue = 0;
        var vibratoIntensity = 0;
        var distortionAmount = 0;
        var tremoloFrequency = 0;
        var tremoloDepth = 0;
        var rate = 0;
        var octaves = 0;
        var baseFrequency = 0;
        var chorusRate = 0;
        var delayTime = 0;
        var chorusDepth = 0;
        var doVibrato = false;
        var doDistortion = false;
        var doTremolo = false;
        var doPhaser = false;
        var doChorus = false;
        var filters = null;

        // Apply any effects and filters associated with a custom timbre.
        if (this.inSetTimbre[turtle] && (turtle in this.instrumentNames) && last(this.instrumentNames[turtle])) {
            var name = last(this.instrumentNames[turtle]);

            if (name in instrumentsEffects) {
                var timbreEffects = instrumentsEffects[name];

                if (timbreEffects['vibratoActive']) {
                    vibratoRate = timbreEffects['vibratoRate'];
                    vibratoIntensity = timbreEffects['vibratoIntensity'];
                    doVibrato = true;
                }

                if (timbreEffects['distortionActive']) {
                    distortionAmount = timbreEffects['distortionAmount'];
                    doDistortion = true;
                }

                if (timbreEffects['tremoloActive']) {
                    tremoloFrequency = timbreEffects['tremoloFrequency'];
                    tremoloDepth = timbreEffects['tremoloDepth'];
                    doTremolo = true;
                }

                if (timbreEffects['phaserActive']) {
                    rate = timbreEffects['rate'];
                    octaves = timbreEffects['octaves'];
                    baseFrequency = timbreEffects['baseFrequency'];
                    doPhaser = true;
                }

                if (timbreEffects['chorusActive']) {
                    chorusRate = timbreEffects['chorusRate'];
                    delayTime = timbreEffects['delayTime'];
                    chorusDepth = timbreEffects['chorusDepth'];
                    doChorus = true;
                }
            }

            if (name in instrumentsFilters) {
                filters = instrumentsFilters[name];
            }
        }

        // Apply effects.
        if (this.vibratoRate[turtle].length > 0) {
            vibratoRate = last(this.vibratoRate[turtle]);
            vibratoIntensity = last(this.vibratoIntensity[turtle]);
            doVibrato = true;
        }

        if (this.distortionAmount[turtle].length > 0) {
            distortionAmount = last(this.distortionAmount[turtle]);
            doDistortion = true;
        }

        if (this.tremoloDepth[turtle].length > 0) {
            tremoloFrequency = last(this.tremoloFrequency[turtle]);
            tremoloDepth = last(this.tremoloDepth[turtle]);
            doTremolo = true;
        }

        if (this.rate[turtle].length > 0) {
            rate = last(this.rate[turtle]);
            octaves = last(this.octaves[turtle]);
            baseFrequency = last(this.baseFrequency[turtle]);
            doPhaser = true;
        }

        if (this.chorusRate[turtle].length > 0) {
            chorusRate = last(this.chorusRate[turtle]);
            delayTime = last(this.delayTime[turtle]);
            chorusDepth = last(this.chorusDepth[turtle]);
            doChorus = true;
        }

        var carry = 0;

        if (this.inCrescendo[turtle].length > 0 && this.crescendoDelta[turtle].length === 0) {
            this.inCrescendo[turtle].pop();
            for (var synth in this.synthVolume[turtle]) {
                this._setSynthVolume('default', last(this.synthVolume[turtle][synth]));
                this.playbackQueue[turtle].push([this.previousTurtleTime[turtle], 'setsynthvolume', synth, last(this.synthVolume[turtle][synth])]);
            }
        } else if (this.crescendoDelta[turtle].length > 0) {
            if (last(this.synthVolume[turtle]['default']) === last(this.crescendoInitialVolume[turtle]['default']) && !this.justCounting[turtle]) {
                this.notationBeginCrescendo(turtle, last(this.crescendoDelta[turtle]));
            }

            for (var synth in this.synthVolume[turtle]) {
                var len = this.synthVolume[turtle][synth].length;
                this.synthVolume[turtle][synth][len - 1] += last(this.crescendoDelta[turtle]);
                console.log(synth + '= ' + this.synthVolume[turtle][synth][len - 1]);
                this.playbackQueue[turtle].push([this.previousTurtleTime[turtle], 'setsynthvolume', synth, last(this.synthVolume[turtle][synth])]);
                if (!this.suppressOutput[turtle]) {
                    this._setSynthVolume(synth, last(this.synthVolume[turtle][synth]));
                }
            }
        }

        if (this.inTimbre) {
            var noteObj = this.getNote(this.notePitches[turtle][last(this.inNoteBlock[turtle])][0], this.noteOctaves[turtle][last(this.inNoteBlock[turtle])][0], this.noteTranspositions[turtle][0], this.keySignature[turtle]);
            this.timbre.notesToPlay.push([noteObj[0] + noteObj[1], 1 / noteBeatValue]);
        } else if (this.inMatrix) {
            if (this.inNoteBlock[turtle].length > 0) {
                this.pitchTimeMatrix.addColBlock(blk, 1);
                for (var i = 0; i < this.pitchBlocks.length; i++) {
                    this.pitchTimeMatrix.addNode(this.pitchBlocks[i], blk, 0);
                }

                for (var i = 0; i < this.drumBlocks.length; i++) {
                    this.pitchTimeMatrix.addNode(this.drumBlocks[i], blk, 0);
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
            if (this.firstNoteTime == null) {  // && !this.suppressOutput[turtle]) {
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
                    if (this.tieNote[turtle].length !== this.notePitches[turtle][last(this.inNoteBlock[turtle])].length) {
                        match = false;
                    } else {
                        for (var i = 0; i < this.tieNote[turtle].length; i++) {
                            if (this.tieNote[turtle][i][0] != this.notePitches[turtle][last(this.inNoteBlock[turtle])][i]) {
                                match = false;
                                break;
                            }

                            if (this.tieNote[turtle][i][1] != this.noteOctaves[turtle][last(this.inNoteBlock[turtle])][i]) {
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
                        for (var i = 0; i < this.notePitches[turtle][last(this.inNoteBlock[turtle])].length; i++) {
                            saveNote.push([this.notePitches[turtle][last(this.inNoteBlock[turtle])][i], this.noteOctaves[turtle][last(this.inNoteBlock[turtle])][i], this.noteCents[turtle][last(this.inNoteBlock[turtle])][i], this.noteHertz[turtle][last(this.inNoteBlock[turtle])][i]]);
                        }

                        // Swap in the previous note.
                        this.notePitches[turtle][last(this.inNoteBlock[turtle])] = [];
                        this.noteOctaves[turtle][last(this.inNoteBlock[turtle])] = [];
                        this.noteCents[turtle][last(this.inNoteBlock[turtle])] = [];
                        this.noteHertz[turtle][last(this.inNoteBlock[turtle])] = [];
                        for (var i = 0; i < this.tieNote[turtle].length; i++) {
                            this.notePitches[turtle][last(this.inNoteBlock[turtle])].push(this.tieNote[turtle][i][0]);
                            this.noteOctaves[turtle][last(this.inNoteBlock[turtle])].push(this.tieNote[turtle][i][1]);
                            this.noteCents[turtle][last(this.inNoteBlock[turtle])].push(this.tieNote[turtle][i][2]);
                            this.noteHertz[turtle][last(this.inNoteBlock[turtle])].push(this.tieNote[turtle][i][3]);
                        }

                        this.tieNote[turtle] = [];

                        if (!this.justCounting[turtle]) {
                            // Remove the note from the Lilypond list.
                            for (var i = 0; i < this.notePitches[turtle][last(this.inNoteBlock[turtle])].length; i++) {
                                this.notationRemoveTie(turtle);
                            }
                        }

                        this._processNote(tmpBeatValue, blk, turtle);

                        // Restore the current note.
                        this.tie[turtle] = true;
                        this.notePitches[turtle][last(this.inNoteBlock[turtle])] = [];
                        this.noteOctaves[turtle][last(this.inNoteBlock[turtle])] = [];
                        this.noteCents[turtle][last(this.inNoteBlock[turtle])] = [];
                        this.noteHertz[turtle][last(this.inNoteBlock[turtle])] = [];
                        for (var i = 0; i < saveNote.length; i++) {
                            this.notePitches[turtle][last(this.inNoteBlock[turtle])].push(saveNote[i][0]);
                            this.noteOctaves[turtle][last(this.inNoteBlock[turtle])].push(saveNote[i][1]);
                            this.noteCents[turtle][last(this.inNoteBlock[turtle])].push(saveNote[i][2]);
                            this.noteHertz[turtle][last(this.inNoteBlock[turtle])].push(saveNote[i][3]);
                        }
                    }
                }

                if (this.tieCarryOver[turtle] === 0) {
                    this.tieNote[turtle] = [];
                    this.tieCarryOver[turtle] = noteBeatValue;
                    for (var i = 0; i < this.notePitches[turtle][last(this.inNoteBlock[turtle])].length; i++) {
                        this.tieNote[turtle].push([this.notePitches[turtle][last(this.inNoteBlock[turtle])][i], this.noteOctaves[turtle][last(this.inNoteBlock[turtle])][i], this.noteCents[turtle][last(this.inNoteBlock[turtle])][i], this.noteHertz[turtle][last(this.inNoteBlock[turtle])][i]]);
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
            var duration = noteBeatValue * this.beatFactor[turtle];
            // For the outermost note (when nesting), calculate the
            // time for the next note.
            if (duration > 0) {
                this.previousTurtleTime[turtle] = this.turtleTime[turtle];
                if (this.inNoteBlock[turtle].length === 1) {
                    this.turtleTime[turtle] += ((bpmFactor / duration) + (this.noteDelay / 1000));
                    if (!this.suppressOutput[turtle]) {
                        this._doWait(turtle, Math.max(((bpmFactor / duration) + (this.noteDelay / 1000)) - turtleLag, 0));
                    }
                }
            }

            var forceSilence = false;
            if (this.skipFactor[turtle] > 1) {
                if (this.skipIndex[turtle] % this.skipFactor[turtle] > 0) {
                    forceSilence = true;
                }
                this.skipIndex[turtle] += 1;
            }

            var that = this;
            __playnote = function () {
                // Stop playing notes if the stop button is pressed.
                if (that.stopTurtle) {
                    return;
                }

                that.notesPlayed[turtle] += (1 / (noteValue * that.beatFactor[turtle]));

                var notes = [];
                var drums = [];
                var insideChord = -1;
                if ((that.notePitches[turtle][last(that.inNoteBlock[turtle])].length + that.oscList[turtle][last(that.inNoteBlock[turtle])].length) > 1) {
                    if (turtle in that.notationStaging && !that.justCounting[turtle]) {
                        var insideChord = that.notationStaging[turtle].length + 1;
                    } else {
                        var insideChord = 1;
                    }
                }

                that.noteBeat[turtle][blk] = noteBeatValue;

                // Do not process a note if its duration is equal
                // to infinity or NaN.
                if (!isFinite(duration)) {
                    return;
                }

                // Use the beatValue of the first note in
                // the group since there can only be one.
                if (that.staccato[turtle].length > 0) {
                    var staccatoBeatValue = last(that.staccato[turtle]);
                    if (staccatoBeatValue < 0) {
                        // slur
                        var beatValue = bpmFactor / ((noteBeatValue) * that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])][0]) + bpmFactor / (-staccatoBeatValue * that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])][0]);
                    } else if (staccatoBeatValue > noteBeatValue) {
                        // staccato
                        var beatValue = bpmFactor / (staccatoBeatValue * that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])][0]);
                    } else {
                        var beatValue = bpmFactor / (noteBeatValue * that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])][0]);
                    }
                } else if (that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].length > 0) {
                    var beatValue = bpmFactor / (noteBeatValue * that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])][0]);
                } else {
                    var beatValue = bpmFactor / noteBeatValue;
                }

                if (doVibrato) {
                    vibratoValue = beatValue * (duration / vibratoRate);
                }

                // Process pitches
                if (that.notePitches[turtle][last(that.inNoteBlock[turtle])].length > 0) {
                    for (var i = 0; i < that.notePitches[turtle][last(that.inNoteBlock[turtle])].length; i++) {
                        if (that.notePitches[turtle][last(that.inNoteBlock[turtle])][i] === 'rest' || forceSilence) {
                            note = 'R';
                        } else {
                            var noteObj = that.getNote(that.notePitches[turtle][last(that.inNoteBlock[turtle])][i], that.noteOctaves[turtle][last(that.inNoteBlock[turtle])][i], that.noteTranspositions[turtle][i], that.keySignature[turtle]);

                            // If the cents for this note != 0, then
                            // we need to convert to frequency and add
                            // in the cents.
                            if (that.noteCents[turtle][last(that.inNoteBlock[turtle])][i] !== 0) {
                                if (that.noteHertz[turtle][last(that.inNoteBlock[turtle])][i] !== 0 && that.noteTranspositions[turtle][i] === 0) {
                                    var note = that.noteHertz[turtle][last(that.inNoteBlock[turtle])][i];
                                } else {
                                    var note = Math.floor(pitchToFrequency(noteObj[0], noteObj[1], that.noteCents[turtle][last(that.inNoteBlock[turtle])][i], that.keySignature[turtle]));
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
                                if (i === 0 && !that.justCounting[turtle]) {
                                    that.notationInsertTie(turtle);
                                }
                                originalDuration = 1 / ((1 / duration) - (1 / carry));
                            } else {
                                originalDuration = duration;
                            }
                            if (!that.justCounting[turtle]) {
                                that.updateNotation(note, originalDuration, turtle, insideChord);
                            }
                        } else if (that.tieCarryOver[turtle] > 0) {
                            if (!that.justCounting[turtle]) {
                                that.updateNotation(note, that.tieCarryOver[turtle], turtle, insideChord);
                            }
                        }
                    }

                    if (!that.justCounting[turtle]) {
                        console.log('notes to play ' + notes + ' ' + noteBeatValue);
                    } else {
                        console.log('notes to count ' + notes + ' ' + noteBeatValue);
                    }

                    if (!that.suppressOutput[turtle]) {
                        that.turtles.turtleList[turtle].blink(duration, last(that.masterVolume));
                    }

                    if (notes.length > 0) {
                        var len = notes[0].length;

                        // Deprecated
                        if (typeof(notes[i]) === 'string') {
                            that.currentNotes[turtle] = notes[0].slice(0, len - 1);
                            that.currentOctaves[turtle] = parseInt(notes[0].slice(len - 1));
                        }

                        if (that.turtles.turtleList[turtle].drum) {
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

                        if (duration > 0) {
                            if (_THIS_IS_MUSIC_BLOCKS_ && !forceSilence) {
                                // Parameters related to effects
                                var paramsEffects = {
                                    'doVibrato': false,
                                    'doDistortion': false,
                                    'doTremolo': false,
                                    'doPhaser': false,
                                    'doChorus': false,
                                    'vibratoIntensity': vibratoIntensity,
                                    'vibratoFrequency': vibratoValue,
                                    'distortionAmount': distortionAmount,
                                    'tremoloFrequency': tremoloFrequency,
                                    'tremoloDepth': tremoloDepth,
                                    'rate': rate,
                                    'octaves': octaves,
                                    'baseFrequency': baseFrequency,
                                    'chorusRate': chorusRate,
                                    'delayTime': delayTime,
                                    'chorusDepth': chorusDepth
                                };

                                __hasParamEffect = function () {
                                    return paramsEffects.doVibrato || paramsEffects.doDistortion || paramsEffects.doTremolo || paramsEffects.doPhaser || paramsEffects.doChous;
                                }

                                if (that.oscList[turtle][last(that.inNoteBlock[turtle])].length > 0) {
                                    if (notes.length > 1) {
                                        that.errorMsg(last(that.oscList[turtle][last(that.inNoteBlock[turtle])]) + ': ' +  _('synth cannot play chords.'), blk);
                                    }

                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(notes, beatValue, last(that.oscList[turtle][last(that.inNoteBlock[turtle])]), paramsEffects, null);
                                    }

                                    if (!that.justCounting[turtle]) {
                                        if (__hasParamEffect()) {
                                            that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes, beatValue, last(that.oscList[turtle][last(that.inNoteBlock[turtle])]), paramsEffects, null]);
                                        } else {
                                            that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes, beatValue, last(that.oscList[turtle][last(that.inNoteBlock[turtle])]), null, null]);
                                        }
                                    }
                                } else if (that.drumStyle[turtle].length > 0) {
                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(notes, beatValue, last(that.drumStyle[turtle]), null, null);
                                    }

                                    if (!that.justCounting[turtle]) {
                                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes, beatValue, that.drumStyle[turtle], null, null]);
                                    }
                                } else if (that.turtles.turtleList[turtle].drum) {
                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(notes, beatValue, 'drum', null, null);
                                    }

                                    if (!that.justCounting[turtle]) {
                                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes, beatValue, 'drum', null, null]);
                                    }
                                } else {
                                    for (var d = 0; d < notes.length; d++) {
                                        if (notes[d] in that.pitchDrumTable[turtle]) {
                                            if (!that.suppressOutput[turtle]) {
                                                that.synth.trigger(notes[d], beatValue, that.pitchDrumTable[turtle][notes[d]], null, null);
                                            }

                                            if (!that.justCounting[turtle]) {
                                                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, that.pitchDrumTable[turtle][notes[d]], null, null]);
                                            }
                                        } else if (turtle in that.instrumentNames && last(that.instrumentNames[turtle])) {
                                            if (!that.suppressOutput[turtle]) {
                                                that.synth.trigger(notes[d], beatValue, last(that.instrumentNames[turtle]), paramsEffects, filters);
                                            }

                                            if (!that.justCounting[turtle]) {
                                                if (__hasParamEffect()) {
                                                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, last(that.instrumentNames[turtle]), paramsEffects, filters]);
                                                } else {
                                                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, last(that.instrumentNames[turtle]), null, filters]);
                                                }
                                            }
                                        } else if (turtle in that.voices && last(that.voices[turtle])) {
                                            if (!that.suppressOutput[turtle]) {
                                                that.synth.trigger(notes[d], beatValue, last(that.voices[turtle]), paramsEffects, null);
                                            }

                                            if (!that.justCounting[turtle]) {
                                                if (__hasParamEffect()) {
                                                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, last(that.voices[turtle]), paramsEffects, null]);
                                                } else {
                                                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, last(that.voices[turtle]), null, null]);
                                                }
                                            }
                                        } else {
                                            if (!that.suppressOutput[turtle]) {
                                                that.synth.trigger(notes[d], beatValue, 'default', paramsEffects, null);
                                            }

                                            if (!that.justCounting[turtle]) {
                                                if (__hasParamEffect()) {
                                                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, 'default', paramsEffects, null]);
                                                } else {
                                                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, 'default', null, null]);
                                                }
                                            }
                                        }
                                    }
                                }

                            }
                        }

                        that.lastNotePlayed[turtle] = [notes[0], noteBeatValue];
                        that.noteStatus[turtle] = [notes, noteBeatValue];
                    }
                }

                // Process drums
                if (that.noteDrums[turtle][last(that.inNoteBlock[turtle])].length > 0) {
                    for (var i = 0; i < that.noteDrums[turtle][last(that.inNoteBlock[turtle])].length; i++) {
                        drums.push(that.noteDrums[turtle][last(that.inNoteBlock[turtle])][i]);
                    }

                    // If it is > 0, we already counted this note
                    // (e.g. pitch & drum combination).
                    if (that.notePitches[turtle][last(that.inNoteBlock[turtle])].length === 0) {
                        if (!that.justCounting[turtle]) {
                            console.log('notes to play ' + notes + ' ' + noteBeatValue);
                        } else {
                            console.log('notes to count ' + notes + ' ' + noteBeatValue);
                        }

                        if (!that.suppressOutput[turtle]) {
                            that.turtles.turtleList[turtle].blink(duration, last(that.masterVolume));
                        }
                    }

                    if (duration > 0) {
                        if (_THIS_IS_MUSIC_BLOCKS_ && !forceSilence) {
                            for (var i = 0; i < drums.length; i++) {
                                if (that.drumStyle[turtle].length > 0) {
                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(['C2'], beatValue, last(that.drumStyle[turtle]), null, null);
                                    }

                                    if (!that.justCounting[turtle]) {
                                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', ['C2'], beatValue, last(that.drumStyle[turtle]), null, null]);
                                    }
                                } else {
                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(['C2'], beatValue, drums[i], null, null);
                                    }

                                    if (!that.justCounting[turtle]) {
                                        that.playbackQueue[turtle].push([that.previousTurtleTime[turtle], 'notes', ['C2'], beatValue, drums[i], null, null]);
                                    }
                                }
                            }
                        }
                    }
                }

                if (!that.suppressOutput[turtle]) {
                    if (_THIS_IS_MUSIC_BLOCKS_ && !forceSilence) {
                        that.synth.start();
                    }
                }

                that._dispatchTurtleSignals(turtle, beatValue, blk, noteBeatValue);
                // After the note plays, clear the embedded graphics queue.
                that.embeddedGraphics[turtle][blk] = [];

                // Ensure note value block unhighlights after note plays.
                setTimeout(function () {
                    if (that.blocks.visible) {
                        that.blocks.unhighlight(blk);
                    }
                }, beatValue * 1000);
            };

            if (this.noteDelay === 0 || this.suppressOutput[turtle]) {
                __playnote();
            } else {
                setTimeout(function () {
                    __playnote();
                }, this.noteDelay);
            }
        }

        this.pushedNote[turtle] = false;
    };

    this.playback = function (whichMouse) {
        if (this.turtles.running()) {
            if (this.playbackTime === 0) {
                return;
            } else {
                this.stopTurtle = true;
                return;
            }
        } else if (this.playbackTime === 0) {
            var inFillClamp = false;
            var inHollowLineClamp = false;
        }

        // We need to sort the playback queue by time (as graphics
        // embedded in embedded notes can be out of order)
        if (this.turtles.turtleList.length > 0) {
            var that = this;
            for (t in this.turtles.turtleList) {
                var playbackList = [];
                for (var i = 0; i < this.playbackQueue[t].length; i++) {
                    playbackList.push([i, this.playbackQueue[t][i]]);
                }

                var sortedList = playbackList.sort(
                    function(a, b) {
                        if (a[1][0] === b[1][0]) {
                            // Preserve original order if the events
                            // have the same time stamp.
                            return a[0] - b[0];
                        } else {
                            return a[1][0] - b[1][0];
                        }
                    }
                );
            }
        }

        var d = new Date();
        this.firstNoteTime = d.getTime() - 1000 * this.playbackTime;

        var that = this;

        __playbackLoop = function (turtle, idx) {
            that.playbackTime = that.playbackQueue[turtle][idx][0];

            if (!that.stopTurtle) {
                switch(that.playbackQueue[turtle][idx][1]) {
                case 'fill':
                    if (inFillClamp) {
                        that.turtles.turtleList[turtle].doEndFill();
                        inFillClamp = false;
                    } else {
                        that.turtles.turtleList[turtle].doStartFill();
                        inFillClamp = true;
                    }
                    break;
                case 'hollowline':
                    if (inHollowLineClamp) {
                        that.turtles.turtleList[turtle].doEndHollowLine();
                        inHollowLineClamp = false;
                    } else {
                        that.turtles.turtleList[turtle].doStartHollowLine();
                        inHollowLineClamp = true;
                    }
                    break;
                case 'notes':
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        that.turtles.turtleList[turtle].blink(that.playbackQueue[turtle][idx][3], 50);
                        that.synth.trigger(that.playbackQueue[turtle][idx][2], that.playbackQueue[turtle][idx][3], that.playbackQueue[turtle][idx][4], that.playbackQueue[turtle][idx][5], that.playbackQueue[turtle][idx][6]);
                    }
                    break;
                case 'controlpoint1':
                    that.cp1x[turtle] = that.playbackQueue[turtle][idx][2];
                    that.cp1y[turtle] = that.playbackQueue[turtle][idx][3];
                    break;
                case 'controlpoint2':
                    that.cp2x[turtle] = that.playbackQueue[turtle][idx][2];
                    that.cp2y[turtle] = that.playbackQueue[turtle][idx][3];
                    break;
                case 'bezier':
                    that.turtles.turtleList[turtle].doBezier(that.cp1x[turtle], that.cp1y[turtle], that.cp2x[turtle], that.cp2y[turtle], that.playbackQueue[turtle][idx][2], that.playbackQueue[turtle][idx][3]);
                    break;
                case 'show':
                    that._processShow(turtle, that.playbackQueue[turtle][idx][2], that.playbackQueue[turtle][idx][3]);
                    break;
                case 'speak':
                    that._processSpeak(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'print':
                    that.textMsg(that.playbackQueue[turtle][idx][2].toString());
                    break;
                case 'setvolume':
                    that._setMasterVolume(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'setsynthvolume':
                    that._setSynthVolume(that.playbackQueue[turtle][idx][2], that.playbackQueue[turtle][idx][3]);
                    break;
                case 'arc':
                    that.turtles.turtleList[turtle].doArc(that.playbackQueue[turtle][idx][2], that.playbackQueue[turtle][idx][3]);
                    break;
                case 'setxy':
                    that.turtles.turtleList[turtle].doSetXY(that.playbackQueue[turtle][idx][2], that.playbackQueue[turtle][idx][3]);
                    break;
                case 'forward':
                    that.turtles.turtleList[turtle].doForward(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'right':
                    that.turtles.turtleList[turtle].doRight(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'setheading':
                    that.turtles.turtleList[turtle].doSetHeading(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'clear':
                    that.svgBackground = true;
                    that.turtles.turtleList[turtle].penState = false;
                    that.turtles.turtleList[turtle].doSetHeading(0);
                    that.turtles.turtleList[turtle].doSetXY(0, 0);
                    that.turtles.turtleList[turtle].penState = true;
                    // that.turtles.turtleList[turtle].doClear(true, true, true);
                    break;
                case 'setcolor':
                    that.turtles.turtleList[turtle].doSetColor(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'sethue':
                    that.turtles.turtleList[turtle].doSetHue(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'setshade':
                    that.turtles.turtleList[turtle].doSetValue(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'settranslucency':
                    that.turtles.turtleList[turtle].doSetPenAlpha(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'setgrey':
                    that.turtles.turtleList[turtle].doSetChroma(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'setpensize':
                    that.turtles.turtleList[turtle].doSetPensize(that.playbackQueue[turtle][idx][2]);
                    break;
                case 'penup':
                    that.turtles.turtleList[turtle].doPenUp();
                    break;
                case 'pendown':
                    that.turtles.turtleList[turtle].doPenDown();
                    break;
                default:
                    console.log(that.playbackQueue[turtle][idx][1]);
                    break;
                }

                var d = new Date();
                var elapsedTime = d.getTime() - that.firstNoteTime;
                idx += 1;
                if (that.playbackQueue[turtle].length > idx) {
                    var timeout = that.playbackQueue[turtle][idx][0] * 1000 - elapsedTime;
                    if (timeout < 0) {
                        timeout = 0;
                    }

                    setTimeout(function () {
                        __playbackLoop(turtle, idx);
                    }, timeout);
                } else {
                    if (turtle < that.turtles.turtleList.length) {
                        that.turtles.turtleList[turtle].running = false;
                    }

                    if (!that.turtles.running()) {
                        that.onStopTurtle();
                        that.playbackTime = 0;
                    }
                }
            } else {
                that.turtles.turtleList[turtle].running = false;
            }
        };

        __playback = function (turtle) {
            setTimeout(function () {
                __playbackLoop(turtle, 0);
            }, that.playbackQueue[turtle][0][0] * 1000);
        };

        __resumePlayback = function (turtle) {
            for (var idx = 0; idx < that.playbackQueue[turtle].length; idx++) {
                if (that.playbackQueue[turtle][idx][0] >= that.playbackTime) {
                    break;
                }
            }

            console.log('resume index: ' + idx);

            if (idx < that.playbackQueue[turtle].length) {
                __playbackLoop(turtle, idx);
            }
        };

        this.onRunTurtle();
        this.stopTurtle = false;

        if (whichMouse < 0) {
            for (var turtle in this.playbackQueue) {
                if (this.playbackQueue[turtle].length > 0) {
                    if (turtle < this.turtles.turtleList.length) {
                        this.turtles.turtleList[turtle].running = true;
                    }

                    if (this.playbackTime > 0) {
                        console.log('resuming play at ' + this.playbackTime);
                        __resumePlayback(turtle);
                    } else {
                        console.log('play');
                        __playback(turtle);
                    }
                }
            }
        } else if (whichMouse < this.turtles.turtleList.length) {
            this.turtles.turtleList[whichMouse].running = true;
            __playback(whichMouse);
        }
    };

    this._dispatchTurtleSignals = function (turtle, beatValue, blk, noteBeatValue) {
        // When turtle commands (forward, right, arc) are inside of notes,
        // they are run progressively over the course of the note duration.
        if (this.embeddedGraphics[turtle][blk].length === 0) {
            return;
        }

        var that = this;
        var inFillClamp = false;
        var inHollowLineClamp = false;
        var suppressOutput = this.suppressOutput[turtle];

        function __pen(turtle, name, arg, timeout) {

            function _penSwitch(name) {
                switch(name) {
                case 'penup':
                    that.turtles.turtleList[turtle].doPenUp();
                    break;
                case 'pendown':
                    that.turtles.turtleList[turtle].doPenDown();
                    break;
                case 'setcolor':
                    that.turtles.turtleList[turtle].doSetColor(arg);
                    break;
                case 'sethue':
                    that.turtles.turtleList[turtle].doSetHue(arg);
                    break;
                case 'setshade':
                    that.turtles.turtleList[turtle].doSetValue(arg);
                    break;
                case 'settranslucency':
                    that.turtles.turtleList[turtle].doSetPenAlpha(arg);
                    break;
                case 'setgrey':
                    that.turtles.turtleList[turtle].doSetChroma(arg);
                    break;
                case 'setpensize':
                    that.turtles.turtleList[turtle].doSetPensize(arg);
                    break;
                }
            };

            if (suppressOutput) {
                _penSwitch(name);
            } else {
                setTimeout(function () {
                    _penSwitch(name);
                }, timeout);
            }
        };

        function __clear(turtle, timeout) {
            if (that.suppressOutput[turtle]) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doSetXY(0, 0);
                that.turtles.turtleList[turtle].doSetHeading(0);
                that.turtles.turtleList[turtle].penState = savedPenState;
                that.svgBackground = true;
            } else {
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doSetHeading(0);
                that.turtles.turtleList[turtle].doSetXY(0, 0);
                that.turtles.turtleList[turtle].penState = true;
                // that.turtles.turtleList[turtle].doClear(true, true, true);
            }
        };

        function __right(turtle, arg, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doRight(arg);
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function () {
                    that.turtles.turtleList[turtle].doRight(arg);
                }, timeout);
            }
        };

        function __setheading(turtle, arg, timeout) {
            if (suppressOutput) {
                that.turtles.turtleList[turtle].doSetHeading(arg);
            } else {
                setTimeout(function () {
                    that.turtles.turtleList[turtle].doSetHeading(arg);
                }, timeout);
            }
        };

        function __forward(turtle, arg, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doForward(arg);
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function () {
                    that.turtles.turtleList[turtle].doForward(arg);
                }, timeout);
            }
        };

        function __setxy(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doSetXY(arg1, arg2);
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function () {
                    that.turtles.turtleList[turtle].doSetXY(arg1, arg2);
                }, timeout);
            }
        };

        function __show(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                return;
            }

            setTimeout(function () {
                that._processShow(turtle, arg1, arg2);
            }, timeout);
        };

        function __speak(turtle, arg, timeout) {
            if (suppressOutput) {
                return;
            }

            setTimeout(function () {
                that._processSpeak(arg);
            }, timeout);
        };

        function __print(arg, timeout) {
            if (suppressOutput) {
                return;
            }

            setTimeout(function () {
                that.textMsg(arg.toString());
            }, timeout);
        };

        function __arc(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doArc(arg1, arg2);
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function () {
                    that.turtles.turtleList[turtle].doArc(arg1, arg2);
                }, timeout);
            }
        };

        function __cp1(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                that.cp1x[turtle] = arg1;
                that.cp1y[turtle] = arg2;
            } else {
                setTimeout(function () {
                    that.cp1x[turtle] = arg1;
                    that.cp1y[turtle] = arg2;
                }, timeout);
            }
        };

        function __cp2(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                that.cp2x[turtle] = arg1;
                that.cp2y[turtle] = arg2;
            } else {
                setTimeout(function () {
                    that.cp2x[turtle] = arg1;
                    that.cp2y[turtle] = arg2;
                }, timeout);
            }
        };

        function __bezier(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doBezier(that.cp1x[turtle], that.cp1y[turtle], that.cp2x[turtle], that.cp2y[turtle], arg1, arg2);
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function () {
                    that.turtles.turtleList[turtle].doBezier(that.cp1x[turtle], that.cp1y[turtle], that.cp2x[turtle], that.cp2y[turtle], arg1, arg2);
                }, timeout);
            }
        };

        function __fill(turtle, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                if (inFillClamp) {
                    that.turtles.turtleList[turtle].doEndFill();
                    inFillClamp = false;
                } else {
                    that.turtles.turtleList[turtle].doStartFill();
                    inFillClamp = true;
                }

                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function () {
                    if (inFillClamp) {
                        that.turtles.turtleList[turtle].doEndFill();
                        inFillClamp = false;
                    } else {
                        that.turtles.turtleList[turtle].doStartFill();
                        inFillClamp = true;
                    }
                }, timeout);
            }
        };

        function __hollowline(turtle, timeout) {
            if (suppressOutput) {
                if (inHollowLineClamp) {
                    that.turtles.turtleList[turtle].doEndHollowLine();
                    inHollowLineClamp = false;
                } else {
                    that.turtles.turtleList[turtle].doStartHollowLine();
                    inHollowLineClamp = true;
                }
            } else {
                setTimeout(function () {
                    if (inHollowLineClamp) {
                        that.turtles.turtleList[turtle].doEndHollowLine();
                        inHollowLineClamp = false;
                    } else {
                        that.turtles.turtleList[turtle].doStartHollowLine();
                        inHollowLineClamp = true;
                    }
                }, timeout);
            }
        };

        var extendedGraphicsCounter = 0;
        for (var i = 0; i < this.embeddedGraphics[turtle][blk].length; i++) {
            var b = this.embeddedGraphics[turtle][blk][i];
            switch (this.blocks.blockList[b].name) {
            case 'forward':
            case 'back':
            case 'right':
            case 'left':
            case 'arc':
                extendedGraphicsCounter += 1;
                break;
            default:
                break;
            }
        }

        var stepTime = beatValue * 1000 / NOTEDIV;

        // We do each graphics action sequentially, so we need to
        // divide stepTime by the length of the embedded graphics
        // array.
        if (extendedGraphicsCounter > 0) {
            var stepTime = stepTime / extendedGraphicsCounter;
        }

        var waitTime = 0;

        // We want to update the turtle graphics every 50ms within a note.
        if (stepTime > 200) {
            this.dispatchFactor[turtle] = 0.25;
        } else if (stepTime > 100) {
            this.dispatchFactor[turtle] = 0.5;
        } else if (stepTime > 50) {
            this.dispatchFactor[turtle] = 1;
        } else if (stepTime > 25) {
            this.dispatchFactor[turtle] = 2;
        } else if (stepTime > 12.5) {
            this.dispatchFactor[turtle] = 4;
        } else {
            this.dispatchFactor[turtle] = 8;
        }

        for (var i = 0; i < this.embeddedGraphics[turtle][blk].length; i++) {
            var b = this.embeddedGraphics[turtle][blk][i];
            var name = this.blocks.blockList[b].name;
            switch(name) {
            case 'setcolor':
            case 'sethue':
            case 'setshade':
            case 'settranslucency':
            case 'setgrey':
            case 'setpensize':
                var arg = this.parseArg(this, turtle, this.blocks.blockList[b].connections[1], b, this.receivedArg);
                __pen(turtle, name, arg, waitTime);

                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, name, arg]);
                break;
            case 'penup':
            case 'pendown':
                if (!suppressOutput) {
                    __pen(turtle, name, null, waitTime);
                }

                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, name]);
                break;
            case 'clear':
                __clear(turtle, waitTime);
                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'clear']);
                break;
            case 'fill':
                __fill(turtle, waitTime);
                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'fill']);
                break;
            case 'hollowline':
                __hollowline(turtle, waitTime);

                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'hollowline']);
                break;
            case 'controlpoint1':
                var arg1 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[1], b, this.receivedArg);
                var arg2 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[2], b, this.receivedArg);
                __cp1(turtle, arg1, arg2, waitTime);

                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'controlpoint1', arg1, arg2]);
                break;
            case 'controlpoint2':
                var arg1 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[1], b, this.receivedArg);
                var arg2 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[2], b, this.receivedArg);
                __cp2(turtle, arg1, arg2, waitTime);

                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'controlpoint2', arg1, arg2]);
                break;
            case 'bezier':
                // TODO: Is there a reasonable way to break the bezier
                // curve up into small steps?
                var arg1 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[1], b, this.receivedArg);
                var arg2 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[2], b, this.receivedArg);
                __bezier(turtle, arg1, arg2, waitTime);
                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'bezier', arg1, arg2]);
                break;
            case 'setheading':
                var arg = that.parseArg(that, turtle, that.blocks.blockList[b].connections[1], b, that.receivedArg);
                __setheading(turtle, arg, waitTime);
                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'setheading', arg]);
                break;
            case 'right':
                var arg = that.parseArg(that, turtle, that.blocks.blockList[b].connections[1], b, that.receivedArg);
                for (var t = 0; t < (NOTEDIV / this.dispatchFactor[turtle]); t++) {
                    var deltaTime = waitTime + t * stepTime * this.dispatchFactor[turtle];
                    var deltaArg = arg / (NOTEDIV / that.dispatchFactor[turtle]);
                    __right(turtle, deltaArg, deltaTime);
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + deltaTime / 1000, 'right', deltaArg]);
                }

                waitTime += NOTEDIV * stepTime;
                break;
            case 'left':
                var arg = that.parseArg(that, turtle, that.blocks.blockList[b].connections[1], b, that.receivedArg);
                for (var t = 0; t < (NOTEDIV / this.dispatchFactor[turtle]); t++) {
                    var deltaTime = waitTime + t * stepTime * this.dispatchFactor[turtle];
                    var deltaArg = arg / (NOTEDIV / that.dispatchFactor[turtle]);
                    __right(turtle, -deltaArg, deltaTime);
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + deltaTime / 1000, 'right', -deltaArg]);
                }

                waitTime += NOTEDIV * stepTime;
                break;
            case 'forward':
                var arg = that.parseArg(that, turtle, that.blocks.blockList[b].connections[1], b, that.receivedArg);
                for (var t = 0; t < (NOTEDIV / this.dispatchFactor[turtle]); t++) {
                    var deltaTime = waitTime + t * stepTime * this.dispatchFactor[turtle];
                    var deltaArg = arg / (NOTEDIV / that.dispatchFactor[turtle]);
                    __forward(turtle, deltaArg, deltaTime);
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + deltaTime / 1000, 'forward', deltaArg]);
                }

                waitTime += NOTEDIV * stepTime;
                break;
            case 'back':
                var arg = that.parseArg(that, turtle, that.blocks.blockList[b].connections[1], b, that.receivedArg);
                for (var t = 0; t < (NOTEDIV / this.dispatchFactor[turtle]); t++) {
                    var deltaTime = waitTime + t * stepTime * this.dispatchFactor[turtle];
                    var deltaArg = arg / (NOTEDIV / that.dispatchFactor[turtle]);
                    __forward(turtle, -deltaArg, deltaTime);
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + deltaTime / 1000, 'forward', -deltaArg]);
                }

                waitTime += NOTEDIV * stepTime;
                break;
            case 'setxy':
                var arg1 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[1], b, this.receivedArg);
                var arg2 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[2], b, this.receivedArg);
                __setxy(turtle, arg1, arg2, waitTime);
                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'setxy', arg1, arg2]);
                break;
            case 'show':
                var arg1 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[1], b, this.receivedArg);
                var arg2 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[2], b, this.receivedArg);
                __show(turtle, arg1, arg2, waitTime);
                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'show', arg1, arg2]);
                break;
            case 'speak':
                var arg = this.parseArg(this, turtle, this.blocks.blockList[b].connections[1], b, this.receivedArg);
                __speak(turtle, arg, waitTime);
                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'speak', arg]);
                break;
            case 'print':
                var arg = this.parseArg(this, turtle, this.blocks.blockList[b].connections[1], b, this.receivedArg);
                __print(arg, waitTime);
                that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + waitTime / 1000, 'print', arg]);
                break;
            case 'arc':
                var arg1 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[1], b, this.receivedArg);
                var arg2 = this.parseArg(this, turtle, this.blocks.blockList[b].connections[2], b, this.receivedArg);
                for (var t = 0; t < (NOTEDIV / this.dispatchFactor[turtle]); t++) {
                    var deltaTime = waitTime + t * stepTime * this.dispatchFactor[turtle];
                    var deltaArg = arg1 / (NOTEDIV / that.dispatchFactor[turtle]);
                    __arc(turtle, deltaArg, arg2, deltaTime);
                    that.playbackQueue[turtle].push([that.previousTurtleTime[turtle] + deltaTime / 1000, 'arc', deltaArg, arg2]);
                }

                waitTime += NOTEDIV * stepTime;
                break;
            default:
                console.log(name + ' is not supported inside of Note Blocks');
                break;
            }
        }
    };

    this._setListener = function (turtle, listenerName, listener) {
        if (listenerName in this.turtles.turtleList[turtle].listeners) {
            this.stage.removeEventListener(listenerName, this.turtles.turtleList[turtle].listeners[listenerName], false);
        }

        this.turtles.turtleList[turtle].listeners[listenerName] = listener;
        this.stage.addEventListener(listenerName, listener, false);
    };

    this._setDispatchBlock = function (blk, turtle, listenerName) {
        if (!this.inDuplicate[turtle] && this.backward[turtle].length > 0) {
            if (this.blocks.blockList[last(this.backward[turtle])].name === 'backward') {
                var c = 1;
            } else {
                var c = 2;
            }

            if (this.blocks.sameGeneration(this.blocks.blockList[last(this.backward[turtle])].connections[c], blk)) {
                var nextBlock = this.blocks.blockList[blk].connections[0];
                if (nextBlock in this.endOfClampSignals[turtle]) {
                    this.endOfClampSignals[turtle][nextBlock].push(listenerName);
                } else {
                    this.endOfClampSignals[turtle][nextBlock] = [listenerName];
                }
            } else {
                var nextBlock = last(this.blocks.blockList[blk].connections);
                if (nextBlock != null) {
                    if (nextBlock in this.endOfClampSignals[turtle]) {
                        this.endOfClampSignals[turtle][nextBlock].push(listenerName);
                    } else {
                        this.endOfClampSignals[turtle][nextBlock] = [listenerName];
                    }
                }
            }
        } else {
            var nextBlock = last(this.blocks.blockList[blk].connections);
            if (nextBlock != null) {
                if (nextBlock in this.endOfClampSignals[turtle]) {
                    this.endOfClampSignals[turtle][nextBlock].push(listenerName);
                } else {
                    this.endOfClampSignals[turtle][nextBlock] = [listenerName];
                }
            }
        }
    };

    this._processSpeak = function (text) {
        var new_text = '';
        for (var i = 0; i < text.length; i++) {
            if ((text[i] >= 'a' && text[i] <= 'z') || (text[i] >= 'A' && text[i] <= 'Z') || text[i] === ',' || text[i] === '.' || text[i] === ' ')
                new_text += text[i];
        }

        this.meSpeak.speak(new_text);
    };

    this._processShow = function (turtle, arg0, arg1) {
        if (typeof(arg1) === 'string') {
            var len = arg1.length;
            if (len === 14 && arg1.substr(0, 14) === CAMERAVALUE) {
                doUseCamera(args, this.turtles, turtle, false, this.cameraID, this.setCameraID, this.errorMsg);
            } else if (len === 13 && arg1.substr(0, 13) === VIDEOVALUE) {
                doUseCamera(args, this.turtles, turtle, true, this.cameraID, this.setCameraID, this.errorMsg);
            } else if (len > 10 && arg1.substr(0, 10) === 'data:image') {
                this.turtles.turtleList[turtle].doShowImage(arg0, arg1);
            } else if (len > 8 && arg1.substr(0, 8) === 'https://') {
                this.turtles.turtleList[turtle].doShowURL(arg0, arg1);
            } else if (len > 7 && arg1.substr(0, 7) === 'http://') {
                this.turtles.turtleList[turtle].doShowURL(arg0, arg1);
            } else if (len > 7 && arg1.substr(0, 7) === 'file://') {
                this.turtles.turtleList[turtle].doShowURL(arg0, arg1);
            } else {
                this.turtles.turtleList[turtle].doShowText(arg0, arg1);
            }
        } else if (typeof(arg1) === 'object' && this.blocks.blockList[this.blocks.blockList[blk].connections[2]].name === 'loadFile') {
            if (arg1) {
                this.turtles.turtleList[turtle].doShowText(arg0, arg1[1]);
            } else {
                this.errorMsg(_('You must select a file.'));
            }
        } else {
            this.turtles.turtleList[turtle].doShowText(arg0, arg1);
        }
    };

    this._getTargetTurtle = function (args) {
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

    this._loopBlock = function (name) {
        return ['forever', 'repeat', 'while', 'until'].indexOf(name) !== -1;
    };

    this._doBreak = function (turtle) {
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

    this.parseArg = function (that, turtle, blk, parentBlk, receivedArg) {
        var logo = that;  // For plugin backward compatibility

        // Retrieve the value of a block.
        if (blk == null) {
            console.log('NO INPUT');
            that.errorMsg(NOINPUTERRORMSG, parentBlk);
            that.stopTurtle = true;
            return null
        }

        if (that.blocks.blockList[blk].protoblock.parameter) {
            if (turtle in that.parameterQueue) {
                if (that.parameterQueue[turtle].indexOf(blk) === -1) {
                    that.parameterQueue[turtle].push(blk);
                }
            } else {
                // console.log('turtle ' + turtle + ' has no parameterQueue');
            }
        }

        if (that.blocks.blockList[blk].isValueBlock()) {
            if (that.blocks.blockList[blk].name === 'number' && typeof(that.blocks.blockList[blk].value) === 'string') {
                try {
                    that.blocks.blockList[blk].value = Number(that.blocks.blockList[blk].value);
                } catch (e) {
                    console.log(e);
                }
            }
            return that.blocks.blockList[blk].value;
        } else if (that.blocks.blockList[blk].name === 'boolean') {
            if (typeof(that.blocks.blockList[blk].value) === 'string') {
		return that.blocks.blockList[blk].value === _('true') || that.blocks.blockList[blk].value === 'true';
            } else {
		return that.blocks.blockList[blk].value;
            }
        } else if (that.blocks.blockList[blk].isArgBlock() || that.blocks.blockList[blk].isArgClamp() || that.blocks.blockList[blk].isArgFlowClampBlock() || ['anyout', 'numberout', 'textout'].indexOf(that.blocks.blockList[blk].protoblock.dockTypes[0]) !== -1) {
            switch (that.blocks.blockList[blk].name) {
            case 'pitchness':
                // Experimental
                if (_THIS_IS_TURTLE_BLOCKS_) {
                    // FIXME
                    that.blocks.blockList[blk].value = 440;
                } else {
                    var signal = that.analyser.analyse();
                    var dft = new DFT(that.limit, 44100);
                    dft.forward(signal);
                    var values = dft.spectrum;

                    try {
                        if (!that.mic.open()) {
                            that.mic.open();
                            that.blocks.blockList[blk].value = 0;
                        } else {
                            that.blocks.blockList[blk].value = values[0];
                        }
                    } catch (e) {
                        console.log(e);
                        that.mic.open();
                        that.blocks.blockList[blk].value = values[0];
                    }
                }
                break;
            case 'loudness':
                if (_THIS_IS_TURTLE_BLOCKS_) {
                    try {
                        if (!that.mic.enabled) {
                            that.mic.start();
                            that.blocks.blockList[blk].value = 0;
                        } else {
                            that.blocks.blockList[blk].value = Math.round(that.mic.getLevel() * 1000);
                        }
                    } catch (e) {
                        console.log(e);
                        that.mic.start();
                        that.blocks.blockList[blk].value = Math.round(that.mic.getLevel() * 1000);
                    }
                } else {
                    var values = that.analyser.analyse();
                    var sum = 0;
                    for(var k=0; k<that.limit; k++) {
                            sum += (values[k] * values[k]);
                    }
                    var rms = Math.sqrt(sum/that.limit);
                    try {
                        if (!that.mic.open()) {
                            that.mic.open();
                            that.blocks.blockList[blk].value = 0;
                        } else {
                            that.blocks.blockList[blk].value = Math.round(rms);
                        }
                    } catch (e) {  // MORE DEBUGGING
                        console.log(e);
                        that.mic.open();
                        that.blocks.blockList[blk].value = Math.round(rms);
                    }
                }
                break;
            case 'eval':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                // Restricted to math methods
                that.blocks.blockList[blk].value = Number(eval('Math.' + a.replace(/x/g, b.toString())));
                break;
            case 'arg':
                var cblk = that.blocks.blockList[blk].connections[1];
                var name = that.parseArg(that, turtle, cblk, blk, receivedArg);
                var action_args=receivedArg
                if (action_args.length >= Number(name)) {
                    var value = action_args[Number(name)-1];
                    that.blocks.blockList[blk].value = value;
                }else {
                    that.errorMsg('Invalid argument',blk);
                    that.stopTurtle = true;
                }
                return that.blocks.blockList[blk].value;
                break;
            case 'box':
                var cblk = that.blocks.blockList[blk].connections[1];
                var name = that.parseArg(that, turtle, cblk, blk, receivedArg);
                if (name in that.boxes) {
                    that.blocks.blockList[blk].value = that.boxes[name];
                } else {
                    that.errorMsg(NOBOXERRORMSG, blk, name);
                    that.stopTurtle = true;
                    that.blocks.blockList[blk].value = null;
                }
                break;
            case 'turtlename':
                that.blocks.blockList[blk].value = that.turtles.turtleList[turtle].name;
                break;
            case 'namedbox':
                var name = that.blocks.blockList[blk].privateData;
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, that.blocks.blockList[blk].name]);
                } else if (!that.updatingStatusMatrix) {
                    if (name in that.boxes) {
                        that.blocks.blockList[blk].value = that.boxes[name];
                    } else {
                        that.errorMsg(NOBOXERRORMSG, blk, name);
                        that.stopTurtle = true;
                        that.blocks.blockList[blk].value = null;
                    }
                }
                break;
            case 'namedarg':
                var name = that.blocks.blockList[blk].privateData;
                var action_args = receivedArg;

                // If an action block with an arg is clicked,
                // the arg will have no value.
                if (action_args == null) {
                    that.errorMsg('Invalid argument', blk);
                    that.stopTurtle = true;
                    that.blocks.blockList[blk].value = null;
                    return;
                }

                if (action_args.length >= Number(name)) {
                    var value = action_args[Number(name)-1];
                    that.blocks.blockList[blk].value = value;
                } else {
                    that.errorMsg('Invalid argument', blk);
                }

                return that.blocks.blockList[blk].value;
                break;
            case 'sqrt':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, that.blocks.blockList[blk].name]);
                } else {
                    var cblk = that.blocks.blockList[blk].connections[1];
                    var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    if (a < 0) {
                        that.errorMsg(NOSQRTERRORMSG, blk);
                        that.stopTurtle = true;
                        a = -a;
                    }
                    that.blocks.blockList[blk].value = that._doSqrt(a);
                }
                break;
            case 'abs':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, that.blocks.blockList[blk].name]);
                } else {
                    var cblk = that.blocks.blockList[blk].connections[1];
                    var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    that.blocks.blockList[blk].value = Math.abs(a);
                }
                break;
            case 'int':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'int']);
                } else {
                    var cblk = that.blocks.blockList[blk].connections[1];
                    var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    that.blocks.blockList[blk].value = Math.floor(a);
                }
                break;
            case 'mod':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'mod']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    that.blocks.blockList[blk].value = that._doMod(a, b);
                }
                break;
            case 'not':
                var cblk = that.blocks.blockList[blk].connections[1];
                var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                that.blocks.blockList[blk].value = !a;
                break;
            case 'greater':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                that.blocks.blockList[blk].value = (Number(a) > Number(b));
                break;
            case 'equal':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                that.blocks.blockList[blk].value = (a === b);
                break;
            case 'less':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                var result = (Number(a) < Number(b));
                that.blocks.blockList[blk].value = result;
                break;
            case 'random':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                that.blocks.blockList[blk].value = that._doRandom(a, b);
                break;
            case 'oneOf':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                that.blocks.blockList[blk].value = that._doOneOf(a, b);
                break;
            case 'plus':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'plus']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    that.blocks.blockList[blk].value = that._doPlus(a, b);
                }
                break;
            case 'multiply':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'multiply']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    that.blocks.blockList[blk].value = that._doMultiply(a, b);
                }
                break;
            case 'power':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'power']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    that.blocks.blockList[blk].value = that._doPower(a, b);
                }
                break;
            case 'divide':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'divide']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    that.blocks.blockList[blk].value = that._doDivide(a, b);
                }
                break;
            case 'minus':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'minus']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    that.blocks.blockList[blk].value = that._doMinus(a, b);
                }
                break;
            case 'neg':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'neg']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    that.blocks.blockList[blk].value = that._doMinus(0, a);
                }
                break;
            case 'toascii':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'toascii']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    that.blocks.blockList[blk].value = String.fromCharCode(a);
                }
                break;
            case 'myclick':
                console.log('[click' + that.turtles.turtleList[turtle].name + ']');
                that.blocks.blockList[blk].value = 'click' + that.turtles.turtleList[turtle].name;
                break;
            case 'heading':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'heading']);
                } else {
                    that.blocks.blockList[blk].value = that.turtles.turtleList[turtle].orientation;
                }
                break;
            case 'x':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'x']);
                } else {
                    that.blocks.blockList[blk].value = that.turtles.screenX2turtleX(that.turtles.turtleList[turtle].container.x);
                }
                break;
            case 'y':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'y']);
                } else {
                    that.blocks.blockList[blk].value = that.turtles.screenY2turtleY(that.turtles.turtleList[turtle].container.y);
                }
                break;
            case 'turtleheading':
            case 'xturtle':
            case 'yturtle':
                var cblk = that.blocks.blockList[blk].connections[1];
                var targetTurtle = that.parseArg(that, turtle, cblk, blk, receivedArg);
                for (var i = 0; i < that.turtles.turtleList.length; i++) {
                    var thisTurtle = that.turtles.turtleList[i];
                    if (targetTurtle === thisTurtle.name) {
                        if (that.blocks.blockList[blk].name === 'yturtle') {
                            that.blocks.blockList[blk].value = that.turtles.screenY2turtleY(thisTurtle.container.y);
                        } else if (that.blocks.blockList[blk].name === 'xturtle') {
                            that.blocks.blockList[blk].value = that.turtles.screenX2turtleX(thisTurtle.container.x);
                        } else {
                            that.blocks.blockList[blk].value = thisTurtle.orientation;
                        }
                        break;
                    }
                }

                if (i === that.turtles.turtleList.length) {
                    that.errorMsg('Could not find mouse ' + targetTurtle, blk);
                    var thisTurtle = that.turtles.turtleList[turtle];
                    if (that.blocks.blockList[blk].name === 'yturtle') {
                        that.blocks.blockList[blk].value = that.turtles.screenY2turtleY(thisTurtle.container.y);
                    } else if (that.blocks.blockList[blk].name === 'xturtle') {
                        that.blocks.blockList[blk].value = that.turtles.screenX2turtleX(thisTurtle.container.x);
                    } else {
                        that.blocks.blockList[blk].value = thisTurtle.orientation;
                    }
                }
                break;
            case 'bpmfactor':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'bpm']);
                } else if (that.bpm[turtle].length > 0) {
                    that.blocks.blockList[blk].value = last(that.bpm[turtle]);
                } else {
                    that.blocks.blockList[blk].value = that._masterBPM;
                }
                break;
            case 'staccatofactor':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'staccato']);
                } else if (that.staccato[turtle].length > 0) {
                    that.blocks.blockList[blk].value = last(that.staccato[turtle]);
                } else {
                    that.blocks.blockList[blk].value = 0;
                }
                break;
            case 'slurfactor':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'slur']);
                } else if (that.staccato[turtle].length > 0) {
                    that.blocks.blockList[blk].value = -last(that.staccato[turtle]);
                } else {
                    that.blocks.blockList[blk].value = 0;
                }
                break;
            case 'key':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'key']);
                } else {
                    that.blocks.blockList[blk].value = that.keySignature[turtle];
                }
                break;
            case 'consonantstepsizeup':
                if (that.lastNotePlayed[turtle] !== null) {
                    var len = that.lastNotePlayed[turtle][0].length;
                    that.blocks.blockList[blk].value = getStepSizeUp(that.keySignature[turtle], that.lastNotePlayed[turtle][0].slice(0, len - 1));
                } else {
                    that.blocks.blockList[blk].value = getStepSizeUp(that.keySignature[turtle], 'A');
                }
                break;
            case 'consonantstepsizedown':
                if (that.lastNotePlayed[turtle] !== null) {
                    var len = that.lastNotePlayed[turtle][0].length;
                    that.blocks.blockList[blk].value = getStepSizeDown(that.keySignature[turtle], that.lastNotePlayed[turtle][0].slice(0, len - 1));
                } else {
                    that.blocks.blockList[blk].value = getStepSizeDown(that.keySignature[turtle], 'A');
                }
                break;
            case 'transpositionfactor':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'transposition']);
                } else {
                    that.blocks.blockList[blk].value = that.transposition[turtle];
                }
                break;
            case 'duplicatefactor':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'duplicate']);
                } else {
                    that.blocks.blockList[blk].value = that.duplicateFactor[turtle];
                }
                break;
            case 'skipfactor':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'skip']);
                } else {
                    that.blocks.blockList[blk].value = that.skipFactor[turtle];
                }
                break;
            case 'notevolumefactor':  // master volume
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'volume']);
                } else {
                    that.blocks.blockList[blk].value = last(that.masterVolume);
                }
                break;
            case 'elapsednotes2':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'elapsednotes2']);
                } else {
                    var cblk = that.blocks.blockList[blk].connections[1];
                    var notevalue = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    if (notevalue == null || notevalue === 0) {
                        that.blocks.blockList[blk].value = 0;
                    } else {
                        that.blocks.blockList[blk].value = that.notesPlayed[turtle] / notevalue;
                    }
                }
                break;
            case 'elapsednotes':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'elapsednotes']);
                } else {
                    that.blocks.blockList[blk].value = that.notesPlayed[turtle];
                }
                break;
            case 'turtleelapsednotes':
                var value = null;
                var cblk = that.blocks.blockList[blk].connections[1];
                var targetTurtle = that.parseArg(that, turtle, cblk, blk, receivedArg);
                for (var i = 0; i < that.turtles.turtleList.length; i++) {
                    var thisTurtle = that.turtles.turtleList[i];
                    if (targetTurtle === thisTurtle.name) {
                        value = that.notesPlayed[i];
                        that.blocks.blockList[blk].value = value;
                        break;
                    }
                }

                if (value == null) {
                    that.errorMsg('Could not find mouse ' + targetTurtle, blk);
                    that.blocks.blockList[blk].value = that.notesPlayed[turtle];
                }
                break;
            case 'beatfactor':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'beatfactor']);
                } else {
                    that.blocks.blockList[blk].value = that.beatFactor[turtle];
                }
                break;
            case 'number2pitch':
            case 'number2octave':
                var cblk = that.blocks.blockList[blk].connections[1];
                var num = that.parseArg(that, turtle, cblk, blk, receivedArg);
                if (num != null && typeof(num) === 'number') {
                    var obj = numberToPitch(num + that.pitchNumberOffset);
                    if (that.blocks.blockList[blk].name === 'number2pitch') {
                        that.blocks.blockList[blk].value = obj[0];
                    } else {
                        that.blocks.blockList[blk].value = obj[1];
                    }
                } else {
                    that.errorMsg('Invalid argument', blk);
                    that.stopTurtle = true;
                }
                break;
            case 'turtlepitch':
                var value = null;
                var cblk = that.blocks.blockList[blk].connections[1];
                var targetTurtle = that.parseArg(that, turtle, cblk, blk, receivedArg);
                for (var i = 0; i < that.turtles.turtleList.length; i++) {
                    var thisTurtle = that.turtles.turtleList[i];
                    if (targetTurtle === thisTurtle.name) {
                        if (that.lastNotePlayed[i] !== null) {
                            var len = that.lastNotePlayed[i][0].length;
                            var pitch = that.lastNotePlayed[i][0].slice(0, len - 1);
                            var octave = parseInt(that.lastNotePlayed[i][0].slice(len - 1));

                            var obj = [pitch, octave];
                        } else if (that.notePitches[i].length > 0) {
                            var obj = that.getNote(that.notePitches[i][0], that.noteOctaves[i][0], that.noteTranspositions[i][0], that.keySignature[i]);
                        } else {
                            console.log('Could not find a note for mouse ' + turtle);
                            var obj = ['G', 4];
                        }

                        value = pitchToNumber(obj[0], obj[1], that.keySignature[i]) - that.pitchNumberOffset;
                        that.blocks.blockList[blk].value = value;
                        break;
                    }
                }

                if (value == null) {
                    that.errorMsg('Could not find mouse ' + targetTurtle, blk);
                    if (that.lastNotePlayed[turtle] !== null) {
                        var len = that.lastNotePlayed[turtle][0].length;
                        var pitch = that.lastNotePlayed[turtle][0].slice(0, len - 1);
                        var octave = parseInt(that.lastNotePlayed[turtle][0].slice(len - 1));
                        var obj = [pitch, octave];
                    } else if (that.notePitches[turtle].length > 0) {
                        var obj = that.getNote(that.notePitches[turtle][last(that.inNoteBlock[turtle])][0], that.noteOctaves[turtle][last(that.inNoteBlock[turtle])][0], that.noteTranspositions[turtle][0], that.keySignature[turtle]);
                    } else {
                        console.log('Could not find a note for mouse ' + turtle);
                        var obj = ['G', 4];
                    }

                    value = pitchToNumber(obj[0], obj[1], that.keySignature[turtle]) - that.pitchNumberOffset;
                    that.blocks.blockList[blk].value = value;
                }
                break;
            case 'mypitch':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'mypitch']);
                } else {
                    var value = null;
                    if (that.lastNotePlayed[turtle] !== null) {
                        var len = that.lastNotePlayed[turtle][0].length;
                        var pitch = that.lastNotePlayed[turtle][0].slice(0, len - 1);
                        var octave = parseInt(that.lastNotePlayed[turtle][0].slice(len - 1));
                        var obj = [pitch, octave];
                    } else if (that.notePitches[turtle][last(that.inNoteBlock[turtle])].length > 0) {
                        var obj = that.getNote(that.notePitches[turtle][last(that.inNoteBlock[turtle])][0], that.noteOctaves[turtle][last(that.inNoteBlock[turtle])][0], that.noteTranspositions[turtle][0], that.keySignature[turtle]);
                    } else {
                        console.log('Could not find a note ');
                        var obj = ['G', 4];
                    }

                    value = pitchToNumber(obj[0], obj[1], that.keySignature[turtle]) - that.pitchNumberOffset;
                    that.blocks.blockList[blk].value = value;
                }
                break;
            case 'beatvalue':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'beatvalue']);
                } else {
                    if (that.notesPlayed[turtle] < that.pickup[turtle]) {
                        that.blocks.blockList[blk].value = 0;
                    } else {
                        that.blocks.blockList[blk].value = (((that.notesPlayed[turtle] - that.pickup[turtle]) * that.noteValuePerBeat[turtle]) % that.beatsPerMeasure[turtle]) + 1;
                    }
                }
                break;
            case 'measurevalue':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'measurevalue']);
                } else {
                    if (that.notesPlayed[turtle] < that.pickup[turtle]) {
                        that.blocks.blockList[blk].value = 0;
                    } else {
                        that.blocks.blockList[blk].value = Math.floor(((that.notesPlayed[turtle] - that.pickup[turtle]) * that.noteValuePerBeat[turtle]) / that.beatsPerMeasure[turtle]) + 1;
                    }
                }
                break;
            case 'mynotevalue':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'mynotevalue']);
                } else {
                    var value = null;
                    if (that.noteValue[turtle][last(that.inNoteBlock[turtle])] !== null) {
                        value = 1 / that.noteValue[turtle][last(that.inNoteBlock[turtle])];
                    } else if (that.lastNotePlayed[turtle] !== null) {
                        value = that.lastNotePlayed[turtle][1];
                    } else if (that.notePitches[turtle][last(that.inNoteBlock[turtle])].length > 0) {
                        value = that.noteBeat[turtle][last(that.inNoteBlock[turtle])];
                    } else {
                        console.log('Could not find a note for turtle ' + turtle);
                        value = -1;
                    }

                    if (value !== 0) {
                        that.blocks.blockList[blk].value = 1 / value;
                    } else {
                        that.blocks.blockList[blk].value = 0;
                    }
                }
                break;
            case 'turtlenote':
            case 'turtlenote2':
                var value = null;
                var cblk = that.blocks.blockList[blk].connections[1];
                var targetTurtle = that.parseArg(that, turtle, cblk, blk, receivedArg);
                for (var i = 0; i < that.turtles.turtleList.length; i++) {
                    var thisTurtle = that.turtles.turtleList[i];
                    if (targetTurtle === thisTurtle.name) {
                        if (that.inNoteBlock[i].length > 0 && last(that.inNoteBlock[i]) in that.noteValue[i]) {
                            value = 1 / that.noteValue[i][last(that.inNoteBlock[i])];
                        } else if (that.lastNotePlayed[i] !== null) {
                            value = that.lastNotePlayed[i][1];
                        } else if (that.notePitches[i].length > 0) {
                            value = that.noteBeat[i][last(that.inNoteBlock[i])];
                        } else {
                            value = -1;
                        }

                        if (that.blocks.blockList[blk].name === 'turtlenote') {
                            that.blocks.blockList[blk].value = value;
                        } else if (value !== 0) {
                            that.blocks.blockList[blk].value = 1 / value;
                        } else {
                            that.blocks.blockList[blk].value = 0;
                        }
                        break;
                    }
                }

                if (value == null) {
                    that.errorMsg('Could not find mouse ' + targetTurtle, blk);
                    that.blocks.blockList[blk].value = -1;
                }
                break;
            // Deprecated
            case 'currentnote':
                that.blocks.blockList[blk].value = that.currentNotes[turtle];
                break;
            // Deprecated
            case 'currentoctave':
                that.blocks.blockList[blk].value = that.currentOctaves[turtle];
                break;
            case 'color':
            case 'hue':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'color']);
                } else {
                    that.blocks.blockList[blk].value = that.turtles.turtleList[turtle].color;
                }
                break;
            case 'turtlecolor':
                var cblk = that.blocks.blockList[blk].connections[1];
                var targetTurtle = that.parseArg(that, turtle, cblk, blk, receivedArg);
                for (var i = 0; i < that.turtles.turtleList.length; i++) {
                    var thisTurtle = that.turtles.turtleList[i];
                    if (targetTurtle === thisTurtle.name) {
                        that.blocks.blockList[blk].value = thisTurtle.color;
                        break;
                    }
                }

                if (i === that.turtles.turtleList.length) {
                    that.errorMsg('Could not find mouse ' + targetTurtle, blk);
                    var thisTurtle = that.turtles.turtleList[turtle];
                    that.blocks.blockList[blk].value = thisTurtle.color;
                }
                break;
            case 'shade':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'shade']);
                } else {
                    that.blocks.blockList[blk].value = that.turtles.turtleList[turtle].value;
                }
                break;
            case 'grey':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'grey']);
                } else {
                    that.blocks.blockList[blk].value = that.turtles.turtleList[turtle].chroma;
                }
                break;
            case 'pensize':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'pensize']);
                } else {
                    that.blocks.blockList[blk].value = that.turtles.turtleList[turtle].stroke;
                }
                break;
            case 'and':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                that.blocks.blockList[blk].value = a && b;
                break;
            case 'or':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                that.blocks.blockList[blk].value = a || b;
                break;
            case 'time':
                var d = new Date();
                that.blocks.blockList[blk].value = (d.getTime() - that.time) / 1000;
                break;
            case 'hspace':
                var cblk = that.blocks.blockList[blk].connections[1];
                var v = that.parseArg(that, turtle, cblk, blk, receivedArg);
                that.blocks.blockList[blk].value = v;
                break;
            case 'mousex':
                that.blocks.blockList[blk].value = that.getStageX();
                break;
            case 'mousey':
                that.blocks.blockList[blk].value = that.getStageY();
                break;
            case 'mousebutton':
                that.blocks.blockList[blk].value = that.getStageMouseDown();
                break;
            case 'keyboard':
                that.lastKeyCode = that.getCurrentKeyCode();
                that.blocks.blockList[blk].value = that.lastKeyCode;
                that.clearCurrentKeyCode();
                break;
            case 'getred':
            case 'getgreen':
            case 'getblue':
                var colorString = that.turtles.turtleList[turtle].canvasColor;
                // 'rgba(255,0,49,1)' or '#ff0031'
                if (colorString[0] === '#') {
                    colorString = hex2rgb(colorString.split('#')[1]);
                }
                var obj = colorString.split('(');
                var obj = obj[1].split(',');
                switch (that.blocks.blockList[blk].name) {
                case 'getred':
                    that.blocks.blockList[blk].value = parseInt(Number(obj[0]) / 2.55);
                    break;
                case 'getgreen':
                    that.blocks.blockList[blk].value = parseInt(Number(obj[1]) / 2.55);
                    break;
                case 'getblue':
                    that.blocks.blockList[blk].value = parseInt(Number(obj[2]) / 2.55);
                    break;
                }
                break;
            case 'getcolorpixel':
                var wasVisible = that.turtles.turtleList[turtle].container.visible;
                that.turtles.turtleList[turtle].container.visible = false;
                var x = that.turtles.turtleList[turtle].container.x;
                var y = that.turtles.turtleList[turtle].container.y;
                that.refreshCanvas();
                var ctx = that.canvas.getContext('2d');
                var imgData = ctx.getImageData(x, y, 1, 1).data;
                var color = searchColors(imgData[0], imgData[1], imgData[2]);
                if (imgData[3] === 0) {
                    color = body.style.background.substring(body.style.background.indexOf('(') + 1, body.style.background.lastIndexOf(')')).split(/,\s*/),
                    color = searchColors(color[0], color[1], color[2]);
                }
                that.blocks.blockList[blk].value = color;
                if (wasVisible) {
                    that.turtles.turtleList[turtle].container.visible = true;
                }
                break;
            case 'loadFile':
                // No need to do anything here.
                break;
            case 'tofrequency':
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    var block = that.blocks.blockList[blk];
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    var note = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var octave = Math.floor(calcOctave(that.currentOctaves[turtle], that.parseArg(that, turtle, cblk2, blk, receivedArg)));
                    block.value = Math.round(pitchToFrequency(note, octave, 0, that.keySignature[turtle]));
                } else {
                    const NOTENAMES = ['A', 'B♭', 'B', 'C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭'];
                    const NOTECONVERSION = {'A♯': 'B♭', 'C♯': 'D♭', 'D♯': 'E♭', 'F♯': 'G♭', 'G♯': 'A♭'};
                    var block = that.blocks.blockList[blk];
                    var cblk = block.connections[1];
                    var noteName = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    if (typeof(noteName) === 'string') {
                        noteName = noteName.replace('b', '♭');
                        noteName = noteName.replace('#', '♯');
                        if (noteName in NOTECONVERSION) {
                            noteName = NOTECONVERSION[noteName];
                        }

                        var idx = NOTENAMES.indexOf(noteName);
                        if (idx === -1) {
                            this.errorMsg(_('Note name must be one of A, A♯, B♭, B, C, C♯, D♭, D, D♯, E♭, E, F, F♯, G♭, G, G♯ or A♭.'));
                            block.value = 440;
                        } else {
                            var cblk = block.connections[2];
                            var octave = Math.floor(that.parseArg(that, turtle, cblk, blk, receivedArg));
                            if (octave < 1) {
                                octave = 1;
                            }

                            if (idx > 2) {
                                octave -= 1;  // New octave starts on C
                            }

                            var i = octave * 12 + idx;
                            block.value = 27.5 * Math.pow(1.05946309435929, i);
                        }
                    } else {
                        block.value = 440 * Math.pow(2, (noteName - 69) / 12);
                    }
                }
                break;
            case 'pop':
                var block = that.blocks.blockList[blk];
                if (turtle in that.turtleHeaps && that.turtleHeaps[turtle].length > 0) {
                    block.value = that.turtleHeaps[turtle].pop();
                } else {
                    that.errorMsg(_('empty heap'));
                    block.value = null;
                }
                break;
            case 'indexHeap':
                var block = that.blocks.blockList[blk];
                var cblk = that.blocks.blockList[blk].connections[1];
                var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                if (!(turtle in that.turtleHeaps)) {
                    that.turtleHeaps[turtle] = [];
                }
                // If index > heap length, grow the heap.
                while (that.turtleHeaps[turtle].length < a) {
                    that.turtleHeaps[turtle].push(null);
                }
                block.value = that.turtleHeaps[turtle][a - 1];
                break;
            case 'heapLength':
                var block = that.blocks.blockList[blk];
                if (!(turtle in that.turtleHeaps)) {
                    that.turtleHeaps[turtle] = [];
                }
                block.value = that.turtleHeaps[turtle].length;
                break;
            case 'heapEmpty':
                var block = that.blocks.blockList[blk];
                if (turtle in that.turtleHeaps) {
                    block.value = (that.turtleHeaps[turtle].length === 0);
                } else {
                    block.value = true;
                }
                break;
            case 'notecounter':
                var cblk = that.blocks.blockList[blk].connections[1];
                if (cblk == null) {
                    that.blocks.blockList[blk].value = 0;
                } else {
                    var saveCountingStatus = that.justCounting[turtle];
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
                    that.justCounting[turtle] = true;

                    var actionArgs = [];
                    var saveNoteCount = that.notesPlayed[turtle];
                    that.turtles.turtleList[turtle].running = true;
                    that._runFromBlockNow(that, turtle, cblk, true, actionArgs, that.turtles.turtleList[turtle].queue.length);
                    that.blocks.blockList[blk].value = that.notesPlayed[turtle] - saveNoteCount;
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

                    that.justCounting[turtle] = saveCountingStatus;
                    that.suppressOutput[turtle] = saveSuppressStatus;
                }
                break;
            case 'calc':
                var actionArgs = [];
                var cblk = that.blocks.blockList[blk].connections[1];
                var name = that.parseArg(that, turtle, cblk, blk, receivedArg);
                actionArgs = receivedArg;
                // that.getBlockAtStartOfArg(blk);
                if (name in that.actions) {
                    that.turtles.turtleList[turtle].running = true;
                    that._runFromBlockNow(that, turtle, that.actions[name], true, actionArgs, that.turtles.turtleList[turtle].queue.length);
                    that.blocks.blockList[blk].value = that.returns.shift();
                } else {
                    that.errorMsg(NOACTIONERRORMSG, blk, name);
                    that.stopTurtle = true;
                }
                break;
            case 'namedcalc':
                var name = that.blocks.blockList[blk].privateData;
                var actionArgs = [];

                actionArgs = receivedArg;
                // that.getBlockAtStartOfArg(blk);
                if (name in that.actions) {
                    that.turtles.turtleList[turtle].running = true;
                    that._runFromBlockNow(that, turtle, that.actions[name], true, actionArgs, that.turtles.turtleList[turtle].queue.length);
                    that.blocks.blockList[blk].value = that.returns.shift();
                } else {
                    that.errorMsg(NOACTIONERRORMSG, blk, name);
                    that.stopTurtle = true;
                }
                break;
            case 'calcArg':
                var actionArgs = [];
                // that.getBlockAtStartOfArg(blk);
                if (that.blocks.blockList[blk].argClampSlots.length > 0) {
                    for (var i = 0; i < that.blocks.blockList[blk].argClampSlots.length; i++) {
                        var t = (that.parseArg(that, turtle, that.blocks.blockList[blk].connections[i + 2], blk, receivedArg));
                        actionArgs.push(t);
                    }
                }
                var cblk = that.blocks.blockList[blk].connections[1];
                var name = that.parseArg(that, turtle, cblk, blk, receivedArg);
                if (name in that.actions) {
                    that.turtles.turtleList[turtle].running = true;
                    that._runFromBlockNow(that, turtle, that.actions[name], true, actionArgs, that.turtles.turtleList[turtle].queue.length);
                    that.blocks.blockList[blk].value = that.returns.pop();
                } else {
                    that.errorMsg(NOACTIONERRORMSG, blk, name);
                    that.stopTurtle = true;
                }
                break;
            case 'namedcalcArg':
                var name = that.blocks.blockList[blk].privateData;
                var actionArgs = [];
                // that.getBlockAtStartOfArg(blk);
                if (that.blocks.blockList[blk].argClampSlots.length > 0) {
                    for (var i = 0; i < that.blocks.blockList[blk].argClampSlots.length; i++) {
                        var t = (that.parseArg(that, turtle, that.blocks.blockList[blk].connections[i + 1], blk, receivedArg));
                        actionArgs.push(t);
                    }
                }
                if (name in that.actions) {
                    // Just run the stack.
                    that.turtles.turtleList[turtle].running = true;
                    that._runFromBlockNow(that, turtle, that.actions[name], true, actionArgs, that.turtles.turtleList[turtle].queue.length);
                    that.blocks.blockList[blk].value = that.returns.pop();
                } else {
                    that.errorMsg(NOACTIONERRORMSG, blk, name);
                    that.stopTurtle = true;
                }
                break;
            case 'doArg':
                return blk;
                break;
            case 'nameddoArg':
                return blk;
                break;
            case 'returnValue':
                if (that.returns.length > 0) {
                    that.blocks.blockList[blk].value = that.returns.pop();
                } else {
                    console.log('WARNING: No return value.');
                    that.blocks.blockList[blk].value = 0;
                }
                break;
            default:
                if (that.blocks.blockList[blk].name in that.evalArgDict) {
                    eval(that.evalArgDict[that.blocks.blockList[blk].name]);
                } else {
                    console.log('ERROR: I do not know how to ' + that.blocks.blockList[blk].name);
                }
                break;
            }

            return that.blocks.blockList[blk].value;
        } else {
            return blk;
        }
    };

    this._doWait = function (turtle, secs) {
        this.waitTimes[turtle] = Number(secs) * 1000;
    };

    // Math functions
    this._doRandom = function (a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.floor(Math.random() * (Number(b) - Number(a) + 1) + Number(a));
    };

    this._doOneOf = function (a, b) {
        if (Math.random() < 0.5) {
            return a;
        } else {
            return b;
        }
    };

    this._doMod = function (a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) % Number(b);
    };

    this._doSqrt = function (a) {
        if (typeof(a) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.sqrt(Number(a));
    };

    this._doPlus = function (a, b) {
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

    this._doMinus = function (a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) - Number(b);
    };

    this._doMultiply = function (a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) * Number(b);
    };

    this._doPower = function (a, b) {
        if (typeof(a) === 'string' || typeof(b) === 'string') {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.pow(a, b);
    };

    this._doDivide = function (a, b) {
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

    this.setBackgroundColor = function (turtle) {
        /// Change body background in DOM to current color.
        if (turtle === -1) {
            var c = platformColor.background;
        } else {
            var c = this.turtles.turtleList[turtle].canvasColor;
        }
        docById('myCanvas').style.background = c;
        this.svgOutput = '';
    };

    this.setCameraID = function (id) {
        this.cameraID = id;
    };

    this.hideBlocks = function () {
        // Hide all the blocks.
        this.blocks.hide();
        this.refreshCanvas();
    };

    this.showBlocks = function () {
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

            if (['#', '♯', '♭', 'b'].indexOf(solfege.substr(-1)) !== -1) {
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

            if (this.movable) {
                // Ensure it is a valid key signature.
                var offset = thisScale.indexOf(myKeySignature);
                if (offset === -1) {
                    console.log('WARNING: Key ' + myKeySignature + ' not found in ' + thisScale + '. Using default of C');
                    offset = 0;
                    thisScale = NOTESSHARP;
                }
            } else {
                var offset = 0;
            }

            if (sharpFlat) {
                if (solfege.substr(-1) === '#') {
                    offset += 1;
                } else if (solfege.substr(-1) === '♯') {
                    offset += 1;
                } else if (solfege.substr(-1) === '♭') {
                    offset -= 1;
                } else if (solfege.substr(-1) === 'b') {
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

            if (deltaNote > 0) {
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
            } else if (deltaNote < 0) {
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
            } else if (NOTESSHARP.indexOf(note) !== -1) {
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

        if (octave < 0) {
            return [note, 0];
        } else if (octave > 10) {
            return [note, 10];
        } else {
            return [note, octave];
        }
    };

    this.updateNotation = function (note, duration, turtle, insideChord) {
        var obj = durationToNoteValue(duration);
        if (!(turtle in this.notationStaging)) {
            this.notationStaging[turtle] = [];
        }

        if (this.turtles.turtleList[turtle].drum) {
            note = "c'";
        }

        this.notationStaging[turtle].push([note, obj[0], obj[1], obj[2], obj[3], insideChord, this.staccato[turtle].length > 0 && last(this.staccato[turtle]) > 0]);
    };

    this.notationVoices = function (turtle, arg) {
        if (this.notationStaging[turtle] == undefined) {
            this.notationStaging[turtle] = [];
        }

        switch(arg) {
        case 1:
            this.notationStaging[turtle].push('voice one');
            break;
        case 2:
            this.notationStaging[turtle].push('voice two');
            break;
        case 3:
            this.notationStaging[turtle].push('voice three');
            break;
        case 4:
            this.notationStaging[turtle].push('voice four');
            break;
        default:
            this.notationStaging[turtle].push('one voice');
            break;
        }
    }

    this.notationMeter = function (turtle, count, value) {
        if (this.notationStaging[turtle] == undefined) {
            this.notationStaging[turtle] = [];
        }

        this.notationStaging[turtle].push('meter', count, value);
    };

    this.notationPickup = function (turtle, factor) {
        if (this.notationStaging[turtle] == undefined) {
            this.notationStaging[turtle] = [];
        }

        this.notationStaging[turtle].push('pickup', 1 / factor);
    };

    this.notationLineBreak = function (turtle) {
        if (this.notationStaging[turtle] == undefined) {
            this.notationStaging[turtle] = [];
        }

        // this.notationStaging[turtle].push('break');
    };

    this.notationBeginArticulation = function (turtle) {
        if (this.notationStaging[turtle] == undefined) {
            this.notationStaging[turtle] = [];
        }

        this.notationStaging[turtle].push('begin articulation');
    };

    this.notationEndArticulation = function (turtle) {
        this.notationStaging[turtle].push('end articulation');
    };

    this.notationBeginCrescendo = function (turtle, factor) {
        if (this.notationStaging[turtle] == undefined) {
            this.notationStaging[turtle] = [];
        }

        if (factor > 0) {
            this.notationStaging[turtle].push('begin crescendo');
        } else {
            this.notationStaging[turtle].push('begin decrescendo');
        }
    };

    this.notationEndCrescendo = function (turtle, factor) {
        if (factor > 0) {
            this.notationStaging[turtle].push('end crescendo');
        } else {
            this.notationStaging[turtle].push('end decrescendo');
        }
    };

    this.notationBeginSlur = function (turtle) {
        if (this.notationStaging[turtle] == undefined) {
            this.notationStaging[turtle] = [];
        }

        this.notationStaging[turtle].push('begin slur');
    };

    this.notationEndSlur = function (turtle) {
        this.notationStaging[turtle].push('end slur');
    };

    this.notationInsertTie = function (turtle) {
        if (this.notationStaging[turtle] == undefined) {
            this.notationStaging[turtle] = [];
        }

        this.notationStaging[turtle].push('tie');
    };

    this.notationRemoveTie = function (turtle) {
        this.notationStaging[turtle].pop();
    };
};
