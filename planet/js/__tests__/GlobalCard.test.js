/**
 * MusicBlocks v3.4.1
 *
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

global._ = jest.fn(str => str);
global.hideOnClickOutside = jest.fn();
global.updateCheckboxes = jest.fn();

class MockClipboard {
    constructor() {
        this.on = jest.fn((event, cb) => {
            if (event === "success") this.successCb = cb;
            if (event === "error") this.errorCb = cb;
            return this;
        });
        this.destroy = jest.fn();
    }
}
global.ClipboardJS = MockClipboard;

const { GlobalCard } = require("../GlobalCard");

function makeMockPlanet(overrides = {}) {
    return {
        ProjectStorage: {
            isLiked: jest.fn(() => false),
            like: jest.fn()
        },
        SaveInterface: {
            showToast: jest.fn()
        },
        GlobalPlanet: {
            cache: {},
            ProjectViewer: { open: jest.fn() },
            openGlobalProject: jest.fn(),
            mergeGlobalProject: jest.fn()
        },
        ServerInterface: {
            likeProject: jest.fn((id, like, cb) => cb({ success: true }))
        },
        TagsManifest: {
            tag1: { TagName: "Tag One" }
        },
        ...overrides
    };
}

function makeProjectData(overrides = {}) {
    return {
        ProjectName: "Global Song",
        ProjectImage: null,
        ProjectIsMusicBlocks: 1,
        ProjectLikes: 5,
        ProjectTags: ["tag1"],
        ...overrides
    };
}

describe("GlobalCard", () => {
    let planet;

    beforeEach(() => {
        jest.clearAllMocks();
        planet = makeMockPlanet();
        document.body.innerHTML = '<div id="global-projects"></div>';
    });

    describe("constructor", () => {
        it("initializes all properties to defaults", () => {
            const card = new GlobalCard(planet);
            expect(card.Planet).toBe(planet);
            expect(card.ProjectData).toBeNull();
            expect(card.id).toBeNull();
            expect(card.PlaceholderMBImage).toBe("images/mbgraphic.png");
            expect(card.PlaceholderTBImage).toBe("images/tbgraphic.png");
            expect(card.renderData).toContain("{ID}");
        });
    });

    describe("init()", () => {
        it("sets id and ProjectData from the GlobalPlanet cache", () => {
            const data = makeProjectData();
            planet.GlobalPlanet.cache["g1"] = data;

            const card = new GlobalCard(planet);
            card.init("g1");

            expect(card.id).toBe("g1");
            expect(card.ProjectData).toBe(data);
        });
    });

    describe("showToast", () => {
        it("calls SaveInterface.showToast", () => {
            const card = new GlobalCard(planet);
            card.showToast("Hello");
            expect(planet.SaveInterface.showToast).toHaveBeenCalledWith("Hello");
        });

        it("modifies toast background style for errors", () => {
            jest.useFakeTimers();
            const card = new GlobalCard(planet);

            const dummyToast = document.createElement("div");
            dummyToast.className = "toast";
            document.body.appendChild(dummyToast);

            card.showToast("Error occurred", true);

            jest.advanceTimersByTime(10);

            expect(dummyToast.style.background).toBe("rgb(244, 67, 54)");
            jest.useRealTimers();
        });
    });

    describe("render()", () => {
        function prepareCard(id, projectOverrides = {}) {
            const data = makeProjectData(projectOverrides);
            planet.GlobalPlanet.cache[id] = data;
            const card = new GlobalCard(planet);
            card.init(id);
            return card;
        }

        it("appends element to #global-projects", () => {
            const card = prepareCard("g2");
            card.render();
            expect(document.getElementById("global-projects").children.length).toBe(1);
        });

        it("uses MB placeholder when ProjectImage is empty and IsMusicBlocks is 1", () => {
            const card = prepareCard("g3", { ProjectImage: null, ProjectIsMusicBlocks: 1 });
            card.render();
            const img = document.getElementById("global-project-image-g3");
            expect(img.src).toContain("mbgraphic.png");
        });

        it("uses TB placeholder when ProjectImage is empty and IsMusicBlocks is not 1", () => {
            const card = prepareCard("g4", { ProjectImage: null, ProjectIsMusicBlocks: 0 });
            card.render();
            const img = document.getElementById("global-project-image-g4");
            expect(img.src).toContain("tbgraphic.png");
        });

        it("uses ProjectImage when not empty", () => {
            const card = prepareCard("g5", { ProjectImage: "data:image/png;base64,123" });
            card.render();
            const img = document.getElementById("global-project-image-g5");
            expect(img.src).toBe("data:image/png;base64,123");
        });

        it("attaches tag chips", () => {
            const card = prepareCard("g6");
            card.render();
            const tagContainer = document.getElementById("global-project-tags-g6");
            expect(tagContainer.children.length).toBe(1);
            expect(tagContainer.children[0].textContent).toBe("Tag One");
        });

        it("sets title, likes, and handles interactions", () => {
            const card = prepareCard("g7", { ProjectName: "Global Song V3" });
            card.render();

            expect(document.getElementById("global-project-title-g7").textContent).toBe(
                "Global Song V3"
            );
            expect(document.getElementById("global-project-likes-g7").textContent).toBe("5");

            // Click details button
            document.getElementById("global-project-more-details-g7").click();
            expect(planet.GlobalPlanet.ProjectViewer.open).toHaveBeenCalledWith("g7");

            // Click open button
            document.getElementById("global-project-open-g7").click();
            expect(planet.GlobalPlanet.openGlobalProject).toHaveBeenCalledWith("g7");

            // Click image
            document.getElementById("global-project-image-g7").click();
            expect(planet.GlobalPlanet.ProjectViewer.open).toHaveBeenCalledTimes(2);

            // Click merge
            document.getElementById("global-project-merge-g7").click();
            expect(planet.GlobalPlanet.mergeGlobalProject).toHaveBeenCalledWith("g7");
        });

        it("toggles share card display", () => {
            const card = prepareCard("g8");
            card.render();

            const shareBox = document.getElementById("global-sharebox-g8");
            expect(shareBox.style.display).toBe("none");

            document.getElementById("global-project-share-g8").click();
            expect(shareBox.style.display).toBe("initial");
            expect(global.hideOnClickOutside).toHaveBeenCalled();

            document.getElementById("global-project-share-g8").click();
            expect(shareBox.style.display).toBe("none");
        });

        it("triggers updateCheckboxes when share options clicked", () => {
            const card = prepareCard("g9");
            card.render();

            jest.clearAllMocks();
            document.getElementById("global-checkboxrun-g9").click();
            expect(global.updateCheckboxes).toHaveBeenCalled();

            jest.clearAllMocks();
            document.getElementById("global-checkboxshow-g9").click();
            expect(global.updateCheckboxes).toHaveBeenCalled();

            jest.clearAllMocks();
            document.getElementById("global-checkboxcollapse-g9").click();
            expect(global.updateCheckboxes).toHaveBeenCalled();
        });

        it("triggers like interaction when like clicked", () => {
            const card = prepareCard("g10");
            card.render();

            card.like = jest.fn();
            document.getElementById("global-like-icon-g10").click();
            expect(card.like).toHaveBeenCalled();
        });

        it("sets up clipboard and registers handlers", () => {
            const card = prepareCard("g11");
            card.render();

            expect(card.clipboard).toBeDefined();
            expect(card.clipboard.on).toHaveBeenCalledWith("success", expect.any(Function));
            expect(card.clipboard.on).toHaveBeenCalledWith("error", expect.any(Function));

            // Success callback
            const successEvt = { text: "http://copied", clearSelection: jest.fn() };
            card.clipboard.successCb(successEvt);
            expect(planet.SaveInterface.showToast).toHaveBeenCalled();
            expect(successEvt.clearSelection).toHaveBeenCalled();

            // Error callback
            const errorEvt = { action: "copy" };
            card.clipboard.errorCb(errorEvt);
            expect(planet.SaveInterface.showToast).toHaveBeenCalled();
        });
    });

    describe("cleanup()", () => {
        it("clears likeTimeout and destroys clipboard", () => {
            const data = makeProjectData();
            planet.GlobalPlanet.cache["g12"] = data;
            const card = new GlobalCard(planet);
            card.init("g12");
            card.render();

            card.likeTimeout = setTimeout(() => {}, 1000);
            const clipboardDestroy = card.clipboard.destroy;

            card.cleanup();

            expect(card.likeTimeout).toBeNull();
            expect(clipboardDestroy).toHaveBeenCalled();
            expect(card.clipboard).toBeNull();
            expect(card.ProjectData).toBeNull();
            expect(card.Planet).toBeNull();
        });
    });

    describe("like() and setLike()", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it("debounces like actions and updates counts appropriately (like true)", () => {
            const data = makeProjectData({ ProjectLikes: 10 });
            planet.GlobalPlanet.cache["g13"] = data;
            planet.ProjectStorage.isLiked.mockReturnValue(false); // not liked currently

            const card = new GlobalCard(planet);
            card.init("g13");
            card.render();

            card.like();
            expect(card.likePending).toBe(true);

            jest.advanceTimersByTime(500);

            expect(planet.ServerInterface.likeProject).toHaveBeenCalledWith(
                "g13",
                true,
                expect.any(Function)
            );
            expect(card.likePending).toBe(false);
            expect(planet.ProjectStorage.like).toHaveBeenCalledWith("g13", true);
            expect(document.getElementById("global-project-likes-g13").textContent).toBe("11");
            expect(document.getElementById("global-like-icon-g13").textContent).toBe("favorite");
        });

        it("debounces like actions and updates counts appropriately (like false)", () => {
            const data = makeProjectData({ ProjectLikes: 10 });
            planet.GlobalPlanet.cache["g14"] = data;
            planet.ProjectStorage.isLiked.mockReturnValue(true); // currently liked

            const card = new GlobalCard(planet);
            card.init("g14");
            card.render();

            card.like();
            expect(card.likePending).toBe(true);

            jest.advanceTimersByTime(500);

            expect(planet.ServerInterface.likeProject).toHaveBeenCalledWith(
                "g14",
                false,
                expect.any(Function)
            );
            expect(card.likePending).toBe(false);
            expect(planet.ProjectStorage.like).toHaveBeenCalledWith("g14", false);
            expect(document.getElementById("global-project-likes-g14").textContent).toBe("9");
            expect(document.getElementById("global-like-icon-g14").textContent).toBe(
                "favorite_border"
            );
        });
    });
});
