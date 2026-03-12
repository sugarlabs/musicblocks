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
    setPalette(palette, activity) {
        return this;
    }
    beginnerBlock(flag) {
        return this;
    }
    setHelpString(helpArr) {
        return this;
    }
    formBlock(config) {
        this.config = config;
        return this;
    }
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) {
        return this;
    }
    flow() {}
}

class DummyValueBlock {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName || name;
        createdBlocks[name] = this;
        this.extraWidth = 0;
    }
    setPalette(palette, activity) {
        return this;
    }
    beginnerBlock(flag) {
        return this;
    }
    setHelpString(helpArr) {
        return this;
    }
    formBlock(config) {
        this.config = config;
        return this;
    }
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) {
        return this;
    }
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
    setPalette(palette, activity) {
        return this;
    }
    beginnerBlock(flag) {
        return this;
    }
    setHelpString(helpArr) {
        return this;
    }
    formBlock(config) {
        this.config = config;
        return this;
    }
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) {
        return this;
    }
    arg(logo, turtle, blk) {
        return global.activity.blocks.blockList[blk].value;
    }
}

global.FlowBlock = DummyFlowBlock;
global.ValueBlock = DummyValueBlock;
global.LeftBlock = DummyLeftBlock;
global._ = jest.fn(str => str);

global.NOINPUTERRORMSG = "No input provided";
global.NANERRORMSG = "Not a number";
global.NOSQRTERRORMSG = "No square root";
global.ZERODIVIDEERRORMSG = "Division by zero";

