/** @typedef {import('../ChromaticSpeller').ChromaticSpeller} ChromaticSpeller */
/** @typedef {import('./testUtils').MockScale} MockScale */

const { ChromaticSpeller } = require("../ChromaticSpeller");
const { MockScale } = require("./testUtils");

/**
 * Tests for ChromaticSpeller class
 */
describe("ChromaticSpeller", () => {
    /**
     * @type {ChromaticSpeller}
     */
    let speller;
    /**
     * @type {MockScale}
     */
    let scale;

    beforeEach(() => {
        scale = new MockScale("G", "major");
        speller = new ChromaticSpeller(scale);
    });

    test("should spell Cx when next note is higher", () => {
        const result = speller.spellPitch(62, 63);
        expect(result).toBe("Cx");
    });

    test("should spell D natural when next note is lower", () => {
        const result = speller.spellPitch(62, 61);
        expect(result).toBe("D");
    });

    test("should handle edge case at scale boundaries", () => {
        const result = speller.spellPitch(71, 72);
        expect(result).toBe("B#");
    });

    test("should maintain consistent spelling in scalar passages", () => {
        const melody = [68, 66, 64, 63, 62, 63];
        const expectedSpellings = ["G#", "F#", "E", "D#", "Cx", "D#"];
        
        const spellings = melody.map((pitch, i) =>
            speller.spellPitch(pitch, melody[i + 1])
        );
        expect(spellings).toEqual(expectedSpellings);
    });
});
