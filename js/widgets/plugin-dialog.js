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

/* global _, define, platformColor */

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
     * Creates a backdrop overlay behind the modal for focus.
     * Clicking the backdrop closes the modal.
     * @param {HTMLElement} modal - The modal element to close on backdrop click.
     * @returns {HTMLElement} The backdrop element.
     */
    _createBackdrop(modal) {
        const backdrop = document.createElement("div");
        backdrop.classList.add("plugin-modal-backdrop");
        backdrop.addEventListener("click", () => {
            this._closeModal(modal);
        });
        return backdrop;
    }

    /**
     * Creates and styles a select dropdown for use inside plugin modals.
     * Overrides the global select styles that target block-internal selects.
     * @returns {HTMLSelectElement} The styled select element.
     */
    _createModalSelect() {
        const select = document.createElement("select");
        select.classList.add("plugin-modal-select");
        return select;
    }

    /**
     * Mounts a modal and its backdrop to the document body, captures the previously
     * focused element for restoration on close, attaches an accessible keyboard trap,
     * and shifts initial focus to the specified interactive element.
     * @param {HTMLElement} modal - The modal element to mount.
     * @param {HTMLElement} backdrop - The backdrop overlay behind the modal.
     * @param {HTMLElement} [focusTarget] - The initial element to focus inside the modal.
     */
    _openModal(modal, backdrop, focusTarget) {
        modal._previouslyFocused =
            document.activeElement && typeof document.activeElement.focus === "function"
                ? document.activeElement
                : null;

        const onKeyDown = event => {
            if (!document.body.contains(modal)) {
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                event.stopImmediatePropagation();
                this._closeModal(modal);
                return;
            }

            if (event.key !== "Tab") {
                return;
            }

            const focusable = Array.from(
                modal.querySelectorAll(
                    'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            );
            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const index = focusable.indexOf(document.activeElement);
            if (event.shiftKey) {
                if (index <= 0) {
                    event.preventDefault();
                    focusable[focusable.length - 1].focus();
                }
            } else {
                if (index === focusable.length - 1 || index === -1) {
                    event.preventDefault();
                    focusable[0].focus();
                }
            }
        };

        modal._onKeyDown = onKeyDown;
        document.addEventListener("keydown", onKeyDown, true);

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);

        if (focusTarget && typeof focusTarget.focus === "function") {
            focusTarget.focus();
        } else if (typeof modal.focus === "function") {
            modal.focus();
        }
    }

    /**
     * Removes a modal and its backdrop from the DOM, detaches keyboard listeners,
     * and restores focus to the previously active element.
     * @param {HTMLElement} modal - The modal element.
     */
    _closeModal(modal) {
        if (!modal) return;

        if (modal._onKeyDown) {
            document.removeEventListener("keydown", modal._onKeyDown, true);
            modal._onKeyDown = null;
        }

        const backdrop = modal._backdrop;
        if (backdrop && backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
        }

        if (
            modal._previouslyFocused &&
            typeof modal._previouslyFocused.focus === "function" &&
            document.contains(modal._previouslyFocused)
        ) {
            modal._previouslyFocused.focus();
            modal._previouslyFocused = null;
        }
    }

    /**
     * Triggers the user flow to load a plugin.
     * Shows a modal asking for a built-in plugin name or triggers file upload if blank.
     */
    openPlugin() {
        if (document.getElementById("open-plugin-modal")) return;
        const modal = document.createElement("div");
        modal.classList.add("modalBox");
        modal.id = "open-plugin-modal";
        modal.tabIndex = -1;
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "open-plugin-title");
        modal.setAttribute("aria-describedby", "open-plugin-message");

        const backdrop = this._createBackdrop(modal);
        modal._backdrop = backdrop;

        const title = document.createElement("h2");
        title.id = "open-plugin-title";
        title.textContent = _("Load Plugin");
        title.classList.add("modal-title");
        modal.appendChild(title);

        const message = document.createElement("p");
        message.id = "open-plugin-message";
        message.textContent = _("Select a built-in plugin to load, or upload a local file.");
        message.classList.add("modal-message");
        modal.appendChild(message);

        const select = this._createModalSelect();
        const builtIns = ["", "accelerometer", "facebook", "maths", "nutrition", "rodi", "weather"];
        builtIns.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name === "" ? _("Choose built-in plugin...") : name;
            select.appendChild(option);
        });
        modal.appendChild(select);

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("plugin-modal-actions");

        const leftGroup = document.createElement("div");

        const uploadBtn = document.createElement("button");
        uploadBtn.textContent = _("Upload File");
        uploadBtn.classList.add("plugin-upload-button");
        uploadBtn.addEventListener("click", () => {
            this._closeModal(modal);
            if (this.pluginChooser) {
                this.pluginChooser.click();
            }
        });
        leftGroup.appendChild(uploadBtn);

        const rightGroup = document.createElement("div");
        rightGroup.classList.add("plugin-modal-right-actions");

        const loadBtn = document.createElement("button");
        loadBtn.textContent = _("Load");
        loadBtn.classList.add("confirm-button");
        loadBtn.addEventListener("click", () => {
            const val = select.value;
            if (val !== "") {
                this._closeModal(modal);
                if (typeof this.options.onLoadBuiltIn === "function") {
                    this.options.onLoadBuiltIn(val);
                }
            }
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = _("Cancel");
        cancelBtn.classList.add("cancel-button");
        cancelBtn.addEventListener("click", () => {
            this._closeModal(modal);
        });

        rightGroup.appendChild(loadBtn);
        rightGroup.appendChild(cancelBtn);

        buttonContainer.appendChild(leftGroup);
        buttonContainer.appendChild(rightGroup);

        modal.appendChild(buttonContainer);
        this._openModal(modal, backdrop, select);
    }

    deletePlugin() {
        if (document.getElementById("delete-plugin-confirm")) return;

        const loadedPlugins =
            typeof this.options.getLoadedPlugins === "function"
                ? this.options.getLoadedPlugins()
                : [];
        if (loadedPlugins.length === 0) {
            this._showNoPluginsMessage();
            return;
        }

        const modal = document.createElement("div");
        modal.classList.add("modalBox");
        modal.id = "delete-plugin-confirm";
        modal.tabIndex = -1;
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "delete-plugin-title");
        modal.setAttribute("aria-describedby", "delete-plugin-message");

        const backdrop = this._createBackdrop(modal);
        modal._backdrop = backdrop;

        const title = document.createElement("h2");
        title.id = "delete-plugin-title";
        title.textContent = _("Delete Plugin");
        title.classList.add("modal-title");
        modal.appendChild(title);

        const message = document.createElement("p");
        message.id = "delete-plugin-message";
        message.textContent = _("Select the plugin you want to delete:");
        message.classList.add("modal-message");
        modal.appendChild(message);

        const select = this._createModalSelect();
        loadedPlugins.forEach(name => {
            const option = document.createElement("option");
            option.value = name;
            option.textContent = name;
            select.appendChild(option);
        });

        // If there is an active plugin passed via options, pre-select it
        if (typeof this.options.getActivePlugin === "function") {
            const active = this.options.getActivePlugin();
            if (active && loadedPlugins.includes(active)) {
                select.value = active;
            }
        }
        modal.appendChild(select);

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("clear-button-container");

        const confirmBtn = document.createElement("button");
        confirmBtn.textContent = _("Delete");
        confirmBtn.classList.add("confirm-button");
        confirmBtn.addEventListener("click", () => {
            const val = select.value;
            this._closeModal(modal);
            if (val && typeof this.options.onDelete === "function") {
                this.options.onDelete(val);
            }
        });

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = _("Cancel");
        cancelBtn.classList.add("cancel-button");
        cancelBtn.addEventListener("click", () => {
            this._closeModal(modal);
        });

        buttonContainer.appendChild(confirmBtn);
        buttonContainer.appendChild(cancelBtn);
        modal.appendChild(buttonContainer);
        this._openModal(modal, backdrop, select);
    }

    /**
     * Shows a brief informational modal when no plugins are available to delete.
     */
    _showNoPluginsMessage() {
        if (document.getElementById("no-plugins-msg")) return;

        const modal = document.createElement("div");
        modal.classList.add("modalBox");
        modal.id = "no-plugins-msg";
        modal.tabIndex = -1;
        modal.setAttribute("role", "alertdialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "no-plugins-title");
        modal.setAttribute("aria-describedby", "no-plugins-message");

        const backdrop = this._createBackdrop(modal);
        modal._backdrop = backdrop;

        const title = document.createElement("h2");
        title.id = "no-plugins-title";
        title.textContent = _("Delete Plugin");
        title.classList.add("modal-title");
        modal.appendChild(title);

        const message = document.createElement("p");
        message.id = "no-plugins-message";
        message.textContent = _("No custom plugins are currently loaded.");
        message.classList.add("modal-message");
        modal.appendChild(message);

        const buttonContainer = document.createElement("div");
        buttonContainer.classList.add("clear-button-container");

        const okBtn = document.createElement("button");
        okBtn.textContent = _("OK");
        okBtn.classList.add("confirm-button");
        okBtn.addEventListener("click", () => {
            this._closeModal(modal);
        });

        buttonContainer.appendChild(okBtn);
        modal.appendChild(buttonContainer);
        this._openModal(modal, backdrop, okBtn);
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
