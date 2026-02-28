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

const { setupRhythmBlocks } = jest.requireActual("../RhythmBlocks");

global._ = s => s;
global.NOINPUTERRORMSG = "NO_INPUT";
global.DEFAULTDRUM = "kick";
global.mixedNumber = jest.fn(val => val);
global.i18nSolfege = jest.fn(val => val);
global.Singer = {
    RhythmActions: {
        getNoteValue: jest.fn(),
        playNote: jest.fn(),
        addSwing: jest.fn(),
        multiplyNoteValue: jest.fn(),
        doTie: jest.fn(),
        doRhythmicDot: jest.fn(),
        playRest: jest.fn()
    }
};
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
        this.dockTypes = [null, null, null];
    }
}

class ValueBlock extends BaseBlock {
    constructor(name, label) {
        super(name);
        this.label = label;
        this.parameter = false;
    }

    arg() {}
    updateParameter() {}
}

global.BaseBlock = BaseBlock;
global.FlowBlock = FlowBlock;
global.FlowClampBlock = FlowClampBlock;
global.ValueBlock = ValueBlock;

describe("RhythmBlocks", () => {
    let activity;
    let logo;
    let turtle;

    const makeTurtle = () => ({
        singer: {
            skipFactor: 0,
            swing: [],
            swingTarget: [],
            swingCarryOver: 0,
            beatFactor: 1,
            dotCount: 0,
            suppressOutput: false
        },
        parentFlowQueue: [],
        queue: []
    });

    beforeEach(() => {
        jest.clearAllMocks();

        turtle = makeTurtle();
        activity = {
            registeredBlocks: {},
            blocks: {
                blockList: {},
                palettes: {}
            },
            turtles: {
                ithTurtle: jest.fn(() => turtle),
                companionTurtle: jest.fn(() => 0)
            },
            errorMsg: jest.fn()
        };

        logo = {
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            inStatusMatrix: false,
            statusFields: []
        };

        setupRhythmBlocks(activity);
    });

    const getBlock = name => activity.registeredBlocks[name];

    describe("Block Registration", () => {
        test("registers all 24 rhythm blocks", () => {
            const expectedBlocks = [
                "mynotevalue",
                "skipfactor",
                "osctime",
                "swing",
                "newswing",
                "newswing2",
                "skipnotes",
                "multiplybeatfactor",
                "tie",
                "rhythmicdot",
                "rhythmicdot2",
                "rest2",
                "note4",
                "note3",
                "note5",
                "note7",
                "note8",
                "note6",
                "note2",
                "note1",
                "note",
                "newnote",
                "definefrequency",
                "octavespace"
            ];

            expectedBlocks.forEach(blockName => {
                expect(activity.registeredBlocks).toHaveProperty(blockName);
            });
        });

        test("all blocks have correct palette set", () => {
            Object.values(activity.registeredBlocks).forEach(block => {
                expect(block.palette).toBe("rhythm");
            });
        });
    });

    describe("MyNoteValueBlock", () => {
        test("returns note value", () => {
            global.Singer.RhythmActions.getNoteValue.mockReturnValue(0.25);
            activity.blocks.blockList[1] = { connections: [0] };

            const block = getBlock("mynotevalue");
            const result = block.arg(logo, 0, 1);

            expect(global.Singer.RhythmActions.getNoteValue).toHaveBeenCalledWith(0);
            expect(result).toBe(0.25);
        });

        test("pushes to status fields when in status matrix", () => {
            logo.inStatusMatrix = true;
            activity.blocks.blockList[1] = { connections: [2] };
            activity.blocks.blockList[2] = { name: "print" };

            const block = getBlock("mynotevalue");
            block.arg(logo, 0, 1);

            expect(logo.statusFields).toContainEqual([1, "mynotevalue"]);
        });
    });

    describe("SkipFactorBlock", () => {
        test("returns skip factor from turtle", () => {
            turtle.singer.skipFactor = 5;
            activity.blocks.blockList[1] = { connections: [0] };

            const block = getBlock("skipfactor");
            const result = block.arg(logo, 0, 1);

            expect(result).toBe(5);
        });
    });

    describe("MillisecondsBlock", () => {
        test("plays note with millisecond duration", () => {
            const block = getBlock("osctime");
            block.flow([200, true], logo, 0, 5, null);

            expect(global.Singer.RhythmActions.playNote).toHaveBeenCalledWith(
                200,
                "osctime",
                0,
                5,
                expect.any(Function)
            );
        });

        test("handles null input", () => {
            const block = getBlock("osctime");
            block.flow([null, true], logo, 0, 5, null);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 5);
        });

        test("handles non-number input", () => {
            const block = getBlock("osctime");
            block.flow(["text", true], logo, 0, 5, null);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 5);
        });

        test("handles negative value", () => {
            const block = getBlock("osctime");
            block.flow([-100, true], logo, 0, 5, null);

            expect(activity.errorMsg).toHaveBeenCalledWith("Note value must be greater than 0.", 5);
        });
    });

    describe("SwingBlock", () => {
        test("adds swing to turtle and sets up listener", () => {
            const block = getBlock("swing");
            const result = block.flow([32, true], logo, 0, 10);

            expect(turtle.singer.swing).toContain(32);
            expect(turtle.singer.swingTarget).toContainEqual(null);
            expect(turtle.singer.swingCarryOver).toBe(0);
            expect(logo.setDispatchBlock).toHaveBeenCalledWith(10, 0, "_swing_0");
            expect(logo.setTurtleListener).toHaveBeenCalledWith(
                0,
                "_swing_0",
                expect.any(Function)
            );
            expect(result).toEqual([true, 1]);
        });
    });

    describe("NewSwing2Block", () => {
        test("calls addSwing with valid arguments", () => {
            const block = getBlock("newswing2");
            block.flow([1 / 24, 1 / 8, true], logo, 0, 10);

            expect(global.Singer.RhythmActions.addSwing).toHaveBeenCalledWith(1 / 24, 1 / 8, 0, 10);
        });

        test("handles null swing value", () => {
            const block = getBlock("newswing2");
            block.flow([null, 1 / 8, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
            expect(global.Singer.RhythmActions.addSwing).toHaveBeenCalledWith(1 / 24, 1 / 8, 0, 10);
        });

        test("handles zero note value", () => {
            const block = getBlock("newswing2");
            block.flow([1 / 24, 0, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
            expect(global.Singer.RhythmActions.addSwing).toHaveBeenCalledWith(1 / 24, 1 / 8, 0, 10);
        });
    });

    describe("SkipNotesBlock", () => {
        test("increases skip factor", () => {
            turtle.singer.skipFactor = 0;
            const block = getBlock("skipnotes");
            block.flow([2, true], logo, 0, 10);

            expect(turtle.singer.skipFactor).toBe(2);
            expect(logo.setDispatchBlock).toHaveBeenCalledWith(10, 0, "_skip_0");
        });

        test("handles null skip value", () => {
            turtle.singer.skipFactor = 0;
            const block = getBlock("skipnotes");
            block.flow([null, true], logo, 0, 10);

            expect(turtle.singer.skipFactor).toBe(0);
        });
    });

    describe("MultiplyBeatFactorBlock", () => {
        test("calls multiplyNoteValue with valid factor", () => {
            const block = getBlock("multiplybeatfactor");
            block.flow([2, true], logo, 0, 10);

            expect(global.Singer.RhythmActions.multiplyNoteValue).toHaveBeenCalledWith(2, 0, 10);
        });

        test("handles null factor", () => {
            const block = getBlock("multiplybeatfactor");
            block.flow([null, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
            expect(global.Singer.RhythmActions.multiplyNoteValue).toHaveBeenCalledWith(2, 0, 10);
        });

        test("handles negative factor", () => {
            const block = getBlock("multiplybeatfactor");
            block.flow([-1, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
        });
    });

    describe("TieBlock", () => {
        test("calls doTie", () => {
            const block = getBlock("tie");
            block.flow([true], logo, 0, 10);

            expect(global.Singer.RhythmActions.doTie).toHaveBeenCalledWith(0, 10);
        });

        test("returns early if args undefined", () => {
            const block = getBlock("tie");
            const result = block.flow([undefined], logo, 0, 10);

            expect(result).toBeUndefined();
            expect(global.Singer.RhythmActions.doTie).not.toHaveBeenCalled();
        });
    });

    describe("RhythmicDot2Block", () => {
        test("calls doRhythmicDot with dot count", () => {
            const block = getBlock("rhythmicdot2");
            block.flow([2, true], logo, 0, 10);

            expect(global.Singer.RhythmActions.doRhythmicDot).toHaveBeenCalledWith(2, 0, 10);
        });

        test("handles null dot count", () => {
            const block = getBlock("rhythmicdot2");
            block.flow([null, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, 10);
            expect(global.Singer.RhythmActions.doRhythmicDot).toHaveBeenCalledWith(0, 0, 10);
        });
    });

    describe("Rest2Block", () => {
        test("plays rest", () => {
            const block = getBlock("rest2");
            block.flow([], logo, 0);

            expect(global.Singer.RhythmActions.playRest).toHaveBeenCalledWith(0);
        });
    });

    describe("Note Value Blocks", () => {
        test("note4 block is defined", () => {
            const block = getBlock("note4");
            expect(block).toBeDefined();
            expect(block.formDefn.args).toBe(1);
        });

        test("note macro blocks have empty flow", () => {
            const blocks = ["note1", "note2", "note3", "note4", "note5", "note6", "note7", "note8"];

            blocks.forEach(blockName => {
                const block = getBlock(blockName);
                expect(block).toBeDefined();
                expect(typeof block.flow).toBe("function");
                const result = block.flow();
                expect(result).toBeUndefined();
            });
        });
    });

    describe("Block Properties", () => {
        test("MillisecondsBlock has correct form", () => {
            const block = getBlock("osctime");
            expect(block.formDefn.args).toBe(1);
            expect(block.formDefn.defaults).toEqual([200]);
            expect(block.formDefn.canCollapse).toBe(true);
        });

        test("NewSwing2Block has correct form with labels", () => {
            const block = getBlock("newswing2");
            expect(block.formDefn.args).toBe(2);
            expect(block.formDefn.defaults).toEqual([1 / 24, 1 / 8]);
            expect(block.formDefn.argLabels).toEqual(["swing value", "note value"]);
        });

        test("TieBlock is beginner block", () => {
            const block = getBlock("tie");
            expect(block.isBeginner).toBe(true);
        });

        test("SwingBlock is deprecated", () => {
            const block = getBlock("swing");
            expect(block.deprecated).toBe(true);
            expect(block.hidden).toBe(true);
        });
    });

    describe("Edge Cases and Additional Coverage", () => {
        test("MultiplyBeatFactorBlock handles fractional factor", () => {
            const block = getBlock("multiplybeatfactor");
            block.flow([0.5, true], logo, 0, 10);

            expect(global.Singer.RhythmActions.multiplyNoteValue).toHaveBeenCalledWith(0.5, 0, 10);
        });

        test("RhythmicDotBlock handles single dot", () => {
            const block = getBlock("rhythmicdot");
            const result = block.flow([true], logo, 0, 10);

            // RhythmicDotBlock has internal implementation, not calling doRhythmicDot
            // It should return the expected tuple format
            expect(result).toEqual([true, 1]);
        });

        test("RhythmicDot2Block handles multiple dots", () => {
            const block = getBlock("rhythmicdot2");
            block.flow([3, true], logo, 0, 10);

            expect(global.Singer.RhythmActions.doRhythmicDot).toHaveBeenCalledWith(3, 0, 10);
        });

        test("NewNoteBlock registers correctly", () => {
            const block = getBlock("newnote");
            expect(block).toBeDefined();
            expect(block.formDefn).toBeDefined();
        });

        test("NoteBlock macros are defined", () => {
            const noteBlocks = [
                "note1",
                "note2",
                "note3",
                "note4",
                "note5",
                "note6",
                "note7",
                "note8"
            ];
            noteBlocks.forEach(blockName => {
                const block = getBlock(blockName);
                expect(block).toBeDefined();
                expect(block.macro).toBeDefined();
            });
        });

        test("OctaveSpaceBlock is defined", () => {
            const block = getBlock("octavespace");
            expect(block).toBeDefined();
        });

        test("DefineFrequencyBlock is defined", () => {
            const block = getBlock("definefrequency");
            expect(block).toBeDefined();
        });

        test("All rhythm blocks have proper palette assignment", () => {
            const rhythmBlockNames = [
                "mynotevalue",
                "skipfactor",
                "osctime",
                "swing",
                "newswing",
                "newswing2",
                "skipnotes",
                "multiplybeatfactor",
                "tie",
                "rhythmicdot",
                "rhythmicdot2",
                "rest2",
                "note",
                "newnote"
            ];

            rhythmBlockNames.forEach(blockName => {
                const block = activity.registeredBlocks[blockName];
                expect(block).toBeDefined();
                expect(block.palette).toBe("rhythm");
            });
        });

        test("Flow blocks return correct tuple format", () => {
            // newswing2 is excluded: it checks args[2] for undefined and returns early
            // when called with only [1, true]; it is covered by its own dedicated test.
            const flowBlocks = ["swing", "skipnotes", "multiplybeatfactor", "tie"];

            flowBlocks.forEach(blockName => {
                const block = getBlock(blockName);
                expect(block).toBeDefined();
                expect(typeof block.flow).toBe("function");
                const result = block.flow([1, true], logo, 0, 10);
                expect(result).toBeDefined();
                expect(Array.isArray(result)).toBe(true);
                expect(result.length).toBe(2);
            });
        });

        test("Rest2Block has correct palette and is beginner block", () => {
            const block = getBlock("rest2");
            expect(block).toBeDefined();
            expect(block.palette).toBe("rhythm");
            expect(block.isBeginner).toBe(true);
        });
    });
});
