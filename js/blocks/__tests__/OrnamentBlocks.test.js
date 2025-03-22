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

const { setupOrnamentBlocks } = require("../OrnamentBlocks");

describe("setupOrnamentBlocks", () => {
    let activity, logo, createdBlocks;

    class DummyValueBlock {
        constructor(name, displayName) {
            this.name = name;
            this.displayName = displayName;
            createdBlocks[name] = this;
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

    class DummyFlowClampBlock extends DummyValueBlock {
    }

    beforeEach(() => {
        createdBlocks = {};

        global._ = jest.fn((str) => str);
        global.ValueBlock = DummyValueBlock;
        global.FlowClampBlock = DummyFlowClampBlock;
        global.NOINPUTERRORMSG = "No input provided";
        global.NANERRORMSG = "Not a number";
        global.last = (arr) => arr[arr.length - 1];

        global.Singer = {
            OrnamentActions: {
                doNeighbor: jest.fn(),
                setSlur: jest.fn(),
                setStaccato: jest.fn()
            },
            noteCounter: jest.fn((logo, turtle, val) => val)
        };

        activity = {
            errorMsg: jest.fn(),
            textMsg: jest.fn(),
            blocks: { blockList: {} }
        };

        activity.turtles = {
            turtleObjs: {},
            ithTurtle(turtle) {
                if (!this.turtleObjs[turtle]) {
                    this.turtleObjs[turtle] = {
                        singer: { staccato: [], glide: [], justCounting: [] }
                    };
                }
                return this.turtleObjs[turtle];
            }
        };

        logo = {
            inStatusMatrix: false,
            statusFields: [],
            stopTurtle: false,
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            notation: {
                notationBeginSlur: jest.fn(),
                notationEndSlur: jest.fn()
            }
        };

        setupOrnamentBlocks(activity);
    });

    describe("StaccatoFactorBlock", () => {
        it("should push \"staccato\" status when in status matrix", () => {
            const blk = "blkSF1";
            activity.blocks.blockList[blk] = { connections: [10] };
            activity.blocks.blockList[10] = { name: "print" };
            logo.inStatusMatrix = true;
            const staccatoFactorBlock = createdBlocks["staccatofactor"];
            staccatoFactorBlock.arg(logo, 0, blk);
            expect(logo.statusFields).toContainEqual([blk, "staccato"]);
        });

        it("should return the last staccato factor if available", () => {
            logo.inStatusMatrix = false;
            const turtleObj = activity.turtles.ithTurtle(0);
            turtleObj.singer.staccato = [5, 10, 15];
            const staccatoFactorBlock = createdBlocks["staccatofactor"];
            const result = staccatoFactorBlock.arg(logo, 0, "blkSF2");
            expect(result).toEqual(15);
        });

        it("should return 0 if no staccato factors exist", () => {
            logo.inStatusMatrix = false;
            const turtleObj = activity.turtles.ithTurtle(0);
            turtleObj.singer.staccato = [];
            const staccatoFactorBlock = createdBlocks["staccatofactor"];
            const result = staccatoFactorBlock.arg(logo, 0, "blkSF3");
            expect(result).toEqual(0);
        });

        it("updateParameter should return the block value from activity", () => {
            const blk = "blkSF4";
            activity.blocks.blockList[blk] = { value: 42 };
            const staccatoFactorBlock = createdBlocks["staccatofactor"];
            const result = staccatoFactorBlock.updateParameter(logo, 0, blk);
            expect(result).toEqual(42);
        });
    });

    describe("SlurFactorBlock", () => {
        it("should push \"slur\" status when in status matrix", () => {
            const blk = "blkSLF1";
            activity.blocks.blockList[blk] = { connections: [20] };
            activity.blocks.blockList[20] = { name: "print" };
            logo.inStatusMatrix = true;
            const slurFactorBlock = createdBlocks["slurfactor"];
            slurFactorBlock.arg(logo, 0, blk);
            expect(logo.statusFields).toContainEqual([blk, "slur"]);
        });

        it("should return negative of the last staccato factor if available", () => {
            logo.inStatusMatrix = false;
            const turtleObj = activity.turtles.ithTurtle(0);
            turtleObj.singer.staccato = [3, 6, 9];
            const slurFactorBlock = createdBlocks["slurfactor"];
            const result = slurFactorBlock.arg(logo, 0, "blkSLF2");
            expect(result).toEqual(-9);
        });

        it("should return 0 if no staccato factors exist", () => {
            logo.inStatusMatrix = false;
            const turtleObj = activity.turtles.ithTurtle(0);
            turtleObj.singer.staccato = [];
            const slurFactorBlock = createdBlocks["slurfactor"];
            const result = slurFactorBlock.arg(logo, 0, "blkSLF3");
            expect(result).toEqual(0);
        });

        it("updateParameter should return the block value from activity", () => {
            const blk = "blkSLF4";
            activity.blocks.blockList[blk] = { value: 55 };
            const slurFactorBlock = createdBlocks["slurfactor"];
            const result = slurFactorBlock.updateParameter(logo, 0, blk);
            expect(result).toEqual(55);
        });
    });

    describe("NeighborBlock", () => {
        it("should call doNeighbor and return expected array", () => {
            const neighborBlock = createdBlocks["neighbor"];
            const result = neighborBlock.flow([2, 0.5, 99], logo, 0, "blkNeighbor");
            expect(Singer.OrnamentActions.doNeighbor).toHaveBeenCalledWith(2, 0.5, 0, "blkNeighbor");
            expect(result).toEqual([99, 1]);
        });

        it("should call errorMsg if arguments are not numbers", () => {
            const neighborBlock = createdBlocks["neighbor"];
            neighborBlock.flow(["a", 0.5, 99], logo, 0, "blkNeighbor");
            expect(activity.errorMsg).toHaveBeenCalledWith(NANERRORMSG, "blkNeighbor");
            expect(logo.stopTurtle).toBe(true);
        });
    });

    describe("Neighbor2Block", () => {
        it("should inherit flow behavior from NeighborBlock", () => {
            const neighbor2Block = createdBlocks["neighbor2"];
            const result = neighbor2Block.flow([3, 0.25, 88], logo, 0, "blkNeighbor2");
            expect(Singer.OrnamentActions.doNeighbor).toHaveBeenCalledWith(3, 0.25, 0, "blkNeighbor2");
            expect(result).toEqual([88, 1]);
        });
    });

    describe("GlideBlock", () => {
        it("should return undefined if second argument is undefined", () => {
            const glideBlock = createdBlocks["glide"];
            const result = glideBlock.flow([1 / 16], logo, 0, "blkGlide");
            expect(result).toBeUndefined();
        });

        it("should process glide correctly with valid arguments", () => {
            const glideBlock = createdBlocks["glide"];
            const turtleIndex = 0;
            const turtleObj = activity.turtles.ithTurtle(turtleIndex);
            turtleObj.singer.glide = [];
            const result = glideBlock.flow([0.1, 8], logo, turtleIndex, "blkGlide");
            expect(turtleObj.singer.glide).toContain(0.1);
            expect(Singer.noteCounter).toHaveBeenCalledWith(logo, turtleIndex, 8);
            expect(logo.notation.notationBeginSlur).toHaveBeenCalledWith(turtleIndex);
            expect(logo.setDispatchBlock).toHaveBeenCalledWith(
                "blkGlide",
                turtleIndex,
                expect.stringMatching(/^_glide_/)
            );
            expect(logo.setTurtleListener).toHaveBeenCalled();
            expect(result).toEqual([8, 1]);
        });

        it("should default glide argument and call errorMsg if first argument is invalid", () => {
            const glideBlock = createdBlocks["glide"];
            const turtleIndex = 0;
            const result = glideBlock.flow([null, 8], logo, turtleIndex, "blkGlide");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, "blkGlide");
            expect(result).toEqual([8, 1]);
        });
    });

    describe("SlurBlock", () => {
        it("should return undefined if second argument is undefined", () => {
            const slurBlock = createdBlocks["slur"];
            const result = slurBlock.flow([1 / 16], logo, 0, "blkSlur");
            expect(result).toBeUndefined();
        });

        it("should call setSlur with correct arguments", () => {
            const slurBlock = createdBlocks["slur"];
            slurBlock.flow([0.2, 7], logo, 0, "blkSlur");
            expect(Singer.OrnamentActions.setSlur).toHaveBeenCalledWith(0.2, 0, "blkSlur");
        });

        it("should default slur argument and call errorMsg if first argument is invalid", () => {
            const slurBlock = createdBlocks["slur"];
            slurBlock.flow([null, 7], logo, 0, "blkSlur");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, "blkSlur");
        });
    });

    describe("StaccatoBlock", () => {
        it("should return undefined if second argument is undefined", () => {
            const staccatoBlock = createdBlocks["staccato"];
            const result = staccatoBlock.flow([1 / 32], logo, 0, "blkStaccato");
            expect(result).toBeUndefined();
        });

        it("should call setStaccato with correct arguments", () => {
            const staccatoBlock = createdBlocks["staccato"];
            staccatoBlock.flow([0.05, 5], logo, 0, "blkStaccato");
            expect(Singer.OrnamentActions.setStaccato).toHaveBeenCalledWith(0.05, 0, "blkStaccato");
        });

        it("should default staccato argument and call errorMsg if first argument is invalid", () => {
            const staccatoBlock = createdBlocks["staccato"];
            staccatoBlock.flow([null, 5], logo, 0, "blkStaccato");
            expect(activity.errorMsg).toHaveBeenCalledWith(NOINPUTERRORMSG, "blkStaccato");
        });
    });

    describe("NewSlurBlock", () => {
        it("should not be hidden and behave like SlurBlock", () => {
            const newSlurBlock = createdBlocks["newslur"];
            expect(newSlurBlock.hidden).toBe(false);
            newSlurBlock.flow([0.15, 10], logo, 0, "blkNewSlur");
            expect(Singer.OrnamentActions.setSlur).toHaveBeenCalledWith(0.15, 0, "blkNewSlur");
        });
    });

    describe("NewStaccatoBlock", () => {
        it("should not be hidden and behave like StaccatoBlock", () => {
            const newStaccatoBlock = createdBlocks["newstaccato"];
            expect(newStaccatoBlock.hidden).toBe(false);
            newStaccatoBlock.flow([0.08, 12], logo, 0, "blkNewStaccato");
            expect(Singer.OrnamentActions.setStaccato).toHaveBeenCalledWith(0.08, 0, "blkNewStaccato");
        });
    });
});
