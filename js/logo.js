// Copyright (c) 2014-2020 Walter Bender
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
const PREVIEWVOLUME = 80;
const TONEBPM = 240; // Seems to be the default.
const TARGETBPM = 90; // What we'd like to use for beats per minute
const DEFAULTDELAY = 500; // milleseconds
const TURTLESTEP = -1; // Run in step-by-step mode
const NOTEDIV = 8; // Number of steps to divide turtle graphics
const OSCVOLUMEADJUSTMENT = 1.5; // The oscillator runs hot. We
// must scale back its volume.

const NOMICERRORMSG = "The microphone is not available.";
const NANERRORMSG = "Not a number.";
const NOSTRINGERRORMSG = "Not a string.";
const NOBOXERRORMSG = "Cannot find box";
const NOACTIONERRORMSG = "Cannot find action.";
const NOINPUTERRORMSG = "Missing argument.";
const NOSQRTERRORMSG = "Cannot take square root of negative number.";
const ZERODIVIDEERRORMSG = "Cannot divide by zero.";
const EMPTYHEAPERRORMSG = "empty heap.";
const INVALIDPITCH = _("Not a valid pitch name");
const POSNUMBER = "Argument must be a positive number";

const NOTATIONNOTE = 0;
const NOTATIONDURATION = 1;
const NOTATIONDOTCOUNT = 2;
const NOTATIONTUPLETVALUE = 3;
const NOTATIONROUNDDOWN = 4;
const NOTATIONINSIDECHORD = 5; // deprecated
const NOTATIONSTACCATO = 6;

