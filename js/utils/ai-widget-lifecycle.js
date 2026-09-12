/**
 * @license
 * MusicBlocks v3.4.1
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published
 * by the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @file Shared async lifecycle helper for chat widgets (Reflection, AI Debugger).
 *
 * Tracks widget mount state and in-flight backend requests so late or stale
 * responses never update a closed widget, and pending requests are aborted
 * on close or reset. Both widgets delegate their cleanup here instead of
 * duplicating the same machinery.
 *
 * Mount state alone is not enough: these widgets are reused across opens, so
 * a request started before a close can settle after the widget reopens and
 * find the lifecycle active again. Each mount therefore gets a generation
 * number that async work captures before it awaits and rechecks afterwards.
 */

/* global module, window */

/**
 * Creates the shared lifecycle tracker for a widget.
 * @param {Object} widget - The widget instance that owns this tracker.
 * @param {Function} isActive - Callback returning true while the widget can still update UI.
 * @returns {Object} The lifecycle tracker.
 */
function createWidgetLifecycle(widget, isActive) {
    const pendingRequests = new Set();

    return {
        /**
         * Controllers for in-flight requests, so they can be inspected or aborted.
         * @type {Set<AbortController>}
         */
        pendingRequests,

        /**
         * Tracks whether the widget is still mounted and safe to update.
         * @type {boolean}
         */
        isMounted: false,

        /**
         * Identifies the current mount. Bumped on every mount and unmount so
         * work started by an earlier mount can tell it no longer owns the widget.
         * @type {number}
         */
        generation: 0,

        /**
         * Marks the widget as mounted and starts a new generation.
         * @returns {number} The generation of this mount.
         */
        mount() {
            this.generation += 1;
            this.isMounted = true;
            return this.generation;
        },

        /**
         * Marks the widget as unmounted and retires the current generation.
         * @returns {void}
         */
        unmount() {
            this.generation += 1;
            this.isMounted = false;
        },

        /**
         * Returns true while the caller still belongs to the mount it started in.
         * Callers capture the generation before awaiting and pass it back here
         * afterwards, so a reopened widget is left alone.
         * @param {number} generation - Generation captured before the await.
         * @returns {boolean}
         */
        isSameMount(generation) {
            return this.generation === generation;
        },

        /**
         * Returns true while the widget is mounted and can safely update UI.
         * @returns {boolean}
         */
        isWidgetActive() {
            return this.isMounted && Boolean(isActive());
        },

        /**
         * Aborts all in-flight requests.
         * @returns {void}
         */
        abortPendingRequests() {
            pendingRequests.forEach(controller => controller.abort());
            pendingRequests.clear();
        },

        /**
         * Sends a POST request while tracking widget lifecycle and cancellation.
         * Aborts the request after timeoutMs so a stalled backend cannot block
         * the widget indefinitely.
         * @param {string} url - The endpoint URL.
         * @param {Object} payload - The JSON body.
         * @param {number} [timeoutMs] - Request timeout in milliseconds.
         * @param {string} [errorMessage] - Value returned on network failure or timeout.
         * @param {boolean} [throwOnError] - Throw on failure instead of returning errorMessage.
         * @returns {Promise<Object|null>}
         */
        async postJSON(url, payload, timeoutMs, errorMessage, throwOnError) {
            const controller =
                typeof AbortController !== "undefined" ? new AbortController() : null;
            let timeoutId = null;
            let timedOut = false;

            if (controller) {
                pendingRequests.add(controller);
            }

            try {
                const request = {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                };

                if (controller) {
                    request.signal = controller.signal;

                    if (timeoutMs) {
                        timeoutId = setTimeout(() => {
                            timedOut = true;
                            controller.abort();
                        }, timeoutMs);
                    }
                }

                const response = await fetch(url, request);

                if (throwOnError && !response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;
            } catch (error) {
                if (error && error.name === "AbortError") {
                    if (throwOnError && timedOut) {
                        throw error;
                    }

                    return timedOut && !throwOnError ? { error: errorMessage } : null;
                }

                if (throwOnError) {
                    throw error;
                }

                console.error("Error :", error);
                return { error: errorMessage };
            } finally {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                }

                if (controller) {
                    pendingRequests.delete(controller);
                }
            }
        }
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { createWidgetLifecycle };
} else if (typeof window !== "undefined") {
    window.createWidgetLifecycle = createWidgetLifecycle;
}
