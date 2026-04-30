/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Sapnil Biswas
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

const ProjectViewer = require("../ProjectViewer");

describe("ProjectViewer", () => {
    let projectViewer;
    let mockPlanet;
    let mockJQuery;

    beforeAll(() => {
        global._ = jest.fn(str => str);
        global.hideOnClickOutside = jest.fn();
        mockJQuery = jest.fn(() => ({
            modal: jest.fn()
        }));
        global.jQuery = mockJQuery;
    });

    afterAll(() => {
        delete global._;
        delete global.hideOnClickOutside;
        delete global.jQuery;
    });

    beforeEach(() => {
        mockPlanet = {
            GlobalPlanet: {
                cache: {
                    "proj-1": {
                        ProjectName: "Project 1",
                        ProjectLastUpdated: 1619443200000,
                        ProjectCreatedDate: 1619443200000,
                        ProjectDownloads: 10,
                        ProjectLikes: 5,
                        ProjectImage: "image-url",
                        ProjectIsMusicBlocks: 1,
                        ProjectDescription: "A great project",
                        ProjectTags: ["tag-1"]
                    }
                },
                getData: jest.fn(),
                openGlobalProject: jest.fn(),
                mergeGlobalProject: jest.fn()
            },
            TagsManifest: {
                "tag-1": { TagName: "Music" }
            },
            ProjectStorage: {
                isReported: jest.fn(() => false),
                report: jest.fn(),
                ImageDataURL: "default-image"
            },
            ServerInterface: {
                reportProject: jest.fn()
            },
            SaveInterface: {
                saveHTML: jest.fn()
            }
        };

        document.body.innerHTML = `
            <div id="projectviewer"></div>
            <div id="projectviewer-title"></div>
            <div id="projectviewer-last-updated"></div>
            <div id="projectviewer-date"></div>
            <div id="projectviewer-downloads"></div>
            <div id="projectviewer-likes"></div>
            <img id="projectviewer-image" />
            <div id="projectviewer-description"></div>
            <div id="projectviewer-tags"></div>
            <div id="projectviewer-report-project"></div>
            <div id="projectviewer-report-project-disabled"></div>
            <input id="reportdescription" />
            <div id="projectviewer-report-content"></div>
            <div id="projectviewer-reportsubmit-content"></div>
            <div id="projectviewer-report-progress"></div>
            <div id="report-error"></div>
            <div id="projectviewer-report-card"></div>
            <div id="submittext"></div>
            <button id="projectviewer-download-file"></button>
            <button id="projectviewer-open-mb"></button>
            <button id="projectviewer-merge-mb"></button>
            <button id="projectviewer-report-submit"></button>
            <button id="projectviewer-report-close"></button>
        `;

        projectViewer = new ProjectViewer(mockPlanet);
    });

    describe("constructor", () => {
        it("should initialize with correct properties", () => {
            expect(projectViewer.Planet).toBe(mockPlanet);
            expect(projectViewer.ProjectCache).toBe(mockPlanet.GlobalPlanet.cache);
            expect(projectViewer.id).toBeNull();
        });
    });

    describe("open", () => {
        it("should populate DOM elements and open modal", () => {
            projectViewer.open("proj-1");

            expect(document.getElementById("projectviewer-title").textContent).toBe("Project 1");
            expect(document.getElementById("projectviewer-description").textContent).toBe(
                "A great project"
            );
            expect(document.getElementById("projectviewer-image").src).toContain("image-url");
            expect(mockJQuery).toHaveBeenCalledWith("#projectviewer");
        });

        it("should use placeholder image if ProjectImage is empty", () => {
            mockPlanet.GlobalPlanet.cache["proj-1"].ProjectImage = "";
            projectViewer.open("proj-1");
            expect(document.getElementById("projectviewer-image").src).toContain(
                "images/mbgraphic.png"
            );
        });

        it("should use Turtle Blocks placeholder image if ProjectIsMusicBlocks is 0", () => {
            mockPlanet.GlobalPlanet.cache["proj-1"].ProjectImage = "";
            mockPlanet.GlobalPlanet.cache["proj-1"].ProjectIsMusicBlocks = 0;
            projectViewer.open("proj-1");
            expect(document.getElementById("projectviewer-image").src).toContain(
                "images/tbgraphic.png"
            );
        });

        it("should handle reported state correctly", () => {
            mockPlanet.ProjectStorage.isReported.mockReturnValue(true);
            projectViewer.open("proj-1");
            expect(document.getElementById("projectviewer-report-project").style.display).toBe(
                "none"
            );
            expect(
                document.getElementById("projectviewer-report-project-disabled").style.display
            ).toBe("block");
        });
    });

    describe("download", () => {
        it("should call GlobalPlanet.getData", () => {
            projectViewer.id = "proj-1";
            projectViewer.download();
            expect(mockPlanet.GlobalPlanet.getData).toHaveBeenCalledWith(
                "proj-1",
                expect.any(Function)
            );
        });
    });

    describe("afterDownload", () => {
        it("should call SaveInterface.saveHTML with project data", () => {
            projectViewer.id = "proj-1";
            projectViewer.afterDownload("mock-data");
            expect(mockPlanet.SaveInterface.saveHTML).toHaveBeenCalledWith(
                "Project 1",
                "mock-data",
                "image-url",
                "A great project",
                "proj-1"
            );
        });
    });

    describe("openProject and mergeProject", () => {
        it("should delegate to GlobalPlanet", () => {
            projectViewer.id = "proj-1";
            projectViewer.openProject();
            expect(mockPlanet.GlobalPlanet.openGlobalProject).toHaveBeenCalledWith("proj-1");

            projectViewer.mergeProject();
            expect(mockPlanet.GlobalPlanet.mergeGlobalProject).toHaveBeenCalledWith("proj-1");
        });
    });

    describe("reporter functionality", () => {
        it("should open reporter UI", () => {
            projectViewer.openReporter();
            expect(document.getElementById("projectviewer-report-card").style.display).toBe(
                "block"
            );
            expect(global.hideOnClickOutside).toHaveBeenCalled();
        });

        it("should close reporter UI", () => {
            projectViewer.closeReporter();
            expect(document.getElementById("projectviewer-report-card").style.display).toBe("none");
        });

        describe("submitReporter", () => {
            it("should show error if description is empty", () => {
                document.getElementById("reportdescription").value = "";
                projectViewer.submitReporter();
                expect(document.getElementById("report-error").style.display).toBe("block");
                expect(mockPlanet.ServerInterface.reportProject).not.toHaveBeenCalled();
            });

            it("should show error if description is too long", () => {
                document.getElementById("reportdescription").value = "a".repeat(1001);
                projectViewer.submitReporter();
                expect(document.getElementById("report-error").style.display).toBe("block");
            });

            it("should call ServerInterface if description is valid", () => {
                projectViewer.id = "proj-1";
                document.getElementById("reportdescription").value = "Valid report";
                projectViewer.submitReporter();
                expect(mockPlanet.ServerInterface.reportProject).toHaveBeenCalledWith(
                    "proj-1",
                    "Valid report",
                    expect.any(Function)
                );
            });
        });

        describe("afterReport", () => {
            it("should handle success", () => {
                projectViewer.id = "proj-1";
                projectViewer.afterReport({ success: true });
                expect(mockPlanet.ProjectStorage.report).toHaveBeenCalledWith("proj-1", true);
                expect(
                    document.getElementById("projectviewer-reportsubmit-content").style.display
                ).toBe("block");
            });

            it("should handle failure", () => {
                projectViewer.afterReport({ success: false });
                expect(document.getElementById("submittext").textContent).toBe(
                    projectViewer.ReportError
                );
            });
        });
    });

    describe("init", () => {
        it("should attach all event listeners", () => {
            const elements = [
                "projectviewer-download-file",
                "projectviewer-open-mb",
                "projectviewer-merge-mb",
                "projectviewer-report-project",
                "projectviewer-report-submit",
                "projectviewer-report-close"
            ];
            const spies = elements.map(id =>
                jest.spyOn(document.getElementById(id), "addEventListener")
            );

            projectViewer.init();

            spies.forEach(spy => {
                expect(spy).toHaveBeenCalledWith("click", expect.any(Function));
            });
        });
    });
});
