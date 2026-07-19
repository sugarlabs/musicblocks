// Copyright (c) 2026 Harihara Vardhan K
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global _, MBDialog, MB_GIT_BACKEND_URL */
/* exported GitDropdownUI */

class GitDropdownUI {
    constructor() {
        this.activity = null;
        this._BASE_URL = "";
        this._prefetchPromise = null;
    }

    init(activity) {
        this.activity = activity;
        const backendUrl =
            typeof MB_GIT_BACKEND_URL !== "undefined"
                ? MB_GIT_BACKEND_URL
                : "http://localhost:5001";
        this._BASE_URL = backendUrl.replace(/\/$/, "") + "/api/github";
        this._syncMenuState();
        this._bindButtons();

        // Listen for MB_GIT_STATE messages from the planet iframe.
        // Fired whenever the user opens a different project so that the
        // "My Project" toolbar menu reflects the correct repo/key.
        window.addEventListener("message", e => {
            if (!e.data) return;
            if (e.data.type === "MB_GIT_STATE") {
                this._applyGitState(e.data.repoName || "", e.data.hashedKey || "");
            } else if (e.data.type === "MB_NEW_PROJECT") {
                // User confirmed New Project from inside the planet iframe.
                // Clear all git tracking immediately — same as _afterDelete in activity.js.
                localStorage.removeItem("mbGitRepoName");
                localStorage.removeItem("mbGitHashedKey");
                localStorage.removeItem("mbGitLastSavedHash");
                localStorage.removeItem("mbGitCurrentSha");
                this.clearForNewProject();
            }
        });

        // Pre-fetch commits in the background so Time Travel opens instantly
        if (this._getRepoName()) {
            this._prefetchCommits();
        }
    }

    onSaveLocally() {
        try {
            const data = this.activity.prepareExport();
            if (data) {
                this._setLastSavedHash(this._simpleHash(data));
            }
        } catch (e) {
            // Dirty checking is best-effort.
        }
    }

    /**
     * Applies a git state received from the planet iframe (MB_GIT_STATE).
     * Updates localStorage and refreshes the "My Project" toolbar menu.
     *
     * @param {string} repoName   - repo slug, or "" to clear
     * @param {string} hashedKey  - ownership key for the repo
     */
    _applyGitState(repoName, hashedKey) {
        if (repoName) {
            localStorage.setItem("mbGitRepoName", repoName);
            localStorage.setItem("mbGitHashedKey", hashedKey || "");
        } else {
            localStorage.removeItem("mbGitRepoName");
            localStorage.removeItem("mbGitHashedKey");
        }
        // Reset the current-SHA so the history panel marks the latest commit
        // as current whenever we switch to a different project.
        localStorage.removeItem("mbGitCurrentSha");
        this._syncMenuState();
        if (repoName) {
            // Reset and restart the prefetch for the new project.
            this._prefetchPromise = null;
            this._prefetchCommits();
        }
    }

    _getRepoName() {
        return localStorage.getItem("mbGitRepoName") || "";
    }
    _getHashedKey() {
        return localStorage.getItem("mbGitHashedKey") || "";
    }
    _getLastSavedHash() {
        return localStorage.getItem("mbGitLastSavedHash") || "";
    }
    _setLastSavedHash(h) {
        localStorage.setItem("mbGitLastSavedHash", h);
    }

    // ─── Pre-fetching ─────────────────────────────────────────────────────────

    _prefetchCommits() {
        const repoName = this._getRepoName();
        if (!repoName) return;

        this._prefetchPromise = fetch(
            `${this._BASE_URL}/commitHistory?repoName=${encodeURIComponent(repoName)}`
        )
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(raw => {
                return (raw.data || raw).map(c => ({
                    sha: c.sha,
                    message: c.commit?.message || c.message || "Saved moment",
                    date: c.commit?.author?.date || c.date || null
                }));
            })
            .catch(e => {
                console.error("[GitDropdownUI] Prefetch error:", e);
                return null; // Silent fail for prefetch
            });
    }

    _syncMenuState() {
        const hasRepo = !!this._getRepoName();
        const itemCreate = document.getElementById("git-item-create");
        const itemCommit = document.getElementById("git-item-commit");
        const itemHistory = document.getElementById("git-item-history");

        if (itemCreate) itemCreate.style.display = hasRepo ? "none" : "list-item";
        if (itemCommit) itemCommit.style.display = hasRepo ? "list-item" : "none";
        if (itemHistory) itemHistory.style.display = hasRepo ? "list-item" : "none";

        const btn = document.getElementById("gitProjectBtn");
        if (btn) {
            const tip = this._getRepoName()
                ? `My Project — ${this._prettifyRepoName(this._getRepoName())}`
                : "My Project";
            btn.setAttribute("data-tooltip", tip);
            btn.setAttribute("aria-label", tip);
        }
    }

    /**
     * Called by activity.js when the user starts a fresh new project.
     * Clears all git tracking state so the new project starts with a clean slate.
     */
    clearForNewProject() {
        // Invalidate any cached commit list from the previous project
        this._prefetchPromise = null;
        this._syncMenuState();
    }

    _bindButtons() {
        const bind = (id, fn) => {
            const el = document.getElementById(id);
            if (el) {
                el.onclick = e => {
                    e.preventDefault();
                    fn();
                };
            }
        };
        bind("git-create", () => this._showCreateFlow());
        bind("git-commit", () => this._showCommitFlow());
        bind("git-history", () => this._showHistoryPanel());
    }

