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

/* global debugLog, processPluginData, processRawPluginData, preparePluginExports, updatePluginObj, safeJSONParse */

/* exported setupPluginController, PluginController */

/**
 * Manages the plugin lifecycle for Music Blocks.
 *
 * Owns: plugin state initialization, storage persistence, XHR/file
 * loading, and storage-level deletion.
 *
 * Does NOT own: UI dialogs, palette refresh, toolbar callbacks,
 * loading cursors, or user-facing messages. Those remain in activity.js.
 */
class PluginController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
    }

    // -------------------------------------------------------------------------
    // State initialization
    // -------------------------------------------------------------------------

    /**
     * Resets the plugin object registry and image cache on the Activity instance.
     * Called once from doPluginsAndPaletteCols() during startup and on reset.
     */
    initializePluginState() {
        this.activity.pluginObjs = {
            PALETTEPLUGINS: {},
            PALETTEFILLCOLORS: {},
            PALETTESTROKECOLORS: {},
            PALETTEHIGHLIGHTCOLORS: {},
            FLOWPLUGINS: {},
            ARGPLUGINS: {},
            BLOCKPLUGINS: {},
            MACROPLUGINS: {},
            ONLOAD: {},
            ONSTART: {},
            ONSTOP: {}
        };
        this.activity.pluginsImages = {};
    }

    // -------------------------------------------------------------------------
    // Startup persistence loading
    // -------------------------------------------------------------------------

    /**
     * Loads and registers plugins persisted in localStorage.
     * Must be called after initBasicProtoBlocks() so that proto-block
     * infrastructure exists before plugins attempt to register blocks.
     * @returns {Promise<void>}
     */
    async loadStoredPlugins() {
        const pluginData = this.activity.storage.plugins;
        if (pluginData !== null && pluginData !== "null" && pluginData !== undefined) {
            const obj = await processPluginData(this.activity, pluginData, "localStorage:plugins");
            if (obj !== null && obj !== undefined) {
                updatePluginObj(this.activity, obj);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Runtime plugin loading
    // -------------------------------------------------------------------------

    /**
     * Fetches a built-in plugin by name via XHR, processes it, and persists it.
     * Resolves true on success, false on an HTTP error.
     * Palette refresh is the caller's responsibility (kept in activity.js).
     * @param {string} name - Plugin name (alphanumeric, hyphens, underscores only).
     * @returns {Promise<boolean>}
     */
    loadBuiltInPluginFromXHR(name) {
        const activity = this.activity;
        const url = "plugins/" + name + ".json";
        return new Promise(resolve => {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, true);
            xhr.onload = async () => {
                if (xhr.status === 200) {
                    const obj = await processRawPluginData(activity, xhr.responseText, url);
                    if (obj !== null && obj !== undefined) {
                        activity.storage.plugins = preparePluginExports(activity, obj);
                    }
                    resolve(true);
                } else {
                    resolve(false);
                }
            };
            xhr.onerror = () => resolve(false);
            xhr.onabort = () => resolve(false);
            xhr.send();
        });
    }

    /**
     * Processes raw plugin JSON content (from a file upload), registers the
     * plugin, and persists it to localStorage.
     * Palette refresh is the caller's responsibility (kept in activity.js).
     * @param {string} rawContent - Raw plugin JSON string from FileReader.
     * @param {string} source - Descriptive label for error reporting (e.g. "file:weather.json").
     * @returns {Promise<void>}
     */
    async loadPluginFromFileContent(rawContent, source) {
        const obj = await processRawPluginData(this.activity, rawContent, source);
        if (obj !== null && obj !== undefined) {
            this.activity.storage.plugins = preparePluginExports(this.activity, obj);
        }
    }

    // -------------------------------------------------------------------------
    // Storage-level deletion
    // -------------------------------------------------------------------------

    /**
     * Removes all localStorage entries for the given plugin palette.
     * Does NOT modify activity.palettes, emit UI messages, or trigger redraws.
     * @param {string} paletteName - The name of the palette being deleted.
     * @param {Array<{name: string}>} protoList - The palette's protoList
     *   (from palettes.dict[paletteName].protoList), used to remove per-block keys.
     * @returns {boolean} True if storage was updated; false if no stored plugin data found.
     */
    deletePluginFromStorage(paletteName, protoList) {
        const obj = safeJSONParse(this.activity.storage.plugins);
        if (!obj) return false;

        if (obj["PALETTEPLUGINS"] && paletteName in obj["PALETTEPLUGINS"]) {
            delete obj["PALETTEPLUGINS"][paletteName];
        }
        if (obj["PALETTEFILLCOLORS"] && paletteName in obj["PALETTEFILLCOLORS"]) {
            delete obj["PALETTEFILLCOLORS"][paletteName];
        }
        if (obj["PALETTESTROKECOLORS"] && paletteName in obj["PALETTESTROKECOLORS"]) {
            delete obj["PALETTESTROKECOLORS"][paletteName];
        }
        if (obj["PALETTEHIGHLIGHTCOLORS"] && paletteName in obj["PALETTEHIGHLIGHTCOLORS"]) {
            delete obj["PALETTEHIGHLIGHTCOLORS"][paletteName];
        }

        for (let i = 0; i < protoList.length; i++) {
            const name = protoList[i]["name"];
            if (obj["FLOWPLUGINS"] && name in obj["FLOWPLUGINS"]) {
                debugLog("deleting " + name);
                delete obj["FLOWPLUGINS"][name];
            }
            if (obj["BLOCKPLUGINS"] && name in obj["BLOCKPLUGINS"]) {
                debugLog("deleting " + name);
                delete obj["BLOCKPLUGINS"][name];
            }
            if (obj["ARGPLUGINS"] && name in obj["ARGPLUGINS"]) {
                debugLog("deleting " + name);
                delete obj["ARGPLUGINS"][name];
            }
        }

        if (obj["MACROPLUGINS"] && paletteName in obj["MACROPLUGINS"]) {
            delete obj["MACROPLUGINS"][paletteName];
        }
        if (obj["ONLOAD"] && paletteName in obj["ONLOAD"]) {
            delete obj["ONLOAD"][paletteName];
        }
        if (obj["ONSTART"] && paletteName in obj["ONSTART"]) {
            delete obj["ONSTART"][paletteName];
        }
        if (obj["ONSTOP"] && paletteName in obj["ONSTOP"]) {
            delete obj["ONSTOP"][paletteName];
        }

        this.activity.storage.plugins = JSON.stringify(obj);
        return true;
    }
}

/**
 * Attaches a PluginController instance to the activity.
 * Called once from the Activity constructor, before setupDependencies().
 * @param {object} activity - The Activity instance.
 */
const setupPluginController = activity => {
    const controller = new PluginController(activity);
    activity.pluginController = controller;
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupPluginController = setupPluginController;
        return { setupPluginController, PluginController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupPluginController, PluginController };
}
