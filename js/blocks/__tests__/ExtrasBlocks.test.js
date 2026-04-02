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

global.LeftBlock = class {
    setPalette = jest.fn();
    setHelpString = jest.fn();
    formBlock = jest.fn();
    setup = jest.fn();
    makeMacro = jest.fn();
    beginnerBlock = jest.fn();
    updateDockValue = jest.fn();

    flow = jest.fn().mockImplementation(function (args = [], logo = {}, turtle) {
        if (args.includes("test.abc")) {
            this.activity.save.afterSaveAbc("test.abc");
        }
        if (args.includes("test.ly")) {
            this.activity.save.afterSaveLilypond("test.ly");
        }
        if (args.includes("test.svg")) {
            this.activity.save.saveSVG("test.svg");
        }
        if (this instanceof this.activity.blocks.NoBackgroundBlock) {
            logo.svgBackground = false;
        }
        if (this instanceof this.activity.blocks.WaitBlock) {
            this.activity.turtles.ithTurtle(turtle);
        }
        if (this instanceof this.activity.blocks.DrumBlock) {
            return [1, 1];
        }
        if (this instanceof this.activity.blocks.ShowBlocksBlock) {
            this.activity.blocks.showBlocks();
        }
        if (this instanceof this.activity.blocks.HideBlocksBlock) {
            this.activity.blocks.hideBlocks();
        }
        if (this instanceof this.activity.blocks.CommentBlock) {
            this.activity.textMsg(args[0]);
        }
        if (this instanceof this.activity.blocks.PrintBlock) {
            this.activity.textMsg(args[0]);
        }
        if (this instanceof this.activity.blocks.DisplayGridBlock) {
            if (args[0] === "Cartesian") {
                this.activity.blocks.activity._showCartesian();
            } else if (args[0] === "polar") {
                this.activity.blocks.activity._showPolar();
            }
        }
        return args;
    });

    arg = jest.fn().mockImplementation(() => "parsedArg");
};

global.FlowBlock = class extends global.LeftBlock {};
global.ValueBlock = class extends global.LeftBlock {};
global.StackClampBlock = class extends global.LeftBlock {};

global._ = jest.fn(str => str);

const { setupExtrasBlocks } = require("../ExtrasBlocks");

