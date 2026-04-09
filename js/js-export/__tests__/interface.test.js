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
JSInterface._methodArgConstraints = {};

describe("JSInterface", () => {
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

    describe("validateArgs", () => {
        beforeEach(() => {
            global.JSEditor = { logConsole: jest.fn() };
            global.SHARP = "♯";
            global.FLAT = "♭";
            global.NATURAL = "♮";
            global.DOUBLESHARP = "𝄪";
            global.DOUBLEFLAT = "𝄫";
            global.DEFAULTVOICE = "sine";
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it("returns original args when no constraints defined", () => {
            JSInterface._methodArgConstraints = {};
            expect(JSInterface.validateArgs("nonExistingMethod", [1, 2, 3])).toEqual([1, 2, 3]);
        });

        describe("string to number coercion", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "number", constraints: { min: 0, max: 100 } }]
                };
            });

            it("converts numeric string to number", () => {
                expect(JSInterface.validateArgs("testMethod", ["42"])[0]).toBe(42);
            });

            it("throws on non-numeric string when number expected", () => {
                expect(() => JSInterface.validateArgs("testMethod", ["abc"])).toThrow(
                    'TypeMismatch error: expected "number" but found "string"'
                );
            });
        });

        describe("string to boolean coercion", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "boolean", constraints: {} }]
                };
            });

            it("converts 'true' string to true", () => {
                expect(JSInterface.validateArgs("testMethod", ["true"])[0]).toBe(true);
            });

            it("converts 'false' string to false", () => {
                expect(JSInterface.validateArgs("testMethod", ["false"])[0]).toBe(false);
            });

            it("resets invalid boolean string to true and logs", () => {
                const result = JSInterface.validateArgs("testMethod", ["maybe"]);
                expect(result[0]).toBe(true);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });
        });

        describe("type mismatch", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "number", constraints: { min: 0, max: 100 } }]
                };
            });

            it("throws TypeMismatch when boolean passed for number", () => {
                expect(() => JSInterface.validateArgs("testMethod", [true])).toThrow(
                    'TypeMismatch error: expected "number" but found "boolean"'
                );
            });
        });

        describe("multiple type constraints", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [
                        [
                            { type: "number", constraints: { min: 0, max: 100 } },
                            { type: "string", constraints: { type: "any" } }
                        ]
                    ]
                };
            });

            it("accepts number when multiple types allowed", () => {
                expect(JSInterface.validateArgs("testMethod", [50])[0]).toBe(50);
            });

            it("accepts string when multiple types allowed", () => {
                expect(JSInterface.validateArgs("testMethod", ["hello"])[0]).toBe("hello");
            });

            it("throws when no type matches in multiple types", () => {
                expect(() => JSInterface.validateArgs("testMethod", [true])).toThrow(
                    /TypeMismatch error: expected one of/
                );
            });
        });

        describe("number constraints", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [
                        { type: "number", constraints: { min: 0, max: 100, integer: false } }
                    ]
                };
            });

            it("clamps below min and logs", () => {
                const result = JSInterface.validateArgs("testMethod", [-5]);
                expect(result[0]).toBe(0);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            it("clamps above max and logs", () => {
                const result = JSInterface.validateArgs("testMethod", [150]);
                expect(result[0]).toBe(100);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            it("passes value within range unchanged", () => {
                expect(JSInterface.validateArgs("testMethod", [50])[0]).toBe(50);
            });
        });

        describe("integer constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [
                        { type: "number", constraints: { min: 0, max: 100, integer: true } }
                    ]
                };
            });

            it("floors non-integer and logs", () => {
                const result = JSInterface.validateArgs("testMethod", [3.7]);
                expect(result[0]).toBe(3);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            it("passes integer unchanged", () => {
                expect(JSInterface.validateArgs("testMethod", [4])[0]).toBe(4);
            });
        });

        describe("function async constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "function", constraints: { async: true } }]
                };
            });

            it("throws when non-async function passed", () => {
                expect(() => JSInterface.validateArgs("testMethod", [function () {}])).toThrow(
                    /expected "async" function/
                );
            });

            it("accepts async function", () => {
                const result = JSInterface.validateArgs("testMethod", [async function () {}]);
                expect(typeof result[0]).toBe("function");
            });
        });

        describe("solfegeorletter constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "string", constraints: { type: "solfegeorletter" } }]
                };
            });

            it("accepts solfege note", () => {
                expect(JSInterface.validateArgs("testMethod", ["sol"])[0]).toBe("sol");
            });

            it("accepts letter note and uppercases it", () => {
                expect(JSInterface.validateArgs("testMethod", ["c"])[0]).toBe("C");
            });

            it("resets invalid note to sol and logs", () => {
                const result = JSInterface.validateArgs("testMethod", ["xyz"]);
                expect(result[0]).toBe("sol");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            it("handles solfege with sharp accidental", () => {
                const result = JSInterface.validateArgs("testMethod", ["sol ♯"]);
                expect(result[0]).toBe("sol♯");
            });

            it("handles letter with flat accidental", () => {
                const result = JSInterface.validateArgs("testMethod", ["c ♭"]);
                expect(result[0]).toBe("C♭");
            });
        });

        describe("accidental constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "string", constraints: { type: "accidental" } }]
                };
            });

            it("accepts SHARP symbol and returns sharp output", () => {
                const result = JSInterface.validateArgs("testMethod", ["♯"]);
                expect(result[0]).toContain("sharp");
            });

            it("accepts 'flat' string and returns flat output", () => {
                const result = JSInterface.validateArgs("testMethod", ["flat"]);
                expect(result[0]).toContain("flat");
            });

            it("passes unknown accidental unchanged", () => {
                const result = JSInterface.validateArgs("testMethod", ["unknown"]);
                expect(result[0]).toBe("unknown");
            });
        });

        describe("oneof constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [
                        {
                            type: "string",
                            constraints: {
                                type: "oneof",
                                values: ["slow", "medium", "fast"],
                                defaultIndex: 1
                            }
                        }
                    ]
                };
            });

            it("accepts valid value case-insensitively", () => {
                expect(JSInterface.validateArgs("testMethod", ["FAST"])[0]).toBe("fast");
            });

            it("resets invalid value to default and logs", () => {
                const result = JSInterface.validateArgs("testMethod", ["invalid"]);
                expect(result[0]).toBe("medium");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });
        });

        describe("synth constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "string", constraints: { type: "synth" } }]
                };
            });

            it("accepts valid instrument", () => {
                expect(JSInterface.validateArgs("testMethod", ["piano"])[0]).toBe("piano");
            });

            it("resets invalid instrument to DEFAULTVOICE and logs", () => {
                const result = JSInterface.validateArgs("testMethod", ["kazoo"]);
                expect(result[0]).toBe("sine");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });
        });

        describe("drum constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "string", constraints: { type: "drum" } }]
                };
            });

            it("accepts valid drum", () => {
                expect(JSInterface.validateArgs("testMethod", ["snare drum"])[0]).toBe(
                    "snare drum"
                );
            });

            it("resets invalid drum to kick drum and logs", () => {
                const result = JSInterface.validateArgs("testMethod", ["bongo"]);
                expect(result[0]).toBe("kick drum");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });
        });

        describe("noise constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "string", constraints: { type: "noise" } }]
                };
            });

            it("converts white noise to noise1", () => {
                expect(JSInterface.validateArgs("testMethod", ["white noise"])[0]).toBe("noise1");
            });

            it("converts brown noise to noise2", () => {
                expect(JSInterface.validateArgs("testMethod", ["brown noise"])[0]).toBe("noise2");
            });

            it("converts pink noise to noise3", () => {
                expect(JSInterface.validateArgs("testMethod", ["pink noise"])[0]).toBe("noise3");
            });

            it("resets invalid noise to noise1 and logs", () => {
                const result = JSInterface.validateArgs("testMethod", ["loud noise"]);
                expect(result[0]).toBe("noise1");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });
        });

        describe("letterkey constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "string", constraints: { type: "letterkey" } }]
                };
            });

            it("accepts valid letter key and uppercases it", () => {
                expect(JSInterface.validateArgs("testMethod", ["c"])[0]).toBe("C");
            });

            it("resets invalid letter key to C and logs", () => {
                const result = JSInterface.validateArgs("testMethod", ["x"]);
                expect(result[0]).toBe("C");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            it("handles letter key with sharp accidental", () => {
                const result = JSInterface.validateArgs("testMethod", ["g ♯"]);
                expect(result[0]).toBe("G♯");
            });
        });
    });
});
