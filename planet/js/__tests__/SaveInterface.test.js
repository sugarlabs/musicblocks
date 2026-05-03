/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 e-esakman
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

const SaveInterface = require("../SaveInterface");

describe("SaveInterface", () => {
    let saveInterface;
    let mockPlanet;

    const originalUnderscore = global._;

    beforeAll(() => {
        global._ = jest.fn(str => str);
    });

    afterAll(() => {
        global._ = originalUnderscore;
    });

    beforeEach(() => {
        mockPlanet = { IsMusicBlocks: true };
        saveInterface = new SaveInterface(mockPlanet);
        document.body.innerHTML = "";
    });

    describe("constructor", () => {
        it("should set templates correctly for Music Blocks", () => {
            expect(saveInterface.buttonTemplate).toContain("Music Blocks");
            expect(saveInterface.htmlSaveTemplate).toContain("Music Blocks Project");
        });

        it("should set templates correctly for Turtle Blocks", () => {
            mockPlanet.IsMusicBlocks = false;
            const turtleInterface = new SaveInterface(mockPlanet);

            expect(turtleInterface.buttonTemplate).toContain("Turtle Blocks");
            expect(turtleInterface.htmlSaveTemplate).toContain("Turtle Blocks Project");
        });
    });

    describe("prepareHTML", () => {
        it("should replace template placeholders correctly", () => {
            const html = saveInterface.prepareHTML(
                "My Project",
                '{"blocks":[]}',
                "data:image/png;base64,123",
                "A cool project",
                "abc-123"
            );

            expect(html).toContain("My Project");
            expect(html).toContain(encodeURIComponent("abc-123"));
            expect(html).toContain("A cool project");
        });

        it("should escape HTML to prevent script injection", () => {
            const html = saveInterface.prepareHTML('<script>alert("xss")</script>', "", "", "", "");
            expect(html).not.toContain("<script>");
        });

        it("should escape project data safely", () => {
            const html = saveInterface.prepareHTML(
                "name",
                '<img src=x onerror=alert("xss")>',
                "",
                "desc",
                "id"
            );

            expect(html).not.toContain('<img src=x onerror=alert("xss")>');
            expect(html).toContain("&lt;img");
        });

        it("should reject invalid data URLs", () => {
            const html = saveInterface.prepareHTML(
                "name",
                "data",
                "data:text/html;base64,abc",
                "desc",
                "id"
            );

            expect(html).toContain('src=""');
        });

        it("allows http/https image URLs", () => {
            const url = "https://example.com/image.png";

            const html = saveInterface.prepareHTML("name", "data", url, "desc", "id");

            expect(html).toContain(url);
        });

        it("should handle missing project id gracefully", () => {
            const html = saveInterface.prepareHTML("name", "data", "", "desc", undefined);

            expect(html).not.toContain("Open in");
        });

        it("should handle empty image string safely", () => {
            const html = saveInterface.prepareHTML("name", "data", "", "desc", "id");

            expect(html).toContain('src=""');
        });

        it("should block unsafe image URLs", () => {
            const html = saveInterface.prepareHTML(
                "name",
                "data",
                "javascript:alert(1)",
                "desc",
                "id"
            );

            expect(html).toContain('src=""');
        });

        it("should allow valid image data URLs", () => {
            const validImage = "data:image/png;base64,iVBORw0KGgoAAAANS";
            const html = saveInterface.prepareHTML("name", "data", validImage, "desc", "id");

            expect(html).toContain(validImage);
        });

        it("should default description when null", () => {
            const html = saveInterface.prepareHTML("name", "data", "", null, "id");

            expect(html).toContain("No description provided");
        });

        it("handles undefined inputs safely", () => {
            const html = saveInterface.prepareHTML(
                undefined,
                undefined,
                undefined,
                undefined,
                undefined
            );

            expect(html).toBeDefined();
        });
    });

    describe("downloadURL", () => {
        it("should create an anchor element and triggers download", () => {
            const spyCreate = jest.spyOn(document, "createElement");
            const spyAppend = jest.spyOn(document.body, "appendChild");
            const spyRemove = jest.spyOn(document.body, "removeChild");

            saveInterface.downloadURL("test.html", "data:text/plain,hello");

            expect(spyCreate).toHaveBeenCalledWith("a");
            expect(spyAppend).toHaveBeenCalled();
            expect(spyRemove).toHaveBeenCalled();
        });
    });

    describe("saveHTML", () => {
        it("should generate encoded HTML and triggers download", () => {
            const spyPrepare = jest
                .spyOn(saveInterface, "prepareHTML")
                .mockReturnValue("<html>ok</html>");

            const spyDownload = jest
                .spyOn(saveInterface, "downloadURL")
                .mockImplementation(() => {});

            saveInterface.saveHTML("myfile", "data", "image", "desc", "id");

            expect(spyPrepare).toHaveBeenCalled();
            expect(spyDownload).toHaveBeenCalledTimes(1);
            expect(spyDownload.mock.calls[0][0]).toBe("myfile.html");
            expect(spyDownload.mock.calls[0][1]).toMatch(/^data:text\/plain/);
        });
    });
});
