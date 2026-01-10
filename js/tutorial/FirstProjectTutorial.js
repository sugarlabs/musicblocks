/**
 * FirstProjectTutorial.js
 * 
 * Interactive step-by-step tutorial that guides users through creating
 * their first Music Blocks project. Detects user actions and only allows
 * proceeding when the required action is completed.
 * 
 * @author Divyam Agarwal
 * @copyright 2026
 * @license AGPL-3.0
 */

/* global _, docById */
/* exported FirstProjectTutorial */

/**
 * FirstProjectTutorial - An interactive onboarding tutorial
 * that highlights UI elements and guides users step-by-step.
 * The "Next" button only appears after the user completes each action.
 */
class FirstProjectTutorial {
    constructor(activity) {
        this.activity = activity;
        this.currentStep = 0;
        this.isActive = false;
        this.overlay = null;
        this.tooltip = null;
        this.spotlight = null;
        this.actionCompleted = false;
        this._checkInterval = null;
        this._initialBlockCount = 0;

        // Define all tutorial steps with validators
        this.steps = [
            {
                title: _("Step 1: Find the Start Block"),
                content: _("Look at the canvas! Find the START block - every project begins here."),
                target: () => this._getCanvas(),
                position: "right",
                instruction: _("✅ Can you see the Start block on the canvas?"),
                // This step has no action required - just observation
                validator: () => true,
                autoComplete: true
            },
            {
                title: _("Step 2: Open the Rhythm Palette"),
                content: _("Click on the 'Rhythm' palette button on the left sidebar to see rhythm blocks."),
                target: () => this._findPaletteButton("rhythm"),
                position: "right",
                instruction: _("👆 Click the 'Rhythm' palette button"),
                validator: () => this._isPaletteOpen("rhythm"),
                autoComplete: false
            },
            {
                title: _("Step 3: Drag a Note Block"),
                content: _("Find the 'Note' block in the Rhythm palette (should still be open) and drag it onto the canvas. This is how you create musical notes!"),
                target: () => this._getCanvas(),
                position: "right",
                instruction: _("🎵 Drag a Note block from the Rhythm palette to the canvas"),
                validator: () => this._hasMoreBlocks(),
                autoComplete: false,
                allowInteraction: true, // Allow full screen interaction for dragging
                onStart: () => { this._initialNoteCount = this._countBlocksByName("newnote"); }
            },
            {
                title: _("Step 4: Connect to Start"),
                content: _("Now connect your Note block to the Start block. Drag it until it snaps into place!"),
                target: () => this._getCanvas(),
                position: "right",
                instruction: _("🔗 Connect the Note block inside the Start block"),
                validator: () => this._isBlockConnectedToStart("newnote"),
                autoComplete: false,
                allowInteraction: true // Allow full screen interaction for dragging
            },
            {
                title: _("Step 5: Press Play!"),
                content: _("Time to hear your first note! Click the PLAY button to run your project!"),
                target: () => docById("play") || docById("runButton"),
                position: "bottom",
                instruction: _("▶️ Click the PLAY button!"),
                validator: () => this._hasPressedPlay(),
                autoComplete: false,
                onStart: () => { this._playPressed = false; this._setupPlayListener(); }
            },
            {
                title: _("Step 6: Open Pitch Palette"),
                content: _("Great! Now let's add a pitch. Click on the 'Pitch' palette."),
                target: () => this._findPaletteButton("pitch"),
                position: "right",
                instruction: _("👆 Click the 'Pitch' palette button"),
                validator: () => this._isPaletteOpen("pitch"),
                autoComplete: false
            },
            {
                title: _("Step 7: Add a Pitch Block"),
                content: _("Drag a 'Pitch' block and put it INSIDE your Note block. This tells Music Blocks which note to play!"),
                target: () => this._getCanvas(),
                position: "right",
                instruction: _("🎹 Drag a Pitch block inside your Note block"),
                validator: () => this._hasPitchInNote(),
                autoComplete: false,
                allowInteraction: true // Allow full screen interaction for dragging
            },
            {
                title: _("Step 8: Play Again!"),
                content: _("Now press PLAY again to hear your note with the pitch!"),
                target: () => docById("play") || docById("runButton"),
                position: "bottom",
                instruction: _("▶️ Click PLAY to hear your music!"),
                validator: () => this._hasPressedPlay(),
                autoComplete: false,
                onStart: () => { this._playPressed = false; this._setupPlayListener(); }
            },
            {
                title: _("Step 9: Add More Notes (Optional)"),
                content: _("You can add more Note+Pitch blocks to create a melody! Or just click Next to finish."),
                target: () => this._getCanvas(),
                position: "right",
                instruction: _("🎵 Add more notes, or click Next to finish"),
                validator: () => true,
                autoComplete: true
            },
            {
                title: _("🎉 Congratulations!"),
                content: _("You've created your first Music Blocks project! Now explore adding loops (Flow palette), graphics (Graphics palette), and different instruments (Tone palette)!"),
                target: null,
                position: "center",
                instruction: _("Click Finish to close the tutorial"),
                validator: () => true,
                autoComplete: true,
                isLast: true
            }
        ];
    }

