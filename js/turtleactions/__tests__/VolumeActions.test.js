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
    let synthVolumeSpy;
    let masterVolumeSpy;
    let crescendoEndSpy;
    let beginArticulationSpy;
    let endArticulationSpy;
    let loadSynthSpy;
    let triggerSpy;
    let setDispatchBlockSpy;

    beforeAll(() => {
        global.Singer = {
            VolumeActions: {},
            setSynthVolume: jest.fn(),
            setMasterVolume: jest.fn(),
            masterVolume: [],
        };
        
        global.instruments = {
            0: { 
                synth1: { connect: jest.fn() },
                piano: { connect: jest.fn() }
            },
        };
        
        global.Tone = {
            Panner: jest.fn((value) => ({
                toDestination: jest.fn(),
                pan: { value: value || 0 },
            })),
        };
        
        global.last = jest.fn(array => array[array.length - 1]);
        global._ = jest.fn(msg => msg);
        global.VOICENAMES = { 
            Piano: ["Piano", "piano"],
            Violin: ["Violin", "violin"]
        };
        global.DRUMNAMES = { 
            Kick: ["Kick", "kick"],
            Snare: ["Snare", "snare"]
        };
        global.DEFAULTVOLUME = 50;
        global.DEFAULTVOICE = "default";
    });

    beforeEach(() => {
        if (synthVolumeSpy) synthVolumeSpy.mockClear();
        if (masterVolumeSpy) masterVolumeSpy.mockClear();
        if (crescendoEndSpy) crescendoEndSpy.mockClear();
        if (beginArticulationSpy) beginArticulationSpy.mockClear();
        if (endArticulationSpy) endArticulationSpy.mockClear();
        if (loadSynthSpy) loadSynthSpy.mockClear();
        if (triggerSpy) triggerSpy.mockClear();
        if (setDispatchBlockSpy) setDispatchBlockSpy.mockClear();
        
        jest.useFakeTimers();
        
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
                blockList: {},
            },
            logo: {
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                synth: {
                    loadSynth: jest.fn(),
                    setMasterVolume: jest.fn(),
                    trigger: jest.fn(),
                },
                notation: {
                    notationBeginArticulation: jest.fn(),
                    notationEndArticulation: jest.fn(),
                    notationEndCrescendo: jest.fn(),
                },
                blockList: {
                    1: { connections: [{}, {}] },
                    2: { connections: [{}] },
                    "testBlock": { connections: [null, 2] },
                    "emptyBlock": { connections: [] },
                    "oneConnectionBlock": { connections: [3] },
                },
            },
            errorMsg: jest.fn(),
        };
        
        synthVolumeSpy = jest.spyOn(Singer, "setSynthVolume");
        masterVolumeSpy = jest.spyOn(Singer, "setMasterVolume");
        crescendoEndSpy = jest.spyOn(activity.logo.notation, "notationEndCrescendo");
        beginArticulationSpy = jest.spyOn(activity.logo.notation, "notationBeginArticulation");
        endArticulationSpy = jest.spyOn(activity.logo.notation, "notationEndArticulation");
        loadSynthSpy = jest.spyOn(activity.logo.synth, "loadSynth");
        triggerSpy = jest.spyOn(activity.logo.synth, "trigger");
        setDispatchBlockSpy = jest.spyOn(activity.logo, "setDispatchBlock");
    
        targetTurtle = {
            singer: {
                synthVolume: { 
                    default: [DEFAULTVOLUME],
                    piano: [DEFAULTVOLUME]
                },
                crescendoInitialVolume: { 
                    default: [DEFAULTVOLUME],
                    piano: [DEFAULTVOLUME]
                },
                crescendoDelta: [],
                inCrescendo: [],
                instrumentNames: ["default", "piano"],
                suppressOutput: false,
                justCounting: [],
                panner: null
            },
        };
        
        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
        
        setupVolumeActions(activity);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe("doCrescendo", () => {
        test.each([
            ["crescendo", 10, 10],
            ["decrescendo", 10, -10]
        ])("sets up %s correctly", (type, value, expected) => {
            Singer.VolumeActions.doCrescendo(type, value, 0, 1);
            expect(targetTurtle.singer.crescendoDelta).toContain(expected);
            expect(targetTurtle.singer.synthVolume.default.length).toBeGreaterThan(1);
            expect(targetTurtle.singer.inCrescendo).toContain(true);
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(0, "_crescendo_0", expect.any(Function));
        });

        test("handles dispatch block, mouse listener, and run flag", () => {
            activity.blocks.blockList[1] = {};
            const mockMouse = { MB: { listeners: [] } };
            Mouse.getMouseFromTurtle.mockReturnValue(mockMouse);

            Singer.VolumeActions.doCrescendo("crescendo", 10, 0, 1);

            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_crescendo_0");
            expect(mockMouse.MB.listeners).toHaveLength(0);

            MusicBlocks.isRun = false;
            activity.logo.setDispatchBlock.mockClear();
            Mouse.getMouseFromTurtle.mockClear();
            Singer.VolumeActions.doCrescendo("crescendo", 15, 0);
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(Mouse.getMouseFromTurtle).not.toHaveBeenCalled();
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(0, "_crescendo_0", expect.any(Function));
        });

        test.each([
            [[], false],
            [[true], true]
        ])("listener execution with justCounting %p", (justCounting, noCall) => {
            targetTurtle.singer.justCounting = justCounting;
            Singer.VolumeActions.doCrescendo("crescendo", 10, 0, 1);
            const listener = activity.logo.setTurtleListener.mock.calls.pop()[2];
            listener();
            if (!noCall) {
                expect(crescendoEndSpy).toHaveBeenCalledWith(0, 10);
            } else {
                expect(crescendoEndSpy).not.toHaveBeenCalled();
            }
        });
    });

    describe("setRelativeVolume", () => {
        it("should adjust volume relatively for all synths", () => {
            targetTurtle.singer.synthVolume = {
                default: [50],
                piano: [60]
            };
            
            Singer.VolumeActions.setRelativeVolume(20, 0, 1);
            
            expect(targetTurtle.singer.synthVolume.default).toContain(60);
            expect(targetTurtle.singer.synthVolume.piano).toContain(72);
            expect(synthVolumeSpy).toHaveBeenCalledWith(activity.logo, 0, "default", 60);
            expect(synthVolumeSpy).toHaveBeenCalledWith(activity.logo, 0, "piano", 72);
        });
        
        it("should clamp relative volume to max 100", () => {
            targetTurtle.singer.synthVolume = {
                default: [90]
            };
            
            Singer.VolumeActions.setRelativeVolume(50, 0, 1);
            
            expect(targetTurtle.singer.synthVolume.default).toContain(100);
        });
        
        it("should clamp relative volume to min -100", () => {
            targetTurtle.singer.synthVolume = {
                default: [50]
            };
            
            Singer.VolumeActions.setRelativeVolume(-300, 0, 1);
            
            expect(targetTurtle.singer.synthVolume.default).toContain(-100);
        });
        
        it("should call notationBeginArticulation when justCounting is empty", () => {
            Singer.VolumeActions.setRelativeVolume(20, 0, 1);
            
            expect(beginArticulationSpy).toHaveBeenCalledWith(0);
        });
        
        it("should not call notationBeginArticulation when justCounting is not empty", () => {
            targetTurtle.singer.justCounting = [true];
            
            Singer.VolumeActions.setRelativeVolume(20, 0, 1);
            
            expect(beginArticulationSpy).not.toHaveBeenCalled();
        });
        
        it("should use dispatch block when block is provided", () => {
            activity.blocks.blockList[1] = {};
            Singer.VolumeActions.setRelativeVolume(20, 0, 1);
            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_articulation_0");
        });
        
        it("should add listener to mouse when MusicBlocks.isRun is true", () => {
            const mockMouse = { MB: { listeners: [] } };
            Mouse.getMouseFromTurtle.mockReturnValue(mockMouse);
            
            Singer.VolumeActions.setRelativeVolume(20, 0);
            
            expect(mockMouse.MB.listeners).toContain("_articulation_0");
        });
        
        it("should execute listener correctly", () => {
            targetTurtle.singer.synthVolume = {
                default: [50, 60],
                piano: [60, 72]
            };
            
            Singer.VolumeActions.setRelativeVolume(20, 0, 1);
            const listener = activity.logo.setTurtleListener.mock.calls[0][2];
            listener();
            
            expect(targetTurtle.singer.synthVolume.default).toHaveLength(2);
            expect(targetTurtle.singer.synthVolume.piano).toHaveLength(2);
            expect(synthVolumeSpy).toHaveBeenCalledWith(activity.logo, 0, "default", 60);
            expect(synthVolumeSpy).toHaveBeenCalledWith(activity.logo, 0, "piano", 72);
            expect(endArticulationSpy).toHaveBeenCalledWith(0);
        });
        
        it("should not call notationEndArticulation when justCounting is not empty", () => {
            targetTurtle.singer.justCounting = [true];
            
            Singer.VolumeActions.setRelativeVolume(20, 0, 1);
            const listener = activity.logo.setTurtleListener.mock.calls[0][2];
            listener();
            
            expect(endArticulationSpy).not.toHaveBeenCalled();
        });

        it("should not call setSynthVolume when suppressOutput is true", () => {
            targetTurtle.singer.suppressOutput = true;
            Singer.VolumeActions.setRelativeVolume(30, 0, 1);
            expect(synthVolumeSpy).not.toHaveBeenCalled();
        });

        it("should not call setDispatchBlock or mouse listener when MusicBlocks.isRun is false and blk is undefined", () => {
            MusicBlocks.isRun = false;
            Singer.VolumeActions.setRelativeVolume(25, 0);
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(Mouse.getMouseFromTurtle).not.toHaveBeenCalled();
            // but we still register the turtle listener
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
                0,
                "_articulation_0",
                expect.any(Function)
            );
        });
    });

    // setMasterVolume tests
    describe("setMasterVolume", () => {
        it("should set master volume correctly", () => {
            Singer.VolumeActions.setMasterVolume(80, 0, 1);
            
            expect(Singer.masterVolume).toContain(80);
            expect(masterVolumeSpy).toHaveBeenCalledWith(activity.logo, 80, 1);
        });
        
        it("should clamp master volume to min 0", () => {
            Singer.VolumeActions.setMasterVolume(-10, 0, 1);
            
            expect(Singer.masterVolume).toContain(0);
            expect(activity.errorMsg).toHaveBeenCalledWith("Setting volume to 0.", 1);
        });
        
        it("should clamp master volume to max 100", () => {
            Singer.VolumeActions.setMasterVolume(120, 0, 1);
            
            expect(Singer.masterVolume).toContain(100);
        });
        
        it("should pop from masterVolume when length is 2", () => {
            Singer.masterVolume = [50, 60];
            Singer.VolumeActions.setMasterVolume(80, 0, 1);
            expect(Singer.masterVolume).toEqual([50, 80]);
        });
        
        it("should not call setMasterVolume when suppressOutput is true", () => {
            targetTurtle.singer.suppressOutput = true;
            
            Singer.VolumeActions.setMasterVolume(80, 0, 1);
            
            expect(masterVolumeSpy).not.toHaveBeenCalled();
        });
    });

    describe("setPanning", () => {
        it("should create new panner when none exists", () => {
            targetTurtle.singer.panner = null;
            Singer.VolumeActions.setPanning(50, 0);
            expect(Tone.Panner).toHaveBeenCalledWith(0.5);
            const inst = Tone.Panner.mock.results[0].value;
            expect(inst.toDestination).toHaveBeenCalled();
        });
        
        it("should update existing panner when one exists", () => {
            targetTurtle.singer.panner = new Tone.Panner(0);
            
            Singer.VolumeActions.setPanning(50, 0);
            
            expect(targetTurtle.singer.panner.pan.value).toBe(0.5);
        });
        
        it("should clamp panning value to range [-1, 1]", () => {
            Singer.VolumeActions.setPanning(150, 0);
            expect(Tone.Panner).toHaveBeenCalledWith(1);
            const inst1 = Tone.Panner.mock.results[0].value;
            expect(inst1.pan.value).toBe(1);

            Singer.VolumeActions.setPanning(-150, 0);
            expect(Tone.Panner).toHaveBeenCalledWith(-1);
            const inst2 = Tone.Panner.mock.results[1].value;
            expect(inst2.pan.value).toBe(-1);
        });
        
        it("should connect all instruments to the panner", () => {
            const connectSpy = jest.spyOn(instruments[0].synth1, "connect");
            const connectSpyPiano = jest.spyOn(instruments[0].piano, "connect");
            
            Singer.VolumeActions.setPanning(50, 0);
            
            expect(connectSpy).toHaveBeenCalledWith(targetTurtle.singer.panner);
            expect(connectSpyPiano).toHaveBeenCalledWith(targetTurtle.singer.panner);
        });
    });

    describe("setSynthVolume", () => {
        it("should set volume for default voice", () => {
            Singer.VolumeActions.setSynthVolume(DEFAULTVOICE, 70, 0, "testBlock");
            
            expect(targetTurtle.singer.synthVolume[DEFAULTVOICE]).toContain(70);
            expect(synthVolumeSpy).toHaveBeenCalledWith(activity.logo, 0, DEFAULTVOICE, 70);
        });
        
        it("should set volume for custom synth", () => {
            Singer.VolumeActions.setSynthVolume("custom", 70, 0, "testBlock");
            
            expect(targetTurtle.singer.synthVolume.custom).toContain(70);
            expect(synthVolumeSpy).toHaveBeenCalledWith(activity.logo, 0, "custom", 70);
        });
        
        it("should identify and set volume for voice type from VOICENAMES", () => {
            Singer.VolumeActions.setSynthVolume("Piano", 70, 0, "testBlock");
            expect(targetTurtle.singer.synthVolume.piano).toContain(70);
            
            Singer.VolumeActions.setSynthVolume("violin", 60, 0, "testBlock");
            expect(targetTurtle.singer.synthVolume.violin).toContain(60);
        });
        
        it("should identify and set volume for drum type from DRUMNAMES", () => {
            Singer.VolumeActions.setSynthVolume("Kick", 70, 0, "testBlock");
            expect(targetTurtle.singer.synthVolume.kick).toContain(70);
            
            Singer.VolumeActions.setSynthVolume("snare", 60, 0, "testBlock");
            expect(targetTurtle.singer.synthVolume.snare).toContain(60);
        });
        
        it("should handle invalid synth name", () => {
            Singer.VolumeActions.setSynthVolume("invalidSynth", 70, 0, "testBlock");
            expect(activity.errorMsg).toHaveBeenCalledWith("nullnot found");
            expect(targetTurtle.singer.synthVolume[DEFAULTVOICE]).toContain(70);
        });
        
        it("should load synth when not in instrumentNames", () => {
            targetTurtle.singer.instrumentNames = ["default"];
            
            Singer.VolumeActions.setSynthVolume("piano", 70, 0, "testBlock");
            
            expect(targetTurtle.singer.instrumentNames).toContain("piano");
            expect(loadSynthSpy).toHaveBeenCalledWith(0, "piano");
        });
        
        it("should initialize synthVolume and crescendoInitialVolume when undefined", () => {
            delete targetTurtle.singer.synthVolume.violin;
            delete targetTurtle.singer.crescendoInitialVolume.violin;
            
            Singer.VolumeActions.setSynthVolume("violin", 70, 0, "testBlock");
            
            expect(targetTurtle.singer.synthVolume.violin).toEqual([DEFAULTVOLUME, 70]);
            expect(targetTurtle.singer.crescendoInitialVolume.violin).toEqual([DEFAULTVOLUME]);
        });
        
        it("should not call setSynthVolume when suppressOutput is true", () => {
            targetTurtle.singer.suppressOutput = true;
            
            Singer.VolumeActions.setSynthVolume(DEFAULTVOICE, 70, 0, "testBlock");
            
            expect(synthVolumeSpy).not.toHaveBeenCalled();
        });
        
        it("should trigger tone when firstConnection and lastConnection are null", () => {
            Singer.VolumeActions.setSynthVolume(DEFAULTVOICE, 70, 0, null);
            
            jest.advanceTimersByTime(250);
            
            expect(triggerSpy).toHaveBeenCalledWith(0, "G4", 1/4, DEFAULTVOICE, null, null, false);
        });
        
        it("should not trigger tone when connections exist", () => {
            Singer.VolumeActions.setSynthVolume(DEFAULTVOICE, 70, 0, "testBlock");
            
            jest.advanceTimersByTime(250);
            
            expect(triggerSpy).not.toHaveBeenCalled();
        });
    });

    describe("getter methods", () => {
        it("should get master volume correctly", () => {
            Singer.masterVolume = [60];
            
            expect(Singer.VolumeActions.masterVolume).toBe(60);
        });
        
        it("should get synth volume correctly when synth exists", () => {
            targetTurtle.singer.synthVolume.piano = [50, 70];
            
            expect(Singer.VolumeActions.getSynthVolume("piano", 0)).toBe(70);
        });
        
        it("should return undefined when getting volume for non-existent synth", () => {
            expect(Singer.VolumeActions.getSynthVolume("nonExistentSynth", 0)).toBeUndefined();
        });
    });

    describe("edge cases and combinations", () => {
        it("should handle case where synthVolume is undefined", () => {
            delete targetTurtle.singer.synthVolume.default;
            
            Singer.VolumeActions.setRelativeVolume(20, 0, 1);
            
            expect(targetTurtle.singer.synthVolume.piano).toBeDefined();
        });
        
        it("should handle empty crescendoInitialVolume", () => {
            targetTurtle.singer.crescendoInitialVolume = {};
            
            Singer.VolumeActions.doCrescendo("crescendo", 10, 0, 1);
            
            expect(targetTurtle.singer.crescendoInitialVolume.default).toBeDefined();
            expect(targetTurtle.singer.crescendoInitialVolume.piano).toBeDefined();
        });
        
        it("should handle null mouse", () => {
            Mouse.getMouseFromTurtle.mockReturnValue(null);
            
            Singer.VolumeActions.doCrescendo("crescendo", 10, 0);
            
            expect(activity.logo.setTurtleListener).toHaveBeenCalled();
        });
    });
});