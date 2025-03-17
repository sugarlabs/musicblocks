/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 omsuneri
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
const IntervalsBlocksAPI = require("../IntervalsBlocksAPI");

const MusicBlocks = { BLK: "mockedBlock" };
global.MusicBlocks = MusicBlocks;

describe("IntervalsBlocksAPI", () => {
    let intervalsBlocksAPI;

    beforeEach(() => {
        intervalsBlocksAPI = new IntervalsBlocksAPI();
        intervalsBlocksAPI.turIndex = 1;
        intervalsBlocksAPI.ENDFLOWCOMMAND = "end";
        intervalsBlocksAPI.runCommand = jest.fn();
    });

    test("setKey calls runCommand with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue(["C", "major"]);
        intervalsBlocksAPI.setKey("C", "major");
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setKey", ["C", "major"]);
        expect(intervalsBlocksAPI.runCommand).toHaveBeenCalledWith("setKey", ["C", "major", 1]);
    });

    test("defineMode calls runCommand and awaits flow", async () => {
        const flow = jest.fn();
        JSInterface.validateArgs.mockReturnValue(["dorian", flow]);
        await intervalsBlocksAPI.defineMode("dorian", flow);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("defineMode", ["dorian", flow]);
        expect(intervalsBlocksAPI.runCommand).toHaveBeenCalledWith("defineMode", ["dorian", 1, "mockedBlock"]);
        expect(flow).toHaveBeenCalled();
    });

    test("setScalarInterval calls runCommand and awaits flow", async () => {
        const flow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([5, flow]);
        await intervalsBlocksAPI.setScalarInterval(5, flow);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setScalarInterval", [5, flow]);
        expect(intervalsBlocksAPI.runCommand).toHaveBeenCalledWith("setScalarInterval", [5, 1]);
        expect(flow).toHaveBeenCalled();
    });

    test("setSemitoneInterval calls runCommand and awaits flow", async () => {
        const flow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([7, flow]);
        await intervalsBlocksAPI.setSemitoneInterval(7, flow);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setSemitoneInterval", [7, flow]);
        expect(intervalsBlocksAPI.runCommand).toHaveBeenCalledWith("setSemitoneInterval", [7, 1]);
        expect(flow).toHaveBeenCalled();
    });

    test("setTemperament calls runCommand with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue(["equal", 440, 4]);
        intervalsBlocksAPI.setTemperament("equal", 440, 4);
        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setTemperament", ["equal", 440, 4]);
        expect(intervalsBlocksAPI.runCommand).toHaveBeenCalledWith("setTemperament", ["equal", 440, 4]);
    });
});
