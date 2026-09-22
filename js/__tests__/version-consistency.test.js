/**
 * @license
 * MusicBlocks
 * Copyright (C) 2026 Sugar Labs
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
 *
 * @jest-environment node
 */

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const pkg = require(path.join(root, "package.json"));

const readVersionConstant = () => {
    const source = fs.readFileSync(path.join(root, "js/turtledefs.js"), "utf8");
    const match = source.match(/^const VERSION = "([^"]+)";/m);
    return match && match[1];
};

// The version lives in two files. release-please bumps package.json on every
// release and knows nothing about js/turtledefs.js unless it is listed in
// extra-files, so the two drift apart silently the moment that entry is lost.
// This is not hypothetical: v3.5.1 through v3.7.1 all shipped with
// package.json stuck at 3.4.1 while turtledefs.js tracked the real version.
describe("version consistency", () => {
    it("js/turtledefs.js VERSION matches package.json", () => {
        expect(readVersionConstant()).toBe(pkg.version);
    });

    it("keeps the release-please annotation that does the bumping", () => {
        const source = fs.readFileSync(path.join(root, "js/turtledefs.js"), "utf8");

        // Without the marker release-please leaves the line alone, and the
        // test above only fails later, after a release has already shipped.
        expect(source).toMatch(/const VERSION = "[^"]+";\s*\/\/ x-release-please-version/);
    });

    it("lists js/turtledefs.js among release-please extra-files", () => {
        const config = JSON.parse(
            fs.readFileSync(path.join(root, "release-please-config.json"), "utf8")
        );
        const extraFiles = config.packages["."]["extra-files"] || [];
        const paths = extraFiles.map(entry => (typeof entry === "string" ? entry : entry.path));

        expect(paths).toContain("js/turtledefs.js");
    });
});
