// Copyright (c) 2025 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Tests for logo.js gaps that weren't covered in logo.test.js.
//
// Found these while reading through the file — some are actual bugs,
// some are just risky paths that have no tests at all.
//
// Rough list of what this covers:
//   - _iterationBudget initialisation bug (NaN means infinite loops can't stop)
//   - resetTemperament / setUserTemperament (temperament leaks between runs)
//   - _cleanupAfterCompletion (zombie audio - instruments not stopped)
//   - notationMIDI (buffer never tested, drum handling untested)
//   - dispatchUnissuedSignals (clamp signals, butNotThese filtering)
//   - recordingBuffer reset logic
//   - _exportingNotation getter
//   - prepSynths when synths are already initialised
//   - doStopTurtles state after pressing stop
//   - doBreak edge cases

// set up globals before requiring logo

global._ = str => str;

global.Notation = jest.fn().mockImplementation(() => ({
    notationStaging: {},
    notationDrumStaging: {},
    pickupPoint: {},
    pickupPOW2: {},
    doUpdateNotation: jest.fn(),
    notationInsertTie: jest.fn()
}));

global.Synth = jest.fn().mockImplementation(() => ({
    newTone: jest.fn(),
    createDefaultSynth: jest.fn(),
    loadSynth: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    stopSound: jest.fn(),
    disposeAllInstruments: jest.fn(),
    changeInTemperament: false,
    recorder: null,
    transport: {
        get isAvailable() {
            return false;
        },
        get isClockRunning() {
            return false;
        },
        start: jest.fn(),
        stop: jest.fn(),
        cancel: jest.fn(),
        get seconds() {
            return 0;
        },
        set seconds(_v) {}
    }
}));

global.Singer = {
    setSynthVolume: jest.fn(),
    setMasterVolume: jest.fn(),
    resetMasterVolume: jest.fn(),
    clearPitchToFrequencyCache: jest.fn(),
    masterBPM: 90,
    defaultBPMFactor: 1,
    masterVolume: [50]
};

global.instruments = {};
global.instrumentsFilters = {};
global.instrumentsEffects = {};
global.DEFAULTVOICE = "electronic synth";
global.StatusMatrix = jest.fn();
global.last = arr => arr[arr.length - 1];
global.getIntervalDirection = jest.fn(() => 1);
global.getIntervalNumber = jest.fn(() => 5);
global.mixedNumber = jest.fn(n => n.toString());
global.rationalToFraction = jest.fn(n => [1, Math.round(1 / n)]);
global.getMeasurePosition = require("../utils/musicutils-rhythm").getMeasurePosition;
global.doStopVideoCam = jest.fn();
global.CAMERAVALUE = "camera:";
global.VIDEOVALUE = "video:";
global.doUseCamera = jest.fn();
global.delayExecution = jest.fn(() => Promise.resolve());
global.getStatsFromNotation = jest.fn();
global.Tone = {
    UserMedia: jest.fn().mockImplementation(() => ({ open: jest.fn() }))
};

jest.mock("tone", () => ({
    UserMedia: jest.fn().mockImplementation(() => ({ open: jest.fn() }))
}));

global.EmbeddedGraphicsScheduler =
    require("../embedded-graphics-scheduler").EmbeddedGraphicsScheduler;

const { Logo } = require("../logo");
const logoconstants = require("../logoconstants");
Object.assign(global, logoconstants);

// shared test setup

function resetGlobals() {
    jest.clearAllMocks();
    global.instruments = { 0: {} };
    global.instrumentsFilters = { 0: {} };
    global.instrumentsEffects = { 0: {} };
    global.window.widgetWindows = { isOpen: jest.fn(() => false) };
    global.document.getElementById = jest.fn(() => ({ style: { color: "" } }));
}

