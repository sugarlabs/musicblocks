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

const loadActivityStorageMethods = () => {
    const activityPath = path.resolve(__dirname, "../activity.js");
    let code = fs.readFileSync(activityPath, "utf8");

    // Extract loadStart
    const loadStartStart = code.indexOf("const loadStart = async that => {");
    const loadStartEnd = code.indexOf("        this.loadStartWrapper = async", loadStartStart);
    if (loadStartStart === -1 || loadStartEnd === -1) {
        throw new Error("Could not locate loadStart in activity.js");
    }
    let extractedCode = code.slice(loadStartStart, loadStartEnd);
    extractedCode += "\nthis.loadStart = loadStart;\n";

    // Extract saveSessionAsync
    const saveStart = code.indexOf("this.saveSessionAsync = async () => {");
    const saveEnd = code.indexOf("        this.setupMouseEvents = () => {", saveStart);
    if (saveStart === -1 || saveEnd === -1) {
        throw new Error("Could not locate saveSessionAsync in activity.js");
    }
    let saveCode = code.slice(saveStart, saveEnd);
    // Convert arrow function to normal function so we can use .bind(activity) in tests
    saveCode = saveCode.replace(
        "this.saveSessionAsync = async () => {",
        "this.saveSessionAsync = async function() {"
    );
    extractedCode += saveCode;

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
        Date: { now: () => 1000000 } // Mock Date.now()
    };

    vm.createContext(sandbox);
    vm.runInContext(extractedCode, sandbox);

    return {
        loadStart: sandbox.loadStart,
        saveSessionAsync: sandbox.saveSessionAsync,
        recoverable
    };
};

describe("Activity Storage (loadStart / saveSessionAsync)", () => {
    let loadStart;
    let saveSessionAsync;
    let recoverable;

    beforeAll(() => {
        ({ loadStart, saveSessionAsync, recoverable } = loadActivityStorageMethods());
    });

    afterEach(() => {
        jest.clearAllMocks();
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
    });
});
