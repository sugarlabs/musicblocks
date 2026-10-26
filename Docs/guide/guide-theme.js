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

const GUIDE_THEMES = ["light", "dark", "highcontrast"];

function getGuideTheme() {
    let theme;

    try {
        theme = window.localStorage.getItem("themePreference");
    } catch (error) {
        console.warn("Could not read the Music Blocks theme preference:", error);
    }

    if (GUIDE_THEMES.includes(theme)) {
        return theme;
    }

    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
}

function applyGuideTheme() {
    const theme = getGuideTheme();
    document.documentElement.dataset.theme = theme;
    return theme;
}

applyGuideTheme();

if (typeof module !== "undefined" && module.exports) {
    module.exports = { applyGuideTheme, getGuideTheme };
}
