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

        test("returns original args when no constraints defined", () => {
            JSInterface._methodArgConstraints = {};
            expect(JSInterface.validateArgs("nonExistingMethod", [1, 2, 3])).toEqual([1, 2, 3]);
        });

        describe("string to number coercion", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "number", constraints: { min: 0, max: 100 } }]
                };
            });

            test("converts numeric string to number", () => {
                expect(JSInterface.validateArgs("testMethod", ["42"])[0]).toBe(42);
            });

            test("throws on non-numeric string when number expected", () => {
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

            test("converts 'true' string to true", () => {
                expect(JSInterface.validateArgs("testMethod", ["true"])[0]).toBe(true);
            });

            test("converts 'false' string to false", () => {
                expect(JSInterface.validateArgs("testMethod", ["false"])[0]).toBe(false);
            });

            test("resets invalid boolean string to true and logs", () => {
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

            test("throws TypeMismatch when boolean passed for number", () => {
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

            test("accepts number when multiple types allowed", () => {
                expect(JSInterface.validateArgs("testMethod", [50])[0]).toBe(50);
            });

            test("accepts string when multiple types allowed", () => {
                expect(JSInterface.validateArgs("testMethod", ["hello"])[0]).toBe("hello");
            });

            test("throws when no type matches in multiple types", () => {
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

            test("clamps below min and logs", () => {
                const result = JSInterface.validateArgs("testMethod", [-5]);
                expect(result[0]).toBe(0);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            test("clamps above max and logs", () => {
                const result = JSInterface.validateArgs("testMethod", [150]);
                expect(result[0]).toBe(100);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            test("passes value within range unchanged", () => {
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

            test("floors non-integer and logs", () => {
                const result = JSInterface.validateArgs("testMethod", [3.7]);
                expect(result[0]).toBe(3);
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            test("passes integer unchanged", () => {
                expect(JSInterface.validateArgs("testMethod", [4])[0]).toBe(4);
            });
        });

        describe("function async constraint", () => {
            beforeEach(() => {
                JSInterface._methodArgConstraints = {
                    testMethod: [{ type: "function", constraints: { async: true } }]
                };
            });

            test("throws when non-async function passed", () => {
                expect(() => JSInterface.validateArgs("testMethod", [function () {}])).toThrow(
                    /expected "async" function/
                );
            });

            test("accepts async function", () => {
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

            test("accepts solfege note", () => {
                expect(JSInterface.validateArgs("testMethod", ["sol"])[0]).toBe("sol");
            });

            test("accepts letter note and uppercases it", () => {
                expect(JSInterface.validateArgs("testMethod", ["c"])[0]).toBe("C");
            });

            test("resets invalid note to sol and logs", () => {
                const result = JSInterface.validateArgs("testMethod", ["xyz"]);
                expect(result[0]).toBe("sol");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            test("handles solfege with sharp accidental", () => {
                const result = JSInterface.validateArgs("testMethod", ["sol ♯"]);
                expect(result[0]).toBe("sol♯");
            });

            test("handles letter with flat accidental", () => {
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

            test("accepts SHARP symbol and returns sharp output", () => {
                const result = JSInterface.validateArgs("testMethod", ["♯"]);
                expect(result[0]).toContain("sharp");
            });

            test("accepts 'flat' string and returns flat output", () => {
                const result = JSInterface.validateArgs("testMethod", ["flat"]);
                expect(result[0]).toContain("flat");
            });

            test("passes unknown accidental unchanged", () => {
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

            test("accepts valid value case-insensitively", () => {
                expect(JSInterface.validateArgs("testMethod", ["FAST"])[0]).toBe("fast");
            });

            test("resets invalid value to default and logs", () => {
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

            test("accepts valid instrument", () => {
                expect(JSInterface.validateArgs("testMethod", ["piano"])[0]).toBe("piano");
            });

            test("resets invalid instrument to DEFAULTVOICE and logs", () => {
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

            test("accepts valid drum", () => {
                expect(JSInterface.validateArgs("testMethod", ["snare drum"])[0]).toBe(
                    "snare drum"
                );
            });

            test("resets invalid drum to kick drum and logs", () => {
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

            test("converts white noise to noise1", () => {
                expect(JSInterface.validateArgs("testMethod", ["white noise"])[0]).toBe("noise1");
            });

            test("converts brown noise to noise2", () => {
                expect(JSInterface.validateArgs("testMethod", ["brown noise"])[0]).toBe("noise2");
            });

            test("converts pink noise to noise3", () => {
                expect(JSInterface.validateArgs("testMethod", ["pink noise"])[0]).toBe("noise3");
            });

            test("resets invalid noise to noise1 and logs", () => {
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

            test("accepts valid letter key and uppercases it", () => {
                expect(JSInterface.validateArgs("testMethod", ["c"])[0]).toBe("C");
            });

            test("resets invalid letter key to C and logs", () => {
                const result = JSInterface.validateArgs("testMethod", ["x"]);
                expect(result[0]).toBe("C");
                expect(JSEditor.logConsole).toHaveBeenCalled();
            });

            test("handles letter key with sharp accidental", () => {
                const result = JSInterface.validateArgs("testMethod", ["g ♯"]);
                expect(result[0]).toBe("G♯");
            });
        });
    });
});
