/* global ActivityContext, PracticeManager, PracticeProblems, PracticeTheme, PracticeValidator */
/* exported PracticeUI */

const PracticeUI = {
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
                    alert(
                        "Not complete yet. Use one Start block with: store in box1, an outer repeat, an inner repeat box1 that draws the shape, and add 1 to box1 after the shape. Open the console to see Level 6 validation debug."
                    );
                } else {
                    alert("Not complete yet. Try again.");
                }
            }
        };
    },

    renderBigBadges(bigBadgeIds) {
        if (!bigBadgeIds.length) return "";

        const badges = Object.values(PracticeTheme.bigBadges).filter(badge =>
            bigBadgeIds.includes(badge.id)
        );

        return `
      <div class="big-badge-row">
        ${badges.map(badge => `<span class="big-badge">${badge.label}</span>`).join("")}
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
                    `<span class="level-badge" title="${badge.label}">${badge.shortLabel}</span>`
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
            "Melody Fragment restored.",
            "Captain's Journal Page found.",
            ...newBadges.map(badge => badge.message),
            ...newBigBadges.map(badge => badge.message)
        ];

        if (!newBadges.length && !newBigBadges.length) {
            messages.push("The bridge song is still shining.");
        }

        alert(messages.join("\n\n"));
    },

    showBadgeMessage(newBadges) {
        if (!newBadges.length) {
            alert("You already found this discovery. Keep exploring the island.");
            return;
        }

        alert(newBadges.map(badge => badge.message).join("\n\n"));
    }
};
