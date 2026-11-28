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
 *   ErrorHandler.installGlobalHandlers()  – window error + rejection listeners (once)
 *   ErrorHandler.getRecentErrors()        – last 50 recorded errors
 *   ErrorHandler.debug(...args)           – debugLog wrapper
 *   ErrorHandler.info(...args)            – debugLog wrapper
 *
 * @author Music Blocks Contributors
 */

/* exported ErrorHandler */

const MAX_ERROR_RECORDS = 50;
const MAX_STACK_LENGTH = 1024;
const ERROR_LOG_KEY = "mb_error_log_v1";
const BOUNDARY_FLAG = "__mbErrorBoundaryInstalled";

const recentErrors = [];
const errorCounts = new Map();

/**
 * Runs a function, swallowing anything it throws.
 *
 * @param {Function} fn - Function to run.
 * @returns {*} The function result, or undefined.
 */
const safely = fn => {
    try {
        return fn();
    } catch (e) {
        return undefined;
    }
};

/**
 * Collects the environment metadata stored with each error record.
 *
 * @returns {Object} version, browser, language and mode.
 */
const errorMetadata = () => ({
    version: safely(() => window.VERSION) || "unknown",
    browser: safely(() => navigator.userAgent) || "unknown",
    language: safely(() => navigator.language) || "unknown",
    mode:
        safely(() => {
            const stored = localStorage.getItem("beginnerMode");
            if (stored === "true") return "beginner";
            if (stored === "false") return "advanced";
            return "unknown";
        }) || "unknown"
});

/**
 * Browser-extension frames and ResizeObserver reports are noise, not app bugs.
 *
 * @param {string} message - Error message.
 * @param {string} source - Source file URL.
 * @returns {boolean} True when the error should be ignored.
 */
const isIgnorableError = (message, source) =>
    /^[a-z-]+-extension:/i.test(source || "") || /ResizeObserver loop/i.test(message || "");

const isValidRecord = record =>
    record !== null &&
    typeof record === "object" &&
    typeof record.key === "string" &&
    record.key.length > 0 &&
    typeof record.kind === "string" &&
    typeof record.message === "string" &&
    typeof record.source === "string" &&
    Number.isFinite(record.line) &&
    Number.isFinite(record.column) &&
    typeof record.stack === "string" &&
    Number.isInteger(record.count) &&
    record.count > 0 &&
    Number.isFinite(record.firstSeen) &&
    Number.isFinite(record.lastSeen);

const persistErrors = () => {
    safely(() => sessionStorage.setItem(ERROR_LOG_KEY, JSON.stringify(recentErrors)));
};

const recordError = (kind, message, source, line, column, error) => {
    if (isIgnorableError(message, source)) return;

    const now = Date.now();
    const key = [kind, message, source || "", line || 0].join("|");
    const existing = errorCounts.get(key);

    if (existing) {
        existing.count += 1;
        existing.lastSeen = now;
        persistErrors();
        return;
    }

    const record = {
        key: key,
        kind: kind,
        message: String(message || "Unknown error"),
        source: source || "",
        line: line || 0,
        column: column || 0,
        stack: error && error.stack ? String(error.stack).slice(0, MAX_STACK_LENGTH) : "",
        count: 1,
        firstSeen: now,
        lastSeen: now,
        ...errorMetadata()
    };

    errorCounts.set(key, record);
    recentErrors.push(record);

    if (recentErrors.length > MAX_ERROR_RECORDS) {
        const dropped = recentErrors.shift();
        if (dropped) errorCounts.delete(dropped.key);
    }

    persistErrors();
    // Deduplicated repeats update the record instead of logging again.
    console.error("[GlobalError]", record.message, record);
};

const handleWindowError = event => {
    safely(() =>
        recordError("error", event.message, event.filename, event.lineno, event.colno, event.error)
    );
};

const handleUnhandledRejection = event => {
    safely(() => {
        const reason = event.reason;
        const message = reason && reason.message ? reason.message : String(reason);
        recordError("unhandledrejection", message, "", 0, 0, reason);
    });
};

safely(() => {
    const stored = JSON.parse(sessionStorage.getItem(ERROR_LOG_KEY) || "[]");
    if (!Array.isArray(stored)) return;

    stored.slice(-MAX_ERROR_RECORDS).forEach(record => {
        if (!isValidRecord(record)) return;
        recentErrors.push(record);
        errorCounts.set(record.key, record);
    });
});

const ErrorHandler = {
    /**
     * Logs an unrecoverable error with structured context.
     * Use for failures that impact functionality and cannot be recovered.
     *
     * @param {Error|string} error - The error object or message string.
     * @param {Object} [context] - Optional context describing the operation.
     * @param {string} [context.operation] - Name of the operation that failed.
     */
    capture(error, context) {
        const prefix = context && context.operation ? "[" + context.operation + "]" : "";
        console.error(prefix, error, context || "");
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
        const prefix = context && context.operation ? "[" + context.operation + "]" : "";
        console.warn(prefix, message, context || "");
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
        const prefix = context && context.operation ? "[" + context.operation + "]" : "";
        console.warn("[Recoverable]", prefix, error, context || "");
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
        const prefix = context && context.operation ? "[" + context.operation + "]" : "";
        console.error(prefix, error, context || "");

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

    /**
     * Installs the window error and unhandledrejection listeners once.
     * Disabled by localStorage MB_ERROR_BOUNDARY === "false".
     *
     * @returns {boolean} True when this call installed the listeners.
     */
    installGlobalHandlers() {
        if (typeof window === "undefined" || typeof window.addEventListener !== "function") {
            return false;
        }
        if (safely(() => localStorage.getItem("MB_ERROR_BOUNDARY")) === "false") return false;
        if (window[BOUNDARY_FLAG]) return false;

        window.addEventListener("error", handleWindowError);
        window.addEventListener("unhandledrejection", handleUnhandledRejection);
        window[BOUNDARY_FLAG] = true;
        return true;
    },

    /**
     * Returns copies of the recorded errors, oldest first.
     *
     * @returns {Object[]} Copies of up to the last 50 records.
     */
    getRecentErrors() {
        return recentErrors.map(record => ({ ...record }));
    },

    /**
     * Debug log, a no-op unless debug logging is enabled.
     *
     * @param {...*} args - Values forwarded to debugLog.
     */
    debug(...args) {
        safely(() => {
            if (typeof debugLog === "function") debugLog(...args);
        });
    },

    /**
     * Info log, a no-op unless debug logging is enabled.
     *
     * @param {...*} args - Values forwarded to debugLog.
     */
    info(...args) {
        safely(() => {
            if (typeof debugLog === "function") debugLog(...args);
        });
    }
};

// Ensure the global exists for the RequireJS shim (exports: "ErrorHandler")
if (typeof window !== "undefined") {
    window.ErrorHandler = ErrorHandler;
    ErrorHandler.installGlobalHandlers();
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ErrorHandler;
}
