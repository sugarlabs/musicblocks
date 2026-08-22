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
 * pattern established by `noteclamp-beat-doublequeue.test.js` (drum dispatch) and
 * `pitch-note-dispatch-integration.test.js` (pitch dispatch) to volume dispatch.
 *
 * Unlike Pitch/Rhythm dispatch, which resolve and schedule state at the *end* of a note
 * clamp, the "set relative volume" (articulation) block (js/turtleactions/VolumeActions.js,
 * `setRelativeVolume`) is a push/pop clamp: entering the clamp pushes a boosted volume onto
 * `tur.singer.synthVolume[synth]` for every synth currently in use, and the real
 * `Logo.runFromBlockNow` end-of-clamp dispatch mechanism (`setDispatchBlock` /
 * `setTurtleListener` / `tur.endOfClampSignals`, js/logo.js) fires a listener on clamp exit
 * that pops the boosted value back off, restoring the prior volume. This test drives that
 * clamp, keyed by its own real dispatch machinery (not a mock), and observes the volume
 * before, during, and after the clamp.
 *
 * The block under test is the real, registered `ArticulationBlock` from
 * js/blocks/VolumeBlocks.js - not a hand-copied stand-in for its `flow()` - so a regression
 * in that block's registration (dockTypes/args, as computed by the real `formBlock()`) or in
 * its `flow()` body would fail this test. `js/blocks/VolumeBlocks.js` is written to run
 * against `FlowBlock`/`FlowClampBlock`/`LeftBlock`/`ValueBlock` as bare globals (the shape the
 * production browser build provides via script concatenation), and only the base `ProtoBlock`
 * is a CommonJS export of js/protoblocks.js; `loadProtoblockClasses()` below evaluates that
 * same source file to pull out the concrete subclasses too, so `setupVolumeBlocks` registers
 * against the real class hierarchy instead of a dummy substitute (the pattern
 * VolumeBlocks.test.js itself uses for its own, non-integration, unit tests).
 *
 * The clamp body is a real, minimal "vspace" (structural spacer) block - the same block the
 * noteclamp/pitch integration tests use for clamp content - repurposed here as the test's
 * synchronous checkpoint: `runFromBlockNow` runs entirely synchronously for this program, so
 * capturing the "during" volume requires a callback that fires while the clamp is still open,
 * before it unwinds and reverts by the time `runFromBlockNow` returns.
 */

const fs = require("fs");
const path = require("path");

