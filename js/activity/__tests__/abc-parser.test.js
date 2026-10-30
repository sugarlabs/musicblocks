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

const fs = require("fs");
const path = require("path");
const { setupActivityAbcParser } = require("../abc-parser.js");
const ABCJS = require("../../../lib/abc.min.js");
const { toFraction } = require("../../utils/utils-logic.js");

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
    const pitchObj = { name, pitch };
    if (opts.accidental) {
        pitchObj.accidental = opts.accidental;
    }
    return {
        el_type: "note",
        pitches: [pitchObj],
        duration,
        startTriplet: opts.startTriplet ?? null,
        tripletMultiplier: opts.tripletMultiplier,
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
// Use the same fraction conversion as the importer at runtime.
// ---------------------------------------------------------------------------
beforeAll(() => {
    global.toFraction = toFraction;
});

afterEach(() => {
    jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Test 1 — Simple melody (single voice, G major, 4/4)
// ---------------------------------------------------------------------------
describe("Header tempo", () => {
    test.each([
        ["1/4=120", 120, 1 / 4],
        ["3/8=60", 60, 3 / 8],
        ["1/4 1/8=60", 60, 3 / 8],
        ["120", 120, 1 / 8],
        ['"Allegro" 1/4=120', 120, 1 / 4]
    ])("imports Q:%s with its own beat unit", async (header, bpm, beatValue) => {
        const tune = ABCJS.parseOnly(`X:1\nM:6/8\nL:1/8\nQ:${header}\nK:C\nCDE|`)[0];
        const blocks = await parseAndCapture(tune);
        const tempos = blocksOfType(blocks, "setbpm3");
        expect(tempos).toHaveLength(1);

        const byId = new Map(blocks.map(block => [block[0], block]));
        const tempo = tempos[0];
        const beat = byId.get(tempo[4][2]);
        expect(byId.get(tempo[4][1])[1][1].value).toBe(bpm);
        expect(byId.get(beat[4][1])[1][1].value / byId.get(beat[4][2])[1][1].value).toBe(beatValue);

        const key = blocksOfType(blocks, "setkey2")[0];
        const spacer = byId.get(tempo[4][3]);
        const timbre = blocksOfType(blocks, "settimbre")[0];
        expect(key[4][3]).toBe(tempo[0]);
        expect(tempo[4][0]).toBe(key[0]);
        expect(spacer[4]).toEqual([tempo[0], timbre[0]]);
        expect(timbre[4][0]).toBe(spacer[0]);
        expect(byId.get(timbre[4][2])[1][0]).toBe("nameddo");
        expect(new Set(blocks.map(block => block[0])).size).toBe(blocks.length);
    });

    test.each(["", 'Q:"Allegro"\n'])("does not invent a numeric tempo from %j", async header => {
        const tune = ABCJS.parseOnly(`X:1\nM:4/4\nL:1/4\n${header}K:C\nCDE|`)[0];
        expect(blocksOfType(await parseAndCapture(tune), "setbpm3")).toHaveLength(0);
    });

    test("sets the header tempo for every staff", async () => {
        const staff = {
            meter: { value: [{ num: 4, den: 4 }] },
            key: { root: "C", mode: "major", accidentals: [] },
            voices: [[makeNote("C", 0)]]
        };
        const tune = makeTune({ staves: [staff, staff] });
        tune.metaText.tempo = { bpm: 120, duration: [0.25] };
        const blocks = await parseAndCapture(tune);
        expect(blocksOfType(blocks, "setbpm3")).toHaveLength(2);
        expect(new Set(blocks.map(block => block[0])).size).toBe(blocks.length);
    });

    test.each([
        { bpm: 0, duration: [0.25] },
        { bpm: Infinity, duration: [0.25] },
        { bpm: 120, duration: [] },
        { bpm: 120, duration: [NaN] }
    ])("ignores an invalid tempo %j", async tempo => {
        const tune = makeTune();
        tune.metaText.tempo = tempo;
        expect(blocksOfType(await parseAndCapture(tune), "setbpm3")).toHaveLength(0);
    });
});

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
        const setKey = blocks.find(b => b[1] === "setkey2");
        expect(setKey).toBeDefined();
        const keyRootBlock = blocks.find(b => b[0] === setKey[4][1]);
        expect(keyRootBlock[1]).toEqual(["notename", { value: "G" }]);
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

describe("ABC voices sharing one staff", () => {
    const staff = voices => ({
        meter: { value: [{ num: 4, den: 4 }] },
        key: { root: "C", mode: "major", accidentals: [] },
        voices
    });

    test("imports simultaneous voices as separate Start stacks", async () => {
        const abcjs = require("abcjs");
        const tune = abcjs.parseOnly(
            "X:1\nT:Two voices\nM:4/4\nL:1/4\n%%score (1 2)\nV:1\nV:2\nK:C\n[V:1] C4|\n[V:2] E4|"
        )[0];
        expect(tune.lines[0].staff[0].voices).toHaveLength(2);

        const blocks = await parseAndCapture(tune);
        expect(blocksOfType(blocks, "start")).toHaveLength(2);

        const calls = blocksOfType(blocks, "nameddo");
        expect(calls.map(block => block[1][1].value)).toEqual(["V: 1 Line 1", "V: 2 Line 1"]);
        expect(calls.every(block => block[4][1] === null)).toBe(true);
    });

    test("keeps each voice's segments together across staff lines", async () => {
        const tune = {
            metaText: { title: "Two voices", instruction: "guitar" },
            lines: [
                { staff: [staff([[makeNote("C", 0)], [makeNote("E", 2)]])] },
                { staff: [staff([[makeNote("D", 1)], [makeNote("F", 3)]])] }
            ]
        };

        const blocks = await parseAndCapture(tune);
        expect(blocksOfType(blocks, "start")).toHaveLength(2);

        const byId = new Map(blocks.map(block => [block[0], block]));
        const firstCalls = blocksOfType(blocks, "nameddo").filter(block => {
            const previous = byId.get(block[4][0]);
            return previous && previous[1] === "settimbre";
        });
        expect(firstCalls.map(block => block[1][1].value)).toEqual(["V: 1 Line 1", "V: 2 Line 1"]);
        expect(firstCalls.map(block => byId.get(block[4][1])[1][1].value)).toEqual([
            "V: 1 Line 2",
            "V: 2 Line 2"
        ]);
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

    test("a repeat in one voice does not wrap the other voice", async () => {
        const twoVoiceTune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [
                        [
                            makeBar("bar_left_repeat"),
                            makeNote("C", 0),
                            makeBar("bar_right_repeat"),
                            makeNote("D", 1)
                        ],
                        [makeNote("E", 2), makeNote("F", 3)]
                    ]
                }
            ]
        });

        const blocks = await parseAndCapture(twoVoiceTune);
        const byId = new Map(blocks.map(block => [block[0], block]));
        const repeats = blocksOfType(blocks, "repeat");
        expect(repeats).toHaveLength(1);
        expect(byId.get(repeats[0][4][2])[1][1].value).toBe("V: 1 Line 1");
        expect(blocksOfType(blocks, "start")).toHaveLength(2);
        expect(
            blocks.find(
                block =>
                    Array.isArray(block[1]) &&
                    block[1][0] === "nameddo" &&
                    block[1][1].value === "V: 2 Line 1"
            )
        ).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// Test 4 — Triplets
// ---------------------------------------------------------------------------
describe("Test 4: Triplets", () => {
    test("imports the downloadable quarter-note triplet example", async () => {
        const abc = fs.readFileSync(
            path.join(__dirname, "fixtures", "quarter-note-triplets.abc"),
            "utf8"
        );
        const tune = ABCJS.parseOnly(abc)[0];
        expect(tune.warnings).toBeUndefined();
        const blocks = await parseAndCapture(tune);
        const byId = new Map(blocks.map(block => [block[0], block]));
        const durations = blocksOfType(blocks, "newnote").map(note => {
            const divide = byId.get(note[4][1]);
            return byId.get(divide[4][1])[1][1].value / byId.get(divide[4][2])[1][1].value;
        });
        expect(durations).toEqual([
            1 / 6,
            1 / 6,
            1 / 6,
            1 / 4,
            1 / 4,
            1 / 6,
            1 / 6,
            1 / 6,
            1 / 4,
            1 / 4
        ]);
    });

    test.each([
        ["quarter-note triplets", "4/4", "1/4", "(3CDE F|", [1 / 6, 1 / 6, 1 / 6, 1 / 4]],
        ["sixteenth-note triplets", "4/4", "1/16", "(3CDE F|", [1 / 24, 1 / 24, 1 / 24, 1 / 16]],
        ["triplets in cut time", "2/2", "1/8", "(3CDE F|", [1 / 12, 1 / 12, 1 / 12, 1 / 8]],
        ["duplets in compound time", "6/8", "1/8", "(2CD E|", [3 / 16, 3 / 16, 1 / 8]],
        [
            "an explicit tuplet ratio",
            "4/4",
            "1/8",
            "(5:4:5CDEFG A|",
            [0.1, 0.1, 0.1, 0.1, 0.1, 1 / 8]
        ],
        ["a rest in a tuplet", "4/4", "1/4", "(3CzE F|", [1 / 6, 1 / 6, 1 / 6, 1 / 4]],
        [
            "a spacer within a tuplet",
            "4/4",
            "1/4",
            "(3CyDE F|",
            [1 / 6, 1 / 4, 1 / 6, 1 / 6, 1 / 4]
        ],
        [
            "a spacer across tuplet staff lines",
            "4/4",
            "1/4",
            "(3C\nyDE F|",
            [1 / 6, 1 / 4, 1 / 6, 1 / 6, 1 / 4]
        ],
        [
            "unequal note lengths in a tuplet",
            "4/4",
            "1/8",
            "(3C>D E F|",
            [1 / 8, 1 / 24, 1 / 12, 1 / 8]
        ],
        [
            "a tuplet spanning staff lines",
            "4/4",
            "1/8",
            "(3C\nDE F|",
            [1 / 12, 1 / 12, 1 / 12, 1 / 8]
        ]
    ])("preserves %s from parsed ABC", async (_name, meter, unit, music, expected) => {
        const tune = ABCJS.parseOnly(`X:1\nM:${meter}\nL:${unit}\nK:C\n${music}`)[0];
        const blocks = await parseAndCapture(tune);
        const byId = new Map(blocks.map(block => [block[0], block]));
        const durations = blocksOfType(blocks, "newnote").map(note => {
            const divide = byId.get(note[4][1]);
            return byId.get(divide[4][1])[1][1].value / byId.get(divide[4][2])[1][1].value;
        });
        expect(durations).toEqual(expected);
    });

    const tune = makeTune({
        title: "Triplet Test",
        staves: [
            {
                meter: { value: [{ num: 4, den: 4 }] },
                key: { root: "C", mode: "major", accidentals: [] },
                voices: [
                    [
                        makeNote("C", 0, 0.125, { startTriplet: 3, tripletMultiplier: 2 / 3 }),
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
                            makeNote("C", 0, 0.125, { startTriplet: 3, tripletMultiplier: 2 / 3 }),
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

    test("tripletFinder does not bleed across voice boundaries while a triplet is still open", async () => {
        // Voice 1: only C D of a three-note triplet, leaving one note outstanding.
        // Voice 2: plain quarter notes only — must NOT inherit the triplet state
        // and must produce standard denominator (4). Voice 1 resumes on the next line.
        const twoVoiceTune = makeTune({
            title: "Unclosed Triplet Bleed Test",
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [
                        [
                            makeNote("C", 0, 0.125, { startTriplet: 3, tripletMultiplier: 2 / 3 }),
                            makeNote("D", 1, 0.125)
                        ],
                        [makeNote("G", 4, 0.25), makeNote("A", 5, 0.25)]
                    ]
                }
            ]
        });
        twoVoiceTune.lines.push({
            staff: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [
                        [makeNote("E", 2, 0.125, { endTriplet: 3 }), makeNote("F", 3, 0.25)],
                        [makeNote("B", 6, 0.25)]
                    ]
                }
            ]
        });

        const blocks = await parseAndCapture(twoVoiceTune);

        // Follow each note's duration connection, excluding meter and pitch numbers.
        const byId = new Map(blocks.map(block => [block[0], block]));
        const durations = blocksOfType(blocks, "newnote").map(note => {
            const divide = byId.get(note[4][1]);
            return byId.get(divide[4][1])[1][1].value / byId.get(divide[4][2])[1][1].value;
        });
        // Each voice now has its own start stack, so its notes are grouped together.
        expect(durations).toEqual([1 / 12, 1 / 12, 1 / 12, 1 / 4, 1 / 4, 1 / 4, 1 / 4]);
    });
});

// ---------------------------------------------------------------------------
// Test 5 — Inline accidentals on individual notes
// ---------------------------------------------------------------------------
describe("Test 5: Inline accidentals", () => {
    test("sharp accidental (^C) produces C♯ notename", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "", accidentals: [] },
                    voices: [[makeNote("^C", 0, 0.25, { accidental: "sharp" })]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const cSharp = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "C♯"
        );
        expect(cSharp).toBeDefined();
    });

    test("flat accidental (_E) produces E♭ notename", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "", accidentals: [] },
                    voices: [[makeNote("_E", 2, 0.25, { accidental: "flat" })]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const eFlat = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "E♭"
        );
        expect(eFlat).toBeDefined();
    });

    test("natural accidental (=F) overrides key-sig flat, produces bare F", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "Bb", mode: "", accidentals: [{ note: "F", acc: "flat" }] },
                    voices: [[makeNote("=F", 3, 0.25, { accidental: "natural" })]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const bareF = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "F"
        );
        expect(bareF).toBeDefined();
    });

    test("double sharp (^^G) produces G with double-sharp symbol", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "", accidentals: [] },
                    voices: [[makeNote("^^G", 4, 0.25, { accidental: "dblsharp" })]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const gDblSharp = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "G𝄪"
        );
        expect(gDblSharp).toBeDefined();
    });

    test("double flat (__A) produces A with double-flat symbol", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "", accidentals: [] },
                    voices: [[makeNote("__A", 5, 0.25, { accidental: "dblflat" })]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const aDblFlat = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "A𝄫"
        );
        expect(aDblFlat).toBeDefined();
    });

    test("inline accidental overrides key-sig accidental on the same note", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "F", mode: "", accidentals: [{ note: "B", acc: "flat" }] },
                    voices: [[makeNote("=B", 6, 0.25, { accidental: "natural" })]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const bareB = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "B"
        );
        expect(bareB).toBeDefined();
        const bFlat = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "B♭"
        );
        expect(bFlat).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Test 6 — Key root with accidental in setkey2 block
