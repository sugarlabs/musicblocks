/**
 * MusicBlocks v3.4.1
 *
 * @author Sapnil Biswas
 * @author AdityaM-IITH
 *
 * @copyright 2026 Music Blocks contributors
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

const StringHelper = require("../StringHelper");

// Mock global scope for translation _
global._ = jest.fn(str => str);

describe("StringHelper", () => {
    let helper;
    let mockPlanet;

    beforeEach(() => {
        // Reset DOM before each test
        document.body.innerHTML = "";
        mockPlanet = { IsMusicBlocks: true };
        helper = new StringHelper(mockPlanet);
        jest.clearAllMocks();
    });

    describe("Basic Functionality (Integrated)", () => {
        it("should instantiate with correct strings based on Planet.IsMusicBlocks", () => {
            const mockPlanetMusic = { IsMusicBlocks: true };
            const helperMusic = new StringHelper(mockPlanetMusic);
            const lastStringMusic = helperMusic.strings[helperMusic.strings.length - 1];
            expect(lastStringMusic[1]).toBe("Open in Music Blocks");

            const mockPlanetTurtle = { IsMusicBlocks: false };
            const helperTurtle = new StringHelper(mockPlanetTurtle);
            const lastStringTurtle = helperTurtle.strings[helperTurtle.strings.length - 1];
            expect(lastStringTurtle[1]).toBe("Open in Turtle Blocks");
        });

        it("should init and append innerHTML to elements matching id", () => {
            document.body.innerHTML = '<div id="logo-container">Initial</div>';
            const helperObj = new StringHelper({ IsMusicBlocks: true });

            helperObj.init();

            const elem = document.getElementById("logo-container");
            expect(elem.innerHTML).toBe("InitialPlanet");
        });

        it("should init and set attribute if property is provided", () => {
            document.body.innerHTML = '<div id="close-planet"></div>';
            const helperObj = new StringHelper({ IsMusicBlocks: true });

            helperObj.init();

            const elem = document.getElementById("close-planet");
            expect(elem.getAttribute("data-tooltip")).toBe("Close Planet");
        });

        it("should not throw error when init runs and elements are missing", () => {
            document.body.innerHTML = ""; // No elements exist
            const helperObj = new StringHelper({ IsMusicBlocks: true });

            expect(() => {
                helperObj.init();
            }).not.toThrow();
        });
    });

    describe("Detailed Coverage & Edge Cases (Improvements)", () => {
        describe("constructor", () => {
            it("should populate the strings array", () => {
                expect(Array.isArray(helper.strings)).toBe(true);
                expect(helper.strings.length).toBeGreaterThan(0);
            });

            it("should contain the expected element IDs", () => {
                const ids = helper.strings.map(entry => entry[0]);
                expect(ids).toContain("logo-container");
                expect(ids).toContain("close-planet");
                expect(ids).toContain("local-tab");
                expect(ids).toContain("global-tab");
                expect(ids).toContain("localtitle");
                expect(ids).toContain("globaltitle");
                expect(ids).toContain("publisher-submit");
                expect(ids).toContain("deleter-button");
                expect(ids).toContain("projectviewer-open-mb");
            });

            it("should have entries with 2 or 3 elements", () => {
                for (const entry of helper.strings) {
                    expect(entry.length === 2 || entry.length === 3).toBe(true);
                }
            });

            it("should include attribute entries for tooltip and placeholder strings", () => {
                const attrEntries = helper.strings.filter(entry => entry.length === 3);
                const attrs = attrEntries.map(entry => entry[2]);
                expect(attrs).toContain("data-tooltip");
                expect(attrs).toContain("placeholder");
            });

            it("should set 'Music' in open label when IsMusicBlocks is true", () => {
                const openEntry = helper.strings.find(e => e[0] === "projectviewer-open-mb");
                expect(openEntry[1]).toContain("Music");
                expect(openEntry[1]).not.toContain("Turtle");
            });

            it("should set 'Turtle' in open label when IsMusicBlocks is false", () => {
                const turtleHelper = new StringHelper({ IsMusicBlocks: false });
                const openEntry = turtleHelper.strings.find(e => e[0] === "projectviewer-open-mb");
                expect(openEntry[1]).toContain("Turtle");
                expect(openEntry[1]).not.toContain("Music");
            });

            it("should call the translation function _ for every string", () => {
                // Re-create to count fresh calls
                const originalMock = global._;
                global._ = jest.fn(str => str);
                const h = new StringHelper({ IsMusicBlocks: true });
                expect(global._).toHaveBeenCalledTimes(h.strings.length);
                global._ = originalMock;
            });
        });

        describe("init() improvements", () => {
            it("should set innerHTML for elements without a third property", () => {
                document.body.innerHTML = '<div id="logo-container"></div>';
                helper.init();
                const elem = document.getElementById("logo-container");
                expect(elem.innerHTML).toBe("Planet");
            });

            it("should append to existing innerHTML", () => {
                document.body.innerHTML = '<div id="logo-container">Prefix</div>';
                helper.init();
                const elem = document.getElementById("logo-container");
                expect(elem.innerHTML).toBe("PrefixPlanet");
            });

            it("should set placeholder attribute for search input", () => {
                document.body.innerHTML = '<input id="global-search" />';
                helper.init();
                const elem = document.getElementById("global-search");
                expect(elem.getAttribute("placeholder")).toBe("Search for a project");
            });

            it("should handle a mix of present and missing elements", () => {
                document.body.innerHTML =
                    '<div id="logo-container"></div><div id="localtitle"></div>';
                helper.init();
                expect(document.getElementById("logo-container").innerHTML).toBe("Planet");
                expect(document.getElementById("localtitle").innerHTML).toBe("My Projects");
            });

            it("should process all strings entries when all elements exist", () => {
                // Create DOM elements for every entry in the strings array
                let html = "";
                for (const entry of helper.strings) {
                    html += `<div id="${entry[0]}"></div>`;
                }
                document.body.innerHTML = html;

                helper.init();

                for (const entry of helper.strings) {
                    const elem = document.getElementById(entry[0]);
                    if (entry.length === 3) {
                        expect(elem.getAttribute(entry[2])).toBe(entry[1]);
                    } else {
                        expect(elem.innerHTML).toContain(entry[1]);
                    }
                }
            });

            it("should not modify elements that are not in the strings list", () => {
                document.body.innerHTML =
                    '<div id="logo-container"></div><div id="unrelated">Original</div>';
                helper.init();
                expect(document.getElementById("unrelated").innerHTML).toBe("Original");
            });

            it("should be safe to call init() multiple times", () => {
                document.body.innerHTML = '<div id="local-tab"></div>';
                helper.init();
                helper.init();
                const elem = document.getElementById("local-tab");
                // innerHTML is appended, so calling init twice doubles the text
                expect(elem.innerHTML).toBe("LocalLocal");
            });

            it("should set data-tooltip for report-project and download-file entries", () => {
                document.body.innerHTML =
                    '<div id="projectviewer-report-project"></div>' +
                    '<div id="projectviewer-download-file"></div>';
                helper.init();
                expect(
                    document
                        .getElementById("projectviewer-report-project")
                        .getAttribute("data-tooltip")
                ).toBe("Report Project");
                expect(
                    document
                        .getElementById("projectviewer-download-file")
                        .getAttribute("data-tooltip")
                ).toBe("Download as File");
            });

            it("should inject sort option labels via innerHTML", () => {
                document.body.innerHTML =
                    '<div id="option-recent"></div>' +
                    '<div id="option-liked"></div>' +
                    '<div id="option-downloaded"></div>' +
                    '<div id="option-alphabetical"></div>';
                helper.init();
                expect(document.getElementById("option-recent").innerHTML).toBe("Most recent");
                expect(document.getElementById("option-liked").innerHTML).toBe("Most liked");
                expect(document.getElementById("option-downloaded").innerHTML).toBe(
                    "Most downloaded"
                );
                expect(document.getElementById("option-alphabetical").innerHTML).toBe("A-Z");
            });
        });
    });
});
