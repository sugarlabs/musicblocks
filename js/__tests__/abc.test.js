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

global.frequencyToPitch = jest.fn((freq) => ["G♯", "4"]);
global.toFraction = jest.fn((num) => [1, 1]);

const { getABCHeader, processABCNotes, saveAbcOutput, ACCIDENTAL_MAP, OCTAVE_NOTATION_MAP } = require("../abc");

describe("getABCHeader", () => {
    it("should return the correct ABC header", () => {
        const expectedHeader = "X:1\nT:Music Blocks composition\nC:Mr. Mouse\nL:1/16\nM:C\n";
        expect(getABCHeader()).toBe(expectedHeader);
    });
});

describe("processABCNotes", () => {
    let logo;

    beforeEach(() => {
        logo = {
            notationNotes: { "0": "" },
            notation: {
                notationStaging: {
                    "0": [
                        [["G♯4"], 4, 0, null, null, -1, false],
                        [["F4"], 4, 0, null, null, -1, false],
                        [["G♯4"], 2, 0, null, null, -1, false],
                    ],
                },
            },
        };
    });

    it("should process notes and update notationNotes correctly", () => {
        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("G^4 G^4 F4 F4 G^2 G^8 ");
    });
});

describe("saveAbcOutput", () => {
    let activity;

    beforeEach(() => {
        activity = {
            logo: {
                notationOutput: "",
                notationNotes: { "0": "" },
                notation: {
                    notationStaging: {
                        "0": [
                            [["G♯4"], 4, 0, null, null, -1, false],
                            [["F4"], 4, 0, null, null, -1, false],
                            [["G♯4"], 2, 0, null, null, -1, false],
                        ],
                    },
                },
            },
            turtles: {
                ithTurtle: (t) => ({
                    singer: {
                        keySignature: "C major",
                    },
                }),
            },
        };
    });

    it("should generate the correct ABC notation output", () => {
        const expectedOutput ="X:1\n"+
                               "T:Music Blocks composition\n"+
                               "C:Mr. Mouse\n"+
                               "L:1/16\n"+
                               "M:C\n"+
                               "K:CMAJOR\n"+
                               "G^4 G^4 F4 F4 G^2 G^8 \n";

        const result = saveAbcOutput(activity);
        expect(result).toBe(expectedOutput);
    });
});

describe("processABCNotes - Tuplet Handling", () => {
    it("should process tuplets correctly", () => {
        const logo = {
            notationNotes: { "0": "" },
            notation: {
                notationStaging: {
                    "0": [
                        [["G♯4"], 4, 0, 3, 2, -1, false], // Tuplet
                        [["F4"], 4, 0, 3, 2, -1, false],   // Tuplet
                        [["G♯4"], 4, 0, 3, 2, -1, false],  // Tuplet
                    ],
                },
            },
        };

        processABCNotes(logo, "0");
        expect(logo.notationNotes["0"]).toBe("(1:1G^ 2G^ 2G^ 2  ");
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