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

   platformColor, getNote, getDrumSynthName, Singer, normalizeNoteAccidentals
*/
/*
    Globals location
    - js/utils/platformstyle.js
        platformColor
    - js/utils/musicutils.js
        getNote, getDrumSynthName, normalizeNoteAccidentals
    - js/turtle-singer.js
        Singer
*/

/* exported PitchDrumMatrixCells */

/**
 * @file PitchDrumMatrixCells.js
 * @description Pitch-Drum Matrix cells: clicking a cell to map a pitch to a drum (one drum for each
 * pitch), marking the pairs from an earlier run, and sounding a pair.
 *
 * The methods are moved as they were from the PitchDrumMatrix class, which copies them onto
 * PitchDrumMatrix.prototype (see PitchDrumMatrix.installModules), so `this` is still the widget.
 */
class PitchDrumMatrixCells {
    /**
     * Makes the matrix clickable, enabling user interaction.
     *
     * @public
     * @returns {void}
     */
    makeClickable() {
        const pdmTable = this._pdmTable;
        const drumTable = this._pdmDrumTable;
        let table;
        let cellRow;
        let drumRow;
        let drumCell;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = this._pdmCellTables[i];
            cellRow = table.rows[0];

            for (let j = 0; j < cellRow.cells.length; j++) {
                cell = cellRow.cells[j];

                drumRow = drumTable.rows[0];

                drumCell = drumRow.cells[j];

                cell.onclick = e => {
                    const currCell = e.target;
                    const rowcol = currCell.id.split(",");
                    if (currCell.style.backgroundColor === "black") {
                        currCell.style.backgroundColor = platformColor.selectorBackground;
                        this._setCellPitchDrum(rowcol[1], rowcol[0], false);
                    } else {
                        currCell.style.backgroundColor = "black";
                        this._setCellPitchDrum(rowcol[1], rowcol[0], true);
                    }
                };
            }
        }

        // Mark any cells found in the blockMap from previous
        // instances of the matrix.
        let obj;
        let row;
        let col;
        for (let i = 0; i < this._blockMap.length; i++) {
            obj = this._blockMap[i];
            if (obj[0] !== -1) {
                // Look for this note in the pitch and drum blocks.
                row = this._rowBlocks.indexOf(obj[0]);
                col = -1;
                for (let j = 0; j < this._colBlocks.length; j++) {
                    if (this._colBlocks[j] === obj[1]) {
                        col = j;
                        break;
                    }
                }

                if (row === -1 || col === -1) {
                    continue;
                }

                // If we found a match, mark this cell and add this
                // note to the play list.
                table = this._pdmCellTables[row];
                cellRow = table.rows[0];

                cell = cellRow.cells[col];

                if (cell !== undefined) {
                    cell.style.backgroundColor = "black";
                    this._setPairCell(row, col, cell, false);
                }
            }
        }
    }

    /**
     * Sets the pitch and drum combination for a specific cell in the matrix and plays the combination if specified.
     *
     * @private
     * @param {number} colIndex - The column index of the cell.
     * @param {number} rowIndex - The row index of the cell.
     * @param {number} playNote - A flag indicating whether to play the note or not.
     * @returns {void}
     */
    _setCellPitchDrum(colIndex, rowIndex, playNote) {
        // Sets corresponding pitch/drum when user clicks on any cell and
        // plays them.
        const coli = Number(colIndex);
        const rowi = Number(rowIndex);

        // Find the drum cell
        const drumTable = this._pdmDrumTable;
        let row = drumTable.rows[0];
        let table = this._pdmCellTables[rowi];
        row = table.rows[0];

        // For the moment, we can only have one drum per pitch, so
        // clear the row.
        let pitchBlock;
        let drumBlock;
        let cell;
        if (playNote) {
            for (let i = 0; i < row.cells.length; i++) {
                if (i === coli) {
                    continue;
                }

                cell = row.cells[i];
                if (cell.style.backgroundColor === "black") {
                    pitchBlock = this._rowBlocks[rowi];
                    drumBlock = this._colBlocks[i];
                    this.removeNode(pitchBlock, drumBlock);
                    cell.style.backgroundColor = platformColor.selectorBackground;
                }
            }
        }

        pitchBlock = this._rowBlocks[rowi];
        drumBlock = this._colBlocks[coli];

        if (playNote) {
            this.addNode(pitchBlock, drumBlock);
        } else {
            this.removeNode(pitchBlock, drumBlock);
        }

        table = this._pdmCellTables[rowi];
        row = table.rows[0];
        for (let i = 0; i < row.cells.length; i++) {
            cell = row.cells[i];
            if (cell.style.backgroundColor === "black") {
                this._setPairCell(rowi, i, cell, playNote);
            }
        }
    }

    /**
     * Sets the pair of pitch and drum for a specific cell in the matrix and plays the combination if specified.
     *
     * @private
     * @param {number} rowIndex - The row index of the cell.
     * @param {number} colIndex - The column index of the cell.
     * @param {HTMLElement} cell - The HTML element representing the matrix cell.
     * @param {boolean} playNote - A flag indicating whether to play the note or not.
     * @param {number|null} [run] - The playback run when called from playback, so a stopped
     *     run doesn't play its delayed drum. Omitted for clicks in the grid.
     * @returns {void}
     */
    _setPairCell(rowIndex, colIndex, cell, playNote, run = null) {
        const pdmTable = this._pdmTable;
        let row = pdmTable.rows[rowIndex];
        const noteArg = row.cells[0].dataset.noteArg;
        const octave = parseInt(row.cells[0].dataset.octave, 10);

        const drumTable = this._pdmDrumTable;
        row = drumTable.rows[0];
        const drumImg = row.cells[colIndex].querySelector("img");
        const drumName = getDrumSynthName(drumImg ? drumImg.title : "");

        const noteObj = getNote(
            noteArg,
            octave,
            0,
            this.activity.turtles.ithTurtle(0).singer.keySignature,
            false,
            null,
            this.activity.errorMsg
        );
        const note = noteObj[0] + noteObj[1];

        if (playNote) {
            const waitTime = Singer.defaultBPMFactor * 1000 * 0.25;
            this.activity.logo.synth.trigger(
                0,
                normalizeNoteAccidentals(note),
                0.125,
                "default",
                null,
                null
            );

            this.widgetWindow.timerManager.setTimeout(() => {
                if (run !== null && (!this._playing || run !== this._playRun)) {
                    return;
                }
                this.activity.logo.synth.trigger(0, "C2", 0.125, drumName, null, null);
            }, waitTime);
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchDrumMatrixCells;
}
