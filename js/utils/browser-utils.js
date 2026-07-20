/**
 * @license
 * MusicBlocks v3.4.1
 * Copyright (C) 2014-2026 Walter Bender
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
   globals

   jQuery
*/

/*
 * doBrowserCheck() uses the global jQuery instance initialized by the
 * application before RequireJS modules are bootstrapped. The global is
 * accessed only when the function is called, not during module loading.
 */

/* exported
   canvasPixelRatio, doBrowserCheck, fnBrowserDetect, windowHeight, windowWidth
*/

/**
 * Detects the current browser name.
 * @function
 * @returns {string} The name of the detected browser.
 */
function fnBrowserDetect() {
    const userAgent = navigator.userAgent;
    let browserName;

    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "firefox";
    } else if (userAgent.match(/safari/i)) {
        browserName = "safari";
    } else if (userAgent.match(/opr\//i)) {
        browserName = "opera";
    } else if (userAgent.match(/edg/i)) {
        browserName = "edge";
    } else {
        browserName = "No browser detection";
    }
    return browserName;
}

/**
 * Checks the browser type and version.
 * Sets properties in the jQuery.browser object based on the user agent.
 * @function
 */
function doBrowserCheck() {
    jQuery.uaMatch = ua => {
        ua = ua.toLowerCase();

        const match =
            /(chrome)[ /]([\w.]+)/.exec(ua) ||
            /(webkit)[ /]([\w.]+)/.exec(ua) ||
            /(opera)(?:.*version|)[ /]([\w.]+)/.exec(ua) ||
            /(msie) ([\w.]+)/.exec(ua) ||
            (ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)) ||
            [];

        return {
            browser: match[1] || "",
            version: match[2] || "0"
        };
    };

    const matched = jQuery.uaMatch(navigator.userAgent);
    const browser = {};

    if (matched.browser) {
        browser[matched.browser] = true;
        browser.version = matched.version;
    }

    if (browser.chrome) {
        browser.webkit = true;
    } else if (browser.webkit) {
        browser.safari = true;
    }

    jQuery.browser = browser;
}

/**
 * Returns the pixel ratio of the canvas for high-resolution displays.
 * @function
 * @returns {number} The canvas pixel ratio.
 */
function canvasPixelRatio() {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const context = document.querySelector("#myCanvas").getContext("2d");
    const backingStoreRatio =
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio ||
        1;
    return devicePixelRatio / backingStoreRatio;
}

/**
 * Returns the height of the window, accounting for Android-specific behavior.
 * @function
 * @returns {number} The window height.
 */
function windowHeight() {
    const onAndroid = /Android/i.test(navigator.userAgent);
    if (onAndroid) {
        return window.outerHeight;
    } else {
        return window.innerHeight;
    }
}

/**
 * Returns the width of the window, accounting for Android-specific behavior.
 * @function
 * @returns {number} The window width.
 */
function windowWidth() {
    const onAndroid = /Android/i.test(navigator.userAgent);
    if (onAndroid) {
        return window.outerWidth;
    } else {
        return window.innerWidth;
    }
}

var BrowserUtils = {
    fnBrowserDetect,
    doBrowserCheck,
    canvasPixelRatio,
    windowHeight,
    windowWidth
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = BrowserUtils;
}

if (typeof window !== "undefined") {
    // BrowserUtils is what the RequireJS shim reads via `exports`. The
    // individual globals are required for compatibility: the callers are
    // classic scripts that invoke these by bare name (fnBrowserDetect() in
    // js/toolbar-ui.js, doBrowserCheck() in js/activity.js) rather than
    // receiving an injected module, so removing them would break the app.
    // This matches how utils-logic.js and dom-helpers.js publish their own.
    window.BrowserUtils = BrowserUtils;
    Object.assign(window, BrowserUtils);
}
