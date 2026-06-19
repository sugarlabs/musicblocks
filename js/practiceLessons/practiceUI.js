/* global ActivityContext, PracticeManager, PracticeProblems, PracticeTheme, PracticeValidator */
/* exported PracticeUI */

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
                this.showSuccessMessage(awards.newBadges, awards.newBigBadges);
                this.updateBadgeStatus(problem);
                this.startBadgeMonitor(problem);

                const btn = document.querySelector(`.level-btn[data-level="${problem.level}"]`);
                if (btn) btn.classList.add("done");
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

        this.startBadgeMonitor(problem);
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

    showSuccessMessage(newBadges, newBigBadges) {
        const messages = [
            "The stone tablet glows. Music echoes across Echo Island, and the shining bridge rises from the ocean.",
            "Melody Fragment restored. Captain's Journal Page found.",
            ...newBadges.map(badge => badge.message),
            ...newBigBadges.map(badge => badge.message)
        ];

        if (!newBadges.length && !newBigBadges.length) {
            messages.push("The bridge song is still shining.");
        }

        this.showQuestNotice("Bridge Restored", messages.join(" "), "success");
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
