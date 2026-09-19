/**
 * @license
 * MusicBlocks v3.4.1
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

/*
 * Regression coverage for the play-only-mode blank-space bug.
 *
 * Zooming in (Cmd/Ctrl + +) shrinks the effective viewport below the
 * play-only breakpoint, which switches the body to a scrollable surface
 * (`.play-only body { overflow: auto }`). The editor normally clips its
 * off-screen scaffolding with `body { overflow: hidden }`; once the body
 * scrolls, anything left in normal flow below the fold turns into a large
 * blank/white region the user can scroll into (most visible right after the
 * auxiliary "3-dot" menu is opened).
 *
 * Two categories of scaffolding caused it, and this test guards both:
 *   1. The pie-menu wheel containers must default to `display: none` so they
 *      reserve no layout space until a menu is actually opened.
 *   2. The stage (`.canvasHolder`) must stay clipped in play-only mode so its
 *      off-screen helper canvases (stats chart, camera, overlay, oversized
 *      main canvas) cannot stretch the scrollable body.
 */

"use strict";

const fs = require("fs");
const path = require("path");

const readFile = relPath => fs.readFileSync(path.resolve(__dirname, relPath), "utf8");

/**
 * Extracts every `<div ... class="wheelNav" ...>` opening tag from index.html.
 * @returns {{ id: string, tag: string }[]}
 */
const getWheelNavContainers = () => {
    const html = readFile("../../index.html");
    const tags = [...html.matchAll(/<div\b[^>]*\bclass="wheelNav"[^>]*>/g)].map(m => m[0]);
    return tags.map(tag => {
        const idMatch = tag.match(/\bid="([^"]+)"/);
        return { id: idMatch ? idMatch[1] : "(no id)", tag };
    });
};

const styleOf = tag => {
    const styleMatch = tag.match(/\bstyle="([^"]*)"/);
    return styleMatch ? styleMatch[1] : "";
};

const hasDisplayNone = tag => /display\s*:\s*none/i.test(styleOf(tag));

describe("play-only-mode layout regression", () => {
    describe("pie-menu wheel containers default to hidden", () => {
        const containers = getWheelNavContainers();

        test("index.html actually contains wheelNav containers", () => {
            // Guards the extraction itself: if the markup is refactored so the
            // regex stops matching, the suite must fail loudly rather than pass
            // vacuously over an empty list.
            expect(containers.length).toBeGreaterThanOrEqual(4);
        });

        test.each(getWheelNavContainers().map(c => [c.id, c.tag]))(
            "%s reserves no layout space until opened (inline display:none)",
            (_id, tag) => {
                expect(hasDisplayNone(tag)).toBe(true);
            }
        );
    });

    describe("play-only-mode.css clips the stage", () => {
        const css = readFile("../../css/play-only-mode.css");

        test("body is made scrollable in play-only mode", () => {
            // Establishes the precondition that makes clipping necessary.
            expect(/\.play-only\s+body\s*\{[^}]*overflow\s*:\s*auto/s.test(css)).toBe(true);
        });

        test(".canvasHolder is clipped so off-screen surfaces add no scroll height", () => {
            const rule = /\.play-only\s+\.canvasHolder\s*\{[^}]*overflow\s*:\s*hidden/s;
            expect(rule.test(css)).toBe(true);
        });
    });
});
