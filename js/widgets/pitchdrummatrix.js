// Copyright (c) 2016-21 Walter Bender
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
// and drum sounds.

/*
   global

   platformColor, _, docById, getNote, getDrumName, getDrumIcon,
   getDrumSynthName, Singer, MATRIXSOLFEHEIGHT, MATRIXSOLFEWIDTH,
   SOLFEGECONVERSIONTABLE
*/
/*
   Global locations
   js/utils/musicutils.js
        getNote, getDrumName, getDrumIcon, getDrumSynthName, Singer,
        MATRIXSOLFEHEIGHT, MATRIXSOLFEWIDTH, SOLFEGECONVERSIONTABLE
   js/utils/utils.js
        _, docById
    js/utils/platformstyle.js
        platformColor
*/
/* exported PitchDrumMatrix */

/**
 * Represents a PitchDrumMatrix widget for making a mapping between pitch and drum sounds.
 * 
 * @class
 * @memberof global
 * @requires Singer
 * @requires _ 
 * @requires docById
 * @requires platformColor
 * @exports PitchDrumMatrix
 */
class PitchDrumMatrix {
     /**
     * Width of the button division.
     * 
     * @type {number}
     */
    static BUTTONDIVWIDTH = 295; // 5 buttons

    /**
     * Width of the drum name column.
     * 
     * @type {number}
     */
    static DRUMNAMEWIDTH = 50;

    /**
     * Width of the outer window.
     * 
     * @type {number}
     */
    static OUTERWINDOWWIDTH = 128;

    /**
     * Width of the inner window.
     * 
     * @type {number}
     */
    static INNERWINDOWWIDTH = 50;
    /**
     * Size of the buttons.
     * 
     * @type {number}
     */
    static BUTTONSIZE = 53;
     /**
     * Size of the icons.
     * 
     * @type {number}
     */
    static ICONSIZE = 32;

    constructor() {
        this.rowLabels = [];
        this.rowArgs = [];
        this.drums = [];
        this._rests = 0;
        this._playing = false;
        // The pitch-block number associated with a row; a drum block is
        // associated with a column. We need to keep track of which
        // intersections in the grid are populated.  The blockMap is a
        // list of selected nodes in the matrix that map pitch blocks to
        // drum blocks.

        // These arrays get created each time the matrix is built.
        this._rowBlocks = []; // pitch-block number
        this._colBlocks = []; // drum-block number

        // This array is preserved between sessions.
        // We populate the blockMap whenever a node is selected and
        // restore any nodes that might be present.
        this._blockMap = [];
    }

    /**
     * Initializes the pitch/drum matrix. 
     * 
     * @param {Activity} activity - The activity instance.
     */
    init(activity) {
        /**
         * The activity associated with the PitchDrumMatrix.
         * 
         * @type {Activity}
         */
        this.activity = activity;
        const w = window.innerWidth;
        /**
         * The scale factor for cell sizes.
         * 
         * @type {number}
         * @private
         */
        this._cellScale = w / 1200;
        
        /**
         * The widget window for the PitchDrumMatrix.
         * 
         * @type {WidgetWindow}
         */
        const widgetWindow = window.widgetWindows.windowFor(this, "pitch drum");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();
        
        /**
         * The button to play all sounds associated with the matrix.
         * 
         * @type {HTMLButtonElement}
         */
        this.playButton = widgetWindow.addButton(
            "play-button.svg",
            PitchDrumMatrix.ICONSIZE,
            _("Play")
        );

        this.playButton.onclick = () => {
            this._playing = !this._playing;
            this.activity.logo.turtleDelay = 0;
            this._playAll();
        };
        
        /**
         * Flag indicating whether saving operation is locked.
         * 
         * @type {boolean}
         * @private
         */
        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            PitchDrumMatrix.ICONSIZE,
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
            PitchDrumMatrix.ICONSIZE,
            _("Clear")
        ).onclick = () => {
            this._clear();
        };
        
        /**
         * The container for the pitch/drum matrix.
         * 
         * @type {HTMLDivElement}
         */
        this.pitchDrumDiv = document.createElement("div");
        widgetWindow.getWidgetBody().append(this.pitchDrumDiv);
        widgetWindow.getWidgetBody().style.height = "400px";
        widgetWindow.getWidgetBody().style.width = "500px";

        // The pdm table
        const pdmTableDiv = this.pitchDrumDiv;
        pdmTableDiv.style.position = "relative";
        pdmTableDiv.style.visibility = "invisible";
        pdmTableDiv.style.border = "0px";
        pdmTableDiv.innerHTML = "";

