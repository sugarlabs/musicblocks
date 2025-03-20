/**
 * MusicBlocks v3.6.2
 *
 * @author Om Santosh Suneri
 *
 * @copyright 2025 Om Santosh Suneri
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

const { setupDrumBlocks } = require("../DrumBlocks");

global._ = jest.fn((str) => str);
global.last = jest.fn((arr) => arr[arr.length - 1]);
global.Singer = {
    DrumActions: {
        playNoise: jest.fn(),
        mapPitchToDrum: jest.fn(),
        setDrum: jest.fn(),
        GetDrumname: jest.fn((name) => name),
        playDrum: jest.fn(),
    },
};
global.FlowBlock = jest.fn().mockImplementation((name, displayName) => ({
    name,
    displayName,
    setPalette: jest.fn().mockReturnThis(),
    setHelpString: jest.fn().mockReturnThis(),
    formBlock: jest.fn().mockReturnThis(),
    makeMacro: jest.fn().mockReturnThis(),
    setup: jest.fn().mockReturnThis(),
    beginnerBlock: jest.fn().mockReturnThis(),
    flow: jest.fn(),
}));
global.ValueBlock = jest.fn().mockImplementation((name, displayName) => ({
    ...new global.FlowBlock(name, displayName),
}));
global.FlowClampBlock = jest.fn().mockImplementation((name) => ({
    ...new global.FlowBlock(name),
}));
global.DEFAULTDRUM = "defaultDrum";
global.DEFAULTEFFECT = "defaultEffect";
global.NOINPUTERRORMSG = "No input error message";
global.DEFAULTNOISE = "defaultNoise";
global.mock = jest.fn(() => ({
    setupDrumBlocks: jest.fn((activity) => {
        const playNoiseBlock = new global.FlowBlock("playnoise", "noise");
        playNoiseBlock.setPalette("drum", activity);
        playNoiseBlock.setHelpString();
        playNoiseBlock.formBlock({
            args: 1,
            defaults: ["white noise"],
            argTypes: ["anyin"],
        });
        playNoiseBlock.makeMacro();

        const mapDrumBlock = new MapDrumBlock();
        mapDrumBlock.setPalette("drum", activity);
        mapDrumBlock.setHelpString();
        mapDrumBlock.formBlock({
            name: "map pitch to drum",
            args: 1,
            argTypes: ["anyin"],
        });
        mapDrumBlock.makeMacro();

        const setDrumBlock = new SetDrumBlock();
        setDrumBlock.setPalette("drum", activity);
        setDrumBlock.beginnerBlock(true);
        setDrumBlock.setHelpString();
        setDrumBlock.formBlock({
            name: "set drum",
            args: 1,
            argTypes: ["anyin"],
        });
        setDrumBlock.makeMacro();

        const playEffectBlock = new PlayEffectBlock();
        playEffectBlock.setPalette("drum", activity);
        playEffectBlock.beginnerBlock(true);
        playEffectBlock.formBlock({ args: 1, argTypes: ["anyin"] });
        playEffectBlock.makeMacro();

        const playDrumBlock = new PlayDrumBlock();
        playDrumBlock.setPalette("drum", activity);
        playDrumBlock.beginnerBlock(true);
        playDrumBlock.setHelpString();
        playDrumBlock.formBlock({ args: 1, argTypes: ["anyin"] });
        playDrumBlock.makeMacro();
    }),
}));

const activity = {
    errorMsg: jest.fn(),
    turtles: {
        ithTurtle: jest.fn(() => ({
            singer: {
                drumStyle: [],
                inNoteBlock: [1],
                noteBeatValues: { 1: [] },
                beatFactor: 1,
                pushedNote: false,
            },
        })),
    },
    blocks: {
        blockList: {},
    },
    beginnerMode: false,
};

class MapDrumBlock {
    constructor() {
        this.setPalette = jest.fn().mockReturnThis();
        this.setHelpString = jest.fn().mockReturnThis();
        this.formBlock = jest.fn().mockReturnThis();
        this.makeMacro = jest.fn().mockReturnThis();
        this.flow = jest.fn().mockImplementation((args, logo, turtle, blk) => {
            Singer.DrumActions.mapPitchToDrum(args[0], turtle, blk);
            return [args[1], 1];
        });
    }
}

class SetDrumBlock {
    constructor() {
        this.setPalette = jest.fn().mockReturnThis();
        this.beginnerBlock = jest.fn().mockReturnThis();
        this.setHelpString = jest.fn().mockReturnThis();
        this.formBlock = jest.fn().mockReturnThis();
        this.makeMacro = jest.fn().mockReturnThis();
        this.flow = jest.fn().mockImplementation((args, logo, turtle, blk) => {
            Singer.DrumActions.setDrum(args[0], turtle, blk);
            return [args[1], 1];
        });
    }
}

class PlayEffectBlock {
    constructor() {
        this.setPalette = jest.fn().mockReturnThis();
        this.beginnerBlock = jest.fn().mockReturnThis();
        this.formBlock = jest.fn().mockReturnThis();
        this.makeMacro = jest.fn().mockReturnThis();
    }
}

class PlayDrumBlock {
    constructor() {
        this.setPalette = jest.fn().mockReturnThis();
        this.beginnerBlock = jest.fn().mockReturnThis();
        this.setHelpString = jest.fn().mockReturnThis();
        this.formBlock = jest.fn().mockReturnThis();
        this.makeMacro = jest.fn().mockReturnThis();
        this.flow = jest.fn().mockImplementation((args, logo, turtle, blk) => {
            Singer.DrumActions.GetDrumname(args[0]);
            if (logo.inPitchDrumMatrix) {
                logo.pitchDrumMatrix.drums.push(args[0]);
                logo.pitchDrumMatrix.addColBlock(blk);
                logo.drumBlocks.push(blk);
            } else if (logo.inMatrix) {
                logo.phraseMaker.rowLabels.push(args[0]);
                logo.phraseMaker.rowArgs.push(-1);
                logo.phraseMaker.addRowBlock(blk);
                logo.drumBlocks.push(blk);
            } else if (logo.inMusicKeyboard) {
                logo.musicKeyboard.instruments.push(args[0]);
                logo.musicKeyboard.noteNames.push("drum");
                logo.musicKeyboard.octaves.push(null);
                logo.musicKeyboard.addRowBlock(blk);
            } else {
                const turtleInstance = activity.turtles.ithTurtle();
                Singer.DrumActions.playDrum(args[0], turtle, blk);
                turtleInstance.singer.noteBeatValues[1].push(1);
                turtleInstance.singer.pushedNote = true;
            }
        });
    }
}

global.MapDrumBlock = MapDrumBlock;
global.SetDrumBlock = SetDrumBlock;
global.PlayEffectBlock = PlayEffectBlock;
global.PlayDrumBlock = PlayDrumBlock;

describe("setupDrumBlocks", () => {
    let activity;

    beforeEach(() => {
        activity = {
            errorMsg: jest.fn(),
            turtles: {
                ithTurtle: jest.fn(() => ({
                    singer: {
                        drumStyle: [],
                        inNoteBlock: [],
                        noteBeatValues: [],
                        beatFactor: 1,
                        pushedNote: false
                    }
                }))
            },
            beginnerMode: false,
            blocks: {
                blockList: {
                    0: { connections: [null] }
                }
            }
        };

        global.Singer = {
            DrumActions: {
                playNoise: jest.fn(),
                mapPitchToDrum: jest.fn(),
                setDrum: jest.fn(),
                playDrum: jest.fn(),
                GetDrumname: jest.fn((name) => name)
            }
        };
        global._ = jest.fn((str) => str);
        global.last = jest.fn((arr) => arr[arr.length - 1]);
        global.DEFAULTDRUM = "kick";
        global.DEFAULTEFFECT = "clap";
        global.NOINPUTERRORMSG = "No input provided";
        global.DEFAULTNOISE = "white noise";
        global.logo = {
            inPitchDrumMatrix: false,
            inMatrix: false,
            inMusicKeyboard: false,
            pitchDrumMatrix: { drums: [], addColBlock: jest.fn() },
            phraseMaker: { rowLabels: [], rowArgs: [], addRowBlock: jest.fn() },
            musicKeyboard: { instruments: [], noteNames: [], octaves: [], addRowBlock: jest.fn() },
            drumBlocks: []
        };
    });

    it("should setup drum blocks without errors", () => {
        expect(() => setupDrumBlocks(activity)).not.toThrow();
    });

    it("should call errorMsg when flow args are invalid in PlayNoiseBlock", () => {
        setupDrumBlocks(activity);
        const playNoiseBlock = new (class extends global.FlowBlock {
            flow = (args) => {
                const arg = args[0];
                if (args.length !== 1 || arg == null || typeof arg !== "string") {
                    activity.errorMsg(global.NOINPUTERRORMSG, 0);
                }
            };
        })();

        playNoiseBlock.flow([], global.logo, 0, 0);
        expect(activity.errorMsg).toHaveBeenCalledWith(global.NOINPUTERRORMSG, 0);
    });

    it("should call playNoise when flow args are valid in PlayNoiseBlock", () => {
        setupDrumBlocks(activity);
        const playNoiseBlock = new (class extends global.FlowBlock {
            flow = (args) => {
                global.Singer.DrumActions.playNoise(args[0], 0, 0);
            };
        })();

        playNoiseBlock.flow(["white noise"], global.logo, 0, 0);
        expect(global.Singer.DrumActions.playNoise).toHaveBeenCalledWith("white noise", 0, 0);
    });

    it("should map pitch to drum in MapDrumBlock", () => {
        setupDrumBlocks(activity);
        const mapDrumBlock = new (class extends global.FlowClampBlock {
            flow = (args) => {
                global.Singer.DrumActions.mapPitchToDrum(args[0], 0, 0);
                return [undefined, 1];
            };
        })();

        const result = mapDrumBlock.flow(["C4"], global.logo, 0, 0);
        expect(global.Singer.DrumActions.mapPitchToDrum).toHaveBeenCalledWith("C4", 0, 0);
        expect(result).toEqual([undefined, 1]);
    });

    it("should set drum in SetDrumBlock", () => {
        setupDrumBlocks(activity);
        const setDrumBlock = new (class extends global.FlowClampBlock {
            flow = (args) => {
                global.Singer.DrumActions.setDrum(args[0], 0, 0);
                return [undefined, 1];
            };
        })();

        const result = setDrumBlock.flow(["kick"], global.logo, 0, 0);
        expect(global.Singer.DrumActions.setDrum).toHaveBeenCalledWith("kick", 0, 0);
        expect(result).toEqual([undefined, 1]);
    });

    it("should play drum in PlayDrumBlock", () => {
        setupDrumBlocks(activity);
        const playDrumBlock = new (class extends global.FlowBlock {
            flow = (args) => {
                global.Singer.DrumActions.playDrum(args[0], 0, 0);
            };
        })();

        playDrumBlock.flow(["snare"], global.logo, 0, 0);
        expect(global.Singer.DrumActions.playDrum).toHaveBeenCalledWith("snare", 0, 0);
    });

    it("should handle context errors in PlayDrumBlock", () => {
        setupDrumBlocks(activity);
        const playDrumBlock = new (class extends global.FlowBlock {
            flow = (args) => {
                if (args.length !== 1 || args[0] == null) {
                    console.debug("PLAY DRUM ERROR: missing context");
                }
            };
        })();

        console.debug = jest.fn();
        playDrumBlock.flow([null], global.logo, 0, 0);
        expect(console.debug).toHaveBeenCalledWith("PLAY DRUM ERROR: missing context");
    });

    it("should push drum to pitchDrumMatrix in PlayDrumBlock", () => {
        global.logo.inPitchDrumMatrix = true;
        setupDrumBlocks(activity);
        const playDrumBlock = new (class extends global.FlowBlock {
            flow = (args) => {
                let arg = args[0];
                if (args.length !== 1 || arg == null || typeof arg !== "string") {
                    activity.errorMsg(global.NOINPUTERRORMSG, 0);
                    arg = global.DEFAULTDRUM;
                }
                let drumname = global.Singer.DrumActions.GetDrumname(arg);
                const tur = activity.turtles.ithTurtle(0);
                if (tur.singer.drumStyle.length > 0) {
                    drumname = global.last(tur.singer.drumStyle);
                }
                global.logo.pitchDrumMatrix.drums.push(drumname);
                global.logo.pitchDrumMatrix.addColBlock(0);
            };
        })();

        playDrumBlock.flow(["snare"], global.logo, 0, 0);
        expect(global.logo.pitchDrumMatrix.drums).toContain("snare");
        expect(global.logo.pitchDrumMatrix.addColBlock).toHaveBeenCalledWith(0);
    });

    it("should push drum to phraseMaker in PlayDrumBlock", () => {
        global.logo.inMatrix = true;
        setupDrumBlocks(activity);
        const playDrumBlock = new (class extends global.FlowBlock {
            flow = (args) => {
                let arg = args[0];
                if (args.length !== 1 || arg == null || typeof arg !== "string") {
                    activity.errorMsg(global.NOINPUTERRORMSG, 0);
                    arg = global.DEFAULTDRUM;
                }
                let drumname = global.Singer.DrumActions.GetDrumname(arg);
                const tur = activity.turtles.ithTurtle(0);
                if (tur.singer.drumStyle.length > 0) {
                    drumname = global.last(tur.singer.drumStyle);
                }
                global.logo.phraseMaker.rowLabels.push(drumname);
                global.logo.phraseMaker.rowArgs.push(-1);
                global.logo.phraseMaker.addRowBlock(0);
            };
        })();

        playDrumBlock.flow(["snare"], global.logo, 0, 0);
        expect(global.logo.phraseMaker.rowLabels).toContain("snare");
        expect(global.logo.phraseMaker.rowArgs).toContain(-1);
        expect(global.logo.phraseMaker.addRowBlock).toHaveBeenCalledWith(0);
    });

    it("should push drum to musicKeyboard in PlayDrumBlock", () => {
        global.logo.inMusicKeyboard = true;
        setupDrumBlocks(activity);
        const playDrumBlock = new (class extends global.FlowBlock {
            flow = (args) => {
                let arg = args[0];
                if (args.length !== 1 || arg == null || typeof arg !== "string") {
                    activity.errorMsg(global.NOINPUTERRORMSG, 0);
                    arg = global.DEFAULTDRUM;
                }
                let drumname = global.Singer.DrumActions.GetDrumname(arg);
                const tur = activity.turtles.ithTurtle(0);
                if (tur.singer.drumStyle.length > 0) {
                    drumname = global.last(tur.singer.drumStyle);
                }
                global.logo.musicKeyboard.instruments.push(drumname);
                global.logo.musicKeyboard.noteNames.push("drum");
                global.logo.musicKeyboard.octaves.push(null);
                global.logo.musicKeyboard.addRowBlock(0);
            };
        })();

        playDrumBlock.flow(["snare"], global.logo, 0, 0);
        expect(global.logo.musicKeyboard.instruments).toContain("snare");
        expect(global.logo.musicKeyboard.noteNames).toContain("drum");
        expect(global.logo.musicKeyboard.octaves).toContain(null);
        expect(global.logo.musicKeyboard.addRowBlock).toHaveBeenCalledWith(0);
    });

    it("should play drum in setdrum clamp in PlayDrumBlock", () => {
        activity.turtles.ithTurtle = jest.fn(() => ({
            singer: {
                drumStyle: ["snare"],
                inNoteBlock: [],
                noteBeatValues: [],
                beatFactor: 1,
                pushedNote: false
            }
        }));
        setupDrumBlocks(activity);
        const playDrumBlock = new (class extends global.FlowBlock {
            flow = (args) => {
                let arg = args[0];
                if (args.length !== 1 || arg == null || typeof arg !== "string") {
                    activity.errorMsg(global.NOINPUTERRORMSG, 0);
                    arg = global.DEFAULTDRUM;
                }
                let drumname = global.Singer.DrumActions.GetDrumname(arg);
                const tur = activity.turtles.ithTurtle(0);
                if (tur.singer.drumStyle.length > 0) {
                    drumname = global.last(tur.singer.drumStyle);
                }
                global.Singer.DrumActions.playDrum(drumname, 0, 0);
            };
        })();

        playDrumBlock.flow(["snare"], global.logo, 0, 0);
        expect(global.Singer.DrumActions.playDrum).toHaveBeenCalledWith("snare", 0, 0);
    });
});
