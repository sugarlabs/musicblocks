/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 AdityaM-IITH
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
const StringHelper = require("../StringHelper");

describe("StringHelper", () => {
    beforeAll(() => {
        // Mock global scope for translation _
        global._ = str => "T_" + str;
    });

    beforeEach(() => {
        // Reset DOM before each test
        document.body.innerHTML = "";
    });

    it("should instantiate with correct strings based on Planet.IsMusicBlocks", () => {
        const mockPlanetMusic = { IsMusicBlocks: true };
        const helperMusic = new StringHelper(mockPlanetMusic);
        const lastStringMusic = helperMusic.strings[helperMusic.strings.length - 1];
        expect(lastStringMusic[1]).toBe("T_Open in Music Blocks");

        const mockPlanetTurtle = { IsMusicBlocks: false };
        const helperTurtle = new StringHelper(mockPlanetTurtle);
        const lastStringTurtle = helperTurtle.strings[helperTurtle.strings.length - 1];
        expect(lastStringTurtle[1]).toBe("T_Open in Turtle Blocks");
    });

    it("should init and append innerHTML to elements matching id", () => {
        document.body.innerHTML = '<div id="logo-container">Initial</div>';
        const helper = new StringHelper({ IsMusicBlocks: true });

        helper.init();

        const elem = document.getElementById("logo-container");
        expect(elem.innerHTML).toBe("InitialT_Planet");
    });

    it("should init and set attribute if property is provided", () => {
        document.body.innerHTML = '<div id="close-planet"></div>';
        const helper = new StringHelper({ IsMusicBlocks: true });

        helper.init();

        const elem = document.getElementById("close-planet");
        expect(elem.getAttribute("data-tooltip")).toBe("T_Close Planet");
    });

    it("should not throw error when init runs and elements are missing", () => {
        document.body.innerHTML = ""; // No elements exist
        const helper = new StringHelper({ IsMusicBlocks: true });

        expect(() => {
            helper.init();
        }).not.toThrow();
    });
});
