/* global ActivityContext, PracticeManager, PracticeProblems, PracticeValidator */
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

        container.innerHTML = `
      ${PracticeProblems.map(
          p => `
        <button
          class="level-btn ${PracticeManager.isLevelComplete(p.level) ? "done" : ""}"
          data-level="${p.level}">
          Level ${p.level}
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

      <button id="check-level">Check My Work</button>
    `;

        this.loadStarterBlocks(level);

        document.getElementById("back-to-levels").onclick = () => {
            this.renderLevelMenu();
        };

        document.getElementById("check-level").onclick = () => {
            const result = PracticeValidator.validate(problem);

            if (result) {
                PracticeManager.completeLevel(problem);
                alert("Level completed!");

                const btn = document.querySelector(`.level-btn[data-level="${problem.level}"]`);
                if (btn) btn.classList.add("done");
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
    }
};
