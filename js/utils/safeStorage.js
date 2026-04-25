// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* exported safeStorage */

/**
 * Safe localStorage wrapper that catches QuotaExceededError and falls
 * back to an in-memory object so the main thread never crashes on
 * low-storage devices.
 *
 * API mirrors the subset of Storage used by Music Blocks:
 *   safeStorage.setItem(key, value)
 *   safeStorage.getItem(key)
 *   safeStorage.removeItem(key)
 *   safeStorage.clear()
 */
var safeStorage = (function () {
    "use strict";

    /** @type {Object<string, string>} In-memory fallback store. */
    var _memFallback = {};

    /**
     * Returns true if the error is a storage-quota error.
     * @param {Error} e - The error object to check.
     * @returns {boolean} True if the error is a quota error, false otherwise.
     */
    function _isQuotaError(e) {
        return (
            e instanceof DOMException &&
            // Chrome / modern browsers
            (e.code === 22 ||
                e.code === 1014 ||
                e.name === "QuotaExceededError" ||
                // Firefox
                e.name === "NS_ERROR_DOM_QUOTA_REACHED")
        );
    }

    /**
     * Stores a key-value pair. Falls back to memory on quota errors.
     * @param {string} key - The key of the item to store.
     * @param {string} value - The value to store.
     */
    function setItem(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (e) {
            if (_isQuotaError(e)) {
                console.warn(
                    '[safeStorage] QuotaExceededError for key "' +
                        key +
                        '". Saving to in-memory fallback.'
                );
                _memFallback[key] = String(value);
            } else {
                // Re-throw non-quota errors (e.g. SecurityError in private mode)
                throw e;
            }
        }
    }

    /**
     * Retrieves a value. Checks native localStorage first, then memory.
     * @param {string} key - The key of the item to retrieve.
     * @returns {string|null} The value associated with the key, or null if not found.
     */
    function getItem(key) {
        try {
            var val = window.localStorage.getItem(key);
            if (val !== null) {
                return val;
            }
        } catch (_) {
            // localStorage inaccessible — fall through to memory
        }
        return _memFallback.hasOwnProperty(key) ? _memFallback[key] : null;
    }

    /**
     * Removes a key from both native localStorage and memory.
     * @param {string} key - The key of the item to remove.
     */
    function removeItem(key) {
        try {
            window.localStorage.removeItem(key);
        } catch (_) {
            // ignore
        }
        delete _memFallback[key];
    }

    /**
     * Clears both native localStorage and in-memory fallback.
     */
    function clear() {
        try {
            window.localStorage.clear();
        } catch (_) {
            // ignore
        }
        _memFallback = {};
    }

    return {
        setItem: setItem,
        getItem: getItem,
        removeItem: removeItem,
        clear: clear,
        /** @private Exposed only for testing. */
        _memFallback: _memFallback,
        /** @private Reset memory fallback (testing helper). */
        _resetMemFallback: function () {
            _memFallback = {};
        }
    };
})();

if (typeof module !== "undefined" && module.exports) {
    module.exports = safeStorage;
}
