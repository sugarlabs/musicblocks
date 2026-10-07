/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
 * @copyright 2016 Hemant Kasat
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

/*
   global
   _
 */

/* exported TempoSave */

/**
 * @file TempoSave.js
 * @description Tempo widget save: making a beats per minute block for each row's tempo, and the
 * lock that debounces the Save tempo button.
 *
 * The methods are moved as they were from the Tempo class, which copies them onto
 * Tempo.prototype (see Tempo.installModules), so `this` is still the widget.
 */
class TempoSave {
    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    __save(i) {
        const callback = () => {
            const delta = i * 42;
            const newStack = [
                [0, ["setbpm3", {}], 100 + delta, 100 + delta, [null, 1, 2, 5]],
                [1, ["number", { value: this.BPMs[i] }], 0, 0, [0]],
                [2, ["divide", {}], 0, 0, [0, 3, 4]],
                [3, ["number", { value: 1 }], 0, 0, [2]],
                [4, ["number", { value: 4 }], 0, 0, [2]],
                [5, ["vspace", {}], 0, 0, [0, null]]
            ];
            this.activity.blocks.loadNewBlocks(newStack);
            this.activity.textMsg(_("New action block generated."), 3000);
        };

        if (this.widgetWindow && this.widgetWindow.timerManager) {
            this.widgetWindow.timerManager.setTimeout(callback, 200 * i);
        } else {
            setTimeout(callback, 200 * i);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _saveTempo() {
        // Save a BPM block for each tempo.
        for (let i = 0; i < this.BPMs.length; i++) {
            this.__save(i);
        }
    }

    /**
     * @private
     * @returns {HTMLElement}
     */
    _get_save_lock() {
        return this._save_lock;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = TempoSave;
}