global.MathUtility = {
    doInt: x => Math.floor(Number(x)),
    doMod: (a, b) => Number(a) % Number(b),
    doPower: (a, b) => Math.pow(Number(a), Number(b)),
    doSqrt: a => {
        if (Number(a) < 0) throw "NoSqrtError";
        return Math.sqrt(Number(a));
    },
    doAbs: a => Math.abs(Number(a)),
    doCalculateDistance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    doDivide: (a, b) => {
        if (Number(b) === 0) throw "DivByZeroError";
        return Number(a) / Number(b);
    },
    doMultiply: (a, b) => Number(a) * Number(b),
    doNegate: a => -Number(a),
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

global.toFixed2 = val => Number(val).toFixed(2);

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
    describe("IntBlock - inStatusMatrix branch", () => {
        it("should push to statusFields when inStatusMatrix is true and connected to print", () => {
            activity.blocks.blockList[300] = {
                connections: [301, 302],
                name: "int"
            };
            activity.blocks.blockList[301] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            const intBlock = createdBlocks["int"];
            intBlock.arg(logo, 0, 300, null);
            expect(logo.statusFields).toContainEqual([300, "int"]);
            logo.inStatusMatrix = false;
        });

        it("should call errorMsg and return 0 when MathUtility.doInt throws", () => {
            activity.blocks.blockList[100] = { connections: [null, "c1"] };
            logo.parseArg = jest.fn(() => "not-a-number");
            global.MathUtility.doInt = () => {
                throw new Error("NanError");
            };
            const intBlock = createdBlocks["int"];
            const result = intBlock.arg(logo, 0, 100, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NANERRORMSG, 100);
            expect(result).toEqual(0);
            global.MathUtility.doInt = x => Math.floor(Number(x));
        });
    });

    describe("ModBlock - inStatusMatrix branch", () => {
        it("should push to statusFields when inStatusMatrix is true", () => {
            activity.blocks.blockList[310] = {
                connections: [311, "c1", "c2"],
                name: "mod"
            };
            activity.blocks.blockList[311] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            const modBlock = createdBlocks["mod"];
            modBlock.arg(logo, 0, 310, null);
            expect(logo.statusFields).toContainEqual([310, "mod"]);
            logo.inStatusMatrix = false;
        });

        it("should handle string inputs by parsing them as integers", () => {
            activity.blocks.blockList[110] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c) => {
                if (c === "c1") return "100";
                if (c === "c2") return "12";
            });
            const modBlock = createdBlocks["mod"];
            const result = modBlock.arg(logo, 0, 110, null);
            expect(result).toEqual(100 % 12);
        });

        it("should call errorMsg when MathUtility.doMod throws", () => {
            activity.blocks.blockList[110] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn(() => 5);
            global.MathUtility.doMod = () => {
                throw new Error("NanError");
            };
            const modBlock = createdBlocks["mod"];
            const result = modBlock.arg(logo, 0, 110, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NANERRORMSG, 110);
            expect(result).toEqual(0);
            global.MathUtility.doMod = (a, b) => Number(a) % Number(b);
        });
    });

    describe("PowerBlock - extra branches", () => {
        it("should return cblk1 value when cblk2 is null", () => {
            activity.blocks.blockList[120] = { connections: [null, "c1", null] };
            logo.parseArg = jest.fn(() => 5);
            const powerBlock = createdBlocks["power"];
            const result = powerBlock.arg(logo, 0, 120, null);
            expect(result).toEqual(5);
        });

        it("should return 0 when both connections are null", () => {
            activity.blocks.blockList[120] = { connections: [null, null, null] };
            const powerBlock = createdBlocks["power"];
            const result = powerBlock.arg(logo, 0, 120, null);
            expect(result).toEqual(0);
        });

        it("should call errorMsg when MathUtility.doPower throws", () => {
            activity.blocks.blockList[120] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn(() => 2);
            global.MathUtility.doPower = () => {
                throw new Error("NanError");
            };
            const powerBlock = createdBlocks["power"];
            const result = powerBlock.arg(logo, 0, 120, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NANERRORMSG, 120);
            expect(result).toEqual(0);
            global.MathUtility.doPower = (a, b) => Math.pow(Number(a), Number(b));
        });
    });

    describe("SqrtBlock - error branches", () => {
        it("should call errorMsg with NOSQRTERRORMSG for negative input", () => {
            activity.blocks.blockList[130] = { connections: [null, "c1"] };
            logo.parseArg = jest.fn(() => -9);
            global.MathUtility.doSqrt = a => {
                if (Number(a) < 0) throw "NoSqrtError";
                return Math.sqrt(Number(a));
            };
            const sqrtBlock = createdBlocks["sqrt"];
            sqrtBlock.arg(logo, 0, 130, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOSQRTERRORMSG, 130);
        });

        it("should call errorMsg with NANERRORMSG when NanError thrown", () => {
            activity.blocks.blockList[130] = { connections: [null, "c1"] };
            logo.parseArg = jest.fn(() => "bad");
            global.MathUtility.doSqrt = () => {
                throw "NanError";
            };
            const sqrtBlock = createdBlocks["sqrt"];
            const result = sqrtBlock.arg(logo, 0, 130, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NANERRORMSG, 130);
            expect(result).toEqual(0);
            global.MathUtility.doSqrt = a => Math.sqrt(Number(a));
        });
    });

    describe("AbsBlock - extra branches", () => {
        it("should call errorMsg if connection is null", () => {
            activity.blocks.blockList[140] = { connections: [null, null] };
            const absBlock = createdBlocks["abs"];
            const result = absBlock.arg(logo, 0, 140, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 140);
            expect(result).toEqual(0);
        });

        it("should call errorMsg when MathUtility.doAbs throws", () => {
            activity.blocks.blockList[140] = { connections: [null, "c1"] };
            logo.parseArg = jest.fn(() => "bad");
            global.MathUtility.doAbs = () => {
                throw new Error("NanError");
            };
            const absBlock = createdBlocks["abs"];
            const result = absBlock.arg(logo, 0, 140, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NANERRORMSG, 140);
            expect(result).toEqual(0);
            global.MathUtility.doAbs = a => Math.abs(Number(a));
        });
    });

    describe("DivideBlock - extra branches", () => {
        it("should return cblk1 value when cblk2 is null", () => {
            activity.blocks.blockList[160] = { connections: [null, "c1", null] };
            logo.parseArg = jest.fn(() => 42);
            const divideBlock = createdBlocks["divide"];
            const result = divideBlock.arg(logo, 0, 160, null);
            expect(result).toEqual(42);
        });

        it("should return 0 when both connections are null", () => {
            activity.blocks.blockList[160] = { connections: [null, null, null] };
            const divideBlock = createdBlocks["divide"];
            const result = divideBlock.arg(logo, 0, 160, null);
            expect(result).toEqual(0);
        });

        it("should handle string inputs by parsing them as integers", () => {
            activity.blocks.blockList[160] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c) => {
                if (c === "c1") return "20";
                if (c === "c2") return "4";
            });
            const divideBlock = createdBlocks["divide"];
            const result = divideBlock.arg(logo, 0, 160, null);
            expect(result).toEqual(5);
        });

        it("should call errorMsg with NANERRORMSG on NanError", () => {
            activity.blocks.blockList[160] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn(() => 5);
            global.MathUtility.doDivide = () => {
                throw "NanError";
            };
            const divideBlock = createdBlocks["divide"];
            const result = divideBlock.arg(logo, 0, 160, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NANERRORMSG, 160);
            expect(result).toEqual(0);
            global.MathUtility.doDivide = (a, b) => {
                if (Number(b) === 0) throw "DivByZeroError";
                return Number(a) / Number(b);
            };
        });
    });

    describe("MultiplyBlock - extra branches", () => {
        it("should return cblk1 value when cblk2 is null", () => {
            activity.blocks.blockList[170] = { connections: [null, "c1", null] };
            logo.parseArg = jest.fn(() => 7);
            const multiplyBlock = createdBlocks["multiply"];
            const result = multiplyBlock.arg(logo, 0, 170, null);
            expect(result).toEqual(7);
        });

        it("should return cblk2 value when cblk1 is null", () => {
            activity.blocks.blockList[170] = { connections: [null, null, "c2"] };
            logo.parseArg = jest.fn(() => 9);
            const multiplyBlock = createdBlocks["multiply"];
            const result = multiplyBlock.arg(logo, 0, 170, null);
            expect(result).toEqual(9);
        });

        it("should return 0 when both connections are null", () => {
            activity.blocks.blockList[170] = { connections: [null, null, null] };
            const multiplyBlock = createdBlocks["multiply"];
            const result = multiplyBlock.arg(logo, 0, 170, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 170);
            expect(result).toEqual(0);
        });

        it("should handle string inputs by parsing them as integers", () => {
            activity.blocks.blockList[170] = { connections: [null, "c1", "c2"] };
            activity.blocks.blockList["c1"] = { value: 3 };
            activity.blocks.blockList["c2"] = { value: 4 };
            logo.parseArg = jest.fn((l, t, c) => {
                if (c === "c1") return "3";
                if (c === "c2") return "4";
            });
            const multiplyBlock = createdBlocks["multiply"];
            const result = multiplyBlock.arg(logo, 0, 170, null);
            expect(result).toEqual(12);
        });

        it("should handle pitch block connection with numeric values", () => {
            activity.blocks.blockList[170] = {
                connections: ["pitch_blk", "c1", "c2"]
            };
            activity.blocks.blockList["pitch_blk"] = {
                name: "pitch",
                connections: [null, "note_blk"]
            };
            activity.blocks.blockList["note_blk"] = { value: "C" };
            activity.blocks.blockList["c1"] = { value: 2 };
            activity.blocks.blockList["c2"] = { value: 3 };
            logo.parseArg = jest.fn((l, t, c) => {
                if (c === "c1") return 2;
                if (c === "c2") return 3;
            });
            const multiplyBlock = createdBlocks["multiply"];
            const result = multiplyBlock.arg(logo, 0, 170, null);
            expect(result).toEqual(6);
        });
    });

    describe("NegBlock - string input branch", () => {
        it("should parse string input as integer before negating", () => {
            activity.blocks.blockList[180] = { connections: [null, "c1"] };
            logo.parseArg = jest.fn(() => "5");
            const negBlock = createdBlocks["neg"];
            const result = negBlock.arg(logo, 0, 180, null);
            expect(result).toEqual(-5);
        });
    });

    describe("MinusBlock - extra branches", () => {
        it("should return cblk1 value when cblk2 is null", () => {
            activity.blocks.blockList[190] = { connections: [null, "c1", null] };
            logo.parseArg = jest.fn(() => 10);
            const minusBlock = createdBlocks["minus"];
            const result = minusBlock.arg(logo, 0, 190, null);
            expect(result).toEqual(10);
        });

        it("should return negated cblk2 when cblk1 is null", () => {
            activity.blocks.blockList[190] = { connections: [null, null, "c2"] };
            logo.parseArg = jest.fn(() => 5);
            const minusBlock = createdBlocks["minus"];
            const result = minusBlock.arg(logo, 0, 190, null);
            expect(result).toEqual(-5);
        });

        it("should return 0 when both connections are null", () => {
            activity.blocks.blockList[190] = { connections: [null, null, null] };
            const minusBlock = createdBlocks["minus"];
            const result = minusBlock.arg(logo, 0, 190, null);
            expect(result).toEqual(0);
        });

        it("should handle string inputs by parsing them as integers", () => {
            activity.blocks.blockList[190] = { connections: [null, "c1", "c2"] };
            activity.blocks.blockList["c1"] = { value: 10 };
            activity.blocks.blockList["c2"] = { value: 3 };
            logo.parseArg = jest.fn((l, t, c) => {
                if (c === "c1") return "10";
                if (c === "c2") return "3";
            });
            const minusBlock = createdBlocks["minus"];
            const result = minusBlock.arg(logo, 0, 190, null);
            expect(result).toEqual(7);
        });

        it("should handle pitch block with numeric values", () => {
            activity.blocks.blockList[190] = {
                connections: ["pitch_blk", "c1", "c2"]
            };
            activity.blocks.blockList["pitch_blk"] = {
                name: "pitch",
                connections: [null, "note_blk"]
            };
            activity.blocks.blockList["note_blk"] = { value: "C" };
            activity.blocks.blockList["c1"] = { value: 5 };
            activity.blocks.blockList["c2"] = { value: 3 };
            logo.parseArg = jest.fn((l, t, c) => {
                if (c === "c1") return 5;
                if (c === "c2") return 3;
            });
            const minusBlock = createdBlocks["minus"];
            const result = minusBlock.arg(logo, 0, 190, null);
            expect(result).toEqual(2);
        });
    });

    describe("PlusBlock - extra branches", () => {
        it("should return cblk1 value when cblk2 is null", () => {
            activity.blocks.blockList[200] = { connections: [null, "c1", null] };
            logo.parseArg = jest.fn(() => 99);
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.arg(logo, 0, 200, null);
            expect(result).toEqual(99);
        });

        it("should return cblk2 value when cblk1 is null", () => {
            activity.blocks.blockList[200] = { connections: [null, null, "c2"] };
            logo.parseArg = jest.fn(() => 88);
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.arg(logo, 0, 200, null);
            expect(result).toEqual(88);
        });

        it("should return 0 when both connections are null", () => {
            activity.blocks.blockList[200] = { connections: [null, null, null] };
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.arg(logo, 0, 200, null);
            expect(result).toEqual(0);
        });

        it("should handle pitch block with accidentalname (scaledegree branch)", () => {
            activity.blocks.blockList[200] = {
                connections: ["pitch_blk", "c1", "c2"]
            };
            activity.blocks.blockList["pitch_blk"] = {
                name: "pitch",
                connections: [null, "note_blk"]
            };
            activity.blocks.blockList["note_blk"] = { value: "C" };
            activity.blocks.blockList["c1"] = { name: "number", value: 3 };
            activity.blocks.blockList["c2"] = { name: "accidentalname", value: "sharp ♯" };
            logo.parseArg = jest.fn(() => 3);
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.arg(logo, 0, 200, null);
            expect(result).toContain("♯");
        });

        it("updateParameter should return string value directly", () => {
            activity.blocks.blockList[200] = { value: "hello" };
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.updateParameter(logo, 0, 200);
            expect(result).toEqual("hello");
        });

        it("updateParameter should return toFixed2 for numeric value", () => {
            activity.blocks.blockList[200] = { value: 3.14159 };
            const plusBlock = createdBlocks["plus"];
            const result = plusBlock.updateParameter(logo, 0, 200);
            expect(result).toEqual(Number(3.14159).toFixed(2));
        });
    });

    describe("OneOfBlock - extra branches", () => {
        it("should call errorMsg and return cblk1 value when cblk2 is null", () => {
            activity.blocks.blockList[210] = { connections: [null, "c1", null] };
            logo.parseArg = jest.fn(() => 55);
            const oneOfBlock = createdBlocks["oneOf"];
            const result = oneOfBlock.arg(logo, 0, 210, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 210);
            expect(result).toEqual(55);
        });

        it("should call errorMsg and return cblk2 value when cblk1 is null", () => {
            activity.blocks.blockList[210] = { connections: [null, null, "c2"] };
            logo.parseArg = jest.fn(() => 77);
            const oneOfBlock = createdBlocks["oneOf"];
            const result = oneOfBlock.arg(logo, 0, 210, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 210);
            expect(result).toEqual(77);
        });

        it("should return 0 when both connections are null", () => {
            activity.blocks.blockList[210] = { connections: [null, null, null] };
            const oneOfBlock = createdBlocks["oneOf"];
            const result = oneOfBlock.arg(logo, 0, 210, null);
            expect(result).toEqual(0);
        });
    });

    describe("RandomBlock - extra branches", () => {
        it("should call errorMsg and return 0 when cblk1 is null", () => {
            activity.blocks.blockList[220] = { connections: [null, null, "c2"] };
            const randomBlock = createdBlocks["random"];
            const result = randomBlock.arg(logo, 0, 220, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 220);
            expect(result).toEqual(0);
        });

        it("should handle pitch block connection and read octave", () => {
            activity.blocks.blockList[220] = {
                connections: ["pitch_blk", "c1", "c2"]
            };
            activity.blocks.blockList["pitch_blk"] = {
                name: "pitch",
                connections: [null, null, "oct_blk"]
            };
            activity.blocks.blockList["oct_blk"] = { value: 4 };
            logo.parseArg = jest.fn((l, t, c) => {
                if (c === "c1") return 0;
                if (c === "c2") return 12;
            });
            global.MathUtility.doRandom = (a, b, octave) => (octave !== undefined ? octave : a);
            const randomBlock = createdBlocks["random"];
            const result = randomBlock.arg(logo, 0, 220, null);
            expect(result).toEqual(4);
            global.MathUtility.doRandom = (a, b, octave) => a;
        });

        it("should handle hspace block traversal to reach pitch", () => {
            activity.blocks.blockList[220] = {
                connections: ["hspace_blk", "c1", "c2"]
            };
            activity.blocks.blockList["hspace_blk"] = {
                name: "hspace",
                connections: ["pitch_blk"]
            };
            activity.blocks.blockList["pitch_blk"] = {
                name: "pitch",
                connections: [null, null, "oct_blk"]
            };
            activity.blocks.blockList["oct_blk"] = { value: 5 };
            logo.parseArg = jest.fn((l, t, c) => {
                if (c === "c1") return 0;
                if (c === "c2") return 12;
            });
            global.MathUtility.doRandom = (a, b, octave) => (octave !== undefined ? octave : a);
            const randomBlock = createdBlocks["random"];
            const result = randomBlock.arg(logo, 0, 220, null);
            expect(result).toEqual(5);
            global.MathUtility.doRandom = (a, b, octave) => a;
        });

        it("should handle when doRandom returns an object (array)", () => {
            activity.blocks.blockList[220] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c) => {
                if (c === "c1") return 1;
                if (c === "c2") return 5;
            });
            global.MathUtility.doRandom = () => [3, "extra"];
            const randomBlock = createdBlocks["random"];
            const result = randomBlock.arg(logo, 0, 220, null);
            expect(result).toEqual(3);
            global.MathUtility.doRandom = (a, b, octave) => a;
        });

        it("should call errorMsg when doRandom throws", () => {
            activity.blocks.blockList[220] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn(() => 1);
            global.MathUtility.doRandom = () => {
                throw new Error("NanError");
            };
            const randomBlock = createdBlocks["random"];
            const result = randomBlock.arg(logo, 0, 220, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NANERRORMSG, 220);
            expect(result).toEqual(0);
            global.MathUtility.doRandom = (a, b, octave) => a;
        });
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
    describe("inStatusMatrix branches", () => {
        afterEach(() => {
            logo.inStatusMatrix = false;
        });

        it("PowerBlock should push to statusFields when inStatusMatrix", () => {
            activity.blocks.blockList[400] = { connections: [401, "c1", "c2"] };
            activity.blocks.blockList[401] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            createdBlocks["power"].arg(logo, 0, 400, null);
            expect(logo.statusFields).toContainEqual([400, "power"]);
        });

        it("SqrtBlock should push to statusFields when inStatusMatrix", () => {
            activity.blocks.blockList[410] = { connections: [411, "c1"] };
            activity.blocks.blockList[411] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            createdBlocks["sqrt"].arg(logo, 0, 410, null);
            expect(logo.statusFields).toContainEqual([410, "sqrt"]);
        });

        it("AbsBlock should push to statusFields when inStatusMatrix", () => {
            activity.blocks.blockList[420] = { connections: [421, "c1"] };
            activity.blocks.blockList[421] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            createdBlocks["abs"].arg(logo, 0, 420, null);
            expect(logo.statusFields).toContainEqual([420, "abs"]);
        });

        it("DistanceBlock should push to statusFields when inStatusMatrix", () => {
            activity.blocks.blockList[430] = { connections: [431, "c1", "c2", "c3", "c4"] };
            activity.blocks.blockList[431] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            createdBlocks["distance"].arg(logo, 0, 430, null);
            expect(logo.statusFields).toContainEqual([430, "distance"]);
        });

        it("DivideBlock should push to statusFields when inStatusMatrix", () => {
            activity.blocks.blockList[440] = { connections: [441, "c1", "c2"] };
            activity.blocks.blockList[441] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            createdBlocks["divide"].arg(logo, 0, 440, null);
            expect(logo.statusFields).toContainEqual([440, "divide"]);
        });

        it("MultiplyBlock should push to statusFields when inStatusMatrix", () => {
            activity.blocks.blockList[450] = { connections: [451, "c1", "c2"] };
            activity.blocks.blockList[451] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            createdBlocks["multiply"].arg(logo, 0, 450, null);
            expect(logo.statusFields).toContainEqual([450, "multiply"]);
        });

        it("NegBlock should push to statusFields when inStatusMatrix", () => {
            activity.blocks.blockList[460] = { connections: [461, "c1"] };
            activity.blocks.blockList[461] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            createdBlocks["neg"].arg(logo, 0, 460, null);
            expect(logo.statusFields).toContainEqual([460, "neg"]);
        });

        it("MinusBlock should push to statusFields when inStatusMatrix", () => {
            activity.blocks.blockList[470] = { connections: [471, "c1", "c2"] };
            activity.blocks.blockList[471] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            createdBlocks["minus"].arg(logo, 0, 470, null);
            expect(logo.statusFields).toContainEqual([470, "minus"]);
        });

        it("PlusBlock should push to statusFields when inStatusMatrix", () => {
            activity.blocks.blockList[480] = { connections: [481, "c1", "c2"] };
            activity.blocks.blockList[481] = { name: "print" };
            logo.inStatusMatrix = true;
            logo.statusFields = [];
            createdBlocks["plus"].arg(logo, 0, 480, null);
            expect(logo.statusFields).toContainEqual([480, "plus"]);
        });
    });
    describe("updateParameter methods", () => {
        it("PowerBlock updateParameter should return toFixed2", () => {
            activity.blocks.blockList[120] = { value: 8.333 };
            const result = createdBlocks["power"].updateParameter(logo, 0, 120);
            expect(result).toEqual(Number(8.333).toFixed(2));
        });

        it("SqrtBlock updateParameter should return toFixed2", () => {
            activity.blocks.blockList[130] = { value: 64.5 };
            const result = createdBlocks["sqrt"].updateParameter(logo, 0, 130);
            expect(result).toEqual(Number(64.5).toFixed(2));
        });

        it("AbsBlock updateParameter should return toFixed2", () => {
            activity.blocks.blockList[140] = { value: 9.99 };
            const result = createdBlocks["abs"].updateParameter(logo, 0, 140);
            expect(result).toEqual(Number(9.99).toFixed(2));
        });

        it("DistanceBlock updateParameter should return toFixed2", () => {
            activity.blocks.blockList[150] = { value: 5.5 };
            const result = createdBlocks["distance"].updateParameter(logo, 0, 150);
            expect(result).toEqual(Number(5.5).toFixed(2));
        });

        it("NegBlock updateParameter should return value directly", () => {
            activity.blocks.blockList[180] = { value: -7 };
            const result = createdBlocks["neg"].updateParameter(logo, 0, 180);
            expect(result).toEqual(-7);
        });

        it("MinusBlock updateParameter should return toFixed2", () => {
            activity.blocks.blockList[190] = { value: 6.789 };
            const result = createdBlocks["minus"].updateParameter(logo, 0, 190);
            expect(result).toEqual(Number(6.789).toFixed(2));
        });
    });
});
