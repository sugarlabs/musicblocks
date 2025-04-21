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

const setupDrumActions = require("../DrumActions");

describe("setupDrumActions", () => {
    let activity;
    let turtle;
    let targetTurtle;

    beforeAll(() => {
        global.Singer = {
            DrumActions: {},
            processNote: jest.fn(),
        };
        global.DEFAULTDRUM = "defaultDrum";
        global.DRUMNAMES = { drum1: ["d1", "drum1"], drum2: ["d2", "drum2"] };
        global.NOISENAMES = { noise1: ["n1", "noise1"], noise2: ["n2", "noise2"] };
        global.DEFAULTVOLUME = 100;
        global.last = jest.fn(array => array[array.length - 1]);
        global._ = jest.fn(msg => msg);
        global.MusicBlocks = {
            isRun: false
        };
        global.Mouse = {
            getMouseFromTurtle: jest.fn()
        };
    });

    beforeEach(() => {
        activity = {
            turtles: {
                ithTurtle: jest.fn(),
            },
            blocks: {
                blockList: { 1: {} },
            },
            logo: {
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                clearNoteParams: jest.fn(),
                inRhythmRuler: false,
                rhythmRuler: { Drums: [], Rulers: [] },
                _currentDrumBlock: null
            },
            errorMsg: jest.fn(),
        };

        targetTurtle = {
            singer: {
                drumStyle: [],
                inNoteBlock: [],
                noteDrums: {},
                synthVolume: {},
                crescendoInitialVolume: {},
                noteBeatValues: {},
                beatFactor: 1,
                pushedNote: false,
                pitchDrumTable: {}
            },
        };

        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
        global.MusicBlocks.isRun = false;
        global.Mouse.getMouseFromTurtle.mockReturnValue(null);
        setupDrumActions(activity);
    });

    describe("GetDrumname", () => {
        it("should return the correct drum name when given nickname", () => {
            const result = Singer.DrumActions.GetDrumname("d1");
            expect(result).toBe("drum1");
        });
        
        it("should return the default drum for unknown drums", () => {
            const result = Singer.DrumActions.GetDrumname("unknown");
            expect(result).toBe(DEFAULTDRUM);
        });

        it("should return http URLs directly", () => {
            const httpDrum = "https://example.com/drum.wav";
            const result = Singer.DrumActions.GetDrumname(httpDrum);
            expect(result).toBe(httpDrum);
        });

        it("should handle direct drum names", () => {
            const result = Singer.DrumActions.GetDrumname("drum1");
            expect(result).toBe("drum1");
        });
    });

    describe("playDrum", () => {
        it("should play a standalone drum sound", () => {
            if (!targetTurtle.singer.noteDrums[1]) targetTurtle.singer.noteDrums[1] = [];
            Singer.DrumActions.playDrum("d1", 0, 1);
            expect(Singer.processNote).toHaveBeenCalledWith(
                activity,
                expect.any(Number),
                false,
                expect.anything(),
                0,
                expect.any(Function)
            );
            expect(activity.logo.clearNoteParams).toHaveBeenCalledWith(targetTurtle, 1, []);
            expect(targetTurtle.singer.inNoteBlock).toContain(1);
            expect(targetTurtle.singer.noteDrums[1]).toContain("drum1");
            expect(targetTurtle.singer.pushedNote).toBe(true);
        });
        
        it("should add a drum to an existing note block", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];
            Singer.DrumActions.playDrum("d1", 0, 1);
            expect(targetTurtle.singer.noteDrums[2]).toContain("drum1");
        });

        it("should use the drum style if one is set", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];
            targetTurtle.singer.drumStyle.push("drum2");
            
            Singer.DrumActions.playDrum("d1", 0, 1);
            
            expect(targetTurtle.singer.noteDrums[2]).toContain("drum2");
            expect(targetTurtle.singer.noteDrums[2]).not.toContain("drum1");
        });

        it("should initialize synthVolume if not defined", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];
            targetTurtle.singer.synthVolume = {};
            
            Singer.DrumActions.playDrum("d1", 0, 1);
            
            expect(targetTurtle.singer.synthVolume["drum1"]).toEqual([DEFAULTVOLUME]);
            expect(targetTurtle.singer.crescendoInitialVolume["drum1"]).toEqual([DEFAULTVOLUME]);
        });
    });

    describe("setDrum", () => {
        it("should set the drum style and add a listener", () => {
            Singer.DrumActions.setDrum("d1", 0, 1);
            expect(targetTurtle.singer.drumStyle).toContain("drum1");
            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_setdrum_0");
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(0, "_setdrum_0", expect.any(Function));
        });

        it("should handle MusicBlocks.isRun case", () => {
            const mockMouse = { MB: { listeners: [] } };
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle.mockReturnValue(mockMouse);
            
            Singer.DrumActions.setDrum("d1", 0);
            
            expect(targetTurtle.singer.drumStyle).toContain("drum1");
            expect(mockMouse.MB.listeners).toContain("_setdrum_0");
        });

        it("should handle direct drum name input", () => {
            Singer.DrumActions.setDrum("drum2", 0, 1);
            expect(targetTurtle.singer.drumStyle).toContain("drum2");
        });

        it("should handle rhythm ruler", () => {
            activity.logo.inRhythmRuler = true;
            
            Singer.DrumActions.setDrum("d1", 0, 1);
            
            expect(activity.logo._currentDrumBlock).toBe(1);
            expect(activity.logo.rhythmRuler.Drums).toContain(1);
            expect(activity.logo.rhythmRuler.Rulers).toHaveLength(1);
            expect(activity.logo.rhythmRuler.Rulers[0]).toEqual([[], []]);
        });

        it("should remove drumStyle and reset pitchDrumTable when listener is called", () => {
            Singer.DrumActions.setDrum("d1", 0, 1);
            
            // Extract the listener function
            const listenerFn = activity.logo.setTurtleListener.mock.calls[0][2];
            
            // Call the listener
            listenerFn();
            
            expect(targetTurtle.singer.drumStyle).toHaveLength(0);
            expect(targetTurtle.singer.pitchDrumTable).toEqual({});
        });
    });

    describe("mapPitchToDrum", () => {
        it("should map pitch to drum", () => {
            Singer.DrumActions.mapPitchToDrum("d1", 0, 1);
            expect(targetTurtle.singer.drumStyle).toContain("drum1");
            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_mapdrum_0");
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(0, "_mapdrum_0", expect.any(Function));
        });

        it("should handle MusicBlocks.isRun case", () => {
            const mockMouse = { MB: { listeners: [] } };
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle.mockReturnValue(mockMouse);
            
            Singer.DrumActions.mapPitchToDrum("d1", 0);
            
            expect(targetTurtle.singer.drumStyle).toContain("drum1");
            expect(mockMouse.MB.listeners).toContain("_mapdrum_0");
        });

        it("should handle direct drum name input", () => {
            Singer.DrumActions.mapPitchToDrum("drum2", 0, 1);
            expect(targetTurtle.singer.drumStyle).toContain("drum2");
        });

        it("should handle rhythm ruler", () => {
            activity.logo.inRhythmRuler = true;
            
            Singer.DrumActions.mapPitchToDrum("d1", 0, 1);
            
            expect(activity.logo._currentDrumBlock).toBe(1);
            expect(activity.logo.rhythmRuler.Drums).toContain(1);
            expect(activity.logo.rhythmRuler.Rulers).toHaveLength(1);
            expect(activity.logo.rhythmRuler.Rulers[0]).toEqual([[], []]);
        });

        it("should remove drumStyle when listener is called", () => {
            Singer.DrumActions.mapPitchToDrum("d1", 0, 1);
            
            // Extract the listener function
            const listenerFn = activity.logo.setTurtleListener.mock.calls[0][2];
            
            // Call the listener
            listenerFn();
            
            expect(targetTurtle.singer.drumStyle).toHaveLength(0);
        });
    });

    describe("playNoise", () => {
        it("should play noise in a note block", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];
            targetTurtle.singer.noteBeatValues[2] = [];
            Singer.DrumActions.playNoise("n1", 0, 1);
            expect(targetTurtle.singer.noteDrums[2]).toContain("noise1");
            expect(targetTurtle.singer.noteBeatValues[2]).toContain(1);
            expect(targetTurtle.singer.pushedNote).toBe(true);
        });

        it("should throw an error for standalone noise block", () => {
            Singer.DrumActions.playNoise("n1", 0, 1);
            expect(activity.errorMsg).toHaveBeenCalledWith("Noise Block: Did you mean to use a Note block?", 1);
        });

        it("should handle direct noise name input", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];
            targetTurtle.singer.noteBeatValues[2] = [];
            
            Singer.DrumActions.playNoise("noise2", 0, 1);
            
            expect(targetTurtle.singer.noteDrums[2]).toContain("noise2");
        });

        it("should initialize synthVolume if not defined", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];
            targetTurtle.singer.noteBeatValues[2] = [];
            targetTurtle.singer.synthVolume = {};
            
            Singer.DrumActions.playNoise("n1", 0, 1);
            
            expect(targetTurtle.singer.synthVolume["noise1"]).toEqual([DEFAULTVOLUME]);
            expect(targetTurtle.singer.crescendoInitialVolume["noise1"]).toEqual([DEFAULTVOLUME]);
        });
    });
});
