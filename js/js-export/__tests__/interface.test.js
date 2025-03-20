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
        it("should return the original args when no constraints are defined for the method", () => {
            const args = [1, 2, 3];
            expect(JSInterface.validateArgs("nonExistingMethod", args)).toEqual(args);
        });
    });
});
