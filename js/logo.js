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

/*
   global _, Notation, _THIS_IS_MUSIC_BLOCKS_, Synth, instruments, instrumentsFilters,
   instrumentsEffects, Singer, logo, Tone, p5, CAMERAVALUE, doUseCamera, VIDEOVALUE, last,
   getIntervalDirection, getIntervalNumber, mixedNumber, rationalToFraction, doStopVideoCam,
   StatusMatrix, turtle, blocks, getStatsFromNotation, save, delayExecution
 */

/*
   exported Queue, Logo, DEFAULTVOLUME, PREVIEWVOLUME, DEFAULTDELAY, OSCVOLUMEADJUSTMENT, TONEBPM,
   TARGETBPM, TURTLESTEP, NOTEDIV, NOMICERRORMSG, NANERRORMSG, NOSTRINGERRORMSG, NOBOXERRORMSG,
   NOACTIONERRORMSG, NOINPUTERRORMSG, NOSQRTERRORMSG, ZERODIVIDEERRORMSG, EMPTYHEAPERRORMSG,
   INVALIDPITCH, POSNUMBER, NOTATIONNOTE, NOTATIONDURATION, NOTATIONDOTCOUNT, NOTATIONTUPLETVALUE,
   NOTATIONROUNDDOWN, NOTATIONINSIDECHORD, NOTATIONSTACCATO
 */

const DEFAULTVOLUME = 50;
const PREVIEWVOLUME = 80;
const DEFAULTDELAY = 500;   // milliseconds
// The oscillator runs hot. We must scale back its volume.
const OSCVOLUMEADJUSTMENT = 1.5;

