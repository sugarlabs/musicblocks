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
    let capturedI18nCallback;
    let capturedConfig;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Save original requirejs
        originalRequirejs = global.requirejs;

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
                capturedI18nCallback = callback;
                if (callback) {
                    callback(mockI18next, mockI18nextHttpBackend);
                }
            }
        });

        global.requirejs.config = jest.fn(config => {
            capturedConfig = config;
        });

        // Mock document methods
        document.querySelectorAll = jest.fn(() => []);
        document.addEventListener = jest.fn();

        // Set document ready state
        Object.defineProperty(document, "readyState", {
            value: "complete",
            writable: true,
            configurable: true
        });
    });

    afterEach(() => {
        global.requirejs = originalRequirejs;
        delete global.window.i18next;
        jest.resetModules();
    });

    describe("RequireJS Configuration", () => {
        beforeEach(async () => {
            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));
        });

        it("should call requirejs.config", () => {
            expect(global.requirejs.config).toHaveBeenCalled();
        });

        it("should set baseUrl to lib", () => {
            expect(capturedConfig.baseUrl).toBe("lib");
        });

        it("should configure easel shim with createjs export", () => {
            expect(capturedConfig.shim).toEqual({
                easel: {
                    exports: "createjs"
                }
            });
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
            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));
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

    describe("Language Change", () => {
        beforeEach(async () => {
            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));
        });

        it("should change language to English", () => {
            expect(mockI18next.changeLanguage).toHaveBeenCalledWith("en", expect.any(Function));
        });

        it("should register languageChanged event listener", () => {
            expect(mockI18next.on).toHaveBeenCalledWith("languageChanged", expect.any(Function));
        });
    });

    describe("Content Update", () => {
        it("should query elements with data-i18n attribute", async () => {
            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));
            expect(document.querySelectorAll).toHaveBeenCalledWith("[data-i18n]");
        });

        it("should translate elements with data-i18n attribute", async () => {
            const mockElement = {
                getAttribute: jest.fn(() => "welcome.message"),
                textContent: ""
            };
            document.querySelectorAll.mockReturnValue([mockElement]);

            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));

            expect(mockI18next.t).toHaveBeenCalledWith("welcome.message");
            expect(mockElement.textContent).toBe("translated_welcome.message");
        });

        it("should handle multiple elements", async () => {
            const mockElements = [
                { getAttribute: jest.fn(() => "key1"), textContent: "" },
                { getAttribute: jest.fn(() => "key2"), textContent: "" }
            ];
            document.querySelectorAll.mockReturnValue(mockElements);

            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));

            expect(mockElements[0].textContent).toBe("translated_key1");
            expect(mockElements[1].textContent).toBe("translated_key2");
        });
    });

    describe("DOMContentLoaded Handling", () => {
        it("should add DOMContentLoaded listener when document is loading", async () => {
            Object.defineProperty(document, "readyState", {
                value: "loading",
                writable: true,
                configurable: true
            });

            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));

            expect(document.addEventListener).toHaveBeenCalledWith(
                "DOMContentLoaded",
                expect.any(Function)
            );
        });

        it("should not add listener when document is complete", async () => {
            Object.defineProperty(document, "readyState", {
                value: "complete",
                writable: true,
                configurable: true
            });

            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));

            expect(document.addEventListener).not.toHaveBeenCalledWith(
                "DOMContentLoaded",
                expect.any(Function)
            );
        });
    });

    describe("Error Handling", () => {
        it("should log error when i18next init fails", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();

            mockI18next.init = jest.fn((config, callback) => {
                callback(new Error("Init failed"));
            });

            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));

            expect(consoleSpy).toHaveBeenCalledWith("i18next init failed:", expect.any(Error));
            consoleSpy.mockRestore();
        });

        it("should log error when language change fails", async () => {
            const consoleSpy = jest.spyOn(console, "error").mockImplementation();

            mockI18next.changeLanguage = jest.fn((lang, callback) => {
                callback(new Error("Language change failed"));
            });

            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));

            expect(consoleSpy).toHaveBeenCalledWith("Error changing language:", expect.any(Error));
            consoleSpy.mockRestore();
        });
    });

    describe("Application Loading", () => {
        it("should load utils and activity modules after i18n is ready", async () => {
            require("../loader");
            await new Promise(resolve => process.nextTick(resolve));

            expect(global.requirejs).toHaveBeenCalledWith(["utils/utils", "activity/activity"]);
        });
    });
});
