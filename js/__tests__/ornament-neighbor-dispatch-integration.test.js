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
 * `Singer.OrnamentActions.doNeighbor` (js/turtleactions/OrnamentActions.js) - extending the
 * pattern `noteclamp-beat-doublequeue.test.js` (drum dispatch) and
 * `interval-scalar-dispatch-integration.test.js` (interval dispatch) already use.
 *
 * Scope: this covers the Logo-dispatch <-> OrnamentActions seam, not NeighborBlock's own palette
 * registration or its args[0]/args[1] NaN validation (already covered, with doNeighbor mocked, by
 * js/blocks/__tests__/OrnamentBlocks.test.js). `Logo.runFromBlockNow` and `doNeighbor` run for
 * real and unmocked - the "neighbor" block below is a minimal stand-in shaped like the real block
 * (js/blocks/OrnamentBlocks.js, NeighborBlock.flow), not obtained from a live registered
 * protoblock, for the same reason given in interval-scalar-dispatch-integration.test.js: the
 * concrete FlowClampBlock class it extends (js/protoblocks.js) only exists as a bare global in the
 * production script-concatenation build, so reaching it from Jest would mean either evaluating
 * protoblocks.js's source at runtime or driving the full canvas/DOM-heavy
 * Blocks.makeBlock/Block path (js/blocks.js, js/block.js), both disproportionate to this one
 * behavior. Consequently, a regression in NeighborBlock.flow itself would not fail this test; a
 * regression in doNeighbor or in the Logo dispatch machinery around it would (verified by
 * deliberately breaking each and confirming the test fails).
 *
 * doNeighbor pushes onto three parallel turtle-singer stacks (inNeighbor, neighborStepPitch,
 * neighborNoteValue) before the clamp's contained blocks run, and only pops all three once the
 * real interpreter fires the end-of-clamp listener at the clamp's "hidden" block - the same shape
 * setScalarInterval uses for tur.singer.intervals. A "probe" block placed *inside* the clamp
 * snapshots that state mid-lifecycle - the deterministic, timing-independent observable these
 * tests assert on. OrnamentActions.setStaccato/setSlur share the same dispatch mechanism but are
 * left to a follow-up: setSlur's extra notationBeginSlur/notationEndSlur branch would otherwise
 * pull in Notation-mock scaffolding unrelated to the Logo-dispatch seam under test here.
 */

// Setup global mocks BEFORE requiring the module (mirror of
// interval-scalar-dispatch-integration.test.js).
global._ = str => str;
global.Notation = jest.fn().mockImplementation(() => ({}));
global.Synth = jest.fn().mockImplementation(() => ({}));
global.Singer = {};
global.last = arr => arr[arr.length - 1];

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

// Singer.OrnamentActions is attached to the module-level `Singer` mock above, exactly as
// production code does via `Singer.OrnamentActions = class {...}`
// (js/turtleactions/OrnamentActions.js). No production code is mocked: doNeighbor runs for real.
const setupOrnamentActions = require("../turtleactions/OrnamentActions");

function createTurtle() {
    return {
        singer: {
            inNeighbor: [],
            neighborStepPitch: [],
            neighborNoteValue: [],
            inNoteBlock: [],
            inDuplicate: false,
            backward: [],
            suppressOutput: true,
            justCounting: []
        },
        painter: { closeSVG: jest.fn() },
        queue: [],
        parentFlowQueue: [],
        listeners: {},
        endOfClampSignals: {}
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

describe("Logo end-of-clamp dispatch drives the real Singer.OrnamentActions.doNeighbor", () => {
    let logo;
    let turtle;
    let activity;
    let probeCallCount;
    let duringClampState;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        probeCallCount = 0;
        duringClampState = null;

        setupOrnamentActions(activity);

        // neighbor (0): connections [prev, intervalArg, noteValueArg, clampEntry, hidden] - the
        // shape produced when the "neighbor" block is dragged from the Ornament palette (see
        // NeighborBlock's own makeMacro, js/blocks/OrnamentBlocks.js).
        // interval (1):  number 2 (semi-tone interval)
        // noteValue (2): number 1/8
        // probe (3):     clamp content - see the checkpoint comment below
        // hidden (4):    connections [prev, null] (end-of-clamp signal target)
        const hidden = makeFlowBlock("hidden", [0, null], null);
        const probe = makeFlowBlock("probe", [0, null], (args, l, t) => {
            // Checkpoint: reads the neighbor stacks while the clamp is still open.
            // runFromBlockNow is synchronous, so by the time it returns below the clamp has
            // already closed and popped all three stacks - this is the only point it's visible.
            const tur = activity.turtles.ithTurtle(t);
            probeCallCount++;
            duringClampState = {
                inNeighbor: [...tur.singer.inNeighbor],
                neighborStepPitch: [...tur.singer.neighborStepPitch],
                neighborNoteValue: [...tur.singer.neighborNoteValue]
            };
            return null;
        });
        const neighbor = makeFlowBlock(
            "neighbor",
            [null, 1, 2, 3, 4],
            (args, l, t, blk) => {
                // Minimal glue, not a copy of NeighborBlock.flow(): hand Logo's evaluated
                // interval/noteValue args to the real doNeighbor and continue into the clamp body.
                Singer.OrnamentActions.doNeighbor(args[0], args[1], t, blk);
                return [args[2], 1];
            },
            [null, "numberin", "numberin", "in", "in"],
            4
        );
        const interval = {
            name: "number",
            value: 2,
            connections: [],
            protoblock: { parameter: false, dockTypes: ["numberout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };
        const noteValue = {
            name: "number",
            value: 1 / 8,
            connections: [],
            protoblock: { parameter: false, dockTypes: ["numberout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };

        const blocks = [neighbor, interval, noteValue, probe, hidden];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test('pushes inNeighbor/neighborStepPitch/neighborNoteValue before the clamp body runs and pops them once dispatch reaches "hidden"', () => {
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        expect(probeCallCount).toBe(1);
        // While the clamp is open, doNeighbor pushed the neighbor block's own index (0) plus the
        // real evaluated interval/noteValue onto the three parallel stacks.
        expect(duringClampState).toEqual({
            inNeighbor: [0],
            neighborStepPitch: [2],
            neighborNoteValue: [1 / 8]
        });

        // Once the clamp's real end-of-clamp signal (setDispatchBlock/endOfClampSignals) fires
        // the reverting listener, all three stacks are popped back to empty.
        expect(turtle.singer.inNeighbor).toEqual([]);
        expect(turtle.singer.neighborStepPitch).toEqual([]);
        expect(turtle.singer.neighborNoteValue).toEqual([]);
    });
});
