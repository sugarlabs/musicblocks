/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

const { blockIsMacro, getMacroExpansion } = require("../macros");
global._ = jest.fn(str => str);

describe("blockIsMacro", () => {
    let mockActivity;

    beforeEach(() => {
        mockActivity = { blocks: { protoBlockDict: Object.create(null) } };
    });

    test("should return true if block is in BLOCKISMACRO list", () => {
        expect(Boolean(blockIsMacro(mockActivity, "actionhelp"))).toBe(true);
    });

    test("should return false if block is neither in protoBlockDict nor BLOCKISMACRO", () => {
        expect(Boolean(blockIsMacro(mockActivity, "nonExistentBlock"))).toBe(false);
    });
    test("should return true if protoBlock has macroFunc even if not in builtin list", () => {
        const mockFunc = jest.fn();
        mockActivity.blocks.protoBlockDict["custom"] = { macroFunc: mockFunc };
        expect(blockIsMacro(mockActivity, "custom")).toBe(true);
    });

    test("should return false if protoBlock exists but has no macroFunc", () => {
        mockActivity.blocks.protoBlockDict["fake"] = {};
        expect(blockIsMacro(mockActivity, "fake")).toBe(false);
    });
});

describe("getMacroExpansion", () => {
    let mockActivity;

    beforeEach(() => {
        mockActivity = { blocks: { protoBlockDict: {} } };
    });

    test("should return macro expansion from protoBlockDict if macroFunc exists", () => {
        const mockFunc = jest.fn(() => [["mockedExpansion"]]);
        mockActivity.blocks.protoBlockDict["customMacro"] = { macroFunc: mockFunc };
        expect(getMacroExpansion(mockActivity, "customMacro", 10, 20)).toEqual([
            ["mockedExpansion"]
        ]);
        expect(mockFunc).toHaveBeenCalledWith(10, 20);
    });

    test("should return predefined macro expansion for known blocks", () => {
        const expansion = getMacroExpansion(mockActivity, "actionhelp", 10, 20);
        expect(Array.isArray(expansion)).toBe(true);
        expect(expansion.length).toBeGreaterThan(0);
    });

    test("should return null for unknown macros", () => {
        expect(getMacroExpansion(mockActivity, "unknownMacro", 10, 20)).toBeNull();
    });
    test("protoBlock macroFunc should override builtin macro", () => {
        const mockFunc = jest.fn(() => [["override"]]);
        mockActivity.blocks.protoBlockDict["actionhelp"] = { macroFunc: mockFunc };

        const expansion = getMacroExpansion(mockActivity, "actionhelp", 5, 10);
        expect(expansion).toEqual([["override"]]);
    });
    test("should return null for namedbox even if in BUILTINMACROS", () => {
        const result = getMacroExpansion(mockActivity, "namedbox", 0, 0);
        expect(result).toBeNull();
    });
    test("builtin macro should use provided x and y coordinates", () => {
        const expansion = getMacroExpansion(mockActivity, "archelp", 100, 200);

        expect(expansion[0][2]).toBe(100);
        expect(expansion[0][3]).toBe(200);
    });
});

describe("builtin macro connections", () => {
    const fs = require("fs");
    const path = require("path");
    const source = fs.readFileSync(path.join(__dirname, "..", "macros.js"), "utf8");
    const builtins = source.slice(source.indexOf("const BUILTINMACROS = {"));
    const macroNames = [...builtins.matchAll(/^\s+(\w+): [A-Z0-9]+,?$/gm)].map(m => m[1]);
    const mockActivity = { blocks: { protoBlockDict: {} } };

    test("finds the builtin macros in macros.js", () => {
        expect(macroNames.length).toBeGreaterThan(60);
        expect(macroNames).toContain("scalartranshelp");
    });

    // loadNewBlocks rejects the whole macro when a connection points at a
    // block that isn't in it, so a help example with one never loads.
    test.each(macroNames)("%s only connects to blocks that connect back", name => {
        const expansion = getMacroExpansion(mockActivity, name, 0, 0);
        const byId = new Map(expansion.map(blk => [blk[0], blk]));

        for (const [id, , , , connections] of expansion) {
            for (const other of connections) {
                if (other === null) continue;
                expect(byId.has(other)).toBe(true);
                expect(byId.get(other)[4]).toContain(id);
            }
        }
    });

    test("scalartranshelp ends its second note with a hidden block", () => {
        const expansion = getMacroExpansion(mockActivity, "scalartranshelp", 0, 0);
        const note = expansion[17];

        expect(note[1][0]).toBe("newnote");
        expect(expansion[note[4][3]]).toEqual([25, "hidden", 0, 0, [17, null]]);
    });
});

describe("block help examples", () => {
    const fs = require("fs");
    const path = require("path");
    const blocksDir = path.join(__dirname, "..", "blocks");
    const mockActivity = { blocks: { protoBlockDict: {} } };

    // Blocks whose class defines its own macro, which getMacroExpansion
    // reads from protoBlockDict at runtime.
    const blockMacros = new Set();
    // [file, macro name] for every help string that names an example.
    const helpExamples = [];
    for (const file of fs.readdirSync(blocksDir).filter(f => f.endsWith(".js"))) {
        const source = fs.readFileSync(path.join(blocksDir, file), "utf8");
        for (const body of source.split(/\n\s*class /)) {
            const name = /super\("(\w+)"/.exec(body);
            if (name && body.includes("this.makeMacro(")) blockMacros.add(name[1]);
        }
        const helpString = /"documentation",\s*(?:null|"[^"]*"),\s*"(\w*)"\s*\]/g;
        for (const match of source.matchAll(helpString)) helpExamples.push([file, match[1]]);
    }

    test("finds the help examples in js/blocks", () => {
        expect(helpExamples.length).toBeGreaterThan(100);
        expect(helpExamples).toContainEqual(["IntervalsBlocks.js", "arpeggiohelp"]);
    });

    // The "Load this block" button and saveHelpBlocks() pass the expansion
    // straight to loadNewBlocks(), which throws on null.
    test.each(helpExamples)("%s names an example that exists: %s", (file, macro) => {
        const found =
            blockMacros.has(macro) || getMacroExpansion(mockActivity, macro, 0, 0) !== null;
        expect(found).toBe(true);
    });
});
