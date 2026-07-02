// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* exported PubSub, pubsub */

class PubSub {
    constructor() {
        this._listeners = Object.create(null);
    }

    on(eventName, listener) {
        if (!this._listeners[eventName]) {
            this._listeners[eventName] = [];
        }
        this._listeners[eventName].push(listener);
    }

    off(eventName, listener) {
        const list = this._listeners[eventName];
        if (!list) return;
        const idx = list.indexOf(listener);
        if (idx !== -1) {
            // Only the first matching reference is removed; duplicates registered
            // via multiple on() calls each require a separate off() call.
            list.splice(idx, 1);
        }
    }

    emit(eventName, payload) {
        const list = this._listeners[eventName];
        if (!list) return;
        // Snapshot the list so mid-iteration mutations (add/remove) do not affect this cycle.
        const snapshot = list.slice();
        for (const fn of snapshot) {
            fn(payload);
        }
    }

    once(eventName, listener) {
        const wrapper = payload => {
            this.off(eventName, wrapper);
            listener(payload);
        };
        this.on(eventName, wrapper);
        return wrapper;
    }

    clear(eventName) {
        if (eventName !== undefined) {
            delete this._listeners[eventName];
        } else {
            this._listeners = Object.create(null);
        }
    }
}

const pubsub = new PubSub();

if (typeof define === "function" && define.amd) {
    define(function () {
        // pubsub (the singleton) is exposed as a browser global for future callers.
        // PubSub (the class) is not assigned to window because external scripts
        // consume the shared singleton rather than constructing their own instances.
        window.pubsub = pubsub;
        return { PubSub, pubsub };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { PubSub, pubsub };
}
