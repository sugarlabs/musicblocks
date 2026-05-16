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

// LocalCard uses _() for its template strings at construction time
global._ = jest.fn(str => str);

const { LocalCard } = require("../LocalCard");

/**
 * Build a minimal mock Planet that LocalCard needs.
 */
function makeMockPlanet(overrides = {}) {
    return {
        IsMusicBlocks: 1,
        ProjectStorage: {
            ImageDataURL: "images/default.png",
            renameProject: jest.fn(),
            initialiseNewProject: jest.fn()
        },
        SaveInterface: {
            saveHTML: jest.fn()
        },
        LocalPlanet: {
            ProjectTable: {},
            openProject: jest.fn(),
            mergeProject: jest.fn(),
            openDeleteModal: jest.fn(),
            Publisher: { open: jest.fn() },
            updateProjects: jest.fn()
        },
        GlobalPlanet: {
            forceAddToCache: jest.fn(),
            ProjectViewer: { open: jest.fn() }
        },
        ...overrides
    };
}

/**
 * Minimal project data for a card.
 */
function makeProjectData(overrides = {}) {
    return {
        ProjectName: "My Project",
        ProjectData: "<xml/>",
        ProjectImage: null,
        PublishedData: null,
        ...overrides
    };
}

describe("LocalCard", () => {
    let planet;

    beforeEach(() => {
        jest.clearAllMocks();
        planet = makeMockPlanet();

        // Provide the DOM container that render() appends cards to
        document.body.innerHTML = `
            <div id="local-projects"></div>
            <div id="global-tab"></div>
        `;
    });

    // ─── constructor ────────────────────────────────────────────────────────────

    describe("constructor", () => {
        it("should initialise all properties to defaults", () => {
            const card = new LocalCard(planet);

            expect(card.Planet).toBe(planet);
            expect(card.id).toBeNull();
            expect(card.ProjectData).toBeNull();
            expect(card.PlaceholderMBImage).toBe("images/mbgraphic.png");
            expect(card.PlaceholderTBImage).toBe("images/tbgraphic.png");
            expect(card.CopySuffix).toBe("(Copy)");
        });

        it("should build the renderData template containing {ID} placeholders", () => {
            const card = new LocalCard(planet);
            expect(card.renderData).toContain("{ID}");
        });

        it("should call _() for every translated string in the template", () => {
            new LocalCard(planet);
            // _ is called for "Copy", "View published project", "Publish project",
            // "Edit project", "Delete project", "Download project",
            // "Merge with current project", "Duplicate project"
            expect(global._).toHaveBeenCalledWith("Copy");
            expect(global._).toHaveBeenCalledWith("Edit project");
            expect(global._).toHaveBeenCalledWith("Delete project");
        });
    });

    // ─── init() ─────────────────────────────────────────────────────────────────

    describe("init()", () => {
        it("should set id and ProjectData from the ProjectTable", () => {
            const data = makeProjectData();
            planet.LocalPlanet.ProjectTable["proj1"] = data;

            const card = new LocalCard(planet);
            card.init("proj1");

            expect(card.id).toBe("proj1");
            expect(card.ProjectData).toBe(data);
        });
    });

    // ─── render() ───────────────────────────────────────────────────────────────

    describe("render()", () => {
        function prepareCard(id, projectOverrides = {}) {
            const data = makeProjectData(projectOverrides);
            planet.LocalPlanet.ProjectTable[id] = data;

            const card = new LocalCard(planet);
            card.init(id);
            return card;
        }

        it("should append a card element to #local-projects", () => {
            const card = prepareCard("p1");
            card.render();

            expect(document.getElementById("local-projects").children.length).toBe(1);
        });

        it("should use the placeholder MB image when ProjectImage is null and IsMusicBlocks=1", () => {
            const card = prepareCard("p2", { ProjectImage: null });
            card.render();

            const img = document.querySelector("#local-projects img.project-card-image");
            expect(img.src).toContain("mbgraphic.png");
        });

        it("should use the placeholder TB image when IsMusicBlocks is not 1", () => {
            planet.IsMusicBlocks = 0;
            const card = prepareCard("p3", { ProjectImage: null });
            card.render();

            const img = document.querySelector("#local-projects img.project-card-image");
            expect(img.src).toContain("tbgraphic.png");
        });

        it("should use ProjectImage as src when it is not null", () => {
            const card = prepareCard("p4", { ProjectImage: "data:image/png;base64,abc" });
            card.render();

            const img = document.querySelector("#local-projects img.project-card-image");
            expect(img.src).toBe("data:image/png;base64,abc");
        });

        it("should set input value to the project name", () => {
            const card = prepareCard("p5", { ProjectName: "Cool Song" });
            card.render();

            const input = document.querySelector("#local-projects input.card-title");
            expect(input.value).toBe("Cool Song");
        });

        it("should call openProject when the edit button is clicked", () => {
            const card = prepareCard("p6");
            card.render();

            document.getElementById("local-project-edit-p6").click();
            expect(planet.LocalPlanet.openProject).toHaveBeenCalledWith("p6");
        });

        it("should call openProject when the image is clicked", () => {
            const card = prepareCard("p7");
            card.render();

            document.getElementById("local-project-image-p7").click();
            expect(planet.LocalPlanet.openProject).toHaveBeenCalledWith("p7");
        });

        it("should call mergeProject when the merge button is clicked", () => {
            const card = prepareCard("p8");
            card.render();

            document.getElementById("local-project-merge-p8").click();
            expect(planet.LocalPlanet.mergeProject).toHaveBeenCalledWith("p8");
        });

        it("should call openDeleteModal when the delete button is clicked", () => {
            const card = prepareCard("p9");
            card.render();

            document.getElementById("local-project-delete-p9").click();
            expect(planet.LocalPlanet.openDeleteModal).toHaveBeenCalledWith("p9");
        });

        it("should call Publisher.open when the publish button is clicked", () => {
            const card = prepareCard("p10");
            card.render();

            document.getElementById("local-project-publish-p10").click();
            expect(planet.LocalPlanet.Publisher.open).toHaveBeenCalledWith("p10");
        });

        it("should call renameProject when the name input changes", () => {
            const card = prepareCard("p11");
            card.render();

            const input = document.getElementById("local-project-input-p11");
            input.value = "New Name";
            input.dispatchEvent(new Event("input"));

            expect(planet.ProjectStorage.renameProject).toHaveBeenCalledWith("p11", "New Name");
        });

        it("should show the cloud icon and call forceAddToCache when PublishedData exists", () => {
            const card = prepareCard("p12", {
                PublishedData: { ProjectDescription: "A desc" }
            });
            card.render();

            const cloud = document.getElementById("local-project-cloud-p12");
            expect(cloud.style.display).toBe("initial");

            cloud.click();
            expect(planet.GlobalPlanet.forceAddToCache).toHaveBeenCalledWith(
                "p12",
                expect.any(Function)
            );
        });

        it("should invoke ProjectViewer.open inside forceAddToCache callback", () => {
            const card = prepareCard("p13", {
                PublishedData: { ProjectDescription: "desc" }
            });
            // Make forceAddToCache immediately invoke its callback
            planet.GlobalPlanet.forceAddToCache.mockImplementation((id, cb) => cb());

            card.render();
            document.getElementById("local-project-cloud-p13").click();

            expect(planet.GlobalPlanet.ProjectViewer.open).toHaveBeenCalledWith("p13");
        });
    });

    // ─── download() ─────────────────────────────────────────────────────────────

    describe("download()", () => {
        it("should call saveHTML with project image when ProjectImage is not null", () => {
            const data = makeProjectData({
                ProjectImage: "data:image/png;base64,xyz",
                PublishedData: { ProjectDescription: "my description" }
            });
            planet.LocalPlanet.ProjectTable["dl1"] = data;

            const card = new LocalCard(planet);
            card.init("dl1");
            card.download();

            expect(planet.SaveInterface.saveHTML).toHaveBeenCalledWith(
                "My Project",
                "<xml/>",
                "data:image/png;base64,xyz",
                "my description"
            );
        });

        it("should fall back to ImageDataURL when ProjectImage is null", () => {
            const data = makeProjectData({ ProjectImage: null, PublishedData: null });
            planet.LocalPlanet.ProjectTable["dl2"] = data;

            const card = new LocalCard(planet);
            card.init("dl2");
            card.download();

            expect(planet.SaveInterface.saveHTML).toHaveBeenCalledWith(
                "My Project",
                "<xml/>",
                "images/default.png",
                null
            );
        });
    });

    // ─── duplicate() ────────────────────────────────────────────────────────────

    describe("duplicate()", () => {
        it("should call initialiseNewProject with suffixed name and then updateProjects", () => {
            const data = makeProjectData({ ProjectImage: "img.png" });
            planet.LocalPlanet.ProjectTable["dup1"] = data;

            const card = new LocalCard(planet);
            card.init("dup1");
            card.duplicate();

            expect(planet.ProjectStorage.initialiseNewProject).toHaveBeenCalledWith(
                "My Project (Copy)",
                "<xml/>",
                "img.png"
            );
            expect(planet.LocalPlanet.updateProjects).toHaveBeenCalled();
        });

        it("should call duplicate() via the download button click path", () => {
            const data = makeProjectData({ ProjectImage: null, PublishedData: null });
            planet.LocalPlanet.ProjectTable["dup2"] = data;

            const card = new LocalCard(planet);
            card.init("dup2");
            card.render();

            document.getElementById("local-project-download-dup2").click();
            // download button → calls download(), not duplicate() – separate path
            expect(planet.SaveInterface.saveHTML).toHaveBeenCalled();
        });

        it("should call duplicate() when the duplicate button is clicked", () => {
            const data = makeProjectData({ ProjectImage: null, PublishedData: null });
            planet.LocalPlanet.ProjectTable["dup3"] = data;

            const card = new LocalCard(planet);
            card.init("dup3");
            card.render();

            document.getElementById("local-project-duplicate-dup3").click();
            expect(planet.ProjectStorage.initialiseNewProject).toHaveBeenCalled();
            expect(planet.LocalPlanet.updateProjects).toHaveBeenCalled();
        });
    });
});
