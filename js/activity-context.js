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

    function setActivity(activityInstance) {
        if (!activityInstance) {
            throw new Error("Cannot set ActivityContext with a falsy value");
        }
        _activity = activityInstance;
    }

    function getActivity() {
        if (!_activity) {
            throw new Error(
                "Activity not initialized yet. Use dependency injection or wait for initialization."
            );
        }
        return _activity;
    }

    return { setActivity, getActivity };
});
