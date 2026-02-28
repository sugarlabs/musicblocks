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
   exported CacheManager
*/

/**
 * CacheManager - Handles IndexedDB caching for Planet projects
 * Provides offline access to previously viewed projects and reduces API calls.
 */
class CacheManager {
    /**
     * Creates a new CacheManager instance
     * @param {Object} options - Configuration options
     * @param {string} options.dbName - IndexedDB database name
     * @param {number} options.metadataExpiry - Metadata cache expiry in ms (default: 24 hours)
     * @param {number} options.projectExpiry - Full project cache expiry in ms (default: 7 days)
     * @param {number} options.maxCacheSize - Maximum number of projects to cache (default: 100)
     */
    constructor(options = {}) {
        this.dbName = options.dbName || "MusicBlocksPlanetCache";
        this.dbVersion = 1;
        this.db = null;

        // Cache expiry times
        this.metadataExpiry = options.metadataExpiry || 24 * 60 * 60 * 1000; // 24 hours
        this.projectExpiry = options.projectExpiry || 7 * 24 * 60 * 60 * 1000; // 7 days
        this.maxCacheSize = options.maxCacheSize || 100;

        // Store names
        this.STORES = {
            METADATA: "projectMetadata",
            PROJECTS: "projectData",
            THUMBNAILS: "projectThumbnails"
        };

        this.isInitialized = false;
    }

    /**
     * Initializes the IndexedDB database
     * @returns {Promise<boolean>} - True if initialization successful
     */
    async init() {
        if (this.isInitialized) return true;

        try {
            this.db = await this._openDatabase();
            this.isInitialized = true;

            // Clean up expired entries on init
            await this.clearExpired();

            // eslint-disable-next-line no-console
            console.debug("[CacheManager] Initialized successfully");
            return true;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[CacheManager] Initialization failed:", error);
            return false;
        }
    }

