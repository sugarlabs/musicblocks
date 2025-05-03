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

const blockIsMacro = require("../macros");
const getMacroExpansion = require("../macros");
global._ = jest.fn((str) => str);

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
});

describe("getMacroExpansion", () => {
    let mockActivity;

    beforeEach(() => {
        mockActivity = { blocks: { protoBlockDict: {} } };
    });

    test("should return macro expansion from protoBlockDict if macroFunc exists", () => {
        const mockFunc = jest.fn(() => [["mockedExpansion"]]);
        mockActivity.blocks.protoBlockDict["customMacro"] = { macroFunc: mockFunc };
        expect(getMacroExpansion(mockActivity, "customMacro", 10, 20)).toEqual([["mockedExpansion"]]);
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
});
