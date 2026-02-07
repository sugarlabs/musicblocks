/*
 * Copyright (c) 2026 Music Blocks
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
     * It also monitors network connectivity status.
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
         * Initializes the IndexedDB database.
         */
        init() {
            return new Promise((resolve, reject) => {
                try {
                    const request = indexedDB.open(this.dbName, 1);

                    request.onupgradeneeded = event => {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains(this.storeName)) {
                            db.createObjectStore(this.storeName);
                        }
                    };

                    request.onsuccess = event => {
                        this.db = event.target.result;
                        console.debug("WorkspaceStorage initialized");
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
                console.log("Device is online");
            } else {
                console.log("Device is offline");
            }
        }

        /**
         * Updates the connectivity indicator in the UI by toggling the Planet icon.
         */
        _updateUIIndicator() {
            const planetIcon = document.getElementById("planetIcon");
            const planetIconDisabled = document.getElementById("planetIconDisabled");
            const translate = typeof _ !== "undefined" ? _ : s => s;

            // Close existing tooltips to ensure they refresh with the new state
            if (typeof jQuery !== "undefined" && jQuery.fn && jQuery.fn.tooltip) {
                jQuery(".tooltipped").tooltip("close");
            }

            if (this.isOnline) {
                if (planetIcon) planetIcon.style.display = "block";
                if (planetIconDisabled) planetIconDisabled.style.display = "none";
            } else {
                if (planetIcon) planetIcon.style.display = "none";
                if (planetIconDisabled) planetIconDisabled.style.display = "block";
            }

            // Notify user about connectivity change
            if (this.activity && typeof this.activity.textMsg === "function") {
                const status = this.isOnline ? translate("Online") : translate("Offline");
                this.activity.textMsg(status, 3000);
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
         * Saves the current workspace to IndexedDB.
         */
        saveWorkspace() {
            if (!this.db || !this.activity) return Promise.resolve();

            try {
                const data = this.activity.prepareExport();
                if (!data || data === "[]") return Promise.resolve();

                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([this.storeName], "readwrite");
                    const store = transaction.objectStore(this.storeName);
                    const request = store.put(data, "current_workspace");

                    request.onsuccess = () => {
                        this.lastSaveTime = Date.now();
                        resolve();
                    };
                    request.onerror = event => reject(event.target.error);
                });
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
    }

    // Set globally for non-AMD usage
    window.WorkspaceStorage = WorkspaceStorage;

    return WorkspaceStorage;
});
