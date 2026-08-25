/* global ActivityContext, HelpWidget, PracticeManager, PracticeProblems, PracticeTheme, PracticeValidator, loadPracticeLessons */
/* exported PracticeUI, ExplorerJournalUI */

// Criteria that mean the level itself is finished, as opposed to a hidden discovery.
const COMPLETION_CRITERIA = [
    "completePattern",
    "completeRhythmWorkflow",
    "completePhraseWorkflow",
    "completeBasicShapeSet",
    "completeAnimatedPolyrhythm",
    "completeCircularRhythmRing",
    "completeTwinkleForm",
    "completeMetronome",
    "completePianoKeys"
];

const PracticeUI = {
    badgeCheckTimer: null,
    noticeTimer: null,
    currentLevel: null,
    starterBlockCount: null,
    PANEL_WIDTH: 360,
    PANEL_GAP: 16,
    COLLAPSE_TOGGLE_WIDTH: 24,
    COLLAPSE_TOGGLE_HEIGHT: 52,
    COLLAPSE_TOGGLE_GAP: 12,
    COLLAPSED_LANE_TOP: 120,

    getActivity() {
        if (window.ActivityContext && typeof window.ActivityContext.getActivity === "function") {
            try {
                return window.ActivityContext.getActivity();
            } catch (e) {
                return null;
            }
        }

        return null;
    },

    getJournalDefaultRight() {
        const practicePanel = document.getElementById("practice-panel");
        if (practicePanel && practicePanel.style.display !== "none") {
            return `${this.PANEL_WIDTH + this.PANEL_GAP}px`;
        }

        return "0";
    },

    refreshJournalPanelOffset() {
        const journalPanel = document.getElementById("explorer-journal-panel");
        if (
            !journalPanel ||
            journalPanel.style.display === "none" ||
            journalPanel.classList.contains("practice-panel-collapsed")
        ) {
            return;
        }

        if (!journalPanel.dataset.userMoved || journalPanel.dataset.userMoved !== "true") {
            journalPanel.style.left = "auto";
            journalPanel.style.right = this.getJournalDefaultRight();
        }
    },

    createPanelShell(id, title, closeButtonId, contentId, headerClass) {
        const panel = document.createElement("div");
        panel.id = id;
        panel.innerHTML = `
      <button
        type="button"
        class="practice-panel-collapse-toggle"
        aria-expanded="true"
        aria-label="${id === "practice-panel" ? _("Collapse Lesson Plans") : _("Collapse Explorer Journal")}">
        &#9654;
      </button>
      <div class="practice-panel-frame">
        <div class="practice-menu-header ${headerClass || ""}">
          <h3>${title}</h3>
          <button id="${closeButtonId}">X</button>
        </div>
        <div id="${contentId}"></div>
      </div>
    `;

        this.wirePanelCollapse(panel);
        return panel;
    },

    getVisiblePanel(id) {
        const panel = document.getElementById(id);
        if (!panel || panel.style.display === "none") return null;
        return panel;
    },

    savePanelExpandState(panel) {
        panel.dataset.savedLeft = panel.style.left || "";
        panel.dataset.savedTop = panel.style.top || "";
        panel.dataset.savedRight = panel.style.right || "";
        panel.dataset.savedUserMoved = panel.dataset.userMoved || "false";
    },

    restorePanelExpandState(panel) {
        panel.style.left = panel.dataset.savedLeft || "auto";
        panel.style.top = panel.dataset.savedTop || "64px";
        panel.style.right = panel.dataset.savedRight || "0";
        panel.dataset.userMoved = panel.dataset.savedUserMoved || "false";
        panel.style.transform = "translateX(0)";
    },

    getCollapsedLaneTop(panel) {
        const practicePanel = this.getVisiblePanel("practice-panel");
        const practiceCollapsed =
            practicePanel && practicePanel.classList.contains("practice-panel-collapsed");

        if (panel.id === "practice-panel") {
            return this.COLLAPSED_LANE_TOP;
        }

        if (practicePanel && practiceCollapsed) {
            return this.COLLAPSED_LANE_TOP + this.COLLAPSE_TOGGLE_HEIGHT + this.COLLAPSE_TOGGLE_GAP;
        }

        return this.COLLAPSED_LANE_TOP;
    },

    syncCollapseToggle(panel) {
        const toggle = panel.querySelector(".practice-panel-collapse-toggle");
        if (!toggle) return;

        const collapsed = panel.classList.contains("practice-panel-collapsed");
        toggle.innerHTML = collapsed ? "&#9664;" : "&#9654;";
        toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
        toggle.setAttribute(
            "aria-label",
            collapsed
                ? panel.id === "practice-panel"
                    ? _("Expand Lesson Plans")
                    : _("Expand Explorer Journal")
                : panel.id === "practice-panel"
                  ? _("Collapse Lesson Plans")
                  : _("Collapse Explorer Journal")
        );
    },

    applyCollapsedDock(panel) {
        panel.classList.add("practice-panel-collapsed");
        panel.style.left = "auto";
        panel.style.right = "0";
        panel.style.top = `${this.getCollapsedLaneTop(panel)}px`;
        panel.style.transform = "none";
        this.syncCollapseToggle(panel);
    },

    applyExpandedDock(panel) {
        panel.classList.remove("practice-panel-collapsed");
        this.restorePanelExpandState(panel);
        this.syncCollapseToggle(panel);

        if (panel.id === "explorer-journal-panel") {
            if (panel.dataset.userMoved !== "true") {
                panel.style.left = "auto";
                panel.style.right = this.getJournalDefaultRight();
            }
        }
    },

    refreshCollapsedLane() {
        const practicePanel = this.getVisiblePanel("practice-panel");
        const journalPanel = this.getVisiblePanel("explorer-journal-panel");

        [practicePanel, journalPanel].forEach(panel => {
            if (panel && panel.classList.contains("practice-panel-collapsed")) {
                panel.style.top = `${this.getCollapsedLaneTop(panel)}px`;
            }
        });
    },

    wirePanelCollapse(panel) {
        const toggle = panel.querySelector(".practice-panel-collapse-toggle");
        if (!toggle) return;

        toggle.onpointerdown = event => {
            event.stopPropagation();
        };

        toggle.onclick = event => {
            event.stopPropagation();
            this.togglePanelCollapse(panel);
        };
    },

    togglePanelCollapse(panel) {
        const collapsed = !panel.classList.contains("practice-panel-collapsed");

        if (collapsed) {
            this.savePanelExpandState(panel);
            this.applyCollapsedDock(panel);
        } else {
            this.applyExpandedDock(panel);
        }

        this.refreshCollapsedLane();

        if (panel.id === "practice-panel") {
            this.refreshJournalPanelOffset();
        }
    },

    makePanelDraggable(panel, handle) {
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;
        let dragging = false;

        handle.classList.add("practice-draggable-header");
        handle.onpointerdown = event => {
            if (event.target.closest("button")) return;
            if (panel.classList.contains("practice-panel-collapsed")) return;

            const rect = panel.getBoundingClientRect();
            dragging = true;
            startX = event.clientX;
            startY = event.clientY;
            startLeft = rect.left;
            startTop = rect.top;

            panel.dataset.userMoved = "true";
            panel.classList.remove("practice-panel-collapsed");
            panel.style.transform = "translateX(0)";
            this.syncCollapseToggle(panel);

            panel.classList.add("dragging");
            this.bringPanelToFront(panel);
            handle.setPointerCapture(event.pointerId);
        };

        handle.onpointermove = event => {
            if (!dragging) return;

            const nextLeft = startLeft + event.clientX - startX;
            const nextTop = startTop + event.clientY - startY;
            const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
            const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);

            panel.style.left = `${Math.min(Math.max(0, nextLeft), maxLeft)}px`;
            panel.style.top = `${Math.min(Math.max(0, nextTop), maxTop)}px`;
            panel.style.right = "auto";
        };

        handle.onpointerup = event => {
            dragging = false;
            panel.classList.remove("dragging");
            handle.releasePointerCapture(event.pointerId);
        };

        handle.onpointercancel = event => {
            dragging = false;
            panel.classList.remove("dragging");
            handle.releasePointerCapture(event.pointerId);
        };

        panel.onpointerdown = () => this.bringPanelToFront(panel);
    },

    bringPanelToFront(panel) {
        const nextZ = Number(document.body.dataset.practicePanelZ || 9000) + 1;
        document.body.dataset.practicePanelZ = String(nextZ);
        panel.style.zIndex = nextZ;
    },

    restorePanel(panel, fallbackRight) {
        panel.style.display = "flex";
        if (!panel.dataset.userMoved || panel.dataset.userMoved !== "true") {
            panel.style.left = "auto";
            panel.style.right = fallbackRight !== undefined ? fallbackRight : "0";
        }
        this.bringPanelToFront(panel);
    },

    loadProjectData(activity, projectData) {
        activity.sendAllToTrash(false, true);
        if (activity.turtles && typeof activity.turtles.getTurtleCount === "function") {
            for (let turtle = 0; turtle < activity.turtles.getTurtleCount(); turtle++) {
                activity.turtles.getTurtle(turtle).painter.doClear(true, true, true);
            }
        }
        activity.blocks.loadNewBlocks(projectData);
        activity.blocks.adjustDocks();
        activity.refreshCanvas();
    },

    countLiveBlocks() {
        const blockList = this.getActivity()?.blocks?.blockList || {};

        return Object.values(blockList).filter(block => block && !block.trash).length;
    },

    // A count only catches blocks added on top of the starter set; a child who deletes and
    // rebuilds back to the same total is not warned.
    hasExtraBlocks() {
        if (this.starterBlockCount === null) return false;

        return this.countLiveBlocks() > this.starterBlockCount;
    },

    async ensureLessonData() {
        if (typeof loadPracticeLessons !== "function") return true;

        try {
            await loadPracticeLessons();
            return true;
        } catch (e) {
            this.showQuestNotice(
                _("Practice Lessons Not Ready"),
                _(
                    "The lesson file could not be loaded. Please check js/practiceLessons/practiceLessons.json."
                ),
                "hint"
            );
            return false;
        }
    },

    async open() {
        if (!(await this.ensureLessonData())) return;

        const existingPanel = document.getElementById("practice-panel");
        if (existingPanel) {
            this.restorePanel(existingPanel, "0");
            this.refreshJournalPanelOffset();
            if (this.currentLevel) {
                const problem = PracticeProblems.find(p => p.level === this.currentLevel);
                this.startBadgeMonitor(problem);
            }
            return;
        }

        const panel = this.createPanelShell(
            "practice-panel",
            _("Practice"),
            "close-practice",
            "practice-content"
        );

        document.body.appendChild(panel);
        this.makePanelDraggable(panel, panel.querySelector(".practice-menu-header"));
        this.restorePanel(panel, "0");

        document.getElementById("close-practice").onclick = () => {
            this.stopBadgeMonitor();
            this.dismissQuestNotice();
            panel.style.display = "none";
            this.refreshJournalPanelOffset();
            this.refreshCollapsedLane();
        };

        this.renderLevelMenu();
    },

    loadStarterBlocks(level) {
        this.starterBlockCount = null;
        const activity = this.getActivity();
        if (!activity?.blocks) return;

        const projectFiles = {
            1: "hcb_level1.tb",
            2: "sakura.tb",
            3: "rhythm_maker_level3.tb",
            4: "phrase_maker_level4.tb",
            5: "geometry_rhythm_level5.tb",
            6: "animated_polyrhythms_level6.tb",
            7: "circular_rhythm_level7.tb",
            8: "twinkle_phrase_maker_level8.tb",
            9: "metronome_level9.tb",
            10: "piano_level10.tb"
        };

        const file = projectFiles[level];
        if (!file) return;

        fetch(`js/practice_projects/${file}`)
            .then(res => res.text())
            .then(data => {
                const projectData = JSON.parse(data);
                this.loadProjectData(activity, projectData);
                this.starterBlockCount = this.countLiveBlocks();
            })
            .catch(err => {
                console.error("Failed to load practice project", err);
            });
    },

    renderLevelMenu() {
        this.currentLevel = null;
        this.stopBadgeMonitor();
        this.dismissQuestNotice();

        const container = document.getElementById("practice-content");
        const bigBadgeIds = PracticeManager.getBigBadges();

        container.innerHTML = `
      <div class="quest-title">
        <h3>${PracticeTheme.title}</h3>
        <p>${PracticeTheme.subtitle}</p>
      </div>
      ${PracticeTheme.intro}
      ${this.renderBigBadges(bigBadgeIds)}
      ${PracticeProblems.map(
          p => `
        <button
          class="level-btn ${PracticeManager.isLevelComplete(p.level) ? "done" : ""}"
          data-level="${p.level}">
          ${this.renderLevelBadgeStrip(p)}
          <span>${_("Level")} ${p.level}</span>
          <small>${p.title}</small>
        </button>
      `
      ).join("")}
    `;

        container.querySelectorAll(".level-btn").forEach(btn => {
            btn.onclick = () => {
                const level = Number(btn.dataset.level);
                this.renderLevel(level);
            };
        });
    },

    getNextProblem(level, problems) {
        const index = problems.findIndex(p => p.level === level);
        if (index === -1) return null;

        return problems[index + 1] || null;
    },

    renderLevel(level) {
        this.currentLevel = level;
        const problem = PracticeProblems.find(p => p.level === level);
        const nextProblem = this.getNextProblem(level, PracticeProblems);
        const container = document.getElementById("practice-content");

        container.innerHTML = `
      <button id="back-to-levels">&larr; ${_("Back")}</button>

      <h2>${_("Level")} ${problem.level}</h2>
      <h4>${problem.title}</h4>
      <div class="practice-description">${problem.description}</div>
      ${this.renderRewards(problem)}
      <div id="practice-badge-status">${this.renderBadgeStatus(problem)}</div>

      <button id="check-level">${_("Check My Work")}</button>
      ${
          nextProblem
              ? `<button id="next-level">
              <span>${_("Next Lesson")} &rarr;</span>
              <small>${_("Level")} ${nextProblem.level} · ${nextProblem.title}</small>
            </button>`
              : ""
      }
    `;

        this.loadStarterBlocks(level);

        document.getElementById("back-to-levels").onclick = () => {
            this.renderLevelMenu();
        };

        const nextButton = document.getElementById("next-level");
        if (nextButton) {
            nextButton.onclick = () => {
                const confirmed =
                    !this.hasExtraBlocks() ||
                    confirm(
                        _(
                            "Starting the next lesson will clear the blocks on your canvas. Continue?"
                        )
                    );

                if (confirmed) this.renderLevel(nextProblem.level);
            };
        }

        document.getElementById("check-level").onclick = () => {
            const result = PracticeValidator.validate(problem);
            const badgeEvidence = PracticeValidator.assessBadges(problem);
            const canAwardBadges = result || PracticeManager.isLevelComplete(problem.level);
            const badgesToAward = canAwardBadges ? badgeEvidence : [];

            if (result) {
                const awards = PracticeManager.completeLevel(
                    problem,
                    badgesToAward,
                    PracticeProblems
                );
                this.showSuccessMessage(problem, awards.newBadges, awards.newBigBadges);
                this.updateBadgeStatus(problem);
                this.startBadgeMonitor(problem);

                const btn = document.querySelector(`.level-btn[data-level="${problem.level}"]`);
                if (btn) btn.classList.add("done");

                // Reflection appears after a successful Check My Work, but writing remains optional.
                ExplorerJournalUI.showCompletionPrompt(problem);
            } else if (badgesToAward.length > 0) {
                const newBadges = PracticeManager.awardLevelBadges(problem, badgesToAward);
                this.showBadgeMessage(newBadges);
                this.updateBadgeStatus(problem);
            } else {
                this.showIncompleteMessage(problem);
            }
        };

        this.attachSecretHelpCards(problem, container);
        this.startBadgeMonitor(problem);
    },

    // help.js is loaded on demand, so it is absent until the Help menu has been opened once.
    ensureHelpWidget() {
        if (typeof HelpWidget !== "undefined") return Promise.resolve();
        if (typeof window.require !== "function" || !window.define?.amd) return Promise.resolve();

        // Resolve on failure too, so a card that cannot load still falls back to a notice.
        return new Promise(resolve => window.require(["widgets/help"], resolve, resolve));
    },

    attachSecretHelpCards(problem, container) {
        container.querySelectorAll("[data-secret-help]").forEach(button => {
            button.onclick = async () => {
                const card = problem.secretHelpCards?.[button.dataset.secretHelp];
                if (!card) return;

                const activity = this.getActivity();
                await this.ensureHelpWidget();

                if (typeof HelpWidget === "undefined" || !activity) {
                    this.showQuestNotice(
                        card.title,
                        `${card.description || ""} ${card.musicDescription || ""}`.trim(),
                        "hint"
                    );
                    return;
                }

                if (card.type === "block" && card.blockName) {
                    HelpWidget.showBlockHelp(activity, card.blockName);
                } else {
                    HelpWidget.showCard(activity, card);
                }
            };
        });
    },

    renderBigBadges(bigBadgeIds) {
        if (!bigBadgeIds.length) return "";

        const badges = Object.values(PracticeTheme.bigBadges).filter(badge =>
            bigBadgeIds.includes(badge.id)
        );

        return `
      <div class="big-badge-row">
        ${badges
            .map(
                badge => `
          <span
            class="big-badge big-badge-${badge.iconKey || "island"}"
            title="${this.getBadgeTitle(badge)}"
            aria-label="${badge.label}">
            <span>${badge.label}</span>
          </span>
        `
            )
            .join("")}
      </div>
    `;
    },

    renderLevelBadgeStrip(problem) {
        if (!Array.isArray(problem.badges)) return "";

        const earnedBadgeIds = PracticeManager.getLevelBadges(problem.level);
        if (!earnedBadgeIds.length) return "";

        return `
      <span class="level-badge-strip">
        ${problem.badges
            .filter(badge => earnedBadgeIds.includes(badge.id))
            .map(
                badge =>
                    `<span
                      class="level-badge level-badge-${badge.iconKey || "discovery"}"
                      title="${this.getBadgeTitle(badge)}"
                      aria-label="${badge.label}">
                    </span>`
            )
            .join("")}
      </span>
    `;
    },

    renderRewards(problem) {
        if (!Array.isArray(problem.rewards)) return "";

        return `
      <section class="reward-card">
        <h4>${_("Quest Rewards")}</h4>
        <ul>
          ${problem.rewards.map(reward => `<li>${reward}</li>`).join("")}
        </ul>
      </section>
    `;
    },

    renderBadgeStatus(problem) {
        if (!Array.isArray(problem.badges)) return "";

        const earnedBadgeIds = PracticeManager.getLevelBadges(problem.level);

        return `
      <section class="badge-card">
        <h4>${_("Discoveries")}</h4>
        <div class="badge-grid">
          ${problem.badges
              .map(
                  badge => `
            <span class="badge-chip ${earnedBadgeIds.includes(badge.id) ? "earned" : ""}">
              ${badge.label}
            </span>
          `
              )
              .join("")}
        </div>
      </section>
    `;
    },

    updateBadgeStatus(problem) {
        const badgeStatus = document.getElementById("practice-badge-status");
        if (badgeStatus) {
            badgeStatus.innerHTML = this.renderBadgeStatus(problem);
        }
    },

    showSuccessMessage(problem, newBadges, newBigBadges) {
        const completionBadge = problem.badges?.find(badge =>
            COMPLETION_CRITERIA.includes(badge.criterion)
        );
        const messages = [
            completionBadge?.message || _("The lesson song shines, and the island answers."),
            _("Melody Fragment restored. Captain's Journal Page found."),
            ...newBadges.map(badge => badge.message),
            ...newBigBadges.map(badge => badge.message)
        ];

        if (!newBadges.length && !newBigBadges.length) {
            messages.push(_("The bridge song is still shining."));
        }

        this.showQuestNotice(
            problem.journal?.completeTitle || "Lesson Complete",
            messages.join(" "),
            "success"
        );
    },

    showBadgeMessage(newBadges) {
        if (!newBadges.length) {
            this.showQuestNotice(
                _("Discovery Already Saved"),
                _("Lyra has this mark in her map. Keep exploring the island for another secret."),
                "badge"
            );
            return;
        }

        this.showQuestNotice(
            _("Hidden Discovery"),
            newBadges.map(badge => badge.message).join(" "),
            "badge"
        );
    },

    showIncompleteMessage(problem) {
        this.showQuestNotice(
            problem?.incomplete?.title || _("The Bridge Is Still Sleeping"),
            problem?.incomplete?.message ||
                _(
                    "Beat hears a few echoes, but the stone tablet is waiting for A A B A. Try the bridge song again, then press Check My Work."
                ),
            "hint"
        );
    },

    showQuestNotice(title, message, type) {
        const notice = this.getQuestNotice();

        notice.className = `practice-quest-notice show ${type || "success"}`;
        notice.innerHTML = `
          <strong>${title}</strong>
          <span>${message}</span>
        `;

        clearTimeout(this.noticeTimer);
        this.noticeTimer = setTimeout(() => {
            this.dismissQuestNotice();
        }, 8500);
    },

    getQuestNotice() {
        let notice = document.getElementById("practice-quest-notice");

        if (!notice) {
            notice = document.createElement("div");
            notice.id = "practice-quest-notice";
            notice.setAttribute("aria-live", "polite");
            document.body.appendChild(notice);
        }

        return notice;
    },

    dismissQuestNotice() {
        const notice = document.getElementById("practice-quest-notice");
        if (notice) {
            notice.className = "practice-quest-notice";
            notice.textContent = "";
        }

        clearTimeout(this.noticeTimer);
        this.noticeTimer = null;
    },

    startBadgeMonitor(problem) {
        this.stopBadgeMonitor();

        if (!Array.isArray(problem?.badges)) return;

        this.badgeCheckTimer = setInterval(() => {
            const hiddenBadges = PracticeValidator.assessBadges(problem).filter(
                badge => !COMPLETION_CRITERIA.includes(badge.criterion)
            );
            const newBadges = PracticeManager.awardLevelBadges(problem, hiddenBadges);

            if (newBadges.length) {
                this.showBadgeMessage(newBadges);
                this.updateBadgeStatus(problem);
            }
        }, 1200);
    },

    stopBadgeMonitor() {
        clearInterval(this.badgeCheckTimer);
        this.badgeCheckTimer = null;
    },

    getBadgeTitle(badge) {
        return this.escapeAttribute(`${badge.label}: ${badge.message || _("Discovery badge")}`);
    },

    escapeAttribute(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
};