// ---------------------------------------------------------------------------
describe("Test 6: Key root accidental in setkey2", () => {
    test("K:Bb produces setkey2 notename B♭", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: {
                        root: "B",
                        acc: "b",
                        mode: "",
                        accidentals: [{ note: "B", acc: "flat" }]
                    },
                    voices: [[makeNote("C", 0)]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const bFlatRoot = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "B♭"
        );
        expect(bFlatRoot).toBeDefined();
    });

    test("K:F# produces setkey2 notename F♯", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "F", acc: "#", mode: "", accidentals: [] },
                    voices: [[makeNote("C", 0)]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const fSharpRoot = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "F♯"
        );
        expect(fSharpRoot).toBeDefined();
    });

    test("K:C (no accidental) produces plain C notename", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", acc: "", mode: "", accidentals: [] },
                    voices: [[makeNote("C", 0)]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const cRoot = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "notename" && b[1][1]?.value === "C"
        );
        expect(cRoot).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// Test 7 — Mode mapping in setkey2 block
// ---------------------------------------------------------------------------
describe("Test 7: Mode mapping in setkey2", () => {
    test("K:Ddor produces modename dorian", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "D", acc: "", mode: "Dor", accidentals: [] },
                    voices: [[makeNote("D", 1)]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const dorianMode = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "modename" && b[1][1]?.value === "dorian"
        );
        expect(dorianMode).toBeDefined();
    });

    test("K:Amix produces modename mixolydian", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "A", acc: "", mode: "Mix", accidentals: [] },
                    voices: [[makeNote("A", 5)]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const mixMode = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "modename" && b[1][1]?.value === "mixolydian"
        );
        expect(mixMode).toBeDefined();
    });

    test("K:Dm produces modename minor", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "D", acc: "", mode: "m", accidentals: [] },
                    voices: [[makeNote("D", 1)]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const minorMode = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "modename" && b[1][1]?.value === "minor"
        );
        expect(minorMode).toBeDefined();
    });

    test("K:Elyd produces modename lydian", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "E", acc: "", mode: "Lyd", accidentals: [] },
                    voices: [[makeNote("E", 2)]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const lydianMode = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "modename" && b[1][1]?.value === "lydian"
        );
        expect(lydianMode).toBeDefined();
    });

    test("unrecognized mode falls back to major", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", acc: "", mode: "Unknown", accidentals: [] },
                    voices: [[makeNote("C", 0)]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);
        const majorMode = blocks.find(
            b => Array.isArray(b[1]) && b[1][0] === "modename" && b[1][1]?.value === "major"
        );
        expect(majorMode).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// Test 8 — Key signature with accidentals (F major = B♭)
// ---------------------------------------------------------------------------
describe("Test 8: Key signature accidentals (F major)", () => {
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
        const setKey = blocks.find(b => b[1] === "setkey2");
        expect(setKey).toBeDefined();
        const keyRootBlock = blocks.find(b => b[0] === setKey[4][1]);
        expect(keyRootBlock[1]).toEqual(["notename", { value: "F" }]);
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
// Test 9 — Empty-voice / degenerate input guard (issue: actionBlock[0] crash)
// ---------------------------------------------------------------------------
describe("Test 9: Empty-voice and degenerate input guard", () => {
    test("ABC rest creates a rest block inside a note", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [[{ el_type: "note", rest: { type: "rest" }, duration: 0.25 }]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);

        expect(blocksOfType(blocks, "newnote")).toHaveLength(1);
        expect(blocksOfType(blocks, "rest2")).toHaveLength(1);
        expect(blocksOfType(blocks, "pitch")).toHaveLength(0);
    });

    test("ABC rest keeps block ids contiguous for following notes", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [
                        [
                            { el_type: "note", rest: { type: "rest" }, duration: 0.25 },
                            makeNote("D", 1)
                        ]
                    ]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);

        expect(blocks.map(block => block[0])).toEqual(
            Array.from({ length: blocks.length }, (_, index) => index)
        );
    });

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

/** Return [notename, octave] for every pitch block, in stack order. */
function pitchNames(blocks) {
    return blocksOfType(blocks, "pitch").map(pitch => [
        blocks.find(b => b[0] === pitch[4][1])[1][1].value,
        blocks.find(b => b[0] === pitch[4][2])[1][1].value
    ]);
}

/** Build a one-staff, one-voice tune in the given key. */
function makeVoiceTune(key, voice) {
    return makeTune({
        staves: [{ meter: { value: [{ num: 4, den: 4 }] }, key, voices: [voice] }]
    });
}

// ---------------------------------------------------------------------------
// Test 10 — Octave marks (",", "'") in note names
// ---------------------------------------------------------------------------
describe("Test 10: Octave marks in note names", () => {
    // abcjs keeps every octave mark on pitch.name; pitch.pitch is the staff position.
    const gMajorKey = {
        root: "G",
        acc: "",
        mode: "",
        accidentals: [{ acc: "sharp", note: "f", verticalPos: 10 }]
    };

    test("every comma and apostrophe is stripped from the notename", async () => {
        const tune = makeVoiceTune({ root: "C", acc: "", mode: "", accidentals: [] }, [
            makeNote("C,", -7),
            makeNote("C,,", -14),
            makeNote("c'", 14),
            makeNote("c''", 21)
        ]);
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["C", 3],
            ["C", 2],
            ["C", 6],
            ["C", 7]
        ]);
    });

    test("key signature applies to notes with any number of octave marks", async () => {
        const tune = makeVoiceTune(gMajorKey, [
            makeNote("F", 3),
            makeNote("F,", -4),
            makeNote("F,,", -11),
            makeNote("f", 10),
            makeNote("f'", 17),
            makeNote("f''", 24)
        ]);
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["F♯", 4],
            ["F♯", 3],
            ["F♯", 2],
            ["F♯", 5],
            ["F♯", 6],
            ["F♯", 7]
        ]);
    });

    test("inline accidental and octave marks together give a valid notename", async () => {
        const tune = makeVoiceTune({ root: "C", acc: "", mode: "", accidentals: [] }, [
            makeNote("_B,,", -8, 0.25, { accidental: "flat" }),
            makeNote("^^g'", 18, 0.25, { accidental: "dblsharp" })
        ]);
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["B♭", 2],
            ["G𝄪", 6]
        ]);
    });
});

