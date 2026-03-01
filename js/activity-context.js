/*
 * ActivityContext
 *
 * Single authority for accessing the runtime Activity instance.
 *
 * NOTE: This repo uses RequireJS shims + globals for browser builds.
 * This module supports AMD (RequireJS), CommonJS (Jest), and a browser global
 * fallback (ActivityContext) without exporting the Activity instance onto
 * window.activity.
 */

(function (root, factory) {
    // Lazy singleton: factory runs once, under the loader's control when
    // possible (AMD), but always exposes a global for non-AMD consumers.
    let _mod;

    function getModule() {
        if (!_mod) _mod = factory();
        return _mod;
    }

    if (typeof define === "function" && define.amd) {
        define([], function () {
            return getModule();
        });
    } else if (typeof module !== "undefined" && module.exports) {
        module.exports = getModule();
    }

    // Ensure a global reference exists so non-AMD code (activity.js, synthutils.js)
    // can access it immediately.
    try {
        root.ActivityContext = getModule();
    } catch (e) {
        // ignore if root is not writable in some hostile environments
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    let _activity = null;
    let _readyResolve = null;
    let _readyPromise = null;

    function _createReadyPromise() {
        _readyPromise = new Promise(function (resolve) {
            _readyResolve = resolve;
        });
    }

    // Initialise the first promise eagerly.
    _createReadyPromise();

    /**
     * Store the Activity singleton.  Idempotent: calling with the *same*
     * instance twice is a no-op.  Calling with a *different* instance logs
     * a warning (potential bug) but still updates.
     */
    function setActivity(activityInstance) {
        if (!activityInstance) {
            throw new Error("Cannot set ActivityContext with a falsy value");
        }

        if (_activity === activityInstance) {
            return; // idempotent — same instance, nothing to do
        }

        if (_activity && _activity !== activityInstance) {
            console.warn(
                "ActivityContext.setActivity called with a DIFFERENT instance. " +
                    "This may indicate a bug — only one Activity should exist."
            );
        }

        _activity = activityInstance;

        // Resolve the ready-promise so async consumers unblock.
        if (_readyResolve) {
            _readyResolve(_activity);
        }
    }

    /**
     * Return the Activity instance or throw if not yet set.
     */
    function getActivity() {
        if (!_activity) {
            throw new Error(
                "Activity not initialized yet. Use dependency injection or wait for initialization."
            );
        }
        return _activity;
    }

    /**
     * Non-throwing check — useful in guards / conditional paths.
     * @returns {boolean}
     */
    function hasActivity() {
        return _activity !== null;
    }

    /**
     * Returns a promise that resolves with the Activity instance once
     * setActivity has been called.  If Activity is already set the
     * promise is resolved immediately.
     * @returns {Promise<object>}
     */
    function whenReady() {
        if (_activity) {
            return Promise.resolve(_activity);
        }
        return _readyPromise;
    }

    /**
     * Reset internal state — intended for Jest tests ONLY so each test
     * suite starts with a clean slate.
     */
    function _resetForTests() {
        _activity = null;
        _createReadyPromise();
    }

    return { setActivity, getActivity, hasActivity, whenReady, _resetForTests };
});
