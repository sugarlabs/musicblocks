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

describe("ErrorHandler global error boundary", () => {
    let ErrorHandler;
    let consoleErrorSpy;

    const dispatchError = (message, extra = {}) => {
        window.dispatchEvent(new ErrorEvent("error", { message, ...extra }));
    };

    const dispatchRejection = reason => {
        const event = new Event("unhandledrejection");
        event.reason = reason;
        window.dispatchEvent(event);
    };

    const lastRecord = () => {
        const records = ErrorHandler.getRecentErrors();
        return records[records.length - 1];
    };

    beforeAll(() => {
        sessionStorage.clear();
        ErrorHandler = require("../error-handler");
    });

    beforeEach(() => {
        sessionStorage.clear();
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    it("installs the listeners exactly once", () => {
        expect(window.__mbErrorBoundaryInstalled).toBe(true);
        expect(ErrorHandler.installGlobalHandlers()).toBe(false);
    });

    it("records a window error with metadata", () => {
        window.VERSION = "9.9.9";
        localStorage.setItem("beginnerMode", "true");

        const before = ErrorHandler.getRecentErrors().length;
        dispatchError("boundary-metadata", {
            filename: "http://example.test/app.js",
            lineno: 4,
            colno: 2
        });

        const records = ErrorHandler.getRecentErrors();
        expect(records).toHaveLength(before + 1);

        const record = records[records.length - 1];
        expect(record.message).toBe("boundary-metadata");
        expect(record.source).toBe("http://example.test/app.js");
        expect(record.line).toBe(4);
        expect(record.version).toBe("9.9.9");
        expect(record.language).toBe(navigator.language);
        expect(record.mode).toBe("beginner");

        delete window.VERSION;
        localStorage.removeItem("beginnerMode");
    });

    it("increments the count instead of adding a duplicate", () => {
        const before = ErrorHandler.getRecentErrors().length;

        dispatchError("boundary-duplicate");
        dispatchError("boundary-duplicate");

        const records = ErrorHandler.getRecentErrors();
        expect(records).toHaveLength(before + 1);
        expect(records[records.length - 1].count).toBe(2);
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it("captures unhandled promise rejections", () => {
        const before = ErrorHandler.getRecentErrors().length;

        dispatchRejection(new Error("boundary-rejection"));

        const records = ErrorHandler.getRecentErrors();
        expect(records).toHaveLength(before + 1);
        expect(records[records.length - 1].kind).toBe("unhandledrejection");
        expect(records[records.length - 1].message).toBe("boundary-rejection");
    });

    it("ignores extension frames and ResizeObserver noise", () => {
        const before = ErrorHandler.getRecentErrors().length;

        dispatchError("boom", { filename: "chrome-extension://abc/content.js" });
        dispatchError("ResizeObserver loop completed with undelivered notifications.");

        expect(ErrorHandler.getRecentErrors()).toHaveLength(before);
    });

    it("persists the log to sessionStorage", () => {
        dispatchError("boundary-persisted");

        const stored = JSON.parse(sessionStorage.getItem("mb_error_log_v1"));
        expect(stored[stored.length - 1].message).toBe("boundary-persisted");
    });

    it("truncates long stacks", () => {
        const error = new Error("boundary-stack");
        error.stack = "x".repeat(5000);

        dispatchError("boundary-stack", { error });

        expect(lastRecord().stack).toHaveLength(1024);
    });

    it("keeps at most 50 records", () => {
        for (let i = 0; i < 55; i++) dispatchError("boundary-cap-" + i);

        expect(ErrorHandler.getRecentErrors()).toHaveLength(50);
    });

    it("returns a copy of the records", () => {
        const records = ErrorHandler.getRecentErrors();
        records.push({});

        expect(ErrorHandler.getRecentErrors()).toHaveLength(records.length - 1);
    });

    it("delegates debug and info to debugLog", () => {
        global.debugLog = jest.fn();

        ErrorHandler.debug("d", 1);
        ErrorHandler.info("i", 2);

        expect(global.debugLog).toHaveBeenCalledWith("d", 1);
        expect(global.debugLog).toHaveBeenCalledWith("i", 2);

        delete global.debugLog;
    });
});