// ---------------------------------------------------------------------------
// Test 11 — Inline accidentals hold until the next bar line
// ---------------------------------------------------------------------------
describe("Test 11: Inline accidentals last for the rest of the bar", () => {
    const cMajorKey = { root: "C", acc: "", mode: "", accidentals: [] };
    const gMajorKey = {
        root: "G",
        acc: "",
        mode: "",
        accidentals: [{ acc: "sharp", note: "f", verticalPos: 10 }]
    };

    test("a sharp carries to later notes of the same pitch in the bar", async () => {
        const tune = makeVoiceTune(cMajorKey, [
            makeNote("^F", 3, 0.25, { accidental: "sharp" }),
            makeNote("F", 3),
            makeNote("G", 4),
            makeNote("F", 3)
        ]);
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["F♯", 4],
            ["F♯", 4],
            ["G", 4],
            ["F♯", 4]
        ]);
    });

    test("a natural cancels the key signature for the rest of the bar", async () => {
        const tune = makeVoiceTune(gMajorKey, [
            makeNote("=F", 3, 0.25, { accidental: "natural" }),
            makeNote("F", 3),
            makeBar(),
            makeNote("F", 3)
        ]);
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["F", 4],
            ["F", 4],
            ["F♯", 4]
        ]);
    });

    test("a later accidental in the bar replaces the earlier one", async () => {
        const tune = makeVoiceTune(cMajorKey, [
            makeNote("^F", 3, 0.25, { accidental: "sharp" }),
            makeNote("=F", 3, 0.25, { accidental: "natural" }),
            makeNote("F", 3)
        ]);
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["F♯", 4],
            ["F", 4],
            ["F", 4]
        ]);
    });

    test("the accidental is cleared at the bar line", async () => {
        const tune = makeVoiceTune(cMajorKey, [
            makeNote("^c", 7, 0.25, { accidental: "sharp" }),
            makeBar(),
            makeNote("c", 7)
        ]);
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["C♯", 5],
            ["C", 5]
        ]);
    });

    test("the accidental does not carry to the same letter in another octave", async () => {
        const tune = makeVoiceTune(cMajorKey, [
            makeNote("^c", 7, 0.25, { accidental: "sharp" }),
            makeNote("C", 0),
            makeNote("c", 7)
        ]);
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["C♯", 5],
            ["C", 4],
            ["C♯", 5]
        ]);
    });

    test("the accidental carries across a staff line break inside the bar", async () => {
        // abcjs splits "^F F" / "F F|F" on two source lines into two staff
        // lines with no bar between them.
        const staffLine = voice => ({
            meter: { value: [{ num: 4, den: 4 }] },
            key: cMajorKey,
            voices: [voice]
        });
        const tune = {
            metaText: { title: "Test", instruction: "guitar" },
            lines: [
                {
                    staff: [
                        staffLine([
                            makeNote("^F", 3, 0.25, { accidental: "sharp" }),
                            makeNote("F", 3)
                        ])
                    ]
                },
                {
                    staff: [
                        staffLine([makeNote("F", 3), makeNote("F", 3), makeBar(), makeNote("F", 3)])
                    ]
                }
            ]
        };
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["F♯", 4],
            ["F♯", 4],
            ["F♯", 4],
            ["F♯", 4],
            ["F", 4]
        ]);
    });

    test("the accidental does not carry into the next voice", async () => {
        const tune = makeTune({
            staves: [
                {
                    meter: { value: [{ num: 4, den: 4 }] },
                    key: cMajorKey,
                    voices: [[makeNote("^F", 3, 0.25, { accidental: "sharp" })], [makeNote("F", 3)]]
                }
            ]
        });
        const blocks = await parseAndCapture(tune);

        expect(pitchNames(blocks)).toEqual([
            ["F♯", 4],
            ["F", 4]
        ]);
    });
});

