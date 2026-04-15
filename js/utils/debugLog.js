// Copyright (c) 2025 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   exported debugLog
*/

/**
 * Lightweight debug logger that is a no-op in production.
 *
 * In production every `console.log` call:
 *   1. Allocates strings for serialization.
 *   2. Retains references to logged objects in DevTools (preventing GC).
 *   3. Adds DOM nodes to the browser console panel, causing UI jank.
 *
 * Debug logging can be enabled in three ways (checked in order):
 *
 *   1. localStorage flag (highest priority):
 *        localStorage.setItem('MB_DEBUG', 'true');   // then reload
 *        localStorage.setItem('MB_DEBUG', 'false');  // force-disable
 *        localStorage.removeItem('MB_DEBUG');         // restore auto-detection
 *
 *   2. URL parameter:
 *        ?debug=true
 *      Example: http://localhost:8000/?debug=true
 *
 *   3. Auto-detection (lowest priority):
 *      Automatically enabled on localhost / 127.0.0.1.
 *
 * `console.error` and `console.warn` are intentionally left unchanged —
 * they carry actionable information that should always surface.
 *
 * @type {(...args: unknown[]) => void}
 */
const debugLog = (() => {
    try {
        // 1. Explicit opt-in / opt-out via localStorage takes highest priority.
        const flag = typeof localStorage !== "undefined" ? localStorage.getItem("MB_DEBUG") : null;

        if (flag === "true") {
            return console.log.bind(console, "[MB]");
        }
        if (flag === "false") {
            return () => {};
        }

        // 2. URL parameter: ?debug=true
        if (
            typeof window !== "undefined" &&
            window.location &&
            window.location.search.includes("debug=true")
        ) {
            return console.log.bind(console, "[MB]");
        }

        // 3. Auto-enable for local development (no flag set).
        const isDevMode =
            typeof location !== "undefined" &&
            (location.hostname === "localhost" || location.hostname === "127.0.0.1");

        if (isDevMode) {
            return console.log.bind(console, "[MB]");
        }
    } catch (_) {
        // localStorage / location may be unavailable in restricted environments
    }
    return () => {};
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = debugLog;
}
