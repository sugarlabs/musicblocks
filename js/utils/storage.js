// Copyright (c) 2024 Yash Khandelwal
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

/* global ErrorHandler */

class IndexedDBWrapper {
    constructor() {
        this.dbName = "MusicBlocksDB";
        this.dbVersion = 1;
        this.storeName = "keyval";
        this.db = null;
        this._cache = {};
        this._channel = null;
        this.isFallback = false;

        // Ensure we handle private browsing restrictions gracefully
        if (typeof BroadcastChannel !== "undefined") {
            try {
                this._channel = new BroadcastChannel("musicblocks_storage_sync");
                this._channel.onmessage = this._handleBroadcast.bind(this);
            } catch (e) {
                console.warn("BroadcastChannel restricted", e);
            }
        }

        // The proxy allows synchronous access to preferences (this.storage.themePreference)
        // while routing methods to the wrapper and writes to IndexedDB
        this.proxy = new Proxy(this, {
            get: (target, prop) => {
                if (prop in target) {
                    if (typeof target[prop] === "function") {
                        return target[prop].bind(target);
                    }
                    return target[prop];
                }
                return target._cache[prop];
            },
            set: (target, prop, value) => {
                // Prevent overriding internal class properties
                if (prop in target && typeof target[prop] !== "undefined") {
                    target[prop] = value;
                    return true;
                }

                target._cache[prop] = value;
                // Fire async write, swallow unhandled rejections to prevent crashing
                target.setItem(prop, value).catch(e => {
                    console.error("Async write failed for", prop, e);
                });
                return true;
            },
            deleteProperty: (target, prop) => {
                delete target._cache[prop];
                target.removeItem(prop).catch(e => {
                    console.error("Async remove failed for", prop, e);
                });
                return true;
            }
        });
    }

    _handleBroadcast(event) {
        if (!event.data) return;
        const { action, key, value } = event.data;
        if (action === "set") {
            this._cache[key] = value;
        } else if (action === "remove") {
            delete this._cache[key];
        } else if (action === "clear") {
            this._cache = {};
        }
    }

    _broadcast(action, key, value) {
        if (this._channel) {
            this._channel.postMessage({ action, key, value });
        }
    }

    async init() {
        // Feature flag / fallback override
        let urlParams = null;
        try {
            urlParams = new URLSearchParams(window.location.search);
        } catch (e) {
            // Ignore URL parsing errors
        }

        const disableIndexedDB =
            (urlParams && urlParams.get("disableIndexedDB") === "true") ||
            (typeof localStorage !== "undefined" &&
                localStorage.getItem("disableIndexedDB") === "true");

        if (disableIndexedDB || !window.indexedDB) {
            this.isFallback = true;
            this._loadFallbackCache();
            return;
        }

        if (navigator.storage && navigator.storage.persist) {
            try {
                await navigator.storage.persist();
            } catch (e) {
                console.warn("Storage persistence denied", e);
            }
        }

        return new Promise((resolve, reject) => {
            const request = window.indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = event => {
                console.error("IndexedDB blocked/failed. Falling back.", event);
                this.isFallback = true;
                this._loadFallbackCache();
                resolve(); // Resolve anyway so app can boot
            };

            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (event.oldVersion < 1) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onsuccess = async event => {
                this.db = event.target.result;

                try {
                    await this._migrateAndPopulateCache();
                } catch (e) {
                    console.error("Migration/Cache population failed", e);
                    if (typeof ErrorHandler !== "undefined") {
                        ErrorHandler.recoverable(e, { operation: "indexeddb_init" });
                    }
                }

                resolve();
            };
        });
    }

    _loadFallbackCache() {
        if (typeof localStorage !== "undefined") {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                this._cache[key] = localStorage.getItem(key);
            }
        }
    }

    _isHeavyKey(key) {
        return (
            key.startsWith("SESSION") ||
            key === "macros" ||
            key === "localStorage:plugins" ||
            key === "custommode"
        );
    }

    async _migrateAndPopulateCache() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);

            let migrationNeeded = true;

            const getFlagRequest = store.get("migration_v1_complete");

            getFlagRequest.onsuccess = () => {
                if (getFlagRequest.result === true) {
                    migrationNeeded = false;
                }

                if (migrationNeeded && typeof localStorage !== "undefined") {
                    try {
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key !== "disableIndexedDB") {
                                const val = localStorage.getItem(key);
                                store.put(val, key);
                            }
                        }
                        store.put(true, "migration_v1_complete");
                    } catch (err) {
                        console.error("Migration crash:", err);
                    }
                }

                const cursorRequest = store.openCursor();
                cursorRequest.onsuccess = e => {
                    const cursor = e.target.result;
                    if (cursor) {
                        if (!this._isHeavyKey(cursor.key)) {
                            this._cache[cursor.key] = cursor.value;
                        }
                        cursor.continue();
                    }
                };
                cursorRequest.onerror = e => {
                    console.error("Cursor error", e);
                };
            };
            getFlagRequest.onerror = e => {
                console.error("getFlagRequest error", e);
            };

            transaction.oncomplete = () => {
                resolve();
            };

            transaction.onerror = e => {
                console.error("Transaction error", e.target.error);
                reject(e.target.error);
            };
        });
    }

    async getItem(key) {
        // Fast path for lightweight keys that are already cached
        if (key in this._cache) {
            return this._cache[key];
        }

        if (this.isFallback) {
            return typeof localStorage !== "undefined" ? localStorage.getItem(key) : undefined;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) return resolve(undefined);

            const transaction = this.db.transaction([this.storeName], "readonly");
            const store = transaction.objectStore(this.storeName);
            const request = store.get(key);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = e => {
                console.error("IndexedDB getItem failed", e);
                resolve(undefined);
            };
        });
    }

    async setItem(key, value) {
        if (!this._isHeavyKey(key)) {
            this._cache[key] = value;
        }

        this._broadcast("set", key, value);

        if (this.isFallback) {
            if (typeof localStorage !== "undefined") {
                localStorage.setItem(key, value);
            }
            return;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) return resolve();

            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.put(value, key);

            request.onsuccess = () => resolve();
            request.onerror = e => {
                console.error("IndexedDB setItem failed", e);
                reject(e.target.error);
            };
        });
    }

    async removeItem(key) {
        delete this._cache[key];
        this._broadcast("remove", key);

        if (this.isFallback) {
            if (typeof localStorage !== "undefined") {
                localStorage.removeItem(key);
            }
            return;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) return resolve();

            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = e => {
                console.error("IndexedDB removeItem failed", e);
                reject(e.target.error);
            };
        });
    }

    async clear() {
        this._cache = {};
        this._broadcast("clear");

        if (this.isFallback) {
            if (typeof localStorage !== "undefined") {
                localStorage.clear();
            }
            return;
        }

        return new Promise((resolve, reject) => {
            if (!this.db) return resolve();

            const transaction = this.db.transaction([this.storeName], "readwrite");
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = e => {
                console.error("IndexedDB clear failed", e);
                reject(e.target.error);
            };
        });
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = IndexedDBWrapper;
}
