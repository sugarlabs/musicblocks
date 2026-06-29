// Copyright (c) 2024 Yash Sharma
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget displays starter templates for new users.

/* global _ */
/*
    Globals locations:
    - js/utils/utils.js
        _
*/

/*exported StarterTemplates*/
class StarterTemplates {
    static STORAGE_KEY = "mb_hasSeenTemplates";

    static TEMPLATES = [
        {
            id: "my-first-melody",
            title: "My First Melody",
            description: "Play a simple Do-Re-Mi melody using note and pitch blocks.",
            category: "melody",
            difficulty: 1,
            blocks: [
                [0, "start", 250, 100, [null, 1, null]],
                [1, "settimbre", 0, 0, [0, 2, 4, 3]],
                [2, ["voicename", { value: "piano" }], 0, 0, [1]],
                [3, "hidden", 0, 0, [1, null]],
                [4, "newnote", 0, 0, [1, 5, 8, 12]],
                [5, "divide", 0, 0, [4, 6, 7]],
                [6, ["number", { value: 1 }], 0, 0, [5]],
                [7, ["number", { value: 4 }], 0, 0, [5]],
                [8, "vspace", 0, 0, [4, 9]],
                [9, "pitch", 0, 0, [8, 10, 11, null]],
                [10, ["solfege", { value: "do" }], 0, 0, [9]],
                [11, ["number", { value: 4 }], 0, 0, [9]],
                [12, "hidden", 0, 0, [4, 13]],
                [13, "newnote", 0, 0, [12, 14, 17, 21]],
                [14, "divide", 0, 0, [13, 15, 16]],
                [15, ["number", { value: 1 }], 0, 0, [14]],
                [16, ["number", { value: 4 }], 0, 0, [14]],
                [17, "vspace", 0, 0, [13, 18]],
                [18, "pitch", 0, 0, [17, 19, 20, null]],
                [19, ["solfege", { value: "re" }], 0, 0, [18]],
                [20, ["number", { value: 4 }], 0, 0, [18]],
                [21, "hidden", 0, 0, [13, 22]],
                [22, "newnote", 0, 0, [21, 23, 26, 30]],
                [23, "divide", 0, 0, [22, 24, 25]],
                [24, ["number", { value: 1 }], 0, 0, [23]],
                [25, ["number", { value: 4 }], 0, 0, [23]],
                [26, "vspace", 0, 0, [22, 27]],
                [27, "pitch", 0, 0, [26, 28, 29, null]],
                [28, ["solfege", { value: "mi" }], 0, 0, [27]],
                [29, ["number", { value: 4 }], 0, 0, [27]],
                [30, "hidden", 0, 0, [22, 31]],
                [31, "newnote", 0, 0, [30, 32, 35, 39]],
                [32, "divide", 0, 0, [31, 33, 34]],
                [33, ["number", { value: 1 }], 0, 0, [32]],
                [34, ["number", { value: 2 }], 0, 0, [32]],
                [35, "vspace", 0, 0, [31, 36]],
                [36, "pitch", 0, 0, [35, 37, 38, null]],
                [37, ["solfege", { value: "do" }], 0, 0, [36]],
                [38, ["number", { value: 4 }], 0, 0, [36]],
                [39, "hidden", 0, 0, [31, null]]
            ]
        },
        {
            id: "drum-beat",
            title: "Drum Beat",
            description: "Create a repeating drum pattern using rhythm and drum blocks.",
            category: "rhythm",
            difficulty: 1,
            blocks: [
                [0, "start", 250, 100, [null, 1, null]],
                [1, "repeat", 0, 0, [0, 2, 3, 16]],
                [2, ["number", { value: 4 }], 0, 0, [1]],
                [3, "newnote", 0, 0, [1, 4, 7, 8]],
                [4, "divide", 0, 0, [3, 5, 6]],
                [5, ["number", { value: 1 }], 0, 0, [4]],
                [6, ["number", { value: 4 }], 0, 0, [4]],
                [7, "vspace", 0, 0, [3, 17]],
                [8, "hidden", 0, 0, [3, 9]],
                [9, "newnote", 0, 0, [8, 10, 13, 15]],
                [10, "divide", 0, 0, [9, 11, 12]],
                [11, ["number", { value: 1 }], 0, 0, [10]],
                [12, ["number", { value: 8 }], 0, 0, [10]],
                [13, "vspace", 0, 0, [9, 14]],
                [14, ["playdrum", { value: "hi hat" }], 0, 0, [13, null]],
                [15, "hidden", 0, 0, [9, null]],
                [16, "hidden", 0, 0, [1, null]],
                [17, ["playdrum", { value: "kick drum" }], 0, 0, [7, null]]
            ]
        },
        {
            id: "drawing-music",
            title: "Drawing Music",
            description: "Combine music with turtle graphics to draw shapes while playing notes.",
            category: "art",
            difficulty: 2,
            blocks: [
                [0, "start", 250, 100, [null, 1, null]],
                [1, "repeat", 0, 0, [0, 2, 3, 24]],
                [2, ["number", { value: 4 }], 0, 0, [1]],
                [3, "newnote", 0, 0, [1, 4, 7, 11]],
                [4, "divide", 0, 0, [3, 5, 6]],
                [5, ["number", { value: 1 }], 0, 0, [4]],
                [6, ["number", { value: 4 }], 0, 0, [4]],
                [7, "vspace", 0, 0, [3, 8]],
                [8, "pitch", 0, 0, [7, 9, 10, null]],
                [9, ["solfege", { value: "sol" }], 0, 0, [8]],
                [10, ["number", { value: 4 }], 0, 0, [8]],
                [11, "hidden", 0, 0, [3, 12]],
                [12, "forward", 0, 0, [11, 13, 14]],
                [13, ["number", { value: 100 }], 0, 0, [12]],
                [14, "right", 0, 0, [12, 15, 16]],
                [15, ["number", { value: 90 }], 0, 0, [14]],
                [16, "newnote", 0, 0, [14, 17, 20, 25]],
                [17, "divide", 0, 0, [16, 18, 19]],
                [18, ["number", { value: 1 }], 0, 0, [17]],
                [19, ["number", { value: 4 }], 0, 0, [17]],
                [20, "vspace", 0, 0, [16, 21]],
                [21, "pitch", 0, 0, [20, 22, 23, null]],
                [22, ["solfege", { value: "mi" }], 0, 0, [21]],
                [23, ["number", { value: 4 }], 0, 0, [21]],
                [24, "hidden", 0, 0, [1, null]],
                [25, "hidden", 0, 0, [16, null]]
            ]
        },
        {
            id: "repeat-and-grow",
            title: "Repeat and Grow",
            description:
                "Use repeat blocks with changing pitch to create growing musical patterns.",
            category: "pattern",
            difficulty: 2,
            blocks: [
                [0, "start", 250, 100, [null, 1, null]],
                [1, "settimbre", 0, 0, [0, 2, 4, 3]],
                [2, ["voicename", { value: "piano" }], 0, 0, [1]],
                [3, "hidden", 0, 0, [1, null]],
                [4, "repeat", 0, 0, [1, 5, 6, 17]],
                [5, ["number", { value: 8 }], 0, 0, [4]],
                [6, "newnote", 0, 0, [4, 7, 10, 14]],
                [7, "divide", 0, 0, [6, 8, 9]],
                [8, ["number", { value: 1 }], 0, 0, [7]],
                [9, ["number", { value: 4 }], 0, 0, [7]],
                [10, "vspace", 0, 0, [6, 11]],
                [11, "pitch", 0, 0, [10, 12, 13, null]],
                [12, ["solfege", { value: "do" }], 0, 0, [11]],
                [13, ["number", { value: 4 }], 0, 0, [11]],
                [14, "hidden", 0, 0, [6, 15]],
                [15, "steppitch", 0, 0, [14, 16, null]],
                [16, ["number", { value: 1 }], 0, 0, [15]],
                [17, "hidden", 0, 0, [4, null]]
            ]
        },
        {
            id: "simple-chords",
            title: "Simple Chords",
            description: "Play multiple notes together to create chords and harmony.",
            category: "harmony",
            difficulty: 2,
            blocks: [
                [0, "start", 250, 100, [null, 1, null]],
                [1, "settimbre", 0, 0, [0, 2, 4, 3]],
                [2, ["voicename", { value: "piano" }], 0, 0, [1]],
                [3, "hidden", 0, 0, [1, null]],
                [4, "newnote", 0, 0, [1, 5, 8, 18]],
                [5, "divide", 0, 0, [4, 6, 7]],
                [6, ["number", { value: 1 }], 0, 0, [5]],
                [7, ["number", { value: 1 }], 0, 0, [5]],
                [8, "vspace", 0, 0, [4, 9]],
                [9, "pitch", 0, 0, [8, 10, 11, 12]],
                [10, ["solfege", { value: "do" }], 0, 0, [9]],
                [11, ["number", { value: 4 }], 0, 0, [9]],
                [12, "pitch", 0, 0, [9, 13, 14, 15]],
                [13, ["solfege", { value: "mi" }], 0, 0, [12]],
                [14, ["number", { value: 4 }], 0, 0, [12]],
                [15, "pitch", 0, 0, [12, 16, 17, null]],
                [16, ["solfege", { value: "sol" }], 0, 0, [15]],
                [17, ["number", { value: 4 }], 0, 0, [15]],
                [18, "hidden", 0, 0, [4, null]]
            ]
        }
    ];

