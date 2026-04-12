/**
 * @jest-environment jsdom
 */

/**
 * artwork_integration.test.js
 * Integration style tests for artwork decoupling from ThemeBox & Turtles.
 *
 * Copyright (C) 2024 Sugar Labs
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
global._THIS_IS_TURTLE_BLOCKS_ = true;
global.MULTIPALETTEICONS = ["music", "logic", "artwork"];
const { getSVG, hasSVG, AssetRegistry } = require("../artwork");

// Mock global dependencies for ThemeBox
global.getSystemThemePreference = jest.fn(() => "light");
global.platformColor = {
    get: jest.fn(() => ({ r: 0, g: 0, b: 0 }))
};
global.makePaletteIcons = jest.fn(() => ({ src: "mock-icon-src" }));
global._ = jest.fn(str => str);

// Dummy ThemeBox for testing decoupling
// In a real environment, this would be the actual ThemeBox class
// but we only need to test its interaction with AssetRegistry/getSVG
const ThemeBox = require("../themebox");

describe("Artwork System Integration", () => {
    describe("ThemeBox - Palette Icon Decoupling", () => {
        let mockActivity;
        let themeBox;

        beforeEach(() => {
            document.body.innerHTML = `
                <div id="palette">
                    <div>
                        <table>
                            <thead>
                                <tr>
                                    <th><div><img src=""></div><div></div></th>
                                    <th><div><img src=""></div><div></div></th>
                                    <th><div><img src=""></div><div></div></th>
                                </tr>
                            </thead>
                        </table>
                        <table>
                            <tbody>
                                <tr>
                                    <td><img src=""></td>
                                    <td>search</td>
                                </tr>
                                <tr>
                                    <td><img src=""></td>
                                    <td>music</td>
                                </tr>
                                <tr>
                                    <td><img src=""></td>
                                    <td>artwork</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <canvas id="canvas"></canvas>
            `;

            mockActivity = {
                storage: { themePreference: "dark" },
                textMsg: jest.fn(),
                refreshCanvas: jest.fn(),
                palettes: { cellSize: 55 }
            };

            // Seed some assets for test
            AssetRegistry.PALETTEICONS = {
                search: "<svg>search</svg>",
                music: "<svg>music</svg>",
                artwork: "<svg>artwork</svg>"
            };

            themeBox = new ThemeBox(mockActivity);
        });

        test("hasSVG correctly identifies top-level and nested palette assets", () => {
            // Top level
            expect(hasSVG("TURTLESVG")).toBe(true);
            // Nested (PALETTEICONS)
            expect(hasSVG("music")).toBe(true);
            // Non-existent
            expect(hasSVG("NONEXISTENT")).toBe(false);
        });

        test("getSVG correctly retrieves nested palette assets", () => {
            const musicSVG = getSVG("music");
            expect(musicSVG).toBeDefined();
            expect(musicSVG).toContain("<svg");
            // The music SVG contains notes, but let's just check it's not empty
            expect(musicSVG.length).toBeGreaterThan(10);
        });

        test("applyThemeInstantly updates all palette icons via getSVG/hasSVG abstraction", () => {
            themeBox.applyThemeInstantly();

            // Verify search icon update (row 0)
            const tbody = document.querySelector("#palette > div > table:nth-child(2) > tbody");
            const searchImg = tbody.rows[0].cells[0].querySelector("img");
            expect(searchImg.getAttribute("src")).toBe("mock-icon-src");

            // Verify music icon update (row 1)
            const musicImg = tbody.rows[1].cells[0].querySelector("img");
            expect(musicImg.getAttribute("src")).toBe("mock-icon-src");

            // Verify artwork icon update (row 2)
            const artworkImg = tbody.rows[2].cells[0].querySelector("img");
            expect(artworkImg.getAttribute("src")).toBe("mock-icon-src");

            // Verify that getSVG was called for these labels
            // It should be called for MULTIPALETTEICONS, "search", and each row label
            expect(global.makePaletteIcons).toHaveBeenCalled();
        });
    });

    describe("Turtles - Boundary Placeholder Parity", () => {
        test("getSVG correctly processes MBOUNDARY with full placeholder set (overlapping keys test)", () => {
            const options = {
                strokeColor: "#ff0000",
                fillColor: "#00ff00",
                placeholders: {
                    HEIGHT: 1200,
                    WIDTH: 1000,
                    Y: 15,
                    X: 10,
                    DY: 1100,
                    DX: 900,
                    STROKE: 30
                }
            };

            const result = getSVG("MBOUNDARY", options);

            expect(result).toContain('height="1200"');
            expect(result).toContain('width="1000"');
            expect(result).toContain("stroke:#ff0000");
            expect(result).toContain("fill:#00ff00");

            // Verify that Y did not partially replace DY (should NOT be D15)
            expect(result).toContain('height="1100"'); // DY
            expect(result).toContain('width="900"'); // DX
            expect(result).toContain('y="15"'); // Y
            expect(result).toContain('x="10"'); // X
            expect(result).toContain("stroke-width:30");
        });
    });
});
