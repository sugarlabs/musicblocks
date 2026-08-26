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

global._ = jest.fn(str => str);

// Mock global palette color variables
global.PALETTEFILLCOLORS = {};
global.PALETTESTROKECOLORS = {};
global.PALETTEHIGHLIGHTCOLORS = {};
global.HIGHLIGHTSTROKECOLORS = {};

// Mock window.platformColor
window.platformColor = {
    header: "#4DA6FF",
    selectorSelected: "#1A8CFF"
};

// Mock platformThemes (the canonical table that themebox.js now reads from).
// Subset stub: only the keys exercised by tests in this file. Values must
// match js/utils/platformstyle.js:platformThemes; pulling the real file in
// would drag the rest of the global init chain into Jest.
global.platformThemes = {
    light: {
        background: "#F9F9F9",
        header: "#4DA6FF",
        selectorSelected: "#1A8CFF",
        paletteColors: {}
    },
    dark: {
        background: "#303030",
        header: "#1E88E5",
        selectorSelected: "#1E88E5",
        paletteColors: {}
    },
    highcontrast: {
        background: "#000000",
        header: "#00FFFF",
        selectorSelected: "#00CCCC",
        paletteColors: {}
    }
};

// Mock document elements
document.body.innerHTML = `
    <meta name="theme-color" content="#4DA6FF">
    <canvas id="canvas"></canvas>
    <div id="themeSelectIcon"></div>
    <div id="light"><i class="material-icons">brightness_7</i></div>
    <div id="dark"><i class="material-icons">brightness_4</i></div>
    <div id="palette"><div></div></div>
`;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
    }))
});

const ThemeBox = require("../themebox");

