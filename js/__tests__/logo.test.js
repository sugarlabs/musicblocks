/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Music Blocks Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

// Setup global mocks BEFORE requiring the module
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
    transport: createTransportMock()
}));

/**
 * Returns a transport mock that mirrors the wrapper in synthutils.js.
 * Centralised here so both the Synth mock and test-local overrides stay in sync.
 */
const createTransportMock = () => ({
    get isAvailable() {
        return typeof global.Tone !== "undefined" && !!global.Tone.Transport;
    },
    get isClockRunning() {
        return (
            this.isAvailable &&
            typeof global.Tone.context !== "undefined" &&
            global.Tone.context.state === "running" &&
            global.Tone.Transport.state === "started"
        );
    },
    start() {
        if (this.isAvailable) global.Tone.Transport.start();
    },
    stop() {
        if (this.isAvailable) global.Tone.Transport.stop();
    },
    cancel() {
        if (this.isAvailable && typeof global.Tone.Transport.cancel === "function") {
            global.Tone.Transport.cancel();
        }
    },
    clear(id) {
        if (this.isAvailable && typeof global.Tone.Transport.clear === "function") {
            global.Tone.Transport.clear(id);
        }
    },
    schedule(callback, time) {
        if (this.isAvailable && typeof global.Tone.Transport.schedule === "function") {
            return global.Tone.Transport.schedule(callback, time);
        }
        return null;
    },
    get seconds() {
        if (this.isAvailable) return global.Tone.Transport.seconds;
        return 0;
    },
    set seconds(v) {
        if (this.isAvailable) global.Tone.Transport.seconds = v;
    },
    getSecondsAtTime(time) {
        if (this.isAvailable && typeof global.Tone.Transport.getSecondsAtTime === "function") {
            return global.Tone.Transport.getSecondsAtTime(time);
        }
        return this.seconds;
    }
});

global.Singer = {
    setSynthVolume: jest.fn(),
    setMasterVolume: jest.fn(),
    clearPitchToFrequencyCache: jest.fn(),
    masterBPM: 90,
    defaultBPMFactor: 1
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
global.doStopVideoCam = jest.fn();
global.CAMERAVALUE = "camera:";
global.VIDEOVALUE = "video:";
global.doUseCamera = jest.fn();
global.delayExecution = jest.fn(() => Promise.resolve());
global.getStatsFromNotation = jest.fn();
global.Tone = {
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
};

// Mock Tone.js
jest.mock("tone", () => ({
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
}));

global.EmbeddedGraphicsScheduler =
    require("../embedded-graphics-scheduler").EmbeddedGraphicsScheduler;

// Now require the module after globals are set up
const {
    Queue,
    Logo,
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
    POSNUMBER
} = require("../logo");

// Expose constants that logo.js references as bare globals at runtime
// (e.g. TURTLESTEP in runFromBlock, NOTEDIV in dispatchTurtleSignals).
const logoconstants = require("../logoconstants");
Object.assign(global, logoconstants);

// ─── Shared helpers ───────────────────────────────────────────────────────────

function makeSynth() {
    return {
        stop: jest.fn(),
        stopSound: jest.fn(),
        disposeAllInstruments: jest.fn(),
        recorder: null,
        transport: {
            get isAvailable() {
                return false;
            },
            cancel: jest.fn(),
            get seconds() {
                return 0;
            },
            set seconds(v) {}
        }
    };
}

function createMockTurtle(overrides = {}) {
    const defaults = {
        singer: {
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
        },
        painter: {
            color: 50,
            penState: true,
            closeSVG: jest.fn(),
            doPenUp: jest.fn(),
            doPenDown: jest.fn(),
            doSetColor: jest.fn(),
            doSetHue: jest.fn(),
            doSetValue: jest.fn(),
            doSetPenAlpha: jest.fn(),
            doSetChroma: jest.fn(),
            doSetPensize: jest.fn(),
            doSetXY: jest.fn(),
            doSetHeading: jest.fn(),
            doRight: jest.fn(),
            doForward: jest.fn(),
            doArc: jest.fn(),
            doScrollXY: jest.fn(),
            doBezier: jest.fn(),
            doStartFill: jest.fn(),
            doEndFill: jest.fn(),
            doStartHollowLine: jest.fn(),
            doEndHollowLine: jest.fn(),
            doClear: jest.fn()
        }
    };
    return {
        ...defaults,
        ...overrides,
        singer: { ...defaults.singer, ...(overrides.singer || {}) },
        painter: { ...defaults.painter, ...(overrides.painter || {}) },
        queue: [],
        parentFlowQueue: [],
        unhighlightQueue: [],
        parameterQueue: [],
        listeners: {},
        endOfClampSignals: {},
        butNotThese: {},
        embeddedGraphicsFinished: true,
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
        // Re-apply scalar overrides that would have been clobbered by the spread above
        ...Object.fromEntries(
            Object.entries(overrides).filter(([k]) => k !== "singer" && k !== "painter")
        )
    };
}

function createMockActivity(turtle) {
    const mockTurtle = turtle || createMockTurtle();
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
            turtleList: [mockTurtle],
            ithTurtle: jest.fn(() => mockTurtle),
            getTurtle: jest.fn(() => mockTurtle),
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
        meSpeak: { speak: jest.fn() },
        save: {
            afterSaveLilypond: jest.fn(),
            afterSaveAbc: jest.fn(),
            afterSaveMxml: jest.fn(),
            afterSaveMIDI: jest.fn()
        },
        statsWindow: { displayInfo: jest.fn() }
    };
}

function createTwoTurtleActivity(turtle0, turtle1) {
    const activity = createMockActivity(turtle0);
    activity.turtles.turtleList = [turtle0, turtle1];
    activity.turtles.ithTurtle = jest.fn(i => (String(i) === "1" ? turtle1 : turtle0));
    activity.turtles.getTurtle = jest.fn(i => (String(i) === "1" ? turtle1 : turtle0));
    activity.turtles.getTurtleCount = jest.fn(() => 2);
    activity.turtles.turtleCount = jest.fn(() => 2);
    return activity;
}

// Centralised per-test environment reset – call at the top of every beforeEach.
// Avoids repeating six identical lines in every describe block.
function setupLogoEnv({ withFlute = false } = {}) {
    jest.clearAllMocks();
    if (withFlute) {
        global.instruments = { 0: { flute: {} } };
        global.instrumentsFilters = { 0: { flute: ["lp"] } };
        global.instrumentsEffects = { 0: { flute: { reverb: 0.5 } } };
    } else {
        global.instruments = { 0: {} };
        global.instrumentsFilters = { 0: {} };
        global.instrumentsEffects = { 0: {} };
    }
    global.window.widgetWindows = { isOpen: jest.fn(() => false) };
    global.document.getElementById = jest.fn(() => ({ style: { color: "" } }));
}

// Block fixtures — reduce repetitive blockList construction in tests
function makeFlowBlock(name = "print", flowReturn = null) {
    return {
        name,
        protoblock: { args: 0, dockTypes: ["flow"], flow: jest.fn(() => flowReturn) },
        connections: [null],
        isValueBlock: () => false,
        isArgBlock: () => false
    };
}

function makeNumArgBlock(name, value = null) {
    return {
        name,
        value,
        connections: [],
        protoblock: { parameter: false, dockTypes: ["numberout"] },
        isValueBlock: () => false
    };
}

// ─── Queue ────────────────────────────────────────────────────────────────────

describe("Queue Class", () => {
    test("constructor initializes all properties correctly", () => {
        const queue = new Queue(1, 5, 0, ["arg1", "arg2"]);

        expect(queue.blk).toBe(1);
        expect(queue.count).toBe(5);
        expect(queue.parentBlk).toBe(0);
        expect(queue.args).toEqual(["arg1", "arg2"]);
    });

    test("constructor handles null arguments", () => {
        const queue = new Queue(null, 0, null, null);

        expect(queue.blk).toBeNull();
        expect(queue.count).toBe(0);
        expect(queue.parentBlk).toBeNull();
        expect(queue.args).toBeNull();
    });

    test("constructor handles empty array args", () => {
        const queue = new Queue(10, 3, 5, []);

        expect(queue.args).toEqual([]);
    });
});

// ─── Logo constants ───────────────────────────────────────────────────────────

describe("Logo Constants", () => {
    test("audio and timing constants have correct values", () => {
        expect(DEFAULTVOLUME).toBe(50);
        expect(PREVIEWVOLUME).toBe(80);
        expect(DEFAULTDELAY).toBe(500);
        expect(OSCVOLUMEADJUSTMENT).toBe(1.5);
    });

    test("playback and execution constants have correct values", () => {
        expect(TONEBPM).toBe(240);
        expect(TARGETBPM).toBe(90);
        expect(TURTLESTEP).toBe(-1);
        expect(NOTEDIV).toBe(8);
    });

    test("Error messages are defined correctly", () => {
        expect(NOMICERRORMSG).toBe("The microphone is not available.");
        expect(NANERRORMSG).toBe("Not a number.");
        expect(NOSTRINGERRORMSG).toBe("Not a string.");
        expect(NOBOXERRORMSG).toBe("Cannot find box");
        expect(NOACTIONERRORMSG).toBe("Cannot find action.");
        expect(NOINPUTERRORMSG).toBe("Missing argument.");
        expect(NOSQRTERRORMSG).toBe("Cannot take square root of negative number.");
        expect(ZERODIVIDEERRORMSG).toBe("Cannot divide by zero.");
        expect(EMPTYHEAPERRORMSG).toBe("empty heap.");
        expect(POSNUMBER).toBe("Argument must be a positive number");
    });
});

