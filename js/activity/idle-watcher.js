// Copyright (c) 2026 Sugarlabs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global ErrorHandler, debugLog, createjs */

/* exported setupActivityIdleWatcher */

/**
 * Sets up inactivity tracking and autosave logic for the Activity instance.
 * @param {object} activityInstance - The activity instance.
 */
const setupActivityIdleWatcher = activityInstance => {
    const activity = activityInstance;

    // Initialize state variables on the instance
    activity.isAppIdle ??= false;
    activity._idleWatcherInterval ??= undefined;
    activity._resetIdleTimer ??= undefined;
    activity._autoSaveInterval ??= null;

    /**
     * Initialize an idle watcher that throttles the application's framerate
     * when the application is inactive and no music is playing.
     * This significantly reduces CPU usage and improves battery life.
     *
     * Listeners and intervals are properly cleaned up via stopIdleWatcher()
     * to prevent accumulation on re-initialization.
     */
    activity._initIdleWatcher = () => {
        // Ensure any prior idle watcher is cleaned up before reinitializing
        activity._stopIdleWatcher();

        const IDLE_THRESHOLD = 5000; // 5 seconds
        const ACTIVE_FPS = 60;
        const IDLE_FPS = 1;

        let lastActivity = Date.now();
        activity.isAppIdle = false;

        // Wake up function - restores full framerate
        // Stored as instance property for cleanup
        activity._resetIdleTimer = () => {
            lastActivity = Date.now();
            if (activity.isAppIdle) {
                activity.isAppIdle = false;
                createjs.Ticker.framerate = ACTIVE_FPS;
                // Force immediate redraw for responsiveness
                activity.stageDirty = true;
            }
        };

        // Track user activity using managed addEventListener for proper cleanup
        activity.addEventListener(window, "mousemove", activity._resetIdleTimer);
        activity.addEventListener(window, "mousedown", activity._resetIdleTimer);
        activity.addEventListener(window, "keydown", activity._resetIdleTimer);
        activity.addEventListener(window, "touchstart", activity._resetIdleTimer);
        activity.addEventListener(window, "wheel", activity._resetIdleTimer, { passive: true });

        // Periodic check for idle state - store interval ID for cleanup
        activity._idleWatcherInterval = setInterval(() => {
            // Check if music/code is playing
            const isMusicPlaying = activity.turtles?.running() || false;

            if (!isMusicPlaying && Date.now() - lastActivity > IDLE_THRESHOLD) {
                if (!activity.isAppIdle) {
                    activity.isAppIdle = true;
                    createjs.Ticker.framerate = IDLE_FPS;
                    debugLog("⚡ Idle mode: Throttling to 1 FPS to save battery");
                }
            } else if (activity.isAppIdle && isMusicPlaying) {
                // Music started playing - wake up immediately
                activity._resetIdleTimer();
            }
        }, 1000);
    };

    /**
     * Stop the idle watcher and clean up its listeners and interval.
     * Called during Activity lifecycle teardown to prevent listener/interval accumulation.
     * It is safe to call this method even if the idle watcher was never started.
     */
    activity._stopIdleWatcher = () => {
        // Clear the periodic interval
        if (typeof activity._idleWatcherInterval !== "undefined") {
            clearInterval(activity._idleWatcherInterval);
            activity._idleWatcherInterval = undefined;
        }

        // Remove event listeners if they were registered
        if (typeof activity._resetIdleTimer === "function") {
            activity.removeEventListener(window, "mousemove", activity._resetIdleTimer);
            activity.removeEventListener(window, "mousedown", activity._resetIdleTimer);
            activity.removeEventListener(window, "keydown", activity._resetIdleTimer);
            activity.removeEventListener(window, "touchstart", activity._resetIdleTimer);
            activity.removeEventListener(window, "wheel", activity._resetIdleTimer);
            activity._resetIdleTimer = undefined;
        }
    };

    /**
     * Set up auto-save interval for the active workspace.
     */
    activity._initAutoSave = () => {
        if (activity._autoSaveInterval !== null) {
            clearInterval(activity._autoSaveInterval);
        }
        activity._autoSaveInterval = setInterval(
            () => {
                try {
                    if (activity.logo && activity.logo._alreadyRunning) {
                        return;
                    }

                    if (activity.saveLocally !== null && activity.saveLocally !== undefined) {
                        activity.saveLocally();
                    }
                } catch (e) {
                    ErrorHandler.recoverable(e, { operation: "autoSave" });
                }
            },
            5 * 60 * 1000
        );
    };

    /**
     * Stop the auto-save interval.
     */
    activity._stopAutoSave = () => {
        if (activity._autoSaveInterval !== null) {
            clearInterval(activity._autoSaveInterval);
            activity._autoSaveInterval = null;
        }
    };
};

// Proper AMD module definition.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupActivityIdleWatcher = setupActivityIdleWatcher;
        return { setupActivityIdleWatcher };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupActivityIdleWatcher };
}
