/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Ashutosh Kumar
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

/**
 * Tests for loader.js module
 *
 * The loader.js file is an entry point that uses RequireJS to load the application.
 * Since it executes immediately upon require and depends on external modules (i18next),
 * we test its configuration and behavior through mocks.
 */

describe("Loader Module", () => {
    let originalRequirejs;
    let mockI18next;
    let mockI18nextHttpBackend;
    let capturedConfig;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Save original requirejs
        originalRequirejs = global.requirejs;

        // Mock console.error
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        // Mock i18next
        mockI18next = {
            use: jest.fn().mockReturnThis(),
            init: jest.fn((config, callback) => {
                if (callback) callback(null);
            }),
            changeLanguage: jest.fn((lang, callback) => {
                if (callback) callback(null);
            }),
            on: jest.fn(),
            t: jest.fn(key => `translated_${key}`)
        };

        mockI18nextHttpBackend = {};

        // Mock requirejs
        global.requirejs = jest.fn((deps, callback) => {
            if (Array.isArray(deps) && deps.includes("i18next")) {
                if (callback) {
                    callback(mockI18next, mockI18nextHttpBackend);
                }
            }
        });

        global.requirejs.config = jest.fn(config => {
            capturedConfig = config;
        });

        // Set document ready state
        Object.defineProperty(document, "readyState", {
            value: "complete",
            writable: true,
            configurable: true
        });

        // Setup DOM for translation tests
        document.body.innerHTML = `
            <div data-i18n="title">Original Title</div>
            <span data-i18n="label">Original Label</span>
        `;
    });

    afterEach(() => {
        global.requirejs = originalRequirejs;
        if (global.window) {
            delete global.window.i18next;
        }
        consoleErrorSpy.mockRestore();
        jest.resetModules();
    });

    const loadLoader = async () => {
        require("../loader");
        await new Promise(resolve => process.nextTick(resolve));
    };

    describe("RequireJS Configuration", () => {
        beforeEach(async () => {
            await loadLoader();
        });

        it("should call requirejs.config", () => {
            expect(global.requirejs.config).toHaveBeenCalled();
        });

        it("should set baseUrl to lib", () => {
            expect(capturedConfig.baseUrl).toBe("lib");
        });

        it("should configure easel shim with createjs export", () => {
            expect(capturedConfig.shim).toEqual(
                expect.objectContaining({
                    easel: {
                        exports: "createjs"
                    }
                })
            );
        });

        it("should configure utils path", () => {
            expect(capturedConfig.paths.utils).toBe("../js/utils");
        });

        it("should configure widgets path", () => {
            expect(capturedConfig.paths.widgets).toBe("../js/widgets");
        });

        it("should configure activity path", () => {
            expect(capturedConfig.paths.activity).toBe("../js");
        });

        it("should configure easel path", () => {
            expect(capturedConfig.paths.easel).toBe("../lib/easeljs");
        });

        it("should configure samples path", () => {
            expect(capturedConfig.paths.samples).toBe("../sounds/samples");
        });

        it("should configure planet path", () => {
            expect(capturedConfig.paths.planet).toBe("../js/planet");
        });

        it("should configure tonejsMidi path", () => {
            expect(capturedConfig.paths.tonejsMidi).toBe("../node_modules/@tonejs/midi/dist/Midi");
        });

        it("should configure i18next with CDN fallback", () => {
            expect(capturedConfig.paths.i18next).toEqual([
                "../lib/i18next.min",
                "https://cdn.jsdelivr.net/npm/i18next@23.11.5/dist/umd/i18next.min"
            ]);
        });

        it("should configure i18nextHttpBackend with CDN fallback", () => {
            expect(capturedConfig.paths.i18nextHttpBackend).toEqual([
                "../lib/i18nextHttpBackend.min",
                "https://cdn.jsdelivr.net/npm/i18next-http-backend@2.5.1/i18nextHttpBackend.min"
            ]);
        });

        it("should initialize packages as empty array", () => {
            expect(capturedConfig.packages).toEqual([]);
        });
    });

    describe("i18next Setup", () => {
        beforeEach(async () => {
            await loadLoader();
        });

        it("should load i18next and i18nextHttpBackend modules", () => {
            expect(global.requirejs).toHaveBeenCalledWith(
                ["i18next", "i18nextHttpBackend"],
                expect.any(Function)
            );
        });

        it("should use i18nextHttpBackend plugin", () => {
            expect(mockI18next.use).toHaveBeenCalledWith(mockI18nextHttpBackend);
        });

        it("should initialize i18next with English language", () => {
            expect(mockI18next.init).toHaveBeenCalledWith(
                expect.objectContaining({
                    lng: "en",
                    fallbackLng: "en"
                }),
                expect.any(Function)
            );
        });

        it("should disable key separator", () => {
            const initConfig = mockI18next.init.mock.calls[0][0];
            expect(initConfig.keySeparator).toBe(false);
        });

        it("should disable namespace separator", () => {
            const initConfig = mockI18next.init.mock.calls[0][0];
            expect(initConfig.nsSeparator).toBe(false);
        });

        it("should disable interpolation escape", () => {
            const initConfig = mockI18next.init.mock.calls[0][0];
            expect(initConfig.interpolation.escapeValue).toBe(false);
        });

        it("should configure backend loadPath with cache busting", () => {
            const initConfig = mockI18next.init.mock.calls[0][0];
            expect(initConfig.backend.loadPath).toMatch(/locales\/\{\{lng\}\}\.json\?v=\d+/);
        });

        it("should set window.i18next after initialization", () => {
            expect(global.window.i18next).toBe(mockI18next);
        });
    });

    describe("Language and Content Updates", () => {
        it("should change language to English during init", async () => {
            await loadLoader();
            expect(mockI18next.changeLanguage).toHaveBeenCalledWith("en", expect.any(Function));
        });

        it("should register languageChanged event listener", async () => {
            await loadLoader();
            expect(mockI18next.on).toHaveBeenCalledWith("languageChanged", expect.any(Function));
        });

        it("should translate elements with data-i18n attribute", async () => {
            await loadLoader();

            const title = document.querySelector('[data-i18n="title"]');
            const label = document.querySelector('[data-i18n="label"]');

            expect(mockI18next.t).toHaveBeenCalledWith("title");
            expect(mockI18next.t).toHaveBeenCalledWith("label");
            expect(title.textContent).toBe("translated_title");
            expect(label.textContent).toBe("translated_label");
        });

        it("should update content when languageChanged event is triggered", async () => {
            await loadLoader();

            const onCall = mockI18next.on.mock.calls.find(call => call[0] === "languageChanged");
            const onHandler = onCall[1];

            // Change content manually to verify update
            document.querySelector('[data-i18n="title"]').textContent = "New Title";
            mockI18next.t.mockClear();

            onHandler();

            expect(mockI18next.t).toHaveBeenCalledWith("title");
            expect(document.querySelector('[data-i18n="title"]').textContent).toBe(
                "translated_title"
            );
        });
    });

    describe("DOMContentLoaded Handling", () => {
        it("should add DOMContentLoaded listener when document is loading", async () => {
            Object.defineProperty(document, "readyState", {
                value: "loading",
                writable: true,
                configurable: true
            });

            const addEventListenerSpy = jest.spyOn(document, "addEventListener");

            await loadLoader();

            expect(addEventListenerSpy).toHaveBeenCalledWith(
                "DOMContentLoaded",
                expect.any(Function)
            );

            // Verify handler works when triggered
            const handler = addEventListenerSpy.mock.calls.find(
                c => c[0] === "DOMContentLoaded"
            )[1];
            mockI18next.t.mockClear();
            handler();
            expect(mockI18next.t).toHaveBeenCalled();

            addEventListenerSpy.mockRestore();
        });

        it("should not add listener when document is already complete", async () => {
            Object.defineProperty(document, "readyState", {
                value: "complete",
                writable: true,
                configurable: true
            });

            const addEventListenerSpy = jest.spyOn(document, "addEventListener");

            await loadLoader();

            expect(addEventListenerSpy).not.toHaveBeenCalledWith(
                "DOMContentLoaded",
                expect.any(Function)
            );

            addEventListenerSpy.mockRestore();
        });
    });

    describe("Error Handling", () => {
        it("should log error when i18next init fails", async () => {
            mockI18next.init = jest.fn((config, callback) => {
                callback(new Error("Init failed"));
            });

            await loadLoader();

            expect(consoleErrorSpy).toHaveBeenCalledWith("i18next init failed:", expect.any(Error));
        });

        it("should log error when language change fails", async () => {
            mockI18next.changeLanguage = jest.fn((lang, callback) => {
                callback(new Error("Language change failed"));
            });

            await loadLoader();

            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "Error changing language:",
                expect.any(Error)
            );
        });
    });

    describe("Application Loading", () => {
        it("should load utils and activity modules after i18n is ready", async () => {
            await loadLoader();

            expect(global.requirejs).toHaveBeenCalledWith(["utils/utils", "activity/activity"]);
        });
    });
});
