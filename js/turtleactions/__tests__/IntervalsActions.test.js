/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Anubhab
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
    let targetTurtle;

    beforeAll(() => {
        global.Singer = {
            DrumActions: {},
            processNote: jest.fn()
        };

        global.DEFAULTDRUM = "defaultDrum";
        global.DRUMNAMES = {
            drum1: ["d1", "drum1"],
            drum2: ["d2", "drum2"]
        };
        global.NOISENAMES = {
            noise1: ["n1", "noise1"],
            noise2: ["n2", "noise2"]
        };
        global.DEFAULTVOLUME = 100;
        global.last = jest.fn(arr => arr[arr.length - 1]);
        global._ = jest.fn(msg => msg);

        global.MusicBlocks = { isRun: false };
        global.Mouse = { getMouseFromTurtle: jest.fn() };
    });

    beforeEach(() => {
        activity = {
            turtles: { ithTurtle: jest.fn() },
            blocks: { blockList: { 1: {} } },
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
        MusicBlocks.isRun = false;
        Mouse.getMouseFromTurtle.mockReturnValue(null);

        setupDrumActions(activity);
    });

    describe("GetDrumname", () => {
        it("resolves nickname", () => {
            expect(Singer.DrumActions.GetDrumname("d1")).toBe("drum1");
        });

        it("falls back to default", () => {
            expect(Singer.DrumActions.GetDrumname("unknown")).toBe(DEFAULTDRUM);
        });

        it("returns URL unchanged", () => {
            const url = "https://example.com/drum.wav";
            expect(Singer.DrumActions.GetDrumname(url)).toBe(url);
        });

        it("accepts full drum name", () => {
            expect(Singer.DrumActions.GetDrumname("drum1")).toBe("drum1");
        });
    });

    describe("playDrum", () => {
        it("plays standalone drum", () => {
            targetTurtle.singer.noteDrums[1] = [];
            Singer.DrumActions.playDrum("d1", 0, 1);

            expect(Singer.processNote).toHaveBeenCalled();
            expect(activity.logo.clearNoteParams).toHaveBeenCalledWith(targetTurtle, 1, []);
            expect(targetTurtle.singer.inNoteBlock).toContain(1);
            expect(targetTurtle.singer.noteDrums[1]).toContain("drum1");
            expect(targetTurtle.singer.pushedNote).toBe(true);
        });

        it("adds drum to existing note block", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];

            Singer.DrumActions.playDrum("d1", 0, 1);
            expect(targetTurtle.singer.noteDrums[2]).toContain("drum1");
        });

        it("respects drum style", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];
            targetTurtle.singer.drumStyle.push("drum2");

            Singer.DrumActions.playDrum("d1", 0, 1);
            expect(targetTurtle.singer.noteDrums[2]).toContain("drum2");
        });

        it("initializes volume", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];
            targetTurtle.singer.synthVolume = {};

            Singer.DrumActions.playDrum("d1", 0, 1);
            expect(targetTurtle.singer.synthVolume.drum1).toEqual([DEFAULTVOLUME]);
            expect(targetTurtle.singer.crescendoInitialVolume.drum1).toEqual([DEFAULTVOLUME]);
        });

        it("keeps existing volume", () => {
            targetTurtle.singer.inNoteBlock.push(5);
            targetTurtle.singer.noteDrums[5] = [];
            targetTurtle.singer.synthVolume = { drum1: [30] };
            targetTurtle.singer.crescendoInitialVolume = { drum1: [40] };

            Singer.DrumActions.playDrum("d1", 0, 5);
            expect(targetTurtle.singer.synthVolume.drum1).toEqual([30]);
            expect(targetTurtle.singer.crescendoInitialVolume.drum1).toEqual([40]);
        });

        it("removes block on callback", () => {
            targetTurtle.singer.noteDrums[2] = [];
            Singer.DrumActions.playDrum("d1", 0, 2);

            const cb = Singer.processNote.mock.calls[0][5];
            cb();
            expect(targetTurtle.singer.inNoteBlock).not.toContain(2);
        });
    });

    describe.each([
        ["setDrum", "_setdrum_0", true],
        ["mapPitchToDrum", "_mapdrum_0", false]
    ])("%s", (action, prefix, resetTable) => {
        beforeEach(() => {
            targetTurtle.singer.drumStyle = [];
            targetTurtle.singer.pitchDrumTable = {};
            MusicBlocks.isRun = false;
            Mouse.getMouseFromTurtle.mockReturnValue(null);
        });

        it("sets drum and listener", () => {
            Singer.DrumActions[action]("d1", 0, 1);
            expect(targetTurtle.singer.drumStyle).toContain("drum1");
            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, prefix);
            expect(activity.logo.setTurtleListener).toHaveBeenCalled();
        });

        it("handles run mode", () => {
            const mouse = { MB: { listeners: [] } };
            MusicBlocks.isRun = true;
            Mouse.getMouseFromTurtle.mockReturnValue(mouse);

            Singer.DrumActions[action]("d1", 0);
            expect(mouse.MB.listeners).toContain(prefix);
        });

        it("cleans up on listener", () => {
            Singer.DrumActions[action]("d1", 0, 1);
            const fn = activity.logo.setTurtleListener.mock.calls[0][2];
            fn();
            expect(targetTurtle.singer.drumStyle).toHaveLength(0);
            if (resetTable) {
                expect(targetTurtle.singer.pitchDrumTable).toEqual({});
            }
        });
    });

    describe("playNoise", () => {
        it("plays noise in note", () => {
            targetTurtle.singer.inNoteBlock.push(2);
            targetTurtle.singer.noteDrums[2] = [];
            targetTurtle.singer.noteBeatValues[2] = [];

            Singer.DrumActions.playNoise("n1", 0, 1);
            expect(targetTurtle.singer.noteDrums[2]).toContain("noise1");
            expect(targetTurtle.singer.noteBeatValues[2]).toContain(1);
        });

        it("errors without note block", () => {
            Singer.DrumActions.playNoise("n1", 0, 1);
            expect(activity.errorMsg).toHaveBeenCalled();
        });
    });
});