// ─── Logo constructor ─────────────────────────────────────────────────────────

describe("Logo constructor", () => {
    let logo;
    let mockActivity;

    beforeEach(() => {
        setupLogoEnv();
        global.document.body.style.cursor = "default";
        mockActivity = createMockActivity();
        logo = new Logo(mockActivity);
    });

    afterEach(() => jest.restoreAllMocks());

    test("initializes activity reference", () => {
        expect(logo.activity).toBe(mockActivity);
    });

    test("activity reference identity is preserved when constructed with an Activity object", () => {
        const freshLogo = new Logo(mockActivity);
        expect(freshLogo.activity).toBe(mockActivity);
    });

    test("initializes default volume-related properties", () => {
        expect(logo.stopTurtle).toBe(false);
        expect(logo.time).toBe(0);
        expect(logo.firstNoteTime).toBeNull();
    });

    test("initializes widget properties to null/false", () => {
        expect(logo.reflection).toBeNull();
        expect(logo.phraseMaker).toBeNull();
        expect(logo.inMatrix).toBe(false);
        expect(logo.inPitchDrumMatrix).toBe(false);
        expect(logo.inRhythmRuler).toBe(false);
    });

    test("initializes empty dictionaries", () => {
        expect(logo.boxes).toEqual({});
        expect(logo.actions).toEqual({});
        expect(logo.returns).toEqual({});
        expect(logo.turtleHeaps).toEqual({});
        expect(logo.turtleDicts).toEqual({});
    });

    test("initializes notation object", () => {
        expect(logo.notation).toBeDefined();
    });

    test("initializes synth", () => {
        expect(logo.synth).toBeDefined();
    });

    test("deps.blocks and deps.turtles reference activity members", () => {
        expect(logo.deps.blocks).toBe(mockActivity.blocks);
        expect(logo.deps.turtles).toBe(mockActivity.turtles);
    });

    test("activity facade errorMsg delegates to activity.errorMsg", () => {
        logo.deps.errorHandler("test-error", 5);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith("test-error", 5);
    });

    test("activity facade hideMsgs delegates to activity.hideMsgs", () => {
        logo.deps.messageHandler.hide();
        expect(mockActivity.hideMsgs).toHaveBeenCalled();
    });

    test("activity facade saveLocally delegates to activity.saveLocally", () => {
        logo.deps.storage.saveLocally();
        expect(mockActivity.saveLocally).toHaveBeenCalled();
    });

    test("initializes plugin registries as empty objects", () => {
        expect(logo.evalFlowDict).toEqual({});
        expect(logo.evalArgDict).toEqual({});
        expect(logo.evalOnStartList).toEqual({});
        expect(logo.evalOnStopList).toEqual({});
    });

    test("supports explicit dependency object mode", () => {
        const deps = {
            blocks: mockActivity.blocks,
            turtles: mockActivity.turtles,
            stage: mockActivity.stage,
            errorHandler: jest.fn(),
            messageHandler: { hide: jest.fn() },
            storage: { saveLocally: jest.fn() },
            config: { showBlocksAfterRun: false },
            callbacks: { onStopTurtle: jest.fn(), onRunTurtle: jest.fn() },
            meSpeak: { speak: jest.fn() },
            classes: {
                Notation: jest.fn(() => ({})),
                Synth: jest.fn(() => ({}))
            }
        };

        const depLogo = new Logo(deps);

        expect(depLogo.activity.blocks).toBe(mockActivity.blocks);
        expect(depLogo.activity.turtles).toBe(mockActivity.turtles);
        expect(depLogo.activity.stage).toBe(mockActivity.stage);
    });
});

// ─── Logo getters and setters ─────────────────────────────────────────────────

describe("Logo getters and setters", () => {
    let logo;

    beforeEach(() => {
        setupLogoEnv();
        global.document.body.style.cursor = "default";
        logo = new Logo(createMockActivity());
    });

    afterEach(() => jest.restoreAllMocks());

    test("onStopTurtle getter and setter work correctly", () => {
        const mockCallback = jest.fn();
        logo.onStopTurtle = mockCallback;
        expect(logo.onStopTurtle).toBe(mockCallback);
    });

    test("onRunTurtle getter and setter work correctly", () => {
        const mockCallback = jest.fn();
        logo.onRunTurtle = mockCallback;
        expect(logo.onRunTurtle).toBe(mockCallback);
    });

    test("turtleDelay getter and setter work correctly", () => {
        logo.turtleDelay = 100;
        expect(logo.turtleDelay).toBe(100);
    });

    test("notation getter returns notation object", () => {
        expect(logo.notation).toBeDefined();
        expect(logo.notation).not.toBeNull();
    });

    test("setCameraID sets cameraID property", () => {
        logo.setCameraID("camera123");
        expect(logo.cameraID).toBe("camera123");
    });
});

// ─── Logo clearNoteParams ─────────────────────────────────────────────────────

describe("Logo clearNoteParams", () => {
    let logo;
    let noteTurtle;

    beforeEach(() => {
        setupLogoEnv();
        logo = new Logo(createMockActivity());
        noteTurtle = {
            singer: {
                oscList: {},
                noteBeat: {},
                noteBeatValues: {},
                noteValue: {},
                notePitches: {},
                noteOctaves: {},
                noteCents: {},
                noteHertz: {},
                embeddedGraphics: {},
                noteDrums: {}
            }
        };
    });

    afterEach(() => jest.restoreAllMocks());

    test("clears all note parameters for a turtle", () => {
        logo.clearNoteParams(noteTurtle, 0, null);

        expect(noteTurtle.singer.oscList[0]).toEqual([]);
        expect(noteTurtle.singer.noteBeat[0]).toEqual([]);
        expect(noteTurtle.singer.noteValue[0]).toBeNull();
        expect(noteTurtle.singer.notePitches[0]).toEqual([]);
        expect(noteTurtle.singer.noteDrums[0]).toEqual([]);
    });

    test("uses provided drums array when not null", () => {
        logo.clearNoteParams(noteTurtle, 0, ["kick", "snare"]);

        expect(noteTurtle.singer.noteDrums[0]).toEqual(["kick", "snare"]);
    });

    test("resets all note fields for given block index", () => {
        noteTurtle.singer.oscList = { 3: ["old"] };
        noteTurtle.singer.noteBeat = { 3: [1] };
        noteTurtle.singer.noteBeatValues = { 3: [0.5] };
        noteTurtle.singer.noteValue = { 3: 0.25 };
        noteTurtle.singer.notePitches = { 3: ["G4"] };
        noteTurtle.singer.noteOctaves = { 3: [4] };
        noteTurtle.singer.noteCents = { 3: [0] };
        noteTurtle.singer.noteHertz = { 3: [392] };
        noteTurtle.singer.embeddedGraphics = { 3: [5] };
        noteTurtle.singer.noteDrums = { 3: ["kick"] };

        logo.clearNoteParams(noteTurtle, 3, null);

        expect(noteTurtle.singer.oscList[3]).toEqual([]);
        expect(noteTurtle.singer.noteBeat[3]).toEqual([]);
        expect(noteTurtle.singer.noteValue[3]).toBeNull();
        expect(noteTurtle.singer.notePitches[3]).toEqual([]);
        expect(noteTurtle.singer.embeddedGraphics[3]).toEqual([]);
        expect(noteTurtle.singer.noteDrums[3]).toEqual([]);
    });
});

// ─── Logo setTurtleListener ───────────────────────────────────────────────────

describe("Logo setTurtleListener", () => {
    let logo;
    let mockActivity;

    beforeEach(() => {
        setupLogoEnv();
        mockActivity = createMockActivity();
        logo = new Logo(mockActivity);
    });

    afterEach(() => jest.restoreAllMocks());

    test("adds event listener to stage", () => {
        const listener = jest.fn();
        mockActivity.turtles.ithTurtle = jest.fn(() => ({ listeners: {} }));

        logo.setTurtleListener(0, "testListener", listener);

        expect(mockActivity.stage.addEventListener).toHaveBeenCalledWith(
            "testListener",
            listener,
            false
        );
    });

    test("removes existing listener before adding new one", () => {
        const oldListener = jest.fn();
        const newListener = jest.fn();
        mockActivity.turtles.ithTurtle = jest.fn(() => ({
            listeners: { testListener: oldListener }
        }));

        logo.setTurtleListener(0, "testListener", newListener);

        expect(mockActivity.stage.removeEventListener).toHaveBeenCalledWith(
            "testListener",
            oldListener,
            false
        );
    });
});

// ─── Logo initTurtle ─────────────────────────────────────────────────────────

