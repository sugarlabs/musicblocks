// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * FirstProjectTutorial.js
 *
 * A non-interactive walkthrough of the Music Blocks interface.
 * Highlights each major UI section and explains what it does.
 * Users only navigate with Next / Back / Close — no canvas changes,
 * no action validation, and no project state mutation.
 */

/* global _, docById */
/* exported FirstProjectTutorial */

/**
 * FirstProjectTutorial - A passive interface tour.
 * Spotlights toolbar, palettes, workspace, and other UI sections
 * so new users learn where things are before exploring on their own.
 */
class FirstProjectTutorial {
    constructor(activity) {
        this.activity = activity;
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this.spotlight = null;
        this.widgetWindow = null;
        this._keyHandler = null;
        this._resizeHandler = null;

        this.steps = this._buildSteps();
    }

    /**
     * Build walkthrough steps for each major UI section.
     * @private
     * @returns {Array} The step definitions.
     */
    _buildSteps() {
        return [
            {
                title: _("Welcome to Music Blocks!"),
                content:
                    _("This short tour shows you each part of the Music Blocks window.") +
                    " " +
                    _(
                        "You do not need to click anything on the page — just use Next to move along."
                    ) +
                    " " +
                    _("When you finish, you will know where the main tools live."),
                target: null,
                position: "center"
            },
            {
                title: _("The Toolbar"),
                content:
                    _("The toolbar runs along the top of the window.") +
                    " " +
                    _("Play, stop, save, help, and other main controls live here.") +
                    " " +
                    _("We will look at the most important buttons next."),
                target: () => docById("toolbars"),
                position: "bottom"
            },
            {
                title: _("Play"),
                content:
                    _("The Play button runs your project.") +
                    " " +
                    _("Click it when you want to hear your music and watch the mice move.") +
                    " " +
                    _(
                        "While a project is running, a Stop control appears so you can halt the music and the mice. You can also type Alt-S (or Option-S on Mac) to stop."
                    ),
                target: () => docById("play"),
                position: "bottom"
            },
            {
                title: _("Project Controls"),
                content:
                    _("These buttons manage your project files.") +
                    " " +
                    _(
                        "New starts a blank project, Load opens a project from your computer, and Save stores your work."
                    ) +
                    " " +
                    _("Save can also export artwork as an image."),
                target: () =>
                    this._getElementGroup(["newFile", "load", "saveButton", "saveButtonAdvanced"]),
                position: "bottom"
            },
            {
                title: _("Planet"),
                content:
                    _(
                        "Planet is where you find and share projects with the Music Blocks community."
                    ) +
                    " " +
                    _(
                        "Open it to browse examples from other learners, or publish something you made."
                    ),
                target: () => docById("planetIcon") || docById("planetIconDisabled"),
                position: "bottom"
            },
            {
                title: _("Auxiliary Menu"),
                content:
                    _("The menu button opens extra tools.") +
                    " " +
                    _(
                        "Here you can run slowly, run step by step, change themes, switch beginner or advanced mode, and more."
                    ) +
                    " " +
                    _("Open it when you want features beyond the main toolbar."),
                target: () => docById("toggleAuxBtn"),
                position: "bottom"
            },
            {
                title: _("Help"),
                content:
                    _(
                        "The Help button opens guides, keyboard shortcuts, and this interface tour."
                    ) +
                    " " +
                    _("Come back here anytime you need a reminder of how Music Blocks works."),
                target: () => docById("helpIcon"),
                position: "bottom"
            },
            {
                title: _("Block Palettes"),
                content:
                    _("The left side holds the block palettes.") +
                    " " +
                    _(
                        "Each palette groups related blocks — Rhythm, Pitch, Tone, Flow, Graphics, and more."
                    ) +
                    " " +
                    _("Click a palette name to open it, then drag blocks onto the workspace."),
                target: () => docById("palette") || docById("popdown-palette"),
                position: "right"
            },
            {
                title: _("The Workspace"),
                content:
                    _("The large center area is your workspace.") +
                    " " +
                    _("This is where you snap blocks together to build programs.") +
                    " " +
                    _(
                        "Every project starts from a Start block — connect other blocks below it to make music and drawings."
                    ),
                target: () =>
                    docById("myCanvas") || docById("canvasContainer") || docById("canvas"),
                position: "right"
            },
            {
                title: _("You Are Ready to Explore!"),
                content:
                    _("That is the main Music Blocks window.") +
                    " " +
                    _("Toolbar at the top, palettes on the left, and workspace in the center.") +
                    " " +
                    _(
                        "Try dragging a block from a palette onto the Start block, then press Play."
                    ) +
                    " " +
                    _("There is no wrong way to explore — have fun!"),
                target: null,
                position: "center",
                isLast: true
            }
        ];
    }

