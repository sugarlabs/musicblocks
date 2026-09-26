/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2024 omsuneri
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

describe("platformstyle", () => {
    const buildDom = () => {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
    };

    const loadModuleWithUA = ua => {
        Object.defineProperty(global.window.navigator, "userAgent", {
            value: ua,
            configurable: true,
            writable: true
        });
        global.navigator = global.window.navigator;
        const ls = global.window.localStorage || {};
        global.localStorage = ls;
        global.window.localStorage = ls;
        global.showMaterialHighlight = jest.fn(() => ({ highlight: true }));
        buildDom();

        jest.isolateModules(() => {
            require("../platformstyle");
        });
    };

    beforeEach(() => {
        jest.resetModules();
        document.head.innerHTML = "";
        delete global.window.platform;
        delete global.window.platformColor;
    });

    afterEach(() => {
        jest.resetModules();
    });

    it("should detect androidWebkit for Android Chrome", () => {
        loadModuleWithUA("Mozilla/5.0 Android Chrome/90");
        expect(global.window.platform.android).toBe(true);
        expect(global.window.platform.FF).toBe(false);
        expect(global.window.platform.androidWebkit).toBe(true);
        expect(global.window.platform.FFOS).toBe(false);
    });

    it("should not set androidWebkit for Android Firefox", () => {
        loadModuleWithUA("Mozilla/5.0 Android Firefox/88");
        expect(global.window.platform.android).toBe(true);
        expect(global.window.platform.FF).toBe(true);
        expect(global.window.platform.androidWebkit).toBe(false);
        expect(global.window.platform.FFOS).toBe(false);
    });

    it("should detect FFOS for Firefox mobile non-Android", () => {
        loadModuleWithUA("Mozilla/5.0 Firefox Mobi");
        expect(global.window.platform.FF).toBe(true);
        expect(global.window.platform.mobile).toBe(true);
        expect(global.window.platform.android).toBe(false);
        expect(global.window.platform.FFOS).toBe(true);
        expect(global.window.platform.androidWebkit).toBe(false);
    });

    it("should not detect FFOS for desktop Firefox", () => {
        loadModuleWithUA("Mozilla/5.0 Firefox/88.0");
        expect(global.window.platform.FF).toBe(true);
        expect(global.window.platform.mobile).toBe(false);
        expect(global.window.platform.FFOS).toBe(false);
    });

    it("should handle empty user agent", () => {
        loadModuleWithUA("");
        expect(global.window.platform.android).toBe(false);
        expect(global.window.platform.FF).toBe(false);
        expect(global.window.platform.mobile).toBe(false);
        expect(global.window.platform.tablet).toBe(false);
        expect(global.window.platform.androidWebkit).toBe(false);
        expect(global.window.platform.FFOS).toBe(false);
    });

    it("delegates to showMaterialHighlight when not on FFOS", () => {
        loadModuleWithUA("Chrome/123");
        const { showButtonHighlight } = require("../platformstyle");
        const result = showButtonHighlight(1, 2, 3, { type: "click" }, 1, {});
        expect(result).toEqual({ highlight: true });
        expect(global.showMaterialHighlight).toHaveBeenCalledWith(
            1,
            2,
            3,
            { type: "click" },
            1,
            {}
        );
    });

    it("returns empty object from showButtonHighlight when on FFOS", () => {
        loadModuleWithUA("Mozilla/5.0 Firefox Mobi");
        const { showButtonHighlight } = require("../platformstyle");
        const result = showButtonHighlight(0, 0, 0, {}, 1, {});
        expect(result).toEqual({});
        expect(global.showMaterialHighlight).not.toHaveBeenCalled();
    });

    it("initializes platformColor with light theme by default", () => {
        loadModuleWithUA("Chrome/123");
        expect(global.window.platformColor).toBeDefined();
        expect(global.window.platformColor.header).toBe("#4DA6FF");
        expect(document.querySelector("meta[name=theme-color]").content).toBe("#4DA6FF");
    });

    it.each(["light", "dark", "highcontrast"])(
        "keeps the graphics boundary visible in %s mode",
        theme => {
            localStorage.themePreference = theme;
            loadModuleWithUA("Chrome/123");

            const luminance = hex => {
                const channels = hex.match(/[\da-f]{2}/gi).map(channel => {
                    const value = parseInt(channel, 16) / 255;
                    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
                });
                return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
            };

            const { ruleColor, background } = global.window.platformColor;
            const foreground = luminance(ruleColor);
            const backdrop = luminance(background);
            const contrast =
                (Math.max(foreground, backdrop) + 0.05) / (Math.min(foreground, backdrop) + 0.05);
            expect(contrast).toBeGreaterThanOrEqual(3);
        }
    );

    it("honors dark theme preference", () => {
        Object.defineProperty(global.window.navigator, "userAgent", {
            value: "Chrome/123",
            configurable: true,
            writable: true
        });
        global.navigator = global.window.navigator;
        const ls = global.window.localStorage || {};
        ls.themePreference = "dark";
        global.localStorage = ls;
        global.window.localStorage = ls;
        global.showMaterialHighlight = jest.fn(() => ({ highlight: true }));
        buildDom();

        jest.isolateModules(() => {
            require("../platformstyle");
        });

        expect(global.window.platformColor.header).toBe("#1E88E5");
        expect(document.querySelector("meta[name=theme-color]").content).toBe("#1E88E5");
    });

    it("exports platformThemes and builds 25 palettes per theme via semantic adapter", () => {
        loadModuleWithUA("Chrome/123");
        const {
            platformThemes,
            SEMANTIC_PALETTE_COLORS,
            PALETTE_CATEGORY_MAP,
            buildPaletteColors
        } = require("../platformstyle");

        expect(platformThemes).toBeDefined();
        expect(global.window.platformThemes).toBe(platformThemes);
        expect(SEMANTIC_PALETTE_COLORS).toBeDefined();
        expect(PALETTE_CATEGORY_MAP).toBeDefined();

        const expectedPalettes = [
            "widgets",
            "pitch",
            "intervals",
            "rhythm",
            "meter",
            "tone",
            "ornament",
            "volume",
            "drum",
            "graphics",
            "turtle",
            "pen",
            "ensemble",
            "boxes",
            "action",
            "myblocks",
            "media",
            "number",
            "boolean",
            "flow",
            "heap",
            "dictionary",
            "sensors",
            "extras",
            "program"
        ];

        for (const theme of ["light", "dark", "highcontrast"]) {
            const paletteColors = buildPaletteColors(theme);
            expect(Object.keys(paletteColors)).toHaveLength(25);
            for (const name of expectedPalettes) {
                expect(paletteColors[name]).toBeDefined();
                expect(paletteColors[name]).toHaveLength(4);
                paletteColors[name].forEach(c => {
                    expect(typeof c).toBe("string");
                    expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/);
                });
            }
            expect(platformThemes[theme].paletteColors).toEqual(paletteColors);
        }
    });

    it("verifies required canvas keys are present and dead keys are pruned", () => {
        loadModuleWithUA("Chrome/123");
        const { platformThemes } = require("../platformstyle");

        for (const theme of ["light", "dark", "highcontrast"]) {
            const themeConfig = platformThemes[theme];

            // Canvas & block rendering keys must be defined
            expect(themeConfig.background).toBeDefined();
            expect(themeConfig.blockText).toBeDefined();
            expect(themeConfig.strokeColor).toBeDefined();
            expect(themeConfig.fillColor).toBeDefined();
            expect(themeConfig.paletteBackground).toBeDefined();
            expect(themeConfig.paletteLabelBackground).toBeDefined();
            expect(themeConfig.paletteLabelSelected).toBeDefined();
            expect(themeConfig.paletteText).toBeDefined();
            expect(themeConfig.selectorBackground).toBeDefined();
            expect(themeConfig.selectorSelected).toBeDefined();
            expect(themeConfig.labelColor).toBeDefined();
            expect(themeConfig.widgetBackground).toBeDefined();
            expect(themeConfig.rulerHighlight).toBeDefined();
            expect(themeConfig.stopIconcolor).toBeDefined();
            expect(themeConfig.hitAreaGraphicsBeginFill).toBeDefined();
            expect(themeConfig.orange).toBeDefined();
            expect(Array.isArray(themeConfig.piemenuBasic)).toBe(true);
            expect(Array.isArray(themeConfig.pitchWheelcolors)).toBe(true);
            expect(Array.isArray(themeConfig.wheelcolors)).toBe(true);

            // Pruned dead keys must be undefined
            expect(themeConfig.aux).toBeUndefined();
            expect(themeConfig.sub).toBeUndefined();
            expect(themeConfig.rule).toBeUndefined();
            expect(themeConfig.trashColor).toBeUndefined();
            expect(themeConfig.paletteSelected).toBeUndefined();
            expect(themeConfig.doHeaderShadow).toBeUndefined();
        }
    });

    it("honors highcontrast theme preference", () => {
        Object.defineProperty(global.window.navigator, "userAgent", {
            value: "Chrome/123",
            configurable: true,
            writable: true
        });
        global.navigator = global.window.navigator;
        const ls = global.window.localStorage || {};
        ls.themePreference = "highcontrast";
        global.localStorage = ls;
        global.window.localStorage = ls;
        global.showMaterialHighlight = jest.fn(() => ({ highlight: true }));
        buildDom();

        jest.isolateModules(() => {
            require("../platformstyle");
        });

        expect(global.window.platformColor.header).toBe("#00FFFF");
        expect(global.window.platformColor.background).toBe("#000000");
    });
});