describe("Logo initTurtle", () => {
    let logo;
    let mockActivity;

    beforeEach(() => {
        setupLogoEnv();
        mockActivity = createMockActivity();
        mockActivity.turtles.ithTurtle = jest.fn(() => ({ initTurtle: jest.fn() }));
        logo = new Logo(mockActivity);
    });

    afterEach(() => jest.restoreAllMocks());

    test("initializes independent per-turtle state for each index", () => {
        logo.initTurtle(0);
        logo.initTurtle(1);

        expect(logo.connectionStore[0]).toEqual({});
        expect(logo.connectionStore[1]).toEqual({});
        expect(logo.returns[0]).toEqual([]);
        expect(logo.returns[1]).toEqual([]);
    });
});

// ─── Logo step ───────────────────────────────────────────────────────────────

describe("Logo step", () => {
    let logo;
    let mockActivity;

    beforeEach(() => {
        setupLogoEnv();
        mockActivity = createMockActivity();
        logo = new Logo(mockActivity);
    });

    afterEach(() => jest.restoreAllMocks());

    test("processes step queue for each turtle", () => {
        logo.stepQueue = { 0: [1] };
        logo._unhighlightStepQueue = { 0: 5 };
        logo.runFromBlockNow = jest.fn();
        mockActivity.blocks.visible = true;

        logo.step();

        expect(mockActivity.blocks.unhighlight).toHaveBeenCalledWith(5);
    });

    test("handles empty step queue", () => {
        logo.stepQueue = { 0: [] };
        logo.runFromBlockNow = jest.fn();

        logo.step();

        expect(logo.runFromBlockNow).not.toHaveBeenCalled();
    });

    test("null block in stepQueue does not call runFromBlockNow", () => {
        logo.runFromBlockNow = jest.fn();
        logo.stepQueue = { 0: [null] };
        logo._unhighlightStepQueue = {};

        logo.step();

        expect(logo.runFromBlockNow).not.toHaveBeenCalled();
    });
});

// ─── Logo _restoreConnections ─────────────────────────────────────────────────

describe("Logo _restoreConnections", () => {
    let logo;

    beforeEach(() => {
        setupLogoEnv();
        logo = new Logo(createMockActivity());
    });

    afterEach(() => jest.restoreAllMocks());

    test("restores broken connections", () => {
        const mockBlock0 = { connections: [null, 2] };
        const mockBlock2 = { connections: [null] };
        logo.blockList = [mockBlock0, null, mockBlock2];
        logo.connectionStore = {
            0: {
                5: [[0, 1, 2]]
            }
        };

        logo._restoreConnections();

        expect(mockBlock0.connections[1]).toBe(2);
        expect(mockBlock2.connections[0]).toBe(0);
    });

    test("handles empty connection store", () => {
        logo.connectionStore = {};

        expect(() => logo._restoreConnections()).not.toThrow();
    });
});

// ─── Logo doBreak ─────────────────────────────────────────────────────────────

describe("Logo doBreak", () => {
    let logo;

    beforeEach(() => {
        setupLogoEnv();
        logo = new Logo(createMockActivity());
    });

    afterEach(() => jest.restoreAllMocks());

    test("pops from queue when no parent loop found", () => {
        const mockTurtle = {
            queue: [{ blk: 0, parentBlk: 1 }],
            parentFlowQueue: []
        };
        logo.blockList = [{ name: "print" }, { name: "print" }];

        logo.doBreak(mockTurtle);

        expect(mockTurtle.queue.length).toBe(0);
    });

    test("handles while-loop parent and enqueues child flow", () => {
        const tur = { queue: [{ blk: 0, parentBlk: 0 }], parentFlowQueue: [] };
        logo.blockList = [
            { name: "while", connections: [null, 3] },
            { name: "print" },
            { name: "print" },
            { name: "print" }
        ];

        logo.doBreak(tur);

        expect(tur.parentFlowQueue).toEqual([0]);
        expect(tur.queue[0].blk).toBe(3);
    });
});

// ─── Logo setDispatchBlock ────────────────────────────────────────────────────

describe("Logo setDispatchBlock", () => {
    let logo;
    let mockActivity;
    let turtle0;

    beforeEach(() => {
        setupLogoEnv();
        turtle0 = createMockTurtle();
        mockActivity = createMockActivity(turtle0);
        logo = new Logo(mockActivity);
    });

    afterEach(() => jest.restoreAllMocks());

    test("adds clamp signal for normal and backward traversal", () => {
        turtle0.endOfClampSignals = {};
        logo.blockList = [
            { name: "forward", connections: [2, null, 2] },
            { name: "backward", connections: [null, 0] },
            { name: "print", connections: [null] }
        ];

        logo.setDispatchBlock(0, 0, "sig-a");
        expect(turtle0.endOfClampSignals[2]).toEqual(["sig-a"]);

        turtle0.singer.backward = [1];
        mockActivity.blocks.sameGeneration.mockReturnValue(true);
        logo.setDispatchBlock(0, 0, "sig-b");
        expect(turtle0.endOfClampSignals[2]).toEqual(["sig-a", "sig-b"]);
    });
});

// ─── Logo synth lifecycle ─────────────────────────────────────────────────────

describe("Logo synth lifecycle", () => {
    let logo;
    let mockActivity;
    let turtle0;
    let turtle1;

    beforeEach(() => {
        setupLogoEnv({ withFlute: true });
        turtle0 = createMockTurtle();
        turtle1 = createMockTurtle();
        mockActivity = createTwoTurtleActivity(turtle0, turtle1);
        logo = new Logo(mockActivity);
    });

    afterEach(() => jest.restoreAllMocks());

    test("prepSynths initializes synths and copies instruments per turtle", () => {
        logo.prepSynths();

        expect(logo.synth.newTone).toHaveBeenCalled();
        expect(logo.synth.createDefaultSynth).toHaveBeenCalled();
        expect(logo.synth.loadSynth).toHaveBeenCalledWith("1", "flute");
        expect(global.instrumentsFilters[1].flute).toEqual(["lp"]);
        expect(global.instrumentsEffects[1].flute).toEqual({ reverb: 0.5 });
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(logo, "0", "electronic synth", 50);
    });

    test("resetSynth creates default synth, resets volumes, and starts synth engine", () => {
        turtle0.singer.synthVolume = { "electronic synth": [40], "flute": [22] };
        turtle1.singer.synthVolume = { "electronic synth": [50] };

        logo.resetSynth(0);

        expect(logo.synth.createDefaultSynth).toHaveBeenCalledWith(0);
        expect(Singer.setMasterVolume).toHaveBeenCalledWith(logo, 50);
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(logo, "0", "electronic synth", 50);
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(logo, "0", "flute", 50);
        expect(logo.synth.start).toHaveBeenCalled();
    });
});

// ─── Logo doStopTurtles ───────────────────────────────────────────────────────

