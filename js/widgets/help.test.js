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

describe("HelpWidget", () => {
    test("help.js module exists and is valid", () => {
        const fs = require("fs");
        const path = require("path");
        
        const helpPath = path.join(__dirname, "help.js");
        const fileExists = fs.existsSync(helpPath);
        expect(fileExists).toBe(true);
        
        const content = fs.readFileSync(helpPath, "utf8");
        expect(content).toContain("class HelpWidget");
        expect(content).toMatch(/(@exports\s+HelpWidget|\/\*\s*exported\s+HelpWidget\s*\*\/)/);
    });

    test("HelpWidget has proper license header", () => {
        const fs = require("fs");
        const path = require("path");
        
        const helpPath = path.join(__dirname, "help.js");
        const content = fs.readFileSync(helpPath, "utf8");
        expect(content).toMatch(/GNU.*AFFERO.*PUBLIC.*LICENSE/is);
    });
});
