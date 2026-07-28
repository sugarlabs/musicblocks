// Copyright (c) 2026 Harihara Vardhan
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

/*
   exported

   NetworkMonitor
*/

/**
 * NetworkMonitor
 *
 * Detects real internet / backend connectivity — NOT just navigator.onLine.
 *
 * Problem with navigator.onLine:
 *   On localhost, navigator.onLine is always true even when WiFi is off,
 *   because the browser can still reach 127.0.0.1. This made the offline
 *   code path unreachable during local development.
 *
 * Solution:
 *   A lightweight fetch probe is sent to the backend's /health endpoint
 *   (4-second timeout, no-cors). If it succeeds → online. If it throws
 *   (network error, timeout, CORS block) → offline.
 *   Probes fire on construction, on every browser online/offline event,
 *   and every 30 seconds in the background.
 *
 * Public API (unchanged):
 *   monitor.isOnline       → boolean (cached probe result)
 *   monitor.destroy()      → removes listeners and stops polling
 *
 * @param {Function} [onOnline]   called when connectivity is gained
 * @param {Function} [onOffline]  called when connectivity is lost
 * @param {string}   [probeUrl]   URL to probe (default: backend /health)
 */
class NetworkMonitor {
    /**
     * @param {Function} [onOnline]   called when browser goes online
     * @param {Function} [onOffline]  called when browser goes offline
     * @param {string}   [probeUrl]   override the probe target URL
     */
    constructor(onOnline, onOffline, probeUrl) {
        this._onOnline = onOnline || (() => {});
        this._onOffline = onOffline || (() => {});

        // Build the probe URL from env.js or fall back to the default backend
        const backendBase =
            typeof window !== "undefined" && window.MB_GIT_BACKEND_URL
                ? window.MB_GIT_BACKEND_URL.replace(/\/$/, "")
                : "http://localhost:5001";
        this._probeUrl = probeUrl || `${backendBase}/health`;

        // Cached state — start optimistic so the first real probe decides
        this._online = navigator.onLine;

        // Browser online/offline events — re-probe immediately on change
        this._handleOnline = () => this._probe();
        this._handleOffline = () => this._probe();
        window.addEventListener("online", this._handleOnline);
        window.addEventListener("offline", this._handleOffline);

        // Periodic probe every 30 s — keeps the cached state fresh
        this._pollInterval = setInterval(() => this._probe(), 30_000);

        // Initial probe (don't await — result fires callbacks asynchronously)
        this._probe();
    }

    // ── Real connectivity probe ────────────────────────────────────────────

    /**
     * Sends a HEAD request to the probe URL with a 4-second timeout.
     * Updates the cached state and fires the appropriate callback if it changed.
     * @returns {Promise<boolean>}
     */
    async _probe() {
        let nowOnline;
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 4000);
            await fetch(this._probeUrl, {
                method: "HEAD",
                cache: "no-store",
                signal: controller.signal
            });
            clearTimeout(timer);
            nowOnline = true;
        } catch (_) {
            // fetch throws on network error OR abort (timeout) → offline
            nowOnline = false;
        }

        if (nowOnline !== this._online) {
            this._online = nowOnline;
            console.debug(
                `[NetworkMonitor] ${nowOnline ? "Online ✔" : "Offline ✘"} (probe: ${this._probeUrl})`
            );
            if (nowOnline) {
                this._onOnline();
            } else {
                this._onOffline();
            }
        }

        return nowOnline;
    }

    // ── Public API ─────────────────────────────────────────────────────────

    /**
     * Returns the last known connectivity state.
     * Updated by the periodic probe and browser events.
     * @returns {boolean}
     */
    get isOnline() {
        return this._online;
    }

    /**
     * Forces a fresh probe and returns the result.
     * Useful when you need an up-to-date answer before an important action.
     * @returns {Promise<boolean>}
     */
    forceProbe() {
        return this._probe();
    }

    /**
     * Removes event listeners and stops the polling interval.
     * Call when the monitor is no longer needed.
     */
    destroy() {
        window.removeEventListener("online", this._handleOnline);
        window.removeEventListener("offline", this._handleOffline);
        clearInterval(this._pollInterval);
    }
}

// Export for Jest tests
if (typeof module !== "undefined" && module.exports) {
    module.exports = NetworkMonitor;
}
