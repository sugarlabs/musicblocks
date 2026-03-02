/**
 * @jest-environment jsdom
 */

describe('loader.js', () => {
    let mockI18next;

    beforeEach(() => {
        // Clear the module cache so that `require('../loader.js')`
        // reloads the module on every test.
        jest.resetModules();

        // --------------------------------------------------------------------
        // 1. Default RequireJS stub – tests that need different behaviour
        //    override `window.requirejs` again inside the test body.
        // --------------------------------------------------------------------
        window.requirejs = jest.fn((deps, callback, errCallback) => {
            if (deps && deps.includes("i18next")) {
                // pretend requirejs loaded i18next and invoke the
                // factory with our mock object and an empty config
                if (callback) callback(mockI18next, {});
            } else if (deps && deps.includes("highlight")) {
                // highlight.js is not essential; return a dummy object
                if (callback) callback({});
            } else if (callback) {
                // any other dependency just calls the callback with no args
                callback();
            }
        });
        window.requirejs.config = jest.fn();
        window.requirejs.defined = jest.fn(() => false);

        // --------------------------------------------------------------------
        // 2. Mock i18next with all of the methods accessed by loader.js.
        //    We keep a flag so that tests can observe when init was called.
        // --------------------------------------------------------------------
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

        // --------------------------------------------------------------------
        // 3. A small DOM fragment with `data-i18n` attributes so that the
        //    translation logic can be exercised.
        // --------------------------------------------------------------------
        document.body.innerHTML = `
            <div data-i18n="test_title">Original Title</div>
            <button data-i18n="test_button">Original Button</button>
        `;

        // --------------------------------------------------------------------
        // 4. Silence console.error / warn during tests but allow us to spy on
        //    the calls.
        // --------------------------------------------------------------------
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        // restore any mocked globals to avoid cross-test pollution
        jest.restoreAllMocks();
    });

    test('should configure requirejs with correct paths and baseUrl', () => {
        require('../loader.js');
        expect(window.requirejs.config).toHaveBeenCalledWith(expect.objectContaining({
            baseUrl: "./",
            paths: expect.any(Object)
        }));
    });

    test('should translate DOM elements when main() runs', async () => {
        // load the loader module and wait for the asynchronous work to finish
        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));
        const title = document.querySelector('[data-i18n="test_title"]');
        const button = document.querySelector('[data-i18n="test_button"]');
        expect(title.textContent).toBe('translated_test_title');
        expect(button.textContent).toBe('translated_test_button');
    });

    test('should set materialize globals and flags', async () => {
        // simulate Materialize being available as `M` only
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
        // createjs defined before loader runs
        window.createjs = {};
        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(window.requirejs.defined).toHaveBeenCalledWith("easeljs.min");
        expect(window.requirejs.defined).toHaveBeenCalledWith("tweenjs.min");
    });

    test('should attach DOMContentLoaded listener if document not ready', async () => {
        document.readyState = "loading";
        const addListenerSpy = jest.spyOn(document, 'addEventListener');
        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(addListenerSpy).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));
    });

    test('should log an error if i18next init fails (for 100% coverage)', async () => {
        mockI18next.init = jest.fn((config, cb) => cb('Init Error'));
        require('../loader.js');
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(console.error).toHaveBeenCalledWith("i18next init failed:", 'Init Error');
    });

    test('should log an error if changeLanguage fails (for 100% coverage)', async () => {
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
        // override the requirejs stub to simulate a loading error for highlight
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
        window.requirejs = jest.fn((deps, callback, errCallback) => {
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
        expect(window.alert).toHaveBeenCalledWith("Failed to load EaselJS. Please refresh the page.");
        jest.useRealTimers();
    });
});