    constructor(activity) {
        this.activity = activity;
        this.isOpen = true;

        const widgetWindow = window.widgetWindows.windowFor(
            this,
            "starter-templates",
            _("Starter Templates"),
            false
        );
        widgetWindow.getWidgetBody().style.maxHeight = "70vh";
        widgetWindow.getWidgetBody().style.overflowY = "auto";
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        widgetWindow.onclose = () => {
            this.isOpen = false;
            localStorage.setItem(StarterTemplates.STORAGE_KEY, "true");
            widgetWindow.destroy();
        };

        this._container = document.createElement("div");
        this._container.style.padding = "16px";
        this._container.style.fontFamily = '"Roboto", "Helvetica", "Arial", sans-serif';
        widgetWindow.getWidgetBody().appendChild(this._container);

        this._render();
        setTimeout(widgetWindow.sendToCenter, 50);
    }

    _render() {
        const container = this._container;

        const header = document.createElement("div");
        header.style.textAlign = "center";
        header.style.marginBottom = "20px";

        const title = document.createElement("h3");
        title.textContent = _("Welcome to Music Blocks!");
        title.style.margin = "0 0 8px 0";
        title.style.fontSize = "20px";
        title.style.color = "#333";
        header.appendChild(title);

        const subtitle = document.createElement("p");
        subtitle.textContent = _(
            "Choose a starter template to begin, or close this window to start from scratch."
        );
        subtitle.style.margin = "0";
        subtitle.style.fontSize = "14px";
        subtitle.style.color = "#666";
        header.appendChild(subtitle);

        container.appendChild(header);

        const grid = document.createElement("div");
        grid.style.display = "grid";
        grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";
        grid.style.gap = "12px";

        for (const template of StarterTemplates.TEMPLATES) {
            grid.appendChild(this._createCard(template));
        }

        container.appendChild(grid);

        const dontShowContainer = document.createElement("div");
        dontShowContainer.style.textAlign = "center";
        dontShowContainer.style.marginTop = "16px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "mb-dont-show-templates";
        checkbox.checked = localStorage.getItem(StarterTemplates.STORAGE_KEY) === "true";
        checkbox.addEventListener("change", () => {
            localStorage.setItem(StarterTemplates.STORAGE_KEY, checkbox.checked ? "true" : "false");
        });

        const label = document.createElement("label");
        label.htmlFor = "mb-dont-show-templates";
        label.textContent = _(" Don't show this on startup");
        label.style.fontSize = "13px";
        label.style.color = "#888";
        label.style.cursor = "pointer";

        dontShowContainer.appendChild(checkbox);
        dontShowContainer.appendChild(label);
        container.appendChild(dontShowContainer);
    }

