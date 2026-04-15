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

        // Reset implicit `location` properties by leveraging JSDOM config or mocking window getters if needed
        delete window.location;
        window.location = {
            search: "",
            hostname: "example.com"
        };
    });

    afterEach(() => {
        console.log = originalConsoleLog;
    });

    function getDebugLogInstance() {
        return require("../debugLog");
    }

    it("should be a no-op by default in production-like environments", () => {
        const debugLog = getDebugLogInstance();

        debugLog("Should not log");

        expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("should bind to console.log if localStorage 'MB_DEBUG' is 'true'", () => {
        localStorage.setItem("MB_DEBUG", "true");

        const debugLog = getDebugLogInstance();
        debugLog("Hello World");

        expect(mockConsoleLog).toHaveBeenCalledWith("[MB]", "Hello World");
    });

    it("should be a no-op if localStorage 'MB_DEBUG' is 'false', overriding URL/dev states", () => {
        localStorage.setItem("MB_DEBUG", "false");
        // These conditions would normally enable it, but localStorage "false" overrides
        window.location.search = "debug=true";
        window.location.hostname = "localhost";

        const debugLog = getDebugLogInstance();
        debugLog("Should not log");

        expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("should bind to console.log if location URL search contains 'debug=true'", () => {
        window.location.search = "?someParam=abc&debug=true&otherParam=xyz";

        const debugLog = getDebugLogInstance();
        debugLog("URL parameter test");

        expect(mockConsoleLog).toHaveBeenCalledWith("[MB]", "URL parameter test");
    });

    it("should bind to console.log automatically on localhost", () => {
        window.location.hostname = "localhost";

        const debugLog = getDebugLogInstance();
        debugLog("localhost test");

        expect(mockConsoleLog).toHaveBeenCalledWith("[MB]", "localhost test");
    });

    it("should bind to console.log automatically on 127.0.0.1", () => {
        window.location.hostname = "127.0.0.1";

        const debugLog = getDebugLogInstance();
        debugLog("127.0.0.1 test");

        expect(mockConsoleLog).toHaveBeenCalledWith("[MB]", "127.0.0.1 test");
    });

    it("should safely handle restricted environments lacking localStorage or window", () => {
        // Disabling localStorage by mocking window/global behavior will trigger catch block
        const originalLocalStorage = global.localStorage;
        Object.defineProperty(global, "localStorage", {
            get: () => {
                throw new Error("Security Error");
            },
            configurable: true
        });

        const debugLog = getDebugLogInstance();
        debugLog("Safe test");

        expect(mockConsoleLog).not.toHaveBeenCalled();

        // Restore immediately
        Object.defineProperty(global, "localStorage", {
            value: originalLocalStorage,
            configurable: true
        });
    });
});
