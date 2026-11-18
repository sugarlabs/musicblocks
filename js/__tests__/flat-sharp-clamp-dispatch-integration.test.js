/**
 * @license
 * MusicBlocks
 * Copyright (C) 2026 Music Blocks Contributors
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

global._ = str => str;
global.i18nSolfege = str => str;
global.createjs = {
    Container: function () {
        return { addChild: () => {}, getBounds: () => ({ width: 10 }) };
    },
    Text: function () {
        return {};
    }
};
global.DEFAULTBLOCKSCALE = 1.0;
global.STANDARDBLOCKHEIGHT = 20;

const ProtoBlock = require("../protoblocks");
global.BaseBlock = ProtoBlock.BaseBlock;
global.ValueBlock = ProtoBlock.ValueBlock;
global.FlowBlock = ProtoBlock.FlowBlock;
global.LeftBlock = ProtoBlock.LeftBlock;
global.FlowClampBlock = ProtoBlock.FlowClampBlock;

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
        cancel: jest.fn(),
        get seconds() {
            return 0;
        },
        set seconds(v) {}
    }
}));
global.instruments = {};
global.instrumentsFilters = {};
global.instrumentsEffects = {};
global.DEFAULTVOICE = "electronic synth";
global.DEFAULTDRUM = "kick";
global.DEFAULTVOLUME = 100;
global.PREVIEWVOLUME = 80;
global.DRUMNAMES = { "cup drum": ["cup drum", "cup drum"] };
global.NOISENAMES = {};
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
global.MusicBlocks = { isRun: false };
global.Mouse = {
    getMouseFromTurtle: jest.fn(() => ({ MB: { listeners: [] } }))
};
global.Tone = {
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
};

jest.mock("tone", () => ({
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
}));

global.EmbeddedGraphicsScheduler =
    require("../embedded-graphics-scheduler").EmbeddedGraphicsScheduler;

const logoconstants = require("../logoconstants");
Object.assign(global, logoconstants);

const musicUtils = require("../utils/musicutils");
Object.assign(global, {
    pitchToNumber: musicUtils.pitchToNumber,
    getMeasurePosition: musicUtils.getMeasurePosition,
    getMeterAnchor: musicUtils.getMeterAnchor,
    getStepSizeUp: musicUtils.getStepSizeUp,
    getStepSizeDown: musicUtils.getStepSizeDown,
    calcOctave: musicUtils.calcOctave,
    getNote: musicUtils.getNote,
    nthDegreeToPitch: musicUtils.nthDegreeToPitch,
    keySignatureToMode: musicUtils.keySignatureToMode,
    scaleDegreeToPitchMapping: musicUtils.scaleDegreeToPitchMapping,
    frequencyToPitch: musicUtils.frequencyToPitch,
    pitchToFrequency: musicUtils.pitchToFrequency,
    numberToPitch: musicUtils.numberToPitch,
    getSolfege: musicUtils.getSolfege,
    noteIsSolfege: musicUtils.noteIsSolfege,
    SOLFEGENAMES1: musicUtils.SOLFEGENAMES1,
    NOTENAMES: musicUtils.NOTENAMES,
    NOTENAMES1: musicUtils.NOTENAMES1,
    SOLFEGECONVERSIONTABLE: musicUtils.SOLFEGECONVERSIONTABLE,
    ACCIDENTALNAMES: musicUtils.ACCIDENTALNAMES,
    ACCIDENTALVALUES: musicUtils.ACCIDENTALVALUES,
    NOTESFLAT: musicUtils.NOTESFLAT,
    NOTESSHARP: musicUtils.NOTESSHARP,
    NOTESTEP: musicUtils.NOTESTEP,
    MUSICALMODES: musicUtils.MUSICALMODES,
    SHARP: musicUtils.SHARP,
    FLAT: musicUtils.FLAT,
    DOUBLESHARP: musicUtils.DOUBLESHARP,
    DOUBLEFLAT: musicUtils.DOUBLEFLAT,
    NATURAL: musicUtils.NATURAL,
    A0: musicUtils.A0,
    C8: musicUtils.C8,
    getCurrentEDO: musicUtils.getCurrentEDO,
    getModeLength: musicUtils.getModeLength,
    getInterval: musicUtils.getInterval,
    getTemperament: musicUtils.getTemperament,
    getOctaveRatio: musicUtils.getOctaveRatio,
    isCustomTemperament: musicUtils.isCustomTemperament,
    isTrueEDO: musicUtils.isTrueEDO,
    TEMPERAMENT: musicUtils.TEMPERAMENT
});

const { Logo } = require("../logo");

global.Singer = require("../turtle-singer");
Singer.masterBPM = 90;
Singer.defaultBPMFactor = 1;
const realProcessNote = Singer.processNote;
const realAddScalarTransposition = Singer.addScalarTransposition;
const realProcessPitch = Singer.processPitch;

const setupRhythmActions = require("../turtleactions/RhythmActions");
const setupPitchActions = require("../turtleactions/PitchActions");
const { setupPitchBlocks } = require("../blocks/PitchBlocks");
const { setupRhythmBlocks } = require("../blocks/RhythmBlocks");

function createTurtle(id = 0) {
    return {
        id,
        singer: {
            inNoteBlock: [],
            notesPlayed: [0, 1],
            pickup: 0,
            noteValuePerBeat: 1,
            beatsPerMeasure: 4,
            beatFactor: 1,
            beatList: [],
            factorList: [],
            currentMeasure: null,
            multipleVoices: false,
            inNeighbor: [],
            noteValue: {},
            oscList: {},
            noteBeat: {},
            noteBeatValues: {},
            notePitches: {},
            noteOctaves: {},
            noteCents: {},
            noteHertz: {},
            noteDrums: {},
            embeddedGraphics: {},
            inDuplicate: false,
            backward: [],
            suppressOutput: true,
            drumStyle: [],
            invertList: [],
            justCounting: [],
            justMeasuring: [],
            arpeggio: [],
            intervals: [],
            semitoneIntervals: [],
            chordIntervals: [],
            ratioIntervals: [],
            transpositionRatios: [],
            transposition: 0,
            transpositionValues: [],
            scalarTransposition: 0,
            register: 0,
            currentOctave: 4,
            lastNotePlayed: null,
            keySignature: "C major",
            movable: false,
            dropPendingNotes: jest.fn()
        },
        painter: { closeSVG: jest.fn() },
        queue: [],
        parentFlowQueue: [],
        listeners: {},
        endOfClampSignals: {},
        companionTurtle: null,
        butNotThese: {}
    };
}

function createActivity(turtlesList) {
    const stageListeners = {};
    return {
        beginnerMode: false,
        palettes: {
            dict: new Proxy({}, { get: () => ({ add: jest.fn() }) })
        },
        blocks: {
            blockList: [],
            protoBlockDict: {},
            visible: false
        },
        turtles: {
            turtleList: turtlesList,
            ithTurtle: jest.fn(i => turtlesList[i]),
            getTurtle: jest.fn(i => turtlesList[i]),
            companionTurtle: jest.fn(t =>
                turtlesList[t]?.companionTurtle !== null &&
                turtlesList[t]?.companionTurtle !== undefined
                    ? turtlesList[t].companionTurtle
                    : t
            ),
            running: jest.fn(() => false),
            getTurtleCount: jest.fn(() => turtlesList.length),
            markAllAsStopped: jest.fn()
        },
        stage: {
            addEventListener: jest.fn((name, listener) => {
                if (!stageListeners[name]) stageListeners[name] = [];
                stageListeners[name].push(listener);
            }),
            removeEventListener: jest.fn((name, listener) => {
                if (stageListeners[name]) {
                    const idx = stageListeners[name].indexOf(listener);
                    if (idx !== -1) stageListeners[name].splice(idx, 1);
                    if (stageListeners[name].length === 0) delete stageListeners[name];
                }
            }),
            dispatchEvent: jest.fn(name => {
                if (typeof name === "string" && stageListeners[name]) {
                    const list = [...stageListeners[name]];
                    for (const fn of list) {
                        fn({ type: name });
                    }
                }
            }),
            _stageListeners: stageListeners
        },
        errorMsg: jest.fn(),
        onStopTurtle: jest.fn(),
        onRunTurtle: jest.fn()
    };
}

function makeValueBlock(name, value) {
    return {
        name,
        value,
        connections: [],
        protoblock: { parameter: false, dockTypes: ["anyout"] },
        isValueBlock: () => true,
        isArgBlock: () => false
    };
}

function makeHidden(prev) {
    return {
        name: "hidden",
        connections: [prev, null],
        protoblock: { args: 0, dockTypes: [null], flow: () => null },
        isValueBlock: () => false,
        isArgBlock: () => false
    };
}

function makeRealBlock(name, connections, proto) {
    return {
        name,
        connections,
        protoblock: proto,
        isValueBlock: () => false,
        isArgBlock: () => false
    };
}

function activeClampListeners(tur) {
    return Object.keys(tur.listeners).filter(
        k => k.startsWith("_flat_") || k.startsWith("_sharp_")
    );
}

function activeStageClampListeners(act) {
    return Object.keys(act.stage._stageListeners).filter(
        k => k.startsWith("_flat_") || k.startsWith("_sharp_")
    );
}

describe("FlatBlock and SharpBlock clamp lifecycle, nesting, and transposition state", () => {
    let logo;
    let turtlesList;
    let activity;
    let protos;
    let notePitchesAtSchedule;
    let noteOctavesAtSchedule;
    let scheduledForBlk;
    let transpositionAtResolution;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtlesList = [createTurtle(0), createTurtle(1)];
        activity = createActivity(turtlesList);
        logo = new Logo(activity);
        activity.logo = logo;
        logo.notation = { notationVoices: jest.fn() };
        logo.synth = { inTemperament: "equal", transport: { clear: jest.fn() } };
        notePitchesAtSchedule = null;
        noteOctavesAtSchedule = null;
        scheduledForBlk = null;
        transpositionAtResolution = null;

        Singer.processNote = jest.fn((_activity, _noteValue, _isOsc, blk, t) => {
            const tur = _activity.turtles.ithTurtle(t);
            scheduledForBlk = blk;
            notePitchesAtSchedule = [...tur.singer.notePitches[blk]];
            noteOctavesAtSchedule = [...tur.singer.noteOctaves[blk]];
        });

        Singer.addScalarTransposition = jest.fn((_logo, _turtle, note, octave) => [note, octave]);

        Singer.processPitch = jest.fn((act, note, octave, cents, t, blk) => {
            transpositionAtResolution = act.turtles.ithTurtle(t).singer.transposition;
            return realProcessPitch.call(Singer, act, note, octave, cents, t, blk);
        });

        setupRhythmActions(activity);
        setupPitchActions(activity);
        setupRhythmBlocks(activity);
        setupPitchBlocks(activity);
        protos = activity.blocks.protoBlockDict;
    });

    afterEach(() => {
        if (logo && logo._timerManager) {
            logo._timerManager.clearAll();
        }
        Singer.processNote = realProcessNote;
        Singer.addScalarTransposition = realAddScalarTransposition;
        Singer.processPitch = realProcessPitch;
    });

    function installProgram(wrappers, turtle = 0) {
        const newnote = makeRealBlock("newnote", [null, 1, null, 2], protos.newnote);
        const blocks = [newnote, makeValueBlock("number", 1 / 4), makeHidden(0)];

        let prev = 0;
        const clampIds = [];
        wrappers.forEach(name => {
            const clampId = blocks.length;
            const hiddenId = clampId + 1;
            blocks.push(makeRealBlock(name, [prev, null, hiddenId], protos[name]));
            blocks.push(makeHidden(clampId));
            clampIds.push(clampId);
            prev = clampId;
        });

        const pitchId = blocks.length;
        blocks.push(makeRealBlock("pitch", [prev, pitchId + 1, pitchId + 2, null], protos.pitch));
        blocks.push(makeValueBlock("solfege", "sol"));
        blocks.push(makeValueBlock("number", 4));

        newnote.connections[2] = clampIds.length > 0 ? clampIds[0] : pitchId;
        clampIds.forEach((clampId, i) => {
            blocks[clampId].connections[1] = i + 1 < clampIds.length ? clampIds[i + 1] : pitchId;
        });

        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
        return { clampIds, pitchId };
    }

    test("Test 1 — Flat nested in Flat: executes, resolves note transposed down by 2, and unwinds", () => {
        const tur = turtlesList[0];
        expect(tur.singer.transposition).toBe(0);

        installProgram(["flat", "flat"]);

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // At resolution time: two flats (-1 + -1 = -2)
        expect(transpositionAtResolution).toBe(-2);
        // sol (G) down 2 semitones is F
        expect(notePitchesAtSchedule).toEqual(["F"]);
        expect(noteOctavesAtSchedule).toEqual([4]);

        // After exit of both clamps:
        expect(tur.singer.transposition).toBe(0);
        // Flat listeners must be cleaned up
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 2 — Sharp nested in Sharp: executes, resolves note transposed up by 2, and unwinds", () => {
        const tur = turtlesList[0];
        expect(tur.singer.transposition).toBe(0);

        installProgram(["sharp", "sharp"]);

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // At resolution time: two sharps (+1 + +1 = +2)
        expect(transpositionAtResolution).toBe(2);
        // sol (G) up 2 semitones is A
        expect(notePitchesAtSchedule).toEqual(["A"]);
        expect(noteOctavesAtSchedule).toEqual([4]);

        // After exit of both clamps:
        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 3 — Flat inside Sharp: combined effect resolves to 0 and unwinds cleanly", () => {
        const tur = turtlesList[0];
        expect(tur.singer.transposition).toBe(0);

        installProgram(["sharp", "flat"]);

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // Sharp (+1) then Flat (-1) = 0
        expect(transpositionAtResolution).toBe(0);
        // sol (G) with 0 transposition is G
        expect(notePitchesAtSchedule).toEqual(["G"]);
        expect(noteOctavesAtSchedule).toEqual([4]);

        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 4 — Sharp inside Flat: reverse nesting resolves to 0 and unwinds cleanly", () => {
        const tur = turtlesList[0];
        expect(tur.singer.transposition).toBe(0);

        installProgram(["flat", "sharp"]);

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        expect(transpositionAtResolution).toBe(0);
        expect(notePitchesAtSchedule).toEqual(["G"]);
        expect(noteOctavesAtSchedule).toEqual([4]);

        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 5 — Flat inside Invert: inverted flat shifts transposition up and unwinds cleanly", () => {
        const tur = turtlesList[0];
        // Outer Invert sets invertList
        tur.singer.invertList.push(["sol", 4, "even"]);

        installProgram(["flat"]);

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // Flat inside Invert applies -(-1) = +1
        expect(transpositionAtResolution).toBe(1);
        // After Flat exits, transposition must return to 0
        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 6 — Invert inside Flat: symmetrical transposition restoration even if invertList state changes", () => {
        const tur = turtlesList[0];
        const flatProto = protos.flat;

        activity.blocks.blockList[1] = { connections: [0, 10, 2] };
        logo.blockList = activity.blocks.blockList;

        // Enter Flat while invertList is empty -> applied -1
        flatProto.flow([10], logo, 0, 1);
        expect(tur.singer.transposition).toBe(-1);

        // Simulate an inner Invert block executing and pushing to invertList
        tur.singer.invertList.push(["sol", 4, "even"]);

        // When Flat exits, even though invertList is non-empty, it must restore the exact -1 applied on entry
        const listenerName = activeClampListeners(tur)[0];
        tur.listeners[listenerName]();

        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
    });

    test("Test 7 — Repeated execution: running clamps repeatedly does not leak listeners", () => {
        const tur = turtlesList[0];
        installProgram(["flat"]);

        for (let i = 0; i < 3; i++) {
            notePitchesAtSchedule = null;
            noteOctavesAtSchedule = null;
            logo.runFromBlockNow(logo, 0, 0, 1, null);
            expect(notePitchesAtSchedule).toEqual(["F♯"]);
            expect(noteOctavesAtSchedule).toEqual([4]);
            expect(tur.singer.transposition).toBe(0);
            expect(activeClampListeners(tur)).toEqual([]);
            expect(activeStageClampListeners(activity)).toEqual([]);
        }
    });

    test("Test 8 — Multiple turtles: clamp listeners and state are isolated across turtles", () => {
        const tur0 = turtlesList[0];
        const tur1 = turtlesList[1];
        const flatProto = protos.flat;
        const sharpProto = protos.sharp;

        activity.blocks.blockList[10] = { connections: [0, 11, 12] };
        activity.blocks.blockList[20] = { connections: [0, 21, 22] };
        logo.blockList = activity.blocks.blockList;

        // Turtle 0 enters Flat
        flatProto.flow([11], logo, 0, 10);
        expect(tur0.singer.transposition).toBe(-1);
        expect(tur1.singer.transposition).toBe(0);

        // Turtle 1 enters Sharp
        sharpProto.flow([21], logo, 1, 20);
        expect(tur0.singer.transposition).toBe(-1);
        expect(tur1.singer.transposition).toBe(1);

        // Distinct listener names on distinct turtles
        const tur0ListenerName = Object.keys(tur0.listeners)[0];
        const tur1ListenerName = Object.keys(tur1.listeners)[0];
        expect(tur0ListenerName).toBe("_flat_0_10");
        expect(tur1ListenerName).toBe("_sharp_1_20");

        // Fire turtle 0 listener: only tur0 affected
        tur0.listeners[tur0ListenerName]();
        expect(tur0.singer.transposition).toBe(0);
        expect(tur1.singer.transposition).toBe(1);

        // Fire turtle 1 listener: tur1 restored
        tur1.listeners[tur1ListenerName]();
        expect(tur1.singer.transposition).toBe(0);
    });

    test("Test 9 — Early termination: dispatchUnissuedSignals unwinds state and cleans up listeners", () => {
        const tur = turtlesList[0];
        const { clampIds } = installProgram(["flat", "flat"]);

        // Manually trigger flow on outer and inner clamps to simulate entering without exiting
        protos.flat.flow([clampIds[1]], logo, 0, clampIds[0]);
        expect(tur.singer.transposition).toBe(-1);

        protos.flat.flow([20], logo, 0, clampIds[1]);
        expect(tur.singer.transposition).toBe(-2);

        expect(activeClampListeners(tur)).toHaveLength(2);

        // Simulate early termination / stop dispatching unissued signals
        logo.dispatchUnissuedSignals(tur);

        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toHaveLength(0);
        expect(activeStageClampListeners(activity)).toHaveLength(0);
    });

    test("Test 10 — Restart / Re-entry with identical blk creates unique listener names", () => {
        const tur = turtlesList[0];
        const flatProto = protos.flat;

        activity.blocks.blockList[5] = { connections: [0, 6, 7] };
        logo.blockList = activity.blocks.blockList;

        // First invocation with blk = 5
        flatProto.flow([6], logo, 0, 5);
        expect(tur.singer.transposition).toBe(-1);
        expect(tur.listeners["_flat_0_5"]).toBeDefined();

        // Re-entrant invocation with same blk = 5 while first is active
        flatProto.flow([6], logo, 0, 5);
        expect(tur.singer.transposition).toBe(-2);
        expect(tur.listeners["_flat_0_5_1"]).toBeDefined();

        // Exit second invocation
        tur.listeners["_flat_0_5_1"]();
        expect(tur.singer.transposition).toBe(-1);
        expect(tur.listeners["_flat_0_5_1"]).toBeUndefined();
        expect(tur.listeners["_flat_0_5"]).toBeDefined();

        // Exit first invocation
        tur.listeners["_flat_0_5"]();
        expect(tur.singer.transposition).toBe(0);
        expect(tur.listeners["_flat_0_5"]).toBeUndefined();
    });

    test("Test 11 — Sequential execution: Flat followed by Sharp transitions smoothly with no leaked state", () => {
        const tur = turtlesList[0];

        installProgram(["flat"]);
        notePitchesAtSchedule = null;
        logo.runFromBlockNow(logo, 0, 0, 1, null);
        expect(notePitchesAtSchedule).toEqual(["F♯"]);
        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);

        installProgram(["sharp"]);
        notePitchesAtSchedule = null;
        logo.runFromBlockNow(logo, 0, 0, 1, null);
        expect(notePitchesAtSchedule).toEqual(["G♯"]);
        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 12 — Real musical output: sol4 under flat resolves as F♯4, sol4 under sharp resolves as G♯4", () => {
        installProgram(["flat"]);
        logo.runFromBlockNow(logo, 0, 0, 1, null);
        // G4 (sol4) down 1 semitone is F♯4
        expect(notePitchesAtSchedule).toEqual(["F\u266F"]);
        expect(noteOctavesAtSchedule).toEqual([4]);

        installProgram(["sharp"]);
        logo.runFromBlockNow(logo, 0, 0, 1, null);
        // G4 (sol4) up 1 semitone is G♯4
        expect(notePitchesAtSchedule).toEqual(["G\u266F"]);
        expect(noteOctavesAtSchedule).toEqual([4]);
    });

    test("Test 13 — Companion turtle: transposition modifies companion turtle's singer, listeners are registered on executing turtle", () => {
        const executingTur = turtlesList[0];
        const companionTur = turtlesList[1];
        executingTur.companionTurtle = 1;

        activity.blocks.blockList[1] = { connections: [0, 2, 3] };
        logo.blockList = activity.blocks.blockList;

        protos.flat.flow([2], logo, 0, 1);

        // Executing turtle's listeners contains the listener
        expect(executingTur.listeners["_flat_0_1"]).toBeDefined();
        // Companion turtle's singer transposition was modified
        expect(companionTur.singer.transposition).toBe(-1);
        expect(executingTur.singer.transposition).toBe(0);

        // Fire listener
        executingTur.listeners["_flat_0_1"]();
        expect(companionTur.singer.transposition).toBe(0);
        expect(executingTur.listeners["_flat_0_1"]).toBeUndefined();
    });

    test("Test 14 — Graceful handling when blk is undefined, null, or not in blockList", () => {
        const tur = turtlesList[0];
        const invalidBlockIds = [undefined, null, "", "nonexistent", 99999];

        // 1. In standard execution (not mouse run), invalid blk must safely return
        // without mutating transposition or leaking listeners on turtle or stage.
        global.MusicBlocks.isRun = false;
        for (const blk of invalidBlockIds) {
            tur.singer.transposition = 0;
            tur.listeners = {};

            expect(() => {
                protos.flat.flow([2], logo, 0, blk);
            }).not.toThrow();
            expect(tur.singer.transposition).toBe(0);
            expect(activeClampListeners(tur)).toEqual([]);
            expect(activeStageClampListeners(activity)).toEqual([]);

            expect(() => {
                protos.sharp.flow([2], logo, 0, blk);
            }).not.toThrow();
            expect(tur.singer.transposition).toBe(0);
            expect(activeClampListeners(tur)).toEqual([]);
            expect(activeStageClampListeners(activity)).toEqual([]);
        }

        // 2. In mouse execution mode (MusicBlocks.isRun = true), listener is tracked
        // in mouse.MB.listeners and unwinds symmetrically when triggered.
        try {
            global.MusicBlocks.isRun = true;
            const mockListeners = [];
            global.Mouse.getMouseFromTurtle.mockReturnValue({ MB: { listeners: mockListeners } });

            tur.singer.transposition = 0;
            tur.listeners = {};
            protos.flat.flow([2], logo, 0, undefined);

            expect(tur.singer.transposition).toBe(-1);
            expect(mockListeners.length).toBe(1);
            const flatListenerName = mockListeners[0];
            expect(typeof tur.listeners[flatListenerName]).toBe("function");

            // Firing listener restores state and cleans up
            tur.listeners[flatListenerName]();
            expect(tur.singer.transposition).toBe(0);
            expect(tur.listeners[flatListenerName]).toBeUndefined();

            // Sharp in mouse mode
            mockListeners.length = 0;
            tur.singer.transposition = 0;
            tur.listeners = {};
            protos.sharp.flow([2], logo, 0, 99999);

            expect(tur.singer.transposition).toBe(1);
            expect(mockListeners.length).toBe(1);
            const sharpListenerName = mockListeners[0];
            expect(typeof tur.listeners[sharpListenerName]).toBe("function");

            tur.listeners[sharpListenerName]();
            expect(tur.singer.transposition).toBe(0);
            expect(tur.listeners[sharpListenerName]).toBeUndefined();

            // 3. When in mouse mode but no mouse completion route exists (mouse is null),
            // safely return without mutating state or leaking listeners.
            global.Mouse.getMouseFromTurtle.mockReturnValue(null);
            tur.singer.transposition = 0;
            tur.listeners = {};
            protos.flat.flow([2], logo, 0, undefined);
            expect(tur.singer.transposition).toBe(0);
            expect(activeClampListeners(tur)).toEqual([]);

            protos.sharp.flow([2], logo, 0, undefined);
            expect(tur.singer.transposition).toBe(0);
            expect(activeClampListeners(tur)).toEqual([]);
        } finally {
            global.MusicBlocks.isRun = false;
        }
    });

    test("Test 14 — Missing, null, or undefined exit connection prevents transposition modification and listener installation", () => {
        const tur = turtlesList[0];

        const testCases = [
            { label: "null final connection", connections: [null, 1, null] },
            { label: "undefined final connection", connections: [null, 1, undefined] },
            { label: "empty connections array", connections: [] },
            { label: "malformed connections string", connections: "malformed" },
            { label: "null connections property", connections: null }
        ];

        for (const tc of testCases) {
            const blockIndex = 500;
            activity.blocks.blockList = {
                [blockIndex]: {
                    name: "flat",
                    connections: tc.connections,
                    protoblock: protos.flat
                }
            };

            // Test FlatBlock
            tur.singer.transposition = 0;
            tur.listeners = {};
            activity.stage.addEventListener.mockClear();

            expect(() => {
                const res = protos.flat.flow([2], logo, 0, blockIndex);
                expect(res).toEqual([2, 1]);
            }).not.toThrow();
            expect(tur.singer.transposition).toBe(0);
            expect(activeClampListeners(tur)).toEqual([]);
            expect(activity.stage.addEventListener).not.toHaveBeenCalled();
            expect(activeStageClampListeners(activity)).toEqual([]);

            // Test SharpBlock
            activity.blocks.blockList[blockIndex].name = "sharp";
            activity.blocks.blockList[blockIndex].protoblock = protos.sharp;

            tur.singer.transposition = 0;
            tur.listeners = {};
            activity.stage.addEventListener.mockClear();

            expect(() => {
                const res = protos.sharp.flow([2], logo, 0, blockIndex);
                expect(res).toEqual([2, 1]);
            }).not.toThrow();
            expect(tur.singer.transposition).toBe(0);
            expect(activeClampListeners(tur)).toEqual([]);
            expect(activity.stage.addEventListener).not.toHaveBeenCalled();
            expect(activeStageClampListeners(activity)).toEqual([]);
        }
    });

    function installActionClampProgram(clampType, useExplicitReturn = false, sharedExit = false) {
        protos.do = {
            args: 1,
            dockTypes: [null, "anyin"],
            flow: (args, lgo) => {
                if (args && args[0] in lgo.actions) {
                    return [lgo.actions[args[0]], 1];
                }
            }
        };
        protos.return = {
            args: 0,
            dockTypes: [null],
            flow: () => [null, null, true]
        };

        const newnote = makeRealBlock("newnote", [null, 1, 3, 2], protos.newnote);
        const duration = makeValueBlock("number", 0.25);
        duration.connections = [0];
        const newnoteHidden = makeHidden(0);

        // Outer clamp [3] -> child [5] outer note 1, exit [4] outer hidden
        const outerClamp = makeRealBlock(clampType, [0, 5, 4], protos[clampType]);
        const outerHidden = {
            name: "hidden",
            connections: [3, null],
            protoblock: { args: 0, dockTypes: [null], flow: () => null },
            isValueBlock: () => false,
            isArgBlock: () => false
        };

        // Outer note 1 [5] -> next [8] doBlock
        const outerNote1 = makeRealBlock("pitch", [3, 6, 7, 8], protos.pitch);
        const solfege1 = makeValueBlock("solfege", "sol");
        solfege1.connections = [5];
        const octave1 = makeValueBlock("number", 4);
        octave1.connections = [5];

        // Do block [8] -> next [10] outer note 2
        const doBlock = makeRealBlock("do", [5, 9, 10], protos.do);
        const actionName = makeValueBlock("text", "mySub");
        actionName.connections = [8];

        // Outer note 2 [10] -> next null
        const outerNote2 = makeRealBlock("pitch", [8, 11, 12, null], protos.pitch);
        const solfege2 = makeValueBlock("solfege", "sol");
        solfege2.connections = [10];
        const octave2 = makeValueBlock("number", 4);
        octave2.connections = [10];

        // Subroutine: inner clamp [15]
        const innerExit = sharedExit ? 4 : 16;
        const innerClamp = makeRealBlock(clampType, [null, 17, innerExit], protos[clampType]);
        const innerHidden = makeHidden(15);

        // Inner note [17] -> next [20] return if explicit return, else null
        const innerNext = useExplicitReturn ? 20 : null;
        const innerNote = makeRealBlock("pitch", [15, 18, 19, innerNext], protos.pitch);
        const innerSolfege = makeValueBlock("solfege", "sol");
        innerSolfege.connections = [17];
        const innerOctave = makeValueBlock("number", 4);
        innerOctave.connections = [17];

        const blocks = [];
        blocks[0] = newnote;
        blocks[1] = duration;
        blocks[2] = newnoteHidden;
        blocks[3] = outerClamp;
        blocks[4] = outerHidden;
        blocks[5] = outerNote1;
        blocks[6] = solfege1;
        blocks[7] = octave1;
        blocks[8] = doBlock;
        blocks[9] = actionName;
        blocks[10] = outerNote2;
        blocks[11] = solfege2;
        blocks[12] = octave2;
        blocks[15] = innerClamp;
        blocks[16] = innerHidden;
        blocks[17] = innerNote;
        blocks[18] = innerSolfege;
        blocks[19] = innerOctave;
        if (useExplicitReturn) {
            const returnBlock = makeRealBlock("return", [17, null], protos.return);
            blocks[20] = returnBlock;
        }

        logo.actions = { mySub: 15 };
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    }

    test("Test 15 — Scoped clamp dispatch in interpreter: nested action with normal return maintains outer Flat clamp transposition", () => {
        const tur = turtlesList[0];
        const notesHistory = [];
        Singer.processPitch = jest.fn((act, note, octave, cents, t, blk) => {
            notesHistory.push({
                blk,
                note,
                octave,
                transposition: act.turtles.ithTurtle(t).singer.transposition
            });
            return realProcessPitch.call(Singer, act, note, octave, cents, t, blk);
        });

        installActionClampProgram("flat", false);
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // Note 1 (outer flat clamp): transposition = -1
        expect(notesHistory[0].blk).toBe(5);
        expect(notesHistory[0].transposition).toBe(-1);

        // Note 2 (inner flat clamp in action): transposition = -2
        expect(notesHistory[1].blk).toBe(17);
        expect(notesHistory[1].transposition).toBe(-2);

        // Note 3 (outer flat clamp after action returns): transposition must still be -1
        expect(notesHistory[2].blk).toBe(10);
        expect(notesHistory[2].transposition).toBe(-1);

        // After all invocations have exited cleanly:
        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 16 — Scoped clamp dispatch in interpreter: nested action with normal return maintains outer Sharp clamp transposition", () => {
        const tur = turtlesList[0];
        const notesHistory = [];
        Singer.processPitch = jest.fn((act, note, octave, cents, t, blk) => {
            notesHistory.push({
                blk,
                note,
                octave,
                transposition: act.turtles.ithTurtle(t).singer.transposition
            });
            return realProcessPitch.call(Singer, act, note, octave, cents, t, blk);
        });

        installActionClampProgram("sharp", false);
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // Note 1 (outer sharp clamp): transposition = +1
        expect(notesHistory[0].blk).toBe(5);
        expect(notesHistory[0].transposition).toBe(1);

        // Note 2 (inner sharp clamp in action): transposition = +2
        expect(notesHistory[1].blk).toBe(17);
        expect(notesHistory[1].transposition).toBe(2);

        // Note 3 (outer sharp clamp after action returns): transposition must still be +1
        expect(notesHistory[2].blk).toBe(10);
        expect(notesHistory[2].transposition).toBe(1);

        // After all invocations have exited cleanly:
        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 17 — Scoped clamp dispatch in interpreter: action executing explicit return inside Flat clamp only dispatches inner completion signal", () => {
        const tur = turtlesList[0];
        const notesHistory = [];
        Singer.processPitch = jest.fn((act, note, octave, cents, t, blk) => {
            notesHistory.push({
                blk,
                note,
                octave,
                transposition: act.turtles.ithTurtle(t).singer.transposition
            });
            return realProcessPitch.call(Singer, act, note, octave, cents, t, blk);
        });

        installActionClampProgram("flat", true, true);
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // Note 1 (outer flat clamp): transposition = -1
        expect(notesHistory[0].blk).toBe(5);
        expect(notesHistory[0].transposition).toBe(-1);

        // Note 2 (inner flat clamp before explicit return): transposition = -2
        expect(notesHistory[1].blk).toBe(17);
        expect(notesHistory[1].transposition).toBe(-2);

        // Note 3 (outer flat clamp after return unwinds): transposition must still be -1
        expect(notesHistory[2].blk).toBe(10);
        expect(notesHistory[2].transposition).toBe(-1);

        // After all invocations have exited cleanly:
        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 18 — Scoped clamp dispatch in interpreter: action executing explicit return inside Sharp clamp only dispatches inner completion signal", () => {
        const tur = turtlesList[0];
        const notesHistory = [];
        Singer.processPitch = jest.fn((act, note, octave, cents, t, blk) => {
            notesHistory.push({
                blk,
                note,
                octave,
                transposition: act.turtles.ithTurtle(t).singer.transposition
            });
            return realProcessPitch.call(Singer, act, note, octave, cents, t, blk);
        });

        installActionClampProgram("sharp", true, true);
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // Note 1 (outer sharp clamp): transposition = +1
        expect(notesHistory[0].blk).toBe(5);
        expect(notesHistory[0].transposition).toBe(1);

        // Note 2 (inner sharp clamp before explicit return): transposition = +2
        expect(notesHistory[1].blk).toBe(17);
        expect(notesHistory[1].transposition).toBe(2);

        // Note 3 (outer sharp clamp after return unwinds): transposition must still be +1
        expect(notesHistory[2].blk).toBe(10);
        expect(notesHistory[2].transposition).toBe(1);

        // After all invocations have exited cleanly:
        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });

    test("Test 19 — Stop and stopTurtleRun unwinds all unissued completion signals across nested clamps", () => {
        const tur = turtlesList[0];
        installProgram(["flat", "sharp"]);

        // Enter both clamps manually
        protos.flat.flow([0], logo, 0, 3);
        protos.sharp.flow([0], logo, 0, 5);

        // Now both clamps are active; calling stopTurtleRun unwinds all unissued signals
        logo.stopTurtleRun(0);

        expect(tur.singer.transposition).toBe(0);
        expect(activeClampListeners(tur)).toEqual([]);
        expect(activeStageClampListeners(activity)).toEqual([]);
    });
});
