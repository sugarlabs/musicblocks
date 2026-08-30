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
        expect(tempoValueBlock[1][1].value).toBe(90);
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

    it("should not treat a melodic track as percussion when it follows a percussion track", async () => {
        // Track order: percussion first, then melodic.
        const percussionFirstMidi = {
            ...mockMidi,
            tracks: [
                {
                    instrument: {
                        name: "drums",
                        family: "percussion",
                        number: 128,
                        percussion: true
                    },
                    channel: 9,
                    notes: [{ name: "Kick Drum", midi: 36, time: 0, duration: 0.5, velocity: 0.8 }]
                },
                {
                    instrument: {
                        name: "acoustic grand piano",
                        family: "piano",
                        number: 0,
                        percussion: false
                    },
                    channel: 1,
                    notes: [{ name: "C4", midi: 60, time: 0, duration: 0.5, velocity: 0.8 }]
                }
            ]
        };

        await transcribeMidi(percussionFirstMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];

        // The melodic track must produce pitch blocks, not playdrum blocks.
        const pitchBlocks = loadedBlocks.filter(block => block[1] === "pitch");
        expect(pitchBlocks.length).toBeGreaterThan(0);
    });

    it("should map each percussion note to its own drum sound", async () => {
        const singlePercussionMidi = {
            ...mockMidi,
            tracks: [
                {
                    instrument: {
                        name: "drums",
                        family: "percussion",
                        number: 128,
                        percussion: true
                    },
                    channel: 9,
                    notes: [
                        { name: "Kick Drum", midi: 36, time: 0, duration: 0.3, velocity: 0.8 },
                        { name: "Snare Drum", midi: 38, time: 0.5, duration: 0.3, velocity: 0.9 }
                    ]
                }
            ]
        };

        await transcribeMidi(singlePercussionMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];

        // Both a kick drum and a snare drum block must be present.
        const drumnameBlocks = loadedBlocks.filter(
            block => Array.isArray(block[1]) && block[1][0] === "drumname"
        );
        const drumValues = drumnameBlocks.map(block => block[1][1].value);
        expect(drumValues).toContain("kick drum");
        expect(drumValues).toContain("snare drum");
    });

    it("should fall back to the default time signature when none is provided", async () => {
        const noTimeSigMidi = {
            ...mockMidi,
            header: { ...mockMidi.header, timeSignatures: [] }
        };
        await transcribeMidi(noTimeSigMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        expect(Array.isArray(loadedBlocks)).toBe(true);
    });

    it("should insert a leading rest when the first note does not start at time zero", async () => {
        const lateStartMidi = {
            ...mockMidi,
            tracks: [
                {
                    instrument: {
                        name: "acoustic grand piano",
                        family: "piano",
                        number: 0,
                        percussion: false
                    },
                    channel: 1,
                    notes: [{ name: "C4", midi: 60, time: 0.5, duration: 0.5, velocity: 0.8 }]
                }
            ]
        };
        await transcribeMidi(lateStartMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const restBlocks = loadedBlocks.filter(block => block[1] === "rest2");
        expect(restBlocks.length).toBeGreaterThan(0);
    });

    it("should merge simultaneous notes into a single chord slot", async () => {
        const chordMidi = {
            ...mockMidi,
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
                        { name: "E4", midi: 64, time: 0, duration: 0.5, velocity: 0.9 }
                    ]
                }
            ]
        };
        await transcribeMidi(chordMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const pitchBlocks = loadedBlocks.filter(block => block[1] === "pitch");
        expect(pitchBlocks.length).toBe(2);
    });

    it("should handle overlapping notes by splitting the schedule slot", async () => {
        const overlappingMidi = {
            ...mockMidi,
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
                        // C4 ends at 1.5; E4 starts at 0.5 and ends at 0.8 (oldEnd > end → hits line 144)
                        { name: "C4", midi: 60, time: 0, duration: 1.5, velocity: 0.8 },
                        { name: "E4", midi: 64, time: 0.5, duration: 0.3, velocity: 0.8 }
                    ]
                }
            ]
        };
        await transcribeMidi(overlappingMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        expect(loadedBlocks.length).toBeGreaterThan(0);
    });

    it("should split into multiple action block chunks when cumulative duration exceeds 16", async () => {
        const longTrackMidi = {
            ...mockMidi,
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
                        { name: "C4", midi: 60, time: 0, duration: 17, velocity: 0.8 },
                        { name: "E4", midi: 64, time: 17, duration: 0.5, velocity: 0.8 }
                    ]
                }
            ]
        };
        await transcribeMidi(longTrackMidi);
        expect(loadNewBlocksSpy).toHaveBeenCalled();
        const loadedBlocks = loadNewBlocksSpy.mock.calls[0][0];
        const actionBlocks = loadedBlocks.filter(
            block => Array.isArray(block[1]) && block[1][0] === "action"
        );
        expect(actionBlocks.length).toBeGreaterThan(1);
    });

    it("should stop and warn when the maxNoteBlocks limit is exceeded", async () => {
        // A 17-second note forces isLastNoteInBlock=true after the first note, incrementing
        // totalnoteblockCount, so the >= maxNoteBlocks guard fires on the second note.
        const largeMidi = {
            ...mockMidi,
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
                        { name: "C4", midi: 60, time: 0, duration: 1, velocity: 0.8 },
                        { name: "E4", midi: 64, time: 1, duration: 16, velocity: 0.8 },
                        { name: "G4", midi: 67, time: 17, duration: 1, velocity: 0.8 }
                    ]
                }
            ]
        };
        await transcribeMidi(largeMidi, 1);
        expect(activity.textMsg).toHaveBeenCalledWith(
            expect.stringContaining("MIDI file is too large")
        );
    });
});
