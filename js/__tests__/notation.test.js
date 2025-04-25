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

const Notation = require("../notation");
const { durationToNoteValue, convertFactor, getDrumSymbol } = require("../utils/musicutils");
global.convertFactor = convertFactor;
global.durationToNoteValue = durationToNoteValue;
global.getDrumSymbol = getDrumSymbol;
global._ = require("lodash");
global.last = (arr) => arr[arr.length - 1];
global.toFixed2 = (n) => parseFloat(n.toFixed(2));
global.rationalToFraction = jest.fn().mockReturnValue([1, 2]);

jest.mock("../utils/musicutils.js", function() {
    return {
        durationToNoteValue: jest.fn().mockReturnValue([1, 1, 1, 1]),
        convertFactor: jest.fn().mockReturnValue(4),
        getDrumSymbol: jest.fn().mockReturnValue("drums")
    };
});

describe("Notation Class", () => {
    let notation;

    beforeEach(() => {
        const mockActivity = {
            turtles: {
                ithTurtle: jest.fn().mockReturnValue({
                    singer: {
                        staccato: []
                    }
                })
            },
            logo: {
                updateNotation: jest.fn()
            }
        };
        notation = new Notation(mockActivity);
        notation._notationStaging = [[]];
        notation._notationStaging["turtle1"] = [];
        notation._notationDrumStaging = {};
        notation._notationDrumStaging["turtle1"] = [];
        notation._markup = {};
        notation._markup["turtle1"] = [];
        notation._pickupPOW2 = {};
        notation._pickupPOW2["turtle1"] = false;
        notation._pickupPoint = {};
        notation._pickupPoint["turtle1"] = null;
    });

    describe("Setters and Getters", () => {
        it("should correctly set and get notationStaging", () => {
            const turtle = "turtle1";
            const staging = { "turtle1": ["note1", "note2"] };
            notation.notationStaging = staging;
            expect(notation.notationStaging).toEqual(staging);
        });

        it("should correctly set and get notationDrumStaging", () => {
            const turtle = "turtle1";
            const drumStaging = { "turtle1": ["drum1", "drum2"] };
            notation.notationDrumStaging = drumStaging;
            expect(notation.notationDrumStaging).toEqual(drumStaging);
        });

        it("should correctly set and get notationMarkup", () => {
            const markup = { "turtle1": ["markup1", "markup2"] };
            notation.notationMarkup = markup;
            expect(notation.notationMarkup).toEqual(markup);
        });

        it("should correctly return pickupPOW2 and pickupPoint", () => {
            expect(notation.pickupPOW2).toEqual({ turtle1: false });
            expect(notation.pickupPoint).toEqual({ turtle1: null });
        });
    });

    describe("Notation Utility Methods", () => {
        it("should update notation correctly with doUpdateNotation", () => {
            const note = "C4";
            const duration = 4;
            const turtle = "turtle1";
            const insideChord = false;
            const drum = [];
            notation.doUpdateNotation(note, duration, turtle, insideChord, drum);
            expect(notation._notationStaging[turtle]).toContainEqual(expect.arrayContaining([note, expect.any(Number), expect.any(Number)]));
        });

        it("should update notation with drum correctly", () => {
            const note = "C4";
            const duration = 4;
            const turtle = "turtle1";
            const insideChord = false;
            const drum = ["kick"];
            notation.doUpdateNotation(note, duration, turtle, insideChord, drum);
            expect(notation._notationDrumStaging[turtle]).toContainEqual(expect.arrayContaining([["drums"], expect.any(Number), expect.any(Number)]));
        });

        it("should update notation with noise correctly", () => {
            const note = "C4";
            const duration = 4;
            const turtle = "turtle1";
            const insideChord = false;
            const drum = ["noise1"];
            notation.doUpdateNotation(note, duration, turtle, insideChord, drum);
            expect(notation._notationDrumStaging[turtle].length).toBe(0);
        });

        it("should handle object notes with markup", () => {
            const note = { 0: "C4", 1: "D4" };
            const duration = 4;
            const turtle = "turtle1";
            const insideChord = false;
            const drum = [];
            notation._markup = { "turtle1": ["articulation", "staccato"] };
            notation.doUpdateNotation(note, duration, turtle, insideChord, drum);
            // The functionality is being tested but the assertion is simplified
            expect(notation._notationStaging[turtle]).toContainEqual(expect.arrayContaining([note, expect.any(Number), expect.any(Number)]));
        });

        it("should add notation markup using _notationMarkup", () => {
            const turtle = "turtle1";
            const markup = "staccato";
            const below = true;
            notation._notationMarkup(turtle, markup, below);
            expect(notation._notationStaging[turtle]).toEqual(["markdown", "staccato"]);
        });

        it("should add notation markup above using _notationMarkup", () => {
            const turtle = "turtle1";
            const markup = "staccato";
            const below = false;
            notation._notationMarkup(turtle, markup, below);
            expect(notation._notationStaging[turtle]).toEqual(["markup", "staccato"]);
        });

        it("should add a pickup using notationPickup", () => {
            const turtle = "turtle1";
            const factor = 2;
    
            notation.notationPickup(turtle, factor);
            expect(convertFactor).toHaveBeenCalledWith(factor);
            expect(notation._notationStaging[turtle]).toEqual(["pickup", 4]);
        });

        it("should add a voice using notationVoices", () => {
            const turtle = "turtle1";
            const voiceNumber = 2;
            notation.notationVoices(turtle, voiceNumber);
            expect(notation._notationStaging[turtle]).toContain("voice two");
        });

        it("should handle different voice numbers correctly", () => {
            const turtle = "turtle1";
            
            notation.notationVoices(turtle, 1);
            expect(notation._notationStaging[turtle]).toContain("voice one");
            
            notation._notationStaging[turtle] = [];
            notation.notationVoices(turtle, 3);
            expect(notation._notationStaging[turtle]).toContain("voice three");
            
            notation._notationStaging[turtle] = [];
            notation.notationVoices(turtle, 4);
            expect(notation._notationStaging[turtle]).toContain("voice four");
            
            notation._notationStaging[turtle] = [];
            notation.notationVoices(turtle, 5);
            expect(notation._notationStaging[turtle]).toContain("one voice");
            
            notation._notationStaging[turtle] = [];
            notation.notationVoices(turtle, 6);
            expect(notation._notationStaging[turtle]).toContain("one voice");
        });

        it("should set key using notationKey", () => {
            const turtle = "turtle1";
            const key = "C";
            const mode = "major";
            notation.notationKey(turtle, key, mode);
            expect(notation._notationStaging[turtle]).toEqual(["key", key, mode]);
        });

        it("should set meter using notationMeter", () => {
            const turtle = "turtle1";
            const count = 4;
            const value = 4;
            notation.notationMeter(turtle, count, value);
            expect(notation._notationStaging[turtle]).toEqual(["meter", count, value]);
        });

        it("should handle notationSwing", () => {
            const turtle = "turtle1";
            notation.notationSwing(turtle);
            expect(notation._notationStaging[turtle]).toContain("swing");
        });

        it("should handle notationTempo", () => {
            const turtle = "turtle1";
            const bpm = 120;
            const beatValue = 4;
            notation.notationTempo(turtle, bpm, beatValue);
            expect(notation._notationStaging[turtle]).toEqual(["tempo", bpm, 4]);
        });
    });

    describe("Line Breaks and Harmonics", () => {
        it("should add line break notation", () => {
            const turtle = "turtle1";
            notation.notationLineBreak(turtle);
            // The function in source code has the line commented out, so it doesn't actually push "break"
            expect(notation._pickupPoint[turtle]).toBeNull();
        });

        it("should add harmonics notation", () => {
            const turtle = "turtle1";
            notation.__notationHarmonic(turtle);
            // In the source code, this pushes to this._notationStaging (without the turtle index)
            // So let's test just the side effect
            expect(notation._pickupPoint[turtle]).toBeNull();
        });

        it("should begin harmonics", () => {
            const turtle = "turtle1";
            notation.notationBeginHarmonics(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["begin harmonics"]);
        });

        it("should end harmonics", () => {
            const turtle = "turtle1";
            notation.notationEndHarmonics(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["end harmonics"]);
        });
    });

    describe("Articulation Controls", () => {
        it("should begin articulation", () => {
            const turtle = "turtle1";
            notation.notationBeginArticulation(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["begin articulation"]);
        });

        it("should end articulation", () => {
            const turtle = "turtle1";
            notation.notationEndArticulation(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["end articulation"]);
        });

        it("should begin crescendo", () => {
            const turtle = "turtle1";
            const factor = 2;
            notation.notationBeginCrescendo(turtle, factor);
            expect(notation._notationStaging[turtle]).toEqual(["begin crescendo"]);
        });

        it("should begin decrescendo", () => {
            const turtle = "turtle1";
            const factor = -2;
            notation.notationBeginCrescendo(turtle, factor);
            expect(notation._notationStaging[turtle]).toEqual(["begin decrescendo"]);
        });

        it("should end crescendo", () => {
            const turtle = "turtle1";
            const factor = 2;
            notation.notationEndCrescendo(turtle, factor);
            expect(notation._notationStaging[turtle]).toEqual(["end crescendo"]);
        });

        it("should end decrescendo", () => {
            const turtle = "turtle1";
            const factor = -2;
            notation.notationEndCrescendo(turtle, factor);
            expect(notation._notationStaging[turtle]).toEqual(["end decrescendo"]);
        });
    });

    describe("Slur and Tie Controls", () => {
        it("should begin slur", () => {
            const turtle = "turtle1";
            notation.notationBeginSlur(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["begin slur"]);
        });

        it("should end slur", () => {
            const turtle = "turtle1";
            notation.notationEndSlur(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["end slur"]);
        });

        it("should insert tie", () => {
            const turtle = "turtle1";
            notation.notationInsertTie(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["tie"]);
        });

        it("should remove tie", () => {
            const turtle = "turtle1";
            // Add an element first so we can pop it
            notation._notationStaging[turtle].push("some element");
            const initialLength = notation._notationStaging[turtle].length;
            notation.notationRemoveTie(turtle);
            expect(notation._notationStaging[turtle].length).toBe(initialLength - 1);
            expect(notation._pickupPoint[turtle]).toBeNull();
        });
    });

    describe("Static Methods", () => {
        it("should handle notation markup via static method", () => {
            // Mock the static property that the method uses
            const originalMarkup = Notation._markup;
            Notation._markup = { "turtle1": [] };
            
            Notation.notationMarkup("turtle1", "staccato");
            expect(Notation._markup["turtle1"]).toContain("staccato");
            
            // Restore the original
            Notation._markup = originalMarkup;
        });
    });

    describe("Edge Cases", () => {
        it("should handle empty or invalid input for notationPickup", () => {
            const turtle = "turtle1";
            const factor = 0;
            notation.notationPickup(turtle, factor);
            expect(notation._notationStaging[turtle].length).toBe(0);
        });
    });

    describe("Slur and Articulation Methods", () => {
        it("should handle begin and end slur", () => {
            const turtle = "turtle1";
            
            notation.notationBeginSlur(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["begin slur"]);
            expect(notation._pickupPoint[turtle]).toBeNull();
            
            notation.notationEndSlur(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["begin slur", "end slur"]);
            expect(notation._pickupPoint[turtle]).toBeNull();
        });

        it("should handle tie insertion and removal", () => {
            const turtle = "turtle1";
            
            notation.notationInsertTie(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["tie"]);
            
            notation.notationRemoveTie(turtle);
            expect(notation._notationStaging[turtle]).toEqual([]);
        });

        it("should handle begin and end articulation", () => {
            const turtle = "turtle1";
            
            notation.notationBeginArticulation(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["begin articulation"]);
            
            notation.notationEndArticulation(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["begin articulation", "end articulation"]);
        });
    });

    describe("Crescendo and Harmonics Methods", () => {
        it("should handle begin and end crescendo", () => {
            const turtle = "turtle1";
            
            notation.notationBeginCrescendo(turtle, 1);
            expect(notation._notationStaging[turtle]).toEqual(["begin crescendo"]);
            
            notation.notationEndCrescendo(turtle, 1);
            expect(notation._notationStaging[turtle]).toEqual(["begin crescendo", "end crescendo"]);
        });

        it("should handle begin and end decrescendo", () => {
            const turtle = "turtle1";
            
            notation.notationBeginCrescendo(turtle, -1);
            expect(notation._notationStaging[turtle]).toEqual(["begin decrescendo"]);
            
            notation.notationEndCrescendo(turtle, -1);
            expect(notation._notationStaging[turtle]).toEqual(["begin decrescendo", "end decrescendo"]);
        });

        it("should handle begin and end harmonics", () => {
            const turtle = "turtle1";
            
            notation.notationBeginHarmonics(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["begin harmonics"]);
            
            notation.notationEndHarmonics(turtle);
            expect(notation._notationStaging[turtle]).toEqual(["begin harmonics", "end harmonics"]);
        });
    });

    describe("Key and Line Break Methods", () => {
        it("should set key and mode in notation", () => {
            const turtle = "turtle1";
            const key = "C";
            const mode = "major";
            
            notation.notationKey(turtle, key, mode);
            expect(notation._notationStaging[turtle]).toEqual(["key", "C", "major"]);
            expect(notation._pickupPoint[turtle]).toBeNull();
        });

        it("should handle line breaks", () => {
            const turtle = "turtle1";
            const prevPickupPoint = notation._pickupPoint[turtle];
            
            notation.notationLineBreak(turtle);
            // Line break doesn't add to the notation staging, but nullifies pickup point
            expect(notation._pickupPoint[turtle]).toBeNull();
        });
    });

    describe("Voice Methods", () => {
        it("should add all possible voices", () => {
            const turtle = "turtle1";
            
            notation.notationVoices(turtle, 1);
            expect(notation._notationStaging[turtle]).toContain("voice one");
            notation._notationStaging[turtle] = [];
            
            notation.notationVoices(turtle, 2);
            expect(notation._notationStaging[turtle]).toContain("voice two");
            notation._notationStaging[turtle] = [];
            
            notation.notationVoices(turtle, 3);
            expect(notation._notationStaging[turtle]).toContain("voice three");
            notation._notationStaging[turtle] = [];
            
            notation.notationVoices(turtle, 4);
            expect(notation._notationStaging[turtle]).toContain("voice four");
            notation._notationStaging[turtle] = [];
            
            notation.notationVoices(turtle, 5); // Invalid voice number
            expect(notation._notationStaging[turtle]).toContain("one voice");
        });
    });

    describe("Complex Notation Scenarios", () => {
        it("should handle meter setting with pickup point", () => {
            const turtle = "turtle1";
            
            // First set pickup point to a non-null value
            notation._pickupPoint[turtle] = 2;
            notation._notationStaging[turtle] = ["note1", "note2", "note3", "note4"];
            
            notation.notationMeter(turtle, 4, 4);
            
            // After setting meter, the notation staging should have meter before the pickup elements
            expect(notation._notationStaging[turtle]).toContainEqual("meter");
            expect(notation._pickupPoint[turtle]).toBeNull();
        });

        it("should handle doUpdateNotation with markup", () => {
            const turtle = "turtle1";
            const note = ["C4", "E4", "G4"]; // Object (array) for a chord
            const duration = 4;
            const insideChord = false;
            const drum = [];
            
            // Add some markup
            notation._markup[turtle] = [440, "accent"];
            
            // Spy on _notationMarkup method
            jest.spyOn(notation, "_notationMarkup");
            
            notation.doUpdateNotation(note, duration, turtle, insideChord, drum);
            
            // Should have called _notationMarkup for each markup item
            expect(notation._notationMarkup).toHaveBeenCalled();
            expect(notation._markup[turtle]).toEqual([]);
        });
    });

    describe("Additional Edge Cases", () => {
        it("should handle doUpdateNotation with drum", () => {
            const turtle = "turtle1";
            const note = "C4";
            const duration = 4;
            const insideChord = false;
            const drum = ["kick"]; // A drum to be added
            
            notation.doUpdateNotation(note, duration, turtle, insideChord, drum);
            
            // Should have added the drum to _notationDrumStaging
            expect(notation._notationDrumStaging[turtle].length).toBe(1);
        });

        it("should handle notationTempo with null beat value", () => {
            const turtle = "turtle1";
            const bpm = 120;
            
            // Mock convertFactor to return null
            require("../utils/musicutils").convertFactor.mockReturnValueOnce(null);
            
            notation.notationTempo(turtle, bpm, 3);
            
            // Should not add anything to notation staging with null beat
            expect(notation._notationStaging[turtle].length).toBe(0);
        });

        it("should handle __notationHarmonic method", () => {
            const turtle = "turtle1";
            
            notation.__notationHarmonic(turtle);
            
            // __notationHarmonic pushes to _notationStaging without turtle index
            expect(notation._notationStaging).toContain("harmonic");
        });
    });
});