// Setup global mocks BEFORE requiring the module (mirror of noteclamp-beat-doublequeue.test.js).
global._ = str => str;
global.Notation = jest.fn().mockImplementation(() => ({
    notationStaging: {},
    notationDrumStaging: {},
    pickupPoint: {},
    pickupPOW2: {},
    doUpdateNotation: jest.fn(),
    notationInsertTie: jest.fn(),
    notationBeginArticulation: jest.fn(),
    notationEndArticulation: jest.fn()
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
    masterBPM: 90,
    defaultBPMFactor: 1
};
global.DEFAULTVOICE = "electronic synth";
global.last = arr => arr[arr.length - 1];
global.clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);

// js/blocks/VolumeBlocks.js's block constructors call `.setup(activity)` (js/protoblocks.js),
// which measures the block's label via a createjs Text/Container pair, and every ProtoBlock
// reads DEFAULTBLOCKSCALE unconditionally at construction time.
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

jest.mock("tone", () => ({
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
}));

global.EmbeddedGraphicsScheduler =
    require("../embedded-graphics-scheduler").EmbeddedGraphicsScheduler;

const logoconstants = require("../logoconstants");
Object.assign(global, logoconstants);

const { Logo } = require("../logo");

// Singer.VolumeActions is attached to the module-level `Singer` mock above, exactly as
// production code does via `Singer.VolumeActions = class {...}` (js/turtleactions/VolumeActions.js).
// No production code is mocked: setRelativeVolume runs for real.
const setupVolumeActions = require("../turtleactions/VolumeActions");

// js/blocks/VolumeBlocks.js (`setupVolumeBlocks`) is written to run against
// `FlowBlock`/`FlowClampBlock`/`LeftBlock`/`ValueBlock` as bare globals - the shape the real
// browser build provides. Only `ProtoBlock` is a CommonJS export of js/protoblocks.js, so this
// evaluates that file's own source once to recover the real, concrete subclasses instead of
// substituting dummies, giving `ArticulationBlock` its genuine constructor (real
// `formBlock()`-computed dockTypes/args) and registration (`.setup()` -> `protoBlockDict`).
function loadProtoblockClasses() {
    const source = fs.readFileSync(path.join(__dirname, "../protoblocks.js"), "utf8");
    const factory = new Function(
        "module",
        `${source}\nreturn { BaseBlock, ValueBlock, FlowBlock, LeftBlock, FlowClampBlock };`
    );
    return factory({ exports: {} });
}

const { BaseBlock, ValueBlock, FlowBlock, LeftBlock, FlowClampBlock } = loadProtoblockClasses();
global.BaseBlock = BaseBlock;
global.ValueBlock = ValueBlock;
global.FlowBlock = FlowBlock;
global.LeftBlock = LeftBlock;
global.FlowClampBlock = FlowClampBlock;

global.NANERRORMSG = global.NANERRORMSG || "Not a number";
global.VOICENAMES = {};
global.DRUMNAMES = {};
global.DEFAULTDRUM = "kick";

const { setupVolumeBlocks } = require("../blocks/VolumeBlocks");

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
            synthVolume: { [DEFAULTVOICE]: [60] },
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
        beginnerMode: false,
        palettes: {
            dict: {
                volume: { add: jest.fn() }
            }
        },
        blocks: {
            blockList: [],
            protoBlockDict: {},
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

describe("volume articulation clamp dispatch through the real Logo interpreter", () => {
    let logo;
    let turtle;
    let activity;
    let duringClampVolume;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        duringClampVolume = null;

        setupVolumeActions(activity);
        // Registers the real ArticulationBlock (and its Volume-palette siblings) into
        // activity.blocks.protoBlockDict via BaseBlock.setup() (js/protoblocks.js) - the same
        // registration path the real block palette relies on.
        setupVolumeBlocks(activity);
        const articulationProto = activity.blocks.protoBlockDict.articulation;

        // articulation (0): connections [prev, value, clampEntry, hidden] - the real block
        // shape produced when the "set relative volume" block is dragged from the Volume
        // palette (see ArticulationBlock's own makeMacro, js/blocks/VolumeBlocks.js). Its
        // protoblock is the real, registered ArticulationBlock instance: real dockTypes/args
        // (["out","numberin","in","in"], args=2) and the real, unmodified `flow()`.
        // value (1):        number 25 (a +25% relative volume change, the block's own default)
        // vspace (2):       clamp content; captures the boosted volume mid-clamp, since the
        //                   clamp reverts it before runFromBlockNow returns
        // hidden (3):       connections [prev, null] (end-of-clamp signal target)
        const hidden = makeFlowBlock("hidden", [0, null], null);
        const vspace = makeFlowBlock("vspace", [0, null], (args, l, t) => {
            const tur = activity.turtles.ithTurtle(t);
            duringClampVolume = [...tur.singer.synthVolume[DEFAULTVOICE]];
            return null;
        });
        const articulation = {
            name: "articulation",
            connections: [null, 1, 2, 3],
            protoblock: articulationProto,
            isValueBlock: () => false,
            isArgBlock: () => false
        };
        const value = {
            name: "number",
            value: 25,
            connections: [],
            protoblock: { parameter: false, dockTypes: ["numberout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };

        const blocks = [articulation, value, vspace, hidden];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test("boosts the synth volume for the clamp's duration and reverts it once the clamp ends", () => {
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // While the clamp is open, a +25% relative volume was pushed on top of the base 60.
        expect(duringClampVolume).toEqual([60, 75]);

        // Once the clamp's real end-of-clamp signal (setDispatchBlock/endOfClampSignals) fires
        // the reverting listener, the boosted value is popped and the base volume remains.
        expect(turtle.singer.synthVolume[DEFAULTVOICE]).toEqual([60]);
    });
});
