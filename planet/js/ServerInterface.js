// Copyright (c) 2017 Euan Ong
// Copyright (c) 2026 Music Blocks Contributors (Git backend adapter)
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

   RequestManager, CacheManager
*/
/*
   exported

   ServerInterface
*/

/**
 * ServerInterface
 *
 * Talks to the new Express + SQLite backend instead of the legacy PHP server.
 * Keeps the same class name and public API so no other file needs to change.
 *
 * ── Key design decisions ──────────────────────────────────────────────────
 *
 * 1. Response normalisation
 *    Every public method returns data in the same shape the existing UI
 *    classes (GlobalPlanet, GlobalCard, ProjectViewer, Publisher) already
 *    expect:  { success: bool, data: ... }
 *
 * 2. TagsManifest built from SQLite, not hardcoded
 *    getTagManifest() calls GET /allRepos to collect all distinct topics
 *    from the live database and builds a TagsManifest object dynamically.
 *    Connectivity is detected from whether that request succeeds.
 *
 * 3. Thumbnail lazy-loading
 *    hasThumbnail (0/1) in every project row; image URL only injected when
 *    hasThumbnail===1.  getThumbnailUrl() returns the REST path used as src.
 *
 * 4. Ownership keys in localStorage
 *    POST /create returns a plain-text key that must be kept by the client.
 *    Stored as  mb_git_key_<repoName>  in localStorage.
 *
 * 5. Two-step publish
 *    addProject()     → POST /create  (visible=0, key saved)
 *    publishProject() → POST /publish (verifyOwner, visible=1)
 *    Publisher.js calls both in sequence.
 *
 * 6. Fork creates a GitHub repo immediately
 *    forkProject() calls POST /fork so the fork is persisted on GitHub and
 *    a new ownership key is returned.
 *
 * ─────────────────────────────────────────────────────────────────────────
 */
class ServerInterface {
    /**
     * @param {Object} Planet - The Planet root object passed by Planet.js
     */
    constructor(Planet) {
        this.Planet = Planet;

        // Base URL for the Express backend. Reads from env.js if set.
        this.BaseURL = (window.MB_GIT_BACKEND_URL || "http://localhost:5000") + "/api/github";

        this.ConnectionFailureData = { success: false, error: "ERROR_CONNECTION_FAILURE" };

        // Per-request rate limiting / retry (reuse existing RequestManager)
        this.requestManager = new RequestManager({
            minDelay:        300,
            maxRetries:      3,
            baseRetryDelay:  1000,
            maxConcurrent:   4
        });

        // IndexedDB cache (reuse existing CacheManager)
        this.cacheManager = new CacheManager({
            dbName:          "MusicBlocksGitCache",
            metadataExpiry:  30 * 60 * 1000,           // 30 minutes
            projectExpiry:   7 * 24 * 60 * 60 * 1000,  // 7 days
            maxCacheSize:    200
        });

        this.cacheInitialized = false;

        // Number of repos sampled when building the topic manifest
        this._TOPIC_SAMPLE_LIMIT = 200;

        // localStorage key prefix for ownership keys
        this._KEY_PREFIX = "mb_git_key_";
    }

    // ── Initialisation ─────────────────────────────────────────────────────

    async init() {
        this._initCache().catch(err =>
            console.warn("[ServerInterface] Cache init failed (non-fatal):", err)
        );
        console.debug("[ServerInterface] Initialised — backend:", this.BaseURL);
    }

    async _initCache() {
        if (!this.cacheInitialized) {
            this.cacheInitialized = await this.cacheManager.init();
        }
        return this.cacheInitialized;
    }

    // ── Internal fetch helpers ─────────────────────────────────────────────

    /**
     * Low-level GET — returns parsed JSON or null on network error.
     * @param {string} path  e.g. "/allRepos?page=1"
     * @returns {Promise<any|null>}
     */
    async _get(path) {
        try {
            const res = await fetch(this.BaseURL + path, {
                method:  "GET",
                headers: { "Accept": "application/json" }
            });
            if (!res.ok) {
                console.warn(`[ServerInterface] GET ${path} → HTTP ${res.status}`);
                return null;
            }
            return await res.json();
        } catch (err) {
            console.error(`[ServerInterface] GET ${path} failed:`, err);
            return null;
        }
    }