describe("Logo doStopTurtles", () => {
    let logo;
    let turtle;
    let mockActivity;

    beforeEach(() => {
        setupLogoEnv();
        turtle = createMockTurtle();
        mockActivity = createMockActivity(turtle);
        logo = new Logo(mockActivity);
        logo.sounds = [];
        logo.synth = makeSynth();
        logo._restoreConnections = jest.fn();
    });

    afterEach(() => jest.restoreAllMocks());

    test("sets stopTurtle to true", () => {
        logo.doStopTurtles();

        expect(logo.stopTurtle).toBe(true);
    });

    test("marks all turtles as stopped", () => {
        logo.doStopTurtles();

        expect(mockActivity.turtles.markAllAsStopped).toHaveBeenCalled();
    });

    test("stops all sounds", () => {
        const mockSound = { stop: jest.fn() };
        logo.sounds = [mockSound];

        logo.doStopTurtles();

        expect(mockSound.stop).toHaveBeenCalled();
        expect(logo.sounds).toEqual([]);
    });

    test("clears step queue", () => {
        logo.stepQueue = { 0: [1, 2, 3] };

        logo.doStopTurtles();

        expect(logo.stepQueue).toEqual({});
    });

    test("executes ONSTOP plugin hooks", () => {
        logo.evalOnStopList = {
            firstHook: "code-first",
            secondHook: "code-second"
        };
        logo.safePluginExecute = jest.fn();

        logo.doStopTurtles();

        expect(logo.safePluginExecute).toHaveBeenCalledTimes(2);
        expect(logo.safePluginExecute).toHaveBeenNthCalledWith(1, "code-first", logo);
        expect(logo.safePluginExecute).toHaveBeenNthCalledWith(2, "code-second", logo);
    });

    test("clears delayTimeout for turtles with a pending timer", () => {
        const TIMER_ID = 456;
        const clearTimeoutSpy = jest.spyOn(global, "clearTimeout").mockImplementation(() => {});
        turtle.delayTimeout = TIMER_ID;

        logo.doStopTurtles();

        expect(clearTimeoutSpy).toHaveBeenCalledWith(TIMER_ID);
    });

    test("timerManager.clearAll is invoked during stop", () => {
        const clearAllSpy = jest.spyOn(logo.timerManager, "clearAll");

        logo.doStopTurtles();

        expect(clearAllSpy).toHaveBeenCalled();
    });

    describe("with Transport and audio streams", () => {
        let turtle0;
        let turtle1;
        let twoTurtleActivity;
        let savedTone;

        beforeEach(() => {
            savedTone = global.Tone;
            global.instruments = { 0: { flute: {} }, 1: { piano: {} } };
            global.instrumentsFilters = { 0: { flute: ["lp"] }, 1: { piano: [] } };
            global.instrumentsEffects = { 0: {}, 1: {} };
            turtle0 = createMockTurtle();
            turtle1 = createMockTurtle();
            twoTurtleActivity = createTwoTurtleActivity(turtle0, turtle1);
            twoTurtleActivity.showBlocksAfterRun = true;
            logo = new Logo(twoTurtleActivity);
            logo.deps.instruments = { 0: { flute: {} }, 1: { piano: {} } };
            logo.sounds = [{ stop: jest.fn() }];
            logo._restoreConnections = jest.fn();
            logo.cameraID = "cam-1";
            turtle0.singer.killAllVoices = jest.fn();
            turtle0.companionTurtle = 1;
            turtle1.interval = 888;
            logo.synth = {
                stop: jest.fn(),
                stopSound: jest.fn(),
                disposeAllInstruments: jest.fn(),
                recorder: { state: "recording", stop: jest.fn() },
                transport: createTransportMock()
            };
        });

        afterEach(() => {
            global.Tone = savedTone;
        });

        test("cancels Transport, clears intervals, stops recorder, handles camera and companion", () => {
            const clearIntervalSpy = jest
                .spyOn(global, "clearInterval")
                .mockImplementation(() => {});
            const cancelSpy = jest.fn();
            let transportSeconds = 42;
            global.Tone = {
                ...savedTone,
                Transport: {
                    start: jest.fn(),
                    stop: jest.fn(),
                    cancel: cancelSpy,
                    getSecondsAtTime: jest.fn(() => 0),
                    get seconds() {
                        return transportSeconds;
                    },
                    set seconds(v) {
                        transportSeconds = v;
                    }
                }
            };
            turtle0._transportTime = 15;
            turtle1._transportTime = 25;
            turtle0._transportEventId = "evt-1";
            turtle1._transportEventId = "evt-2";

            logo.doStopTurtles();

            expect(cancelSpy).toHaveBeenCalled();
            expect(transportSeconds).toBe(0);
            expect(turtle0.singer.killAllVoices).toHaveBeenCalled();
            expect(logo.synth.stopSound).toHaveBeenCalledWith("0", "flute");
            expect(logo.synth.stopSound).toHaveBeenCalledWith("1", "piano");
            expect(clearIntervalSpy).toHaveBeenCalledWith(888);
            expect(logo.synth.recorder.stop).toHaveBeenCalled();
            expect(doStopVideoCam).toHaveBeenCalledWith("cam-1", logo.setCameraID);
            expect(twoTurtleActivity.blocks.showBlocks).toHaveBeenCalled();
            expect(document.getElementById).toHaveBeenCalledWith("stop");

            clearIntervalSpy.mockRestore();
        });
    });
});

// ─── Logo runLogoCommands ─────────────────────────────────────────────────────

describe("Logo runLogoCommands", () => {
    let logo;
    let mockActivity;
    let turtle0;
    let turtle1;
    let timeoutSpy;

    beforeEach(() => {
        setupLogoEnv({ withFlute: true });
        global.document.body.style.cursor = "pointer";
        turtle0 = createMockTurtle();
        turtle1 = createMockTurtle();
        mockActivity = createTwoTurtleActivity(turtle0, turtle1);
        logo = new Logo(mockActivity);
        mockActivity.logo = logo;
        logo.prepSynths = jest.fn();
        logo.initTurtle = jest.fn();
    });

    afterEach(() => {
        if (timeoutSpy) {
            timeoutSpy.mockRestore();
            timeoutSpy = null;
        }
        jest.restoreAllMocks();
    });

    test("executes startHere path", () => {
        logo._restoreConnections = jest.fn();
        logo.runFromBlock = jest.fn();
        logo.blockList = [{ name: "start", value: 0, trash: false, connections: [] }];

        logo.runLogoCommands(0, { test: true });

        expect(logo._restoreConnections).toHaveBeenCalled();
        expect(mockActivity.saveLocally).toHaveBeenCalled();
        expect(logo.prepSynths).toHaveBeenCalled();
        expect(logo.initTurtle).toHaveBeenCalledWith("0");
        expect(logo.runFromBlock).toHaveBeenCalledWith(logo, 0, 0, 0, { test: true });
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
    });

    test("executes startBlocks branch including delayed non-status stacks", () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 1;
        });
        logo.runFromBlock = jest.fn();
        mockActivity.blocks.stackList = [0, 1];
        logo.blockList = [
            { name: "status", value: 0, trash: false, connections: [] },
            { name: "start", value: 1, trash: false, connections: [] }
        ];

        logo.runLogoCommands(null, null);

        expect(logo.runFromBlock).toHaveBeenCalledWith(logo, 0, 0, 0, null);
        expect(logo.runFromBlock).toHaveBeenCalledWith(logo, 1, 1, 0, null);
    });

    test("falls back to default cursor when no start stacks", () => {
        mockActivity.blocks.stackList = [];
        logo.blockList = [];

        logo.runLogoCommands(null, null);

        expect(document.body.style.cursor).toBe("default");
    });

    test("executes each evalOnStartList plugin at run startup", () => {
        const effects = [];
        logo.blockList = [];
        mockActivity.blocks.stackList = [];
        logo.evalOnStartList = {
            hook1: () => effects.push("hook1"),
            hook2: () => effects.push("hook2")
        };

        logo.runLogoCommands(null, null);

        expect(effects).toContain("hook1");
        expect(effects).toContain("hook2");
    });

    test("removes existing turtle listeners from stage before running", () => {
        logo.blockList = [];
        mockActivity.blocks.stackList = [];
        const oldListener = jest.fn();
        turtle0.listeners = { noteEvent: oldListener };

        logo.runLogoCommands(null, null);

        expect(mockActivity.stage.removeEventListener).toHaveBeenCalledWith(
            "noteEvent",
            oldListener,
            false
        );
    });

    test("drum block is included in startBlocks", () => {
        logo.runFromBlock = jest.fn();
        mockActivity.blocks.stackList = [0];
        logo.blockList = [{ name: "drum", value: 0, trash: false, connections: [] }];

        logo.runLogoCommands(null, null);

        expect(logo.prepSynths).toHaveBeenCalled();
    });

    test("handles already-running state and status widget initialization", () => {
        const clearManagedTimerSpy = jest
            .spyOn(logo._timerManager, "clearTimeout")
            .mockReturnValue(true);
        logo._alreadyRunning = true;
        logo._runningBlock = 7;
        logo._lastNoteTimeout = 99;
        logo.statusFields = [[2, "currentpitch"]];
        logo.blockList = [];
        mockActivity.blocks.stackList = [];
        window.widgetWindows.isOpen.mockReturnValue(true);
        const statusInit = jest.fn();
        global.StatusMatrix.mockImplementation(() => ({ init: statusInit }));

        logo.runLogoCommands(null, null);

        expect(clearManagedTimerSpy).toHaveBeenCalledWith(99);
        expect(statusInit).toHaveBeenCalledWith(mockActivity);
        expect(logo.statusFields).toEqual([[2, "currentpitch"]]);
        clearManagedTimerSpy.mockRestore();
    });

    test("builds actions dictionary from action stack", () => {
        mockActivity.blocks.stackList = [0];
        logo.blockList = [
            { name: "action", connections: [null, 1, 2], trash: false },
            {
                name: "number",
                value: "my-action",
                protoblock: { parameter: false },
                isValueBlock: () => true
            },
            { name: "print", connections: [null] }
        ];

        logo.runLogoCommands(null, null);

        expect(logo.actions["my-action"]).toBe(2);
    });

    test("fires _cleanupAfterCompletion when _lastNoteTimeout is cancelled on re-run", () => {
        logo._lastNoteTimeout = 42;
        logo._cleanupAfterCompletion = jest.fn();

        logo.runLogoCommands(null, null);

        expect(logo._cleanupAfterCompletion).toHaveBeenCalled();
        expect(logo._lastNoteTimeout).toBeNull();
    });
});

// ─── Logo runFromBlock ────────────────────────────────────────────────────────

