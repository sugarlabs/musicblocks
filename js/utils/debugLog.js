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
 * Enable debug output by running this in the browser console:
 *   localStorage.setItem('MB_DEBUG', 'true');  // then reload
 *
 * Disable with:
 *   localStorage.removeItem('MB_DEBUG');       // then reload
 *
 * `console.error` and `console.warn` are intentionally left unchanged —
 * they carry actionable information that should always surface.
 *
 * @type {(...args: unknown[]) => void}
 */
const debugLog = (() => {
    try {
        if (typeof localStorage !== "undefined" && localStorage.getItem("MB_DEBUG") === "true") {
            return console.log.bind(console, "[MB]");
        }
    } catch (_) {
        // localStorage may be unavailable in restricted environments
    }
    return () => {};
})();
