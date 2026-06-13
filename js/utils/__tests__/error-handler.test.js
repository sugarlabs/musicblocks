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
    });
});
