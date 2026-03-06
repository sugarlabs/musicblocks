// Copyright (c)  Music Blocks
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// ─── WHY THIS FILE IS STRUCTURED THIS WAY ────────────────────────────────────
//
// loader.js is a *script*, not a module: the moment Jest's require() evaluates
// it, the top-level requirejs([...], callback) fires synchronously.
// If a real (or uncontrolled) requirejs is on global at that point, it spawns
// its own describe/test calls mid-test — causing Jest's fatal
// "Tests cannot be nested" error seen in the previous run.
//
// Fix: install ONE Proxy-based stub on global.requirejs BEFORE any describe()
// block is entered. The proxy delegates to a mutable `_mockImpl` pointer that
// each test replaces via beforeEach. jest.resetModules() gives every test a
// fresh loader.js execution while the proxy itself stays stable on global.
// ─────────────────────────────────────────────────────────────────────────────

let _mockImpl = jest.fn();

// Proxy is installed at file-parse time, before any describe/test runs.
global.requirejs = new Proxy(
    function (...args) { return _mockImpl(...args); },
    {
        get(_, prop) {
            if (prop === "config")  return _mockImpl.config;
            if (prop === "defined") return _mockImpl.defined;
            return _mockImpl[prop];
        },
        set(_, prop, value) { _mockImpl[prop] = value; return true; }
    }
);
global.define = jest.fn();

// ─────────────────────────────────────────────────────────────────────────────

