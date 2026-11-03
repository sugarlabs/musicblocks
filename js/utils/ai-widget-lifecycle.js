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

/* global module, window, _ */

/**
 * Whether the child agreed to send their project to the AI server. Reflection
 * and the AI Debugger read the same flag, so a child agrees once for both. It
 * lives only in the page, so a reload asks again.
 * @type {{given: boolean}}
 */
const aiWidgetConsent = { given: false };

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
         * Returns true once the child agreed, in either AI widget, to send
         * their project to the server.
         * @returns {boolean}
         */
        hasConsent() {
            return aiWidgetConsent.given;
        },

        /**
         * Records that the child agreed to send their project to the server.
         * @returns {void}
         */
        giveConsent() {
            aiWidgetConsent.given = true;
        },

        /**
         * The id of the project open now. It changes when the child starts a
         * new project or opens another one, so a widget can tell that its
         * conversation was about a different project.
         * @returns {string|undefined} The id, or undefined before Planet loads.
         */
        projectId() {
            const planet = widget.activity && widget.activity.planet;
            if (!planet || typeof planet.getCurrentProjectID !== "function") return undefined;
            return planet.getCurrentProjectID();
        },

        /**
         * Shows the banner that asks before anything is sent to the server.
         * Both widgets use it, so the question looks the same in each.
         * @param {HTMLElement} container - The widget's chat log.
         * @param {Object} options
         * @param {string} options.classPrefix - Widget name for the banner's classes.
         * @param {string} options.text - What the widget sends, ending before the URL.
         * @param {string} options.url - The server the project goes to.
         * @param {Function} options.onAgree - Sends the waiting request.
         * @param {Function} options.onDecline - Tells the child that nothing was sent.
         * @returns {HTMLElement} The banner.
         */
        showConsentBanner(container, options) {
            // Pressing again while the banner is up would stack a second one.
            for (const old of container.querySelectorAll(
                `.${options.classPrefix}-consent-banner`
            )) {
                old.remove();
            }

            const banner = document.createElement("div");
            banner.className = `${options.classPrefix}-consent-banner`;
            banner.style.padding = "16px 20px";
            banner.style.margin = "12px";
            banner.style.borderRadius = "12px";
            banner.style.backgroundColor = "var(--color-warning-bg)";
            banner.style.border = "1px solid var(--color-border-primary)";
            banner.style.color = "var(--color-text-primary)";
            banner.style.fontSize = "13px";
            banner.style.lineHeight = "1.5";

            const title = document.createElement("div");
            title.style.fontWeight = "bold";
            title.style.marginBottom = "8px";
            title.style.fontSize = "14px";
            title.textContent = _("Before we start");

            const body = document.createElement("div");
            body.style.marginBottom = "12px";
            body.textContent = options.text;

            const urlSpan = document.createElement("strong");
            urlSpan.textContent = options.url;
            body.appendChild(urlSpan);

            // Agreeing here also lets the other AI widget send, so the child
            // is told before agreeing, not after.
            const shared = document.createElement("div");
            shared.textContent = _(
                "Agreeing counts for all the AI tools until you reload the page."
            );
            body.appendChild(shared);

            const btnRow = document.createElement("div");
            btnRow.style.display = "flex";
            btnRow.style.gap = "8px";
            btnRow.style.marginTop = "4px";

            const acceptBtn = document.createElement("button");
            acceptBtn.textContent = _("Agree and continue");
            acceptBtn.style.padding = "8px 16px";
            acceptBtn.style.border = "none";
            acceptBtn.style.borderRadius = "6px";
            acceptBtn.style.backgroundColor = "#198754";
            acceptBtn.style.color = "white";
            acceptBtn.style.cursor = "pointer";
            acceptBtn.style.fontSize = "13px";
            acceptBtn.style.fontWeight = "600";

            const declineBtn = document.createElement("button");
            declineBtn.className = `cancel-button ${options.classPrefix}-cancel-btn`;
            declineBtn.textContent = _("Cancel");
            declineBtn.style.padding = "8px 16px";
            declineBtn.style.border = "1px solid var(--color-border-primary)";
            declineBtn.style.borderRadius = "6px";
            declineBtn.style.backgroundColor = "var(--color-bg-primary)";
            declineBtn.style.color = "var(--color-text-primary)";
            declineBtn.style.cursor = "pointer";
            declineBtn.style.fontSize = "13px";

            acceptBtn.onclick = () => {
                this.giveConsent();
                banner.remove();
                options.onAgree();
            };

            declineBtn.onclick = () => {
                banner.remove();
                options.onDecline();
            };

            btnRow.appendChild(acceptBtn);
            btnRow.appendChild(declineBtn);
            banner.appendChild(title);
            banner.appendChild(body);
            banner.appendChild(btnRow);
            container.appendChild(banner);
            return banner;
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
                    const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                    // The server says what went wrong in the reply, such as a
                    // rate limit, so the widget can show that instead.
                    try {
                        error.reply = await response.json();
                    } catch (parseError) {
                        // A proxy's error page is not JSON, so there is no reason to show.
                        error.reply = null;
                    }
                    throw error;
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
    module.exports = { createWidgetLifecycle, aiWidgetConsent };
} else if (typeof window !== "undefined") {
    window.createWidgetLifecycle = createWidgetLifecycle;
}
