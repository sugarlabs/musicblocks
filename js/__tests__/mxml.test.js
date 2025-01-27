const saveMxmlOutput = require("../mxml");

describe("saveMxmlOutput", () => {
    it("should return a valid XML string for a basic input", () => {
        const logo = {
            notation: {
                notationStaging: {
                    "0": [
                        [["C"], 4, 0], 
                    ],
                    "1": []
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<?xml version='1.0' encoding='UTF-8'?>");
        expect(output).toContain("<score-partwise version=\"3.1\">");
        expect(output).toContain("<part-list>");
        expect(output).toContain("<score-part id=\"P1\">");
        expect(output).toContain("<part id=\"P1\">");
    });

    it("should handle multiple voices", () => {
        const logo = {
            notation: {
                notationStaging: {
                    "0": [
                        [["C"], 4, 0],
                        [["D"], 4, 0]
                    ],
                    "1": [
                        [["E"], 4, 0],
                        [["F"], 4, 0]
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<score-part id=\"P1\">");
        expect(output).toContain("<score-part id=\"P2\">");
        expect(output).toContain("<part id=\"P1\">");
        expect(output).toContain("<part id=\"P2\">");
        expect(output).toContain("<step>C</step>");
        expect(output).toContain("<step>E</step>");
    });

    it("should ignore specified elements", () => {
        const logo = {
            notation: {
                notationStaging: {
                    "0": [
                        "voice one", 
                        [["C"], 4, 0],
                        "voice two"
                    ]
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
                    "0": [
                        "tempo", 120, 4, 
                        [["C"], 4, 0]
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<sound tempo=\"120\"/>");
        expect(output).toContain("<step>C</step>");
    });

    it("should handle meter changes", () => {
        const logo = {
            notation: {
                notationStaging: {
                    "0": [
                        "meter", 3, 4,
                        [["C"], 4, 0]
                    ]
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
                    "0": [
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
                    "0": [
                        [["C"], 4, 0],
                        "tie",
                        [["C"], 4, 0]
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<tie type="start"/>');
        expect(output).toContain('<tie type="stop"/>');
    });
});
