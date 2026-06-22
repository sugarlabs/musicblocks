// Copyright (c) 2014-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   globals

   PALETTEICONS, PALETTEFILLCOLORS, PALETTESTROKECOLORS,
   PALETTEHIGHLIGHTCOLORS, HIGHLIGHTSTROKECOLORS, MULTIPALETTES,
   platformColor, base64Encode, i18next, createjs
*/

/*
    Global locations
    - js/artwork.js
        PALETTEICONS, PALETTEFILLCOLORS, PALETTESTROKECOLORS, PALETTEHIGHLIGHTCOLORS,
        HIGHLIGHTSTROKECOLORS
    - js/turtledefs.js
        MULTIPALETTES
    - js/utils/platformstyle.js
        platformColor
    - js/utils/utils-logic.js
        resolveObject
*/

if (typeof module !== "undefined" && module.exports) {
    var UtilsLogic =
        (typeof window !== "undefined" && window.UtilsLogic) ||
        (typeof require !== "undefined" ? require("./utils-logic") : {});
    var { resolveObject } = UtilsLogic;
}

/* exported
   canvasPixelRatio, changeImage, closeBlkWidgets, closeWidgets,
   delayExecution, displayMsg, doBrowserCheck, docByClass, docByName,
   docBySelector, docByTagName, doPublish, doStopVideoCam, doSVG,
   doUseCamera, format, getTextWidth, hideDOMLabel, httpGet, httpPost, HttpRequest,
   importMembers, isSVGEmpty, prepareMacroExports, preparePluginExports,
   processMacroData, processRawPluginData, windowHeight, windowWidth,
   fnBrowserDetect, waitForReadiness
*/

/**
 * Changes the source of an image element from one SVG data URI to another.
 * @function
 * @param {HTMLImageElement} imgElement - The image element to update.
 * @param {string} from - The base64-encoded SVG data URI to replace.
 * @param {string} to - The new base64-encoded SVG data URI.
 */
const changeImage = (imgElement, from, to) => {
    if (!to) return;

    const newSrc = "data:image/svg+xml;base64," + window.btoa(base64Encode(to));

    if (imgElement.src !== newSrc) {
        imgElement.src = newSrc;
    }
};

// Pure logic functions (safeJSONParse, last, deepClone, fileExt, fileBasename,
// toTitleCase, escapeHTML, unescapeHTML, isSafeUrl, safeSVG, toFixed2,
// rationalToFraction, GCD, LCD, mixedNumber, rationalSum, nearestBeat,
// oneHundredToFraction, rgbToHex, hexToRGB, hex2rgb, resolveObject)
// have been moved to js/utils/utils-logic.js.
// They are loaded as a RequireJS dependency and assigned to window globals.

/**
 * Enhanced _() method to handle case variations for translations
 * prioritize exact matches and preserve the case of the input text.
 * @function
 * @param {string} text - The input text to be translated.
 * @returns {string} The translated text.
 */

function _(text, options = {}) {
    if (!text) return "";

    try {
        const removeChars = [
            ",",
            "(",
            ")",
            "?",
            "¿",
            "<",
            ">",
            ".",
            "\n",
            '"',
            ":",
            "%s",
            "%d",
            "/",
            "'",
            ";",
            "×",
            "!",
            "¡"
        ];
        let cleanedText = text;
        for (let char of removeChars) cleanedText = cleanedText.split(char).join("");

        let translated = "";
        const lang = i18next.language;

        if (lang.startsWith("ja")) {
            const kanaPref = localStorage.getItem("kanaPreference") || "kanji";
            const script = kanaPref === "kana" ? "kana" : "kanji";

            const resolveObj = key => {
                let obj = i18next.t(key, { ...options, ns: undefined, returnObjects: true });

                if (obj && typeof obj === "object") {
                    return obj[script] || key;
                }

                if (typeof obj === "string") {
                    return obj;
                }

                return key;
            };

            translated = resolveObj(text);
        } else {
            translated = i18next.t(text, options);
        }

        return translated || text;
    } catch (e) {
        return text;
    }
}

/**
 * A string formatting function using placeholder substitution.
 * @function
 * @param {string} str - The template string with placeholders.
 * @param {Object} data - The data object containing values for substitution.
 * @returns {string} The formatted string.
 */
let format = (str, data) => {
    str = str.replace(/{([a-zA-Z0-9.]*)}/g, (match, name) => {
        let x = data;
        name.split(".").forEach(v => {
            if (x === undefined) {
                console.debug("Undefined value in template string", str, name, x, v);
            }

            x = x[v];
        });

        return x === undefined ? "" : x;
    });

    return str.replace(/{_([a-zA-Z0-9]+)}/g, (match, item) => {
        return _(item);
    });
};

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

/**
 * Performs an HTTP GET request to retrieve data from the server.
 * Uses async fetch to avoid blocking the UI during network requests.
 * @param {string|null} projectName - The name of the project (or null for the base URL).
 * @throws {Error} Throws an error if the HTTP status code is greater than 299.
 * @returns {Promise<string>} A promise that resolves to the response text from the server.
 */
let httpGet = async projectName => {
    const url = projectName === null ? window.server : window.server + projectName;
    const response = await fetch(url, {
        method: "GET",
        headers: {
            "x-api-key": window.MB_PROJECT_API_KEY || ""
        }
    });

    if (!response.ok) {
        throw new Error("Error from server");
    }

    return response.text();
};

/**
 * Performs an HTTP POST request to send data to the server.
 * Uses async fetch to avoid blocking the UI during network requests.
 * @param {string} projectName - The name of the project.
 * @param {string} data - The data to be sent in the POST request.
 * @returns {Promise<string>} A promise that resolves to the response text from the server.
 */
