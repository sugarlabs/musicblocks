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
 * Integration test: the real, registered `ArticulationBlock` (js/blocks/VolumeBlocks.js) is
 * dispatched through the real `Logo.runFromBlockNow` (js/logo.js), which invokes the real
 * `Singer.VolumeActions.setRelativeVolume` (js/turtleactions/VolumeActions.js), which relies on
 * the real end-of-clamp dispatch machinery (`setDispatchBlock`/`setTurtleListener`/
 * `tur.endOfClampSignals`, js/logo.js) to revert the volume when the clamp closes.
 *
 * Real: `ArticulationBlock`'s registration and its own `flow()` (js/blocks/VolumeBlocks.js),
 * `Logo.runFromBlockNow`, `Singer.VolumeActions.setRelativeVolume`, the end-of-clamp dispatch.
 * Synthetic: the `vspace`/`hidden`/`number` block objects and the turtle/activity fixtures -
 * plain data, not registered protoblocks, needed only to give the real articulation clamp
 * something to run inside of and a place to signal to when it closes.
 *
 * `js/blocks/VolumeBlocks.js` needs `FlowBlock`/`FlowClampBlock`/`LeftBlock`/`ValueBlock` as
 * bare globals; `js/protoblocks.js` exports them as static properties on `ProtoBlock` for this
 * (see that file for why this small export exists).
 *
 * `runFromBlockNow` executes the clamp synchronously, so the "vspace" block inside it captures
 * the temporary boosted volume before the end-of-clamp cleanup runs and reverts it.
 */

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
global.DEFAULTDRUM = "kick";
global.VOICENAMES = {};
global.DRUMNAMES = {};
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
// production code does via `Singer.VolumeActions = class {...}`. No production code is mocked:
// setRelativeVolume runs for real.
const setupVolumeActions = require("../turtleactions/VolumeActions");

// Registers the real ArticulationBlock (and its Volume-palette siblings) into
// activity.blocks.protoBlockDict via BaseBlock.setup() (js/protoblocks.js) - the same
// registration path the real block palette relies on.
const { setupVolumeBlocks } = require("../blocks/VolumeBlocks");

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
        beginnerMode: false,
        palettes: {
            dict: { volume: { add: jest.fn() } }
        },
        blocks: {
            blockList: [],
            protoBlockDict: {},
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

// Plain data blocks (not registered protoblocks) for the clamp's synthetic surroundings.
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

describe("the real ArticulationBlock dispatches through Logo into real Singer.VolumeActions", () => {
    let logo;
    let turtle;
    let activity;
    let duringClampVolume;
    let duringClampSignalCount;

    beforeEach(() => {
        global.document.body.style.cursor = "default";
        turtle = createTurtle();
        activity = createActivity(turtle);
        logo = new Logo(activity);
        activity.logo = logo;
        duringClampVolume = null;
        duringClampSignalCount = null;

        setupVolumeActions(activity);
        setupVolumeBlocks(activity);
        const articulationProto = activity.blocks.protoBlockDict.articulation;

        // articulation (0): connections [prev, value, clampEntry, hidden] - real, registered
        // protoblock (real dockTypes/args from formBlock(), real flow()).
        // value (1):  synthetic number 25 (a +25% relative volume change)
        // vspace (2): synthetic clamp content - the checkpoint described in the file header
        // hidden (3): synthetic end-of-clamp signal target
        const hidden = makeFlowBlock("hidden", [0, null], null);
        const vspace = makeFlowBlock("vspace", [0, null], (args, l, t) => {
            const tur = activity.turtles.ithTurtle(t);
            duringClampVolume = [...tur.singer.synthVolume[DEFAULTVOICE]];
            // hidden is block index 3: confirms setDispatchBlock already registered the
            // reverting listener against it before the clamp body (this block) even runs.
            duringClampSignalCount = (tur.endOfClampSignals[3] || []).length;
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

        // While the clamp is open, a +25% relative volume was pushed on top of the base 60,
        // and the reverting listener was already registered against the end-of-clamp signal.
        expect(duringClampVolume).toEqual([60, 75]);
        expect(duringClampSignalCount).toBe(1);

        // Once the clamp's real end-of-clamp signal fires the reverting listener, the boosted
        // value is popped, the base volume remains, and the signal itself is consumed.
        expect(turtle.singer.synthVolume[DEFAULTVOICE]).toEqual([60]);
        expect(turtle.endOfClampSignals[3]).toEqual([]);
    });
});
