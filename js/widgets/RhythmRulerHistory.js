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

   deepClone, last
*/
/*
    Globals location
    - js/utils/utils.js
        deepClone, last
*/

/* exported RhythmRulerHistory */

/**
 * @file RhythmRulerHistory.js
 * @description Rhythm Maker dissect history: restoring each ruler's divisions when the widget
 * reopens, and saving them after an edit.
 *
 * The methods are moved as they were from the RhythmRuler class, which copies them onto
 * RhythmRuler.prototype (see RhythmRuler.installModules), so `this` is still the widget.
 */
class RhythmRulerHistory {
    /**
     * Replays the saved dissect history onto the freshly built ruler cells
     * (rests, dissects, divisions and ties), so a widget rebuilt by init()
     * restores the edits made in a previous session.
     * @private
     * @returns {void}
     */
    _restoreDissectHistory() {
        let cell;
        for (let drum = 0; drum < this.Drums.length; drum++) {
            if (drum === null) {
                continue;
            }

            for (let i = 0; i < this._dissectHistory.length; i++) {
                if (this._dissectHistory[i][1] !== this.Drums[drum]) {
                    continue;
                }

                const rhythmRulerTableRow = this._rulers[drum];
                for (let j = 0; j < this._dissectHistory[i][0].length; j++) {
                    if (this._dissectHistory[i][0][j] === undefined) {
                        continue;
                    }

                    this._rulerSelected = drum;

                    if (typeof this._dissectHistory[i][0][j] === "number") {
                        cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j]];
                        this.__toggleRestState(cell, false);
                    } else if (typeof this._dissectHistory[i][0][j][0] === "number") {
                        if (typeof this._dissectHistory[i][0][j][1] === "number") {
                            // dissect is [cell, num]
                            cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j][0]];
                            if (cell !== undefined) {
                                this.__dissectByNumber(
                                    cell,
                                    this._dissectHistory[i][0][j][1],
                                    false
                                );
                            } else {
                                // console.warn(
                                //     "Could not find cell to divide. Did the order of the rhythm blocks change?"
                                // );
                            }
                        } else {
                            // divide is [cell, [values]]
                            cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j][0]];
                            if (cell !== undefined) {
                                this.__divideFromList(
                                    cell,
                                    this._dissectHistory[i][0][j][1],
                                    false
                                );
                            }
                        }
                    } else {
                        // tie is [[cell, value], [cell, value]...]
                        const history = this._dissectHistory[i][0][j];
                        this._mouseDownCell = rhythmRulerTableRow.cells[history[0][0]];
                        this._mouseUpCell = rhythmRulerTableRow.cells[last(history)[0]];
                        if (this._mouseUpCell !== undefined) {
                            this.__tie(false);
                        }

                        this._mouseDownCell = null;
                        this._mouseUpCell = null;
                    }
                }
            }
        }
    }

    /**
     * Gets the save lock status.
     * @private
     * @returns {boolean} The current status of the save lock.
     */
    _get_save_lock() {
        return this._save_lock;
    }

    /**
     * Saves the dissect history.
     * @public
     * @returns {void}
     */
    saveDissectHistory() {
        // Save the new dissect history.

        const dissectHistory = [];
        const drums = [];
        let drum;
        let history;
        for (let i = 0; i < this.Rulers.length; i++) {
            if (this.Drums[i] === null) {
                continue;
            }

            history = [];
            for (let j = 0; j < this.Rulers[i][1].length; j++) {
                history.push(this.Rulers[i][1][j]);
            }

            this._dissectNumber.classList.add("hasKeyboard");
            dissectHistory.push([history, this.Drums[i]]);
            drums.push(this.Drums[i]);
        }

        // Look for any old entries that we may have missed.
        // Use Set for O(1) lookup instead of Array.includes() O(n)
        const drumsSet = new Set(drums);
        for (let i = 0; i < this._dissectHistory.length; i++) {
            drum = this._dissectHistory[i][1];
            if (!drumsSet.has(drum)) {
                history = deepClone(this._dissectHistory[i][0]);
                dissectHistory.push([history, drum]);
            }
        }

        this._dissectHistory = deepClone(dissectHistory);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = RhythmRulerHistory;
}
