/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2025 Music Blocks Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

const ManagedTimer = require("../utils/ManagedTimer");

describe("ManagedTimer", () => {
    let timer;

    beforeEach(() => {
        jest.useFakeTimers();
        timer = new ManagedTimer();
    });

    afterEach(() => {
        timer.clearAll();
        jest.useRealTimers();
    });

    // =========================================================================
    // Constructor & initial state
    // =========================================================================

    describe("Constructor", () => {
        test("initializes with zero active timers", () => {
            expect(timer.activeCount).toBe(0);
            expect(timer.activeTimeoutCount).toBe(0);
            expect(timer.activeIntervalCount).toBe(0);
        });

        test("initializes all stats counters to zero", () => {
            const stats = timer.getStats();
            expect(stats.created).toBe(0);
            expect(stats.cancelled).toBe(0);
            expect(stats.fired).toBe(0);
            expect(stats.suppressed).toBe(0);
            expect(stats.active).toBe(0);
        });

        test("totalCreated starts at 0", () => {
            expect(timer.totalCreated).toBe(0);
        });

        test("totalCancelled starts at 0", () => {
            expect(timer.totalCancelled).toBe(0);
        });

        test("totalFired starts at 0", () => {
            expect(timer.totalFired).toBe(0);
        });

        test("totalSuppressed starts at 0", () => {
            expect(timer.totalSuppressed).toBe(0);
        });
    });

    // =========================================================================
    // setTimeout
    // =========================================================================

    describe("setTimeout", () => {
        test("fires callback after specified delay", () => {
            const callback = jest.fn();
            timer.setTimeout(callback, 500);

            expect(callback).not.toHaveBeenCalled();
            jest.advanceTimersByTime(500);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("tracks the timer as active until it fires", () => {
            timer.setTimeout(() => {}, 1000);

            expect(timer.activeTimeoutCount).toBe(1);
            expect(timer.activeCount).toBe(1);

            jest.advanceTimersByTime(1000);

            expect(timer.activeTimeoutCount).toBe(0);
            expect(timer.activeCount).toBe(0);
        });

        test("returns a numeric timer ID", () => {
            const id = timer.setTimeout(() => {}, 100);
            expect(typeof id).toBe("number");
        });

        test("increments totalCreated for each call", () => {
            timer.setTimeout(() => {}, 100);
            timer.setTimeout(() => {}, 200);
            timer.setTimeout(() => {}, 300);

            expect(timer.totalCreated).toBe(3);
        });

        test("increments totalFired when callback executes", () => {
            timer.setTimeout(() => {}, 100);
            timer.setTimeout(() => {}, 200);

            jest.advanceTimersByTime(100);
            expect(timer.totalFired).toBe(1);

            jest.advanceTimersByTime(100);
            expect(timer.totalFired).toBe(2);
        });

        test("uses delay=0 when no delay provided", () => {
            const callback = jest.fn();
            timer.setTimeout(callback);

            jest.advanceTimersByTime(0);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("handles multiple timers with different delays", () => {
            const results = [];
            timer.setTimeout(() => results.push("a"), 100);
            timer.setTimeout(() => results.push("b"), 50);
            timer.setTimeout(() => results.push("c"), 200);

            jest.advanceTimersByTime(200);
            expect(results).toEqual(["b", "a", "c"]);
        });
    });

    // =========================================================================
    // setGuardedTimeout
    // =========================================================================

    describe("setGuardedTimeout", () => {
        test("fires callback when guard returns false", () => {
            const callback = jest.fn();
            timer.setGuardedTimeout(callback, 500, () => false);

            jest.advanceTimersByTime(500);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("suppresses callback when guard returns true", () => {
            const callback = jest.fn();
            timer.setGuardedTimeout(callback, 500, () => true);

            jest.advanceTimersByTime(500);
            expect(callback).not.toHaveBeenCalled();
        });

        test("increments totalSuppressed when guard blocks callback", () => {
            timer.setGuardedTimeout(jest.fn(), 100, () => true);

            jest.advanceTimersByTime(100);
            expect(timer.totalSuppressed).toBe(1);
            expect(timer.totalFired).toBe(0);
        });

        test("removes timer from active set even when suppressed", () => {
            timer.setGuardedTimeout(jest.fn(), 100, () => true);

            expect(timer.activeTimeoutCount).toBe(1);
            jest.advanceTimersByTime(100);
            expect(timer.activeTimeoutCount).toBe(0);
        });

        test("evaluates guard at fire time, not at schedule time", () => {
            let stopped = false;
            const callback = jest.fn();
            timer.setGuardedTimeout(callback, 500, () => stopped);

            // Guard is false at schedule time
            jest.advanceTimersByTime(250);
            // Change guard mid-flight
            stopped = true;
            jest.advanceTimersByTime(250);

            // Callback suppressed because guard was true at fire time
            expect(callback).not.toHaveBeenCalled();
            expect(timer.totalSuppressed).toBe(1);
        });

        test("simulates Logo stopTurtle scenario", () => {
            // This is the exact pattern used in logo.js
            let stopTurtle = false;
            const turtleAction = jest.fn();

            // Schedule 10 turtle graphics animations (like dispatchTurtleSignals does)
            for (let t = 0; t < 10; t++) {
                timer.setGuardedTimeout(
                    () => turtleAction(t),
                    t * 50,
                    () => stopTurtle
                );
            }

            expect(timer.activeTimeoutCount).toBe(10);

            // Let first 3 fire
            jest.advanceTimersByTime(100);
            expect(turtleAction).toHaveBeenCalledTimes(3); // t=0, t=1, t=2

            // User presses Stop
            stopTurtle = true;

            // Remaining 7 should be suppressed
            jest.advanceTimersByTime(500);
            expect(turtleAction).toHaveBeenCalledTimes(3);
            expect(timer.totalSuppressed).toBe(7);
            expect(timer.totalFired).toBe(3);
        });
    });

    // =========================================================================
    // setInterval
    // =========================================================================

    describe("setInterval", () => {
        test("fires callback repeatedly at the specified interval", () => {
            const callback = jest.fn();
            timer.setInterval(callback, 100);

            jest.advanceTimersByTime(350);
            expect(callback).toHaveBeenCalledTimes(3);
        });

        test("tracks the interval as active", () => {
            timer.setInterval(() => {}, 100);

            expect(timer.activeIntervalCount).toBe(1);
            expect(timer.activeCount).toBe(1);
        });

        test("returns a numeric interval ID", () => {
            const id = timer.setInterval(() => {}, 100);
            expect(typeof id).toBe("number");
        });

        test("increments totalFired on each tick", () => {
            timer.setInterval(() => {}, 100);

            jest.advanceTimersByTime(500);
            expect(timer.totalFired).toBe(5);
        });
    });

    // =========================================================================
    // setGuardedInterval
    // =========================================================================

    describe("setGuardedInterval", () => {
        test("fires callback while guard returns false", () => {
            const callback = jest.fn();
            timer.setGuardedInterval(callback, 100, () => false);

            jest.advanceTimersByTime(350);
            expect(callback).toHaveBeenCalledTimes(3);
        });

        test("self-destructs when guard returns true", () => {
            let count = 0;
            let stopped = false;
            const callback = jest.fn(() => {
                count++;
                if (count >= 3) stopped = true;
            });

            timer.setGuardedInterval(callback, 100, () => stopped);

            jest.advanceTimersByTime(1000);
            // Should have fired 3 times, then the 4th tick sees guard=true and self-destructs
            expect(callback).toHaveBeenCalledTimes(3);
            expect(timer.activeIntervalCount).toBe(0);
            expect(timer.totalSuppressed).toBe(1);
        });

        test("removes interval from active set on self-destruct", () => {
            timer.setGuardedInterval(jest.fn(), 100, () => true);

            expect(timer.activeIntervalCount).toBe(1);
            jest.advanceTimersByTime(100);
            expect(timer.activeIntervalCount).toBe(0);
        });
    });

    // =========================================================================
    // clearTimeout
    // =========================================================================

    describe("clearTimeout", () => {
        test("cancels a pending timeout", () => {
            const callback = jest.fn();
            const id = timer.setTimeout(callback, 500);

            timer.clearTimeout(id);
            jest.advanceTimersByTime(1000);
            expect(callback).not.toHaveBeenCalled();
        });

        test("returns true when timer was found and cancelled", () => {
            const id = timer.setTimeout(() => {}, 500);
            expect(timer.clearTimeout(id)).toBe(true);
        });

        test("returns false for unknown timer ID", () => {
            expect(timer.clearTimeout(999999)).toBe(false);
        });

        test("removes the timer from the active set", () => {
            const id = timer.setTimeout(() => {}, 500);
            expect(timer.activeTimeoutCount).toBe(1);

            timer.clearTimeout(id);
            expect(timer.activeTimeoutCount).toBe(0);
        });

        test("increments totalCancelled", () => {
            const id = timer.setTimeout(() => {}, 500);
            timer.clearTimeout(id);
            expect(timer.totalCancelled).toBe(1);
        });

        test("does not increment totalCancelled for unknown ID", () => {
            timer.clearTimeout(999999);
            expect(timer.totalCancelled).toBe(0);
        });
    });

    // =========================================================================
    // clearInterval
    // =========================================================================

    describe("clearInterval", () => {
        test("cancels a pending interval", () => {
            const callback = jest.fn();
            const id = timer.setInterval(callback, 100);

            timer.clearInterval(id);
            jest.advanceTimersByTime(500);
            expect(callback).not.toHaveBeenCalled();
        });

        test("returns true when interval was found and cancelled", () => {
            const id = timer.setInterval(() => {}, 100);
            expect(timer.clearInterval(id)).toBe(true);
        });

        test("returns false for unknown interval ID", () => {
            expect(timer.clearInterval(999999)).toBe(false);
        });

        test("removes the interval from the active set", () => {
            const id = timer.setInterval(() => {}, 100);
            expect(timer.activeIntervalCount).toBe(1);

            timer.clearInterval(id);
            expect(timer.activeIntervalCount).toBe(0);
        });
    });

    // =========================================================================
    // clearAll  (THE CRITICAL STOP MECHANISM)
    // =========================================================================

    describe("clearAll", () => {
        test("cancels all pending timeouts", () => {
            const callbacks = [jest.fn(), jest.fn(), jest.fn()];
            callbacks.forEach((cb, i) => timer.setTimeout(cb, (i + 1) * 100));

            expect(timer.activeTimeoutCount).toBe(3);
            timer.clearAll();
            expect(timer.activeTimeoutCount).toBe(0);

            jest.advanceTimersByTime(1000);
            callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled());
        });

        test("cancels all pending intervals", () => {
            const callbacks = [jest.fn(), jest.fn()];
            callbacks.forEach((cb, i) => timer.setInterval(cb, (i + 1) * 100));

            expect(timer.activeIntervalCount).toBe(2);
            timer.clearAll();
            expect(timer.activeIntervalCount).toBe(0);

            jest.advanceTimersByTime(1000);
            callbacks.forEach(cb => expect(cb).not.toHaveBeenCalled());
        });

        test("cancels mix of timeouts and intervals", () => {
            timer.setTimeout(jest.fn(), 100);
            timer.setTimeout(jest.fn(), 200);
            timer.setInterval(jest.fn(), 50);

            expect(timer.activeCount).toBe(3);

            const cancelled = timer.clearAll();
            expect(cancelled).toBe(3);
            expect(timer.activeCount).toBe(0);
        });

        test("returns the count of cancelled timers", () => {
            timer.setTimeout(jest.fn(), 100);
            timer.setTimeout(jest.fn(), 200);
            timer.setInterval(jest.fn(), 50);
            timer.setInterval(jest.fn(), 75);

            expect(timer.clearAll()).toBe(4);
        });

        test("returns 0 when no timers are active", () => {
            expect(timer.clearAll()).toBe(0);
        });

        test("increments totalCancelled by the count of cancelled timers", () => {
            timer.setTimeout(jest.fn(), 100);
            timer.setTimeout(jest.fn(), 200);
            timer.setInterval(jest.fn(), 50);

            timer.clearAll();
            expect(timer.totalCancelled).toBe(3);
        });

        test("simulates doStopTurtles cancelling embedded graphics timers", () => {
            // Simulate what dispatchTurtleSignals does:
            // It creates ~8 setTimeout per note for forward/right/arc animations
            const turtleActions = [];
            for (let note = 0; note < 4; note++) {
                for (let step = 0; step < 8; step++) {
                    timer.setGuardedTimeout(
                        () => turtleActions.push({ note, step }),
                        note * 500 + step * 50,
                        () => false // guard not yet triggered
                    );
                }
            }

            expect(timer.activeTimeoutCount).toBe(32);

            // User presses Stop → doStopTurtles calls clearAll
            const cancelled = timer.clearAll();
            expect(cancelled).toBe(32);
            expect(timer.activeTimeoutCount).toBe(0);

            // No zombie actions should fire
            jest.advanceTimersByTime(10000);
            expect(turtleActions).toEqual([]);
        });

        test("can be called multiple times safely", () => {
            timer.setTimeout(jest.fn(), 100);
            timer.clearAll();
            timer.clearAll();
            timer.clearAll();

            expect(timer.activeCount).toBe(0);
        });
    });

    // =========================================================================
    // resetStats
    // =========================================================================

    describe("resetStats", () => {
        test("resets all counters to zero", () => {
            timer.setTimeout(jest.fn(), 100);
            timer.setTimeout(jest.fn(), 200);
            jest.advanceTimersByTime(100);

            // Some stats should be non-zero now
            expect(timer.totalCreated).toBeGreaterThan(0);

            timer.resetStats();

            expect(timer.totalCreated).toBe(0);
            expect(timer.totalCancelled).toBe(0);
            expect(timer.totalFired).toBe(0);
            expect(timer.totalSuppressed).toBe(0);
        });

        test("does NOT cancel pending timers", () => {
            const callback = jest.fn();
            timer.setTimeout(callback, 500);

            timer.resetStats();
            expect(timer.activeTimeoutCount).toBe(1);

            jest.advanceTimersByTime(500);
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    // =========================================================================
    // getStats
    // =========================================================================

    describe("getStats", () => {
        test("returns accurate snapshot of all counters", () => {
            timer.setTimeout(jest.fn(), 100);
            timer.setGuardedTimeout(jest.fn(), 200, () => true); // will be suppressed
            timer.setInterval(jest.fn(), 50);

            jest.advanceTimersByTime(200);

            const stats = timer.getStats();
            expect(stats.created).toBe(3);
            expect(stats.fired).toBeGreaterThanOrEqual(1);
            expect(stats.suppressed).toBe(1);
            expect(stats.activeIntervals).toBe(1);
        });

        test("includes activeTimeouts and activeIntervals breakdowns", () => {
            timer.setTimeout(jest.fn(), 1000);
            timer.setTimeout(jest.fn(), 2000);
            timer.setInterval(jest.fn(), 500);

            const stats = timer.getStats();
            expect(stats.activeTimeouts).toBe(2);
            expect(stats.activeIntervals).toBe(1);
            expect(stats.active).toBe(3);
        });
    });

    // =========================================================================
    // Defense-in-depth: clearAll + guard combined
    // =========================================================================

    describe("Defense-in-depth (clearAll + guard)", () => {
        test("both mechanisms work together for maximum safety", () => {
            let stopTurtle = false;
            const earlyAction = jest.fn();
            const lateAction = jest.fn();

            // Early timer (will be cleared by clearAll before it fires)
            timer.setGuardedTimeout(earlyAction, 100, () => stopTurtle);
            // Late timer (might escape clearAll in theory)
            timer.setGuardedTimeout(lateAction, 5000, () => stopTurtle);

            // Simulate pressing Stop at t=50
            jest.advanceTimersByTime(50);
            stopTurtle = true;
            timer.clearAll();

            // Nothing should fire
            jest.advanceTimersByTime(10000);
            expect(earlyAction).not.toHaveBeenCalled();
            expect(lateAction).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Edge cases
    // =========================================================================

    describe("Edge cases", () => {
        test("handles zero delay timeout", () => {
            const callback = jest.fn();
            timer.setTimeout(callback, 0);

            jest.advanceTimersByTime(0);
            expect(callback).toHaveBeenCalledTimes(1);
        });

        test("handles clearing a timer that has already fired", () => {
            const id = timer.setTimeout(jest.fn(), 100);
            jest.advanceTimersByTime(100);

            // Timer already fired, so clearTimeout should return false
            expect(timer.clearTimeout(id)).toBe(false);
        });

        test("handles rapid create-and-cancel cycles", () => {
            for (let i = 0; i < 100; i++) {
                const id = timer.setTimeout(jest.fn(), 100);
                timer.clearTimeout(id);
            }

            expect(timer.totalCreated).toBe(100);
            expect(timer.totalCancelled).toBe(100);
            expect(timer.activeCount).toBe(0);
        });

        test("handles many concurrent timers (stress test)", () => {
            const callbacks = [];
            for (let i = 0; i < 500; i++) {
                const cb = jest.fn();
                callbacks.push(cb);
                timer.setTimeout(cb, i * 10);
            }

            expect(timer.activeTimeoutCount).toBe(500);

            // Cancel all at once
            timer.clearAll();

            jest.advanceTimersByTime(10000);
            const totalCalled = callbacks.filter(cb => cb.mock.calls.length > 0).length;
            expect(totalCalled).toBe(0);
        });
    });

    // =========================================================================
    // Module exports
    // =========================================================================

    describe("Module exports", () => {
        test("ManagedTimer is exported correctly", () => {
            expect(ManagedTimer).toBeDefined();
            expect(typeof ManagedTimer).toBe("function");
        });

        test("can create multiple independent instances", () => {
            const timer1 = new ManagedTimer();
            const timer2 = new ManagedTimer();

            timer1.setTimeout(jest.fn(), 100);
            timer2.setTimeout(jest.fn(), 100);
            timer2.setTimeout(jest.fn(), 200);

            expect(timer1.activeTimeoutCount).toBe(1);
            expect(timer2.activeTimeoutCount).toBe(2);

            timer1.clearAll();
            expect(timer1.activeTimeoutCount).toBe(0);
            expect(timer2.activeTimeoutCount).toBe(2);

            timer2.clearAll();
        });
    });
});
