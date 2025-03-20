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

global._ = jest.fn((str) => str);
const ThemeBox = require("../themebox");

describe("ThemeBox", () => {
    let mockActivity;
    let themeBox;

    beforeEach(() => {
        mockActivity = {
            storage: {
                themePreference: "light"
            },
            textMsg: jest.fn()
        };

        jest.spyOn(global.Storage.prototype, "getItem").mockImplementation((key) => {
            return key === "themePreference" ? "light" : null;
        });
        jest.spyOn(global.Storage.prototype, "setItem").mockImplementation(() => {});

        Object.defineProperty(window, "location", {
            value: { reload: jest.fn() },
            writable: true,
        });

        themeBox = new ThemeBox(mockActivity);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("constructor initializes theme from activity storage", () => {
        expect(themeBox._theme).toBe("light");
    });

    test("light_onclick() sets theme to light and updates preference", () => {
        themeBox.light_onclick();
        expect(themeBox._theme).toBe("light");
        expect(localStorage.getItem).toHaveBeenCalledWith("themePreference");
        expect(mockActivity.textMsg).toHaveBeenCalledWith("Music Blocks is already set to this theme.");
    });

    test("dark_onclick() sets theme to dark and updates preference", () => {
        themeBox.dark_onclick();
        expect(themeBox._theme).toBe("dark");
        expect(mockActivity.storage.themePreference).toBe("dark");
        expect(window.location.reload).toHaveBeenCalled();
    });

    test("setPreference() updates theme and reloads if different", () => {
        localStorage.getItem.mockReturnValue("dark"); // Correctly mocked now
        themeBox.light_onclick();
        expect(mockActivity.storage.themePreference).toBe("light");
        expect(window.location.reload).toHaveBeenCalled();
    });

    test("setPreference() does not reload if theme is unchanged", () => {
        themeBox.light_onclick();
        expect(window.location.reload).not.toHaveBeenCalled();
    });
});
