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

describe("retryWithBackoff", () => {
    let retryWithBackoff;

    beforeEach(() => {
        retryWithBackoff = require("../retryWithBackoff").retryWithBackoff;
    });

    it("resolves immediately when check succeeds", async () => {
        const check = jest.fn().mockReturnValue(true);
        const onSuccess = jest.fn().mockResolvedValue();
        const result = await retryWithBackoff({ check, onSuccess });
        expect(result).toBe(true);
        expect(check).toHaveBeenCalledTimes(1);
    });

    it("throws error and breaks immediately without final delay when retries are exhausted", async () => {
        const check = jest.fn().mockReturnValue(false);
        const onSuccess = jest.fn();
        const onRetry = jest.fn();
        const delayFn = jest.fn().mockResolvedValue();

        await expect(
            retryWithBackoff({
                check,
                onSuccess,
                onRetry,
                delayFn,
                maxRetries: 3,
                initialDelay: 10,
                errorMessage: "failed completely"
            })
        ).rejects.toThrow("failed completely");

        expect(check).toHaveBeenCalledTimes(4);
        expect(onRetry).toHaveBeenCalledTimes(3);
        expect(onRetry).toHaveBeenLastCalledWith(2);
        expect(delayFn).toHaveBeenCalledTimes(3);
        expect(delayFn).toHaveBeenLastCalledWith(40);
        expect(onSuccess).not.toHaveBeenCalled();
    });
});
