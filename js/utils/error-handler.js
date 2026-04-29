/*
 * Centralized error handling helper for Music Blocks runtime code.
 * Routes all diagnostics through Logger with contextual metadata.
 */
(function (root) {
    "use strict";

    const FALLBACK_LOGGER = {
        error: (...args) => console.error(...args),
        warn: (...args) => console.warn(...args),
        debug: (...args) => console.debug(...args)
    };

    const getLogger = () => {
        if (typeof root !== "undefined" && root.Logger) {
            return root.Logger;
        }

        return FALLBACK_LOGGER;
    };

    const normalizeError = error => {
        if (error instanceof Error) {
            return error;
        }

        if (typeof error === "string") {
            return new Error(error);
        }

        try {
            return new Error(JSON.stringify(error));
        } catch (e) {
            return new Error(String(error));
        }
    };

    const buildTag = context => {
        const moduleName = context && context.module ? context.module : "unknown-module";
        const operation = context && context.operation ? context.operation : "unknown-operation";

        return `[${moduleName}] ${operation}`;
    };

    const ErrorHandler = {
        capture(error, context = {}) {
            const logger = getLogger();
            const normalizedError = normalizeError(error);
            const tag = buildTag(context);

            if (context.extra !== undefined) {
                logger.error(`${tag} failed`, normalizedError, context.extra);
            } else {
                logger.error(`${tag} failed`, normalizedError);
            }

            return normalizedError;
        },

        warn(message, context = {}) {
            const logger = getLogger();
            const tag = buildTag(context);

            if (context.extra !== undefined) {
                logger.warn(`${tag}: ${message}`, context.extra);
            } else {
                logger.warn(`${tag}: ${message}`);
            }
        },

        recoverable(error, context = {}) {
            const logger = getLogger();
            const normalizedError = normalizeError(error);
            const tag = buildTag(context);

            if (context.extra !== undefined) {
                logger.warn(`${tag} recoverable`, normalizedError, context.extra);
            } else {
                logger.warn(`${tag} recoverable`, normalizedError);
            }

            return normalizedError;
        },

        userFacing(error, context = {}, uiMessage, notifyFn) {
            const normalizedError = this.capture(error, context);

            if (typeof notifyFn === "function" && typeof uiMessage === "string" && uiMessage.length > 0) {
                try {
                    notifyFn(uiMessage);
                } catch (notifyError) {
                    this.capture(notifyError, {
                        module: context.module || "unknown-module",
                        operation: `${context.operation || "unknown-operation"}:notify-user-failed`
                    });
                }
            }

            return normalizedError;
        }
    };

    if (typeof define === "function" && define.amd) {
        define([], () => ErrorHandler);
    } else if (typeof module !== "undefined" && module.exports) {
        module.exports = ErrorHandler;
    } else {
        root.ErrorHandler = ErrorHandler;
    }
})(typeof window !== "undefined" ? window : globalThis);
