// Add this at the TOP of tests/drumPalette.test.js
require("./fix-existing-tests");

const DrumBlocksAPI = require("../js/js-export/API/DrumBlocksAPI");

describe("Drum Palette Tests", () => {
    let drumAPI;

    beforeEach(() => {
        drumAPI = new DrumBlocksAPI();
    });

    test("API loads successfully", () => {
        expect(DrumBlocksAPI).toBeDefined();
    });

    test("DrumAPI instance created", () => {
        expect(drumAPI).toBeDefined();
    });

    test("playDrum method exists", () => {
        expect(typeof drumAPI.playDrum).toBe("function");
    });

    test("setDrum method exists", () => {
        expect(typeof drumAPI.setDrum).toBe("function");
    });

    test("mapPitchToDrum method exists", () => {
        expect(typeof drumAPI.mapPitchToDrum).toBe("function");
    });

    test("playNoise method exists", () => {
        expect(typeof drumAPI.playNoise).toBe("function");
    });
});
