/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
 *
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

const setupVolumeActions = require("../VolumeActions");

describe("setupVolumeActions", () => {
    let activity;
    let targetTurtle;

    beforeAll(() => {
        global.Singer = {
            VolumeActions: {},
            setSynthVolume: jest.fn(),
            setMasterVolume: jest.fn(),
            masterVolume: [],
        };
        global.instruments = {
            0: { synth1: { connect: jest.fn() } },
        };
        global.Tone = {
            Panner: jest.fn(() => ({
                toDestination: jest.fn(),
                pan: { value: 0 },
            })),
        };
        global.last = jest.fn(array => array[array.length - 1]);
        global._ = jest.fn(msg => msg);
        global.VOICENAMES = { Piano: ["Piano", "piano"] };
        global.DRUMNAMES = { Kick: ["Kick", "kick"] };
        global.DEFAULTVOLUME = 50;
        global.DEFAULTVOICE = "default";
    });

    beforeEach(() => {
        global.Mouse = {
            getMouseFromTurtle: jest.fn().mockReturnValue({
                MB: { listeners: [] },
            }),
        };
        global.MusicBlocks = { isRun: true };
        activity = {
            turtles: {
                ithTurtle: jest.fn(),
            },
            blocks: {
                blockList: {
                    1: { connections: [{}, {}] },
                },
            },
            logo: {
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                synth: {
                    loadSynth: jest.fn(),
                    setMasterVolume: jest.fn(),
                },
                notation: {
                    notationBeginArticulation: jest.fn(),
                    notationEndArticulation: jest.fn(),
                    notationEndCrescendo: jest.fn(),
                },
                blockList: {
                    1: { connections: [{}, {}] },
                    2: { connections: [{}] },
                },
            },
            errorMsg: jest.fn(),
        };
    
        if (!activity.logo.blockList) {
            activity.logo.blockList = {};
        }
    
        activity.logo.blockList["testBlock"] = { connections: [{}] };
        targetTurtle = {
            singer: {
                synthVolume: { default: [DEFAULTVOLUME] },
                crescendoInitialVolume: { default: [DEFAULTVOLUME] },
                crescendoDelta: [],
                inCrescendo: [],
                instrumentNames: [],
                suppressOutput: false,
                justCounting: [],
                panner: new Tone.Panner(),
            },
        };
        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
    
        setupVolumeActions(activity);
        activity.errorMsg.mockImplementation((message) => {
            if (message.includes("not found")) {
                message = message.replace("null", "invalidSynth");
            }
            return message;
        });
    });
    

    it("should set master volume correctly", () => {
        Singer.VolumeActions.setMasterVolume(80, 0, 1);
        expect(Singer.masterVolume).toContain(80);
        expect(Singer.setMasterVolume).toHaveBeenCalledWith(activity.logo, 80, 1);
    });

    it("should handle out-of-range master volume", () => {
        Singer.VolumeActions.setMasterVolume(120, 0, 1);
        expect(Singer.masterVolume).toContain(100);
        expect(activity.errorMsg).not.toHaveBeenCalled();
        Singer.VolumeActions.setMasterVolume(-10, 0, 1);
        expect(Singer.masterVolume).toContain(0);
        expect(activity.errorMsg).toHaveBeenCalledWith(_("Setting volume to 0."), 1);
    });

    it("should set synth volume correctly", () => {
        targetTurtle.singer.synthVolume["default"] = [DEFAULTVOLUME];
        activity.logo.blockList = { testBlock: { connections: [{}] } };
        const someBlockId = "testBlock";
        Singer.VolumeActions.setSynthVolume("default", 70, 0, someBlockId);
        expect(targetTurtle.singer.synthVolume["default"]).toContain(70);
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(activity.logo, 0, "default", 70);
    });

    it("should apply crescendo correctly", () => {
        targetTurtle.singer.synthVolume["default"] = [DEFAULTVOLUME];
        targetTurtle.singer.crescendoInitialVolume["default"] = [DEFAULTVOLUME];
        Singer.VolumeActions.doCrescendo("crescendo", 10, 0, 1);
        expect(targetTurtle.singer.synthVolume["default"]).toHaveLength(2);
        expect(targetTurtle.singer.synthVolume["default"][1]).toBe(DEFAULTVOLUME);
        expect(targetTurtle.singer.crescendoInitialVolume["default"]).toHaveLength(2);
        expect(targetTurtle.singer.crescendoInitialVolume["default"][1]).toBe(DEFAULTVOLUME);
        expect(targetTurtle.singer.crescendoDelta).toContain(10);
        expect(activity.logo.setTurtleListener).toHaveBeenCalled();
    });
    
    it("should set panning correctly", () => {
        Singer.VolumeActions.setPanning(50, 0);
        expect(targetTurtle.singer.panner.pan.value).toBe(0.5);
        expect(Tone.Panner).toHaveBeenCalled();
    });

    it("should retrieve the correct master volume", () => {
        Singer.masterVolume.push(60);
        expect(Singer.VolumeActions.masterVolume).toBe(60);
    });

    it("should retrieve the correct synth volume", () => {
        targetTurtle.singer.synthVolume["default"] = [DEFAULTVOLUME, 70];
        const volume = Singer.VolumeActions.getSynthVolume("default", 0);
        expect(volume).toBe(70);
    });
   
    it("should set relative volume correctly", () => {
        if (!targetTurtle.singer.synthVolume["default"]) {
            targetTurtle.singer.synthVolume["default"] = [DEFAULTVOLUME];
        }
        Singer.VolumeActions.setRelativeVolume(20, 0, 1);
        expect(targetTurtle.singer.synthVolume["default"]).toHaveLength(2);
        expect(Singer.setSynthVolume).toHaveBeenCalled();
    });

    it("should handle out-of-range relative volume", () => {
        if (!targetTurtle.singer.synthVolume["default"]) {
            targetTurtle.singer.synthVolume["default"] = [DEFAULTVOLUME];
        }
        Singer.VolumeActions.setRelativeVolume(200, 0, 1);
        expect(targetTurtle.singer.synthVolume["default"]).toContain(100);
        Singer.VolumeActions.setRelativeVolume(-200, 0, 1);
        expect(targetTurtle.singer.synthVolume["default"]).toContain(-100);
    });

    it("should handle synth volume for different synths", () => {
        targetTurtle.singer.synthVolume = targetTurtle.singer.synthVolume || {};
        Singer.VolumeActions.setSynthVolume("piano", 60, 0, "testBlock");
        expect(targetTurtle.singer.synthVolume["piano"][targetTurtle.singer.synthVolume["piano"].length - 1]).toBe(60);
        Singer.VolumeActions.setSynthVolume("piano", 50, 0, "testBlock");
        expect(targetTurtle.singer.synthVolume["piano"][targetTurtle.singer.synthVolume["piano"].length - 1]).toBe(50);
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(activity.logo, 0, "piano", 50);
    });

    it("should use default voice when synth is not found", () => {
        activity.logo.blockList["testBlock"] = { connections: [{}] };
        Singer.VolumeActions.setSynthVolume("unknownSynth", 40, 0, "testBlock");
        expect(targetTurtle.singer.synthVolume["default"]).toContain(40);
    });

    it("should retrieve synth volume when synth exists", () => {
        targetTurtle.singer.synthVolume["piano"] = [50, 80];
        expect(Singer.VolumeActions.getSynthVolume("piano", 0)).toBe(80);
    });

    it("should return undefined when synth does not exist", () => {
        expect(Singer.VolumeActions.getSynthVolume("violin", 0)).toBeUndefined();
    });
    it("should handle doCrescendo correctly", () => {
        const initialVolume = 60;
        targetTurtle.singer.synthVolume["piano"] = [initialVolume];
        Singer.VolumeActions.doCrescendo("crescendo", 10, 0, "block1");
        expect(targetTurtle.singer.crescendoDelta).toContain(10);
        expect(targetTurtle.singer.synthVolume["piano"]).toContain(initialVolume);
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(0, "_crescendo_0", expect.any(Function));
    });

    it("should handle doDecrescendo correctly", () => {
        const initialVolume = 70;
        targetTurtle.singer.synthVolume["piano"] = [initialVolume];
        Singer.VolumeActions.doCrescendo("decrescendo", 20, 0, "block1");
        expect(targetTurtle.singer.crescendoDelta).toContain(-20);
        expect(targetTurtle.singer.synthVolume["piano"]).toContain(initialVolume);
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(0, "_crescendo_0", expect.any(Function));
    });

    it("should adjust relative volume correctly", () => {
        targetTurtle.singer.synthVolume["piano"] = [50];
        Singer.VolumeActions.setRelativeVolume(20, 0, "block1");
        expect(targetTurtle.singer.synthVolume["piano"]).toContain(60);
        expect(activity.logo.notation.notationBeginArticulation).toHaveBeenCalledWith(0);
        expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(0, "_articulation_0", expect.any(Function));
    });

    it("should adjust master volume correctly", () => {
        Singer.VolumeActions.setMasterVolume(75, 0, "block1");
        expect(Singer.masterVolume).toContain(75);
        expect(Singer.setMasterVolume).toHaveBeenCalledWith(activity.logo, 75, "block1");
    });

    it("should set synth volume correctly", () => {
        targetTurtle.singer.synthVolume["default"] = [DEFAULTVOLUME];
        activity.logo.blockList = { testBlock: { connections: [{}] } };
        const someBlockId = "testBlock";
        Singer.VolumeActions.setSynthVolume("default", 70, 0, someBlockId);
        expect(targetTurtle.singer.synthVolume["default"]).toContain(70);
        expect(Singer.setSynthVolume).toHaveBeenCalledWith(activity.logo, 0, "default", 70);
    });

    it("should not set volume for undefined synth", () => {
        const errorMsgSpy = jest.spyOn(activity, "errorMsg");
        activity.logo.blockList["testBlock"] = { connections: [{}] };
        Singer.VolumeActions.setSynthVolume("null", 50, 0, "testBlock");
        expect(errorMsgSpy).toHaveBeenCalledWith("nullnot found");
    });
});
