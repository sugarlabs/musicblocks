// Copyright (c) 2026 Sugarlabs
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

   _, validateProject
*/

/* exported ProjectCheckerWindow */

if (typeof module !== "undefined" && module.exports) {
    var projectValidatorModule = require("../utils/project-validator");
    var validateProjectFn = projectValidatorModule.validateProject;
}

/**
 * Interactive diagnostic window for checking workspace project integrity offline.
 */
class ProjectCheckerWindow {
    /**
     * @param {Object} activity - The Activity instance
     */
    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;
        this._highlightedBlockId = null;

        const gettext = typeof _ === "function" ? _ : s => s;
        const title = gettext("Check My Project");

        this.widgetWindow = window.widgetWindows.windowFor(this, "project-checker", title);
        this.widgetWindow.clear();
        this.widgetWindow.show();

        const reloadTooltip = gettext("Recheck Project");
        this.widgetWindow.addButton("reload.svg", 32, reloadTooltip).onclick = () => {
            this.refresh();
        };

        this.widgetWindow.onclose = () => {
            this.isOpen = false;
            this._clearHighlight();
            if (this.activity && this.activity.blocks) {
                this.activity.blocks.showBlocks();
            }
            this.widgetWindow.destroy();
            if (this.activity) {
                this.activity.projectCheckerWindow = null;
            }
        };

