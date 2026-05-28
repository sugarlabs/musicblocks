/**
 * MusicBlocks
 *
 * @copyright 2026 Music Blocks contributors
 * @author Sapnil Biswas
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

const { retryWithBackoff } = require("../retryWithBackoff");

describe("retryWithBackoff", () => {
    let mockCheck;
    let mockOnSuccess;
    let mockOnRetry;
    let mockDelayFn;

    beforeEach(() => {
        mockCheck = jest.fn();
        mockOnSuccess = jest.fn().mockResolvedValue();
        mockOnRetry = jest.fn();
        mockDelayFn = jest.fn().mockResolvedValue();
    });

    it("should succeed immediately if check returns truthy", async () => {
        mockCheck.mockReturnValue("success_data");

        const result = await retryWithBackoff({
            check: mockCheck,
            onSuccess: mockOnSuccess,
            delayFn: mockDelayFn
        });

        expect(result).toBe("success_data");
        expect(mockCheck).toHaveBeenCalledTimes(1);
        expect(mockOnSuccess).toHaveBeenCalledWith("success_data");
        expect(mockDelayFn).not.toHaveBeenCalled();
    });

    it("should retry and succeed when check eventually returns truthy", async () => {
        mockCheck
            .mockReturnValueOnce(false)
            .mockReturnValueOnce(null)
            .mockReturnValueOnce({ data: "yes" });

        const result = await retryWithBackoff({
            check: mockCheck,
            onSuccess: mockOnSuccess,
            onRetry: mockOnRetry,
            delayFn: mockDelayFn,
            initialDelay: 10
        });

        expect(result).toEqual({ data: "yes" });
        expect(mockCheck).toHaveBeenCalledTimes(3);
        expect(mockOnSuccess).toHaveBeenCalledWith({ data: "yes" });
        expect(mockOnRetry).toHaveBeenCalledTimes(2);

        // Attempt 0
        expect(mockOnRetry).toHaveBeenNthCalledWith(1, 0);
        // Attempt 1
        expect(mockOnRetry).toHaveBeenNthCalledWith(2, 1);

        expect(mockDelayFn).toHaveBeenCalledTimes(2);
        // 10 * 2^0 = 10
        expect(mockDelayFn).toHaveBeenNthCalledWith(1, 10);
        // 10 * 2^1 = 20
        expect(mockDelayFn).toHaveBeenNthCalledWith(2, 20);
    });

    it("should throw an error after exceeding maxRetries", async () => {
        mockCheck.mockReturnValue(false);

        await expect(
            retryWithBackoff({
                check: mockCheck,
                onSuccess: mockOnSuccess,
                delayFn: mockDelayFn,
                maxRetries: 3,
                errorMessage: "Failed to get bounds"
            })
        ).rejects.toThrow("Failed to get bounds");

        // check should be called maxRetries + 1 times (count from 0 to 3)
        expect(mockCheck).toHaveBeenCalledTimes(4);
        expect(mockOnSuccess).not.toHaveBeenCalled();
        expect(mockDelayFn).toHaveBeenCalledTimes(4);
    });

    it("should use default error message when exceeding maxRetries without custom message", async () => {
        mockCheck.mockReturnValue(false);

        await expect(
            retryWithBackoff({
                check: mockCheck,
                onSuccess: mockOnSuccess,
                delayFn: mockDelayFn,
                maxRetries: 1
            })
        ).rejects.toThrow("Retry limit exceeded");
    });

    it("should use default delay function if none provided", async () => {
        jest.useFakeTimers();

        mockCheck.mockReturnValueOnce(false).mockReturnValueOnce(true);

        const promise = retryWithBackoff({
            check: mockCheck,
            onSuccess: mockOnSuccess,
            initialDelay: 50
        });

        // Advance timers by 50ms to resolve the default delay (50 * 2^0 = 50ms)
        jest.advanceTimersByTime(50);

        await promise;
        expect(mockCheck).toHaveBeenCalledTimes(2);

        jest.useRealTimers();
    });

    it("should use default maxRetries and initialDelay if not provided", async () => {
        mockCheck.mockReturnValue(false);

        await expect(
            retryWithBackoff({
                check: mockCheck,
                onSuccess: mockOnSuccess,
                delayFn: mockDelayFn
            })
        ).rejects.toThrow("Retry limit exceeded");

        // default maxRetries is 20, so 21 attempts
        expect(mockCheck).toHaveBeenCalledTimes(21);

        // Check default initialDelay (50 * 2^0 = 50)
        expect(mockDelayFn).toHaveBeenNthCalledWith(1, 50);
    });
});