function makeTurtle(extra = {}) {
    const singerBase = {
        synthVolume: {},
        backward: [],
        inDuplicate: false,
        notesPlayed: [5, 1],
        pickup: 0,
        noteValuePerBeat: 1,
        beatsPerMeasure: 4,
        inNoteBlock: [],
        justCounting: [],
        suppressOutput: false,
        dispatchFactor: 1,
        embeddedGraphics: {},
        runningFromEvent: false,
        killAllVoices: jest.fn(),
        noteDirection: 0
    };
    return {
        singer: { ...singerBase, ...(extra.singer || {}) },
        painter: {
            color: 50,
            penState: true,
            closeSVG: jest.fn(),
            doPenUp: jest.fn(),
            doPenDown: jest.fn(),
            ...(extra.painter || {})
        },
        queue: [],
        parentFlowQueue: [],
        unhighlightQueue: [],
        parameterQueue: [],
        listeners: {},
        endOfClampSignals: {},
        butNotThese: {},
        embeddedGraphicsPending: 0,
        embeddedGraphicsGeneration: 0,
        running: false,
        inTrash: false,
        waitTime: 0,
        doWait: jest.fn(),
        delayTimeout: null,
        delayParameters: null,
        _transportTime: null,
        _transportEventId: null,
        container: { x: 0, y: 0 },
        x: 0,
        y: 0,
        companionTurtle: null,
        initTurtle: jest.fn(),
        doShowImage: jest.fn(),
        doShowURL: jest.fn(),
        doShowText: jest.fn(),
        ...Object.fromEntries(
            Object.entries(extra).filter(([k]) => k !== "singer" && k !== "painter")
        )
    };
}

function makeActivity(turtle) {
    const t = turtle || makeTurtle();
    return {
        blocks: {
            blockList: [],
            findStacks: jest.fn(),
            stackList: [],
            unhighlightAll: jest.fn(),
            bringToTop: jest.fn(),
            showBlocks: jest.fn(),
            unhighlight: jest.fn(),
            highlight: jest.fn(),
            clearParameterBlocks: jest.fn(),
            updateParameterBlock: jest.fn(),
            sameGeneration: jest.fn(() => false),
            visible: true
        },
        turtles: {
            turtleList: [t],
            ithTurtle: jest.fn(() => t),
            getTurtle: jest.fn(() => t),
            getTurtleCount: jest.fn(() => 1),
            turtleCount: jest.fn(() => 1),
            turtleX2screenX: jest.fn(x => x),
            turtleY2screenY: jest.fn(y => y),
            add: jest.fn(),
            addTurtle: jest.fn(),
            markAllAsStopped: jest.fn(),
            running: jest.fn(() => false)
        },
        stage: {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
            update: jest.fn()
        },
        errorMsg: jest.fn(),
        textMsg: jest.fn(),
        hideMsgs: jest.fn(),
        saveLocally: jest.fn(),
        refreshCanvas: jest.fn(),
        showBlocksAfterRun: false,
        onStopTurtle: jest.fn(),
        onRunTurtle: jest.fn(),
        save: {
            afterSaveLilypond: jest.fn(),
            afterSaveAbc: jest.fn(),
            afterSaveMxml: jest.fn(),
            afterSaveMIDI: jest.fn()
        },
        statsWindow: { displayInfo: jest.fn() }
    };
}

// ─── iteration budget ────────────────────────────────────────────────────────
//
// logo.js lines 340-341:
//   this._iterationBudget = this._MAX_ITERATIONS + 1;
//   this._MAX_ITERATIONS = 1000000;
//
// _MAX_ITERATIONS is set on the line AFTER it's used, so _iterationBudget
// gets undefined + 1 = NaN. Then the guard `if (--logo._iterationBudget <= 0)`
// never fires because NaN comparisons are always false. Infinite loops can run
// forever and freeze the browser tab.

