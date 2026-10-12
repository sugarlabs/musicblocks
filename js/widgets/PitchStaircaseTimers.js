/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
 * @copyright 2016 Hemant Kasat
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

/* exported PitchStaircaseTimers */

/**
 * @file PitchStaircaseTimers.js
 * @description Pitch Staircase timers: setting and clearing the widget's timeouts through its
 * ManagedTimer, and cancelling every pending playback timer when the widget closes.
 *
 * The methods are moved as they were from the PitchStaircase class, which copies them onto
 * PitchStaircase.prototype (see PitchStaircase.installModules), so `this` is still the widget.
 */
class PitchStaircaseTimers {
    /**
     * Sets a timeout through the widget's ManagedTimer, so closing the widget can clear it.
     * @private
     * @param {Function} callback - Called when the timeout fires.
     * @param {number} delay - Delay in milliseconds.
     * @returns {number} The timeout id.
     */
    _setWidgetTimeout(callback, delay) {
        if (this._timerManager !== null) {
            return this._timerManager.setTimeout(callback, delay);
        }
        return setTimeout(callback, delay);
    }

    /**
     * Clears a timeout set with _setWidgetTimeout.
     * @private
     * @param {number|null|undefined} id - The timeout id.
     * @returns {boolean} Whether there was an id to clear.
     */
    _clearWidgetTimeout(id) {
        if (id === null || id === undefined) {
            return false;
        }
        if (this._timerManager !== null) {
            return this._timerManager.clearTimeout(id);
        }
        clearTimeout(id);
        return true;
    }

    /**
     * Cancels every pending playback timeout and resets the playback state. Used when the
     * widget window closes.
     * @private
     * @returns {void}
     */
    _cancelPlayback() {
        this._clearWidgetTimeout(this._rowStopTimeout);
        this._clearWidgetTimeout(this._playAllTimeout);
        this._clearWidgetTimeout(this._scaleStepTimeout);
        this._clearWidgetTimeout(this._scaleHighlightTimeout);
        if (this._timerManager !== null) {
            this._timerManager.clearAll();
        }
        this._rowStopTimeout = null;
        this._playAllTimeout = null;
        this._scaleStepTimeout = null;
        this._scaleHighlightTimeout = null;
        this._scaleStopped = true;
        this._isPlayingAll = false;
        this._isPlayingScale = false;
        this._playingRowIndex = null;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchStaircaseTimers;
}
