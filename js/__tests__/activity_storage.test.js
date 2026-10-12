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

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { ProjectManager } = require("../project-manager");

const loadActivityStorageMethods = () => {
    const activityPath = path.resolve(__dirname, "../activity.js");
    let code = fs.readFileSync(activityPath, "utf8");

    // Extract _handleBeforeUnload and saveSessionAsync
    const unloadStart = code.indexOf("this._handleBeforeUnload = () => {");
    const saveEnd = code.indexOf("        this.__saveLocally =", unloadStart);
    if (unloadStart === -1 || saveEnd === -1) {
        throw new Error("Could not locate storage methods in activity.js");
    }
    let extractCode = code.slice(unloadStart, saveEnd);
    extractCode = extractCode.replace(
        "this._handleBeforeUnload = () => {",
        "this._handleBeforeUnload = function() {"
    );
    extractCode = extractCode.replace(
        "this.saveSessionAsync = async () => {",
        "this.saveSessionAsync = async function() {"
    );

    const recoverable = jest.fn();
    const sandbox = {
        ErrorHandler: {
            recoverable,
            capture: jest.fn(),
            warn: jest.fn(),
            userFacing: jest.fn()
        },
        window: global.window || {},
        document: { addEventListener: jest.fn(), attachEvent: jest.fn() },
        console,
        _: key => key,
        setTimeout,
        globalActivity: null,
        _THIS_IS_MUSIC_BLOCKS_: true,
        setupActivityAbcParser: jest.fn(),
        pubsub: { on: jest.fn(), off: jest.fn() },
        Date: { now: () => 1000000 } // Mock Date.now()
    };

    vm.createContext(sandbox);
    vm.runInContext(extractCode, sandbox);

    const loadStart = async that => {
        const pm = new ProjectManager(that);
        return pm._loadStart(that);
    };

    return {
        loadStart,
        _handleBeforeUnload: sandbox._handleBeforeUnload,
        saveSessionAsync: sandbox.saveSessionAsync,
        recoverable
    };
};

