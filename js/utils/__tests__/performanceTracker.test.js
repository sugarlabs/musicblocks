/**
 * MusicBlocks v3.6.2
 *
 * @author eyeaadil
 *
 * @copyright 2026 eyeaadil
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

const performanceTracker = require("../performanceTracker");

describe("performanceTracker", () => {
    beforeEach(() => {
        performanceTracker.reset();
        performanceTracker.disable();
    });

    // ========================================================================
    // Enable / Disable / isEnabled
    // ========================================================================

    describe("enable and disable", () => {
        test("is disabled by default after reset", () => {
            expect(performanceTracker.isEnabled()).toBe(false);
        });

        test("can be enabled", () => {
            performanceTracker.enable();
            expect(performanceTracker.isEnabled()).toBe(true);
        });

        test("can be disabled after enabling", () => {
            performanceTracker.enable();
            performanceTracker.disable();
            expect(performanceTracker.isEnabled()).toBe(false);
        });

        test("enabling twice keeps it enabled", () => {
            performanceTracker.enable();
            performanceTracker.enable();
            expect(performanceTracker.isEnabled()).toBe(true);
        });

        test("disabling twice keeps it disabled", () => {
            performanceTracker.disable();
            performanceTracker.disable();
            expect(performanceTracker.isEnabled()).toBe(false);
        });
    });

    // ========================================================================
    // No-op behavior when disabled
    // ========================================================================

    describe("no-op behavior when disabled", () => {
        test("startRun is a no-op when disabled", () => {
            performanceTracker.startRun();
            const stats = performanceTracker.getStats();
            expect(stats.executionTime).toBeNull();
        });

        test("endRun is a no-op when disabled", () => {
            performanceTracker.endRun();
            const stats = performanceTracker.getStats();
            expect(stats.executionTime).toBeNull();
        });

        test("enterBlock is a no-op when disabled", () => {
            performanceTracker.enterBlock();
            const stats = performanceTracker.getStats();
            expect(stats.maxDepth).toBe(0);
        });

        test("exitBlock is a no-op when disabled", () => {
            performanceTracker.exitBlock();
            const stats = performanceTracker.getStats();
            expect(stats.maxDepth).toBe(0);
        });

        test("logStats is a no-op when disabled", () => {
            const spy = jest.spyOn(console, "log").mockImplementation(() => {});
            performanceTracker.logStats();
            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    // ========================================================================
    // getStats
    // ========================================================================

    describe("getStats", () => {
        test("returns initial stats with null values", () => {
            const stats = performanceTracker.getStats();
            expect(stats).toEqual({
                executionTime: null,
                memoryDelta: null,
                maxDepth: 0
            });
        });

        test("getStats works regardless of enabled state", () => {
            // getStats should always return stats, even when disabled
            const stats = performanceTracker.getStats();
            expect(stats).toHaveProperty("executionTime");
            expect(stats).toHaveProperty("memoryDelta");
            expect(stats).toHaveProperty("maxDepth");
        });
    });

    // ========================================================================
    // reset
    // ========================================================================

    describe("reset", () => {
        test("resets all stats to initial values", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.endRun();

            performanceTracker.reset();
            const stats = performanceTracker.getStats();
            expect(stats.executionTime).toBeNull();
            expect(stats.memoryDelta).toBeNull();
            expect(stats.maxDepth).toBe(0);
        });

        test("reset works regardless of enabled state", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.enterBlock();
            performanceTracker.disable();

            performanceTracker.reset();
            const stats = performanceTracker.getStats();
            expect(stats.maxDepth).toBe(0);
        });
    });

    // ========================================================================
    // Timing: startRun / endRun
    // ========================================================================

    describe("startRun and endRun", () => {
        test("records a positive execution time", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            // Simulate some work
            for (let i = 0; i < 1000; i++) {
                Math.sqrt(i);
            }
            performanceTracker.endRun();

            const stats = performanceTracker.getStats();
            expect(stats.executionTime).toBeGreaterThanOrEqual(0);
            expect(typeof stats.executionTime).toBe("number");
        });

        test("execution time is not null after a complete run", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();

            const stats = performanceTracker.getStats();
            expect(stats.executionTime).not.toBeNull();
        });

        test("startRun resets depth counters for a fresh measurement", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.endRun();

            expect(performanceTracker.getStats().maxDepth).toBe(3);

            // Starting a new run should reset counters
            performanceTracker.startRun();
            expect(performanceTracker.getStats().maxDepth).toBe(0);
        });

        test("multiple start/end cycles produce independent measurements", () => {
            performanceTracker.enable();

            // First run
            performanceTracker.startRun();
            performanceTracker.enterBlock();
            performanceTracker.endRun();
            const stats1 = performanceTracker.getStats();

            // Second run
            performanceTracker.startRun();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.endRun();
            const stats2 = performanceTracker.getStats();

            expect(stats2.maxDepth).toBe(2);
            // Stats1 maxDepth was 1, stats2 should be 2 (independent)
            expect(stats1.maxDepth).not.toBe(stats2.maxDepth);
        });
    });

    // ========================================================================
    // Memory tracking
    // ========================================================================

    describe("memory tracking", () => {
        test("memoryDelta is null when performance.memory is unsupported", () => {
            // jsdom does not have performance.memory, so memoryDelta should be null
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();

            const stats = performanceTracker.getStats();
            expect(stats.memoryDelta).toBeNull();
        });
    });

    // ========================================================================
    // Depth tracking: enterBlock / exitBlock
    // ========================================================================

    describe("enterBlock and exitBlock", () => {
        test("entering a single block sets maxDepth to 1", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.enterBlock();

            const stats = performanceTracker.getStats();
            expect(stats.maxDepth).toBe(1);
        });

        test("nested enters increment depth correctly", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();

            const stats = performanceTracker.getStats();
            expect(stats.maxDepth).toBe(3);
        });

        test("exitBlock decrements current depth", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.exitBlock();
            performanceTracker.enterBlock();

            // Max depth should still be 2, not 3
            const stats = performanceTracker.getStats();
            expect(stats.maxDepth).toBe(2);
        });

        test("exitBlock never goes below zero", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.exitBlock();
            performanceTracker.exitBlock();
            performanceTracker.exitBlock();

            // Should not crash, maxDepth should stay 0
            const stats = performanceTracker.getStats();
            expect(stats.maxDepth).toBe(0);
        });

        test("maxDepth tracks the peak, not current depth", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            // Go deep: 1 -> 2 -> 3 -> 4 -> 5
            for (let i = 0; i < 5; i++) {
                performanceTracker.enterBlock();
            }
            // Come back: 5 -> 4 -> 3 -> 2 -> 1 -> 0
            for (let i = 0; i < 5; i++) {
                performanceTracker.exitBlock();
            }
            // Go to depth 2 only
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();

            // Peak was 5, not current 2
            const stats = performanceTracker.getStats();
            expect(stats.maxDepth).toBe(5);
        });

        test("interleaved enter/exit pattern tracks correctly", () => {
            performanceTracker.enable();
            performanceTracker.startRun();

            // Simulate: enter -> enter -> exit -> enter -> exit -> exit
            performanceTracker.enterBlock(); // depth 1
            performanceTracker.enterBlock(); // depth 2
            performanceTracker.exitBlock(); // depth 1
            performanceTracker.enterBlock(); // depth 2
            performanceTracker.exitBlock(); // depth 1
            performanceTracker.exitBlock(); // depth 0

            const stats = performanceTracker.getStats();
            expect(stats.maxDepth).toBe(2);
        });
    });

    // ========================================================================
    // logStats (console output)
    // ========================================================================

    describe("logStats", () => {
        test("logs stats to console when enabled", () => {
            const groupSpy = jest.spyOn(console, "groupCollapsed").mockImplementation(() => {});
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const groupEndSpy = jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();
            performanceTracker.logStats();

            expect(groupSpy).toHaveBeenCalledWith("🎵 Music Blocks Performance Stats");
            expect(logSpy).toHaveBeenCalledTimes(3);
            expect(groupEndSpy).toHaveBeenCalled();

            groupSpy.mockRestore();
            logSpy.mockRestore();
            groupEndSpy.mockRestore();
        });

        test("logs N/A for execution time when not run", () => {
            const groupSpy = jest.spyOn(console, "groupCollapsed").mockImplementation(() => {});
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const groupEndSpy = jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.logStats();

            expect(logSpy).toHaveBeenCalledWith("⏱  Execution Time: N/A");

            groupSpy.mockRestore();
            logSpy.mockRestore();
            groupEndSpy.mockRestore();
        });

        test("logs memory as unsupported in jsdom", () => {
            const groupSpy = jest.spyOn(console, "groupCollapsed").mockImplementation(() => {});
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const groupEndSpy = jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();
            performanceTracker.logStats();

            expect(logSpy).toHaveBeenCalledWith("💾  Memory Delta: unsupported");

            groupSpy.mockRestore();
            logSpy.mockRestore();
            groupEndSpy.mockRestore();
        });

        test("logs maxDepth correctly after block tracking", () => {
            const groupSpy = jest.spyOn(console, "groupCollapsed").mockImplementation(() => {});
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const groupEndSpy = jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.endRun();
            performanceTracker.logStats();

            expect(logSpy).toHaveBeenCalledWith("📊  Max Execution Depth: 3");

            groupSpy.mockRestore();
            logSpy.mockRestore();
            groupEndSpy.mockRestore();
        });

        test("falls back to console.group if groupCollapsed unavailable", () => {
            const origGroupCollapsed = console.groupCollapsed;
            console.groupCollapsed = undefined;

            const groupSpy = jest.spyOn(console, "group").mockImplementation(() => {});
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const groupEndSpy = jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.logStats();

            expect(groupSpy).toHaveBeenCalledWith("🎵 Music Blocks Performance Stats");

            console.groupCollapsed = origGroupCollapsed;
            groupSpy.mockRestore();
            logSpy.mockRestore();
            groupEndSpy.mockRestore();
        });

        test("falls back to console.log if both group methods are unavailable", () => {
            const origGroupCollapsed = console.groupCollapsed;
            const origGroup = console.group;
            console.groupCollapsed = undefined;
            console.group = undefined;

            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const groupEndSpy = jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.logStats();

            // First call should be the group label
            expect(logSpy).toHaveBeenCalledWith("🎵 Music Blocks Performance Stats");

            console.groupCollapsed = origGroupCollapsed;
            console.group = origGroup;
            logSpy.mockRestore();
            groupEndSpy.mockRestore();
        });
    });

    // ========================================================================
    // Full lifecycle integration test
    // ========================================================================

    describe("full lifecycle", () => {
        test("complete workflow: enable -> start -> blocks -> end -> stats -> reset", () => {
            // Enable
            performanceTracker.enable();
            expect(performanceTracker.isEnabled()).toBe(true);

            // Start tracking
            performanceTracker.startRun();

            // Simulate block execution
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.exitBlock();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.exitBlock();
            performanceTracker.exitBlock();
            performanceTracker.exitBlock();

            // End tracking
            performanceTracker.endRun();

            // Check stats
            const stats = performanceTracker.getStats();
            expect(stats.executionTime).toBeGreaterThanOrEqual(0);
            expect(stats.maxDepth).toBe(3);

            // Reset
            performanceTracker.reset();
            const resetStats = performanceTracker.getStats();
            expect(resetStats.executionTime).toBeNull();
            expect(resetStats.maxDepth).toBe(0);
        });
    });
});