describe("Logo runFromBlock", () => {
    let logo;
    let mockActivity;
    let turtle0;
    let timeoutSpy;
    let savedTone;

    beforeEach(() => {
        setupLogoEnv({ withFlute: true });
        savedTone = global.Tone;
        turtle0 = createMockTurtle();
        mockActivity = createMockActivity(turtle0);
        logo = new Logo(mockActivity);
    });

    afterEach(() => {
        global.Tone = savedTone;
        if (timeoutSpy) {
            timeoutSpy.mockRestore();
            timeoutSpy = null;
        }
        jest.restoreAllMocks();
    });

    describe("step-mode scheduling", () => {
        test("queues step mode when turtle delay is TURTLESTEP", () => {
            turtle0.waitTime = 30;
            logo.turtleDelay = TURTLESTEP;
            logo.stopTurtle = false;

            logo.runFromBlock(logo, 0, 9, 0, ["arg"]);

            expect(turtle0.doWait).toHaveBeenCalledWith(0);
        });
    });

    describe("timeout scheduling", () => {
        test("schedules runFromBlockNow through mocked setTimeout", () => {
            timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
                fn();
                return 5;
            });
            logo.runFromBlockNow = jest.fn();
            logo.turtleDelay = 25;
            logo.stopTurtle = false;
            turtle0.waitTime = 10;

            logo.runFromBlock(logo, 0, 3, 1, "x");

            expect(timeoutSpy).toHaveBeenCalled();
            expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, 0, 3, 1, "x");
        });
    });

    describe("Transport scheduling", () => {
        test("uses Transport.schedule when available and clock is running", () => {
            const getSecondsAtTimeMock = jest.fn(t => t + 1);
            let scheduledCallback = null;
            const scheduleSpy = jest.fn((fn, time) => {
                scheduledCallback = fn;
                return "evt-1";
            });
            global.Tone = {
                ...savedTone,
                context: { state: "running" },
                Transport: {
                    start: jest.fn(),
                    stop: jest.fn(),
                    schedule: scheduleSpy,
                    cancel: jest.fn(),
                    getSecondsAtTime: getSecondsAtTimeMock,
                    get seconds() {
                        return 0;
                    },
                    set seconds(v) {},
                    get state() {
                        return "started";
                    }
                }
            };

            logo.runFromBlockNow = jest.fn();
            logo.turtleDelay = 0;
            logo.stopTurtle = false;
            turtle0.waitTime = 200;
            turtle0._transportTime = 10;

            logo.runFromBlock(logo, 0, 3, 1, "x");

            expect(scheduleSpy).toHaveBeenCalledWith(expect.any(Function), 10 + 200 / 1000);
            expect(logo.runFromBlockNow).not.toHaveBeenCalled();

            scheduledCallback(5.5);
            expect(getSecondsAtTimeMock).toHaveBeenCalledWith(5.5);
            expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, 0, 3, 1, "x");
        });

        test("falls back to setTimeout when Transport is unavailable", () => {
            global.Tone = { ...savedTone, Transport: undefined };
            timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
                fn();
                return 5;
            });

            logo.runFromBlockNow = jest.fn();
            logo.turtleDelay = 0;
            logo.stopTurtle = false;
            turtle0.waitTime = 200;

            logo.runFromBlock(logo, 0, 3, 1, "x");

            expect(timeoutSpy).toHaveBeenCalled();
            expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, 0, 3, 1, "x");
        });

        test("falls back to setTimeout when AudioContext is suspended", () => {
            global.Tone = {
                ...savedTone,
                context: { state: "suspended" },
                Transport: {
                    start: jest.fn(),
                    stop: jest.fn(),
                    schedule: jest.fn(),
                    cancel: jest.fn(),
                    getSecondsAtTime: jest.fn(() => 0),
                    get seconds() {
                        return 5;
                    },
                    set seconds(v) {},
                    get state() {
                        return "started";
                    }
                }
            };
            timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
                fn();
                return 5;
            });

            logo.runFromBlockNow = jest.fn();
            logo.turtleDelay = 0;
            logo.stopTurtle = false;
            turtle0.waitTime = 200;
            turtle0._transportTime = 10;

            logo.runFromBlock(logo, 0, 3, 1, "x");

            expect(global.Tone.Transport.schedule).not.toHaveBeenCalled();
            expect(timeoutSpy).toHaveBeenCalled();
            expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, 0, 3, 1, "x");
        });

        test("falls back to setTimeout when Transport clock is stopped", () => {
            global.Tone = {
                ...savedTone,
                context: { state: "running" },
                Transport: {
                    start: jest.fn(),
                    stop: jest.fn(),
                    schedule: jest.fn(),
                    cancel: jest.fn(),
                    getSecondsAtTime: jest.fn(() => 0),
                    get seconds() {
                        return 3;
                    },
                    set seconds(v) {},
                    get state() {
                        return "stopped";
                    }
                }
            };
            timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
                fn();
                return 5;
            });

            logo.runFromBlockNow = jest.fn();
            logo.turtleDelay = 0;
            logo.stopTurtle = false;
            turtle0.waitTime = 200;
            turtle0._transportTime = 10;

            logo.runFromBlock(logo, 0, 3, 1, "x");

            expect(global.Tone.Transport.schedule).not.toHaveBeenCalled();
            expect(timeoutSpy).toHaveBeenCalled();
            expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, 0, 3, 1, "x");
        });

        test("clamps transportTime to prevent scheduling in the past", () => {
            const scheduleSpy = jest.fn((fn, time) => "evt-clamp");
            global.Tone = {
                ...savedTone,
                context: { state: "running" },
                Transport: {
                    start: jest.fn(),
                    stop: jest.fn(),
                    schedule: scheduleSpy,
                    cancel: jest.fn(),
                    getSecondsAtTime: jest.fn(t => t),
                    get seconds() {
                        return 20;
                    },
                    set seconds(v) {},
                    get state() {
                        return "started";
                    }
                }
            };

            logo.runFromBlockNow = jest.fn();
            logo.turtleDelay = 0;
            logo.stopTurtle = false;
            turtle0.waitTime = 100;
            turtle0._transportTime = 10;

            logo.runFromBlock(logo, 0, 3, 1, "x");

            const computedTime = 10 + 100 / 1000;
            expect(computedTime).toBeLessThan(20);
            expect(scheduleSpy).toHaveBeenCalledWith(expect.any(Function), 20);
        });
    });
});

// ─── Logo runFromBlockNow ─────────────────────────────────────────────────────

