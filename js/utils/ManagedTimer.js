// Copyright (c) 2025 Music Blocks Contributors
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
   exported ManagedTimer
*/

/**
 * @class ManagedTimer
 * @classdesc A centralized timer management system that wraps setTimeout/setInterval
 * with automatic tracking, cancellation support, and zombie-timer prevention.
 *
 * Problem: The Logo execution engine dispatches dozens of setTimeout calls for turtle
 * graphics animations (forward, right, arc, etc.) during note playback. When the user
 * presses "Stop", doStopTurtles() sets stopTurtle=true but all already-dispatched
 * timers continue to fire — causing ghost turtle movements, phantom sounds, stale
 * block highlighting, and potential state corruption if a new program starts while
 * old timers are still running.
 *
 * Solution: Every setTimeout in the execution engine is routed through ManagedTimer,
 * which tracks all pending timer IDs. On stop, clearAll() cancels every pending timer
 * in one sweep. Additionally, each managed callback includes a guard check against
 * an aborted() predicate, providing defense-in-depth even if a timer ID somehow
 * escapes the tracking set.
 *
 * @example
 * const timer = new ManagedTimer();
 *
 * // Set a timeout that will be automatically tracked
 * timer.setTimeout(() => turtle.doForward(10), 500);
 *
 * // Set a guarded timeout — callback is skipped if aborted() returns true
 * timer.setGuardedTimeout(() => turtle.doForward(10), 500, () => logo.stopTurtle);
 *
 * // Cancel all pending timers (e.g., when the user presses Stop)
 * timer.clearAll();
 *
 * // Get the count of active timers (useful for debugging)
 * console.log(timer.activeCount); // 0
 */
class ManagedTimer {
    constructor() {
        /**
         * Set of currently active (pending) timer IDs.
         * @type {Set<number>}
         * @private
         */
        this._activeTimers = new Map();

        /**
         * Set of currently active interval IDs.
         * @type {Set<number>}
         * @private
         */
        this._activeIntervals = new Map();

        /**
         * Tracks whether managed execution is currently paused.
         * @type {boolean}
         */
        this._isPaused = false;

        /**
         * Internal ID counter used to track timer metadata separately from native IDs.
         * @type {number}
         * @private
         */
        this._nextTimerId = 1;

        /**
         * Total number of timers created over the lifetime of this instance.
         * Useful for diagnostics and testing.
         * @type {number}
         */
        this.totalCreated = 0;

        /**
         * Total number of timers that were cancelled (via clearAll or clearTimeout).
         * @type {number}
         */
        this.totalCancelled = 0;

        /**
         * Total number of timers that fired their callbacks successfully.
         * @type {number}
         */
        this.totalFired = 0;

        /**
         * Total number of timer callbacks that were suppressed by the guard predicate.
         * @type {number}
         */
        this.totalSuppressed = 0;
    }

    /**
     * The number of currently pending (active) timers.
     * @returns {number}
     */
    get activeCount() {
        return this._activeTimers.size + this._activeIntervals.size;
    }

    /**
     * The number of currently pending setTimeout timers.
     * @returns {number}
     */
    get activeTimeoutCount() {
        return this._activeTimers.size;
    }

    /**
     * The number of currently pending setInterval timers.
     * @returns {number}
     */
    get activeIntervalCount() {
        return this._activeIntervals.size;
    }

    /**
     * Schedule a callback after a delay, with automatic tracking.
     * The timer ID is added to the active set and removed when the callback
     * fires or when the timer is cancelled.
     *
     * @param {Function} callback - The function to call after the delay.
     * @param {number} [delay=0] - Milliseconds to wait before calling the callback.
     * @returns {number} The timer ID (can be passed to clearTimeout).
     */
    setTimeout(callback, delay = 0) {
        this.totalCreated++;
        const id = this._nextTimerId++;
        const entry = {
            callback,
            guard: null,
            delay,
            nativeId: null,
            startedAt: 0
        };

        this._activeTimers.set(id, entry);
        this._scheduleTimeout(id, entry, delay);
        return id;
    }

