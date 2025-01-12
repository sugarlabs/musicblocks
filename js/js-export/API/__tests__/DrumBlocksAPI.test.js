const JSInterface = {
    validateArgs: jest.fn(),
};

global.JSInterface = JSInterface;
global.MusicBlocks = {
    BLK: "mockBlock",
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
        expect(drumBlocksAPI.runCommand).toHaveBeenCalledWith("playDrum", ["snare", 0, global.MusicBlocks.BLK]);
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