describe("Logo runFromBlockNow", () => {
    let logo;
    let mockActivity;
    let turtle0;
    let timeoutSpy;

    beforeEach(() => {
        setupLogoEnv({ withFlute: true });
        turtle0 = createMockTurtle();
        mockActivity = createMockActivity(turtle0);
        logo = new Logo(mockActivity);
        mockActivity.logo = logo;
    });

    afterEach(() => {
        if (timeoutSpy) {
            timeoutSpy.mockRestore();
            timeoutSpy = null;
        }
        jest.restoreAllMocks();
    });

    describe("flow block execution", () => {
        test("highlights block when executing a flow block", () => {
            logo.blockList = [makeFlowBlock()];

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(mockActivity.blocks.highlight).toHaveBeenCalledWith(0, false);
        });

        test("arg block with null value stops without error message", () => {
            logo.blockList = [
                {
                    name: "myargblock",
                    value: null,
                    protoblock: { args: 0, dockTypes: ["numberout"] },
                    connections: [null],
                    isValueBlock: () => true,
                    isArgBlock: () => true
                }
            ];

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(mockActivity.errorMsg).not.toHaveBeenCalled();
            expect(logo.stopTurtle).toBe(true);
        });

        test("arg-block path prints and stops turtle", () => {
            timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
                fn();
                return 6;
            });
            logo.parseArg = jest.fn(() => 77);
            logo.blockList = [
                {
                    name: "width",
                    value: 77,
                    protoblock: { args: 0, dockTypes: ["numberout"] },
                    connections: [],
                    isValueBlock: () => false,
                    isArgBlock: () => true
                }
            ];

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(mockActivity.textMsg).toHaveBeenCalledWith("width: 77");
            expect(logo.stopTurtle).toBe(true);
        });
    });

    describe("profiling", () => {
        let originalPerformance;
        let originalPerformanceTracker;

        beforeEach(() => {
            originalPerformance = global.performance;
            originalPerformanceTracker = global.performanceTracker;
        });

        afterEach(() => {
            global.performance = originalPerformance;
            global.performanceTracker = originalPerformanceTracker;
        });

        test("profiling off does not record block timings", () => {
            global.performanceTracker = {
                isEnabled: () => false,
                enterBlock: jest.fn(),
                exitBlock: jest.fn(),
                disable: jest.fn()
            };
            global.performance = { now: jest.fn(() => 100) };
            mockActivity.blocks.visible = false;
            logo.blockList = [
                {
                    name: "noop",
                    protoblock: {
                        args: 0,
                        dockTypes: [],
                        flow: jest.fn(() => [null, null, true])
                    },
                    connections: [null],
                    isValueBlock: () => false,
                    isArgBlock: () => false
                }
            ];

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(global.performanceTracker.enterBlock).not.toHaveBeenCalled();
        });

        test("profiling on increments call count", () => {
            let now = 0;
            global.performanceTracker = {
                isEnabled: () => true,
                enterBlock: jest.fn(),
                exitBlock: jest.fn(),
                disable: jest.fn()
            };
            global.performance = {
                now: jest.fn(() => {
                    now += 5;
                    return now;
                })
            };
            mockActivity.blocks.visible = false;
            logo.blockList = [
                {
                    name: "noop",
                    protoblock: {
                        args: 0,
                        dockTypes: [],
                        flow: jest.fn(() => [null, null, true])
                    },
                    connections: [null],
                    isValueBlock: () => false,
                    isArgBlock: () => false
                }
            ];

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(global.performanceTracker.enterBlock).toHaveBeenCalledTimes(1);
        });
    });

    describe("limits and plugin dispatch", () => {
        test("stops execution and reports error when MAX_ITERATIONS exceeded", () => {
            logo._iterationBudget = 1;
            logo.blockList = [makeFlowBlock("noop")];

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(mockActivity.errorMsg).toHaveBeenCalled();
            expect(logo.stopTurtle).toBe(true);
        });

        test("evalFlowDict plugin executes when block name matches", () => {
            const effects = [];
            logo.evalFlowDict = { widgetblock: () => effects.push("ran") };
            logo.pluginReturnValue = null;
            logo.blockList = [
                {
                    name: "widgetblock",
                    protoblock: { args: 0, dockTypes: ["flow"] },
                    connections: [null],
                    isValueBlock: () => false,
                    isArgBlock: () => false
                }
            ];

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(effects).toContain("ran");
        });
    });

    describe("completion callbacks", () => {
        beforeEach(() => {
            timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
                fn();
                return 11;
            });
            logo.blockList = [makeFlowBlock()];
        });

        test("triggers afterSaveMIDI and clears flag when runningMIDI is set", () => {
            logo.runningMIDI = true;

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(mockActivity.save.afterSaveMIDI).toHaveBeenCalled();
            expect(logo.runningMIDI).toBe(false);
        });

        test("handles lilypond stats and notation buffering", () => {
            logo.runningLilypond = true;
            logo.collectingStats = true;
            logo.notationOutput = ["n1"];
            logo.notationNotes = { a: 1 };
            logo.notation.notationStaging[0] = ["st0"];
            logo.notation.notationDrumStaging[0] = ["dr0"];
            logo.recordingBuffer = {
                hasData: false,
                notationOutput: null,
                notationNotes: null,
                notationStaging: {},
                notationDrumStaging: {}
            };

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(getStatsFromNotation).toHaveBeenCalledWith(mockActivity);
            expect(mockActivity.statsWindow.displayInfo).toHaveBeenCalled();
            expect(logo.runningLilypond).toBe(false);

            logo.runningLilypond = false;
            logo.collectingStats = false;
            logo.runFromBlockNow(logo, 0, 0, 0, null);
            expect(logo.recordingBuffer.hasData).toBe(true);
        });

        test("triggers afterSaveAbc, afterSaveMxml, and playback-ready message", () => {
            logo.runningAbc = true;
            logo.runFromBlockNow(logo, 0, 0, 0, null);
            expect(mockActivity.save.afterSaveAbc).toHaveBeenCalled();

            logo.runningMxml = true;
            logo.runFromBlockNow(logo, 0, 0, 0, null);
            expect(mockActivity.save.afterSaveMxml).toHaveBeenCalled();

            turtle0.singer.suppressOutput = true;
            logo.recording = false;
            logo.runFromBlockNow(logo, 0, 0, 0, null);
            expect(mockActivity.errorMsg).toHaveBeenCalledWith("Playback is ready.", undefined);
        });

        test("executes evalOnStopList callbacks on natural completion", () => {
            logo.evalOnStopList = {
                hookA: "code-a",
                hookB: "code-b"
            };
            logo.safePluginExecute = jest.fn();

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(logo.safePluginExecute).toHaveBeenCalledTimes(2);
            expect(logo.safePluginExecute).toHaveBeenCalledWith("code-a", logo);
            expect(logo.safePluginExecute).toHaveBeenCalledWith("code-b", logo);
        });

        test("clears stale sounds array on natural completion", () => {
            const mockSound = { stop: jest.fn() };
            logo.sounds = [mockSound];
            logo.safePluginExecute = jest.fn();

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(logo.sounds).toEqual([]);
        });

        test("does not execute evalOnStopList when turtles are still running", () => {
            logo.safePluginExecute = jest.fn();
            logo.evalOnStopList = { hookA: "code-a" };
            mockActivity.turtles.running.mockReturnValue(true);

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(logo.safePluginExecute).not.toHaveBeenCalled();
        });

        test("does not clear sounds when turtles are still running", () => {
            logo.safePluginExecute = jest.fn();
            logo.sounds = [{ stop: jest.fn() }];
            mockActivity.turtles.running.mockReturnValue(true);

            logo.runFromBlockNow(logo, 0, 0, 0, null);

            expect(logo.sounds).toHaveLength(1);
        });
    });

    test("dispatches end-of-clamp signals and updates status matrix", () => {
        timeoutSpy = jest.spyOn(global, "setTimeout").mockImplementation(fn => {
            fn();
            return 31;
        });
        logo.statusMatrix = { isOpen: true, updateAll: jest.fn() };
        logo.blockList = [
            makeFlowBlock("print", [5, 2, null]),
            null,
            null,
            null,
            null,
            makeFlowBlock()
        ];
        turtle0.endOfClampSignals = { 0: ["sig1", "sig2"] };
        turtle0.butNotThese = { 0: [1] };
        turtle0.parameterQueue = [10];
        logo.turtleDelay = 10;

        logo.runFromBlockNow(logo, 0, 0, 0, null);

        expect(mockActivity.stage.dispatchEvent).toHaveBeenCalledWith("sig1");
        expect(logo.statusMatrix.updateAll).toHaveBeenCalled();
        expect(mockActivity.blocks.updateParameterBlock).toHaveBeenCalledWith(logo, 0, 10);
    });
});

// ─── Logo clearTurtleRun ──────────────────────────────────────────────────────

describe("Logo clearTurtleRun", () => {
    let logo;
    let mockActivity;
    let turtle0;

    beforeEach(() => {
        setupLogoEnv();
        turtle0 = createMockTurtle();
        mockActivity = createMockActivity(turtle0);
        logo = new Logo(mockActivity);
        logo.runFromBlockNow = jest.fn();
    });

    afterEach(() => jest.restoreAllMocks());

    test("clears timeout and resumes execution", () => {
        const clearTimeoutSpy = jest.spyOn(global, "clearTimeout").mockImplementation(() => {});
        turtle0.delayTimeout = 123;
        turtle0.delayParameters = { blk: 4, flow: 1, arg: ["p"] };

        logo.clearTurtleRun(0);

        expect(clearTimeoutSpy).toHaveBeenCalledWith(123);
        expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, 0, 4, 1, ["p"]);
    });

    describe("with Transport", () => {
        let savedTone;

        beforeEach(() => {
            savedTone = global.Tone;
        });

        afterEach(() => {
            global.Tone = savedTone;
        });

        test("cancels Transport-scheduled event and resumes execution", () => {
            const clearSpy = jest.fn();
            global.Tone = {
                ...savedTone,
                Transport: {
                    start: jest.fn(),
                    stop: jest.fn(),
                    cancel: jest.fn(),
                    clear: clearSpy,
                    getSecondsAtTime: jest.fn(() => 42),
                    get seconds() {
                        return 42;
                    },
                    set seconds(v) {}
                }
            };
            turtle0._transportEventId = "evt-3";
            turtle0.delayParameters = { blk: 7, flow: 0, arg: null };
            turtle0._transportTime = 50;

            logo.clearTurtleRun(0);

            expect(clearSpy).toHaveBeenCalledWith("evt-3");
            expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, 0, 7, 0, null);
        });
    });

    test("is no-op when no pending delay or Transport event", () => {
        logo.clearTurtleRun(0);

        expect(logo.runFromBlockNow).not.toHaveBeenCalled();
    });
});

// ─── Logo parseArg ────────────────────────────────────────────────────────────

