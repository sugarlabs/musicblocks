/**
 * MusicBlocks v3.4.1
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2026 Music Blocks Contributors
 *
 * @license
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

function setupImageMock() {
    global.Image = function () {
        const img = document.createElement("img");

        img.width = 50;

        if (!img.setAttribute) {
            img.setAttribute = jest.fn();
        }

        if (!img.removeAttribute) {
            img.removeAttribute = jest.fn();
        }

        if (!img.style) {
            img.style = {};
        }

        return img;
    };
}

module.exports = { setupImageMock };
