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

/* global _THIS_IS_MUSIC_BLOCKS_ */

/* exported setupToolbarController, ToolbarController */

/**
 * Manages the execution controls for Music Blocks.
 *
 * Owns: execution state (runMode), logo execution triggers, speed/delay configuration,
 * and synth resume calls.
 *
 * Does NOT own: DOM elements, colors, button styles, visibility toggles, or workspace resizing.
 */
class ToolbarController {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
        this.runMode = "normal";
    }

    /**
     * Runs Music Blocks at full speed.
     * @param {object} env - Environment parameters for execution.
     * @param {number} currentDelay - The turtle delay before this button action.
     */
    runFast(env, currentDelay) {
        this.runMode = "normal";

        this.activity.logo.turtleDelay = 0;
        if (this.activity.logo?.synth?.resume) {
            this.activity.logo.synth.resume();
        }

        if (!this.activity.turtles.running()) {
            this.activity.logo.runLogoCommands(null, env);
        } else {
            if (currentDelay !== 0) {
                // Keep playing at full speed.
                this.activity.logo.step();
            } else {
                // Stop and restart.
                this.activity.logo.doStopTurtles();

                const that = this;
                setTimeout(() => {
                    that.activity.logo.runLogoCommands(null, env);
                }, 500);
            }
        }
    }

    /**
     * Runs Music Blocks at a slower rate.
     */
    runSlow() {
        this.runMode = "slow";
        this.activity.logo.turtleDelay = this.activity.DEFAULTDELAY || 500;
        if (this.activity.logo?.synth?.resume) {
            this.activity.logo.synth.resume();
        }

        if (!this.activity.turtles.running()) {
            this.activity.logo.runLogoCommands();
        } else {
            this.activity.logo.step();
        }
    }

    /**
     * Runs Music Blocks step by step.
     * @returns {string|null} "started", "stopped", or null.
     */
    runStep() {
        this.runMode = "step";
        const turtleCount = Object.keys(this.activity.logo.stepQueue).length;
        if (this.activity.logo?.synth?.resume) {
            this.activity.logo.synth.resume();
        }

        const TURTLESTEP = this.activity.TURTLESTEP !== undefined ? this.activity.TURTLESTEP : -1;

        if (turtleCount === 0 || this.activity.logo.turtleDelay !== TURTLESTEP) {
            // Either we haven't set up a queue or we are switching modes.
            this.activity.logo.turtleDelay = TURTLESTEP;
            // Queue and take first step.
            let started = false;
            if (!this.activity.turtles.running()) {
                this.activity.logo.runLogoCommands();
                started = true;
            }
            this.activity.logo.step();
            return started ? "started" : null;
        } else {
            const noBlocks = Object.keys(this.activity.logo.stepQueue).every(
                key => this.activity.logo.stepQueue[key].length === 0
            );
            if (noBlocks) {
                this.activity.logo.doStopTurtles();
                return "stopped";
            }
            this.activity.logo.turtleDelay = TURTLESTEP;
            this.activity.logo.step();
            return null;
        }
    }

    /**
     * Stops running of Music Blocks.
     * @param {boolean} onblur - Indicates if the stop was triggered by loss of focus.
     * @returns {boolean} True if stopped successfully, false if bypassed.
     */
    hardStop(onblur) {
        if (onblur === undefined) {
            onblur = false;
        }

        // Use bare global: set by loader.js as window._THIS_IS_MUSIC_BLOCKS_ = true.
        // All other files in this repo (toolbar.js, status.js, turtledefs.js) access
        // it the same way via /* global _THIS_IS_MUSIC_BLOCKS_ */.
        if (onblur && _THIS_IS_MUSIC_BLOCKS_) {
            return false;
        }

        this.activity.logo.doStopTurtles();
        return true;
    }
}

/**
 * Attaches a ToolbarController instance to the activity.
 * Called once from the Activity constructor, before setupDependencies().
 * @param {object} activity - The Activity instance.
 */
const setupToolbarController = activity => {
    const controller = new ToolbarController(activity);
    activity.toolbarController = controller;
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupToolbarController = setupToolbarController;
        return { setupToolbarController, ToolbarController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupToolbarController, ToolbarController };
}
