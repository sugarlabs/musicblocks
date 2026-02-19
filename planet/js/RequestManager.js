// Copyright (c) 2026 Music Blocks Contributors
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
   exported RequestManager
*/

/**
 * RequestManager - Handles rate limiting, request throttling, and retry logic
 * for Planet API calls. Prevents API abuse and improves reliability.
 */
class RequestManager {
    /**
     * Creates a new RequestManager instance
     * @param {Object} options - Configuration options
     * @param {number} options.minDelay - Minimum delay between requests in ms (default: 500)
     * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
     * @param {number} options.baseRetryDelay - Base delay for exponential backoff in ms (default: 1000)
     * @param {number} options.maxConcurrent - Maximum concurrent requests (default: 3)
     */
    constructor(options = {}) {
        this.minDelay = options.minDelay || 500;
        this.maxRetries = options.maxRetries || 3;
        this.baseRetryDelay = options.baseRetryDelay || 1000;
        this.maxConcurrent = options.maxConcurrent || 3;

        // Track pending requests to prevent duplicates
        this.pendingRequests = new Map();

        // Track last request time for throttling
        this.lastRequestTime = 0;

        // Request queue for rate limiting
        this.requestQueue = [];
        this.activeRequests = 0;
        this.isProcessingQueue = false;

        // Statistics for debugging
        this.stats = {
            totalRequests: 0,
            cachedResponses: 0,
            retries: 0,
            failures: 0
        };
    }

    /**
     * Generates a unique key for a request based on action and parameters
     * @param {Object} data - Request data
     * @returns {string} - Unique request key
     */
    generateRequestKey(data) {
        const action = data.action || "unknown";
        const params = { ...data };
        delete params["api-key"];
        return `${action}:${JSON.stringify(params)}`;
    }

    /**
     * Executes a request with throttling, deduplication, and retry logic
     * @param {Object} data - Request data
     * @param {Function} requestFn - Function that performs the actual request
     * @returns {Promise} - Promise that resolves with the response
     */
    async throttledRequest(data, requestFn) {
        const key = this.generateRequestKey(data);

        // Check for pending duplicate request
        if (this.pendingRequests.has(key)) {
            this.stats.cachedResponses++;
            return this.pendingRequests.get(key);
        }

        // Create the request promise
        const promise = this._executeWithQueueAndRetry(data, requestFn, key);

        // Store in pending requests map
        this.pendingRequests.set(key, promise);

        try {
            const result = await promise;
            return result;
        } finally {
            // Clean up after request completes
            this.pendingRequests.delete(key);
        }
    }

    /**
     * Adds request to queue and processes with rate limiting
     * @private
     */
    async _executeWithQueueAndRetry(data, requestFn, key) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                data,
                requestFn,
                key,
                resolve,
                reject,
                attempts: 0
            });

            this._processQueue();
        });
    }

    /**
     * Processes the request queue with rate limiting
     * @private
     */
    async _processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
            const request = this.requestQueue.shift();
            if (!request) continue;

            // Apply throttling
            const now = Date.now();
            const timeSinceLastRequest = now - this.lastRequestTime;

            if (timeSinceLastRequest < this.minDelay) {
                await this._delay(this.minDelay - timeSinceLastRequest);
            }

            this.lastRequestTime = Date.now();
            this.activeRequests++;
            this.stats.totalRequests++;

            // Execute the request
            this._executeRequest(request);
        }

        this.isProcessingQueue = false;
    }

    /**
     * Executes a single request with retry logic
     * @private
     */
    async _executeRequest(request) {
        try {
            const result = await this._executeWithRetry(request.requestFn, request.attempts);
            request.resolve(result);
        } catch (error) {
            request.reject(error);
        } finally {
            this.activeRequests--;
            // Process more requests if available
            if (this.requestQueue.length > 0) {
                this._processQueue();
            }
        }
    }

    /**
     * Executes a request with exponential backoff retry logic
     * @private
     * @param {Function} requestFn - The request function to execute
     * @param {number} attempt - Current attempt number
     * @param {Object} lastFailure - The last failure response (for returning on max retries)
     * @returns {Promise} - Promise that resolves with the response
     */
    async _executeWithRetry(requestFn, attempt = 0, lastFailure = null) {
        try {
            const result = await this._promisifyRequest(requestFn);

            // Check if the result indicates a failure that should be retried
            if (result && result.success === false && result.error === "ERROR_CONNECTION_FAILURE") {
                if (attempt < this.maxRetries) {
                    this.stats.retries++;

                    // Exponential backoff: 50ms, 100ms, 200ms, 400ms...
                    const delay = this.baseRetryDelay * Math.pow(2, attempt);

                    // eslint-disable-next-line no-console
                    console.debug(
                        `[RequestManager] Retry attempt ${attempt + 1}/${
                            this.maxRetries
                        } after ${delay}ms`
                    );

                    await this._delay(delay);
                    return this._executeWithRetry(requestFn, attempt + 1, result);
                }

                // Max retries exceeded, return the failure response
                this.stats.failures++;
                return result;
            }

            return result;
        } catch (error) {
            if (attempt < this.maxRetries) {
                this.stats.retries++;

                // Exponential backoff
                const delay = this.baseRetryDelay * Math.pow(2, attempt);

                // eslint-disable-next-line no-console
                console.debug(
                    `[RequestManager] Retry attempt ${attempt + 1}/${
                        this.maxRetries
                    } after ${delay}ms (error: ${error.message})`
                );

                await this._delay(delay);
                return this._executeWithRetry(requestFn, attempt + 1, lastFailure);
            }

            this.stats.failures++;
            // Return error response if max retries exceeded
            return lastFailure || { success: false, error: "REQUEST_FAILED" };
        }
    }

    /**
     * Wraps a promise with a timeout
     * @private
     * @param {Promise} promise - The promise to wrap
     * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
     * @returns {Promise}
     */
    _withTimeout(promise, timeoutMs = 30000) {
        let timeoutId;

        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => {
                const error = new Error(`Request timeout after ${timeoutMs}ms`);
                error.name = "TimeoutError";
                reject(error);
            }, timeoutMs);
        });

        return Promise.race([
            promise.finally(() => clearTimeout(timeoutId)),
            timeoutPromise
        ]);
    }

    /**
     * Converts callback-based request to Promise with timeout
     * @private
     */
    _promisifyRequest(requestFn) {
        const promise = new Promise((resolve, reject) => {
            try {
                requestFn(result => {
                    resolve(result);
                });
            } catch (error) {
                reject(error);
            }
        });

        // Wrap with 30 second timeout
        return this._withTimeout(promise, 30000);
    }

    /**
     * Utility function to create a delay
     * @private
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise}
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clears all pending requests (useful for cleanup)
     */
    clearPending() {
        this.pendingRequests.clear();
        this.requestQueue = [];
    }

    /**
     * Gets current statistics
     * @returns {Object} - Statistics object
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Resets statistics
     */
    resetStats() {
        this.stats = {
            totalRequests: 0,
            cachedResponses: 0,
            retries: 0,
            failures: 0
        };
    }

    /**
     * Checks if there are any pending requests
     * @returns {boolean}
     */
    hasPendingRequests() {
        return this.pendingRequests.size > 0 || this.requestQueue.length > 0;
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = RequestManager;
}
