// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/**
 * @file BlocksDependencies.js
 * @description Explicit dependency container for the Blocks subsystem.
 *
 * This class manages Blocks' explicit dependencies.
 */

/**
 * @class
 * @classdesc Container for Blocks' explicit dependencies.
 */
class BlocksDependencies {
    /**
     * @constructor
     * @param {Object} deps - Dependency configuration object
     * @param {Object} deps.storage - Persistence handler
     * @param {Object} deps.trashcan - Trashcan subsystem
     * @param {Object} deps.turtles - Turtles subsystem
     * @param {Object} deps.boundary - Boundary management
     * @param {Object} deps.macroDict - Macro dictionary
     * @param {Object} deps.palettes - Palettes subsystem
     * @param {Object} deps.logo - Logo execution engine
     * @param {Object} deps.blocksContainer - Container for blocks
     * @param {Object} deps.canvas - Canvas element
     * @param {Function} deps.refreshCanvas - Function to refresh the canvas
     * @param {Function} deps.errorMsg - Function to display error messages
     * @param {Function} deps.setSelectionMode - Function to set selection mode
     * @param {Function} deps.stopLoadAnimation - Function to stop load animation
     * @param {Function} deps.setHomeContainers - Function to set home containers
     * @param {Function} deps.tick - Function to trigger a tick
     */
    constructor({
        storage,
        trashcan,
        turtles,
        boundary,
        macroDict,
        palettes,
        logo,
        blocksContainer,
        canvas,
        refreshCanvas,
        errorMsg,
        setSelectionMode,
        stopLoadAnimation,
        setHomeContainers,
        tick
    }) {
        this.storage = storage;
        this.trashcan = trashcan;
        this.turtles = turtles;
        this.boundary = boundary;
        this.macroDict = macroDict;
        this.palettes = palettes;
        this.logo = logo;
        this.blocksContainer = blocksContainer;
        this.canvas = canvas;
        this.refreshCanvas = refreshCanvas;
        this.errorMsg = errorMsg;
        this.setSelectionMode = setSelectionMode;
        this.stopLoadAnimation = stopLoadAnimation;
        this.setHomeContainers = setHomeContainers;
        this.tick = tick;
    }

    /**
     * Factory method to create BlocksDependencies from an Activity object.
     * This provides backward compatibility with the existing architecture.
     *
     * @param {Object} activity - Activity object (old pattern)
     * @returns {BlocksDependencies} Dependency container
     */
    static fromActivity(activity) {
        return new BlocksDependencies({
            storage: activity.storage,
            trashcan: activity.trashcan,
            turtles: activity.turtles,
            boundary: activity.boundary,
            macroDict: activity.macroDict,
            palettes: activity.palettes,
            logo: activity.logo,
            blocksContainer: activity.blocksContainer,
            canvas: activity.canvas,
            refreshCanvas: () => activity.refreshCanvas(),
            errorMsg: (msg, blk) => activity.errorMsg(msg, blk),
            setSelectionMode: selection => activity.setSelectionMode(selection),
            stopLoadAnimation: () => activity.stopLoadAnimation(),
            setHomeContainers: val => activity.setHomeContainers(val),
            tick: () => activity.__tick()
        });
    }

    /**
     * Check if this is a valid BlocksDependencies instance.
     *
     * @param {*} obj - Object to check
     * @returns {boolean} True if obj is a BlocksDependencies instance
     */
    static isBlocksDependencies(obj) {
        return obj instanceof BlocksDependencies;
    }
}

// Export for RequireJS/AMD
if (typeof define === "function" && define.amd) {
    define([], function () {
        return BlocksDependencies;
    });
}

// Export for Node.js/CommonJS (for testing)
if (typeof module !== "undefined" && module.exports) {
    module.exports = BlocksDependencies;
}
