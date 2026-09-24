/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
 * Copyright (C) 2026 Music Blocks Contributors
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
    COLLAPSEBUTTONYOFF,
    STANDARDBLOCKHEIGHT,
    DEFAULTBLOCKSCALE,
    FILLCOLORS,
    STROKECOLORS,
    TEXTX,
    TEXTY,
    VALUETEXTX,
    COLLAPSETEXTX,
    COLLAPSETEXTY,
    MEDIASAFEAREA,
    MENUWIDTH,
    PALETTECOLORS,
    PALETTECOLORS0,
    TURTLESVG,
    DRUMSVG,
    MSGBLOCK,
    BOUNDARY,
    MBOUNDARY,
    BORDER,
    METRONOMESVG,
    BACKGROUND,
    FULLSCREENBUTTON
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
    describe("Highlight and Display Helpers", () => {
        let mockStage;

        beforeEach(() => {
            mockStage = {
                addChild: jest.fn(),
                removeChild: jest.fn()
            };
        });

        test("showMaterialHighlight creates highlight and active shapes with correct coords", () => {
            const event = { rawX: 100, rawY: 100 };
            const scale = 1;
            const result = showMaterialHighlight(50, 50, 10, event, scale, mockStage);

            expect(result).toHaveProperty("highlight");
            expect(result).toHaveProperty("active");
            expect(mockStage.addChild).toHaveBeenCalledWith(result.highlight, result.active);
            expect(result.highlight.x).toBe(50);
            expect(result.highlight.y).toBe(50);
        });

        test("hideButtonHighlight removes highlight properly after timeout", () => {
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
    });

    describe("Layout and Dimension Constants", () => {
        test("offsets and scaling factors have expected numeric values", () => {
            expect(COLLAPSEBUTTONXOFF).toBe(-48);
            expect(COLLAPSEBUTTONYOFF).toBe(9);
            expect(STANDARDBLOCKHEIGHT).toBe(42);
            expect(DEFAULTBLOCKSCALE).toBe(1.5);
            expect(TEXTX).toBe(26);
            expect(TEXTY).toBe(26);
            expect(VALUETEXTX).toBe(70);
            expect(COLLAPSETEXTX).toBe(10);
            expect(COLLAPSETEXTY).toBe(40);
            expect(MEDIASAFEAREA).toEqual([40, 4, 108, 80]);
            expect(MENUWIDTH).toBe(200);
        });
    });

    describe("Color Arrays and Palette Tables", () => {
        const hexColorRegex = /^#[0-9a-fA-F]{6}$/;

        test("FILLCOLORS is an array of 10 valid hex colors", () => {
            expect(Array.isArray(FILLCOLORS)).toBe(true);
            expect(FILLCOLORS.length).toBe(10);
            FILLCOLORS.forEach(color => {
                expect(color).toMatch(hexColorRegex);
            });
        });

        test("STROKECOLORS is an array of 10 valid hex colors", () => {
            expect(Array.isArray(STROKECOLORS)).toBe(true);
            expect(STROKECOLORS.length).toBe(10);
            STROKECOLORS.forEach(color => {
                expect(color).toMatch(hexColorRegex);
            });
        });

        test("PALETTECOLORS maps all core palettes to valid [hue, value, chroma] triples", () => {
            const expectedPalettes = [
                "widgets",
                "pitch",
                "rhythm",
                "meter",
                "tone",
                "ornament",
                "intervals",
                "volume",
                "drum",
                "mouse",
                "pen",
                "boxes",
                "action",
                "media",
                "number",
                "boolean",
                "flow",
                "sensors",
                "extras",
                "program",
                "myblocks",
                "heap",
                "dictionary",
                "mice"
            ];

            expectedPalettes.forEach(name => {
                expect(PALETTECOLORS).toHaveProperty(name);
                const [h, v, c] = PALETTECOLORS[name];
                expect(typeof h).toBe("number");
                expect(h).toBeGreaterThanOrEqual(0);
                expect(h).toBeLessThanOrEqual(360);
                expect(typeof v).toBe("number");
                expect(v).toBeGreaterThanOrEqual(0);
                expect(v).toBeLessThanOrEqual(100);
                expect(typeof c).toBe("number");
                expect(c).toBeGreaterThanOrEqual(0);
                expect(c).toBeLessThanOrEqual(100);
            });
        });

        test("PALETTECOLORS0 contains legacy palette definitions with valid numeric entries", () => {
            expect(typeof PALETTECOLORS0).toBe("object");
            expect(Object.keys(PALETTECOLORS0).length).toBeGreaterThan(0);
            Object.values(PALETTECOLORS0).forEach(entry => {
                expect(Array.isArray(entry)).toBe(true);
                expect(entry.length).toBe(3);
                entry.forEach(val => expect(typeof val).toBe("number"));
            });
        });
    });

    describe("SVG Templates and Placeholders", () => {
        test("TURTLESVG contains required SVG structure and replacement tokens", () => {
            expect(typeof TURTLESVG).toBe("string");
            expect(TURTLESVG).toContain("<svg");
            expect(TURTLESVG).toContain("fill_color");
            expect(TURTLESVG).toContain("stroke_color");
        });

        test("DRUMSVG contains required SVG structure and stroke_color placeholder", () => {
            expect(typeof DRUMSVG).toBe("string");
            expect(DRUMSVG).toContain("<svg");
            expect(DRUMSVG).toContain("stroke_color");
        });

        test("MSGBLOCK contains required replacement tokens", () => {
            expect(typeof MSGBLOCK).toBe("string");
            expect(MSGBLOCK).toContain("<svg");
            expect(MSGBLOCK).toContain("fill_color");
            expect(MSGBLOCK).toContain("stroke_color");
        });

        test("BOUNDARY and MBOUNDARY contain coordinate and dimension placeholders", () => {
            expect(BOUNDARY).toContain("HEIGHT");
            expect(BOUNDARY).toContain("WIDTH");
            expect(BOUNDARY).toContain("DX");
            expect(BOUNDARY).toContain("DY");
            expect(BOUNDARY).toContain("X");
            expect(BOUNDARY).toContain("Y");
            expect(BOUNDARY).toContain("stroke_color");

            expect(MBOUNDARY).toContain("HEIGHT");
            expect(MBOUNDARY).toContain("WIDTH");
            expect(MBOUNDARY).toContain("fill_color");
            expect(MBOUNDARY).toContain("stroke_color");
        });

        test("static icons and background templates are non-empty valid SVGs", () => {
            const svgs = [METRONOMESVG, BACKGROUND, BORDER, FULLSCREENBUTTON];
            svgs.forEach(svg => {
                expect(typeof svg).toBe("string");
                expect(svg.trim().startsWith("<svg") || svg.trim().startsWith("<?xml")).toBe(true);
                expect(svg).toContain("</svg>");
            });
        });
    });
});
