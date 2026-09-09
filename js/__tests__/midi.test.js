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
});