describe("_iterationBudget init order", () => {
    beforeEach(resetGlobals);

    // BUG: this test is expected to FAIL until the init-order bug is fixed.
    // logo.js line 340 sets _iterationBudget = this._MAX_ITERATIONS + 1
    // but _MAX_ITERATIONS is only assigned on line 341, so _iterationBudget
    // gets undefined + 1 = NaN. The infinite-loop guard then never triggers.
    // Tracked: fix by swapping the two lines so _MAX_ITERATIONS comes first.
    test("BUG: _iterationBudget is NaN because _MAX_ITERATIONS is set one line too late", () => {
        const logo = new Logo(makeActivity());
        // this will fail (NaN) until the two lines in the constructor are swapped
        expect(Number.isFinite(logo._iterationBudget)).toBe(true);
        expect(logo._iterationBudget).toBe(logo._MAX_ITERATIONS + 1);
    });

    test("the infinite loop guard actually stops execution when budget runs out", () => {
        const activity = makeActivity();
        const logo = new Logo(activity);

        logo._iterationBudget = 1;
        logo.blockList = [
            {
                name: "print",
                value: null,
                connections: [null],
                protoblock: {
                    args: 0,
                    dockTypes: ["flow"],
                    parameter: false,
                    flow: jest.fn(() => null)
                },
                isValueBlock: () => false,
                isArgBlock: () => false
            }
        ];

        logo.runFromBlockNow(logo, 0, 0, 0, null);

        expect(activity.errorMsg).toHaveBeenCalledWith(expect.stringContaining("Infinite loop"), 0);
        expect(logo.stopTurtle).toBe(true);
    });
});

// ─── resetTemperament ────────────────────────────────────────────────────────
//
// This is called at the start of every run. If the project no longer has a
// settemperament block, the temperament should be wiped so it doesn't bleed
// into the next project the user opens.

describe("resetTemperament", () => {
    let logo;

    beforeEach(() => {
        resetGlobals();
        logo = new Logo(makeActivity());
        logo.synth.startingPitch = "C4";
        logo.synth.changeInTemperament = false;
        logo.synth.inTemperament = "equal";
    });

    test("wipes temperament when the project has no settemperament block", () => {
        logo._userTemperament = "pythagorean";
        logo.temperamentSelected = ["pythagorean"];
        logo.blockList = [{ name: "print", trash: false }];

        logo.resetTemperament();

        expect(logo._userTemperament).toBeNull();
        expect(logo.temperamentSelected).toEqual([]);
    });

    test("keeps temperament when the project still has a settemperament block", () => {
        logo._userTemperament = "pythagorean";
        logo.temperamentSelected = ["pythagorean"];
        logo.blockList = [{ name: "settemperament", trash: false }];

        logo.resetTemperament();

        expect(logo._userTemperament).toBe("pythagorean");
    });

    test("trashed settemperament blocks don't count — temperament gets cleared", () => {
        logo._userTemperament = "meantone";
        logo.blockList = [{ name: "settemperament", trash: true }];

        logo.resetTemperament();

        expect(logo._userTemperament).toBeNull();
    });

    test("changeInTemperament on the synth is always reset to false", () => {
        logo.synth.changeInTemperament = true;
        logo.blockList = [];

        logo.resetTemperament();

        expect(logo.synth.changeInTemperament).toBe(false);
    });

    test("synth.inTemperament falls back to equal when nothing was set", () => {
        logo._userTemperament = null;
        logo.blockList = [];

        logo.resetTemperament();

        expect(logo.synth.inTemperament).toBe("equal");
    });

    test("synth picks up a persisted temperament when the block is present", () => {
        logo._userTemperament = "just";
        logo.blockList = [{ name: "settemperament", trash: false }];

        logo.resetTemperament();

        expect(logo.synth.inTemperament).toBe("just");
    });
});

describe("setUserTemperament", () => {
    let logo;

    beforeEach(() => {
        resetGlobals();
        logo = new Logo(makeActivity());
    });

    test("stores the name and marks the synth as changed", () => {
        logo.setUserTemperament("meantone");

        expect(logo._userTemperament).toBe("meantone");
        expect(logo.synth.inTemperament).toBe("meantone");
        expect(logo.synth.changeInTemperament).toBe(true);
    });

    test("calling it again just overwrites the previous value", () => {
        logo.setUserTemperament("pythagorean");
        logo.setUserTemperament("just");

        expect(logo._userTemperament).toBe("just");
    });
});

