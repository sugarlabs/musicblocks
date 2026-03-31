// tests/intervalsPalette.test.js
const IntervalsBlocksAPI = require("../js/js-export/API/IntervalsBlocksAPI");

// Mock JSInterface
global.JSInterface = {
    validateArgs: jest.fn().mockReturnValue(true),
    log: jest.fn()
};

describe("Intervals Palette Tests", () => {
    let intervalsAPI;

    beforeEach(() => {
        intervalsAPI = new IntervalsBlocksAPI();
    });

    test("API loads successfully", () => {
        expect(IntervalsBlocksAPI).toBeDefined();
    });

    test("IntervalsAPI instance created", () => {
        expect(intervalsAPI).toBeDefined();
    });

    describe("Intervals API Methods", () => {
        test("setKey method exists", () => {
            expect(typeof intervalsAPI.setKey).toBe("function");
        });

        test("defineMode method exists", () => {
            expect(typeof intervalsAPI.defineMode).toBe("function");
        });

        test("setScalarInterval method exists", () => {
            expect(typeof intervalsAPI.setScalarInterval).toBe("function");
        });

        test("setSemitoneInterval method exists", () => {
            expect(typeof intervalsAPI.setSemitoneInterval).toBe("function");
        });

        test("setTemperament method exists", () => {
            expect(typeof intervalsAPI.setTemperament).toBe("function");
        });
    });

    describe("Basic functionality", () => {
        test("all methods are accessible", () => {
            const methods = [
                "setKey",
                "defineMode",
                "setScalarInterval",
                "setSemitoneInterval",
                "setTemperament"
            ];
            methods.forEach(method => {
                expect(typeof intervalsAPI[method]).toBe("function");
            });
        });
    });
});
