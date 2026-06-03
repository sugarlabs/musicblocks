/**
 * @license
 * MusicBlocks v3.7.0
 * Copyright (C) 2026 Music Blocks Contributors
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

const fs = require("fs");
const path = require("path");

describe("Activity Module", () => {
    const activityPath = path.join(__dirname, "..", "activity.js");
    let activityContent;

    beforeAll(() => {
        activityContent = fs.readFileSync(activityPath, "utf-8");
    });

    test("activity.js file exists", () => {
        expect(fs.existsSync(activityPath)).toBe(true);
    });

    test("contains Activity class definition", () => {
        expect(activityContent).toContain("class Activity");
    });

    test("contains ActivityContext", () => {
        expect(activityContent).toContain("ActivityContext");
    });

    test("contains setupDependencies method", () => {
        expect(activityContent).toContain("setupDependencies");
    });

    test("contains doLoadAnimation method", () => {
        expect(activityContent).toContain("doLoadAnimation");
    });

    test("contains saveLocally functionality", () => {
        expect(activityContent).toContain("saveLocally");
    });

    test("uses AMD define for module loading", () => {
        expect(activityContent).toContain('define(["domReady!"]');
    });

    test("has proper error handling", () => {
        expect(activityContent).toContain("errorMsg");
    });

    test("handles localStorage access safely", () => {
        // Check that localStorage access is wrapped in try-catch
        expect(activityContent).toMatch(/try\s*{\s*[^}]*localStorage/);
    });

    test("contains init method", () => {
        expect(activityContent).toContain("init(");
    });
});
