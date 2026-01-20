
/*
   global

   jQuery, _, Materialize
*/
/*
   exported

   VersionControl
*/

class VersionControl {
    constructor(Planet) {
        this.Planet = Planet;
        this.currentVersions = [];
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'success', 'error', 'warning'
     */
    showToast(message, type = 'success') {
        const className = type === 'error' ? 'red' : type === 'warning' ? 'orange' : 'green';
        Materialize.toast(message, 3000, className);
    }

    /**
     * Initialize the version control UI
     */
    init() {
        this.initSaveVersionButton();
        this.initVersionHistoryModal();
    }

    /**
     * Initialize save version button handler
     */
    initSaveVersionButton() {
        const saveBtn = document.getElementById("version-save-btn");
        if (!saveBtn) return;

        saveBtn.addEventListener("click", () => {
            this.openSaveVersionModal();
        });
    }

    /**
     * Open modal to save a new version
     */
    openSaveVersionModal() {
        const description = prompt(_("Enter version description (optional):"));
        if (description === null) return; // User cancelled

        this.saveVersion(description || null);
    }

    /**
     * Save current project state as a version
     * @param {string} description - Version description
     */
    async saveVersion(description) {
        try {
            console.log("Saving version with description:", description); // Debug
            const versionId = await this.Planet.ProjectStorage.saveVersion(description);
            console.log("Version saved with ID:", versionId); // Debug
            this.showToast(_("Version saved successfully!"), 'success');
            this.refreshVersionHistory();
        } catch (error) {
            console.error("Error saving version:", error); // Debug
            this.showToast(_("Failed to save version: ") + error.message, 'error');
        }
    }

    /**
     * Initialize version history modal
     */
    initVersionHistoryModal() {
        const t = this;

        document.getElementById("version-revert-btn").addEventListener("click", function() {
            const selectedVersion = document.querySelector('input[name="version-select"]:checked');
            if (!selectedVersion) {
                t.showToast(_("Please select a version to restore"), 'warning');
                return;
            }
            t.confirmRevert(selectedVersion.value);
        });

        document.getElementById("version-delete-btn").addEventListener("click", function() {
            const selectedVersion = document.querySelector('input[name="version-select"]:checked');
            if (!selectedVersion) {
                t.showToast(_("Please select a version to delete"), 'warning');
                return;
            }
            t.confirmDelete(selectedVersion.value);
        });

        document.getElementById("version-clear-btn").addEventListener("click", function() {
            t.confirmClearAll();
        });
    }

    /**
     * Open version history modal
     */
    openVersionHistory() {
        console.log("Opening version history modal"); // Debug
        this.refreshVersionHistory();
        
        const modalEl = document.getElementById("version-history-modal");
        console.log("Modal DOM element:", modalEl); // Debug
        
        if (!modalEl) {
            console.error("Modal element not found in DOM!");
            alert("Error: Version history modal not found. Please refresh the page.");
            return;
        }
        
        const modal = jQuery("#version-history-modal");
        modal.modal();
        modal.modal("open");
    }

    /**
     * Refresh version history list
     */
    refreshVersionHistory() {
        const versions = this.Planet.ProjectStorage.getVersionHistory();
        console.log("Version history:", versions); // Debug
        this.currentVersions = versions;
        this.renderVersionList(versions);
    }

    /**
     * Render version list in modal
     * @param {Array} versions - Array of version objects
     */
    renderVersionList(versions) {
        const container = document.getElementById("version-list");
        console.log("Rendering versions:", versions.length); // Debug
        console.log("Container element:", container); // Debug
        
        if (!container) {
            console.error("version-list container not found!");
            return;
        }
        
        if (!versions || versions.length === 0) {
            container.innerHTML = `
                <p class="grey-text center-align">${_("No saved versions yet")}</p>
                <p class="grey-text center-align" style="font-size: 0.9em;">
                    ${_("Click the bookmark icon to save your first version")}
                </p>
            `;
            return;
        }

        let html = '<ul class="collection">';
        
        versions.forEach((version, index) => {
            html += `
                <li class="collection-item">
                    <p>
                        <input name="version-select" type="radio" id="version-${version.id}" value="${version.id}" />
                        <label for="version-${version.id}">
                            <strong>${this.escapeHtml(version.description)}</strong>
                            <br>
                            <span class="grey-text text-darken-1">
                                ${_("Date:")} ${version.date}
                                <br>
                                ${_("Name:")} ${this.escapeHtml(version.projectName)}
                            </span>
                        </label>
                    </p>
                </li>
            `;
        });
        
        html += '</ul>';
        console.log("Generated HTML length:", html.length); // Debug
        container.innerHTML = html;
        console.log("Container innerHTML set, length:", container.innerHTML.length); // Debug
    }

    /**
     * Confirm version revert
     * @param {string} versionId - Version ID to revert to
     */
    confirmRevert(versionId) {
        const version = this.currentVersions.find(v => v.id === versionId);
        if (!version) return;

        if (confirm(_("Restore version: ") + version.description + "?\n\n" + 
                   _("Your current work will be backed up automatically."))) {
            this.revertToVersion(versionId);
        }
    }

    /**
     * Revert to a specific version
     * @param {string} versionId - Version ID
     */
    async revertToVersion(versionId) {
        try {
            await this.Planet.ProjectStorage.revertToVersion(versionId, true);
            this.showToast(_("Project restored successfully!"), 'success');
            
            jQuery("#version-history-modal").modal("close");
            
            this.Planet.LocalPlanet.updateProjects();
            
            setTimeout(() => {
                this.showToast(_("Project has been restored. You can now open it."), 'success');
            }, 500);
        } catch (error) {
            this.showToast(_("Failed to restore version: ") + error.message, 'error');
        }
    }

    /**
     * Confirm version deletion
     * @param {string} versionId - Version ID to delete
     */
    confirmDelete(versionId) {
        const version = this.currentVersions.find(v => v.id === versionId);
        if (!version) return;

        if (confirm(_("Delete version: ") + version.description + "?")) {
            this.deleteVersion(versionId);
        }
    }

    /**
     * Delete a specific version
     * @param {string} versionId - Version ID
     */
    async deleteVersion(versionId) {
        try {
            await this.Planet.ProjectStorage.deleteVersion(versionId);
            this.showToast(_("Version deleted successfully"), 'success');
            this.refreshVersionHistory();
        } catch (error) {
            this.showToast(_("Failed to delete version: ") + error.message, 'error');
        }
    }

    /**
     * Confirm clearing all versions
     */
    confirmClearAll() {
        if (confirm(_("Delete ALL version history for this project?") + "\n\n" + 
                   _("This action cannot be undone!"))) {
            this.clearAllVersions();
        }
    }

    /**
     * Clear all versions for current project
     */
    async clearAllVersions() {
        try {
            await this.Planet.ProjectStorage.clearVersionHistory();
            this.showToast(_("All versions deleted"), 'success');
            this.refreshVersionHistory();
        } catch (error) {
            this.showToast(_("Failed to clear history: ") + error.message, 'error');
        }
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
