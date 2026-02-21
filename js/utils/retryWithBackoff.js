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
 * @file Shared retry-with-exponential-backoff utility for handling race conditions
 * where resources (e.g., container bounds) may not be immediately available.
 *
 * This replaces ad-hoc unbounded retry loops that previously existed in
 * turtle.js and block.js, providing a consistent, bounded, and testable
 * retry mechanism across the codebase.
 *
 * @author Music Blocks Contributors
 */

/* exported retryWithBackoff */

/**
 * Retries an asynchronous check function with exponential backoff until it
 * succeeds or the maximum number of retries is exceeded.
 *
 * The delay between retries grows exponentially: initialDelay * 2^attempt.
 * This prevents tight polling loops while still recovering quickly from
 * brief race conditions.
 *
 * @param {Object} options - Configuration for the retry behavior.
 * @param {Function} options.check - A function that returns a truthy value when the
 *   condition is met, or a falsy value to trigger a retry. May be async.
 * @param {Function} options.onSuccess - Called with the truthy result of `check` when
 *   it succeeds. May be async.
 * @param {Function} [options.onRetry] - Optional callback invoked before each retry
 *   attempt, receiving the current attempt number (0-indexed). Useful for
 *   side effects like regenerating artwork.
 * @param {Function} [options.delayFn] - The delay function to use. Defaults to a
 *   Promise-based setTimeout wrapper. Injected for testability.
 * @param {number} [options.maxRetries=20] - Maximum number of retry attempts before
 *   rejecting with an error.
 * @param {number} [options.initialDelay=50] - Initial delay in milliseconds before
 *   the first retry. Subsequent delays double each attempt.
 * @param {string} [options.errorMessage="Retry limit exceeded"] - Error message used
 *   when max retries are exhausted.
 * @returns {Promise} Resolves when `check` returns truthy and `onSuccess`
 *   completes. Rejects with an Error if retries are exhausted.
 *
 * @example
 * // Basic usage: wait for container bounds to become available
 * await retryWithBackoff({
 *   check: () => container.getBounds(),
 *   onSuccess: (bounds) => container.cache(bounds.x, bounds.y, bounds.width, bounds.height),
 *   maxRetries: 20,
 *   initialDelay: 50,
 *   errorMessage: "COULD NOT CREATE CACHE"
 * });
 *
 * @example
 * // With onRetry callback for side effects
 * await retryWithBackoff({
 *   check: () => container.getBounds(),
 *   onSuccess: (bounds) => container.cache(bounds.x, bounds.y, bounds.width, bounds.height),
 *   onRetry: (attempt) => regenerateArtwork(true, []),
 *   maxRetries: 15,
 *   initialDelay: 100
 * });
 */
const retryWithBackoff = async ({
    check,
    onSuccess,
    onRetry,
    delayFn,
    maxRetries = 20,
    initialDelay = 50,
    errorMessage = "Retry limit exceeded"
}) => {
    // Default delay function: Promise-based setTimeout
    const delay =
        delayFn ||
        (ms =>
            new Promise(resolve => {
                setTimeout(resolve, ms);
            }));

    for (let count = 0; count <= maxRetries; count++) {
        const result = check();

        if (result) {
            await onSuccess(result);
            return result;
        }

        if (typeof onRetry === "function") {
            onRetry(count);
        }

        await delay(initialDelay * Math.pow(2, count));
    }

    throw new Error(errorMessage);
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { retryWithBackoff };
}
