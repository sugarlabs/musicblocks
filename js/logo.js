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

   Notation, Synth, instruments, instrumentsFilters,
   instrumentsEffects, Singer, Tone, CAMERAVALUE, doUseCamera,
   VIDEOVALUE, last, getIntervalDirection, getIntervalNumber,
   mixedNumber, rationalToFraction, doStopVideoCam, StatusMatrix,
   getStatsFromNotation, delayExecution, DEFAULTVOICE, performanceTracker,
   requirejs, define, DEFAULTVOLUME, PREVIEWVOLUME, DEFAULTDELAY,
   OSCVOLUMEADJUSTMENT, TONEBPM, TARGETBPM, TURTLESTEP, NOTEDIV,
   MIN_HIGHLIGHT_DURATION_MS,
   NOMICERRORMSG, NANERRORMSG, NOSTRINGERRORMSG, NOBOXERRORMSG,
   NOACTIONERRORMSG, NOINPUTERRORMSG, NOSQRTERRORMSG, ZERODIVIDEERRORMSG,
   EMPTYHEAPERRORMSG, INVALIDPITCH, POSNUMBER, NOTATIONNOTE, NOTATIONDURATION,
   NOTATIONDOTCOUNT, NOTATIONTUPLETVALUE, NOTATIONROUNDDOWN,
   NOTATIONINSIDECHORD, NOTATIONSTACCATO, ManagedTimer,
   EmbeddedGraphicsScheduler
 */

/*
   exported

   Queue, Logo, LogoDependencies
 */

// Constants moved to js/logoconstants.js to resolve circular dependency

/**
 * Resolves the performance instrumentation module.
 *
 * `performanceTracker` is loaded on demand (see `runLogoCommands`), so it is
 * absent for the whole of a normal run. Every instrumentation call site goes
 * through this accessor rather than repeating the `typeof` guard.
 *
 * @returns {Object|null} The tracker, or null when it has not been loaded.
 */