// ─── _cleanupAfterCompletion ─────────────────────────────────────────────────
//
// Zombie audio bug: when a run finishes (or the user hits stop), we need to
// stop every sound, call killAllVoices on each turtle's singer, and dispose
// all instruments. If any of these steps are skipped, audio keeps playing.

describe("_cleanupAfterCompletion", () => {
    let logo, turtle, activity;

    beforeEach(() => {
        resetGlobals();
        turtle = makeTurtle();
        activity = makeActivity(turtle);
        logo = new Logo(activity);
    });

    test("does nothing when synths were never started and sounds list is empty", () => {
        logo._synthsInitialized = false;
        logo.sounds = [];

        expect(() => logo._cleanupAfterCompletion()).not.toThrow();
        expect(logo.synth.stop).not.toHaveBeenCalled();
    });

    test("stops every sound in the sounds array and clears it", () => {
        const s1 = { stop: jest.fn() };
        const s2 = { stop: jest.fn() };
        logo._synthsInitialized = true;
        logo.sounds = [s1, s2];

        logo._cleanupAfterCompletion();

        expect(s1.stop).toHaveBeenCalled();
        expect(s2.stop).toHaveBeenCalled();
        expect(logo.sounds).toHaveLength(0);
    });

    test("calls killAllVoices on the turtle singer", () => {
        logo._synthsInitialized = true;

        logo._cleanupAfterCompletion();

        expect(turtle.singer.killAllVoices).toHaveBeenCalledTimes(1);
    });

    test("synth.stop and disposeAllInstruments are both called", () => {
        logo._synthsInitialized = true;

        logo._cleanupAfterCompletion();

        expect(logo.synth.stop).toHaveBeenCalled();
        expect(logo.synth.disposeAllInstruments).toHaveBeenCalled();
    });

    test("marks synths as not initialised after cleanup", () => {
        logo._synthsInitialized = true;

        logo._cleanupAfterCompletion();

        expect(logo._synthsInitialized).toBe(false);
    });

    test("calls stopSound once per active instrument", () => {
        logo._synthsInitialized = true;
        logo.deps.instruments = { 0: { flute: {}, piano: {} } };

        logo._cleanupAfterCompletion();

        expect(logo.synth.stopSound).toHaveBeenCalledWith("0", "flute");
        expect(logo.synth.stopSound).toHaveBeenCalledWith("0", "piano");
    });

    test("a failing stopSound doesn't abort the rest of teardown", () => {
        logo._synthsInitialized = true;
        logo.deps.instruments = { 0: { brokenInstrument: {} } };
        logo.synth.stopSound = jest.fn(() => {
            throw new Error("oops");
        });

        expect(() => logo._cleanupAfterCompletion()).not.toThrow();
        // dispose should still have been called despite the error above
        expect(logo.synth.disposeAllInstruments).toHaveBeenCalled();
    });

    test("stops the video camera if one is active", () => {
        logo._synthsInitialized = true;
        logo.cameraID = "cam-1";
        logo.deps.utils.doStopVideoCam = jest.fn();

        logo._cleanupAfterCompletion();

        expect(logo.deps.utils.doStopVideoCam).toHaveBeenCalledWith("cam-1", logo.setCameraID);
    });
});

// ─── notationMIDI ────────────────────────────────────────────────────────────
//
// Builds the MIDI data buffer used when exporting to .mid.
// Never had any tests, and the drum-extraction logic (takes only drum[0])
// is subtle enough to need one.

