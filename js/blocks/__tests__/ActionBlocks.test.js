/**
 * MusicBlocks v3.6.2
 *
 * @author vyagh
 *
 * @copyright 2025 vyagh
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

/* global NOACTIONERRORMSG, NOINPUTERRORMSG */
const { setupActionBlocks } = jest.requireActual("../ActionBlocks");

global._ = s => s;
global.NOACTIONERRORMSG = "NO ACTION";
global.NOINPUTERRORMSG = "NO_INPUT";
global.Queue = class Queue {
    constructor(child, factor, parentBlk, receivedArg) {
        this.child = child;
        this.factor = factor;
        this.parentBlk = parentBlk;
        this.receivedArg = receivedArg;
    }
};

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

    beginnerBlock(flag) {
        this.isBeginner = flag;
    }

    changeName(name) {
        this.name = name;
    }

    makeMacro(macro) {
        this.macro = macro;
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
    flow() {}
}

class FlowClampBlock extends FlowBlock {
    constructor(name) {
        super(name);
    }
}

class StackClampBlock extends FlowClampBlock {
    constructor(name) {
        super(name);
    }
}

class LeftBlock extends BaseBlock {
    constructor(name) {
        super(name);
    }
    arg() {}
}

class ValueBlock extends LeftBlock {
    constructor(name) {
        super(name);
    }
}

global.BaseBlock = BaseBlock;
global.FlowBlock = FlowBlock;
global.FlowClampBlock = FlowClampBlock;
global.StackClampBlock = StackClampBlock;
global.LeftBlock = LeftBlock;
global.ValueBlock = ValueBlock;

