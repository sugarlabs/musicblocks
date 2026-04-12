/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
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

global._THIS_IS_TURTLE_BLOCKS_ = true;
const {
    showMaterialHighlight,
    hideButtonHighlight,
    hidePaletteNameDisplay,
    COLLAPSEBUTTONXOFF,
    STANDARDBLOCKHEIGHT,
    FILLCOLORS,
    TURTLESVG,
    AssetRegistry,
    getSVG
} = require("../artwork");

global.createjs = {
    Shape: jest.fn(() => ({
        graphics: { f: jest.fn().mockReturnThis(), drawCircle: jest.fn().mockReturnThis() },
        alpha: 0,
        x: 0,
        y: 0
    })),
    Tween: {
        get: jest.fn(() => ({
            to: jest.fn().mockReturnThis()
        }))
    },
    Ease: { circInOut: jest.fn() }
};

describe("artwork.js Test Suite", () => {
    let mockStage;

    beforeEach(() => {
        mockStage = {
            addChild: jest.fn(),
            removeChild: jest.fn()
        };
    });

    test("showMaterialHighlight creates highlight and active shapes", () => {
        const event = { rawX: 100, rawY: 100 };
        const scale = 1;
        const result = showMaterialHighlight(50, 50, 10, event, scale, mockStage);
        expect(result).toHaveProperty("highlight");
        expect(result).toHaveProperty("active");
        expect(mockStage.addChild).toHaveBeenCalledWith(result.highlight, result.active);
    });

    test("hideButtonHighlight removes highlight properly", () => {
        jest.useFakeTimers();
        const circles = { highlight: {}, active: {} };
        hideButtonHighlight(circles, mockStage);
        jest.runAllTimers();
        expect(mockStage.removeChild).toHaveBeenCalledWith(circles.active, circles.highlight);
        jest.useRealTimers();
    });

    test("hidePaletteNameDisplay removes palette text after delay", () => {
        jest.useFakeTimers();
        const paletteText = {};
        hidePaletteNameDisplay(paletteText, mockStage);
        jest.runAllTimers();
        expect(mockStage.removeChild).toHaveBeenCalledWith(paletteText);
        jest.useRealTimers();
    });

    test("Constants are correctly defined", () => {
        expect(typeof COLLAPSEBUTTONXOFF).toBe("number");
        expect(typeof STANDARDBLOCKHEIGHT).toBe("number");
        expect(Array.isArray(FILLCOLORS)).toBe(true);
        expect(typeof TURTLESVG).toBe("string");
    });

    describe("AssetRegistry", () => {
        test("is a non-empty object", () => {
            expect(typeof AssetRegistry).toBe("object");
            expect(Object.keys(AssetRegistry).length).toBeGreaterThan(0);
        });

        test("contains TURTLESVG matching the global", () => {
            expect(AssetRegistry.TURTLESVG).toBe(TURTLESVG);
        });

        test("contains FILLCOLORS matching the global", () => {
            expect(AssetRegistry.FILLCOLORS).toBe(FILLCOLORS);
        });
    });

    describe("getSVG", () => {
        test("returns the raw SVG when no options are provided", () => {
            const result = getSVG("TURTLESVG");
            expect(result).toBe(TURTLESVG);
        });

        test("replaces fill_color and stroke_color tokens", () => {
            const result = getSVG("TURTLESVG", {
                fillColor: "#ff0000",
                strokeColor: "#00ff00"
            });
            expect(result).not.toContain("fill_color");
            expect(result).not.toContain("stroke_color");
            expect(result).toContain("#ff0000");
            expect(result).toContain("#00ff00");
        });

        test("getSVG should handle arbitrary placeholders", () => {
            const svg = getSVG("BOUNDARY", {
                placeholders: {
                    HEIGHT: "100",
                    WIDTH: "200",
                    X: "10",
                    Y: "20"
                }
            });
            expect(svg).toContain('height="100"');
            expect(svg).toContain('width="200"');
            expect(svg).toContain('x="10"');
            expect(svg).toContain('y="20"');
        });

        test("getSVG should handle missing assets gracefully", () => {
            const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
            const result = getSVG("DOES_NOT_EXIST");
            expect(result).toBe("");
            expect(warnSpy).toHaveBeenCalled();
            warnSpy.mockRestore();
        });

        test("returns non-string values as-is", () => {
            const result = getSVG("FILLCOLORS");
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
