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

const { setupIntervalsBlocks } = require("../IntervalsBlocks");

describe("setupIntervalsBlocks", () => {
    let activity;
    let logo;
    let createdBlocks;
    let turtleIndex;
    let turtleState;

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
            this.macro = arguments[0];
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
        global.Queue = jest.fn((child, factor, blk, receivedArg) => ({
            child,
            factor,
            blk,
            receivedArg
        }));

        global.NOINPUTERRORMSG = "No input";
        global.DEFAULTCHORD = "major";
        global.CHORDNAMES = ["major"];
        global.CHORDVALUES = [
            [
                [0, 4],
                [0, 7]
            ]
        ];
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
                GetModename: jest.fn(() => "major"),
                getModeLength: jest.fn(() => 7),
                getCurrentMode: jest.fn(() => "major"),
                getCurrentKey: jest.fn(() => "C"),
                setKey: jest.fn()
            },
            scalarDistance: jest.fn(() => 3)
        };

        turtleState = {
            x: 10,
            y: 20,
            orientation: 90,
            singer: {
                suppressOutput: false,
                justCounting: [],
                justMeasuring: [],
                firstPitch: [],
                lastPitch: [],
                notesPlayed: 0,
                duplicateFactor: 1,
                arpeggio: [],
                inDuplicate: false
            },
            painter: {
                color: "blue",
                value: 50,
                chroma: 25,
                stroke: 3,
                canvasAlpha: 1,
                penState: true,
                doPenUp: jest.fn(),
                doSetXY: jest.fn(),
                doSetHeading: jest.fn()
            },
            endOfClampSignals: {},
            butNotThese: {},
            queue: [],
            parentFlowQueue: []
        };

        activity = {
            errorMsg: jest.fn(),
            blocks: {
                blockList: {},
                findBottomBlock: jest.fn(() => null)
            },
            turtles: {
                ithTurtle() {
                    return turtleState;
                }
            }
        };

        logo = {
            inStatusMatrix: false,
            statusFields: [],
            boxes: {},
            turtleHeaps: { 0: [] },
            turtleDicts: { 0: {} },
            connectionStore: { 0: {} },
            connectionStoreLock: false,
            runFromBlockNow: jest.fn(),
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

    it("executes macro builders for interval blocks", () => {
        const macroBlocks = [
            "settemperament",
            "major3",
            "semitoneinterval",
            "arpeggio",
            "chordinterval",
            "ratiointerval",
            "interval",
            "definemode",
            "movable",
            "setkey2"
        ];

        for (const blockName of macroBlocks) {
            expect(typeof createdBlocks[blockName].macro).toBe("function");
            const macroResult = createdBlocks[blockName].macro(10, 20);
            expect(Array.isArray(macroResult)).toBe(true);
            expect(macroResult.length).toBeGreaterThan(0);
        }
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

    it("Value blocks updateParameter returns block value", () => {
        activity.blocks.blockList.blkIntervalNumber = { value: 12 };
        activity.blocks.blockList.blkCurrentInterval = { value: 8 };
        activity.blocks.blockList.blkModeLength = { value: 7 };
        activity.blocks.blockList.blkCurrentMode = { value: "minor" };
        activity.blocks.blockList.blkKey = { value: "G" };

        expect(
            createdBlocks.intervalnumber.updateParameter(logo, turtleIndex, "blkIntervalNumber")
        ).toBe(12);
        expect(
            createdBlocks.currentinterval.updateParameter(logo, turtleIndex, "blkCurrentInterval")
        ).toBe(8);
        expect(createdBlocks.modelength.updateParameter(logo, turtleIndex, "blkModeLength")).toBe(
            7
        );
        expect(createdBlocks.currentmode.updateParameter(logo, turtleIndex, "blkCurrentMode")).toBe(
            "minor"
        );
        expect(createdBlocks.key.updateParameter(logo, turtleIndex, "blkKey")).toBe("G");
    });

    it("KeyBlock returns current key", () => {
        const blk = "blk5";
        activity.blocks.blockList[blk] = { connections: [null] };

        expect(createdBlocks.key.arg(logo, turtleIndex, blk)).toBe("C");
    });

    it("SetTemperamentBlock calls setTemperament", () => {
        createdBlocks.settemperament.flow(["equal", "C", 4], logo, turtleIndex, "blk");
        expect(Singer.IntervalsActions.setTemperament).toHaveBeenCalledWith("equal", "C", 4);
    });

    it("SemitoneIntervalBlock sets interval and returns child block", () => {
        const result = createdBlocks.semitoneinterval.flow(
            [5, "childBlk"],
            logo,
            turtleIndex,
            "blk"
        );
        expect(Singer.IntervalsActions.setSemitoneInterval).toHaveBeenCalledWith(
            5,
            turtleIndex,
            "blk"
        );
        expect(result).toEqual(["childBlk", 1]);
    });

    it("SemitoneIntervalBlock returns early when args[1] undefined", () => {
        const result = createdBlocks.semitoneinterval.flow(
            [5, undefined],
            logo,
            turtleIndex,
            "blk"
        );
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

    it("DoublyBlock duplicates string values", () => {
        activity.blocks.blockList.blk1 = { connections: [null, "conn1"] };
        activity.blocks.blockList.conn1 = { name: "text", connections: [null, null] };
        logo.parseArg = jest.fn(() => "la");
        const result = createdBlocks.doubly.arg(logo, turtleIndex, "blk1", null);
        expect(result).toBe("lala");
    });

    it("DoublyBlock returns 0 for trailing doubly chain", () => {
        activity.blocks.blockList.blk1 = { connections: [null, "conn1"] };
        activity.blocks.blockList.conn1 = { name: "doubly", connections: [null, null] };
        const result = createdBlocks.doubly.arg(logo, turtleIndex, "blk1", null);
        expect(result).toBe(0);
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

    it("ModeLengthBlock pushes to statusFields when inStatusMatrix", () => {
        logo.inStatusMatrix = true;
        activity.blocks.blockList.blk1 = { connections: ["print1"] };
        activity.blocks.blockList.print1 = { name: "print" };
        createdBlocks.modelength.arg(logo, turtleIndex, "blk1");
        expect(logo.statusFields).toContainEqual(["blk1", "modelength"]);
    });

    it("CurrentModeBlock returns current mode", () => {
        const blk = "blk6";
        activity.blocks.blockList[blk] = { connections: [null] };
        expect(createdBlocks.currentmode.arg(logo, turtleIndex, blk)).toBe("major");
    });

    it("CurrentModeBlock pushes to statusFields when inStatusMatrix", () => {
        logo.inStatusMatrix = true;
        activity.blocks.blockList.blk1 = { connections: ["print1"] };
        activity.blocks.blockList.print1 = { name: "print" };
        createdBlocks.currentmode.arg(logo, turtleIndex, "blk1");
        expect(logo.statusFields).toContainEqual(["blk1", "currentmode"]);
    });

    it("KeyBlock pushes to statusFields when inStatusMatrix", () => {
        logo.inStatusMatrix = true;
        activity.blocks.blockList.blk1 = { connections: ["print1"] };
        activity.blocks.blockList.print1 = { name: "print" };
        createdBlocks.key.arg(logo, turtleIndex, "blk1");
        expect(logo.statusFields).toContainEqual(["blk1", "key"]);
    });

    it("ScalarIntervalBlock sets interval and returns child block", () => {
        const result = createdBlocks.interval.flow([3, "childBlk"], logo, turtleIndex, "blk");
        expect(Singer.IntervalsActions.setScalarInterval).toHaveBeenCalledWith(
            3,
            turtleIndex,
            "blk"
        );
        expect(result).toEqual(["childBlk", 1]);
    });

    it("ScalarIntervalBlock returns early when args[1] undefined", () => {
        const result = createdBlocks.interval.flow([3, undefined], logo, turtleIndex, "blk");
        expect(result).toBeUndefined();
    });

    it("ChordIntervalBlock sets intervals and returns child block", () => {
        global.CHORDNAMES = ["major"];
        global.CHORDVALUES = [
            [
                [0, 0],
                [Number.NaN, 4],
                [0, 7]
            ]
        ];
        const result = createdBlocks.chordinterval.flow(
            ["major", "childBlk"],
            logo,
            turtleIndex,
            "blk"
        );
        expect(Singer.IntervalsActions.setChordInterval).toHaveBeenCalledTimes(1);
        expect(Singer.IntervalsActions.setChordInterval).toHaveBeenCalledWith(
            [0, 7],
            turtleIndex,
            "blk"
        );
        expect(result).toEqual(["childBlk", 1]);
    });

    it("ChordIntervalBlock falls back to default chord", () => {
        global.CHORDNAMES = ["major"];
        global.CHORDVALUES = [
            [
                [0, 4],
                [0, 7]
            ]
        ];
        createdBlocks.chordinterval.flow(["unknown", "childBlk"], logo, turtleIndex, "blk");
        expect(Singer.IntervalsActions.setChordInterval).toHaveBeenCalledTimes(2);
    });

    it("RatioIntervalBlock shows error when input block is missing", () => {
        activity.blocks.blockList.blkRatio = { connections: [null, null] };
        const result = createdBlocks.ratiointerval.flow(
            [2, "childBlk"],
            logo,
            turtleIndex,
            "blkRatio"
        );
        expect(activity.errorMsg).toHaveBeenCalledWith("No input", "blkRatio");
        expect(Singer.IntervalsActions.setRatioInterval).toHaveBeenCalledWith(
            1,
            turtleIndex,
            "blkRatio"
        );
        expect(result).toEqual(["childBlk", 1]);
    });

    it("RatioIntervalBlock uses intervalname ratio value", () => {
        activity.blocks.blockList.blkRatio = { connections: [null, "conn1"] };
        activity.blocks.blockList.conn1 = { name: "intervalname", value: "fifth" };
        createdBlocks.ratiointerval.flow([9, "childBlk"], logo, turtleIndex, "blkRatio");
        expect(Singer.IntervalsActions.setRatioInterval).toHaveBeenCalledWith(
            1.5,
            turtleIndex,
            "blkRatio"
        );
    });

    it("RatioIntervalBlock normalizes invalid ratios", () => {
        activity.blocks.blockList.blkRatio = { connections: [null, "conn1"] };
        activity.blocks.blockList.conn1 = { name: "number", value: -5 };
        createdBlocks.ratiointerval.flow([-5, "childBlk"], logo, turtleIndex, "blkRatio");
        expect(Singer.IntervalsActions.setRatioInterval).toHaveBeenCalledWith(
            1,
            turtleIndex,
            "blkRatio"
        );
    });

    it("MovableBlock ignores invalid arg length", () => {
        createdBlocks.movable.flow([], logo, turtleIndex, "blk");
        expect(Singer.IntervalsActions.setMovableDo).not.toHaveBeenCalled();
    });

    it("SetKeyBlock updates turtle key signature", () => {
        const turtle = { singer: { keySignature: "" } };
        activity.turtles.ithTurtle = jest.fn(() => turtle);
        createdBlocks.setkey.flow(["D minor"], logo, turtleIndex);
        expect(turtle.singer.keySignature).toBe("D minor");
    });

    it("SetKeyBlock ignores invalid arg length", () => {
        const turtle = { singer: { keySignature: "C major" } };
        activity.turtles.ithTurtle = jest.fn(() => turtle);
        createdBlocks.setkey.flow([], logo, turtleIndex);
        expect(turtle.singer.keySignature).toBe("C major");
    });

    it("SetKey2Block constructor handles beginner Japanese help branch", () => {
        createdBlocks = {};
        activity.beginnerMode = true;
        DummyFlowBlock.prototype.lang = "ja";

        setupIntervalsBlocks(activity);

        expect(createdBlocks.setkey2).toBeDefined();

        DummyFlowBlock.prototype.lang = undefined;
    });

    it("RatioIntervalBlock falls back when interval name is unknown", () => {
        activity.blocks.blockList.blkRatio = { connections: [null, "conn1"] };
        activity.blocks.blockList.conn1 = { name: "intervalname", value: "unknown-interval" };
        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

        createdBlocks.ratiointerval.flow([9, "childBlk"], logo, turtleIndex, "blkRatio");

        expect(Singer.IntervalsActions.setRatioInterval).toHaveBeenCalledWith(
            1,
            turtleIndex,
            "blkRatio"
        );
        logSpy.mockRestore();
    });

    it("SetKey2Block sets key and mode", () => {
        activity.blocks.blockList.blkKey2 = { connections: [null, null, "modeConn"] };
        createdBlocks.setkey2.flow(["D", "minor"], logo, turtleIndex, "blkKey2");
        expect(logo.modeBlock).toBe("modeConn");
        expect(Singer.IntervalsActions.setKey).toHaveBeenCalledWith(
            "D",
            "minor",
            turtleIndex,
            "blkKey2"
        );
    });

    it("SetKey2Block updates notation inside mode widget", () => {
        const turtle = { singer: { keySignature: "" } };
        activity.turtles.ithTurtle = jest.fn(() => turtle);
        logo.insideModeWidget = true;
        activity.blocks.blockList.blkKey2 = { connections: [null, null, "modeConn"] };
        createdBlocks.setkey2.flow(["E", "dorian"], logo, turtleIndex, "blkKey2");
        expect(turtle.singer.keySignature).toBe("E major");
        expect(logo.notation.notationKey).toHaveBeenCalledWith(0, "E", "major");
    });

    it("SetKey2Block ignores invalid arg length", () => {
        activity.blocks.blockList.blkKey2 = { connections: [null, null, "modeConn"] };
        createdBlocks.setkey2.flow(["C"], logo, turtleIndex, "blkKey2");
        expect(Singer.IntervalsActions.setKey).not.toHaveBeenCalled();
    });

    it("DefineModeBlock sets mode and returns child block", () => {
        const result = createdBlocks.definemode.flow(
            ["custom", "childBlk"],
            logo,
            turtleIndex,
            "blk"
        );
        expect(Singer.IntervalsActions.defineMode).toHaveBeenCalledWith(
            "custom",
            turtleIndex,
            "blk"
        );
        expect(result).toEqual(["childBlk", 1]);
    });

    it("DefineModeBlock returns early when args[1] undefined", () => {
        const result = createdBlocks.definemode.flow(
            ["custom", undefined],
            logo,
            turtleIndex,
            "blk"
        );
        expect(result).toBeUndefined();
    });

    it("MeasureIntervalSemitonesBlock errors when no input block", () => {
        activity.blocks.blockList.blkMeasure = { connections: [null, null] };
        const result = createdBlocks.measureintervalsemitones.arg(logo, turtleIndex, "blkMeasure");
        expect(result).toBe(0);
        expect(activity.errorMsg).toHaveBeenCalledWith("No input", "blkMeasure");
    });

    it("MeasureIntervalSemitonesBlock returns measured semitone distance", () => {
        activity.blocks.blockList.blkMeasure = { connections: [null, "child"] };
        logo.runFromBlockNow = jest.fn(() => {
            turtleState.singer.firstPitch.push(60);
            turtleState.singer.lastPitch.push(67);
        });

        const result = createdBlocks.measureintervalsemitones.arg(logo, turtleIndex, "blkMeasure");

        expect(result).toBe(7);
        expect(turtleState.painter.doPenUp).toHaveBeenCalled();
        expect(turtleState.painter.doSetXY).toHaveBeenCalledWith(10, 20);
        expect(turtleState.painter.doSetHeading).toHaveBeenCalledWith(90);
        expect(logo.runFromBlockNow).toHaveBeenCalledWith(logo, turtleIndex, "child", true, [], 0);
    });

    it("MeasureIntervalSemitonesBlock shows error when two pitches are missing", () => {
        activity.blocks.blockList.blkMeasure = { connections: [null, "child"] };
        logo.runFromBlockNow = jest.fn();

        const result = createdBlocks.measureintervalsemitones.arg(logo, turtleIndex, "blkMeasure");

        expect(result).toBe(0);
        expect(activity.errorMsg).toHaveBeenCalledWith(
            "You must use two pitch blocks when measuring an interval."
        );
    });

    it("MeasureIntervalScalarBlock errors when no input block", () => {
        activity.blocks.blockList.blkMeasureScalar = { connections: [null, null] };
        const result = createdBlocks.measureintervalscalar.arg(
            logo,
            turtleIndex,
            "blkMeasureScalar"
        );
        expect(result).toBe(0);
        expect(activity.errorMsg).toHaveBeenCalledWith("No input", "blkMeasureScalar");
    });

    it("MeasureIntervalScalarBlock returns measured scalar distance", () => {
        activity.blocks.blockList.blkMeasureScalar = { connections: [null, "child"] };
        logo.runFromBlockNow = jest.fn(() => {
            turtleState.singer.firstPitch.push(60);
            turtleState.singer.lastPitch.push(67);
        });

        const result = createdBlocks.measureintervalscalar.arg(
            logo,
            turtleIndex,
            "blkMeasureScalar"
        );

        expect(result).toBe(3);
        expect(Singer.scalarDistance).toHaveBeenCalledWith(logo, turtleIndex, 60, 67);
    });

    it("MeasureIntervalScalarBlock shows error when two pitches are missing", () => {
        activity.blocks.blockList.blkMeasureScalar = { connections: [null, "child"] };
        logo.runFromBlockNow = jest.fn();

        const result = createdBlocks.measureintervalscalar.arg(
            logo,
            turtleIndex,
            "blkMeasureScalar"
        );

        expect(result).toBe(0);
        expect(activity.errorMsg).toHaveBeenCalledWith(
            "You must use two pitch blocks when measuring an interval."
        );
    });

    it("ArpeggioBlock returns early when args[1] undefined", () => {
        const result = createdBlocks.arpeggio.flow(
            ["major", undefined],
            logo,
            turtleIndex,
            "blkArp",
            null
        );
        expect(result).toBeUndefined();
    });

    it("ArpeggioBlock queues blocks and stores disconnected connections", () => {
        activity.blocks.blockList.blkArp = { name: "arpeggio", connections: [null] };
        activity.blocks.blockList.child1 = {
            name: "note",
            connections: ["blkArp", null, "child2"]
        };
        activity.blocks.blockList.child2 = { name: "note", connections: ["child1", null, null] };
        activity.blocks.findBottomBlock = jest.fn(() => "child2");

        createdBlocks.arpeggio.flow(["major", "child1"], logo, turtleIndex, "blkArp", "arg");

        expect(turtleState.singer.duplicateFactor).toBe(2);
        expect(logo.setDispatchBlock).toHaveBeenCalledWith("blkArp", turtleIndex, "_duplicate_0");
        expect(logo.setTurtleListener).toHaveBeenCalled();
        expect(global.Queue).toHaveBeenCalled();
        expect(logo.connectionStore[0].blkArp.length).toBeGreaterThan(0);
    });

    it("ArpeggioBlock reuses another turtle connectionStore", () => {
        logo.connectionStore = {
            0: {},
            1: {
                blkArp: [["hidden1", 1, "real1"]]
            }
        };
        activity.blocks.blockList.blkArp = { name: "arpeggio", connections: [null] };
        activity.blocks.blockList.hidden1 = { name: "hidden", connections: ["real1", null, null] };
        activity.blocks.blockList.real1 = { name: "note", connections: [null, null, null] };

        createdBlocks.arpeggio.flow(["major", "childIgnored"], logo, turtleIndex, "blkArp", "arg");

        expect(global.Queue).toHaveBeenCalledWith("real1", 2, "blkArp", "arg");
        expect(logo.connectionStore[0].blkArp.length).toBe(1);
    });

    it("ArpeggioBlock handles hidden block disconnection path", () => {
        activity.blocks.blockList.blkArp = { name: "arpeggio", connections: [null] };
        activity.blocks.blockList.child1 = {
            name: "note",
            connections: ["blkArp", null, "hidden1"]
        };
        activity.blocks.blockList.hidden1 = {
            name: "hidden",
            connections: ["child1", "child2", null]
        };
        activity.blocks.blockList.child2 = { name: "note", connections: ["hidden1", null, null] };
        activity.blocks.findBottomBlock = jest.fn(() => "child2");

        createdBlocks.arpeggio.flow(["major", "child1"], logo, turtleIndex, "blkArp", "arg");

        expect(logo.connectionStore[0].blkArp.length).toBeGreaterThan(0);
        expect(activity.blocks.blockList.hidden1.connections[1]).toBeNull();
    });

    it("ArpeggioBlock listener restores disconnected links", async () => {
        activity.blocks.blockList.blkArp = { name: "arpeggio", connections: [null] };
        activity.blocks.blockList.child1 = {
            name: "note",
            connections: ["blkArp", null, "child2"]
        };
        activity.blocks.blockList.child2 = { name: "note", connections: ["child1", null, null] };
        activity.blocks.findBottomBlock = jest.fn(() => "child2");

        createdBlocks.arpeggio.flow(["major", "child1"], logo, turtleIndex, "blkArp", "arg");

        activity.blocks.blockList.child1.connections[2] = null;
        activity.blocks.blockList.child2.connections[0] = null;
        const listener =
            logo.setTurtleListener.mock.calls[logo.setTurtleListener.mock.calls.length - 1][2];

        await listener();

        expect(activity.blocks.blockList.child1.connections[2]).toBe("child2");
        expect(activity.blocks.blockList.child2.connections[0]).toBe("child1");
        expect(logo.connectionStoreLock).toBe(false);
    });
});
