// Copyright (c) 2014-19 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
const changeImage = (imgElement, from, to) => {
    oldSrc = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(from)));
    newSrc = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(to)));
    if (imgElement.src === oldSrc) {
        imgElement.src = newSrc;
    }
};

function format(str, data) {
    str = str.replace(/{([a-zA-Z0-9.]*)}/g, (match, name) => {
        x = data;
        name.split(".").forEach((v) => {
            if (x === undefined) {
                console.debug("Undefined value in template string", str, name, x, v);
            }

            x = x[v];
        });

        return x;
    });

    return str.replace(/{_([a-zA-Z0-9]+)}/g, (match, item) => {
        return _(item);
    });
}

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

function windowHeight() {
    const onAndroid = /Android/i.test(navigator.userAgent);
    if (onAndroid) {
        return window.outerHeight;
    } else {
        return window.innerHeight;
    }
}

function windowWidth() {
    const onAndroid = /Android/i.test(navigator.userAgent);
    if (onAndroid) {
        return window.outerWidth;
    } else {
        return window.innerWidth;
    }
}

function httpGet(projectName) {
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
}

function httpPost(projectName, data) {
    let xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", window.server + projectName, false);
    xmlHttp.setRequestHeader("x-api-key", "3tgTzMXbbw6xEKX7");
    xmlHttp.send(data);
    return xmlHttp.responseText;
    // return 'https://apps.facebook.com/turtleblocks/?file=' + projectName;
}

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
            console.debug("Failed to load resource from " + url + ": Network error.");
        }

        if (typeof userCallback === "function") {
            userCallback(false, "network error");
        }

        this.request = this.handler = this.userCallback = null;
    }
}

function doBrowserCheck() {
    let matched, browser;
    jQuery.uaMatch = (ua) => {
        ua = ua.toLowerCase();

        const match =
            /(chrome)[ \/]([\w.]+)/.exec(ua) ||
            /(webkit)[ \/]([\w.]+)/.exec(ua) ||
            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
            /(msie) ([\w.]+)/.exec(ua) ||
            (ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)) ||
            [];

        return {
            browser: match[1] || "",
            version: match[2] || "0"
        };
    };

    matched = jQuery.uaMatch(navigator.userAgent);
    browser = {};

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

