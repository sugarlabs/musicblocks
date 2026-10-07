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
global.clonePlatformTheme = theme => JSON.parse(JSON.stringify(theme));

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
        document.body.classList.add("light");
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
        document.body.classList.add("light");
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

    test("saved light preference can be reapplied after an OS theme change", () => {
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
        expect(document.body.classList.contains("dark")).toBe(true);

        themeBox.light_onclick();
        expect(document.body.classList.contains("light")).toBe(true);
        expect(document.body.classList.contains("dark")).toBe(false);
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

    test("theme changes do not share nested palette colors with theme definitions", () => {
        global.platformThemes.light.paletteColors.pitch = ["#111111", "#222222"];
        global.platformThemes.dark.paletteColors.pitch = ["#333333", "#444444"];
        try {
            window.platformColor.paletteColors = {};
            themeBox._theme = "light";
            themeBox.applyThemeInstantly();
            window.platformColor.paletteColors.pitch[0] = "#abcdef";
            window.platformColor.paletteColors.plugin = ["#fedcba"];

            expect(global.platformThemes.light.paletteColors.pitch[0]).toBe("#111111");
            expect(global.platformThemes.light.paletteColors.plugin).toBeUndefined();

            themeBox._theme = "dark";
            themeBox.applyThemeInstantly();
            expect(window.platformColor.paletteColors.plugin).toEqual(["#fedcba"]);
            window.platformColor.paletteColors.pitch[0] = "#123456";
            expect(global.platformThemes.dark.paletteColors.pitch[0]).toBe("#333333");

            themeBox._theme = "light";
            themeBox.applyThemeInstantly();
            expect(window.platformColor.paletteColors.pitch[0]).toBe("#111111");
            expect(window.platformColor.paletteColors.plugin).toEqual(["#fedcba"]);
            expect(global.platformThemes.light.paletteColors.plugin).toBeUndefined();
        } finally {
            delete global.platformThemes.light.paletteColors.pitch;
            delete global.platformThemes.dark.paletteColors.pitch;
        }
    });

    test("setPreference() does not crash when localStorage is unavailable", () => {
        localStorage.getItem.mockImplementation(() => {
            throw new DOMException("Access denied", "SecurityError");
        });
        localStorage.setItem.mockImplementation(() => {
            throw new DOMException("Access denied", "SecurityError");
        });
        themeBox._theme = "dark";
        expect(() => themeBox.setPreference()).not.toThrow();
        expect(mockActivity.storage.themePreference).toBe("dark");
        expect(document.body.classList.contains("dark")).toBe(true);
    });

    test("setPreference() falls back to applying theme when getItem throws", () => {
        localStorage.getItem.mockImplementation(() => {
            throw new DOMException("Access denied", "SecurityError");
        });
        themeBox._theme = "light";
        themeBox.setPreference();
        expect(mockActivity.storage.themePreference).toBe("light");
        expect(mockActivity.textMsg).not.toHaveBeenCalledWith(
            "Music Blocks is already set to this theme."
        );
    });

    test("refreshUIComponents refreshes activity.trashcan if available", () => {
        mockActivity.trashcan = {
            refresh: jest.fn()
        };
        themeBox.refreshUIComponents();
        expect(mockActivity.trashcan.refresh).toHaveBeenCalledTimes(1);
    });

    test("highcontrast_onclick() sets theme to highcontrast and applies it", () => {
        themeBox.highcontrast_onclick();
        expect(themeBox._theme).toBe("highcontrast");
        expect(mockActivity.storage.themePreference).toBe("highcontrast");
        expect(document.body.classList.contains("highcontrast")).toBe(true);
        expect(mockActivity.textMsg).toHaveBeenCalledWith(
            "Theme switched to highcontrast mode.",
            2000
        );
    });

    test("setPreference() still applies the theme when localStorage throws", () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        Storage.prototype.setItem.mockImplementation(() => {
            throw new Error("quota exceeded");
        });
        themeBox._theme = "dark";
        themeBox.setPreference();
        expect(warnSpy).toHaveBeenCalledWith("Could not save theme preference:", expect.any(Error));
        expect(mockActivity.storage.themePreference).toBe("dark");
        expect(document.body.classList.contains("dark")).toBe(true);
    });

    test("initializeTheme() sets body class and syncs platformColor without notifying", () => {
        window.matchMedia = jest.fn().mockReturnValue({ matches: false, addListener: jest.fn() });
        themeBox._theme = "dark";
        themeBox.initializeTheme();
        expect(document.body.classList.contains("dark")).toBe(true);
        expect(document.body.classList.contains("light")).toBe(false);
        expect(window.platformColor.background).toBe("#303030");
        expect(mockActivity.textMsg).not.toHaveBeenCalled();
    });

    test("updateThemeIcon() copies the active theme icon into the selector", () => {
        themeBox._theme = "dark";
        themeBox.updateThemeIcon();
        expect(document.getElementById("themeSelectIcon").innerHTML).toBe(
            document.getElementById("dark").innerHTML
        );
    });

    test("updateThemeIcon() leaves the selector alone when the theme element is missing", () => {
        const icon = document.getElementById("themeSelectIcon");
        icon.innerHTML = "<i>keep</i>";
        themeBox._theme = "highcontrast";
        themeBox.updateThemeIcon();
        expect(icon.innerHTML).toBe("<i>keep</i>");
    });

    test("applyThemeInstantly() updates the theme-color meta tag", () => {
        themeBox._theme = "dark";
        themeBox.applyThemeInstantly();
        expect(document.querySelector("meta[name=theme-color]").content).toBe("#1E88E5");
    });

    test("applyThemeInstantly() copies palette colors into the global color tables", () => {
        const original = global.platformThemes.dark.paletteColors;
        global.platformThemes.dark.paletteColors = { pitch: ["fill", "stroke", "highlight"] };
        try {
            themeBox._theme = "dark";
            themeBox.applyThemeInstantly();
            expect(global.PALETTEFILLCOLORS.pitch).toBe("fill");
            expect(global.PALETTESTROKECOLORS.pitch).toBe("stroke");
            expect(global.PALETTEHIGHLIGHTCOLORS.pitch).toBe("highlight");
            expect(global.HIGHLIGHTSTROKECOLORS.pitch).toBe("stroke");
        } finally {
            global.platformThemes.dark.paletteColors = original;
        }
    });

    test("applyThemeInstantly() redraws the turtles background", () => {
        mockActivity.turtles = { _locked: true, makeBackground: jest.fn() };
        themeBox._theme = "dark";
        themeBox.applyThemeInstantly();
        expect(mockActivity.turtles._locked).toBe(false);
        expect(mockActivity.turtles._backgroundColor).toBe("#303030");
        expect(mockActivity.turtles.makeBackground).toHaveBeenCalled();
        expect(mockActivity.refreshCanvas).toHaveBeenCalled();
    });

    test("applyThemeInstantly() regenerates artwork and recolors text of palette blocks", () => {
        global.platformThemes.dark.blockText = "#ABCDEF";
        try {
            const drawn = {
                protoblock: { palette: {} },
                regenerateArtwork: jest.fn(),
                text: { color: "" },
                collapseText: { color: "" }
            };
            const skipped = { protoblock: {}, regenerateArtwork: jest.fn(), text: { color: "" } };
            mockActivity.blocks = { blockList: { 0: drawn, 1: skipped, 2: null } };
            themeBox._theme = "dark";
            themeBox.applyThemeInstantly();
            expect(drawn.regenerateArtwork).toHaveBeenCalledWith(false);
            expect(drawn.text.color).toBe("#ABCDEF");
            expect(drawn.collapseText.color).toBe("#ABCDEF");
            expect(skipped.regenerateArtwork).not.toHaveBeenCalled();
            expect(skipped.text.color).toBe("");
        } finally {
            delete global.platformThemes.dark.blockText;
        }
    });

    describe("refreshUIComponents()", () => {
        const makeGrid = visible => ({
            visible,
            filters: [],
            uncache: jest.fn(),
            cache: jest.fn(),
            updateCache: jest.fn()
        });

        afterEach(() => {
            delete global.createjs;
            document.getElementById("floatingWindows")?.remove();
            document.getElementById("planet-iframe")?.remove();
        });

        test("clears inline floating window overrides but leaves overlays alone", () => {
            const container = document.createElement("div");
            container.id = "floatingWindows";
            const frame = document.createElement("div");
            frame.className = "windowFrame";
            frame.style.backgroundColor = "red";
            frame.style.borderColor = "blue";
            const overlay = document.createElement("div");
            overlay.className = "windowFrame windowOverlay";
            overlay.style.backgroundColor = "green";
            container.append(frame, overlay);
            document.body.appendChild(container);

            themeBox._theme = "dark";
            themeBox.refreshUIComponents();

            expect(frame.style.backgroundColor).toBe("");
            expect(frame.style.borderColor).toBe("");
            expect(overlay.style.backgroundColor).toBe("green");
        });

        test("inverts and re-caches visible grids in dark and high contrast modes", () => {
            global.createjs = { ColorFilter: jest.fn() };
            const visibleGrid = makeGrid(true);
            const hiddenGrid = makeGrid(false);
            mockActivity.turtles = {};
            mockActivity.cartesianBitmap = visibleGrid;
            mockActivity.polarBitmap = hiddenGrid;

            themeBox._theme = "dark";
            themeBox.refreshUIComponents();

            expect(global.createjs.ColorFilter).toHaveBeenCalledWith(-1, -1, -1, 1, 255, 255, 255);
            expect(visibleGrid.filters).toHaveLength(1);
            expect(visibleGrid.uncache).toHaveBeenCalled();
            expect(visibleGrid.cache).toHaveBeenCalledWith(0, 0, 1200, 900);
            expect(visibleGrid.updateCache).toHaveBeenCalled();
            expect(hiddenGrid.filters).toHaveLength(1);
            expect(hiddenGrid.cache).not.toHaveBeenCalled();

            visibleGrid.filters = [];
            themeBox._theme = "highcontrast";
            themeBox.refreshUIComponents();
            expect(visibleGrid.filters).toHaveLength(1);
        });

        test("removes the grid filter in light mode", () => {
            global.createjs = { ColorFilter: jest.fn() };
            const grid = makeGrid(true);
            grid.filters = [{}];
            mockActivity.turtles = {};
            mockActivity.cartesianBitmap = grid;

            themeBox._theme = "light";
            themeBox.refreshUIComponents();

            expect(grid.filters).toEqual([]);
            expect(global.createjs.ColorFilter).not.toHaveBeenCalled();
            expect(grid.cache).toHaveBeenCalledWith(0, 0, 1200, 900);
        });

        test("posts the new theme to the planet iframe", () => {
            const iframe = document.createElement("iframe");
            iframe.id = "planet-iframe";
            document.body.appendChild(iframe);
            const postSpy = jest.spyOn(iframe.contentWindow, "postMessage").mockImplementation();

            themeBox._theme = "dark";
            themeBox.refreshUIComponents();

            expect(postSpy).toHaveBeenCalledWith(
                {
                    type: "MB_APPLY_THEME",
                    payload: { add: ["dark"], remove: ["light", "highcontrast"] }
                },
                "*"
            );
        });

        test("does not throw when the planet iframe cannot be messaged", () => {
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
            const iframe = document.createElement("iframe");
            iframe.id = "planet-iframe";
            document.body.appendChild(iframe);
            jest.spyOn(iframe.contentWindow, "postMessage").mockImplementation(() => {
                throw new Error("blocked");
            });

            expect(() => themeBox.refreshUIComponents()).not.toThrow();
            expect(debugSpy).toHaveBeenCalledWith(
                "Could not update planet iframe theme:",
                expect.any(Error)
            );
        });

        test("hides and re-shows the active palette so block artwork is regenerated", () => {
            const hideMenu = jest.fn();
            mockActivity.palettes = {
                activePalette: "rhythm",
                dict: { rhythm: { hideMenu } },
                showPalette: jest.fn()
            };
            themeBox.refreshUIComponents();
            expect(hideMenu).toHaveBeenCalled();
            expect(mockActivity.palettes.showPalette).toHaveBeenCalledWith("rhythm");
        });

        test("logs instead of throwing when palette refresh fails", () => {
            const debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
            mockActivity.palettes = {
                activePalette: "rhythm",
                dict: {
                    rhythm: {
                        hideMenu: () => {
                            throw new Error("boom");
                        }
                    }
                },
                showPalette: jest.fn()
            };
            expect(() => themeBox.refreshUIComponents()).not.toThrow();
            expect(debugSpy).toHaveBeenCalledWith("Could not refresh palette:", expect.any(Error));
        });
    });
});
