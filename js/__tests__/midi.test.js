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
        tempos: [{ bpm: 120 }],
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
        expect(loadedBlocks.filter(block => block[1] === "pitch")).toHaveLength(3);
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
    describe("tempo and note values", () => {
        const { Midi } = require("@tonejs/midi");
        const PPQ = 480;

        // Writes a real MIDI file with @tonejs/midi and reads it back, so every note carries
        // the time in seconds the library derives from the file's tempo map.
        // lengths are in quarter notes; a negative length is a rest.
        const midiFile = ({ tempos = [], timeSignature = null, lengths }) => {
            const midi = new Midi();
            midi.header.tempos = tempos.map(([ticks, bpm]) => ({ ticks, bpm }));
            if (timeSignature) {
                midi.header.timeSignatures = [{ ticks: 0, timeSignature }];
            }
            midi.header.update();
            const track = midi.addTrack();
            track.instrument.number = 0;
            let ticks = 0;
            lengths.forEach((quarters, index) => {
                const durationTicks = Math.abs(quarters) * PPQ;
                if (quarters > 0) {
                    track.addNote({ midi: 60 + index, ticks, durationTicks });
                }
                ticks += durationTicks;
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

        // The imported beats-per-minute block, and the quarter notes per minute it plays at
        // (MeterActions.setBPM plays bpm * beatValue / 0.25 quarter notes per minute).
        const tempoOf = blocks => {
            const byIndex = new Map(blocks.map(block => [block[0], block]));
            const setbpm = blocks.find(block => blockName(block) === "setbpm3");
            const beat = byIndex.get(setbpm[4][2]);
            const bpm = numberOf(byIndex, setbpm[4][1]);
            const beatValue = numberOf(byIndex, beat[4][1]) / numberOf(byIndex, beat[4][2]);
            return { bpm, beatValue, quarterNotesPerMinute: (bpm * beatValue) / 0.25 };
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

        it("plays every note for as long as the file does across a tempo change", async () => {
            // 60 bpm for two quarter notes, then 120 bpm: under MIDI timing the notes last
            // 1, 1, 0.5, 0.5 and 1 seconds, and the half note spans the change.
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
            expect(noteValues(blocks)).toEqual(["1/4", "1/4", "1/8", "1/8", "1/4"]);
            expect(playbackSeconds(blocks)).toEqual([1, 1, 0.5, 0.5, 1]);
        });

        it("reads notes before a delayed first tempo event at 120 bpm", async () => {
            // MIDI plays 120 bpm until the first tempo event, here 60 bpm at the third
            // quarter note, so the notes and rest last 0.25, 0.25, 0.5, 1 and 1 seconds.
            const blocks = await importBlocks(
                midiFile({ tempos: [[2 * PPQ, 60]], lengths: [0.5, -0.5, 1, 1, 1] })
            );

            expect(tempoOf(blocks).quarterNotesPerMinute).toBe(120);
            expect(noteValues(blocks)).toEqual(["1/8", "1/8", "1/4", "1/2", "1/2"]);
            expect(playbackSeconds(blocks)).toEqual([0.25, 0.25, 0.5, 1, 1]);
        });

        it("sizes rests at the file's tempo", async () => {
            const blocks = await importBlocks(
                midiFile({ tempos: [[0, 150]], lengths: [1, -1, 0.5, -0.5, 1] })
            );

            expect(noteValues(blocks)).toEqual(["1/4", "1/4", "1/8", "1/8", "1/4"]);
            expect(blocks.filter(block => blockName(block) === "rest2")).toHaveLength(2);
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

    it("should preserve master's chunking behavior and emit exactly 121 blocks for a 100 limit", async () => {
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

        // This asserts that totalnoteblockCount only counts closed chunks
        // ensuring maxNoteBlocks behaves exactly as it did before the refactor
        expect(noteBlocks.length).toBe(121);
    });
});