describe("Logo parseArg", () => {
    let logo;
    let mockActivity;
    let mockTurtle;

    beforeEach(() => {
        setupLogoEnv();
        mockTurtle = createMockTurtle();
        mockTurtle.painter.color = 75;
        mockActivity = createMockActivity(mockTurtle);
        logo = new Logo(mockActivity);
        logo.returns = { 0: [] };
        logo.statusFields = [];
        logo.inStatusMatrix = false;
    });

    afterEach(() => jest.restoreAllMocks());

    describe("value resolution", () => {
        test("returns null for null block", () => {
            const result = logo.parseArg(logo, 0, null, 0, null);

            expect(result).toBeNull();
            expect(mockActivity.errorMsg).toHaveBeenCalled();
        });

        test("handles value blocks", () => {
            logo.blockList = [
                {
                    name: "number",
                    value: 42,
                    protoblock: { parameter: false },
                    isValueBlock: () => true
                }
            ];

            const result = logo.parseArg(logo, 0, 0, null, null);

            expect(result).toBe(42);
        });

        test("handles interval name blocks", () => {
            logo.blockList = [
                {
                    name: "intervalname",
                    value: "fifth",
                    protoblock: { parameter: false },
                    isValueBlock: () => false
                }
            ];

            logo.parseArg(logo, 0, 0, null, null);

            expect(getIntervalNumber).toHaveBeenCalledWith("fifth");
        });
    });

    describe("block type branches", () => {
        test("covers dectofrac, hue status mode, and returnValue branches", () => {
            logo.statusFields = [];
            logo.inStatusMatrix = false;
            logo.returns[0] = [1234];
            logo.blockList = [
                {
                    name: "dectofrac",
                    value: null,
                    connections: [3, 1],
                    protoblock: { parameter: false, dockTypes: ["numberout"] },
                    isValueBlock: () => false
                },
                {
                    name: "number",
                    value: 0.5,
                    protoblock: { parameter: false },
                    isValueBlock: () => true
                },
                {
                    name: "hue",
                    value: null,
                    connections: [3],
                    protoblock: { parameter: false, dockTypes: ["numberout"] },
                    isValueBlock: () => false
                },
                { name: "print" },
                {
                    name: "returnValue",
                    value: null,
                    connections: [],
                    protoblock: { parameter: false, dockTypes: ["numberout"] },
                    isValueBlock: () => false
                }
            ];

            expect(logo.parseArg(logo, 0, 0, null, null)).toBe("0.5");
            logo.inStatusMatrix = true;
            logo.parseArg(logo, 0, 2, null, null);
            expect(logo.statusFields).toContainEqual([2, "color"]);
            expect(logo.parseArg(logo, 0, 4, null, null)).toBe(1234);
        });

        test("covers arg-function, non-string interval, and fallback id branches", () => {
            logo.blockList = [
                {
                    name: "dynamic",
                    value: 0,
                    protoblock: { parameter: true, arg: jest.fn(() => 88) },
                    isValueBlock: () => false
                },
                {
                    name: "intervalname",
                    value: 42,
                    protoblock: { parameter: false },
                    isValueBlock: () => false
                },
                {
                    name: "flowblk",
                    value: null,
                    protoblock: { parameter: false, dockTypes: ["flow"] },
                    isValueBlock: () => false
                }
            ];

            expect(logo.parseArg(logo, 0, 0, null, null)).toBe(88);
            expect(mockTurtle.parameterQueue).toContain(0);
            expect(logo.parseArg(logo, 0, 1, null, null)).toBe(0);
            expect(logo.parseArg(logo, 0, 2, null, null)).toBe(2);
        });
    });

    describe("error and edge cases", () => {
        test("dectofrac with null child block shows NOINPUTERRORMSG and sets value to 0", () => {
            logo.blockList = [
                { name: "print", connections: [null, 1] },
                {
                    name: "dectofrac",
                    value: 99,
                    connections: [0, null],
                    protoblock: { parameter: false, dockTypes: ["numberout"] },
                    isValueBlock: () => false
                }
            ];

            const result = logo.parseArg(logo, 0, 1, 0, null);

            expect(mockActivity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 1);
            expect(logo.blockList[1].value).toBe(0);
            expect(result).toBe(0);
        });

        test("dectofrac with non-number child shows NANERRORMSG and sets value to 0", () => {
            logo.blockList = [
                { name: "print", connections: [null, 1] },
                {
                    name: "dectofrac",
                    value: 99,
                    connections: [0, 2],
                    protoblock: { parameter: false, dockTypes: ["numberout"] },
                    isValueBlock: () => false
                },
                {
                    name: "text",
                    value: "notanumber",
                    protoblock: { parameter: false },
                    isValueBlock: () => true
                }
            ];

            const result = logo.parseArg(logo, 0, 1, 0, null);

            expect(mockActivity.errorMsg).toHaveBeenCalledWith(NANERRORMSG, 1);
            expect(logo.blockList[1].value).toBe(0);
        });

        test("hue block outside status matrix returns current turtle color", () => {
            logo.blockList = [
                { name: "print", connections: [null, 1] },
                {
                    name: "hue",
                    value: null,
                    connections: [0],
                    protoblock: { parameter: false, dockTypes: ["numberout"] },
                    isValueBlock: () => false
                }
            ];

            const result = logo.parseArg(logo, 0, 1, 0, null);

            expect(result).toBe(75);
            expect(logo.blockList[1].value).toBe(75);
        });

        test("returnValue with empty returns stack returns 0", () => {
            logo.returns[0] = [];
            logo.blockList = [makeNumArgBlock("returnValue")];

            const result = logo.parseArg(logo, 0, 0, null, null);

            expect(result).toBe(0);
        });

        test("returnValue pops value from non-empty returns stack", () => {
            logo.returns[0] = [77];
            logo.blockList = [makeNumArgBlock("returnValue")];

            const result = logo.parseArg(logo, 0, 0, null, null);

            expect(result).toBe(77);
            expect(logo.returns[0].length).toBe(0);
        });
    });

    describe("plugin integration", () => {
        test("evalArgDict plugin result is reflected in parseArg return value", () => {
            logo.evalArgDict = {
                customplugin: (l, _turtle, blk) => {
                    l.blockList[blk].value = 555;
                }
            };
            logo.blockList = [{ ...makeNumArgBlock("customplugin", 0) }];

            const result = logo.parseArg(logo, 0, 0, null, null);

            expect(result).toBe(555);
        });

        test("unknown anyout block not in evalArgDict logs console error", () => {
            const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            logo.evalArgDict = {};
            logo.blockList = [makeNumArgBlock("unknownwidget")];

            logo.parseArg(logo, 0, 0, null, null);

            expect(errorSpy).toHaveBeenCalled();
        });
    });
});

// ─── Logo safePluginExecute ───────────────────────────────────────────────────

describe("Logo safePluginExecute", () => {
    let logo;
    let mockActivity;

    beforeEach(() => {
        setupLogoEnv();
        mockActivity = createMockActivity();
        logo = new Logo(mockActivity);
    });

    afterEach(() => jest.restoreAllMocks());

    test("executes function code and returns its result", () => {
        const result = logo.safePluginExecute(() => 42, logo, 0, 0, null);
        expect(result).toBe(42);
    });

    test("catches function execution errors and returns undefined", () => {
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const crashFn = () => {
            throw new Error("plugin crash");
        };
        const result = logo.safePluginExecute(crashFn, logo, 0, 0, null);
        expect(errorSpy).toHaveBeenCalled();
        expect(result).toBeUndefined();
    });

    test("returns undefined for non-string non-function code", () => {
        expect(logo.safePluginExecute(null, logo, 0, 0, null)).toBeUndefined();
        expect(logo.safePluginExecute(42, logo, 0, 0, null)).toBeUndefined();
        expect(logo.safePluginExecute([], logo, 0, 0, null)).toBeUndefined();
    });

    test("executes whitelisted unary math pattern (sin)", () => {
        logo.blockList = [{ name: "sin", value: null, connections: [null, 1] }];
        logo.parseArg = jest.fn(() => 0);
        const code =
            "const mathBlock = globalActivity.logo.blockList[blk];" +
            "const conns = mathBlock.connections;" +
            "mathBlock.value = Math.sin(logo.parseArg(logo, turtle, conns[1]));";
        const result = logo.safePluginExecute(code, logo, 0, 0, null);
        expect(result).toBe(Math.sin(0));
        expect(logo.blockList[0].value).toBe(Math.sin(0));
    });

    test("executes whitelisted unary math pattern (sqrt)", () => {
        logo.blockList = [{ name: "sqrt", value: null, connections: [null, 1] }];
        logo.parseArg = jest.fn(() => 4);
        const code =
            "const mathBlock = globalActivity.logo.blockList[blk];" +
            "const conns = mathBlock.connections;" +
            "mathBlock.value = Math.sqrt(logo.parseArg(logo, turtle, conns[1]));";
        const result = logo.safePluginExecute(code, logo, 0, 0, null);
        expect(result).toBe(2);
    });

    test("executes whitelisted binary math pattern (pow)", () => {
        logo.blockList = [{ name: "pow", value: null, connections: [null, 1, 2] }];
        logo.parseArg = jest.fn().mockReturnValueOnce(2).mockReturnValueOnce(3);
        const code =
            "const mathBlock = globalActivity.logo.blockList[blk];" +
            "const conns = mathBlock.connections;" +
            "var base = logo.parseArg(logo, turtle, conns[1]);" +
            "var exp  = logo.parseArg(logo, turtle, conns[2]);" +
            "mathBlock.value = Math.pow(base, exp);";
        const result = logo.safePluginExecute(code, logo, 0, 0, null);
        expect(result).toBe(8);
        expect(logo.blockList[0].value).toBe(8);
    });

    test("executes whitelisted math constant pattern (PI)", () => {
        logo.blockList = [{ name: "pi", value: null, connections: [null] }];
        const code =
            "const mathBlock = globalActivity.logo.blockList[blk];" +
            "const conns = mathBlock.connections;" +
            "mathBlock.value = Math.PI;";
        const result = logo.safePluginExecute(code, logo, 0, 0, null);
        expect(result).toBe(Math.PI);
        expect(logo.blockList[0].value).toBe(Math.PI);
    });

    test("executes whitelisted parameter plugin pattern (E)", () => {
        logo.blockList = [{ name: "e", value: null, connections: [null] }];
        const code = "logo.blockList[blk].value = Math.E;";
        const result = logo.safePluginExecute(code, logo, 0, 0, null);
        expect(result).toBe(Math.E);
        expect(logo.blockList[0].value).toBe(Math.E);
    });

    test("blocks arbitrary string code and emits console warning", () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        const result = logo.safePluginExecute("eval('alert(1)')", logo, 0, 0, null);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("Blocked"), expect.anything());
        expect(result).toBeUndefined();
    });
});

