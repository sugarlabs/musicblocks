// Copyright (c) 2014-2021 Walter Bender
// Copyright (c) 2015 Yash Khandelwal
// Copyright (c) 2020 Anindya Kundu
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, Notation, Synth, instruments, instrumentsFilters,
   instrumentsEffects, Singer, Tone, CAMERAVALUE, doUseCamera,
   VIDEOVALUE, last, getIntervalDirection, getIntervalNumber,
   mixedNumber, rationalToFraction, doStopVideoCam, StatusMatrix,
   getStatsFromNotation, delayExecution, DEFAULTVOICE, window
 */

/*
   exported

   Queue, Logo, LogoDependencies, DEFAULTVOLUME, PREVIEWVOLUME, DEFAULTDELAY,
   OSCVOLUMEADJUSTMENT, TONEBPM, TARGETBPM, TURTLESTEP, NOTEDIV,
   MIN_HIGHLIGHT_DURATION_MS,
   NOMICERRORMSG, NANERRORMSG, NOSTRINGERRORMSG, NOBOXERRORMSG,
   NOACTIONERRORMSG, NOINPUTERRORMSG, NOSQRTERRORMSG,
   ZERODIVIDEERRORMSG, EMPTYHEAPERRORMSG, INVALIDPITCH, POSNUMBER,
   NOTATIONNOTE, NOTATIONDURATION, NOTATIONDOTCOUNT,
   NOTATIONTUPLETVALUE, NOTATIONROUNDDOWN, NOTATIONINSIDECHORD,
   NOTATIONSTACCATO
 */

// Constants moved to js/logoconstants.js to resolve circular dependency

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

