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

/*
 * browser-utils.test.js reaches the module through require(). In the
 * application these files are evaluated as classic scripts, where `module` is
 * undefined and the helpers reach their callers as window globals, so the two
 * paths can regress independently.
 *
 * These tests evaluate the files as classic scripts and assert the loader
 * configuration separately. They do not run RequireJS itself; the real
 * resolution order is exercised by the Cypress E2E suite.
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const UTILS_DIR = path.resolve(__dirname, "..");
const LOADER = path.resolve(__dirname, "../../loader.js");

const HELPERS = [
    "fnBrowserDetect",
    "doBrowserCheck",
    "canvasPixelRatio",
    "windowHeight",
    "windowWidth"
];

/**
 * Evaluates project files as classic scripts in a scope where `window` is the
 * global object and `module` does not exist, so top-level declarations become
 * globals and the CommonJS branches are skipped.
 * @param {string[]} files - Basenames in js/utils, evaluated in order.
 * @param {string} userAgent - The user agent the fake navigator reports.
 * @returns {Object} The scope after evaluation.
 */
const loadAsScripts = (files, userAgent = "Mozilla/5.0 Chrome/120.0") => {
    const scope = { navigator: { userAgent } };
    scope.window = scope;
    vm.createContext(scope);

    for (const file of files) {
        const full = path.join(UTILS_DIR, `${file}.js`);
        vm.runInContext(fs.readFileSync(full, "utf8"), scope, { filename: full });
    }
    return scope;
};

describe("browser-utils.js evaluated as a classic script", () => {
    it("skips the CommonJS branch and publishes BrowserUtils", () => {
        const scope = loadAsScripts(["browser-utils"]);

        expect(typeof scope.module).toBe("undefined");
        expect(Object.keys(scope.BrowserUtils).sort()).toEqual([...HELPERS].sort());
    });

    it.each(HELPERS)("exposes %s as a window global", helper => {
        const scope = loadAsScripts(["browser-utils"]);

        expect(scope[helper]).toBe(scope.BrowserUtils[helper]);
    });

    it("returns working results through the globals", () => {
        const scope = loadAsScripts(["browser-utils"], "Mozilla/5.0 Firefox/121.0");
        scope.jQuery = {};

        expect(scope.fnBrowserDetect()).toBe("firefox");

        scope.doBrowserCheck();
        expect(scope.jQuery.browser.mozilla).toBe(true);
    });

    it("survives utils.js being evaluated afterwards", () => {
        // utils.js hoists `var BrowserUtils` from a `typeof module` branch that
        // never runs in the browser; that must not reset the published global.
        const scope = loadAsScripts(["utils-logic", "dom-helpers", "browser-utils", "utils"]);

        expect(Object.keys(scope.BrowserUtils).sort()).toEqual([...HELPERS].sort());
        expect(scope.fnBrowserDetect()).toBe("chrome");
    });
});

describe("loader.js shim registration", () => {
    /**
     * Runs loader.js far enough to capture the object it passes to
     * requirejs.config(), so these assertions read the real configuration.
     * @returns {Object} The captured configuration object.
     */
    const captureRequireConfig = () => {
        let captured = null;
        const scope = {
            requirejs: { config: cfg => (captured = cfg), defined: () => false },
            define: () => {},
            location: { protocol: "https:" }
        };
        scope.window = scope;
        vm.createContext(scope);
        try {
            vm.runInContext(fs.readFileSync(LOADER, "utf8"), scope, { filename: LOADER });
        } catch (e) {
            // loader.js continues into a bootstrap needing real RequireJS after
            // calling config(); only the captured config matters here.
        }
        return captured;
    };

    it("registers utils/browser-utils with BrowserUtils as its export", () => {
        expect(captureRequireConfig().shim["utils/browser-utils"]).toEqual({
            exports: "BrowserUtils"
        });
    });

    it("orders browser-utils ahead of utils/utils via its deps", () => {
        expect(captureRequireConfig().shim["utils/utils"].deps).toContain("utils/browser-utils");
    });
});
