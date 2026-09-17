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

    it("should express a quarter note using divisions per quarter note", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: [[["C4"], 4, 0]]
                }
            }
        };

        const output = saveMxmlOutput(logo);
        const divisions = Number(output.match(/<divisions>(\d+)<\/divisions>/)[1]);
        const duration = Number(output.match(/<duration>(\d+)<\/duration>/)[1]);

        expect(duration / divisions).toBe(1);
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
        const quarterNote = [["C4"], 4, 0];
        const logo = {
            notation: {
                notationStaging: {
                    0: [
                        quarterNote,
                        quarterNote,
                        quarterNote,
                        quarterNote,
                        "meter",
                        3,
                        4,
                        quarterNote
                    ]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<beats>3</beats>");
        expect(output).toContain("<beat-type>4</beat-type>");
        expect(output.match(/<divisions>8<\/divisions>/g)).toHaveLength(2);
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

    it("should compute an exact duration for a tuplet note instead of a full measure", () => {
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
        // The internal divisions-per-whole-note resolution scales to 96, which MusicXML
        // represents as 24 divisions per quarter note. The exact duration remains 8.
        expect(output).toContain("<divisions>24</divisions>");
        expect(output).toContain("<duration>8</duration>");
        expect(output).toContain("<step>C</step>");
        expect(output).toContain("<octave>4</octave>");
    });

    it("should still fall back to rounding when a tuplet ratio can't be represented exactly", () => {
        // A tuplet whose actualNotes/roundDown combination can't reduce to a whole
        // division count even at the scaled resolution still gets a sane, rounded
        // <duration> rather than a fractional or wildly incorrect one. This only
        // matters for note values finer than this file otherwise supports (roundDown
        // above 32), which is already a pre-existing limitation of the plain,
        // non-tuplet path (e.g. a dotted 128th note isn't exact either).
        const logo = {
            notation: {
                notationStaging: {
                    0: [[["C4"], 1, 0, [3, 128], 128]]
                }
            }
        };

        const output = saveMxmlOutput(logo);
        const duration = Number(output.match(/<duration>(\d+)<\/duration>/)[1]);

        expect(Number.isInteger(duration)).toBe(true);
        expect(duration).toBeGreaterThan(0);
    });

    it("should scale divisions to satisfy every distinct tuplet ratio in a voice", () => {
        // A note reducing to a 3:2 tuplet and one reducing to a 5:2 tuplet in the same
        // voice both need to divide the voice's divisions-per-whole-note evenly;
        // scaling by their LCM (15) rather than just one of them keeps both exact.
        const tripletEighth = [["C4"], 1, 0, [3, 4], 8];
        const quintupletEighth = [["D4"], 1, 0, [5, 4], 8];
        const logo = {
            notation: {
                notationStaging: {
                    0: [tripletEighth, quintupletEighth]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<divisions>120</divisions>");
        // Triplet (3:2): (480 / 8) * (2 / 3) = 40. "Quintuplet" (5:2): (480 / 8) * (2 / 5) = 24.
        expect(output).toContain("<duration>40</duration>");
        expect(output).toContain("<duration>24</duration>");
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

    it("should handle empty notation staging gracefully by emitting a valid empty part", () => {
        const logo = {
            notation: {
                notationStaging: {}
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain("<?xml version='1.0' encoding='UTF-8'?>");
        expect(output).toContain('<score-partwise version="3.1">');
        expect(output).toContain("<part-list>");
        expect(output).toContain('<score-part id="P1">');
        expect(output).toContain("<part-name> Voice #1 </part-name>");
        expect(output).toContain("</part-list>");
        expect(output).toContain('<part id="P1">');
        expect(output).toContain('<measure number="1">');
        expect(output).toContain("<divisions>8</divisions>");
        expect(output).toContain("<barline>");
        expect(output).toContain("</measure>");
        expect(output).toContain("</part>");
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

    it("should ignore voices that contain only control tokens and no note entries", () => {
        const logo = {
            notation: {
                notationStaging: {
                    0: ["voice one", "tempo", 120, 4, "key", "C", "major"],
                    1: [[["C4"], 4, 0]]
                }
            }
        };

        const output = saveMxmlOutput(logo);

        expect(output).toContain('<score-part id="P1">');
        expect(output).toContain("<part-name> Voice #1 </part-name>");
        expect(output).toContain('<part id="P1">');
        expect(output).not.toContain('<score-part id="P2">');
        expect(output).not.toContain('<part id="P2">');
    });
});

describe("saveMxmlOutput notation markers", () => {
    // Staged entries mirror what js/notation.js pushes: notes are
    // [pitches, noteValue, dotCount, tupletValue, roundDown, insideChord, staccato],
    // and markers are bare strings followed by their arguments.
    const note = (pitch, noteValue = 4) => [[pitch], noteValue, 0, null, null, false, false];

    const exportVoices = staging => saveMxmlOutput({ notation: { notationStaging: staging } });
    const exportVoice = staged => exportVoices({ 0: staged });

    const parseScore = xml => {
        const doc = new DOMParser().parseFromString(xml, "application/xml");
        expect(doc.getElementsByTagName("parsererror")).toHaveLength(0);
        return doc;
    };

    const measuresOf = doc => Array.from(doc.getElementsByTagName("measure"));
    const notesOf = el => Array.from(el.getElementsByTagName("note"));
    const stepsOf = el => Array.from(el.getElementsByTagName("step")).map(s => s.textContent);

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
        ["meter", 4, 4],
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

    it("never renders a staged marker as a note", () => {
        const xml = exportVoice([
            ...EVERY_MARKER,
            note("C4"),
            ...EVERY_MARKER,
            note("D4"),
            ...EVERY_MARKER
        ]);
        const doc = parseScore(xml);

        expect(stepsOf(doc)).toEqual(["C", "D"]);
        expect(xml).not.toContain("NaN");
    });

    describe("pickup", () => {
        it("writes a pickup as a short, implicit first measure", () => {
            const doc = parseScore(
                exportVoice([
                    "meter",
                    3,
                    4,
                    "pickup",
                    "4",
                    note("G4"),
                    note("C4"),
                    note("D4"),
                    note("E4"),
                    note("F4")
                ])
            );
            const [pickup, first, second] = measuresOf(doc);

            expect(pickup.getAttribute("number")).toBe("0");
            expect(pickup.getAttribute("implicit")).toBe("yes");
            expect(stepsOf(pickup)).toEqual(["G"]);
            expect(pickup.getElementsByTagName("beats")[0].textContent).toBe("3");

            expect(first.getAttribute("number")).toBe("1");
            expect(first.hasAttribute("implicit")).toBe(false);
            expect(stepsOf(first)).toEqual(["C", "D", "E"]);

            expect(second.getAttribute("number")).toBe("2");
            expect(stepsOf(second)).toEqual(["F"]);
        });

        // Every duration convertFactor() (js/utils/musicutils.js) can return that is
        // shorter than a 4/4 measure, paired with its length in whole notes.
        const PICKUPS = [
            ["16", 1 / 16],
            ["8", 1 / 8],
            ["16.", 3 / 32],
            ["8.", 3 / 16],
            ["8..", 7 / 32],
            ["4", 1 / 4],
            ["4 16", 5 / 16],
            ["4.", 3 / 8],
            ["4..", 7 / 16],
            ["2", 1 / 2],
            ["2 16", 9 / 16],
            ["2 8", 5 / 8],
            ["2 8 16", 11 / 16],
            ["2.", 3 / 4],
            ["2 4 16", 13 / 16],
            ["2..", 7 / 8],
            ["2 4 8 16", 15 / 16]
        ];

        it.each(PICKUPS)("sizes a %s pickup to exactly its length", (duration, wholeNotes) => {
            // Thirty-second notes are one division each, so the pickup measure should
            // hold exactly one note per division of the pickup.
            const thirtySeconds = Array.from({ length: 64 }, () => note("C4", 32));
            const doc = parseScore(exportVoice(["pickup", duration, ...thirtySeconds]));
            const [pickup, first] = measuresOf(doc);

            expect(pickup.getAttribute("implicit")).toBe("yes");
            expect(notesOf(pickup)).toHaveLength(wholeNotes * 32);
            expect(notesOf(first)).toHaveLength(32);
        });

        it("treats a pickup of a full measure as an ordinary first measure", () => {
            const doc = parseScore(
                exportVoice(["pickup", "1", note("C4"), note("D4"), note("E4"), note("F4")])
            );
            const [first] = measuresOf(doc);

            expect(first.getAttribute("number")).toBe("1");
            expect(first.hasAttribute("implicit")).toBe(false);
            expect(stepsOf(first)).toEqual(["C", "D", "E", "F"]);
        });

        it("ignores a pickup staged after the first note", () => {
            const doc = parseScore(exportVoice([note("C4"), "pickup", "4", note("D4")]));
            const [first] = measuresOf(doc);

            expect(measuresOf(doc)).toHaveLength(1);
            expect(first.hasAttribute("implicit")).toBe(false);
            expect(stepsOf(first)).toEqual(["C", "D"]);
        });
    });

    it("applies a meter staged before the first note to the first measure", () => {
        const doc = parseScore(
            exportVoice(["meter", 3, 4, note("C4"), note("D4"), note("E4"), note("F4")])
        );
        const [first, second] = measuresOf(doc);

        expect(first.getElementsByTagName("beats")[0].textContent).toBe("3");
        expect(stepsOf(first)).toEqual(["C", "D", "E"]);
        expect(stepsOf(second)).toEqual(["F"]);
    });

    it.each([
        ["4", 120],
        ["8", 60],
        ["2", 240],
        ["4.", 180],
        ["8.", 90],
        ["4 16", 150]
    ])("converts 120 beats per %s note to %i quarter notes per minute", (beat, quarterBpm) => {
        const doc = parseScore(exportVoice(["tempo", 120, beat, note("C4")]));
        const sounds = Array.from(doc.getElementsByTagName("sound"));

        expect(sounds.map(s => s.getAttribute("tempo"))).toEqual([String(quarterBpm)]);
        expect(sounds[0].parentNode.tagName).toBe("measure");
    });

    it.each([
        [90, "8.", "67.5"],
        [90, "16", "22.5"],
        [75, "8", "37.5"]
    ])("keeps a fractional tempo: %i beats per %s note is %s per minute", (bpm, beat, tempo) => {
        const doc = parseScore(exportVoice(["tempo", bpm, beat, note("C4")]));

        expect(doc.getElementsByTagName("sound")[0].getAttribute("tempo")).toBe(tempo);
    });

    describe("direction placement", () => {
        const childTags = measure => Array.from(measure.children).map(c => c.tagName);

        it("keeps a direction staged before the first note inside the first measure", () => {
            const doc = parseScore(
                exportVoice(["begin crescendo", note("C4"), note("D4"), "end crescendo"])
            );
            const [measure] = measuresOf(doc);
            const tags = childTags(measure);

            expect(doc.getElementsByTagName("part")[0].children[0].tagName).toBe("measure");
            expect(tags.indexOf("direction")).toBeLessThan(tags.indexOf("note"));
        });

        it("writes a direction staged after the last note into the final measure", () => {
            const doc = parseScore(exportVoice([note("C4"), note("D4"), "end crescendo"]));
            const [measure] = measuresOf(doc);
            const tags = childTags(measure);

            expect(tags.lastIndexOf("direction")).toBeGreaterThan(tags.lastIndexOf("note"));
            expect(tags.lastIndexOf("direction")).toBeLessThan(tags.indexOf("barline"));
        });

        it("attaches a direction to the note it precedes when that note opens a measure", () => {
            const doc = parseScore(
                exportVoice([
                    note("C4"),
                    note("D4"),
                    note("E4"),
                    note("F4"),
                    "begin crescendo",
                    note("G4")
                ])
            );
            const [first, second] = measuresOf(doc);

            expect(childTags(first)).not.toContain("direction");
            expect(childTags(second).slice(-3, -1)).toEqual(["direction", "note"]);
        });
    });

    it("accents every note inside a relative-volume block, including nested ones", () => {
        const doc = parseScore(
            exportVoice([
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
        const accented = notesOf(doc).map(n => n.getElementsByTagName("accent").length === 1);

        expect(accented).toEqual([true, true, true, false]);
    });

    it("marks only the notes inside a harmonic block as harmonics", () => {
        const doc = parseScore(
            exportVoice([note("C4"), "begin harmonics", note("D4"), "end harmonics", note("E4")])
        );
        const harmonics = notesOf(doc).map(n => {
            const technical = n.getElementsByTagName("technical");
            return technical.length === 1 && technical[0].children[0].tagName === "harmonic";
        });

        expect(harmonics).toEqual([false, true, false]);
    });

    it("writes markup above and print text below the note they follow", () => {
        // Notation.doUpdateNotation stages a note's markup right after that note.
        const doc = parseScore(
            exportVoice([note("C4"), "markup", 261.63, note("D4"), "markdown", "pp", note("E4")])
        );
        const words = Array.from(doc.getElementsByTagName("words")).map(w => {
            const direction = w.parentNode.parentNode;
            return [
                w.textContent,
                direction.getAttribute("placement"),
                stepsOf(direction.nextElementSibling)[0]
            ];
        });

        expect(words).toEqual([
            ["261.63", "above", "C"],
            ["pp", "below", "D"]
        ]);
        expect(stepsOf(doc)).toEqual(["C", "D", "E"]);
    });

    it("keeps markup with its note when that note ends a measure", () => {
        const doc = parseScore(
            exportVoice([note("C4"), note("D4"), note("E4"), note("F4"), "markup", 440, note("G4")])
        );
        const [first, second] = measuresOf(doc);
        const direction = first.getElementsByTagName("direction")[0];

        expect(stepsOf(direction.nextElementSibling)).toEqual(["F"]);
        expect(second.getElementsByTagName("direction")).toHaveLength(0);
    });

    it("keeps markup that follows a drum-only note, which has no pitches to write", () => {
        const drumOnly = [[], 4, 0, null, null, false, false];
        const doc = parseScore(exportVoice([drumOnly, "markup", 440, note("C4")]));
        const words = doc.getElementsByTagName("words");

        expect(words).toHaveLength(1);
        expect(words[0].textContent).toBe("440");
        expect(stepsOf(words[0].parentNode.parentNode.nextElementSibling)).toEqual(["C"]);
    });

    describe("ties and slurs between notes", () => {
        const marksOf = n =>
            ["tie", "slur"].flatMap(tag =>
                Array.from(n.getElementsByTagName(tag)).map(
                    el => `${tag} ${el.getAttribute("type")}`
                )
            );

        it.each([
            ["tie", "end slur"],
            ["end slur", "tie"]
        ])("starts a tie and ends a slur on one note when staged as %s, %s", (first, second) => {
            const doc = parseScore(
                exportVoice(["begin slur", note("C4"), first, second, note("C4")])
            );
            const [tied, continuation] = notesOf(doc);

            expect(marksOf(tied).sort()).toEqual(["slur start", "slur stop", "tie start"]);
            expect(marksOf(continuation)).toEqual(["tie stop"]);
        });

        it("keeps a tie when a direction is staged between the tied notes", () => {
            const doc = parseScore(
                exportVoice([note("C4"), "tie", "begin crescendo", note("C4"), "end crescendo"])
            );

            expect(notesOf(doc).map(marksOf)).toEqual([["tie start"], ["tie stop"]]);
        });

        it("both stops and starts a tie on the middle of three tied notes", () => {
            // A note split across two barlines is staged as three tied notes.
            const doc = parseScore(exportVoice([note("C4"), "tie", note("C4"), "tie", note("C4")]));

            expect(notesOf(doc).map(marksOf)).toEqual([
                ["tie start"],
                ["tie stop", "tie start"],
                ["tie stop"]
            ]);
        });

        it("draws each tie with <tied> in <notations> as well as sounding it with <tie>", () => {
            // <tie> only affects playback; notation programs draw the tie from <tied>.
            const doc = parseScore(exportVoice([note("C4"), "tie", note("C4"), "tie", note("C4")]));
            const typesOf = (n, tag) =>
                Array.from(n.getElementsByTagName(tag)).map(el => el.getAttribute("type"));

            expect(notesOf(doc).map(n => typesOf(n, "tie"))).toEqual([
                ["start"],
                ["stop", "start"],
                ["stop"]
            ]);
            expect(notesOf(doc).map(n => typesOf(n, "tied"))).toEqual([
                ["start"],
                ["stop", "start"],
                ["stop"]
            ]);
            for (const tied of doc.getElementsByTagName("tied")) {
                expect(tied.parentNode.tagName).toBe("notations");
            }
        });

        it("writes no <tied> for notes that aren't tied", () => {
            const doc = parseScore(exportVoice([note("C4"), note("C4"), "begin slur", note("D4")]));

            expect(doc.getElementsByTagName("tied")).toHaveLength(0);
        });

        it("does not mistake a marker's argument for a tie or slur", () => {
            const doc = parseScore(
                exportVoice([note("C4"), "markdown", "tie", note("D4"), "markdown", "end slur"])
            );

            expect(notesOf(doc).map(marksOf)).toEqual([[], []]);
        });
    });

    it("still ties and slurs notes that carry markup", () => {
        // A note split across a barline is staged as the note, its markup, then "tie".
        const doc = parseScore(
            exportVoice([
                "begin slur",
                note("C4"),
                "markup",
                261.63,
                "tie",
                note("C4"),
                "markup",
                261.63,
                "end slur"
            ])
        );
        const [tied, continuation] = notesOf(doc);
        const typeOf = (el, tag) => el.getElementsByTagName(tag)[0].getAttribute("type");

        expect(typeOf(tied, "tie")).toBe("start");
        expect(typeOf(tied, "slur")).toBe("start");
        expect(typeOf(continuation, "tie")).toBe("stop");
        expect(typeOf(continuation, "slur")).toBe("stop");
    });

    it("writes swing as a words direction", () => {
        const doc = parseScore(exportVoice(["swing", note("C4")]));
        const words = doc.getElementsByTagName("words");

        expect(words).toHaveLength(1);
        expect(words[0].textContent).toBe("swing");
    });

    it("keeps markup text intact through XML escaping", () => {
        // Text that looks like a part id must be written as-is, and voice index 1 is still
        // written as part P1.
        const text = "a < b & P1 #2";
        const doc = parseScore(exportVoices({ 1: [note("C4"), "markdown", text, note("D4")] }));

        expect(doc.getElementsByTagName("words")[0].textContent).toBe(text);
        expect(doc.getElementsByTagName("score-part")[0].getAttribute("id")).toBe("P1");
        expect(doc.getElementsByTagName("part")[0].getAttribute("id")).toBe("P1");
    });

    it("omits a voice whose notes are all drum-only, since none of them has a pitch to write", () => {
        const drumOnly = [[], 4, 0, null, null, false, false];
        const doc = parseScore(
            exportVoices({
                0: [drumOnly, drumOnly, "begin crescendo", drumOnly, "end crescendo"],
                1: [note("C4"), note("D4")]
            })
        );

        expect(doc.getElementsByTagName("score-part")).toHaveLength(1);
        expect(doc.getElementsByTagName("part")).toHaveLength(1);
        expect(stepsOf(doc)).toEqual(["C", "D"]);
    });

    it.each([
        ["rests", [note("R"), note("R")]],
        [
            "drum hits and rests",
            [
                [[], 4, 0, null, null, false, false],
                note("R"),
                [[], 4, 0, null, null, false, false],
                note("R")
            ]
        ]
    ])("omits a voice with no pitched note: only %s", (_label, staged) => {
        const doc = parseScore(exportVoices({ 0: [note("C4"), note("D4")], 1: staged }));

        expect(doc.getElementsByTagName("part")).toHaveLength(1);
        expect(doc.getElementsByTagName("rest")).toHaveLength(0);
    });

    it("keeps rests in a voice that also has pitched notes", () => {
        const doc = parseScore(exportVoice([note("C4"), note("R"), note("D4")]));

        expect(doc.getElementsByTagName("rest")).toHaveLength(1);
        expect(stepsOf(doc)).toEqual(["C", "D"]);
    });

    it("omits a voice that stages markers but no notes", () => {
        const doc = parseScore(
            exportVoices({
                0: ["tempo", 90, "4", "meter", 3, 4],
                1: [note("C4"), note("D4")]
            })
        );

        expect(doc.getElementsByTagName("score-part")).toHaveLength(1);
        expect(doc.getElementsByTagName("part")).toHaveLength(1);
        expect(measuresOf(doc).length).toBeGreaterThan(0);
    });
});
