/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2014-2026 Walter Bender
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

const BrowserUtils = require("../browser-utils");

const { fnBrowserDetect, doBrowserCheck, canvasPixelRatio, windowHeight, windowWidth } =
    BrowserUtils;

/**
 * Overrides navigator.userAgent for the duration of a single test.
 * @param {string} value - The user agent string to report.
 */
const setUserAgent = value => {
    Object.defineProperty(navigator, "userAgent", { value, configurable: true });
};

const ORIGINAL_USER_AGENT = navigator.userAgent;

afterEach(() => {
    setUserAgent(ORIGINAL_USER_AGENT);
});

describe("fnBrowserDetect()", () => {
    it.each([
        ["chrome", "Mozilla/5.0 Chrome/120.0"],
        ["chrome", "Mozilla/5.0 CriOS/120.0"],
        ["chrome", "Mozilla/5.0 Chromium/120.0"],
        ["firefox", "Mozilla/5.0 Firefox/121.0"],
        ["firefox", "Mozilla/5.0 FxiOS/121.0"],
        ["safari", "Mozilla/5.0 Safari/605.1.15"],
        ["opera", "Mozilla/5.0 OPR/106.0"],
        ["edge", "Mozilla/5.0 Edg/120.0"]
    ])("detects %s from %s", (expected, userAgent) => {
        setUserAgent(userAgent);
        expect(fnBrowserDetect()).toBe(expected);
    });

    it("returns the fallback string for an unrecognized user agent", () => {
        setUserAgent("CustomBot/1.0");
        expect(fnBrowserDetect()).toBe("No browser detection");
    });

    it("prefers chrome over safari when both tokens are present", () => {
        setUserAgent("Mozilla/5.0 AppleWebKit/537.36 Chrome/120.0 Safari/537.36");
        expect(fnBrowserDetect()).toBe("chrome");
    });
});

describe("doBrowserCheck()", () => {
    let jQueryStub;

    beforeEach(() => {
        jQueryStub = {};
        global.jQuery = jQueryStub;
    });

    afterEach(() => {
        delete global.jQuery;
    });

    it("installs a uaMatch helper on jQuery", () => {
        setUserAgent("Mozilla/5.0 Chrome/120.0");
        doBrowserCheck();
        expect(typeof jQueryStub.uaMatch).toBe("function");
    });

    it("sets webkit alongside chrome", () => {
        setUserAgent("Mozilla/5.0 Chrome/120.0");
        doBrowserCheck();
        expect(jQueryStub.browser).toEqual({
            chrome: true,
            webkit: true,
            version: "120.0"
        });
    });

    it("sets safari alongside webkit when chrome is absent", () => {
        setUserAgent("Mozilla/5.0 AppleWebKit/537.36");
        doBrowserCheck();
        expect(jQueryStub.browser.webkit).toBe(true);
        expect(jQueryStub.browser.safari).toBe(true);
        expect(jQueryStub.browser.chrome).toBeUndefined();
    });

    it("records mozilla and its rv version", () => {
        setUserAgent("Mozilla/5.0 (X11; Linux) rv:109.0");
        doBrowserCheck();
        expect(jQueryStub.browser.mozilla).toBe(true);
        expect(jQueryStub.browser.version).toBe("109.0");
    });

    it("ignores mozilla when the user agent claims compatibility", () => {
        setUserAgent("Mozilla/5.0 (compatible; SomeBot/1.0)");
        doBrowserCheck();
        expect(jQueryStub.browser).toEqual({});
    });

    it("yields an empty browser object for an unmatched user agent", () => {
        setUserAgent("CustomBot/1.0");
        doBrowserCheck();
        expect(jQueryStub.browser).toEqual({});
    });

    it("parses the msie branch and records its version", () => {
        setUserAgent("Mozilla/4.0 (compatible; MSIE 9.0; Windows NT 6.1)");
        doBrowserCheck();
        expect(jQueryStub.browser.msie).toBe(true);
        expect(jQueryStub.browser.version).toBe("9.0");
    });

    it("reports an empty browser name and a version of 0 for unparseable input", () => {
        setUserAgent("CustomBot/1.0");
        doBrowserCheck();
        expect(jQueryStub.uaMatch("CustomBot/1.0")).toEqual({ browser: "", version: "0" });
    });

    it("lowercases the user agent before matching", () => {
        setUserAgent("MOZILLA/5.0 CHROME/120.0");
        doBrowserCheck();
        expect(jQueryStub.browser.chrome).toBe(true);
        expect(jQueryStub.browser.version).toBe("120.0");
    });
});

