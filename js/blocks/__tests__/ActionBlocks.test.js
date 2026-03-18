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
});
