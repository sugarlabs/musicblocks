// tests/rhythmAdvanced.test.js
const RhythmBlocksAPI = require("../js/js-export/API/RhythmBlocksAPI");

// Mock JSInterface
global.JSInterface = {
    validateArgs: jest.fn().mockReturnValue(true),
    log: jest.fn()
};

describe("Rhythm Palette Advanced Tests", () => {
    let rhythmAPI;

    beforeEach(() => {
        rhythmAPI = new RhythmBlocksAPI();
    });

    test("API loads successfully", () => {
        expect(RhythmBlocksAPI).toBeDefined();
    });

    test("RhythmAPI instance created", () => {
        expect(rhythmAPI).toBeDefined();
    });

    describe("Rhythm API Methods", () => {
        test("playNote method exists", () => {
            expect(typeof rhythmAPI.playNote).toBe("function");
        });

        test("playNoteMillis method exists", () => {
            expect(typeof rhythmAPI.playNoteMillis).toBe("function");
        });

        test("playRest method exists", () => {
            expect(typeof rhythmAPI.playRest).toBe("function");
        });

        test("dot method exists", () => {
            expect(typeof rhythmAPI.dot).toBe("function");
        });

        test("tie method exists", () => {
            expect(typeof rhythmAPI.tie).toBe("function");
        });

        test("multiplyNoteValue method exists", () => {
            expect(typeof rhythmAPI.multiplyNoteValue).toBe("function");
        });

        test("swing method exists", () => {
            expect(typeof rhythmAPI.swing).toBe("function");
        });
    });

    describe("Basic functionality", () => {
        test("all methods are accessible", () => {
            const methods = [
                "playNote",
                "playNoteMillis",
                "playRest",
                "dot",
                "tie",
                "multiplyNoteValue",
                "swing"
            ];
            methods.forEach(method => {
                expect(typeof rhythmAPI[method]).toBe("function");
            });
        });
    });
});
