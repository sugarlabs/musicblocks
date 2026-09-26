/**
 * MusicBlocks v3.6.2
 *
 * @author Karan Kumar
 *
 * @copyright 2026 Karan Kumar
 *
 * @license
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

const { retryWithBackoff } = require("../retryWithBackoff.js");

describe("retryWithBackoff Utility", () => {
    describe("Successful Resolution", () => {
        test("resolves immediately on first attempt if check returns truthy", async () => {
            const check = jest.fn().mockReturnValue("bounds-data");
            const onSuccess = jest.fn();

            const result = await retryWithBackoff({
                check,
                onSuccess
            });

            expect(result).toBe("bounds-data");
            expect(check).toHaveBeenCalledTimes(1);
            expect(onSuccess).toHaveBeenCalledWith("bounds-data");
            expect(onSuccess).toHaveBeenCalledTimes(1);
        });

        test("handles async check function returning a resolving Promise", async () => {
            const check = jest.fn().mockResolvedValue({ x: 10, y: 20 });
            const onSuccess = jest.fn();

            const result = await retryWithBackoff({
                check,
                onSuccess
            });

            expect(result).toEqual({ x: 10, y: 20 });
            expect(check).toHaveBeenCalledTimes(1);
            expect(onSuccess).toHaveBeenCalledWith({ x: 10, y: 20 });
        });

        test("handles async onSuccess callback", async () => {
            const check = jest.fn().mockReturnValue(true);
            const onSuccess = jest.fn().mockImplementation(async val => {
                await Promise.resolve();
                return "success-processed";
            });

            const result = await retryWithBackoff({
                check,
                onSuccess
            });

            expect(result).toBe(true);
            expect(onSuccess).toHaveBeenCalledWith(true);
        });

        test("succeeds after multiple retries when check becomes truthy", async () => {
            let attempts = 0;
            const check = jest.fn().mockImplementation(() => {
                attempts++;
                return attempts === 3 ? "success-on-3" : null;
            });
            const onSuccess = jest.fn();
            const delayFn = jest.fn().mockResolvedValue();

            const result = await retryWithBackoff({
                check,
                onSuccess,
                delayFn,
                maxRetries: 5
            });

            expect(result).toBe("success-on-3");
            expect(check).toHaveBeenCalledTimes(3);
            expect(onSuccess).toHaveBeenCalledWith("success-on-3");
            expect(delayFn).toHaveBeenCalledTimes(2);
        });
    });

    describe("Exponential Backoff Delay Calculations", () => {
        test("doubles delay duration exponentially on each attempt (initialDelay * 2^attempt)", async () => {
            let attempts = 0;
            const check = jest.fn().mockImplementation(() => {
                attempts++;
                return attempts === 4 ? "ok" : false;
            });
            const onSuccess = jest.fn();
            const delayFn = jest.fn().mockResolvedValue();

            await retryWithBackoff({
                check,
                onSuccess,
                delayFn,
                initialDelay: 50,
                maxRetries: 10
            });

            expect(delayFn).toHaveBeenCalledTimes(3);
            expect(delayFn).toHaveBeenNthCalledWith(1, 50); // 50 * 2^0 = 50
            expect(delayFn).toHaveBeenNthCalledWith(2, 100); // 50 * 2^1 = 100
            expect(delayFn).toHaveBeenNthCalledWith(3, 200); // 50 * 2^2 = 200
        });

        test("uses default initialDelay of 50ms when not specified", async () => {
            let attempts = 0;
            const check = jest.fn().mockImplementation(() => {
                attempts++;
                return attempts === 2 ? "ok" : false;
            });
            const onSuccess = jest.fn();
            const delayFn = jest.fn().mockResolvedValue();

            await retryWithBackoff({
                check,
                onSuccess,
                delayFn
            });

            expect(delayFn).toHaveBeenCalledWith(50);
        });
    });

    describe("onRetry Callback Invocation", () => {
        test("invokes onRetry callback with 0-indexed attempt index before each delay", async () => {
            let attempts = 0;
            const check = jest.fn().mockImplementation(() => {
                attempts++;
                return attempts === 4 ? "ready" : null;
            });
            const onSuccess = jest.fn();
            const onRetry = jest.fn();
            const delayFn = jest.fn().mockResolvedValue();

            await retryWithBackoff({
                check,
                onSuccess,
                onRetry,
                delayFn,
                maxRetries: 5
            });

            expect(onRetry).toHaveBeenCalledTimes(3);
            expect(onRetry).toHaveBeenNthCalledWith(1, 0);
            expect(onRetry).toHaveBeenNthCalledWith(2, 1);
            expect(onRetry).toHaveBeenNthCalledWith(3, 2);
        });

        test("does not crash when onRetry is undefined or non-function", async () => {
            let attempts = 0;
            const check = jest.fn().mockImplementation(() => {
                attempts++;
                return attempts === 2 ? "ready" : null;
            });
            const onSuccess = jest.fn();
            const delayFn = jest.fn().mockResolvedValue();

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess,
                    onRetry: null,
                    delayFn
                })
            ).resolves.toBe("ready");
        });
    });

    describe("Max Retries Exhaustion and Rejection", () => {
        test("rejects with Error when maxRetries is reached without success", async () => {
            const check = jest.fn().mockReturnValue(false);
            const onSuccess = jest.fn();
            const delayFn = jest.fn().mockResolvedValue();

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess,
                    delayFn,
                    maxRetries: 3
                })
            ).rejects.toThrow("Retry limit exceeded");

            expect(check).toHaveBeenCalledTimes(4); // initial + 3 retries
            expect(onSuccess).not.toHaveBeenCalled();
            expect(delayFn).toHaveBeenCalledTimes(3);
        });

        test("uses custom errorMessage when max retries are exceeded", async () => {
            const check = jest.fn().mockReturnValue(null);
            const onSuccess = jest.fn();
            const delayFn = jest.fn().mockResolvedValue();
            const customMsg = "CONTAINER_BOUNDS_UNAVAILABLE";

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess,
                    delayFn,
                    maxRetries: 2,
                    errorMessage: customMsg
                })
            ).rejects.toThrow(customMsg);
        });

        test("uses default maxRetries = 20 when not specified", async () => {
            const check = jest.fn().mockReturnValue(false);
            const onSuccess = jest.fn();
            const delayFn = jest.fn().mockResolvedValue();

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess,
                    delayFn
                })
            ).rejects.toThrow("Retry limit exceeded");

            expect(check).toHaveBeenCalledTimes(21); // initial + 20 retries
            expect(delayFn).toHaveBeenCalledTimes(20);
        });

        test("handles maxRetries = 0 by making exactly 1 check attempt with 0 retries", async () => {
            const check = jest.fn().mockReturnValue(false);
            const onSuccess = jest.fn();
            const delayFn = jest.fn().mockResolvedValue();

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess,
                    delayFn,
                    maxRetries: 0
                })
            ).rejects.toThrow("Retry limit exceeded");

            expect(check).toHaveBeenCalledTimes(1);
            expect(delayFn).not.toHaveBeenCalled();
        });
    });

    describe("Default Delay Function (Promise + setTimeout)", () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test("uses default setTimeout-based delay when delayFn is omitted", async () => {
            let attempts = 0;
            const check = jest.fn().mockImplementation(() => {
                attempts++;
                return attempts === 2 ? "done" : false;
            });
            const onSuccess = jest.fn();

            const promise = retryWithBackoff({
                check,
                onSuccess,
                initialDelay: 100,
                maxRetries: 3
            });

            // Fast forward timers for first retry delay (100ms)
            jest.advanceTimersByTime(100);

            const result = await promise;
            expect(result).toBe("done");
            expect(check).toHaveBeenCalledTimes(2);
            expect(onSuccess).toHaveBeenCalledWith("done");
        });
    });

    describe("Error propagation", () => {
        test("rejection propagates if check function throws an synchronous error", async () => {
            const check = jest.fn().mockImplementation(() => {
                throw new Error("DOM element missing");
            });
            const onSuccess = jest.fn();

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess
                })
            ).rejects.toThrow("DOM element missing");
        });

        test("rejection propagates if async check function rejects", async () => {
            const check = jest.fn().mockRejectedValue(new Error("Network disconnect"));
            const onSuccess = jest.fn();

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess
                })
            ).rejects.toThrow("Network disconnect");
        });

        test("rejection propagates if onSuccess callback throws", async () => {
            const check = jest.fn().mockReturnValue(true);
            const onSuccess = jest.fn().mockImplementation(() => {
                throw new Error("Callback execution failure");
            });

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess
                })
            ).rejects.toThrow("Callback execution failure");
        });
    });
});
