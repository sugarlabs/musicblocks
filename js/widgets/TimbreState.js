/**
 * MusicBlocks
 *
 * @copyright 2017-21 Walter Bender
 * @copyright 2017 Tayba Wasim
 * @copyright 2017 Prachi Agrawal
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

/*
   global

   ManagedTimer
 */

/* exported TimbreState */

/**
 * @file TimbreState.js
 * @description Timbre widget state, timer management, and active panel tracking.
 *
 * The methods are installed onto TimbreWidget.prototype (see TimbreWidget.installModules),
 * so `this` inside them refers to the TimbreWidget instance.
 */
class TimbreState {
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
     * Clears all timers owned by the widget lifecycle.
     * @private
     * @returns {number} Number of tracked timers cleared.
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
        this._previewTimerId = null;

        return count;
    }

    /**
     * @private
     * Marks a single panel as the active one, clearing all others first.
     * @param {string} name - key into isActive/activeParams for the panel to activate.
     * @returns {void}
     */
    _setActiveExclusive(name) {
        for (let i = 0; i < this.activeParams.length; i++) {
            this.isActive[this.activeParams[i]] = false;
        }

        this.isActive[name] = true;
    }
}

if (typeof window !== "undefined") {
    window.TimbreState = TimbreState;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TimbreState;
}
