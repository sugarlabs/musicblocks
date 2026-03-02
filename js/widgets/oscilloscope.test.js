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

describe("Oscilloscope Widget Integrity", () => {
    // UPDATED PATH: Since the test is in the same folder, we just look for the file name.
    const filePath = path.join(__dirname, "oscilloscope.js");

    test("Critical: Oscilloscope file should exist", () => {
        expect(fs.existsSync(filePath)).toBe(true);
    });

    test("Critical: Should contain the Oscilloscope class definition", () => {
        const content = fs.readFileSync(filePath, "utf8");
        expect(content).toContain("class Oscilloscope");
    });

    test("Critical: Should contain expected methods", () => {
        const content = fs.readFileSync(filePath, "utf8");
        expect(content).toContain("constructor(activity)");
        expect(content).toContain("makeCanvas");
        expect(content).toContain("_scale");
    });
});
