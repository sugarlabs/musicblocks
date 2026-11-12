/**
 * MusicBlocks v3.8.0
 *
 * @author Anurag Singh
 *
 * @copyright 2026 Anurag Singh
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
