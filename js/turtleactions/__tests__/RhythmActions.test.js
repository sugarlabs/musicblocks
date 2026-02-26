/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Shreya Saxena
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

const setupRhythmActions = require("../RhythmActions");

describe("setupRhythmActions", () => {
    let activity;
    let targetTurtle;

    beforeAll(() => {
        global._ = msg => msg;
        global.last = arr => arr[arr.length - 1];
        global.TONEBPM = 120;

        global.Singer = {
            processNote: jest.fn()
        };

        global.MusicBlocks = { isRun: false };
        global.Mouse = {
            getMouseFromTurtle: jest.fn(() => ({ MB: { listeners: [] } }))
        };
    });

    beforeEach(() => {
        targetTurtle = {
            id: 0,
            singer: {
                inNoteBlock: [],
                notesPlayed: [0, 1],
                pickup: 0.5,
                noteValuePerBeat: 1,
                beatsPerMeasure: 4,
                beatList: [],
                factorList: [],
                beatFactor: 1,
                currentBeat: null,
                currentMeasure: null,

                // below fields are touched later in function
                noteValue: {},
                multipleVoices: false,
                inNeighbor: [],
                neighborArgBeat: [],
                neighborArgCurrentBeat: [],
                oscList: {},
                noteBeat: {},
                noteBeatValues: {},
                notePitches: {},
                noteOctaves: {},
                noteCents: {},
                noteHertz: {},
                noteDrums: {},
                embeddedGraphics: {}
            }
        };

        activity = {
            turtles: {
                ithTurtle: jest.fn(() => targetTurtle)
            },
            blocks: {
                blockList: {}
            },
            stage: {
                dispatchEvent: jest.fn()
            },
            logo: {
                clearNoteParams: jest.fn(),
                setDispatchBlock: jest.fn(),
                setTurtleListener: jest.fn(),
                notation: {
                    notationVoices: jest.fn()
                },
                pitchBlocks: [],
                drumBlocks: []
            }
        };

        setupRhythmActions(activity);
    });

    it("sets beat and measure to 0 when pickup not crossed", () => {
        const enqueue = jest.fn();

        Singer.RhythmActions.playNote(1, "note", 0, 1, enqueue);

        expect(targetTurtle.singer.currentBeat).toBe(0);
        expect(targetTurtle.singer.currentMeasure).toBe(0);
    });

    it("sets correct beat and measure when pickup is crossed", () => {
        const enqueue = jest.fn();

        targetTurtle.singer.notesPlayed = [2, 1]; // pickup crossed
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;
        targetTurtle.singer.beatList = [];
        targetTurtle.singer.factorList = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1, enqueue);

        expect(targetTurtle.singer.currentBeat).toBe(3);
        expect(targetTurtle.singer.currentMeasure).toBe(1);
    });

    it("triggers everybeat event when beatList contains 'everybeat'", () => {
        const enqueue = jest.fn();

        targetTurtle.singer.notesPlayed = [1, 1]; // pickup crossed
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.beatList = ["everybeat"];
        targetTurtle.singer.factorList = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1, enqueue);

        expect(enqueue).toHaveBeenCalled();
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__everybeat_0__");
    });

    it("triggers specific beat event when beatList contains current beat", () => {
        const enqueue = jest.fn();

        // setup so beat = 2
        targetTurtle.singer.notesPlayed = [1, 1]; // 1 beat played
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;

        targetTurtle.singer.beatList = [2];
        targetTurtle.singer.factorList = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1, enqueue);

        expect(targetTurtle.singer.currentBeat).toBe(2);
        expect(enqueue).toHaveBeenCalled();
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__beat_2_0__");
    });

    it("triggers offbeat event when beatList contains 'offbeat' and beat > 1", () => {
        const enqueue = jest.fn();

        // make beat = 2
        targetTurtle.singer.notesPlayed = [1, 1]; // beat = 1 → beatValue = 2
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;

        targetTurtle.singer.beatList = ["offbeat"];
        targetTurtle.singer.factorList = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1, enqueue);

        expect(targetTurtle.singer.currentBeat).toBe(2);
        expect(enqueue).toHaveBeenCalled();
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__offbeat_0__");
    });
    it("triggers factorList beat event when beat matches factor", () => {
        const enqueue = jest.fn();

        // beat = 2
        targetTurtle.singer.notesPlayed = [1, 1]; // beatValue = 2
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;

        targetTurtle.singer.beatList = [];
        targetTurtle.singer.factorList = [2];

        Singer.RhythmActions.playNote(1, "note", 0, 1, enqueue);

        expect(enqueue).toHaveBeenCalled();
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__beat_2_0__");
    });
    it("adds rest note when inside a note block", () => {
        // setup: one active note block
        targetTurtle.singer.inNoteBlock = [1];
        targetTurtle.singer.beatFactor = 1;

        targetTurtle.singer.notePitches[1] = [];
        targetTurtle.singer.noteOctaves[1] = [];
        targetTurtle.singer.noteCents[1] = [];
        targetTurtle.singer.noteHertz[1] = [];
        targetTurtle.singer.noteBeatValues[1] = [];

        Singer.RhythmActions.playRest(0);

        expect(targetTurtle.singer.notePitches[1]).toContain("rest");
        expect(targetTurtle.singer.noteOctaves[1]).toContain(4);
        expect(targetTurtle.singer.noteCents[1]).toContain(0);
        expect(targetTurtle.singer.noteHertz[1]).toContain(0);
        expect(targetTurtle.singer.noteBeatValues[1]).toContain(1);
        expect(targetTurtle.singer.pushedNote).toBe(true);
    });
    it("updates dotCount and beatFactor for valid dot value", () => {
        targetTurtle.singer.dotCount = 0;
        targetTurtle.singer.beatFactor = 1;

        Singer.RhythmActions.doRhythmicDot(1, 0, 1);

        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).not.toBe(1);
    });

    it("shows error when dot value is -1", () => {
        targetTurtle.singer.dotCount = 0;
        targetTurtle.singer.beatFactor = 1;

        activity.errorMsg = jest.fn();

        Singer.RhythmActions.doRhythmicDot(-1, 0, 1);

        expect(activity.errorMsg).toHaveBeenCalledWith(
            "An argument of -1 results in a note value of 0.",
            1
        );
        expect(targetTurtle.singer.dotCount).toBe(0);
    });

    it("multiplies beatFactor correctly", () => {
        targetTurtle.singer.beatFactor = 2;

        Singer.RhythmActions.multiplyNoteValue(2, 0, 1);

        expect(targetTurtle.singer.beatFactor).toBe(1);
    });

    it("adds swing when not suppressed", () => {
        targetTurtle.singer.suppressOutput = false;
        targetTurtle.singer.swing = [];
        targetTurtle.singer.swingTarget = [];

        Singer.RhythmActions.addSwing(2, 4, 0, 1);

        expect(targetTurtle.singer.swing).toContain(0.5);
        expect(targetTurtle.singer.swingTarget).toContain(0.25);
    });
    it("removes swing on listener execution", () => {
        targetTurtle.singer.suppressOutput = false;
        targetTurtle.singer.swing = [];
        targetTurtle.singer.swingTarget = [];

        let listener;
        activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
            listener = cb;
        });

        Singer.RhythmActions.addSwing(2, 4, 0, 1);
        listener();

        expect(targetTurtle.singer.swing.length).toBe(0);
        expect(targetTurtle.singer.swingTarget.length).toBe(0);
    });

    it("returns note value from active note", () => {
        targetTurtle.singer.inNoteBlock = [1];
        targetTurtle.singer.noteValue = { 1: 0.25 };

        const value = Singer.RhythmActions.getNoteValue(0);

        expect(value).toBe(0.25);
    });
    it("falls back to lastNotePlayed when no active note", () => {
        targetTurtle.singer.inNoteBlock = [];
        targetTurtle.singer.lastNotePlayed = [null, 8];

        const value = Singer.RhythmActions.getNoteValue(0);

        expect(value).toBe(0.125);
    });
    it("returns 0 when no note info exists", () => {
        targetTurtle.singer.inNoteBlock = [];
        targetTurtle.singer.lastNotePlayed = null;

        const value = Singer.RhythmActions.getNoteValue(0);

        expect(value).toBe(0);
    });

    describe("doTie", () => {
        // Store original implementations to restore after tests
        let originalGetMouseFromTurtle;
        let originalIsRun;

        beforeEach(() => {
            // Store original values before each test
            originalGetMouseFromTurtle = global.Mouse.getMouseFromTurtle;
            originalIsRun = global.MusicBlocks.isRun;

            targetTurtle.singer.tie = false;
            targetTurtle.singer.tieNotePitches = [];
            targetTurtle.singer.tieNoteExtras = [];
            targetTurtle.singer.tieCarryOver = 0;
            targetTurtle.singer.tieFirstDrums = [];
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.bpm = [];
            activity.logo.notation = {
                ...activity.logo.notation,
                notationRemoveTie: jest.fn(),
                notationStaging: { 0: [] }
            };
            activity.blocks.blockList = { 1: { name: "note" } };
        });

        afterEach(() => {
            // Restore MusicBlocks.isRun to its default value
            global.MusicBlocks.isRun = originalIsRun;

            // Restore Mouse.getMouseFromTurtle to its original implementation
            global.Mouse.getMouseFromTurtle = originalGetMouseFromTurtle;

            // Clear Jest mocks to avoid state leakage across tests
            jest.clearAllMocks();
        });

        it("initializes tie state correctly", () => {
            Singer.RhythmActions.doTie(0, 1);

            expect(targetTurtle.singer.tie).toBe(true);
            expect(targetTurtle.singer.tieNotePitches).toEqual([]);
            expect(targetTurtle.singer.tieNoteExtras).toEqual([]);
            expect(targetTurtle.singer.tieCarryOver).toBe(0);
            expect(targetTurtle.singer.tieFirstDrums).toEqual([]);
        });

        it("sets dispatch block when blk is in blockList", () => {
            Singer.RhythmActions.doTie(0, 1);

            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(1, 0, "_tie_0");
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
                0,
                "_tie_0",
                expect.any(Function)
            );
        });

        it("adds listener to mouse when MusicBlocks.isRun and blk undefined", () => {
            const mockMouse = { MB: { listeners: [] } };
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

            Singer.RhythmActions.doTie(0, undefined);

            expect(mockMouse.MB.listeners).toContain("_tie_0");
        });

        it("cleans up tie state on listener when tieCarryOver is 0", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });

            Singer.RhythmActions.doTie(0, 1);

            // Simulate some tie data that should be cleaned up
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 0]];
            targetTurtle.singer.tieNoteExtras = [1, [], [], [], []];
            targetTurtle.singer.tieCarryOver = 0;

            listener();

            expect(targetTurtle.singer.tie).toBe(false);
            expect(targetTurtle.singer.tieNotePitches).toEqual([]);
            expect(targetTurtle.singer.tieNoteExtras).toEqual([]);
        });

        it("plays remaining note when tieCarryOver > 0", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });

            // Mock doWait on turtle
            targetTurtle.doWait = jest.fn();

            // Add saveBlk to blockList so listener can access blockList[saveBlk].name
            activity.blocks.blockList[5] = { name: "note" };

            // Call doTie first - this initializes state and captures the listener
            Singer.RhythmActions.doTie(0, 1);

            // Now set up the tieCarryOver state AFTER doTie (since doTie resets tieCarryOver to 0)
            // The listener uses tur.singer.tieCarryOver which is a reference
            targetTurtle.singer.inNoteBlock = [];
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.63]];
            targetTurtle.singer.tieNoteExtras = [
                5, // saveBlk
                ["sine"], // oscList
                1, // noteBeat
                [1], // noteBeatValues
                [] // noteDrums
            ];
            targetTurtle.singer.bpm = [120];

            listener();

            expect(Singer.processNote).toHaveBeenCalled();
            expect(targetTurtle.doWait).toHaveBeenCalled();
            expect(targetTurtle.singer.tie).toBe(false);
            expect(targetTurtle.singer.tieNotePitches).toEqual([]);
            expect(targetTurtle.singer.tieNoteExtras).toEqual([]);
        });

        it("removes tie from notation when justCounting is empty and tieCarryOver > 0", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });

            // Add saveBlk to blockList so listener can access blockList[saveBlk].name
            activity.blocks.blockList[5] = { name: "note" };

            targetTurtle.doWait = jest.fn();

            // Call doTie first
            Singer.RhythmActions.doTie(0, 1);

            // Set up state AFTER doTie (since doTie resets tieCarryOver to 0)
            targetTurtle.singer.inNoteBlock = [2];
            targetTurtle.singer.notePitches = { 2: ["C", "E"] };
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.63]];
            targetTurtle.singer.tieNoteExtras = [5, ["sine"], 1, [1], []];
            targetTurtle.singer.bpm = [120];

            listener();

            expect(activity.logo.notation.notationRemoveTie).toHaveBeenCalledTimes(2);
        });

        it("does not add mouse listener when mouse is null", () => {
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => null);

            Singer.RhythmActions.doTie(0, undefined);

            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            // Assert exact arguments passed to setTurtleListener
            expect(activity.logo.setTurtleListener).toHaveBeenCalledWith(
                0, // turtle index
                "_tie_0", // listener name
                expect.any(Function) // callback
            );
        });
    });
});
