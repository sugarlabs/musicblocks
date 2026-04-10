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
            processNote: jest.fn()
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
                ithTurtle: jest.fn()
            },
            blocks: {
                blockList: { 1: {} }
            },
            logo: {
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                clearNoteParams: jest.fn(),
                inRhythmRuler: false,
                rhythmRuler: { Drums: [], Rulers: [] },
                _currentDrumBlock: null
            },
            errorMsg: jest.fn()
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
            }
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

        it("should not overwrite existing synthVolume and crescendoInitialVolume", () => {
            targetTurtle.singer.inNoteBlock.push(5);
            targetTurtle.singer.noteDrums[5] = [];
            targetTurtle.singer.synthVolume = { drum1: [30] };
            targetTurtle.singer.crescendoInitialVolume = { drum1: [40] };
            Singer.DrumActions.playDrum("d1", 0, 5);
            expect(targetTurtle.singer.synthVolume["drum1"]).toEqual([30]);
            expect(targetTurtle.singer.crescendoInitialVolume["drum1"]).toEqual([40]);
        });

        it("should remove the block from inNoteBlock when the callback is invoked", () => {
            if (!targetTurtle.singer.noteDrums[2]) targetTurtle.singer.noteDrums[2] = [];
            Singer.DrumActions.playDrum("d1", 0, 2);
            expect(targetTurtle.singer.inNoteBlock).toContain(2);
            const callback = Singer.processNote.mock.calls[0][5];
            callback();
            expect(targetTurtle.singer.inNoteBlock).not.toContain(2);
        });
    });

    const actionConfigs = [
        ["setDrum", "_setdrum_0", true],
        ["mapPitchToDrum", "_mapdrum_0", false]
    ];
    describe.each(actionConfigs)("%s", (actionName, prefix, resetPitchDrumTable) => {
        beforeEach(() => {
            targetTurtle.singer.drumStyle = [];
            targetTurtle.singer.pitchDrumTable = {};
            activity.logo.setDispatchBlock.mockClear();
            activity.logo.setTurtleListener.mockClear();
            global.MusicBlocks.isRun = false;
            global.Mouse.getMouseFromTurtle.mockReturnValue(null);
        });

        it("sets drum style and listener", () => {
            Singer.DrumActions[actionName]("d1", 0, 1);
            expect(targetTurtle.singer.drumStyle).toContain("drum1");
            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, prefix);
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
                0,
                prefix,
                expect.any(Function)
            );
        });

        it("handles MusicBlocks.isRun case", () => {
            const mockMouse = { MB: { listeners: [] } };
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle.mockReturnValue(mockMouse);
            Singer.DrumActions[actionName]("d1", 0);
            expect(targetTurtle.singer.drumStyle).toContain("drum1");
            expect(mockMouse.MB.listeners).toContain(prefix);
        });

        it("handles direct drum name input", () => {
            Singer.DrumActions[actionName]("drum2", 0, 1);
            expect(targetTurtle.singer.drumStyle).toContain("drum2");
        });

        it("uses default drum for unknown drum name", () => {
            Singer.DrumActions[actionName]("unknownDrum", 0, 1);
            expect(targetTurtle.singer.drumStyle).toContain(DEFAULTDRUM);
        });

        it("handles rhythm ruler", () => {
            activity.logo.inRhythmRuler = true;
            Singer.DrumActions[actionName]("d1", 0, 1);
            expect(activity.logo._currentDrumBlock).toBe(1);
            expect(activity.logo.rhythmRuler.Drums).toContain(1);
            expect(activity.logo.rhythmRuler.Rulers).toHaveLength(1);
        });

        it("removes drumStyle on listener", () => {
            Singer.DrumActions[actionName]("d1", 0, 1);
            const listenerFn = activity.logo.setTurtleListener.mock.calls[0][2];
            listenerFn();
            expect(targetTurtle.singer.drumStyle).toHaveLength(0);
            if (resetPitchDrumTable) {
                expect(targetTurtle.singer.pitchDrumTable).toEqual({});
            }
        });

        it("only adds listener when blk undefined and not running", () => {
            Singer.DrumActions[actionName]("d1", 0);
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(global.Mouse.getMouseFromTurtle).not.toHaveBeenCalled();
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
                0,
                expect.any(String),
                expect.any(Function)
            );
        });

        it("skips mouse listener when isRun and mouse null", () => {
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle.mockReturnValue(null);
            Singer.DrumActions[actionName]("d1", 0);
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(global.Mouse.getMouseFromTurtle).toHaveBeenCalledWith(expect.any(Object));
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
                0,
                expect.any(String),
                expect.any(Function)
            );
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
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Noise Block: Did you mean to use a Note block?",
                1
            );
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

        it("should push unknown noise names directly", () => {
            targetTurtle.singer.inNoteBlock.push(3);
            targetTurtle.singer.noteDrums[3] = [];
            targetTurtle.singer.noteBeatValues[3] = [];
            Singer.DrumActions.playNoise("foo", 0, 3);
            expect(targetTurtle.singer.noteDrums[3]).toContain("foo");
        });

        it("should not reinitialize synthVolume if already defined", () => {
            targetTurtle.singer.inNoteBlock.push(4);
            targetTurtle.singer.noteDrums[4] = [];
            targetTurtle.singer.noteBeatValues[4] = [];
            targetTurtle.singer.synthVolume = { noise1: [50] };
            targetTurtle.singer.crescendoInitialVolume = { noise1: [60] };
            Singer.DrumActions.playNoise("n1", 0, 4);
            expect(targetTurtle.singer.synthVolume["noise1"]).toEqual([50]);
            expect(targetTurtle.singer.crescendoInitialVolume["noise1"]).toEqual([60]);
        });
    });
});