class Logo {
    /**
     * @constructor
     * @param {Object|LogoDependencies} activityOrDeps - Either an Activity object (old pattern)
     *                                                    or a LogoDependencies object (new pattern)
     *
     * @example
     * // Old pattern (still supported)
     * const logo = new Logo(activity);
     *
     * @example
     * // New pattern (explicit dependencies)
     * const deps = new LogoDependencies({
     *     blocks: activity.blocks,
     *     turtles: activity.turtles,
     *     // ... other dependencies
     * });
     * const logo = new Logo(deps);
     */
    constructor(activityOrDeps) {
        // Check if this is a LogoDependencies instance
        const isExplicitDeps =
            activityOrDeps &&
            activityOrDeps.blocks &&
            activityOrDeps.turtles &&
            activityOrDeps.stage &&
            activityOrDeps.errorHandler;

        if (isExplicitDeps) {
            // New pattern: explicit dependencies
            this.deps = activityOrDeps;
            // For backward compatibility, also expose activity facade
            const deps = this.deps;
            this.activity = {
                blocks: deps.blocks,
                turtles: deps.turtles,
                stage: deps.stage,
                errorMsg: (msg, blk) => deps.errorHandler(msg, blk),
                hideMsgs: () => deps.messageHandler.hide(),
                saveLocally: () => deps.storage.saveLocally(),
                get showBlocksAfterRun() {
                    return deps.config.showBlocksAfterRun;
                },
                set showBlocksAfterRun(value) {
                    deps.config.showBlocksAfterRun = value;
                },
                onStopTurtle: deps.callbacks.onStopTurtle,
                onRunTurtle: deps.callbacks.onRunTurtle,

                logo: this // Self-reference for compatibility
            };
        } else {
            // Old pattern: Activity facade
            this.activity = activityOrDeps;
            // Create deps as a view over activity for future migration
            this.deps = {
                blocks: this.activity.blocks,
                turtles: this.activity.turtles,
                stage: this.activity.stage,
                errorHandler: (msg, blk) => this.activity.errorMsg(msg, blk),
                messageHandler: {
                    hide: () => this.activity.hideMsgs()
                },
                storage: {
                    saveLocally: () => this.activity.saveLocally()
                },
                config: {
                    get showBlocksAfterRun() {
                        return this.activity.showBlocksAfterRun;
                    },
                    set showBlocksAfterRun(value) {
                        this.activity.showBlocksAfterRun = value;
                    }
                },
                callbacks: {
                    get onStopTurtle() {
                        return this.activity.onStopTurtle;
                    },
                    get onRunTurtle() {
                        return this.activity.onRunTurtle;
                    }
                },

                // Audio and utility dependencies
                instruments: typeof instruments !== "undefined" ? instruments : null,
                instrumentsFilters:
                    typeof instrumentsFilters !== "undefined" ? instrumentsFilters : null,
                instrumentsEffects:
                    typeof instrumentsEffects !== "undefined" ? instrumentsEffects : null,
                widgetWindows: typeof window !== "undefined" ? window.widgetWindows : null,
                Singer: typeof Singer !== "undefined" ? Singer : null,
                Tone: typeof Tone !== "undefined" ? Tone : null,
                utils: {
                    doUseCamera: typeof doUseCamera !== "undefined" ? doUseCamera : null,
                    doStopVideoCam: typeof doStopVideoCam !== "undefined" ? doStopVideoCam : null,
                    getIntervalDirection:
                        typeof getIntervalDirection !== "undefined" ? getIntervalDirection : null,
                    getIntervalNumber:
                        typeof getIntervalNumber !== "undefined" ? getIntervalNumber : null,
                    mixedNumber: typeof mixedNumber !== "undefined" ? mixedNumber : null,
                    rationalToFraction:
                        typeof rationalToFraction !== "undefined" ? rationalToFraction : null,
                    getStatsFromNotation:
                        typeof getStatsFromNotation !== "undefined" ? getStatsFromNotation : null,
                    delayExecution: typeof delayExecution !== "undefined" ? delayExecution : null,
                    last: typeof last !== "undefined" ? last : null
                },
                classes: {
                    Notation: typeof Notation !== "undefined" ? Notation : null,
                    Synth: typeof Synth !== "undefined" ? Synth : null,
                    StatusMatrix: typeof StatusMatrix !== "undefined" ? StatusMatrix : null
                }
            };
        }

        // Bind commonly-used dependencies locally for readability
        this.blocks = this.deps.blocks;
        this.turtles = this.deps.turtles;
        this.stage = this.deps.stage;

        this.blockList = this.activity.blocks.blockList;
        this._onStopTurtle = this.activity.onStopTurtle;
        this._onRunTurtle = this.activity.onRunTurtle;

        // Widgets
        this.reflection = null;
        this.phraseMaker = null;
        this.legoWidget = null;
        this.pitchDrumMatrix = null;
        this.arpeggio = null;
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
        this.legobricks = null;

        this.evalFlowDict = {};
        this.evalArgDict = {};
        this.evalParameterDict = {};
        this.evalSetterDict = {};
        this.evalOnStartList = {};
        this.evalOnStopList = {};
        this.pluginVars = {};
        this.pluginReturnValue = null;

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
        this._currentlyHighlightedBlock = null;

        this.time = 0;
        this.firstNoteTime = null;
        this.firstNoteAudioTime = null;
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
        this._currentDrumBlock = null;
        this.inTimbre = false;
        this.inArpeggio = false;
        this.insideModeWidget = false;
        this.insideMeterWidget = false;
        this.insideTemperament = false;

        // pitch-rhythm matrix
        this.inMatrix = false;
        this.inLegoWidget = false;
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
        this._notation = new this.deps.classes.Notation(this.activity);

        // parameters used by notations
        this.notationOutput = "";
        this.notationNotes = {};
        this.MIDIOutput = "";
        this.guitarOutputHead = "";
        this.guitarOutputEnd = "";
        this.runningLilypond = false;
        this.collectingStats = false;
        this.runningAbc = false;
        this.runningMxml = false;
        this.runningMIDI = false;
        this._checkingCompletionState = false;
        this.recording = false;

        // Buffer for recording musical output (Issue #2330)
        // This allows saving Lilypond/ABC notation from interactive sessions
        this.recordingBuffer = {
            hasData: false,
            notationOutput: "",
            notationNotes: {},
            notationStaging: {},
            notationDrumStaging: {}
        };

        this.temperamentSelected = [];
        this.customTemperamentDefined = false;
        this.specialArgs = [];

        // Load the default synthesizer
        this.synth = new this.deps.classes.Synth();
        this.synth.activity = this.activity; // Reference for voice tracking
        this.synth.changeInTemperament = false;

        // Mode widget
        this.modeBlock = null;

        // Meter widget
        this._meterBlock = null;

        // Status matrix
        this.inStatusMatrix = false;
        this.inOscilloscope = false;
        this.updatingStatusMatrix = false;
        this.statusFields = [];

        // Midi Data
        this._midiData = {};

        // When running in step-by-step mode, the next command to run
        // is queued here.
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
                    this.blockList[obj[0]].connections[obj[1]] = obj[2];
                    if (obj[2] != null) {
                        this.blockList[obj[2]].connections[0] = obj[0];
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

        for (const turtle in this.activity.turtles.turtleList) {
            const tur = this.activity.turtles.ithTurtle(turtle);

            if (!(turtle in this.deps.instruments)) {
                this.deps.instruments[turtle] = {};
                this.deps.instrumentsFilters[turtle] = {};
                this.deps.instrumentsEffects[turtle] = {};
            }

            // Make sure there is a default synth for each turtle
            if (!(DEFAULTVOICE in this.deps.instruments[turtle])) {
                this.synth.createDefaultSynth(turtle);
            }

            // Copy any preloaded synths from the default turtle
            for (const instrumentName in this.deps.instruments[0]) {
                if (!(instrumentName in this.deps.instruments[turtle])) {
                    this.synth.loadSynth(turtle, instrumentName);

                    // Copy any filters
                    if (instrumentName in this.deps.instrumentsFilters[0]) {
                        this.deps.instrumentsFilters[turtle][instrumentName] =
                            this.deps.instrumentsFilters[0][instrumentName];
                    }

                    // ...and any effects
                    if (instrumentName in this.deps.instrumentsEffects[0]) {
                        this.deps.instrumentsEffects[turtle][instrumentName] =
                            this.deps.instrumentsEffects[0][instrumentName];
                    }
                }
            }

            tur.singer.synthVolume = {
                "electronic synth": [DEFAULTVOLUME],
                "noise1": [DEFAULTVOLUME],
                "noise2": [DEFAULTVOLUME],
                "noise3": [DEFAULTVOLUME]
            };
            tur.singer.synthVolume[DEFAULTVOICE] = [DEFAULTVOLUME];
        }

        for (const turtle in this.activity.turtles.turtleList) {
            // Cache ithTurtle result to avoid redundant function calls in inner loop
            const tur = this.activity.turtles.ithTurtle(turtle);
            for (const synth in tur.singer.synthVolume) {
                this.deps.Singer.setSynthVolume(this, turtle, synth, DEFAULTVOLUME);
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
        if (!(DEFAULTVOICE in this.deps.instruments[turtle])) {
            this.synth.createDefaultSynth(turtle);
        }

        this.deps.Singer.setMasterVolume(this.activity.logo, DEFAULTVOLUME);
        for (const turtle in this.activity.turtles.turtleList) {
            // Cache ithTurtle result to avoid redundant function calls in inner loop
            const tur = this.activity.turtles.ithTurtle(turtle);
            for (const synth in tur.singer.synthVolume) {
                this.deps.Singer.setSynthVolume(this, turtle, synth, DEFAULTVOLUME);
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
        let mic = new this.deps.Tone.UserMedia();
        try {
            mic.open();
        } catch (e) {
            this.activity.errorMsg(NOMICERRORMSG);
            mic = null;
        }

        this.mic = mic;
        this.limit = 16384;
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
        // meSpeak was removed from the codebase.
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
        const requiredTurtle = this.activity.turtles.getTurtle(turtle);
        if (typeof arg1 === "string") {
            const len = arg1.length;
            if (len === 14 && arg1.substr(0, 14) === CAMERAVALUE) {
                this.deps.utils.doUseCamera(
                    [arg0],
                    this.activity.turtles,
                    turtle,
                    false,
                    this.cameraID,
                    this.setCameraID,
                    this.activity.errorMsg
                );
            } else if (len === 13 && arg1.substr(0, 13) === VIDEOVALUE) {
                this.deps.utils.doUseCamera(
                    [arg0],
                    this.activity.turtles,
                    turtle,
                    true,
                    this.cameraID,
                    this.setCameraID,
                    this.activity.errorMsg
                );
            } else if (len > 10 && arg1.substr(0, 10) === "data:image") {
                requiredTurtle.doShowImage(arg0, arg1);
            } else if (len > 8 && arg1.substr(0, 8) === "https://") {
                requiredTurtle.doShowURL(arg0, arg1);
            } else if (len > 7 && arg1.substr(0, 7) === "http://") {
                requiredTurtle.doShowURL(arg0, arg1);
            } else if (len > 7 && arg1.substr(0, 7) === "file://") {
                requiredTurtle.doShowURL(arg0, arg1);
            } else {
                requiredTurtle.doShowText(arg0, arg1);
            }
        } else if (
            typeof arg1 === "object" &&
            blk !== null &&
            this.blockList[this.blockList[blk].connections[2]].name === "loadFile"
        ) {
            if (arg1) {
                requiredTurtle.doShowText(arg0, arg1[1]);
            } else {
                this.activity.errorMsg(_("You must select a file."));
            }
        } else {
            requiredTurtle.doShowText(arg0, arg1);
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
        const tur = this.activity.turtles.ithTurtle(turtle);
        if (listenerName in tur.listeners) {
            this.activity.stage.removeEventListener(
                listenerName,
                tur.listeners[listenerName],
                false
            );
        }

        tur.listeners[listenerName] = listener;
        this.activity.stage.addEventListener(listenerName, listener, false);
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
        const tur = this.activity.turtles.ithTurtle(turtle);

        let nextBlock = null;
        if (!tur.singer.inDuplicate && tur.singer.backward.length > 0) {
            const c =
                this.blockList[this.deps.utils.last(tur.singer.backward)].name === "backward"
                    ? 1
                    : 2;
            if (
                this.activity.blocks.sameGeneration(
                    this.blockList[this.deps.utils.last(tur.singer.backward)].connections[c],
                    blk
                )
            ) {
                nextBlock = this.blockList[blk].connections[0];
            } else {
                nextBlock = this.deps.utils.last(this.blockList[blk].connections);
            }
        } else {
            nextBlock = this.deps.utils.last(this.blockList[blk].connections);
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
        const tur = logo.activity.turtles.ithTurtle(turtle);

        // Retrieve the value of a block
        if (blk == null) {
            logo.activity.errorMsg(NOINPUTERRORMSG, parentBlk);
            // logo.stopTurtle = true;
            return null;
        }

        if (logo.blockList[blk].protoblock.parameter) {
            if (!tur.parameterQueue.includes(blk)) {
                tur.parameterQueue.push(blk);
            }
        }

        if (typeof logo.blockList[blk].protoblock.arg === "function") {
            return (logo.blockList[blk].value = logo.blockList[blk].protoblock.arg(
                logo,
                turtle,
                blk,
                receivedArg
            ));
        }

        if (logo.blockList[blk].name === "intervalname") {
            if (typeof logo.blockList[blk].value === "string") {
                tur.singer.noteDirection = logo.deps.utils.getIntervalDirection(
                    logo.blockList[blk].value
                );
                return logo.deps.utils.getIntervalNumber(logo.blockList[blk].value);
            } else return 0;
        } else if (logo.blockList[blk].isValueBlock()) {
            return logo.blockList[blk].value;
        } else if (
            ["anyout", "numberout", "textout", "booleanout"].includes(
                logo.blockList[blk].protoblock.dockTypes[0]
            )
        ) {
            switch (logo.blockList[blk].name) {
                case "dectofrac":
                    if (
                        logo.inStatusMatrix &&
                        logo.blockList[logo.blockList[blk].connections[0]].name === "print"
                    ) {
                        logo.statusFields.push([blk, "dectofrac"]);
                    } else {
                        const cblk = logo.blockList[blk].connections[1];
                        if (cblk === null) {
                            logo.activity.errorMsg(NOINPUTERRORMSG, blk);
                            logo.blockList[blk].value = 0;
                        } else {
                            const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                            if (typeof a === "number") {
                                logo.blockList[blk].value =
                                    a < 0
                                        ? "-" + logo.deps.utils.mixedNumber(-a)
                                        : logo.deps.utils.mixedNumber(a);
                            } else {
                                logo.activity.errorMsg(NANERRORMSG, blk);
                                logo.blockList[blk].value = 0;
                            }
                        }
                    }
                    break;

                case "hue":
                    if (
                        logo.inStatusMatrix &&
                        logo.blockList[logo.blockList[blk].connections[0]].name === "print"
                    ) {
                        logo.statusFields.push([blk, "color"]);
                    } else {
                        logo.blockList[blk].value =
                            logo.activity.turtles.getTurtle(turtle).painter.color;
                    }
                    break;

                /** @deprecated */
                case "returnValue":
                    if (logo.returns[turtle].length > 0) {
                        logo.blockList[blk].value = logo.returns[turtle].pop();
                    } else {
                        logo.blockList[blk].value = 0;
                    }
                    break;

                default:
                    // Is it a plugin?
                    if (logo.blockList[blk].name in logo.evalArgDict) {
                        // Debug logging removed to avoid console noise in production
                        eval(logo.evalArgDict[logo.blockList[blk].name]);
                    } else {
                        // eslint-disable-next-line no-console
                        console.error("I do not know how to " + logo.blockList[blk].name);
                    }
                    break;
            }

            return logo.blockList[blk].value;
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

        const tur = this.activity.turtles.ithTurtle(turtle);

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
            const obj = this.deps.utils.rationalToFraction(d);

            if (d2 > 0) {
                // Check to see if the note straddles multiple measures
                let i = 0;
                while (d2 > b) {
                    ++i;
                    d2 -= b;
                }

                let obj2 = this.deps.utils.rationalToFraction(d2);
                if (obj2[0] !== 0) {
                    this.updateNotation(note, obj2[1] / obj2[0], turtle, insideChord, drum, false);
                }
                if (i > 0 || obj[0] > 0) {
                    if (note[0] !== "R") {
                        // Don't tie rests
                        this.notation.notationInsertTie(turtle);
                        this.notation.notationDrumStaging[turtle].push("tie");
                    }
                    obj2 = this.deps.utils.rationalToFraction(1 / b);
                }

                // Add any measures we straddled
                while (i > 0) {
                    i -= 1;
                    if (obj2[0] !== 0) {
                        this.updateNotation(
                            note,
                            obj2[1] / obj2[0],
                            turtle,
                            insideChord,
                            drum,
                            false
                        );
                    }
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
                if (obj[0] !== 0) {
                    this.updateNotation(note, obj[1] / obj[0], turtle, insideChord, drum, false);
                }
            }
        } else {
            // .. otherwise proceed as normal
            this.notation.doUpdateNotation(...arguments);
        }
    }

    notationMIDI(note, drum, duration, turtle, bpm, instrument) {
        if (!this._midiData[turtle]) {
            this._midiData[turtle] = [];
        }
        if (drum) drum = drum[0];
        this._midiData[turtle].push({ note, duration, bpm, instrument, drum });
    }

    // ========================================================================

    /**
     * Clears the delay timeout after a successful input, and runs from
     * next block.
     *
     * @param {Object} turtle
     * @returns {void}
     */
    clearTurtleRun(turtle) {
        const tur = this.activity.turtles.ithTurtle(turtle);

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
                ["forever", "repeat", "while", "until"].includes(
                    this.blockList[turtle.queue[i].blk].name
                )
            ) {
                // while or until
                loopBlkIdx = turtle.queue[i].blk;
                parentLoopBlock = this.blockList[loopBlkIdx];
                // Flush the parent from the queue
                turtle.queue.pop();
                break;
            } else if (
                ["forever", "repeat", "while", "until"].includes(
                    this.blockList[turtle.queue[i].parentBlk].name
                )
            ) {
                // repeat or forever
                loopBlkIdx = turtle.queue[i].parentBlk;
                parentLoopBlock = this.blockList[loopBlkIdx];
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
            const childFlow = this.deps.utils.last(parentLoopBlock.connections);
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

        this.activity.turtles
            .ithTurtle(turtle)
            .initTurtle(
                this.runningLilypond || this.runningAbc || this.runningMxml || this.runningMIDI
            );
    }

    /**
     * Stops the turtles and cleans up a few odds and ends.
     * The stop button was pressed.
     *
     * @returns {void}
     */
    doStopTurtles() {
        this.stopTurtle = true;
        this.activity.turtles.markAllAsStopped();

        for (const sound in this.sounds) {
            this.sounds[sound].stop();
        }

        this.sounds = [];

        // Kill all active audio voices to prevent "zombie audio"
        for (const turtle in this.activity.turtles.turtleList) {
            const tur = this.activity.turtles.getTurtle(turtle);
            if (tur && tur.singer && typeof tur.singer.killAllVoices === "function") {
                tur.singer.killAllVoices();
            }

            for (const instrumentName in this.deps.instruments[turtle]) {
                this.synth.stopSound(turtle, instrumentName);
            }
            const comp = this.activity.turtles.getTurtle(turtle).companionTurtle;
            if (comp) {
                this.activity.turtles.getTurtle(comp).running = false;
                const interval = this.activity.turtles.getTurtle(comp).interval;
                if (interval) clearInterval(interval);
            }
        }

        this.synth.stop();
        if (this.synth.recorder && this.synth.recorder.state == "recording")
            this.synth.recorder.stop();

        if (this.cameraID != null) {
            this.deps.utils.doStopVideoCam(this.cameraID, this.setCameraID);
        }

        this.onStopTurtle();
        this.activity.blocks.bringToTop();

        this.stepQueue = {};
        for (const turtle of this.activity.turtles.turtleList) {
            turtle.unhighlightQueue = [];
        }

        this._restoreConnections();

        document.body.style.cursor = "default";
        if (this.activity.showBlocksAfterRun) {
            this.activity.blocks.showBlocks();
            document.getElementById("stop").style.color = "white";
        }

        this.activity.showBlocksAfterRun = false;
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
                    if (this.activity.blocks.visible) {
                        this.activity.blocks.unhighlight(this._unhighlightStepQueue[turtle]);
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
        } else {
            this._ignoringBlock = null;
        }

        if (this._lastNoteTimeout != null) {
            clearTimeout(this._lastNoteTimeout);
            this._lastNoteTimeout = null;
        }

        this._restoreConnections(); // Restore any broken connections.
        this.activity.saveLocally(); // Save the state before running.

        for (const arg in this.evalOnStartList) {
            eval(this.evalOnStartList[arg]);
        }

        this.stopTurtle = false;

        this.activity.blocks.unhighlightAll();
        this.activity.blocks.bringToTop(); // Draw under the blocks.

        this.activity.hideMsgs();

        // Run the Logo commands here.
        this.time = new Date().getTime();
        this.firstNoteTime = null;
        this.firstNoteAudioTime = null;

        // Ensure we have at least one turtle.
        if (this.activity.turtles.getTurtleCount() === 0) {
            this.activity.turtles.add(null);
        }

        this.deps.Singer.masterBPM = TARGETBPM;
        this.deps.Singer.defaultBPMFactor = TONEBPM / TARGETBPM;
        this.synth.changeInTemperament = false;

        this._checkingCompletionState = false;

        for (const turtle of this.activity.turtles.turtleList) {
            turtle.embeddedGraphicsFinished = true;
        }

        this.prepSynths();

        this.notation.notationStaging = {};
        this.notation.notationDrumStaging = {};

        // Each turtle needs to keep its own wait time and music states.
        for (const turtle in this.activity.turtles.turtleList) {
            this.initTurtle(turtle);
        }

        this.inPitchDrumMatrix = false;
        this.inMatrix = false;
        this.inLegoWidget = false;
        this.inMusicKeyboard = false;
        this.inTimbre = false;
        this.inArpeggio = false;
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

        // Remove any listeners that might be still active.
        for (const turtle of this.activity.turtles.turtleList) {
            for (const listener in turtle.listeners) {
                this.activity.stage.removeEventListener(
                    listener,
                    turtle.listeners[listener],
                    false
                );
            }

            turtle.listeners = {};
        }

        // Init the graphic state.
        for (const turtle in this.activity.turtles.turtleList) {
            const requiredTurtle = this.activity.turtles.getTurtle(turtle);
            requiredTurtle.container.x = this.activity.turtles.turtleX2screenX(requiredTurtle.x);
            requiredTurtle.container.y = this.activity.turtles.turtleY2screenY(requiredTurtle.y);
        }

        // Set up status block.
        if (this.deps.widgetWindows.isOpen("status")) {
            // Ensure widget has been created before trying to initialize it
            if (this.statusMatrix === null) {
                this.statusMatrix = new this.deps.classes.StatusMatrix();
            }

            this.statusMatrix.init(this.activity);
        }

        // Execute turtle code here
        /*
        ===========================================================================
        (1) Find the start block (or the top of each stack) and build a list
            of all of the named action stacks.
        ===========================================================================
        */
        const startBlocks = [];
        this.activity.blocks.findStacks();
        this.actions = {};

        const stackListLength = this.activity.blocks.stackList.length;
        for (let blk = 0; blk < stackListLength; blk++) {
            if (
                ["start", "drum", "status", "oscilloscope"].includes(
                    this.blockList[this.activity.blocks.stackList[blk]].name
                )
            ) {
                // Don't start on a start block in the trash
                if (!this.blockList[this.activity.blocks.stackList[blk]].trash) {
                    startBlocks.push(this.activity.blocks.stackList[blk]);
                }
            } else if (this.blockList[this.activity.blocks.stackList[blk]].name === "action") {
                // Does the action stack have a name?
                const c = this.blockList[this.activity.blocks.stackList[blk]].connections[1];
                // Is there a block in the action clamp?
                const b = this.blockList[this.activity.blocks.stackList[blk]].connections[2];
                if (c != null && b != null) {
                    // Don't use an action block in the trash
                    if (!this.blockList[this.activity.blocks.stackList[blk]].trash) {
                        // We need to calculate the value of block c.
                        // this.actions[this.blockList[c].value] = b;
                        const name = this.parseArg(this, 0, c, null);
                        this.actions[name] = b;
                    }
                }
            }
        }

        this.svgOutput = "";
        this.svgBackground = true;

        for (const turtle of this.activity.turtles.turtleList) {
            turtle.parentFlowQueue = [];
            turtle.unhighlightQueue = [];
            turtle.parameterQueue = [];
        }

        if (this.turtleDelay === 0) {
            // Clear parameters displayed on blocks before running
            // full speed.
            this.activity.blocks.clearParameterBlocks();
        }

        this.onRunTurtle();

        // Make sure that there is atleast one turtle.
        if (this.activity.turtles.getTurtleCount() === 0) {
            this.activity.turtles.addTurtle(null);
        }

        // Mark all turtles as not running.
        for (const turtle in this.activity.turtles.turtleList) {
            this.activity.turtles.getTurtle(turtle).running = false;
        }

        /*
        ===========================================================================
        (2) Execute the stack. (A bit complicated due to lots of corner cases.)
        ===========================================================================
        */
        if (this.activity.turtles.turtleCount() === 0) {
            this.activity.errorMsg(NOACTIONERRORMSG, null, _("start"));
        } else if (startHere != null) {
            // If a block to start from was passed, find its associated
            // turtle, i.e., which turtle should we use?
            let turtle = 0;
            while (
                this.activity.turtles.getTurtle(turtle).inTrash &&
                turtle < this.activity.turtles.getTurtleCount()
            ) {
                ++turtle;
            }

            if (["start", "drum"].includes(this.blockList[startHere].name)) {
                turtle = this.blockList[startHere].value;
            }

            const tur = this.activity.turtles.ithTurtle(turtle);

            tur.queue = [];
            tur.parentFlowQueue = [];
            tur.unhighlightQueue = [];
            tur.parameterQueue = [];

            tur.running = true;
            this.runFromBlock(this, turtle, startHere, 0, env);
        } else if (startBlocks.length > 0) {
            let delayStart = 0;
            const startBlocksLength = startBlocks.length;
            // Look for status and oscilloscope blocks.
            for (let b = 0; b < startBlocksLength; b++) {
                if (
                    ["status", "oscilloscope"].includes(this.blockList[startBlocks[b]].name) &&
                    !this.blockList[startBlocks[b]].trash
                ) {
                    const turtle = 0;
                    const tur = this.activity.turtles.ithTurtle(turtle);

                    tur.queue = [];
                    tur.parentFlowQueue = [];
                    tur.unhighlightQueue = [];
                    tur.parameterQueue = [];

                    tur.running = true;
                    delayStart = 250;
                    this.runFromBlock(this, turtle, startBlocks[b], 0, env);
                }
            }

            setTimeout(() => {
                if (delayStart !== 0) {
                    // Launching status/oscilloscope block would have hidden the
                    // Stop Button so show it again.
                    this.onRunTurtle();
                }

                // If there are multiple start blocks, run them all.
                for (let b = 0; b < startBlocksLength; b++) {
                    if (!["status", "oscilloscope"].includes(this.blockList[startBlocks[b]].name)) {
                        const turtle = this.blockList[startBlocks[b]].value;
                        const tur = this.activity.turtles.ithTurtle(turtle);

                        tur.queue = [];
                        tur.parentFlowQueue = [];
                        tur.unhighlightQueue = [];
                        tur.parameterQueue = [];

                        if (!tur.inTrash) {
                            tur.running = true;
                            this.runFromBlock(this, turtle, startBlocks[b], 0, env);
                        }
                    }
                }
            }, delayStart);
        } else {
            document.body.style.cursor = "default";
        }

        this.activity.refreshCanvas();
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

        const tur = logo.activity.turtles.ithTurtle(turtle);

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
     * Runs a stack of blocks, beginning with block blocklist[blk].
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

        // Sometimes we don't want to unwind the entire queue.
        if (queueStart === undefined) queueStart = 0;

        /*
        ===========================================================================
        (1) Evaluate any arguments (beginning with connection[1]).
        ===========================================================================
        */
        const args = [];
        if (logo.blockList[blk].protoblock.args > 0) {
            for (let i = 1; i <= logo.blockList[blk].protoblock.args; i++) {
                if (logo.blockList[blk].protoblock.dockTypes[i] === "in") {
                    if (logo.blockList[blk].connections[i] === null) {
                        // console.debug("skipping inflow args");
                    } else {
                        args.push(logo.blockList[blk].connections[i]);
                    }
                } else {
                    args.push(
                        logo.parseArg(
                            logo,
                            turtle,
                            logo.blockList[blk].connections[i],
                            blk,
                            receivedArg
                        )
                    );
                }
                if (
                    logo.activity.turtles.ithTurtle(turtle).singer.inNoteBlock.length > 0 &&
                    logo.blockList[blk].connections[i] !== undefined &&
                    logo.blockList[logo.blockList[blk].connections[i]] !== undefined &&
                    logo.blockList[logo.blockList[blk].connections[i]].name === "currentpitch"
                ) {
                    // Re-eval this arg after note block ends to
                    // ensure that the current pitch is uptodate.
                    logo.specialArgs.push([args, logo, turtle, blk, receivedArg, null, isflow]);
                }
            }
        }

        /*
        ===========================================================================
        (2) Run function associated with the block.
        ===========================================================================
        */
        const tur = logo.activity.turtles.ithTurtle(turtle);

        let nextFlow = null;
        if (!logo.blockList[blk].isValueBlock()) {
            // nextFlow remains null for value blocks.

            // All flow blocks have a last connection (nextFlow), but
            // it can be null (i.e., end of a flow).
            if (tur.singer.backward.length > 0) {
                // We only run backwards in the "first generation" children.
                const c =
                    logo.blockList[logo.deps.utils.last(tur.singer.backward)].name === "backward"
                        ? 1
                        : 2;

                if (
                    !logo.activity.blocks.sameGeneration(
                        logo.blockList[logo.deps.utils.last(tur.singer.backward)].connections[c],
                        blk
                    )
                ) {
                    nextFlow = logo.deps.utils.last(logo.blockList[blk].connections);
                } else {
                    nextFlow = logo.blockList[blk].connections[0];
                    if (
                        logo.blockList[nextFlow].name === "action" ||
                        logo.blockList[nextFlow].name === "backward"
                    ) {
                        nextFlow = null;
                    } else {
                        if (
                            !logo.activity.blocks.sameGeneration(
                                logo.blockList[logo.deps.utils.last(tur.singer.backward)]
                                    .connections[c],
                                nextFlow
                            )
                        ) {
                            nextFlow = logo.deps.utils.last(logo.blockList[blk].connections);
                        } else {
                            nextFlow = logo.blockList[blk].connections[0];
                        }
                    }
                }
            } else {
                nextFlow = logo.deps.utils.last(logo.blockList[blk].connections);
            }

            if (nextFlow === -1) {
                nextFlow = null;
            }

            const queueBlock = new Queue(nextFlow, 1, blk, receivedArg);
            if (nextFlow != null) {
                // This could be the last block.
                tur.queue.push(queueBlock);
            }
        }

        // Some flow blocks have childflows, e.g., repeat.
        let childFlow = null;
        let childFlowCount = 0;
        const actionArgs = [];

        // Highlight only the current executing block
        if (logo.activity.blocks.visible) {
            if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                // Unhighlight any previously highlighted block
                if (
                    logo._currentlyHighlightedBlock !== null &&
                    logo._currentlyHighlightedBlock !== blk
                ) {
                    logo.activity.blocks.unhighlight(logo._currentlyHighlightedBlock);
                }
                // Highlight the current block
                logo.activity.blocks.highlight(blk, false);
                logo._currentlyHighlightedBlock = blk;
                // Force stage update so highlight is visible when blocks were shown during execution
                if (logo.activity.stage) {
                    logo.activity.stage.update();
                }
            }
        }

        if (!logo.blockList[blk].isArgBlock()) {
            let res = null;
            // Is it a plugin?
            if (logo.blockList[blk].name in logo.evalFlowDict) {
                logo.pluginReturnValue = null;
                eval(logo.evalFlowDict[logo.blockList[blk].name]);
                // Clamp blocks will return the child flow.
                res = logo.pluginReturnValue;
            } else {
                res = logo.blockList[blk].protoblock.flow(
                    args,
                    logo,
                    turtle,
                    blk,
                    receivedArg,
                    actionArgs,
                    isflow
                );
            }

            if (res) {
                const [cf, cfc, ret] = res;
                if (cf !== undefined) childFlow = cf;
                if (cfc !== undefined) childFlowCount = cfc;
                if (ret) return ret;
            }
        } else {
            if (
                // If it's an arg block, print its value.
                logo.blockList[blk].isArgBlock() ||
                ["anyout", "numberout", "textout", "booleanout"].includes(
                    logo.blockList[blk].protoblock.dockTypes[0]
                )
            ) {
                args.push(logo.parseArg(logo, turtle, blk, logo.receivedArg));

                // Use label prefix for screen dimension blocks to clarify the display is informational
                // Labels wrapped with _() for internationalization
                const blockLabels = {
                    width: _("width"),
                    height: _("height"),
                    rightpos: _("right (screen)"),
                    leftpos: _("left (screen)"),
                    toppos: _("top (screen)"),
                    bottompos: _("bottom (screen)")
                };
                const blockName = logo.blockList[blk].name;
                const label = blockLabels[blockName];

                if (logo.blockList[blk].value == null) {
                    logo.activity.textMsg("null block value");
                } else {
                    const value = logo.blockList[blk].value.toString();
                    const displayText = label ? label + ": " + value : value;
                    logo.activity.textMsg(displayText);
                }
            } else {
                logo.activity.errorMsg(
                    "I do not know how to " + logo.blockList[blk].name + ".",
                    blk
                );
            }

            logo.stopTurtle = true;
        }

        /*
        ===========================================================================
        (3) Queue block below the current block.
        ===========================================================================
        */
        // Is the block in a queued clamp?
        if (blk !== logo._ignoringBlock) {
            if (blk in tur.endOfClampSignals) {
                while (tur.endOfClampSignals[blk].length > 0) {
                    const signal = tur.endOfClampSignals[blk].pop();
                    if (signal != null) {
                        logo.activity.stage.dispatchEvent(signal);
                    }
                }
            }
        } else {
            // console.debug("Ignoring block on overlapped start.");
        }

        if (logo.statusMatrix && logo.statusMatrix.isOpen && !logo.inStatusMatrix) {
            logo.statusMatrix.updateAll();
        }

        // If there is a child flow, queue it.
        if (childFlow != null) {
            let queueBlock;
            if (logo.blockList[blk].name === "doArg" || logo.blockList[blk].name === "nameddoArg") {
                queueBlock = new Queue(childFlow, childFlowCount, blk, actionArgs);
            } else {
                queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
            }
            // We need to keep track of the parent block to the child
            // flow so we can unhighlight the parent block after the
            // child flow completes.
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

        // Run the last flow in the queue.
        if (tur.queue.length > queueStart) {
            nextBlock = logo.deps.utils.last(tur.queue).blk;
            parentBlk = logo.deps.utils.last(tur.queue).parentBlk;
            passArg = logo.deps.utils.last(tur.queue).args;

            // Since the forever block starts at -1, it will never === 1.
            if (logo.deps.utils.last(tur.queue).count === 1) {
                // Finished child so pop it off the queue.
                tur.queue.pop();
            } else {
                // Decrement the counter for repeating the flow.
                logo.deps.utils.last(tur.queue).count -= 1;
            }
        }

        if (nextBlock != null) {
            if (parentBlk !== blk) {
                // The wait block waits _waitTimes longer than other
                // blocks before it is unhighlighted.
                if (logo.turtleDelay === TURTLESTEP) {
                    logo._unhighlightStepQueue[turtle] = blk;
                } else {
                    if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                        const unhighlightDelay = Math.max(
                            logo.turtleDelay + tur.waitTime,
                            MIN_HIGHLIGHT_DURATION_MS
                        );
                        setTimeout(() => {
                            if (logo.activity.blocks.visible) {
                                logo.activity.blocks.unhighlight(blk);
                                // Clear the currently highlighted block if it was this one
                                if (logo._currentlyHighlightedBlock === blk) {
                                    logo._currentlyHighlightedBlock = null;
                                }
                                if (logo.activity.stage) {
                                    logo.activity.stage.update();
                                }
                            }
                        }, unhighlightDelay);
                    }
                }
            }

            if (
                (tur.singer.backward.length > 0 && logo.blockList[blk].connections[0] == null) ||
                (tur.singer.backward.length === 0 &&
                    logo.deps.utils.last(logo.blockList[blk].connections) == null)
            ) {
                if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                    // If we are at the end of the child flow, queue
                    // the unhighlighting of the parent block to the
                    // flow.
                    if (tur.unhighlightQueue === undefined) {
                        // console.debug("cannot find highlight queue for turtle " + turtle);
                    } else if (
                        tur.parentFlowQueue.length > 0 &&
                        tur.queue.length > 0 &&
                        logo.deps.utils.last(tur.queue).parentBlk !==
                            logo.deps.utils.last(tur.parentFlowQueue)
                    ) {
                        tur.unhighlightQueue.push(logo.deps.utils.last(tur.parentFlowQueue));
                    } else if (tur.unhighlightQueue.length > 0) {
                        // The child flow is finally complete, so unhighlight.
                        const unhighlightDelay = Math.max(
                            logo.turtleDelay,
                            MIN_HIGHLIGHT_DURATION_MS
                        );
                        setTimeout(() => {
                            if (logo.activity.blocks.visible) {
                                const unhighlightBlock = tur.unhighlightQueue.pop();
                                logo.activity.blocks.unhighlight(unhighlightBlock);
                                // Clear the currently highlighted block if it was this one
                                if (logo._currentlyHighlightedBlock === unhighlightBlock) {
                                    logo._currentlyHighlightedBlock = null;
                                }
                                if (logo.activity.stage) {
                                    logo.activity.stage.update();
                                }
                            } else {
                                tur.unhighlightQueue.pop();
                            }
                        }, unhighlightDelay);
                    }
                }
            }

            // We don't update parameter blocks when running full speed.
            if (logo.turtleDelay !== 0) {
                for (const pblk in tur.parameterQueue) {
                    logo.activity.blocks.updateParameterBlock(
                        logo,
                        turtle,
                        tur.parameterQueue[pblk]
                    );
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
                // Make sure any unissued signals are dispatched.
                for (const b in tur.endOfClampSignals) {
                    const signalsLength = tur.endOfClampSignals[b].length;
                    for (let i = 0; i < signalsLength; i++) {
                        if (tur.endOfClampSignals[b][i] != null) {
                            if (
                                tur.butNotThese[b] == null ||
                                tur.butNotThese[b].indexOf(i) === -1
                            ) {
                                if (tur.singer.runningFromEvent) {
                                    // console.log("RUNNING FROM EVENT");
                                } else {
                                    logo.activity.stage.dispatchEvent(tur.endOfClampSignals[b][i]);
                                }
                            }
                        }
                    }
                }

                // Make sure SVG path is closed.
                logo.activity.turtles.getTurtle(turtle).painter.closeSVG();

                // Mark the turtle as not running.
                logo.activity.turtles.getTurtle(turtle).running = false;
                if (!logo.activity.turtles.running() && queueStart === 0) {
                    logo.onStopTurtle();
                }
            } else {
                logo.activity.turtles.getTurtle(turtle).running = false;
            }

            const comp = logo.activity.turtles.getTurtle(turtle).companionTurtle;
            if (comp) {
                logo.activity.turtles.getTurtle(comp).running = false;
                const interval = logo.activity.turtles.getTurtle(comp).interval;
                if (interval) clearInterval(interval);
            }
            // Because flow can come from calc blocks, we are not
            // ensured that the turtle is really finished running
            // yet. Hence the timeout.
            const __checkCompletionState = () => {
                if (
                    !logo.activity.turtles.running() &&
                    queueStart === 0 &&
                    tur.singer.justCounting.length === 0
                ) {
                    if (logo.runningLilypond) {
                        if (logo.collectingStats) {
                            // console.debug("stats collection completed");
                            logo.projectStats = logo.deps.utils.getStatsFromNotation(logo.activity);
                            logo.activity.statsWindow.displayInfo(logo.projectStats);
                        } else {
                            // console.debug("saving lilypond output:");
                            logo.activity.save.afterSaveLilypond();
                        }
                        logo.collectingStats = false;
                        logo.runningLilypond = false;
                    } else if (logo.runningAbc) {
                        // console.debug("saving abc output:");
                        logo.activity.save.afterSaveAbc();
                        logo.runningAbc = false;
                    } else if (logo.runningMxml) {
                        // console.log("saving mxml output");
                        logo.activity.save.afterSaveMxml();
                        logo.runningMxml = false;
                    } else if (logo.runningMIDI) {
                        logo.activity.save.afterSaveMIDI();
                        logo.runningMIDI = false;
                    } else if (tur.singer.suppressOutput) {
                        // console.debug("finishing compiling");
                        if (!logo.recording) {
                            logo.activity.errorMsg(_("Playback is ready."));
                        }
                    } else {
                        // Record notation data into buffer for later save (Issue #2330)
                        // This allows saving Lilypond/ABC from interactive sessions
                        if (logo.notationOutput && logo.notationOutput.length > 0) {
                            logo.recordingBuffer.hasData = true;
                            logo.recordingBuffer.notationOutput = logo.notationOutput;
                            logo.recordingBuffer.notationNotes = JSON.parse(
                                JSON.stringify(logo.notationNotes)
                            );
                            // Copy notation staging data
                            logo.recordingBuffer.notationStaging = {};
                            logo.recordingBuffer.notationDrumStaging = {};
                            for (let t = 0; t < logo.activity.turtles.getTurtleCount(); t++) {
                                if (logo.notation.notationStaging[t]) {
                                    logo.recordingBuffer.notationStaging[t] = [
                                        ...logo.notation.notationStaging[t]
                                    ];
                                }
                                if (logo.notation.notationDrumStaging[t]) {
                                    logo.recordingBuffer.notationDrumStaging[t] = [
                                        ...logo.notation.notationDrumStaging[t]
                                    ];
                                }
                            }
                        }
                    }

                    // Give the last note time to play.
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
                        }
                    }, 1000);
                }
            };

            setTimeout(__checkCompletionState, 100);
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
        // they are run progressively over the course of the note duration.

        const tur = this.activity.turtles.ithTurtle(turtle);

        if (Object.keys(tur.singer.embeddedGraphics).length === 0) return;

        if (!(blk in tur.singer.embeddedGraphics)) return;

        if (tur.singer.embeddedGraphics[blk].length === 0) return;

        // If the previous note's graphics are not complete, add a
        // slight delay before drawing any new graphics.
        if (!tur.embeddedGraphicsFinished) {
            delay += 0.1;
        }

        tur.embeddedGraphicsFinished = false;

        const suppressOutput = tur.singer.suppressOutput;

        const __pen = (turtle, name, b, timeout) => {
            let arg;
            switch (name) {
                case "penup":
                case "pendown":
                    break;
                default:
                    arg = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    break;
            }
            const _penSwitch = name => {
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

        const __right = (turtle, b, waitTime, stepTime, sign) => {
            const arg =
                this.parseArg(this, turtle, this.blockList[b].connections[1], b, this.receivedArg) *
                sign;
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                tur.painter.doRight(arg);
                tur.painter.penState = savedPenState;
            } else {
                for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                    const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                    const deltaArg = arg / (NOTEDIV / tur.singer.dispatchFactor);
                    setTimeout(() => tur.painter.doRight(deltaArg), deltaTime);
                }
            }
        };

        const __setheading = (turtle, b, timeout) => {
            if (suppressOutput) {
                const arg = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[1],
                    b,
                    this.receivedArg
                );
                tur.painter.doSetHeading(arg);
            } else {
                setTimeout(() => {
                    const arg = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    tur.painter.doSetHeading(arg);
                }, timeout);
            }
        };

        const __forward = (turtle, b, waitTime, stepTime, sign) => {
            const arg =
                this.parseArg(this, turtle, this.blockList[b].connections[1], b, this.receivedArg) *
                sign;
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                tur.painter.doForward(arg);
                tur.painter.penState = savedPenState;
            } else {
                for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                    const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                    const deltaArg = arg / (NOTEDIV / tur.singer.dispatchFactor);
                    if (t === 0) {
                        setTimeout(() => tur.painter.doForward(deltaArg, "first"), deltaTime);
                    } else if (t === Math.ceil(NOTEDIV / tur.singer.dispatchFactor) - 1) {
                        setTimeout(() => tur.painter.doForward(deltaArg, "last"), deltaTime);
                    } else {
                        setTimeout(() => tur.painter.doForward(deltaArg, "middle"), deltaTime);
                    }
                }
            }
        };

        const __scrollxy = (turtle, b, timeout) => {
            if (suppressOutput) {
                const arg1 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[1],
                    b,
                    this.receivedArg
                );
                const arg2 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[2],
                    b,
                    this.receivedArg
                );
                tur.painter.doScrollXY(arg1, arg2);
            } else {
                setTimeout(() => {
                    const arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    const arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    tur.painter.doScrollXY(arg1, arg2);
                }, timeout);
            }
        };

        const __setxy = (turtle, b, timeout) => {
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                const arg1 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[1],
                    b,
                    this.receivedArg
                );
                const arg2 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[2],
                    b,
                    this.receivedArg
                );
                tur.painter.penState = false;
                tur.painter.doSetXY(arg1, arg2);
                tur.painter.penState = savedPenState;
            } else {
                setTimeout(() => {
                    const arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    const arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    tur.painter.doSetXY(arg1, arg2);
                }, timeout);
            }
        };

        const __show = (turtle, b, timeout) => {
            if (suppressOutput) return;
            const arg1 = this.parseArg(
                this,
                turtle,
                this.blockList[b].connections[1],
                b,
                this.receivedArg
            );
            const arg2 = this.parseArg(
                this,
                turtle,
                this.blockList[b].connections[2],
                b,
                this.receivedArg
            );
            setTimeout(() => this.processShow(turtle, null, arg1, arg2), timeout);
        };

        const __speak = (turtle, b, timeout) => {
            if (suppressOutput) return;
            const arg = this.parseArg(
                this,
                turtle,
                this.blockList[b].connections[1],
                b,
                this.receivedArg
            );
            setTimeout(() => this.processSpeak(arg), timeout);
        };

        const __print = (turtle, b, timeout) => {
            if (suppressOutput) return;
            const arg = this.parseArg(
                this,
                turtle,
                this.blockList[b].connections[1],
                b,
                this.receivedArg
            );
            if (arg === undefined) return;
            setTimeout(() => this.activity.textMsg(arg.toString()), timeout);
        };

        const __arc = (turtle, b, waitTime, stepTime) => {
            const arg1 = this.parseArg(
                this,
                turtle,
                this.blockList[b].connections[1],
                b,
                this.receivedArg
            );
            const arg2 = this.parseArg(
                this,
                turtle,
                this.blockList[b].connections[2],
                b,
                this.receivedArg
            );
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                tur.painter.penState = false;
                tur.painter.doArc(arg1, arg2);
                tur.painter.penState = savedPenState;
            } else {
                for (let t = 0; t < NOTEDIV / tur.singer.dispatchFactor; t++) {
                    const deltaTime = waitTime + t * stepTime * tur.singer.dispatchFactor;
                    const deltaArg = arg1 / (NOTEDIV / tur.singer.dispatchFactor);
                    setTimeout(() => tur.painter.doArc(deltaArg, arg2), deltaTime);
                }
            }
        };

        const __cp1 = (turtle, b, timeout) => {
            if (suppressOutput) {
                const arg1 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[1],
                    b,
                    this.receivedArg
                );
                const arg2 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[2],
                    b,
                    this.receivedArg
                );
                tur.painter.cp1x = arg1;
                tur.painter.cp1y = arg2;
            } else {
                setTimeout(() => {
                    const arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    const arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    tur.painter.cp1x = arg1;
                    tur.painter.cp1y = arg2;
                }, timeout);
            }
        };

        const __cp2 = (turtle, b, timeout) => {
            if (suppressOutput) {
                const arg1 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[1],
                    b,
                    this.receivedArg
                );
                const arg2 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[2],
                    b,
                    this.receivedArg
                );
                tur.painter.cp2x = arg1;
                tur.painter.cp2y = arg2;
            } else {
                setTimeout(() => {
                    const arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    const arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    tur.painter.cp2x = arg1;
                    tur.painter.cp2y = arg2;
                }, timeout);
            }
        };

        const __bezier = (turtle, b, timeout) => {
            if (suppressOutput) {
                const savedPenState = tur.painter.penState;
                const arg1 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[1],
                    b,
                    this.receivedArg
                );
                const arg2 = this.parseArg(
                    this,
                    turtle,
                    this.blockList[b].connections[2],
                    b,
                    this.receivedArg
                );
                tur.painter.penState = false;
                tur.painter.doBezier(arg1, arg2);
                tur.painter.penState = savedPenState;
            } else {
                setTimeout(() => {
                    const arg1 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[1],
                        b,
                        this.receivedArg
                    );
                    const arg2 = this.parseArg(
                        this,
                        turtle,
                        this.blockList[b].connections[2],
                        b,
                        this.receivedArg
                    );
                    tur.painter.doBezier(arg1, arg2);
                }, timeout);
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

        const embeddedGraphicsLength = tur.singer.embeddedGraphics[blk].length;
        let extendedGraphicsCounter = 0;
        for (let i = 0; i < embeddedGraphicsLength; i++) {
            const b = tur.singer.embeddedGraphics[blk][i];
            switch (this.blockList[b].name) {
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

        // Cheat by 0.5% so that the mouse has time to complete its work.
        let stepTime = ((beatValue - delay) * 995) / NOTEDIV;
        if (stepTime < 0) stepTime = 0;

        // We do each graphics action sequentially, so we need to
        // divide stepTime by the length of the embedded graphics
        // array.
        if (extendedGraphicsCounter > 0) {
            stepTime = stepTime / extendedGraphicsCounter;
        }

        let waitTime = delay * 1000;

        // Update the turtle graphics every 50ms within a note.
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

        for (let i = 0; i < embeddedGraphicsLength; i++) {
            const b = tur.singer.embeddedGraphics[blk][i];
            const name = this.blockList[b].name;

            switch (name) {
                case "setcolor":
                case "sethue":
                case "setshade":
                case "settranslucency":
                case "setgrey":
                case "setpensize":
                    __pen(turtle, name, b, waitTime);
                    break;

                case "penup":
                case "pendown":
                    if (!suppressOutput) {
                        __pen(turtle, name, null, waitTime);
                    }
                    break;

                case "clear":
                    __clear();
                    break;

                case "fill":
                    __fill(turtle, waitTime);
                    break;

                case "hollowline":
                    __hollowline(turtle, waitTime);
                    break;

                case "controlpoint1":
                    __cp1(turtle, b, waitTime);
                    break;

                case "controlpoint2":
                    __cp2(turtle, b, waitTime);
                    break;

                case "bezier":
                    /**
                     * @todo Is there a reasonable way to break the bezier
                     * curve up into small steps?
                     */
                    __bezier(turtle, b, waitTime);
                    break;

                case "setheading":
                    __setheading(turtle, b, waitTime);
                    break;

                case "right":
                    __right(turtle, b, waitTime, stepTime, 1);
                    waitTime += NOTEDIV * stepTime;
                    break;

                case "left":
                    __right(turtle, b, waitTime, stepTime, -1);
                    waitTime += NOTEDIV * stepTime;
                    break;

                case "forward":
                    __forward(turtle, b, waitTime, stepTime, 1);
                    waitTime += NOTEDIV * stepTime;
                    break;

                case "back":
                    __forward(turtle, b, waitTime, stepTime, -1);
                    waitTime += NOTEDIV * stepTime;
                    break;

                case "setxy":
                    __setxy(turtle, b, waitTime);
                    break;

                case "scrollxy":
                    __scrollxy(turtle, b, waitTime);
                    break;

                case "show":
                    __show(turtle, b, waitTime);
                    break;

                case "speak":
                    __speak(turtle, b, waitTime);
                    break;

                case "print":
                    __print(turtle, b, waitTime);
                    break;

                case "arc":
                    __arc(turtle, b, waitTime, stepTime);
                    waitTime += NOTEDIV * stepTime;
                    break;

                default:
                    break;
            }
        }

        // Mark the end time of this note's graphics operations.
        await this.deps.utils.delayExecution(beatValue * 1000);
        tur.embeddedGraphicsFinished = true;
    }
}

