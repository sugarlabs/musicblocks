/**
 * @file Lazy loader for the ABCJS library.
 * @author Parth Dagia
 *
 * @copyright 2026 Parth Dagia
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of
 * the GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA
 */

/* exported ensureABCJS */

/**
 * Loads lib/abc.min.js through RequireJS and publishes the global.
 *
 * abcjs ships as a UMD bundle whose first branch is `define.amd`. Every caller of
 * ensureABCJS() runs on a user action, long after lib/require.js has installed a global
 * define() with define.amd set, so injecting the bundle as a plain <script> makes it register
 * an anonymous AMD module and never assign window.ABCJS. Letting RequireJS start the load
 * matches that anonymous define() to the "abcjs" module id, and the resolved export is
 * published as the global the rest of the code reads.
 * @returns {Promise<void>}
 */
function loadABCJSViaRequireJS() {
    return new Promise((resolve, reject) => {
        window.requirejs(
            ["abcjs"],
            abcjs => {
                window.ABCJS = abcjs;
                resolve();
            },
            reject
        );
    });
}

/**
 * Loads lib/abc.min.js with a script tag, for environments with no AMD loader present.
 * Without define.amd the UMD bundle falls through to assigning window.ABCJS itself.
 * @returns {Promise<void>}
 */
function loadABCJSViaScriptTag() {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src="lib/abc.min.js"]');

        if (existing) {
            if (existing.hasAttribute("data-loaded")) {
                resolve();
            } else {
                existing.addEventListener("load", resolve);
            }
            return;
        }

        const script = document.createElement("script");
        script.src = "lib/abc.min.js";

        script.onload = () => {
            script.setAttribute("data-loaded", "true");
            resolve();
        };

        script.onerror = reject;

        document.head.appendChild(script);
    });
}

/**
 * Ensures the ABCJS library is loaded before proceeding.
 * @returns {Promise<void>}
 */
function ensureABCJS() {
    if (typeof window === "undefined") {
        return Promise.resolve();
    }

    if (window.ABCJS) {
        return Promise.resolve();
    }

    return typeof window.requirejs === "function"
        ? loadABCJSViaRequireJS()
        : loadABCJSViaScriptTag();
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ensureABCJS;
}
