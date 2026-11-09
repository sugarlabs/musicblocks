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
 * Saving as ABC, Lilypond, MusicXML or MIDI runs the project without sound.
 * The mice must still meet each other's events, names and syncs where they do
 * when the project plays, or the file loses the parts that depend on them.
 */

global._ = str => str;
global._THIS_IS_MUSIC_BLOCKS_ = true;
global.NOINPUTERRORMSG = "No input";
global.NOACTIONERRORMSG = "No action";
global.Notation = jest.fn().mockImplementation(() => ({}));
global.Synth = jest.fn().mockImplementation(() => ({}));
global.Singer = {};
global.last = arr => arr[arr.length - 1];
global.instruments = { 0: {}, 1: {}, 2: {} };

jest.mock("tone", () => ({
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
}));

global.EmbeddedGraphicsScheduler =
    require("../embedded-graphics-scheduler").EmbeddedGraphicsScheduler;

Object.assign(global, require("../logoconstants"));

class StubBlock {
    constructor(name) {
        StubBlock.created[name] = this;
    }
    setPalette() {}
    setHelpString() {}
    formBlock() {}
    beginnerBlock() {}
    makeMacro() {}
    setCapability() {}
    changeName() {}
    setup() {}
}
StubBlock.created = {};
global.FlowBlock = StubBlock;
global.ValueBlock = StubBlock;
global.LeftBlock = StubBlock;
global.BooleanBlock = StubBlock;
global.FlowClampBlock = StubBlock;
global.StackClampBlock = StubBlock;

const { Logo, Queue } = require("../logo");
global.Queue = Queue;
const { setupActionBlocks } = require("../blocks/ActionBlocks");
const { setupEnsembleBlocks } = require("../blocks/EnsembleBlocks");

function createTurtle(name) {
    return {
        name,
        inTrash: false,
        running: false,
        waitTime: 0,
        doWait(secs) {
            this.waitTime = secs * 1000;
        },
        rename(newName) {
            this.name = newName;
        },
        singer: {
            turtleTime: 0,
            inNoteBlock: [],
            backward: [],
            suppressOutput: true,
            justCounting: [],
            runningFromEvent: false,
            killAllVoices: jest.fn(),
            dropPendingNotes: jest.fn()
        },
        painter: { closeSVG: jest.fn() },
        queue: [],
        parentFlowQueue: [],
        unhighlightQueue: [],
        parameterQueue: [],
        actionBoundaries: [],
        listeners: {},
        endOfClampSignals: {},
        butNotThese: {},
        runGeneration: 0,
        companionTurtle: null
    };
}

