// Copyright (c) 2026 Sugar Labs
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

   docById, _, CallGraphAnalyzer, CallGraphLayout
 */

/* exported CallGraphWidget */

/**
 * Interactive Code Map Widget for Sugar Labs MusicBlocks.
 *
 * Renders an interactive SVG call-graph visualizer representing Action
 * dependencies, roots, dynamic/unresolved calls, missing definitions,
 * and direct/indirect recursion with click-to-focus workspace navigation.
 */
class CallGraphWidget {
    /**
     * @param {Object} activity - The global MusicBlocks Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;
        this.currentFilter = "";

        // Transform state for pan and zoom
        this.transform = {
            x: 0,
            y: 0,
            scale: 1
        };
        this.isPanning = false;
        this.startPanPoint = { x: 0, y: 0 };

        this._setupWindow();
        this._buildUI();
        this.refresh();
        if (typeof this.widgetWindow?.sendToCenter === "function") {
            this.widgetWindow.sendToCenter();
        }
        this.fitToView();
    }

    /**
     * Initializes the widget window via MusicBlocks' widgetWindows system.
     *
     * @private
     */
    _setupWindow() {
        const title = typeof _ === "function" ? _("Code Map") : "Code Map";
        this.widgetWindow = window.widgetWindows.windowFor(this, title, "code map");
        this.widgetWindow.clear();
        this.widgetWindow.show();
        if (
            typeof this.widgetWindow.getWidgetFrame === "function" &&
            this.widgetWindow.getWidgetFrame()
        ) {
            this.widgetWindow.getWidgetFrame().classList.add("codemap-widget-frame");
        }

        // Window controls
        this.widgetWindow.addButton(
            "reload.svg",
            24,
            typeof _ === "function" ? _("Refresh") : "Refresh"
        ).onclick = () => {
            this.refresh();
        };

        this.widgetWindow.addButton(
            "icon-expand.svg",
            24,
            typeof _ === "function" ? _("Fit to View") : "Fit to View"
        ).onclick = () => {
            this.fitToView();
        };

        this.widgetWindow.onclose = () => {
            this.destroy();
        };

        this.widgetWindow.onmaximize = () => {
            setTimeout(() => this.fitToView(), 100);
        };
    }

    /**
     * Constructs the widget UI elements inside the window body.
     *
     * @private
     */
    _buildUI() {
        const body = this.widgetWindow.getWidgetBody();
        body.replaceChildren();
        body.className = "wfbWidget codemap-widget-body";

        // Top control & status bar
        const headerBar = document.createElement("div");
        headerBar.className = "codemap-header-bar";

        // Search input
        const searchContainer = document.createElement("div");
        searchContainer.className = "codemap-search-container";

        const searchInput = document.createElement("input");
        searchInput.type = "search";
        searchInput.className = "codemap-search-input";
        searchInput.placeholder =
            typeof _ === "function" ? _("Filter actions...") : "Filter actions...";
        searchInput.setAttribute(
            "aria-label",
            typeof _ === "function" ? _("Filter actions") : "Filter actions"
        );
        searchInput.oninput = e => {
            this.currentFilter = (e.target.value || "").trim().toLowerCase();
            this._applyFilter();
        };
        this.searchInput = searchInput;
        searchContainer.appendChild(searchInput);

        // Status summary badge
        const summaryBadge = document.createElement("div");
        summaryBadge.className = "codemap-summary-badge";
        summaryBadge.setAttribute("role", "status");
        summaryBadge.setAttribute("aria-live", "polite");
        this.summaryBadge = summaryBadge;

        headerBar.appendChild(searchContainer);
        headerBar.appendChild(summaryBadge);
        body.appendChild(headerBar);

        // SVG Viewport Container
        const viewport = document.createElement("div");
        viewport.className = "codemap-viewport";
        this.viewport = viewport;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "codemap-svg");
        svg.setAttribute("tabindex", "0");
        svg.setAttribute("role", "application");
        svg.setAttribute(
            "aria-label",
            typeof _ === "function" ? _("Action Call Graph") : "Action Call Graph"
        );
        this.svg = svg;

        // SVG Defs (Markers)
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

