// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

const CacheManager = require("../CacheManager");
const { IDBFactory, IDBKeyRange } = require("fake-indexeddb");

// Mock IndexedDB
const indexedDB = {
    open: jest.fn()
};

describe("CacheManager", () => {
    let cacheManager;
    let mockDB;
    let mockStore;
    let mockTransaction;

    beforeEach(() => {
        // Setup mock IndexedDB
        mockStore = {
            put: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
            clear: jest.fn(),
            count: jest.fn(),
            createIndex: jest.fn(),
            index: jest.fn()
        };

        mockTransaction = {
            objectStore: jest.fn(() => mockStore),
            oncomplete: null,
            onerror: null
        };

        mockDB = {
            objectStoreNames: {
                contains: jest.fn(() => false)
            },
            createObjectStore: jest.fn(() => mockStore),
            transaction: jest.fn(() => mockTransaction),
            close: jest.fn()
        };

        // Mock window.indexedDB
        global.window = {
            indexedDB: {
                open: jest.fn(() => ({
                    onerror: null,
                    onsuccess: null,
                    onupgradeneeded: null,
                    result: mockDB
                }))
            }
        };

        cacheManager = new CacheManager({
            dbName: "TestCache",
            metadataExpiry: 1000,
            projectExpiry: 2000,
            maxCacheSize: 10
        });
    });

    afterEach(() => {
        cacheManager.close();
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should initialize with default options", () => {
            const cm = new CacheManager();
            expect(cm.dbName).toBe("MusicBlocksPlanetCache");
            expect(cm.metadataExpiry).toBe(24 * 60 * 60 * 1000);
            expect(cm.projectExpiry).toBe(7 * 24 * 60 * 60 * 1000);
            expect(cm.maxCacheSize).toBe(100);
        });

        it("should initialize with custom options", () => {
            expect(cacheManager.dbName).toBe("TestCache");
            expect(cacheManager.metadataExpiry).toBe(1000);
            expect(cacheManager.projectExpiry).toBe(2000);
            expect(cacheManager.maxCacheSize).toBe(10);
        });

        it("should not be initialized before init() is called", () => {
            expect(cacheManager.isInitialized).toBe(false);
        });

        it("should have correct store names", () => {
            expect(cacheManager.STORES.METADATA).toBe("projectMetadata");
            expect(cacheManager.STORES.PROJECTS).toBe("projectData");
            expect(cacheManager.STORES.THUMBNAILS).toBe("projectThumbnails");
        });
    });

    describe("_isExpired", () => {
        it("should return true for past timestamps", () => {
            const pastTime = Date.now() - 1000;
            expect(cacheManager._isExpired(pastTime)).toBe(true);
        });

        it("should return false for future timestamps", () => {
            const futureTime = Date.now() + 1000;
            expect(cacheManager._isExpired(futureTime)).toBe(false);
        });
    });

    describe("getMetadata before init", () => {
        it("should return null if not initialized", async () => {
            const result = await cacheManager.getMetadata("test-id");
            expect(result).toBeNull();
        });
    });

    describe("getProject before init", () => {
        it("should return null if not initialized", async () => {
            const result = await cacheManager.getProject("test-id");
            expect(result).toBeNull();
        });
    });

    describe("getThumbnail before init", () => {
        it("should return null if not initialized", async () => {
            const result = await cacheManager.getThumbnail("test-id");
            expect(result).toBeNull();
        });
    });

    describe("cacheMetadata before init", () => {
        it("should return false if not initialized", async () => {
            const result = await cacheManager.cacheMetadata("test-id", { name: "Test" });
            expect(result).toBe(false);
        });
    });

    describe("cacheProject before init", () => {
        it("should return false if not initialized", async () => {
            const result = await cacheManager.cacheProject("test-id", { data: "test" });
            expect(result).toBe(false);
        });
    });

    describe("cacheThumbnail before init", () => {
        it("should return false if not initialized", async () => {
            const result = await cacheManager.cacheThumbnail(
                "test-id",
                "data:image/png;base64,..."
            );
            expect(result).toBe(false);
        });
    });

    describe("clearExpired before init", () => {
        it("should return 0 if not initialized", async () => {
            const result = await cacheManager.clearExpired();
            expect(result).toBe(0);
        });
    });

    describe("clearAll before init", () => {
        it("should return false if not initialized", async () => {
            const result = await cacheManager.clearAll();
            expect(result).toBe(false);
        });
    });

    describe("getStats before init", () => {
        it("should return zeros if not initialized", async () => {
            const stats = await cacheManager.getStats();
            expect(stats).toEqual({
                metadata: 0,
                projects: 0,
                thumbnails: 0
            });
        });
    });

    describe("close", () => {
        it("should close database and reset state", () => {
            cacheManager.db = mockDB;
            cacheManager.isInitialized = true;

            cacheManager.close();

            expect(mockDB.close).toHaveBeenCalled();
            expect(cacheManager.db).toBeNull();
            expect(cacheManager.isInitialized).toBe(false);
        });

        it("should handle closing when db is null", () => {
            cacheManager.db = null;
            expect(() => cacheManager.close()).not.toThrow();
        });
    });
});