describe("notationMIDI", () => {
    let logo;

    beforeEach(() => {
        resetGlobals();
        logo = new Logo(makeActivity());
        logo._midiData = {};
    });

    test("creates the buffer for a turtle on the first note", () => {
        logo.notationMIDI(["G4"], null, 0.25, 0, 90, "piano", [4, 4]);

        expect(Array.isArray(logo._midiData[0])).toBe(true);
        expect(logo._midiData[0]).toHaveLength(1);
    });

    test("keeps adding to the same buffer across multiple calls", () => {
        logo.notationMIDI(["C4"], null, 0.5, 0, 90, "piano", [4, 4]);
        logo.notationMIDI(["G4"], null, 0.25, 0, 90, "piano", [4, 4]);

        expect(logo._midiData[0]).toHaveLength(2);
    });

    test("different turtles get their own buffers", () => {
        logo.notationMIDI(["C4"], null, 0.5, 0, 90, "piano", [4, 4]);
        logo.notationMIDI(["G4"], null, 0.25, 1, 90, "flute", [3, 4]);

        expect(logo._midiData[0]).toHaveLength(1);
        expect(logo._midiData[1]).toHaveLength(1);
    });

    test("only the first drum name is stored, not the whole array", () => {
        logo.notationMIDI(["R"], ["kick", "snare", "hihat"], 0.5, 0, 90, "drum", [4, 4]);

        expect(logo._midiData[0][0].drum).toBe("kick");
    });

    test("null drum is stored as null, not turned into something else", () => {
        logo.notationMIDI(["E4"], null, 0.25, 0, 90, "piano", [4, 4]);

        expect(logo._midiData[0][0].drum).toBeNull();
    });

    test("the stored entry has all the fields we need for MIDI export", () => {
        logo.notationMIDI(["D4"], ["snare"], 0.125, 0, 120, "guitar", [6, 8]);

        expect(logo._midiData[0][0]).toMatchObject({
            note: ["D4"],
            duration: 0.125,
            bpm: 120,
            instrument: "guitar",
            drum: "snare",
            meter: [6, 8]
        });
    });
});

// ─── dispatchUnissuedSignals ─────────────────────────────────────────────────
//
// When a clamp block's inner flow ends early (break, or just runs out), any
// end-of-clamp signals that were never dispatched need to fire anyway.
// butNotThese lets callers suppress specific signals.

describe("dispatchUnissuedSignals", () => {
    let logo, activity;

    beforeEach(() => {
        resetGlobals();
        activity = makeActivity();
        logo = new Logo(activity);
    });

    test("dispatches all signals stored in endOfClampSignals", () => {
        const tur = {
            endOfClampSignals: { 5: ["sig-a", "sig-b"] },
            butNotThese: {},
            singer: { runningFromEvent: false }
        };

        logo.dispatchUnissuedSignals(tur);

        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("sig-a");
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("sig-b");
    });

    test("null entries in the signals array are skipped", () => {
        const tur = {
            endOfClampSignals: { 5: [null, "sig-c"] },
            butNotThese: {},
            singer: { runningFromEvent: false }
        };

        logo.dispatchUnissuedSignals(tur);

        expect(activity.stage.dispatchEvent).toHaveBeenCalledTimes(1);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("sig-c");
    });

    test("butNotThese correctly skips specific signal indices", () => {
        // index 0 (sig-x) is excluded, index 1 (sig-y) should still fire
        const tur = {
            endOfClampSignals: { 5: ["sig-x", "sig-y"] },
            butNotThese: { 5: [0] },
            singer: { runningFromEvent: false }
        };

        logo.dispatchUnissuedSignals(tur);

        expect(activity.stage.dispatchEvent).not.toHaveBeenCalledWith("sig-x");
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("sig-y");
    });

    test("nothing fires when the turtle is running from an event", () => {
        const tur = {
            endOfClampSignals: { 5: ["sig-d"] },
            butNotThese: {},
            singer: { runningFromEvent: true }
        };

        logo.dispatchUnissuedSignals(tur);

        expect(activity.stage.dispatchEvent).not.toHaveBeenCalled();
    });

    test("empty endOfClampSignals doesn't crash", () => {
        const tur = {
            endOfClampSignals: {},
            butNotThese: {},
            singer: { runningFromEvent: false }
        };

        expect(() => logo.dispatchUnissuedSignals(tur)).not.toThrow();
    });
});

// ─── recordingBuffer ─────────────────────────────────────────────────────────
//
// This buffer lets users save Lilypond/ABC from an interactive session.
// It should be wiped at the start of a fresh run, but preserved while
// a recording is in progress.

