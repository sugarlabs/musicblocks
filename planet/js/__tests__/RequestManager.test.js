// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

const RequestManager = require("../RequestManager");

describe("RequestManager", () => {
    let requestManager;

    beforeEach(() => {
        requestManager = new RequestManager({
            minDelay: 100,
            maxRetries: 2,
            baseRetryDelay: 50,
            maxConcurrent: 2
        });
    });

    afterEach(() => {
        requestManager.clearPending();
    });

    describe("constructor", () => {
        it("should initialize with default options", () => {
            const rm = new RequestManager();
            expect(rm.minDelay).toBe(500);
            expect(rm.maxRetries).toBe(3);
            expect(rm.baseRetryDelay).toBe(1000);
            expect(rm.maxConcurrent).toBe(3);
        });

        it("should initialize with custom options", () => {
            expect(requestManager.minDelay).toBe(100);
            expect(requestManager.maxRetries).toBe(2);
            expect(requestManager.baseRetryDelay).toBe(50);
            expect(requestManager.maxConcurrent).toBe(2);
        });

        it("should initialize empty pending requests", () => {
            expect(requestManager.pendingRequests.size).toBe(0);
        });

        it("should initialize stats to zero", () => {
            const stats = requestManager.getStats();
            expect(stats.totalRequests).toBe(0);
            expect(stats.cachedResponses).toBe(0);
            expect(stats.retries).toBe(0);
            expect(stats.failures).toBe(0);
        });
    });

    describe("generateRequestKey", () => {
        it("should generate unique keys for different actions", () => {
            const key1 = requestManager.generateRequestKey({ action: "getProject", id: 1 });
            const key2 = requestManager.generateRequestKey({ action: "searchProject", id: 1 });
            expect(key1).not.toBe(key2);
        });

        it("should generate same key for same data", () => {
            const key1 = requestManager.generateRequestKey({ action: "getProject", id: 1 });
            const key2 = requestManager.generateRequestKey({ action: "getProject", id: 1 });
            expect(key1).toBe(key2);
        });

        it("should exclude api-key from key generation", () => {
            const key1 = requestManager.generateRequestKey({
                "action": "getProject",
                "api-key": "abc"
            });
            const key2 = requestManager.generateRequestKey({
                "action": "getProject",
                "api-key": "xyz"
            });
            expect(key1).toBe(key2);
        });
    });

    describe("throttledRequest", () => {
        it("should execute request and return result", async () => {
            const mockResult = { success: true, data: "test" };
            const mockRequestFn = jest.fn(callback => {
                callback(mockResult);
            });

            const result = await requestManager.throttledRequest({ action: "test" }, mockRequestFn);

            expect(result).toEqual(mockResult);
            expect(mockRequestFn).toHaveBeenCalled();
        });

        it("should deduplicate concurrent requests with same key", async () => {
            let callCount = 0;
            const mockResult = { success: true, data: "test" };

            const mockRequestFn = jest.fn(callback => {
                callCount++;
                setTimeout(() => callback(mockResult), 50);
            });

            // Make two identical requests concurrently
            const promise1 = requestManager.throttledRequest(
                { action: "test", id: 1 },
                mockRequestFn
            );
            const promise2 = requestManager.throttledRequest(
                { action: "test", id: 1 },
                mockRequestFn
            );

            const [result1, result2] = await Promise.all([promise1, promise2]);

            expect(result1).toEqual(mockResult);
            expect(result2).toEqual(mockResult);
            // Should only make one actual request due to deduplication
            expect(callCount).toBe(1);
        });

        it("should increment cached responses for deduplicated requests", async () => {
            const mockResult = { success: true };
            const mockRequestFn = callback => {
                setTimeout(() => callback(mockResult), 50);
            };

            await Promise.all([
                requestManager.throttledRequest({ action: "test" }, mockRequestFn),
                requestManager.throttledRequest({ action: "test" }, mockRequestFn)
            ]);

            const stats = requestManager.getStats();
            expect(stats.cachedResponses).toBe(1);
        });
    });

    describe("retry logic", () => {
        it("should retry on connection failure", async () => {
            let attempts = 0;
            const mockRequestFn = jest.fn(callback => {
                attempts++;
                if (attempts < 2) {
                    callback({ success: false, error: "ERROR_CONNECTION_FAILURE" });
                } else {
                    callback({ success: true, data: "recovered" });
                }
            });

            const result = await requestManager.throttledRequest({ action: "test" }, mockRequestFn);

            expect(result.success).toBe(true);
            expect(attempts).toBeGreaterThan(1);
        });

        it("should fail after max retries exceeded", async () => {
            const mockRequestFn = jest.fn(callback => {
                callback({ success: false, error: "ERROR_CONNECTION_FAILURE" });
            });

            const result = await requestManager.throttledRequest({ action: "test" }, mockRequestFn);

            // After all retries, should return the failure result
            expect(result.success).toBe(false);
        });
    });

    describe("hasPendingRequests", () => {
        it("should return false when no pending requests", () => {
            expect(requestManager.hasPendingRequests()).toBe(false);
        });
    });

    describe("resetStats", () => {
        it("should reset all statistics to zero", async () => {
            // Make some requests first
            await requestManager.throttledRequest({ action: "test" }, callback =>
                callback({ success: true })
            );

            requestManager.resetStats();
            const stats = requestManager.getStats();

            expect(stats.totalRequests).toBe(0);
            expect(stats.cachedResponses).toBe(0);
            expect(stats.retries).toBe(0);
            expect(stats.failures).toBe(0);
        });
    });

    describe("clearPending", () => {
        it("should clear all pending requests", () => {
            requestManager.pendingRequests.set("test", Promise.resolve());
            requestManager.requestQueue.push({});

            requestManager.clearPending();

            expect(requestManager.pendingRequests.size).toBe(0);
            expect(requestManager.requestQueue.length).toBe(0);
        });
    });
});
