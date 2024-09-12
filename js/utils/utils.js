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

   jQuery, PALETTEICONS, PALETTEFILLCOLORS, PALETTESTROKECOLORS,
   PALETTEHIGHLIGHTCOLORS, HIGHLIGHTSTROKECOLORS, MULTIPALETTES,
   platformColor
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
*/

/* exported

   canvasPixelRatio, changeImage, closeBlkWidgets, closeWidgets,
   delayExecution, displayMsg, doBrowserCheck, docByClass, docByName,
   docBySelector, docByTagName, doPublish, doStopVideoCam, doSVG,
   doUseCamera, fileBasename, fileExt, format, getTextWidth, hex2rgb,
   hexToRGB, hideDOMLabel, httpGet, httpPost, HttpRequest,
   importMembers, isSVGEmpty, last, mixedNumber, nearestBeat,
   oneHundredToFraction, prepareMacroExports, preparePluginExports,
   processMacroData, processRawPluginData, rationalSum, rgbToHex,
   safeSVG, toFixed2, toTitleCase, windowHeight, windowWidth,
   fnBrowserDetect
*/

/**
 * Changes the source of an image element from one SVG data URI to another.
 * @function
 * @param {HTMLImageElement} imgElement - The image element to update.
 * @param {string} from - The base64-encoded SVG data URI to replace.
 * @param {string} to - The new base64-encoded SVG data URI.
 */
const changeImage = (imgElement, from, to) => {
    const oldSrc = "data:image/svg+xml;base64," + window.btoa(base64Encode(from));
    const newSrc = "data:image/svg+xml;base64," + window.btoa(base64Encode(to));
    if (imgElement.src === oldSrc) {
        imgElement.src = newSrc;
    }
};

/**
 * A simple localization function for translating strings.
 * @function
 * @param {string} text - The input text to be translated.
 * @returns {string} The translated text.
 */
