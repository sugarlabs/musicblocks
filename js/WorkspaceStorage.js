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

/* global define, indexedDB, navigator */

define([], function () {
    "use strict";

    /**
     * WorkspaceStorage handles persistent workspace storage using IndexedDB.
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
         * Initialize the IndexedDB database.
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
         * Set up listeners for online/offline events.
         */
        _initNetworkDetection() {
            window.addEventListener("online", () => this._handleNetworkChange(true));
            window.addEventListener("offline", () => this._handleNetworkChange(false));
        }

        _handleNetworkChange(online) {
            this.isOnline = online;
            window.dispatchEvent(
                new CustomEvent(online ? "workspace:online" : "workspace:offline", {
                    detail: { isOnline: online }
                })
            );
        }

        /**
         * Start auto-save loop.
         */
        _startAutoSave() {
            if (this._autoSaveTimer) return;
            this._autoSaveTimer = setInterval(() => {
                this.saveWorkspace();
            }, this.autoSaveInterval);
        }

        /**
         * Stops the auto-save loop and cleans up the interval.
         */
        clearAutosave() {
            if (this._autoSaveTimer) {
                clearInterval(this._autoSaveTimer);
                this._autoSaveTimer = null;
            }
        }

        /**
         * Save current workspace to IndexedDB.
         */
        saveWorkspace() {
            if (!this.db || !this.activity) return Promise.resolve();

            try {
                const data = this.activity.prepareExport();
                if (!data || data === "[]") return Promise.resolve();

                const versionedData = {
                    version: 1,
                    timestamp: Date.now(),
                    data: data
                };

                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([this.storeName], "readwrite");
                    const store = transaction.objectStore(this.storeName);
                    const request = store.put(versionedData, "current_workspace");

                    request.onsuccess = () => {
                        this.lastSaveTime = Date.now();
                        window.dispatchEvent(new CustomEvent("workspace:saved"));
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
         * Load last saved workspace from IndexedDB.
         */
        doLoadWorkspace() {
            if (!this.db) return Promise.resolve(null);
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], "readonly");
                const store = transaction.objectStore(this.storeName);
                const request = store.get("current_workspace");

                request.onsuccess = () => {
                    const result = request.result;
                    if (!result) {
                        resolve(null);
                        return;
                    }

                    if (result.version && result.data) {
                        if (result.version === 1) {
                            window.dispatchEvent(new CustomEvent("workspace:restored"));
                            resolve(result.data);
                        } else {
                            resolve(null);
                        }
                    } else {
                        window.dispatchEvent(new CustomEvent("workspace:restored"));
                        resolve(result);
                    }
                };
                request.onerror = event => reject(event.target.error);
            });
        }
    }

    window.WorkspaceStorage = WorkspaceStorage;

    return WorkspaceStorage;
});
