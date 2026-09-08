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
 * Integration test: the real, registered `newnote`, `settransposition` and `pitch` blocks
 * (js/blocks/RhythmBlocks.js, js/blocks/PitchBlocks.js) dispatch through their own real `flow()`
 * via the real `Logo.runFromBlockNow` (js/logo.js). A `pitch` nested inside a semi-tone transpose
 * clamp resolves through the real `PitchActions.playPitch` -> `Singer.processPitch` -> `getNote`
 * (js/utils/musicutils.js) *with the clamp's shift in effect*, and the clamp's real end-of-clamp
 * signal reverts it on exit. `pitch-note-dispatch-integration.test.js` never places a transpose
 * clamp in its program, so this is the one seam it doesn't reach.
 *
 * Only the `number`/`solfege` value blocks and `hidden` end-of-clamp markers are synthetic plain
 * data. Mocked: `Singer.processNote` (the Tone.js hand-off, covered elsewhere; also the
 * observation point, since `playNote` deletes the resolved pitch right after handing it off) and
 * `Singer.addScalarTransposition` (an unrelated scalar transform, stays 0 throughout).
 * `Singer.processPitch` stays real but is spied on to record the live transposition at resolution
 * time. Every Singer method this file replaces gets a fresh mock per test, restored in
 * `afterEach` so nothing outlives the test that installed it.
 */

// Globals RhythmBlocks/PitchBlocks/logo/turtle-singer need, set before requiring them.
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

// Real note-name resolution pipeline, so the real pitch/transpose flows resolve through the
// genuine musicutils implementation instead of a stand-in.
const musicUtils = require("../utils/musicutils");
Object.assign(global, {
    pitchToNumber: musicUtils.pitchToNumber,
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

// The real Singer class (js/turtle-singer.js), not a stand-in. Captured before any test mocks it,
// so afterEach can always hand the real implementation back.
global.Singer = require("../turtle-singer");
Singer.masterBPM = 90;
Singer.defaultBPMFactor = 1;
const realProcessNote = Singer.processNote;
const realAddScalarTransposition = Singer.addScalarTransposition;

const setupRhythmActions = require("../turtleactions/RhythmActions");
const setupPitchActions = require("../turtleactions/PitchActions");
// Registers the real blocks into activity.blocks.protoBlockDict (js/protoblocks.js), the same
// path the palette itself uses.
const { setupPitchBlocks } = require("../blocks/PitchBlocks");
const { setupRhythmBlocks } = require("../blocks/RhythmBlocks");

// Only the turtle/activity fields the real newnote -> settransposition -> pitch path reads (found
// empirically with a property-access-tracking Proxy, then confirmed by dropping each in turn).
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
            justMeasuring: [],
            arpeggio: [],
            intervals: [],
            semitoneIntervals: [],
            chordIntervals: [],
            ratioIntervals: [],
            transpositionRatios: [],
            // The shift stack setSemitoneTranspose's end-of-clamp listener pops on clamp exit.
            transposition: 0,
            transpositionValues: [],
            scalarTransposition: 0,
            register: 0,
            currentOctave: 4,
            lastNotePlayed: null,
            keySignature: "C major",
            movable: false
        },
        painter: { closeSVG: jest.fn() },
        queue: [],
        parentFlowQueue: [],
        listeners: {},
        endOfClampSignals: {},
        companionTurtle: null
    };
}

function createActivity(turtle) {
    return {
        beginnerMode: false,
        palettes: {
            // setPalette() only needs `.add` on whichever palette a block asks for.
            dict: new Proxy({}, { get: () => ({ add: jest.fn() }) })
        },
        blocks: {
            blockList: [],
            protoBlockDict: {},
            visible: false
        },
        turtles: {
            ithTurtle: jest.fn(() => turtle),
            getTurtle: jest.fn(() => turtle),
            companionTurtle: jest.fn(t => t),
            running: jest.fn(() => false)
        },
        stage: {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(name => {
                if (typeof name === "string" && turtle.listeners[name]) {
                    turtle.listeners[name]();
                }
            })
        },
        errorMsg: jest.fn(),
        onStopTurtle: jest.fn(),
        onRunTurtle: jest.fn()
    };
}

// Synthetic value block (number / solfege): parseArg returns `.value` for any isValueBlock().
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

// Synthetic end-of-clamp signal target - carries no behavior.
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

