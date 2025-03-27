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

const { setupMediaBlocks } = require("../MediaBlocks");

let createdBlocks = {};

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
    flow() { }
}

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
    makeMacro(fn) {
        this.macro = fn;
        return this;
    }
    setup(activity) { return this; }
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
    arg(logo, turtle, blk) {
        return global.activity.blocks.blockList[blk].value;
    }
}

global.FlowBlock = DummyFlowBlock;
global.ValueBlock = DummyValueBlock;
global.LeftBlock = DummyLeftBlock;
global._ = jest.fn((str) => str);

global.NOINPUTERRORMSG = "No input provided";
global.NANERRORMSG = "Not a number";

global.toFixed2 = (val) => Number(val).toFixed(2);

global.calcOctave = (currentOctave, val, lastNote, noteValue) =>
    currentOctave + parseInt(val);
global.pitchToFrequency = (note, octave, cents, keySig) => 440;
global.doStopVideoCam = jest.fn();

global.Howl = function (config) {
    this.urls = config.urls;
    this.play = jest.fn();
    this.stop = jest.fn();
};
global.last = (arr) => arr[arr.length - 1];
global._THIS_IS_MUSIC_BLOCKS_ = true;

const createDummyTurtle = () => ({
    id: "T1",
    container: { x: 50, y: 100, visible: true },
    painter: { doClearMedia: jest.fn() },
    singer: { inNoteBlock: [], embeddedGraphics: {} },
    doWait: jest.fn(),
    doTurtleShell: jest.fn()
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
    },
    _canvas: { width: 800, height: 600 },
    scale: 1
};

const dummyLogo = {
    sounds: [],
    boxes: {},
    statusFields: [],
    parseArg: jest.fn((logo, turtle, cblk, blk, receivedArg) => receivedArg),
    processShow: jest.fn(),
    processSpeak: jest.fn(),
    meSpeak: {},
    setDispatchBlock: jest.fn(),
    setTurtleListener: jest.fn(),
    cameraID: null
};

