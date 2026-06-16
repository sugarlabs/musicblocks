/**
 * MusicBlocks v3.6.2
 *
 * @author Nirav Sharma
 *
 * @copyright 2026 Nirav Sharma
 *
 * @license
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

const LegoWidget = require("../legobricks");

describe("LegoWidget Core Logic", () => {
    let legoWidget;

    beforeEach(() => {
        legoWidget = new LegoWidget();
    });

    describe("_calculateFallbackFrequency", () => {
        it("should return 440 Hz for A4 (standard reference pitch)", () => {
            const frequency = legoWidget._calculateFallbackFrequency("A", 4);
            expect(frequency).toBeCloseTo(440.0, 1);
        });

        it("should return 440 Hz for la4 (solfege equivalent)", () => {
            const frequency = legoWidget._calculateFallbackFrequency("la", 4);
            expect(frequency).toBeCloseTo(440.0, 1);
        });

        it("should return correct frequencies for all letter names in octave 4", () => {
            expect(legoWidget._calculateFallbackFrequency("C", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("D", 4)).toBeCloseTo(293.66, 1);
            expect(legoWidget._calculateFallbackFrequency("E", 4)).toBeCloseTo(329.63, 1);
            expect(legoWidget._calculateFallbackFrequency("F", 4)).toBeCloseTo(349.23, 1);
            expect(legoWidget._calculateFallbackFrequency("G", 4)).toBeCloseTo(392.0, 1);
            expect(legoWidget._calculateFallbackFrequency("A", 4)).toBeCloseTo(440.0, 1);
            expect(legoWidget._calculateFallbackFrequency("B", 4)).toBeCloseTo(493.88, 1);
        });

        it("should return correct frequencies for all solfege names in octave 4", () => {
            expect(legoWidget._calculateFallbackFrequency("do", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("re", 4)).toBeCloseTo(293.66, 1);
            expect(legoWidget._calculateFallbackFrequency("mi", 4)).toBeCloseTo(329.63, 1);
            expect(legoWidget._calculateFallbackFrequency("fa", 4)).toBeCloseTo(349.23, 1);
            expect(legoWidget._calculateFallbackFrequency("sol", 4)).toBeCloseTo(392.0, 1);
            expect(legoWidget._calculateFallbackFrequency("la", 4)).toBeCloseTo(440.0, 1);
            expect(legoWidget._calculateFallbackFrequency("ti", 4)).toBeCloseTo(493.88, 1);
        });

        it("should handle case insensitivity correctly", () => {
            expect(legoWidget._calculateFallbackFrequency("c", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("C", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("DO", 4)).toBeCloseTo(261.63, 1);
            expect(legoWidget._calculateFallbackFrequency("Do", 4)).toBeCloseTo(261.63, 1);
        });

        it("should calculate correct frequencies for different octaves", () => {
            const c4 = legoWidget._calculateFallbackFrequency("C", 4);
            const c5 = legoWidget._calculateFallbackFrequency("C", 5);
            const c3 = legoWidget._calculateFallbackFrequency("C", 3);
            expect(c5).toBeCloseTo(c4 * 2, 1);
            expect(c3).toBeCloseTo(c4 / 2, 1);
        });

        it("should handle edge cases for octaves", () => {
            expect(legoWidget._calculateFallbackFrequency("A", 0)).toBeCloseTo(27.5, 1);
            expect(legoWidget._calculateFallbackFrequency("A", 8)).toBeCloseTo(7040.0, 1);
        });

        it("should fallback to C frequency for invalid pitch names", () => {
            const invalidPitchFreq = legoWidget._calculateFallbackFrequency("X", 4);
            const c4Freq = legoWidget._calculateFallbackFrequency("C", 4);
            expect(invalidPitchFreq).toBeCloseTo(c4Freq, 1);
        });

        it("should handle empty and null pitch names", () => {
            const emptyFreq = legoWidget._calculateFallbackFrequency("", 4);
            const c4Freq = legoWidget._calculateFallbackFrequency("C", 4);
            expect(emptyFreq).toBeCloseTo(c4Freq, 1);
        });
    });

    describe("_rgbToHsl", () => {
        it("should convert red RGB to HSL", () => {
            const [h, s, l] = legoWidget._rgbToHsl(255, 0, 0);
            expect(h).toBe(0);
            expect(s).toBe(100);
            expect(l).toBe(50);
        });

        it("should convert white RGB to HSL", () => {
            const [h, s, l] = legoWidget._rgbToHsl(255, 255, 255);
            expect(l).toBe(100);
        });

        it("should convert black RGB to HSL", () => {
            const [h, s, l] = legoWidget._rgbToHsl(0, 0, 0);
            expect(l).toBe(0);
        });
    });

    describe("_getColorFamily", () => {
        it("should return red for hue 0", () => {
            expect(legoWidget._getColorFamily(0, 80, 50).name).toBe("red");
        });

        it("should return green for hue 120", () => {
            expect(legoWidget._getColorFamily(120, 80, 50).name).toBe("green");
        });

        it("should return blue for hue 240", () => {
            expect(legoWidget._getColorFamily(240, 80, 50).name).toBe("blue");
        });

        it("should return white for low saturation high lightness", () => {
            expect(legoWidget._getColorFamily(0, 5, 95).name).toBe("white");
        });

        it("should return black for low saturation low lightness", () => {
            expect(legoWidget._getColorFamily(0, 5, 10).name).toBe("black");
        });
    });

    describe("_getColorHex", () => {
        it("should return correct hex for red", () => {
            expect(legoWidget._getColorHex("red")).toBe("#FF0000");
        });

        it("should return correct hex for blue", () => {
            expect(legoWidget._getColorHex("blue")).toBe("#0000FF");
        });

        it("should return gray hex for unknown color", () => {
            expect(legoWidget._getColorHex("unknown")).toBe("#808080");
        });
    });

    describe("_shouldMergeColors", () => {
        it("should merge identical colors", () => {
            expect(legoWidget._shouldMergeColors("red", "red")).toBe(true);
        });

        it("should merge gray variants", () => {
            expect(legoWidget._shouldMergeColors("white", "gray")).toBe(true);
        });

        it("should not merge different colors", () => {
            expect(legoWidget._shouldMergeColors("red", "blue")).toBe(false);
        });
    });

    describe("_getContrastColor", () => {
        it("should return black for light colors", () => {
            expect(legoWidget._getContrastColor("white")).toBe("#000000");
            expect(legoWidget._getContrastColor("yellow")).toBe("#000000");
        });

        it("should return white for dark colors", () => {
            expect(legoWidget._getContrastColor("blue")).toBe("#FFFFFF");
            expect(legoWidget._getContrastColor("red")).toBe("#FFFFFF");
        });
    });
});
