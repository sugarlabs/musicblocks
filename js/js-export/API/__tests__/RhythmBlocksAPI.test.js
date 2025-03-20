/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Nikhil
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

const JSInterface = {
    validateArgs: jest.fn(),
};
global.JSInterface = JSInterface;

global.MusicBlocks = {
    BLK: "mockBLK"
};

const RhythmBlocksAPI = require("../RhythmBlocksAPI");

describe("RhythmBlocksAPI", () => {
    let rhythmBlocksAPI;

    beforeEach(() => {
        rhythmBlocksAPI = new RhythmBlocksAPI();
        rhythmBlocksAPI.turIndex = 0;
        rhythmBlocksAPI.runCommand = jest.fn();
        rhythmBlocksAPI.ENDFLOWCOMMAND = "END";
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("playNote calls runCommand with correct arguments", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([100, mockFlow]);
        
        const result = await rhythmBlocksAPI.playNote(100, mockFlow);
        
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("playNote", [100, mockFlow]);
        expect(rhythmBlocksAPI.runCommand).toHaveBeenCalledWith("playNote", [100, "newnote", 0, "mockBLK"]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe("END");
    });

    test("playNoteMillis calls runCommand with correct arguments", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([1000, mockFlow]);
        
        const result = await rhythmBlocksAPI.playNoteMillis(1000, mockFlow);
        
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("playNoteMillis", [1000, mockFlow]);
        expect(rhythmBlocksAPI.runCommand).toHaveBeenCalledWith("playNote", [1000, "osctime", 0, "mockBLK"]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe("END");
    });

    test("playRest calls runCommand with correct arguments", () => {
        rhythmBlocksAPI.playRest();
        
        expect(rhythmBlocksAPI.runCommand).toHaveBeenCalledWith("playRest", [0]);
    });

    test("dot calls runCommand with correct arguments", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([1, mockFlow]);
        
        const result = await rhythmBlocksAPI.dot(1, mockFlow);
        
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("dot", [1, mockFlow]);
        expect(rhythmBlocksAPI.runCommand).toHaveBeenCalledWith("doRhythmicDot", [1, 0]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe("END");
    });

    test("tie calls runCommand with correct arguments", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([undefined, mockFlow]);  // Changed to match implementation
        
        const result = await rhythmBlocksAPI.tie(mockFlow);
        
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("tie", [mockFlow]);
        expect(rhythmBlocksAPI.runCommand).toHaveBeenCalledWith("doTie", [0]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe("END");
    });

    test("multiplyNoteValue calls runCommand with correct arguments", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([2, mockFlow]);
        
        const result = await rhythmBlocksAPI.multiplyNoteValue(2, mockFlow);
        
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("multiplyNoteValue", [2, mockFlow]);
        expect(rhythmBlocksAPI.runCommand).toHaveBeenCalledWith("multiplyNoteValue", [2, 0]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe("END");
    });

    test("swing calls runCommand with correct arguments", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([1, 4, mockFlow]);
        
        const result = await rhythmBlocksAPI.swing(1, 4, mockFlow);
        
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("multiplyNoteValue", [1, 4, mockFlow]);  // Keep original validation method
        expect(rhythmBlocksAPI.runCommand).toHaveBeenCalledWith("addSwing", [1, 4, 0]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe("END");
    });

    test("methods handle validation errors correctly", async () => {
        JSInterface.validateArgs.mockImplementation(() => {
            throw new Error("Invalid arguments");
        });

        await expect(rhythmBlocksAPI.playNote()).rejects.toThrow("Invalid arguments");
        await expect(rhythmBlocksAPI.playNoteMillis()).rejects.toThrow("Invalid arguments");
        await expect(rhythmBlocksAPI.dot()).rejects.toThrow("Invalid arguments");
        await expect(rhythmBlocksAPI.tie()).rejects.toThrow("Invalid arguments");
        await expect(rhythmBlocksAPI.multiplyNoteValue()).rejects.toThrow("Invalid arguments");
        await expect(rhythmBlocksAPI.swing()).rejects.toThrow("Invalid arguments");
    });

    test("methods handle command execution errors correctly", async () => {
        JSInterface.validateArgs.mockReturnValue([1, jest.fn()]);
        rhythmBlocksAPI.runCommand.mockRejectedValue(new Error("Command failed"));  // Changed to handle async rejection

        await expect(rhythmBlocksAPI.playNote(1, jest.fn())).rejects.toThrow("Command failed");
        await expect(rhythmBlocksAPI.playNoteMillis(1, jest.fn())).rejects.toThrow("Command failed");
        await expect(rhythmBlocksAPI.playRest()).rejects.toThrow("Command failed");  // Added await
        await expect(rhythmBlocksAPI.dot(1, jest.fn())).rejects.toThrow("Command failed");
        await expect(rhythmBlocksAPI.tie(jest.fn())).rejects.toThrow("Command failed");
        await expect(rhythmBlocksAPI.multiplyNoteValue(2, jest.fn())).rejects.toThrow("Command failed");
        await expect(rhythmBlocksAPI.swing(1, 4, jest.fn())).rejects.toThrow("Command failed");
    });
});