describe("setupMediaBlocks", () => {
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
        setupMediaBlocks(activity);
    });

    describe("RightPosBlock", () => {
        it("should return right position based on canvas width", () => {
            const rightPosBlock = createdBlocks["rightpos"];
            const expected = 800 / (2 * 1);
            expect(rightPosBlock.updateParameter()).toEqual(toFixed2(expected));
            expect(rightPosBlock.arg()).toEqual(expected);
        });
    });

    describe("LeftPosBlock", () => {
        it("should return left position (negative)", () => {
            const leftPosBlock = createdBlocks["leftpos"];
            const expected = -1 * (800 / (2 * 1));
            expect(leftPosBlock.updateParameter()).toEqual(toFixed2(expected));
            expect(leftPosBlock.arg()).toEqual(expected);
        });
    });

    describe("TopPosBlock", () => {
        it("should return top position based on canvas height", () => {
            const topPosBlock = createdBlocks["toppos"];
            const expected = 600 / (2 * 1);
            expect(topPosBlock.updateParameter()).toEqual(toFixed2(expected));
            expect(topPosBlock.arg()).toEqual(expected);
        });
    });

    describe("BottomPosBlock", () => {
        it("should return bottom position (negative)", () => {
            const bottomPosBlock = createdBlocks["bottompos"];
            const expected = -1 * (600 / (2 * 1));
            expect(bottomPosBlock.updateParameter()).toEqual(toFixed2(expected));
            expect(bottomPosBlock.arg()).toEqual(expected);
        });
    });

    describe("WidthBlock", () => {
        it("should return canvas width", () => {
            const widthBlock = createdBlocks["width"];
            const expected = 800;
            expect(widthBlock.updateParameter()).toEqual(toFixed2(expected));
            expect(widthBlock.arg()).toEqual(expected);
        });
    });

    describe("HeightBlock", () => {
        it("should return canvas height", () => {
            const heightBlock = createdBlocks["height"];
            const expected = 600;
            expect(heightBlock.updateParameter()).toEqual(toFixed2(expected));
            expect(heightBlock.arg()).toEqual(expected);
        });
    });

    describe("StopPlaybackBlock", () => {
        it("should stop all sounds and clear logo.sounds", () => {
            const dummySound1 = { stop: jest.fn() };
            const dummySound2 = { stop: jest.fn() };
            logo.sounds = [dummySound1, dummySound2];
            const stopPlaybackBlock = createdBlocks["stopplayback"];
            stopPlaybackBlock.flow([], logo);
            expect(dummySound1.stop).toHaveBeenCalled();
            expect(dummySound2.stop).toHaveBeenCalled();
            expect(logo.sounds.length).toEqual(0);
        });
    });

    describe("ClearMediaBlock", () => {
        it("should clear media by calling doClearMedia on turtle's painter", () => {
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.painter.doClearMedia = jest.fn();
            const clearMediaBlock = createdBlocks["erasemedia"];
            clearMediaBlock.flow([], logo, turtleIndex);
            expect(turtle.painter.doClearMedia).toHaveBeenCalled();
        });
    });

    describe("PlaybackBlock", () => {
        it("should call errorMsg if input is null", () => {
            activity.blocks.blockList[300] = { connections: [null, null] };
            const playbackBlock = createdBlocks["playback"];
            playbackBlock.flow([null], logo, turtleIndex, 300);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", 300);
        });
        it("should create a Howl, push it to logo.sounds and play it", () => {
            activity.blocks.blockList[300] = { connections: [null, null], value: "audio.mp3" };
            const playbackBlock = createdBlocks["playback"];
            logo.sounds = [];
            playbackBlock.flow(["audio.mp3"], logo, turtleIndex, 300);
            expect(logo.sounds.length).toBeGreaterThan(0);
            expect(logo.sounds[0].play).toHaveBeenCalled();
        });
    });

    describe("SpeakBlock", () => {
        it("should call processSpeak if meSpeak is not null and no note block is active", () => {
            const turtle = activity.turtles.ithTurtle(turtleIndex);
            turtle.singer.inNoteBlock = [];
            logo.meSpeak = {};
            logo.processSpeak = jest.fn();
            const speakBlock = createdBlocks["speak"];
            speakBlock.flow(["Hello world"], logo, turtleIndex, 400);
            expect(logo.processSpeak).toHaveBeenCalledWith("Hello world");
        });
    });

    describe("CameraBlock", () => {
        it("should return its value from blockList", () => {
            activity.blocks.blockList[410] = { value: "cameraInput" };
            const cameraBlock = createdBlocks["camera"];
            const result = cameraBlock.arg(logo, turtleIndex, 410);
            expect(result).toEqual("cameraInput");
        });
    });

    describe("VideoBlock", () => {
        it("should return its value from blockList", () => {
            activity.blocks.blockList[420] = { value: "videoInput" };
            const videoBlock = createdBlocks["video"];
            const result = videoBlock.arg(logo, turtleIndex, 420);
            expect(result).toEqual("videoInput");
        });
    });

    describe("LoadFileBlock", () => {
        it("should return its value from blockList", () => {
            activity.blocks.blockList[430] = { value: "fileInput" };
            const loadFileBlock = createdBlocks["loadFile"];
            const result = loadFileBlock.arg(logo, turtleIndex, 430);
            expect(result).toEqual("fileInput");
        });
    });

    describe("StopVideoCamBlock", () => {
        it("should call doStopVideoCam if logo.cameraID is not null", () => {
            logo.cameraID = "cam1";
            logo.setCameraID = jest.fn();
            const stopVideoCamBlock = createdBlocks["stopvideocam"];
            stopVideoCamBlock.flow([], logo);
            expect(doStopVideoCam).toHaveBeenCalledWith("cam1", logo.setCameraID);
        });
    });

    describe("ToneBlock", () => {
        it("should return undefined on flow", () => {
            const toneBlock = createdBlocks["tone"];
            const result = toneBlock.flow();
            expect(result).toBeUndefined();
        });
    });

    describe("ToFrequencyBlock", () => {
        it("should return frequency given valid connections", () => {
            activity.blocks.blockList[440] = { connections: [null, "c1", "c2"] };
            logo.parseArg = jest.fn((l, t, c, blk, r) => {
                if (c === "c1") return "G";
                if (c === "c2") return 4;
            });
            const toFrequencyBlock = createdBlocks["tofrequency"];
            const result = toFrequencyBlock.arg(logo, turtleIndex, 440, null);
            expect(result).toEqual(440);
        });
        it("should call errorMsg if a connection is missing", () => {
            activity.blocks.blockList[440] = { connections: [null, null, "c2"] };
            const toFrequencyBlock = createdBlocks["tofrequency"];
            const result = toFrequencyBlock.arg(logo, turtleIndex, 440, null);
            expect(activity.errorMsg).toHaveBeenCalledWith("No input provided", 440);
        });
    });

    describe("TurtleShellBlock", () => {
        it("should call doTurtleShell on the turtle if args are valid", () => {
            const turtle = activity.turtles.getTurtle(turtleIndex);
            turtle.doTurtleShell = jest.fn();
            activity.blocks.blockList[500] = { connections: [null, "c1", "c2"] };
            const shellBlock = createdBlocks["turtleshell"];
            shellBlock.flow([30, "avatar.png"], logo, turtleIndex, 500);
            expect(turtle.doTurtleShell).toHaveBeenCalledWith(30, "avatar.png");
        });
        it("should call errorMsg if first argument is a string", () => {
            activity.blocks.blockList[500] = { connections: [null, "c1", "c2"] };
            const shellBlock = createdBlocks["turtleshell"];
            shellBlock.flow(["bad", "avatar.png"], logo, turtleIndex, 500);
            expect(activity.errorMsg).toHaveBeenCalledWith("Not a number", 500);
        });
    });

    describe("ShowBlock", () => {
        it("should push block id to embeddedGraphics if in note block", () => {
            const turtle = activity.turtles.getTurtle(turtleIndex);
            turtle.singer.inNoteBlock = [600];
            turtle.singer.embeddedGraphics[600] = [];
            activity.blocks.blockList[600] = { value: "dummy" };
            const showBlock = createdBlocks["show"];
            showBlock.flow([20, "text"], logo, turtleIndex, 600);
            expect(turtle.singer.embeddedGraphics[600]).toContain(600);
        });
        it("should call processShow if not in note block", () => {
            const turtle = activity.turtles.getTurtle(turtleIndex);
            turtle.singer.inNoteBlock = [];
            logo.processShow = jest.fn();
            const showBlock = createdBlocks["show"];
            showBlock.flow([20, "text"], logo, turtleIndex, 600);
            expect(logo.processShow).toHaveBeenCalledWith(turtleIndex, 600, 20, "text");
        });
    });

    describe("MediaBlock", () => {
        it("should return its value from blockList", () => {
            activity.blocks.blockList[610] = { value: "mediaInput" };
            const mediaBlock = createdBlocks["media"];
            const result = mediaBlock.arg(logo, turtleIndex, 610);
            expect(result).toEqual("mediaInput");
        });
    });

    describe("TextBlock", () => {
        it("should return its value from blockList", () => {
            activity.blocks.blockList[620] = { value: "hello world" };
            const textBlock = createdBlocks["text"];
            const result = textBlock.arg(logo, turtleIndex, 620);
            expect(result).toEqual("hello world");
        });
    });
});