/**
 * Walks the imported start stack the way Logo runs it and returns the note
 * letters in play order: repeat blocks play their clamp twice and nameddo
 * blocks run their action.
 */
function playOrder(blocks) {
    const byId = new Map(blocks.map(b => [b[0], b]));
    const type = b => (Array.isArray(b[1]) ? b[1][0] : b[1]);
    const value = id => byId.get(id)[1][1].value;
    const actions = new Map(
        blocksOfType(blocks, "action").map(a => [value(a[4][1]), byId.get(a[4][2])])
    );
    const notes = [];
    const run = block => {
        for (; block; block = byId.get(block[4][block[4].length - 1])) {
            if (type(block) === "repeat") {
                run(byId.get(block[4][2]));
                run(byId.get(block[4][2]));
            } else if (type(block) === "nameddo") {
                run(byId.get(actions.get(value(block[0]))[4][1]));
            } else if (type(block) === "newnote") {
                const pitch = byId.get(byId.get(block[4][2])[4][1]);
                notes.push(value(pitch[4][1]));
            }
        }
    };
    const settimbre = blocksOfType(blocks, "settimbre")[0];
    run(byId.get(settimbre[4][2]));
    return notes.join("");
}

// ---------------------------------------------------------------------------
// Test 12 — Repeat bars wrap only their own bars
// ---------------------------------------------------------------------------
describe("Test 12: Repeat bars wrap only their own bars", () => {
    const key = { root: "C", acc: "", mode: "", accidentals: [] };
    const melody = (letters, pitch = 0) => [...letters].map((l, i) => makeNote(l, pitch + i));
    const parseLines = lines =>
        parseAndCapture({
            metaText: { title: "Repeats", instruction: "guitar" },
            lines: lines.map(voice => ({
                staff: [{ meter: { value: [{ num: 4, den: 4 }] }, key, voices: [voice] }]
            }))
        });

    test("a repeat that ends mid-line repeats only its own bars", async () => {
        const blocks = await parseLines([
            [
                makeBar("bar_left_repeat"),
                ...melody("CDEF"),
                makeBar("bar_right_repeat"),
                ...melody("GABC", 4),
                makeBar()
            ]
        ]);
        expect(playOrder(blocks)).toBe("CDEFCDEFGABC");
    });

    test("a :| with no |: repeats from the start of the tune", async () => {
        const blocks = await parseLines([
            [...melody("CDEF"), makeBar(), ...melody("GABC", 4), makeBar("bar_right_repeat")]
        ]);
        expect(playOrder(blocks)).toBe("CDEFGABCCDEFGABC");
    });

    test(":: ends one repeat and starts the next", async () => {
        const blocks = await parseLines([
            [
                makeBar("bar_left_repeat"),
                ...melody("CDEF"),
                makeBar("bar_dbl_repeat"),
                ...melody("GABC", 4),
                makeBar("bar_right_repeat")
            ]
        ]);
        expect(playOrder(blocks)).toBe("CDEFCDEFGABCGABC");
    });

    test("music after a repeated line plays once, after the repeat", async () => {
        const blocks = await parseLines([
            [makeBar("bar_left_repeat"), ...melody("CDEF"), makeBar("bar_right_repeat")],
            [...melody("GABC", 4), makeBar()],
            [makeBar("bar_left_repeat"), ...melody("DEFG", 8), makeBar("bar_right_repeat")],
            [...melody("ABC", 12), makeBar()]
        ]);
        expect(playOrder(blocks)).toBe("CDEFCDEFGABCDEFGDEFGABC");
    });

    test("a repeat can span two lines", async () => {
        const blocks = await parseLines([
            [makeBar("bar_left_repeat"), ...melody("CD"), makeBar()],
            [...melody("EF", 2), makeBar("bar_right_repeat"), ...melody("G", 4), makeBar()]
        ]);
        expect(playOrder(blocks)).toBe("CDEFCDEFG");
    });
});

