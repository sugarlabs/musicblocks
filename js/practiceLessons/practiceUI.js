/* global ActivityContext, HelpWidget, PracticeManager, PracticeProblems, PracticeTheme, PracticeValidator */
/* exported PracticeUI, ExplorerJournalUI */

const PracticeUI = {
    badgeCheckTimer: null,
    noticeTimer: null,

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

    open() {
        if (document.getElementById("practice-panel")) return;

        ExplorerJournalUI.close();

        const panel = document.createElement("div");
        panel.id = "practice-panel";

        panel.innerHTML = `
      <div class="practice-menu-header">
        <h3>Practice</h3>
        <button id="close-practice">X</button>
      </div>

      <div id="practice-content"></div>
    `;

        document.body.appendChild(panel);

        document.getElementById("close-practice").onclick = () => {
            this.stopBadgeMonitor();
            this.dismissQuestNotice();
            panel.remove();
        };

        this.renderLevelMenu();
    },

    loadStarterBlocks(level) {
        const activity = this.getActivity();
        if (!activity?.blocks) return;

        const projectFiles = {
            1: "hcb_level1.tb",
            2: "sakura.tb"
        };

        const file = projectFiles[level];
        if (!file) return;

        fetch(`js/practice_projects/${file}`)
            .then(res => res.text())
            .then(data => {
                const projectData = JSON.parse(data);
                this.loadProjectData(activity, projectData);
            })
            .catch(err => {
                console.error("Failed to load practice project", err);
            });
    },

    renderLevelMenu() {
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
          <span>Level ${p.level}</span>
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

    renderLevel(level) {
        const problem = PracticeProblems.find(p => p.level === level);
        const container = document.getElementById("practice-content");

        container.innerHTML = `
      <button id="back-to-levels">&larr; Back</button>

      <h2>Level ${problem.level}</h2>
      <h4>${problem.title}</h4>
      <div class="practice-description">${problem.description}</div>
      ${this.renderRewards(problem)}
      <div id="practice-badge-status">${this.renderBadgeStatus(problem)}</div>

      <button id="check-level">Check My Work</button>
    `;

        this.loadStarterBlocks(level);

        document.getElementById("back-to-levels").onclick = () => {
            this.renderLevelMenu();
        };

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
                if (problem.expected?.boxShapeAutomation) {
                    const debug = PracticeValidator.getBoxShapeAutomationDebug();
                    console.debug("Level 6 validation debug", debug);
                    this.showQuestNotice(
                        "Not complete yet",
                        "Beat is still listening for the missing notes. Use one Start block with store in box1, an outer repeat, an inner repeat box1 that draws the shape, and add 1 to box1 after the shape.",
                        "hint"
                    );
                } else {
                    this.showIncompleteMessage(problem);
                }
            }
        };

        this.attachSecretHelpCards(problem, container);
        this.startBadgeMonitor(problem);
    },

    attachSecretHelpCards(problem, container) {
        container.querySelectorAll("[data-secret-help]").forEach(button => {
            button.onclick = () => {
                const card = problem.secretHelpCards?.[button.dataset.secretHelp];
                if (!card) return;

                const activity = this.getActivity();
                if (typeof HelpWidget === "undefined" || !activity) {
                    this.showQuestNotice(
                        card.title,
                        `${card.description} ${card.musicDescription}`,
                        "hint"
                    );
                    return;
                }

                HelpWidget.showCard(activity, card);
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
        <h4>Quest Rewards</h4>
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
        <h4>Discoveries</h4>
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
        const messages = [
            problem.badges?.find(badge => badge.criterion === "completePattern")?.message ||
                "The lesson song shines, and the island answers.",
            "Melody Fragment restored. Captain's Journal Page found.",
            ...newBadges.map(badge => badge.message),
            ...newBigBadges.map(badge => badge.message)
        ];

        if (!newBadges.length && !newBigBadges.length) {
            messages.push("The bridge song is still shining.");
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
                "Discovery Already Saved",
                "Lyra has this mark in her map. Keep exploring the island for another secret.",
                "badge"
            );
            return;
        }

        this.showQuestNotice(
            "Hidden Discovery",
            newBadges.map(badge => badge.message).join(" "),
            "badge"
        );
    },

    showIncompleteMessage() {
        this.showQuestNotice(
            "The Bridge Is Still Sleeping",
            "Beat hears a few echoes, but the stone tablet is waiting for A A B A. Try the bridge song again, then press Check My Work.",
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
                badge => badge.criterion !== "completePattern"
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
        return this.escapeAttribute(`${badge.label}: ${badge.message || "Discovery badge"}`);
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
    open() {
        if (document.getElementById("explorer-journal-panel")) return;

        PracticeUI.stopBadgeMonitor();
        PracticeUI.dismissQuestNotice();

        const practicePanel = document.getElementById("practice-panel");
        if (practicePanel) practicePanel.remove();

        const panel = document.createElement("div");
        panel.id = "explorer-journal-panel";
        panel.innerHTML = `
      <div class="practice-menu-header journal-header">
        <h3>Explorer Journal</h3>
        <button id="close-explorer-journal">X</button>
      </div>
      <div id="explorer-journal-content"></div>
    `;

        document.body.appendChild(panel);
        document.getElementById("close-explorer-journal").onclick = () => this.close();
        this.renderIndex();
    },

    close() {
        const panel = document.getElementById("explorer-journal-panel");
        if (panel) panel.remove();
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
        <h3>My Explorer Book</h3>
        <p>Memories from every island you have helped wake up.</p>
      </section>

      ${
          pages.length
              ? `<section class="journal-section">
                  <h4 class="journal-section-title">Island Pages</h4>
                  <div class="journal-page-list">
                    ${pages.map((page, index) => this.renderPageButton(page, index)).join("")}
                  </div>
                </section>`
              : this.renderEmptyState()
      }

      <section class="journal-section journal-general-section">
        <h4 class="journal-section-title">My Notes</h4>
        ${
            generalNotes.length
                ? `<div class="journal-page-list">
                    ${generalNotes.map(notePage => this.renderGeneralNoteButton(notePage)).join("")}
                  </div>`
                : `<p class="journal-general-empty">Save your own ideas, drawings-in-words, or music thoughts here.</p>`
        }
      </section>

      <button id="journal-add-general-note" class="journal-fab-add" aria-label="Add new note">
        + New Note
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
        <span class="journal-page-number">Page ${index + 1}</span>
        <span class="journal-open-title">${this.escapeHTML(page.title)}</span>
        <span class="journal-open-meta">
          ${this.escapeHTML(page.island)} - ${noteCount || "No"} ${noteCount === 1 ? "note" : "notes"}
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
          ${noteCount || "No"} ${noteCount === 1 ? "entry" : "entries"}
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
        <h4>New Note</h4>
        <label class="journal-note-label" for="journal-general-title">Title</label>
        <input
          id="journal-general-title"
          type="text"
          maxlength="80"
          placeholder="Give your note a name..." />
        <label class="journal-note-label" for="journal-general-content">First thought</label>
        <textarea
          id="journal-general-content"
          maxlength="280"
          placeholder="Write anything you want to remember..."></textarea>
        <div class="journal-note-actions">
          <button id="journal-save-general-note">Save Note</button>
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
                    "Blank Page Waiting",
                    "Add a title or a thought first, or come back when you are ready.",
                    "hint"
                );
                return;
            }

            const page = PracticeManager.createGeneralNote(title, content);
            PracticeUI.showQuestNotice(
                "Note Saved",
                "Your personal note is tucked safely in My Notes.",
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
        <label class="journal-note-label" for="journal-general-page-title">Title</label>
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
            Add another thought
          </label>
          <textarea
            class="journal-new-note-input"
            id="journal-new-general-note"
            maxlength="280"
            placeholder="Write more here..."></textarea>
          <div class="journal-note-actions">
            <button class="journal-add-note" data-note-page-id="${this.escapeHTML(page.id)}">
              Add Entry
            </button>
            <button class="journal-delete-page" data-note-page-id="${this.escapeHTML(page.id)}">
              Delete Note
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
                    "Note Removed",
                    "That personal note has been cleared from your book.",
                    "success"
                );
                this.renderIndex();
            },
            newNoteSelector: ".journal-new-note-input",
            addNoteLabel: "Entry Added",
            addNoteMessage: "Another thought has been added to your note.",
            deleteNoteLabel: "Entry Removed",
            deleteNoteMessage: "That entry has been removed from your note."
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
          <strong>Things I learned</strong>
          <div>
            ${page.learned.map(item => `<span>${this.escapeHTML(item)}</span>`).join("")}
          </div>
        </div>
        <div class="journal-note-list">
          ${this.renderNotes(page)}
        </div>
        <div class="journal-new-note">
          <label class="journal-note-label" for="journal-new-note-${page.level}">
            Add a new memory
          </label>
          <textarea
            class="journal-new-note-input"
            id="journal-new-note-${page.level}"
            maxlength="280"
            placeholder="Today I discovered..."></textarea>
          <button class="journal-add-note" data-level="${page.level}">Add Note</button>
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
            addNoteLabel: "Note Added",
            addNoteMessage: "A new memory has been tucked into this page.",
            deleteNoteLabel: "Note Removed",
            deleteNoteMessage: "That memory has been removed from this page.",
            updateNoteLabel: "Note Updated",
            updateNoteMessage: "Your Explorer Book remembers the new version."
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
                        "Title Updated",
                        "Your note title has been saved.",
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
                    updateNoteLabel || "Note Updated",
                    updateNoteMessage || "Your Explorer Book remembers the new version.",
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
                    deleteNoteLabel || "Note Removed",
                    deleteNoteMessage || "That memory has been removed.",
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
                        "Blank Page Waiting",
                        "Write a small memory first, or come back when you are ready.",
                        "hint"
                    );
                    return;
                }

                onSaveNote(textarea.value);
                onRefresh();
                PracticeUI.showQuestNotice(
                    addNoteLabel || "Note Added",
                    addNoteMessage || "A new memory has been tucked into this page.",
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
          <strong>No notes yet</strong>
          <span>This page is ready whenever you want to write.</span>
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
        <h4>Your book is waiting</h4>
        <p>Complete a practice level and Captain Cadence will share the first page.</p>
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
        <button id="close-journal-prompt" aria-label="Close Explorer Journal prompt">X</button>
        <span class="journal-prompt-kicker">Captain's Journal</span>
        <h3>${this.escapeHTML(problem.journal?.title || problem.title)}</h3>
        <p>
          Every explorer notices something different. Before you sail onward,
          save one tiny memory from today.
        </p>
        <label for="journal-prompt-note">What surprised you today?</label>
        <textarea
          id="journal-prompt-note"
          maxlength="280"
          placeholder="I discovered..."></textarea>
        <div class="journal-prompt-actions">
          <button id="save-journal-prompt">Save</button>
          <button id="skip-journal-prompt">Skip</button>
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
                "Explorer Book Updated",
                "Captain Cadence saves your page. You can edit it later from Help > Explorer Journal.",
                "success"
            );
        };
    },

    skipCompletionPrompt(problem) {
        PracticeManager.ensureJournalPage(problem);
        this.closeCompletionPrompt();
        PracticeUI.showQuestNotice(
            "Page Saved For Later",
            "The Explorer Book keeps a blank page ready whenever you want to write.",
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
        if (Number.isNaN(date.getTime())) return "Saved in your journal";

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
