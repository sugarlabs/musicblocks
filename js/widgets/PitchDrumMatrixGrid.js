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

   platformColor, _, getDrumName, getDrumIcon, MATRIXSOLFEHEIGHT, MATRIXSOLFEWIDTH,
   PitchDrumMatrix
*/
/*
    Globals location
    - js/utils/platformstyle.js
        platformColor
    - js/utils/utils.js
        _
    - js/utils/musicutils.js
        getDrumName, getDrumIcon, MATRIXSOLFEHEIGHT, MATRIXSOLFEWIDTH
    - js/widgets/pitchdrummatrix.js
        PitchDrumMatrix
*/

/* exported PitchDrumMatrixGrid */

/**
 * @file PitchDrumMatrixGrid.js
 * @description Pitch-Drum Matrix grid: a row for each pitch, the drum names along the bottom and a
 * column of cells for each drum.
 *
 * The methods are moved as they were from the PitchDrumMatrix class, which copies them onto
 * PitchDrumMatrix.prototype (see PitchDrumMatrix.installModules), so `this` is still the widget.
 */
class PitchDrumMatrixGrid {
    /**
     * Adds a row to the pdm table for each pitch, with the note label in the first column and a
     * table of cells in the second, then starts the extra row for the drum names.
     *
     * @private
     * @returns {HTMLTableRowElement} - The extra row, for the drum names.
     */
    _makeRows() {
        const pdmTable = this._pdmTable;

        let j = 0;
        let drumName;
        let pdmTableRow;
        let labelCell;
        let pdmCell;
        let pdmRow;
        let pdmCellTable;
        for (let i = 0; i < this.rowLabels.length; i++) {
            // getNote turns both "rest" and "r" into a rest, and the label can be
            // translated.
            const label = this.rowLabels[i].toLowerCase();
            if (label === _("rest").toLowerCase() || label === "rest" || label === "r") {
                // In case there are rest notes included.
                this._rests += 1;
                continue;
            }

            drumName = getDrumName(this.rowLabels[i]);

            if (drumName !== null) {
                // if it is a drum, we'll make it a column below.
                this.drums.push(drumName);
                continue;
            }

            pdmTableRow = pdmTable.insertRow();

            // A cell for the row label
            labelCell = pdmTableRow.insertCell();
            labelCell.style.backgroundColor = platformColor.labelColor;
            labelCell.style.fontSize = this._cellScale * 100 + "%";
            labelCell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            labelCell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            labelCell.style.minWidth = 0;
            labelCell.style.maxWidth = 0;
            labelCell.className = "headcol";
            labelCell.textContent = this.rowLabels[i];
            const sub = document.createElement("sub");
            sub.textContent = this.rowArgs[i].toString();
            labelCell.appendChild(sub);
            labelCell.dataset.noteArg = this.rowLabels[i];
            labelCell.dataset.octave = this.rowArgs[i].toString();
            labelCell.style.position = "sticky";
            labelCell.style.left = "0";
            labelCell.style.top = "0";
            labelCell.style.zIndex = "5";

            pdmCell = pdmTableRow.insertCell();
            // Create tables to store individual notes.
            const tbl = document.createElement("table");
            tbl.setAttribute("cellpadding", "0px");
            tbl.id = "pdmCellTable" + j;
            pdmCell.appendChild(tbl);
            pdmCellTable = tbl;
            this._pdmCellTables.push(pdmCellTable);

            // We'll use this element to put the clickable notes for this row.
            pdmRow = pdmCellTable.insertRow();
            pdmRow.setAttribute("id", "pdm" + j);

            j += 1;
        }

        // An extra row for the note and tuplet values
        pdmTableRow = pdmTable.insertRow();
        labelCell = pdmTableRow.insertCell();
        labelCell.style.backgroundColor = platformColor.labelColor;
        labelCell.style.fontSize = this._cellScale * 100 + "%";
        labelCell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
        labelCell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
        labelCell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
        labelCell.style.maxWidth = labelCell.style.minWidth;
        labelCell.className = "headcol";
        labelCell.textContent = "";
        labelCell.style.position = "sticky";
        labelCell.style.left = "0";
        labelCell.style.top = "0";
        labelCell.style.bottom = "0";
        labelCell.style.zIndex = "20";

        return pdmTableRow;
    }

    /**
     * Adds the table of drum names to the extra row, with a column for each drum.
     *
     * @private
     * @param {HTMLTableRowElement} pdmTableRow - The extra row made by _makeRows.
     * @returns {void}
     */
    _makeDrumRow(pdmTableRow) {
        const pdmCell = pdmTableRow.insertCell();
        // Create table to store drum names.
        const pTbl = document.createElement("table");
        pTbl.setAttribute("cellpadding", "0px");
        pTbl.id = "pdmDrumTable";
        this._pdmDrumTable = pTbl;
        const pTr = document.createElement("tr");
        pTbl.appendChild(pTr);
        pdmCell.appendChild(pTbl);
        pdmCell.style.position = "sticky";
        pdmCell.style.bottom = "0";
        pdmCell.style.zIndex = "10";

        // Add any drum blocks here.
        for (let i = 0; i < this.drums.length; i++) {
            this._addDrum(i);
        }
    }

    /**
     * Adds a drum to the matrix.
     *
     * @private
     * @param {number} drumIdx - The index of the drum to add.
     * @returns {void}
     */
    _addDrum(drumIdx) {
        const drumname = this.drums[drumIdx];
        const pdmTable = this._pdmTable;
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = this._pdmCellTables[i];
            row = table.rows[0];
            cell = row.insertCell();
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.width = PitchDrumMatrix.DRUMNAMEWIDTH;
            cell.style.width = PitchDrumMatrix.DRUMNAMEWIDTH + "px";
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.backgroundColor = platformColor.selectorBackground;
            cell.style.border = "2px solid white";
            cell.style.borderRadius = "10px";

            cell.onmouseover = () => {
                if (cell.style.backgroundColor !== "black") {
                    cell.style.backgroundColor = platformColor.selectorSelected;
                }
            };
            cell.onmouseout = () => {
                if (cell.style.backgroundColor !== "black") {
                    cell.style.backgroundColor = platformColor.selectorBackground;
                }
            };

            cell.setAttribute("id", i + "," + drumIdx); // row,column
        }

        const drumTable = this._pdmDrumTable;
        row = drumTable.rows[0];
        cell = row.insertCell();
        cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
        cell.width = PitchDrumMatrix.DRUMNAMEWIDTH;
        cell.style.width = PitchDrumMatrix.DRUMNAMEWIDTH + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
        cell.style.fontSize = Math.floor(this._cellScale * 75) + "%";
        cell.style.lineHeight = 100 + "%";
        cell.setAttribute("id", drumIdx); // Column // row.cells.length - 1);

        // Work around i8n bug in Firefox.
        let name = getDrumName(drumname);
        if (name === "") {
            name = drumname;
        }

        cell.textContent = "\u00A0\u00A0";
        const img = document.createElement("img");
        img.src = `${getDrumIcon(name)}`;
        img.title = name;
        img.alt = name;
        img.setAttribute("height", PitchDrumMatrix.ICONSIZE);
        img.setAttribute("width", PitchDrumMatrix.ICONSIZE);
        img.setAttribute("vertical-align", "middle");
        cell.appendChild(img);
        cell.appendChild(document.createTextNode("\u00A0\u00A0"));
        cell.style.backgroundColor = platformColor.selectorBackground;
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = PitchDrumMatrixGrid;
}