    /**
     * Start the tutorial
     */
    start() {
        this.isActive = true;
        this.currentStep = 0;
        this._createOverlay();
        this._showStep(0);
    }

    /**
     * Stop the tutorial and clean up
     */
    stop() {
        this.isActive = false;
        this._stopChecking();
        this._removeOverlay();
    }

    /**
     * Move to the next step
     */
    nextStep() {
        this._stopChecking();
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this._showStep(this.currentStep);
        } else {
            this.stop();
        }
    }

    /**
     * Move to the previous step
     */
    prevStep() {
        this._stopChecking();
        if (this.currentStep > 0) {
            this.currentStep--;
            this._showStep(this.currentStep);
        }
    }

    /**
     * Create the overlay elements
     * @private
     */
    _createOverlay() {
        this._removeOverlay();

        // Create main overlay container
        this.overlay = document.createElement("div");
        this.overlay.id = "tutorial-overlay";
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

        // Create spotlight (hole in overlay)
        this.spotlight = document.createElement("div");
        this.spotlight.id = "tutorial-spotlight";
        this.spotlight.style.cssText = `
            position: fixed;
            border-radius: 8px;
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6);
            z-index: 9999;
            pointer-events: none;
            transition: all 0.3s ease;
            border: 3px solid #4CAF50;
        `;

        // Create tooltip
        this.tooltip = document.createElement("div");
        this.tooltip.id = "tutorial-tooltip";
        this.tooltip.style.cssText = `
            position: fixed;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            padding: 24px;
            max-width: 380px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            z-index: 10000;
            font-family: 'Roboto', sans-serif;
            color: white;
            pointer-events: auto;
        `;

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.spotlight);
        document.body.appendChild(this.tooltip);
    }

    /**
     * Remove overlay elements
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
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    /**
     * Display a specific step
     * @private
     * @param {number} stepIndex
     */
    _showStep(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step) return;

        this.actionCompleted = false;

        // Run onStart if defined
        if (step.onStart) {
            step.onStart();
        }

        const targetElement = step.target ? step.target() : null;

        // Position spotlight
        if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            const padding = 15;
            this.spotlight.style.display = "block";
            this.spotlight.style.top = (rect.top - padding) + "px";
            this.spotlight.style.left = (rect.left - padding) + "px";
            this.spotlight.style.width = (rect.width + padding * 2) + "px";
            this.spotlight.style.height = (rect.height + padding * 2) + "px";
        } else {
            this.spotlight.style.display = "none";
        }

        // For steps that require interaction (like dragging blocks),
        // reduce the overlay opacity and ensure spotlight doesn't block clicks
        if (step.allowInteraction) {
            this.overlay.style.background = "rgba(0, 0, 0, 0.2)";
            this.spotlight.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.2)";
            this.spotlight.style.pointerEvents = "none";
        } else {
            this.overlay.style.background = "rgba(0, 0, 0, 0.5)";
            this.spotlight.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.6)";
            this.spotlight.style.pointerEvents = "none";
        }

        // Check if action is already completed or autoComplete
        const isCompleted = step.autoComplete || step.validator();

        // Create tooltip content
        this.tooltip.innerHTML = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span style="background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500;">
                    Step ${stepIndex + 1} of ${this.steps.length}
                </span>
                <button id="tutorial-close" style="
                    background: transparent;
                    border: none;
                    color: rgba(255,255,255,0.7);
                    font-size: 20px;
                    cursor: pointer;
                    padding: 0;
                    line-height: 1;
                ">×</button>
            </div>
            <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">${step.title}</h3>
            <p style="margin: 0 0 16px 0; opacity: 0.9; line-height: 1.6; font-size: 15px;">${step.content}</p>
            <div id="tutorial-instruction" style="
                background: rgba(0,0,0,0.2);
                padding: 14px 18px;
                border-radius: 10px;
                margin-bottom: 20px;
                font-weight: 500;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <span id="instruction-icon">${isCompleted ? "✅" : "⏳"}</span>
                <span id="instruction-text">${isCompleted ? _("Done! Click Next to continue.") : step.instruction}</span>
            </div>
            <div style="display: flex; gap: 10px;">
                ${stepIndex > 0 ? `
                    <button id="tutorial-prev" style="
                        flex: 1;
                        padding: 12px 20px;
                        background: rgba(255,255,255,0.2);
                        border: none;
                        border-radius: 10px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        color: white;
                    ">← Back</button>
                ` : ''}
                <button id="tutorial-next" style="
                    flex: 2;
                    padding: 12px 24px;
                    background: ${isCompleted ? "#4CAF50" : "rgba(255,255,255,0.3)"};
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: ${isCompleted ? "pointer" : "not-allowed"};
                    font-size: 15px;
                    font-weight: 600;
                    opacity: ${isCompleted ? "1" : "0.5"};
                    transition: all 0.3s ease;
                " ${isCompleted ? "" : "disabled"}>${step.isLast ? "🎉 Finish" : "Next →"}</button>
            </div>
        `;

        // Position tooltip
        this._positionTooltip(targetElement, step.position);

        // Add event listeners
        this._setupTooltipListeners(step, isCompleted);

        // Start checking for action completion if not auto-complete
        if (!step.autoComplete && !isCompleted) {
            this._startChecking(step);
        }
    }

    /**
     * Setup tooltip button listeners
     * @private
     */
    _setupTooltipListeners(step, isCompleted) {
        const nextBtn = docById("tutorial-next");
        const prevBtn = docById("tutorial-prev");
        const closeBtn = docById("tutorial-close");

        if (nextBtn && isCompleted) {
            nextBtn.onclick = () => this.nextStep();
        }
        if (prevBtn) {
            prevBtn.onclick = () => this.prevStep();
        }
        if (closeBtn) {
            closeBtn.onclick = () => this.stop();
        }
    }

    /**
     * Start checking for action completion
     * @private
     */
    _startChecking(step) {
        this._stopChecking();
        this._checkInterval = setInterval(() => {
            if (step.validator()) {
                this._onActionCompleted();
            }
        }, 500); // Check every 500ms
    }

    /**
     * Stop checking for action completion
     * @private
     */
    _stopChecking() {
        if (this._checkInterval) {
            clearInterval(this._checkInterval);
            this._checkInterval = null;
        }
    }

    /**
     * Called when the user completes the required action
     * @private
     */
    _onActionCompleted() {
        this._stopChecking();
        this.actionCompleted = true;

        // Update the instruction to show completion
        const icon = docById("instruction-icon");
        const text = docById("instruction-text");
        const nextBtn = docById("tutorial-next");

        if (icon) icon.textContent = "✅";
        if (text) text.textContent = _("Great job! Click Next to continue.");

        if (nextBtn) {
            nextBtn.style.background = "#4CAF50";
            nextBtn.style.cursor = "pointer";
            nextBtn.style.opacity = "1";
            nextBtn.disabled = false;
            nextBtn.onclick = () => this.nextStep();

            // Add a little celebration animation
            nextBtn.style.transform = "scale(1.05)";
            setTimeout(() => {
                if (nextBtn) nextBtn.style.transform = "scale(1)";
            }, 200);
        }
    }

    /**
     * Position the tooltip relative to target
     * @private
     */
    _positionTooltip(targetElement, position) {
        if (!targetElement || position === "center") {
            this.tooltip.style.top = "50%";
            this.tooltip.style.left = "50%";
            this.tooltip.style.transform = "translate(-50%, -50%)";
            return;
        }

        const rect = targetElement.getBoundingClientRect();
        const padding = 25;

        this.tooltip.style.transform = "none";

        switch (position) {
            case "right":
                this.tooltip.style.top = Math.max(20, rect.top) + "px";
                this.tooltip.style.left = (rect.right + padding) + "px";
                break;
            case "left":
                this.tooltip.style.top = Math.max(20, rect.top) + "px";
                this.tooltip.style.left = (rect.left - 400 - padding) + "px";
                break;
            case "bottom":
                this.tooltip.style.top = (rect.bottom + padding) + "px";
                this.tooltip.style.left = Math.max(20, rect.left) + "px";
                break;
            case "top":
                this.tooltip.style.top = (rect.top - 250 - padding) + "px";
                this.tooltip.style.left = Math.max(20, rect.left) + "px";
                break;
            default:
                this.tooltip.style.top = Math.max(20, rect.top) + "px";
                this.tooltip.style.left = (rect.right + padding) + "px";
        }

        // Keep tooltip on screen
        const tooltipRect = this.tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth - 20) {
            this.tooltip.style.left = (window.innerWidth - 400) + "px";
        }
        if (tooltipRect.bottom > window.innerHeight - 20) {
            this.tooltip.style.top = (window.innerHeight - 350) + "px";
        }
        if (parseFloat(this.tooltip.style.left) < 20) {
            this.tooltip.style.left = "20px";
        }
        if (parseFloat(this.tooltip.style.top) < 20) {
            this.tooltip.style.top = "20px";
        }
    }

    // ========================================
    // VALIDATORS - Detect user actions
    // ========================================

    /**
     * Get the main canvas element
     * @private
     */
    _getCanvas() {
        return docById("myCanvas") || docById("canvas");
    }

    /**
     * Find a palette button by name
     * @private
     */
    _findPaletteButton(paletteName) {
        // Try different patterns for finding palette buttons
        const patterns = [
            paletteName.charAt(0).toUpperCase() + paletteName.slice(1) + "tabbutton",
            paletteName + "tabbutton",
            paletteName
        ];

        for (const pattern of patterns) {
            const el = docById(pattern);
            if (el) return el;
        }

        // Search in palette buttons by looking at all elements
        const buttons = document.querySelectorAll('[id*="palette"], [id*="tabbutton"]');
        for (const btn of buttons) {
            if (btn.id.toLowerCase().includes(paletteName.toLowerCase())) {
                return btn;
            }
        }

        return null;
    }

    /**
     * Get the activity object, with fallback to window.activity
     * @private
     */
    _getActivity() {
        // Try this.activity first, then fallback to global window.activity
        if (this.activity && this.activity.blocks) {
            return this.activity;
        }
        if (window.activity && window.activity.blocks) {
            return window.activity;
        }
        return null;
    }

    /**
     * Check if a palette is currently open
     * @private
     */
    _isPaletteOpen(paletteName) {
        console.log("[Tutorial] _isPaletteOpen called for:", paletteName);

        const activity = this._getActivity();
        console.log("[Tutorial] activity found:", !!activity);

        // Method 1: Check via palettes.activePalette (most reliable)
        if (activity && activity.blocks && activity.blocks.palettes) {
            const palettes = activity.blocks.palettes;
            console.log("[Tutorial] palettes.activePalette:", palettes.activePalette);

            // The activePalette property is set when showPalette is called
            if (palettes.activePalette === paletteName) {
                console.log("[Tutorial] ✅ Palette detected via activePalette:", paletteName);
                return true;
            }
        }

        // Method 2: Check if PaletteBody element exists (indicates a palette menu is open)
        const paletteBody = document.getElementById("PaletteBody");
        console.log("[Tutorial] PaletteBody element found:", !!paletteBody);
        if (paletteBody) {
            // Check if the header contains the palette name
            const headerSpan = paletteBody.querySelector("thead span");
            console.log("[Tutorial] Header span found:", !!headerSpan, headerSpan?.textContent);
            if (headerSpan) {
                const headerText = headerSpan.textContent.toLowerCase();
                if (headerText === paletteName.toLowerCase() ||
                    headerText.includes(paletteName.toLowerCase())) {
                    console.log("[Tutorial] ✅ Palette detected via PaletteBody header:", paletteName);
                    return true;
                }
            }

            // Alternative: check if any palette is open and it matches what we're looking for
            // by checking the label image icon
            const labelImg = paletteBody.querySelector("thead img");
            if (labelImg && labelImg.src) {
                // The image source contains the palette icon which may include the name
                const src = labelImg.src.toLowerCase();
                if (src.includes(paletteName.toLowerCase())) {
                    console.log("[Tutorial] ✅ Palette detected via PaletteBody icon:", paletteName);
                    return true;
                }
            }
        }

        // Method 3: Check for any open palette menu by looking for PaletteBody_items
        const paletteItems = document.getElementById("PaletteBody_items");
        console.log("[Tutorial] PaletteBody_items found:", !!paletteItems, paletteItems?.children?.length);
        if (paletteItems && paletteItems.children.length > 0) {
            // There are items in an open palette - check if it's the right one
            // We can look at the current palette in the palettes object
            if (activity && activity.blocks && activity.blocks.palettes) {
                const currentPalette = activity.blocks.palettes.activePalette;
                console.log("[Tutorial] Checking activePalette again:", currentPalette);
                if (currentPalette === paletteName) {
                    console.log("[Tutorial] ✅ Palette detected via PaletteBody_items:", paletteName);
                    return true;
                }
            }
        }

        console.log("[Tutorial] ❌ Palette NOT detected:", paletteName);
        return false;
    }

    /**
     * Count total blocks on canvas
     * @private
     */
    _countBlocks() {
        const activity = this._getActivity();
        if (!activity || !activity.blocks || !activity.blocks.blockList) {
            return 0;
        }
        return Object.keys(activity.blocks.blockList).length;
    }

    /**
     * Check if a new block of specific type was added
     * @private
     */
    _hasNewBlock(blockName) {
        const activity = this._getActivity();
        if (!activity || !activity.blocks || !activity.blocks.blockList) {
            return false;
        }

        const blockList = activity.blocks.blockList;
        for (const blockId in blockList) {
            const block = blockList[blockId];
            if (block && block.name === blockName) {
                return true;
            }
        }
        return false;
    }

    /**
     * Count blocks of a specific type
     * @private
     */
    _countBlocksByName(blockName) {
        const activity = this._getActivity();
        if (!activity || !activity.blocks || !activity.blocks.blockList) {
            return 0;
        }

        let count = 0;
        const blockList = activity.blocks.blockList;
        for (const blockId in blockList) {
            const block = blockList[blockId];
            if (block && block.name === blockName) {
                count++;
            }
        }
        return count;
    }

    /**
     * Check if more note blocks were added since step started
     * @private
     */
    _hasMoreBlocks() {
        const currentCount = this._countBlocksByName("newnote");
        const initialCount = this._initialNoteCount || 0;
        return currentCount > initialCount;
    }

    /**
     * Check if a note block is connected to the start block
     * @private
     */
    _isBlockConnectedToStart(blockName) {
        const activity = this._getActivity();
        if (!activity || !activity.blocks || !activity.blocks.blockList) {
            return false;
        }

        const blockList = activity.blocks.blockList;

        // Find the start block
        let startBlock = null;
        for (const blockId in blockList) {
            if (blockList[blockId] && blockList[blockId].name === "start") {
                startBlock = blockList[blockId];
                break;
            }
        }

        if (!startBlock) return false;

        // Check if a newnote block is connected to start
        // The start block's connections[1] should be connected to something
        if (startBlock.connections && startBlock.connections[1] !== null) {
            const connectedId = startBlock.connections[1];
            const connectedBlock = blockList[connectedId];
            if (connectedBlock && connectedBlock.name === blockName) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if pitch block is inside a note block
     * @private
     */
    _hasPitchInNote() {
        const activity = this._getActivity();
        if (!activity || !activity.blocks || !activity.blocks.blockList) {
            console.log("[Tutorial] _hasPitchInNote: No activity or blocks found");
            return false;
        }

        const blockList = activity.blocks.blockList;

        // Find a pitch block that is connected inside a newnote block
        // The pitch might be connected through vspace or other intermediate blocks
        for (const blockId in blockList) {
            const block = blockList[blockId];
            if (block && block.name === "pitch") {
                console.log("[Tutorial] Found pitch block:", blockId);

                // Traverse up the connection chain to find if this pitch is inside a note
                let currentBlock = block;
                let depth = 0;
                const maxDepth = 10; // Prevent infinite loops

                while (currentBlock && depth < maxDepth) {
                    const connections = currentBlock.connections;
                    if (!connections || connections[0] === null) {
                        break;
                    }

                    const parentId = connections[0];
                    const parent = blockList[parentId];

                    if (!parent) {
                        break;
                    }

                    console.log("[Tutorial] Checking parent:", parent.name, "at depth", depth);

                    // Check if parent is a note block
                    if (parent.name === "newnote" || parent.name === "note") {
                        console.log("[Tutorial] ✅ Pitch is inside a note block!");
                        return true;
                    }

                    // Also check if we're inside a vspace that's inside a note
                    // by looking at the parent's connections
                    if (parent.name === "vspace") {
                        // Continue traversing up
                        currentBlock = parent;
                        depth++;
                        continue;
                    }

                    currentBlock = parent;
                    depth++;
                }
            }
        }

        console.log("[Tutorial] ❌ No pitch found inside a note block");
        return false;
    }

    /**
     * Setup listener for play button
     * @private
     */
    _setupPlayListener() {
        const playBtn = docById("play") || docById("runButton");
        if (playBtn) {
            const self = this;
            const originalOnClick = playBtn.onclick;
            playBtn.onclick = function (e) {
                self._playPressed = true;
                if (originalOnClick) originalOnClick.call(this, e);
            };
        }
    }

    /**
     * Check if play was pressed
     * @private
     */
    _hasPressedPlay() {
        return this._playPressed === true;
    }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
    module.exports = FirstProjectTutorial;
}
