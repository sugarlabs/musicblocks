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

/**
 * Integration coverage for the "block palette -> Logo interpreter" seam, extending the
 * pattern established by `noteclamp-beat-doublequeue.test.js` from drum dispatch to pitch
 * dispatch.
 *
 * A "pitch" block placed inside a "newnote" duration clamp does not schedule sound itself:
 * `Singer.PitchActions.playPitch` (js/turtleactions/PitchActions.js) delegates to the real
 * `Singer.processPitch` (js/turtle-singer.js), which resolves the note name/octave/cents
 * through the real note-name pipeline (`getNote`, js/utils/musicutils.js) and stores the
 * result on `tur.singer.notePitches`/`noteOctaves`/`noteHertz`, keyed by the *clamp's* block
 * id (not the pitch block's own id) because the clamp already pushed itself onto
 * `tur.singer.inNoteBlock` before the pitch child runs.
 *
 * Once the clamp's children finish, the real interpreter (`Logo.runFromBlockNow`, js/logo.js)
 * fires the clamp's end-of-clamp signal, which invokes `Singer.RhythmActions.playNote`'s
 * internal listener and calls `Singer.processNote` with that same clamp block id. `processNote`
 * is where the resolved note is hertz-converted and handed to `activity.logo.synth.trigger`
 * (the Tone.js wrapper) for scheduling; that hand-off is already covered by dedicated
 * `processNote`/synth-engine unit tests (see `turtle-singer.test.js`), so this test draws the
 * same boundary the codebase's own noteclamp regression test uses and mocks `processNote` to
 * observe what reaches it.
 *
 * This test drives the real `Logo`, `Singer.PitchActions`, and `Singer.RhythmActions` through
 * `Logo.runFromBlockNow` and asserts that a "sol" pitch block, dispatched from inside a 1/3-beat
 * note clamp, resolves to the correct note/octave via the real musicutils pipeline and reaches
 * the note-scheduling boundary exactly once, keyed by the clamp block.
 */

// Setup global mocks BEFORE requiring the module (mirror of noteclamp-beat-doublequeue.test.js).
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

// Real note-name resolution pipeline, exactly as PitchActions.test.js requires it, so
// Singer.processPitch resolves "sol"/4 through the genuine musicutils implementation
// instead of a stand-in.
const musicUtils = require("../utils/musicutils");
Object.assign(global, {
    pitchToNumber: musicUtils.pitchToNumber,
    getStepSizeUp: musicUtils.getStepSizeUp,
    getStepSizeDown: musicUtils.getStepSizeDown,
    calcOctave: musicUtils.calcOctave,
    getNote: musicUtils.getNote,
    nthDegreeToPitch: musicUtils.nthDegreeToPitch,
    keySignatureToMode: musicUtils.keySignatureToMode,
    frequencyToPitch: musicUtils.frequencyToPitch,
    pitchToFrequency: musicUtils.pitchToFrequency,
    numberToPitch: musicUtils.numberToPitch,
    ACCIDENTALNAMES: musicUtils.ACCIDENTALNAMES,
    ACCIDENTALVALUES: musicUtils.ACCIDENTALVALUES,
    NOTESFLAT: musicUtils.NOTESFLAT,
    NOTESSHARP: musicUtils.NOTESSHARP,
    NOTESTEP: musicUtils.NOTESTEP,
    MUSICALMODES: musicUtils.MUSICALMODES,
    SHARP: musicUtils.SHARP,
    FLAT: musicUtils.FLAT,
    getCurrentEDO: musicUtils.getCurrentEDO,
    getModeLength: musicUtils.getModeLength,
    getInterval: musicUtils.getInterval,
    getTemperament: musicUtils.getTemperament,
    getOctaveRatio: musicUtils.getOctaveRatio,
    isCustomTemperament: musicUtils.isCustomTemperament,
    isTrueEDO: musicUtils.isTrueEDO,
    TEMPERAMENT: musicUtils.TEMPERAMENT
});

const { Queue, Logo } = require("../logo");

// The real Singer class (js/turtle-singer.js), not a stand-in: Singer.processPitch runs for
// real so the note-name resolution itself is under test. Only the note-scheduling boundary
// (processNote, the hand-off to the Tone.js-driving synth engine) and the transposition helper
// (an unrelated concern, already covered elsewhere) are mocked, mirroring the same boundary
// `turtle-singer.test.js` and `noteclamp-beat-doublequeue.test.js` already draw.
global.Singer = require("../turtle-singer");
Singer.masterBPM = 90;
Singer.defaultBPMFactor = 1;
Singer.addScalarTransposition = jest.fn((_logo, _turtle, note, octave) => [note, octave]);
Singer.processNote = jest.fn();

const setupRhythmActions = require("../turtleactions/RhythmActions");
const setupPitchActions = require("../turtleactions/PitchActions");