    async _showCreateFlow() {
        if (this._getRepoName()) {
            await window.MBDialog.alert(
                'You already have a save spot called "' +
                    this._prettifyRepoName(this._getRepoName()) +
                    '".\n\nTo start a fresh save spot, first use New Project (the + icon) to clear your canvas, then try again.',
                "Save Spot Already Exists"
            );
            return;
        }

        const rawName = await window.MBDialog.prompt({
            title: "Create My Save Spot",
            message: "What do you want to call your project? (You can change this later)",
            defaultValue: this._getDefaultProjectName(),
            okText: "Next",
            cancelText: "Cancel"
        });
        if (rawName === null || rawName.trim() === "") return;

        const desc = await window.MBDialog.prompt({
            title: "Create My Save Spot",
            message: "Write a short sentence about what your project does (optional):",
            defaultValue: "",
            okText: "Create Save Spot",
            cancelText: "Cancel"
        });
        if (desc === null) return;

        const repoName = this._sanitizeRepoName(rawName.trim());

        await this._doCreate(repoName, rawName.trim(), desc.trim());
    }

    async _doCreate(repoName, displayName, description) {
        const projectData = this._getProjectData();
        const thumbnail = this._getThumbnail();

        const body = {
            repoName,
            projectName: displayName,
            description: description || `${displayName} — a Music Blocks project`,
            creatorName: "anonymous",
            projectData,
            thumbnail,
            tags: []
        };

        try {
            this._showToast("Creating your save spot…", "info");
            const res = await fetch(`${this._BASE_URL}/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (res.status === 422) {
                    await window.MBDialog.alert(
                        'That name is already taken. Try adding a word or number to make it unique (e.g. "' +
                            displayName +
                            ' 2").',
                        "Name Already Taken"
                    );
                    return;
                }
                throw new Error(err.message || `HTTP ${res.status}`);
            }

            const data = await res.json();
            const savedRepoName = data.repoName || data.repository || repoName;
            const savedKey = data.hashedKey || data.key || "";
            localStorage.setItem("mbGitRepoName", savedRepoName);
            localStorage.setItem("mbGitHashedKey", savedKey);
            localStorage.setItem("mb_git_key_" + savedRepoName, savedKey);
            localStorage.removeItem("mbGitCurrentSha");
            this.onSaveLocally();
            this._syncMenuState();
            this._prefetchCommits(); // Refresh cache for this new repo

            // Notify the planet iframe so it:
            //   1. Renames the local project to the user's chosen display name.
            //   2. Records GitRepoData (repoName + hashedKey) for this project.
            //   3. Refreshes the local planet card list.
            const planetIframe = document.getElementById("planet-iframe");
            if (planetIframe && planetIframe.contentWindow) {
                planetIframe.contentWindow.postMessage(
                    {
                        type: "MB_GIT_CREATED",
                        repoName: savedRepoName,
                        hashedKey: savedKey,
                        displayName: displayName,
                        description: description
                    },
                    "*"
                );
            }

            this._showToast("Save spot created! Your project is now being tracked.", "success");
        } catch (e) {
            console.error("[GitDropdownUI] create error:", e);
            this._showToast(
                "Could not create save spot. Check your connection and try again.",
                "error"
            );
        }
    }

    async _showCommitFlow() {
        const repoName = this._getRepoName();
        const hashedKey = this._getHashedKey();
        if (!repoName || !hashedKey) {
            await window.MBDialog.alert(
                'Create a save spot first by clicking "Create My Save Spot".',
                "No Save Spot Yet"
            );
            return;
        }

        const defaultMsg = this._defaultCommitMessage();
        const message = await window.MBDialog.prompt({
            title: "Mark This Moment",
            message: "What did you change or add?",
            defaultValue: defaultMsg,
            okText: "Save This Moment",
            cancelText: "Cancel"
        });
        if (message === null) return;

        await this._doCommit(repoName, hashedKey, message.trim() || defaultMsg);
    }

    async _doCommit(repoName, hashedKey, commitMessage) {
        const projectData = this._getProjectData();
        const thumbnail = this._getThumbnail();

        const body = { repoName, key: hashedKey, projectData, thumbnail, commitMessage };

        try {
            this._showToast("Saving this moment…", "info");
            const res = await fetch(`${this._BASE_URL}/edit`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (res.status === 401 || res.status === 403) {
                    this._showToast("You don't have permission to save this project.", "error");
                    return;
                }
                throw new Error(err.message || `HTTP ${res.status}`);
            }

            this.onSaveLocally();
            localStorage.removeItem("mbGitCurrentSha");
            this._prefetchCommits(); // Refresh cache after a new commit
            this._showToast("Moment saved! ✔", "success");
        } catch (e) {
            console.error("[GitDropdownUI] commit error:", e);
            this._showToast(
                "Could not save this moment. Check your connection and try again.",
                "error"
            );
        }
    }

    async _showHistoryPanel() {
        const repoName = this._getRepoName();
        if (!repoName) {
            await window.MBDialog.alert(
                'Create a save spot first by clicking "Create My Save Spot".',
                "No Save Spot Yet"
            );
            return;
        }

        // If a prefetch hasn't been started, start one now
        if (!this._prefetchPromise) {
            this._prefetchCommits();
        }

        let commits = [];
        try {
            // Await the background prefetch (instant if already done)
            const preloaded = await this._prefetchPromise;
            if (!preloaded) throw new Error("Prefetch failed");
            commits = preloaded;
        } catch (e) {
            console.error("[GitDropdownUI] commitHistory error:", e);
            this._showToast("Could not load history. Check your connection.", "error");
            this._prefetchPromise = null; // reset so it tries again next time
            return;
        }

        if (commits.length === 0) {
            await window.MBDialog.alert(
                'You haven\'t saved any moments yet. Click "Mark This Moment" to save your first one!',
                "No Saved Moments Yet"
            );
            return;
        }

        this._renderHistoryPanel(commits);
    }

    _renderHistoryPanel(commits) {
        document.querySelectorAll(".git-history-panel").forEach(el => el.remove());

        const container = document.getElementById("floatingWindows") || document.body;
        const cleanupFns = [];
        const close = () => {
            cleanupFns.forEach(fn => fn());
            this._closeHistoryPanel();
        };

        // ── overlay ──────────────────────────────────────────────────────────
        const overlay = document.createElement("div");
        overlay.className = "mb-dialog-overlay git-history-panel";
        overlay.style.cssText =
            "position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.40);z-index:10000;";

        // ── outer frame ──────────────────────────────────────────────────────
        const frame = document.createElement("div");
        frame.className = "windowFrame git-history-panel git-tt-frame";
        frame.setAttribute("role", "dialog");
        frame.setAttribute("aria-modal", "true");
        frame.setAttribute("aria-label", "Time Travel");
        frame.style.cssText =
            "position:fixed;width:580px;max-width:94vw;max-height:88vh;" +
            "z-index:10001;display:flex;flex-direction:column;overflow:hidden;";

        // ── top bar ──────────────────────────────────────────────────────────
        const topBar = document.createElement("div");
        topBar.className = "wfTopBar git-tt-topbar";

        const closeBtn = document.createElement("button");
        closeBtn.className = "wftButton close";
        closeBtn.setAttribute("aria-label", "Close");
        closeBtn.innerHTML = "&times;";

        const titleWrap = document.createElement("div");
        titleWrap.className = "git-tt-title-wrap";

        const titleBadge = document.createElement("div");
        titleBadge.className = "git-tt-badge";
        // clock icon
        titleBadge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" width="22" height="22">
          <circle cx="12" cy="13" r="8" stroke="white" stroke-width="2"/>
          <path d="M12 9v4l3 2" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M9 2c-2 .3-3.6 1.4-4.7 3" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M15 2c2 .3 3.6 1.4 4.7 3" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>`;

        const titleText = document.createElement("div");
        const titleH = document.createElement("span");
        titleH.className = "git-tt-title";
        titleH.textContent = "Time Travel";
        const titleSub = document.createElement("span");
        titleSub.className = "git-tt-subtitle";
        titleSub.textContent = "Every save, forever yours ✦";
        titleText.appendChild(titleH);
        titleText.appendChild(titleSub);

        titleWrap.appendChild(titleBadge);
        titleWrap.appendChild(titleText);
        topBar.appendChild(titleWrap);
        topBar.appendChild(closeBtn);

        // ── no hint bar — removed per design ─────────────────────────────────

        // ── scrollable body with winding path ────────────────────────────────
        const body = document.createElement("div");
        body.className = "wfWinBody git-tt-body";

        const wrap = document.createElement("div");
        wrap.className = "git-tt-wrap";

        // Node colour cycle (skip index 0 which is "now" / yellow)
        const colours = ["c-green", "c-pink", "c-teal", "c-orange", "c-blue", "c-purple", "c-red"];

        // Musical Phosphor icons (cycle through them)
        const icons = [
            // guitar
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="white"><path d="M249.66,46.34l-40-40a8,8,0,0,0-11.31,11.32L200.69,20,140.52,80.16C117.73,68.3,92.21,69.29,76.75,84.74a42.27,42.27,0,0,0-9.39,14.37A8.24,8.24,0,0,1,59.81,104c-14.59.49-27.26,5.72-36.65,15.11C11.08,131.22,6,148.6,8.74,168.07,11.4,186.7,21.07,205.15,36,220s33.34,24.56,52,27.22A71.13,71.13,0,0,0,98.1,248c15.32,0,28.83-5.23,38.76-15.16,9.39-9.39,14.62-22.06,15.11-36.65a8.24,8.24,0,0,1,4.92-7.55,42.12,42.12,0,0,0,14.37-9.39c15.45-15.46,16.44-41,4.58-63.77L236,55.31l2.34,2.34a8,8,0,1,0,11.32-11.31ZM160,167.93a26.12,26.12,0,0,1-8.95,5.83,24.24,24.24,0,0,0-15,21.89c-.36,10.46-4,19.41-10.43,25.88-8.44,8.43-21,11.95-35.36,9.89C75,229.25,59.73,221.19,47.27,208.73S26.75,181,24.58,165.81c-2-14.37,1.46-26.92,9.89-35.36C40.94,124,49.89,120.37,60.35,120h0a24.22,24.22,0,0,0,21.89-15,26.12,26.12,0,0,1,5.83-9c5.49-5.49,13-8.13,21.38-8.13a49.38,49.38,0,0,1,19.13,4.19L108.5,112.19a32,32,0,1,0,35.31,35.31l20.08-20.08C170.41,142.71,169.47,158.41,160,167.93Zm-10.4-61.48a72.9,72.9,0,0,1,5.93,6.75l-15.42,15.42a32.22,32.22,0,0,0-12.68-12.68l15.42-15.43A73,73,0,0,1,149.55,106.45ZM112,128a16,16,0,0,1,16,16h0a16,16,0,1,1-16-16Zm48.85-32.85a86.94,86.94,0,0,0-6.68-6L176,67.31,188.69,80l-21.83,21.82A86.94,86.94,0,0,0,160.86,95.14ZM200,68.68,187.32,56,212,31.31,224.69,44ZM93.66,194.33a8,8,0,0,1-11.31,11.32l-32-32a8,8,0,0,1,11.32-11.31Z"/></svg>`,
            // music-note
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="white"><path d="M210.3,56.34l-80-24A8,8,0,0,0,120,40V148.26A48,48,0,1,0,136,184V98.75l69.7,20.91A8,8,0,0,0,216,112V64A8,8,0,0,0,210.3,56.34ZM88,216a32,32,0,1,1,32-32A32,32,0,0,1,88,216ZM200,101.25l-64-19.2V50.75L200,70Z"/></svg>`,
            // music-notes
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="white"><path d="M212.92,17.69a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,56V166.08A36,36,0,1,0,88,196V110.25l112-28v51.83A36,36,0,1,0,216,164V24A8,8,0,0,0,212.92,17.69ZM52,216a20,20,0,1,1,20-20A20,20,0,0,1,52,216ZM88,93.75V62.25l112-28v31.5ZM180,184a20,20,0,1,1,20-20A20,20,0,0,1,180,184Z"/></svg>`,
            // piano-keys
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="white"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM80,48h24v88H80Zm32,104a8,8,0,0,0,8-8V48h16v96a8,8,0,0,0,8,8h8v56H104V152Zm40-16V48h24v88ZM48,48H64v96a8,8,0,0,0,8,8H88v56H48ZM208,208H168V152h16a8,8,0,0,0,8-8V48h16V208Z"/></svg>`,
            // metronome
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="white"><path d="M187.14,114.84l26.78-29.46a8,8,0,0,0-11.84-10.76l-20.55,22.6-17.2-54.07A15.94,15.94,0,0,0,149.08,32H106.91A15.94,15.94,0,0,0,91.66,43.15l-50.91,160A16,16,0,0,0,56,224H200a16,16,0,0,0,15.25-20.85ZM184.72,160H146.08l28.62-31.48ZM106.91,48h42.17l20,62.9L124.46,160H71.27ZM56,208l10.18-32H189.81L200,208Z"/></svg>`,
            // headphones
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="white"><path d="M201.89,54.66A103.43,103.43,0,0,0,128.79,24H128A104,104,0,0,0,24,128v56a24,24,0,0,0,24,24H64a24,24,0,0,0,24-24V144a24,24,0,0,0-24-24H40.36A88,88,0,0,1,128,40h.67a87.71,87.71,0,0,1,87,80H192a24,24,0,0,0-24,24v40a24,24,0,0,0,24,24h16a24,24,0,0,0,24-24V128A103.41,103.41,0,0,0,201.89,54.66ZM64,136a8,8,0,0,1,8,8v40a8,8,0,0,1-8,8H48a8,8,0,0,1-8-8V136Zm152,48a8,8,0,0,1-8,8H192a8,8,0,0,1-8-8V144a8,8,0,0,1,8-8h24Z"/></svg>`,
            // speaker-high
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="white"><path d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM32,96H72v64H32ZM144,207.64,88,164.09V91.91l56-43.55Zm54-106.08a40,40,0,0,1,0,52.88,8,8,0,0,1-12-10.58,24,24,0,0,0,0-31.72,8,8,0,0,1,12-10.58ZM248,128a79.9,79.9,0,0,1-20.37,53.34,8,8,0,0,1-11.92-10.67,64,64,0,0,0,0-85.33,8,8,0,1,1,11.92-10.67A79.83,79.83,0,0,1,248,128Z"/></svg>`
        ];

        // Filter out backend infrastructure commits — not meaningful to students.
        // The infra messages are always "Add metaData.json" and "Add projectData.json".
        const INFRA_PATTERN =
            /^(add (metadata|metaData|projectdata|projectData)\.json|update thumbnail\.png)$/i;

        // Capture the SHA of the "Add metaData.json" commit to use as the project origin.
        // It is always the oldest of the two infra commits, i.e. the very last in the list
        // (commits are newest-first). We grab it before filtering.
        const metaCommit = commits.find(c => /add metaData\.json/i.test(c.message));
        const originSha = metaCommit ? metaCommit.sha : null;
        const originMsg = metaCommit ? metaCommit.message : null;

        // Visible commits: strip the two infra entries
        const visibleCommits = commits.filter(c => !INFRA_PATTERN.test(c.message));

        const currentSha = localStorage.getItem("mbGitCurrentSha");

        // Separate counter for non-now icon/colour assignment
        // so that each commit's icon stays stable regardless of which commit is "now".
        let iconIdx = 0;

        visibleCommits.forEach((commit, idx) => {
            const isNow = currentSha ? commit.sha === currentSha : idx === 0;
            const side = idx % 2 === 0 ? "right" : "left";

            const stop = document.createElement("div");
            stop.className = `git-tt-stop ${side}${isNow ? " now-stop" : ""}`;

            // node bubble — colour and icon are fixed per commit position,
            // independent of which commit is currently "isNow"
            const nodeColour = isNow ? "c-now" : colours[iconIdx % colours.length];
            const nodeIcon = isNow
                ? null // always fixed Phosphor note below
                : icons[iconIdx % icons.length];
            if (!isNow) iconIdx++;

            const node = document.createElement("div");
            node.className = `git-tt-node ${nodeColour}${isNow ? " now" : ""}`;

            if (isNow) {
                // Always the same Phosphor music-note for the active commit node
                node.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="#5d4000" width="32" height="32"><path d="M210.3,56.34l-80-24A8,8,0,0,0,120,40V148.26A48,48,0,1,0,136,184V98.75l69.7,20.91A8,8,0,0,0,216,112V64A8,8,0,0,0,210.3,56.34ZM88,216a32,32,0,1,1,32-32A32,32,0,0,1,88,216ZM200,101.25l-64-19.2V50.75L200,70Z"/></svg>`;
                const badge = document.createElement("div");
                badge.className = "git-tt-you-here";
                badge.textContent = "YOU ARE HERE";
                node.appendChild(badge);
            } else {
                node.innerHTML = nodeIcon;
            }

            // text
            const text = document.createElement("div");
            text.className = "git-tt-text";

            const msgEl = document.createElement("div");
            msgEl.className = "git-tt-msg";
            msgEl.textContent = commit.message;

            const dateSpan = document.createElement("span");
            dateSpan.className = "git-tt-date-text";
            dateSpan.textContent = commit.date ? this._relativeTime(commit.date) : "";

            if (idx === 0) {
                const latestBadge = document.createElement("span");
                latestBadge.className = "git-tt-latest-badge";
                latestBadge.textContent = "Latest";
                msgEl.appendChild(latestBadge); // always visible next to message
            }

            const btnRow = document.createElement("div");
            btnRow.className = "git-tt-btn-row";

            if (isNow) {
                // "Clear Changes" — lets student discard unsaved edits and restore to this save
                const clearBtn = document.createElement("button");
                clearBtn.className = "git-tt-clear-btn";
                clearBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg> Clear Changes`;
                clearBtn.addEventListener("click", () => {
                    close();
                    this._clearChanges(commit.sha, commit.message);
                });
                btnRow.appendChild(clearBtn);
            } else {
                const btn = document.createElement("button");
                btn.className = "git-tt-go-btn";
                btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M5 12h14M13 6l6 6-6 6"/></svg> Take me here`;
                btn.addEventListener("click", () => {
                    close();
                    this._confirmTimeTravel(commit.sha, commit.message);
                });
                btnRow.appendChild(btn);
            }

            // Date sits in the button row — opacity 0 until hovered, no layout shift
            btnRow.appendChild(dateSpan);

            text.appendChild(msgEl);
            text.appendChild(btnRow);

            stop.appendChild(node);
            stop.appendChild(text);
            wrap.appendChild(stop);
        });

        // last stop — start flag (always shown; "Take me here" restores to origin)
        {
            // A fresh project has no currentSha yet; if there are no visible user commits,
            // the origin IS where the user currently is.
            const isAtOrigin = originSha
                ? currentSha
                    ? currentSha === originSha
                    : visibleCommits.length === 0
                : false;

            const flagStop = document.createElement("div");
            const flagSide = visibleCommits.length % 2 === 0 ? "right" : "left";
            flagStop.className = `git-tt-stop ${flagSide}${isAtOrigin ? " now-stop" : ""}`;

            const flagNode = document.createElement("div");
            if (isAtOrigin) {
                flagNode.className = "git-tt-node c-now now";
                flagNode.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="#5d4000" width="32" height="32"><path d="M210.3,56.34l-80-24A8,8,0,0,0,120,40V148.26A48,48,0,1,0,136,184V98.75l69.7,20.91A8,8,0,0,0,216,112V64A8,8,0,0,0,210.3,56.34ZM88,216a32,32,0,1,1,32-32A32,32,0,0,1,88,216ZM200,101.25l-64-19.2V50.75L200,70Z"/></svg>`;
                const badge = document.createElement("div");
                badge.className = "git-tt-you-here";
                badge.textContent = "YOU ARE HERE";
                flagNode.appendChild(badge);
            } else {
                flagNode.className = "git-tt-node c-grey";
                flagNode.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="white" width="28" height="28"><path d="M42.76,50A8,8,0,0,0,40,56V224a8,8,0,0,0,16,0V179.77c26.79-21.16,49.87-9.75,76.45,3.41,16.4,8.11,34.06,16.85,53,16.85,13.93,0,28.54-4.75,43.82-18a8,8,0,0,0,2.76-6V56A8,8,0,0,0,218.76,50c-28,24.23-51.72,12.49-79.21-1.12C111.07,34.76,78.78,18.79,42.76,50ZM216,172.25c-26.79,21.16-49.87,9.74-76.45-3.41-25-12.35-52.81-26.13-83.55-8.4V59.79c26.79-21.16,49.87-9.75,76.45,3.4,25,12.35,52.82,26.13,83.55,8.4Z"/></svg>`;
            }

            const flagText = document.createElement("div");
            flagText.className = "git-tt-text";
            flagText.innerHTML = `<div class="git-tt-flag-note">The very beginning</div><div class="git-tt-msg">Where your project started ✦</div>`;

            const flagBtnRow = document.createElement("div");
            flagBtnRow.className = "git-tt-btn-row";
            if (isAtOrigin) {
                // Only show the Clear Changes button — no "your song right now" chip
                const clearOriginBtn = document.createElement("button");
                clearOriginBtn.className = "git-tt-clear-btn";
                clearOriginBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg> Clear Changes`;
                clearOriginBtn.addEventListener("click", () => {
                    close();
                    this._clearChanges(originSha, "Start point");
                });
                flagBtnRow.appendChild(clearOriginBtn);
            } else if (originSha) {
                const flagBtn = document.createElement("button");
                flagBtn.className = "git-tt-go-btn";
                flagBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><path d="M5 12h14M13 6l6 6-6 6"/></svg> Take me here`;
                flagBtn.addEventListener("click", () => {
                    close();
                    this._confirmTimeTravel(originSha, "Start point");
                });
                flagBtnRow.appendChild(flagBtn);
            }
            flagText.appendChild(flagBtnRow);

            flagStop.appendChild(flagNode);
            flagStop.appendChild(flagText);
            wrap.appendChild(flagStop);
        }

        body.appendChild(wrap);

        frame.appendChild(topBar);
        frame.appendChild(body);
        container.appendChild(overlay);
        container.appendChild(frame);

        requestAnimationFrame(() => {
            const w = frame.offsetWidth;
            const h = frame.offsetHeight;
            frame.style.left = `${Math.max((window.innerWidth - w) / 2, 8)}px`;
            frame.style.top = `${Math.max((window.innerHeight - h) / 2, 48)}px`;
            this._drawTimeTravelPath(wrap);
        });

        closeBtn.addEventListener("click", close);
        overlay.addEventListener("click", close);
        const escHandler = e => {
            if (e.key === "Escape") close();
        };
        document.addEventListener("keydown", escHandler, true);
        cleanupFns.push(() => document.removeEventListener("keydown", escHandler, true));
        cleanupFns.push(this._makeDraggable(frame, topBar));

        frame.tabIndex = -1;
        frame.focus();
    }

    _closeHistoryPanel() {
        document.querySelectorAll(".git-history-panel").forEach(el => el.remove());
    }

    /** Centre a fixed-position frame in the viewport after layout. */
    _centerFrame(frame, offsetTop = 80) {
        requestAnimationFrame(() => {
            frame.style.left = `${Math.max((window.innerWidth - frame.offsetWidth) / 2, 8)}px`;
            frame.style.top = `${Math.max((window.innerHeight - frame.offsetHeight) / 2, offsetTop)}px`;
        });
    }

    /**
     * Build a standard MB-style modal shell (overlay + windowFrame + topBar + body/widget).
     * Returns { overlay, frame, body, widget, cleanup } where cleanup() removes everything
     * and fires any registered cleanupFns.
     *
     * @param {string} title       - title shown in wftTitle
     * @param {number} zBase       - z-index base (overlay = zBase, frame = zBase+1)
     */
    _buildSystemDialog(title, zBase = 10002) {
        document.querySelectorAll(".mb-system-dialog").forEach(el => el.remove());

        const container = document.getElementById("floatingWindows") || document.body;
        const cleanupFns = [];

        const overlay = document.createElement("div");
        overlay.className = "mb-dialog-overlay mb-system-dialog";
        overlay.style.cssText = `position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:${zBase};`;

        const frame = document.createElement("div");
        frame.className = "windowFrame mb-system-dialog git-system-dialog";
        frame.setAttribute("role", "dialog");
        frame.setAttribute("aria-modal", "true");
        frame.setAttribute("aria-label", title);
        frame.style.cssText =
            `position:fixed;min-width:320px;max-width:480px;z-index:${zBase + 1};` +
            "background:var(--bg);border-color:var(--border);";

        const topBar = document.createElement("div");
        topBar.className = "wfTopBar";
        const closeBtn = document.createElement("div");
        closeBtn.className = "wftButton close";
        closeBtn.title = "Cancel";
        const titleEl = document.createElement("div");
        titleEl.className = "wftTitle";
        titleEl.textContent = title;
        const spacer = document.createElement("div");
        spacer.style.width = "21px";
        topBar.appendChild(closeBtn);
        topBar.appendChild(titleEl);
        topBar.appendChild(spacer);

        const body = document.createElement("div");
        body.className = "wfWinBody";
        const widget = document.createElement("div");
        widget.className = "wfbWidget git-system-widget";
        widget.style.cssText = "padding:20px;display:flex;flex-direction:column;gap:16px;";
        body.appendChild(widget);

        frame.appendChild(topBar);
        frame.appendChild(body);
        container.appendChild(overlay);
        container.appendChild(frame);

        const cleanup = () => {
            cleanupFns.forEach(fn => fn());
            overlay.remove();
            frame.remove();
        };
        closeBtn.addEventListener("click", cleanup);
        overlay.addEventListener("click", cleanup);
        const escHandler = e => {
            if (e.key === "Escape") cleanup();
        };
        document.addEventListener("keydown", escHandler, true);
        cleanupFns.push(() => document.removeEventListener("keydown", escHandler, true));
        cleanupFns.push(this._makeDraggable(frame, topBar));

        frame.tabIndex = -1;
        frame.focus();

        return { overlay, frame, topBar, widget, cleanup, cleanupFns };
    }

    /**
     * After the stops are in the DOM, measure each node's centre position
     * and draw a smooth bezier dashed path through them as an SVG overlay.
     */
    _drawTimeTravelPath(wrap) {
        const nodes = [...wrap.querySelectorAll(".git-tt-node")];
        if (nodes.length < 2) return;

        const wrapRect = wrap.getBoundingClientRect();
        const wrapWidth = wrapRect.width;
        const halfW = wrapWidth / 2;

        // The path flows through the TEXT/BUTTON zone of each stop — NOT the node icon.
        // Right-side stop (node on far right ~92%): path aims at x ≈ 72% → text area
        // Left-side  stop (node on far left  ~8%): path aims at x ≈ 28% → text area
        // This keeps the node circles as edge decorations the path passes *near*,
        // while the dashed line flows smoothly through the content region.
        const pts = nodes.map(n => {
            const r = n.getBoundingClientRect();
            const cx = r.left - wrapRect.left + r.width / 2;
            const cy = r.top - wrapRect.top + r.height / 2;
            const tx =
                cx > halfW
                    ? wrapWidth * 0.72 // right-side stop → aim into left-of-node text area
                    : wrapWidth * 0.28; // left-side  stop → aim into right-of-node text area
            return { x: tx, y: cy };
        });

        const svgH = pts[pts.length - 1].y + 56;
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.style.cssText =
            `position:absolute;top:0;left:0;width:100%;height:${svgH}px;` +
            "pointer-events:none;z-index:0;overflow:visible;";

        // Smooth S-curve with vertical tangents at every node:
        //   cp1 = (src.x,  midY)  → path leaves the node heading straight DOWN
        //   cp2 = (dst.x,  midY)  → path arrives  at next node heading straight DOWN
        // The cross-over happens at midY — no U-turns, no tight turns, perfectly fluid.
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const p = pts[i - 1];
            const c = pts[i];
            const midY = (p.y + c.y) / 2;
            d += ` C ${p.x} ${midY}  ${c.x} ${midY}  ${c.x} ${c.y}`;
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#90caf9");
        path.setAttribute("stroke-width", "5");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-dasharray", "4 22");
        svg.appendChild(path);

        wrap.insertBefore(svg, wrap.firstChild);
    }

    async _confirmTimeTravel(sha, commitMessage) {
        const isDirty = this._hasUnsavedChanges();

        if (!isDirty) {
            await this._restoreCommit(sha, commitMessage);
            return;
        }

        this._showUnsavedGuard(
            async () => {
                const repoName = this._getRepoName();
                const hashedKey = this._getHashedKey();
                if (repoName && hashedKey) {
                    const defaultMsg = this._defaultCommitMessage();
                    const msg = await window.MBDialog.prompt({
                        title: "Mark This Moment",
                        message: "What did you change or add? (Auto-saving before time travel)",
                        defaultValue: defaultMsg,
                        okText: "Save & Go Back",
                        cancelText: "Cancel"
                    });
                    if (msg === null) return;
                    await this._doCommit(repoName, hashedKey, msg.trim() || defaultMsg);
                }
                await this._restoreCommit(sha, commitMessage);
            },
            async () => {
                await this._restoreCommit(sha, commitMessage);
            }
        );
    }

    async _clearChanges(sha, commitMessage) {
        const { frame, widget, cleanup } = this._buildSystemDialog("Clear Your Changes");
        this._centerFrame(frame);

        const msgEl = document.createElement("p");
        msgEl.style.margin = "0";
        // Use a friendly label — never expose raw git commit messages like "Add metaData.json"
        const displayLabel = /add (metadata|metaData|projectdata|projectData)\.json/i.test(
            commitMessage
        )
            ? "Start point"
            : commitMessage;
        msgEl.textContent = `This will erase everything you've done since your last save and restore "${displayLabel}". What would you like to do?`;

        const actions = document.createElement("div");
        actions.style.cssText = "display:flex;flex-direction:column;gap:10px;";

        const mkBtn = (cls, text) => {
            const b = document.createElement("button");
            b.className = cls;
            b.textContent = text;
            b.style.cssText = "width:100%;text-align:left;";
            return b;
        };
        const btnSave = mkBtn("confirm-button", "Save a backup first, then clear");
        const btnDiscard = mkBtn(
            "cancel-button git-guard-discard-btn",
            "Discard changes — I don't need them"
        );
        const btnCancel = mkBtn("cancel-button", "Keep editing");

        btnCancel.addEventListener("click", cleanup);

        btnSave.addEventListener("click", async () => {
            cleanup();
            const repoName = this._getRepoName();
            const hashedKey = this._getHashedKey();
            if (repoName && hashedKey) {
                const defaultMsg = this._defaultCommitMessage();
                const userMsg = await window.MBDialog.prompt({
                    title: "Save Backup",
                    message: "Name this backup before clearing:",
                    defaultValue: defaultMsg,
                    okText: "Save & Clear",
                    cancelText: "Cancel"
                });
                if (userMsg === null) return;
                await this._doCommit(repoName, hashedKey, userMsg.trim() || defaultMsg);
            }
            await this._restoreCommit(sha, commitMessage);
        });

        btnDiscard.addEventListener("click", async () => {
            cleanup();
            await this._restoreCommit(sha, commitMessage);
        });

        actions.appendChild(btnSave);
        actions.appendChild(btnDiscard);
        actions.appendChild(btnCancel);
        widget.appendChild(msgEl);
        widget.appendChild(actions);
    }

    async _restoreCommit(sha, commitMessage) {
        const repoName = this._getRepoName();
        try {
            this._showToast("Travelling back in time…", "info");
            const res = await fetch(
                `${this._BASE_URL}/getProjectDataAtCommit?repoName=${encodeURIComponent(repoName)}&sha=${encodeURIComponent(sha)}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const projectData = await res.json();

            this.activity.sendAllToTrash(false, true);
            this.activity.blocks.loadNewBlocks(
                typeof projectData === "string" ? JSON.parse(projectData) : projectData
            );

            this.onSaveLocally();
            localStorage.setItem("mbGitCurrentSha", sha);
            // Use a friendly label — never expose raw git commit messages like "Add metaData.json"
            const displayLabel = /add (metadata|metaData|projectdata|projectData)\.json/i.test(
                commitMessage
            )
                ? "Start point"
                : commitMessage;
            this._showToast(`Restored: "${displayLabel}"`, "success");
        } catch (e) {
            console.error("[GitDropdownUI] restoreCommit error:", e);
            this._showToast("Could not restore that saved moment. Try again.", "error");
        }
    }

    _showUnsavedGuard(onSaveFirst, onJustGoBack) {
        const { frame, widget, cleanup } = this._buildSystemDialog("You Have Unsaved Work");
        this._centerFrame(frame);

        const msg = document.createElement("p");
        msg.style.margin = "0";
        msg.textContent =
            "Going back will replace what you're working on right now. What would you like to do?";

        const actions = document.createElement("div");
        actions.style.cssText = "display:flex;flex-direction:column;gap:10px;";

        const mkBtn = (cls, text) => {
            const b = document.createElement("button");
            b.className = cls;
            b.textContent = text;
            b.style.cssText = "width:100%;text-align:left;";
            return b;
        };
        const btnSave = mkBtn("confirm-button", "Save a Checkpoint First, Then Go Back");
        const btnGoBack = mkBtn(
            "cancel-button git-guard-discard-btn",
            "Just Go Back (I don't need to save)"
        );
        const btnCancel = mkBtn("cancel-button", "Cancel — Stay Here");

        btnCancel.addEventListener("click", cleanup);
        btnSave.addEventListener("click", () => {
            cleanup();
            onSaveFirst();
        });
        btnGoBack.addEventListener("click", () => {
            cleanup();
            onJustGoBack();
        });

        actions.appendChild(btnSave);
        actions.appendChild(btnGoBack);
        actions.appendChild(btnCancel);
        widget.appendChild(msg);
        widget.appendChild(actions);
    }

    _hasUnsavedChanges() {
        try {
            const currentData = this.activity.prepareExport();
            if (!currentData) return false;
            const currentHash = this._simpleHash(currentData);
            const lastSavedHash = this._getLastSavedHash();
            return lastSavedHash !== "" && currentHash !== lastSavedHash;
        } catch (e) {
            return false;
        }
    }

    // Lightweight djb2 hash for change detection only, not security.
    _simpleHash(str) {
        let h = 5381;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) + h) ^ str.charCodeAt(i);
        }
        return (h >>> 0).toString(36);
    }

    _getProjectData() {
        try {
            const data = this.activity.prepareExport();
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    _getThumbnail() {
        try {
            if (
                this.activity &&
                this.activity.storage &&
                this.activity.currentSession !== undefined
            ) {
                const img = this.activity.storage["SESSIONIMAGE" + this.activity.currentSession];
                if (img && typeof img === "string" && img.startsWith("data:image")) {
                    return img;
                }
            }
        } catch (e) {
            /* ignore */
        }
        return null;
    }

    _getDefaultProjectName() {
        try {
            if (
                this.activity.planet &&
                typeof this.activity.planet.getCurrentProjectName === "function"
            ) {
                const name = this.activity.planet.getCurrentProjectName();
                if (name && name.trim()) return name.trim();
            }
        } catch (e) {
            /* ignore */
        }
        return "My Music Project";
    }

    _sanitizeRepoName(name) {
        return (
            name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .substring(0, 100) || "my-music-project"
        );
    }

    _prettifyRepoName(slug) {
        return slug
            .split("-")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    }

    _defaultCommitMessage() {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const date = now.toLocaleDateString([], {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
        return `Saved at ${time} on ${date}`;
    }

    _relativeTime(isoDate) {
        try {
            const diff = Date.now() - new Date(isoDate).getTime();
            const minutes = Math.floor(diff / 60000);
            if (minutes < 1) return "Just now";
            if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
            const days = Math.floor(hours / 24);
            if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
            const months = Math.floor(days / 30);
            return `${months} month${months === 1 ? "" : "s"} ago`;
        } catch (e) {
            return "";
        }
    }

    _showToast(message, type = "info") {
        if (this.activity) {
            if (type === "error" && typeof this.activity.errorMsg === "function") {
                this.activity.errorMsg(message, 3000);
                return;
            }
            if (typeof this.activity.textMsg === "function") {
                this.activity.textMsg(message, 3000);
                return;
            }
        }
        const existing = document.getElementById("git-toast");
        if (existing) existing.remove();
        const toast = document.createElement("div");
        toast.id = "git-toast";
        toast.className = `git-toast git-toast--${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 3000);
    }

    _makeDraggable(frame, handle) {
        let dragging = false,
            dx = 0,
            dy = 0;

        handle.addEventListener("mousedown", e => {
            if (e.target && e.target.closest && e.target.closest(".wftButton")) return;
            dragging = true;
            const r = frame.getBoundingClientRect();
            dx = e.clientX - r.left;
            dy = e.clientY - r.top;
            e.preventDefault();
        });

        const onMove = e => {
            if (!dragging) return;
            const maxL = Math.max(window.innerWidth - frame.offsetWidth, 8);
            const maxT = Math.max(window.innerHeight - frame.offsetHeight, 64);
            frame.style.left = `${Math.min(Math.max(e.clientX - dx, 8), maxL)}px`;
            frame.style.top = `${Math.min(Math.max(e.clientY - dy, 64), maxT)}px`;
        };

        const onUp = () => {
            dragging = false;
        };

        document.addEventListener("mousemove", onMove, true);
        document.addEventListener("mouseup", onUp, true);
        return () => {
            document.removeEventListener("mousemove", onMove, true);
            document.removeEventListener("mouseup", onUp, true);
        };
    }
}

// Expose globally so activity.js (which runs inside an AMD require callback)
// can access the class via `typeof GitDropdownUI !== "undefined"`.
window.GitDropdownUI = GitDropdownUI;

if (typeof module !== "undefined" && module.exports) {
    module.exports = GitDropdownUI;
}
