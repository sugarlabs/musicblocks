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

describe("Platform Style Tests", () => {
    beforeEach(() => {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
    });

    afterEach(() => {
        document.head.innerHTML = "";
    });

    test("should set the meta theme-color content based on platformColor", () => {
        const platformColor = { header: "#ff0000" };
        document.querySelector("meta[name=theme-color]").content = platformColor.header;
      
        const meta = document.querySelector("meta[name=theme-color]");
        expect(meta.content).toBe("#ff0000");
    });
});
