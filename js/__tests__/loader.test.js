/**
 * @jest-environment jsdom
 */

describe('loader.js', () => {
    let mockI18next;

    beforeEach(() => {
        jest.resetModules();

        // -------------------------------
        // RequireJS mock
        // -------------------------------
        window.requirejs = jest.fn((deps, callback, errCallback) => {
            if (deps && deps.includes("i18next")) {
                if (callback) callback(mockI18next, {});
            } else if (deps && deps.includes("highlight")) {
                if (callback) callback({});
            } else if (callback) {
                callback();
            }
        });

        window.requirejs.config = jest.fn();
        window.requirejs.defined = jest.fn(() => false);

        // -------------------------------
        // i18next mock
        // -------------------------------
        mockI18next = {
            use: jest.fn().mockReturnThis(),

            init: jest.fn((config, cb) => {
                mockI18next.isInitialized = true;
                cb(null);
            }),

            t: jest.fn((key) => `translated_${key}`),

            changeLanguage: jest.fn((lng, cb) => cb(null)),

            on: jest.fn(),
            language: 'en',
            isInitialized: false
        };

        // -------------------------------
        // DOM setup
        // -------------------------------
        document.body.innerHTML = `
            <div data-i18n="test_title">Original Title</div>
            <button data-i18n="test_button">Original Button</button>
        `;

        // -------------------------------
        // Silence console
        // -------------------------------
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // -------------------------------
    // TESTS
    // -------------------------------

    test('should configure requirejs with correct paths and baseUrl', () => {
        require('../loader.js');
        expect(window.requirejs.config).toHaveBeenCalledWith(expect.objectContaining({
            baseUrl: "./",
            paths: expect.any(Object)
        }));
    });

    test('should translate DOM elements when main() runs', async () => {
        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));

        const title = document.querySelector('[data-i18n="test_title"]');
        const button = document.querySelector('[data-i18n="test_button"]');

        expect(title.textContent).toBe('translated_test_title');
        expect(button.textContent).toBe('translated_test_button');
    });

    test('should set materialize globals and flags', async () => {
        window.M = { AutoInit: jest.fn() };
        delete window.Materialize;

        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(window.M).toBeDefined();
        expect(window.Materialize).toBe(window.M);
        expect(window._THIS_IS_MUSIC_BLOCKS_).toBe(true);
        expect(window._THIS_IS_TURTLE_BLOCKS_).toBe(false);
    });

    test('should call requirejs.defined for preloaded scripts', async () => {
        window.createjs = {};

        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(window.requirejs.defined).toHaveBeenCalledWith("easeljs.min");
        expect(window.requirejs.defined).toHaveBeenCalledWith("tweenjs.min");
    });

    test('should attach DOMContentLoaded listener if document not ready', async () => {
        document.readyState = "loading";

        const spy = jest.spyOn(document, 'addEventListener');

        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(spy).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));
    });

    test('should log an error if i18next init fails', async () => {
        mockI18next.init = jest.fn((config, cb) => cb('Init Error'));

        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(console.error).toHaveBeenCalledWith("i18next init failed:", 'Init Error');
    });

    test('should log an error if changeLanguage fails', async () => {
        mockI18next.changeLanguage = jest.fn((lng, cb) => cb('Change Error'));

        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(console.error).toHaveBeenCalledWith("Error changing language:", 'Change Error');
    });

    test('should listen for languageChanged events', async () => {
        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockI18next.on).toHaveBeenCalledWith("languageChanged", expect.any(Function));
    });

    test('should warn when highlight fails to load', async () => {
        window.requirejs = jest.fn((deps, callback, errCallback) => {
            if (deps.includes("i18next")) {
                callback(mockI18next, {});
            } else if (deps.includes("highlight")) {
                if (errCallback) errCallback("highlight error");
            } else if (callback) {
                callback();
            }
        });

        require('../loader.js');
        await new Promise(r => setTimeout(r, 0));

        expect(console.warn).toHaveBeenCalledWith(
            "Highlight.js failed to load, moving on...",
            "highlight error"
        );
    });

    test('should handle core bootstrap failure', async () => {
        window.requirejs = jest.fn((deps, callback, errCallback) => {
            if (deps.includes("i18next")) {
                callback(mockI18next, {});
            } else if (deps.includes("preloadjs.min")) {
                if (errCallback) errCallback("core error");
            } else if (callback) {
                callback();
            }
        });

        require('../loader.js');
        await new Promise(r => setTimeout(r, 0));

        expect(console.error).toHaveBeenCalledWith("Core bootstrap failed:", "core error");
    });

    test('should log fatal error and alert if createjs missing during bootstrap', async () => {
        delete window.createjs;

        jest.useFakeTimers();
        window.alert = jest.fn();

        window.requirejs = jest.fn((deps, callback) => {
            if (deps.includes("i18next")) {
                callback(mockI18next, {});
            } else if (callback) {
                callback();
            }
        });

        require('../loader.js');
        jest.runAllTimers();

        expect(console.error).toHaveBeenCalledWith(
            "FATAL: createjs (EaselJS/TweenJS) not found. Cannot proceed."
        );

        expect(window.alert).toHaveBeenCalledWith(
            "Failed to load EaselJS. Please refresh the page."
        );

        jest.useRealTimers();
    });
});