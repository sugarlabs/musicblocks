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
 *
 * @author Music Blocks Contributors
 */

/* exported ErrorHandler */

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
    }
};

// Ensure the global exists for the RequireJS shim (exports: "ErrorHandler")
if (typeof window !== "undefined") {
    window.ErrorHandler = ErrorHandler;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ErrorHandler;
}
