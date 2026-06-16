/**
 * @jest-environment jsdom
 */

/**
 * @license
 * MusicBlocks v3.6.x
 *
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

const { Planet } = require("../Planet.js");

describe("Planet", () => {
    it("should be defined", () => {
        expect(Planet).toBeDefined();
    });

    it("should initialize with correct default values", () => {
        const mockStorage = {};
        const planet = new Planet(true, mockStorage);
        expect(planet.IsMusicBlocks).toBe(true);
        expect(planet.LocalStorage).toBe(mockStorage);
        expect(planet.UserIDCookie).toBe("UserID");
    });

    describe("prepareUserID", () => {
        let planet;
        let mockStorage;

        beforeEach(() => {
            mockStorage = {};
            planet = new Planet(true, mockStorage);
            global.getCookie = jest.fn();
            global.setCookie = jest.fn();
            planet.ProjectStorage = {
                generateID: jest.fn().mockReturnValue("generated-id")
            };
        });

        afterEach(() => {
            delete global.getCookie;
            delete global.setCookie;
        });

        it("should use existing cookie if present", () => {
            global.getCookie.mockReturnValue("existing-id");
            planet.prepareUserID();
            expect(planet.UserID).toBe("existing-id");
            expect(global.setCookie).not.toHaveBeenCalled();
        });

        it("should generate new ID if cookie is empty", () => {
            global.getCookie.mockReturnValue("");
            planet.prepareUserID();
            expect(planet.UserID).toBe("generated-id");
            expect(planet.ProjectStorage.generateID).toHaveBeenCalled();
            expect(global.setCookie).toHaveBeenCalledWith("UserID", "generated-id", 3650);
        });
    });

    describe("open", () => {
        let planet;

        beforeEach(() => {
            planet = new Planet(true, {});
            console.warn = jest.fn();
        });

        it("should warn if LocalPlanet is null", () => {
            planet.LocalPlanet = null;
            planet.open("test-image");
            expect(console.warn).toHaveBeenCalledWith("Local Planet unavailable");
        });

        it("should update LocalPlanet and set oldCurrentProjectID if LocalPlanet exists", () => {
            const mockLocalPlanet = {
                setCurrentProjectImage: jest.fn(),
                updateProjects: jest.fn()
            };
            const mockProjectStorage = {
                getCurrentProjectID: jest.fn().mockReturnValue("project-123")
            };
            planet.LocalPlanet = mockLocalPlanet;
            planet.ProjectStorage = mockProjectStorage;

            planet.open("test-image");

            expect(mockLocalPlanet.setCurrentProjectImage).toHaveBeenCalledWith("test-image");
            expect(mockLocalPlanet.updateProjects).toHaveBeenCalled();
            expect(planet.oldCurrentProjectID).toBe("project-123");
        });
    });

    describe("saveLocally", () => {
        it("should call ProjectStorage.saveLocally", () => {
            const planet = new Planet(true, {});
            const mockStorage = { saveLocally: jest.fn() };
            planet.ProjectStorage = mockStorage;
            planet.saveLocally("data", "image");
            expect(mockStorage.saveLocally).toHaveBeenCalledWith("data", "image");
        });
    });

    describe("setters", () => {
        let planet;
        beforeEach(() => {
            planet = new Planet(true, {});
        });

        it("should set analyzeProject", () => {
            const func = () => {};
            planet.setAnalyzeProject(func);
            expect(planet.analyzeProject).toBe(func);
        });

        it("should set loadProjectFromData", () => {
            const func = () => {};
            planet.setLoadProjectFromData(func);
            expect(planet.loadProjectFromData).toBe(func);
        });

        it("should set planetClose", () => {
            const func = () => {};
            planet.setPlanetClose(func);
            expect(planet.planetClose).toBe(func);
        });

        it("should set loadNewProject", () => {
            const func = () => {};
            planet.setLoadNewProject(func);
            expect(planet.loadNewProject).toBe(func);
        });

        it("should set loadProjectFromFile", () => {
            const func = () => {};
            planet.setLoadProjectFromFile(func);
            expect(planet.loadProjectFromFile).toBe(func);
        });

        it("should set OnConverterLoad", () => {
            const func = () => {};
            planet.setOnConverterLoad(func);
            expect(planet.onConverterLoad).toBe(func);
        });
    });

    describe("openProjectFromPlanet", () => {
        it("should call GlobalPlanet.openGlobalProject", () => {
            const planet = new Planet(true, {});
            const mockGlobalPlanet = { openGlobalProject: jest.fn() };
            planet.GlobalPlanet = mockGlobalPlanet;
            planet.openProjectFromPlanet("id", "error");
            expect(mockGlobalPlanet.openGlobalProject).toHaveBeenCalledWith("id", "error");
        });
    });

    describe("showNewProjectConfirmation", () => {
        let planet;

        beforeEach(() => {
            planet = new Planet(true, {});
            planet.loadNewProject = jest.fn();
            global._ = jest.fn(x => x);
            window._mbPlatformColor = {
                dialogueBox: "#ffffff",
                textColor: "#000000",
                headingColor: "#000000",
                blueButton: "#0000ff",
                blueButtonText: "#ffffff",
                cancelButton: "#cccccc"
            };
        });

        afterEach(() => {
            delete global._;
            delete window._mbPlatformColor;
            const existing = document.getElementById("new-project-confirmation");
            if (existing) existing.remove();
        });

        it("should create and append overlay to body", () => {
            planet.showNewProjectConfirmation();
            const overlay = document.getElementById("new-project-confirmation");
            expect(overlay).toBeTruthy();
            expect(document.body.contains(overlay)).toBe(true);
        });

        it("should remove existing confirmation if called again", () => {
            planet.showNewProjectConfirmation();
            const firstOverlay = document.getElementById("new-project-confirmation");

            planet.showNewProjectConfirmation();
            const secondOverlay = document.getElementById("new-project-confirmation");

            expect(document.getElementById("new-project-confirmation")).toBe(secondOverlay);
            expect(firstOverlay === secondOverlay).toBe(false);
        });

        it("should call loadNewProject and remove overlay on confirm click", () => {
            planet.showNewProjectConfirmation();
            const overlay = document.getElementById("new-project-confirmation");
            const buttons = overlay.querySelectorAll("button");

            let confirmBtn;
            buttons.forEach(btn => {
                if (btn.textContent === "Confirm") confirmBtn = btn;
            });

            expect(confirmBtn).toBeTruthy();
            confirmBtn.click();

            expect(planet.loadNewProject).toHaveBeenCalled();
            expect(document.getElementById("new-project-confirmation")).toBeNull();
        });

        it("should remove overlay on cancel click", () => {
            planet.showNewProjectConfirmation();
            const overlay = document.getElementById("new-project-confirmation");
            const buttons = overlay.querySelectorAll("button");

            let cancelBtn;
            buttons.forEach(btn => {
                if (btn.textContent === "Cancel") cancelBtn = btn;
            });

            expect(cancelBtn).toBeTruthy();
            cancelBtn.click();

            expect(planet.loadNewProject).not.toHaveBeenCalled();
            expect(document.getElementById("new-project-confirmation")).toBeNull();
        });

        it("should remove overlay on background click", () => {
            planet.showNewProjectConfirmation();
            const overlay = document.getElementById("new-project-confirmation");

            const event = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window
            });
            Object.defineProperty(event, "target", { value: overlay, enumerable: true });

            overlay.dispatchEvent(event);

            expect(document.getElementById("new-project-confirmation")).toBeNull();
        });

        it("should use fallback colors if window._mbPlatformColor is undefined", () => {
            delete window._mbPlatformColor;
            planet.showNewProjectConfirmation();
            const overlay = document.getElementById("new-project-confirmation");
            expect(overlay).toBeTruthy();
        });
    });

    describe("closeButton", () => {
        let planet;

        beforeEach(() => {
            planet = new Planet(true, {});
            planet.planetClose = jest.fn();
            planet.loadNewProject = jest.fn();
            planet.loadProjectFromData = jest.fn();
            planet.ProjectStorage = {
                getCurrentProjectID: jest.fn(),
                getCurrentProjectData: jest.fn()
            };
        });

        it("should call planetClose if project ID has not changed", async () => {
            planet.oldCurrentProjectID = "same-id";
            planet.ProjectStorage.getCurrentProjectID.mockReturnValue("same-id");

            await planet.closeButton();

            expect(planet.planetClose).toHaveBeenCalled();
            expect(planet.loadNewProject).not.toHaveBeenCalled();
            expect(planet.loadProjectFromData).not.toHaveBeenCalled();
        });

        it("should call loadNewProject if project ID changed and no data exists", async () => {
            planet.oldCurrentProjectID = "old-id";
            planet.ProjectStorage.getCurrentProjectID.mockReturnValue("new-id");
            planet.ProjectStorage.getCurrentProjectData.mockResolvedValue(null);

            await planet.closeButton();

            expect(planet.loadNewProject).toHaveBeenCalled();
            expect(planet.planetClose).not.toHaveBeenCalled();
        });

        it("should call loadProjectFromData if project ID changed and data exists", async () => {
            planet.oldCurrentProjectID = "old-id";
            planet.ProjectStorage.getCurrentProjectID.mockReturnValue("new-id");
            planet.ProjectStorage.getCurrentProjectData.mockResolvedValue("project-data");

            await planet.closeButton();

            expect(planet.loadProjectFromData).toHaveBeenCalledWith("project-data");
            expect(planet.planetClose).not.toHaveBeenCalled();
        });
    });

    describe("init", () => {
        let planet;
        let mockStringHelper;
        let mockProjectStorage;
        let mockServerInterface;

        beforeEach(() => {
            planet = new Planet(true, {});
            planet.prepareUserID = jest.fn();
            planet.closeButton = jest.fn();
            planet.loadProjectFromFile = jest.fn();
            planet.showNewProjectConfirmation = jest.fn();
            planet.initPlanets = jest.fn();

            mockStringHelper = { init: jest.fn() };
            mockProjectStorage = { init: jest.fn().mockResolvedValue() };
            mockServerInterface = { init: jest.fn(), getTagManifest: jest.fn() };

            global.StringHelper = jest.fn().mockReturnValue(mockStringHelper);
            global.ProjectStorage = jest.fn().mockReturnValue(mockProjectStorage);
            global.ServerInterface = jest.fn().mockReturnValue(mockServerInterface);

            document.body.innerHTML = `
                <button id="close-planet"></button>
                <button id="planet-open-file"></button>
                <button id="planet-new-project"></button>
            `;
        });

        afterEach(() => {
            delete global.StringHelper;
            delete global.ProjectStorage;
            delete global.ServerInterface;
            document.body.innerHTML = "";
        });

        it("should initialize dependencies and set up event listeners", async () => {
            await planet.init();

            expect(global.StringHelper).toHaveBeenCalledWith(planet);
            expect(mockStringHelper.init).toHaveBeenCalled();
            expect(global.ProjectStorage).toHaveBeenCalledWith(planet);
            expect(mockProjectStorage.init).toHaveBeenCalled();
            expect(planet.prepareUserID).toHaveBeenCalled();
            expect(global.ServerInterface).toHaveBeenCalledWith(planet);
            expect(mockServerInterface.init).toHaveBeenCalled();

            document.getElementById("close-planet").click();
            expect(planet.closeButton).toHaveBeenCalled();

            document.getElementById("planet-open-file").click();
            expect(planet.loadProjectFromFile).toHaveBeenCalled();

            document.getElementById("planet-new-project").click();
            expect(planet.showNewProjectConfirmation).toHaveBeenCalled();

            expect(mockServerInterface.getTagManifest).toHaveBeenCalled();
        });

        it("should call initPlanets when getTagManifest returns", async () => {
            mockServerInterface.getTagManifest.mockImplementation(cb => cb("manifest-data"));

            await planet.init();

            expect(planet.initPlanets).toHaveBeenCalledWith("manifest-data");
        });
    });

    describe("initPlanets", () => {
        let planet;
        let mockConverter;
        let mockSaveInterface;
        let mockLocalPlanet;
        let mockGlobalPlanet;

        beforeEach(() => {
            planet = new Planet(true, {});
            planet.onConverterLoad = jest.fn();

            mockConverter = { init: jest.fn() };
            mockSaveInterface = { init: jest.fn() };
            mockLocalPlanet = { init: jest.fn() };
            mockGlobalPlanet = { init: jest.fn() };

            global.Converter = jest.fn().mockReturnValue(mockConverter);
            global.SaveInterface = jest.fn().mockReturnValue(mockSaveInterface);
            global.LocalPlanet = jest.fn().mockReturnValue(mockLocalPlanet);
            global.GlobalPlanet = jest.fn().mockReturnValue(mockGlobalPlanet);
        });

        afterEach(() => {
            delete global.Converter;
            delete global.SaveInterface;
            delete global.LocalPlanet;
            delete global.GlobalPlanet;
        });

        it("should initialize planets with success status", () => {
            const tags = { success: true, data: "manifest-data" };

            planet.initPlanets(tags);

            expect(planet.ConnectedToServer).toBe(true);
            expect(planet.TagsManifest).toBe("manifest-data");

            expect(global.Converter).toHaveBeenCalledWith(planet);
            expect(mockConverter.init).toHaveBeenCalled();
            expect(planet.onConverterLoad).toHaveBeenCalled();

            expect(global.SaveInterface).toHaveBeenCalledWith(planet);
            expect(mockSaveInterface.init).toHaveBeenCalled();

            expect(global.LocalPlanet).toHaveBeenCalledWith(planet);
            expect(mockLocalPlanet.init).toHaveBeenCalled();

            expect(global.GlobalPlanet).toHaveBeenCalledWith(planet);
            expect(mockGlobalPlanet.init).toHaveBeenCalled();
        });

        it("should initialize planets with failure status", () => {
            const tags = { success: false };

            planet.initPlanets(tags);

            expect(planet.ConnectedToServer).toBe(false);
            expect(planet.TagsManifest).toBeNull();

            expect(global.Converter).toHaveBeenCalled();
            expect(global.SaveInterface).toHaveBeenCalled();
            expect(global.LocalPlanet).toHaveBeenCalled();
            expect(global.GlobalPlanet).toHaveBeenCalled();
        });
    });

    describe("DOMContentLoaded listener", () => {
        it("should apply theme based on themePreference", () => {
            const mockGetItem = jest.fn().mockReturnValue("dark");
            Object.defineProperty(window, "localStorage", {
                value: { getItem: mockGetItem },
                writable: true
            });

            document.body.className = "light";

            document.dispatchEvent(new Event("DOMContentLoaded"));

            expect(document.body.classList.contains("dark")).toBe(true);
            expect(document.body.classList.contains("light")).toBe(false);
            expect(document.body.classList.contains("highcontrast")).toBe(false);
        });
    });
});