// ─── Logo dispatchTurtleSignals ───────────────────────────────────────────────

describe("Logo dispatchTurtleSignals", () => {
    let logo;
    let mockActivity;
    let mockTurtle;

    beforeEach(() => {
        setupLogoEnv();
        mockTurtle = createMockTurtle();
        mockActivity = createMockActivity(mockTurtle);
        logo = new Logo(mockActivity);
        logo.parseArg = jest.fn(() => 5);
        logo.deps.utils.delayExecution = jest.fn(() => Promise.resolve());
        // setcolor is not a motion block, so extendedGraphicsCounter stays 0
        logo.blockList = [null, { name: "setcolor", connections: [null, 1] }];
        mockTurtle.singer.embeddedGraphics = { 1: [1] };
    });

    afterEach(() => jest.restoreAllMocks());

    test("delegates to EmbeddedGraphicsScheduler", async () => {
        logo._graphicsScheduler.schedule = jest.fn();

        await logo.dispatchTurtleSignals(0, 1, 2, 3);

        expect(logo._graphicsScheduler.schedule).toHaveBeenCalledWith(0, 1, 2, 3);
    });

    // stepTime = Math.max(0, (beatValue - delay) * 995) / NOTEDIV; NOTEDIV=8
    test.each([
        // [beatValue, delay, expectedFactor, label]
        [1.3, 0, NOTEDIV / 16, "stepTime ~162 (> 100)"],
        [0.55, 0, NOTEDIV / 8, "stepTime ~68 (> 50, ≤ 100)"],
        [0.28, 0, NOTEDIV / 4, "stepTime ~35 (> 25, ≤ 50)"],
        [0.14, 0, NOTEDIV / 2, "stepTime ~17 (> 12.5, ≤ 25)"],
        [0.05, 0, NOTEDIV, "stepTime ~6 (≤ 12.5)"],
        [0.1, 0.5, NOTEDIV, "negative raw stepTime clamped to zero → NOTEDIV"]
    ])(
        "beatValue=%s delay=%s → dispatchFactor %s (%s)",
        async (beatValue, delay, expectedFactor) => {
            await logo.dispatchTurtleSignals(0, beatValue, 1, delay);
            expect(mockTurtle.singer.dispatchFactor).toBe(expectedFactor);
        }
    );
});

// ─── Logo timerManager ────────────────────────────────────────────────────────

describe("Logo timerManager getter and shim", () => {
    let logo;

    beforeEach(() => {
        setupLogoEnv();
        jest.useFakeTimers();
        logo = new Logo(createMockActivity());
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("timerManager exposes clearAll, getStats, and setGuardedTimeout", () => {
        expect(typeof logo.timerManager.clearAll).toBe("function");
        expect(typeof logo.timerManager.getStats).toBe("function");
        expect(typeof logo.timerManager.setGuardedTimeout).toBe("function");
    });

    test("clearAll returns a number", () => {
        const count = logo.timerManager.clearAll();
        expect(typeof count).toBe("number");
    });

    test("getStats returns an object with numeric active count", () => {
        const stats = logo.timerManager.getStats();
        expect(typeof stats).toBe("object");
        expect(stats).not.toBeNull();
        expect(typeof stats.active).toBe("number");
    });

    test("setGuardedTimeout fires callback when guard returns false", () => {
        const cb = jest.fn();
        logo.timerManager.setGuardedTimeout(cb, 50, () => false);
        jest.runAllTimers();
        expect(cb).toHaveBeenCalled();
    });

    test("setGuardedTimeout suppresses callback when guard returns true", () => {
        const cb = jest.fn();
        logo.timerManager.setGuardedTimeout(cb, 50, () => true);
        jest.runAllTimers();
        expect(cb).not.toHaveBeenCalled();
    });
});

// ─── Logo notation ────────────────────────────────────────────────────────────

describe("Logo updateNotation", () => {
    let logo;
    let mockActivity;

    beforeEach(() => {
        setupLogoEnv({ withFlute: true });
        mockActivity = createMockActivity();
        logo = new Logo(mockActivity);
    });

    afterEach(() => jest.restoreAllMocks());

    test("delegates without split and splits across measure boundaries", () => {
        logo.notation.notationDrumStaging[0] = [];

        logo.updateNotation(["C4"], 4, 0, false, null, false);
        expect(logo.notation.doUpdateNotation).toHaveBeenCalled();

        logo.notation.doUpdateNotation.mockClear();
        logo.updateNotation(["C4"], 0.5, 0, false, null, true);
        expect(logo.notation.notationInsertTie).toHaveBeenCalledWith(0);
        expect(logo.notation.doUpdateNotation).toHaveBeenCalled();
    });
});

describe("Logo notationMIDI", () => {
    let logo;

    beforeEach(() => {
        setupLogoEnv();
        logo = new Logo(createMockActivity());
    });

    afterEach(() => jest.restoreAllMocks());

    test("collects MIDI records and normalizes drum array", () => {
        logo._midiData = {};

        logo.notationMIDI("C4", ["kick"], 0.5, 0, 90, "piano");
        logo.notationMIDI("D4", null, 0.25, 0, 120, "flute");

        expect(logo._midiData[0]).toEqual([
            { note: "C4", duration: 0.5, bpm: 90, instrument: "piano", drum: "kick" },
            { note: "D4", duration: 0.25, bpm: 120, instrument: "flute", drum: null }
        ]);
    });
});

// ─── Logo media ───────────────────────────────────────────────────────────────

describe("Logo initMediaDevices", () => {
    let logo;
    let mockActivity;

    beforeEach(() => {
        setupLogoEnv({ withFlute: true });
        mockActivity = createMockActivity();
        logo = new Logo(mockActivity);
    });

    afterEach(() => jest.restoreAllMocks());

    test("sets mic/limit on success and reports microphone errors", () => {
        const open = jest.fn();
        logo.deps.Tone = { UserMedia: jest.fn(() => ({ open })) };

        logo.initMediaDevices();
        expect(open).toHaveBeenCalled();
        expect(logo.limit).toBe(16384);
        expect(logo.mic).toBeTruthy();

        logo.deps.Tone = {
            UserMedia: jest.fn(() => ({
                open: jest.fn(() => {
                    throw new Error("no mic");
                })
            }))
        };
        logo.initMediaDevices();
        expect(mockActivity.errorMsg).toHaveBeenCalledWith(
            "The microphone is not available.",
            undefined
        );
        expect(logo.mic).toBeNull();
    });
});

describe("Logo processShow", () => {
    let logo;
    let mockActivity;
    let turtle0;

    beforeEach(() => {
        setupLogoEnv({ withFlute: true });
        turtle0 = createMockTurtle();
        mockActivity = createMockActivity(turtle0);
        logo = new Logo(mockActivity);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("handles image/url/loadFile/default branches", () => {
        logo.processShow(0, null, 100, "data:image/png;base64,AAAA");
        expect(turtle0.doShowImage).toHaveBeenCalledWith(100, "data:image/png;base64,AAAA");

        logo.processShow(0, null, 100, "https://example.com/a.png");
        expect(turtle0.doShowURL).toHaveBeenCalledWith(100, "https://example.com/a.png");

        logo.blockList = [{ connections: [null, null, 1] }, { name: "loadFile" }];
        logo.processShow(0, 0, 55, ["file", "hello-world"]);
        expect(turtle0.doShowText).toHaveBeenCalledWith(55, "hello-world");

        logo.processShow(0, null, 20, 999);
        expect(turtle0.doShowText).toHaveBeenCalledWith(20, 999);
    });

    test("covers camera/video/file-url and missing file object branches", () => {
        const originalCameraValue = global.CAMERAVALUE;
        const originalVideoValue = global.VIDEOVALUE;
        global.CAMERAVALUE = "camera:1234567";
        global.VIDEOVALUE = "video:1234567";

        logo.processShow(0, null, 1, "camera:1234567");
        logo.processShow(0, null, 2, "video:1234567");
        logo.processShow(0, null, 3, "file://tmp/a.png");
        expect(doUseCamera.mock.calls.some(call => call[3] === false)).toBe(true);
        expect(doUseCamera.mock.calls.some(call => call[3] === true)).toBe(true);
        expect(turtle0.doShowURL).toHaveBeenCalledWith(3, "file://tmp/a.png");

        logo.blockList = [{ connections: [null, null, 1] }, { name: "loadFile" }];
        logo.processShow(0, 0, 12, null);
        expect(mockActivity.errorMsg).toHaveBeenCalledWith("You must select a file.", undefined);

        global.CAMERAVALUE = originalCameraValue;
        global.VIDEOVALUE = originalVideoValue;
    });
});