describe("real newnote/settransposition/pitch blocks dispatch through Logo into real PitchActions", () => {
    let logo;
    let turtle;
    let activity;
    let protos;
    let notePitchesAtSchedule;
    let noteOctavesAtSchedule;
    let scheduledForBlk;
    let transpositionWhilePitchResolved;
    let realProcessPitch;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        logo.notation = { notationVoices: jest.fn() };
        logo.synth = { inTemperament: "equal" };
        notePitchesAtSchedule = null;
        noteOctavesAtSchedule = null;
        scheduledForBlk = null;
        transpositionWhilePitchResolved = null;

        // playNote deletes tur.singer.notePitches[blk] right after handing off, so capture the
        // resolved pitch here. `blk` is the newnote's id when the pitch resolved inside the real
        // clamp, or the pitch block's own id if processPitch fell back to its stand-alone path.
        Singer.processNote = jest.fn((_activity, _noteValue, _isOsc, blk, t) => {
            const tur = _activity.turtles.ithTurtle(t);
            scheduledForBlk = blk;
            notePitchesAtSchedule = [...tur.singer.notePitches[blk]];
            noteOctavesAtSchedule = [...tur.singer.noteOctaves[blk]];
        });

        // Unrelated scalar (not semi-tone) transform; stays 0 throughout.
        Singer.addScalarTransposition = jest.fn((_logo, _turtle, note, octave) => [note, octave]);

        // Real processPitch, spied to record the live transposition at resolution time.
        realProcessPitch = Singer.processPitch;
        Singer.processPitch = jest.fn((act, note, octave, cents, t, blk) => {
            transpositionWhilePitchResolved = act.turtles.ithTurtle(t).singer.transposition;
            return realProcessPitch.call(Singer, act, note, octave, cents, t, blk);
        });

        setupRhythmActions(activity);
        setupPitchActions(activity);
        setupRhythmBlocks(activity);
        setupPitchBlocks(activity);
        protos = activity.blocks.protoBlockDict;
    });

    // Puts every mocked Singer method back to its real implementation.
    afterEach(() => {
        Singer.processNote = realProcessNote;
        Singer.addScalarTransposition = realAddScalarTransposition;
        Singer.processPitch = realProcessPitch;
    });

    // Builds `newnote 1/4 { <one real settransposition clamp per shift, nested> { pitch sol/4 } }`
    // from the real registered protoblocks. Block ids are the array indices.
    function installProgram(shifts) {
        const newnote = makeRealBlock("newnote", [null, 1, null, 2], protos.newnote);
        const blocks = [newnote, makeValueBlock("number", 1 / 4), makeHidden(0)];

        let prev = 0;
        const clampIds = [];
        shifts.forEach(shift => {
            const clampId = blocks.length;
            blocks.push(
                makeRealBlock(
                    "settransposition",
                    [prev, clampId + 1, null, clampId + 2],
                    protos.settransposition
                )
            );
            blocks.push(makeValueBlock("number", shift));
            blocks.push(makeHidden(clampId));
            clampIds.push(clampId);
            prev = clampId;
        });

        // pitch sol/4 inside the innermost clamp.
        const pitchId = blocks.length;
        blocks.push(makeRealBlock("pitch", [prev, pitchId + 1, pitchId + 2, null], protos.pitch));
        blocks.push(makeValueBlock("solfege", "sol"));
        blocks.push(makeValueBlock("number", 4));

        // Wire each clamp's entry to whatever nests directly inside it.
        newnote.connections[2] = clampIds.length > 0 ? clampIds[0] : pitchId;
        clampIds.forEach((clampId, i) => {
            blocks[clampId].connections[2] = i + 1 < clampIds.length ? clampIds[i + 1] : pitchId;
        });

        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    }

    test("a +2 semi-tone transpose clamp shifts the nested sol/4 up to A4 through the real getNote pipeline", () => {
        installProgram([2]);

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // Resolved inside the real newnote clamp, while the transpose clamp was open, so bare
        // "sol"/4 (G4) became A4 - the real getNote() output for a transposition of 2.
        expect(scheduledForBlk).toBe(0);
        expect(transpositionWhilePitchResolved).toBe(2);
        expect(notePitchesAtSchedule).toEqual(["A"]);
        expect(noteOctavesAtSchedule).toEqual([4]);
        expect(Singer.processNote).toHaveBeenCalledTimes(1);
        // The real end-of-clamp signal reverted the shift once the clamp closed.
        expect(turtle.singer.transposition).toBe(0);
        expect(turtle.singer.transpositionValues).toEqual([]);
    });

    test("a -2 semi-tone transpose clamp shifts the nested sol/4 down to F4", () => {
        installProgram([-2]);

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        expect(scheduledForBlk).toBe(0);
        expect(transpositionWhilePitchResolved).toBe(-2);
        expect(notePitchesAtSchedule).toEqual(["F"]);
        expect(noteOctavesAtSchedule).toEqual([4]);
        expect(turtle.singer.transposition).toBe(0);
    });

    test("nested semi-tone transpose clamps accumulate before the pitch resolves and unwind independently after", () => {
        installProgram([2, 3]);

        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // Both clamps were open together while the pitch resolved: G4 + 2 + 3 semitones = C5.
        expect(scheduledForBlk).toBe(0);
        expect(transpositionWhilePitchResolved).toBe(5);
        expect(notePitchesAtSchedule).toEqual(["C"]);
        expect(noteOctavesAtSchedule).toEqual([5]);
        expect(Singer.processNote).toHaveBeenCalledTimes(1);
        // Each clamp's own end-of-clamp listener popped its own shift, back to nothing.
        expect(turtle.singer.transposition).toBe(0);
        expect(turtle.singer.transpositionValues).toEqual([]);
    });
});
