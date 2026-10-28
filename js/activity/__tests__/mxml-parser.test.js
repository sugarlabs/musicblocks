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

const { setupActivityMxmlParser } = require("../mxml-parser.js");

// Globals in the browser (js/utils/musicutils-constants.js); the drum-name
// lookup reads them.
const { DRUM_MIDI_MAP, REVERSE_DRUM_MIDI_MAP } = require("../../utils/musicutils-constants.js");

global.DRUM_MIDI_MAP = DRUM_MIDI_MAP;
global.REVERSE_DRUM_MIDI_MAP = REVERSE_DRUM_MIDI_MAP;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal activity instance with a spy on loadNewBlocks. */
function makeActivity() {
    const activity = {
        errorMsg: jest.fn(),
        blocks: {
            loadNewBlocks: jest.fn(() => 42)
        }
    };
    setupActivityMxmlParser(activity);
    return activity;
}

/**
 * Returns the flat block array passed to loadNewBlocks after calling parseMXML.
 * Asserts that loadNewBlocks was called exactly once, so a parse failure that
 * never reaches loadNewBlocks fails loudly here instead of being misread as
 * "zero blocks".
 */
async function parseAndCapture(xml) {
    const activity = makeActivity();
    await activity.parseMXML(xml);
    expect(activity.blocks.loadNewBlocks).toHaveBeenCalledTimes(1);
    return { blocks: activity.blocks.loadNewBlocks.mock.calls[0][0], activity };
}

const blockName = block => (Array.isArray(block[1]) ? block[1][0] : block[1]);

/**
 * Mirrors the integrity check Blocks.adjustDocks() performs: for every
 * non-null connection A -> B, block B must list A among its own connections.
 * (Same helper shape as js/__tests__/midi.test.js's findUnreciprocatedConnections.)
 */
function findUnreciprocatedConnections(blocks) {
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
}

/**
 * Blocks.loadNewBlocks() (js/blocks.js, _makeNewBlockWithConnections) resolves
 * every connection by adding it to the array's own position --
 * `connections[c] + blockOffset` -- it never reads a block's own [0] id back
 * out of the data at all. findUnreciprocatedConnections() above checks id-based
 * graph consistency, which is necessary but not sufficient: a block whose
 * array position doesn't match its own embedded id can still pass that check
 * while loading completely wrong (a connection written as "14" resolves to
 * whatever sits at array position 14, regardless of which block claims id 14).
 * This checks the invariant the loader actually depends on.
 */
function findPositionMismatches(blocks) {
    return blocks
        .map((block, position) =>
            block[0] !== position ? `position ${position} has id ${block[0]}` : null
        )
        .filter(Boolean);
}

/** The [numerator, denominator] value of a newnote block in `blocks`. */
function noteValueOf(blocks, newnoteBlock) {
    const byIndex = new Map(blocks.map(block => [block[0], block]));
    const divide = byIndex.get(newnoteBlock[4][1]);
    return [byIndex.get(divide[4][1])[1][1].value, byIndex.get(divide[4][2])[1][1].value];
}

/** Every newnote block's [numerator, denominator] value, in block-array order. */
function noteValues(blocks) {
    return blocks.filter(b => blockName(b) === "newnote").map(b => noteValueOf(blocks, b));
}

/** Every pitch block's {name, octave}, in block-array order. */
function pitches(blocks) {
    const byIndex = new Map(blocks.map(block => [block[0], block]));
    return blocks
        .filter(b => blockName(b) === "pitch")
        .map(b => ({
            name: byIndex.get(b[4][1])[1][1].value,
            octave: byIndex.get(b[4][2])[1][1].value
        }));
}

/** Every playdrum block's drum name, in block-array order. */
function drumNames(blocks) {
    const byIndex = new Map(blocks.map(block => [block[0], block]));
    return blocks
        .filter(b => blockName(b) === "playdrum")
        .map(b => byIndex.get(b[4][1])[1][1].value);
}

const SIMPLE_NOTE = (step, octave, type, opts = "") =>
    `<note><pitch><step>${step}</step>${opts}<octave>${octave}</octave></pitch><duration>1</duration><type>${type}</type></note>`;

const scorePartwise = (measuresXml, attributesXml = "<divisions>8</divisions>") =>
    `<score-partwise><part id="P1"><measure number="1"><attributes>${attributesXml}</attributes>${measuresXml}</measure></part></score-partwise>`;

// ---------------------------------------------------------------------------

describe("Test 1: A single pitched note", () => {
    it("builds a newnote/pitch chain with the right value, name and octave", async () => {
        const { blocks } = await parseAndCapture(scorePartwise(SIMPLE_NOTE("C", 4, "quarter")));

        expect(noteValues(blocks)).toEqual([[1, 4]]);
        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("connects the note's top dock to settimbre, and settimbre's third dock to the note", async () => {
        const { blocks } = await parseAndCapture(scorePartwise(SIMPLE_NOTE("C", 4, "quarter")));

        const settimbre = blocks.find(b => blockName(b) === "settimbre");
        const newnote = blocks.find(b => blockName(b) === "newnote");
        expect(newnote[4][0]).toBe(settimbre[0]);
        expect(settimbre[4][2]).toBe(newnote[0]);
    });

    it("returns loadNewBlocks's own token so callers can track this load's completion", async () => {
        const activity = makeActivity();
        const result = await activity.parseMXML(scorePartwise(SIMPLE_NOTE("C", 4, "quarter")));

        expect(result).toBe(activity.blocks.loadNewBlocks.mock.results[0].value);
    });
});

describe("Test 2: Rests", () => {
    it("builds a rest2 block for an explicit <rest/>", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise("<note><rest/><duration>8</duration><type>quarter</type></note>")
        );

        expect(blocks.filter(b => blockName(b) === "rest2")).toHaveLength(1);
        expect(blocks.filter(b => blockName(b) === "pitch")).toHaveLength(0);
    });

    it("reads a whole-measure rest's length from <duration>, not its whole-note <type>", async () => {
        // PhotoScore writes a 3/4 bar's rest this way; reading <type> made it four beats.
        const { blocks } = await parseAndCapture(
            scorePartwise(
                '<note><rest measure="yes"/><duration>24</duration><type>whole</type></note>' +
                    SIMPLE_NOTE("C", 4, "quarter"),
                "<divisions>8</divisions><time><beats>3</beats><beat-type>4</beat-type></time>"
            )
        );

        expect(noteValues(blocks)).toEqual([
            [24, 32],
            [1, 4]
        ]);
    });

    it.each([
        ["no <duration>", ""],
        ["an empty <duration>", "<duration></duration>"],
        ["a non-numeric <duration>", "<duration>abc</duration>"],
        ["a zero <duration>", "<duration>0</duration>"]
    ])("keeps <type> for a whole-measure rest with %s", async (_label, durationXml) => {
        const { blocks } = await parseAndCapture(
            scorePartwise(`<note><rest measure="yes"/>${durationXml}<type>whole</type></note>`)
        );

        expect(noteValues(blocks)).toEqual([[1, 1]]);
    });

    it("treats a <note> with neither <pitch> nor <rest/> as a rest rather than crashing", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise("<note><duration>8</duration><type>quarter</type></note>")
        );

        expect(blocks.filter(b => blockName(b) === "rest2")).toHaveLength(1);
    });
});