const TONEBPM = 240; // seems to be the default
const TARGETBPM = 90; // what we'd like to use for beats per minute
const TURTLESTEP = -1; // run in step-by-step mode
const NOTEDIV = 8; // number of steps to divide turtle graphics

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
 * @class
 * @classdesc Queue entry for managing running blocks.
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
        this._canvas = null;
        this._blocks = null;
        this._turtles = null;
        this._stage = null;
        this._refreshCanvas = null;
        this._textMsg = null;
        this._errorMsg = null;
        this._hideMsgs = null;
        this._onStopTurtle = null;
        this._onRunTurtle = null;
        this._getStageX = null;
        this._getStageY = null;
        this._getStageMouseDown = null;
        this._getCurrentKeyCode = null;
        this._clearCurrentKeyCode = null;
        this._meSpeak = null;
        this._saveLocally = null;
        this.showBlocksAfterRun = false;

        // Widgets
        this.phraseMaker = null;
        this.pitchDrumMatrix = null;
        this.rhythmRuler = null;
        this.timbre = null;
        this.pitchStaircase = null;
        this.temperament = null;
        this.tempo = null;
        this.pitchSlider = null;
        this.musicKeyboard = null;
        this.modeWidget = null;
        this.Oscilloscope = null;
        this.oscilloscopeTurtles = [];
        this.meterWidget = null;
        this.statusMatrix = null;

        /** @deprecated */ this.evalFlowDict = {};
        /** @deprecated */ this.evalArgDict = {};
        /** @deprecated */ this.evalParameterDict = {};
        /** @deprecated */ this.evalSetterDict = {};
        /** @deprecated */ this.evalOnStartList = {};
        /** @deprecated */ this.evalOnStopList = {};

        this.eventList = {};
        this.receivedArg = null;

        this.inputValues = {};
        this.boxes = {};
        this.actions = {};
        this.returns = {};
        this.turtleHeaps = {};
        this.turtleDicts = {};

        // We store each case arg and flow by switch block no. and turtle
        this.switchCases = {};
        this.switchBlocks = {};

        // Related to running programs
        this._lastNoteTimeout = null;
        this._alreadyRunning = false;
        this._prematureRestart = false;
        this._runningBlock = null;
        this._ignoringBlock = null;

        this.time = 0;
        this.firstNoteTime = null;
        this._turtleDelay = 0;
        this.sounds = [];
        this.cameraID = null;
        this.stopTurtle = false;
        this.lastKeyCode = null;

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

        // pitch-rhythm matrix
        this.inMatrix = false;
        this.tupletRhythms = [];
        this.addingNotesToTuplet = false;
        this.drumBlocks = [];
        this.pitchBlocks = [];

        // Parameters used by duplicate block
        this.connectionStore = {};
        this.connectionStoreLock = false;

        // tuplet
        this.tuplet = false;
        this.tupletParams = [];

        // object that deals with notations
        this._notation = new Notation(this);

        // parameters used by notations
        this.notationOutput = "";
        this.notationNotes = {};
        this.runningLilypond = false;
        this.collectingStats = false;
        this.runningAbc = false;
        this.runningMxml = false;
        this._checkingCompletionState = false;
        this.recording = false;

        this.temperamentSelected = [];
        this.customTemperamentDefined = false;
        this.specialArgs = [];

        if (_THIS_IS_MUSIC_BLOCKS_) {
            // Load the default synthesizer
            this.synth = new Synth();
            this.synth.changeInTemperament = false;
        }

        // Mode widget
        this.modeBlock = null;

        // Meter widget
        this._meterBlock = null;

        // Status matrix
        this.inStatusMatrix = false;
        this.inOscilloscope = false;
        this.updatingStatusMatrix = false;
        this.statusFields = [];

        // When running in step-by-step mode, the next command to run is queued here
        this.stepQueue = {};
        this._unhighlightStepQueue = {};

        this.svgOutput = "";
        this.svgBackground = true;

        this.mic = null;
        this.volumeAnalyser = null;
        this.pitchAnalyser = null;
    }

    // ========= Setters, Getters =================================================================

    /**
     * @param {Object} canvas - createjs canvas
     */
    set canvas(canvas) {
        this._canvas = canvas;
    }

    /**
     * @returns {Object} createjs canvas
     */
    get canvas() {
        return this._canvas;
    }

    /**
     * @param {Object} blocks - Blocks object
     */
    set blocks(blocks) {
        this._blocks = blocks;
    }

    /**
     * @returns {Object} Blocks object
     */
    get blocks() {
        return this._blocks;
    }

    /**
     * @param {Object} turtles - Turtles object
     */
    set turtles(turtles) {
        this._turtles = turtles;
    }

    /**
     * @returns {Object} Turtles object
     */
    get turtles() {
        return this._turtles;
    }

    /**
     * @param {Object} stage - createjs stage
     */
    set stage(stage) {
        this._stage = stage;
    }

    /**
     * @returns {Object} createjs stage
     */
    get stage() {
        return this._stage;
    }

    /**
     * @param {Function} refreshCanvas - function to update canvas changes
     */
    set refreshCanvas(refreshCanvas) {
        this._refreshCanvas = refreshCanvas;
    }

    /**
     * @returns {Function} function to update canvas changes
     */
    get refreshCanvas() {
        return this._refreshCanvas;
    }

    /**
     * @param {Function} textMsg - function to produce a text message using exactly one string
     */
    set textMsg(textMsg) {
        this._textMsg = textMsg;
    }

    /**
     * @returns {Function} function to produce a text message using exactly one string
     */
    get textMsg() {
        return this._textMsg;
    }

    /**
     * @param {Function} errorMsg - function to produce an error message using at least a string
     */
    set errorMsg(errorMsg) {
        this._errorMsg = errorMsg;
    }

    /**
     * @returns {Function} function to produce an error message using at least a string
     */
    get errorMsg() {
        return this._errorMsg;
    }

    /**
     * @param {Function} hideMsgs - function to hide messages
     */
    set hideMsgs(hideMsgs) {
        this._hideMsgs = hideMsgs;
    }

    /**
     * @returns {Function} function to hide messages
     */
    get hideMsgs() {
        return this._hideMsgs;
    }

    /**
     * @param {Function} onStopTurtle
     */
    set onStopTurtle(onStopTurtle) {
        this._onStopTurtle = onStopTurtle;
    }

    /**
     * @returns {Function}
     */
    get onStopTurtle() {
        return this._onStopTurtle;
    }

    /**
     * @param {Function} onRunTurtle
     */
    set onRunTurtle(onRunTurtle) {
        this._onRunTurtle = onRunTurtle;
    }

    /**
     * @returns {Function}
     */
    get onRunTurtle() {
        return this._onRunTurtle;
    }

    /**
     * @param {Function} getStageX - function to get corresponding screen
     * x - coordinate (from Turtle)
     */
    set getStageX(getStageX) {
        this._getStageX = getStageX;
    }

    /**
     * @returns {Function} function to get corresponding screen x - coordinate
     * (from Turtle)
     */
    get getStageX() {
        return this._getStageX;
    }

    /**
     * @param {Function} getStageY - function to get corresponding screen
     * y - coordinate (from Turtle)
     */
    set getStageY(getStageY) {
        this._getStageY = getStageY;
    }

    /**
     * @returns {Function} function to get corresponding screen y - coordinate
     * (from Turtle)
     */
    get getStageY() {
        return this._getStageY;
    }

    /**
     * @param {Function} getStageMouseDown
     */
    set getStageMouseDown(getStageMouseDown) {
        this._getStageMouseDown = getStageMouseDown;
    }

    /**
     * @returns {Function}
     */
    get getStageMouseDown() {
        return this._getStageMouseDown;
    }

    /**
     * @param {Function} getCurrentKeyCode
     */
    set getCurrentKeyCode(getCurrentKeyCode) {
        this._getCurrentKeyCode = getCurrentKeyCode;
    }

    /**
     * @returns {Function}
     */
    get getCurrentKeyCode() {
        return this._getCurrentKeyCode;
    }

    /**
     * @param {Function} clearCurrentKeyCode
     */
    set clearCurrentKeyCode(clearCurrentKeyCode) {
        this._clearCurrentKeyCode = clearCurrentKeyCode;
    }

    /**
     * @returns {Function}
     */
    get clearCurrentKeyCode() {
        return this._clearCurrentKeyCode;
    }

    /**
     * @param {Object} meSpeak - an object with a speak method that takes a string
     */
    set meSpeak(meSpeak) {
        this._meSpeak = meSpeak;
    }

    /**
     * @returns {Object} an object with a speak method that takes a string
     */
    get meSpeak() {
        return this._meSpeak;
    }

    /**
     * @param {Function} saveLocally - function used for local caching
     */
    set saveLocally(saveLocally) {
        this._saveLocally = saveLocally;
    }

    /**
     * @returns {Function} function used for local caching
     */
    get saveLocally() {
        return this._saveLocally;
    }

    /**
     * @param {Number} turtleDelay - pause between each block as the program executes
     */
    set turtleDelay(turtleDelay) {
        this._turtleDelay = turtleDelay;
    }

    /**
     * @returns {Number} pause between each block as the program executes
     */
    get turtleDelay() {
        return this._turtleDelay;
    }

    /**
     * @returns {Object} object of Notation
     */
    get notation() {
        return this._notation;
    }

    // ========= Utilities ========================================================================

    /**
     * Restores any broken connections made in duplicate notes clamps.
     *
     * @returns {void}
     */
    _restoreConnections() {
        for (const turtle in this.connectionStore) {
            for (const blk in this.connectionStore[turtle]) {
                const n = this.connectionStore[turtle][blk].length;
                for (let i = 0; i < n; i++) {
                    const obj = this.connectionStore[turtle][blk].pop();
                    this.blocks.blockList[obj[0]].connections[obj[1]] = obj[2];
                    if (obj[2] != null) {
                        this.blocks.blockList[obj[2]].connections[0] = obj[0];
                    }
                }
            }
        }
    }

    /**
     * Preps synths for each turtle.
     *
     * @returns {void}
     */
    prepSynths() {
        this.synth.newTone();

        for (const turtle in this.turtles.turtleList) {
            const tur = this.turtles.ithTurtle(turtle);

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
            for (const instrumentName in instruments[0]) {
                if (!(instrumentName in instruments[turtle])) {
                    this.synth.loadSynth(turtle, instrumentName);

                    // Copy any filters
                    if (instrumentName in instrumentsFilters[0]) {
                        instrumentsFilters[turtle][instrumentName] =
                            instrumentsFilters[0][instrumentName];
                    }

                    // ...and any effects
                    if (instrumentName in instrumentsEffects[0]) {
                        instrumentsEffects[turtle][instrumentName] =
                            instrumentsEffects[0][instrumentName];
                    }
                }
            }

            tur.singer.synthVolume = {
                "electronic synth": [DEFAULTVOLUME],
                "noise1": [DEFAULTVOLUME],
                "noise2": [DEFAULTVOLUME],
                "noise3": [DEFAULTVOLUME]
            };
        }

        Singer.setMasterVolume(this, DEFAULTVOLUME);
        for (const turtle in this.turtles.turtleList) {
            for (const synth in this.turtles.ithTurtle(turtle).singer.synthVolume) {
                Singer.setSynthVolume(this, turtle, synth, DEFAULTVOLUME);
            }
        }
    }

    /**
     * Initialises and starts a default synth.
     *
     * @param turtle
     * @returns {void}
     */
    resetSynth(turtle) {
        if (!("electronic synth" in instruments[turtle])) {
            this.synth.createDefaultSynth(turtle);
        }

        Singer.setMasterVolume(logo, DEFAULTVOLUME);
        for (const turtle in this.turtles.turtleList) {
            for (const synth in this.turtles.ithTurtle(turtle).singer.synthVolume) {
                Singer.setSynthVolume(this, turtle, synth, DEFAULTVOLUME);
            }
        }

        this.synth.start();
    }

    /**
     * Initialises the microphone.
     *
     * @returns {void}
     */
    initMediaDevices() {
        // console.debug("INIT MICROPHONE");
        if (_THIS_IS_MUSIC_BLOCKS_) {
            let mic = new Tone.UserMedia();
            try {
                mic.open();
            } catch (e) {
                // console.debug("MIC NOT FOUND");
                // console.debug(e.name + ": " + e.message);

                // console.debug(mic);
                this.errorMsg(NOMICERRORMSG);
                mic = null;
            }

            this.mic = mic;
            this.limit = 16384;
        } else {
            try {
                this.mic = new p5.AudioIn();
                this.mic.start();
            } catch (e) {
                // console.debug(e);
                this.errorMsg(NOMICERRORMSG);
                this.mic = null;
            }
        }
    }

    /**
     * Clears note params.
     *
     * @param {Object} turtle - Turtle object
     * @param blk
     * @param drums
     * @returns {void}
     */
    clearNoteParams(turtle, blk, drums) {
        turtle.singer.oscList[blk] = [];
        turtle.singer.noteBeat[blk] = [];
        turtle.singer.noteBeatValues[blk] = [];
        turtle.singer.noteValue[blk] = null;
        turtle.singer.notePitches[blk] = [];
        turtle.singer.noteOctaves[blk] = [];
        turtle.singer.noteCents[blk] = [];
        turtle.singer.noteHertz[blk] = [];
        turtle.singer.embeddedGraphics[blk] = [];
        turtle.singer.noteDrums[blk] = drums !== null ? drums : [];
    }

    /**
     * Speaks all characters in the range of comma, full stop, space, A to Z, a to z in the input text.
     *
     * @param {string} text
     * @returns {void}
     */
    processSpeak(text) {
        let new_text = "";
        for (const i in text) {
            if (new RegExp("^[A-Za-z,. ]$").test(text[i])) new_text += text[i];
        }

        if (this.meSpeak !== null) {
            this.meSpeak.speak(new_text);
        }
    }

    /**
     * Shows information: with camera, in image form, at URL, as text.
     *
     * @param turtle
     * @param blk
     * @param arg0
     * @param arg1
     * @returns {void}
     */
    processShow(turtle, blk, arg0, arg1) {
        if (typeof arg1 === "string") {
            const len = arg1.length;
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
            this.blocks.blockList[this.blocks.blockList[blk].connections[2]].name === "loadFile"
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

    // ========================================================================

    /**
     * Sets the cameraID property.
     *
     * @param id
     * @returns {void}
     */
    setCameraID(id) {
        this.cameraID = id;
    }

    // ========= Action ===========================================================================

    /**
     * Sets a named listener after removing any existing listener in the same place.
     *
     * @param {Number} turtle - Turtle index in turtles.turtleList
     * @param {String} listenerName
     * @param {Function} listener
     * @returns {void}
     */
    setTurtleListener(turtle, listenerName, listener) {
        const tur = this.turtles.ithTurtle(turtle);
        if (listenerName in tur.listeners) {
            this.stage.removeEventListener(listenerName, tur.listeners[listenerName], false);
        }

        tur.listeners[listenerName] = listener;
        this.stage.addEventListener(listenerName, listener, false);
    }

    /**
     * Sets a listener to the triggering (dispatch) block (usually the hidden block) for a clamp block.
     *
     * @param blk
     * @param turtle
     * @param {string} listenerName
     * @returns {void}
     */
    setDispatchBlock(blk, turtle, listenerName) {
        const tur = this.turtles.ithTurtle(turtle);

        let nextBlock = null;
        if (!tur.singer.inDuplicate && tur.singer.backward.length > 0) {
            const c = this.blocks.blockList[last(tur.singer.backward)].name === "backward" ? 1 : 2;
            if (
                this.blocks.sameGeneration(
                    this.blocks.blockList[last(tur.singer.backward)].connections[c],
                    blk
                )
            ) {
                nextBlock = this.blocks.blockList[blk].connections[0];
            } else {
                nextBlock = last(this.blocks.blockList[blk].connections);
            }
        } else {
            nextBlock = last(this.blocks.blockList[blk].connections);
        }

        if (nextBlock !== null) {
            if (nextBlock in tur.endOfClampSignals) {
                tur.endOfClampSignals[nextBlock].push(listenerName);
            } else {
                tur.endOfClampSignals[nextBlock] = [listenerName];
            }
        }
    }

    /**
     * Parses receivedArg.
     *
     * @param logo
     * @param turtle
     * @param blk
     * @param parentBlk
     * @param receivedArg
     * @returns {*}
     */
    parseArg(logo, turtle, blk, parentBlk, receivedArg) {
        const tur = logo.turtles.ithTurtle(turtle);

        // Retrieve the value of a block
        if (blk == null) {
            logo.errorMsg(NOINPUTERRORMSG, parentBlk);
            // logo.stopTurtle = true;
            return null;
        }

        if (logo.blocks.blockList[blk].protoblock.parameter) {
            if (tur.parameterQueue.indexOf(blk) === -1) {
                tur.parameterQueue.push(blk);
            }
        }

        if (typeof logo.blocks.blockList[blk].protoblock.arg === "function") {
            return (logo.blocks.blockList[blk].value = logo.blocks.blockList[blk].protoblock.arg(
                logo,
                turtle,
                blk,
                receivedArg
            ));
        }

        if (logo.blocks.blockList[blk].name === "intervalname") {
            if (typeof logo.blocks.blockList[blk].value === "string") {
                tur.singer.noteDirection = getIntervalDirection(logo.blocks.blockList[blk].value);
                return getIntervalNumber(logo.blocks.blockList[blk].value);
            } else return 0;
        } else if (logo.blocks.blockList[blk].isValueBlock()) {
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
                        logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name ===
                            "print"
                    ) {
                        logo.statusFields.push([blk, "dectofrac"]);
                    } else {
                        const cblk = logo.blocks.blockList[blk].connections[1];
                        if (cblk === null) {
                            logo.errorMsg(NOINPUTERRORMSG, blk);
                            logo.blocks.blockList[blk].value = 0;
                        } else {
                            const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                            if (typeof a === "number") {
                                logo.blocks.blockList[blk].value =
                                    a < 0 ? "-" + mixedNumber(-a) : mixedNumber(a);
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
                        logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name ===
                            "print"
                    ) {
                        logo.statusFields.push([blk, "color"]);
                    } else {
                        logo.blocks.blockList[blk].value =
                            logo.turtles.turtleList[turtle].painter.color;
                    }
                    break;

                /** @deprecated */
                case "returnValue":
                    if (logo.returns[turtle].length > 0) {
                        logo.blocks.blockList[blk].value = logo.returns[turtle].pop();
                    } else {
                        // console.debug("WARNING: No return value.");
                        logo.blocks.blockList[blk].value = 0;
                    }
                    break;

                default:
                    // console.error("I do not know how to " + logo.blocks.blockList[blk].name);
                    break;
            }

            return logo.blocks.blockList[blk].value;
        } else {
            return blk;
        }
    }

    /**
     * Updates the music notation used for Lilypond output.
     *
     * @param note
     * @param {number} duration
     * @param turtle
     * @param insideChord
     * @param drum
     * @param {boolean} [split]
     * @returns {void}
     */
    updateNotation(note, duration, turtle, insideChord, drum, split) {
        // Note: At this point, the note of duration "duration" has
        // already been added to notesPlayed

        // Don't split the note if we are already splitting the note
        if (split == undefined) split = true;

        const tur = this.turtles.ithTurtle(turtle);

        // Check to see if this note straddles a measure boundary
        const durationTime = 1 / duration;
        const beatsIntoMeasure =
            ((tur.singer.notesPlayed[0] / tur.singer.notesPlayed[1] -
                tur.singer.pickup -
                durationTime) *
                tur.singer.noteValuePerBeat) %
            tur.singer.beatsPerMeasure;
        const timeIntoMeasure = beatsIntoMeasure / tur.singer.noteValuePerBeat;
        const timeLeftInMeasure =
            tur.singer.beatsPerMeasure / tur.singer.noteValuePerBeat - timeIntoMeasure;

        if (split && durationTime > timeLeftInMeasure) {
            const d = durationTime - timeLeftInMeasure;
            let d2 = timeLeftInMeasure;
            const b = tur.singer.beatsPerMeasure / tur.singer.noteValuePerBeat;
            // console.debug("splitting note across measure boundary.");
            const obj = rationalToFraction(d);

            if (d2 > 0) {
                // Check to see if the note straddles multiple measures
                let i = 0;
                while (d2 > b) {
                    ++i;
                    d2 -= b;
                }

                let obj2 = rationalToFraction(d2);
                this.updateNotation(note, obj2[1] / obj2[0], turtle, insideChord, drum, false);
                if (i > 0 || obj[0] > 0) {
                    if (note[0] !== "R") {
                        // Don't tie rests
                        this.notation.notationInsertTie(turtle);
                        this.notation.notationDrumStaging[turtle].push("tie");
                    }
                    obj2 = rationalToFraction(1 / b);
                }

                // Add any measures we straddled
                while (i > 0) {
                    i -= 1;
                    this.updateNotation(note, obj2[1] / obj2[0], turtle, insideChord, drum, false);
                    if (obj[0] > 0) {
                        if (note[0] !== "R") {
                            // Don't tie rests
                            this.notation.notationInsertTie(turtle);
                            this.notation.notationDrumStaging[turtle].push("tie");
                        }
                    }
                }
            }

            if (obj[0] > 0) {
                this.updateNotation(note, obj[1] / obj[0], turtle, insideChord, drum, false);
            }
        } else {
            // .. otherwise proceed as normal
            this.notation.doUpdateNotation(...arguments);
        }
    }

    // ========================================================================

    /**
     * Clears the delay timeout after a successful input, and runs from next block.
     *
     * @param {Object} turtle
     * @returns {void}
     */
    clearTurtleRun(turtle) {
        const tur = this.turtles.ithTurtle(turtle);

        if (tur.delayTimeout !== null) {
            clearTimeout(tur.delayTimeout);
            tur.delayTimeout = null;
            this.runFromBlockNow(
                this,
                turtle,
                tur.delayParameters["blk"],
                tur.delayParameters["flow"],
                tur.delayParameters["arg"]
            );
        }
    }

    /**
     * Breaks a loop.
     *
     * @param turtle - Turtle object
     * @returns {void}
     */
    doBreak(turtle) {
        // Look for a parent loopBlock in queue and set its count to 1
        let parentLoopBlock = null;
        let loopBlkIdx = -1;

        const queueLength = turtle.queue.length;
        for (let i = queueLength - 1; i > -1; i--) {
            if (
                ["forever", "repeat", "while", "until"].indexOf(
                    this.blocks.blockList[turtle.queue[i].blk].name
                ) !== -1
            ) {
                // while or until
                loopBlkIdx = turtle.queue[i].blk;
                parentLoopBlock = this.blocks.blockList[loopBlkIdx];
                // Flush the parent from the queue
                turtle.queue.pop();
                break;
            } else if (
                ["forever", "repeat", "while", "until"].indexOf(
                    this.blocks.blockList[turtle.queue[i].parentBlk].name
                ) !== -1
            ) {
                // repeat or forever
                loopBlkIdx = turtle.queue[i].parentBlk;
                parentLoopBlock = this.blocks.blockList[loopBlkIdx];
                // Flush the parent from the queue
                turtle.queue.pop();
                break;
            }
        }

        if (parentLoopBlock == null) {
            // Flush the child flow
            turtle.queue.pop();
            return;
        }

        // For while and until, we need to add any childflow from the parent to the queue
        if (parentLoopBlock.name === "while" || parentLoopBlock.name === "until") {
            const childFlow = last(parentLoopBlock.connections);
            if (childFlow != null) {
                const queueBlock = new Queue(childFlow, 1, loopBlkIdx);
                // We need to keep track of the parent block to the child flow so we can
                // unlightlight the parent block after the child flow completes
                turtle.parentFlowQueue.push(loopBlkIdx);
                turtle.queue.push(queueBlock);
            }
        }
    }

    // ========= Behavior =========================================================================

    /**
     * Initialises a turtle.
     *
     * @param turtle
     * @returns {void}
     */
    initTurtle(turtle) {
        this.connectionStore[turtle] = {};
        this.connectionStoreLock = false;
        this.switchCases[turtle] = {};
        this.switchBlocks[turtle] = [];
        this.returns[turtle] = [];

        this.notation.notationStaging[turtle] = [];
        this.notation.notationDrumStaging[turtle] = [];
        this.notation.pickupPoint[turtle] = null;
        this.notation.pickupPOW2[turtle] = false;

        this.turtles
            .ithTurtle(turtle)
            .initTurtle(this.runningLilypond || this.runningAbc || this.runningMxml);
    }

    /**
     * Stops the turtles and cleans up a few odds and ends.
     * The stop button was pressed.
     *
     * @returns {void}
     */
    doStopTurtles() {
        this.stopTurtle = true;
        this.turtles.markAllAsStopped();

        for (const sound in this.sounds) {
            this.sounds[sound].stop();
        }

        this.sounds = [];

        if (_THIS_IS_MUSIC_BLOCKS_) {
            for (const turtle in this.turtles.turtleList) {
                for (const instrumentName in instruments[turtle]) {
                    this.synth.stopSound(turtle, instrumentName);
                }
                const comp = this.turtles.turtleList[turtle].companionTurtle;
                if (comp) {
                    this.turtles.turtleList[comp].running = false;
                    const interval = logo.turtles.turtleList[comp].interval;
                    if (interval) clearInterval(interval);
                }
            }

            this.synth.stop();
            if (this.synth.recorder && this.synth.recorder.state == "recording")
                this.synth.recorder.stop();
        }

        if (this.cameraID != null) {
            doStopVideoCam(this.cameraID, this.setCameraID);
        }

        this.onStopTurtle();
        this.blocks.bringToTop();

        this.stepQueue = {};
        for (const turtle of this.turtles.turtleList) {
            turtle.unhighlightQueue = [];
        }

        this._restoreConnections();

        document.body.style.cursor = "default";
        if (this.showBlocksAfterRun) {
            // console.debug("SHOW BLOCKS");
            this.blocks.showBlocks();
            document.getElementById("stop").style.color = "white";
        }

        this.showBlocksAfterRun = false;
    }

    /**
     * Takes one step for each turtle in executing Logo commands.
     *
     * @returns {void}
     */
    step() {
        for (const turtle in this.stepQueue) {
            if (this.stepQueue[turtle].length > 0) {
                if (
                    turtle in this._unhighlightStepQueue &&
                    this._unhighlightStepQueue[turtle] != null
                ) {
                    if (this.blocks.visible) {
                        this.blocks.unhighlight(this._unhighlightStepQueue[turtle]);
                    }
                    this._unhighlightStepQueue[turtle] = null;
                }

                const blk = this.stepQueue[turtle].pop();
                if (blk != null) {
                    this.runFromBlockNow(this, turtle, blk, 0, null);
                }
            }
        }
    }

    /**
     * Runs Logo commands.
     *
     * @param startHere - index of a block to start from
     * @param env
     * @returns {void}
     */
    runLogoCommands(startHere, env) {
        this._prematureRestart = this._alreadyRunning;
        if (this._alreadyRunning && this._runningBlock !== null) {
            this._ignoringBlock = this._runningBlock;
            // console.debug(this._alreadyRunning + " " + this._runningBlock);
        } else {
            this._ignoringBlock = null;
        }

        if (this._lastNoteTimeout != null) {
            // console.debug("clearing lastNoteTimeout");
            clearTimeout(this._lastNoteTimeout);
            this._lastNoteTimeout = null;
        }

        this._restoreConnections(); // restore any broken connections

        this._saveLocally(); // save the state before running

        for (const arg in this.evalOnStartList) {
            eval(this.evalOnStartList[arg]);
        }

        this.stopTurtle = false;

        this.blocks.unhighlightAll();
        this.blocks.bringToTop(); // draw under blocks

        this._hideMsgs();

        // Run the Logo commands here
        this.time = new Date().getTime();
        this.firstNoteTime = null;

        // Ensure we have at least one turtle
        if (this.turtles.turtleList.length === 0) {
            this.turtles.add(null);
        }

        Singer.masterBPM = TARGETBPM;
        Singer.defaultBPMFactor = TONEBPM / TARGETBPM;
        Singer.masterVolume = [DEFAULTVOLUME];
        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.synth.changeInTemperament = false;
        }

        this._checkingCompletionState = false;

        for (const turtle of this.turtles.turtleList) {
            turtle.embeddedGraphicsFinished = true;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.prepSynths();
        }

        this.notation.notationStaging = {};
        this.notation.notationDrumStaging = {};

        // Each turtle needs to keep its own wait time and music states
        for (const turtle in this.turtles.turtleList) {
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
        this.modeBlock = null;
        this._meterBlock = null;

        // Remove any listeners that might be still active
        for (const turtle of this.turtles.turtleList) {
            for (const listener in turtle.listeners) {
                this.stage.removeEventListener(listener, turtle.listeners[listener], false);
            }

            turtle.listeners = {};
        }

        // Init the graphic state
        for (const turtle in this.turtles.turtleList) {
            this.turtles.turtleList[turtle].container.x = this.turtles.turtleX2screenX(
                this.turtles.turtleList[turtle].x
            );
            this.turtles.turtleList[turtle].container.y = this.turtles.turtleY2screenY(
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
        const startBlocks = [];
        this.blocks.findStacks();
        this.actions = {};

        for (let blk = 0; blk < this.blocks.stackList.length; blk++) {
            if (
                ["start", "drum", "status", "oscilloscope"].indexOf(
                    this.blocks.blockList[this.blocks.stackList[blk]].name
                ) !== -1
            ) {
                // Don't start on a start block in the trash
                if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                    startBlocks.push(this.blocks.stackList[blk]);
                }
            } else if (this.blocks.blockList[this.blocks.stackList[blk]].name === "action") {
                // Does the action stack have a name?
                const c = this.blocks.blockList[this.blocks.stackList[blk]].connections[1];
                // Is there a block in the action clamp?
                const b = this.blocks.blockList[this.blocks.stackList[blk]].connections[2];
                if (c != null && b != null) {
                    // Don't use an action block in the trash
                    if (!this.blocks.blockList[this.blocks.stackList[blk]].trash) {
                        // We need to calculate the value of block c.
                        // this.actions[this.blocks.blockList[c].value] = b;
                        const name = this.parseArg(this, 0, c, null);
                        this.actions[name] = b;
                    }
                }
            }
        }

        this.svgOutput = "";
        this.svgBackground = true;

        for (const turtle of this.turtles.turtleList) {
            turtle.parentFlowQueue = [];
            turtle.unhighlightQueue = [];
            turtle.parameterQueue = [];
        }

        if (this.turtleDelay === 0) {
            // Don't update parameters when running full speed
            this.blocks.clearParameterBlocks();
        }

        this.onRunTurtle();

        // Make sure that there is atleast one turtle
        if (this.turtles.turtleList.length === 0) {
            // console.debug("No start block... adding a turtle");
            this.turtles.addTurtle(null);
        }

        // Mark all turtles as not running
        for (const turtle in this.turtles.turtleList) {
            if (this.turtles.turtleList[turtle].running) {
                // console.debug("already running...");
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

            if (["start", "drum"].indexOf(this.blocks.blockList[startHere].name) !== -1) {
                turtle = this.blocks.blockList[startHere].value;
            }

            const tur = this.turtles.ithTurtle(turtle);

            tur.queue = [];
            tur.parentFlowQueue = [];
            tur.unhighlightQueue = [];
            tur.parameterQueue = [];

            if (tur.running) {
                // console.debug("already running...");
            }

            tur.running = true;
            this.runFromBlock(this, turtle, startHere, 0, env);
        } else if (startBlocks.length > 0) {
            let delayStart = 0;
            // Look for a status/oscilloscope block
            for (let b = 0; b < startBlocks.length; b++) {
                if (
                    ["status", "oscilloscope"].indexOf(
                        this.blocks.blockList[startBlocks[b]].name
                    ) !== -1 &&
                    !this.blocks.blockList[startBlocks[b]].trash
                ) {
                    const turtle = 0;
                    const tur = this.turtles.ithTurtle(turtle);

                    tur.queue = [];
                    tur.parentFlowQueue = [];
                    tur.unhighlightQueue = [];
                    tur.parameterQueue = [];

                    if (tur.running) {
                        // console.debug("already running...");
                    }

                    tur.running = true;
                    delayStart = 250;
                    this.runFromBlock(this, turtle, startBlocks[b], 0, env);
                }
            }

            setTimeout(() => {
                if (delayStart !== 0) {
                    // Launching status/oscilloscope block would have hidden the
                    // Stop Button so show it again
                    this.onRunTurtle();
                }

                // If there are start blocks, run them all
                for (let b = 0; b < startBlocks.length; b++) {
                    if (
                        ["status", "oscilloscope"].indexOf(
                            this.blocks.blockList[startBlocks[b]].name
                        ) === -1
                    ) {
                        const turtle = this.blocks.blockList[startBlocks[b]].value;
                        const tur = this.turtles.ithTurtle(turtle);

                        tur.queue = [];
                        tur.parentFlowQueue = [];
                        tur.unhighlightQueue = [];
                        tur.parameterQueue = [];

                        if (!tur.inTrash) {
                            if (tur.running) {
                                // console.debug("already running...");
                            }

                            tur.running = true;
                            this.runFromBlock(this, turtle, startBlocks[b], 0, env);
                        }
                    }
                }
            }, delayStart);
        } else {
            const tur = this.turtles.ithTurtle(turtle);

            // console.debug("Empty start block: " + turtle + " " + tur.singer.suppressOutput);

            if (tur.singer.suppressOutput || tur.singer.suppressOutput == undefined) {
                // this.errorMsg(NOACTIONERRORMSG, null, _('start'));
                tur.singer.suppressOutput = false;
                this._checkingCompletionState = false;

                // Reset cursor
                document.body.style.cursor = "default";
            }
        }

        this.refreshCanvas();
    }

    /**
     * Runs from a single block.
     *
     * @param {this} logo
     * @param turtle
     * @param blk
     * @param isflow
     * @param receivedArg
     * @returns {void}
     */
    runFromBlock(logo, turtle, blk, isflow, receivedArg) {
        this._runningBlock = blk;
        if (blk == null) return;

        this.receivedArg = receivedArg;

        const tur = logo.turtles.ithTurtle(turtle);

        const delay = logo.turtleDelay + tur.waitTime;
        tur.doWait(0);

        if (!logo.stopTurtle) {
            if (logo.turtleDelay === TURTLESTEP) {
                // Step mode
                if (!(turtle in logo.stepQueue)) {
                    logo.stepQueue[turtle] = [];
                }
                logo.stepQueue[turtle].push(blk);
            } else {
                tur.delayParameters = { blk: blk, flow: isflow, arg: receivedArg };
                tur.delayTimeout = setTimeout(
                    () => logo.runFromBlockNow(logo, turtle, blk, isflow, receivedArg),
                    delay
                );
            }
        }
    }

    /**
     * Runs a stack of blocks, beginning with blk.
     *
     * @param {this} logo
     * @param turtle
     * @param blk
     * @param isflow
     * @param receivedArg
     * @param {number} [queueStart]
     * @returns {void}
     */
    runFromBlockNow(logo, turtle, blk, isflow, receivedArg, queueStart) {
        this._alreadyRunning = true;

        this.receivedArg = receivedArg;

        // Sometimes we don't want to unwind the entire queue
        if (queueStart === undefined) queueStart = 0;

        /*
        ===========================================================================
        (1) Evaluate any arguments (beginning with connection[1])
        ===========================================================================
        */
        const args = [];
        if (logo.blocks.blockList[blk].protoblock.args > 0) {
            for (let i = 1; i <= logo.blocks.blockList[blk].protoblock.args; i++) {
                if (logo.blocks.blockList[blk].protoblock.dockTypes[i] === "in") {
                    if (logo.blocks.blockList[blk].connections[i] == null) {
                        // console.debug("skipping inflow args");
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
                if (
                    logo.turtles.ithTurtle(turtle).singer.inNoteBlock.length > 0 &&
                    logo.blocks.blockList[logo.blocks.blockList[blk].connections[i]].name ===
                        "currentpitch"
                ) {
                    // Re-eval this arg after note block ends to ensure that the current pitch is uptodate.
                    logo.specialArgs.push([args, logo, turtle, blk, receivedArg, null, isflow]);
                }
            }
        }

        /*
        ===========================================================================
        (2) Run function associated with the block
        ===========================================================================
        */
        const tur = logo.turtles.ithTurtle(turtle);

        let nextFlow = null;
        if (!logo.blocks.blockList[blk].isValueBlock()) {
            // (nextFlow remains null for valueBlock)

            // All flow blocks have a last connection (nextFlow), but it can be null (i.e., end of a flow)
            if (tur.singer.backward.length > 0) {
                // We only run backwards in the "first generation" children
                const c = blocks.blockList[last(tur.singer.backward)].name === "backward" ? 1 : 2;

                if (
                    !logo.blocks.sameGeneration(
                        logo.blocks.blockList[last(tur.singer.backward)].connections[c],
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
                                logo.blocks.blockList[last(tur.singer.backward)].connections[c],
                                nextFlow
                            )
                        ) {
                            nextFlow = last(logo.blocks.blockList[blk].connections);
                        } else {
                            nextFlow = logo.blocks.blockList[blk].connections[0];
                        }
                    }
                }
            } else {
                nextFlow = last(logo.blocks.blockList[blk].connections);
            }

            if (nextFlow === -1) {
                nextFlow = null;
            }

            const queueBlock = new Queue(nextFlow, 1, blk, receivedArg);
            if (nextFlow != null) {
                // This could be the last block
                tur.queue.push(queueBlock);
            }
        }

        // Some flow blocks have childflows, e.g., repeat
        let childFlow = null;
        let childFlowCount = 0;
        const actionArgs = [];

        if (logo.blocks.visible) {
            if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                logo.blocks.highlight(blk, false);
            }
        }

        if (!logo.blocks.blockList[blk].isArgBlock()) {
            const res = logo.blocks.blockList[blk].protoblock.flow(
                args,
                logo,
                turtle,
                blk,
                receivedArg,
                actionArgs,
                isflow
            );

            if (res) {
                const [cf, cfc, ret] = res;
                if (cf !== undefined) childFlow = cf;
                if (cfc !== undefined) childFlowCount = cfc;
                if (ret) return ret;
            }
        } else {
            // Could be an arg block, so we need to print its value
            if (
                logo.blocks.blockList[blk].isArgBlock() ||
                ["anyout", "numberout", "textout", "booleanout"].indexOf(
                    logo.blocks.blockList[blk].protoblock.dockTypes[0]
                ) !== -1
            ) {
                args.push(logo.parseArg(logo, turtle, blk, logo.receievedArg));

                if (logo.blocks.blockList[blk].value == null) {
                    logo.textMsg("null block value");
                } else {
                    logo.textMsg(logo.blocks.blockList[blk].value.toString());
                }
            } else {
                logo.errorMsg("I do not know how to " + logo.blocks.blockList[blk].name + ".", blk);
            }

            logo.stopTurtle = true;
        }

        /*
        ===========================================================================
        (3) Queue block below the current block
        ===========================================================================
        */
        // Is the block in a queued clamp?
        if (blk !== logo._ignoringBlock) {
            if (blk in tur.endOfClampSignals) {
                while (tur.endOfClampSignals[blk].length > 0) {
                    const signal = tur.endOfClampSignals[blk].pop();
                    if (signal != null) {
                        logo.stage.dispatchEvent(signal);
                    }
                }
            }
        } else {
            // console.debug("Ignoring block on overlapped start.");
        }

        if (logo.statusMatrix && logo.statusMatrix.isOpen && !logo.inStatusMatrix) {
            logo.statusMatrix.updateAll();
        }

        // If there is a child flow, queue it
        if (childFlow != null) {
            let queueBlock;
            if (
                logo.blocks.blockList[blk].name === "doArg" ||
                logo.blocks.blockList[blk].name === "nameddoArg"
            ) {
                queueBlock = new Queue(childFlow, childFlowCount, blk, actionArgs);
            } else {
                queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
            }

            // We need to keep track of the parent block to the child flow so we can unhighlight the
            // parent block after the child flow completes.
            if (tur.parentFlowQueue != undefined) {
                tur.parentFlowQueue.push(blk);
                tur.queue.push(queueBlock);
            } else {
                // console.debug("cannot find queue for turtle " + turtle);
            }
        }

        let nextBlock = null;
        let parentBlk = null;
        let passArg = null;

        // Run the last flow in the queue
        if (tur.queue.length > queueStart) {
            nextBlock = last(tur.queue).blk;
            parentBlk = last(tur.queue).parentBlk;
            passArg = last(tur.queue).args;

            // Since the forever block starts at -1, it will never === 1
            if (last(tur.queue).count === 1) {
                // Finished child so pop it off the queue
                tur.queue.pop();
            } else {
                // Decrement the counter for repeating the flow
                last(tur.queue).count -= 1;
            }
        }

        if (nextBlock != null) {
            if (parentBlk !== blk) {
                // The wait block waits _waitTimes longer than other
                // blocks before it is unhighlighted
                if (logo.turtleDelay === TURTLESTEP) {
                    logo._unhighlightStepQueue[turtle] = blk;
                } else {
                    if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                        setTimeout(() => {
                            if (logo.blocks.visible) {
                                logo.blocks.unhighlight(blk);
                            }
                        }, logo.turtleDelay + tur.waitTime);
                    }
                }
            }

            if (
                (tur.singer.backward.length > 0 &&
                    logo.blocks.blockList[blk].connections[0] == null) ||
                (tur.singer.backward.length === 0 &&
                    last(logo.blocks.blockList[blk].connections) == null)
            ) {
                if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                    // If we are at the end of the child flow, queue the unhighlighting of the parent block to the flow
                    if (tur.unhighlightQueue === undefined) {
                        // console.debug("cannot find highlight queue for turtle " + turtle);
                    } else if (
                        tur.parentFlowQueue.length > 0 &&
                        tur.queue.length > 0 &&
                        last(tur.queue).parentBlk !== last(tur.parentFlowQueue)
                    ) {
                        tur.unhighlightQueue.push(last(tur.parentFlowQueue));
                    } else if (tur.unhighlightQueue.length > 0) {
                        // The child flow is finally complete, so unhighlight
                        setTimeout(() => {
                            if (logo.blocks.visible) {
                                logo.blocks.unhighlight(tur.unhighlightQueue.pop());
                            } else {
                                tur.unhighlightQueue.pop();
                            }
                        }, logo.turtleDelay);
                    }
                }
            }

            // We don't update parameter blocks when running full speed
            if (logo.turtleDelay !== 0) {
                for (const pblk in tur.parameterQueue) {
                    logo.blocks.updateParameterBlock(logo, turtle, tur.parameterQueue[pblk]);
                }
            }

            if (isflow) {
                logo.runFromBlockNow(logo, turtle, nextBlock, isflow, passArg, queueStart);
            } else {
                logo.runFromBlock(logo, turtle, nextBlock, isflow, passArg);
            }
        } else {
            logo._alreadyRunning = false;

            if (!logo._prematureRestart) {
                // console.debug('Make sure any unissued signals are dispatched.');
                for (const b in tur.endOfClampSignals) {
                    for (let i = 0; i < tur.endOfClampSignals[b].length; i++) {
                        if (tur.endOfClampSignals[b][i] != null) {
                            if (
                                tur.butNotThese[b] == null ||
                                tur.butNotThese[b].indexOf(i) === -1
                            ) {
                                if (tur.singer.runningFromEvent) {
                                    // console.log("RUNNING FROM EVENT");
                                } else {
                                    logo.stage.dispatchEvent(tur.endOfClampSignals[b][i]);
                                }
                            }
                        }
                    }
                }

                // Make sure SVG path is closed
                logo.turtles.turtleList[turtle].painter.closeSVG();

                // Mark the turtle as not running
                logo.turtles.turtleList[turtle].running = false;
                if (!logo.turtles.running() && queueStart === 0) {
                    logo.onStopTurtle();
                }
            } else {
                logo.turtles.turtleList[turtle].running = false;
            }

            const comp = logo.turtles.turtleList[turtle].companionTurtle;
            if (comp) {
                logo.turtles.turtleList[comp].running = false;
                const interval = logo.turtles.turtleList[comp].interval;
                if (interval) clearInterval(interval);
            }
            // Because flow can come from calc blocks, we are not
            // ensured that the turtle is really finished running
            // yet. Hence the timeout.
            const __checkCompletionState = () => {
                if (
                    !logo.turtles.running() &&
                    queueStart === 0 &&
                    tur.singer.justCounting.length === 0
                ) {
                    if (logo.runningLilypond) {
                        if (logo.collectingStats) {
                            // console.debug("stats collection completed");
                            logo.projectStats = getStatsFromNotation(logo);
                            logo.statsWindow.displayInfo(logo.projectStats);
                        } else {
                            // console.debug("saving lilypond output:");
                            save.afterSaveLilypond();
                        }
                        logo.collectingStats = false;
                        logo.runningLilypond = false;
                    } else if (logo.runningAbc) {
                        // console.debug("saving abc output:");
                        save.afterSaveAbc();
                        logo.runningAbc = false;
                    } else if (logo.runningMxml) {
                        // console.log("saving mxml output");
                        save.afterSaveMxml();
                        logo.runningMxml = false;
                    } else if (tur.singer.suppressOutput) {
                        // console.debug("finishing compiling");
                        if (!logo.recording) {
                            logo.errorMsg(_("Playback is ready."));
                        }
                    }

                    // Give the last note time to play
                    // console.debug(
                    //     "SETTING LAST NOTE TIMEOUT: " +
                    //         logo.recording +
                    //         " " +
                    //         tur.singer.suppressOutput
                    // );
                    logo._lastNoteTimeout = setTimeout(() => {
                        // console.debug("LAST NOTE PLAYED");
                        logo._lastNoteTimeout = null;
                        tur.singer.runningFromEvent = false;
                        if (tur.singer.suppressOutput && logo.recording) {
                            tur.singer.suppressOutput = false;
                            logo._checkingCompletionState = false;
                            logo.saveLocally();
                        } else {
                            tur.singer.suppressOutput = false;
                            logo._checkingCompletionState = false;

                            // Reset the cursor
                            document.body.style.cursor = "default";

                            // Save the session
                            logo.saveLocally();
                        }
                        if (this.synth.recorder && this.synth.recorder.state == "recording")
                            this.synth.recorder.stop();
                    }, 1000);
                } else if (tur.singer.suppressOutput) {
                    setTimeout(() => __checkCompletionState(), 250);
                }
            };

            if (
                !logo.turtles.running() &&
                queueStart === 0 &&
                tur.singer.justCounting.length === 0
            ) {
                if (!logo._checkingCompletionState) {
                    logo._checkingCompletionState = true;
                    setTimeout(() => __checkCompletionState(), 250);
                }
            }

            if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                // Nothing else to do. Clean up.
                if (
                    logo.turtles.turtleList[turtle].queue.length === 0 ||
                    blk !== last(logo.turtles.turtleList[turtle].queue).parentBlk
                ) {
                    setTimeout(() => {
                        if (logo.blocks.visible) {
                            logo.blocks.unhighlight(blk);
                        }
                    }, logo.turtleDelay);
                }

                // Unhighlight any parent blocks still highlighted
                for (const b in tur.parentFlowQueue) {
                    if (logo.blocks.visible) {
                        logo.blocks.unhighlight(tur.parentFlowQueue[b]);
                    }
                }

                // Make sure the turtles are on top
                const i = logo.stage.children.length - 1;
                logo.stage.setChildIndex(logo.turtles.turtleList[turtle].container, i);
                logo.refreshCanvas();
            }

            for (const arg in logo.evalOnStopList) {
                eval(logo.evalOnStopList[arg]);
            }

            if (!logo.turtles.running() && queueStart === 0) {
                if (logo.showBlocksAfterRun) {
                    // If this is a status stack, not run showBlocks
                    if (
                        blk !== null &&
                        logo.blocks.blockList[blk].connections[0] !== null &&
                        ["status", "oscilloscope"].indexOf(
                            logo.blocks.blockList[logo.blocks.blockList[blk].connections[0]].name
                        ) !== -1
                    ) {
                        // console.debug("running status/oscilloscope block");
                    } else {
                        logo.blocks.showBlocks();
                        logo.showBlocksAfterRun = false;
                    }
                }
                document.getElementById("stop").style.color = "white";
            }
        }
    }

    /**
     * Dispatches turtle signals to update turtle graphics.
     *
     * @async
     * @param turtle
     * @param {number} beatValue
     * @param blk
     * @param {number} delay
     * @returns {void}
     */
    async dispatchTurtleSignals(turtle, beatValue, blk, delay) {
        // When turtle commands (forward, right, arc) are inside of notes,
        // they are run progressively over the course of the note duration

        const tur = this.turtles.ithTurtle(turtle);

        if (tur.singer.embeddedGraphics === {}) return;

        if ((!blk) in tur.singer.embeddedGraphics) return;

        if (tur.singer.embeddedGraphics[blk].length === 0) return;

        // If the previous note's graphics are not complete, add a slight delay before drawing any new graphics
        if (!tur.embeddedGraphicsFinished) {
            delay += 0.1;
        }

        tur.embeddedGraphicsFinished = false;

        const suppressOutput = tur.singer.suppressOutput;

        const __pen = (turtle, name, arg, timeout) => {
            const _penSwitch = (name) => {
                switch (name) {
                    case "penup":
                        tur.painter.doPenUp();
                        break;
                    case "pendown":
                        tur.painter.doPenDown();
                        break;
                    case "setcolor":
                        tur.painter.doSetColor(arg);
                        break;
                    case "sethue":
                        tur.painter.doSetHue(arg);
                        break;
                    case "setshade":
                        tur.painter.doSetValue(arg);
                        break;
                    case "settranslucency":
                        tur.painter.doSetPenAlpha(arg);
                        break;
                    case "setgrey":
                        tur.painter.doSetChroma(arg);
                        break;
                    case "setpensize":
                        tur.painter.doSetPensize(arg);
                        break;
                }
            };

            if (suppressOutput) {
                _penSwitch(name);
            } else {
                setTimeout(() => _penSwitch(name), timeout);
            }
        };

        const __clear = () => {
            if (tur.singer.suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                tur.painter.doSetXY(0, 0);
                tur.painter.doSetHeading(0);
                tur.painter.penState = savedPenState;
                this.svgBackground = true;
            } else {
                tur.painter.penState = false;
                tur.painter.doSetHeading(0);
                tur.painter.doSetXY(0, 0);
                tur.painter.penState = true;
                // tur.painter.doClear(true, true, true);
            }
        };

        const __right = (turtle, arg, timeout) => {
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                tur.painter.doRight(arg);
                tur.painter.penState = savedPenState;
            } else {
                setTimeout(() => tur.painter.doRight(arg), timeout);
            }
        };

        const __setheading = (turtle, arg, timeout) => {
            if (suppressOutput) {
                tur.painter.doSetHeading(arg);
            } else {
                setTimeout(() => tur.painter.doSetHeading(arg), timeout);
            }
        };

        const __forward = (turtle, arg, timeout) => {
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                tur.painter.doForward(arg);
                tur.painter.penState = savedPenState;
            } else {
                setTimeout(() => tur.painter.doForward(arg), timeout);
            }
        };

        const __scrollxy = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                tur.painter.doScrollXY(arg1, arg2);
            } else {
                setTimeout(() => tur.painter.doScrollXY(arg1, arg2), timeout);
            }
        };

        const __setxy = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                tur.painter.doSetXY(arg1, arg2);
                tur.painter.penState = savedPenState;
            } else {
                setTimeout(() => tur.painter.doSetXY(arg1, arg2), timeout);
            }
        };

        const __show = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) return;

            setTimeout(() => this.processShow(turtle, null, arg1, arg2), timeout);
        };

        const __speak = (turtle, arg, timeout) => {
            if (suppressOutput) return;

            setTimeout(() => this.processSpeak(arg), timeout);
        };

        const __print = (arg, timeout) => {
            if (suppressOutput) return;

            setTimeout(() => this.textMsg(arg.toString()), timeout);
        };

        const __arc = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                tur.painter.doArc(arg1, arg2);
                tur.painter.penState = savedPenState;
            } else {
                setTimeout(() => tur.painter.doArc(arg1, arg2), timeout);
            }
        };

        const __cp1 = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                tur.painter.cp1x = arg1;
                tur.painter.cp1y = arg2;
            } else {
                setTimeout(() => {
                    tur.painter.cp1x = arg1;
                    tur.painter.cp1y = arg2;
                }, timeout);
            }
        };

        const __cp2 = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                tur.painter.cp2x = arg1;
                tur.painter.cp2y = arg2;
            } else {
                setTimeout(() => {
                    tur.painter.cp2x = arg1;
                    tur.painter.cp2y = arg2;
                }, timeout);
            }
        };

        const __bezier = (turtle, arg1, arg2, timeout) => {
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                tur.painter.doBezier(arg1, arg2);
                tur.painter.penState = savedPenState;
            } else {
                setTimeout(() => tur.painter.doBezier(arg1, arg2), timeout);
            }
        };

        let inFillClamp = false;
        const __fill = (turtle, timeout) => {
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                if (inFillClamp) {
                    tur.painter.doEndFill();
                    inFillClamp = false;
                } else {
                    tur.painter.doStartFill();
                    inFillClamp = true;
                }
                tur.painter.penState = savedPenState;
            } else {
                setTimeout(() => {
                    if (inFillClamp) {
                        tur.painter.doEndFill();
                        inFillClamp = false;
                    } else {
                        tur.painter.doStartFill();
                        inFillClamp = true;
                    }
                }, timeout);
            }
        };

        let inHollowLineClamp = false;
        const __hollowline = (turtle, timeout) => {
            if (suppressOutput) {
                if (inHollowLineClamp) {
                    tur.painter.doEndHollowLine();
                    inHollowLineClamp = false;
                } else {
                    tur.painter.doStartHollowLine();
                    inHollowLineClamp = true;
                }
            } else {
                setTimeout(() => {
                    if (inHollowLineClamp) {
                        tur.painter.doEndHollowLine();
                        inHollowLineClamp = false;
                    } else {
                        tur.painter.doStartHollowLine();
                        inHollowLineClamp = true;
                    }
                }, timeout);
            }
        };

        let extendedGraphicsCounter = 0;
        for (let i = 0; i < tur.singer.embeddedGraphics[blk].length; i++) {
            const b = tur.singer.embeddedGraphics[blk][i];
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
        if (stepTime < 0) stepTime = 0;

        // We do each graphics action sequentially, so we need to
        // divide stepTime by the length of the embedded graphics
        // array
        if (extendedGraphicsCounter > 0) {
            stepTime = stepTime / extendedGraphicsCounter;
        }

        let waitTime = delay * 1000;

        // Update the turtle graphics every 50ms within a note
        if (stepTime > 200) {
            tur.singer.dispatchFactor = NOTEDIV / 32;
        } else if (stepTime > 100) {
            tur.singer.dispatchFactor = NOTEDIV / 16;
        } else if (stepTime > 50) {
            tur.singer.dispatchFactor = NOTEDIV / 8;
        } else if (stepTime > 25) {
            tur.singer.dispatchFactor = NOTEDIV / 4;
        } else if (stepTime > 12.5) {
            tur.singer.dispatchFactor = NOTEDIV / 2;
        } else {
            tur.singer.dispatchFactor = NOTEDIV;
        }

        for (let i = 0; i < tur.singer.embeddedGraphics[blk].length; i++) {
            const b = tur.singer.embeddedGraphics[blk][i];
            const name = this.blocks.blockList[b].name;

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
                    break;

                case "penup":
                case "pendown":
                    if (!suppressOutput) {
                        __pen(turtle, name, null, waitTime);
                    }
                    break;

                case "clear":
                    __clear(turtle, waitTime);
                    break;

                case "fill":
                    __fill(turtle, waitTime);
                    break;

                case "hollowline":
                    __hollowline(turtle, waitTime);
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
                    break;

                case "right":
                    arg = this.parseArg(
                        this,
                        turtle,
                        this.blocks.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );

                    for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                        const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                        const deltaArg = arg / (NOTEDIV / tur.singer.dispatchFactor);
                        __right(turtle, deltaArg, deltaTime);
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

                    for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                        const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                        const deltaArg = arg / (NOTEDIV / tur.singer.dispatchFactor);
                        __right(turtle, -deltaArg, deltaTime);
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

                    for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                        const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                        const deltaArg = arg / (NOTEDIV / tur.singer.dispatchFactor);
                        __forward(turtle, deltaArg, deltaTime);
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

                    for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                        const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                        const deltaArg = arg / (NOTEDIV / tur.singer.dispatchFactor);
                        __forward(turtle, -deltaArg, deltaTime);
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

                    for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                        const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                        const deltaArg = arg1 / (NOTEDIV / tur.singer.dispatchFactor);
                        __arc(turtle, deltaArg, arg2, deltaTime);
                    }

                    waitTime += NOTEDIV * stepTime;
                    break;

                default:
                    // console.debug(name + " is not supported inside of Note Blocks");
                    break;
            }
        }

        // Mark the end time of this note's graphics operations
        await delayExecution(beatValue * 1000);
        tur.embeddedGraphicsFinished = true;
    }
}
