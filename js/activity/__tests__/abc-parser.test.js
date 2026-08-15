// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

"use strict";

const { setupActivityAbcParser } = require("../abc-parser.js");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal activity instance with a spy on loadNewBlocks. */
function makeActivity() {
    const activity = {
        blocks: {
            loadNewBlocks: jest.fn()
        }
    };
    setupActivityAbcParser(activity);
    return activity;
}

/**
 * Returns the flat block array passed to loadNewBlocks after calling parseABC.
 * Asserts that loadNewBlocks was called exactly once.
 */
async function parseAndCapture(tune) {
    const activity = makeActivity();
    await activity.parseABC(tune);
    expect(activity.blocks.loadNewBlocks).toHaveBeenCalledTimes(1);
    return activity.blocks.loadNewBlocks.mock.calls[0][0];
}

/** Build a bare-minimum note element matching ABCJS output shape. */
function makeNote(name, pitch, duration = 0.25, opts = {}) {
    return {
        el_type: "note",
        pitches: [{ name, pitch }],
        duration,
        startTriplet: opts.startTriplet ?? null,
        endTriplet: opts.endTriplet ?? null
    };
}

/** Build a bar element. */
function makeBar(type = "bar_thin") {
    return { el_type: "bar", type };
}

/**
 * Build a minimal tune matching the shape that ABCJS.parseOnly returns.
 * `staves` is an array — one entry per staff/voice.
 */
function makeTune({
    title = "Test",
    instruction = "guitar",
    staves = [
        {
            meter: { value: [{ num: 4, den: 4 }] },
            key: { root: "C", mode: "major", accidentals: [] },
            voices: [[makeNote("C", 0)]]
        }
    ]
} = {}) {
    // Each staff appears as one entry in line.staff
    return {
        metaText: { title, instruction },
        lines: [{ staff: staves }]
    };
}

/** Return all blocks with a given block-type string (or type tuple first element). */
function blocksOfType(blocks, type) {
    return blocks.filter(b => {
        const t = Array.isArray(b[1]) ? b[1][0] : b[1];
        return t === type;
    });
}

// ---------------------------------------------------------------------------
// Mock toFraction globally (musicutils.js is not loaded in this unit context)
// ---------------------------------------------------------------------------
beforeAll(() => {
    global.toFraction = duration => {
        // Simplified: return [numerator, denominator] for common durations
        const map = {
            0.0625: [1, 16],
            0.125: [1, 8],
            0.25: [1, 4],
            0.5: [1, 2],
            1: [1, 1]
        };
        return map[duration] ?? [Math.round(duration * 8), 8];
    };
});

