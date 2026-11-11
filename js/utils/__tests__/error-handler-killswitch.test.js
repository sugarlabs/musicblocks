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

describe("ErrorHandler global error boundary kill switch", () => {
    let ErrorHandler;

    beforeAll(() => {
        localStorage.setItem("MB_ERROR_BOUNDARY", "false");
        ErrorHandler = require("../error-handler");
    });

    afterAll(() => {
        localStorage.removeItem("MB_ERROR_BOUNDARY");
    });

    it("does not install listeners or record errors when disabled", () => {
        const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

        window.dispatchEvent(new ErrorEvent("error", { message: "kill-switch" }));

        expect(ErrorHandler.installGlobalHandlers()).toBe(false);
        expect(window.__mbErrorBoundaryInstalled).toBeUndefined();
        expect(ErrorHandler.getRecentErrors()).toHaveLength(0);
        expect(consoleErrorSpy).not.toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
    });
});
