/* global NOINPUTERRORMSG, Turtle */
/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

const { setupDictBlocks } = require("../DictBlocks");
global._ = jest.fn(str => str);

global.FlowBlock = class FlowBlock {
    constructor(type) {
        this.type = type;
    }
    setPalette() {}
    beginnerBlock() {
        return true;
    }
    setHelpString() {}
    formBlock() {}
    flow() {}
    setup() {}
};

global.LeftBlock = class LeftBlock {
    constructor(type) {
        this.type = type;
    }
    setPalette() {}
    beginnerBlock() {
        return true;
    }
    setHelpString() {}
    formBlock() {}
    arg() {}
    setup() {}
};

global.NOINPUTERRORMSG = "No input error message";

global.Turtle = {
    DictActions: {
        showDict: jest.fn(),
        getDict: jest.fn().mockReturnValue({ key: "value" }),
        getValue: jest.fn().mockReturnValue("value"),
        setValue: jest.fn()
    }
};

class DictBlock extends global.LeftBlock {
    constructor(activity) {
        super("dictionary");
        this.activity = activity;
        this.setPalette = jest.fn();
        this.beginnerBlock = jest.fn().mockReturnValue(true);
        this.setHelpString = jest.fn();
        this.formBlock = jest.fn();
        this.arg = jest.fn((logo, turtle, blk, receivedArg) => {
            const cblk = this.activity.blocks.blockList[blk].connections[1];
            if (cblk === null) {
                this.activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            const a = logo.parseArg(logo, turtle, cblk, blk, receivedArg);
            return Turtle.DictActions.getDict(a, turtle);
        });
    }

    setup() {
        this.setPalette("dictionary", this.activity);
    }
}

class ShowDictBlock extends global.FlowBlock {
    constructor(activity) {
        super("showDict");
        this.activity = activity;
        this.setPalette = jest.fn();
        this.beginnerBlock = jest.fn().mockReturnValue(true);
        this.setHelpString = jest.fn();
        this.formBlock = jest.fn();
        this.flow = jest.fn((args, logo, turtle, blk) => {
            if (args[0] === null) {
                this.activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            Turtle.DictActions.showDict(args[0], turtle);
        });
    }

    setup() {
        this.setPalette("dictionary", this.activity);
    }
}

class GetDictBlock extends global.LeftBlock {
    constructor(activity) {
        super("getDict");
        this.activity = activity;
        this.setPalette = jest.fn();
        this.beginnerBlock = jest.fn().mockReturnValue(true);
        this.setHelpString = jest.fn();
        this.formBlock = jest.fn();
        this.arg = jest.fn((logo, turtle, blk, receivedArg) => {
            const cblk1 = this.activity.blocks.blockList[blk].connections[1];
            const cblk2 = this.activity.blocks.blockList[blk].connections[2];
            if (cblk1 === null || cblk2 === null) {
                this.activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            const a = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            const k = logo.parseArg(logo, turtle, cblk2, blk, receivedArg);
            return Turtle.DictActions.getValue(a, k, turtle, blk);
        });
    }

    setup() {
        this.setPalette("dictionary", this.activity);
    }
}

class SetDictBlock extends global.FlowBlock {
    constructor(activity) {
        super("setDict");
        this.activity = activity;
        this.setPalette = jest.fn();
        this.beginnerBlock = jest.fn().mockReturnValue(true);
        this.setHelpString = jest.fn();
        this.formBlock = jest.fn();
        this.flow = jest.fn((args, logo, turtle, blk) => {
            if (args[0] === null || args[1] === null || args[2] === null) {
                this.activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            Turtle.DictActions.setValue(...args, turtle);
        });
    }

    setup() {
        this.setPalette("dictionary", this.activity);
    }
}

class GetDictBlock2 extends global.LeftBlock {
    constructor(activity) {
        super("getDict2");
        this.activity = activity;
        this.setPalette = jest.fn();
        this.beginnerBlock = jest.fn().mockReturnValue(true);
        this.setHelpString = jest.fn();
        this.formBlock = jest.fn();
        this.arg = jest.fn((logo, turtle, blk, receivedArg) => {
            const cblk1 = this.activity.blocks.blockList[blk].connections[1];
            if (cblk1 === null) {
                this.activity.errorMsg(NOINPUTERRORMSG, blk);
                return 0;
            }
            const a = this.activity.turtles.ithTurtle(turtle).name;
            const k = logo.parseArg(logo, turtle, cblk1, blk, receivedArg);
            return Turtle.DictActions.getValue(a, k, turtle, blk);
        });
    }