describe("Meters abcjs reports by name rather than by number", () => {
    // M:C and M:C| come back as a type with no value array, so reading a number
    // straight out of one throws and the whole import stops.
    const meterOf = blocks => {
        const byIndex = new Map(blocks.map(block => [block[0], block]));
        const meter = blocksOfType(blocks, "meter")[0];
        const divide = byIndex.get(meter[4][2]);
        return {
            num: byIndex.get(meter[4][1])[1][1].value,
            den: byIndex.get(divide[4][2])[1][1].value
        };
    };

    const tuneWithMeter = meter =>
        makeTune({
            staves: [
                {
                    meter,
                    key: { root: "C", mode: "major", accidentals: [] },
                    voices: [[makeNote("C", 0)]]
                }
            ]
        });

    it("reads common time as 4/4", async () => {
        const blocks = await parseAndCapture(tuneWithMeter({ type: "common_time" }));

        expect(meterOf(blocks)).toEqual({ num: 4, den: 4 });
    });

    it("reads cut time as 2/2", async () => {
        const blocks = await parseAndCapture(tuneWithMeter({ type: "cut_time" }));

        expect(meterOf(blocks)).toEqual({ num: 2, den: 2 });
    });

    it("still reads a meter given as numbers", async () => {
        const blocks = await parseAndCapture(
            tuneWithMeter({ type: "specified", value: [{ num: "3", den: "4" }] })
        );

        expect(meterOf(blocks)).toEqual({ num: 3, den: 4 });
    });

    it("falls back to 4/4 when the tune states no meter at all", async () => {
        const blocks = await parseAndCapture(tuneWithMeter(undefined));

        expect(meterOf(blocks)).toEqual({ num: 4, den: 4 });
    });

    it("falls back to 4/4 when the meter carries an empty value", async () => {
        const blocks = await parseAndCapture(tuneWithMeter({ type: "specified", value: [] }));

        expect(meterOf(blocks)).toEqual({ num: 4, den: 4 });
    });

    it("keeps the notes a common-time tune carries", async () => {
        const blocks = await parseAndCapture(
            makeTune({
                staves: [
                    {
                        meter: { type: "common_time" },
                        key: { root: "C", mode: "major", accidentals: [] },
                        voices: [[makeNote("C", 0), makeNote("D", 1), makeNote("E", 2)]]
                    }
                ]
            })
        );

        expect(blocksOfType(blocks, "newnote")).toHaveLength(3);
    });
});