describe("Test 3: Accidentals", () => {
    it.each([
        ["0", "F"],
        ["1", "F♯"],
        ["1.0", "F♯"],
        ["+1", "F♯"],
        ["-1", "F♭"],
        ["2", "F𝄪"],
        ["-2", "F𝄫"]
    ])("maps alter %s to %s", async (alter, expectedName) => {
        const { blocks } = await parseAndCapture(
            scorePartwise(SIMPLE_NOTE("F", 4, "quarter", `<alter>${alter}</alter>`))
        );

        expect(pitches(blocks)).toEqual([{ name: expectedName, octave: 4 }]);
    });
});

describe("Test 4: Note values from <type> and <dot>", () => {
    it.each([
        ["whole", 0, [1, 1]],
        ["half", 0, [1, 2]],
        ["quarter", 0, [1, 4]],
        ["eighth", 0, [1, 8]],
        ["16th", 0, [1, 16]],
        ["quarter", 1, [3, 8]],
        ["eighth", 2, [7, 32]]
    ])("%s note with %i dot(s) is %j", async (type, dotCount, expected) => {
        const dots = "<dot/>".repeat(dotCount);
        const { blocks } = await parseAndCapture(
            scorePartwise(
                `<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>${type}</type>${dots}</note>`
            )
        );

        expect(noteValues(blocks)).toEqual([expected]);
    });
});

describe("Test 5: Duration/divisions fallback when <type> is absent", () => {
    it("reads a plain quarter note from duration == divisions, with no <type> at all", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                "<note><pitch><step>D</step><octave>4</octave></pitch><duration>8</duration></note>",
                "<divisions>8</divisions>"
            )
        );

        // duration(8) / (divisions(8) * 4) == 8/32, the same reducible fraction
        // the "divide" block itself resolves to 1/4 at runtime.
        expect(noteValues(blocks)).toEqual([[8, 32]]);
    });

    it("falls back to a quarter note when both <type> and <duration> are missing", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise("<note><pitch><step>D</step><octave>4</octave></pitch></note>")
        );

        expect(noteValues(blocks)).toEqual([[1, 4]]);
    });

    it("falls back safely when finite divisions overflow the computed denominator", async () => {
        const hugeDivisions = `1${"0".repeat(308)}`;

        const { blocks } = await parseAndCapture(
            scorePartwise(
                "<note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration></note>",
                `<divisions>${hugeDivisions}</divisions>`
            )
        );

        expect(noteValues(blocks)).toEqual([[1, 4]]);
    });

    it("falls back safely when the computed duration underflows to zero", async () => {
        const tinyDuration = `0.${"0".repeat(308)}1`;
        const hugeDivisions = `1${"0".repeat(307)}`;

        const { blocks } = await parseAndCapture(
            scorePartwise(
                `<note><pitch><step>D</step><octave>4</octave></pitch>` +
                    `<duration>${tinyDuration}</duration></note>`,
                `<divisions>${hugeDivisions}</divisions>`
            )
        );

        expect(noteValues(blocks)).toEqual([[1, 4]]);
    });
});

describe("Test 6: Multiple notes chain correctly", () => {
    it("keeps every newnote's prev pointing at the previous note's hidden spacer", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter") +
                    SIMPLE_NOTE("D", 4, "quarter") +
                    "<note><rest/><duration>1</duration><type>quarter</type></note>" +
                    SIMPLE_NOTE("E", 4, "quarter")
            )
        );

        expect(noteValues(blocks)).toEqual([
            [1, 4],
            [1, 4],
            [1, 4],
            [1, 4]
        ]);
        expect(pitches(blocks)).toEqual([
            { name: "C", octave: 4 },
            { name: "D", octave: 4 },
            { name: "E", octave: 4 }
        ]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);

        const newnotes = blocks.filter(b => blockName(b) === "newnote");
        // The preamble's own hidden block is settimbre's flow-next, not a note's
        // trailing spacer; exclude it by that relationship, not a hardcoded id --
        // the preamble's exact block count has already changed across PRs once.
        const settimbre = blocks.find(b => blockName(b) === "settimbre");
        const hiddens = blocks.filter(b => blockName(b) === "hidden" && b[0] !== settimbre[4][3]);
        expect(newnotes[1][4][0]).toBe(hiddens[0][0]);
        expect(newnotes[2][4][0]).toBe(hiddens[1][0]);
        expect(newnotes[3][4][0]).toBe(hiddens[2][0]);
        // The last note's trailing hidden spacer has no next block.
        expect(hiddens[hiddens.length - 1][4][1]).toBeNull();
    });

    it("carries an updated <divisions> across measures (no <type>, so duration/divisions is what's being tested)", async () => {
        const xml =
            '<score-partwise><part id="P1">' +
            '<measure number="1"><attributes><divisions>4</divisions></attributes>' +
            "<note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>" +
            "</measure>" +
            '<measure number="2"><attributes><divisions>8</divisions></attributes>' +
            "<note><pitch><step>D</step><octave>4</octave></pitch><duration>8</duration></note>" +
            "</measure>" +
            "</part></score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        // Both notes are a quarter note (duration == divisions in both measures),
        // but at each measure's own divisions value: 4/16 and 8/32 respectively,
        // not 4/16 twice -- proving divisions was re-read for the second measure.
        expect(noteValues(blocks)).toEqual([
            [4, 16],
            [8, 32]
        ]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });
});

describe("Test 7: Chords and a second voice are skipped, not misread", () => {
    it("keeps only the first note of a chord", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter") +
                    "<note><chord/><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>" +
                    "<note><chord/><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>"
            )
        );

        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
    });

    it("stops a measure at <backup>, taking only the first voice", async () => {
        const xml = scorePartwise(
            SIMPLE_NOTE("C", 4, "quarter") +
                "<backup><duration>1</duration></backup>" +
                SIMPLE_NOTE("G", 3, "quarter")
        );

        const { blocks } = await parseAndCapture(xml);
        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
    });
});

describe("Test 8: Title and meter extraction", () => {
    it("reads the title from <work><work-title>", async () => {
        const xml =
            "<score-partwise><work><work-title>My Tune</work-title></work>" +
            '<part id="P1"><measure number="1">' +
            SIMPLE_NOTE("C", 4, "quarter") +
            "</measure></part></score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        const text = blocks.find(b => blockName(b) === "text" && b[0] === 2);
        expect(text[1][1].value).toBe("My Tune");
    });

    it("falls back to <movement-title>, then to a default, when <work-title> is absent", async () => {
        const withMovement =
            "<score-partwise><movement-title>Movement One</movement-title>" +
            '<part id="P1"><measure number="1">' +
            SIMPLE_NOTE("C", 4, "quarter") +
            "</measure></part></score-partwise>";
        const { blocks: b1 } = await parseAndCapture(withMovement);
        expect(b1.find(b => b[0] === 2)[1][1].value).toBe("Movement One");

        const withNeither = scorePartwise(SIMPLE_NOTE("C", 4, "quarter"));
        const { blocks: b2 } = await parseAndCapture(withNeither);
        expect(b2.find(b => b[0] === 2)[1][1].value).toBe("title");
    });

    it("reads a non-default time signature into the meter block", async () => {
        const xml = scorePartwise(
            SIMPLE_NOTE("C", 4, "quarter"),
            "<divisions>8</divisions><time><beats>3</beats><beat-type>8</beat-type></time>"
        );

        const { blocks } = await parseAndCapture(xml);
        const meter = blocks.find(b => blockName(b) === "meter");
        const numBlock = blocks.find(b => b[0] === meter[4][1]);
        const divide = blocks.find(b => b[0] === meter[4][2]);
        expect(numBlock[1][1].value).toBe(3);
        const denBlock = blocks.find(b => b[0] === divide[4][2]);
        expect(denBlock[1][1].value).toBe(8);
    });

    it.each([
        ["3+2", "8", 5, 8],
        ["2+2+3", "8", 7, 8],
        [" 3 + 2 ", "8", 5, 8],
        ["x", "4", 4, 4],
        ["3+", "8", 4, 8],
        ["+3", "8", 4, 8],
        ["3++2", "8", 4, 8],
        ["", "4", 4, 4],
        ["3", "0", 3, 4]
    ])(
        "reads <beats>%s</beats><beat-type>%s</beat-type> as %i/%i",
        async (beatsText, beatTypeText, beats, beatType) => {
            const xml = scorePartwise(
                SIMPLE_NOTE("C", 4, "eighth"),
                `<divisions>8</divisions><time><beats>${beatsText}</beats><beat-type>${beatTypeText}</beat-type></time>`
            );

            const { blocks } = await parseAndCapture(xml);
            const meter = blocks.find(b => blockName(b) === "meter");
            const numBlock = blocks.find(b => b[0] === meter[4][1]);
            const divide = blocks.find(b => b[0] === meter[4][2]);
            const denBlock = blocks.find(b => b[0] === divide[4][2]);
            expect(numBlock[1][1].value).toBe(beats);
            expect(denBlock[1][1].value).toBe(beatType);
        }
    );

    it("defaults to 4/4 when no <time> element is present", async () => {
        const { blocks } = await parseAndCapture(scorePartwise(SIMPLE_NOTE("C", 4, "quarter")));

        const meter = blocks.find(b => blockName(b) === "meter");
        const numBlock = blocks.find(b => b[0] === meter[4][1]);
        expect(numBlock[1][1].value).toBe(4);
    });
});

