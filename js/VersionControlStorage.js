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
   exported VersionControlStorage
*/

/**
 * Class representing the Version Control Storage system.
 * Uses IndexedDB via localforage to store project version snapshots.
 * @class
 */
class VersionControlStorage {
    /**
     * Creates an instance of VersionControlStorage.
     * @constructor
     * @param {Object} Planet - The Planet object containing ProjectStorage.
     */
    constructor(Planet) {
        this.Planet = Planet;
        this.LocalStorage = null;
        this.StorageKey = "VersionControlData";
        this.MaxVersions = 10;
        this.data = null;
    }

    /**
     * Initialize the storage system.
     * @returns {Promise<void>}
     */
    async init() {
        this.LocalStorage = localforage.createInstance({
            name: "MusicBlocksVersionControl"
        });
        await this.restore();
        await this.initialiseStorage();
    }

    /**
     * Initialize storage structure if not exists.
     * @returns {Promise<void>}
     */
    async initialiseStorage() {
        if (this.data === null || this.data === undefined) {
            this.data = {};
        }

        if (this.data.Projects === null || this.data.Projects === undefined) {
            this.data.Projects = {};
        }

        await this.save();
    }

    /**
     * Save data to IndexedDB.
     * @returns {Promise<void>}
     */
    async save() {
        const jsonobj = JSON.stringify(this.data);
        await this.LocalStorage.setItem(this.StorageKey, jsonobj);
    }

    /**
     * Restore data from IndexedDB.
     * @returns {Promise<void>}
     */
    async restore() {
        const jsonobj = await this.LocalStorage.getItem(this.StorageKey);

        if (jsonobj === null || jsonobj === "") {
            this.data = null;
            return;
        }

        try {
            this.data = JSON.parse(jsonobj);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.error("VersionControlStorage: Failed to parse stored data", e);
            this.data = null;
        }
    }

    /**
     * Generate a unique ID for a version.
     * @returns {string} A unique version ID.
     */
    generateVersionId() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
        return `v_${timestamp}_${random}`;
    }

    /**
     * Get the current project ID from ProjectStorage.
     * @returns {string|null} The current project ID.
     */
    getCurrentProjectId() {
        if (this.Planet && this.Planet.ProjectStorage) {
            return this.Planet.ProjectStorage.getCurrentProjectID();
        }
        return null;
    }

    /**
     * Get the current project data from ProjectStorage.
     * @returns {Promise<Object|null>} The current project data.
     */
    async getCurrentProjectData() {
        if (this.Planet && this.Planet.ProjectStorage) {
            return await this.Planet.ProjectStorage.getCurrentProjectData();
        }
        return null;
    }

    /**
     * Get the current project image from ProjectStorage.
     * @returns {string|null} The current project image.
     */
    getCurrentProjectImage() {
        if (this.Planet && this.Planet.ProjectStorage) {
            return this.Planet.ProjectStorage.getCurrentProjectImage();
        }
        return null;
    }

    /**
     * Get the current project name from ProjectStorage.
     * @returns {string} The current project name.
     */
    getCurrentProjectName() {
        if (this.Planet && this.Planet.ProjectStorage) {
            return this.Planet.ProjectStorage.getCurrentProjectName();
        }
        return "Unnamed Project";
    }

    /**
     * Save a new version of the current project.
     * @param {string} description - A description for this version.
     * @returns {Promise<Object>} The saved version object.
     */
    async saveVersion(description) {
        const projectId = this.getCurrentProjectId();
        if (!projectId) {
            throw new Error("No project is currently open");
        }

        const projectData = await this.getCurrentProjectData();
        const projectImage = this.getCurrentProjectImage();
        const projectName = this.getCurrentProjectName();

        const version = {
            id: this.generateVersionId(),
            timestamp: Date.now(),
            description: description || "",
            projectName: projectName,
            projectData: projectData,
            projectImage: projectImage
        };

        // Initialize project versions array if needed
        if (!this.data.Projects[projectId]) {
            this.data.Projects[projectId] = [];
        }

        // Add new version
        this.data.Projects[projectId].push(version);

        // Auto-cleanup: remove oldest versions if exceeding max
        while (this.data.Projects[projectId].length > this.MaxVersions) {
            this.data.Projects[projectId].shift();
        }

        await this.save();
        return version;
    }

    /**
     * Get all versions for the current project.
     * @returns {Promise<Array>} Array of version objects, newest first.
     */
    async getVersions() {
        const projectId = this.getCurrentProjectId();
        if (!projectId) {
            return [];
        }

        const versions = this.data.Projects[projectId] || [];
        // Return a copy sorted by timestamp (newest first)
        return [...versions].sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get a specific version by ID.
     * @param {string} versionId - The version ID to retrieve.
     * @returns {Promise<Object|null>} The version object or null.
     */
    async getVersion(versionId) {
        const projectId = this.getCurrentProjectId();
        if (!projectId || !this.data.Projects[projectId]) {
            return null;
        }

        return this.data.Projects[projectId].find(v => v.id === versionId) || null;
    }

    /**
     * Restore a specific version.
     * This saves the current state as a backup before restoring.
     * @param {string} versionId - The version ID to restore.
     * @returns {Promise<Object>} The restored version object.
     */
    async restoreVersion(versionId) {
        const version = await this.getVersion(versionId);
        if (!version) {
            throw new Error("Version not found");
        }

        // Save current state as a backup before restoring
        await this.saveVersion("Auto-backup before restore");

        // Restore the project data
        if (this.Planet && this.Planet.ProjectStorage) {
            const projectId = this.getCurrentProjectId();
            if (projectId && this.Planet.ProjectStorage.data.Projects[projectId]) {
                this.Planet.ProjectStorage.data.Projects[projectId].ProjectData = version.projectData;
                this.Planet.ProjectStorage.data.Projects[projectId].ProjectImage = version.projectImage;
                this.Planet.ProjectStorage.data.Projects[projectId].DateLastModified = Date.now();
                await this.Planet.ProjectStorage.save();
            }
        }

        return version;
    }

    /**
     * Delete a specific version.
     * @param {string} versionId - The version ID to delete.
     * @returns {Promise<boolean>} True if deleted, false if not found.
     */
    async deleteVersion(versionId) {
        const projectId = this.getCurrentProjectId();
        if (!projectId || !this.data.Projects[projectId]) {
            return false;
        }

        const index = this.data.Projects[projectId].findIndex(v => v.id === versionId);
        if (index === -1) {
            return false;
        }

        this.data.Projects[projectId].splice(index, 1);
        await this.save();
        return true;
    }

    /**
     * Delete all versions for the current project.
     * @returns {Promise<void>}
     */
    async deleteAllVersions() {
        const projectId = this.getCurrentProjectId();
        if (!projectId) {
            return;
        }

        this.data.Projects[projectId] = [];
        await this.save();
    }

    /**
     * Get the count of versions for the current project.
     * @returns {Promise<number>} The number of versions.
     */
    async getVersionCount() {
        const projectId = this.getCurrentProjectId();
        if (!projectId || !this.data.Projects[projectId]) {
            return 0;
        }

        return this.data.Projects[projectId].length;
    }
}

// Export for use in browser and tests
if (typeof module !== "undefined" && module.exports) {
    module.exports = { VersionControlStorage };
}
