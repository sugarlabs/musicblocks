/**
 * @license
 * MusicBlocks v3.7.1
 * Copyright (C) 2026 Utkarsh Anand
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

const ROOT = path.join(__dirname, "..", "..");
const activitiesCss = fs.readFileSync(path.join(ROOT, "css", "activities.css"), "utf8");
const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

/**
 * Isolates the top-level `body { ... }` rule in activities.css (the one with
 * no class/id qualifier), as opposed to `body.dark`, `body.samples-shown`,
 * etc. Mirrors the light parsing approach used in themes-contrast.test.js.
 */
const getBaseBodyRule = css => {
    const match = css.match(/(?:^|\n)body\s*\{([^}]*)\}/);
    if (!match) {
        throw new Error("no base `body { ... }` rule found in activities.css");
    }
    return match[1];
};

describe("page background cascade (issue: Fix Page Cascade)", () => {
    const baseBodyRule = getBaseBodyRule(activitiesCss);

    test("base body rule no longer forces a hard-coded !important background", () => {
        expect(baseBodyRule).not.toMatch(/!important/);
        expect(baseBodyRule).not.toMatch(/#92b5c8/i);
    });

    test("base body rule sources its background from the design-token system", () => {
        expect(baseBodyRule).toMatch(/background-color:\s*var\(--color-bg-primary\)/);
    });

    test("index.html no longer hard-codes a body background inline style", () => {
        const bodyTagMatch = indexHtml.match(/<body\b[^>]*>/);
        expect(bodyTagMatch).not.toBeNull();
        expect(bodyTagMatch[0]).not.toMatch(/style\s*=\s*["'][^"']*background/i);
    });
});
