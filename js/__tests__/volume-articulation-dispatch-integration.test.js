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
 * Integration test for the Logo interpreter's end-of-clamp dispatch mechanism
 * (`setDispatchBlock`/`setTurtleListener`/`tur.endOfClampSignals`, js/logo.js) driving the real
 * `Singer.VolumeActions.setRelativeVolume` (js/turtleactions/VolumeActions.js) - extending the
 * pattern `noteclamp-beat-doublequeue.test.js` (drum dispatch) and
 * `pitch-note-dispatch-integration.test.js` (pitch dispatch) already use.
 *
 * Scope: this covers the Logo-dispatch <-> VolumeActions seam, not ArticulationBlock's own
 * palette registration. `Logo.runFromBlockNow` and `setRelativeVolume` run for real and
 * unmocked - entering the clamp pushes a boosted volume, and the clamp's real end-of-clamp
 * signal pops it back off on exit. The "articulation" block below is a minimal stand-in shaped
 * like the real block (js/blocks/VolumeBlocks.js): its `flow()` is copied verbatim from
 * `ArticulationBlock.flow`, not obtained from a live registered protoblock, because the concrete
 * classes it extends (`FlowClampBlock`/`FlowBlock`, js/protoblocks.js) only exist as bare
 * globals in the production script-concatenation build - reaching them from Jest would mean
 * either evaluating `protoblocks.js`'s source at runtime or driving the full canvas/DOM-heavy
 * `Blocks.makeBlock`/`Block` path (js/blocks.js, js/block.js), both disproportionate to this one
 * behavior. Consequently, a regression in `ArticulationBlock.flow` itself would not fail this
 * test; a regression in `setRelativeVolume` or in the Logo dispatch machinery around it would
 * (verified by deliberately breaking each and confirming the test fails).
 *
 * The real "vspace" spacer block inside the clamp captures the boosted volume synchronously,
 * since `runFromBlockNow` runs fully synchronously and the clamp has already reverted by the
 * time it returns.
 */

// Setup global mocks BEFORE requiring the module (mirror of noteclamp-beat-doublequeue.test.js).
global._ = str => str;
global.Notation = jest.fn().mockImplementation(() => ({
    notationBeginArticulation: jest.fn(),
    notationEndArticulation: jest.fn()
}));
global.Synth = jest.fn().mockImplementation(() => ({}));
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
            inDuplicate: false,
            backward: [],
            suppressOutput: true,
            justCounting: [],
            synthVolume: { [DEFAULTVOICE]: [60] },
            crescendoInitialVolume: {}
        },
        painter: { closeSVG: jest.fn() },
        queue: [],
        parentFlowQueue: [],
        unhighlightQueue: [],
        parameterQueue: [],
        listeners: {},
        endOfClampSignals: {},
        waitTime: 0,
        doWait: jest.fn(),
        container: { x: 0, y: 0 },
        running: false,
        inTrash: false
    };
}

function createActivity(turtle) {
    return {
        blocks: {
            blockList: [],
            sameGeneration: jest.fn(() => false)
        },
        turtles: {
            turtleList: [turtle],
            ithTurtle: jest.fn(() => turtle),
            getTurtle: jest.fn(() => turtle),
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
        onStopTurtle: jest.fn()
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

describe("Logo end-of-clamp dispatch drives the real Singer.VolumeActions.setRelativeVolume", () => {
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

        // articulation (0): connections [prev, value, clampEntry, hidden] - the connections
        // shape produced when the "set relative volume" block is dragged from the Volume
        // palette (see ArticulationBlock's own makeMacro, js/blocks/VolumeBlocks.js).
        // value (1):        number 25 (a +25% relative volume change, the block's own default)
        // vspace (2):       clamp content - see the checkpoint comment below
        // hidden (3):       connections [prev, null] (end-of-clamp signal target)
        const hidden = makeFlowBlock("hidden", [0, null], null);
        const vspace = makeFlowBlock("vspace", [0, null], (args, l, t) => {
            // Checkpoint: reads the volume while the clamp is still open. runFromBlockNow is
            // synchronous, so by the time it returns below the clamp has already closed and
            // reverted the volume - this is the only point where the boosted value is visible.
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
