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
    validateArgs: jest.fn()
};
global.JSInterface = JSInterface;
const PitchBlocksAPI = require("../PitchBlocksAPI");

global.MusicBlocks = { BLK: "mockBlock" };
global.Singer = {
    PitchActions: {
        numToPitch: jest.fn()
    }
};

describe("PitchBlocksAPI", () => {
    let pitchBlocksAPI;

    beforeEach(() => {
        pitchBlocksAPI = new PitchBlocksAPI();
        pitchBlocksAPI.turIndex = 1;
        pitchBlocksAPI.ENDFLOWCOMMAND = "end";
        pitchBlocksAPI.runCommand = jest.fn();
    });

    test("playPitch calls runCommand with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue(["C", 4]);

        pitchBlocksAPI.playPitch("C", 4);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("playPitch", ["C", 4]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("playPitch", [
            "C",
            4,
            0,
            1,
            MusicBlocks.BLK
        ]);
    });

    test("stepPitch calls runCommand with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue([2]);

        pitchBlocksAPI.stepPitch(2);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("stepPitch", [2]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("stepPitch", [2, 1]);
    });

    test("playNthModalPitch calls runCommand with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue([3, 5]);

        pitchBlocksAPI.playNthModalPitch(3, 5);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("playNthModalPitch", [3, 5]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("playNthModalPitch", [
            3,
            5,
            1,
            MusicBlocks.BLK
        ]);
    });

    test("playPitchNumber calls runCommand with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue([7]);

        pitchBlocksAPI.playPitchNumber(7);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("playPitchNumber", [7]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("playPitchNumber", [
            7,
            1,
            MusicBlocks.BLK
        ]);
    });

    test("playHertz calls runCommand with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue([440]);

        pitchBlocksAPI.playHertz(440);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("playHertz", [440]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("playHertz", [440, 1]);
    });

    test("setAccidental calls runCommand with validated arguments and executes flow", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue(["sharp", mockFlow]);

        const result = await pitchBlocksAPI.setAccidental("sharp", mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setAccidental", ["sharp", mockFlow]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("setAccidental", [
            "sharp",
            1,
            MusicBlocks.BLK
        ]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(pitchBlocksAPI.ENDFLOWCOMMAND);
    });

    test("setScalarTranspose calls runCommand with validated arguments and executes flow", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([2, mockFlow]);

        const result = await pitchBlocksAPI.setScalarTranspose(2, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setScalarTranspose", [2, mockFlow]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("setScalarTranspose", [2, 1]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(pitchBlocksAPI.ENDFLOWCOMMAND);
    });

    test("setSemitoneTranspose calls runCommand with validated arguments and executes flow", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue([1, mockFlow]);

        const result = await pitchBlocksAPI.setSemitoneTranspose(1, mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setSemitoneTranspose", [
            1,
            mockFlow
        ]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("setSemitoneTranspose", [1, 1]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(pitchBlocksAPI.ENDFLOWCOMMAND);
    });

    test("setRegister calls runCommand with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue([3]);

        pitchBlocksAPI.setRegister(3);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setRegister", [3]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("setRegister", [3, 1]);
    });

    test("invert calls runCommand with validated arguments and executes flow", async () => {
        const mockFlow = jest.fn();
        JSInterface.validateArgs.mockReturnValue(["inversionName", 4, "mode", mockFlow]);

        const result = await pitchBlocksAPI.invert("inversionName", 4, "mode", mockFlow);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("invert", [
            "inversionName",
            4,
            "mode",
            mockFlow
        ]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("invert", [
            "inversionName",
            4,
            "mode",
            1
        ]);
        expect(mockFlow).toHaveBeenCalled();
        expect(result).toBe(pitchBlocksAPI.ENDFLOWCOMMAND);
    });

    test("setPitchNumberOffset calls runCommand with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue([7, 3]);

        pitchBlocksAPI.setPitchNumberOffset(7, 3);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("setPitchNumberOffset", [7, 3]);
        expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("setPitchNumberOffset", [7, 3, 1]);
    });

    test("numToPitch calls numToPitch in Singer.PitchActions with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue([5]);
        Singer.PitchActions.numToPitch.mockReturnValue("C");

        const result = pitchBlocksAPI.numToPitch(5);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("numToPitch", [5]);
        expect(Singer.PitchActions.numToPitch).toHaveBeenCalledWith(5, "pitch", 1);
        expect(result).toBe("C");
    });

    test("numToOctave calls numToPitch in Singer.PitchActions with validated arguments", () => {
        JSInterface.validateArgs.mockReturnValue([5]);
        Singer.PitchActions.numToPitch.mockReturnValue(4);

        const result = pitchBlocksAPI.numToOctave(5);

        expect(JSInterface.validateArgs).toHaveBeenCalledWith("numToOctave", [5]);
        expect(Singer.PitchActions.numToPitch).toHaveBeenCalledWith(5, "octave", 1);
        expect(result).toBe(4);
    });

    describe("invert with the real argument validation", () => {
        let mockedJSInterface;

        beforeEach(() => {
            mockedJSInterface = global.JSInterface;
            global.JSEditor = { logConsole: jest.fn() };
            // constraints.js attaches to an existing JSInterface, so load it before the real one.
            delete global.JSInterface;
            jest.isolateModules(() => {
                require("../../constraints.js");
                global.JSInterface = require("../../interface");
            });
        });

        afterEach(() => {
            global.JSInterface = mockedJSInterface;
            delete global.JSEditor;
        });

        test("keeps the flow and runs it", async () => {
            const mockFlow = jest.fn();
            const endFlowGetter = jest.fn(() => Promise.resolve());
            Object.defineProperty(pitchBlocksAPI, "ENDFLOWCOMMAND", {
                get: endFlowGetter,
                configurable: true
            });
            const result = await pitchBlocksAPI.invert("sol", 4, "even", async () => mockFlow());

            expect(pitchBlocksAPI.runCommand).toHaveBeenCalledWith("invert", ["sol", 4, "even", 1]);
            expect(mockFlow).toHaveBeenCalled();
            expect(endFlowGetter).toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        test("rejects a flow that is not an async function before inverting", async () => {
            await expect(pitchBlocksAPI.invert("sol", 4, "even", () => {})).rejects.toBeDefined();
            expect(pitchBlocksAPI.runCommand).not.toHaveBeenCalled();
        });

        test("rejects a missing flow before inverting", async () => {
            await expect(pitchBlocksAPI.invert("sol", 4, "even")).rejects.toBeDefined();
            expect(pitchBlocksAPI.runCommand).not.toHaveBeenCalled();
        });

        test("rejects a null flow before inverting", async () => {
            await expect(pitchBlocksAPI.invert("sol", 4, "even", null)).rejects.toBeDefined();
            expect(pitchBlocksAPI.runCommand).not.toHaveBeenCalled();
        });
    });
});
