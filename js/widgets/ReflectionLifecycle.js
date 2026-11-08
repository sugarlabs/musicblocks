/**
 * MusicBlocks
 *
 * @copyright 2025 Diwangshu Kakoty
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/* exported ReflectionLifecycle */

/**
 * @file ReflectionLifecycle.js
 * @description Reflection widget lifecycle: the timers the widget owns and the checks async work
 * uses to tell whether the widget is still open and still the same open.
 *
 * The methods are moved as they were from the ReflectionMatrix class, which copies them onto
 * ReflectionMatrix.prototype (see ReflectionMatrix.installModules), so `this` is still the
 * widget.
 */
class ReflectionLifecycle {
    /**
     * Schedules a timeout owned by the widget lifecycle.
     * @private
     * @param {Function} callback - Callback to run after the delay.
     * @param {number} delay - Delay in milliseconds.
     * @returns {number} Timer ID.
     */
    _setWidgetTimeout(callback, delay) {
        if (this._timerManager !== null) {
            return this._timerManager.setTimeout(callback, delay);
        }

        let id;
        id = setTimeout(() => {
            this._activeTimeouts.delete(id);
            callback();
        }, delay);
        this._activeTimeouts.add(id);
        return id;
    }

    /**
     * Clears a timeout owned by the widget lifecycle.
     * @private
     * @param {number} id - Timer ID returned by _setWidgetTimeout.
     * @returns {boolean} Whether the timeout was tracked and cleared.
     */
    _clearWidgetTimeout(id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null && this._timerManager.clearTimeout(id)) {
            return true;
        }

        if (this._activeTimeouts.has(id)) {
            clearTimeout(id);
            this._activeTimeouts.delete(id);
            return true;
        }

        return false;
    }

    /**
     * Schedules an interval owned by the widget lifecycle.
     * @private
     * @param {Function} callback - Callback to run repeatedly.
     * @param {number} interval - Interval in milliseconds.
     * @returns {number} Interval ID.
     */
    _setWidgetInterval(callback, interval) {
        if (this._timerManager !== null) {
            return this._timerManager.setInterval(callback, interval);
        }

        const id = setInterval(callback, interval);
        this._activeIntervals.add(id);
        return id;
    }

    /**
     * Clears an interval owned by the widget lifecycle.
     * @private
     * @param {number} id - Interval ID returned by _setWidgetInterval.
     * @returns {boolean} Whether the interval was tracked and cleared.
     */
    _clearWidgetInterval(id) {
        if (id === null || id === undefined) {
            return false;
        }

        if (this._timerManager !== null && this._timerManager.clearInterval(id)) {
            return true;
        }

        if (this._activeIntervals.has(id)) {
            clearInterval(id);
            this._activeIntervals.delete(id);
            return true;
        }

        return false;
    }

    /**
     * Clears all timers owned by the widget lifecycle.
     * @private
     * @returns {number} Number of tracked timers and intervals cleared.
     */
    _clearWidgetTimers() {
        let count = 0;

        if (this._timerManager !== null) {
            count += this._timerManager.clearAll();
        }

        for (const id of this._activeTimeouts) {
            clearTimeout(id);
            count++;
        }
        this._activeTimeouts.clear();

        for (const id of this._activeIntervals) {
            clearInterval(id);
            count++;
        }
        this._activeIntervals.clear();

        if (this.startChatTypingTimeout !== null) {
            this._clearWidgetTimeout(this.startChatTypingTimeout);
            this.startChatTypingTimeout = null;
        }

        if (this.dotsInterval !== null && this.dotsInterval !== undefined) {
            this._clearWidgetInterval(this.dotsInterval);
            this.dotsInterval = null;
        }

        return count;
    }

    /**
     * Returns true if the widget is still mounted and safe to update.
     * @returns {boolean}
     */
    _isWidgetActive() {
        return this._lifecycle.isWidgetActive();
    }

    /**
     * Returns true if the caller still belongs to the mount it started in.
     * Async work captures the generation before awaiting and passes it back
     * here, so a continuation from a previous open never touches a reopened
     * widget.
     * @param {number} generation - Generation captured before the await.
     * @returns {boolean}
     */
    _isSameMount(generation) {
        return this._lifecycle.isSameMount(generation);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ReflectionLifecycle;
}