let httpPost = async (projectName, data) => {
    const response = await fetch(window.server + projectName, {
        method: "POST",
        headers: {
            "x-api-key": window.MB_PROJECT_API_KEY || ""
        },
        body: data
    });

    if (!response.ok) {
        throw new Error("Error from server");
    }

    return response.text();
};

/**
 * Constructor function for making an HTTP request.
 * @constructor
 * @param {string} url - The URL to make the HTTP request to.
 * @param {function} loadCallback - The callback function to handle the loaded response.
 * @param {function} [userCallback] - An optional user-defined callback function.
 */
function HttpRequest(url, loadCallback, userCallback) {
    const req = (this.request = new XMLHttpRequest());
    this.handler = loadCallback;
    this.url = url;
    this.localmode = Boolean(self.location.href.search(/^file:/i) === 0);
    this.userCallback = userCallback;

    try {
        req.open("GET", url);

        req.onload = () => {
            if ((req.status >= 200 && req.status < 300) || this.localmode) {
                if (typeof this.handler === "function") this.handler();
                if (typeof this.userCallback === "function") {
                    this.userCallback(true, req.responseText);
                }
            } else {
                if (typeof this.handler === "function") this.handler();
                if (typeof this.userCallback === "function") {
                    this.userCallback(false, `Error: ${req.status}`);
                }
            }
        };

        req.onerror = () => {
            if (typeof this.handler === "function") this.handler();
            if (typeof this.userCallback === "function") {
                this.userCallback(false, "network error");
            }
        };

        req.onabort = req.onerror;
        req.ontimeout = req.onerror;

        req.send("");
    } catch (e) {
        if (self.console) {
            console.debug("Failed to load resource from " + url + ": Network error.", e);
        }

        if (typeof this.userCallback === "function") {
            this.userCallback(false, "network error");
        }

        this.request = this.handler = this.userCallback = null;
    }
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
 * Wait for critical dependencies to be ready before calling callback.
 * Uses polling with exponential backoff and maximum timeout.
 * This replaces the arbitrary 5-second delay for Firefox with actual readiness checks.
 *
 * @param {Function} callback - The function to call when ready
 * @param {Object} options - Configuration options
 * @param {number} options.maxWait - Maximum wait time in ms (default: 10000)
 * @param {number} options.minWait - Minimum wait time in ms (default: 500)
 * @param {number} options.checkInterval - Initial check interval in ms (default: 100)
 */
function waitForReadiness(callback, options = {}) {
    const { maxWait = 10000, minWait = 500, checkInterval = 100 } = options;
    const startTime = Date.now();

    /**
     * Check if critical dependencies and DOM elements are ready
     * @returns {boolean} True if all critical dependencies are loaded
     */
    const isReady = () => {
        // Check if critical JavaScript libraries are loaded
        const createjsLoaded = typeof createjs !== "undefined" && createjs.Stage;
        const howlerLoaded = typeof Howler !== "undefined";
        const jqueryLoaded = typeof jQuery !== "undefined";

        // Check if critical DOM elements exist
        const canvas = document.getElementById("myCanvas");
        const loader = document.getElementById("loader");
        const toolbars = document.getElementById("toolbars");
        const domReady = canvas && loader && toolbars;

        return createjsLoaded && howlerLoaded && jqueryLoaded && domReady;
    };

    /**
     * Polling function that checks readiness and calls callback when ready
     */
    const check = () => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= minWait && isReady()) {
            // Ready! Initialize the app

            console.log(`[Firefox] Initialized in ${elapsed}ms (readiness-based)`);
            callback();
        } else if (elapsed >= maxWait) {
            // Timeout - initialize anyway as fallback

            console.warn(
                `[Firefox] Initialization timed out after ${maxWait}ms, proceeding anyway`
            );
            callback();
        } else {
            // Not ready yet, check again on next animation frame
            requestAnimationFrame(check);
        }
    };

    // Start the readiness check loop
    requestAnimationFrame(check);
}

// Check for Internet Explorer

window.addEventListener("load", () => {
    const userAgent = window.navigator.userAgent;
    // For IE 10 or older
    const MSIE = userAgent.indexOf("MSIE ");
    let DetectVersionOfIE;
    if (MSIE > 0) {
        DetectVersionOfIE = parseInt(
            userAgent.substring(MSIE + 5, userAgent.indexOf(".", MSIE)),
            10
        );
    }

    // For IE 11
    const IETrident = userAgent.indexOf("Trident/");
    if (IETrident > 0) {
        const IERv = userAgent.indexOf("rv:");
        DetectVersionOfIE = parseInt(
            userAgent.substring(IERv + 3, userAgent.indexOf(".", IERv)),
            10
        );
    }

    // For IE 12
    const IEEDGE = userAgent.indexOf("Edge/");
    if (IEEDGE > 0) {
        DetectVersionOfIE = parseInt(
            userAgent.substring(IEEDGE + 5, userAgent.indexOf(".", IEEDGE)),
            10
        );
    }

    if (typeof DetectVersionOfIE !== "undefined") {
        document.body.innerHTML =
            "<div style='margin: 200px;'>" +
            "<h1 style='font-size: 100px; font-family: Arial; text-align: center; color: #F00;'>Music Blocks</h1>" +
            "<h3 style='font-size: 40px; font-family: Arial; text-align: center;'>Music Blocks will not work in Internet Explorer, you can use:</h3>" +
            "<div style='width: 550px; margin: 0 auto;'><a href='https://www.chromium.org/getting-involved/download-chromium' style='float: left; display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Chromium</a>" +
            "<a href='https://www.google.com/chrome/' style='float: left; margin-left: 40px;display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Chrome</a>" +
            "<a href='https://support.apple.com/downloads/safari' style='float: left; margin-left: 40px;display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Safari</a>" +
            "<a href='https://www.mozilla.org/en-US/firefox/new/' style='float: left; margin-left: 40px;display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Firefox</a>" +
            "</div></div>";
    }
});

