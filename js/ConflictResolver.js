/*
 * Copyright (c) 2025 Music Blocks
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA
 */
/* global define, _ */

define([], function () {
    "use strict";

    /**
     * ConflictResolver provides UI for resolving sync conflicts.
     */
    class ConflictResolver {
        constructor(syncManager) {
            this.syncManager = syncManager;
            this.dialog = null;
            this.localMetadata = null;
            this.cloudData = null;
        }

        /**
         * Shows the conflict resolution dialog.
         */
        show(localMetadata, cloudData) {
            this.localMetadata = localMetadata;
            this.cloudData = cloudData;

            if (this.dialog) {
                this.dialog.remove();
            }

            this._createDialog();
            this.dialog.style.display = "flex";
        }

        /**
         * Hides the conflict resolution dialog.
         */
        hide() {
            if (this.dialog) {
                this.dialog.style.display = "none";
            }
        }

        /**
         * Creates the conflict resolution dialog UI.
         */
        _createDialog() {
            const translate = typeof _ !== "undefined" ? _ : s => s;

            this.dialog = document.createElement("div");
            this.dialog.id = "conflict-dialog";
            this.dialog.className = "conflict-dialog-overlay";

            const localTime = new Date(this.localMetadata.timestamp).toLocaleString();
            const cloudTime = new Date(this.cloudData.timestamp).toLocaleString();

            this.dialog.innerHTML = `
                <div class="conflict-dialog">
                    <div class="conflict-header">
                        <i class="material-icons conflict-icon">warning</i>
                        <h2>${translate("Sync Conflict Detected")}</h2>
                    </div>
                    
                    <div class="conflict-body">
                        <p class="conflict-message">
                            ${translate(
                                "Your workspace has been modified both locally and in the cloud. Please choose which version to keep:"
                            )}
                        </p>
                        
                        <div class="conflict-options">
                            <div class="conflict-option local-option">
                                <div class="option-header">
                                    <i class="material-icons">computer</i>
                                    <h3>${translate("Local Version")}</h3>
                                </div>
                                <div class="option-details">
                                    <p><strong>${translate(
                                        "Last modified"
                                    )}:</strong> ${localTime}</p>
                                    <p class="option-description">${translate(
                                        "Keep your local changes and upload them to the cloud"
                                    )}</p>
                                </div>
                                <button class="conflict-btn local-btn" id="keep-local-btn">
                                    <i class="material-icons">computer</i>
                                    ${translate("Keep Local")}
                                </button>
                            </div>
                            
                            <div class="conflict-option cloud-option">
                                <div class="option-header">
                                    <i class="material-icons">cloud</i>
                                    <h3>${translate("Cloud Version")}</h3>
                                </div>
                                <div class="option-details">
                                    <p><strong>${translate(
                                        "Last modified"
                                    )}:</strong> ${cloudTime}</p>
                                    <p class="option-description">${translate(
                                        "Download the cloud version and overwrite your local changes"
                                    )}</p>
                                </div>
                                <button class="conflict-btn cloud-btn" id="keep-cloud-btn">
                                    <i class="material-icons">cloud_download</i>
                                    ${translate("Keep Cloud")}
                                </button>
                            </div>
                        </div>
                        
                        <div class="conflict-warning">
                            <i class="material-icons">info</i>
                            <p>${translate(
                                "Warning: The version you don't choose will be lost. Make sure to download a backup before proceeding if needed."
                            )}</p>
                        </div>
                    </div>
                    
                    <div class="conflict-footer">
                        <button class="conflict-btn cancel-btn" id="cancel-conflict-btn">
                            ${translate("Cancel")}
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(this.dialog);

            // Add event listeners
            document.getElementById("keep-local-btn").addEventListener("click", () => {
                this._onResolve("local");
            });

            document.getElementById("keep-cloud-btn").addEventListener("click", () => {
                this._onResolve("cloud");
            });

            document.getElementById("cancel-conflict-btn").addEventListener("click", () => {
                this.hide();
            });

            // Close on overlay click
            this.dialog.addEventListener("click", e => {
                if (e.target === this.dialog) {
                    this.hide();
                }
            });
        }

        /**
         * Handles conflict resolution choice.
         */
        async _onResolve(choice) {
            const buttons = this.dialog.querySelectorAll("button");
            buttons.forEach(btn => (btn.disabled = true));

            // Show loading state
            const chosenBtn =
                choice === "local"
                    ? document.getElementById("keep-local-btn")
                    : document.getElementById("keep-cloud-btn");

            const originalText = chosenBtn.innerHTML;
            chosenBtn.innerHTML = `<i class="material-icons rotating">sync</i> ${
                typeof _ !== "undefined" ? _("Resolving...") : "Resolving..."
            }`;

            try {
                await this.syncManager.resolveConflict(choice, this.localMetadata, this.cloudData);
                this.hide();
            } catch (error) {
                alert("Failed to resolve conflict: " + error.message);
                chosenBtn.innerHTML = originalText;
                buttons.forEach(btn => (btn.disabled = false));
            }
        }
    }

    // Set globally for non-AMD usage
    window.ConflictResolver = ConflictResolver;
    return ConflictResolver;
});
