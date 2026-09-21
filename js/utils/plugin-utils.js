// Copyright (c) 2014-25 Walter Bender
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

   platformColor, i18next
*/

if (typeof module !== "undefined" && module.exports) {
    var UtilsLogic =
        (typeof window !== "undefined" && window.UtilsLogic) ||
        (typeof require !== "undefined" ? require("./utils-logic") : {});
    var { isUnsafeObjectKey } = UtilsLogic;
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

        // Fix for Chrome CSP which blocks Function("return this")() typically found in webpack bundles
        code = code.replace(
            /(?:new\s+)?Function\s*\(\s*['"]return this['"]\s*\)\s*\(\)/g,
            "window"
        );

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
        for (const name of Object.keys(obj["PALETTEPLUGINS"])) {
            if (isUnsafeObjectKey(name)) continue;
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
        for (const blkName of Object.keys(obj["IMAGES"])) {
            if (isUnsafeObjectKey(blkName)) continue;
            activity.pluginsImages[blkName] = obj["IMAGES"][blkName];
        }
    }

    // Populate the flow-block dictionary, i.e., the code that is
    // compiled into a function for hot-path execution.
    if ("FLOWPLUGINS" in obj) {
        for (const flow of Object.keys(obj["FLOWPLUGINS"])) {
            if (isUnsafeObjectKey(flow)) continue;
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
        for (const arg of Object.keys(obj["ARGPLUGINS"])) {
            if (isUnsafeObjectKey(arg)) continue;
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
        for (const macro of Object.keys(obj["MACROPLUGINS"])) {
            if (isUnsafeObjectKey(macro)) continue;
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
        for (const setter of Object.keys(obj["SETTERPLUGINS"])) {
            if (isUnsafeObjectKey(setter)) continue;
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
    if ("BLOCKPLUGINS" in obj) {
        for (const block of Object.keys(obj["BLOCKPLUGINS"])) {
            if (isUnsafeObjectKey(block)) continue;
            console.debug("adding plugin block " + block);
            safeEval(obj["BLOCKPLUGINS"][block], "BLOCKPLUGINS:" + block);
        }
    }

    // Create the globals.
    if ("GLOBALS" in obj) {
        safeEval(obj["GLOBALS"], "GLOBALS");
    }

    if ("PARAMETERPLUGINS" in obj) {
        for (const parameter of Object.keys(obj["PARAMETERPLUGINS"])) {
            if (isUnsafeObjectKey(parameter)) continue;
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
        for (const arg of Object.keys(obj["ONLOAD"])) {
            if (isUnsafeObjectKey(arg)) continue;
            safeEval(obj["ONLOAD"][arg], "ONLOAD:" + arg);
        }
    }

    // Code to execute when turtle code is started
    if ("ONSTART" in obj) {
        for (const arg of Object.keys(obj["ONSTART"])) {
            if (isUnsafeObjectKey(arg)) continue;
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
        for (const arg of Object.keys(obj["ONSTOP"])) {
            if (isUnsafeObjectKey(arg)) continue;
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
                const err = new Error(
                    "Failed to load plugin script" + (e && e.message ? ": " + e.message : "")
                );
                console.error("Failed to load CSP Blob script for plugins", err);
                reject(err);
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
    window.__mb_plugin_registry = window.__mb_plugin_registry || {};
    for (const item of pendingSafeEvals) {
        const registryName = `setup_${item.label.replace(/[^a-zA-Z0-9]/g, "_")}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        const setupScript = `
window.__mb_plugin_registry = window.__mb_plugin_registry || {};
window.__mb_plugin_registry["${registryName}"] = function(activity, globalActivity) {
    ${item.code}
};
`;
        const sBlob = new Blob([setupScript], { type: "application/javascript" });
        const sUrl = URL.createObjectURL(sBlob);
        const sScript = document.createElement("script");
        sScript.src = sUrl;
        await new Promise((resolve, reject) => {
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
                if (sScript.parentNode) {
                    sScript.parentNode.removeChild(sScript);
                }
                resolve();
            };
            sScript.onerror = e => {
                URL.revokeObjectURL(sUrl);
                if (sScript.parentNode) {
                    sScript.parentNode.removeChild(sScript);
                }
                const err = new Error(
                    "Failed to execute plugin script" + (e && e.message ? ": " + e.message : "")
                );
                reject(err);
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

    if ("PALETTEPLUGINS" in obj) {
        for (const name of Object.keys(obj["PALETTEPLUGINS"])) {
            if (isUnsafeObjectKey(name)) continue;
            activity.pluginObjs["PALETTEPLUGINS"][name] = obj["PALETTEPLUGINS"][name];
        }
    }

    if ("PALETTEFILLCOLORS" in obj) {
        for (const name of Object.keys(obj["PALETTEFILLCOLORS"])) {
            if (isUnsafeObjectKey(name)) continue;
            activity.pluginObjs["PALETTEFILLCOLORS"][name] = obj["PALETTEFILLCOLORS"][name];
        }
    }

    if ("PALETTESTROKECOLORS" in obj) {
        for (const name of Object.keys(obj["PALETTESTROKECOLORS"])) {
            if (isUnsafeObjectKey(name)) continue;
            activity.pluginObjs["PALETTESTROKECOLORS"][name] = obj["PALETTESTROKECOLORS"][name];
        }
    }

    if ("PALETTEHIGHLIGHTCOLORS" in obj) {
        for (const name of Object.keys(obj["PALETTEHIGHLIGHTCOLORS"])) {
            if (isUnsafeObjectKey(name)) continue;
            activity.pluginObjs["PALETTEHIGHLIGHTCOLORS"][name] =
                obj["PALETTEHIGHLIGHTCOLORS"][name];
        }
    }

    if ("FLOWPLUGINS" in obj) {
        for (const flow of Object.keys(obj["FLOWPLUGINS"])) {
            if (isUnsafeObjectKey(flow)) continue;
            activity.pluginObjs["FLOWPLUGINS"][flow] = obj["FLOWPLUGINS"][flow];
        }
    }

    if ("ARGPLUGINS" in obj) {
        for (const arg of Object.keys(obj["ARGPLUGINS"])) {
            if (isUnsafeObjectKey(arg)) continue;
            activity.pluginObjs["ARGPLUGINS"][arg] = obj["ARGPLUGINS"][arg];
        }
    }

    if ("BLOCKPLUGINS" in obj) {
        for (const block of Object.keys(obj["BLOCKPLUGINS"])) {
            if (isUnsafeObjectKey(block)) continue;
            activity.pluginObjs["BLOCKPLUGINS"][block] = obj["BLOCKPLUGINS"][block];
        }
    }

    if ("MACROPLUGINS" in obj) {
        for (const macro of Object.keys(obj["MACROPLUGINS"])) {
            if (isUnsafeObjectKey(macro)) continue;
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

    if ("ONLOAD" in obj) {
        for (const name of Object.keys(obj["ONLOAD"])) {
            if (isUnsafeObjectKey(name)) continue;
            activity.pluginObjs["ONLOAD"][name] = obj["ONLOAD"][name];
        }
    }

    if ("ONSTART" in obj) {
        for (const name of Object.keys(obj["ONSTART"])) {
            if (isUnsafeObjectKey(name)) continue;
            activity.pluginObjs["ONSTART"][name] = obj["ONSTART"][name];
        }
    }

    if ("ONSTOP" in obj) {
        for (const name of Object.keys(obj["ONSTOP"])) {
            if (isUnsafeObjectKey(name)) continue;
            activity.pluginObjs["ONSTOP"][name] = obj["ONSTOP"][name];
        }
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

if (typeof window !== "undefined" && (typeof module === "undefined" || !module.exports)) {
    window.PluginUtils = {
        processPluginData,
        processRawPluginData,
        updatePluginObj,
        preparePluginExports
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        processPluginData,
        processRawPluginData,
        updatePluginObj,
        preparePluginExports
    };
}
