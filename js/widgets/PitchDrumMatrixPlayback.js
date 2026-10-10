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

   platformColor, _, PitchDrumMatrix
*/
/*
    Globals location
    - js/utils/platformstyle.js
        platformColor
    - js/utils/utils.js
        _
    - js/widgets/pitchdrummatrix.js
        PitchDrumMatrix
*/

/* exported PitchDrumMatrixPlayback */

/**
 * @file PitchDrumMatrixPlayback.js
 * @description Pitch-Drum Matrix playback: playing each row with its drum in turn, the play/stop icon,
 * the row highlights, and clearing the grid.
 *
 * The methods are moved as they were from the PitchDrumMatrix class, which copies them onto
 * PitchDrumMatrix.prototype (see PitchDrumMatrix.installModules), so `this` is still the widget.
 */
class PitchDrumMatrixPlayback {
    /**
     * Updates the play button icon to show "Play" or "Stop".
     *
     * @private
     * @param {"play"|"stop"} state - Which icon to show.
     * @returns {void}
     */
    _setPlayButtonIcon(state) {
        const icon = this.playButton;
        const isStop = state === "stop";
        const src = isStop ? "header-icons/stop-button.svg" : "header-icons/play-button.svg";
        const label = isStop ? _("Stop") : _("Play");

        icon.textContent = "\u00A0\u00A0";
        const img = document.createElement("img");
        img.src = src;
        img.title = label;
        img.alt = label;
        img.setAttribute("height", PitchDrumMatrix.ICONSIZE);
        img.setAttribute("width", PitchDrumMatrix.ICONSIZE);
        img.style.verticalAlign = "middle";
        icon.appendChild(img);
        icon.appendChild(document.createTextNode("\u00A0\u00A0"));
    }

    /**
     * Handles playing all pitch/drum combinations in the matrix.
     *
     * @private
     * @returns {void}
     */
    _playAll() {
        // Play all of the pitch/drum combinations in the matrix.
        this._playRun += 1;
        if (this._playing) {
            this._setPlayButtonIcon("stop");
        } else {
            this._setPlayButtonIcon("play");
            this._resetRowHighlights();
            this.activity.logo.synth.stop();
            return;
        }
        this.activity.logo.synth.stop();

        const pairs = [];

        // For each row (pitch), look for a drum.
        const pdmTable = this._pdmTable;
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = this._pdmCellTables[i];
            row = table.rows[0];
            let j;
            for (j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    pairs.push([i, j]);
                    break;
                }
            }

            if (j === row.cells.length) {
                pairs.push([i, -1]);
            }
        }
        let isEmpty = true;
        for (let i = 0; i < pairs.length; i++) {
            if (pairs[i][1] !== -1) {
                isEmpty = false;
                break;
            }
        }
        if (!isEmpty) {
            const run = this._playRun;
            this._playPitchDrum(0, pairs, run);
            this.widgetWindow.timerManager.setTimeout(() => {
                if (!this._playing || run !== this._playRun) {
                    return;
                }
                this._playing = false;
                this._setPlayButtonIcon("play");
                this._resetRowHighlights();
            }, pairs.length * 1000);
        } else {
            if (!this.widgetWindow._maximized) {
                this.activity.textMsg(_("Click in the grid to map notes to drums."), 3000);
            }
            this._playing = false;
            this._setPlayButtonIcon("play");
        }
    }

    /**
     * Puts every pitch label back to its normal color after playback.
     *
     * @private
     * @returns {void}
     */
    _resetRowHighlights() {
        const pdmTable = this._pdmTable;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            pdmTable.rows[i].cells[0].style.backgroundColor = platformColor.labelColor;
        }
    }

    /**
     * Plays the pitch and drum combination at the given index in the pairs array recursively.
     *
     * @private
     * @param {number} i - The index indicating which pair of pitch and drum to play.
     * @param {Array<Array<number>>} pairs - An array containing pairs of pitch and drum indices.
     * @param {number} run - The playback run this call belongs to.
     * @returns {void}
     */
    _playPitchDrum(i, pairs, run) {
        if (!this._playing || run !== this._playRun) {
            return;
        }

        // Highlight only the pitch being played.
        this._resetRowHighlights();
        this._pdmTable.rows[i].cells[0].style.backgroundColor = platformColor.selectorBackground;

        if (pairs[i][1] !== -1) {
            const cell = this._pdmCellTables[i].rows[0].cells[pairs[i][1]];
            this._setPairCell(pairs[i][0], pairs[i][1], cell, true, run);
        }

        if (i < pairs.length - 1) {
            this.widgetWindow.timerManager.setTimeout(() => {
                this._playPitchDrum(i + 1, pairs, run);
            }, 1000);
        }
    }

    /**
     * Clears all the selections in the matrix.
     *
     * @private
     * @returns {void}
     */
    _clear() {
        // Stop any playback so the cleared mapping doesn't keep sounding.
        if (this._playing) {
            this._playing = false;
            this._playAll();
        }

        // "Unclick" every entry in the matrix.
        const pdmTable = this._pdmTable;
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = this._pdmCellTables[i];
            row = table.rows[0];
            for (let j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    cell.style.backgroundColor = platformColor.selectorBackground;
                    this._setCellPitchDrum(j, i, false);
                }
            }
        }
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchDrumMatrixPlayback;
}
