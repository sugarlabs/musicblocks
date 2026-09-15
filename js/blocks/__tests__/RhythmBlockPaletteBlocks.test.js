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

global._ = jest.fn(str => str);
global._THIS_IS_TURTLE_BLOCKS_ = false;
global.DEFAULTDRUM = "drum";

const { setupRhythmBlockPaletteBlocks } = require("../RhythmBlockPaletteBlocks");
const ManagedTimer = require("../../utils/ManagedTimer");

class DummyFlowBlock {
    constructor(name, displayName) {
        this.name = name;
        this.displayName = displayName;
        DummyFlowBlock.createdBlocks[name] = this;
    }
    setPalette(palette, activity) {
        this.palette = palette;
        return this;
    }
    beginnerBlock(flag) {
        this.isBeginner = flag;
        return this;
    }
    setHelpString(helpArray) {
        this.help = helpArray;
        return this;
    }
    formBlock(params) {
        this.blockParams = params;
        return this;
    }
    makeMacro(macroFunc) {
        this.macro = macroFunc;
        return this;
    }
    setup(activity) {
        return this;
    }
}
DummyFlowBlock.createdBlocks = {};

class DummyFlowClampBlock extends DummyFlowBlock {}
class DummyLeftBlock extends DummyFlowBlock {}

global.FlowBlock = DummyFlowBlock;
global.FlowClampBlock = DummyFlowClampBlock;
global.LeftBlock = DummyLeftBlock;

global.last = arr => arr[arr.length - 1];
global.NOINPUTERRORMSG = "No input provided";
global.TONEBPM = 120;
global._THIS_IS_MUSIC_BLOCKS_ = true;
global.rhythmBlockPalette = "widgets";

global.localStorage = { languagePreference: "en" };

global.Singer = {
    processNote: jest.fn((activity, beat, flag, blk, turtle, callback) => {
        if (callback) callback();
    }),
    masterBPM: 100,
    bpm: [100]
};

global.isAppleBrowser = jest.fn(() => false);

function createDummyTurtle() {
    return {
        id: "T1",
        container: { x: 50, y: 100, visible: true },
        singer: {
            beatFactor: 1,
            bpm: [100],
            drumStyle: [],
            inNoteBlock: [],
            notePitches: {},
            noteOctaves: {},
            noteCents: {}
        },
        doWait: jest.fn()
    };
}

const dummyActivity = {
    errorMsg: jest.fn(),
    textMsg: jest.fn(),
    blocks: { blockList: {} },
    refreshCanvas: jest.fn()
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
    inMatrix: false,
    tuplet: false,
    tupletParams: [],
    tupletRhythms: [],
    phraseMaker: { addColBlock: jest.fn() },
    clearNoteParams: jest.fn(),
    clearTurtleRun: jest.fn(),
    setDispatchBlock: jest.fn(),
    setTurtleListener: jest.fn(),
    addingNotesToTuplet: false,
    _currentDrumBlock: "dummyDrum"
};

