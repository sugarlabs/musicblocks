/**
 * @license
 * MusicBlocks v3.4.1
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * @file Centralized error handling utility providing consistent logging
 * with structured context across the codebase.
 *
 * Methods:
 *   ErrorHandler.capture(error, context)   – unrecoverable errors (console.error)
 *   ErrorHandler.warn(message, context)      – warnings (console.warn)
 *   ErrorHandler.recoverable(error, context) – handled/recoverable errors (console.warn)
 *   ErrorHandler.userFacing(error, context, uiMessage) – errors + user-facing
 *                                                        notification
 *   ErrorHandler.getRecentErrors()           – recent structured error records
 *   ErrorHandler.clearRecentErrors()         – empty the recent error buffer
 *
 * Uncaught errors and unhandled rejections are routed through the same buffer
 * so repeated failures are counted instead of flooding the console.
 *
 * @author Music Blocks Contributors
 */

/* exported ErrorHandler */

const ErrorHandler = {
    _records: [],
    _counts: new Map(),
    _maxRecords: 50,
    _maxCounts: 200,
    _installed: false,
    _disposeGlobalHandlers: null,

    _truncate(value, max) {
        const text = String(value);
        return text.length > max ? text.slice(0, max) : text;
    },

    _frame(stack, source, line, column) {
        if (source) {
            return source + ":" + (line || 0) + ":" + (column || 0);
        }
        if (!stack) {
            return "";
        }
        const lines = String(stack).split("\n");
        for (let i = 0; i < lines.length; i++) {
            const text = lines[i].trim();
            if (text.indexOf("at ") !== 0) {
                continue;
            }
            if (text.indexOf("error-handler.js") !== -1) {
                continue;
            }
            return text;
        }
        return "";
    },

    _key(operation, message, frame) {
        return operation + "|" + message + "|" + frame;
    },

    _record(level, error, context) {
        try {
            const operation = context && context.operation ? String(context.operation) : "";
            const message = error && error.message ? String(error.message) : String(error);
            const stack = error && error.stack ? this._truncate(error.stack, 1000) : "";
            const source = context && context.source ? String(context.source) : "";
            const line = context && context.line ? Number(context.line) || 0 : 0;
            const column = context && context.column ? Number(context.column) || 0 : 0;
            const frame = this._frame(stack, source, line, column);
            const key = this._key(operation, message, frame);
            const existing = this._counts.get(key);

            if (existing && this._records.indexOf(existing) !== -1) {
                existing.count += 1;
                existing.lastSeen = new Date().toISOString();
                return { record: existing, isNew: false };
            }

            const timestamp = new Date().toISOString();
            const entry = {
                key,
                level,
                operation,
                message,
                stack,
                source,
                line,
                column,
                count: 1,
                firstSeen: timestamp,
                lastSeen: timestamp
            };

            this._records.push(entry);
            if (this._records.length > this._maxRecords) {
                const removed = this._records.shift();
                if (removed && removed.key) {
                    this._counts.delete(removed.key);
                }
            }
            this._counts.set(key, entry);
            if (this._counts.size > this._maxCounts) {
                const oldest = this._counts.keys().next();
                if (!oldest.done) {
                    this._counts.delete(oldest.value);
                }
            }

            return { record: entry, isNew: true };
        } catch (e) {
            return { record: null, isNew: true };
        }
    },

    _report(level, error, context) {
        const result = this._record(level, error, context);
        if (!result.isNew) {
            return result;
        }

        const prefix = context && context.operation ? "[" + context.operation + "]" : "";
        if (level === "recoverable") {
            console.warn("[Recoverable]", prefix, error, context || "");
        } else if (level === "warn") {
            console.warn(prefix, error, context || "");
        } else {
            console.error(prefix, error, context || "");
        }
        return result;
    },

    /**
     * Logs an unrecoverable error with structured context.
     * Use for failures that impact functionality and cannot be recovered.
     *
     * @param {Error|string} error - The error object or message string.
     * @param {Object} [context] - Optional context describing the operation.
     * @param {string} [context.operation] - Name of the operation that failed.
     */
    capture(error, context) {
        this._report("error", error, context);
    },

    /**
     * Logs a warning message with structured context.
     * Use for unexpected situations that were handled gracefully.
     *
     * @param {string} message - The warning message.
     * @param {Object} [context] - Optional context describing the situation.
     * @param {string} [context.operation] - Name of the related operation.
     */
    warn(message, context) {
        this._report("warn", message, context);
    },

    /**
     * Logs a recoverable error with structured context.
     * Use for errors that were caught and handled gracefully.
     *
     * @param {Error|string} error - The error object or message string.
     * @param {Object} [context] - Optional context describing the operation.
     * @param {string} [context.operation] - Name of the operation that recovered.
     */
    recoverable(error, context) {
        this._report("recoverable", error, context);
    },

    /**
     * Logs an error with structured context and shows a user-facing message.
     * Use for errors that both need to be logged and should be shown to the user.
     *
     * @param {Error|string} error - The error object or message string.
     * @param {Object} [context] - Optional context describing the operation.
     * @param {string} [context.operation] - Name of the operation that failed.
     * @param {string} [uiMessage] - User-facing error message to display via
     *   the Activity errorMsg mechanism.
     */
    userFacing(error, context, uiMessage) {
        this._report("error", error, context);

        if (uiMessage) {
            try {
                const activity =
                    typeof window !== "undefined" &&
                    window.ActivityContext &&
                    typeof window.ActivityContext.getActivity === "function"
                        ? window.ActivityContext.getActivity()
                        : null;
                if (activity && typeof activity.errorMsg === "function") {
                    activity.errorMsg(uiMessage);
                }
            } catch (e) {
                // Best-effort: do nothing if Activity is not available
            }
        }
    },

    getRecentErrors() {
        return this._records.slice();
    },

    clearRecentErrors() {
        this._records.length = 0;
        this._counts.clear();
    },

    _isNoise(filename, message) {
        if (filename && /^(chrome|moz|safari|edge)-extension:\/\//.test(filename)) {
            return true;
        }
        if (message && message.indexOf("ResizeObserver loop") === 0) {
            return true;
        }
        return false;
    },

    installGlobalHandlers() {
        if (typeof window === "undefined") {
            return function () {};
        }
        if (this._installed && this._disposeGlobalHandlers) {
            return this._disposeGlobalHandlers;
        }

        try {
            if (
                window.localStorage &&
                window.localStorage.getItem("MB_ERROR_BOUNDARY") === "false"
            ) {
                return function () {};
            }
        } catch (e) {
            // Ignore storage access failures; the boundary stays enabled.
        }

        if (typeof window.__MB_ERROR_HANDLER_DISPOSE__ === "function") {
            try {
                window.__MB_ERROR_HANDLER_DISPOSE__();
            } catch (e) {
                // Ignore failures from a stale disposer.
            }
        }

        const self = this;

        const onError = function (event) {
            const filename = event && event.filename ? String(event.filename) : "";
            const message = event && event.message ? String(event.message) : "Uncaught error";
            if (self._isNoise(filename, message)) {
                return;
            }
            self._report("uncaught", event && event.error ? event.error : new Error(message), {
                operation: "uncaught",
                source: filename,
                line: event && event.lineno ? event.lineno : 0,
                column: event && event.colno ? event.colno : 0
            });
        };

        const onRejection = function (event) {
            const reason = event && event.reason;
            const error = reason instanceof Error ? reason : new Error(String(reason));
            self._report("unhandledrejection", error, { operation: "unhandledrejection" });
        };

        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);

        const dispose = function () {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
            if (window.__MB_ERROR_HANDLER_DISPOSE__ === dispose) {
                delete window.__MB_ERROR_HANDLER_DISPOSE__;
            }
            self._installed = false;
            self._disposeGlobalHandlers = null;
        };

        window.__MB_ERROR_HANDLER_DISPOSE__ = dispose;
        window.__MB_ERROR_HANDLER_INSTALLED__ = true;
        this._installed = true;
        this._disposeGlobalHandlers = dispose;

        return dispose;
    },

    uninstallGlobalHandlers() {
        if (this._disposeGlobalHandlers) {
            this._disposeGlobalHandlers();
        }
    }
};

// Install once per page load. Tests and embedders can opt out via
// localStorage["MB_ERROR_BOUNDARY"] = "false".
if (typeof window !== "undefined" && !window.__MB_ERROR_HANDLER_INSTALLED__) {
    ErrorHandler.installGlobalHandlers();
}

// Ensure the global exists for the RequireJS shim (exports: "ErrorHandler")
if (typeof window !== "undefined") {
    window.ErrorHandler = ErrorHandler;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ErrorHandler;
}