/**
 * Retrieves a collection of elements by class name.
 * @param {string} classname - The class name to search for.
 * @returns {HTMLCollectionOf<Element>} A collection of elements with the specified class name.
 */
function docByClass(classname) {
    return document.getElementsByClassName(classname);
}

/**
 * Retrieves a collection of elements by tag name.
 * @param {string} tag - The tag name to search for.
 * @returns {NodeList} A collection of elements with the specified tag name.
 */
function docByTagName(tag) {
    return document.getElementsByTagName(tag);
}

/**
 * Retrieves an element by its ID.
 * @param {string} id - The ID of the element to retrieve.
 * @returns {HTMLElement|null} The element with the specified ID, or null if not found.
 */
function docById(id) {
    return document.getElementById(id);
}

/**
 * Retrieves a collection of elements by name.
 * @param {string} name - The name attribute value to search for.
 * @returns {NodeListOf<Element>} A collection of elements with the specified name attribute.
 */
function docByName(name) {
    return document.getElementsByName(name);
}

/**
 * Retrieves the first element that matches a specified CSS selector.
 * @param {string} selector - A CSS selector string.
 * @returns {Element|null} The first element that matches the selector, or null if not found.
 */
function docBySelector(selector) {
    return document.querySelector(selector);
}

// last() and deepClone() moved to js/utils/utils-logic.js

/**
 * Gets the width of a text string given a specific font.
 * @param {string} text - The text string.
 * @param {string} font - The font style and size.
 * @returns {number} The width of the text in pixels.
 */
let getTextWidth = (text, font) => {
    // re-use canvas object for better performance
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
};

/**
 * Generates an SVG string representing the canvas, logo, and turtles.
 * @param {object} canvas - The canvas object.
 * @param {object} logo - The logo object.
 * @param {object} turtles - The turtles object.
 * @param {number} width - The width of the SVG.
 * @param {number} height - The height of the SVG.
 * @param {number} scale - The scaling factor.
 * @returns {string} The SVG string.
 */
function doSVG(canvas, logo, turtles, width, height, scale) {
    // Aggregate SVG output from each turtle. If there is none, return an empty string.

    let turtleSVG = "";
    for (const turtle in turtles.turtleList) {
        turtles.getTurtle(turtle).painter.closeSVG();
        turtleSVG += turtles.getTurtle(turtle).painter.svgOutput;
    }

    let svg =
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="' +
        width +
        '" height="' +
        height +
        '">\n';
    svg += '<g transform="scale(' + scale + "," + scale + ')">\n';
    svg += logo.svgOutput;

    if (turtleSVG === "") {
        return "";
    } else {
        svg += turtleSVG;
    }

    svg += "</g>";
    svg += "</svg>";
    return svg;
}

/**
 * Checks if the SVG output from turtles is empty.
 * @param {object} turtles - The turtles object.
 * @returns {boolean} True if all turtle SVG outputs are empty, false otherwise.
 */
let isSVGEmpty = turtles => {
    for (const turtle in turtles.turtleList) {
        turtles.getTurtle(turtle).painter.closeSVG();
        if (turtles.getTurtle(turtle).painter.svgOutput !== "") {
            return false;
        }
    }
    return true;
};

// fileExt(), fileBasename(), toTitleCase(), escapeHTML(), unescapeHTML(),
// isSafeUrl() moved to js/utils/utils-logic.js
/**
 * Extracts Music Blocks project JSON string from an HTML file's
 * <div class="code"> element.
 *
 * Returns null if the expected structure is not found or if the
 * captured group is empty.
 *
 * @param {string} cleanData - HTML file content (newlines already cleaned).
 * @returns {string|null} Extracted project JSON string, or null.
 */
function extractProjectDataFromHTML(cleanData) {
    let matchResult;

    if (cleanData.includes('id="codeBlock"')) {
        matchResult = cleanData.match('<div class="code" id="codeBlock">([\\s\\S]*?)</div>');
    } else {
        matchResult = cleanData.match('<div class="code">([\\s\\S]*?)</div>');
    }

    // matchResult[1] checked for truthiness (not just null)
    // to also catch empty project-data divs.
    if (!matchResult || !matchResult[1]) {
        return null;
    }

    return matchResult[1];
}

/**
 * Processes plugin data and updates the activity based on the provided JSON-encoded dictionary.
 * @param {object} activity - The activity object to update.
 * @param {string} pluginData - The JSON-encoded plugin data.
 * @returns {object|null} The processed plugin data object or null if parsing fails.
 */
