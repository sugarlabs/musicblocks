// Copyright (c) 2016-20 Walter Bender
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
init() : Initializes the matrix with pitch values.

_addDrums() : Makes the matrix according to each drum block.

makeClickable() : Makes the matrix clickable.

setPitchDrum() : Set pitch/drum cell in this.drumToPlay when user
clicks onto any clickable cell.

play() : Plays the drum matrix by calling playAllDrums();

save() : Saves the Drum Matrix in an array of blocks: Set
Drum and Pitch blocks.
*/

function PitchDrumMatrix() {
    const BUTTONDIVWIDTH = 295; // 5 buttons
    const DRUMNAMEWIDTH = 50;
    const OUTERWINDOWWIDTH = 128;
    const INNERWINDOWWIDTH = 50;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;

    this.rowLabels = [];
    this.rowArgs = [];
    this.drums = [];
    this._rests = 0;

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

    this.clearBlocks = function() {
        this._rowBlocks = [];
        this._colBlocks = [];
    };

    this.addRowBlock = function(pitchBlock) {
        this._rowBlocks.push(pitchBlock);
    };

    this.addColBlock = function(drumBlock) {
        this._colBlocks.push(drumBlock);
    };

    this.addNode = function(pitchBlock, drumBlock) {
        let obj;
        for (let i = 0; i < this._blockMap.length; i++) {
            obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === drumBlock) {
                return; // node is already in the list
            }
        }
        this._blockMap.push([pitchBlock, drumBlock]);
    };

    this.removeNode = function(pitchBlock, drumBlock) {
        let obj;
        for (let i = 0; i < this._blockMap.length; i++) {
            obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === drumBlock) {
                this._blockMap[i] = [-1, -1]; // Mark as removed
            }
        }
    };

    this._get_save_lock = function() {
        return this._save_lock;
    };

    this.init = function(logo) {
        // Initializes the pitch/drum matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        this._logo = logo;

        let w = window.innerWidth;
        this._cellScale = w / 1200;
        let iconSize = ICONSIZE * this._cellScale;

        let widgetWindow = window.widgetWindows.windowFor(this, "pitch drum");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
        widgetWindow.show();

        // For the button callbacks
        let that = this;

        widgetWindow.onclose = function() {
            pdmTableDiv.style.visibility = "hidden";
            that._logo.hideMsgs();
            this.destroy();
        };

        widgetWindow.addButton(
            "play-button.svg",
            ICONSIZE,
            _("Play")
        ).onclick = function() {
            that._logo.turtleDelay = 0;
            that._playAll();
        };

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            ICONSIZE,
            _("Save")
        ).onclick = function() {
            // Debounce button
            if (!that._get_save_lock()) {
                that._save_lock = true;
                that._save();
                setTimeout(function() {
                    that._save_lock = false;
                }, 1000);
            }
        };

        widgetWindow.addButton(
            "erase-button.svg",
            ICONSIZE,
            _("Clear")
        ).onclick = function() {
            that._clear();
        };

        this.pitchDrumDiv = document.createElement("div");
        widgetWindow.getWidgetBody().append(this.pitchDrumDiv);
        widgetWindow.getWidgetBody().style.height = "300px";
        widgetWindow.getWidgetBody().style.width = "300px";

        // The pdm table
        let pdmTableDiv = this.pitchDrumDiv;
        pdmTableDiv.style.display = "inline";
        pdmTableDiv.style.visibility = "visible";
        pdmTableDiv.style.border = "0px";
        pdmTableDiv.innerHTML = "";

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        pdmTableDiv.innerHTML =
            '<div id="pdmOuterDiv"><div id="pdmInnerDiv"><table cellpadding="0px" id="pdmTable"></table></div></div>';

        // Each row in the pdm table contains a note label in the
        // first column and a table of buttons in the second column.
        let pdmTable = docById("pdmTable");

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
            labelCell.style.height =
                Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            labelCell.style.width =
                Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
            labelCell.style.minWidth = labelCell.style.minWidth;
            labelCell.style.maxWidth = labelCell.style.minWidth;
            labelCell.className = "headcol";
            labelCell.innerHTML =
                this.rowLabels[j] + this.rowArgs[j].toString().sub();

            pdmCell = pdmTableRow.insertCell();
            // Create tables to store individual notes.
            pdmCell.innerHTML =
                '<table cellpadding="0px" id="pdmCellTable' +
                j +
                '"><tr></tr></table>';
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
        labelCell.style.height =
            Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
        labelCell.style.width =
            Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
        labelCell.style.minWidth =
            Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + "px";
        labelCell.style.maxWidth = labelCell.style.minWidth;
        labelCell.className = "headcol";
        labelCell.innerHTML = "";

        let n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);
        let outerDiv = docById("pdmOuterDiv");
        let ow;
        if (pdmTable.rows.length + 2 > n) {
            outerDiv.style.height = window.innerHeight / 2 + "px";
            ow = Math.max(
                Math.min(
                    window.innerWidth / 2,
                    this._cellScale *
                        (this.drums.length * (DRUMNAMEWIDTH + 2) +
                            MATRIXSOLFEWIDTH +
                            24)
                ),
                BUTTONDIVWIDTH
            ); // Add room for the vertical slider.
        } else {
            outerDiv.style.height =
                this._cellScale *
                    MATRIXSOLFEHEIGHT *
                    (pdmTable.rows.length + 3) +
                "px";
            ow = Math.max(
                Math.min(
                    window.innerWidth / 2,
                    this._cellScale *
                        (this.drums.length * (DRUMNAMEWIDTH + 2) +
                            MATRIXSOLFEWIDTH)
                ),
                BUTTONDIVWIDTH
            );
        }

        outerDiv.style.width = ow + "px";

        let innerDiv = docById("pdmInnerDiv");
        let iw = Math.min(
            ow - 100,
            this._cellScale * this.drums.length * (DRUMNAMEWIDTH + 2)
        );
        innerDiv.style.width = iw + "px";
        innerDiv.style.marginLeft = BUTTONSIZE * this._cellScale + "px";

        pdmCell = pdmTableRow.insertCell();
        // Create table to store drum names.
        pdmCell.innerHTML =
            '<table cellpadding="0px" id="pdmDrumTable"><tr></tr></table>';

        // Add any drum blocks here.
        for (let i = 0; i < this.drums.length; i++) {
            this._addDrum(i);
        }

        //Change widget size on fullscreen mode, else
        //revert back to original size on unfullscreen mode
        widgetWindow.onmaximize = function() {
            if (widgetWindow._maximized) {
                widgetWindow.getWidgetBody().style.position = "absolute";
                widgetWindow.getWidgetBody().style.height =
                    "calc(100vh - 80px)";
                widgetWindow.getWidgetBody().style.width = "200vh";
                docById("pdmOuterDiv").style.height = "calc(100vh - 80px)";
                docById("pdmOuterDiv").style.width = "calc(200vh - 64px)";
                docById("pdmInnerDiv").style.width = "calc(200vh - 64px)";
                widgetWindow.getWidgetBody().style.left = "70px";
            } else {
                widgetWindow.getWidgetBody().style.position = "relative";
                widgetWindow.getWidgetBody().style.left = "0px";
                widgetWindow.getWidgetBody().style.height = "300px";
                widgetWindow.getWidgetBody().style.width = "300px";
            }
        };

        this._logo.textMsg(_("Click in the grid to map notes to drums."));
    };

    /**
     * @deprecated
     */
    this._addButton = function(row, icon, iconSize, label) {
        let cell = row.insertCell(-1);
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
        cell.style.width = BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover = function() {
            this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        };

        cell.onmouseout = function() {
            this.style.backgroundColor = platformColor.selectorBackground;
        };

        return cell;
    };

    this._addDrum = function(drumIdx) {
        let drumname = this.drums[drumIdx];
        let pdmTable = docById("pdmTable");
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = docById("pdmCellTable" + i);
            row = table.rows[0];
            cell = row.insertCell();
            cell.style.height =
                Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.width = DRUMNAMEWIDTH;
            cell.style.width = cell.width;
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.backgroundColor = platformColor.selectorBackground;
            cell.style.border = "2px solid white";
            cell.style.borderRadius = "10px";

            cell.onmouseover = function() {
                if (this.style.backgroundColor !== "black") {
                    this.style.backgroundColor = platformColor.selectorSelected;
                }
            };
            cell.onmouseout = function() {
                if (this.style.backgroundColor !== "black") {
                    this.style.backgroundColor =
                        platformColor.selectorBackground;
                }
            };

            cell.setAttribute("id", i + "," + drumIdx); // row,column
        }

        let drumTable = docById("pdmDrumTable");
        row = drumTable.rows[0];
        cell = row.insertCell();
        cell.height =
            Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
        cell.width = DRUMNAMEWIDTH;
        cell.style.width = cell.width;
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height =
            Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + "px";
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
            ICONSIZE +
            '" width="' +
            ICONSIZE +
            '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.backgroundColor = platformColor.selectorBackground;
    };

    this.makeClickable = function() {
        // Once the entire matrix is generated, this function makes it
        // clickable.
        let pdmTable = docById("pdmTable");
        let drumTable = docById("pdmDrumTable");
        let table;
        let cellRow;
        let drumRow;
        let drumCell;
        let cell;
        let that = this;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = docById("pdmCellTable" + i);
            cellRow = table.rows[0];

            for (let j = 0; j < cellRow.cells.length; j++) {
                cell = cellRow.cells[j];

                drumRow = drumTable.rows[0];
                drumCell = drumRow.cells[j];

                cell.onclick = function() {
                    let rowcol = this.id.split(",");
                    if (this.style.backgroundColor === "black") {
                        this.style.backgroundColor =
                            platformColor.selectorBackground;
                        that._setCellPitchDrum(rowcol[1], rowcol[0], false);
                    } else {
                        this.style.backgroundColor = "black";
                        that._setCellPitchDrum(rowcol[1], rowcol[0], true);
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
    };

    this._playAll = function() {
        // Play all of the pitch/drum combinations in the matrix.
        this._logo.synth.stop();

        let pairs = [];

        // For each row (pitch), look for a drum.
        let pdmTable = docById("pdmTable");
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

        let ii = 0;
        if (ii < pairs.length) {
            this._playPitchDrum(ii, pairs);
        }
    };

    this._playPitchDrum = function(i, pairs) {
        // Find the drum cell
        let drumTable = docById("pdmDrumTable");
        let row = drumTable.rows[0];
        let drumCell = row.cells[i];

        let pdmTable = docById("pdmTable");
        let table = docById("pdmCellTable" + i);
        row = table.rows[0];
        let cell = row.cells[i];

        pdmTable = docById("pdmTable");
        let pdmTableRow = pdmTable.rows[i];
        let pitchCell = pdmTableRow.cells[0];
        pitchCell.style.backgroundColor = platformColor.selectorBackground;

        if (pairs[i][1] !== -1) {
            this._setPairCell(pairs[i][0], pairs[i][1], cell, true);
        }

        if (i < pairs.length - 1) {
            let that = this;
            setTimeout(function() {
                let ii = i + 1;
                that._playPitchDrum(ii, pairs);
            }, 1000);
        } else {
            setTimeout(function() {
                for (let ii = 0; ii < pdmTable.rows.length - 1; ii++) {
                    pdmTable.rows[ii].cells[0].style.backgroundColor =
                        platformColor.labelColor;
                }
            }, 1000);
        }
    };

    this._setCellPitchDrum = function(colIndex, rowIndex, playNote) {
        // Sets corresponding pitch/drum when user clicks on any cell and
        // plays them.
        let coli = Number(colIndex);
        let rowi = Number(rowIndex);

        // Find the drum cell
        let drumTable = docById("pdmDrumTable");
        let row = drumTable.rows[0];
        let drumCell = row.cells[coli];

        let pdmTable = docById("pdmTable");
        let table = docById("pdmCellTable" + rowi);
        row = table.rows[0];

        // For the moment, we can only have one drum per pitch, so
        // clear the row.
        let pitchBlock;
        let drumBlock;
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
                    cell.style.backgroundColor =
                        platformColor.selectorBackground;
                    obj = cell.id.split(","); // row,column
                    this._setCellPitchDrum(
                        Number(obj[0]),
                        Number(obj[1]),
                        false
                    );
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
    };

    this._setPairCell = function(rowIndex, colIndex, cell, playNote) {
        let pdmTable = docById("pdmTable");
        let row = pdmTable.rows[rowIndex];
        let solfegeHTML = row.cells[0].innerHTML;

        let drumTable = docById("pdmDrumTable");
        row = drumTable.rows[0];
        let drumHTML = row.cells[colIndex].innerHTML.split('"');
        let drumName = getDrumSynthName(drumHTML[3]);

        // Both solfege and octave are extracted from HTML by getNote.
        let noteObj = getNote(
            solfegeHTML,
            -1,
            0,
            this._logo.turtles.ithTurtle(0).singer.keySignature,
            false,
            null,
            this._logo.errorMsg
        );
        let note = noteObj[0] + noteObj[1];

        if (playNote) {
            let waitTime = Singer.defaultBPMFactor * 1000 * 0.25;
            this._logo.synth.trigger(
                0, note.replace(/♭/g, "b").replace(/♯/g, "#"), 0.125, "default", null, null
            );

            let that = this;
            setTimeout(function() {
                that._logo.synth.trigger(0, "C2", 0.125, drumName, null, null);
            }, waitTime);
        }
    };

    this._clear = function() {
        // "Unclick" every entry in the matrix.
        let pdmTable = docById("pdmTable");
        let table;
        let row;
        let cell;
        for (let i = 0; i < pdmTable.rows.length - 1; i++) {
            table = docById("pdmCellTable" + i);
            row = table.rows[0];
            for (let j = 0; j < row.cells.length; j++) {
                cell = row.cells[j];
                if (cell.style.backgroundColor === "black") {
                    cell.style.backgroundColor =
                        platformColor.selectorBackground;
                    this._setCellPitchDrum(j, i, false);
                }
            }
        }
    };

    this._save = function() {
        // Saves the current matrix as an action stack consisting of a
        // set drum and pitch blocks.

        // First, hide the palettes as they will need updating.
        for (let name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }
        this._logo.refreshCanvas();

        let pairs = [];

        let pdmTable = docById("pdmTable");
        let drumTable = docById("pdmDrumTable");

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

        let newStack = [
            [0, ["action", { collapsed: true }], 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "drums" }], 0, 0, [0]]
        ];
        let endOfStackIdx = 0;
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
                this._logo.turtles.ithTurtle(0).singer.keySignature,
                false,
                null,
                this._logo.errorMsg
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
            newStack.push([
                drumnameidx,
                ["drumname", { value: drumName }],
                0,
                0,
                [mapdrumidx]
            ]);
            newStack.push([
                pitchidx,
                "pitch",
                0,
                0,
                [mapdrumidx, notenameidx, octaveidx, null]
            ]);
            newStack.push([
                notenameidx,
                ["solfege", { value: SOLFEGECONVERSIONTABLE[pitch] }],
                0,
                0,
                [pitchidx]
            ]);
            newStack.push([
                octaveidx,
                ["number", { value: octave }],
                0,
                0,
                [pitchidx]
            ]);

            if (i === pairs.length - 1) {
                newStack.push([hiddenidx, "hidden", 0, 0, [mapdrumidx, null]]);
            } else {
                newStack.push([
                    hiddenidx,
                    "hidden",
                    0,
                    0,
                    [mapdrumidx, hiddenidx + 1]
                ]);
            }

            previousBlock = hiddenidx;
        }

        // Create a new stack for the chunk.
        console.debug(newStack);
        this._logo.blocks.loadNewBlocks(newStack);
    };
}
