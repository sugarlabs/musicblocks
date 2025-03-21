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

const { setupVolumeBlocks } = require("../VolumeBlocks");

describe("setupVolumeBlocks", () => {
    let activity, logo, createdBlocks, turtleIndex;

    // Dummy base classes.
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
            // In a real system, this registers the block.
            return this;
        }
    }

    class DummyFlowBlock extends DummyValueBlock {
        // Inherits from DummyValueBlock.
    }

    class DummyFlowClampBlock extends DummyValueBlock {
        // Inherits from DummyValueBlock.
    }

    class DummyLeftBlock extends DummyValueBlock {
        // Inherits from DummyValueBlock.
    }

    beforeEach(() => {
        createdBlocks = {};

        // Global dummy internationalization function.
        global._ = jest.fn((str) => str);

        // Dummy base classes.
        global.ValueBlock = DummyValueBlock;
        global.FlowBlock = DummyFlowBlock;
        global.FlowClampBlock = DummyFlowClampBlock;
        global.LeftBlock = DummyLeftBlock;

        global.NOINPUTERRORMSG = "No input provided";
        global.NANERRORMSG = "Not a number";
        global.last = (arr) => arr[arr.length - 1];

        // Constants.
        global.DEFAULTVOLUME = 70;
        global.DEFAULTVOICE = "piano";
        global.DEFAULTDRUM = "drum";
        global.VOICENAMES = {
            piano: ["piano", "piano"],
            guitar: ["guitar", "guitar"]
        };
        global.DRUMNAMES = {
            drum: ["drum", "drum"]
        };

        // Dummy Singer with the required functions.
        global.Singer = {
            VolumeActions: {
                getSynthVolume: jest.fn((targetSynth, turtle) => 80),
                setSynthVolume: jest.fn((synth, volume, turtle, blk) => {}),
                // Added setMasterVolume inside VolumeActions.
                setMasterVolume: jest.fn((value, turtle, blk) => {}),
                setPanning: jest.fn(),
                doCrescendo: jest.fn(),
                setRelativeVolume: jest.fn()
            },
            masterVolume: [],
            // Also define top-level setSynthVolume so that SetSynthVolume2Block works.
            setSynthVolume: jest.fn((logo, turtle, synth, volume) => {}),
            setMasterVolume: jest.fn((logo, value) => {})
        };

        // Dummy activity.
        activity = {
            errorMsg: jest.fn(),
            textMsg: jest.fn(),
            blocks: { blockList: {} }
        };

        // Define a dummy turtles property on activity.
        activity.turtles = {
            turtleObjs: {},
            ithTurtle(turtle) {
                if (!this.turtleObjs[turtle]) {
                    // Each turtle gets a singer with default properties.
                    this.turtleObjs[turtle] = {
                        singer: {
                            staccato: [],
                            synthVolume: {},
                            instrumentNames: [],
                            suppressOutput: false,
                            justCounting: [],
                            crescendoInitialVolume: {}
                        }
                    };
                }
                return this.turtleObjs[turtle];
            }
        };

        // Dummy logo.
        logo = {
            inStatusMatrix: false,
            statusFields: [],
            stopTurtle: false,
            synth: {
                loadSynth: jest.fn()
            },
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn(),
            notation: {
                notationBeginSlur: jest.fn(),
                notationEndSlur: jest.fn()
            },
            // Dummy parseArg returns the received argument.
            parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => receivedArg)
        };

        turtleIndex = 0;

        // Initialize the volume blocks.
        setupVolumeBlocks(activity);
    });

    describe("SynthVolumeBlock", () => {
        it("should push status when in status matrix", () => {
            const blk = "blkSynthVol1";
            activity.blocks.blockList[blk] = { connections: [10, 20] };
            activity.blocks.blockList[10] = { name: "print" };
            logo.inStatusMatrix = true;
            const synthVolBlock = createdBlocks["synthvolumefactor"];
            synthVolBlock.arg(logo, turtleIndex, blk, "piano");
            expect(logo.statusFields).toContainEqual([blk, "synth volume"]);
        });

        it("should call getSynthVolume when connection is valid", () => {
            const blk = "blkSynthVol2";
            activity.blocks.blockList[blk] = { connections: [null, 30] };
            activity.blocks.blockList[30] = { name: "dummy" };
            logo.inStatusMatrix = false;
            logo.parseArg.mockReturnValue("piano");
            const synthVolBlock = createdBlocks["synthvolumefactor"];
            const ret = synthVolBlock.arg(logo, turtleIndex, blk, "piano");
            expect(Singer.VolumeActions.getSynthVolume).toHaveBeenCalledWith(
                "piano",
                turtleIndex
            );
            expect(ret).toEqual(80);
        });

        it("should return 0 when second connection is null", () => {
            const blk = "blkSynthVol3";
            activity.blocks.blockList[blk] = { connections: [null, null] };
            logo.inStatusMatrix = false;
            const synthVolBlock = createdBlocks["synthvolumefactor"];
            const ret = synthVolBlock.arg(logo, turtleIndex, blk, "piano");
            expect(ret).toEqual(0);
        });

        it("updateParameter should return block value", () => {
            const blk = "blkSynthVol4";
            activity.blocks.blockList[blk] = { value: "testValue" };
            const synthVolBlock = createdBlocks["synthvolumefactor"];
            const ret = synthVolBlock.updateParameter(logo, turtleIndex, blk);
            expect(ret).toEqual("testValue");
        });
    });

    describe("MasterVolumeBlock", () => {
        it("should push status when in status matrix", () => {
            const blk = "blkMasterVol1";
            activity.blocks.blockList[blk] = { connections: [15] };
            activity.blocks.blockList[15] = { name: "print" };
            logo.inStatusMatrix = true;
            const masterVolBlock = createdBlocks["notevolumefactor"];
            masterVolBlock.arg(logo, turtleIndex, blk);
            expect(logo.statusFields).toContainEqual([blk, "volume"]);
        });

        it("should return master volume when not in status matrix", () => {
            logo.inStatusMatrix = false;
            Singer.VolumeActions.masterVolume = 85;
            const masterVolBlock = createdBlocks["notevolumefactor"];
            const ret = masterVolBlock.arg(logo, turtleIndex, "blkMasterVol2");
            expect(ret).toEqual(85);
        });

        it("updateParameter should return block value", () => {
            const blk = "blkMasterVol3";
            activity.blocks.blockList[blk] = { value: 95 };
            const masterVolBlock = createdBlocks["notevolumefactor"];
            const ret = masterVolBlock.updateParameter(logo, turtleIndex, blk);
            expect(ret).toEqual(95);
        });
    });

    describe("SetSynthVolume2Block", () => {
        it("should return undefined if third argument is undefined", () => {
            const setSynthVol2Block = createdBlocks["setsynthvolume2"];
            const ret = setSynthVol2Block.flow(
                ["piano", 80],
                logo,
                turtleIndex,
                "blkSSV2"
            );
            expect(ret).toBeUndefined();
        });

        it("should process valid synth volume and register a listener", () => {
            const blk = "blkSSV2";
            const args = ["piano", 90, 100];
            const setSynthVol2Block = createdBlocks["setsynthvolume2"];
            const turtleObj = activity.turtles.ithTurtle(turtleIndex);
            turtleObj.singer.instrumentNames = [];
            turtleObj.singer.synthVolume = {};
            turtleObj.singer.crescendoInitialVolume = {};
            logo.synth.loadSynth = jest.fn();
            const ret = setSynthVol2Block.flow(args, logo, turtleIndex, blk);
            expect(logo.synth.loadSynth).toHaveBeenCalledWith(turtleIndex, "piano");
            expect(turtleObj.singer.instrumentNames).toContain("piano");
            expect(logo.setDispatchBlock).toHaveBeenCalledWith(
                blk,
                turtleIndex,
                expect.stringMatching(/^_synthvolume_/)
            );
            expect(logo.setTurtleListener).toHaveBeenCalled();
            expect(ret).toEqual([100, 1]);
        });
    });

    describe("SetSynthVolumeBlock", () => {
        it("should call setSynthVolume after validating arguments", () => {
            const blk = "blkSSV";
            const args = ["piano", 95];
            const setSynthVolBlock = createdBlocks["setsynthvolume"];
            setSynthVolBlock.flow(args, logo, turtleIndex, blk);
            expect(Singer.VolumeActions.setSynthVolume).toHaveBeenCalledWith(
                "piano",
                95,
                turtleIndex,
                blk
            );
        });
    });

    describe("SetPanBlock", () => {
        it("should call errorMsg if argument is not a number", () => {
            const panBlock = createdBlocks["setpanning"];
            panBlock.flow(["not a number"], logo, turtleIndex, "blkPan");
            expect(activity.errorMsg).toHaveBeenCalledWith(NANERRORMSG, "blkPan");
        });

        it("should warn when panning is extreme and call setPanning", () => {
            const panBlock = createdBlocks["setpanning"];
            panBlock.flow([100], logo, turtleIndex, "blkPan2");
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Warning: Sound is coming out from only the left or right side.",
                "blkPan2"
            );
            expect(Singer.VolumeActions.setPanning).toHaveBeenCalledWith(100, turtleIndex);
        });
    });

    describe("SetNoteVolumeBlock", () => {
        it("should call errorMsg if argument is not a number", () => {
            const noteVolBlock = createdBlocks["setnotevolume"];
            noteVolBlock.flow(["NaN"], logo, turtleIndex, "blkNoteVol");
            expect(activity.errorMsg).toHaveBeenCalledWith(NANERRORMSG, "blkNoteVol");
        });

        it("should call setMasterVolume with a valid number", () => {
            const noteVolBlock = createdBlocks["setnotevolume"];
            noteVolBlock.flow([75], logo, turtleIndex, "blkNoteVol2");
            expect(Singer.VolumeActions.setMasterVolume).toHaveBeenCalledWith(
                75,
                turtleIndex,
                "blkNoteVol2"
            );
        });
    });

    describe("SetNoteVolume2Block", () => {
        it("should return undefined if second argument is undefined", () => {
            const noteVol2Block = createdBlocks["setnotevolume2"];
            const ret = noteVol2Block.flow([50], logo, turtleIndex, "blkNoteVol2");
            expect(ret).toBeUndefined();
        });

        it("should process master volume change and register a listener", () => {
            const blk = "blkNoteVol22";
            const args = [60, 100];
            const noteVol2Block = createdBlocks["setnotevolume2"];
            Singer.masterVolume = [];
            const turtleObj = activity.turtles.ithTurtle(turtleIndex);
            turtleObj.singer.suppressOutput = false;
            const ret = noteVol2Block.flow(args, logo, turtleIndex, blk);
            expect(Singer.masterVolume).toContain(60);
            expect(logo.setDispatchBlock).toHaveBeenCalledWith(
                blk,
                turtleIndex,
                expect.stringMatching(/^_volume_/)
            );
            expect(logo.setTurtleListener).toHaveBeenCalled();
            expect(ret).toEqual([100, 1]);
        });
    });

    describe("ArticulationBlock", () => {
        it("should return undefined if second argument is undefined", () => {
            const artBlock = createdBlocks["articulation"];
            const ret = artBlock.flow([30], logo, turtleIndex, "blkArt");
            expect(ret).toBeUndefined();
        });

        it("should call setRelativeVolume and return an array", () => {
            const artBlock = createdBlocks["articulation"];
            const ret = artBlock.flow([25, 50], logo, turtleIndex, "blkArt2");
            expect(Singer.VolumeActions.setRelativeVolume).toHaveBeenCalledWith(
                25,
                turtleIndex,
                "blkArt2"
            );
            expect(ret).toEqual([50, 1]);
        });
    });

    describe("DecrescendoBlock", () => {
        it("should call doCrescendo and return expected array when value is nonzero", () => {
            const decBlock = createdBlocks["decrescendo"];
            activity.blocks.blockList["blkDec"] = { name: "decrescendo" };
            const ret = decBlock.flow([5, 99], logo, turtleIndex, "blkDec");
            expect(Singer.VolumeActions.doCrescendo).toHaveBeenCalledWith(
                "decrescendo",
                5,
                turtleIndex,
                "blkDec"
            );
            expect(ret).toEqual([99, 1]);
        });
    });

    describe("CrescendoBlock", () => {
        it("should behave like decrescendo with block name 'crescendo'", () => {
            const cresBlock = createdBlocks["crescendo"];
            activity.blocks.blockList["blkCres"] = { name: "crescendo" };
            const ret = cresBlock.flow([5, 88], logo, turtleIndex, "blkCres");
            expect(Singer.VolumeActions.doCrescendo).toHaveBeenCalledWith(
                "crescendo",
                5,
                turtleIndex,
                "blkCres"
            );
            expect(ret).toEqual([88, 1]);
        });
    });
});