describe("Test 9: Degenerate input guards", () => {
    it("reports an error and does not throw for unparseable XML", async () => {
        const activity = makeActivity();
        const result = await activity.parseMXML("not xml at all <<<");

        expect(activity.errorMsg).toHaveBeenCalled();
        expect(activity.blocks.loadNewBlocks).not.toHaveBeenCalled();
        // A null return tells project-manager.js's wiring that no block load
        // was started, so it doesn't wait on a "finishedLoading" event that
        // will never come.
        expect(result).toBeNull();
    });

    it("reports an error when the file has no <part>", async () => {
        const activity = makeActivity();
        const result = await activity.parseMXML("<score-partwise></score-partwise>");

        expect(activity.errorMsg).toHaveBeenCalled();
        expect(activity.blocks.loadNewBlocks).not.toHaveBeenCalled();
        expect(result).toBeNull();
    });

    it("loads just the preamble, with settimbre's note dock left null, for a part with no notes", async () => {
        const { blocks } = await parseAndCapture(
            '<score-partwise><part id="P1"><measure number="1"></measure></part></score-partwise>'
        );

        expect(blocks.filter(b => blockName(b) === "newnote")).toHaveLength(0);
        const settimbre = blocks.find(b => blockName(b) === "settimbre");
        expect(settimbre[4][2]).toBeNull();
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });
});

describe("Test 10: Round-trips what this project's own exporter writes", () => {
    it("reimports a file produced by js/mxml.js with the right values and pitches", async () => {
        global.frequencyToPitch = require("../../utils/musicutils").frequencyToPitch;
        global.getMidiDrum = () => ({});
        const saveMxmlOutput = require("../../mxml");

        const exported = saveMxmlOutput({
            notation: {
                notationStaging: {
                    0: [
                        [["C4"], 4, 0, null, null, false, false, null],
                        [["E4"], 4, 0, null, null, false, false, null],
                        [["R"], 8, 0, null, null, false, false, null],
                        [["G5"], 2, 0, null, null, false, false, null]
                    ]
                }
            }
        });

        const { blocks } = await parseAndCapture(exported);

        // The exporter writes <type>, which the parser prefers over dividing the
        // duration by the divisions, so each note comes back as the value it was
        // staged with rather than as a thirty-second-note count.
        expect(noteValues(blocks)).toEqual([
            [1, 4],
            [1, 4],
            [1, 8],
            [1, 2]
        ]);
        expect(pitches(blocks)).toEqual([
            { name: "C", octave: 4 },
            { name: "E", octave: 4 },
            { name: "G", octave: 5 }
        ]);
        expect(blocks.filter(b => blockName(b) === "rest2")).toHaveLength(1);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });
});

/** A part's {root, mode} from its setkey2 block. */
function keySignatureOf(blocks) {
    const byIndex = new Map(blocks.map(block => [block[0], block]));
    const setkey2 = blocks.find(b => blockName(b) === "setkey2");
    return {
        root: byIndex.get(setkey2[4][1])[1][1].value,
        mode: byIndex.get(setkey2[4][2])[1][1].value
    };
}

/** Every setkey2 block's {root, mode}, in block-array order (one per part). */
function keySignatures(blocks) {
    const byIndex = new Map(blocks.map(block => [block[0], block]));
    return blocks
        .filter(b => blockName(b) === "setkey2")
        .map(b => ({
            root: byIndex.get(b[4][1])[1][1].value,
            mode: byIndex.get(b[4][2])[1][1].value
        }));
}

/** Every setbpm3 block's quarter-notes-per-minute value, in block-array order. */
function tempos(blocks) {
    const byIndex = new Map(blocks.map(block => [block[0], block]));
    return blocks
        .filter(b => blockName(b) === "setbpm3")
        .map(b => byIndex.get(b[4][1])[1][1].value);
}

const withKey = (fifths, mode) =>
    `<key><fifths>${fifths}</fifths>${mode ? `<mode>${mode}</mode>` : ""}</key>`;

describe("Test 11: Real key-signature extraction", () => {
    it("defaults to C major when the file has no <key> at all", async () => {
        const { blocks } = await parseAndCapture(scorePartwise(SIMPLE_NOTE("C", 4, "quarter")));

        expect(keySignatureOf(blocks)).toEqual({ root: "C", mode: "major" });
    });

    it.each([
        [0, null, "C", "major"],
        [1, null, "G", "major"],
        [-1, null, "F", "major"],
        [7, null, "C♯", "major"],
        [-7, null, "C♭", "major"],
        [0, "minor", "A", "minor"],
        [-3, "minor", "C", "minor"],
        [0, "dorian", "D", "dorian"],
        [-2, "dorian", "C", "dorian"],
        [2, "mixolydian", "A", "mixolydian"],
        [0, "ionian", "C", "major"],
        [-3, "aeolian", "C", "minor"]
    ])("fifths %i, mode %s -> %s %s", async (fifths, mode, expectedRoot, expectedMode) => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter"),
                `<divisions>8</divisions>${withKey(fifths, mode)}`
            )
        );

        expect(keySignatureOf(blocks)).toEqual({ root: expectedRoot, mode: expectedMode });
    });

    it("treats an unrecognized <mode> as a major-offset key, reading <fifths> at face value", async () => {
        // An unrecognized mode name falls back to a 0 fifths-offset (as if it
        // were major) and a "major" mode name -- not a blanket "always C major"
        // regardless of <fifths>, which fifths=3 here would otherwise hide.
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter"),
                `<divisions>8</divisions>${withKey(3, "whatever")}`
            )
        );

        expect(keySignatureOf(blocks)).toEqual({ root: "A", mode: "major" });
    });

    it("falls back to C major when the combination falls outside a sane fifths range", async () => {
        // fifths=7 (C# major territory) with locrian's -5 offset needs a major
        // key at fifths=12, which no reasonable key signature reaches.
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter"),
                `<divisions>8</divisions>${withKey(7, "locrian")}`
            )
        );

        expect(keySignatureOf(blocks)).toEqual({ root: "C", mode: "major" });
    });

    // Regression tests: no file writes a major key this far round the circle
    // of fifths, but a minor (or other non-major) mode legitimately needs
    // majorTonicFifths out here. js/mxml.js's own _MAJOR_FIFTHS carries these
    // same four entries for exactly this reason; _MXML_FIFTHS_TO_MAJOR_TONIC
    // originally only mirrored its -7..7 "a major key could actually use this"
    // subset, silently falling back to C major for every one of these instead.
    it.each([
        [5, "minor", "G♯", "minor"],
        [6, "minor", "D♯", "minor"],
        [7, "minor", "A♯", "minor"],
        [-7, "lydian", "F♭", "lydian"]
    ])(
        "fifths %i, mode %s -> %s %s (extended range)",
        async (fifths, mode, expectedRoot, expectedMode) => {
            const { blocks } = await parseAndCapture(
                scorePartwise(
                    SIMPLE_NOTE("C", 4, "quarter"),
                    `<divisions>8</divisions>${withKey(fifths, mode)}`
                )
            );

            expect(keySignatureOf(blocks)).toEqual({ root: expectedRoot, mode: expectedMode });
        }
    );
});

