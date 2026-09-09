/**
 * MusicBlocks v3.4.1
 *
 * @author Sapnil Biswas
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

global._ = jest.fn(str => str);
global.hideOnClickOutside = jest.fn();
global.updateCheckboxes = jest.fn();
global.ClipboardJS = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    destroy: jest.fn()
}));

const { GlobalCard } = require("../GlobalCard");

describe("GlobalCard", () => {
    let card;
    let mockPlanet;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML = '<div id="global-projects"></div>';

        mockPlanet = {
            ProjectStorage: {
                isLiked: jest.fn().mockReturnValue(false),
                like: jest.fn()
            },
            GlobalPlanet: {
                cache: {
                    "test-id-1": {
                        ProjectName: "Test Project",
                        ProjectImage: "test-image.png",
                        ProjectIsMusicBlocks: 1,
                        ProjectLikes: 5,
                        ProjectTags: ["1", "2"]
                    }
                },
                ProjectViewer: { open: jest.fn() },
                openGlobalProject: jest.fn(),
                mergeGlobalProject: jest.fn()
            },
            ServerInterface: {
                likeProject: jest.fn()
            },
            TagsManifest: {
                1: { TagName: "Music" },
                2: { TagName: "Art" }
            },
            SaveInterface: {
                showToast: jest.fn()
            }
        };

        card = new GlobalCard(mockPlanet);
    });

    afterEach(() => {
        document.body.innerHTML = "";
    });

    describe("constructor", () => {
        it("should initialize with default values", () => {
            expect(card.Planet).toBe(mockPlanet);
            expect(card.ProjectData).toBeNull();
            expect(card.id).toBeNull();
            expect(card.likeTimeout).toBeNull();
            expect(card.likePending).toBe(false);
            expect(card.clipboard).toBeNull();
        });

        it("should have placeholder image paths", () => {
            expect(card.PlaceholderMBImage).toBe("images/mbgraphic.png");
            expect(card.PlaceholderTBImage).toBe("images/tbgraphic.png");
        });

        it("should contain renderData HTML template", () => {
            expect(card.renderData).toContain("{ID}");
            expect(card.renderData).toContain("card-image");
            expect(card.renderData).toContain("card-content");
            expect(card.renderData).toContain("card-action");
        });
    });

    describe("init", () => {
        it("should set id and ProjectData from cache", () => {
            card.init("test-id-1");
            expect(card.id).toBe("test-id-1");
            expect(card.ProjectData).toBe(mockPlanet.GlobalPlanet.cache["test-id-1"]);
        });

        it("should set the correct project data", () => {
            card.init("test-id-1");
            expect(card.ProjectData.ProjectName).toBe("Test Project");
            expect(card.ProjectData.ProjectLikes).toBe(5);
        });
    });

    describe("showToast", () => {
        it("should call SaveInterface.showToast with the message", () => {
            card.showToast("Test message");
            expect(mockPlanet.SaveInterface.showToast).toHaveBeenCalledWith("Test message");
        });

        it("should not throw when SaveInterface is not available", () => {
            card.Planet = {};
            expect(() => card.showToast("msg")).not.toThrow();
        });

        it("should handle error toast styling", () => {
            jest.useFakeTimers();
            document.body.innerHTML = '<div class="toast">msg</div>';
            card.showToast("Error!", true);
            jest.advanceTimersByTime(20);
            jest.useRealTimers();
        });
    });

    describe("render", () => {
        it("should render card into global-projects container", () => {
            card.init("test-id-1");
            card.render();

            const container = document.getElementById("global-projects");
            expect(container.children.length).toBeGreaterThan(0);
        });

        it("should set the project image from ProjectData", () => {
            card.init("test-id-1");
            card.render();

            const img = document.getElementById("global-project-image-test-id-1");
            expect(img.src).toContain("test-image.png");
        });

        it("should set the project title", () => {
            card.init("test-id-1");
            card.render();

            const title = document.getElementById("global-project-title-test-id-1");
            expect(title.textContent).toBe("Test Project");
        });

        it("should set the like count", () => {
            card.init("test-id-1");
            card.render();

            const likes = document.getElementById("global-project-likes-test-id-1");
            expect(likes.textContent).toBe("5");
        });

        it("should render tags as chip elements", () => {
            card.init("test-id-1");
            card.render();

            const tagContainer = document.getElementById("global-project-tags-test-id-1");
            const chips = tagContainer.querySelectorAll(".chipselect");
            expect(chips.length).toBe(2);
            expect(chips[0].textContent).toBe("Music");
            expect(chips[1].textContent).toBe("Art");
        });

        it("should use placeholder image when ProjectImage is null", () => {
            mockPlanet.GlobalPlanet.cache["test-id-1"].ProjectImage = null;
            card.init("test-id-1");
            card.render();

            const img = document.getElementById("global-project-image-test-id-1");
            expect(img.src).toContain("mbgraphic.png");
        });

        it("should use TurtleBlocks placeholder when not MusicBlocks", () => {
            mockPlanet.GlobalPlanet.cache["test-id-1"].ProjectImage = "";
            mockPlanet.GlobalPlanet.cache["test-id-1"].ProjectIsMusicBlocks = 0;
            card.init("test-id-1");
            card.render();

            const img = document.getElementById("global-project-image-test-id-1");
            expect(img.src).toContain("tbgraphic.png");
        });

        it("should set like icon to favorite when project is liked", () => {
            mockPlanet.ProjectStorage.isLiked.mockReturnValue(true);
            card.init("test-id-1");
            card.render();

            const likeIcon = document.getElementById("global-like-icon-test-id-1");
            expect(likeIcon.textContent).toBe("favorite");
        });

        it("should set like icon to favorite_border when project is not liked", () => {
            mockPlanet.ProjectStorage.isLiked.mockReturnValue(false);
            card.init("test-id-1");
            card.render();

            const likeIcon = document.getElementById("global-like-icon-test-id-1");
            expect(likeIcon.textContent).toBe("favorite_border");
        });

        it("should call updateCheckboxes after rendering", () => {
            card.init("test-id-1");
            card.render();
            expect(global.updateCheckboxes).toHaveBeenCalledWith("global-sharebox-test-id-1");
        });

        it("should initialize ClipboardJS", () => {
            card.init("test-id-1");
            card.render();
            expect(global.ClipboardJS).toHaveBeenCalled();
        });
    });

    describe("cleanup", () => {
        it("should clear likeTimeout", () => {
            jest.useFakeTimers();
            card.likeTimeout = setTimeout(() => {}, 1000);
            card.cleanup();
            expect(card.likeTimeout).toBeNull();
            jest.useRealTimers();
        });

        it("should destroy clipboard and nullify references", () => {
            const mockClipboard = { destroy: jest.fn() };
            card.clipboard = mockClipboard;
            card.cleanup();

            expect(mockClipboard.destroy).toHaveBeenCalled();
            expect(card.clipboard).toBeNull();
            expect(card.ProjectData).toBeNull();
            expect(card.Planet).toBeNull();
        });

        it("should handle cleanup when no clipboard or timeout exist", () => {
            expect(() => card.cleanup()).not.toThrow();
            expect(card.ProjectData).toBeNull();
        });
    });

    describe("like", () => {
        beforeEach(() => {
            jest.useFakeTimers();
            card.init("test-id-1");
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("should do nothing when likePending is true", () => {
            card.likePending = true;
            card.like();
            jest.advanceTimersByTime(1000);
            expect(mockPlanet.ServerInterface.likeProject).not.toHaveBeenCalled();
        });

        it("should set likePending to true and schedule server call", () => {
            card.like();
            expect(card.likePending).toBe(true);
        });

        it("should call likeProject after 500ms delay", () => {
            card.like();
            jest.advanceTimersByTime(500);
            expect(mockPlanet.ServerInterface.likeProject).toHaveBeenCalledWith(
                "test-id-1",
                true,
                expect.any(Function)
            );
        });

        it("should unlike when project is already liked", () => {
            mockPlanet.ProjectStorage.isLiked.mockReturnValue(true);
            card.like();
            jest.advanceTimersByTime(500);
            expect(mockPlanet.ServerInterface.likeProject).toHaveBeenCalledWith(
                "test-id-1",
                false,
                expect.any(Function)
            );
        });
    });

    describe("afterLike", () => {
        it("should call setLike on success", () => {
            card.init("test-id-1");
            card.render();

            card.afterLike({ success: true }, true);
            expect(mockPlanet.ProjectStorage.like).toHaveBeenCalledWith("test-id-1", true);
        });

        it("should call setLike even on error (current behavior)", () => {
            card.init("test-id-1");
            card.render();

            card.afterLike({ success: false, error: "ERROR_ACTION_NOT_PERMITTED" }, false);
            expect(mockPlanet.ProjectStorage.like).toHaveBeenCalledWith("test-id-1", false);
        });
    });

    describe("setLike", () => {
        beforeEach(() => {
            card.init("test-id-1");
            card.render();
        });

        it("should increment likes count and set icon to favorite when liking", () => {
            card.setLike(true);
            const likes = document.getElementById("global-project-likes-test-id-1");
            const icon = document.getElementById("global-like-icon-test-id-1");
            expect(likes.textContent).toBe("6");
            expect(icon.textContent).toBe("favorite");
        });

        it("should decrement likes count and set icon to favorite_border when unliking", () => {
            card.setLike(false);
            const likes = document.getElementById("global-project-likes-test-id-1");
            const icon = document.getElementById("global-like-icon-test-id-1");
            expect(likes.textContent).toBe("4");
            expect(icon.textContent).toBe("favorite_border");
        });
    });
});