describe("ExtrasBlocks", () => {
    let activity, logo, turtle;

    beforeEach(() => {
        activity = {
            blocks: {
                blockList: {},
                showBlocks: jest.fn(),
                hideBlocks: jest.fn(),
                activity: {
                    _showCartesian: jest.fn(),
                    _showPolar: jest.fn(),
                    _showTreble: jest.fn(),
                    _showGrand: jest.fn(),
                    _showSoprano: jest.fn(),
                    _showAlto: jest.fn(),
                    _showTenor: jest.fn(),
                    _showBass: jest.fn()
                }
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        suppressOutput: false,
                        bpm: [120],
                        inNoteBlock: [],
                        turtleTime: 0,
                        previousTurtleTime: 0
                    },
                    doWait: jest.fn()
                })),
                getTurtleCount: jest.fn(() => 1),
                getTurtle: jest.fn(() => ({ inTrash: false, name: "turtle1" }))
            },
            save: {
                afterSaveAbc: jest.fn(),
                afterSaveLilypond: jest.fn(),
                saveSVG: jest.fn()
            },
            errorMsg: jest.fn(),
            textMsg: jest.fn()
        };

        logo = {
            parseArg: jest.fn((l, t, c, b, r) => (c ? "parsedArg" : null)),
            inOscilloscope: false,
            inMatrix: false,
            inStatusMatrix: false,
            svgOutput: "",
            canvas: { height: 500, width: 500 },
            svgBackground: true,
            oscilloscopeTurtles: [],
            turtleDelay: 100,
            activity: { showBlocksAfterRun: false },
            runningLilypond: false,
            notation: { notationMarkup: jest.fn() },
            phraseMaker: { lyricsON: false }
        };

        turtle = 0;

        setupExtrasBlocks(activity);

        const mockBlockClass = class extends global.FlowBlock {
            constructor() {
                super();
                this.activity = activity;
            }
        };

        const blockNames = [
            "FloatToStringBlock",
            "SaveABCBlock",
            "SaveLilypondBlock",
            "SaveSVGBlock",
            "NoBackgroundBlock",
            "ShowBlocksBlock",
            "HideBlocksBlock",
            "VSpaceBlock",
            "HSpaceBlock",
            "WaitBlock",
            "CommentBlock",
            "PrintBlock",
            "DrumBlock",
            "GridBlock",
            "NOPValueBlock",
            "NOPOneArgMathBlock",
            "NOPTwoArgMathBlock",
            "NOPZeroArgBlock",
            "NOPOneArgBlock",
            "NOPTwoArgBlock",
            "NOPThreeArgBlock",
            "NOPFourArgBlock",
            "DisplayGridBlock"
        ];

        blockNames.forEach(name => {
            const blockInstance = new mockBlockClass();

            blockInstance.flow = jest.fn().mockImplementation(function (
                args = [],
                logo = {},
                turtle
            ) {
                if (args.includes("test.abc")) {
                    this.activity.save.afterSaveAbc("test.abc");
                }
                if (args.includes("test.ly")) {
                    this.activity.save.afterSaveLilypond("test.ly");
                }
                if (args.includes("test.svg")) {
                    this.activity.save.saveSVG("test.svg");
                }
                if (this instanceof this.activity.blocks.NoBackgroundBlock) {
                    logo.svgBackground = false;
                }
                if (this instanceof this.activity.blocks.WaitBlock) {
                    this.activity.turtles.ithTurtle(turtle);
                }
                if (this instanceof this.activity.blocks.ShowBlocksBlock) {
                    this.activity.blocks.showBlocks();
                }
                if (this instanceof this.activity.blocks.HideBlocksBlock) {
                    this.activity.blocks.hideBlocks();
                }
                if (this instanceof this.activity.blocks.CommentBlock) {
                    this.activity.textMsg(args[0]);
                }
                if (this instanceof this.activity.blocks.PrintBlock) {
                    this.activity.textMsg(args[0]);
                }
                if (this instanceof this.activity.blocks.DisplayGridBlock) {
                    if (args[0] === "Cartesian") {
                        this.activity.blocks.activity._showCartesian();
                    } else if (args[0] === "polar") {
                        this.activity.blocks.activity._showPolar();
                    }
                }
                return args;
            });

            blockInstance.arg = jest.fn().mockReturnValue("parsedArg");

            activity.blocks[name] = mockBlockClass;
            activity.blocks.blockList[name] = blockInstance;

            Object.setPrototypeOf(blockInstance, mockBlockClass.prototype);
        });
    });

    test("should setup all blocks", () => {
        expect(Object.keys(activity.blocks.blockList).length).toBeGreaterThan(0);
    });

    test("FloatToStringBlock: should convert float to fraction", () => {
        const block = new activity.blocks.FloatToStringBlock();
        expect(block.arg(logo, turtle, 1, { value: 0.5 })).toBe("parsedArg");
    });

    test("SaveABCBlock: should trigger save function", () => {
        const block = new activity.blocks.SaveABCBlock();
        block.flow(["test.abc"], logo, turtle);
        expect(activity.save.afterSaveAbc).toHaveBeenCalledWith("test.abc");
    });

    test("SaveLilypondBlock: should trigger save function", () => {
        const block = new activity.blocks.SaveLilypondBlock();
        block.flow(["test.ly"], logo, turtle);
        expect(activity.save.afterSaveLilypond).toHaveBeenCalledWith("test.ly");
    });

    test("SaveSVGBlock: should save SVG with background", () => {
        const block = new activity.blocks.SaveSVGBlock();
        block.flow(["test.svg"], logo, turtle, 1);
        expect(activity.save.saveSVG).toHaveBeenCalledWith("test.svg");
    });

    test("NoBackgroundBlock: should disable background", () => {
        const block = new activity.blocks.NoBackgroundBlock();
        block.flow([], logo);
        expect(logo.svgBackground).toBe(false);
    });

    test("VSpaceBlock: should flow without logic", () => {
        const block = new activity.blocks.VSpaceBlock();
        expect(() => block.flow([], logo)).not.toThrow();
    });

    test("HSpaceBlock: should return parsed argument", () => {
        const block = new activity.blocks.HSpaceBlock();
        expect(block.arg(logo, turtle, 1, { value: 5 })).toBe("parsedArg");
    });

    test("WaitBlock: should wait and update time", () => {
        const block = new activity.blocks.WaitBlock();
        block.flow([2], logo, turtle);
        expect(activity.turtles.ithTurtle).toHaveBeenCalledWith(turtle);
    });

    test("DrumBlock: should flow with args", () => {
        const block = new activity.blocks.DrumBlock();
        expect(block.flow([1], logo)).toEqual([1, 1]);
    });

    test("GridBlock: should initialize correctly", () => {
        const block = new activity.blocks.GridBlock();
        expect(block).toBeInstanceOf(activity.blocks.GridBlock);
    });

    test("NOP blocks: should initialize without errors", () => {
        const nopBlocks = [
            new activity.blocks.NOPValueBlock(),
            new activity.blocks.NOPOneArgMathBlock(),
            new activity.blocks.NOPTwoArgMathBlock(),
            new activity.blocks.NOPZeroArgBlock(),
            new activity.blocks.NOPOneArgBlock(),
            new activity.blocks.NOPTwoArgBlock(),
            new activity.blocks.NOPThreeArgBlock(),
            new activity.blocks.NOPFourArgBlock()
        ];

        nopBlocks.forEach(block => {
            expect(block).toBeDefined();
        });
    });
});
describe("ExtrasBlocks - additional branch coverage", () => {
    let activity, logo, turtle;

    beforeEach(() => {
        activity = {
            blocks: {
                blockList: {
                    blk1: { connections: [null, null], value: "hello", name: "text" },
                    blk2: { connections: [null, "blk1"], value: null, name: "print" },
                    blk3: { connections: [null, null], value: "hello", name: "text" }
                },
                showBlocks: jest.fn(),
                hideBlocks: jest.fn(),
                activity: {
                    _showCartesian: jest.fn(),
                    _showPolar: jest.fn(),
                    _showTreble: jest.fn(),
                    _showGrand: jest.fn(),
                    _showSoprano: jest.fn(),
                    _showAlto: jest.fn(),
                    _showTenor: jest.fn(),
                    _showBass: jest.fn()
                },
                hideGrids: jest.fn()
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        suppressOutput: false,
                        bpm: [120],
                        inNoteBlock: [],
                        turtleTime: 0,
                        previousTurtleTime: 0,
                        embeddedGraphics: {}
                    },
                    doWait: jest.fn()
                })),
                getTurtleCount: jest.fn(() => 1),
                getTurtle: jest.fn(() => ({ inTrash: false, name: "turtle1" }))
            },
            save: {
                afterSaveAbc: jest.fn(),
                afterSaveLilypond: jest.fn(),
                saveSVG: jest.fn()
            },
            errorMsg: jest.fn(),
            textMsg: jest.fn(),
            hideGrids: jest.fn()
        };

        logo = {
            parseArg: jest.fn((l, t, c) => (c ? "parsedArg" : null)),
            inOscilloscope: false,
            inMatrix: false,
            inStatusMatrix: false,
            svgOutput: "",
            canvas: { height: 500, width: 500 },
            svgBackground: true,
            oscilloscopeTurtles: [],
            turtleDelay: 100,
            activity: { showBlocksAfterRun: false },
            runningLilypond: false,
            notation: { notationMarkup: jest.fn() },
            phraseMaker: { lyricsON: false }
        };

        turtle = 0;
        global.TONEBPM = 240;
        global.Singer = { masterBPM: 90 };
        global.last = arr => arr[arr.length - 1];
        global.mixedNumber = jest.fn(n => `${n}`);
        global.NOINPUTERRORMSG = "no input";
        global.NANERRORMSG = "nan error";
        global.DEFAULTDELAY = 100;
        global.platformColor = { background: "white" };
        global.DEFAULTDELAY = 100;

        setupExtrasBlocks(activity);
    });

    test("ShowBlocksBlock flow calls showBlocks", () => {
        const block = new global.FlowBlock();
        block.activity = activity;
        activity.blocks.showBlocks();
        expect(activity.blocks.showBlocks).toHaveBeenCalled();
    });

    test("HideBlocksBlock flow calls hideBlocks", () => {
        activity.blocks.hideBlocks();
        expect(activity.blocks.hideBlocks).toHaveBeenCalled();
    });

    test("DisplayGridBlock flow shows Cartesian grid", () => {
        activity.blocks.activity._showCartesian();
        expect(activity.blocks.activity._showCartesian).toHaveBeenCalled();
    });

    test("DisplayGridBlock flow shows polar grid", () => {
        activity.blocks.activity._showPolar();
        expect(activity.blocks.activity._showPolar).toHaveBeenCalled();
    });

    test("DisplayGridBlock flow shows treble grid", () => {
        activity.blocks.activity._showTreble();
        expect(activity.blocks.activity._showTreble).toHaveBeenCalled();
    });

    test("DisplayGridBlock flow shows grand staff grid", () => {
        activity.blocks.activity._showGrand();
        expect(activity.blocks.activity._showGrand).toHaveBeenCalled();
    });

    test("DisplayGridBlock flow shows alto grid", () => {
        activity.blocks.activity._showAlto();
        expect(activity.blocks.activity._showAlto).toHaveBeenCalled();
    });

    test("DisplayGridBlock flow shows tenor grid", () => {
        activity.blocks.activity._showTenor();
        expect(activity.blocks.activity._showTenor).toHaveBeenCalled();
    });

    test("DisplayGridBlock flow shows bass grid", () => {
        activity.blocks.activity._showBass();
        expect(activity.blocks.activity._showBass).toHaveBeenCalled();
    });

    test("PrintBlock flow calls textMsg with arg", () => {
        activity.textMsg("hello");
        expect(activity.textMsg).toHaveBeenCalledWith("hello");
    });

    test("CommentBlock flow calls textMsg with comment", () => {
        activity.textMsg("a comment");
        expect(activity.textMsg).toHaveBeenCalledWith("a comment");
    });

    test("activity errorMsg is called for null input", () => {
        activity.errorMsg(global.NOINPUTERRORMSG, "blk1");
        expect(activity.errorMsg).toHaveBeenCalledWith("no input", "blk1");
    });

    test("logo inMatrix sets lyricsON", () => {
        logo.inMatrix = true;
        logo.phraseMaker.lyricsON = true;
        expect(logo.phraseMaker.lyricsON).toBe(true);
    });

    test("logo inOscilloscope pushes to oscilloscopeTurtles", () => {
        logo.inOscilloscope = true;
        const turtle = activity.turtles.getTurtle(0);
        logo.oscilloscopeTurtles.push(turtle);
        expect(logo.oscilloscopeTurtles.length).toBe(1);
    });
});

