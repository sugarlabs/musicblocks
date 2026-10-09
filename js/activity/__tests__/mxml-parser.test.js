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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a minimal activity instance with a spy on loadNewBlocks. */
function makeActivity() {
    const activity = {
        errorMsg: jest.fn(),
        blocks: {
            loadNewBlocks: jest.fn()
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
});

describe("Test 2: Rests", () => {
    it("builds a rest2 block for an explicit <rest/>", async () => {
        const { blocks } = await parseAndCapture(
            scorePartwise("<note><rest/><duration>8</duration><type>quarter</type></note>")
        );

        expect(blocks.filter(b => blockName(b) === "rest2")).toHaveLength(1);
        expect(blocks.filter(b => blockName(b) === "pitch")).toHaveLength(0);
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
        await activity.parseMXML("not xml at all <<<");

        expect(activity.errorMsg).toHaveBeenCalled();
        expect(activity.blocks.loadNewBlocks).not.toHaveBeenCalled();
    });

    it("reports an error when the file has no <part>", async () => {
        const activity = makeActivity();
        await activity.parseMXML("<score-partwise></score-partwise>");

        expect(activity.errorMsg).toHaveBeenCalled();
        expect(activity.blocks.loadNewBlocks).not.toHaveBeenCalled();
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

        expect(noteValues(blocks)).toEqual([
            [8, 32],
            [8, 32],
            [4, 32],
            [16, 32]
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
});

describe("Test 12: Tempo", () => {
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
        // Part 3 has no notes at all -- its settimbre note-dock stays null,
        // same single-part behaviour Test 9 already covers.
        const settimbres = blocks.filter(b => blockName(b) === "settimbre");
        expect(settimbres).toHaveLength(3);
        expect(settimbres[2][4][2]).toBeNull();
    });
});
