// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

global._ = jest.fn(str => str);
global.localStorage = {
    getItem: jest.fn(() => null),
    setItem: jest.fn()
};
global.localforage = null; // Will be mocked per-test

const ProjectStorage = require("../ProjectStorage");

/**
 * Creates a mock localforage instance backed by a plain object.
 * This simulates IndexedDB-backed storage without real IndexedDB.
 */
function createMockLocalforage() {
    const store = {};
    return {
        _store: store,
        setItem: jest.fn(async (key, value) => {
            store[key] = value;
        }),
        getItem: jest.fn(async key => {
            return key in store ? store[key] : null;
        }),
        removeItem: jest.fn(async key => {
            delete store[key];
        })
    };
}

function createMockPlanet() {
    return {
        LocalPlanet: {
            updateProjects: jest.fn()
        }
    };
}

describe("ProjectStorage", () => {
    let storage;
    let mockLocalforage;
    let mockPlanet;

    beforeEach(() => {
        jest.useFakeTimers();
        mockPlanet = createMockPlanet();
        mockLocalforage = createMockLocalforage();
        storage = new ProjectStorage(mockPlanet);
        // Directly assign LocalStorage to skip port() which reads real localStorage
        storage.LocalStorage = mockLocalforage;
    });

    afterEach(() => {
        storage.stopAutoSave();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe("constructor", () => {
        it("should initialize with correct default properties", () => {
            expect(storage.LocalStorageKey).toBe("ProjectData");
            expect(storage.BackupStorageKey).toBe("ProjectData_backup");
            expect(storage.data).toBeNull();
            expect(storage._saveInProgress).toBe(false);
            expect(storage._autoSaveInterval).toBeNull();
        });
    });

    describe("set() and get()", () => {
        it("should store and retrieve data", async () => {
            const testData = { Projects: { 1: { ProjectName: "Test" } } };
            await storage.set("testKey", testData);
            const result = await storage.get("testKey");
            expect(result).toEqual(testData);
        });

        it("should return null for non-existent key", async () => {
            const result = await storage.get("nonexistent");
            expect(result).toBeNull();
        });

        it("should return null for empty string value", async () => {
            mockLocalforage._store["emptyKey"] = "";
            const result = await storage.get("emptyKey");
            expect(result).toBeNull();
        });

        it("should return null and log error for invalid JSON", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            mockLocalforage._store["badKey"] = "not-valid-json{{{";
            const result = await storage.get("badKey");
            expect(result).toBeNull();
            expect(consoleSpy).toHaveBeenCalled();
        });

        it("should throw if setItem fails to persist", async () => {
            mockLocalforage.setItem.mockImplementation(async () => {});
            mockLocalforage.getItem.mockImplementation(async () => null);

            await expect(storage.set("key", { foo: "bar" })).rejects.toThrow(
                "Failed to save project data"
            );
        });
    });

    describe("save()", () => {
        it("should save data under the primary key", async () => {
            storage.data = { Projects: {}, LikedProjects: {} };
            await storage.save();

            const saved = await storage.get(storage.LocalStorageKey);
            expect(saved).toEqual(storage.data);
        });

        it("should create a backup before overwriting primary", async () => {
            // First save: sets primary, no backup yet (no existing data)
            storage.data = { Projects: { 1: { ProjectName: "Original" } } };
            await storage.save();

            // Second save: should backup the first version before overwriting
            storage.data = { Projects: { 1: { ProjectName: "Updated" } } };
            await storage.save();

            const backup = await storage.get(storage.BackupStorageKey);
            expect(backup).toEqual({ Projects: { 1: { ProjectName: "Original" } } });

            const primary = await storage.get(storage.LocalStorageKey);
            expect(primary).toEqual({ Projects: { 1: { ProjectName: "Updated" } } });
        });

        it("should reject and log when the write fails", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();
            storage.data = { Projects: {} };
            mockLocalforage.setItem.mockRejectedValueOnce(new Error("Disk full"));

            await expect(storage.save()).rejects.toThrow("Disk full");
            expect(consoleSpy).toHaveBeenCalledWith(
                "[ProjectStorage] Save failed:",
                expect.any(Error)
            );
        });

        it("should not advance TimeLastSaved when the write fails", async () => {
            jest.spyOn(console, "error").mockImplementation();
            storage.data = { Projects: {} };
            mockLocalforage.setItem.mockRejectedValueOnce(new Error("Disk full"));

            await storage.save().catch(() => {});
            expect(storage.TimeLastSaved).toBe(-1);
        });

        it("should keep accepting saves after a failed save", async () => {
            jest.spyOn(console, "error").mockImplementation();
            storage.data = { Projects: { 1: { ProjectName: "First" } } };
            mockLocalforage.setItem.mockRejectedValueOnce(new Error("Disk full"));

            await storage.save().catch(() => {});

            storage.data = { Projects: { 1: { ProjectName: "Second" } } };
            await storage.save();

            const saved = await storage.get(storage.LocalStorageKey);
            expect(saved).toEqual({ Projects: { 1: { ProjectName: "Second" } } });
        });

        it("should queue concurrent saves instead of dropping them", async () => {
            storage.data = { Projects: { 1: { ProjectName: "First" } } };

            let releaseFirstSave;
            let blockFirstRead = true;
            const originalGet = storage.get.bind(storage);

            jest.spyOn(storage, "get").mockImplementation(async key => {
                if (key === storage.LocalStorageKey && blockFirstRead) {
                    blockFirstRead = false;
                    await new Promise(resolve => {
                        releaseFirstSave = resolve;
                    });
                }

                return originalGet(key);
            });

            const firstSave = storage.save();
            await Promise.resolve();

            storage.data = { Projects: { 1: { ProjectName: "Second" } } };
            const secondSave = storage.save();

            let secondSaveResolved = false;
            secondSave.then(() => {
                secondSaveResolved = true;
            });

            await Promise.resolve();
            expect(secondSaveResolved).toBe(false);

            await Promise.resolve();
            releaseFirstSave();
            await Promise.all([firstSave, secondSave]);

            const saved = await storage.get(storage.LocalStorageKey);
            expect(saved).toEqual({ Projects: { 1: { ProjectName: "Second" } } });
        });

        it("should update TimeLastSaved on successful save", async () => {
            storage.data = { Projects: {} };
            expect(storage.TimeLastSaved).toBe(-1);
            await storage.save();
            expect(storage.TimeLastSaved).toBeGreaterThan(0);
        });
    });

    describe("restore()", () => {
        it("should restore data from primary storage", async () => {
            const projectData = {
                Projects: { 123: { ProjectName: "My Song" } },
                LikedProjects: {},
                ReportedProjects: {}
            };
            await storage.set(storage.LocalStorageKey, projectData);

            await storage.restore();
            expect(storage.data).toEqual(projectData);
        });

        it("should set data to null when primary is empty", async () => {
            await storage.restore();
            expect(storage.data).toBeNull();
        });

        it("should restore from backup when primary is corrupted", async () => {
            const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
            jest.spyOn(console, "error").mockImplementation();

            const backupData = {
                Projects: { 456: { ProjectName: "Backed Up Song" } }
            };

            // Put valid backup data
            await storage.set(storage.BackupStorageKey, backupData);
            // Put corrupted primary data (raw invalid JSON string)
            mockLocalforage._store[storage.LocalStorageKey] = "corrupted{{{data";

            await storage.restore();

            expect(storage.data).toEqual(backupData);
            expect(consoleSpy).toHaveBeenCalledWith(
                "[ProjectStorage] Restored from backup successfully."
            );
        });

        it("should set data to null when both primary and backup are corrupted", async () => {
            jest.spyOn(console, "error").mockImplementation();

            // Both corrupted
            mockLocalforage._store[storage.LocalStorageKey] = "bad{{{";
            mockLocalforage._store[storage.BackupStorageKey] = "also-bad{{{";

            await storage.restore();
            expect(storage.data).toBeNull();
        });

        it("should set data to null when primary is missing and backup is missing", async () => {
            await storage.restore();
            expect(storage.data).toBeNull();
        });

        it("should re-persist recovered backup data as primary", async () => {
            jest.spyOn(console, "warn").mockImplementation();
            jest.spyOn(console, "error").mockImplementation();

            const backupData = { Projects: { 789: { ProjectName: "Recovered" } } };
            await storage.set(storage.BackupStorageKey, backupData);
            mockLocalforage._store[storage.LocalStorageKey] = "corrupt!!!";

            await storage.restore();

            // Primary should now be restored from backup
            const primaryAfterRestore = await storage.get(storage.LocalStorageKey);
            expect(primaryAfterRestore).toEqual(backupData);
        });
    });

    describe("port()", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("should port legacy localStorage data when not already ported", async () => {
            jest.spyOn(Storage.prototype, "getItem").mockReturnValueOnce(
                JSON.stringify({ Projects: { legacy: { ProjectName: "Old Project" } } })
            );

            await storage.port();

            const ported = await storage.get(storage.LocalStorageKey);
            expect(ported).toEqual(
                JSON.stringify({ Projects: { legacy: { ProjectName: "Old Project" } } })
            );

            const version = await storage.get(storage.VersionKey);
            expect(version).toBe(storage.Version);
        });

        it("should not re-port if already at current version", async () => {
            await storage.set(storage.VersionKey, storage.Version);
            const setSpy = jest.spyOn(storage, "set");

            await storage.port();

            expect(setSpy).not.toHaveBeenCalledWith(storage.LocalStorageKey, expect.anything());
        });

        it("should not throw when localStorage.getItem throws (restricted environment)", async () => {
            const consoleSpy = jest.spyOn(console, "debug").mockImplementation();
            jest.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
                throw new Error("SecurityError: localStorage is disabled");
            });

            await expect(storage.port()).resolves.not.toThrow();

            expect(consoleSpy).toHaveBeenCalledWith(
                "localStorage unavailable during port(); skipping legacy read.",
                expect.any(Error)
            );
        });

        it("should still set version key after a guarded localStorage failure", async () => {
            jest.spyOn(Storage.prototype, "getItem").mockImplementationOnce(() => {
                throw new Error("SecurityError: localStorage is disabled");
            });

            await storage.port();

            const version = await storage.get(storage.VersionKey);
            expect(version).toBe(storage.Version);
        });

        it("should not crash init() when localStorage is unavailable throughout startup", async () => {
            global.localforage = mockLocalforage; // init() reassigns this.LocalStorage from the global
            Storage.prototype.getItem = jest.fn(() => {
                throw new Error("SecurityError: localStorage is disabled");
            });
            jest.spyOn(console, "debug").mockImplementation();

            try {
                await expect(storage.init()).resolves.not.toThrow();
                expect(storage.data).not.toBeNull();
            } finally {
                global.localforage = null;
            }
        });
    });

    describe("initialiseStorage()", () => {
        it("should initialize empty data structure on first run", async () => {
            storage.data = null;
            await storage.initialiseStorage();

            expect(storage.data.Projects).toEqual({});
            expect(storage.data.LikedProjects).toEqual({});
            expect(storage.data.ReportedProjects).toEqual({});
            expect(storage.data.DefaultCreatorName).toBe("anonymous");
        });

        it("should preserve existing projects when data already exists", async () => {
            storage.data = {
                Projects: { 100: { ProjectName: "Keep This" } },
                LikedProjects: { 200: true },
                ReportedProjects: {},
                DefaultCreatorName: "TestUser"
            };
            await storage.initialiseStorage();

            expect(storage.data.Projects["100"].ProjectName).toBe("Keep This");
            expect(storage.data.LikedProjects["200"]).toBe(true);
            expect(storage.data.DefaultCreatorName).toBe("TestUser");
        });

        it("should NOT call save() when data was null (prevents overwriting backup)", async () => {
            storage.data = null;
            const saveSpy = jest.spyOn(storage, "save");
            await storage.initialiseStorage();

            expect(saveSpy).not.toHaveBeenCalled();
        });

        it("should call save() when data was already present", async () => {
            storage.data = { Projects: {} };
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            await storage.initialiseStorage();

            expect(saveSpy).toHaveBeenCalled();
        });

        it("should fire dataLoaded promise", async () => {
            storage.data = null;
            let loaded = false;
            storage.dataLoaded.then(() => {
                loaded = true;
            });

            await storage.initialiseStorage();
            // Allow microtasks to flush
            await Promise.resolve();

            expect(loaded).toBe(true);
        });
    });

    describe("auto-save", () => {
        it("should not start auto-save in init (auto-save lives in activity.js)", async () => {
            // Mock port() to avoid real localStorage access
            storage.port = jest.fn();
            storage.restore = jest.fn();
            storage.initialiseStorage = jest.fn();

            await storage.init();
            expect(storage._autoSaveInterval).toBeNull();
        });

        it("should auto-save periodically", async () => {
            storage.data = { Projects: {} };
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();

            storage.startAutoSave(1000);

            jest.advanceTimersByTime(3000);
            // Allow async callbacks to execute
            await Promise.resolve();

            expect(saveSpy).toHaveBeenCalled();
        });

        it("should stop auto-save when stopAutoSave is called", () => {
            storage.startAutoSave(1000);
            expect(storage._autoSaveInterval).not.toBeNull();

            storage.stopAutoSave();
            expect(storage._autoSaveInterval).toBeNull();
        });

        it("should not auto-save when data is null", async () => {
            storage.data = null;
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();

            storage.startAutoSave(1000);
            jest.advanceTimersByTime(2000);
            await Promise.resolve();

            expect(saveSpy).not.toHaveBeenCalled();
        });

        it("should not crash if auto-save throws", async () => {
            jest.spyOn(console, "error").mockImplementation();
            storage.data = { Projects: {} };

            // Override save to track calls and simulate failure
            let saveCalled = false;
            storage.save = jest.fn(async () => {
                saveCalled = true;
                throw new Error("auto-save error");
            });

            storage.startAutoSave(1000);
            jest.advanceTimersByTime(1500);

            // Flush microtask queue
            await Promise.resolve();
            await Promise.resolve();

            expect(saveCalled).toBe(true);
            // The key assertion: no unhandled rejection, test completes normally
        });
    });

    describe("saveLocally()", () => {
        beforeEach(async () => {
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Test Project",
                        ProjectData: "old-data",
                        ProjectImage: "old-image",
                        PublishedData: null,
                        DateLastModified: 0
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };
        });

        it("should update project data and image", async () => {
            await storage.saveLocally("new-data", "new-image");
            expect(storage.data.Projects["proj1"].ProjectData).toBe("new-data");
            expect(storage.data.Projects["proj1"].ProjectImage).toBe("new-image");
        });

        it("should update DateLastModified", async () => {
            const before = Date.now();
            await storage.saveLocally("data", "img");
            expect(storage.data.Projects["proj1"].DateLastModified).toBeGreaterThanOrEqual(before);
        });

        it("should save to the requested project after the current project changes", async () => {
            storage.data.Projects.proj2 = {
                ProjectName: "New Project",
                ProjectData: "new-project-data",
                ProjectImage: "new-project-image",
                PublishedData: null,
                DateLastModified: 0
            };
            storage.data.CurrentProject = "proj2";

            await storage.saveLocally("updated-old-data", "updated-old-image", "proj1");

            expect(storage.data.Projects.proj1.ProjectData).toBe("updated-old-data");
            expect(storage.data.Projects.proj1.ProjectImage).toBe("updated-old-image");
            expect(storage.data.Projects.proj2.ProjectData).toBe("new-project-data");
            expect(storage.data.Projects.proj2.ProjectImage).toBe("new-project-image");
        });

        it("should create a new project if CurrentProject is undefined", async () => {
            storage.data.CurrentProject = undefined;
            const initSpy = jest.spyOn(storage, "initialiseNewProject").mockResolvedValue();
            await storage.saveLocally("data", "img");
            expect(initSpy).toHaveBeenCalled();
        });

        it("should preserve ProjectData when data is undefined", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Song 1",
                        ProjectData: "original-data",
                        ProjectImage: "old-thumb",
                        DateLastModified: 1000
                    }
                }
            };

            await storage.saveLocally(undefined, "new-thumb", "proj1");

            expect(storage.data.Projects["proj1"].ProjectData).toBe("original-data");
            expect(storage.data.Projects["proj1"].ProjectImage).toBe("new-thumb");
        });
    });

    describe("saveThumbnail", () => {
        it("should update ProjectImage without modifying ProjectData", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Song 1",
                        ProjectData: "original-data",
                        ProjectImage: "old-thumb",
                        DateLastModified: 1000
                    }
                }
            };

            await storage.saveThumbnail("new-thumb", "proj1");

            expect(storage.data.Projects["proj1"].ProjectData).toBe("original-data");
            expect(storage.data.Projects["proj1"].ProjectImage).toBe("new-thumb");
        });

        it("should update explicit projectId without modifying CurrentProject", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj2",
                Projects: {
                    proj1: {
                        ProjectName: "Song 1",
                        ProjectData: "data-1",
                        ProjectImage: "img-1",
                        DateLastModified: 1000
                    },
                    proj2: {
                        ProjectName: "Song 2",
                        ProjectData: "data-2",
                        ProjectImage: "img-2",
                        DateLastModified: 2000
                    }
                }
            };

            await storage.saveThumbnail("updated-thumb-1", "proj1");

            expect(storage.data.CurrentProject).toBe("proj2");
            expect(storage.data.Projects["proj1"].ProjectImage).toBe("updated-thumb-1");
            expect(storage.data.Projects["proj1"].ProjectData).toBe("data-1");
            expect(storage.data.Projects["proj2"].ProjectImage).toBe("img-2");
            expect(storage.data.Projects["proj2"].ProjectData).toBe("data-2");
        });

        it("should ignore non-existent or deleted project without creating phantom project", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            const initSpy = jest.spyOn(storage, "initialiseNewProject");
            storage.data = {
                CurrentProject: "proj2",
                Projects: {
                    proj2: {
                        ProjectName: "Song 2",
                        ProjectData: "data-2",
                        ProjectImage: "img-2",
                        DateLastModified: 2000
                    }
                }
            };

            await storage.saveThumbnail("orphan-thumb", "deleted-proj-1");

            expect(initSpy).not.toHaveBeenCalled();
            expect(storage.data.Projects["deleted-proj-1"]).toBeUndefined();
            expect(Object.keys(storage.data.Projects)).toEqual(["proj2"]);
            expect(storage.data.Projects["proj2"].ProjectImage).toBe("img-2");
        });

        it("should ignore thumbnail save with undefined project ID without modifying CurrentProject image or timestamp", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Active Song",
                        ProjectData: "data-1",
                        ProjectImage: "img-1-original",
                        DateLastModified: 1000
                    }
                }
            };

            await storage.saveThumbnail("stray-thumb", undefined);

            expect(saveSpy).not.toHaveBeenCalled();
            expect(storage.data.Projects["proj1"].ProjectImage).toBe("img-1-original");
            expect(storage.data.Projects["proj1"].DateLastModified).toBe(1000);
            expect(storage.data.CurrentProject).toBe("proj1");
        });

        it("older saveThumbnail resolving after newer saveLocally does not overwrite newer ProjectData", async () => {
            const persistedStorage = {};
            storage.LocalStorage = {
                setItem: jest.fn(async (key, val) => {
                    persistedStorage[key] = val;
                }),
                getItem: jest.fn(async key => persistedStorage[key] || null)
            };

            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Song 1",
                        ProjectData: "snapshot-A",
                        ProjectImage: "img-fallback",
                        DateLastModified: 1000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.save();

            // 1. Save newer snapshot B
            await storage.saveLocally("snapshot-B", "img-fallback-B", "proj1");
            expect(storage.data.Projects["proj1"].ProjectData).toBe("snapshot-B");

            // 2. Resolve older deferred thumbnail callback for proj1
            await storage.saveThumbnail("thumbnail-A", "proj1");

            // 3. Inspect both in-memory and persisted data
            expect(storage.data.Projects["proj1"].ProjectData).toBe("snapshot-B");
            expect(storage.data.Projects["proj1"].ProjectImage).toBe("thumbnail-A");

            const persisted = JSON.parse(persistedStorage[storage.LocalStorageKey]);
            expect(persisted.Projects["proj1"].ProjectData).toBe("snapshot-B");
            expect(persisted.Projects["proj1"].ProjectImage).toBe("thumbnail-A");
        });

        it("delayed saveThumbnail for proj1 while user is on proj2 does not corrupt either project", async () => {
            const persistedStorage = {};
            storage.LocalStorage = {
                setItem: jest.fn(async (key, val) => {
                    persistedStorage[key] = val;
                }),
                getItem: jest.fn(async key => persistedStorage[key] || null)
            };

            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Song 1",
                        ProjectData: "data-proj1",
                        ProjectImage: "img-proj1-old",
                        DateLastModified: 1000
                    },
                    proj2: {
                        ProjectName: "Song 2",
                        ProjectData: "data-proj2",
                        ProjectImage: "img-proj2",
                        DateLastModified: 2000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.save();

            // User switches to proj2
            storage.data.CurrentProject = "proj2";

            // Delayed thumbnail callback arrives for proj1
            await storage.saveThumbnail("thumbnail-proj1-new", "proj1");

            // Verify proj1 updated its thumbnail, retained its data
            expect(storage.data.Projects["proj1"].ProjectData).toBe("data-proj1");
            expect(storage.data.Projects["proj1"].ProjectImage).toBe("thumbnail-proj1-new");

            // Verify proj2 is completely untouched
            expect(storage.data.CurrentProject).toBe("proj2");
            expect(storage.data.Projects["proj2"].ProjectData).toBe("data-proj2");
            expect(storage.data.Projects["proj2"].ProjectImage).toBe("img-proj2");

            const persisted = JSON.parse(persistedStorage[storage.LocalStorageKey]);
            expect(persisted.Projects["proj1"].ProjectData).toBe("data-proj1");
            expect(persisted.Projects["proj1"].ProjectImage).toBe("thumbnail-proj1-new");
            expect(persisted.Projects["proj2"].ProjectData).toBe("data-proj2");
            expect(persisted.Projects["proj2"].ProjectImage).toBe("img-proj2");
        });

        it("Check A: resolving older saveThumbnail must not alter DateLastModified or corrupt replacement project selection", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj3",
                Projects: {
                    proj1: {
                        ProjectName: "Older Song",
                        ProjectData: "data-1",
                        ProjectImage: "img-1-fallback",
                        DateLastModified: 1000
                    },
                    proj2: {
                        ProjectName: "Middle Song",
                        ProjectData: "data-2",
                        ProjectImage: "img-2",
                        DateLastModified: 2000
                    },
                    proj3: {
                        ProjectName: "Active Song",
                        ProjectData: "data-3",
                        ProjectImage: "img-3",
                        DateLastModified: 3000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            // 1. proj1 (1000), proj2 (2000), proj3 (3000, active)
            // 2. Start a thumbnail operation for older proj1 (deferred)
            // 3. Complete a newer project save (done for proj3 at 3000)
            // 4. Resolve the older thumbnail operation for proj1 at a later timestamp
            const nowSpy = jest.spyOn(Date, "now").mockReturnValue(5000);
            await storage.saveThumbnail("img-1-rendered", "proj1");
            nowSpy.mockRestore();

            // DateLastModified for proj1 MUST remain 1000 (thumbnail rendering is not content modification)
            expect(storage.data.Projects["proj1"].DateLastModified).toBe(1000);
            expect(storage.data.Projects["proj1"].ProjectImage).toBe("img-1-rendered");

            // 5. Delete active project (proj3) and inspect which replacement is selected
            await storage.deleteProject("proj3");

            // proj2 was modified at 2000, whereas proj1 was modified at 1000.
            // Next project selected MUST be proj2, NOT proj1!
            expect(storage.getCurrentProjectID()).toBe("proj2");
            expect(storage.data.Projects["proj3"]).toBeUndefined();
        });
    });

    describe("project CRUD operations", () => {
        beforeEach(() => {
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Song A",
                        ProjectData: "block-data",
                        ProjectImage: null,
                        PublishedData: null,
                        DateLastModified: 1000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };
        });

        it("getCurrentProjectName should return project name", () => {
            expect(storage.getCurrentProjectName()).toBe("Song A");
        });

        it("getCurrentProjectName should return default for missing project", () => {
            storage.data.CurrentProject = "nonexistent";
            expect(storage.getCurrentProjectName()).toBe("My Project");
        });

        it("getCurrentProjectID should return current project ID", () => {
            expect(storage.getCurrentProjectID()).toBe("proj1");
        });

        it("removeSyncedDrafts should drop only synced drafts matched by a commit", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            storage.data.Projects.proj1.commitDrafts = [
                { id: "d1", message: "A", timestamp: 1000, status: "synced" },
                { id: "d2", message: "B", timestamp: 2000, status: "pending" },
                { id: "d3", message: "B", timestamp: 3000, status: "synced" },
                { id: "d4", message: "C", timestamp: 4000, status: "synced" }
            ];
            await storage.removeSyncedDrafts("proj1", [
                { message: "C", date: new Date(4500).toISOString() },
                { message: "B", date: new Date(3500).toISOString() }
            ]);
            expect(storage.data.Projects.proj1.commitDrafts.map(d => d.id)).toEqual(["d1", "d2"]);
            expect(saveSpy).toHaveBeenCalled();
        });

        it("removeSyncedDrafts should match each commit to one draft, newest first", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data.Projects.proj1.commitDrafts = [
                { id: "d1", message: "Save", timestamp: 1000, status: "synced" },
                { id: "d2", message: "Save", timestamp: 2000, status: "synced" }
            ];
            await storage.removeSyncedDrafts("proj1", [
                { message: "Save", date: new Date(2500).toISOString() }
            ]);
            expect(storage.data.Projects.proj1.commitDrafts.map(d => d.id)).toEqual(["d1"]);
        });

        it("removeSyncedDrafts should keep repeated-message drafts the cache does not cover", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            // Five drafts synced in one batch, all with the default message; the cache holds
            // only the newest three commits.
            storage.data.Projects.proj1.commitDrafts = [1, 2, 3, 4, 5].map(n => ({
                id: `d${n}`,
                message: "Offline save",
                timestamp: n * 1000,
                status: "synced"
            }));
            await storage.removeSyncedDrafts(
                "proj1",
                [9000, 8000, 7000].map(t => ({
                    message: "Offline save",
                    date: new Date(t).toISOString()
                }))
            );
            expect(storage.data.Projects.proj1.commitDrafts.map(d => d.id)).toEqual(["d1", "d2"]);
        });

        it("removeSyncedDrafts should not match a draft made after the commit", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            // An older online save with the same message is not this draft's commit.
            storage.data.Projects.proj1.commitDrafts = [
                { id: "d1", message: "Save", timestamp: 5000, status: "synced" }
            ];
            await storage.removeSyncedDrafts("proj1", [
                { message: "Save", date: new Date(4000).toISOString() }
            ]);
            expect(storage.data.Projects.proj1.commitDrafts.map(d => d.id)).toEqual(["d1"]);
        });

        it("removeSyncedDrafts should keep commit order when matching drafts", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            // Commits are newest first, so each match must be older than the previous one.
            storage.data.Projects.proj1.commitDrafts = [
                { id: "d1", message: "A", timestamp: 1000, status: "synced" },
                { id: "d2", message: "B", timestamp: 2000, status: "synced" },
                { id: "d3", message: "A", timestamp: 3000, status: "synced" }
            ];
            await storage.removeSyncedDrafts("proj1", [
                { message: "B", date: new Date(9000).toISOString() },
                { message: "A", date: new Date(8000).toISOString() }
            ]);
            // "B" matches d2; "A" must be older than d2, so it takes d1 and d3 stays.
            expect(storage.data.Projects.proj1.commitDrafts.map(d => d.id)).toEqual(["d3"]);
        });

        it("removeSyncedDrafts should not save when no draft matches", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            storage.data.Projects.proj1.commitDrafts = [
                { id: "d1", message: "A", timestamp: 1000, status: "pending" },
                { id: "d2", message: "B", timestamp: 1000, status: "synced" }
            ];
            await storage.removeSyncedDrafts("proj1", [
                { message: "A", date: new Date(2000).toISOString() }
            ]);
            await storage.removeSyncedDrafts("proj1", [{ message: "B", date: "not a date" }]);
            await storage.removeSyncedDrafts("proj1", []);
            await storage.removeSyncedDrafts("nonexistent", [{ message: "A" }]);
            expect(storage.data.Projects.proj1.commitDrafts.length).toBe(2);
            expect(saveSpy).not.toHaveBeenCalled();
        });

        it("deleteProject should remove project and call save", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            await storage.deleteProject("proj1");
            expect(storage.data.Projects["proj1"]).toBeUndefined();
            expect(saveSpy).toHaveBeenCalled();
        });

        it("deleteProject should switch CurrentProject to the most recently modified remaining project", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Song A",
                        ProjectData: "data-A",
                        ProjectImage: "img-A",
                        DateLastModified: 1000
                    },
                    proj2: {
                        ProjectName: "Song B",
                        ProjectData: "data-B",
                        ProjectImage: "img-B",
                        DateLastModified: 3000
                    },
                    proj3: {
                        ProjectName: "Song C",
                        ProjectData: "data-C",
                        ProjectImage: "img-C",
                        DateLastModified: 2000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.deleteProject("proj1");

            expect(storage.data.Projects["proj1"]).toBeUndefined();
            expect(storage.getCurrentProjectID()).toBe("proj2");
            expect(storage.data.Projects["proj2"].ProjectData).toBe("data-B");
            expect(saveSpy).toHaveBeenCalled();
        });

        it("deleteProject should tie-break deterministically when DateLastModified is equal or missing", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: { ProjectName: "Song A", DateLastModified: 1000 },
                    projA: { ProjectName: "Song Alpha", DateLastModified: 2000 },
                    projZ: { ProjectName: "Song Zeta", DateLastModified: 2000 }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.deleteProject("proj1");

            expect(storage.getCurrentProjectID()).toBe("projZ");
        });

        it("getLatestProjectID should ignore null or undefined project entries", () => {
            storage.data = {
                Projects: {
                    projA: null,
                    projB: undefined,
                    projValid: { ProjectName: "Valid", DateLastModified: 1000 }
                }
            };

            expect(storage.getLatestProjectID()).toBe("projValid");
        });

        it("deleteProject should clear CurrentProject when the last project is deleted", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: { ProjectName: "Only Song", DateLastModified: 1000 }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.deleteProject("proj1");

            expect(storage.data.Projects["proj1"]).toBeUndefined();
            expect(storage.getCurrentProjectID()).toBeUndefined();
        });

        it("deleteProject should not change CurrentProject when deleting an inactive project", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: { ProjectName: "Song A", DateLastModified: 1000 },
                    proj2: { ProjectName: "Song B", DateLastModified: 2000 }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.deleteProject("proj2");

            expect(storage.data.Projects["proj2"]).toBeUndefined();
            expect(storage.getCurrentProjectID()).toBe("proj1");
            expect(storage.data.Projects["proj1"]).toBeDefined();
        });

        it("deleteProject should handle unknown or repeated deletion without corrupting state", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: { ProjectName: "Song A", DateLastModified: 1000 }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.deleteProject("nonexistent");
            expect(storage.getCurrentProjectID()).toBe("proj1");

            await storage.deleteProject("proj1");
            expect(storage.getCurrentProjectID()).toBeUndefined();

            await storage.deleteProject("proj1");
            expect(storage.getCurrentProjectID()).toBeUndefined();
        });

        it("saveLocally should NOT resurrect a deleted project when active project was deleted and others remain", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Deleted Song",
                        ProjectData: "data-old",
                        DateLastModified: 1000
                    },
                    proj2: {
                        ProjectName: "Remaining Song",
                        ProjectData: "data-keep",
                        DateLastModified: 2000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.deleteProject("proj1");
            expect(storage.getCurrentProjectID()).toBe("proj2");

            await storage.saveLocally("stale-data", "stale-img", "proj1");
            expect(storage.data.Projects["proj1"]).toBeUndefined();
            expect(storage.data.Projects["proj2"].ProjectData).toBe("data-keep");
        });

        it("saveLocally should NOT create a phantom project when last project was deleted and delayed save targets deleted ID", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Only Song",
                        ProjectData: "data-1",
                        DateLastModified: 1000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.deleteProject("proj1");
            expect(storage.getCurrentProjectID()).toBeUndefined();
            expect(Object.keys(storage.data.Projects).length).toBe(0);

            // Delayed save arriving with explicit deleted ID must be ignored
            await storage.saveLocally("stale-data", "stale-img", "proj1");
            expect(storage.data.Projects["proj1"]).toBeUndefined();
            expect(Object.keys(storage.data.Projects).length).toBe(0);
            expect(storage.getCurrentProjectID()).toBeUndefined();

            // Normal save without explicit ID initializes a valid new project
            await storage.saveLocally("new-data", "new-img");
            const newId = storage.getCurrentProjectID();
            expect(newId).toBeDefined();
            expect(newId).not.toBe("proj1");
            expect(Object.keys(storage.data.Projects).length).toBe(1);
            expect(storage.data.Projects[newId].ProjectData).toBe("new-data");
        });

        it("saveLocally should save to explicit existing project without creating phantom project even if CurrentProject is missing", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            const initSpy = jest.spyOn(storage, "initialiseNewProject");
            storage.data = {
                CurrentProject: undefined,
                Projects: {
                    projExisting: {
                        ProjectName: "Existing Song",
                        ProjectData: "data-orig",
                        ProjectImage: "img-orig",
                        DateLastModified: 1000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.saveLocally("data-updated", "img-updated", "projExisting");

            expect(initSpy).not.toHaveBeenCalled();
            expect(Object.keys(storage.data.Projects).length).toBe(1);
            expect(storage.data.Projects["projExisting"].ProjectData).toBe("data-updated");
            expect(storage.data.Projects["projExisting"].ProjectImage).toBe("img-updated");
        });

        it("saveLocally should ignore explicit save targeting non-existent project without creating phantom project", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            const initSpy = jest.spyOn(storage, "initialiseNewProject");
            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Song 1",
                        ProjectData: "data-1",
                        DateLastModified: 1000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.saveLocally("phantom-data", "phantom-img", "nonexistent-id");

            expect(initSpy).not.toHaveBeenCalled();
            expect(storage.data.Projects["nonexistent-id"]).toBeUndefined();
            expect(Object.keys(storage.data.Projects).length).toBe(1);
            expect(storage.data.Projects["proj1"].ProjectData).toBe("data-1");
            expect(storage.getCurrentProjectID()).toBe("proj1");
        });

        it("in-flight save paused during active project deletion should not resurrect deleted project or corrupt replacement project", async () => {
            let resolveStorageSet;
            const deferredPromise = new Promise(resolve => {
                resolveStorageSet = resolve;
            });

            const persistedStorage = {};
            storage.LocalStorage = {
                setItem: jest.fn(async (key, val) => {
                    persistedStorage[key] = val;
                }),
                getItem: jest.fn(async key => persistedStorage[key] || null)
            };

            storage.data = {
                CurrentProject: "proj1",
                Projects: {
                    proj1: {
                        ProjectName: "Active Song",
                        ProjectData: "data-A-orig",
                        ProjectImage: "img-A",
                        DateLastModified: 1000
                    },
                    proj2: {
                        ProjectName: "Replacement Song",
                        ProjectData: "data-B-orig",
                        ProjectImage: "img-B",
                        DateLastModified: 2000
                    }
                },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };

            await storage.save();

            let pauseHit = false;
            storage.LocalStorage.setItem = jest.fn(async (key, val) => {
                persistedStorage[key] = val;
                if (!pauseHit && key === storage.LocalStorageKey) {
                    pauseHit = true;
                    await deferredPromise;
                }
            });

            // 1. Begin a workspace save for the active project
            const inFlightSave = storage.saveLocally("data-A-modified", "img-A-new", "proj1");

            // 2. Delete active project and transition state while save is in-flight
            const deletePromise = storage.deleteProject("proj1");

            // 3. Resolve the paused in-flight operation
            resolveStorageSet();

            await inFlightSave;
            await deletePromise;

            // 4. Inspect in-memory state and persisted state
            expect(storage.data.Projects["proj1"]).toBeUndefined();
            expect(storage.getCurrentProjectID()).toBe("proj2");
            expect(storage.data.Projects["proj2"].ProjectData).toBe("data-B-orig");

            const persisted = JSON.parse(persistedStorage[storage.LocalStorageKey]);
            expect(persisted.Projects["proj1"]).toBeUndefined();
            expect(persisted.CurrentProject).toBe("proj2");
            expect(persisted.Projects["proj2"].ProjectData).toBe("data-B-orig");
        });

        it("renameProject should update project name", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            await storage.renameProject("proj1", "New Name");
            expect(storage.data.Projects["proj1"].ProjectName).toBe("New Name");
            expect(saveSpy).toHaveBeenCalled();
        });

        it("like should save liked state", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            await storage.like("proj1", true);
            expect(storage.isLiked("proj1")).toBe(true);
            expect(saveSpy).toHaveBeenCalled();
        });

        it("report should save reported state", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            await storage.report("proj1", true);
            expect(storage.isReported("proj1")).toBe(true);
            expect(saveSpy).toHaveBeenCalled();
        });
    });

    describe("initialiseNewProject()", () => {
        beforeEach(() => {
            storage.data = {
                Projects: {},
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "anonymous"
            };
        });

        it("should create a new project with given name", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            await storage.initialiseNewProject("My Song", "data", "img");

            const id = storage.data.CurrentProject;
            expect(id).toBeDefined();
            expect(storage.data.Projects[id].ProjectName).toBe("My Song");
            expect(storage.data.Projects[id].ProjectData).toBe("data");
            expect(storage.data.Projects[id].ProjectImage).toBe("img");
            expect(saveSpy).toHaveBeenCalled();
        });

        it("adds a project without switching to it when makeCurrent is false", async () => {
            const saveSpy = jest.spyOn(storage, "save").mockResolvedValue();
            storage.data.CurrentProject = "open";

            const id = await storage.initialiseNewProject("Copy", "data", "img", null, {
                makeCurrent: false
            });

            expect(storage.data.CurrentProject).toBe("open");
            expect(storage.data.Projects[id].ProjectName).toBe("Copy");
            expect(saveSpy).toHaveBeenCalled();
        });

        it("should use default name when none provided", async () => {
            jest.spyOn(storage, "save").mockResolvedValue();
            await storage.initialiseNewProject();

            const id = storage.data.CurrentProject;
            expect(storage.data.Projects[id].ProjectName).toBe("My Project");
        });
    });

    describe("generateID()", () => {
        it("should return a string of digits", () => {
            const id = storage.generateID();
            expect(typeof id).toBe("string");
            expect(id).toMatch(/^\d+$/);
        });

        it("should generate unique IDs", () => {
            const ids = new Set();
            for (let i = 0; i < 50; i++) {
                ids.add(storage.generateID());
            }
            // With timestamp + 3 random digits, collisions are very unlikely
            expect(ids.size).toBeGreaterThan(1);
        });
    });

    describe("end-to-end: data loss and recovery scenario", () => {
        it("should recover projects after primary storage corruption", async () => {
            jest.spyOn(console, "warn").mockImplementation();
            jest.spyOn(console, "error").mockImplementation();

            // Simulate a user who has saved projects
            storage.data = {
                Projects: {
                    abc: { ProjectName: "Student Song", ProjectData: "important-blocks" }
                },
                CurrentProject: "abc",
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "student"
            };

            // Save twice to create both primary and backup
            await storage.save();
            storage.data.Projects["abc"].ProjectData = "updated-blocks";
            await storage.save();

            // Simulate corruption: overwrite primary with garbage
            mockLocalforage._store[storage.LocalStorageKey] = "CORRUPTED!!!";

            // Restore should recover from backup
            await storage.restore();

            expect(storage.data).not.toBeNull();
            expect(storage.data.Projects["abc"]).toBeDefined();
            expect(storage.data.Projects["abc"].ProjectName).toBe("Student Song");
        });

        it("should not lose backup when primary is already corrupted on init", async () => {
            jest.spyOn(console, "warn").mockImplementation();
            jest.spyOn(console, "error").mockImplementation();

            // Set up backup data
            const backupData = {
                Projects: { xyz: { ProjectName: "Precious Project" } },
                LikedProjects: {},
                ReportedProjects: {},
                DefaultCreatorName: "student"
            };
            await storage.set(storage.BackupStorageKey, backupData);

            // Corrupt primary
            mockLocalforage._store[storage.LocalStorageKey] = "BROKEN";

            // Run restore + initialiseStorage (the init flow minus port())
            await storage.restore();
            await storage.initialiseStorage();

            // Backup should still be intact
            const backup = await storage.get(storage.BackupStorageKey);
            expect(backup).not.toBeNull();

            // Data should be recovered
            expect(storage.data.Projects["xyz"].ProjectName).toBe("Precious Project");
        });
    });
});
