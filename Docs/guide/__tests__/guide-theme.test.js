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
        window.matchMedia = jest.fn().mockReturnValue({ matches: false });
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
        expect(window.matchMedia).not.toHaveBeenCalled();
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
});
