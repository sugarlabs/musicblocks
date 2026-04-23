/**
 * MusicBlocks v3.4.1
 *
 * @author Sapnil Biswas
 *
 * @copyright 2026 Musicblock Contributor
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

const jQueryMock = {
    tooltip: jest.fn(),
    modal: jest.fn()
};

global.jQuery = jest.fn(() => jQueryMock);

global.LocalCard = jest.fn().mockImplementation(() => {
    return {
        init: jest.fn(),
        render: jest.fn()
    };
});

global.Publisher = jest.fn().mockImplementation(() => {
    return {
        init: jest.fn()
    };
});

const { LocalPlanet } = require("../LocalPlanet");

describe("LocalPlanet", () => {
    let mockPlanet;
    let localPlanet;

    beforeEach(() => {
        // Setup DOM for LocalPlanet
        document.body.innerHTML = `
            <div id="local-projects"></div>
            <button id="deleter-button"></button>
            <span id="deleter-title"></span>
            <span id="deleter-name"></span>
            <img id="local-project-image-testProj1" />
            <img id="local-project-image-testProj2" />
        `;

        mockPlanet = {
            ProjectStorage: {
                data: {
                    Projects: {
                        testProj1: {
                            ProjectName: "Project 1",
                            DateLastModified: 100,
                            ProjectData: "data1"
                        },
                        testProj2: {
                            ProjectName: "Project 2",
                            DateLastModified: 200,
                            ProjectData: "data2"
                        }
                    }
                },
                deleteProject: jest.fn(),
                getCurrentProjectID: jest.fn(() => "testProj1"),
                setCurrentProjectID: jest.fn(),
                getCurrentProjectData: jest.fn(() => null),
                initialiseNewProject: jest.fn()
            },
            loadProjectFromData: jest.fn()
        };

        // Reset global mocks
        global.jQuery.mockClear();
        jQueryMock.tooltip.mockClear();
        jQueryMock.modal.mockClear();
        global.LocalCard.mockClear();
        global.Publisher.mockClear();

        localPlanet = new LocalPlanet(mockPlanet);
    });

    describe("constructor", () => {
        it("should initialize default properties correctly", () => {
            expect(localPlanet.Planet).toBe(mockPlanet);
            expect(localPlanet.CookieDuration).toBe(3650);
            expect(localPlanet.ProjectTable).toBeNull();
            expect(localPlanet.projects).toBeNull();
            expect(localPlanet.DeleteModalID).toBeNull();
            expect(localPlanet.Publisher).toBeNull();
            expect(localPlanet.currentProjectImage).toBeNull();
            expect(localPlanet.currentProjectID).toBeNull();
        });
    });

    describe("init", () => {
        it("should set ProjectTable, refresh projects, init delete modal, and init Publisher", () => {
            const refreshSpy = jest.spyOn(localPlanet, "refreshProjectArray");
            const initDeleteModalSpy = jest.spyOn(localPlanet, "initDeleteModal");

            localPlanet.init();

            expect(localPlanet.ProjectTable).toBe(mockPlanet.ProjectStorage.data.Projects);
            expect(refreshSpy).toHaveBeenCalled();
            expect(initDeleteModalSpy).toHaveBeenCalled();
            expect(global.Publisher).toHaveBeenCalledWith(mockPlanet);
            expect(localPlanet.Publisher.init).toHaveBeenCalled();
        });
    });

    describe("refreshProjectArray", () => {
        it("should populate and sort projects array by DateLastModified descending", () => {
            localPlanet.ProjectTable = mockPlanet.ProjectStorage.data.Projects;
            localPlanet.refreshProjectArray();

            // testProj2 (200) should be before testProj1 (100)
            expect(localPlanet.projects.length).toBe(2);
            expect(localPlanet.projects[0][0]).toBe("testProj2");
            expect(localPlanet.projects[1][0]).toBe("testProj1");
        });
    });

    describe("setCurrentProjectImage", () => {
        it("should update currentProjectImage and currentProjectID", () => {
            localPlanet.setCurrentProjectImage("test-image-src");

            expect(localPlanet.currentProjectImage).toBe("test-image-src");
            expect(mockPlanet.ProjectStorage.getCurrentProjectID).toHaveBeenCalled();
            expect(localPlanet.currentProjectID).toBe("testProj1");
        });
    });

    describe("initCards", () => {
        it("should instantiate and initialize LocalCard for each project", () => {
            localPlanet.ProjectTable = mockPlanet.ProjectStorage.data.Projects;
            localPlanet.refreshProjectArray();
            localPlanet.initCards();

            expect(global.LocalCard).toHaveBeenCalledTimes(2);
            expect(localPlanet.projects[0][1].init).toHaveBeenCalledWith("testProj2");
            expect(localPlanet.projects[1][1].init).toHaveBeenCalledWith("testProj1");
        });
    });

    describe("renderAllProjects", () => {
        it("should clear container, render each card, and update current project image if present", () => {
            localPlanet.ProjectTable = mockPlanet.ProjectStorage.data.Projects;
            localPlanet.refreshProjectArray();
            localPlanet.initCards();

            localPlanet.setCurrentProjectImage("new-image-src");
            localPlanet.renderAllProjects();

            expect(document.getElementById("local-projects").innerHTML).not.toBeNull();
            expect(localPlanet.projects[0][1].render).toHaveBeenCalled();
            expect(localPlanet.projects[1][1].render).toHaveBeenCalled();

            const currentImg = document.getElementById("local-project-image-testProj1");
            expect(currentImg.src).toContain("new-image-src");

            expect(global.jQuery).toHaveBeenCalledWith(".tooltipped");
            expect(jQueryMock.tooltip).toHaveBeenCalledWith({ delay: 50 });
        });
    });

    describe("updateProjects", () => {
        it("should remove tooltips, refresh array, init cards, and render projects", () => {
            const refreshSpy = jest.spyOn(localPlanet, "refreshProjectArray");
            const initCardsSpy = jest.spyOn(localPlanet, "initCards");
            const renderSpy = jest.spyOn(localPlanet, "renderAllProjects");

            localPlanet.ProjectTable = mockPlanet.ProjectStorage.data.Projects;
            localPlanet.updateProjects();

            expect(global.jQuery).toHaveBeenCalledWith(".tooltipped");
            expect(jQueryMock.tooltip).toHaveBeenCalledWith("remove");
            expect(refreshSpy).toHaveBeenCalled();
            expect(initCardsSpy).toHaveBeenCalled();
            expect(renderSpy).toHaveBeenCalled();
        });
    });

    describe("initDeleteModal", () => {
        it("should attach click listener to deleter-button and delete project if DeleteModalID is set", () => {
            localPlanet.initDeleteModal();
            localPlanet.DeleteModalID = "testProj1";

            const btn = document.getElementById("deleter-button");
            btn.click();

            expect(mockPlanet.ProjectStorage.deleteProject).toHaveBeenCalledWith("testProj1");
        });

        it("should not delete project if DeleteModalID is null", () => {
            localPlanet.initDeleteModal();
            localPlanet.DeleteModalID = null;

            const btn = document.getElementById("deleter-button");
            btn.click();

            expect(mockPlanet.ProjectStorage.deleteProject).not.toHaveBeenCalled();
        });
    });

    describe("openDeleteModal", () => {
        it("should update DeleteModalID, DOM text elements, and open the modal", () => {
            localPlanet.ProjectTable = mockPlanet.ProjectStorage.data.Projects;
            localPlanet.openDeleteModal("testProj2");

            expect(localPlanet.DeleteModalID).toBe("testProj2");
            expect(document.getElementById("deleter-title").textContent).toBe("Project 2");
            expect(document.getElementById("deleter-name").textContent).toBe("Project 2");

            expect(global.jQuery).toHaveBeenCalledWith("#deleter");
            expect(jQueryMock.modal).toHaveBeenCalledWith("open");
        });
    });

    describe("openProject", () => {
        it("should set current project ID and load project from data", () => {
            localPlanet.ProjectTable = mockPlanet.ProjectStorage.data.Projects;
            localPlanet.openProject("testProj1");

            expect(mockPlanet.ProjectStorage.setCurrentProjectID).toHaveBeenCalledWith("testProj1");
            expect(mockPlanet.loadProjectFromData).toHaveBeenCalledWith("data1");
        });
    });

    describe("mergeProject", () => {
        it("should initialise new project and load data when current project data is null", async () => {
            localPlanet.ProjectTable = mockPlanet.ProjectStorage.data.Projects;
            // mock getCurrentProjectData to return null
            mockPlanet.ProjectStorage.getCurrentProjectData.mockResolvedValueOnce(null);

            await localPlanet.mergeProject("testProj2");

            expect(mockPlanet.ProjectStorage.getCurrentProjectData).toHaveBeenCalled();
            expect(mockPlanet.ProjectStorage.initialiseNewProject).toHaveBeenCalled();
            expect(mockPlanet.loadProjectFromData).toHaveBeenCalledWith("data2");
        });

        it("should load project data with merge flag true when current project data exists", async () => {
            localPlanet.ProjectTable = mockPlanet.ProjectStorage.data.Projects;
            // mock getCurrentProjectData to return existing data
            mockPlanet.ProjectStorage.getCurrentProjectData.mockResolvedValueOnce("existing-data");

            await localPlanet.mergeProject("testProj1");

            expect(mockPlanet.ProjectStorage.getCurrentProjectData).toHaveBeenCalled();
            expect(mockPlanet.ProjectStorage.initialiseNewProject).not.toHaveBeenCalled();
            expect(mockPlanet.loadProjectFromData).toHaveBeenCalledWith("data1", true);
        });
    });
});
