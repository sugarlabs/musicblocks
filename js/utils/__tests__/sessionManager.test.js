/**
 * MusicBlocks v3.4.1
 *
 * @author Lavjeet Kumar Rai
 *
 * @copyright 2026 Lavjeet Kumar Rai
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

    test("loadSession returns null when store.get request triggers onerror", async () => {
        const db = await sessionManager.init();
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        jest.spyOn(db, "transaction").mockImplementationOnce(() => {
            const req = {};
            const tx = {
                objectStore: () => ({
                    get: () => {
                        queueMicrotask(() => {
                            if (req.onerror)
                                req.onerror({ target: { error: new Error("Get Request Error") } });
                        });
                        return req;
                    }
                })
            };
            return tx;
        });

        const result = await sessionManager.loadSession("corruptedKey");
        expect(result).toBeNull();

        expect(consoleSpy).toHaveBeenCalledWith(
            "[SessionStorageManager] Error loading session:",
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });

    test("loadSession returns null when transaction errors or aborts", async () => {
        const db = await sessionManager.init();
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        // Test tx error
        jest.spyOn(db, "transaction").mockImplementationOnce(() => {
            const tx = {
                objectStore: () => ({
                    get: () => ({})
                })
            };
            queueMicrotask(() => {
                if (tx.onerror) tx.onerror({ target: { error: new Error("Load Tx Error") } });
            });
            return tx;
        });

        expect(await sessionManager.loadSession("k1")).toBeNull();

        // Test tx abort
        jest.spyOn(db, "transaction").mockImplementationOnce(() => {
            const tx = {
                objectStore: () => ({
                    get: () => ({})
                })
            };
            queueMicrotask(() => {
                if (tx.onabort) tx.onabort({ target: { error: new Error("Load Tx Aborted") } });
            });
            return tx;
        });

        expect(await sessionManager.loadSession("k2")).toBeNull();

        consoleSpy.mockRestore();
    });

    test("deleteSession successfully deletes a specific key", async () => {
        const key1 = "SESSIONProject1";
        const key2 = "SESSIONProject2";
        await sessionManager.saveSession(key1, "data1");
        await sessionManager.saveSession(key2, "data2");

        await sessionManager.deleteSession(key1);

        expect(await sessionManager.loadSession(key1)).toBeNull();
        const loaded2 = await sessionManager.loadSession(key2);
        expect(loaded2).toBeDefined();
        expect(loaded2.data).toBe("data2");
    });

    test("deleteSession catches and rethrows errors", async () => {
        jest.spyOn(sessionManager, "init").mockRejectedValue(new Error("Init failed"));
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        await expect(sessionManager.deleteSession("key")).rejects.toThrow("Init failed");

        expect(consoleSpy).toHaveBeenCalledWith(
            "[SessionStorageManager] Error deleting session:",
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });

    test("clearAllSessions successfully clears the database", async () => {
        const key = "SESSIONToClear";
        await sessionManager.saveSession(key, "data");

        await sessionManager.clearAllSessions();

        const loaded = await sessionManager.loadSession(key);
        expect(loaded).toBeNull();
    });

    test("clearAllSessions catches and rethrows errors", async () => {
        jest.spyOn(sessionManager, "init").mockRejectedValue(new Error("Init failed"));
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        await expect(sessionManager.clearAllSessions()).rejects.toThrow("Init failed");

        expect(consoleSpy).toHaveBeenCalledWith(
            "[SessionStorageManager] Error clearing sessions:",
            expect.any(Error)
        );
        consoleSpy.mockRestore();
    });

    test("saveSession rejects on transaction error and abort", async () => {
        const db = await sessionManager.init();
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        // Test transaction error
        jest.spyOn(db, "transaction").mockImplementationOnce(() => {
            const tx = { objectStore: () => ({ put: () => {} }) };
            queueMicrotask(() => {
                if (tx.onerror) tx.onerror({ target: { error: new Error("Tx Error") } });
            });
            return tx;
        });
        await expect(sessionManager.saveSession("k", "d")).rejects.toThrow("Tx Error");

        // Test transaction abort
        jest.spyOn(db, "transaction").mockImplementationOnce(() => {
            const tx = { objectStore: () => ({ put: () => {} }) };
            queueMicrotask(() => {
                if (tx.onabort) tx.onabort({ target: { error: new Error("Tx Aborted") } });
            });
            return tx;
        });
        await expect(sessionManager.saveSession("k", "d")).rejects.toThrow("Tx Aborted");

        consoleSpy.mockRestore();
    });

    test("deleteSession and clearAllSessions reject on transaction error and abort", async () => {
        const db = await sessionManager.init();
        const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        // Test deleteSession error
        jest.spyOn(db, "transaction").mockImplementationOnce(() => {
            const tx = { objectStore: () => ({ delete: () => {} }) };
            queueMicrotask(() => {
                if (tx.onerror) tx.onerror({ target: { error: new Error("Delete Tx Error") } });
            });
            return tx;
        });
        await expect(sessionManager.deleteSession("k")).rejects.toThrow("Delete Tx Error");

        // Test clearAllSessions abort
        jest.spyOn(db, "transaction").mockImplementationOnce(() => {
            const tx = { objectStore: () => ({ clear: () => {} }) };
            queueMicrotask(() => {
                if (tx.onabort) tx.onabort({ target: { error: new Error("Clear Tx Aborted") } });
            });
            return tx;
        });
        await expect(sessionManager.clearAllSessions()).rejects.toThrow("Clear Tx Aborted");

        consoleSpy.mockRestore();
    });
});