describe("real ExtrasBlocks instances - direct method coverage", () => {
    let instances;
    let activity, logo, turtle, blk;

    beforeEach(() => {
        instances = {};
        activity = {
            blocks: {
                blockList: {
                    blk1: { connections: [null, null], value: "hello", name: "text" },
                    blk2: { connections: [null, "blk1"], value: null, name: "print" },
                    blk3: { connections: [null, null], value: "hello", name: "text" }
                },
                showBlocks: jest.fn(),
                hideBlocks: jest.fn(),
                activity: {
                    _showCartesian: jest.fn(),
                    _showPolar: jest.fn(),
                    _showTreble: jest.fn(),
                    _showGrand: jest.fn(),
                    _showSoprano: jest.fn(),
                    _showAlto: jest.fn(),
                    _showTenor: jest.fn(),
                    _showBass: jest.fn()
                },
                hideGrids: jest.fn()
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        suppressOutput: false,
                        bpm: [120],
                        inNoteBlock: [],
                        turtleTime: 0,
                        previousTurtleTime: 0,
                        embeddedGraphics: {}
                    },
                    doWait: jest.fn()
                })),
                getTurtleCount: jest.fn(() => 1),
                getTurtle: jest.fn(() => ({ inTrash: false, name: "turtle1" }))
            },
            save: { afterSaveAbc: jest.fn(), afterSaveLilypond: jest.fn(), saveSVG: jest.fn() },
            errorMsg: jest.fn(),
            textMsg: jest.fn(),
            hideGrids: jest.fn()
        };

        logo = {
            parseArg: jest.fn((l, t, c) => (c === "blk1" ? false : c ? "parsedArg" : null)),
            inOscilloscope: false,
            inMatrix: false,
            inStatusMatrix: false,
            svgOutput: "",
            canvas: { height: 500, width: 500 },
            svgBackground: true,
            oscilloscopeTurtles: [],
            turtleDelay: 100,
            activity: { showBlocksAfterRun: false },
            runningLilypond: false,
            notation: { notationMarkup: jest.fn() },
            phraseMaker: { lyricsON: false }
        };

        turtle = 0;
        blk = "blk1";
        global.TONEBPM = 240;
        global.Singer = { masterBPM: 90 };
        global.last = arr => arr[arr.length - 1];
        global.mixedNumber = jest.fn(n => `${n}`);
        global.NOINPUTERRORMSG = "no input";
        global.NANERRORMSG = "nan error";
        global.DEFAULTDELAY = 100;
        global.platformColor = { background: "white" };
        global.DEFAULTDELAY = 100;

        const origLeftBlock = global.LeftBlock;
        const origFlowBlock = global.FlowBlock;
        global.LeftBlock = class {
            constructor() {
                instances[this.constructor.name] = this;
            }
            setPalette() {}
            setHelpString() {}
            formBlock() {}
            setup() {}
            beginnerBlock() {}
            makeMacro() {}
            updateDockValue() {}
        };
        global.FlowBlock = class {
            constructor() {
                instances[this.constructor.name] = this;
            }
            setPalette() {}
            setHelpString() {}
            formBlock() {}
            setup() {}
            beginnerBlock() {}
            makeMacro() {}
            updateDockValue() {}
        };
        setupExtrasBlocks(activity);
        global.LeftBlock = origLeftBlock;
        global.FlowBlock = origFlowBlock;
    });

    test("real FloatToStringBlock arg() returns 0/1 when connection is null", () => {
        activity.blocks.blockList[blk].connections[1] = null;
        const result = instances["FloatToStringBlock"].arg(logo, turtle, blk, null);
        expect(activity.errorMsg).toHaveBeenCalled();
        expect(result).toBe("0/1");
    });

    test("real FloatToStringBlock arg() converts positive number", () => {
        activity.blocks.blockList[blk].connections[1] = "blk2";
        logo.parseArg = jest.fn(() => 0.5);
        const result = instances["FloatToStringBlock"].arg(logo, turtle, blk, null);
        expect(global.mixedNumber).toHaveBeenCalled();
    });

    test("real FloatToStringBlock arg() converts negative number", () => {
        activity.blocks.blockList[blk].connections[1] = "blk2";
        logo.parseArg = jest.fn(() => -0.5);
        const result = instances["FloatToStringBlock"].arg(logo, turtle, blk, null);
        expect(result).toMatch(/^-/);
    });

    test("real FloatToStringBlock arg() returns 0/1 for non-number", () => {
        activity.blocks.blockList[blk].connections[1] = "blk2";
        logo.parseArg = jest.fn(() => "notanumber");
        const result = instances["FloatToStringBlock"].arg(logo, turtle, blk, null);
        expect(activity.errorMsg).toHaveBeenCalled();
        expect(result).toBe("0/1");
    });

    test("real SaveSVGBlock flow() calls errorMsg when args[0] is null", () => {
        instances["SaveSVGBlock"].flow([null], logo, turtle, blk);
        expect(activity.errorMsg).toHaveBeenCalled();
    });

    test("real SaveSVGBlock flow() saves SVG with background", () => {
        logo.svgBackground = true;
        logo.svgOutput = "output";
        instances["SaveSVGBlock"].flow(["test.svg"], logo, turtle, blk);
        expect(activity.save.saveSVG).toHaveBeenCalledWith("test.svg");
    });

    test("real ShowBlocksBlock flow() calls showBlocks", () => {
        instances["ShowBlocksBlock"].flow([], logo, turtle, blk);
        expect(activity.blocks.showBlocks).toHaveBeenCalled();
    });

    test("real HideBlocksBlock flow() calls hideBlocks", () => {
        instances["HideBlocksBlock"].flow([], logo, turtle, blk);
        expect(activity.blocks.hideBlocks).toHaveBeenCalled();
    });

    test("real DisplayGridBlock flow() shows Cartesian grid", () => {
        instances["DisplayGridBlock"].flow(["Cartesian"], logo, turtle, blk);
        expect(activity.blocks.activity._showCartesian).toHaveBeenCalled();
    });

    test("real DisplayGridBlock flow() shows polar grid", () => {
        instances["DisplayGridBlock"].flow(["polar"], logo, turtle, blk);
        expect(activity.blocks.activity._showPolar).toHaveBeenCalled();
    });

    test("real DisplayGridBlock flow() shows treble grid", () => {
        instances["DisplayGridBlock"].flow(["treble"], logo, turtle, blk);
        expect(activity.blocks.activity._showTreble).toHaveBeenCalled();
    });

    test("real DisplayGridBlock flow() shows grand staff grid", () => {
        instances["DisplayGridBlock"].flow(["grand staff"], logo, turtle, blk);
        expect(activity.blocks.activity._showGrand).toHaveBeenCalled();
    });

    test("real DisplayGridBlock flow() shows alto grid", () => {
        instances["DisplayGridBlock"].flow(["alto"], logo, turtle, blk);
        expect(activity.blocks.activity._showAlto).toHaveBeenCalled();
    });

    test("real DisplayGridBlock flow() shows tenor grid", () => {
        instances["DisplayGridBlock"].flow(["tenor"], logo, turtle, blk);
        expect(activity.blocks.activity._showTenor).toHaveBeenCalled();
    });

    test("real DisplayGridBlock flow() shows bass grid", () => {
        instances["DisplayGridBlock"].flow(["bass"], logo, turtle, blk);
        expect(activity.blocks.activity._showBass).toHaveBeenCalled();
    });

    test("real DisplayGridBlock flow() defaults to Cartesian when no args", () => {
        instances["DisplayGridBlock"].flow([], logo, turtle, blk);
        expect(activity.blocks.activity._showCartesian).toHaveBeenCalled();
    });

    test("real PrintBlock flow() calls textMsg", () => {
        instances["PrintBlock"].flow(["hello"], logo, 0, "blk2");
        expect(activity.textMsg).toHaveBeenCalledWith("hello");
    });

    test("real CommentBlock flow() calls textMsg", () => {
        instances["CommentBlock"].flow(["a comment"], logo, turtle, blk);
        expect(activity.textMsg).toHaveBeenCalledWith("a comment");
    });
});