        // Normal Arrow Marker
        const markerNormal = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        markerNormal.setAttribute("id", "arrow-normal");
        markerNormal.setAttribute("viewBox", "0 0 10 10");
        markerNormal.setAttribute("refX", "9");
        markerNormal.setAttribute("refY", "5");
        markerNormal.setAttribute("markerWidth", "6");
        markerNormal.setAttribute("markerHeight", "6");
        markerNormal.setAttribute("orient", "auto-start-reverse");
        const pathNormal = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathNormal.setAttribute("d", "M 0 1 L 10 5 L 0 9 z");
        pathNormal.setAttribute("fill", "#64748b");
        markerNormal.appendChild(pathNormal);
        defs.appendChild(markerNormal);

        // Recursive Arrow Marker
        const markerRec = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        markerRec.setAttribute("id", "arrow-recursive");
        markerRec.setAttribute("viewBox", "0 0 10 10");
        markerRec.setAttribute("refX", "9");
        markerRec.setAttribute("refY", "5");
        markerRec.setAttribute("markerWidth", "7");
        markerRec.setAttribute("markerHeight", "7");
        markerRec.setAttribute("orient", "auto-start-reverse");
        const pathRec = document.createElementNS("http://www.w3.org/2000/svg", "path");
        pathRec.setAttribute("d", "M 0 1 L 10 5 L 0 9 z");
        pathRec.setAttribute("fill", "#ef4444");
        markerRec.appendChild(pathRec);
        defs.appendChild(markerRec);

        svg.appendChild(defs);

        // Graph Root Group (for panning & zooming)
        const graphRoot = document.createElementNS("http://www.w3.org/2000/svg", "g");
        graphRoot.setAttribute("class", "codemap-root-group");
        this.graphRoot = graphRoot;
        svg.appendChild(graphRoot);

        viewport.appendChild(svg);
        body.appendChild(viewport);

