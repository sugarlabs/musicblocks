// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

const { loadActivitySandbox } = require("./helpers/activity-vm-sandbox");

describe("Activity Core Behaviors and Lifecycle", () => {
    let warnSpy;
    let errorSpy;

    beforeEach(() => {
        warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        document.body.className = "";
        document.body.innerHTML = "";
    });

    afterEach(() => {
        warnSpy.mockRestore();
        errorSpy.mockRestore();
        delete window.hidePrintText;
        delete window.hideErrorText;
        delete window.__mbPerf;
        document.body.className = "";
        document.body.innerHTML = "";
        jest.clearAllMocks();
    });

    describe("Activity Deprecation Guard & Fallback (Lines 3189–3214)", () => {
        it("logs deprecation warnings on window.activity getter and setter", () => {
            const sandbox = loadActivitySandbox();
            const { window: sWindow } = sandbox;

            const val = sWindow.activity;
            expect(val).toBeUndefined();
            expect(warnSpy).toHaveBeenCalledWith(
                expect.stringContaining("[Deprecated] window.activity is removed")
            );

            sWindow.activity = { dummy: true };
            expect(errorSpy).toHaveBeenCalledWith(
                expect.stringContaining("[Deprecated] window.activity is removed and cannot be set")
            );
        });

        it("catches errors and warns when Object.defineProperty on window.activity throws (Line 3212)", () => {
            // Prepend script code inside the VM that locks window.activity as non-configurable
            // before activity.js runs installActivityDeprecationGuard.
            const sandbox = loadActivitySandbox({
                prependCode:
                    'Object.defineProperty(window, "activity", { value: "locked", configurable: false });'
            });

            // Guard installation catches TypeError and logs defensive warning at line 3212
            expect(warnSpy).toHaveBeenCalledWith(
                "[ActivityDeprecationGuard] Could not install guard:",
                expect.objectContaining({
                    message: expect.stringContaining("redefine property: activity")
                })
            );
            expect(sandbox.window.activity).toBe("locked");
        });
    });

    describe("Bootstrap & Initialization Sequence (Lines 3218–3260)", () => {
        it("executes setupDependencies, domReady, doContextMenus, and doPluginsAndPaletteCols when globals are ready", () => {
            let capturedDefineCallback = null;
            const mockDefine = (deps, cb) => {
                capturedDefineCallback = cb;
            };

            const sandbox = loadActivitySandbox({
                overrides: {
                    define: mockDefine,
                    createDefaultStack: jest.fn(),
                    createjs: {},
                    Tone: {},
                    GIFAnimator: class {},
                    SuperGif: class {}
                }
            });

            expect(capturedDefineCallback).toBeDefined();

            const act = sandbox.activity;
            act.setupDependencies = jest.fn();
            act.domReady = jest.fn();
            act.doContextMenus = jest.fn();
            act.doPluginsAndPaletteCols = jest.fn();

            const mockDoc = { ready: true };
            const mockExporters = { printBlockPNG: jest.fn() };

            capturedDefineCallback(mockDoc, mockExporters);

            expect(act.setupDependencies).toHaveBeenCalledTimes(1);
            expect(act.domReady).toHaveBeenCalledWith(mockDoc);
            expect(act.doContextMenus).toHaveBeenCalledTimes(1);
            expect(act.doPluginsAndPaletteCols).toHaveBeenCalledTimes(1);
        });

        it("uses waitForReadiness for Firefox when globals are not immediately ready", () => {
            let capturedDefineCallback = null;
            const mockDefine = (deps, cb) => {
                capturedDefineCallback = cb;
            };
            const waitForReadinessMock = jest.fn();

            const sandbox = loadActivitySandbox({
                overrides: {
                    define: mockDefine,
                    jQuery: {
                        browser: {
                            mozilla: true
                        }
                    },
                    waitForReadiness: waitForReadinessMock
                    // globals like createDefaultStack are undefined to trigger the else branch
                }
            });

            const act = sandbox.activity;
            act.setupDependencies = jest.fn();
            act.domReady = jest.fn();
            act.doContextMenus = jest.fn();
            act.doPluginsAndPaletteCols = jest.fn();

            const mockDoc = { mozillaDoc: true };
            capturedDefineCallback(mockDoc, {});

            expect(waitForReadinessMock).toHaveBeenCalledWith(
                expect.any(Function),
                expect.objectContaining({
                    maxWait: 10000,
                    minWait: 500,
                    checkInterval: 100
                })
            );

            // Execute the callback passed to waitForReadiness
            const onReadyCb = waitForReadinessMock.mock.calls[0][0];
            onReadyCb();

            expect(act.setupDependencies).toHaveBeenCalledTimes(1);
            expect(act.domReady).toHaveBeenCalledWith(mockDoc);
            expect(act.doContextMenus).toHaveBeenCalledTimes(1);
            expect(act.doPluginsAndPaletteCols).toHaveBeenCalledTimes(1);
        });

        it("schedules setTimeout retry when globals are not ready in non-Firefox environment", () => {
            jest.useFakeTimers();
            try {
                let capturedDefineCallback = null;
                const mockDefine = (deps, cb) => {
                    capturedDefineCallback = cb;
                };

                const sandbox = loadActivitySandbox({
                    overrides: {
                        define: mockDefine,
                        jQuery: {
                            browser: {
                                mozilla: false
                            }
                        }
                    }
                });

                const act = sandbox.activity;
                act.setupDependencies = jest.fn();
                act.domReady = jest.fn();
                act.doContextMenus = jest.fn();
                act.doPluginsAndPaletteCols = jest.fn();

                const mockDoc = { retryDoc: true };
                capturedDefineCallback(mockDoc, {});

                expect(act.setupDependencies).not.toHaveBeenCalled();

                // Supply the missing globals before timer expires
                sandbox.createDefaultStack = jest.fn();
                sandbox.createjs = {};
                sandbox.Tone = {};
                sandbox.GIFAnimator = class {};
                sandbox.SuperGif = class {};

                jest.advanceTimersByTime(50);

                expect(act.setupDependencies).toHaveBeenCalledTimes(1);
                expect(act.domReady).toHaveBeenCalledWith(mockDoc);
            } finally {
                jest.useRealTimers();
            }
        });
    });

    describe("Constructor Fallbacks, Error Handling & Controller Wiring (Lines 331–509)", () => {
        it("handles missing or throwing localStorage gracefully in constructor", () => {
            const sandbox = loadActivitySandbox({
                overrides: {
                    localStorage: {
                        getItem: () => {
                            throw new Error("SecurityError: Access is denied");
                        }
                    }
                }
            });
            const act = new sandbox.Activity();
            expect(act.storage).toBeDefined();
            expect(act.beginnerMode).toBe(true);
            expect(act.KeySignatureEnv).toEqual(["C", "major", false]);
        });

        it("initializes gifAnimator when GIFAnimator is defined and null when undefined", () => {
            const mockGIFInstance = { initialized: true };
            const MockGIFAnimator = jest.fn(() => mockGIFInstance);

            // Case 1: GIFAnimator exists
            const sandbox1 = loadActivitySandbox({
                overrides: {
                    GIFAnimator: MockGIFAnimator
                }
            });
            const act1 = new sandbox1.Activity();
            expect(act1.gifAnimator).toBe(mockGIFInstance);

            // Case 2: GIFAnimator is undefined
            const sandbox2 = loadActivitySandbox({
                overrides: {
                    GIFAnimator: undefined
                }
            });
            const act2 = new sandbox2.Activity();
            expect(act2.gifAnimator).toBeNull();
        });

        it("catches errors in loadThemePreference and captures through ErrorHandler", () => {
            const throwingThemeStorage = {
                get themePreference() {
                    throw new Error("Corrupted theme preference");
                }
            };
            const sandbox = loadActivitySandbox({
                overrides: {
                    localStorage: throwingThemeStorage
                }
            });
            new sandbox.Activity();
            expect(sandbox.ErrorHandler.capture).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Corrupted theme preference" }),
                { operation: "loadThemePreference" }
            );
        });

        it("catches errors in loadBeginnerMode and recovers through ErrorHandler", () => {
            const throwingBeginnerStorage = {
                get beginnerMode() {
                    throw new Error("Corrupted beginnerMode");
                }
            };
            const sandbox = loadActivitySandbox({
                overrides: {
                    localStorage: throwingBeginnerStorage
                }
            });
            const act = new sandbox.Activity();
            expect(sandbox.ErrorHandler.recoverable).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Corrupted beginnerMode" }),
                { operation: "loadBeginnerMode" }
            );
            expect(act.beginnerMode).toBe(true);
        });

        it("catches errors in loadLanguagePreference and recovers through ErrorHandler", () => {
            const throwingLanguageStorage = {
                get languagePreference() {
                    throw new Error("Corrupted languagePreference");
                }
            };
            const sandbox = loadActivitySandbox({
                overrides: {
                    localStorage: throwingLanguageStorage
                }
            });
            new sandbox.Activity();
            expect(sandbox.ErrorHandler.recoverable).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Corrupted languagePreference" }),
                { operation: "loadLanguagePreference" }
            );
        });

        it("catches errors in loadKeySignatureEnv and recovers through ErrorHandler", () => {
            const throwingKeySigStorage = {
                get KeySignatureEnv() {
                    throw new Error("Corrupted KeySignatureEnv");
                }
            };
            const sandbox = loadActivitySandbox({
                overrides: {
                    localStorage: throwingKeySigStorage
                }
            });
            const act = new sandbox.Activity();
            expect(sandbox.ErrorHandler.recoverable).toHaveBeenCalledWith(
                expect.objectContaining({ message: "Corrupted KeySignatureEnv" }),
                { operation: "loadKeySignatureEnv" }
            );
            expect(act.KeySignatureEnv).toEqual(["C", "major", false]);
        });

        it("instantiates PluginDialog callbacks with proper Activity delegations", () => {
            let capturedPluginDialogConfig = null;
            class MockPluginDialog {
                constructor(config) {
                    capturedPluginDialogConfig = config;
                }
            }

            const sandbox = loadActivitySandbox({
                overrides: {
                    PluginDialog: MockPluginDialog
                }
            });

            const act = new sandbox.Activity();
            expect(capturedPluginDialogConfig).toBeDefined();

            // Test onLoadBuiltIn delegation
            act._loadBuiltInPlugin = jest.fn();
            capturedPluginDialogConfig.onLoadBuiltIn("test-plugin");
            expect(act._loadBuiltInPlugin).toHaveBeenCalledWith("test-plugin");

            // Test onDelete delegation
            act._deletePlugin = jest.fn();
            capturedPluginDialogConfig.onDelete("test-plugin");
            expect(act._deletePlugin).toHaveBeenCalledWith("test-plugin");

            // Test onFileSelected delegation
            act.handlePluginFileSelected = jest.fn();
            const dummyFile = { name: "test.js" };
            capturedPluginDialogConfig.onFileSelected(dummyFile);
            expect(act.handlePluginFileSelected).toHaveBeenCalledWith(dummyFile);

            // Test getLoadedPlugins delegation
            act.pluginObjs = {
                PALETTEPLUGINS: {
                    pluginA: {},
                    pluginB: {}
                }
            };
            expect(capturedPluginDialogConfig.getLoadedPlugins()).toEqual(["pluginA", "pluginB"]);

            // Test getActivePlugin delegation
            act.palettes = {
                activePalette: "pluginA",
                lastActivePalette: null
            };
            expect(capturedPluginDialogConfig.getActivePlugin()).toBe("pluginA");

            act.palettes.activePalette = null;
            act.palettes.lastActivePalette = "pluginB";
            expect(capturedPluginDialogConfig.getActivePlugin()).toBe("pluginB");

            act.palettes.lastActivePalette = "nonexistent";
            expect(capturedPluginDialogConfig.getActivePlugin()).toBeNull();
        });
    });

    describe("Performance Marks and Measures (Lines 3028–3068)", () => {
        it("records performance marks in __mbPerf.marks and calculates measures accurately", () => {
            const sandbox = loadActivitySandbox();
            const act = new sandbox.Activity();

            let time = 100.0;
            sandbox.window.__mbPerf = {
                enabled: true,
                marks: {},
                measures: {}
            };
            sandbox.performance = {
                now: () => time
            };

            act._perfMark("startLoad");
            expect(sandbox.window.__mbPerf.marks["startLoad"]).toBe(100.0);

            time = 245.567;
            act._perfMark("endLoad");
            expect(sandbox.window.__mbPerf.marks["endLoad"]).toBe(245.567);

            act._perfMeasure("loadDuration", "startLoad", "endLoad");
            expect(sandbox.window.__mbPerf.measures["loadDuration"]).toBe(145.57);
        });

        it("gracefully no-ops when performance tracking is disabled or marks are missing", () => {
            const sandbox = loadActivitySandbox();
            const act = new sandbox.Activity();

            // Disabled __mbPerf
            sandbox.window.__mbPerf = { enabled: false, marks: {}, measures: {} };
            expect(() => act._perfMark("test")).not.toThrow();
            expect(sandbox.window.__mbPerf.marks["test"]).toBeUndefined();

            // Missing marks for measure
            sandbox.window.__mbPerf.enabled = true;
            act._perfMeasure("unmeasured", "nonexistentA", "nonexistentB");
            expect(sandbox.window.__mbPerf.measures["unmeasured"]).toBeUndefined();
        });
    });

    describe("Managed Event Listeners Lifecycle (Lines 3070–3156)", () => {
        it("adds, removes, and cleans up managed listeners correctly with options comparison", () => {
            const sandbox = loadActivitySandbox();
            const act = new sandbox.Activity();

            const target = {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };
            const handler = jest.fn();

            const initialListenerCount = act._listeners.length;

            // Add listener
            act.addEventListener(target, "click", handler, { capture: true });
            expect(target.addEventListener).toHaveBeenCalledWith("click", handler, {
                capture: true
            });
            expect(act._listeners).toHaveLength(initialListenerCount + 1);

            // Removing with mismatched capture option does not remove
            act.removeEventListener(target, "click", handler, { capture: false });
            expect(act._listeners).toHaveLength(initialListenerCount + 1);

            // Removing with matching boolean / capture option removes it
            act.removeEventListener(target, "click", handler, true);
            expect(target.removeEventListener).toHaveBeenCalledWith("click", handler, true);
            expect(act._listeners).toHaveLength(initialListenerCount);

            // Add multiple listeners and cleanupEventListeners
            const stopIdleSpy = jest.fn();
            act._stopIdleWatcher = stopIdleSpy;
            act.addEventListener(target, "keydown", handler);
            act.addEventListener(target, "keyup", handler);
            expect(act._listeners).toHaveLength(initialListenerCount + 2);

            act.cleanupEventListeners();
            expect(act._listeners).toHaveLength(0);
            expect(target.removeEventListener).toHaveBeenCalledWith("keyup", handler, undefined);
            expect(target.removeEventListener).toHaveBeenCalledWith("keydown", handler, undefined);
            expect(stopIdleSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe("Global Bridges hidePrintText and hideErrorText (Lines 312–322)", () => {
        it("delegates hidePrintText and hideErrorText to globalActivity", () => {
            const sandbox = loadActivitySandbox();
            const act = sandbox.activity;

            const printDiv = document.createElement("div");
            printDiv.id = "printText";
            printDiv.classList.add("show");
            document.body.appendChild(printDiv);
            act.printText = printDiv;

            const errorDiv = document.createElement("div");
            errorDiv.id = "errorText";
            errorDiv.style.display = "block";
            document.body.appendChild(errorDiv);
            act.errorText = errorDiv;

            sandbox.window.hidePrintText();
            expect(printDiv.classList.contains("show")).toBe(false);

            sandbox.window.hideErrorText();
            expect(errorDiv.style.display).toBe("none");
        });
    });

    describe("SaveLocally & Session Lifecycle (Lines 2570–2648 & 3159–3169)", () => {
        it("calls saveLocally method on Activity class and handles recoverable exceptions", () => {
            const recoverableMock = jest.fn();
            const mockStorage = {
                setItem: jest.fn((k, v) => {
                    mockStorage[k] = v;
                })
            };
            const sandbox = loadActivitySandbox({
                overrides: {
                    localStorage: mockStorage,
                    ErrorHandler: {
                        recoverable: recoverableMock,
                        capture: jest.fn()
                    }
                }
            });
            const { Activity } = sandbox;
            const act = new Activity();
            act.beginnerMode = false;
            act.themePreference = "dark";

            Activity.prototype.saveLocally.call(act);
            expect(mockStorage.setItem).toHaveBeenCalledWith("beginnerMode", "false");
            expect(mockStorage.setItem).toHaveBeenCalledWith("themePreference", "dark");

            mockStorage.setItem.mockImplementationOnce(() => {
                throw new Error("QuotaExceededError");
            });
            expect(() => Activity.prototype.saveLocally.call(act)).not.toThrow();
            expect(recoverableMock).toHaveBeenCalledWith(
                expect.any(Error),
                expect.objectContaining({ operation: "saveLocalStorage" })
            );
        });

        it("saveSessionAsync coordinates saving to sessionStorageManager with project timestamp", async () => {
            const mockStorage = {
                currentProject: "TestSong",
                SESSION_TIMESTAMPTestSong: "12345"
            };
            const mockSessionStorageManager = {
                saveSession: jest.fn().mockResolvedValue()
            };
            const sandbox = loadActivitySandbox({
                overrides: {
                    localStorage: mockStorage
                }
            });
            const act = sandbox.activity;
            act.sessionStorageManager = mockSessionStorageManager;
            act.prepareExport = jest.fn(() => '{"blocks":[]}');
            act.storage = mockStorage;

            await act.saveSessionAsync();

            expect(mockSessionStorageManager.saveSession).toHaveBeenCalledWith(
                "SESSIONTestSong",
                '{"blocks":[]}',
                12345
            );
        });
    });
});
