const { setupActivityIdleWatcher } = require("../idle-watcher");

describe("setupActivityIdleWatcher", () => {
    let mockActivity;

    beforeEach(() => {
        jest.useFakeTimers();
        mockActivity = {
            turtles: {
                running: jest.fn().mockReturnValue(false)
            },
            logo: {
                _alreadyRunning: false
            },
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            _stopIdleWatcher: jest.fn()
        };

        window.createjs = {
            Ticker: {
                framerate: 60
            }
        };
        global.createjs = window.createjs;
        globalThis.createjs = window.createjs;
        window.debugLog = jest.fn();
        global.debugLog = jest.fn();
        globalThis.debugLog = jest.fn();

        setupActivityIdleWatcher(mockActivity);
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
        delete global.createjs;
        delete global.debugLog;
    });

    it("should initialize idle watcher properties", () => {
        expect(mockActivity.isAppIdle).toBe(false);
        expect(typeof mockActivity._initIdleWatcher).toBe("function");
        expect(typeof mockActivity._stopIdleWatcher).toBe("function");
    });

    describe("Auto-save interval", () => {
        it("should call saveSessionAsync if available", () => {
            mockActivity.saveSessionAsync = jest.fn();
            mockActivity._initIdleWatcher();
            mockActivity._initAutoSave();

            // Fast forward 5 minutes
            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(mockActivity.saveSessionAsync).toHaveBeenCalled();
        });

        it("should call saveLocally if saveSessionAsync is not available", () => {
            mockActivity.saveSessionAsync = undefined;
            mockActivity.saveLocally = jest.fn();
            mockActivity._initIdleWatcher();
            mockActivity._initAutoSave();

            // Fast forward 5 minutes
            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(mockActivity.saveLocally).toHaveBeenCalled();
        });

        it("should not save if logo is running", () => {
            mockActivity.saveSessionAsync = jest.fn();
            mockActivity.logo._alreadyRunning = true;
            mockActivity._initIdleWatcher();
            mockActivity._initAutoSave();

            // Fast forward 5 minutes
            jest.advanceTimersByTime(5 * 60 * 1000);

            expect(mockActivity.saveSessionAsync).not.toHaveBeenCalled();
        });
    });
});
