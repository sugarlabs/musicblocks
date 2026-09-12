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
 * Regression coverage for end-of-clamp signal suppression while counting.
 *
 * Before a silent counting run, `Singer.noteCounter` and `Singer.numberOfNotes`
 * (js/turtle-singer.js) record every already-registered end-of-clamp signal in
 * `tur.butNotThese` so that the dispatch loop at the end of
 * `Logo.runFromBlockNow` (js/logo.js, "Make sure any unissued signals are
 * dispatched") does not fire those signals during the counting run. The
 * producers store array indices as strings (for..in / Object.keys), but the
 * consumer compared them against a numeric loop index with a strict indexOf,
 * so the suppression never matched and previously registered signals were
 * dispatched in the middle of a silent counting run.
 *
 * These tests drive the real `Singer.noteCounter` / `Singer.numberOfNotes`
 * through the real `Logo.runFromBlockNow` and assert that signals registered
 * before the counting run are suppressed while signals registered during the
 * counted flow still fire.
 */

// Setup global mocks BEFORE requiring the modules (mirror of
// noteclamp-beat-doublequeue.test.js).
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
global.TARGETBPM = 90;
global.TONEBPM = 240;
global.DRUMNAMES = {};
global.NOISENAMES = {};
global.StatusMatrix = jest.fn();
global.last = arr => arr[arr.length - 1];
global.mixedNumber = jest.fn(n => n.toString());
global.rationalToFraction = jest.fn(n => [1, Math.round(1 / n)]);
global.rationalSum = (a, b) => [[a[0] * b[1] + b[0] * a[1], a[1] * b[1]], null];
global.deepClone = value => JSON.parse(JSON.stringify(value));
global.clampNumber = require("../utils/utils-logic").clampNumber;
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

// The real Singer, so the real butNotThese producers run.
const Singer = require("../turtle-singer");
global.Singer = Singer;

const { Logo } = require("../logo");

function createTurtle() {
    return {
        id: 0,
        singer: {
            inNoteBlock: [],
            notesPlayed: [0, 1],
            tallyNotes: 0,
            whichNoteToCount: 0,
            previousTurtleTime: 0,
            turtleTime: 0,
            runningFromEvent: false,
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
            suppressOutput: false,
            justCounting: [],
            drumStyle: [],
            synthVolume: {},
            crescendoInitialVolume: {}
        },
        painter: {
            color: 50,
            value: 50,
            chroma: 50,
            stroke: 5,
            canvasAlpha: 1,
            penState: true,
            closeSVG: jest.fn(),
            doPenUp: jest.fn(),
            doSetXY: jest.fn(),
            doSetHeading: jest.fn()
        },
        orientation: 0,
        queue: [],
        parentFlowQueue: [],
        unhighlightQueue: [],
        parameterQueue: [],
        listeners: {},
        endOfClampSignals: {},
        butNotThese: {},
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

function makeFlowBlock(name, connections, flow) {
    return {
        name,
        connections,
        protoblock: {
            args: 0,
            dockTypes: [null],
            flow: flow || (() => null)
        },
        isValueBlock: () => false,
        isArgBlock: () => false
    };
}

describe("end-of-clamp signal suppression during counting runs", () => {
    let logo;
    let turtle;
    let activity;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        logo.notation = { notationVoices: jest.fn() };

        // A trivial counted flow: a single vspace block with no children.
        const blocks = [makeFlowBlock("vspace", [null, null], null)];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test("noteCounter does not dispatch signals registered before counting", () => {
        turtle.endOfClampSignals = { 7: ["_endofclamp_sig"] };

        const count = Singer.noteCounter(logo, 0, 0);

        expect(count).toBe(0);
        expect(activity.stage.dispatchEvent).not.toHaveBeenCalledWith("_endofclamp_sig");
        // butNotThese is cleared once counting finishes.
        expect(turtle.butNotThese).toEqual({});
    });

    test("noteCounter still dispatches signals registered during the counted flow", () => {
        turtle.endOfClampSignals = { 7: ["_old_sig"] };
        logo.blockList[0].protoblock.flow = () => {
            turtle.endOfClampSignals[7].push("_new_sig");
            return null;
        };

        Singer.noteCounter(logo, 0, 0);

        expect(activity.stage.dispatchEvent).not.toHaveBeenCalledWith("_old_sig");
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("_new_sig");
    });

    test("numberOfNotes does not dispatch signals registered before counting", () => {
        turtle.endOfClampSignals = { 7: ["_endofclamp_sig"] };

        const tally = Singer.numberOfNotes(logo, 0, 0);

        expect(tally).toBe(0);
        expect(activity.stage.dispatchEvent).not.toHaveBeenCalledWith("_endofclamp_sig");
        expect(turtle.butNotThese).toEqual({});
    });
});
