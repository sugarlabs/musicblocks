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

   platformColor, _, docById, getNote, setCustomChord, keySignatureToMode,
   getModeNumbers, getTemperament
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
    static BUTTONDIVWIDTH = 295;
    static CELLSIZE = 28;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static DEFAULTCOLS = 4;

    constructor() {
        // Populated by notes blocks in the widget clamp.
        this.notesToPlay = [];
        // The half-step number associated with a row; a step (in
        // time) block is associated with a column. We need to keep
        // track of which intersections in the grid are populated.
        // These arrays get created each time the matrix is built.
        this._blockMap = [];  // pairs storage
        this.defaultCols = Arpeggio.DEFAULTCOLS;
    }

    /**
     * Removes the previous matrix and them make another
     * one in DOM (Document Object Model).
     */
    init(activity) {
        this._activity = activity;

        this._rowLabels = [];
        this._rowBlocks = [];
        const _t = getTemperament(this._activity.logo.synth.whichTemperament());
        for (let i = 0; i < _t.pitchNumber + 1; i++) {
            this._rowBlocks.push(i);
            this._rowLabels.push((_t.pitchNumber - i).toString());
        }

        // We use the mode number to highlight the scalar rows.
        this._modeNumbers = getModeNumbers(
            keySignatureToMode(
                this._activity.turtles.ithTurtle(0).singer.keySignature
            )[1]
        ).split(" ");

        this._playing = false;
        this._playList = [];
        this._colBlocks = [];  // time steps
        for (let i = 0; i < this.defaultCols; i++) {
            this._colBlocks.push(i + 1);
        }

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
            this._activity.logo.turtleDelay = 0;
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
            this._activity.hideMsgs();
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
        for (let i = 0; i < this._rowLabels.length; i++) {
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
            labelCell.innerHTML = this._rowLabels[j];

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
        for (let i = 0; i < this.defaultCols; i++) {
            this._addNote(i);
        }

        //Change widget size on fullscreen mode, else
        //revert back to original size on unfullscreen mode
        widgetWindow.onmaximize = () => {
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
        this._activity.textMsg(_("Click in the grid to add steps to the arpeggio."));
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
    removeNode(halfStep, timeStep) {
        let obj;
        for (let i = 0; i < this._blockMap.length; i++) {
            obj = this._blockMap[i];
            if (obj[0] === halfStep && obj[1] === timeStep) {
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
     * @param {number} row index
     * @returns {boolean} true/false
     */
    _inMode(i) {
        return this._modeNumbers.includes(i.toString());
    }

    /**
     * @private
     * @param {number} row index
     * @returns {boolean} true/false
     */
    _rowInMode(i) {
        const ii = (this._rowLabels.length - i - 1) %
              (this._rowLabels.length - 1);
        return this._inMode(ii);
    }

    /**
     * @private
     * @param {number} row index
     * @returns {string} color, e.g. "#ffffff"
     */
    _getBackgroundColor(i) {
        if (this._rowInMode(i)) {
            return platformColor.selectorSelected;
        }
        return platformColor.selectorBackground;
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
            cell.style.backgroundColor = this._getBackgroundColor(i);
            cell.style.border = "2px solid white";
            cell.style.borderRadius = "10px";

            cell.setAttribute("id", i + "," + arpeggioIdx); // row,column

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
                        currCell.style.backgroundColor = this._getBackgroundColor(
                            Number(rowcol[0])
                        );
                        this._setCell(rowcol[1], rowcol[0], false);
                    } else {
                        // Only one cell per column can be set.
                        this._clearColumn(rowcol[1], rowcol[0]);
                        currCell.style.backgroundColor = "black";
                        this._setCell(rowcol[1], rowcol[0], true);
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
                if (row < 0) {
                    continue;
                }
                table = docById("arpeggioCellTable" + row);
                cellRow = table.rows[0];

                cell = cellRow.cells[col];

                if (cell != undefined) {
                    cell.style.backgroundColor = "black";
                    this.__playCell(row, col, cell, false);
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
        this._activity.logo.synth.stop();

        const pairs = this.__makePairsList();

        this._playList = [];
        // Make a list of all the notes to play.
        for (let n = 0; n < this.notesToPlay.length; n++) {
            const noteValue = this.notesToPlay[n][1];
            const letter = this.notesToPlay[n][0].slice(0, -1);
            const octave = Number(this.notesToPlay[n][0].substr(this.notesToPlay[n][0].length - 1));
            for (let i = 0; i < pairs.length; i++) {
                if (pairs[i][0] === -1) {
                    this._playList.push(["", noteValue]);
                } else {
                    this._playList.push([getNote(
                        letter,
                        octave,
                        this._rowLabels.length - pairs[i][0] - 1,  // Transposition
                        this._activity.turtles.ithTurtle(0).singer.keySignature,
                        false,
                        null,
                        this._activity.errorMsg
                    ), noteValue]);
                }
            }
        }
        this.__playNote(0);
    }

    /**
     * @private
     * @returns {obj}
     */
    __makePairsList() {
        const pairs = [];

        // For each column (time), look for a selected cell.
        const arpeggioTable = docById("arpeggioTable");
        let table;
        let row;
        let cell;
        for (let j = 0; j < this.defaultCols; j++) {
            let thisPair = [-1, j];
            for (let i = 0; i < arpeggioTable.rows.length - 1; i++) {
                table = docById("arpeggioCellTable" + i);
                row = table.rows[0];
                cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    thisPair = [i, j];
                    //pairs.push([i, j]);
                    break;
                }
            }
            pairs.push(thisPair);
        }

        return pairs;
    }

    /**
     * @private
     * @param: {number} i
     * @returns {void}
     */
    __playNote(i) {
        if (i < this._playList.length) {
            if (this._playList[i][0].length > 0) {
                this._activity.logo.synth.trigger(
                    0,
                    this._playList[i][0][0].replace(/♭/g, "b").replace(/♯/g, "#") + this._playList[i][0][1],
                    this._playList[i][1],
                    "default",
                    null,
                    null,
                    null
                );
            }
            setTimeout(() => {
                this.__playNote(i + 1);
            }, 2600 * this._playList[i][1]);
        } else {
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
        }
    }

    /**
     * @private
     * @param {number} colIndex
     * @param {number} rowIndex
     * @param {boolean} playNote
     * @returns {void}
     */
    _setCell(colIndex, rowIndex, playNote) {
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
                this.__playCell(rowi, i, cell, playNote);
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
    __playCell(rowIndex, colIndex, cell, playNote) {
        if (playNote) {
            let letter, octave;
            if (this.notesToPlay.length === 0) {
                letter = "C";
                octave = 4;
            } else {
                letter = this.notesToPlay[0][0].slice(0, -1);
                octave = Number(
                    this.notesToPlay[0][0].substr(
                        this.notesToPlay[0][0].length - 1
                    )
                );
            }
            const noteObj = getNote(
                letter,
                octave,
                this._rowLabels.length - rowIndex - 1,  // Transposition
                this._activity.turtles.ithTurtle(0).singer.keySignature,
                false,
                null,
                this._activity.errorMsg
            );

            const note = noteObj[0] + noteObj[1];
            this._activity.logo.synth.trigger(
                0,
                note.replace(/♭/g, "b").replace(/♯/g, "#"),
                this.notesToPlay[0][1],
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
                cell.style.backgroundColor = this._getBackgroundColor(i);
                this._setCell(colIndex, i, false);
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
                if (cell.style.backgroundColor === "black") {
                    cell.style.backgroundColor = this._getBackgroundColor(i);
                    this._setCell(j, i, false);
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
        const pairs = this.__makePairsList();
        const chordValues = [];
        for (let i = 0; i < pairs.length; i++) {
            // TODO: export as (scalar, semitone)
            if (pairs[i][0] === -1) {
                chordValues.push(["-", "-"]);  // rest
            } else {
                const ii = this._rowBlocks.length - pairs[i][0] - 1;
                if (this._inMode(ii)) {
                    chordValues.push([this._modeNumbers.indexOf(
                        ii.toString()
                    ), 0]);
                } else {
                    if (pairs[i][0] === 0) { // top row -> octave
                        chordValues.push([this._modeNumbers.length, 0]);
                    } else {
                        let j = 1;
                        while(ii - j >= 0) {
                            if (this._inMode(ii - j)) {
                                chordValues.push([this._modeNumbers.indexOf(
                                    (ii - j).toString()
                                ), j]);
                                break;
                            }
                            j += 1;
                        }
                    }
                }
            }
        }

        // eslint-disable-next-line no-console
        console.log(chordValues);
        setCustomChord(chordValues);

        // Also, save as an arpeggio block.
        const newStack = [
            [0, "arpeggio", 100, 100, [null, 1, 2, 11]],
            [1, ["chordname",{"value": "custom"}], 0, 0, [0]],
            [2, ["newnote", {"collapsed":false}], 0, 0, [0, 3, 6, 10]],
            [3, "divide", 0, 0, [2, 4, 5]],
            [4, ["number", {"value":1}], 0, 0, [3]],
            [5, ["number", {"value":12}], 0, 0, [3]],
            [6, "vspace", 0, 0, [2, 7]],
            [7, "pitch", 0, 0, [6, 8, 9, null]],
            [8, ["solfege", {"value": "do"}], 0, 0, [7]],
            [9, ["number", {"value": 4}], 0, 0, [7]],
            [10, "hidden", 0, 0, [2, null]],
            [11,"hidden", 0, 0, [0, null]]
        ];
        this._activity.blocks.loadNewBlocks(newStack);
    }
}
