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
 * `Singer.IntervalsActions.setScalarInterval` (js/turtleactions/IntervalsActions.js) - extending
 * the pattern `noteclamp-beat-doublequeue.test.js` (drum dispatch),
 * `pitch-note-dispatch-integration.test.js` (pitch dispatch), and
 * `volume-articulation-dispatch-integration.test.js` (volume dispatch) already use.
 *
 * Scope: this covers the Logo-dispatch <-> IntervalsActions seam, not ScalarIntervalBlock's own
 * palette registration. `Logo.runFromBlockNow` and `setScalarInterval` run for real and unmocked
 * - entering the clamp pushes a relative interval onto `tur.singer.intervals`, and the clamp's
 * real end-of-clamp signal pops it back off on exit. The "interval" block below is a minimal
 * stand-in shaped like the real block (js/blocks/IntervalsBlocks.js): its `flow()` is copied
 * verbatim from `ScalarIntervalBlock.flow`, not obtained from a live registered protoblock,
 * because the concrete classes it extends (`FlowClampBlock`, js/protoblocks.js) only exist as
 * bare globals in the production script-concatenation build - reaching them from Jest would mean
 * either evaluating `protoblocks.js`'s source at runtime or driving the full canvas/DOM-heavy
 * `Blocks.makeBlock`/`Block` path (js/blocks.js, js/block.js), both disproportionate to this one
 * behavior. Consequently, a regression in `ScalarIntervalBlock.flow` itself would not fail this
 * test; a regression in `setScalarInterval` or in the Logo dispatch machinery around it would
 * (verified by deliberately breaking each and confirming the test fails).
 *
 * A synthetic clamp-body checkpoint block (not a real "vspace" block, just shaped like one)
 * captures the pushed interval synchronously, since `runFromBlockNow` runs fully synchronously
 * and the clamp has already reverted by the time it returns.
 */

// Setup global mocks BEFORE requiring the module (mirror of noteclamp-beat-doublequeue.test.js).
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

// Singer.IntervalsActions is attached to the module-level `Singer` mock above, exactly as
// production code does via `Singer.IntervalsActions = class {...}` (js/turtleactions/IntervalsActions.js).
// No production code is mocked: setScalarInterval runs for real.
const { setupIntervalsActions } = require("../turtleactions/IntervalsActions");

function createTurtle() {
    return {
        singer: {
            inNoteBlock: [],
            inDuplicate: false,
            backward: [],
            suppressOutput: true,
            justCounting: [],
            intervals: []
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

describe("Logo end-of-clamp dispatch drives the real Singer.IntervalsActions.setScalarInterval", () => {
    let logo;
    let turtle;
    let activity;
    let duringClampIntervals;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        duringClampIntervals = null;

        setupIntervalsActions(activity);

        // interval (0):  connections [prev, value, clampEntry, hidden] - the connections shape
        // produced when the "scalar interval" block is dragged from the Intervals palette
        // (see ScalarIntervalBlock's own makeMacro, js/blocks/IntervalsBlocks.js).
        // value (1):     number 5 (the block's own default relative interval)
        // vspace (2):    clamp content - see the checkpoint comment below
        // hidden (3):    connections [prev, null] (end-of-clamp signal target)
        const hidden = makeFlowBlock("hidden", [0, null], null);
        const vspace = makeFlowBlock("vspace", [0, null], (args, l, t) => {
            // Checkpoint: reads the interval stack while the clamp is still open.
            // runFromBlockNow is synchronous, so by the time it returns below the clamp has
            // already closed and popped the interval - this is the only point it's visible.
            const tur = activity.turtles.ithTurtle(t);
            duringClampIntervals = [...tur.singer.intervals];
            return null;
        });
        const interval = makeFlowBlock(
            "interval",
            [null, 1, 2, 3],
            (args, l, t, blk) => {
                // Copied verbatim from ScalarIntervalBlock.flow (js/blocks/IntervalsBlocks.js) -
                // see the file-level comment above for why this isn't a live protoblock.
                if (args[1] === undefined) return;
                Singer.IntervalsActions.setScalarInterval(args[0], t, blk);
                return [args[1], 1];
            },
            [null, "numberin", "in", "in"],
            3
        );
        const value = {
            name: "number",
            value: 5,
            connections: [],
            protoblock: { parameter: false, dockTypes: ["numberout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };

        const blocks = [interval, value, vspace, hidden];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test("pushes a scalar interval during the clamp and restores the stack after dispatch cleanup", () => {
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // While the clamp is open, the "+5" scalar interval was pushed onto the interval stack.
        expect(duringClampIntervals).toEqual([5]);

        // Once the clamp's real end-of-clamp signal (setDispatchBlock/endOfClampSignals) fires
        // the reverting listener, the pushed interval is popped and the stack is empty again.
        expect(turtle.singer.intervals).toEqual([]);
    });
});
