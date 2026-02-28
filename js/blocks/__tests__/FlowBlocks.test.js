/**
 * MusicBlocks v3.6.2
 *
 * @author Jetshree
 *
 * @copyright 2025 Jetshree
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

const { setupFlowBlocks } = jest.requireActual("../FlowBlocks");

global._ = s => s;
global.last = arr => (arr && arr.length ? arr[arr.length - 1] : null);
global.ZERODIVIDEERRORMSG = "ZERO_DIVIDE";
global.NOINPUTERRORMSG = "NO_INPUT";
global.POSNUMBER = "POS_NUMBER";

class BaseBlock {
    constructor(name) {
        this.name = name;
        this.dockTypes = [null];
        this.size = 1;
        this.lang = "en";
        this.hidden = false;
    }

    setPalette(palette) {
        this.palette = palette;
    }

    setHelpString(help) {
        this.help = help;
    }

    formBlock(defn) {
        this.formDefn = defn;
    }

    setup(activity) {
        activity.registeredBlocks = activity.registeredBlocks || {};
        activity.registeredBlocks[this.name] = this;
        return this;
    }
}

class FlowBlock extends BaseBlock {
    constructor(name) {
        super(name);
    }

    setArgLabels() {}
    flow() {}
}

class FlowClampBlock extends FlowBlock {
    constructor(name) {
        super(name);
        this.dockTypes = [null, null, null];
    }

    beginnerBlock(flag) {
        this.isBeginner = flag;
    }

    makeMacro(macro) {
        this.macro = macro;
    }

    updateDockValue(idx, val) {
        this.dockTypes[idx] = val;
    }
}

class ValueBlock extends BaseBlock {
    constructor(name, label) {
        super(name);
        this.label = label;
    }

    arg() {}
}

global.BaseBlock = BaseBlock;
global.FlowBlock = FlowBlock;
global.FlowClampBlock = FlowClampBlock;
global.ValueBlock = ValueBlock;
global.Queue = class Queue {
    constructor(child, factor, parentBlk, receivedArg) {
        this.child = child;
        this.factor = factor;
        this.parentBlk = parentBlk;
        this.receivedArg = receivedArg;
    }
};

describe("FlowBlocks integration", () => {
    let activity;
    let logo;
    let turtles;

    const makeTurtle = () => ({
        singer: {
            backward: [],
            duplicateFactor: 1,
            inDuplicate: false,
            justCounting: [],
            suppressOutput: false,
            runningFromEvent: false,
            turtleTime: 0,
            previousTurtleTime: 0
        },
        parentFlowQueue: [],
        queue: [],
        endOfClampSignals: {},
        unhighlightQueue: [],
        doWait: jest.fn(),
        running: true
    });

    beforeEach(() => {
        turtles = {};
        activity = {
            beginnerMode: false,
            blocks: {
                blockList: {},
                findBottomBlock: jest.fn(blk => blk)
            },
            turtles: {
                ithTurtle: jest.fn(id => {
                    if (!turtles[id]) turtles[id] = makeTurtle();
                    return turtles[id];
                })
            },
            errorMsg: jest.fn()
        };

        logo = {
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            doBreak: jest.fn(),
            eventList: {},
            connectionStore: { 0: {} },
            connectionStoreLock: false,
            switchBlocks: { 0: [] },
            switchCases: { 0: {} },
            parseArg: jest.fn((_, __, ___, ____, received) => received ?? "match"),
            runFromBlockNow: jest.fn(),
            stopTurtle: false,
            firstNoteTime: null,
            receivedArg: null
        };

        setupFlowBlocks(activity);
    });

    const getBlock = name => activity.registeredBlocks[name];

    test("macros generate expected starter stacks", () => {
        const backwardMacro = getBlock("backward").macro(10, 20);
        expect(backwardMacro[0][1]).toBe("backward");

        const duplicateMacro = getBlock("duplicatenotes").macro(5, 6);
        expect(duplicateMacro[0][1]).toBe("duplicatenotes");

        const switchMacro = getBlock("switch").macro(1, 2);
        expect(switchMacro[0][1]).toBe("switch");
    });

    test("registers all flow-related blocks on setup", () => {
        const expected = [
            "backward",
            "duplicatenotes",
            "defaultcase",
            "case",
            "switch",
            "clamp",
            "break",
            "waitFor",
            "until",
            "while",
            "ifthenelse",
            "if",
            "forever",
            "repeat",
            "duplicatefactor",
            "hiddennoflow",
            "hidden"
        ];

        expect(Object.keys(activity.registeredBlocks).sort()).toEqual(expected.sort());
    });

    test("BackwardBlock flow handles next block present and absent", () => {
        const blk = 10;
        activity.blocks.blockList[blk] = { connections: [null, 5, null, null] };
        const block = getBlock("backward");

        activity.blocks.blockList[blk].connections[2] = null;
        block.flow([3], logo, 0, blk);
        expect(activity.turtles.ithTurtle(0).singer.backward).toHaveLength(0);

        // Next block exists, listener is registered and stack remains until listener runs
        activity.blocks.blockList[blk].connections[2] = 11;
        activity.turtles.ithTurtle(0).endOfClampSignals[11] = ["prior"];
        block.flow([4], logo, 0, blk);
        const listener = logo.setTurtleListener.mock.calls.pop()[2];
        expect(activity.turtles.ithTurtle(0).endOfClampSignals[11]).toHaveLength(2);
        listener();
        expect(activity.turtles.ithTurtle(0).singer.backward).toHaveLength(0);
    });

    test("DuplicateBlock handles invalid, stopping, and normal flow paths", () => {
        const block = getBlock("duplicatenotes");
        const blk = 0;

        // Early return when clamp missing
        expect(block.flow([1], logo, 0, blk)).toBeUndefined();

        // Invalid input triggers error and default factor
        activity.blocks.blockList[blk] = { connections: [null, 1, null, 2] };
        const restoreFloor = Math.floor;
        Math.floor = jest.fn(() => 0);
        block.flow([0, 1], logo, 0, blk);
        expect(activity.errorMsg).toHaveBeenCalledWith(ZERODIVIDEERRORMSG, blk);
        expect(logo.stopTurtle).toBe(true);
        Math.floor = restoreFloor;

        // Happy path with connection breaking and queuing
        activity.blocks.blockList = {
            0: { name: "duplicatenotes", connections: [null, 1, null, 2] },
            1: { name: "visibleA", connections: [0, 2] },
            2: { name: "hidden", connections: [1, 3] },
            3: { name: "visibleB", connections: [2, 0] }
        };
        logo.connectionStore[0][blk] = [];
        logo.connectionStoreLock = false;
        const result = block.flow([2, 1], logo, 0, blk, ["arg"]);
        expect(result).toBeUndefined();
        const turtle = activity.turtles.ithTurtle(0);
        // Factor is multiplied before listener runs
        expect(turtle.singer.duplicateFactor).toBe(2);
        const listener = logo.setTurtleListener.mock.calls.pop()[2];
        listener();
        expect(turtle.singer.duplicateFactor).toBe(1);

        // Path where another turtle already stored connections
        logo.connectionStore = {
            0: { [blk]: [] },
            1: {
                [blk]: [
                    [4, 1, 5],
                    [5, 0, null]
                ]
            }
        };
        activity.blocks.blockList[4] = { name: "hidden", connections: [6, null] };
        activity.blocks.blockList[5] = { name: "visibleC", connections: [null] };
        activity.blocks.blockList[6] = { name: "visibleD", connections: [null] };
        logo.connectionStoreLock = true;
        block.flow([3, 4], logo, 0, blk, ["arg"]);
        expect(logo.connectionStoreLock).toBe(false);

        // Non-number input triggers NOINPUT branch
        logo.connectionStore = { 0: { [blk]: [] } };
        block.flow([null, 1], logo, 0, blk);
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
    });

    test("DefaultCaseBlock validates switch context", () => {
        const block = getBlock("defaultcase");
        const blk = 2;
        logo.switchBlocks[0] = [];
        block.flow([99], logo, 0, blk);
        expect(logo.stopTurtle).toBe(true);

        logo.stopTurtle = false;
        logo.switchBlocks[0] = [7];
        logo.switchCases[0] = { 7: [[["existing", 3]]] };
        block.flow([42], logo, 0, blk);
        expect(logo.switchCases[0][7][0]).toContainEqual(["__default__", 42]);
    });

    test("CaseBlock validates switch context", () => {
        const block = getBlock("case");
        const blk = 3;
        logo.switchBlocks[0] = [];
        block.flow([1, 2], logo, 0, blk);
        expect(logo.stopTurtle).toBe(true);

        logo.stopTurtle = false;
        logo.switchBlocks[0] = [8];
        logo.switchCases[0] = { 8: [[["existing", 5]]] };
        block.flow(["x", 123], logo, 0, blk);
        expect(logo.switchCases[0][8][0]).toContainEqual(["x", 123]);
    });

    test("SwitchBlock queues matching and default cases", () => {
        const block = getBlock("switch");
        const blk = 4;
        activity.blocks.blockList[blk] = { connections: [null, 20] };
        logo.switchBlocks[0] = [];
        logo.switchCases[0] = {};

        // Setup call registers listener
        block.flow([null, 9], logo, 0, blk);
        const listener = logo.setTurtleListener.mock.calls.pop()[2];

        // Provide cases and run listener with matching case
        logo.switchBlocks[0] = [blk];
        logo.switchCases[0][blk] = [
            [
                ["match", 12],
                ["__default__", 14]
            ]
        ];
        logo.parseArg.mockReturnValue("match");
        listener();
        expect(activity.turtles.ithTurtle(0).queue[0].child).toBe(12);

        // Default path when no case matches
        logo.switchBlocks[0] = [blk];
        logo.switchCases[0][blk] = [
            [
                ["other", 99],
                ["__default__", 77]
            ]
        ];
        logo.parseArg.mockReturnValue("unknown");
        listener();
        expect(activity.turtles.ithTurtle(0).queue.pop().child).toBe(77);
    });

    test("ClampBlock simply forwards flow", () => {
        const block = getBlock("clamp");
        expect(block.flow([15])).toEqual([15, 1]);
        expect(block.flow([15, 16])).toBeUndefined();
    });

    test("BreakBlock calls logo.doBreak and unhighlights parent", () => {
        const block = getBlock("break");
        const blk = 5;
        activity.blocks.blockList[blk] = { connections: [50] };
        activity.blocks.blockList[50] = { name: "parent" };
        block.flow([], logo, 0, blk);
        expect(logo.doBreak).toHaveBeenCalled();
        expect(activity.turtles.ithTurtle(0).unhighlightQueue).toContain(50);
    });

    test("WaitForBlock requeues until condition then updates time", () => {
        const block = getBlock("waitFor");
        const blk = 6;
        activity.blocks.blockList[blk] = { connections: [60] };

        block.flow([false], logo, 0, blk);
        const turtle = activity.turtles.ithTurtle(0);
        expect(turtle.queue[0].parentBlk).toBe(60);
        expect(turtle.doWait).toHaveBeenCalled();

        turtle.queue.push(new Queue(blk, 1, blk));
        turtle.queue.push(new Queue(blk, 1, blk));
        logo.firstNoteTime = null;
        block.flow([true], logo, 0, blk);
        expect(logo.firstNoteTime).not.toBeNull();
        // One requeued entry should remain for this block
        const remaining = turtle.queue.filter(q => q.parentBlk === blk);
        expect(remaining).toHaveLength(1);
    });

    test("UntilBlock requeues when false and cleans when true", () => {
        const block = getBlock("until");
        const blk = 7;
        activity.blocks.blockList[blk] = { connections: [70] };
        block.flow([false, 71], logo, 0, blk);
        expect(activity.turtles.ithTurtle(0).queue.pop().parentBlk).toBe(70);

        const turtle = activity.turtles.ithTurtle(0);
        turtle.queue.push(new Queue(99, 1, blk));
        turtle.queue.push(new Queue(98, 1, blk));
        block.flow([true, 72], logo, 0, blk);
        expect(turtle.queue).toHaveLength(1);
    });

    test("WhileBlock requeues when true and flushes when false", () => {
        const block = getBlock("while");
        const blk = 8;
        activity.blocks.blockList[blk] = { connections: [80] };

        const res = block.flow([true, 81], logo, 0, blk);
        expect(res).toEqual([81, 1]);
        const turtle = activity.turtles.ithTurtle(0);
        expect(turtle.queue.pop().parentBlk).toBe(80);

        turtle.queue.push(new Queue(99, 1, blk));
        turtle.queue.push(new Queue(98, 1, blk));
        block.flow([false, 82], logo, 0, blk);
        expect(turtle.queue).toHaveLength(1);
    });

    test("IfThenElseBlock chooses correct branch", () => {
        const block = getBlock("ifthenelse");
        expect(block.flow([true, 1, 2])).toEqual([1, 1]);
        expect(block.flow([false, 1, 2])).toEqual([2, 1]);
    });

    test("IfBlock only flows when condition true", () => {
        const block = getBlock("if");
        expect(block.flow([true, 10])).toEqual([10, 1]);
        expect(block.flow([false, 10])).toBeUndefined();
    });

    test("ForeverBlock returns continuous or limited flow", () => {
        const block = getBlock("forever");
        const turtle = activity.turtles.ithTurtle(0);
        turtle.singer.suppressOutput = false;
        expect(block.flow([33], logo, 0)).toEqual([33, -1]);
        turtle.singer.suppressOutput = true;
        expect(block.flow([34], logo, 0)).toEqual([34, 20]);
    });

    test("RepeatBlock validates number and repeats child", () => {
        const block = getBlock("repeat");
        expect(block.flow([0, 90], logo, 0, 9)).toEqual([null, 0]);
        expect(block.flow([3, 91], logo, 0, 9)).toEqual([91, 3]);
        block.flow([-1, 92], logo, 0, 9);
        expect(activity.errorMsg).toHaveBeenCalledWith(POSNUMBER, 9);
    });

    test("DuplicateFactorBlock exposes singer value or status field", () => {
        const block = getBlock("duplicatefactor");
        const blk = 11;
        activity.blocks.blockList[blk] = { connections: [12] };
        activity.blocks.blockList[12] = { name: "print" };

        logo.inStatusMatrix = true;
        logo.statusFields = [];
        block.arg(logo, 0, blk);
        expect(logo.statusFields).toContainEqual([blk, "duplicate"]);

        logo.inStatusMatrix = false;
        block.arg(logo, 0, blk);
        expect(activity.blocks.blockList[blk].value).toBe(
            activity.turtles.ithTurtle(0).singer.duplicateFactor
        );
    });

    test("Hidden block variants simply no-op", () => {
        expect(() => getBlock("hiddennoflow").flow()).not.toThrow();
        expect(() => getBlock("hidden").flow()).not.toThrow();
    });

    test("WaitForBlock ignores malformed args and While/Until guard arg length", () => {
        const wait = getBlock("waitFor");
        expect(wait.flow([], logo, 0, 6)).toBeUndefined();

        const until = getBlock("until");
        expect(until.flow([true], logo, 0, 7)).toBeUndefined();

        const whileBlk = getBlock("while");
        expect(whileBlk.flow([true], logo, 0, 8)).toBeUndefined();
    });
});
