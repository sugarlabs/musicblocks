// Copyright (c) 2026 Harihara Vardhan
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.

/*
   global

   NetworkMonitor
*/
/*
   exported

   OfflineCommitManager
*/

/**
 * OfflineCommitManager
 *
 * Manages offline commit drafts AND offline repo creation for the Git backend.
 * Everything is stored in ProjectStorage (IndexedDB via localforage).
 *
 * Design rules:
 *  - Student can click "Save a spot" while offline → repo creation is queued locally.
 *  - Commits are saved under a local placeholder repo ID until back online.
 *  - On reconnect: real GitHub repo is created first, then all commits are pushed.
 *  - Max 5 pending drafts per project. If cap is reached, saving is blocked.
 *  - A per-project sync lock prevents concurrent syncs.
 *
 * Offline placeholder ID prefix: "offline-draft-"
 * Any repoName starting with this prefix is a pending creation, not a real GitHub repo.
 *
 * Dependencies: ProjectStorage, ServerInterface, NetworkMonitor
 */
class OfflineCommitManager {
    /**
     * @param {Object} projectStorage   Planet.ProjectStorage instance
     * @param {Object} serverInterface  Planet.ServerInterface instance
     */
    constructor(projectStorage, serverInterface) {
        this.storage = projectStorage;
        this.server = serverInterface;

        // Per-project sync lock map — prevents concurrent syncPending for the same project
        this._syncingProjects = {};

        // Auto-trigger on reconnect
        this._monitor = new NetworkMonitor(() => this._onOnline(), null);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Generates a short random suffix (8 hex chars) for repo name uniqueness.
     * Uses crypto.getRandomValues when available, falls back to Math.random.
     */
    _randomSuffix() {
        if (typeof crypto !== "undefined" && crypto.getRandomValues) {
            const buf = new Uint32Array(1);
            crypto.getRandomValues(buf);
            return buf[0].toString(16).padStart(8, "0");
        }
        return Math.floor(Math.random() * 0xffffffff)
            .toString(16)
            .padStart(8, "0");
    }

    /**
     * Builds a GitHub-safe repo name from a project name + unique suffix.
     * Applies the same sanitization rule the backend uses:
     *   .trim().replace(/[^a-zA-Z0-9._-]/g, '-')
     * so the name survives the backend unchanged.
     * Adding the suffix means GitHub name conflicts are virtually impossible,
     * so the backend will use exactly this string — mbGitRepoName never changes.
     *
     * @param {string} projectName  human-readable project name
     * @returns {string}  e.g. "My-Jazz-Project-3f8a1b2c"
     */
    _buildRepoName(projectName) {
        const base =
            (projectName || "untitled")
                .trim()
                .replace(/[^a-zA-Z0-9._-]/g, "-") // same rule as backend
                .replace(/-{2,}/g, "-") // collapse runs of dashes
                .replace(/^-|-$/g, "") // strip leading/trailing dashes
                .slice(0, 80) || // GitHub repo name limit is 100 chars
            "untitled";
        return `${base}-${this._randomSuffix()}`;
    }

    /**
     * Generates a UUID v4 string for uniquely identifying draft commits.
     * Uses crypto.getRandomValues when available, falls back to Math.random.
     * @returns {string}  e.g. "550e8400-e29b-41d4-a716-446655440000"
     */
    _uuid() {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Polyfill for environments without crypto.randomUUID
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            let r;
            if (typeof crypto !== "undefined" && crypto.getRandomValues) {
                const buf = new Uint8Array(1);
                crypto.getRandomValues(buf);
                r = buf[0] % 16;
            } else {
                r = (Math.random() * 16) | 0;
            }
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * Returns true if a project has a pending (not-yet-created) GitHub repo.
     * We check ProjectStorage directly rather than sniffing the repo name,
     * so the check is reliable even after the naming scheme changes.
     *
     * @param {string} projectId
     * @returns {boolean}
     */
    _hasPendingRepo(projectId) {
        const pending = this.storage.data?.Projects?.[projectId]?.pendingRepoCreation;
        return pending?.status === "pending";
    }

    // ── Public isOnline getter ────────────────────────────────────────────

    /**
     * Public getter — ServerInterface uses this instead of reaching into _monitor.
     * @returns {boolean}
     */
    get isOnline() {
        return this._monitor.isOnline;
    }

    // ── Offline repo creation ─────────────────────────────────────────────

    /**
     * Called when the student clicks "Save a spot" while offline.
     * Queues the repo creation locally and assigns a placeholder repo ID
     * so offline commits can still be saved under it.
     *
     * @param {string} projectId      Planet project ID
     * @param {Object} projectDetails { projectName, description, tags, creatorName, thumbnail }
     * @returns {Promise<{ success: boolean, offline: boolean, repository: string }>}
     */
    async queueRepoCreation(projectId, projectDetails) {
        // Build a GitHub-safe repo name from the project name + unique suffix.
        // This name passes the backend sanitization unchanged, so it becomes
        // the actual GitHub repo name — mbGitRepoName never needs to change.
        const repoName = this._buildRepoName(projectDetails.projectName || "untitled");

        // Store creation details so we can replay POST /create when back online
        await this.storage.setPendingRepoCreation(projectId, {
            ...projectDetails,
            repoName // the final name we will send to POST /create
        });

        // Set GitRepoData immediately so commitProject() can save drafts now.
        // hashedKey is unknown until the server responds — stored as empty string.
        // It will be filled in by _createPendingRepo() on reconnect.
        await this.storage.addGitRepoData(
            projectId,
            repoName,
            projectDetails.description || "",
            projectDetails.tags || [],
            "" // placeholder — filled when repo is created
        );

        console.debug(
            `[OfflineCommitManager] Repo creation queued for project ${projectId}: ${repoName}`
        );

        return { success: true, offline: true, repository: repoName };
    }

    /**
     * Creates the GitHub repo for a project that was started offline.
     * Uses the first offline draft as the initial commit data.
     * Subsequent drafts are pushed via syncPending().
     *
     * @param {string} projectId
     * @param {Object} pendingCreation  the pendingRepoCreation object from ProjectStorage
     * @returns {Promise<void>}
     */
    async _createPendingRepo(projectId, pendingCreation) {
        // Sort drafts oldest-first; the first draft's data becomes the initial commit
        const drafts = (this.storage.data?.Projects?.[projectId]?.commitDrafts || [])
            .filter(d => d.status === "pending")
            .sort((a, b) => a.timestamp - b.timestamp);

        // Use the project's stored data as the initial file content in the repo.
        // Do NOT use drafts[0].data here — all drafts are pushed as proper named
        // commits via syncPending, so the student's first offline commit message
        // appears correctly in the timeline.
        const initialData = this.storage.data?.Projects?.[projectId]?.ProjectData || null;

        // Send the pre-generated repoName (from queueRepoCreation) so the
        // backend uses exactly this name — mbGitRepoName stays the same.
        const payload = JSON.stringify({
            ProjectName: pendingCreation.projectName || "Untitled",
            ProjectData: initialData,
            ProjectDescription: pendingCreation.description || "",
            ProjectTags: pendingCreation.tags || [],
            ProjectCreatorName: pendingCreation.creatorName || "",
            thumbnail: pendingCreation.thumbnail || "",
            repoName: pendingCreation.repoName // pre-generated, GitHub-safe
        });

        const result = await new Promise(resolve => {
            this.server.addProject(payload, resolve);
        });

        if (!result || !result.success) {
            console.error(
                `[OfflineCommitManager] Failed to create pending repo for project ${projectId}:`,
                result?.error
            );
            return;
        }

        // result.repository should equal pendingCreation.repoName (same name we sent).
        // In the rare case GitHub appended a UUID suffix (name conflict), we update
        // GitRepoData with the actual name the server returned.
        const actualRepoName = result.repository;
        const realKey = result.key;

        if (actualRepoName !== pendingCreation.repoName) {
            // Unexpected name change — update GitRepoData and notify parent window
            console.warn(
                `[OfflineCommitManager] Repo name changed by server: ` +
                    `${pendingCreation.repoName} → ${actualRepoName}. Updating GitRepoData.`
            );
        }

        // Update GitRepoData: repoName is confirmed, hashedKey is now known
        await this.storage.addGitRepoData(
            projectId,
            actualRepoName,
            pendingCreation.description || "",
            pendingCreation.tags || [],
            realKey
        );

        // Clear the pending creation flag
        await this.storage.clearPendingRepoCreation(projectId);

        // All drafts (including the first) are pushed as proper named commits
        // via syncPending — do NOT mark any draft as synced here.
        // The repo was initialised with the project's stored data; the student's
        // offline commits will appear in the timeline with their original messages.

        // Notify parent window so toolbar shows the confirmed repo + key
        try {
            window.parent?.postMessage(
                { type: "MB_GIT_STATE", repoName: actualRepoName, hashedKey: realKey },
                "*"
            );
        } catch (_) {
            /* cross-origin guard */
        }

        console.debug(
            `[OfflineCommitManager] Pending repo created: ${actualRepoName}. Syncing all drafts…`
        );

        // Push ALL drafts (draft 1, 2, 3, …) to the real repo as proper commits
        await this.syncPending(projectId, actualRepoName, realKey);
    }

    // ── Connectivity hook ─────────────────────────────────────────────────

    /**
     * Public method to trigger an immediate sync check if online.
     * Can be called whenever network connectivity is confirmed (e.g. by gitDropdown.js).
     */
    async triggerSync() {
        if (!this.isOnline) return;
        return this._onOnline();
    }

    /**
     * Called automatically when the browser comes back online.
     *
     * Two-pass approach:
     *  Pass 1: create any pending repos (this also triggers sync for those projects)
     *  Pass 2: sync pending commits for projects that already had real repos
     */
    async _onOnline() {
        if (this._syncingAll) return;
        this._syncingAll = true;
        try {
            const projects = this.storage.data?.Projects || {};
            let syncedCount = 0;

            // Pass 1 — create any pending repos first (each triggers its own syncPending)
            for (const id of Object.keys(projects)) {
                if (this._hasPendingRepo(id)) {
                    const pending = projects[id].pendingRepoCreation;
                    try {
                        await this._createPendingRepo(id, pending);
                        syncedCount++;
                    } catch (err) {
                        console.error(
                            `[OfflineCommitManager] Pending repo creation failed for ${id}:`,
                            err
                        );
                    }
                }
            }

            // Pass 2 — sync pending commits for projects with existing real repos
            for (const id of Object.keys(projects)) {
                // Skip projects whose repo is still being created (Pass 1 handles them)
                if (this._hasPendingRepo(id)) continue;

                const hasPending = (projects[id].commitDrafts || []).some(
                    d => d.status === "pending"
                );
                if (!hasPending) continue;

                const gitData = projects[id].GitRepoData;

                if (!gitData?.repoName || !gitData?.hashedKey) {
                    console.warn(
                        `[OfflineCommitManager] Project ${id} has pending drafts but no repo. ` +
                            "Drafts are safe — publish the project first to sync them."
                    );
                    continue;
                }

                const result = await this.syncPending(
                    id,
                    gitData.repoName,
                    gitData.hashedKey
                ).catch(err => {
                    console.error(
                        `[OfflineCommitManager] Auto-sync failed for project ${id}:`,
                        err
                    );
                    return null;
                });

                if (result && result.success && result.synced > 0) {
                    syncedCount += result.synced;
                }
            }

            // Notify the parent window (gitDropdown.js) so the Time Travel panel
            // can auto-refresh and remove "Sync Pending" badges from synced commits.
            if (syncedCount > 0) {
                try {
                    window.parent?.postMessage(
                        { type: "MB_SYNC_COMPLETE", synced: syncedCount },
                        "*"
                    );
                } catch (_) {
                    /* cross-origin guard */
                }

                console.debug(
                    `[OfflineCommitManager] Auto-sync complete: ${syncedCount} commit(s) pushed to GitHub.`
                );
            }
        } finally {
            this._syncingAll = false;
        }
    }

    // ── Draft management ─────────────────────────────────────────────────

    /**
     * Saves a new offline commit draft for a project.
     *
     * Returns an object describing the result:
     *  { saved: true }                  — draft saved OK
     *  { saved: false, reason: 'cap' }  — 5-draft cap reached; save is blocked
     *
     * @param {string} projectId     Planet project ID
     * @param {*}      data          projectData to snapshot
     * @param {string} message       commit message written by the student
     * @returns {Promise<{ saved: boolean, reason?: string }>}
     */
    async saveDraft(projectId, data, message) {
        const draft = {
            id: this._uuid(),
            message: message || "Offline save",
            data: data,
            timestamp: Date.now(),
            status: "pending",
            sha: null
        };

        const saved = await this.storage.addCommitDraft(projectId, draft);

        if (!saved) {
            return { saved: false, reason: "cap" };
        }

        console.debug(`[OfflineCommitManager] Draft saved for project ${projectId}:`, draft.id);
        return { saved: true };
    }

    /**
     * Syncs all pending drafts for a project to GitHub, oldest-first.
     * Stops at the first failure. Per-project lock prevents concurrent calls.
     *
     * @param {string}   projectId
     * @param {string}   repoName    GitHub repo slug (real, not placeholder)
     * @param {string}   hashedKey   ownership key
     * @returns {Promise<{ success: boolean, synced: number, error?: string }>}
     */
    async syncPending(projectId, repoName, hashedKey) {
        if (this._syncingProjects[projectId]) {
            console.debug(
                `[OfflineCommitManager] Sync already in progress for project ${projectId}, skipping.`
            );
            return { success: false, error: "sync_in_progress" };
        }

        // Fall back to GitRepoData if explicit values not provided
        const gitData = this.storage.data?.Projects?.[projectId]?.GitRepoData;
        const repo = repoName || gitData?.repoName;
        const key = hashedKey || gitData?.hashedKey;

        // Block if no key (repo has been named but not yet created on GitHub)
        if (!repo || !key) {
            console.warn(
                `[OfflineCommitManager] Cannot sync project ${projectId} — ` +
                    (this._hasPendingRepo(projectId)
                        ? "repo not yet created on GitHub."
                        : "missing repo or key.")
            );
            return { success: false, error: "missing_or_pending_key" };
        }

        this._syncingProjects[projectId] = true;
        let syncedCount = 0;

        try {
            const drafts = (this.storage.data?.Projects?.[projectId]?.commitDrafts || [])
                .filter(d => d.status === "pending")
                .sort((a, b) => a.timestamp - b.timestamp); // oldest first

            for (const draft of drafts) {
                const result = await new Promise(resolve => {
                    this.server.editProject(repo, key, draft.data, draft.message, resolve);
                });

                if (!result || !result.success) {
                    console.warn(
                        `[OfflineCommitManager] Sync failed on draft ${draft.id}:`,
                        result?.error
                    );
                    return {
                        success: false,
                        synced: syncedCount,
                        error: result?.error || "edit_failed"
                    };
                }

                await this.storage.updateDraftStatus(
                    projectId,
                    draft.id,
                    "synced",
                    result.sha || null
                );
                syncedCount++;
                console.debug(
                    `[OfflineCommitManager] Synced draft ${draft.id} (${syncedCount}/${drafts.length})`
                );
            }

            // Refresh local commit cache after a full successful sync
            await this.refreshCache(projectId, repo);

            return { success: true, synced: syncedCount };
        } finally {
            this._syncingProjects[projectId] = false;
        }
    }

    // ── History & cache ───────────────────────────────────────────────────

    /**
     * Returns the merged local history view (pending drafts + cached commits).
     * Sorted newest-first. Used when offline.
     *
     * @param {string} projectId
     * @returns {Array<Object>}
     */
    getLocalHistory(projectId) {
        const hasPendingRepo = this._hasPendingRepo(projectId);

        const drafts = (this.storage.data?.Projects?.[projectId]?.commitDrafts || []).map(d => ({
            sha: d.sha || null,
            message: d.message,
            date: new Date(d.timestamp).toISOString(),
            status:
                d.status === "pending" ? (hasPendingRepo ? "pending-repo" : "pending") : "synced",
            draftId: d.id,
            projectData: d.data
        }));

        const cached = this.storage.getCachedCommits(projectId).map(c => ({
            ...c,
            status: "synced"
        }));

        // Combine drafts and cached commits. De-duplicate by sha if both exist.
        const shaMap = new Map();
        [...drafts, ...cached].forEach(item => {
            const key = item.sha || item.draftId || item.date;
            if (!shaMap.has(key) || item.projectData) {
                shaMap.set(key, item);
            }
        });

        return Array.from(shaMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    /**
     * Fetches the latest commit history from GitHub and caches the last 3 entries
     * (metadata only — no data blobs).
     *
     * @param {string} projectId
     * @param {string} repoName
     * @returns {Promise<void>}
     */
    async refreshCache(projectId, repoName) {
        const repo = repoName || this.storage.data?.Projects?.[projectId]?.GitRepoData?.repoName;

        // Don't try to fetch from GitHub if the repo hasn't been created yet
        if (!repo || this._hasPendingRepo(projectId)) return;

        const result = await new Promise(resolve => {
            this.server.getCommitHistory(repo, resolve);
        });

        if (!result || !result.success || !Array.isArray(result.data)) return;

        const metaOnly = result.data.slice(0, 3).map(c => ({
            sha: c.sha,
            message: c.message || c.commit?.message || "",
            author: c.author || c.commit?.author?.name || "",
            date: c.date || c.commit?.author?.date || new Date().toISOString()
        }));

        await this.storage.setCachedCommits(projectId, metaOnly);
        console.debug(
            `[OfflineCommitManager] Cache refreshed for ${repo}: ${metaOnly.length} commits`
        );
    }

    // ── Teardown ──────────────────────────────────────────────────────────

    /** Removes event listeners. Call if the Planet iframe is torn down. */
    destroy() {
        this._monitor.destroy();
    }
}

// Export for Jest tests
if (typeof module !== "undefined" && module.exports) {
    module.exports = OfflineCommitManager;
}