const processPluginData = async (activity, pluginData, pluginSource) => {
    // Plugins are JSON-encoded dictionaries.
    if (pluginData === undefined) {
        return null;
    }

    const isVettedPlugin = source => {
        if (!source) return false;
        // Plugins from the local plugins folder are considered vetted (provenance)
        if (source.startsWith("plugins/") || source.startsWith("./plugins/")) {
            return true;
        }
        // Known plugins from local storage are also trusted as they were approved previously
        if (source === "localStorage:plugins") {
            return true;
        }
        return false;
    };

    // Use the vetted check to determine initial trust
    let userConfirmed = isVettedPlugin(pluginSource);

    if (!userConfirmed) {
        userConfirmed = confirm(
            _("Security Warning") +
                "\n\n" +
                _(
                    "This plugin contains code that will be executed in your browser. It has not been loaded from the built-in plugins directory and may contain unsafe code."
                ) +
                "\n\n" +
                _("Do you want to allow this plugin to run?") +
                "\n\n" +
                _("Source: %s").replace(/%s/g, pluginSource || _("unknown"))
        );

        if (!userConfirmed) {
            console.warn("User declined unvetted plugin execution:", pluginSource);
            return null;
        }
    }

    // We accumulate scripts that need to be executed in a Blob URL to avoid unsafe-eval.
    let blobScriptContent = "";
    const pendingSafeEvals = [];

    const safeEval = (code, label = "plugin") => {
        if (typeof code !== "string" || !userConfirmed) return;

        // Basic sanity limit
        if (code.length > 500000) {
            console.warn("Plugin code too large:", label);
            return;
        }

        // We wrap the code in a closure that provides activity and globalActivity.
        // We'll execute these after the Blob script is loaded and populates the registry.
        pendingSafeEvals.push({ code, label });
    };

    let obj;
    try {
        obj = JSON.parse(pluginData);
    } catch (error) {
        console.error(
            `PluginProcessor: Failed to parse plugin data from source "${pluginSource}":`,
            error
        );
        console.debug("Malformed plugin data:", pluginData);
        return null;
    }
    // Create a palette entry.
    let newPalette = false,
        paletteName = null;
    if ("PALETTEPLUGINS" in obj) {
        for (const name in obj["PALETTEPLUGINS"]) {
            paletteName = name;
            PALETTEICONS[name] = obj["PALETTEPLUGINS"][name];
            let fillColor = "#ff0066";
            if ("PALETTEFILLCOLORS" in obj) {
                if (name in obj["PALETTEFILLCOLORS"]) {
                    fillColor = obj["PALETTEFILLCOLORS"][name];
                }
            }

            PALETTEFILLCOLORS[name] = fillColor;

            let strokeColor = "#ef003e";
            if ("PALETTESTROKECOLORS" in obj) {
                if (name in obj["PALETTESTROKECOLORS"]) {
                    strokeColor = obj["PALETTESTROKECOLORS"][name];
                }
            }

            PALETTESTROKECOLORS[name] = strokeColor;

            let highlightColor = "#ffb1b3";
            if ("PALETTEHIGHLIGHTCOLORS" in obj) {
                if (name in obj["PALETTEHIGHLIGHTCOLORS"]) {
                    highlightColor = obj["PALETTEHIGHLIGHTCOLORS"][name];
                }
            }

            PALETTEHIGHLIGHTCOLORS[name] = highlightColor;

            let strokeHighlightColor = "#404040";
            if ("HIGHLIGHTSTROKECOLORS" in obj) {
                if (name in obj["HIGHLIGHTSTROKECOLORS"]) {
                    strokeHighlightColor = obj["HIGHLIGHTSTROKECOLORS"][name];
                }
            }

            HIGHLIGHTSTROKECOLORS[name] = strokeHighlightColor;

            platformColor.paletteColors[name] = [
                fillColor,
                strokeColor,
                highlightColor,
                strokeHighlightColor
            ];

            if (name in activity.palettes.buttons) {
                console.debug("palette " + name + " already exists");
            } else {
                console.debug("adding palette " + name);
                activity.palettes.add(name);
                if (!MULTIPALETTES[2].includes(name)) MULTIPALETTES[2].push(name);
                newPalette = true;
            }
        }
    }

    if (newPalette) {
        try {
            // console.debug("Calling makePalettes");
            activity.palettes.makePalettes(1);
        } catch (e) {
            console.debug("makePalettes: " + e);
        }
    }

    // Define the image blocks
    if ("IMAGES" in obj) {
        for (const blkName in obj["IMAGES"]) {
            activity.pluginsImages[blkName] = obj["IMAGES"][blkName];
        }
    }

    // Populate the flow-block dictionary, i.e., the code that is
    // compiled into a function for hot-path execution.
    if ("FLOWPLUGINS" in obj) {
        for (const flow in obj["FLOWPLUGINS"]) {
            // Pre-compile trusted plugins for performance.
            // UNTRUSTED plugins (if any made it past confirmation) are stored as strings
            // and handled via whitelist in safePluginExecute.
            if (isVettedPlugin(pluginSource)) {
                const flowCode = obj["FLOWPLUGINS"][flow];
                const registryName = `flow_${flow}_${Math.random().toString(36).substr(2, 9)}`;
                blobScriptContent += `
window.__mb_plugin_registry["${registryName}"] = function(logo, turtle, blk, receivedArg, actionArgs, args, isflow) {
    ${flowCode}
};
`;
                activity.logo.evalFlowDict[flow] = registryName; // Will be replaced by function after load
            } else {
                activity.logo.evalFlowDict[flow] = obj["FLOWPLUGINS"][flow];
            }
        }
    }

    // Populate the arg-block dictionary
    if ("ARGPLUGINS" in obj) {
        for (const arg in obj["ARGPLUGINS"]) {
            if (isVettedPlugin(pluginSource)) {
                const argCode = obj["ARGPLUGINS"][arg];
                const registryName = `arg_${arg}_${Math.random().toString(36).substr(2, 9)}`;
                blobScriptContent += `
window.__mb_plugin_registry["${registryName}"] = function(logo, turtle, blk, parentBlk, receivedArg, tur) {
    ${argCode}
};
`;
                activity.logo.evalArgDict[arg] = registryName;
            } else {
                activity.logo.evalArgDict[arg] = obj["ARGPLUGINS"][arg];
            }
        }
    }

    // Populate the macro dictionary, i.e., the code that is
    // eval'd by this block.
    if ("MACROPLUGINS" in obj) {
        for (const macro in obj["MACROPLUGINS"]) {
            try {
                activity.palettes.pluginMacros[macro] = JSON.parse(obj["MACROPLUGINS"][macro]);
            } catch (e) {
                console.debug("could not parse macro " + macro);

                console.debug(e);
            }
        }
    }

    // Populate the setter dictionary
    if ("SETTERPLUGINS" in obj) {
        for (const setter in obj["SETTERPLUGINS"]) {
            if (isVettedPlugin(pluginSource)) {
                const setterCode = obj["SETTERPLUGINS"][setter];
                const registryName = `setter_${setter}_${Math.random().toString(36).substr(2, 9)}`;
                blobScriptContent += `
window.__mb_plugin_registry["${registryName}"] = function(logo, blk, value, turtle) {
    ${setterCode}
};
`;
                activity.logo.evalSetterDict[setter] = registryName;
            } else {
                activity.logo.evalSetterDict[setter] = obj["SETTERPLUGINS"][setter];
            }
        }
    }

    // Create the plugin protoblocks.
    // FIXME: On Chrome, plugins are broken (They still work on Firefox):
    // EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: "script-src 'self' blob: filesystem: chrome-extension-resource:".
    // Maybe:
    // let g = (function() { return this ? this : typeof self !== 'undefined' ? self : undefined})() || Function("return this")();

    if ("BLOCKPLUGINS" in obj) {
        for (const block in obj["BLOCKPLUGINS"]) {
            console.debug("adding plugin block " + block);
            safeEval(obj["BLOCKPLUGINS"][block], "BLOCKPLUGINS:" + block);
        }
    }

    // Create the globals.
    if ("GLOBALS" in obj) {
        safeEval(obj["GLOBALS"], "GLOBALS");
    }

    if ("PARAMETERPLUGINS" in obj) {
        for (const parameter in obj["PARAMETERPLUGINS"]) {
            if (isVettedPlugin(pluginSource)) {
                const paramCode = obj["PARAMETERPLUGINS"][parameter];
                const registryName = `param_${parameter}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;
                blobScriptContent += `
window.__mb_plugin_registry["${registryName}"] = function(logo, turtle, blk) {
    ${paramCode}
};
`;
                activity.logo.evalParameterDict[parameter] = registryName;
            } else {
                activity.logo.evalParameterDict[parameter] = obj["PARAMETERPLUGINS"][parameter];
            }
        }
    }

    // Code to execute when plugin is loaded
    if ("ONLOAD" in obj) {
        for (const arg in obj["ONLOAD"]) {
            safeEval(obj["ONLOAD"][arg], "ONLOAD:" + arg);
        }
    }

    // Code to execute when turtle code is started
    if ("ONSTART" in obj) {
        for (const arg in obj["ONSTART"]) {
            if (isVettedPlugin(pluginSource)) {
                const onStartCode = obj["ONSTART"][arg];
                const registryName = `onstart_${arg}_${Math.random().toString(36).substr(2, 9)}`;
                blobScriptContent += `
window.__mb_plugin_registry["${registryName}"] = function(logo) {
    ${onStartCode}
};
`;
                activity.logo.evalOnStartList[arg] = registryName;
            } else {
                activity.logo.evalOnStartList[arg] = obj["ONSTART"][arg];
            }
        }
    }

    // Code to execute when turtle code is stopped
    if ("ONSTOP" in obj) {
        for (const arg in obj["ONSTOP"]) {
            if (isVettedPlugin(pluginSource)) {
                const onStopCode = obj["ONSTOP"][arg];
                const registryName = `onstop_${arg}_${Math.random().toString(36).substr(2, 9)}`;
                blobScriptContent += `
window.__mb_plugin_registry["${registryName}"] = function(logo) {
    ${onStopCode}
};
`;
                activity.logo.evalOnStopList[arg] = registryName;
            } else {
                activity.logo.evalOnStopList[arg] = obj["ONSTOP"][arg];
            }
        }
    }

    // Now execute the Blob script injection if we have collected any trusted code
    if (blobScriptContent) {
        window.__mb_plugin_registry = window.__mb_plugin_registry || {};
        const fullScript = `
(function() {
    window.__mb_plugin_registry = window.__mb_plugin_registry || {};
    ${blobScriptContent}
})();
`;
        const blob = new Blob([fullScript], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        const script = document.createElement("script");
        script.src = url;

        await new Promise((resolve, reject) => {
            script.onload = () => {
                URL.revokeObjectURL(url);
                document.head.removeChild(script);
                resolve();
            };
            script.onerror = e => {
                URL.revokeObjectURL(url);
                document.head.removeChild(script);
                console.error("Failed to load CSP Blob script for plugins", e);
                reject(e);
            };
            document.head.appendChild(script);
        });

        // Map Registry back to dictionaries
        const mapDict = dict => {
            for (const key in dict) {
                if (typeof dict[key] === "string" && dict[key].indexOf("_") !== -1) {
                    const registryName = dict[key];
                    if (window.__mb_plugin_registry[registryName]) {
                        dict[key] = window.__mb_plugin_registry[registryName];
                        delete window.__mb_plugin_registry[registryName];
                    }
                }
            }
        };

        mapDict(activity.logo.evalFlowDict);
        mapDict(activity.logo.evalArgDict);
        mapDict(activity.logo.evalSetterDict);
        mapDict(activity.logo.evalParameterDict);
        mapDict(activity.logo.evalOnStartList);
        mapDict(activity.logo.evalOnStopList);
    }

    // Finally, execute safeEvals by creating new Blob scripts for each setup logic block.
    // This is because even setup logic can be blocked by CSP if it contains unsafe-eval.
    for (const item of pendingSafeEvals) {
        const registryName = `setup_${item.label.replace(/[^a-zA-Z0-9]/g, "_")}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        const setupScript = `
window.__mb_plugin_registry["${registryName}"] = function(activity, globalActivity) {
    ${item.code}
};
`;
        const sBlob = new Blob([setupScript], { type: "application/javascript" });
        const sUrl = URL.createObjectURL(sBlob);
        const sScript = document.createElement("script");
        sScript.src = sUrl;
        await new Promise(resolve => {
            sScript.onload = () => {
                if (window.__mb_plugin_registry[registryName]) {
                    try {
                        window.__mb_plugin_registry[registryName](activity, activity);
                    } catch (e) {
                        console.error("Plugin setup failed:", item.label, e);
                    }
                    delete window.__mb_plugin_registry[registryName];
                }
                URL.revokeObjectURL(sUrl);
                document.head.removeChild(sScript);
                resolve();
            };
            sScript.onerror = () => {
                URL.revokeObjectURL(sUrl);
                document.head.removeChild(sScript);
                resolve(); // Still resolve to let others run
            };
            document.head.appendChild(sScript);
        });
    }

    for (const protoblock in activity.blocks.protoBlockDict) {
        try {
            // Push the protoblocks onto their palettes.
            if (activity.blocks.protoBlockDict[protoblock].palette === undefined) {
                console.debug("Cannot find palette for protoblock " + protoblock);
            } else if (activity.blocks.protoBlockDict[protoblock].palette === null) {
                console.debug("Cannot find palette for protoblock " + protoblock);
            } else {
                activity.blocks.protoBlockDict[protoblock].palette.add(
                    activity.blocks.protoBlockDict[protoblock]
                );
            }
        } catch (e) {
            console.debug(e);
        }
    }

    if (paletteName !== null) {
        // console.debug("updating palette " + paletteName);
        activity.palettes.updatePalettes(paletteName);
    }

    setTimeout(() => {
        activity.palettes.show();
    }, 2000);

    // Return the object in case we need to save it to local storage.
    return obj;
};

/**
 * Processes raw plugin data, removes blank lines and comments, and then calls `processPluginData` to update the activity.
 * @async
 * @param {object} activity - The activity object to update.
 * @param {string} rawData - Raw plugin data to process.
 * @returns {Promise<object|null>} The processed plugin data object or null if parsing fails.
 */
const processRawPluginData = async (activity, rawData, pluginSource) => {
    const lineData = rawData.split("\n");
    let cleanData = "";

    // We need to remove blank lines and comments and then
    // join the data back together for processing as JSON.
    for (let i = 0; i < lineData.length; i++) {
        if (lineData[i].length === 0) {
            continue;
        }

        if (lineData[i][0] === "/") {
            continue;
        }

        cleanData += lineData[i];
    }

    // Note to plugin developers: You may want to comment out this
    // try/catch while debugging your plugin.
    let obj;
    try {
        obj = await processPluginData(activity, cleanData.replace(/\n/g, ""), pluginSource);
    } catch (e) {
        obj = null;

        console.log(rawData);

        console.log(cleanData);
        activity.errorMsg("Error loading plugin: " + e);
    }

    return obj;
};

/**
 * Updates the plugin objects with data from the processed plugin data object.
 * @param {object} activity - The activity object to update.
 * @param {object} obj - The processed plugin data object.
 */
const updatePluginObj = (activity, obj) => {
    if (obj === null) {
        return;
    }

    for (const name in obj["PALETTEPLUGINS"]) {
        activity.pluginObjs["PALETTEPLUGINS"][name] = obj["PALETTEPLUGINS"][name];
    }

    for (const name in obj["PALETTEFILLCOLORS"]) {
        activity.pluginObjs["PALETTEFILLCOLORS"][name] = obj["PALETTEFILLCOLORS"][name];
    }

    for (const name in obj["PALETTESTROKECOLORS"]) {
        activity.pluginObjs["PALETTESTROKECOLORS"][name] = obj["PALETTESTROKECOLORS"][name];
    }

    for (const name in obj["PALETTEHIGHLIGHTCOLORS"]) {
        activity.pluginObjs["PALETTEHIGHLIGHTCOLORS"][name] = obj["PALETTEHIGHLIGHTCOLORS"][name];
    }

    for (const flow in obj["FLOWPLUGINS"]) {
        activity.pluginObjs["FLOWPLUGINS"][flow] = obj["FLOWPLUGINS"][flow];
    }

    for (const arg in obj["ARGPLUGINS"]) {
        activity.pluginObjs["ARGPLUGINS"][arg] = obj["ARGPLUGINS"][arg];
    }

    for (const block in obj["BLOCKPLUGINS"]) {
        activity.pluginObjs["BLOCKPLUGINS"][block] = obj["BLOCKPLUGINS"][block];
    }

    if ("MACROPLUGINS" in obj) {
        for (const macro in obj["MACROPLUGINS"]) {
            activity.pluginObjs["MACROPLUGINS"][macro] = obj["MACROPLUGINS"][macro];
        }
    }

    if ("GLOBALS" in obj) {
        if (!("GLOBALS" in activity.pluginObjs)) {
            activity.pluginObjs["GLOBALS"] = "";
        }
        activity.pluginObjs["GLOBALS"] += obj["GLOBALS"];
    }

    if ("IMAGES" in obj) {
        activity.pluginObjs["IMAGES"] = obj["IMAGES"];
    }

    for (const name in obj["ONLOAD"]) {
        activity.pluginObjs["ONLOAD"][name] = obj["ONLOAD"][name];
    }

    for (const name in obj["ONSTART"]) {
        activity.pluginObjs["ONSTART"][name] = obj["ONSTART"][name];
    }

    for (const name in obj["ONSTOP"]) {
        activity.pluginObjs["ONSTOP"][name] = obj["ONSTOP"][name];
    }
};

/**
 * Prepares the plugin exports by updating the plugin objects and returning them as JSON-encoded text.
 * @param {object} activity - The activity object.
 * @param {object} obj - The processed plugin data object.
 * @returns {string} The JSON-encoded text of the updated plugin objects.
 */
let preparePluginExports = (activity, obj) => {
    // add obj to plugin dictionary and return as JSON encoded text
    updatePluginObj(activity, obj);

    return JSON.stringify(activity.pluginObjs);
};

/**
 * Processes macro data, adds macros to the palette, and updates the macro dictionary.
 * @param {string} macroData - JSON-encoded dictionary containing macro data.
 * @param {object} palettes - The palettes object.
 * @param {object} blocks - The blocks object.
 * @param {object} macroDict - The macro dictionary to update.
 */
let processMacroData = (macroData, palettes, blocks, macroDict) => {
    // Macros are stored in a JSON-encoded dictionary.
    if (macroData !== undefined && macroData !== "{}") {
        try {
            const obj = JSON.parse(macroData);
            palettes.add("myblocks", "black", "#a0a0a0");

            for (const name in obj) {
                // console.debug("adding " + name + " to macroDict");
                macroDict[name] = obj[name];
                blocks.addToMyPalette(name, macroDict[name]);
            }

            palettes.makePalettes(1);
        } catch (e) {
            console.log(macroData);

            console.debug(e);
        }
    }
};

/**
 * Prepares macro exports by updating the macro dictionary with the provided macro information.
 * @param {string|null} name - The name of the macro.
 * @param {object} stack - The stack information of the macro.
 * @param {object} macroDict - The macro dictionary to update.
 * @returns {string} The JSON-encoded text of the updated macro dictionary.
 */
let prepareMacroExports = (name, stack, macroDict) => {
    if (name !== null) {
        macroDict[name] = stack;
    }

    return JSON.stringify(macroDict);
};

// Camera functionality module
// Encapsulates camera-related operations for video/image capture
const CameraManager = {
    isSetup: false,
    canPlayHandler: null,
    intervalId: null,

    /**
     * Resets the camera setup state
     */
    reset() {
        this.isSetup = false;
    }
};

/**
 * Uses the camera to capture images or video frames and displays them on the turtle's canvas.
 * @param {Array} args - Arguments passed to the function.
 * @param {object} turtles - The turtles object.
 * @param {string} turtle - The name of the turtle.
 * @param {boolean} isVideo - Indicates whether to capture video frames.
 * @param {number} cameraID - The ID of the camera interval for video frames.
 * @param {function} setCameraID - Function to set the camera interval ID.
 * @param {function} errorMsg - Function to display error messages.
 */
let doUseCamera = (args, turtles, turtle, isVideo, cameraID, setCameraID, errorMsg) => {
    const w = 320;
    const h = 240;

    let streaming = false;
    const video = document.querySelector("#camVideo");
    const canvas = document.querySelector("#camCanvas");
    const context = canvas.getContext("2d");

    if (canvas.width !== w) {
        canvas.width = w;
    }
    if (canvas.height !== h) {
        canvas.height = h;
    }

    function draw() {
        context.drawImage(video, 0, 0, w, h);
        const data = canvas.toDataURL("image/png");
        turtles.getTurtle(turtle).doShowImage(args[0], data);
    }

    if (!CameraManager.isSetup) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            errorMsg("Your browser does not support the webcam");
            return;
        }

        navigator.mediaDevices
            .getUserMedia({ video: true, audio: false })
            .then(stream => {
                video.srcObject = stream;
                video.play();
                CameraManager.isSetup = true;
            })
            .catch(error => {
                errorMsg("Could not connect to camera");

                console.debug(error);
            });
    } else {
        streaming = true;
        video.play();
        if (isVideo) {
            if (CameraManager.intervalId !== null) {
                window.clearInterval(CameraManager.intervalId);
                CameraManager.intervalId = null;
            }
            cameraID = window.setInterval(draw, 100);
            CameraManager.intervalId = cameraID;
            setCameraID(cameraID);
        } else {
            draw();
        }
    }

    if (CameraManager.canPlayHandler) {
        video.removeEventListener("canplay", CameraManager.canPlayHandler, false);
    }

    function handleCanPlay() {
        // console.debug("canplay", streaming, CameraManager.isSetup);
        if (!streaming) {
            video.setAttribute("width", w);
            video.setAttribute("height", h);
            canvas.setAttribute("width", w);
            canvas.setAttribute("height", h);
            streaming = true;

            if (isVideo) {
                if (CameraManager.intervalId !== null) {
                    window.clearInterval(CameraManager.intervalId);
                    CameraManager.intervalId = null;
                }
                cameraID = window.setInterval(draw, 100);
                CameraManager.intervalId = cameraID;
                setCameraID(cameraID);
            } else {
                draw();
            }
        }
    }

    CameraManager.canPlayHandler = handleCanPlay;

    video.addEventListener("canplay", CameraManager.canPlayHandler, false);
};

