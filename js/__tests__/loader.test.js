
const fs = require("fs");
const path = require("path");

// Mock dependencies
const mockI18next = {
    use: jest.fn().mockReturnThis(),
    init: jest.fn(),
    on: jest.fn(),
    t: jest.fn((key) => "translated_" + key),
    changeLanguage: jest.fn()
};

const mockHttpBackend = jest.fn();

// Mock requirejs
global.requirejs = jest.fn((deps, callback) => {
    callback(mockI18next, mockHttpBackend);
});
global.requirejs.config = jest.fn();

describe("loader.js coverage", () => {
    let consoleLogSpy;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        document.body.innerHTML =
            '<div data-i18n="title">Title</div>' +
            '<div data-i18n="label">Label</div>' +
            '<div id="loading-media"></div>';

        consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => { });
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });

        // Mock localStorage
        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                languagePreference: "en"
            },
            writable: true
        });

        // Mock navigator
        Object.defineProperty(window, "navigator", {
            value: {
                language: "en-US"
            },
            writable: true
        });

        // Setup i18next mock implementation for init
        mockI18next.init.mockImplementation((config, callback) => {
            if (config.lng === "init_error") {
                callback("Init Failed", null);
            } else {
                callback(null, (key) => key);
            }
        });
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        jest.resetModules();
    });

    async function loadScript(options = {}) {
        if (options.lang) {
            window.localStorage.getItem.mockReturnValue(options.lang);
        } else if (options.initError) {
            window.localStorage.getItem.mockReturnValue("init_error");
        } else {
            window.localStorage.getItem.mockReturnValue(null);
        }

        require("../loader.js");

        // Wait for multiple ticks to allow async main() to progress
        await new Promise(resolve => process.nextTick(resolve));
        await new Promise(resolve => process.nextTick(resolve));
]
describe("loader.js coverage", () => {
    let mockRequireJS;
    let mockRequireJSConfig;
    let mockI18next;
    let mockI18nextHttpBackend;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();

        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        document.body.innerHTML = `
            <div data-i18n="title">Original Title</div>
            <span data-i18n="label">Original Label</span>
        `;

        mockI18next = {
            use: jest.fn().mockReturnThis(),
            init: jest.fn(),
            changeLanguage: jest.fn(),
            t: jest.fn(key => `TRANSLATED_${key}`),
            on: jest.fn()
        };

        mockI18nextHttpBackend = {};

        mockRequireJSConfig = jest.fn();
        mockRequireJS = jest.fn();
        mockRequireJS.config = mockRequireJSConfig;

        global.requirejs = mockRequireJS;
        global.window = document.defaultView;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    const loadScript = async ({ initError = false, langError = false } = {}) => {
        mockRequireJS.mockImplementation((deps, callback) => {
            if (deps[0] === "i18next") {
                mockI18next.init.mockImplementation((config, cb) => {
                    if (initError) {
                        cb("Init Failed");
                    } else {
                        cb(null);
                    }
                });

                mockI18next.changeLanguage.mockImplementation((lang, cb) => {
                    if (langError) {
                        cb("Lang Change Failed");
                    } else {
                        cb(null);
                    }
                });

                return callback(mockI18next, mockI18nextHttpBackend);
            }
            return null;
        });

        require("../loader.js");

        await new Promise(resolve => process.nextTick(resolve));
    };

    test("Configures requirejs correctly", async () => {
        await loadScript();

        expect(global.requirejs.config).toHaveBeenCalledWith(expect.objectContaining({
            baseUrl: "lib",
            paths: expect.any(Object)
        }));
    });

    test("Full success path: initializes i18n, updates DOM, and loads app", async () => {
        await loadScript();

        expect(mockRequireJSConfig).toHaveBeenCalledWith(
            expect.objectContaining({
                baseUrl: "lib",
                paths: expect.any(Object),
                shim: expect.any(Object)
            })
        );
    });

    test("Full success path: initializes i18n, updates DOM, and loads app", async () => {
        Object.defineProperty(document, "readyState", {
            value: "complete",
            configurable: true
        });

        await loadScript();

        expect(mockI18next.use).toHaveBeenCalledWith(mockI18nextHttpBackend);

        expect(mockI18next.init).toHaveBeenCalledWith(
            expect.objectContaining({ lng: "en" }),
            expect.any(Function)
        );
        expect(window.i18next).toBe(mockI18next);


        const title = document.querySelector('[data-i18n="title"]');
        const label = document.querySelector('[data-i18n="label"]');

        expect(title.textContent).toBe("translated_title");
        expect(label.textContent).toBe("translated_label");

        expect(global.requirejs).toHaveBeenCalledWith(
            ["utils/utils", "activity/activity"]
        );

        expect(mockI18next.changeLanguage).toHaveBeenCalledWith("en", expect.any(Function));

        const title = document.querySelector('[data-i18n="title"]');
        const label = document.querySelector('[data-i18n="label"]');

        expect(mockI18next.t).toHaveBeenCalledWith("title");
        expect(mockI18next.t).toHaveBeenCalledWith("label");
        expect(title.textContent).toBe("TRANSLATED_title");
        expect(label.textContent).toBe("TRANSLATED_label");

        expect(mockI18next.on).toHaveBeenCalledWith("languageChanged", expect.any(Function));

        expect(mockRequireJS).toHaveBeenCalledWith(["utils/utils", "activity/activity"]);

    });

    test("Handles i18next initialization error", async () => {
        await loadScript({ initError: true });

        expect(consoleErrorSpy).toHaveBeenCalledWith("i18next init failed:", "Init Failed");
        expect(window.i18next).toBe(mockI18next);
    });

    test("Handles changeLanguage error", async () => {

        // This test might be obsolete if changeLanguage is not called on init, 
        // but we can keep it if we test the listener or OnClick.
        // For now, let's skip it or mock changeLanguage call if we add it back.

        await loadScript({ langError: true });

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error changing language:",
            "Lang Change Failed"
        );

    });

    test("Handles DOMContentLoaded when document is loading", async () => {
        Object.defineProperty(document, "readyState", {
            value: "loading",
            configurable: true
        });

        const addEventListenerSpy = jest.spyOn(document, "addEventListener");

        await loadScript();

        expect(addEventListenerSpy).toHaveBeenCalledWith("DOMContentLoaded", expect.any(Function));

        const eventHandler = addEventListenerSpy.mock.calls.find(
            call => call[0] === "DOMContentLoaded"
        )[1];


        // Manually trigger the handler
        eventHandler();

        const title = document.querySelector('[data-i18n="title"]');
        expect(title.textContent).toBe("translated_title");

        mockI18next.t.mockClear();
        eventHandler();
        expect(mockI18next.t).toHaveBeenCalled();

    });

    test("Triggering languageChanged event updates content", async () => {
        await loadScript();


        // Reset content to verify update
        document.querySelector('[data-i18n="title"]').textContent = "Old Title";

        // Find the on('languageChanged') callback
        const onCallback = mockI18next.on.mock.calls.find(call => call[0] === 'languageChanged')[1];
        onCallback();

        const title = document.querySelector('[data-i18n="title"]');
        expect(title.textContent).toBe("translated_title");

        const onCall = mockI18next.on.mock.calls.find(call => call[0] === "languageChanged");
        const onHandler = onCall[1];

        mockI18next.t.mockClear();

        onHandler();

        expect(mockI18next.t).toHaveBeenCalled();

    });
});