describe("Notation exports keep the order the mice play in", () => {
    let logo;
    let activity;
    let turtles;
    let played;

    const flowBlock = (name, connections, flow, args = 0) => ({
        name,
        connections,
        protoblock: { args, dockTypes: [null, "anyin", "anyin"], flow },
        isValueBlock: () => false,
        isArgBlock: () => false
    });

    const textBlock = (value, parent) => ({
        name: "text",
        value,
        connections: [parent],
        protoblock: { parameter: false, dockTypes: ["textout"] },
        isValueBlock: () => true,
        isArgBlock: () => false
    });

    const note = (label, beats, parent) =>
        flowBlock(label, [parent, null], (args, l, turtle) => {
            played.push(label);
            turtles[turtle].singer.turtleTime += beats;
        });

    const named = (name, parent, values) =>
        flowBlock(
            name,
            [parent, ...values.map(() => null), null],
            (...a) => StubBlock.created[name].flow(...a),
            values.length
        );

    // "label:beats" is a note, [name, ...text] a block with text arguments.
    const addStack = (blocks, stack) => {
        let parent = null;
        for (const item of stack) {
            const id = blocks.length;
            if (Array.isArray(item)) {
                const [name, ...values] = item;
                const block = named(name, parent, values);
                blocks.push(block);
                values.forEach((value, i) => {
                    block.connections[i + 1] = blocks.length;
                    blocks.push(textBlock(value, id));
                });
            } else {
                const [label, beats] = item.split(":");
                blocks.push(note(label, Number(beats), parent));
            }
            if (parent !== null) {
                const p = blocks[parent];
                p.connections[p.connections.length - 1] = id;
            }
            parent = id;
        }
    };

    const exportAbc = (stacks, actions = {}) => {
        const blocks = [];
        const starts = stacks.map(stack => {
            const start = blocks.length;
            addStack(blocks, stack);
            return start;
        });
        logo.actions = {};
        for (const name in actions) {
            logo.actions[name] = blocks.length;
            addStack(blocks, actions[name]);
        }
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;

        logo.runningAbc = true;
        starts.forEach((blk, i) => {
            turtles[i].running = true;
            logo.runFromBlock(logo, i, blk, 0, null);
        });
        jest.runAllTimers();
    };

    beforeEach(() => {
        jest.useFakeTimers();
        played = [];
        StubBlock.created = {};
        turtles = [createTurtle("drone"), createTurtle("lead"), createTurtle("bass")];
        const listeners = {};
        activity = {
            blocks: { blockList: [], visible: false, sameGeneration: jest.fn(() => false) },
            turtles: {
                turtleList: turtles,
                ithTurtle: i => turtles[i],
                getTurtle: i => turtles[i],
                getTurtleCount: () => turtles.length,
                running: () => turtles.some(t => t.running)
            },
            stage: {
                addEventListener: jest.fn((name, fn) => (listeners[name] = fn)),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(name => listeners[name] && listeners[name]())
            },
            save: { afterSaveAbc: jest.fn(() => played.push("saved")) },
            errorMsg: jest.fn(),
            onStopTurtle: jest.fn()
        };
        logo = new Logo(activity);
        activity.logo = logo;
        logo.synth = {
            transport: { isAvailable: false },
            stop: jest.fn(),
            stopSound: jest.fn(),
            disposeAllInstruments: jest.fn()
        };
        logo.notation = {};
        global.activity = activity;
        setupActionBlocks(activity);
        setupEnsembleBlocks(activity);
    });

    afterEach(() => {
        jest.useRealTimers();
        delete global.activity;
    });

    test("writes a mouse started by an event", () => {
        exportAbc([["a1:1", "a2:1", ["dispatch", "go"], "a3:1"], [["listen", "go", "part"]]], {
            part: ["b1:1", "b2:1"]
        });

        expect(played).toEqual(expect.arrayContaining(["b1", "b2"]));
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });

    test("saves the file after the last note of a mouse started by an event", () => {
        exportAbc([["a1:1", ["dispatch", "go"], "a2:1"], [["listen", "go", "part"]]], {
            part: ["b1:1", "b2:1", "b3:1"]
        });

        expect(activity.save.afterSaveAbc).toHaveBeenCalledTimes(1);
        expect(played.slice(-2)).toEqual(["b3", "saved"]);
    });

    test("finds a mouse by the name it gives itself", () => {
        exportAbc([
            ["x:0", ["turtlesync", "Mr. Mouse"], "b1:1"],
            [["setturtlename2", "Mr. Mouse"], "a1:1"]
        ]);

        expect(activity.errorMsg).not.toHaveBeenCalled();
        expect(played).toEqual(expect.arrayContaining(["a1", "b1"]));
    });

    test("takes the notes in the order of the music", () => {
        exportAbc(
            [
                ["a1:1", "a2:0.5", "a3:0.5", ["dispatch", "go"], "a4:1"],
                ["b1:0.5", "b2:2", "b3:1"],
                [["listen", "go", "part"]]
            ],
            { part: ["c1:0.25", "c2:0.25"] }
        );

        expect(played).toEqual(["a1", "b1", "b2", "a2", "a3", "c1", "a4", "c2", "b3", "saved"]);
    });
});