    /**
     * Schedule a callback after a delay, with a guard predicate.
     * Before executing the callback, the guard function is checked.
     * If it returns true, the callback is silently suppressed.
     *
     * This provides defense-in-depth: even if clearAll() misses a timer
     * (e.g., due to a race condition), the guard prevents the callback
     * from executing on a stale/stopped execution context.
     *
     * @param {Function} callback - The function to call after the delay.
     * @param {number} delay - Milliseconds to wait before calling the callback.
     * @param {Function} aborted - A predicate that returns true if the callback
     *                             should be suppressed (e.g., () => logo.stopTurtle).
     * @returns {number} The timer ID.
     */
    setGuardedTimeout(callback, delay, aborted) {
        this.totalCreated++;
        const id = this._nextTimerId++;
        const entry = {
            callback,
            guard: aborted,
            delay,
            nativeId: null,
            startedAt: 0
        };

        this._activeTimers.set(id, entry);
        this._scheduleTimeout(id, entry, delay);
        return id;
    }

    /**
     * Schedule a repeating callback with automatic tracking.
     *
     * @param {Function} callback - The function to call on each interval tick.
     * @param {number} interval - Milliseconds between each call.
     * @returns {number} The interval ID.
     */
    setInterval(callback, interval) {
        this.totalCreated++;
        const id = this._nextTimerId++;
        const entry = {
            callback,
            guard: null,
            interval,
            nativeId: null,
            remaining: interval,
            startedAt: 0
        };

        this._activeIntervals.set(id, entry);
        this._scheduleInterval(id, entry, interval);
        return id;
    }

    /**
     * Schedule a repeating callback with a guard predicate.
     * If the guard returns true on any tick, the interval is automatically
     * cleared and no further callbacks fire.
     *
     * @param {Function} callback - The function to call on each interval tick.
     * @param {number} interval - Milliseconds between each call.
     * @param {Function} aborted - A predicate; if true, the interval self-destructs.
     * @returns {number} The interval ID.
     */
    setGuardedInterval(callback, interval, aborted) {
        this.totalCreated++;
        const id = this._nextTimerId++;
        const entry = {
            callback,
            guard: aborted,
            interval,
            nativeId: null,
            remaining: interval,
            startedAt: 0
        };

        this._activeIntervals.set(id, entry);
        this._scheduleInterval(id, entry, interval);
        return id;
    }

    /**
     * Cancel a specific tracked timeout.
     *
     * @param {number} id - The timer ID returned by setTimeout.
     * @returns {boolean} True if the timer was found and cancelled, false otherwise.
     */
    clearTimeout(id) {
        const entry = this._activeTimers.get(id);
        if (entry) {
            clearTimeout(entry.nativeId);
            this._activeTimers.delete(id);
            this.totalCancelled++;
            return true;
        }
        return false;
    }

    /**
     * Cancel a specific tracked interval.
     *
     * @param {number} id - The interval ID returned by setInterval.
     * @returns {boolean} True if the interval was found and cancelled, false otherwise.
     */
    clearInterval(id) {
        const entry = this._activeIntervals.get(id);
        if (entry) {
            clearTimeout(entry.nativeId);
            this._activeIntervals.delete(id);
            this.totalCancelled++;
            return true;
        }
        return false;
    }

    /**
     * Cancel ALL pending timers and intervals.
     * This is the primary mechanism for preventing zombie timers on stop.
     *
     * @returns {number} The number of timers/intervals that were cancelled.
     */
    clearAll() {
        let count = 0;

        for (const entry of this._activeTimers.values()) {
            clearTimeout(entry.nativeId);
            count++;
        }
        this._activeTimers.clear();

        for (const entry of this._activeIntervals.values()) {
            clearTimeout(entry.nativeId);
            count++;
        }
        this._activeIntervals.clear();
        this._isPaused = false;

        this.totalCancelled += count;
        return count;
    }

