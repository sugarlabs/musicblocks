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
 * management to the Activity and the PluginController.
 */
class PluginDialog {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
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
                if (file) {
                    this.activity.handlePluginFileSelected(file);
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
        this.activity.toolbar.closeAuxToolbar((activity, resize) => {
            activity._showHideAuxMenu(resize);
        });

        const rawName = prompt(
            _("Enter the name of a built-in plugin, or leave blank to upload a plugin file:")
        );
        if (rawName === null) {
            return; // User cancelled the operation
        }

        const name = rawName.trim().toLowerCase();
        if (name !== "") {
            // Validate: only allow safe characters (alphanumeric, hyphens, and underscores)
            // This prevents path traversal attacks like "../../secrets"
            if (!/^[a-z0-9\-_]+$/.test(name)) {
                alert(
                    _(
                        "Invalid plugin name. Only alphanumeric characters, hyphens, and underscores are allowed."
                    )
                );
                return;
            }
            this.activity._loadBuiltInPlugin(name);
        } else {
            if (this.pluginChooser) {
                this.pluginChooser.focus();
                this.pluginChooser.click();
            }
        }
    }

    /**
     * Triggers the user flow to delete a plugin.
     */
    deletePlugin() {
        this.activity._deletePlugin();
    }
}

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.PluginDialog = PluginDialog;
        return { PluginDialog };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { PluginDialog };
}
