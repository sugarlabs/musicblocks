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

/* global _, define */

/* exported PluginDialog */

/**
 * Manages the UI dialog and interactions for plugins in Music Blocks.
 *
 * Owns: prompt/modal dialogs, user message interactions, file input element,
 * and user gesture handling (click/change) for loading and deleting plugins.
 *
 * Delegates: file reading, loading indicators, palette refreshes, and state/storage
 * management to the Activity and the PluginController via callbacks.
 */
class PluginDialog {
    /**
     * @param {object} options - Callbacks and option settings.
     * @param {Function} options.onLoadBuiltIn - Called to load a built-in plugin by name.
     * @param {Function} options.onDelete - Called to delete the active plugin.
     * @param {Function} options.onFileSelected - Called when a plugin file is selected.
     * @param {Function} options.closeAuxToolbar - Callback to close the auxiliary toolbar.
     * @param {Function} options.showHideAuxMenu - Callback to resize/hide the auxiliary menu.
     */
    constructor(options) {
        this.options = options || {};
        this.pluginChooser = document.getElementById("myOpenPlugin");
        this.setupEventListeners();
    }

    /**
     * Sets up click and change event listeners on the file chooser input element.
     */
    setupEventListeners() {
        if (!this.pluginChooser) {
            return;
        }

        this.pluginChooser.addEventListener("click", event => {
            window.scroll(0, 0);
            event.currentTarget.value = "";
        });

        this.pluginChooser.addEventListener(
            "change",
            () => {
                window.scroll(0, 0);
                const file = this.pluginChooser.files[0];
                if (file && typeof this.options.onFileSelected === "function") {
                    this.options.onFileSelected(file);
                }
            },
            false
        );
    }

    /**
     * Triggers the user flow to load a plugin.
     * Shows a prompt asking for a built-in plugin name or triggers file upload if blank.
     */
    openPlugin() {
        if (typeof this.options.closeAuxToolbar === "function") {
            this.options.closeAuxToolbar(this.options.showHideAuxMenu);
        }

        const rawName = prompt(
            _("Enter the name of a built-in plugin, or leave blank to upload a plugin file:")
        );
        if (rawName === null) {
            return; // User cancelled the operation
        }

        const name = rawName.trim().toLowerCase();
        if (name !== "") {
            if (typeof this.options.onLoadBuiltIn === "function") {
                this.options.onLoadBuiltIn(name);
            }
        } else {
            if (this.pluginChooser) {
                this.pluginChooser.click();
            }
        }
    }

    /**
     * Triggers the user flow to delete a plugin.
     */
    deletePlugin() {
        if (typeof this.options.onDelete === "function") {
            this.options.onDelete();
        }
    }
}

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        return { PluginDialog };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { PluginDialog };
}