describe("canvasPixelRatio()", () => {
    const originalQuerySelector = document.querySelector;
    const originalDevicePixelRatio = window.devicePixelRatio;

    /**
     * Stubs #myCanvas so getContext("2d") returns the supplied context.
     * @param {Object} context - The fake 2d rendering context.
     */
    const stubCanvas = context => {
        document.querySelector = jest.fn(() => ({ getContext: jest.fn(() => context) }));
    };

    afterEach(() => {
        document.querySelector = originalQuerySelector;
        window.devicePixelRatio = originalDevicePixelRatio;
    });

    it("divides the device pixel ratio by the backing store ratio", () => {
        window.devicePixelRatio = 3;
        stubCanvas({ backingStorePixelRatio: 2 });
        expect(canvasPixelRatio()).toBe(1.5);
    });

    it("falls back to 1 when devicePixelRatio is undefined", () => {
        window.devicePixelRatio = undefined;
        stubCanvas({});
        expect(canvasPixelRatio()).toBe(1);
    });

    it("falls back to a backing store ratio of 1 when none is reported", () => {
        window.devicePixelRatio = 2;
        stubCanvas({});
        expect(canvasPixelRatio()).toBe(2);
    });

    it.each([
        "webkitBackingStorePixelRatio",
        "mozBackingStorePixelRatio",
        "msBackingStorePixelRatio",
        "oBackingStorePixelRatio",
        "backingStorePixelRatio"
    ])("honours the vendor-prefixed %s property", property => {
        window.devicePixelRatio = 4;
        stubCanvas({ [property]: 2 });
        expect(canvasPixelRatio()).toBe(2);
    });
});

// Distinct literals so an inner/outer mix-up cannot produce a passing assertion.
const OUTER_HEIGHT = 901;
const INNER_HEIGHT = 602;
const OUTER_WIDTH = 903;
const INNER_WIDTH = 604;

describe("viewport helpers", () => {
    const saved = {};

    beforeEach(() => {
        for (const key of ["outerHeight", "innerHeight", "outerWidth", "innerWidth"]) {
            saved[key] = window[key];
        }
        Object.defineProperty(window, "outerHeight", {
            value: OUTER_HEIGHT,
            configurable: true
        });
        Object.defineProperty(window, "innerHeight", {
            value: INNER_HEIGHT,
            configurable: true
        });
        Object.defineProperty(window, "outerWidth", { value: OUTER_WIDTH, configurable: true });
        Object.defineProperty(window, "innerWidth", { value: INNER_WIDTH, configurable: true });
    });

    afterEach(() => {
        for (const [key, value] of Object.entries(saved)) {
            Object.defineProperty(window, key, { value, configurable: true });
        }
    });

    describe("windowHeight()", () => {
        it("returns outerHeight on Android", () => {
            setUserAgent("Mozilla/5.0 (Linux; Android 13; Pixel 7)");
            expect(windowHeight()).toBe(OUTER_HEIGHT);
        });

        it("returns innerHeight everywhere else", () => {
            setUserAgent("Mozilla/5.0 Chrome/120.0");
            expect(windowHeight()).toBe(INNER_HEIGHT);
        });

        it("matches Android case-insensitively", () => {
            setUserAgent("mozilla/5.0 (linux; android 13)");
            expect(windowHeight()).toBe(OUTER_HEIGHT);
        });
    });

    describe("windowWidth()", () => {
        it("returns outerWidth on Android", () => {
            setUserAgent("Mozilla/5.0 (Linux; Android 13; Pixel 7)");
            expect(windowWidth()).toBe(OUTER_WIDTH);
        });

        it("returns innerWidth everywhere else", () => {
            setUserAgent("Mozilla/5.0 Chrome/120.0");
            expect(windowWidth()).toBe(INNER_WIDTH);
        });

        it("matches Android case-insensitively", () => {
            setUserAgent("mozilla/5.0 (linux; android 13)");
            expect(windowWidth()).toBe(OUTER_WIDTH);
        });
    });
});

describe("compatibility surface", () => {
    it("exposes every helper on the module export object", () => {
        expect(Object.keys(BrowserUtils).sort()).toEqual([
            "canvasPixelRatio",
            "doBrowserCheck",
            "fnBrowserDetect",
            "windowHeight",
            "windowWidth"
        ]);
    });

    it("re-exports the identical function references through utils.js", () => {
        const utils = require("../utils");

        expect(utils.fnBrowserDetect).toBe(BrowserUtils.fnBrowserDetect);
        expect(utils.doBrowserCheck).toBe(BrowserUtils.doBrowserCheck);
        expect(utils.canvasPixelRatio).toBe(BrowserUtils.canvasPixelRatio);
        expect(utils.windowHeight).toBe(BrowserUtils.windowHeight);
        expect(utils.windowWidth).toBe(BrowserUtils.windowWidth);
    });
});
