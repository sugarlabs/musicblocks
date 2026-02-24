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
     * VersionControl manages the history and merging of workspace versions.
     */
    class VersionControl {
        constructor(activity, workspaceStorage) {
            this.activity = activity;
            this.workspaceStorage = workspaceStorage;
        }

        /**
         * Get the full history of versions.
         */
        async getHistory() {
            return await this.workspaceStorage.getHistory();
        }

        /**
         * Restore the workspace to a specific version.
         * @param {string} versionId - The unique ID of the version to restore.
         */
        async restoreVersion(versionId) {
            console.log(`Restoring version: ${versionId}`);

            try {
                const version = await this.workspaceStorage.getVersion(versionId);
                if (!version || !version.data) {
                    throw new Error("Version data not found");
                }

                // Parse the data
                const obj = JSON.parse(version.data);

                // Before restoring, save a new version of current state to avoid data loss
                await this.workspaceStorage.saveWorkspace(true);

                // Load new blocks
                this.activity.blocks.loadNewBlocks(obj);
                this.activity.refreshCanvas();

                // Save restored state as current
                await this.workspaceStorage.saveWorkspace(true);

                console.log("Version restored successfully");
                return true;
            } catch (error) {
                console.error("Failed to restore version:", error);
                throw error;
            }
        }

        /**
         * Compare two versions and return the differences.
         * (Placeholder for Smart Merge logic)
         */
        calculateDiff(versionA, versionB) {
            // TODO: Implement block-level diff algorithm
            console.log("Diff calculation not yet implemented");
            return null;
        }
    }

    // Set globally for non-AMD usage
    window.VersionControl = VersionControl;
    return VersionControl;
});
