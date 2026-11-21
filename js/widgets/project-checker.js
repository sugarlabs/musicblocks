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

        this.widgetWindow = window.widgetWindows.windowFor(this, title, "project-checker");
        this.widgetWindow.clear();
        this.widgetWindow.show();

        const initialBody = this.widgetWindow.getWidgetBody();
        if (initialBody && initialBody.classList) {
            initialBody.classList.add("project-checker-widget");
        }

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

        if (body.classList) {
            body.classList.add("project-checker-widget");
        }
        body.style.display = "flex";
        body.style.flexDirection = "column";
        body.style.gap = "12px";
        body.style.padding = "16px";
        body.style.overflowY = "auto";
        body.style.fontFamily =
            "var(--font-family-system, 'Fira Sans', Roboto, system-ui, sans-serif)";
        body.style.fontSize = "14px";
        body.style.lineHeight = "1.5";
        body.style.boxSizing = "border-box";
        body.style.maxHeight = "500px";
        body.style.minWidth = "440px";
        body.style.backgroundColor = "var(--color-bg-primary, #ffffff)";
        body.style.color = "var(--color-text-primary, #1f2937)";

        // Summary Card
        const summaryCard = document.createElement("div");
        summaryCard.className = "project-checker-summary";
        summaryCard.style.padding = "14px 16px";
        summaryCard.style.borderRadius = "8px";
        summaryCard.style.display = "flex";
        summaryCard.style.justifyContent = "space-between";
        summaryCard.style.alignItems = "center";
        summaryCard.style.flexWrap = "wrap";
        summaryCard.style.gap = "10px";
        summaryCard.style.boxShadow = "var(--shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.08))";

        if (report.items.length === 0) {
            summaryCard.classList.add("project-checker-summary-clean");
            summaryCard.style.backgroundColor = "var(--color-success-bg, #ecfdf5)";
            summaryCard.style.border = "1px solid var(--color-success, #10b981)";
            summaryCard.style.borderLeft = "5px solid var(--color-success, #10b981)";

            const msgDiv = document.createElement("div");
            const title = document.createElement("strong");
            title.className = "project-checker-clean-title";
            title.textContent = gettext("All Clear!");
            title.style.display = "flex";
            title.style.alignItems = "center";
            title.style.gap = "6px";
            title.style.fontSize = "15px";
            title.style.fontWeight = "700";
            title.style.color = "var(--color-text-primary, #1f2937)";

            const desc = document.createElement("div");
            desc.className = "project-checker-clean-desc";
            desc.textContent = gettext("No issues found. Your project is ready to play.");
            desc.style.fontSize = "13px";
            desc.style.marginTop = "2px";
            desc.style.color = "var(--color-text-secondary, #4b5563)";

            msgDiv.appendChild(title);
            msgDiv.appendChild(desc);
            summaryCard.appendChild(msgDiv);

            const statsSpan = document.createElement("span");
            statsSpan.className = "project-checker-stat-clean";
            statsSpan.style.fontSize = "12px";
            statsSpan.style.fontWeight = "600";
            statsSpan.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
            statsSpan.style.color = "var(--color-success, #10b981)";
            statsSpan.style.border = "1px solid rgba(16, 185, 129, 0.35)";
            statsSpan.style.borderRadius = "9999px";
            statsSpan.style.padding = "3px 10px";
            statsSpan.textContent = `${report.summary.totalBlocks} ${gettext("blocks")}, ${report.summary.actionCount} ${gettext("actions")}`;
            summaryCard.appendChild(statsSpan);
        } else {
            summaryCard.classList.add("project-checker-summary-issues");
            summaryCard.style.backgroundColor = "var(--color-bg-secondary, #f3f4f6)";
            summaryCard.style.border = "1px solid var(--color-border-primary, #d1d5db)";

            if (report.summary.errors > 0) {
                summaryCard.style.borderLeft = "5px solid var(--color-error, #ef4444)";
            } else if (report.summary.warnings > 0) {
                summaryCard.style.borderLeft = "5px solid var(--color-warning, #f59e0b)";
            } else {
                summaryCard.style.borderLeft = "5px solid var(--color-info, #3b82f6)";
            }

            const badgesDiv = document.createElement("div");
            badgesDiv.style.display = "flex";
            badgesDiv.style.gap = "8px";
            badgesDiv.style.alignItems = "center";
            badgesDiv.style.flexWrap = "wrap";

            if (report.summary.errors > 0) {
                const errBadge = document.createElement("span");
                errBadge.className = "project-checker-badge project-checker-badge-error";
                errBadge.style.backgroundColor = "var(--color-error, #ef4444)";
                errBadge.style.color = "#ffffff";
                errBadge.style.padding = "3px 10px";
                errBadge.style.borderRadius = "9999px";
                errBadge.style.fontSize = "12px";
                errBadge.style.fontWeight = "700";
                errBadge.style.letterSpacing = "0.3px";
                errBadge.textContent = `${report.summary.errors} ${gettext("Errors")}`;
                badgesDiv.appendChild(errBadge);
            }

            if (report.summary.warnings > 0) {
                const warnBadge = document.createElement("span");
                warnBadge.className = "project-checker-badge project-checker-badge-warning";
                warnBadge.style.backgroundColor = "var(--color-warning, #f59e0b)";
                warnBadge.style.color = "#ffffff";
                warnBadge.style.padding = "3px 10px";
                warnBadge.style.borderRadius = "9999px";
                warnBadge.style.fontSize = "12px";
                warnBadge.style.fontWeight = "700";
                warnBadge.style.letterSpacing = "0.3px";
                warnBadge.textContent = `${report.summary.warnings} ${gettext("Warnings")}`;
                badgesDiv.appendChild(warnBadge);
            }

            if (report.summary.notices > 0) {
                const noticeBadge = document.createElement("span");
                noticeBadge.className = "project-checker-badge project-checker-badge-notice";
                noticeBadge.style.backgroundColor = "var(--color-info, #3b82f6)";
                noticeBadge.style.color = "#ffffff";
                noticeBadge.style.padding = "3px 10px";
                noticeBadge.style.borderRadius = "9999px";
                noticeBadge.style.fontSize = "12px";
                noticeBadge.style.fontWeight = "700";
                noticeBadge.style.letterSpacing = "0.3px";
                noticeBadge.textContent = `${report.summary.notices} ${gettext("Notices")}`;
                badgesDiv.appendChild(noticeBadge);
            }

            summaryCard.appendChild(badgesDiv);

            const statsSpan = document.createElement("span");
            statsSpan.className = "project-checker-stat-issues";
            statsSpan.style.fontSize = "12px";
            statsSpan.style.fontWeight = "600";
            statsSpan.style.backgroundColor = "var(--color-bg-tertiary, #e5e7eb)";
            statsSpan.style.color = "var(--color-text-secondary, #4b5563)";
            statsSpan.style.border = "1px solid var(--color-border-primary, #d1d5db)";
            statsSpan.style.borderRadius = "9999px";
            statsSpan.style.padding = "3px 10px";
            statsSpan.textContent = `${report.summary.totalBlocks} ${gettext("blocks")}`;
            summaryCard.appendChild(statsSpan);
        }

        body.appendChild(summaryCard);

        // Findings List
        if (report.items.length > 0) {
            const listContainer = document.createElement("div");
            listContainer.className = "project-checker-list";
            listContainer.style.display = "flex";
            listContainer.style.flexDirection = "column";
            listContainer.style.gap = "8px";

            for (let i = 0; i < report.items.length; i++) {
                const item = report.items[i];
                const itemRow = document.createElement("div");
                itemRow.className = "project-checker-item";
                itemRow.style.display = "flex";
                itemRow.style.justifyContent = "space-between";
                itemRow.style.alignItems = "center";
                itemRow.style.padding = "10px 14px";
                itemRow.style.borderRadius = "8px";
                itemRow.style.border = "1px solid var(--color-border-secondary, #e5e7eb)";
                itemRow.style.backgroundColor = "var(--color-bg-secondary, #f3f4f6)";
                itemRow.style.gap = "12px";
                itemRow.style.boxShadow = "var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.04))";

                if (item.severity === "error") {
                    itemRow.style.borderLeft = "4px solid var(--color-error, #ef4444)";
                } else if (item.severity === "warning") {
                    itemRow.style.borderLeft = "4px solid var(--color-warning, #f59e0b)";
                } else {
                    itemRow.style.borderLeft = "4px solid var(--color-info, #3b82f6)";
                }

                const leftCol = document.createElement("div");
                leftCol.style.display = "flex";
                leftCol.style.alignItems = "center";
                leftCol.style.gap = "10px";
                leftCol.style.flex = "1";

                const tag = document.createElement("span");
                tag.className = "project-checker-tag";
                tag.style.fontSize = "11px";
                tag.style.fontWeight = "700";
                tag.style.textTransform = "uppercase";
                tag.style.letterSpacing = "0.5px";
                tag.style.padding = "3px 8px";
                tag.style.borderRadius = "4px";
                tag.style.color = "#ffffff";
                tag.style.flexShrink = "0";

                if (item.severity === "error") {
                    tag.classList.add("project-checker-tag-error");
                    tag.style.backgroundColor = "var(--color-error, #ef4444)";
                    tag.textContent = gettext("Error");
                } else if (item.severity === "warning") {
                    tag.classList.add("project-checker-tag-warning");
                    tag.style.backgroundColor = "var(--color-warning, #f59e0b)";
                    tag.textContent = gettext("Warning");
                } else {
                    tag.classList.add("project-checker-tag-notice");
                    tag.style.backgroundColor = "var(--color-info, #3b82f6)";
                    tag.textContent = gettext("Notice");
                }
                leftCol.appendChild(tag);

                const msg = document.createElement("span");
                msg.className = "project-checker-msg";
                msg.textContent = item.message;
                msg.style.color = "var(--color-text-primary, #1f2937)";
                msg.style.fontSize = "13.5px";
                msg.style.lineHeight = "1.4";
                msg.style.fontWeight = "500";
                leftCol.appendChild(msg);

                itemRow.appendChild(leftCol);

                if (item.blockId !== null && item.blockId !== undefined) {
                    const locateBtn = document.createElement("button");
                    locateBtn.className = "project-checker-locate-btn";
                    locateBtn.textContent = gettext("Locate");
                    locateBtn.style.padding = "6px 14px";
                    locateBtn.style.fontSize = "12px";
                    locateBtn.style.fontWeight = "600";
                    locateBtn.style.fontFamily = "inherit";
                    locateBtn.style.cursor = "pointer";
                    locateBtn.style.borderRadius = "6px";
                    locateBtn.style.border = "none";
                    locateBtn.style.backgroundColor = "#2563eb";
                    locateBtn.style.color = "#ffffff";
                    locateBtn.style.whiteSpace = "nowrap";
                    locateBtn.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.15)";
                    locateBtn.style.transition = "all 0.15s ease";

                    locateBtn.addEventListener("mouseenter", () => {
                        locateBtn.style.backgroundColor = "#1d4ed8";
                        locateBtn.style.transform = "translateY(-1px)";
                        locateBtn.style.boxShadow = "0 3px 6px rgba(0, 0, 0, 0.25)";
                    });
                    locateBtn.addEventListener("mouseleave", () => {
                        locateBtn.style.backgroundColor = "#2563eb";
                        locateBtn.style.transform = "translateY(0)";
                        locateBtn.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.15)";
                    });

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
        if (!block || block.trash) {
            return;
        }

        let targetBlock = block;
        let targetBlockId = blockId;

        if (block.inCollapsed) {
            let curr = block;
            let guard = 0;
            while (curr && guard++ < 50) {
                if (
                    curr.connections &&
                    curr.connections[0] !== null &&
                    curr.connections[0] !== undefined
                ) {
                    const parent = this.activity.blocks.blockList[curr.connections[0]];
                    if (parent && parent.collapsed) {
                        if (typeof parent.collapseToggle === "function") {
                            parent.collapseToggle();
                            if (!block.inCollapsed) {
                                break;
                            }
                        }
                        targetBlock = parent;
                        targetBlockId = curr.connections[0];
                        break;
                    }
                    curr = parent;
                } else {
                    break;
                }
            }
        }

        if (targetBlock && !targetBlock.trash && typeof targetBlock.highlight === "function") {
            targetBlock.highlight();
            this._highlightedBlockId = targetBlockId;
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
