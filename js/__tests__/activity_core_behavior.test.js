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
});
