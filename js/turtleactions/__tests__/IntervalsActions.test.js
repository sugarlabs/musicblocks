/**
 * @license
 * MusicBlocks v3.6.2
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
const { setupIntervalsActions } = require("../IntervalsActions");

describe("setupIntervalsActions", () => {
    let activity;
    let turtle;
    let logo;

    beforeEach(() => {
        jest.resetModules();

        global._ = x => x;
        global.NOINPUTERRORMSG = "NOINPUT";

        global.MUSICALMODES = {
            major: [2, 2, 1, 2, 2, 2, 1],
            minor: [2, 1, 2, 2, 1, 2, 2]
        };

        global.ALLNOTESTEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        global.NOTENAMES = ["C", "D", "E", "F", "G", "A", "B"];

        global.SEMITONETOINTERVALMAP = Array(13)
            .fill(null)
            .map(() => Array(7).fill("perfect"));

        global.GetNotesForInterval = jest.fn(() => ({
            firstNote: "C",
            secondNote: "G",
            octave: 0
        }));

        global.getNote = jest.fn(() => ["C"]);
        global.getModeLength = jest.fn(() => 7);

        global.MusicBlocks = { isRun: false };
        global.Mouse = { getMouseFromTurtle: jest.fn() };

        global.Singer = {};

        turtle = {
            singer: {
                keySignature: "C major",
                transposition: 0,
                movable: false,
                intervals: [],
                chordIntervals: [],
                semitoneIntervals: [],
                ratioIntervals: [],
                noteDirection: 1,
                defineMode: []
            }
        };

        logo = {
            synth: {
                inTemperament: null,
                startingPitch: null,
                changeInTemperament: false
            },
            notation: {
                notationKey: jest.fn()
            },
            temperamentSelected: [],
            setDispatchBlock: jest.fn(),
            setTurtleListener: jest.fn()
        };

        activity = {
            turtles: {
                ithTurtle: () => turtle
            },
            blocks: {
                blockList: {},
                updateBlockText: jest.fn()
            },
            logo,
            errorMsg: jest.fn()
        };

        setupIntervalsActions(activity);
    });

    describe("GetModename", () => {
        test("returns exact mode key from MUSICALMODES", () => {
            expect(Singer.IntervalsActions.GetModename("major")).toBe("major");
            expect(Singer.IntervalsActions.GetModename("minor")).toBe("minor");
        });

        test("returns 'major' as fallback when no match is found", () => {
            expect(Singer.IntervalsActions.GetModename("nonexistent")).toBe("major");
            expect(Singer.IntervalsActions.GetModename("invalidMode")).toBe("major");
        });

        test("handles invalid input gracefully", () => {
            expect(Singer.IntervalsActions.GetModename(null)).toBe("major");
            expect(Singer.IntervalsActions.GetModename(undefined)).toBe("major");
            expect(Singer.IntervalsActions.GetModename("")).toBe("major");
            expect(Singer.IntervalsActions.GetModename(123)).toBe("major");
        });

        test("matches localized mode name via _() function", () => {
            // Mock _() to return a localized version
            global._ = x => (x === "minor" ? "moll" : x);

            // When searching for localized name, it should find the original key
            expect(Singer.IntervalsActions.GetModename("moll")).toBe("minor");

            // Reset the mock
            global._ = x => x;
        });

        test("prefers exact key match over localized match", () => {
            // Create a fresh MUSICALMODES where "moll" comes before a mode that localizes to "moll"
            const originalModes = global.MUSICALMODES;
            global.MUSICALMODES = {
                moll: [2, 1, 2, 2, 1, 3, 1],
                minor: [2, 1, 2, 2, 1, 2, 2]
            };

            // Mock _() to translate "minor" to "moll"
            global._ = x => (x === "minor" ? "moll" : x);

            // "moll" should match the exact key "moll" since it's checked in the condition first
            expect(Singer.IntervalsActions.GetModename("moll")).toBe("moll");

            // Restore original
            global.MUSICALMODES = originalModes;
            global._ = x => x;
        });
    });

    test("GetIntervalNumber base case", () => {
        expect(typeof Singer.IntervalsActions.GetIntervalNumber(0)).toBe("number");
    });

    test("GetIntervalNumber octave > 1", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "C",
            octave: 2
        });
        expect(Singer.IntervalsActions.GetIntervalNumber(0)).toBeGreaterThan(12);
    });

    test("GetIntervalNumber octave < -1", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "D",
            octave: -3
        });
        expect(typeof Singer.IntervalsActions.GetIntervalNumber(0)).toBe("number");
    });

    test("GetCurrentInterval normal", () => {
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    test("GetCurrentInterval perfect octave above", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "C",
            octave: 2
        });
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    test("GetCurrentInterval perfect octave below", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "C",
            octave: -1
        });
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    test("GetCurrentInterval octave < -1", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "G",
            secondNote: "C",
            octave: -2
        });
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    test("GetCurrentInterval totalIntervals > 21", () => {
        GetNotesForInterval.mockReturnValueOnce({
            firstNote: "C",
            secondNote: "B",
            octave: 3
        });
        expect(typeof Singer.IntervalsActions.GetCurrentInterval(0)).toBe("string");
    });

    test("setKey updates keySignature", () => {
        Singer.IntervalsActions.setKey("C", "major", 0);
        expect(turtle.singer.keySignature).toContain("C");
        expect(logo.notation.notationKey).toHaveBeenCalled();
    });

    test("getCurrentKey / Mode / Length", () => {
        expect(Singer.IntervalsActions.getCurrentKey(0)).toBe("C");
        expect(Singer.IntervalsActions.getCurrentMode(0)).toBe("major");
        expect(Singer.IntervalsActions.getModeLength(0)).toBe(7);
    });

    test("setMovableDo", () => {
        Singer.IntervalsActions.setMovableDo(true, 0);
        expect(turtle.singer.movable).toBe(true);
    });

    test("setScalarInterval push + pop", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setScalarInterval(2, 0, "blk");
        expect(turtle.singer.intervals.length).toBe(1);
        listener();
        expect(turtle.singer.intervals.length).toBe(0);
    });

    test("setScalarInterval error on null", () => {
        Singer.IntervalsActions.setScalarInterval(null, 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
    });

    test("setChordInterval push + pop", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setChordInterval([1, 0], 0, "blk");
        expect(turtle.singer.chordIntervals.length).toBe(1);
        listener();
        expect(turtle.singer.chordIntervals.length).toBe(0);
    });

    test("setChordInterval error on null", () => {
        Singer.IntervalsActions.setChordInterval(null, 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        expect(turtle.singer.chordIntervals).toContainEqual([1, 0]);
    });

    test("setChordInterval MusicBlocks.isRun adds to mouse listeners", () => {
        const mockMouse = { MB: { listeners: [] } };
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

        Singer.IntervalsActions.setChordInterval([2, 1], 0, undefined);

        expect(mockMouse.MB.listeners).toContain("_chord_interval_0");
    });

    test("setSemitoneInterval zero ignored", () => {
        Singer.IntervalsActions.setSemitoneInterval(0, 0);
        expect(turtle.singer.semitoneIntervals.length).toBe(0);
    });

    test("setSemitoneInterval push + pop", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setSemitoneInterval(2, 0, "blk");
        expect(turtle.singer.semitoneIntervals.length).toBe(1);
        listener();
        expect(turtle.singer.semitoneIntervals.length).toBe(0);
    });

    test("setSemitoneInterval error on null", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setSemitoneInterval(null, 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        // Default value of 1 should be used
        expect(turtle.singer.semitoneIntervals.length).toBe(1);
    });

    test("setSemitoneInterval MusicBlocks.isRun adds to mouse listeners", () => {
        const mockMouse = { MB: { listeners: [] } };
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

        Singer.IntervalsActions.setSemitoneInterval(3, 0, undefined);

        expect(mockMouse.MB.listeners).toContain("_semitone_interval_0");
    });

    test("setRatioInterval push + pop", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));
        Singer.IntervalsActions.setRatioInterval(1.5, 0, "blk");
        expect(turtle.singer.ratioIntervals.length).toBe(1);
        listener();
        expect(turtle.singer.ratioIntervals.length).toBe(0);
    });

    test("setRatioInterval error on null", () => {
        Singer.IntervalsActions.setRatioInterval(null, 0, "blk");
        expect(activity.errorMsg).toHaveBeenCalledWith("NOINPUT", "blk");
        // Default value of 1 should be used
        expect(turtle.singer.ratioIntervals).toContain(1);
    });

    test("setRatioInterval MusicBlocks.isRun adds to mouse listeners", () => {
        const mockMouse = { MB: { listeners: [] } };
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

        Singer.IntervalsActions.setRatioInterval(2.0, 0, undefined);

        expect(mockMouse.MB.listeners).toContain("_ratio_interval_0");
    });

    test("defineMode success path", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        activity.blocks.blockList.blk = { connections: [null, "text1"] };
        activity.blocks.blockList.text1 = { name: "text" };

        Singer.IntervalsActions.defineMode("custom", 0, "blk");

        turtle.singer.defineMode.push(0, 4, 7);
        listener();

        expect(MUSICALMODES.custom).toBeDefined();
    });

    test("defineMode error paths", () => {
        let listener;
        logo.setTurtleListener.mockImplementation((_, __, fn) => (listener = fn));

        activity.blocks.blockList.blk = { connections: [null, "text1"] };
        activity.blocks.blockList.text1 = { name: "text" };

        Singer.IntervalsActions.defineMode(null, 0, "blk");

        turtle.singer.defineMode.push(4);
        turtle.singer.defineMode.push(12);
        turtle.singer.defineMode.push(4);

        listener();

        expect(activity.errorMsg).toHaveBeenCalled();
    });

    test("setTemperament state changes", () => {
        Singer.IntervalsActions.setTemperament("equal", "C", 4);
        expect(logo.synth.inTemperament).toBe("equal");
        expect(logo.synth.startingPitch).toBe("C4");
    });

    test("setTemperament change flag", () => {
        Singer.IntervalsActions.setTemperament("equal", "C", 4);
        Singer.IntervalsActions.setTemperament("pythagorean", "C", 4);
        expect(logo.synth.changeInTemperament).toBe(true);
    });
});