    _createCard(template) {
        const CATEGORY_COLORS = {
            melody: "#4CAF50",
            rhythm: "#FF9800",
            art: "#9C27B0",
            pattern: "#2196F3",
            harmony: "#E91E63"
        };

        const card = document.createElement("div");
        card.style.border = "1px solid #ddd";
        card.style.borderRadius = "8px";
        card.style.padding = "16px";
        card.style.cursor = "pointer";
        card.style.transition = "box-shadow 0.2s, transform 0.2s";
        card.style.backgroundColor = "#fff";

        card.addEventListener("mouseenter", () => {
            card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
            card.style.transform = "translateY(-2px)";
        });
        card.addEventListener("mouseleave", () => {
            card.style.boxShadow = "none";
            card.style.transform = "none";
        });

        const badge = document.createElement("span");
        badge.textContent = _(template.category);
        badge.style.display = "inline-block";
        badge.style.padding = "2px 8px";
        badge.style.borderRadius = "10px";
        badge.style.fontSize = "11px";
        badge.style.fontWeight = "bold";
        badge.style.color = "#fff";
        badge.style.backgroundColor = CATEGORY_COLORS[template.category] || "#999";
        badge.style.marginBottom = "8px";
        badge.style.textTransform = "uppercase";
        card.appendChild(badge);

        const difficultyEl = document.createElement("span");
        difficultyEl.textContent = template.difficulty === 1 ? _("Beginner") : _("Intermediate");
        difficultyEl.style.float = "right";
        difficultyEl.style.fontSize = "11px";
        difficultyEl.style.color = "#999";
        card.appendChild(difficultyEl);

        const name = document.createElement("h4");
        name.textContent = _(template.title);
        name.style.margin = "4px 0 6px 0";
        name.style.fontSize = "15px";
        name.style.color = "#333";
        card.appendChild(name);

        const desc = document.createElement("p");
        desc.textContent = _(template.description);
        desc.style.margin = "0";
        desc.style.fontSize = "12px";
        desc.style.color = "#666";
        desc.style.lineHeight = "1.4";
        card.appendChild(desc);

        card.addEventListener("click", () => {
            this._loadTemplate(template);
        });

        return card;
    }

    _loadTemplate(template) {
        const activity = this.activity;

        activity._allClear(false);
        activity.blocks.loadNewBlocks(JSON.parse(JSON.stringify(template.blocks)));
        activity.textMsg(_("Loaded template: ") + _(template.title));

        localStorage.setItem(StarterTemplates.STORAGE_KEY, "true");
        this.widgetWindow.close();
    }

    static shouldShow() {
        return localStorage.getItem(StarterTemplates.STORAGE_KEY) !== "true";
    }
}
