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
    const buildDom = () => {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
    };

    const loadModuleWithUA = ua => {
        Object.defineProperty(global.window.navigator, "userAgent", {
            value: ua,
            configurable: true,
            writable: true
        });
        global.navigator = global.window.navigator;
        const ls = global.window.localStorage || {};
        global.localStorage = ls;
        global.window.localStorage = ls;
        global.showMaterialHighlight = jest.fn(() => ({ highlight: true }));
        buildDom();

        jest.isolateModules(() => {
            require("../platformstyle");
        });
    };

    beforeEach(() => {
        jest.resetModules();
        document.head.innerHTML = "";
        delete global.window.platform;
        delete global.window.platformColor;
    });

    afterEach(() => {
        jest.resetModules();
    });

    it("should detect androidWebkit for Android Chrome", () => {
        loadModuleWithUA("Mozilla/5.0 Android Chrome/90");
        expect(global.window.platform.android).toBe(true);
        expect(global.window.platform.FF).toBe(false);
        expect(global.window.platform.androidWebkit).toBe(true);
        expect(global.window.platform.FFOS).toBe(false);
    });

    it("should not set androidWebkit for Android Firefox", () => {
        loadModuleWithUA("Mozilla/5.0 Android Firefox/88");
        expect(global.window.platform.android).toBe(true);
        expect(global.window.platform.FF).toBe(true);
        expect(global.window.platform.androidWebkit).toBe(false);
        expect(global.window.platform.FFOS).toBe(false);
    });

    it("should detect FFOS for Firefox mobile non-Android", () => {
        loadModuleWithUA("Mozilla/5.0 Firefox Mobi");
        expect(global.window.platform.FF).toBe(true);
        expect(global.window.platform.mobile).toBe(true);
        expect(global.window.platform.android).toBe(false);
        expect(global.window.platform.FFOS).toBe(true);
        expect(global.window.platform.androidWebkit).toBe(false);
    });

    it("should not detect FFOS for desktop Firefox", () => {
        loadModuleWithUA("Mozilla/5.0 Firefox/88.0");
        expect(global.window.platform.FF).toBe(true);
        expect(global.window.platform.mobile).toBe(false);
        expect(global.window.platform.FFOS).toBe(false);
    });

    it("should handle empty user agent", () => {
        loadModuleWithUA("");
        expect(global.window.platform.android).toBe(false);
        expect(global.window.platform.FF).toBe(false);
        expect(global.window.platform.mobile).toBe(false);
        expect(global.window.platform.tablet).toBe(false);
        expect(global.window.platform.androidWebkit).toBe(false);
        expect(global.window.platform.FFOS).toBe(false);
    });

    it("delegates to showMaterialHighlight when not on FFOS", () => {
        loadModuleWithUA("Chrome/123");
        const { showButtonHighlight } = require("../platformstyle");
        const result = showButtonHighlight(1, 2, 3, { type: "click" }, 1, {});
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

    it("returns empty object from showButtonHighlight when on FFOS", () => {
        loadModuleWithUA("Mozilla/5.0 Firefox Mobi");
        const { showButtonHighlight } = require("../platformstyle");
        const result = showButtonHighlight(0, 0, 0, {}, 1, {});
        expect(result).toEqual({});
        expect(global.showMaterialHighlight).not.toHaveBeenCalled();
    });

    it("initializes platformColor with light theme by default", () => {
        loadModuleWithUA("Chrome/123");
        expect(global.window.platformColor).toBeDefined();
        expect(global.window.platformColor.header).toBe("#4DA6FF");
        expect(document.querySelector("meta[name=theme-color]").content).toBe("#4DA6FF");
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
        global.showMaterialHighlight = jest.fn(() => ({ highlight: true }));
        buildDom();

        jest.isolateModules(() => {
            require("../platformstyle");
        });

        expect(global.window.platformColor.header).toBe("#1E88E5");
        expect(document.querySelector("meta[name=theme-color]").content).toBe("#1E88E5");
    });
});
