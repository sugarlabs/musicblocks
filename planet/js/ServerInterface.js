// Copyright (c) 2017 Euan Ong
// Copyright (c) 2026 Music Blocks Contributors (rate limiting and caching enhancements)
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
   global

   jQuery, RequestManager, CacheManager
*/
/*
   exported

   ServerInterface
*/

// eslint-disable-next-line no-unused-vars
class ServerInterface {
    constructor(Planet) {
        this.Planet = Planet;
        this.ServerURL = "https://musicblocks.sugarlabs.org/planet-server/index.php";
        this.ConnectionFailureData = { success: false, error: "ERROR_CONNECTION_FAILURE" };
        this.APIKey = "3f2d3a4c-c7a4-4c3c-892e-ac43784f7381";
        this.disablePlanetCache = this.shouldDisablePlanetCache();

        // Initialize RequestManager for rate limiting and retry logic
        this.requestManager = new RequestManager({
            minDelay: 500, // 500ms between requests
            maxRetries: 3, // Retry up to 3 times
            baseRetryDelay: 1000, // Start with 1s delay for retries
            maxConcurrent: 3 // Max 3 concurrent requests
        });

        // Initialize CacheManager for offline caching
        this.cacheManager = new CacheManager({
            dbName: "MusicBlocksPlanetCache",
            metadataExpiry: 24 * 60 * 60 * 1000, // 24 hours
            projectExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
            maxCacheSize: 100
        });

        this.cacheInitialized = false;
    }

    /**
     * Determines whether Planet caching should be disabled.
     * @returns {boolean}
     */
    shouldDisablePlanetCache() {
        const runtimeEnv = window.MB_ENV;

        if (runtimeEnv === "production") {
            return false;
        }

        return true;
    }

    /**
     * Initializes the cache manager
     * @returns {Promise<boolean>}
     */
    async initCache() {
        if (!this.cacheInitialized) {
            this.cacheInitialized = await this.cacheManager.init();
        }
        return this.cacheInitialized;
    }

    /**
     * Makes a raw request without rate limiting (for backwards compatibility)
     * @param {Object} data - Request data
     * @param {Function} callback - Callback function
     */
    request(data, callback) {
        data["api-key"] = this.APIKey;

        // eslint-disable-next-line no-unused-vars
        const req = jQuery
            .ajax({
                type: "POST",
                url: this.ServerURL,
                data: data
            })
            .done(data => {
                callback(data);
            })
            .fail(() => {
                callback(this.ConnectionFailureData);
            });
    }

    /**
     * Makes a throttled request with rate limiting and retry logic
     * @param {Object} data - Request data
     * @param {Function} callback - Callback function
     */
    async throttledRequest(data, callback) {
        data["api-key"] = this.APIKey;

        try {
            const result = await this.requestManager.throttledRequest(data, resolve => {
                jQuery
                    .ajax({
                        type: "POST",
                        url: this.ServerURL,
                        data: data
                    })
                    .done(responseData => {
                        resolve(responseData);
                    })
                    .fail(() => {
                        resolve(this.ConnectionFailureData);
                    });
            });

            callback(result);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error("[ServerInterface] Request failed after retries:", error);
            callback(this.ConnectionFailureData);
        }
    }

    /**
     * Gets tag manifest (uses throttled request)
     */
    getTagManifest(callback) {
        const obj = { action: "getTagManifest" };
        this.throttledRequest(obj, callback);
    }

    /**
     * Adds a project (uses raw request - no caching for write operations)
     */
    addProject(data, callback) {
        const obj = { action: "addProject", ProjectJSON: data };
        this.request(obj, callback);
    }

    /**
     * Downloads project list with caching support
     */
    async downloadProjectList(ProjectTags, ProjectSort, Start, End, callback) {
        const obj = {
            action: "downloadProjectList",
            ProjectTags: ProjectTags,
            ProjectSort: ProjectSort,
            Start: Start,
            End: End
        };

        this.throttledRequest(obj, callback);
    }

    /**
     * Gets project details with caching support
     */
    async getProjectDetails(ProjectID, callback) {
        if (!this.disablePlanetCache) {
            // Try cache first
            await this.initCache();
            const cached = await this.cacheManager.getMetadata(ProjectID);

            if (cached) {
                // eslint-disable-next-line no-console
                console.debug("[ServerInterface] Returning cached metadata for:", ProjectID);
                callback({ success: true, data: cached });
                return;
            }
        }
        // Fetch from server
        const obj = { action: "getProjectDetails", ProjectID: ProjectID };

        this.throttledRequest(obj, async result => {
            // Cache successful responses
            if (!this.disablePlanetCache && result && result.success && result.data) {
                await this.cacheManager.cacheMetadata(ProjectID, result.data);
            }
            callback(result);
        });
    }

    /**
     * Searches projects (uses throttled request)
     */
    searchProjects(Search, ProjectSort, Start, End, callback) {
        const obj = {
            action: "searchProjects",
            Search: Search,
            ProjectSort: ProjectSort,
            Start: Start,
            End: End
        };
        this.throttledRequest(obj, callback);
    }

    /**
     * Downloads full project data with caching support
     */
    async downloadProject(ProjectID, callback) {
        if (!this.disablePlanetCache) {
            // Try cache first
            await this.initCache();
            const cached = await this.cacheManager.getProject(ProjectID);

            if (cached) {
                // eslint-disable-next-line no-console
                console.debug("[ServerInterface] Returning cached project:", ProjectID);
                callback({ success: true, data: cached });
                return;
            }
        }
        // Fetch from server
        const obj = { action: "downloadProject", ProjectID: ProjectID };

        this.throttledRequest(obj, async result => {
            // Cache successful responses
            if (!this.disablePlanetCache && result && result.success && result.data) {
                await this.cacheManager.cacheProject(ProjectID, result.data);
            }
            callback(result);
        });
    }

    /**
     * Likes a project (uses raw request - no caching for write operations)
     */
    likeProject(ProjectID, Like, callback) {
        const obj = { action: "likeProject", ProjectID: ProjectID, Like: Like ? "true" : "false" };
        this.request(obj, callback);
    }

    /**
     * Reports a project (uses raw request - no caching for write operations)
     */
    reportProject(ProjectID, Description, callback) {
        const obj = { action: "reportProject", ProjectID: ProjectID, Description: Description };
        this.request(obj, callback);
    }

    /**
     * Converts file format (uses throttled request)
     */
    convertFile(From, To, Data, callback) {
        const obj = { action: "convertData", From: From, To: To, Data: Data };
        this.throttledRequest(obj, callback);
    }

    /**
     * Gets statistics from both request and cache managers
     * @returns {Promise<Object>}
     */
    async getStats() {
        const requestStats = this.requestManager.getStats();
        const cacheStats = await this.cacheManager.getStats();

        return {
            requests: requestStats,
            cache: cacheStats
        };
    }

    /**
     * Clears the project cache
     * @returns {Promise<boolean>}
     */
    async clearCache() {
        return await this.cacheManager.clearAll();
    }

    /**
     * Clears expired cache entries
     * @returns {Promise<number>}
     */
    async clearExpiredCache() {
        return await this.cacheManager.clearExpired();
    }

    /**
     * Initializes the server interface
     */
    async init() {
        if (!this.disablePlanetCache) {
            await this.initCache();
        }
        // eslint-disable-next-line no-console
        console.debug(
            `[ServerInterface] Initialized with rate limiting and ${
                this.disablePlanetCache ? "cache disabled (dev mode)" : "caching"
            }`
        );
    }
}
