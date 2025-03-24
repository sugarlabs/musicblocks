/**
 * MusicBlocks v3.6.2
 *
 * @author Alok Dangre
 *
 * @copyright 2025 Alok Dangre
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

const { setupNumberBlocks } = require("../NumberBlocks");

let createdBlocks = {};

class DummyFlowBlock {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName || name;
        createdBlocks[name] = this;
    }
    setPalette(palette, activity) { return this; }
    beginnerBlock(flag) { return this; }
    setHelpString(helpArr) { return this; }
    formBlock(config) {
        this.config = config;
        return this;
    }
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) { return this; }
    flow() { }
}

class DummyValueBlock {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName || name;
        createdBlocks[name] = this;
        this.extraWidth = 0;
    }
    setPalette(palette, activity) { return this; }
    beginnerBlock(flag) { return this; }
    setHelpString(helpArr) { return this; }
    formBlock(config) {
        this.config = config;
        return this;
    }
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) { return this; }
    arg(logo, turtle, blk) {
        return global.activity.blocks.blockList[blk].value;
    }
}

class DummyLeftBlock {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName || name;
        createdBlocks[name] = this;
    }
    setPalette(palette, activity) { return this; }
    beginnerBlock(flag) { return this; }
    setHelpString(helpArr) { return this; }
    formBlock(config) {
        this.config = config;
        return this;
    }
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) { return this; }
    arg(logo, turtle, blk) {
        return global.activity.blocks.blockList[blk].value;
    }
}

global.FlowBlock = DummyFlowBlock;
global.ValueBlock = DummyValueBlock;
global.LeftBlock = DummyLeftBlock;
global._ = jest.fn((str) => str);

global.NOINPUTERRORMSG = "No input provided";
global.NANERRORMSG = "Not a number";
global.NOSQRTERRORMSG = "No square root";
global.ZERODIVIDEERRORMSG = "Division by zero";

global.MathUtility = {
    doInt: (x) => Math.floor(Number(x)),
    doMod: (a, b) => Number(a) % Number(b),
    doPower: (a, b) => Math.pow(Number(a), Number(b)),
    doSqrt: (a) => {
        if (Number(a) < 0) throw "NoSqrtError";
        return Math.sqrt(Number(a));
    },
    doAbs: (a) => Math.abs(Number(a)),
    doCalculateDistance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    doDivide: (a, b) => {
        if (Number(b) === 0) throw "DivByZeroError";
        return Number(a) / Number(b);
    },
    doMultiply: (a, b) => Number(a) * Number(b),
    doNegate: (a) => -Number(a),
    doPlus: (a, b) => {
        if (!isNaN(a) && !isNaN(b)) {
            return Number(a) + Number(b);
        } else {
            return "" + a + b;
        }
    },
    doOneOf: (a, b) => a,
    doRandom: (a, b, octave) => a,
    doMinus: (a, b) => Number(a) - Number(b)
};

global.calcOctave = (currentOctave, val, lastNote, noteValue) => currentOctave + parseInt(val);

global.toFixed2 = (val) => Number(val).toFixed(2);

const createDummyTurtle = () => ({
    id: "T1",
    container: { x: 50, y: 100, visible: true },
    singer: {
        currentOctave: 4,
        lastNotePlayed: "C",
        drumStyle: [],
        inNoteBlock: [],
        notePitches: {},
        noteOctaves: {},
        noteCents: {}
    },
    doWait: jest.fn()
});

const dummyActivity = {
    errorMsg: jest.fn(),
    textMsg: jest.fn(),
    blocks: { blockList: {} }
};

dummyActivity.turtles = {
    turtleObjs: {},
    getTurtle(turtle) {
        if (!this.turtleObjs[turtle]) {
            this.turtleObjs[turtle] = createDummyTurtle();
        }
        return this.turtleObjs[turtle];
    },
    ithTurtle(turtle) {
        return this.getTurtle(turtle);
    }
};

const dummyLogo = {
    inStatusMatrix: false,
    stopTurtle: false,
    parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => receivedArg),
    statusFields: []
};

describe("setupNumberBlocks", () => {
    let activity, logo, turtleIndex;

    beforeEach(() => {
        createdBlocks = {};
        DummyFlowBlock.createdBlocks = {};
        DummyValueBlock.createdBlocks = {};
        DummyLeftBlock.createdBlocks = {};
        dummyActivity.errorMsg.mockClear();
        dummyActivity.blocks.blockList = {};
        dummyActivity.turtles.turtleObjs = {};
        activity = dummyActivity;
        global.activity = activity;
        logo = { ...dummyLogo };
        turtleIndex = 0;
        setupNumberBlocks(activity);
    });

    describe("IntBlock", () => {
        it("should return integer using MathUtility.doInt", () => {
            activity.blocks.blockList[100] = { connections: [null, 200], value: 100 };
            logo.parseArg = jest.fn(() => 123.45);
            const intBlock = createdBlocks["int"];
            const result = intBlock.arg(logo, turtleIndex, 100, 123.45);
            expect(result).toEqual(Math.floor(123.45));
        });
        it("should call errorMsg and return 0 if connection is null", () => {
            activity.blocks.blockList[100] = { connections: [null, null] };
            const intBlock = createdBlocks["int"];
            const result = intBlock.arg(logo, turtleIndex, 100, 0);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", 100);
            expect(result).toEqual(0);
        });
    });

    describe("ModBlock", () => {
        it("updateParameter should return value using toFixed2", () => {
            activity.blocks.blockList[110] = { value: 123.456 };
            const modBlock = createdBlocks["mod"];
            const param = modBlock.updateParameter(logo, turtleIndex, 110);
            expect(param).toEqual(toFixed2(123.456));
        });
        it("should return mod value when valid", () => {
            activity.blocks.blockList[110] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 100;
                if (c === "c2") return 12;
            });
            const modBlock = createdBlocks["mod"];
            const result = modBlock.arg(logo, turtleIndex, 110, null);
            expect(result).toEqual(100 % 12);
        });
    });

    describe("PowerBlock", () => {
        it("should return power using MathUtility.doPower", () => {
            activity.blocks.blockList[120] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 2;
                if (c === "c2") return 3;
            });
            const powerBlock = createdBlocks["power"];
            const result = powerBlock.arg(logo, turtleIndex, 120, null);
            expect(result).toEqual(Math.pow(2, 3));
        });
        it("should call errorMsg if a connection is missing", () => {
            activity.blocks.blockList[120] = { connections: [null, "c1", null] };
            const powerBlock = createdBlocks["power"];
            const result = powerBlock.arg(logo, turtleIndex, 120, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", 120);
        });
    });

    describe("SqrtBlock", () => {
        it("should return square root for valid input", () => {
            activity.blocks.blockList[130] = { connections: [null, "c1"], value: 64 };
            logo.parseArg = jest.fn(() => 64);
            const sqrtBlock = createdBlocks["sqrt"];
            const result = sqrtBlock.arg(logo, turtleIndex, 130, null);
            expect(result).toEqual(Math.sqrt(64));
        });
        it("should call errorMsg if input is missing", () => {
            activity.blocks.blockList[130] = { connections: [null, null] };
            const sqrtBlock = createdBlocks["sqrt"];
            const result = sqrtBlock.arg(logo, turtleIndex, 130, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", 130);
            expect(result).toEqual(0);
        });
    });

    describe("AbsBlock", () => {
        it("should return absolute value", () => {
            activity.blocks.blockList[140] = { connections: [null, "c1"] };
            logo.parseArg = jest.fn(() => -123);
            const absBlock = createdBlocks["abs"];
            const result = absBlock.arg(logo, turtleIndex, 140, null);
            expect(result).toEqual(Math.abs(-123));
        });
    });

    describe("DistanceBlock", () => {
        it("should calculate distance between two points", () => {
            activity.blocks.blockList[150] = {
                connections: [null, "c1", "c2", "c3", "c4"]
            };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 0;
                if (c === "c2") return 0;
                if (c === "c3") return 3;
                if (c === "c4") return 4;
            });
            const distanceBlock = createdBlocks["distance"];
            const result = distanceBlock.arg(logo, turtleIndex, 150, null);
            expect(result).toEqual(5);
        });
        it("should call errorMsg if any connection is missing", () => {
            activity.blocks.blockList[150] = {
                connections: [null, "c1", null, "c3", "c4"]
            };
            const distanceBlock = createdBlocks["distance"];
            const result = distanceBlock.arg(logo, turtleIndex, 150, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", 150);
            expect(result).toEqual(0);
        });
    });

    describe("DivideBlock", () => {
        it("should perform division", () => {
            activity.blocks.blockList[160] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 100;
                if (c === "c2") return 4;
            });
            const divideBlock = createdBlocks["divide"];
            const result = divideBlock.arg(logo, turtleIndex, 160, null);
            expect(result).toEqual(25);
        });
        it("should call errorMsg on division by zero", () => {
            activity.blocks.blockList[160] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 100;
                if (c === "c2") return 0;
            });
            const divideBlock = createdBlocks["divide"];
            const result = divideBlock.arg(logo, turtleIndex, 160, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("Division by zero", 160);
            expect(result).toEqual(0);
        });
    });

    describe("MultiplyBlock", () => {
        it("should perform multiplication", () => {
            activity.blocks.blockList[170] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 5;
                if (c === "c2") return 6;
            });
            const multiplyBlock = createdBlocks["multiply"];
            const result = multiplyBlock.arg(logo, turtleIndex, 170, null);
            expect(result).toEqual(30);
        });
    });

    describe("NegBlock", () => {
        it("should return the negated value", () => {
            activity.blocks.blockList[180] = { connections: [null, "c1"] };
            logo.parseArg = jest.fn(() => 7);
            const negBlock = createdBlocks["neg"];
            const result = negBlock.arg(logo, turtleIndex, 180, null);
            expect(result).toEqual(-7);
        });
        it("should call errorMsg if connection is missing", () => {
            activity.blocks.blockList[180] = { connections: [null, null] };
            const negBlock = createdBlocks["neg"];
            const result = negBlock.arg(logo, turtleIndex, 180, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", 180);
            expect(result).toEqual(0);
        });
    });

    describe("MinusBlock", () => {
        it("should subtract second value from first", () => {
            activity.blocks.blockList[190] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 10;
                if (c === "c2") return 4;
            });
            const minusBlock = createdBlocks["minus"];
            const result = minusBlock.arg(logo, turtleIndex, 190, null);
            expect(result).toEqual(10 - 4);
        });
    });

    describe("PlusBlock", () => {
        it("should add two numbers", () => {
            activity.blocks.blockList[200] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 3;
                if (c === "c2") return 7;
            });
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.arg(logo, turtleIndex, 200, null);
            expect(result).toEqual(3 + 7);
        });
        it("should handle numeric strings by converting them", () => {
            activity.blocks.blockList[200] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn(() => "5");
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.arg(logo, turtleIndex, 200, null);
            expect(result).toEqual(10);
        });
        it("should concatenate two strings", () => {
            activity.blocks.blockList[200] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return "Hello ";
                if (c === "c2") return "world";
            });
            global.MathUtility.doPlus = (a, b) => {
                if (!isNaN(a) && !isNaN(b)) {
                    return Number(a) + Number(b);
                } else {
                    return "" + a + b;
                }
            };
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.arg(logo, turtleIndex, 200, null);
            expect(result).toEqual("Hello world");
        });
        it("should handle mixed string and number concatenation", () => {
            activity.blocks.blockList[200] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return "Count: ";
                if (c === "c2") return 5;
            });
            global.MathUtility.doPlus = (a, b) => {
                if (!isNaN(a) && !isNaN(b)) {
                    return Number(a) + Number(b);
                } else {
                    return "" + a + b;
                }
            };
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.arg(logo, turtleIndex, 200, null);
            expect(result).toEqual("Count: 5");
        });
    });

    describe("OneOfBlock", () => {
        it("should return one of the two values", () => {
            activity.blocks.blockList[210] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 100;
                if (c === "c2") return 200;
            });
            const oneOfBlock = createdBlocks["oneOf"];
            const result = oneOfBlock.arg(logo, turtleIndex, 210, null);
            expect([100, 200]).toContain(result);
        });
    });

    describe("RandomBlock", () => {
        it("should return a random number (deterministic stub)", () => {
            activity.blocks.blockList[220] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return 0;
                if (c === "c2") return 10;
            });
            const randomBlock = createdBlocks["random"];
            const result = randomBlock.arg(logo, turtleIndex, 220, null);
            expect(result).toEqual(0);
        });
    });

    describe("NumberBlock", () => {
        it("should return the block's numeric value", () => {
            activity.blocks.blockList[230] = { value: "123.45" };
            const numberBlock = createdBlocks["number"];
            const result = numberBlock.arg(logo, turtleIndex, 230, null);
            expect(Number(result)).toEqual(123.45);
        });
    });
});
