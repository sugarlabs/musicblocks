/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2024 Diwangshu Kakoty
 *
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

const { interpColor, getMunsellColor, getcolor, searchColors } = require("../munsell");

global.createjs = {
    Graphics: {
        getRGB: (r, g, b, a) => {
            return `rgba(${r}, ${g}, ${b}, ${a})`;
        }
    }
};

describe("munsell", () => {
    describe("interpColor", () => {
        it("should interpolate between two colors", () => {
            expect(
                interpColor("#ff0000", "#0000ff", 0.5) // red and blue
            ).toBe("rgba(127, 0, 127, 1)"); // purple
            expect(interpColor("#00ff00", "#000000", 0.75)).toBe("rgba(0, 191, 0, 1)");
        });

        it("should return the first color if p = 1", () => {
            expect(interpColor("#123456", "#abcdef", 1)).toBe("#123456");
        });

        it("should return the second color if p = 0", () => {
            expect(interpColor("#123456", "#abcdef", 0)).toBe("#abcdef");
        });

        it("should handle undefined colors gracefully", () => {
            expect(interpColor(undefined, "#123456", 0.5)).toBe("rgba(18, 52, 86, 1)");
            expect(interpColor("#123456", undefined, 0.5)).toBe("rgba(18, 52, 86, 1)");
        });
    });

    describe("getMunsellColor", () => {
        it("should return the correct Munsell color", () => {
            const color = getMunsellColor(50, 50, 50);
            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/); // Ensure valid hex color format
        });

        it("should handle edge cases for hue, value, and chroma", () => {
            expect(getMunsellColor(0, 0, 0)).toBeDefined();
            expect(getMunsellColor(100, 100, 100)).toBeDefined();
            expect(getMunsellColor(-10, -10, -10)).toBeDefined();
            expect(getMunsellColor(110, 110, 110)).toBeDefined();
        });
    });

    describe("getcolor", () => {
        it("should return a valid array for a given color value", () => {
            const color = getcolor(50);
            expect(Array.isArray(color)).toBe(true);
            expect(color.length).toBe(3);
            expect(typeof color[0]).toBe("number");
            expect(typeof color[1]).toBe("number");
            expect(color[2]).toMatch(/^#[0-9a-fA-F]{6}$/); // Ensure RGB component is a valid hex color
        });

        it("should handle edge cases for color value", () => {
            expect(getcolor(0)).toBeDefined();
            expect(getcolor(-10)).toBeDefined();
            expect(getcolor(110)).toBeDefined();
        });
    });

    describe("searchColors", () => {
        it("should return a color value between 0 and 100", () => {
            const color = searchColors(128, 128, 128);
            expect(color).toBeGreaterThanOrEqual(0);
            expect(color).toBeLessThanOrEqual(100);
        });

        it("should find the nearest color for black", () => {
            const color = searchColors(0, 0, 0);
            const nearestColor = getcolor(color);
            expect(nearestColor[2]).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        it("should identify a close match for a RGB value", () => {
            const color = searchColors(100, 150, 200);
            const nearestColor = getcolor(color);
            expect(nearestColor[2]).toMatch(/^#[0-9a-fA-F]{6}$/);
        });
    });
});

describe("interpColor edge cases", () => {
    /**
     * Extended tests for color interpolation edge cases.
     */
    it("should handle mid-point interpolation correctly", () => {
        const result = interpColor("#000000", "#ffffff", 0.5);
        expect(result).toBe("rgba(127, 127, 127, 1)");
    });

    it("should return first color for p = 1", () => {
        expect(interpColor("#ff0000", "#00ff00", 1)).toBe("#ff0000");
    });

    it("should return second color for p = 0", () => {
        expect(interpColor("#ff0000", "#00ff00", 0)).toBe("#00ff00");
    });

    it("should interpolate red channel correctly", () => {
        const result = interpColor("#ff0000", "#000000", 0.5);
        expect(result).toBe("rgba(127, 0, 0, 1)");
    });

    it("should interpolate green channel correctly", () => {
        const result = interpColor("#00ff00", "#000000", 0.5);
        expect(result).toBe("rgba(0, 127, 0, 1)");
    });

    it("should interpolate blue channel correctly", () => {
        const result = interpColor("#0000ff", "#000000", 0.5);
        expect(result).toBe("rgba(0, 0, 127, 1)");
    });

    it("should handle grayscale interpolation", () => {
        const result = interpColor("#808080", "#404040", 0.5);
        expect(result).toBe("rgba(96, 96, 96, 1)");
    });

    it("should handle interpolation with p close to 0", () => {
        const result = interpColor("#ffffff", "#000000", 0.1);
        expect(result).toBe("rgba(25, 25, 25, 1)");
    });

    it("should handle interpolation with p close to 1", () => {
        const result = interpColor("#ffffff", "#000000", 0.9);
        expect(result).toBe("rgba(229, 229, 229, 1)");
    });

    it("should use second color when first is undefined", () => {
        const result = interpColor(undefined, "#ff0000", 0.5);
        expect(result).toBe("rgba(255, 0, 0, 1)");
    });

    it("should use first color when second is undefined", () => {
        const result = interpColor("#00ff00", undefined, 0.5);
        expect(result).toBe("rgba(0, 255, 0, 1)");
    });
});

describe("getMunsellColor edge cases", () => {
    /**
     * Extended tests for Munsell color retrieval edge cases.
     */
    it("should handle zero values for all parameters", () => {
        const color = getMunsellColor(0, 0, 0);
        expect(color).toMatch(/^(#[0-9a-fA-F]{6}|rgba\(\d+, \d+, \d+, \d+\.?\d*\))$/);
    });

    it("should handle maximum values for all parameters", () => {
        const color = getMunsellColor(100, 100, 100);
        expect(color).toBeDefined();
    });

    it("should handle negative hue by wrapping", () => {
        const color = getMunsellColor(-10, 50, 50);
        expect(color).toBeDefined();
    });

    it("should handle hue values above 100", () => {
        const color = getMunsellColor(150, 50, 50);
        expect(color).toBeDefined();
    });

    it("should handle mid-range values", () => {
        const color = getMunsellColor(50, 50, 50);
        expect(color).toMatch(/^(#[0-9a-fA-F]{6}|rgba\(\d+, \d+, \d+, \d+\.?\d*\))$/);
    });

    it("should handle value at boundary 10", () => {
        const color = getMunsellColor(50, 10, 50);
        expect(color).toBeDefined();
    });

    it("should handle chroma at boundary 0", () => {
        const color = getMunsellColor(50, 50, 0);
        expect(color).toBeDefined();
    });
});
