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
        resolveObject, isUnsafeObjectKey
    - js/utils/browser-utils.js
        canvasPixelRatio, doBrowserCheck, fnBrowserDetect, windowHeight, windowWidth
*/

if (typeof module !== "undefined" && module.exports) {
    var UtilsLogic =
        (typeof window !== "undefined" && window.UtilsLogic) ||
        (typeof require !== "undefined" ? require("./utils-logic") : {});
    var { resolveObject, isUnsafeObjectKey } = UtilsLogic;

    var DomHelpers =
        (typeof window !== "undefined" && window.DomHelpers) ||
        (typeof require !== "undefined" ? require("./dom-helpers") : {});

    var BrowserUtils =
        (typeof window !== "undefined" && window.BrowserUtils) ||
        (typeof require !== "undefined" ? require("./browser-utils") : {});

    var HttpUtils =
        (typeof window !== "undefined" && window.HttpUtils) ||
        (typeof require !== "undefined" ? require("./http-utils") : {});

    var PluginUtils =
        (typeof window !== "undefined" && window.PluginUtils) ||
        (typeof require !== "undefined" ? require("./plugin-utils") : {});

    var MacroUtils =
        (typeof window !== "undefined" && window.MacroUtils) ||
        (typeof require !== "undefined" ? require("./macro-utils") : {});
}

/* exported
   announceToScreenReader, changeImage,
   delayExecution,
   doPublish, doSVG,
   format, getTextWidth,
   importMembers, isSVGEmpty, waitForReadiness
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

// docByClass(), docByTagName(), docById(), docByName(), docBySelector()
// moved to js/utils/dom-helpers.js

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

// hideDOMLabel() and displayMsg() moved to js/utils/dom-helpers.js

// safeSVG() and toFixed2() moved to js/utils/utils-logic.js

// rationalToFraction(), GCD(), mixedNumber(), LCD(), rationalSum(),
// nearestBeat(), oneHundredToFraction(), rgbToHex(), hexToRGB(),
// hex2rgb() moved to js/utils/utils-logic.js

// processPluginData(), updatePluginObj(), preparePluginExports() moved to js/utils/plugin-utils.js

// processMacroData(), prepareMacroExports() moved to js/utils/macro-utils.js

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

// closeWidgets() moved to js/utils/dom-helpers.js

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
/**
 * Announces a message to screen readers via a shared aria-live region.
 * Creates the region lazily on first use and reuses it for all subsequent calls.
 * @param {string} msg - The message to announce.
 */
const announceToScreenReader = msg => {
    let region = document.getElementById("mbA11yLiveRegion");
    if (!region) {
        region = document.createElement("div");
        region.id = "mbA11yLiveRegion";
        region.setAttribute("role", "status");
        region.setAttribute("aria-live", "polite");
        region.setAttribute("aria-atomic", "true");
        region.style.cssText =
            "position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;";
        document.body.appendChild(region);
    }
    region.textContent = msg;
};
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
        ...DomHelpers,
        ...BrowserUtils,
        ...HttpUtils,
        ...PluginUtils,
        ...MacroUtils,
        extractProjectDataFromHTML,
        _,
        format,
        delayExecution,
        importMembers,
        changeImage,
        getTextWidth,
        doSVG,
        isSVGEmpty,
        announceToScreenReader
    };
}

// In the browser (and not under test, where dom-helpers.js's equivalent
// guard already explains why this is conditional), explicitly attach this
// to `window` rather than relying on it being reachable as a bare
// identifier from other classic <script>-loaded files. That reachability
// is real but load-order-dependent and not guaranteed -- callers in newer
// or differently-ordered files have hit `ReferenceError: announceToScreenReader
// is not defined` despite the function existing here.
if (typeof window !== "undefined" && (typeof module === "undefined" || !module.exports)) {
    window.announceToScreenReader = announceToScreenReader;
}
