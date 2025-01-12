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
