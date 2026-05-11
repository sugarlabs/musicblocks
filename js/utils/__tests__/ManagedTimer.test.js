/**
 * @license
 * MusicBlocks v3.6.x
 *
 * Copyright (C) 2026 AdityaM-IITH
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

/* eslint-env jest */
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

    describe("setTimeout", () => {
        it("should track and fire timeout", () => {
            const callback = jest.fn();
            timer.setTimeout(callback, 100);

            expect(timer.activeCount).toBe(1);
            expect(timer.activeTimeoutCount).toBe(1);

            jest.advanceTimersByTime(100);

            expect(callback).toHaveBeenCalled();
            expect(timer.activeCount).toBe(0);
            expect(timer.getStats().fired).toBe(1);
        });

        it("should cancel timeout", () => {
            const callback = jest.fn();
            const id = timer.setTimeout(callback, 100);

            expect(timer.activeCount).toBe(1);

            const cancelled = timer.clearTimeout(id);

            expect(cancelled).toBe(true);
            expect(timer.activeCount).toBe(0);

            jest.advanceTimersByTime(100);
            expect(callback).not.toHaveBeenCalled();
            expect(timer.getStats().cancelled).toBe(1);
        });
    });

    describe("setGuardedTimeout", () => {
        it("should fire if not aborted", () => {
            const callback = jest.fn();
            timer.setGuardedTimeout(callback, 100, () => false);

            jest.advanceTimersByTime(100);

            expect(callback).toHaveBeenCalled();
            expect(timer.getStats().fired).toBe(1);
        });

        it("should suppress callback if aborted returns true", () => {
            const callback = jest.fn();
            timer.setGuardedTimeout(callback, 100, () => true);

            jest.advanceTimersByTime(100);

            expect(callback).not.toHaveBeenCalled();
            expect(timer.getStats().suppressed).toBe(1);
            expect(timer.getStats().fired).toBe(0);
        });
    });

    describe("setInterval", () => {
        it("should track and fire interval repeatedly", () => {
            const callback = jest.fn();
            timer.setInterval(callback, 100);

            expect(timer.activeCount).toBe(1);
            expect(timer.activeIntervalCount).toBe(1);

            jest.advanceTimersByTime(100);
            expect(callback).toHaveBeenCalledTimes(1);

            jest.advanceTimersByTime(100);
            expect(callback).toHaveBeenCalledTimes(2);

            expect(timer.activeCount).toBe(1); // Still active
        });

        it("should cancel interval", () => {
            const callback = jest.fn();
            const id = timer.setInterval(callback, 100);

            jest.advanceTimersByTime(100);
            expect(callback).toHaveBeenCalledTimes(1);

            const cancelled = timer.clearInterval(id);
            expect(cancelled).toBe(true);
            expect(timer.activeCount).toBe(0);

            jest.advanceTimersByTime(100);
            expect(callback).toHaveBeenCalledTimes(1); // No new calls
        });
    });

    describe("setGuardedInterval", () => {
        it("should self-destruct when aborted returns true", () => {
            const callback = jest.fn();
            let shouldAbort = false;

            timer.setGuardedInterval(callback, 100, () => shouldAbort);

            jest.advanceTimersByTime(100);
            expect(callback).toHaveBeenCalledTimes(1);

            shouldAbort = true;
            jest.advanceTimersByTime(100); // This tick should abort

            expect(callback).toHaveBeenCalledTimes(1); // Not called again
            expect(timer.activeCount).toBe(0);
            expect(timer.getStats().suppressed).toBe(1);
        });
    });

    describe("clearAll", () => {
        it("should clear all pending timers and intervals", () => {
            const cb1 = jest.fn();
            const cb2 = jest.fn();

            timer.setTimeout(cb1, 100);
            timer.setInterval(cb2, 100);

            expect(timer.activeCount).toBe(2);

            const clearedCount = timer.clearAll();
            expect(clearedCount).toBe(2);
            expect(timer.activeCount).toBe(0);

            jest.advanceTimersByTime(100);
            expect(cb1).not.toHaveBeenCalled();
            expect(cb2).not.toHaveBeenCalled();
        });
    });

    describe("stats", () => {
        it("should reset stats", () => {
            timer.setTimeout(() => {}, 100);
            jest.advanceTimersByTime(100);

            expect(timer.getStats().created).toBe(1);

            timer.resetStats();
            expect(timer.getStats().created).toBe(0);
        });
    });
});
