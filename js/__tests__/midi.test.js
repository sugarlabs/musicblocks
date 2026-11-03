/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Diwangshu Kakoty
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

const { getClosestStandardNoteValue, transcribeMidi } = require("../midi");

const mockMidi = {
    header: {
        ppq: 480,
        tempos: [{ bpm: 120, ticks: 0 }],
        timeSignatures: [{ timeSignature: [4, 4], ticks: 0 }]
    },
    tracks: [
        {
            instrument: {
                name: "acoustic grand piano",
                family: "piano",
                number: 0,
                percussion: false
            },
            channel: 1,
            notes: [
                { name: "C4", midi: 60, time: 0, duration: 0.5, velocity: 0.8 },
                { name: "E4", midi: 64, time: 0.5, duration: 0.75, velocity: 0.9 },
                { name: "G4", midi: 67, time: 1.25, duration: 0.5, velocity: 0.85 }
            ]
        },
        {
            instrument: {
                name: "acoustic guitar (nylon)",
                family: "guitar",
                number: 24,
                percussion: false
            },
            channel: 2,
            notes: [
                { name: "G3", midi: 55, time: 0, duration: 0.6, velocity: 0.7 },
                { name: "C4", midi: 60, time: 0.6, duration: 0.8, velocity: 0.75 }
            ]
        },
        {
            instrument: { name: "drums", family: "percussion", number: 128, percussion: true },
            channel: 9,
            notes: [
                { name: "Snare Drum", midi: 38, time: 0, duration: 0.3, velocity: 0.9 },
                { name: "Kick Drum", midi: 36, time: 0.5, duration: 0.3, velocity: 0.8 }
            ]
        }
    ]
};

describe("getClosestStandardNoteValue", () => {
    it("should return the closest standard note duration for a given input", () => {
        expect(getClosestStandardNoteValue(1)).toEqual([1, 1]);
        expect(getClosestStandardNoteValue(0.0078125)).toEqual([1, 128]);
    });

    // The whole-note through 1/128-note family is the standard set of
    // powers-of-two note durations used throughout Western music notation.
    // Feeding each exact duration back in must return that same duration.
    it.each([
        [1, [1, 1]],
        [0.5, [1, 2]],
        [0.25, [1, 4]],
        [0.125, [1, 8]],
        [0.0625, [1, 16]],
        [0.03125, [1, 32]],
        [0.015625, [1, 64]],
        [0.0078125, [1, 128]]
    ])(
        "returns the exact match [%s -> %j] for every standard note duration",
        (duration, expected) => {
            expect(getClosestStandardNoteValue(duration)).toEqual(expected);
        }
    );

    it("snaps a duration to the standard value it is numerically nearer to", () => {
        expect(getClosestStandardNoteValue(0.24)).toEqual([1, 4]);
        expect(getClosestStandardNoteValue(0.12)).toEqual([1, 8]);
        // Dotted values are closer to these inputs than the plain note values.
        expect(getClosestStandardNoteValue(0.2)).toEqual([3, 16]);
        expect(getClosestStandardNoteValue(0.1)).toEqual([3, 32]);
        expect(getClosestStandardNoteValue(0.16)).toEqual([1, 6]);
    });

    it("prefers a plain note when equally close to a dotted note", () => {
        expect(getClosestStandardNoteValue(0.21875)).toEqual([1, 4]);
    });

    it("snaps durations at or beyond the largest value to the dotted whole note", () => {
        expect(getClosestStandardNoteValue(1.5)).toEqual([3, 2]);
        expect(getClosestStandardNoteValue(2)).toEqual([3, 2]);
        expect(getClosestStandardNoteValue(1000)).toEqual([3, 2]);
    });

    it("snaps zero and negative durations to the smallest standard value", () => {
        // Every standard duration is positive, so the smallest one (1/128)
        // is always nearest to zero and to any negative duration.
        expect(getClosestStandardNoteValue(0)).toEqual([1, 128]);
        expect(getClosestStandardNoteValue(-5)).toEqual([1, 128]);
    });
});