function createTurtle() {
    return {
        id: 0,
        singer: {
            inNoteBlock: [],
            notesPlayed: [0, 1],
            pickup: 0,
            noteValuePerBeat: 1,
            beatsPerMeasure: 4,
            beatFactor: 1,
            beatList: [],
            factorList: [],
            currentBeat: null,
            currentMeasure: null,
            multipleVoices: false,
            inNeighbor: [],
            neighborArgBeat: [],
            neighborArgCurrentBeat: [],
            neighborNoteValue: 1,
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
            delayedNotes: [],
            inDuplicate: false,
            backward: [],
            suppressOutput: true,
            justCounting: [],
            drumStyle: [],
            synthVolume: {},
            crescendoInitialVolume: {},
            // Pitch-resolution state consumed by Singer.processPitch's
            // `inNoteBlock.length > 0` branch (js/turtle-singer.js).
            invertList: [],
            justMeasuring: [],
            arpeggio: [],
            arpeggioIndex: 0,
            intervals: [],
            semitoneIntervals: [],
            chordIntervals: [],
            ratioIntervals: [],
            transpositionRatios: [],
            scalarTransposition: 0,
            transposition: 0,
            register: 0,
            keySignature: "C",
            movable: false
        },
        painter: {
            color: 50,
            penState: true,
            closeSVG: jest.fn()
        },
        queue: [],
        parentFlowQueue: [],
        unhighlightQueue: [],
        parameterQueue: [],
        listeners: {},
        endOfClampSignals: {},
        waitTime: 0,
        doWait: jest.fn(),
        container: { x: 0, y: 0 },
        x: 0,
        y: 0,
        running: false,
        inTrash: false,
        companionTurtle: null
    };
}

function createActivity(turtle) {
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
            visible: false
        },
        turtles: {
            turtleList: [turtle],
            ithTurtle: jest.fn(() => turtle),
            getTurtle: jest.fn(() => turtle),
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
            dispatchEvent: jest.fn(name => {
                if (typeof name === "string" && turtle.listeners[name]) {
                    turtle.listeners[name]();
                }
            }),
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

function makeFlowBlock(name, connections, flow, dockTypes, args) {
    return {
        name,
        connections,
        protoblock: {
            args: args || 0,
            dockTypes: dockTypes || [null],
            flow: flow || (() => null)
        },
        isValueBlock: () => false,
        isArgBlock: () => false
    };
}

describe("pitch block dispatch through the real Logo interpreter", () => {
    let logo;
    let turtle;
    let activity;
    let pitchCallCount;
    let notePitchesAtSchedule;
    let noteOctavesAtSchedule;
    let noteHertzAtSchedule;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        logo.notation = { notationVoices: jest.fn() };
        logo.synth = { inTemperament: "equal" };
        pitchCallCount = 0;
        notePitchesAtSchedule = null;
        noteOctavesAtSchedule = null;
        noteHertzAtSchedule = null;

        // RhythmActions.playNote deletes tur.singer.notePitches[blk] (and siblings) right after
        // handing the note to Singer.processNote, so the resolved pitch has to be captured here,
        // at the scheduling boundary itself, not read back after runFromBlockNow returns.
        Singer.processNote.mockImplementation((_activity, _noteValue, _isOsc, blk, t) => {
            const tur = _activity.turtles.ithTurtle(t);
            notePitchesAtSchedule = [...tur.singer.notePitches[blk]];
            noteOctavesAtSchedule = [...tur.singer.noteOctaves[blk]];
            noteHertzAtSchedule = [...tur.singer.noteHertz[blk]];
        });

        setupRhythmActions(activity);
        setupPitchActions(activity);

        // newnote (0): connections [prev, value, clampEntry, hidden]
        // value (1):   number 1/3 (a one-third note)
        // vspace (2):  connections [prev, pitch]
        // pitch (3):   real "sol"/4 pitch block, dispatched via Singer.PitchActions.playPitch
        // hidden (4):  connections [prev, null] (end-of-clamp signal)
        const hidden = makeFlowBlock("hidden", [0, null], null);
        const pitch = makeFlowBlock("pitch", [2, null], (args, l, t, blk) => {
            pitchCallCount++;
            Singer.PitchActions.playPitch("sol", 4, 0, t, blk);
            return null;
        });
        const vspace = makeFlowBlock("vspace", [0, 3], null);
        const newnote = makeFlowBlock(
            "newnote",
            [null, 1, 2, 4],
            (args, l, t, blk) => {
                Singer.RhythmActions.playNote(args[0], "newnote", t, blk);
                return [args[1], 1];
            },
            [null, "numberin", "in", "in"],
            3
        );
        const value = {
            name: "number",
            value: 1 / 3,
            connections: [],
            protoblock: { parameter: false, dockTypes: ["numberout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };

        const blocks = [newnote, value, vspace, pitch, hidden];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test("resolves the real note name/octave and reaches the scheduling boundary exactly once, keyed by the clamp block", () => {
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        expect(pitchCallCount).toBe(1);

        // The pitch child does not schedule sound itself: Singer.processPitch stored the
        // resolved note under the *clamp's* block id (0), not the pitch block's own id (3),
        // because the clamp already pushed itself onto inNoteBlock before the child ran.
        expect(notePitchesAtSchedule).toEqual(["G"]);
        expect(noteOctavesAtSchedule).toEqual([4]);
        expect(noteHertzAtSchedule).toEqual([0]);
        expect(turtle.singer.notePitches[3]).toBeUndefined();

        // Only the clamp reaches the note-scheduling boundary, and only once.
        expect(Singer.processNote).toHaveBeenCalledTimes(1);
        expect(Singer.processNote).toHaveBeenCalledWith(activity, 3, false, 0, 0);
    });

    test("movable-do transposes the same solfege pitch block through the real pipeline, not a stand-in", () => {
        turtle.singer.movable = true;
        turtle.singer.keySignature = "G";

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // In movable-do, scale-degree "sol" (the 5th) of G major is D, not the fixed-do G
        // the first test resolves to - proving this reaches the real getNote() pipeline
        // (js/utils/musicutils.js) rather than a mocked/hardcoded note.
        expect(notePitchesAtSchedule).toEqual(["D"]);
        expect(noteOctavesAtSchedule).toEqual([4]);
        expect(Singer.processNote).toHaveBeenCalledTimes(1);
        expect(Singer.processNote).toHaveBeenCalledWith(activity, 3, false, 0, 0);
    });
});