/**
 * Stops the camera and clears the camera interval.
 * @param {number} cameraID - The ID of the camera interval.
 * @param {function} setCameraID - Function to set the camera interval ID.
 */
function doStopVideoCam(cameraID, setCameraID) {
    if (cameraID !== null) {
        window.clearInterval(cameraID);
    }

    setCameraID(null);
    const video = document.querySelector("#camVideo");
    if (video) {
        video.pause();
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    }
    CameraManager.reset();
}

/**
 * Hides certain DOM elements related to labels.
 */
function hideDOMLabel() {
    const textLabel = docById("textLabel");
    if (textLabel !== null) {
        textLabel.style.display = "none";
    }

    const numberLabel = docById("numberLabel");
    if (numberLabel !== null) {
        numberLabel.style.display = "none";
    }

    const piemenu = docById("wheelDiv");
    if (piemenu !== null) {
        piemenu.style.display = "none";
    }
}

/**
 * Displays a message (currently unused).
 * @returns {undefined}
 */
function displayMsg(/*blocks, text*/) {
    /*
    let msgContainer = blocks.msgText.parent;
    msgContainer.visible = true;
    blocks.msgText.text = text;
    msgContainer.updateCache();
    blocks.stage.setChildIndex(msgContainer, blocks.stage.getNumChildren() - 1);
    */
    return;
}

