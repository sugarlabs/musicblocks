const { setupActivityIdleWatcher } = require("../idle-watcher");

describe("idle-watcher", () => {
    let activity;
    let mockCreatejs;
    let mockErrorHandler;
    let originalDateNow;

    beforeEach(() => {
        jest.useFakeTimers();
        originalDateNow = Date.now;

        // Setup globals
        global.debugLog = jest.fn();

        mockCreatejs = {
            Ticker: {
                framerate: 60
            }
        };
        global.createjs = mockCreatejs;

        mockErrorHandler = {
            recoverable: jest.fn()
        };
        global.ErrorHandler = mockErrorHandler;

        // Mock window for event listeners
        global.window = {};

        activity = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            turtles: {
                running: jest.fn().mockReturnValue(false)
            },
            saveLocally: jest.fn(),
            stageDirty: false,
            logo: {
                _alreadyRunning: false
            }
        };

        setupActivityIdleWatcher(activity);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.useRealTimers();
        Date.now = originalDateNow;
        delete global.debugLog;
        delete global.createjs;
        delete global.ErrorHandler;
        delete global.window;
    });

    describe("Initialization", () => {
        it("attaches _initIdleWatcher, _stopIdleWatcher, _initAutoSave, _stopAutoSave to activity", () => {
            expect(typeof activity._initIdleWatcher).toBe("function");
            expect(typeof activity._stopIdleWatcher).toBe("function");
            expect(typeof activity._initAutoSave).toBe("function");
            expect(typeof activity._stopAutoSave).toBe("function");
        });
    });

    describe("Idle Watcher (_initIdleWatcher & _stopIdleWatcher)", () => {
        it("sets up interval and event listeners when _initIdleWatcher is called", () => {
            jest.spyOn(global, "setInterval");
            activity._initIdleWatcher();

            expect(activity.addEventListener).toHaveBeenCalledWith(
                global.window,
                "mousemove",
                activity._resetIdleTimer
            );
            expect(activity.addEventListener).toHaveBeenCalledWith(
                global.window,
                "mousedown",
                activity._resetIdleTimer
            );
            expect(activity.addEventListener).toHaveBeenCalledWith(
                global.window,
                "keydown",
                activity._resetIdleTimer
            );
            expect(activity.addEventListener).toHaveBeenCalledWith(
                global.window,
                "touchstart",
                activity._resetIdleTimer
            );
            expect(activity.addEventListener).toHaveBeenCalledWith(
                global.window,
                "wheel",
                activity._resetIdleTimer,
                { passive: true }
            );

            expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 1000);
            expect(activity._idleWatcherInterval).toBeDefined();
        });

        it("clears interval and removes listeners when _stopIdleWatcher is called", () => {
            activity._initIdleWatcher();
            const resetTimerFunc = activity._resetIdleTimer;
            const interval = activity._idleWatcherInterval;

            jest.spyOn(global, "clearInterval");

            activity._stopIdleWatcher();

            expect(clearInterval).toHaveBeenCalledWith(interval);

            expect(activity.removeEventListener).toHaveBeenCalledWith(
                global.window,
                "mousemove",
                resetTimerFunc
            );
            expect(activity.removeEventListener).toHaveBeenCalledWith(
                global.window,
                "mousedown",
                resetTimerFunc
            );
            expect(activity.removeEventListener).toHaveBeenCalledWith(
                global.window,
                "keydown",
                resetTimerFunc
            );
            expect(activity.removeEventListener).toHaveBeenCalledWith(
                global.window,
                "touchstart",
                resetTimerFunc
            );
            expect(activity.removeEventListener).toHaveBeenCalledWith(
                global.window,
                "wheel",
                resetTimerFunc
            );

            expect(activity._idleWatcherInterval).toBeUndefined();
            expect(activity._resetIdleTimer).toBeUndefined();
        });

        it("does not leak listeners when _initIdleWatcher is called twice", () => {
            activity._initIdleWatcher();
            const firstInterval = activity._idleWatcherInterval;
            const resetTimerFunc = activity._resetIdleTimer;

            jest.spyOn(global, "clearInterval");

            activity._initIdleWatcher();

            expect(clearInterval).toHaveBeenCalledWith(firstInterval);
            expect(activity.removeEventListener).toHaveBeenCalledWith(
                global.window,
                "mousemove",
                resetTimerFunc
            );
            // Verify new listeners and interval were created
            expect(activity.addEventListener).toHaveBeenCalledTimes(10); // 5 from first call, 5 from second
        });

        it("becomes idle and drops framerate after IDLE_THRESHOLD", () => {
            let currentTime = 10000;
            Date.now = jest.fn(() => currentTime);

            activity._initIdleWatcher();

            expect(activity.isAppIdle).toBe(false);
            expect(mockCreatejs.Ticker.framerate).toBe(60);

            // Advance time by 6 seconds (threshold is 5s)
            currentTime += 6000;

            // Run interval callbacks
            jest.advanceTimersByTime(1000);

            expect(activity.isAppIdle).toBe(true);
            expect(mockCreatejs.Ticker.framerate).toBe(1);
            expect(global.debugLog).toHaveBeenCalled();
        });

        it("wakes up on user event resetting idle state and framerate", () => {
            let currentTime = 10000;
            Date.now = jest.fn(() => currentTime);

            activity._initIdleWatcher();

            currentTime += 6000;
            jest.advanceTimersByTime(1000);

            expect(activity.isAppIdle).toBe(true);
            expect(mockCreatejs.Ticker.framerate).toBe(1);

            // Trigger wake-up function
            activity._resetIdleTimer();

            expect(activity.isAppIdle).toBe(false);
            expect(mockCreatejs.Ticker.framerate).toBe(60);
            expect(activity.stageDirty).toBe(true);
        });

        it("wakes up if music starts playing while idle", () => {
            let currentTime = 10000;
            Date.now = jest.fn(() => currentTime);

            activity._initIdleWatcher();

            currentTime += 6000;
            jest.advanceTimersByTime(1000);

            expect(activity.isAppIdle).toBe(true);

            // Music starts playing
            activity.turtles.running.mockReturnValue(true);

            jest.advanceTimersByTime(1000); // Check idle watcher again

            expect(activity.isAppIdle).toBe(false);
            expect(mockCreatejs.Ticker.framerate).toBe(60);
        });

        it("does not become idle if music is playing", () => {
            let currentTime = 10000;
            Date.now = jest.fn(() => currentTime);

            activity._initIdleWatcher();

            activity.turtles.running.mockReturnValue(true);

            currentTime += 6000;
            jest.advanceTimersByTime(1000);

            expect(activity.isAppIdle).toBe(false);
            expect(mockCreatejs.Ticker.framerate).toBe(60);
        });
    });

    describe("Auto Save (_initAutoSave & _stopAutoSave)", () => {
        it("sets auto save interval and calls saveLocally", () => {
            activity._initAutoSave();

            expect(activity._autoSaveInterval).not.toBeNull();

            // Fast-forward time by 5 minutes
            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(activity.saveLocally).toHaveBeenCalledTimes(1);
        });

        it("does not save locally if logo is running", () => {
            activity._initAutoSave();

            activity.logo._alreadyRunning = true;

            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(activity.saveLocally).not.toHaveBeenCalled();
        });

        it("does not save locally if saveLocally is not defined", () => {
            activity.saveLocally = null;
            activity._initAutoSave();

            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(activity.saveLocally).toBeNull();
        });

        it("clears interval when _stopAutoSave is called", () => {
            activity._initAutoSave();
            const interval = activity._autoSaveInterval;

            jest.spyOn(global, "clearInterval");

            activity._stopAutoSave();

            expect(clearInterval).toHaveBeenCalledWith(interval);
            expect(activity._autoSaveInterval).toBeNull();
        });

        it("recovers from errors during saveLocally", () => {
            activity._initAutoSave();

            const error = new Error("Save failed");
            activity.saveLocally.mockImplementation(() => {
                throw error;
            });

            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(mockErrorHandler.recoverable).toHaveBeenCalledWith(error, {
                operation: "autoSave"
            });
        });
    });
});
