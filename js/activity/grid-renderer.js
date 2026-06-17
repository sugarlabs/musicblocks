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

const GRID_WIDTH = 1200;
const GRID_HEIGHT = 900;
const ACCIDENTAL_X_OFFSET = 600;
const ACCIDENTAL_SPACING = 15;

let SHARPS = null;
let FLATS = null;

const getSharps = () => {
    if (!SHARPS) {
        SHARPS = [
            "F" + SHARP,
            "C" + SHARP,
            "G" + SHARP,
            "D" + SHARP,
            "A" + SHARP,
            "E" + SHARP,
            "B" + SHARP
        ];
    }
    return SHARPS;
};

const getFlats = () => {
    if (!FLATS) {
        FLATS = [
            "B" + FLAT,
            "E" + FLAT,
            "A" + FLAT,
            "D" + FLAT,
            "G" + FLAT,
            "C" + FLAT,
            "F" + FLAT
        ];
    }
    return FLATS;
};

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
        bitmap.cache(0, 0, GRID_WIDTH, GRID_HEIGHT);
        bitmap.updateCache();
    }

    /*
     * Triggers the EaselJS stage update flag on the activity instance.
     */
    _requestUpdate() {
        this.activity.update = true;
    }

    /*
     * Common logic to display any musical staff grid.
     */
    _showStaff(staffBitmap, sharpBitmaps, flatBitmaps) {
        staffBitmap.visible = true;
        this._applyThemeFilter(staffBitmap);
        this.hideAccidentals();

        debugLog(this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]);
        const scale = buildScale(
            this.activity.KeySignatureEnv[0] + " " + this.activity.KeySignatureEnv[1]
        )[0];

        debugLog(scale);

        const sharps = getSharps();
        const flats = getFlats();
        let dx = 0;
        for (let i = 0; i < 7; i++) {
            if (scale.includes(sharps[i])) {
                sharpBitmaps[i].x += dx;
                sharpBitmaps[i].visible = true;
                dx += ACCIDENTAL_SPACING;
            }
            if (scale.includes(flats[i])) {
                flatBitmaps[i].x += dx;
                flatBitmaps[i].visible = true;
                dx += ACCIDENTAL_SPACING;
            }
        }
        this._requestUpdate();
    }

    /*
     * Common logic to hide any musical staff grid.
     */
    _hideStaff(staffBitmap) {
        staffBitmap.visible = false;
        staffBitmap.uncache();
        this.hideAccidentals();
        this._requestUpdate();
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
        this._requestUpdate();
    }

    /*
     * Shows cartesian grid
     */
    showCartesian() {
        this.activity.cartesianBitmap.visible = true;
        this._applyThemeFilter(this.activity.cartesianBitmap);
        this._requestUpdate();
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
        this._requestUpdate();
    }

    /*
     * Shows polar grid
     */
    showPolar() {
        this.activity.polarBitmap.visible = true;
        this._applyThemeFilter(this.activity.polarBitmap);
        this._requestUpdate();
    }

    // -------------------------------------------------------------------------
    // Accidentals (shared helper used by all staff show/hide methods)
    // -------------------------------------------------------------------------

    /*
     * Hides accidentals
     */
    hideAccidentals() {
        const newX =
            this.activity.canvas.width / (2 * this.activity.turtleBlocksScale) -
            ACCIDENTAL_X_OFFSET;
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
        this._requestUpdate();
    }

    // -------------------------------------------------------------------------
    // Treble staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical treble staff
     */
    hideTreble() {
        this._hideStaff(this.activity.trebleBitmap);
    }

    /*
     * Shows musical treble staff
     */
    showTreble() {
        this._showStaff(
            this.activity.trebleBitmap,
            this.activity.trebleSharpBitmap,
            this.activity.trebleFlatBitmap
        );
    }

    // -------------------------------------------------------------------------
    // Grand staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical grand staff
     */
    hideGrand() {
        this._hideStaff(this.activity.grandBitmap);
    }

    /*
     * Shows musical grand staff
     */
    showGrand() {
        this._showStaff(
            this.activity.grandBitmap,
            this.activity.grandSharpBitmap,
            this.activity.grandFlatBitmap
        );
    }

    // -------------------------------------------------------------------------
    // Soprano staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical soprano staff
     */
    hideSoprano() {
        this._hideStaff(this.activity.sopranoBitmap);
    }

    /*
     * Shows musical soprano staff
     */
    showSoprano() {
        this._showStaff(
            this.activity.sopranoBitmap,
            this.activity.sopranoSharpBitmap,
            this.activity.sopranoFlatBitmap
        );
    }

    // -------------------------------------------------------------------------
    // Alto staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical alto staff
     */
    hideAlto() {
        this._hideStaff(this.activity.altoBitmap);
    }

    /*
     * Shows musical alto staff
     */
    showAlto() {
        this._showStaff(
            this.activity.altoBitmap,
            this.activity.altoSharpBitmap,
            this.activity.altoFlatBitmap
        );
    }

    // -------------------------------------------------------------------------
    // Tenor staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical tenor staff
     */
    hideTenor() {
        this._hideStaff(this.activity.tenorBitmap);
    }

    /*
     * Shows musical tenor staff
     */
    showTenor() {
        this._showStaff(
            this.activity.tenorBitmap,
            this.activity.tenorSharpBitmap,
            this.activity.tenorFlatBitmap
        );
    }

    // -------------------------------------------------------------------------
    // Bass staff
    // -------------------------------------------------------------------------

    /*
     * Hides musical bass staff
     */
    hideBass() {
        this._hideStaff(this.activity.bassBitmap);
    }

    /*
     * Shows musical bass staff
     */
    showBass() {
        this._showStaff(
            this.activity.bassBitmap,
            this.activity.bassSharpBitmap,
            this.activity.bassFlatBitmap
        );
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
