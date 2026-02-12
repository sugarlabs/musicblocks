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
 * @file LogoDependencies.js
 * @description Explicit dependency container for the Logo execution engine.
 *
 * This class makes Logo's dependencies explicit rather than accessing them
 * through the global Activity facade, improving testability and code clarity.
 */

/**
 * @class
 * @classdesc Container for Logo's explicit dependencies.
 */
class LogoDependencies {
    /**
     * @constructor
     * @param {Object} deps - Dependency configuration object
     * @param {Object} deps.blocks - Blocks subsystem for program structure
     * @param {Array} deps.blocks.blockList - List of all blocks
     * @param {Function} deps.blocks.unhighlightAll - Unhighlight all blocks
     * @param {Function} deps.blocks.bringToTop - Bring blocks to top z-index
     * @param {Function} deps.blocks.showBlocks - Show blocks UI
     * @param {Function} deps.blocks.hideBlocks - Hide blocks UI
     * @param {Function} deps.blocks.sameGeneration - Check block relationships
     * @param {boolean} deps.blocks.visible - Whether blocks are visible
     *
     * @param {Object} deps.turtles - Turtles subsystem for command execution
     * @param {Array} deps.turtles.turtleList - List of all turtles
     * @param {Function} deps.turtles.ithTurtle - Get turtle by index
     * @param {Function} deps.turtles.getTurtle - Get turtle by ID
     * @param {Function} deps.turtles.getTurtleCount - Get total turtle count
     * @param {Function} deps.turtles.add - Add a new turtle
     * @param {Function} deps.turtles.markAllAsStopped - Mark all turtles as stopped
     *
     * @param {Object} deps.stage - Stage/canvas for event handling
     * @param {Function} deps.stage.addEventListener - Add event listener
     * @param {Function} deps.stage.removeEventListener - Remove event listener
     *
     * @param {Function} deps.errorHandler - Function to display error messages
     * @param {string} deps.errorHandler.msg - Error message to display
     *
     * @param {Object} deps.messageHandler - Message display handler
     * @param {Function} deps.messageHandler.hide - Hide all messages
     *
     * @param {Object} deps.storage - Persistence handler
     * @param {Function} deps.storage.saveLocally - Save state locally
     *
     * @param {Object} deps.config - Configuration object
     * @param {boolean} deps.config.showBlocksAfterRun - Whether to show blocks after run
     *
     * @param {Object} deps.callbacks - Lifecycle callbacks
     * @param {Function} deps.callbacks.onStopTurtle - Called when turtle stops
     * @param {Function} deps.callbacks.onRunTurtle - Called when turtle runs
     *
     * @param {Object} [deps.meSpeak] - Optional speech synthesis object
     */
    constructor({
        blocks,
        turtles,
        stage,
        errorHandler,
        messageHandler,
        storage,
        config,
        callbacks,
        meSpeak = null
    }) {
        // Validate required dependencies
        if (!blocks) {
            throw new Error("LogoDependencies: 'blocks' is required");
        }
        if (!turtles) {
            throw new Error("LogoDependencies: 'turtles' is required");
        }
        if (!stage) {
            throw new Error("LogoDependencies: 'stage' is required");
        }
        if (!errorHandler) {
            throw new Error("LogoDependencies: 'errorHandler' is required");
        }

        /**
         * Blocks subsystem - manages program structure and visual feedback
         * @type {Object}
         */
        this.blocks = blocks;

        /**
         * Turtles subsystem - manages turtle state and execution
         * @type {Object}
         */
        this.turtles = turtles;

        /**
         * Stage - canvas/event bus for interaction
         * @type {Object}
         */
        this.stage = stage;

        /**
         * Error handler - displays error messages to user
         * @type {Function}
         */
        this.errorHandler = errorHandler;

        /**
         * Message handler - manages UI messages
         * @type {Object}
         */
        this.messageHandler = messageHandler || { hide: () => {} };

        /**
         * Storage - handles persistence
         * @type {Object}
         */
        this.storage = storage || { saveLocally: () => {} };

        /**
         * Configuration - runtime settings
         * @type {Object}
         */
        this.config = config || { showBlocksAfterRun: false };

        /**
         * Callbacks - lifecycle event handlers
         * @type {Object}
         */
        this.callbacks = callbacks || { onStopTurtle: null, onRunTurtle: null };

        /**
         * Speech synthesis (optional)
         * @type {Object|null}
         */
        this.meSpeak = meSpeak;
    }

    /**
     * Factory method to create LogoDependencies from an Activity object.
     * This provides backward compatibility with the existing architecture.
     *
     * @param {Object} activity - Activity object (old pattern)
     * @returns {LogoDependencies} Dependency container
     *
     * @example
     * const deps = LogoDependencies.fromActivity(activity);
     * const logo = new Logo(deps);
     */
    static fromActivity(activity) {
        return new LogoDependencies({
            blocks: activity.blocks,
            turtles: activity.turtles,
            stage: activity.stage,
            errorHandler: msg => activity.errorMsg(msg),
            messageHandler: {
                hide: () => activity.hideMsgs()
            },
            storage: {
                saveLocally: () => activity.saveLocally()
            },
            config: {
                get showBlocksAfterRun() {
                    return activity.showBlocksAfterRun;
                },
                set showBlocksAfterRun(value) {
                    activity.showBlocksAfterRun = value;
                }
            },
            callbacks: {
                onStopTurtle: activity.onStopTurtle,
                onRunTurtle: activity.onRunTurtle
            },
            meSpeak: activity.meSpeak
        });
    }

    /**
     * Check if this is a valid LogoDependencies instance.
     * Used to distinguish between old Activity pattern and new dependency pattern.
     *
     * @param {*} obj - Object to check
     * @returns {boolean} True if obj is a LogoDependencies instance
     */
    static isLogoDependencies(obj) {
        return obj instanceof LogoDependencies;
    }
}

// Export for RequireJS/AMD
if (typeof define === "function" && define.amd) {
    define([], function () {
        return LogoDependencies;
    });
}

// Export for Node.js/CommonJS (for testing)
if (typeof module !== "undefined" && module.exports) {
    module.exports = LogoDependencies;
}
