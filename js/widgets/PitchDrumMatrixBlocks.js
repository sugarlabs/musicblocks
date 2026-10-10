/**
 * MusicBlocks
 *
 * @copyright 2016-21 Walter Bender
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

/* exported PitchDrumMatrixBlocks */

/**
 * @file PitchDrumMatrixBlocks.js
 * @description Pitch-Drum Matrix blocks: the pitch block of each row, the drum block of each column,
 * and the block map of the pitch/drum pairs that are selected, which is kept between runs.
 *
 * The methods are moved as they were from the PitchDrumMatrix class, which copies them onto
 * PitchDrumMatrix.prototype (see PitchDrumMatrix.installModules), so `this` is still the widget.
 */
class PitchDrumMatrixBlocks {
    /**
     * Clears the row and column block arrays.
     *
     * @public
     * @returns {void}
     */
    clearBlocks() {
        this._rowBlocks = [];
        this._colBlocks = [];
    }

    /**
     * Adds a pitch block to the row block array.
     *
     * @public
     * @param {number} pitchBlock - The pitch block to add.
     * @returns {void}
     */
    addRowBlock(pitchBlock) {
        this._rowBlocks.push(pitchBlock);
    }

    /**
     * Adds a drum block to the column block array.
     *
     * @public
     * @param {number} drumBlock - The drum block to add.
     * @returns {void}
     */
    addColBlock(drumBlock) {
        this._colBlocks.push(drumBlock);
    }

    /**
     * Adds a node (intersection) to the block map.
     *
     * @public
     * @param {number} pitchBlock - The pitch block index.
     * @param {number} drumBlock - The drum block index.
     * @returns {void}
     */
    addNode(pitchBlock, drumBlock) {
        let obj;
        for (let i = 0; i < this._blockMap.length; i++) {
            obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === drumBlock) {
                return; // node is already in the list
            }
        }
        this._blockMap.push([pitchBlock, drumBlock]);
    }

    /**
     * Removes a node (intersection) from the block map.
     *
     * @public
     * @param {number} pitchBlock - The pitch block index.
     * @param {number} drumBlock - The drum block index.
     * @returns {void}
     */
    removeNode(pitchBlock, drumBlock) {
        let obj;
        for (let i = this._blockMap.length - 1; i >= 0; i--) {
            obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === drumBlock) {
                this._blockMap.splice(i, 1);
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchDrumMatrixBlocks;
}
