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

/*
   global

   getNote, getDrumSynthName, SOLFEGECONVERSIONTABLE
*/
/*
    Globals location
    - js/utils/musicutils.js
        getNote, getDrumSynthName, SOLFEGECONVERSIONTABLE
*/

/* exported PitchDrumMatrixSave */

/**
 * @file PitchDrumMatrixSave.js
 * @description Pitch-Drum Matrix saving: turning the selected pairs into an action stack with a map
 * pitch to drum block for each pair.
 *
 * The methods are moved as they were from the PitchDrumMatrix class, which copies them onto
 * PitchDrumMatrix.prototype (see PitchDrumMatrix.installModules), so `this` is still the widget.
 */
class PitchDrumMatrixSave {
    /**
     * Returns the save lock element.
     *
     * @private
     * @returns {HTMLElement} - The save lock element.
     */
    _get_save_lock() {
        return this._save_lock;
    }

    /**
     * Saves the current matrix as an action stack consisting of a set drum and pitch blocks.
     *
     * @private
     * @returns {void}
     */
    _save() {
        // Saves the current matrix as an action stack consisting of a
        // set drum and pitch blocks.

        // First, hide the palettes as they will need updating.
        for (const name in this.activity.blocks.palettes.dict) {
            this.activity.blocks.palettes.dict[name].hideMenu(true);
        }
        this.activity.refreshCanvas();

        const pairs = [];
        const pdmTable = this._pdmTable;
        const drumTable = this._pdmDrumTable;

        // For each row (pitch), look for a drum.
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = this._pdmCellTables[i];
            row = table.rows[0];
            for (let j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    pairs.push([i, j]);
                    continue;
                }
            }
        }

        if (pairs.length === 0) {
            return;
        }

        const newStack = [
            [0, ["action", { collapsed: true }], 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "drums" }], 0, 0, [0]]
        ];
        // const endOfStackIdx = 0;
        let previousBlock = 0;

        let col;
        let cellRow;
        let solfegeHTML;
        let drumRow;
        let drumHTML;
        let drumName;
        let noteObj;
        let pitch;
        let octave;
        let mapdrumidx;
        let drumnameidx;
        let pitchidx;
        let notenameidx;
        let octaveidx;
        let hiddenidx;
        for (let i = 0; i < pairs.length; i++) {
            row = pairs[i][0];
            col = pairs[i][1];

            cellRow = pdmTable.rows[row];
            const noteArg = cellRow.cells[0].dataset.noteArg;
            octave = parseInt(cellRow.cells[0].dataset.octave, 10);

            drumRow = drumTable.rows[0];
            const drumImg = drumRow.cells[col].querySelector("img");
            drumName = getDrumSynthName(drumImg ? drumImg.title : "");

            noteObj = getNote(
                noteArg,
                octave,
                0,
                this.activity.turtles.ithTurtle(0).singer.keySignature,
                false,
                null,
                this.activity.errorMsg
            );
            pitch = noteObj[0];
            octave = noteObj[1];

            // Add the set drum block and its value
            mapdrumidx = newStack.length;
            drumnameidx = mapdrumidx + 1;
            pitchidx = mapdrumidx + 2;
            notenameidx = mapdrumidx + 3;
            octaveidx = mapdrumidx + 4;
            hiddenidx = mapdrumidx + 5;

            newStack.push([
                mapdrumidx,
                "mapdrum",
                0,
                0,
                [previousBlock, drumnameidx, pitchidx, hiddenidx]
            ]);
            newStack.push([drumnameidx, ["drumname", { value: drumName }], 0, 0, [mapdrumidx]]);
            newStack.push([pitchidx, "pitch", 0, 0, [mapdrumidx, notenameidx, octaveidx, null]]);
            newStack.push([
                notenameidx,
                ["solfege", { value: SOLFEGECONVERSIONTABLE[pitch] }],
                0,
                0,
                [pitchidx]
            ]);
            newStack.push([octaveidx, ["number", { value: octave }], 0, 0, [pitchidx]]);

            if (i === pairs.length - 1) {
                newStack.push([hiddenidx, "hidden", 0, 0, [mapdrumidx, null]]);
            } else {
                newStack.push([hiddenidx, "hidden", 0, 0, [mapdrumidx, hiddenidx + 1]]);
            }

            previousBlock = hiddenidx;
        }

        // Create a new stack for the chunk.
        // console.debug(newStack);
        this.activity.blocks.loadNewBlocks(newStack);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchDrumMatrixSave;
}
