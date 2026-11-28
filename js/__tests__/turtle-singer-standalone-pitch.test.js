/**
 * @license
 * MusicBlocks
 * Copyright (C) 2026 Music Blocks Contributors
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

/**
 * A Pitch block outside a Note block plays as a quarter note through its own branch of
 * Singer.processPitch. It should honour the same transpositions and intervals as a pitch in a
 * Note block. Both are run here through the real musicutils and compared.
 */

const musicUtils = require("../utils/musicutils");
Object.assign(global, musicUtils);
global.last = array => (array && array.length > 0 ? array[array.length - 1] : null);
global.deepClone = value => JSON.parse(JSON.stringify(value));
global.clampNumber = require("../utils/utils-logic").clampNumber;
global.DEFAULTVOLUME = 100;
global.DEFAULTVOICE = "electronic synth";
global.TARGETBPM = 120;
global.TONEBPM = 60;

const Singer = require("../turtle-singer");

const C4 = pitchToFrequency("C", 4, 0, "C major");

/**
 * Plays C4 (plus cents) through Singer.processPitch and returns what was queued, as cents above
 * C4 for each pitch of the note.
 * @param {boolean} standAlone - a Pitch block on its own, or inside a Note block
 * @param {Object} singerState - transposition, transpositionRatios, intervals, …
 * @param {number} [cents]
 * @returns {number[]}
 */
const play = (standAlone, singerState, cents = 0) => {
    const turtle = { singer: null };
    turtle.singer = new Singer(turtle);
    Object.assign(
        turtle.singer,
        {
            inNoteBlock: standAlone ? [] : [0],
            notePitches: { 0: [] },
            noteOctaves: { 0: [] },
            noteCents: { 0: [] },
            noteHertz: { 0: [] },
            noteBeatValues: { 0: [] },
            beatFactor: 1,
            transposition: 0,
            transpositionRatios: [],
            register: 0,
            invertList: [],
            intervals: [],
            semitoneIntervals: [],
            chordIntervals: [],
            ratioIntervals: [],
            keySignature: "C major",
            movable: false
        },
        singerState
    );
    const activity = {
        turtles: { ithTurtle: () => turtle },
        blocks: { blockList: {} },
        errorMsg: jest.fn()
    };
    activity.logo = {
        activity,
        synth: { inTemperament: "equal" },
        clearNoteParams: jest.fn()
    };

    // A stand-alone pitch queues itself under its own block (0) and hands the note to
    // processNote, which clears it: read what was queued at that hand-off.
    let queued = null;
    const processNote = jest.spyOn(Singer, "processNote").mockImplementation(() => {
        queued = {
            pitches: [...turtle.singer.notePitches[0]],
            octaves: [...turtle.singer.noteOctaves[0]],
            cents: [...turtle.singer.noteCents[0]]
        };
    });
    Singer.processPitch(activity, "C", 4, cents, 0, 0);
    processNote.mockRestore();

    if (!standAlone) {
        expect(queued).toBeNull();
        queued = {
            pitches: turtle.singer.notePitches[0],
            octaves: turtle.singer.noteOctaves[0],
            cents: turtle.singer.noteCents[0]
        };
    }
    return queued.pitches.map((pitch, i) => {
        const hertz = pitchToFrequency(pitch, queued.octaves[i], queued.cents[i], "C major");
        return 1200 * Math.log2(hertz / C4);
    });
};

describe("a stand-alone Pitch block plays what the same pitch in a Note block plays", () => {
    test.each([
        ["a 0.5 semi-tone transposition", { transposition: 0.5 }, [50]],
        ["Transpose by ratio 3:2", { transpositionRatios: [1.5] }, [1200 * Math.log2(1.5)]],
        ["a Ratio interval 3:2", { ratioIntervals: [1.5] }, [0, 1200 * Math.log2(1.5)]],
        ["a chord interval (a scalar fourth)", { chordIntervals: [[3, 0]] }, [0, 500]],
        ["a scalar interval (a fifth)", { intervals: [4] }, [0, 700]],
        ["no transposition at all", {}, [0]]
    ])("%s", (_name, singerState, expected) => {
        const standAlone = play(true, singerState);
        const inNote = play(false, singerState);

        expect(standAlone.length).toBe(expected.length);
        standAlone.forEach((cents, i) => {
            expect(cents).toBeCloseTo(expected[i], 6);
            expect(cents).toBeCloseTo(inNote[i], 6);
        });
    });

    test("interval notes keep the cents of the transposed base note", () => {
        // C4 + 50 cents, and a fifth above it, also + 50 cents.
        const played = play(true, { transposition: 0.5, intervals: [4] });
        expect(played[0]).toBeCloseTo(50, 6);
        expect(played[1]).toBeCloseTo(750, 6);
    });

    test("a pitch with cents of its own keeps them in a fractional transposition", () => {
        // C(+35) up 0.5 semi-tones.
        expect(play(true, { transposition: 0.5 }, 35)[0]).toBeCloseTo(85, 6);
    });
});
