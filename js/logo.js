// Copyright (c) 2014-2020 Walter Bender
// Copyright (c) 2015 Yash Khandelwal
// Copyright (c) 2020 Anindya Kundu
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
const TONEBPM = 240;        // seems to be the default
const TARGETBPM = 90;       // what we'd like to use for beats per minute
const DEFAULTDELAY = 500;   // milliseconds
const TURTLESTEP = -1;      // run in step-by-step mode
const NOTEDIV = 8;          // number of steps to divide turtle graphics
// The oscillator runs hot. We must scale back its volume.
const OSCVOLUMEADJUSTMENT = 1.5;

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
const NOTATIONINSIDECHORD = 5;  // deprecated
const NOTATIONSTACCATO = 6;

/**
 * Class dealing with executing the programs.
 *
 * @class
 * @classdesc This contains all the variables and the methods which
 * control the execution of the programs. Contains a method to dispatch
 * turtle commands which call methods of Turtle and Turles. Also contains
 * notation code.
 */
class Logo {
    /**
     * @constructor
     */
    constructor() {
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

        this.inputValues = {};
        this.boxes = {};
        this.actions = {};
        this.returns = {};
        this.turtleHeaps = {};
        this.invertList = {};
        this.beatList = {};
        this.factorList = {};
        this.defaultStrongBeats = {}

        // We store each case arg and flow by switch block no. and turtle
        this.switchCases = {};
        this.switchBlocks = {};

        // When we leave a clamp block, we need to dispatch a signal
        this.endOfClampSignals = {};
        // Don't dispatch these signals (when exiting note counter or
        // interval measure
        this.butNotThese = {};

        this.lastNoteTimeout = null;
        this.alreadyRunning = false;
        this.prematureRestart = false;
        this.runningBlock = null;
        this.ignoringBlock = null;

        // Used to halt runtime during input
        this.delayTimeout = {};
        this.delayParameters = {};

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
        // interpreting the code
        this.playbackQueue = {};
        this.playbackTime = 0;

        // Optimize for runtime speed
        this.optimize = beginnerMode;   // beginnerMode is a boolean value

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

        // pitch-rhythm matrix
        this.inMatrix = false;
        this.keySignature = {};
        this.tupletRhythms = [];
        this.addingNotesToTuplet = false;
        this.drumBlocks = [];
        this.pitchBlocks = [];
        this.inNoteBlock = [];
        this.multipleVoices = [];

        // Parameters used by pitch
        this.scalarTransposition = {};
        this.scalarTranspositionValues = {};
        this.transposition = {};
        this.transpositionValues = {};

        // Parameters used by notes
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
        this.lastPitchPlayed = {};          // for a stand-alone pitch block
        this.previousNotePlayed = {};
        this.noteStatus = {};
        this.noteDirection = {};
        this.pitchNumberOffset = [];        // 39, C4
        this.currentOctave = {};
        this.currentCalculatedOctave = {};  // for a stand-alone pitch block
        this.currentNote = {};
        this.inHarmonic = {};
        this.partials = {};
        this.inNeighbor = [];
        this.neighborStepPitch = {};
        this.neighborNoteValue = {};
        this.inDefineMode = {};
        this.defineMode = {};

        // Parameters used in time signature
        this.pickup = {};
        this.beatsPerMeasure = {};
        this.noteValuePerBeat = {};
        this.currentBeat = {};
        this.currentMeasure = {};

        // Parameters used by the note block
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
        this.intervals = {};            // relative interval (based on scale degree)
        this.semitoneIntervals = {};    // absolute interval (based on semitones)
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

        // Scale factor for turtle graphics embedded in notes
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

        // Variables for progress bar
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
        // if (this.optimize) {
        //     createjs.Ticker.framerate = 10;
        // } else {
        //     createjs.Ticker.framerate = 30;
        // }

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
        // queued here
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
    }

    /**
     * Switches optimize mode on if state, off otherwise.
     *
     * @privileged
     * @param {boolean} state - An object representing a state
     * @returns {void}
     */
    setOptimize(state) {
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
    }

    /**
     * Sets the setPlaybackStatus property.
     *
     * @privileged
     * @param {Function} setPlaybackStatus
     * @returns {this}
     */
    setSetPlaybackStatus(setPlaybackStatus) {
        this.setPlaybackStatus = setPlaybackStatus;
        return this;
    }

    /**
     * Sets the canvas property.
     *
     * @privileged
     * @param canvas
     * @returns {this}
     */
    setCanvas(canvas) {
        this.canvas = canvas;
        return this;
    }

    /**
     * Sets all the blocks.
     *
     * @privileged
     * @param blocks
     * @returns {this}
     */
    setBlocks(blocks) {
        this.blocks = blocks;
        return this;
    }

    /**
     * Sets all the turtles.
     *
     * @privileged
     * @param turtles
     * @returns {this}
     */
    setTurtles(turtles) {
        this.turtles = turtles;
        return this;
    }

    /**
     * Sets the stage.
     *
     * @privileged
     * @param stage
     * @returns {this}
     */
    setStage(stage) {
        this.stage = stage;
        return this;
    }

    /**
     * Sets the refreshCanvas property.
     *
     * @privileged
     * @param {Function} refreshCanvas
     * @returns {this}
     */
    setRefreshCanvas(refreshCanvas) {
        this.refreshCanvas = refreshCanvas;
        return this;
    }

    /**
     * Sets the textMsg property.
     *
     * @privileged
     * @param {Function} textMsg - function to produce a text message using exactly one string
     * @returns {this}
     */
    setTextMsg(textMsg) {
        this.textMsg = textMsg;
        return this;
    }

    /**
     * Sets the hideMsgs property.
     *
     * @privileged
     * @param {Function} hideMsgs
     * @returns {this}
     */
    setHideMsgs(hideMsgs) {
        this.hideMsgs = hideMsgs;
        return this;
    };

    /**
     * Sets the errorMsg property.
     *
     * @privileged
     * @param {Function} errorMsg - function to produce an error message using at least a string
     * @returns {this}
     */
    setErrorMsg(errorMsg) {
        this.errorMsg = errorMsg;
        return this;
    }

    /**
     * Sets the onStopTurtle property.
     *
     * @privileged
     * @param {Function} onStopTurtle
     * @returns {this}
     */
    setOnStopTurtle(onStopTurtle) {
        this.onStopTurtle = onStopTurtle;
        return this;
    }

    /**
     * Sets the onRunTurtle property.
     *
     * @privileged
     * @param {Function} onRunTurtle
     * @returns {this}
     */
    setOnRunTurtle(onRunTurtle) {
        this.onRunTurtle = onRunTurtle;
        return this;
    }

    /**
     * Sets the getStageX property.
     *
     * @privileged
     * @param {Function} getStageX
     * @returns {this}
     */
    setGetStageX(getStageX) {
        this.getStageX = getStageX;
        return this;
    }

    /**
     * Sets the getStageY property.
     *
     * @privileged
     * @param {Function} getStageY
     * @returns {this}
     */
    setGetStageY(getStageY) {
        this.getStageY = getStageY;
        return this;
    };

    /**
     * Sets the getStageMouseDown property.
     *
     * @privileged
     * @param {Function} getStageMouseDown
     * @returns {this}
     */
    setGetStageMouseDown(getStageMouseDown) {
        this.getStageMouseDown = getStageMouseDown;
        return this;
    }

    /**
     * Sets the getCurrentKeyCode property.
     *
     * @privileged
     * @param {Function} getCurrentKeyCode
     * @returns {this}
     */
    setGetCurrentKeyCode(getCurrentKeyCode) {
        this.getCurrentKeyCode = getCurrentKeyCode;
        return this;
    }

    /**
     * Sets the clearCurrentKeyCode property.
     *
     * @privileged
     * @param {Function} clearCurrentKeyCode
     * @returns {this}
     */
    setClearCurrentKeyCode(clearCurrentKeyCode) {
        this.clearCurrentKeyCode = clearCurrentKeyCode;
        return this;
    }

    /**
     * Sets the meSpeak property.
     *
     * @privileged
     * @param meSpeak - an object with a speak method that takes a string
     * @returns {this}
     */
    setMeSpeak(meSpeak) {
        this.meSpeak = meSpeak;
        return this;
    }

    /**
     * Sets the saveLocally property.
     *
     * @privileged
     * @param {Function} saveLocally
     * @returns {this}
     */
    setSaveLocally(saveLocally) {
        this.saveLocally = saveLocally;
        return this;
    }

    /**
     * Sets the pause between each block as the program executes.
     *
     * @privileged
     * @param {number} turtleDelay
     * @returns {void}
     */
    setTurtleDelay(turtleDelay) {
        this.turtleDelay = turtleDelay;
        this.noteDelay = 0;
    }

    /**
     * Sets the pause between each note as the program executes.
     *
     * @privileged
     * @param {number} noteDelay
     * @returns {void}
     */
    setNoteDelay(noteDelay) {
        this.noteDelay = noteDelay;
        this.turtleDelay = 0;
    }

