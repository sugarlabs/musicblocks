/**
 * MusicBlocks v3.6.2
 *
 * @author Anubhab 
 *
 * @copyright 2025 Anubhab 
 *
 * @license
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

const fs = require("fs");
const path = require("path");

const code = fs.readFileSync(
    path.join(__dirname, "../IntervalsBlocks.js"),
    "utf8"
);

eval(code);

describe("setupIntervalsBlocks", () => {
    let activity;
    let logo;
    let createdBlocks;
    let turtleIndex;

    class DummyValueBlock {
        constructor(name) {
            this.name = name;
            createdBlocks[name] = this;
        }
        setPalette() { return this; }
        beginnerBlock() { return this; }
        setHelpString() { return this; }
        formBlock() { return this; }
        makeMacro() { return this; }
        setup() { return this; }
    }

    class DummyFlowBlock extends DummyValueBlock {}
    class DummyFlowClampBlock extends DummyValueBlock {}
    class DummyLeftBlock extends DummyValueBlock {}

    beforeEach(() => {
        createdBlocks = {};

        global._ = jest.fn(msg => msg);
        global.last = jest.fn(arr => arr[arr.length - 1]);

        global.ValueBlock = DummyValueBlock;
        global.FlowBlock = DummyFlowBlock;
        global.FlowClampBlock = DummyFlowClampBlock;
        global.LeftBlock = DummyLeftBlock;

        global.NOINPUTERRORMSG = "No input";
        global.DEFAULTCHORD = "major";
        global.CHORDNAMES = {
            major: ["major", "major"],
        };
        global.CHORDVALUES = {
            major: [[0, 4], [0, 7]],
        };
        global.INTERVALVALUES = {
            fifth: [0, 0, 1.5],
        };

        global.Singer = {
            IntervalsActions: {
                setTemperament: jest.fn(),
                GetIntervalNumber: jest.fn(() => 5),
                GetCurrentInterval: jest.fn(() => 7),
                setSemitoneInterval: jest.fn(),
                setScalarInterval: jest.fn(),
                setChordInterval: jest.fn(),
                setRatioInterval: jest.fn(),
                defineMode: jest.fn(),
                setMovableDo: jest.fn(),
                getModeLength: jest.fn(() => 7),
                getCurrentMode: jest.fn(() => "major"),
                getCurrentKey: jest.fn(() => "C"),
                setKey: jest.fn(),
            },
            scalarDistance: jest.fn(() => 3),
        };

        activity = {
            errorMsg: jest.fn(),
            blocks: {
                blockList: {},
                findBottomBlock: jest.fn(),
            },
            turtles: {
                ithTurtle() {
                    return {
                        singer: {
                            suppressOutput: false,
                            justCounting: [],
                            justMeasuring: [],
                            firstPitch: [],
                            lastPitch: [],
                            notesPlayed: 0,
                            duplicateFactor: 1,
                            arpeggio: [],
                        },
                        painter: {
                            doPenUp: jest.fn(),
                            doSetXY: jest.fn(),
                            doSetHeading: jest.fn(),
                        },
                        endOfClampSignals: {},
                        butNotThese: {},
                        queue: [],
                        parentFlowQueue: [],
                    };
                },
            },
        };

        logo = {
            inStatusMatrix: false,
            statusFields: [],
            parseArg: jest.fn((l, t, c, b, r) => r),
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            notation: {
                notationKey: jest.fn(),
            },
        };

        turtleIndex = 0;
        setupIntervalsBlocks(activity);
    });

    it("registers interval blocks", () => {
        expect(Object.keys(createdBlocks).length).toBeGreaterThan(0);
    });

    it("IntervalNumberBlock returns interval number", () => {
        const blk = "blk1";
        activity.blocks.blockList[blk] = { connections: [null] };

        expect(
            createdBlocks.intervalnumber.arg(logo, turtleIndex, blk)
        ).toBe(5);
    });

    it("CurrentIntervalBlock returns current interval", () => {
        const blk = "blk2";
        activity.blocks.blockList[blk] = { connections: [null] };

        expect(
            createdBlocks.currentinterval.arg(logo, turtleIndex, blk)
        ).toBe(7);
    });

    it("MovableBlock sets movable do", () => {
        createdBlocks.movable.flow([true], logo, turtleIndex, "blk3");

        expect(
            Singer.IntervalsActions.setMovableDo
        ).toHaveBeenCalledWith(true, turtleIndex);
    });

    it("ModeLengthBlock returns mode length", () => {
        const blk = "blk4";
        activity.blocks.blockList[blk] = { connections: [null] };

        expect(
            createdBlocks.modelength.arg(logo, turtleIndex, blk)
        ).toBe(7);
    });

    it("KeyBlock returns current key", () => {
        const blk = "blk5";
        activity.blocks.blockList[blk] = { connections: [null] };

        expect(
            createdBlocks.key.arg(logo, turtleIndex, blk)
        ).toBe("C");
    });
});
