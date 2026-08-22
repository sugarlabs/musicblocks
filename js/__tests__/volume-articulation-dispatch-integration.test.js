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
 * What's real here and what isn't: `Singer.VolumeActions.setRelativeVolume` runs unmocked
 * (js/turtleactions/VolumeActions.js), as does the end-of-clamp dispatch machinery it relies
 * on (js/logo.js). The `articulation` block's `flow()` below is copied verbatim from the
 * production `ArticulationBlock.flow` (js/blocks/VolumeBlocks.js) rather than driven through a
 * live, registered protoblock instance. That's a deliberate boundary, not an oversight: the
 * concrete block classes `ArticulationBlock` extends (`FlowClampBlock`/`FlowBlock`/`LeftBlock`,
 * js/protoblocks.js) are written to run as bare globals supplied by the production
 * script-concatenation build, and only the base `ProtoBlock` is a CommonJS export - there is no
 * supported, lightweight way to obtain a real, dockTypes-bearing protoblock for a Volume block
 * from this test file. The two ways that do exist were both rejected as disproportionate to a
 * single-behavior test: evaluating `protoblocks.js`'s own source via `new Function(...)` to
 * recover the unexported subclasses (couples the test to that file's internal layout, not just
 * its behavior), or driving the real `Blocks.makeBlock`/`Block` construction path
 * (js/blocks.js, js/block.js), which pulls in ~50 additional production globals (canvas
 * containers, image loading, spatial-grid indexing, drag-group tracking) that have nothing to
 * do with volume dispatch. Copying the ~10-line `flow()` body keeps the harness scoped to the
 * noteclamp/pitch pattern while still exercising the real dispatch chain around it; the
 * sabotage checks below (see PR discussion) confirm a regression in either the copied flow's
 * own logic or in `setRelativeVolume` itself fails this test.
 *
 * The clamp body is a real, minimal "vspace" (structural spacer) block - the same block the
 * noteclamp/pitch integration tests use for clamp content - repurposed here as the test's
 * synchronous checkpoint: `runFromBlockNow` runs entirely synchronously for this program, so
 * capturing the "during" volume requires a callback that fires while the clamp is still open,
 * before it unwinds and reverts by the time `runFromBlockNow` returns.
 */

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

        // articulation (0): connections [prev, value, clampEntry, hidden] - the real block
        // shape produced when the "set relative volume" block is dragged from the Volume
        // palette (see ArticulationBlock's own makeMacro, js/blocks/VolumeBlocks.js).
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
        const articulation = makeFlowBlock(
            "articulation",
            [null, 1, 2, 3],
            (args, l, t, blk) => {
                // Copied verbatim from ArticulationBlock.flow (js/blocks/VolumeBlocks.js) -
                // see the file-level comment above for why this isn't a live protoblock.
                if (args[1] === undefined) return;
                let arg = args[0];
                if (arg === null || typeof arg !== "number") {
                    activity.errorMsg(NOINPUTERRORMSG, blk);
                    arg = 0;
                }
                Singer.VolumeActions.setRelativeVolume(arg, t, blk);
                return [args[1], 1];
            },
            [null, "numberin", "in", "in"],
            3
        );
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