describe("ThemeBox", () => {
    let mockActivity;
    let themeBox;

    beforeEach(() => {
        mockActivity = {
            storage: {
                themePreference: "light"
            },
            textMsg: jest.fn(),
            refreshCanvas: jest.fn(),
            palettes: {}
        };

        jest.spyOn(global.Storage.prototype, "getItem").mockImplementation(key => {
            return key === "themePreference" ? "light" : null;
        });
        jest.spyOn(global.Storage.prototype, "setItem").mockImplementation(() => {});

        // Reset body classes
        document.body.classList.remove("light", "dark");

        themeBox = new ThemeBox(mockActivity);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("constructor initializes theme from activity storage", () => {
        expect(themeBox._theme).toBe("light");
    });

    test("light_onclick() sets theme to light", () => {
        themeBox.light_onclick();
        expect(themeBox._theme).toBe("light");
        expect(localStorage.getItem).toHaveBeenCalledWith("themePreference");
        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            "Music Blocks is already set to this theme."
        );
    });

    test("dark_onclick() sets theme to dark and applies instantly", () => {
        const reloadSpy = jest.spyOn(themeBox, "reload").mockImplementation(() => {});
        themeBox.dark_onclick();
        expect(themeBox._theme).toBe("dark");
        expect(mockActivity.storage.themePreference).toBe("dark");
        // Should NOT reload - instant theme switch
        expect(reloadSpy).not.toHaveBeenCalled();
        // Should show theme switched message
        expect(mockActivity.textMsg).toHaveBeenCalledWith("Theme switched to dark mode.", 2000);
        reloadSpy.mockRestore();
    });

    test("setPreference() applies theme instantly without reload", () => {
        const reloadSpy = jest.spyOn(themeBox, "reload").mockImplementation(() => {});
        localStorage.getItem.mockReturnValue("light");
        themeBox._theme = "dark";
        themeBox.setPreference();
        expect(mockActivity.storage.themePreference).toBe("dark");
        // Should NOT reload - instant theme switch
        expect(reloadSpy).not.toHaveBeenCalled();
        // Body should have dark class
        expect(document.body.classList.contains("dark")).toBe(true);
        expect(document.body.classList.contains("light")).toBe(false);
        reloadSpy.mockRestore();
    });

    test("setPreference() does not change if theme is unchanged", () => {
        const reloadSpy = jest.spyOn(themeBox, "reload").mockImplementation(() => {});
        themeBox.light_onclick();
        expect(reloadSpy).not.toHaveBeenCalled();
        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            "Music Blocks is already set to this theme."
        );
        reloadSpy.mockRestore();
    });

    test("applyThemeInstantly() updates body classes correctly", () => {
        themeBox._theme = "dark";
        themeBox.applyThemeInstantly();
        expect(document.body.classList.contains("dark")).toBe(true);
        expect(document.body.classList.contains("light")).toBe(false);
    });

    test("applyThemeInstantly() updates canvas background for dark mode", () => {
        themeBox._theme = "dark";
        themeBox.applyThemeInstantly();
        const canvas = document.getElementById("canvas");
        expect(canvas.style.backgroundColor).toBe("rgb(48, 48, 48)");
    });

    test("applyThemeInstantly() updates canvas background for light mode", () => {
        themeBox._theme = "light";
        themeBox.applyThemeInstantly();
        const canvas = document.getElementById("canvas");
        expect(canvas.style.backgroundColor).toBe("rgb(249, 249, 249)");
    });


    test("applyThemeInstantly() repaints sidebar palette buttons immediately (fixes #5825)", () => {
        global.PALETTEICONS = { search: "<svg></svg>", rhythm: "<svg></svg>" };
        global.MULTIPALETTEICONS = [];
        global.makePaletteIcons = jest.fn(() => ({ src: "data:image/svg+xml," }));

        // Build the DOM the palette refresh actually walks — two tables
        // inside #palette > div, where the second table holds the search row
        // and the per-palette buttons. One row uses a label that does not map
        // to a PALETTEICONS key (custom/plugin palette, translated label),
        // which is the precise scenario the old gate skipped.
        // Avoid indented innerHTML — the resulting whitespace text node
        // becomes paletteElement.childNodes[0] and trips an unrelated
        // existing call elsewhere in refreshUIComponents.
        const palette = document.getElementById("palette");
        palette.innerHTML =
            "<div>" +
            "<table><thead><tr></tr></thead></table>" +
            "<table><tbody>" +
            '<tr id="row-search"><td><img src=""></td><td style="color: #000">Search</td></tr>' +
            '<tr id="row-rhythm" style="background-color: #FFFFFF"><td><img src=""></td><td style="color: #000">Rhythm</td></tr>' +
            '<tr id="row-custom" style="background-color: #FFFFFF"><td><img src=""></td><td style="color: #000">Plugin Palette</td></tr>' +
            "</tbody></table>" +
            "</div>";

        mockActivity.palettes = { cellSize: 32, dict: {}, activePalette: null };

        themeBox._theme = "dark";
        themeBox.applyThemeInstantly();

        // Both rows — including the one whose label doesn't match
        // PALETTEICONS — must reflect the dark theme's palette background.
        const darkBg = "rgb(28, 28, 28)"; // #1C1C1C
        const rhythmRow = document.getElementById("row-rhythm");
        const customRow = document.getElementById("row-custom");
        expect(rhythmRow.style.backgroundColor).toBe(darkBg);
        expect(customRow.style.backgroundColor).toBe(darkBg);

        // And switching back to light must repaint both rows again, not leave
        // them on the dark color until the user hovers.
        themeBox._theme = "light";
        themeBox.applyThemeInstantly();
        const lightBg = "rgb(255, 255, 255)";
        expect(rhythmRow.style.backgroundColor).toBe(lightBg);
        expect(customRow.style.backgroundColor).toBe(lightBg);
    test("initializeTheme() attaches matchMedia listener via addEventListener", () => {
        const mockMq = {
            matches: false,
            addEventListener: jest.fn(),
            addListener: jest.fn()
        };
        window.matchMedia = jest.fn().mockReturnValue(mockMq);
        themeBox.initializeTheme();
        expect(mockMq.addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
        expect(mockMq.addListener).not.toHaveBeenCalled();
    });

    test("initializeTheme() falls back to addListener when addEventListener unavailable", () => {
        const mockMq = { matches: false, addListener: jest.fn() };
        window.matchMedia = jest.fn().mockReturnValue(mockMq);
        themeBox.initializeTheme();
        expect(mockMq.addListener).toHaveBeenCalledWith(expect.any(Function));
    });

    test("OS theme change to dark updates theme correctly", () => {
        let capturedHandler;
        const mockMq = {
            matches: false,
            addEventListener: jest.fn((_, handler) => {
                capturedHandler = handler;
            }),
            addListener: jest.fn()
        };
        window.matchMedia = jest.fn().mockReturnValue(mockMq);
        themeBox.initializeTheme();
        capturedHandler({ matches: true });
        expect(themeBox._theme).toBe("dark");
    });

    // Regression test for #7172: applyThemeInstantly must read from
    // platformThemes, not a duplicate table inside themebox.js.
    test("applyThemeInstantly() picks up mutations to platformThemes", () => {
        const original = global.platformThemes.dark.background;
        global.platformThemes.dark.background = "#222222";
        try {
            themeBox._theme = "dark";
            themeBox.applyThemeInstantly();
            expect(window.platformColor.background).toBe("#222222");
        } finally {
            global.platformThemes.dark.background = original;
        }
    });
});
