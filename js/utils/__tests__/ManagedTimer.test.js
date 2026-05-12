/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Music Blocks Contributors
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

const ManagedTimer = require("../ManagedTimer.js");

describe("ManagedTimer", () => {
    let timer;

    beforeEach(() => {
        jest.useFakeTimers();
        timer = new ManagedTimer();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("tracks timeout callbacks and updates stats", () => {
        const callback = jest.fn();

        const id = timer.setTimeout(callback, 100);

        expect(timer.activeTimeoutCount).toBe(1);
        expect(timer.activeCount).toBe(1);
        expect(timer.totalCreated).toBe(1);
        expect(id).toBeDefined();

        jest.advanceTimersByTime(100);

        expect(callback).toHaveBeenCalledTimes(1);
        expect(timer.activeTimeoutCount).toBe(0);
        expect(timer.activeCount).toBe(0);
        expect(timer.totalFired).toBe(1);
    });

    it("suppresses guarded timeout when aborted returns true", () => {
        const callback = jest.fn();
        const aborted = jest.fn(() => true);

        timer.setGuardedTimeout(callback, 50, aborted);

        expect(timer.activeTimeoutCount).toBe(1);

        jest.advanceTimersByTime(50);

        expect(callback).not.toHaveBeenCalled();
        expect(aborted).toHaveBeenCalledTimes(1);
        expect(timer.totalSuppressed).toBe(1);
        expect(timer.activeTimeoutCount).toBe(0);
    });

    it("cancels timeouts with clearTimeout and returns false for missing IDs", () => {
        const callback = jest.fn();
        const id = timer.setTimeout(callback, 100);

        const cleared = timer.clearTimeout(id);

        expect(cleared).toBe(true);
        expect(timer.totalCancelled).toBe(1);
        expect(timer.activeTimeoutCount).toBe(0);

        const missing = timer.clearTimeout(99999);
        expect(missing).toBe(false);
    });

    it("tracks intervals and cancels them with clearInterval", () => {
        const callback = jest.fn();
        const id = timer.setInterval(callback, 100);

        expect(timer.activeIntervalCount).toBe(1);
        expect(timer.activeCount).toBe(1);
        expect(timer.totalCreated).toBe(1);

        jest.advanceTimersByTime(300);

        expect(callback).toHaveBeenCalledTimes(3);

        const cleared = timer.clearInterval(id);
        expect(cleared).toBe(true);
        expect(timer.activeIntervalCount).toBe(0);
        expect(timer.totalCancelled).toBe(1);
    });

    it("self-destructs guarded intervals when aborted returns true", () => {
        const callback = jest.fn();
        let checks = 0;
        const aborted = jest.fn(() => checks >= 2);

        timer.setGuardedInterval(callback, 100, aborted);

        jest.advanceTimersByTime(100);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(timer.activeIntervalCount).toBe(1);

        checks = 2;
        jest.advanceTimersByTime(100);

        expect(aborted).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledTimes(1);
        expect(timer.activeIntervalCount).toBe(0);
        expect(timer.totalSuppressed).toBe(1);
    });

    it("clears all pending timers and intervals", () => {
        timer.setTimeout(() => {}, 100);
        timer.setInterval(() => {}, 200);

        expect(timer.activeCount).toBe(2);

        const cancelled = timer.clearAll();

        expect(cancelled).toBe(2);
        expect(timer.activeCount).toBe(0);
        expect(timer.totalCancelled).toBe(2);
    });

    it("resetStats clears counters but keeps active timers", () => {
        timer.setTimeout(() => {}, 100);
        timer.setInterval(() => {}, 200);

        expect(timer.totalCreated).toBe(2);
        expect(timer.activeCount).toBe(2);

        timer.resetStats();

        expect(timer.totalCreated).toBe(0);
        expect(timer.totalCancelled).toBe(0);
        expect(timer.totalFired).toBe(0);
        expect(timer.totalSuppressed).toBe(0);
        expect(timer.activeCount).toBe(2);
    });

    it("returns diagnostic snapshot from getStats", () => {
        timer.setTimeout(() => {}, 100);
        timer.setInterval(() => {}, 200);

        const stats = timer.getStats();

        expect(stats).toEqual({
            active: 2,
            activeTimeouts: 1,
            activeIntervals: 1,
            created: 2,
            cancelled: 0,
            fired: 0,
            suppressed: 0
        });
    });
});
