// Copyright (c) 2016-22 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// Similar to the matrix, this widget makes a mapping between pitch
// and arpeggio sounds.

/*
   global

   platformColor, _, docById, getNote, setCustomChord
*/
/*
   Global locations
   js/utils/musicutils.js
       getNote, setCustomChord
   js/utils/utils.js
        _, docById
    js/utils/platformstyle.js
        platformColor
*/
/* exported Arpeggio */

class Arpeggio {
    static BUTTONDIVWIDTH = 295; // 5 buttons
    static CELLSIZE = 28;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static ARPEGGIOMAX = 12;

    constructor() {
        this.rowLabels = ["12", "11", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"];
        this._playing = false;
        // The half-step number associated with a row; a step (in
        // time) block is associated with a column. We need to keep
        // track of which intersections in the grid are populated.

        // These arrays get created each time the matrix is built.
        this._rowBlocks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // half-step number
        this._colBlocks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // time-step number

        // This array is preserved between sessions.
        // We populate the blockMap whenever a node is selected and
        // restore any nodes that might be present.
        this._blockMap = [[12, 1]];  // bottom left corner
    }

    /**
     * Removes the previous matrix and them make another
     * one in DOM (Document Object Model).
     */
    init(activity) {
        this.activity = activity;
        const w = window.innerWidth;
        this._cellScale = w / 1200;

        const widgetWindow = window.widgetWindows.windowFor(this, "arpeggio");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        this.playButton = widgetWindow.addButton(
            "play-button.svg",
            Arpeggio.ICONSIZE,
            _("Play")
        );

        this.playButton.onclick = () => {
            this._playing = !this._playing;
            this.activity.logo.turtleDelay = 0;
            this._playAll();
        };

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            Arpeggio.ICONSIZE,
            _("Save")
        ).onclick = () => {
            // Debounce button
            if (!this._get_save_lock()) {
                this._save_lock = true;
                this._save();
                setTimeout(() => {
                    this._save_lock = false;
                }, 1000);
            }
        };

        widgetWindow.addButton(
            "erase-button.svg",
            Arpeggio.ICONSIZE,
            _("Clear")
        ).onclick = () => {
            this._clear();
        };

        this.arpeggioDiv = document.createElement("div");
        widgetWindow.getWidgetBody().append(this.arpeggioDiv);
        widgetWindow.getWidgetBody().style.height = "400px";
        widgetWindow.getWidgetBody().style.width = "400px";

        const arpeggioTableDiv = this.arpeggioDiv;
        arpeggioTableDiv.style.display = "inline";
        arpeggioTableDiv.style.visibility = "visible";
        arpeggioTableDiv.style.border = "0px";
        arpeggioTableDiv.innerHTML = "";

        // For the button callbacks
        widgetWindow.onclose = () => {
            arpeggioTableDiv.style.visibility = "hidden";
            this.activity.hideMsgs();
            widgetWindow.destroy();
        };

        this.widgetWindow.onmaximize = this._scale;

        // We use an outer div to scroll vertically and an inner div to scroll horizontally.
        arpeggioTableDiv.innerHTML =
            '<div id="arpeggioOuterDiv"><div id="arpeggioInnerDiv"><table cellpadding="0px" id="arpeggioTable"></table></div></div>';

        // Each row in the arpeggio table contains a note label in the
        // first column and a table of buttons in the second column.
        const arpeggioTable = docById("arpeggioTable");

        let j = 0;
        let arpeggioTableRow;
        let labelCell;
        let arpeggioCell;
        let arpeggioRow;
        let arpeggioCellTable;
        for (let i = 0; i < this.rowLabels.length; i++) {
            arpeggioTableRow = arpeggioTable.insertRow();

            // A cell for the row label
            labelCell = arpeggioTableRow.insertCell();
            labelCell.style.backgroundColor = platformColor.labelColor;
            labelCell.style.fontSize = this._cellScale * 50 + "%";
            labelCell.style.height = Arpeggio.CELLSIZE + "px";
            labelCell.style.width = Arpeggio.CELLSIZE + "px";
            labelCell.style.minWidth = 0;
            labelCell.style.maxWidth = 0;
            labelCell.className = "headcol";
            labelCell.innerHTML = this.rowLabels[j];

            arpeggioCell = arpeggioTableRow.insertCell();
            // Create tables to store individual notes.
            arpeggioCell.innerHTML =
                '<table cellpadding="0px" id="arpeggioCellTable' + j + '"><tr></tr></table>';
            arpeggioCellTable = docById("arpeggioCellTable" + j);

            // We'll use this element to put the clickable notes for this row.
            arpeggioRow = arpeggioCellTable.insertRow();
            arpeggioRow.setAttribute("id", "arpeggio" + j);

            j += 1;
        }

        // An extra row for the time values
        arpeggioTableRow = arpeggioTable.insertRow();
        labelCell = arpeggioTableRow.insertCell();
        labelCell.style.backgroundColor = platformColor.labelColor;
        labelCell.style.fontSize = this._cellScale * 50 + "%";
        labelCell.style.height = Arpeggio.CELLSIZE + "px";
        labelCell.style.width = Arpeggio.CELLSIZE + "px";
        labelCell.style.minWidth = Arpeggio.CELLSIZE + "px";
        labelCell.style.maxWidth = labelCell.style.minWidth;
        labelCell.className = "headcol";
        labelCell.innerHTML = "";

        const outerDiv = docById("arpeggioOuterDiv");
        outerDiv.style.height = widgetWindow.getWidgetBody().style.height;
        outerDiv.style.width = widgetWindow.getWidgetBody().style.width;
        outerDiv.style.marginLeft = "0px";

        const innerDiv = docById("arpeggioInnerDiv");
        innerDiv.style.height = widgetWindow.getWidgetBody().style.height;
        innerDiv.style.width = widgetWindow.getWidgetBody().style.width;
        innerDiv.style.marginLeft = "0px";

        arpeggioCell = arpeggioTableRow.insertCell();
        // Create table to store arpeggio names.
        arpeggioCell.innerHTML = '<table cellpadding="0px" id="arpeggioNoteTable"><tr></tr></table>';

        // Add any arpeggio blocks here.
        for (let i = 0; i < Arpeggio.ARPEGGIOMAX; i++) {
            this._addNote(i);
        }

        //Change widget size on fullscreen mode, else
        //revert back to original size on unfullscreen mode
        widgetWindow.onmaximize = function () {
            if (widgetWindow._maximized) {
                widgetWindow.getWidgetBody().style.position = "absolute";
                widgetWindow.getWidgetBody().style.height = "calc(100vh - 80px)";
                widgetWindow.getWidgetBody().style.width = "200vh";
                docById("arpeggioOuterDiv").style.height = "calc(100vh - 80px)";
                docById("arpeggioOuterDiv").style.width = "calc(200vh - 64px)";
                docById("arpeggioInnerDiv").style.width = "calc(200vh - 64px)";
                docById("arpeggioInnerDiv").style.height = "calc(100vh - 80px)";
                widgetWindow.getWidgetBody().style.left = "70px";
            } else {
                widgetWindow.getWidgetBody().style.position = "relative";
                widgetWindow.getWidgetBody().style.left = "0px";
                widgetWindow.getWidgetBody().style.height = "400px";
                widgetWindow.getWidgetBody().style.width = "400px";
                // const innerDiv = docById("arpeggioInnerDiv");
                innerDiv.style.height = widgetWindow.getWidgetBody().style.height;
                innerDiv.style.width = widgetWindow.getWidgetBody().style.width;
            }
        };

        this.makeClickable();
        this.activity.textMsg(_("Click in the grid to add steps to the arpeggio."));

        this._setCellArpeggio(0, 11, true);
    }

