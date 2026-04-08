/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Your Name
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

const MathUtility = require("../utils/mathutils");

// Mock SOLFEGENAMES for doRandom tests
global.SOLFEGENAMES = ["do", "re", "mi", "fa", "sol", "la", "ti"];

describe("MathUtility", () => {
    describe("doRandom", () => {
        test("returns random number between two numbers", () => {
            const result = MathUtility.doRandom(1, 10);
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(10);
        });

        test("throws error for invalid inputs", () => {
            expect(() => MathUtility.doRandom("invalid", 10)).toThrow("NanError");
        });
    });

    describe("doOneOf", () => {
        test("returns either a or b", () => {
            const result = MathUtility.doOneOf("a", "b");
            expect(["a", "b"]).toContain(result);
        });
    });

    describe("doMod", () => {
        test("calculates modulus correctly", () => {
            expect(MathUtility.doMod(10, 3)).toBe(1);
        });

        test("returns NaN when divisor is zero", () => {
            expect(MathUtility.doMod(5, 0)).toBeNaN();
        });
    });

    describe("doSqrt", () => {
        test("calculates square root", () => {
            expect(MathUtility.doSqrt(9)).toBe(3);
        });

        test("throws error for negative input", () => {
            expect(() => MathUtility.doSqrt(-1)).toThrow("NoSqrtError");
        });
    });

    describe("doPlus", () => {
        test("adds two numbers", () => {
            expect(MathUtility.doPlus(2, 3)).toBe(5);
        });

        test("concatenates strings", () => {
            expect(MathUtility.doPlus("a", "b")).toBe("ab");
        });
    });

    describe("doMinus", () => {
        test("subtracts numbers", () => {
            expect(MathUtility.doMinus(5, 3)).toBe(2);
        });

        test("throws error for string inputs", () => {
            expect(() => MathUtility.doMinus("a", 3)).toThrow("NanError");
        });
    });

    describe("doMultiply", () => {
        test("multiplies numbers", () => {
            expect(MathUtility.doMultiply(2, 3)).toBe(6);
        });

        test("throws error for string inputs", () => {
            expect(() => MathUtility.doMultiply("a", 3)).toThrow("NanError");
        });
    });

    describe("doDivide", () => {
        test("divides numbers", () => {
            expect(MathUtility.doDivide(6, 2)).toBe(3);
        });

        test("throws error for division by zero", () => {
            expect(() => MathUtility.doDivide(6, 0)).toThrow("DivByZeroError");
        });

        test("throws error for invalid inputs", () => {
            expect(() => MathUtility.doDivide("a", 2)).toThrow("NanError");
        });
    });

    describe("doCalculateDistance", () => {
        test("calculates Euclidean distance", () => {
            expect(MathUtility.doCalculateDistance(0, 0, 3, 4)).toBe(5);
        });

        test("returns 0 for same point", () => {
            expect(MathUtility.doCalculateDistance(5, 5, 5, 5)).toBe(0);
        });
    });

    describe("doPower", () => {
        test("calculates power", () => {
            expect(MathUtility.doPower(2, 3)).toBe(8);
        });

        test("handles power of 0", () => {
            expect(MathUtility.doPower(5, 0)).toBe(1);
        });
    });

    describe("doAbs", () => {
        test("calculates absolute value", () => {
            expect(MathUtility.doAbs(-5)).toBe(5);
        });

        test("returns positive number unchanged", () => {
            expect(MathUtility.doAbs(5)).toBe(5);
        });
    });

    describe("doNegate", () => {
        test("negates number", () => {
            expect(MathUtility.doNegate(5)).toBe(-5);
        });

        test("reverses string", () => {
            expect(MathUtility.doNegate("abc")).toBe("cba");
        });

        test("throws error for invalid inputs", () => {
            expect(() => MathUtility.doNegate(null)).toThrow("NoNegError");
        });
    });

    describe("doInt", () => {
        test("rounds to nearest integer", () => {
            expect(MathUtility.doInt(4.6)).toBe(5);
            expect(MathUtility.doInt(4.4)).toBe(4);
        });

        test("handles negative numbers", () => {
            expect(MathUtility.doInt(-4.6)).toBe(-5);
            expect(MathUtility.doInt(-4.4)).toBe(-4);
        });
    });
});
