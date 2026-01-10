/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Justin Charles
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
const JSInterface = require("../interface");
global.JSInterface = JSInterface;
require("../constraints");
global.JSEditor = {
    logConsole: jest.fn()
};

global.DEFAULTVOICE = "piano";
global.SHARP = "♯";
global.FLAT = "♭";
global.NATURAL = "♮";
global.DOUBLESHARP = "𝄪";
global.DOUBLEFLAT = "𝄫";

describe("JSInterface", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe("Utility Checks", () => {
        describe("isClampBlock", () => {
            it("should return true for a known clamp block", () => {
                expect(JSInterface.isClampBlock("newnote")).toBe(true);
            });

            it("should return false for an unknown block", () => {
                expect(JSInterface.isClampBlock("nonexistent")).toBe(false);
            });
        });
        describe("isSetter", () => {
            it("should return true for a valid setter block", () => {
                expect(JSInterface.isSetter("pickup")).toBe(true);
            });

            it("should return false for a block that is not a setter", () => {
                expect(JSInterface.isSetter("newnote")).toBe(false);
            });
        });
        describe("isGetter", () => {
            it("should return true for a valid getter block", () => {
                expect(JSInterface.isGetter("mynotevalue")).toBe(true);
            });

            it("should return false for a block that is not a getter", () => {
                expect(JSInterface.isGetter("pickup")).toBe(false);
            });
        });
        describe("isMethod", () => {
            it("should return true for a valid method block", () => {
                expect(JSInterface.isMethod("newnote")).toBe(true);
            });

            it("should return false for a block that is not a method", () => {
                expect(JSInterface.isMethod("pickup")).toBe(false);
            });
        });
        describe("methodReturns", () => {
            it("should return true for a method that has a return value", () => {
                expect(JSInterface.methodReturns("getDict")).toBe(true);
            });

            it("should return false for a method that does not have a return value", () => {
                expect(JSInterface.methodReturns("newnote")).toBe(false);
            });
        });
        describe("Name Lookups", () => {
            it("should return the correct setter name", () => {
                expect(JSInterface.getSetterName("pickup")).toBe("PICKUP");
                expect(JSInterface.getSetterName("newnote")).toBeNull();
            });
            it("should return the correct getter name", () => {
                expect(JSInterface.getGetterName("mynotevalue")).toBe("NOTEVALUE");
                expect(JSInterface.getGetterName("pickup")).toBeNull();
            });
            it("should return the correct method name", () => {
                expect(JSInterface.getMethodName("newnote")).toBe("playNote");
                expect(JSInterface.getMethodName("pickup")).toBeNull();
            });
        });
        describe("String Constraints (Letter Key)", () => {
            it("should handle valid letter keys", () => {
                const result = JSInterface.validateArgs("setKey", ["C", "major"]);
                expect(result[0]).toBe("C");
            });

            it("should handle letter keys with accidentals", () => {
                const result = JSInterface.validateArgs("setKey", ["D flat", "major"]);
                expect(result[0]).toBe("D" + global.FLAT);
            });

            it("should default to 'C' for invalid letter keys", () => {
                const result = JSInterface.validateArgs("setKey", ["invalid", "major"]);
                expect(result[0]).toBe("C");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });
        });
        describe("Noise Type Variations", () => {
            it("should handle brown noise", () => {
                const result = JSInterface.validateArgs("playNoise", ["brown noise"]);
                expect(result[0]).toBe("noise2");
            });

            it("should handle pink noise", () => {
                const result = JSInterface.validateArgs("playNoise", ["pink noise"]);
                expect(result[0]).toBe("noise3");
            });

            it("should default to noise1 for invalid noise", () => {
                const result = JSInterface.validateArgs("playNoise", ["invalid noise"]);
                expect(result[0]).toBe("noise1");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });
        });
        describe("Accidental Type Mapping - Complete", () => {
            it("should handle flat accidental", () => {
                const result = JSInterface.validateArgs("setAccidental", ["flat", async () => {}]);
                expect(result[0]).toBe("flat " + global.FLAT);
            });

            it("should handle natural accidental", () => {
                const result = JSInterface.validateArgs("setAccidental", [
                    "natural",
                    async () => {}
                ]);
                expect(result[0]).toBe("natural " + global.NATURAL);
            });

            it("should handle double sharp accidental", () => {
                const result = JSInterface.validateArgs("setAccidental", [
                    "doublesharp",
                    async () => {}
                ]);
                expect(result[0]).toBe("double sharp " + global.DOUBLESHARP);
            });

            it("should handle double flat accidental", () => {
                const result = JSInterface.validateArgs("setAccidental", [
                    "doubleflat",
                    async () => {}
                ]);
                expect(result[0]).toBe("double flat " + global.DOUBLEFLAT);
            });

            it("should handle accidental symbols directly", () => {
                const result = JSInterface.validateArgs("setAccidental", [
                    global.SHARP,
                    async () => {}
                ]);
                expect(result[0]).toBe("sharp " + global.SHARP);
            });
        });
        describe("Function Constraints - Async Validation", () => {
            it("should throw error for non-async function when async is required", () => {
                expect(() => {
                    JSInterface.validateArgs("playNote", [100, function () {}]); // Regular function instead of async
                }).toThrow('expected "async" function');
            });
        });
        describe("Type Mismatch Errors", () => {
            it("should throw error for completely wrong type that cannot be coerced", () => {
                expect(() => {
                    JSInterface.validateArgs("setMeter", [true, 4]); // boolean where number expected
                }).toThrow("TypeMismatch error");
            });

            it("should throw error for object where primitive expected", () => {
                expect(() => {
                    JSInterface.validateArgs("playNote", [{}, async () => {}]);
                }).toThrow("TypeMismatch error");
            });
        });
        describe("Numeric Constraints - Edge Cases", () => {
            it("should accept values at exact minimum", () => {
                const result = JSInterface.validateArgs("playNote", [0, async () => {}]);
                expect(result[0]).toBe(0);
                expect(JSEditor.logConsole).not.toHaveBeenCalled();
            });

            it("should accept values at exact maximum", () => {
                const result = JSInterface.validateArgs("playNote", [1000, async () => {}]);
                expect(result[0]).toBe(1000);
                expect(JSEditor.logConsole).not.toHaveBeenCalled();
            });

            it("should not truncate integers when already integer", () => {
                const result = JSInterface.validateArgs("setMeter", [4, 4]);
                expect(result[0]).toBe(4);
            });
        });
        describe("Solfege/Letter Notes - Additional Cases", () => {
            it("should handle uppercase solfege", () => {
                const result = JSInterface.validateArgs("playPitch", ["DO", 4]);
                expect(result[0]).toBe("do");
            });

            it("should handle mixed case letters", () => {
                const result = JSInterface.validateArgs("playPitch", ["c", 4]);
                expect(result[0]).toBe("C");
            });

            it("should handle note with double flat accidental", () => {
                const result = JSInterface.validateArgs("playPitch", ["C doubleflat", 4]);
                expect(result[0]).toBe("C" + global.DOUBLEFLAT);
            });

            it("should handle note with double sharp accidental", () => {
                const result = JSInterface.validateArgs("playPitch", ["D doublesharp", 4]);
                expect(result[0]).toBe("D" + global.DOUBLESHARP);
            });
        });
        describe("Synth Type Validation - Extended", () => {
            it("should handle various valid instruments", () => {
                const instruments = ["violin", "guitar", "saxophone", "sine", "square"];
                instruments.forEach(inst => {
                    const result = JSInterface.validateArgs("setInstrument", [
                        inst,
                        async () => {}
                    ]);
                    expect(result[0]).toBe(inst);
                });
            });
        });
        describe("rearrangeMethodArgs", () => {
            it("should rearrange the arguments for methods present in the lookup", () => {
                const args = [1, 2, 3];
                expect(JSInterface.rearrangeMethodArgs("setDict", args)).toEqual([2, 3, 1]);
            });

            it("should return the original args if no rearrangement is required", () => {
                const args = [1, 2, 3];
                expect(JSInterface.rearrangeMethodArgs("nonExistingMethod", args)).toEqual(args);
            });
        });
    });

    describe("getSetterName", () => {
        it("should return the correct setter name when available", () => {
            expect(JSInterface.getSetterName("pickup")).toBe("PICKUP");
        });

        it("should return null when no setter exists for the given block", () => {
            expect(JSInterface.getSetterName("newnote")).toBeNull();
        });
    });

    describe("getGetterName", () => {
        it("should return the correct getter name when available", () => {
            expect(JSInterface.getGetterName("mynotevalue")).toBe("NOTEVALUE");
        });

        it("should return null when no getter exists for the given block", () => {
            expect(JSInterface.getGetterName("pickup")).toBeNull();
        });
    });

    describe("getMethodName", () => {
        it("should return the correct method name when available", () => {
            expect(JSInterface.getMethodName("newnote")).toBe("playNote");
        });

        it("should return null when no method exists for the given block", () => {
            expect(JSInterface.getMethodName("pickup")).toBeNull();
        });
    });

    describe("validateArgs", () => {
        it("should return the original args when no constraints are defined for the method", () => {
            const args = [1, 2, 3];
            expect(JSInterface.validateArgs("nonExistingMethod", args)).toEqual(args);
        });
        describe("Type Validation & Coercion", () => {
            it("should coerce string numbers to number type", () => {
                // playNote expects number at index 0
                const result = JSInterface.validateArgs("playNote", ["100", async () => {}]);
                expect(typeof result[0]).toBe("number");
                expect(result[0]).toBe(100);
            });

            it("should throw error for invalid string-to-number coercion", () => {
                expect(() => {
                    JSInterface.validateArgs("playNote", ["invalid", async () => {}]);
                }).toThrow("TypeMismatch error");
            });

            it("should coerce string booleans", () => {
                // MOVABLEDO expects boolean at index 0
                const trueResult = JSInterface.validateArgs("MOVABLEDO", ["true"]);
                expect(trueResult[0]).toBe(true);

                const falseResult = JSInterface.validateArgs("MOVABLEDO", ["false"]);
                expect(falseResult[0]).toBe(false);
            });

            it("should default invalid boolean strings to true and log warning", () => {
                const result = JSInterface.validateArgs("MOVABLEDO", ["notaboolean"]);
                expect(result[0]).toBe(true);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });
        });
        describe("Numeric Constraints", () => {
            it("should clamp values to minimum", () => {
                // playNote min is 0
                const result = JSInterface.validateArgs("playNote", [-10, async () => {}]);
                expect(result[0]).toBe(0);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            it("should clamp values to maximum", () => {
                // playNote max is 1000
                const result = JSInterface.validateArgs("playNote", [2000, async () => {}]);
                expect(result[0]).toBe(1000);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            it("should truncate non-integers if integer constraint is true", () => {
                // setMeter expects integer
                const result = JSInterface.validateArgs("setMeter", [4.5, 4]);
                expect(result[0]).toBe(4);
            });
        });
        describe("String Constraints (Solfege/Letter)", () => {
            it("should handle valid solfege", () => {
                const result = JSInterface.validateArgs("playPitch", ["do", 4]);
                expect(result[0]).toBe("do");
            });

            it("should handle valid letter notes", () => {
                const result = JSInterface.validateArgs("playPitch", ["C", 4]);
                expect(result[0]).toBe("C");
            });

            it("should handle accidentals in strings", () => {
                const result = JSInterface.validateArgs("playPitch", ["C sharp", 4]);
                expect(result[0]).toBe("C" + global.SHARP);
            });

            it("should default to 'sol' for invalid notes", () => {
                const result = JSInterface.validateArgs("playPitch", ["invalid", 4]);
                expect(result[0]).toBe("sol");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });
        });
        describe("Specialized Types", () => {
            it("should handle 'accidental' type mapping", () => {
                // setAccidental expects accidental string
                const result = JSInterface.validateArgs("setAccidental", ["sharp", async () => {}]);
                expect(result[0]).toBe("sharp " + global.SHARP);
            });

            it("should handle 'synth' type validation", () => {
                // setInstrument
                const valid = JSInterface.validateArgs("setInstrument", ["piano", async () => {}]);
                expect(valid[0]).toBe("piano");

                const invalid = JSInterface.validateArgs("setInstrument", [
                    "kazoo",
                    async () => {}
                ]);
                expect(invalid[0]).toBe(global.DEFAULTVOICE); // Should default
            });

            it("should handle 'drum' type validation", () => {
                // playDrum
                const valid = JSInterface.validateArgs("playDrum", ["snare drum"]);
                expect(valid[0]).toBe("snare drum");

                const invalid = JSInterface.validateArgs("playDrum", ["trash can"]);
                expect(invalid[0]).toBe("kick drum"); // Default
            });

            it("should handle 'noise' type mapping", () => {
                // playNoise
                const result = JSInterface.validateArgs("playNoise", ["white noise"]);
                expect(result[0]).toBe("noise1");
            });

            it("should handle 'oneof' enum constraints", () => {
                // setTemperament expects one of specific values
                const valid = JSInterface.validateArgs("setTemperament", ["equal", "C", 4]);
                expect(valid[0]).toBe("equal");

                const invalid = JSInterface.validateArgs("setTemperament", ["bad_temp", "C", 4]);
                expect(invalid[0]).toBe("equal"); // defaults to index 0
            });
        });
        describe("Overloaded Methods (Array of Constraints)", () => {
            it("should validate against the matching signature for setValue (setDict)", () => {
                const result = JSInterface.validateArgs("setValue", ["key", 5]);
                expect(result[0]).toBe("key");
                expect(result[1]).toBe(5);
            });

            it("should return arguments unchanged when no signature matches", () => {
                const result = JSInterface.validateArgs("setValue", [123, 123]);
                expect(result[0]).toBe(123);
                expect(result[1]).toBe(123);
            });
        });
    });
});