    /**
     * @public
     * @returns {void}
     */
    clearBlocks() {
        this._rowBlocks = [];
        this._colBlocks = [];
    }

    /**
     * @public
     * @param {number} pitchBlock
     * @param {number} arpeggioBlock
     * @returns {void}
     */
    addNode(halfStep, timeStep) {
        let obj;
        for (let i = 0; i < this._blockMap.length; i++) {
            obj = this._blockMap[i];
            if (obj[0] === halfStep && obj[1] === timeStep) {
                return; // node is already in the list
            }
        }
        this._blockMap.push([halfStep, timeStep]);
    }

    /**
     * @public
     * @param {number} pitchBlock
     * @param {number} arpeggioBlock
     * @returns {void}
     */
    removeNode(pitchBlock, arpeggioBlock) {
        let obj;
        for (let i = 0; i < this._blockMap.length; i++) {
            obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === arpeggioBlock) {
                this._blockMap[i] = [-1, -1]; // Mark as removed
            }
        }
    }

    /**
     * @private
     * @returns {HTMLElement}
     */
    _get_save_lock() {
        return this._save_lock;
    }

    /**
     * @deprecated
     */
    _addButton(row, icon, iconSize, label) {
        const cell = row.insertCell(-1);
        cell.innerHTML =
            '&nbsp;&nbsp;<img src="header-icons/' +
            icon +
            '" title="' +
            label +
            '" alt="' +
            label +
            '" height="' +
            iconSize +
            '" width="' +
            iconSize +
            '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = Arpeggio.BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover = () => {
            cell.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        };

        cell.onmouseout = () => {
            cell.style.backgroundColor = platformColor.selectorBackground;
        };

        return cell;
    }

    /**
     * @private
     * @param {number} arpeggioIdx
     * @returns {void}
     */
    _addNote(arpeggioIdx) {
        const arpeggioName = (arpeggioIdx + 1).toString();
        const arpeggioTable = docById("arpeggioTable");
        let table;
        let row;
        let cell;
        for (let i = 0; i < arpeggioTable.rows.length - 1; i++) {
            table = docById("arpeggioCellTable" + i);
            row = table.rows[0];
            cell = row.insertCell();
            cell.style.height = Arpeggio.CELLSIZE + "px";
            cell.width = Arpeggio.CELLSIZE;
            cell.style.width = cell.width;
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

            cell.setAttribute("id", i + "," + arpeggioIdx); // row,column
        }

        const arpeggioNoteTable = docById("arpeggioNoteTable");
        row = arpeggioNoteTable.rows[0];
        cell = row.insertCell();
        cell.height = (Arpeggio.CELLSIZE + 1) + "px";
        cell.width = Arpeggio.CELLSIZE;
        cell.style.width = cell.width + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Arpeggio.CELLSIZE + "px";
        cell.style.fontSize = Math.floor(this._cellScale * 50) + "%";
        cell.style.lineHeight = 100 + "%";
        cell.setAttribute("id", arpeggioIdx);
        cell.className = "headcol";
        cell.innerHTML = arpeggioName;
        cell.style.backgroundColor = platformColor.selectorBackground;
    }

    /**
     * Once the entire matrix is generated, this function makes it clickable.
     * @public
     * @returns {void}
     */
    makeClickable() {
        const arpeggioTable = docById("arpeggioTable");
        const arpeggioNoteTable = docById("arpeggioNoteTable");
        let table;
        let cellRow;
        let arpeggioRow;
        let arpeggioCell;
        let cell;
        for (let i = 0; i < arpeggioTable.rows.length - 1; i++) {
            table = docById("arpeggioCellTable" + i);
            cellRow = table.rows[0];

            for (let j = 0; j < cellRow.cells.length; j++) {
                cell = cellRow.cells[j];

                arpeggioRow = arpeggioNoteTable.rows[0];
                // eslint-disable-next-line no-unused-vars
                arpeggioCell = arpeggioRow.cells[j];

                cell.onclick = (e) => {
                    const currCell = e.target;
                    const rowcol = currCell.id.split(",");
                    if (currCell.style.backgroundColor === "black") {
                        currCell.style.backgroundColor = platformColor.selectorBackground;
                        this._setCellArpeggio(rowcol[1], rowcol[0], false);
                    } else {
                        // Only one cell per column can be set.
                        this._clearColumn(rowcol[1], rowcol[0]);
                        currCell.style.backgroundColor = "black";
                        this._setCellArpeggio(rowcol[1], rowcol[0], true);
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
                // Look for this note in the pitch and arpeggio blocks.
                row = this._rowBlocks.indexOf(obj[0]);
                col = -1;
                for (let j = 0; j < this._colBlocks.length; j++) {
                    if (this._colBlocks[j] === obj[1]) {
                        col = j;
                        break;
                    }
                }

                if (col === -1) {
                    continue;
                }

                // If we found a match, mark this cell and add this
                // note to the play list.
                table = docById("arpeggioCellTable" + row);
                cellRow = table.rows[0];

                cell = cellRow.cells[col];

                if (cell != undefined) {
                    cell.style.backgroundColor = "black";
                    this._setPairCell(row, col, cell, false);
                }
            }
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _scale() {
        const windowHeight =
            this.getWidgetFrame().offsetHeight - this.getDragElement().offsetHeight;
        const widgetBody = this.getWidgetBody();
        const scale = this.isMaximized? windowHeight / widgetBody.offsetHeight: 1;
        widgetBody.style.display = "flex";
        widgetBody.style.flexDirection = "column";
        widgetBody.style.alignItems = "center";
        widgetBody.children[0].style.display = "flex";
        widgetBody.children[0].style.flexDirection = "column";
        widgetBody.children[0].style.alignItems = "center";

        const svg = this.getWidgetBody().getElementsByTagName("svg")[0];
        svg.style.pointerEvents = "none";
        svg.setAttribute("height", `${400 * scale}px`);
        svg.setAttribute("width", `${400 * scale}px`);
        setTimeout(() => {
            svg.style.pointerEvents = "auto";
        }, 100);
    }

    /**
     * @private
     * @returns {void}
     */
    _playAll() {
        // Play all of the arpeggio cells in the matrix.
        const icon = this.playButton;
        if (this._playing) {
            icon.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "stop-button.svg" +
                '" title="' +
                _("Stop") +
                '" alt="' +
                _("Stop") +
                '" height="' +
                Arpeggio.ICONSIZE +
                '" width="' +
                Arpeggio.ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        } else {
            icon.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "play-button.svg" +
                '" title="' +
                _("Play") +
                '" alt="' +
                _("Play") +
                '" height="' +
                Arpeggio.ICONSIZE +
                '" width="' +
                Arpeggio.ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
            this._playing = false;
            return;
        }
        this.activity.logo.synth.stop();

        const pairs = [];

        // For each column (time), look for a selected cell.
        const arpeggioTable = docById("arpeggioTable");
        let table;
        let row;
        let cell;
        for (let j = 0; j < Arpeggio.ARPEGGIOMAX; j++) {
            for (let i = 0; i < arpeggioTable.rows.length - 1; i++) {
                table = docById("arpeggioCellTable" + i);
                row = table.rows[0];
                cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    pairs.push([i, j]);
                    break;
                }
            }
        }

        let isEmpty = true;
        for (let i = 0; i < pairs.length; i++) {
            if (pairs[i][1] != -1) {
                isEmpty = false;
                break;
            }
        }
        if (!isEmpty) {
            const ii = 0;
            if (ii < pairs.length) {
                this._playPitchArpeggio(ii, pairs);
            }
        }
    }

    /**
     * @private
     * @param {number} i
     * @param {number} pairs
     * @returns {void}
     */
    _playPitchArpeggio(i, pairs) {
        // Find the arpeggio cell

        if (!this._playing) {
            return;
        }

        const table = docById("arpeggioCellTable" + i);
        const row = table.rows[0];
        const cell = row.cells[i];

        if (pairs[i][1] !== -1) {
            this._setPairCell(pairs[i][0], pairs[i][1], cell, true);
        }

        if (i < pairs.length - 1) {
            setTimeout(() => {
                const ii = i + 1;
                this._playPitchArpeggio(ii, pairs);
            }, 1000);
        } else {
            setTimeout(() => {
                const icon = this.playButton;
                icon.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/' +
                    "play-button.svg" +
                    '" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    Arpeggio.ICONSIZE +
                    '" width="' +
                    Arpeggio.ICONSIZE +
                    '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
                this._playing = false;
            }, 1000);
        }
    }

    /**
     * @private
     * @param {number} colIndex
     * @param {number} rowIndex
     * @param {boolean} playNote
     * @returns {void}
     */
    _setCellArpeggio(colIndex, rowIndex, playNote) {
        // Sets corresponding pitch/arpeggio when user clicks on any cell and
        // plays them.
        const coli = Number(colIndex);
        const rowi = Number(rowIndex);

        // Find the arpeggio cell
        const table = docById("arpeggioCellTable" + rowi);
        const row = table.rows[0];

        const pitchBlock = this._rowBlocks[rowi];
        const timeBlock = this._colBlocks[coli];
        if (playNote) {
            this.addNode(pitchBlock, timeBlock);
        } else {
            this.removeNode(pitchBlock, timeBlock);
        }

        let cell;
        for (let i = 0; i < row.cells.length; i++) {
            cell = row.cells[i];
            if (cell.style.backgroundColor === "black") {
                this._setPairCell(rowi, i, cell, playNote);
            }
        }
    }

    /**
     * @private
     * @param {number} rowIndex
     * @param {number} colIndex
     * @param {obj} cell
     * @param {boolean} playNote
     * @returns {void}
     */
    _setPairCell(rowIndex, colIndex, cell, playNote) {
        const noteObj = getNote(
            this.activity.turtles.ithTurtle(0).singer.keySignature[0],
            4,
            Arpeggio.ARPEGGIOMAX - rowIndex - 1,  // Transposition
            this.activity.turtles.ithTurtle(0).singer.keySignature,
            false,
            null,
            this.activity.errorMsg
        );

        const note = noteObj[0] + noteObj[1];

        if (playNote) {
            this.activity.logo.synth.trigger(
                0,
                note.replace(/♭/g, "b").replace(/♯/g, "#"),
                0.125,
                "default",
                null,
                null,
                null
            );
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _clearColumn(colIndex, rowIndex) {
        // "Unclick" every entry in a column in the matrix (except for
        // cell at col/rowIndex).
        const arpeggioTable = docById("arpeggioTable");
        let table;
        let row;
        let cell;
        for (let i = 0; i < arpeggioTable.rows.length - 1; i++) {
            if (i === rowIndex) {
                continue;
            }
            table = docById("arpeggioCellTable" + i);
            row = table.rows[0];
            cell = row.cells[colIndex];
            if (cell.style.backgroundColor === "black") {
                cell.style.backgroundColor = platformColor.selectorBackground;
                this._setCellArpeggio(colIndex, i, false);
            }
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _clear() {
        // "Unclick" every entry in the matrix.
        const arpeggioTable = docById("arpeggioTable");
        let table;
        let row;
        let cell;
        for (let i = 0; i < arpeggioTable.rows.length - 1; i++) {
            table = docById("arpeggioCellTable" + i);
            row = table.rows[0];
            for (let j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];
                if (i === 11 && j == 0) {
                    cell.style.backgroundColor = "black";
                    this._setCellArpeggio(0, 11, true);
                } else if (cell.style.backgroundColor === "black") {
                    cell.style.backgroundColor = platformColor.selectorBackground;
                    this._setCellArpeggio(j, i, false);
                }
            }
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _save() {
        // Saves the current matrix as a custom Chord
        const chordValues = [];
        for (let i = 0; i < Arpeggio.ARPEGGIOMAX; i++) {
            // We go left to right, regardless of the order in the blockMap.
            for (let j = 0; j < this._blockMap.length; j++) {
                if (this._blockMap[j][1] !== i) {
                    continue;
                }
                if (this._blockMap[j][0] === -1) {
                    continue;
                }
                if (this._blockMap[j][0] === 12 && this._blockMap[j][1] === 1) {
                    continue;
                }
                chordValues.push(12 - this._blockMap[j][0]);
            }
        }
        setCustomChord(chordValues);
    }
}
