/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2014-2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const { processMacroData, prepareMacroExports } = require("../macro-utils.js");

describe("macro-utils", () => {
    describe("Module Exports", () => {
        test("exports processMacroData function", () => {
            expect(typeof processMacroData).toBe("function");
        });

        test("exports prepareMacroExports function", () => {
            expect(typeof prepareMacroExports).toBe("function");
        });
    });

    describe("processMacroData()", () => {
        let palettes;
        let blocks;
        let macroDict;

        beforeEach(() => {
            palettes = {
                add: jest.fn(),
                makePalettes: jest.fn()
            };
            blocks = {
                addToMyPalette: jest.fn()
            };
            macroDict = {};
            jest.spyOn(console, "debug").mockImplementation(() => {});
        });

        afterEach(() => {
            console.debug.mockRestore();
        });

        test("handles undefined macroData without calling palette or block methods", () => {
            processMacroData(undefined, palettes, blocks, macroDict);

            expect(palettes.add).not.toHaveBeenCalled();
            expect(palettes.makePalettes).not.toHaveBeenCalled();
            expect(blocks.addToMyPalette).not.toHaveBeenCalled();
            expect(macroDict).toEqual({});
        });

        test('handles empty JSON object string "{}" without modifying state', () => {
            processMacroData("{}", palettes, blocks, macroDict);

            expect(palettes.add).not.toHaveBeenCalled();
            expect(palettes.makePalettes).not.toHaveBeenCalled();
            expect(blocks.addToMyPalette).not.toHaveBeenCalled();
            expect(macroDict).toEqual({});
        });

        test("handles malformed JSON string safely without throwing", () => {
            expect(() => {
                processMacroData("{ malformed: json ", palettes, blocks, macroDict);
            }).not.toThrow();

            expect(console.debug).toHaveBeenCalled();
            expect(blocks.addToMyPalette).not.toHaveBeenCalled();
            expect(macroDict).toEqual({});
        });

        test("correctly parses valid macro data, registers palette, and updates macroDict", () => {
            const sampleStack = [[0, "start", 100, 100, [null, 1]]];
            const data = JSON.stringify({
                myMacro: sampleStack,
                anotherMacro: [[0, "forward", 50]]
            });

            processMacroData(data, palettes, blocks, macroDict);

            expect(palettes.add).toHaveBeenCalledWith("myblocks", "black", "#a0a0a0");
            expect(macroDict.myMacro).toEqual(sampleStack);
            expect(macroDict.anotherMacro).toEqual([[0, "forward", 50]]);
            expect(blocks.addToMyPalette).toHaveBeenCalledWith("myMacro", sampleStack);
            expect(blocks.addToMyPalette).toHaveBeenCalledWith("anotherMacro", [
                [0, "forward", 50]
            ]);
            expect(palettes.makePalettes).toHaveBeenCalledWith(1);
        });

        test("prevents prototype pollution from malicious object keys (__proto__, constructor, prototype)", () => {
            const maliciousData =
                '{"__proto__":{"polluted":true},"constructor":{"polluted":true},"prototype":{"polluted":true},"validMacro":[1,2,3]}';
            processMacroData(maliciousData, palettes, blocks, macroDict);

            expect({}.polluted).toBeUndefined();
            expect(Object.prototype.polluted).toBeUndefined();
            expect(Object.prototype.hasOwnProperty.call(macroDict, "__proto__")).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(macroDict, "constructor")).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(macroDict, "prototype")).toBe(false);
            expect(blocks.addToMyPalette).not.toHaveBeenCalledWith("__proto__", expect.anything());
            expect(blocks.addToMyPalette).not.toHaveBeenCalledWith(
                "constructor",
                expect.anything()
            );
            expect(blocks.addToMyPalette).not.toHaveBeenCalledWith("prototype", expect.anything());
            expect(blocks.addToMyPalette).toHaveBeenCalledWith("validMacro", [1, 2, 3]);
            expect(macroDict.validMacro).toEqual([1, 2, 3]);
        });
    });

    describe("prepareMacroExports()", () => {
        let macroDict;

        beforeEach(() => {
            macroDict = {};
        });

        test("adds macro stack under given name and returns serialized JSON string", () => {
            const stack = [[0, "start", 100, 100, [null, 1]]];
            const result = prepareMacroExports("melody1", stack, macroDict);

            expect(macroDict.melody1).toEqual(stack);
            expect(JSON.parse(result)).toEqual({ melody1: stack });
        });

        test("overwrites existing macro stack with new definition", () => {
            macroDict.melody1 = [1, 2];
            const newStack = [3, 4, 5];
            const result = prepareMacroExports("melody1", newStack, macroDict);

            expect(macroDict.melody1).toEqual(newStack);
            expect(JSON.parse(result)).toEqual({ melody1: newStack });
        });

        test("returns existing macro dictionary as JSON when name is null", () => {
            macroDict.existing = ["note", "c4"];
            const result = prepareMacroExports(null, [], macroDict);

            expect(JSON.parse(result)).toEqual({ existing: ["note", "c4"] });
        });

        test("returns existing macro dictionary as JSON when name is undefined", () => {
            macroDict.existing = ["note", "e4"];
            const result = prepareMacroExports(undefined, [], macroDict);

            expect(JSON.parse(result)).toEqual({ existing: ["note", "e4"] });
        });

        test("rejects unsafe keys (__proto__, constructor, prototype) preventing prototype pollution", () => {
            const maliciousStack = [{ evil: true }];

            prepareMacroExports("__proto__", maliciousStack, macroDict);
            prepareMacroExports("constructor", maliciousStack, macroDict);
            prepareMacroExports("prototype", maliciousStack, macroDict);

            expect({}.evil).toBeUndefined();
            expect(Object.prototype.evil).toBeUndefined();
            expect(Object.prototype.hasOwnProperty.call(macroDict, "__proto__")).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(macroDict, "constructor")).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(macroDict, "prototype")).toBe(false);
        });

        test("rejects unsafe keys after string normalization", () => {
            const maliciousStack = [{ evil: true }];

            prepareMacroExports(["__proto__"], maliciousStack, macroDict);

            expect(Object.getPrototypeOf(macroDict)).toBe(Object.prototype);
            expect(Object.prototype.hasOwnProperty.call(macroDict, "__proto__")).toBe(false);
            expect({}.evil).toBeUndefined();
        });
    });
});
