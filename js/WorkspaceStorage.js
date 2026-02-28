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
/* global define, indexedDB, navigator, _ */

define([], function () {
    "use strict";

    /**
     * WorkspaceStorage handles persistent storage of the workspace using IndexedDB.
     * It also monitors network connectivity status and provides versioning for sync.
     */
    class WorkspaceStorage {
        constructor(activity) {
            this.activity = activity;
            this.dbName = "MusicBlocksWorkspace";
            this.storeName = "workspace";
            this.db = null;
            this.isOnline = navigator.onLine;
            this.lastSaveTime = 0;
            this.autoSaveInterval = 5000; // 5 seconds
            this._autoSaveTimer = null;
            this._initNetworkDetection();
        }

        /**
         * Initializes the IndexedDB database with versioning support.
         */
        init() {
            return new Promise((resolve, reject) => {
                try {
                    const request = indexedDB.open(this.dbName, 2);

                    request.onupgradeneeded = event => {
                        const db = event.target.result;

                        // Create workspace store
                        if (!db.objectStoreNames.contains(this.storeName)) {
                            db.createObjectStore(this.storeName);
                        }

                        // Create metadata store for versioning
                        if (!db.objectStoreNames.contains("metadata")) {
                            const metadataStore = db.createObjectStore("metadata");
                            metadataStore.createIndex("timestamp", "timestamp", { unique: false });
                        }

                        // Create sync queue store
                        if (!db.objectStoreNames.contains("syncQueue")) {
                            const syncStore = db.createObjectStore("syncQueue", {
                                autoIncrement: true
                            });
                            syncStore.createIndex("timestamp", "timestamp", { unique: false });
                        }
                    };

                    request.onsuccess = event => {
                        this.db = event.target.result;
                        console.debug("WorkspaceStorage initialized with versioning");
                        this._startAutoSave();
                        resolve();
                    };

                    request.onerror = event => {
                        console.error("WorkspaceStorage init failed", event.target.error);
                        reject(event.target.error);
                    };
                } catch (e) {
                    console.error("IndexedDB not supported or permission denied", e);
                    reject(e);
                }
            });
        }

        /**
         * Sets up listeners for network online/offline events.
         */
        _initNetworkDetection() {
            window.addEventListener("online", () => this._handleNetworkChange(true));
            window.addEventListener("offline", () => this._handleNetworkChange(false));

            // Initialize UI after a short delay to ensure DOM is ready
            setTimeout(() => this._updateUIIndicator(), 1000);
        }

        _handleNetworkChange(online) {
            this.isOnline = online;
            this._updateUIIndicator();

            if (online) {
                console.log("Device is online - triggering sync");
                // Notify sync manager that we're back online
                if (window.syncManager) {
                    window.syncManager.onNetworkRestore();
                }
            } else {
                console.log("Device is offline");
            }
        }

        /**
         * Updates the connectivity indicator in the UI.
         */
        _updateUIIndicator() {
            const indicator = document.getElementById("network-status");
            if (indicator) {
                const icon = indicator.querySelector("i");
                const translate = typeof _ !== "undefined" ? _ : s => s;
                const status = this.isOnline ? translate("Online") : translate("Offline");

                if (this.isOnline) {
                    indicator.classList.remove("offline");
                    indicator.classList.add("online");
                    if (icon) icon.textContent = "cloud_done";
                } else {
                    indicator.classList.remove("online");
                    indicator.classList.add("offline");
                    if (icon) icon.textContent = "cloud_off";
                }

                indicator.setAttribute("data-tooltip", status);
            }
        }

        /**
         * Starts the auto-save loop.
         */
        _startAutoSave() {
            if (this._autoSaveTimer) return;

            this._autoSaveTimer = setInterval(() => {
                this.saveWorkspace();
            }, this.autoSaveInterval);
        }

        /**
         * Saves the current workspace to IndexedDB with version metadata.
         */
        async saveWorkspace(userInitiated = false) {
            if (!this.db || !this.activity) return Promise.resolve();

            try {
                const data = this.activity.prepareExport();
                if (!data || data === "[]") return Promise.resolve();

                const timestamp = Date.now();
                const version = {
                    timestamp: timestamp,
                    data: data,
                    synced: false,
                    userInitiated: userInitiated
                };

                // Save workspace
                const transaction = this.db.transaction([this.storeName, "metadata"], "readwrite");
                const workspaceStore = transaction.objectStore(this.storeName);
                const metadataStore = transaction.objectStore("metadata");

                await new Promise((resolve, reject) => {
                    const request1 = workspaceStore.put(data, "current_workspace");
                    const request2 = metadataStore.put(version, "current_version");

                    transaction.oncomplete = () => {
                        this.lastSaveTime = timestamp;
                        resolve();
                    };
                    transaction.onerror = event => reject(event.target.error);
                });

                // Queue for sync if online
                if (this.isOnline && window.syncManager) {
                    window.syncManager.queueSync();
                }

                return Promise.resolve();
            } catch (e) {
                console.error("Failed to save workspace", e);
                return Promise.reject(e);
            }
        }

        /**
         * Loads the last saved workspace from IndexedDB.
         */
        doLoadWorkspace() {
            if (!this.db) return Promise.resolve(null);

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], "readonly");
                const store = transaction.objectStore(this.storeName);
                const request = store.get("current_workspace");

                request.onsuccess = () => resolve(request.result);
                request.onerror = event => reject(event.target.error);
            });
        }

        /**
         * Gets version metadata for current workspace.
         */
        async getVersionMetadata() {
            if (!this.db) return null;

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(["metadata"], "readonly");
                const store = transaction.objectStore("metadata");
                const request = store.get("current_version");

                request.onsuccess = () => resolve(request.result);
                request.onerror = event => reject(event.target.error);
            });
        }

        /**
         * Marks the current version as synced.
         */
        async markAsSynced() {
            if (!this.db) return;

            const metadata = await this.getVersionMetadata();
            if (metadata) {
                metadata.synced = true;

                const transaction = this.db.transaction(["metadata"], "readwrite");
                const store = transaction.objectStore("metadata");
                store.put(metadata, "current_version");
            }
        }

        /**
         * Checks if there are unsynced changes.
         */
        async hasUnsyncedChanges() {
            const metadata = await this.getVersionMetadata();
            return metadata && !metadata.synced;
        }
    }

    // Set globally for non-AMD usage
    window.WorkspaceStorage = WorkspaceStorage;
    return WorkspaceStorage;
});
