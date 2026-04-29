/**
 * MusicBlocks v3.6.2
 *
 * @author Music Blocks Contributors
 *
 * @copyright 2026 Music Blocks Contributors
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * Logger utility for Music Blocks
 * Provides centralized logging with environment-aware filtering
 */

const Logger = {
    /**
     * Determine if debug logging is enabled
     * @returns {boolean} true if debug mode is active
     */
    _isDebugEnabled() {
        return typeof window !== "undefined" && window.MB_IS_DEV === true;
    },

    /**
     * Log debug information (only in development)
     * @param {string} message - Debug message
     * @param {...any} args - Additional arguments
     */
    debug(message, ...args) {
        if (this._isDebugEnabled()) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    },

    /**
     * Log info messages (always shown)
     * @param {string} message - Info message
     * @param {...any} args - Additional arguments
     */
    info(message, ...args) {
        console.log(`[INFO] ${message}`, ...args);
    },

    /**
     * Log warning messages (always shown)
     * @param {string} message - Warning message
     * @param {...any} args - Additional arguments
     */
    warn(message, ...args) {
        console.warn(`[WARN] ${message}`, ...args);
    },

    /**
     * Log error messages (always shown)
     * @param {string} message - Error message
     * @param {...any} args - Additional arguments
     */
    error(message, ...args) {
        console.error(`[ERROR] ${message}`, ...args);
    },

    /**
     * Log time-based debug info (only in development)
     * @param {string} label - Timer label
     */
    time(label) {
        if (this._isDebugEnabled()) {
            console.time(`[TIMER] ${label}`);
        }
    },

    /**
     * End time-based debug info (only in development)
     * @param {string} label - Timer label (must match time() call)
     */
    timeEnd(label) {
        if (this._isDebugEnabled()) {
            console.timeEnd(`[TIMER] ${label}`);
        }
    }
};

// Export for module systems and also expose as global if in browser
if (typeof module !== "undefined" && module.exports) {
    module.exports = Logger;
}
if (typeof window !== "undefined") {
    window.Logger = Logger;
}
