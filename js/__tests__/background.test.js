/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Om Santosh Suneri
 *
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

describe("Browser Action Behavior", () => {
    let mockBrowser;
    let mockChrome;

    beforeEach(() => {
    // Mock objects
        mockBrowser = {
            browserAction: {
                onClicked: { addListener: jest.fn() },
            },
            tabs: { create: jest.fn() },
            runtime: {
                onInstalled: { addListener: jest.fn() },
            },
        };

        mockChrome = {
            browserAction: {
                onClicked: { addListener: jest.fn() },
            },
            runtime: {
                onInstalled: { addListener: jest.fn() },
                getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
            },
            tabs: { create: jest.fn() },
        };

        global.browser = mockBrowser;
        global.chrome = mockChrome;

        Object.defineProperty(global.navigator, "userAgent", {
            writable: true,
            value: "",
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete global.browser;
        delete global.chrome;
    });

    it("should set up Firefox-specific listeners when user agent is Firefox", () => {
        navigator.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0";

        jest.resetModules(); // Clear the module cache
        const { isFirefox, browserAction } = require("../background.js");

        expect(isFirefox).toBe(true);
        expect(browserAction.onClicked.addListener).toHaveBeenCalledTimes(1);
        expect(mockBrowser.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
    });

    it("should set up Chrome-specific listeners when user agent is not Firefox", () => {
        navigator.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

        jest.resetModules(); // Clear the module cache
        const { isFirefox, browserAction } = require("../background.js");

        expect(isFirefox).toBe(false);
        expect(browserAction.onClicked.addListener).toHaveBeenCalledTimes(1);
        expect(mockChrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
    });
});