// Export Logo
if (typeof define === "function" && define.amd) {
    define([], function () {
        return Logo;
    });
}

if (typeof module !== "undefined" && module.exports) {
    let exportsObj = { Logo, Queue };

    // In Node.js / Jest environment, we need to include constants
    if (typeof DEFAULTVOLUME === "undefined") {
        try {
            const constants = require("./logoconstants");
            Object.assign(global, constants);
            Object.assign(exportsObj, constants);
        } catch (e) {
            // Ignore
        }
    } else {
        // If they are already global (e.g. via logoconstants.js loaded before)
        exportsObj = Object.assign(exportsObj, {
            DEFAULTVOLUME,
            PREVIEWVOLUME,
            DEFAULTDELAY,
            OSCVOLUMEADJUSTMENT,
            TONEBPM,
            TARGETBPM,
            TURTLESTEP,
            NOTEDIV,
            NOMICERRORMSG,
            NANERRORMSG,
            NOSTRINGERRORMSG,
            NOBOXERRORMSG,
            NOACTIONERRORMSG,
            NOINPUTERRORMSG,
            NOSQRTERRORMSG,
            ZERODIVIDEERRORMSG,
            EMPTYHEAPERRORMSG,
            POSNUMBER,
            NOTATIONNOTE,
            NOTATIONDURATION,
            NOTATIONDOTCOUNT,
            NOTATIONTUPLETVALUE,
            NOTATIONROUNDDOWN,
            NOTATIONINSIDECHORD,
            NOTATIONSTACCATO
        });
    }

    module.exports = exportsObj;
}

if (typeof window !== "undefined") {
    window.Logo = Logo;
    window.Queue = Queue;
}
