// Copyright (c) 2026 Hari Hara Vardhan K
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
            localStorage.setItem("mbGitRepoName", data.repoName || data.repository || repoName);
            localStorage.setItem("mbGitHashedKey", data.hashedKey || data.key || "");
            localStorage.removeItem("mbGitCurrentSha");
            this.onSaveLocally();
            this._syncMenuState();
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

        let commits = [];
        try {
            const res = await fetch(
                `${this._BASE_URL}/commitHistory?repoName=${encodeURIComponent(repoName)}`
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const raw = await res.json();
            commits = (raw.data || raw).map(c => ({
                sha: c.sha,
                message: c.commit?.message || c.message || "Saved moment",
                date: c.commit?.author?.date || c.date || null
            }));
        } catch (e) {
            console.error("[GitDropdownUI] commitHistory error:", e);
            await window.MBDialog.alert(
                "Could not load your save history right now. Check your connection and try again.",
                "Time Travel Unavailable"
            );
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
            cleanupFns.forEach(cleanup => cleanup());
            this._closeHistoryPanel();
        };

        const overlay = document.createElement("div");
        overlay.className = "mb-dialog-overlay git-history-panel";
        overlay.style.cssText =
            "position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.40);z-index:10000;";

        const frame = document.createElement("div");
        frame.className = "windowFrame git-history-panel";
        frame.setAttribute("role", "dialog");
        frame.setAttribute("aria-modal", "true");
        frame.setAttribute("aria-label", "Time Travel — Saved Moments");
        frame.style.cssText = [
            "position:fixed;",
            "z-index:10001;",
            "min-width:340px;",
            "max-width:480px;",
            "width:90vw;",
            "max-height:70vh;",
            "display:flex;",
            "flex-direction:column;",
            "background:var(--bg);",
            "border-color:var(--border);"
        ].join("");

        const topBar = document.createElement("div");
        topBar.className = "wfTopBar";

        const closeBtn = document.createElement("div");
        closeBtn.className = "wftButton close";
        closeBtn.title = "Close";

        const titleEl = document.createElement("div");
        titleEl.className = "wftTitle";
        titleEl.textContent = "Time Travel — Your Saved Moments";

        const spacer = document.createElement("div");
        spacer.style.width = "21px";

        topBar.appendChild(closeBtn);
        topBar.appendChild(titleEl);
        topBar.appendChild(spacer);

        const body = document.createElement("div");
        body.className = "wfWinBody git-timeline-body";

        const hint = document.createElement("p");
        hint.className = "git-timeline-hint";
        hint.textContent = "Click any saved moment below to go back to it.";
        body.appendChild(hint);

        const list = document.createElement("ul");
        list.className = "git-timeline-list";

        commits.forEach((commit, idx) => {
            const li = document.createElement("li");
            li.className = "git-timeline-item";

            const dot = document.createElement("div");
            dot.className = "git-timeline-dot" + (idx === 0 ? " git-timeline-dot--latest" : "");

            const content = document.createElement("div");
            content.className = "git-timeline-content";

            const msg = document.createElement("div");
            msg.className = "git-timeline-message";
            msg.textContent = commit.message;

            const meta = document.createElement("div");
            meta.className = "git-timeline-meta";
            meta.textContent = commit.date ? this._relativeTime(commit.date) : "";

            if (idx === 0) {
                const badge = document.createElement("span");
                badge.className = "git-timeline-latest-badge";
                badge.textContent = "Latest";
                meta.appendChild(badge);
            }

            const currentSha = localStorage.getItem("mbGitCurrentSha");
            const isCurrent = currentSha ? commit.sha === currentSha : idx === 0;

            const goBackBtn = document.createElement("button");
            goBackBtn.className = "git-timeline-go-back-btn";
            goBackBtn.textContent = isCurrent ? "Current version" : "Restore this moment";
            goBackBtn.disabled = isCurrent;

            goBackBtn.addEventListener("click", () => {
                close();
                this._confirmTimeTravel(commit.sha, commit.message);
            });

            content.appendChild(msg);
            content.appendChild(meta);
            content.appendChild(goBackBtn);

            li.appendChild(dot);
            li.appendChild(content);
            list.appendChild(li);
        });

        body.appendChild(list);

        frame.appendChild(topBar);
        frame.appendChild(body);
        container.appendChild(overlay);
        container.appendChild(frame);

        requestAnimationFrame(() => {
            const w = frame.offsetWidth;
            const h = frame.offsetHeight;
            frame.style.left = `${Math.max((window.innerWidth - w) / 2, 8)}px`;
            frame.style.top = `${Math.max((window.innerHeight - h) / 2, 64)}px`;
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
            this._showToast(`Restored: "${commitMessage}"`, "success");
        } catch (e) {
            console.error("[GitDropdownUI] restoreCommit error:", e);
            this._showToast("Could not restore that saved moment. Try again.", "error");
        }
    }

    _showUnsavedGuard(onSaveFirst, onJustGoBack) {
        document.querySelectorAll(".mb-system-dialog").forEach(el => el.remove());

        const container = document.getElementById("floatingWindows") || document.body;
        const cleanupFns = [];

        const overlay = document.createElement("div");
        overlay.className = "mb-dialog-overlay mb-system-dialog";
        overlay.style.cssText =
            "position:fixed;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.45);z-index:10002;";

        const frame = document.createElement("div");
        frame.className = "windowFrame mb-system-dialog";
        frame.setAttribute("role", "dialog");
        frame.setAttribute("aria-modal", "true");
        frame.setAttribute("aria-label", "Unsaved Changes");
        frame.style.cssText =
            "position:fixed;min-width:320px;max-width:480px;z-index:10003;background:var(--bg);border-color:var(--border);";

        const topBar = document.createElement("div");
        topBar.className = "wfTopBar";

        const closeBtn = document.createElement("div");
        closeBtn.className = "wftButton close";
        closeBtn.title = "Cancel";

        const titleEl = document.createElement("div");
        titleEl.className = "wftTitle";
        titleEl.textContent = "You Have Unsaved Work";

        const spacer = document.createElement("div");
        spacer.style.width = "21px";

        topBar.appendChild(closeBtn);
        topBar.appendChild(titleEl);
        topBar.appendChild(spacer);

        const body = document.createElement("div");
        body.className = "wfWinBody";

        const widget = document.createElement("div");
        widget.className = "wfbWidget";
        widget.style.cssText =
            "padding:20px;display:flex;flex-direction:column;gap:16px;color:var(--fg);";

        const msg = document.createElement("p");
        msg.style.margin = "0";
        msg.textContent =
            "Going back will replace what you're working on right now. What would you like to do?";

        const actions = document.createElement("div");
        actions.style.cssText = "display:flex;flex-direction:column;gap:10px;";

        const btnSaveFirst = document.createElement("button");
        btnSaveFirst.className = "confirm-button";
        btnSaveFirst.textContent = "Save a Checkpoint First, Then Go Back";
        btnSaveFirst.style.cssText = "width:100%;text-align:left;";

        const btnJustGoBack = document.createElement("button");
        btnJustGoBack.className = "cancel-button git-guard-discard-btn";
        btnJustGoBack.textContent = "Just Go Back (I don't need to save)";
        btnJustGoBack.style.cssText = "width:100%;text-align:left;";

        const btnCancel = document.createElement("button");
        btnCancel.className = "cancel-button";
        btnCancel.textContent = "Cancel — Stay Here";
        btnCancel.style.cssText = "width:100%;text-align:left;";

        actions.appendChild(btnSaveFirst);
        actions.appendChild(btnJustGoBack);
        actions.appendChild(btnCancel);

        widget.appendChild(msg);
        widget.appendChild(actions);
        body.appendChild(widget);
        frame.appendChild(topBar);
        frame.appendChild(body);
        container.appendChild(overlay);
        container.appendChild(frame);

        requestAnimationFrame(() => {
            const w = frame.offsetWidth;
            const h = frame.offsetHeight;
            frame.style.left = `${Math.max((window.innerWidth - w) / 2, 8)}px`;
            frame.style.top = `${Math.max((window.innerHeight - h) / 2, 80)}px`;
        });

        const cleanup = () => {
            cleanupFns.forEach(cleanupFn => cleanupFn());
            overlay.remove();
            frame.remove();
        };

        closeBtn.addEventListener("click", cleanup);
        btnCancel.addEventListener("click", cleanup);
        overlay.addEventListener("click", cleanup);
        const escHandler = e => {
            if (e.key === "Escape") cleanup();
        };
        document.addEventListener("keydown", escHandler, true);
        cleanupFns.push(() => document.removeEventListener("keydown", escHandler, true));

        btnSaveFirst.addEventListener("click", () => {
            cleanup();
            onSaveFirst();
        });

        btnJustGoBack.addEventListener("click", () => {
            cleanup();
            onJustGoBack();
        });

        cleanupFns.push(this._makeDraggable(frame, topBar));
        frame.tabIndex = -1;
        frame.focus();
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
