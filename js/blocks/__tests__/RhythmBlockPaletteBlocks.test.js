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

global._ = jest.fn((str) => str);
global._THIS_IS_TURTLE_BLOCKS_ = false;
global.DEFAULTDRUM = "drum";

const { setupRhythmBlockPaletteBlocks } = require("../RhythmBlockPaletteBlocks");

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

global.last = (arr) => arr[arr.length - 1];
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
        dummyActivity.blocks.blockList = {};
        dummyActivity.turtles.turtleObjs = {};
        activity = dummyActivity;
        logo = { ...dummyLogo };
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
    });
});