// safeSVG() and toFixed2() moved to js/utils/utils-logic.js

// rationalToFraction(), GCD(), mixedNumber(), LCD(), rationalSum(),
// nearestBeat(), oneHundredToFraction(), rgbToHex(), hexToRGB(),
// hex2rgb() moved to js/utils/utils-logic.js

/**
 * Delays execution using a promise.
 *
 * @param {number} duration - Duration of the delay in milliseconds.
 * @returns {Promise} A promise that resolves after the specified duration.
 */
let delayExecution = duration => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(true);
        }, duration);
    });
};

/**
 * Closes all widgets in the window.
 *
 * @returns {void}
 */
function closeWidgets() {
    const names = Object.keys(window.widgetWindows.openWindows);
    names.forEach(name => window.widgetWindows.closeWindow(name));
}

/**
 * Closes a specific widget by its name.
 *
 * @param {string} name - The name of the widget to be closed.
 * @returns {void}
 */
let closeBlkWidgets = name => {
    let searchKey = name;

    // NOTE: This mapping only works for widgets that never set their own
    // `blockNo` property (e.g. ModeWidget). window.widgetWindows.windowFor()
    // keys a widget's window by `widget.blockNo` if that property is set to
    // anything other than undefined (including null) — otherwise it falls
    // back to the `saveAs` or `title` argument. Widgets like PhraseMaker set
    // `this.blockNo` in their constructor, so they are keyed by blockNo, not
    // by name, and will NOT be found via this KEY_MAPPING lookup. Adding such
    // widgets here would silently do nothing. Before adding a new entry,
    // verify the target widget's windowFor() call and confirm it does not
    // rely on blockNo for its window key.
    const KEY_MAPPING = {
        "pitch-drum mapper": "pitch drum",
        "custom mode": "custom mode",
        "tempo": "tempo",
        "arpeggio": "arpeggio",
        "timbre": "timbre",
        "sampler": "sampler",
        "rhythm maker": "rhythm maker",
        "oscilloscope": "oscilloscope",
        "temperament": "temperament",
        "meter": "meter"
    };

    for (const origKey in KEY_MAPPING) {
        const translated = typeof _ === "function" ? _(origKey) : origKey;
        if (name === translated) {
            searchKey = KEY_MAPPING[origKey];
            break;
        }
    }

    if (
        window.widgetWindows &&
        window.widgetWindows.openWindows &&
        window.widgetWindows.openWindows[searchKey]
    ) {
        window.widgetWindows.closeWindow(searchKey);
        return;
    }

    const widgetTitle = document.getElementsByClassName("wftTitle");
    for (let i = 0; i < widgetTitle.length; i++) {
        const titleEl = widgetTitle[i];
        if (titleEl.innerHTML === name || titleEl.id === `${searchKey}WidgetID`) {
            const winKey =
                titleEl.id && typeof titleEl.id === "string"
                    ? titleEl.id.replace("WidgetID", "")
                    : searchKey;
            if (window.widgetWindows && typeof window.widgetWindows.closeWindow === "function") {
                window.widgetWindows.closeWindow(winKey);
            }
            break;
        }
    }
};