const ExplorerJournalUI = {
    async open() {
        if (!(await PracticeUI.ensureLessonData())) return;

        const existingPanel = document.getElementById("explorer-journal-panel");
        if (existingPanel) {
            PracticeUI.restorePanel(existingPanel, PracticeUI.getJournalDefaultRight());
            return;
        }

        PracticeUI.dismissQuestNotice();

        const panel = PracticeUI.createPanelShell(
            "explorer-journal-panel",
            _("Explorer Journal"),
            "close-explorer-journal",
            "explorer-journal-content",
            "journal-header"
        );

        document.body.appendChild(panel);
        PracticeUI.makePanelDraggable(panel, panel.querySelector(".practice-menu-header"));
        PracticeUI.restorePanel(panel, PracticeUI.getJournalDefaultRight());
        document.getElementById("close-explorer-journal").onclick = () => this.close();
        this.renderIndex();
    },

    close() {
        const panel = document.getElementById("explorer-journal-panel");
        if (panel) panel.style.display = "none";
        PracticeUI.refreshCollapsedLane();
        this.closeCompletionPrompt();
    },

    renderIndex() {
        const container = document.getElementById("explorer-journal-content");
        if (!container) return;

        const pages = PracticeManager.syncCompletedJournalPages(PracticeProblems);
        const generalNotes = PracticeManager.getGeneralNotes();

        container.innerHTML = `
      <section class="journal-cover">
        <div class="journal-cover-icon" aria-hidden="true"></div>
        <h3>${_("My Explorer Book")}</h3>
        <p>${_("Memories from every island you have helped wake up.")}</p>
      </section>

      ${
          pages.length
              ? `<section class="journal-section">
                  <h4 class="journal-section-title">${_("Island Pages")}</h4>
                  <div class="journal-page-list">
                    ${pages.map((page, index) => this.renderPageButton(page, index)).join("")}
                  </div>
                </section>`
              : this.renderEmptyState()
      }

      <section class="journal-section journal-general-section">
        <h4 class="journal-section-title">${_("My Notes")}</h4>
        ${
            generalNotes.length
                ? `<div class="journal-page-list">
                    ${generalNotes.map(notePage => this.renderGeneralNoteButton(notePage)).join("")}
                  </div>`
                : `<p class="journal-general-empty">${_("Save your own ideas, drawings-in-words, or music thoughts here.")}</p>`
        }
      </section>

      <button id="journal-add-general-note" class="journal-fab-add" aria-label="${_("Add new note")}">
        ${_("+ New Note")}
      </button>
    `;

        container.querySelectorAll(".journal-open-page").forEach(button => {
            button.onclick = () => this.renderLessonPage(Number(button.dataset.level));
        });

        container.querySelectorAll(".journal-open-general").forEach(button => {
            button.onclick = () => this.renderGeneralNotePage(button.dataset.noteId);
        });

        document.getElementById("journal-add-general-note").onclick = () =>
            this.renderNewGeneralNoteForm();
    },

    renderPageButton(page, index) {
        const noteCount = page.artifacts.notes.length;
        return `
      <button class="journal-open-page journal-level-${page.level}" data-level="${page.level}">
        <span class="journal-page-number">${_("Page")} ${index + 1}</span>
        <span class="journal-open-title">${this.escapeHTML(page.title)}</span>
        <span class="journal-open-meta">
          ${this.escapeHTML(page.island)} - ${_("Notes")}: ${noteCount}
        </span>
      </button>
    `;
    },

    renderGeneralNoteButton(notePage) {
        const noteCount = notePage.artifacts.notes.length;
        return `
      <button class="journal-open-page journal-open-general" data-note-id="${this.escapeHTML(notePage.id)}">
        <span class="journal-page-number">My Note</span>
        <span class="journal-open-title">${this.escapeHTML(notePage.title)}</span>
        <span class="journal-open-meta">
          ${_("Entries")}: ${noteCount}
        </span>
      </button>
    `;
    },

    renderNewGeneralNoteForm() {
        const container = document.getElementById("explorer-journal-content");
        if (!container) return;

        container.innerHTML = `
      <button id="back-to-journal-index">&larr; My Explorer Book</button>
      <section class="journal-page-card journal-page-card-open">
        <h4>${_("New Note")}</h4>
        <label class="journal-note-label" for="journal-general-title">${_("Title")}</label>
        <input
          id="journal-general-title"
          type="text"
          maxlength="80"
          placeholder="${_("Give your note a name...")}" />
        <label class="journal-note-label" for="journal-general-content">${_("First thought")}</label>
        <textarea
          id="journal-general-content"
          maxlength="280"
          placeholder="${_("Write anything you want to remember...")}"></textarea>
        <div class="journal-note-actions">
          <button id="journal-save-general-note">${_("Save Note")}</button>
        </div>
      </section>
    `;

        document.getElementById("back-to-journal-index").onclick = () => this.renderIndex();
        this.protectTextFields(container);

        document.getElementById("journal-save-general-note").onclick = () => {
            const title = document.getElementById("journal-general-title").value;
            const content = document.getElementById("journal-general-content").value;

            if (!title.trim() && !content.trim()) {
                PracticeUI.showQuestNotice(
                    _("Blank Page Waiting"),
                    _("Add a title or a thought first, or come back when you are ready."),
                    "hint"
                );
                return;
            }

            const page = PracticeManager.createGeneralNote(title, content);
            PracticeUI.showQuestNotice(
                _("Note Saved"),
                _("Your personal note is tucked safely in My Notes."),
                "success"
            );
            this.renderGeneralNotePage(page.id);
        };
    },

    renderGeneralNotePage(notePageId) {
        const container = document.getElementById("explorer-journal-content");
        const page = PracticeManager.getGeneralNote(notePageId);
        if (!container || !page) {
            this.renderIndex();
            return;
        }

        container.innerHTML = `
      <button id="back-to-journal-index">&larr; My Explorer Book</button>
      <section class="journal-page-card journal-page-card-open journal-general-page">
        <div class="journal-page-top">
          <span class="journal-page-number">My Note</span>
          <span class="journal-page-island">${this.formatDate(page.updatedAt)}</span>
        </div>
        <label class="journal-note-label" for="journal-general-page-title">${_("Title")}</label>
        <input
          id="journal-general-page-title"
          type="text"
          maxlength="80"
          value="${this.escapeAttribute(page.title)}" />
        <div class="journal-note-list">
          ${this.renderNotes(page)}
        </div>
        <div class="journal-new-note">
          <label class="journal-note-label" for="journal-new-general-note">
            ${_("Add another thought")}
          </label>
          <textarea
            class="journal-new-note-input"
            id="journal-new-general-note"
            maxlength="280"
            placeholder="${_("Write more here...")}"></textarea>
          <div class="journal-note-actions">
            <button class="journal-add-note" data-note-page-id="${this.escapeHTML(page.id)}">
              ${_("Add Entry")}
            </button>
            <button class="journal-delete-page" data-note-page-id="${this.escapeHTML(page.id)}">
              ${_("Delete Note")}
            </button>
          </div>
        </div>
      </section>
    `;

        document.getElementById("back-to-journal-index").onclick = () => this.renderIndex();
        this.protectTextFields(container);
        this.bindNotePageActions({
            container,
            page,
            notePageId: page.id,
            onRefresh: () => this.renderGeneralNotePage(notePageId),
            onTitleChange: title => PracticeManager.updateGeneralNoteTitle(page.id, title),
            onSaveNote: (text, noteId) =>
                PracticeManager.saveGeneralNoteEntry(page.id, text, noteId),
            onDeleteNote: noteId => PracticeManager.deleteGeneralNoteEntry(page.id, noteId),
            onDeletePage: () => {
                PracticeManager.deleteGeneralNote(page.id);
                PracticeUI.showQuestNotice(
                    _("Note Removed"),
                    _("That personal note has been cleared from your book."),
                    "success"
                );
                this.renderIndex();
            },
            newNoteSelector: ".journal-new-note-input",
            addNoteLabel: _("Entry Added"),
            addNoteMessage: _("Another thought has been added to your note."),
            deleteNoteLabel: _("Entry Removed"),
            deleteNoteMessage: _("That entry has been removed from your note.")
        });
    },

    renderLessonPage(level) {
        const container = document.getElementById("explorer-journal-content");
        const problem = PracticeProblems.find(item => item.level === level);
        if (!container || !problem) return;

        const page = PracticeManager.ensureJournalPage(problem);

        container.innerHTML = `
      <button id="back-to-journal-index">&larr; My Explorer Book</button>
      <section class="journal-page-card journal-page-card-open">
        <div class="journal-page-top">
          <span class="journal-page-number">Level ${page.level}</span>
          <span class="journal-page-island">${this.escapeHTML(page.island)}</span>
        </div>
        <h4>${this.escapeHTML(page.title)}</h4>
        <div class="journal-learned">
          <strong>${_("Things I learned")}</strong>
          <div>
            ${page.learned.map(item => `<span>${this.escapeHTML(item)}</span>`).join("")}
          </div>
        </div>
        <div class="journal-note-list">
          ${this.renderNotes(page)}
        </div>
        <div class="journal-new-note">
          <label class="journal-note-label" for="journal-new-note-${page.level}">
            ${_("Add a new memory")}
          </label>
          <textarea
            class="journal-new-note-input"
            id="journal-new-note-${page.level}"
            maxlength="280"
            placeholder="${_("Today I discovered...")}"></textarea>
          <button class="journal-add-note" data-level="${page.level}">${_("Add Note")}</button>
        </div>
      </section>
    `;

        document.getElementById("back-to-journal-index").onclick = () => this.renderIndex();
        this.protectTextFields(container);
        this.bindNotePageActions({
            container,
            page,
            notePageId: null,
            onRefresh: () => this.renderLessonPage(level),
            onSaveNote: (text, noteId) =>
                PracticeManager.saveJournalNote(
                    problem,
                    text,
                    "Write one thing you learned.",
                    noteId
                ),
            onDeleteNote: noteId => PracticeManager.deleteJournalNote(problem, noteId),
            newNoteSelector: ".journal-new-note-input",
            addNoteLabel: _("Note Added"),
            addNoteMessage: _("A new memory has been tucked into this page."),
            deleteNoteLabel: _("Note Removed"),
            deleteNoteMessage: _("That memory has been removed from this page."),
            updateNoteLabel: _("Note Updated"),
            updateNoteMessage: _("Your Explorer Book remembers the new version.")
        });
    },

    bindNotePageActions(options) {
        const {
            container,
            page,
            onRefresh,
            onTitleChange,
            onSaveNote,
            onDeleteNote,
            onDeletePage,
            newNoteSelector,
            addNoteLabel,
            addNoteMessage,
            deleteNoteLabel,
            deleteNoteMessage,
            updateNoteLabel,
            updateNoteMessage
        } = options;

        if (onTitleChange) {
            const titleInput = container.querySelector("#journal-general-page-title");
            if (titleInput) {
                titleInput.addEventListener("change", () => {
                    onTitleChange(titleInput.value);
                    PracticeUI.showQuestNotice(
                        _("Title Updated"),
                        _("Your note title has been saved."),
                        "success"
                    );
                });
            }
        }

        container.querySelectorAll(".journal-update-note").forEach(button => {
            button.onclick = () => {
                const noteId = button.dataset.noteId;
                const textarea = container.querySelector(`textarea[data-note-id="${noteId}"]`);
                if (!textarea) return;

                onSaveNote(textarea.value, noteId);
                onRefresh();
                PracticeUI.showQuestNotice(
                    updateNoteLabel || _("Note Updated"),
                    updateNoteMessage || _("Your Explorer Book remembers the new version."),
                    "success"
                );
            };
        });

        container.querySelectorAll(".journal-delete-note").forEach(button => {
            button.onclick = () => {
                const noteId = button.dataset.noteId;
                if (!onDeleteNote(noteId)) return;

                onRefresh();
                PracticeUI.showQuestNotice(
                    deleteNoteLabel || _("Note Removed"),
                    deleteNoteMessage || _("That memory has been removed."),
                    "success"
                );
            };
        });

        const addButton = container.querySelector(".journal-add-note");
        if (addButton) {
            addButton.onclick = () => {
                const textarea = container.querySelector(newNoteSelector);
                if (!textarea || !textarea.value.trim()) {
                    PracticeUI.showQuestNotice(
                        _("Blank Page Waiting"),
                        _("Write a small memory first, or come back when you are ready."),
                        "hint"
                    );
                    return;
                }

                onSaveNote(textarea.value);
                onRefresh();
                PracticeUI.showQuestNotice(
                    addNoteLabel || _("Note Added"),
                    addNoteMessage || _("A new memory has been tucked into this page."),
                    "success"
                );
            };
        }

        const deletePageButton = container.querySelector(".journal-delete-page");
        if (deletePageButton && onDeletePage) {
            deletePageButton.onclick = () => onDeletePage();
        }
    },

    renderNotes(page) {
        if (!page.artifacts.notes.length) {
            return `
        <section class="journal-note-card empty">
          <strong>${_("No notes yet")}</strong>
          <span>${_("This page is ready whenever you want to write.")}</span>
        </section>
      `;
        }

        return page.artifacts.notes
            .map(
                note => `
        <section class="journal-note-card">
          <div class="journal-note-date">${this.formatDate(note.createdAt)}</div>
          <textarea
            data-note-id="${this.escapeHTML(note.id)}"
            maxlength="280">${this.escapeHTML(note.text)}</textarea>
          <div class="journal-note-actions">
            <button class="journal-update-note" data-note-id="${this.escapeHTML(note.id)}">
              Save Edit
            </button>
            <button class="journal-delete-note" data-note-id="${this.escapeHTML(note.id)}">
              Delete
            </button>
          </div>
        </section>
      `
            )
            .join("");
    },

    renderEmptyState() {
        return `
      <section class="journal-empty-card">
        <h4>${_("Your book is waiting")}</h4>
        <p>${_("Complete a practice level and Captain Cadence will share the first page.")}</p>
      </section>
    `;
    },

    showCompletionPrompt(problem) {
        PracticeManager.ensureJournalPage(problem);
        this.closeCompletionPrompt();

        const prompt = document.createElement("div");
        prompt.id = "explorer-journal-prompt";
        prompt.innerHTML = `
      <section class="journal-prompt-book" role="dialog" aria-live="polite">
        <button id="close-journal-prompt" aria-label=_("Close Explorer Journal prompt")>X</button>
        <span class="journal-prompt-kicker">${_("Captain's Journal")}</span>
        <h3>${this.escapeHTML(problem.journal?.title || problem.title)}</h3>
        <p>
          ${_("Every explorer notices something different. Before you sail onward, save one tiny memory from today.")}
        </p>
        <label for="journal-prompt-note">${_("What surprised you today?")}</label>
        <textarea
          id="journal-prompt-note"
          maxlength="280"
          placeholder="${_("I discovered...")}"></textarea>
        <div class="journal-prompt-actions">
          <button id="save-journal-prompt">${_("Save")}</button>
          <button id="skip-journal-prompt">${_("Skip")}</button>
        </div>
      </section>
    `;

        document.body.appendChild(prompt);
        this.protectTextFields(prompt);
        document.getElementById("close-journal-prompt").onclick = () =>
            this.skipCompletionPrompt(problem);
        document.getElementById("skip-journal-prompt").onclick = () =>
            this.skipCompletionPrompt(problem);
        document.getElementById("save-journal-prompt").onclick = () => {
            const note = document.getElementById("journal-prompt-note").value;
            if (note.trim()) {
                PracticeManager.saveJournalNote(problem, note, "What surprised you today?");
            }
            this.closeCompletionPrompt();
            PracticeUI.showQuestNotice(
                _("Explorer Book Updated"),
                _(
                    "Captain Cadence saves your page. You can edit it later from Help > Explorer Journal."
                ),
                "success"
            );
        };
    },

    skipCompletionPrompt(problem) {
        PracticeManager.ensureJournalPage(problem);
        this.closeCompletionPrompt();
        PracticeUI.showQuestNotice(
            _("Page Saved For Later"),
            _("The Explorer Book keeps a blank page ready whenever you want to write."),
            "success"
        );
    },

    closeCompletionPrompt() {
        const prompt = document.getElementById("explorer-journal-prompt");
        if (prompt) prompt.remove();
    },

    protectTextFields(root) {
        root.querySelectorAll("textarea, input").forEach(field => {
            field.classList.add("journal-text-field");
            ["keydown", "keypress", "keyup"].forEach(eventName => {
                field.addEventListener(eventName, event => {
                    event.stopPropagation();
                });
            });
        });
    },

    formatDate(value) {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return _("Saved in your journal");

        return date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    },

    escapeHTML(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    },

    escapeAttribute(value) {
        return this.escapeHTML(value);
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = { PracticeUI, ExplorerJournalUI };
}
