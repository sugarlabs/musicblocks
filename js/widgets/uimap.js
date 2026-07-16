// Copyright (c) 2026 Sugar Labs
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global _, docById */

/* exported UIMapWidget */
class UIMapWidget {
    /**
     * @param {Activity} activity
     */
    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;
        this.currentTab = "overview";

        // Create widget window using existing WidgetWindow infrastructure
        this.widgetWindow = window.widgetWindows.windowFor(this, "UI Map", "ui-map", true);
        this.widgetWindow.clear();
        this.widgetWindow.show();

        this.widgetWindow.onclose = () => {
            this.isOpen = false;
            this.widgetWindow.destroy();
        };

        this.render();
    }

    /**
     * @public
     * @returns {void}
     */
    render() {
        const body = this.widgetWindow.getWidgetBody();
        body.style.overflowY = "auto";
        body.style.maxHeight = "calc(100vh - 100px)";

        // Inject Stylesheet
        const styleId = "uimap-widget-styles";
        let styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = styleId;
            styleEl.textContent = `
                .uimap-container {
                    font-family: var(--font-family-system, sans-serif);
                    color: var(--color-text-primary, #1f2937);
                    background-color: var(--color-bg-primary, #ffffff);
                    padding: var(--spacing-lg, 1.5rem);
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-md, 1rem);
                    box-sizing: border-box;
                    min-height: 100%;
                }
                .uimap-title {
                    font-size: var(--font-size-2xl, 1.5rem);
                    font-weight: var(--font-weight-bold, 700);
                    margin: 0 0 var(--spacing-xs, 0.25rem) 0;
                    color: var(--color-brand-primary, #3b82f6);
                    background: linear-gradient(135deg, var(--color-brand-primary, #3b82f6) 0%, var(--color-brand-secondary, #8b5cf6) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .uimap-subtitle {
                    font-size: var(--font-size-sm, 0.875rem);
                    color: var(--color-text-secondary, #4b5563);
                    margin: 0 0 var(--spacing-md, 1rem) 0;
                }
                .uimap-tabs {
                    display: flex;
                    gap: var(--spacing-xs, 0.25rem);
                    border-bottom: 2px solid var(--color-border-primary, #d1d5db);
                    padding-bottom: var(--spacing-sm, 0.5rem);
                    margin-bottom: var(--spacing-md, 1rem);
                    flex-wrap: wrap;
                }
                .uimap-tab-btn {
                    padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
                    border: none;
                    background: none;
                    font-family: inherit;
                    font-size: var(--font-size-sm, 0.875rem);
                    font-weight: var(--font-weight-semibold, 600);
                    color: var(--color-text-secondary, #4b5563);
                    cursor: pointer;
                    border-radius: var(--radius-md, 0.375rem);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .uimap-tab-btn:hover {
                    background-color: var(--color-bg-secondary, #f3f4f6);
                    color: var(--color-brand-primary, #3b82f6);
                }
                .uimap-tab-btn.active {
                    background-color: var(--color-brand-primary, #3b82f6);
                    color: var(--color-text-inverse, #ffffff);
                    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05));
                }
                .uimap-content {
                    flex-grow: 1;
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-lg, 1.5rem);
                    animation: uimapFadeIn 0.3s ease-out;
                }
                @keyframes uimapFadeIn {
                    from { opacity: 0; transform: translateY(4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                /* Overview Grid Mockup */
                .uimap-workspace-mock {
                    display: grid;
                    grid-template-rows: 50px 180px;
                    grid-template-columns: 180px 1fr 1.2fr;
                    gap: var(--spacing-sm, 0.5rem);
                    background-color: var(--color-bg-secondary, #f3f4f6);
                    border: 1px solid var(--color-border-primary, #d1d5db);
                    border-radius: var(--radius-lg, 0.5rem);
                    padding: var(--spacing-md, 1rem);
                    box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.05);
                }
                .uimap-mock-area {
                    background-color: var(--color-bg-primary, #ffffff);
                    border: 2px dashed var(--color-border-primary, #d1d5db);
                    border-radius: var(--radius-md, 0.375rem);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-weight: var(--font-weight-bold, 700);
                    color: var(--color-text-secondary, #4b5563);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-align: center;
                    padding: var(--spacing-sm, 0.5rem);
                    font-size: var(--font-size-sm, 0.875rem);
                }
                .uimap-mock-area:hover {
                    border-color: var(--color-brand-primary, #3b82f6);
                    background-color: var(--color-info-bg, #dbeafe);
                    color: var(--color-brand-primary, #3b82f6);
                    transform: scale(1.02);
                }
                .uimap-mock-area .material-icons {
                    font-size: 24px;
                    margin-bottom: var(--spacing-xs, 0.25rem);
                }
                .uimap-mock-header {
                    grid-column: 1 / span 3;
                }
                .uimap-mock-palettes {
                    grid-column: 1;
                }
                .uimap-mock-workspace {
                    grid-column: 2;
                }
                .uimap-mock-canvas {
                    grid-column: 3;
                }
                .uimap-details-panel {
                    background-color: var(--color-bg-secondary, #f3f4f6);
                    border-left: 4px solid var(--color-brand-primary, #3b82f6);
                    border-radius: var(--radius-md, 0.375rem);
                    padding: var(--spacing-md, 1rem);
                }
                .uimap-details-panel h4 {
                    margin: 0 0 var(--spacing-sm, 0.5rem) 0;
                    color: var(--color-text-primary, #1f2937);
                    font-size: var(--font-size-md, 1rem);
                    font-weight: var(--font-weight-semibold, 600);
                }
                .uimap-details-panel p {
                    margin: 0;
                    font-size: var(--font-size-sm, 0.875rem);
                    line-height: var(--line-height-normal, 1.5);
                    color: var(--color-text-secondary, #4b5563);
                }
                /* Grid cards layout */
                .uimap-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: var(--spacing-md, 1rem);
                }
                .uimap-card {
                    background-color: var(--color-bg-primary, #ffffff);
                    border: 1px solid var(--color-border-primary, #d1d5db);
                    border-radius: var(--radius-lg, 0.5rem);
                    padding: var(--spacing-md, 1rem);
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-sm, 0.5rem);
                    transition: all 0.2s ease;
                    box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0,0,0,0.05));
                }
                .uimap-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.1));
                    border-color: var(--color-brand-primary, #3b82f6);
                }
                .uimap-card-header {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm, 0.5rem);
                    font-weight: var(--font-weight-bold, 700);
                    font-size: var(--font-size-md, 1rem);
                    color: var(--color-text-primary, #1f2937);
                }
                .uimap-card-icon {
                    color: var(--color-brand-primary, #3b82f6);
                    font-size: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    background-color: var(--color-bg-secondary, #f3f4f6);
                    border-radius: var(--radius-md, 0.375rem);
                }
                .uimap-card-desc {
                    font-size: var(--font-size-sm, 0.875rem);
                    line-height: var(--line-height-normal, 1.5);
                    color: var(--color-text-secondary, #4b5563);
                    margin: 0;
                }
                .uimap-card-footer {
                    margin-top: auto;
                    font-size: var(--font-size-xs, 0.75rem);
                    font-weight: var(--font-weight-semibold, 600);
                    color: var(--color-brand-secondary, #8b5cf6);
                }
                /* Visual Blocks Demo */
                .uimap-block-demo {
                    background-color: #ff5722;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px 16px 16px 4px;
                    display: inline-flex;
                    align-items: center;
                    font-family: var(--font-family-mono, monospace);
                    font-size: var(--font-size-xs, 0.75rem);
                    font-weight: bold;
                    margin-right: var(--spacing-xs, 0.25rem);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                }
                .uimap-block-demo.start { background-color: #4caf50; border-radius: 16px 16px 4px 4px; }
                .uimap-block-demo.action { background-color: #2196f3; }
                .uimap-block-demo.pitch { background-color: #9c27b0; }
                .uimap-block-demo.rhythm { background-color: #ffeb3b; color: #333; }

                /* Theme adjustments for dark/highcontrast modes */
                body.dark .uimap-container {
                    background-color: var(--color-bg-primary, #111827);
                    color: var(--color-text-primary, #f9fafb);
                }
                body.dark .uimap-card {
                    background-color: var(--color-bg-secondary, #1f2937);
                    border-color: var(--color-border-primary, #374151);
                }
                body.dark .uimap-card-icon {
                    background-color: var(--color-bg-tertiary, #374151);
                }
                body.highcontrast .uimap-container {
                    background-color: #000000;
                    color: #ffffff;
                }
                body.highcontrast .uimap-card {
                    background-color: #000000;
                    border: 2px solid #ffffff;
                }
                body.highcontrast .uimap-tab-btn.active {
                    background-color: #ffffff;
                    color: #000000;
                    border: 2px solid #ffffff;
                }
                body.highcontrast .uimap-tab-btn {
                    border: 1px solid #ffffff;
                    color: #ffffff;
                }
            `;
            document.head.appendChild(styleEl);
        }

        // Render Base UI
        const container = document.createElement("div");
        container.className = "uimap-container";

        const title = document.createElement("h2");
        title.className = "uimap-title";
        title.textContent = _("Music Blocks UI Map");
        container.appendChild(title);

        const subtitle = document.createElement("p");
        subtitle.className = "uimap-subtitle";
        subtitle.textContent = _(
            "A visual reference guide to navigate the workspace and discover musical coding widgets."
        );
        container.appendChild(subtitle);

        // Render Tabs Header
        const tabsContainer = document.createElement("div");
        tabsContainer.className = "uimap-tabs";
        container.appendChild(tabsContainer);

        const tabs = [
            { id: "overview", label: _("Overview Map") },
            { id: "toolbar", label: _("Toolbar & Controls") },
            { id: "blocks", label: _("Block Palettes") },
            { id: "widgets", label: _("Beginner Widgets") },
            { id: "piemenu", label: _("Pie Menu") }
        ];

        tabs.forEach(t => {
            const btn = document.createElement("button");
            btn.className = `uimap-tab-btn ${t.id === this.currentTab ? "active" : ""}`;
            btn.textContent = t.label;
            btn.onclick = () => this.switchTab(t.id);
            tabsContainer.appendChild(btn);
        });

        // Content Area Container
        this.contentArea = document.createElement("div");
        this.contentArea.className = "uimap-content";
        container.appendChild(this.contentArea);

        body.append(container);

        // Load active tab content
        this.switchTab(this.currentTab);
    }

    /**
     * @param {string} tabId
     * @returns {void}
     */
    switchTab(tabId) {
        this.currentTab = tabId;

        // Update active class on tab buttons
        const buttons = this.widgetWindow.getWidgetBody().querySelectorAll(".uimap-tab-btn");
        const tabs = ["overview", "toolbar", "blocks", "widgets", "piemenu"];
        buttons.forEach((btn, index) => {
            if (tabs[index] === tabId) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Re-render content
        this.contentArea.replaceChildren();

        if (tabId === "overview") {
            this.renderOverview();
        } else if (tabId === "toolbar") {
            this.renderToolbar();
        } else if (tabId === "blocks") {
            this.renderBlocks();
        } else if (tabId === "widgets") {
            this.renderWidgets();
        } else if (tabId === "piemenu") {
            this.renderPieMenu();
        }
    }

    /**
     * @private
     * @returns {void}
     */
    renderOverview() {
        const intro = document.createElement("p");
        intro.style.margin = "0";
        intro.style.fontSize = "var(--font-size-sm, 0.875rem)";
        intro.textContent = _(
            "Click on different areas of the visual workspace layout mockup below to view key details about them:"
        );
        this.contentArea.appendChild(intro);

        // Workspace Mockup
        const mock = document.createElement("div");
        mock.className = "uimap-workspace-mock";

        const mockHeader = document.createElement("div");
        mockHeader.className = "uimap-mock-area uimap-mock-header";
        mockHeader.innerHTML = `<i class="material-icons">menu</i> ${_(
            "Toolbar (Actions & Menus)"
        )}`;
        mockHeader.onclick = () => updateDetails("header");

        const mockPalettes = document.createElement("div");
        mockPalettes.className = "uimap-mock-area uimap-mock-palettes";
        mockPalettes.innerHTML = `<i class="material-icons">category</i> ${_("Block Categories")}`;
        mockPalettes.onclick = () => updateDetails("palettes");

        const mockWorkspace = document.createElement("div");
        mockWorkspace.className = "uimap-mock-area uimap-mock-workspace";
        mockWorkspace.innerHTML = `<i class="material-icons">dashboard</i> ${_(
            "Coding Workspace"
        )}`;
        mockWorkspace.onclick = () => updateDetails("workspace");

        const mockCanvas = document.createElement("div");
        mockCanvas.className = "uimap-mock-area uimap-mock-canvas";
        mockCanvas.innerHTML = `<i class="material-icons">play_circle_outline</i> ${_(
            "Turtle Canvas Area"
        )}`;
        mockCanvas.onclick = () => updateDetails("canvas");

        mock.appendChild(mockHeader);
        mock.appendChild(mockPalettes);
        mock.appendChild(mockWorkspace);
        mock.appendChild(mockCanvas);

        this.contentArea.appendChild(mock);

        // Details panel below mock
        const detailsPanel = document.createElement("div");
        detailsPanel.className = "uimap-details-panel";

        const detailsTitle = document.createElement("h4");
        detailsTitle.textContent = _("Select an area above");
        detailsPanel.appendChild(detailsTitle);

        const detailsDesc = document.createElement("p");
        detailsDesc.textContent = _(
            "Clicking on any of the layout sections above will load interactive descriptions and highlights here."
        );
        detailsPanel.appendChild(detailsDesc);

        this.contentArea.appendChild(detailsPanel);

        const areaData = {
            header: {
                title: _("Toolbar (Actions & Menus)"),
                desc: _(
                    "Located at the top of the screen. Hosts core actions like Play, Stop, and Record. Also houses file operations (Open/Save), mode switching (Beginner vs. Advanced modes), theme picker, and the Help dropdown menu."
                )
            },
            palettes: {
                title: _("Block Categories"),
                desc: _(
                    "Positioned on the left sidebar. Organizes programming and music blocks into color-coded groups (such as Start, Action, Rhythm, Pitch, and Volume). Clicking a category expands a drawer showing blocks ready to be dragged out."
                )
            },
            workspace: {
                title: _("Coding Workspace"),
                desc: _(
                    "The central area where blocks are dragged, connected, and arranged to assemble programs. You can scroll, zoom, organize connected code stacks, or double-click blocks to bring up context wheel menus."
                )
            },
            canvas: {
                title: _("Turtle Canvas Area"),
                desc: _(
                    "The main visual output area (often positioned on the right). Displays the running turtle/mouse artwork. Moving turtles trace colorful patterns as they execute musical blocks, providing immediate visual and audio feedback."
                )
            }
        };

        function updateDetails(area) {
            const data = areaData[area];
            if (data) {
                detailsTitle.textContent = data.title;
                detailsDesc.textContent = data.desc;
            }
        }
    }

    /**
     * @private
     * @returns {void}
     */
    renderToolbar() {
        const grid = document.createElement("div");
        grid.className = "uimap-grid";

        const items = [
            {
                icon: "play_arrow",
                name: _("Play Code"),
                desc: _(
                    "Executes all connected block stacks in the workspace, drawing artwork and playing composed music."
                )
            },
            {
                icon: "stop",
                name: _("Stop Music"),
                desc: _(
                    "Stops execution of all running programs, resets the synthesizers, and halts all musical playback."
                )
            },
            {
                icon: "fiber_manual_record",
                name: _("Record Audio"),
                desc: _(
                    "Enables recording audio directly from the synthesized output, saving your creation as a WAV file."
                )
            },
            {
                icon: "folder_open",
                name: _("Open File"),
                desc: _(
                    "Opens a file dialog to load local projects (.html, .tb), MIDI files (.mid), or custom block plugins."
                )
            },
            {
                icon: "save",
                name: _("Save Project"),
                desc: _(
                    "Saves the current workspace as a standalone HTML project with embedded audio player and editor."
                )
            },
            {
                icon: "public",
                name: _("Planet"),
                desc: _(
                    "Connects online to share your creations, search other projects, and load community samples."
                )
            },
            {
                icon: "star",
                name: _("Beginner Mode"),
                desc: _(
                    "Switches UI to simplified layout with visual interactive widgets like Phrase Maker, Rhythm Ruler, and Music Keyboard."
                )
            },
            {
                icon: "settings",
                name: _("Auxiliary Menu"),
                desc: _(
                    "Expands additional settings like JavaScript code view, statistics, pitch preview options, and coordinate grid lines."
                )
            }
        ];

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "uimap-card";

            const header = document.createElement("div");
            header.className = "uimap-card-header";
            header.innerHTML = `<span class="uimap-card-icon"><i class="material-icons">${item.icon}</i></span> <span>${item.name}</span>`;
            card.appendChild(header);

            const desc = document.createElement("p");
            desc.className = "uimap-card-desc";
            desc.textContent = item.desc;
            card.appendChild(desc);

            grid.appendChild(card);
        });

        this.contentArea.appendChild(grid);
    }

    /**
     * @private
     * @returns {void}
     */
    renderBlocks() {
        const intro = document.createElement("p");
        intro.style.margin = "0";
        intro.style.fontSize = "var(--font-size-sm, 0.875rem)";
        intro.textContent = _(
            "Blocks are grouped color-codes. Snap them together to build stacks that represent logic and melodies."
        );
        this.contentArea.appendChild(intro);

        const grid = document.createElement("div");
        grid.className = "uimap-grid";

        const items = [
            {
                class: "start",
                type: _("Start Blocks"),
                sample: "start",
                desc: _(
                    "The starting point of code stacks. The program executes blocks attached underneath when you click Play."
                )
            },
            {
                class: "action",
                type: _("Action Blocks"),
                sample: "forward 10",
                desc: _(
                    "Commands that direct movement (e.g. forward, right, pen up/down) to draw canvas artwork."
                )
            },
            {
                class: "pitch",
                type: _("Pitch Blocks"),
                sample: "solfege la",
                desc: _(
                    "Defines notes, scales, microtonal pitches, or chords played by synthesizers during runtime."
                )
            },
            {
                class: "rhythm",
                type: _("Rhythm Blocks"),
                sample: "note 1/4",
                desc: _(
                    "Determines note lengths, subdivisions, tempo beats, and rhythmic durations of musical parts."
                )
            }
        ];

        items.forEach(item => {
            const card = document.createElement("div");
            card.className = "uimap-card";

            const header = document.createElement("div");
            header.className = "uimap-card-header";
            header.innerHTML = `<span class="uimap-block-demo ${item.class}">${item.sample}</span> <span>${item.type}</span>`;
            card.appendChild(header);

            const desc = document.createElement("p");
            desc.className = "uimap-card-desc";
            desc.textContent = item.desc;
            card.appendChild(desc);

            grid.appendChild(card);
        });

        this.contentArea.appendChild(grid);
    }

    /**
     * @private
     * @returns {void}
     */
    renderWidgets() {
        const grid = document.createElement("div");
        grid.className = "uimap-grid";

        const widgets = [
            {
                icon: "dashboard_customize",
                name: _("Phrase Maker"),
                desc: _(
                    "A 2D grid editor designed for beginners. The vertical axis represents note pitches, and the horizontal axis represents musical beats. Drag notes to draw melodies easily."
                )
            },
            {
                icon: "view_timeline",
                name: _("Rhythm Ruler"),
                desc: _(
                    "A visual timeline tool to compose and edit rhythmic patterns. Click subdivisions on the ruler to add beats, select notes, and learn how fractions construct musical rhythm."
                )
            },
            {
                icon: "piano",
                name: _("Music Keyboard"),
                desc: _(
                    "An interactive piano keyboard overlay. Click the keys to play notes, record note sequences, and see their positions on a treble/bass staff and solfege letters."
                )
            },
            {
                icon: "stairs",
                name: _("Pitch Staircase"),
                desc: _(
                    "A vertical set of steps representing the musical scale. Helps you visualize notes rising and falling in pitch and understand intervals (steps between notes)."
                )
            }
        ];

        widgets.forEach(w => {
            const card = document.createElement("div");
            card.className = "uimap-card";

            const header = document.createElement("div");
            header.className = "uimap-card-header";
            header.innerHTML = `<span class="uimap-card-icon"><i class="material-icons">${w.icon}</i></span> <span>${w.name}</span>`;
            card.appendChild(header);

            const desc = document.createElement("p");
            desc.className = "uimap-card-desc";
            desc.textContent = w.desc;
            card.appendChild(desc);

            grid.appendChild(card);
        });

        this.contentArea.appendChild(grid);
    }

    /**
     * @private
     * @returns {void}
     */
    renderPieMenu() {
        const intro = document.createElement("p");
        intro.style.margin = "0";
        intro.style.fontSize = "var(--font-size-sm, 0.875rem)";
        intro.textContent = _(
            "Double-clicking a block or the canvas workspace triggers a context-sensitive circular Pie Menu with these operations:"
        );
        this.contentArea.appendChild(intro);

        const grid = document.createElement("div");
        grid.className = "uimap-grid";

        const operations = [
            {
                icon: "content_copy",
                name: _("Clone Stack"),
                desc: _(
                    "Duplicates the selected block along with all blocks attached beneath it, letting you replicate structures quickly."
                )
            },
            {
                icon: "delete",
                name: _("Delete Stack"),
                desc: _(
                    "Deletes the selected block stack. Deleted code blocks are moved to the Trash and can be restored."
                )
            },
            {
                icon: "help_outline",
                name: _("Show Help"),
                desc: _(
                    "Opens the documentation widget explaining the specific block's behavior, inputs, and code examples."
                )
            },
            {
                icon: "unfold_less",
                name: _("Collapse Blocks"),
                desc: _(
                    "Folds the block stack into a single compact header block to declutter and save workspace space."
                )
            },
            {
                icon: "unfold_more",
                name: _("Expand Blocks"),
                desc: _(
                    "Restores collapsed block stacks back to full size so you can edit their internal blocks."
                )
            }
        ];

        operations.forEach(op => {
            const card = document.createElement("div");
            card.className = "uimap-card";

            const header = document.createElement("div");
            header.className = "uimap-card-header";
            header.innerHTML = `<span class="uimap-card-icon"><i class="material-icons">${op.icon}</i></span> <span>${op.name}</span>`;
            card.appendChild(header);

            const desc = document.createElement("p");
            desc.className = "uimap-card-desc";
            desc.textContent = op.desc;
            card.appendChild(desc);

            grid.appendChild(card);
        });

        this.contentArea.appendChild(grid);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = UIMapWidget;
}