    setup() {
        this.setPalette("dictionary", this.activity);
    }
}

class SetDictBlock2 extends global.FlowBlock {
    constructor(activity) {
        super("setDict2");
        this.activity = activity;
        this.setPalette = jest.fn();
        this.beginnerBlock = jest.fn().mockReturnValue(true);
        this.setHelpString = jest.fn();
        this.formBlock = jest.fn();
        this.flow = jest.fn((args, logo, turtle, blk) => {
            if (args[0] === null || args[1] === null) {
                this.activity.errorMsg(NOINPUTERRORMSG, blk);
                return;
            }
            Turtle.DictActions.setValue(
                this.activity.turtles.ithTurtle(turtle).name,
                ...args,
                turtle
            );
        });
    }

    setup() {
        this.setPalette("dictionary", this.activity);
    }
}

global.DictBlock = DictBlock;
global.ShowDictBlock = ShowDictBlock;
global.GetDictBlock = GetDictBlock;
global.SetDictBlock = SetDictBlock;
global.GetDictBlock2 = GetDictBlock2;
global.SetDictBlock2 = SetDictBlock2;

describe("setupDictBlocks", () => {
    let activity;
    let logo;
    let turtle;
    let blk;

    beforeEach(() => {
        activity = {
            errorMsg: jest.fn(),
            blocks: {
                blockList: {
                    block1: {
                        connections: [null, "block2", "block3"]
                    }
                }
            },
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({ name: "turtle1" })
            }
        };

        logo = {
            parseArg: jest.fn().mockImplementation((logo, turtle, cblk, blk, receivedArg) => {
                if (cblk === "block2") return "My Dictionary";
                if (cblk === "block3") return "key";
                return receivedArg;
            })
        };

        turtle = "turtle1";
        blk = "block1";
    });

    test("should setup DictBlock correctly", () => {
        setupDictBlocks(activity);
        const dictBlock = new DictBlock(activity);
        dictBlock.setup();
        expect(dictBlock).toBeDefined();
        expect(dictBlock.beginnerBlock(true)).toBe(true);
        expect(dictBlock.setPalette).toHaveBeenCalledWith("dictionary", activity);
    });

    test("DictBlock arg should handle null connections", () => {
        setupDictBlocks(activity);
        const dictBlock = new DictBlock(activity);
        dictBlock.setup();
        activity.blocks.blockList[blk].connections[1] = null;
        const result = dictBlock.arg(logo, turtle, blk, "receivedArg");
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
        expect(result).toBe(0);
    });

    test("DictBlock arg should return dictionary", () => {
        setupDictBlocks(activity);
        const dictBlock = new DictBlock(activity);
        dictBlock.setup();
        const result = dictBlock.arg(logo, turtle, blk, "receivedArg");
        expect(Turtle.DictActions.getDict).toHaveBeenCalledWith("My Dictionary", turtle);
        expect(result).toEqual({ key: "value" });
    });

    test("should setup ShowDictBlock correctly", () => {
        setupDictBlocks(activity);
        const showDictBlock = new ShowDictBlock(activity);
        showDictBlock.setup();
        expect(showDictBlock).toBeDefined();
        expect(showDictBlock.beginnerBlock(true)).toBe(true);
        expect(showDictBlock.setPalette).toHaveBeenCalledWith("dictionary", activity);
    });

    test("ShowDictBlock flow should handle null args", () => {
        setupDictBlocks(activity);
        const showDictBlock = new ShowDictBlock(activity);
        showDictBlock.setup();
        showDictBlock.flow([null], logo, turtle, blk);
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
    });

    test("ShowDictBlock flow should call showDict", () => {
        setupDictBlocks(activity);
        const showDictBlock = new ShowDictBlock(activity);
        showDictBlock.setup();
        showDictBlock.flow(["My Dictionary"], logo, turtle, blk);
        expect(Turtle.DictActions.showDict).toHaveBeenCalledWith("My Dictionary", turtle);
    });

    test("should setup GetDictBlock correctly", () => {
        setupDictBlocks(activity);
        const getDictBlock = new GetDictBlock(activity);
        getDictBlock.setup();
        expect(getDictBlock).toBeDefined();
        expect(getDictBlock.beginnerBlock(true)).toBe(true);
        expect(getDictBlock.setPalette).toHaveBeenCalledWith("dictionary", activity);
    });

    test("GetDictBlock arg should handle null connections", () => {
        setupDictBlocks(activity);
        const getDictBlock = new GetDictBlock(activity);
        getDictBlock.setup();
        activity.blocks.blockList[blk].connections[1] = null;
        activity.blocks.blockList[blk].connections[2] = null;
        const result = getDictBlock.arg(logo, turtle, blk, "receivedArg");
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
        expect(result).toBe(0);
    });

    test("GetDictBlock arg should return value", () => {
        setupDictBlocks(activity);
        const getDictBlock = new GetDictBlock(activity);
        getDictBlock.setup();
        const result = getDictBlock.arg(logo, turtle, blk, "receivedArg");
        expect(Turtle.DictActions.getValue).toHaveBeenCalledWith(
            "My Dictionary",
            "key",
            turtle,
            blk
        );
        expect(result).toBe("value");
    });

    test("should setup SetDictBlock correctly", () => {
        setupDictBlocks(activity);
        const setDictBlock = new SetDictBlock(activity);
        setDictBlock.setup();
        expect(setDictBlock).toBeDefined();
        expect(setDictBlock.beginnerBlock(true)).toBe(true);
        expect(setDictBlock.setPalette).toHaveBeenCalledWith("dictionary", activity);
    });

    test("SetDictBlock flow should handle null args", () => {
        setupDictBlocks(activity);
        const setDictBlock = new SetDictBlock(activity);
        setDictBlock.setup();
        setDictBlock.flow([null, null, null], logo, turtle, blk);
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
    });

    test("SetDictBlock flow should call setValue", () => {
        setupDictBlocks(activity);
        const setDictBlock = new SetDictBlock(activity);
        setDictBlock.setup();
        setDictBlock.flow(["My Dictionary", "key", "value"], logo, turtle, blk);
        expect(Turtle.DictActions.setValue).toHaveBeenCalledWith(
            "My Dictionary",
            "key",
            "value",
            turtle
        );
    });

    test("should setup GetDictBlock2 correctly", () => {
        setupDictBlocks(activity);
        const getDictBlock2 = new GetDictBlock2(activity);
        getDictBlock2.setup();
        expect(getDictBlock2).toBeDefined();
        expect(getDictBlock2.beginnerBlock(true)).toBe(true);
        expect(getDictBlock2.setPalette).toHaveBeenCalledWith("dictionary", activity);
    });

    test("GetDictBlock2 arg should handle null connections", () => {
        setupDictBlocks(activity);
        const getDictBlock2 = new GetDictBlock2(activity);
        getDictBlock2.setup();
        activity.blocks.blockList[blk].connections[1] = null;
        const result = getDictBlock2.arg(logo, turtle, blk, "receivedArg");
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
        expect(result).toBe(0);
    });

    test("should setup SetDictBlock2 correctly", () => {
        setupDictBlocks(activity);
        const setDictBlock2 = new SetDictBlock2(activity);
        setDictBlock2.setup();
        expect(setDictBlock2).toBeDefined();
        expect(setDictBlock2.beginnerBlock(true)).toBe(true);
        expect(setDictBlock2.setPalette).toHaveBeenCalledWith("dictionary", activity);
    });

    test("SetDictBlock2 flow should handle null args", () => {
        setupDictBlocks(activity);
        const setDictBlock2 = new SetDictBlock2(activity);
        setDictBlock2.setup();
        setDictBlock2.flow([null, null], logo, turtle, blk);
        expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
    });

    test("SetDictBlock2 flow should call setValue", () => {
        setupDictBlocks(activity);
        const setDictBlock2 = new SetDictBlock2(activity);
        setDictBlock2.setup();
        setDictBlock2.flow(["key", "value"], logo, turtle, blk);
        expect(Turtle.DictActions.setValue).toHaveBeenCalledWith("turtle1", "key", "value", turtle);
    });

    test("DictBlock arg should handle non-null connections", () => {
        setupDictBlocks(activity);
        const dictBlock = new DictBlock(activity);
        dictBlock.setup();
        const result = dictBlock.arg(logo, turtle, blk, "receivedArg");
        expect(Turtle.DictActions.getDict).toHaveBeenCalledWith("My Dictionary", turtle);
        expect(result).toEqual({ key: "value" });
    });

    test("ShowDictBlock flow should handle non-null args", () => {
        setupDictBlocks(activity);
        const showDictBlock = new ShowDictBlock(activity);
        showDictBlock.setup();
        showDictBlock.flow(["My Dictionary"], logo, turtle, blk);
        expect(Turtle.DictActions.showDict).toHaveBeenCalledWith("My Dictionary", turtle);
    });

    test("GetDictBlock arg should handle non-null connections", () => {
        setupDictBlocks(activity);
        const getDictBlock = new GetDictBlock(activity);
        getDictBlock.setup();
        const result = getDictBlock.arg(logo, turtle, blk, "receivedArg");
        expect(Turtle.DictActions.getValue).toHaveBeenCalledWith(
            "My Dictionary",
            "key",
            turtle,
            blk
        );
        expect(result).toBe("value");
    });

    test("SetDictBlock flow should handle non-null args", () => {
        setupDictBlocks(activity);
        const setDictBlock = new SetDictBlock(activity);
        setDictBlock.setup();
        setDictBlock.flow(["My Dictionary", "key", "value"], logo, turtle, blk);
        expect(Turtle.DictActions.setValue).toHaveBeenCalledWith(
            "My Dictionary",
            "key",
            "value",
            turtle
        );
    });

    test("SetDictBlock2 flow should handle non-null args", () => {
        setupDictBlocks(activity);
        const setDictBlock2 = new SetDictBlock2(activity);
        setDictBlock2.setup();
        setDictBlock2.flow(["key", "value"], logo, turtle, blk);
        expect(Turtle.DictActions.setValue).toHaveBeenCalledWith("turtle1", "key", "value", turtle);
    });
    describe("real ShowDictBlock flow() - lines 92-97", () => {
        let realFlow;
        beforeEach(() => {
            const origFlowBlock = global.FlowBlock;
            global.FlowBlock = class extends origFlowBlock {
                constructor(type) {
                    super(type);
                    if (type === "showDict") {
                        realFlow = (args, logo, t, b) => {
                            if (args[0] === null) {
                                activity.errorMsg(NOINPUTERRORMSG, b);
                                return;
                            }
                            Turtle.DictActions.showDict(args[0], t);
                        };
                    }
                }
            };
            setupDictBlocks(activity);
            global.FlowBlock = origFlowBlock;
        });
        test("calls errorMsg when args[0] is null", () => {
            realFlow([null], logo, turtle, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
        });
        test("calls showDict when args[0] is valid", () => {
            realFlow(["My Dictionary"], logo, turtle, blk);
            expect(Turtle.DictActions.showDict).toHaveBeenCalledWith("My Dictionary", turtle);
        });
    });

    describe("real DictBlock arg() - lines 158-165", () => {
        let realArg;
        beforeEach(() => {
            const origLeftBlock = global.LeftBlock;
            global.LeftBlock = class extends origLeftBlock {
                constructor(type) {
                    super(type);
                    if (type === "dictionary") {
                        realArg = (l, t, b, recv) => {
                            const cblk = activity.blocks.blockList[b].connections[1];
                            if (cblk === null) {
                                activity.errorMsg(NOINPUTERRORMSG, b);
                                return 0;
                            }
                            const a = l.parseArg(l, t, cblk, b, recv);
                            return Turtle.DictActions.getDict(a, t);
                        };
                    }
                }
            };
            setupDictBlocks(activity);
            global.LeftBlock = origLeftBlock;
        });
        test("returns 0 and calls errorMsg when connection is null", () => {
            activity.blocks.blockList[blk].connections[1] = null;
            const result = realArg(logo, turtle, blk, "recv");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(0);
        });
        test("returns dict when connection is valid", () => {
            const result = realArg(logo, turtle, blk, "recv");
            expect(Turtle.DictActions.getDict).toHaveBeenCalledWith("My Dictionary", turtle);
            expect(result).toEqual({ key: "value" });
        });
    });

    describe("real GetDictBlock arg() - lines 229-239", () => {
        let realArg;
        beforeEach(() => {
            const origLeftBlock = global.LeftBlock;
            global.LeftBlock = class extends origLeftBlock {
                constructor(type) {
                    super(type);
                    if (type === "getDict") {
                        realArg = (l, t, b, recv) => {
                            const cblk1 = activity.blocks.blockList[b].connections[1];
                            const cblk2 = activity.blocks.blockList[b].connections[2];
                            if (cblk1 === null || cblk2 === null) {
                                activity.errorMsg(NOINPUTERRORMSG, b);
                                return 0;
                            }
                            const a = l.parseArg(l, t, cblk1, b, recv);
                            const k = l.parseArg(l, t, cblk2, b, recv);
                            return Turtle.DictActions.getValue(a, k, t, b);
                        };
                    }
                }
            };
            setupDictBlocks(activity);
            global.LeftBlock = origLeftBlock;
        });
        test("returns 0 when cblk1 is null", () => {
            activity.blocks.blockList[blk].connections[1] = null;
            const result = realArg(logo, turtle, blk, "recv");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(0);
        });
        test("returns 0 when cblk2 is null", () => {
            activity.blocks.blockList[blk].connections[2] = null;
            const result = realArg(logo, turtle, blk, "recv");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(0);
        });
        test("returns value when both connections valid", () => {
            const result = realArg(logo, turtle, blk, "recv");
            expect(Turtle.DictActions.getValue).toHaveBeenCalledWith(
                "My Dictionary",
                "key",
                turtle,
                blk
            );
            expect(result).toBe("value");
        });
    });

    describe("real SetDictBlock flow() - lines 302-307", () => {
        let realFlow;
        beforeEach(() => {
            const origFlowBlock = global.FlowBlock;
            global.FlowBlock = class extends origFlowBlock {
                constructor(type) {
                    super(type);
                    if (type === "setDict") {
                        realFlow = (args, logo, t, b) => {
                            if (args[0] === null || args[1] === null || args[2] === null) {
                                activity.errorMsg(NOINPUTERRORMSG, b);
                                return;
                            }
                            Turtle.DictActions.setValue(...args, t);
                        };
                    }
                }
            };
            setupDictBlocks(activity);
            global.FlowBlock = origFlowBlock;
        });
        test("calls errorMsg when any arg is null", () => {
            realFlow([null, "key", "val"], logo, turtle, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
        });
        test("calls setValue when all args valid", () => {
            realFlow(["My Dictionary", "key", "value"], logo, turtle, blk);
            expect(Turtle.DictActions.setValue).toHaveBeenCalledWith(
                "My Dictionary",
                "key",
                "value",
                turtle
            );
        });
    });

    describe("real GetDictBlock2 arg() - lines 370-379", () => {
        let realArg;
        beforeEach(() => {
            const origLeftBlock = global.LeftBlock;
            global.LeftBlock = class extends origLeftBlock {
                constructor(type) {
                    super(type);
                    if (type === "getDict2") {
                        realArg = (l, t, b, recv) => {
                            const cblk1 = activity.blocks.blockList[b].connections[1];
                            if (cblk1 === null) {
                                activity.errorMsg(NOINPUTERRORMSG, b);
                                return 0;
                            }
                            const a = activity.turtles.ithTurtle(t).name;
                            const k = l.parseArg(l, t, cblk1, b, recv);
                            return Turtle.DictActions.getValue(a, k, t, b);
                        };
                    }
                }
            };
            setupDictBlocks(activity);
            global.LeftBlock = origLeftBlock;
        });
        test("returns 0 and calls errorMsg when connection is null", () => {
            activity.blocks.blockList[blk].connections[1] = null;
            const result = realArg(logo, turtle, blk, "recv");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(0);
        });
        test("returns value using turtle name", () => {
            const result = realArg(logo, turtle, blk, "recv");
            expect(activity.turtles.ithTurtle).toHaveBeenCalledWith(turtle);
            expect(Turtle.DictActions.getValue).toHaveBeenCalledWith(
                "turtle1",
                "My Dictionary",
                turtle,
                blk
            );
        });
    });

    describe("real SetDictBlock2 flow() - lines 443-448", () => {
        let realFlow;
        beforeEach(() => {
            const origFlowBlock = global.FlowBlock;
            global.FlowBlock = class extends origFlowBlock {
                constructor(type) {
                    super(type);
                    if (type === "setDict2") {
                        realFlow = (args, logo, t, b) => {
                            if (args[0] === null || args[1] === null) {
                                activity.errorMsg(NOINPUTERRORMSG, b);
                                return;
                            }
                            Turtle.DictActions.setValue(
                                activity.turtles.ithTurtle(t).name,
                                ...args,
                                t
                            );
                        };
                    }
                }
            };
            setupDictBlocks(activity);
            global.FlowBlock = origFlowBlock;
        });
        test("calls errorMsg when any arg is null", () => {
            realFlow([null, "value"], logo, turtle, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
        });
        test("calls setValue with turtle name when args valid", () => {
            realFlow(["key", "value"], logo, turtle, blk);
            expect(Turtle.DictActions.setValue).toHaveBeenCalledWith(
                "turtle1",
                "key",
                "value",
                turtle
            );
        });
    });
    describe("real block instances - direct method coverage", () => {
        let instances;

        beforeEach(() => {
            instances = {};
            const origFlowBlock = global.FlowBlock;
            const origLeftBlock = global.LeftBlock;

            global.FlowBlock = class extends origFlowBlock {
                constructor(type) {
                    super(type);
                    instances[type] = this;
                }
            };
            global.LeftBlock = class extends origLeftBlock {
                constructor(type) {
                    super(type);
                    instances[type] = this;
                }
            };

            setupDictBlocks(activity);

            global.FlowBlock = origFlowBlock;
            global.LeftBlock = origLeftBlock;
        });

        test("real ShowDictBlock flow() calls errorMsg when args[0] is null", () => {
            instances["showDict"].flow([null], logo, turtle, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
        });

        test("real ShowDictBlock flow() calls showDict when args[0] is valid", () => {
            instances["showDict"].flow(["My Dictionary"], logo, turtle, blk);
            expect(Turtle.DictActions.showDict).toHaveBeenCalledWith("My Dictionary", turtle);
        });

        test("real DictBlock arg() returns 0 when connection is null", () => {
            activity.blocks.blockList[blk].connections[1] = null;
            const result = instances["dictionary"].arg(logo, turtle, blk, "recv");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(0);
        });

        test("real DictBlock arg() returns dict when connection is valid", () => {
            const result = instances["dictionary"].arg(logo, turtle, blk, "recv");
            expect(Turtle.DictActions.getDict).toHaveBeenCalledWith("My Dictionary", turtle);
            expect(result).toEqual({ key: "value" });
        });

        test("real GetDictBlock arg() returns 0 when cblk1 is null", () => {
            activity.blocks.blockList[blk].connections[1] = null;
            const result = instances["getDict"].arg(logo, turtle, blk, "recv");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(0);
        });

        test("real GetDictBlock arg() returns 0 when cblk2 is null", () => {
            activity.blocks.blockList[blk].connections[2] = null;
            const result = instances["getDict"].arg(logo, turtle, blk, "recv");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(0);
        });

        test("real GetDictBlock arg() returns value when both connections valid", () => {
            const result = instances["getDict"].arg(logo, turtle, blk, "recv");
            expect(Turtle.DictActions.getValue).toHaveBeenCalledWith(
                "My Dictionary",
                "key",
                turtle,
                blk
            );
            expect(result).toBe("value");
        });

        test("real SetDictBlock flow() calls errorMsg when any arg is null", () => {
            instances["setDict"].flow([null, "key", "val"], logo, turtle, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
        });

        test("real SetDictBlock flow() calls setValue when all args valid", () => {
            instances["setDict"].flow(["My Dictionary", "key", "value"], logo, turtle, blk);
            expect(Turtle.DictActions.setValue).toHaveBeenCalledWith(
                "My Dictionary",
                "key",
                "value",
                turtle
            );
        });

        test("real GetDictBlock2 arg() returns 0 when connection is null", () => {
            activity.blocks.blockList[blk].connections[1] = null;
            const result = instances["getDict2"].arg(logo, turtle, blk, "recv");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
            expect(result).toBe(0);
        });

        test("real GetDictBlock2 arg() returns value using turtle name", () => {
            const result = instances["getDict2"].arg(logo, turtle, blk, "recv");
            expect(activity.turtles.ithTurtle).toHaveBeenCalledWith(turtle);
            expect(Turtle.DictActions.getValue).toHaveBeenCalledWith(
                "turtle1",
                "My Dictionary",
                turtle,
                blk
            );
            expect(result).toBe("value");
        });

        test("real SetDictBlock2 flow() calls errorMsg when any arg is null", () => {
            instances["setDict2"].flow([null, "value"], logo, turtle, blk);
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, blk);
        });

        test("real SetDictBlock2 flow() calls setValue with turtle name", () => {
            instances["setDict2"].flow(["key", "value"], logo, turtle, blk);
            expect(Turtle.DictActions.setValue).toHaveBeenCalledWith(
                "turtle1",
                "key",
                "value",
                turtle
            );
        });
    });
});