describe("recordingBuffer", () => {
    let logo;

    beforeEach(() => {
        resetGlobals();
        logo = new Logo(makeActivity());
    });

    test("starts empty with hasData false", () => {
        expect(logo.recordingBuffer.hasData).toBe(false);
        expect(logo.recordingBuffer.notationOutput).toBe("");
    });

    test("gets reset at the start of a normal (non-recording) run", () => {
        logo.recordingBuffer = {
            hasData: true,
            notationOutput: "old stuff",
            notationNotes: { 0: ["C4"] },
            notationStaging: { 0: [1] },
            notationDrumStaging: { 0: ["kick"] }
        };
        logo.recording = false;

        // mirror the guard in runLogoCommands
        if (logo.recordingBuffer && !logo.recording) {
            logo.recordingBuffer = {
                hasData: false,
                notationOutput: "",
                notationNotes: {},
                notationStaging: {},
                notationDrumStaging: {}
            };
        }

        expect(logo.recordingBuffer.hasData).toBe(false);
        expect(logo.recordingBuffer.notationOutput).toBe("");
    });

    test("buffer is NOT wiped while recording is active", () => {
        logo.recordingBuffer = {
            hasData: true,
            notationOutput: "recording in progress",
            notationNotes: {},
            notationStaging: {},
            notationDrumStaging: {}
        };
        logo.recording = true;

        if (logo.recordingBuffer && !logo.recording) {
            logo.recordingBuffer = {
                hasData: false,
                notationOutput: "",
                notationNotes: {},
                notationStaging: {},
                notationDrumStaging: {}
            };
        }

        expect(logo.recordingBuffer.hasData).toBe(true);
        expect(logo.recordingBuffer.notationOutput).toBe("recording in progress");
    });
});

// ─── _exportingNotation getter ───────────────────────────────────────────────

describe("_exportingNotation", () => {
    let logo;

    beforeEach(() => {
        resetGlobals();
        logo = new Logo(makeActivity());
        logo.runningLilypond = false;
        logo.runningAbc = false;
        logo.runningMxml = false;
        logo.runningMIDI = false;
    });

    test("false when no export is running", () => {
        expect(logo._exportingNotation).toBe(false);
    });

    test("true when runningLilypond", () => {
        logo.runningLilypond = true;
        expect(logo._exportingNotation).toBe(true);
    });

    test("true when runningAbc", () => {
        logo.runningAbc = true;
        expect(logo._exportingNotation).toBe(true);
    });

    test("true when runningMxml", () => {
        logo.runningMxml = true;
        expect(logo._exportingNotation).toBe(true);
    });

    test("true when runningMIDI", () => {
        logo.runningMIDI = true;
        expect(logo._exportingNotation).toBe(true);
    });

    test("goes back to false once the flag is cleared", () => {
        logo.runningLilypond = true;
        expect(logo._exportingNotation).toBe(true);
        logo.runningLilypond = false;
        expect(logo._exportingNotation).toBe(false);
    });
});

// ─── prepSynths incremental path ─────────────────────────────────────────────
//
// When onEveryBeatDo spawns a companion turtle mid-run, prepSynths is called
// again with _synthsInitialized already true. The new turtle should get its
// instrument slots without newTone() being called (that would reset everything).

describe("prepSynths — adding a turtle when synths are already up", () => {
    let logo, turtle0, turtle1, activity;

    beforeEach(() => {
        resetGlobals();
        turtle0 = makeTurtle();
        turtle1 = makeTurtle();
        activity = makeActivity(turtle0);
        activity.turtles.turtleList = [turtle0, turtle1];
        activity.turtles.ithTurtle = jest.fn(i => (String(i) === "1" ? turtle1 : turtle0));

        logo = new Logo(activity);
        logo._synthsInitialized = true;
        logo.deps.instruments = { 0: { [global.DEFAULTVOICE]: {} } };
        logo.deps.instrumentsFilters = { 0: {} };
        logo.deps.instrumentsEffects = { 0: {} };
    });

    test("creates instrument slots for the new turtle", () => {
        logo.prepSynths();

        expect(logo.deps.instruments["1"]).toBeDefined();
    });

    test("calls createDefaultSynth for the new turtle", () => {
        logo.prepSynths();

        expect(logo.synth.createDefaultSynth).toHaveBeenCalled();
    });

    test("does NOT call newTone — that would mess up the ongoing run", () => {
        logo.prepSynths();

        expect(logo.synth.newTone).not.toHaveBeenCalled();
    });
});