// ---------------------------------------------------------------------------
// Chords ([CEG]) — abcjs puts every note of the chord in pitches[]
// ---------------------------------------------------------------------------
describe("Chords", () => {
    const cMajor = { root: "C", acc: "", mode: "", accidentals: [] };
    const chord = (pitches, duration = 0.25) => ({
        el_type: "note",
        pitches,
        duration,
        startTriplet: null,
        endTriplet: null
    });

    test("imports every note of a chord into one note block", async () => {
        const blocks = await parseAndCapture(
            makeVoiceTune(cMajor, [
                chord([
                    { name: "C", pitch: 0 },
                    { name: "E", pitch: 2 },
                    { name: "G", pitch: 4 }
                ])
            ])
        );

        expect(blocksOfType(blocks, "newnote")).toHaveLength(1);
        expect(pitchNames(blocks)).toEqual([
            ["C", 4],
            ["E", 4],
            ["G", 4]
        ]);

        // Chained inside the note's clamp, and the note still reaches its
        // trailing hidden block.
        const byId = new Map(blocks.map(block => [block[0], block]));
        const [c, e, g] = blocksOfType(blocks, "pitch");
        const newnote = blocksOfType(blocks, "newnote")[0];
        expect(byId.get(c[4][0])[1]).toBe("vspace");
        expect([c[4][3], e[4][0], e[4][3], g[4][0], g[4][3]]).toEqual([
            e[0],
            c[0],
            g[0],
            e[0],
            null
        ]);
        expect(byId.get(newnote[4][3])[1]).toBe("hidden");
    });

    test("an accidental inside a chord carries to the end of the bar", async () => {
        const blocks = await parseAndCapture(
            makeVoiceTune(cMajor, [
                chord([
                    { name: "^F", pitch: 3, accidental: "sharp" },
                    { name: "A", pitch: 5 }
                ]),
                makeNote("F", 3),
                makeBar(),
                makeNote("F", 3)
            ])
        );

        expect(pitchNames(blocks)).toEqual([
            ["F♯", 4],
            ["A", 4],
            ["F♯", 4],
            ["F", 4]
        ]);
    });
});