    /**
     * Start the interface tour.
     * Does not modify the user's project or canvas.
     */
    start() {
        if (this.isActive) {
            return;
        }

        this.isActive = true;
        this.currentStep = 0;
        this._createOverlay();
        this._setupKeyboardNav();
        this._setupResizeHandler();
        this._showStep(0);
    }

    /**
     * Stop the tour and clean up overlay UI.
     */
    stop() {
        if (!this.isActive && !this.overlay && !this.widgetWindow) {
            return;
        }

        this.isActive = false;
        this._removeKeyboardNav();
        this._removeResizeHandler();
        this._removeOverlay();
    }

    /**
     * Move to the next step.
     */
    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this._showStep(this.currentStep);
        } else {
            this.stop();
        }
    }

    /**
     * Move to the previous step.
     */
    prevStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this._showStep(this.currentStep);
        }
    }

    // ========================================
    // UI RENDERING
    // ========================================

    /**
     * Create the dimming overlay, spotlight, and tour widget.
     * @private
     */
    _createOverlay() {
        this._removeOverlay();

        this.overlay = document.createElement("div");
        this.overlay.id = "tutorial-overlay";
        this.overlay.setAttribute("aria-hidden", "true");
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            pointer-events: none;
        `;

        this.spotlight = document.createElement("div");
        this.spotlight.id = "tutorial-spotlight";
        this.spotlight.setAttribute("aria-hidden", "true");
        this.spotlight.style.cssText = `
            position: fixed;
            border-radius: 8px;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
            z-index: 9999;
            pointer-events: none;
            transition: all 0.3s ease;
            border: 3px solid var(--color-selector-selected, #0066FF);
            display: none;
        `;

        const widgetWindow = window.widgetWindows.windowFor(
            this,
            _("Interface Tour"),
            "interface-tour",
            false
        );
        widgetWindow.clear();
        widgetWindow.show();
        this.widgetWindow = widgetWindow;

        widgetWindow.onclose = () => {
            widgetWindow.destroy();
            this.widgetWindow = null;
            this.tooltip = null;
            this.stop();
        };

        const widgetBody = widgetWindow.getWidgetBody();
        widgetBody.className = "wfbWidget interface-tour-widget";
        widgetBody.style.padding = "24px";
        widgetBody.style.display = "block";
        widgetBody.style.width = "360px";
        widgetBody.style.height = "auto";
        widgetBody.style.overflow = "hidden";

        this.tooltip = widgetBody;

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.spotlight);
    }

    /**
     * Remove overlay elements and the tour widget.
     * @private
     */
    _removeOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.spotlight) {
            this.spotlight.remove();
            this.spotlight = null;
        }
        if (this.widgetWindow) {
            const win = this.widgetWindow;
            this.widgetWindow = null;
            this.tooltip = null;
            win.onclose = null;
            win.destroy();
        }
    }

    /**
     * Display a specific walkthrough step.
     * @private
     * @param {number} stepIndex
     */
    _showStep(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step || !this.tooltip) {
            return;
        }

        const targetElement = step.target ? step.target() : null;

        this._updateSpotlight(targetElement);
        this._renderTooltip(step, stepIndex);
        this._positionTooltip(targetElement, step.position);
        this._setupTooltipListeners();
    }

    /**
     * Position and show the spotlight around a target element.
     * @private
     * @param {Element|{getBoundingClientRect: Function}|null} targetElement
     */
    _updateSpotlight(targetElement) {
        if (!this.spotlight) {
            return;
        }

        if (targetElement && typeof targetElement.getBoundingClientRect === "function") {
            const rect = targetElement.getBoundingClientRect();
            const padding = 12;

            // Skip invisible or zero-size targets
            if (rect.width < 2 && rect.height < 2) {
                this.spotlight.style.display = "none";
                return;
            }

            this.spotlight.style.display = "block";
            this.spotlight.style.top = Math.max(0, rect.top - padding) + "px";
            this.spotlight.style.left = Math.max(0, rect.left - padding) + "px";
            this.spotlight.style.width = rect.width + padding * 2 + "px";
            this.spotlight.style.height = rect.height + padding * 2 + "px";
        } else {
            this.spotlight.style.display = "none";
        }
    }

    /**
     * Render step content into the tour widget body using DOM APIs.
     * @private
     * @param {Object} step
     * @param {number} stepIndex
     */
    _renderTooltip(step, stepIndex) {
        const total = this.steps.length;
        const body = this.tooltip;
        body.replaceChildren();

        const progress = document.createElement("div");
        progress.style.cssText =
            "margin-bottom: 12px; font-size: 11px; font-weight: 600; " +
            "color: var(--color-text-secondary, #666); letter-spacing: 0.4px; " +
            "text-transform: uppercase;";
        progress.textContent = _("Step") + " " + (stepIndex + 1) + " / " + total;
        body.appendChild(progress);

        const title = document.createElement("h3");
        title.style.cssText =
            "margin: 0 0 10px 0; font-size: 17px; font-weight: 700; " +
            "color: var(--color-text-primary, #222); line-height: 1.3;";
        title.textContent = step.title;
        body.appendChild(title);

        const content = document.createElement("p");
        content.style.cssText =
            "margin: 0 0 18px 0; color: var(--color-text-secondary, #444); " +
            "line-height: 1.6; font-size: 13.5px;";
        content.textContent = step.content;
        body.appendChild(content);

        const buttonRow = document.createElement("div");
        buttonRow.style.cssText = "display: flex; align-items: center; gap: 10px;";

        if (stepIndex > 0) {
            const prevBtn = document.createElement("button");
            prevBtn.id = "tutorial-prev";
            prevBtn.type = "button";
            prevBtn.textContent = "← " + _("Back");
            prevBtn.style.cssText =
                "padding: 10px 14px; background: var(--color-surface-secondary, #1a365d); " +
                "border: 1px solid var(--color-selector-selected, #0066FF); border-radius: 8px; " +
                "cursor: pointer; font-size: 13px; font-weight: 500; " +
                "color: var(--color-text-on-primary, #ffffff);";
            buttonRow.appendChild(prevBtn);
        }

        const nextBtn = document.createElement("button");
        nextBtn.id = "tutorial-next";
        nextBtn.type = "button";
        nextBtn.textContent = step.isLast ? _("Start Exploring!") : _("Next") + " →";
        nextBtn.style.cssText =
            "flex: 1; padding: 10px 20px; background: var(--color-selector-selected, #0066FF); " +
            "color: var(--color-text-on-primary, #ffffff); border: none; border-radius: 8px; " +
            "cursor: pointer; font-size: 14px; font-weight: 600; " +
            "box-shadow: 0 2px 8px rgba(0, 102, 255, 0.35);";
        buttonRow.appendChild(nextBtn);
        body.appendChild(buttonRow);

        const footer = document.createElement("div");
        footer.style.cssText =
            "display: flex; justify-content: space-between; align-items: center; margin-top: 12px;";

        const hint = document.createElement("span");
        hint.style.cssText = "font-size: 10px; color: var(--color-text-secondary, #888);";
        hint.textContent = _("Esc to close • ← → to navigate");
        footer.appendChild(hint);

        const dots = document.createElement("div");
        dots.setAttribute("aria-hidden", "true");
        for (let i = 0; i < total; i++) {
            const dot = document.createElement("span");
            const isCurrent = i === stepIndex;
            const isPast = i < stepIndex;
            dot.style.cssText =
                "display: inline-block; width: " +
                (isCurrent ? "10px" : "6px") +
                "; height: " +
                (isCurrent ? "10px" : "6px") +
                "; border-radius: 50%; margin: 0 2px; " +
                "background: " +
                (isCurrent || isPast
                    ? "var(--color-selector-selected, #0066FF)"
                    : "var(--color-surface-secondary, #1a365d)") +
                "; opacity: " +
                (isPast && !isCurrent ? "0.55" : "1") +
                "; transition: all 0.2s ease;";
            dots.appendChild(dot);
        }
        footer.appendChild(dots);
        body.appendChild(footer);
    }

    /**
     * Wire Next / Back buttons for the current step.
     * @private
     */
    _setupTooltipListeners() {
        const nextBtn = docById("tutorial-next");
        const prevBtn = docById("tutorial-prev");

        if (nextBtn) {
            nextBtn.onclick = () => this.nextStep();
        }
        if (prevBtn) {
            prevBtn.onclick = () => this.prevStep();
        }
    }

    /**
     * Position the tour widget relative to the highlighted target.
     * @private
     * @param {Element|{getBoundingClientRect: Function}|null} targetElement
     * @param {string} position
     */
    _positionTooltip(targetElement, position) {
        if (!this.widgetWindow) {
            return;
        }

        if (!targetElement || position === "center") {
            this.widgetWindow.sendToCenter();
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        const padding = 24;
        const widgetWidth = 380;
        const widgetHeight = 320;

        let left;
        let top;

        switch (position) {
            case "right":
                top = Math.max(20, rect.top);
                left = rect.right + padding;
                break;
            case "left":
                top = Math.max(20, rect.top);
                left = rect.left - widgetWidth - padding;
                break;
            case "bottom":
                top = rect.bottom + padding;
                left = Math.max(20, rect.left + rect.width / 2 - widgetWidth / 2);
                break;
            case "top":
                top = rect.top - widgetHeight - padding;
                left = Math.max(20, rect.left + rect.width / 2 - widgetWidth / 2);
                break;
            default:
                top = Math.max(20, rect.top);
                left = rect.right + padding;
        }

        if (left > window.innerWidth - widgetWidth - 12) {
            left = window.innerWidth - widgetWidth - 12;
        }
        if (top > window.innerHeight - widgetHeight - 12) {
            top = window.innerHeight - widgetHeight - 12;
        }
        if (left < 12) {
            left = 12;
        }
        if (top < 64) {
            top = 64;
        }

        this.widgetWindow.setPosition(left, top);
    }

    // ========================================
    // KEYBOARD & RESIZE
    // ========================================

    /**
     * @private
     */
    _setupKeyboardNav() {
        this._removeKeyboardNav();
        this._keyHandler = event => this._onKeyDown(event);
        document.addEventListener("keydown", this._keyHandler);
    }

    /**
     * @private
     */
    _removeKeyboardNav() {
        if (this._keyHandler) {
            document.removeEventListener("keydown", this._keyHandler);
            this._keyHandler = null;
        }
    }

    /**
     * @private
     * @param {KeyboardEvent} event
     */
    _onKeyDown(event) {
        if (!this.isActive) {
            return;
        }

        switch (event.key) {
            case "Escape":
                event.preventDefault();
                this.stop();
                break;
            case "ArrowRight":
            case "Enter":
                event.preventDefault();
                this.nextStep();
                break;
            case "ArrowLeft":
                event.preventDefault();
                this.prevStep();
                break;
        }
    }

    /**
     * Keep the spotlight aligned when the window is resized.
     * @private
     */
    _setupResizeHandler() {
        this._removeResizeHandler();
        this._resizeHandler = () => {
            if (!this.isActive) {
                return;
            }
            const step = this.steps[this.currentStep];
            if (!step) {
                return;
            }
            const targetElement = step.target ? step.target() : null;
            this._updateSpotlight(targetElement);
            this._positionTooltip(targetElement, step.position);
        };
        window.addEventListener("resize", this._resizeHandler);
    }

    /**
     * @private
     */
    _removeResizeHandler() {
        if (this._resizeHandler) {
            window.removeEventListener("resize", this._resizeHandler);
            this._resizeHandler = null;
        }
    }

    // ========================================
    // TARGET HELPERS
    // ========================================

    /**
     * Build a virtual target covering several toolbar buttons.
     * @private
     * @param {string[]} ids
     * @returns {{getBoundingClientRect: Function}|null}
     */
    _getElementGroup(ids) {
        const rects = [];
        for (let i = 0; i < ids.length; i++) {
            const el = docById(ids[i]);
            if (!el) {
                continue;
            }
            // Skip elements that are intentionally hidden
            const style = window.getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") {
                continue;
            }
            rects.push(el.getBoundingClientRect());
        }

        if (rects.length === 0) {
            return docById(ids[0]) || null;
        }

        let top = rects[0].top;
        let left = rects[0].left;
        let right = rects[0].right;
        let bottom = rects[0].bottom;

        for (let i = 1; i < rects.length; i++) {
            top = Math.min(top, rects[i].top);
            left = Math.min(left, rects[i].left);
            right = Math.max(right, rects[i].right);
            bottom = Math.max(bottom, rects[i].bottom);
        }

        return {
            getBoundingClientRect: () => ({
                top,
                left,
                right,
                bottom,
                width: right - left,
                height: bottom - top,
                x: left,
                y: top
            })
        };
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = FirstProjectTutorial;
}
