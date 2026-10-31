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
 * A clamp nested inside another clamp of the same kind must not take over the outer
 * clamp's end listener: each end has to undo only what its own clamp did.
 */

global._ = str => str;
global.Notation = jest.fn().mockImplementation(() => ({}));
global.Synth = jest.fn().mockImplementation(() => ({}));
global.Singer = {};
global.last = arr => arr[arr.length - 1];
global.DRUMNAMES = [
    ["kick drum", "kick drum"],
    ["snare drum", "snare drum"]
];
global.DEFAULTDRUM = "kick drum";

jest.mock("tone", () => ({
    UserMedia: jest.fn().mockImplementation(() => ({
        open: jest.fn()
    }))
}));

global.EmbeddedGraphicsScheduler =
    require("../embedded-graphics-scheduler").EmbeddedGraphicsScheduler;

Object.assign(global, require("../logoconstants"));

const { Logo } = require("../logo");
const setupRhythmActions = require("../turtleactions/RhythmActions");
const setupDrumActions = require("../turtleactions/DrumActions");

function createTurtle() {
    return {
        singer: {
            beatFactor: 1,
            dotCount: 0,
            drumStyle: [],
            pitchDrumTable: {},
            inNoteBlock: [],
            inDuplicate: false,
            backward: [],
            suppressOutput: true,
            justCounting: [],
            tie: false,
            tieNotePitches: [],
            tieNoteExtras: [],
            tieCarryOver: 0,
            tieFirstDrums: [],
            bpm: []
        },
        painter: { closeSVG: jest.fn() },
        queue: [],
        parentFlowQueue: [],
        listeners: {},
        endOfClampSignals: {}
    };
}

function flowBlock(name, connections, flow, args = 0) {
    return {
        name,
        connections,
        protoblock: { args, dockTypes: [null], flow: flow || (() => null) },
        isValueBlock: () => false,
        isArgBlock: () => false
    };
}

function valueBlock(name, value, parent) {
    return {
        name,
        value,
        connections: [parent],
        protoblock: { parameter: false, dockTypes: ["anyout"] },
        isValueBlock: () => true,
        isArgBlock: () => false
    };
}

describe("nested clamps of the same kind", () => {
    let logo;
    let turtle;
    let snapshots;

    // outer (0) holds inner (2), which holds a probe; a probe follows each clamp's hidden block.
    const run = (name, outerArg, innerArg, flow, snapshot) => {
        const probe = (parent, next) =>
            flowBlock("probe", [parent, next], () => {
                snapshots.push(snapshot());
                return null;
            });
        const clamp = (parent, arg, child, next) =>
            flowBlock(
                name,
                [parent, arg, child, next],
                (args, l, t, blk) => {
                    flow(args[0], t, blk);
                    return [args[1], 1];
                },
                2
            );

        const blocks = [
            clamp(null, 1, 2, 7),
            valueBlock(typeof outerArg === "number" ? "number" : "text", outerArg, 0),
            clamp(0, 3, 4, 5),
            valueBlock(typeof innerArg === "number" ? "number" : "text", innerArg, 2),
            probe(2, null),
            flowBlock("hidden", [2, 6]),
            probe(5, null),
            flowBlock("hidden", [0, 8]),
            probe(7, null)
        ];
        logo.blockList = blocks;
        logo.activity.blocks.blockList = blocks;
        logo.runFromBlockNow(logo, 0, 0, 1, null);
    };

    beforeEach(() => {
        turtle = createTurtle();
        snapshots = [];
        const activity = {
            blocks: { blockList: [], sameGeneration: jest.fn(() => false) },
            turtles: {
                turtleList: [turtle],
                ithTurtle: jest.fn(() => turtle),
                getTurtle: jest.fn(() => turtle),
                running: jest.fn(() => false)
            },
            stage: {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(name => turtle.listeners[name]?.())
            },
            errorMsg: jest.fn(),
            onStopTurtle: jest.fn()
        };
        logo = new Logo(activity);
        activity.logo = logo;
        activity.logo.notation = {
            notationRemoveTie: jest.fn(),
            notationStaging: { 0: [] }
        };
        turtle.doWait = jest.fn();
        setupRhythmActions(activity);
        setupDrumActions(activity);
    });

    test("dot: each end restores its own dot count", () => {
        run("rhythmicdot2", 1, 2, Singer.RhythmActions.doRhythmicDot, () => [
            turtle.singer.dotCount,
            turtle.singer.beatFactor
        ]);

        expect(snapshots).toEqual([
            [3, 1 / 1.875],
            [1, 1 / 1.5],
            [0, 1]
        ]);
    });

    test("set drum: a mapping made inside the outer clamp does not outlive it", () => {
        const setDrum = Singer.DrumActions.setDrum;
        run(
            "setdrum",
            "kick drum",
            "snare drum",
            (drum, t, blk) => {
                setDrum(drum, t, blk);
                if (drum === "kick drum") turtle.singer.pitchDrumTable.C4 = drum;
            },
            () => ({ ...turtle.singer.pitchDrumTable })
        );

        expect(snapshots[1]).toEqual({ C4: "kick drum" });
        expect(snapshots[2]).toEqual({});
    });

    test("tie: outer tie is preserved when inner clamp completes", () => {
        const tieSnapshots = [];
        const probe = (parent, next) =>
            flowBlock("probe", [parent, next], () => {
                tieSnapshots.push(turtle.singer.tie);
                return null;
            });
        const tieClamp = (parent, child, next) =>
            flowBlock(
                "tie",
                [parent, child, next],
                (args, l, t, blk) => {
                    Singer.RhythmActions.doTie(t, blk);
                    return [args[0], 1];
                },
                1
            );

        // outer tie (0) -> inner tie (1) -> probe (2) -> inner hidden (3) -> probe (4) -> outer hidden (5) -> probe (6)
        const blocks = [
            tieClamp(null, 1, 5),
            tieClamp(0, 2, 3),
            probe(1, null),
            flowBlock("hidden", [1, 4]),
            probe(3, null),
            flowBlock("hidden", [0, 6]),
            probe(5, null)
        ];
        logo.blockList = blocks;
        logo.activity.blocks.blockList = blocks;
        logo.runFromBlockNow(logo, 0, 0, 1, null);

        // Before fix: inner tie exit dispatched inner listener which set tie = false at probe(4) -> [true, false, false].
        // With defensive runtime fix: outer tie remains active across inner clamp exit -> [true, true, false].
        expect(tieSnapshots).toEqual([true, true, false]);
    });
});
