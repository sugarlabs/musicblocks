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
 * MA 02110-1335 USA.
 */

/* exported ensureABCJS */

/**
 * Ensures the ABCJS library is loaded before proceeding.
 * Dynamically appends the script tag if not already present.
 * @returns {Promise<void>}
 */
function ensureABCJS() {
    if (typeof window !== "undefined" && window.ABCJS) {
        return Promise.resolve();
    }

    if (typeof window === "undefined") {
        return Promise.resolve();
    }

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

if (typeof module !== "undefined" && module.exports) {
    module.exports = ensureABCJS;
}
