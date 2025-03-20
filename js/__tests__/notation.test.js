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
const { durationToNoteValue, convertFactor } = require("../utils/musicutils");
global.convertFactor = convertFactor;
global.durationToNoteValue = durationToNoteValue;

jest.mock("../utils/musicutils.js", function() {
    return {
        durationToNoteValue: jest.fn().mockReturnValue([1, 1, 1, 1]),
        convertFactor: jest.fn().mockReturnValue(4),
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
        notation._notationDrumStaging["turtle1"] = [];
        notation._pickupPOW2["turtle1"] = false;
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

        it("should add notation markup using _notationMarkup", () => {
            const turtle = "turtle1";
            const markup = "staccato";
            const below = true;
            notation._notationMarkup(turtle, markup, below);
            expect(notation._notationStaging[turtle]).toEqual(["markdown", "staccato"]);
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

    describe("Edge Cases", () => {
        it("should handle empty or invalid input for notationPickup", () => {
            const turtle = "turtle1";
            const factor = 0;
            notation.notationPickup(turtle, factor);
            expect(notation._notationStaging[turtle].length).toBe(0);
        });
    });
});