    /**
     * Takes one step for each turtle in excuting Logo commands.
     *
     * @privileged
     * @returns {void}
     */
    step() {
        for (let turtle in this.stepQueue) {
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

                let blk = this.stepQueue[turtle].pop();
                if (blk != null) {
                    this._runFromBlockNow(this, turtle, blk, 0, null);
                }
            }
        }
    }

    /**
     * Steps through one note for each turtle in excuting Logo commands,
     * but runs through other blocks at full speed.
     *
     * @privileged
     * @returns {void}
     */
    stepNote() {
        let tempStepQueue = {};
        let notesFinish = {};
        let thisNote = {};

        let __stepNote = () => {
            for (let turtle in this.stepQueue) {
                // Have we already played a note for this turtle?
                if (turtle in this.playedNote && this.playedNote[turtle]) {
                    continue;
                }

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

                    let blk = this.stepQueue[turtle].pop();
                    if (blk != null && blk !== notesFinish[turtle]) {
                        let block = this.blocks.blockList[blk];
                        if (block.name === "newnote") {
                            tempStepQueue[turtle] = blk;
                            notesFinish[turtle] = last(block.connections);
                            if (notesFinish[turtle] == null) {
                                // end of flow
                                notesFinish[turtle] =
                                    last(
                                        this.turtles.turtleList[turtle].queue
                                    ) &&
                                    last(this.turtles.turtleList[turtle].queue)
                                        .blk;
                                // catch case of null - end of project
                            }

                            // this.playedNote[turtle] = true;
                            this.playedNoteTimes[turtle] =
                                this.playedNoteTimes[turtle] || 0;
                            thisNote[turtle] = Math.pow(
                                this.parseArg(
                                    this,
                                    turtle,
                                    block.connections[1],
                                    blk,
                                    this.receivedArg
                                ),
                                -1
                            );

                            // Keep track of how long the note played for,
                            // so we can go back and play it again if needed
                            this.playedNoteTimes[turtle] += thisNote[turtle];
                        }

                        this._runFromBlockNow(this, turtle, blk, 0, null);
                    } else {
                        this.playedNote[turtle] = true;
                    }
                }
            }

            // At this point, some turtles have played notes and others
            // have not. We need to keep stepping until they all have.
            let keepGoing = false;
            for (let turtle in this.stepQueue) {
                if (
                    this.stepQueue[turtle].length > 0 &&
                    !this.playedNote[turtle]
                ) {
                    keepGoing = true;
                    break;
                }
            }

            if (keepGoing) {
                __stepNote();
                // this.step();
            } else {
                let notesArray = [];
                for (let turtle in this.playedNote) {
                    this.playedNote[turtle] = false;
                    notesArray.push(this.playedNoteTimes[turtle]);
                }

                // If some notes are supposed to play for longer, add
                // them back to the queue
                let shortestNote = Math.min.apply(null, notesArray);
                let continueFrom;
                for (let turtle in this.playedNoteTimes) {
                    if (this.playedNoteTimes[turtle] > shortestNote) {
                        continueFrom = tempStepQueue[turtle];
                        // Subtract the time, as if we haven't played it yet
                        this.playedNoteTimes[turtle] -= thisNote[turtle];
                    } else {
                        continueFrom = notesFinish[turtle];
                    }
                    this._runFromBlock(this, turtle, continueFrom, 0, null);
                }

                if (shortestNote === Math.max.apply(null, notesArray)) {
                    this.playedNoteTimes = {};
                }
            }
        };

        __stepNote();
    }

    /**
     * Returns whether to record.
     *
     * @privileged
     * @returns {boolean}
     */
    recordingStatus() {
        return (
            this.recording ||
            this.runningLilypond ||
            this.runningAbc ||
            this.runningMxml
        );
    }

    /**
     * The stop button was pressed.
     * Stops the turtle and cleans up a few odds and ends.
     *
     * @privileged
     * @returns {void}
     */
    doStopTurtle() {
        this.stopTurtle = true;
        this.turtles.markAsStopped();
        this.playbackTime = 0;

        for (let sound in this.sounds) {
            this.sounds[sound].stop();
        }

        this.sounds = [];

        if (_THIS_IS_MUSIC_BLOCKS_) {
            for (
                let turtle = 0;
                turtle < this.turtles.turtleList.length;
                turtle++
            ) {
                for (let instrumentName in instruments[turtle]) {
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
    }

    /**
     * Restores any broken connections made in duplicate notes clamps.
     *
     * @privileged
     * @returns {void}
     */
    _restoreConnections() {
        for (let turtle in this.connectionStore) {
            for (let blk in this.connectionStore[turtle]) {
                let n = this.connectionStore[turtle][blk].length;
                for (let i = 0; i < n; i++) {
                    let obj = this.connectionStore[turtle][blk].pop();
                    this.blocks.blockList[obj[0]].connections[obj[1]] = obj[2];
                    if (obj[2] != null) {
                        this.blocks.blockList[obj[2]].connections[0] = obj[0];
                    }
                }
            }
        }
    }

    /**
     * Clears all the blocks, updates the cache and refreshes the canvas.
     *
     * @privileged
     * @returns {void}
     */
    _clearParameterBlocks() {
        for (let blk = 0; blk < this.blocks.blockList.length; blk++) {
            if (
                this.blocks.blockList[blk].protoblock.parameter &&
                this.blocks.blockList[blk].text !== null
            ) {
                this.blocks.blockList[blk].text.text = "";
                this.blocks.blockList[blk].container.updateCache();
            }
        }
        this.refreshCanvas();
    }

    /**
     * Updates the label on parameter blocks.
     *
     * @privileged
     * @param {this} logo
     * @param turtle
     * @param blk
     * @returns {void}
     */
    _updateParameterBlock(logo, turtle, blk) {
        let name = this.blocks.blockList[blk].name;

        if (
            this.blocks.blockList[blk].protoblock.parameter &&
            this.blocks.blockList[blk].text !== null
        ) {
            let value = 0;

            if (
                typeof logo.blocks.blockList[blk].protoblock.updateParameter ===
                "function"
            ) {
                value = logo.blocks.blockList[blk].protoblock.updateParameter(
                    logo,
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
    }

    /**
     * Initialises the microphone.
     *
     * @privileged
     * @returns {void}
     */
    initMediaDevices() {
        console.debug("INIT MICROPHONE");
        if (_THIS_IS_MUSIC_BLOCKS_) {
            let mic = new Tone.UserMedia();
            try {
                mic.open();
            } catch (e) {
                console.debug("MIC NOT FOUND");
                console.debug(e.name + ": " + e.message);

                console.debug(mic);
                this.errorMsg(NOMICERRORMSG);
                mic = null;
            }

            this.mic = mic;
            this.limit = 1024;
        } else {
            try {
                this.mic = new p5.AudioIn();
                this.mic.start();
            } catch (e) {
                console.debug(e);
                this.errorMsg(NOMICERRORMSG);
                this.mic = null;
            }
        }
    }

    /**
     * Initialises a turtle.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    initTurtle(turtle) {
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
        this.beatsPerMeasure[turtle] = 4;       // default is 4/4 time
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
        this.pitchNumberOffset[turtle] = 39;    // C4
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
        this.defaultStrongBeats[turtle] = false;

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.playbackQueue[turtle] = [];
        } else {
            // Don't empty playback queue of precompiled content
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
    }

    /**
     * Runs Logo commands.
     *
     * @privileged
     * @param startHere - index of a block to start from
     * @param env
     * @returns {void}
     */
    runLogoCommands(startHere, env) {
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

        this._restoreConnections();         // restore any broken connections

        this.saveLocally();                 // save the state before running

        for (let arg in this.evalOnStartList) {
            eval(this.evalOnStartList[arg]);
        }

        this.stopTurtle = false;

        this.blocks.unhighlightAll();
        this.blocks.bringToTop();           // draw under blocks

        this.hideMsgs();

        // Run the Logo commands here
        this.time = new Date().getTime();
        this.firstNoteTime = null;

        // Ensure we have at least one turtle
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

        // Each turtle needs to keep its own wait time and music states
        for (
            let turtle = 0;
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
            let turtle = 0;
            turtle < this.turtles.turtleList.length;
            turtle++
        ) {
            for (let listener in this.turtles.turtleList[turtle].listeners) {
                this.stage.removeEventListener(
                    listener,
                    this.turtles.turtleList[turtle].listeners[listener],
                    false
                );
            }

            this.turtles.turtleList[turtle].listeners = {};
        }

        // Init the graphic state
        for (
            let turtle = 0;
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
            // Ensure widget has been created before trying to initialize it
            if (this.statusMatrix === null) {
                this.statusMatrix = new StatusMatrix();
            }

            this.statusMatrix.init(this);
        }

        // Execute turtle code here
        /*
        ===========================================================================
        (1) Find the start block (or the top of each stack) and build a list
            of all of the named action stacks.
        ===========================================================================
        */
        let startBlocks = [];
        this.blocks.findStacks();
        this.actions = {};

        for (let blk = 0; blk < this.blocks.stackList.length; blk++) {
            if (
                ["start", "drum", "status"].indexOf(
                    this.blocks.blockList[this.blocks.stackList[blk]].name
                ) !== -1
            ) {
                // Don't start on a start block in the trash
                if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                    startBlocks.push(this.blocks.stackList[blk]);
                }
            } else if (
                this.blocks.blockList[this.blocks.stackList[blk]].name ===
                "action"
            ) {
                // Does the action stack have a name?
                let c = this.blocks.blockList[this.blocks.stackList[blk]]
                    .connections[1];
                // Is there a block in the action clamp?
                let b = this.blocks.blockList[this.blocks.stackList[blk]]
                    .connections[2];
                if (c != null && b != null) {
                    // Don't use an action block in the trash
                    if (
                        !this.blocks.blockList[this.blocks.stackList[blk]].trash
                    ) {
                        // We need to calculate the value of block c.
                        // this.actions[this.blocks.blockList[c].value] = b;
                        let name = this.parseArg(this, 0, c, null);
                        this.actions[name] = b;
                    }
                }
            }
        }

        this.svgOutput = "";
        this.svgBackground = true;

        for (
            let turtle = 0;
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
            // Don't update parameters when running full speed
            this._clearParameterBlocks();
        }

        this.onRunTurtle();

        // Make sure that there is atleast one turtle
        if (this.turtles.turtleList.length === 0) {
            console.debug("No start block... adding a turtle");
            this.turtles.addTurtle(null);
        }

        // Mark all turtles as not running
        for (
            let turtle = 0;
            turtle < this.turtles.turtleList.length;
            turtle++
        ) {
            if (this.turtles.turtleList[turtle].running) {
                console.debug("already running...");
            }

            this.turtles.turtleList[turtle].running = false;
        }

        /*
        ===========================================================================
        (2) Execute the stack. (A bit complicated due to lots of corner cases)
        ===========================================================================
        */
        if (startHere != null) {
            // If a block to start from was passed, find its associated
            // turtle, i.e., which turtle should we use?
            let turtle = 0;
            while (
                this.turtles.turtleList[turtle].inTrash &&
                turtle < this.turtles.turtleList.length
            ) {
                ++turtle;
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
            let delayStart = 0;
            // Look for a status block
            for (let b = 0; b < startBlocks.length; b++) {
                if (
                    this.blocks.blockList[startBlocks[b]].name === "status" &&
                    !this.blocks.blockList[startBlocks[b]].trash
                ) {
                    let turtle = 0;
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

            setTimeout(() => {
                if (delayStart !== 0) {
                    // Launching status block would have hidden the
                    // Stop Button so show it again
                    this.onRunTurtle();
                }

                // If there are start blocks, run them all
                for (let b = 0; b < startBlocks.length; b++) {
                    if (
                        this.blocks.blockList[startBlocks[b]].name !== "status"
                    ) {
                        let turtle =
                            this.blocks.blockList[startBlocks[b]].value;
                        this.turtles.turtleList[turtle].queue = [];
                        this.parentFlowQueue[turtle] = [];
                        this.unhighlightQueue[turtle] = [];
                        this.parameterQueue[turtle] = [];

                        if (!this.turtles.turtleList[turtle].inTrash) {
                            if (this.turtles.turtleList[turtle].running) {
                                console.debug("already running...");
                            }

                            this.turtles.turtleList[turtle].running = true;
                            this._runFromBlock(
                                this,
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

                // Reset cursor
                document.body.style.cursor = "default";
            }
        }

        this.refreshCanvas();
    }

    /**
     * Runs from a single block.
     *
     * @privileged
     * @param {this} logo
     * @param turtle
     * @param blk
     * @param isflow
     * @param receivedArg
     * @returns {void}
     */
    _runFromBlock(logo, turtle, blk, isflow, receivedArg) {
        this.runningBlock = blk;
        if (blk == null) return;

        this.receivedArg = receivedArg;

        let delay = logo.turtleDelay + logo.waitTimes[turtle];
        logo.waitTimes[turtle] = 0;

        if (!logo.stopTurtle) {
            if (logo.turtleDelay === TURTLESTEP) {
                // Step mode
                if (!(turtle in logo.stepQueue)) {
                    logo.stepQueue[turtle] = [];
                }
                logo.stepQueue[turtle].push(blk);
            } else {
                logo.delayParameters[turtle] =
                    { 'blk': blk, 'flow': isflow, 'arg': receivedArg };
                logo.delayTimeout[turtle] = setTimeout(() => {
                    logo._runFromBlockNow(
                        logo,
                        turtle,
                        blk,
                        isflow,
                        receivedArg
                    );
                }, delay);
            }
        }
    }

    /**
     * We may need to clear the timeout, e.g., after a successful input.
     *
     * @param turtle
     * @returns {void}
     */
    clearRunBlock(turtle) {
        if (this.delayTimeout[turtle] !== null) {
            clearTimeout(this.delayTimeout[turtle]);
            this.delayTimeout[turtle] = null;
            this.requeueRunBlock(turtle);
        }
    }

    /**
     * If we clear the delay timeout, we need to requeue the runBlock.
     *
     * @param turtle
     * @returns {void}
     */
    requeueRunBlock(turtle) {
        this._runFromBlockNow(
            this,
            turtle,
            this.delayParameters[turtle]['blk'],
            this.delayParameters[turtle]['flow'],
            this.delayParameters[turtle]['arg']
        );
    }

    /**
     * Changes a property according to a block name and a value.
     *
     * @privileged
     * @param blk
     * @param value
     * @param turtle
     * @returns {void}
     */
    _blockSetter(blk, value, turtle) {
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
    }

    /**
     * Runs a stack of blocks, beginning with blk.
     *
     * @privileged
     * @param {this} logo
     * @param turtle
     * @param blk
     * @param isflow
     * @param receivedArg
     * @param {number} [queueStart]
     * @returns {void}
     */
    _runFromBlockNow(
        logo,
        turtle,
        blk,
        isflow,
        receivedArg,
        queueStart
    ) {
        this.alreadyRunning = true;

        this.receivedArg = receivedArg;

        // Sometimes we don't want to unwind the entire queue
        if (queueStart === undefined) queueStart = 0;

        /*
        ===========================================================================
        (1) Evaluate any arguments (beginning with connection[1])
        ===========================================================================
        */
        let args = [];
        if (logo.blocks.blockList[blk].protoblock.args > 0) {
            for (
                let i = 1;
                i < logo.blocks.blockList[blk].protoblock.args + 1;
                i++
            ) {
                if (
                    logo.blocks.blockList[blk].protoblock.dockTypes[i] === "in"
                ) {
                    if (logo.blocks.blockList[blk].connections[i] == null) {
                        console.debug("skipping inflow args");
                    } else {
                        args.push(logo.blocks.blockList[blk].connections[i]);
                    }
                } else {
                    args.push(
                        logo.parseArg(
                            logo,
                            turtle,
                            logo.blocks.blockList[blk].connections[i],
                            blk,
                            receivedArg
                        )
                    );
                }
            }
        }

        /*
        ===========================================================================
        (2) Run function associated with the block
        ===========================================================================
        */
        let nextFlow = null;
        if (!logo.blocks.blockList[blk].isValueBlock()) {
            // (nextFlow remains null for valueBlock)

            // All flow blocks have a last connection (nextFlow), but
            // it can be null (i.e., end of a flow)
            if (logo.backward[turtle].length > 0) {
                // We only run backwards in the "first generation" children
                let c =
                    (
                        logo.blocks.blockList[last(logo.backward[turtle])].name
                        === "backward"
                    ) ? 1 : 2;

                if (
                    !logo.blocks.sameGeneration(
                        logo.blocks.blockList[last(logo.backward[turtle])]
                            .connections[c],
                        blk
                    )
                ) {
                    nextFlow = last(logo.blocks.blockList[blk].connections);
                } else {
                    nextFlow = logo.blocks.blockList[blk].connections[0];
                    if (
                        logo.blocks.blockList[nextFlow].name === "action" ||
                        logo.blocks.blockList[nextFlow].name === "backward"
                    ) {
                        nextFlow = null;
                    } else {
                        if (
                            !logo.blocks.sameGeneration(
                                logo.blocks.blockList[
                                    last(logo.backward[turtle])
                                ].connections[c],
                                nextFlow
                            )
                        ) {
                            nextFlow = last(
                                logo.blocks.blockList[blk].connections
                            );
                        } else {
                            nextFlow =
                                logo.blocks.blockList[blk].connections[0];
                        }
                    }
                }
            } else {
                nextFlow = last(logo.blocks.blockList[blk].connections);
            }

            if (nextFlow === -1) {
                nextFlow = null;
            }

            let queueBlock = new Queue(nextFlow, 1, blk, receivedArg);
            if (nextFlow != null) {
                // This could be the last block
                logo.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }

        // Some flow blocks have childflows, e.g., repeat
        let childFlow = null;
        let childFlowCount = 0;
        let actionArgs = [];

        if (logo.blocks.visible) {
            if (
                !logo.suppressOutput[turtle] &&
                logo.justCounting[turtle].length === 0
            ) {
                logo.blocks.highlight(blk, false);
            }
        }

        switch (logo.blocks.blockList[blk].name) {
            /** @deprecated */
            case "beginhollowline":
                logo.turtles.turtleList[turtle].doStartHollowLine();
                break;

            /** @deprecated */
            case "endhollowline":
                logo.turtles.turtleList[turtle].doEndHollowLine();
                break;

            /** @deprecated */
            case "wholeNote":
                NoteController._processNote(logo, 1, blk, turtle);
                break;

            case "halfNote":
                NoteController._processNote(logo, 2, blk, turtle);
                break;

            case "quarterNote":
                NoteController._processNote(logo, 4, blk, turtle);
                break;

            case "eighthNote":
                NoteController._processNote(logo, 8, blk, turtle);
                break;

            case "sixteenthNote":
                NoteController._processNote(logo, 16, blk, turtle);
                break;

            case "thirtysecondNote":
                NoteController._processNote(logo, 32, blk, turtle);
                break;

            case "sixtyfourthNote":
                NoteController._processNote(logo, 64, blk, turtle);
                break;

            /** @deprecated */
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
                logo.drumStyle[turtle].push(logo.blocks.blockList[blk].name);
                childFlow = args[0];
                childFlowCount = 1;

                let listenerName = "_drum_" + turtle;
                logo._setDispatchBlock(blk, turtle, listenerName);

                let __listener = event => logo.drumStyle[turtle].pop();
                logo._setListener(turtle, listenerName, __listener);

                break;

            /** @deprecated - P5 tone generator replaced by macro */
            case "tone2":
                if (_THIS_IS_TURTLE_BLOCKS_) {
                    if (typeof logo.turtleOscs[turtle] === "undefined") {
                        logo.turtleOscs[turtle] = new p5.TriOsc();
                    }

                    osc = logo.turtleOscs[turtle];
                    osc.stop();
                    osc.start();
                    osc.amp(0);

                    osc.freq(args[0]);
                    osc.fade(0.5, 0.2);

                    setTimeout(
                        osc => osc.fade(0, 0.2),
                        args[1],
                        osc
                    );
                }

                break;

            /** @deprecated */
            case "playfwd":
                logo.pitchTimeMatrix.playDirection = 1;
                logo._runFromBlock(logo, turtle, args[0]);
                break;

            /** @deprecated */
            case "playbwd":
                logo.pitchTimeMatrix.playDirection = -1;
                logo._runFromBlock(logo, turtle, args[0]);
                break;

            default:
                if (
                    typeof logo.blocks.blockList[blk].protoblock.flow ===
                    "function"
                ) {
                    let res = logo.blocks.blockList[blk].protoblock.flow(
                        args,
                        logo,
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
                    logo.blocks.blockList[blk].name in logo.evalFlowDict
                ) {
                    eval(logo.evalFlowDict[logo.blocks.blockList[blk].name]);
                } else {
                    // Could be an arg block, so we need to print its value
                    if (
                        logo.blocks.blockList[blk].isArgBlock() ||
                        [
                            "anyout",
                            "numberout",
                            "textout",
                            "booleanout"
                        ].indexOf(
                            logo.blocks.blockList[blk].protoblock.dockTypes[0]
                        ) !== -1
                    ) {
                        args.push(
                            logo.parseArg(logo, turtle, blk, logo.receievedArg)
                        );

                        if (logo.blocks.blockList[blk].value == null) {
                            logo.textMsg("null block value");
                        } else {
                            logo.textMsg(
                                logo.blocks.blockList[blk].value.toString()
                            );
                        }
                    } else {
                        logo.errorMsg(
                            "I do not know how to " +
                            logo.blocks.blockList[blk].name +
                            ".",
                            blk
                        );
                    }

                    logo.stopTurtle = true;
                }
                break;
        }

        /*
        ===========================================================================
        (3) Queue block below the current block
        ===========================================================================
        */
        // Is the block in a queued clamp?
        if (blk !== logo.ignoringBlock) {
            if (blk in logo.endOfClampSignals[turtle]) {
                let n = logo.endOfClampSignals[turtle][blk].length;
                for (let i = 0; i < n; i++) {
                    let signal = logo.endOfClampSignals[turtle][blk].pop();
                    if (signal != null) {
                        logo.stage.dispatchEvent(signal);
                    }
                }
            }
        } else {
            console.debug("Ignoring block on overlapped start.");
        }

        if (
            logo.statusMatrix &&
            logo.statusMatrix.isOpen &&
            !logo.inStatusMatrix
        ) {
            logo.statusMatrix.updateAll();
        }

        // If there is a child flow, queue it
        if (childFlow != null) {
            let queueBlock;
            if (
                logo.blocks.blockList[blk].name === "doArg" ||
                logo.blocks.blockList[blk].name === "nameddoArg"
            ) {
                queueBlock = new Queue(
                    childFlow,
                    childFlowCount,
                    blk,
                    actionArgs
                );
            } else {
                queueBlock = new Queue(
                    childFlow,
                    childFlowCount,
                    blk,
                    receivedArg
                );
            }

            // We need to keep track of the parent block to the child
            // flow so we can unhighlight the parent block after the
            // child flow completes.
            if (logo.parentFlowQueue[turtle] != undefined) {
                logo.parentFlowQueue[turtle].push(blk);
                logo.turtles.turtleList[turtle].queue.push(queueBlock);
            } else {
                console.debug("cannot find queue for turtle " + turtle);
            }
        }

        let nextBlock = null;
        let parentBlk = null;
        let passArg = null;

        // Run the last flow in the queue
        if (logo.turtles.turtleList[turtle].queue.length > queueStart) {
            nextBlock = last(logo.turtles.turtleList[turtle].queue).blk;
            parentBlk = last(logo.turtles.turtleList[turtle].queue).parentBlk;
            passArg = last(logo.turtles.turtleList[turtle].queue).args;

            // Since the forever block starts at -1, it will never === 1
            if (last(logo.turtles.turtleList[turtle].queue).count === 1) {
                // Finished child so pop it off the queue
                logo.turtles.turtleList[turtle].queue.pop();
            } else {
                // Decrement the counter for repeating the flow
                last(logo.turtles.turtleList[turtle].queue).count -= 1;
            }
        }

        if (nextBlock != null) {
            if (parentBlk !== blk) {
                // The wait block waits waitTimes longer than other
                // blocks before it is unhighlighted
                if (logo.turtleDelay === TURTLESTEP) {
                    logo.unhighlightStepQueue[turtle] = blk;
                } else {
                    if (
                        !logo.suppressOutput[turtle] &&
                        logo.justCounting[turtle].length === 0
                    ) {
                        setTimeout(() => {
                            if (logo.blocks.visible) {
                                logo.blocks.unhighlight(blk);
                            }
                        }, logo.turtleDelay + logo.waitTimes[turtle]);
                    }
                }
            }

            if (
                (logo.backward[turtle].length > 0 &&
                    logo.blocks.blockList[blk].connections[0] == null) ||
                (logo.backward[turtle].length === 0 &&
                    last(logo.blocks.blockList[blk].connections) == null)
            ) {
                if (
                    !logo.suppressOutput[turtle] &&
                    logo.justCounting[turtle].length === 0
                ) {
                    // If we are at the end of the child flow, queue the
                    // unhighlighting of the parent block to the flow
                    if (logo.unhighlightQueue[turtle] === undefined) {
                        console.debug(
                            "cannot find highlight queue for turtle " + turtle
                        );
                    } else if (
                        logo.parentFlowQueue[turtle].length > 0 &&
                        logo.turtles.turtleList[turtle].queue.length > 0 &&
                        last(logo.turtles.turtleList[turtle].queue)
                            .parentBlk !== last(logo.parentFlowQueue[turtle])
                    ) {
                        logo.unhighlightQueue[turtle].push(
                            last(logo.parentFlowQueue[turtle])
                        );
                        // logo.unhighlightQueue[turtle].push(logo.parentFlowQueue[turtle].pop());
                    } else if (logo.unhighlightQueue[turtle].length > 0) {
                        // The child flow is finally complete, so unhighlight
                        setTimeout(() => {
                            if (!turtle in logo.unhighlightQueue) {
                                console.debug(
                                    "turtle " +
                                    turtle +
                                    " not found in unhighlightQueue"
                                );
                                return;
                            }

                            if (logo.blocks.visible) {
                                logo.blocks.unhighlight(
                                    logo.unhighlightQueue[turtle].pop()
                                );
                            } else {
                                logo.unhighlightQueue[turtle].pop();
                            }
                        }, logo.turtleDelay);
                    }
                }
            }

            // We don't update parameter blocks when running full speed
            if (logo.turtleDelay !== 0) {
                for (let pblk in logo.parameterQueue[turtle]) {
                    logo._updateParameterBlock(
                        logo,
                        turtle,
                        logo.parameterQueue[turtle][pblk]
                    );
                }
            }

            if (isflow) {
                logo._runFromBlockNow(
                    logo,
                    turtle,
                    nextBlock,
                    isflow,
                    passArg,
                    queueStart
                );
            } else {
                logo._runFromBlock(logo, turtle, nextBlock, isflow, passArg);
            }
        } else {
            logo.alreadyRunning = false;

            if (!logo.prematureRestart) {
                // console.debug('Make sure any unissued signals are dispatched.');
                for (let b in logo.endOfClampSignals[turtle]) {
                    for (
                        let i = 0;
                        i < logo.endOfClampSignals[turtle][b].length;
                        i++
                    ) {
                        if (logo.endOfClampSignals[turtle][b][i] != null) {
                            if (
                                logo.butNotThese[turtle][b] == null ||
                                logo.butNotThese[turtle][b].indexOf(i) === -1
                            ) {
                                logo.stage.dispatchEvent(
                                    logo.endOfClampSignals[turtle][b][i]
                                );
                            }
                        }
                    }
                }

                // Make sure SVG path is closed
                logo.turtles.turtleList[turtle].closeSVG();

                // Mark the turtle as not running
                logo.turtles.turtleList[turtle].running = false;
                if (!logo.turtles.running() && queueStart === 0) {
                    logo.onStopTurtle();
                }
            } else {
                logo.turtles.turtleList[turtle].running = false;
            }

            // Because flow can come from calc blocks, we are not
            // ensured that the turtle is really finished running
            // yet. Hence the timeout.
            let __checkCompletionState = () => {
                if (
                    !logo.turtles.running() &&
                    queueStart === 0 &&
                    logo.justCounting[turtle].length === 0
                ) {
                    if (logo.runningLilypond) {
                        console.debug("saving lilypond output:");
                        save.afterSaveLilypond();
                        logo.runningLilypond = false;
                    } else if (logo.runningAbc) {
                        console.debug("saving abc output:");
                        save.afterSaveAbc();
                        logo.runningAbc = false;
                    } else if (logo.runningMxml) {
                        console.log('saving mxml output');
                        save.afterSaveMxml();
                        logo.runningMxml = false;
                    } else if (logo.suppressOutput[turtle]) {
                        console.debug("finishing compiling");
                        if (!logo.recording) {
                            logo.errorMsg(_("Playback is ready."));
                        }

                        logo.setPlaybackStatus();
                        logo.compiling = false;
                        for (t in logo.turtles.turtleList) {
                            logo.turtles.turtleList[t].doPenUp();
                            logo.turtles.turtleList[t].doSetXY(
                                logo._saveX[t],
                                logo._saveY[t]
                            );
                            logo.turtles.turtleList[t].color =
                                logo._saveColor[t];
                            logo.turtles.turtleList[t].value =
                                logo._saveValue[t];
                            logo.turtles.turtleList[t].chroma =
                                logo._saveChroma[t];
                            logo.turtles.turtleList[t].stroke =
                                logo._saveStroke[t];
                            logo.turtles.turtleList[t].canvasAlpha =
                                logo._saveCanvasAlpha[t];
                            logo.turtles.turtleList[t].doSetHeading(
                                logo._saveOrientation[t]
                            );
                            logo.turtles.turtleList[t].penState =
                                logo._savePenState[t];
                        }
                    }

                    // Give the last note time to play
                    console.debug(
                        "SETTING LAST NOTE TIMEOUT: " +
                        logo.recording +
                        " " +
                        logo.suppressOutput[turtle]
                    );
                    logo.lastNoteTimeout = setTimeout(() => {
                        console.debug("LAST NOTE PLAYED");
                        logo.lastNoteTimeout = null;
                        if (logo.suppressOutput[turtle] && logo.recording) {
                            logo.suppressOutput[turtle] = false;
                            logo.checkingCompletionState = false;
                            logo.saveLocally();
                            console.debug("PLAYBACK FOR RECORD");
                            logo.playback(-1, true);
                            // logo.recording = false;
                        } else {
                            logo.suppressOutput[turtle] = false;
                            logo.checkingCompletionState = false;

                            // Reset the cursor
                            document.body.style.cursor = "default";

                            // Save the session
                            logo.saveLocally();
                        }
                    }, 1000);
                } else if (logo.suppressOutput[turtle]) {
                    setTimeout(() => __checkCompletionState(), 250);
                }
            };

            if (
                !logo.turtles.running() &&
                queueStart === 0 &&
                logo.justCounting[turtle].length === 0
            ) {
                if (!logo.checkingCompletionState) {
                    logo.checkingCompletionState = true;
                    setTimeout(() => __checkCompletionState(), 250);
                }
            }

            if (
                !logo.suppressOutput[turtle] &&
                logo.justCounting[turtle].length === 0
            ) {
                // Nothing else to do. Clean up.
                if (
                    logo.turtles.turtleList[turtle].queue.length === 0 ||
                    blk !==
                    last(logo.turtles.turtleList[turtle].queue).parentBlk
                ) {
                    setTimeout(() => {
                        if (logo.blocks.visible) {
                            logo.blocks.unhighlight(blk);
                        }
                    }, logo.turtleDelay);
                }

                // Unhighlight any parent blocks still highlighted
                for (let b in logo.parentFlowQueue[turtle]) {
                    if (logo.blocks.visible) {
                        logo.blocks.unhighlight(
                            logo.parentFlowQueue[turtle][b]
                        );
                    }
                }

                // Make sure the turtles are on top
                let i = logo.stage.children.length - 1;
                logo.stage.setChildIndex(
                    logo.turtles.turtleList[turtle].container,
                    i
                );
                logo.refreshCanvas();
            }

            for (let arg in logo.evalOnStopList) {
                eval(logo.evalOnStopList[arg]);
            }

            if (!logo.turtles.running() && queueStart === 0) {
                /** @todo Enable playback button here */
                if (logo.showBlocksAfterRun) {
                    // If this is a status stack, not run showBlocks
                    if (
                        blk !== null &&
                        logo.blocks.blockList[blk].connections[0] !== null &&
                        logo.blocks.blockList[
                            logo.blocks.blockList[blk].connections[0]
                        ].name === "status"
                    ) {
                        console.debug("running status block");
                    } else {
                        logo.showBlocks();
                        logo.showBlocksAfterRun = false;
                    }
                }
                document.getElementById("stop").style.color = "white";
            }
        }
    }

    /**
     * Sets the master volume to a value of at least 0 and at most 100.
     *
     * @privileged
     * @param {number} volume
     * @returns {void}
     */
    _setMasterVolume(volume) {
        if (volume > 100) {
            volume = 100;
        } else if (volume < 0) {
            volume = 0;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.synth.setMasterVolume(volume);
            for (
                let turtle = 0;
                turtle < this.turtles.turtleList.length;
                turtle++
            ) {
                for (let synth in this.synthVolume[turtle]) {
                    this.synthVolume[turtle][synth].push(volume);
                }
            }
        }
    }

    /**
     * Sets the synth volume to a value of at least 0 and,
     * unless the synth is noise3, at most 100.
     *
     * @privileged
     * @param turtle
     * @param synth
     * @param {number} volume
     * @returns {void}
     */
    setSynthVolume(turtle, synth, volume) {
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
                    // Noise is very very loud
                    this.synth.setVolume(turtle, synth, volume / 25);
                    break;
                default:
                    this.synth.setVolume(turtle, synth, volume);
                    break;
            }
        }
    }

    /**
     * Pushes obj to playback queue, if possible.
     *
     * @privileged
     * @param turtle
     * @param obj
     * @returns {void}
     */
    _playbackPush(turtle, obj) {
        // We only push for saveWAV, etc.
        if (!this.recordingStatus()) return;

        // Don't record in optimize mode or Turtle Blocks
        if (_THIS_IS_MUSIC_BLOCKS_ && !this.optimize) {
            this.playbackQueue[turtle].push(obj);
        }
    }

    /**
     * Plays back some amount of activity.
     *
     * @privileged
     * @param {number} whichMouse
     * @param {boolean} [recording]
     * @returns {void}
     */
    playback(whichMouse, recording) {
        if (this.restartPlayback) {
            this.progressBarWidth = 0;
        }

        if (recording === undefined)    recording = false;

        this.recording = recording;

        if (recording) {
            this.playbackTime = 0;
        }

        let inFillClamp = false;
        let inHollowLineClamp = false;

        if (this.turtles.running()) {
            console.debug(this.turtles.running() + " PUNTING");
            if (this.playbackTime !== 0) {
                this.stopTurtle = true;
            }

            return;
        } else if (this.playbackTime === 0) {
            this.hideBlocks();
            this.showBlocksAfterRun = true;
        }

        // We need to sort the playback queue by time (as graphics
        // embedded in embedded notes can be out of order)
        if (this.turtles.turtleList.length > 0) {
            for (t in this.turtles.turtleList) {
                if (t in this.playbackQueue) {
                    let playbackList = [];
                    for (let i = 0; i < this.playbackQueue[t].length; i++) {
                        playbackList.push([i, this.playbackQueue[t][i]]);
                    }

                    let sortedList = playbackList.sort((a, b) => {
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

        this.firstNoteTime = new Date().getTime() - 1000 * this.playbackTime;

        if (this.progressBarWidth >= 100) {
            this.progressBarWidth = 0;
        }

        let l = 0;
        for (let turtle in this.playbackQueue) {
            // For multiple voices
            l += this.playbackQueue[turtle].length;
        }

        this.progressBarDivision =
            t in this.playbackQueue && l > 0 ?
                100 / this.playbackQueue[t].length :
                100;

        let turtleCount = 0;
        let inLoop = 0;

        let __playbackLoop = (turtle, idx) => {
            inLoop++;
            this.playbackTime = this.playbackQueue[turtle][idx][0];

            if (turtleCount === 0) {
                // Not sure if it happens, but just in case
                turtleCount = 1;
            }

            this.progressBarWidth += this.progressBarDivision / turtleCount;

            if (inLoop === l || this.progressBarWidth > 100) {
                this.progressBarWidth = 100;
            }

            if (this.progressBarWidth === NaN) {
                // Not sure if it happens, but just in case
                this.progressBar.style.visibility = "hidden";
            }

            this.progressBar.style.width = this.progressBarWidth + "%";
            this.progressBar.innerHTML =
                parseInt(this.progressBarWidth * 1) + "%";

            if (!this.stopTurtle) {
                switch (this.playbackQueue[turtle][idx][1]) {
                    case "fill":
                        if (inFillClamp) {
                            this.turtles.turtleList[turtle].doEndFill();
                            inFillClamp = false;
                        } else {
                            this.turtles.turtleList[turtle].doStartFill();
                            inFillClamp = true;
                        }
                        break;

                    case "hollowline":
                        if (inHollowLineClamp) {
                            this.turtles.turtleList[turtle].doEndHollowLine();
                            inHollowLineClamp = false;
                        } else {
                            this.turtles.turtleList[turtle].doStartHollowLine();
                            inHollowLineClamp = true;
                        }
                        break;

                    case "notes":
                        if (_THIS_IS_MUSIC_BLOCKS_) {
                            if (this.blinkState) {
                                this.turtles.turtleList[turtle].blink(
                                    this.playbackQueue[turtle][idx][3],
                                    50
                                );
                            }

                            this.lastNote[turtle] =
                                this.playbackQueue[turtle][idx][3];

                            this.synth.trigger(
                                turtle,
                                this.playbackQueue[turtle][idx][2],
                                this.playbackQueue[turtle][idx][3],
                                this.playbackQueue[turtle][idx][4],
                                this.playbackQueue[turtle][idx][5],
                                this.playbackQueue[turtle][idx][6]
                            );
                        }
                        break;

                    case "controlpoint1":
                        this.cp1x[turtle] = this.playbackQueue[turtle][idx][2];
                        this.cp1y[turtle] = this.playbackQueue[turtle][idx][3];
                        break;

                    case "controlpoint2":
                        this.cp2x[turtle] = this.playbackQueue[turtle][idx][2];
                        this.cp2y[turtle] = this.playbackQueue[turtle][idx][3];
                        break;

                    case "bezier":
                        this.turtles.turtleList[turtle].doBezier(
                            this.cp1x[turtle],
                            this.cp1y[turtle],
                            this.cp2x[turtle],
                            this.cp2y[turtle],
                            this.playbackQueue[turtle][idx][2],
                            this.playbackQueue[turtle][idx][3]
                        );
                        break;

                    case "show":
                        this._processShow(
                            turtle,
                            null,
                            this.playbackQueue[turtle][idx][2],
                            this.playbackQueue[turtle][idx][3]
                        );
                        break;

                    case "speak":
                        this._processSpeak(this.playbackQueue[turtle][idx][2]);
                        break;

                    case "print":
                        this.textMsg(
                            this.playbackQueue[turtle][idx][2].toString()
                        );
                        break;

                    case "setvolume":
                        this._setMasterVolume(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "setsynthvolume":
                        this.setSynthVolume(
                            turtle,
                            this.playbackQueue[turtle][idx][2],
                            this.playbackQueue[turtle][idx][3]
                        );
                        break;

                    case "arc":
                        this.turtles.turtleList[turtle].doArc(
                            this.playbackQueue[turtle][idx][2],
                            this.playbackQueue[turtle][idx][3]
                        );
                        break;

                    case "setxy":
                        this.turtles.turtleList[turtle].doSetXY(
                            this.playbackQueue[turtle][idx][2],
                            this.playbackQueue[turtle][idx][3]
                        );
                        break;

                    case "scrollxy":
                        this.turtles.turtleList[turtle].doSetXY(
                            this.playbackQueue[turtle][idx][2],
                            this.playbackQueue[turtle][idx][3]
                        );
                        break;

                    case "forward":
                        this.turtles.turtleList[turtle].doForward(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "right":
                        this.turtles.turtleList[turtle].doRight(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "setheading":
                        this.turtles.turtleList[turtle].doSetHeading(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "clear":
                        this.svgBackground = true;
                        this.turtles.turtleList[turtle].penState = false;
                        this.turtles.turtleList[turtle].doSetHeading(0);
                        this.turtles.turtleList[turtle].doSetXY(0, 0);
                        this.turtles.turtleList[turtle].penState = true;
                        // this.turtles.turtleList[turtle].doClear(true, true, true);
                        break;

                    case "setcolor":
                        this.turtles.turtleList[turtle].doSetColor(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "sethue":
                        this.turtles.turtleList[turtle].doSetHue(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "setshade":
                        this.turtles.turtleList[turtle].doSetValue(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "settranslucency":
                        this.turtles.turtleList[turtle].doSetPenAlpha(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "setgrey":
                        this.turtles.turtleList[turtle].doSetChroma(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "setpensize":
                        this.turtles.turtleList[turtle].doSetPensize(
                            this.playbackQueue[turtle][idx][2]
                        );
                        break;

                    case "penup":
                        this.turtles.turtleList[turtle].doPenUp();
                        break;

                    case "pendown":
                        this.turtles.turtleList[turtle].doPenDown();
                        break;

                    default:
                        console.debug(this.playbackQueue[turtle][idx][1]);
                        break;
                }

                ++idx;
                let elapsedTime = new Date().getTime() - this.firstNoteTime;
                if (this.playbackQueue[turtle].length > idx) {
                    let timeout =
                        this.playbackQueue[turtle][idx][0] * 1000 - elapsedTime;
                    if (timeout < 0) {
                        timeout = 0;
                    }

                    setTimeout(() => __playbackLoop(turtle, idx), timeout);
                } else {
                    if (turtle < this.turtles.turtleList.length) {
                        this.turtles.turtleList[turtle].running = false;
                    }

                    if (!this.turtles.running()) {
                        this.onStopTurtle();
                        this.playbackTime = 0;
                        if (recording) {
                            let lastNote = 0;
                            for (let turtle in this.playbackQueue) {
                                if (this.lastNote[turtle] > lastNote) {
                                    lastNote = this.lastNote[turtle];
                                }
                            }

                            setTimeout(() => {
                                console.debug("FINISHING RECORDING");
                                this.synth.recorder.stop();
                                this.synth.recorder.exportWAV(
                                    save.afterSaveWAV.bind(save)
                                );
                                this.recording = false;
                            }, Math.max(2000, lastNote * 1000));
                        }
                    }

                    this.showBlocks();
                    this.showBlocksAfterRun = false;
                }
            } else {
                this.turtles.turtleList[turtle].running = false;
                this.showBlocks();
                this.showBlocksAfterRun = false;
            }
        };

        let __playback = turtle => {
            turtleCount++;
            setTimeout(
                () => __playbackLoop(turtle, 0),
                this.playbackQueue[turtle][0][0] * 1000
            );
        };

        let __resumePlayback = turtle => {
            turtleCount++;
            let idx = 0;
            for (; idx < this.playbackQueue[turtle].length; idx++) {
                if (this.playbackQueue[turtle][idx][0] >= this.playbackTime) {
                    break;
                }
            }

            console.debug("resume index: " + idx);

            if (idx < this.playbackQueue[turtle].length) {
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
            for (let turtle in this.playbackQueue) {
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
    }

    /**
     * Dispatches turtle signals to update turtle graphics.
     *
     * @privileged
     * @async
     * @param turtle
     * @param {number} beatValue
     * @param blk
     * @param {number} delay
     * @returns {void}
     */
    async _dispatchTurtleSignals(
        turtle,
        beatValue,
        blk,
        delay
    ) {
        // When turtle commands (forward, right, arc) are inside of notes,
        // they are run progressively over the course of the note duration
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
        // slight delay before drawing any new graphics
        if (!this.embeddedGraphicsFinished[turtle]) {
            delay += 0.1;
        }

        this.embeddedGraphicsFinished[turtle] = false;

        let suppressOutput = this.suppressOutput[turtle];

        let __pen = (turtle, name, arg, timeout) => {
            let _penSwitch = name => {
                switch (name) {
                    case "penup":
                        this.turtles.turtleList[turtle].doPenUp();
                        break;
                    case "pendown":
                        this.turtles.turtleList[turtle].doPenDown();
                        break;
                    case "setcolor":
                        this.turtles.turtleList[turtle].doSetColor(arg);
                        break;
                    case "sethue":
                        this.turtles.turtleList[turtle].doSetHue(arg);
                        break;
                    case "setshade":
                        this.turtles.turtleList[turtle].doSetValue(arg);
                        break;
                    case "settranslucency":
                        this.turtles.turtleList[turtle].doSetPenAlpha(arg);
                        break;
                    case "setgrey":
                        this.turtles.turtleList[turtle].doSetChroma(arg);
                        break;
                    case "setpensize":
                        this.turtles.turtleList[turtle].doSetPensize(arg);
                        break;
                }
            };

            if (suppressOutput) {
                _penSwitch(name);
            } else {
                setTimeout(() => _penSwitch(name), timeout);
            }
        };

        let __clear = (turtle, timeout) => {
            if (this.suppressOutput[turtle]) {
                let savedPenState = this.turtles.turtleList[turtle].penState;
                this.turtles.turtleList[turtle].penState = false;
                this.turtles.turtleList[turtle].doSetXY(0, 0);
                this.turtles.turtleList[turtle].doSetHeading(0);
                this.turtles.turtleList[turtle].penState = savedPenState;
                this.svgBackground = true;
            } else {
                this.turtles.turtleList[turtle].penState = false;
                this.turtles.turtleList[turtle].doSetHeading(0);
                this.turtles.turtleList[turtle].doSetXY(0, 0);
                this.turtles.turtleList[turtle].penState = true;
                // this.turtles.turtleList[turtle].doClear(true, true, true);
            }
        };

        let __right = (turtle, arg, timeout) => {
            if (suppressOutput) {
                let savedPenState = this.turtles.turtleList[turtle].penState;
                this.turtles.turtleList[turtle].penState = false;
                this.turtles.turtleList[turtle].doRight(arg);
                this.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(
                    () => this.turtles.turtleList[turtle].doRight(arg),
                    timeout
                );
            }
        };

        let __setheading = (turtle, arg, timeout) => {
            if (suppressOutput) {
                this.turtles.turtleList[turtle].doSetHeading(arg);
            } else {
                setTimeout(
                    () => this.turtles.turtleList[turtle].doSetHeading(arg),
                    timeout
                );
            }
        };

        let __forward = (turtle, arg, timeout) => {
            if (suppressOutput) {
                let savedPenState = this.turtles.turtleList[turtle].penState;
                this.turtles.turtleList[turtle].penState = false;
                this.turtles.turtleList[turtle].doForward(arg);
                this.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(
                    () => this.turtles.turtleList[turtle].doForward(arg),
                    timeout
                );
            }
        };

        let __scrollxy = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                this.turtles.turtleList[turtle].doScrollXY(arg1, arg2);
            } else {
                setTimeout(
                    () => this.turtles.turtleList[turtle].doScrollXY(arg1, arg2),
                    timeout
                );
            }
        };

        let __setxy = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                let savedPenState = this.turtles.turtleList[turtle].penState;
                this.turtles.turtleList[turtle].penState = false;
                this.turtles.turtleList[turtle].doSetXY(arg1, arg2);
                this.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(
                    () => this.turtles.turtleList[turtle].doSetXY(arg1, arg2),
                    timeout
                );
            }
        };

        let __show = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) return;

            setTimeout(
                () => this._processShow(turtle, null, arg1, arg2),
                timeout
            );
        }

        let __speak = (turtle, arg, timeout) => {
            if (suppressOutput) return;

            setTimeout(() => this._processSpeak(arg), timeout);
        }

        let __print = (arg, timeout) => {
            if (suppressOutput) return;

            setTimeout(() => this.textMsg(arg.toString()), timeout);
        }

        let __arc = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                let savedPenState = this.turtles.turtleList[turtle].penState;
                this.turtles.turtleList[turtle].penState = false;
                this.turtles.turtleList[turtle].doArc(arg1, arg2);
                this.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(
                    () => this.turtles.turtleList[turtle].doArc(arg1, arg2),
                    timeout
                );
            }
        };

        let __cp1 = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                this.cp1x[turtle] = arg1;
                this.cp1y[turtle] = arg2;
            } else {
                setTimeout(() => {
                    this.cp1x[turtle] = arg1;
                    this.cp1y[turtle] = arg2;
                }, timeout);
            }
        };

        let __cp2 = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                this.cp2x[turtle] = arg1;
                this.cp2y[turtle] = arg2;
            } else {
                setTimeout(() => {
                    this.cp2x[turtle] = arg1;
                    this.cp2y[turtle] = arg2;
                }, timeout);
            }
        };

        let __bezier = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                let savedPenState = this.turtles.turtleList[turtle].penState;
                this.turtles.turtleList[turtle].penState = false;
                this.turtles.turtleList[turtle].doBezier(
                    this.cp1x[turtle],
                    this.cp1y[turtle],
                    this.cp2x[turtle],
                    this.cp2y[turtle],
                    arg1,
                    arg2
                );
                this.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(() => {
                    this.turtles.turtleList[turtle].doBezier(
                        this.cp1x[turtle],
                        this.cp1y[turtle],
                        this.cp2x[turtle],
                        this.cp2y[turtle],
                        arg1,
                        arg2
                    );
                }, timeout);
            }
        };

        let inFillClamp = false;
        let __fill = (turtle, timeout) => {
            if (suppressOutput) {
                let savedPenState = this.turtles.turtleList[turtle].penState;
                this.turtles.turtleList[turtle].penState = false;
                if (inFillClamp) {
                    this.turtles.turtleList[turtle].doEndFill();
                    inFillClamp = false;
                } else {
                    this.turtles.turtleList[turtle].doStartFill();
                    inFillClamp = true;
                }

                this.turtles.turtleList[turtle].penState = savedPenState;
            } else {
                setTimeout(() => {
                    if (inFillClamp) {
                        this.turtles.turtleList[turtle].doEndFill();
                        inFillClamp = false;
                    } else {
                        this.turtles.turtleList[turtle].doStartFill();
                        inFillClamp = true;
                    }
                }, timeout);
            }
        };

        let inHollowLineClamp = false;
        let __hollowline = (turtle, timeout) => {
            if (suppressOutput) {
                if (inHollowLineClamp) {
                    this.turtles.turtleList[turtle].doEndHollowLine();
                    inHollowLineClamp = false;
                } else {
                    this.turtles.turtleList[turtle].doStartHollowLine();
                    inHollowLineClamp = true;
                }
            } else {
                setTimeout(() => {
                    if (inHollowLineClamp) {
                        this.turtles.turtleList[turtle].doEndHollowLine();
                        inHollowLineClamp = false;
                    } else {
                        this.turtles.turtleList[turtle].doStartHollowLine();
                        inHollowLineClamp = true;
                    }
                }, timeout);
            }
        };

        let extendedGraphicsCounter = 0;
        for (let i = 0; i < this.embeddedGraphics[turtle][blk].length; i++) {
            let b = this.embeddedGraphics[turtle][blk][i];
            switch (this.blocks.blockList[b].name) {
                case "forward":
                case "back":
                case "right":
                case "left":
                case "arc":
                    ++extendedGraphicsCounter;
                    break;
                default:
                    break;
            }
        }

        // Cheat by 0.5% so that the mouse has time to complete its work
        // let stepTime = beatValue * 1000 / NOTEDIV;
        let stepTime = ((beatValue - delay) * 995) / NOTEDIV;
        if (stepTime < 0)   stepTime = 0;

        // We do each graphics action sequentially, so we need to
        // divide stepTime by the length of the embedded graphics
        // array
        if (extendedGraphicsCounter > 0) {
            stepTime = stepTime / extendedGraphicsCounter;
        }

        let waitTime = delay * 1000;

        // Update the turtle graphics every 50ms within a note
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

        for (let i = 0; i < this.embeddedGraphics[turtle][blk].length; i++) {
            let b = this.embeddedGraphics[turtle][blk][i];
            let name = this.blocks.blockList[b].name;

            let arg, arg1, arg2;

            switch (name) {
                case "setcolor":
                case "sethue":
                case "setshade":
                case "settranslucency":
                case "setgrey":
                case "setpensize":
                    arg = this.parseArg(
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
                    arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    arg2 = this.parseArg(
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
                    arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    arg2 = this.parseArg(
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
                    /**
                     * @todo Is there a reasonable way to break the bezier
                     * curve up into small steps?
                     */
                    arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    arg2 = this.parseArg(
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
                    arg = this.parseArg(
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
                    arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );

                    for (
                        let t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        let deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        let deltaArg =
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
                    arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );

                    for (
                        let t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        let deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        let deltaArg =
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
                    arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );

                    for (
                        let t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        let deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        let deltaArg =
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
                    arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );

                    for (
                        let t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        let deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        let deltaArg =
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
                    arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    arg2 = this.parseArg(
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
                    arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    arg2 = this.parseArg(
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
                    arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    arg2 = this.parseArg(
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
                    arg = this.parseArg(
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
                    arg = this.parseArg(
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
                    arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );

                    for (
                        let t = 0;
                        t < NOTEDIV / this.dispatchFactor[turtle];
                        t++
                    ) {
                        let deltaTime =
                            waitTime +
                            t * stepTime * this.dispatchFactor[turtle];
                        let deltaArg =
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

        // Mark the end time of this note's graphics operations
        await delayExecution(beatValue * 1000);
        this.embeddedGraphicsFinished[turtle] = true;
    }

    /**
     * Sets a named listener after removing any existing listener in the same place.
     *
     * @privileged
     * @param turtle
     * @param {string} listenerName
     * @param {Function} listener
     * @returns {void}
     */
    _setListener(turtle, listenerName, listener) {
        if (listenerName in this.turtles.turtleList[turtle].listeners) {
            this.stage.removeEventListener(
                listenerName,
                this.turtles.turtleList[turtle].listeners[listenerName],
                false
            );
        }

        this.turtles.turtleList[turtle].listeners[listenerName] = listener;
        this.stage.addEventListener(listenerName, listener, false);
    }

    /**
     * Sets a single dispatch block.
     *
     * @privileged
     * @param blk
     * @param turtle
     * @param {string} listenerName
     * @returns {void}
     */
    _setDispatchBlock(blk, turtle, listenerName) {
        if (!this.inDuplicate[turtle] && this.backward[turtle].length > 0) {
            let c =
                this.blocks.blockList[last(this.backward[turtle])].name ===
                    "backward" ?
                    1 : 2;
            if (
                this.blocks.sameGeneration(
                    this.blocks.blockList[last(this.backward[turtle])]
                        .connections[c],
                    blk
                )
            ) {
                let nextBlock = this.blocks.blockList[blk].connections[0];
                if (nextBlock in this.endOfClampSignals[turtle]) {
                    this.endOfClampSignals[turtle][nextBlock].push(
                        listenerName
                    );
                } else {
                    this.endOfClampSignals[turtle][nextBlock] = [listenerName];
                }
            } else {
                let nextBlock = last(this.blocks.blockList[blk].connections);
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
            let nextBlock = last(this.blocks.blockList[blk].connections);
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
    }

    /**
     * Initialises and starts a default synth.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    resetSynth(turtle) {
        if (!("electronic synth" in instruments[turtle])) {
            this.synth.createDefaultSynth(turtle);
        }

        this._setMasterVolume(DEFAULTVOLUME);
        for (let synth in this.synthVolume[turtle]) {
            this.setSynthVolume(turtle, synth, DEFAULTVOLUME);
        }

        this.synth.start();
    }

    /**
     * Speaks all characters in the range of comma,
     * full stop, space, A to Z, a to z in the input text.
     *
     * @privileged
     * @param {string} text
     * @returns {void}
     */
    _processSpeak(text) {
        let new_text = "";
        for (let i in text) {
            if (new RegExp("^[A-Za-z,. ]$").test(text[i]))
                new_text += text[i];
        }

        if (this.meSpeak !== null) {
            this.meSpeak.speak(new_text);
        }
    }

    /**
     * Shows information: with camera, in image form, at URL, as text.
     *
     * @privileged
     * @param turtle
     * @param blk
     * @param arg0
     * @param arg1
     * @returns {void}
     */
    _processShow(turtle, blk, arg0, arg1) {
        if (typeof arg1 === "string") {
            let len = arg1.length;
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
    }

    /**
     * If the input name is forever, repeat, while or until,
     * returns true (false otherwise).
     *
     * @privileged
     * @param {string} name
     * @returns {boolean}
     */
    _loopBlock(name) {
        return ["forever", "repeat", "while", "until"].indexOf(name) !== -1;
    }

    /**
     * Breaks a loop.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    _doBreak(turtle) {
        // Look for a parent loopBlock in queue and set its count to 1
        let parentLoopBlock = null;
        let loopBlkIdx = -1;

        let queueLength = this.turtles.turtleList[turtle].queue.length;
        for (let i = queueLength - 1; i > -1; i--) {
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
                // Flush the parent from the queue
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
                // Flush the parent from the queue
                this.turtles.turtleList[turtle].queue.pop();
                break;
            }
        }

        if (parentLoopBlock == null) {
            // Flush the child flow
            this.turtles.turtleList[turtle].queue.pop();
            return;
        }

        // For while and until, we need to add any childflow from the
        // parent to the queue
        if (
            parentLoopBlock.name === "while" ||
            parentLoopBlock.name === "until"
        ) {
            let childFlow = last(parentLoopBlock.connections);
            if (childFlow != null) {
                let queueBlock = new Queue(childFlow, 1, loopBlkIdx);
                // We need to keep track of the parent block to the
                // child flow so we can unlightlight the parent block
                // after the child flow completes
                this.parentFlowQueue[turtle].push(loopBlkIdx);
                this.turtles.turtleList[turtle].queue.push(queueBlock);
            }
        }
    }

    /**
     * Parses receivedArg.
     *
     * @privileged
     * @param logo
     * @param turtle
     * @param blk
     * @param parentBlk
     * @param receivedArg
     * @returns {mixed}
     */
    parseArg(logo, turtle, blk, parentBlk, receivedArg) {
        // Retrieve the value of a block
        if (blk == null) {
            logo.errorMsg(NOINPUTERRORMSG, parentBlk);
            // logo.stopTurtle = true;
            return null;
        }

        if (logo.blocks.blockList[blk].protoblock.parameter) {
            if (turtle in logo.parameterQueue) {
                if (logo.parameterQueue[turtle].indexOf(blk) === -1) {
                    logo.parameterQueue[turtle].push(blk);
                }
            } else {
                // console.debug('turtle ' + turtle + ' has no parameterQueue');
            }
        }

        if (typeof logo.blocks.blockList[blk].protoblock.arg === "function") {
            return (logo.blocks.blockList[blk].value = logo.blocks.blockList[
                blk
            ].protoblock.arg(logo, turtle, blk, receivedArg));
        }

        if (logo.blocks.blockList[blk].name === "intervalname") {
            if (typeof logo.blocks.blockList[blk].value === "string") {
                logo.noteDirection[turtle] = getIntervalDirection(
                    logo.blocks.blockList[blk].value
                );
                return getIntervalNumber(logo.blocks.blockList[blk].value);
            } else return 0;
        } else if (logo.blocks.blockList[blk].isValueBlock()) {
            if (logo.blocks.blockList[blk].name in logo.evalArgDict) {
                eval(logo.evalArgDict[logo.blocks.blockList[blk].name]);
            }

            return logo.blocks.blockList[blk].value;
        } else if (
            ["anyout", "numberout", "textout", "booleanout"].indexOf(
                logo.blocks.blockList[blk].protoblock.dockTypes[0]
            ) !== -1
        ) {
            switch (logo.blocks.blockList[blk].name) {
                case "dectofrac":
                    if (
                        logo.inStatusMatrix &&
                        logo.blocks.blockList[
                            logo.blocks.blockList[blk].connections[0]
                        ].name === "print"
                    ) {
                        logo.statusFields.push([blk, "dectofrac"]);
                    } else {
                        let cblk = logo.blocks.blockList[blk].connections[1];
                        if (cblk === null) {
                            logo.errorMsg(NOINPUTERRORMSG, blk);
                            logo.blocks.blockList[blk].value = 0;
                        } else {
                            let a = logo.parseArg(
                                logo,
                                turtle,
                                cblk,
                                blk,
                                receivedArg
                            );
                            if (typeof a === "number") {
                                if (a < 0) {
                                    a = a * -1;
                                    logo.blocks.blockList[blk].value =
                                        "-" + mixedNumber(a);
                                } else {
                                    logo.blocks.blockList[
                                        blk
                                    ].value = mixedNumber(a);
                                }
                            } else {
                                logo.errorMsg(NANERRORMSG, blk);
                                logo.blocks.blockList[blk].value = 0;
                            }
                        }
                    }
                    break;

                case "hue":
                    if (
                        logo.inStatusMatrix &&
                        logo.blocks.blockList[
                            logo.blocks.blockList[blk].connections[0]
                        ].name === "print"
                    ) {
                        logo.statusFields.push([blk, "color"]);
                    } else {
                        logo.blocks.blockList[blk].value =
                            logo.turtles.turtleList[turtle].color;
                    }
                    break;

                /** @deprecated */
                case "returnValue":
                    if (logo.returns[turtle].length > 0) {
                        logo.blocks.blockList[blk].value = logo.returns[
                            turtle
                        ].pop();
                    } else {
                        console.debug("WARNING: No return value.");
                        logo.blocks.blockList[blk].value = 0;
                    }
                    break;

                default:
                    if (logo.blocks.blockList[blk].name in logo.evalArgDict) {
                        eval(logo.evalArgDict[logo.blocks.blockList[blk].name]);
                    } else {
                        console.error(
                            "I do not know how to " +
                            logo.blocks.blockList[blk].name
                        );
                    }
                    break;
            }

            return logo.blocks.blockList[blk].value;
        } else {
            return blk;
        }
    }

    /**
     * Counts notes, with saving of the box, heap and turtle states.
     *
     * @privileged
     * @param turtle
     * @param cblk
     * @returns {number}
     */
    _noteCounter(turtle, cblk) {
        if (cblk != null) {
            let saveSuppressStatus = this.suppressOutput[turtle];

            // We need to save the state of the boxes and heap
            // although there is a potential of a boxes collision with
            // other turtles
            let saveBoxes = JSON.stringify(this.boxes);
            let saveTurtleHeaps = JSON.stringify(this.turtleHeaps[turtle]);
            // .. and the turtle state
            let saveX = this.turtles.turtleList[turtle].x;
            let saveY = this.turtles.turtleList[turtle].y;
            let saveColor = this.turtles.turtleList[turtle].color;
            let saveValue = this.turtles.turtleList[turtle].value;
            let saveChroma = this.turtles.turtleList[turtle].chroma;
            let saveStroke = this.turtles.turtleList[turtle].stroke;
            let saveCanvasAlpha = this.turtles.turtleList[turtle].canvasAlpha;
            let saveOrientation = this.turtles.turtleList[turtle].orientation;
            let savePenState = this.turtles.turtleList[turtle].penState;

            let saveWhichNoteToCount = this.whichNoteToCount[turtle];

            let savePrevTurtleTime = this.previousTurtleTime[turtle];
            let saveTurtleTime = this.turtleTime[turtle];

            this.suppressOutput[turtle] = true;
            this.justCounting[turtle].push(true);

            for (let b in this.endOfClampSignals[turtle]) {
                this.butNotThese[turtle][b] = [];
                for (
                    let i = 0;
                    i < this.endOfClampSignals[turtle][b].length;
                    i++
                ) {
                    this.butNotThese[turtle][b].push(i);
                }
            }

            let actionArgs = [];
            let saveNoteCount = this.notesPlayed[turtle];
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

            let returnValue = rationalSum(this.notesPlayed[turtle], [
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

            return returnValue[0] / returnValue[1];
        }

        return 0;
    }

    /**
     * Makes the turtle wait.
     *
     * @privileged
     * @param turtle
     * @param secs
     * @returns {void}
     */
    _doWait(turtle, secs) {
        this.waitTimes[turtle] = Number(secs) * 1000;
    }

    /**
     * Returns a random integer in a range.
     *
     * @privileged
     * @param a - preferably the minimum
     * @param b - preferably the maximum
     * @returns {number}
     */
    _doRandom(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        // Check to see if min is > max
        if (a > b) [a, b] = [b, a];

        return Math.floor(
            Math.random() * (Number(b) - Number(a) + 1) + Number(a)
        );
    }

    /**
     * Randomly returns either a or b.
     *
     * @privileged
     * @param a
     * @param b
     * @returns {*}
     */
    _doOneOf(a, b) {
        return Math.random() < 0.5 ? a : b;
    }

    /**
     * Returns a modulo b.
     *
     * @privileged
     * @param a
     * @param b
     * @returns {number}
     */
    _doMod(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) % Number(b);
    }

    /**
     * Square-roots a number.
     *
     * @privileged
     * @param a
     * @returns {number}
     */
    _doSqrt(a) {
        if (typeof a === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.sqrt(Number(a));
    }

    /**
     * Adds a and b.
     *
     * @privileged
     * @param a
     * @param b
     * @returns {number|string}
     */
    _doPlus(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            let aString = typeof a === "string" ? a : a.toString();
            let bString = typeof b === "string" ? b : b.toString();

            return aString + bString;
        } else {
            return Number(a) + Number(b);
        }
    }

    /**
     * Subtracts b from a.
     *
     * @privileged
     * @param a
     * @param b
     * @returns {number}
     */
    _doMinus(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) - Number(b);
    }

    /**
     * Multiplies a by b.
     *
     * @privileged
     * @param a
     * @param b
     * @returns {number}
     */
    _doMultiply(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Number(a) * Number(b);
    }

    /**
     * Calculates euclidean distance between (cursor x, cursor y)
     * and (mouse 'x' and mouse 'y').
     *
     * @privileged
     * @param a
     * @param b
     * @param c
     * @param d
     * @returns {number}
     */
    _docalculatedistance(x1, y1, x2, y2) {
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
    }

    /**
     * Returns a to the power of b.
     *
     * @privileged
     * @param a
     * @param b
     * @returns {number}
     */
    _doPower(a, b) {
        if (typeof a === "string" || typeof b === "string") {
            this.errorMsg(NANERRORMSG);
            this.stopTurtle = true;
            return 0;
        }

        return Math.pow(a, b);
    }

    /**
     * Divides a by b.
     *
     * @privileged
     * @param a
     * @param b
     * @returns {number}
     */
    _doDivide(a, b) {
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
    }

    /**
     * Changes body background in DOM to current colour.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    setBackgroundColor(turtle) {
        let c =
            turtle === -1 ?
                platformColor.background :
                this.turtles.turtleList[turtle].canvasColor;

        // docById('myCanvas').style.background = c;
        this.turtles.setBackgroundColor(c);
        this.turtles.makeBackground(this.turtles.isShrunk());

        this.svgOutput = "";
    }

    /**
     * Sets the cameraID property.
     *
     * @privileged
     * @param id
     * @returns {void}
     */
    setCameraID(id) {
        this.cameraID = id;
    }

    /**
     * Hides all the blocks.
     *
     * @privileged
     * @returns {void}
     */
    hideBlocks(show) {
        this.blocks.palettes.hide();
        this.blocks.hide();
        this.refreshCanvas();
        this.showBlocksAfterRun = show !== undefined && show;
    }

    /**
     * Shows all the blocks.
     *
     * @privileged
     * @returns {void}
     */
    showBlocks() {
        this.blocks.palettes.show();
        this.blocks.show();
        this.blocks.bringToTop();
        this.refreshCanvas();
    }

    /**
     * Calculates the change needed for musical inversion.
     *
     * @privileged
     * @param turtle
     * @param note
     * @param octave
     * @returns {number}
     */
    _calculateInvert(turtle, note, octave) {
        let delta = 0;
        let len = this.invertList[turtle].length;
        let note1 = getNote(
            note,
            octave,
            0,
            this.keySignature[turtle],
            this.moveable[turtle],
            null,
            this.errorMsg
        );
        let num1 =
            pitchToNumber(note1[0], note1[1], this.keySignature[turtle]) -
            this.pitchNumberOffset[turtle];

        for (let i = len - 1; i > -1; i--) {
            let note2 = getNote(
                this.invertList[turtle][i][0],
                this.invertList[turtle][i][1],
                0,
                this.keySignature[turtle],
                this.moveable[turtle],
                null,
                this.errorMsg
            );
            let num2 =
                pitchToNumber(note2[0], note2[1], this.keySignature[turtle]) -
                this.pitchNumberOffset[turtle];

            if (this.invertList[turtle][i][2] === "even") {
                delta += num2 - num1;
                num1 += 2 * delta;
            } else if (this.invertList[turtle][i][2] === "odd") {
                delta += num2 - num1 + 0.5;
                num1 += 2 * delta;
            } else {
                // We need to calculate the scalar difference
                let scalarSteps = this._scalarDistance(turtle, num2, num1);
                let note3 = this._addScalarTransposition(
                    turtle,
                    note2[0],
                    note2[1],
                    -scalarSteps
                );
                let num3 =
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
    }

    /**
     * Shifts pitches by n steps relative to the provided scale.
     *
     * @privileged
     * @param turtle
     * @param note
     * @param octave
     * @param {number} n
     * @returns {object}
     */
    _addScalarTransposition(turtle, note, octave, n) {
        let noteObj = null;

        if (n > 0) {
            noteObj = getNote(
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
                let value = getStepSizeUp(
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
                for (let i = 0; i < n; i++) {
                    let value = getStepSizeUp(
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
            noteObj = getNote(
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
                let value = getStepSizeDown(
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
                for (let i = 0; i < -n; i++) {
                    let value = getStepSizeDown(
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
            noteObj = [note, octave];
        }

        return noteObj;
    }

    /**
     * Returns a distance for scalar transposition.
     *
     * @privileged
     * @param turtle
     * @param {number} firstNote
     * @param {number} lastNote
     * @returns {number}
     */
    _scalarDistance(turtle, firstNote, lastNote) {
        // Rather than just counting the semitones, we need to count
        // the steps in the current key needed to get from firstNote pitch
        // to lastNote pitch

        if (lastNote === firstNote) {
            return 0;
        } else if (lastNote > firstNote) {
            let noteObj = numberToPitch(
                firstNote + this.pitchNumberOffset[turtle]
            );
            let n = firstNote + this.pitchNumberOffset[turtle];

            let i = 0;
            while (i < 100) {
                n += getStepSizeUp(this.keySignature[turtle], noteObj[0]);
                ++i;
                if (n >= lastNote + this.pitchNumberOffset[turtle]) {
                    break;
                }

                noteObj = numberToPitch(n);
            }

            return i;
        } else {
            let noteObj = numberToPitch(
                lastNote + this.pitchNumberOffset[turtle]
            );
            let n = lastNote + this.pitchNumberOffset[turtle];

            let i = 0;
            while (i < 100) {
                n += getStepSizeUp(this.keySignature[turtle], noteObj[0]);
                ++i;
                if (n >= firstNote + this.pitchNumberOffset[turtle]) {
                    break;
                }

                noteObj = numberToPitch(n);
            }

            return -i;
        }
    }

    /**
     * Preps synths for each turtle.
     *
     * @privileged
     * @returns {void}
     */
    _prepSynths() {
        this.synth.newTone();

        let turtle = 0;
        for ( ; turtle < this.turtles.turtleList.length; turtle++) {
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
            for (let instrumentName in instruments[0]) {
                if (!(instrumentName in instruments[turtle])) {
                    this.synth.loadSynth(turtle, instrumentName);

                    // Copy any filters
                    if (instrumentName in instrumentsFilters[0]) {
                        instrumentsFilters[turtle][instrumentName] =
                            instrumentsFilters[0][instrumentName];
                    }

                    // .. and any effects
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
                let turtle = 0;
                turtle < this.turtles.turtleList.length;
                turtle++
            ) {
                for (let synth in this.synthVolume[turtle]) {
                    this.setSynthVolume(turtle, synth, DEFAULTVOLUME);
                }
            }
        }
    }

    /**
     * Clears note params.
     *
     * @privileged
     * @param turtle
     * @param blk
     * @param drums
     * @returns {void}
     */
    clearNoteParams(turtle, blk, drums) {
        this.oscList[turtle][blk] = [];
        this.noteBeat[turtle][blk] = [];
        this.noteBeatValues[turtle][blk] = [];
        this.noteValue[turtle][blk] = null;
        this.notePitches[turtle][blk] = [];
        this.noteOctaves[turtle][blk] = [];
        this.noteCents[turtle][blk] = [];
        this.noteHertz[turtle][blk] = [];
        this.embeddedGraphics[turtle][blk] = [];
        this.noteDrums[turtle][blk] = drums !== null ? drums : [];
    }

    /**
     * Updates the music notation used for Lilypond output.
     *
     * @privileged
     * @param note
     * @param {number} duration
     * @param turtle
     * @param insideChord
     * @param drum
     * @param {boolean} [split]
     * @returns {void}
     */
    updateNotation(
        note,
        duration,
        turtle,
        insideChord,
        drum,
        split
    ) {
        if (this.optimize) return;

        // Note: At this point, the note of duration "duration" has
        // already been added to notesPlayed

        // Don't split the note if we are already splitting the note
        if (split == undefined) split = true;

        // Check to see if this note straddles a measure boundary
        let durationTime = 1 / duration;
        let beatsIntoMeasure =
            ((this.notesPlayed[turtle][0] / this.notesPlayed[turtle][1] -
                this.pickup[turtle] -
                durationTime) *
                this.noteValuePerBeat[turtle]) %
            this.beatsPerMeasure[turtle];
        let timeIntoMeasure = beatsIntoMeasure / this.noteValuePerBeat[turtle];
        let timeLeftInMeasure =
            this.beatsPerMeasure[turtle] / this.noteValuePerBeat[turtle] -
            timeIntoMeasure;

        if (split && durationTime > timeLeftInMeasure) {
            let d = durationTime - timeLeftInMeasure;
            let d2 = timeLeftInMeasure;
            let b =
                this.beatsPerMeasure[turtle] / this.noteValuePerBeat[turtle];
            console.debug("splitting note across measure boundary.");
            let obj = rationalToFraction(d);

            if (d2 > 0) {
                // Check to see if the note straddles multiple measures
                let i = 0;
                while (d2 > b) {
                    ++i;
                    d2 -= b;
                }

                let obj2 = rationalToFraction(d2);
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
                    obj2 = rationalToFraction(1 / b);
                }

                // Add any measures we straddled
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

        // .. otherwise proceed as normal
        let obj = durationToNoteValue(duration);

        /** @deprecated */
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

        // If no drum is specified, add a rest to the drum line.
        // Otherwise, add the drum.
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
            let drumSymbol = getDrumSymbol(drum[0]);
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
            let markup = "";
            for (let i = 0; i < this.markup[turtle].length; i++) {
                markup += this.markup[turtle][i];
                if (i < this.markup[turtle].length - 1) {
                    markup += " ";
                }
            }

            this.notationMarkup(turtle, markup, true);
            this.markup[turtle] = [];
        }

        if (typeof note === "object") {
            // If it is hertz, add a markup
            let markup = "";
            try {
                for (let i = 0; i < note.length; i++) {
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
    }

    /**
     * Adds a voice if possible.
     *
     * @privileged
     * @param turtle
     * @param {number} arg
     * @returns {void}
     */
    notationVoices(turtle, arg) {
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
    }

    /**
     * Sets the notation markup.
     *
     * @privileged
     * @param turtle
     * @param markup
     * @param {boolean} below
     * @returns {void}
     */
    notationMarkup(turtle, markup, below) {
        if (below) {
            this.notationStaging[turtle].push("markdown", markup);
        } else {
            this.notationStaging[turtle].push("markup", markup);
        }

        this.pickupPoint[turtle] = null;
    }

    /**
     * Sets the key and mode in the notation.
     *
     * @privileged
     * @param turtle
     * @param key
     * @param mode
     * @returns {void}
     */
    notationKey(turtle, key, mode) {
        this.notationStaging[turtle].push("key", key, mode);
        this.pickupPoint[turtle] = null;
    }

    /**
     * Sets the meter.
     *
     * @privileged
     * @param turtle
     * @param count
     * @param value
     * @returns {void}
     */
    notationMeter(turtle, count, value) {
        if (this.pickupPoint[turtle] != null) {
            // Lilypond prefers meter to be before partials.
            let d =
                this.notationStaging[turtle].length - this.pickupPoint[turtle];
            let pickup = [];

            for (let i in d) {
                pickup.push(this.notationStaging[turtle].pop());
            }

            this.notationStaging[turtle].push("meter", count, value);
            for (let i in d) {
                this.notationStaging[turtle].push(pickup.pop());
            }
        } else {
            this.notationStaging[turtle].push("meter", count, value);
        }

        this.pickupPoint[turtle] = null;
    }

    /**
     * Adds swing.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationSwing(turtle) {
        this.notationStaging[turtle].push("swing");
    }

    /**
     * Sets the tempo.
     *
     * @privileged
     * @param turtle
     * @param {number} bpm - number of beats per minute
     * @param beatValue
     * @returns {void}
     */
    notationTempo(turtle, bpm, beatValue) {
        let beat = convertFactor(beatValue);
        if (beat !== null) {
            this.notationStaging[turtle].push("tempo", bpm, beat);
        } else {
            let obj = rationalToFraction(beatValue);
            // this.errorMsg(_('Lilypond cannot process tempo of ') + obj[0] + '/' + obj[1] + ' = ' + bpm);
        }
    }

    /**
     * Adds a pickup.
     *
     * @privileged
     * @param turtle
     * @param {number} factor
     * @returns {void}
     */
    notationPickup(turtle, factor) {
        if (factor === 0) {
            console.debug("ignoring pickup of 0");
            return;
        }

        let pickupPoint = this.notationStaging[turtle].length;

        // Lilypond partial must be a combination of powers of two.
        let partial = 1 / factor;
        let beat = convertFactor(factor);
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
            for (let i = 0; i < obj[0]; i++) {
                this.updateNotation(["R"], obj[1], turtle, false, "");
            }
        }

        this.pickupPoint[turtle] = pickupPoint;
    }

    /**
     * Sets tuning as harmonic.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationHarmonic(turtle) {
        this.notationStaging.push("harmonic");
        this.pickupPoint[turtle] = null;
    }

    /**
     * Adds a line break.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationLineBreak(turtle) {
        // this.notationStaging[turtle].push('break');
        this.pickupPoint[turtle] = null;
    }

    /**
     * Begins the articulation of an instrument.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationBeginArticulation(turtle) {
        this.notationStaging[turtle].push("begin articulation");
        this.pickupPoint[turtle] = null;
    }

    /**
     * Ends articulation.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationEndArticulation(turtle) {
        this.notationStaging[turtle].push("end articulation");
        this.pickupPoint[turtle] = null;
    }

    /**
     * Begins a crescendo or descrendo.
     *
     * @privileged
     * @param turtle
     * @param {number} factor - If more than 0, we have a crescendo
     * (otherwise, a decrescendo)
     * @returns {void}
     */
    notationBeginCrescendo(turtle, factor) {
        if (factor > 0) {
            this.notationStaging[turtle].push("begin crescendo");
        } else {
            this.notationStaging[turtle].push("begin decrescendo");
        }

        this.pickupPoint[turtle] = null;
    }

    /**
     * Ends a crescendo or descrendo.
     *
     * @privileged
     * @param turtle
     * @param {number} factor - If more than 0, we have a crescendo
     * (otherwise, a decrescendo)
     * @returns {void}
     */
    notationEndCrescendo(turtle, factor) {
        if (factor > 0) {
            this.notationStaging[turtle].push("end crescendo");
        } else {
            this.notationStaging[turtle].push("end decrescendo");
        }

        this.pickupPoint[turtle] = null;
    }

    /**
     * Begins a slur.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationBeginSlur(turtle) {
        this.notationStaging[turtle].push("begin slur");
        this.pickupPoint[turtle] = null;
    }

    /**
     * Ends a slur.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationEndSlur(turtle) {
        this.notationStaging[turtle].push("end slur");
        this.pickupPoint[turtle] = null;
    }

    /**
     * Adds a tie.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationInsertTie(turtle) {
        this.notationStaging[turtle].push("tie");
        this.pickupPoint[turtle] = null;
    }

    /**
     * Removes the last tie.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationRemoveTie(turtle) {
        this.notationStaging[turtle].pop();
        this.pickupPoint[turtle] = null;
    }

    /**
     * Begins harmonics.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationBeginHarmonics(turtle) {
        this.notationStaging[turtle].push("begin harmonics");
        this.pickupPoint[turtle] = null;
    }

    /**
     * Ends harmonics.
     *
     * @privileged
     * @param turtle
     * @returns {void}
     */
    notationEndHarmonics(turtle) {
        this.notationStaging[turtle].push("end harmonics");
        this.pickupPoint[turtle] = null;
    }
}

/**
 * Queue entry for managing running blocks.
 *
 * @class
 */
class Queue {
    /**
     * @constructor
     * @param blk - block
     * @param count - count
     * @param parentBlk - parent block
     * @param args - arguments
     */
    constructor(blk, count, parentBlk, args) {
        this.blk = blk;
        this.count = count;
        this.parentBlk = parentBlk;
        this.args = args;
    }
}