// IndexedDB integration tests
describe("IndexedDB CacheManager integration", () => {
    let cacheManager;

    beforeEach(async () => {
        // fake-indexeddb v6 uses structuredClone
        if (!global.structuredClone) {
            global.structuredClone = val => JSON.parse(JSON.stringify(val));
        }
        global.indexedDB = new IDBFactory();
        global.IDBKeyRange = IDBKeyRange;
        cacheManager = new CacheManager({
            dbName: "TestCache",
            metadataExpiry: 1000,
            projectExpiry: 2000,
            maxCacheSize: 5
        });
        await cacheManager.init();
    });

    afterEach(() => {
        cacheManager.close();
        jest.useRealTimers();
    });

    describe("init()", () => {
        let freshManager;

        beforeEach(() => {
            global.indexedDB = new IDBFactory();
            global.IDBKeyRange = IDBKeyRange;
            freshManager = new CacheManager({
                dbName: "InitTestCache",
                metadataExpiry: 1000,
                projectExpiry: 2000,
                maxCacheSize: 5
            });
        });

        afterEach(() => {
            freshManager.close();
        });

        test("returns true on success and sets isInitialized", async () => {
            const result = await freshManager.init();
            expect(result).toBe(true);
            expect(freshManager.isInitialized).toBe(true);
        });

        test("calls clearExpired() automatically on init", async () => {
            const spy = jest.spyOn(freshManager, "clearExpired");
            await freshManager.init();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        test("returns false when window.indexedDB is missing", async () => {
            const saved = global.indexedDB;
            delete global.indexedDB;
            const result = await freshManager.init();
            global.indexedDB = saved;
            expect(result).toBe(false);
            expect(freshManager.isInitialized).toBe(false);
        });

        test("second call returns true without re-opening DB", async () => {
            await freshManager.init();
            const spy = jest.spyOn(freshManager, "_openDatabase");
            const result = await freshManager.init();
            expect(result).toBe(true);
            expect(spy).not.toHaveBeenCalled();
        });

        test("creates all three object stores", async () => {
            await freshManager.init();
            const storeNames = freshManager.db.objectStoreNames;
            expect(storeNames.contains("projectMetadata")).toBe(true);
            expect(storeNames.contains("projectData")).toBe(true);
            expect(storeNames.contains("projectThumbnails")).toBe(true);
        });
    });

    describe("cacheMetadata / getMetadata", () => {
        test("caches and retrieves metadata by id", async () => {
            const metadata = { name: "Project A", author: "ABC" };
            await cacheManager.cacheMetadata("proj-1", metadata);
            expect(await cacheManager.getMetadata("proj-1")).toEqual(metadata);
        });

        test("returns null for unknown id", async () => {
            expect(await cacheManager.getMetadata("nonexistent")).toBeNull();
        });

        test("returns null for expired entry", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            await cacheManager.cacheMetadata("proj-exp", { name: "Expired" });
            jest.setSystemTime(BASE + 1500);
            expect(await cacheManager.getMetadata("proj-exp")).toBeNull();
            jest.useRealTimers();
        });

        test("returns data for non-expired entry", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            const metadata = { name: "Fresh" };
            await cacheManager.cacheMetadata("proj-fresh", metadata);
            jest.setSystemTime(BASE + 500);
            expect(await cacheManager.getMetadata("proj-fresh")).toEqual(metadata);
            jest.useRealTimers();
        });
    });

    describe("cacheProject / getProject", () => {
        test("caches and retrieves project by id", async () => {
            const data = { blocks: [], notes: [] };
            await cacheManager.cacheProject("p-1", data);
            expect(await cacheManager.getProject("p-1")).toEqual(data);
        });

        test("returns null for unknown id", async () => {
            expect(await cacheManager.getProject("unknown")).toBeNull();
        });

        test("returns null for expired project", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            await cacheManager.cacheProject("p-exp", { data: "old" });
            jest.setSystemTime(BASE + 2500);
            expect(await cacheManager.getProject("p-exp")).toBeNull();
            jest.useRealTimers();
        });

        test("project stored past metadataExpiry but within projectExpiry", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            const data = { data: "alive" };
            await cacheManager.cacheProject("p-alive", data);
            jest.setSystemTime(BASE + 1500);
            expect(await cacheManager.getProject("p-alive")).toEqual(data);
            jest.useRealTimers();
        });
    });

    describe("cacheThumbnail / getThumbnail", () => {
        test("cache and retrieves thumbnail data URL", async () => {
            const url = "data:image/png;base64,abc123";
            await cacheManager.cacheThumbnail("t-1", url);
            expect(await cacheManager.getThumbnail("t-1")).toBe(url);
        });

        test("cacheThumbnail returns true", async () => {
            expect(await cacheManager.cacheThumbnail("t-1", "data:image/png;base64,...")).toBe(
                true
            );
        });

        test("returns null for unknown id", async () => {
            expect(await cacheManager.getThumbnail("unknown")).toBeNull();
        });

        test("returns null for expired thumbnail", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            await cacheManager.cacheThumbnail("t-exp", "data:image/png;base64...");
            jest.setSystemTime(BASE + 1500);
            expect(await cacheManager.getThumbnail("t-exp")).toBeNull();
            jest.useRealTimers();
        });

        test("getThumbnail does not update lastAccessed", async () => {
            await cacheManager.cacheThumbnail("t1", "data:image/png;base64...");
            const before = await cacheManager._getFromStore("projectThumbnails", "t1");
            await cacheManager.getThumbnail("t1");
            const after = await cacheManager._getFromStore("projectThumbnails", "t1");
            expect(after.lastAccessed).toBeUndefined();
            expect(before).toEqual(after);
        });
    });

    describe("clearExpired", () => {
        test("returns 0 when nothing is expired", async () => {
            await cacheManager.cacheMetadata("m-1", { name: "A" });
            expect(await cacheManager.clearExpired()).toBe(0);
        });

        test("removes only expired metadata", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            await cacheManager.cacheMetadata("old", { name: "Old" });
            jest.setSystemTime(BASE + 1500);
            await cacheManager.cacheMetadata("new", { name: "New" });
            jest.setSystemTime(BASE + 1600);
            const cleared = await cacheManager.clearExpired();
            expect(cleared).toBe(1);
            expect(await cacheManager.getMetadata("old")).toBeNull();
            expect(await cacheManager.getMetadata("new")).toEqual({ name: "New" });
            jest.useRealTimers();
        });

        test("removes only expired projects", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            await cacheManager.cacheProject("old-p", { data: "old" });
            jest.setSystemTime(BASE + 2500);
            await cacheManager.cacheProject("new-p", { data: "new" });
            jest.setSystemTime(BASE + 2600);
            const cleared = await cacheManager.clearExpired();
            expect(cleared).toBe(1);
            expect(await cacheManager.getProject("old-p")).toBeNull();
            expect(await cacheManager.getProject("new-p")).toEqual({ data: "new" });
            jest.useRealTimers();
        });

        test("clears from all three stores. Returns 3 when all three entries are expired", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            await cacheManager.cacheMetadata("m-all", { name: "M" });
            await cacheManager.cacheProject("p-all", { data: "P" });
            await cacheManager.cacheThumbnail("t-all", "data:image/png;base64,...");
            jest.setSystemTime(BASE + 2500);
            const cleared = await cacheManager.clearExpired();
            expect(cleared).toBe(3);
            jest.useRealTimers();
        });

        test("returns 0 after clearAll()", async () => {
            await cacheManager.cacheMetadata("m-1", { name: "A" });
            await cacheManager.clearAll();
            expect(await cacheManager.clearExpired()).toBe(0);
        });
    });

    describe("clearAll", () => {
        test("clearAll returns true", async () => {
            expect(await cacheManager.clearAll()).toBe(true);
        });

        test("getStats returns all zeros after clearing", async () => {
            await cacheManager.cacheMetadata("m-1", { name: "A" });
            await cacheManager.cacheProject("p-1", { data: "B" });
            await cacheManager.clearAll();
            expect(await cacheManager.getStats()).toEqual({
                metadata: 0,
                projects: 0,
                thumbnails: 0
            });
        });

        test("cached items are inaccessible after clearing", async () => {
            await cacheManager.cacheMetadata("m-1", { name: "A" });
            await cacheManager.cacheProject("p-1", { data: "B" });
            await cacheManager.cacheThumbnail("t-1", "data:...");
            await cacheManager.clearAll();
            expect(await cacheManager.getMetadata("m-1")).toBeNull();
            expect(await cacheManager.getProject("p-1")).toBeNull();
            expect(await cacheManager.getThumbnail("t-1")).toBeNull();
        });

        test("calling twice returns true both times", async () => {
            expect(await cacheManager.clearAll()).toBe(true);
            expect(await cacheManager.clearAll()).toBe(true);
        });
    });

    describe("getStats", () => {
        test("returns all zeros after init", async () => {
            expect(await cacheManager.getStats()).toEqual({
                metadata: 0,
                projects: 0,
                thumbnails: 0
            });
        });

        test("returns accurate counts after caching items", async () => {
            await cacheManager.cacheMetadata("m-1", { name: "A" });
            await cacheManager.cacheMetadata("m-2", { name: "B" });
            await cacheManager.cacheProject("p-1", { data: "C" });
            await cacheManager.cacheThumbnail("t-1", "data:...");
            expect(await cacheManager.getStats()).toEqual({
                metadata: 2,
                projects: 1,
                thumbnails: 1
            });
        });

        test("returns all zeros after clearAll()", async () => {
            await cacheManager.cacheMetadata("m-1", { name: "A" });
            await cacheManager.clearAll();
            expect(await cacheManager.getStats()).toEqual({
                metadata: 0,
                projects: 0,
                thumbnails: 0
            });
        });

        test("re-caching same id does not double-count", async () => {
            await cacheManager.cacheMetadata("m-1", { name: "A" });
            await cacheManager.cacheMetadata("m-1", { name: "B" });
            expect((await cacheManager.getStats()).metadata).toBe(1);
        });

        test("counts expired entries", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            await cacheManager.cacheMetadata("m-exp", { name: "Expired" });
            jest.setSystemTime(BASE + 1500);
            expect(await cacheManager.getMetadata("m-exp")).toBeNull();
            expect((await cacheManager.getStats()).metadata).toBe(1);
            jest.useRealTimers();
        });
    });

    describe("enforceMaxSize", () => {
        test("count stays at maxCacheSize after insertion beyond max", async () => {
            for (let i = 0; i < 7; i++) {
                await cacheManager.cacheMetadata(`m-${i}`, { name: `Item ${i}` });
            }
            expect((await cacheManager.getStats()).metadata).toBe(5);
        });

        test("does not remove when count is below maxCacheSize", async () => {
            for (let i = 0; i < 3; i++) {
                await cacheManager.cacheMetadata(`m-${i}`, { name: `Item ${i}` });
            }
            expect((await cacheManager.getStats()).metadata).toBe(3);
        });

        test("LRU removal: oldest lastAccessed is removed first on overflow", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            for (let i = 0; i < 5; i++) {
                jest.setSystemTime(BASE + i * 100);
                await cacheManager.cacheMetadata(`m-${i}`, { name: `Item ${i}` });
            }
            jest.setSystemTime(BASE + 1000);
            await cacheManager.cacheMetadata("m-5", { name: "Item 5" });
            expect((await cacheManager.getStats()).metadata).toBe(5);
            const isRemoved = await cacheManager._getFromStore("projectMetadata", "m-0");
            expect(isRemoved).toBeUndefined();
            jest.useRealTimers();
        });
    });

    describe("updateLastAccessed", () => {
        test("getMetadata updates lastAccessed", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            await cacheManager.cacheMetadata("m-ua", { name: "Test" });
            const before = await cacheManager._getFromStore("projectMetadata", "m-ua");
            jest.setSystemTime(BASE + 500);
            await cacheManager.getMetadata("m-ua");
            const after = await cacheManager._getFromStore("projectMetadata", "m-ua");
            expect(before.lastAccessed).toBe(BASE);
            expect(after.lastAccessed).toBe(BASE + 500);
            jest.useRealTimers();
        });

        test("does not throw for non-existent key", async () => {
            await expect(
                cacheManager._updateLastAccessed("projectMetadata", "nonexistent")
            ).resolves.not.toThrow();
        });

        test("getProject updates lastAccessed", async () => {
            const BASE = 1000;
            jest.useFakeTimers();
            jest.setSystemTime(BASE);
            await cacheManager.cacheProject("p-ua", { data: "test" });
            const before = await cacheManager._getFromStore("projectData", "p-ua");
            jest.setSystemTime(BASE + 500);
            await cacheManager.getProject("p-ua");
            const after = await cacheManager._getFromStore("projectData", "p-ua");
            expect(before.lastAccessed).toBe(BASE);
            expect(after.lastAccessed).toBe(BASE + 500);
            jest.useRealTimers();
        });
    });
});