describe("transcribeMidi", () => {
    let loadNewBlocksSpy;

    beforeEach(() => {
        // Mock dependencies
        global.getReverseDrumMidi = jest.fn(() => ({
            38: ["snare drum"],
            36: ["kick drum"],
            41: ["tom tom"]
        }));

        global.VOICENAMES = [
            ["piano", "acoustic grand piano"],
            ["guitar", "acoustic guitar (nylon)"]
        ];

        global.activity = {
            textMsg: jest.fn(),
            blocks: {
                loadNewBlocks: jest.fn(),
                palettes: { _hideMenus: jest.fn() },
                trashStacks: []
            }
        };

        // Spy on loadNewBlocks
        loadNewBlocksSpy = jest.spyOn(activity.blocks, "loadNewBlocks");
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should process all tracks and generate blocks", async () => {
        await transcribeMidi(mockMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        expect(Array.isArray(loadedBlocks)).toBe(true);
        expect(loadedBlocks.length).toBeGreaterThan(0);
    });

    it("should handle default tempo correctly", async () => {
        const midiWithoutTempo = {
            ...mockMidi,
            header: {
                ...mockMidi.header,
                tempos: []
            }
        };

        await transcribeMidi(midiWithoutTempo);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const bpmBlock = loadedBlocks.find(
            block => Array.isArray(block[1]) && block[1][0] === "setbpm3"
        );
        expect(bpmBlock).toBeDefined();
        const tempoValueBlock = loadedBlocks.find(block => block[0] === bpmBlock[4][1]);
        expect(tempoValueBlock).toBeDefined();
        // MIDI files without a tempo event play at 120 bpm, which is also the tempo
        // @tonejs/midi uses to time their notes.
        expect(tempoValueBlock[1][1].value).toBe(120);
    });

    it("should skip tracks with no notes", async () => {
        const emptyTrackMidi = {
            ...mockMidi,
            tracks: [{ ...mockMidi.tracks[0], notes: [] }]
        };

        await transcribeMidi(emptyTrackMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const trackBlocks = loadedBlocks.filter(
            block => Array.isArray(block[1]) && block[1][0] === "setturtlename2"
        );
        expect(trackBlocks.length).toBe(0);
    });

    it("should handle percussion instruments correctly", async () => {
        await transcribeMidi(mockMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const drumBlocks = loadedBlocks.filter(block => block[1] === "playdrum");
        expect(drumBlocks.length).toBeGreaterThan(0);
    });

    it("should keep a melodic track after percussion as pitches", async () => {
        const mixedTrackMidi = {
            header: mockMidi.header,
            tracks: [
                {
                    instrument: { name: "drums", percussion: true },
                    channel: 9,
                    notes: [{ name: "Kick Drum", midi: 36, time: 0, duration: 0.5 }]
                },
                {
                    instrument: { name: "acoustic grand piano", percussion: false },
                    channel: 0,
                    notes: [{ name: "C4", midi: 60, time: 0, duration: 0.5 }]
                }
            ]
        };

        await expect(transcribeMidi(mixedTrackMidi)).resolves.toBeNull();

        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        expect(loadedBlocks.filter(block => block[1] === "pitch")).toHaveLength(1);
        expect(loadedBlocks.filter(block => block[1] === "playdrum")).toHaveLength(1);
    });

    it("should preserve each percussion note's drum sound", async () => {
        const percussionMidi = {
            header: mockMidi.header,
            tracks: [
                {
                    instrument: { name: "drums", percussion: true },
                    channel: 9,
                    notes: [
                        { name: "Kick Drum", midi: 36, time: 0, duration: 0.5 },
                        { name: "Snare Drum", midi: 38, time: 0.5, duration: 0.5 }
                    ]
                }
            ]
        };

        await transcribeMidi(percussionMidi);

        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const drumNames = loadedBlocks
            .filter(block => Array.isArray(block[1]) && block[1][0] === "drumname")
            .map(block => block[1][1].value);
        expect(drumNames).toEqual(["kick drum", "snare drum"]);
    });

    it("should preserve a leading rest before a note", async () => {
        const delayedNoteMidi = {
            header: mockMidi.header,
            tracks: [
                {
                    instrument: { name: "acoustic grand piano", percussion: false },
                    channel: 0,
                    notes: [{ name: "C4", midi: 60, time: 0.5, duration: 0.5 }]
                }
            ]
        };

        await transcribeMidi(delayedNoteMidi);

        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        expect(loadedBlocks.filter(block => block[1] === "rest2")).toHaveLength(1);
        expect(loadedBlocks.filter(block => block[1] === "pitch")).toHaveLength(1);
    });

    it("should preserve simultaneous notes as a chord", async () => {
        const chordMidi = {
            header: mockMidi.header,
            tracks: [
                {
                    instrument: { name: "acoustic grand piano", percussion: false },
                    channel: 0,
                    notes: [
                        { name: "C4", midi: 60, time: 0, duration: 0.5 },
                        { name: "E4", midi: 64, time: 0, duration: 0.5 }
                    ]
                }
            ]
        };

        await transcribeMidi(chordMidi);

        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        expect(loadedBlocks.filter(block => block[1] === "pitch")).toHaveLength(2);
    });

    it("should preserve notes that overlap", async () => {
        const overlappingNotesMidi = {
            header: mockMidi.header,
            tracks: [
                {
                    instrument: { name: "acoustic grand piano", percussion: false },
                    channel: 0,
                    notes: [
                        { name: "C4", midi: 60, time: 0, duration: 1 },
                        { name: "E4", midi: 64, time: 0.5, duration: 0.5 }
                    ]
                }
            ]
        };

        await transcribeMidi(overlappingNotesMidi);

        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        expect(loadedBlocks.filter(block => block[1] === "pitch")).toHaveLength(2);
    });

    it("should assign correct instruments to tracks", async () => {
        await transcribeMidi(mockMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();

        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const instrumentBlocks = loadedBlocks.filter(
            block => Array.isArray(block[1]) && block[1][0] === "settimbre"
        );
        const nonPercussionTracks = mockMidi.tracks.filter(track => !track.instrument.percussion);
        instrumentBlocks.forEach((block, index) => {
            const instrumentName = nonPercussionTracks[index].instrument.name;
            expect(block[1][1].value).toBe(instrumentName);
        });
    });

    it("should generate correct note durations", async () => {
        await transcribeMidi(mockMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();

        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const noteBlocks = loadedBlocks.filter(
            block => Array.isArray(block[1]) && block[1][0] === "newnote"
        );

        noteBlocks.forEach(block => {
            const divideBlock = loadedBlocks.find(b => b[0] === block[4][1]);
            expect(divideBlock).toBeDefined();

            const numeratorBlock = loadedBlocks.find(b => b[0] === divideBlock[4][1]);
            const denominatorBlock = loadedBlocks.find(b => b[0] === divideBlock[4][2]);

            expect(numeratorBlock).toBeDefined();
            expect(denominatorBlock).toBeDefined();
            expect(numeratorBlock[1][1].value).toBeGreaterThan(0);
            expect(denominatorBlock[1][1].value).toBeGreaterThan(0);
        });
    });

    it("should generate rest notes for gaps between notes", async () => {
        await transcribeMidi(mockMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const restBlocks = loadedBlocks.filter(block => block[1] === "rest2");
        expect(restBlocks.length).toBeGreaterThan(0);
    });

    // Regression tests for the `for...in` string-key comparisons in
    // transcribeMidi(). `for (const i in sched)` yields string keys, so the
    // strict comparisons `i === 0`, `i === sched.length - 1`, `na === 0` and
    // `na === notes.length - 1` are never true. Those flags decide which block
    // each newnote and each trailing pitch docks to, so the emitted graph ends
    // up with connections that the target block does not reciprocate.
    const blockName = block => (Array.isArray(block[1]) ? block[1][0] : block[1]);

    /**
     * Mirrors the integrity check Blocks.adjustDocks() performs: for every
     * non-null connection A -> B, block B must list A among its own
     * connections. adjustDocks() logs "Did not find match for ..." and aborts
     * the rest of that block's docks when this does not hold.
     */
    const findUnreciprocatedConnections = blocks => {
        const byIndex = new Map(blocks.map(block => [block[0], block]));
        const broken = [];
        blocks.forEach(block => {
            const [index, , , , connections] = block;
            (connections || []).forEach((target, dock) => {
                if (target === null || target === undefined) return;
                const other = byIndex.get(target);
                if (other === undefined) {
                    broken.push(
                        `${blockName(block)}(${index}).connections[${dock}] -> missing block ${target}`
                    );
                    return;
                }
                if (!(other[4] || []).includes(index)) {
                    broken.push(
                        `${blockName(block)}(${index}).connections[${dock}] -> ` +
                            `${blockName(other)}(${target}), which does not connect back`
                    );
                }
            });
        });
        return broken;
    };

    it("should emit a block graph whose connections are all reciprocated", async () => {
        await transcribeMidi(mockMidi);
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];

        expect(findUnreciprocatedConnections(loadedBlocks)).toEqual([]);
    });

    it("should dock the first note of an action to the action, not to its name text", async () => {
        const singleNoteMidi = {
            header: mockMidi.header,
            tracks: [
                {
                    instrument: { name: "acoustic grand piano", percussion: false },
                    channel: 0,
                    notes: [{ name: "C4", midi: 60, time: 0, duration: 0.5 }]
                }
            ]
        };

        await transcribeMidi(singleNoteMidi);
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];

        const actionBlock = loadedBlocks.find(block => blockName(block) === "action");
        expect(actionBlock).toBeDefined();

        // connections[1] is the action's name text, connections[2] its first child.
        const nameText = loadedBlocks.find(block => block[0] === actionBlock[4][1]);
        const firstChild = loadedBlocks.find(block => block[0] === actionBlock[4][2]);
        expect(blockName(nameText)).toBe("text");
        expect(blockName(firstChild)).toBe("newnote");

        // The child has to point back at the action block.
        expect(firstChild[4][0]).toBe(actionBlock[0]);
        expect(firstChild[4][0]).not.toBe(nameText[0]);
    });

    it("should end the last pitch of a note rather than chaining it to the hidden block", async () => {
        const chordMidi = {
            header: mockMidi.header,
            tracks: [
                {
                    instrument: { name: "acoustic grand piano", percussion: false },
                    channel: 0,
                    notes: [
                        { name: "C4", midi: 60, time: 0, duration: 0.5 },
                        { name: "E4", midi: 64, time: 0, duration: 0.5 }
                    ]
                }
            ]
        };

        await transcribeMidi(chordMidi);
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];

        const pitchBlocks = loadedBlocks.filter(block => blockName(block) === "pitch");
        expect(pitchBlocks).toHaveLength(2);

        // connections[3] is the pitch's "next" dock. Only the last pitch of the
        // chord ends the stack.
        expect(pitchBlocks[0][4][3]).toBe(pitchBlocks[1][0]);
        expect(pitchBlocks[1][4][3]).toBeNull();
    });
    // Follow the generated Start/action connections, rather than treating array order as
    // playback order. Each Start stack has its own clock and tempo.
    const readPlayback = blocks => {
        const byIndex = new Map(blocks.map(block => [block[0], block]));
        const value = id => byIndex.get(id)[1][1].value;
        const fraction = id => {
            const divide = byIndex.get(id);
            return value(divide[4][1]) / value(divide[4][2]);
        };
        const actions = new Map(
            blocks
                .filter(block => blockName(block) === "action")
                .map(block => [value(block[4][1]), block[4][2]])
        );
        const notes = [];
        const walk = (id, clock) => {
            while (id !== null) {
                const block = byIndex.get(id);
                expect(block).toBeDefined();
                const name = blockName(block);
                if (name === "nameddo") {
                    walk(actions.get(block[1][1].value), clock);
                } else if (name === "settimbre") {
                    walk(block[4][2], clock);
                } else if (name === "setbpm3") {
                    clock.bpm = value(block[4][1]) * fraction(block[4][2]) * 4;
                } else if (name === "newnote") {
                    const duration = (fraction(block[4][1]) * 240) / clock.bpm;
                    const pitches = [];
                    let child = byIndex.get(block[4][2]);
                    while (child) {
                        const childName = blockName(child);
                        if (childName === "pitch") {
                            pitches.push(`${value(child[4][1])}${value(child[4][2])}`);
                        } else if (childName === "playdrum") {
                            pitches.push(value(child[4][1]));
                        }
                        child = byIndex.get(child[4][child[4].length - 1]);
                    }
                    const end = Math.round((clock.seconds + duration) * 1e8) / 1e8;
                    notes.push({ start: clock.seconds, end, pitches, voice: clock.voice });
                    clock.seconds = end;
                }
                id = block[4][block[4].length - 1];
            }
        };
        blocks
            .filter(block => blockName(block) === "start")
            .forEach((block, voice) => {
                walk(block[4][1], { seconds: 0, bpm: 120, voice });
            });
        return notes;
    };

    const attacksOf = notes =>
        notes
            .flatMap(({ start, end, pitches }) => pitches.map(pitch => [pitch, start, end]))
            .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]) || a[2] - b[2]);

    describe("polyphonic note boundaries", () => {
        const { Midi } = require("@tonejs/midi");

        const importNotes = async notes => {
            const file = new Midi();
            file.header.setTempo(120);
            const track = file.addTrack();
            notes.forEach(([midi, start, end]) => {
                track.addNote({ midi, time: start, duration: end - start });
            });
            const parsed = new Midi(file.toArray());
            await transcribeMidi(parsed, 1000);
            const blocks = loadNewBlocksSpy.mock.calls[0][0];
            const playback = readPlayback(blocks);
            const boundaries = [...new Set([0, ...playback.flatMap(n => [n.start, n.end])])].sort(
                (a, b) => a - b
            );
            const events = boundaries
                .slice(0, -1)
                .map((start, index) => [
                    boundaries[index + 1] - start,
                    playback.filter(n => n.start <= start && n.end > start).flatMap(n => n.pitches)
                ]);
            expect(findUnreciprocatedConnections(blocks)).toEqual([]);
            return { events, blocks, parsed, playback };
        };

        it("attacks a held note once while a shorter note enters and leaves", async () => {
            const { playback, blocks } = await importNotes([
                [60, 0, 2],
                [64, 0.5, 1]
            ]);
            expect(attacksOf(playback)).toEqual([
                ["C4", 0, 2],
                ["E4", 0.5, 1]
            ]);
            expect(blocks.filter(b => blockName(b) === "start")).toHaveLength(2);
        });

        it("keeps a sustained chord while another voice plays repeated notes", async () => {
            const { playback } = await importNotes([
                [60, 0, 2],
                [67, 0, 2],
                [64, 0.5, 1],
                [64, 1, 1.5]
            ]);
            expect(attacksOf(playback)).toEqual([
                ["C4", 0, 2],
                ["G4", 0, 2],
                ["E4", 0.5, 1],
                ["E4", 1, 1.5]
            ]);
        });

        it("keeps the same-pitch reattack at a shared end/start boundary", async () => {
            const { playback } = await importNotes([
                [60, 0, 1],
                [60, 1, 2],
                [64, 0.5, 1.5]
            ]);
            expect(attacksOf(playback)).toEqual([
                ["C4", 0, 1],
                ["E4", 0.5, 1.5],
                ["C4", 1, 2]
            ]);
        });

        it("keeps independent voices aligned across tempo changes and nonstandard gaps", async () => {
            const file = new Midi();
            file.header.tempos = [
                { ticks: 0, bpm: 120 },
                { ticks: 480, bpm: 60 }
            ];
            file.header.update();
            const track = file.addTrack();
            track.addNote({ midi: 60, ticks: 0, durationTicks: 1440 });
            track.addNote({ midi: 64, ticks: 240, durationTicks: 240 });
            track.addNote({ midi: 67, ticks: 600, durationTicks: 240 });
            track.addNote({ midi: 69, ticks: 960, durationTicks: 240 });
            const decoded = new Midi(file.toArray());
            await transcribeMidi(decoded, 1000);
            const blocks = loadNewBlocksSpy.mock.calls[0][0];
            expect(attacksOf(readPlayback(blocks))).toEqual([
                ["C4", 0, 2.5],
                ["E4", 0.25, 0.5],
                ["G4", 0.75, 1.25],
                ["A4", 1.5, 2]
            ]);
            expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        });

        it("keeps a long held note and a late voice entry at their full lengths", async () => {
            const { playback } = await importNotes([
                [60, 0, 8],
                [64, 4, 4.5]
            ]);
            expect(attacksOf(playback)).toEqual([
                ["C4", 0, 8],
                ["E4", 4, 4.5]
            ]);
        });

        it("copies the source track's instrument and name to its extra voices", async () => {
            const { blocks } = await importNotes([
                [60, 0, 2],
                [64, 0.5, 1]
            ]);
            const byIndex = new Map(blocks.map(b => [b[0], b]));
            expect(
                blocks.filter(b => blockName(b) === "voicename").map(b => b[1][1].value)
            ).toEqual(["piano", "piano"]);
            expect(
                blocks
                    .filter(b => blockName(b) === "setturtlename2")
                    .map(b => byIndex.get(b[4][1])[1][1].value)
            ).toEqual(["track0 voice 1", "track0 voice 2"]);
        });

        it("does not restart a held drum when another drum is struck", async () => {
            const file = new Midi();
            file.header.setTempo(120);
            const track = file.addTrack();
            track.channel = 9;
            track.addNote({ midi: 38, time: 0, duration: 2 });
            track.addNote({ midi: 36, time: 0.5, duration: 0.5 });
            track.addNote({ midi: 41, time: 0.5, duration: 0.5 });
            await transcribeMidi(new Midi(file.toArray()), 1000);
            const blocks = loadNewBlocksSpy.mock.calls[0][0];
            expect(attacksOf(readPlayback(blocks))).toEqual([
                ["snare drum", 0, 2],
                ["kick drum", 0.5, 1],
                ["tom tom", 0.5, 1]
            ]);
            expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        });

        it.each([0, 1, 2, 3, 4, 5, 6])(
            "honours a %i note-block limit across voices without orphaned stacks",
            async limit => {
                const file = new Midi();
                file.header.setTempo(120);
                const track = file.addTrack();
                track.addNote({ midi: 60, time: 0, duration: 2 });
                track.addNote({ midi: 64, time: 0.5, duration: 0.5 });
                track.addNote({ midi: 67, time: 0.75, duration: 0.5 });
                await transcribeMidi(new Midi(file.toArray()), limit);
                const blocks = loadNewBlocksSpy.mock.calls[0][0];
                expect(blocks.filter(b => blockName(b) === "newnote")).toHaveLength(
                    Math.min(limit, 5)
                );
                expect(findUnreciprocatedConnections(blocks)).toEqual([]);
                expect(blocks.every((block, index) => block[0] === index)).toBe(true);
                for (const action of blocks.filter(b => blockName(b) === "action")) {
                    expect(blockName(blocks[action[4][2]])).toBe("newnote");
                }
                const attacks = attacksOf(readPlayback(blocks));
                expect(attacks.length).toBeLessThanOrEqual(3);
                expect(new Set(attacks.map(a => a[0])).size).toBe(attacks.length);
            }
        );

        it.each([
            [
                "a later note outlasting the held note",
                [
                    [60, 0, 4],
                    [64, 1, 2],
                    [67, 3, 5]
                ],
                [
                    [1, ["C4"]],
                    [1, ["C4", "E4"]],
                    [1, ["C4"]],
                    [1, ["C4", "G4"]],
                    [1, ["G4"]]
                ]
            ],
            [
                "nested overlaps that begin before the previous tail",
                [
                    [60, 0, 4],
                    [64, 1, 3],
                    [67, 2, 4]
                ],
                [
                    [1, ["C4"]],
                    [1, ["C4", "E4"]],
                    [1, ["C4", "E4", "G4"]],
                    [1, ["C4", "G4"]]
                ]
            ],
            [
                "unequal-length notes starting together",
                [
                    [60, 0, 2],
                    [64, 0, 1]
                ],
                [
                    [1, ["C4", "E4"]],
                    [1, ["C4"]]
                ]
            ],
            [
                "a chord with identical start and end times",
                [
                    [60, 0, 1],
                    [64, 0, 1],
                    [67, 0, 1]
                ],
                [[1, ["C4", "E4", "G4"]]]
            ],
            [
                "a note ending exactly when the next begins",
                [
                    [60, 0, 1],
                    [64, 1, 2]
                ],
                [
                    [1, ["C4"]],
                    [1, ["E4"]]
                ]
            ],
            [
                "independent overlapping instances of the same pitch",
                [
                    [60, 0, 2],
                    [60, 1, 3]
                ],
                [
                    [1, ["C4"]],
                    [1, ["C4", "C4"]],
                    [1, ["C4"]]
                ]
            ],
            [
                "leading silence and gaps after a chord",
                [
                    [60, 1, 2],
                    [64, 1, 2],
                    [67, 3, 4]
                ],
                [
                    [1, []],
                    [1, ["C4", "E4"]],
                    [1, []],
                    [1, ["G4"]]
                ]
            ],
            [
                "zero-duration notes before leading silence",
                [
                    [60, 0, 0],
                    [64, 1, 2]
                ],
                [
                    [1, []],
                    [1, ["E4"]]
                ]
            ],
            [
                "notes collapsed by centisecond rounding",
                [
                    [60, 0, 0.001],
                    [64, 1, 2]
                ],
                [
                    [1, []],
                    [1, ["E4"]]
                ]
            ]
        ])(
            "preserves %s through MIDI decoding and block generation",
            async (_, notes, expected) => {
                const { events, playback, parsed } = await importNotes(notes);
                expect(events).toEqual(expected);
                expect(attacksOf(playback)).toEqual(
                    parsed.tracks[0].notes
                        .filter(
                            note =>
                                Math.round((note.time + note.duration) * 100) >
                                Math.round(note.time * 100)
                        )
                        .map(note => [note.name, note.time, note.time + note.duration])
                        .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]) || a[2] - b[2])
                );
            }
        );

        it("does not create an empty action or start stack for a track with no playable notes", async () => {
            const { events, blocks } = await importNotes([[60, 0, 0.001]]);
            expect(events).toEqual([]);
            expect(blocks).toEqual([]);
        });

        it("preserves overlapping notes and valid connections across action chunks", async () => {
            const notes = Array.from({ length: 60 }, (_, index) => [
                60 + (index % 12),
                index * 0.5,
                index * 0.5 + 1
            ]);
            const { events, blocks, parsed, playback } = await importNotes(notes);
            expect(attacksOf(playback)).toEqual(
                parsed.tracks[0].notes.map(note => [
                    note.name,
                    note.time,
                    note.time + note.duration
                ])
            );
            expect(blocks.every((block, index) => block[0] === index)).toBe(true);
            expect(blocks.filter(block => blockName(block) === "action").length).toBeGreaterThan(1);
            expect(events).toHaveLength(61);
            events.forEach(([duration, pitches], index) => {
                const start = index * 0.5;
                expect(duration).toBe(0.5);
                expect([...pitches].sort()).toEqual(
                    parsed.tracks[0].notes
                        .filter(note => note.time <= start && note.time + note.duration > start)
                        .map(note => note.name)
                        .sort()
                );
            });
        });

        it("skips an unplayable track without mixing subsequent tracks or their instruments", async () => {
            const file = new Midi();
            file.header.setTempo(120);
            file.addTrack().addNote({ midi: 60, time: 0, duration: 0.001 });
            const piano = file.addTrack();
            piano.instrument.number = 0;
            piano.addNote({ midi: 60, time: 0, duration: 2 });
            piano.addNote({ midi: 64, time: 1, duration: 2 });
            const guitar = file.addTrack();
            guitar.instrument.number = 24;
            guitar.addNote({ midi: 67, time: 0, duration: 1 });
            await transcribeMidi(new Midi(file.toArray()), 1000);
            const blocks = loadNewBlocksSpy.mock.calls[0][0];
            expect(findUnreciprocatedConnections(blocks)).toEqual([]);
            expect(blocks.filter(block => blockName(block) === "start")).toHaveLength(3);
            expect(
                blocks
                    .filter(block => blockName(block) === "voicename")
                    .map(block => block[1][1].value)
            ).toEqual(["piano", "piano", "guitar"]);
            expect(blocks.filter(block => blockName(block) === "newnote")).toHaveLength(4);
            expect(
                blocks
                    .filter(block => blockName(block) === "notename")
                    .map(block => block[1][1].value)
            ).toEqual(["C", "E", "G"]);
        });

        it("preserves active pitches for 100 deterministic overlapping tracks", async () => {
            let seed = 12345;
            const random = limit => {
                seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                return seed % limit;
            };
            for (let example = 0; example < 100; example++) {
                loadNewBlocksSpy.mockClear();
                const notes = Array.from({ length: 6 }, (_, index) => {
                    const start = random(5) * 0.5;
                    return [60 + index, start, start + (1 + random(4)) * 0.5];
                });
                const { events, parsed, playback } = await importNotes(notes);
                expect(attacksOf(playback)).toEqual(
                    parsed.tracks[0].notes
                        .map(note => [note.name, note.time, note.time + note.duration])
                        .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]) || a[2] - b[2])
                );
                const source = parsed.tracks[0].notes;
                const boundaries = [
                    ...new Set([
                        0,
                        ...source.flatMap(note => [note.time, note.time + note.duration])
                    ])
                ].sort((a, b) => a - b);
                const expected = boundaries.slice(0, -1).map((start, index) => {
                    const end = boundaries[index + 1];
                    const pitches = source
                        .filter(note => note.time <= start && note.time + note.duration > start)
                        .map(note => note.name)
                        .sort();
                    return [end - start, pitches];
                });
                expect(
                    events.map(([duration, pitches]) => [duration, [...pitches].sort()])
                ).toEqual(expected);
            }
        });
    });

    describe("tempo and note values", () => {
        const { Midi } = require("@tonejs/midi");
        const PPQ = 480;

        // Writes a real MIDI file with @tonejs/midi and reads it back, so every note carries
        // the time in seconds the library derives from the file's tempo map.
        // lengths are in quarter notes; a negative length is a rest.
        const midiFile = ({ tempos = [], timeSignature = null, lengths, tracks = [lengths] }) => {
            const midi = new Midi();
            midi.header.tempos = tempos.map(([ticks, bpm]) => ({ ticks, bpm }));
            if (timeSignature) {
                midi.header.timeSignatures = [{ ticks: 0, timeSignature }];
            }
            midi.header.update();
            tracks.forEach(trackLengths => {
                const track = midi.addTrack();
                track.instrument.number = 0;
                let ticks = 0;
                trackLengths.forEach((quarters, index) => {
                    const durationTicks = Math.abs(quarters) * PPQ;
                    if (quarters > 0) {
                        track.addNote({ midi: 60 + index, ticks, durationTicks });
                    }
                    ticks += durationTicks;
                });
            });
            return new Midi(midi.toArray());
        };

        const importBlocks = async file => {
            await transcribeMidi(file);
            return loadNewBlocksSpy.mock.calls[0][0];
        };

        const numberOf = (blocksByIndex, index) => blocksByIndex.get(index)[1][1].value;

        // Note values of the imported notes and rests, in order, as "numerator/denominator".
        const noteValues = blocks => {
            const byIndex = new Map(blocks.map(block => [block[0], block]));
            return blocks
                .filter(block => blockName(block) === "newnote")
                .map(block => {
                    const divide = byIndex.get(block[4][1]);
                    return `${numberOf(byIndex, divide[4][1])}/${numberOf(byIndex, divide[4][2])}`;
                });
        };

        // Decodes one setbpm3 block's own number into bpm/beatValue/quarterNotesPerMinute
        // (MeterActions.setBPM plays bpm * beatValue / 0.25 quarter notes per minute).
        const decodeTempo = (byIndex, setbpm) => {
            const beat = byIndex.get(setbpm[4][2]);
            const bpm = numberOf(byIndex, setbpm[4][1]);
            const beatValue = numberOf(byIndex, beat[4][1]) / numberOf(byIndex, beat[4][2]);
            return { bpm, beatValue, quarterNotesPerMinute: (bpm * beatValue) / 0.25 };
        };

        // The file's starting tempo. finalizeTracks() always appends exactly one setbpm3 per
        // track, after any mid-track tempo-change blocks (see midTrackTempoChanges below), so
        // it's always the *last* setbpm3 in the array even though it's chronologically first.
        const tempoOf = blocks => {
            const byIndex = new Map(blocks.map(block => [block[0], block]));
            const setbpms = blocks.filter(block => blockName(block) === "setbpm3");
            return decodeTempo(byIndex, setbpms[setbpms.length - 1]);
        };

        // Tempo changes mid-track, in chronological order. Only valid for a single-track
        // fixture: within one track these are pushed to the block array as the note loop
        // walks forward through the schedule, so array order matches chronological order.
        const midTrackTempoChanges = blocks => {
            const byIndex = new Map(blocks.map(block => [block[0], block]));
            const setbpms = blocks.filter(block => blockName(block) === "setbpm3");
            return setbpms.slice(0, -1).map(setbpm => decodeTempo(byIndex, setbpm));
        };

        it.each([40, 60, 72, 90, 120, 140, 180, 208])(
            "keeps quarter, eighth, half and whole notes at %i bpm",
            async bpm => {
                const blocks = await importBlocks(
                    midiFile({ tempos: [[0, bpm]], lengths: [1, 0.5, 0.5, 2, 4] })
                );

                expect(noteValues(blocks)).toEqual(["1/4", "1/8", "1/8", "1/2", "1/1"]);
                expect(tempoOf(blocks).quarterNotesPerMinute).toBe(bpm);
            }
        );

        it.each([
            [[4, 4], 120],
            [[3, 4], 96],
            [[6, 8], 120],
            [[2, 2], 120],
            [[3, 8], 72]
        ])(
            "plays a %j file at its own tempo of %i quarter notes per minute",
            async (meter, bpm) => {
                const blocks = await importBlocks(
                    midiFile({ tempos: [[0, bpm]], timeSignature: meter, lengths: [1, 1] })
                );
                const tempo = tempoOf(blocks);

                expect(tempo.quarterNotesPerMinute).toBe(bpm);
                expect(tempo.beatValue).toBe(1 / meter[1]);
                expect(noteValues(blocks)).toEqual(["1/4", "1/4"]);
            }
        );

        it("reads a file with no tempo event at 120 bpm, the MIDI default", async () => {
            const blocks = await importBlocks(midiFile({ lengths: [1, 0.5, 0.5] }));

            expect(noteValues(blocks)).toEqual(["1/4", "1/8", "1/8"]);
            expect(tempoOf(blocks).quarterNotesPerMinute).toBe(120);
        });

        // Seconds the imported project plays each note and rest for.
        const playbackSeconds = blocks => {
            const { quarterNotesPerMinute } = tempoOf(blocks);
            return noteValues(blocks).map(value => {
                const [numerator, denominator] = value.split("/").map(Number);
                return ((numerator / denominator) * 4 * 60) / quarterNotesPerMinute;
            });
        };

        it("writes a setbpm3 block at a tempo change, so notation reads at 120 after it", async () => {
            // 60 bpm for two quarter notes, then 120 bpm: under MIDI timing the notes last
            // 1, 1, 0.5, 0.5 and 1 seconds. Before the mid-track setbpm3 fix, every note was
            // notated against the file's starting 60 bpm alone, so notes 3-5 (actually
            // quarter, quarter, half at the new tempo) read as eighth, eighth, quarter.
            const blocks = await importBlocks(
                midiFile({
                    tempos: [
                        [0, 60],
                        [2 * PPQ, 120]
                    ],
                    lengths: [1, 1, 1, 1, 2]
                })
            );

            expect(tempoOf(blocks).quarterNotesPerMinute).toBe(60);
            expect(midTrackTempoChanges(blocks).map(t => t.quarterNotesPerMinute)).toEqual([120]);
            expect(noteValues(blocks)).toEqual(["1/4", "1/4", "1/4", "1/4", "1/2"]);

            // Playback timing is unchanged by the fix: each note still plays for as long as
            // it does in the file, just against the tempo actually in force at that point.
            const tempos = [60, 60, 120, 120, 120];
            const seconds = noteValues(blocks).map((value, i) => {
                const [numerator, denominator] = value.split("/").map(Number);
                return ((numerator / denominator) * 4 * 60) / tempos[i];
            });
            expect(seconds).toEqual([1, 1, 0.5, 0.5, 1]);
        });

        it("reads notes before a delayed first tempo event at 120 bpm, then at the new tempo", async () => {
            // MIDI plays 120 bpm until the first tempo event, here 60 bpm at the third
            // quarter note, so the notes and rest last 0.25, 0.25, 0.5, 1 and 1 seconds. Before
            // the fix, the last two notes (actually quarter notes at 60 bpm) were notated
            // against the file's starting 120 bpm alone and read as half notes.
            const blocks = await importBlocks(
                midiFile({ tempos: [[2 * PPQ, 60]], lengths: [0.5, -0.5, 1, 1, 1] })
            );

            expect(tempoOf(blocks).quarterNotesPerMinute).toBe(120);
            expect(midTrackTempoChanges(blocks).map(t => t.quarterNotesPerMinute)).toEqual([60]);
            expect(noteValues(blocks)).toEqual(["1/8", "1/8", "1/4", "1/4", "1/4"]);

            const tempos = [120, 120, 120, 60, 60];
            const seconds = noteValues(blocks).map((value, i) => {
                const [numerator, denominator] = value.split("/").map(Number);
                return ((numerator / denominator) * 4 * 60) / tempos[i];
            });
            expect(seconds).toEqual([0.25, 0.25, 0.5, 1, 1]);
        });

        it("sizes rests at the file's tempo", async () => {
            const blocks = await importBlocks(
                midiFile({ tempos: [[0, 150]], lengths: [1, -1, 0.5, -0.5, 1] })
            );

            expect(noteValues(blocks)).toEqual(["1/4", "1/4", "1/8", "1/8", "1/4"]);
            expect(blocks.filter(block => blockName(block) === "rest2")).toHaveLength(2);
        });

        it("keeps the block graph fully reciprocated across a tempo change", async () => {
            const blocks = await importBlocks(
                midiFile({
                    tempos: [
                        [0, 60],
                        [2 * PPQ, 120]
                    ],
                    lengths: [1, 1, 1, 1, 2]
                })
            );

            expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        });

        it("writes a setbpm3 block at each of several tempo changes, in order", async () => {
            // Three tempo segments: 60 bpm, then 90 at the second quarter, then 150 at the
            // fourth, each covering exactly one quarter note.
            const blocks = await importBlocks(
                midiFile({
                    tempos: [
                        [0, 60],
                        [PPQ, 90],
                        [3 * PPQ, 150]
                    ],
                    lengths: [1, 1, 1, 1]
                })
            );

            expect(tempoOf(blocks).quarterNotesPerMinute).toBe(60);
            expect(midTrackTempoChanges(blocks).map(t => t.quarterNotesPerMinute)).toEqual([
                90, 150
            ]);
            expect(noteValues(blocks)).toEqual(["1/4", "1/4", "1/4", "1/4"]);
            expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        });

        it("imports a melody that lasts as long as the file", async () => {
            const file = midiFile({ tempos: [[0, 150]], lengths: [1, 1, 0.5, 0.5, 2, 4] });
            const lastNote = file.tracks[0].notes[file.tracks[0].notes.length - 1];
            const blocks = await importBlocks(file);

            const wholeNotes = noteValues(blocks)
                .map(value => value.split("/").map(Number))
                .reduce((sum, [numerator, denominator]) => sum + numerator / denominator, 0);
            const seconds = (wholeNotes * 4 * 60) / tempoOf(blocks).quarterNotesPerMinute;

            expect(seconds).toBeCloseTo(lastNote.time + lastNote.duration, 2);
        });

        describe("long and tied lengths", () => {
            // Where each track's notes and rests start in whole notes, then where it ends
            const trackPositions = blocks => {
                const byIndex = new Map(blocks.map(block => [block[0], block]));
                const tracks = [];
                let positions;
                blocks.forEach(block => {
                    if (blockName(block) === "action") {
                        const track = parseInt(numberOf(byIndex, block[4][1]).slice(5));
                        positions = tracks[track] = tracks[track] || [0];
                    } else if (blockName(block) === "newnote") {
                        const divide = byIndex.get(block[4][1]);
                        const value =
                            numberOf(byIndex, divide[4][1]) / numberOf(byIndex, divide[4][2]);
                        positions.push(positions[positions.length - 1] + value);
                    }
                });
                return tracks;
            };

            it("keeps a rest of several bars at its full length", async () => {
                const blocks = await importBlocks(midiFile({ lengths: [-8, 1, 1] }));

                expect(noteValues(blocks)).toEqual(["2/1", "1/4", "1/4"]);
            });

            it("keeps a track that comes in after a long rest in time with the others", async () => {
                const blocks = await importBlocks(
                    midiFile({ tracks: [Array(12).fill(1), [-8, 1, 1, 1, 1]] })
                );

                const [melody, bass] = trackPositions(blocks);
                expect(bass[1]).toBe(melody[8]);
                expect(bass[bass.length - 1]).toBe(melody[melody.length - 1]);
            });

            it("keeps a note held over several bars at its full length", async () => {
                const blocks = await importBlocks(midiFile({ lengths: [9, 11.5, 1] }));

                expect(noteValues(blocks)).toEqual(["9/4", "23/8", "1/4"]);
            });

            it("keeps a note that runs across a tempo change at its own length", async () => {
                // One second at 120 bpm then one at 240 bpm, all played at 120 bpm
                const blocks = await importBlocks(
                    midiFile({
                        tempos: [
                            [0, 120],
                            [2 * PPQ, 240]
                        ],
                        lengths: [6, 1]
                    })
                );

                expect(noteValues(blocks)).toEqual(["1/1", "1/4"]);
                expect(midTrackTempoChanges(blocks).map(t => t.quarterNotesPerMinute)).toEqual([
                    240
                ]);
            });

            it("writes tied lengths exactly", async () => {
                const blocks = await importBlocks(
                    midiFile({ lengths: [2.5, 0.5, 1, 5, 3, 3.5, 0.5, 1.75] })
                );

                expect(noteValues(blocks)).toEqual([
                    "5/8",
                    "1/8",
                    "1/4",
                    "5/4",
                    "3/4",
                    "7/8",
                    "1/8",
                    "7/16"
                ]);
            });

            it("does not let rounding add up along a track", async () => {
                const lengths = Array(12).fill(1.1);
                const blocks = await importBlocks(midiFile({ lengths }));

                const total = noteValues(blocks)
                    .map(value => value.split("/").map(Number))
                    .reduce((sum, [numerator, denominator]) => sum + numerator / denominator, 0);
                expect(Math.abs(total - (12 * 1.1) / 4)).toBeLessThan(1 / 32);
            });
        });

        describe("dotted notes and triplets", () => {
            // Pitches of the imported notes, in order, as [note name, octave].
            const pitchesOf = blocks => {
                const byIndex = new Map(blocks.map(block => [block[0], block]));
                return blocks
                    .filter(block => blockName(block) === "pitch")
                    .map(block => [numberOf(byIndex, block[4][1]), numberOf(byIndex, block[4][2])]);
            };

            it.each([60, 120, 180])(
                "imports dotted notes at their dotted length at %i bpm",
                async bpm => {
                    // dotted quarter, eighth, dotted half, quarter, dotted eighth, sixteenth,
                    // dotted whole
                    const blocks = await importBlocks(
                        midiFile({ tempos: [[0, bpm]], lengths: [1.5, 0.5, 3, 1, 0.75, 0.25, 6] })
                    );

                    expect(noteValues(blocks)).toEqual([
                        "3/8",
                        "1/8",
                        "3/4",
                        "1/4",
                        "3/16",
                        "1/16",
                        "3/2"
                    ]);
                }
            );

            it("imports eighth-, quarter- and half-note triplets", async () => {
                const blocks = await importBlocks(
                    midiFile({
                        tempos: [[0, 120]],
                        lengths: [1 / 3, 1 / 3, 1 / 3, 2 / 3, 2 / 3, 2 / 3, 4 / 3, 4 / 3, 4 / 3]
                    })
                );

                expect(noteValues(blocks)).toEqual([
                    "1/12",
                    "1/12",
                    "1/12",
                    "1/6",
                    "1/6",
                    "1/6",
                    "1/3",
                    "1/3",
                    "1/3"
                ]);
            });

            it("imports a melody with dotted notes and triplets that lasts as long as the file", async () => {
                const file = midiFile({
                    tempos: [[0, 150]],
                    lengths: [1.5, 0.5, 1 / 3, 1 / 3, 1 / 3, 3, 0.75, 0.25, 2 / 3, 2 / 3, 2 / 3]
                });
                const lastNote = file.tracks[0].notes[file.tracks[0].notes.length - 1];
                const blocks = await importBlocks(file);

                const seconds = playbackSeconds(blocks).reduce((sum, value) => sum + value, 0);

                expect(seconds).toBeCloseTo(lastNote.time + lastNote.duration, 2);
            });

            it("keeps a sixteenth note played short a sixteenth", async () => {
                // At 96 of its 120 ticks, the sixteenth is nearer a dotted thirty-second (3/64)
                // than a sixteenth, which is why dotted values shorter than 3/32 aren't used.
                const blocks = await importBlocks(
                    midiFile({ tempos: [[0, 120]], lengths: [96 / PPQ, 1] })
                );

                expect(noteValues(blocks)).toEqual(["1/16", "1/4"]);
            });

            it("reads notes in MIDI's lowest octave with their octave number", async () => {
                const midi = new Midi();
                const track = midi.addTrack();
                track.addNote({ midi: 0, ticks: 0, durationTicks: PPQ });
                track.addNote({ midi: 11, ticks: PPQ, durationTicks: PPQ });
                track.addNote({ midi: 61, ticks: 2 * PPQ, durationTicks: PPQ });
                const blocks = await importBlocks(new Midi(midi.toArray()));

                expect(pitchesOf(blocks)).toEqual([
                    ["C", -1],
                    ["B", -1],
                    ["C#", 4]
                ]);
            });
        });
    });

    it("stops at the requested 100 note-block limit across action chunks", async () => {
        const { Midi } = require("@tonejs/midi");
        const PPQ = 480;
        const midi = new Midi();
        midi.header.tempos = [{ ticks: 0, bpm: 120 }];
        midi.header.update();
        const track = midi.addTrack();
        track.instrument.number = 0;
        // Add 150 notes to exceed the 100 limit
        for (let i = 0; i < 150; i++) {
            track.addNote({ midi: 60, ticks: i * PPQ, durationTicks: PPQ });
        }

        await transcribeMidi(new Midi(midi.toArray()), 100);

        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const noteBlocks = loadedBlocks.filter(
            block => Array.isArray(block[1]) && block[1][0] === "newnote"
        );

        // This exactly matches the legacy `master` behavior.
        expect(noteBlocks.length).toBe(100);
    });
});
