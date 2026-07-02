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

/* global _THIS_IS_MUSIC_BLOCKS_, _ */

/* exported setupGridController, GridController */

class GridController {
    /**
     * @param {object} activity - The Activity instance.
     * @param {boolean} isMusicBlocks - Whether this is running as Music Blocks
     *   (vs. Turtle Blocks). Injected rather than read from the global so that
     *   the controller has no hidden global dependency.
     */
    constructor(activity, isMusicBlocks) {
        this.activity = activity;
        this._isMusicBlocks = isMusicBlocks;
    }

    // -------------------------------------------------------------------------
    // State — single source of truth delegated to turtles.currentGrid
    // -------------------------------------------------------------------------

    get currentGrid() {
        if (!this.activity.turtles) {
            return null;
        }
        return this.activity.turtles.currentGrid;
    }

    set currentGrid(value) {
        if (this.activity.turtles) {
            this.activity.turtles.currentGrid = value;
        }
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Hides all grid overlays and resets the label to "show Cartesian".
     * Safe to call at any point after setupGridController(); if turtles is not
     * yet initialized the visual reset calls are still issued (they are no-ops
     * when no overlay is visible).
     */
    hideGrids() {
        if (this.activity.turtles) {
            this.activity.turtles.setGridLabel(_("show Cartesian"));
        }
        this.activity._hideCartesian();
        this.activity._hidePolar();
        if (this._isMusicBlocks) {
            this.activity._hideTreble();
            this.activity._hideGrand();
            this.activity._hideSoprano();
            this.activity._hideAlto();
            this.activity._hideTenor();
            this.activity._hideBass();
        }
    }

    /**
     * Applies the grid selection from the pie-menu wheel:
     *   1. Hides the previously active grid overlay (read from this.currentGrid).
     *   2. Shows the newly selected overlay (read from gridWheel.selectedNavItemIndex).
     *   3. Updates this.currentGrid to the new selection.
     *
     * Must only be called once turtles (and its gridWheel) are initialised.
     */
    doCartesianPolar() {
        const turtles = this.activity.turtles;
        if (!turtles) {
            return;
        }

        // Hide the previously active overlay using the controller getter so
        // there is a single source of truth for the current grid value.
        switch (this.currentGrid) {
            case 1:
                this.activity._hideCartesian();
                break;
            case 2:
                this.activity._hideCartesian();
                this.activity._hidePolar();
                break;
            case 3:
                this.activity._hidePolar();
                break;
            case 4:
                this.activity._hideTreble();
                break;
            case 5:
                this.activity._hideGrand();
                break;
            case 6:
                this.activity._hideSoprano();
                break;
            case 7:
                this.activity._hideAlto();
                break;
            case 8:
                this.activity._hideTenor();
                break;
            case 9:
                this.activity._hideBass();
                break;
            default:
                break;
        }

        const next = turtles.gridWheel.selectedNavItemIndex;

        // Show the newly selected overlay.
        switch (next) {
            case 1:
                this.activity._showCartesian();
                break;
            case 2:
                this.activity._showCartesian();
                this.activity._showPolar();
                break;
            case 3:
                this.activity._showPolar();
                break;
            case 4:
                this.activity._showTreble();
                break;
            case 5:
                this.activity._showGrand();
                break;
            case 6:
                this.activity._showSoprano();
                break;
            case 7:
                this.activity._showAlto();
                break;
            case 8:
                this.activity._showTenor();
                break;
            case 9:
                this.activity._showBass();
                break;
            default:
                break;
        }

        // Write back through the setter — keeps turtles.currentGrid in sync
        // via the single delegated path.
        this.currentGrid = next;
        this.activity.update = true;
    }
}

/**
 * Attaches a GridController instance and its public surface to the activity.
 *
 * Intended to be called after `activity.turtles` has been initialised so that
 * doCartesianPolar() has access to the turtles state it needs. doCartesianPolar()
 * still guards against a missing turtles reference as a safety net, but callers
 * should not rely on that guard for normal startup flow.
 * hideGrids() is safe to call at any time; it guards the setGridLabel call
 * internally.
 *
 * @param {object} activity - The Activity instance.
 */
const setupGridController = activity => {
    // Prefer the mode flag from the activity object (testable, no hidden
    // global dependency). Fall back to the RequireJS-loaded global for the
    // real browser path where activity._THIS_IS_MUSIC_BLOCKS_ is not set.
    const isMusicBlocks =
        typeof activity._THIS_IS_MUSIC_BLOCKS_ !== "undefined"
            ? activity._THIS_IS_MUSIC_BLOCKS_
            : typeof _THIS_IS_MUSIC_BLOCKS_ !== "undefined"
              ? _THIS_IS_MUSIC_BLOCKS_
              : // Default to Music Blocks mode. This matches the expected production
                // environment and avoids silently stripping music-specific grid
                // overlays (Treble, Grand, etc.) if both sources are unexpectedly
                // absent. A missing flag is far more likely to be a loader issue
                // than an intentional Turtle Blocks run.
                true;

    const controller = new GridController(activity, isMusicBlocks);
    activity.gridController = controller;

    activity.hideGrids = () => {
        controller.hideGrids();
    };
    activity._doCartesianPolar = () => {
        controller.doCartesianPolar();
    };
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        // Expose setupGridController as a browser global so that activity.js
        // can reference it via its /* global setupGridController */ comment.
        // GridController is not assigned to window because it is only
        // instantiated internally by setupGridController and is never accessed
        // directly from other scripts.
        window.setupGridController = setupGridController;
        return { setupGridController, GridController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupGridController, GridController };
}
