/**
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of
 * the GNU Affero General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * program. If not, see <https://www.gnu.org/licenses/>.
 */

describe("Music Blocks Guide theme", () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute("data-theme");
        window.matchMedia = jest.fn().mockReturnValue({
            matches: false,
            addEventListener: jest.fn(),
            addListener: jest.fn()
        });
    });

    const loadGuideTheme = () => {
        jest.resetModules();
        return require("../guide-theme");
    };

    test.each(["light", "dark", "highcontrast"])("uses the saved %s theme", theme => {
        localStorage.setItem("themePreference", theme);

        const { applyGuideTheme } = loadGuideTheme();

        expect(applyGuideTheme()).toBe(theme);
        expect(document.documentElement.dataset.theme).toBe(theme);
    });

    test("uses the system dark theme when no theme is saved", () => {
        window.matchMedia.mockReturnValue({ matches: true });

        const { applyGuideTheme } = loadGuideTheme();

        expect(applyGuideTheme()).toBe("dark");
    });

    test("uses the system theme when the saved preference is invalid", () => {
        localStorage.setItem("themePreference", "sepia");
        window.matchMedia.mockReturnValue({ matches: true });

        const { applyGuideTheme } = loadGuideTheme();

        expect(applyGuideTheme()).toBe("dark");
    });

    test("updates when the system color scheme changes without a saved preference", () => {
        const mediaQuery = {
            matches: false,
            addEventListener: jest.fn()
        };
        window.matchMedia.mockReturnValue(mediaQuery);

        loadGuideTheme();
        const onChange = mediaQuery.addEventListener.mock.calls[0][1];
        mediaQuery.matches = true;
        onChange();

        expect(document.documentElement.dataset.theme).toBe("dark");
    });

    test("keeps the saved theme when the system color scheme changes", () => {
        localStorage.setItem("themePreference", "highcontrast");
        const mediaQuery = {
            matches: false,
            addEventListener: jest.fn()
        };
        window.matchMedia.mockReturnValue(mediaQuery);

        loadGuideTheme();
        const onChange = mediaQuery.addEventListener.mock.calls[0][1];
        mediaQuery.matches = true;
        onChange();

        expect(document.documentElement.dataset.theme).toBe("highcontrast");
    });

    test("updates when the saved theme changes in another tab", () => {
        const addEventListener = jest.spyOn(window, "addEventListener");
        loadGuideTheme();
        const onStorage = addEventListener.mock.calls.find(
            ([eventName]) => eventName === "storage"
        )[1];
        localStorage.setItem("themePreference", "dark");
        onStorage({ key: "themePreference" });

        expect(document.documentElement.dataset.theme).toBe("dark");
    });

    test("updates when the saved theme is cleared in another tab", () => {
        localStorage.setItem("themePreference", "dark");
        window.matchMedia.mockReturnValue({ matches: true });
        const addEventListener = jest.spyOn(window, "addEventListener");
        loadGuideTheme();
        const onStorage = addEventListener.mock.calls.find(
            ([eventName]) => eventName === "storage"
        )[1];
        localStorage.removeItem("themePreference");
        onStorage({ key: null });

        expect(document.documentElement.dataset.theme).toBe("dark");
    });
});
