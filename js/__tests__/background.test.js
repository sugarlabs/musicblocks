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
    let originalWindowOpen;
    let windowOpenMock;

    beforeEach(() => {
        // Save the original window.open method
        originalWindowOpen = window.open;
        // Create a mock for window.open
        windowOpenMock = jest.fn();
        window.open = windowOpenMock;

        // Mock objects with proper callback capture
        mockBrowser = {
            browserAction: {
                onClicked: {
                    addListener: jest.fn((callback) => {
                        mockBrowser.browserAction.onClicked.callback = callback;
                    })
                }
            },
            tabs: { create: jest.fn() },
            runtime: {
                onInstalled: {
                    addListener: jest.fn((callback) => {
                        mockBrowser.runtime.onInstalled.callback = callback;
                    })
                }
            }
        };

        mockChrome = {
            browserAction: {
                onClicked: {
                    addListener: jest.fn((callback) => {
                        mockChrome.browserAction.onClicked.callback = callback;
                    })
                }
            },
            runtime: {
                onInstalled: {
                    addListener: jest.fn((callback) => {
                        mockChrome.runtime.onInstalled.callback = callback;
                    })
                },
                getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`)
            }
        };

        global.browser = mockBrowser;
        global.chrome = mockChrome;

        Object.defineProperty(global.navigator, "userAgent", {
            writable: true,
            value: ""
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
        delete global.browser;
        delete global.chrome;
        // Restore original window.open
        window.open = originalWindowOpen;
    });

    it("should set up Firefox-specific listeners when user agent is Firefox", () => {
        navigator.userAgent =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0";

        jest.resetModules(); // Clear the module cache
        const { isFirefox, browserAction } = require("../background.js");

        expect(isFirefox).toBe(true);
        expect(mockBrowser.browserAction.onClicked.addListener).toHaveBeenCalledTimes(1);
        expect(mockBrowser.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
    });

    it("should set up Chrome-specific listeners when user agent is not Firefox", () => {
        navigator.userAgent =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

        jest.resetModules(); // Clear the module cache
        const { isFirefox, browserAction } = require("../background.js");

        expect(isFirefox).toBe(false);
        expect(mockChrome.browserAction.onClicked.addListener).toHaveBeenCalledTimes(1);
        expect(mockChrome.runtime.onInstalled.addListener).toHaveBeenCalledTimes(1);
    });

    it("should create a new tab with index.html when browserAction is clicked in Firefox", () => {
        navigator.userAgent =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0";

        jest.resetModules(); // Clear the module cache
        require("../background.js");
        // Simulate clicking the browser action button
        mockBrowser.browserAction.onClicked.callback({ id: "tab-123" });

        expect(mockBrowser.tabs.create).toHaveBeenCalledWith({ url: "index.html" });
    });

    it("should create a new tab with index.html when extension is installed in Firefox", () => {
        navigator.userAgent =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0";

        jest.resetModules();
        require("../background.js");

        // Simulate extension installation event
        mockBrowser.runtime.onInstalled.callback({ reason: "install" });

        expect(mockBrowser.tabs.create).toHaveBeenCalledWith({ url: "index.html" });
    });

    it("should open index.html in a new window when browserAction is clicked in Chrome", () => {
        navigator.userAgent =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

        jest.resetModules();
        require("../background.js");

        mockChrome.browserAction.onClicked.callback({ id: "tab-123" });

        expect(window.open).toHaveBeenCalledWith("chrome-extension://fake-id/index.html");
        expect(mockChrome.runtime.getURL).toHaveBeenCalledWith("index.html");
    });

    it("should open index.html in a new window when extension is installed in Chrome", () => {
        navigator.userAgent =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36";

        jest.resetModules();
        require("../background.js");

        mockChrome.runtime.onInstalled.callback({ reason: "install" });

        expect(window.open).toHaveBeenCalledWith("chrome-extension://fake-id/index.html");
        expect(mockChrome.runtime.getURL).toHaveBeenCalledWith("index.html");
    });

    it("should properly export module values for Node.js environment", () => {
        // Test Firefox environment exports
        navigator.userAgent =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0";
        jest.resetModules();
        const firefoxExports = require("../background.js");

        expect(firefoxExports.isFirefox).toBe(true);
        expect(firefoxExports.browserAction).toBe(mockBrowser.browserAction);

        // Test Chrome environment exports
        navigator.userAgent = "Chrome";
        jest.resetModules();
        const chromeExports = require("../background.js");

        expect(chromeExports.isFirefox).toBe(false);
        expect(chromeExports.browserAction).toBe(mockChrome.browserAction);
    });
});
