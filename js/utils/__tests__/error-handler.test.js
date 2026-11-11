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

describe("ErrorHandler", () => {
    let ErrorHandler;
    let consoleErrorSpy;
    let consoleWarnSpy;

    beforeEach(() => {
        jest.resetModules();
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        ErrorHandler = require("../error-handler");
    });

    afterEach(() => {
        if (
            typeof window !== "undefined" &&
            typeof window.__MB_ERROR_HANDLER_DISPOSE__ === "function"
        ) {
            window.__MB_ERROR_HANDLER_DISPOSE__();
        }
        if (typeof window !== "undefined") {
            delete window.__MB_ERROR_HANDLER_INSTALLED__;
            delete window.__MB_ERROR_HANDLER_DISPOSE__;
            delete window.ActivityContext;
        }
        consoleErrorSpy.mockRestore();
        consoleWarnSpy.mockRestore();
    });

    describe("capture", () => {
        it("logs error with console.error", () => {
            ErrorHandler.capture(new Error("test error"));
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("includes operation name in the log prefix", () => {
            ErrorHandler.capture(new Error("fail"), { operation: "loadStuff" });
            const callArgs = consoleErrorSpy.mock.calls[0];
            expect(callArgs[0]).toBe("[loadStuff]");
        });

        it("works without context", () => {
            ErrorHandler.capture("something broke");
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("logs context object when provided", () => {
            const ctx = { operation: "test", extra: "info" };
            ErrorHandler.capture("error", ctx);
            const callArgs = consoleErrorSpy.mock.calls[0];
            expect(callArgs[2]).toEqual(ctx);
        });
    });

    describe("warn", () => {
        it("logs message with console.warn", () => {
            ErrorHandler.warn("warning message");
            expect(consoleWarnSpy).toHaveBeenCalled();
        });

        it("includes operation name in the log prefix", () => {
            ErrorHandler.warn("something odd", { operation: "checkConfig" });
            const callArgs = consoleWarnSpy.mock.calls[0];
            expect(callArgs[0]).toBe("[checkConfig]");
        });

        it("works without context", () => {
            ErrorHandler.warn("just a warning");
            expect(consoleWarnSpy).toHaveBeenCalled();
        });
    });

    describe("recoverable", () => {
        it("logs with [Recoverable] prefix", () => {
            ErrorHandler.recoverable(new Error("handled"));
            const callArgs = consoleWarnSpy.mock.calls[0];
            expect(callArgs[0]).toBe("[Recoverable]");
        });

        it("includes operation name", () => {
            ErrorHandler.recoverable("oops", { operation: "parseData" });
            const callArgs = consoleWarnSpy.mock.calls[0];
            expect(callArgs[0]).toBe("[Recoverable]");
            expect(callArgs[1]).toBe("[parseData]");
        });
    });

    describe("userFacing", () => {
        it("logs error with console.error", () => {
            ErrorHandler.userFacing("something failed", { operation: "save" });
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("shows user-facing message when ActivityContext is available", () => {
            const errorMsgMock = jest.fn();
            global.window.ActivityContext = {
                getActivity: () => ({ errorMsg: errorMsgMock })
            };

            ErrorHandler.userFacing("fail", { operation: "save" }, "Something went wrong");
            expect(errorMsgMock).toHaveBeenCalledWith("Something went wrong");

            delete global.window.ActivityContext;
        });

        it("does not throw when ActivityContext is not available", () => {
            expect(() => {
                ErrorHandler.userFacing("fail", {}, "ui message");
            }).not.toThrow();
        });

        it("does not call errorMsg when uiMessage is empty", () => {
            const errorMsgMock = jest.fn();
            global.window.ActivityContext = {
                getActivity: () => ({ errorMsg: errorMsgMock })
            };

            ErrorHandler.userFacing("fail", { operation: "save" });
            expect(errorMsgMock).not.toHaveBeenCalled();

            delete global.window.ActivityContext;
        });

        it("catches and suppresses errors if getActivity throws", () => {
            global.window.ActivityContext = {
                getActivity: () => {
                    throw new Error("Activity not ready");
                }
            };

            expect(() => {
                ErrorHandler.userFacing("fail", { operation: "save" }, "ui msg");
            }).not.toThrow();

            delete global.window.ActivityContext;
        });

        it("handles case where activity exists but errorMsg is not a function", () => {
            global.window.ActivityContext = {
                getActivity: () => ({ errorMsg: "not a function" })
            };

            expect(() => {
                ErrorHandler.userFacing("fail", { operation: "save" }, "ui msg");
            }).not.toThrow();

            delete global.window.ActivityContext;
        });
    });

    describe("recent error buffer", () => {
        it("deduplicates repeated errors and counts them", () => {
            const error = new Error("loop");
            ErrorHandler.capture(error, { operation: "run" });
            ErrorHandler.capture(error, { operation: "run" });
            ErrorHandler.capture(error, { operation: "run" });

            const records = ErrorHandler.getRecentErrors();
            expect(records).toHaveLength(1);
            expect(records[0].count).toBe(3);
            expect(records[0].level).toBe("error");
            expect(records[0].operation).toBe("run");
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        });

        it("keeps separate records for different operations", () => {
            const error = new Error("same message");
            ErrorHandler.capture(error, { operation: "one" });
            ErrorHandler.capture(error, { operation: "two" });

            expect(ErrorHandler.getRecentErrors()).toHaveLength(2);
        });

        it("returns a copy of the buffer", () => {
            ErrorHandler.capture("boom", { operation: "copy" });

            const records = ErrorHandler.getRecentErrors();
            records.push({});

            expect(ErrorHandler.getRecentErrors()).toHaveLength(1);
        });

        it("clears the buffer", () => {
            ErrorHandler.capture("boom", { operation: "clear" });
            ErrorHandler.clearRecentErrors();

            expect(ErrorHandler.getRecentErrors()).toHaveLength(0);
        });

        it("still shows the user-facing message on repeats", () => {
            const errorMsgMock = jest.fn();
            global.window.ActivityContext = {
                getActivity: () => ({ errorMsg: errorMsgMock })
            };
            const error = new Error("repeat");

            ErrorHandler.userFacing(error, { operation: "save" }, "Could not save");
            ErrorHandler.userFacing(error, { operation: "save" }, "Could not save");

            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            expect(errorMsgMock).toHaveBeenCalledTimes(2);

            delete global.window.ActivityContext;
        });
    });

    describe("global handlers", () => {
        afterEach(() => {
            ErrorHandler.uninstallGlobalHandlers();
        });

        it("installs idempotently", () => {
            const first = ErrorHandler.installGlobalHandlers();
            const second = ErrorHandler.installGlobalHandlers();

            expect(second).toBe(first);
        });

        it("captures uncaught errors", () => {
            window.dispatchEvent(
                new ErrorEvent("error", {
                    message: "boom",
                    error: new Error("boom"),
                    filename: "http://localhost/app.js",
                    lineno: 10,
                    colno: 5
                })
            );

            const records = ErrorHandler.getRecentErrors();
            expect(records).toHaveLength(1);
            expect(records[0].level).toBe("uncaught");
            expect(records[0].operation).toBe("uncaught");
            expect(records[0].source).toBe("http://localhost/app.js");
            expect(records[0].line).toBe(10);
            expect(records[0].column).toBe(5);
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("captures unhandled promise rejections", () => {
            const event = new Event("unhandledrejection");
            event.reason = new Error("rejected");
            window.dispatchEvent(event);

            const records = ErrorHandler.getRecentErrors();
            expect(records).toHaveLength(1);
            expect(records[0].level).toBe("unhandledrejection");
            expect(records[0].operation).toBe("unhandledrejection");
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it("ignores extension errors and ResizeObserver noise", () => {
            window.dispatchEvent(
                new ErrorEvent("error", {
                    message: "extension failure",
                    filename: "chrome-extension://abc/content.js"
                })
            );
            window.dispatchEvent(
                new ErrorEvent("error", {
                    message: "ResizeObserver loop completed with undelivered notifications.",
                    filename: "http://localhost/app.js"
                })
            );

            expect(ErrorHandler.getRecentErrors()).toHaveLength(0);
        });

        it("deduplicates repeated uncaught errors", () => {
            const error = new Error("repeat");
            const dispatch = () => {
                window.dispatchEvent(
                    new ErrorEvent("error", {
                        message: "repeat",
                        error,
                        filename: "http://localhost/app.js",
                        lineno: 20,
                        colno: 3
                    })
                );
            };

            dispatch();
            dispatch();

            const records = ErrorHandler.getRecentErrors();
            expect(records).toHaveLength(1);
            expect(records[0].count).toBe(2);
        });

        it("removes listeners when disposed", () => {
            ErrorHandler.uninstallGlobalHandlers();

            const event = new Event("unhandledrejection");
            event.reason = new Error("after dispose");
            window.dispatchEvent(event);

            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(ErrorHandler.getRecentErrors()).toHaveLength(0);
        });
    });
});