// resolveObject() moved to js/utils/utils-logic.js

/**
 * Imports methods and variables of model and view objects to the controller object.
 *
 * @param {Object} obj - The component object (controller) to which members of its model and view are imported.
 * @param {string} className - Used for adding members of JS based MB API classes.
 * @param {*[]} modelArgs - Constructor arguments for the model.
 * @param {*[]} viewArgs - Constructor arguments for the view.
 * @returns {void}
 */
let importMembers = (obj, className, modelArgs, viewArgs) => {
    /**
     * Adds methods and variables of one class to another class's instance.
     *
     * @param {Object} obj - Object of the component (controller).
     * @param {Function} ctype - Static class type (model or view).
     * @param {*[]} args - Array of constructor arguments.
     * @returns {void}
     */
    const addMembers = (obj, ctype, args) => {
        // If class type doesn't exist (no model class or no view class)
        if (ctype === undefined) {
            return;
        }

        // Add class type's instance to adding object
        if (args === undefined || args.length === 0) {
            obj.added = new ctype();
        } else {
            obj.added = new ctype(...args);
        }

        // Loop for all method names of class type
        for (const name of Object.getOwnPropertyNames(ctype.prototype)) {
            // Don't add the constructor
            if (name !== "constructor") {
                obj[name] = obj.added[name];
            }
        }

        // Loop for all variables of class type's instance
        for (const name of Object.keys(obj.added)) {
            obj[name] = obj.added[name];

            // Remove variable entry from obj (removing each entry right after
            // adding it to addingObj saves the overhead of dealing with double
            // memory usage until the entire object is removed)
            delete obj.added[name];
        }

        // Delete the instantiated object since this is now redundant
        delete obj.added;
    };

    const cname = obj.constructor.name; // class name of component object

    if (className !== "" && className !== undefined) {
        addMembers(obj, resolveObject(className));
        return;
    }

    // Add members of Model (class type has to be controller's name + "Model")
    addMembers(obj, resolveObject(cname + "." + cname + "Model"), modelArgs);

    // Add members of View (class type has to be controller's name + "View")
    addMembers(obj, resolveObject(cname + "." + cname + "View"), viewArgs);
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        ...UtilsLogic,
        extractProjectDataFromHTML,
        _,
        format,
        delayExecution,
        closeWidgets,
        closeBlkWidgets,
        importMembers,
        changeImage,
        fnBrowserDetect,
        canvasPixelRatio,
        windowHeight,
        windowWidth,
        httpGet,
        httpPost,
        HttpRequest,
        docByClass,
        docByTagName,
        docById,
        docByName,
        docBySelector,
        getTextWidth,
        doSVG,
        isSVGEmpty,
        prepareMacroExports,
        processMacroData,
        hideDOMLabel,
        displayMsg
    };
}