describe("Test 12: Tempo", () => {
    it("loads correctly ordered: setkey2 reaches setbpm3, not settimbre, when a tempo is present", async () => {
        // Regression test: the tempo segment is appended after
        // settimbre/voicename/hidden in array order despite having lower ids
        // (Blocks.loadNewBlocks() resolves connections by array position, not
        // by matching a block's own [0] id -- see findPositionMismatches).
        // Before the fix, setkey2's connection to the tempo block's id instead
        // resolved to whatever sat at that array *position*, which was settimbre.
        const xml =
            '<score-partwise><part id="P1"><measure number="1">' +
            "<attributes><divisions>8</divisions></attributes>" +
            '<direction><sound tempo="96"/></direction>' +
            SIMPLE_NOTE("C", 4, "quarter") +
            "</measure></part></score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        expect(findPositionMismatches(blocks)).toEqual([]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);

        const setkey2 = blocks.find(b => blockName(b) === "setkey2");
        const next = blocks.find(b => b[0] === setkey2[4][3]);
        expect(blockName(next)).toBe("setbpm3");
    });

    it("omits the setbpm3 block entirely when the file stages no tempo", async () => {
        const { blocks } = await parseAndCapture(scorePartwise(SIMPLE_NOTE("C", 4, "quarter")));

        expect(blocks.filter(b => blockName(b) === "setbpm3")).toHaveLength(0);
    });

    it("reads <sound tempo> into a setbpm3 block at 4/4", async () => {
        const xml =
            '<score-partwise><part id="P1"><measure number="1">' +
            "<attributes><divisions>8</divisions></attributes>" +
            '<direction><sound tempo="96"/></direction>' +
            SIMPLE_NOTE("C", 4, "quarter") +
            "</measure></part></score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        expect(tempos(blocks)).toEqual([96]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("scales the setbpm3 value by the time signature's beat type", async () => {
        // MusicXML tempo is always quarter notes per minute; the setbpm3 block
        // counts beats of the project's own time signature (see
        // js/midi.js's finalizeTracks(), which uses the same conversion).
        const xml =
            '<score-partwise><part id="P1"><measure number="1">' +
            "<attributes><divisions>8</divisions><time><beats>6</beats><beat-type>8</beat-type></time></attributes>" +
            '<direction><sound tempo="120"/></direction>' +
            SIMPLE_NOTE("C", 4, "quarter") +
            "</measure></part></score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        // 120 quarter notes/min at a 1/8-beat time signature == 240 eighth-beats/min.
        expect(tempos(blocks)).toEqual([240]);
    });

    it("ignores a non-positive or non-numeric tempo rather than staging a bad value", async () => {
        const xml =
            '<score-partwise><part id="P1"><measure number="1">' +
            "<attributes><divisions>8</divisions></attributes>" +
            '<direction><sound tempo="0"/></direction>' +
            SIMPLE_NOTE("C", 4, "quarter") +
            "</measure></part></score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        expect(blocks.filter(b => blockName(b) === "setbpm3")).toHaveLength(0);
    });
});

