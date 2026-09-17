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

// Mock global constants
global.NOTATIONNOTE = 0;
global.NOTATIONDURATION = 1;
global.NOTATIONDOTCOUNT = 2;
global.NOTATIONTUPLETVALUE = 3;
global.NOTATIONROUNDDOWN = 4;
global.NOTATIONINSIDECHORD = 5; // deprecated
global.NOTATIONSTACCATO = 6;

global.frequencyToPitch = jest.fn(freq => {
    if (freq === 440) return ["A", "4"];
    return ["G♯", "4"];
});

global.toFraction = jest.fn(num => [1, 1]);

const {
    getABCHeader,
    processABCNotes,
    saveAbcOutput,
    ACCIDENTAL_MAP,
    OCTAVE_NOTATION_MAP
} = require("../abc");

describe("getABCHeader", () => {
    it("should return the correct ABC header", () => {
        const expectedHeader = "X:1\nT:Music Blocks composition\nC:Mr. Mouse\nL:1/16\nM:C\n";
        expect(getABCHeader()).toBe(expectedHeader);
    });
});

describe("processABCNotes - Basic Note Processing", () => {
    let logo;

    beforeEach(() => {
        logo = {
            notationNotes: { 0: "" },
            notation: {
                notationStaging: {
                    0: [
                        [["G♯4"], 4, 0, null, null, -1, false],
                        [["F4"], 4, 0, null, null, -1, false],
                        [["G♯4"], 2, 0, null, null, -1, false]
                    ]
                }
            }
        };
    });

    it("should process notes and update notationNotes correctly", () => {
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("^G4 F4 ^G8 ");
    });

    it("should handle octaves 5 and above correctly (lowercase and proper octave markers)", () => {
        logo.notation.notationStaging["0"] = [
            [["G5"], 4, 0, null, null, -1, false],
            [["C8"], 4, 0, null, null, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("g4 c'''4 ");
    });

    it("should insert a newline after every 8 notes", () => {
        const notes = [];
        // Add 9 notes
        for (let i = 0; i < 9; i++) {
            notes.push([["C4"], 4, 0, null, null, -1, false]);
        }
        logo.notation.notationStaging["0"] = notes;

        processABCNotes(logo, "0");
        // Check if newline exists in the output
        expect(logo.notationNotes["0"]).toMatch(/\n/);
    });
});
describe("processABCNotes - Advanced Note Handling", () => {
    let logo;

    beforeEach(() => {
        logo = { notationNotes: { 0: "" }, notation: { notationStaging: { 0: [] } } };
    });

    it("should handle frequency (number) inputs", () => {
        logo.notation.notationStaging["0"] = [
            [[440], 4, 0, null, null, -1, false] // 440Hz -> A4
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("A4");
        expect(global.frequencyToPitch).toHaveBeenCalledWith(440);
    });

    it("should handle staccato and dots", () => {
        logo.notation.notationStaging["0"] = [[["C4"], 4, 2, null, null, -1, true]];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe(".C4.. ");
    });

    it("should convert durations using the map and fallback to string", () => {
        logo.notation.notationStaging["0"] = [
            [["C4"], 64, 0, null, null, -1, false], // Map: 1/4
            [["D4"], 32, 0, null, null, -1, false], // Map: 1/2
            [["E4"], 1, 0, null, null, -1, false], // Map: 16
            [["F4"], 5, 0, null, null, -1, false] // No map: "5"
        ];
        processABCNotes(logo, "0");
        const output = logo.notationNotes["0"];
        expect(output).toContain("C1/4");
        expect(output).toContain("D1/2");
        expect(output).toContain("E16");
        expect(output).toContain("F5");
    });

    it("should write accidental markers before the ABC pitch", () => {
        logo.notation.notationStaging["0"] = [
            [["C𝄪4"], 4, 0, null, null, -1, false],
            [["D♯4"], 4, 0, null, null, -1, false],
            [["E♮4"], 4, 0, null, null, -1, false],
            [["F♭4"], 4, 0, null, null, -1, false],
            [["G𝄫4"], 4, 0, null, null, -1, false]
        ];

        processABCNotes(logo, "0");

        expect(logo.notationNotes["0"]).toBe("^^C4 ^D4 =E4 _F4 __G4 ");
    });

    it("should support ASCII accidentals without changing lowercase B notes", () => {
        logo.notation.notationStaging["0"] = [
            [["G#4"], 4, 0, null, null, -1, false],
            [["Bb4"], 4, 0, null, null, -1, false],
            [["b4"], 4, 0, null, null, -1, false]
        ];

        processABCNotes(logo, "0");

        expect(logo.notationNotes["0"]).toBe("^G4 _B4 B4 ");
    });

    it("should preserve rests without accidental matching", () => {
        logo.notation.notationStaging["0"] = [[["R"], 4, 0, null, null, -1, false]];

        processABCNotes(logo, "0");

        expect(logo.notationNotes["0"]).toBe("R4 ");
    });
});
describe("processABCNotes - Control Strings", () => {
    let logo;
    beforeEach(() => {
        logo = { notationNotes: { 0: "" }, notation: { notationStaging: { 0: [] } } };
    });

    it("should handle all string commands correctly", () => {
        logo.notation.notationStaging["0"] = [
            "break",
            [["C4"], 4, 0, null, null, -1, false],
            "break",
            "begin articulation",
            [["D4"], 4, 0, null, null, -1, false],
            "end articulation",
            "begin crescendo",
            "end crescendo",
            "begin decrescendo",
            "end decrescendo",
            "begin slur",
            [["E4"], 4, 0, null, null, -1, false],
            "end slur",
            "tie",
            "voice one",
            "voice two",
            "voice three",
            "voice four",
            "one voice",
            "unknown command"
        ];

        processABCNotes(logo, "0");
        const out = logo.notationNotes["0"];

        expect(out).toContain("\n");
        expect(out).toContain("!<(!");
        expect(out).toContain("!<)!");
        expect(out).toContain("!>(!");
        expect(out).toContain("!>)!");
        expect(out).toContain("V:1");
        expect(out).toContain("V:2");
        expect(out).toContain("V:3");
        expect(out).toContain("V:4");
        expect(out).not.toContain("unknown command");
    });

    it("should handle meter command", () => {
        logo.notation.notationStaging["0"] = ["meter", "4", "4"];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("M:4/4");
    });

    it("should handle pickup command", () => {
        logo.notation.notationStaging["0"] = ["pickup", "8"];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).not.toContain("K:");
    });
});

describe("processABCNotes - Chords", () => {
    let logo;
    beforeEach(() => {
        logo = { notationNotes: { 0: "" }, notation: { notationStaging: { 0: [] } } };
    });

    it("should handle chords correctly (Start, Middle, End)", () => {
        const chordID = 123;
        logo.notation.notationStaging["0"] = [
            [["C4"], 4, 0, null, null, chordID, false],
            [["E4"], 4, 0, null, null, chordID, false],
            [["G4"], 4, 0, null, null, chordID, false],
            [["A4"], 4, 0, null, null, 999, false]
        ];

        processABCNotes(logo, "0");
        const out = logo.notationNotes["0"];
        expect(out).toBe("[C E G]4  [A]4  ");
    });

    it("should handle articulation inside chords", () => {
        const chordID = 55;
        logo.notation.notationStaging["0"] = [
            "begin articulation",
            [["C4"], 4, 0, null, null, chordID, false],
            [["E4"], 4, 0, null, null, chordID, false],
            "end articulation"
        ];

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("!accent![C E]4  ");
    });
});

describe("processABCNotes - Tuplet Handling", () => {
    let logo;
    beforeEach(() => {
        logo = { notationNotes: { 0: "" }, notation: { notationStaging: { 0: [] } } };
    });

    it("should process standard tuplets correctly", () => {
        logo.notation.notationStaging["0"] = [
            [["G♯4"], 1, 0, [3, 1], 2, -1, false],
            [["F4"], 1, 0, [3, 1], 2, -1, false],
            [["G♯4"], 1, 0, [3, 1], 2, -1, false]
        ];

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("(3:2^G8F8^G8 ");
    });

    it("should preserve each note in a tuplet", () => {
        logo.notation.notationStaging["0"] = [
            [["G4"], 1, 0, [3, 1], 2, -1, false],
            [["F4"], 1, 0, [3, 1], 2, -1, false],
            [["A4"], 1, 0, [3, 1], 2, -1, false]
        ];

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("(3:2G8F8A8 ");
    });

    it("should handle array of notes (chords) inside tuplets", () => {
        logo.notation.notationStaging["0"] = [[["C4", "E4"], 1, 0, [3, 1], 2, -1, false]];

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("(3:2:1[CE]8 ");
    });

    it("should handle staccato inside tuplets", () => {
        logo.notation.notationStaging["0"] = [[["C4", "E4"], 1, 0, [3, 1], 2, -1, true]];

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain(".");
    });

    it("should handle a partial tuplet followed by a string entry", () => {
        logo.notation.notationStaging["0"] = [
            [["A4"], 1, 0, [3, 1], 2, -1, false],
            [["B4"], 1, 0, [3, 1], 2, -1, false],
            ")"
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("(3:2:2A8B8 ");
    });

    it("should handle incomplete/mixed tuplets logic", () => {
        logo.notation.notationStaging["0"] = [
            [["A4"], 1, 0, [3, 1], 2, -1, false],
            [["B4"], 1, 0, [3, 1], 2, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("(");
    });

    it("should handle tuplet with matching chord IDs (skip logic)", () => {
        logo.notation.notationStaging["0"] = [
            [["A4"], 1, 0, [3, 1], 2, 100, false],
            [["B4"], 1, 0, [3, 1], 2, 100, false],
            [["C4"], 1, 0, [3, 1], 2, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).not.toBe("");
    });
});

describe("processABCNotes - Edge Cases for 100% Coverage", () => {
    let logo;

    beforeEach(() => {
        logo = { notationNotes: { 0: "" }, notation: { notationStaging: { 0: [] } } };
    });

    it("should handle array of notes in NOTATIONNOTE field", () => {
        logo.notation.notationStaging["0"] = [[["C4", "E4"], 4, 0, null, null, -1, false]];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("[CE]4");
    });

    it("should write a string note that follows an array note", () => {
        logo.notation.notationStaging["0"] = [
            [["C4", "E4"], 4, 0, null, null, -1, false],
            ["G4", 4, 0, null, null, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("[CE]4 G4 ");
    });
    it("should handle incomplete tuplets with different tuplet values", () => {
        logo.notation.notationStaging["0"] = [
            [["A4"], 1, 0, [3, 1], 2, -1, false],
            [["B4"], 1, 0, [5, 1], 2, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("(");
    });
    it("should handle closing parenthesis in notation staging", () => {
        logo.notation.notationStaging["0"] = [
            [["C4"], 1, 0, [3, 1], 2, -1, false],
            [["D4"], 1, 0, [3, 1], 2, -1, false],
            [["E4"], 1, 0, [3, 1], 2, -1, false],
            ")"
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).not.toBe("");
    });
    it("should handle chords with multiple notes outside tuplets", () => {
        logo.notation.notationStaging["0"] = [[["C4", "E4", "G4"], 4, 0, null, null, -1, false]];
        processABCNotes(logo, "0");
        const out = logo.notationNotes["0"];
        expect(out).toContain("[");
        expect(out).toContain("]");
    });
    it("should handle dots when closing chords", () => {
        const chordID = 456;
        logo.notation.notationStaging["0"] = [
            [["C4"], 4, 2, null, null, chordID, false],
            [["E4"], 4, 2, null, null, chordID, false],
            [["G4"], 4, 0, null, null, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain(" ");
    });
});
describe("saveAbcOutput", () => {
    let activity;

    beforeEach(() => {
        activity = {
            logo: {
                notationOutput: "",
                notationNotes: { 0: "" },
                notation: {
                    notationStaging: {
                        0: [[["G♯4"], 4, 0, null, null, -1, false]]
                    }
                }
            },
            turtles: {
                ithTurtle: t => ({
                    singer: {
                        keySignature: "C major"
                    }
                })
            }
        };
    });

    it("should generate the correct ABC notation output with key signature replacements", () => {
        activity.turtles.ithTurtle = () => ({
            singer: { keySignature: "B ♭ major" }
        });

        const result = saveAbcOutput(activity);

        expect(result).toContain("K:Bb MAJOR");
        expect(result).toContain("b");
    });
});

describe("processABCNotes - Tuplet Handling", () => {
    it("should process tuplets correctly", () => {
        const logo = {
            notationNotes: { 0: "" },
            notation: {
                notationStaging: {
                    0: [
                        [["G♯4"], 1, 0, [3, 1], 2, -1, false],
                        [["F4"], 1, 0, [3, 1], 2, -1, false],
                        [["G♯4"], 1, 0, [3, 1], 2, -1, false]
                    ]
                }
            }
        };

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("(3:2^G8F8^G8 ");
    });
});

describe("processABCNotes - Octave Conversion", () => {
    let logo;
    beforeEach(() => {
        logo = { notationNotes: { 0: "" }, notation: { notationStaging: { 0: [] } } };
    });

    it("should keep octave 4 notes uppercase", () => {
        logo.notation.notationStaging["0"] = [
            [["C4"], 4, 0, null, null, -1, false],
            [["B4"], 4, 0, null, null, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("C4 B4 ");
    });

    it("should write octave 5 notes in lowercase without octave marks", () => {
        logo.notation.notationStaging["0"] = [
            [["C5"], 4, 0, null, null, -1, false],
            [["B5"], 4, 0, null, null, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("c4 b4 ");
    });

    it("should mark octaves above 5 with apostrophes and lowercase letters", () => {
        logo.notation.notationStaging["0"] = [
            [["C6"], 4, 0, null, null, -1, false],
            [["C7"], 4, 0, null, null, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("c'4 c''4 ");
    });

    it("should mark octaves below 4 with commas and uppercase letters", () => {
        logo.notation.notationStaging["0"] = [
            [["C3"], 4, 0, null, null, -1, false],
            [["C2"], 4, 0, null, null, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("C,4 C,,4 ");
    });
});

describe("OCTAVE_NOTATION_MAP", () => {
    it("should correctly map octaves to ABC notation", () => {
        expect(OCTAVE_NOTATION_MAP[10]).toBe("'''''");
        expect(OCTAVE_NOTATION_MAP[2]).toBe(",,");
        expect(OCTAVE_NOTATION_MAP[1]).toBe(",,,");
        expect(OCTAVE_NOTATION_MAP[0]).toBeUndefined();
    });
});

describe("ACCIDENTAL_MAP", () => {
    test("should correctly map accidentals to ABC notation", () => {
        expect(ACCIDENTAL_MAP["𝄪"]).toBe("^^");
        expect(ACCIDENTAL_MAP["♯"]).toBe("^");
        expect(ACCIDENTAL_MAP["#"]).toBe("^");
        expect(ACCIDENTAL_MAP["♮"]).toBe("=");
        expect(ACCIDENTAL_MAP["♭"]).toBe("_");
        expect(ACCIDENTAL_MAP.b).toBe("_");
        expect(ACCIDENTAL_MAP["𝄫"]).toBe("__");
    });

    test("should return undefined for unmapped accidentals", () => {
        expect(ACCIDENTAL_MAP["x"]).toBeUndefined();
    });
});

describe("processABCNotes - notation markers", () => {
    const abcjs = require("abcjs");

    // Staged entries mirror js/notation.js: notes are
    // [pitches, noteValue, dotCount, tupletValue, roundDown, insideChord, staccato],
    // markers are bare strings followed by their arguments.
    const note = (pitch, noteValue = 4) => [[pitch], noteValue, 0, null, null, -1, false];
    const tupletNote = pitch => [[pitch], 1, 0, [3, 1], 2, -1, false];

    const exportBody = staged => {
        const logo = { notationNotes: { 0: "" }, notation: { notationStaging: { 0: staged } } };
        processABCNotes(logo, "0");
        return logo.notationNotes["0"];
    };

    // Parses the exported body with abcjs, which Music Blocks already depends on, and
    // fails on any parser warning. Returns the parsed notes in order.
    const parseNotes = body => {
        const [tune] = abcjs.parseOnly(`${getABCHeader()}K:C\n${body}\n`);
        const warnings = (tune.warnings || []).map(w => w.replace(/<[^>]*>/g, ""));
        expect(warnings).toEqual([]);
        return tune.lines
            .flatMap(line => (line.staff || []).flatMap(staff => staff.voices.flat()))
            .filter(element => element.el_type === "note");
    };

    const annotationsOf = n => (n.chord || []).map(c => `${c.position}:${c.name}`);
    const decorationsOf = n => n.decoration || [];

    // Every marker notation.js can stage, with the arguments it stages alongside.
    const EVERY_MARKER = [
        ["markup", 261.63],
        ["markdown", "pp"],
        ["voice one"],
        ["voice two"],
        ["voice three"],
        ["voice four"],
        ["one voice"],
        ["key", "C", "major"],
        ["meter", 3, 4],
        ["swing"],
        ["tempo", 90, "4"],
        ["pickup", "8"],
        ["begin articulation"],
        ["end articulation"],
        ["begin crescendo"],
        ["begin decrescendo"],
        ["end crescendo"],
        ["end decrescendo"],
        ["begin slur"],
        ["end slur"],
        ["tie"],
        ["begin harmonics"],
        ["end harmonics"]
    ].flat();

    it("writes every staged marker as valid ABC without losing or adding notes", () => {
        const body = exportBody([
            ...EVERY_MARKER,
            note("C4"),
            ...EVERY_MARKER,
            note("D4"),
            ...EVERY_MARKER
        ]);

        expect(parseNotes(body)).toHaveLength(2);
        // Swing is written as an annotation; outside annotations no marker name may appear.
        const outsideAnnotations = body.replace(/"[^"]*"/g, "");
        for (const word of ["markup", "markdown", "key", "major", "swing", "harmonics", "pickup"]) {
            expect(outsideAnnotations).not.toContain(word);
        }
    });

    it("skips marker strings and stray values it has no ABC for", () => {
        let body;
        expect(() => {
            body = exportBody([note("C4"), "unknown command", 42, note("D4")]);
        }).not.toThrow();

        expect(body).not.toContain("unknown command");
        expect(body).not.toContain("42");
        expect(parseNotes(body)).toHaveLength(2);
    });

    describe("tempo", () => {
        it.each([
            ["4", "1/4"],
            ["8", "1/8"],
            ["2", "1/2"],
            ["4.", "3/8"],
            ["8..", "7/32"],
            ["4 16", "1/4 1/16"]
        ])("writes 90 beats per %s note as an inline [Q:%s=90] field", (beat, fraction) => {
            const body = exportBody([note("C4"), "tempo", 90, beat, note("D4")]);

            expect(body).toContain(`[Q:${fraction}=90]`);
            expect(parseNotes(body)).toHaveLength(2);
        });

        it("skips a tempo whose beat isn't a duration", () => {
            const body = exportBody(["tempo", 90, "not a beat", note("C4")]);

            expect(body).not.toContain("Q:");
            expect(parseNotes(body)).toHaveLength(1);
        });
    });

    it("writes voice changes inline and a meter change on its own line", () => {
        const body = exportBody([
            note("C4"),
            "meter",
            3,
            4,
            note("D4"),
            "voice two",
            note("E4"),
            "one voice",
            note("F4")
        ]);

        expect(body).toContain("\nM:3/4\n");
        expect(body).toContain("[V:2]");
        expect(body).toContain("[V:1]");
        expect(parseNotes(body)).toHaveLength(4);
    });

    it("never writes an empty line, which would end the tune", () => {
        const body = exportBody([
            "meter",
            3,
            4,
            ...Array.from({ length: 8 }, () => note("C4")),
            "meter",
            6,
            8,
            "meter",
            2,
            4,
            ...Array.from({ length: 9 }, () => note("D4")),
            "meter",
            4,
            4
        ]);

        expect(body).not.toMatch(/\n\s*\n/);
        expect(parseNotes(body)).toHaveLength(17);
    });

    it("does not start an empty line for a break at the start or after a meter change", () => {
        const body = exportBody([
            "begin slur",
            "break",
            note("C4"),
            "meter",
            3,
            4,
            "break",
            "break",
            note("D4")
        ]);

        expect(body.startsWith("\n")).toBe(false);
        expect(body).not.toMatch(/\n\s*\n/);
        expect(parseNotes(body)).toHaveLength(2);
    });

    it("parses a meter change right after returning to a voice on a later line", () => {
        // abcjs 6.3.0 throws on this sequence when the meter is written inline as [M:3/4].
        const staged = [
            "voice one",
            note("C4"),
            "voice two",
            ...Array.from({ length: 9 }, () => note("D4")),
            "one voice",
            "meter",
            3,
            4,
            note("F4")
        ];

        let notes;
        expect(() => {
            notes = parseNotes(exportBody(staged));
        }).not.toThrow();
        expect(notes).toHaveLength(11);
    });

    it("writes fields before a crescendo mark still waiting for its note", () => {
        const body = exportBody([
            note("C4"),
            "begin crescendo",
            "voice two",
            "tempo",
            90,
            "4",
            "meter",
            3,
            4,
            note("D4")
        ]);

        expect(body.indexOf("!<(!")).toBeGreaterThan(body.indexOf("M:3/4"));
        expect(body).toContain("!<(!D");
        const notes = parseNotes(body);
        expect(notes).toHaveLength(2);
        expect(notes[1].decoration).toContain("crescendo(");
    });

    it("writes no field for a pickup, since the exporter writes no bar lines", () => {
        const body = exportBody(["pickup", "8", note("C4"), note("D4")]);

        expect(body).not.toMatch(/K:|pickup/);
        expect(parseNotes(body)).toHaveLength(2);
    });

    it("writes no key change, which would re-sharpen or re-flatten the notes after it", () => {
        const body = exportBody([note("C4"), "key", "G", "major", note("F4")]);

        expect(body).not.toContain("K:");
        expect(parseNotes(body).map(n => n.pitches[0].accidental)).toEqual([undefined, undefined]);
    });

    describe("annotations", () => {
        it("puts markup above the note it follows", () => {
            const notes = parseNotes(exportBody([note("C4"), "markup", 261.63, note("D4")]));

            expect(notes.map(annotationsOf)).toEqual([["above:261.63"], []]);
        });

        it("puts markdown below the note it follows", () => {
            const notes = parseNotes(exportBody([note("C4"), "markdown", "dolce", note("D4")]));

            expect(notes.map(annotationsOf)).toEqual([["below:dolce"], []]);
        });

        it("attaches markup to the chord it follows", () => {
            const notes = parseNotes(
                exportBody([
                    [["C4"], 4, 0, null, null, 7, false],
                    [["E4"], 4, 0, null, null, 7, false],
                    "markup",
                    440,
                    note("D4")
                ])
            );

            expect(notes.map(annotationsOf)).toEqual([["above:440"], []]);
        });

        it("attaches markup to the tuplet it follows", () => {
            const notes = parseNotes(
                exportBody([
                    tupletNote("C4"),
                    tupletNote("D4"),
                    tupletNote("E4"),
                    "markup",
                    330,
                    note("F4")
                ])
            );

            expect(notes.map(annotationsOf)).toEqual([["above:330"], [], [], []]);
        });

        it("attaches markup staged before any note to the first note", () => {
            const notes = parseNotes(exportBody(["markup", 440, note("C4")]));

            expect(notes.map(annotationsOf)).toEqual([["above:440"]]);
        });

        it("writes swing above the note after it", () => {
            const notes = parseNotes(exportBody([note("C4"), "swing", note("D4")]));

            expect(notes.map(annotationsOf)).toEqual([[], ["above:swing"]]);
        });

        it("keeps annotation text intact and parseable", () => {
            // abcjs has no escape for "%" (it always starts a comment) and treats "\"
            // before the closing quote as escaping it, so those two are written as
            // their fullwidth forms.
            const notes = parseNotes(
                exportBody([note("C4"), "markdown", 'say "hi" 50% a\\b\nc\\', note("D4")])
            );

            expect(notes.map(annotationsOf)).toEqual([['below:say "hi" 50％ a＼b c＼'], []]);
        });
    });

    describe("decorations", () => {
        it("accents every note inside a relative-volume block, including nested ones", () => {
            const notes = parseNotes(
                exportBody([
                    "begin articulation",
                    note("C4"),
                    "begin articulation",
                    note("D4"),
                    "end articulation",
                    note("E4"),
                    "end articulation",
                    note("F4")
                ])
            );

            expect(notes.map(n => decorationsOf(n).includes("accent"))).toEqual([
                true,
                true,
                true,
                false
            ]);
        });

        it("marks notes, chords and tuplet notes inside a harmonic block as harmonics", () => {
            const notes = parseNotes(
                exportBody([
                    note("C4"),
                    "begin harmonics",
                    note("D4"),
                    [["E4"], 4, 0, null, null, 9, false],
                    [["G4"], 4, 0, null, null, 9, false],
                    tupletNote("A4"),
                    tupletNote("B4"),
                    tupletNote("C5"),
                    "end harmonics",
                    note("D5")
                ])
            );

            expect(notes.map(n => decorationsOf(n).includes("open"))).toEqual([
                false,
                true,
                true,
                true,
                true,
                true,
                false
            ]);
        });

        it("keeps staccato alongside a decoration", () => {
            const notes = parseNotes(
                exportBody(["begin articulation", [["C4"], 4, 0, null, null, -1, true]])
            );

            expect(decorationsOf(notes[0]).sort()).toEqual(["accent", "staccato"]);
        });
    });
});
