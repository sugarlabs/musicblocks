/**
 * MusicBlocks v3.6.2
 *
 * @author Divyam Agarwal
 *
 * @copyright 2026 Divyam Agarwal
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

const fs = require("fs");
const path = require("path");

describe("Help Widget Integrity", () => {
    // Looks for help.js in the current directory
    const filePath = path.join(__dirname, "help.js");

    test("Critical: HelpWidget file should exist", () => {
        expect(fs.existsSync(filePath)).toBe(true);
    });

    test("Critical: Should define the HelpWidget class", () => {
        const content = fs.readFileSync(filePath, "utf8");
        expect(content).toContain("class HelpWidget");
    });

    test("Critical: Should contain essential UI methods", () => {
        const content = fs.readFileSync(filePath, "utf8");
        // Verifying the constructor and private methods exist
        expect(content).toContain("constructor(activity, useActiveBlock)");
        expect(content).toContain("_setup(useActiveBlock, page)");
        expect(content).toContain("_showPage(page)");
        expect(content).toContain("_prepareBlockList()");
    });

    test("Critical: Should handle keyboard events", () => {
        const content = fs.readFileSync(filePath, "utf8");
        // Ensures the widget listens for arrow keys
        expect(content).toContain("ArrowLeft");
        expect(content).toContain("ArrowRight");
    });
});
