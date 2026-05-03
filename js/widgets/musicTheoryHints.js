// Copyright (c) 2025 Antigravity AI
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/* global _ */

/**
 * MusicTheoryHintsWidget provides real-time music theory guidance
 * based on the blocks currently in the workspace.
 */
function MusicTheoryHintsWidget() {
    this.activity = null;
    this.visible = false;
    this.container = null;
    this.hintText = null;
    this.lastHint = "";
    this.enabled = true;

    /**
     * Initializes the Music Theory Hint System.
     * @param {object} activity - Reference to the main Activity instance.
     */
    this.init = function (activity) {
        this.activity = activity;
        this.enabled = this.activity.storage.musicTheoryHintsEnabled !== "false";

        this._createUI();
        this._setupListeners();

        if (this.enabled) {
            this.show();
        }
    };

    /**
     * Creates the hint panel UI elements.
     * @private
     */
    this._createUI = function () {
        this.container = document.createElement("div");
        this.container.id = "music-theory-hints-panel";
        this.container.className = "music-theory-hints-container";
        this.container.style.display = "none";

        const header = document.createElement("div");
        header.className = "hint-header";

        const title = document.createElement("span");
        title.textContent = _("Music Theory Tips");
        header.appendChild(title);

        const closeBtn = document.createElement("button");
        closeBtn.className = "hint-close-btn";
        closeBtn.innerHTML = "&times;";
        closeBtn.onclick = () => this.toggle();
        header.appendChild(closeBtn);

        this.container.appendChild(header);

        this.hintText = document.createElement("div");
        this.hintText.className = "hint-content";
        this.hintText.textContent = _("Add some music blocks to get started!");
        this.container.appendChild(this.hintText);

        document.body.appendChild(this.container);

        this._addStyles();
    };

    /**
     * Adds necessary CSS for the hint panel.
     * @private
     */
    this._addStyles = function () {
        const style = document.createElement("style");
        style.textContent = `
            .music-theory-hints-container {
                position: fixed;
                bottom: 80px;
                right: 20px;
                width: 250px;
                background: rgba(255, 255, 255, 0.95);
                border: 2px solid #2196F3;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 1000;
                font-family: 'Inter', sans-serif;
                transition: transform 0.3s ease, opacity 0.3s ease;
                overflow: hidden;
            }
            .dark .music-theory-hints-container {
                background: rgba(33, 33, 33, 0.95);
                border-color: #64B5F6;
                color: #fff;
            }
            .hint-header {
                background: #2196F3;
                color: white;
                padding: 8px 12px;
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
            }
            .hint-content {
                padding: 15px;
                font-size: 13px;
                line-height: 1.5;
                min-height: 50px;
            }
            .hint-close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            .hint-highlight {
                color: #2196F3;
                font-weight: bold;
            }
            .dark .hint-highlight {
                color: #64B5F6;
            }
        `;
        document.head.appendChild(style);
    };

    /**
     * Sets up event listeners for block changes.
     * @private
     */
    this._setupListeners = function () {
        // Debounced update on block changes
        const originalAdjustDocks = this.activity.blocks.adjustDocks;
        const self = this;
        this.activity.blocks.adjustDocks = function () {
            const result = originalAdjustDocks.apply(this, arguments);
            self._debouncedUpdate();
            return result;
        };
    };

    /**
     * Debounces the update call to avoid performance issues.
     * @private
     */
    this._debouncedUpdate = function () {
        if (this._updateTimeout) clearTimeout(this._updateTimeout);
        this._updateTimeout = setTimeout(() => this.updateHints(), 1000);
    };

    /**
     * Toggles the visibility of the hint panel.
     */
    this.toggle = function () {
        this.enabled = !this.enabled;
        this.activity.storage.musicTheoryHintsEnabled = this.enabled.toString();

        if (this.enabled) {
            this.show();
        } else {
            this.hide();
        }
    };

    /**
     * Shows the hint panel.
     */
    this.show = function () {
        this.container.style.display = "block";
        this.visible = true;
        this.updateHints();
    };

    /**
     * Hides the hint panel.
     */
    this.hide = function () {
        this.container.style.display = "none";
        this.visible = false;
    };

    /**
     * Analyzes the workspace and updates the hints.
     */
    this.updateHints = function () {
        if (!this.visible || !this.enabled) return;

        const hint = this._generateHint();
        if (hint && hint !== this.lastHint) {
            this._displayHint(hint);
            this.lastHint = hint;
        }
    };

    /**
     * Core logic for analyzing blocks and generating a hint string.
     * @private
     * @returns {string} - The generated hint.
     */
    this._generateHint = function () {
        const stacks = this.activity.blocks.stackList;
        const blockList = this.activity.blocks.blockList;

        if (stacks.length === 0) {
            return _("Drag blocks from the palette to start making music!");
        }

        const events = [];
        const visitedActions = new Set();
        for (const stackId of stacks) {
            this._traverseStack(stackId, events, visitedActions);
        }

        if (events.length === 0) {
            return _(
                "Try adding a <span class='hint-highlight'>pitch</span> or <span class='hint-highlight'>rhythm</span> block!"
            );
        }

        // Apply rules in priority order
        const rhythmHint = this._checkRhythmRules(events);
        if (rhythmHint) return rhythmHint;

        const chordHint = this._checkChordRules(events);
        if (chordHint) return chordHint;

        const patternHint = this._checkPatternRules(events);
        if (patternHint) return patternHint;

        const instrumentationHint = this._checkInstrumentationRules(events);
        if (instrumentationHint) return instrumentationHint;

        const scaleHint = this._checkScaleRules(events);
        if (scaleHint) return scaleHint;

        return _("Great job! Keep building your melody.");
    };

    /**
     * Recursively traverses a block stack to collect musical events.
     * @private
     */
    this._traverseStack = function (blkId, events, visitedActions) {
        if (blkId === null) return;
        const blk = this.activity.blocks.blockList[blkId];
        if (!blk) return;

        if (blk.name === "pitch") {
            const pitchVal = this._getArgValue(blk, 1);
            events.push({ type: "pitch", value: pitchVal, blkId: blkId });
        } else if (blk.name === "rhythm") {
            const rhythmVal = this._getArgValue(blk, 1);
            events.push({ type: "rhythm", value: rhythmVal, blkId: blkId });
        } else if (blk.name === "action") {
            // Traverse inside the action definition
            const actionNameId = blk.connections[1];
            if (actionNameId !== null) {
                const actionNameBlk = this.activity.blocks.blockList[actionNameId];
                if (actionNameBlk && !visitedActions.has(actionNameBlk.value)) {
                    visitedActions.add(actionNameBlk.value);
                    const insideId = blk.connections[2];
                    this._traverseStack(insideId, events, visitedActions);
                }
            }
        } else if (blk.name === "setinstrument") {
            events.push({ type: "instrument", blkId: blkId });
        } else if (blk.name === "settempo") {
            events.push({ type: "tempo", blkId: blkId });
        }

        // Traverse next block in flow
        const nextId = blk.connections[blk.connections.length - 1];
        if (nextId !== null) {
            this._traverseStack(nextId, events, visitedActions);
        }
    };

    /**
     * Helper to get the value of a block argument.
     * @private
     */
    this._getArgValue = function (blk, argIdx) {
        const argId = blk.connections[argIdx];
        if (argId === null) return null;
        const argBlk = this.activity.blocks.blockList[argId];
        return argBlk ? argBlk.value : null;
    };

    /**
     * Rhythm Rules: Check for incomplete measures.
     * @private
     */
    this._checkRhythmRules = function (events) {
        let totalDuration = 0;
        const rhythms = events.filter(e => e.type === "rhythm");

        for (const r of rhythms) {
            if (typeof r.value === "number" && r.value !== 0) {
                totalDuration += 1 / r.value;
            }
        }

        if (totalDuration === 0) return null;

        // Assuming 4/4 time for simple hints
        const measureProgress = totalDuration % 1;
        if (measureProgress > 0.01 && measureProgress < 0.99) {
            const remaining = 1 - measureProgress;
            if (Math.abs(remaining - 0.25) < 0.05) {
                return _(
                    "You have 3 beats. Add a <span class='hint-highlight'>quarter note</span> (4) to finish the measure!"
                );
            }
            if (Math.abs(remaining - 0.5) < 0.05) {
                return _(
                    "Your measure is half full. Add a <span class='hint-highlight'>half note</span> (2) to complete it."
                );
            }
            return _("Try to make your rhythm add up to a full measure (like four '4's)!");
        }
        return null;
    };

    /**
     * Chord Rules: Check for common chord patterns.
     * @private
     */
    this._checkChordRules = function (events) {
        const pitches = events.filter(e => e.type === "pitch").map(e => e.value);
        if (pitches.length < 2) return null;

        // Simple C Major check (C=0, E=4, G=7)
        const hasC = pitches.includes(0);
        const hasE = pitches.includes(4);
        const hasG = pitches.includes(7);

        if (hasC && hasE && !hasG) {
            return _(
                "You're playing C and E — add <span class='hint-highlight'>G</span> to make a C Major chord!"
            );
        }
        if (hasC && hasG && !hasE) {
            return _(
                "Add <span class='hint-highlight'>E</span> to your C and G to complete the C Major chord."
            );
        }
        return null;
    };

    /**
     * Pattern Rules: Suggest using repeat blocks for patterns.
     * @private
     */
    this._checkPatternRules = function (events) {
        if (events.length > 5) {
            // Check for simple repetition in the last few notes
            const pitches = events.filter(e => e.type === "pitch").map(e => e.value);
            if (pitches.length >= 4) {
                const last4 = pitches.slice(-4);
                if (last4[0] === last4[2] && last4[1] === last4[3]) {
                    return _(
                        "I see a pattern! Try using a <span class='hint-highlight'>repeat</span> block to loop it."
                    );
                }
            }
        }
        return null;
    };

    /**
     * Instrumentation Rules: Check for missing tempo or instrument.
     * @private
     */
    this._checkInstrumentationRules = function (events) {
        const hasTempo = events.some(e => e.type === "tempo");
        const hasInstrument = events.some(e => e.type === "instrument");

        if (events.length > 3 && !hasTempo) {
            return _(
                "Your song is growing! Add a <span class='hint-highlight'>set tempo</span> block to control the speed."
            );
        }
        if (events.length > 5 && !hasInstrument) {
            return _(
                "Try a <span class='hint-highlight'>set instrument</span> block to change the sound of your notes!"
            );
        }
        return null;
    };

    /**
     * Scale Rules: Suggest notes from the detected scale.
     * @private
     */
    this._checkScaleRules = function (events) {
        const pitches = events.filter(e => e.type === "pitch").map(e => e.value);
        if (pitches.length === 0) return null;

        // If using mostly C Major notes (0, 2, 4, 5, 7, 9, 11)
        const cMajorNotes = [0, 2, 4, 5, 7, 9, 11];
        const lastPitch = pitches[pitches.length - 1];

        if (cMajorNotes.includes(lastPitch)) {
            const nextNote = cMajorNotes[(cMajorNotes.indexOf(lastPitch) + 1) % cMajorNotes.length];
            const noteName = this._getNoteName(nextNote);
            return _(
                "Your melody fits the C Major scale. Try adding <span class='hint-highlight'>" +
                    noteName +
                    "</span> next!"
            );
        }
        return null;
    };

    /**
     * Helper to get a human-readable note name.
     * @private
     */
    this._getNoteName = function (pitch) {
        const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        return names[pitch % 12] || pitch;
    };

    /**
     * Updates the UI with a new hint and animation.
     * @param {string} hint - The hint text to display.
     * @private
     */
    this._displayHint = function (hint) {
        this.hintText.style.opacity = 0;
        setTimeout(() => {
            this.hintText.innerHTML = hint;
            this.hintText.style.opacity = 1;
        }, 300);
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { MusicTheoryHintsWidget };
}
