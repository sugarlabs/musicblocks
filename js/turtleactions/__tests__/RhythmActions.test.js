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
const { getMeasurePosition, getMeterAnchor } = require("../../utils/musicutils-rhythm");

describe("setupRhythmActions", () => {
    let activity;
    let targetTurtle;

    beforeAll(() => {
        global._ = msg => msg;
        global.last = arr => arr[arr.length - 1];
        global.TONEBPM = 120;
        global.getMeasurePosition = getMeasurePosition;

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
                beatFactorValues: [],
                dotCount: 0,
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
        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.currentBeat).toBe(0);
        expect(targetTurtle.singer.currentMeasure).toBe(0);
    });

    it("sets correct beat and measure when pickup is crossed", () => {
        targetTurtle.singer.notesPlayed = [2, 1]; // pickup crossed
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;
        targetTurtle.singer.beatList = [];
        targetTurtle.singer.factorList = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.currentBeat).toBe(3);
        expect(targetTurtle.singer.currentMeasure).toBe(1);
    });

    it("dispatches beat events counted from the latest meter change", () => {
        // Three beats of 3/4, then the first note of 4/4.
        targetTurtle.singer.notesPlayed = [3, 4];
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 4;
        targetTurtle.singer.beatsPerMeasure = 4;
        targetTurtle.singer.meterAnchor = { wholeNotes: 0.75, measures: 1 };
        targetTurtle.singer.beatList = [1];
        targetTurtle.singer.factorList = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.currentBeat).toBe(1);
        expect(targetTurtle.singer.currentMeasure).toBe(2);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__beat_1_0__");
    });

    // Each case plays one note per beat: an optional quarter-note pickup, then the first
    // meter, then the second. fired lists the beats after the pickup the event fires on.
    it.each([
        { from: [3, 4], to: [4, 4], pickup: 0, notes: [3, 8], every: 4, fired: [4, 8] },
        { from: [3, 4], to: [4, 4], pickup: 1 / 4, notes: [3, 8], every: 4, fired: [4, 8] },
        { from: [4, 4], to: [6, 8], pickup: 0, notes: [4, 12], every: 6, fired: [6, 12] },
        { from: [4, 4], to: [6, 8], pickup: 1 / 4, notes: [4, 12], every: 6, fired: [6, 12] },
        { from: [4, 4], to: [6, 8], pickup: 1 / 4, notes: [4, 12], every: 4, fired: [4, 8, 12, 16] }
    ])(
        "keeps 'every $every beats' counting the beats played from $from to $to, pickup $pickup",
        ({ from, to, pickup, notes, every, fired }) => {
            Object.assign(targetTurtle.singer, {
                pickup,
                beatsPerMeasure: from[0],
                noteValuePerBeat: from[1],
                meterAnchor: null,
                beatList: [],
                factorList: [every]
            });
            const durations = [
                ...(pickup ? [pickup] : []),
                ...Array(notes[0]).fill(1 / from[1]),
                ...Array(notes[1]).fill(1 / to[1])
            ];
            const firstBeat = pickup ? 1 : 0;
            const changeAt = firstBeat + notes[0];
            const firedOn = [];
            let wholeNotes = 0;
            durations.forEach((duration, n) => {
                targetTurtle.singer.notesPlayed = [wholeNotes * 64, 64];
                if (n === changeAt) {
                    targetTurtle.singer.meterAnchor = getMeterAnchor(targetTurtle.singer);
                    targetTurtle.singer.beatsPerMeasure = to[0];
                    targetTurtle.singer.noteValuePerBeat = to[1];
                }
                targetTurtle.singer.inNoteBlock = [];
                activity.stage.dispatchEvent.mockClear();

                Singer.RhythmActions.playNote(duration, "note", 0, 1);

                const calls = activity.stage.dispatchEvent.mock.calls;
                if (calls.some(call => call[0] === "__beat_" + every + "_0__")) {
                    firedOn.push(n + 1 - firstBeat);
                }
                wholeNotes += duration;
            });
            expect(firedOn).toEqual(fired);
        }
    );

    it("triggers everybeat event when beatList contains 'everybeat'", () => {
        targetTurtle.singer.notesPlayed = [1, 1]; // pickup crossed
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.beatList = ["everybeat"];
        targetTurtle.singer.factorList = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__everybeat_0__");
    });

    it("triggers specific beat event when beatList contains current beat", () => {
        // setup so beat = 2
        targetTurtle.singer.notesPlayed = [1, 1]; // 1 beat played
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;

        targetTurtle.singer.beatList = [2];
        targetTurtle.singer.factorList = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.currentBeat).toBe(2);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__beat_2_0__");
    });

    it("triggers offbeat event when beatList contains 'offbeat' and beat > 1", () => {
        // make beat = 2
        targetTurtle.singer.notesPlayed = [1, 1]; // beat = 1 → beatValue = 2
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;

        targetTurtle.singer.beatList = ["offbeat"];
        targetTurtle.singer.factorList = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.currentBeat).toBe(2);
        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__offbeat_0__");
    });
    it("triggers factorList beat event when beat matches factor", () => {
        // beat = 2
        targetTurtle.singer.notesPlayed = [1, 1]; // beatValue = 2
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;

        targetTurtle.singer.beatList = [];
        targetTurtle.singer.factorList = [2];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__beat_2_0__");
    });
    it("does not recompute beat/measure when already inside a note block", () => {
        targetTurtle.singer.inNoteBlock = [1];
        targetTurtle.singer.currentBeat = 7;
        targetTurtle.singer.currentMeasure = 9;

        Singer.RhythmActions.playNote(1, "note", 0, 2);

        expect(targetTurtle.singer.currentBeat).toBe(7);
        expect(targetTurtle.singer.currentMeasure).toBe(9);
    });

    it("divides (not multiplies) notesPlayed when checking whether pickup was crossed", () => {
        targetTurtle.singer.notesPlayed = [1, 4]; // 1/4 = 0.25 < 0.3 (not crossed); 1*4 = 4, not < 0.3
        targetTurtle.singer.pickup = 0.3;

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.currentBeat).toBe(0);
        expect(targetTurtle.singer.currentMeasure).toBe(0);
    });

    it("does not treat the pickup boundary itself as crossed", () => {
        targetTurtle.singer.notesPlayed = [1, 2]; // ratio === pickup
        targetTurtle.singer.pickup = 0.5;

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.currentBeat).toBe(1);
        expect(targetTurtle.singer.currentMeasure).toBe(1);
    });

    it("subtracts pickup (not adds) when computing beat", () => {
        targetTurtle.singer.notesPlayed = [3, 1];
        targetTurtle.singer.pickup = 1;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.currentBeat).toBe(3);
        expect(targetTurtle.singer.currentMeasure).toBe(1);
    });

    it("increments measureValue (not decrements) across multiple measures", () => {
        targetTurtle.singer.notesPlayed = [10, 1];
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.currentBeat).toBe(3);
        expect(targetTurtle.singer.currentMeasure).toBe(3);
    });

    it("computes thisBeat as beatValue plus (not minus) the prior-measures offset", () => {
        targetTurtle.singer.notesPlayed = [10, 1]; // beatValue=3, currentMeasure=3
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.noteValuePerBeat = 1;
        targetTurtle.singer.beatsPerMeasure = 4;
        targetTurtle.singer.factorList = [11]; // thisBeat = 3 + 4*(3-1) = 11

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(activity.stage.dispatchEvent).toHaveBeenCalledWith("__beat_11_0__");
    });

    it("does not dispatch everybeat when beatList excludes it", () => {
        targetTurtle.singer.notesPlayed = [1, 1];
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.beatList = ["somethingelse"];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(activity.stage.dispatchEvent).not.toHaveBeenCalledWith(
            expect.stringContaining("everybeat")
        );
    });

    it("does not dispatch offbeat when beatValue is not greater than 1", () => {
        targetTurtle.singer.notesPlayed = [0, 1]; // beatValue = 1
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.beatList = ["offbeat"];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(activity.stage.dispatchEvent).not.toHaveBeenCalledWith("__offbeat_0__");
    });

    it("does not dispatch a factorList event for a factor that does not evenly divide the beat", () => {
        targetTurtle.singer.notesPlayed = [1, 1]; // beatValue = 2
        targetTurtle.singer.pickup = 0;
        targetTurtle.singer.beatsPerMeasure = 4;
        targetTurtle.singer.factorList = [3];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(activity.stage.dispatchEvent).not.toHaveBeenCalledWith(
            expect.stringContaining("__beat_3_")
        );
    });

    it("inverts value only for newnote blocks, not for note/osctime blocks", () => {
        Singer.RhythmActions.playNote(4, "newnote", 0, 1);
        expect(targetTurtle.singer.noteValue[1]).toBe(4);

        targetTurtle.singer.inNoteBlock = [];
        Singer.RhythmActions.playNote(4, "note", 0, 2);
        expect(targetTurtle.singer.noteValue[2]).toBe(0.25);
    });

    it("divides (not multiplies) by beatFactor when computing noteValue", () => {
        targetTurtle.singer.beatFactor = 2;

        Singer.RhythmActions.playNote(4, "note", 0, 1);

        expect(targetTurtle.singer.noteValue[1]).toBeCloseTo(0.125);
    });

    it("pushes to both neighbor beat arrays with correct values when nextBeat is valid", () => {
        targetTurtle.singer.inNeighbor = [1];
        targetTurtle.singer.neighborNoteValue = [0.25];
        targetTurtle.singer.beatFactor = 1;

        Singer.RhythmActions.playNote(1, "note", 0, 1);
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();

        expect(targetTurtle.singer.neighborArgBeat).toEqual([4]);
        expect(targetTurtle.singer.neighborArgCurrentBeat).toEqual([2]);
    });

    it("pushes to neighborArgBeat but leaves neighborArgCurrentBeat unset when nextBeat is invalid", () => {
        targetTurtle.singer.inNeighbor = [1];
        targetTurtle.singer.neighborNoteValue = [1];
        targetTurtle.singer.beatFactor = 1;
        activity.errorMsg = jest.fn();

        Singer.RhythmActions.playNote(1, "note", 0, 1);
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();

        expect(activity.errorMsg).toHaveBeenCalledWith(
            "Neighbor note value is too large for the current note duration.",
            1
        );
        expect(targetTurtle.singer.neighborArgBeat).toEqual([1]);
        expect(targetTurtle.singer.neighborArgCurrentBeat).toEqual([]);
    });

    it("divides (not multiplies) by noteBeatValue when computing nextBeat", () => {
        targetTurtle.singer.inNeighbor = [1];
        targetTurtle.singer.neighborNoteValue = [0.1];
        targetTurtle.singer.beatFactor = 1;

        // noteBeatValue = 4 (blkName "note"); nextBeat = 1/4 - 0.2 = 0.05
        Singer.RhythmActions.playNote(4, "note", 0, 1);
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();

        expect(targetTurtle.singer.neighborArgCurrentBeat[0]).toBeCloseTo(20);
    });

    it("treats a nextBeat of exactly 0 as invalid (boundary of the <= 0 check)", () => {
        targetTurtle.singer.inNeighbor = [1];
        targetTurtle.singer.neighborNoteValue = [0.5];
        targetTurtle.singer.beatFactor = 1;
        activity.errorMsg = jest.fn();

        // noteBeatValue = 1 ("note", value 1); nextBeat = 1/1 - 2*0.5 = 0
        Singer.RhythmActions.playNote(1, "note", 0, 1);
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();

        expect(activity.errorMsg).toHaveBeenCalled();
        expect(targetTurtle.singer.neighborArgCurrentBeat).toEqual([]);
    });

    it("skips the neighbor block and processNote when inNoteBlock is unwound before the listener fires", () => {
        Singer.RhythmActions.playNote(1, "note", 0, 1);
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];

        targetTurtle.singer.inNoteBlock = [];
        Singer.processNote.mockClear();

        listener();

        expect(Singer.processNote).not.toHaveBeenCalled();
    });

    it("does not touch neighbor arrays when inNeighbor is empty", () => {
        targetTurtle.singer.inNeighbor = [];

        Singer.RhythmActions.playNote(1, "note", 0, 1);
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();

        expect(targetTurtle.singer.neighborArgBeat).toEqual([]);
        expect(targetTurtle.singer.neighborArgCurrentBeat).toEqual([]);
    });

    it("calls notationVoices with the outgoing inNoteBlock length and resets multipleVoices/pitchBlocks/drumBlocks only once fully unwound", () => {
        activity.logo.pitchBlocks = ["stale"];
        activity.logo.drumBlocks = ["stale"];

        Singer.RhythmActions.playNote(1, "note", 0, 10);
        const outerListener = activity.logo.setTurtleListener.mock.calls[0][2];

        Singer.RhythmActions.playNote(1, "note", 0, 20);
        const innerListener = activity.logo.setTurtleListener.mock.calls[1][2];

        expect(targetTurtle.singer.multipleVoices).toBe(true);

        innerListener();

        expect(activity.logo.notation.notationVoices).toHaveBeenCalledWith(0, 2);
        expect(activity.logo.notation.notationVoices).not.toHaveBeenCalledWith(0, 0);
        expect(targetTurtle.singer.multipleVoices).toBe(true);
        expect(activity.logo.pitchBlocks).toEqual(["stale"]);
        expect(activity.logo.drumBlocks).toEqual(["stale"]);

        outerListener();

        expect(activity.logo.notation.notationVoices).toHaveBeenCalledWith(0, 1);
        expect(activity.logo.notation.notationVoices).toHaveBeenCalledWith(0, 0);
        expect(targetTurtle.singer.multipleVoices).toBe(false);
        expect(activity.logo.pitchBlocks).toEqual([]);
        expect(activity.logo.drumBlocks).toEqual([]);
    });

    it("removes the last (not an arbitrary) entry from inNoteBlock on unwind", () => {
        targetTurtle.singer.inNoteBlock = [10, 20];
        targetTurtle.singer.noteValue = { 10: 1, 20: 1, 30: 1 };

        Singer.RhythmActions.playNote(1, "note", 0, 30);
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();

        expect(targetTurtle.singer.inNoteBlock).toEqual([10, 20]);
    });

    it("clears pitchBlocks and drumBlocks only once inNoteBlock is fully unwound", () => {
        activity.logo.pitchBlocks = ["stale"];
        activity.logo.drumBlocks = ["stale"];

        Singer.RhythmActions.playNote(1, "note", 0, 1);
        const listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();

        expect(activity.logo.pitchBlocks).toEqual([]);
        expect(activity.logo.drumBlocks).toEqual([]);
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
    it("does nothing when inNoteBlock is empty", () => {
        targetTurtle.singer.inNoteBlock = [];

        expect(() => Singer.RhythmActions.playRest(0)).not.toThrow();
        expect(targetTurtle.singer.pushedNote).toBeUndefined();
    });
    it("never pushes a rest when inNoteBlock is empty, even if notePitches has a matching stray entry", () => {
        targetTurtle.singer.inNoteBlock = [];
        targetTurtle.singer.notePitches = { undefined: [] };
        targetTurtle.singer.noteOctaves = { undefined: [] };
        targetTurtle.singer.noteCents = { undefined: [] };
        targetTurtle.singer.noteHertz = { undefined: [] };
        targetTurtle.singer.noteBeatValues = { undefined: [] };

        Singer.RhythmActions.playRest(0);

        expect(targetTurtle.singer.pushedNote).toBeUndefined();
        expect(targetTurtle.singer.notePitches.undefined).toEqual([]);
    });

    it("does not push a rest when the active note has no pitches array yet", () => {
        targetTurtle.singer.inNoteBlock = [7];
        targetTurtle.singer.notePitches = {};

        expect(() => Singer.RhythmActions.playRest(0)).not.toThrow();
        expect(targetTurtle.singer.pushedNote).toBeUndefined();
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

    it("updates dotCount and beatFactor correctly for negative dot values (fractional dots)", () => {
        let listener;
        activity.logo.setTurtleListener = jest.fn((_, __, fn) => {
            listener = fn;
        });

        targetTurtle.singer.dotCount = 0;
        targetTurtle.singer.beatFactor = 1;

        // value = -2 means half dot, i.e., increase dotCount by -1 / -2 = 0.5
        Singer.RhythmActions.doRhythmicDot(-2, 0, 1);

        expect(targetTurtle.singer.dotCount).toBe(0.5);
        expect(targetTurtle.singer.beatFactor).not.toBe(1);

        // Call the listener to simulate the teardown
        listener();

        expect(targetTurtle.singer.dotCount).toBe(0);
        expect(targetTurtle.singer.beatFactor).toBe(1);
    });

    it("multiplies (not divides) beatFactor by currentDotFactor and round-trips through the listener", () => {
        let listener;
        activity.logo.setTurtleListener = jest.fn((_, __, fn) => {
            listener = fn;
        });

        targetTurtle.singer.dotCount = 1;
        targetTurtle.singer.beatFactor = 2;

        Singer.RhythmActions.doRhythmicDot(3, 0, 1);

        expect(targetTurtle.singer.dotCount).toBe(4);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1.5483870967741935);

        listener();

        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(2);
    });

    it("treats a dot value of exactly 0 as non-negative, leaving dotCount and beatFactor unchanged through the full lifecycle", () => {
        let listener;
        activity.logo.setTurtleListener = jest.fn((_, __, fn) => {
            listener = fn;
        });

        targetTurtle.singer.dotCount = 1;
        targetTurtle.singer.beatFactor = 2;

        Singer.RhythmActions.doRhythmicDot(0, 0, 1);

        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(2);

        listener();

        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(2);
    });

    it("rejects non-finite dot values (Infinity, -Infinity, NaN) and overflowing values (-Number.MIN_VALUE) without mutating rhythmic state or registering side effects", () => {
        const invalidValues = [
            Infinity,
            -Infinity,
            NaN,
            undefined,
            null,
            "invalid",
            -Number.MIN_VALUE
        ];

        const originalIsRun = global.MusicBlocks.isRun;
        try {
            invalidValues.forEach(val => {
                targetTurtle.singer.dotCount = 1;
                targetTurtle.singer.beatFactor = 2;

                activity.errorMsg = jest.fn();
                activity.logo.setDispatchBlock = jest.fn();
                activity.logo.setTurtleListener = jest.fn();
                activity.blocks.blockList = { 1: {} };

                const mockMouse = { MB: { listeners: [] } };
                global.MusicBlocks.isRun = true;
                global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

                Singer.RhythmActions.doRhythmicDot(val, 0, 1);

                expect(activity.errorMsg).toHaveBeenCalledWith(
                    "Dot value must be a finite number.",
                    1
                );
                expect(targetTurtle.singer.dotCount).toBe(1);
                expect(targetTurtle.singer.beatFactor).toBe(2);
                expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
                expect(activity.logo.setTurtleListener).not.toHaveBeenCalled();
                expect(mockMouse.MB.listeners).toHaveLength(0);
            });
        } finally {
            global.MusicBlocks.isRun = originalIsRun;
        }
    });

    it("rejects -Number.MIN_VALUE whose derived increment overflows to Infinity", () => {
        expect(Number.isFinite(-Number.MIN_VALUE)).toBe(true);
        expect(Number.isFinite(-1 / -Number.MIN_VALUE)).toBe(false);

        targetTurtle.singer.dotCount = 1;
        targetTurtle.singer.beatFactor = 2;

        activity.errorMsg = jest.fn();
        activity.logo.setDispatchBlock = jest.fn();
        activity.logo.setTurtleListener = jest.fn();
        activity.blocks.blockList = { 1: {} };

        const mockMouse = { MB: { listeners: [] } };
        const originalIsRun = global.MusicBlocks.isRun;
        global.MusicBlocks.isRun = true;
        global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

        try {
            Singer.RhythmActions.doRhythmicDot(-Number.MIN_VALUE, 0, 1);

            expect(activity.errorMsg).toHaveBeenCalledWith("Dot value must be a finite number.", 1);
            expect(targetTurtle.singer.dotCount).toBe(1);
            expect(targetTurtle.singer.beatFactor).toBe(2);
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(activity.logo.setTurtleListener).not.toHaveBeenCalled();
            expect(mockMouse.MB.listeners).toHaveLength(0);
        } finally {
            global.MusicBlocks.isRun = originalIsRun;
        }
    });

    it("rejects finite input when resulting dotCount would overflow to Infinity", () => {
        targetTurtle.singer.dotCount = Number.MAX_VALUE;
        targetTurtle.singer.beatFactor = 1;

        activity.errorMsg = jest.fn();
        activity.logo.setDispatchBlock = jest.fn();
        activity.logo.setTurtleListener = jest.fn();
        activity.blocks.blockList = { 1: {} };

        Singer.RhythmActions.doRhythmicDot(Number.MAX_VALUE, 0, 1);

        expect(activity.errorMsg).toHaveBeenCalledWith("Dot value must be a finite number.", 1);
        expect(targetTurtle.singer.dotCount).toBe(Number.MAX_VALUE);
        expect(targetTurtle.singer.beatFactor).toBe(1);
        expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
        expect(activity.logo.setTurtleListener).not.toHaveBeenCalled();
    });

    it("nested dot blocks: invalid inner dot block does not corrupt outer dot block state or its cleanup", () => {
        const listeners = {};
        activity.logo.setTurtleListener = jest.fn((_, name, cb) => {
            listeners[name] = cb;
        });
        activity.errorMsg = jest.fn();
        activity.blocks.blockList = { 1: {}, 2: {}, 3: {}, 4: {} };

        targetTurtle.singer.dotCount = 0;
        targetTurtle.singer.beatFactor = 1;

        // Valid outer block 1
        Singer.RhythmActions.doRhythmicDot(1, 0, 1);
        expect(targetTurtle.singer.dotCount).toBe(1);
        const outerBeatFactor = targetTurtle.singer.beatFactor;
        expect(outerBeatFactor).not.toBe(1);
        const outerListener = listeners["_dot_0"];
        expect(outerListener).toBeDefined();

        // Clear recorded listener so we can check if invalid inner block registers one
        delete listeners["_dot_0"];

        // Invalid inner block 2 with Infinity
        Singer.RhythmActions.doRhythmicDot(Infinity, 0, 2);
        expect(activity.errorMsg).toHaveBeenCalledWith("Dot value must be a finite number.", 2);
        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).toBe(outerBeatFactor);
        expect(listeners["_dot_0"]).toBeUndefined();

        // Invalid inner block 3 with NaN
        Singer.RhythmActions.doRhythmicDot(NaN, 0, 3);
        expect(activity.errorMsg).toHaveBeenCalledWith("Dot value must be a finite number.", 3);
        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).toBe(outerBeatFactor);
        expect(listeners["_dot_0"]).toBeUndefined();

        // Invalid inner block 4 with -Number.MIN_VALUE
        Singer.RhythmActions.doRhythmicDot(-Number.MIN_VALUE, 0, 4);
        expect(activity.errorMsg).toHaveBeenCalledWith("Dot value must be a finite number.", 4);
        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).toBe(outerBeatFactor);
        expect(listeners["_dot_0"]).toBeUndefined();

        // Teardown outer block
        outerListener();
        expect(targetTurtle.singer.dotCount).toBe(0);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1);
    });

    it("nested valid dot blocks preserve and restore dotCount and beatFactor through sequential teardown", () => {
        let outerListener;
        let innerListener;
        activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
            if (!outerListener) {
                outerListener = cb;
            } else {
                innerListener = cb;
            }
        });

        targetTurtle.singer.dotCount = 1;
        targetTurtle.singer.beatFactor = 2;

        // Outer dot block: +1
        Singer.RhythmActions.doRhythmicDot(1, 0, 1);
        expect(targetTurtle.singer.dotCount).toBe(2);
        const intermediateBeatFactor = targetTurtle.singer.beatFactor;

        // Inner dot block: +2
        Singer.RhythmActions.doRhythmicDot(2, 0, 2);
        expect(targetTurtle.singer.dotCount).toBe(4);

        // Teardown inner dot block
        innerListener();
        expect(targetTurtle.singer.dotCount).toBe(2);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(intermediateBeatFactor);

        // Teardown outer dot block
        outerListener();
        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(2);
    });

    it("preserves fractional-dot semantics (-2) with non-default initial state and restores on cleanup", () => {
        let listener;
        activity.logo.setTurtleListener = jest.fn((_, __, fn) => {
            listener = fn;
        });

        targetTurtle.singer.dotCount = 1;
        targetTurtle.singer.beatFactor = 2;

        Singer.RhythmActions.doRhythmicDot(-2, 0, 1);

        // value = -2 means half dot: increases dotCount by -1 / -2 = 0.5
        expect(targetTurtle.singer.dotCount).toBe(1.5);
        expect(targetTurtle.singer.beatFactor).not.toBe(2);

        listener();

        expect(targetTurtle.singer.dotCount).toBe(1);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(2);
    });

    it("subsequent note-duration calculations remain correct following invalid input", () => {
        const listeners = {};
        activity.logo.setTurtleListener = jest.fn((_, name, cb) => {
            listeners[name] = cb;
        });
        activity.errorMsg = jest.fn();
        activity.blocks.blockList = {
            1: {},
            2: {},
            3: {},
            4: {},
            5: {},
            6: {},
            7: {},
            8: {},
            9: {}
        };

        targetTurtle.singer.dotCount = 0;
        targetTurtle.singer.beatFactor = 1;

        // Standalone invalid dot inputs: state remains uncorrupted
        Singer.RhythmActions.doRhythmicDot(Infinity, 0, 1);
        Singer.RhythmActions.doRhythmicDot(NaN, 0, 2);
        Singer.RhythmActions.doRhythmicDot(-Infinity, 0, 3);
        Singer.RhythmActions.doRhythmicDot(-Number.MIN_VALUE, 0, 4);

        // Note duration calculation immediately following invalid input remains correct
        Singer.RhythmActions.playNote(2, "note", 0, 5);
        expect(targetTurtle.singer.noteValue[5]).toBeCloseTo(0.5);
        expect(Number.isFinite(targetTurtle.singer.noteValue[5])).toBe(true);

        // Nested context: valid outer dot, rejected inner dot, subsequent note calculation
        Singer.RhythmActions.doRhythmicDot(1, 0, 6);
        const outerListener = listeners["_dot_0"];
        expect(outerListener).toBeDefined();

        Singer.RhythmActions.doRhythmicDot(NaN, 0, 7);

        Singer.RhythmActions.playNote(1, "note", 0, 8);
        // beatFactor is 2/3 (for 1 dot, duration factor 1.5), noteValue is 1 / (1 * (2/3)) = 1.5
        expect(targetTurtle.singer.noteValue[8]).toBeCloseTo(1.5);
        expect(Number.isFinite(targetTurtle.singer.noteValue[8])).toBe(true);

        // Cleanup outer dot block
        outerListener();
        expect(targetTurtle.singer.dotCount).toBe(0);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1);

        Singer.RhythmActions.playNote(1, "note", 0, 9);
        expect(targetTurtle.singer.noteValue[9]).toBeCloseTo(1);
        expect(Number.isFinite(targetTurtle.singer.noteValue[9])).toBe(true);
    });

    it("multiplies beatFactor correctly", () => {
        targetTurtle.singer.beatFactor = 2;

        Singer.RhythmActions.multiplyNoteValue(2, 0, 1);

        expect(targetTurtle.singer.beatFactor).toBe(1);
    });

    it.each([
        [2, 3],
        [2, 0.5]
    ])("restores beatFactor after nesting multiply %p around multiply %p", (outer, inner) => {
        // Like the real logo, a nested clamp replaces the listener of the same name,
        // so the inner listener is the one that fires at both clamp ends.
        let listener;
        activity.logo.setTurtleListener = jest.fn((_, __, fn) => {
            listener = fn;
        });

        Singer.RhythmActions.multiplyNoteValue(outer, 0, 1);
        Singer.RhythmActions.multiplyNoteValue(inner, 0, 2);
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1 / (outer * inner));

        listener();
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1 / outer);

        listener();
        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1);
        expect(targetTurtle.singer.beatFactorValues).toEqual([]);
    });

    it("preserves beatFactor when multiply factor is zero or invalid", () => {
        [0, null, undefined, NaN, "invalid"].forEach(factor => {
            targetTurtle.singer.beatFactor = 2;
            Singer.RhythmActions.multiplyNoteValue(factor, 0, 1);
            expect(targetTurtle.singer.beatFactor).toBe(2);
        });
    });

    it("adds swing when not suppressed", () => {
        targetTurtle.singer.suppressOutput = false;
        targetTurtle.singer.swing = [];
        targetTurtle.singer.swingTarget = [];

        Singer.RhythmActions.addSwing(2, 4, 0, 1);

        expect(targetTurtle.singer.swing).toContain(0.5);
        expect(targetTurtle.singer.swingTarget).toContain(0.25);
    });

    it("calls notationSwing and leaves swing arrays untouched when output is suppressed", () => {
        targetTurtle.singer.suppressOutput = true;
        targetTurtle.singer.swing = [99];
        targetTurtle.singer.swingTarget = [99];
        activity.logo.notation.notationSwing = jest.fn();

        let listener;
        activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
            listener = cb;
        });

        Singer.RhythmActions.addSwing(2, 4, 0, 1);

        expect(activity.logo.notation.notationSwing).toHaveBeenCalledWith(0);
        expect(targetTurtle.singer.swing).toEqual([99]);
        expect(targetTurtle.singer.swingTarget).toEqual([99]);

        listener();

        expect(targetTurtle.singer.swing).toEqual([99]);
        expect(targetTurtle.singer.swingTarget).toEqual([99]);
    });

    it("preserves swing arrays when swing parameters are zero or invalid", () => {
        targetTurtle.singer.suppressOutput = false;
        [0, null, undefined, NaN, "invalid"].forEach(val => {
            targetTurtle.singer.swing = [];
            targetTurtle.singer.swingTarget = [];

            Singer.RhythmActions.addSwing(val, 4, 0, 1);
            expect(targetTurtle.singer.swing.length).toBe(0);

            Singer.RhythmActions.addSwing(2, val, 0, 1);
            expect(targetTurtle.singer.swing.length).toBe(0);
        });
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
    it("respects getNoteValue priority hierarchy", () => {
        // Simulate active note block
        targetTurtle.singer.inNoteBlock = [7];

        // Provide ALL possible sources
        targetTurtle.singer.noteValue = { 7: 0.25 }; // highest priority
        targetTurtle.singer.lastNotePlayed = [null, 8]; // second priority
        targetTurtle.singer.notePitches = { 7: ["C"] }; // third priority
        targetTurtle.singer.noteBeat = { 7: 4 };

        const value = Singer.RhythmActions.getNoteValue(0);

        // noteValue = 0.25 -> internally inverted twice -> returns 0.25
        expect(value).toBe(0.25);
    });
    it("falls back to noteBeat when noteValue and lastNotePlayed are absent", () => {
        targetTurtle.singer.inNoteBlock = [5];

        targetTurtle.singer.noteValue = {};
        targetTurtle.singer.lastNotePlayed = null;
        targetTurtle.singer.notePitches = { 5: ["C"] };
        targetTurtle.singer.noteBeat = { 5: 4 };

        const value = Singer.RhythmActions.getNoteValue(0);

        expect(value).toBe(0.25); // 1 / 4
    });
    it("falls back past noteValue when it is explicitly null", () => {
        // clearNoteParams() in logo.js sets noteValue[blk] = null before a note
        // is assigned a real value, so null is a realistic, not artificial, input.
        targetTurtle.singer.inNoteBlock = [3];
        targetTurtle.singer.noteValue = { 3: null };
        targetTurtle.singer.lastNotePlayed = [null, 8];

        const value = Singer.RhythmActions.getNoteValue(0);

        expect(value).toBe(0.125); // falls through to lastNotePlayed, same as null noteValue never happened
    });
    it("does not fall back to noteBeat when notePitches is an empty array", () => {
        targetTurtle.singer.inNoteBlock = [6];
        targetTurtle.singer.noteValue = {};
        targetTurtle.singer.lastNotePlayed = null;
        targetTurtle.singer.notePitches = { 6: [] };
        targetTurtle.singer.noteBeat = { 6: 4 };

        const value = Singer.RhythmActions.getNoteValue(0);

        expect(value).toBe(0);
    });

    describe("dispatch-block and mouse-listener registration", () => {
        // playNote, doRhythmicDot, multiplyNoteValue, and addSwing all share the
        // same "dispatch via blockList, else register with the running mouse"
        // setup that doTie's own describe block already exercises. These mirror
        // that pattern for the remaining four block methods.

        // Snapshot/restore, mirroring doTie's own beforeEach/afterEach below, so
        // MusicBlocks.isRun and Mouse.getMouseFromTurtle don't leak into tests
        // outside this describe block. Scoped here rather than at the top level
        // since no other tests in this file touch these two globals.
        let originalGetMouseFromTurtle;
        let originalIsRun;

        beforeEach(() => {
            originalGetMouseFromTurtle = global.Mouse.getMouseFromTurtle;
            originalIsRun = global.MusicBlocks.isRun;
        });

        afterEach(() => {
            global.MusicBlocks.isRun = originalIsRun;
            global.Mouse.getMouseFromTurtle = originalGetMouseFromTurtle;
        });

        it("playNote dispatches block listener when blk is present in blockList", () => {
            activity.blocks.blockList = { 5: {} };

            Singer.RhythmActions.playNote(1, "note", 0, 5);

            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(5, 0, "_playnote_0_5");
        });
        it("playNote does not dispatch or register a mouse listener when blk is absent from blockList and MusicBlocks is not running", () => {
            activity.blocks.blockList = {};
            global.MusicBlocks.isRun = false;

            Singer.RhythmActions.playNote(1, "note", 0, 99);

            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(global.Mouse.getMouseFromTurtle).not.toHaveBeenCalled();
        });
        it("playNote registers listener with mouse when MusicBlocks.isRun and blk is undefined", () => {
            const mockMouse = { MB: { listeners: [] } };
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

            Singer.RhythmActions.playNote(1, "note", 0, undefined);

            expect(mockMouse.MB.listeners).toContain("_playnote_0_undefined");
        });
        it("playNote does not throw or dispatch when MusicBlocks.isRun and mouse is null", () => {
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => null);

            expect(() => Singer.RhythmActions.playNote(1, "note", 0, undefined)).not.toThrow();
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
        });

        it("doRhythmicDot dispatches block listener when blk is present in blockList", () => {
            activity.blocks.blockList = { 5: {} };

            Singer.RhythmActions.doRhythmicDot(1, 0, 5);

            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(5, 0, "_dot_0_5");
        });
        it("doRhythmicDot does not dispatch or register a mouse listener when blk is absent from blockList and MusicBlocks is not running", () => {
            activity.blocks.blockList = {};
            global.MusicBlocks.isRun = false;

            Singer.RhythmActions.doRhythmicDot(1, 0, 99);

            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(global.Mouse.getMouseFromTurtle).not.toHaveBeenCalled();
        });
        it("doRhythmicDot registers listener with mouse when MusicBlocks.isRun and blk is undefined", () => {
            const mockMouse = { MB: { listeners: [] } };
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

            Singer.RhythmActions.doRhythmicDot(1, 0, undefined);

            expect(mockMouse.MB.listeners).toContain("_dot_0_undefined");
        });
        it("doRhythmicDot does not throw or dispatch when MusicBlocks.isRun and mouse is null", () => {
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => null);

            expect(() => Singer.RhythmActions.doRhythmicDot(1, 0, undefined)).not.toThrow();
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
        });

        it("multiplyNoteValue dispatches block listener when blk is present in blockList", () => {
            activity.blocks.blockList = { 5: {} };

            Singer.RhythmActions.multiplyNoteValue(2, 0, 5);

            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(5, 0, "_multiplybeat_0");
        });
        it("multiplyNoteValue does not dispatch or register a mouse listener when blk is absent from blockList and MusicBlocks is not running", () => {
            activity.blocks.blockList = {};
            global.MusicBlocks.isRun = false;

            Singer.RhythmActions.multiplyNoteValue(2, 0, 99);

            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(global.Mouse.getMouseFromTurtle).not.toHaveBeenCalled();
        });
        it("multiplyNoteValue registers listener with mouse when MusicBlocks.isRun and blk is undefined", () => {
            const mockMouse = { MB: { listeners: [] } };
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

            Singer.RhythmActions.multiplyNoteValue(2, 0, undefined);

            expect(mockMouse.MB.listeners).toContain("_multiplybeat_0");
        });
        it("multiplyNoteValue does not throw or dispatch when MusicBlocks.isRun and mouse is null", () => {
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => null);

            expect(() => Singer.RhythmActions.multiplyNoteValue(2, 0, undefined)).not.toThrow();
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
        });

        it("addSwing dispatches block listener when blk is present in blockList", () => {
            targetTurtle.singer.swing = [];
            targetTurtle.singer.swingTarget = [];
            activity.blocks.blockList = { 5: {} };

            Singer.RhythmActions.addSwing(2, 4, 0, 5);

            expect(activity.logo.setDispatchBlock).toHaveBeenCalledWith(5, 0, "_swing_0");
        });
        it("addSwing does not dispatch or register a mouse listener when blk is absent from blockList and MusicBlocks is not running", () => {
            targetTurtle.singer.swing = [];
            targetTurtle.singer.swingTarget = [];
            activity.blocks.blockList = {};
            global.MusicBlocks.isRun = false;

            Singer.RhythmActions.addSwing(2, 4, 0, 99);

            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(global.Mouse.getMouseFromTurtle).not.toHaveBeenCalled();
        });
        it("addSwing registers listener with mouse when MusicBlocks.isRun and blk is undefined", () => {
            targetTurtle.singer.swing = [];
            targetTurtle.singer.swingTarget = [];
            const mockMouse = { MB: { listeners: [] } };
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => mockMouse);

            Singer.RhythmActions.addSwing(2, 4, 0, undefined);

            expect(mockMouse.MB.listeners).toContain("_swing_0");
        });
        it("addSwing does not throw or dispatch when MusicBlocks.isRun and mouse is null", () => {
            targetTurtle.singer.swing = [];
            targetTurtle.singer.swingTarget = [];
            global.MusicBlocks.isRun = true;
            global.Mouse.getMouseFromTurtle = jest.fn(() => null);

            expect(() => Singer.RhythmActions.addSwing(2, 4, 0, undefined)).not.toThrow();
            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
        });
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
            targetTurtle.singer.tieNotePitches = [
                ["C", 4, 0, 261.63],
                ["E", 4, 0, 329.63]
            ];
            targetTurtle.singer.tieNoteExtras = [
                5, // saveBlk
                ["sine"], // oscList
                1, // noteBeat
                [1], // noteBeatValues
                [], // noteDrums
                undefined,
                false, // wasOsc
                2 // rawDurationValue
            ];
            targetTurtle.singer.bpm = [];
            targetTurtle.singer.turtleTime = 5;
            global.Singer.masterBPM = 60;

            listener();

            expect(Singer.processNote).toHaveBeenCalled();
            // bpmFactor = TONEBPM / masterBPM = 120 / 60 = 2; waitSeconds = bpmFactor / rawDuration = 2 / 2 = 1
            expect(targetTurtle.doWait).toHaveBeenCalledWith(1);
            expect(targetTurtle.singer.turtleTime).toBeCloseTo(6);
            expect(targetTurtle.singer.tie).toBe(false);
            expect(targetTurtle.singer.tieNotePitches).toEqual([]);
            expect(targetTurtle.singer.tieNoteExtras).toEqual([]);
            expect(targetTurtle.singer.notePitches[5]).toBeUndefined();
        });

        it("does not count the replayed carried-over note twice", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });
            targetTurtle.doWait = jest.fn();
            activity.blocks.blockList[5] = { name: "note" };

            Singer.RhythmActions.doTie(0, 1);

            targetTurtle.singer.inNoteBlock = [];
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.63]];
            targetTurtle.singer.tieNoteExtras = [5, ["sine"], 1, [1], [], undefined, false, 2];
            // The half note was already counted when it was first played inside the tie.
            targetTurtle.singer.notesPlayed = [1, 2];
            targetTurtle.singer.tallyNotes = 1;
            // Like the real processNote, count the note again when it is replayed.
            Singer.processNote.mockImplementationOnce(() => {
                targetTurtle.singer.notesPlayed = [1, 1];
                targetTurtle.singer.tallyNotes = 2;
            });

            listener();

            expect(targetTurtle.singer.notesPlayed).toEqual([1, 2]);
            expect(targetTurtle.singer.tallyNotes).toBe(1);
        });

        it("uses last(bpm), not masterBPM, when the bpm stack is non-empty", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });
            targetTurtle.doWait = jest.fn();
            activity.blocks.blockList[5] = { name: "note" };

            Singer.RhythmActions.doTie(0, 1);

            targetTurtle.singer.inNoteBlock = [];
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.63]];
            targetTurtle.singer.tieNoteExtras = [5, ["sine"], 1, [1], [], undefined, false, 2];
            targetTurtle.singer.bpm = [80];
            targetTurtle.singer.turtleTime = 0;
            global.Singer.masterBPM = 999; // should be ignored since bpm stack is non-empty

            listener();

            // bpmFactor = 120 / 80 = 1.5; waitSeconds = 1.5 / 2 = 0.75
            expect(targetTurtle.doWait).toHaveBeenCalledWith(0.75);
            expect(targetTurtle.singer.turtleTime).toBeCloseTo(0.75);
        });

        it("uses rawDuration/1000 (not the bpm factor) as the wait when the tied note was osctime", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });
            targetTurtle.doWait = jest.fn();
            activity.blocks.blockList[5] = { name: "note" };

            Singer.RhythmActions.doTie(0, 1);

            targetTurtle.singer.inNoteBlock = [];
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.63]];
            targetTurtle.singer.tieNoteExtras = [5, ["sine"], 1, [1], [], undefined, true, 500];
            targetTurtle.singer.bpm = [];
            targetTurtle.singer.turtleTime = 0;

            listener();

            expect(targetTurtle.doWait).toHaveBeenCalledWith(0.5);
            expect(targetTurtle.singer.turtleTime).toBeCloseTo(0.5);
        });

        it("does not wait or advance turtleTime when output is suppressed", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });
            targetTurtle.doWait = jest.fn();
            activity.blocks.blockList[5] = { name: "note" };

            Singer.RhythmActions.doTie(0, 1);

            targetTurtle.singer.inNoteBlock = [];
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.63]];
            targetTurtle.singer.tieNoteExtras = [5, ["sine"], 1, [1], [], undefined, false, 2];
            targetTurtle.singer.bpm = [];
            targetTurtle.singer.turtleTime = 5;
            targetTurtle.singer.suppressOutput = true;

            listener();

            expect(targetTurtle.doWait).not.toHaveBeenCalled();
            expect(targetTurtle.singer.turtleTime).toBe(5);
        });

        it("does not remove tie notation when lastNote is null, even if notePitches has a stray matching key", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });
            targetTurtle.doWait = jest.fn();
            activity.blocks.blockList[5] = { name: "note" };

            Singer.RhythmActions.doTie(0, 1);

            targetTurtle.singer.inNoteBlock = []; // last(inNoteBlock) === undefined
            // stray "undefined" key so a mutated `true && lastNote in notePitches` would be true too
            targetTurtle.singer.notePitches = { undefined: ["C"] };
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.63]];
            targetTurtle.singer.tieNoteExtras = [5, ["sine"], 1, [1], [], undefined, false, 2];
            targetTurtle.singer.bpm = [];

            listener();

            expect(activity.logo.notation.notationRemoveTie).not.toHaveBeenCalled();
        });

        it("does not remove tie notation when justCounting is non-empty", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });
            targetTurtle.doWait = jest.fn();
            activity.blocks.blockList[5] = { name: "note" };

            Singer.RhythmActions.doTie(0, 1);

            targetTurtle.singer.inNoteBlock = [2];
            targetTurtle.singer.notePitches = { 2: ["C", "E"] };
            targetTurtle.singer.justCounting = [1];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.63]];
            targetTurtle.singer.tieNoteExtras = [5, ["sine"], 1, [1], [], undefined, false, 2];
            targetTurtle.singer.bpm = [];

            listener();

            expect(activity.logo.notation.notationRemoveTie).not.toHaveBeenCalled();
        });

        it("does not remove tie notation when lastNote is not a key of notePitches", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });
            targetTurtle.doWait = jest.fn();
            activity.blocks.blockList[5] = { name: "note" };

            Singer.RhythmActions.doTie(0, 1);

            targetTurtle.singer.inNoteBlock = [42];
            targetTurtle.singer.notePitches = {}; // 42 not a key
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [["C", 4, 0, 261.63]];
            targetTurtle.singer.tieNoteExtras = [5, ["sine"], 1, [1], [], undefined, false, 2];
            targetTurtle.singer.bpm = [];

            listener();

            expect(activity.logo.notation.notationRemoveTie).not.toHaveBeenCalled();
        });

        it("rebuilds saveBlk's pitch/octave/cent/hertz arrays in tieNotePitches order", () => {
            let listener;
            activity.logo.setTurtleListener = jest.fn((_, __, cb) => {
                listener = cb;
            });
            targetTurtle.doWait = jest.fn();
            activity.blocks.blockList[5] = { name: "note" };

            Singer.RhythmActions.doTie(0, 1);

            targetTurtle.singer.inNoteBlock = [];
            targetTurtle.singer.justCounting = [];
            targetTurtle.singer.tieCarryOver = 2;
            targetTurtle.singer.tieNotePitches = [
                ["C", 4, 0, 261.63],
                ["E", 5, 1, 329.63]
            ];
            targetTurtle.singer.tieNoteExtras = [5, ["sine"], 1, [1], [], undefined, false, 2];
            targetTurtle.singer.bpm = [];

            let capturedPitches, capturedOctaves, capturedCents, capturedHertz, capturedGraphics;
            Singer.processNote.mockImplementationOnce(() => {
                capturedPitches = [...targetTurtle.singer.notePitches[5]];
                capturedOctaves = [...targetTurtle.singer.noteOctaves[5]];
                capturedCents = [...targetTurtle.singer.noteCents[5]];
                capturedHertz = [...targetTurtle.singer.noteHertz[5]];
                capturedGraphics = [...targetTurtle.singer.embeddedGraphics[5]];
            });

            listener();

            expect(capturedPitches).toEqual(["C", "E"]);
            expect(capturedOctaves).toEqual([4, 5]);
            expect(capturedCents).toEqual([0, 1]);
            expect(capturedHertz).toEqual([261.63, 329.63]);
            expect(capturedGraphics).toEqual([]);
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

        it("does not dispatch when blk is defined but absent from blockList", () => {
            activity.blocks.blockList = {};

            Singer.RhythmActions.doTie(0, 99);

            expect(activity.logo.setDispatchBlock).not.toHaveBeenCalled();
            expect(global.Mouse.getMouseFromTurtle).not.toHaveBeenCalled();
        });
    });

    it("restores beatFactor after dot and multiply lifecycle", () => {
        let dotListener, multiplyListener;

        activity.logo.setTurtleListener = jest.fn((_, name, cb) => {
            if (name.includes("_dot_")) dotListener = cb;
            if (name.includes("_multiplybeat_")) multiplyListener = cb;
        });

        targetTurtle.singer.beatFactor = 1;
        targetTurtle.singer.dotCount = 0;

        Singer.RhythmActions.doRhythmicDot(1, 0, 1);
        Singer.RhythmActions.multiplyNoteValue(2, 0, 1);

        const mutated = targetTurtle.singer.beatFactor;
        expect(mutated).not.toBe(1);

        multiplyListener();
        dotListener();

        expect(targetTurtle.singer.beatFactor).toBeCloseTo(1);
    });
    it("maintains stable beatFactor after repeated dots", () => {
        targetTurtle.singer.beatFactor = 1;
        targetTurtle.singer.dotCount = 0;

        Singer.RhythmActions.doRhythmicDot(1, 0, 1);
        Singer.RhythmActions.doRhythmicDot(1, 0, 1);

        expect(targetTurtle.singer.dotCount).toBe(2);
        expect(targetTurtle.singer.beatFactor).toBeGreaterThan(0);
    });
    it("treats osctime differently from note duration", () => {
        Singer.processNote.mockClear();

        Singer.RhythmActions.playNote(2, "note", 0, 1);
        let listener = activity.logo.setTurtleListener.mock.calls[0][2];
        listener();

        const noteCall = Singer.processNote.mock.calls[0];

        Singer.processNote.mockClear();

        Singer.RhythmActions.playNote(500, "osctime", 0, 1);
        listener = activity.logo.setTurtleListener.mock.calls[1][2];
        listener();

        const oscCall = Singer.processNote.mock.calls[0];

        expect(noteCall[2]).toBe(false);
        expect(oscCall[2]).toBe(true);
    });
    it("activates multipleVoices for nested notes", () => {
        targetTurtle.singer.inNoteBlock = [10];

        Singer.RhythmActions.playNote(1, "note", 0, 1);

        expect(targetTurtle.singer.multipleVoices).toBe(true);
    });
});
