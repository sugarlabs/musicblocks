// Copyright (c) 2014-2018 Walter Bender
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
const INVALIDPITCH = _('Not a valid pitch name');
const POSNUMBER = 'Argument must be a positive number';

const NOTATIONNOTE = 0;
const NOTATIONDURATION = 1;
const NOTATIONDOTCOUNT = 2;
const NOTATIONTUPLETVALUE = 3;
const NOTATIONROUNDDOWN = 4;
const NOTATIONINSIDECHORD = 5;  // deprecated
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
    this.showBlocksAfterRun = false;

    this.pitchTimeMatrix = null;
    this.pitchDrumMatrix = null;
    this.rhythmRuler = null;
    this.timbre = null;
    this.pitchStaircase = null;
    this.temperament = null;
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
    this.factorList = {};

    // We store each case arg and flow by switch block no. and turtle.
    this.switchCases = {};
    this.switchBlocks = {};

    // When we leave a clamp block, we need to dispatch a signal.
    this.endOfClampSignals = {};
    // Don't dispatch these signals (when exiting note counter or
    // interval measure.
    this.butNotThese = {};

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
    this.whichNoteToCount = {};

    // Moveable solfege?
    this.moveable = {};

    // When you run Music Blocks, you are "compiling" your code. The
    // compiled code is stored in the playbackQueue, which can be used
    // to playback the performance without the overhead of
    // interpreting the code.
    this.playbackQueue = {};
    this.playbackTime = 0;

    // Optimize for runtime speed
    this.optimize = false;

    // Widget-related attributes
    this.showPitchDrumMatrix = false;
    this.inPitchDrumMatrix = false;
    this.inRhythmRuler = false;
    this.rhythmRulerMeasure = null;
    this.inPitchStaircase = false;
    this.inTempo = false;
    this.inPitchSlider = false;
    this._currentDrumlock = null;
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
    this.scalarTransposition = {};
    this.scalarTranspositionValues = {};
    this.transposition = {};
    this.transpositionValues = {};

    // parameters used by notes
    this._masterBPM = TARGETBPM;
    this.defaultBPMFactor = TONEBPM / this._masterBPM;

    this.register = {};
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
    this.noteBeatValues = {};
    this.embeddedGraphics = {};
    this.lastNotePlayed = {};
    this.lastPitchPlayed = {}; //For a stand-alone pitch block.
    this.previousNotePlayed = {};
    this.noteStatus = {};
    this.noteDirection = {};
    this.pitchNumberOffset = [];  // 39, C4
    this.currentOctave = {};
    this.currentCalculatedOctave = {}; //For a stand-alone pitch block.
    this.currentNote = {};
    this.inHarmonic = {};
    this.partials = {};
    this.inNeighbor = [];
    this.neighborStepPitch = {};
    this.neighborNoteValue = {};
    this.inDefineMode = {};
    this.defineMode = {};

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
    this.intervals = {};  // relative interval (based on scale degree)
    this.semitoneIntervals = {};  // absolute interval (based on semitones)
    this.markup = {};
    this.staccato = {};
    this.glide = {};
    this.glideOverride = {};
    this.swing = {};
    this.swingTarget = {};
    this.swingCarryOver = {};
    this.tie = {};
    this.tieNotePitches = {};
    this.tieNoteExtras = {};
    this.tieCarryOver = {};
    this.tieFirstDrums = {};
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
    this.neighborArgNote1 = {};
    this.neighborArgNote2 = {};
    this.neighborArgBeat = {};
    this.neighborArgCurrentBeat = {};

    // When counting notes, measuring intervals, or generating lilypond output
    this.justCounting = {};
    this.justMeasuring = {};
    this.firstPitch = {};
    this.lastPitch = {};
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
    this.notationDrumStaging = {};
    this.notationOutput = '';
    this.notationNotes = {};
    this.pickupPOW2 = {};
    this.pickupPoint = {};
    this.runningLilypond = false;
    this.runningAbc = false;
    this.checkingCompletionState = false;
    this.compiling = false;
    this.recording = false;
    this.lastNote = {};
    this.restartPlayback = true;

    //variables for progress bar
    this.progressBar = docById('myBar');
    this.progressBarWidth = 0;
    this.progressBarDivision;

    this.temperamentSelected = [];

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

    // Things we turn off to optimize performance
    this.blinkState = true;

    if (_THIS_IS_MUSIC_BLOCKS_) {
        // Load the default synthesizer
        this.synth = new Synth();
        this.synth.changeInTemperament = false;
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

    this.mic = null;
    this.volumeAnalyser = null;
    this.pitchAnalyser = null;

    this.setOptimize = function (state) {
        if (state) {
            this.errorMsg(_('Turning off mouse blink; setting FPS to 10.'));
            createjs.Ticker.framerate = 10;
            this.optimize = true;

        } else {
            this.errorMsg(_('Turning on mouse blink; setting FPS to 30.'));
            createjs.Ticker.framerate = 30;
            this.optimize = false;
        }

        this.blinkState = !state;
    };

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

    this.recordingStatus = function () {
        return this.recording || this.runningLilypond || this.runningAbc;
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
            for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
                for (var instrumentName in instruments[turtle]) {
                    this.synth.stopSound(turtle, instrumentName);
                }
            }

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
        if (this.showBlocksAfterRun) {
            console.log('SHOW BLOCKS');
            this.showBlocks();
        }

        this.showBlocksAfterRun = false;
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
            case 'toppos':
            case 'rightpos':
            case 'leftpos':
            case 'bottompos':
            case 'width':
            case 'height':
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
            case 'deltapitch':
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
            case 'toppos':
                value = toFixed2((this.turtles._canvas.height / (2.0 * this.turtles.scale)));
                break;
            case 'rightpos':
                value = toFixed2((this.turtles._canvas.width / (2.0 * this.turtles.scale)));
                break;
            case 'leftpos':
                value = toFixed2(-1*(this.turtles._canvas.width / (2.0 * this.turtles.scale)));
                break;
            case 'bottompos':
                value = toFixed2(-1*(this.turtles._canvas.height / (2.0 * this.turtles.scale)));
                break;
            case 'width':
                value = toFixed2(that.turtles._canvas.width / (that.turtles.scale));
                break;
            case 'height':
                value = toFixed2(that.turtles._canvas.height / (that.turtles.scale));
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
                        if (this.volumeAnalyser == null) {
                            this.volumeAnalyser = new Tone.Analyser({
                                'type': 'waveform',
                                'size': this.limit
                            });

                            this.mic.connect(this.volumeAnalyser);
                        }

                        var values = that.volumeAnalyser.getValue();
                        var sum = 0;
                        for(var k = 0; k < that.limit; k++) {
                            sum += (values[k] * values[k]);
                        }

                        var rms = Math.sqrt(sum / that.limit);
                        that.blocks.blockList[blk].value = Math.round(rms * 100);
                    }
                }
                break;
            case 'consonantstepsizeup':
                if (this.lastNotePlayed[turtle] !== null) {
                    var len = this.lastNotePlayed[turtle][0].length;
                    value = getStepSizeUp(this.keySignature[turtle], this.lastNotePlayed[turtle][0].slice(0, len - 1));
                } else {
                    value = getStepSizeUp(this.keySignature[turtle], 'G');
                }
                break;
            case 'consonantstepsizedown':
                if (this.lastNotePlayed[turtle] !== null) {
                    var len = this.lastNotePlayed[turtle][0].length;
                    value = getStepSizeDown(this.keySignature[turtle], this.lastNotePlayed[turtle][0].slice(0, len - 1));
                } else {
                    value = getStepSizeDown(this.keySignature[turtle], 'G');
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
            case 'deltapitch':
                if (this.lastNotePlayed[turtle] !== null && this.previousNotePlayed[turtle] !== null) {
                    var len = this.previousNotePlayed[turtle][0].length;
                    var pitch = this.previousNotePlayed[turtle][0].slice(0, len - 1);
                    var octave = parseInt(this.previousNotePlayed[turtle][0].slice(len - 1));
                    var obj = [pitch, octave];
                    var previousValue = pitchToNumber(obj[0], obj[1], this.keySignature[turtle]);
                    len = this.lastNotePlayed[turtle][0].length;
                    pitch = this.lastNotePlayed[turtle][0].slice(0, len - 1);
                    octave = parseInt(this.lastNotePlayed[turtle][0].slice(len - 1));
                    obj = [pitch, octave];
                    value = pitchToNumber(obj[0], obj[1], this.keySignature[turtle]) - previousValue;
                } else {
                    value = 0;
                }

                value = value.toString();
                break;
            case 'mypitch':
                if (this.lastNotePlayed[turtle] !== null) {
                    var len = this.lastNotePlayed[turtle][0].length;
                    value = pitchToNumber(this.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(this.lastNotePlayed[turtle][0].slice(len - 1)), this.keySignature[turtle]) - this.pitchNumberOffset[turtle];
                } else {
                    value = pitchToNumber('G', 4, this.keySignature[turtle])  - this.pitchNumberOffset;
                }

                value = value.toString();
                break;
                // Deprecated
            case 'bpmfactor':
                console.log(this.bpm[turtle]);
                if (this.bpm[turtle].length > 0) {
                    value = last(this.bpm[turtle]);
                } else {
                    this.bpm[turtle].push(this._masterBPM);
                    value = this._masterBPM;
                }
                break;
            case 'beatvalue':
                value = this.currentBeat[turtle].toString();
                break;
            case 'synthname':
                value = last(this.instrumentNames[turtle]);
                break;
            case 'measurevalue':
                value = this.currentMeasure[turtle].toString();
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

    this.initMediaDevices = function () {
        var that = this;
        console.log('INIT MICROPHONE');
        if (_THIS_IS_MUSIC_BLOCKS_) {
            var mic = new Tone.UserMedia();
            try {
                mic.open();
            } catch (e) {
                console.log('MIC NOT FOUND');
                console.log(e.name + ': ' + e.message);

                console.log(mic);
                that.errorMsg(NOMICERRORMSG);
                mic = null;
            }

            this.mic = mic;
            this.limit = 1024;
        } else {
            try {
                this.mic = new p5.AudioIn()
                that.mic.start();
            } catch (e) {
                console.log(e);
                this.errorMsg(NOMICERRORMSG);
                this.mic = null;
            }
        }
    };

    this.initTurtle = function (turtle) {
        this.previousTurtleTime[turtle] = 0;
        this.turtleTime[turtle] = 0;
        this.waitTimes[turtle] = 0;
        this.endOfClampSignals[turtle] = {};
        this.butNotThese[turtle] = {};
        this.cp1x[turtle] = 0;
        this.cp1y[turtle] = 100;
        this.cp2x[turtle] = 100;
        this.cp2y[turtle] = 100;
        this.inNoteBlock[turtle] = [];
        this.multipleVoices[turtle] = false;
        this.scalarTransposition[turtle] = 0;
        this.scalarTranspositionValues[turtle] = [];
        this.transposition[turtle] = 0;
        this.transpositionValues[turtle] = [];
        this.noteBeat[turtle] = {};
        this.noteValue[turtle] = {};
        this.noteCents[turtle] = {};
        this.noteHertz[turtle] = {};
        this.lastNotePlayed[turtle] = null;
        this.previousNotePlayed[turtle] = null;
        this.noteStatus[turtle] = null;
        this.noteDirection[turtle] = 0;
        this.noteDrums[turtle] = {};
        this.notePitches[turtle] = {};
        this.noteOctaves[turtle] = {};
        this.currentOctave[turtle] = 4;
        this.register[turtle] = 0;
        this.noteBeatValues[turtle] = {};
        this.embeddedGraphics[turtle] = {};
        this.embeddedGraphicsFinished[turtle] = true;
        this.beatFactor[turtle] = 1;
        this.dotCount[turtle] = 0;
        this.invertList[turtle] = [];
        this.beatList[turtle] = [];
        this.factorList[turtle] = [];
        this.switchCases[turtle] = {};
        this.switchBlocks[turtle] = [];
        this.connectionStore[turtle] = {};
        this.connectionStoreLock = false;
        this.duplicateFactor[turtle] = 1;
        this.inDuplicate[turtle] = false;
        this.skipFactor[turtle] = 1;
        this.skipIndex[turtle] = 0;
        this.notesPlayed[turtle] = [0, 1];
        this.whichNoteToCount[turtle] = 1;
        this.keySignature[turtle] = 'C ' + 'major';
        this.pushedNote[turtle] = false;
        this.oscList[turtle] = {};
        this.bpm[turtle] = [];
        this.inSetTimbre[turtle] = false;
        this.instrumentNames[turtle] = ['default'];
        this.inCrescendo[turtle] = [];
        this.crescendoDelta[turtle] = [];
        this.crescendoInitialVolume[turtle] = {'default': [DEFAULTVOLUME]};
        this.intervals[turtle] = [];
        this.semitoneIntervals[turtle] = [];
        this.markup[turtle] = [];
        this.staccato[turtle] = [];
        this.glide[turtle] = [];
        this.glideOverride[turtle] = 0;
        this.swing[turtle] = [];
        this.swingTarget[turtle] = [];
        this.swingCarryOver[turtle] = 0;
        this.tie[turtle] = false;
        this.tieNotePitches[turtle] = [];
        this.tieNoteExtras[turtle] = [];
        this.tieCarryOver[turtle] = 0;
        this.tieFirstDrums[turtle] = [];
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
        this.neighborArgNote1[turtle] = [];
        this.neighborArgNote2[turtle] = [];
        this.neighborArgBeat[turtle] = [];
        this.neighborArgCurrentBeat[turtle] = [];
        this.inDefineMode[turtle] = false;
        this.defineMode[turtle] = [];
        this.dispatchFactor[turtle] = 1;
        this.pickup[turtle] = 0;
        this.beatsPerMeasure[turtle] = 4;  // Default is 4/4 time.
        this.noteValuePerBeat[turtle] = 4;
        this.currentBeat[turtle] = 0;
        this.currentMeasure[turtle] = 0;
        this.justCounting[turtle] = [];
        this.justMeasuring[turtle] = [];
        this.notationStaging[turtle] = [];
        this.notationDrumStaging[turtle] = [];
        this.pickupPoint[turtle] = null;
        this.pickupPOW2[turtle] = false;
        this.firstPitch[turtle] = [];
        this.lastPitch[turtle] = [];
        this.pitchNumberOffset[turtle] = 39; // C4
        this.suppressOutput[turtle] = this.runningLilypond || this.runningAbc || this.compiling;
        this.moveable[turtle] = false;
        this.inNeighbor[turtle] = [];
        this.neighborStepPitch[turtle] = [];
        this.neighborNoteValue[turtle] = [];
        this.inHarmonic[turtle] = [];
        this.partials[turtle] = [];

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.playbackQueue[turtle] = [];
        } else {
            // Don't empty playback queue of precompiled content.
            if (!turtle in this.playbackQueue) {
                this.playbackQueue[turtle] = [];
            }
        }

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
        this.synth.changeInTemperament = false;

        this.checkingCompletionState = false;

        this.embeddedGraphicsFinished = {};

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this._prepSynths();
        }

        this.notationStaging = {};
        this.notationDrumStaging = {};

        // Each turtle needs to keep its own wait time and music
        // states.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.initTurtle(turtle);
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

        // Init the graphic state.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            this.turtles.turtleList[turtle].container.x = this.turtles.turtleX2screenX(this.turtles.turtleList[turtle].x);
            this.turtles.turtleList[turtle].container.y = this.turtles.turtleY2screenY(this.turtles.turtleList[turtle].y);
        }

        // Set up status block
        if (docById('statusDiv').style.visibility === 'visible') {
            // Ensure widget has been created before trying to
            // initialize it.
            if (this.statusMatrix === null) {
                this.statusMatrix = new StatusMatrix();
            }

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
                // this.errorMsg(NOACTIONERRORMSG, null, _('start'));
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

        console.log(this.blocks.blockList[blk].name);
        switch (this.blocks.blockList[blk].name) {
        case 'x':
            turtleObj.doSetXY(value, turtleObj.y);
            if (this.justCounting[turtle].length === 0) {
                this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setxy', value, turtleObj.y]);
            }
            break;
        case 'y':
            turtleObj.doSetXY(turtleObj.x, value);
            if (this.justCounting[turtle].length === 0) {
                this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setxy', turtleObj.x, value]);
            }
            break;
        case 'heading':
            turtleObj.doSetHeading(value);
            this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setheading', value]);
            break;
        case 'color':
            turtleObj.doSetColor(value);
            if (this.justCounting[turtle].length === 0) {
                this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setcolor', value]);
            }
            break;
        case 'shade':
            turtleObj.doSetValue(value);
            if (this.justCounting[turtle].length === 0) {
                this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setshade', value]);
            }
            break;
        case 'grey':
            turtleObj.doSetChroma(value);
            if (this.justCounting[turtle].length === 0) {
                this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setgrey', value]);
            }
            break;
        case 'pensize':
            turtleObj.doSetPensize(value);
            if (this.justCounting[turtle].length === 0) {
                this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setpensize', value]);
            }
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
            } else {
                this.bpm[turtle].push(value);
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
            this.previousNotePlayed[turtle] = this.lastNotePlayed[turtle];
            var obj = numberToPitch(value + this.pitchNumberOffset[turtle]);
            this.lastNotePlayed[turtle] = [obj[0] + obj[1], this.lastNotePlayed[turtle][1]];
            break;
        case 'notevolumefactor':  // master volume
            var len = this.masterVolume.length;
            this.masterVolume[len - 1] = value;
            if (!this.suppressOutput[turtle]) {
                this._setMasterVolume(value);
            }

            if (this.justCounting[turtle].length === 0) {
                this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setvolume', value]);
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
            if (!that.suppressOutput[turtle] && that.justCounting[turtle].length === 0) {
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
                if (that.justCounting[turtle].length === 0) {
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
            }
            break;
            // If we clicked on an action block, treat it like a do
            // block.
        case 'action':
        case 'do':
            if (args.length > 0) {
                if (args[0] in that.actions) {
                    if (that.justCounting[turtle].length === 0) {
                        that.notationLineBreak(turtle);
                    }

                    console.log('action: ' + args[0]);
                    childFlow = that.actions[args[0]];
                    childFlowCount = 1;
                } else {
                    console.log('action ' + args[0] + ' not found');
                    that.errorMsg(NOACTIONERRORMSG, blk, args[0]);
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
                    if (that.blocks.blockList[blk].connections[i + 1] != null) {
                        var t = (that.parseArg(that, turtle, that.blocks.blockList[blk].connections[i + 1], blk, receivedArg));
                        actionArgs.push(t);
                    } else {
                        actionArgs.push(null);
                    }
                }
            }

            if (name in that.actions) {
                if (that.justCounting[turtle].length === 0) {
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
            }
            break;
        case 'doArg':
            while(actionArgs.length > 0) {
                actionArgs.pop();
            }

            if (that.blocks.blockList[blk].argClampSlots.length > 0) {
                for (var i = 0; i < that.blocks.blockList[blk].argClampSlots.length; i++) {
                    if (that.blocks.blockList[blk].connections[i + 2] != null) {
                        var t = (that.parseArg(that, turtle, that.blocks.blockList[blk].connections[i + 2], blk, receivedArg));
                        actionArgs.push(t);
                    } else {
                        actionArgs.push(null);
                    }
                }
            }

            if (args.length >= 1) {
                if (args[0] in that.actions) {
                    if (that.justCounting[turtle].length === 0) {
                        that.notationLineBreak(turtle);
                    }
                    actionName = args[0];
                    childFlow = that.actions[args[0]];
                    childFlowCount = 1;
                } else {
                    that.errorMsg(NOACTIONERRORMSG, blk, args[0]);
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
                if (!that.suppressOutput[turtle] && that.justCounting[turtle].length === 0) {
                    that.unhighlightQueue[turtle].push(parentBlk);
                }
            }
            break;
        case 'wait':
            if (args.length === 1) {
                that._doWait(turtle, args[0]);
            }
            break;
        case 'comment':
            if (args[0] !== null) {
                console.log(args[0].toString());
                if (!that.suppressOutput[turtle] && that.turtleDelay > 0) {
                    that.textMsg(args[0].toString());
                }
            }
            break;
        case 'print':
            if (!that.inStatusMatrix) {
                if (args.length === 1) {
                    if (args[0] !== null) {
                        if (that.inNoteBlock[turtle].length > 0) {
                            that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                            that.markup[turtle].push(args[0].toString());
                        } else {
                            if (!that.suppressOutput[turtle]) {
                                that.textMsg(args[0].toString());
                            }

                            if (that.justCounting[turtle].length === 0) {
                                that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'print', args[0]]);
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

                        if (that.justCounting[turtle].length === 0) {
                            that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'speak', args[0]]);
                        }
                    }
                }
            }
            break;
        case 'newturtle':
            var cblk = that.blocks.blockList[blk].connections[1];
            var turtleName = that.parseArg(that, turtle, cblk, blk, receivedArg);
            if (that._getTargetTurtle(turtleName) === null) {
                var blockNumber = that.blocks.blockList.length;

                var x = that.turtles.turtleX2screenX(that.turtles.turtleList[turtle].x);
                var y = that.turtles.turtleY2screenY(that.turtles.turtleList[turtle].y);

                var newBlock = [[0, 'start', x, y, [null, 1, null]], [1, 'setturtlename2', 0, 0, [0, 2, null]], [2, ['text', {'value': turtleName}], 0, 0, [1]]];
                var __afterLoad = function () {
                    console.log('AFTERLOAD');
                    var thisTurtle = that.blocks.blockList[blockNumber].value;
                    that.initTurtle(thisTurtle);
                    that.turtles.turtleList[thisTurtle].queue = [];
                    that.parentFlowQueue[thisTurtle] = [];
                    that.unhighlightQueue[thisTurtle] = [];
                    that.parameterQueue[thisTurtle] = [];
                    that.turtles.turtleList[thisTurtle].running = true;
                    that._runFromBlock(that, thisTurtle, blockNumber, 0, receivedArg);
                    // Dispatch an event to indicate that this turtle
                    // is running.
                    that.stage.dispatchEvent(turtleName);
                    document.removeEventListener('finishedLoading', __afterLoad);
                };

                if (document.addEventListener) {
                    document.addEventListener('finishedLoading', __afterLoad);
                } else {
                    document.attachEvent('finishedLoading', __afterLoad);
                }

                that.blocks.loadNewBlocks(newBlock);
            } else {
                console.log('Turtle ' + turtleName + ' already exists.');
                that.stage.dispatchEvent(turtleName);
            }
            break;
        case 'setturtle':
            targetTurtle = that._getTargetTurtle(args[0]);
            if (targetTurtle !== null) {
                that._runFromBlock(that, targetTurtle, args[1], isflow, receivedArg);
            } else {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    that.errorMsg(_('Cannot find mouse') + ' ' + args[0], blk)
                } else {
                    that.errorMsg(_('Cannot find turtle') + ' ' + args[0], blk)
                }
            }
            break;
        case 'repeat':
            if (args[1] === undefined) {
                // nothing to do
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number' || args[0] < 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 1;
            } else {
                var arg = args[0];
            }

            childFlow = args[1];
            childFlowCount = Math.floor(arg);
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
        case 'movable':  // legacy typo
            if (args.length === 1) {
                that.moveable[turtle] = args[0];
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

                    // We need to reset the turtle time.
                    if (that.firstNoteTime == null) {
                        var d = new Date();
                        that.firstNoteTime = d.getTime();
                    }

                    var d = new Date();
                    var elapsedTime = (d.getTime() - this.firstNoteTime) / 1000;
                    that.turtleTime[turtle] = elapsedTime;
                    that.previousTurtleTime[turtle] = elapsedTime;
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
        case 'storein2':
            if (args.length === 1) {
                that.boxes[that.blocks.blockList[blk].privateData] = args[0];
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
            } else {
                var i = 1;
            }

            if (args.length > 0) {
                var cblk = that.blocks.blockList[blk].connections[1];
                if (that.blocks.blockList[cblk].name === 'text') {
                    // Work-around to #1302
                    // Look for a namedbox with this text value.
                    var name = this.blocks.blockList[cblk].value;
                    if (name in this.boxes) {
                        this.boxes[name] = this.boxes[name] + i;
                        break;
                    }
                }

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

                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'clear']);
                }
            }
            break;
        case 'setxy':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
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

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setxy', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'arc':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
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

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'arc', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'bezier':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
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

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'bezier', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'controlpoint1':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.cp1x[turtle] = args[0];
                    that.cp1y[turtle] = args[1];
                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'controlpoint1', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'controlpoint2':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string' || typeof(args[1]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                } else if (that.inNoteBlock[turtle].length > 0) {
                    that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
                } else {
                    that.cp2x[turtle] = args[0];
                    that.cp2y[turtle] = args[1];
                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'controlpoint2', args[0], args[1]]);
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

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'forward', args[0]]);
                    }
                }
            }
            break;
        case 'back':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
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

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'forward', -args[0]]);
                    }
                }
            }
            break;
        case 'right':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
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

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'right', args[0]]);
                    }
                }
            }
            break;
        case 'left':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
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

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'right', -args[0]]);
                    }
                }
            }
            break;
        case 'setheading':
            if (args.length === 1) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
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
                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setheading', args[0]]);
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
                        that._processShow(turtle, blk, args[0], args[1]);
                    }

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'show', args[0], args[1]]);
                    }
                }
            }
            break;
        case 'turtleshell':
            if (args.length === 2) {
                if (typeof(args[0]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                } else {
                    that.turtles.turtleList[turtle].doTurtleShell(args[0], args[1]);
                }
            }
            break;
        case 'setturtlename':
            var foundTargetTurtle = false;
            if (args[0] === null || args[1] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            } else if (args[0] === -1) {
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
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    that.errorMsg(_('Cannot find mouse') + ' ' + args[0], blk);
                } else {
                    that.errorMsg(_('Cannot find turtle') + ' ' + args[0], blk);
                }
            } else {
                that.turtles.turtleList[turtle].rename(args[1]);
            }
            break;
        case 'setturtlename2':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            that.turtles.turtleList[turtle].rename(args[0]);
            break;
        case 'startTurtle':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            var targetTurtle = that._getTargetTurtle(args[0]);
            if (targetTurtle == null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    that.errorMsg(_('Cannot find mouse') + ' ' + args[0], blk)
                } else {
                    that.errorMsg(_('Cannot find turtle') + ' ' + args[0], blk)
                }
            } else {
                if (that.turtles.turtleList[targetTurtle].running) {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        that.errorMsg(_('Mouse is already running.'), blk);
                    } else {
                        that.errorMsg(_('Turtle is already running.'), blk);
                    }
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
                    that.errorMsg(_('Cannot find start block') + ' ' + args[0], blk)
                }
            }
            break;
        case 'stopTurtle':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            var targetTurtle = that._getTargetTurtle(args[0]);
            if (targetTurtle == null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    that.errorMsg(_('Cannot find mouse') + ' ' + args[0], blk)
                } else {
                    that.errorMsg(_('Cannot find turtle') + ' ' + args[0], blk)
                }
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
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            var targetTurtle = that._getTargetTurtle(args[0]);
            if (targetTurtle == null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    that.errorMsg(_('Cannot find mouse') + ' ' + args[0], blk)
                } else {
                    that.errorMsg(_('Cannot find turtle') + ' ' + args[0], blk)
                }
            } else {
                that.turtleTime[turtle] = that.turtleTime[targetTurtle];
            }
            break;
        case 'setcolor':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (typeof(args[0]) === 'string') {
                that.errorMsg(NANERRORMSG, blk);
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
                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setcolor', args[0]]);
                }
            }
            break;
        case 'setfont':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (typeof(args[0]) === 'string') {
                that.turtles.turtleList[turtle].doSetFont(args[0]);
            }
            break;
        case 'sethue':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (typeof(args[0]) === 'string') {
                that.errorMsg(NANERRORMSG, blk);
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
                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'sethue', args[0]]);
                }
            }
            break;
        case 'setshade':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (typeof(args[0]) === 'string') {
                that.errorMsg(NANERRORMSG, blk);
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
                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setshade', args[0]]);
                }
            }
            break;
        case 'settranslucency':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (typeof(args[0]) === 'string') {
                that.errorMsg(NANERRORMSG, blk);
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
                var arg = args[0] % 101;
                var alpha = 1.0 - (arg / 100);
                that.turtles.turtleList[turtle].doSetPenAlpha(alpha);
                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'settranslucency', arg]);
                }
            }
            break;
        case 'setgrey':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (typeof(args[0]) === 'string') {
                that.errorMsg(NANERRORMSG, blk);
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
                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setgrey', args[0]]);
                }
            }
            break;
        case 'setpensize':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (typeof(args[0]) === 'string') {
                that.errorMsg(NANERRORMSG, blk);
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
                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setpensize', args[0]]);
                }
            }
            break;
        case 'fill':
            if (args[0] === undefined) {
                // nothing to do
                break;
            }

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

                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'fill']);
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

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'fill']);
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
            if (args[0] === undefined) {
                // nothing to do
                break;
            }

            if (that.inNoteBlock[turtle].length > 0) {
                that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
            } else {
                that.turtles.turtleList[turtle].doStartHollowLine();
                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'hollowline']);
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
                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'hollowline']);
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
            // Deprecated
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
                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'penup']);
                }
            }
            break;
        case 'pendown':
            if (that.inNoteBlock[turtle].length > 0) {
                that.embeddedGraphics[turtle][last(that.inNoteBlock[turtle])].push(blk);
            } else {
                that.turtles.turtleList[turtle].doPenDown();
                if (that.justCounting[turtle].length === 0) {
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'pendown']);
                }
            }
            break;
        case 'openProject':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            url = args[0];

            function ValidURL(str) {
                var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                                         '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                                         '((\\d{1,3}\\.) {3}\\d{1,3}))'+ // OR ip (v4) address
                                         '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                                         '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                                         '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
                if (!pattern.test(str)) {
                    that.errorMsg(_('Please enter a valid URL.'));
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
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

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
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (args.length === 1) {
                if (that.svgBackground) {
                    that.svgOutput = '<rect x="0" y="0" height="' + that.canvas.height + '" width="' + that.canvas.width + '" fill="' + body.style.background + '"/> ' + that.svgOutput;
                }

                save.saveSVG(args[0]);
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
        case 'reverseHeap':
            that.turtleHeaps[turtle] = that.turtleHeaps[turtle].reverse();
            break;
        case 'push':
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (!(turtle in that.turtleHeaps)) {
                that.turtleHeaps[turtle] = [];
            }

            that.turtleHeaps[turtle].push(args[0]);
            break;
        case 'saveHeap':
            if (args[0] !== null && turtle in that.turtleHeaps) {
                save.download('json', 'data:text/json;charset-utf-8,'+JSON.stringify(that.turtleHeaps[turtle]), args[0]);
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
            if (args[0] === null || args[1] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

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
            if (args[0] === null || args[1] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            var name = args[0];
            var url = args[1];
            if (name in that.turtleHeaps) {
                var data = JSON.stringify(that.turtleHeaps[name]);
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open('POST', url, true);
                xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
                xmlHttp.send(data);
            } else {
                that.errorMsg(_('Cannot find a valid heap for') + ' ' + name);
            }
            break;
        case 'setHeapEntry':
            if (args[0] === null || args[1] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (typeof(args[0]) !== 'number' || typeof(args[1]) !== 'number') {
                that.errorMsg(NANERRORMSG, blk);
                break;
            }

            if (!(turtle in that.turtleHeaps)) {
                that.turtleHeaps[turtle] = [];
            }

            var idx = Math.floor(args[0]);
            if (idx < 1) {
                that.errorMsg(_('Index must be > 0.'))
                idx = 1;
            }

            if (idx > 1000) {
                that.errorMsg(_('Maximum heap size is 1000.'))
                idx = 1000;
            }

            // If index > heap length, grow the heap.
            while (that.turtleHeaps[turtle].length < idx) {
                that.turtleHeaps[turtle].push(0);
            }

            that.turtleHeaps[turtle][idx - 1] = args[1];
            break;

            // Actions for music-related blocks
        case 'savelilypond':
            if (args.length === 1) {
                save.afterSaveLilypond(args[0]);
            }
            break;
        case 'amsynth':
            var harmonicity;
            if (that.inTimbre) {
                that.timbre.AMSynthParams = [];
                if (that.timbre.osc.length != 0) {
                    that.errorMsg(_('Unable to use synth due to existing oscillator'));
                }
            }

            if (args[0] === null ||  typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 1;
            } else {
                var arg = args[0];
            }

            if (arg < 0) {
                that.errorMsg(_('The input cannot be negative.'));
                harmonicity = -arg;
            } else {
                harmonicity = arg;
            }

            if (that.inTimbre) {
                that.timbre.amSynthParamvals['harmonicity'] = harmonicity;
                that.synth.createSynth(turtle, that.timbre.instrumentName, 'amsynth', that.timbre.amSynthParamvals);

                that.timbre.AMSynthesizer.push(blk);
                that.timbre.AMSynthParams.push(harmonicity);
            }
            break;
        case 'fmsynth':
            var modulationIndex;
            if (that.inTimbre) {
                that.timbre.FMSynthParams = [];
                if (that.timbre.osc.length != 0) {
                    that.errorMsg(_('Unable to use synth due to existing oscillator'));
                }
            }

            if (args[0] === null ||  typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 10;
            } else {
                var arg = args[0];
            }

            if (arg < 0) {
                that.errorMsg(_('The input cannot be negative.'));
                modulationIndex = -arg;
            } else {
                modulationIndex = arg;
            }

            if (that.inTimbre) {
                that.timbre.fmSynthParamvals['modulationIndex'] = modulationIndex;
                that.synth.createSynth(turtle, that.timbre.instrumentName, 'fmsynth', that.timbre.fmSynthParamvals);

                that.timbre.FMSynthesizer.push(blk);
                that.timbre.FMSynthParams.push(modulationIndex);
            }
            break;
        case 'duosynth':
            var synthVibratoRate;
            var synthVibratoAmount;
            if (that.inTimbre) {
                if (that.timbre.osc.length != 0) {
                    that.errorMsg(_('Unable to use synth due to existing oscillator'));
                }

                that.timbre.duoSynthParams = [];
            }

            if (args[0] === null ||  typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 10;
            } else {
                var arg0 = args[0];
            }

            if (args[1] === null ||  typeof(args[1]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 6;
            } else {
                var arg1 = args[1];
            }

            synthVibratoRate = arg0;
            synthVibratoAmount = arg1;

            if (that.inTimbre) {
                that.timbre.duoSynthParamVals['vibratoRate'] = synthVibratoRate;
                that.timbre.duoSynthParamVals['vibratoAmount'] = synthVibratoAmount;
                that.synth.createSynth(turtle, that.timbre.instrumentName, 'duosynth', that.timbre.duoSynthParamVals);

                that.timbre.duoSynthesizer.push(blk);
                that.timbre.duoSynthParams.push(synthVibratoRate);
                that.timbre.duoSynthParams.push(synthVibratoAmount);
            }
            break;
        case 'saveabc':
            if (args.length === 1) {
                save.afterSaveAbc(args[0]);
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
                for (var mode in MUSICALMODES) {
                    if (mode === args[1] || _(mode) === args[1]) {
                        modename = mode;
                        that._modeBlock = that.blocks.blockList[blk].connections[2];
                        break;
                    }
                }

                // Check to see if there are any transpositions on the key.
                if (turtle in that.transposition) {
                    var noteObj = getNote(args[0], 4, that.transposition[turtle], that.keySignature[turtle], false, null, that.errorMsg);
                    that.keySignature[turtle] = noteObj[0] + ' ' + modename;
                    that.notationKey(turtle, noteObj[0], modename);
                } else {
                    that.keySignature[turtle] = args[0] + ' ' + modename;
                    that.notationKey(turtle, args[0], modename);
                }
            }
            break;
        case 'definemode':
            if (args[1] === undefined) {
                // nothing to do
                break;
            }

            that.inDefineMode[turtle] = true;
            that.defineMode[turtle] = [];

            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var modeName = 'custom';
            } else {
                var modeName = args[0].toLowerCase();
            }

            childFlow = args[1];
            childFlowCount = 1;

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
            that.pitchStaircase.stairPitchBlocks = [];

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
            that.tempo.BPMBlocks = [];
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
            } else {
                that.timbre.instrumentName = DEFAULTVOICE;
                that.errorMsg(NOINPUTERRORMSG, blk);
            }

            instrumentsEffects[turtle][that.timbre.instrumentName] = {};
            instrumentsEffects[turtle][that.timbre.instrumentName]['vibratoActive'] = false;
            instrumentsEffects[turtle][that.timbre.instrumentName]['distortionActive'] = false;
            instrumentsEffects[turtle][that.timbre.instrumentName]['tremoloActive'] = false;
            instrumentsEffects[turtle][that.timbre.instrumentName]['phaserActive'] = false;
            instrumentsEffects[turtle][that.timbre.instrumentName]['chorusActive'] = false;
            instrumentsFilters[turtle][that.timbre.instrumentName] = [];

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
                that.modeWidget.init(that, that._modeBlock);
            }

            that._setListener(turtle, listenerName, __listener);
            break;
        // Deprecated
        case 'setmasterbpm':
            if (args.length === 1 && typeof(args[0]) === 'number') {
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
            // Deprecated
        case 'setbpm':
            if (args.length === 2 && typeof(args[0]) === 'number') {
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
        case 'setmasterbpm2':
            if (args.length === 2 && typeof(args[0]) === 'number' && typeof(args[1]) === 'number') {
                var bpm  = args[0] * args[1] / 0.25
                if (bpm < 30) {
                    that.errorMsg(_('Beats per minute must be > 30.'))
                    that._masterBPM = 30;
                } else if (bpm > 1000) {
                    that.errorMsg(_('Maximum beats per minute is 1000.'))
                    that._masterBPM = 1000;
                } else {
                    that._masterBPM = bpm;
                }

                that.notationTempo(turtle, args[0], args[1]);
                that.defaultBPMFactor = TONEBPM / that._masterBPM;
            }

            if (that.inTempo) {
                that.tempo.BPMBlocks.push(blk);
                var bpmnumberblock = that.blocks.blockList[blk].connections[1]
                that.tempo.BPMs.push(that.blocks.blockList[bpmnumberblock].text.text);
            }
            break;
        case 'setbpm2':
            if (args.length === 3 && typeof(args[0]) === 'number' && typeof(args[1]) == 'number') {
                var bpm  = args[0] * args[1] / 0.25
                if (args[0] < 30) {
                    that.errorMsg(_('Beats per minute must be > 30.'))
                    var bpm = 30;
                } else if (args[0] > 1000) {
                    that.errorMsg(_('Maximum beats per minute is 1000.'))
                    bpm = 1000;
                }

                that.notationTempo(turtle, args[0], args[1]);
                that.bpm[turtle].push(bpm);

                childFlow = args[2];
                childFlowCount = 1;

                var listenerName = '_bpm_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.bpm[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            }
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
                    that.pitchTimeMatrix.sorted = false;
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
            if (args.length === 4 && typeof(args[0]) === 'number') {
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
                    that.errorMsg(_('You are adding multiple envelope blocks.'));
                } else {
                    // Create the synth for the instrument.
                    that.synth.createSynth(turtle, that.timbre.instrumentName, that.timbre.synthVals['oscillator']['source'], that.timbre.synthVals);
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

            if (args.length === 3 && typeof(args[1]) === 'number') {
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
                    if (!(that.timbre.instrumentName in instrumentsFilters[turtle])) {
                        instrumentsFilters[turtle][that.timbre.instrumentName] = [];
                    }
                    // Add the filter to the instrument
                    instrumentsFilters[turtle][that.timbre.instrumentName].push({'filterType': filtertype, 'filterRolloff': rollOff, 'filterFrequency': freq});

                    that.timbre.fil.push(blk);
                    that.timbre.filterParams.push(filtertype);
                    that.timbre.filterParams.push(rollOff);
                    that.timbre.filterParams.push(freq);
                }
            }
            break;
        case 'oscillator':
            var oscillatorType = DEFAULTOSCILLATORTYPE;
            var partials = 0;

            if (args.length === 2 && typeof(args[1]) === 'number') {
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
                    that.errorMsg(_('You are adding multiple oscillator blocks.'));
                } else {
                    that.timbre.oscParams = [];
                    that.synth.createSynth(turtle, that.timbre.instrumentName, oscillatorType, that.timbre.synthVals);
                }

                that.timbre.osc.push(blk);
                that.timbre.oscParams.push(oscillatorType);
                that.timbre.oscParams.push(partials);
            }
            break;
        case 'invert1':
            if (args[3] === undefined) {
                // Nothing to do...
                break;
            }

            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 'sol';
            } else {
                var arg0 = args[0];
            }

            if (args[1] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 4;
            } else {
                var arg1 = args[1];
            }

            if (args[2] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
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
                var octave = calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], arg0);
                that.invertList[turtle].push([arg0, octave, arg2]);
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
            if (that.inNoteBlock[turtle].length > 0) {
                that.notePitches[turtle][last(that.inNoteBlock[turtle])].push('rest');
                that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(4);
                that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(0);
                that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(0);
                that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
                that.pushedNote[turtle] = true;
            }
            break;
        case 'steppitch':
            // Similar to pitch but calculated from previous note played.
            if (!that.inMatrix && that.inNoteBlock[turtle].length === 0) {
                that.errorMsg(_('The Scalar Step Block must be used inside of a Note Block.'), blk);
                that.stopTurtle = true;
                break;
            }

            if (typeof(args[0]) !== 'number') {
                that.errorMsg(NANERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            // If we are just counting notes we don't care about the pitch.
            if (that.justCounting[turtle].length > 0 && that.lastNotePlayed[turtle] == null) {
                console.log('Just counting, so spoofing last note played.');
                that.previousNotePlayed[turtle] = ['G4', 4];
                that.lastNotePlayed[turtle] = ['G4', 4];
            }

            if (that.lastNotePlayed[turtle] == null) {
                that.errorMsg('The Scalar Step Block must be preceded by a Pitch Block.', blk);
                that.stopTurtle = true;
                break;
            }

            function addPitch(note, octave, cents, direction) {
                t = transposition + that.register[turtle] * 12;
                var noteObj = getNote(note, octave, t, that.keySignature[turtle], true, direction, that.errorMsg);

                if (that.drumStyle[turtle].length > 0) {
                    var drumname = last(that.drumStyle[turtle]);
                    that.pitchDrumTable[turtle][noteObj[0] + noteObj[1]] = drumname;
                }

                if (!that.inMatrix) {
                    that.notePitches[turtle][last(that.inNoteBlock[turtle])].push(noteObj[0]);
                    that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(noteObj[1]);
                    that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(cents);
                    if (cents !== 0) {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(pitchToFrequency(noteObj[0], noteObj[1], cents, that.keySignature[turtle]));
                    } else {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(0);
                    }
                }

                return noteObj;
            }

            var len = that.lastNotePlayed[turtle][0].length;

            var noteObj = that._addScalarTransposition(turtle, that.lastNotePlayed[turtle][0].slice(0, len - 1), parseInt(that.lastNotePlayed[turtle][0].slice(len - 1)), args[0]);

            var delta = 0;
            if (!(that.invertList[turtle].length === 0)) {
                delta += that._calculateInvert(turtle, noteObj[0], noteObj[1]);
            }

            var transposition = 2 * delta;
            if (turtle in that.transposition) {
                transposition += that.transposition[turtle];
            }

            var noteObj1 = addPitch(noteObj[0], noteObj[1], 0);
            // Only apply the transposition to the base note of an interval
            transposition = 0;

            if (that.inMatrix) {
                that.pitchTimeMatrix.addRowBlock(blk);
                if (that.pitchBlocks.indexOf(blk) === -1) {
                    that.pitchBlocks.push(blk);
                }

                that.pitchTimeMatrix.rowLabels.push(noteObj1[0]);
                that.pitchTimeMatrix.rowArgs.push(noteObj1[1]);

                that.previousNotePlayed[turtle] = that.lastNotePlayed[turtle];
                that.lastNotePlayed[turtle] = [noteObj1[0] + noteObj1[1], 4];
            }

            if (turtle in that.intervals && that.intervals[turtle].length > 0) {
                for (var i = 0; i < that.intervals[turtle].length; i++) {
                    var ii = getInterval(that.intervals[turtle][i], that.keySignature[turtle], noteObj1[0]);
                    var noteObj2 = getNote(noteObj1[0], noteObj1[1], ii, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                    addPitch(noteObj2[0], noteObj2[1], 0);
                }
            }

            if (turtle in that.semitoneIntervals && that.semitoneIntervals[turtle].length > 0) {
                for (var i = 0; i < that.semitoneIntervals[turtle].length; i++) {
                    var noteObj2 = getNote(noteObj1[0], noteObj1[1], that.semitoneIntervals[turtle][i][0], that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                    addPitch(noteObj2[0], noteObj2[1], 0, that.semitoneIntervals[turtle][i][1]);
                }
            }

            if (that.inNoteBlock[turtle].length > 0) {
                that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
            }

            that.pushedNote[turtle] = true;
            break;
        case 'playdrum':
            if (args.length !== 1 || args[0] == null || typeof(args[0]) !== 'string') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 'kick';
            } else {
                var arg = args[0];
            }

            var drumname = 'kick';
            if (arg.slice(0, 4) === 'http') {
                drumname = arg;
            } else {
                for (var drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0] === arg) {
                        drumname = DRUMNAMES[drum][1];
                        break;
                    } else if (DRUMNAMES[drum][1] === arg) {
                        drumname = arg;
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
                that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
            }

            that.pushedNote[turtle] = true;
            break;
        case 'setpitchnumberoffset':
            console.log(args[0] + ' ' + args[1]);
            if (args[0] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 'C';
            } else {
                var arg0 = args[0];
            }

            if (args[1] === null) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 4;
            } else {
                var arg1 = args[1];
            }

            var octave = Math.floor(calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], arg0));
            that.pitchNumberOffset[turtle] = pitchToNumber(arg0, octave, that.keySignature[turtle]);
            break;
        case 'pitchnumber':
        case 'scaledegree':
        case 'pitch':
            console.log(that.blocks.blockList[blk].name + ' ' + args[0]);
            if (that.blocks.blockList[blk].name === 'pitchnumber') {
                if (args.length !== 1 || args[0] == null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    var arg0 = 7;
                } else {
                    var arg0 = args[0];
                }

                if (typeof(arg0) !== 'number') {
                    that.errorMsg(NANERRORMSG, blk);
                    arg0 = 7;
                }

                if (that.inDefineMode[turtle]) {
                    that.defineMode[turtle].push(Math.floor(arg0));
                    break;
                } else {
                    // In number to pitch we assume A0 == 0. Here we
                    // assume that C4 == 0, so we need an offset of 39.
                    var obj = numberToPitch(Math.floor(arg0 + that.pitchNumberOffset[turtle]));

                    note = obj[0];
                    octave = obj[1];
                    cents = 0;
                    that.currentNote = note;
                }
            } else {
                if (args[0] === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    var arg0 = 'sol';
                } else {
                    var arg0 = args[0];
                }

                if (args[1] === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    var arg1 = 4;
                } else {
                    var arg1 = args[1];
                }

                if (typeof(arg0) === 'number' && that.blocks.blockList[blk].name === 'pitch') {
                    // We interpret numbers two different ways:
                    // (1) a positive integer between 1 and 12 is taken to be
                    // a moveable solfege, e.g., 1 == do; 2 == re...
                    // (2) if frequency is input, ignore octave (arg1).
                    // Negative numbers will throw an error.
                    if (arg0 < 13) { // moveable solfege
                        if (arg0 < 1) {
                            console.log(arg0);
                            that.errorMsg(INVALIDPITCH, blk);
                            arg0 = 7;  // throws an error
                        }

                        note = scaleDegreeToPitch(that.keySignature[turtle], Math.floor(arg0));
                        that.currentNote = note;
                        var octave = Math.floor(calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], that.currentNote));
                        var cents = 0;
                    } else {
                        if (arg0 < A0 || arg0 > C8) {
                            that.errorMsg(INVALIDPITCH, blk);
                            console.log(arg0);
                            arg0 = 398;
                        }

                        var obj = frequencyToPitch(arg0);
                        var note = obj[0];
                        that.currentNote = note;
                        var octave = obj[1];
                        var cents = obj[2];
                    }
                } else if (typeof(arg0) === 'number' && that.blocks.blockList[blk].name == 'scaledegree') {
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
                        console.log(arg0);
                        that.errorMsg(INVALIDPITCH, blk);
                        note = 7;
                    }

                    var obj = keySignatureToMode(that.keySignature[turtle]);
                    var modeLength = MUSICALMODES[obj[1]].length;
                    var scaleDegree = Math.floor(arg0 - 1) % modeLength;
                    scaleDegree += 1;

                    if (neg) {
                        if (scaleDegree > 1) {
                            scaleDegree = modeLength - scaleDegree + 2;
                        }
                        note = scaleDegreeToPitch(that.keySignature[turtle], scaleDegree);
                        that.currentNote = note;
                        var deltaOctave = Math.floor((arg0 + modeLength - 2) / modeLength);
                        var octave = Math.floor(calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], that.currentNote)) - deltaOctave;
                    } else {
                        note = scaleDegreeToPitch(that.keySignature[turtle], scaleDegree);
                        that.currentNote = note;
                        var deltaOctave = Math.floor((arg0 - 1) / modeLength);
                        var octave = Math.floor(calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], that.currentNote)) + deltaOctave;
                    }

                    var cents = 0;
                } else {
                    var cents = 0;
                    var note = arg0;
                    that.currentNote = note;
                    if (calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], that.currentNote) < 0) {
                        console.log('minimum allowable octave is 0');
                        var octave = 0;
                    } else if (calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], that.currentNote) > 9) {
                        // Humans can only hear 10 octaves.
                        console.log('clipping octave at 9');
                        var octave = 9;
                    } else {
                        // Octave must be a whole number.
                        var octave = Math.floor(calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], that.currentNote));
                    }
                }
            }

            if (that.inNeighbor[turtle].length > 0) {
                var noteObj = getNote(note, octave, that.scalarTransposition[turtle], that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                that.neighborArgNote1[turtle].push(noteObj[0] + noteObj[1]);
                if (that.blocks.blockList[last(that.inNeighbor[turtle])].name === 'neighbor2') {
                    var noteObj2 = that._addScalarTransposition(turtle, note, octave, parseInt(that.neighborStepPitch[turtle]));
                    if (that.scalarTransposition[turtle] !== 0) {
                        noteObj2 = getNote(noteObj2[0], noteObj2[1], that.scalarTransposition[turtle], that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                    }
                } else {
                    var noteObj2 = getNote(note, octave, that.scalarTransposition[turtle] + parseInt(that.neighborStepPitch[turtle]), that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                }

                that.neighborArgNote2[turtle].push(noteObj2[0] + noteObj2[1]);
            }

            var noteObj = that._addScalarTransposition(turtle, note, octave, that.scalarTransposition[turtle]);
            note = noteObj[0];
            that.currentNote = note;
            octave = noteObj[1];

            var delta = 0;

            if (that.justMeasuring[turtle].length > 0) {
                var transposition = 2 * delta;
                if (turtle in that.transposition) {
                    transposition += that.transposition[turtle];
                }

                var noteObj = getNote(note, octave, transposition, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                if (!that.validNote) {
                    console.log(arg0);
                    that.errorMsg(INVALIDPITCH, blk);
                    that.stopTurtle = true;
                    break;
                }

                var n = that.justMeasuring[turtle].length;
                var pitchNumber = pitchToNumber(noteObj[0], noteObj[1], that.keySignature[turtle]) - that.pitchNumberOffset[turtle];
                if (that.firstPitch[turtle].length < n) {
                    that.firstPitch[turtle].push(pitchNumber);
                } else if (that.lastPitch[turtle].length < n) {
                    that.lastPitch[turtle].push(pitchNumber);
                }
            } else if (that.inPitchDrumMatrix) {
                if (note.toLowerCase() !== 'rest') {
                    that.pitchDrumMatrix.addRowBlock(blk);
                    if (that.pitchBlocks.indexOf(blk) === -1) {
                        that.pitchBlocks.push(blk);
                    }
                }

                if (!(that.invertList[turtle].length === 0)) {
                    delta += that._calculateInvert(turtle, note, octave);
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

                    var nnote = getNote(note, octave, transposition, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
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
                    delta += that._calculateInvert(turtle, note, octave);
                }

                if (that.duplicateFactor[turtle].length > 0) {
                    var duplicateFactor = that.duplicateFactor[turtle];
                } else {
                    var duplicateFactor = 1;
                }

                for (var i = 0; i < duplicateFactor; i++) {
                    var transposition = 2 * delta;
                    if (turtle in that.transposition) {
                        transposition += that.transposition[turtle];
                    }

                    var noteObj = getNote(note, octave, transposition, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                    that.previousNotePlayed[turtle] = that.lastNotePlayed[turtle];
                    that.lastNotePlayed[turtle] = [noteObj[0] + noteObj[1], 4];

                    if (that.keySignature[turtle][0] === 'C' && that.keySignature[turtle][1].toLowerCase() === 'major' && noteIsSolfege(note)) {
                        noteObj[0] = getSolfege(noteObj[0]);
                    }


                    // If we are in a setdrum clamp, override the pitch.
                    if (that.drumStyle[turtle].length > 0) {
                        that.pitchTimeMatrix.rowLabels.push(last(that.drumStyle[turtle]));
                        that.pitchTimeMatrix.rowArgs.push(-1);
                    } else {
                        that.pitchTimeMatrix.rowLabels.push(noteObj[0]);
                        that.pitchTimeMatrix.rowArgs.push(noteObj[1]);
                    }
                }
            } else if (that.inNoteBlock[turtle].length > 0) {

                function addPitch(note, octave, cents, direction) {
                    t = transposition + that.register[turtle] * 12;
                    var noteObj = getNote(note, octave, t, that.keySignature[turtle], that.moveable[turtle], direction, that.errorMsg);
                    if (!that.validNote) {
                        that.errorMsg(INVALIDPITCH, blk);
                        that.stopTurtle = true;
                    }

                    if (that.drumStyle[turtle].length > 0) {
                        var drumname = last(that.drumStyle[turtle]);
                        that.pitchDrumTable[turtle][noteObj[0] + noteObj[1]] = drumname;
                    }

                    that.notePitches[turtle][last(that.inNoteBlock[turtle])].push(noteObj[0]);
                    that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(noteObj[1]);
                    that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(cents);
                    if (cents !== 0) {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(pitchToFrequency(noteObj[0], noteObj[1], cents, that.keySignature[turtle]));
                    } else {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(0);
                    }

                    return noteObj;
                }

                if (!(that.invertList[turtle].length === 0)) {
                    delta += that._calculateInvert(turtle, note, octave);
                }

                var transposition = 2 * delta;
                if (turtle in that.transposition) {
                    transposition += that.transposition[turtle];
                }

                var noteObj1 = addPitch(note, octave, cents);
                // Only apply the transposition to the base note of an interval
                transposition = 0;

                if (turtle in that.intervals && that.intervals[turtle].length > 0) {
                    for (var i = 0; i < that.intervals[turtle].length; i++) {
                        var ii = getInterval(that.intervals[turtle][i], that.keySignature[turtle], noteObj1[0]);
                        var noteObj2 = getNote(noteObj1[0], noteObj1[1], ii, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                        addPitch(noteObj2[0], noteObj2[1], cents);
                    }
                }

                if (turtle in that.semitoneIntervals && that.semitoneIntervals[turtle].length > 0) {
                    for (var i = 0; i < that.semitoneIntervals[turtle].length; i++) {
                        var noteObj2 = getNote(noteObj1[0], noteObj1[1], that.semitoneIntervals[turtle][i][0], that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                        addPitch(noteObj2[0], noteObj2[1], cents, that.semitoneIntervals[turtle][i][1]);
                    }
                }

                if (that.inNoteBlock[turtle].length > 0) {
                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
                }

                that.pushedNote[turtle] = true;
            } else if (that.drumStyle[turtle].length > 0) {
                var drumname = last(that.drumStyle[turtle]);
                var noteObj1 = getNote(note, octave, transposition, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                that.pitchDrumTable[turtle][noteObj1[0] + noteObj1[1]] = drumname;
            } else if (that.inPitchStaircase) {
                var frequency = pitchToFrequency(arg0, calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], arg0), 0, that.keySignature[turtle]);
                var noteObj1 = getNote(arg0, calcOctave(that.currentOctave[turtle], arg1, that.lastNotePlayed[turtle], arg0), 0, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);

                var flag = 0;

                for (var i = 0 ; i < that.pitchStaircase.Stairs.length; i++) {
                    if (that.pitchStaircase.Stairs[i][2] < parseFloat(frequency)) {
                        that.pitchStaircase.Stairs.splice(i, 0, [noteObj1[0], noteObj1[1], parseFloat(frequency), 1, 1]);
                        flag = 1;
                        break;
                    }

                    if (that.pitchStaircase.Stairs[i][2] === parseFloat(frequency)) {
                        that.pitchStaircase.Stairs.splice(i, 1, [noteObj1[0], noteObj1[1], parseFloat(frequency), 1, 1]);
                        flag = 1;
                        break;
                    }
                }

                if (flag === 0) {
                    that.pitchStaircase.Stairs.push([noteObj1[0], noteObj1[1], parseFloat(frequency), 1, 1]);
                }

                that.pitchStaircase.stairPitchBlocks.push(blk);
            } else {
                if (that.blocks.blockList[blk].connections[0] == null && last(that.blocks.blockList[blk].connections) == null) {
                    // Play a stand-alone pitch block as a quarter note.
                    that.clearNoteParams(turtle, blk, []);
                    if (that.currentCalculatedOctave[turtle] == undefined) {
                        that.currentCalculatedOctave[turtle] = 4;
                    }
                    var noteObj = getNote(arg0, calcOctave(that.currentCalculatedOctave[turtle], arg1, that.lastPitchPlayed[turtle], arg0), 0, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                    if (!that.validNote) {
                        that.errorMsg(INVALIDPITCH, blk);
                        that.stopTurtle = true;
                    }

                    that.inNoteBlock[turtle].push(blk);
                    that.notePitches[turtle][last(that.inNoteBlock[turtle])].push(noteObj[0]);
                    that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(noteObj[1]);
                    that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(cents);
                    if (cents !== 0) {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(pitchToFrequency(noteObj[0], noteObj[1], cents, that.keySignature[turtle]));
                    } else {
                        that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(0);
                    }

                    if (that.bpm[turtle].length > 0) {
                        var bpmFactor = TONEBPM / last(that.bpm[turtle]);
                    } else {
                        var bpmFactor = TONEBPM / that._masterBPM;
                    }

                    var noteBeatValue = 4;
                    var beatValue = bpmFactor / noteBeatValue;

                    __callback = function () {
                        var j = that.inNoteBlock[turtle].indexOf(blk);
                        that.inNoteBlock[turtle].splice(j, 1);
                    };

                    that._processNote(noteBeatValue, blk, turtle, __callback);
                } else {
                    that.errorMsg(_('Pitch Block: Did you mean to use a Note block?'), blk);
                }
            }
            break;
        case 'rhythm2':
        case 'rhythm':
            if (args[0] === null || typeof(args[0]) !== 'number' || args[0] < 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 3;
            } else {
                var arg0 = args[0];
            }

            if (args[1] === null || typeof(args[1]) !== 'number' || args[1] <= 0) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 1 / 4;
            } else {
                var arg1 = args[1];
            }

            if (that.blocks.blockList[blk].name === 'rhythm2') {
                var noteBeatValue = 1 / arg1;
            } else {
                var noteBeatValue = arg1;
            }

            if (that.inMatrix || that.tuplet) {
                if (that.inMatrix) {
                    that.pitchTimeMatrix.addColBlock(blk, arg0);
                }

                for (var i = 0; i < args[0]; i++) {
                    that._processNote(noteBeatValue, blk, turtle);
                }
            } else if (that.inRhythmRuler) {
                // We don't check for balance since we want to support
                // polyphonic rhythms.
                if (that.rhythmRulerMeasure === null) {
                    that.rhythmRulerMeasure = arg0 * arg1;
                } else if (that.rhythmRulerMeasure != (arg0 * arg1)) {
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
                    for (var i = 0; i < arg0; i++) {
                        that.rhythmRuler.Rulers[drumIndex][0].push(noteBeatValue);
                    }
                }
            } else {
                // Play rhythm block as if it were a drum.
                if (that.drumStyle[turtle].length > 0) {
                    that.clearNoteParams(turtle, blk, that.drumStyle[turtle]);
                } else {
                    that.clearNoteParams(turtle, blk, [DEFAULTDRUM]);
                }

                that.inNoteBlock[turtle].push(blk);

                if (that.bpm[turtle].length > 0) {
                    var bpmFactor = TONEBPM / last(that.bpm[turtle]);
                } else {
                    var bpmFactor = TONEBPM / that._masterBPM;
                }

                var beatValue = bpmFactor / noteBeatValue;

                __rhythmPlayNote = function (thisBeat, blk, turtle, callback, timeout) {
                    setTimeout(function () {
                        that._processNote(thisBeat, blk, turtle, callback);
                    }, timeout);
                };

                for (var i = 0; i < arg0; i++) {
                    if (i === arg0 - 1) {

                        __callback = function () {
                            delete that.noteDrums[turtle][blk];
                            var j = that.inNoteBlock[turtle].indexOf(blk);
                            that.inNoteBlock[turtle].splice(j, 1);
                        };

                    } else {
                        __callback = null;
                    }

                    __rhythmPlayNote(noteBeatValue, blk, turtle, __callback, i * beatValue * 1000);
                }

                that._doWait(turtle, (arg0 - 1) * beatValue);
            }
            break;

            // &#x1D15D; &#x1D15E; &#x1D15F; &#x1D160; &#x1D161; &#x1D162; &#x1D163; &#x1D164;
            // deprecated
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
                break;
            } else {
                var arg0 = args[0];
            }

            if (arg0 < 0) {
                that.pickup[turtle] = 0;
            } else {
                that.pickup[turtle] = arg0;
            }

            that.notationPickup(turtle, that.pickup[turtle]);
            break;
        case 'everybeatdo':
            // Set up a listener for every beat for this turtle.
            if (!(args[0] in that.actions)) {
                that.errorMsg(NOACTIONERRORMSG, blk, args[1]);
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

                var eventName = '__everybeat_' + turtle + '__';
                that._setListener(turtle, eventName, __listener);

                that.beatList[turtle].push('everybeat');
            }
            break;
        case 'offbeatdo':
            // Set up a listener for this turtle/offbeat combo.
            if (!(args[0] in that.actions)) {
                that.errorMsg(NOACTIONERRORMSG, blk, args[1]);
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

                    if (args[0] > that.beatsPerMeasure[turtle]) {
                        that.factorList[turtle].push(args[0]);
                    } else {
                        that.beatList[turtle].push(args[0]);
                    }
                }
            }
            break;
        case 'meter':
            if (args[0] === null || typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 4;
            } else {
                var arg0 = args[0];
            }

            if (args[1] === null || typeof(args[1]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 1 / 4;
            } else {
                var arg1 = args[1];
            }

            if (arg0 <= 0) {
                that.beatsPerMeasure[turtle] = 4;
            } else {
                that.beatsPerMeasure[turtle] = arg0;
            }

            if (arg1 <= 0) {
                that.noteValuePerBeat[turtle] = 4;
            } else {
                that.noteValuePerBeat[turtle] = 1 / arg1;
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

            if (args[1] === undefined) {
                // Should never happen, but if it does, nothing to do.
                break;
            }

            // Use the outer most note when nesting to determine the beat.
            if (that.inNoteBlock[turtle].length === 0) {
                if (that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1] < that.pickup[turtle]) {
                    var beatValue = 0;
                    var measureValue = 0;
                } else {
                    var beatValue = (((that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1] - that.pickup[turtle]) * that.noteValuePerBeat[turtle]) % that.beatsPerMeasure[turtle]) + 1;
                    var measureValue = Math.floor(((that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1] - that.pickup[turtle]) * that.noteValuePerBeat[turtle]) / that.beatsPerMeasure[turtle]) + 1;
                }

                that.currentBeat[turtle] = beatValue;
                that.currentMeasure[turtle] = measureValue;
            }

            childFlow = args[1];
            childFlowCount = 1;

            // And only trigger from the outer most note when nesting.
            if (that.inNoteBlock[turtle].length === 0) {
                // Queue any beat actions.
                // Put the childFlow into the queue before the beat action
                // so that the beat action is at the end of the FILO.
                // Note: The offbeat cannot be Beat 1.
                if (that.beatList[turtle].indexOf('everybeat') !== -1) {
                    var queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
                    that.parentFlowQueue[turtle].push(blk);
                    that.turtles.turtleList[turtle].queue.push(queueBlock);
                    childFlow = null;

                    var eventName = '__everybeat_' + turtle + '__';
                    that.stage.dispatchEvent(eventName);
                }

                if (that.beatList[turtle].indexOf(beatValue) !== -1) {
                    var queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
                    that.parentFlowQueue[turtle].push(blk);
                    that.turtles.turtleList[turtle].queue.push(queueBlock);
                    childFlow = null;

                    var eventName = '__beat_' + beatValue + '_' + turtle + '__';
                    that.stage.dispatchEvent(eventName);
                } else if (beatValue > 1 && that.beatList[turtle].indexOf('offbeat') !== -1) {
                    var queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
                    that.parentFlowQueue[turtle].push(blk);
                    that.turtles.turtleList[turtle].queue.push(queueBlock);
                    childFlow = null;

                    var eventName = '__offbeat_' + turtle + '__';
                    that.stage.dispatchEvent(eventName);
                }

                var thisBeat = beatValue + that.beatsPerMeasure[turtle] * (that.currentMeasure[turtle] - 1);
                for (var f = 0; f < that.factorList[turtle].length; f++) {
                    var factor = thisBeat / that.factorList[turtle][f];
                    if (factor === Math.floor(factor)) {
                        var queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
                        that.parentFlowQueue[turtle].push(blk);
                        that.turtles.turtleList[turtle].queue.push(queueBlock);
                        childFlow = null;

                        var eventName = '__beat_' + that.factorList[turtle][f] + '_' + turtle + '__';
                        that.stage.dispatchEvent(eventName);
                    }
                }
            }

            // A note can contain multiple pitch blocks to create
            // a chord. The chord is accumuated in these arrays,
            // which are used when we play the note.
            that.clearNoteParams(turtle, blk, []);

            if (args[0] === null || typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk)
                var arg = 1 / 4;
            } else {
                var arg = args[0];
            }

            // Ensure that note duration is positive.
            if (arg > 0) {
                if (that.blocks.blockList[blk].name === 'newnote') {
                    var noteBeatValue = 1 / arg;
                } else {
                    var noteBeatValue = arg;
                }
            } else {
                //.TRANS: Note value is the note duration.
                that.errorMsg(_('Note value must be greater than 0.'), blk);
                var noteBeatValue = -arg;
            }

            that.inNoteBlock[turtle].push(blk);
            if (that.inNoteBlock[turtle].length > 1) {
                that.multipleVoices[turtle] = true;
            }

            // Adjust the note value based on the beatFactor.
            that.noteValue[turtle][last(that.inNoteBlock[turtle])] = 1 / (noteBeatValue * that.beatFactor[turtle]);

            var listenerName = '_playnote_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (that.multipleVoices[turtle]) {
                    that.notationVoices(turtle, that.inNoteBlock[turtle].length);
                }

                if (that.inNoteBlock[turtle].length > 0) {
                    if (that.inNeighbor[turtle].length > 0) {
                        var neighborNoteValue = that.neighborNoteValue[turtle];
                        that.neighborArgBeat[turtle].push(that.beatFactor[turtle] * (1 / neighborNoteValue));

                        var nextBeat = (1 / noteBeatValue) - (2 * (that.neighborNoteValue[turtle]));
                        that.neighborArgCurrentBeat[turtle].push(that.beatFactor[turtle] * (1 / nextBeat));
                    }

                    that._processNote(1 / that.noteValue[turtle][last(that.inNoteBlock[turtle])], last(that.inNoteBlock[turtle]), turtle);
                }

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
        case 'rhythmicdot2':
            // Dotting a note will increase its play time by
            // a(2 - 1/2^n)
            if (that.blocks.blockList[blk].name === 'rhythmicdot') {
                var arg = 1;
            } else {
                if (args[0] == null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    var arg = 0;
                } else {
                    var arg = args[0];
                }
            }

            var currentDotFactor = 2 - (1 / Math.pow(2, that.dotCount[turtle]));
            that.beatFactor[turtle] *= currentDotFactor;
            if (arg >= 0) {
                that.dotCount[turtle] += arg;
            } else if (arg === -1) {
                that.errorMsg(_('An argument of -1 results in a note value of 0.'), blk);
                console.log('ignoring dot arg of -1');
                arg = 0;
            } else {
                that.dotCount[turtle] += 1 / arg;
            }

            var newDotFactor = 2 - (1 / Math.pow(2, that.dotCount[turtle]));
            that.beatFactor[turtle] /= newDotFactor;

            if (that.blocks.blockList[blk].name === 'rhythmicdot') {
                childFlow = args[0];
            } else {
                childFlow = args[1];
            }

            childFlowCount = 1;

            var listenerName = '_dot_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                var currentDotFactor = 2 - (1 / Math.pow(2, that.dotCount[turtle]));
                that.beatFactor[turtle] *= currentDotFactor;
                if (arg >= 0) {
                    that.dotCount[turtle] -= arg;
                } else {
                    that.dotCount[turtle] -= 1 / arg;
                }

                var newDotFactor = 2 - (1 / Math.pow(2, that.dotCount[turtle]));
                that.beatFactor[turtle] /= newDotFactor;
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'settimbre':
            if (args[0] === null) {
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

                if (that.instrumentNames[turtle].indexOf(synth) === -1) {
                    that.instrumentNames[turtle].push(synth);
                    that.synth.loadSynth(turtle, synth);

                    if (that.synthVolume[turtle][synth] == undefined) {
                        that.synthVolume[turtle][synth] = [DEFAULTVOLUME];
                        that.crescendoInitialVolume[turtle][synth] = [DEFAULTVOLUME];
                    }
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

                if (that.inRhythmRuler) {
                    that._currentDrumBlock = blk;
                    that.rhythmRuler.Drums.push(blk);
                    that.rhythmRuler.Rulers.push([[],[]]);
                }
            }
            break;
        case 'crescendo':
            if (args.length > 1 && args[0] !== 0) {
                that.crescendoDelta[turtle].push(args[0]);
                for (var synth in that.synthVolume[turtle]) {
                    var vol = last(that.synthVolume[turtle][synth]);
                    that.synthVolume[turtle][synth].push(vol);
                    if (that.crescendoInitialVolume[turtle][synth] == undefined) {
                        that.crescendoInitialVolume[turtle][synth] = [vol];
                    } else {
                        that.crescendoInitialVolume[turtle][synth].push(vol);
                    }
                }

                that.inCrescendo[turtle].push(true);

                childFlow = args[1];
                childFlowCount = 1;

                var listenerName = '_crescendo_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    if (that.justCounting[turtle].length === 0) {
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
                instrumentsEffects[turtle][that.timbre.instrumentName]['vibratoActive'] = true;
                that.timbre.vibratoEffect.push(blk);
                that.timbre.vibratoParams.push(last(that.vibratoIntensity[turtle]) * 100);
                instrumentsEffects[turtle][that.timbre.instrumentName]['vibratoIntensity'] = that.vibratoIntensity[turtle];
                that.timbre.vibratoParams.push(last(that.vibratoRate[turtle]));
                instrumentsEffects[turtle][that.timbre.instrumentName]['vibratoFrequency'] = rate;
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
                instrumentsEffects[turtle][that.timbre.instrumentName]['distortionActive'] = true;
                that.timbre.distortionEffect.push(blk);
                that.timbre.distortionParams.push(last(that.distortionAmount[turtle]) * 100);
                instrumentsEffects[turtle][that.timbre.instrumentName]['distortionAmount'] = distortion;
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
                instrumentsEffects[turtle][that.timbre.instrumentName]['tremoloActive'] = true;
                that.timbre.tremoloEffect.push(blk);
                that.timbre.tremoloParams.push(last(that.tremoloFrequency[turtle]));
                instrumentsEffects[turtle][that.timbre.instrumentName]['tremoloFrequency'] = frequency;
                that.timbre.tremoloParams.push(last(that.tremoloDepth[turtle]) * 100);
                instrumentsEffects[turtle][that.timbre.instrumentName]['tremoloDepth'] = depth;
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
                instrumentsEffects[turtle][that.timbre.instrumentName]['phaserActive'] = true;
                that.timbre.phaserEffect.push(blk);
                that.timbre.phaserParams.push(last(that.rate[turtle]));
                instrumentsEffects[turtle][that.timbre.instrumentName]['rate'] = rate;
                that.timbre.phaserParams.push(last(that.octaves[turtle]));
                instrumentsEffects[turtle][that.timbre.instrumentName]['octaves'] = octaves;
                that.timbre.phaserParams.push(last(that.baseFrequency[turtle]));
                instrumentsEffects[turtle][that.timbre.instrumentName]['baseFrequency'] = baseFrequency;
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
                instrumentsEffects[turtle][that.timbre.instrumentName]['chorusActive'] = true;
                that.timbre.chorusEffect.push(blk);
                that.timbre.chorusParams.push(last(that.chorusRate[turtle]));
                instrumentsEffects[turtle][that.timbre.instrumentName]['chorusRate'] = chorusRate;
                that.timbre.chorusParams.push(last(that.delayTime[turtle]));
                instrumentsEffects[turtle][that.timbre.instrumentName]['delayTime'] = delayTime;
                that.timbre.chorusParams.push(last(that.chorusDepth[turtle]) * 100);
                instrumentsEffects[turtle][that.timbre.instrumentName]['chorusDepth'] = chorusDepth;
            }
            break;
        case 'harmonic2':
            if (typeof(args[0]) !== 'number' || args[0] < 0) {
                //.TRANS: partials components in a harmonic series
                that.errorMsg(_('Partial must be greater than or equal to 0.'));
                that.stopTurtle = true;
                break;
            }

            that.inHarmonic[turtle].push(blk);
            that.partials[turtle].push([]);
            var n = that.partials[turtle].length - 1;

            for (var i = 0; i < args[0]; i++) {
                that.partials[turtle][n].push(0);
            }

            that.partials[turtle][n].push(1);
            that.notationBeginHarmonics(turtle);

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_harmonic_' + turtle + '_' + blk;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.inHarmonic[turtle].pop();
                that.partials[turtle].pop();
                that.notationEndHarmonics(turtle);
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'harmonic':
            that.inHarmonic[turtle].push(blk);
            that.partials[turtle].push([]);

            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_harmonic_' + turtle + '_' + blk;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.inHarmonic[turtle].pop();
                that.partials[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'partial':
            if (typeof(args[0]) !== 'number' || args[0] > 1 || args[0] < 0) {
                //.TRANS: partials are weighted components in a harmonic series
                that.errorMsg(_('Partial weight must be between 0 and 1.'));
                that.stopTurtle = true;
                break;
            }

            if (that.inHarmonic[turtle].length > 0) {
                var n = that.inHarmonic[turtle].length - 1;
                that.partials[turtle][n].push(args[0]);
            } else {
                //.TRANS: partials are weighted components in a harmonic series
                that.errorMsg(_('Partial block should be used inside of a Weighted-partials block.'));
            }
            break;
        case 'neighbor':  // semi-tone step
        case 'neighbor2':  // scalar step
            if (typeof(args[0]) !== 'number' || typeof(args[1]) !== 'number') {
                that.errorMsg(NANERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            that.inNeighbor[turtle].push(blk);
            that.neighborStepPitch[turtle].push(args[0]);
            that.neighborNoteValue[turtle].push(args[1]);

            childFlow = args[2];
            childFlowCount = 1;

            var listenerName = '_neighbor_' + turtle + '_' + blk;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.inNeighbor[turtle].pop();
                that.neighborStepPitch[turtle].pop();
                that.neighborNoteValue[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'interval':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 1;
            } else {
                var arg = args[0];
            }

            if (args > 0) {
                var i = Math.floor(arg);
            } else {
                var i = Math.ceil(arg);
            }

            that.intervals[turtle].push(i);

            var listenerName = '_interval_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.intervals[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);

            childFlow = args[1];
            childFlowCount = 1;
            break;
        case 'semitoneinterval':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                arg = 1;
            } else {
                arg = args[0];
            }

            if (arg > 0) {
                var i = Math.floor(arg);
            } else {
                var i = Math.ceil(arg);
            }

            if (i !== 0) {
                that.semitoneIntervals[turtle].push([i, that.noteDirection[turtle]]);
                that.noteDirection[turtle] = 0;

                var listenerName = '_semitone_interval_' + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function (event) {
                    that.semitoneIntervals[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
            }

            childFlow = args[1];
            childFlowCount = 1;
            break;
        case 'newstaccato':
        case 'staccato':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 1 / 32;
            } else {
                var arg = args[0];
            }

            if (that.blocks.blockList[blk].name === 'newstaccato') {
                that.staccato[turtle].push(1 / arg);
            } else {
                that.staccato[turtle].push(arg);
            }

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_staccato_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.staccato[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'newslur':
        case 'slur':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 1 / 16;
            } else {
                var arg = args[0];
            }

            if (that.blocks.blockList[blk].name === 'slur') {
                that.staccato[turtle].push(-arg);
            } else {
                that.staccato[turtle].push(-1 / arg);
            }

            if (that.justCounting[turtle].length === 0) {
                that.notationBeginSlur(turtle);
            }

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_staccato_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.staccato[turtle].pop();
                if (that.justCounting[turtle].length === 0) {
                    that.notationEndSlur(turtle);
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'glide':
            // TODO: Duration should be the sum of all the notes (like
            // in a tie). If we set the synth portamento and use
            // setNote for all but the first note, it should produce a
            // glissando.
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 1 / 16;
            } else {
                var arg = args[0];
            }

            that.glide[turtle].push(arg);

            if (that.justCounting[turtle].length === 0) {
                that.notationBeginSlur(turtle);
            }

            childFlow = args[1];
            childFlowCount = 1;

            that.glideOverride[turtle] = that._noteCounter(turtle, childFlow);
            console.log('length of glide ' + that.glideOverride[turtle]);

            var listenerName = '_glide_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (that.justCounting[turtle].length === 0) {
                    that.notationEndSlur(turtle);
                }

                that.glide[turtle].pop();
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'drift':
            if (args[0] === undefined) {
                // Nothing to do.
                break;
            }

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
            if (args[0] === undefined) {
                // Nothing to do.
                break;
            }

            // Tie notes together in pairs.
            that.tie[turtle] = true;
            that.tieNotePitches[turtle] = [];
            that.tieNoteExtras[turtle] = [];
            that.tieCarryOver[turtle] = 0;
            that.tieFirstDrums[turtle] = [];
            childFlow = args[0];
            childFlowCount = 1;

            var listenerName = '_tie_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.tie[turtle] = false;

                // If tieCarryOver > 0, we have one more note to
                // play.
                if (that.tieCarryOver[turtle] > 0) {
                    if (that.justCounting[turtle].length === 0) {
                        var lastNote = last(that.inNoteBlock[turtle]);
                        if (lastNote != null && lastNote in that.notePitches[turtle]) {
                            // Remove the note from the Lilypond list.
                            for (var i = 0; i < that.notePitches[turtle][last(that.inNoteBlock[turtle])].length; i++) {
                                that.notationRemoveTie(turtle);
                            }
                        }
                    }

                    // Restore the extra note and play it
                    var saveBlk = that.tieNoteExtras[turtle][0];
                    var noteValue = that.tieCarryOver[turtle];
                    that.tieCarryOver[turtle] = 0;

                    that.inNoteBlock[turtle].push(saveBlk);

                    that.notePitches[turtle][saveBlk] = [];
                    that.noteOctaves[turtle][saveBlk] = [];
                    that.noteCents[turtle][saveBlk] = [];
                    that.noteHertz[turtle][saveBlk] = [];
                    for (var i = 0; i < that.tieNotePitches[turtle].length; i++) {
                        that.notePitches[turtle][saveBlk].push(that.tieNotePitches[turtle][i][0]);
                        that.noteOctaves[turtle][saveBlk].push(that.tieNotePitches[turtle][i][1]);
                        that.noteCents[turtle][saveBlk].push(that.tieNotePitches[turtle][i][2]);
                        that.noteHertz[turtle][saveBlk].push(that.tieNotePitches[turtle][i][3]);
                    }

                    that.oscList[turtle][saveBlk] = that.tieNoteExtras[turtle][1];
                    that.noteBeat[turtle][saveBlk] = that.tieNoteExtras[turtle][2];
                    that.noteBeatValues[turtle][saveBlk] = that.tieNoteExtras[turtle][3];
                    that.noteDrums[turtle][saveBlk] = that.tieNoteExtras[turtle][4];
                    // Graphics will have already been rendered.
                    that.embeddedGraphics[turtle][saveBlk] = [];

                    that._processNote(noteValue, saveBlk, turtle);

                    that.inNoteBlock[turtle].pop();

                    delete that.notePitches[turtle][saveBlk];
                    delete that.noteOctaves[turtle][saveBlk];
                    delete that.noteCents[turtle][saveBlk];
                    delete that.noteHertz[turtle][saveBlk];
                    delete that.oscList[turtle][saveBlk];
                    delete that.noteBeat[turtle][saveBlk];
                    delete that.noteBeatValues[turtle][saveBlk];
                    delete that.noteDrums[turtle][saveBlk];
                    delete that.embeddedGraphics[turtle][saveBlk];

                    // Remove duplicate note
                    that.notationStaging[turtle].pop();
                }

                that.tieNotePitches[turtle] = [];
                that.tieNoteExtras[turtle] = [];
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'newswing':
        case 'newswing2':
        case 'swing':
            // Grab a bit from the next note to give to the current note.
            if (that.blocks.blockList[blk].name === 'newswing2') {
                if (args[2] === undefined) {
                    // Nothing to do.
                    break;
                }

                if (args[0] === null || typeof(args[0]) !== 'number' || args[0] <= 0) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    var arg0 = 1 / 24;
                } else {
                    var arg0 = args[0];
                }

                if (args[1] === null || typeof(args[1]) !== 'number' || args[1] <= 0) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    var arg1 = 1 / 8;
                } else {
                    var arg1 = args[1];
                }

                if (that.suppressOutput[turtle]) {
                    that.notationSwing(turtle);
                } else {
                    that.swing[turtle].push(1 / arg0);
                    that.swingTarget[turtle].push(1 / arg1);
                }
                childFlow = args[2];
            } else if (that.blocks.blockList[blk].name === 'newswing') {
                // deprecated
                that.swing[turtle].push(1 / args[0]);
                that.swingTarget[turtle].push(null);
                childFlow = args[1];
            } else {
                // deprecated
                that.swing[turtle].push(args[0]);
                that.swingTarget[turtle].push(null);
                childFlow = args[1];
            }
            that.swingCarryOver[turtle] = 0;

            childFlowCount = 1;

            var listenerName = '_swing_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (!that.suppressOutput[turtle]) {
                    that.swingTarget[turtle].pop();
                    that.swing[turtle].pop();
                }

                that.swingCarryOver[turtle] = 0;
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'duplicatenotes':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number' || args[0] < 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 2;
            } else {
                var arg0 = args[0];
            }

            var factor = Math.floor(arg0);
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
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number' || args[0] < 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var factor = 2;
            } else {
                var factor = args[0];
            }

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
            break;
        case 'multiplybeatfactor':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number' || args[0] <= 0) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var factor = 2;
            } else {
                var factor = args[0];
            }

            that.beatFactor[turtle] /= factor;
            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_multiplybeat_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.beatFactor[turtle] *= factor;
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'setscalartransposition':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number' || args[0] < 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var transValue = 2;
            } else {
                var transValue = args[0];
            }

            if (!(that.invertList[turtle].length === 0)) {
                that.scalarTransposition[turtle] -= transValue;
            } else {
                that.scalarTransposition[turtle] += transValue;
            }

            that.scalarTranspositionValues[turtle].push(transValue);

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_scalar_transposition_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                var transValue = that.scalarTranspositionValues[turtle].pop();
                if (!(that.invertList[turtle].length === 0)) {
                    that.scalarTransposition[turtle] += transValue;
                } else {
                    that.scalarTransposition[turtle] -= transValue;
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'register':
            if (args[0] !== null && typeof(args[0]) === 'number') {
                that.register[turtle] = Math.floor(args[0]);
            }
            break;
        case 'settransposition':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] !== null && typeof(args[0]) === 'number') {
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
            }
            break;
            // deprecated
        case 'sharp':
            if (args[0] === undefined) {
                // Nothing to do.
                break;
            }

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
            // deprecated
        case 'flat':
            if (args[0] === undefined) {
                // Nothing to do.
                break;
            }

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
        case 'accidental':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0] !== 'string')) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 'sharp';
            } else {
                var arg = args[0];
            }

            var i = ACCIDENTALNAMES.indexOf(arg);
            if (i === -1) {
                switch (arg) {
                case _('sharp'):
                    value = 1;
                    break;
                case _('flat'):
                    value = -1;
                    break;
                default:
                    value = 0;
                    break;
                }
            } else {
                value = ACCIDENTALVALUES[i];
            }

            if (!(that.invertList[turtle].length === 0)) {
                that.transposition[turtle] -= value;
            } else {
                that.transposition[turtle] += value;
            }

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_accidental_' + turtle + '_' + blk;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                if (!(that.invertList[turtle].length === 0)) {
                    that.transposition[turtle] += value;
                } else {
                    that.transposition[turtle] -= value;
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'articulation':
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0] !== 'number')) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 0;
            } else {
                var arg = args[0];
            }

            for (var synth in that.synthVolume[turtle]) {
                var newVolume = last(that.synthVolume[turtle][synth]) * (100 + arg) / 100;
                if (newVolume > 100) {
                    console.log('articulated volume exceeds 100%. clipping');
                    newVolume = 100;
                } else if (newVolume < -100) {
                    console.log('articulated volume exceeds 100%. clipping');
                    newVolume = -100;
                }

                if (that.synthVolume[turtle][synth] == undefined) {
                    that.synthVolume[turtle][synth] = [newVolume];
                } else {
                    that.synthVolume[turtle][synth].push(newVolume);
                }

                if (!this.suppressOutput[turtle]) {
                    that.setSynthVolume(turtle, synth, newVolume);
                }
            }

            if (that.justCounting[turtle].length === 0) {
                that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setsynthvolume', synth, newVolume]);
            }

            if (that.justCounting[turtle].length === 0) {
                that.notationBeginArticulation(turtle);
            }

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_articulation_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                for (var synth in that.synthVolume[turtle]) {
                    that.synthVolume[turtle][synth].pop();
                    that.setSynthVolume(turtle, synth, last(that.synthVolume[turtle][synth]));
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setsynthvolume', synth, last(that.synthVolume[turtle][synth])]);
                }

                if (that.justCounting[turtle].length === 0) {
                    that.notationEndArticulation(turtle);
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'setnotevolume':  // master volume
            if (args.length === 1) {
                if (typeof(args[0]) !== 'number') {
                    that.errorMsg(NANERRORMSG, blk);
                } else {
                    if (args[0] < 0) {
                        var arg = 0;
                    } else if (args[0] > 100) {
                        var arg = 100;
                    } else {
                        var arg = args[0];
                    }

                    if (arg === 0) {
                        that.errorMsg(_('Setting volume to 0.'), blk);
                    }

                    that.masterVolume.push(arg);
                    if (!this.suppressOutput[turtle]) {
                        that._setMasterVolume(arg);
                    }

                    if (that.justCounting[turtle].length === 0) {
                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setvolume', arg]);
                    }
                }
            }
            break;
        case 'settemperament':
            that.synth.inTemperament = args[0];
            that.temperamentSelected.push(args[0]);
            var len = that.temperamentSelected.length;

            if (that.temperamentSelected[len - 1] !== that.temperamentSelected[len - 2]) {
                that.synth.changeInTemperament = true;
            }
              
            break;
        case 'setnotevolume2':
            // master volume in clamp form
            // Used by fff ff f p pp ppp blocks
            if (args[1] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 50;
            } else {
                if (args[0] < 0) {
                    var arg = 0;
                } else if (args[0] > 100) {
                    var arg = 100;
                } else {
                    var arg = args[0];
                }

                if (arg === 0) {
                    that.errorMsg(_('Setting volume to 0.'), blk);
                }
            }

            that.masterVolume.push(arg);
            if (!this.suppressOutput[turtle]) {
                that._setMasterVolume(arg);
            }

            if (that.justCounting[turtle].length === 0) {
                that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setvolume', arg]);
            }

            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_volume_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.masterVolume.pop();
                // Restore previous volume.
                if (that.justCounting[turtle].length === 0 && that.masterVolume.length > 0) {
                    that._setMasterVolume(last(that.masterVolume));
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'setsynthvolume':
            if (args[0] === null || typeof(args[0]) !== 'string') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 'default';
            } else {
                var arg0 = args[0];
            }

            if (args[1] === null || typeof(args[1]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 50;
            } else {
                if (args[1] < 0) {
                    var arg1 = 0;
                } else if (args[1] > 100) {
                    var arg1 = 100;
                } else {
                    var arg1 = args[1];
                }

                if (arg1 === 0) {
                    that.errorMsg(_('Setting volume to 0.'), blk);
                }
            }

            var synth = null;

            if (arg0 === 'default' || arg0 ===  _('default')) {
                synth = 'default';
            } else if (arg0 === 'custom' || arg0 ===  _('custom')) {
                synth = 'custom';
            }

            if (synth === null) {
                for (var voice in VOICENAMES) {
                    if (VOICENAMES[voice][0] === arg0) {
                        synth = VOICENAMES[voice][1];
                        break;
                    } else if (VOICENAMES[voice][1] === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                for (var drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0].replace('-', ' ') === arg0) {
                        synth = DRUMNAMES[drum][1];
                        break;
                    } else if (DRUMNAMES[drum][1].replace('-', ' ') === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                that.errorMsg(synth + 'not found', blk);
                synth = 'default';
            }

            if (that.instrumentNames[turtle].indexOf(synth) === -1) {
                that.instrumentNames[turtle].push(synth);
                that.synth.loadSynth(turtle, synth);

                if (that.synthVolume[turtle][synth] === undefined) {
                    that.synthVolume[turtle][synth] = [DEFAULTVOLUME];
                    that.crescendoInitialVolume[turtle][synth] = [DEFAULTVOLUME];
                }
            }

            that.synthVolume[turtle][synth].push(args[1]);
            if (!this.suppressOutput[turtle]) {
                that.setSynthVolume(turtle, synth, args[1]);
            }

            if (that.justCounting[turtle].length === 0) {
                that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setsynthvolume', synth, arg1]);
            }
            break;
        case 'setsynthvolume2':
            // set synth volume in clamp form
            if (args[2] === undefined) {
                // Nothing to do.
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'string') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 'default';
            } else {
                var arg0 = args[0];
            }

            if (args[1] === null || typeof(args[1]) !== 'number') {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 50;
            } else {
                if (args[1] < 0) {
                    var arg1 = 0;
                } else if (args[1] > 100) {
                    var arg1 = 100;
                } else {
                    var arg1 = args[1];
                }

                if (arg1 === 0) {
                    that.errorMsg(_('Setting volume to 0.'), blk);
                }
            }

            var synth = null;

            if (arg0 === 'default' || arg0 ===  _('default')) {
                synth = 'default';
            } else if (arg0 === 'custom' || args[0] ===  _('custom')) {
                synth = 'custom';
            }

            if (synth === null) {
                for (var voice in VOICENAMES) {
                    if (VOICENAMES[voice][0] === arg0) {
                        synth = VOICENAMES[voice][1];
                        break;
                    } else if (VOICENAMES[voice][1] === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                for (var drum in DRUMNAMES) {
                    if (DRUMNAMES[drum][0].replace('-', ' ') === arg0) {
                        synth = DRUMNAMES[drum][1];
                        break;
                    } else if (DRUMNAMES[drum][1].replace('-', ' ') === arg0) {
                        synth = arg0;
                        break;
                    }
                }
            }

            if (synth === null) {
                that.errorMsg(synth + 'not found', blk);
                synth = 'default';
            }

            if (that.instrumentNames[turtle].indexOf(synth) === -1) {
                that.instrumentNames[turtle].push(synth);
                that.synth.loadSynth(turtle, synth);

                if (that.synthVolume[turtle][synth] == undefined) {
                    that.synthVolume[turtle][synth] = [DEFAULTVOLUME];
                    that.crescendoInitialVolume[turtle][synth] = [DEFAULTVOLUME];
                }
            }

            that.synthVolume[turtle][synth].push(arg1);
            if (!this.suppressOutput[turtle]) {
                that.setSynthVolume(turtle, synth, arg1);
            }

            if (that.justCounting[turtle].length === 0) {
                that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setsynthvolume', synth, arg1]);
            }

            childFlow = args[2];
            childFlowCount = 1;

            var listenerName = '_synthvolume_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.synthVolume[turtle][synth].pop();
                // Restore previous volume.
                if (that.justCounting[turtle].length === 0 && that.synthVolume[turtle][synth].length > 0) {
                    that.setSynthVolume(turtle, synth, last(that.synthVolume[turtle][synth]));
                    that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'setsynthvolume', synth, last(that.synthVolume[turtle][synth])]);
                }
            };

            that._setListener(turtle, listenerName, __listener);
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
            if (args[0] === null || typeof(args[0]) !== 'number' || args[0] <= 0) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 392;
            } else {
                var arg = args[0];
            }

            var obj = frequencyToPitch(arg);
            var note = obj[0];
            var octave = obj[1];
            var cents = obj[2];
            var delta = 0;

            if (note === '?') {
                that.errorMsg(INVALIDPITCH, blk);
                that.stopTurtle = true;
            } else if (that.justMeasuring[turtle].length > 0) {
                // TODO: account for cents
                var noteObj = getNote(note, octave, 0, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);

                var n = that.justMeasuring[turtle].length;
                var pitchNumber = pitchToNumber(noteObj[0], noteObj[1], that.keySignature[turtle]) - that.pitchNumberOffset[turtle];
                if (that.firstPitch[turtle].length < n) {
                    that.firstPitch[turtle].push(pitchNumber);
                } else if (that.lastPitch[turtle].length < n) {
                    that.lastPitch[turtle].push(pitchNumber);
                }
            } else if (that.inMatrix) {
                that.pitchTimeMatrix.addRowBlock(blk);
                if (that.pitchBlocks.indexOf(blk) === -1) {
                    that.pitchBlocks.push(blk);
                }

                that.pitchTimeMatrix.rowLabels.push(that.blocks.blockList[blk].name);
                that.pitchTimeMatrix.rowArgs.push(arg);
            } else if (that.inNoteBlock[turtle].length > 0) {

                function addPitch(note, octave, cents, frequency, direction) {
                    t = transposition + that.register[turtle] * 12;
                    var noteObj = getNote(note, octave, t, that.keySignature[turtle], that.moveable[turtle], direction, that.errorMsg);
                    if (that.drumStyle[turtle].length > 0) {
                        var drumname = last(that.drumStyle[turtle]);
                        that.pitchDrumTable[turtle][noteObj[0] + noteObj[1]] = drumname;
                    }

                    that.notePitches[turtle][last(that.inNoteBlock[turtle])].push(noteObj[0]);
                    that.noteOctaves[turtle][last(that.inNoteBlock[turtle])].push(noteObj[1]);
                    that.noteCents[turtle][last(that.inNoteBlock[turtle])].push(cents);
                    that.noteHertz[turtle][last(that.inNoteBlock[turtle])].push(frequency);
                    return noteObj;
                }

                if (!(that.invertList[turtle].length === 0)) {
                    delta += that._calculateInvert(turtle, note, octave);
                }

                var noteObj1 = addPitch(note, octave, cents, arg);

                if (turtle in that.intervals && that.intervals[turtle].length > 0) {
                    for (var i = 0; i < that.intervals[turtle].length; i++) {
                        var ii = getInterval(that.intervals[turtle][i], that.keySignature[turtle], noteObj1[0]);
                        var noteObj2 = getNote(noteObj1[0], noteObj1[1], ii, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                        addPitch(noteObj2[0], noteObj2[1], cents, 0);
                    }
                }

                if (turtle in that.semitoneIntervals && that.semitoneIntervals[turtle].length > 0) {
                    for (var i = 0; i < that.semitoneIntervals[turtle].length; i++) {
                        var noteObj2 = getNote(noteObj1[0], noteObj1[1], that.semitoneIntervals[turtle][i][0], that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                        addPitch(noteObj2[0], noteObj2[1], cents, 0, that.semitoneIntervals[turtle][i][1]);
                    }
                }

                that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
                that.pushedNote[turtle] = true;
            } else if (that.inPitchStaircase) {
                var frequency = arg;
                var note = frequencyToPitch(arg);
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

                that.pitchStaircase.stairPitchBlocks.push(blk);
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

                    that.noteBeatValues[turtle][last(that.inNoteBlock[turtle])].push(that.beatFactor[turtle]);
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
            if (args[0] === null || typeof(args[0]) !== 'number' || args[0] <= 0) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg0 = 3;
            } else {
                var arg0 = args[0];
            }

            if (args[1] === null || typeof(args[1]) !== 'number' || args[1] <= 0) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg1 = 1 / 2;
            } else {
                var arg1 = args[1];
            }

            var noteBeatValue = (1 / arg1) * that.beatFactor[turtle];
            if (that.inMatrix || that.tuplet) {
                that.pitchTimeMatrix.addColBlock(blk, arg0);
                if (that.tuplet) {
                    // The simple-tuplet block is inside.
                    for (var i = 0; i < arg0; i++) {
                        if (!that.addingNotesToTuplet) {
                            that.tupletRhythms.push(['notes', 0]);
                            that.addingNotesToTuplet = true;
                        }

                        that._processNote(noteBeatValue, blk, turtle);
                    }
                } else {
                    that.tupletParams.push([1, noteBeatValue]);
                    var obj = ['simple', 0];
                    for (var i = 0; i < arg0; i++) {
                        obj.push((1 / arg1) * that.beatFactor[turtle]);
                    }
                    that.tupletRhythms.push(obj);
                }
            } else {
                // Play rhythm block as if it were a drum.
                if (that.drumStyle[turtle].length > 0) {
                    that.clearNoteParams(turtle, blk, that.drumStyle[turtle]);
                } else {
                    that.clearNoteParams(turtle, blk, [DEFAULTDRUM]);
                }

                that.inNoteBlock[turtle].push(blk);

                if (that.bpm[turtle].length > 0) {
                    var bpmFactor = TONEBPM / last(that.bpm[turtle]);
                } else {
                    var bpmFactor = TONEBPM / that._masterBPM;
                }

                var beatValue = (bpmFactor / noteBeatValue) / arg0;

                __rhythmPlayNote = function (thisBeat, blk, turtle, callback, timeout) {
                    setTimeout(function () {
                        that._processNote(thisBeat, blk, turtle, callback);
                    }, timeout);
                };

                for (var i = 0; i < arg0; i++) {
                    if (i === arg0 - 1) {

                        __callback = function () {
                            delete that.noteDrums[turtle][blk];
                            var j = that.inNoteBlock[turtle].indexOf(blk);
                            that.inNoteBlock[turtle].splice(j, 1);
                        };

                    } else {
                        __callback = null;
                    }

                    __rhythmPlayNote(noteBeatValue * arg0, blk, turtle, __callback, i * beatValue * 1000);
                }

                that._doWait(turtle, (arg0 - 1) * beatValue);
            }
            break;
            // deprecated
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
            if (args[1] === undefined) {
                // nothing to do
                break;
            }

            if (args[0] === null || typeof(args[0]) !== 'number' || args[0] <= 0) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                var arg = 1 / 2;
            } else {
                var arg = args[0];
            }

            if (!that.inMatrix) {
                that.tupletRhythms = [];
                that.tupletParams = [];
            }

            that.tuplet = true;
            that.addingNotesToTuplet = false;
            that.tupletParams.push([1, (1 / arg) * that.beatFactor[turtle]]);
            childFlow = args[1];
            childFlowCount = 1;

            var listenerName = '_tuplet_' + turtle;
            that._setDispatchBlock(blk, turtle, listenerName);

            var __listener = function (event) {
                that.tuplet = false;
                that.addingNotesToTuplet = false;
                if (!that.inMatrix) {
                    var beatValues = [];

                    for (var i = 0; i < that.tupletRhythms.length; i++) {
                        var tupletParam = [that.tupletParams[that.tupletRhythms[i][1]]];
                        tupletParam.push([]);
                        var tupletBeats = 0;
                        for (var j = 2; j < that.tupletRhythms[i].length; j++) {
                            tupletBeats += (1 / that.tupletRhythms[i][j]);
                            tupletParam[1].push(that.tupletRhythms[i][j]);
                        }

                        var factor = tupletParam[0][0] / (tupletParam[0][1] * tupletBeats);
                        for (var j = 2; j < that.tupletRhythms[i].length; j++) {
                            beatValues.push(that.tupletRhythms[i][j] / factor);
                        }
                    }

                    // Play rhythm block as if it were a drum.
                    if (that.drumStyle[turtle].length > 0) {
                        that.clearNoteParams(turtle, blk, that.drumStyle[turtle]);
                    } else {
                        that.clearNoteParams(turtle, blk, [DEFAULTDRUM]);
                    }

                    that.inNoteBlock[turtle].push(blk);

                    if (that.bpm[turtle].length > 0) {
                        var bpmFactor = TONEBPM / last(that.bpm[turtle]);
                    } else {
                        var bpmFactor = TONEBPM / that._masterBPM;
                    }

                    var totalBeats = 0;

                    __tupletPlayNote = function (thisBeat, blk, turtle, callback, timeout) {
                        setTimeout(function () {
                            that._processNote(thisBeat, blk, turtle, callback);
                        }, timeout);
                    };

                    var timeout = 0;
                    for (var i = 0; i < beatValues.length; i++) {
                        var thisBeat = beatValues[i];
                        var beatValue = bpmFactor / thisBeat;

                        if (i === beatValues.length - 1) {

                            __callback = function () {
                                delete that.noteDrums[turtle][blk];
                                var j = that.inNoteBlock[turtle].indexOf(blk);
                                that.inNoteBlock[turtle].splice(j, 1);
                            };

                        } else {
                            __callback = null;
                        }

                        __tupletPlayNote(thisBeat, blk, turtle, __callback, timeout);

                        timeout += beatValue * 1000;
                        totalBeats += beatValue
                    }

                    that._doWait(turtle, totalBeats - beatValue);
                }
            };

            that._setListener(turtle, listenerName, __listener);
            break;
        case 'deleteblock':
            if (args.length < 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                that.stopTurtle = true;
                break;
            }

            if (args[0] < 0 || args[0] > that.blocks.blockList.length - 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            // Is the block already in the trash?
            if (that.blocks.blockList[args[0]].trash) {
                break;
            }

            // Disconnect the block.
            var c = that.blocks.blockList[args[0]].connections[0];
            that.blocks.blockList[args[0]].connections[0] = null;
            if (c !== null) {
                for (var i = 0; i < that.blocks.blockList[c].connections.length; i++) {
                    if (that.blocks.blockList[c].connections[i] === args[0]) {
                        that.blocks.blockList[c].connections[i] = null;
                    }
                }
            }

            // Send it to the trash.
            that.blocks.sendStackToTrash(that.blocks.blockList[args[0]]);

            // And adjust the docs of the former connection
            that.blocks.adjustDocks(c, true);
            break;
        case 'moveblock':
            if (args.length < 3) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (args[0] < 0 || args[0] > that.blocks.blockList.length - 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            var x = that.turtles.turtleX2screenX(args[1]);
            var y = that.turtles.turtleY2screenY(args[2]);
            that.blocks.moveBlock(args[0], x, y);
            break;
        case 'runblock':
            if (args.length < 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (args[0] < 0 || args[0] > that.blocks.blockList.length - 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (that.blocks.blockList[args[0]].name === 'start') {
                var thisTurtle = that.blocks.blockList[args[0]].value;
                console.log('run start ' + thisTurtle);
                that.initTurtle(thisTurtle);
                that.turtles.turtleList[thisTurtle].queue = [];
                that.parentFlowQueue[thisTurtle] = [];
                that.unhighlightQueue[thisTurtle] = [];
                that.parameterQueue[thisTurtle] = [];
                that.turtles.turtleList[thisTurtle].running = true;
                that._runFromBlock(that, thisTurtle, args[0], 0, receivedArg);
            } else {
                childFlow = args[0];
                childFlowCount = 1;
            }
            break;
        case 'dockblock':
            if (args.length < 3) {
                console.log(args.length + ' < 3');
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (args[0] < 0 || args[0] > that.blocks.blockList.length - 1) {
                console.log(args[0] + ' > ' + that.blocks.blockList.length - 1);
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (args[0] === args[2]) {
                console.log(args[0] + ' == ' + args[2]);
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (args[2] < 0 || args[2] > that.blocks.blockList.length - 1) {
                console.log(args[2] + ' > ' + that.blocks.blockList.length - 1);
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            if (args[1] === -1) {
                // Find the last connection.
                args[1] = that.blocks.blockList[args[0]].connections.length - 1;
            } else if (args[1] < 1 || args[1] > that.blocks.blockList[args[0]].connections.length - 1) {
                console.log(args[1] + ' out of bounds');
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            // Make sure there is not another block already connected.
            var c = that.blocks.blockList[args[0]].connections[args[1]];
            if (c !== null) {
                if (that.blocks.blockList[c].name === 'hidden') {
                    // Dock to the hidden block.
                    args[0] = c;
                    args[1] = 1;
                } else {
                    // Or disconnection the old connection.
                    for (var i = 0; i < that.blocks.blockList[c].connections.length; i++) {
                        if (that.blocks.blockList[c].connections[i] === args[0]) {
                            that.blocks.blockList[c].connections[i] = null;
                            break;
                        }
                    }

                    that.blocks.blockList[args[0]].connections[args][1] = null;
                }
            }

            that.blocks.blockList[args[0]].connections[args[1]] = args[2];
            that.blocks.blockList[args[2]].connections[0] = args[0];

            that.blocks.adjustDocks(args[0], true);
            break;
        case 'openpalette':
            if (args.length < 1) {
                that.errorMsg(NOINPUTERRORMSG, blk);
                break;
            }

            for (var p in that.blocks.palettes.dict) {
                if (_(that.blocks.palettes.dict[p].name) === args[0].toLowerCase()) {
                    that.blocks.palettes.hide();
                    that.blocks.palettes.dict[p].show();
                    that.blocks.palettes.show();
                    break;
                }
            }
            break;
        case 'setxyturtle':
            // deprecated
            var targetTurtle = that._getTargetTurtle(args[0]);
            if (targetTurtle === null) {
                if (_THIS_IS_MUSIC_BLOCKS_) {
                    that.errorMsg(_('Cannot find mouse') + ' ' + args[0], blk)
                } else {
                    that.errorMsg(_('Cannot find turtle') + ' ' + args[0], blk)
                }
            } else if (args.length === 3) {
                if (typeof(args[1]) === 'string' || typeof(args[2]) === 'string') {
                    that.errorMsg(NANERRORMSG, blk);
                    that.stopTurtle = true;
                } else {
                    that.turtles.turtleList[targetTurtle].doSetXY(args[1], args[2]);
                }
            }
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
                    if (!that.suppressOutput[turtle] && that.justCounting[turtle].length === 0) {
                        setTimeout(function () {
                            if (that.blocks.visible) {
                                that.blocks.unhighlight(blk);
                            }
                        }, that.turtleDelay + that.waitTimes[turtle]);
                    }
                }
            }

            if ((that.backward[turtle].length > 0 && that.blocks.blockList[blk].connections[0] == null) || (that.backward[turtle].length === 0 && last(that.blocks.blockList[blk].connections) == null)) {
                if (!that.suppressOutput[turtle] && that.justCounting[turtle].length === 0) {
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
                        if (that.butNotThese[turtle][b] == null || that.butNotThese[turtle][b].indexOf(i) === -1) {
                            that.stage.dispatchEvent(that.endOfClampSignals[turtle][b][i]);
                        }
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
                if (!that.turtles.running() && queueStart === 0 && that.justCounting[turtle].length === 0) {
                    if (that.runningLilypond) {
                        console.log('saving lilypond output:');
                        save.afterSaveLilypond();
                        that.runningLilypond = false;
                    } else if (that.runningAbc) {
                        console.log('saving abc output:');
                        save.afterSaveAbc();
                        that.runningAbc = false;
                    } else if (that.suppressOutput[turtle]) {
                        console.log('finishing compiling');
                        if (!that.recording) {
                            that.errorMsg(_('Playback is ready.'));
                        }

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
                        if (that.suppressOutput[turtle] && that.recording) {
                            that.suppressOutput[turtle] = false;
                            that.checkingCompletionState = false;
                            that.saveLocally();
                            that.playback(-1, true);
                            // that.recording = false;
                        } else {
                            that.suppressOutput[turtle] = false;
                            that.checkingCompletionState = false;

                            // Reset the cursor...
                            document.body.style.cursor = 'default';

                            // And save the session.
                            that.saveLocally();
                        }
                    }, 1000);
                } else if (that.suppressOutput[turtle]) {
                    setTimeout(function () {
                        __checkCompletionState();
                    }, 250);
                }
            };

            if (!that.turtles.running() && queueStart === 0 && that.justCounting[turtle].length === 0) {
                if (!that.checkingCompletionState) {
                    that.checkingCompletionState = true;
                    setTimeout(function () {
                        __checkCompletionState();
                    }, 250);
                }
            }

            if (!that.suppressOutput[turtle] && that.justCounting[turtle].length === 0) {
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
                var i = that.stage.children.length - 1;
                that.stage.setChildIndex(that.turtles.turtleList[turtle].container, i);
                that.refreshCanvas();
            }

            for (var arg in that.evalOnStopList) {
                eval(that.evalOnStopList[arg]);
            }

            if (!that.turtles.running() && queueStart === 0) {
                // TODO: Enable playback button here
                if (that.showBlocksAfterRun) {
                    // If this is a status stack, not run showBlocks.
                    if (blk !== null && that.blocks.blockList[blk].connections[0] !== null && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'status') {
                        console.log('running status block');
                    } else {
                        that.showBlocks();
                        that.showBlocksAfterRun = false;
                    }
                }

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

    this.setSynthVolume = function (turtle, synth, volume) {
        if (volume > 100) {
            volume = 100;
        } else if (volume < 0) {
            volume = 0;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            switch (synth) {
            case 'noise1':
            case 'noise2':
            case 'noise3':
                // Noise is very very loud.
                this.synth.setVolume(turtle, synth, volume / 25);
                break;
            default:
                this.synth.setVolume(turtle, synth, volume);
                break;
            }
        }
    };

    this._processNote = function (noteValue, blk, turtle, callback) {
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
        var partials = [];
        var neighborArgNote1 = [];
        var neighborArgNote2 = [];
        var neighborArgBeat = 0;
        var neighborArgCurrentBeat = 0;
        var doVibrato = false;
        var doDistortion = false;
        var doTremolo = false;
        var doPhaser = false;
        var doChorus = false;
        var doNeighbor = false;
        var filters = null;

        // Apply any effects and filters associated with a custom timbre.
        if (this.inSetTimbre[turtle] && (turtle in this.instrumentNames) && last(this.instrumentNames[turtle])) {
            var name = last(this.instrumentNames[turtle]);

            if (name in instrumentsEffects[turtle]) {
                var timbreEffects = instrumentsEffects[turtle][name];

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

            if (name in instrumentsFilters[turtle]) {
                filters = instrumentsFilters[turtle][name];
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

        partials = [1];
        if (this.inHarmonic[turtle].length > 0) {
            if (partials.length === 0) {
                //.TRANS: partials are weighted components in a harmonic series
                this.errorMsg(_('You must have at least one Partial block inside of a Weighted-partial block'));
            } else {
                partials = last(this.partials[turtle]);
            }
        }

        if (this.inNeighbor[turtle].length > 0) {
            var len = this.neighborArgNote1[turtle].length;
            for (var i = 0; i < len; i++) {
                neighborArgNote1.push(this.neighborArgNote1[turtle].pop());
                neighborArgNote2.push(this.neighborArgNote2[turtle].pop());
            }

            neighborArgBeat = bpmFactor / last(this.neighborArgBeat[turtle]);
            neighborArgCurrentBeat = bpmFactor / last(this.neighborArgCurrentBeat[turtle]);
            doNeighbor = true;
        }

        var carry = 0;

        if (this.inCrescendo[turtle].length > 0 && this.crescendoDelta[turtle].length === 0) {
            this.inCrescendo[turtle].pop();
            for (var synth in this.synthVolume[turtle]) {
                this.setSynthVolume(turtle, 'default', last(this.synthVolume[turtle][synth]));
                this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setsynthvolume', synth, last(this.synthVolume[turtle][synth])]);
            }
        } else if (this.crescendoDelta[turtle].length > 0) {
            if (last(this.synthVolume[turtle]['default']) === last(this.crescendoInitialVolume[turtle]['default']) && this.justCounting[turtle].length === 0) {
                this.notationBeginCrescendo(turtle, last(this.crescendoDelta[turtle]));
            }

            for (var synth in this.synthVolume[turtle]) {
                var len = this.synthVolume[turtle][synth].length;
                this.synthVolume[turtle][synth][len - 1] += last(this.crescendoDelta[turtle]);
                console.log(synth + '= ' + this.synthVolume[turtle][synth][len - 1]);
                this._playbackPush(turtle, [this.previousTurtleTime[turtle], 'setsynthvolume', synth, last(this.synthVolume[turtle][synth])]);
                if (!this.suppressOutput[turtle]) {
                    this.setSynthVolume(turtle, synth, last(this.synthVolume[turtle][synth]));
                }
            }
        }

        if (this.inTimbre) {
            var noteObj = getNote(this.notePitches[turtle][last(this.inNoteBlock[turtle])][0], this.noteOctaves[turtle][last(this.inNoteBlock[turtle])][0], 0, this.keySignature[turtle], this.moveable[turtle], null, this.errorMsg);
            this.timbre.notesToPlay.push([noteObj[0] + noteObj[1], 1 / noteBeatValue]);
            this.previousNotePlayed[turtle] = this.lastNotePlayed[turtle];
            this.lastNotePlayed[turtle] = [noteObj[0] + noteObj[1], noteBeatValue];
        } else if (this.inMatrix || this.tuplet) {
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
            if (this.tuplet) {
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
                var turtleLag = Math.max(elapsedTime - this.turtleTime[turtle], 0);
            } else {
                // When we are "drifting", we don't bother with lag.
                var turtleLag = 0;
            }

            // Delay running graphics from second note in tie.
            if (this.tie[turtle]) {
                var tieDelay = this.tieCarryOver[turtle];
            } else {
                var tieDelay = 0;
            }

            // If we are in a tie, depending upon parity, we either
            // add the duration from the prvious note to the current
            // note, or we cache the duration and set the wait to
            // zero. TESTME: May not work when using dup and skip.
            if (this.tie[turtle]) {
                var saveBlk = last(this.inNoteBlock[turtle]);

                if (this.tieCarryOver[turtle] > 0) {
                    // We need to check to see if we are tying together
                    // similar notes.

                    var match = true;
                    if (this.tieNotePitches[turtle].length !== this.notePitches[turtle][last(this.inNoteBlock[turtle])].length) {
                        match = false;
                    } else {
                        // FIXME: This check assumes that the order of
                        // the pitch blocks in a chord are the same.
                        for (var i = 0; i < this.tieNotePitches[turtle].length; i++) {
                            if (this.tieNotePitches[turtle][i][0] != this.notePitches[turtle][last(this.inNoteBlock[turtle])][i]) {
                                match = false;
                                break;
                            }

                            if (this.tieNotePitches[turtle][i][1] != this.noteOctaves[turtle][last(this.inNoteBlock[turtle])][i]) {
                                match = false;
                                break;
                            }
                        }
                    }

                    if (!match) {
                        // If we don't have a match, then we need to
                        // play the previous note.
                        this.errorMsg(_('You can only tie notes of the same pitch. Did you mean to use slur?'), saveBlk);

                        // Save the current note.
                        var saveCurrentNote = [];
                        var saveCurrentExtras = [];
                        for (var i = 0; i < this.notePitches[turtle][last(this.inNoteBlock[turtle])].length; i++)
                        {
                            saveCurrentNote.push([this.notePitches[turtle][saveBlk][i], this.noteOctaves[turtle][saveBlk][i], this.noteCents[turtle][saveBlk][i], this.noteHertz[turtle][saveBlk][i], saveBlk]);
                        }

                        saveCurrentExtras = [saveBlk, this.oscList[turtle][saveBlk], this.noteBeat[turtle][saveBlk], this.noteBeatValues[turtle][saveBlk], this.noteDrums[turtle][saveBlk], this.embeddedGraphics[turtle][saveBlk]];

                        // Swap in the previous note.
                        saveBlk = this.tieNoteExtras[turtle][0];
                        this.inNoteBlock[turtle].push(saveBlk);

                        this.notePitches[turtle][saveBlk] = [];
                        this.noteOctaves[turtle][saveBlk] = [];
                        this.noteCents[turtle][saveBlk] = [];
                        this.noteHertz[turtle][saveBlk] = [];
                        for (var i = 0; i < this.tieNotePitches[turtle].length; i++) {
                            this.notePitches[turtle][saveBlk].push(this.tieNotePitches[turtle][i][0]);
                            this.noteOctaves[turtle][saveBlk].push(this.tieNotePitches[turtle][i][1]);
                            this.noteCents[turtle][saveBlk].push(this.tieNotePitches[turtle][i][2]);
                            this.noteHertz[turtle][saveBlk].push(this.tieNotePitches[turtle][i][3]);
                        }

                        this.oscList[turtle][saveBlk] = this.tieNoteExtras[turtle][1];
                        this.noteBeat[turtle][saveBlk] = this.tieNoteExtras[turtle][2];
                        this.noteBeatValues[turtle][saveBlk] = this.tieNoteExtras[turtle][3];
                        this.noteDrums[turtle][saveBlk] = this.tieNoteExtras[turtle][4];
                        this.embeddedGraphics[turtle][saveBlk] = this.tieNoteExtras[turtle][5];

                         if (this.justCounting[turtle].length === 0) {
                            // Remove the note from the Lilypond list.
                            for (var i = 0; i < this.notePitches[turtle][saveBlk].length; i++) {
                                this.notationRemoveTie(turtle);
                            }
                        }

                        // Play previous note.
                        this.tie[turtle] = false;
                        tieDelay = 0;
                        this._processNote(this.tieCarryOver[turtle], saveBlk, turtle);

                        this.inNoteBlock[turtle].pop();

                        if (!this.suppressOutput[turtle]) {
                            this._doWait(turtle, Math.max(((bpmFactor / this.tieCarryOver[turtle]) + (this.noteDelay / 1000)) - turtleLag, 0));
                        }

                        tieDelay = this.tieCarryOver[turtle];
                        this.tieCarryOver[turtle] = 0;
                        this.tie[turtle] = true;

                        // Restore the current note.
                        saveBlk = saveCurrentExtras[0];
                        this.notePitches[turtle][saveBlk] = [];
                        this.noteOctaves[turtle][saveBlk] = [];
                        this.noteCents[turtle][saveBlk] = [];
                        this.noteHertz[turtle][saveBlk] = [];
                        for (var i = 0; i < saveCurrentNote.length; i++) {
                            this.notePitches[turtle][saveBlk].push(saveCurrentNote[i][0]);
                            this.noteOctaves[turtle][saveBlk].push(saveCurrentNote[i][1]);
                            this.noteCents[turtle][saveBlk].push(saveCurrentNote[i][2]);
                            this.noteHertz[turtle][saveBlk].push(saveCurrentNote[i][3]);
                        }

                        this.oscList[turtle][saveBlk] = saveCurrentExtras[1];
                        this.noteBeat[turtle][saveBlk] = saveCurrentExtras[2];
                        this.noteBeatValues[turtle][saveBlk] = saveCurrentExtras[3];
                        this.noteDrums[turtle][saveBlk] = saveCurrentExtras[4];
                        this.embeddedGraphics[turtle][saveBlk] = saveCurrentExtras[5];
                    }
                }

                if (this.tieCarryOver[turtle] === 0) {
                    // We need to save the first note in the pair.
                    this.tieNotePitches[turtle] = [];
                    this.tieCarryOver[turtle] = noteBeatValue;

                    for (var i = 0; i < this.notePitches[turtle][saveBlk].length; i++) {
                        this.tieNotePitches[turtle].push([this.notePitches[turtle][saveBlk][i], this.noteOctaves[turtle][saveBlk][i], this.noteCents[turtle][saveBlk][i], this.noteHertz[turtle][saveBlk][i]]);
                    }

                    this.tieNoteExtras[turtle] = [saveBlk, this.oscList[turtle][saveBlk], this.noteBeat[turtle][saveBlk], this.noteBeatValues[turtle][saveBlk], this.noteDrums[turtle][saveBlk], []];

                    // We play any drums in the first tied note along
                    // with the drums in the second tied note.
                    this.tieFirstDrums[turtle] = this.noteDrums[turtle][saveBlk];
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
            // TESTME: Could behave weirdly with tie.
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
            var duration = noteBeatValue;
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

            var chordNotes = [];
            var chordDrums = [];
            var that = this;
            __playnote = function () {
                var thisBlk = last(that.inNoteBlock[turtle]);

                if (that.notePitches[turtle][thisBlk] === undefined) {
                    console.log('no note found');
                    return;
                }

                // If there are multiple notes, remove the rests.
                if (that.notePitches[turtle][thisBlk].length > 1) {
                    while (that.notePitches[turtle][thisBlk].indexOf('rest') !== -1) {
                        that.notePitches[turtle][thisBlk].splice(that.notePitches[turtle][thisBlk].indexOf('rest'), 1);
                    }
                }

                // If there is no note, add a rest.
                if (that.notePitches[turtle][thisBlk].length === 0) {
                    that.notePitches[turtle][that.inNoteBlock[turtle][that.inNoteBlock[turtle].length - 1]].push('rest');
                }

                // Stop playing notes if the stop button is pressed.
                if (that.stopTurtle) {
                    return;
                }

                if (that.inNoteBlock[turtle].length === that.whichNoteToCount[turtle]) {
                    that.notesPlayed[turtle] = rationalSum(that.notesPlayed[turtle], [1, noteValue]);
                }

                var notes = [];
                var drums = [];
                var insideChord = -1;
                if ((that.notePitches[turtle][thisBlk].length + that.oscList[turtle][thisBlk].length) > 1) {
                    if (turtle in that.notationStaging && that.justCounting[turtle].length === 0) {
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
                if (that.glide[turtle].length > 0) {
                    var portamento = last(that.glide[turtle]);
                } else {
                    var portamento = 0;
                }

                if (that.staccato[turtle].length > 0) {
                    var staccatoBeatValue = last(that.staccato[turtle]);
                    if (staccatoBeatValue < 0) {
                        // slur
                        var beatValue = bpmFactor * ((1 / noteBeatValue) - (1 / staccatoBeatValue));
                    } else if (staccatoBeatValue > noteBeatValue) {
                        // staccato
                        var beatValue = bpmFactor / staccatoBeatValue;
                    } else {
                        var beatValue = bpmFactor / noteBeatValue;
                    }
                } else {
                    var beatValue = bpmFactor / noteBeatValue;
                }

                if (doVibrato) {
                    vibratoValue = beatValue * (duration / vibratoRate);
                }

                // Check to see if we need any courtesy accidentals:
                // e.g., are there any combinations of natural and
                // sharp or natural and flat notes?
                var courtesy = [];
                for (var i = 0; i < that.notePitches[turtle][thisBlk].length; i++) {
                    var n = that.notePitches[turtle][thisBlk][i];
                    var thisCourtesy = false;
                    if (n.length === 1) {
                        for (j = 0; j < that.notePitches[turtle][thisBlk].length; j++) {
                            if (i === j || that.noteOctaves[turtle][thisBlk][i] !== that.noteOctaves[turtle][thisBlk][j]) {
                                continue;
                            }

                            if (n + '♯' === that.notePitches[turtle][thisBlk][j] || n + '♭' === that.notePitches[turtle][thisBlk][j]) {
                                thisCourtesy = true;
                            }
                        }
                    }

                    courtesy.push(thisCourtesy);
                }

                // Process pitches
                if (that.notePitches[turtle][thisBlk].length > 0) {
                    for (var i = 0; i < that.notePitches[turtle][thisBlk].length; i++) {
                        if (that.notePitches[turtle][thisBlk][i] === 'rest' || forceSilence) {
                            note = 'R';
                            that.previousNotePlayed[turtle] = that.lastNotePlayed[turtle];
                        } else {
                            var noteObj = getNote(that.notePitches[turtle][thisBlk][i], that.noteOctaves[turtle][thisBlk][i], 0, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                            // If the cents for this note != 0, then
                            // we need to convert to frequency and add
                            // in the cents.
                            if (that.noteCents[turtle][thisBlk][i] !== 0) {
                                if (that.noteHertz[turtle][thisBlk][i] !== 0) {
                                    var note = that.noteHertz[turtle][thisBlk][i];
                                } else {
                                    var note = Math.floor(pitchToFrequency(noteObj[0], noteObj[1], that.noteCents[turtle][thisBlk][i], that.keySignature[turtle]));
                                }
                            } else {
                                var note = noteObj[0] + noteObj[1];
                            }
                        }

                        if (note !== 'R') {
                            // Apply harmonic here instead of in synth.
                            var p = partials.indexOf(1);
                            if (p > 0) {
                                note = noteToFrequency(note, that.keySignature[turtle]) * (p + 1);
                            }

                            notes.push(note);
                        }

                        if (duration > 0) {
                            if (carry > 0) {
                                if (i === 0 && that.justCounting[turtle].length === 0) {
                                    that.notationInsertTie(turtle);
                                }

                                var originalDuration = 1 / ((1 / duration) - (1 / carry));
                            } else {
                                var originalDuration = duration;
                            }

                            if (that.justCounting[turtle].length === 0) {
                                if (that.noteDrums[turtle][thisBlk].length > 0) {
                                    if (chordNotes.indexOf(note) === -1) {
                                        chordNotes.push(note);
                                    }

                                    if (chordDrums.indexOf(that.noteDrums[turtle][thisBlk][0]) === -1) {
                                        chordDrums.push(that.noteDrums[turtle][thisBlk][0]);
                                    }
                                } else {
                                    if (courtesy[i]) {
                                        if (chordNotes.indexOf(note + '♮') === -1) {
                                            chordNotes.push(note + '♮');
                                        }
                                    } else {
                                        if (chordNotes.indexOf(note) === -1) {
                                            chordNotes.push(note);
                                        }
                                    }
                                }
                            }
                        } else if (that.tieCarryOver[turtle] > 0) {
                            if (that.justCounting[turtle].length === 0) {
                                if (courtesy[i]) {
                                    if (chordNotes.indexOf(note) === -1) {
                                        chordNotes.push(note);
                                    }
                                } else {
                                    if (chordNotes.indexOf(note) === -1) {
                                        chordNotes.push(note);
                                    }
                                }
                            }
                        }

                        if (i === that.notePitches[turtle][thisBlk].length - 1) {
                            if (duration > 0) {
                                if (carry > 0) {
                                    var d = 1 / ((1 / duration) - (1 / carry));
                                } else {
                                    var d = duration;
                                }
                            } else if (that.tieCarryOver[turtle] > 0) {
                                var d = that.tieCarryOver[turtle];
                            }

                            that.updateNotation(chordNotes, d, turtle, -1, chordDrums);
                        }
                    }

                    var obj = rationalToFraction(1 / noteBeatValue);
                    if (obj[0] > 0) {
                        if (that.justCounting[turtle].length === 0) {
                            if (notes.length === 0) {
                                console.log('notes to play: R ' + obj[0] + '/' + obj[1]);
                            } else {
                                console.log('notes to play: ' + notes + ' ' + obj[0] + '/' + obj[1]);
                            }
                        } else {
                            if (notes.length === 0) {
                                console.log('notes to count: R ' + obj[0] + '/' + obj[1]);
                            } else {
                                console.log('notes to count: ' + notes + ' ' + obj[0] + '/' + obj[1]);
                            }
                        }
                    }

                    if (!that.suppressOutput[turtle] && that.blinkState) {
                        that.turtles.turtleList[turtle].blink(duration, last(that.masterVolume));
                    }

                    if (notes.length > 0) {
                        var len = notes[0].length;
                        if (typeof(notes[0]) === 'number') {
                            var obj = frequencyToPitch(notes[0]);
                            that.currentOctave[turtle] = obj[1];
                        } else {
                            that.currentOctave[turtle] = parseInt(notes[0].slice(len - 1));
                        }
                        that.currentCalculatedOctave[turtle] = that.currentOctave[turtle];

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
                            var __getParamsEffects = function (paramsEffects) {
                                if (!paramsEffects.doVibrato && !paramsEffects.doDistortion && !paramsEffects.doTremolo && !paramsEffects.doPhaser && !paramsEffects.Chorus && paramsEffects.partials.length === 1 && paramsEffects.partials[1] === 1) {
                                    return null;
                                } else {
                                    return paramsEffects;
                                }
                            };

                            if (_THIS_IS_MUSIC_BLOCKS_ && !forceSilence) {
                                // Parameters related to effects
                                var paramsEffects = {
                                    'doVibrato': doVibrato,
                                    'doDistortion': doDistortion,
                                    'doTremolo': doTremolo,
                                    'doPhaser': doPhaser,
                                    'doChorus': doChorus,
                                    'doPartials': true,
                                    'doPortamento': true,
                                    'doNeighbor': doNeighbor,
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
                                    'chorusDepth': chorusDepth,
                                    'partials': partials,
                                    'portamento': portamento,
                                    'neighborArgNote1': neighborArgNote1,
                                    'neighborArgNote2': neighborArgNote2,
                                    'neighborArgBeat': neighborArgBeat,
                                    'neighborArgCurrentBeat': neighborArgCurrentBeat
                                };

                                if (that.oscList[turtle][thisBlk].length > 0) {
                                    if (notes.length > 1) {
                                        that.errorMsg(last(that.oscList[turtle][thisBlk]) + ': ' +  _('synth cannot play chords.'), blk);
                                    }

                                    if (!that.suppressOutput[turtle]) {    
                                        that.synth.trigger(turtle, notes, beatValue, last(that.oscList[turtle][thisBlk]), paramsEffects, null, false);
                                    }

                                    if (that.justCounting[turtle].length === 0) {
                                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'notes', notes, beatValue, last(that.oscList[turtle][thisBlk]), __getParamsEffects(paramsEffects), null]);
                                    }
                                } else if (that.drumStyle[turtle].length > 0) {
                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(turtle, notes, beatValue, last(that.drumStyle[turtle]), null, null, false);
                                    }

                                    if (that.justCounting[turtle].length === 0) {
                                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'notes', notes, beatValue, that.drumStyle[turtle], null, null]);
                                    }
                                } else if (that.turtles.turtleList[turtle].drum) {
                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(turtle, notes, beatValue, 'drum', null, null, false);
                                    }

                                    if (that.justCounting[turtle].length === 0) {
                                        that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'notes', notes, beatValue, 'drum', null, null]);
                                    }
                                } else {
                                    for (var d = 0; d < notes.length; d++) {
                                        if (notes[d] in that.pitchDrumTable[turtle]) {
                                            if (!that.suppressOutput[turtle]) {
                                                console.log(that.glide[turtle].length);
                                                that.synth.trigger(turtle, notes[d], beatValue, that.pitchDrumTable[turtle][notes[d]], null, null, false);
                                            }

                                            if (that.justCounting[turtle].length === 0) {
                                                that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, that.pitchDrumTable[turtle][notes[d]], null, null]);
                                            }
                                        } else if (turtle in that.instrumentNames && last(that.instrumentNames[turtle])) {
                                            if (!that.suppressOutput[turtle]) {
                                                // If we are in a glide, use setNote after the first note.
                                                if (that.glide[turtle].length > 0) {
                                                    if (that.glideOverride[turtle] === 0) {
                                                        console.log('glide note ' + beatValue);
                                                        that.synth.trigger(turtle, notes[d], beatValue, last(that.instrumentNames[turtle]), paramsEffects, filters, true);
                                                    } else {
                                                        // trigger first note for entire duration of the glissando
                                                        var beatValueOverride = bpmFactor / that.glideOverride[turtle];
                                                        console.log('first glide note: ' + that.glideOverride[turtle] + ' ' + beatValueOverride);
                                                        that.synth.trigger(turtle, notes[d], beatValueOverride, last(that.instrumentNames[turtle]), paramsEffects, filters, false);
                                                        that.glideOverride[turtle] = 0;
                                                    }
                                                } else {
                                                    that.synth.trigger(turtle, notes[d], beatValue, last(that.instrumentNames[turtle]), paramsEffects, filters, false);
                                                }
                                            }

                                            if (that.justCounting[turtle].length === 0) {
                                                that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, last(that.instrumentNames[turtle]), __getParamsEffects(paramsEffects), filters]);
                                            }
                                        } else if (turtle in that.voices && last(that.voices[turtle])) {
                                            if (!that.suppressOutput[turtle]) {
                                                console.log(that.glide[turtle].length);
                                                that.synth.trigger(turtle, notes[d], beatValue, last(that.voices[turtle]), paramsEffects, null, false);
                                            }

                                            if (that.justCounting[turtle].length === 0) {
                                                that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, last(that.voices[turtle]), __getParamsEffects(paramsEffects), null]);
                                            }
                                        } else {
                                            if (!that.suppressOutput[turtle]) {
                                                that.synth.trigger(turtle, notes[d], beatValue, 'default', paramsEffects, null, false);
                                            }

                                            if (that.justCounting[turtle].length === 0) {
                                                that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'notes', notes[d], beatValue, 'default', __getParamsEffects(paramsEffects), null]);
                                            }
                                        }
                                    }
                                }

                            }
                        }

                        that.previousNotePlayed[turtle] = that.lastNotePlayed[turtle];
                        that.lastNotePlayed[turtle] = [notes[0], noteBeatValue];
                        that.noteStatus[turtle] = [notes, noteBeatValue];
                        that.lastPitchPlayed[turtle] = that.lastNotePlayed[turtle]; //For a stand-alone pitch block.
                    }
                }

                // Process drums
                if (that.noteDrums[turtle][thisBlk].length > 0) {
                    for (var i = 0; i < that.noteDrums[turtle][thisBlk].length; i++) {
                        drums.push(that.noteDrums[turtle][thisBlk][i]);
                    }

                    for (var i = 0; i < that.tieFirstDrums[turtle].length; i++) {
                        if (drums.indexOf(that.tieFirstDrums[turtle][i]) === -1) {
                            drums.push(that.tieFirstDrums[turtle][i]);
                        }
                    }

                    // If it is > 0, we already counted this note
                    // (e.g. pitch & drum combination).
                    if (that.notePitches[turtle][thisBlk].length === 0) {
                        var obj = rationalToFraction(1 / noteBeatValue);
                        if (obj[0] > 0) {
                            if (that.justCounting[turtle].length === 0) {
                                console.log('drums to play ' + notes + ' ' + obj[0] + '/' + obj[1]);
                            } else {
                                console.log('drums to count ' + notes + ' ' + obj[0] + '/' + obj[1]);
                            }
                        }

                        if (!that.suppressOutput[turtle] && that.blinkState) {
                            that.turtles.turtleList[turtle].blink(duration, last(that.masterVolume));
                        }
                    }

                    if ((that.tie[turtle] && that.tieCarryOver[turtle] > 0) || duration > 0) {
                        // If we are in a tie, play the drum as if it
                        // were tied.
                        if (that.tie[turtle] && noteBeatValue === 0) {
                            var newBeatValue = 0;
                        } else {
                            var newBeatValue = beatValue;
                            if (tieDelay > 0) {
                                that.tieFirstDrums[turtle] = [];
                            }
                        }

                        if (newBeatValue > 0) {
                            if (_THIS_IS_MUSIC_BLOCKS_ && !forceSilence) {
                                for (var i = 0; i < drums.length; i++) {
                                    if (that.drumStyle[turtle].length > 0) {
                                        if (!that.suppressOutput[turtle]) {
                                            that.synth.trigger(turtle, ['C2'], newBeatValue, last(that.drumStyle[turtle]), null, null, false);
                                        }

                                        if (that.justCounting[turtle].length === 0) {
                                            that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'notes', ['C2'], newBeatValue, last(that.drumStyle[turtle]), null, null]);
                                        }
                                    } else {
                                        if (!that.suppressOutput[turtle]) {
                                            that.synth.trigger(turtle, ['C2'], newBeatValue, drums[i], null, null, false);
                                        }

                                        if (that.justCounting[turtle].length === 0) {
                                            that._playbackPush(turtle, [that.previousTurtleTime[turtle], 'notes', ['C2'], newBeatValue, drums[i], null, null]);
                                        }
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

                // While we tie notes together, we don't want to tie
                // the corresponding graphics.
                if (that.tie[turtle] && noteBeatValue === 0) {
                    if (tieDelay > 0) {
                        that._dispatchTurtleSignals(turtle, bpmFactor / that.tieCarryOver[turtle], blk, bpmFactor / tieDelay);
                    } else {
                        that._dispatchTurtleSignals(turtle, bpmFactor / that.tieCarryOver[turtle], blk, 0);
                    }
                } else {
                    if (tieDelay > 0) {
                        that._dispatchTurtleSignals(turtle, beatValue - bpmFactor / tieDelay, blk, bpmFactor / tieDelay);
                    } else {
                        that._dispatchTurtleSignals(turtle, beatValue, blk, 0);
                    }
                }

                // After the note plays, clear the embedded graphics queue.
                that.embeddedGraphics[turtle][blk] = [];

                // Ensure note value block unhighlights after note plays.
                setTimeout(function () {
                    if (that.blocks.visible) {
                        that.blocks.unhighlight(blk);
                    }
                }, beatValue * 1000);
            };

            if (last(that.inNoteBlock[turtle]) != null) {
                if (this.noteDelay === 0 || !this.suppressOutput[turtle]) {
                    __playnote();
                } else {
                    setTimeout(function () {
                       __playnote();
                    }, this.noteDelay);
                }
            }
        }

        this.pushedNote[turtle] = false;

        if (callback !== undefined && callback !== null) {
            callback();
        }
    };

    this._playbackPush = function (turtle, obj) {
        // Don't record in optimize mode or Turtle Blocks.
        if (_THIS_IS_MUSIC_BLOCKS_ && !this.optimize) {
            this.playbackQueue[turtle].push(obj);
        }
    };

    this.playback = function (whichMouse, recording) {
        var that = this;

        if (this.restartPlayback) {
            this.progressBarWidth = 0;
        }

        if (recording === undefined) {
            recording = false;
        }

        this.recording = recording;

        if (recording) {
            this.playbackTime = 0;
        }

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

            this.hideBlocks();
            this.showBlocksAfterRun = true;
        }

        // We need to sort the playback queue by time (as graphics
        // embedded in embedded notes can be out of order)
        if (this.turtles.turtleList.length > 0) {
            for (t in this.turtles.turtleList) {
                if (t in this.playbackQueue) {
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
        }

        var d = new Date();
        this.firstNoteTime = d.getTime() - 1000 * this.playbackTime;

        var l = 0;
        if (this.progressBarWidth >= 100) {
            this.progressBarWidth = 0;
        }

        for (var turtle in this.playbackQueue) {  // For multiple voices
            l += this.playbackQueue[turtle].length;
        }

        if (t in this.playbackQueue && l > 0) {
            this.progressBarDivision = 100 / (this.playbackQueue[t].length);
        } else {
            // nothing to do...
            this.progressBarDivision = 100;
        }

        var turtleCount = 0;
        var inLoop = 0;

        __playbackLoop = function (turtle, idx) {
            inLoop++;
            that.playbackTime = that.playbackQueue[turtle][idx][0];

            if (turtleCount === 0) {
                //Not sure if that happens...but just in case
                turtleCount = 1;
            }

            that.progressBarWidth = that.progressBarWidth + (that.progressBarDivision / turtleCount)

            if (inLoop === l || that.progressBarWidth > 100) {
                that.progressBarWidth = 100;
            }

            if (that.progressBarWidth === NaN) {
                //Not sure if that happens...but just in case
                that.progressBar.style.visibility = 'hidden';
            }

            that.progressBar.style.width = that.progressBarWidth + '%';
            that.progressBar.innerHTML = parseInt(that.progressBarWidth * 1)  + '%';

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
                        if (that.blinkState) {
                            that.turtles.turtleList[turtle].blink(that.playbackQueue[turtle][idx][3], 50);
                        }

                        that.lastNote[turtle] = that.playbackQueue[turtle][idx][3];
                        that.synth.trigger(turtle, that.playbackQueue[turtle][idx][2], that.playbackQueue[turtle][idx][3], that.playbackQueue[turtle][idx][4], that.playbackQueue[turtle][idx][5], that.playbackQueue[turtle][idx][6]);
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
                    that._processShow(turtle, null, that.playbackQueue[turtle][idx][2], that.playbackQueue[turtle][idx][3]);
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
                    that.setSynthVolume(turtle, that.playbackQueue[turtle][idx][2], that.playbackQueue[turtle][idx][3]);
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
                        if (recording){
                            var lastNote = 0;
                            for (var turtle in that.playbackQueue) {
                                if (that.lastNote[turtle] > lastNote) {
                                    lastNote = that.lastNote[turtle];
                                }
                            }

                            setTimeout(function(){
                                console.log('finishing recording');
                                that.synth.recorder.stop();
                                that.synth.recorder.exportWAV(save.afterSaveWAV.bind(save));
                                that.recording = false;
                            }, Math.max(2000, lastNote * 1000));
                        }
                    }

                    that.showBlocks();
                    that.showBlocksAfterRun = false;
                }
            } else {
                that.turtles.turtleList[turtle].running = false;
                that.showBlocks();
                that.showBlocksAfterRun = false;
            }
        };

        __playback = function (turtle) {
            turtleCount++;
            setTimeout(function () {
                __playbackLoop(turtle, 0);
            }, that.playbackQueue[turtle][0][0] * 1000);
        };

        __resumePlayback = function (turtle) {
            turtleCount++;
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

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this._prepSynths();
        }

        this.onRunTurtle();
        this.stopTurtle = false;

        if (recording) {
            this.synth.recorder.clear();
            this.synth.recorder.record();
        }

        if (whichMouse < 0) {
            for (var turtle in this.playbackQueue) {
                this.lastNote[turtle] = 0;
                if (this.playbackQueue[turtle].length > 0) {
                    if (turtle < this.turtles.turtleList.length) {
                        this.turtles.turtleList[turtle].running = true;
                    }
                    if (recording){
                        console.log('recording');
                        __playback(turtle);
                    } else if (this.playbackTime > 0) {
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

    this._dispatchTurtleSignals = function (turtle, beatValue, blk, delay) {
        // When turtle commands (forward, right, arc) are inside of notes,
        // they are run progressively over the course of the note duration.
        if (this.embeddedGraphics[turtle][blk].length === 0) {
            return;
        }

        // If the previous note's graphics are not complete, add a
        // slight delay before drawing any new graphics.
        if (!this.embeddedGraphicsFinished[turtle]) {
            delay += 0.1;
        }

        this.embeddedGraphicsFinished[turtle] = false;
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
                that._processShow(turtle, null, arg1, arg2);
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

        // Cheat by 15% so that the mouse has time to complete its work.
        // var stepTime = beatValue * 1000 / NOTEDIV;
        var stepTime = (beatValue - delay) * 850 / NOTEDIV;
        if (stepTime < 0) {
            stepTime = 0;
        }

        // We do each graphics action sequentially, so we need to
        // divide stepTime by the length of the embedded graphics
        // array.
        if (extendedGraphicsCounter > 0) {
            var stepTime = stepTime / extendedGraphicsCounter;
        }

        var waitTime = delay * 1000;

        // We want to update the turtle graphics every 50ms within a note.
        if (stepTime > 200) {
            this.dispatchFactor[turtle] = NOTEDIV / 32;
        } else if (stepTime > 100) {
            this.dispatchFactor[turtle] = NOTEDIV / 16;
        } else if (stepTime > 50) {
            this.dispatchFactor[turtle] = NOTEDIV / 8;
        } else if (stepTime > 25) {
            this.dispatchFactor[turtle] = NOTEDIV / 4;
        } else if (stepTime > 12.5) {
            this.dispatchFactor[turtle] = NOTEDIV / 2;
        } else {
            this.dispatchFactor[turtle] = NOTEDIV;
        }

        // Mark the end time of this note's graphics operations.
        setTimeout(function() {
            that.embeddedGraphicsFinished[turtle] = true;
        }, beatValue * 1000);

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

    this.resetSynth = function (turtle) {
        if (!('default' in instruments[turtle])) {
            this.synth.createDefaultSynth(turtle);
        }

        this._setMasterVolume(DEFAULTVOLUME);
        for (var synth in this.synthVolume[turtle]) {
            this.setSynthVolume(turtle, synth, DEFAULTVOLUME);
        }

        this.synth.start();
    };

    this._processSpeak = function (text) {
        var new_text = '';
        for (var i = 0; i < text.length; i++) {
            if ((text[i] >= 'a' && text[i] <= 'z') || (text[i] >= 'A' && text[i] <= 'Z') || text[i] === ',' || text[i] === '.' || text[i] === ' ')
                new_text += text[i];
        }

        this.meSpeak.speak(new_text);
    };

    this._processShow = function (turtle, blk, arg0, arg1) {
        if (typeof(arg1) === 'string') {
            var len = arg1.length;
            if (len === 14 && arg1.substr(0, 14) === CAMERAVALUE) {
                doUseCamera([arg0], this.turtles, turtle, false, this.cameraID, this.setCameraID, this.errorMsg);
            } else if (len === 13 && arg1.substr(0, 13) === VIDEOVALUE) {
                doUseCamera([arg0], this.turtles, turtle, true, this.cameraID, this.setCameraID, this.errorMsg);
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
        } else if (typeof(arg1) === 'object' && blk !== null && this.blocks.blockList[this.blocks.blockList[blk].connections[2]].name === 'loadFile') {
            if (arg1) {
                this.turtles.turtleList[turtle].doShowText(arg0, arg1[1]);
            } else {
                this.errorMsg(_('You must select a file.'));
            }
        } else {
            this.turtles.turtleList[turtle].doShowText(arg0, arg1);
        }
    };

    this._getTargetTurtle = function (targetTurtle) {
        // The target turtle name can be a string or an int. Make
        // sure there is a turtle by this name and then find the
        // associated start block.

        // We'll compare the names as strings.
        if (typeof(targetTurtle) === 'number') {
            targetTurtle = targetTurtle.toString();
        }

        for (var i = 0; i < this.turtles.turtleList.length; i++) {
            if (!this.turtles.turtleList[i].trash) {
                var turtleName = this.turtles.turtleList[i].name;
                if (typeof(turtleName) === 'number') {
                    turtleName = turtleName.toString();
                }

                if (turtleName === targetTurtle) {
                    return i;
                }
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
            that.errorMsg(NOINPUTERRORMSG, parentBlk);
            // that.stopTurtle = true;
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

        if (that.blocks.blockList[blk].name === 'intervalname') {
            if (typeof(that.blocks.blockList[blk].value) === 'string') {
                that.noteDirection[turtle] = getIntervalDirection(that.blocks.blockList[blk].value);
                return getIntervalNumber(that.blocks.blockList[blk].value);
            } else {
                return 0;
            }
        } else if (that.blocks.blockList[blk].isValueBlock()) {
            if (that.blocks.blockList[blk].name === 'number' && typeof(that.blocks.blockList[blk].value) === 'string') {
                try {
                    that.blocks.blockList[blk].value = Number(that.blocks.blockList[blk].value);
                } catch (e) {
                    console.log(e);
                }
            }

            if (that.blocks.blockList[blk].name in that.evalArgDict) {
                eval(that.evalArgDict[that.blocks.blockList[blk].name]);
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
                if (this.mic === null || _THIS_IS_TURTLE_BLOCKS_) {
                    that.blocks.blockList[blk].value = 440;
                } else {
                    if (this.pitchAnalyser == null) {
                        this.pitchAnalyser = new Tone.Analyser({
                            'type': 'fft',
                            'size': this.limit
                        });

                        this.mic.connect(this.pitchAnalyser);
                    }

                    var values = that.pitchAnalyser.getValue();
                    var max = 0;
                    var idx = 0;
                    for (var i = 0; i < this.limit; i++) {
                        var v2 = values[i] * values[i];
                        if (v2 > max) {
                            max = v2;
                            idx = i;
                        }
                    }

                    that.blocks.blockList[blk].value = idx;
                }
                break;
            case 'loudness':
                if (this.mic === null) {
                    that.blocks.blockList[blk].value = 0;
                } else if (_THIS_IS_TURTLE_BLOCKS_) {
                    that.blocks.blockList[blk].value = Math.round(that.mic.getLevel() * 1000);
                } else {
                    if (this.volumeAnalyser == null) {
                        this.volumeAnalyser = new Tone.Analyser({
                            'type': 'waveform',
                            'size': this.limit
                        });

                        this.mic.connect(this.volumeAnalyser);
                    }

                    var values = that.volumeAnalyser.getValue();
                    var sum = 0;
                    for(var k = 0; k < that.limit; k++) {
                        sum += (values[k] * values[k]);
                    }

                    var rms = Math.sqrt(sum / that.limit);
                    that.blocks.blockList[blk].value = Math.round(rms * 100);
                }
                break;
            /*
            case 'eval':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                // Restricted to math methods
                that.blocks.blockList[blk].value = Number(eval('Math.' + a.replace(/x/g, b.toString())));
                break;
            */
            case 'arg':
                var cblk = that.blocks.blockList[blk].connections[1];
                if (cblk === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = 0;
                } else {
                    var name = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    var action_args = receivedArg
                    if (action_args && action_args.length >= Number(name)) {
                        var value = action_args[Number(name) - 1];
                        that.blocks.blockList[blk].value = value;
                    } else {
                        that.errorMsg('Invalid argument', blk);
                        that.blocks.blockList[blk].value = 0;
                    }
                }

                // return that.blocks.blockList[blk].value;
                break;
            case 'box':
                var cblk = that.blocks.blockList[blk].connections[1];
                if (cblk === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = 0;
                }

                var name = that.parseArg(that, turtle, cblk, blk, receivedArg);
                if (name in that.boxes) {
                    that.blocks.blockList[blk].value = that.boxes[name];
                } else {
                    that.errorMsg(NOBOXERRORMSG, blk, name);
                    that.blocks.blockList[blk].value = 0;
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
                        that.blocks.blockList[blk].value = 0;
                    }
                }
                break;
            case 'namedarg':
                var name = that.blocks.blockList[blk].privateData;
                var actionArgs = receivedArg;

                // If an action block with an arg is clicked,
                // the arg will have no value.
                if (actionArgs == null) {
                    that.errorMsg('Invalid argument', blk);
                    that.blocks.blockList[blk].value = 0
                }

                if (actionArgs.length >= Number(name)) {
                    var value = actionArgs[Number(name) - 1];
                    that.blocks.blockList[blk].value = value;
                } else {
                    that.errorMsg('Invalid argument', blk);
                    that.blocks.blockList[blk].value = 0
                }

                // return that.blocks.blockList[blk].value;
                break;
            case 'sqrt':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, that.blocks.blockList[blk].name]);
                } else {
                    var cblk = that.blocks.blockList[blk].connections[1];
                    if (cblk === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = 0;
                    } else {
                        var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                        if (typeof(a) === 'number') {
                            if (a < 0) {
                                that.errorMsg(NOSQRTERRORMSG, blk);
                                a = -a;
                            }

                            that.blocks.blockList[blk].value = that._doSqrt(a);
                        } else {
                            that.errorMsg(NANERRORMSG, blk);
                            that.blocks.blockList[blk].value = 0;
                        }
                    }
                }
                break;
            case 'abs':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, that.blocks.blockList[blk].name]);
                } else {
                    var cblk = that.blocks.blockList[blk].connections[1];
                    if (cblk === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = 0;
                    } else {
                        var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                        if (typeof(a) === 'number') {
                            that.blocks.blockList[blk].value = Math.abs(a);
                        } else {
                            that.errorMsg(NANERRORMSG, blk);
                            that.blocks.blockList[blk].value = 0;
                        }
                    }
                }
                break;
            case 'int':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'int']);
                } else {
                    var cblk = that.blocks.blockList[blk].connections[1];
                    if (cblk === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = 0;
                    } else {
                        var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                        if (typeof(a) === 'number') {
                            that.blocks.blockList[blk].value = Math.floor(a);
                        } else {
                            try {
                                that.blocks.blockList[blk].value = Math.floor(Number(a));
                            } catch (e) {
                                console.log(e);
                                that.errorMsg(NANERRORMSG, blk);
                                that.blocks.blockList[blk].value = 0;
                            }
                        }
                    }
                }
                break;
            case 'mod':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'mod']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    if (cblk1 === null || cblk2 === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = 0;
                    } else {
                        var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                        var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                        if (typeof(a) === 'number' && typeof(b) === 'number') {
                            that.blocks.blockList[blk].value = that._doMod(a, b);
                        } else {
                            that.errorMsg(NANERRORMSG, blk);
                            that.blocks.blockList[blk].value = 0;
                        }
                    }
                }
                break;
            case 'not':
                var cblk = that.blocks.blockList[blk].connections[1];
                if (cblk === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = false;
                } else {
                    var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    try {
                        that.blocks.blockList[blk].value = !a;
                    } catch (e) {
                        console.log(e);
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = false
                    }
                }
                break;
            case 'greater':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = false;
                } else {
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    try {
                        that.blocks.blockList[blk].value = (Number(a) > Number(b));
                    } catch (e) {
                        console.log(e);
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = false
                    }
                }
                break;
            case 'equal':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = false;
                } else {
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    try {
                        that.blocks.blockList[blk].value = (a === b);
                    } catch (e) {
                        console.log(e);
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = false
                    }
                }
                break;
            case 'less':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = false;
                } else {
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    try {
                        that.blocks.blockList[blk].value = (Number(a) < Number(b));
                    } catch (e) {
                        console.log(e);
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = false
                    }
                }
                break;
            case 'random':
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
                    } else {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = false
                    }
                }
                break;
            case 'oneOf':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    if (cblk1 !== null) {
                        var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                        that.blocks.blockList[blk].value = a;
                    } else if (cblk2 !== null) {
                        var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                        that.blocks.blockList[blk].value = b;
                    } else {
                        that.blocks.blockList[blk].value = 0;
                    }
                } else {
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    that.blocks.blockList[blk].value = that._doOneOf(a, b);
                }
                break;
            case 'plus':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'plus']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    if (cblk1 === null || cblk2 === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        if (cblk1 !== null) {
                            var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                            that.blocks.blockList[blk].value = a;
                        } else if (cblk2 !== null) {
                            var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                            that.blocks.blockList[blk].value = b;
                        } else {
                            that.blocks.blockList[blk].value = 0;
                        }
                    } else {
                        // We have a special case for certain keywords
                        // associated with octaves: current, next, and
                        // previous. In the case of plus, since we use it
                        // for string concatenation as well, we check to
                        // see if the block is connected to a pitch block
                        // before assuming octave.

                        var cblk0 = that.blocks.blockList[blk].connections[0];
                        if (cblk0 !== null && that.blocks.blockList[cblk0].name === 'pitch') {
                            var noteBlock = that.blocks.blockList[cblk0].connections[1];
                            if (typeof(that.blocks.blockList[cblk1].value) === 'string') {
                                var a = calcOctave(that.currentOctave[turtle], that.blocks.blockList[cblk1].value, that.lastNotePlayed[turtle], that.blocks.blockList[noteBlock].value);
                            } else {
                                var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                            }

                            if (typeof(that.blocks.blockList[cblk2].value) === 'string') {
                                var b = calcOctave(that.currentOctave[turtle], that.blocks.blockList[cblk2].value, that.lastNotePlayed[turtle], that.blocks.blockList[noteBlock].value);
                            } else {
                                var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                            }
                        } else {
                            var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                            var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                        }

                        that.blocks.blockList[blk].value = that._doPlus(a, b);
                    }
                }
                break;
            case 'multiply':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'multiply']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    var cblk0 = that.blocks.blockList[blk].connections[0];
                    var noteBlock = that.blocks.blockList[cblk0].connections[1];
                    if (cblk1 === null || cblk2 === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        if (cblk1 !== null) {
                            var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                            that.blocks.blockList[blk].value = a;
                        } else if (cblk2 !== null) {
                            var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                            that.blocks.blockList[blk].value = b;
                        } else {
                            that.blocks.blockList[blk].value = 0;
                        }
                    } else {
                        // We have a special case for certain keywords
                        // associated with octaves: current, next, and
                        // previous.
                        if (typeof(that.blocks.blockList[cblk1].value) === 'string') {
                            var a = calcOctave(that.currentOctave[turtle], that.blocks.blockList[cblk1].value, that.lastNotePlayed[turtle], that.blocks.blockList[noteBlock].value);
                        } else {
                            var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                        }

                        if (typeof(that.blocks.blockList[cblk2].value) === 'string') {
                            var b = calcOctave(that.currentOctave[turtle], that.blocks.blockList[cblk2].value, that.lastNotePlayed[turtle], that.blocks.blockList[noteBlock].value);
                        } else {
                            var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                        }

                        that.blocks.blockList[blk].value = that._doMultiply(a, b);
                    }
                }
                break;
            case 'power':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'power']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    if (cblk1 === null || cblk2 === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        if (cblk1 !== null) {
                            var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                            that.blocks.blockList[blk].value = a;
                        } else {
                            that.blocks.blockList[blk].value = 0;
                        }
                    } else {
                        var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                        var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                        if (typeof(a) === 'number' && typeof(b) === 'number') {

                            that.blocks.blockList[blk].value = that._doPower(a, b);
                        } else {
                            that.errorMsg(NANERRORMSG, blk);
                            that.blocks.blockList[blk].value = 0;
                        }
                    }
                }
                break;
            case 'divide':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'divide']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    if (cblk1 === null || cblk2 === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        if (cblk1 !== null) {
                            var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                            that.blocks.blockList[blk].value = a;
                        } else {
                            that.blocks.blockList[blk].value = 0;
                        }
                    } else {
                        var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                        var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                        if (typeof(a) === 'number' && typeof(b) === 'number') {
                            that.blocks.blockList[blk].value = that._doDivide(a, b);
                        } else {
                            that.errorMsg(NANERRORMSG, blk);
                            that.blocks.blockList[blk].value = 0;
                        }
                    }
                }
                break;
            case 'minus':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'minus']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    var cblk2 = that.blocks.blockList[blk].connections[2];
                    var cblk0 = that.blocks.blockList[blk].connections[0];
                    var noteBlock = that.blocks.blockList[cblk0].connections[1];
                    if (cblk1 === null || cblk2 === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        if (cblk1 !== null) {
                            var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                            that.blocks.blockList[blk].value = a;
                        } else if (cblk2 !== null) {
                            var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                            that.blocks.blockList[blk].value = -b;
                        } else {
                            that.blocks.blockList[blk].value = 0;
                        }
                    } else {
                        // We have a special case for certain keywords
                        // associated with octaves: current, next, and
                        // previous.
                        if (typeof(that.blocks.blockList[cblk1].value) === 'string') {
                            var a = calcOctave(that.currentOctave[turtle], that.blocks.blockList[cblk1].value, that.lastNotePlayed[turtle],  that.blocks.blockList[noteBlock].value);
                        } else {
                            var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                        }

                        if (typeof(that.blocks.blockList[cblk2].value) === 'string') {
                            var b = calcOctave(that.currentOctave[turtle], that.blocks.blockList[cblk2].value, that.lastNotePlayed[turtle],  that.blocks.blockList[noteBlock].value);
                        } else {
                            var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                        }
                        
                        that.blocks.blockList[blk].value = that._doMinus(a, b);
                    }
                }
                break;
            case 'doubly':
                var cblk = that.blocks.blockList[blk].connections[1];
                //find block at end of chain
                if (cblk === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = 0;
                } else {
                    var currentblock = cblk;
                    while (true) {
                        var blockToCheck = that.blocks.blockList[currentblock];
                        if (blockToCheck.name === 'intervalname') {
                            // Augmented or diminished only
                            if (blockToCheck.value[0] === 'a') {
                                that.blocks.blockList[blk].value = that.parseArg(that, turtle, cblk, blk, receivedArg) + 1;
                            } else if (blockToCheck.value[0] === 'd') {
                                that.blocks.blockList[blk].value = that.parseArg(that, turtle, cblk, blk, receivedArg) - 1;
                            } else {
                                that.blocks.blockList[blk].value = that.parseArg(that, turtle, cblk, blk, receivedArg);
                            }
                            break;
                        } else if (blockToCheck.name !== 'doubly') {
                            var value = that.parseArg(that, turtle, cblk, blk, receivedArg);
                            if (typeof(value) === 'number') {
                                that.blocks.blockList[blk].value = value * 2;
                            } else if (typeof(value) === 'string') {
                                that.blocks.blockList[blk].value = value + value;
                            } else {
                                that.blocks.blockList[blk].value = value;
                            }
                            break;
                        }

                        currentblock=that.blocks.blockList[currentblock].connections[1];
                        if (currentblock == null) {
                            that.blocks.blockList[blk].value = 0;
                            break;
                        }
                    }
                }
                break;
            case 'neg':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'neg']);
                } else {
                    var cblk = that.blocks.blockList[blk].connections[1];
                    if (cblk !== null) {
                        var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                        if (typeof(a) === 'number') {
                            that.blocks.blockList[blk].value = that._doMinus(0, a);
                        } else if (typeof(a) === 'string') {
                            var obj = a.split('');
                            that.blocks.blockList[blk].value = obj.reverse().join('');
                        } else {
                            that.blocks.blockList[blk].value = a;
                        }
                    } else {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = 0;
                    }
                }
                break;
            case 'toascii':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'toascii']);
                } else {
                    var cblk1 = that.blocks.blockList[blk].connections[1];
                    if (cblk === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = 'A';
                    } else {
                        var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                        if (typeof(a) === 'number') {
                            that.blocks.blockList[blk].value = String.fromCharCode(a);
                        } else {
                            that.errorMsg(NANERRORMSG, blk);
                            that.blocks.blockList[blk].value = 'A';
                        }
                    }
                }
                break;
            case 'myclick':
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
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        that.errorMsg(_('Cannot find mouse') + ' ' + targetTurtle, blk);
                    } else {
                        that.errorMsg(_('Cannot find turtle') + ' ' + targetTurtle, blk);
                    }

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
            case 'synthname':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'synthname']);
                } else {
                    that.blocks.blockList[blk].value = last(that.instrumentNames[turtle]);
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
            case 'modelength':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'modelength']);
                } else {
                    that.blocks.blockList[blk].value = getModeLength(that.keySignature[turtle]);
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
                        that.blocks.blockList[blk].value = (that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1]) / notevalue;
                    }
                }
                break;
            case 'elapsednotes':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'elapsednotes']);
                } else {
                    that.blocks.blockList[blk].value = that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1];
                }
                break;
            case 'pitchinhertz':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'pitchinhertz']);
                } else {
                    if (that.lastNotePlayed[turtle] !== null) {
                        that.blocks.blockList[blk].value = that.synth.getFrequency(that.lastNotePlayed[turtle][0], that.synth.changeInTemperament);
                    }
                }
                break;
            case 'turtleelapsednotes':
                var value = null;
                var cblk = that.blocks.blockList[blk].connections[1];
                var targetTurtle = that.parseArg(that, turtle, cblk, blk, receivedArg);
                for (var i = 0; i < that.turtles.turtleList.length; i++) {
                    var thisTurtle = that.turtles.turtleList[i];
                    if (targetTurtle === thisTurtle.name) {
                        value = that.notesPlayed[i][0] / that.notesPlayed[i][1];
                        that.blocks.blockList[blk].value = value;
                        break;
                    }
                }

                if (value == null) {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        that.errorMsg(_('Cannot find mouse') + ' ' + targetTurtle, blk);
                    } else {
                        that.errorMsg(_('Cannot find turtle') + ' ' + targetTurtle, blk);
                    }

                    that.blocks.blockList[blk].value = that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1];
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
                    var obj = numberToPitch(num + that.pitchNumberOffset[turtle]);
                    if (that.blocks.blockList[blk].name === 'number2pitch') {
                        that.blocks.blockList[blk].value = obj[0];
                    } else {
                        that.blocks.blockList[blk].value = obj[1];
                    }
                } else {
                    that.errorMsg(NOINPUTERRORMSG, blk);
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
                            var obj = getNote(that.notePitches[i][0], that.noteOctaves[i][0], 0, that.keySignature[i], that.moveable[turtle], null, that.errorMsg);
                        } else {
                            console.log('Cannot find a note for mouse ' + turtle);
                            that.errorMsg(INVALIDPITCH, blk);
                            var obj = ['G', 4];
                        }

                        value = pitchToNumber(obj[0], obj[1], that.keySignature[i]) - that.pitchNumberOffset[turtle];
                        that.blocks.blockList[blk].value = value;
                        break;
                    }
                }

                if (value == null) {
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        that.errorMsg(_('Cannot find mouse') + ' ' + targetTurtle, blk);
                    } else {
                        that.errorMsg(_('Cannot find turtle') + ' ' + targetTurtle, blk);
                    }

                    if (that.lastNotePlayed[turtle] !== null) {
                        var len = that.lastNotePlayed[turtle][0].length;
                        var pitch = that.lastNotePlayed[turtle][0].slice(0, len - 1);
                        var octave = parseInt(that.lastNotePlayed[turtle][0].slice(len - 1));
                        var obj = [pitch, octave];
                    } else if (that.notePitches[turtle].length > 0) {
                        var obj = getNote(that.notePitches[turtle][last(that.inNoteBlock[turtle])][0], that.noteOctaves[turtle][last(that.inNoteBlock[turtle])][0], 0, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                    } else {
                        console.log('Cannot find a note for mouse ' + turtle);
                        that.errorMsg(INVALIDPITCH, blk);
                        var obj = ['G', 4];
                    }

                    value = pitchToNumber(obj[0], obj[1], that.keySignature[turtle]) - that.pitchNumberOffset[turtle];
                    that.blocks.blockList[blk].value = value;
                }
                break;
            case 'deltapitch':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'mypitch']);
                } else if (that.previousNotePlayed[turtle] == null) {
                    that.blocks.blockList[blk].value = 0;
                } else {
                    var len = that.previousNotePlayed[turtle][0].length;
                    var pitch = that.previousNotePlayed[turtle][0].slice(0, len - 1);
                    var octave = parseInt(that.previousNotePlayed[turtle][0].slice(len - 1));
                    var obj = [pitch, octave];
                    var previousValue = pitchToNumber(obj[0], obj[1], that.keySignature[turtle]);
                    len = that.lastNotePlayed[turtle][0].length;
                    pitch = that.lastNotePlayed[turtle][0].slice(0, len - 1);
                    octave = parseInt(that.lastNotePlayed[turtle][0].slice(len - 1));
                    obj = [pitch, octave];
                    that.blocks.blockList[blk].value = pitchToNumber(obj[0], obj[1], that.keySignature[turtle]) - previousValue;
                }
                break;
            case 'mypitch':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'mypitch']);
                } else {
                    var value = null;
                    if (that.lastNotePlayed[turtle] !== null) {
                        if (typeof(that.lastNotePlayed[turtle][0]) === 'string') {
                            var len = that.lastNotePlayed[turtle][0].length;
                            var pitch = that.lastNotePlayed[turtle][0].slice(0, len - 1);
                            var octave = parseInt(that.lastNotePlayed[turtle][0].slice(len - 1));
                            var obj = [pitch, octave];
                        } else {
                            // Hertz?
                            var obj = frequencyToPitch(that.lastNotePlayed[turtle][0]);
                        }
                    } else if (that.inNoteBlock[turtle] in that.notePitches[turtle] && that.notePitches[turtle][last(that.inNoteBlock[turtle])].length > 0) {
                        var obj = getNote(that.notePitches[turtle][last(that.inNoteBlock[turtle])][0], that.noteOctaves[turtle][last(that.inNoteBlock[turtle])][0], 0, that.keySignature[turtle], that.moveable[turtle], null, that.errorMsg);
                    } else {
                        if (that.lastNotePlayed[turtle] !== null) {
                            console.log('Cannot find a note ');
                            that.errorMsg(INVALIDPITCH, blk);
                        }

                        var obj = ['G', 4];
                    }

                    value = pitchToNumber(obj[0], obj[1], that.keySignature[turtle]) - that.pitchNumberOffset[turtle];
                    that.blocks.blockList[blk].value = value;
                }
                break;
            case 'beatvalue':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'beatvalue']);
                } else {
                    if (that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1] < that.pickup[turtle]) {
                        that.blocks.blockList[blk].value = 0;
                    } else {
                        that.blocks.blockList[blk].value = (((that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1] - that.pickup[turtle]) * that.noteValuePerBeat[turtle]) % that.beatsPerMeasure[turtle]) + 1;
                    }
                }
                break;
            case 'measurevalue':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'measurevalue']);
                } else {
                    if (that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1] < that.pickup[turtle]) {
                        that.blocks.blockList[blk].value = 0;
                    } else {
                        that.blocks.blockList[blk].value = Math.floor(((that.notesPlayed[turtle][0] / that.notesPlayed[turtle][1] - that.pickup[turtle]) * that.noteValuePerBeat[turtle]) / that.beatsPerMeasure[turtle]) + 1;
                    }
                }
                break;
            case 'mynotevalue':
                if (that.inStatusMatrix && that.blocks.blockList[that.blocks.blockList[blk].connections[0]].name === 'print') {
                    that.statusFields.push([blk, 'mynotevalue']);
                } else {
                    var value = 0;
                    if (that.noteValue[turtle][last(that.inNoteBlock[turtle])] !== null && that.noteValue[turtle][last(that.inNoteBlock[turtle])] !== undefined) {
                        if (that.noteValue[turtle][last(that.inNoteBlock[turtle])] !== 0) {
                            value = 1 / that.noteValue[turtle][last(that.inNoteBlock[turtle])];
                        } else {
                            value = 0;
                        }
                    } else if (that.lastNotePlayed[turtle] !== null) {
                        value = that.lastNotePlayed[turtle][1];
                    } else if (that.notePitches[turtle][last(that.inNoteBlock[turtle])] !== undefined && that.notePitches[turtle][last(that.inNoteBlock[turtle])].length > 0) {
                        value = that.noteBeat[turtle][last(that.inNoteBlock[turtle])];
                    } else {
                        console.log('Cannot find a note for turtle ' + turtle);
                        value = 0;
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
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        that.errorMsg(_('Cannot find mouse') + ' ' + targetTurtle, blk);
                    } else {
                        that.errorMsg(_('Cannot find turtle') + ' ' + targetTurtle, blk);
                    }
                    that.blocks.blockList[blk].value = -1;
                }
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
                    if (_THIS_IS_MUSIC_BLOCKS_) {
                        that.errorMsg(_('Cannot find mouse') + ' ' + targetTurtle, blk);
                    } else {
                        that.errorMsg(_('Cannot find turtle') + ' ' + targetTurtle, blk);
                    }

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
                if (cblk1 === null || cblk2 === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = false;
                } else {
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    that.blocks.blockList[blk].value = a && b;
                }
                break;
            case 'or':
                var cblk1 = that.blocks.blockList[blk].connections[1];
                var cblk2 = that.blocks.blockList[blk].connections[2];
                if (cblk1 === null || cblk2 === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = false;
                } else {
                    var a = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                    var b = that.parseArg(that, turtle, cblk2, blk, receivedArg);
                    that.blocks.blockList[blk].value = a || b;
                }
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
            case 'toppos':
                that.blocks.blockList[blk].value = (that.turtles._canvas.height / (2.0 * that.turtles.scale));
                break;
            case 'rightpos':
                that.blocks.blockList[blk].value = (that.turtles._canvas.width / (2.0 * that.turtles.scale));
                break;
            case 'leftpos':
                that.blocks.blockList[blk].value = -1 * (that.turtles._canvas.width / (2.0 * that.turtles.scale));
                break;
            case 'bottompos':
                that.blocks.blockList[blk].value = -1 * (that.turtles._canvas.height / (2.0 * that.turtles.scale));
                break;
            case 'width':
                that.blocks.blockList[blk].value = (that.turtles._canvas.width / (that.turtles.scale));
                break;
            case 'height':
                that.blocks.blockList[blk].value = (that.turtles._canvas.height / (that.turtles.scale));
                break;
            case 'mousebutton':
                that.blocks.blockList[blk].value = that.getStageMouseDown();
                break;
            case 'foundturtle':
                var cblk = that.blocks.blockList[blk].connections[1];
                var targetTurtle = that.parseArg(that, turtle, cblk, blk, receivedArg);
                that.blocks.blockList[blk].value = (that._getTargetTurtle(targetTurtle) !== null);
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

                var canvas = docById('overlayCanvas');
                var ctx = canvas.getContext('2d');
                var imgData = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
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
                    if (cblk1 === null || cblk2 === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        that.blocks.blockList[blk].value = 392;
                    } else {
                        var note = that.parseArg(that, turtle, cblk1, blk, receivedArg);
                        var octave = Math.floor(calcOctave(that.currentOctave[turtle], that.parseArg(that, turtle, cblk2, blk, receivedArg), that.lastNotePlayed[turtle], note));
                        block.value = Math.round(pitchToFrequency(note, octave, 0, that.keySignature[turtle]));
                    }
                } else {
                    const NOTENAMES = ['A', 'B♭', 'B', 'C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭'];
                    const NOTECONVERSION = {'A♯': 'B♭', 'C♯': 'D♭', 'D♯': 'E♭', 'F♯': 'G♭', 'G♯': 'A♭'};
                    var block = that.blocks.blockList[blk];
                    var cblk = block.connections[1];
                    if (cblk === null) {
                        that.errorMsg(NOINPUTERRORMSG, blk);
                        var noteName = 'G';
                    } else {
                        var noteName = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    }

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
                            if (cblk === null) {
                                that.errorMsg(NOINPUTERRORMSG, blk);
                                var octave = 4;
                            } else {
                                var octave = Math.floor(that.parseArg(that, turtle, cblk, blk, receivedArg));
                            }

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
                    block.value = 0;
                }
                break;
            case 'indexHeap':
                var block = that.blocks.blockList[blk];
                var cblk = that.blocks.blockList[blk].connections[1];
                if (cblk === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = 0;
                } else {
                    var a = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    if (typeof(a) === 'number') {
                        if (!(turtle in that.turtleHeaps)) {
                            that.turtleHeaps[turtle] = [];
                        }

                        if (a < 1) {
                            a = 1;
                            that.errorMsg(_('Index must be > 0.'))
                        }

                        if (a > 1000) {
                            a = 1000;
                            that.errorMsg(_('Maximum heap size is 1000.'))
                        }

                        // If index > heap length, grow the heap.
                        while (that.turtleHeaps[turtle].length < a) {
                            that.turtleHeaps[turtle].push(0);
                        }

                        block.value = that.turtleHeaps[turtle][a - 1];
                    } else {
                        that.errorMsg(NANERRORMSG, blk);
                        that.blocks.blockList[blk].value = 0;
                    }
                }
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
                if (cblk === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = 0;
                } else {
                    that.blocks.blockList[blk].value = that._noteCounter(turtle, cblk);
                }
                break;
            case 'measureintervalsemitones':
                var cblk = that.blocks.blockList[blk].connections[1];
                if (cblk == null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = 0;
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
                        that.blocks.blockList[blk].value = last(that.lastPitch[turtle]) - last(that.firstPitch[turtle]);
                        that.firstPitch[turtle].pop();
                        that.lastPitch[turtle].pop();
                    } else {
                        that.blocks.blockList[blk].value = 0;
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
                break;
            case 'measureintervalscalar':
                var cblk = that.blocks.blockList[blk].connections[1];
                if (cblk == null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = 0;
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
                        that.blocks.blockList[blk].value = that._scalarDistance(turtle, last(that.firstPitch[turtle]), last(that.lastPitch[turtle]));

                        that.firstPitch[turtle].pop();
                        that.lastPitch[turtle].pop();
                    } else {
                        that.blocks.blockList[blk].value = 0;
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
                break;
            case 'calc':
                var actionArgs = [];
                var cblk = that.blocks.blockList[blk].connections[1];
                if (cblk === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = 0;
                } else {
                    var name = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    actionArgs = receivedArg;
                    // that.getBlockAtStartOfArg(blk);
                    if (name in that.actions) {
                        that.turtles.turtleList[turtle].running = true;
                        that._runFromBlockNow(that, turtle, that.actions[name], true, actionArgs, that.turtles.turtleList[turtle].queue.length);
                        that.blocks.blockList[blk].value = that.returns.shift();
                    } else {
                        that.errorMsg(NOACTIONERRORMSG, blk, name);
                        that.blocks.blockList[blk].value = 0;
                    }
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
                    that.blocks.blockList[blk].value = 0;
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
                if (cblk === null) {
                    that.errorMsg(NOINPUTERRORMSG, blk);
                    that.blocks.blockList[blk].value = 0;
                } else {
                    var name = that.parseArg(that, turtle, cblk, blk, receivedArg);
                    if (name in that.actions) {
                        that.turtles.turtleList[turtle].running = true;
                        that._runFromBlockNow(that, turtle, that.actions[name], true, actionArgs, that.turtles.turtleList[turtle].queue.length);
                        that.blocks.blockList[blk].value = that.returns.pop();
                    } else {
                        that.errorMsg(NOACTIONERRORMSG, blk, name);
                        that.blocks.blockList[blk].value = 0;
                    }
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
                    that.blocks.blockList[blk].value = 0;
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
            case 'makeblock':
                that.showBlocks();  // Force blocks to be visible.
                var blockArgs = [null];
                if (that.blocks.blockList[blk].argClampSlots.length > 0) {
                    for (var i = 0; i < that.blocks.blockList[blk].argClampSlots.length; i++) {
                        var t = (that.parseArg(that, turtle, that.blocks.blockList[blk].connections[i + 2], blk, receivedArg));
                        blockArgs.push(t);
                    }
                }
                var cblk = that.blocks.blockList[blk].connections[1];
                var name = that.parseArg(that, turtle, cblk, blk, receivedArg);
                var blockNumber = that.blocks.blockList.length;

                var x = that.turtles.turtleX2screenX(that.turtles.turtleList[turtle].x);
                var y = that.turtles.turtleY2screenY(that.turtles.turtleList[turtle].y);

                // We special case note blocks.
                //.TRANS: a musical note consisting of pitch and duration
                if (name === _('note')) {
                    switch(blockArgs.length) {
                    case 1:
                        var p = 'sol';
                        var o = 4;
                        var v = 4;
                        break;
                    case 2:
                        var p = blockArgs[1];
                        var o = 4;
                        var v = 4;
                        break;
                    case 3:
                        var p = blockArgs[1];
                        var o = blockArgs[2];
                        var v = 4;
                        break;
                    default:
                        var p = blockArgs[1];
                        var o = blockArgs[2];
                        var v = blockArgs[3];
                        break;
                    }

                    var newNote = [[0, 'newnote', x, y, [null, 1, 4, 8]], [1, 'divide', 0, 0, [0, 2, 3]], [2, ['number', {'value': 1}], 0, 0, [1]], [3, ['number', {'value': v}], 0, 0, [1]], [4, 'vspace', 0, 0, [0, 5]], [5, 'pitch', 0, 0, [4, 6, 7, null]], [6, ['solfege', {'value': p}], 0, 0, [5]], [7, ['number', {'value': o}], 0, 0, [5]], [8, 'hidden', 0, 0, [0, null]]];
                    that.blocks.loadNewBlocks(newNote);
                    that.blocks.blockList[blk].value = blockNumber;
                } else if (name === _('start')) {
                    var newBlock = [[0, 'start', x, y, [null, null, null]]];
                    that.blocks.loadNewBlocks(newBlock);
                    that.blocks.blockList[blk].value = blockNumber;
                } else if (name === _('silence')) {  // FIXME: others too
                    var newBlock = [[0, 'rest2', x, y, [null, null]]];
                    that.blocks.loadNewBlocks(newBlock);
                    that.blocks.blockList[blk].value = blockNumber;
                } else {
                    var obj = that.blocks.palettes.getProtoNameAndPalette(name);
                    var protoblk = obj[0];
                    var protoName = obj[2];
                    if (protoblk === null) {
                        that.errorMsg(_('Cannot find block') + ' ' + name);
                    } else {
                        var newBlock = [[0, protoName, x, y, [null]]];
                        for (var i = 1; i < that.blocks.protoBlockDict[protoblk].dockTypes.length; i++) {
                            // FIXME: type check args
                            if (i < blockArgs.length) {
                                if (typeof(blockArgs[i]) === 'number') {
                                    if (['anyin', 'numberin'].indexOf(that.blocks.protoBlockDict[protoblk].dockTypes[i]) === -1) {
                                        that.errorMsg(_('Warning: block argument type mismatch'));
                                    }
                                    newBlock.push([i, ['number', {'value': blockArgs[i]}], 0, 0, [0]]);
                                } else if (typeof(blockArgs[i]) === 'string') {
                                    if (['anyin', 'textin'].indexOf(that.blocks.protoBlockDict[protoblk].dockTypes[i]) === -1) {
                                        that.errorMsg(_('Warning: block argument type mismatch'));
                                    }
                                    newBlock.push([i, ['string', {'value': blockArgs[i]}], 0, 0, [0]]);
                                } else {
                                    newBlock[0][4].push(null);
                                }

                                newBlock[0][4].push(i);
                            } else {
                                newBlock[0][4].push(null);
                            }
                        }

                        console.log(newBlock);
                        that.blocks.loadNewBlocks(newBlock);
                        that.blocks.blockList[blk].value = blockNumber;
                    }
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

    this._noteCounter = function (turtle, cblk) {
        if (cblk == null) {
            return 0;
        } else {
            var saveSuppressStatus = this.suppressOutput[turtle];

            // We need to save the state of the boxes and heap
            // although there is a potential of a boxes collision with
            // other turtles.
            var saveBoxes = JSON.stringify(this.boxes);
            var saveTurtleHeaps = JSON.stringify(this.turtleHeaps[turtle]);
            // And the turtle state
            var saveX = this.turtles.turtleList[turtle].x;
            var saveY = this.turtles.turtleList[turtle].y;
            var saveColor = this.turtles.turtleList[turtle].color;
            var saveValue = this.turtles.turtleList[turtle].value;
            var saveChroma = this.turtles.turtleList[turtle].chroma;
            var saveStroke = this.turtles.turtleList[turtle].stroke;
            var saveCanvasAlpha = this.turtles.turtleList[turtle].canvasAlpha;
            var saveOrientation = this.turtles.turtleList[turtle].orientation;
            var savePenState = this.turtles.turtleList[turtle].penState;

            var saveWhichNoteToCount = this.whichNoteToCount[turtle];

            var savePrevTurtleTime = this.previousTurtleTime[turtle];
            var saveTurtleTime = this.turtleTime[turtle];

            this.suppressOutput[turtle] = true;
            this.justCounting[turtle].push(true);

            for (var b in this.endOfClampSignals[turtle]) {
                this.butNotThese[turtle][b] = [];
                for (var i = 0; i < this.endOfClampSignals[turtle][b].length; i++) {
                    this.butNotThese[turtle][b].push(i);
                }
            }

            var actionArgs = [];
            var saveNoteCount = this.notesPlayed[turtle];
            this.turtles.turtleList[turtle].running = true;

            if (this.inNoteBlock[turtle]) {
                this.whichNoteToCount[turtle] += this.inNoteBlock[turtle].length;
            }

            this._runFromBlockNow(this, turtle, cblk, true, actionArgs, this.turtles.turtleList[turtle].queue.length);

            var returnValue = rationalSum(this.notesPlayed[turtle], [-saveNoteCount[0], saveNoteCount[1]]);
            this.notesPlayed[turtle] = saveNoteCount;

            // Restore previous state
            this.boxes = JSON.parse(saveBoxes);
            this.turtleHeaps[turtle] = JSON.parse(saveTurtleHeaps);

            this.turtles.turtleList[turtle].doPenUp();
            this.turtles.turtleList[turtle].doSetXY(saveX, saveY);
            this.turtles.turtleList[turtle].color = saveColor;
            this.turtles.turtleList[turtle].value = saveValue;
            this.turtles.turtleList[turtle].chroma = saveChroma;
            this.turtles.turtleList[turtle].stroke = saveStroke;
            this.turtles.turtleList[turtle].canvasAlpha = saveCanvasAlpha;
            this.turtles.turtleList[turtle].doSetHeading(saveOrientation);
            this.turtles.turtleList[turtle].penState = savePenState;

            this.previousTurtleTime[turtle] = savePrevTurtleTime;
            this.turtleTime[turtle] = saveTurtleTime;

            this.whichNoteToCount[turtle] = saveWhichNoteToCount;

            this.justCounting[turtle].pop();
            this.suppressOutput[turtle] = saveSuppressStatus;

            this.butNotThese[turtle] = {};
        }

        return returnValue;
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

        // Check to see if min is > max.
        if (a > b) {
            var c = a;
            a = b;
            b = c;
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

    this.hideBlocks = function (show) {
        // Hide all the blocks.
        this.blocks.palettes.hide();
        this.blocks.hide();
        this.refreshCanvas();
        this.showBlocksAfterRun = show !== undefined && show;
    };

    this.showBlocks = function () {
        // Show all the blocks.
        this.blocks.palettes.show();
        this.blocks.show();
        this.blocks.bringToTop();
        this.refreshCanvas();
    };

    this._calculateInvert = function (turtle, note, octave) {
        var delta = 0;
        var len = this.invertList[turtle].length;
        var note1 = getNote(note, octave, 0, this.keySignature[turtle], this.moveable[turtle], null, this.errorMsg);
        var num1 = pitchToNumber(note1[0], note1[1], this.keySignature[turtle]) - this.pitchNumberOffset[turtle];

        for (var i = len - 1; i > -1; i--) {
            var note2 = getNote(this.invertList[turtle][i][0], this.invertList[turtle][i][1], 0, this.keySignature[turtle], this.moveable[turtle], null, this.errorMsg);
            var num2 = pitchToNumber(note2[0], note2[1], this.keySignature[turtle]) - this.pitchNumberOffset[turtle];
            if (this.invertList[turtle][i][2] === 'even') {
                delta += num2 - num1;
                num1 += 2 * delta;
            } else if (this.invertList[turtle][i][2] === 'odd') {
                delta += num2 - num1 + 0.5;
                num1 += 2 * delta;
            } else {
                // We need to calculate the scalar difference.
                var scalarSteps = this._scalarDistance(turtle, num2, num1);
                var note3 = this._addScalarTransposition(turtle, note2[0], note2[1], -scalarSteps);
                var num3 = pitchToNumber(note3[0], note3[1], this.keySignature[turtle]) - this.pitchNumberOffset[turtle];
                delta += (num3 - num1) / 2;
                num1 = num3;
            }
        }

        return delta;
    };

    this._addScalarTransposition = function (turtle, note, octave, n) {
        if (n > 0) {
            var noteObj = getNote(note, octave, 0, this.keySignature[turtle], this.moveable[turtle], null, this.errorMsg);

            for (var i = 0; i < n; i++) {
                var value = getStepSizeUp(this.keySignature[turtle], noteObj[0]);
                noteObj = getNote(noteObj[0], noteObj[1], value, this.keySignature[turtle], this.moveable[turtle], null, this.errorMsg);
            }

        } else if (n < 0) {
            var noteObj = getNote(note, octave, 0, this.keySignature[turtle], this.moveable[turtle], null, this.errorMsg);

            for (var i = 0; i < -n; i++) {
                var value = getStepSizeDown(this.keySignature[turtle], noteObj[0]);
                noteObj = getNote(noteObj[0], noteObj[1], value, this.keySignature[turtle], this.moveable[turtle], null, this.errorMsg);
            }
        } else {
            var noteObj = [note, octave];
        }

        return noteObj;
    };

    this._scalarDistance = function (turtle, firstNote, lastNote) {
        // Rather than just counting the semitones, we need to count
        // the steps in the current key needed to get from firstNote pitch
        // to lastNote pitch.

        if (lastNote === firstNote) {
            return 0;
        } else if (lastNote > firstNote) {
            var noteObj = numberToPitch(firstNote + this.pitchNumberOffset[turtle]);
            var i = 0;
            var n = firstNote + this.pitchNumberOffset[turtle];
            while (i < 100) {
                n += getStepSizeUp(this.keySignature[turtle], noteObj[0]);
                i += 1;
                if (n >= lastNote + this.pitchNumberOffset[turtle]) {
                    break;
                }

                noteObj = numberToPitch(n);
            }

            return i;
        } else {
            var noteObj = numberToPitch(lastNote + this.pitchNumberOffset[turtle]);
            var i = 0;
            var n = lastNote + this.pitchNumberOffset[turtle];
            while (i < 100) {
                n += getStepSizeUp(this.keySignature[turtle], noteObj[0]);
                i += 1;
                if (n >= firstNote + this.pitchNumberOffset[turtle]) {
                    break;
                }

                noteObj = numberToPitch(n);
            }

            return -i;
        }
    };

    this._prepSynths = function () {
        // Prep synths for each turtle.
        for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
            if (!(turtle in instruments)) {
                instruments[turtle] = {};
                instrumentsFilters[turtle] = {};
                instrumentsEffects[turtle] = {};
            }

            // Make sure there is a default synth for each turtle
            if (!('default' in instruments[turtle])) {
                this.synth.createDefaultSynth(turtle);
            }

            // Copy any preloaded synths from the default turtle
            for (var instrumentName in instruments[0]) {
                if (!(instrumentName in instruments[turtle])) {
                    this.synth.loadSynth(turtle, instrumentName);

                    // Copy any filters
                    if (instrumentName in instrumentsFilters[0]) {
                        instrumentsFilters[turtle][instrumentName] = instrumentsFilters[0][instrumentName];
                    }

                    // and any effects
                    if (instrumentName in instrumentsEffects[0]) {
                        instrumentsEffects[turtle][instrumentName] = instrumentsEffects[0][instrumentName];
                    }
                }
            }

            this.synthVolume[turtle] = {'default': [DEFAULTVOLUME],
                                        'noise1': [DEFAULTVOLUME],
                                        'noise2': [DEFAULTVOLUME],
                                        'noise3': [DEFAULTVOLUME]};
        }

        if (!this.suppressOutput[turtle]) {
            this._setMasterVolume(DEFAULTVOLUME);
            for (var turtle = 0; turtle < this.turtles.turtleList.length; turtle++) {
                for (var synth in this.synthVolume[turtle]) {
                    this.setSynthVolume(turtle, synth, DEFAULTVOLUME);
                }
            }
        }
    };

    this.clearNoteParams = function (turtle, blk, drums) {
        this.oscList[turtle][blk] = [];
        this.noteBeat[turtle][blk] = [];
        this.noteBeatValues[turtle][blk] = [];
        this.noteValue[turtle][blk] = null;
        this.notePitches[turtle][blk] = [];
        this.noteOctaves[turtle][blk] = [];
        this.noteCents[turtle][blk] = [];
        this.noteHertz[turtle][blk] = [];
        this.embeddedGraphics[turtle][blk] = [];
        if (drums !== null) {
            this.noteDrums[turtle][blk] = drums;
        } else {
            this.noteDrums[turtle][blk] = [];
        }
    };

    this.updateNotation = function (note, duration, turtle, insideChord, drum, split) {
        if (this.optimize) {
            return;
        }

        // Note: At this point, the note of duration "duration" has
        // already been added to notesPlayed.

        // Don't split the note if we are already splitting the note.
        if (split == undefined) {
            split = true;
        }

        // Check to see if this note straddles a measure boundary.
        var durationTime = 1 / duration;
        var beatsIntoMeasure = (((this.notesPlayed[turtle][0] / this.notesPlayed[turtle][1] - this.pickup[turtle] - (durationTime)) * this.noteValuePerBeat[turtle]) % this.beatsPerMeasure[turtle]);
        var timeIntoMeasure = beatsIntoMeasure / this.noteValuePerBeat[turtle];
        var timeLeftInMeasure = (this.beatsPerMeasure[turtle] / this.noteValuePerBeat[turtle]) - timeIntoMeasure;

        if (split && durationTime > timeLeftInMeasure) {
            var d = durationTime - timeLeftInMeasure;
            var d2 = timeLeftInMeasure;        
            var b = this.beatsPerMeasure[turtle] / this.noteValuePerBeat[turtle];
            console.log('splitting note across measure boundary.');
            var obj = rationalToFraction(d);

            if (d2 > 0) {
                // Check to see if the note straddles multiple measures.
                var i = 0;
                while (d2 > b) {
                    i += 1;
                    d2 -= b;
                }

                var obj2 = rationalToFraction(d2);
                this.updateNotation(note, obj2[1] / obj2[0], turtle, insideChord, drum, false);
                if (i > 0 || obj[0] > 0) {
                    if (note[0] !== 'R') {  // Don't tie rests
                        this.notationInsertTie(turtle);
                        this.notationDrumStaging[turtle].push('tie');
                    }
                    var obj2 = rationalToFraction(1 / b);
                }

                // Add any measures we straddled.
                while (i > 0) {
                    i -= 1;
                    this.updateNotation(note, obj2[1] / obj2[0], turtle, insideChord, drum, false);
                    if (obj[0] > 0) {
                        if (note[0] !== 'R') {  // Don't tie rests
                            this.notationInsertTie(turtle);
                            this.notationDrumStaging[turtle].push('tie');
                        }
                    }
                }
            }

            if (obj[0] > 0) {
                this.updateNotation(note, obj[1] / obj[0], turtle, insideChord, drum, false);
            }

            return;
        }

        // Otherwise proceed as normal.
        var obj = durationToNoteValue(duration);

        // Deprecated
        if (this.turtles.turtleList[turtle].drum) {
            note = 'c2';
        }

        this.notationStaging[turtle].push([note, obj[0], obj[1], obj[2], obj[3], insideChord, this.staccato[turtle].length > 0 && last(this.staccato[turtle]) > 0]);

        // If no drum is specified, add a rest to the drum
        // line. Otherwise, add the drum.
        if (drum.length === 0) {
            this.notationDrumStaging[turtle].push([['R'], obj[0], obj[1], obj[2], obj[3], insideChord, false]);
        } else {
            var drumSymbol = getDrumSymbol(drum[0]);
            this.notationDrumStaging[turtle].push([[drumSymbol], obj[0], obj[1], obj[2], obj[3], insideChord, false]);
        }

        this.pickupPoint[turtle] = null;

        if (this.markup[turtle].length > 0) {
            var markup = '';
            for (var i = 0; i < this.markup[turtle].length; i++) {
                markup += this.markup[turtle][i];
                if (i < this.markup[turtle].length - 1) {
                    markup += ' ';
                }
            }

            this.notationMarkup(turtle, markup, true);
            this.markup[turtle] = [];
        }

        if (typeof(note) === 'number') {
            this.notationMarkup(turtle, toFixed2(note), false);
        }
    };

    this.notationVoices = function (turtle, arg) {
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

        this.pickupPoint[turtle] = null;
    }

    this.notationMarkup = function (turtle, markup, below) {
        if (below) {
            this.notationStaging[turtle].push('markdown', markup);
        } else {
            this.notationStaging[turtle].push('markup', markup);
        }

        this.pickupPoint[turtle] = null;
    };

    this.notationKey = function (turtle, key, mode) {
        this.notationStaging[turtle].push('key', key, mode);
        this.pickupPoint[turtle] = null;
    };

    this.notationMeter = function (turtle, count, value) {
        if (this.pickupPoint[turtle] != null) {
            // Lilypond prefers meter to be before partials.
            var d = this.notationStaging[turtle].length - this.pickupPoint[turtle];
            var pickup = [];
            for (var i = 0; i < d; i++) {
                pickup.push(this.notationStaging[turtle].pop());
            }

            this.notationStaging[turtle].push('meter', count, value);
            for (var i = 0; i < d; i++) {
                this.notationStaging[turtle].push(pickup.pop());
            }
        } else {
            this.notationStaging[turtle].push('meter', count, value);
        }

        this.pickupPoint[turtle] = null;
    };

    this.notationSwing = function (turtle) {
        this.notationStaging[turtle].push('swing');
    };

    this.notationTempo = function (turtle, bpm, beatValue) {
        var beat = convertFactor(beatValue);
        if (beat !== null) {
            this.notationStaging[turtle].push('tempo', bpm, beat);
        } else {
            obj = rationalToFraction(factor);
            this.errorMsg(_('Lilypond cannot process tempo of ') + obj[0] + '/' + obj[1] + ' = ' + bpm);
        }
    };

    this.notationPickup = function (turtle, factor) {
        if (factor === 0) {
            console.log('ignoring pickup of 0');
            return;
        }

        var pickupPoint = this.notationStaging[turtle].length;

        // Lilypond partial must be a combination of powers of two.
        var partial =  1 / factor;
        var beat = convertFactor(factor);
        if (beat !== null) {
            this.notationStaging[turtle].push('pickup', beat);
            this.pickupPOW2[turtle] = true;
        } else {
            if (this.runningLilypond) {
                obj = rationalToFraction(factor);
                this.errorMsg(_('Lilypond cannot process pickup of ') + obj[0] + '/' + obj[1]);
            }

            obj = rationalToFraction(1 - factor);
            for (var i = 0; i < obj[0]; i++) {
                this.updateNotation(['R'], obj[1], turtle, false, '');
            }
        }

        this.pickupPoint[turtle] = pickupPoint;
    };

    this.notationHarmonic = function (turtle) {
        this.notationStaging.push('harmonic');
        this.pickupPoint[turtle] = null;
    };

    this.notationLineBreak = function (turtle) {
        // this.notationStaging[turtle].push('break');
        this.pickupPoint[turtle] = null;
    };

    this.notationBeginArticulation = function (turtle) {
        this.notationStaging[turtle].push('begin articulation');
        this.pickupPoint[turtle] = null;
    };

    this.notationEndArticulation = function (turtle) {
        this.notationStaging[turtle].push('end articulation');
        this.pickupPoint[turtle] = null;
    };

    this.notationBeginCrescendo = function (turtle, factor) {
        if (factor > 0) {
            this.notationStaging[turtle].push('begin crescendo');
        } else {
            this.notationStaging[turtle].push('begin decrescendo');
        }

        this.pickupPoint[turtle] = null;
    };

    this.notationEndCrescendo = function (turtle, factor) {
        if (factor > 0) {
            this.notationStaging[turtle].push('end crescendo');
        } else {
            this.notationStaging[turtle].push('end decrescendo');
        }

        this.pickupPoint[turtle] = null;
    };

    this.notationBeginSlur = function (turtle) {
        this.notationStaging[turtle].push('begin slur');
        this.pickupPoint[turtle] = null;
    };

    this.notationEndSlur = function (turtle) {
        this.notationStaging[turtle].push('end slur');
        this.pickupPoint[turtle] = null;
    };

    this.notationInsertTie = function (turtle) {
        this.notationStaging[turtle].push('tie');
        this.pickupPoint[turtle] = null;
    };

    this.notationRemoveTie = function (turtle) {
        this.notationStaging[turtle].pop();
        this.pickupPoint[turtle] = null;
    };

    this.notationBeginHarmonics = function (turtle) {
        this.notationStaging[turtle].push('begin harmonics');
        this.pickupPoint[turtle] = null;
    };

    this.notationEndHarmonics = function (turtle) {
        this.notationStaging[turtle].push('end harmonics');
        this.pickupPoint[turtle] = null;
    };
};
