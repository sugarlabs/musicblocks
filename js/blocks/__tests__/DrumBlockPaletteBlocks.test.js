/**
 * MusicBlocks v3.7.0
 *
 * @author Anubhab
 *
 * @copyright Anubhab
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
global.DEFAULTDRUM = "kick";
global.DEFAULTEFFECT = "clap";
global.DEFAULTNOISE = "white noise";

global.last = arr => arr[arr.length - 1];
global.NOINPUTERRORMSG = "No input provided";

global.Singer = {
    DrumActions: {
        playNoise: jest.fn(),
        mapPitchToDrum: jest.fn(),
        setDrum: jest.fn(),
        GetDrumname: jest.fn(name => name),
        playDrum: jest.fn()
    }
};

const { setupDrumBlocks } = require("../DrumBlocks");

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
class DummyValueBlock extends DummyFlowBlock {}

global.FlowBlock = DummyFlowBlock;
global.FlowClampBlock = DummyFlowClampBlock;
global.ValueBlock = DummyValueBlock;

global.localStorage = { languagePreference: "en" };

global._THIS_IS_MUSIC_BLOCKS_ = true;

global.isAppleBrowser = jest.fn(() => false);

function createDummyTurtle() {
    return {
        id: "T1",
        container: { x: 50, y: 100, visible: true },
        singer: {
            drumStyle: [],
            inNoteBlock: [],
            noteBeatValues: [],
            beatFactor: 1,
            pushedNote: false
        },
        doWait: jest.fn()
    };
}

const dummyActivity = {
    errorMsg: jest.fn(),
    textMsg: jest.fn(),
    blocks: { blockList: {} },
    refreshCanvas: jest.fn(),
    beginnerMode: false
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

const connectToStart = (activity, blockName) => {
    const startId = 0;
    const blockId = 1;
    activity.blocks.blockList[startId] = { name: "start", connections: [null, blockId, null] };
    activity.blocks.blockList[blockId] = { name: blockName, connections: [startId, null] };
};

describe("setupDrumBlocks palette", () => {
    let activity;

    const resetActivity = beginnerMode => {
        DummyFlowBlock.createdBlocks = {};
        dummyActivity.errorMsg.mockClear();
        dummyActivity.textMsg.mockClear();
        dummyActivity.blocks.blockList = {};
        dummyActivity.turtles.turtleObjs = {};
        dummyActivity.beginnerMode = beginnerMode;
        activity = dummyActivity;
        setupDrumBlocks(activity);
    };

    // Beginner drum palette blocks (visible in beginner mode)
    describe("beginner mode", () => {
        beforeEach(() => {
            resetActivity(true);
        });

        it("adds PlayDrum block to Start block", () => {
            const playDrumBlock = DummyFlowBlock.createdBlocks["playdrum"];
            expect(playDrumBlock).toBeDefined();
            expect(playDrumBlock.palette).toBe("drum");
            expect(playDrumBlock.isBeginner).toBe(true);
            connectToStart(activity, "playdrum");
            expect(activity.blocks.blockList[0].connections[1]).toBe(1);
            expect(activity.blocks.blockList[1].connections[0]).toBe(0);
        });

        it("adds SetDrum block to Start block", () => {
            const setDrumBlock = DummyFlowBlock.createdBlocks["setdrum"];
            expect(setDrumBlock).toBeDefined();
            expect(setDrumBlock.palette).toBe("drum");
            expect(setDrumBlock.isBeginner).toBe(true);
            connectToStart(activity, "setdrum");
            expect(activity.blocks.blockList[0].connections[1]).toBe(1);
            expect(activity.blocks.blockList[1].connections[0]).toBe(0);
        });

        it("adds PlayEffect block to Start block", () => {
            const playEffectBlock = DummyFlowBlock.createdBlocks["playeffect"];
            expect(playEffectBlock).toBeDefined();
            expect(playEffectBlock.palette).toBe("drum");
            expect(playEffectBlock.isBeginner).toBe(true);
            connectToStart(activity, "playeffect");
            expect(activity.blocks.blockList[0].connections[1]).toBe(1);
            expect(activity.blocks.blockList[1].connections[0]).toBe(0);
        });
    });

    // Advanced drum palette blocks (hidden in beginner mode)
    describe("advanced mode", () => {
        beforeEach(() => {
            resetActivity(false);
        });

        it("adds PlayNoise block to Start block", () => {
            const playNoiseBlock = DummyFlowBlock.createdBlocks["playnoise"];
            expect(playNoiseBlock).toBeDefined();
            expect(playNoiseBlock.palette).toBe("drum");
            expect(playNoiseBlock.isBeginner).not.toBe(true);
            connectToStart(activity, "playnoise");
            expect(activity.blocks.blockList[0].connections[1]).toBe(1);
            expect(activity.blocks.blockList[1].connections[0]).toBe(0);
        });

        it("adds MapDrum block to Start block", () => {
            const mapDrumBlock = DummyFlowBlock.createdBlocks["mapdrum"];
            expect(mapDrumBlock).toBeDefined();
            expect(mapDrumBlock.palette).toBe("drum");
            expect(mapDrumBlock.isBeginner).not.toBe(true);
            connectToStart(activity, "mapdrum");
            expect(activity.blocks.blockList[0].connections[1]).toBe(1);
            expect(activity.blocks.blockList[1].connections[0]).toBe(0);
        });

        // Cowbell is a macro drum defined in DrumBlocks.js.
        it("adds Cowbell macro block to Start block", () => {
            const cowbellBlock = DummyFlowBlock.createdBlocks["cowbell"];
            expect(cowbellBlock).toBeDefined();
            expect(cowbellBlock.palette).toBe("drum");
            expect(cowbellBlock.isBeginner).not.toBe(true);
            connectToStart(activity, "cowbell");
            expect(activity.blocks.blockList[0].connections[1]).toBe(1);
            expect(activity.blocks.blockList[1].connections[0]).toBe(0);
        });
    });
});
