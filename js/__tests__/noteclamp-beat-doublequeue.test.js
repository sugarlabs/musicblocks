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
 * Regression coverage for the note-clamp double-queue.
 *
 * When a beat event is registered (everybeat / on-beat / offbeat / every-beat-N),
 * `playNote` used to call `_enqueue()` (js/turtleactions/RhythmActions.js), which pushed
 * the note clamp's child flow onto the turtle queue. The note block's flow() ALSO returns
 * `[childFlow, 1]`, which makes `runFromBlockNow` step (3) (js/logo.js) push the SAME child
 * flow a second time. Because the queue is FILO, the clamp then ran twice per note and
 * pushed its content (e.g. a `playdrum` block) onto the note twice, so every note triggered
 * two drums.
 *
 * `playNote` now only dispatches the beat event and lets the interpreter queue the clamp
 * exactly once. This test drives the real `Singer.RhythmActions.playNote` and the real
 * `Singer.DrumActions.playDrum` through the real `Logo.runFromBlockNow` and asserts that the
 * clamp child runs exactly once, with or without a beat event, and that the note is still
 * played with a single drum.
 */

// Setup global mocks BEFORE requiring the module (mirror of logo.test.js).
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
global.Singer = {
    processNote: jest.fn(),
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

const { Queue, Logo } = require("../logo");

const setupRhythmActions = require("../turtleactions/RhythmActions");
const setupDrumActions = require("../turtleactions/DrumActions");

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
            crescendoInitialVolume: {}
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

describe("note clamp + beat event double queue", () => {
    let logo;
    let turtle;
    let activity;
    let drumCount;
    let drumsAtNotePlay;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        logo.notation = { notationVoices: jest.fn() };
        drumCount = 0;
        drumsAtNotePlay = null;

        Singer.processNote.mockImplementation((_activity, _noteValue, _isOsc, blk, t) => {
            const tur = _activity.turtles.ithTurtle(t);
            drumsAtNotePlay = [...tur.singer.noteDrums[blk]];
        });

        setupRhythmActions(activity);
        setupDrumActions(activity);

        // newnote (0): connections [prev, value, clampEntry, hidden]
        // value (1):   number 1/3 (a one-third note, e.g. divide 1 / left with left = 3)
        // vspace (2):  connections [prev, drum]
        // drum (3):    playdrum cup drum, flow increments drumCount
        // hidden (4):  connections [prev, null]
        const hidden = makeFlowBlock("hidden", [0, null], null);
        const drum = makeFlowBlock("drum", [2, null], (args, l, t, blk) => {
            drumCount++;
            Singer.DrumActions.playDrum("cup drum", t, blk);
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

        const blocks = [newnote, value, vspace, drum, hidden];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test("without a beat event the clamp child runs once and the note plays with one drum", () => {
        logo.runFromBlockNow(logo, 0, 0, 1, null);
        expect(drumCount).toBe(1);
        expect(Singer.processNote).toHaveBeenCalledTimes(1);
        expect(Singer.processNote).toHaveBeenCalledWith(activity, 3, false, 0, 0);
        expect(drumsAtNotePlay).toEqual(["cup drum"]);
    });

    test("with everybeat the clamp child still runs once and the note plays with one drum", () => {
        turtle.singer.beatList = ["everybeat"];
        logo.runFromBlockNow(logo, 0, 0, 1, null);
        expect(drumCount).toBe(1);
        expect(Singer.processNote).toHaveBeenCalledTimes(1);
        expect(Singer.processNote).toHaveBeenCalledWith(activity, 3, false, 0, 0);
        expect(drumsAtNotePlay).toEqual(["cup drum"]);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__everybeat_0__");
    });
});
