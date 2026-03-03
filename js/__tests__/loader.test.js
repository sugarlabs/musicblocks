describe("loader.js coverage", () => {
    let mockRequireJS;
    let mockRequireJSConfig;
    let mockI18next;
    let mockI18nextHttpBackend;
    let consoleErrorSpy;

    beforeEach(() => {
        jest.resetModules();

        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {
            // Mock empty implementation
        });

        document.body.innerHTML = `
            <div data-i18n="title">Original Title</div>
            <span data-i18n="label">Original Label</span>
        `;

        mockI18next = {
            use: jest.fn().mockReturnThis(),
            init: jest.fn(),
            changeLanguage: jest.fn(),
            t: jest.fn(key => `TRANSLATED_${key}`),
            on: jest.fn(),
            isInitialized: false
        };

        mockI18nextHttpBackend = {};

        mockRequireJSConfig = jest.fn();
        mockRequireJS = jest.fn();
        mockRequireJS.config = mockRequireJSConfig;
        mockRequireJS.defined = jest.fn(() => false);

        global.requirejs = mockRequireJS;
        global.define = jest.fn();
        global.window = document.defaultView;
        global.window.createjs = {
            Stage: jest.fn(),
            Ticker: { framerate: 60, addEventListener: jest.fn() }
        };
    });

    afterEach(() => {
        delete global.define;
        jest.restoreAllMocks();
    });

    const loadScript = async ({ initError = false, langError = false } = {}) => {
        mockRequireJS.mockImplementation((deps, callback) => {
            if (deps.includes("highlight")) {
                if (callback) callback(null);
            } else if (deps.includes("i18next")) {
                mockI18next.init.mockImplementation((config, cb) => {
                    if (initError) {
                        cb("Init Failed");
                    } else {
                        mockI18next.isInitialized = true;
                        cb(null);
                    }
                });
                mockI18next.changeLanguage.mockImplementation((lang, cb) => {
                    if (langError) cb("Lang Change Failed");
                    else cb(null);
                });
                if (callback) {
                    callback(mockI18next, mockI18nextHttpBackend);
                }
            } else if (deps.includes("easeljs.min")) {
                // Phase 1 bootstrap
                // Mock globals expected by verification
                window.createDefaultStack = jest.fn();
                window.Logo = jest.fn();
                window.Blocks = jest.fn();
                window.Turtles = jest.fn();
                if (callback) callback();
            } else if (deps.includes("activity/activity")) {
                // Phase 2 bootstrap
                if (callback) callback();
            }
            return null;
        });

        require("../loader.js");

        await new Promise(resolve => setTimeout(resolve, 200)); // More time
    }; // Allow async main() to proceed

    test("Configures requirejs correctly", async () => {
        await loadScript();
        expect(mockRequireJSConfig).toHaveBeenCalledWith(
            expect.objectContaining({
                baseUrl: "./",
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
        expect(mockI18next.changeLanguage).toHaveBeenCalledWith("en", expect.any(Function));
        expect(window.i18next).toBe(mockI18next);

        const title = document.querySelector('[data-i18n="title"]');
        const label = document.querySelector('[data-i18n="label"]');

        expect(mockI18next.t).toHaveBeenCalledWith("title");
        expect(mockI18next.t).toHaveBeenCalledWith("label");
        expect(title.textContent).toBe("TRANSLATED_title");
        expect(label.textContent).toBe("TRANSLATED_label");

        expect(mockI18next.on).toHaveBeenCalledWith("languageChanged", expect.any(Function));

        // Verify Phase 2 was reached
        expect(mockRequireJS).toHaveBeenCalledWith(
            ["activity/activity"],
            expect.any(Function),
            expect.any(Function)
        );
    });

    test("Handles i18next initialization error", async () => {
        await loadScript({ initError: true });

        expect(consoleErrorSpy).toHaveBeenCalledWith("i18next init failed:", "Init Failed");
        expect(window.i18next).toBe(mockI18next);
    });

    test("Handles changeLanguage error", async () => {
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

        mockI18next.t.mockClear();
        eventHandler();
        expect(mockI18next.t).toHaveBeenCalled();
    });

    test("Triggering languageChanged event updates content", async () => {
        await loadScript();

        const onCall = mockI18next.on.mock.calls.find(call => call[0] === "languageChanged");
        const onHandler = onCall[1];

        mockI18next.t.mockClear();

        onHandler();

        expect(mockI18next.t).toHaveBeenCalled();
    });
});
