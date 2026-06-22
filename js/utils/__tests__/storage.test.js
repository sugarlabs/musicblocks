const IndexedDBWrapper = require("../storage");
require("fake-indexeddb/auto");

// Polyfill structuredClone for JSDOM
if (typeof global.structuredClone === "undefined") {
    global.structuredClone = val =>
        val === undefined ? undefined : JSON.parse(JSON.stringify(val));
}

describe("IndexedDBWrapper", () => {
    let storageWrapper;
    let mockLocalStorage;
    let mockBroadcastChannelPostMessage;
    let originalURLSearchParams;

    beforeEach(() => {
        originalURLSearchParams = global.URLSearchParams;

        global.navigator = global.navigator || {};
        global.navigator.storage = { persist: jest.fn().mockResolvedValue(true) };

        // Mock localStorage properly in JSDOM
        mockLocalStorage = {};
        const localStorageMock = {
            getItem: jest.fn(key =>
                mockLocalStorage[key] !== undefined ? mockLocalStorage[key] : null
            ),
            setItem: jest.fn((key, value) => {
                mockLocalStorage[key] = String(value);
            }),
            removeItem: jest.fn(key => {
                delete mockLocalStorage[key];
            }),
            clear: jest.fn(() => {
                mockLocalStorage = {};
            }),
            key: jest.fn(i => Object.keys(mockLocalStorage)[i]),
            get length() {
                return Object.keys(mockLocalStorage).length;
            }
        };
        Object.defineProperty(window, "localStorage", {
            value: localStorageMock,
            writable: true
        });
        // Also map it to global for the tests
        global.localStorage = window.localStorage;

        // Mock BroadcastChannel
        mockBroadcastChannelPostMessage = jest.fn();
        global.BroadcastChannel = class {
            constructor(name) {
                this.name = name;
                this.postMessage = mockBroadcastChannelPostMessage;
            }
        };

        storageWrapper = new IndexedDBWrapper();
    });

    afterEach(async () => {
        global.URLSearchParams = originalURLSearchParams;
        // Close DB connections to avoid deleteDatabase deadlock
        if (storageWrapper && storageWrapper.db) {
            storageWrapper.db.close();
        }
        // Clean up the fake DB so tests don't leak state
        await new Promise(resolve => {
            const req = window.indexedDB.deleteDatabase("MusicBlocksDB");
            req.onsuccess = resolve;
            req.onerror = resolve;
            req.onblocked = resolve;
        });
    });

    test("migrates from localStorage to IndexedDB on first init", async () => {
        global.localStorage.setItem("themePreference", "dark");
        global.localStorage.setItem("beginnerMode", "false");

        await storageWrapper.init();

        // Check if cache populated correctly via Proxy
        expect(storageWrapper.proxy.themePreference).toBe("dark");
        expect(storageWrapper.proxy.beginnerMode).toBe("false");

        // Verify data was actually saved to IDB
        const idbVal = await storageWrapper.getItem("themePreference");
        expect(idbVal).toBe("dark");

        // Verify migration_v1_complete flag was set in IDB
        const flagVal = await storageWrapper.getItem("migration_v1_complete");
        expect(flagVal).toBe(true);
    });

    test("skips migration if migration_v1_complete flag is present", async () => {
        // First setup IDB with flag
        await storageWrapper.init();

        // Put a stale value in localStorage
        global.localStorage.setItem("themePreference", "stale_light");

        // Re-init with new wrapper instance (simulating a fresh boot)
        const newWrapper = new IndexedDBWrapper();
        await newWrapper.init();

        // Should NOT have migrated the stale value
        expect(newWrapper.proxy.themePreference).toBeUndefined();

        // Clean up connection
        if (newWrapper.db) {
            newWrapper.db.close();
        }
    });

    test("does not cache heavy keys on startup", async () => {
        global.localStorage.setItem("themePreference", "dark");
        global.localStorage.setItem("SESSION123", "massive_data");
        global.localStorage.setItem("localStorage:plugins", "massive_plugins");

        await storageWrapper.init();

        // Lightweight key should be cached and accessible synchronously via proxy
        expect(storageWrapper.proxy.themePreference).toBe("dark");

        // Heavy keys should NOT be in cache
        expect(storageWrapper.proxy["SESSION123"]).toBeUndefined();
        expect(storageWrapper.proxy["localStorage:plugins"]).toBeUndefined();

        // But they SHOULD be in IndexedDB (can be accessed asynchronously)
        expect(await storageWrapper.getItem("SESSION123")).toBe("massive_data");
        expect(await storageWrapper.getItem("localStorage:plugins")).toBe("massive_plugins");
    });

    test("proxy set operation updates cache and triggers async write", async () => {
        await storageWrapper.init();

        // Write via proxy
        storageWrapper.proxy.newPref = "testValue";

        // Cache should be updated immediately
        expect(storageWrapper.proxy.newPref).toBe("testValue");

        // Allow async writes to flush
        await new Promise(resolve => setTimeout(resolve, 0));

        // IndexedDB should be updated
        expect(await storageWrapper.getItem("newPref")).toBe("testValue");

        // BroadcastChannel should have been notified
        expect(mockBroadcastChannelPostMessage).toHaveBeenCalledWith({
            action: "set",
            key: "newPref",
            value: "testValue"
        });
    });

    test("proxy delete operation updates cache and triggers async remove", async () => {
        await storageWrapper.init();
        storageWrapper.proxy.toBeDeleted = "value";
        await new Promise(resolve => setTimeout(resolve, 0));

        // Delete via proxy
        delete storageWrapper.proxy.toBeDeleted;

        // Cache should be empty
        expect(storageWrapper.proxy.toBeDeleted).toBeUndefined();

        // Allow async writes to flush
        await new Promise(resolve => setTimeout(resolve, 0));

        // IndexedDB should be empty for this key
        expect(await storageWrapper.getItem("toBeDeleted")).toBeUndefined();

        // BroadcastChannel should have been notified
        expect(mockBroadcastChannelPostMessage).toHaveBeenCalledWith({
            action: "remove",
            key: "toBeDeleted",
            value: undefined
        });
    });

    test("clear empties cache and IndexedDB, broadcasts clear", async () => {
        await storageWrapper.init();
        storageWrapper.proxy.item1 = "1";
        storageWrapper.proxy.item2 = "2";
        await new Promise(resolve => setTimeout(resolve, 0));

        await storageWrapper.clear();

        expect(storageWrapper.proxy.item1).toBeUndefined();
        expect(await storageWrapper.getItem("item2")).toBeUndefined();

        expect(mockBroadcastChannelPostMessage).toHaveBeenCalledWith({
            action: "clear",
            key: undefined,
            value: undefined
        });
    });

    test("broadcast events update local cache", async () => {
        await storageWrapper.init();

        // Simulate receiving a broadcast from another tab
        storageWrapper._handleBroadcast({
            data: { action: "set", key: "crossTabKey", value: "synced!" }
        });

        // Proxy should immediately reflect the change
        expect(storageWrapper.proxy.crossTabKey).toBe("synced!");

        storageWrapper._handleBroadcast({
            data: { action: "remove", key: "crossTabKey" }
        });

        expect(storageWrapper.proxy.crossTabKey).toBeUndefined();
    });

    test("falls back to localStorage if disableIndexedDB=true URL param is present", async () => {
        // Mock URLSearchParams to return our custom param
        global.URLSearchParams = jest.fn(() => ({
            get: key => (key === "disableIndexedDB" ? "true" : null)
        }));

        const fallbackWrapper = new IndexedDBWrapper();
        global.localStorage.setItem("fallbackKey", "fallbackValue");

        await fallbackWrapper.init();

        expect(fallbackWrapper.isFallback).toBe(true);
        expect(fallbackWrapper.proxy.fallbackKey).toBe("fallbackValue");

        // Proxy writes should go directly to localStorage
        fallbackWrapper.proxy.newFallbackKey = "test";
        expect(global.localStorage.setItem).toHaveBeenCalledWith("newFallbackKey", "test");
    });
});