describe("setupRhythmBlockPaletteBlocks", () => {
    let activity, logo, turtleIndex;

    beforeEach(() => {
        DummyFlowBlock.createdBlocks = {};
        dummyActivity.errorMsg.mockClear();
        dummyActivity.textMsg.mockClear();
        Singer.processNote = jest.fn((act, beat, flag, blk, turtle, callback) => {
            if (callback) callback();
        });
        dummyActivity.blocks.blockList = {};
        dummyActivity.turtles.turtleObjs = {};
        activity = dummyActivity;
        logo = { ...dummyLogo };
        activity.logo = logo;
        turtleIndex = 0;
        setupRhythmBlockPaletteBlocks(activity);
    });

    describe("RhythmBlock", () => {
        it("should call errorMsg and use defaults if arguments are invalid", () => {
            const rhythmBlock = DummyFlowBlock.createdBlocks["rhythm"];
            activity.blocks.blockList["blkRhythm"] = { name: "rhythm", connections: [] };
            rhythmBlock.flow([null, null], logo, turtleIndex, "blkRhythm");
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", "blkRhythm");
        });

        it("should process rhythm in matrix mode", () => {
            const rhythmBlock = DummyFlowBlock.createdBlocks["rhythm"];
            logo.inMatrix = true;
            activity.blocks.blockList["blkRhythm"] = { name: "rhythm", connections: [] };
            logo.phraseMaker.addColBlock = jest.fn();
            rhythmBlock.flow([4, 0.25], logo, turtleIndex, "blkRhythm");
            expect(logo.phraseMaker.addColBlock).toHaveBeenCalledWith("blkRhythm", 4);
            expect(Singer.processNote).toHaveBeenCalledTimes(4);
        });

        it("cancels scheduled notes when Logo stops", () => {
            jest.useFakeTimers();

            const rhythmBlock = DummyFlowBlock.createdBlocks["rhythm"];
            logo._timerManager = new ManagedTimer();
            logo.stopTurtle = false;
            activity.blocks.blockList["blkRhythm"] = { name: "rhythm", connections: [] };

            rhythmBlock.flow([4, 0.25], logo, turtleIndex, "blkRhythm");
            expect(logo._timerManager.activeTimeoutCount).toBe(4);

            logo.stopTurtle = true;
            logo._timerManager.clearAll();
            jest.runAllTimers();

            expect(Singer.processNote).not.toHaveBeenCalled();
            jest.useRealTimers();
        });

        it("should process rhythm inside tuplet with legacy non-object state", () => {
            const rhythmBlock = DummyFlowBlock.createdBlocks["rhythm"];
            logo.inMatrix = false;
            logo.tuplet = true;
            logo.addingNotesToTuplet = false;
            logo.tupletParams = [[1, 0.5]];
            logo.tupletRhythms = [];
            activity.blocks.blockList["blkRhythm"] = { name: "rhythm", connections: [] };

            rhythmBlock.flow([2, 0.25], logo, turtleIndex, "blkRhythm");

            expect(logo.addingNotesToTuplet).toBe(true);
            expect(logo.tupletRhythms).toEqual([["notes", 0, 0.25, 0.25]]);
        });
    });

    describe("Rhythm2Block", () => {
        it("should have extraWidth of 10 and be hidden", () => {
            const rhythm2Block = DummyFlowBlock.createdBlocks["rhythm2"];
            expect(rhythm2Block.extraWidth).toEqual(10);
            expect(rhythm2Block.hidden).toBe(true);
        });
    });

    describe("SixtyFourthNoteBlock", () => {
        it("should be defined and have displayName containing '1/64 note'", () => {
            const sixtyFourthNoteBlock = DummyFlowBlock.createdBlocks["sixtyfourthNote"];
            expect(sixtyFourthNoteBlock).toBeDefined();
            expect(sixtyFourthNoteBlock.displayName).toContain("1/64 note");
        });
    });

    describe("ThirtySecondNoteBlock", () => {
        it("should be defined and have a macro function", () => {
            const thirtySecondNoteBlock = DummyFlowBlock.createdBlocks["thirtysecondNote"];
            expect(thirtySecondNoteBlock).toBeDefined();
            expect(typeof thirtySecondNoteBlock.macro).toEqual("function");
        });
    });

    describe("SixteenthNoteBlock", () => {
        it("should be defined", () => {
            const sixteenthNoteBlock = DummyFlowBlock.createdBlocks["sixteenthNote"];
            expect(sixteenthNoteBlock).toBeDefined();
        });
    });

    describe("EighthNoteBlock", () => {
        it("should be defined", () => {
            const eighthNoteBlock = DummyFlowBlock.createdBlocks["eighthNote"];
            expect(eighthNoteBlock).toBeDefined();
        });
    });

    describe("QuarterNoteBlock", () => {
        it("should be defined", () => {
            const quarterNoteBlock = DummyFlowBlock.createdBlocks["quarterNote"];
            expect(quarterNoteBlock).toBeDefined();
        });
    });

    describe("HalfNoteBlock", () => {
        it("should be defined", () => {
            const halfNoteBlock = DummyFlowBlock.createdBlocks["halfNote"];
            expect(halfNoteBlock).toBeDefined();
        });
    });

    describe("WholeNoteBlock", () => {
        it("should be defined", () => {
            const wholeNoteBlock = DummyFlowBlock.createdBlocks["wholeNote"];
            expect(wholeNoteBlock).toBeDefined();
        });
    });

    describe("Tuplet2Block", () => {
        it("should push tuplet parameters and set dispatch in matrix mode", () => {
            logo.inMatrix = true;
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkTuplet2"] = { name: "tuplet2" };
            const tuplet2Block = DummyFlowBlock.createdBlocks["tuplet2"];
            logo.tupletParams = [];
            const ret = tuplet2Block.flow([3, 4, 99], logo, turtleIndex, "blkTuplet2");
            expect(logo.tupletParams.length).toEqual(1);
            expect(ret).toEqual([99, 1]);
            expect(logo.setDispatchBlock).toHaveBeenCalled();
            expect(logo.setTurtleListener).toHaveBeenCalled();
        });
    });

    describe("Tuplet3Block", () => {
        it("should behave like Tuplet2Block and be hidden", () => {
            logo.inMatrix = true;
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkTuplet3"] = { name: "tuplet3" };
            const tuplet3Block = DummyFlowBlock.createdBlocks["tuplet3"];
            logo.tupletParams = [];
            const ret = tuplet3Block.flow([2, 8, 77], logo, turtleIndex, "blkTuplet3");
            expect(logo.tupletParams.length).toEqual(1);
            expect(ret).toEqual([77, 1]);
            expect(tuplet3Block.hidden).toBe(true);
        });
    });

    describe("Tuplet4Block", () => {
        it("should return undefined if second argument is undefined", () => {
            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            const ret = tuplet4Block.flow([1, undefined], logo, turtleIndex, "blkTuplet4");
            expect(ret).toBeUndefined();
        });
        it("should call errorMsg and use default when first argument is invalid", () => {
            activity.blocks.blockList["blkTuplet4_invalid"] = { name: "tuplet4" };
            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            tuplet4Block.flow([null, 4], logo, turtleIndex, "blkTuplet4_invalid");
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "No input provided",
                "blkTuplet4_invalid"
            );
        });
        it("should process tuplet in non-matrix mode", () => {
            logo.inMatrix = false;
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkTuplet4"] = { name: "tuplet4" };
            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            const ret = tuplet4Block.flow([2, 4, 88], logo, turtleIndex, "blkTuplet4");
            expect(logo.tupletParams.length).toBeGreaterThan(0);
            expect(logo.setDispatchBlock).toHaveBeenCalled();
            expect(logo.setTurtleListener).toHaveBeenCalled();
            expect(ret).toEqual([4, 1]);
        });
        it("should not throw ReferenceError for totalBeats when the dispatch listener runs", () => {
            logo.inMatrix = false;
            logo.tupletRhythms = [["notes", 0, 4, 4]];
            logo.tupletParams = [[1, 1]];
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkTuplet4"] = { name: "tuplet4" };

            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            tuplet4Block.flow([2, 4, 88], logo, turtleIndex, "blkTuplet4");

            const listener = logo.setTurtleListener.mock.calls[0][2];

            expect(() => listener()).not.toThrow();
            expect(turtle.doWait).toHaveBeenCalled();
        });
        it("should isolate tuplet state across concurrent turtles without wiping in-progress data", () => {
            logo.inMatrix = false;
            logo.tuplet = {};
            logo.tupletParams = {};
            logo.tupletRhythms = {};
            logo.addingNotesToTuplet = {};

            const turtle0 = activity.turtles.ithTurtle(0);
            turtle0.singer.beatFactor = 1;
            const turtle1 = activity.turtles.ithTurtle(1);
            turtle1.singer.beatFactor = 1;

            activity.blocks.blockList["blkTuplet4_0"] = { name: "tuplet4" };
            activity.blocks.blockList["blkTuplet4_1"] = { name: "tuplet4" };
            activity.blocks.blockList["blkRhythm0"] = { name: "rhythm2" };
            activity.blocks.blockList["blkRhythm1"] = { name: "rhythm2" };

            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            const rhythm2Block = DummyFlowBlock.createdBlocks["rhythm2"];

            // 1. Turtle 0 enters Tuplet4Block (duration 1/2)
            tuplet4Block.flow([2, 4, 88], logo, 0, "blkTuplet4_0");
            expect(logo.tuplet[0]).toBe(true);
            expect(logo.tupletParams[0]).toEqual([[1, 0.5]]);

            // 2. Turtle 0 runs an internal rhythm block before yielding
            rhythm2Block.flow([2, 8], logo, 0, "blkRhythm0");
            expect(logo.tupletRhythms[0]).toEqual([["notes", 0, 1 / 8, 1 / 8]]);
            expect(logo.addingNotesToTuplet[0]).toBe(true);

            // 3. Turtle 1 enters its own Tuplet4Block concurrently (duration 1/4)
            tuplet4Block.flow([4, 4, 99], logo, 1, "blkTuplet4_1");
            expect(logo.tuplet[1]).toBe(true);
            expect(logo.tupletParams[1]).toEqual([[1, 0.25]]);

            // Assert turtle 0's tuplet state survived turtle 1's entry
            expect(logo.tuplet[0]).toBe(true);
            expect(logo.tupletParams[0]).toEqual([[1, 0.5]]);
            expect(logo.tupletRhythms[0]).toEqual([["notes", 0, 1 / 8, 1 / 8]]);
            expect(logo.addingNotesToTuplet[0]).toBe(true);

            // 4. Turtle 1 runs an internal rhythm block
            rhythm2Block.flow([2, 16], logo, 1, "blkRhythm1");
            expect(logo.tupletRhythms[1]).toEqual([["notes", 0, 1 / 16, 1 / 16]]);
            expect(logo.addingNotesToTuplet[1]).toBe(true);

            expect(Singer.processNote).toHaveBeenCalledWith(
                activity,
                1 / 8,
                false,
                "blkRhythm0",
                0
            );
            expect(Singer.processNote).toHaveBeenCalledWith(
                activity,
                1 / 16,
                false,
                "blkRhythm1",
                1
            );

            // 5. Turtle 0's clamp ends and its dispatch listener runs
            const listener0 = logo.setTurtleListener.mock.calls.find(call => call[0] === 0)[2];
            listener0();

            // Turtle 0's state reset, but Turtle 1 is STILL inside its clamp
            expect(logo.tuplet[0]).toBe(false);
            expect(logo.addingNotesToTuplet[0]).toBe(false);
            expect(logo.tuplet[1]).toBe(true);
            expect(logo.addingNotesToTuplet[1]).toBe(true);
            expect(turtle0.doWait).toHaveBeenCalledWith(1.2);

            // 6. Turtle 1 finishes its clamp and its listener runs
            const listener1 = logo.setTurtleListener.mock.calls.find(call => call[0] === 1)[2];
            listener1();

            expect(logo.tuplet[1]).toBe(false);
            expect(logo.addingNotesToTuplet[1]).toBe(false);
            expect(turtle1.doWait).toHaveBeenCalledWith(2.4);
        });
        it("should isolate tuplet state when turtle 1 finishes before turtle 0 (reverse interleaving)", () => {
            logo.inMatrix = false;
            logo.tuplet = {};
            logo.tupletParams = {};
            logo.tupletRhythms = {};
            logo.addingNotesToTuplet = {};

            const turtle0 = activity.turtles.ithTurtle(0);
            turtle0.singer.beatFactor = 1;
            turtle0.doWait.mockClear();
            const turtle1 = activity.turtles.ithTurtle(1);
            turtle1.singer.beatFactor = 1;
            turtle1.doWait.mockClear();

            activity.blocks.blockList["blkTuplet4_0"] = { name: "tuplet4" };
            activity.blocks.blockList["blkTuplet4_1"] = { name: "tuplet4" };
            activity.blocks.blockList["blkRhythm0"] = { name: "rhythm2" };
            activity.blocks.blockList["blkRhythm1"] = { name: "rhythm2" };

            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            const rhythm2Block = DummyFlowBlock.createdBlocks["rhythm2"];

            // Turtle 0 enters Tuplet4Block
            tuplet4Block.flow([2, 4, 88], logo, 0, "blkTuplet4_0");
            rhythm2Block.flow([2, 8], logo, 0, "blkRhythm0");

            // Turtle 1 enters Tuplet4Block
            tuplet4Block.flow([4, 4, 99], logo, 1, "blkTuplet4_1");
            rhythm2Block.flow([2, 16], logo, 1, "blkRhythm1");

            expect(Singer.processNote).toHaveBeenCalledWith(
                activity,
                1 / 8,
                false,
                "blkRhythm0",
                0
            );
            expect(Singer.processNote).toHaveBeenCalledWith(
                activity,
                1 / 16,
                false,
                "blkRhythm1",
                1
            );

            // Reverse interleaving: Turtle 1 finishes FIRST
            const listener1 = logo.setTurtleListener.mock.calls.find(call => call[0] === 1)[2];
            listener1();

            // Turtle 1 state reset, but Turtle 0 is STILL inside its clamp
            expect(logo.tuplet[1]).toBe(false);
            expect(logo.addingNotesToTuplet[1]).toBe(false);
            expect(turtle1.doWait).toHaveBeenCalledWith(2.4);
            expect(turtle0.doWait).not.toHaveBeenCalled();

            expect(logo.tuplet[0]).toBe(true);
            expect(logo.addingNotesToTuplet[0]).toBe(true);
            expect(logo.tupletParams[0]).toEqual([[1, 0.5]]);
            expect(logo.tupletRhythms[0]).toEqual([["notes", 0, 1 / 8, 1 / 8]]);

            // Turtle 0 finishes SECOND
            const listener0 = logo.setTurtleListener.mock.calls.find(call => call[0] === 0)[2];
            listener0();

            expect(logo.tuplet[0]).toBe(false);
            expect(logo.addingNotesToTuplet[0]).toBe(false);
            expect(turtle0.doWait).toHaveBeenCalledWith(1.2);
        });
        it("should not duplicate tupletRhythms when rhythm block runs inside LEGO tuplet", () => {
            logo.inLegoWidget = true;
            logo.inMatrix = false;
            logo.tuplet = {};
            logo.tupletParams = {};
            logo.tupletRhythms = {};
            logo.addingNotesToTuplet = {};

            const turtle0 = activity.turtles.ithTurtle(0);
            turtle0.singer.beatFactor = 1;
            turtle0.doWait.mockClear();

            activity.blocks.blockList["blkTuplet4_lego"] = { name: "tuplet4" };
            activity.blocks.blockList["blkRhythm_lego"] = { name: "rhythm2" };

            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            const rhythm2Block = DummyFlowBlock.createdBlocks["rhythm2"];

            tuplet4Block.flow([2, 4, 88], logo, 0, "blkTuplet4_lego");
            rhythm2Block.flow([2, 8], logo, 0, "blkRhythm_lego");

            // Verify only two entries are recorded, without duplicate note values
            expect(logo.tupletRhythms[0]).toEqual([["notes", 0, 1 / 8, 1 / 8]]);

            const listener = logo.setTurtleListener.mock.calls.find(call => call[0] === 0)[2];
            listener();

            // Duration is computed correctly from two note values (1.2 beats, not duplicated/distorted)
            expect(turtle0.doWait).toHaveBeenCalledWith(1.2);
            expect(logo.tuplet[0]).toBe(false);
            expect(logo.addingNotesToTuplet[0]).toBe(false);
        });
        it("should record tupletRhythms when STupletBlock runs inside LEGO tuplet", () => {
            logo.inLegoWidget = true;
            logo.inMatrix = false;
            logo.tuplet = {};
            logo.tupletParams = {};
            logo.tupletRhythms = {};
            logo.addingNotesToTuplet = {};

            const turtle0 = activity.turtles.ithTurtle(0);
            turtle0.singer.beatFactor = 1;
            turtle0.doWait.mockClear();
            Singer.processNote.mockClear();

            // Simulate Singer.processNote accumulation for STupletBlock in LEGO tuplet
            Singer.processNote.mockImplementation((act, beat, flag, blk, turtle, callback) => {
                const rhythms = act.logo.tupletRhythms[turtle];
                if (rhythms && rhythms.length > 0) {
                    rhythms[rhythms.length - 1].push(beat);
                }
                if (callback) callback();
            });

            activity.blocks.blockList["blkTuplet4_lego"] = { name: "tuplet4" };
            activity.blocks.blockList["blkSTuplet_lego"] = { name: "stuplet" };

            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            const stupletBlock = DummyFlowBlock.createdBlocks["stuplet"];

            tuplet4Block.flow([2, 4, 88], logo, 0, "blkTuplet4_lego");
            stupletBlock.flow([3, 0.5], logo, 0, "blkSTuplet_lego");

            // arg0 = 3 notes, arg1 = 0.5 => noteBeatValue = (1 / 0.5) * 1 = 2
            expect(logo.tupletRhythms[0]).toEqual([["notes", 0, 2, 2, 2]]);
            expect(Singer.processNote).toHaveBeenCalledTimes(3);
            expect(Singer.processNote).toHaveBeenCalledWith(
                activity,
                2,
                false,
                "blkSTuplet_lego",
                0
            );

            const listener = logo.setTurtleListener.mock.calls.find(call => call[0] === 0)[2];
            listener();

            // Total wait: 3 notes of beatValue 0.8 -> totalBeats (2.4) - last beatValue (0.8) = 1.6
            expect(turtle0.doWait).toHaveBeenCalledWith(1.6);
            expect(logo.tuplet[0]).toBe(false);
            expect(logo.addingNotesToTuplet[0]).toBe(false);

            // Restore default mock
            Singer.processNote.mockImplementation((act, beat, flag, blk, turtle, callback) => {
                if (callback) callback();
            });
        });
        it("should not square beatFactor for STupletBlock inside LEGO tuplet with non-default beatFactor", () => {
            logo.inLegoWidget = true;
            logo.inMatrix = false;
            logo.tuplet = {};
            logo.tupletParams = {};
            logo.tupletRhythms = {};
            logo.addingNotesToTuplet = {};

            const turtle0 = activity.turtles.ithTurtle(0);
            turtle0.singer.beatFactor = 2;
            turtle0.doWait.mockClear();
            Singer.processNote.mockClear();

            Singer.processNote.mockImplementation((act, beat, flag, blk, turtle, callback) => {
                const rhythms = act.logo.tupletRhythms[turtle];
                if (rhythms && rhythms.length > 0) {
                    rhythms[rhythms.length - 1].push(beat);
                }
                if (callback) callback();
            });

            activity.blocks.blockList["blkTuplet4_lego2"] = { name: "tuplet4" };
            activity.blocks.blockList["blkSTuplet_lego2"] = { name: "stuplet" };

            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            const stupletBlock = DummyFlowBlock.createdBlocks["stuplet"];

            tuplet4Block.flow([2, 4, 88], logo, 0, "blkTuplet4_lego2");
            stupletBlock.flow([3, 0.5], logo, 0, "blkSTuplet_lego2");

            // arg0 = 3 notes, arg1 = 0.5, beatFactor = 2 => noteBeatValue = (1 / 0.5) * 2 = 4
            // STupletBlock passes 4 to Singer.processNote; it should not be multiplied by beatFactor again
            expect(logo.tupletRhythms[0]).toEqual([["notes", 0, 4, 4, 4]]);
            expect(Singer.processNote).toHaveBeenCalledTimes(3);
            expect(Singer.processNote).toHaveBeenCalledWith(
                activity,
                4,
                false,
                "blkSTuplet_lego2",
                0
            );

            const listener = logo.setTurtleListener.mock.calls.find(call => call[0] === 0)[2];
            listener();

            // Total wait: 3 notes of beatValue 0.4 -> totalBeats (1.2) - last beatValue (0.4) = 0.8
            expect(turtle0.doWait).toHaveBeenCalledWith(0.8);
            expect(logo.tuplet[0]).toBe(false);
            expect(logo.addingNotesToTuplet[0]).toBe(false);

            // Restore default mock and beatFactor
            turtle0.singer.beatFactor = 1;
            Singer.processNote.mockImplementation((act, beat, flag, blk, turtle, callback) => {
                if (callback) callback();
            });
        });
        it("should handle legacy non-object tuplet state on flow and dispatch listener", () => {
            logo.inMatrix = false;
            logo.tuplet = false;
            logo.addingNotesToTuplet = false;
            logo.tupletParams = [];
            logo.tupletRhythms = [["notes", 0, 4, 4]];
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkTuplet4_legacy"] = { name: "tuplet4" };

            const tuplet4Block = DummyFlowBlock.createdBlocks["tuplet4"];
            tuplet4Block.flow([2, 4, 88], logo, turtleIndex, "blkTuplet4_legacy");

            expect(logo.tuplet).toBe(true);
            expect(logo.addingNotesToTuplet).toBe(false);
            expect(logo.tupletParams.length).toBe(1);

            const lastCall =
                logo.setTurtleListener.mock.calls[logo.setTurtleListener.mock.calls.length - 1];
            const listener = lastCall[2];
            listener();

            expect(logo.tuplet).toBe(false);
            expect(logo.addingNotesToTuplet).toBe(false);
        });
    });

    describe("SeptupletBlock", () => {
        it("should be defined and have a macro function", () => {
            const septupletBlock = DummyFlowBlock.createdBlocks["stuplet7"];
            expect(septupletBlock).toBeDefined();
            expect(typeof septupletBlock.macro).toEqual("function");
        });
    });

    describe("QuintupletBlock", () => {
        it("should be defined and have a macro function", () => {
            const quintupletBlock = DummyFlowBlock.createdBlocks["stuplet5"];
            expect(quintupletBlock).toBeDefined();
            expect(typeof quintupletBlock.macro).toEqual("function");
        });
    });

    describe("TripletBlock", () => {
        it("should be defined and have a macro function", () => {
            const tripletBlock = DummyFlowBlock.createdBlocks["stuplet3"];
            expect(tripletBlock).toBeDefined();
            expect(typeof tripletBlock.macro).toEqual("function");
        });
    });

    describe("STupletBlock", () => {
        it("should call errorMsg and use defaults for invalid arguments", () => {
            const stupletBlock = DummyFlowBlock.createdBlocks["stuplet"];
            activity.blocks.blockList["blkSTuplet"] = { connections: [null, null] };
            stupletBlock.flow([null, null], logo, turtleIndex, "blkSTuplet");
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", "blkSTuplet");
        });
        it("should process a simple tuplet flow in matrix mode", () => {
            logo.inMatrix = true;
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkSTuplet"] = { name: "stuplet" };
            const stupletBlock = DummyFlowBlock.createdBlocks["stuplet"];
            logo.tupletRhythms = [];
            const ret = stupletBlock.flow([3, 0.5], logo, turtleIndex, "blkSTuplet");
            expect(logo.tupletRhythms.length).toBeGreaterThan(0);
            expect(ret).toBeUndefined();
        });

        it("should process a simple tuplet inside a tuplet clamp (isTuplet is true) with per-turtle state", () => {
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkSTuplet"] = { name: "stuplet" };
            const stupletBlock = DummyFlowBlock.createdBlocks["stuplet"];

            logo.inMatrix = true;
            logo.tuplet = { [turtleIndex]: true };
            logo.addingNotesToTuplet = { [turtleIndex]: false };
            logo.tupletRhythms = { [turtleIndex]: [] };
            logo.tupletParams = { [turtleIndex]: [] };

            Singer.processNote.mockClear();
            stupletBlock.flow([3, 0.5], logo, turtleIndex, "blkSTuplet");

            expect(logo.addingNotesToTuplet[turtleIndex]).toBe(true);
            expect(logo.tupletRhythms[turtleIndex]).toEqual([["notes", 0]]);
            expect(Singer.processNote).toHaveBeenCalledTimes(3);
        });

        it("should process a simple tuplet inside a tuplet clamp when already adding notes", () => {
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkSTuplet"] = { name: "stuplet" };
            const stupletBlock = DummyFlowBlock.createdBlocks["stuplet"];

            logo.inMatrix = true;
            logo.tuplet = { [turtleIndex]: true };
            logo.addingNotesToTuplet = { [turtleIndex]: true };
            logo.tupletRhythms = { [turtleIndex]: [["notes", 0]] };
            logo.tupletParams = { [turtleIndex]: [] };

            Singer.processNote.mockClear();
            stupletBlock.flow([2, 0.5], logo, turtleIndex, "blkSTuplet");

            expect(Singer.processNote).toHaveBeenCalledTimes(2);
        });

        it("should process a simple tuplet inside a tuplet clamp with legacy non-object state", () => {
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkSTuplet"] = { name: "stuplet" };
            const stupletBlock = DummyFlowBlock.createdBlocks["stuplet"];

            logo.inMatrix = true;
            logo.tuplet = true;
            logo.addingNotesToTuplet = false;
            logo.tupletRhythms = [];
            logo.tupletParams = [];

            Singer.processNote.mockClear();
            stupletBlock.flow([2, 0.5], logo, turtleIndex, "blkSTuplet");

            expect(logo.addingNotesToTuplet).toBe(true);
            expect(logo.tupletRhythms).toEqual([["notes", 0]]);
            expect(Singer.processNote).toHaveBeenCalledTimes(2);
        });

        it("should process a simple tuplet in matrix mode with per-turtle state", () => {
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            activity.blocks.blockList["blkSTuplet"] = { name: "stuplet" };
            const stupletBlock = DummyFlowBlock.createdBlocks["stuplet"];

            logo.inMatrix = true;
            logo.tuplet = { [turtleIndex]: false };
            logo.tupletParams = { [turtleIndex]: [] };
            logo.tupletRhythms = { [turtleIndex]: [] };

            stupletBlock.flow([3, 0.5], logo, turtleIndex, "blkSTuplet");

            expect(logo.tupletParams[turtleIndex].length).toBe(1);
            expect(logo.tupletRhythms[turtleIndex][0][0]).toBe("simple");
        });

        it("should process a simple tuplet outside matrix and outside tuplet clamp", () => {
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.beatFactor = 1;
            turtle.singer.drumStyle = ["customDrum"];
            activity.blocks.blockList["blkSTuplet"] = { name: "stuplet" };
            const stupletBlock = DummyFlowBlock.createdBlocks["stuplet"];

            logo.inMatrix = false;
            logo.tuplet = { [turtleIndex]: false };

            stupletBlock.flow([2, 0.5], logo, turtleIndex, "blkSTuplet");

            expect(logo.clearNoteParams).toHaveBeenCalledWith(turtle, "blkSTuplet", ["customDrum"]);
            expect(turtle.doWait).toHaveBeenCalled();
        });
    });
});
