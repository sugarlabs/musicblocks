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

/* global createjs, SHARP, FLAT, buildScale, debugLog */

/* exported setupGridRenderer, GridRenderer */

// Owns the EaselJS drawing layer for every grid overlay (Cartesian, Polar,
// and all musical staff types). It reads bitmap state from the activity
// instance and mutates only visibility, filters, and cache — never
// controller state such as currentGrid.
//
// Lifecycle:
//   - Bitmaps are created by activity.js setupDependencies() via _createGrid.
//   - setupGridRenderer() is called immediately after setupGridController(),
//     once the bitmaps are allocated, and wires all _show/_hide properties
//     on the activity to arrow-function delegations into this class.
class GridRenderer {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
    }

    // -------------------------------------------------------------------------
    // Cartesian
    // -------------------------------------------------------------------------

    /*
     * Hides cartesian grid
     */
    hideCartesian() {
        this.activity.cartesianBitmap.visible = false;
        this.activity.cartesianBitmap.uncache();
        this.activity.update = true;
    }

    /*
     * Shows cartesian grid
     */
    showCartesian() {
        this.activity.cartesianBitmap.visible = true;
        // Apply color filter based on theme
        const isDarkMode = document.body.classList.contains("dark");
        const isHighContrastMode = document.body.classList.contains("highcontrast");
        if (isDarkMode || isHighContrastMode) {
            const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
            this.activity.cartesianBitmap.filters = [invertFilter];
        } else {
            this.activity.cartesianBitmap.filters = [];
        }
        this.activity.cartesianBitmap.cache(0, 0, 1200, 900);
        this.activity.cartesianBitmap.updateCache();
        this.activity.update = true;
    }

    // -------------------------------------------------------------------------
    // Polar
    // -------------------------------------------------------------------------

    /*
     * Hides polar grid
     */
    hidePolar() {
        this.activity.polarBitmap.visible = false;
        this.activity.polarBitmap.uncache();
        this.activity.update = true;
    }

    /*
     * Shows polar grid
     */
    showPolar() {
        this.activity.polarBitmap.visible = true;
        // Apply color filter based on theme
        const isDarkMode = document.body.classList.contains("dark");
        const isHighContrastMode = document.body.classList.contains("highcontrast");
        if (isDarkMode || isHighContrastMode) {
            const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
            this.activity.polarBitmap.filters = [invertFilter];
        } else {
            this.activity.polarBitmap.filters = [];
        }
        this.activity.polarBitmap.cache(0, 0, 1200, 900);
        this.activity.polarBitmap.updateCache();
        this.activity.update = true;
    }

    // -------------------------------------------------------------------------
    // Accidentals (shared helper used by all staff show/hide methods)
    // -------------------------------------------------------------------------

    /*
     * Hides accidentals
     */
    hideAccidentals() {
        const newX = this.activity.canvas.width / (2 * this.activity.turtleBlocksScale) - 600;
        for (let i = 0; i < 7; i++) {
            this.activity.grandSharpBitmap[i].visible = false;
            this.activity.grandSharpBitmap[i].x = newX;
            this.activity.grandFlatBitmap[i].visible = false;
            this.activity.grandFlatBitmap[i].x = newX;

            this.activity.trebleSharpBitmap[i].visible = false;
            this.activity.trebleSharpBitmap[i].x = newX;
            this.activity.trebleFlatBitmap[i].visible = false;
            this.activity.trebleFlatBitmap[i].x = newX;

            this.activity.sopranoSharpBitmap[i].visible = false;
            this.activity.sopranoSharpBitmap[i].x = newX;
            this.activity.sopranoFlatBitmap[i].visible = false;
            this.activity.sopranoFlatBitmap[i].x = newX;

            this.activity.altoSharpBitmap[i].visible = false;
            this.activity.altoSharpBitmap[i].x = newX;
            this.activity.altoFlatBitmap[i].visible = false;
            this.activity.altoFlatBitmap[i].x = newX;

            this.activity.tenorSharpBitmap[i].visible = false;
            this.activity.tenorSharpBitmap[i].x = newX;
            this.activity.tenorFlatBitmap[i].visible = false;
            this.activity.tenorFlatBitmap[i].x = newX;

            this.activity.bassSharpBitmap[i].visible = false;
            this.activity.bassSharpBitmap[i].x = newX;
            this.activity.bassFlatBitmap[i].visible = false;
            this.activity.bassFlatBitmap[i].x = newX;
        }
        this.activity.update = true;
    }

    // -------------------------------------------------------------------------
    // Treble staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical treble staff
     */
    hideTreble() {
        this.activity.trebleBitmap.visible = false;
        this.activity.trebleBitmap.uncache();
        this.hideAccidentals();
        this.activity.update = true;
    }

    /*
     * Shows musical treble staff
     */
    showTreble() {
        this.activity.trebleBitmap.visible = true;
        // Apply color filter based on theme
        const isDarkMode = document.body.classList.contains("dark");
        const isHighContrastMode = document.body.classList.contains("highcontrast");
        if (isDarkMode || isHighContrastMode) {
            const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
            this.activity.trebleBitmap.filters = [invertFilter];
        } else {
            this.activity.trebleBitmap.filters = [];
        }
        this.activity.trebleBitmap.cache(0, 0, 1200, 900);
        this.activity.trebleBitmap.updateCache();
        this.hideAccidentals();

        debugLog(this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]);
        const scale = buildScale(
            this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]
        )[0];

        debugLog(scale);
        const _sharps = [
            "F" + SHARP,
            "C" + SHARP,
            "G" + SHARP,
            "D" + SHARP,
            "A" + SHARP,
            "E" + SHARP,
            "B" + SHARP
        ];
        const _flats = [
            "B" + FLAT,
            "E" + FLAT,
            "A" + FLAT,
            "D" + FLAT,
            "G" + FLAT,
            "C" + FLAT,
            "F" + FLAT
        ];
        let dx = 0;
        for (let i = 0; i < 7; i++) {
            if (scale.includes(_sharps[i])) {
                this.activity.trebleSharpBitmap[i].x += dx;
                this.activity.trebleSharpBitmap[i].visible = true;
                dx += 15;
            }
            if (scale.includes(_flats[i])) {
                this.activity.trebleFlatBitmap[i].x += dx;
                this.activity.trebleFlatBitmap[i].visible = true;
                dx += 15;
            }
        }

        this.activity.update = true;
    }

    // -------------------------------------------------------------------------
    // Grand staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical grand staff
     */
    hideGrand() {
        this.activity.grandBitmap.visible = false;
        this.activity.grandBitmap.uncache();
        this.hideAccidentals();
        this.activity.update = true;
    }

    /*
     * Shows musical grand staff
     */
    showGrand() {
        this.activity.grandBitmap.visible = true;
        // Apply color filter based on theme
        const isDarkMode = document.body.classList.contains("dark");
        const isHighContrastMode = document.body.classList.contains("highcontrast");
        if (isDarkMode || isHighContrastMode) {
            const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
            this.activity.grandBitmap.filters = [invertFilter];
        } else {
            this.activity.grandBitmap.filters = [];
        }
        this.activity.grandBitmap.cache(0, 0, 1200, 900);
        this.activity.grandBitmap.updateCache();
        this.hideAccidentals();

        debugLog(this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]);
        const scale = buildScale(
            this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]
        )[0];

        debugLog(scale);
        const _sharps = [
            "F" + SHARP,
            "C" + SHARP,
            "G" + SHARP,
            "D" + SHARP,
            "A" + SHARP,
            "E" + SHARP,
            "B" + SHARP
        ];
        const _flats = [
            "B" + FLAT,
            "E" + FLAT,
            "A" + FLAT,
            "D" + FLAT,
            "G" + FLAT,
            "C" + FLAT,
            "F" + FLAT
        ];
        let dx = 0;
        for (let i = 0; i < 7; i++) {
            if (scale.includes(_sharps[i])) {
                this.activity.grandSharpBitmap[i].x += dx;
                this.activity.grandSharpBitmap[i].visible = true;
                dx += 15;
            }
            if (scale.includes(_flats[i])) {
                this.activity.grandFlatBitmap[i].x += dx;
                this.activity.grandFlatBitmap[i].visible = true;
                dx += 15;
            }
        }
        this.activity.update = true;
    }

    // -------------------------------------------------------------------------
    // Soprano staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical soprano staff
     */
    hideSoprano() {
        this.activity.sopranoBitmap.visible = false;
        this.activity.sopranoBitmap.uncache();
        this.activity.update = true;
    }

    /*
     * Shows musical soprano staff
     */
    showSoprano() {
        this.activity.sopranoBitmap.visible = true;
        // Apply color filter based on theme
        const isDarkMode = document.body.classList.contains("dark");
        const isHighContrastMode = document.body.classList.contains("highcontrast");
        if (isDarkMode || isHighContrastMode) {
            const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
            this.activity.sopranoBitmap.filters = [invertFilter];
        } else {
            this.activity.sopranoBitmap.filters = [];
        }
        this.activity.sopranoBitmap.cache(0, 0, 1200, 900);
        this.activity.sopranoBitmap.updateCache();
        this.hideAccidentals();

        debugLog(this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]);
        const scale = buildScale(
            this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]
        )[0];

        debugLog(scale);
        const _sharps = [
            "F" + SHARP,
            "C" + SHARP,
            "G" + SHARP,
            "D" + SHARP,
            "A" + SHARP,
            "E" + SHARP,
            "B" + SHARP
        ];
        const _flats = [
            "B" + FLAT,
            "E" + FLAT,
            "A" + FLAT,
            "D" + FLAT,
            "G" + FLAT,
            "C" + FLAT,
            "F" + FLAT
        ];
        let dx = 0;
        for (let i = 0; i < 7; i++) {
            if (scale.includes(_sharps[i])) {
                this.activity.sopranoSharpBitmap[i].x += dx;
                this.activity.sopranoSharpBitmap[i].visible = true;
                dx += 15;
            }
            if (scale.includes(_flats[i])) {
                this.activity.sopranoFlatBitmap[i].x += dx;
                this.activity.sopranoFlatBitmap[i].visible = true;
                dx += 15;
            }
        }

        this.activity.update = true;
    }

    // -------------------------------------------------------------------------
    // Alto staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical alto staff
     */
    hideAlto() {
        this.activity.altoBitmap.visible = false;
        this.activity.altoBitmap.uncache();
        this.hideAccidentals();
        this.activity.update = true;
    }

    /*
     * Shows musical alto staff
     */
    showAlto() {
        this.activity.altoBitmap.visible = true;
        // Apply color filter based on theme
        const isDarkMode = document.body.classList.contains("dark");
        const isHighContrastMode = document.body.classList.contains("highcontrast");
        if (isDarkMode || isHighContrastMode) {
            const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
            this.activity.altoBitmap.filters = [invertFilter];
        } else {
            this.activity.altoBitmap.filters = [];
        }
        this.activity.altoBitmap.cache(0, 0, 1200, 900);
        this.activity.altoBitmap.updateCache();
        this.hideAccidentals();

        debugLog(this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]);
        const scale = buildScale(
            this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]
        )[0];

        debugLog(scale);
        const _sharps = [
            "F" + SHARP,
            "C" + SHARP,
            "G" + SHARP,
            "D" + SHARP,
            "A" + SHARP,
            "E" + SHARP,
            "B" + SHARP
        ];
        const _flats = [
            "B" + FLAT,
            "E" + FLAT,
            "A" + FLAT,
            "D" + FLAT,
            "G" + FLAT,
            "C" + FLAT,
            "F" + FLAT
        ];
        let dx = 0;
        for (let i = 0; i < 7; i++) {
            if (scale.includes(_sharps[i])) {
                this.activity.altoSharpBitmap[i].x += dx;
                this.activity.altoSharpBitmap[i].visible = true;
                dx += 15;
            }
            if (scale.includes(_flats[i])) {
                this.activity.altoFlatBitmap[i].x += dx;
                this.activity.altoFlatBitmap[i].visible = true;
                dx += 15;
            }
        }

        this.activity.update = true;
    }

    // -------------------------------------------------------------------------
    // Tenor staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical tenor staff
     */
    hideTenor() {
        this.activity.tenorBitmap.visible = false;
        this.activity.tenorBitmap.uncache();
        this.activity.update = true;
    }

    /*
     * Shows musical tenor staff
     */
    showTenor() {
        this.activity.tenorBitmap.visible = true;
        // Apply color filter based on theme
        const isDarkMode = document.body.classList.contains("dark");
        const isHighContrastMode = document.body.classList.contains("highcontrast");
        if (isDarkMode || isHighContrastMode) {
            const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
            this.activity.tenorBitmap.filters = [invertFilter];
        } else {
            this.activity.tenorBitmap.filters = [];
        }
        this.activity.tenorBitmap.cache(0, 0, 1200, 900);
        this.activity.tenorBitmap.updateCache();
        this.hideAccidentals();

        debugLog(this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]);
        const scale = buildScale(
            this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]
        )[0];

        debugLog(scale);
        const _sharps = [
            "F" + SHARP,
            "C" + SHARP,
            "G" + SHARP,
            "D" + SHARP,
            "A" + SHARP,
            "E" + SHARP,
            "B" + SHARP
        ];
        const _flats = [
            "B" + FLAT,
            "E" + FLAT,
            "A" + FLAT,
            "D" + FLAT,
            "G" + FLAT,
            "C" + FLAT,
            "F" + FLAT
        ];
        let dx = 0;
        for (let i = 0; i < 7; i++) {
            if (scale.includes(_sharps[i])) {
                this.activity.tenorSharpBitmap[i].x += dx;
                this.activity.tenorSharpBitmap[i].visible = true;
                dx += 15;
            }
            if (scale.includes(_flats[i])) {
                this.activity.tenorFlatBitmap[i].x += dx;
                this.activity.tenorFlatBitmap[i].visible = true;
                dx += 15;
            }
        }

        this.activity.update = true;
    }

    // -------------------------------------------------------------------------
    // Bass staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical bass staff
     */
    hideBass() {
        this.activity.bassBitmap.visible = false;
        this.activity.bassBitmap.uncache();
        this.hideAccidentals();
        this.activity.update = true;
    }

    /*
     * Shows musical bass staff
     */
    showBass() {
        this.activity.bassBitmap.visible = true;
        // Apply color filter based on theme
        const isDarkMode = document.body.classList.contains("dark");
        const isHighContrastMode = document.body.classList.contains("highcontrast");
        if (isDarkMode || isHighContrastMode) {
            const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
            this.activity.bassBitmap.filters = [invertFilter];
        } else {
            this.activity.bassBitmap.filters = [];
        }
        this.activity.bassBitmap.cache(0, 0, 1200, 900);
        this.activity.bassBitmap.updateCache();
        this.hideAccidentals();

        debugLog(this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]);
        const scale = buildScale(
            this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]
        )[0];

        debugLog(scale);
        const _sharps = [
            "F" + SHARP,
            "C" + SHARP,
            "G" + SHARP,
            "D" + SHARP,
            "A" + SHARP,
            "E" + SHARP,
            "B" + SHARP
        ];
        const _flats = [
            "B" + FLAT,
            "E" + FLAT,
            "A" + FLAT,
            "D" + FLAT,
            "G" + FLAT,
            "C" + FLAT,
            "F" + FLAT
        ];
        let dx = 0;
        for (let i = 0; i < 7; i++) {
            if (scale.includes(_sharps[i])) {
                this.activity.bassSharpBitmap[i].x += dx;
                this.activity.bassSharpBitmap[i].visible = true;
                dx += 15;
            }
            if (scale.includes(_flats[i])) {
                this.activity.bassFlatBitmap[i].x += dx;
                this.activity.bassFlatBitmap[i].visible = true;
                dx += 15;
            }
        }

        this.activity.update = true;
    }
}

