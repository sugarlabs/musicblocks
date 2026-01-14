// Copyright (c) 2026 Music Blocks Contributors
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
   global _, docById, M
*/

/*
   exported VersionControlUI
*/

/**
 * Class representing the Version Control UI.
 * Provides a modal interface for managing project versions.
 * @class
 */
class VersionControlUI {
    /**
     * Creates an instance of VersionControlUI.
     * @constructor
     * @param {Object} activity - The main activity object.
     */
    constructor(activity) {
        this.activity = activity;
        this.versionStorage = null;
        this.modal = null;
        this.isOpen = false;
    }

    /**
     * Initialize the UI with the version storage instance.
     * @param {VersionControlStorage} versionStorage - The storage instance.
     */
    init(versionStorage) {
        this.versionStorage = versionStorage;
        this._setupModal();
        this._bindEvents();
    }

    /**
     * Setup the modal HTML structure.
     * @private
     */
    _setupModal() {
        this.modal = docById("versionControlModal");
        if (!this.modal) {
            // eslint-disable-next-line no-console
            console.error("VersionControlUI: Modal element not found");
        }
    }

    /**
     * Bind event handlers.
     * @private
     */
    _bindEvents() {
        // Close button
        const closeBtn = this.modal?.querySelector(".close");
        if (closeBtn) {
            closeBtn.onclick = () => this.close();
        }

        // Save version button
        const saveBtn = docById("saveVersionBtn");
        if (saveBtn) {
            saveBtn.onclick = () => this._handleSaveVersion();
        }

        // Clear all button
        const clearBtn = docById("clearAllVersionsBtn");
        if (clearBtn) {
            clearBtn.onclick = () => this._handleClearAllVersions();
        }

        // Close on outside click
        window.addEventListener("click", (event) => {
            if (event.target === this.modal) {
                this.close();
            }
        });

        // Close on escape key
        window.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.isOpen) {
                this.close();
            }
        });
    }

    /**
     * Open the version control modal.
     */
    async open() {
        if (!this.modal) return;

        // Clear the description input
        const descInput = docById("versionDescription");
        if (descInput) {
            descInput.value = "";
        }

        // Render the version list
        await this._renderVersionList();

        // Show the modal
        this.modal.style.display = "block";
        this.modal.showModal();
        this.isOpen = true;
    }

    /**
     * Close the version control modal.
     */
    close() {
        if (!this.modal) return;

        this.modal.style.display = "none";
        this.modal.close();
        this.isOpen = false;
    }

    /**
     * Show a toast notification.
     * @param {string} message - The message to display.
     * @param {string} [type=""] - Optional CSS class for styling.
     */
    _showToast(message, type = "") {
        if (typeof M !== "undefined" && M.toast) {
            M.toast({ html: message, classes: type });
        } else {
            // Fallback if Materialize is not available
            // eslint-disable-next-line no-console
            console.log("Toast:", message);
        }
    }

    /**
     * Format a timestamp for display.
     * @param {number} timestamp - Unix timestamp in milliseconds.
     * @returns {string} Formatted date/time string.
     */
    _formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const options = {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        };
        return date.toLocaleDateString(undefined, options);
    }

    /**
     * Render the version list in the modal.
     * @private
     */
    async _renderVersionList() {
        const container = docById("versionList");
        if (!container || !this.versionStorage) return;

        const versions = await this.versionStorage.getVersions();

        if (versions.length === 0) {
            container.innerHTML = `
                <div class="version-empty">
                    <i class="material-icons">info_outline</i>
                    <p>${_("No versions saved yet")}</p>
                    <p class="version-hint">${_("Save a version to create a snapshot of your project")}</p>
                </div>
            `;
            return;
        }

        let html = "";
        versions.forEach((version, index) => {
            const isLatest = index === 0;
            html += `
                <div class="version-item ${isLatest ? "version-latest" : ""}" data-version-id="${version.id}">
                    <div class="version-info">
                        <div class="version-header">
                            <span class="version-number">${_("Version")} ${versions.length - index}</span>
                            ${isLatest ? `<span class="version-badge">${_("Latest")}</span>` : ""}
                        </div>
                        <div class="version-description">${version.description || _("No description")}</div>
                        <div class="version-timestamp">
                            <i class="material-icons tiny">access_time</i>
                            ${this._formatTimestamp(version.timestamp)}
                        </div>
                    </div>
                    <div class="version-actions">
                        <button class="version-btn restore-btn" title="${_("Restore this version")}" data-action="restore" data-version-id="${version.id}">
                            <i class="material-icons">restore</i>
                        </button>
                        <button class="version-btn delete-btn" title="${_("Delete this version")}" data-action="delete" data-version-id="${version.id}">
                            <i class="material-icons">delete</i>
                        </button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Bind action buttons
        container.querySelectorAll("[data-action]").forEach(btn => {
            btn.onclick = (e) => {
                const action = btn.dataset.action;
                const versionId = btn.dataset.versionId;
                if (action === "restore") {
                    this._handleRestoreVersion(versionId);
                } else if (action === "delete") {
                    this._handleDeleteVersion(versionId);
                }
            };
        });
    }

    /**
     * Handle save version button click.
     * @private
     */
    async _handleSaveVersion() {
        const descInput = docById("versionDescription");
        const description = descInput ? descInput.value.trim() : "";

        try {
            await this.versionStorage.saveVersion(description);
            this._showToast(_("Version saved successfully"), "green");

            // Clear input and refresh list
            if (descInput) descInput.value = "";
            await this._renderVersionList();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Failed to save version:", error);
            this._showToast(_("Failed to save version"), "red");
        }
    }

    /**
     * Handle restore version button click.
     * @param {string} versionId - The version ID to restore.
     * @private
     */
    async _handleRestoreVersion(versionId) {
        const confirmed = confirm(
            _("Are you sure you want to restore this version?") + "\n\n" +
            _("Your current work will be saved as a backup before restoring.")
        );

        if (!confirmed) return;

        try {
            const version = await this.versionStorage.restoreVersion(versionId);
            this._showToast(_("Version restored successfully"), "green");

            // Close modal and reload the project
            this.close();

            // Trigger project reload
            if (this.activity && this.activity.doLoadAnimation) {
                this.activity.doLoadAnimation();
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Failed to restore version:", error);
            this._showToast(_("Failed to restore version"), "red");
        }
    }

    /**
     * Handle delete version button click.
     * @param {string} versionId - The version ID to delete.
     * @private
     */
    async _handleDeleteVersion(versionId) {
        const confirmed = confirm(_("Are you sure you want to delete this version?"));

        if (!confirmed) return;

        try {
            await this.versionStorage.deleteVersion(versionId);
            this._showToast(_("Version deleted"), "orange");
            await this._renderVersionList();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Failed to delete version:", error);
            this._showToast(_("Failed to delete version"), "red");
        }
    }

    /**
     * Handle clear all versions button click.
     * @private
     */
    async _handleClearAllVersions() {
        const confirmed = confirm(
            _("Are you sure you want to delete ALL versions?") + "\n\n" +
            _("This action cannot be undone.")
        );

        if (!confirmed) return;

        try {
            await this.versionStorage.deleteAllVersions();
            this._showToast(_("All versions deleted"), "orange");
            await this._renderVersionList();
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("Failed to clear versions:", error);
            this._showToast(_("Failed to clear versions"), "red");
        }
    }
}

// Export for use in browser and tests
if (typeof module !== "undefined" && module.exports) {
    module.exports = { VersionControlUI };
}
