/**
 * MusicBlocks
 *
 * @copyright 2019-21 Walter Bender
 * @copyright 2026 Music Blocks contributors
 *
 * @license
 * This program is free software; you can redistribute it and/or modify it under the terms of the
 * The GNU Affero General Public License as published by the Free Software Foundation; either
 * version 3 of the License, or (at your option) any later version.
 *
 * You should have received a copy of the GNU Affero General Public License along with this
 * library; if not, write to the Free Software Foundation, 51 Franklin Street, Suite 500 Boston,
 * MA 02110-1335 USA.
 */

/* exported MeterWidgetSave */

/**
 * @file MeterWidgetSave.js
 * @description Meter widget save: an on strong beat do block for each strong beat.
 *
 * The methods are moved from the MeterWidget class, which copies them onto
 * MeterWidget.prototype (see MeterWidget.installModules), so `this` is still the widget.
 */
class MeterWidgetSave {
    /**
     * Private method to save the widget state.
     *
     * @private
     * @returns {void}
     */
    _save() {
        // Export onbeatdo blocks for each strong beat
        const strongBeats = [];
        const newStack = [];

        const numberOfBeats = this._strongBeats.length;

        for (let i = 0; i < numberOfBeats; i++) {
            if (this._strongBeats[i]) {
                strongBeats.push(i);
            }
        }

        let n = 0;

        for (let i = 0; i < strongBeats.length; i++) {
            if (i === 0) {
                if (strongBeats.length === 1) {
                    newStack.push([0, "onbeatdo", 100, 100, [null, 1, 2, null]]);
                    newStack.push([1, ["number", { value: strongBeats[i] + 1 }], 0, 0, [0]]);
                    newStack.push([2, ["text", { value: "action" }], 0, 0, [0]]);
                } else {
                    newStack.push([0, "onbeatdo", 100, 100, [null, 1, 2, 3]]);
                    newStack.push([1, ["number", { value: strongBeats[i] + 1 }], 0, 0, [0]]);
                    newStack.push([2, ["text", { value: "action" }], 0, 0, [0]]);
                }
            } else if (i === strongBeats.length - 1) {
                newStack.push([n, "onbeatdo", 0, 0, [n - 3, n + 1, n + 2, null]]);
                newStack.push([n + 1, ["number", { value: strongBeats[i] + 1 }], 0, 0, [n]]);
                newStack.push([n + 2, ["text", { value: "action" }], 0, 0, [n]]);
            } else {
                newStack.push([n, "onbeatdo", 0, 0, [n - 3, n + 1, n + 2, n + 3]]);
                newStack.push([n + 1, ["number", { value: strongBeats[i] + 1 }], 0, 0, [n]]);
                newStack.push([n + 2, ["text", { value: "action" }], 0, 0, [n]]);
            }
            n += 3;
        }

        this.activity.blocks.loadNewBlocks(newStack);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = MeterWidgetSave;
}