        // For the button callbacks
        widgetWindow.onclose = () => {
            pdmTableDiv.style.visibility = "hidden";
            this.activity.hideMsgs();
            widgetWindow.destroy();
        };

        this.widgetWindow.onmaximize = this._scale;

        // We use an outer div to scroll vertically and an inner div to scroll horizontally.
        pdmTableDiv.innerHTML =
            '<div id="pdmOuterDiv"><div id="pdmInnerDiv"><table cellpadding="0px" id="pdmTable"></table></div></div>';

        // Each row in the pdm table contains a note label in the
        // first column and a table of buttons in the second column.
        const pdmTable = docById("pdmTable");

        let j = 0;
        let drumName;
        let pdmTableRow;
        let labelCell;
        let pdmCell;
        let pdmRow;
        let pdmCellTable;
        for (let i = 0; i < this.rowLabels.length; i++) {
            if (this.rowLabels[i].toLowerCase() === _("rest")) {
                // In case there are rest notes included.
                this._rests += 1;
                continue;
            }

            drumName = getDrumName(this.rowLabels[i]);

            if (drumName != null) {
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
            labelCell.innerHTML = this.rowLabels[j] + this.rowArgs[j].toString().sub();
            labelCell.style.position = "sticky";
            labelCell.style.left = "0"; 
            labelCell.style.top = "0"; 
            labelCell.style.zIndex = "5";
           
            pdmCell = pdmTableRow.insertCell();
            // Create tables to store individual notes.
            pdmCell.innerHTML =
                '<table cellpadding="0px" id="pdmCellTable' + j + '"><tr></tr></table>';
            pdmCellTable = docById("pdmCellTable" + j);

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
        labelCell.innerHTML = "";
        labelCell.style.position = "sticky";
        labelCell.style.left = "0"; 
        labelCell.style.top = "0"; 
        labelCell.style.bottom = "0";
        labelCell.style.zIndex = "20";

        const n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);
        const outerDiv = docById("pdmOuterDiv");
        outerDiv.style.height = widgetWindow.getWidgetBody().style.height;
        outerDiv.style.width = widgetWindow.getWidgetBody().style.width;
        let ow;
        if (pdmTable.rows.length + 2 > n) {
            ow = Math.max(
                Math.min(
                    widgetWindow.getWidgetBody().style.width,
                    this._cellScale *
                        (this.drums.length * (PitchDrumMatrix.DRUMNAMEWIDTH + 2) +
                            MATRIXSOLFEWIDTH +
                            24)
                ),
                PitchDrumMatrix.BUTTONDIVWIDTH
            ); // Add room for the vertical slider.
        } else {
            ow = Math.max(
                Math.min(
                    window.innerWidth / 2,
                    this._cellScale *
                        (this.drums.length * (PitchDrumMatrix.DRUMNAMEWIDTH + 2) + MATRIXSOLFEWIDTH)
                ),
                PitchDrumMatrix.BUTTONDIVWIDTH
            );
        }

        const innerDiv = docById("pdmInnerDiv");
        innerDiv.style.height = widgetWindow.getWidgetBody().style.height;
        innerDiv.style.width = widgetWindow.getWidgetBody().style.width;
        innerDiv.style.marginLeft = "0px";

        pdmCell = pdmTableRow.insertCell();
        // Create table to store drum names.
        pdmCell.innerHTML = '<table cellpadding="0px" id="pdmDrumTable"><tr></tr></table>';
        pdmCell.style.position = "sticky";
        pdmCell.style.bottom = "0";
        pdmCell.style.zIndex = "10";

        // Add any drum blocks here.
        for (let i = 0; i < this.drums.length; i++) {
            this._addDrum(i);
        }

        //Change widget size on fullscreen mode, else
        //revert back to original size on unfullscreen mode
        widgetWindow.onmaximize = () => {
            if (widgetWindow._maximized) {
                widgetWindow.getWidgetBody().style.position = "absolute";
                widgetWindow.getWidgetBody().style.height = "calc(-95px + 100vh)";
                widgetWindow.getWidgetBody().style.width = "calc(-55px + 100vw)";
                widgetWindow.getWidgetBody().style.left = "55px";
                outerDiv.style.height = widgetWindow.getWidgetBody().style.height;
                outerDiv.style.width = widgetWindow.getWidgetBody().style.width;
                innerDiv.style.height = widgetWindow.getWidgetBody().style.height;
                innerDiv.style.width = widgetWindow.getWidgetBody().style.width;
            } else {
                widgetWindow.getWidgetBody().style.position = "relative";
                widgetWindow.getWidgetBody().style.left = "0px";
                widgetWindow.getWidgetBody().style.height = "400px";
                widgetWindow.getWidgetBody().style.width = "500px";
                const innerDiv = docById("pdmInnerDiv");
                innerDiv.style.height = widgetWindow.getWidgetBody().style.height;
                innerDiv.style.width = widgetWindow.getWidgetBody().style.width;
            }
        };

        this.activity.textMsg(_("Click in the grid to map notes to drums."));
    }

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
        for (let i = 0; i < this._blockMap.length; i++) {
            obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === drumBlock) {
                this._blockMap[i] = [-1, -1]; // Mark as removed
            }
        }
    }

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
     * [DEPRECATED] Adds a button to the matrix.
     * 
     * @private
     * @deprecated This method is deprecated.
     * @param {HTMLTableRowElement} row - The table row to which the button will be added.
     * @param {string} icon - The icon image source.
     * @param {number} iconSize - The size of the icon.
     * @param {string} label - The label text for the button.
     * @returns {HTMLTableCellElement} - The cell element containing the button.
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
        cell.style.width = PitchDrumMatrix.BUTTONSIZE + "px";
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
     * Adds a drum to the matrix.
     * 
     * @private
     * @param {number} drumIdx - The index of the drum to add.
     * @returns {void}
     */
    _addDrum(drumIdx) {
        const drumname = this.drums[drumIdx];
        const pdmTable = docById("pdmTable");
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = docById("pdmCellTable" + i);
            row = table.rows[0];
            cell = row.insertCell();
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.width = PitchDrumMatrix.DRUMNAMEWIDTH;
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

            cell.setAttribute("id", i + "," + drumIdx); // row,column
        }

        const drumTable = docById("pdmDrumTable");
        row = drumTable.rows[0];
        cell = row.insertCell();
        cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
        cell.width = PitchDrumMatrix.DRUMNAMEWIDTH;
        cell.style.width = cell.width;
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

        cell.innerHTML =
            '&nbsp;&nbsp;<img src="' +
            getDrumIcon(name) +
            '" title="' +
            name +
            '" alt="' +
            name +
            '" height="' +
            PitchDrumMatrix.ICONSIZE +
            '" width="' +
            PitchDrumMatrix.ICONSIZE +
            '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.backgroundColor = platformColor.selectorBackground;
    }

    /**
     * Makes the matrix clickable, enabling user interaction.
     * 
     * @public
     * @returns {void}
     */
    makeClickable() {
        const pdmTable = docById("pdmTable");
        const drumTable = docById("pdmDrumTable");
        let table;
        let cellRow;
        let drumRow;
        let drumCell;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = docById("pdmCellTable" + i);
            cellRow = table.rows[0];

            for (let j = 0; j < cellRow.cells.length; j++) {
                cell = cellRow.cells[j];

                drumRow = drumTable.rows[0];
                // eslint-disable-next-line no-unused-vars
                drumCell = drumRow.cells[j];

                cell.onclick = (e) => {
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

                if (col === -1) {
                    continue;
                }

                // If we found a match, mark this cell and add this
                // note to the play list.
                table = docById("pdmCellTable" + row);
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
     * Handles the scaling of the widget.
     * 
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
     * Handles playing all pitch/drum combinations in the matrix.
     * 
     * @private
     * @returns {void}
     */
    _playAll() {
        // Play all of the pitch/drum combinations in the matrix.
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
                PitchDrumMatrix.ICONSIZE +
                '" width="' +
                PitchDrumMatrix.ICONSIZE +
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
                PitchDrumMatrix.ICONSIZE +
                '" width="' +
                PitchDrumMatrix.ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
            this._playing = false;
            return;
        }
        this.activity.logo.synth.stop();

        const pairs = [];

        // For each row (pitch), look for a drum.
        const pdmTable = docById("pdmTable");
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = docById("pdmCellTable" + i);
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
            if (pairs[i][1] != -1) {
                isEmpty = false;
                break;
            }
        }
        if (!isEmpty) {
            const ii = 0;
            if (ii < pairs.length) {
                this._playPitchDrum(ii, pairs);
            }
            setTimeout(() => {
                this._playing = false;
                icon.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/' +
                    "play-button.svg" +
                    '" title="' +
                    _("Play") +
                    '" alt="' +
                    _("Play") +
                    '" height="' +
                    PitchDrumMatrix.ICONSIZE +
                    '" width="' +
                    PitchDrumMatrix.ICONSIZE +
                    '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
            }, pairs.length * 1000);
        } else {
            if (!this.widgetWindow._maximized) {
                this.activity.textMsg(_("Click in the grid to map notes to drums."));
            }
            icon.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "play-button.svg" +
                '" title="' +
                _("Play") +
                '" alt="' +
                _("Play") +
                '" height="' +
                PitchDrumMatrix.ICONSIZE +
                '" width="' +
                PitchDrumMatrix.ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        }
    }

    /**
     * Plays the pitch and drum combination at the given index in the pairs array recursively.
     * 
     * @private
     * @param {number} i - The index indicating which pair of pitch and drum to play.
     * @param {Array<Array<number>>} pairs - An array containing pairs of pitch and drum indices.
     * @returns {void}
     */
    _playPitchDrum(i, pairs) {
        // Find the drum cell
        let pdmTable = docById("pdmTable");
        if (!this._playing) {
            for (let j = 0; j < i; j++) {
                pdmTable.rows[j].cells[0].style.backgroundColor = platformColor.labelColor;
            }
            const icon = this.playButton;
            icon.innerHTML =
                '&nbsp;&nbsp;<img src="header-icons/' +
                "play-button.svg" +
                '" title="' +
                _("Play") +
                '" alt="' +
                _("Play") +
                '" height="' +
                PitchDrumMatrix.ICONSIZE +
                '" width="' +
                PitchDrumMatrix.ICONSIZE +
                '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
            return;
        }
        const drumTable = docById("pdmDrumTable");
        let row = drumTable.rows[0];
        // const drumCell = row.cells[i];
        const table = docById("pdmCellTable" + i);
        row = table.rows[0];
        const cell = row.cells[i];

        pdmTable = docById("pdmTable");
        const pdmTableRow = pdmTable.rows[i];
        const pitchCell = pdmTableRow.cells[0];
        pitchCell.style.backgroundColor = platformColor.selectorBackground;

        if (pairs[i][1] !== -1) {
            this._setPairCell(pairs[i][0], pairs[i][1], cell, true);
        }

        if (i < pairs.length - 1) {
            setTimeout(() => {
                const ii = i + 1;
                this._playPitchDrum(ii, pairs);
            }, 1000);
        } else {
            setTimeout(() => {
                for (let ii = 0; ii < pdmTable.rows.length - 1; ii++) {
                    pdmTable.rows[ii].cells[0].style.backgroundColor = platformColor.labelColor;
                }
            }, 1000);
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
        const drumTable = docById("pdmDrumTable");
        let row = drumTable.rows[0];
        let table = docById("pdmCellTable" + rowi);
        row = table.rows[0];

        // For the moment, we can only have one drum per pitch, so
        // clear the row.
        let pitchBlock;
        let drumBlock;
        let cell;
        if (playNote) {
            let obj;
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
                    obj = cell.id.split(","); // row,column
                    this._setCellPitchDrum(Number(obj[0]), Number(obj[1]), false);
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

        table = docById("pdmCellTable" + rowi);
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
     * @returns {void}
     */
    _setPairCell(rowIndex, colIndex, cell, playNote) {
        const pdmTable = docById("pdmTable");
        let row = pdmTable.rows[rowIndex];
        const solfegeHTML = row.cells[0].innerHTML;

        const drumTable = docById("pdmDrumTable");
        row = drumTable.rows[0];
        const drumHTML = row.cells[colIndex].innerHTML.split('"');
        const drumName = getDrumSynthName(drumHTML[3]);

        // Both solfege and octave are extracted from HTML by getNote.
        const noteObj = getNote(
            solfegeHTML,
            -1,
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
                note.replace(/♭/g, "b").replace(/♯/g, "#"),
                0.125,
                "default",
                null,
                null
            );

            setTimeout(() => {
                this.activity.logo.synth.trigger(0, "C2", 0.125, drumName, null, null);
            }, waitTime);
        }
    }

    /**
     * Clears all the selections in the matrix.
     * 
     * @private
     * @returns {void}
     */
    _clear() {
        // "Unclick" every entry in the matrix.
        const pdmTable = docById("pdmTable");
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = docById("pdmCellTable" + i);
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

        const pdmTable = docById("pdmTable");
        const drumTable = docById("pdmDrumTable");

        // For each row (pitch), look for a drum.
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = docById("pdmCellTable" + i);
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
            solfegeHTML = cellRow.cells[0].innerHTML;

            drumRow = drumTable.rows[0];
            drumHTML = drumRow.cells[col].innerHTML.split('"');
            drumName = getDrumSynthName(drumHTML[3]);
            // Both solfege and octave are extracted from HTML by getNote.
            noteObj = getNote(
                solfegeHTML,
                -1,
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
