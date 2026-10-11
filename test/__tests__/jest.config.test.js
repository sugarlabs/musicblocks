/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Walter Bender
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

/* global describe, it, expect */

const micromatch = require("micromatch");
const jestConfig = require("../../jest.config");

describe("jest.config coverage collection patterns", () => {
    const patterns = jestConfig.collectCoverageFrom;
    const isCollected = filepath => micromatch([filepath], patterns).length > 0;

    it("includes standard source files under js/ and planet/js/", () => {
        expect(isCollected("js/activity.js")).toBe(true);
        expect(isCollected("js/utils/utils.js")).toBe(true);
        expect(isCollected("planet/js/main.js")).toBe(true);
    });

    it("excludes top-level and nested __tests__ directories under js/", () => {
        expect(isCollected("js/__tests__/block.test.js")).toBe(false);
        expect(isCollected("js/utils/__tests__/tonemock.js")).toBe(false);
        expect(isCollected("js/blocks/__tests__/WidgetBlocks.test.js")).toBe(false);
    });

    it("excludes top-level and nested __tests__ directories under planet/js/", () => {
        expect(isCollected("planet/js/__tests__/GlobalPlanet.test.js")).toBe(false);
        expect(isCollected("planet/js/nested/__tests__/testHelper.js")).toBe(false);
    });

    it("excludes ast2blocks configuration file", () => {
        expect(isCollected("js/js-export/ast2blocks.config.js")).toBe(false);
    });
});
