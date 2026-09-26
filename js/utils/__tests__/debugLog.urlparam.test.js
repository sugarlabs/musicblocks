/**
 * debugLog's ?debug=true handling, tested away from localhost.
 *
 * The module enables logging on localhost regardless of the URL, and jsdom
 * runs at localhost by default, so a test for the URL branch would pass no
 * matter what the URL said. This file runs at a non-local origin, which is
 * the only place the query parameter decides anything.
 *
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://musicblocks.sugarlabs.org/"}
 */

describe("debugLog ?debug= handling away from localhost", () => {
    let originalConsoleLog;
    let mockConsoleLog;

    beforeEach(() => {
        jest.resetModules();
        if (typeof localStorage !== "undefined") localStorage.clear();
        originalConsoleLog = console.log;
        mockConsoleLog = jest.fn();
        console.log = mockConsoleLog;
        window.history.pushState({}, "", "/");
    });

    afterEach(() => {
        console.log = originalConsoleLog;
    });

    const debugLogFor = search => {
        window.history.pushState({}, "", search || "/");
        jest.resetModules();
        return require("../debugLog");
    };

    it("is not localhost, so the URL is what decides", () => {
        expect(["localhost", "127.0.0.1"]).not.toContain(window.location.hostname);
    });

    it("logs for ?debug=true", () => {
        debugLogFor("/?debug=true")("hello");
        expect(mockConsoleLog).toHaveBeenCalledWith("[MB]", "hello");
    });

    it("logs when debug=true is not the first parameter", () => {
        debugLogFor("/?a=1&debug=true&b=2")("hello");
        expect(mockConsoleLog).toHaveBeenCalledWith("[MB]", "hello");
    });

    it("stays silent for ?nodebug=true", () => {
        // A substring match reads this as a request for debug logging.
        debugLogFor("/?nodebug=true")("hello");
        expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("stays silent for ?debug=truex", () => {
        debugLogFor("/?debug=truex")("hello");
        expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it("stays silent for ?debug=false and with no parameter", () => {
        debugLogFor("/?debug=false")("hello");
        debugLogFor("/")("hello");
        expect(mockConsoleLog).not.toHaveBeenCalled();
    });
});
