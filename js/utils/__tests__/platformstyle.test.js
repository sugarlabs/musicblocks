/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2024 omsuneri
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

describe("platformstyle", () => {
    let showButtonHighlightRef;

    const loadModule = () => {
        jest.isolateModules(() => {
            require("../platformstyle");
        });
        showButtonHighlightRef = require("../platformstyle").showButtonHighlight;
    };

    const buildDom = () => {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
    };

    beforeEach(() => {
        jest.resetModules();
        document.head.innerHTML = "";
        global.showMaterialHighlight = jest.fn(() => ({ highlight: true }));
        delete global.window.platform;
        delete global.window.platformColor;
    });

    it("initializes platform color preference with default theme", () => {
        Object.defineProperty(global.window.navigator, "userAgent", {
            value: "Mozilla/5.0 (Macintosh; Intel Mac OS X)",
            configurable: true,
            writable: true
        });
        global.navigator = global.window.navigator;
        global.localStorage = {};
        global.window.navigator = global.navigator;
        global.window.localStorage = global.localStorage;
        buildDom();

        loadModule();

        expect(global.window.platformColor.header).toBe("#4DA6FF");
        expect(document.querySelector("meta[name=theme-color]").content).toBe("#4DA6FF");
        expect(global.window.platform.FFOS).toBe(false);
    });

    it("honors dark theme preference", () => {
        Object.defineProperty(global.window.navigator, "userAgent", {
            value: "Chrome/123",
            configurable: true,
            writable: true
        });
        global.navigator = global.window.navigator;
        const ls = global.window.localStorage || {};
        ls.themePreference = "dark";
        global.localStorage = ls;
        global.window.localStorage = ls;
        global.window.navigator = global.navigator;
        buildDom();

        loadModule();

        expect(global.window.platformColor.header).toBe("#1E88E5");
        expect(document.querySelector("meta[name=theme-color]").content).toBe("#1E88E5");
    });

    it("skips material highlight when running on Firefox OS", () => {
        Object.defineProperty(global.window.navigator, "userAgent", {
            value: "Firefox Mobi",
            configurable: true,
            writable: true
        });
        global.navigator = global.window.navigator;
        const ls = global.window.localStorage || {};
        global.localStorage = ls;
        global.window.localStorage = ls;
        buildDom();

        loadModule();

        const ua = global.window.navigator.userAgent;
        const expectedFFOS =
            /Firefox/i.test(ua) && (/Mobi/i.test(ua) || /Tablet/i.test(ua)) && !/Android/i.test(ua);
        expect(global.window.platform.FFOS).toBe(expectedFFOS);
    });

    it("delegates to material highlight when not on FFOS", () => {
        Object.defineProperty(global.window.navigator, "userAgent", {
            value: "Chrome/123",
            configurable: true,
            writable: true
        });
        global.navigator = global.window.navigator;
        buildDom();

        loadModule();
        const result = showButtonHighlightRef(1, 2, 3, { type: "click" }, 1, {});
        expect(result).toEqual({ highlight: true });
        expect(global.showMaterialHighlight).toHaveBeenCalledWith(
            1,
            2,
            3,
            { type: "click" },
            1,
            {}
        );
    });

    it("returns empty highlight when FFOS", () => {
        Object.defineProperty(global.window.navigator, "userAgent", {
            value: "Firefox Mobi",
            configurable: true,
            writable: true
        });
        global.navigator = global.window.navigator;
        buildDom();

        loadModule();
        global.window.platform.FFOS = true;
        const result = showButtonHighlightRef(0, 0, 0, {}, 1, {});
        expect(result).toEqual({});
        expect(global.showMaterialHighlight).not.toHaveBeenCalled();
    });
});