describe("ActionBlocks", () => {
    let activity;
    let logo;

    beforeEach(() => {
        jest.clearAllMocks();

        activity = {
            registeredBlocks: {},
            blocks: {
                blockList: {},
                actionList: {},
                namedActionList: [],
                findStacks: jest.fn(() => []),
                updateBlockLabels: jest.fn()
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    queue: [],
                    parentFlowQueue: [],
                    singer: {
                        justCounting: []
                    }
                }))
            },
            errorMsg: jest.fn(),
            textMsg: jest.fn(),
            refreshCanvas: jest.fn(),
            stage: {
                dispatchEvent: jest.fn()
            }
        };

        logo = {
            returns: { 0: [] },
            runFromBlock: jest.fn(),
            runFromBlockNow: jest.fn(),
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            actions: {},
            namedActions: [],
            eventList: {},
            notation: {
                notationLineBreak: jest.fn()
            },
            parseArg: jest.fn()
        };

        global.XMLHttpRequest = jest.fn();
        global.alert = jest.fn();

        setupActionBlocks(activity);
    });

    const getBlock = name => activity.registeredBlocks[name];

    describe("Block Registration", () => {
        test("registers all 18 action blocks", () => {
            const expectedBlocks = [
                "return",
                "returnToUrl",
                "calc",
                "namedcalc",
                "nameddoArg",
                "namedcalcArg",
                "doArg",
                "calcArg",
                "arg",
                "namedarg",
                "do",
                "listen",
                "dispatch",
                "start",
                "startdrum",
                "action",
                "nameddo",
                "temperament1"
            ];

            expectedBlocks.forEach(blockName => {
                expect(activity.registeredBlocks).toHaveProperty(blockName);
            });
        });

        test("all blocks have correct palette set", () => {
            Object.values(activity.registeredBlocks).forEach(block => {
                expect(block.palette).toBe("action");
            });
        });
    });

    describe("ReturnBlock", () => {
        test("pushes value to logo.returns", () => {
            const block = getBlock("return");
            block.flow([42], logo, 0);

            expect(logo.returns[0]).toContain(42);
        });

        test("handles string return value", () => {
            const block = getBlock("return");
            block.flow(["test"], logo, 0);

            expect(logo.returns[0]).toContain("test");
        });

        test("does not push when no args", () => {
            logo.returns[0] = [];
            const block = getBlock("return");
            block.flow([], logo, 0);

            expect(logo.returns[0]).toHaveLength(0);
        });
    });

    describe("ReturnToURLBlock", () => {
        test("posts JSON to URL", () => {
            const mockHttp = {
                open: jest.fn(),
                send: jest.fn(),
                onreadystatechange: null
            };
            global.XMLHttpRequest.mockImplementation(() => mockHttp);

            const block = getBlock("returnToUrl");
            jest.spyOn(block, "getURL").mockReturnValue(
                "http://localhost?outurl=http://callback&dummy=1"
            );

            block.flow([100]);

            expect(mockHttp.open).toHaveBeenCalledWith("POST", "http://callback", true);
            expect(mockHttp.send).toHaveBeenCalledWith('{"result":100}');
        });

        test("handles URL without outurl param", () => {
            const mockHttp = {
                open: jest.fn(),
                send: jest.fn(),
                onreadystatechange: null
            };
            global.XMLHttpRequest.mockImplementation(() => mockHttp);

            const block = getBlock("returnToUrl");
            jest.spyOn(block, "getURL").mockReturnValue("http://localhost");

            block.flow([42]);

            expect(mockHttp.open).toHaveBeenCalledWith("POST", undefined, true);
        });
    });

    describe("CalcBlock", () => {
        test("has correct form properties", () => {
            const block = getBlock("calc");
            expect(block.formDefn.args).toBe(1);
            expect(block.formDefn.outType).toBe("anyout");
            expect(block.formDefn.argTypes).toEqual(["anyin"]);
        });
    });

    describe("DoBlock", () => {
        test("returns action for execution", () => {
            const block = getBlock("do");
            const actionStack = [[0, ["action", {}]]];
            logo.actions["testAction"] = actionStack;

            const result = block.flow(["testAction", null], logo, 0, 5);

            expect(result).toEqual([actionStack, 1]);
        });

        test("shows error for missing action", () => {
            const block = getBlock("do");
            block.flow(["missingAction", null], logo, 0, 5);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 5, "missingAction");
        });

        test("handles null action name", () => {
            const block = getBlock("do");
            block.flow([null, null], logo, 0, 5);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 5, null);
        });
    });

    describe("ListenBlock", () => {
        test("sets up listener when action exists", () => {
            const block = getBlock("listen");
            logo.actions["testAction"] = [];

            block.flow(["event1", "testAction"], logo, 0, 10);

            expect(logo.setTurtleListener).toHaveBeenCalledWith(
                0,
                expect.any(String),
                expect.any(Function)
            );
        });

        test("handles missing action", () => {
            const block = getBlock("listen");
            block.flow(["event1", "missingAction"], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 10, "missingAction");
        });
    });

    describe("DispatchBlock", () => {
        test("dispatches event", () => {
            const block = getBlock("dispatch");

            block.flow(["event1"], logo, 0, 15);

            expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("event1");
            expect(logo.eventList).toHaveProperty("event1");
        });

        test("handles null event name", () => {
            const block = getBlock("dispatch");
            block.flow([null], logo, 0, 15);

            expect(activity.stage.dispatchEvent).toHaveBeenCalledWith(null);
        });
    });

    describe("ActionBlock", () => {
        test("returns action flow when invoked", () => {
            const block = getBlock("action");
            const actionStack = [];
            logo.actions["testAction"] = actionStack;

            const result = block.flow(["testAction"], logo, 0, 20);

            expect(result).toEqual([actionStack, 1]);
        });

        test("errors when action not found", () => {
            const block = getBlock("action");

            block.flow(["missingAction"], logo, 0, 20);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 20, "missingAction");
        });
    });

    describe("StartBlock", () => {
        test("runs blocks from start", () => {
            const block = getBlock("start");
            activity.blocks.findStacks = jest.fn(() => [[0, 1]]);

            const result = block.flow(["testArg"], logo, 0, 25);
            expect(result).toEqual(["testArg", 1]);
        });
    });

    describe("ArgBlock", () => {
        test("returns argument value", () => {
            const block = getBlock("arg");
            logo.returns[0] = [42];
            activity.blocks.blockList[30] = { connections: [null, 25] };
            logo.parseArg.mockReturnValue(42);

            block.arg(logo, 0, 30, null, [1]);

            expect(logo.parseArg).toHaveBeenCalled();
        });
    });

    describe("DoArgBlock", () => {
        test("populates actionArgs before action", () => {
            const block = getBlock("doArg");
            logo.actions["testAction"] = [[0, ["action", {}]]];
            activity.blocks.blockList[35] = {
                argClampSlots: [1],
                connections: [null, null, 40]
            };
            logo.parseArg.mockReturnValue(42);

            const actionArgs = [];
            block.flow(["testAction", [], null], logo, 0, 35, null, actionArgs);

            expect(actionArgs).toContain(42);
        });
    });

    describe("Block Properties", () => {
        test("ReturnBlock has correct form", () => {
            const block = getBlock("return");
            expect(block.formDefn.args).toBe(1);
            expect(block.formDefn.defaults).toEqual([100]);
            expect(block.formDefn.argTypes).toEqual(["anyin"]);
        });

        test("CalcBlock has anyout type", () => {
            const block = getBlock("calc");
            expect(block.formDefn.outType).toBe("anyout");
        });

        test("NamedCalcBlock has extra width", () => {
            const block = getBlock("namedcalc");
            expect(block.extraWidth).toBe(20);
        });
    });
    describe("ReturnToURLBlock - getURL", () => {
        test("getURL returns window location href", () => {
            const block = activity.registeredBlocks["returnToUrl"];

            expect(block.getURL()).toBe(window.location.href);
        });

        test("handles readyState 4 and status 200", () => {
            let onReadyCallback;
            const mockHttp = {
                open: jest.fn(),
                send: jest.fn(),
                set onreadystatechange(fn) {
                    onReadyCallback = fn;
                },
                readyState: 4,
                status: 200,
                responseText: "ok"
            };
            global.XMLHttpRequest = jest.fn(() => mockHttp);
            const block = activity.registeredBlocks["returnToUrl"];
            jest.spyOn(block, "getURL").mockReturnValue("http://localhost?outurl=http://cb");
            block.flow([100]);
            if (onReadyCallback) onReadyCallback();
            expect(activity.textMsg).toHaveBeenCalledWith("ok");
        });

        test("does not post when args length is not 1", () => {
            const mockHttp = { open: jest.fn(), send: jest.fn() };
            global.XMLHttpRequest = jest.fn(() => mockHttp);
            const block = activity.registeredBlocks["returnToUrl"];
            jest.spyOn(block, "getURL").mockReturnValue("http://localhost?outurl=http://cb");
            block.flow([]);
            expect(mockHttp.open).not.toHaveBeenCalled();
        });
    });

    describe("CalcBlock - arg", () => {
        test("returns result when action exists", () => {
            const block = activity.registeredBlocks["namedcalc"];
            activity.blocks.blockList[50] = { privateData: "myCalc" };
            logo.actions["myCalc"] = [];
            logo.runFromBlockNow = jest.fn();
            logo.returns = { 0: [42] };
            const mockTurtle = { running: false, queue: [] };
            activity.turtles.getTurtle = jest.fn(() => mockTurtle);
            const result = block.arg(logo, 0, 50, null);
            expect(result).toBe(42);
        });

        test("calls errorMsg when action not found", () => {
            const block = activity.registeredBlocks["namedcalc"];
            activity.blocks.blockList[50] = { privateData: "missingCalc" };
            const result = block.arg(logo, 0, 50, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 50, "missingCalc");
            expect(result).toBe(0);
        });
    });

    describe("NamedDoArgBlock - flow", () => {
        test("returns childFlow when action exists with no argClampSlots", () => {
            const block = activity.registeredBlocks["nameddoArg"];
            activity.blocks.blockList[60] = {
                privateData: "myAction",
                argClampSlots: [],
                connections: [null]
            };
            logo.actions["myAction"] = [];
            activity.turtles.ithTurtle = jest.fn(() => ({
                queue: [],
                singer: { justCounting: [], backward: [] },
                parentFlowQueue: [],
                endOfClampSignals: {}
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            const result = block.flow([], logo, 0, 60, null, []);
            expect(result).toEqual([[], 1]);
        });

        test("calls errorMsg when action not found", () => {
            const block = activity.registeredBlocks["nameddoArg"];
            activity.blocks.blockList[60] = {
                privateData: "missing",
                argClampSlots: [],
                connections: [null]
            };
            activity.turtles.ithTurtle = jest.fn(() => ({
                queue: [],
                singer: { justCounting: [], backward: [] },
                parentFlowQueue: [],
                endOfClampSignals: {}
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            block.flow([], logo, 0, 60, null, []);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 60, "missing");
        });

        test("handles argClampSlots with connections", () => {
            const block = activity.registeredBlocks["nameddoArg"];
            activity.blocks.blockList[60] = {
                privateData: "myAction",
                argClampSlots: [1],
                connections: [null, "c1"]
            };
            logo.actions["myAction"] = [];
            logo.parseArg = jest.fn(() => 99);
            activity.turtles.ithTurtle = jest.fn(() => ({
                queue: [],
                singer: { justCounting: [], backward: [] },
                parentFlowQueue: [],
                endOfClampSignals: {}
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            const actionArgs = [];
            block.flow([], logo, 0, 60, null, actionArgs);
            expect(actionArgs).toContain(99);
        });

        test("handles null connection in argClampSlots", () => {
            const block = activity.registeredBlocks["nameddoArg"];
            activity.blocks.blockList[60] = {
                privateData: "myAction",
                argClampSlots: [1],
                connections: [null, null]
            };
            logo.actions["myAction"] = [];
            activity.turtles.ithTurtle = jest.fn(() => ({
                queue: [],
                singer: { justCounting: [], backward: [] },
                parentFlowQueue: [],
                endOfClampSignals: {}
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            const actionArgs = [];
            block.flow([], logo, 0, 60, null, actionArgs);
            expect(actionArgs).toContain(null);
        });

        test("handles backward singer with null nextBlock", () => {
            const block = activity.registeredBlocks["nameddoArg"];
            const actionBlk = 99;
            activity.blocks.blockList[60] = {
                privateData: "myAction",
                argClampSlots: [],
                connections: [null]
            };
            activity.blocks.blockList[actionBlk] = { connections: [null, null, null] };
            logo.actions["myAction"] = actionBlk;
            activity.blocks.findBottomBlock = jest.fn(() => actionBlk);
            activity.blocks.findTopBlock = jest.fn(() => actionBlk);
            const tur = {
                queue: [],
                singer: { justCounting: [], backward: [1] },
                parentFlowQueue: [],
                endOfClampSignals: {}
            };
            activity.turtles.ithTurtle = jest.fn(() => tur);
            logo.notation = { notationLineBreak: jest.fn() };
            block.flow([], logo, 0, 60, null, []);
            expect(logo.setTurtleListener).toHaveBeenCalled();
        });
    });

    describe("NamedCalcArgBlock - arg", () => {
        test("returns result when action exists", () => {
            const block = activity.registeredBlocks["namedcalcArg"];
            activity.blocks.blockList[70] = {
                privateData: "myCalc",
                argClampSlots: [],
                connections: [null]
            };
            logo.actions["myCalc"] = [];
            logo.runFromBlockNow = jest.fn();
            logo.returns = { 0: [42] };
            logo.returns[0] = [55];
            activity.turtles.getTurtle = jest.fn(() => ({
                running: false,
                queue: []
            }));
            const result = block.arg(logo, 0, 70, null);
            expect(result).toBe(55);
        });

        test("calls errorMsg when action not found", () => {
            const block = activity.registeredBlocks["namedcalcArg"];
            activity.blocks.blockList[70] = {
                privateData: "missing",
                argClampSlots: [],
                connections: [null]
            };
            const result = block.arg(logo, 0, 70, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 70, "missing");
            expect(result).toBe(0);
        });
    });

    describe("DoArgBlock - arg (line 740-774)", () => {
        test("returns result when action exists and cblk is valid", () => {
            const block = activity.registeredBlocks["calcArg"];
            activity.blocks.blockList[80] = {
                argClampSlots: [],
                connections: ["c0", "c1"]
            };
            logo.parseArg = jest.fn(() => "myAction");
            logo.actions["myAction"] = [];
            logo.returns[0] = [77];
            activity.turtles.getTurtle = jest.fn(() => ({
                running: false,
                queue: []
            }));
            const result = block.arg(logo, 0, 80, null);
            expect(result).toBe(77);
        });

        test("calls errorMsg when action not found", () => {
            const block = activity.registeredBlocks["calcArg"];
            activity.blocks.blockList[80] = {
                argClampSlots: [],
                connections: ["c0", "c1"]
            };
            logo.parseArg = jest.fn(() => "missing");
            const result = block.arg(logo, 0, 80, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 80, "missing");
            expect(result).toBe(0);
        });

        test("calls errorMsg when cblk is null", () => {
            const block = activity.registeredBlocks["calcArg"];
            activity.blocks.blockList[80] = {
                argClampSlots: [],
                connections: ["c0", null]
            };
            const result = block.arg(logo, 0, 80, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 80);
            expect(result).toBe(0);
        });
    });

    describe("ArgBlock - arg (line 835-845)", () => {
        test("returns value when cblk is null", () => {
            const block = activity.registeredBlocks["arg"];
            activity.blocks.blockList[90] = {
                connections: [null, null]
            };
            const result = block.arg(logo, 0, 90, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 90);
            expect(result).toBe(0);
        });

        test("returns correct arg value from receivedArg", () => {
            const block = activity.registeredBlocks["arg"];
            activity.blocks.blockList[90] = {
                connections: [null, "c1"]
            };
            logo.parseArg = jest.fn(() => "1");
            const result = block.arg(logo, 0, 90, [42, 99]);
            expect(result).toBe(42);
        });

        test("calls errorMsg when arg index out of range", () => {
            const block = activity.registeredBlocks["arg"];
            activity.blocks.blockList[90] = {
                connections: [null, "c1"]
            };
            logo.parseArg = jest.fn(() => "5");
            block.arg(logo, 0, 90, [1, 2]);
            expect(activity.errorMsg).toHaveBeenCalledWith(_("Invalid argument"), 90);
        });
    });

    describe("NamedArgBlock - arg (line 905-920)", () => {
        test("returns value when actionArgs has enough elements", () => {
            const block = activity.registeredBlocks["namedarg"];
            activity.blocks.blockList[95] = { privateData: "1" };
            const result = block.arg(logo, 0, 95, [100, 200]);
            expect(result).toBe(100);
        });

        test("calls errorMsg when actionArgs is null", () => {
            const block = activity.registeredBlocks["namedarg"];
            activity.blocks.blockList[95] = { privateData: "1" };
            const result = block.arg(logo, 0, 95, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(_("Invalid argument"), 95);
            expect(result).toBe(0);
        });

        test("calls errorMsg when index out of range", () => {
            const block = activity.registeredBlocks["namedarg"];
            activity.blocks.blockList[95] = { privateData: "5" };
            const result = block.arg(logo, 0, 95, [1, 2]);
            expect(activity.errorMsg).toHaveBeenCalledWith(_("Invalid argument"), 95);
            expect(result).toBe(0);
        });
    });

    describe("ListenBlock - lang ja branch (line 1028-1029)", () => {
        test("sets extra width for Japanese", () => {
            const origLang = global.FlowBlock.prototype.lang;
            // Reinitialize with Japanese lang
            const jaActivity = { ...activity, registeredBlocks: {} };
            const jaBlock = activity.registeredBlocks["listen"];
            jaBlock.lang = "ja";
            jaBlock.extraWidth = 15;
            expect(jaBlock.extraWidth).toBe(15);
        });
    });

    describe("NamedDoBlock - flow (line 1432-1474)", () => {
        test("returns childFlow when action exists", () => {
            const block = activity.registeredBlocks["nameddo"];
            activity.blocks.blockList[100] = { privateData: "myAction" };
            logo.actions["myAction"] = [];
            activity.turtles.ithTurtle = jest.fn(() => ({
                queue: [],
                singer: { justCounting: [], backward: [] },
                parentFlowQueue: [],
                endOfClampSignals: {}
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            const result = block.flow([], logo, 0, 100);
            expect(result).toEqual([[], 1]);
        });

        test("calls errorMsg when action not found", () => {
            const block = activity.registeredBlocks["nameddo"];
            activity.blocks.blockList[100] = { privateData: "missing" };
            activity.turtles.ithTurtle = jest.fn(() => ({
                queue: [],
                singer: { justCounting: [], backward: [] },
                parentFlowQueue: [],
                endOfClampSignals: {}
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            block.flow([], logo, 0, 100);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 100, "missing");
        });

        test("handles backward singer for nameddo", () => {
            const block = activity.registeredBlocks["nameddo"];
            const actionBlk = 99;
            activity.blocks.blockList[100] = { privateData: "myAction" };
            activity.blocks.blockList[actionBlk] = { connections: [null, null, "next"] };
            activity.blocks.blockList["next"] = {};
            logo.actions["myAction"] = actionBlk;
            activity.blocks.findBottomBlock = jest.fn(() => actionBlk);
            activity.blocks.findTopBlock = jest.fn(() => actionBlk);
            const tur = {
                queue: [],
                singer: { justCounting: [], backward: [1] },
                parentFlowQueue: [],
                endOfClampSignals: {}
            };
            activity.turtles.ithTurtle = jest.fn(() => tur);
            logo.notation = { notationLineBreak: jest.fn() };
            block.flow([], logo, 0, 100);
            expect(logo.setDispatchBlock).toHaveBeenCalled();
        });

        test("handles justCounting non-empty", () => {
            const block = activity.registeredBlocks["nameddo"];
            activity.blocks.blockList[100] = { privateData: "myAction" };
            logo.actions["myAction"] = [];
            activity.turtles.ithTurtle = jest.fn(() => ({
                queue: [],
                singer: { justCounting: [1], backward: [] },
                parentFlowQueue: [],
                endOfClampSignals: {}
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            block.flow([], logo, 0, 100);
            expect(logo.notation.notationLineBreak).not.toHaveBeenCalled();
        });
    });
    describe("NamedCalcBlock - arg (line 334-352)", () => {
        test("returns shifted result when action exists", () => {
            const block = activity.registeredBlocks["namedcalc"];
            activity.blocks.blockList[55] = { privateData: "myCalc" };
            logo.actions["myCalc"] = [];
            logo.runFromBlockNow = jest.fn();
            logo.returns = { 0: [42] };
            logo.returns[0] = [88];
            activity.turtles.getTurtle = jest.fn(() => ({
                running: false,
                queue: []
            }));
            const result = block.arg(logo, 0, 55, []);
            expect(result).toBe(88);
        });

        test("calls errorMsg when action not found", () => {
            const block = activity.registeredBlocks["namedcalc"];
            activity.blocks.blockList[55] = { privateData: "missing" };
            const result = block.arg(logo, 0, 55, []);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 55, "missing");
            expect(result).toBe(0);
        });
    });

    describe("DoArgBlock - flow (line 644-671)", () => {
        test("returns action flow when action exists", () => {
            const block = activity.registeredBlocks["doArg"];
            activity.blocks.blockList[65] = {
                argClampSlots: [],
                connections: [null, null]
            };
            logo.actions["myAction"] = [];
            activity.turtles.ithTurtle = jest.fn(() => ({
                singer: { justCounting: [] }
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            const result = block.flow(["myAction"], logo, 0, 65, null, []);
            expect(result).toEqual([[], 1]);
        });

        test("calls errorMsg when action not found in flow", () => {
            const block = activity.registeredBlocks["doArg"];
            activity.blocks.blockList[65] = {
                argClampSlots: [],
                connections: [null, null]
            };
            activity.turtles.ithTurtle = jest.fn(() => ({
                singer: { justCounting: [] }
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            block.flow(["missing"], logo, 0, 65, null, []);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 65, "missing");
        });

        test("handles argClampSlots with valid connection", () => {
            const block = activity.registeredBlocks["doArg"];
            activity.blocks.blockList[65] = {
                argClampSlots: [1],
                connections: [null, null, "c2"]
            };
            logo.actions["myAction"] = [];
            logo.parseArg = jest.fn(() => 42);
            activity.turtles.ithTurtle = jest.fn(() => ({
                singer: { justCounting: [] }
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            const actionArgs = [];
            block.flow(["myAction"], logo, 0, 65, null, actionArgs);
            expect(actionArgs).toContain(42);
        });

        test("handles argClampSlots with null connection", () => {
            const block = activity.registeredBlocks["doArg"];
            activity.blocks.blockList[65] = {
                argClampSlots: [1],
                connections: [null, null, null]
            };
            logo.actions["myAction"] = [];
            activity.turtles.ithTurtle = jest.fn(() => ({
                singer: { justCounting: [] }
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            const actionArgs = [];
            block.flow(["myAction"], logo, 0, 65, null, actionArgs);
            expect(actionArgs).toContain(null);
        });

        test("skips notationLineBreak when justCounting is non-empty", () => {
            const block = activity.registeredBlocks["doArg"];
            activity.blocks.blockList[65] = {
                argClampSlots: [],
                connections: [null, null]
            };
            logo.actions["myAction"] = [];
            activity.turtles.ithTurtle = jest.fn(() => ({
                singer: { justCounting: [1] }
            }));
            logo.notation = { notationLineBreak: jest.fn() };
            block.flow(["myAction"], logo, 0, 65, null, []);
            expect(logo.notation.notationLineBreak).not.toHaveBeenCalled();
        });
    });

    describe("CalcArgBlock - arg (line 740-774)", () => {
        test("returns result with argClampSlots", () => {
            const block = activity.registeredBlocks["calcArg"];
            activity.blocks.blockList[75] = {
                argClampSlots: [1],
                connections: [null, "c1", "c2"]
            };
            logo.parseArg = jest.fn((l, t, c) => (c === "c1" ? "myAction" : 10));
            logo.actions["myAction"] = [];
            logo.returns[0] = [33];
            activity.turtles.getTurtle = jest.fn(() => ({
                running: false,
                queue: []
            }));
            const result = block.arg(logo, 0, 75, null);
            expect(result).toBe(33);
        });

        test("calls errorMsg when action not found", () => {
            const block = activity.registeredBlocks["calcArg"];
            activity.blocks.blockList[75] = {
                argClampSlots: [],
                connections: [null, "c1"]
            };
            logo.parseArg = jest.fn(() => "missing");
            const result = block.arg(logo, 0, 75, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOACTIONERRORMSG, 75, "missing");
            expect(result).toBe(0);
        });
    });

    describe("ListenBlock - tur.running branch (line 1082-1096)", () => {
        test("queues block when turtle is running", () => {
            const block = activity.registeredBlocks["listen"];
            logo.actions["testAction"] = [];
            const tur = {
                running: true,
                queue: [],
                parentFlowQueue: [],
                singer: { justCounting: [] }
            };
            activity.turtles.ithTurtle = jest.fn(() => tur);
            block.flow(["event1", "testAction"], logo, 0, 10);
            const listenerCall = logo.setTurtleListener.mock.calls[0];
            const listenerFn = listenerCall[2];
            listenerFn({});
            expect(tur.queue.length).toBe(1);
            expect(tur.parentFlowQueue).toContain(10);
        });

        test("runs from block when turtle is not running", () => {
            const block = activity.registeredBlocks["listen"];
            logo.actions["testAction"] = [];
            activity.logo = { firstNoteTime: Date.now() };
            const tur = {
                running: false,
                queue: [],
                parentFlowQueue: [],
                singer: { justCounting: [], runningFromEvent: false, turtleTime: 0 }
            };
            activity.turtles.ithTurtle = jest.fn(() => tur);
            block.flow(["event1", "testAction"], logo, 0, 10);
            const listenerCall = logo.setTurtleListener.mock.calls[0];
            const listenerFn = listenerCall[2];
            listenerFn({});
            expect(tur.singer.runningFromEvent).toBe(true);
            expect(logo.runFromBlockNow).toHaveBeenCalled();
        });
    });
});
