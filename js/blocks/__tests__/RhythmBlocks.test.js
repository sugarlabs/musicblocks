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
            global.global.Singer.RhythmActions.getNoteValue.mockReturnValue(0.25);
            activity.blocks.blockList[1] = { connections: [0] };

            const block = getBlock("mynotevalue");
            const result = block.arg(logo, 0, 1);

            expect(global.global.Singer.RhythmActions.getNoteValue).toHaveBeenCalledWith(0);
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

            expect(global.global.Singer.RhythmActions.playNote).toHaveBeenCalledWith(
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

            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 5);
        });

        test("handles non-number input", () => {
            const block = getBlock("osctime");
            block.flow(["text", true], logo, 0, 5, null);

            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 5);
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

            expect(global.global.Singer.RhythmActions.addSwing).toHaveBeenCalledWith(
                1 / 24,
                1 / 8,
                0,
                10
            );
        });

        test("handles null swing value", () => {
            const block = getBlock("newswing2");
            block.flow([null, 1 / 8, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 10);
            expect(global.global.Singer.RhythmActions.addSwing).toHaveBeenCalledWith(
                1 / 24,
                1 / 8,
                0,
                10
            );
        });

        test("handles zero note value", () => {
            const block = getBlock("newswing2");
            block.flow([1 / 24, 0, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 10);
            expect(global.global.Singer.RhythmActions.addSwing).toHaveBeenCalledWith(
                1 / 24,
                1 / 8,
                0,
                10
            );
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

            expect(global.global.Singer.RhythmActions.multiplyNoteValue).toHaveBeenCalledWith(
                2,
                0,
                10
            );
        });

        test("handles null factor", () => {
            const block = getBlock("multiplybeatfactor");
            block.flow([null, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 10);
            expect(global.global.Singer.RhythmActions.multiplyNoteValue).toHaveBeenCalledWith(
                2,
                0,
                10
            );
        });

        test("handles negative factor", () => {
            const block = getBlock("multiplybeatfactor");
            block.flow([-1, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 10);
        });
    });

    describe("TieBlock", () => {
        test("calls doTie", () => {
            const block = getBlock("tie");
            block.flow([true], logo, 0, 10);

            expect(global.global.Singer.RhythmActions.doTie).toHaveBeenCalledWith(0, 10);
        });

        test("returns early if args undefined", () => {
            const block = getBlock("tie");
            const result = block.flow([undefined], logo, 0, 10);

            expect(result).toBeUndefined();
            expect(global.global.Singer.RhythmActions.doTie).not.toHaveBeenCalled();
        });
    });

    describe("RhythmicDot2Block", () => {
        test("calls doRhythmicDot with dot count", () => {
            const block = getBlock("rhythmicdot2");
            block.flow([2, true], logo, 0, 10);

            expect(global.global.Singer.RhythmActions.doRhythmicDot).toHaveBeenCalledWith(2, 0, 10);
        });

        test("handles null dot count", () => {
            const block = getBlock("rhythmicdot2");
            block.flow([null, true], logo, 0, 10);

            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 10);
            expect(global.global.Singer.RhythmActions.doRhythmicDot).toHaveBeenCalledWith(0, 0, 10);
        });
    });

    describe("Rest2Block", () => {
        test("plays rest", () => {
            const block = getBlock("rest2");
            block.flow([], logo, 0);

            expect(global.global.Singer.RhythmActions.playRest).toHaveBeenCalledWith(0);
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
    describe("MyNoteValueBlock", () => {
        test("updateParameter returns mixedNumber of block value", () => {
            activity.blocks.blockList[0] = { value: 4 };
            const block = getBlock("mynotevalue");
            const result = block.updateParameter(logo, 0, 0);
            expect(result).toBe(4);
        });

        test("arg pushes to statusFields when inStatusMatrix and parent is print", () => {
            activity.blocks.blockList[0] = {
                connections: [1],
                value: 4
            };
            activity.blocks.blockList[1] = { name: "print" };
            logo.inStatusMatrix = true;
            const block = getBlock("mynotevalue");
            block.arg(logo, 0, 0);
            expect(logo.statusFields).toContainEqual([0, "beat"]);
        });
    });

    describe("SkipFactorBlock", () => {
        test("updateParameter returns block value directly", () => {
            activity.blocks.blockList[0] = { value: 2 };
            const block = getBlock("skipfactor");
            const result = block.updateParameter(logo, 0, 0);
            expect(result).toBe(2);
        });

        test("arg returns skipFactor when not in statusMatrix", () => {
            activity.blocks.blockList[0] = { connections: [null] };
            logo.inStatusMatrix = false;
            turtle.singer.skipFactor = 3;
            const block = getBlock("skipfactor");
            const result = block.arg(logo, 0, 0);
            expect(result).toBe(3);
        });

        test("arg pushes to statusFields when inStatusMatrix and parent is print", () => {
            activity.blocks.blockList[0] = { connections: [1] };
            activity.blocks.blockList[1] = { name: "print" };
            logo.inStatusMatrix = true;
            const block = getBlock("skipfactor");
            block.arg(logo, 0, 0);
            expect(logo.statusFields).toContainEqual([0, "skip"]);
        });
    });

    describe("OscTimeBlock", () => {
        test("flow calls playNote with callback that queues block", () => {
            const block = getBlock("osctime");
            block.flow([0.25, 1], logo, 0, 5, null);
            expect(global.Singer.RhythmActions.playNote).toHaveBeenCalledWith(
                0.25,
                "osctime",
                0,
                5,
                expect.any(Function)
            );
        });

        test("flow uses default value when arg is null", () => {
            const block = getBlock("osctime");
            block.flow([null, 1], logo, 0, 5, null);
            expect(global.Singer.RhythmActions.playNote).toHaveBeenCalledWith(
                0.25,
                "osctime",
                0,
                5,
                expect.any(Function)
            );
        });
    });

    describe("NewSwingBlock", () => {
        test("flow pushes swing values and sets listeners", () => {
            const block = getBlock("newswing");
            block.flow([24, 1], logo, 0, 5);
            expect(turtle.singer.swing.length).toBe(1);
            expect(turtle.singer.swingTarget).toContain(null);
            expect(logo.setDispatchBlock).toHaveBeenCalled();
            expect(logo.setTurtleListener).toHaveBeenCalled();
        });
    });

    describe("NewSwing2Block", () => {
        test("flow pushes swing values and sets listeners", () => {
            const block = getBlock("newswing2");
            block.flow([1 / 24, 1 / 12, 1], logo, 0, 5);
            expect(turtle.singer.swing.length).toBe(1);
            expect(logo.setDispatchBlock).toHaveBeenCalled();
            expect(logo.setTurtleListener).toHaveBeenCalled();
        });
    });

    describe("SkipNotesBlock", () => {
        test("flow increments skipFactor and sets listener", () => {
            const block = getBlock("skipnotes");
            block.flow([2, 1], logo, 0, 5);
            expect(turtle.singer.skipFactor).toBe(2);
            expect(logo.setDispatchBlock).toHaveBeenCalled();
            expect(logo.setTurtleListener).toHaveBeenCalled();
        });

        test("flow handles null arg as 0", () => {
            const block = getBlock("skipnotes");
            block.flow([null, 1], logo, 0, 5);
            expect(turtle.singer.skipFactor).toBe(0);
        });
    });

    describe("RhythmicDot2Block", () => {
        test("flow calls errorMsg when arg is null", () => {
            const block = getBlock("rhythmicdot2");
            block.flow([null, 1], logo, 0, 5);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 5);
        });

        test("flow sets dispatch and listener and returns args", () => {
            const block = getBlock("rhythmicdot2");
            const result = block.flow([0.25, 1], logo, 0, 5);
            expect(logo.setDispatchBlock).toHaveBeenCalled();
            expect(logo.setTurtleListener).toHaveBeenCalled();
            expect(result).toEqual([0.25, 1]);
        });
    });

    describe("NoteBlock", () => {
        test("flow returns undefined when args[1] is undefined", () => {
            const block = getBlock("note");
            const result = block.flow([0.25], logo, 0, 5, null);
            expect(result).toBeUndefined();
        });

        test("flow calls errorMsg when arg is null", () => {
            const block = getBlock("note");
            block.flow([null, 1], logo, 0, 5, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 5);
        });

        test("flow calls errorMsg when arg <= 0", () => {
            const block = getBlock("note");
            block.flow([-1, 1], logo, 0, 5, null);
            expect(activity.errorMsg).toHaveBeenCalled();
        });

        test("flow calls playNote with correct value", () => {
            const block = getBlock("note");
            block.flow([0.5, 1], logo, 0, 5, null);
            expect(global.Singer.RhythmActions.playNote).toHaveBeenCalledWith(
                0.5,
                "note",
                0,
                5,
                expect.any(Function)
            );
        });
    });

    describe("NewNoteBlock", () => {
        test("flow returns undefined when args[1] is undefined", () => {
            const block = getBlock("newnote");
            const result = block.flow([0.25], logo, 0, 5, null);
            expect(result).toBeUndefined();
        });

        test("flow calls errorMsg when arg is null", () => {
            const block = getBlock("newnote");
            block.flow([null, 1], logo, 0, 5, null);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 5);
        });

        test("flow calls errorMsg when arg <= 0", () => {
            const block = getBlock("newnote");
            block.flow([-1, 1], logo, 0, 5, null);
            expect(activity.errorMsg).toHaveBeenCalled();
        });

        test("flow calls playNote and handles inNoteBlock", () => {
            turtle.singer.inNoteBlock = [1];
            turtle.singer.delayedNotes = [];
            const block = getBlock("newnote");
            block.flow([0.5, 1], logo, 0, 5, null);
            expect(turtle.singer.delayedNotes).toContainEqual([5, 0.5]);
            expect(global.Singer.RhythmActions.playNote).toHaveBeenCalled();
        });

        test("flow calls playNote when inNoteBlock is empty", () => {
            turtle.singer.inNoteBlock = [];
            const block = getBlock("newnote");
            block.flow([0.5, 1], logo, 0, 5, null);
            expect(global.Singer.RhythmActions.playNote).toHaveBeenCalledWith(
                0.5,
                "newnote",
                0,
                5,
                expect.any(Function)
            );
        });
    });

    describe("Callback and listener body coverage", () => {
        test("OscTimeBlock callback pushes to queue", () => {
            let capturedCallback;
            global.Singer.RhythmActions.playNote.mockImplementation((v, t, turtle, blk, cb) => {
                capturedCallback = cb;
            });
            const block = getBlock("osctime");
            block.flow([0.25, 1], logo, 0, 5, null);
            capturedCallback();
            expect(turtle.parentFlowQueue).toContain(5);
            expect(turtle.queue.length).toBe(1);
        });

        test("NewSwingBlock listener fires and pops swing when not suppressed", () => {
            let capturedListener;
            logo.setTurtleListener.mockImplementation((t, name, fn) => {
                capturedListener = fn;
            });
            const block = getBlock("newswing");
            block.flow([24, 1], logo, 0, 5);
            turtle.singer.suppressOutput = false;
            turtle.singer.swing.push(1);
            turtle.singer.swingTarget.push(null);
            capturedListener({});
            expect(turtle.singer.swing.length).toBe(0);
            expect(turtle.singer.swingCarryOver).toBe(0);
        });

        test("NewSwingBlock listener does not pop when suppressed", () => {
            let capturedListener;
            logo.setTurtleListener.mockImplementation((t, name, fn) => {
                capturedListener = fn;
            });
            const block = getBlock("newswing");
            block.flow([24, 1], logo, 0, 5);
            turtle.singer.suppressOutput = true;
            turtle.singer.swing.push(1);
            turtle.singer.swingTarget.push(null);
            capturedListener({});
            expect(turtle.singer.swing.length).toBe(1);
        });

        test("NewSwing2Block listener fires and pops swing when not suppressed", () => {
            let capturedListener;
            logo.setTurtleListener.mockImplementation((t, name, fn) => {
                capturedListener = fn;
            });
            const block = getBlock("newswing2");
            block.flow([1 / 24, 1 / 12, 1], logo, 0, 5);
            turtle.singer.suppressOutput = false;
            turtle.singer.swing.push(1);
            turtle.singer.swingTarget.push(null);
            capturedListener({});
            expect(turtle.singer.swing.length).toBe(0);
            expect(turtle.singer.swingCarryOver).toBe(0);
        });

        test("SkipNotesBlock listener decrements skipFactor", () => {
            let capturedListener;
            logo.setTurtleListener.mockImplementation((t, name, fn) => {
                capturedListener = fn;
            });
            const block = getBlock("skipnotes");
            block.flow([2, 1], logo, 0, 5);
            capturedListener({});
            expect(turtle.singer.skipFactor).toBe(0);
        });

        test("RhythmicDot2Block listener updates beatFactor and dotCount", () => {
            let capturedListener;
            logo.setTurtleListener.mockImplementation((t, name, fn) => {
                capturedListener = fn;
            });
            turtle.singer.dotCount = 0;
            turtle.singer.beatFactor = 1;
            const block = getBlock("rhythmicdot2");
            block.flow([0.25, 1], logo, 0, 5);
            capturedListener({});
            expect(turtle.singer.dotCount).toBeDefined();
        });

        test("NoteBlock callback pushes to queue", () => {
            let capturedCallback;
            global.Singer.RhythmActions.playNote.mockImplementation((v, t, turtle, blk, cb) => {
                capturedCallback = cb;
            });
            const block = getBlock("note");
            block.flow([0.5, 1], logo, 0, 5, null);
            capturedCallback();
            expect(turtle.parentFlowQueue).toContain(5);
            expect(turtle.queue.length).toBe(1);
        });

        test("NewNoteBlock callback pushes to queue", () => {
            let capturedCallback;
            global.Singer.RhythmActions.playNote.mockImplementation((v, t, turtle, blk, cb) => {
                capturedCallback = cb;
            });
            turtle.singer.inNoteBlock = [];
            const block = getBlock("newnote");
            block.flow([0.5, 1], logo, 0, 5, null);
            capturedCallback();
            expect(turtle.parentFlowQueue).toContain(5);
            expect(turtle.queue.length).toBe(1);
        });

        test("NewSwing2Block listener fires and pops swing when not suppressed", () => {
            let capturedListener;
            logo.setTurtleListener.mockImplementation((t, name, fn) => {
                capturedListener = fn;
            });
            const block = getBlock("newswing2");
            block.flow([1 / 24, 1 / 12, 1], logo, 0, 5);
            turtle.singer.suppressOutput = false;
            turtle.singer.swing.push(1);
            turtle.singer.swingTarget.push(null);
            capturedListener({});
            expect(turtle.singer.swing.length).toBe(0);
            expect(turtle.singer.swingCarryOver).toBe(0);
        });

        test("RhythmicDotBlock flow and listener update beatFactor", () => {
            let capturedListener;
            logo.setTurtleListener.mockImplementation((t, name, fn) => {
                capturedListener = fn;
            });
            turtle.singer.dotCount = 0;
            turtle.singer.beatFactor = 1;
            const block = getBlock("rhythmicdot");
            const result = block.flow([0.25, 1], logo, 0, 5);
            expect(logo.setDispatchBlock).toHaveBeenCalled();
            expect(result).toEqual([0.25, 1]);
            capturedListener({});
            expect(turtle.singer.dotCount).toBeDefined();
        });

        test("RhythmicDotBlock calls errorMsg when arg is null", () => {
            const block = getBlock("rhythmicdot");
            block.flow([null, 1], logo, 0, 5);
            expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 5);
        });
    });
});