function Logo() {
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
    this.musicKeyboard = null;
    this.modeWidget = null;
    this.meterWidget = null;
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
    this.returns = {};
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

    this.lastNoteTimeout = null;
    this.alreadyRunning = false;
    this.prematureRestart = false;
    this.runningBlock = null;
    this.ignoringBlock = null;

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
    if (beginnerMode) {
        this.optimize = true;
    } else {
        this.optimize = false;
    }

    // Widget-related attributes
    this.showPitchDrumMatrix = false;
    this.inPitchDrumMatrix = false;
    this.inRhythmRuler = false;
    this.rhythmRulerMeasure = null;
    this.inPitchStaircase = false;
    this.inTempo = false;
    this.inPitchSlider = false;
    this.inMusicKeyboard = false;
    this._currentDrumlock = null;
    this.inTimbre = false;
    this.insideModeWidget = false;
    this.insideMeterWidget = false;
    this.insideTemperament = false;
    this.inSetTimbre = {};

    //rhythm ruler data 
    this.Rhythm_Rulers = [];
    this.Rhythm_Drums = [];
    this.loadRhythmData = true;

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
    this.pitchNumberOffset = []; // 39, C4
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
    this.intervals = {}; // relative interval (based on scale degree)
    this.semitoneIntervals = {}; // absolute interval (based on semitones)
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
    this.notationOutput = "";
    this.notationNotes = {};
    this.pickupPOW2 = {};
    this.pickupPoint = {};
    this.runningLilypond = false;
    this.runningAbc = false;
    this.runningMxml = false;
    this.checkingCompletionState = false;
    this.compiling = false;
    this.recording = false;
    this.lastNote = {};
    this.restartPlayback = true;

    //variables for progress bar
    this.progressBar = docById("myBar");
    this.progressBarWidth = 0;
    this.progressBarDivision;

    this.temperamentSelected = [];
    this.customTemperamentDefined = false;

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

    // Things we tweak to optimize performance
    // this.blinkState = !this.optimize;
    this.blinkState = true;
    if (this.optimize) {
        // createjs.Ticker.framerate = 10;
    } else {
        // createjs.Ticker.framerate = 30;
    }

    if (_THIS_IS_MUSIC_BLOCKS_) {
        // Load the default synthesizer
        this.synth = new Synth();
        this.synth.changeInTemperament = false;
    } else {
        this.turtleOscs = {};
    }

    // Mode widget
    this._modeBlock = null;

    // Meter widget
    this._meterBlock = null;
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

    this.svgOutput = "";
    this.svgBackground = true;

    this.mic = null;
    this.volumeAnalyser = null;
    this.pitchAnalyser = null;

    /**
     * Switches optimize mode on if state, off otherwise.
     * @privileged
     * @param   {boolean}   state  An object representing a state.
     * @returns {void}
     */
    this.setOptimize = function(state) {
        if (state) {
            // this.errorMsg(_('Turning off mouse blink; setting FPS to 10.'));
            // createjs.Ticker.framerate = 10;
            this.optimize = true;
        } else {
            // this.errorMsg(_('Turning on mouse blink; setting FPS to 30.'));
            // createjs.Ticker.framerate = 10; // 30;
            this.optimize = false;
        }

        // this.blinkState = !state;
        this.blinkState = true;
    };

    /**
     * Sets the setPlaybackStatus property.
     * @privileged
     * @param   {Function}  setPlaybackStatus
     * @returns {this}
     */
    this.setSetPlaybackStatus = function(setPlaybackStatus) {
        this.setPlaybackStatus = setPlaybackStatus;
        return this;
    };

    /**
     * Sets the canvas property.
     * @privileged
     * @param   canvas
     * @returns {this}
     */
    this.setCanvas = function(canvas) {
        this.canvas = canvas;
        return this;
    };

    /**
     * Sets all the blocks.
     * @privileged
     * @param   blocks
     * @returns {this}
     */
    this.setBlocks = function(blocks) {
        this.blocks = blocks;
        return this;
    };

    /**
     * Sets all the turtles.
     * @privileged
     * @param   turtles
     * @returns {this}
     */
    this.setTurtles = function(turtles) {
        this.turtles = turtles;
        return this;
    };

    /**
     * Sets the stage.
     * @privileged
     * @param   stage
     * @returns {this}
     */
    this.setStage = function(stage) {
        this.stage = stage;
        return this;
    };

    /**
     * Sets the refreshCanvas property.
     * @privileged
     * @param   {Function}  refreshCanvas
     * @returns {this}
     */
    this.setRefreshCanvas = function(refreshCanvas) {
        this.refreshCanvas = refreshCanvas;
        return this;
    };

    /**
     * Sets the textMsg property.
     * @privileged
     * @param   {Function}  textMsg A function to produce a text message using exactly one string.
     * @returns {this}
     */
    this.setTextMsg = function(textMsg) {
        this.textMsg = textMsg;
        return this;
    };

    /**
     * Sets the hideMsgs property.
     * @privileged
     * @param   {Function}  hideMsgs
     * @returns {this}
     */
    this.setHideMsgs = function(hideMsgs) {
        this.hideMsgs = hideMsgs;
        return this;
    };

    /**
     * Sets the errorMsg property.
     * @privileged
     * @param   {Function}  errorMsg    A function to produce an error message using at least a string.
     * @returns {this}
     */
    this.setErrorMsg = function(errorMsg) {
        this.errorMsg = errorMsg;
        return this;
    };

    /**
     * Sets the onStopTurtle property.
     * @privileged
     * @param   {Function}  onStopTurtle
     * @returns {this}
     */
    this.setOnStopTurtle = function(onStopTurtle) {
        this.onStopTurtle = onStopTurtle;
        return this;
    };

    /**
     * Sets the onRunTurtle property.
     * @privileged
     * @param   {Function}  onRunTurtle
     * @returns {this}
     */
    this.setOnRunTurtle = function(onRunTurtle) {
        this.onRunTurtle = onRunTurtle;
        return this;
    };

    /**
     * Sets the getStageX property.
     * @privileged
     * @param   {Function}  getStageX
     * @returns {this}
     */
    this.setGetStageX = function(getStageX) {
        this.getStageX = getStageX;
        return this;
    };

    /**
     * Sets the getStageY property.
     * @privileged
     * @param   {Function}  getStageY
     * @returns {this}
     */
    this.setGetStageY = function(getStageY) {
        this.getStageY = getStageY;
        return this;
    };

    /**
     * Sets the getStageMouseDown property.
     * @privileged
     * @param   {Function}  getStageMouseDown
     * @returns {this}
     */
    this.setGetStageMouseDown = function(getStageMouseDown) {
        this.getStageMouseDown = getStageMouseDown;
        return this;
    };

    /**
     * Sets the getCurrentKeyCode property.
     * @privileged
     * @param   {Function}  getCurrentKeyCode
     * @returns {this}
     */
    this.setGetCurrentKeyCode = function(getCurrentKeyCode) {
        this.getCurrentKeyCode = getCurrentKeyCode;
        return this;
    };

    /**
     * Sets the clearCurrentKeyCode property.
     * @privileged
     * @param   {Function}  clearCurrentKeyCode
     * @returns {this}
     */
    this.setClearCurrentKeyCode = function(clearCurrentKeyCode) {
        this.clearCurrentKeyCode = clearCurrentKeyCode;
        return this;
    };

    /**
     * Sets the meSpeak property.
     * @privileged
     * @param   meSpeak    An object with a speak method that takes a string.
     * @returns {this}
     */
    this.setMeSpeak = function(meSpeak) {
        this.meSpeak = meSpeak;
        return this;
    };

    /**
     * Sets the saveLocally property.
     * @privileged
     * @param   {Function}  saveLocally
     * @returns {this}
     */
    this.setSaveLocally = function(saveLocally) {
        this.saveLocally = saveLocally;
        return this;
    };

    /**
     * Sets the pause between each block as the program executes.
     * @privileged
     * @param   {number}    turtleDelay
     * @returns {void}
     */
    this.setTurtleDelay = function(turtleDelay) {
        this.turtleDelay = turtleDelay;
        this.noteDelay = 0;
    };

    /**
     * Sets the pause between each note as the program executes.
     * @privileged
     * @param   {number}    noteDelay
     * @returns {void}
     */
    this.setNoteDelay = function(noteDelay) {
        this.noteDelay = noteDelay;
        this.turtleDelay = 0;
    };

    /**
     * Takes one step for each turtle in excuting Logo commands.
     * @privileged
     * @returns {void}
     */
    this.step = function() {
        for (var turtle in this.stepQueue) {
            if (this.stepQueue[turtle].length > 0) {
                if (
                    turtle in this.unhighlightStepQueue &&
                    this.unhighlightStepQueue[turtle] != null
                ) {
                    if (this.blocks.visible) {
                        this.blocks.unhighlight(
                            this.unhighlightStepQueue[turtle]
                        );
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

    /**
     * Steps through one note for each turtle in excuting Logo commands, but runs through other blocks at full speed.
     * @privileged
     * @returns {void}
     */
    this.stepNote = function() {
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
                    if (
                        turtle in that.unhighlightStepQueue &&
                        that.unhighlightStepQueue[turtle] != null
                    ) {
                        if (that.blocks.visible) {
                            that.blocks.unhighlight(
                                that.unhighlightStepQueue[turtle]
                            );
                        }
                        that.unhighlightStepQueue[turtle] = null;
                    }
                    var blk = that.stepQueue[turtle].pop();
                    if (blk != null && blk !== notesFinish[turtle]) {
                        var block = that.blocks.blockList[blk];
                        if (block.name === "newnote") {
                            tempStepQueue[turtle] = blk;
                            notesFinish[turtle] = last(block.connections);
                            if (notesFinish[turtle] == null) {
                                // end of flow
                                notesFinish[turtle] =
                                    last(
                                        that.turtles.turtleList[turtle].queue
                                    ) &&
                                    last(that.turtles.turtleList[turtle].queue)
                                        .blk;
                                // catch case of null - end of project
                            }
                            // that.playedNote[turtle] = true;
                            that.playedNoteTimes[turtle] =
                                that.playedNoteTimes[turtle] || 0;
                            thisNote[turtle] = Math.pow(
                                that.parseArg(
                                    that,
                                    turtle,
                                    block.connections[1],
                                    blk,
                                    that.receivedArg
                                ),
                                -1
                            );
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
                if (
                    that.stepQueue[turtle].length > 0 &&
                    !that.playedNote[turtle]
                ) {
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
        }
    };

    /**
     * Returns whether to record.
     * @privileged
     * @returns {boolean}
     */
    this.recordingStatus = function() {
        return (
            this.recording ||
            this.runningLilypond ||
            this.runningAbc ||
            this.runningMxml
        );
    };

    /**
     * The stop button was pressed. Stops the turtle and cleans up a few odds and ends.
     * @privileged
     * @returns {void}
     */
    this.doStopTurtle = function() {
        this.stopTurtle = true;
        this.turtles.markAsStopped();
        this.playbackTime = 0;

        for (var sound in this.sounds) {
            this.sounds[sound].stop();
        }

        this.sounds = [];

        if (_THIS_IS_MUSIC_BLOCKS_) {
            for (
                var turtle = 0;
                turtle < this.turtles.turtleList.length;
                turtle++
            ) {
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

        document.body.style.cursor = "default";
        if (this.showBlocksAfterRun) {
            console.debug("SHOW BLOCKS");
            this.showBlocks();
            document.getElementById("stop").style.color = "white";
        }

        this.showBlocksAfterRun = false;
    };

    /**
     * Restores any broken connections made in duplicate notes clamps.
     * @privileged
     * @returns {void}
     */
    this._restoreConnections = function() {
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

    /**
     * Clears all the blocks, updates the cache and refreshes the canvas.
     * @privileged
     * @returns {void}
     */
    this._clearParameterBlocks = function() {
        for (var blk = 0; blk < this.blocks.blockList.length; blk++) {
            if (
                this.blocks.blockList[blk].protoblock.parameter &&
                this.blocks.blockList[blk].text !== null
            ) {
                this.blocks.blockList[blk].text.text = "";
                this.blocks.blockList[blk].container.updateCache();
            }
        }
        this.refreshCanvas();
    };

    /**
     * Updates the label on parameter blocks.
     * @privileged
     * @param   {this}  that
     * @param   turtle
     * @param   blk
     * @returns {void}
     */
    this._updateParameterBlock = function(that, turtle, blk) {
        var logo = that; // For plugin backward compatibility
        var name = this.blocks.blockList[blk].name;

        if (
            this.blocks.blockList[blk].protoblock.parameter &&
            this.blocks.blockList[blk].text !== null
        ) {
            var value = 0;

            if (
                typeof that.blocks.blockList[blk].protoblock.updateParameter ===
                "function"
            ) {
                value = that.blocks.blockList[blk].protoblock.updateParameter(
                    that,
                    turtle,
                    blk
                );
            } else {
                if (name in this.evalParameterDict) {
                    eval(this.evalParameterDict[name]);
                } else {
                    return;
                }
            }

            if (typeof value === "string") {
                if (value.length > 6) {
                    value = value.substr(0, 5) + "...";
                }

                this.blocks.blockList[blk].text.text = value;
            } else if (name === "divide") {
                this.blocks.blockList[blk].text.text = mixedNumber(value);
            } else {
                this.blocks.blockList[blk].text.text = value.toString();
            }

            this.blocks.blockList[blk].container.updateCache();
            this.refreshCanvas();
        }
    };

    this.passRhythmData = function(rulers, drums) {
        console.debug(rulers);
        console.debug(drums);
        this.Rhythm_Rulers = rulers;
        this.Rhythm_Drums = drums;
        console.debug(this.inRhythmRuler);
    }

    this.initialiseRhythmRuler = function() {
        if(this.loadRhythmData) {
            this.rhythmRuler.Rulers = this.Rhythm_Rulers;
            this.rhythmRuler.Drums = this.Rhythm_Drums;
            this.inRhythmRuler = true;
            this.loadRhythmData = false;
        }
    }

    /**
     * Initialises the microphone.
     * @privileged
     * @returns {void}
     */
    this.initMediaDevices = function() {
        var that = this;
        console.debug("INIT MICROPHONE");
        if (_THIS_IS_MUSIC_BLOCKS_) {
            var mic = new Tone.UserMedia();
            try {
                mic.open();
            } catch (e) {
                console.debug("MIC NOT FOUND");
                console.debug(e.name + ": " + e.message);

                console.debug(mic);
                that.errorMsg(NOMICERRORMSG);
                mic = null;
            }

            this.mic = mic;
            this.limit = 1024;
        } else {
            try {
                this.mic = new p5.AudioIn();
                that.mic.start();
            } catch (e) {
                console.debug(e);
                this.errorMsg(NOMICERRORMSG);
                this.mic = null;
            }
        }
    };

    
    /**
     * Initialises a turtle.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.initTurtle = function(turtle) {
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
        this.keySignature[turtle] = "C " + "major";
        this.pushedNote[turtle] = false;
        this.oscList[turtle] = {};
        this.bpm[turtle] = [];
        this.inSetTimbre[turtle] = false;
        this.instrumentNames[turtle] = ["electronic synth"];
        this.inCrescendo[turtle] = [];
        this.crescendoDelta[turtle] = [];
        this.crescendoInitialVolume[turtle] = {
            "electronic synth": [DEFAULTVOLUME]
        };
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
        this.beatsPerMeasure[turtle] = 4; // Default is 4/4 time.
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
        this.suppressOutput[turtle] =
            this.runningLilypond ||
            this.runningAbc ||
            this.runningMxml ||
            this.compiling;
        this.moveable[turtle] = false;
        this.inNeighbor[turtle] = [];
        this.neighborStepPitch[turtle] = [];
        this.neighborNoteValue[turtle] = [];
        this.inHarmonic[turtle] = [];
        this.partials[turtle] = [];
        this.returns[turtle] = [];

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
            this._saveCanvasAlpha[turtle] = this.turtles.turtleList[
                turtle
            ].canvasAlpha;
            this._saveOrientation[turtle] = this.turtles.turtleList[
                turtle
            ].orientation;
            this._savePenState[turtle] = this.turtles.turtleList[
                turtle
            ].penState;
        }
    };

    /**
     * Runs Logo commands.
     * @privileged
     * @param   startHere   The index of a block to start from.
     * @param   env
     * @returns {void}
     */
    this.runLogoCommands = function(startHere, env) {
        this.prematureRestart = this.alreadyRunning;
        if (this.alreadyRunning && this.runningBlock !== null) {
            this.ignoringBlock = this.runningBlock;
            console.debug(this.alreadyRunning + " " + this.runningBlock);
        } else {
            this.ignoringBlock = null;
        }

        if (this.lastNoteTimeout != null) {
            console.debug("clearing lastNoteTimeout");
            clearTimeout(this.lastNoteTimeout);
            this.lastNoteTimeout = null;
        }

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
        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.synth.changeInTemperament = false;
        }

        this.checkingCompletionState = false;

        this.embeddedGraphicsFinished = {};

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this._prepSynths();
        }

        this.notationStaging = {};
        this.notationDrumStaging = {};

        // Each turtle needs to keep its own wait time and music
        // states.
        for (
            var turtle = 0;
            turtle < this.turtles.turtleList.length;
            turtle++
        ) {
            this.initTurtle(turtle);
        }

        this.inPitchDrumMatrix = false;
        this.inMatrix = false;
        this.inMusicKeyboard = false;
        this.inTimbre = false;
        this.inRhythmRuler = false;
        this.insideModeWidget = false;
        this.insideMeterWidget = false;
        this.insideTemperament = false;
        this.rhythmRulerMeasure = null;
        this._currentDrumBlock = null;
        this.inStatusMatrix = false;
        this.pitchBlocks = [];
        this.drumBlocks = [];
        this.tuplet = false;
        this._modeBlock = null;
        this._meterBlock = null;

        // Remove any listeners that might be still active
        for (
            var turtle = 0;
            turtle < this.turtles.turtleList.length;
            turtle++
        ) {
            for (var listener in this.turtles.turtleList[turtle].listeners) {
                this.stage.removeEventListener(
                    listener,
                    this.turtles.turtleList[turtle].listeners[listener],
                    false
                );
            }

            this.turtles.turtleList[turtle].listeners = {};
        }

        // Init the graphic state.
        for (
            var turtle = 0;
            turtle < this.turtles.turtleList.length;
            turtle++
        ) {
            this.turtles.turtleList[
                turtle
            ].container.x = this.turtles.turtleX2screenX(
                this.turtles.turtleList[turtle].x
            );
            this.turtles.turtleList[
                turtle
            ].container.y = this.turtles.turtleY2screenY(
                this.turtles.turtleList[turtle].y
            );
        }

        // Set up status block
        if (window.widgetWindows.isOpen("status")) {
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
            if (
                ["start", "drum", "status"].indexOf(
                    this.blocks.blockList[this.blocks.stackList[blk]].name
                ) !== -1
            ) {
                // Don't start on a start block in the trash.
                if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                    startBlocks.push(this.blocks.stackList[blk]);
                }
            } else if (
                this.blocks.blockList[this.blocks.stackList[blk]].name ===
                "action"
            ) {
                // Does the action stack have a name?
                var c = this.blocks.blockList[this.blocks.stackList[blk]]
                    .connections[1];
                var b = this.blocks.blockList[this.blocks.stackList[blk]]
                    .connections[2];
                if (c != null && b != null) {
                    // Don't use an action block in the trash.
                    if (
                        !this.blocks.blockList[this.blocks.stackList[blk]].trash
                    ) {
                        this.actions[this.blocks.blockList[c].value] = b;
                    }
                }
            }
        }

        this.svgOutput = "";
        this.svgBackground = true;

        for (
            var turtle = 0;
            turtle < this.turtles.turtleList.length;
            turtle++
        ) {
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
            console.debug("No start block... adding a turtle");
            this.turtles.addTurtle(null);
        }

        // And mark all turtles as not running.
        for (
            var turtle = 0;
            turtle < this.turtles.turtleList.length;
            turtle++
        ) {
            if (this.turtles.turtleList[turtle].running) {
                console.debug("already running...");
            }

            this.turtles.turtleList[turtle].running = false;
        }

        // (2) Execute the stack.
        // A bit complicated because we have lots of corner cases:
        if (startHere != null) {
            // If a block to start from was passed, find its
            // associated turtle, i.e., which turtle should we use?
            var turtle = 0;
            while (
                this.turtles.turtleList[turtle].trash &&
                turtle < this.turtles.turtleList.length
            ) {
                turtle += 1;
            }

            if (
                ["start", "drum"].indexOf(
                    this.blocks.blockList[startHere].name
                ) !== -1
            ) {
                turtle = this.blocks.blockList[startHere].value;
            }

            this.turtles.turtleList[turtle].queue = [];
            this.parentFlowQueue[turtle] = [];
            this.unhighlightQueue[turtle] = [];
            this.parameterQueue[turtle] = [];

            if (this.turtles.turtleList[turtle].running) {
                console.debug("already running...");
            }

            this.turtles.turtleList[turtle].running = true;
            this._runFromBlock(this, turtle, startHere, 0, env);
        } else if (startBlocks.length > 0) {
            var delayStart = 0;
            // Look for a status block
            for (var b = 0; b < startBlocks.length; b++) {
                if (
                    this.blocks.blockList[startBlocks[b]].name === "status" &&
                    !this.blocks.blockList[startBlocks[b]].trash
                ) {
                    var turtle = 0;
                    this.turtles.turtleList[turtle].queue = [];
                    this.parentFlowQueue[turtle] = [];
                    this.unhighlightQueue[turtle] = [];
                    this.parameterQueue[turtle] = [];

                    if (this.turtles.turtleList[turtle].running) {
                        console.debug("already running...");
                    }

                    this.turtles.turtleList[turtle].running = true;
                    delayStart = 250;
                    this._runFromBlock(this, turtle, startBlocks[b], 0, env);
                }
            }

            var that = this;

            setTimeout(function() {
                if (delayStart !== 0) {
                    // Launching status block would have hidden the
                    // Stop Button so show it again.
                    that.onRunTurtle();
                }

                // If there are start blocks, run them all.
                for (var b = 0; b < startBlocks.length; b++) {
                    if (
                        that.blocks.blockList[startBlocks[b]].name !== "status"
                    ) {
                        var turtle =
                            that.blocks.blockList[startBlocks[b]].value;
                        that.turtles.turtleList[turtle].queue = [];
                        that.parentFlowQueue[turtle] = [];
                        that.unhighlightQueue[turtle] = [];
                        that.parameterQueue[turtle] = [];
                        if (!that.turtles.turtleList[turtle].trash) {
                            if (that.turtles.turtleList[turtle].running) {
                                console.debug("already running...");
                            }

                            that.turtles.turtleList[turtle].running = true;
                            that._runFromBlock(
                                that,
                                turtle,
                                startBlocks[b],
                                0,
                                env
                            );
                        }
                    }
                }
            }, delayStart);
        } else {
            console.debug(
                "Empty start block: " +
                    turtle +
                    " " +
                    this.suppressOutput[turtle]
            );
            if (
                this.suppressOutput[turtle] ||
                this.suppressOutput[turtle] == undefined
            ) {
                // this.errorMsg(NOACTIONERRORMSG, null, _('start'));
                this.suppressOutput[turtle] = false;
                this.checkingCompletionState = false;
                // Reset cursor.
                document.body.style.cursor = "default";
            }
        }

        this.refreshCanvas();
    };

    /**
     * Runs from a single block.
     * @privileged
     * @param   {this}  that
     * @param   turtle
     * @param   blk
     * @param   isflow
     * @param   receivedArg
     * @returns {void}
     */
    this._runFromBlock = function(that, turtle, blk, isflow, receivedArg) {
        this.runningBlock = blk;
        if (blk == null) return;

        var logo = that; // For plugin backward compatibility

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
                setTimeout(function() {
                    that._runFromBlockNow(
                        that,
                        turtle,
                        blk,
                        isflow,
                        receivedArg
                    );
                }, delay);
            }
        }
    };

    /**
     * Changes a property according to a block name and a value.
     * @privileged
     * @param   blk
     * @param   value
     * @param   turtle
     * @returns {void}
     */
    this._blockSetter = function(blk, value, turtle) {
        if (
            typeof this.blocks.blockList[blk].protoblock.setter === "function"
        ) {
            this.blocks.blockList[blk].protoblock.setter(
                this,
                value,
                turtle,
                blk
            );
        } else {
            if (this.blocks.blockList[blk].name in this.evalSetterDict) {
                eval(this.evalSetterDict[this.blocks.blockList[blk].name]);
            } else {
                this.errorMsg(_("Block does not support incrementing."), blk);
            }
        }
    };

    /**
     * Runs a stack of blocks, beginning with blk.
     * @privileged
     * @param   {this}  that
     * @param   turtle
     * @param   blk
     * @param   isflow
     * @param   receivedArg
     * @param   {number}    queueStart  Optional.
     * @returns {void}
     */
    this._runFromBlockNow = function(
        that,
        turtle,
        blk,
        isflow,
        receivedArg,
        queueStart
    ) {
        ///////
        this.alreadyRunning = true;
        ///////
        // Run a stack of blocks, beginning with blk.
        var logo = that; // For plugin backward compatibility
        this.receivedArg = receivedArg;

        // Sometimes we don't want to unwind the entire queue.
        if (queueStart === undefined) queueStart = 0;

        // (1) Evaluate any arguments (beginning with connection[1]);
        var args = [];
        if (that.blocks.blockList[blk].protoblock.args > 0) {
            for (
                var i = 1;
                i < that.blocks.blockList[blk].protoblock.args + 1;
                i++
            ) {
                if (
                    that.blocks.blockList[blk].protoblock.dockTypes[i] === "in"
                ) {
                    if (that.blocks.blockList[blk].connections[i] == null) {
                        console.debug("skipping inflow args");
                    } else {
                        args.push(that.blocks.blockList[blk].connections[i]);
                    }
                } else {
                    args.push(
                        that.parseArg(
                            that,
                            turtle,
                            that.blocks.blockList[blk].connections[i],
                            blk,
                            receivedArg
                        )
                    );
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
                if (
                    that.blocks.blockList[last(that.backward[turtle])].name ===
                    "backward"
                ) {
                    var c = 1;
                } else {
                    var c = 2;
                }

                if (
                    !that.blocks.sameGeneration(
                        that.blocks.blockList[last(that.backward[turtle])]
                            .connections[c],
                        blk
                    )
                ) {
                    var nextFlow = last(that.blocks.blockList[blk].connections);
                } else {
                    var nextFlow = that.blocks.blockList[blk].connections[0];
                    if (
                        that.blocks.blockList[nextFlow].name === "action" ||
                        that.blocks.blockList[nextFlow].name === "backward"
                    ) {
                        nextFlow = null;
                    } else {
                        if (
                            !that.blocks.sameGeneration(
                                that.blocks.blockList[
                                    last(that.backward[turtle])
                                ].connections[c],
                                nextFlow
                            )
                        ) {
                            var nextFlow = last(
                                that.blocks.blockList[blk].connections
                            );
                        } else {
                            var nextFlow =
                                that.blocks.blockList[blk].connections[0];
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
            if (nextFlow != null) {
                // This could be the last block
                that.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }

        // Some flow blocks have childflows, e.g., repeat.
        var childFlow = null;
        var childFlowCount = 0;
        var actionArgs = [];

        if (that.blocks.visible) {
            if (
                !that.suppressOutput[turtle] &&
                that.justCounting[turtle].length === 0
            ) {
                that.blocks.highlight(blk, false);
            }
        }

        switch (that.blocks.blockList[blk].name) {
            // Deprecated
            case "beginhollowline":
                that.turtles.turtleList[turtle].doStartHollowLine();
                break;
            // Deprecated
            case "endhollowline":
                that.turtles.turtleList[turtle].doEndHollowLine();
                break;
            // &#x1D15D; &#x1D15E; &#x1D15F; &#x1D160; &#x1D161; &#x1D162; &#x1D163; &#x1D164;
            // deprecated
            case "wholeNote":
                that._processNote(1, blk, turtle);
                break;
            case "halfNote":
                that._processNote(2, blk, turtle);
                break;
            case "quarterNote":
                that._processNote(4, blk, turtle);
                break;
            case "eighthNote":
                that._processNote(8, blk, turtle);
                break;
            case "sixteenthNote":
                that._processNote(16, blk, turtle);
                break;
            case "thirtysecondNote":
                that._processNote(32, blk, turtle);
                break;
            case "sixtyfourthNote":
                that._processNote(64, blk, turtle);
                break;
            // Deprecated
            case "darbuka":
            case "clang":
            case "bottle":
            case "duck":
            case "snare":
            case "hihat":
            case "tom":
            case "kick":
            case "pluck":
            case "triangle1":
            case "slap":
            case "frogs":
            case "fingercymbals":
            case "cup":
            case "cowbell":
            case "splash":
            case "ridebell":
            case "floortom":
            case "crash":
            case "chine":
            case "dog":
            case "cat":
            case "clap":
            case "bubbles":
            case "cricket":
                that.drumStyle[turtle].push(that.blocks.blockList[blk].name);
                childFlow = args[0];
                childFlowCount = 1;

                var listenerName = "_drum_" + turtle;
                that._setDispatchBlock(blk, turtle, listenerName);

                var __listener = function(event) {
                    that.drumStyle[turtle].pop();
                };

                that._setListener(turtle, listenerName, __listener);
                break;
            // Deprecated P5 tone generator replaced by macro.
            case "tone2":
                if (_THIS_IS_TURTLE_BLOCKS_) {
                    if (typeof that.turtleOscs[turtle] === "undefined") {
                        that.turtleOscs[turtle] = new p5.TriOsc();
                    }

                    osc = that.turtleOscs[turtle];
                    osc.stop();
                    osc.start();
                    osc.amp(0);

                    osc.freq(args[0]);
                    osc.fade(0.5, 0.2);

                    setTimeout(
                        function(osc) {
                            osc.fade(0, 0.2);
                        },
                        args[1],
                        osc
                    );
                }
                break;
            // Deprecated
            case "playfwd":
                that.pitchTimeMatrix.playDirection = 1;
                that._runFromBlock(that, turtle, args[0]);
                break;
            // Deprecated
            case "playbwd":
                that.pitchTimeMatrix.playDirection = -1;
                that._runFromBlock(that, turtle, args[0]);
                break;
            default:
                if (
                    typeof that.blocks.blockList[blk].protoblock.flow ===
                    "function"
                ) {
                    let res = that.blocks.blockList[blk].protoblock.flow(
                        args,
                        that,
                        turtle,
                        blk,
                        receivedArg,
                        actionArgs,
                        isflow
                    );
                    if (res) {
                        let [cf, cfc, ret] = res;
                        if (cf !== undefined) childFlow = cf;
                        if (cfc !== undefined) childFlowCount = cfc;
                        if (ret) return ret;
                    }
                } else if (
                    that.blocks.blockList[blk].name in that.evalFlowDict
                ) {
                    eval(that.evalFlowDict[that.blocks.blockList[blk].name]);
                } else {
                    // Could be an arg block, so we need to print its value.
                    if (
                        that.blocks.blockList[blk].isArgBlock() ||
                        [
                            "anyout",
                            "numberout",
                            "textout",
                            "booleanout"
                        ].indexOf(
                            that.blocks.blockList[blk].protoblock.dockTypes[0]
                        ) !== -1
                    ) {
                        args.push(
                            that.parseArg(that, turtle, blk, that.receievedArg)
                        );
                        if (that.blocks.blockList[blk].value == null) {
                            that.textMsg("null block value");
                        } else {
                            that.textMsg(
                                that.blocks.blockList[blk].value.toString()
                            );
                        }
                    } else {
                        that.errorMsg(
                            "I do not know how to " +
                                that.blocks.blockList[blk].name +
                                ".",
                            blk
                        );
                    }
                    that.stopTurtle = true;
                }
                break;
        }

        // (3) Queue block below the current block.

        // Is the block in a queued clamp?
        if (blk !== that.ignoringBlock) {
            if (blk in that.endOfClampSignals[turtle]) {
                var n = that.endOfClampSignals[turtle][blk].length;
                for (var i = 0; i < n; i++) {
                    var signal = that.endOfClampSignals[turtle][blk].pop();
                    if (signal != null) {
                        that.stage.dispatchEvent(signal);
                    }
                }
            }
        } else {
            console.debug("Ignoring block on overlapped start.");
        }

        if (
            that.statusMatrix &&
            that.statusMatrix.isOpen &&
            !that.inStatusMatrix
        ) {
            that.statusMatrix.updateAll();
        }

        // If there is a child flow, queue it.
        if (childFlow != null) {
            if (
                that.blocks.blockList[blk].name === "doArg" ||
                that.blocks.blockList[blk].name === "nameddoArg"
            ) {
                var queueBlock = new Queue(
                    childFlow,
                    childFlowCount,
                    blk,
                    actionArgs
                );
            } else {
                var queueBlock = new Queue(
                    childFlow,
                    childFlowCount,
                    blk,
                    receivedArg
                );
            }

            // We need to keep track of the parent block to the child
            // flow so we can unlightlight the parent block after the
            // child flow completes.
            if (that.parentFlowQueue[turtle] != undefined) {
                that.parentFlowQueue[turtle].push(blk);
                that.turtles.turtleList[turtle].queue.push(queueBlock);
            } else {
                console.debug("cannot find queue for turtle " + turtle);
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
                    if (
                        !that.suppressOutput[turtle] &&
                        that.justCounting[turtle].length === 0
                    ) {
                        setTimeout(function() {
                            if (that.blocks.visible) {
                                that.blocks.unhighlight(blk);
                            }
                        }, that.turtleDelay + that.waitTimes[turtle]);
                    }
                }
            }

            if (
                (that.backward[turtle].length > 0 &&
                    that.blocks.blockList[blk].connections[0] == null) ||
                (that.backward[turtle].length === 0 &&
                    last(that.blocks.blockList[blk].connections) == null)
            ) {
                if (
                    !that.suppressOutput[turtle] &&
                    that.justCounting[turtle].length === 0
                ) {
                    // If we are at the end of the child flow, queue the
                    // unhighlighting of the parent block to the flow.
                    if (that.unhighlightQueue[turtle] === undefined) {
                        console.debug(
                            "cannot find highlight queue for turtle " + turtle
                        );
                    } else if (
                        that.parentFlowQueue[turtle].length > 0 &&
                        that.turtles.turtleList[turtle].queue.length > 0 &&
                        last(that.turtles.turtleList[turtle].queue)
                            .parentBlk !== last(that.parentFlowQueue[turtle])
                    ) {
                        that.unhighlightQueue[turtle].push(
                            last(that.parentFlowQueue[turtle])
                        );
                        // that.unhighlightQueue[turtle].push(that.parentFlowQueue[turtle].pop());
                    } else if (that.unhighlightQueue[turtle].length > 0) {
                        // The child flow is finally complete, so unhighlight.
                        setTimeout(function() {
                            if (!turtle in that.unhighlightQueue) {
                                console.debug(
                                    "turtle " +
                                        turtle +
                                        " not found in unhighlightQueue"
                                );
                                return;
                            }

                            if (that.blocks.visible) {
                                that.blocks.unhighlight(
                                    that.unhighlightQueue[turtle].pop()
                                );
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
                    that._updateParameterBlock(
                        that,
                        turtle,
                        that.parameterQueue[turtle][pblk]
                    );
                }
            }

            if (isflow) {
                that._runFromBlockNow(
                    that,
                    turtle,
                    nextBlock,
                    isflow,
                    passArg,
                    queueStart
                );
            } else {
                that._runFromBlock(that, turtle, nextBlock, isflow, passArg);
            }
        } else {
            that.alreadyRunning = false;

            if (!that.prematureRestart) {
                // console.debug('Make sure any unissued signals are dispatched.');
                for (var b in that.endOfClampSignals[turtle]) {
                    for (
                        var i = 0;
                        i < that.endOfClampSignals[turtle][b].length;
                        i++
                    ) {
                        if (that.endOfClampSignals[turtle][b][i] != null) {
                            if (
                                that.butNotThese[turtle][b] == null ||
                                that.butNotThese[turtle][b].indexOf(i) === -1
                            ) {
                                that.stage.dispatchEvent(
                                    that.endOfClampSignals[turtle][b][i]
                                );
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
            } else {
                that.turtles.turtleList[turtle].running = false;
            }

            // Because flow can come from calc blocks, we are not
            // ensured that the turtle is really finished running
            // yet. Hence the timeout.
            __checkCompletionState = function() {
                if (
                    !that.turtles.running() &&
                    queueStart === 0 &&
                    that.justCounting[turtle].length === 0
                ) {
                    if (that.runningLilypond) {
                        console.debug("saving lilypond output:");
                        save.afterSaveLilypond();
                        that.runningLilypond = false;
                    } else if (that.runningAbc) {
                        console.debug("saving abc output:");
                        save.afterSaveAbc();
                        that.runningAbc = false;
                    } else if (that.runningMxml) {
                        console.log('saving mxml output');
                        save.afterSaveMxml();
                        that.runningMxml = false;
                    } else if (that.suppressOutput[turtle]) {
                        console.debug("finishing compiling");
                        if (!that.recording) {
                            that.errorMsg(_("Playback is ready."));
                        }

                        that.setPlaybackStatus();
                        that.compiling = false;
                        for (t in that.turtles.turtleList) {
                            that.turtles.turtleList[t].doPenUp();
                            that.turtles.turtleList[t].doSetXY(
                                that._saveX[t],
                                that._saveY[t]
                            );
                            that.turtles.turtleList[t].color =
                                that._saveColor[t];
                            that.turtles.turtleList[t].value =
                                that._saveValue[t];
                            that.turtles.turtleList[t].chroma =
                                that._saveChroma[t];
                            that.turtles.turtleList[t].stroke =
                                that._saveStroke[t];
                            that.turtles.turtleList[t].canvasAlpha =
                                that._saveCanvasAlpha[t];
                            that.turtles.turtleList[t].doSetHeading(
                                that._saveOrientation[t]
                            );
                            that.turtles.turtleList[t].penState =
                                that._savePenState[t];
                        }
                    }

                    // Give the last note time to play.
                    console.debug(
                        "SETTING LAST NOTE TIMEOUT: " +
                            that.recording +
                            " " +
                            that.suppressOutput[turtle]
                    );
                    that.lastNoteTimeout = setTimeout(function() {
                        console.debug("LAST NOTE PLAYED");
                        that.lastNoteTimeout = null;
                        if (that.suppressOutput[turtle] && that.recording) {
                            that.suppressOutput[turtle] = false;
                            that.checkingCompletionState = false;
                            that.saveLocally();
                            console.debug("PLAYBACK FOR RECORD");
                            that.playback(-1, true);
                            // that.recording = false;
                        } else {
                            that.suppressOutput[turtle] = false;
                            that.checkingCompletionState = false;

                            // Reset the cursor...
                            document.body.style.cursor = "default";

                            // And save the session.
                            that.saveLocally();
                        }
                    }, 1000);
                } else if (that.suppressOutput[turtle]) {
                    setTimeout(function() {
                        __checkCompletionState();
                    }, 250);
                }
            };

            if (
                !that.turtles.running() &&
                queueStart === 0 &&
                that.justCounting[turtle].length === 0
            ) {
                if (!that.checkingCompletionState) {
                    that.checkingCompletionState = true;
                    setTimeout(function() {
                        __checkCompletionState();
                    }, 250);
                }
            }

            if (
                !that.suppressOutput[turtle] &&
                that.justCounting[turtle].length === 0
            ) {
                // Nothing else to do... so cleaning up.
                if (
                    that.turtles.turtleList[turtle].queue.length === 0 ||
                    blk !==
                        last(that.turtles.turtleList[turtle].queue).parentBlk
                ) {
                    setTimeout(function() {
                        if (that.blocks.visible) {
                            that.blocks.unhighlight(blk);
                        }
                    }, that.turtleDelay);
                }

                // Unhighlight any parent blocks still highlighted.
                for (var b in that.parentFlowQueue[turtle]) {
                    if (that.blocks.visible) {
                        that.blocks.unhighlight(
                            that.parentFlowQueue[turtle][b]
                        );
                    }
                }

                // Make sure the turtles are on top.
                var i = that.stage.children.length - 1;
                that.stage.setChildIndex(
                    that.turtles.turtleList[turtle].container,
                    i
                );
                that.refreshCanvas();
            }

            for (var arg in that.evalOnStopList) {
                eval(that.evalOnStopList[arg]);
            }

            if (!that.turtles.running() && queueStart === 0) {
                // TODO: Enable playback button here
                if (that.showBlocksAfterRun) {
                    // If this is a status stack, not run showBlocks.
                    if (
                        blk !== null &&
                        that.blocks.blockList[blk].connections[0] !== null &&
                        that.blocks.blockList[
                            that.blocks.blockList[blk].connections[0]
                        ].name === "status"
                    ) {
                        console.debug("running status block");
                    } else {
                        that.showBlocks();
                        that.showBlocksAfterRun = false;
                    }
                }
                document.getElementById("stop").style.color = "white";
                console.debug("fin");
            }
        }
    };

    /**
     * Sets the master volume to a value of at least 0 and at most 100.
     * @privileged
     * @param   {number}    volume
     * @returns {void}
     */
    this._setMasterVolume = function(volume) {
        if (volume > 100) {
            volume = 100;
        } else if (volume < 0) {
            volume = 0;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.synth.setMasterVolume(volume);
        }
    };

    /**
     * Sets the synth volume to a value of at least 0 and, unless the synth is noise3, at most 100.
     * @privileged
     * @param   turtle
     * @param   synth
     * @param   {number}    volume
     * @returns {void}
     */
    this.setSynthVolume = function(turtle, synth, volume) {
        if (volume > 100) {
            volume = 100;
        } else if (volume < 0) {
            volume = 0;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            switch (synth) {
                case "noise1":
                case "noise2":
                case "noise3":
                    // Noise is very very loud.
                    this.synth.setVolume(turtle, synth, volume / 25);
                    break;
                default:
                    this.synth.setVolume(turtle, synth, volume);
                    break;
            }
        }
    };

    /**
     * Processes a single note.
     * @privileged
     * @param   {number}    noteValue
     * @param   blk
     * @param   turtle
     * @param   {Function}  callback
     * @returns {void}
     */
    this._processNote = function(noteValue, blk, turtle, callback) {
        if (this.bpm[turtle].length > 0) {
            var bpmFactor = TONEBPM / last(this.bpm[turtle]);
        } else {
            var bpmFactor = TONEBPM / this._masterBPM;
        }

        if (this.blocks.blockList[blk].name === "osctime") {
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
        if (
            this.inSetTimbre[turtle] &&
            turtle in this.instrumentNames &&
            last(this.instrumentNames[turtle])
        ) {
            var name = last(this.instrumentNames[turtle]);

            if (name in instrumentsEffects[turtle]) {
                var timbreEffects = instrumentsEffects[turtle][name];

                if (timbreEffects["vibratoActive"]) {
                    vibratoRate = timbreEffects["vibratoRate"];
                    vibratoIntensity = timbreEffects["vibratoIntensity"];
                    doVibrato = true;
                }

                if (timbreEffects["distortionActive"]) {
                    distortionAmount = timbreEffects["distortionAmount"];
                    doDistortion = true;
                }

                if (timbreEffects["tremoloActive"]) {
                    tremoloFrequency = timbreEffects["tremoloFrequency"];
                    tremoloDepth = timbreEffects["tremoloDepth"];
                    doTremolo = true;
                }

                if (timbreEffects["phaserActive"]) {
                    rate = timbreEffects["rate"];
                    octaves = timbreEffects["octaves"];
                    baseFrequency = timbreEffects["baseFrequency"];
                    doPhaser = true;
                }

                if (timbreEffects["chorusActive"]) {
                    chorusRate = timbreEffects["chorusRate"];
                    delayTime = timbreEffects["delayTime"];
                    chorusDepth = timbreEffects["chorusDepth"];
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
                this.errorMsg(
                    _(
                        "You must have at least one Partial block inside of a Weighted-partial block"
                    )
                );
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
            neighborArgCurrentBeat =
                bpmFactor / last(this.neighborArgCurrentBeat[turtle]);
            doNeighbor = true;
        }

        var carry = 0;

        if (
            this.inCrescendo[turtle].length > 0 &&
            this.crescendoDelta[turtle].length === 0
        ) {
            this.inCrescendo[turtle].pop();
            for (var synth in this.synthVolume[turtle]) {
                this.setSynthVolume(
                    turtle,
                    "electronic synth",
                    last(this.synthVolume[turtle][synth])
                );
                this._playbackPush(turtle, [
                    this.previousTurtleTime[turtle],
                    "setsynthvolume",
                    synth,
                    last(this.synthVolume[turtle][synth])
                ]);
            }
        } else if (this.crescendoDelta[turtle].length > 0) {
            if (
                last(this.synthVolume[turtle]["electronic synth"]) ===
                    last(
                        this.crescendoInitialVolume[turtle]["electronic synth"]
                    ) &&
                this.justCounting[turtle].length === 0
            ) {
                this.notationBeginCrescendo(
                    turtle,
                    last(this.crescendoDelta[turtle])
                );
            }

            for (var synth in this.synthVolume[turtle]) {
                var len = this.synthVolume[turtle][synth].length;
                this.synthVolume[turtle][synth][len - 1] += last(
                    this.crescendoDelta[turtle]
                );
                console.debug(
                    synth + "= " + this.synthVolume[turtle][synth][len - 1]
                );
                this._playbackPush(turtle, [
                    this.previousTurtleTime[turtle],
                    "setsynthvolume",
                    synth,
                    last(this.synthVolume[turtle][synth])
                ]);
                if (!this.suppressOutput[turtle]) {
                    this.setSynthVolume(
                        turtle,
                        synth,
                        last(this.synthVolume[turtle][synth])
                    );
                }
            }
        }

        if (this.inTimbre) {
            var noteObj = getNote(
                this.notePitches[turtle][last(this.inNoteBlock[turtle])][0],
                this.noteOctaves[turtle][last(this.inNoteBlock[turtle])][0],
                0,
                this.keySignature[turtle],
                this.moveable[turtle],
                null,
                this.errorMsg
            );
            this.timbre.notesToPlay.push([
                noteObj[0] + noteObj[1],
                1 / noteBeatVvalue
            ]);
            this.previousNotePlayed[turtle] = this.lastNotePlayed[turtle];
            this.lastNotePlayed[turtle] = [
                noteObj[0] + noteObj[1],
                noteBeatValue
            ];
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
                    this.tupletRhythms.push([
                        "notes",
                        this.tupletParams.length - 1,
                        noteBeatValue
                    ]);
                    this.addingNotesToTuplet = true;
                }
            } else {
                this.tupletRhythms.push(["", 1, noteBeatValue]);
            }
        } else {
            // We start the music clock as the first note is being
            // played.
            if (this.firstNoteTime == null) {
                // && !this.suppressOutput[turtle]) {
                var d = new Date();
                this.firstNoteTime = d.getTime();
            }

            // Calculate a lag: In case this turtle has fallen behind,
            // we need to catch up.
            var d = new Date();
            var elapsedTime = (d.getTime() - this.firstNoteTime) / 1000;
            if (this.drift[turtle] === 0) {
                // How far behind is this turtle lagging?
                var turtleLag = Math.max(
                    elapsedTime - this.turtleTime[turtle],
                    0
                );
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
                    if (
                        this.tieNotePitches[turtle].length !==
                        this.notePitches[turtle][last(this.inNoteBlock[turtle])]
                            .length
                    ) {
                        match = false;
                    } else {
                        // FIXME: This check assumes that the order of
                        // the pitch blocks in a chord are the same.
                        for (
                            var i = 0;
                            i < this.tieNotePitches[turtle].length;
                            i++
                        ) {
                            if (
                                this.tieNotePitches[turtle][i][0] !=
                                this.notePitches[turtle][
                                    last(this.inNoteBlock[turtle])
                                ][i]
                            ) {
                                match = false;
                                break;
                            }

                            if (
                                this.tieNotePitches[turtle][i][1] !=
                                this.noteOctaves[turtle][
                                    last(this.inNoteBlock[turtle])
                                ][i]
                            ) {
                                match = false;
                                break;
                            }
                        }
                    }

                    if (!match) {
                        // If we don't have a match, then we need to
                        // play the previous note.
                        this.errorMsg(
                            _(
                                "You can only tie notes of the same pitch. Did you mean to use slur?"
                            ),
                            saveBlk
                        );

                        // Save the current note.
                        var saveCurrentNote = [];
                        var saveCurrentExtras = [];
                        for (
                            var i = 0;
                            i <
                            this.notePitches[turtle][
                                last(this.inNoteBlock[turtle])
                            ].length;
                            i++
                        ) {
                            saveCurrentNote.push([
                                this.notePitches[turtle][saveBlk][i],
                                this.noteOctaves[turtle][saveBlk][i],
                                this.noteCents[turtle][saveBlk][i],
                                this.noteHertz[turtle][saveBlk][i],
                                saveBlk
                            ]);
                        }

                        saveCurrentExtras = [
                            saveBlk,
                            this.oscList[turtle][saveBlk],
                            this.noteBeat[turtle][saveBlk],
                            this.noteBeatValues[turtle][saveBlk],
                            this.noteDrums[turtle][saveBlk],
                            this.embeddedGraphics[turtle][saveBlk]
                        ];

                        // Swap in the previous note.
                        saveBlk = this.tieNoteExtras[turtle][0];
                        this.inNoteBlock[turtle].push(saveBlk);

                        this.notePitches[turtle][saveBlk] = [];
                        this.noteOctaves[turtle][saveBlk] = [];
                        this.noteCents[turtle][saveBlk] = [];
                        this.noteHertz[turtle][saveBlk] = [];
                        for (
                            var i = 0;
                            i < this.tieNotePitches[turtle].length;
                            i++
                        ) {
                            this.notePitches[turtle][saveBlk].push(
                                this.tieNotePitches[turtle][i][0]
                            );
                            this.noteOctaves[turtle][saveBlk].push(
                                this.tieNotePitches[turtle][i][1]
                            );
                            this.noteCents[turtle][saveBlk].push(
                                this.tieNotePitches[turtle][i][2]
                            );
                            this.noteHertz[turtle][saveBlk].push(
                                this.tieNotePitches[turtle][i][3]
                            );
                        }

                        this.oscList[turtle][saveBlk] = this.tieNoteExtras[
                            turtle
                        ][1];
                        this.noteBeat[turtle][saveBlk] = this.tieNoteExtras[
                            turtle
                        ][2];
                        this.noteBeatValues[turtle][
                            saveBlk
                        ] = this.tieNoteExtras[turtle][3];
                        this.noteDrums[turtle][saveBlk] = this.tieNoteExtras[
                            turtle
                        ][4];
                        this.embeddedGraphics[turtle][
                            saveBlk
                        ] = this.tieNoteExtras[turtle][5];

                        if (this.justCounting[turtle].length === 0) {
                            // Remove the note from the Lilypond list.
                            for (
                                var i = 0;
                                i < this.notePitches[turtle][saveBlk].length;
                                i++
                            ) {
                                this.notationRemoveTie(turtle);
                            }
                        }

                        // Play previous note.
                        this.tie[turtle] = false;
                        tieDelay = 0;
                        this._processNote(
                            this.tieCarryOver[turtle],
                            saveBlk,
                            turtle
                        );

                        this.inNoteBlock[turtle].pop();

                        if (!this.suppressOutput[turtle]) {
                            this._doWait(
                                turtle,
                                Math.max(
                                    bpmFactor / this.tieCarryOver[turtle] +
                                        this.noteDelay / 1000 -
                                        turtleLag,
                                    0
                                )
                            );
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
                            this.notePitches[turtle][saveBlk].push(
                                saveCurrentNote[i][0]
                            );
                            this.noteOctaves[turtle][saveBlk].push(
                                saveCurrentNote[i][1]
                            );
                            this.noteCents[turtle][saveBlk].push(
                                saveCurrentNote[i][2]
                            );
                            this.noteHertz[turtle][saveBlk].push(
                                saveCurrentNote[i][3]
                            );
                        }

                        this.oscList[turtle][saveBlk] = saveCurrentExtras[1];
                        this.noteBeat[turtle][saveBlk] = saveCurrentExtras[2];
                        this.noteBeatValues[turtle][saveBlk] =
                            saveCurrentExtras[3];
                        this.noteDrums[turtle][saveBlk] = saveCurrentExtras[4];
                        this.embeddedGraphics[turtle][saveBlk] =
                            saveCurrentExtras[5];
                    }
                }

                if (this.tieCarryOver[turtle] === 0) {
                    // We need to save the first note in the pair.
                    this.tieNotePitches[turtle] = [];
                    this.tieCarryOver[turtle] = noteBeatValue;

                    for (
                        var i = 0;
                        i < this.notePitches[turtle][saveBlk].length;
                        i++
                    ) {
                        this.tieNotePitches[turtle].push([
                            this.notePitches[turtle][saveBlk][i],
                            this.noteOctaves[turtle][saveBlk][i],
                            this.noteCents[turtle][saveBlk][i],
                            this.noteHertz[turtle][saveBlk][i]
                        ]);
                    }

                    this.tieNoteExtras[turtle] = [
                        saveBlk,
                        this.oscList[turtle][saveBlk],
                        this.noteBeat[turtle][saveBlk],
                        this.noteBeatValues[turtle][saveBlk],
                        this.noteDrums[turtle][saveBlk],
                        []
                    ];

                    // We play any drums in the first tied note along
                    // with the drums in the second tied note.
                    this.tieFirstDrums[turtle] = this.noteDrums[turtle][
                        saveBlk
                    ];
                    noteBeatValue = 0;
                } else {
                    carry = this.tieCarryOver[turtle];
                    noteBeatValue =
                        1 / (1 / noteBeatValue + 1 / this.tieCarryOver[turtle]);
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
                    this.swingTarget[turtle][
                        this.swingTarget[turtle].length - 1
                    ] = noteBeatValue;
                }

                var swingValue = last(this.swing[turtle]);
                // If this notevalue matches the target, either we are
                // starting a swing or ending a swing.
                if (noteBeatValue === last(this.swingTarget[turtle])) {
                    if (this.swingCarryOver[turtle] === 0) {
                        noteBeatValue =
                            1 / (1 / noteBeatValue + 1 / swingValue);
                        this.swingCarryOver[turtle] = swingValue;
                    } else {
                        if (noteBeatValue === swingValue) {
                            noteBeatValue = 0;
                        } else {
                            noteBeatValue =
                                1 / (1 / noteBeatValue - 1 / swingValue);
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
                    this.turtleTime[turtle] +=
                        bpmFactor / duration + this.noteDelay / 1000;
                    if (!this.suppressOutput[turtle]) {
                        this._doWait(
                            turtle,
                            Math.max(
                                bpmFactor / duration +
                                    this.noteDelay / 1000 -
                                    turtleLag,
                                0
                            )
                        );
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
            __playnote = function() {
                var thisBlk = last(that.inNoteBlock[turtle]);

                if (that.notePitches[turtle][thisBlk] === undefined) {
                    // Rest?
                    // console.debug('no note found');
                    return;
                }

                // If there are multiple notes, remove the rests.
                if (that.notePitches[turtle][thisBlk].length > 1) {
                    while (
                        that.notePitches[turtle][thisBlk].indexOf("rest") !== -1
                    ) {
                        that.notePitches[turtle][thisBlk].splice(
                            that.notePitches[turtle][thisBlk].indexOf("rest"),
                            1
                        );
                    }
                }

                // If there is no note, add a rest.
                if (that.notePitches[turtle][thisBlk].length === 0) {
                    that.notePitches[turtle][
                        that.inNoteBlock[turtle][
                            that.inNoteBlock[turtle].length - 1
                        ]
                    ].push("rest");
                }

                // Stop playing notes if the stop button is pressed.
                if (that.stopTurtle) return;

                if (
                    that.inNoteBlock[turtle].length ===
                    that.whichNoteToCount[turtle]
                ) {
                    that.notesPlayed[turtle] = rationalSum(
                        that.notesPlayed[turtle],
                        [1, noteValue]
                    );
                }

                var notes = [];
                var drums = [];
                var insideChord = -1;
                if (
                    that.notePitches[turtle][thisBlk].length +
                        that.oscList[turtle][thisBlk].length >
                    1
                ) {
                    if (
                        turtle in that.notationStaging &&
                        that.justCounting[turtle].length === 0
                    ) {
                        var insideChord =
                            that.notationStaging[turtle].length + 1;
                    } else {
                        var insideChord = 1;
                    }
                }

                that.noteBeat[turtle][blk] = noteBeatValue;

                // Do not process a note if its duration is equal
                // to infinity or NaN.
                if (!isFinite(duration)) return;

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
                        var beatValue =
                            bpmFactor *
                            (1 / noteBeatValue - 1 / staccatoBeatValue);
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
                for (
                    var i = 0;
                    i < that.notePitches[turtle][thisBlk].length;
                    i++
                ) {
                    var n = that.notePitches[turtle][thisBlk][i];
                    var thisCourtesy = false;
                    if (n.length === 1) {
                        for (
                            j = 0;
                            j < that.notePitches[turtle][thisBlk].length;
                            j++
                        ) {
                            if (
                                i === j ||
                                that.noteOctaves[turtle][thisBlk][i] !==
                                    that.noteOctaves[turtle][thisBlk][j]
                            ) {
                                continue;
                            }

                            if (
                                n + "♯" ===
                                    that.notePitches[turtle][thisBlk][j] ||
                                n + "♭" === that.notePitches[turtle][thisBlk][j]
                            ) {
                                thisCourtesy = true;
                            }
                        }
                    }

                    courtesy.push(thisCourtesy);
                }

                // Process pitches
                if (that.notePitches[turtle][thisBlk].length > 0) {
                    for (
                        var i = 0;
                        i < that.notePitches[turtle][thisBlk].length;
                        i++
                    ) {
                        if (
                            that.notePitches[turtle][thisBlk][i] === "rest" ||
                            forceSilence
                        ) {
                            note = "R";
                            that.previousNotePlayed[turtle] =
                                that.lastNotePlayed[turtle];
                        } else {
                            var noteObj = getNote(
                                that.notePitches[turtle][thisBlk][i],
                                that.noteOctaves[turtle][thisBlk][i],
                                0,
                                that.keySignature[turtle],
                                that.moveable[turtle],
                                null,
                                that.errorMsg,
                                that.synth.inTemperament
                            );
                            // If the cents for this note != 0, then
                            // we need to convert to frequency and add
                            // in the cents.
                            if (that.noteCents[turtle][thisBlk][i] !== 0) {
                                if (that.noteHertz[turtle][thisBlk][i] !== 0) {
                                    var note =
                                        that.noteHertz[turtle][thisBlk][i];
                                } else {
                                    var note = Math.floor(
                                        pitchToFrequency(
                                            noteObj[0],
                                            noteObj[1],
                                            that.noteCents[turtle][thisBlk][i],
                                            that.keySignature[turtle]
                                        )
                                    );
                                }
                            } else {
                                var note = noteObj[0] + noteObj[1];
                            }
                        }

                        if (note !== "R") {
                            // Apply harmonic here instead of in synth.
                            var p = partials.indexOf(1);
                            if (p > 0) {
                                note =
                                    noteToFrequency(
                                        note,
                                        that.keySignature[turtle]
                                    ) *
                                    (p + 1);
                            }

                            notes.push(note);
                        }

                        if (duration > 0) {
                            if (carry > 0) {
                                if (
                                    i === 0 &&
                                    that.justCounting[turtle].length === 0
                                ) {
                                    that.notationInsertTie(turtle);
                                }

                                var originalDuration =
                                    1 / (1 / duration - 1 / carry);
                            } else {
                                var originalDuration = duration;
                            }

                            if (that.justCounting[turtle].length === 0) {
                                if (
                                    that.noteDrums[turtle][thisBlk].length > 0
                                ) {
                                    if (chordNotes.indexOf(note) === -1) {
                                        chordNotes.push(note);
                                    }

                                    if (
                                        chordDrums.indexOf(
                                            that.noteDrums[turtle][thisBlk][0]
                                        ) === -1
                                    ) {
                                        chordDrums.push(
                                            that.noteDrums[turtle][thisBlk][0]
                                        );
                                    }
                                } else {
                                    if (courtesy[i]) {
                                        if (
                                            chordNotes.indexOf(note + "♮") ===
                                            -1
                                        ) {
                                            chordNotes.push(note + "♮");
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

                        if (
                            i ===
                            that.notePitches[turtle][thisBlk].length - 1
                        ) {
                            if (duration > 0) {
                                if (carry > 0) {
                                    var d = 1 / (1 / duration - 1 / carry);
                                } else {
                                    var d = duration;
                                }
                            } else if (that.tieCarryOver[turtle] > 0) {
                                var d = that.tieCarryOver[turtle];
                            }

                            if (that.runningLilypond || that.runningMxml) {
                                that.updateNotation(
                                    chordNotes,
                                    d,
                                    turtle,
                                    -1,
                                    chordDrums
                                );
                            }
                        }
                    }
                    if (that.synth.inTemperament === "custom") {
                        var notesFrequency = that.synth.getCustomFrequency(
                            notes
                        );
                    } else {
                        var notesFrequency = that.synth.getFrequency(
                            notes,
                            that.synth.changeInTemperament
                        );
                    }
                    var startingPitch = that.synth.startingPitch;
                    var frequency = pitchToFrequency(
                        startingPitch.substring(0, startingPitch.length - 1),
                        Number(startingPitch.slice(-1)),
                        0,
                        null
                    );
                    var t = TEMPERAMENT[that.synth.inTemperament];
                    var pitchNumber = t.pitchNumber;
                    var ratio = [];
                    var number = [];
                    var numerator = [];
                    var denominator = [];

                    for (var k = 0; k < notesFrequency.length; k++) {
                        if (notesFrequency[k] !== undefined) {
                            ratio[k] = notesFrequency[k] / frequency;
                            number[k] =
                                pitchNumber *
                                (Math.log10(ratio[k]) /
                                    Math.log10(OCTAVERATIO));
                            number[k] = number[k].toFixed(0);
                            numerator[k] = rationalToFraction(ratio[k])[0];
                            denominator[k] = rationalToFraction(ratio[k])[1];
                        }
                    }

                    var notesInfo = "";
                    /*
                    if (that.synth.inTemperament === 'equal' || that.synth.inTemperament === '1/3 comma meantone') {
                        notesInfo = ' ( ' + startingPitch + '*' + OCTAVERATIO + ' ^ ' + '(' + number + ' / ' + pitchNumber + ')' + ' )';
                    } else if (numerator.length !== 0) {
                        notesInfo = ' ( ' + startingPitch + ' * ' + numerator + '/' + denominator + ' )';
                    }
                    */

                    var obj = rationalToFraction(1 / noteBeatValue);
                    if (obj[0] > 0) {
                        if (obj[0] / obj[1] > 2) {
                            that.errorMsg(
                                _("Warning: Note value greater than 2."),
                                blk
                            );
                        }
                        // console.debug('temperament: ' + that.synth.startingPitch + ' ' + that.synth.inTemperament);
                        if (that.justCounting[turtle].length === 0) {
                            if (notes.length === 0) {
                                console.debug(
                                    "notes to play: R " + obj[0] + "/" + obj[1]
                                );
                            } else {
                                console.debug(
                                    "notes to play: " +
                                        notes +
                                        " " +
                                        obj[0] +
                                        "/" +
                                        obj[1] +
                                        notesInfo
                                );
                            }
                        } else {
                            if (notes.length === 0) {
                                console.debug(
                                    "notes to count: R " + obj[0] + "/" + obj[1]
                                );
                            } else {
                                console.debug(
                                    "notes to count: " +
                                        notes +
                                        " " +
                                        obj[0] +
                                        "/" +
                                        obj[1] +
                                        notesInfo
                                );
                            }
                        }
                    }

                    if (!that.suppressOutput[turtle] && that.blinkState) {
                        that.turtles.turtleList[turtle].blink(
                            duration,
                            last(that.masterVolume)
                        );
                    }

                    if (notes.length > 0) {
                        var len = notes[0].length;
                        if (typeof notes[0] === "number") {
                            var obj = frequencyToPitch(notes[0]);
                            that.currentOctave[turtle] = obj[1];
                        } else {
                            that.currentOctave[turtle] = parseInt(
                                notes[0].slice(len - 1)
                            );
                        }
                        that.currentCalculatedOctave[turtle] =
                            that.currentOctave[turtle];

                        if (that.turtles.turtleList[turtle].drum) {
                            for (var i = 0; i < notes.length; i++) {
                                notes[i] = notes[i]
                                    .replace(/♭/g, "b")
                                    .replace(/♯/g, "#"); // 'C2'; // Remove pitch
                            }
                        } else {
                            for (var i = 0; i < notes.length; i++) {
                                if (typeof notes[i] === "string") {
                                    notes[i] = notes[i]
                                        .replace(/♭/g, "b")
                                        .replace(/♯/g, "#");
                                }
                            }
                        }

                        if (duration > 0) {
                            var __getParamsEffects = function(paramsEffects) {
                                if (
                                    !paramsEffects.doVibrato &&
                                    !paramsEffects.doDistortion &&
                                    !paramsEffects.doTremolo &&
                                    !paramsEffects.doPhaser &&
                                    !paramsEffects.Chorus &&
                                    paramsEffects.partials.length === 1 &&
                                    paramsEffects.partials[1] === 1
                                ) {
                                    return null;
                                } else {
                                    return paramsEffects;
                                }
                            };

                            if (_THIS_IS_MUSIC_BLOCKS_ && !forceSilence) {
                                // Parameters related to effects
                                var paramsEffects = {
                                    doVibrato: doVibrato,
                                    doDistortion: doDistortion,
                                    doTremolo: doTremolo,
                                    doPhaser: doPhaser,
                                    doChorus: doChorus,
                                    doPartials: true,
                                    doPortamento: true,
                                    doNeighbor: doNeighbor,
                                    vibratoIntensity: vibratoIntensity,
                                    vibratoFrequency: vibratoValue,
                                    distortionAmount: distortionAmount,
                                    tremoloFrequency: tremoloFrequency,
                                    tremoloDepth: tremoloDepth,
                                    rate: rate,
                                    octaves: octaves,
                                    baseFrequency: baseFrequency,
                                    chorusRate: chorusRate,
                                    delayTime: delayTime,
                                    chorusDepth: chorusDepth,
                                    partials: partials,
                                    portamento: portamento,
                                    neighborArgNote1: neighborArgNote1,
                                    neighborArgNote2: neighborArgNote2,
                                    neighborArgBeat: neighborArgBeat,
                                    neighborArgCurrentBeat: neighborArgCurrentBeat
                                };

                                if (that.oscList[turtle][thisBlk].length > 0) {
                                    if (notes.length > 1) {
                                        that.errorMsg(
                                            last(
                                                that.oscList[turtle][thisBlk]
                                            ) +
                                                ": " +
                                                _("synth cannot play chords."),
                                            blk
                                        );
                                    }

                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(
                                            turtle,
                                            notes,
                                            beatValue,
                                            last(that.oscList[turtle][thisBlk]),
                                            paramsEffects,
                                            null,
                                            false
                                        );
                                    }

                                    if (
                                        that.justCounting[turtle].length === 0
                                    ) {
                                        that._playbackPush(turtle, [
                                            that.previousTurtleTime[turtle],
                                            "notes",
                                            notes,
                                            beatValue,
                                            last(that.oscList[turtle][thisBlk]),
                                            __getParamsEffects(paramsEffects),
                                            null
                                        ]);
                                    }
                                } else if (that.drumStyle[turtle].length > 0) {
                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(
                                            turtle,
                                            notes,
                                            beatValue,
                                            last(that.drumStyle[turtle]),
                                            null,
                                            null,
                                            false
                                        );
                                    }

                                    if (
                                        that.justCounting[turtle].length === 0
                                    ) {
                                        that._playbackPush(turtle, [
                                            that.previousTurtleTime[turtle],
                                            "notes",
                                            notes,
                                            beatValue,
                                            that.drumStyle[turtle],
                                            null,
                                            null
                                        ]);
                                    }
                                } else if (
                                    that.turtles.turtleList[turtle].drum
                                ) {
                                    if (!that.suppressOutput[turtle]) {
                                        that.synth.trigger(
                                            turtle,
                                            notes,
                                            beatValue,
                                            "drum",
                                            null,
                                            null,
                                            false
                                        );
                                    }

                                    if (
                                        that.justCounting[turtle].length === 0
                                    ) {
                                        that._playbackPush(turtle, [
                                            that.previousTurtleTime[turtle],
                                            "notes",
                                            notes,
                                            beatValue,
                                            "drum",
                                            null,
                                            null
                                        ]);
                                    }
                                } else {
                                    for (var d = 0; d < notes.length; d++) {
                                        if (
                                            notes[d] in
                                            that.pitchDrumTable[turtle]
                                        ) {
                                            if (!that.suppressOutput[turtle]) {
                                                console.debug(
                                                    that.glide[turtle].length
                                                );
                                                that.synth.trigger(
                                                    turtle,
                                                    notes[d],
                                                    beatValue,
                                                    that.pitchDrumTable[turtle][
                                                        notes[d]
                                                    ],
                                                    null,
                                                    null,
                                                    false
                                                );
                                            }

                                            if (
                                                that.justCounting[turtle]
                                                    .length === 0
                                            ) {
                                                that._playbackPush(turtle, [
                                                    that.previousTurtleTime[
                                                        turtle
                                                    ],
                                                    "notes",
                                                    notes[d],
                                                    beatValue,
                                                    that.pitchDrumTable[turtle][
                                                        notes[d]
                                                    ],
                                                    null,
                                                    null
                                                ]);
                                            }
                                        } else if (
                                            turtle in that.instrumentNames &&
                                            last(that.instrumentNames[turtle])
                                        ) {
                                            if (!that.suppressOutput[turtle]) {
                                                // If we are in a glide, use setNote after the first note.
                                                if (
                                                    that.glide[turtle].length >
                                                    0
                                                ) {
                                                    if (
                                                        that.glideOverride[
                                                            turtle
                                                        ] === 0
                                                    ) {
                                                        console.debug(
                                                            "glide note " +
                                                                beatValue
                                                        );
                                                        that.synth.trigger(
                                                            turtle,
                                                            notes[d],
                                                            beatValue,
                                                            last(
                                                                that
                                                                    .instrumentNames[
                                                                    turtle
                                                                ]
                                                            ),
                                                            paramsEffects,
                                                            filters,
                                                            true
                                                        );
                                                    } else {
                                                        // trigger first note for entire duration of the glissando
                                                        var beatValueOverride =
                                                            bpmFactor /
                                                            that.glideOverride[
                                                                turtle
                                                            ];
                                                        console.debug(
                                                            "first glide note: " +
                                                                that
                                                                    .glideOverride[
                                                                    turtle
                                                                ] +
                                                                " " +
                                                                beatValueOverride
                                                        );
                                                        that.synth.trigger(
                                                            turtle,
                                                            notes[d],
                                                            beatValueOverride,
                                                            last(
                                                                that
                                                                    .instrumentNames[
                                                                    turtle
                                                                ]
                                                            ),
                                                            paramsEffects,
                                                            filters,
                                                            false
                                                        );
                                                        that.glideOverride[
                                                            turtle
                                                        ] = 0;
                                                    }
                                                } else {
                                                    that.synth.trigger(
                                                        turtle,
                                                        notes[d],
                                                        beatValue,
                                                        last(
                                                            that
                                                                .instrumentNames[
                                                                turtle
                                                            ]
                                                        ),
                                                        paramsEffects,
                                                        filters,
                                                        false
                                                    );
                                                }
                                            }

                                            if (
                                                that.justCounting[turtle]
                                                    .length === 0
                                            ) {
                                                that._playbackPush(turtle, [
                                                    that.previousTurtleTime[
                                                        turtle
                                                    ],
                                                    "notes",
                                                    notes[d],
                                                    beatValue,
                                                    last(
                                                        that.instrumentNames[
                                                            turtle
                                                        ]
                                                    ),
                                                    __getParamsEffects(
                                                        paramsEffects
                                                    ),
                                                    filters
                                                ]);
                                            }
                                        } else if (
                                            turtle in that.voices &&
                                            last(that.voices[turtle])
                                        ) {
                                            if (!that.suppressOutput[turtle]) {
                                                console.debug(
                                                    that.glide[turtle].length
                                                );
                                                that.synth.trigger(
                                                    turtle,
                                                    notes[d],
                                                    beatValue,
                                                    last(that.voices[turtle]),
                                                    paramsEffects,
                                                    null,
                                                    false
                                                );
                                            }

                                            if (
                                                that.justCounting[turtle]
                                                    .length === 0
                                            ) {
                                                that._playbackPush(turtle, [
                                                    that.previousTurtleTime[
                                                        turtle
                                                    ],
                                                    "notes",
                                                    notes[d],
                                                    beatValue,
                                                    last(that.voices[turtle]),
                                                    __getParamsEffects(
                                                        paramsEffects
                                                    ),
                                                    null
                                                ]);
                                            }
                                        } else {
                                            if (!that.suppressOutput[turtle]) {
                                                that.synth.trigger(
                                                    turtle,
                                                    notes[d],
                                                    beatValue,
                                                    "electronic synth",
                                                    paramsEffects,
                                                    null,
                                                    false
                                                );
                                            }

                                            if (
                                                that.justCounting[turtle]
                                                    .length === 0
                                            ) {
                                                that._playbackPush(turtle, [
                                                    that.previousTurtleTime[
                                                        turtle
                                                    ],
                                                    "notes",
                                                    notes[d],
                                                    beatValue,
                                                    "electronic synth",
                                                    __getParamsEffects(
                                                        paramsEffects
                                                    ),
                                                    null
                                                ]);
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        that.previousNotePlayed[turtle] =
                            that.lastNotePlayed[turtle];
                        that.lastNotePlayed[turtle] = [notes[0], noteBeatValue];
                        that.noteStatus[turtle] = [notes, noteBeatValue];
                        that.lastPitchPlayed[turtle] =
                            that.lastNotePlayed[turtle]; //For a stand-alone pitch block.
                    }
                }

                // Process drums
                if (that.noteDrums[turtle][thisBlk].length > 0) {
                    for (
                        var i = 0;
                        i < that.noteDrums[turtle][thisBlk].length;
                        i++
                    ) {
                        drums.push(that.noteDrums[turtle][thisBlk][i]);
                    }

                    for (
                        var i = 0;
                        i < that.tieFirstDrums[turtle].length;
                        i++
                    ) {
                        if (
                            drums.indexOf(that.tieFirstDrums[turtle][i]) === -1
                        ) {
                            drums.push(that.tieFirstDrums[turtle][i]);
                        }
                    }

                    // If it is > 0, we already counted this note
                    // (e.g. pitch & drum combination).
                    if (that.notePitches[turtle][thisBlk].length === 0) {
                        var obj = rationalToFraction(1 / noteBeatValue);
                        if (obj[0] > 0) {
                            if (that.justCounting[turtle].length === 0) {
                                console.debug(
                                    "drums to play " +
                                        notes +
                                        " " +
                                        obj[0] +
                                        "/" +
                                        obj[1]
                                );
                            } else {
                                console.debug(
                                    "drums to count " +
                                        notes +
                                        " " +
                                        obj[0] +
                                        "/" +
                                        obj[1]
                                );
                            }
                        }

                        if (!that.suppressOutput[turtle] && that.blinkState) {
                            that.turtles.turtleList[turtle].blink(
                                duration,
                                last(that.masterVolume)
                            );
                        }
                    }

                    if (
                        (that.tie[turtle] && that.tieCarryOver[turtle] > 0) ||
                        duration > 0
                    ) {
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
                                            that.synth.trigger(
                                                turtle,
                                                ["C2"],
                                                newBeatValue,
                                                last(that.drumStyle[turtle]),
                                                null,
                                                null,
                                                false
                                            );
                                        }

                                        if (
                                            that.justCounting[turtle].length ===
                                            0
                                        ) {
                                            that._playbackPush(turtle, [
                                                that.previousTurtleTime[turtle],
                                                "notes",
                                                ["C2"],
                                                newBeatValue,
                                                last(that.drumStyle[turtle]),
                                                null,
                                                null
                                            ]);
                                        }
                                    } else {
                                        if (!that.suppressOutput[turtle]) {
                                            that.synth.trigger(
                                                turtle,
                                                ["C2"],
                                                newBeatValue,
                                                drums[i],
                                                null,
                                                null,
                                                false
                                            );
                                        }

                                        if (
                                            that.justCounting[turtle].length ===
                                            0
                                        ) {
                                            that._playbackPush(turtle, [
                                                that.previousTurtleTime[turtle],
                                                "notes",
                                                ["C2"],
                                                newBeatValue,
                                                drums[i],
                                                null,
                                                null
                                            ]);
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
                        that._dispatchTurtleSignals(
                            turtle,
                            bpmFactor / that.tieCarryOver[turtle],
                            blk,
                            bpmFactor / tieDelay
                        );
                    } else {
                        that._dispatchTurtleSignals(
                            turtle,
                            bpmFactor / that.tieCarryOver[turtle],
                            blk,
                            0
                        );
                    }
                } else {
                    if (tieDelay > 0) {
                        that._dispatchTurtleSignals(
                            turtle,
                            beatValue - bpmFactor / tieDelay,
                            blk,
                            bpmFactor / tieDelay
                        );
                    } else {
                        that._dispatchTurtleSignals(turtle, beatValue, blk, 0);
                    }
                }

                // After the note plays, clear the embedded graphics queue.
                that.embeddedGraphics[turtle][blk] = [];

                // Ensure note value block unhighlights after note plays.
                setTimeout(function() {
                    if (that.blocks.visible) {
                        that.blocks.unhighlight(blk);
                    }
                }, beatValue * 1000);
            };

            if (last(that.inNoteBlock[turtle]) != null) {
                if (this.noteDelay === 0 || !this.suppressOutput[turtle]) {
                    __playnote();
                } else {
                    setTimeout(function() {
                        __playnote();
                    }, this.noteDelay);
                }
            }
        }

        this.pushedNote[turtle] = false;

        if (callback !== undefined && callback !== null) {
            callback();
        }

        stage.update(event);
    };

    /**
     * Pushes obj to playback queue, if possible.
     * @privileged
     * @param   turtle
     * @param   obj
     * @returns {void}
     */
    this._playbackPush = function(turtle, obj) {
        // We only push for saveWAV, etc.
        if (!this.recordingStatus()) return;

        // Don't record in optimize mode or Turtle Blocks.
        if (_THIS_IS_MUSIC_BLOCKS_ && !this.optimize) {
            this.playbackQueue[turtle].push(obj);
        }
    };

    /**
     * Plays back some amount of activity.
     * @privileged
     * @param   {number}    whichMouse
     * @param   {boolean}   recording   Optional.
     * @returns {void}
     */
    this.playback = function(whichMouse, recording) {
        var that = this;

        if (this.restartPlayback) {
            this.progressBarWidth = 0;
        }

        if (recording === undefined) recording = false;

        this.recording = recording;

        if (recording) {
            this.playbackTime = 0;
        }

        if (this.turtles.running()) {
            console.debug(this.turtles.running() + " PUNTING");
            if (this.playbackTime === 0) return;
            else {
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

                    var sortedList = playbackList.sort(function(a, b) {
                        if (a[1][0] === b[1][0]) {
                            // Preserve original order if the events
                            // have the same time stamp.
                            return a[0] - b[0];
                        } else {
                            return a[1][0] - b[1][0];
                        }
                    });
                }
            }
        }

        console.debug(playbackList.length);

        var d = new Date();
        this.firstNoteTime = d.getTime() - 1000 * this.playbackTime;

        var l = 0;
        if (this.progressBarWidth >= 100) {
            this.progressBarWidth = 0;
        }

        for (var turtle in this.playbackQueue) {
            // For multiple voices
            l += this.playbackQueue[turtle].length;
        }

        if (t in this.playbackQueue && l > 0) {
            this.progressBarDivision = 100 / this.playbackQueue[t].length;
        } else {
            // nothing to do...
            this.progressBarDivision = 100;
        }

        var turtleCount = 0;
        var inLoop = 0;

        __playbackLoop = function(turtle, idx) {
            inLoop++;
            that.playbackTime = that.playbackQueue[turtle][idx][0];

            if (turtleCount === 0) {
                //Not sure if that happens...but just in case
                turtleCount = 1;
            }

            that.progressBarWidth =
                that.progressBarWidth + that.progressBarDivision / turtleCount;

            if (inLoop === l || that.progressBarWidth > 100) {
                that.progressBarWidth = 100;
            }

            if (that.progressBarWidth === NaN) {
                //Not sure if that happens...but just in case
                that.progressBar.style.visibility = "hidden";
            }

            that.progressBar.style.width = that.progressBarWidth + "%";
            that.progressBar.innerHTML =
                parseInt(that.progressBarWidth * 1) + "%";

            if (!that.stopTurtle) {
                switch (that.playbackQueue[turtle][idx][1]) {
                    case "fill":
                        if (inFillClamp) {
                            that.turtles.turtleList[turtle].doEndFill();
                            inFillClamp = false;
                        } else {
                            that.turtles.turtleList[turtle].doStartFill();
                            inFillClamp = true;
                        }
                        break;
                    case "hollowline":
                        if (inHollowLineClamp) {
                            that.turtles.turtleList[turtle].doEndHollowLine();
                            inHollowLineClamp = false;
                        } else {
                            that.turtles.turtleList[turtle].doStartHollowLine();
                            inHollowLineClamp = true;
                        }
                        break;
                    case "notes":
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            if (that.blinkState) {
                                that.turtles.turtleList[turtle].blink(
                                    that.playbackQueue[turtle][idx][3],
                                    50
                                );
                            }

                            that.lastNote[turtle] =
                                that.playbackQueue[turtle][idx][3];
                            that.synth.trigger(
                                turtle,
                                that.playbackQueue[turtle][idx][2],
                                that.playbackQueue[turtle][idx][3],
                                that.playbackQueue[turtle][idx][4],
                                that.playbackQueue[turtle][idx][5],
                                that.playbackQueue[turtle][idx][6]
                            );
                        }
                        break;
                    case "controlpoint1":
                        that.cp1x[turtle] = that.playbackQueue[turtle][idx][2];
                        that.cp1y[turtle] = that.playbackQueue[turtle][idx][3];
                        break;
                    case "controlpoint2":
                        that.cp2x[turtle] = that.playbackQueue[turtle][idx][2];
                        that.cp2y[turtle] = that.playbackQueue[turtle][idx][3];
                        break;
                    case "bezier":
                        that.turtles.turtleList[turtle].doBezier(
                            that.cp1x[turtle],
                            that.cp1y[turtle],
                            that.cp2x[turtle],
                            that.cp2y[turtle],
                            that.playbackQueue[turtle][idx][2],
                            that.playbackQueue[turtle][idx][3]
                        );
                        break;
                    case "show":
                        that._processShow(
                            turtle,
                            null,
                            that.playbackQueue[turtle][idx][2],
                            that.playbackQueue[turtle][idx][3]
                        );
                        break;
                    case "speak":
                        that._processSpeak(that.playbackQueue[turtle][idx][2]);
                        break;
                    case "print":
                        that.textMsg(
                            that.playbackQueue[turtle][idx][2].toString()
                        );
                        break;
                    case "setvolume":
                        that._setMasterVolume(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "setsynthvolume":
                        that.setSynthVolume(
                            turtle,
                            that.playbackQueue[turtle][idx][2],
                            that.playbackQueue[turtle][idx][3]
                        );
                        break;
                    case "arc":
                        that.turtles.turtleList[turtle].doArc(
                            that.playbackQueue[turtle][idx][2],
                            that.playbackQueue[turtle][idx][3]
                        );
                        break;
                    case "setxy":
                        that.turtles.turtleList[turtle].doSetXY(
                            that.playbackQueue[turtle][idx][2],
                            that.playbackQueue[turtle][idx][3]
                        );
                        break;
                    case "scrollxy":
                        that.turtles.turtleList[turtle].doSetXY(
                            that.playbackQueue[turtle][idx][2],
                            that.playbackQueue[turtle][idx][3]
                        );
                        break;
                    case "forward":
                        that.turtles.turtleList[turtle].doForward(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "right":
                        that.turtles.turtleList[turtle].doRight(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "setheading":
                        that.turtles.turtleList[turtle].doSetHeading(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "clear":
                        that.svgBackground = true;
                        that.turtles.turtleList[turtle].penState = false;
                        that.turtles.turtleList[turtle].doSetHeading(0);
                        that.turtles.turtleList[turtle].doSetXY(0, 0);
                        that.turtles.turtleList[turtle].penState = true;
                        // that.turtles.turtleList[turtle].doClear(true, true, true);
                        break;
                    case "setcolor":
                        that.turtles.turtleList[turtle].doSetColor(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "sethue":
                        that.turtles.turtleList[turtle].doSetHue(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "setshade":
                        that.turtles.turtleList[turtle].doSetValue(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "settranslucency":
                        that.turtles.turtleList[turtle].doSetPenAlpha(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "setgrey":
                        that.turtles.turtleList[turtle].doSetChroma(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "setpensize":
                        that.turtles.turtleList[turtle].doSetPensize(
                            that.playbackQueue[turtle][idx][2]
                        );
                        break;
                    case "penup":
                        that.turtles.turtleList[turtle].doPenUp();
                        break;
                    case "pendown":
                        that.turtles.turtleList[turtle].doPenDown();
                        break;
                    default:
                        console.debug(that.playbackQueue[turtle][idx][1]);
                        break;
                }

                var d = new Date();
                var elapsedTime = d.getTime() - that.firstNoteTime;
                idx += 1;
                if (that.playbackQueue[turtle].length > idx) {
                    var timeout =
                        that.playbackQueue[turtle][idx][0] * 1000 - elapsedTime;
                    if (timeout < 0) {
                        timeout = 0;
                    }

                    setTimeout(function() {
                        __playbackLoop(turtle, idx);
                    }, timeout);
                } else {
                    if (turtle < that.turtles.turtleList.length) {
                        that.turtles.turtleList[turtle].running = false;
                    }

                    if (!that.turtles.running()) {
                        that.onStopTurtle();
                        that.playbackTime = 0;
                        if (recording) {
                            var lastNote = 0;
                            for (var turtle in that.playbackQueue) {
                                if (that.lastNote[turtle] > lastNote) {
                                    lastNote = that.lastNote[turtle];
                                }
                            }

                            setTimeout(function() {
                                console.debug("FINISHING RECORDING");
                                that.synth.recorder.stop();
                                that.synth.recorder.exportWAV(
                                    save.afterSaveWAV.bind(save)
                                );
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

        __playback = function(turtle) {
            turtleCount++;
            setTimeout(function() {
                __playbackLoop(turtle, 0);
            }, that.playbackQueue[turtle][0][0] * 1000);
        };

        __resumePlayback = function(turtle) {
            turtleCount++;
            for (var idx = 0; idx < that.playbackQueue[turtle].length; idx++) {
                if (that.playbackQueue[turtle][idx][0] >= that.playbackTime) {
                    break;
                }
            }

            console.debug("resume index: " + idx);

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
            console.debug("RECORDING");
            this.synth.recorder.clear();
            this.synth.recorder.record();
        }

        console.debug(this.playbackQueue);

        if (whichMouse < 0) {
            for (var turtle in this.playbackQueue) {
                this.lastNote[turtle] = 0;
                if (this.playbackQueue[turtle].length > 0) {
                    if (turtle < this.turtles.turtleList.length) {
                        this.turtles.turtleList[turtle].running = true;
                    }
                    if (recording) {
                        console.debug("recording");
                        __playback(turtle);
                    } else if (this.playbackTime > 0) {
                        console.debug("resuming play at " + this.playbackTime);
                        __resumePlayback(turtle);
                    } else {
                        console.debug("play");
                        __playback(turtle);
                    }
                }
            }
        } else if (whichMouse < this.turtles.turtleList.length) {
            this.turtles.turtleList[whichMouse].running = true;
            __playback(whichMouse);
        }
    };

    /**
     * Dispatches turtle signals to update turtle graphics.
     * @privileged
     * @param   turtle
     * @param   {number}    beatValue
     * @param   blk
     * @param   {number}    delay
     * @returns {void}
     */
    this._dispatchTurtleSignals = async function(
        turtle,
        beatValue,
        blk,
        delay
    ) {
        // When turtle commands (forward, right, arc) are inside of notes,
        // they are run progressively over the course of the note duration.
        if (!turtle in this.embeddedGraphics) {
            console.debug(
                "Could not find turtle " + turtle + "in embeddedGraphics."
            );
            return;
        }

        if (!blk in this.embeddedGraphics[turtle]) {
            console.debug("Could not find blk " + blk + "in embeddedGraphics.");
            return;
        }

        if (this.embeddedGraphics[turtle][blk].length === 0) return;

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
                switch (name) {
                    case "penup":
                        that.turtles.turtleList[turtle].doPenUp();
                        break;
                    case "pendown":
                        that.turtles.turtleList[turtle].doPenDown();
                        break;
                    case "setcolor":
                        that.turtles.turtleList[turtle].doSetColor(arg);
                        break;
                    case "sethue":
                        that.turtles.turtleList[turtle].doSetHue(arg);
                        break;
                    case "setshade":
                        that.turtles.turtleList[turtle].doSetValue(arg);
                        break;
                    case "settranslucency":
                        that.turtles.turtleList[turtle].doSetPenAlpha(arg);
                        break;
                    case "setgrey":
                        that.turtles.turtleList[turtle].doSetChroma(arg);
                        break;
                    case "setpensize":
                        that.turtles.turtleList[turtle].doSetPensize(arg);
                        break;
                }
            }

            if (suppressOutput) {
                _penSwitch(name);
            } else {
                setTimeout(function() {
                    _penSwitch(name);
                }, timeout);
            }
        }

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
        }

        function __right(turtle, arg, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doRight(arg);
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function() {
                    that.turtles.turtleList[turtle].doRight(arg);
                }, timeout);
            }
        }

        function __setheading(turtle, arg, timeout) {
            if (suppressOutput) {
                that.turtles.turtleList[turtle].doSetHeading(arg);
            } else {
                setTimeout(function() {
                    that.turtles.turtleList[turtle].doSetHeading(arg);
                }, timeout);
            }
        }

        function __forward(turtle, arg, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doForward(arg);
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function() {
                    that.turtles.turtleList[turtle].doForward(arg);
                }, timeout);
            }
        }

        function __scrollxy(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                that.turtles.turtleList[turtle].doScrollXY(arg1, arg2);
            } else {
                setTimeout(function() {
                    that.turtles.turtleList[turtle].doScrollXY(arg1, arg2);
                }, timeout);
            }
        }

        function __setxy(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doSetXY(arg1, arg2);
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function() {
                    that.turtles.turtleList[turtle].doSetXY(arg1, arg2);
                }, timeout);
            }
        }

        function __show(turtle, arg1, arg2, timeout) {
            if (suppressOutput) return;

            setTimeout(function() {
                that._processShow(turtle, null, arg1, arg2);
            }, timeout);
        }

        function __speak(turtle, arg, timeout) {
            if (suppressOutput) return;

            setTimeout(function() {
                that._processSpeak(arg);
            }, timeout);
        }

        function __print(arg, timeout) {
            if (suppressOutput) return;

            setTimeout(function() {
                that.textMsg(arg.toString());
            }, timeout);
        }

        function __arc(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doArc(arg1, arg2);
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function() {
                    that.turtles.turtleList[turtle].doArc(arg1, arg2);
                }, timeout);
            }
        }

        function __cp1(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                that.cp1x[turtle] = arg1;
                that.cp1y[turtle] = arg2;
            } else {
                setTimeout(function() {
                    that.cp1x[turtle] = arg1;
                    that.cp1y[turtle] = arg2;
                }, timeout);
            }
        }

        function __cp2(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                that.cp2x[turtle] = arg1;
                that.cp2y[turtle] = arg2;
            } else {
                setTimeout(function() {
                    that.cp2x[turtle] = arg1;
                    that.cp2y[turtle] = arg2;
                }, timeout);
            }
        }

        function __bezier(turtle, arg1, arg2, timeout) {
            if (suppressOutput) {
                var savedPenState = that.turtles.turtleList[turtle].penState;
                that.turtles.turtleList[turtle].penState = false;
                that.turtles.turtleList[turtle].doBezier(
                    that.cp1x[turtle],
                    that.cp1y[turtle],
                    that.cp2x[turtle],
                    that.cp2y[turtle],
                    arg1,
                    arg2
                );
                that.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(function() {
                    that.turtles.turtleList[turtle].doBezier(
                        that.cp1x[turtle],
                        that.cp1y[turtle],
                        that.cp2x[turtle],
                        that.cp2y[turtle],
                        arg1,
                        arg2
                    );
                }, timeout);
            }
        }

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
                setTimeout(function() {
                    if (inFillClamp) {
                        that.turtles.turtleList[turtle].doEndFill();
                        inFillClamp = false;
                    } else {
                        that.turtles.turtleList[turtle].doStartFill();
                        inFillClamp = true;
                    }
                }, timeout);
            }
        }

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
                setTimeout(function() {
                    if (inHollowLineClamp) {
                        that.turtles.turtleList[turtle].doEndHollowLine();
                        inHollowLineClamp = false;
                    } else {
                        that.turtles.turtleList[turtle].doStartHollowLine();
                        inHollowLineClamp = true;
                    }
                }, timeout);
            }
        }

        var extendedGraphicsCounter = 0;
        for (var i = 0; i < this.embeddedGraphics[turtle][blk].length; i++) {
            var b = this.embeddedGraphics[turtle][blk][i];
            switch (this.blocks.blockList[b].name) {
                case "forward":
                case "back":
                case "right":
                case "left":
                case "arc":
                    extendedGraphicsCounter += 1;
                    break;
                default:
                    break;
            }
        }

        // Cheat by 0.5% so that the mouse has time to complete its work.
        // var stepTime = beatValue * 1000 / NOTEDIV;
        var stepTime = ((beatValue - delay) * 995) / NOTEDIV;
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

        for (var i = 0; i < this.embeddedGraphics[turtle][blk].length; i++) {
            var b = this.embeddedGraphics[turtle][blk][i];
            var name = this.blocks.blockList[b].name;
            switch (name) {
                case "setcolor":
                case "sethue":
                case "setshade":
                case "settranslucency":
                case "setgrey":
                case "setpensize":
                    var arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    __pen(turtle, name, arg, waitTime);

                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        name,
                        arg
                    ]);
                    break;
                case "penup":
                case "pendown":
                    if (!suppressOutput) {
                        __pen(turtle, name, null, waitTime);
                    }

                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        name
                    ]);
                    break;
                case "clear":
                    __clear(turtle, waitTime);
                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "clear"
                    ]);
                    break;
                case "fill":
                    __fill(turtle, waitTime);
                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "fill"
                    ]);
                    break;
                case "hollowline":
                    __hollowline(turtle, waitTime);

                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "hollowline"
                    ]);
                    break;
                case "controlpoint1":
                    var arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    var arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    __cp1(turtle, arg1, arg2, waitTime);

                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "controlpoint1",
                        arg1,
                        arg2
                    ]);
                    break;
                case "controlpoint2":
                    var arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    var arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    __cp2(turtle, arg1, arg2, waitTime);

                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "controlpoint2",
                        arg1,
                        arg2
                    ]);
                    break;
                case "bezier":
                    // TODO: Is there a reasonable way to break the bezier
                    // curve up into small steps?
                    var arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    var arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    __bezier(turtle, arg1, arg2, waitTime);
                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "bezier",
                        arg1,
                        arg2
                    ]);
                    break;
                case "setheading":
                    var arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    __setheading(turtle, arg, waitTime);
                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "setheading",
                        arg
                    ]);
                    break;
                case "right":
                    var arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    for (
                        var t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        var deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        var deltaArg =
                            arg / (NOTEDIV / this.dispatchFactor[turtle]);
                        __right(turtle, deltaArg, deltaTime);
                        this.playbackQueue[turtle].push([
                            this.previousTurtleTime[turtle] + deltaTime / 1000,
                            "right",
                            deltaArg
                        ]);
                    }

                    waitTime += NOTEDIV * stepTime;
                    break;
                case "left":
                    var arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    for (
                        var t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        var deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        var deltaArg =
                            arg / (NOTEDIV / this.dispatchFactor[turtle]);
                        __right(turtle, -deltaArg, deltaTime);
                        this.playbackQueue[turtle].push([
                            this.previousTurtleTime[turtle] + deltaTime / 1000,
                            "right",
                            -deltaArg
                        ]);
                    }

                    waitTime += NOTEDIV * stepTime;
                    break;
                case "forward":
                    var arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    for (
                        var t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        var deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        var deltaArg =
                            arg / (NOTEDIV / this.dispatchFactor[turtle]);
                        __forward(turtle, deltaArg, deltaTime);
                        this.playbackQueue[turtle].push([
                            this.previousTurtleTime[turtle] + deltaTime / 1000,
                            "forward",
                            deltaArg
                        ]);
                    }

                    waitTime += NOTEDIV * stepTime;
                    break;
                case "back":
                    var arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    for (
                        var t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        var deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        var deltaArg =
                            arg / (NOTEDIV / this.dispatchFactor[turtle]);
                        __forward(turtle, -deltaArg, deltaTime);
                        this.playbackQueue[turtle].push([
                            this.previousTurtleTime[turtle] + deltaTime / 1000,
                            "forward",
                            -deltaArg
                        ]);
                    }

                    waitTime += NOTEDIV * stepTime;
                    break;
                case "setxy":
                    var arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    var arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    __setxy(turtle, arg1, arg2, waitTime);
                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "setxy",
                        arg1,
                        arg2
                    ]);
                    break;
                case "scrollxy":
                    var arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    var arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    __scrollxy(turtle, arg1, arg2, waitTime);
                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "scrollxy",
                        arg1,
                        arg2
                    ]);
                    break;
                case "show":
                    var arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    var arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    __show(turtle, arg1, arg2, waitTime);
                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "show",
                        arg1,
                        arg2
                    ]);
                    break;
                case "speak":
                    var arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    __speak(turtle, arg, waitTime);
                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "speak",
                        arg
                    ]);
                    break;
                case "print":
                    var arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    __print(arg, waitTime);
                    this.playbackQueue[turtle].push([
                        this.previousTurtleTime[turtle] + waitTime / 1000,
                        "print",
                        arg
                    ]);
                    break;
                case "arc":
                    var arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    var arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    for (
                        var t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        var deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        var deltaArg =
                            arg1 / (NOTEDIV / this.dispatchFactor[turtle]);
                        __arc(turtle, deltaArg, arg2, deltaTime);
                        this.playbackQueue[turtle].push([
                            this.previousTurtleTime[turtle] + deltaTime / 1000,
                            "arc",
                            deltaArg,
                            arg2
                        ]);
                    }

                    waitTime += NOTEDIV * stepTime;
                    break;
                default:
                    console.debug(
                        name + " is not supported inside of Note Blocks"
                    );
                    break;
            }
        }

        // Mark the end time of this note's graphics operations.
        await delayExecution(beatValue * 1000);
        this.embeddedGraphicsFinished[turtle] = true;
    };

    /**
     * Sets a named listener after removing any existing listener in the same place.
     * @privileged
     * @param   turtle
     * @param   {string}    listenerName
     * @param   {Function}  listener
     * @returns {void}
     */
    this._setListener = function(turtle, listenerName, listener) {
        if (listenerName in this.turtles.turtleList[turtle].listeners) {
            this.stage.removeEventListener(
                listenerName,
                this.turtles.turtleList[turtle].listeners[listenerName],
                false
            );
        }

        this.turtles.turtleList[turtle].listeners[listenerName] = listener;
        this.stage.addEventListener(listenerName, listener, false);
    };

    /**
     * Sets a single dispatch block.
     * @privileged
     * @param   blk
     * @param   turtle
     * @param   {string}    listenerName
     * @returns {void}
     */
    this._setDispatchBlock = function(blk, turtle, listenerName) {
        if (!this.inDuplicate[turtle] && this.backward[turtle].length > 0) {
            if (
                this.blocks.blockList[last(this.backward[turtle])].name ===
                "backward"
            ) {
                var c = 1;
            } else {
                var c = 2;
            }

            if (
                this.blocks.sameGeneration(
                    this.blocks.blockList[last(this.backward[turtle])]
                        .connections[c],
                    blk
                )
            ) {
                var nextBlock = this.blocks.blockList[blk].connections[0];
                if (nextBlock in this.endOfClampSignals[turtle]) {
                    this.endOfClampSignals[turtle][nextBlock].push(
                        listenerName
                    );
                } else {
                    this.endOfClampSignals[turtle][nextBlock] = [listenerName];
                }
            } else {
                var nextBlock = last(this.blocks.blockList[blk].connections);
                if (nextBlock != null) {
                    if (nextBlock in this.endOfClampSignals[turtle]) {
                        this.endOfClampSignals[turtle][nextBlock].push(
                            listenerName
                        );
                    } else {
                        this.endOfClampSignals[turtle][nextBlock] = [
                            listenerName
                        ];
                    }
                }
            }
        } else {
            var nextBlock = last(this.blocks.blockList[blk].connections);
            if (nextBlock != null) {
                if (nextBlock in this.endOfClampSignals[turtle]) {
                    this.endOfClampSignals[turtle][nextBlock].push(
                        listenerName
                    );
                } else {
                    this.endOfClampSignals[turtle][nextBlock] = [listenerName];
                }
            }
        }
    };

    /**
     * Initialises and starts a default synth.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.resetSynth = function(turtle) {
        if (!("electronic synth" in instruments[turtle])) {
            this.synth.createDefaultSynth(turtle);
        }

        this._setMasterVolume(DEFAULTVOLUME);
        for (var synth in this.synthVolume[turtle]) {
            this.setSynthVolume(turtle, synth, DEFAULTVOLUME);
        }

        this.synth.start();
    };

    /**
     * Speaks all characters in the range of comma, full stop, space, A to Z, a to z in the input text.
     * @privileged
     * @param   {string}    text
     * @returns {void}
     */
    this._processSpeak = function(text) {
        var new_text = "";
        for (var i in text) {
            if (new RegExp("^[A-Za-z,. ]$").test(text[i])) new_text += text[i];
        }

        if (this.meSpeak !== null) {
            this.meSpeak.speak(new_text);
        }
    };

    /**
     * Shows information: with camera, in image form, at URL, as text.
     * @privileged
     * @param   turtle
     * @param   blk
     * @param   arg0
     * @param   arg1
     * @returns {void}
     */
    this._processShow = function(turtle, blk, arg0, arg1) {
        if (typeof arg1 === "string") {
            var len = arg1.length;
            if (len === 14 && arg1.substr(0, 14) === CAMERAVALUE) {
                doUseCamera(
                    [arg0],
                    this.turtles,
                    turtle,
                    false,
                    this.cameraID,
                    this.setCameraID,
                    this.errorMsg
                );
            } else if (len === 13 && arg1.substr(0, 13) === VIDEOVALUE) {
                doUseCamera(
                    [arg0],
                    this.turtles,
                    turtle,
                    true,
                    this.cameraID,
                    this.setCameraID,
                    this.errorMsg
                );
            } else if (len > 10 && arg1.substr(0, 10) === "data:image") {
                this.turtles.turtleList[turtle].doShowImage(arg0, arg1);
            } else if (len > 8 && arg1.substr(0, 8) === "https://") {
                this.turtles.turtleList[turtle].doShowURL(arg0, arg1);
            } else if (len > 7 && arg1.substr(0, 7) === "http://") {
                this.turtles.turtleList[turtle].doShowURL(arg0, arg1);
            } else if (len > 7 && arg1.substr(0, 7) === "file://") {
                this.turtles.turtleList[turtle].doShowURL(arg0, arg1);
            } else {
                this.turtles.turtleList[turtle].doShowText(arg0, arg1);
            }
        } else if (
            typeof arg1 === "object" &&
            blk !== null &&
            this.blocks.blockList[this.blocks.blockList[blk].connections[2]]
                .name === "loadFile"
        ) {
            if (arg1) {
                this.turtles.turtleList[turtle].doShowText(arg0, arg1[1]);
            } else {
                this.errorMsg(_("You must select a file."));
            }
        } else {
            this.turtles.turtleList[turtle].doShowText(arg0, arg1);
        }
    };

    /**
     * The target-turtle name can be a string or an int. Makes sure there is a turtle by this name and then finds the associated start block.
     * @privileged
     * @param   {number|string} targetTurtle
     * @returns {number|object}
     */
    this._getTargetTurtle = function(targetTurtle) {
        // We'll compare the names as strings.
        if (typeof targetTurtle === "number") {
            targetTurtle = targetTurtle.toString();
        }

        for (var i = 0; i < this.turtles.turtleList.length; i++) {
            if (!this.turtles.turtleList[i].trash) {
                var turtleName = this.turtles.turtleList[i].name;
                if (typeof turtleName === "number") {
                    turtleName = turtleName.toString();
                }

                if (turtleName === targetTurtle) {
                    return i;
                }
            }
        }

        return null;
    };

    /**
     * If the input name is forever, repeat, while or until, returns true (false otherwise).
     * @privileged
     * @param   {string}    name
     * @returns {boolean}
     */ this._loopBlock = function(name) {
        return ["forever", "repeat", "while", "until"].indexOf(name) !== -1;
    };

    /**
     * Breaks a loop.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this._doBreak = function(turtle) {
        // Look for a parent loopBlock in queue and set its count to 1.
        var parentLoopBlock = null;
        var loopBlkIdx = -1;
        var queueLength = this.turtles.turtleList[turtle].queue.length;
        for (var i = queueLength - 1; i > -1; i--) {
            if (
                this._loopBlock(
                    this.blocks.blockList[
                        this.turtles.turtleList[turtle].queue[i].blk
                    ].name
                )
            ) {
                // while or until
                loopBlkIdx = this.turtles.turtleList[turtle].queue[i].blk;
                parentLoopBlock = this.blocks.blockList[loopBlkIdx];
                // Flush the parent from the queue.
                this.turtles.turtleList[turtle].queue.pop();
                break;
            } else if (
                this._loopBlock(
                    this.blocks.blockList[
                        this.turtles.turtleList[turtle].queue[i].parentBlk
                    ].name
                )
            ) {
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
        if (
            parentLoopBlock.name === "while" ||
            parentLoopBlock.name === "until"
        ) {
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

    /**
     * Parses receivedArg.
     * @privileged
     * @param   that
     * @param   turtle
     * @param   blk
     * @param   parentBlk
     * @param   receivedArg
     * @returns {mixed}
     */
    this.parseArg = function(that, turtle, blk, parentBlk, receivedArg) {
        var logo = that; // For plugin backward compatibility

        // Retrieve the value of a block.
        if (blk == null) {
            that.errorMsg(NOINPUTERRORMSG, parentBlk);
            // that.stopTurtle = true;
            return null;
        }

        if (that.blocks.blockList[blk].protoblock.parameter) {
            if (turtle in that.parameterQueue) {
                if (that.parameterQueue[turtle].indexOf(blk) === -1) {
                    that.parameterQueue[turtle].push(blk);
                }
            } else {
                // console.debug('turtle ' + turtle + ' has no parameterQueue');
            }
        }

        if (typeof that.blocks.blockList[blk].protoblock.arg === "function")
            return (that.blocks.blockList[blk].value = that.blocks.blockList[
                blk
            ].protoblock.arg(that, turtle, blk, receivedArg));

        if (that.blocks.blockList[blk].name === "intervalname") {
            if (typeof that.blocks.blockList[blk].value === "string") {
                that.noteDirection[turtle] = getIntervalDirection(
                    that.blocks.blockList[blk].value
                );
                return getIntervalNumber(that.blocks.blockList[blk].value);
            } else return 0;
        } else if (that.blocks.blockList[blk].isValueBlock()) {
            if (that.blocks.blockList[blk].name in that.evalArgDict) {
                eval(that.evalArgDict[that.blocks.blockList[blk].name]);
            }

            return that.blocks.blockList[blk].value;
        } else if (
            ["anyout", "numberout", "textout", "booleanout"].indexOf(
                that.blocks.blockList[blk].protoblock.dockTypes[0]
            ) !== -1
        ) {
            switch (that.blocks.blockList[blk].name) {
                case "dectofrac":
                    if (
                        that.inStatusMatrix &&
                        that.blocks.blockList[
                            that.blocks.blockList[blk].connections[0]
                        ].name === "print"
                    ) {
                        that.statusFields.push([blk, "dectofrac"]);
                    } else {
                        var cblk = that.blocks.blockList[blk].connections[1];
                        if (cblk === null) {
                            that.errorMsg(NOINPUTERRORMSG, blk);
                            that.blocks.blockList[blk].value = 0;
                        } else {
                            var a = that.parseArg(
                                that,
                                turtle,
                                cblk,
                                blk,
                                receivedArg
                            );
                            if (typeof a === "number") {
                                if (a < 0) {
                                    a = a * -1;
                                    that.blocks.blockList[blk].value =
                                        "-" + mixedNumber(a);
                                } else {
                                    that.blocks.blockList[
                                        blk
                                    ].value = mixedNumber(a);
                                }
                            } else {
                                that.errorMsg(NANERRORMSG, blk);
                                that.blocks.blockList[blk].value = 0;
                            }
                        }
                    }
                    break;
                case "hue":
                    if (
                        that.inStatusMatrix &&
                        that.blocks.blockList[
                            that.blocks.blockList[blk].connections[0]
                        ].name === "print"
                    ) {
                        that.statusFields.push([blk, "color"]);
                    } else {
                        that.blocks.blockList[blk].value =
                            that.turtles.turtleList[turtle].color;
                    }
                    break;
                case "returnValue":
                    // deprecated
                    if (that.returns[turtle].length > 0) {
                        that.blocks.blockList[blk].value = that.returns[
                            turtle
                        ].pop();
                    } else {
                        console.debug("WARNING: No return value.");
                        that.blocks.blockList[blk].value = 0;
                    }
                    break;
                default:
                    if (that.blocks.blockList[blk].name in that.evalArgDict) {
                        eval(that.evalArgDict[that.blocks.blockList[blk].name]);
                    } else {
                        console.error(
                            "I do not know how to " +
                                that.blocks.blockList[blk].name
                        );
                    }
                    break;
            }

            return that.blocks.blockList[blk].value;
        } else {
            return blk;
        }
    };

    /**
     * Counts notes, with saving of the box, heap and turtle states.
     * @privileged
     * @param   turtle
     * @param   cblk
     * @returns {number}
     */
    this._noteCounter = function(turtle, cblk) {
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
                for (
                    var i = 0;
                    i < this.endOfClampSignals[turtle][b].length;
                    i++
                ) {
                    this.butNotThese[turtle][b].push(i);
                }
            }

            var actionArgs = [];
            var saveNoteCount = this.notesPlayed[turtle];
            this.turtles.turtleList[turtle].running = true;

            if (this.inNoteBlock[turtle]) {
                this.whichNoteToCount[turtle] += this.inNoteBlock[
                    turtle
                ].length;
            }

            this._runFromBlockNow(
                this,
                turtle,
                cblk,
                true,
                actionArgs,
                this.turtles.turtleList[turtle].queue.length
            );

            var returnValue = rationalSum(this.notesPlayed[turtle], [
                -saveNoteCount[0],
                saveNoteCount[1]
            ]);
            this.notesPlayed[turtle] = saveNoteCount;

            // Restore previous state
            console.debug(saveBoxes);
            this.boxes = JSON.parse(saveBoxes);
            console.debug(saveTurtleHeaps);
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

        return returnValue[0] / returnValue[1];
    };

    /**
     * Makes the turtle wait.
     * @privileged
     * @param   turtle
     * @param   secs
     * @returns {void}
     */
    this._doWait = function(turtle, secs) {
        this.waitTimes[turtle] = Number(secs) * 1000;
    };

    /**
     * Returns a random integer in a range.
     * @privileged
     * @param   a   Preferably the mininimum.
     * @param   b   Preferably the maximum.
     * @returns {number}
     */
    this._doRandom = function(a, b) {
        if (typeof a === "string" || typeof b === "string") {
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

        return Math.floor(
            Math.random() * (Number(b) - Number(a) + 1) + Number(a)
        );
    };

    /**
     * Randomly returns either a or b.
     * @privileged
     * @param   a
     * @param   b
     * @returns {*}
     */
    this._doOneOf = function(a, b) {
        if (Math.random() < 0.5) {
            return a;
        } else {
            return b;
        }
    };

    /**
     * Returns a modulo b.
     * @privileged
     * @param   a
     * @param   b
     * @returns {number}
     */
    this._doMod = function(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) % Number(b);
    };

    /**
     * Square-roots a number.
     * @privileged
     * @param   a
     * @returns {number}
     */
    this._doSqrt = function(a) {
        if (typeof a === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.sqrt(Number(a));
    };

    /**
     * Adds a and b.
     * @privileged
     * @param   a
     * @param   b
     * @returns {number|string}
     */
    this._doPlus = function(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            if (typeof a === "string") {
                var aString = a;
            } else {
                var aString = a.toString();
            }

            if (typeof b === "string") {
                var bString = b;
            } else {
                var bString = b.toString();
            }

            return aString + bString;
        } else {
            return Number(a) + Number(b);
        }
    };

    /**
     * Subtracts b from a.
     * @privileged
     * @param   a
     * @param   b
     * @returns {number}
     */
    this._doMinus = function(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) - Number(b);
    };

    /**
     * Multiplies a by b.
     * @privileged
     * @param   a
     * @param   b
     * @returns {number}
     */
    this._doMultiply = function(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) * Number(b);
    };

    /**
     * calculate euclidean distance between (cursor x, cursor y) and (mouse 'x' and mouse 'y')
     * @privileged
     * @param   a
     * @param   b
     * @param   c
     * @param   d
     * @returns {number}
     */
    this._docalculatedistance = function(x1, y1, x2, y2) {
        if (
            typeof x1 === "string" ||
            typeof y1 === "string" ||
            typeof x2 === "string" ||
            typeof y2 === "string"
        ) {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        if (x1 === x2 && y1 === y2) {
            return 0;
        }

        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    };

    /**
     * Returns a to the power of b.
     * @privileged
     * @param   a
     * @param   b
     * @returns {number}
     */
    this._doPower = function(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.pow(a, b);
    };

    /**
     * Divides a by b.
     * @privileged
     * @param   a
     * @param   b
     * @returns {number}
     */
    this._doDivide = function(a, b) {
        if (typeof a === "string" || typeof b === "string") {
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

    /**
     * Changes body background in DOM to current colour.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.setBackgroundColor = function(turtle) {
        if (turtle === -1) var c = platformColor.background;
        else {
            var c = this.turtles.turtleList[turtle].canvasColor;
        }

        // docById('myCanvas').style.background = c;
        this.turtles.backgroundColor = c;
        this.turtles.makeBackground(this.turtles.isShrunk);

        this.svgOutput = "";
    };

    /**
     * Sets the cameraID property.
     * @privileged
     * @param   id
     * @returns {void}
     */
    this.setCameraID = function(id) {
        this.cameraID = id;
    };

    /**
     * Hides all the blocks.
     * @privileged
     * @returns {void}
     */
    this.hideBlocks = function(show) {
        this.blocks.palettes.hide();
        this.blocks.hide();
        this.refreshCanvas();
        this.showBlocksAfterRun = show !== undefined && show;
    };

    /**
     * Shows all the blocks.
     * @privileged
     * @returns {void}
     */
    this.showBlocks = function() {
        this.blocks.palettes.show();
        this.blocks.show();
        this.blocks.bringToTop();
        this.refreshCanvas();
    };

    /**
     * Calculates the change needed for musical inversion.
     * @privileged
     * @param   turtle
     * @param   note
     * @param   octave
     * @returns {number}
     */
    this._calculateInvert = function(turtle, note, octave) {
        var delta = 0;
        var len = this.invertList[turtle].length;
        var note1 = getNote(
            note,
            octave,
            0,
            this.keySignature[turtle],
            this.moveable[turtle],
            null,
            this.errorMsg
        );
        var num1 =
            pitchToNumber(note1[0], note1[1], this.keySignature[turtle]) -
            this.pitchNumberOffset[turtle];

        for (var i = len - 1; i > -1; i--) {
            var note2 = getNote(
                this.invertList[turtle][i][0],
                this.invertList[turtle][i][1],
                0,
                this.keySignature[turtle],
                this.moveable[turtle],
                null,
                this.errorMsg
            );
            var num2 =
                pitchToNumber(note2[0], note2[1], this.keySignature[turtle]) -
                this.pitchNumberOffset[turtle];
            if (this.invertList[turtle][i][2] === "even") {
                delta += num2 - num1;
                num1 += 2 * delta;
            } else if (this.invertList[turtle][i][2] === "odd") {
                delta += num2 - num1 + 0.5;
                num1 += 2 * delta;
            } else {
                // We need to calculate the scalar difference.
                var scalarSteps = this._scalarDistance(turtle, num2, num1);
                var note3 = this._addScalarTransposition(
                    turtle,
                    note2[0],
                    note2[1],
                    -scalarSteps
                );
                var num3 =
                    pitchToNumber(
                        note3[0],
                        note3[1],
                        this.keySignature[turtle]
                    ) - this.pitchNumberOffset[turtle];
                delta += (num3 - num1) / 2;
                num1 = num3;
            }
        }

        return delta;
    };

    /**
     * Shifts pitches by n steps relative to the provided scale.
     * @privileged
     * @param   turtle
     * @param   note
     * @param   octave
     * @param   {number}    n
     * @returns {object}
     */
    this._addScalarTransposition = function(turtle, note, octave, n) {
        if (n > 0) {
            var noteObj = getNote(
                note,
                octave,
                0,
                this.keySignature[turtle],
                this.moveable[turtle],
                null,
                this.errorMsg,
                this.synth.inTemperament
            );
            if (this.synth.inTemperament == "custom") {
                var value = getStepSizeUp(
                    this.keySignature[turtle],
                    noteObj[0],
                    n,
                    this.synth.inTemperament
                );
                noteObj = getNote(
                    noteObj[0],
                    noteObj[1],
                    value,
                    this.keySignature[turtle],
                    this.moveable[turtle],
                    null,
                    this.errorMsg,
                    this.synth.inTemperament
                );
            } else {
                for (var i = 0; i < n; i++) {
                    var value = getStepSizeUp(
                        this.keySignature[turtle],
                        noteObj[0]
                    );
                    noteObj = getNote(
                        noteObj[0],
                        noteObj[1],
                        value,
                        this.keySignature[turtle],
                        this.moveable[turtle],
                        null,
                        this.errorMsg,
                        this.synth.inTemperament
                    );
                }
            }
        } else if (n < 0) {
            var noteObj = getNote(
                note,
                octave,
                0,
                this.keySignature[turtle],
                this.moveable[turtle],
                null,
                this.errorMsg,
                this.synth.inTemperament
            );
            var note1 = noteObj[0];
            if (this.synth.inTemperament == "custom") {
                var value = getStepSizeDown(
                    this.keySignature[turtle],
                    noteObj[0],
                    n,
                    this.synth.inTemperament
                );
                noteObj = getNote(
                    noteObj[0],
                    noteObj[1],
                    value,
                    this.keySignature[turtle],
                    this.moveable[turtle],
                    null,
                    this.errorMsg,
                    this.synth.inTemperament
                );
            } else {
                for (var i = 0; i < -n; i++) {
                    var value = getStepSizeDown(
                        this.keySignature[turtle],
                        noteObj[0]
                    );
                    noteObj = getNote(
                        noteObj[0],
                        noteObj[1],
                        value,
                        this.keySignature[turtle],
                        this.moveable[turtle],
                        null,
                        this.errorMsg,
                        this.synth.inTemperament
                    );
                }
            }
        } else {
            var noteObj = [note, octave];
        }

        return noteObj;
    };

    /**
     * Returns a distance for scalar transposition.
     * @privileged
     * @param   turtle
     * @param   {number}    firstNote
     * @param   {number}    lastNote
     * @returns {number}
     */
    this._scalarDistance = function(turtle, firstNote, lastNote) {
        // Rather than just counting the semitones, we need to count
        // the steps in the current key needed to get from firstNote pitch
        // to lastNote pitch.

        if (lastNote === firstNote) {
            return 0;
        } else if (lastNote > firstNote) {
            var noteObj = numberToPitch(
                firstNote + this.pitchNumberOffset[turtle]
            );
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
            var noteObj = numberToPitch(
                lastNote + this.pitchNumberOffset[turtle]
            );
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

    /**
     * Preps synths for each turtle.
     * @privileged
     * @returns {void}
     */
    this._prepSynths = function() {
        this.synth.newTone();

        for (
            var turtle = 0;
            turtle < this.turtles.turtleList.length;
            turtle++
        ) {
            if (!(turtle in instruments)) {
                instruments[turtle] = {};
                instrumentsFilters[turtle] = {};
                instrumentsEffects[turtle] = {};
            }

            // Make sure there is a default synth for each turtle
            if (!("electronic synth" in instruments[turtle])) {
                this.synth.createDefaultSynth(turtle);
            }

            // Copy any preloaded synths from the default turtle
            for (var instrumentName in instruments[0]) {
                if (!(instrumentName in instruments[turtle])) {
                    this.synth.loadSynth(turtle, instrumentName);

                    // Copy any filters
                    if (instrumentName in instrumentsFilters[0]) {
                        instrumentsFilters[turtle][instrumentName] =
                            instrumentsFilters[0][instrumentName];
                    }

                    // and any effects
                    if (instrumentName in instrumentsEffects[0]) {
                        instrumentsEffects[turtle][instrumentName] =
                            instrumentsEffects[0][instrumentName];
                    }
                }
            }

            this.synthVolume[turtle] = {
                "electronic synth": [DEFAULTVOLUME],
                noise1: [DEFAULTVOLUME],
                noise2: [DEFAULTVOLUME],
                noise3: [DEFAULTVOLUME]
            };
        }

        if (!this.suppressOutput[turtle]) {
            this._setMasterVolume(DEFAULTVOLUME);
            for (
                var turtle = 0;
                turtle < this.turtles.turtleList.length;
                turtle++
            ) {
                for (var synth in this.synthVolume[turtle]) {
                    this.setSynthVolume(turtle, synth, DEFAULTVOLUME);
                }
            }
        }
    };

    /**
     * Clears note params.
     * @privileged
     * @param   turtle
     * @param   blk
     * @param   drums
     * @returns {void}
     */
    this.clearNoteParams = function(turtle, blk, drums) {
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

    /**
     * Updates the music notation used for Lilypond output.
     * @privileged
     * @param   note
     * @param   {number}   duration
     * @param   turtle
     * @param   insideChord
     * @param   drum
     * @param   {boolean}   split    Optional.
     * @returns {void}
     */
    this.updateNotation = function(
        note,
        duration,
        turtle,
        insideChord,
        drum,
        split
    ) {
        if (this.optimize) return;

        // Note: At this point, the note of duration "duration" has
        // already been added to notesPlayed.

        // Don't split the note if we are already splitting the note.
        if (split == undefined) split = true;

        // Check to see if this note straddles a measure boundary.
        var durationTime = 1 / duration;
        var beatsIntoMeasure =
            ((this.notesPlayed[turtle][0] / this.notesPlayed[turtle][1] -
                this.pickup[turtle] -
                durationTime) *
                this.noteValuePerBeat[turtle]) %
            this.beatsPerMeasure[turtle];
        var timeIntoMeasure = beatsIntoMeasure / this.noteValuePerBeat[turtle];
        var timeLeftInMeasure =
            this.beatsPerMeasure[turtle] / this.noteValuePerBeat[turtle] -
            timeIntoMeasure;

        if (split && durationTime > timeLeftInMeasure) {
            var d = durationTime - timeLeftInMeasure;
            var d2 = timeLeftInMeasure;
            var b =
                this.beatsPerMeasure[turtle] / this.noteValuePerBeat[turtle];
            console.debug("splitting note across measure boundary.");
            var obj = rationalToFraction(d);

            if (d2 > 0) {
                // Check to see if the note straddles multiple measures.
                var i = 0;
                while (d2 > b) {
                    i += 1;
                    d2 -= b;
                }

                var obj2 = rationalToFraction(d2);
                this.updateNotation(
                    note,
                    obj2[1] / obj2[0],
                    turtle,
                    insideChord,
                    drum,
                    false
                );
                if (i > 0 || obj[0] > 0) {
                    if (note[0] !== "R") {
                        // Don't tie rests
                        this.notationInsertTie(turtle);
                        this.notationDrumStaging[turtle].push("tie");
                    }
                    var obj2 = rationalToFraction(1 / b);
                }

                // Add any measures we straddled.
                while (i > 0) {
                    i -= 1;
                    this.updateNotation(
                        note,
                        obj2[1] / obj2[0],
                        turtle,
                        insideChord,
                        drum,
                        false
                    );
                    if (obj[0] > 0) {
                        if (note[0] !== "R") {
                            // Don't tie rests
                            this.notationInsertTie(turtle);
                            this.notationDrumStaging[turtle].push("tie");
                        }
                    }
                }
            }

            if (obj[0] > 0) {
                this.updateNotation(
                    note,
                    obj[1] / obj[0],
                    turtle,
                    insideChord,
                    drum,
                    false
                );
            }

            return;
        }

        // Otherwise proceed as normal.
        var obj = durationToNoteValue(duration);

        // Deprecated
        if (this.turtles.turtleList[turtle].drum) {
            note = "c2";
        }

        this.notationStaging[turtle].push([
            note,
            obj[0],
            obj[1],
            obj[2],
            obj[3],
            insideChord,
            this.staccato[turtle].length > 0 && last(this.staccato[turtle]) > 0
        ]);

        // If no drum is specified, add a rest to the drum
        // line. Otherwise, add the drum.
        if (drum.length === 0) {
            this.notationDrumStaging[turtle].push([
                ["R"],
                obj[0],
                obj[1],
                obj[2],
                obj[3],
                insideChord,
                false
            ]);
        } else if (["noise1", "noise2", "noise3"].indexOf(drum[0]) === -1) {
            var drumSymbol = getDrumSymbol(drum[0]);
            this.notationDrumStaging[turtle].push([
                [drumSymbol],
                obj[0],
                obj[1],
                obj[2],
                obj[3],
                insideChord,
                false
            ]);
        }

        this.pickupPoint[turtle] = null;

        if (this.markup[turtle].length > 0) {
            var markup = "";
            for (var i = 0; i < this.markup[turtle].length; i++) {
                markup += this.markup[turtle][i];
                if (i < this.markup[turtle].length - 1) {
                    markup += " ";
                }
            }

            this.notationMarkup(turtle, markup, true);
            this.markup[turtle] = [];
        }

        if (typeof note === "object") {
            // If it is hertz, add a markup.
            markup = "";
            try {
                for (var i = 0; i < note.length; i++) {
                    if (typeof note[i] === "number") {
                        if ((markup = "")) {
                            markup = toFixed2(note[i]);
                            break;
                        }
                    }
                }
                if (markup.length > 0) {
                    this.notationMarkup(turtle, markup, false);
                }
            } catch (e) {
                console.debug(e);
            }
        }
    };

    /**
     * Adds a voice if possible.
     * @privileged
     * @param   turtle
     * @param   {number}    arg
     * @returns {void}
     */
    this.notationVoices = function(turtle, arg) {
        switch (arg) {
            case 1:
                this.notationStaging[turtle].push("voice one");
                break;
            case 2:
                this.notationStaging[turtle].push("voice two");
                break;
            case 3:
                this.notationStaging[turtle].push("voice three");
                break;
            case 4:
                this.notationStaging[turtle].push("voice four");
                break;
            default:
                this.notationStaging[turtle].push("one voice");
                break;
        }

        this.pickupPoint[turtle] = null;
    };

    /**
     * Sets the notation markup.
     * @privileged
     * @param   turtle
     * @param   markup
     * @param   {boolean}   below
     * @returns {void}
     */
    this.notationMarkup = function(turtle, markup, below) {
        if (below) {
            this.notationStaging[turtle].push("markdown", markup);
        } else {
            this.notationStaging[turtle].push("markup", markup);
        }

        this.pickupPoint[turtle] = null;
    };

    /**
     * Sets the key and mode in the notation.
     * @privileged
     * @param   turtle
     * @param   key
     * @param   mode
     * @returns {void}
     */
    this.notationKey = function(turtle, key, mode) {
        this.notationStaging[turtle].push("key", key, mode);
        this.pickupPoint[turtle] = null;
    };

    /**
     * Sets the meter.
     * @privileged
     * @param   turtle
     * @param   count
     * @param   value
     * @returns {void}
     */
    this.notationMeter = function(turtle, count, value) {
        if (this.pickupPoint[turtle] != null) {
            // Lilypond prefers meter to be before partials.
            var d =
                this.notationStaging[turtle].length - this.pickupPoint[turtle];
            var pickup = [];
            for (var i in d) {
                pickup.push(this.notationStaging[turtle].pop());
            }

            this.notationStaging[turtle].push("meter", count, value);
            for (var i in d) {
                this.notationStaging[turtle].push(pickup.pop());
            }
        } else {
            this.notationStaging[turtle].push("meter", count, value);
        }

        this.pickupPoint[turtle] = null;
    };

    /**
     * Adds swing.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationSwing = function(turtle) {
        this.notationStaging[turtle].push("swing");
    };

    /**
     * Sets the tempo.
     * @privileged
     * @param   turtle
     * @param   {number}    bpm     The number of beats per minute.
     * @param   beatValue
     * @returns {void}
     */
    this.notationTempo = function(turtle, bpm, beatValue) {
        var beat = convertFactor(beatValue);
        if (beat !== null) {
            this.notationStaging[turtle].push("tempo", bpm, beat);
        } else {
            var obj = rationalToFraction(beatValue);
            // this.errorMsg(_('Lilypond cannot process tempo of ') + obj[0] + '/' + obj[1] + ' = ' + bpm);
        }
    };

    /**
     * Adds a pickup.
     * @privileged
     * @param   turtle
     * @param   {number}    factor
     * @returns {void}
     */
    this.notationPickup = function(turtle, factor) {
        if (factor === 0) {
            console.debug("ignoring pickup of 0");
            return;
        }

        var pickupPoint = this.notationStaging[turtle].length;

        // Lilypond partial must be a combination of powers of two.
        var partial = 1 / factor;
        var beat = convertFactor(factor);
        if (beat !== null) {
            this.notationStaging[turtle].push("pickup", beat);
            this.pickupPOW2[turtle] = true;
        } else {
            if (this.runningLilypond) {
                obj = rationalToFraction(factor);
                this.errorMsg(
                    _("Lilypond cannot process pickup of ") +
                        obj[0] +
                        "/" +
                        obj[1]
                );
            }

            obj = rationalToFraction(1 - factor);
            for (var i = 0; i < obj[0]; i++) {
                this.updateNotation(["R"], obj[1], turtle, false, "");
            }
        }

        this.pickupPoint[turtle] = pickupPoint;
    };

    /**
     * Sets tuning as harmonic.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationHarmonic = function(turtle) {
        this.notationStaging.push("harmonic");
        this.pickupPoint[turtle] = null;
    };

    /**
     * Adds a line break.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationLineBreak = function(turtle) {
        // this.notationStaging[turtle].push('break');
        this.pickupPoint[turtle] = null;
    };

    /**
     * Begins the articulation of an instrument.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationBeginArticulation = function(turtle) {
        this.notationStaging[turtle].push("begin articulation");
        this.pickupPoint[turtle] = null;
    };

    /**
     * Ends articulation.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationEndArticulation = function(turtle) {
        this.notationStaging[turtle].push("end articulation");
        this.pickupPoint[turtle] = null;
    };

    /**
     * Begins a crescendo or descrendo.
     * @privileged
     * @param   turtle
     * @param   {number}    factor  If more than 0, we have a crescendo (otherwise, a decrescendo).
     * @returns {void}
     */
    this.notationBeginCrescendo = function(turtle, factor) {
        if (factor > 0) {
            this.notationStaging[turtle].push("begin crescendo");
        } else {
            this.notationStaging[turtle].push("begin decrescendo");
        }

        this.pickupPoint[turtle] = null;
    };

    /**
     * Ends a crescendo or descrendo.
     * @privileged
     * @param   turtle
     * @param   {number}    factor  If more than 0, we have a crescendo (otherwise, a decrescendo).
     * @returns {void}
     */
    this.notationEndCrescendo = function(turtle, factor) {
        if (factor > 0) {
            this.notationStaging[turtle].push("end crescendo");
        } else {
            this.notationStaging[turtle].push("end decrescendo");
        }

        this.pickupPoint[turtle] = null;
    };

    /**
     * Begins a slur.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationBeginSlur = function(turtle) {
        this.notationStaging[turtle].push("begin slur");
        this.pickupPoint[turtle] = null;
    };

    /**
     * Ends a slur.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationEndSlur = function(turtle) {
        this.notationStaging[turtle].push("end slur");
        this.pickupPoint[turtle] = null;
    };

    /**
     * Adds a tie.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationInsertTie = function(turtle) {
        this.notationStaging[turtle].push("tie");
        this.pickupPoint[turtle] = null;
    };

    /**
     * Removes the last tie.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationRemoveTie = function(turtle) {
        this.notationStaging[turtle].pop();
        this.pickupPoint[turtle] = null;
    };

    /**
     * Begins harmonics.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationBeginHarmonics = function(turtle) {
        this.notationStaging[turtle].push("begin harmonics");
        this.pickupPoint[turtle] = null;
    };

    /**
     * Ends harmonics.
     * @privileged
     * @param   turtle
     * @returns {void}
     */
    this.notationEndHarmonics = function(turtle) {
        this.notationStaging[turtle].push("end harmonics");
        this.pickupPoint[turtle] = null;
    };
}
