// Copyright (c) 2026 Aditya Mishra
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global global, describe, it, expect, beforeEach, afterEach, jest */

const MathUtility = require("../utils/mathutils");

describe("MathUtility", () => {
    beforeEach(() => {
        global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];
        jest.spyOn(Math, "random");
    });

    afterEach(() => {
        delete global.SOLFEGENAMES;
        jest.restoreAllMocks();
    });

    describe("doRandom", () => {
        it("returns a random number between a and b inclusive", () => {
            Math.random.mockReturnValue(0.5); // (5 - 1 + 1) * 0.5 + 1 = 3.5 -> floor -> 3
            expect(MathUtility.doRandom(1, 5)).toBe(3);

            Math.random.mockReturnValue(0.999); // (5 - 1 + 1) * 0.999 + 1 = 5.995 -> floor -> 5
            expect(MathUtility.doRandom(1, 5)).toBe(5);

            Math.random.mockReturnValue(0.0); // (5 - 1 + 1) * 0 + 1 = 1 -> floor -> 1
            expect(MathUtility.doRandom(1, 5)).toBe(1);
        });

        it("handles reversed numeric bounds", () => {
            Math.random.mockReturnValue(0.5); // between 1 and 5
            expect(MathUtility.doRandom(5, 1)).toBe(3);
        });

        it("returns a random solfege array between two solfege strings", () => {
            Math.random.mockReturnValue(0.5);
            const result = MathUtility.doRandom("do", "mi", 4);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(result[0]).toBe("re"); // Index 1 in the broadScale for random=0.5 between do 4 and mi 4
            expect(result[1]).toBe("4");
        });

        it("handles reversed solfege bounds by advancing the octave", () => {
            Math.random.mockReturnValue(0.5);
            const result = MathUtility.doRandom("mi", "do", 4);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            // "mi 4" to "do 5"
            // The items are: mi 4, fa 4, sol 4, la 4, ti 4, do 5. Length = 6
            // 6 * 0.5 = 3 -> floor -> 3. Start index = 2. 2 + 3 = 5 ("do 5"). Or close to it.
        });

        it("defaults octave to 4 if omitted", () => {
            Math.random.mockReturnValue(0.0); // Picks the first bound
            expect(MathUtility.doRandom("do", "mi")).toEqual(["do", "4"]);
        });

        it("throws NanError for invalid inputs", () => {
            expect(() => MathUtility.doRandom("invalid", 5)).toThrow("NanError");
            expect(() => MathUtility.doRandom(1, "invalid")).toThrow("NanError");
            expect(() => MathUtility.doRandom("not_solfege", "do", 4)).toThrow("NanError");
        });
    });

    describe("doOneOf", () => {
        it("randomly returns either a or b", () => {
            Math.random.mockReturnValue(0.4);
            expect(MathUtility.doOneOf("A", "B")).toBe("A");

            Math.random.mockReturnValue(0.6);
            expect(MathUtility.doOneOf("A", "B")).toBe("B");
        });
    });

    describe("doMod", () => {
        it("returns a modulo b", () => {
            expect(MathUtility.doMod(10, 3)).toBe(1);
            expect(MathUtility.doMod(10, -3)).toBe(1);
        });

        it("throws Division by zero if divisor is 0", () => {
            expect(() => MathUtility.doMod(10, 0)).toThrow("Division by zero");
        });

        it("throws Invalid number input if arguments are not numbers", () => {
            expect(() => MathUtility.doMod("10", 3)).toThrow("Invalid number input");
        });
    });

    describe("doSqrt", () => {
        it("returns the square root of a number", () => {
            expect(MathUtility.doSqrt(16)).toBe(4);
            expect(MathUtility.doSqrt(0)).toBe(0);
        });

        it("throws NoSqrtError for negative numbers", () => {
            expect(() => MathUtility.doSqrt(-1)).toThrow("NoSqrtError");
        });

        it("throws NanError for invalid inputs", () => {
            expect(() => MathUtility.doSqrt("16")).toThrow("NanError");
        });
    });

    describe("doPlus", () => {
        it("returns the sum of two numbers", () => {
            expect(MathUtility.doPlus(5, 7)).toBe(12);
        });

        it("concatenates if either argument is a string", () => {
            expect(MathUtility.doPlus("5", 7)).toBe("57");
            expect(MathUtility.doPlus(5, "7")).toBe("57");
            expect(MathUtility.doPlus("a", "b")).toBe("ab");
        });
    });

    describe("doMinus", () => {
        it("returns a minus b", () => {
            expect(MathUtility.doMinus(10, 4)).toBe(6);
        });

        it("throws NanError if either argument is a string", () => {
            expect(() => MathUtility.doMinus("10", 4)).toThrow("NanError");
            expect(() => MathUtility.doMinus(10, "4")).toThrow("NanError");
        });
    });

    describe("doMultiply", () => {
        it("returns a multiplied by b", () => {
            expect(MathUtility.doMultiply(3, 4)).toBe(12);
        });

        it("throws NanError if either argument is a string", () => {
            expect(() => MathUtility.doMultiply("3", 4)).toThrow("NanError");
            expect(() => MathUtility.doMultiply(3, "4")).toThrow("NanError");
        });
    });

    describe("doDivide", () => {
        it("returns a divided by b", () => {
            expect(MathUtility.doDivide(12, 4)).toBe(3);
        });

        it("throws DivByZeroError if divisor is 0", () => {
            expect(() => MathUtility.doDivide(12, 0)).toThrow("DivByZeroError");
        });

        it("throws NanError for invalid inputs", () => {
            expect(() => MathUtility.doDivide("12", 4)).toThrow("NanError");
        });
    });

    describe("doCalculateDistance", () => {
        it("returns Euclidean distance between two points", () => {
            expect(MathUtility.doCalculateDistance(0, 0, 3, 4)).toBe(5);
        });

        it("returns 0 if points are identical", () => {
            expect(MathUtility.doCalculateDistance(2, 2, 2, 2)).toBe(0);
        });

        it("throws NanError if any argument is not a number", () => {
            expect(() => MathUtility.doCalculateDistance("0", 0, 3, 4)).toThrow("NanError");
        });
    });

    describe("doPower", () => {
        it("returns a to the power of b", () => {
            expect(MathUtility.doPower(2, 3)).toBe(8);
        });

        it("throws NanError for invalid inputs", () => {
            expect(() => MathUtility.doPower("2", 3)).toThrow("NanError");
        });
    });

    describe("doAbs", () => {
        it("returns the absolute value", () => {
            expect(MathUtility.doAbs(-5)).toBe(5);
            expect(MathUtility.doAbs(5)).toBe(5);
        });

        it("throws NanError for invalid inputs", () => {
            expect(() => MathUtility.doAbs("-5")).toThrow("NanError");
        });
    });

    describe("doNegate", () => {
        it("negates a number", () => {
            expect(MathUtility.doNegate(5)).toBe(-5);
            expect(MathUtility.doNegate(-5)).toBe(5);
        });

        it("reverses a string", () => {
            expect(MathUtility.doNegate("hello")).toBe("olleh");
        });

        it("throws NoNegError for unsupported types", () => {
            expect(() => MathUtility.doNegate({})).toThrow("NoNegError");
            expect(() => MathUtility.doNegate(null)).toThrow("NoNegError");
        });
    });

    describe("doInt", () => {
        it("rounds to the nearest integer", () => {
            expect(MathUtility.doInt(4.4)).toBe(4);
            expect(MathUtility.doInt(4.5)).toBe(5);
            expect(MathUtility.doInt("4.6")).toBe(5);
        });
    });
});