describe("Test 13: Multi-part scores", () => {
    const twoPartScore = (part1Measures, part2Measures) =>
        "<score-partwise>" +
        '<part-list><score-part id="P1"/><score-part id="P2"/></part-list>' +
        `<part id="P1"><measure number="1"><attributes><divisions>8</divisions></attributes>${part1Measures}</measure></part>` +
        `<part id="P2"><measure number="1"><attributes><divisions>8</divisions></attributes>${part2Measures}</measure></part>` +
        "</score-partwise>";

    it("builds a separate note chain per part, each with its own voice label", async () => {
        const { blocks } = await parseAndCapture(
            twoPartScore(SIMPLE_NOTE("C", 4, "quarter"), SIMPLE_NOTE("E", 3, "quarter"))
        );

        expect(pitches(blocks)).toEqual([
            { name: "C", octave: 4 },
            { name: "E", octave: 3 }
        ]);
        const voiceTexts = blocks
            .filter(b => blockName(b) === "text")
            .map(b => b[1][1].value)
            .filter(v => v.startsWith("Voice"));
        expect(voiceTexts).toEqual(["Voice 1", "Voice 2"]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("gives each part its own settimbre/newnote chain, not a shared one", async () => {
        const { blocks } = await parseAndCapture(
            twoPartScore(SIMPLE_NOTE("C", 4, "quarter"), SIMPLE_NOTE("E", 3, "quarter"))
        );

        const settimbres = blocks.filter(b => blockName(b) === "settimbre");
        const newnotes = blocks.filter(b => blockName(b) === "newnote");
        expect(settimbres).toHaveLength(2);
        expect(newnotes).toHaveLength(2);
        expect(newnotes[0][4][0]).toBe(settimbres[0][0]);
        expect(newnotes[1][4][0]).toBe(settimbres[1][0]);
    });

    it("extracts each part's own key signature independently", async () => {
        const xml =
            "<score-partwise>" +
            '<part-list><score-part id="P1"/><score-part id="P2"/></part-list>' +
            '<part id="P1"><measure number="1"><attributes><divisions>8</divisions>' +
            withKey(2, null) +
            "</attributes>" +
            SIMPLE_NOTE("D", 4, "quarter") +
            "</measure></part>" +
            '<part id="P2"><measure number="1"><attributes><divisions>8</divisions>' +
            withKey(-3, "minor") +
            "</attributes>" +
            SIMPLE_NOTE("C", 3, "quarter") +
            "</measure></part>" +
            "</score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        expect(keySignatures(blocks)).toEqual([
            { root: "D", mode: "major" },
            { root: "C", mode: "minor" }
        ]);
    });

    it("shares one tempo across every part, same as a MIDI file's tempo applies to every track", async () => {
        const xml =
            "<score-partwise>" +
            '<part-list><score-part id="P1"/><score-part id="P2"/></part-list>' +
            '<part id="P1"><measure number="1"><attributes><divisions>8</divisions></attributes>' +
            '<direction><sound tempo="100"/></direction>' +
            SIMPLE_NOTE("C", 4, "quarter") +
            "</measure></part>" +
            '<part id="P2"><measure number="1"><attributes><divisions>8</divisions></attributes>' +
            SIMPLE_NOTE("E", 3, "quarter") +
            "</measure></part>" +
            "</score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        expect(tempos(blocks)).toEqual([100, 100]);
    });

    it("keeps full block-graph integrity across three parts, key signatures and a tempo", async () => {
        const xml =
            "<score-partwise>" +
            '<part-list><score-part id="P1"/><score-part id="P2"/><score-part id="P3"/></part-list>' +
            '<part id="P1"><measure number="1"><attributes><divisions>8</divisions>' +
            withKey(1, null) +
            "<time><beats>3</beats><beat-type>4</beat-type></time></attributes>" +
            '<direction><sound tempo="110"/></direction>' +
            SIMPLE_NOTE("G", 4, "quarter") +
            SIMPLE_NOTE("A", 4, "eighth") +
            "</measure></part>" +
            '<part id="P2"><measure number="1"><attributes><divisions>4</divisions>' +
            withKey(-2, "dorian") +
            "</attributes>" +
            "<note><rest/><duration>4</duration><type>quarter</type></note>" +
            SIMPLE_NOTE("B", 3, "quarter") +
            "</measure></part>" +
            '<part id="P3"><measure number="1"><attributes><divisions>8</divisions></attributes>' +
            "</measure></part>" +
            "</score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        expect(findPositionMismatches(blocks)).toEqual([]);
        // Part 3 has no notes at all -- its settimbre note-dock stays null,
        // same single-part behaviour Test 9 already covers.
        const settimbres = blocks.filter(b => blockName(b) === "settimbre");
        expect(settimbres).toHaveLength(3);
        expect(settimbres[2][4][2]).toBeNull();
    });
});

describe("Test 14: Grace notes", () => {
    it("skips a grace note rather than importing it as a full-length note", async () => {
        // A grace note has a <type> (quarter here) but no <duration> -- it
        // doesn't take up measure time. Importing it as a full note would make
        // the following note start late and throw off every note after it.
        // (Re-covers what part 1 of this series intended to fix but never
        // actually pushed -- see this PR's description.)
        const { blocks } = await parseAndCapture(
            scorePartwise(
                "<note><grace/><pitch><step>D</step><octave>4</octave></pitch><type>quarter</type></note>" +
                    SIMPLE_NOTE("C", 4, "quarter")
            )
        );

        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
        expect(noteValues(blocks)).toEqual([[1, 4]]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });
});

describe("Test 15: Drum/unpitched parts", () => {
    const drumScore = noteXml =>
        "<score-partwise>" +
        '<part-list><score-part id="D1">' +
        '<score-instrument id="D1-X1"><instrument-name>snare drum</instrument-name></score-instrument>' +
        "</score-part></part-list>" +
        `<part id="D1"><measure number="1"><attributes><divisions>8</divisions></attributes>${noteXml}</measure></part>` +
        "</score-partwise>";

    it("builds a playdrum/drumname pair nested in the newnote wrapper, not a pitch", async () => {
        const { blocks } = await parseAndCapture(
            drumScore(
                "<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched>" +
                    "<duration>8</duration><type>quarter</type>" +
                    '<instrument id="D1-X1"/></note>'
            )
        );

        expect(drumNames(blocks)).toEqual(["snare drum"]);
        expect(pitches(blocks)).toEqual([]);
        expect(noteValues(blocks)).toEqual([[1, 4]]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        expect(findPositionMismatches(blocks)).toEqual([]);

        // playdrum sits where pitch normally would -- inside the newnote's
        // clamp (connected from the vspace), not appended after it.
        const newnote = blocks.find(b => blockName(b) === "newnote");
        const vspace = blocks.find(b => b[0] === newnote[4][2]);
        const playdrum = blocks.find(b => blockName(b) === "playdrum");
        expect(playdrum[4][0]).toBe(vspace[0]);
    });

    it("falls back to kick drum when the <instrument> reference doesn't resolve", async () => {
        const { blocks } = await parseAndCapture(
            drumScore(
                "<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched>" +
                    '<duration>8</duration><type>quarter</type><instrument id="nonexistent"/></note>'
            )
        );

        expect(drumNames(blocks)).toEqual(["kick drum"]);
    });

    it("falls back to kick drum when the note has no <instrument> reference at all", async () => {
        const { blocks } = await parseAndCapture(
            drumScore(
                "<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched>" +
                    "<duration>8</duration><type>quarter</type></note>"
            )
        );

        expect(drumNames(blocks)).toEqual(["kick drum"]);
    });

    it("falls back to kick drum when the matched <score-instrument> has an empty <instrument-name>", async () => {
        // A different fallback path than "the id doesn't resolve at all" --
        // this is the score-instrument being found, but its own name text
        // being empty/whitespace-only.
        const xml =
            "<score-partwise>" +
            '<part-list><score-part id="D1">' +
            '<score-instrument id="D1-X1"><instrument-name></instrument-name></score-instrument>' +
            "</score-part></part-list>" +
            '<part id="D1"><measure number="1"><attributes><divisions>8</divisions></attributes>' +
            "<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched>" +
            '<duration>8</duration><type>quarter</type><instrument id="D1-X1"/></note>' +
            "</measure></part></score-partwise>";

        const { blocks } = await parseAndCapture(xml);
        expect(drumNames(blocks)).toEqual(["kick drum"]);
    });

    it("mixes drum and pitched notes in the same part correctly", async () => {
        const { blocks } = await parseAndCapture(
            drumScore(
                SIMPLE_NOTE("C", 4, "quarter") +
                    "<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched>" +
                    '<duration>8</duration><type>quarter</type><instrument id="D1-X1"/></note>'
            )
        );

        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
        expect(drumNames(blocks)).toEqual(["snare drum"]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });
});

describe("Test 15b: drum kits named by other programs", () => {
    const kitScore = (kit, ids = kit.map(([id]) => id)) =>
        '<score-partwise><part-list><score-part id="P1">' +
        kit
            .map(
                ([id, name]) =>
                    `<score-instrument id="P1-${id}"><instrument-name>${name}</instrument-name></score-instrument>`
            )
            .join("") +
        kit
            .map(
                ([id, , unpitched]) =>
                    `<midi-instrument id="P1-${id}"><midi-channel>10</midi-channel><midi-unpitched>${unpitched}</midi-unpitched></midi-instrument>`
            )
            .join("") +
        "</score-part></part-list>" +
        '<part id="P1"><measure number="1"><attributes><divisions>8</divisions></attributes>' +
        ids
            .map(
                id =>
                    "<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched>" +
                    `<duration>8</duration><type>quarter</type><instrument id="P1-${id}"/></note>`
            )
            .join("") +
        "</measure></part></score-partwise>";

    it("imports the MusicXML tutorial's drum kit as its own drums, not five kicks", async () => {
        // The kit in https://www.w3.org/2021/06/musicxml40/tutorial/percussion
        const { blocks } = await parseAndCapture(
            kitScore([
                ["X4", "Snare Drum", 39],
                ["X2", "Kick Drum", 37],
                ["X13", "Crash Cymbal", 50],
                ["X6", "Hi-Hat Closed", 43],
                ["X1", "Cowbell", 57]
            ])
        );

        expect(drumNames(blocks)).toEqual([
            "snare drum",
            "kick drum",
            "crash",
            "hi hat",
            "cow bell"
        ]);
    });

    it("maps General MIDI kit pieces Music Blocks has no exact drum for to the nearest one", async () => {
        const { blocks } = await parseAndCapture(
            kitScore([
                ["I36", "Acoustic Bass Drum", 36],
                ["I47", "Open Hi-Hat", 47],
                ["I52", "Ride Cymbal 1", 52],
                ["I49", "Hi-Mid Tom", 49]
            ])
        );

        expect(drumNames(blocks)).toEqual(["kick drum", "hi hat", "ride bell", "tom tom"]);
    });

    it("prefers a Music Blocks drum name over <midi-unpitched>", async () => {
        const { blocks } = await parseAndCapture(kitScore([["X", "Clap", 39]]));

        expect(drumNames(blocks)).toEqual(["clap"]);
    });
});

describe("Test 15c: <forward>", () => {
    it("imports a <forward> as a rest of its length, so later notes keep their place", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter") +
                    "<forward><duration>16</duration></forward>" +
                    SIMPLE_NOTE("D", 4, "quarter")
            )
        );

        expect(noteValues(blocks)).toEqual([
            [1, 4],
            [16, 32],
            [1, 4]
        ]);
        expect(blocks.filter(b => blockName(b) === "rest2")).toHaveLength(1);
        expect(pitches(blocks)).toEqual([
            { name: "C", octave: 4 },
            { name: "D", octave: 4 }
        ]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("ends an open tie at a <forward> instead of stretching it over the gap", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                '<note><pitch><step>C</step><octave>4</octave></pitch><duration>8</duration><tie type="start"/><type>quarter</type></note>' +
                    "<forward><duration>8</duration></forward>"
            )
        );

        expect(noteValues(blocks)).toEqual([
            [1, 4],
            [8, 32]
        ]);
    });

    it("ignores a <forward> with no usable <duration>", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter") +
                    "<forward><duration></duration></forward><forward/>" +
                    SIMPLE_NOTE("D", 4, "quarter")
            )
        );

        expect(noteValues(blocks)).toEqual([
            [1, 4],
            [1, 4]
        ]);
    });
});

