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
 * A Stop mouse block run by one mouse must stop the mouse it names, right away,
 * and leave the mouse that ran it playing.
 */

global._ = str => str;
global._THIS_IS_MUSIC_BLOCKS_ = true;
global.NOINPUTERRORMSG = "No input";
global.Notation = jest.fn().mockImplementation(() => ({}));
global.Synth = jest.fn().mockImplementation(() => ({}));
global.Singer = {};
global.last = arr => arr[arr.length - 1];
global.instruments = { 0: {}, 1: {} };

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
    setup() {}
}
StubBlock.created = {};
global.FlowBlock = StubBlock;
global.ValueBlock = StubBlock;
global.LeftBlock = StubBlock;
global.BooleanBlock = StubBlock;
global.FlowClampBlock = StubBlock;

const { Logo } = require("../logo");
const { setupEnsembleBlocks } = require("../blocks/EnsembleBlocks");

function createTransport() {
    const events = new Map();
    let nextId = 1;
    return {
        isAvailable: true,
        isClockRunning: true,
        get seconds() {
            return Date.now() / 1000;
        },
        set seconds(value) {},
        getSecondsAtTime: time => time,
        schedule(callback, time) {
            const id = nextId++;
            const handle = setTimeout(
                () => {
                    events.delete(id);
                    callback(time);
                },
                Math.max(0, time * 1000 - Date.now())
            );
            events.set(id, handle);
            return id;
        },
        clear(id) {
            clearTimeout(events.get(id));
            events.delete(id);
        },
        cancel() {
            for (const handle of events.values()) clearTimeout(handle);
            events.clear();
        }
    };
}

function createTurtle(name) {
    return {
        name,
        inTrash: false,
        running: false,
        waitTime: 0,
        doWait(secs) {
            this.waitTime = secs * 1000;
        },
        singer: {
            inNoteBlock: [],
            backward: [],
            suppressOutput: false,
            justCounting: [],
            killAllVoices: jest.fn(),
            resetClampState: jest.fn()
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
        delayTimeout: null,
        delayParameters: null,
        _transportTime: null,
        _transportEventId: null,
        runGeneration: 0,
        companionTurtle: null
    };
}

describe("Stop mouse between two mice", () => {
    let logo;
    let activity;
    let turtles;
    let played;
    let stops;

    const flowBlock = (name, connections, flow, args = 0) => ({
        name,
        connections,
        protoblock: { args, dockTypes: [null, "anyin"], flow: flow || (() => null) },
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

    const note = (label, beats, parent, next) =>
        flowBlock(label, [parent, next], (args, l, turtle) => {
            played.push(label);
            turtles[turtle].doWait(beats);
            return null;
        });

    const ensemble = (name, parent, arg, next) =>
        flowBlock(name, [parent, arg, next], (...a) => StubBlock.created[name].flow(...a), 1);

    // A stack lists its blocks: "label:seconds" is a note, [name, mouse] an ensemble block.
    const load = stacks => {
        const blocks = [];
        const starts = stacks.map(stack => {
            const ids = [];
            for (const item of stack) {
                const id = blocks.length;
                const parent = ids.length ? ids[ids.length - 1] : null;
                if (Array.isArray(item)) {
                    blocks.push(ensemble(item[0], parent, id + 1, null));
                    blocks.push(textBlock(item[1], id));
                } else {
                    const [label, beats] = item.split(":");
                    blocks.push(note(label, Number(beats), parent, null));
                }
                if (parent !== null) {
                    const p = blocks[parent];
                    p.connections[p.connections.length - 1] = id;
                }
                ids.push(id);
            }
            return ids[0];
        });
        logo.blockList = blocks;
        activity.blocks.blockList = blocks;
        starts.forEach((blk, i) => (turtles[i].startBlock = blocks[blk]));
        return starts;
    };

    const play = starts => {
        starts.forEach((blk, i) => {
            turtles[i].running = true;
            logo.runFromBlock(logo, i, blk, 0, null);
        });
        jest.runAllTimers();
    };

    beforeEach(() => {
        jest.useFakeTimers();
        played = [];
        stops = [];
        StubBlock.created = {};
        turtles = [createTurtle("drone"), createTurtle("lead")];
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
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn()
            },
            errorMsg: jest.fn(),
            onStopTurtle: jest.fn(() => stops.push([...played]))
        };
        logo = new Logo(activity);
        activity.logo = logo;
        logo.synth = {
            transport: createTransport(),
            stop: jest.fn(),
            stopSound: jest.fn(),
            disposeAllInstruments: jest.fn()
        };
        logo.turtleDelay = 0;
        logo._synthsInitialized = true;
        setupEnsembleBlocks(activity);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("the stopped mouse plays nothing after the Stop mouse block", () => {
        play(
            load([
                ["a1:1", "a2:1", "a3:1"],
                ["b1:0.5", ["stopTurtle", "drone"], "b4:3", "b5:1"]
            ])
        );

        expect(played).not.toContain("a2");
        expect(played).not.toContain("a3");
        expect(turtles[0].running).toBe(false);
    });

    test("the mouse that ran Stop mouse plays to its end", () => {
        play(
            load([
                ["a1:1", "a2:1", "a3:1"],
                ["b1:0.5", ["stopTurtle", "drone"], "b4:3", "b5:1"]
            ])
        );

        expect(played.filter(n => n[0] === "b")).toEqual(["b1", "b4", "b5"]);
        expect(stops).toEqual([["a1", "b1", "b4", "b5"]]);
        expect(activity.errorMsg).not.toHaveBeenCalled();
    });

    test("a stopped mouse can be started again", () => {
        play(
            load([
                ["a1:1", "a2:1"],
                ["b1:0.5", ["stopTurtle", "drone"], ["startTurtle", "drone"], "b2:1"]
            ])
        );

        expect(activity.errorMsg).not.toHaveBeenCalled();
        expect(played.filter(n => n === "a1")).toHaveLength(2);
        expect(played.filter(n => n === "a2")).toHaveLength(1);
    });

    test("a mouse that stops itself ends its own flow", () => {
        play(
            load([
                ["a1:1", ["stopTurtle", "drone"], "a2:1"],
                ["b1:1", "b2:1"]
            ])
        );

        expect(played).not.toContain("a2");
        expect(played).toContain("b2");
        expect(stops).toHaveLength(1);
    });
});