        this.refresh();
        this.widgetWindow.sendToCenter();
    }

    /**
     * Re-runs static analysis and renders the diagnostic findings.
     * @public
     * @returns {void}
     */
    refresh() {
        if (!this.isOpen) return;

        this._clearHighlight();
        const validator =
            typeof validateProjectFn === "function"
                ? validateProjectFn
                : typeof validateProject === "function"
                  ? validateProject
                  : window.validateProject;

        const report = validator
            ? validator(this.activity)
            : {
                  summary: { errors: 0, warnings: 0, notices: 0, totalBlocks: 0, actionCount: 0 },
                  items: []
              };

        this._render(report);
    }

    /**
     * Renders the diagnostic report inside the widget body.
     * @param {Object} report
     * @private
     */
    _render(report) {
        const gettext = typeof _ === "function" ? _ : s => s;
        const body = this.widgetWindow.getWidgetBody();
        body.textContent = "";

        body.style.display = "flex";
        body.style.flexDirection = "column";
        body.style.gap = "12px";
        body.style.padding = "14px 16px";
        body.style.overflowY = "auto";
        body.style.fontFamily = "Arial, sans-serif";
        body.style.fontSize = "14px";
        body.style.boxSizing = "border-box";
        body.style.maxHeight = "480px";

        // Summary Card
        const summaryCard = document.createElement("div");
        summaryCard.style.padding = "10px 14px";
        summaryCard.style.borderRadius = "6px";
        summaryCard.style.display = "flex";
        summaryCard.style.justifyContent = "space-between";
        summaryCard.style.alignItems = "center";
        summaryCard.style.flexWrap = "wrap";
        summaryCard.style.gap = "8px";

        if (report.items.length === 0) {
            summaryCard.style.backgroundColor = "#e8f5e9";
            summaryCard.style.border = "1px solid #a5d6a7";
            summaryCard.style.color = "#2e7d32";

            const msgDiv = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = gettext("All Clear!");
            title.style.display = "block";
            title.style.marginBottom = "2px";

            const desc = document.createElement("span");
            desc.textContent = gettext("No issues found. Your project is ready to play.");

            msgDiv.appendChild(title);
            msgDiv.appendChild(desc);
            summaryCard.appendChild(msgDiv);

            const statsSpan = document.createElement("span");
            statsSpan.style.fontSize = "12px";
            statsSpan.style.opacity = "0.85";
            statsSpan.textContent = `${report.summary.totalBlocks} ${gettext("blocks")}, ${report.summary.actionCount} ${gettext("actions")}`;
            summaryCard.appendChild(statsSpan);
        } else {
            summaryCard.style.backgroundColor = "#fff3e0";
            summaryCard.style.border = "1px solid #ffe0b2";
            summaryCard.style.color = "#e65100";

            const badgesDiv = document.createElement("div");
            badgesDiv.style.display = "flex";
            badgesDiv.style.gap = "8px";
            badgesDiv.style.alignItems = "center";

            if (report.summary.errors > 0) {
                const errBadge = document.createElement("span");
                errBadge.style.backgroundColor = "#d32f2f";
                errBadge.style.color = "#ffffff";
                errBadge.style.padding = "2px 8px";
                errBadge.style.borderRadius = "12px";
                errBadge.style.fontSize = "12px";
                errBadge.style.fontWeight = "bold";
                errBadge.textContent = `${report.summary.errors} ${gettext("Errors")}`;
                badgesDiv.appendChild(errBadge);
            }

            if (report.summary.warnings > 0) {
                const warnBadge = document.createElement("span");
                warnBadge.style.backgroundColor = "#f57c00";
                warnBadge.style.color = "#ffffff";
                warnBadge.style.padding = "2px 8px";
                warnBadge.style.borderRadius = "12px";
                warnBadge.style.fontSize = "12px";
                warnBadge.style.fontWeight = "bold";
                warnBadge.textContent = `${report.summary.warnings} ${gettext("Warnings")}`;
                badgesDiv.appendChild(warnBadge);
            }

            if (report.summary.notices > 0) {
                const noticeBadge = document.createElement("span");
                noticeBadge.style.backgroundColor = "#1976d2";
                noticeBadge.style.color = "#ffffff";
                noticeBadge.style.padding = "2px 8px";
                noticeBadge.style.borderRadius = "12px";
                noticeBadge.style.fontSize = "12px";
                noticeBadge.style.fontWeight = "bold";
                noticeBadge.textContent = `${report.summary.notices} ${gettext("Notices")}`;
                badgesDiv.appendChild(noticeBadge);
            }

            summaryCard.appendChild(badgesDiv);

            const statsSpan = document.createElement("span");
            statsSpan.style.fontSize = "12px";
            statsSpan.style.opacity = "0.85";
            statsSpan.textContent = `${report.summary.totalBlocks} ${gettext("blocks")}`;
            summaryCard.appendChild(statsSpan);
        }

        body.appendChild(summaryCard);

        // Findings List
        if (report.items.length > 0) {
            const listContainer = document.createElement("div");
            listContainer.style.display = "flex";
            listContainer.style.flexDirection = "column";
            listContainer.style.gap = "8px";

            for (let i = 0; i < report.items.length; i++) {
                const item = report.items[i];
                const itemRow = document.createElement("div");
                itemRow.style.display = "flex";
                itemRow.style.justifyContent = "space-between";
                itemRow.style.alignItems = "center";
                itemRow.style.padding = "8px 12px";
                itemRow.style.borderRadius = "4px";
                itemRow.style.border = "1px solid #e0e0e0";
                itemRow.style.backgroundColor = "#fafafa";
                itemRow.style.gap = "10px";

                const leftCol = document.createElement("div");
                leftCol.style.display = "flex";
                leftCol.style.alignItems = "center";
                leftCol.style.gap = "8px";
                leftCol.style.flex = "1";

                const tag = document.createElement("span");
                tag.style.fontSize = "11px";
                tag.style.fontWeight = "bold";
                tag.style.textTransform = "uppercase";
                tag.style.padding = "2px 6px";
                tag.style.borderRadius = "3px";
                tag.style.color = "#ffffff";

                if (item.severity === "error") {
                    tag.style.backgroundColor = "#d32f2f";
                    tag.textContent = gettext("Error");
                } else if (item.severity === "warning") {
                    tag.style.backgroundColor = "#f57c00";
                    tag.textContent = gettext("Warning");
                } else {
                    tag.style.backgroundColor = "#1976d2";
                    tag.textContent = gettext("Notice");
                }
                leftCol.appendChild(tag);

                const msg = document.createElement("span");
                msg.textContent = item.message;
                msg.style.color = "#333333";
                leftCol.appendChild(msg);

                itemRow.appendChild(leftCol);

                if (item.blockId !== null && item.blockId !== undefined) {
                    const locateBtn = document.createElement("button");
                    locateBtn.textContent = gettext("Locate");
                    locateBtn.style.padding = "3px 8px";
                    locateBtn.style.fontSize = "12px";
                    locateBtn.style.cursor = "pointer";
                    locateBtn.style.borderRadius = "3px";
                    locateBtn.style.border = "1px solid #bdbdbd";
                    locateBtn.style.backgroundColor = "#ffffff";
                    locateBtn.style.whiteSpace = "nowrap";

                    locateBtn.addEventListener("click", () => {
                        this._highlightBlock(item.blockId);
                    });

                    itemRow.appendChild(locateBtn);
                }

                listContainer.appendChild(itemRow);
            }

            body.appendChild(listContainer);
        }
    }

    /**
     * Highlights the selected block on the canvas.
     * @param {number} blockId
     * @private
     */
    _highlightBlock(blockId) {
        this._clearHighlight();
        if (!this.activity || !this.activity.blocks || !this.activity.blocks.blockList) {
            return;
        }

        const block = this.activity.blocks.blockList[blockId];
        if (block && typeof block.highlight === "function") {
            block.highlight();
            this._highlightedBlockId = blockId;
            if (typeof this.activity.refreshCanvas === "function") {
                this.activity.refreshCanvas();
            }
        }
    }

    /**
     * Clears any active highlight on the canvas.
     * @private
     */
    _clearHighlight() {
        if (this._highlightedBlockId !== null) {
            if (this.activity && this.activity.blocks && this.activity.blocks.blockList) {
                const block = this.activity.blocks.blockList[this._highlightedBlockId];
                if (block && typeof block.unhighlight === "function") {
                    block.unhighlight();
                }
            }
            this._highlightedBlockId = null;
            if (this.activity && typeof this.activity.refreshCanvas === "function") {
                this.activity.refreshCanvas();
            }
        }
    }
}

if (typeof window !== "undefined") {
    window.ProjectCheckerWindow = ProjectCheckerWindow;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = ProjectCheckerWindow;
}