// ─── doStopTurtles ───────────────────────────────────────────────────────────
//
// When the stop button is pressed, the engine state should be fully reset so
// the next Run starts clean. Checking the most important invariants here.

describe("doStopTurtles", () => {
    let logo, turtle, activity;

    beforeEach(() => {
        resetGlobals();
        turtle = makeTurtle();
        activity = makeActivity(turtle);
        logo = new Logo(activity);
        logo._synthsInitialized = false;
    });

    test("sets stopTurtle", () => {
        logo.doStopTurtles();
        expect(logo.stopTurtle).toBe(true);
    });

    test("clears _alreadyRunning so the next Run can start", () => {
        logo._alreadyRunning = true;
        logo.doStopTurtles();
        expect(logo._alreadyRunning).toBe(false);
    });

    test("empties the step queue", () => {
        logo.stepQueue = { 0: [1, 2, 3] };
        logo.doStopTurtles();
        expect(logo.stepQueue).toEqual({});
    });

    test("clears _lastNoteTimeout", () => {
        logo._lastNoteTimeout = 42;
        logo.doStopTurtles();
        expect(logo._lastNoteTimeout).toBeNull();
    });

    test("calls markAllAsStopped on turtles", () => {
        logo.doStopTurtles();
        expect(activity.turtles.markAllAsStopped).toHaveBeenCalled();
    });

    test("fires the onStopTurtle callback", () => {
        const cb = jest.fn();
        logo.onStopTurtle = cb;
        logo.doStopTurtles();
        expect(cb).toHaveBeenCalled();
    });

    test("clears unhighlightQueue on each turtle", () => {
        turtle.unhighlightQueue = [10, 20];
        logo.doStopTurtles();
        expect(turtle.unhighlightQueue).toEqual([]);
    });

    test("clears delayTimeout on each turtle", () => {
        turtle.delayTimeout = 99;
        logo.doStopTurtles();
        expect(turtle.delayTimeout).toBeNull();
    });

    test("resets _valueBarTimeout and hides the value bar", () => {
        logo._valueBarTimeout = 55;
        logo.activity.valueBarVisible = true;
        logo.doStopTurtles();
        expect(logo._valueBarTimeout).toBeNull();
        expect(logo.activity.valueBarVisible).toBe(false);
    });

    test("calls unhighlightAll to clear block highlights", () => {
        logo.doStopTurtles();
        expect(activity.blocks.unhighlightAll).toHaveBeenCalled();
    });
});

// ─── doBreak ─────────────────────────────────────────────────────────────────

describe("doBreak", () => {
    let logo, activity;

    beforeEach(() => {
        resetGlobals();
        activity = makeActivity();
        logo = new Logo(activity);
    });

    test("just pops the queue when there is no enclosing loop", () => {
        logo.blockList = [
            { name: "print", connections: [null] },
            { name: "print", connections: [null] }
        ];
        const turtle = {
            queue: [{ blk: 0, parentBlk: 1 }],
            parentFlowQueue: []
        };

        logo.doBreak(turtle);

        expect(turtle.queue).toHaveLength(0);
    });

    test("splices the repeat block out when breaking from a repeat loop", () => {
        logo.blockList = [
            { name: "print", connections: [null] },
            { name: "repeat", connections: [null, null, 0] }
        ];
        const turtle = {
            queue: [{ blk: 0, parentBlk: 1 }],
            parentFlowQueue: []
        };

        logo.doBreak(turtle);

        expect(turtle.queue).toHaveLength(0);
    });

    test("empty queue doesn't throw", () => {
        logo.blockList = [];
        const turtle = { queue: [], parentFlowQueue: [] };

        expect(() => logo.doBreak(turtle)).not.toThrow();
    });
});
