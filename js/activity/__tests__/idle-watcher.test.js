/**
 * MusicBlocks v3.4.1
 *
 * @author Lavjeet Kumar Rai
 *
 * @copyright 2026 Lavjeet Kumar Rai
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

const { setupActivityIdleWatcher } = require("../idle-watcher");

describe("setupActivityIdleWatcher", () => {
    let mockActivity;

    beforeEach(() => {
        // Setup global mocks
        global.createjs = {
            Ticker: {
                framerate: 60
            }
        };
        global.debugLog = jest.fn();
        global.ErrorHandler = {
            recoverable: jest.fn()
        };

        // Setup mock activity instance
        mockActivity = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            turtles: {
                running: jest.fn().mockReturnValue(false)
            },
            logo: {
                _alreadyRunning: false
            },
            saveLocally: jest.fn(),
            stageDirty: false
        };

        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
        jest.useRealTimers();
        delete global.createjs;
        delete global.debugLog;
        delete global.ErrorHandler;
    });

    describe("_initIdleWatcher", () => {
        it("initializes state variables correctly", () => {
            setupActivityIdleWatcher(mockActivity);
            expect(mockActivity.isAppIdle).toBe(false);
            expect(mockActivity._idleWatcherInterval).toBeUndefined();
            expect(mockActivity._autoSaveInterval).toBeNull();
        });

        it("adds event listeners on init", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity._initIdleWatcher();

            expect(mockActivity.addEventListener).toHaveBeenCalledWith(
                window,
                "mousemove",
                mockActivity._resetIdleTimer
            );
            expect(mockActivity.addEventListener).toHaveBeenCalledWith(
                window,
                "mousedown",
                mockActivity._resetIdleTimer
            );
            expect(mockActivity.addEventListener).toHaveBeenCalledWith(
                window,
                "keydown",
                mockActivity._resetIdleTimer
            );
            expect(mockActivity.addEventListener).toHaveBeenCalledWith(
                window,
                "touchstart",
                mockActivity._resetIdleTimer
            );
            expect(mockActivity.addEventListener).toHaveBeenCalledWith(
                window,
                "wheel",
                mockActivity._resetIdleTimer,
                { passive: true }
            );
        });

        it("throttles framerate when idle threshold is reached", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity._initIdleWatcher();

            expect(mockActivity.isAppIdle).toBe(false);
            expect(global.createjs.Ticker.framerate).toBe(60);

            // Advance time past 5000ms threshold
            jest.advanceTimersByTime(6000);

            expect(mockActivity.isAppIdle).toBe(true);
            expect(global.createjs.Ticker.framerate).toBe(1);
            expect(global.debugLog).toHaveBeenCalledWith(
                expect.stringContaining("Idle mode: Throttling to 1 FPS to save battery")
            );
        });

        it("wakes up on user activity", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity._initIdleWatcher();

            // Make it idle first
            jest.advanceTimersByTime(6000);
            expect(mockActivity.isAppIdle).toBe(true);

            // Simulate activity
            mockActivity._resetIdleTimer();

            expect(mockActivity.isAppIdle).toBe(false);
            expect(global.createjs.Ticker.framerate).toBe(60);
            expect(mockActivity.stageDirty).toBe(true);
        });

        it("does not idle if music is playing", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity.turtles.running.mockReturnValue(true);
            mockActivity._initIdleWatcher();

            jest.advanceTimersByTime(6000);

            expect(mockActivity.isAppIdle).toBe(false);
            expect(global.createjs.Ticker.framerate).toBe(60);
        });

        it("wakes up if music starts playing while idle", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity._initIdleWatcher();

            // Make it idle
            jest.advanceTimersByTime(6000);
            expect(mockActivity.isAppIdle).toBe(true);

            // Music starts
            mockActivity.turtles.running.mockReturnValue(true);

            // Advance next interval tick
            jest.advanceTimersByTime(1000);

            expect(mockActivity.isAppIdle).toBe(false);
            expect(global.createjs.Ticker.framerate).toBe(60);
            expect(mockActivity.stageDirty).toBe(true);
        });

        it("does not accumulate listeners or intervals when called twice", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity._initIdleWatcher();

            const firstListenerCount = mockActivity.addEventListener.mock.calls.length;
            const firstInterval = mockActivity._idleWatcherInterval;

            const clearIntervalSpy = jest.spyOn(global, "clearInterval");

            // Call _initIdleWatcher again (double init)
            mockActivity._initIdleWatcher();

            // The old interval should have been cleared by _stopIdleWatcher
            expect(clearIntervalSpy).toHaveBeenCalledWith(firstInterval);

            // Listeners should be re-added, not accumulated
            // The second init should have removed old listeners then added new ones
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "mousemove",
                expect.any(Function)
            );
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "mousedown",
                expect.any(Function)
            );
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "keydown",
                expect.any(Function)
            );
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "touchstart",
                expect.any(Function)
            );
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "wheel",
                expect.any(Function)
            );

            // New interval should be a different handle
            expect(mockActivity._idleWatcherInterval).not.toBe(firstInterval);

            // addEventListener should have been called same number of times each init
            // (5 listeners per init, so 10 total)
            expect(mockActivity.addEventListener).toHaveBeenCalledTimes(firstListenerCount * 2);
        });
    });

    describe("_stopIdleWatcher", () => {
        it("removes event listeners and clears interval", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity._initIdleWatcher();

            const clearIntervalSpy = jest.spyOn(global, "clearInterval");
            mockActivity._stopIdleWatcher();

            expect(clearIntervalSpy).toHaveBeenCalledWith(expect.any(Number));
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "mousemove",
                expect.any(Function)
            );
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "mousedown",
                expect.any(Function)
            );
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "keydown",
                expect.any(Function)
            );
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "touchstart",
                expect.any(Function)
            );
            expect(mockActivity.removeEventListener).toHaveBeenCalledWith(
                window,
                "wheel",
                expect.any(Function)
            );
            expect(mockActivity._idleWatcherInterval).toBeUndefined();
            expect(mockActivity._resetIdleTimer).toBeUndefined();
        });
    });

    describe("_initAutoSave", () => {
        it("saves locally after 5 minutes", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity._initAutoSave();

            expect(mockActivity.saveLocally).not.toHaveBeenCalled();

            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(mockActivity.saveLocally).toHaveBeenCalledTimes(1);
        });

        it("does not save if logo is already running", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity.logo._alreadyRunning = true;
            mockActivity._initAutoSave();

            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(mockActivity.saveLocally).not.toHaveBeenCalled();
        });

        it("catches errors and calls ErrorHandler.recoverable", () => {
            setupActivityIdleWatcher(mockActivity);
            const testError = new Error("Save failed");
            mockActivity.saveLocally.mockImplementation(() => {
                throw testError;
            });
            mockActivity._initAutoSave();

            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(global.ErrorHandler.recoverable).toHaveBeenCalledWith(testError, {
                operation: "autoSave"
            });
        });

        it("does not throw when saveLocally is null", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity.saveLocally = null;
            mockActivity._initAutoSave();

            jest.advanceTimersByTime(5 * 60 * 1000);

            // Should not crash and ErrorHandler should not be called
            expect(global.ErrorHandler.recoverable).not.toHaveBeenCalled();
        });
    });

    describe("_stopAutoSave", () => {
        it("clears auto save interval", () => {
            setupActivityIdleWatcher(mockActivity);
            mockActivity._initAutoSave();

            const clearIntervalSpy = jest.spyOn(global, "clearInterval");
            mockActivity._stopAutoSave();

            expect(clearIntervalSpy).toHaveBeenCalled();
            expect(mockActivity._autoSaveInterval).toBeNull();
        });
    });
});
