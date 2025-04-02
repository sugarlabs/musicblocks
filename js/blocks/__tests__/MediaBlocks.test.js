/**
 * MusicBlocks v3.6.2
 *
 * @author Ashraf Mohamed
 *
 * @copyright 2025 Ashraf Mohamed
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

const { setupMediaBlocks } = require("../MediaBlocks");

let createdBlocks = {};

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
    setup(activity) { return this; }
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
    setup(activity) { return this; }
}

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
    flow() {}
}

global.ValueBlock = DummyValueBlock;
global.LeftBlock = DummyLeftBlock;
global.FlowBlock = DummyFlowBlock;
global._ = jest.fn((str) => str);
global.toFixed2 = jest.fn((num) => num.toFixed(2));
global.Howl = jest.fn(() => ({
    play: jest.fn(),
    stop: jest.fn()
}));
global.last = jest.fn((arr) => arr[arr.length - 1]);
global.calcOctave = jest.fn((currentOctave, octaveArg) => octaveArg);
global.pitchToFrequency = jest.fn((note, octave) => 440); // Simplified mock
global.doStopVideoCam = jest.fn();
global._THIS_IS_MUSIC_BLOCKS_ = true; // Set to true for Music Blocks context
global.NOINPUTERRORMSG = "No input provided";
global.NANERRORMSG = "Not a number error";

// Turtle factory function
const createDummyTurtle = () => ({
    singer: { 
        inNoteBlock: [], 
        suppressOutput: false, 
        embeddedGraphics: {}, 
        currentOctave: 4, 
        lastNotePlayed: null, 
        keySignature: "C Major" 
    },
    painter: { doClearMedia: jest.fn() },
    doTurtleShell: jest.fn()
});

describe("setupMediaBlocks", () => {
    let activity, logo;
    const blkId = 100;
    const turtleId = 0;

    beforeEach(() => {
        createdBlocks = {};

        activity = {
            errorMsg: jest.fn(),
            blocks: {
                blockList: {}
            },
            turtles: {
                _canvas: { width: 800, height: 600 },
                scale: 2,
                ithTurtle: jest.fn(),
                getTurtle: jest.fn()
            }
        };

        logo = {
            sounds: [],
            meSpeak: null,
            cameraID: null,
            setCameraID: jest.fn(),
            processSpeak: jest.fn(),
            processShow: jest.fn(),
            parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => receivedArg)
        };

        setupMediaBlocks(activity);
    });

    describe("RightPosBlock", () => {
        let rightPosBlock;

        beforeEach(() => {
            rightPosBlock = createdBlocks["rightpos"];
        });

        it("should return canvas right position from updateParameter", () => {
            const result = rightPosBlock.updateParameter();
            expect(result).toBe((800 / (2 * 2)).toFixed(2));
            expect(toFixed2).toHaveBeenCalledWith(200);
        });

        it("should return canvas right position from arg", () => {
            const result = rightPosBlock.arg();
            expect(result).toBe(200);
        });
    });

    describe("LeftPosBlock", () => {
        let leftPosBlock;

        beforeEach(() => {
            leftPosBlock = createdBlocks["leftpos"];
        });

        it("should return canvas left position from updateParameter", () => {
            const result = leftPosBlock.updateParameter();
            expect(result).toBe((-800 / (2 * 2)).toFixed(2));
            expect(toFixed2).toHaveBeenCalledWith(-200);
        });

        it("should return canvas left position from arg", () => {
            const result = leftPosBlock.arg();
            expect(result).toBe(-200);
        });
    });

    describe("TopPosBlock", () => {
        let topPosBlock;

        beforeEach(() => {
            topPosBlock = createdBlocks["toppos"];
        });

        it("should return canvas top position from updateParameter", () => {
            const result = topPosBlock.updateParameter();
            expect(result).toBe((600 / (2 * 2)).toFixed(2));
            expect(toFixed2).toHaveBeenCalledWith(150);
        });

        it("should return canvas top position from arg", () => {
            const result = topPosBlock.arg();
            expect(result).toBe(150);
        });
    });

    describe("BottomPosBlock", () => {
        let bottomPosBlock;

        beforeEach(() => {
            bottomPosBlock = createdBlocks["bottompos"];
        });

        it("should return canvas bottom position from updateParameter", () => {
            const result = bottomPosBlock.updateParameter();
            expect(result).toBe((-600 / (2 * 2)).toFixed(2));
            expect(toFixed2).toHaveBeenCalledWith(-150);
        });

        it("should return canvas bottom position from arg", () => {
            const result = bottomPosBlock.arg();
            expect(result).toBe(-150);
        });
    });

    describe("WidthBlock", () => {
        let widthBlock;

        beforeEach(() => {
            widthBlock = createdBlocks["width"];
        });

        it("should return canvas width from updateParameter", () => {
            const result = widthBlock.updateParameter();
            expect(result).toBe((800 / 2).toFixed(2));
            expect(toFixed2).toHaveBeenCalledWith(400);
        });

        it("should return canvas width from arg", () => {
            const result = widthBlock.arg();
            expect(result).toBe(400);
        });
    });

    describe("HeightBlock", () => {
        let heightBlock;

        beforeEach(() => {
            heightBlock = createdBlocks["height"];
        });

        it("should return canvas height from updateParameter", () => {
            const result = heightBlock.updateParameter();
            expect(result).toBe((600 / 2).toFixed(2));
            expect(toFixed2).toHaveBeenCalledWith(300);
        });

        it("should return canvas height from arg", () => {
            const result = heightBlock.arg();
            expect(result).toBe(300);
        });
    });

    describe("StopPlaybackBlock", () => {
        let stopPlaybackBlock;

        beforeEach(() => {
            stopPlaybackBlock = createdBlocks["stopplayback"];
            logo.sounds = [
                { stop: jest.fn(), play: jest.fn() },
                { stop: jest.fn(), play: jest.fn() }
            ];
        });

        it("should stop all sounds and clear the array", () => {
            const originalSounds = [...logo.sounds];
            stopPlaybackBlock.flow([], logo);
            expect(originalSounds[0].stop).toHaveBeenCalled();
            expect(originalSounds[1].stop).toHaveBeenCalled();
            expect(logo.sounds.length).toBe(0);
        });
    });

    describe("ClearMediaBlock", () => {
        let clearMediaBlock;

        beforeEach(() => {
            clearMediaBlock = createdBlocks["erasemedia"];
            activity.turtles.ithTurtle.mockReturnValue(createDummyTurtle());
        });

        it("should call doClearMedia on the turtle painter", () => {
            clearMediaBlock.flow([], logo, turtleId);
            expect(activity.turtles.ithTurtle).toHaveBeenCalledWith(turtleId);
            expect(activity.turtles.ithTurtle().painter.doClearMedia).toHaveBeenCalled();
        });
    });

    describe("PlaybackBlock", () => {
        let playbackBlock;

        beforeEach(() => {
            playbackBlock = createdBlocks["playback"];
            activity.blocks.blockList[blkId] = { connections: [null, 200] };
        });

        it("should play sound when valid media is provided", () => {
            playbackBlock.flow(["audio.mp3"], logo, turtleId, blkId);
            expect(logo.sounds.length).toBe(1);
            expect(logo.sounds[0].play).toHaveBeenCalled();
        });

        it("should call errorMsg when no input is provided", () => {
            playbackBlock.flow([null], logo, turtleId, blkId);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", blkId);
        });
    });

    describe("SpeakBlock", () => {
        let speakBlock;

        beforeEach(() => {
            speakBlock = createdBlocks["speak"];
            logo.meSpeak = { speak: jest.fn() };
            activity.turtles.ithTurtle.mockReturnValue(createDummyTurtle());
        });

        it("should call processSpeak when not in note block", () => {
            speakBlock.flow(["hello"], logo, turtleId, blkId);
            expect(logo.processSpeak).toHaveBeenCalledWith("hello");
        });

        it("should push to embeddedGraphics when in note block", () => {
            const tur = activity.turtles.ithTurtle(turtleId);
            tur.singer.inNoteBlock = [1];
            tur.singer.embeddedGraphics[1] = [];
            speakBlock.flow(["hello"], logo, turtleId, blkId);
            expect(tur.singer.embeddedGraphics[1]).toContain(blkId);
        });
    });

    describe("LoadFileBlock", () => {
        let loadFileBlock;

        beforeEach(() => {
            loadFileBlock = createdBlocks["loadFile"];
            activity.blocks.blockList[blkId] = { value: "file.jpg" };
        });

        it("should return the block value", () => {
            const result = loadFileBlock.arg(logo, turtleId, blkId);
            expect(result).toBe("file.jpg");
        });
    });

    describe("StopVideoCamBlock", () => {
        let stopVideoCamBlock;

        beforeEach(() => {
            stopVideoCamBlock = createdBlocks["stopvideocam"];
            logo.cameraID = "cam1";
        });

        it("should call doStopVideoCam with cameraID", () => {
            stopVideoCamBlock.flow([], logo);
            expect(doStopVideoCam).toHaveBeenCalledWith("cam1", logo.setCameraID);
        });

        it("should do nothing if no cameraID", () => {
            logo.cameraID = null;
            stopVideoCamBlock.flow([], logo);
            expect(doStopVideoCam).not.toHaveBeenCalled();
        });
    });

    describe("ToFrequencyBlock", () => {
        let toFrequencyBlock;

        beforeEach(() => {
            toFrequencyBlock = createdBlocks["tofrequency"];
            activity.blocks.blockList[blkId] = { connections: [null, 200, 300], value: 440 };
            activity.blocks.blockList[200] = { value: "G" };
            activity.blocks.blockList[300] = { value: 4 };
            activity.turtles.ithTurtle.mockReturnValue(createDummyTurtle());
            calcOctave.mockImplementation((currentOctave, octaveArg) => octaveArg);
            logo.parseArg.mockImplementation((logo, turtle, cblk, blk, receivedArg) => {
                if (cblk === 200) return "G";
                if (cblk === 300) return 4;
                return receivedArg;
            });
        });

        it("should return fixed block value from updateParameter", () => {
            const result = toFrequencyBlock.updateParameter(logo, turtleId, blkId);
            expect(result).toBe("440.00");
            expect(toFixed2).toHaveBeenCalledWith(440);
        });

        it("should return frequency for valid note and octave", () => {
            const result = toFrequencyBlock.arg(logo, turtleId, blkId, "G");
            expect(result).toBe(440);
            expect(pitchToFrequency).toHaveBeenCalledWith("G", 4, 0, "C Major");
        });

        it("should call errorMsg and return default if inputs missing", () => {
            activity.blocks.blockList[blkId].connections = [null, null, null];
            const result = toFrequencyBlock.arg(logo, turtleId, blkId, "G");
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", blkId);
            expect(result).toBe(392);
        });
    });

    describe("TurtleShellBlock", () => {
        let turtleShellBlock;

        beforeEach(() => {
            turtleShellBlock = createdBlocks["turtleshell"];
            activity.turtles.getTurtle.mockReturnValue(createDummyTurtle());
        });

        it("should call doTurtleShell with valid args", () => {
            turtleShellBlock.flow([55, "image.png"], logo, turtleId, blkId);
            expect(activity.turtles.getTurtle).toHaveBeenCalledWith(turtleId);
            expect(activity.turtles.getTurtle().doTurtleShell).toHaveBeenCalledWith(55, "image.png");
        });

        it("should call errorMsg if size is a string", () => {
            turtleShellBlock.flow(["55", "image.png"], logo, turtleId, blkId);
            expect(activity.errorMsg).toHaveBeenCalledWith("Not a number error", blkId);
            expect(activity.turtles.getTurtle().doTurtleShell).not.toHaveBeenCalled();
        });
    });

    describe("ShowBlock", () => {
        let showBlock;

        beforeEach(() => {
            showBlock = createdBlocks["show"];
            activity.turtles.ithTurtle.mockReturnValue(createDummyTurtle());
        });

        it("should call processShow when not in note block", () => {
            showBlock.flow([24, "text"], logo, turtleId, blkId);
            expect(logo.processShow).toHaveBeenCalledWith(turtleId, blkId, 24, "text");
        });

        it("should push to embeddedGraphics when in note block", () => {
            const tur = activity.turtles.ithTurtle(turtleId);
            tur.singer.inNoteBlock = [1];
            tur.singer.embeddedGraphics[1] = [];
            showBlock.flow([24, "text"], logo, turtleId, blkId);
            expect(tur.singer.embeddedGraphics[1]).toContain(blkId);
        });
    });
});