window.onload = function () {
    const userAgent = window.navigator.userAgent;
    console.log("run detectIE");
    // For IE 10 or older
    const MSIE = userAgent.indexOf("MSIE ");
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

function docByClass(classname) {
    return document.getElementsByClassName(classname);
}

function docByTagName(tag) {
    document.getElementsByTagName(tag);
}

function docById(id) {
    return document.getElementById(id);
}

function docByName(name) {
    return document.getElementsByName(name);
}

function docBySelector(selector) {
    return document.querySelector(selector);
}

function last(myList) {
    const i = myList.length;
    if (i === 0) {
        return null;
    } else {
        return myList[i - 1];
    }
}

function getTextWidth(text, font) {
    // re-use canvas object for better performance
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

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

function isSVGEmpty(turtles) {
    for (const turtle in turtles.turtleList) {
        turtles.turtleList[turtle].painter.closeSVG();
        if (turtles.turtleList[turtle].painter.svgOutput !== "") {
            return false;
        }
    }
    return true;
}

function fileExt(file) {
    if (file === null) {
        return "";
    }

    const parts = file.split(".");
    if (parts.length === 1 || (parts[0] === "" && parts.length === 2)) {
        return "";
    }

    return parts.pop();
}

function fileBasename(file) {
    const parts = file.split(".");
    if (parts.length === 1) {
        return parts[0];
    } else if (parts[0] === "" && parts.length === 2) {
        return file;
    } else {
        parts.pop(); // throw away suffix
        return parts.join(".");
    }
}

function _(text) {
    if (text === null) {
        console.debug("null string passed to _");
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
        console.debug("i18n error: " + text);
        return text;
    }
}

function toTitleCase(str) {
    if (typeof str !== "string") return;
    let tempStr = "";
    if (str.length > 1) tempStr = str.substring(1);
    return str.toUpperCase()[0] + tempStr;
}

function processRawPluginData(
    rawData,
    palettes,
    blocks,
    errorMsg,
    evalFlowDict,
    evalArgDict,
    evalParameterDict,
    evalSetterDict,
    evalOnStartList,
    evalOnStopList,
    evalMacroDict
) {
    // console.debug(rawData);
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
        obj = processPluginData(
            cleanData.replace(/\n/g, ""),
            palettes,
            blocks,
            evalFlowDict,
            evalArgDict,
            evalParameterDict,
            evalSetterDict,
            evalOnStartList,
            evalOnStopList,
            evalMacroDict
        );
    } catch (e) {
        obj = null;
        errorMsg("Error loading plugin: " + e);
    }

    return obj;
}

function processPluginData(
    pluginData,
    palettes,
    blocks,
    evalFlowDict,
    evalArgDict,
    evalParameterDict,
    evalSetterDict,
    evalOnStartList,
    evalOnStopList,
    evalMacroDict
) {
    // Plugins are JSON-encoded dictionaries.
    // console.debug(pluginData);
    const obj = JSON.parse(pluginData);

    // Create a palette entry.
    let newPalette = false;
    if ("PALETTEPLUGINS" in obj) {
        for (const name in obj["PALETTEPLUGINS"]) {
            PALETTEICONS[name] = obj["PALETTEPLUGINS"][name];
            let fillColor = "#ff0066";
            if ("PALETTEFILLCOLORS" in obj) {
                if (name in obj["PALETTEFILLCOLORS"]) {
                    fillColor = obj["PALETTEFILLCOLORS"][name];
                    // console.debug(fillColor);
                }
            }

            PALETTEFILLCOLORS[name] = fillColor;

            let strokeColor = "#ef003e";
            if ("PALETTESTROKECOLORS" in obj) {
                if (name in obj["PALETTESTROKECOLORS"]) {
                    strokeColor = obj["PALETTESTROKECOLORS"][name];
                    // console.debug(strokeColor);
                }
            }

            PALETTESTROKECOLORS[name] = strokeColor;

            let highlightColor = "#ffb1b3";
            if ("PALETTEHIGHLIGHTCOLORS" in obj) {
                if (name in obj["PALETTEHIGHLIGHTCOLORS"]) {
                    highlightColor = obj["PALETTEHIGHLIGHTCOLORS"][name];
                    // console.debug(highlightColor);
                }
            }

            PALETTEHIGHLIGHTCOLORS[name] = highlightColor;

            let strokeHighlightColor = "#404040";
            if ("HIGHLIGHTSTROKECOLORS" in obj) {
                if (name in obj["HIGHLIGHTSTROKECOLORS"]) {
                    strokeHighlightColor = obj["HIGHLIGHTSTROKECOLORS"][name];
                    // console.debug(highlightColor);
                }
            }

            HIGHLIGHTSTROKECOLORS[name] = strokeHighlightColor;

            platformColor.paletteColors[name] = [
                fillColor,
                strokeColor,
                highlightColor,
                strokeHighlightColor
            ];

            if (name in palettes.buttons) {
                console.debug("palette " + name + " already exists");
            } else {
                console.debug("adding palette " + name);
                palettes.add(name);
                newPalette = true;
            }
        }
    }

    if (newPalette) {
        try {
            console.debug("CALLING makePalettes");
            palettes.makePalettes(1);
        } catch (e) {
            console.debug("makePalettes: " + e);
        }
    }

    // Define the image blocks
    if ("IMAGES" in obj) {
        for (const blkName in obj["IMAGES"]) {
            pluginsImages[blkName] = obj["IMAGES"][blkName];
        }
    }

    // Populate the flow-block dictionary, i.e., the code that is
    // eval'd by this block.
    if ("FLOWPLUGINS" in obj) {
        for (const flow in obj["FLOWPLUGINS"]) {
            evalFlowDict[flow] = obj["FLOWPLUGINS"][flow];
        }
    }

    // Populate the arg-block dictionary, i.e., the code that is
    // eval'd by this block.
    if ("ARGPLUGINS" in obj) {
        for (const arg in obj["ARGPLUGINS"]) {
            evalArgDict[arg] = obj["ARGPLUGINS"][arg];
        }
    }

    // Populate the macro dictionary, i.e., the code that is
    // eval'd by this block.
    if ("MACROPLUGINS" in obj) {
        for (const macro in obj["MACROPLUGINS"]) {
            try {
                evalMacroDict[macro] = JSON.parse(obj["MACROPLUGINS"][macro]);
            } catch (e) {
                console.debug("could not parse macro " + macro);
                console.debug(obj["MACROPLUGINS"][macro]);
            }
        }
    }

    // Populate the setter dictionary, i.e., the code that is
    // used to set a value block.
    if ("SETTERPLUGINS" in obj) {
        for (const setter in obj["SETTERPLUGINS"]) {
            evalSetterDict[setter] = obj["SETTERPLUGINS"][setter];
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
            try {
                eval(obj["BLOCKPLUGINS"][block]);
            } catch (e) {
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
            evalParameterDict[parameter] = obj["PARAMETERPLUGINS"][parameter];
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
            evalOnStartList[arg] = obj["ONSTART"][arg];
        }
    }

    // Code to execute when turtle code is stopped
    if ("ONSTOP" in obj) {
        for (const arg in obj["ONSTOP"]) {
            evalOnStopList[arg] = obj["ONSTOP"][arg];
        }
    }

    for (const protoblock in blocks.protoBlockDict) {
        try {
            // Push the protoblocks onto their palettes.
            if (blocks.protoBlockDict[protoblock].palette === undefined) {
                console.debug("Cannot find palette for protoblock " + protoblock);
            } else if (blocks.protoBlockDict[protoblock].palette === null) {
                console.debug("Cannot find palette for protoblock " + protoblock);
            } else {
                blocks.protoBlockDict[protoblock].palette.add(blocks.protoBlockDict[protoblock]);
            }
        } catch (e) {
            console.debug(e);
        }
    }

    console.debug("updating palette " + name);
    palettes.updatePalettes(name);

    setTimeout(() => {
        palettes.show();
    }, 2000);

    // Return the object in case we need to save it to local storage.
    return obj;
}

function updatePluginObj(obj) {
    for (const name in obj["PALETTEPLUGINS"]) {
        pluginObjs["PALETTEPLUGINS"][name] = obj["PALETTEPLUGINS"][name];
    }

    for (const name in obj["PALETTEFILLCOLORS"]) {
        pluginObjs["PALETTEFILLCOLORS"][name] = obj["PALETTEFILLCOLORS"][name];
    }

    for (const name in obj["PALETTESTROKECOLORS"]) {
        pluginObjs["PALETTESTROKECOLORS"][name] = obj["PALETTESTROKECOLORS"][name];
    }

    for (const name in obj["PALETTEHIGHLIGHTCOLORS"]) {
        pluginObjs["PALETTEHIGHLIGHTCOLORS"][name] = obj["PALETTEHIGHLIGHTCOLORS"][name];
    }

    for (const flow in obj["FLOWPLUGINS"]) {
        pluginObjs["FLOWPLUGINS"][flow] = obj["FLOWPLUGINS"][flow];
    }

    for (const arg in obj["ARGPLUGINS"]) {
        pluginObjs["ARGPLUGINS"][arg] = obj["ARGPLUGINS"][arg];
    }

    for (const block in obj["BLOCKPLUGINS"]) {
        pluginObjs["BLOCKPLUGINS"][block] = obj["BLOCKPLUGINS"][block];
    }

    if ("MACROPLUGINS" in obj) {
        for (const macro in obj["MACROPLUGINS"]) {
            pluginObjs["MACROPLUGINS"][macro] = obj["MACROPLUGINS"][macro];
        }
    }

    if ("GLOBALS" in obj) {
        if (!("GLOBALS" in pluginObjs)) {
            pluginObjs["GLOBALS"] = "";
        }
        pluginObjs["GLOBALS"] += obj["GLOBALS"];
    }

    if ("IMAGES" in obj) {
        pluginObjs["IMAGES"] = obj["IMAGES"];
    }

    for (const name in obj["ONLOAD"]) {
        pluginObjs["ONLOAD"][name] = obj["ONLOAD"][name];
    }

    for (const name in obj["ONSTART"]) {
        pluginObjs["ONSTART"][name] = obj["ONSTART"][name];
    }

    for (const name in obj["ONSTOP"]) {
        pluginObjs["ONSTOP"][name] = obj["ONSTOP"][name];
    }
}

function preparePluginExports(obj) {
    // add obj to plugin dictionary and return as JSON encoded text
    updatePluginObj(obj);

    return JSON.stringify(pluginObjs);
}

function processMacroData(macroData, palettes, blocks, macroDict) {
    // Macros are stored in a JSON-encoded dictionary.
    if (macroData !== "{}") {
        const obj = JSON.parse(macroData);
        palettes.add("myblocks", "black", "#a0a0a0");

        for (const name in obj) {
            console.debug("adding " + name + " to macroDict");
            macroDict[name] = obj[name];
            blocks.addToMyPalette(name, macroDict[name]);
        }

        palettes.makePalettes(1);
    }
}

function prepareMacroExports(name, stack, macroDict) {
    if (name !== null) {
        macroDict[name] = stack;
    }

    return JSON.stringify(macroDict);
}

// Some block-specific code

// Publish to FB
function doPublish(desc) {
    const url = doSave();
    console.debug("push " + url + " to FB");
    const descElem = docById("description");
    const msg = desc + " " + descElem.value + " " + url;
    console.debug("comment: " + msg);
    const post_cb = () => {
        FB.api("/me/feed", "post", {
            message: msg
        });
    };

    FB.login(post_cb, {
        scope: "publish_actions"
    });
}

// TODO: Move to camera plugin
let hasSetupCamera = false;
function doUseCamera(args, turtles, turtle, isVideo, cameraID, setCameraID, errorMsg) {
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
                console.debug("Could not connect to camera", error);
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
        (event) => {
            console.debug("canplay", streaming, hasSetupCamera);
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

    function draw() {
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(video, 0, 0, w, h);
        const data = canvas.toDataURL("image/png");
        turtles.turtleList[turtle].doShowImage(args[0], data);
    }
}

function doStopVideoCam(cameraID, setCameraID) {
    if (cameraID !== null) {
        window.clearInterval(cameraID);
    }

    setCameraID(null);
    document.querySelector("#camVideo").pause();
}

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

function displayMsg(blocks, text) {
    /*
    let msgContainer = blocks.msgText.parent;
    msgContainer.visible = true;
    blocks.msgText.text = text;
    msgContainer.updateCache();
    blocks.stage.setChildIndex(msgContainer, blocks.stage.getNumChildren() - 1);
    */
    return;
}

function safeSVG(label) {
    if (typeof label === "string") {
        return label.replace(/&/, "&amp;").replace(/</, "&lt;").replace(/>/, "&gt;");
    } else {
        return label;
    }
}

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

function mixedNumber(d) {
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
}

function LCD(a, b) {
    return Math.abs((a * b) / GCD(a, b));
}

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

function rationalSum(a, b) {
    if (a === 0 || b === 0) {
        console.debug("divide by zero?");
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
    const c0 = (a[0] * lcd) / a[1] + (b[0] * lcd) / b[1];
    return [(a[0] * lcd) / a[1] + (b[0] * lcd) / b[1], lcd];
}

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

function nearestBeat(d, b) {
    // Find the closest beat for a given fraction.

    let sum = 1 / (2 * b);
    let count = 0;
    const dd = d / 100;
    while (dd > sum) {
        sum += 1 / b;
        count += 1;
    }

    return [count, b];
}

function oneHundredToFraction(d) {
    // Generate some simple fractions based on a scale of 1-100

    if (d < 1) {
        return [1, 64];
    } else if (d > 99) {
        return [1, 1];
    }

    switch (Math.floor(d)) {
        case 1:
            return [1, 64];
            break;
        case 2:
            return [1, 48];
            break;
        case 3:
        case 4:
        case 5:
            return [1, 32];
            break;
        case 6:
        case 7:
        case 8:
            return [1, 16];
            break;
        case 9:
        case 10:
        case 11:
            return [1, 12];
            break;
        case 12:
        case 13:
        case 14:
            return [1, 8];
            break;
        case 15:
        case 16:
        case 17:
            return [1, 6];
            break;
        case 18:
        case 19:
            return [3, 16];
            break;
        case 20:
        case 21:
        case 22:
            return [1, 5];
            break;
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 28:
        case 29:
            return [1, 4];
            break;
        case 30:
        case 31:
            return [5, 16];
            break;
        case 32:
        case 33:
        case 34:
        case 35:
            return [1, 3];
            break;
        case 36:
        case 37:
        case 38:
        case 39:
            return [3, 8];
            break;
        case 40:
        case 41:
            return [2, 5];
            break;
        case 42:
        case 43:
        case 44:
            return [7, 16];
            break;
        case 45:
        case 46:
        case 47:
            return [15, 32];
            break;
        case 48:
        case 49:
        case 50:
        case 51:
        case 52:
            return [1, 2];
            break;
        case 53:
        case 54:
            return [17, 32];
            break;
        case 56:
        case 57:
        case 58:
            return [9, 16];
            break;
        case 59:
        case 60:
        case 61:
            return [3, 5];
            break;
        case 62:
        case 63:
        case 64:
        case 65:
            return [5, 8];
            break;
        case 66:
        case 67:
            return [2, 3];
            break;
        case 68:
        case 69:
        case 70:
            return [11, 16];
            break;
        case 71:
        case 72:
        case 73:
        case 74:
            return [23, 32];
            break;
        case 75:
        case 76:
        case 77:
        case 78:
        case 79:
        case 80:
            return [3, 4];
            break;
        case 81:
        case 82:
            return [13, 16];
            break;
        case 83:
        case 84:
        case 85:
        case 86:
            return [5, 6];
            break;
        case 87:
        case 88:
        case 89:
        case 90:
            return [7, 8];
            break;
        case 91:
        case 92:
            return [11, 12];
            break;
        case 93:
        case 94:
        case 95:
            return [15, 16];
            break;
        case 96:
        case 98:
            return [31, 32];
            break;
        case 98:
            return [63, 64];
            break;
        default:
            return [d, 100];

            break;
    }
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        }
        : null;
}

/**
 * Converts hexcode to rgb.
 *
 * @param {Number} hex - hexcode
 * @returns {String} - rgb values of hexcode + alpha which is 1
 */
function hex2rgb(hex) {
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return "rgba(" + r + "," + g + "," + b + ",1)";
}

function delayExecution(duration) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, duration);
    });
}

