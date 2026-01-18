/**
 * MusicBlocks v3.6.2
 *
 * @author mukul-dixit
 *
 * @copyright 2026 mukul-dixit
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

describe("LegoWidget", () => {
    test("legobricks.js module exists and is valid", () => {
        const fs = require("fs");
        const path = require("path");
        
        const filePath = path.join(__dirname, "legobricks.js");
        expect(fs.existsSync(filePath)).toBe(true);
        expect(fs.readFileSync(filePath, "utf8")).toContain("function LegoWidget");
        expect(fs.readFileSync(filePath, "utf8")).toMatch(/(@exports\s+LegoWidget|\/\*\s*exported\s+LegoWidget\s*\*\/)/);
    });

    test("LegoWidget module has license header", () => {
        const fs = require("fs");
        const path = require("path");
        const content = fs.readFileSync(path.join(__dirname, "legobricks.js"), "utf8");
        expect(content).toMatch(/GNU.*AFFERO.*PUBLIC.*LICENSE/is);
    });
});
