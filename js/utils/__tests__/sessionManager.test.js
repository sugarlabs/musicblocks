const SessionStorageManager = require("../sessionManager");

// Polyfill structuredClone for fake-indexeddb in JSDOM
if (typeof structuredClone === "undefined") {
    const clone = function (obj) {
        return JSON.parse(JSON.stringify(obj));
    };
    global.structuredClone = clone;
    if (typeof window !== "undefined") window.structuredClone = clone;
}

// Mock the global indexedDB
require("fake-indexeddb/auto");

describe("SessionStorageManager", () => {
    let sessionManager;

    beforeEach(() => {
        sessionManager = new SessionStorageManager();
    });

    afterEach(async () => {
        if (sessionManager.db) {
            sessionManager.db.close();
        }
        // Wipe the fake database between tests
        return new Promise(resolve => {
            const req = indexedDB.deleteDatabase("MusicBlocksSessionDB");
            req.onsuccess = resolve;
            req.onerror = resolve; // Ignore errors on cleanup
            req.onblocked = resolve;
        });
    });

    test("initializes the database correctly", async () => {
        const db = await sessionManager.init();
        expect(db).toBeDefined();
        expect(db.name).toBe("MusicBlocksSessionDB");
        expect(db.objectStoreNames.contains("sessions")).toBe(true);
    });

    test("saves and loads a session successfully", async () => {
        const key = "SESSIONTestProject";
        const data = JSON.stringify({ test: "data", blocks: [1, 2, 3] });
        const timestamp = 1620000000000;

        await sessionManager.saveSession(key, data, timestamp);

        const loaded = await sessionManager.loadSession(key);
        expect(loaded).toBeDefined();
        expect(loaded.key).toBe(key);
        expect(loaded.data).toBe(data);
        expect(loaded.timestamp).toBe(timestamp);
    });

    test("loadSession returns null if key does not exist", async () => {
        const loaded = await sessionManager.loadSession("NonExistentKey");
        expect(loaded).toBeNull();
    });

    test("saveSession overwrites existing data", async () => {
        const key = "SESSIONMyProject";
        const oldData = "old_data";
        const oldTimestamp = 1000;

        await sessionManager.saveSession(key, oldData, oldTimestamp);

        const newData = "new_data";
        const newTimestamp = 2000;

        await sessionManager.saveSession(key, newData, newTimestamp);

        const loaded = await sessionManager.loadSession(key);
        expect(loaded.data).toBe(newData);
        expect(loaded.timestamp).toBe(newTimestamp);
    });

    test("init handles indexedDB open errors", async () => {
        const originalOpen = global.indexedDB.open;
        global.indexedDB.open = () => {
            const req = {};
            setTimeout(() => {
                if (req.onerror)
                    req.onerror({ target: { error: new Error("Simulated Open Error") } });
            }, 10);
            return req;
        };

        await expect(sessionManager.init()).rejects.toThrow("Simulated Open Error");

        global.indexedDB.open = originalOpen;
    });

    test("saveSession catches and rethrows errors", async () => {
        jest.spyOn(sessionManager, "init").mockRejectedValue(new Error("Init failed"));
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        await expect(sessionManager.saveSession("key", "data")).rejects.toThrow("Init failed");

        expect(consoleSpy).toHaveBeenCalledWith(
            "[SessionStorageManager] Error saving session:",
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });

    test("loadSession catches errors and returns null", async () => {
        jest.spyOn(sessionManager, "init").mockRejectedValue(new Error("Init failed"));
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        const result = await sessionManager.loadSession("key");
        expect(result).toBeNull();

        expect(consoleSpy).toHaveBeenCalledWith(
            "[SessionStorageManager] Error loading session:",
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });
});
