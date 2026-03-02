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
     * SyncManager handles synchronization between local IndexedDB and cloud storage (Planet).
     * It provides conflict detection and resolution capabilities.
     */
    class SyncManager {
        constructor(activity, workspaceStorage) {
            this.activity = activity;
            this.workspaceStorage = workspaceStorage;
            this.syncInProgress = false;
            this.lastSyncTime = null;
            this.syncQueue = [];
            this.syncInterval = 30000; // 30 seconds
            this._syncTimer = null;
            this.conflictResolver = null;
        }

        /**
         * Initialize the sync manager.
         */
        async init() {
            console.debug("SyncManager initialized");

            // Start periodic sync if online
            if (this.workspaceStorage.isOnline) {
                this._startPeriodicSync();
            }

            // Register service worker for background sync if supported
            if ("serviceWorker" in navigator && "sync" in ServiceWorkerRegistration.prototype) {
                this._registerBackgroundSync();
            }

            return Promise.resolve();
        }

        /**
         * Starts periodic synchronization.
         */
        _startPeriodicSync() {
            if (this._syncTimer) return;

            this._syncTimer = setInterval(() => {
                this.syncNow();
            }, this.syncInterval);
        }

        /**
         * Stops periodic synchronization.
         */
        _stopPeriodicSync() {
            if (this._syncTimer) {
                clearInterval(this._syncTimer);
                this._syncTimer = null;
            }
        }

        /**
         * Queue a sync operation.
         */
        queueSync() {
            if (!this.syncInProgress && this.workspaceStorage.isOnline) {
                // Debounce: wait 2 seconds before syncing
                setTimeout(() => {
                    this.syncNow();
                }, 2000);
            }
        }

        /**
         * Perform synchronization now.
         */
        async syncNow() {
            if (this.syncInProgress || !this.workspaceStorage.isOnline) {
                console.debug("Sync skipped: already in progress or offline");
                return;
            }

            this.syncInProgress = true;
            this._updateSyncStatus("syncing");

            try {
                // Check if there are unsynced local changes
                const hasLocalChanges = await this.workspaceStorage.hasUnsyncedChanges();

                // Get cloud version (if exists)
                const cloudData = await this._getCloudWorkspace();
                const localMetadata = await this.workspaceStorage.getVersionMetadata();

                if (!localMetadata) {
                    // No local data, just download from cloud if available
                    if (cloudData) {
                        await this._downloadFromCloud(cloudData);
                    }
                    this._updateSyncStatus("synced");
                    this.syncInProgress = false;
                    return;
                }

                // Compare timestamps to detect conflicts
                if (cloudData && cloudData.timestamp) {
                    const cloudTime = new Date(cloudData.timestamp).getTime();
                    const localTime = localMetadata.timestamp;

                    // Check if cloud has newer version AND we have local changes
                    if (cloudTime > localTime && hasLocalChanges) {
                        // CONFLICT DETECTED
                        console.warn("Conflict detected: both local and cloud have changes");
                        this._handleConflict(localMetadata, cloudData);
                        this.syncInProgress = false;
                        return;
                    } else if (cloudTime > localTime) {
                        // Cloud is newer, no local changes - safe to download
                        await this._downloadFromCloud(cloudData);
                    } else if (hasLocalChanges) {
                        // Local is newer or same - upload local changes
                        await this._uploadToCloud(localMetadata);
                    }
                } else if (hasLocalChanges) {
                    // No cloud version, upload local
                    await this._uploadToCloud(localMetadata);
                }

                this.lastSyncTime = Date.now();
                this._updateSyncStatus("synced");
            } catch (error) {
                console.error("Sync failed:", error);
                this._updateSyncStatus("error");
            } finally {
                this.syncInProgress = false;
            }
        }

        /**
         * Gets the current workspace from cloud (Planet).
         */
        async _getCloudWorkspace() {
            // This integrates with existing Planet API
            if (!this.activity.planet || !this.activity.planet.ProjectStorage) {
                return null;
            }

            try {
                const currentProject = await this.activity.planet.openCurrentProject();
                if (currentProject) {
                    // Handle both wrapped object and plain data (array)
                    const data =
                        currentProject.data ||
                        (Array.isArray(currentProject)
                            ? JSON.stringify(currentProject)
                            : currentProject);
                    const timestamp =
                        currentProject.updated ||
                        currentProject.created ||
                        (this.activity.planet.getTimeLastSaved
                            ? this.activity.planet.getTimeLastSaved()
                            : Date.now());

                    if (data) {
                        return {
                            data: data,
                            timestamp: timestamp,
                            id: currentProject.id || "current"
                        };
                    }
                }
            } catch (error) {
                console.debug("No cloud workspace found or error:", error);
            }

            return null;
        }

        /**
         * Uploads local workspace to cloud.
         */
        async _uploadToCloud(localMetadata) {
            console.log("Uploading to cloud...");

            // Use existing Planet save functionality
            if (this.activity.planet && this.activity.planet.saveLocally) {
                try {
                    await this.activity.planet.saveLocally();
                    await this.workspaceStorage.markAsSynced();
                    console.log("Upload to cloud successful");
                } catch (error) {
                    console.error("Failed to upload to cloud:", error);
                    throw error;
                }
            }
        }

        /**
         * Downloads workspace from cloud.
         */
        async _downloadFromCloud(cloudData) {
            console.log("Downloading from cloud...");

            try {
                // Load the cloud data into the workspace
                if (cloudData.data) {
                    const obj = JSON.parse(cloudData.data);
                    this.activity.blocks.loadNewBlocks(obj);
                    this.activity.refreshCanvas();

                    // Save to local storage and mark as synced
                    await this.workspaceStorage.saveWorkspace(false);
                    await this.workspaceStorage.markAsSynced();
                    console.log("Download from cloud successful");
                }
            } catch (error) {
                console.error("Failed to download from cloud:", error);
                throw error;
            }
        }

        /**
         * Handles sync conflict by showing conflict resolution UI.
         */
        _handleConflict(localMetadata, cloudData) {
            console.warn("Showing conflict resolution dialog");
            this._updateSyncStatus("conflict");

            // Show conflict resolver UI
            if (!this.conflictResolver) {
                this.conflictResolver = new ConflictResolver(this, localMetadata, cloudData);
            }

            this.conflictResolver.show(localMetadata, cloudData);
        }

        /**
         * Resolves conflict with user's choice.
         * @param {string} choice - "local", "cloud", or "merge" (merge not implemented in Phase 2)
         */
        async resolveConflict(choice, localMetadata, cloudData) {
            console.log(`Resolving conflict with choice: ${choice}`);

            try {
                if (choice === "local") {
                    // Keep local, upload to cloud
                    await this._uploadToCloud(localMetadata);
                } else if (choice === "cloud") {
                    // Keep cloud, download and overwrite local
                    await this._downloadFromCloud(cloudData);
                } else if (choice === "merge") {
                    // Not implemented in Phase 2
                    alert("Merge functionality coming in a future update!");
                    return;
                }

                this._updateSyncStatus("synced");
                this.lastSyncTime = Date.now();
            } catch (error) {
                console.error("Failed to resolve conflict:", error);
                this._updateSyncStatus("error");
            }
        }

        /**
         * Called when network is restored.
         */
        async onNetworkRestore() {
            console.log("Network restored, attempting sync...");
            this._startPeriodicSync();

            // Wait a bit for connection to stabilize
            setTimeout(() => {
                this.syncNow();
            }, 1000);
        }

        /**
         * Updates sync status in the UI.
         */
        _updateSyncStatus(status) {
            const statusElement = document.getElementById("sync-status");
            if (!statusElement) return;

            statusElement.style.display = "flex";
            const translate = typeof _ !== "undefined" ? _ : s => s;

            // Remove all status classes
            statusElement.classList.remove("syncing", "synced", "error", "conflict");

            // Add current status
            statusElement.classList.add(status);

            const icon = statusElement.querySelector("i");
            const text = statusElement.querySelector(".sync-text");

            switch (status) {
                case "syncing":
                    if (icon) icon.textContent = "sync";
                    if (text) text.textContent = translate("Syncing...");
                    break;
                case "synced":
                    if (icon) icon.textContent = "cloud_done";
                    if (text) {
                        const timeAgo = this.lastSyncTime
                            ? this._getTimeAgo(this.lastSyncTime)
                            : translate("Just now");
                        text.textContent = translate("Synced") + " " + timeAgo;
                    }
                    break;
                case "error":
                    if (icon) icon.textContent = "sync_problem";
                    if (text) text.textContent = translate("Sync failed");
                    break;
                case "conflict":
                    if (icon) icon.textContent = "warning";
                    if (text) text.textContent = translate("Conflict detected");
                    break;
            }
        }

        /**
         * Gets human-readable time ago string.
         */
        _getTimeAgo(timestamp) {
            const seconds = Math.floor((Date.now() - timestamp) / 1000);

            if (seconds < 60) return "just now";
            if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
            if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
            return Math.floor(seconds / 86400) + "d ago";
        }

        /**
         * Register background sync with service worker.
         */
        async _registerBackgroundSync() {
            try {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register("workspace-sync");
                console.debug("Background sync registered");
            } catch (error) {
                console.debug("Background sync not supported or failed:", error);
            }
        }
    }

    // Set globally for non-AMD usage
    window.SyncManager = SyncManager;
    return SyncManager;
});
