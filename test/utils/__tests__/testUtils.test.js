/**
 * MusicBlocks v3.4.1
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2026 Music Blocks Contributors
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

const { createMockActivity } = require("../activityFactory");
const { createMockDOM } = require("../domFactory");
const { mockDocById } = require("../domMocks");
const { setupImageMock } = require("../imageMock");
const { setupSVGMock } = require("../svgMock");

describe("Test Infrastructure Helpers", () => {
    describe("activityFactory (createMockActivity)", () => {
        it("should return a mock activity object with default properties", () => {
            const activity = createMockActivity();

            expect(activity.cellSize).toBe(50);
            expect(activity.beginnerMode).toBe(false);
            expect(activity.blocks).toBeDefined();
            expect(activity.blocks.protoBlockDict).toEqual({});
            expect(typeof activity.blocks.makeBlock).toBe("function");
            expect(typeof activity.hideSearchWidget).toBe("function");
            expect(typeof activity.showSearchWidget).toBe("function");
            expect(activity.palettes).toEqual({});
        });

        it("should allow overriding default properties", () => {
            const customBlocks = { protoBlockDict: { test: true } };
            const activity = createMockActivity({
                cellSize: 100,
                beginnerMode: true,
                blocks: customBlocks
            });

            expect(activity.cellSize).toBe(100);
            expect(activity.beginnerMode).toBe(true);
            expect(activity.blocks).toBe(customBlocks);
        });

        it("should return empty object from makeBlock mock function by default", () => {
            const activity = createMockActivity();
            expect(activity.blocks.makeBlock()).toEqual({});
        });
    });

    describe("domFactory (createMockDOM)", () => {
        it("should return container and body DOM elements", () => {
            const { container, body } = createMockDOM();

            expect(container).toBeInstanceOf(HTMLElement);
            expect(body).toBeInstanceOf(HTMLElement);
            expect(container.style.visibility).toBe("visible");
            expect(container.style.top).toBe("100px");
            expect(body.parentNode).toBeDefined();
        });
    });

    describe("domMocks (mockDocById)", () => {
        let originalDocById;

        beforeEach(() => {
            originalDocById = global.docById;
        });

        afterEach(() => {
            global.docById = originalDocById;
        });

        it("should set global.docById and return mapped element if found in map", () => {
            const mockEl = document.createElement("span");
            mockEl.id = "my-test-element";

            mockDocById({ "my-test-element": mockEl });

            expect(typeof global.docById).toBe("function");

            const result = global.docById("my-test-element");
            expect(result).toBe(mockEl);
            expect(mockEl.parentNode).toBeDefined();
        });

        it("should create a fallback div element when id is not in map", () => {
            mockDocById({});

            const result = global.docById("unmapped-id");

            expect(result).toBeInstanceOf(HTMLElement);
            expect(result.tagName).toBe("DIV");
            expect(result.parentNode).toBeDefined();
        });
    });

    describe("imageMock (setupImageMock)", () => {
        let originalImage;

        beforeEach(() => {
            originalImage = global.Image;
        });

        afterEach(() => {
            global.Image = originalImage;
        });

        it("should replace global.Image with mock constructor", () => {
            setupImageMock();

            expect(typeof global.Image).toBe("function");

            const img = new global.Image();

            expect(img.tagName).toBe("IMG");
            expect(img.width).toBe(50);
            expect(typeof img.setAttribute).toBe("function");
            expect(typeof img.removeAttribute).toBe("function");
            expect(img.style).toBeDefined();
        });
    });

    describe("svgMock (setupSVGMock)", () => {
        let originalSVG;

        beforeEach(() => {
            originalSVG = global.SVG;
        });

        afterEach(() => {
            global.SVG = originalSVG;
        });

        it("should replace global.SVG with MockSVG class", () => {
            setupSVGMock();

            expect(global.SVG).toBeDefined();

            const svgInstance = new global.SVG();

            expect(svgInstance.docks).toEqual([]);
            expect(svgInstance.basicBox()).toBe("fill_color stroke_color block_label arg_label_0");
            expect(svgInstance.basicBlock()).toBe("fill_color stroke_color block_label");
            expect(svgInstance.getHeight()).toBe(12);

            expect(() => {
                svgInstance.setScale();
                svgInstance.setExpand();
                svgInstance.setOutie();
            }).not.toThrow();
        });
    });
});