describe("loader.js coverage", () => {
    let mockI18next;
    let mockI18nextHttpBackend;
    let consoleErrorSpy;
    let consoleWarnSpy;
    let alertSpy;

    beforeEach(() => {
        jest.resetModules();

        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        consoleWarnSpy  = jest.spyOn(console, "warn").mockImplementation(() => {});
        alertSpy        = jest.spyOn(global, "alert").mockImplementation(() => {});

        document.body.innerHTML = `
            <div data-i18n="title">Original Title</div>
            <span data-i18n="label">Original Label</span>
        `;

        mockI18next = {
            use:            jest.fn().mockReturnThis(),
            init:           jest.fn(),
            changeLanguage: jest.fn(),
            t:              jest.fn(key => `TRANSLATED_${key}`),
            on:             jest.fn(),
            isInitialized:  false
        };
        mockI18nextHttpBackend = {};

        // Fresh mock for each test
        _mockImpl         = jest.fn();
        _mockImpl.config  = jest.fn();
        _mockImpl.defined = jest.fn(() => false);

        global.define = jest.fn();

        global.window = document.defaultView;
        global.window.createjs = {
            Stage:  jest.fn(),
            Ticker: { framerate: 60, addEventListener: jest.fn() }
        };

        Object.defineProperty(document, "readyState", {
            value: "complete",
            configurable: true
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        delete global.window.M;
        delete global.window.Materialize;
        delete global.window.hljs;
        delete global.window._THIS_IS_MUSIC_BLOCKS_;
        delete global.window._THIS_IS_TURTLE_BLOCKS_;
    });

    // ─── loadScript helper ────────────────────────────────────────────────────

    const loadScript = async ({
        initError            = false,
        langError            = false,
        hljsAvailable        = false,
        hljsFails            = false,
        i18nNotInitialized   = false,
        materializeAutoInit  = false,
        missingCreatejs      = false,
        coreBootstrapFails   = false,
        activityFails        = false,
        preloadedDefined     = false,
        readyState           = "complete",
        waitMs               = 400
    } = {}) => {
        Object.defineProperty(document, "readyState", {
            value: readyState,
            configurable: true
        });

        if (materializeAutoInit) {
            global.window.M = { AutoInit: jest.fn() };
        }
        if (missingCreatejs) {
            delete global.window.createjs;
        }

        _mockImpl.defined = jest.fn(() => preloadedDefined);

        _mockImpl.mockImplementation((deps, callback, errback) => {
            if (!Array.isArray(deps)) return null;

            // ── highlight.js optional load ─────────────────────────────────
            if (deps.includes("highlight")) {
                if (hljsFails) {
                    if (errback) errback(new Error("hljs load error"));
                } else {
                    const hljs = hljsAvailable ? { highlightAll: jest.fn() } : null;
                    if (callback) callback(hljs);
                }
                return null;
            }

            // ── i18next bootstrap ──────────────────────────────────────────
            if (deps.includes("i18next")) {
                mockI18next.init.mockImplementation((config, cb) => {
                    if (initError) {
                        cb("Init Failed");
                    } else {
                        if (!i18nNotInitialized) mockI18next.isInitialized = true;
                        cb(null);
                    }
                });
                mockI18next.changeLanguage.mockImplementation((lang, cb) => {
                    if (langError) cb("Lang Change Failed");
                    else           cb(null);
                });
                if (callback) callback(mockI18next, mockI18nextHttpBackend);
                return null;
            }

            // ── CORE_BOOTSTRAP_MODULES (many deps, includes easeljs.min) ──
            if (deps.includes("easeljs.min") && deps.length > 2) {
                if (coreBootstrapFails) {
                    if (errback) errback(new Error("Core bootstrap error"));
                } else {
                    window.createDefaultStack = jest.fn();
                    window.Logo               = jest.fn();
                    window.Blocks             = jest.fn();
                    window.Turtles            = jest.fn();
                    if (callback) callback();
                }
                return null;
            }

            // ── activity/activity phase-2 ──────────────────────────────────
            if (deps.includes("activity/activity")) {
                if (activityFails) {
                    if (errback) errback(new Error("Activity load error"));
                } else {
                    if (callback) callback();
                }
                return null;
            }

            if (callback) callback();
            return null;
        });

        require("../loader.js");
        await new Promise(resolve => setTimeout(resolve, waitMs));
    };

    // ─── requirejs.config ─────────────────────────────────────────────────────

    test("Configures requirejs correctly", async () => {
        await loadScript();
        expect(_mockImpl.config).toHaveBeenCalledWith(
            expect.objectContaining({
                baseUrl: "./",
                paths:   expect.any(Object),
                shim:    expect.any(Object)
            })
        );
    });

    test("requirejs paths config includes all expected module paths", async () => {
        await loadScript();
        const config = _mockImpl.config.mock.calls[0][0];
        expect(config.paths).toMatchObject({
            utils:    "js/utils",
            widgets:  "js/widgets",
            activity: "js",
            Tone:     "lib/Tone"
        });
    });

    test("requirejs shim config wires activity/activity with correct deps", async () => {
        await loadScript();
        const config = _mockImpl.config.mock.calls[0][0];
        expect(config.shim["activity/activity"].deps).toEqual(
            expect.arrayContaining([
                "utils/utils",
                "activity/logo",
                "activity/blocks",
                "activity/turtles"
            ])
        );
    });

    // ─── Global flags ─────────────────────────────────────────────────────────

    test("sets _THIS_IS_MUSIC_BLOCKS_ and _THIS_IS_TURTLE_BLOCKS_ globals", async () => {
        await loadScript();
        expect(window._THIS_IS_MUSIC_BLOCKS_).toBe(true);
        expect(window._THIS_IS_TURTLE_BLOCKS_).toBe(false);
    });

    // ─── Full success path ────────────────────────────────────────────────────

    test("Full success path: initializes i18n, updates DOM, and loads app", async () => {
        await loadScript();

        expect(mockI18next.use).toHaveBeenCalledWith(mockI18nextHttpBackend);
        expect(mockI18next.init).toHaveBeenCalledWith(
            expect.objectContaining({ lng: "en" }),
            expect.any(Function)
        );
        expect(window.i18next).toBe(mockI18next);
        expect(mockI18next.changeLanguage).toHaveBeenCalledWith("en", expect.any(Function));

        const title = document.querySelector('[data-i18n="title"]');
        const label = document.querySelector('[data-i18n="label"]');
        expect(mockI18next.t).toHaveBeenCalledWith("title");
        expect(mockI18next.t).toHaveBeenCalledWith("label");
        expect(title.textContent).toBe("TRANSLATED_title");
        expect(label.textContent).toBe("TRANSLATED_label");

        expect(mockI18next.on).toHaveBeenCalledWith("languageChanged", expect.any(Function));
        expect(_mockImpl).toHaveBeenCalledWith(
            ["activity/activity"],
            expect.any(Function),
            expect.any(Function)
        );
    });

    // ─── i18next init error ───────────────────────────────────────────────────

    test("Handles i18next initialization error", async () => {
        await loadScript({ initError: true });
        expect(consoleErrorSpy).toHaveBeenCalledWith("i18next init failed:", "Init Failed");
        expect(window.i18next).toBe(mockI18next);
    });

    test("assigns i18next to window even when init errors", async () => {
        await loadScript({ initError: true });
        expect(window.i18next).toBe(mockI18next);
    });

    // ─── changeLanguage error ─────────────────────────────────────────────────

    test("Handles changeLanguage error", async () => {
        await loadScript({ langError: true });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            "Error changing language:",
            "Lang Change Failed"
        );
    });

    // ─── DOMContentLoaded when document is still loading ─────────────────────

    test("Handles DOMContentLoaded when document is loading", async () => {
        const addEventListenerSpy = jest.spyOn(document, "addEventListener");

        await loadScript({ readyState: "loading" });

        expect(addEventListenerSpy).toHaveBeenCalledWith(
            "DOMContentLoaded",
            expect.any(Function)
        );

        const handler = addEventListenerSpy.mock.calls.find(
            c => c[0] === "DOMContentLoaded"
        )?.[1];

        expect(handler).toBeDefined();
        mockI18next.t.mockClear();
        handler();
        expect(mockI18next.t).toHaveBeenCalled();
    });

    // ─── languageChanged event ────────────────────────────────────────────────

    test("Triggering languageChanged event updates content", async () => {
        await loadScript();

        const onCall    = mockI18next.on.mock.calls.find(c => c[0] === "languageChanged");
        const onHandler = onCall?.[1];

        expect(onHandler).toBeDefined();
        mockI18next.t.mockClear();
        onHandler();
        expect(mockI18next.t).toHaveBeenCalled();
    });

    // ───  highlight.js ─────────────────────────────────────────

    test("highlight.js: registers on window and calls highlightAll when resolved", async () => {
        await loadScript({ hljsAvailable: true });
        expect(window.hljs).toBeDefined();
        expect(window.hljs.highlightAll).toHaveBeenCalled();
    });

    test("highlight.js: skips window registration when callback receives null", async () => {
        await loadScript({ hljsAvailable: false });
        expect(window.hljs).toBeUndefined();
    });

    test("logs a warning when highlight.js fails to load", async () => {
        await loadScript({ hljsFails: true });
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining("Highlight.js failed to load"),
            expect.any(Error)
        );
    });

    // ─── updateContent early-return ────────────────────────────

    test("updateContent does nothing when i18next.isInitialized is false", async () => {
        await loadScript({ i18nNotInitialized: true });
        const title = document.querySelector('[data-i18n="title"]');
        expect(title.textContent).toBe("Original Title");
    });

    // ───M.AutoInit ─────────────────────────────────────────────────

    test("calls M.AutoInit when Materialize is available", async () => {
        await loadScript({ materializeAutoInit: true });
        expect(global.window.M.AutoInit).toHaveBeenCalled();
    });

    test("aliases window.Materialize to M when M is defined", async () => {
        await loadScript({ materializeAutoInit: true });
        expect(global.window.Materialize).toBe(global.window.M);
    });

    // ─── waitForGlobals retry loop ─────────────────────────────

    test("waitForGlobals retries until createjs becomes available", async () => {
        delete global.window.createjs;
        let ticks = 0;
        const realSetTimeout = global.setTimeout;

        jest.spyOn(global, "setTimeout").mockImplementation((fn, delay) => {
            ticks++;
            if (ticks === 1) {
                // Restore createjs so the retry exits on the next iteration
                global.window.createjs = { Stage: jest.fn() };
            }
            return realSetTimeout(fn, 0);
        });

        await loadScript({ waitMs: 600 });

        // The fatal EaselJS alert must NOT have fired
        expect(alertSpy).not.toHaveBeenCalledWith(
            expect.stringContaining("Failed to load EaselJS")
        );
    });

    // ─── define() for PRELOADED_SCRIPTS ────────────────────────────

    test("calls define() for PRELOADED_SCRIPTS when requirejs.defined returns false", async () => {
        await loadScript({ preloadedDefined: false });
        expect(global.define).toHaveBeenCalledWith(
            expect.stringMatching(/easeljs\.min|tweenjs\.min/),
            [],
            expect.any(Function)
        );
    });

    test("skips define() for PRELOADED_SCRIPTS when requirejs.defined returns true", async () => {
        await loadScript({ preloadedDefined: true });
        expect(global.define).not.toHaveBeenCalled();
    });

    // ───  fatal — createjs missing after core bootstrap ─────────
    //
    // The verification block lives inside setTimeout(fn, 100) which is reached
    // after an async waitForGlobals() chain. Because waitForGlobals uses
    // `await new Promise(resolve => setTimeout(resolve, 100))`, simply calling
    // jest.runAllTimers() is not enough — the Promise microtask queue must also
    // be drained between timer ticks. jest.runAllTimersAsync() handles both.

    test("logs fatal error and alerts when createjs is missing after core bootstrap", async () => {
        // Install fake timers before require() so every setTimeout inside
        // loader.js is captured under Jest's fake clock.
        jest.useFakeTimers();

        delete global.window.createjs;
        _mockImpl.defined = jest.fn(() => false);

        _mockImpl.mockImplementation((deps, callback, errback) => {
            if (!Array.isArray(deps)) return null;
            if (deps.includes("highlight")) { if (callback) callback(null); return null; }
            if (deps.includes("i18next")) {
                mockI18next.init.mockImplementation((_, cb) => {
                    mockI18next.isInitialized = true;
                    cb(null);
                });
                mockI18next.changeLanguage.mockImplementation((_, cb) => cb(null));
                if (callback) callback(mockI18next, mockI18nextHttpBackend);
                return null;
            }
            // CORE_BOOTSTRAP_MODULES — createjs is intentionally absent.
            // Firing the outer callback queues the inner setTimeout(fn, 100)
            // into fake-timer land.
            if (deps.includes("easeljs.min") && deps.length > 2) {
                if (callback) callback();
                return null;
            }
            if (callback) callback();
            return null;
        });

        require("../loader.js");

        // runAllTimersAsync() advances the fake clock AND drains Promise
        // microtasks between each tick, so the full async chain completes:
        //   waitForGlobals retries → outer setTimeout → inner setTimeout(100ms)
        //   → verification block → console.error + alert
        await jest.runAllTimersAsync();

        // Restore real timers for the rest of the test suite
        jest.useRealTimers();

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("FATAL: createjs")
        );
        expect(alertSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to load EaselJS")
        );
    });

    // ───  activity/activity errback ─────────────────────────────

    test("logs error and alerts when activity/activity fails to load", async () => {
        await loadScript({ activityFails: true });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to load activity/activity"),
            expect.any(Error)
        );
        expect(alertSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to load Music Blocks")
        );
    });

    // ───  core bootstrap errback ───────────────────────────────

    test("logs error and alerts when core bootstrap modules fail to load", async () => {
        await loadScript({ coreBootstrapFails: true });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining("Core bootstrap failed"),
            expect.any(Error)
        );
        expect(alertSpy).toHaveBeenCalledWith(
            expect.stringContaining("Failed to initialize Music Blocks core")
        );
    });
});