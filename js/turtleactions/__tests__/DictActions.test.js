/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 omsuneri
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

const setupDictActions = require("../DictActions");

describe("setupDictActions", () => {
    let activity;
    let turtle;
    let targetTurtle;

    beforeAll(() => {
        global.Turtle = {
            DictActions: {}
        };

        global._ = jest.fn((key) => key);
        global.Singer = {
            RhythmActions: {
                getNoteValue: jest.fn().mockReturnValue(4)
            }
        };
        global.getNote = jest.fn().mockReturnValue(["G", 4]);
        global.pitchToNumber = jest.fn().mockReturnValue(60);
        global.INVALIDPITCH = "Invalid pitch";
        global.getTargetTurtle = jest.fn();
    });

    beforeEach(() => {
        activity = {
            turtles: {
                ithTurtle: jest.fn(),
                screenX2turtleX: jest.fn(),
                screenY2turtleY: jest.fn(),
            },
            logo: {
                turtleDicts: {},
                synth: {
                    inTemperament: "equal"
                }
            },
            textMsg: jest.fn(),
            errorMsg: jest.fn()
        };

        turtle = 0;
        targetTurtle = {
            painter: {
                color: "red",
                value: 10,
                chroma: 0.5,
                pensize: 2,
                stroke: 2,
                font: "Arial",
                orientation: 90,
                turtle: {
                    orientation: 90
                },
                doSetColor: jest.fn(),
                doSetValue: jest.fn(),
                doSetChroma: jest.fn(),
                doSetPensize: jest.fn(),
                doSetFont: jest.fn(),
                doSetHeading: jest.fn(),
                doSetXY: jest.fn()
            },
            container: {
                x: 100,
                y: 200
            },
            singer: {
                notesPlayed: [1, 2],
                lastNotePlayed: ["C4"],
                notePitches: ["C"],
                noteOctaves: [4],
                keySignature: "C",
                movable: true,
                pitchNumberOffset: 0
            }
        };
        
        activity.turtles.ithTurtle.mockReturnValue(targetTurtle);
        activity.turtles.screenX2turtleX.mockReturnValue(100);
        activity.turtles.screenY2turtleY.mockReturnValue(200);
        
        global.getTargetTurtle.mockImplementation((turtles, name) => {
            return name === "target" ? 0 : null;
        });
        
        setupDictActions(activity);
        activity.logo.turtleDicts[turtle] = {};
    });

    describe("_GetDict", () => {
        it("should get the turtle color correctly", () => {
            const color = Turtle.DictActions._GetDict(0, turtle, "color");
            expect(color).toBe("red");
        });
        
        it("should get the turtle shade correctly", () => {
            const shade = Turtle.DictActions._GetDict(0, turtle, "shade");
            expect(shade).toBe(10);
        });
        
        it("should get the turtle grey correctly", () => {
            const grey = Turtle.DictActions._GetDict(0, turtle, "grey");
            expect(grey).toBe(0.5);
        });
        
        it("should get the turtle pen size correctly", () => {
            const penSize = Turtle.DictActions._GetDict(0, turtle, "pen size");
            expect(penSize).toBe(2);
        });
        
        it("should get the turtle font correctly", () => {
            const font = Turtle.DictActions._GetDict(0, turtle, "font");
            expect(font).toBe("Arial");
        });
        
        it("should get the turtle heading correctly", () => {
            const heading = Turtle.DictActions._GetDict(0, turtle, "heading");
            expect(heading).toBe(90);
        });
        
        it("should get the turtle x position correctly", () => {
            const x = Turtle.DictActions._GetDict(0, turtle, "x");
            expect(x).toBe(100);
        });
        
        it("should get the turtle y position correctly", () => {
            const y = Turtle.DictActions._GetDict(0, turtle, "y");
            expect(y).toBe(200);
        });
        
        it("should get the notes played correctly", () => {
            const notesPlayed = Turtle.DictActions._GetDict(0, turtle, "notes played");
            expect(notesPlayed).toBe(0.5);
        });
        
        it("should get the note value correctly", () => {
            const noteValue = Turtle.DictActions._GetDict(0, turtle, "note value");
            expect(noteValue).toBe(4);
            expect(Singer.RhythmActions.getNoteValue).toHaveBeenCalledWith(0);
        });
        
        it("should get the current pitch correctly", () => {
            const currentPitch = Turtle.DictActions._GetDict(0, turtle, "current pitch");
            expect(currentPitch).toBe("C4");
        });
        
        it("should get the pitch number correctly with lastNotePlayed", () => {
            const pitchNumber = Turtle.DictActions._GetDict(0, turtle, "pitch number");
            expect(pitchNumber).toBe(60);
            expect(pitchToNumber).toHaveBeenCalledWith("C", 4, "C");
        });
        
        it("should get the pitch number correctly using notePitches when lastNotePlayed is null", () => {
            targetTurtle.singer.lastNotePlayed = null;
            const pitchNumber = Turtle.DictActions._GetDict(0, turtle, "pitch number", 1);
            expect(pitchNumber).toBe(60);
            expect(getNote).toHaveBeenCalled();
        });
        
        it("should handle error when getting pitch number with no notes", () => {
            targetTurtle.singer.lastNotePlayed = null;
            targetTurtle.singer.notePitches = [];
            const pitchNumber = Turtle.DictActions._GetDict(0, turtle, "pitch number", 1);
            expect(pitchNumber).toBe(60);
            expect(activity.errorMsg).toHaveBeenCalledWith(INVALIDPITCH, 1);
        });

        it("should return undefined for an unsupported key", () => {
            const result = Turtle.DictActions._GetDict(0, turtle, "unsupportedKey");
            expect(result).toBeUndefined();
        });
    });

    describe("SetDictValue", () => {
        it("should set the turtle color correctly", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "color", "blue");
            expect(targetTurtle.painter.doSetColor).toHaveBeenCalledWith("blue");
        });
        
        it("should set the turtle shade correctly", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "shade", 20);
            expect(targetTurtle.painter.doSetValue).toHaveBeenCalledWith(20);
        });
        
        it("should set the turtle grey correctly", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "grey", 0.7);
            expect(targetTurtle.painter.doSetChroma).toHaveBeenCalledWith(0.7);
        });
        
        it("should set the turtle pen size correctly", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "pen size", 5);
            expect(targetTurtle.painter.doSetPensize).toHaveBeenCalledWith(5);
        });
        
        it("should set the turtle font correctly", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "font", "Times New Roman");
            expect(targetTurtle.painter.doSetFont).toHaveBeenCalledWith("Times New Roman");
        });
        
        it("should set the turtle heading correctly", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "heading", 180);
            expect(targetTurtle.painter.doSetHeading).toHaveBeenCalledWith(180);
        });
        
        it("should set the turtle x position correctly", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "x", 150);
            expect(targetTurtle.painter.doSetXY).toHaveBeenCalledWith(150, 200);
        });
        
        it("should set the turtle y position correctly", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "y", 250);
            expect(targetTurtle.painter.doSetXY).toHaveBeenCalledWith(100, 250);
        });
    });

    describe("SerializeDict", () => {
        it("should serialize the turtle dictionary correctly", () => {
            const serialized = Turtle.DictActions.SerializeDict(0, turtle);
            const expected = JSON.stringify({
                "color": "red",
                "shade": 10,
                "grey": 0.5,
                "pen size": 2,
                "font": "Arial",
                "heading": 90,
                "y": 200,
                "x": 100
            });
            expect(serialized).toBe(expected);
        });
        
        it("should include additional properties from turtleDicts", () => {
            activity.logo.turtleDicts[turtle] = {
                0: {
                    "custom": "value"
                }
            };
            const serialized = Turtle.DictActions.SerializeDict(0, turtle);
            const expected = JSON.stringify({
                "color": "red",
                "shade": 10,
                "grey": 0.5,
                "pen size": 2,
                "font": "Arial",
                "heading": 90,
                "y": 200,
                "x": 100,
                "custom": "value"
            });
            expect(serialized).toBe(expected);
        });
    });

    describe("getDict", () => {
        it("should return serialized turtle dictionary when dict is a turtle name", () => {
            const result = Turtle.DictActions.getDict("target", turtle);
            const expected = Turtle.DictActions.SerializeDict(0, turtle);
            expect(result).toBe(expected);
        });
        
        it("should return empty object JSON when dict does not exist", () => {
            activity.logo.turtleDicts[turtle] = {};
            const result = Turtle.DictActions.getDict("nonexistent", turtle);
            expect(result).toBe("{}");
        });
        
        it("should return dictionary JSON when dict exists", () => {
            activity.logo.turtleDicts[turtle] = {
                "testDict": { "key": "value" }
            };
            const result = Turtle.DictActions.getDict("testDict", turtle);
            expect(result).toBe(JSON.stringify({ "key": "value" }));
        });
        
        it("should initialize turtleDicts when it doesn't exist for the turtle", () => {
            delete activity.logo.turtleDicts[turtle];
            const result = Turtle.DictActions.getDict("nonexistent", turtle);
            expect(result).toBe("{}");
            expect(activity.logo.turtleDicts[turtle]).toEqual({});
        });
    });

    describe("showDict", () => {
        it("should display the dictionary contents", () => {
            activity.logo.turtleDicts[turtle] = {
                "testDict": { "key": "value" }
            };
            Turtle.DictActions.showDict("testDict", turtle);
            expect(activity.textMsg).toHaveBeenCalledWith(JSON.stringify({ "key": "value" }));
        });
        
        it("should display turtle information when dict is a turtle name", () => {
            const expected = Turtle.DictActions.SerializeDict(0, turtle);
            Turtle.DictActions.showDict("target", turtle);
            expect(activity.textMsg).toHaveBeenCalledWith(expected);
        });

        it("should display empty JSON when dict name does not exist", () => {
            // ensure no such dict
            activity.logo.turtleDicts[turtle] = {};
            Turtle.DictActions.showDict("nonexistentDict", turtle);
            expect(activity.textMsg).toHaveBeenCalledWith("{}");
        });
    });

    describe("setValue", () => {
        it("should set value in the dictionary", () => {
            activity.logo.turtleDicts[turtle] = {};
            Turtle.DictActions.setValue("customDict", "color", "green", turtle);
            expect(activity.logo.turtleDicts[turtle].customDict.color).toBe("green");
        });
        
        it("should create a new dictionary if it doesn't exist", () => {
            activity.logo.turtleDicts[turtle] = {};
            Turtle.DictActions.setValue("newDict", "key", "value", turtle);
            expect(activity.logo.turtleDicts[turtle].newDict.key).toBe("value");
        });
        
        it("should create a new turtleDicts entry if it doesn't exist", () => {
            delete activity.logo.turtleDicts[turtle];
            Turtle.DictActions.setValue("newDict", "key", "value", turtle);
            expect(activity.logo.turtleDicts[turtle].newDict.key).toBe("value");
        });
        
        it("should log to console when setting a value", () => {
            console.log = jest.fn();
            activity.logo.turtleDicts[turtle] = {};
            Turtle.DictActions.setValue("testDict", "key", "value", turtle);
            expect(console.log).toHaveBeenCalled();
        });
    });

    describe("getValue", () => {
        it("should return value from the dictionary", () => {
            activity.logo.turtleDicts[turtle] = {
                "testDict": { "key": "value" }
            };
            const value = Turtle.DictActions.getValue("testDict", "key", turtle);
            expect(value).toBe("value");
        });
        
        it("should return error message if dictionary does not exist", () => {
            activity.logo.turtleDicts[turtle] = {};
            const result = Turtle.DictActions.getValue("nonexistentDict", "key", turtle);
            expect(result).toBe("Dictionary with this name does not exist");
        });
        
        it("should return error message if key does not exist in dictionary", () => {
            activity.logo.turtleDicts[turtle] = {
                "testDict": { "existingKey": "value" }
            };
            const result = Turtle.DictActions.getValue("testDict", "nonexistentKey", turtle);
            expect(result).toBe("Key with this name does not exist in testDict");
        });
    });
});