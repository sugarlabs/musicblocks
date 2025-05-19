const { PitchUtils } = require("../PitchUtils");

describe("PitchUtils", () => {
    test("should convert note to MIDI pitch correctly", () => {
        expect(PitchUtils.getMIDIPitch("C", "", 4)).toBe(60);
        expect(PitchUtils.getMIDIPitch("C", "#", 4)).toBe(61);
        expect(PitchUtils.getMIDIPitch("D", "b", 4)).toBe(61);
        expect(PitchUtils.getMIDIPitch("G", "x", 4)).toBe(69);
    });

    test("should get correct letter class from MIDI pitch", () => {
        expect(PitchUtils.getLetterClass(60)).toBe("C");
        expect(PitchUtils.getLetterClass(62)).toBe("D");
        expect(PitchUtils.getLetterClass(65)).toBe("F");
    });

    test("should calculate correct interval between pitches", () => {
        expect(PitchUtils.intervalBetween(60, 64)).toBe(4);
        expect(PitchUtils.intervalBetween(67, 63)).toBe(4);
    });
});
