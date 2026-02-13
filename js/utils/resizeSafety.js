// Copyright (c) 2014-2026 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * Resize Safety Utilities
 * 
 * Prevents app crash/freeze caused by layout recalculation when canvas/container
 * dimensions temporarily become 0×0 during:
 * - DevTools open/close
 * - Rapid viewport resize
 * - Browser tab switch (visibility change)
 * - Background/foreground transitions
 * 
 * Issue: #5602
 */

/* global define */

define(function () {
    /**
     * Validates that dimensions are safe for layout calculations.
     * Guards against 0×0 dimensions and non-finite values that cause:
     * - Division-by-zero errors
     * - ResizeObserver loop limit exceeded
     * - Main-thread freeze
     * 
     * @param {number} width - Width to validate
     * @param {number} height - Height to validate
     * @returns {boolean} true if dimensions are safe for layout calculations
     */
    function areDimensionsValid(width, height) {
        // Immediately reject if width or height is 0
        if (width === 0 || height === 0) {
            return false;
        }

        // Reject non-finite values (NaN, Infinity, -Infinity)
        if (!Number.isFinite(width) || !Number.isFinite(height)) {
            return false;
        }

        // All checks passed - dimensions are safe
        return true;
    }

    /**
     * Creates a debounced version of a function.
     * Ensures the function is only called once after a series of rapid invocations.
     * 
     * This prevents:
     * - Resize storms
     * - ResizeObserver feedback loops
     * - Layout thrashing
     * 
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds (default: 100ms)
     * @returns {Function} Debounced function
     */
    function debounce(func, delay = 100) {
        let timeoutId = null;

        return function debounced(...args) {
            // Cancel previous pending execution
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }

            // Schedule new execution
            timeoutId = setTimeout(() => {
                timeoutId = null;
                func.apply(this, args);
            }, delay);
        };
    }

    /**
     * Manages layout suspension during tab visibility changes.
     * Prevents layout calculations when tab is hidden and triggers
     * a single safe recalculation when tab becomes visible again.
     */
    class VisibilityManager {
        constructor() {
            this.isTabHidden = document.hidden || false;
            this.layoutSuspended = false;
            this.onVisibilityChangeCallback = null;
            this.boundHandleVisibilityChange = this._handleVisibilityChange.bind(this);
        }

        /**
         * Internal handler for visibility change events
         * @private
         */
        _handleVisibilityChange() {
            this.isTabHidden = document.hidden;

            if (this.isTabHidden) {
                // Tab is now hidden - suspend layout
                this.layoutSuspended = true;
            } else {
                // Tab is now visible - resume layout
                this.layoutSuspended = false;

                // Trigger a single safe layout recalculation if callback is set
                if (this.onVisibilityChangeCallback) {
                    // Use requestAnimationFrame to avoid synchronous layout during visibility change
                    requestAnimationFrame(() => {
                        if (this.onVisibilityChangeCallback) {
                            this.onVisibilityChangeCallback();
                        }
                    });
                }
            }
        }

        /**
         * Initializes visibility change listener
         * @param {Function} callback - Function to call when tab becomes visible
         */
        init(callback) {
            this.onVisibilityChangeCallback = callback;
            document.addEventListener("visibilitychange", this.boundHandleVisibilityChange);
        }

        /**
         * Cleans up visibility change listener
         */
        cleanup() {
            document.removeEventListener("visibilitychange", this.boundHandleVisibilityChange);
            this.onVisibilityChangeCallback = null;
        }

        /**
         * Checks if layout should be suspended
         * @returns {boolean} true if layout should be suspended
         */
        shouldSuspendLayout() {
            return this.layoutSuspended;
        }
    }

    // Return public API
    return {
        areDimensionsValid: areDimensionsValid,
        debounce: debounce,
        VisibilityManager: VisibilityManager
    };
});
