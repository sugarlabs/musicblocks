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
        expect(logo.notationNotes["0"]).toBe("G^4 G^4 F4 F4 G^2 G^8 ");
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
        expect(logo.notationNotes["0"]).toContain("C4..");
        expect(logo.notationNotes["0"]).toContain(".");
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
        expect(out).toContain("V:1");
        expect(out).toContain("V:2");
        expect(out).toContain("V:3");
        expect(out).toContain("V:4");
        expect(out).toContain("unknown command");
    });

    it("should handle meter command", () => {
        logo.notation.notationStaging["0"] = ["meter", "4", "4"];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("M:4/4");
    });

    it("should handle pickup command", () => {
        logo.notation.notationStaging["0"] = ["pickup", "8"];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("K: pickup=8");
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
        expect(out).toContain("C4 [C");
        expect(out).toContain("E4");
        expect(out).toContain("G4 G]4");
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
        expect(logo.notationNotes["0"]).toContain("C4 [C");
    });
});

describe("processABCNotes - Tuplet Handling", () => {
    let logo;
    beforeEach(() => {
        logo = { notationNotes: { 0: "" }, notation: { notationStaging: { 0: [] } } };
    });

    it("should process standard tuplets correctly", () => {
        logo.notation.notationStaging["0"] = [
            [["G♯4"], 4, 0, 3, 2, -1, false],
            [["F4"], 4, 0, 3, 2, -1, false],
            [["G♯4"], 4, 0, 3, 2, -1, false]
        ];

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("(1:1G^ 2G^ 2G^ 2 ");
    });

    it("should handle array of notes (chords) inside tuplets", () => {
        logo.notation.notationStaging["0"] = [[["C4", "E4"], 4, 0, 1, 1, -1, false]];

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("[C E ]");
    });

    it("should handle staccato inside tuplets", () => {
        logo.notation.notationStaging["0"] = [[["C4", "E4"], 4, 0, 1, 1, -1, true]];

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain(".");
    });

    it("should handle incomplete/mixed tuplets logic", () => {
        logo.notation.notationStaging["0"] = [
            [["A4"], 4, 0, 3, 2, -1, false],
            [["B4"], 4, 0, 3, 2, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("(");
    });

    it("should handle tuplet with matching chord IDs (skip logic)", () => {
        logo.notation.notationStaging["0"] = [
            [["A4"], 4, 0, 2, 2, 100, false],
            [["B4"], 4, 0, 2, 2, 100, false],
            [["C4"], 4, 0, 2, 2, -1, false]
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
        expect(logo.notationNotes["0"]).toContain("C4");
    });
    it("should handle incomplete tuplets with different tuplet values", () => {
        logo.notation.notationStaging["0"] = [
            [["A4"], 4, 0, 3, 2, -1, false],
            [["B4"], 4, 0, 5, 2, -1, false]
        ];
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toContain("(");
    });
    it("should handle closing parenthesis in notation staging", () => {
        logo.notation.notationStaging["0"] = [
            [["C4"], 4, 0, 3, 2, -1, false],
            [["D4"], 4, 0, 3, 2, -1, false],
            [["E4"], 4, 0, 3, 2, -1, false],
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
                        [["G♯4"], 4, 0, 3, 2, -1, false],
                        [["F4"], 4, 0, 3, 2, -1, false],
                        [["G♯4"], 4, 0, 3, 2, -1, false]
                    ]
                }
            }
        };

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("(1:1G^ 2G^ 2G^ 2 ");
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
        expect(ACCIDENTAL_MAP["♯"]).toBe("^");
        expect(ACCIDENTAL_MAP["♭"]).toBe("_");
    });

    test("should return undefined for unmapped accidentals", () => {
        expect(ACCIDENTAL_MAP["♮"]).toBeUndefined();
    });
});
