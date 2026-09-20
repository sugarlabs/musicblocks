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
 * (`runFromBlockNow`/`parseArg`, js/logo.js) driving the real
 * `Singer.MeterActions.setMeter` (js/turtleactions/MeterActions.js) - extending the pattern
 * `noteclamp-beat-doublequeue.test.js` (drum dispatch), `pitch-note-dispatch-integration.test.js`
 * (pitch dispatch), and `interval-scalar-dispatch-integration.test.js` (interval dispatch)
 * already use.
 *
 * Scope: this covers the Logo-dispatch <-> MeterActions seam, not MeterBlock's own palette
 * registration (that is already covered, with setMeter mocked, by
 * js/blocks/__tests__/MeterBlocks.test.js). `Logo.runFromBlockNow` and `setMeter` run for real
 * and unmocked - the "meter" block below is a minimal stand-in shaped like the real block
 * (js/blocks/MeterBlocks.js, MeterBlock.flow), not obtained from a live registered protoblock,
 * for the same reason given in interval-scalar-dispatch-integration.test.js: the concrete
 * FlowBlock class it extends (js/protoblocks.js) only exists as a bare global in the production
 * script-concatenation build, so reaching it from Jest would mean either evaluating
 * protoblocks.js's source at runtime or driving the full canvas/DOM-heavy
 * Blocks.makeBlock/Block path (js/blocks.js, js/block.js), both disproportionate to this one
 * behavior. Consequently, a regression in MeterBlock.flow itself would not fail this test; a
 * regression in setMeter or in the Logo dispatch/argument-evaluation machinery around it would
 * (verified by deliberately breaking each and confirming the test fails).
 *
 * setMeter, unlike setScalarInterval or the volume articulation clamp, isn't a clamp entry - it
 * writes turtle-singer state directly and returns, with no clamp push/pop and no timer/interval
 * involved (unlike onEveryBeatDo). That makes tur.singer.beatsPerMeasure/noteValuePerBeat the
 * most stable observable in MeterActions: it is set once, synchronously, and does not depend on
 * notesPlayed bookkeeping (getBeatCount/getMeasureCount) or on the shared Singer.masterBPM global
 * (setBPM/setMasterBPM).
 */

// Setup global mocks BEFORE requiring the module (mirror of interval-scalar-dispatch-integration.test.js).
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

// Singer.MeterActions is attached to the module-level `Singer` mock above, exactly as
// production code does via `Singer.MeterActions = class {...}` (js/turtleactions/MeterActions.js).
// No production code is mocked: setMeter runs for real.
const setupMeterActions = require("../turtleactions/MeterActions");

function createTurtle() {
    return {
        singer: {
            beatsPerMeasure: 4,
            noteValuePerBeat: 1 / 4,
            beatList: [],
            factorList: [],
            defaultStrongBeats: false,
            bpm: [],
            notesPlayed: [0, 1],
            pickup: 0,
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

describe("Logo dispatch drives the real Singer.MeterActions.setMeter", () => {
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
        // logo.notation is a getter-only accessor (js/logo.js) backed by the global Notation
        // mock's return value - extend that object rather than reassigning logo.notation.
        logo.notation.notationMeter = jest.fn();

        setupMeterActions(activity);

        // meter (0):  connections [prev, beatCountArg, noteValueArg, next] - the connections
        // shape produced when the "meter" block is dragged from the Meter palette (see
        // MeterBlock's own makeMacro, js/blocks/MeterBlocks.js).
        // beats (1):  number 6 (beats per measure)
        // note (2):   number 1/8 (note value per beat)
        // hidden (3): connections [prev, null] (end of flow)
        const hidden = makeFlowBlock("hidden", [0, null], null);
        const meter = makeFlowBlock(
            "meter",
            [null, 1, 2, 3],
            (args, l, t) => {
                // Copied verbatim from MeterBlock.flow (js/blocks/MeterBlocks.js), minus the
                // insideMeterWidget/inMusicKeyboard branches - see the file-level comment above
                // for why this isn't a live protoblock.
                const arg0 = args[0] === null || typeof args[0] !== "number" ? 4 : args[0];
                const arg1 = args[1] === null || typeof args[1] !== "number" ? 1 / 4 : args[1];
                Singer.MeterActions.setMeter(arg0, arg1, t);
                return null;
            },
            [null, "numberin", "numberin", "in"],
            2
        );
        const beats = {
            name: "number",
            value: 6,
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

        const blocks = [meter, beats, noteValue, hidden];
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
    });

    test("writes the real beatsPerMeasure/noteValuePerBeat and default strong beats through dispatch", () => {
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // The 6/8 signature is set on the real turtle-singer state via the real setMeter.
        expect(turtle.singer.beatsPerMeasure).toBe(6);
        expect(turtle.singer.noteValuePerBeat).toBe(8);

        // setMeter's 6/8 branch also seeds the default strong beats.
        expect(turtle.singer.beatList).toEqual([1, 4]);
        expect(turtle.singer.defaultStrongBeats).toBe(true);

        // And it notifies notation of the new meter through the real activity.logo.notation hook.
        expect(logo.notation.notationMeter).toHaveBeenCalledWith(0, 6, 8);
    });
});
