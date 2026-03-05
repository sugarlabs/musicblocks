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

const code = fs.readFileSync(path.join(__dirname, "../IntervalsBlocks.js"), "utf8");

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
        setPalette() {
            return this;
        }
        beginnerBlock() {
            return this;
        }
        setHelpString() {
            return this;
        }
        formBlock() {
            return this;
        }
        makeMacro() {
            return this;
        }
        setup() {
            return this;
        }
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
            major: ["major", "major"]
        };
        global.CHORDVALUES = {
            major: [
                [0, 4],
                [0, 7]
            ]
        };
        global.INTERVALVALUES = {
            fifth: [0, 0, 1.5]
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
                setKey: jest.fn()
            },
            scalarDistance: jest.fn(() => 3)
        };

        activity = {
            errorMsg: jest.fn(),
            blocks: {
                blockList: {},
                findBottomBlock: jest.fn()
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
                            arpeggio: []
                        },
                        painter: {
                            doPenUp: jest.fn(),
                            doSetXY: jest.fn(),
                            doSetHeading: jest.fn()
                        },
                        endOfClampSignals: {},
                        butNotThese: {},
                        queue: [],
                        parentFlowQueue: []
                    };
                }
            }
        };

        logo = {
            inStatusMatrix: false,
            statusFields: [],
            parseArg: jest.fn((l, t, c, b, r) => r),
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            notation: {
                notationKey: jest.fn()
            }
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

        expect(createdBlocks.intervalnumber.arg(logo, turtleIndex, blk)).toBe(5);
    });

    it("CurrentIntervalBlock returns current interval", () => {
        const blk = "blk2";
        activity.blocks.blockList[blk] = { connections: [null] };

        expect(createdBlocks.currentinterval.arg(logo, turtleIndex, blk)).toBe(7);
    });

    it("MovableBlock sets movable do", () => {
        createdBlocks.movable.flow([true], logo, turtleIndex, "blk3");

        expect(Singer.IntervalsActions.setMovableDo).toHaveBeenCalledWith(true, turtleIndex);
    });

    it("ModeLengthBlock returns mode length", () => {
        const blk = "blk4";
        activity.blocks.blockList[blk] = { connections: [null] };

        expect(createdBlocks.modelength.arg(logo, turtleIndex, blk)).toBe(7);
    });

    it("KeyBlock returns current key", () => {
        const blk = "blk5";
        activity.blocks.blockList[blk] = { connections: [null] };

        expect(createdBlocks.key.arg(logo, turtleIndex, blk)).toBe("C");
    });

    // === NEW TESTS ===

    it("SetTemperamentBlock calls setTemperament", () => {
        createdBlocks.settemperament.flow(["equal", "C", 4], logo, turtleIndex, "blk");
        expect(Singer.IntervalsActions.setTemperament).toHaveBeenCalledWith("equal", "C", 4);
    });

    it("SemitoneIntervalBlock sets interval and returns child block", () => {
        const result = createdBlocks.semitoneinterval.flow([5, "childBlk"], logo, turtleIndex, "blk");
        expect(Singer.IntervalsActions.setSemitoneInterval).toHaveBeenCalledWith(5, turtleIndex, "blk");
        expect(result).toEqual(["childBlk", 1]);
    });

    it("SemitoneIntervalBlock returns early when args[1] undefined", () => {
        const result = createdBlocks.semitoneinterval.flow([5, undefined], logo, turtleIndex, "blk");
        expect(result).toBeUndefined();
    });

    it("DoublyBlock returns 0 and shows error on null connection", () => {
        activity.blocks.blockList.blk1 = { connections: [null, null] };
        const result = createdBlocks.doubly.arg(logo, turtleIndex, "blk1", null);
        expect(result).toBe(0);
        expect(activity.errorMsg).toHaveBeenCalledWith("No input", "blk1");
    });

    it("DoublyBlock adds 1 for augmented intervalname", () => {
        activity.blocks.blockList.blk1 = { connections: [null, "conn1"] };
        activity.blocks.blockList.conn1 = { name: "intervalname", value: "augmented" };
        logo.parseArg = jest.fn(() => 5);
        const result = createdBlocks.doubly.arg(logo, turtleIndex, "blk1", null);
        expect(result).toBe(6); // 5 + 1
    });

    it("DoublyBlock subtracts 1 for diminished intervalname", () => {
        activity.blocks.blockList.blk1 = { connections: [null, "conn1"] };
        activity.blocks.blockList.conn1 = { name: "intervalname", value: "diminished" };
        logo.parseArg = jest.fn(() => 5);
        const result = createdBlocks.doubly.arg(logo, turtleIndex, "blk1", null);
        expect(result).toBe(4); // 5 - 1
    });

    it("DoublyBlock doubles number values", () => {
        activity.blocks.blockList.blk1 = { connections: [null, "conn1"] };
        activity.blocks.blockList.conn1 = { name: "number", connections: [null, null] };
        logo.parseArg = jest.fn(() => 3);
        const result = createdBlocks.doubly.arg(logo, turtleIndex, "blk1", null);
        expect(result).toBe(6); // 3 * 2
    });

    it("IntervalNumberBlock pushes to statusFields when inStatusMatrix", () => {
        logo.inStatusMatrix = true;
        activity.blocks.blockList.blk1 = { connections: ["print1"] };
        activity.blocks.blockList.print1 = { name: "print" };
        createdBlocks.intervalnumber.arg(logo, turtleIndex, "blk1");
        expect(logo.statusFields).toContainEqual(["blk1", "intervalnumber"]);
    });

    it("CurrentIntervalBlock pushes to statusFields when inStatusMatrix", () => {
        logo.inStatusMatrix = true;
        activity.blocks.blockList.blk1 = { connections: ["print1"] };
        activity.blocks.blockList.print1 = { name: "print" };
        createdBlocks.currentinterval.arg(logo, turtleIndex, "blk1");
        expect(logo.statusFields).toContainEqual(["blk1", "currentinterval"]);
    });

});
