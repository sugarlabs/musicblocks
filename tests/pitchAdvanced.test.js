// tests/pitchAdvanced.test.js
const PitchBlocksAPI = require("../js/js-export/API/PitchBlocksAPI");

// Mock JSInterface
global.JSInterface = {
    validateArgs: jest.fn().mockReturnValue(true),
    log: jest.fn()
};

describe("Pitch Palette Advanced Tests", () => {
    let pitchAPI;

    beforeEach(() => {
        pitchAPI = new PitchBlocksAPI();
    });

    test("API loads successfully", () => {
        expect(PitchBlocksAPI).toBeDefined();
    });

    test("PitchAPI instance created", () => {
        expect(pitchAPI).toBeDefined();
    });

    describe("Pitch API Methods", () => {
        test("playPitch method exists", () => {
            expect(typeof pitchAPI.playPitch).toBe("function");
        });

        test("stepPitch method exists", () => {
            expect(typeof pitchAPI.stepPitch).toBe("function");
        });

        test("playNthModalPitch method exists", () => {
            expect(typeof pitchAPI.playNthModalPitch).toBe("function");
        });

        test("playPitchNumber method exists", () => {
            expect(typeof pitchAPI.playPitchNumber).toBe("function");
        });

        test("playHertz method exists", () => {
            expect(typeof pitchAPI.playHertz).toBe("function");
        });

        test("setAccidental method exists", () => {
            expect(typeof pitchAPI.setAccidental).toBe("function");
        });

        test("setScalarTranspose method exists", () => {
            expect(typeof pitchAPI.setScalarTranspose).toBe("function");
        });

        test("setSemitoneTranspose method exists", () => {
            expect(typeof pitchAPI.setSemitoneTranspose).toBe("function");
        });

        test("setRegister method exists", () => {
            expect(typeof pitchAPI.setRegister).toBe("function");
        });

        test("invert method exists", () => {
            expect(typeof pitchAPI.invert).toBe("function");
        });

        test("setPitchNumberOffset method exists", () => {
            expect(typeof pitchAPI.setPitchNumberOffset).toBe("function");
        });

        test("numToPitch method exists", () => {
            expect(typeof pitchAPI.numToPitch).toBe("function");
        });

        test("numToOctave method exists", () => {
            expect(typeof pitchAPI.numToOctave).toBe("function");
        });
    });

    describe("Basic functionality", () => {
        test("all methods are accessible", () => {
            const methods = [
                "playPitch",
                "stepPitch",
                "playNthModalPitch",
                "playPitchNumber",
                "playHertz",
                "setAccidental",
                "setScalarTranspose",
                "setSemitoneTranspose",
                "setRegister",
                "invert",
                "setPitchNumberOffset",
                "numToPitch",
                "numToOctave"
            ];
            methods.forEach(method => {
                expect(typeof pitchAPI[method]).toBe("function");
            });
        });
    });
});
