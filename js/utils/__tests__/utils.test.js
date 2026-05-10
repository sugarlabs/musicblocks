/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2024 ravjot07
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// Mock browser globals for JSDOM
if (typeof window !== "undefined") {
    window.btoa = str => Buffer.from(str, "utf8").toString("base64");
    window.outerHeight = 600;
    window.outerWidth = 800;
    // window.innerHeight and innerWidth are usually set by JSDOM but we can override if needed
    // However, assigning to them might not work if they are getters.

    window.widgetWindows = {
        hideAllWindows: jest.fn(),
        hideWindow: jest.fn()
    };
    window.server = "http://localhost/";
}

// i18next mock
global.i18next = {
    language: "en",
    t: jest.fn(key => key)
};

// jQuery mock
global.jQuery = {
    uaMatch: jest.fn(),
    browser: {}
};

global.base64Encode = jest.fn(s => s);

const Utils = require("../utils.js");

describe("Utility Functions (Browser-dependent)", () => {
    describe("fnBrowserDetect()", () => {
        let userAgentGetter;

        beforeEach(() => {
            userAgentGetter = jest.spyOn(window.navigator, "userAgent", "get");
        });

        afterEach(() => {
            userAgentGetter.mockRestore();
        });

        it("detects chrome", () => {
            userAgentGetter.mockReturnValue(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            );
            expect(Utils.fnBrowserDetect()).toBe("chrome");
        });

        it("detects firefox", () => {
            userAgentGetter.mockReturnValue(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0"
            );
            expect(Utils.fnBrowserDetect()).toBe("firefox");
        });
    });

    describe("windowHeight() and windowWidth()", () => {
        let userAgentGetter;

        beforeEach(() => {
            userAgentGetter = jest.spyOn(window.navigator, "userAgent", "get");
            // Mock innerHeight/innerWidth since JSDOM defaults might be different
            Object.defineProperty(window, "innerHeight", {
                writable: true,
                configurable: true,
                value: 400
            });
            Object.defineProperty(window, "innerWidth", {
                writable: true,
                configurable: true,
                value: 600
            });
            Object.defineProperty(window, "outerHeight", {
                writable: true,
                configurable: true,
                value: 600
            });
            Object.defineProperty(window, "outerWidth", {
                writable: true,
                configurable: true,
                value: 800
            });
        });

        afterEach(() => {
            userAgentGetter.mockRestore();
        });

        it("returns inner dimensions for non-android", () => {
            userAgentGetter.mockReturnValue("Mozilla");
            expect(Utils.windowHeight()).toBe(400);
            expect(Utils.windowWidth()).toBe(600);
        });

        it("returns outer dimensions for android", () => {
            userAgentGetter.mockReturnValue("Android");
            expect(Utils.windowHeight()).toBe(600);
            expect(Utils.windowWidth()).toBe(800);
        });
    });

    describe("format()", () => {
        it("replaces placeholders", () => {
            expect(Utils.format("Hello {name}", { name: "World" })).toBe("Hello World");
        });

        it("calls _() for translated placeholders", () => {
            expect(Utils.format("Hello {_World}", {})).toBe("Hello World");
        });
    });

    describe("closeWidgets()", () => {
        it("calls hideAllWindows", () => {
            Utils.closeWidgets();
            expect(window.widgetWindows.hideAllWindows).toHaveBeenCalled();
        });
    });

    describe("doBrowserCheck()", () => {
        let userAgentGetter;

        beforeEach(() => {
            userAgentGetter = jest.spyOn(window.navigator, "userAgent", "get");
        });

        afterEach(() => {
            userAgentGetter.mockRestore();
        });

        it("sets jQuery.browser", () => {
            userAgentGetter.mockReturnValue(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            );
            Utils.doBrowserCheck();
            expect(global.jQuery.browser.chrome).toBe(true);
        });
    });
});
