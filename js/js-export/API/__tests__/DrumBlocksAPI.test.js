/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Nikhil
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
    validateArgs: jest.fn()
};

global.JSInterface = JSInterface;
global.MusicBlocks = {
    BLK: "mockBlock"
};

const DrumBlocksAPI = require("../DrumBlocksAPI");

describe("DrumBlocksAPI", () => {
    let drumBlocksAPI;

    beforeEach(() => {
        drumBlocksAPI = new DrumBlocksAPI();
        drumBlocksAPI.turIndex = 0;
        drumBlocksAPI.runCommand = jest.fn();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("playDrum calls runCommand with correct arguments", () => {
        JSInterface.validateArgs.mockReturnValue(["snare"]);

        drumBlocksAPI.playDrum("snare");

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("playDrum", ["snare"]);
        expect(drumBlocksAPI.runCommand).toHaveBeenCalledWith("playDrum", [
            "snare",
            0,
            global.MusicBlocks.BLK
        ]);
    });

    test("setDrum calls runCommand and executes flow function", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue(["kick", mockFlow]);

        const result = await drumBlocksAPI.setDrum("kick", mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setDrum", ["kick", mockFlow]);
        expect(drumBlocksAPI.runCommand).toHaveBeenCalledWith("setDrum", ["kick", 0]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(drumBlocksAPI.ENDFLOWCOMMAND);
    });

    test("mapPitchToDrum calls runCommand and executes flow function", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue(["tom", mockFlow]);

        const result = await drumBlocksAPI.mapPitchToDrum("tom", mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("mapPitchToDrum", ["tom", mockFlow]);
        expect(drumBlocksAPI.runCommand).toHaveBeenCalledWith("mapPitchToDrum", ["tom", 0]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(drumBlocksAPI.ENDFLOWCOMMAND);
    });

    test("playNoise calls runCommand with correct arguments", () => {
        JSInterface.validateArgs.mockReturnValue(["white"]);

        drumBlocksAPI.playNoise("white");

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("playNoise", ["white"]);
        expect(drumBlocksAPI.runCommand).toHaveBeenCalledWith("playNoise", ["white", 0]);
    });
});