function _(text) {
    if (text === null) {
        // console.debug("null string passed to _");
        return "";
    }

    let replaced = text;
    const replace = [
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
    for (let p = 0; p < replace.length; p++) {
        replaced = replaced.replace(replace[p], "");
    }

    replaced = replaced.replace(/ /g, "-");

    if (localStorage.kanaPreference === "kana") {
        const lang = document.webL10n.getLanguage();
        if (lang === "ja") {
            replaced = "kana-" + replaced;
        }
    }

    try {
        let translation = document.webL10n.get(replaced);
        if (translation === "") {
            translation = text;
        }
        return translation;
    } catch (e) {
        // console.debug("i18n error: " + text);
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
        name.split(".").forEach((v) => {
            if (x === undefined) {
                // eslint-disable-next-line no-console
                console.debug("Undefined value in template string", str, name, x, v);
            }

            x = x[v];
        });

        return x;
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
    } else if(userAgent.match(/firefox|fxios/i)) {
        browserName = "firefox";
    } else if(userAgent.match(/safari/i)) {
        browserName = "safari";
    } else if(userAgent.match(/opr\//i)) {
        browserName = "opera";
    } else if(userAgent.match(/edg/i)) {
        browserName = "edge";
    } else {
        browserName="No browser detection";
    }
    return browserName;
};

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
 * @param {string|null} projectName - The name of the project (or null for the base URL).
 * @throws {string} Throws an error if the HTTP status code is greater than 299.
 * @returns {string} The response text from the server.
 */
let httpGet = (projectName) => {
    let xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    if (projectName === null) {
        xmlHttp.open("GET", window.server, false);
        xmlHttp.setRequestHeader("x-api-key", "3tgTzMXbbw6xEKX7");
    } else {
        xmlHttp.open("GET", window.server + projectName, false);
        xmlHttp.setRequestHeader("x-api-key", "3tgTzMXbbw6xEKX7");
    }

    xmlHttp.send();
    if (xmlHttp.status > 299) {
        throw "Error from server";
    }

    return xmlHttp.responseText;
};

/**
 * Performs an HTTP POST request to send data to the server.
 * @param {string} projectName - The name of the project.
 * @param {string} data - The data to be sent in the POST request.
 * @returns {string} The response text from the server.
 */
let httpPost = (projectName, data) => {
    let xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", window.server + projectName, false);
    xmlHttp.setRequestHeader("x-api-key", "3tgTzMXbbw6xEKX7");
    xmlHttp.send(data);
    return xmlHttp.responseText;
    // return 'https://apps.facebook.com/turtleblocks/?file=' + projectName;
};

/**
 * Constructor function for making an HTTP request.
 * @constructor
 * @param {string} url - The URL to make the HTTP request to.
 * @param {function} loadCallback - The callback function to handle the loaded response.
 * @param {function} [userCallback] - An optional user-defined callback function.
 */
function HttpRequest(url, loadCallback, userCallback) {
    // userCallback is an optional callback-handler.
    const req = (this.request = new XMLHttpRequest());
    this.handler = loadCallback;
    this.url = url;
    this.localmode = Boolean(self.location.href.search(/^file:/i) === 0);
    this.userCallback = userCallback;

    const objref = this;
    try {
        req.open("GET", url);

        req.onreadystatechange = () => {
            objref.handler();
        };

        req.send("");
    } catch (e) {
        if (self.console) {
            // eslint-disable-next-line no-console
            console.debug("Failed to load resource from " + url + ": Network error.");
            // eslint-disable-next-line no-console
            console.debug(e);
        }

        if (typeof userCallback === "function") {
            userCallback(false, "network error");
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
    jQuery.uaMatch = (ua) => {
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

// Check for Internet Explorer

window.onload = () => {
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

    if (typeof DetectVersionOfIE != "undefined") {
        document.body.innerHTML = "<div style='margin: 200px;'>";
        document.body.innerHTML +=
            "<h1 style='font-size: 100px; font-family: Arial; text-align: center; color: #F00;'>Music Blocks</h1>";
        document.body.innerHTML +=
            "<h3 style='font-size: 40px; font-family: Arial; text-align: center;'>Music Blocks will not work in Internet Explorer, you can use:</h3>";
        document.body.innerHTML +=
            "<div style='width: 550px; margin: 0 auto;'><a href='https://www.chromium.org/getting-involved/download-chromium' style='float: left; display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Chromium</a>";
        document.body.innerHTML +=
            "<a href='https://www.google.com/chrome/' style='float: left; margin-left: 40px;display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Chrome</a>";
        document.body.innerHTML +=
            "<a href='https://support.apple.com/downloads/safari' style='float: left; margin-left: 40px;display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Safari</a>";
        document.body.innerHTML +=
            "<a href='https://www.mozilla.org/en-US/firefox/new/' style='float: left; margin-left: 40px;display: inherit; font-family: Arial; font-size: 30px; color: #0327F1; text-decoration: none;'>Firefox</a>";
        document.body.innerHTML += "</div></div>";
    }
};

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
    document.getElementsByTagName(tag);
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

/**
 * Returns the last element of an array.
 * @param {Array} myList - The array from which to get the last element.
 * @returns {*} The last element of the array, or null if the array is empty.
 */
let last = (myList) => {
    const i = myList.length;
    if (i === 0) {
        return null;
    } else {
        return myList[i - 1];
    }
};

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
        turtles.turtleList[turtle].painter.closeSVG();
        turtleSVG += turtles.turtleList[turtle].painter.svgOutput;
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
let isSVGEmpty = (turtles) => {
    for (const turtle in turtles.turtleList) {
        turtles.turtleList[turtle].painter.closeSVG();
        if (turtles.turtleList[turtle].painter.svgOutput !== "") {
            return false;
        }
    }
    return true;
};

/**
 * Gets the file extension from a file path.
 * @param {string} file - The file path or name.
 * @returns {string} The file extension.
 */
let fileExt = (file) => {
    if (file === null) {
        return "";
    }

    const parts = file.split(".");
    if (parts.length === 1 || (parts[0] === "" && parts.length === 2)) {
        return "";
    }

    return parts.pop();
};

/**
 * Gets the basename of a file path (excluding the extension).
 * @param {string} file - The file path or name.
 * @returns {string} The basename.
 */
let fileBasename = (file) => {
    const parts = file.split(".");
    if (parts.length === 1) {
        return parts[0];
    } else if (parts[0] === "" && parts.length === 2) {
        return file;
    } else {
        parts.pop(); // throw away suffix
        return parts.join(".");
    }
};

/**
 * Converts the first character of a string to uppercase.
 * @param {string} str - The input string.
 * @returns {string} The string with the first character in uppercase.
 */
let toTitleCase = (str) => {
    if (typeof str !== "string") return;
    let tempStr = "";
    if (str.length > 1) tempStr = str.substring(1);
    return str.toUpperCase()[0] + tempStr;
};

/**
 * Processes plugin data and updates the activity based on the provided JSON-encoded dictionary.
 * @param {object} activity - The activity object to update.
 * @param {string} pluginData - The JSON-encoded plugin data.
 * @returns {object|null} The processed plugin data object or null if parsing fails.
 */
const processPluginData = (activity, pluginData) => {
    // Plugins are JSON-encoded dictionaries.
    if (pluginData === undefined) {
        return null;
    }
    let obj;
    try {
        obj = JSON.parse(pluginData);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(pluginData);
        // eslint-disable-next-line no-console
        console.log(e);
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
                // eslint-disable-next-line no-console
                console.debug("palette " + name + " already exists");
            } else {
                // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-console
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
    // eval'd by this block.
    if ("FLOWPLUGINS" in obj) {
        for (const flow in obj["FLOWPLUGINS"]) {
            activity.logo.evalFlowDict[flow] = obj["FLOWPLUGINS"][flow];
        }
    }

    // Populate the arg-block dictionary, i.e., the code that is
    // eval'd by this block.
    if ("ARGPLUGINS" in obj) {
        for (const arg in obj["ARGPLUGINS"]) {
            activity.logo.evalArgDict[arg] = obj["ARGPLUGINS"][arg];
        }
    }

    // Populate the macro dictionary, i.e., the code that is
    // eval'd by this block.
    if ("MACROPLUGINS" in obj) {
        for (const macro in obj["MACROPLUGINS"]) {
            try {
                activity.palettes.pluginMacros[macro] = JSON.parse(obj["MACROPLUGINS"][macro]);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug("could not parse macro " + macro);
                // eslint-disable-next-line no-console
                console.debug(e);
            }
        }
    }

    // Populate the setter dictionary, i.e., the code that is
    // used to set a value block.
    if ("SETTERPLUGINS" in obj) {
        for (const setter in obj["SETTERPLUGINS"]) {
            activity.logo.evalSetterDict[setter] = obj["SETTERPLUGINS"][setter];
        }
    }

    // Create the plugin protoblocks.
    // FIXME: On Chrome, plugins are broken (They still work on Firefox):
    // EvalError: Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: "script-src 'self' blob: filesystem: chrome-extension-resource:".
    // Maybe:
    // let g = (function() { return this ? this : typeof self !== 'undefined' ? self : undefined})() || Function("return this")();

    if ("BLOCKPLUGINS" in obj) {
        for (const block in obj["BLOCKPLUGINS"]) {
            // eslint-disable-next-line no-console
            console.debug("adding plugin block " + block);
            try {
                eval(obj["BLOCKPLUGINS"][block]);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.debug("Failed to load plugin for " + block + ": " + e);
            }
        }
    }

    // Create the globals.
    if ("GLOBALS" in obj) {
        eval(obj["GLOBALS"]);
    }

    if ("PARAMETERPLUGINS" in obj) {
        for (const parameter in obj["PARAMETERPLUGINS"]) {
            activity.logo.evalParameterDict[parameter] = obj["PARAMETERPLUGINS"][parameter];
        }
    }

    // Code to execute when plugin is loaded
    if ("ONLOAD" in obj) {
        for (const arg in obj["ONLOAD"]) {
            eval(obj["ONLOAD"][arg]);
        }
    }

    // Code to execute when turtle code is started
    if ("ONSTART" in obj) {
        for (const arg in obj["ONSTART"]) {
            activity.logo.evalOnStartList[arg] = obj["ONSTART"][arg];
        }
    }

    // Code to execute when turtle code is stopped
    if ("ONSTOP" in obj) {
        for (const arg in obj["ONSTOP"]) {
            activity.logo.evalOnStopList[arg] = obj["ONSTOP"][arg];
        }
    }

    for (const protoblock in activity.blocks.protoBlockDict) {
        try {
            // Push the protoblocks onto their palettes.
            if (activity.blocks.protoBlockDict[protoblock].palette === undefined) {
                // eslint-disable-next-line no-console
                console.debug("Cannot find palette for protoblock " + protoblock);
            } else if (activity.blocks.protoBlockDict[protoblock].palette === null) {
                // eslint-disable-next-line no-console
                console.debug("Cannot find palette for protoblock " + protoblock);
            } else {
                activity.blocks.protoBlockDict[protoblock].palette.add(
                    activity.blocks.protoBlockDict[protoblock]);
            }
        } catch (e) {
            // eslint-disable-next-line no-console
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
 * @param {object} activity - The activity object to update.
 * @param {string} rawData - Raw plugin data to process.
 * @returns {object|null} The processed plugin data object or null if parsing fails.
 */
const processRawPluginData = (activity, rawData) => {
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
        obj = processPluginData(activity, cleanData.replace(/\n/g, ""));
    } catch (e) {
        obj = null;
        // eslint-disable-next-line no-console
        console.log(rawData);
        // eslint-disable-next-line no-console
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
            // eslint-disable-next-line no-console
            console.log(macroData);
            // eslint-disable-next-line no-console
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

// Some block-specific code
// TODO: Move to camera plugin
let hasSetupCamera = false;
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
    navigator.getMedia =
        navigator.getUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.msGetUserMedia;
    if (navigator.getMedia === undefined) {
        errorMsg("Your browser does not support the webcam");
    }

    function draw() {
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(video, 0, 0, w, h);
        const data = canvas.toDataURL("image/png");
        turtles.turtleList[turtle].doShowImage(args[0], data);
    }

    if (!hasSetupCamera) {
        navigator.getMedia(
            { video: true, audio: false },
            (stream) => {
                if (navigator.mozGetUserMedia) {
                    video.mozSrcObject = stream;
                } else {
                    video.srcObject = stream;
                }

                video.play();
                hasSetupCamera = true;
            },
            (error) => {
                errorMsg("Could not connect to camera");
                // eslint-disable-next-line no-console
                console.debug(error);
            }
        );
    } else {
        streaming = true;
        video.play();
        if (isVideo) {
            cameraID = window.setInterval(draw, 100);
            setCameraID(cameraID);
        } else {
            draw();
        }
    }

    video.addEventListener(
        "canplay",
        () => {
            // console.debug("canplay", streaming, hasSetupCamera);
            if (!streaming) {
                video.setAttribute("width", w);
                video.setAttribute("height", h);
                canvas.setAttribute("width", w);
                canvas.setAttribute("height", h);
                streaming = true;

                if (isVideo) {
                    cameraID = window.setInterval(draw, 100);
                    setCameraID(cameraID);
                } else {
                    draw();
                }
            }
        },
        false
    );
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
    document.querySelector("#camVideo").pause();
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

/**
 * Escapes HTML entities in a given string to make it safe for SVG.
 * @param {string} label - The string to escape.
 * @returns {string} The escaped string.
 */
function safeSVG(label) {
    if (typeof label === "string") {
        return label.replace(/&/, "&amp;").replace(/</, "&lt;").replace(/>/, "&gt;");
    } else {
        return label;
    }
}

/**
 * Formats a number to fixed two precision.
 * @param {number} d - The number to format.
 * @returns {string} The formatted number.
 */
function toFixed2(d) {
    // Return number as fixed 2 precision
    if (typeof d === "number") {
        const floor = Math.floor(d);
        if (d !== floor) {
            return d.toFixed(2).toString();
        } else {
            return d.toString();
        }
    } else {
        return d;
    }
}

/**
 * Converts a floating-point number to its approximate fractional representation.
 * @param {number} d - The input number.
 * @returns {Array} An array representing the fraction in the form [numerator, denominator].
 */
function rationalToFraction(d) {
    /*
    Convert float to its approximate fractional representation. '''

    This code was translated to JavaScript from the answers at
    http://stackoverflow.com/questions/95727/how-to-convert-floats-to-human-\
readable-fractions/681534#681534

    For example:
    >>> 3./5
    0.59999999999999998

    >>> rationalToFraction(3./5)
    "3/5"

    */

    let invert;
    if (d > 1) {
        invert = true;
        d = 1 / d;
    } else {
        invert = false;
    }

    let df = 1.0;
    let top = 1;
    let bot = 1;

    while (Math.abs(df - d) > 0.00000001) {
        if (df < d) {
            top += 1;
        } else {
            bot += 1;
            top = Math.floor(d * bot);
        }

        df = top / bot;
    }

    if (bot === 0 || top === 0) {
        return [0, 1];
    }

    if (invert) {
        return [bot, top];
    } else {
        return [top, bot];
    }
}

/**
 * Calculates the greatest common divisor (GCD) of two numbers.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The GCD of the two numbers.
 */
function GCD(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);

    while (b) {
        const n = b;
        b = a % b;
        a = n;
    }

    return a;
}

/**
 * Converts a number to a mixed fraction string.
 * @param {number} d - The input number.
 * @returns {string} The mixed fraction string.
 */
let mixedNumber = (d) => {
    // Return number as a mixed fraction string, e.g., "2 1/4"

    if (typeof d === "number") {
        const floor = Math.floor(d);
        if (d > floor) {
            const obj = rationalToFraction(d - floor);
            if (floor === 0) {
                return obj[0] + "/" + obj[1];
            } else {
                if (obj[0] === 1 && obj[1] === 1) {
                    return floor + 1;
                } else {
                    if (obj[1] > 99) {
                        return d.toFixed(2);
                    } else {
                        return floor + " " + obj[0] + "/" + obj[1];
                    }
                }
            }
        } else {
            return d.toString() + "/1";
        }
    } else {
        return d;
    }
};

/**
 * Calculates the least common denominator (LCD) of two numbers.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The LCD of the two numbers.
 */
const LCD = (a, b) => {
    return Math.abs((a * b) / GCD(a, b));
};

/**
 * Adds two rational numbers represented as arrays [numerator, denominator].
 * @param {Array} a - The first rational number.
 * @param {Array} b - The second rational number.
 * @returns {Array} The sum of the two rational numbers in the form [numerator, denominator].
 */
let rationalSum = (a, b) => {
    if (a === 0 || b === 0) {
        // console.debug("divide by zero?");
        return [0, 1];
    }

    // Make sure a and b components are integers.
    let obja0, objb0, obja1, objb1;
    if (Math.floor(a[0]) !== a[0]) {
        obja0 = rationalToFraction(a[0]);
    } else {
        obja0 = [a[0], 1];
    }

    if (Math.floor(b[0]) !== b[0]) {
        objb0 = rationalToFraction(b[0]);
    } else {
        objb0 = [b[0], 1];
    }

    if (Math.floor(a[1]) !== a[1]) {
        obja1 = rationalToFraction(a[1]);
    } else {
        obja1 = [a[1], 1];
    }

    if (Math.floor(b[1]) !== b[1]) {
        objb1 = rationalToFraction(b[1]);
    } else {
        objb1 = [b[1], 1];
    }

    a[0] = obja0[0] * obja1[1];
    a[1] = obja0[1] * obja1[0];
    b[0] = objb0[0] * objb1[1];
    b[1] = objb0[1] * objb1[0];

    // Find the least common denomenator
    const lcd = LCD(a[1], b[1]);
    // const c0 = (a[0] * lcd) / a[1] + (b[0] * lcd) / b[1];
    return [(a[0] * lcd) / a[1] + (b[0] * lcd) / b[1], lcd];
};

/**
 * Finds the nearest beat for a given fraction.
 * @param {number} d - The numerator of the fraction.
 * @param {number} b - The denominator of the fraction.
 * @returns {Array} An array representing the nearest beat in the form [numerator, denominator].
 */
let nearestBeat = (d, b) => {
    // Find the closest beat for a given fraction.

    let sum = 1 / (2 * b);
    let count = 0;
    const dd = d / 100;
    while (dd > sum) {
        sum += 1 / b;
        count += 1;
    }

    return [count, b];
};

/**
 * Generates simple fractions based on a scale of 1-100.
 * @param {number} d - The input number.
 * @returns {Array} An array representing the fraction in the form [numerator, denominator].
 */
let oneHundredToFraction = (d) => {
    // Generate some simple fractions based on a scale of 1-100

    if (d < 1) {
        return [1, 64];
    } else if (d > 99) {
        return [1, 1];
    }

    switch (Math.floor(d)) {
        case 1:
            return [1, 64];
        case 2:
            return [1, 48];
        case 3:
        case 4:
        case 5:
            return [1, 32];
        case 6:
        case 7:
        case 8:
            return [1, 16];
        case 9:
        case 10:
        case 11:
            return [1, 12];
        case 12:
        case 13:
        case 14:
            return [1, 8];
        case 15:
        case 16:
        case 17:
            return [1, 6];
        case 18:
        case 19:
            return [3, 16];
        case 20:
        case 21:
        case 22:
            return [1, 5];
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
            return [1, 4];
        case 30:
        case 31:
            return [5, 16];
        case 32:
        case 33:
        case 34:
        case 35:
            return [1, 3];
        case 36:
        case 37:
        case 38:
        case 39:
            return [3, 8];
        case 40:
        case 41:
            return [2, 5];
        case 42:
        case 43:
        case 44:
            return [7, 16];
        case 45:
        case 46:
        case 47:
            return [15, 32];
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
            return [1, 2];
        case 53:
        case 54:
            return [17, 32];
        case 56:
        case 57:
        case 58:
            return [9, 16];
        case 59:
        case 60:
        case 61:
            return [3, 5];
        case 62:
        case 63:
        case 64:
        case 65:
            return [5, 8];
        case 66:
        case 67:
            return [2, 3];
        case 68:
        case 69:
        case 70:
            return [11, 16];
        case 71:
        case 72:
        case 73:
        case 74:
            return [23, 32];
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
            return [3, 4];
        case 81:
        case 82:
            return [13, 16];
        case 83:
        case 84:
        case 85:
        case 86:
            return [5, 6];
        case 87:
        case 88:
        case 89:
        case 90:
            return [7, 8];
        case 91:
        case 92:
            return [11, 12];
        case 93:
        case 94:
        case 95:
            return [15, 16];
        case 96:
        case 98:
            return [31, 32];
        case 99:
            return [63, 64];
        default:
            return [d, 100];
    }
};

/**
 * Converts RGB values to a hexadecimal color code.
 *
 * @param {number} r - Red value (0-255).
 * @param {number} g - Green value (0-255).
 * @param {number} b - Blue value (0-255).
 * @returns {string} Hexadecimal color code.
 */
let rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

/**
 * Converts a hexadecimal color code to RGB values.
 *
 * @param {string} hex - Hexadecimal color code.
 * @returns {Object} Object with RGB values {r, g, b} or null if invalid hex code.
 */
let hexToRGB = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        }
        : null;
};

/**
 * Converts a hexcode to RGBA format.
 *
 * @param {number} hex - Hexadecimal color code.
 * @returns {string} RGBA color value with alpha set to 1.
 */
let hex2rgb = (hex) => {
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return "rgba(" + r + "," + g + "," + b + ",1)";
};

/**
 * Delays execution using a promise.
 *
 * @param {number} duration - Duration of the delay in milliseconds.
 * @returns {Promise} A promise that resolves after the specified duration.
 */
let delayExecution = (duration) => {
    return new Promise((resolve) => {
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
    window.widgetWindows.hideAllWindows();
};

/**
 * Closes a specific widget by its name.
 *
 * @param {string} name - The name of the widget to be closed.
 * @returns {void}
 */
let closeBlkWidgets = (name) => {
    const widgetTitle = document.getElementsByClassName("wftTitle");
    for (let i = 0; i < widgetTitle.length; i++) {
        if (widgetTitle[i].innerHTML === name) {
            window.widgetWindows.hideWindow(widgetTitle[i].innerHTML);
            break;
        }
    }
};

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
        addMembers(obj, eval(className));
        return;
    }

    // Add members of Model (class type has to be controller's name + "Model")
    addMembers(obj, eval(cname + "." + cname + "Model"), modelArgs);

    // Add members of View (class type has to be controller's name + "View")
    addMembers(obj, eval(cname + "." + cname + "View"), viewArgs);
};
