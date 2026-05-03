/*
 * Copyright (c) 2024 Walter Bender
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the The GNU Affero General Public
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 */

/* global ActivityContext, _, docById, NOMICERRORMSG, NANERRORMSG, NOSTRINGERRORMSG, NOBOXERRORMSG,
   NOACTIONERRORMSG, NOINPUTERRORMSG, NOSQRTERRORMSG, ZERODIVIDEERRORMSG, EMPTYHEAPERRORMSG */

/**
 * ErrorSuggestionsWidget provide friendly diagnostics and fix-it suggestions
 * for Music Blocks errors.
 * @class
 */
function ErrorSuggestionsWidget() {
    this.init = function (activity) {
        this.activity = activity;
        this._setupFriendlyMessages();
        this._setupExamples();
        this._addStyles();
    };

    this._setupFriendlyMessages = function () {
        this.friendlyMessages = {};
        this.friendlyMessages[NOINPUTERRORMSG] = _(
            "The %1 block needs an input. Try connecting a value block to its empty socket."
        );
        this.friendlyMessages[NOSQRTERRORMSG] = _(
            "Cannot take the square root of a negative number. Try using a positive value."
        );
        this.friendlyMessages[ZERODIVIDEERRORMSG] = _(
            "Cannot divide by zero. Try using a non-zero number for the divisor."
        );
        this.friendlyMessages[EMPTYHEAPERRORMSG] = _(
            "This block is empty. Add some blocks inside it to make it work!"
        );
        this.friendlyMessages[NANERRORMSG] = _(
            "That doesn't look like a number. The %1 block expects a numerical value."
        );
        this.friendlyMessages[NOSTRINGERRORMSG] = _(
            "This block expects text (a string), but got something else."
        );
        this.friendlyMessages[NOBOXERRORMSG] = _(
            "I couldn't find a box named '%1'. Check your variable names!"
        );
        this.friendlyMessages[NOACTIONERRORMSG] = _(
            "I couldn't find an action named '%1'. Make sure you've defined it."
        );
    };

    this._setupExamples = function () {
        this.examples = {};

        // Example for Missing Input (NOINPUTERRORMSG)
        // A Note block connected to a 1/4 note value
        this.examples[NOINPUTERRORMSG] = [
            [0, "newnote", 100, 100, [null, 1, null, null], null, null],
            [1, "number", 150, 100, [0, null], 0.25, null]
        ];

        // Example for Square Root of Negative (NOSQRTERRORMSG)
        // A sqrt block with a positive 9
        this.examples[NOSQRTERRORMSG] = [
            [0, "sqrt", 100, 100, [null, 1], null, null],
            [1, "number", 150, 100, [0, null], 9, null]
        ];

        // Example for Zero Divide (ZERODIVIDEERRORMSG)
        // A division block 10 / 2
        this.examples[ZERODIVIDEERRORMSG] = [
            [0, "divide", 100, 100, [null, 1, 2], null, null],
            [1, "number", 150, 100, [0, null], 10, null],
            [2, "number", 150, 130, [0, null], 2, null]
        ];
    };

    /**
     * Get a beginner-friendly diagnostic message.
     * @param {string} msg - Technical error message.
     * @param {number} blk - Block index.
     * @param {string} text - Extra context text.
     * @returns {string} - Friendly message.
     */
    this.getFriendlyMessage = function (msg, blk, text) {
        let friendly = this.friendlyMessages[msg] || msg;

        // Replace placeholders with context
        if (friendly.includes("%1")) {
            let context = text || "";
            if (blk !== null && blk !== undefined && this.activity.blocks.blockList[blk]) {
                context = _(this.activity.blocks.blockList[blk].name);
            }
            friendly = friendly.replace("%1", context);
        }

        return friendly;
    };

    /**
     * Check if an example exists for this error.
     * @param {string} msg - Technical error message.
     * @returns {boolean}
     */
    this.hasExample = function (msg) {
        return !!this.examples[msg];
    };

    /**
     * Load the minimal working example for the error.
     * @param {string} msg - Technical error message.
     */
    this.showExample = function (msg) {
        const exampleData = this.examples[msg];
        if (!exampleData) return;

        // Find a clear spot on the workspace (viewport center)
        const scaleX = this.activity.blocksContainer.scaleX || 1;
        const scaleY = this.activity.blocksContainer.scaleY || 1;
        const offsetX = (this.activity.canvas.width / 2 - this.activity.blocksContainer.x) / scaleX;
        const offsetY =
            (this.activity.canvas.height / 2 - this.activity.blocksContainer.y) / scaleY;

        const positionedData = exampleData.map(blk => {
            const newBlk = [...blk];
            newBlk[2] += offsetX - 100;
            newBlk[3] += offsetY - 100;
            return newBlk;
        });

        this.activity.blocks.loadNewBlocks(positionedData);
        this.activity.errorMsg(
            _("Here's an example of how to use this block correctly!"),
            null,
            null,
            5000
        );
    };

    this._addStyles = function () {
        const style = document.createElement("style");
        style.textContent = `
            .error-suggestion-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid white;
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
                margin-top: 8px;
                transition: background 0.2s;
                display: inline-block;
            }
            .error-suggestion-btn:hover {
                background: rgba(255, 255, 255, 0.4);
            }
            @keyframes pulse-error {
                0% { box-shadow: 0 0 0 0 rgba(255, 0, 49, 0.7); }
                70% { box-shadow: 0 0 0 20px rgba(255, 0, 49, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 0, 49, 0); }
            }
            .pulse-block {
                animation: pulse-error 2s infinite;
            }
        `;
        document.head.appendChild(style);
    };
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = { ErrorSuggestionsWidget };
}
