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
    constructor(activity) {
        this.activity = activity;
    }

    get currentGrid() {
        if (this.activity.turtles) {
            return this.activity.turtles.currentGrid;
        }
        return null;
    }

    set currentGrid(value) {
        if (this.activity.turtles) {
            this.activity.turtles.currentGrid = value;
        }
    }

    get isCartesianEnabled() {
        const grid = this.currentGrid;
        return grid === 1 || grid === 2;
    }

    get isPolarEnabled() {
        const grid = this.currentGrid;
        return grid === 2 || grid === 3;
    }

    get isGridVisible() {
        const grid = this.currentGrid;
        return grid !== null && grid !== 0;
    }

    /**
     * Hides all grids (Cartesian/polar/treble/et al.)
     */
    hideGrids() {
        if (this.activity.turtles) {
            this.activity.turtles.setGridLabel(_("show Cartesian"));
        }
        this.activity._hideCartesian();
        this.activity._hidePolar();
        if (_THIS_IS_MUSIC_BLOCKS_) {
            this.activity._hideTreble();
            this.activity._hideGrand();
            this.activity._hideSoprano();
            this.activity._hideAlto();
            this.activity._hideTenor();
            this.activity._hideBass();
        }
    }

    /**
     * Renders Cartesian/Polar/Treble/et al. grids
     */
    doCartesianPolar() {
        const turtles = this.activity.turtles;
        if (!turtles) {
            return;
        }

        switch (turtles.currentGrid) {
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
        }

        switch (turtles.gridWheel.selectedNavItemIndex) {
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
        }
        turtles.currentGrid = turtles.gridWheel.selectedNavItemIndex;
        this.activity.update = true;
    }
}

/**
 * Attaches the GridController setup methods to the activity instance.
 * @param {object} activity - The activity instance.
 */
const setupGridController = activity => {
    const controller = new GridController(activity);
    activity.gridController = controller;
    activity.hideGrids = () => {
        controller.hideGrids();
    };
    activity._doCartesianPolar = () => {
        controller.doCartesianPolar();
    };
};

if (typeof define === "function" && define.amd) {
    define(function () {
        window.setupGridController = setupGridController;
        window.GridController = GridController;
        return { setupGridController, GridController };
    });
} else if (typeof module !== "undefined" && module.exports) {
    // Jest / Node environment
    module.exports = { setupGridController, GridController };
}
