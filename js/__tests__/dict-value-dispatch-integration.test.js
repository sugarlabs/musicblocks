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
 * Integration test for the Logo interpreter's argument-evaluation/dispatch path
 * (`runFromBlockNow`/`parseArg`, js/logo.js) driving the real `Turtle.DictActions.setValue` and
 * `Turtle.DictActions.getValue` (js/turtleactions/DictActions.js) - extending the pattern
 * `meter-signature-dispatch-integration.test.js` (synchronous, non-clamp write dispatch) uses.
 *
 * Scope: this covers the Logo-dispatch <-> DictActions seam, not SetDictBlock's/GetDictBlock's own
 * palette registration or their null-arg validation (already covered, with setValue/getValue
 * mocked, by js/blocks/__tests__/DictBlocks.test.js). `Logo.runFromBlockNow`, `Logo.parseArg`,
 * `setValue`, and `getValue` run for real and unmocked - the "setdict"/"getdict" blocks below are
 * minimal stand-ins shaped like the real blocks (js/blocks/DictBlocks.js, SetDictBlock.flow and
 * GetDictBlock.arg), not obtained from live registered protoblocks, for the same reason given in
 * interval-scalar-dispatch-integration.test.js: the concrete FlowBlock/LeftBlock classes they
 * extend (js/protoblocks.js) only exist as bare globals in the production script-concatenation
 * build, so reaching them from Jest would mean either evaluating protoblocks.js's source at
 * runtime or driving the full canvas/DOM-heavy Blocks.makeBlock/Block path (js/blocks.js,
 * js/block.js), both disproportionate to this one behavior. Consequently, a regression in
 * SetDictBlock.flow/GetDictBlock.arg themselves would not fail this test; a regression in
 * setValue/getValue or in the Logo dispatch/argument-evaluation machinery around them would
 * (verified by deliberately breaking each and confirming the test fails).
 *
 * Unlike OrnamentActions' doNeighbor, DictActions has no clamp: setValue is a synchronous flow-
 * block write (dispatched the same way MeterActions.setMeter is), and getValue is dispatched
 * through a *different* Logo seam entirely - `parseArg` calling an arg-block's own `.arg()` method
 * (js/logo.js) rather than a flow block's `.flow()`. This test drives both seams in one real
 * two-block program: a "setdict" flow block writes a value via the real Logo dispatch, then a
 * "probe" flow block chained after it resolves a "getdict" arg block via the real `logo.parseArg`
 * - proving the write and the read reach the same real `activity.logo.turtleDicts` state through
 * two independently real Logo pathways, not just that each method works in isolation (already
 * shown by js/turtleactions/__tests__/DictActions.test.js).
 */

// Setup global mocks BEFORE requiring the module (mirror of
// meter-signature-dispatch-integration.test.js).
global._ = str => str;
global.Notation = jest.fn().mockImplementation(() => ({}));
global.Synth = jest.fn().mockImplementation(() => ({}));
global.Singer = {};
global.Turtle = {};
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

// Turtle.DictActions is attached to the module-level `Turtle` mock above, exactly as production
// code does via `Turtle.DictActions = class {...}` (js/turtleactions/DictActions.js). No
// production code is mocked: setValue and getValue run for real.
const setupDictActions = require("../turtleactions/DictActions");

function createTurtle() {
    return {
        singer: {
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
        onStopTurtle: jest.fn(),
        logo: null
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

describe("Logo dispatch drives the real Turtle.DictActions.setValue/getValue", () => {
    let logo;
    let turtle;
    let activity;
    let readBackValue;

    beforeEach(() => {
        jest.clearAllMocks();
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        logo.turtleDicts = {};

        setupDictActions(activity);

        // setdict (0): connections [prev, nameArg, keyArg, valueArg, next] - the shape produced
        // when the "set value" block is dragged from the Dictionary palette (see SetDictBlock's
        // own formBlock, js/blocks/DictBlocks.js).
        // name (1):  string "myDict"
        // key (2):   string "color"
        // value (3): string "green"
        // probe (4): reads the dictionary back via a real "getdict" arg block - see below.
        // getdict (5): arg block shaped like GetDictBlock.arg (js/blocks/DictBlocks.js), reusing
        // name (1) and key (2) as its own two connected arguments.
        const setdict = makeFlowBlock(
            "setdict",
            [null, 1, 2, 3, 4],
            (args, l, t) => {
                // Minimal glue, not a copy of SetDictBlock.flow(): hand Logo's evaluated
                // name/key/value args straight to the real setValue.
                Turtle.DictActions.setValue(args[0], args[1], args[2], t);
                return null;
            },
            [null, "anyin", "anyin", "anyin"],
            3
        );
        const name = {
            name: "string",
            value: "myDict",
            connections: [],
            protoblock: { parameter: false, dockTypes: ["anyout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };
        const key = {
            name: "string",
            value: "color",
            connections: [],
            protoblock: { parameter: false, dockTypes: ["anyout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };
        const value = {
            name: "string",
            value: "green",
            connections: [],
            protoblock: { parameter: false, dockTypes: ["anyout"] },
            isValueBlock: () => true,
            isArgBlock: () => false
        };
        const probe = makeFlowBlock("probe", [0, null], (args, l, t, blk) => {
            // Resolves the "getdict" arg block via the real logo.parseArg, the same seam Logo
            // uses whenever a "get value" block is connected as another block's argument.
            readBackValue = l.parseArg(l, t, 5, blk);
            return null;
        });
        const getdict = {
            name: "getDict",
            connections: [null, 1, 2],
            protoblock: {
                // Minimal glue, not a copy of GetDictBlock.arg(): reads its own two connections
                // and hands the resolved name/key straight to the real getValue.
                arg: (l, t, blk, receivedArg) => {
                    const cblk1 = activity.blocks.blockList[blk].connections[1];
                    const cblk2 = activity.blocks.blockList[blk].connections[2];
                    const a = l.parseArg(l, t, cblk1, blk, receivedArg);
                    const k = l.parseArg(l, t, cblk2, blk, receivedArg);
                    return Turtle.DictActions.getValue(a, k, t, blk);
                }
            },
            isValueBlock: () => false,
            isArgBlock: () => true
        };

        const blocks = [setdict, name, key, value, probe, getdict];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test("a real set-value dispatch and a real get-value dispatch observe the same turtleDicts state", () => {
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // The real setValue wrote directly into activity.logo.turtleDicts.
        expect(logo.turtleDicts[0].myDict.color).toBe("green");

        // The real getValue, reached through a completely different Logo seam (parseArg -> the
        // arg block's own .arg(), not .flow()), read back the same value.
        expect(readBackValue).toBe("green");
    });
});
