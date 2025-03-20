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

        test("throws error for invalid inputs", () => {
            expect(() => MathUtility.doMod("a", 3)).toThrow("NanError");
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
    });

    describe("doCalculateDistance", () => {
        test("calculates Euclidean distance", () => {
            expect(MathUtility.doCalculateDistance(0, 0, 3, 4)).toBe(5);
        });
    });

    describe("doPower", () => {
        test("calculates power", () => {
            expect(MathUtility.doPower(2, 3)).toBe(8);
        });
    });

    describe("doAbs", () => {
        test("calculates absolute value", () => {
            expect(MathUtility.doAbs(-5)).toBe(5);
        });
    });

    describe("doNegate", () => {
        test("negates number", () => {
            expect(MathUtility.doNegate(5)).toBe(-5);
        });

        test("reverses string", () => {
            expect(MathUtility.doNegate("abc")).toBe("cba");
        });
    });

    describe("doInt", () => {
        test("rounds to nearest integer", () => {
            expect(MathUtility.doInt(4.6)).toBe(5);
        });
    });
});