describe("Test 16: Ties", () => {
    const tiedNote = (step, octave, tieAttrs) =>
        `<note><pitch><step>${step}</step><octave>${octave}</octave></pitch>` +
        `<duration>8</duration><type>quarter</type>${tieAttrs}</note>`;

    it("merges two tied notes into one note block with their durations summed", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                tiedNote("C", 4, '<tie type="start"/>') + tiedNote("C", 4, '<tie type="stop"/>')
            )
        );

        // Two tied quarter notes become one half note.
        expect(noteValues(blocks)).toEqual([[1, 2]]);
        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        expect(findPositionMismatches(blocks)).toEqual([]);
    });

    it("merges a tie spanning three notes (a tie that both stops and restarts)", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                tiedNote("C", 4, '<tie type="start"/>') +
                    tiedNote("C", 4, '<tie type="stop"/><tie type="start"/>') +
                    tiedNote("C", 4, '<tie type="stop"/>')
            )
        );

        // Three tied quarter notes become one dotted half note.
        expect(noteValues(blocks)).toEqual([[3, 4]]);
        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
    });

    it("keeps an untied note after a tie chain separate", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                tiedNote("C", 4, '<tie type="start"/>') +
                    tiedNote("C", 4, '<tie type="stop"/>') +
                    SIMPLE_NOTE("D", 4, "quarter")
            )
        );

        expect(pitches(blocks)).toEqual([
            { name: "C", octave: 4 },
            { name: "D", octave: 4 }
        ]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("keeps a long tie chain finite when importing its combined duration", async () => {
        const notes = Array.from({ length: 512 }, (_, index) => {
            const ties =
                (index > 0 ? '<tie type="stop"/>' : "") +
                (index < 511 ? '<tie type="start"/>' : "");
            return tiedNote("C", 4, ties);
        }).join("");
        const { blocks } = await parseAndCapture(scorePartwise(notes));
        const values = noteValues(blocks);
        expect(values).toHaveLength(1);
        const [numerator, denominator] = values[0];
        expect(numerator / denominator).toBe(128);
        expect(Number.isSafeInteger(numerator)).toBe(true);
        expect(Number.isSafeInteger(denominator)).toBe(true);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("preserves the exact sum when tied notes have different denominators", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                tiedNote("C", 4, '<tie type="start"/>') +
                    "<note><pitch><step>C</step><octave>4</octave></pitch>" +
                    "<duration>1</duration><type>quarter</type><time-modification>" +
                    "<actual-notes>3</actual-notes><normal-notes>2</normal-notes>" +
                    '</time-modification><tie type="stop"/></note>'
            )
        );
        const [[numerator, denominator]] = noteValues(blocks);
        expect(numerator / denominator).toBe(5 / 12);
    });

    it.each([
        ["decimal durations", 0.1, 1],
        ["decimal divisions", 1, 0.3]
    ])("preserves tied %s without integer GCD rounding", async (_name, duration, divisions) => {
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>${duration}</duration><tie type="${tie}"/></note>`;
        const { blocks } = await parseAndCapture(
            scorePartwise(note("start") + note("stop"), `<divisions>${divisions}</divisions>`)
        );
        const values = noteValues(blocks);
        expect(values).toHaveLength(1);
        const [[numerator, denominator]] = values;
        expect(numerator / denominator).toBeCloseTo((2 * duration) / (divisions * 4));
        expect(Math.abs(numerator)).toBeLessThan(Number.MAX_SAFE_INTEGER);
        expect(Math.abs(denominator)).toBeLessThan(Number.MAX_SAFE_INTEGER);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("preserves the note-value fraction when decimal ties form a quarter note", async () => {
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>0.25</duration><tie type="${tie}"/></note>`;

        const { blocks } = await parseAndCapture(
            scorePartwise(note("start") + note("stop"), "<divisions>0.5</divisions>")
        );

        expect(noteValues(blocks)).toEqual([[1, 4]]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("preserves very small decimal tie durations", async () => {
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>0.0001</duration><tie type="${tie}"/></note>`;

        const { blocks } = await parseAndCapture(
            scorePartwise(note("start") + note("stop"), "<divisions>1</divisions>")
        );

        expect(noteValues(blocks)).toEqual([[1, 20000]]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("keeps an extremely small decimal tie finite when integer conversion cannot scale it", async () => {
        const tinyDuration = `0.${"0".repeat(308)}1`;
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>${tinyDuration}</duration><tie type="${tie}"/></note>`;

        const { blocks } = await parseAndCapture(
            scorePartwise(note("start") + note("stop"), "<divisions>1</divisions>")
        );

        const values = noteValues(blocks);
        expect(values).toHaveLength(1);

        const [[numerator, denominator]] = values;
        expect(Number.isFinite(numerator)).toBe(true);
        expect(Number.isFinite(denominator)).toBe(true);
        expect(numerator).toBeGreaterThan(0);
        expect(denominator).toBeGreaterThan(0);
        expect(numerator / denominator).toBe(Number(tinyDuration) / 2);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("reduces huge integer tie operands before addition can overflow", async () => {
        const hugeDuration = `1${"0".repeat(308)}`;
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>${hugeDuration}</duration><tie type="${tie}"/></note>`;

        const { blocks } = await parseAndCapture(
            scorePartwise(note("start") + note("stop"), "<divisions>1</divisions>")
        );

        const values = noteValues(blocks);
        expect(values).toHaveLength(1);

        const [[numerator, denominator]] = values;
        expect(Number.isFinite(numerator)).toBe(true);
        expect(Number.isFinite(denominator)).toBe(true);
        expect(numerator).toBeGreaterThan(0);
        expect(denominator).toBeGreaterThan(0);
        expect(numerator / denominator).toBe(Number(hugeDuration) / 2);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("keeps a large decimal-denominator tie finite when direct addition overflows", async () => {
        const hugeDuration = `1${"0".repeat(308)}`;
        const divisions = 1.025;
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>${hugeDuration}</duration><tie type="${tie}"/></note>`;

        const { blocks } = await parseAndCapture(
            scorePartwise(note("start") + note("stop"), `<divisions>${divisions}</divisions>`)
        );

        const values = noteValues(blocks);
        expect(values).toHaveLength(1);

        const [[numerator, denominator]] = values;
        const expected = (Number(hugeDuration) / (divisions * 4)) * 2;

        expect(Number.isFinite(numerator)).toBe(true);
        expect(Number.isFinite(denominator)).toBe(true);
        expect(numerator).toBeGreaterThan(0);
        expect(denominator).toBeGreaterThan(0);
        expect(numerator / denominator).toBe(expected);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("falls back safely when a tied duration sum exceeds the numeric range", async () => {
        const hugeDuration = `17${"0".repeat(307)}`;
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>${hugeDuration}</duration><tie type="${tie}"/></note>`;

        const { blocks } = await parseAndCapture(
            scorePartwise(note("start") + note("stop"), "<divisions>0.275</divisions>")
        );

        expect(noteValues(blocks)).toEqual([[1, 4]]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("falls back safely for a tied note with a non-numeric duration", async () => {
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>abc</duration><tie type="${tie}"/></note>`;

        const { blocks } = await parseAndCapture(scorePartwise(note("start") + note("stop")));

        expect(noteValues(blocks)).toEqual([[1, 2]]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it.each([
        ["empty", ""],
        ["whitespace-only", "   "],
        ["zero", "0"],
        ["negative", "-1"]
    ])("falls back safely for tied notes with %s duration", async (_name, duration) => {
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>${duration}</duration><tie type="${tie}"/></note>`;

        const { blocks } = await parseAndCapture(scorePartwise(note("start") + note("stop")));

        expect(noteValues(blocks)).toEqual([[1, 2]]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("falls back safely for tied notes with non-finite divisions", async () => {
        const note = tie =>
            "<note><pitch><step>C</step><octave>4</octave></pitch>" +
            `<duration>1</duration><tie type="${tie}"/></note>`;

        const { blocks } = await parseAndCapture(
            scorePartwise(note("start") + note("stop"), "<divisions>Infinity</divisions>")
        );

        expect(noteValues(blocks)).toEqual([[1, 2]]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it.each([
        ["decimal durations", 0.1, 1],
        ["decimal divisions", 1, 0.3]
    ])("keeps a long tie chain with %s finite", async (_name, duration, divisions) => {
        const notes = Array.from({ length: 512 }, (_, index) => {
            const ties =
                (index > 0 ? '<tie type="stop"/>' : "") +
                (index < 511 ? '<tie type="start"/>' : "");

            return (
                "<note><pitch><step>C</step><octave>4</octave></pitch>" +
                `<duration>${duration}</duration>${ties}</note>`
            );
        }).join("");

        const { blocks } = await parseAndCapture(
            scorePartwise(notes, `<divisions>${divisions}</divisions>`)
        );

        const values = noteValues(blocks);
        expect(values).toHaveLength(1);

        const [[numerator, denominator]] = values;
        expect(Number.isFinite(numerator)).toBe(true);
        expect(Number.isFinite(denominator)).toBe(true);
        expect(numerator / denominator).toBeCloseTo((512 * duration) / (divisions * 4));
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("emits the accumulated duration for a malformed file that ends mid-tie", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(tiedNote("C", 4, '<tie type="start"/>'))
        );

        expect(noteValues(blocks)).toEqual([[1, 4]]);
        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("treats a note with both start and stop tags, and no active chain, as standalone", async () => {
        // Invalid MusicXML on its own (a tie can't stop before it starts),
        // but a defensive reading matters: this must not be read as a new
        // chain waiting for a stop that will never come (it already "has"
        // one), which would wrongly swallow the next note's duration into it.
        const { blocks } = await parseAndCapture(
            scorePartwise(
                tiedNote("C", 4, '<tie type="start"/><tie type="stop"/>') +
                    SIMPLE_NOTE("D", 4, "quarter")
            )
        );

        expect(noteValues(blocks)).toEqual([
            [1, 4],
            [1, 4]
        ]);
        expect(pitches(blocks)).toEqual([
            { name: "C", octave: 4 },
            { name: "D", octave: 4 }
        ]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("flushes an open tie before an unrelated note instead of folding it in", async () => {
        // A tie left open (no matching stop) followed by a completely
        // unrelated note (different pitch, no tie tags at all) must not
        // silently absorb that note's duration/pitch into the open tie --
        // the open tie is flushed as-is, then D is handled as its own note.
        const { blocks } = await parseAndCapture(
            scorePartwise(tiedNote("C", 4, '<tie type="start"/>') + SIMPLE_NOTE("D", 4, "quarter"))
        );

        expect(noteValues(blocks)).toEqual([
            [1, 4],
            [1, 4]
        ]);
        expect(pitches(blocks)).toEqual([
            { name: "C", octave: 4 },
            { name: "D", octave: 4 }
        ]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("flushes an open tie before a note with a tie stop but a different pitch", async () => {
        // Invalid MusicXML (ties are always same-pitch), but defensively:
        // a mismatched "stop" must not be read as closing this tie.
        const { blocks } = await parseAndCapture(
            scorePartwise(
                tiedNote("C", 4, '<tie type="start"/>') + tiedNote("D", 4, '<tie type="stop"/>')
            )
        );

        expect(noteValues(blocks)).toEqual([
            [1, 4],
            [1, 4]
        ]);
        expect(pitches(blocks)).toEqual([
            { name: "C", octave: 4 },
            { name: "D", octave: 4 }
        ]);
    });

    it("flushes an open tie before an intervening rest", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                tiedNote("C", 4, '<tie type="start"/>') +
                    "<note><rest/><duration>8</duration><type>quarter</type></note>"
            )
        );

        expect(noteValues(blocks)).toEqual([
            [1, 4],
            [1, 4]
        ]);
        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
        expect(blocks.filter(b => blockName(b) === "rest2")).toHaveLength(1);
    });
});

describe("Test 17: Repeats", () => {
    const BARLINE_FORWARD = '<barline location="left"><repeat direction="forward"/></barline>';
    const barlineBackward = times =>
        `<barline location="right"><repeat direction="backward"${times ? ` times="${times}"` : ""}/></barline>`;

    it("wraps the whole part in a repeat block when there's no explicit forward repeat", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter") + SIMPLE_NOTE("D", 4, "quarter") + barlineBackward(3)
            )
        );

        const repeat = blocks.find(b => blockName(b) === "repeat");
        const settimbre = blocks.find(b => blockName(b) === "settimbre");
        const newnotes = blocks.filter(b => blockName(b) === "newnote");
        expect(repeat).toBeDefined();
        const countBlock = blocks.find(b => b[0] === repeat[4][1]);
        expect(countBlock[1][1].value).toBe(3);
        // settimbre connects to the repeat block, not straight to the first note.
        expect(settimbre[4][2]).toBe(repeat[0]);
        expect(repeat[4][2]).toBe(newnotes[0][0]);
        // The range covers the whole part, so nothing follows the repeat.
        expect(repeat[4][3]).toBeNull();
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        expect(findPositionMismatches(blocks)).toEqual([]);
    });

    it("defaults to a repeat count of 2 when times is absent", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(SIMPLE_NOTE("C", 4, "quarter") + barlineBackward(null))
        );

        const repeat = blocks.find(b => blockName(b) === "repeat");
        const countBlock = blocks.find(b => b[0] === repeat[4][1]);
        expect(countBlock[1][1].value).toBe(2);
    });

    it("wraps only a middle section, leaving notes before and after it outside the clamp", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter") +
                    BARLINE_FORWARD +
                    SIMPLE_NOTE("D", 4, "quarter") +
                    SIMPLE_NOTE("E", 4, "quarter") +
                    barlineBackward(null) +
                    SIMPLE_NOTE("F", 4, "quarter")
            )
        );

        const [cNote, dNote, eNote, fNote] = blocks.filter(b => blockName(b) === "newnote");
        const repeat = blocks.find(b => blockName(b) === "repeat");

        // C, before the range, is untouched and still leads into the repeat block.
        expect(cNote[4][1]).toBeDefined(); // sanity: still a real block
        expect(dNote[4][0]).toBe(repeat[0]); // D (range start) connects from repeat
        // E (range end)'s own trailing hidden spacer has nothing following it
        // from inside the clamp.
        const eHidden = blocks.find(b => blockName(b) === "hidden" && b[4][0] === eNote[0]);
        expect(eHidden[4][1]).toBeNull();
        expect(fNote[4][0]).toBe(repeat[0]); // F (after the range) connects from repeat
        expect(repeat[4][2]).toBe(dNote[0]);
        expect(repeat[4][3]).toBe(fNote[0]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        expect(findPositionMismatches(blocks)).toEqual([]);
    });

    it("ignores an unmatched forward repeat (no backward repeat ever closes it)", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter") + BARLINE_FORWARD + SIMPLE_NOTE("D", 4, "quarter")
            )
        );

        expect(blocks.filter(b => blockName(b) === "repeat")).toHaveLength(0);
        expect(pitches(blocks)).toEqual([
            { name: "C", octave: 4 },
            { name: "D", octave: 4 }
        ]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("treats a second forward repeat before any backward repeat as moving the start forward", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("C", 4, "quarter") +
                    BARLINE_FORWARD +
                    SIMPLE_NOTE("D", 4, "quarter") +
                    BARLINE_FORWARD +
                    SIMPLE_NOTE("E", 4, "quarter") +
                    barlineBackward(null)
            )
        );

        const [, dNote, eNote] = blocks.filter(b => blockName(b) === "newnote");
        const repeat = blocks.find(b => blockName(b) === "repeat");
        // The range starts at E (the second, later forward repeat), not D.
        expect(repeat[4][2]).toBe(eNote[0]);
        expect(dNote[4][1]).toBeDefined(); // D is unaffected, still outside the range
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("keeps two sequential unpaired backward repeats as separate, non-overlapping ranges", async () => {
        // "A :| B :|" is two one-note repeats (A alone, then B alone), not
        // two ranges that both claim to start at A -- the second repeat's
        // implicit start must pick up right after the first one ended.
        const { blocks } = await parseAndCapture(
            scorePartwise(
                SIMPLE_NOTE("A", 4, "quarter") +
                    barlineBackward(null) +
                    SIMPLE_NOTE("B", 4, "quarter") +
                    barlineBackward(null)
            )
        );

        const [aNote, bNote] = blocks.filter(b => blockName(b) === "newnote");
        const [repeat1, repeat2] = blocks.filter(b => blockName(b) === "repeat");
        expect(repeat1[4][2]).toBe(aNote[0]);
        expect(repeat2[4][2]).toBe(bNote[0]);
        // The two repeats are chained directly: the first's flow-next is the
        // second repeat block, not A or B's own hidden spacer.
        expect(repeat1[4][3]).toBe(repeat2[0]);
        expect(bNote[4][0]).toBe(repeat2[0]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
        expect(findPositionMismatches(blocks)).toEqual([]);
    });
});

describe("Test 11: Tuplets are played at their time-modification ratio", () => {
    const TUPLET_NOTE = (step, type, actual, normal) =>
        `<note><pitch><step>${step}</step><octave>4</octave></pitch><duration>1</duration>` +
        `<type>${type}</type><time-modification><actual-notes>${actual}</actual-notes>` +
        `<normal-notes>${normal}</normal-notes></time-modification></note>`;

    const total = values => values.reduce((sum, [n, d]) => sum + n / d, 0);

    it("shortens an eighth-note triplet to a third of a quarter each", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                TUPLET_NOTE("C", "eighth", 3, 2) +
                    TUPLET_NOTE("D", "eighth", 3, 2) +
                    TUPLET_NOTE("E", "eighth", 3, 2)
            )
        );

        // Written as eighths, played three in the time of two, so each is a
        // twelfth of a whole note and the three together fill one quarter.
        expect(noteValues(blocks)).toEqual([
            [2, 24],
            [2, 24],
            [2, 24]
        ]);
        expect(total(noteValues(blocks))).toBeCloseTo(1 / 4);
    });

    it("handles a ratio other than three in the time of two", async () => {
        const { blocks } = await parseAndCapture(scorePartwise(TUPLET_NOTE("C", "16th", 5, 4)));

        expect(noteValues(blocks)).toEqual([[4, 80]]);
    });

    it("keeps the dots on a dotted tuplet note", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                `<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration>` +
                    `<type>eighth</type><dot/><time-modification><actual-notes>3</actual-notes>` +
                    `<normal-notes>2</normal-notes></time-modification></note>`
            )
        );

        // A dotted eighth is 3/16; three in the time of two makes it 3/24.
        expect(noteValues(blocks)).toEqual([[6, 48]]);
    });

    it("leaves a note with no time-modification at its written length", async () => {
        const { blocks } = await parseAndCapture(scorePartwise(SIMPLE_NOTE("C", 4, "quarter")));

        expect(noteValues(blocks)).toEqual([[1, 4]]);
    });

    it.each([0, Infinity])(
        "ignores malformed actual-notes %s rather than producing an invalid length",
        async actual => {
            const { blocks } = await parseAndCapture(
                scorePartwise(TUPLET_NOTE("C", "quarter", actual, 2))
            );

            expect(noteValues(blocks)).toEqual([[1, 4]]);
        }
    );

    it("uses the duration fallback when a finite tuplet ratio overflows", async () => {
        const hugeActual = `1${"0".repeat(308)}`;

        const { blocks } = await parseAndCapture(
            scorePartwise(TUPLET_NOTE("C", "quarter", hugeActual, 2))
        );

        expect(noteValues(blocks)).toEqual([[1, 32]]);
        expect(findUnreciprocatedConnections(blocks)).toEqual([]);
    });

    it("does not touch a note that falls back to duration, which already has the ratio", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                `<note><pitch><step>C</step><octave>4</octave></pitch><duration>8</duration>` +
                    `<time-modification><actual-notes>3</actual-notes>` +
                    `<normal-notes>2</normal-notes></time-modification></note>`,
                "<divisions>24</divisions>"
            )
        );

        expect(noteValues(blocks)).toEqual([[8, 96]]);
    });
});

describe("Test 19: Cue notes", () => {
    it("takes a cue note's length from <duration>, not its drawn <type>", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                "<note><cue/><pitch><step>E</step><octave>5</octave></pitch><duration>8</duration><type>half</type></note>" +
                    SIMPLE_NOTE("C", 4, "quarter")
            )
        );

        // divisions 8: a duration of 8 is a quarter, whatever <type> says.
        expect(noteValues(blocks)).toEqual([
            [8, 32],
            [1, 4]
        ]);
        expect(blocks.filter(b => blockName(b) === "rest2")).toHaveLength(1);
    });

    it("imports a cue note as a rest of the same length, since it isn't played", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise(
                "<note><cue/><pitch><step>E</step><octave>5</octave></pitch><duration>8</duration><type>quarter</type></note>" +
                    SIMPLE_NOTE("C", 4, "quarter")
            )
        );

        expect(noteValues(blocks)).toEqual([
            [8, 32],
            [1, 4]
        ]);
        expect(blocks.filter(b => blockName(b) === "rest2")).toHaveLength(1);
        expect(pitches(blocks)).toEqual([{ name: "C", octave: 4 }]);
    });
});