const getPerformanceTracker = () =>
    typeof performanceTracker === "undefined" ? null : performanceTracker;

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
     * @param {Object|LogoDependencies} activityOrDeps - Either a LogoDependencies object
     *     (preferred) or a legacy Activity object. When an Activity is passed it is
     *     converted automatically via {@link LogoDependencies.fromActivity}.
     *
     * @example
     * // Activity pattern (backward-compatible)
     * const logo = new Logo(activity);
     *
     * @example
     * // Explicit dependency pattern
     * const deps = LogoDependencies.fromActivity(activity);
     * const logo = new Logo(deps);
     */
    constructor(activityOrDeps) {
        // `errorHandler` is the single property that distinguishes a
        // LogoDependencies container from a legacy Activity object (which uses
        // `errorMsg` instead). instanceof is checked first as the strongest
        // signal; the typeof clause is a fallback for plain objects that satisfy
        // the shape but are not formal instances (e.g. after jest.resetModules()
        // clears module identity). When the project migrates to ES modules the
        // require fallback and typeof clause can be removed.
        const LD =
            typeof LogoDependencies !== "undefined"
                ? LogoDependencies
                : require("./LogoDependencies");
        const isExplicitDeps =
            activityOrDeps instanceof LD ||
            (activityOrDeps !== null &&
                activityOrDeps !== undefined &&
                typeof activityOrDeps.errorHandler === "function");

        if (isExplicitDeps) {
            // Explicit dependency container: use directly and build a
            // compatibility facade so callers that expect an activity object
            // still work (Notation constructor, plugins, getStatsFromNotation).

            this.deps = activityOrDeps;
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
                refreshCanvas: () => deps.refreshCanvas(),
                textMsg: msg => deps.textMsg(msg),
                save: deps.save,
                statsWindow: deps.statsWindow,
                logo: this
            };
        } else {
            // Activity pattern: preserve the original reference for backward
            // compatibility and derive deps through the factory.
            this.activity = activityOrDeps;
            const LD =
                typeof LogoDependencies !== "undefined"
                    ? LogoDependencies
                    : require("./LogoDependencies");
            this.deps = LD.fromActivity(activityOrDeps);
        }

        // Bind commonly-used dependencies locally for readability
        this.blocks = this.deps.blocks;
        this.turtles = this.deps.turtles;
        this.stage = this.deps.stage;

        this.blockList = this.blocks.blockList;
        this._onStopTurtle = this.deps.callbacks.onStopTurtle;
        this._onRunTurtle = this.deps.callbacks.onRunTurtle;

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
        this.sample = null;
        this.aiMusic = null;
        this.aiDebugger = null;

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
        this.setCameraID = this.setCameraID.bind(this);

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
        this._synthsInitialized = false;

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

        this._syncCounter = 0;
        this._YIELD_AFTER_SYNC_RUNS = 1000;
        this._iterationBudget = this._MAX_ITERATIONS + 1;
        this._MAX_ITERATIONS = 1000000;

        // When running in step-by-step mode, the next command to run
        // is queued here.
        this.stepQueue = {};
        this._unhighlightStepQueue = {};

        this.svgOutput = "";
        this.svgBackground = true;

        this.mic = null;
        this.volumeAnalyser = null;
        this.pitchAnalyser = null;

        // Centralized timer management for zombie-timer prevention.
        // All setTimeout/setInterval calls in the execution engine are routed
        // through this manager, allowing doStopTurtles() to cancel every
        // pending timer in one sweep. This fixes ghost turtle movements,
        // phantom sounds, and stale block highlighting that occur when the
        // user presses Stop while animations are in-flight.
        if (typeof ManagedTimer !== "undefined") {
            this._timerManager = new ManagedTimer();
        } else {
            // Node.js / Jest environment — require the module
            try {
                const ManagedTimerCtor = require("./utils/ManagedTimer");
                this._timerManager = new ManagedTimerCtor();
            } catch (e) {
                // Fallback: create a minimal shim so the engine still works
                this._timerManager = {
                    _activeTimers: new Set(),
                    _activeIntervals: new Set(),
                    totalCreated: 0,
                    totalCancelled: 0,
                    totalFired: 0,
                    totalSuppressed: 0,
                    get activeCount() {
                        return this._activeTimers.size + this._activeIntervals.size;
                    },
                    setTimeout(cb, delay) {
                        return setTimeout(cb, delay);
                    },
                    setGuardedTimeout(cb, delay, guard) {
                        return setTimeout(() => {
                            if (!guard()) cb();
                        }, delay);
                    },
                    clearAll() {
                        return 0;
                    },
                    getStats() {
                        return {
                            active: 0,
                            created: 0,
                            cancelled: 0,
                            fired: 0,
                            suppressed: 0
                        };
                    }
                };
            }
        }

        this._graphicsScheduler = new EmbeddedGraphicsScheduler(this);
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

    /**
     * Access the managed timer instance for diagnostics or external cancellation.
     * @returns {ManagedTimer} The timer manager used by the execution engine.
     */
    get timerManager() {
        return this._timerManager;
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
                    // eslint-disable-next-line eqeqeq
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
        if (this._synthsInitialized) {
            // Ensure any newly added turtles (e.g., companion turtles) are
            // initialized without disrupting existing turtles' runtime state.
            for (const turtle in this.turtles.turtleList) {
                if (turtle in this.deps.instruments) {
                    continue;
                }

                const tur = this.turtles.ithTurtle(turtle);
                this.deps.instruments[turtle] = {};
                this.deps.instrumentsFilters[turtle] = {};
                this.deps.instrumentsEffects[turtle] = {};

                if (!(DEFAULTVOICE in this.deps.instruments[turtle])) {
                    this.synth.createDefaultSynth(turtle);
                }

                for (const instrumentName in this.deps.instruments[0]) {
                    if (!(instrumentName in this.deps.instruments[turtle])) {
                        this.synth.loadSynth(turtle, instrumentName);

                        if (instrumentName in this.deps.instrumentsFilters[0]) {
                            this.deps.instrumentsFilters[turtle][instrumentName] =
                                this.deps.instrumentsFilters[0][instrumentName];
                        }

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

                for (const synth in tur.singer.synthVolume) {
                    this.deps.Singer.setSynthVolume(this, turtle, synth, DEFAULTVOLUME);
                }
            }
            return;
        }
        this.synth.newTone();

        for (const turtle in this.turtles.turtleList) {
            const tur = this.turtles.ithTurtle(turtle);

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

        for (const turtle in this.turtles.turtleList) {
            // Cache ithTurtle result to avoid redundant function calls in inner loop
            const tur = this.turtles.ithTurtle(turtle);
            for (const synth in tur.singer.synthVolume) {
                this.deps.Singer.setSynthVolume(this, turtle, synth, DEFAULTVOLUME);
            }
        }
        this._synthsInitialized = true;
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

        this.deps.Singer.setMasterVolume(this, DEFAULTVOLUME);
        for (const t in this.turtles.turtleList) {
            // Cache ithTurtle result to avoid redundant function calls in inner loop
            const tur = this.turtles.ithTurtle(t);
            for (const synth in tur.singer.synthVolume) {
                this.deps.Singer.setSynthVolume(this, t, synth, DEFAULTVOLUME);
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
            this.deps.errorHandler(NOMICERRORMSG);
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
        const requiredTurtle = this.turtles.getTurtle(turtle);
        if (typeof arg1 === "string") {
            const len = arg1.length;
            if (len === 14 && arg1.substr(0, 14) === CAMERAVALUE) {
                this.deps.utils.doUseCamera(
                    [arg0],
                    this.turtles,
                    turtle,
                    false,
                    this.cameraID,
                    this.setCameraID,
                    (msg, blk) => this.deps.errorHandler(msg, blk)
                );
            } else if (len === 13 && arg1.substr(0, 13) === VIDEOVALUE) {
                this.deps.utils.doUseCamera(
                    [arg0],
                    this.turtles,
                    turtle,
                    true,
                    this.cameraID,
                    this.setCameraID,
                    (msg, blk) => this.deps.errorHandler(msg, blk)
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
                this.deps.errorHandler(_("You must select a file."));
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
            const c =
                this.blockList[this.deps.utils.last(tur.singer.backward)].name === "backward"
                    ? 1
                    : 2;
            if (
                this.blocks.sameGeneration(
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
     * Evaluates a block connection and returns its resolved value for use by
     * the calling block.
     *
     * Resolution order:
     *   1. If `proto.arg` is a function, delegate directly (fastest path).
     *   2. `intervalname` blocks: update direction state and return the interval
     *      number as a special case.
     *   3. Value blocks: return `currentBlock.value`.
     *   4. Output blocks (`anyout`, `numberout`, `textout`, `booleanout`): evaluate
     *      by name — built-in cases (`dectofrac`, `hue`, `returnValue`) or plugin
     *      lookup via `evalArgDict`.
     *   5. All other blocks: return the block index `blk` as a pass-through.
     *
     * @param {Logo} logo - The running Logo instance.
     * @param {number} turtle - Index of the active turtle.
     * @param {number|null} blk - Index of the block to evaluate. A null value
     *     triggers a NOINPUT error on `parentBlk`.
     * @param {number|null} parentBlk - Index of the calling block; used only
     *     for error reporting when `blk` is null.
     * @param {*} receivedArg - Argument forwarded from an enclosing `doArg` /
     *     `namedDoArg` call; passed through to `proto.arg` when applicable.
     * @returns {*} The resolved value, or the block index `blk` for non-output
     *     blocks.
     */
    parseArg(logo, turtle, blk, parentBlk, receivedArg) {
        const tur = logo.turtles.ithTurtle(turtle);

        // eslint-disable-next-line eqeqeq
        if (blk == null) {
            logo.deps.errorHandler(NOINPUTERRORMSG, parentBlk);
            return null;
        }

        const currentBlock = logo.blockList[blk];
        const proto = currentBlock.protoblock;

        // Retrieve the value of a block
        if (proto.parameter) {
            if (!tur.parameterQueue.includes(blk)) {
                tur.parameterQueue.push(blk);
            }
        }

        if (typeof proto.arg === "function") {
            return (currentBlock.value = proto.arg(logo, turtle, blk, receivedArg));
        }

        const blockName = currentBlock.name;
        const utils = logo.deps.utils;

        if (blockName === "intervalname") {
            if (typeof currentBlock.value === "string") {
                tur.singer.noteDirection = utils.getIntervalDirection(currentBlock.value);
                return utils.getIntervalNumber(currentBlock.value);
            }
            return 0;
        }

        if (currentBlock.isValueBlock()) {
            return currentBlock.value;
        }

        const firstDockType = proto.dockTypes[0];
        if (
            firstDockType === "anyout" ||
            firstDockType === "numberout" ||
            firstDockType === "textout" ||
            firstDockType === "booleanout"
        ) {
            switch (blockName) {
                case "dectofrac":
                    if (
                        logo.inStatusMatrix &&
                        logo.blockList[currentBlock.connections[0]].name === "print"
                    ) {
                        logo.statusFields.push([blk, "dectofrac"]);
                    } else {
                        const cblk = currentBlock.connections[1];
                        // eslint-disable-next-line eqeqeq
                        if (cblk == null) {
                            logo.deps.errorHandler(NOINPUTERRORMSG, blk);
                            currentBlock.value = 0;
                        } else {
                            const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
                            if (typeof a === "number") {
                                currentBlock.value =
                                    a < 0 ? "-" + utils.mixedNumber(-a) : utils.mixedNumber(a);
                            } else {
                                logo.deps.errorHandler(NANERRORMSG, blk);
                                currentBlock.value = 0;
                            }
                        }
                    }
                    break;

                case "hue":
                    if (
                        logo.inStatusMatrix &&
                        logo.blockList[currentBlock.connections[0]].name === "print"
                    ) {
                        logo.statusFields.push([blk, "color"]);
                    } else {
                        currentBlock.value = tur.painter.color;
                    }
                    break;

                /** @deprecated */
                case "returnValue":
                    if (logo.returns[turtle].length > 0) {
                        currentBlock.value = logo.returns[turtle].pop();
                    } else {
                        currentBlock.value = 0;
                    }
                    break;

                default:
                    // Is it a plugin?
                    if (blockName in logo.evalArgDict) {
                        this.safePluginExecute(
                            logo.evalArgDict[blockName],
                            logo,
                            turtle,
                            blk,
                            parentBlk,
                            receivedArg,
                            tur
                        );
                    } else {
                        console.error("I do not know how to " + blockName);
                    }
                    break;
            }

            return currentBlock.value;
        }

        return blk;
    }

    /**
     * Adds a note event to the Lilypond notation buffer, splitting it across
     * measure boundaries when necessary.
     *
     * When the note's duration carries it past the end of the current measure,
     * the note is split: the portion that fits within the current measure (and
     * any fully-spanned intermediate measures) is written first with ties,
     * followed by the overflow into the next measure.  Recursion stops when
     * `split` is false, which all recursive calls pass explicitly.
     *
     * @param {string[]} note - Pitch names (e.g. `["G4"]`), or `["R"]` for a
     *     rest.
     * @param {number} duration - Reciprocal note duration (e.g. 4 for a
     *     quarter note, 8 for an eighth note).
     * @param {number} turtle - Index of the active turtle.
     * @param {boolean} insideChord - Whether this note is part of a chord.
     * @param {string[]} drum - Drum patch names (may be empty).
     * @param {boolean} [split=true] - Allow measure-boundary splitting. Pass
     *     `false` to write the note directly without further splitting.
     * @returns {void}
     */
    updateNotation(note, duration, turtle, insideChord, drum, split) {
        // Note: At this point, the note of duration "duration" has
        // already been added to notesPlayed

        // Don't split the note if we are already splitting the note
        // eslint-disable-next-line eqeqeq
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
            // overflowTime: the portion of the note that extends past all
            // measure boundaries.
            const overflowTime = durationTime - timeLeftInMeasure;
            // partialTime: starts as the time remaining in the current measure;
            // the while-loop below strips any whole measures to find the residual.
            let partialTime = timeLeftInMeasure;
            // measureDuration: the total duration of one full measure.
            const measureDuration = tur.singer.beatsPerMeasure / tur.singer.noteValuePerBeat;
            const obj = this.deps.utils.rationalToFraction(overflowTime);

            if (partialTime > 0) {
                // Count how many full measures this note spans beyond the first.
                let i = 0;
                while (partialTime > measureDuration) {
                    ++i;
                    partialTime -= measureDuration;
                }

                // Write the portion that fits within the current partial measure.
                let obj2 = this.deps.utils.rationalToFraction(partialTime);
                if (obj2[0] !== 0) {
                    this.updateNotation(note, obj2[1] / obj2[0], turtle, insideChord, drum, false);
                }
                if (i > 0 || obj[0] > 0) {
                    if (note[0] !== "R") {
                        // Don't tie rests
                        this.notation.notationInsertTie(turtle);
                        this.notation.notationDrumStaging[turtle].push("tie");
                    }
                    obj2 = this.deps.utils.rationalToFraction(1 / measureDuration);
                }

                // Write one full measure's worth for each intermediate measure.
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

            // Write the overflow portion that extends into the next measure.
            if (obj[0] > 0) {
                this.updateNotation(note, obj[1] / obj[0], turtle, insideChord, drum, false);
            }
        } else {
            // .. otherwise proceed as normal
            this.notation.doUpdateNotation(...arguments);
        }
    }

    /**
     * Records a note event into the per-turtle MIDI buffer for later export.
     *
     * @param {string[]} note - Array of pitch names.
     * @param {string[]|null} drum - Drum patch names; only the first element is
     *     used. Pass a falsy value for non-drum notes.
     * @param {number} duration - Note duration in beats.
     * @param {number} turtle - Index of the active turtle.
     * @param {number} bpm - Tempo in beats per minute at the time of the note.
     * @param {string} instrument - Instrument name for the note.
     * @returns {void}
     */
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
            tur.delayParameters = null;
        } else if (tur._transportEventId !== null && this.synth.transport.isAvailable) {
            this.synth.transport.clear(tur._transportEventId);
            tur._transportEventId = null;
            if (tur.delayParameters) {
                tur._transportTime = this.synth.transport.seconds;
                this.runFromBlockNow(
                    this,
                    turtle,
                    tur.delayParameters["blk"],
                    tur.delayParameters["flow"],
                    tur.delayParameters["arg"]
                );
                tur.delayParameters = null;
            }
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
                turtle.queue.splice(i, 1);
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
                turtle.queue.splice(i, 1);
                break;
            }
        }

        // eslint-disable-next-line eqeqeq
        if (parentLoopBlock == null) {
            // Flush the child flow
            turtle.queue.pop();
            return;
        }

        // For while and until, we need to add any childflow from the parent to the queue
        if (parentLoopBlock.name === "while" || parentLoopBlock.name === "until") {
            const childFlow = this.deps.utils.last(parentLoopBlock.connections);
            // eslint-disable-next-line eqeqeq
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
            .initTurtle(
                this.runningLilypond || this.runningAbc || this.runningMxml || this.runningMIDI
            );
    }

    /**
     * Cleans up audio, transport, and visual state after a run has fully
     * completed — either naturally (via _lastNoteTimeout) or on explicit stop.
     *
     * This is the shared subset of doStopTurtles that is safe to call from
     * the deferred natural-completion path.  It does NOT set stopTurtle,
     * cancel managed timers, or reset UI — those belong only in
     * doStopTurtles when the user presses Stop.
     *
     * @returns {void}
     */
    _cleanupAfterCompletion() {
        // Skip if cleanup already ran (two turtles finishing far apart).
        if (!this._synthsInitialized && this.sounds.length === 0) {
            return;
        }

        for (const sound in this.sounds) {
            this.sounds[sound].stop();
        }

        this.sounds = [];

        // Kill all active audio voices to prevent "zombie audio"
        for (const turtle in this.turtles.turtleList) {
            const tur = this.turtles.getTurtle(turtle);
            if (tur && tur.singer && typeof tur.singer.killAllVoices === "function") {
                tur.singer.killAllVoices();
            }

            for (const instrumentName in this.deps.instruments[turtle]) {
                this.synth.stopSound(turtle, instrumentName);
            }
            const comp = this.turtles.getTurtle(turtle).companionTurtle;
            if (comp) {
                const compTurtle = this.turtles.getTurtle(comp);
                compTurtle.running = false;
                if (compTurtle.interval !== undefined) {
                    if (!this._timerManager.clearInterval(compTurtle.interval)) {
                        clearInterval(compTurtle.interval);
                    }
                    compTurtle.interval = undefined;
                }
            }
        }

        // Cancel Transport-scheduled events and reset position
        if (this.synth.transport.isAvailable) {
            this.synth.transport.cancel();
            this.synth.transport.seconds = 0;
        }

        for (const t of this.activity.turtles.turtleList) {
            t._transportTime = null;
            t._transportEventId = null;
        }

        this.synth.stop();

        this.synth.disposeAllInstruments();
        this._synthsInitialized = false;

        // eslint-disable-next-line eqeqeq
        if (this.cameraID != null) {
            this.deps.utils.doStopVideoCam(this.cameraID, this.setCameraID);
        }
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

        // Cancel all pending timers to prevent zombie graphics and sounds.
        const cancelledTimers = this._timerManager.clearAll();
        if (cancelledTimers > 0) {
            console.debug(
                "ManagedTimer: cancelled " + cancelledTimers + " pending timer(s) on stop"
            );
        }

        // Prevent stale timeout from firing cleanup on next run.
        this._lastNoteTimeout = null;

        this._cleanupAfterCompletion();

        for (const arg in this.evalOnStopList) {
            this.safePluginExecute(this.evalOnStopList[arg], this);
        }

        // Clear canvas on explicit Stop only — natural completion
        // preserves drawings for SVG/PNG export.
        for (const turtle of this.turtles.turtleList) {
            turtle.painter.doClear(true, true, true);
        }

        // Recorder stop is Stop-only — natural completion must not
        // interrupt an in-progress WAV recording.
        if (this.synth.recorder && this.synth.recorder.state === "recording")
            this.synth.recorder.stop();

        this.onStopTurtle();
        this.blocks.bringToTop();

        this._alreadyRunning = false;
        this.stepQueue = {};
        for (const turtle of this.turtles.turtleList) {
            turtle.unhighlightQueue = [];
            if (turtle.delayTimeout !== null) {
                clearTimeout(turtle.delayTimeout);
                turtle.delayTimeout = null;
            }
        }

        this._restoreConnections();

        document.body.style.cursor = "default";
        if (this.deps.config.showBlocksAfterRun) {
            this.blocks.showBlocks();
            document.getElementById("stop").style.color = "white";
        }

        this.deps.config.showBlocksAfterRun = false;
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
                    // eslint-disable-next-line eqeqeq
                    this._unhighlightStepQueue[turtle] != null
                ) {
                    if (this.blocks.visible) {
                        this.blocks.unhighlight(this._unhighlightStepQueue[turtle]);
                    }
                    this._unhighlightStepQueue[turtle] = null;
                }

                const blk = this.stepQueue[turtle].pop();
                // eslint-disable-next-line eqeqeq
                if (blk != null) {
                    this.runFromBlockNow(this, turtle, blk, 0, null);
                }
            }
        }
    }

    /**
     * Initialises interpreter state and launches all turtle execution queues.
     *
     * This is the main entry point for program execution. It proceeds in two
     * phases:
     *
     *   Phase 1 — Setup: resets run-state flags, clears notation and MIDI
     *     buffers, initialises every turtle, removes stale event listeners, and
     *     builds the named-action table by scanning `blocks.stackList`.
     *
     *   Phase 2 — Dispatch: kicks off execution by calling `runFromBlock` for
     *     each start/drum/status/oscilloscope block found on the canvas.
     *     Status and oscilloscope blocks run first (with a 250 ms head-start so
     *     they can display their widgets before music begins); all other start
     *     blocks follow together in a single guarded timeout.
     *
     * @param {number|null} startHere - Block index to start from directly, or
     *     null to discover all start blocks on the canvas automatically.
     * @param {*} env - Initial argument value forwarded to the first block as
     *     `receivedArg` (typically null for top-level runs).
     * @returns {void}
     */
    runLogoCommands(startHere, env) {
        const performanceModeEnabled =
            typeof window !== "undefined" &&
            (window.DEBUG_PERFORMANCE === true ||
                (window.location && window.location.search.includes("performance=true")));

        if (
            performanceModeEnabled &&
            !getPerformanceTracker() &&
            typeof requirejs === "function" &&
            !this._performanceTrackerLoadFailed
        ) {
            requirejs(
                ["utils/performanceTracker"],
                () => this.runLogoCommands(startHere, env),
                () => {
                    this._performanceTrackerLoadFailed = true;
                    this.runLogoCommands(startHere, env);
                }
            );
            return;
        }

        const tracker = getPerformanceTracker();
        if (tracker) {
            if (performanceModeEnabled) {
                tracker.enable();
            } else {
                tracker.disable();
            }
        }

        this._prematureRestart = this._alreadyRunning;

        if (this._alreadyRunning && this._runningBlock !== null) {
            this._ignoringBlock = this._runningBlock;
        } else {
            this._ignoringBlock = null;
        }

        // Reset run-state flags for the new execution.
        this._alreadyRunning = false;
        this._prematureRestart = false;

        // eslint-disable-next-line eqeqeq
        if (this._lastNoteTimeout != null) {
            this._timerManager.clearTimeout(this._lastNoteTimeout);
            this._lastNoteTimeout = null;
            // Previous run's cleanup never fired — run it now.
            this._cleanupAfterCompletion();
        }

        this._restoreConnections(); // Restore any broken connections.
        this.deps.storage.saveLocally(); // Save the state before running.

        for (const arg in this.evalOnStartList) {
            this.safePluginExecute(this.evalOnStartList[arg], this);
        }

        this.stopTurtle = false;

        this._syncCounter = 0;
        this._iterationBudget = this._MAX_ITERATIONS + 1;

        this.blocks.unhighlightAll();
        this.blocks.bringToTop(); // Draw under the blocks.

        this.deps.messageHandler.hide();

        // Run the Logo commands here.
        this.time = new Date().getTime();
        this.firstNoteTime = null;
        this.firstNoteAudioTime = null;

        // Ensure we have at least one turtle.
        if (this.turtles.getTurtleCount() === 0) {
            this.turtles.add(null);
        }

        this.deps.Singer.masterBPM = TARGETBPM;
        this.deps.Singer.defaultBPMFactor = TONEBPM / TARGETBPM;
        this.synth.changeInTemperament = false;
        this.synth.inTemperament = "equal";
        this.deps.Singer.clearPitchToFrequencyCache();

        this._checkingCompletionState = false;

        for (const turtle of this.turtles.turtleList) {
            turtle.embeddedGraphicsFinished = true;
        }

        this.prepSynths();

        if (this.synth.transport.isAvailable) {
            this.synth.transport.start();
            const transportNow = this.synth.transport.seconds;
            for (const turtle of this.activity.turtles.turtleList) {
                turtle._transportTime = transportNow;
            }
        }

        this.notation.notationStaging = {};
        this.notation.notationDrumStaging = {};

        this.turtleHeaps = {};
        this.turtleDicts = {};
        this.notationNotes = {};
        this._midiData = {};
        const statusWidgetOpen =
            this.deps.widgetWindows &&
            typeof this.deps.widgetWindows.isOpen === "function" &&
            this.deps.widgetWindows.isOpen("status");
        if (!statusWidgetOpen) {
            this.statusFields = [];
        }
        this.specialArgs = [];
        this.connectionStore = {};
        if (this.recordingBuffer && !this.recording) {
            this.recordingBuffer = {
                hasData: false,
                notationOutput: "",
                notationNotes: {},
                notationStaging: {},
                notationDrumStaging: {}
            };
        }

        // Each turtle needs to keep its own wait time and music states.
        for (const turtle in this.turtles.turtleList) {
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
        for (const turtle of this.turtles.turtleList) {
            for (const listener in turtle.listeners) {
                this.stage.removeEventListener(listener, turtle.listeners[listener], false);
            }

            turtle.listeners = {};
        }

        // Init the graphic state.
        for (const turtle in this.turtles.turtleList) {
            const requiredTurtle = this.turtles.getTurtle(turtle);
            requiredTurtle.container.x = this.turtles.turtleX2screenX(requiredTurtle.x);
            requiredTurtle.container.y = this.turtles.turtleY2screenY(requiredTurtle.y);
        }

        // Set up status block.
        if (this.deps.widgetWindows.isOpen("status")) {
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
        this.blocks.findStacks();
        this.actions = {};

        const stackListLength = this.blocks.stackList.length;
        for (let blk = 0; blk < stackListLength; blk++) {
            if (
                ["start", "drum", "status", "oscilloscope"].includes(
                    this.blockList[this.blocks.stackList[blk]].name
                )
            ) {
                // Don't start on a start block in the trash
                if (!this.blockList[this.blocks.stackList[blk]].trash) {
                    startBlocks.push(this.blocks.stackList[blk]);
                }
            } else if (this.blockList[this.blocks.stackList[blk]].name === "action") {
                // Does the action stack have a name?
                const c = this.blockList[this.blocks.stackList[blk]].connections[1];
                // Is there a block in the action clamp?
                const b = this.blockList[this.blocks.stackList[blk]].connections[2];
                // eslint-disable-next-line eqeqeq
                if (c != null && b != null) {
                    // Don't use an action block in the trash
                    if (!this.blockList[this.blocks.stackList[blk]].trash) {
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

        for (const turtle of this.turtles.turtleList) {
            turtle.parentFlowQueue = [];
            turtle.unhighlightQueue = [];
            turtle.parameterQueue = [];
        }

        if (this.turtleDelay === 0) {
            // Clear parameters displayed on blocks before running
            // full speed.
            this.blocks.clearParameterBlocks();
        }

        this.onRunTurtle();

        // Make sure that there is atleast one turtle.
        if (this.turtles.getTurtleCount() === 0) {
            this.turtles.addTurtle(null);
        }

        // Mark all turtles as not running.
        for (const turtle in this.turtles.turtleList) {
            this.turtles.getTurtle(turtle).running = false;
        }

        // Performance instrumentation: begin tracking
        getPerformanceTracker()?.startRun();

        /*
        ===========================================================================
        (2) Execute the stack. (A bit complicated due to lots of corner cases.)
        ===========================================================================
        */
        if (this.turtles.turtleCount() === 0) {
            this.deps.errorHandler(NOACTIONERRORMSG, null, _("start"));
            // eslint-disable-next-line eqeqeq
        } else if (startHere != null) {
            // If a block to start from was passed, find its associated
            // turtle, i.e., which turtle should we use?
            let turtle = 0;
            while (
                this.turtles.getTurtle(turtle).inTrash &&
                turtle < this.turtles.getTurtleCount()
            ) {
                ++turtle;
            }

            if (["start", "drum"].includes(this.blockList[startHere].name)) {
                turtle = this.blockList[startHere].value;
            }

            const tur = this.turtles.ithTurtle(turtle);

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
                    const tur = this.turtles.ithTurtle(turtle);

                    tur.queue = [];
                    tur.parentFlowQueue = [];
                    tur.unhighlightQueue = [];
                    tur.parameterQueue = [];

                    tur.running = true;
                    delayStart = 250;
                    this.runFromBlock(this, turtle, startBlocks[b], 0, env);
                }
            }

            this._timerManager.setGuardedTimeout(
                () => {
                    if (delayStart !== 0) {
                        // Launching status/oscilloscope block would have hidden the
                        // Stop Button so show it again.
                        this.onRunTurtle();
                    }

                    // If there are multiple start blocks, run them all.
                    for (let b = 0; b < startBlocksLength; b++) {
                        if (
                            !["status", "oscilloscope"].includes(
                                this.blockList[startBlocks[b]].name
                            )
                        ) {
                            const turtle = this.blockList[startBlocks[b]].value;
                            const tur = this.turtles.ithTurtle(turtle);

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
                },
                delayStart,
                () => this.stopTurtle
            );
        } else {
            document.body.style.cursor = "default";
        }

        this.deps.refreshCanvas();
    }

    /**
     * Schedules execution of block `blk` after the turtle's current delay.
     *
     * In step mode (`turtleDelay === TURTLESTEP`), the block is pushed onto
     * `stepQueue` and executed when the user advances manually.  Otherwise a
     * guarded `setTimeout` is used, which respects `stopTurtle` and the
     * turtle's accumulated `waitTime`.
     *
     * @param {Logo} logo - The running Logo instance (always `this`).
     * @param {number} turtle - Index of the active turtle.
     * @param {number|null} blk - Index of the block to execute; a null value
     *     returns immediately without scheduling.
     * @param {number} isflow - 1 when called from within a flow (enables the
     *     sync-counter yield path in `runFromBlockNow`), 0 for argument
     *     evaluation.
     * @param {*} receivedArg - Argument passed down from an enclosing action
     *     call; forwarded unchanged to `runFromBlockNow`.
     * @returns {void}
     */
    runFromBlock(logo, turtle, blk, isflow, receivedArg) {
        this._runningBlock = blk;
        // eslint-disable-next-line eqeqeq
        if (blk == null) return;

        this.receivedArg = receivedArg;

        // Reset async yield counters – execution will go through
        // setTimeout below, giving the event loop a chance to breathe.
        logo._syncCounter = 0;

        const tur = logo.turtles.ithTurtle(turtle);

        if (tur._transportTime === null && logo.synth.transport.isAvailable) {
            tur._transportTime = logo.synth.transport.seconds;
        }

        const delay = logo.turtleDelay + tur.waitTime;
        tur.doWait(0);

        if (!logo.stopTurtle) {
            if (logo.turtleDelay === TURTLESTEP) {
                // Step mode
                if (!(turtle in logo.stepQueue)) {
                    logo.stepQueue[turtle] = [];
                }
                logo.stepQueue[turtle].push(blk);
            } else if (
                logo.turtleDelay === 0 &&
                delay > 0 &&
                logo.synth.transport.isAvailable &&
                logo.synth.transport.isClockRunning &&
                tur._transportTime !== null
            ) {
                const transportTime = Math.max(
                    tur._transportTime + delay / 1000,
                    logo.synth.transport.seconds
                );
                tur.delayParameters = { blk: blk, flow: isflow, arg: receivedArg };
                tur._transportEventId = logo.synth.transport.schedule(audioContextTime => {
                    const tur2 = logo.activity.turtles.ithTurtle(turtle);
                    tur2._transportTime = logo.synth.transport.getSecondsAtTime(audioContextTime);
                    tur2._transportEventId = null;
                    tur2.delayParameters = null;
                    if (!logo.stopTurtle) {
                        logo.runFromBlockNow(logo, turtle, blk, isflow, receivedArg);
                    }
                }, transportTime);
            } else {
                tur.delayParameters = { blk: blk, flow: isflow, arg: receivedArg };
                tur.delayTimeout = logo._timerManager.setGuardedTimeout(
                    () => {
                        if (logo.synth.transport.isAvailable) {
                            const tur2 = logo.activity.turtles.ithTurtle(turtle);
                            tur2._transportTime = logo.synth.transport.seconds;
                        }
                        tur.delayTimeout = null;
                        tur.delayParameters = null;
                        logo.runFromBlockNow(logo, turtle, blk, isflow, receivedArg);
                    },
                    delay,
                    () => logo.stopTurtle
                );
            }
        }
    }

    /**
     * Executes block `blk` synchronously, then continues the turtle's queue.
     *
     * This is the hot path of the interpreter and handles three phases per
     * block invocation:
     *
     *   (1) Argument evaluation — calls `parseArg` for each non-flow input
     *       connection, building the `args` array.
     *
     *   (2) Block execution — calls either a plugin handler from `evalFlowDict`
     *       or the block's own `proto.flow` method. Value blocks and arg blocks
     *       reached as flow blocks display their value instead.
     *
     *   (3) Queue continuation — pops the next block from `tur.queue` and
     *       recurses (directly or via a guarded `setTimeout` to yield the event
     *       loop periodically). Handles backward-mode traversal, block
     *       highlighting, and post-run notation export on queue exhaustion.
     *
     * @param {Logo} logo - The running Logo instance (always `this`).
     * @param {number} turtle - Index of the active turtle.
     * @param {number} blk - Index of the block to execute.
     * @param {number} isflow - 1 when executing within a flow; enables the
     *     sync-counter yield path.
     * @param {*} receivedArg - Argument forwarded from an enclosing action
     *     call.
     * @param {number} [queueStart=0] - Queue depth threshold; blocks above
     *     this index are processed, allowing partial-queue execution.
     * @returns {void}
     */
    runFromBlockNow(logo, turtle, blk, isflow, receivedArg, queueStart) {
        const tracker = getPerformanceTracker();
        const profilingEnabled =
            tracker && typeof tracker.isEnabled === "function" && tracker.isEnabled();
        let profilingStart = null;
        if (profilingEnabled) {
            profilingStart =
                typeof performance !== "undefined" && typeof performance.now === "function"
                    ? performance.now()
                    : Date.now();
            if (!logo.blockTimings) {
                logo.blockTimings = {};
            }
            tracker.enterBlock();
        }

        this._alreadyRunning = true;

        this.receivedArg = receivedArg;

        if (--logo._iterationBudget <= 0) {
            logo.deps.errorHandler(
                _("Infinite loop detected. Execution stopped to prevent browser freeze."),
                blk
            );
            logo.stopTurtle = true;
            logo._alreadyRunning = false;
            logo._syncCounter = 0;
            logo._iterationBudget = logo._MAX_ITERATIONS + 1;
            if (profilingEnabled) {
                Logo._recordBlockTiming(logo, blk, profilingStart);
            }
            return;
        }

        // Sometimes we don't want to unwind the entire queue.
        if (queueStart === undefined) queueStart = 0;
        const currentBlock = logo.blockList[blk];
        const blockName = currentBlock.name;
        const proto = currentBlock.protoblock;
        const connections = currentBlock.connections;
        const lastConnection = logo.deps.utils.last(connections);

        /*
===========================================================================
(1) Evaluate any arguments (beginning with connection[1]).
===========================================================================
*/
        const tur = logo.turtles.ithTurtle(turtle);
        const args = [];

        if (proto.args > 0) {
            for (let i = 1; i <= proto.args; i++) {
                if (proto.dockTypes[i] === "in") {
                    if (connections[i] !== null) {
                        args.push(connections[i]);
                    }
                } else {
                    args.push(logo.parseArg(logo, turtle, connections[i], blk, receivedArg));
                }

                if (
                    tur.singer.inNoteBlock.length > 0 &&
                    connections[i] !== undefined &&
                    logo.blockList[connections[i]] !== undefined &&
                    logo.blockList[connections[i]].name === "currentpitch"
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

        let nextFlow = null;
        if (!currentBlock.isValueBlock()) {
            // nextFlow remains null for value blocks.

            // All flow blocks have a last connection (nextFlow), but
            // it can be null (i.e., end of a flow).
            if (tur.singer.backward.length > 0) {
                // Inside a "backward" (or "duplicatenotes") clamp: traverse
                // the block chain in reverse using connections[0] (the
                // "previous" link) instead of the normal lastConnection.
                const lastBackward = logo.deps.utils.last(tur.singer.backward);
                const backwardBlock = logo.blockList[lastBackward];
                const backwardConnections = backwardBlock.connections;

                // connection[1] for "backward", connection[2] for wrapper
                // blocks like "duplicatenotes" — points to the first block
                // inside the clamp.
                const c = backwardBlock.name === "backward" ? 1 : 2;

                if (!logo.blocks.sameGeneration(backwardConnections[c], blk)) {
                    // Current block is outside the backward clamp; use normal
                    // forward flow.
                    nextFlow = lastConnection;
                } else {
                    // Walk backward: step to the previous block in the chain.
                    nextFlow = connections[0];
                    if (
                        nextFlow !== null &&
                        (logo.blockList[nextFlow].name === "action" ||
                            logo.blockList[nextFlow].name === "backward")
                    ) {
                        // Hit a clamp boundary block — stop traversal here.
                        nextFlow = null;
                    } else {
                        if (!logo.blocks.sameGeneration(backwardConnections[c], nextFlow)) {
                            // nextFlow stepped outside the clamp scope; fall
                            // back to forward flow.
                            nextFlow = lastConnection;
                        } else {
                            nextFlow = connections[0];
                        }
                    }
                }
            } else {
                nextFlow = lastConnection;
            }

            if (nextFlow === -1) {
                nextFlow = null;
            }

            if (nextFlow !== null && nextFlow !== undefined) {
                tur.queue.push(new Queue(nextFlow, 1, blk, receivedArg));
            }
        }

        // Some flow blocks have childflows, e.g., repeat.
        let childFlow = null;
        let childFlowCount = 0;
        const actionArgs = [];

        // Highlight only the current executing block
        if (logo.blocks.visible) {
            if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                // Unhighlight any previously highlighted block
                if (
                    logo._currentlyHighlightedBlock !== null &&
                    logo._currentlyHighlightedBlock !== blk
                ) {
                    logo.blocks.unhighlight(logo._currentlyHighlightedBlock);
                }
                // Highlight the current block
                logo.blocks.highlight(blk, false);
                logo._currentlyHighlightedBlock = blk;
                // Force stage update so highlight is visible when blocks were shown during execution.
                // Skip if the block is off-screen — the highlight is invisible anyway.
                if (logo.stage && currentBlock._viewportVisible !== false) {
                    logo.deps.markStageDirty();
                }
            }
        }

        if (!currentBlock.isArgBlock()) {
            let res = null;
            // Is it a plugin?
            if (currentBlock.name in logo.evalFlowDict) {
                logo.pluginReturnValue = null;
                logo.safePluginExecute(
                    logo.evalFlowDict[currentBlock.name],
                    logo,
                    turtle,
                    blk,
                    receivedArg,
                    actionArgs,
                    args,
                    isflow
                );
                // Clamp blocks will return the child flow.
                res = logo.pluginReturnValue;
            } else {
                res = proto.flow(args, logo, turtle, blk, receivedArg, actionArgs, isflow);
            }

            if (res) {
                const [cf, cfc, ret] = res;
                if (cf !== undefined) childFlow = cf;
                if (cfc !== undefined) childFlowCount = cfc;
                if (ret) {
                    if (profilingEnabled) {
                        Logo._recordBlockTiming(logo, blk, profilingStart);
                        tracker.exitBlock();
                    }
                    return ret;
                }
            }
        } else {
            if (
                // If it's an arg block, print its value.
                currentBlock.isArgBlock() ||
                ["anyout", "numberout", "textout", "booleanout"].includes(proto.dockTypes[0])
            ) {
                args.push(logo.parseArg(logo, turtle, blk, logo.receivedArg));

                const blockLabels = {
                    width: _("width"),
                    height: _("height"),
                    rightpos: _("right (screen)"),
                    leftpos: _("left (screen)"),
                    toppos: _("top (screen)"),
                    bottompos: _("bottom (screen)")
                };

                const label = blockLabels[blockName];
                const blockValue = currentBlock.value;

                if (blockValue === null || blockValue === undefined) {
                    logo.deps.textMsg("null block value");
                } else {
                    const value = blockValue.toString();
                    const displayText = label ? label + ": " + value : value;
                    logo.deps.textMsg(displayText);
                }
            } else {
                logo.deps.errorHandler("I do not know how to " + blockName + ".", blk);
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
                    // eslint-disable-next-line eqeqeq
                    if (signal != null) {
                        logo.stage.dispatchEvent(signal);
                    }
                }
            }
        }

        if (logo.statusMatrix && logo.statusMatrix.isOpen && !logo.inStatusMatrix) {
            logo.statusMatrix.updateAll();
        }

        // If there is a child flow, queue it.
        // eslint-disable-next-line eqeqeq
        if (childFlow != null) {
            let queueBlock;
            if (blockName === "doArg" || blockName === "nameddoArg") {
                queueBlock = new Queue(childFlow, childFlowCount, blk, actionArgs);
            } else {
                queueBlock = new Queue(childFlow, childFlowCount, blk, receivedArg);
            }
            // We need to keep track of the parent block to the child
            // flow so we can unhighlight the parent block after the
            // child flow completes.
            // eslint-disable-next-line eqeqeq
            if (tur.parentFlowQueue != undefined) {
                tur.parentFlowQueue.push(blk);
                tur.queue.push(queueBlock);
            }
        }

        let nextBlock = null;
        let parentBlk = null;
        let passArg = null;

        // Run the last flow in the queue.
        if (tur.queue.length > queueStart) {
            const lastQueue = logo.deps.utils.last(tur.queue);

            nextBlock = lastQueue.blk;
            parentBlk = lastQueue.parentBlk;
            passArg = lastQueue.args;

            if (lastQueue.count === 1) {
                tur.queue.pop();
            } else {
                lastQueue.count--;
            }
        }

        // eslint-disable-next-line eqeqeq
        if (nextBlock != null) {
            if (parentBlk !== blk) {
                // The wait block waits _waitTimes longer than other
                // blocks before it is unhighlighted.
                if (logo.turtleDelay === TURTLESTEP) {
                    logo._unhighlightStepQueue[turtle] = blk;
                } else {
                    if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                        logo._timerManager.setGuardedTimeout(
                            () => {
                                if (logo.blocks.visible) {
                                    logo.blocks.unhighlight(blk);
                                    // Clear the currently highlighted block if it was this one
                                    if (logo._currentlyHighlightedBlock === blk) {
                                        logo._currentlyHighlightedBlock = null;
                                    }
                                    if (logo.stage) {
                                        logo.deps.markStageDirty();
                                    }
                                }
                            },
                            Math.max(logo.turtleDelay + tur.waitTime, MIN_HIGHLIGHT_DURATION_MS),
                            () => logo.stopTurtle
                        );
                    }
                }
            }

            if (
                // eslint-disable-next-line eqeqeq
                (tur.singer.backward.length > 0 && connections[0] == null) ||
                (tur.singer.backward.length === 0 &&
                    // eslint-disable-next-line eqeqeq
                    lastConnection == null)
            ) {
                if (!tur.singer.suppressOutput && tur.singer.justCounting.length === 0) {
                    // If we are at the end of the child flow, queue
                    // the unhighlighting of the parent block to the
                    // flow.
                    if (tur.unhighlightQueue !== undefined) {
                        if (tur.parentFlowQueue.length > 0 && tur.queue.length > 0) {
                            const lastQueue = logo.deps.utils.last(tur.queue);
                            const lastParentFlow = logo.deps.utils.last(tur.parentFlowQueue);

                            if (lastQueue.parentBlk !== lastParentFlow) {
                                tur.unhighlightQueue.push(lastParentFlow);
                            }
                        } else if (tur.unhighlightQueue.length > 0) {
                            // The child flow is finally complete, so unhighlight.
                            logo._timerManager.setGuardedTimeout(
                                () => {
                                    if (logo.blocks.visible) {
                                        const unhighlightBlock = tur.unhighlightQueue.pop();
                                        logo.blocks.unhighlight(unhighlightBlock);
                                        // Clear the currently highlighted block if it was this one
                                        if (logo._currentlyHighlightedBlock === unhighlightBlock) {
                                            logo._currentlyHighlightedBlock = null;
                                        }
                                        if (logo.stage) {
                                            logo.deps.markStageDirty();
                                        }
                                    } else {
                                        tur.unhighlightQueue.pop();
                                    }
                                },
                                Math.max(logo.turtleDelay, MIN_HIGHLIGHT_DURATION_MS),
                                () => logo.stopTurtle
                            );
                        }
                    }
                }
            }

            // We don't update parameter blocks when running full speed.
            if (logo.turtleDelay !== 0) {
                let updatedParameterBlocks = false;
                for (const pblk in tur.parameterQueue) {
                    logo.blocks.updateParameterBlock(logo, turtle, tur.parameterQueue[pblk]);
                    updatedParameterBlocks = true;
                }

                if (updatedParameterBlocks) {
                    logo.deps.refreshCanvas();
                }
            }

            if (isflow) {
                // Async yield: periodically yield to the event loop so the
                // browser can process paint/input events and the UI does not
                // freeze during long-running or infinitely-recursive programs.
                logo._syncCounter++;
                if (logo._syncCounter >= logo._YIELD_AFTER_SYNC_RUNS) {
                    logo._syncCounter = 0;
                    logo._timerManager.setGuardedTimeout(
                        () =>
                            logo.runFromBlockNow(
                                logo,
                                turtle,
                                nextBlock,
                                isflow,
                                passArg,
                                queueStart
                            ),
                        0,
                        () => logo.stopTurtle
                    );
                } else {
                    logo.runFromBlockNow(logo, turtle, nextBlock, isflow, passArg, queueStart);
                }
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
                        // eslint-disable-next-line eqeqeq
                        if (tur.endOfClampSignals[b][i] != null) {
                            if (
                                // eslint-disable-next-line eqeqeq
                                tur.butNotThese[b] == null ||
                                tur.butNotThese[b].indexOf(i) === -1
                            ) {
                                if (!tur.singer.runningFromEvent) {
                                    logo.stage.dispatchEvent(tur.endOfClampSignals[b][i]);
                                }
                            }
                        }
                    }
                }

                // Make sure SVG path is closed.
                logo.turtles.getTurtle(turtle).painter.closeSVG();

                // Mark the turtle as not running.
                logo.turtles.getTurtle(turtle).running = false;
                if (!logo.turtles.running() && queueStart === 0) {
                    logo.onStopTurtle();
                }
            } else {
                logo.turtles.getTurtle(turtle).running = false;
            }

            const comp = logo.turtles.getTurtle(turtle).companionTurtle;
            if (comp) {
                const compTurtle = logo.turtles.getTurtle(comp);
                compTurtle.running = false;
                // Null tur.interval after cancel — mirrors fix at doStopTurtles
                // (~line 1123) to prevent stale-ID no-op on next Play.
                if (compTurtle.interval !== undefined) {
                    if (!logo._timerManager.clearInterval(compTurtle.interval)) {
                        clearInterval(compTurtle.interval);
                    }
                    compTurtle.interval = undefined;
                }
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
                    // Performance instrumentation: end tracking and log stats.
                    // Looked up again because this runs on a timeout, well
                    // after the lookup at the top of runFromBlockNow.
                    const runTracker = getPerformanceTracker();
                    if (runTracker) {
                        runTracker.endRun();
                        runTracker.logStats();
                    }

                    if (logo.runningLilypond) {
                        try {
                            if (logo.collectingStats) {
                                logo.projectStats = logo.deps.utils.getStatsFromNotation(
                                    logo.activity
                                );
                                logo.deps.statsWindow.displayInfo(logo.projectStats);
                            } else {
                                logo.deps.save.afterSaveLilypond();
                            }
                        } catch (e) {
                            console.error("Error generating Lilypond output: ", e);
                            logo.deps.errorHandler(
                                `${_("Error generating Lilypond output.")} ${e.message}`
                            );
                        } finally {
                            logo.collectingStats = false;
                            logo.runningLilypond = false;
                            document.body.style.cursor = "default";
                        }
                    } else if (logo.runningAbc) {
                        try {
                            logo.deps.save.afterSaveAbc();
                        } catch (e) {
                            console.error("Error generating ABC output: ", e);
                            logo.deps.errorHandler(
                                `${_("Error generating ABC output.")} ${e.message}`
                            );
                        } finally {
                            logo.runningAbc = false;
                            document.body.style.cursor = "default";
                        }
                    } else if (logo.runningMxml) {
                        logo.deps.save.afterSaveMxml();
                        logo.runningMxml = false;
                    } else if (logo.runningMIDI) {
                        logo.deps.save.afterSaveMIDI();
                        logo.runningMIDI = false;
                    } else if (tur.singer.suppressOutput) {
                        if (!logo.recording) {
                            logo.deps.errorHandler(_("Playback is ready."));
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
                            for (let t = 0; t < logo.turtles.getTurtleCount(); t++) {
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

                    // Wait a beat for the last note, then clean up.
                    // Cancel any pending timer from a previous turtle.
                    if (logo._lastNoteTimeout !== null) {
                        logo._timerManager.clearTimeout(logo._lastNoteTimeout);
                    }
                    logo._lastNoteTimeout = logo._timerManager.setTimeout(() => {
                        logo._lastNoteTimeout = null;
                        tur.singer.runningFromEvent = false;
                        if (tur.singer.suppressOutput && logo.recording) {
                            tur.singer.suppressOutput = false;
                        }
                        // Skip if a new run already started or another
                        // turtle's callback already cleaned up.
                        if (!logo.turtles.running()) {
                            logo._cleanupAfterCompletion();
                        }
                    }, 1000);
                }
            };

            logo._timerManager.setTimeout(__checkCompletionState, 100);
        }

        if (profilingEnabled) {
            Logo._recordBlockTiming(logo, blk, profilingStart);
            tracker.exitBlock();
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
        return this._graphicsScheduler.schedule(turtle, beatValue, blk, delay);
    }

    /**
     * Executes plugin-provided block code in a sandboxed manner.
     *
     * Plugins may supply either a pre-compiled function or a legacy string of
     * JavaScript.  Functions are called directly inside a try/catch.  Strings
     * are matched against an allowlist of known-safe math patterns (see
     * `mathPatterns` below) and executed natively; all other string code is
     * blocked to prevent arbitrary eval injection (security fix for #5449).
     *
     * @param {Function|string} code - Plugin code: a callable or a legacy JS
     *     string from a plugin definition file (e.g. maths.json).
     * @param {Logo} logo - The running Logo instance.
     * @param {number} turtle - Index of the active turtle.
     * @param {number} blk - Index of the block being evaluated.
     * @param {*} value - Context value forwarded to the plugin (e.g. the
     *     current block value for setter blocks).
     * @param {...*} args - Additional arguments forwarded verbatim to function
     *     plugins.
     * @returns {*} The plugin's return value, or `undefined` for void or
     *     blocked calls.
     */
    safePluginExecute(code, logo, turtle, blk, value, ...args) {
        if (typeof code === "function") {
            try {
                return code(logo, turtle, blk, value, ...args);
            } catch (e) {
                console.error("Plugin function execution failed: ", e);
                return;
            }
        }

        if (typeof code !== "string") {
            return;
        }

        // Whitelist for common, safe math patterns used by plugins (e.g. maths.json)
        // These are checked against the exact string format used in built-in plugins.
        const mathPatterns = [
            {
                // Unary Math operations (Math.sin, etc.)
                regex: /^const mathBlock = globalActivity\.logo\.blockList\[blk\];const conns = mathBlock\.connections;mathBlock\.value = Math\.(sin|cos|tan|asin|acos|atan|sqrt|log|exp|abs|ceil|floor|round)\(logo\.parseArg\(logo, turtle, conns\[1\]\)\);$/,
                exec: match => {
                    const op = match[1];
                    const mathBlock = logo.blockList[blk];
                    const conns = mathBlock.connections;
                    mathBlock.value = Math[op](logo.parseArg(logo, turtle, conns[1], blk));
                    return mathBlock.value;
                }
            },
            {
                // Binary Math operations (Math.pow)
                regex: /^const mathBlock = globalActivity\.logo\.blockList\[blk\];const conns = mathBlock\.connections;var base = logo\.parseArg\(logo, turtle, conns\[1\]\);var exp {2}= logo\.parseArg\(logo, turtle, conns\[2\]\);mathBlock\.value = Math\.pow\(base, exp\);$/,
                exec: () => {
                    const mathBlock = logo.blockList[blk];
                    const conns = mathBlock.connections;
                    const base = logo.parseArg(logo, turtle, conns[1], blk);
                    const exp = logo.parseArg(logo, turtle, conns[2], blk);
                    mathBlock.value = Math.pow(base, exp);
                    return mathBlock.value;
                }
            },
            {
                // Math Constants (Math.PI, Math.E)
                regex: /^const mathBlock = globalActivity\.logo\.blockList\[blk\];const conns = mathBlock\.connections;mathBlock\.value = Math\.(PI|E);$/,
                exec: match => {
                    const constName = match[1];
                    const mathBlock = logo.blockList[blk];
                    mathBlock.value = Math[constName];
                    return mathBlock.value;
                }
            },
            {
                // Parameter plugin patterns (simple assignment)
                regex: /^logo\.blockList\[blk\]\.value = Math\.(PI|E);$/,
                exec: match => {
                    const constName = match[1];
                    logo.blockList[blk].value = Math[constName];
                    return logo.blockList[blk].value;
                }
            }
        ];

        for (const pattern of mathPatterns) {
            const match = code.match(pattern.regex);
            if (match) {
                return pattern.exec(match);
            }
        }

        // If not a function and not whitelisted, we block arbitrary string execution (eval).
        // This is the core of the security fix for #5449.
        console.warn(
            "Blocked arbitrary JavaScript execution in plugin:",
            code.substring(0, 100) + "..."
        );
    }
}

Logo._recordBlockTiming = function _recordBlockTiming(logo, blk, profilingStart) {
    if (profilingStart === null) return;
    try {
        const endTime =
            typeof performance !== "undefined" && typeof performance.now === "function"
                ? performance.now()
                : Date.now();
        const elapsed = endTime - profilingStart;
        const blockRef = logo.blockList && logo.blockList[blk];
        const blockName = blockRef && blockRef.name ? blockRef.name : "unknown";

        if (!logo.blockTimings[blockName]) {
            logo.blockTimings[blockName] = { calls: 0, total: 0, max: 0 };
        }

        const entry = logo.blockTimings[blockName];
        entry.calls += 1;
        entry.total += elapsed;
        if (elapsed > entry.max) {
            entry.max = elapsed;
        }
    } catch (e) {
        const tracker = getPerformanceTracker();
        if (tracker && typeof tracker.disable === "function") {
            tracker.disable();
        }
    }
};

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
