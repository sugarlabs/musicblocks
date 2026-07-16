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

global.createjs = {
    ColorFilter: jest.fn()
};

// Mock window.platformColor
window.platformColor = {
    header: "#4DA6FF",
    selectorSelected: "#1A8CFF"
};

// Mock document elements
document.body.innerHTML = `
    <meta name="theme-color" content="#4DA6FF">
    <canvas id="canvas"></canvas>
    <canvas id="myCanvas"></canvas>
    <div id="themeSelectIcon"></div>
    <div id="light"><i class="material-icons">brightness_7</i></div>
    <div id="dark"><i class="material-icons">brightness_4</i></div>
    <div id="highcontrast"></div>
    <div id="palette">
        <div>
            <table>
                <thead>
                    <tr>
                        <td><img/><div></div></td>
                        <td><img/><div></div></td>
                    </tr>
                </thead>
            </table>
            <table>
                <tbody>
                    <tr><td><img/></td><td></td></tr>
                    <tr><td><img/></td><td>label</td></tr>
                </tbody>
            </table>
        </div>
    </div>
    <div id="paletteToggle"></div>
    <div id="buttoncontainerTOP">
        <div class="tooltipped"></div>
        <div class="tooltipped"></div>
    </div>
    <nav></nav>
    <div id="floatingWindows">
        <div class="windowFrame"><div class="wftTitle"></div></div>
    </div>
    <input id="search">
    <iframe id="planet-iframe"></iframe>
`;

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
            palettes: {
                cellSize: 50,
                activePalette: "test",
                dict: {
                    test: { hideMenu: jest.fn() }
                },
                showPalette: jest.fn()
            },
            turtles: {
                _locked: true,
                makeBackground: jest.fn()
            },
            blocks: {
                blockList: {
                    1: {
                        protoblock: { palette: "test" },
                        regenerateArtwork: jest.fn(),
                        text: {},
                        collapseText: {}
                    }
                }
            },
            cartesianBitmap: {
                visible: true,
                filters: [],
                uncache: jest.fn(),
                cache: jest.fn(),
                updateCache: jest.fn()
            },
            polarBitmap: {
                visible: false,
                filters: [],
                uncache: jest.fn(),
                cache: jest.fn(),
                updateCache: jest.fn()
            },
            toolbarHeight: 50
        };

        window.syncPlatformColor = jest.fn(theme => {
            if (theme === "dark") window.platformColor.background = "rgb(48, 48, 48)";
            else if (theme === "light") window.platformColor.background = "rgb(249, 249, 249)";
        });
        window.AccessibilityHelper = {
            updateFocusRingForTheme: jest.fn()
        };

        window.platformColor.paletteColors = {
            test: ["#ff0000", "#00ff00", "#0000ff"]
        };

        global.MULTIPALETTEICONS = [0, 1];
        global.PALETTEICONS = { search: "search_icon", label: "label_icon" };
        global.makePaletteIcons = jest.fn(() => ({ src: "mock.png" }));

        jest.spyOn(global.Storage.prototype, "getItem").mockImplementation(key => {
            return key === "themePreference" ? "light" : null;
        });
        jest.spyOn(global.Storage.prototype, "setItem").mockImplementation(() => {});

        // Reset body classes
        document.body.classList.remove("light", "dark", "highcontrast");

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
        themeBox.dark_onclick();
        expect(themeBox._theme).toBe("dark");
        expect(mockActivity.storage.themePreference).toBe("dark");
        // Should show theme switched message
        expect(mockActivity.textMsg).toHaveBeenCalledWith("Theme switched to dark mode.", 2000);
    });

    test("highcontrast_onclick() sets theme to highcontrast and applies instantly", () => {
        themeBox.highcontrast_onclick();
        expect(themeBox._theme).toBe("highcontrast");
        expect(mockActivity.storage.themePreference).toBe("highcontrast");
        // Should show theme switched message
        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            "Theme switched to highcontrast mode.",
            2000
        );
    });

    test("setPreference() applies theme instantly without reload", () => {
        localStorage.getItem.mockReturnValue("light");
        themeBox._theme = "dark";
        themeBox.setPreference();
        expect(mockActivity.storage.themePreference).toBe("dark");
        // Body should have dark class
        expect(document.body.classList.contains("dark")).toBe(true);
        expect(document.body.classList.contains("light")).toBe(false);
    });

    test("setPreference() does not change if theme is unchanged", () => {
        themeBox.light_onclick();
        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            "Music Blocks is already set to this theme."
        );
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

    test("theme changes are applied live without page reload", () => {
        localStorage.getItem.mockReturnValue("light");

        themeBox._theme = "dark";
        themeBox.setPreference();

        // Verify theme was applied live to the DOM instantly
        expect(document.body.classList.contains("dark")).toBe(true);
        expect(mockActivity.storage.themePreference).toBe("dark");
        expect(localStorage.setItem).toHaveBeenCalledWith("themePreference", "dark");

        // Verify instant UI updates on canvas
        const canvas = document.getElementById("canvas");
        expect(canvas.style.backgroundColor).toBe("rgb(48, 48, 48)");
    });
    test("applyThemeInstantly() calls refreshUIComponents and sets styles correctly in dark mode", () => {
        themeBox._theme = "dark";
        themeBox.applyThemeInstantly();

        expect(mockActivity.turtles.makeBackground).toHaveBeenCalled();
        expect(mockActivity.blocks.blockList["1"].regenerateArtwork).toHaveBeenCalled();
        expect(window.syncPlatformColor).toHaveBeenCalledWith("dark");
    });

    test("applyThemeInstantly() sets styles correctly in highcontrast mode", () => {
        themeBox._theme = "highcontrast";
        themeBox.applyThemeInstantly();

        expect(mockActivity.cartesianBitmap.filters.length).toBe(1);
    });

    test("initializeTheme() calls required setup functions", () => {
        const updateIconSpy = jest.spyOn(themeBox, "updateThemeIcon");
        const refreshUISpy = jest.spyOn(themeBox, "refreshUIComponents");
        themeBox.initializeTheme();
        expect(updateIconSpy).toHaveBeenCalled();
        expect(refreshUISpy).toHaveBeenCalled();
    });

    test("planet iframe receives message on theme change", () => {
        const iframe = document.getElementById("planet-iframe");
        iframe.contentWindow.postMessage = jest.fn();
        themeBox._theme = "dark";
        themeBox.refreshUIComponents();
        expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
            {
                type: "MB_APPLY_THEME",
                payload: { add: ["dark"], remove: ["light", "highcontrast"] }
            },
            "*"
        );
    });

    test("setPreference logs warning if localStorage throws error", () => {
        jest.spyOn(global.Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("Quota exceeded");
        });
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        themeBox.dark_onclick();
        expect(consoleSpy).toHaveBeenCalledWith(
            "Could not save theme preference:",
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });
});
