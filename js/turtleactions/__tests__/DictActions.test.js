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

        global._ = jest.fn(key => key);
        global.Singer = {
            RhythmActions: {
                getNoteValue: jest.fn().mockReturnValue(4)
            }
        };
        global.getNote = jest.fn().mockReturnValue(["G", 4]);
        global.pitchToNumber = jest.fn().mockReturnValue(60);
        global.INVALIDPITCH = "Invalid pitch";
        global.getTargetTurtle = jest.fn();
        global.frequencyToPitch = jest.fn().mockReturnValue(["A", 4]);
        global.noteToObj = require("../../utils/musicutils").noteToObj;
    });

    beforeEach(() => {
        activity = {
            turtles: {
                ithTurtle: jest.fn(),
                screenX2turtleX: jest.fn(),
                screenY2turtleY: jest.fn()
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
                stroke: 2,
                font: "Arial",
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
        const simpleGetTests = [
            ["color", "red"],
            ["shade", 10],
            ["grey", 0.5],
            ["pen size", 2],
            ["font", "Arial"],
            ["heading", 90],
            ["x", 100],
            ["y", 200],
            ["notes played", 0.5]
        ];
        test.each(simpleGetTests)("should get %s correctly", (key, expected) => {
            expect(Turtle.DictActions._GetDict(0, turtle, key)).toBe(expected);
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

        it("should return G4 for the current pitch before any note is played", () => {
            targetTurtle.singer.lastNotePlayed = null;
            expect(Turtle.DictActions._GetDict(0, turtle, "current pitch")).toBe("G4");
            expect(Turtle.DictActions.getValue("target", "current pitch", turtle, 3)).toBe("G4");
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
            expect(pitchToNumber).toHaveBeenCalledWith("G", 4, "C");
        });

        it("should subtract pitchNumberOffset from the computed pitch number", () => {
            targetTurtle.singer.pitchNumberOffset = 15;
            const pitchNumber = Turtle.DictActions._GetDict(0, turtle, "pitch number");
            expect(pitchNumber).toBe(60 - 15);
        });

        it("should return 0 and show error with literal key in message", () => {
            // Use "$&" as the key — with string replacement, $& expands to the
            // matched text ("%s") and would produce "Unknown key: %s", corrupting
            // the message. The callback replacer preserves it literally.
            const result = Turtle.DictActions._GetDict(0, turtle, "$&", 5);
            expect(result).toBe(0);
            expect(activity.errorMsg).toHaveBeenCalledWith("Unknown key: $&", 5);
        });

        it("should pass blk to errorMsg and preserve $$ literally", () => {
            // "$$" inserts a literal "$" in string replacement — callback ensures
            // the key is embedded verbatim without any special-character expansion.
            Turtle.DictActions._GetDict(0, turtle, "$$", 99);
            expect(activity.errorMsg).toHaveBeenCalledWith("Unknown key: $$", 99);
        });

        it("should get the pitch number when lastNotePlayed is a frequency number", () => {
            targetTurtle.singer.lastNotePlayed = [440, 0.25];
            expect(() => {
                Turtle.DictActions._GetDict(0, turtle, "pitch number");
            }).not.toThrow();
            expect(frequencyToPitch).toHaveBeenCalledWith(440);
        });

        it("should parse multi-digit and negative octaves correctly from lastNotePlayed", () => {
            targetTurtle.singer.lastNotePlayed = ["C10", 0.25];
            Turtle.DictActions._GetDict(0, turtle, "pitch number");
            expect(pitchToNumber).toHaveBeenCalledWith("C", 10, "C");

            targetTurtle.singer.lastNotePlayed = ["A-1", 0.25];
            Turtle.DictActions._GetDict(0, turtle, "pitch number");
            expect(pitchToNumber).toHaveBeenCalledWith("A", -1, "C");
        });
    });

    describe("SetDictValue", () => {
        const setValueTests = [
            ["color", "blue", "doSetColor", ["blue"]],
            ["shade", 20, "doSetValue", [20]],
            ["grey", 0.7, "doSetChroma", [0.7]],
            ["pen size", 5, "doSetPensize", [5]],
            ["font", "Times New Roman", "doSetFont", ["Times New Roman"]],
            ["heading", 180, "doSetHeading", [180]],
            ["x", 150, "doSetXY", [150, 200]],
            ["y", 250, "doSetXY", [100, 250]]
        ];
        test.each(setValueTests)("should set %s correctly", (key, value, method, args) => {
            Turtle.DictActions.SetDictValue(0, turtle, key, value);
            expect(targetTurtle.painter[method]).toHaveBeenCalledWith(...args);
        });

        it("should handle read-only key by showing an error message", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "notes played", "value");
            const painterMethods = [
                "doSetColor",
                "doSetValue",
                "doSetChroma",
                "doSetPensize",
                "doSetFont",
                "doSetHeading",
                "doSetXY"
            ];
            painterMethods.forEach(method => {
                expect(targetTurtle.painter[method]).not.toHaveBeenCalled();
            });
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Cannot set read-only key: notes played"
            );
        });

        it("should ignore unsupported custom keys without errors", () => {
            Turtle.DictActions.SetDictValue(0, turtle, "unsupportedKey", "value");
            expect(activity.errorMsg).not.toHaveBeenCalled();
        });

        it("should handle localized read-only keys by showing a localized error message", () => {
            const originalI18n = global._;
            // Mock translation for Spanish: "notes played" -> "notas tocadas", format string -> "Cannot set read-only key: %s" (assuming format string not translated yet)
            global._ = jest.fn(msg => {
                if (msg === "notes played") return "notas tocadas";
                if (msg === "Cannot set read-only key: %s")
                    return "No se puede configurar la clave de solo lectura: %s";
                return msg;
            });

            try {
                // The user types the localized string in the UI
                Turtle.DictActions.SetDictValue(0, turtle, "notas tocadas", "value");

                expect(activity.errorMsg).toHaveBeenCalledWith(
                    "No se puede configurar la clave de solo lectura: notas tocadas"
                );
            } finally {
                // Restore original mock
                global._ = originalI18n;
            }
        });

        it("should support lowercase setDictValue alias", () => {
            Turtle.DictActions.setDictValue(0, turtle, "color", "blue");
            expect(targetTurtle.painter.doSetColor).toHaveBeenCalledWith("blue");
        });
    });

    describe("SerializeDict", () => {
        it("should not crash when turtleDicts[turtle] is undefined", () => {
            delete activity.logo.turtleDicts[turtle];
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

        it("should serialize the turtle dictionary correctly", () => {
            activity.logo.turtleDicts[turtle] = {}; // 0 not in turtleDicts[turtle]
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
                    custom: "value"
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
                testDict: { key: "value" }
            };
            const result = Turtle.DictActions.getDict("testDict", turtle);
            expect(result).toBe(JSON.stringify({ key: "value" }));
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
                testDict: { key: "value" }
            };
            Turtle.DictActions.showDict("testDict", turtle);
            expect(activity.textMsg).toHaveBeenCalledWith(JSON.stringify({ key: "value" }));
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

        it("should set value without logging to console", () => {
            const consoleSpy = jest.spyOn(console, "log");
            activity.logo.turtleDicts[turtle] = {};
            Turtle.DictActions.setValue("testDict", "key", "value", turtle);
            expect(consoleSpy).not.toHaveBeenCalled();
            expect(activity.logo.turtleDicts[turtle]["testDict"]["key"]).toBe("value");
            consoleSpy.mockRestore();
        });

        it("should set value in existing dictionary without recreating it", () => {
            activity.logo.turtleDicts[turtle] = {
                existingDict: { oldKey: "oldValue" }
            };
            Turtle.DictActions.setValue("existingDict", "newKey", "newValue", turtle);
            expect(activity.logo.turtleDicts[turtle].existingDict.oldKey).toBe("oldValue");
            expect(activity.logo.turtleDicts[turtle].existingDict.newKey).toBe("newValue");
        });

        test.each([
            ["color", "blue", "doSetColor", ["blue"]],
            ["pen size", 5, "doSetPensize", [5]],
            ["heading", 180, "doSetHeading", [180]],
            ["x", 150, "doSetXY", [150, 200]]
        ])(
            "should apply %s to the turtle when dict is a turtle name",
            (key, value, method, args) => {
                Turtle.DictActions.setValue("target", key, value, turtle);
                expect(targetTurtle.painter[method]).toHaveBeenCalledWith(...args);
                expect(activity.logo.turtleDicts[turtle]).toEqual({});
            }
        );

        it("should not store read-only turtle keys when dict is a turtle name", () => {
            Turtle.DictActions.setValue("target", "notes played", 3, turtle);
            expect(activity.logo.turtleDicts[turtle]).toEqual({});
        });

        it("should store other keys under the turtle index when dict is a turtle name", () => {
            Turtle.DictActions.setValue("target", "score", 7, turtle);
            expect(activity.logo.turtleDicts[turtle]).toEqual({ 0: { score: 7 } });
            expect(JSON.parse(Turtle.DictActions.getDict("target", turtle)).score).toBe(7);
        });
    });

    describe("getValue", () => {
        it("should return value from the dictionary", () => {
            activity.logo.turtleDicts[turtle] = {
                testDict: { key: "value" }
            };
            const value = Turtle.DictActions.getValue("testDict", "key", turtle);
            expect(value).toBe("value");
        });

        it("should return error message if dictionary does not exist", () => {
            activity.logo.turtleDicts[turtle] = {};
            const result = Turtle.DictActions.getValue("nonexistentDict", "key", turtle, 123);
            expect(result).toBe(0);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Dictionary with this name does not exist",
                123
            );
        });

        it("should return error message if key does not exist in dictionary", () => {
            activity.logo.turtleDicts[turtle] = {
                testDict: { existingKey: "value" }
            };
            const result = Turtle.DictActions.getValue("testDict", "nonexistentKey", turtle, 123);
            expect(result).toBe(0);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Key with this name does not exist in testDict",
                123
            );
        });

        it("should return localized error message if key does not exist", () => {
            const originalI18n = global._;
            global._ = jest.fn(msg => {
                if (msg === "Key with this name does not exist in %s") {
                    return "No existe una clave con este nombre en %s";
                }
                return msg;
            });
            activity.logo.turtleDicts[turtle] = { testDict: {} };
            const result = Turtle.DictActions.getValue("testDict", "nonexistentKey", turtle, 123);
            expect(result).toBe(0);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "No existe una clave con este nombre en testDict",
                123
            );
            global._ = originalI18n;
        });

        it("should initialize turtleDicts if it does not exist for the turtle", () => {
            delete activity.logo.turtleDicts[turtle];
            const result = Turtle.DictActions.getValue("testDict", "key", turtle, 123);
            expect(result).toBe(0);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Dictionary with this name does not exist",
                123
            );
            expect(activity.logo.turtleDicts[turtle]).toEqual({});
        });

        test.each([
            ["x", 100],
            ["heading", 90],
            ["pen size", 2],
            ["notes played", 0.5],
            ["current pitch", "C4"]
        ])("should return the turtle's %s when dict is a turtle name", (key, expected) => {
            expect(Turtle.DictActions.getValue("target", key, turtle, 3)).toBe(expected);
            expect(activity.errorMsg).not.toHaveBeenCalled();
        });

        it("should return a stored key when dict is a turtle name", () => {
            Turtle.DictActions.setValue("target", "score", 7, turtle);
            expect(Turtle.DictActions.getValue("target", "score", turtle, 3)).toBe(7);
        });

        it("should report a missing key and return 0 when dict is a turtle name", () => {
            const result = Turtle.DictActions.getValue("target", "score", turtle, 3);
            expect(result).toBe(0);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Key with this name does not exist in target",
                3
            );
        });

        it("should not return inherited properties as stored keys when dict is a turtle name", () => {
            Turtle.DictActions.setValue("target", "score", 7, turtle);
            const result = Turtle.DictActions.getValue("target", "toString", turtle, 3);
            expect(result).toBe(0);
            expect(activity.errorMsg).toHaveBeenCalledWith(
                "Key with this name does not exist in target",
                3
            );
        });
    });

    // Text blocks keep their English value and only translate their label, so in another
    // language a key can arrive either in English or translated.
    describe("in another language", () => {
        const spanish = {
            "pen size": "tamaño de la pluma",
            "heading": "rumbo",
            "notes played": "notas tocadas"
        };

        beforeEach(() => {
            global._.mockImplementation(key => spanish[key] || key);
        });

        afterEach(() => {
            global._.mockImplementation(key => key);
        });

        test.each([
            ["pen size", 2],
            ["tamaño de la pluma", 2],
            ["heading", 90],
            ["rumbo", 90],
            ["notes played", 0.5],
            ["notas tocadas", 0.5]
        ])("should get the turtle's %s", (key, expected) => {
            expect(Turtle.DictActions.getValue("target", key, turtle, 3)).toBe(expected);
            expect(activity.errorMsg).not.toHaveBeenCalled();
        });

        test.each(["pen size", "tamaño de la pluma"])("should set the turtle's %s", key => {
            Turtle.DictActions.setValue("target", key, 7, turtle);
            expect(targetTurtle.painter.doSetPensize).toHaveBeenCalledWith(7);
            expect(activity.logo.turtleDicts[turtle]).toEqual({});
        });

        test.each(["notes played", "notas tocadas"])(
            "should report %s as read-only and not store it",
            key => {
                Turtle.DictActions.setValue("target", key, 7, turtle);
                expect(activity.errorMsg).toHaveBeenCalledWith("Cannot set read-only key: " + key);
                expect(activity.logo.turtleDicts[turtle]).toEqual({});
            }
        );

        it("should still report an unknown key", () => {
            expect(Turtle.DictActions._GetDict(0, turtle, "tamaño", 3)).toBe(0);
            expect(activity.errorMsg).toHaveBeenCalledWith("Unknown key: tamaño", 3);
        });
    });

    describe("TurtleKeys", () => {
        it("should list every key _GetDict handles, in English", () => {
            const keys = Turtle.DictActions.TurtleKeys();
            expect(keys).toEqual([
                "color",
                "shade",
                "grey",
                "pen size",
                "font",
                "heading",
                "x",
                "y",
                "notes played",
                "note value",
                "current pitch",
                "pitch number"
            ]);
            keys.forEach(key => expect(Turtle.DictActions.IsTurtleKey(key)).toBe(true));
        });

        it("should return a copy", () => {
            Turtle.DictActions.TurtleKeys().pop();
            expect(Turtle.DictActions.TurtleKeys()).toHaveLength(12);
        });
    });
});