afterEach(() => {
    jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test 1 — Simple melody (single voice, G major, 4/4)
// ---------------------------------------------------------------------------
describe("Test 1: Simple melody", () => {
    const tune = makeTune({
        title: "Twinkle",
        staves: [
            {
                meter: { value: [{ num: 4, den: 4 }] },
                key: { root: "G", mode: "major", accidentals: [] },
                voices: [[makeNote("D", 2), makeNote("D", 2), makeNote("G", 4), makeNote("G", 4)]]
            }
        ]
    });

    test("loadNewBlocks is called", async () => {
        const activity = makeActivity();
        await activity.parseABC(tune);
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalledTimes(1);
    });

    test("result contains exactly one start block", async () => {
        const blocks = await parseAndCapture(tune);
        const starts = blocksOfType(blocks, "start");
        expect(starts).toHaveLength(1);
    });

    test("start block has correct meter (4/4) embedded in startBlock", async () => {
        const blocks = await parseAndCapture(tune);
        // The meter numerator block has value 4
        const meterNumBlocks = blocks.filter(
            b => Array.isArray(b[1]) && b[1][0] === "number" && b[1][1]?.value === 4
        );
        expect(meterNumBlocks.length).toBeGreaterThanOrEqual(1);
    });

    test("result contains newnote blocks for each note", async () => {
        const blocks = await parseAndCapture(tune);
        const newnotes = blocksOfType(blocks, "newnote");
        expect(newnotes).toHaveLength(4);
    });

    test("result contains pitch blocks for each note", async () => {
        const blocks = await parseAndCapture(tune);
        const pitchBlocks = blocksOfType(blocks, "pitch");
        expect(pitchBlocks).toHaveLength(4);
    });

    test("setkey2 block references G major", async () => {
        const blocks = await parseAndCapture(tune);
        const keyRootBlocks = blocks.filter(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "G"
        );
        expect(keyRootBlocks.length).toBeGreaterThanOrEqual(1);
    });

    test("parseABC returns null", async () => {
        const activity = makeActivity();
        const result = await activity.parseABC(tune);
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// Test 2 — Multiple voices (two staves → two Start stacks)
// ---------------------------------------------------------------------------
describe("Test 2: Multiple voices", () => {
    const tune = makeTune({
        title: "Two Voices",
        staves: [
            {
                meter: { value: [{ num: 4, den: 4 }] },
                key: { root: "C", mode: "major", accidentals: [] },
                voices: [[makeNote("C", 0), makeNote("E", 2), makeNote("G", 4)]]
            },
            {
                meter: { value: [{ num: 4, den: 4 }] },
                key: { root: "C", mode: "major", accidentals: [] },
                voices: [[makeNote("G", 4, 0.5), makeNote("C", 0, 0.5)]]
            }
        ]
    });

    test("loadNewBlocks is called once with all blocks combined", async () => {
        const activity = makeActivity();
        await activity.parseABC(tune);
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalledTimes(1);
    });

    test("result contains exactly two start blocks", async () => {
        const blocks = await parseAndCapture(tune);
        const starts = blocksOfType(blocks, "start");
        expect(starts).toHaveLength(2);
    });

    test("voice label blocks are present for each voice", async () => {
        const blocks = await parseAndCapture(tune);
        const voice1Label = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "text" && b[1][1]?.value === "Voice 1 "
        );
        const voice2Label = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "text" && b[1][1]?.value === "Voice 2 "
        );
        expect(voice1Label).toBeDefined();
        expect(voice2Label).toBeDefined();
    });

    test("newnote blocks span both voices", async () => {
        const blocks = await parseAndCapture(tune);
        // Voice 1: 3 notes, Voice 2: 2 notes
        const newnotes = blocksOfType(blocks, "newnote");
        expect(newnotes).toHaveLength(5);
    });
});

// ---------------------------------------------------------------------------
// Test 3 — Repeat bars
// ---------------------------------------------------------------------------
describe("Test 3: Repeat bars", () => {
    const tune = makeTune({
        title: "With Repeat",
        staves: [
            {
                meter: { value: [{ num: 4, den: 4 }] },
                key: { root: "C", mode: "major", accidentals: [] },
                voices: [
                    [
                        makeBar("bar_left_repeat"),
                        makeNote("C", 0),
                        makeNote("D", 1),
                        makeNote("E", 2),
                        makeNote("F", 3),
                        makeBar("bar_right_repeat")
                    ]
                ]
            }
        ]
    });

    test("result contains a repeat block", async () => {
        const blocks = await parseAndCapture(tune);
        const repeats = blocksOfType(blocks, "repeat");
        expect(repeats.length).toBeGreaterThanOrEqual(1);
    });

    test("repeat block has value 2 (repeat twice)", async () => {
        const blocks = await parseAndCapture(tune);
        // The number block adjacent to repeat has value 2
        const repeatCount = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "number" && b[1][1]?.value === 2
        );
        expect(repeatCount).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// Test 4 — Triplets
// ---------------------------------------------------------------------------
describe("Test 4: Triplets", () => {
    const tune = makeTune({
        title: "Triplet Test",
        staves: [
            {
                meter: { value: [{ num: 4, den: 4 }] },
                key: { root: "C", mode: "major", accidentals: [] },
                voices: [
                    [
                        makeNote("C", 0, 0.125, { startTriplet: 3 }),
                        makeNote("D", 1, 0.125),
                        makeNote("E", 2, 0.125, { endTriplet: 3 }),
                        makeNote("F", 3, 0.25)
                    ]
                ]
            }
        ]
    });

    test("result contains newnote blocks", async () => {
        const blocks = await parseAndCapture(tune);
        const newnotes = blocksOfType(blocks, "newnote");
        expect(newnotes).toHaveLength(4);
    });

    test("triplet notes have modified denominator (meterDen * triplet = 4*3=12)", async () => {
        const blocks = await parseAndCapture(tune);
        // Triplet notes: denominator should be meterDen(4) * triplet(3) = 12
        const denomWith12 = blocks.filter(
            b => Array.isArray(b[1]) && b[1][0] === "number" && b[1][1]?.value === 12
        );
        // 3 triplet notes each producing a denominator block of 12
        expect(denomWith12).toHaveLength(3);
    });

    test("non-triplet note has standard denominator (4)", async () => {
        const blocks = await parseAndCapture(tune);
        // The last note (F, duration 0.25) should use standard 1/4
        const denomWith4 = blocks.filter(
            b => Array.isArray(b[1]) && b[1][0] === "number" && b[1][1]?.value === 4
        );
        expect(denomWith4.length).toBeGreaterThanOrEqual(1);
    });

    test("tripletFinder does not bleed across voice boundaries", async () => {
        // Voice 1: triplet C D E then normal F.
        // Voice 2: plain quarter notes only — must NOT inherit the triplet state
        // from voice 1 and must produce standard denominator (4), not 12.
        const twoVoiceTune = makeTune({
            title: "Triplet Bleed Test",
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [
                        [
                            makeNote("C", 0, 0.125, { startTriplet: 3 }),
                            makeNote("D", 1, 0.125),
                            makeNote("E", 2, 0.125, { endTriplet: 3 })
                        ],
                        [makeNote("G", 4, 0.25), makeNote("A", 5, 0.25)]
                    ]
                }
            ]
        });

        const blocks = await parseAndCapture(twoVoiceTune);

        // Voice 1 produces 3 triplet newnote blocks (denominator 12)
        const denomWith12 = blocks.filter(
            b => Array.isArray(b[1]) && b[1][0] === "number" && b[1][1]?.value === 12
        );
        expect(denomWith12).toHaveLength(3);

        // Voice 2 produces 2 plain newnote blocks — denominator must be 4, not 12
        // There should be exactly 2 divide blocks whose denominator child is 4
        // (one per plain note in voice 2). The meter block also contributes a 4,
        // so we check that there are at least 2 occurrences beyond the meter block.
        const denomWith4 = blocks.filter(
            b => Array.isArray(b[1]) && b[1][0] === "number" && b[1][1]?.value === 4
        );
        // meter num (4) + 2 plain note denominators = at least 3
        expect(denomWith4.length).toBeGreaterThanOrEqual(3);
    });

    test("tripletFinder does not bleed across voice boundaries even if triplet is unclosed", async () => {
        // Voice 1: triplet C D E (no endTriplet, i.e., unclosed triplet).
        // Voice 2: plain quarter notes only — must NOT inherit the triplet state
        // and must produce standard denominator (4).
        const twoVoiceTune = makeTune({
            title: "Unclosed Triplet Bleed Test",
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [
                        [
                            makeNote("C", 0, 0.125, { startTriplet: 3 }),
                            makeNote("D", 1, 0.125),
                            makeNote("E", 2, 0.125)
                        ],
                        [makeNote("G", 4, 0.25), makeNote("A", 5, 0.25)]
                    ]
                }
            ]
        });

        const blocks = await parseAndCapture(twoVoiceTune);

        // Voice 1 notes will all be processed under triplet state because it started and never closed,
        // so all 3 notes get denominator 12.
        const denomWith12 = blocks.filter(
            b => Array.isArray(b[1]) && b[1][0] === "number" && b[1][1]?.value === 12
        );
        expect(denomWith12).toHaveLength(3);

        // Voice 2 notes must not be affected. They must have standard denominator 4.
        const denomWith4 = blocks.filter(
            b => Array.isArray(b[1]) && b[1][0] === "number" && b[1][1]?.value === 4
        );
        expect(denomWith4.length).toBeGreaterThanOrEqual(3);
    });
});

// ---------------------------------------------------------------------------
// Test 5 — Key signature with accidentals (F major = B♭)
// ---------------------------------------------------------------------------
describe("Test 5: Key signature accidentals (F major)", () => {
    // F major has one flat: B♭
    const fMajorKey = {
        root: "F",
        mode: "major",
        accidentals: [{ note: "B", acc: "flat" }]
    };

    const tune = makeTune({
        title: "F Major Scale",
        staves: [
            {
                meter: { value: [{ num: 4, den: 4 }] },
                key: fMajorKey,
                voices: [
                    [
                        makeNote("F", 3),
                        makeNote("G", 4),
                        makeNote("A", 5),
                        makeNote("B", 6) // B should become B♭
                    ]
                ]
            }
        ]
    });

    test("setkey2 block references F root", async () => {
        const blocks = await parseAndCapture(tune);
        const fKeyRoot = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "F"
        );
        expect(fKeyRoot).toBeDefined();
    });

    test("B note gets flat symbol applied by _adjustPitch", async () => {
        const blocks = await parseAndCapture(tune);
        // The notename block for B should be "B♭" (uppercased)
        const bFlatBlock = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "B♭"
        );
        expect(bFlatBlock).toBeDefined();
    });

    test("non-accidental notes are unmodified", async () => {
        const blocks = await parseAndCapture(tune);
        const fBlock = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "F"
        );
        expect(fBlock).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// Test 6 — Empty-voice / degenerate input guard (issue: actionBlock[0] crash)
// ---------------------------------------------------------------------------
describe("Test 6: Empty-voice and degenerate input guard", () => {
    test("tune with no lines resolves without throwing and passes empty array to loadNewBlocks", async () => {
        const activity = makeActivity();
        const emptyTune = { metaText: { title: "Empty" }, lines: [] };
        await expect(activity.parseABC(emptyTune)).resolves.toBeNull();
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith([]);
    });

    test("voice containing only bar elements does not crash", async () => {
        const activity = makeActivity();
        // A voice with only repeat-bar markers and no notes — actionBlock stays empty.
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [[makeBar("bar_left_repeat"), makeBar("bar_right_repeat")]]
                }
            ]
        });
        await expect(activity.parseABC(tune)).resolves.toBeNull();
    });

    test("mixed voice — bar-only voice followed by note voice — does not crash", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [
                        [makeBar("bar_left_repeat"), makeBar("bar_right_repeat")],
                        [makeNote("C", 0), makeNote("D", 1)]
                    ]
                }
            ]
        });
        const activity = makeActivity();
        await expect(activity.parseABC(tune)).resolves.toBeNull();
    });

    test("mixed voice — note voice followed by bar-only voice — does not crash or duplicate", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [
                        [makeNote("C", 0), makeNote("D", 1)],
                        [makeBar("bar_left_repeat"), makeBar("bar_right_repeat")]
                    ]
                }
            ]
        });
        const activity = makeActivity();
        await activity.parseABC(tune);
        expect(activity.blocks.loadNewBlocks).toHaveBeenCalledTimes(1);
        const finalBlocks = activity.blocks.loadNewBlocks.mock.calls[0][0];
        // The notes should only be added once, meaning there should be exactly two newnote blocks.
        const newnotes = finalBlocks.filter(
            b => (Array.isArray(b[1]) ? b[1][0] : b[1]) === "newnote"
        );
        expect(newnotes).toHaveLength(2);
    });
});
