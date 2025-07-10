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

const frequencyToPitch = jest.fn((n) => {
    return ["C", "4"];
});
const getScaleAndHalfSteps = jest.fn(() => {
    return [["C", "D", "E", "F", "G", "A", "B"], ["", "", "", "", "", "", ""]];
});
const toFraction = jest.fn((num) => {
    return [num, 1];
});

const NOTATIONDURATION = 1;
const NOTATIONNOTE = 0;
const NOTATIONROUNDDOWN = 2;
const NOTATIONSTACCATO = 6;
const NOTATIONTUPLETVALUE = 3;
const NOTATIONDOTCOUNT = 4;

global.frequencyToPitch = frequencyToPitch;
global.getScaleAndHalfSteps = getScaleAndHalfSteps;
global.toFraction = toFraction;
global.NOTATIONDURATION = NOTATIONDURATION;
global.NOTATIONNOTE = NOTATIONNOTE;
global.NOTATIONROUNDDOWN = NOTATIONROUNDDOWN;
global.NOTATIONSTACCATO = NOTATIONSTACCATO;
global.NOTATIONTUPLETVALUE = NOTATIONTUPLETVALUE;
global.NOTATIONDOTCOUNT = NOTATIONDOTCOUNT;

global.SHARP = "♯";
global.FLAT = "♭";
global.NATURAL = "♮";
global.DOUBLESHARP = "𝄪";
global.DOUBLEFLAT = "𝄫";

global._ = jest.fn((str) => str);
global.last = jest.fn((array) => array[array.length - 1]);

const { getLilypondHeader, processLilypondNotes, saveLilypondOutput } = require("../lilypond");

describe("getLilypondHeader", () => {
    test("should return the LilyPond header as a string", () => {
        const result = getLilypondHeader();
        expect(typeof result).toBe("string");
        expect(result).toContain('\\version "2.18.2"');
        expect(result).toContain("Made with LilyPond and Music Blocks");
        expect(result).toContain("Creative Commons Attribution ShareAlike 3.0");
    });
});


