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
            if (e.data && e.data.type === "MB_GIT_STATE") {
                this._applyGitState(e.data.repoName || "", e.data.hashedKey || "");
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

        // Node SVG icons (cycle through them)
        const icons = [
            // blocks grid+
            `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M18 14v7M14.5 17.5h7"/></svg>`,
            // copy
            `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
            // repeat
            `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>`,
            // swap
            `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3l4 4-4 4"/><path d="M21 7H9a4 4 0 0 0-4 4v1"/><path d="M7 21l-4-4 4-4"/><path d="M3 17h12a4 4 0 0 0 4-4v-1"/></svg>`,
            // up arrow
            `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>`,
            // edit pencil
            `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"/></svg>`,
            // star
            `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
        ];

        const currentSha = localStorage.getItem("mbGitCurrentSha");

        commits.forEach((commit, idx) => {
            const isNow = currentSha ? commit.sha === currentSha : idx === 0;
            const side = idx % 2 === 0 ? "right" : "left";

            const stop = document.createElement("div");
            stop.className = `git-tt-stop ${side}${isNow ? " now-stop" : ""}`;

            // node bubble
            const nodeClass = isNow
                ? "c-now"
                : colours[(idx - 1 + colours.length) % colours.length];
            const node = document.createElement("div");
            node.className = `git-tt-node ${nodeClass}${isNow ? " now" : ""}`;

            if (isNow) {
                // music note for "now"
                node.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="#5d4000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
                const badge = document.createElement("div");
                badge.className = "git-tt-you-here";
                badge.textContent = "YOU ARE HERE";
                node.appendChild(badge);
            } else {
                node.innerHTML = icons[(idx - 1) % icons.length];
            }

            // text
            const text = document.createElement("div");
            text.className = "git-tt-text";

            const msgEl = document.createElement("div");
            msgEl.className = "git-tt-msg";
            msgEl.textContent = commit.message;

            const timeEl = document.createElement("div");
            timeEl.className = "git-tt-time";
            timeEl.textContent = commit.date ? this._relativeTime(commit.date) : "";

            if (idx === 0) {
                const latestBadge = document.createElement("span");
                latestBadge.className = "git-tt-latest-badge";
                latestBadge.textContent = "Latest";
                timeEl.appendChild(latestBadge);
            }

            const btnRow = document.createElement("div");
            btnRow.className = "git-tt-btn-row";

            if (isNow) {
                const chip = document.createElement("span");
                chip.className = "git-tt-now-chip";
                chip.innerHTML = `<svg viewBox="0 0 24 24" fill="#5d4000" width="12" height="12"><path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/></svg> Your song right now`;
                btnRow.appendChild(chip);
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

            text.appendChild(msgEl);
            text.appendChild(timeEl);
            text.appendChild(btnRow);

            stop.appendChild(node);
            stop.appendChild(text);
            wrap.appendChild(stop);
        });

        // last stop — start flag
        if (commits.length > 0) {
            const flagStop = document.createElement("div");
            const flagSide = commits.length % 2 === 0 ? "right" : "left";
            flagStop.className = `git-tt-stop ${flagSide}`;

            const flagNode = document.createElement("div");
            flagNode.className = "git-tt-node c-grey";
            flagNode.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="28" height="28"><path d="M5 3v18"/><path d="M5 4h11l-2 4 2 4H5"/></svg>`;

            const flagText = document.createElement("div");
            flagText.className = "git-tt-text";
            flagText.innerHTML = `<div class="git-tt-flag-note">The very beginning</div><div class="git-tt-msg">Where your project started ✦</div>`;

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
            // Draw winding SVG path connecting all nodes after layout is settled
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
        path.setAttribute("stroke", "#aed581");
        path.setAttribute("stroke-width", "4");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke-dasharray", "5 13");
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
