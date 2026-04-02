/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2026 Aditya Mishra
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

/**
 * @file performanceTracker.test.js
 * @description Tests for js/utils/performanceTracker.js
 */

const performanceTracker = require("../performanceTracker");

describe("performanceTracker", () => {
    beforeEach(() => {
        performanceTracker.disable();
        performanceTracker.reset();
    });

    describe("enable / disable / isEnabled", () => {
        test("is disabled by default after reset", () => {
            expect(performanceTracker.isEnabled()).toBe(false);
        });

        test("enable sets isEnabled to true", () => {
            performanceTracker.enable();
            expect(performanceTracker.isEnabled()).toBe(true);
        });

        test("disable sets isEnabled to false", () => {
            performanceTracker.enable();
            performanceTracker.disable();
            expect(performanceTracker.isEnabled()).toBe(false);
        });
    });

    describe("startRun / endRun", () => {
        test("startRun is no-op when disabled — executionTime stays null", () => {
            performanceTracker.startRun();
            expect(performanceTracker.getStats().executionTime).toBeNull();
        });

        test("endRun is no-op when disabled — does not throw", () => {
            expect(() => performanceTracker.endRun()).not.toThrow();
        });

        test("executionTime is null before endRun is called", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            expect(performanceTracker.getStats().executionTime).toBeNull();
        });

        test("endRun after startRun produces a non-negative executionTime", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();
            expect(performanceTracker.getStats().executionTime).toBeGreaterThanOrEqual(0);
        });
    });

    describe("getStats", () => {
        test("returns object with executionTime, memoryDelta, and maxDepth keys", () => {
            const stats = performanceTracker.getStats();
            expect(stats).toHaveProperty("executionTime");
            expect(stats).toHaveProperty("memoryDelta");
            expect(stats).toHaveProperty("maxDepth");
        });

        test("memoryDelta is null when performance.memory is unavailable (Node/Jest)", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();
            expect(performanceTracker.getStats().memoryDelta).toBeNull();
        });
    });

    describe("reset", () => {
        test("reset clears executionTime, memoryDelta, and maxDepth", () => {
            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();
            performanceTracker.enterBlock();
            performanceTracker.reset();
            const stats = performanceTracker.getStats();
            expect(stats.executionTime).toBeNull();
            expect(stats.memoryDelta).toBeNull();
            expect(stats.maxDepth).toBe(0);
        });
    });

    describe("enterBlock / exitBlock", () => {
        test("enterBlock is no-op when disabled — maxDepth stays 0", () => {
            performanceTracker.enterBlock();
            expect(performanceTracker.getStats().maxDepth).toBe(0);
        });

        test("exitBlock is no-op when disabled — does not throw", () => {
            expect(() => performanceTracker.exitBlock()).not.toThrow();
        });

        test("enterBlock increments maxDepth when enabled", () => {
            performanceTracker.enable();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            expect(performanceTracker.getStats().maxDepth).toBe(2);
        });

        test("exitBlock decrements depth but never below zero", () => {
            performanceTracker.enable();
            performanceTracker.enterBlock();
            performanceTracker.exitBlock();
            performanceTracker.exitBlock(); // extra exit, should clamp at 0
            // maxDepth retains the peak of 1
            expect(performanceTracker.getStats().maxDepth).toBe(1);
        });

        test("maxDepth tracks the peak, not the current depth", () => {
            performanceTracker.enable();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.enterBlock();
            performanceTracker.exitBlock();
            performanceTracker.exitBlock();
            // peak was 3; current is 1 — maxDepth should still be 3
            expect(performanceTracker.getStats().maxDepth).toBe(3);
        });
    });

    describe("logStats", () => {
        test("logStats is no-op when disabled — console.log not called", () => {
            const spy = jest.spyOn(console, "log").mockImplementation(() => {});
            performanceTracker.logStats();
            expect(spy).not.toHaveBeenCalled();
            spy.mockRestore();
        });

        test("logStats calls console.groupCollapsed, three console.logs, and console.groupEnd", () => {
            const gcSpy = jest.spyOn(console, "groupCollapsed").mockImplementation(() => {});
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            const geSpy = jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();
            performanceTracker.logStats();

            expect(gcSpy).toHaveBeenCalledTimes(1);
            expect(logSpy).toHaveBeenCalledTimes(3);
            expect(geSpy).toHaveBeenCalledTimes(1);

            gcSpy.mockRestore();
            logSpy.mockRestore();
            geSpy.mockRestore();
        });

        test("logStats shows 'N/A' for executionTime when no run has completed", () => {
            const gcSpy = jest.spyOn(console, "groupCollapsed").mockImplementation(() => {});
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.logStats();

            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("N/A"));

            gcSpy.mockRestore();
            logSpy.mockRestore();
        });

        test("logStats shows 'unsupported' for memoryDelta when memory API absent", () => {
            const gcSpy = jest.spyOn(console, "groupCollapsed").mockImplementation(() => {});
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();
            performanceTracker.logStats();

            expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("unsupported"));

            gcSpy.mockRestore();
            logSpy.mockRestore();
        });

        test("logStats falls back to console.group when groupCollapsed is unavailable", () => {
            const originalGC = console.groupCollapsed;
            console.groupCollapsed = undefined;

            const gSpy = jest.spyOn(console, "group").mockImplementation(() => {});
            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            jest.spyOn(console, "groupEnd").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.logStats();

            expect(gSpy).toHaveBeenCalledTimes(1);

            console.groupCollapsed = originalGC;
            gSpy.mockRestore();
            logSpy.mockRestore();
        });

        test("logStats falls back to console.log header when neither group method is available", () => {
            const originalGC = console.groupCollapsed;
            const originalG = console.group;
            console.groupCollapsed = undefined;
            console.group = undefined;

            const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

            performanceTracker.enable();
            performanceTracker.logStats();

            expect(logSpy).toHaveBeenCalled();

            console.groupCollapsed = originalGC;
            console.group = originalG;
            logSpy.mockRestore();
        });
    });

    describe("_now fallback (performance API unavailable)", () => {
        test("falls back to Date.now when global.performance is undefined", () => {
            const originalPerf = global.performance;
            global.performance = undefined;

            performanceTracker.enable();
            performanceTracker.startRun();
            performanceTracker.endRun();

            expect(performanceTracker.getStats().executionTime).toBeGreaterThanOrEqual(0);

            global.performance = originalPerf;
        });
    });
    describe("memory tracking", () => {});
});
