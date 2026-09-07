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

    it("should compute duration correctly for a single-dotted note (base * 1.5)", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [[["C4"], 4, 1]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        // Quarter note (32 / 4 = 8 divisions) with one dot: 8 * 1.5 = 12.
        expect(output).toContain("<duration>12</duration>");
        expect(output).toContain("<step>C</step>");
        expect(output).toContain("<octave>4</octave>");
    });

    it("should compute duration correctly for a double-dotted note (base * 1.75, not base * 2.25)", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [[["C4"], 4, 2]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        // Quarter note (32 / 4 = 8 divisions) with two dots: 8 * 1.75 = 14.
        // A naive loop that multiplies by 1.5 per dot instead yields 8 * 2.25 = 18.
        expect(output).toContain("<duration>14</duration>");
        expect(output).not.toContain("<duration>18</duration>");
    });

    it("should account for double-dotted duration when deciding measure breaks", () => {
        // Two double-dotted quarter notes at 14 divisions each total 28, which
        // fits in one 32-division measure. With the old, inflated duration (18
        // each, 36 total), the second note would overflow the measure and force
        // a premature break into a second measure.
        const logo = {
            notation: {
                notationStaging: {
                    0: [
                        [["C4"], 4, 2],
                        [["D4"], 4, 2]
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);
        const measureCount = (output.match(/<measure /g) || []).length;

        expect(measureCount).toBe(1);
    });

    it("should compute a real fractional duration for a tuplet note instead of a full measure", () => {
        // durationToNoteValue()'s tuplet fallback for an eighth-note triplet (3 in the
        // space of 2 eighths) returns [1, 0, [3, 4], 8], which notation.js stores as
        // this staging entry. Before the fix, mxml.js read the sentinel noteValue (1)
        // and dotCount (0) as if they were real, giving 32 / 1 = 32 divisions -- a
        // whole 4/4 measure for a single triplet eighth note.
        const logo = {
            notation: {
                notationStaging: {
                    0: [[["C4"], 1, 0, [3, 4], 8]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).not.toContain("<duration>32</duration>");
        // 32 / 8 (nearest power-of-two note value) * 2/3 (normal/actual notes) = 2.667,
        // rounded to the nearest whole division for the required-integer <duration>.
        expect(output).toContain("<duration>3</duration>");
        expect(output).toContain("<step>C</step>");
        expect(output).toContain("<octave>4</octave>");
    });

    it("should emit time-modification with the reduced actual/normal notes ratio for a tuplet note", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [[["C4"], 1, 0, [3, 4], 8]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<time-modification>");
        expect(output).toContain("<actual-notes>3</actual-notes>");
        expect(output).toContain("<normal-notes>2</normal-notes>");
    });

    it("should not emit time-modification for a plain, non-tuplet note", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [[["C4"], 4, 0]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).not.toContain("<time-modification>");
    });

    it("should keep measure-break accounting exact across a full run of tuplet notes", () => {
        // Three eighth-note triplets (3-in-the-space-of-2) followed by six plain eighth
        // notes together total exactly 8 eighth notes -- one full 4/4 measure. Rounding
        // each triplet note's <duration> to 3 (instead of the exact 2.667) would drift
        // the running total by a whole division per triplet if measure-break accounting
        // used the rounded value, forcing a spurious extra measure for the last note.
        const tripletEighth = [["C4"], 1, 0, [3, 4], 8];
        const plainEighth = [["D4"], 8, 0];
        const logo = {
            notation: {
                notationStaging: {
                    0: [
                        tripletEighth,
                        tripletEighth,
                        tripletEighth,
                        plainEighth,
                        plainEighth,
                        plainEighth,
                        plainEighth,
                        plainEighth,
                        plainEighth
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);
        const measureCount = (output.match(/<measure /g) || []).length;

        expect(measureCount).toBe(1);
    });
});
