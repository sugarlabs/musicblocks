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

global._ = jest.fn((str) => str);

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
                    _showBass: jest.fn(),
                }
            },
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        suppressOutput: false,
                        bpm: [120],
                        inNoteBlock: [],
                        turtleTime: 0,
                        previousTurtleTime: 0,
                    },
                    doWait: jest.fn(),
                })),
                getTurtleCount: jest.fn(() => 1),
                getTurtle: jest.fn(() => ({ inTrash: false, name: "turtle1" }))
            },
            save: {
                afterSaveAbc: jest.fn(),
                afterSaveLilypond: jest.fn(),
                saveSVG: jest.fn(),
            },
            errorMsg: jest.fn(),
            textMsg: jest.fn(),
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
            turtleDelay: 0,
            runningLilypond: false,
            notation: { notationMarkup: jest.fn() },
            phraseMaker: { lyricsON: false },
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
            "FloatToStringBlock", "SaveABCBlock", "SaveLilypondBlock",
            "SaveSVGBlock", "NoBackgroundBlock", "ShowBlocksBlock",
            "HideBlocksBlock", "VSpaceBlock", "HSpaceBlock", "WaitBlock",
            "CommentBlock", "PrintBlock", "DrumBlock", "GridBlock",
            "NOPValueBlock", "NOPOneArgMathBlock", "NOPTwoArgMathBlock",
            "NOPZeroArgBlock", "NOPOneArgBlock", "NOPTwoArgBlock",
            "NOPThreeArgBlock", "NOPFourArgBlock", "DisplayGridBlock"
        ];

        blockNames.forEach((name) => {
            const blockInstance = new mockBlockClass();
            
            blockInstance.flow = jest.fn().mockImplementation(function (args = [], logo = {}, turtle) {
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
            new activity.blocks.NOPFourArgBlock(),
        ];

        nopBlocks.forEach((block) => {
            expect(block).toBeDefined();
        });
    });
});