describe("processLilypondNotes", () => {
    let logo;
    let turtle;
    let lilypond;

    beforeEach(() => {
        turtle = "0";
        logo = {
            notationNotes: {
                [turtle]: "0"
            },
            notation: {
                notationStaging: {
                    [turtle]: [
                        [
                            ["G4"],
                            4,
                            0,
                            null,
                            0,
                            -1,
                            false
                        ],
                        "meter",
                        4,
                        4
                    ]
                }
            }
        };
        lilypond = "";
    });

    test('should initialize notationNotes with "\\meter\n" and process staging commands', () => {
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\meter\n");
        expect(logo.notationNotes[turtle]).toContain(" \\time 4/4\n");
    });

    test("should process a note object correctly", () => {
        logo.notation.notationStaging[turtle] = [
            [
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ]
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\meter\n" + "g'4 ");
        expect(logo.notationNotes[turtle]).toContain("4");
    });

    test("should process a key signature correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "key",
            "C",
            "major"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\key c \\major");
    });

    test("should process a tempo change correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "tempo",
            120,
            "Allegro"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\tempo Allegro = 120");
    });

    test("should process a slur correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "begin slur",
            [
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ],
            "end slur"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\meter\n" + "g'4 (  )  ");
    });

    test("should process a crescendo correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "begin crescendo",
            [
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ],
            "end crescendo"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\meter\n" + "  g'4 \\< \\! ");
    });

    test("should process a decrescendo correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "begin decrescendo",
            [
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ],
            "end decrescendo"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\meter\n" + "  g'4 \\> \\! ");
    });

    test("should process a tuplet correctly", () => {
        logo.notation.notationStaging[turtle] = [
            [
                ["G4"],
                4,
                0,
                [3, 2],
                0,
                -1,
                false
            ]
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\meter\n" + "\\tuplet Infinity/1 { g' 0} ");
    });

    test("should process a markup command correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "markup",
            "Test Markup"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("^\\markup { \\abs-fontsize #6 { Test Markup } } ");
    });

    test("should process a markdown command correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "markdown",
            "Test Markdown"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("_\\markup { Test Markdown } ");
    });

    test("should process a break command correctly", () => {
        logo.notation.notationStaging[turtle] = [
            [
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ],
            "break",
            [
                ["E4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ]
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\n");
    });

    test("should process articulation commands correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "begin articulation",
            [
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ],
            "end articulation"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("->");
    });

    test("should process a pickup command correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "pickup",
            4,
            [
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ]
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\partial 4\n");
    });

    test("should process voice commands correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "voice one",
            [
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ],
            "voice two",
            [
                ["E4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ],
            "one voice"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("<< { \\voiceOne ");
        expect(logo.notationNotes[turtle]).toContain("}\n\\new Voice { \\voiceTwo ");
        expect(logo.notationNotes[turtle]).toContain("}\n>> \\oneVoice\n");
    });

    test("should process a tie command correctly", () => {
        logo.notation.notationStaging[turtle] = [
            "tie"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("~");
    });

    test("should append unrecognized command as is", () => {
        logo.notation.notationStaging[turtle] = [
            "unrecognized"
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("unrecognized");
    });

    test("should process note object with dot notation", () => {
        logo.notation.notationStaging[turtle] = [
            [
                ["G4"],
                4,
                0,
                null,
                2,
                -1,
                false
            ]
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("4..");
    });

    test("should process note object with staccato", () => {
        logo.notation.notationStaging[turtle] = [
            [
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                true
            ]
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\staccato ");
    });

    test("should insert newline after 8 notes", () => {
        const notesArray = [];
        for (let i = 0; i < 9; i++) {
            notesArray.push([
                ["G4"],
                4,
                0,
                null,
                0,
                -1,
                false
            ]);
        }
        logo.notation.notationStaging[turtle] = notesArray;
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\n");
    });

    test("should handle incomplete tuplet gracefully", () => {
        logo.notation.notationStaging[turtle] = [
            [
                ["G4"],
                4,
                0,
                [3, 2],
                0,
                -1,
                false
            ]
        ];
        processLilypondNotes(lilypond, logo, turtle);
        expect(logo.notationNotes[turtle]).toContain("\\tuplet");
    });
});

describe("saveLilypondOutput", () => {
    let activity;

    beforeEach(() => {
        global.RODENTS = [
            "mouse",
            "brown rat",
            "mole",
            "chipmunk",
            "red squirrel",
            "guinea pig",
            "capybara",
            "coypu",
            "black rat",
            "grey squirrel",
            "flying squirrel",
            "bat"
        ];
        activity = {
            logo: {
                notation: {
                    notationStaging: {
                        "0": [
                            [
                                ["G4"],
                                4,
                                0,
                                null,
                                0,
                                -1,
                                false
                            ]
                        ],
                        "1": [
                            [
                                ["E4"],
                                4,
                                0,
                                null,
                                0,
                                -1,
                                false
                            ]
                        ]
                    },
                    notationDrumStaging: {}
                },
                notationNotes: {},
                notationOutput: "",
                guitarOutputHead: "",
                guitarOutputEnd: "",
                MIDIOutput: ""
            },
            turtles: {
                turtleList: {
                    "0": { name: "Turtle 0" },
                    "1": { name: "Turtle 1" }
                },
                getTurtle: function (t) {
                    return this.turtleList[t];
                }
            },
            prepareExport: jest.fn(() => JSON.stringify({ project: "data" }))
        };
    });

    test("should generate LilyPond output correctly", () => {
        const result = saveLilypondOutput(activity);
        expect(result).toContain("% You can change the MIDI instruments below to anything on this list:");
        expect(result).toContain("\\score {");
        expect(result).toContain("\\layout {}");
        expect(result).toContain("% MUSIC BLOCKS CODE");
        expect(result).toContain('{"project":"data"}');
    });

    test("should handle drum staging correctly", () => {
        activity.logo.notation.notationDrumStaging = {
            "0": [
                [
                    ["C4"],
                    4,
                    0,
                    null,
                    0,
                    -1,
                    false
                ]
            ]
        };
        const result = saveLilypondOutput(activity);
        expect(result).toContain("\\drummode {");
    });

    test("should handle empty drum staging correctly", () => {
        activity.logo.notation.notationDrumStaging = {
            "0": []
        };
        const result = saveLilypondOutput(activity);
        expect(result).not.toContain("\\drummode {");
    });

    test("should handle multiple turtles correctly", () => {
        const result = saveLilypondOutput(activity);
        expect(result).toContain("Turtle0 = {");
        expect(result).toContain("Turtle1 = {");
    });

    test("should handle unique short instrument names correctly", () => {
        activity.turtles.turtleList = {
            "0": { name: "Turtle 0" },
            "1": { name: "Turtle 1" },
            "2": { name: "Turtle 2" }
        };
        const result = saveLilypondOutput(activity);
        expect(result).toContain('shortInstrumentName = "Tu"');
    });

    test("should handle empty notation staging correctly", () => {
        activity.logo.notation.notationStaging = {};
        const result = saveLilypondOutput(activity);
        const expected = "% You can change the MIDI instruments below to anything on this list:\n" +
            "% (http://lilypond.org/doc/v2.18/documentation/notation/midi-instruments)\n\n" +
            "\\score {\n" +
            " <<\n\n" +
            " >>" +
            " \\layout {}\n" +
            "% MUSIC BLOCKS CODE\n" +
            "% Below is the code for the Music Blocks project that generated this Lilypond file.\n" +
            "%{\n\n" +
            "{\"project\":\"data\"}\n" +
            "%}\n\n";
        expect(result).not.toContain(expected);
    });

    test("should handle empty notation output correctly", () => {
        activity.logo.notationOutput = "";
        const result = saveLilypondOutput(activity);
        expect(result).toContain("% You can change the MIDI instruments below to anything on this list:");
    });

    test("should fallback to RODENTS names if instrument name is empty", () => {
        activity.turtles.getTurtle = jest.fn((t) => ({ name: "" }));
        activity.turtles.turtleList = { "0": {} };
        saveLilypondOutput(activity);
        expect(activity.logo.notationOutput).toContain(RODENTS[0]);
    });

    test("should handle multiple turtles with different clefs correctly", () => {
        activity.logo.notationNotes = {
            "0": "\\note0",
            "1": "\\note1"
        };
        activity.logo.notation.notationStaging = {
            "0": ["note"],
            "1": ["note"]
        };
        clef = ["treble", "bass_8"];
        CLEFS = ["treble", "bass_8"];

        const result = saveLilypondOutput(activity);

        expect(result).toContain("\\context TabVoice = \"Turtle0\" \\Turtle0");
        expect(result).toContain("shortInstrumentName = \"Tu\"");
        expect(result).toContain("Turtle1Voice = \\new Staff \\with {");
    });

    test("should ensure last turtle adds a bar", () => {
        activity.logo.notationNotes["0"] = "g'4 ";
        activity.logo.notation.notationStaging["0"] = ["note"];
        turtleCount = 1;

        const result = saveLilypondOutput(activity);
        expect(result).toContain(' \\bar "|."');
    });

    test("should correctly handle score block generation", () => {
        activity.logo.notationNotes["0"] = "\\note0";
        activity.logo.notation.notationStaging["0"] = ["note"];
        activity.logo.notationNotes["1"] = "\\note1";
        activity.logo.notation.notationStaging["1"] = ["note"];
        CLEFS = ["treble", "bass_8"];

        const result = saveLilypondOutput(activity);
        expect(result).toContain("\\score {");
        expect(result).toContain("\\layout {}");
    });

    test("should handle music blocks code correctly", () => {
        activity.prepareExport = jest.fn(() => '{"musicBlocks": ["block1", "block2"]}');
        const result = saveLilypondOutput(activity);
        expect(result).toContain("% MUSIC BLOCKS CODE");
        expect(result).toContain('{"musicBlocks": ["block1", "block2"]}');
    });

    test("should handle custom mode definitions correctly", () => {
        activity.logo.notation.notationStaging["0"].push("custom mode");
        const result = saveLilypondOutput(activity);
        expect(result).toContain("custom mode");
    });

    test("should properly format guitar tab output", () => {
        activity.logo.guitarOutputHead = "% Guitar Output Head\n";
        activity.logo.guitarOutputEnd = "% Guitar Output End\n";
        activity.logo.notationNotes = { "0": "\\note0" };
        activity.logo.notation.notationStaging = { "0": ["note"] };

        const result = saveLilypondOutput(activity);
        expect(result).toContain("% Guitar Output Head");
        expect(result).toContain("% Guitar Output End");
    });

    test("should handle MIDI output correctly", () => {
        activity.logo.MIDIOutput = "% MIDI Output";
        const result = saveLilypondOutput(activity);
        expect(result).toContain("% MIDI Output");
    });
});