// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * @jest-environment jsdom
 */

describe("debugLog", () => {
    let originalConsoleLog;
    let mockConsoleLog;

    beforeEach(() => {
        // Re-establish fresh require cache to ensure IIFE re-evaluates
        jest.resetModules();

        // Ensure clean global state
        if (typeof localStorage !== "undefined") {
            localStorage.clear();
        }

        // Setup console mock
        originalConsoleLog = console.log;
        mockConsoleLog = jest.fn();
        console.log = mockConsoleLog;

        // Reset implicit `location.search` properties by leveraging pushState
        if (typeof window !== "undefined" && window.history) {
            window.history.pushState({}, "", "/");
        }
    });

    afterEach(() => {
        console.log = originalConsoleLog;
    });

    function getDebugLogInstance() {
        return require("../debugLog");
    }

    it("should bind to console.log as JSDOM defaults to localhost (auto-dev mode)", () => {
        // jsdom inherently runs at http://localhost/, matching local developer heuristics.
        const debugLog = getDebugLogInstance();

        debugLog("Should log because localhost");

        expect(mockConsoleLog).toHaveBeenCalledWith("[MB]", "Should log because localhost");
    });

    it("should bind to console.log if localStorage 'MB_DEBUG' is 'true'", () => {
        localStorage.setItem("MB_DEBUG", "true");

        const debugLog = getDebugLogInstance();
        debugLog("Hello World");

        expect(mockConsoleLog).toHaveBeenCalledWith("[MB]", "Hello World");
    });

    it("should be a no-op if localStorage 'MB_DEBUG' is 'false', overriding URL/dev states", () => {
        localStorage.setItem("MB_DEBUG", "false");
        // These conditions would normally enable it, but localStorage "false" strongly overrides
        window.history.pushState({}, "", "/?debug=true");

        const debugLog = getDebugLogInstance();
        debugLog("Should not log");

        expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("should bind to console.log if location URL search contains 'debug=true'", () => {
        // History API alters window.location natively without violating JSDOM read-only exceptions
        window.history.pushState({}, "", "/?someParam=abc&debug=true&otherParam=xyz");

        const debugLog = getDebugLogInstance();
        debugLog("URL parameter test");

        expect(mockConsoleLog).toHaveBeenCalledWith("[MB]", "URL parameter test");
    });

    it("should safely handle restricted environments lacking localStorage or window", () => {
        // Disabling localStorage by mocking window/global behavior will trigger catch block
        const getItemSpy = jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
            throw new Error("Security Error");
        });

        // The catch block gracefully intercepts the error and evaluates the remaining fallbacks.
        const debugLog = getDebugLogInstance();
        debugLog("Safe test");

        // The logic drops to the catch block and effectively disables logging safely.
        expect(mockConsoleLog).not.toHaveBeenCalled();

        // Restore components immediately following expectations
        getItemSpy.mockRestore();
    });
});