// Attaches a GridRenderer instance to the activity and wires every
// _show/_hide property on the activity to an arrow-function delegation
// into the renderer. Arrow wrappers preserve context regardless of how
// the activity properties are invoked by callers.
//
// Must be called after activity._createGrid() has populated all bitmap
// fields (i.e., after the bitmap-init block in setupDependencies()).
//
// @param {object} activity - The Activity instance.
const setupGridRenderer = activity => {
    const renderer = new GridRenderer(activity);
    activity.gridRenderer = renderer;

    activity._hideCartesian = (...args) => renderer.hideCartesian(...args);
    activity._showCartesian = (...args) => renderer.showCartesian(...args);
    activity._hidePolar = (...args) => renderer.hidePolar(...args);
    activity._showPolar = (...args) => renderer.showPolar(...args);
    activity._hideAccidentals = (...args) => renderer.hideAccidentals(...args);
    activity._hideTreble = (...args) => renderer.hideTreble(...args);
    activity._showTreble = (...args) => renderer.showTreble(...args);
    activity._hideGrand = (...args) => renderer.hideGrand(...args);
    activity._showGrand = (...args) => renderer.showGrand(...args);
    activity._hideSoprano = (...args) => renderer.hideSoprano(...args);
    activity._showSoprano = (...args) => renderer.showSoprano(...args);
    activity._hideAlto = (...args) => renderer.hideAlto(...args);
    activity._showAlto = (...args) => renderer.showAlto(...args);
    activity._hideTenor = (...args) => renderer.hideTenor(...args);
    activity._showTenor = (...args) => renderer.showTenor(...args);
    activity._hideBass = (...args) => renderer.hideBass(...args);
    activity._showBass = (...args) => renderer.showBass(...args);
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        // Expose setupGridRenderer as a browser global so that activity.js
        // can reference it via its /* global setupGridRenderer */ comment.
        // GridRenderer is not assigned to window because it is only
        // instantiated internally by setupGridRenderer and is never accessed
        // directly from other scripts.
        window.setupGridRenderer = setupGridRenderer;
        return { setupGridRenderer, GridRenderer };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupGridRenderer, GridRenderer };
}