    /**
     * Pause all managed timers without discarding their remaining time.
     *
     * @returns {number} The number of active timers and intervals paused.
     */
    pauseAll() {
        if (this._isPaused) {
            return this.activeCount;
        }

        const now = Date.now();
        let count = 0;

        for (const entry of this._activeTimers.values()) {
            clearTimeout(entry.nativeId);
            entry.delay = Math.max(0, entry.delay - (now - entry.startedAt));
            entry.nativeId = null;
            count++;
        }

        for (const entry of this._activeIntervals.values()) {
            clearTimeout(entry.nativeId);
            entry.remaining = Math.max(0, entry.remaining - (now - entry.startedAt));
            entry.nativeId = null;
            count++;
        }

        this._isPaused = true;
        return count;
    }

    /**
     * Resume all previously paused managed timers.
     *
     * @returns {number} The number of timers and intervals resumed.
     */
    resumeAll() {
        if (!this._isPaused) {
            return this.activeCount;
        }

        let count = 0;

        for (const [id, entry] of this._activeTimers.entries()) {
            this._scheduleTimeout(id, entry, entry.delay);
            count++;
        }

        for (const [id, entry] of this._activeIntervals.entries()) {
            this._scheduleInterval(id, entry, entry.remaining);
            count++;
        }

        this._isPaused = false;
        return count;
    }

    /**
     * Reset all diagnostic counters to zero.
     * Does NOT cancel any pending timers.
     */
    resetStats() {
        this.totalCreated = 0;
        this.totalCancelled = 0;
        this.totalFired = 0;
        this.totalSuppressed = 0;
    }

    /**
     * Get a diagnostic snapshot of the timer manager state.
     *
     * @returns {{ active: number, created: number, cancelled: number, fired: number, suppressed: number }}
     */
    getStats() {
        return {
            active: this.activeCount,
            activeTimeouts: this.activeTimeoutCount,
            activeIntervals: this.activeIntervalCount,
            paused: this._isPaused,
            created: this.totalCreated,
            cancelled: this.totalCancelled,
            fired: this.totalFired,
            suppressed: this.totalSuppressed
        };
    }

    /**
     * Schedule a tracked timeout.
     *
     * @param {number} id
     * @param {Object} entry
     * @param {number} delay
     * @returns {void}
     * @private
     */
    _scheduleTimeout(id, entry, delay) {
        entry.delay = delay;
        entry.startedAt = Date.now();
        entry.nativeId = setTimeout(() => {
            if (!this._activeTimers.has(id)) {
                return;
            }

            this._activeTimers.delete(id);
            if (entry.guard && entry.guard()) {
                this.totalSuppressed++;
                return;
            }

            this.totalFired++;
            entry.callback();
        }, delay);
    }

    /**
     * Schedule the next tracked interval tick.
     *
     * @param {number} id
     * @param {Object} entry
     * @param {number} delay
     * @returns {void}
     * @private
     */
    _scheduleInterval(id, entry, delay) {
        entry.remaining = delay;
        entry.startedAt = Date.now();
        entry.nativeId = setTimeout(() => {
            if (!this._activeIntervals.has(id)) {
                return;
            }

            if (entry.guard && entry.guard()) {
                this._activeIntervals.delete(id);
                this.totalSuppressed++;
                return;
            }

            this.totalFired++;
            entry.callback();
            if (!this._activeIntervals.has(id)) {
                return;
            }

            this._scheduleInterval(id, entry, entry.interval);
        }, delay);
    }
}

// Export for both browser and Node.js/Jest environments
if (typeof module !== "undefined" && module.exports) {
    module.exports = ManagedTimer;
}

if (typeof window !== "undefined") {
    window.ManagedTimer = ManagedTimer;
}
