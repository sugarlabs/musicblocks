/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2024 omsuneri
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

// A basic test file in jest framework for the mathutils.js
const MathUtility = require("../mathutils");

// Mock SOLFEGENAMES for testing doRandom function
const SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
global.SOLFEGENAMES = SOLFEGENAMES;

describe("MathUtility", () => {
    describe("doRandom", () => {
        test("returns random number between two numbers", () => {
            const result = MathUtility.doRandom(1, 10);
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(10);
        });

        test("returns random solfege array between two solfege names", () => {
            const result = MathUtility.doRandom("do", "sol", 4);
            expect(result).toHaveLength(2);
            expect(SOLFEGENAMES).toContain(result[0]);
            expect(Number(result[1])).toBeGreaterThanOrEqual(4);
        });

        test("throws error for invalid inputs", () => {
            expect(() => MathUtility.doRandom("invalid", 10)).toThrow("NanError");
        });

        // Edge case tests
        test("handles swapped min/max (n1 > n2)", () => {
            const result = MathUtility.doRandom(10, 1);
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(10);
        });

        test("returns same number when min equals max", () => {
            const result = MathUtility.doRandom(5, 5);
            expect(result).toBe(5);
        });

        test("handles negative number range", () => {
            const result = MathUtility.doRandom(-10, -1);
            expect(result).toBeGreaterThanOrEqual(-10);
            expect(result).toBeLessThanOrEqual(-1);
        });

        test("handles range crossing zero", () => {
            const result = MathUtility.doRandom(-5, 5);
            expect(result).toBeGreaterThanOrEqual(-5);
            expect(result).toBeLessThanOrEqual(5);
        });

        test("returns solfege with swapped order (n1 > n2 in solfege)", () => {
            const result = MathUtility.doRandom("sol", "do", 4);
            expect(result).toHaveLength(2);
            expect(SOLFEGENAMES).toContain(result[0]);
        });

        test("returns solfege without octave parameter (default octave)", () => {
            const result = MathUtility.doRandom("do", "mi");
            expect(result).toHaveLength(2);
            expect(SOLFEGENAMES).toContain(result[0]);
            expect(Number(result[1])).toBeGreaterThanOrEqual(4);
        });

        test("throws error when mixing number and string", () => {
            expect(() => MathUtility.doRandom(1, "do")).toThrow("NanError");
        });

        test("throws error for one valid solfege and one invalid", () => {
            expect(() => MathUtility.doRandom("do", "invalid")).toThrow("NanError");
        });
    });

    describe("doOneOf", () => {
        test("returns either a or b", () => {
            const result = MathUtility.doOneOf("a", "b");
            expect(["a", "b"]).toContain(result);
        });

        // Edge case tests
        test("works with numbers", () => {
            const result = MathUtility.doOneOf(1, 2);
            expect([1, 2]).toContain(result);
        });

        test("works with same values", () => {
            const result = MathUtility.doOneOf("same", "same");
            expect(result).toBe("same");
        });

        test("works with null values", () => {
            const result = MathUtility.doOneOf(null, "b");
            expect([null, "b"]).toContain(result);
        });

        test("works with undefined values", () => {
            const result = MathUtility.doOneOf(undefined, "b");
            expect([undefined, "b"]).toContain(result);
        });

        test("works with objects", () => {
            const obj1 = { a: 1 };
            const obj2 = { b: 2 };
            const result = MathUtility.doOneOf(obj1, obj2);
            expect([obj1, obj2]).toContain(result);
        });
    });

    describe("doMod", () => {
        test("calculates modulus correctly", () => {
            expect(MathUtility.doMod(10, 3)).toBe(1);
        });

        test("throws error for invalid inputs", () => {
            expect(() => MathUtility.doMod("a", 3)).toThrow("NanError");
        });

        // Edge case tests
        test("handles negative dividend", () => {
            expect(MathUtility.doMod(-10, 3)).toBe(-1);
        });

        test("handles negative divisor", () => {
            expect(MathUtility.doMod(10, -3)).toBe(1);
        });

        test("handles both negative", () => {
            expect(MathUtility.doMod(-10, -3)).toBe(-1);
        });

        test("returns 0 when evenly divisible", () => {
            expect(MathUtility.doMod(9, 3)).toBe(0);
        });

        test("handles modulus with zero dividend", () => {
            expect(MathUtility.doMod(0, 5)).toBe(0);
        });

        test("handles floating point numbers", () => {
            expect(MathUtility.doMod(5.5, 2)).toBeCloseTo(1.5);
        });

        test("throws error when second arg is string", () => {
            expect(() => MathUtility.doMod(10, "a")).toThrow("NanError");
        });
    });

    describe("doSqrt", () => {
        test("calculates square root", () => {
            expect(MathUtility.doSqrt(9)).toBe(3);
        });

        test("throws error for negative input", () => {
            expect(() => MathUtility.doSqrt(-1)).toThrow("NoSqrtError");
        });

        // Edge case tests
        test("returns 0 for sqrt of 0", () => {
            expect(MathUtility.doSqrt(0)).toBe(0);
        });

        test("returns 1 for sqrt of 1", () => {
            expect(MathUtility.doSqrt(1)).toBe(1);
        });

        test("handles non-perfect squares", () => {
            expect(MathUtility.doSqrt(2)).toBeCloseTo(1.414, 2);
        });

        test("handles large numbers", () => {
            expect(MathUtility.doSqrt(1000000)).toBe(1000);
        });

        test("handles decimal numbers", () => {
            expect(MathUtility.doSqrt(0.25)).toBe(0.5);
        });

        test("throws NanError for string input", () => {
            expect(() => MathUtility.doSqrt("9")).toThrow("NanError");
        });
    });

    describe("doSin", () => {
        test("calculates sine of 0 degrees", () => {
            expect(MathUtility.doSin(0)).toBeCloseTo(0, 10);
        });

        test("calculates sine of 90 degrees", () => {
            expect(MathUtility.doSin(90)).toBeCloseTo(1, 10);
        });

        test("calculates sine of 180 degrees", () => {
            expect(MathUtility.doSin(180)).toBeCloseTo(0, 10);
        });

        test("calculates sine of 30 degrees", () => {
            expect(MathUtility.doSin(30)).toBeCloseTo(0.5, 10);
        });

        test("throws NanError for string input", () => {
            expect(() => MathUtility.doSin("90")).toThrow("NanError");
        });
    });

    describe("doCos", () => {
        test("calculates cosine of 0 degrees", () => {
            expect(MathUtility.doCos(0)).toBeCloseTo(1, 10);
        });

        test("calculates cosine of 90 degrees", () => {
            expect(MathUtility.doCos(90)).toBeCloseTo(0, 10);
        });

        test("calculates cosine of 180 degrees", () => {
            expect(MathUtility.doCos(180)).toBeCloseTo(-1, 10);
        });

        test("calculates cosine of 60 degrees", () => {
            expect(MathUtility.doCos(60)).toBeCloseTo(0.5, 10);
        });

        test("throws NanError for string input", () => {
            expect(() => MathUtility.doCos("0")).toThrow("NanError");
        });
    });

    describe("doLog", () => {
        test("calculates natural log of e", () => {
            expect(MathUtility.doLog(Math.E)).toBeCloseTo(1, 10);
        });

        test("calculates natural log of 1", () => {
            expect(MathUtility.doLog(1)).toBeCloseTo(0, 10);
        });

        test("calculates natural log of 10", () => {
            expect(MathUtility.doLog(10)).toBeCloseTo(2.302585, 5);
        });

        test("throws NanError for zero", () => {
            expect(() => MathUtility.doLog(0)).toThrow("NanError");
        });

        test("throws NanError for negative input", () => {
            expect(() => MathUtility.doLog(-1)).toThrow("NanError");
        });

        test("throws NanError for string input", () => {
            expect(() => MathUtility.doLog("10")).toThrow("NanError");
        });
    });

    describe("doPlus", () => {
        test("adds two numbers", () => {
            expect(MathUtility.doPlus(2, 3)).toBe(5);
        });

        test("concatenates strings", () => {
            expect(MathUtility.doPlus("a", "b")).toBe("ab");
        });

        // Edge case tests
        test("concatenates number and string", () => {
            expect(MathUtility.doPlus(1, "b")).toBe("1b");
        });

        test("concatenates string and number", () => {
            expect(MathUtility.doPlus("a", 2)).toBe("a2");
        });

        test("handles negative numbers", () => {
            expect(MathUtility.doPlus(-2, 3)).toBe(1);
        });

        test("handles zero", () => {
            expect(MathUtility.doPlus(0, 5)).toBe(5);
        });

        test("handles floating point addition", () => {
            expect(MathUtility.doPlus(0.1, 0.2)).toBeCloseTo(0.3);
        });

        test("concatenates empty strings", () => {
            expect(MathUtility.doPlus("", "")).toBe("");
        });

        test("concatenates with empty string", () => {
            expect(MathUtility.doPlus("hello", "")).toBe("hello");
        });
    });

    describe("doMinus", () => {
        test("subtracts numbers", () => {
            expect(MathUtility.doMinus(5, 3)).toBe(2);
        });

        test("throws error for string inputs", () => {
            expect(() => MathUtility.doMinus("a", 3)).toThrow("NanError");
        });

        // Edge case tests
        test("handles negative result", () => {
            expect(MathUtility.doMinus(3, 5)).toBe(-2);
        });

        test("handles subtracting negative numbers", () => {
            expect(MathUtility.doMinus(5, -3)).toBe(8);
        });

        test("handles both negative numbers", () => {
            expect(MathUtility.doMinus(-5, -3)).toBe(-2);
        });

        test("returns 0 when subtracting same numbers", () => {
            expect(MathUtility.doMinus(5, 5)).toBe(0);
        });

        test("handles floating point subtraction", () => {
            expect(MathUtility.doMinus(0.3, 0.1)).toBeCloseTo(0.2);
        });

        test("throws error when second arg is string", () => {
            expect(() => MathUtility.doMinus(5, "3")).toThrow("NanError");
        });
    });

    describe("doMultiply", () => {
        test("multiplies numbers", () => {
            expect(MathUtility.doMultiply(2, 3)).toBe(6);
        });

        test("throws error for string inputs", () => {
            expect(() => MathUtility.doMultiply("a", 3)).toThrow("NanError");
        });

        // Edge case tests
        test("handles multiplication by zero", () => {
            expect(MathUtility.doMultiply(5, 0)).toBe(0);
        });

        test("handles multiplication by one", () => {
            expect(MathUtility.doMultiply(5, 1)).toBe(5);
        });

        test("handles negative multiplication", () => {
            expect(MathUtility.doMultiply(-2, 3)).toBe(-6);
        });

        test("handles both negative", () => {
            expect(MathUtility.doMultiply(-2, -3)).toBe(6);
        });

        test("handles floating point multiplication", () => {
            expect(MathUtility.doMultiply(0.1, 0.2)).toBeCloseTo(0.02);
        });

        test("throws error when second arg is string", () => {
            expect(() => MathUtility.doMultiply(5, "3")).toThrow("NanError");
        });
    });

    describe("doDivide", () => {
        test("divides numbers", () => {
            expect(MathUtility.doDivide(6, 2)).toBe(3);
        });

        test("throws error for division by zero", () => {
            expect(() => MathUtility.doDivide(6, 0)).toThrow("DivByZeroError");
        });

        // Edge case tests
        test("handles division resulting in decimal", () => {
            expect(MathUtility.doDivide(5, 2)).toBe(2.5);
        });

        test("handles division of zero", () => {
            expect(MathUtility.doDivide(0, 5)).toBe(0);
        });

        test("handles negative dividend", () => {
            expect(MathUtility.doDivide(-6, 2)).toBe(-3);
        });

        test("handles negative divisor", () => {
            expect(MathUtility.doDivide(6, -2)).toBe(-3);
        });

        test("handles both negative", () => {
            expect(MathUtility.doDivide(-6, -2)).toBe(3);
        });

        test("throws NanError for string dividend", () => {
            expect(() => MathUtility.doDivide("6", 2)).toThrow("NanError");
        });

        test("throws NanError for string divisor", () => {
            expect(() => MathUtility.doDivide(6, "2")).toThrow("NanError");
        });
    });

    describe("doCalculateDistance", () => {
        test("calculates Euclidean distance", () => {
            expect(MathUtility.doCalculateDistance(0, 0, 3, 4)).toBe(5);
        });

        // Edge case tests
        test("returns 0 for same point", () => {
            expect(MathUtility.doCalculateDistance(5, 5, 5, 5)).toBe(0);
        });

        test("handles negative coordinates", () => {
            expect(MathUtility.doCalculateDistance(-3, -4, 0, 0)).toBe(5);
        });

        test("handles distance along x-axis only", () => {
            expect(MathUtility.doCalculateDistance(0, 0, 5, 0)).toBe(5);
        });

        test("handles distance along y-axis only", () => {
            expect(MathUtility.doCalculateDistance(0, 0, 0, 5)).toBe(5);
        });

        test("handles floating point coordinates", () => {
            expect(MathUtility.doCalculateDistance(0, 0, 1.5, 2)).toBeCloseTo(2.5);
        });

        test("throws NanError for string x1", () => {
            expect(() => MathUtility.doCalculateDistance("0", 0, 3, 4)).toThrow("NanError");
        });

        test("throws NanError for string y1", () => {
            expect(() => MathUtility.doCalculateDistance(0, "0", 3, 4)).toThrow("NanError");
        });

        test("throws NanError for string x2", () => {
            expect(() => MathUtility.doCalculateDistance(0, 0, "3", 4)).toThrow("NanError");
        });

        test("throws NanError for string y2", () => {
            expect(() => MathUtility.doCalculateDistance(0, 0, 3, "4")).toThrow("NanError");
        });
    });

    describe("doPower", () => {
        test("calculates power", () => {
            expect(MathUtility.doPower(2, 3)).toBe(8);
        });

        // Edge case tests
        test("handles power of 0", () => {
            expect(MathUtility.doPower(5, 0)).toBe(1);
        });

        test("handles power of 1", () => {
            expect(MathUtility.doPower(5, 1)).toBe(5);
        });

        test("handles base of 0", () => {
            expect(MathUtility.doPower(0, 5)).toBe(0);
        });

        test("handles base of 1", () => {
            expect(MathUtility.doPower(1, 100)).toBe(1);
        });

        test("handles negative exponent", () => {
            expect(MathUtility.doPower(2, -2)).toBe(0.25);
        });

        test("handles negative base with odd exponent", () => {
            expect(MathUtility.doPower(-2, 3)).toBe(-8);
        });

        test("handles negative base with even exponent", () => {
            expect(MathUtility.doPower(-2, 2)).toBe(4);
        });

        test("handles fractional exponent", () => {
            expect(MathUtility.doPower(4, 0.5)).toBe(2);
        });

        test("throws NanError for string base", () => {
            expect(() => MathUtility.doPower("2", 3)).toThrow("NanError");
        });

        test("throws NanError for string exponent", () => {
            expect(() => MathUtility.doPower(2, "3")).toThrow("NanError");
        });
    });

    describe("doAbs", () => {
        test("calculates absolute value", () => {
            expect(MathUtility.doAbs(-5)).toBe(5);
        });

        // Edge case tests
        test("returns positive number unchanged", () => {
            expect(MathUtility.doAbs(5)).toBe(5);
        });

        test("returns 0 for 0", () => {
            expect(MathUtility.doAbs(0)).toBe(0);
        });

        test("handles floating point negative", () => {
            expect(MathUtility.doAbs(-3.14)).toBeCloseTo(3.14);
        });

        test("handles very small negative numbers", () => {
            expect(MathUtility.doAbs(-0.0001)).toBeCloseTo(0.0001);
        });

        test("throws NanError for string input", () => {
            expect(() => MathUtility.doAbs("-5")).toThrow("NanError");
        });
    });

    describe("doNegate", () => {
        test("negates number", () => {
            expect(MathUtility.doNegate(5)).toBe(-5);
        });

        test("reverses string", () => {
            expect(MathUtility.doNegate("abc")).toBe("cba");
        });

        // Edge case tests
        test("negates negative number (double negative)", () => {
            expect(MathUtility.doNegate(-5)).toBe(5);
        });

        test("negates zero", () => {
            expect(MathUtility.doNegate(0)).toBe(0);
        });

        test("reverses single character string", () => {
            expect(MathUtility.doNegate("a")).toBe("a");
        });

        test("reverses empty string", () => {
            expect(MathUtility.doNegate("")).toBe("");
        });

        test("reverses palindrome", () => {
            expect(MathUtility.doNegate("radar")).toBe("radar");
        });

        test("reverses string with spaces", () => {
            expect(MathUtility.doNegate("hello world")).toBe("dlrow olleh");
        });

        test("throws NoNegError for array", () => {
            expect(() => MathUtility.doNegate([1, 2, 3])).toThrow("NoNegError");
        });

        test("throws NoNegError for object", () => {
            expect(() => MathUtility.doNegate({ a: 1 })).toThrow("NoNegError");
        });

        test("throws NoNegError for null", () => {
            expect(() => MathUtility.doNegate(null)).toThrow("NoNegError");
        });

        test("throws NoNegError for undefined", () => {
            expect(() => MathUtility.doNegate(undefined)).toThrow("NoNegError");
        });
    });

    describe("doInt", () => {
        test("rounds to nearest integer", () => {
            expect(MathUtility.doInt(4.6)).toBe(5);
        });

        // Edge case tests
        test("rounds down for .4", () => {
            expect(MathUtility.doInt(4.4)).toBe(4);
        });

        test("rounds up for .5", () => {
            expect(MathUtility.doInt(4.5)).toBe(5);
        });

        test("handles already integer value", () => {
            expect(MathUtility.doInt(5)).toBe(5);
        });

        test("handles negative with rounding up (towards zero)", () => {
            expect(MathUtility.doInt(-4.4)).toBe(-4);
        });

        test("handles negative with rounding down (away from zero)", () => {
            expect(MathUtility.doInt(-4.6)).toBe(-5);
        });

        test("handles zero", () => {
            expect(MathUtility.doInt(0)).toBe(0);
        });

        test("handles numeric string (converts to number)", () => {
            // Note: doInt doesn't throw for numeric strings, it converts them
            expect(MathUtility.doInt("4.6")).toBe(5);
        });

        test("returns NaN for non-numeric string", () => {
            // The function uses Math.floor(Number("abc") + 0.5) which gives NaN
            expect(MathUtility.doInt("abc")).toBeNaN();
        });
    });

    describe("edge cases - Infinity, NaN, and boundary values", () => {
        test("doMod returns NaN when divisor is zero", () => {
            expect(MathUtility.doMod(5, 0)).toBeNaN();
        });

        test("doSqrt handles Infinity", () => {
            expect(MathUtility.doSqrt(Infinity)).toBe(Infinity);
        });

        test("doAbs handles negative Infinity", () => {
            expect(MathUtility.doAbs(-Infinity)).toBe(Infinity);
        });

        test("doDivide returns Infinity for Infinity dividend", () => {
            expect(MathUtility.doDivide(Infinity, 1)).toBe(Infinity);
        });

        test("doPower returns Infinity for very large exponent", () => {
            expect(MathUtility.doPower(10, 309)).toBe(Infinity);
        });

        test("doNegate handles floating-point numbers", () => {
            expect(MathUtility.doNegate(-3.14)).toBeCloseTo(3.14);
        });

        test("doPlus coerces booleans via numeric branch", () => {
            // booleans are not strings, so Number(true) + Number(true) = 2
            expect(MathUtility.doPlus(true, true)).toBe(2);
        });
    });
});
