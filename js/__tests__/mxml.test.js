/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

const saveMxmlOutput = require("../mxml");

describe("saveMxmlOutput", () => {
    it("should return a valid XML string for a basic input", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [[["C"], 4, 0]],
                    1: []
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<?xml version='1.0' encoding='UTF-8'?>");
        expect(output).toContain('<score-partwise version="3.1">');
        expect(output).toContain("<part-list>");
        expect(output).toContain('<score-part id="P1">');
        expect(output).toContain('<part id="P1">');
    });

    it("should handle multiple voices", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [
                        [["C"], 4, 0],
                        [["D"], 4, 0]
                    ],
                    1: [
                        [["E"], 4, 0],
                        [["F"], 4, 0]
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<score-part id="P1">');
        expect(output).toContain('<score-part id="P2">');
        expect(output).toContain('<part id="P1">');
        expect(output).toContain('<part id="P2">');
        expect(output).toContain("<step>C</step>");
        expect(output).toContain("<step>E</step>");
    });

    it("should ignore specified elements", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: ["voice one", [["C"], 4, 0], "voice two"]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).not.toContain("voice one");
        expect(output).not.toContain("voice two");
        expect(output).toContain("<step>C</step>");
    });

    it("should handle tempo changes", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: ["tempo", 120, 4, [["C"], 4, 0]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<sound tempo="120"/>');
        expect(output).toContain("<step>C</step>");
    });

    it("should handle meter changes", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: ["meter", 3, 4, [["C"], 4, 0]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<time>");
        expect(output).toContain("<beat-type>4</beat-type>");
        expect(output).toContain("<step>C</step>");
    });

    it("should handle crescendo and decrescendo markings", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [
                        "begin crescendo",
                        [["C"], 4, 0],
                        "end crescendo",
                        "begin decrescendo",
                        [["D"], 4, 0],
                        "end decrescendo"
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<wedge type="crescendo"/>');
        expect(output).toContain('<wedge type="diminuendo"/>');
        expect(output).toContain('<wedge type="stop"/>');
        expect(output).toContain("<step>C</step>");
        expect(output).toContain("<step>D</step>");
    });

    it("should handle tied notes", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [[["C"], 4, 0], "tie", [["C"], 4, 0]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<tie type="start"/>');
        expect(output).toContain('<tie type="stop"/>');
    });

    it("should normalize part numbers when first active voice is not voice 0", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [],
                    1: [],
                    2: [[["C"], 4, 0]],
                    4: [[["E"], 4, 0]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<score-part id="P1">');
        expect(output).toContain("<part-name> Voice #1 </part-name>");
        expect(output).toContain('<part id="P1">');
        expect(output).toContain('<score-part id="P2">');
        expect(output).toContain("<part-name> Voice #2 </part-name>");
        expect(output).toContain('<part id="P2">');
        expect(output).not.toContain('id="P0"');
        expect(output).not.toContain('id="P3"');
    });

    it("should handle 10 or more voices without digit truncation bugs", () => {
        const staging = {};
        for (let i = 0; i < 12; i++) {
            staging[i] = [[["C"], 4, 0]];
        }
        const logo = {
            notation: {
                notationStaging: staging
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<score-part id="P1">');
        expect(output).toContain('<score-part id="P10">');
        expect(output).toContain("<part-name> Voice #10 </part-name>");
        expect(output).toContain('<part id="P10">');
        expect(output).toContain('<score-part id="P11">');
        expect(output).toContain("<part-name> Voice #11 </part-name>");
        expect(output).toContain('<part id="P11">');
        expect(output).toContain('<score-part id="P12">');
        expect(output).toContain("<part-name> Voice #12 </part-name>");
        expect(output).toContain('<part id="P12">');
        // Ensure no corruptions like P100 or P00
        expect(output).not.toContain('id="P0');
        expect(output).not.toContain("Voice #0");
    });

    it("should handle empty notation staging gracefully", () => {
        const logo = {
            notation: {
                notationStaging: {}
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<?xml version='1.0' encoding='UTF-8'?>");
        expect(output).toContain('<score-partwise version="3.1">');
        expect(output).toContain("<part-list>");
        expect(output).toContain("</part-list>");
        expect(output).toContain("</score-partwise>");
    });

    it("should handle rests, chords, accidentals, dotted notes, and staccato", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [
                        // Rest note
                        [["R4"], 4, 0],
                        // Sharp and Flat accidentals in a chord with dot and staccato
                        [["C\u266F4", "D\u266d4"], 4, 1, null, null, null, true]
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<rest/>");
        expect(output).toContain("<chord/>");
        expect(output).toContain("<alter>1</alter>");
        expect(output).toContain("<alter>-1</alter>");
        expect(output).toContain('<staccato placement="below"/>');
        expect(output).toContain("<duration>12</duration>"); // 8 + 4 for dotted quarter
    });

    it("should handle slurs and key signature tokens", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [
                        "key",
                        "C",
                        "major",
                        "begin slur",
                        [["C4"], 4, 0],
                        [["D4"], 4, 0],
                        "end slur"
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<slur type="start"/>');
        expect(output).toContain('<slur type="stop"/>');
    });

    it("should handle measure overflow, barline, meter change across measures, and mid-measure tempo", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [
                        // Measure 1 notes filling 32 divisions
                        [["C4"], 1, 0], // dur = 32
                        // Measure 2 note without meter change
                        [["D4"], 1, 0], // dur = 32
                        // Meter change for measure 3
                        "meter",
                        3,
                        4,
                        // Measure 3 note with tempo change inside measure
                        [["E4"], 4, 0], // dur = 8
                        "tempo",
                        140,
                        4,
                        [["F4"], 4, 0]
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<measure number="1">');
        expect(output).toContain('<measure number="2">');
        expect(output).toContain('<measure number="3">');
        expect(output).toContain("<barline>");
        expect(output).toContain("<bar-style>light-heavy</bar-style>");
        expect(output).toContain('<sound tempo="140"/>');
        expect(output).toContain("<beats>3</beats>");
    });
});
