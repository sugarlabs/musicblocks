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

// Mock window.platformColor
window.platformColor = {
    header: "#4DA6FF",
    selectorSelected: "#1A8CFF"
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
});