    /**
     * Low-level POST / PUT — returns parsed JSON or null on network error.
     * @param {string}         path
     * @param {Object}         body
     * @param {"POST"|"PUT"}   method
     * @returns {Promise<any|null>}
     */
    async _post(path, body, method = "POST") {
        try {
            const res = await fetch(this.BaseURL + path, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    "Accept":       "application/json"
                },
                body: JSON.stringify(body)
            });
            if (!res.ok) {
                const text = await res.text().catch(() => "");
                console.warn(`[ServerInterface] ${method} ${path} → HTTP ${res.status}`, text);
                try { return JSON.parse(text); } catch (_) { return null; }
            }
            return await res.json();
        } catch (err) {
            console.error(`[ServerInterface] ${method} ${path} failed:`, err);
            return null;
        }
    }

    // ── Ownership key helpers ──────────────────────────────────────────────

    /** Saves the ownership key for a repo in localStorage. */
    saveKey(repoName, key) {
        try {
            localStorage.setItem(this._KEY_PREFIX + repoName, key);
        } catch (e) {
            console.warn("[ServerInterface] Could not save key to localStorage:", e);
        }
    }

    /** Retrieves the stored ownership key for a repo, or null if not found. */
    getKey(repoName) {
        try {
            return localStorage.getItem(this._KEY_PREFIX + repoName);
        } catch (e) {
            return null;
        }
    }

    /** Returns true if this browser owns the given repo. */
    ownsRepo(repoName) {
        return this.getKey(repoName) !== null;
    }

    // ── Thumbnail helpers ──────────────────────────────────────────────────

    /**
     * Returns the REST URL to fetch a project thumbnail.
     * Only call when hasThumbnail === 1.
     * @param {string} repoName
     * @returns {string}
     */
    getThumbnailUrl(repoName) {
        return `${this.BaseURL}/thumbnail/${encodeURIComponent(repoName)}`;
    }

    // ── Response normalisers ───────────────────────────────────────────────

    /**
     * Converts a raw SQLite project row into the shape GlobalPlanet.cache expects.
     * @param {Object} row  - project row from /project/:repoName or /allRepos
     * @returns {Object}    - normalised project cache entry
     */
    _normaliseProjectRow(row) {
        const tags = row.theme
            ? row.theme.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
            : [];

        return {
            // Identity
            repoName:             row.repoName,
            planetId:             row.planetId || null,

            // Display fields (legacy names expected by UI classes)
            ProjectName:          row.projectName     || "",
            ProjectDescription:   row.description     || "",
            ProjectCreatorName:   row.creatorName     || "",
            ProjectTags:          tags,
            ProjectIsMusicBlocks: row.isMusicBlocks   ?? 1,

            // Stats
            ProjectLikes:         row.likes           || 0,
            ProjectDownloads:     row.downloads       || 0,

            // Dates
            ProjectCreatedDate:   row.createdAt       || null,
            ProjectLastUpdated:   row.updatedAt       || null,

            // Thumbnail: GlobalCard lazy-loads this via IntersectionObserver
            // using the hasThumbnail flag.  ProjectImage is only set here for
            // legacy data-URL images (migrated projects without a REST thumbnail).
            ProjectImage: (row.hasThumbnail !== 1 && row.projectImage)
                ? row.projectImage
                : null,

            // Loaded lazily by downloadProject()
            ProjectData:  null,

            // Metadata flags
            hasThumbnail: row.hasThumbnail || 0,
            visible:      row.visible      || 0,
            isMigrated:   row.isMigrated   || 0
        };
    }

    /**
     * Converts a paginated /allRepos or /search response into
     * [ [repoName, updatedAt], ... ] — the format GlobalPlanet.addProjects() uses.
     *
     * Also pre-populates GlobalPlanet.cache so the per-project getProjectDetails()
     * round-trip is skipped for rows already present in the page.
     *
     * @param {Object} apiResponse  - { data: [], meta: {} }
     * @returns {{ success: boolean, data: Array }}
     */
    _normaliseProjectList(apiResponse) {
        if (!apiResponse || !Array.isArray(apiResponse.data)) {
            return this.ConnectionFailureData;
        }

        const Planet = this.Planet;

        // Pre-populate GlobalPlanet.cache from the list response
        if (Planet.GlobalPlanet && Planet.GlobalPlanet.cache) {
            for (const row of apiResponse.data) {
                if (!Planet.GlobalPlanet.cache[row.repoName]) {
                    Planet.GlobalPlanet.cache[row.repoName] = this._normaliseProjectRow(row);
                }
            }
        }

        const list = apiResponse.data.map(row => [row.repoName, row.updatedAt]);
        return { success: true, data: list };
    }

    // ── Tag manifest — built dynamically from SQLite topics ───────────────

    /**
     * Probes the backend for connectivity and builds a TagsManifest from
     * the distinct topics present in the live SQLite database.
     *
     * Manifest format (matches what GlobalTag / Publisher expect):
     *   { "music": { TagName: "Music", IsTagUserAddable: "1", IsDisplayTag: "1" }, ... }
     *
     * Keys are lowercase topic strings, not legacy numeric IDs.
     *
     * @param {Function} callback  called with { success: bool, data: manifest }
     */
    async getTagManifest(callback) {
        try {
            const manifestResponse = await this._get("/tagManifest");
            if (
                manifestResponse &&
                manifestResponse.success &&
                manifestResponse.data &&
                !Array.isArray(manifestResponse.data)
            ) {
                callback({ success: true, data: manifestResponse.data });
                return;
            }

            const response = manifestResponse && Array.isArray(manifestResponse.data)
                ? manifestResponse
                : await this._get(
                    `/allRepos?page=1&limit=${this._TOPIC_SAMPLE_LIMIT}&sort=likes`
                );

            if (!response || !Array.isArray(response.data)) {
                callback(this.ConnectionFailureData);
                return;
            }

            // Count topic occurrences across all sampled projects
            const topicCounts = {};
            for (const row of response.data) {
                if (!row.theme) continue;
                for (const rawTopic of row.theme.split(",")) {
                    const topic = rawTopic.trim().toLowerCase();
                    if (topic) topicCounts[topic] = (topicCounts[topic] || 0) + 1;
                }
            }

            // Sort by usage; mark the top N as primary display tags
            const PRIMARY_TAG_LIMIT = 8;
            const sortedTopics = Object.entries(topicCounts)
                .sort((a, b) => b[1] - a[1]);

            const manifest = {};
            let primaryCount = 0;

            for (const [topic, count] of sortedTopics) {
                const isDisplay = primaryCount < PRIMARY_TAG_LIMIT;
                manifest[topic] = {
                    TagName:          topic.charAt(0).toUpperCase() + topic.slice(1),
                    IsTagUserAddable: "1",
                    IsDisplayTag:     isDisplay ? "1" : "0",
                    usageCount:       count
                };
                if (isDisplay) primaryCount++;
            }

            callback({ success: true, data: manifest });
        } catch (err) {
            console.error("[ServerInterface] getTagManifest error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Browse ─────────────────────────────────────────────────────────────

    /**
     * Fetches a page of public projects from SQLite.
     * Maps the legacy signature (tags, sort, start, end) to the REST API.
     *
     * @param {string|null}  tags      "ALL_PROJECTS" | "USER_PROJECTS" | JSON tag array
     * @param {string}       sort      "RECENT" | "LIKED" | "DOWNLOADED" | "ALPHABETICAL"
     * @param {number}       start     zero-based start index
     * @param {number}       end       exclusive end index
     * @param {Function}     callback  called with { success, data: [[repoName, updatedAt], ...] }
     */
    async downloadProjectList(tags, sort, start, end, callback) {
        try {
            const limit = end - start;
            const page  = Math.floor(start / limit) + 1;

            const sortMap = {
                "RECENT":       "createdAt",
                "LIKED":        "likes",
                "DOWNLOADED":   "downloads",
                "ALPHABETICAL": "projectName"
            };
            const sortParam = sortMap[sort] || "createdAt";

            // Resolve topic filter from legacy tag array
            let topicParam = "";
            if (tags && tags !== "ALL_PROJECTS" && tags !== "USER_PROJECTS") {
                try {
                    const tagArray = JSON.parse(tags);
                    if (Array.isArray(tagArray) && tagArray.length > 0) {
                        topicParam = `&topic=${encodeURIComponent(tagArray[0])}`;
                    }
                } catch (_) {
                    topicParam = `&topic=${encodeURIComponent(tags)}`;
                }
            }

            // MY PROJECTS: filter by keys stored in localStorage
            if (tags === "USER_PROJECTS") {
                callback({ success: true, data: this._getOwnedProjectList() });
                return;
            }

            const response = await this._get(
                `/allRepos?page=${page}&limit=${limit}&sort=${sortParam}${topicParam}`
            );

            callback(this._normaliseProjectList(response));
        } catch (err) {
            console.error("[ServerInterface] downloadProjectList error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    /**
     * Returns [[repoName, updatedAt]] for every project this browser owns
     * (keys stored in localStorage with the mb_git_key_ prefix).
     * @returns {Array}
     */
    _getOwnedProjectList() {
        const list = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this._KEY_PREFIX)) {
                    const repoName = key.slice(this._KEY_PREFIX.length);
                    list.push([repoName, new Date().toISOString()]);
                }
            }
        } catch (_) { /* localStorage unavailable */ }
        return list;
    }

    // ── Search ─────────────────────────────────────────────────────────────

    /**
     * Full-text search using the SQLite FTS5 index (BM25 ranking).
     *
     * @param {string}   query     search string
     * @param {string}   sort      ignored for search (BM25 handles ranking)
     * @param {number}   start     zero-based start index
     * @param {number}   end       exclusive end index
     * @param {Function} callback  called with { success, data }
     */
    async searchProjects(query, sort, start, end, callback) {
        if (!query || !query.trim()) {
            callback({ success: true, data: [] });
            return;
        }

        try {
            const limit = end - start;
            const page  = Math.floor(start / limit) + 1;

            const response = await this._get(
                `/search?q=${encodeURIComponent(query.trim())}&page=${page}&limit=${limit}`
            );

            callback(this._normaliseProjectList(response));
        } catch (err) {
            console.error("[ServerInterface] searchProjects error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Project detail ─────────────────────────────────────────────────────

    /**
     * Fetches full metadata for one project from SQLite.
     * Checks IDB cache first; caches successful responses.
     *
     * @param {string}   repoName  GitHub repo slug
     * @param {Function} callback  called with { success, data: normalisedRow }
     */
    async getProjectDetails(repoName, callback) {
        try {
            await this._initCache();
            const cached = await this.cacheManager.getMetadata(repoName);
            if (cached) {
                callback({ success: true, data: cached });
                return;
            }

            const response = await this._get(`/project/${encodeURIComponent(repoName)}`);

            if (!response || response.error) {
                callback(this.ConnectionFailureData);
                return;
            }

            const normalised = this._normaliseProjectRow(response);
            await this.cacheManager.cacheMetadata(repoName, normalised);

            callback({ success: true, data: normalised });
        } catch (err) {
            console.error("[ServerInterface] getProjectDetails error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Project data (raw JSON blocks) ────────────────────────────────────

    /**
     * Downloads the raw projectData.json for a project.
     * Checks IDB cache first; caches successful responses.
     *
     * @param {string}   repoName  GitHub repo slug
     * @param {Function} callback  called with { success, data: projectJSON }
     */
    async downloadProject(repoName, callback) {
        try {
            await this._initCache();
            const cached = await this.cacheManager.getProject(repoName);
            if (cached) {
                callback({ success: true, data: cached });
                return;
            }

            const response = await this._get(
                `/getProjectData?repoName=${encodeURIComponent(repoName)}`
            );

            if (!response || !response.content) {
                callback(this.ConnectionFailureData);
                return;
            }

            const projectData = response.content;
            await this.cacheManager.cacheProject(repoName, projectData);

            callback({ success: true, data: projectData });
        } catch (err) {
            console.error("[ServerInterface] downloadProject error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Create / Publish (two-step flow) ──────────────────────────────────

    /**
     * STEP 1 — Creates a new GitHub repo + SQLite row (visible=0).
     * The returned key is stored in localStorage.
     *
     * @param {string}   serialisedProjectJSON  JSON string from Publisher
     * @param {Function} callback               called with { success, key, repository }
     */
    async addProject(serialisedProjectJSON, callback) {
        try {
            let projectObj;
            try {
                projectObj = JSON.parse(serialisedProjectJSON);
            } catch (e) {
                callback({ success: false, error: "INVALID_PROJECT_JSON" });
                return;
            }

            const body = {
                projectData: projectObj.ProjectData    || projectObj.projectData,
                projectName: projectObj.ProjectName    || projectObj.projectName  || "Untitled",
                repoName:    projectObj.repoName       || projectObj.ProjectName  || "untitled",
                description: projectObj.ProjectDescription || projectObj.description || "",
                theme:       projectObj.theme || (
                    Array.isArray(projectObj.ProjectTags)
                        ? projectObj.ProjectTags.join(",")
                        : "music"
                ),
                creatorName: projectObj.ProjectCreatorName || projectObj.creatorName || "",
                thumbnail:   projectObj.thumbnail || projectObj.ProjectImage || ""
            };

            const response = await this._post("/create", body);

            if (!response || !response.key || !response.repository) {
                callback({ success: false, error: response?.error || "CREATE_FAILED" });
                return;
            }

            this.saveKey(response.repository, response.key);

            callback({ success: true, key: response.key, repository: response.repository });
        } catch (err) {
            console.error("[ServerInterface] addProject error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    /**
     * STEP 2 — Publishes a project to the Global Planet tab (sets visible=1).
     * Requires the ownership key returned by addProject().
     *
     * @param {string}   repoName    repo slug returned by addProject()
     * @param {string}   key         plain-text ownership key
     * @param {Function} callback    called with { success: bool }
     * @param {string}   [projectName]
     * @param {string}   [description]
     * @param {string[]} [tags]
     * @param {string}   [thumbnail] base64 PNG data URL — the canvas state at publish
     *                               time, used as the canonical thumbnail on GitHub
     */
    async publishProject(repoName, key, callback, projectName, description, tags, thumbnail) {
        try {
            const body = { repoName, key };
            if (projectName && typeof projectName === "string" && projectName.trim()) {
                body.projectName = projectName.trim();
            }
            if (description && typeof description === "string") {
                body.description = description.trim();
            }
            if (Array.isArray(tags) && tags.length > 0) {
                body.tags = tags;
            }
            // Include the canvas-at-publish thumbnail so the backend can write
            // the correct image to GitHub (overwriting any blank placeholder).
            if (thumbnail && typeof thumbnail === "string" && thumbnail.startsWith("data:image/")) {
                body.thumbnail = thumbnail;
            }
            const response = await this._post("/publish", body);


            if (!response || response.error) {
                callback({ success: false, error: response?.error || "PUBLISH_FAILED" });
                return;
            }

            callback({ success: true, message: response.message });
        } catch (err) {
            console.error("[ServerInterface] publishProject error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Edit ───────────────────────────────────────────────────────────────

    /**
     * Commits updated projectData.json to a repo's main branch.
     * Requires the ownership key stored by addProject().
     *
     * @param {string}   repoName
     * @param {string}   key
     * @param {Object}   projectData
     * @param {string}   commitMessage
     * @param {Function} callback
     */
    async editProject(repoName, key, projectData, commitMessage, callback) {
        try {
            const response = await this._post(
                "/edit",
                { repoName, key, projectData, commitMessage },
                "PUT"
            );

            if (!response || response.error) {
                callback({ success: false, error: response?.error || "EDIT_FAILED" });
                return;
            }

            // Invalidate the IDB cache entry for this project
            await this._initCache();
            await this.cacheManager.cacheProject(repoName, null);

            callback({ success: true });
        } catch (err) {
            console.error("[ServerInterface] editProject error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Fork ───────────────────────────────────────────────────────────────

    /**
     * Forks an existing project on GitHub (shallow copy, new repo + new key).
     *
     * @param {string}   sourceRepoName  repo to fork
     * @param {Function} callback        called with { success, repository, key }
     */
    async forkProject(sourceRepoName, callback) {
        try {
            const response = await this._post("/fork", { repositoryName: sourceRepoName });

            if (!response || !response.key || !response.repoName) {
                callback({ success: false, error: response?.error || "FORK_FAILED" });
                return;
            }

            this.saveKey(response.repoName, response.key);

            callback({
                success:     true,
                repository:  response.repoName,
                key:         response.key,
                projectData: response.projectData || null,
                description: response.description || ""
            });
        } catch (err) {
            console.error("[ServerInterface] forkProject error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Like ───────────────────────────────────────────────────────────────

    /**
     * Toggles a like for a project in SQLite.
     * Uses Planet.UserID as the anonymous userId (cookie-based UUID).
     *
     * @param {string}   repoName
     * @param {boolean}  like      true to like, false to unlike
     * @param {Function} callback  called with { success, likes }
     */
    async likeProject(repoName, like, callback) {
        try {
            const userId   = this.Planet.UserID || "anon";
            const response = await this._post("/like", { repoName, userId, like });

            if (!response || response.error) {
                callback({ success: false, error: response?.error || "LIKE_FAILED" });
                return;
            }

            callback({ success: true, likes: response.likes });
        } catch (err) {
            console.error("[ServerInterface] likeProject error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Report ─────────────────────────────────────────────────────────────

    /**
     * Reports a project for moderation (creates a GitHub Issue in mb-moderation).
     *
     * @param {string}   repoName
     * @param {string}   description  reason for the report
     * @param {Function} callback     called with { success: bool }
     */
    async reportProject(repoName, description, callback) {
        try {
            const response = await this._post("/report", { repoName, description });

            if (!response || response.error) {
                callback({ success: false, error: response?.error || "REPORT_FAILED" });
                return;
            }

            callback({ success: true });
        } catch (err) {
            console.error("[ServerInterface] reportProject error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Download ZIP ───────────────────────────────────────────────────────

    /**
     * Triggers a ZIP download of the project via the backend.
     * The browser handles the file-save dialog.
     *
     * @param {string} repoName
     */
    downloadProjectZip(repoName) {
        const url = `${this.BaseURL}/download/${encodeURIComponent(repoName)}`;
        const a   = document.createElement("a");
        a.href     = url;
        a.download = `${repoName}.zip`;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // ── Commit history ─────────────────────────────────────────────────────

    /**
     * Returns the git commit history for a project.
     *
     * @param {string}   repoName
     * @param {Function} callback  called with { success, data: CommitEntry[] }
     */
    async getCommitHistory(repoName, callback) {
        try {
            const response = await this._get(
                `/commitHistory?repoName=${encodeURIComponent(repoName)}`
            );

            if (!Array.isArray(response)) {
                callback(this.ConnectionFailureData);
                return;
            }

            callback({ success: true, data: response });
        } catch (err) {
            console.error("[ServerInterface] getCommitHistory error:", err);
            callback(this.ConnectionFailureData);
        }
    }

    // ── Cache management ───────────────────────────────────────────────────

    async clearCache() {
        return this.cacheManager.clearAll();
    }

    async clearExpiredCache() {
        return this.cacheManager.clearExpired();
    }

    async getStats() {
        return {
            requests: this.requestManager.getStats(),
            cache:    await this.cacheManager.getStats()
        };
    }
}

if (typeof module !== "undefined") {
    module.exports = ServerInterface;
}
