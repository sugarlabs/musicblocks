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

/*
   exported EventManager
*/

/**
 * Tracks DOM event listeners so Activity can clean them up reliably.
 */
class EventManager {
    constructor() {
        this._listeners = [];
    }

    /**
     * Returns the currently tracked listeners.
     * @returns {Object[]}
     */
    get listeners() {
        return this._listeners;
    }

    /**
     * Replaces the tracked listeners list.
     * @param {Object[]} listeners - New listener records.
     */
    set listeners(listeners) {
        this._listeners = Array.isArray(listeners) ? listeners : [];
    }

    /**
     * Attaches and tracks an event listener.
     * @param {EventTarget} target - Target to attach to.
     * @param {string} type - Event type.
     * @param {Function} listener - Listener callback.
     * @param {Object|boolean} [options] - Listener options.
     */
    addEventListener(target, type, listener, options) {
        if (!target || typeof target.addEventListener !== "function") {
            return;
        }

        target.addEventListener(type, listener, options);
        this._listeners.push({ target, type, listener, options });
    }

    /**
     * Removes and untracks an event listener.
     * @param {EventTarget} target - Target to detach from.
     * @param {string} type - Event type.
     * @param {Function} listener - Listener callback.
     * @param {Object|boolean} [options] - Listener options.
     */
    removeEventListener(target, type, listener, options) {
        if (!target || typeof target.removeEventListener !== "function") {
            return;
        }

        target.removeEventListener(type, listener, options);
        this._listeners = this._listeners.filter(
            registeredListener =>
                registeredListener.target !== target ||
                registeredListener.type !== type ||
                registeredListener.listener !== listener ||
                !this.areOptionsEqual(registeredListener.options, options)
        );
    }

    /**
     * Checks whether two listener option sets are equivalent for removal.
     * @param {Object|boolean} opt1 - First option set.
     * @param {Object|boolean} opt2 - Second option set.
     * @returns {boolean}
     */
    areOptionsEqual(opt1, opt2) {
        const getCapture = opt => {
            if (typeof opt === "boolean") {
                return opt;
            }

            if (typeof opt === "object" && opt !== null) {
                return !!opt.capture;
            }

            return false;
        };

        return getCapture(opt1) === getCapture(opt2);
    }

    /**
     * Removes all tracked listeners.
     */
    cleanup() {
        while (this._listeners.length > 0) {
            const { target, type, listener, options } = this._listeners.pop();

            if (target && typeof target.removeEventListener === "function") {
                target.removeEventListener(type, listener, options);
            }
        }
    }
}

if (typeof globalThis !== "undefined") {
    globalThis.EventManager = EventManager;
}

if (typeof define === "function" && define.amd) {
    define([], function () {
        return EventManager;
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = EventManager;
}
