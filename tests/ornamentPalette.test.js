// tests/ornamentPalette.test.js
require("./fix-ornament");

const OrnamentBlocksAPI = require("../js/js-export/API/OrnamentBlocksAPI");

describe("Ornament Palette Tests", () => {
    let ornamentAPI;

    beforeEach(() => {
        ornamentAPI = new OrnamentBlocksAPI();
    });

    test("API loads successfully", () => {
        expect(OrnamentBlocksAPI).toBeDefined();
    });

    test("OrnamentAPI instance created", () => {
        expect(ornamentAPI).toBeDefined();
    });

    describe("Ornament API Methods", () => {
        test("setStaccato method exists", () => {
            expect(typeof ornamentAPI.setStaccato).toBe("function");
        });

        test("setSlur method exists", () => {
            expect(typeof ornamentAPI.setSlur).toBe("function");
        });

        test("doNeighbor method exists", () => {
            expect(typeof ornamentAPI.doNeighbor).toBe("function");
        });
    });

    describe("Basic functionality", () => {
        test("all methods are accessible", () => {
            const methods = ["setStaccato", "setSlur", "doNeighbor"];
            methods.forEach(method => {
                expect(typeof ornamentAPI[method]).toBe("function");
            });
        });
    });
});