        // Bind Pan and Zoom
        this._bindInteractions();
    }

    /**
     * Binds pointer and wheel events for pan/zoom navigation.
     *
     * @private
     */
    _bindInteractions() {
        this._onMouseDown = e => {
            if (e.target.closest && e.target.closest(".codemap-node")) {
                return; // Allow node click
            }
            this.isPanning = true;
            this.startPanPoint = {
                x: e.clientX - this.transform.x,
                y: e.clientY - this.transform.y
            };
            this.svg.style.cursor = "grabbing";
        };

        this._onMouseMove = e => {
            if (!this.isPanning) {
                return;
            }
            this.transform.x = e.clientX - this.startPanPoint.x;
            this.transform.y = e.clientY - this.startPanPoint.y;
            this._updateTransform();
        };

        this._onMouseUp = () => {
            this.isPanning = false;
            if (this.svg) {
                this.svg.style.cursor = "grab";
            }
        };

        this._onWheel = e => {
            e.preventDefault();
            if (
                !this.viewport ||
                !Number.isFinite(this.transform.scale) ||
                this.transform.scale <= 0
            ) {
                return;
            }
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = Math.max(0.05, Math.min(3.0, this.transform.scale * zoomFactor));

            // Zoom towards mouse position
            const rect = this.viewport.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.transform.x =
                mouseX - (mouseX - this.transform.x) * (newScale / this.transform.scale);
            this.transform.y =
                mouseY - (mouseY - this.transform.y) * (newScale / this.transform.scale);
            this.transform.scale = newScale;

            this._updateTransform();
        };

        this.svg.addEventListener("mousedown", this._onMouseDown);
        window.addEventListener("mousemove", this._onMouseMove);
        window.addEventListener("mouseup", this._onMouseUp);
        this.viewport.addEventListener("wheel", this._onWheel, { passive: false });
    }

    /**
     * Re-analyzes the current workspace blocks and renders the updated graph.
     */
    refresh() {
        const blocks = this.activity?.blocks?.blockList || [];
        const Analyzer =
            typeof CallGraphAnalyzer !== "undefined"
                ? CallGraphAnalyzer
                : require
                  ? require("./CallGraphAnalyzer.js").CallGraphAnalyzer
                  : null;
        const Layout =
            typeof CallGraphLayout !== "undefined"
                ? CallGraphLayout
                : require
                  ? require("./CallGraphLayout.js").CallGraphLayout
                  : null;

        if (!Analyzer || !Layout) {
            console.error("Code Map dependencies not loaded.");
            return;
        }

        const analysis = Analyzer.analyze(blocks);
        const layout = Layout.compute(analysis);

        this.currentAnalysis = analysis;
        this.currentLayout = layout;

        this._renderGraph(analysis, layout);
        this._updateSummary(analysis.summary, analysis.cycles);
        this.fitToView();
    }

    /**
     * Renders SVG elements for all nodes and edges based on computed layout.
     *
     * @private
     * @param {Object} analysis
     * @param {Object} layout
     */
    _renderGraph(analysis, layout) {
        this.graphRoot.replaceChildren();

        const { positionedNodes = [], routedEdges = [] } = layout;

        // Render Empty State if no nodes exist
        if (positionedNodes.length === 0) {
            const emptyText = document.createElementNS("http://www.w3.org/2000/svg", "text");
            emptyText.setAttribute("x", "300");
            emptyText.setAttribute("y", "200");
            emptyText.setAttribute("text-anchor", "middle");
            emptyText.setAttribute("class", "codemap-empty-text");
            emptyText.textContent =
                typeof _ === "function"
                    ? _("No action definitions or start stacks found in workspace.")
                    : "No action definitions or start stacks found in workspace.";
            this.graphRoot.appendChild(emptyText);
            return;
        }

        // 1. Render Edges Group
        const edgesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        edgesGroup.setAttribute("class", "codemap-edges-group");

        for (const edge of routedEdges) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", edge.pathD);
            path.setAttribute(
                "class",
                `codemap-edge ${edge.isRecursive ? "codemap-edge-recursive" : ""}`
            );
            path.setAttribute("marker-end", `url(#${edge.markerType})`);

            // Tooltip title
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            const recSuffix = edge.isRecursive
                ? ` (${typeof _ === "function" ? _("Recursive") : "Recursive"})`
                : "";
            title.textContent = `${edge.callType}: ${edge.source} -> ${edge.target}${recSuffix}`;
            path.appendChild(title);

            edgesGroup.appendChild(path);
        }
        this.graphRoot.appendChild(edgesGroup);

        // 2. Render Nodes Group
        const nodesGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
        nodesGroup.setAttribute("class", "codemap-nodes-group");

        for (const node of positionedNodes) {
            const nodeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
            const nodeClasses = [
                "codemap-node",
                `codemap-node-${node.type}`,
                node.isRecursive ? "codemap-node-recursive" : "",
                node.isIncomplete ? "codemap-node-incomplete" : "",
                node.isDuplicate ? "codemap-node-duplicate" : ""
            ]
                .filter(Boolean)
                .join(" ");

            nodeG.setAttribute("class", nodeClasses);
            nodeG.setAttribute("tabindex", "0");
            nodeG.setAttribute("role", "button");
            nodeG.setAttribute(
                "aria-label",
                `${node.type} ${node.label}${node.isRecursive ? ", recursive" : ""}`
            );
            nodeG.dataset.nodeId = node.id;
            nodeG.dataset.label = (node.label || "").toLowerCase();

            const rectX = node.x - node.width / 2;
            const rectY = node.y - node.height / 2;

            // Background rect
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", String(rectX));
            rect.setAttribute("y", String(rectY));
            rect.setAttribute("width", String(node.width));
            rect.setAttribute("height", String(node.height));
            rect.setAttribute("rx", "12");
            rect.setAttribute("ry", "12");
            rect.setAttribute("class", "codemap-node-rect");
            nodeG.appendChild(rect);

            // Icon prefix
            let iconText = "";
            if (node.type === "start") {
                iconText = "▶ ";
            } else if (node.isRecursive) {
                iconText = "↻ ";
            } else if (node.type === "missing") {
                iconText = "? ";
            } else if (node.type === "dynamic") {
                iconText = "~ ";
            }

            // Node Label
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", String(node.x));
            text.setAttribute("y", String(node.y + 1));
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "central");
            text.setAttribute("class", "codemap-node-text");
            text.textContent = `${iconText}${node.label}`;
            nodeG.appendChild(text);

            // Call count badge if called
            if (node.calledByCount > 1) {
                const badge = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                badge.setAttribute("cx", String(rectX + node.width - 6));
                badge.setAttribute("cy", String(rectY + 6));
                badge.setAttribute("r", "8");
                badge.setAttribute("class", "codemap-badge-bg");
                nodeG.appendChild(badge);

                const badgeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
                badgeText.setAttribute("x", String(rectX + node.width - 6));
                badgeText.setAttribute("y", String(rectY + 7));
                badgeText.setAttribute("text-anchor", "middle");
                badgeText.setAttribute("dominant-baseline", "central");
                badgeText.setAttribute("class", "codemap-badge-text");
                badgeText.textContent = String(node.calledByCount);
                nodeG.appendChild(badgeText);
            }

            // Accessibility tooltip
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            const focusHint =
                typeof _ === "function"
                    ? _("Click to focus block in workspace")
                    : "Click to focus block in workspace";
            title.textContent = `${node.label} (${node.type})\n${focusHint}`;
            nodeG.appendChild(title);

            // Click and keyboard focus handlers
            nodeG.onclick = () => {
                this.focusNode(node);
            };

            nodeG.onkeydown = e => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    this.focusNode(node);
                }
            };

            nodesGroup.appendChild(nodeG);
        }
        this.graphRoot.appendChild(nodesGroup);
    }

    /**
     * Updates the status summary badge with counts and recursion alerts.
     *
     * @private
     * @param {Object} summary
     * @param {Array<Array<string>>} cycles
     */
    _updateSummary(summary, cycles) {
        if (!this.summaryBadge) {
            return;
        }

        const totalActions = summary.totalActions || 0;
        const totalCalls = summary.totalCalls || 0;
        const recCount = summary.recursiveActionsCount || 0;

        const actionLabel =
            totalActions === 1
                ? typeof _ === "function"
                    ? _("1 Action")
                    : "1 Action"
                : typeof _ === "function"
                  ? _("%s Actions").replace("%s", totalActions)
                  : `${totalActions} Actions`;
        const callLabel =
            totalCalls === 1
                ? typeof _ === "function"
                    ? _("1 Call")
                    : "1 Call"
                : typeof _ === "function"
                  ? _("%s Calls").replace("%s", totalCalls)
                  : `${totalCalls} Calls`;

        let statusText = `${actionLabel} • ${callLabel}`;
        if (recCount > 0) {
            const recLabel =
                typeof _ === "function"
                    ? _("%s Recursive").replace("%s", recCount)
                    : `${recCount} Recursive`;
            statusText += ` • ⚠️ ${recLabel}`;
            this.summaryBadge.className = "codemap-summary-badge codemap-summary-warning";
        } else {
            this.summaryBadge.className = "codemap-summary-badge";
        }

        if (summary.missingTargetsCount > 0) {
            const missingLabel =
                typeof _ === "function"
                    ? _("%s Missing").replace("%s", summary.missingTargetsCount)
                    : `${summary.missingTargetsCount} Missing`;
            statusText += ` • ${missingLabel}`;
        }

        this.summaryBadge.textContent = statusText;
    }

    /**
     * Applies filter text to node visibility in the SVG.
     *
     * @private
     */
    _applyFilter() {
        if (!this.graphRoot) {
            return;
        }

        const nodeElements = this.graphRoot.querySelectorAll(".codemap-node");
        for (const el of nodeElements) {
            const label = el.dataset.label || "";
            if (!this.currentFilter || label.includes(this.currentFilter)) {
                el.classList.remove("codemap-node-dimmed");
            } else {
                el.classList.add("codemap-node-dimmed");
            }
        }
    }

    /**
     * Panning / focusing workspace on a given block.
     *
     * @param {Object} node - Target node object.
     * @returns {boolean} True if successfully navigated.
     */
    focusNode(node) {
        if (
            !node ||
            node.blockId === null ||
            node.blockId === undefined ||
            !this.activity?.blocks?.blockList
        ) {
            return false;
        }

        let block = this.activity.blocks.blockList[node.blockId];
        const isTargetBlock = b =>
            b &&
            (b.blockIndex === node.blockId ||
                b.id === node.blockId ||
                (b === this.activity.blocks.blockList[node.blockId] &&
                    b.id === undefined &&
                    b.blockIndex === undefined));

        if (!isTargetBlock(block)) {
            const list = Array.isArray(this.activity.blocks.blockList)
                ? this.activity.blocks.blockList
                : Object.values(this.activity.blocks.blockList);
            block = list.find(b => b && (b.blockIndex === node.blockId || b.id === node.blockId));
        }

        if (!block || block.trash || !block.container) {
            return false;
        }

        // Highlight selected node in Code Map SVG
        if (this.graphRoot) {
            const nodeEls = this.graphRoot.querySelectorAll(".codemap-node");
            for (const el of nodeEls) {
                el.classList.remove("codemap-node-selected");
            }
            const targetEl = this.graphRoot.querySelector(`.codemap-node[data-id="${node.id}"]`);
            if (targetEl) {
                targetEl.classList.add("codemap-node-selected");
            }
        }

        // Center block in canvas viewport
        const canvas = this.activity.canvas || docById("myCanvas");
        if (canvas && this.activity.blocksContainer) {
            this.activity.blocksContainer.x = Math.round(canvas.width / 2 - block.container.x);
            this.activity.blocksContainer.y = Math.round(canvas.height / 2 - block.container.y);
        }

        // Temporary visual highlight
        if (typeof block.highlight === "function") {
            block.highlight();
            this._refreshStage();

            setTimeout(() => {
                if (typeof block.unhighlight === "function") {
                    block.unhighlight();
                    this._refreshStage();
                }
            }, 1500);
        }

        return true;
    }

    /**
     * Refreshes the EaselJS canvas stage.
     *
     * @private
     */
    _refreshStage() {
        if (typeof this.activity?.refreshCanvas === "function") {
            this.activity.refreshCanvas();
        } else if (this.activity?.stage && typeof this.activity.stage.update === "function") {
            this.activity.stage.update();
        }
    }

    /**
     * Auto-fits and centers the graph within the viewport.
     */
    fitToView() {
        if (!this.currentLayout || !this.currentLayout.bounds || !this.viewport) {
            return;
        }

        const { bounds } = this.currentLayout;
        const minX = Number.isFinite(bounds.minX) ? bounds.minX : 0;
        const maxX = Number.isFinite(bounds.maxX) ? bounds.maxX : 600;
        const minY = Number.isFinite(bounds.minY) ? bounds.minY : 0;
        const maxY = Number.isFinite(bounds.maxY) ? bounds.maxY : 400;

        const graphW = Math.max(50, maxX - minX + 40);
        const graphH = Math.max(50, maxY - minY + 40);

        const vRect = this.viewport.getBoundingClientRect();
        const vWidth = Math.max(100, vRect.width || 600);
        const vHeight = Math.max(100, vRect.height || 400);

        const availableW = Math.max(20, vWidth - 40);
        const availableH = Math.max(20, vHeight - 40);

        const rawScale = Math.min(availableW / graphW, availableH / graphH);
        const scale = Number.isFinite(rawScale) ? Math.max(0.05, Math.min(1.2, rawScale)) : 1;

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        const tx = Math.round(vWidth / 2 - centerX * scale);
        const ty = Math.round(vHeight / 2 - centerY * scale);

        this.transform = { x: tx, y: ty, scale };
        this._updateTransform();
    }

    /**
     * Updates the SVG transform attribute for pan & zoom.
     *
     * @private
     */
    _updateTransform() {
        if (this.graphRoot) {
            this.graphRoot.setAttribute(
                "transform",
                `translate(${this.transform.x}, ${this.transform.y}) scale(${this.transform.scale})`
            );
        }
    }

    /**
     * Cleans up event listeners and destroys the widget window.
     */
    destroy() {
        this.isOpen = false;

        if (this.svg && this._onMouseDown) {
            this.svg.removeEventListener("mousedown", this._onMouseDown);
        }
        if (this._onMouseMove) {
            window.removeEventListener("mousemove", this._onMouseMove);
        }
        if (this._onMouseUp) {
            window.removeEventListener("mouseup", this._onMouseUp);
        }
        if (this.viewport && this._onWheel) {
            this.viewport.removeEventListener("wheel", this._onWheel);
        }

        if (this.widgetWindow && typeof this.widgetWindow.destroy === "function") {
            this.widgetWindow.destroy();
        }

        if (this.activity) {
            this.activity.codeMapWidget = null;
        }
    }
}

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.CallGraphWidget = CallGraphWidget;
        return { CallGraphWidget };
    });
} else if (typeof module !== "undefined" && module.exports) {
    module.exports = { CallGraphWidget };
}
