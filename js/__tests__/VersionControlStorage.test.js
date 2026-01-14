/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Music Blocks Contributors
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

// Mock localforage
const mockLocalforage = {
    createInstance: jest.fn(() => ({
        getItem: jest.fn(),
        setItem: jest.fn()
    }))
};

global.localforage = mockLocalforage;

const { VersionControlStorage } = require("../VersionControlStorage");

describe("VersionControlStorage", () => {
    let storage;
    let mockPlanet;
    let mockLocalStorage;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Mock localforage instance
        mockLocalStorage = {
            getItem: jest.fn(),
            setItem: jest.fn()
        };
        mockLocalforage.createInstance.mockReturnValue(mockLocalStorage);

        // Mock Planet/ProjectStorage
        mockPlanet = {
            ProjectStorage: {
                getCurrentProjectID: jest.fn(() => "test-project-id"),
                getCurrentProjectData: jest.fn(async () => ({ blocks: [] })),
                getCurrentProjectImage: jest.fn(() => "data:image/png;base64,test"),
                getCurrentProjectName: jest.fn(() => "Test Project"),
                data: {
                    Projects: {
                        "test-project-id": {
                            ProjectData: {},
                            ProjectImage: "",
                            DateLastModified: 0
                        }
                    }
                },
                save: jest.fn()
            }
        };

        storage = new VersionControlStorage(mockPlanet);
    });

    describe("constructor", () => {
        it("should initialize with correct default values", () => {
            expect(storage.Planet).toBe(mockPlanet);
            expect(storage.LocalStorage).toBeNull();
            expect(storage.StorageKey).toBe("VersionControlData");
            expect(storage.MaxVersions).toBe(10);
            expect(storage.data).toBeNull();
        });
    });

    describe("init", () => {
        it("should create localforage instance and initialize storage", async () => {
            mockLocalStorage.getItem.mockResolvedValue(null);
            mockLocalStorage.setItem.mockResolvedValue();

            await storage.init();

            expect(mockLocalforage.createInstance).toHaveBeenCalledWith({
                name: "MusicBlocksVersionControl"
            });
            expect(storage.LocalStorage).toBe(mockLocalStorage);
        });

        it("should restore existing data from storage", async () => {
            const existingData = JSON.stringify({
                Projects: {
                    "existing-project": [{ id: "v1", timestamp: Date.now() }]
                }
            });
            mockLocalStorage.getItem.mockResolvedValue(existingData);
            mockLocalStorage.setItem.mockResolvedValue();

            await storage.init();

            expect(storage.data.Projects).toBeDefined();
            expect(storage.data.Projects["existing-project"]).toBeDefined();
        });
    });

    describe("generateVersionId", () => {
        it("should generate unique version IDs", () => {
            const id1 = storage.generateVersionId();
            const id2 = storage.generateVersionId();

            expect(id1).toMatch(/^v_\d+_\d{4}$/);
            expect(id2).toMatch(/^v_\d+_\d{4}$/);
            // IDs should be different (extremely high probability)
            expect(id1).not.toBe(id2);
        });
    });

    describe("getCurrentProjectId", () => {
        it("should return project ID from ProjectStorage", () => {
            const projectId = storage.getCurrentProjectId();
            expect(projectId).toBe("test-project-id");
        });

        it("should return null if Planet is not defined", () => {
            storage.Planet = null;
            const projectId = storage.getCurrentProjectId();
            expect(projectId).toBeNull();
        });
    });

    describe("saveVersion", () => {
        beforeEach(async () => {
            mockLocalStorage.getItem.mockResolvedValue(null);
            mockLocalStorage.setItem.mockResolvedValue();
            await storage.init();
        });

        it("should save a new version with correct data", async () => {
            const version = await storage.saveVersion("Test description");

            expect(version.id).toMatch(/^v_\d+_\d{4}$/);
            expect(version.description).toBe("Test description");
            expect(version.projectName).toBe("Test Project");
            expect(version.projectData).toEqual({ blocks: [] });
            expect(version.timestamp).toBeDefined();
        });

        it("should add version to project versions array", async () => {
            await storage.saveVersion("Version 1");
            await storage.saveVersion("Version 2");

            const versions = storage.data.Projects["test-project-id"];
            expect(versions.length).toBe(2);
        });

        it("should throw error if no project is open", async () => {
            mockPlanet.ProjectStorage.getCurrentProjectID.mockReturnValue(null);

            await expect(storage.saveVersion("Test")).rejects.toThrow(
                "No project is currently open"
            );
        });
    });

    describe("getVersions", () => {
        beforeEach(async () => {
            mockLocalStorage.getItem.mockResolvedValue(null);
            mockLocalStorage.setItem.mockResolvedValue();
            await storage.init();
        });

        it("should return empty array if no versions exist", async () => {
            const versions = await storage.getVersions();
            expect(versions).toEqual([]);
        });

        it("should return versions sorted by timestamp (newest first)", async () => {
            // Save versions with slight delay to ensure different timestamps
            await storage.saveVersion("First");
            await new Promise(resolve => setTimeout(resolve, 10));
            await storage.saveVersion("Second");

            const versions = await storage.getVersions();

            expect(versions.length).toBe(2);
            expect(versions[0].description).toBe("Second");
            expect(versions[1].description).toBe("First");
        });
    });

    describe("deleteVersion", () => {
        beforeEach(async () => {
            mockLocalStorage.getItem.mockResolvedValue(null);
            mockLocalStorage.setItem.mockResolvedValue();
            await storage.init();
        });

        it("should delete a specific version", async () => {
            const version = await storage.saveVersion("To be deleted");
            const versionId = version.id;

            const result = await storage.deleteVersion(versionId);

            expect(result).toBe(true);
            const versions = await storage.getVersions();
            expect(versions.length).toBe(0);
        });

        it("should return false if version not found", async () => {
            const result = await storage.deleteVersion("nonexistent-id");
            expect(result).toBe(false);
        });
    });

    describe("auto-cleanup", () => {
        beforeEach(async () => {
            mockLocalStorage.getItem.mockResolvedValue(null);
            mockLocalStorage.setItem.mockResolvedValue();
            await storage.init();
        });

        it("should remove oldest version when exceeding MaxVersions", async () => {
            // Save more than MaxVersions (10) versions
            for (let i = 0; i < 12; i++) {
                await storage.saveVersion(`Version ${i + 1}`);
            }

            const versions = storage.data.Projects["test-project-id"];
            expect(versions.length).toBe(10);

            // Oldest versions should be removed (Version 1 and Version 2)
            const descriptions = versions.map(v => v.description);
            expect(descriptions).not.toContain("Version 1");
            expect(descriptions).not.toContain("Version 2");
            expect(descriptions).toContain("Version 12");
        });
    });

    describe("getVersionCount", () => {
        beforeEach(async () => {
            mockLocalStorage.getItem.mockResolvedValue(null);
            mockLocalStorage.setItem.mockResolvedValue();
            await storage.init();
        });

        it("should return correct count of versions", async () => {
            expect(await storage.getVersionCount()).toBe(0);

            await storage.saveVersion("V1");
            expect(await storage.getVersionCount()).toBe(1);

            await storage.saveVersion("V2");
            expect(await storage.getVersionCount()).toBe(2);
        });
    });

    describe("deleteAllVersions", () => {
        beforeEach(async () => {
            mockLocalStorage.getItem.mockResolvedValue(null);
            mockLocalStorage.setItem.mockResolvedValue();
            await storage.init();
        });

        it("should delete all versions for current project", async () => {
            await storage.saveVersion("V1");
            await storage.saveVersion("V2");
            await storage.saveVersion("V3");

            await storage.deleteAllVersions();

            const versions = await storage.getVersions();
            expect(versions.length).toBe(0);
        });
    });
});
