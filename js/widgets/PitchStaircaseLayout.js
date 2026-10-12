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

   _, SYNTHSVG, base64Encode, clampNumber, PitchStaircase
*/
/*
    Globals location
    - js/utils/utils.js
        _
    - js/base64Utils.js
        base64Encode
    - js/utils/utils-logic.js
        clampNumber
    - js/utils/musicutils-constants.js
        SYNTHSVG
    - js/widgets/pitchstaircase.js
        PitchStaircase
*/

/* exported PitchStaircaseLayout */

/**
 * @file PitchStaircaseLayout.js
 * @description Pitch Staircase layout: the play and step buttons, and building the table of
 * stairs, one row per stair with its play button and a step drawn to scale.
 *
 * The methods are moved as they were from the PitchStaircase class, which copies them onto
 * PitchStaircase.prototype (see PitchStaircase.installModules), so `this` is still the widget.
 */
class PitchStaircaseLayout {
    /**
     * Adds a button cell with an icon to a table row.
     * @private
     * @param {HTMLTableRowElement} row - The row to add the cell to.
     * @param {string} icon - The icon file in header-icons/.
     * @param {number} iconSize - The icon size in pixels.
     * @param {string} label - The button's title and alt text.
     * @returns {HTMLTableCellElement} The new cell.
     */
    _addButton(row, icon, iconSize, label) {
        const cell = row.insertCell(-1);
        cell.replaceChildren(
            document.createTextNode("\u00a0\u00a0"),
            (() => {
                const img = document.createElement("img");
                img.src = "header-icons/" + icon;
                img.title = label;
                img.alt = label;
                img.height = iconSize;
                img.width = iconSize;
                img.style.verticalAlign = "middle";
                img.style.alignContent = "center";
                return img;
            })(),
            document.createTextNode("\u00a0\u00a0")
        );
        cell.style.width = PitchStaircase.BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.classList.add("pitch-staircase-btn");

        return cell;
    }

    /**
     * Replaces the icon of a button.
     * @private
     * @param {HTMLElement} cell - The button.
     * @param {string} icon - The icon file in header-icons/.
     * @param {string} label - The button's title and alt text.
     * @returns {void}
     */
    _setButtonIcon(cell, icon, label) {
        if (!cell || typeof cell.replaceChildren !== "function") {
            return;
        }
        const img = document.createElement("img");
        img.src = "header-icons/" + icon;
        img.title = label;
        img.alt = label;
        img.height = PitchStaircase.ICONSIZE;
        img.width = PitchStaircase.ICONSIZE;
        img.style.verticalAlign = "middle";
        img.style.alignContent = "center";

        if (cell.classList.contains("pitch-staircase-btn")) {
            cell.replaceChildren(
                document.createTextNode("\u00a0\u00a0"),
                img,
                document.createTextNode("\u00a0\u00a0")
            );
        } else {
            cell.replaceChildren(img);
        }
    }

    /**
     * Rebuilds the table of stairs from this.Stairs.
     * @private
     * @returns {void}
     */
    _makeStairs() {
        /**
         * Each row in the psc table contains separate table; each table contains a note label in
         * the first column and a table of buttons in the second column.
         */
        const pscTable = this._pscTable;
        // The rows are about to be replaced, so stop the stair that is playing; otherwise the new
        // play button would take its first click as Stop.
        if (this._playingRowIndex !== null) {
            this._stopRow();
        }
        pscTable.replaceChildren();
        pscTable.style.textAlign = "center";

        for (let i = 0; i < this.Stairs.length; i++) {
            const pscTableRow = pscTable.insertRow();
            const pscTableCell = pscTableRow.insertCell();
            const stepTable = document.createElement("table");
            this._stepTables[i] = stepTable;
            pscTableCell.append(stepTable);

            const stepTableRow = stepTable.insertRow();

            const frequency = this.Stairs[i][2];

            // The play button for this row.
            const playCell = this._addButton(
                stepTableRow,
                "play-button.svg",
                PitchStaircase.ICONSIZE,
                _("Play")
            );
            playCell.className = "headcol"; // This cell is fixed horizontally.
            playCell.setAttribute("id", i);
            playCell.style.cursor = "pointer";
            const stepCell = stepTableRow.insertCell();
            stepCell.setAttribute("id", frequency);
            const safeFreq =
                typeof frequency === "number" && Number.isFinite(frequency) && frequency > 0
                    ? frequency
                    : PitchStaircase.DEFAULTFREQUENCY;
            const rawWidth =
                (PitchStaircase.INNERWINDOWWIDTH *
                    (PitchStaircase.DEFAULTFREQUENCY / safeFreq) *
                    this._cellScale) /
                3;
            const calculatedWidth = clampNumber(rawWidth, 20, PitchStaircase.INNERWINDOWWIDTH);
            stepCell.style.width = calculatedWidth + "px";
            stepCell.replaceChildren(
                document.createTextNode(frequency.toFixed(2)),
                document.createElement("br"),
                document.createTextNode(this.Stairs[i][0] + this.Stairs[i][1])
            );
            stepCell.style.minWidth = stepCell.style.width;
            stepCell.style.maxWidth = stepCell.style.width;
            stepCell.style.height = PitchStaircase.BUTTONSIZE + "px";
            stepCell.classList.add("pitch-staircase-step");

            const cellWidth = Number(stepCell.style.width.replace(/px/, ""));
            const svgWidth = cellWidth.toString();
            const svgScale = (cellWidth / 55).toString();
            const svgStrokeWidth = ((3 * 55) / cellWidth).toString();
            const svgData =
                "data:image/svg+xml;base64," +
                window.btoa(
                    base64Encode(
                        SYNTHSVG.replace(/SVGWIDTH/g, svgWidth)
                            .replace(/XSCALE/g, svgScale)
                            .replace(/STOKEWIDTH/g, svgStrokeWidth)
                    )
                );
            stepCell.style.backgroundImage = "url(" + svgData + ")";
            stepCell.style.backgroundRepeat = "no-repeat";
            stepCell.style.backgroundPosition = "center center";

            stepCell.addEventListener("click", event => {
                this._dissectStair(event);
            });

            playCell.onclick = () => {
                const i = Number(playCell.getAttribute("id"));
                if (this._playingRowIndex === i) {
                    this._stopRow();
                } else {
                    const stepCell = this._stepTables[i].rows[0].cells[1];
                    this._playOne(stepCell, playCell);
                }
            };
        }
    }

    /**
     * Rebuilds the table of stairs.
     * @private
     * @returns {void}
     */
    _refresh() {
        this._makeStairs(true);
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchStaircaseLayout;
}