function closeWidgets() {
    window.widgetWindows.hideAllWindows();
}

function closeBlkWidgets(name) {
    const widgetTitle = document.getElementsByClassName("wftTitle");
    for (let i = 0; i < widgetTitle.length; i++) {
        if (widgetTitle[i].innerHTML === name) {
            window.widgetWindows.hideWindow(widgetTitle[i].innerHTML);
            break;
        }
    }
}

/**
 * Adds methods and variables of model and view objects to controller
 * object (which in turn acts as the entire component).
 *
 * Call this function from the constructor of the controller class
 * passing its self object ('this').
 *
 * @param {Object} obj - component object (controller) to which member
 * of its model and view are to be imported
 * @param {String} className - used for adding members of JS based MB API classes
 * @param {*[]} modelArgs - constructor arguments for model
 * @param {*[]} viewArgs - constructor arguments for view
 * @returns {void}
 */
function importMembers(obj, className, modelArgs, viewArgs) {
    /**
     * Adds methods and variables of one class, to another class' instance.
     *
     * @param {Object} obj - object of component (controller)
     * @param {Function} ctype - static class type (model or view)
     * @param {*[]} args - array of constructor arguments
     * @returns {void}
     */
    const addMembers = (obj, ctype, args) => {
        // If class type doesn't exist (no model class or no view class)
        if (ctype === undefined) {
            return;
        }

        // Add class type's instance to adding object
        if (args === undefined || args === []) {
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
}
