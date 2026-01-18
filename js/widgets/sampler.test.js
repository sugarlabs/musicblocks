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

describe("SampleWidget", () => {
    test("sampler.js module exists and is valid", () => {
        const fs = require("fs");
        const path = require("path");
        
        const filePath = path.join(__dirname, "sampler.js");
        expect(fs.existsSync(filePath)).toBe(true);
        expect(fs.readFileSync(filePath, "utf8")).toContain("function SampleWidget");
        expect(fs.readFileSync(filePath, "utf8")).toMatch(/(@exports\s+SampleWidget|\/\*\s*exported\s+SampleWidget\s*\*\/)/);
    });

    test("SampleWidget module has license header", () => {
        const fs = require("fs");
        const path = require("path");
        const content = fs.readFileSync(path.join(__dirname, "sampler.js"), "utf8");
        expect(content).toMatch(/GNU.*AFFERO.*PUBLIC.*LICENSE/is);
    });
});