describe("Activity Storage (loadStart / saveSessionAsync / _handleBeforeUnload)", () => {
    let loadStart;
    let _handleBeforeUnload;
    let saveSessionAsync;
    let recoverable;

    beforeAll(() => {
        global.pubsub = { on: jest.fn(), off: jest.fn() };
        global.ErrorHandler = { recoverable: jest.fn() };
        ({ loadStart, _handleBeforeUnload, saveSessionAsync, recoverable } =
            loadActivityStorageMethods());
    });

    afterAll(() => {
        delete global.pubsub;
        delete global.ErrorHandler;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("_handleBeforeUnload", () => {
        it("should save locally and stop render loop", () => {
            const activity = {
                __saveLocally: jest.fn(),
                saveLocally: jest.fn(),
                _stopRenderLoop: jest.fn(),
                _stopAutoSave: jest.fn()
            };

            _handleBeforeUnload.call(activity);

            expect(activity.__saveLocally).toHaveBeenCalled();
            expect(activity.saveLocally).toHaveBeenCalled();
            expect(activity._stopRenderLoop).toHaveBeenCalled();
            expect(activity._stopAutoSave).toHaveBeenCalled();
        });
    });

    describe("saveSessionAsync", () => {
        it("should call __saveLocally and save to IndexedDB", async () => {
            const mockSessionStorageManager = {
                saveSession: jest.fn().mockResolvedValue()
            };
            const mockStorage = {
                currentProject: "TestProject"
            };
            const activity = {
                __saveLocally: jest.fn(),
                sessionStorageManager: mockSessionStorageManager,
                prepareExport: jest.fn().mockReturnValue('{"blocks":[]}'),
                storage: mockStorage
            };

            // Bind saveSessionAsync to our mock activity
            const boundSave = saveSessionAsync.bind(activity);

            await boundSave();

            expect(activity.__saveLocally).toHaveBeenCalled();
            expect(mockSessionStorageManager.saveSession).toHaveBeenCalledWith(
                "SESSIONTestProject",
                '{"blocks":[]}',
                1000000
            );
            expect(mockStorage["SESSION_TIMESTAMPTestProject"]).toBe("1000000");
        });

        it("should propagate rejection when IndexedDB saveSession fails", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            const saveError = new Error("Quota exceeded in IndexedDB");
            const mockSessionStorageManager = {
                saveSession: jest.fn().mockRejectedValue(saveError)
            };
            const mockStorage = {
                currentProject: "TestProject"
            };
            const activity = {
                __saveLocally: jest.fn(),
                sessionStorageManager: mockSessionStorageManager,
                prepareExport: jest.fn().mockReturnValue('{"blocks":[]}'),
                storage: mockStorage
            };

            const boundSave = saveSessionAsync.bind(activity);

            await expect(boundSave()).rejects.toThrow("Quota exceeded in IndexedDB");
            expect(activity.__saveLocally).toHaveBeenCalled();
            expect(mockSessionStorageManager.saveSession).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                "Failed to save session to IndexedDB:",
                saveError
            );
            consoleSpy.mockRestore();
        });

        it("should warn and not reject when writing fallback timestamp to localStorage throws", async () => {
            const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
            const mockSessionStorageManager = {
                saveSession: jest.fn().mockResolvedValue()
            };
            const mockStorage = {
                currentProject: "TestProject"
            };
            Object.defineProperty(mockStorage, "SESSION_TIMESTAMPTestProject", {
                set: () => {
                    throw new Error("QuotaExceededError");
                },
                get: () => undefined,
                configurable: true
            });
            const activity = {
                __saveLocally: jest.fn(),
                sessionStorageManager: mockSessionStorageManager,
                prepareExport: jest.fn().mockReturnValue('{"blocks":[]}'),
                storage: mockStorage
            };

            const boundSave = saveSessionAsync.bind(activity);

            await expect(boundSave()).resolves.toBeUndefined();
            expect(mockSessionStorageManager.saveSession).toHaveBeenCalled();
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "Failed to write session timestamp to localStorage:",
                expect.any(Error)
            );
            consoleWarnSpy.mockRestore();
        });

        it("should fallback to Date.now and update fallback key when localStorage timestamp is malformed", async () => {
            const mockSessionStorageManager = {
                saveSession: jest.fn().mockResolvedValue()
            };
            const mockStorage = {
                currentProject: "TestProject",
                SESSION_TIMESTAMPTestProject: "invalid_nan_timestamp"
            };
            const activity = {
                __saveLocally: jest.fn(),
                sessionStorageManager: mockSessionStorageManager,
                prepareExport: jest.fn().mockReturnValue('{"blocks":[]}'),
                storage: mockStorage
            };

            const boundSave = saveSessionAsync.bind(activity);

            await boundSave();

            expect(mockSessionStorageManager.saveSession).toHaveBeenCalledWith(
                "SESSIONTestProject",
                '{"blocks":[]}',
                1000000
            );
            expect(mockStorage["SESSION_TIMESTAMPTestProject"]).toBe("1000000");
        });

        it("should save with default 'My Project' key when currentProject is missing", async () => {
            const mockSessionStorageManager = {
                saveSession: jest.fn().mockResolvedValue()
            };
            const mockStorage = {}; // currentProject is undefined
            const activity = {
                __saveLocally: jest.fn(),
                sessionStorageManager: mockSessionStorageManager,
                prepareExport: jest.fn().mockReturnValue('{"blocks":[]}'),
                storage: mockStorage
            };

            const boundSave = saveSessionAsync.bind(activity);

            await boundSave();

            expect(activity.__saveLocally).toHaveBeenCalled();
            expect(mockSessionStorageManager.saveSession).toHaveBeenCalledWith(
                "SESSIONMy Project",
                '{"blocks":[]}',
                1000000
            );
            expect(mockStorage["SESSION_TIMESTAMPMy Project"]).toBe("1000000");
        });
    });

    describe("loadStart", () => {
        it("should prefer IndexedDB payload if it is newer", async () => {
            const mockSessionStorageManager = {
                loadSession: jest.fn().mockResolvedValue({
                    timestamp: 2000000,
                    data: '{"blocks":["idb"]}'
                })
            };
            const mockStorage = {
                currentProject: "TestProject",
                SESSIONTestProject: '{"blocks":["local"]}',
                SESSION_TIMESTAMPTestProject: "1500000" // Older than IndexedDB
            };
            const activity = {
                storage: mockStorage,
                sessionStorageManager: mockSessionStorageManager,
                doLoadAnimation: jest.fn(),
                justLoadStart: jest.fn(),
                blocks: { loadNewBlocks: jest.fn() }
            };

            await loadStart(activity);

            expect(mockSessionStorageManager.loadSession).toHaveBeenCalledWith(
                "SESSIONTestProject"
            );
            // Since idb timestamp (2000000) > local timestamp (1500000), we should load idb payload
            expect(activity.sessionData).toBe('{"blocks":["idb"]}');
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith({ blocks: ["idb"] });
        });

        it("should prefer LocalStorage payload if it is newer", async () => {
            const mockSessionStorageManager = {
                loadSession: jest.fn().mockResolvedValue({
                    timestamp: 1000000,
                    data: '{"blocks":["idb"]}'
                })
            };
            const mockStorage = {
                currentProject: "TestProject",
                SESSIONTestProject: '{"blocks":["local"]}',
                SESSION_TIMESTAMPTestProject: "2500000" // Newer than IndexedDB
            };
            const activity = {
                storage: mockStorage,
                sessionStorageManager: mockSessionStorageManager,
                doLoadAnimation: jest.fn(),
                justLoadStart: jest.fn(),
                blocks: { loadNewBlocks: jest.fn() }
            };

            await loadStart(activity);

            expect(mockSessionStorageManager.loadSession).toHaveBeenCalledWith(
                "SESSIONTestProject"
            );
            // Since local timestamp (2500000) > idb timestamp (1000000), we should load local payload
            expect(activity.sessionData).toBe('{"blocks":["local"]}');
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith({ blocks: ["local"] });
        });

        it("should fallback to LocalStorage if IndexedDB throws or is empty", async () => {
            const mockSessionStorageManager = {
                loadSession: jest.fn().mockResolvedValue(null) // No data in IndexedDB
            };
            const mockStorage = {
                currentProject: "TestProject",
                SESSIONTestProject: '{"blocks":["local"]}'
                // Missing timestamp is handled safely
            };
            const activity = {
                storage: mockStorage,
                sessionStorageManager: mockSessionStorageManager,
                doLoadAnimation: jest.fn(),
                justLoadStart: jest.fn(),
                blocks: { loadNewBlocks: jest.fn() }
            };

            await loadStart(activity);

            expect(mockSessionStorageManager.loadSession).toHaveBeenCalledWith(
                "SESSIONTestProject"
            );
            expect(activity.sessionData).toBe('{"blocks":["local"]}');
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith({ blocks: ["local"] });
        });

        it("should fallback to LocalStorage when IndexedDB payload is corrupt and delete only the corrupt IDB record", async () => {
            const mockSessionStorageManager = {
                loadSession: jest.fn().mockResolvedValue({
                    timestamp: 2000000,
                    data: "INVALID_JSON{corrupted"
                }),
                deleteSession: jest.fn().mockResolvedValue()
            };
            const mockStorage = {
                currentProject: "TestProject",
                SESSIONTestProject: '{"blocks":["valid-local"]}',
                SESSION_TIMESTAMPTestProject: "1000000",
                removeItem: jest.fn()
            };
            const activity = {
                storage: mockStorage,
                sessionStorageManager: mockSessionStorageManager,
                doLoadAnimation: jest.fn(),
                justLoadStart: jest.fn(),
                blocks: { loadNewBlocks: jest.fn() }
            };

            await loadStart(activity);

            expect(mockSessionStorageManager.deleteSession).toHaveBeenCalledWith(
                "SESSIONTestProject"
            );
            expect(mockStorage.removeItem).not.toHaveBeenCalled();
            expect(activity.sessionData).toBe('{"blocks":["valid-local"]}');
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith({
                blocks: ["valid-local"]
            });
        });

        it("should fallback to IndexedDB when LocalStorage payload is corrupt and delete only the corrupt LocalStorage record", async () => {
            const mockSessionStorageManager = {
                loadSession: jest.fn().mockResolvedValue({
                    timestamp: 1000000,
                    data: '{"blocks":["valid-idb"]}'
                }),
                deleteSession: jest.fn()
            };
            const mockStorage = {
                currentProject: "TestProject",
                SESSIONTestProject: "INVALID_JSON{corrupted",
                SESSION_TIMESTAMPTestProject: "2000000",
                removeItem: jest.fn()
            };
            const activity = {
                storage: mockStorage,
                sessionStorageManager: mockSessionStorageManager,
                doLoadAnimation: jest.fn(),
                justLoadStart: jest.fn(),
                blocks: { loadNewBlocks: jest.fn() }
            };

            await loadStart(activity);

            expect(mockStorage.removeItem).toHaveBeenCalledWith("SESSIONTestProject");
            expect(mockSessionStorageManager.deleteSession).not.toHaveBeenCalled();
            expect(activity.sessionData).toBe('{"blocks":["valid-idb"]}');
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith({
                blocks: ["valid-idb"]
            });
        });

        it("should successfully restore from IndexedDB when localStorage reads throw an exception", async () => {
            const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
            const mockSessionStorageManager = {
                loadSession: jest.fn().mockResolvedValue({
                    timestamp: 1000000,
                    data: '{"blocks":["from-idb"]}'
                })
            };
            const mockStorage = {
                currentProject: "TestProject"
            };
            Object.defineProperty(mockStorage, "SESSIONTestProject", {
                get: () => {
                    throw new Error("SecurityError: Access is denied for localStorage");
                },
                configurable: true
            });
            const activity = {
                storage: mockStorage,
                sessionStorageManager: mockSessionStorageManager,
                doLoadAnimation: jest.fn(),
                justLoadStart: jest.fn(),
                blocks: { loadNewBlocks: jest.fn() }
            };

            await loadStart(activity);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[ProjectManager] Failed to read session from local storage:",
                expect.any(Error)
            );
            expect(activity.sessionData).toBe('{"blocks":["from-idb"]}');
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith({ blocks: ["from-idb"] });
            consoleWarnSpy.mockRestore();
        });

        it("should normalize invalid local timestamp to 0 and restore newer valid IndexedDB payload", async () => {
            const mockSessionStorageManager = {
                loadSession: jest.fn().mockResolvedValue({
                    timestamp: 1000000,
                    data: '{"blocks":["idb-newer"]}'
                })
            };
            const mockStorage = {
                currentProject: "TestProject",
                SESSIONTestProject: '{"blocks":["local-older"]}',
                SESSION_TIMESTAMPTestProject: "invalid_non_numeric_timestamp"
            };
            const activity = {
                storage: mockStorage,
                sessionStorageManager: mockSessionStorageManager,
                doLoadAnimation: jest.fn(),
                justLoadStart: jest.fn(),
                blocks: { loadNewBlocks: jest.fn() }
            };

            await loadStart(activity);

            expect(mockSessionStorageManager.loadSession).toHaveBeenCalledWith(
                "SESSIONTestProject"
            );
            expect(activity.sessionData).toBe('{"blocks":["idb-newer"]}');
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith({
                blocks: ["idb-newer"]
            });
        });

        it("should load from default 'My Project' in IndexedDB when currentProject metadata is missing", async () => {
            const mockSessionStorageManager = {
                loadSession: jest.fn().mockResolvedValue({
                    timestamp: 1000000,
                    data: '{"blocks":["idb-default"]}'
                })
            };
            const mockStorage = {}; // No currentProject or local session data
            const activity = {
                storage: mockStorage,
                sessionStorageManager: mockSessionStorageManager,
                doLoadAnimation: jest.fn(),
                justLoadStart: jest.fn(),
                blocks: { loadNewBlocks: jest.fn() }
            };

            await loadStart(activity);

            expect(mockSessionStorageManager.loadSession).toHaveBeenCalledWith("SESSIONMy Project");
            expect(activity.sessionData).toBe('{"blocks":["idb-default"]}');
            expect(activity.blocks.loadNewBlocks).toHaveBeenCalledWith({
                blocks: ["idb-default"]
            });
        });
    });
});
