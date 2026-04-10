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

const { retryWithBackoff } = require("../utils/retryWithBackoff");

/**
 * A no-op delay function that resolves immediately.
 * Injected into retryWithBackoff to avoid real timers in tests.
 */
const instantDelay = () => Promise.resolve();

describe("retryWithBackoff", () => {
    describe("immediate success (no retries needed)", () => {
        it("should resolve immediately when check returns truthy on first call", async () => {
            const onSuccess = jest.fn();
            const check = jest.fn(() => ({ x: 0, y: 0, width: 100, height: 100 }));

            const result = await retryWithBackoff({
                check,
                onSuccess,
                delayFn: instantDelay,
                maxRetries: 5
            });

            expect(check).toHaveBeenCalledTimes(1);
            expect(onSuccess).toHaveBeenCalledTimes(1);
            expect(onSuccess).toHaveBeenCalledWith({ x: 0, y: 0, width: 100, height: 100 });
            expect(result).toEqual({ x: 0, y: 0, width: 100, height: 100 });
        });

        it("should pass the check result to onSuccess", async () => {
            const bounds = { x: 10, y: 20, width: 200, height: 300 };
            const onSuccess = jest.fn();

            await retryWithBackoff({
                check: () => bounds,
                onSuccess,
                delayFn: instantDelay
            });

            expect(onSuccess).toHaveBeenCalledWith(bounds);
        });

        it("should not call onRetry when check succeeds immediately", async () => {
            const onRetry = jest.fn();

            await retryWithBackoff({
                check: () => true,
                onSuccess: jest.fn(),
                onRetry,
                delayFn: instantDelay
            });

            expect(onRetry).not.toHaveBeenCalled();
        });
    });

    describe("retry behavior", () => {
        it("should retry when check returns falsy and eventually succeed", async () => {
            let callCount = 0;
            const check = jest.fn(() => {
                callCount++;
                // Fail first 3 times, succeed on 4th
                return callCount >= 4 ? { ready: true } : null;
            });
            const onSuccess = jest.fn();

            await retryWithBackoff({
                check,
                onSuccess,
                delayFn: instantDelay,
                maxRetries: 10
            });

            expect(check).toHaveBeenCalledTimes(4);
            expect(onSuccess).toHaveBeenCalledWith({ ready: true });
        });

        it("should call onRetry before each retry attempt with the attempt number", async () => {
            let callCount = 0;
            const onRetry = jest.fn();

            await retryWithBackoff({
                check: () => {
                    callCount++;
                    return callCount >= 3 ? true : null;
                },
                onSuccess: jest.fn(),
                onRetry,
                delayFn: instantDelay,
                maxRetries: 10
            });

            // 2 retries before success on 3rd check
            expect(onRetry).toHaveBeenCalledTimes(2);
            expect(onRetry).toHaveBeenNthCalledWith(1, 0);
            expect(onRetry).toHaveBeenNthCalledWith(2, 1);
        });

        it("should work without onRetry callback", async () => {
            let callCount = 0;

            const result = await retryWithBackoff({
                check: () => {
                    callCount++;
                    return callCount >= 2 ? "done" : null;
                },
                onSuccess: jest.fn(),
                delayFn: instantDelay,
                maxRetries: 5
            });

            expect(result).toBe("done");
        });

        it("should call delayFn with exponentially increasing delays", async () => {
            let callCount = 0;
            const delayFn = jest.fn(() => Promise.resolve());

            await retryWithBackoff({
                check: () => {
                    callCount++;
                    return callCount >= 4 ? true : null;
                },
                onSuccess: jest.fn(),
                delayFn,
                maxRetries: 10,
                initialDelay: 50
            });

            // 3 retries: delays should be 50*2^0=50, 50*2^1=100, 50*2^2=200
            expect(delayFn).toHaveBeenCalledTimes(3);
            expect(delayFn).toHaveBeenNthCalledWith(1, 50);
            expect(delayFn).toHaveBeenNthCalledWith(2, 100);
            expect(delayFn).toHaveBeenNthCalledWith(3, 200);
        });
    });

    describe("max retries exceeded", () => {
        it("should reject with an error when max retries are exhausted", async () => {
            const check = jest.fn(() => null);

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess: jest.fn(),
                    delayFn: instantDelay,
                    maxRetries: 3,
                    errorMessage: "COULD NOT CREATE CACHE"
                })
            ).rejects.toThrow("COULD NOT CREATE CACHE");

            // check called for attempts 0, 1, 2, 3 then fail on count=4 > maxRetries=3
            expect(check).toHaveBeenCalledTimes(4);
        });

        it("should use default error message when none provided", async () => {
            await expect(
                retryWithBackoff({
                    check: () => null,
                    onSuccess: jest.fn(),
                    delayFn: instantDelay,
                    maxRetries: 0
                })
            ).rejects.toThrow("Retry limit exceeded");
        });

        it("should use custom error message", async () => {
            await expect(
                retryWithBackoff({
                    check: () => null,
                    onSuccess: jest.fn(),
                    delayFn: instantDelay,
                    maxRetries: 0,
                    errorMessage: "Turtle._createCache: bounds unavailable"
                })
            ).rejects.toThrow("Turtle._createCache: bounds unavailable");
        });
    });

    describe("default parameters", () => {
        it("should default maxRetries to 20", async () => {
            let callCount = 0;

            // Succeed on attempt 19 (within default 20)
            await retryWithBackoff({
                check: () => {
                    callCount++;
                    return callCount > 19 ? true : null;
                },
                onSuccess: jest.fn(),
                delayFn: instantDelay
            });

            expect(callCount).toBe(20);
        });

        it("should default initialDelay to 50ms", async () => {
            let callCount = 0;
            const delayFn = jest.fn(() => Promise.resolve());

            await retryWithBackoff({
                check: () => {
                    callCount++;
                    return callCount >= 2 ? true : null;
                },
                onSuccess: jest.fn(),
                delayFn
            });

            // First delay should be 50 * 2^0 = 50
            expect(delayFn).toHaveBeenCalledWith(50);
        });
    });

    describe("error propagation", () => {
        it("should reject if check throws an error", async () => {
            await expect(
                retryWithBackoff({
                    check: () => {
                        throw new Error("check exploded");
                    },
                    onSuccess: jest.fn(),
                    delayFn: instantDelay
                })
            ).rejects.toThrow("check exploded");
        });

        it("should reject if onSuccess throws an error", async () => {
            await expect(
                retryWithBackoff({
                    check: () => true,
                    onSuccess: () => {
                        throw new Error("onSuccess failed");
                    },
                    delayFn: instantDelay
                })
            ).rejects.toThrow("onSuccess failed");
        });

        it("should reject if async onSuccess rejects", async () => {
            await expect(
                retryWithBackoff({
                    check: () => true,
                    onSuccess: async () => {
                        throw new Error("async onSuccess failed");
                    },
                    delayFn: instantDelay
                })
            ).rejects.toThrow("async onSuccess failed");
        });
    });

    describe("edge cases", () => {
        it("should handle check returning various truthy values", async () => {
            const onSuccess = jest.fn();

            // Number truthy
            await retryWithBackoff({
                check: () => 42,
                onSuccess,
                delayFn: instantDelay
            });
            expect(onSuccess).toHaveBeenCalledWith(42);

            // String truthy
            onSuccess.mockClear();
            await retryWithBackoff({
                check: () => "ready",
                onSuccess,
                delayFn: instantDelay
            });
            expect(onSuccess).toHaveBeenCalledWith("ready");

            // Array truthy
            onSuccess.mockClear();
            await retryWithBackoff({
                check: () => [1, 2, 3],
                onSuccess,
                delayFn: instantDelay
            });
            expect(onSuccess).toHaveBeenCalledWith([1, 2, 3]);
        });

        it("should treat 0, empty string, and false as falsy (trigger retry)", async () => {
            let callCount = 0;

            // Returns 0 first, then true
            await retryWithBackoff({
                check: () => {
                    callCount++;
                    if (callCount === 1) return 0;
                    if (callCount === 2) return "";
                    if (callCount === 3) return false;
                    return "success";
                },
                onSuccess: jest.fn(),
                delayFn: instantDelay,
                maxRetries: 10
            });

            expect(callCount).toBe(4);
        });

        it("should handle maxRetries of 0 (fail immediately if check is falsy)", async () => {
            const check = jest.fn(() => null);

            await expect(
                retryWithBackoff({
                    check,
                    onSuccess: jest.fn(),
                    delayFn: instantDelay,
                    maxRetries: 0
                })
            ).rejects.toThrow();
        });

        it("should handle maxRetries of 1 (one retry allowed)", async () => {
            let callCount = 0;
            const onSuccess = jest.fn();

            await retryWithBackoff({
                check: () => {
                    callCount++;
                    return callCount >= 2 ? true : null;
                },
                onSuccess,
                delayFn: instantDelay,
                maxRetries: 1
            });

            expect(callCount).toBe(2);
            expect(onSuccess).toHaveBeenCalled();
        });
    });
});
