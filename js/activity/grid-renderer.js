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
class GridRenderer {
    /**
     * @param {object} activity - The Activity instance.
     */
    constructor(activity) {
        this.activity = activity;
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /*
     * Applies the invert color filter for dark / high-contrast themes, then
     * caches the bitmap. Called by every show* method after setting visibility.
     */
    _applyThemeFilter(bitmap) {
        const isDarkMode = document.body.classList.contains("dark");
        const isHighContrastMode = document.body.classList.contains("highcontrast");
        if (isDarkMode || isHighContrastMode) {
            const invertFilter = new createjs.ColorFilter(-1, -1, -1, 1, 255, 255, 255);
            bitmap.filters = [invertFilter];
        } else {
            bitmap.filters = [];
        }
        bitmap.cache(0, 0, 1200, 900);
        bitmap.updateCache();
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
        this._applyThemeFilter(this.activity.cartesianBitmap);
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
        this._applyThemeFilter(this.activity.polarBitmap);
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
        this._applyThemeFilter(this.activity.trebleBitmap);
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
        this._applyThemeFilter(this.activity.grandBitmap);
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
        this._applyThemeFilter(this.activity.sopranoBitmap);
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
        this._applyThemeFilter(this.activity.altoBitmap);
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
        this._applyThemeFilter(this.activity.tenorBitmap);
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
        this._applyThemeFilter(this.activity.bassBitmap);
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
// Must be called after grid bitmaps have been initialized.
//
// @param {object} activity - The Activity instance.
const setupGridRenderer = activity => {
    const renderer = new GridRenderer(activity);
    activity.gridRenderer = renderer;

    activity._hideCartesian = () => renderer.hideCartesian();
    activity._showCartesian = () => renderer.showCartesian();
    activity._hidePolar = () => renderer.hidePolar();
    activity._showPolar = () => renderer.showPolar();
    activity._hideAccidentals = () => renderer.hideAccidentals();
    activity._hideTreble = () => renderer.hideTreble();
    activity._showTreble = () => renderer.showTreble();
    activity._hideGrand = () => renderer.hideGrand();
    activity._showGrand = () => renderer.showGrand();
    activity._hideSoprano = () => renderer.hideSoprano();
    activity._showSoprano = () => renderer.showSoprano();
    activity._hideAlto = () => renderer.hideAlto();
    activity._showAlto = () => renderer.showAlto();
    activity._hideTenor = () => renderer.hideTenor();
    activity._showTenor = () => renderer.showTenor();
    activity._hideBass = () => renderer.hideBass();
    activity._showBass = () => renderer.showBass();
};

// All browser execution goes through RequireJS (AMD). The module.exports branch
// is present solely for Jest/Node test environments and is never exercised at
// runtime in the browser.
if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupGridRenderer = setupGridRenderer;
        return { setupGridRenderer, GridRenderer };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupGridRenderer, GridRenderer };
}
