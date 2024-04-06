/**
 * Environment module providing methods to interact with the execution environment.
 * @module Environment
 */
define(function () {

    'use strict';

    /**
     * @namespace env
     */
    var env = {};

    /**
     * Retrieves the environment details asynchronously.
     * @param {function} callback - Callback function to be called with environment details.
     */
    env.getEnvironment = function (callback) {
        // FIXME: we assume this code runs on the same thread as the
        // javascript executed from sugar-toolkit-gtk3 (python)

        if (env.isSugarizer()) {
            var getUrlParameter = function(name) {
                var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
                return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
            };
            window.top.sugar = {};
            window.top.sugar.environment = {
				activityId: getUrlParameter("aid"),
				activityName: getUrlParameter("n"),
				bundleId: getUrlParameter("a"),
				objectId: getUrlParameter("o"),
				sharedId: getUrlParameter("s")
			};
            setTimeout(function () {			
				callback(null, window.top.sugar.environment);
			}, 0);
        } else if (env.isStandalone()) {
            setTimeout(function () {
                callback(null, {});
            }, 0);
        } else {
            var environmentCallback = function () {
                callback(null, window.top.sugar.environment);
            };

            if (window.top.sugar) {
                setTimeout(function () {
                    environmentCallback();
                }, 0);
            } else {
                window.top.sugar = {};
                window.top.sugar.onEnvironmentSet = function () {
                    environmentCallback();
                };
            }
        }
    };

    /**
     * Retrieves the object ID asynchronously.
     * @param {function} callback - Callback function to be called with the object ID.
     */
    env.getObjectId = function (callback) {
        env.getEnvironment(function (error, environment) {
            callback(environment.objectId);
        });
    };

    /**
     * Retrieves the URL scheme.
     * @returns {string} - The URL scheme.
     */
    env.getURLScheme = function () {
        return window.location.protocol;
    };

    /**
     * Retrieves the host name.
     * @returns {string} - The host name.
     */
    env.getHost = function() {
        return window.location.hostname;
    };

    /**
     * Checks if the application is running in standalone mode.
     * @returns {boolean} - True if running in standalone mode, otherwise false.
     */
    env.isStandalone = function () {
        var webActivityHost = "0.0.0.0";
        var currentHost = env.getHost();

        return currentHost !== webActivityHost;
    };
    
    /**
     * Checks if the application is running in Sugarizer environment.
     * @returns {boolean} - True if running in Sugarizer environment, otherwise false.
     */
    env.isSugarizer = function() {
		// HACK: If in Chrome App automatic deduction that in Sugarizer
		if (typeof chrome != 'undefined' && chrome.app && chrome.app.runtime) {
			return true;
        } else if (typeof(Storage)!=="undefined" && typeof(window.localStorage)!=="undefined") {
            try {
                return (window.localStorage.getItem('sugar_settings') !== null);
            } catch(err) {
                return false;
            }
        }
        return false;
    };

    return env;
});
