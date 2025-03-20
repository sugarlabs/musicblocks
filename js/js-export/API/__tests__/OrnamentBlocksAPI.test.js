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

const JSInterface = {
    validateArgs: jest.fn(),
};
global.JSInterface = JSInterface;

const MusicBlocks = {
    BLK: "MusicBlockTestValue",
};
global.MusicBlocks = MusicBlocks;

const OrnamentBlocksAPI = require("../OrnamentBlocksAPI");

describe("OrnamentBlocksAPI", () => {
    let ornamentBlocksAPI;

    beforeEach(() => {
        ornamentBlocksAPI = new OrnamentBlocksAPI();
        ornamentBlocksAPI.turIndex = 0;
        ornamentBlocksAPI.runCommand = jest.fn();
        ornamentBlocksAPI.ENDFLOWCOMMAND = "endFlow";
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test("setStaccato calls runCommand with correct arguments", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([true, mockFlow]);

        const result = await ornamentBlocksAPI.setStaccato(true, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setStaccato", [true, mockFlow]);
        expect(ornamentBlocksAPI.runCommand).toHaveBeenCalledWith("setStaccato", [true, 0]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe("endFlow");
    });

    test("setSlur calls runCommand with correct arguments", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([5, mockFlow]);

        const result = await ornamentBlocksAPI.setSlur(5, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setSlur", [5, mockFlow]);
        expect(ornamentBlocksAPI.runCommand).toHaveBeenCalledWith("setSlur", [5, 0]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe("endFlow");
    });

    test("doNeighbor calls runCommand with correct arguments", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([2, 3, mockFlow]);

        const result = await ornamentBlocksAPI.doNeighbor(2, 3, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("doNeighbor", [2, 3, mockFlow]);
        expect(ornamentBlocksAPI.runCommand).toHaveBeenCalledWith("doNeighbor", [2, 3, 0, "MusicBlockTestValue"]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe("endFlow");
    });
});
