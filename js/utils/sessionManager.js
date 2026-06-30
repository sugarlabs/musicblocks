/**
 * MusicBlocks v3.6.2
 *
 * @author Lavjeet Kumar Rai
 *
 * @copyright 2026 Lavjeet Kumar Rai
 *
 * @license
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * SessionStorageManager
 * A lightweight, vanilla IndexedDB wrapper dedicated exclusively to saving and
 * loading large MusicBlocks session payloads (which often exceed the 5MB localStorage limit).
 */
class SessionStorageManager {
    constructor() {
        this.dbName = "MusicBlocksSessionDB";
        this.storeName = "sessions";
        this.version = 1;
        this.db = null;
    }

    /**
     * Initializes the IndexedDB connection.
     * @returns {Promise<IDBDatabase>}
     */
    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = event => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: "key" });
                }
            };

            request.onsuccess = event => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = event => {
                console.error("[SessionStorageManager] Failed to open IndexedDB", event);
                reject(event.target.error);
            };
        });
    }

    /**
     * Saves the session data to IndexedDB.
     * @param {string} key - The session key (e.g., 'SESSIONMy Project').
     * @param {string} data - The stringified project data.
     * @param {number} timestamp - The Date.now() timestamp when the save was initiated.
     * @returns {Promise<void>}
     */
    async saveSession(key, data, timestamp = Date.now()) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.storeName], "readwrite");
                const store = transaction.objectStore(this.storeName);

                const request = store.put({ key, data, timestamp });

                request.onsuccess = () => resolve();
                request.onerror = event => reject(event.target.error);
            });
        } catch (error) {
            console.error("[SessionStorageManager] Error saving session:", error);
            throw error;
        }
    }

    /**
     * Loads the session data from IndexedDB.
     * @param {string} key - The session key to load.
     * @returns {Promise<{ key: string, data: string, timestamp: number } | null>}
     */
    async loadSession(key) {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.storeName], "readonly");
                const store = transaction.objectStore(this.storeName);

                const request = store.get(key);

                request.onsuccess = event => {
                    resolve(event.target.result || null);
                };
                request.onerror = event => reject(event.target.error);
            });
        } catch (error) {
            console.error("[SessionStorageManager] Error loading session:", error);
            // On failure, return null so the app can fallback to localStorage
            return null;
        }
    }

    /**
     * Clears all session data from IndexedDB.
     * @returns {Promise<void>}
     */
    async clearAllSessions() {
        try {
            const db = await this.init();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction([this.storeName], "readwrite");
                const store = transaction.objectStore(this.storeName);

                const request = store.clear();

                request.onsuccess = () => resolve();
                request.onerror = event => reject(event.target.error);
            });
        } catch (error) {
            console.error("[SessionStorageManager] Error clearing sessions:", error);
            throw error;
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = SessionStorageManager;
}
