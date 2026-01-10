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
   global localforage
*/

/*
   exported SnapshotStorage
*/

/**
 * Minimal storage helper for project snapshots.
 * Stores snapshots in IndexedDB using localforage.
 * 
 * This is a read-only history feature - no restore, delete, or cleanup.
 */
class SnapshotStorage {
    constructor() {
        this.LocalStorage = null;
        this.LocalStorageKey = "SnapshotHistory";
        this.data = null;

        // eslint-disable-next-line no-unused-vars
        this.dataLoaded = new Promise((resolve, reject) => {
            this.fireDataLoaded = resolve;
        });
    }

    /**
     * Generate a unique ID for a snapshot
     * @returns {string} Unique snapshot ID
     */
    generateID() {
        const n = Date.now();
        const prefix = n.toString();

        let suffix = "";
        for (let i = 0; i < 3; i++) suffix += Math.floor(Math.random() * 10).toString();

        return prefix + suffix;
    }

    /**
     * Save a snapshot of the current project
     * @param {string} projectId - Current project ID
     * @param {string} projectData - Serialized project data from prepareExport()
     * @param {string} description - Optional user description
     * @returns {Promise<string>} The snapshot ID
     */
    async saveSnapshot(projectId, projectData, description) {
        await this.dataLoaded;

        const snapshotId = this.generateID();
        const snapshot = {
            id: snapshotId,
            timestamp: Date.now(),
            projectId: projectId,
            description: description || "",
            projectData: projectData
        };

        // Initialize snapshots array if needed
        if (!this.data.snapshots) {
            this.data.snapshots = [];
        }

        this.data.snapshots.push(snapshot);
        await this.save();

        return snapshotId;
    }

    /**
     * Get all snapshots for a specific project
     * @param {string} projectId - Project ID to filter by
     * @returns {Promise<Array>} Array of snapshots for the project
     */
    async getSnapshots(projectId) {
        await this.dataLoaded;

        if (!this.data.snapshots) {
            return [];
        }

        return this.data.snapshots.filter(snapshot => snapshot.projectId === projectId);
    }

    /**
     * Get a specific snapshot by ID
     * @param {string} snapshotId - Snapshot ID
     * @returns {Promise<Object|null>} Snapshot object or null if not found
     */
    async getSnapshot(snapshotId) {
        await this.dataLoaded;

        if (!this.data.snapshots) {
            return null;
        }

        return this.data.snapshots.find(snapshot => snapshot.id === snapshotId) || null;
    }

    // Internal storage methods

    async set(key, obj) {
        const jsonobj = JSON.stringify(obj);
        await this.LocalStorage.setItem(key, jsonobj);
        const savedjsonobj = await this.LocalStorage.getItem(key);

        if (savedjsonobj == null) throw new Error("Failed to save snapshot data");
    }

    async get(key) {
        const jsonobj = await this.LocalStorage.getItem(key);

        if (jsonobj === null || jsonobj === "") return null;

        try {
            return JSON.parse(jsonobj);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log(e);
            return null;
        }
    }

    async save() {
        await this.set(this.LocalStorageKey, this.data);
    }

    async restore() {
        const currentData = await this.get(this.LocalStorageKey);

        try {
            this.data = typeof currentData === "string" ? JSON.parse(currentData) : currentData;
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log(e);
            return null;
        }
    }

    async initialiseStorage() {
        if (this.data === null || this.data === undefined) {
            this.data = {};
        }

        if (this.data.snapshots === null || this.data.snapshots === undefined) {
            this.data.snapshots = [];
        }

        this.fireDataLoaded();
        await this.save();
    }

    async init() {
        // Use IndexedDB via localforage (same as ProjectStorage)
        this.LocalStorage = localforage;
        await this.restore();
        await this.initialiseStorage();
    }
}
