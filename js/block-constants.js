// Copyright (c) 2014-21 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   exported
   MINIMUMDOCKDISTANCE, LONGSTACK, SPATIAL_GRID_CELL_SIZE,
   CAMERAVALUE, VIDEOVALUE
 */

/**
 * Minimum distance (squared) between two docks required before
 * connecting them.
 */
const MINIMUMDOCKDISTANCE = 400;

/** Soft limit on the number of blocks in a single stack. */
const LONGSTACK = 300;

/**
 * Spatial grid cell size in pixels for O(1) nearest-dock lookups.
 * Chosen so that MINIMUMDOCKDISTANCE (20px radius at default scale)
 * is always covered by checking a block's cell plus its 8 neighbors.
 */
const SPATIAL_GRID_CELL_SIZE = 50;

/** Special value flags to uniquely identify these media blocks. */
const CAMERAVALUE = "##__CAMERA__##";
const VIDEOVALUE = "##__VIDEO__##";

const blockConstants = {
    MINIMUMDOCKDISTANCE,
    LONGSTACK,
    SPATIAL_GRID_CELL_SIZE,
    CAMERAVALUE,
    VIDEOVALUE
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = blockConstants;
}

/* global define */
if (typeof define === "function" && define.amd) {
    define(function () {
        return blockConstants;
    });
}

// Skipped under CommonJS (e.g. Jest) to avoid polluting the global scope there.
if (typeof window !== "undefined" && typeof module === "undefined") {
    Object.assign(window, blockConstants);
}