    /**
     * Opens or creates the IndexedDB database
     * @private
     * @returns {Promise<IDBDatabase>}
     */
    _openDatabase() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error("IndexedDB not supported"));
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(request.error);
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onupgradeneeded = event => {
                const db = event.target.result;

                // Create metadata store
                if (!db.objectStoreNames.contains(this.STORES.METADATA)) {
                    const metadataStore = db.createObjectStore(this.STORES.METADATA, {
                        keyPath: "id"
                    });
                    metadataStore.createIndex("expiry", "expiry", { unique: false });
                    metadataStore.createIndex("lastAccessed", "lastAccessed", { unique: false });
                }

                // Create projects store
                if (!db.objectStoreNames.contains(this.STORES.PROJECTS)) {
                    const projectsStore = db.createObjectStore(this.STORES.PROJECTS, {
                        keyPath: "id"
                    });
                    projectsStore.createIndex("expiry", "expiry", { unique: false });
                    projectsStore.createIndex("lastAccessed", "lastAccessed", { unique: false });
                }

                // Create thumbnails store
                if (!db.objectStoreNames.contains(this.STORES.THUMBNAILS)) {
                    const thumbnailsStore = db.createObjectStore(this.STORES.THUMBNAILS, {
                        keyPath: "id"
                    });
                    thumbnailsStore.createIndex("expiry", "expiry", { unique: false });
                }
            };
        });
    }

    /**
     * Gets project metadata from cache
     * @param {string} id - Project ID
     * @returns {Promise<Object|null>} - Cached metadata or null
     */
    async getMetadata(id) {
        if (!this.isInitialized) return null;

        try {
            const data = await this._getFromStore(this.STORES.METADATA, id);

            if (data && !this._isExpired(data.expiry)) {
                // Update last accessed time
                await this._updateLastAccessed(this.STORES.METADATA, id);
                return data.metadata;
            }

            return null;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.debug("[CacheManager] Error getting metadata:", error);
            return null;
        }
    }

    /**
     * Caches project metadata
     * @param {string} id - Project ID
     * @param {Object} metadata - Project metadata
     * @returns {Promise<boolean>}
     */
    async cacheMetadata(id, metadata) {
        if (!this.isInitialized) return false;

        try {
            const entry = {
                id,
                metadata,
                expiry: Date.now() + this.metadataExpiry,
                lastAccessed: Date.now(),
                cachedAt: Date.now()
            };

            await this._putToStore(this.STORES.METADATA, entry);
            await this._enforceMaxSize(this.STORES.METADATA);
            return true;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.debug("[CacheManager] Error caching metadata:", error);
            return false;
        }
    }

    /**
     * Gets full project data from cache
     * @param {string} id - Project ID
     * @returns {Promise<Object|null>} - Cached project data or null
     */
    async getProject(id) {
        if (!this.isInitialized) return null;

        try {
            const data = await this._getFromStore(this.STORES.PROJECTS, id);

            if (data && !this._isExpired(data.expiry)) {
                await this._updateLastAccessed(this.STORES.PROJECTS, id);
                return data.projectData;
            }

            return null;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.debug("[CacheManager] Error getting project:", error);
            return null;
        }
    }

    /**
     * Caches full project data
     * @param {string} id - Project ID
     * @param {Object} projectData - Full project data
     * @returns {Promise<boolean>}
     */
    async cacheProject(id, projectData) {
        if (!this.isInitialized) return false;

        try {
            const entry = {
                id,
                projectData,
                expiry: Date.now() + this.projectExpiry,
                lastAccessed: Date.now(),
                cachedAt: Date.now()
            };

            await this._putToStore(this.STORES.PROJECTS, entry);
            await this._enforceMaxSize(this.STORES.PROJECTS);
            return true;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.debug("[CacheManager] Error caching project:", error);
            return false;
        }
    }

    /**
     * Gets project thumbnail from cache
     * @param {string} id - Project ID
     * @returns {Promise<string|null>} - Cached thumbnail URL or null
     */
    async getThumbnail(id) {
        if (!this.isInitialized) return null;

        try {
            const data = await this._getFromStore(this.STORES.THUMBNAILS, id);

            if (data && !this._isExpired(data.expiry)) {
                return data.thumbnail;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Caches project thumbnail
     * @param {string} id - Project ID
     * @param {string} thumbnail - Thumbnail data URL
     * @returns {Promise<boolean>}
     */
    async cacheThumbnail(id, thumbnail) {
        if (!this.isInitialized) return false;

        try {
            const entry = {
                id,
                thumbnail,
                expiry: Date.now() + this.metadataExpiry,
                cachedAt: Date.now()
            };

            await this._putToStore(this.STORES.THUMBNAILS, entry);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Clears all expired entries from all stores
     * @returns {Promise<number>} - Number of entries cleared
     */
    async clearExpired() {
        if (!this.isInitialized) return 0;

        let cleared = 0;
        const now = Date.now();

        for (const storeName of Object.values(this.STORES)) {
            try {
                cleared += await this._clearExpiredFromStore(storeName, now);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.debug(`[CacheManager] Error clearing expired from ${storeName}:`, error);
            }
        }

        if (cleared > 0) {
            // eslint-disable-next-line no-console
            console.debug(`[CacheManager] Cleared ${cleared} expired entries`);
        }

        return cleared;
    }

    /**
     * Clears expired entries from a specific store
     * @private
     */
    async _clearExpiredFromStore(storeName, now) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const index = store.index("expiry");
            const range = IDBKeyRange.upperBound(now);

            let cleared = 0;
            const request = index.openCursor(range);

            request.onsuccess = event => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cleared++;
                    cursor.continue();
                }
            };

            transaction.oncomplete = () => resolve(cleared);
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Enforces maximum cache size by removing least recently accessed entries
     * @private
     */
    async _enforceMaxSize(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const countRequest = store.count();

            countRequest.onsuccess = () => {
                const count = countRequest.result;

                if (count <= this.maxCacheSize) {
                    resolve();
                    return;
                }

                // Remove oldest entries
                const toRemove = count - this.maxCacheSize;
                const index = store.index("lastAccessed");
                const request = index.openCursor();
                let removed = 0;

                request.onsuccess = event => {
                    const cursor = event.target.result;
                    if (cursor && removed < toRemove) {
                        cursor.delete();
                        removed++;
                        cursor.continue();
                    }
                };
            };

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Gets data from a store
     * @private
     */
    _getFromStore(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Puts data to a store
     * @private
     */
    _putToStore(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], "readwrite");
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Updates the lastAccessed timestamp for an entry
     * @private
     */
    async _updateLastAccessed(storeName, key) {
        try {
            const data = await this._getFromStore(storeName, key);
            if (data) {
                data.lastAccessed = Date.now();
                await this._putToStore(storeName, data);
            }
        } catch (error) {
            // Silently fail - this is not critical
        }
    }

    /**
     * Checks if a timestamp is expired
     * @private
     */
    _isExpired(expiry) {
        return Date.now() > expiry;
    }

    /**
     * Clears all cached data
     * @returns {Promise<boolean>}
     */
    async clearAll() {
        if (!this.isInitialized) return false;

        try {
            for (const storeName of Object.values(this.STORES)) {
                await new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([storeName], "readwrite");
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();

                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            }

            // eslint-disable-next-line no-console
            console.debug("[CacheManager] All cache cleared");
            return true;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[CacheManager] Error clearing cache:", error);
            return false;
        }
    }

    /**
     * Gets cache statistics
     * @returns {Promise<Object>}
     */
    async getStats() {
        if (!this.isInitialized) {
            return { metadata: 0, projects: 0, thumbnails: 0 };
        }

        const stats = {};

        for (const [name, storeName] of Object.entries(this.STORES)) {
            try {
                stats[name.toLowerCase()] = await new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([storeName], "readonly");
                    const store = transaction.objectStore(storeName);
                    const request = store.count();

                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            } catch {
                stats[name.toLowerCase()] = 0;
            }
        }

        return stats;
    }

    /**
     * Closes the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
        }
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = CacheManager;
}
