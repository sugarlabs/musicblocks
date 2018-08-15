// Copyright (c) 2016-18 Walter Bender
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
    const BUTTONDIVWIDTH = 295;  // 5 buttons
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
    this._rowBlocks = [];  // pitch-block number
    this._colBlocks = [];  // drum-block number

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
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === drumBlock) {
                return;  // node is already in the list
            }
        }
        this._blockMap.push([pitchBlock, drumBlock]);
    };

    this.removeNode = function(pitchBlock, drumBlock) {
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === drumBlock) {
                this._blockMap[i] = [-1, -1];  // Mark as removed
            }
        }
    };

    this.init = function(logo) {
        // Initializes the pitch/drum matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        this._logo = logo;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var pdmDiv = docById('pdmDiv');
        pdmDiv.style.visibility = 'visible';
        pdmDiv.setAttribute('draggable', 'true');
        pdmDiv.style.left = '200px';
        pdmDiv.style.top = '150px';

        // The pdm buttons
        var pdmButtonsDiv = docById('pdmButtonsDiv');
        pdmButtonsDiv.style.display = 'inline';
        pdmButtonsDiv.style.visibility = 'visible';
        pdmButtonsDiv.style.width = BUTTONDIVWIDTH;
        pdmButtonsDiv.innerHTML = '<table cellpadding="0px" id="pdmButtonTable"></table>';

        var buttonTable = docById('pdmButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        var cell = this._addButton(row, 'play-button.svg', ICONSIZE, _('play'));

        cell.onclick=function() {
            that._logo.setTurtleDelay(0);
            that._playAll();
        }

        var cell = this._addButton(row, 'export-chunk.svg', ICONSIZE, _('save'));

        cell.onclick=function() {
            that._save();
        }

        var cell = this._addButton(row, 'erase-button.svg', ICONSIZE, _('clear'));

        cell.onclick=function() {
            that._clear();
        }

        var cell = this._addButton(row,'close-button.svg', ICONSIZE, _('close'));

        cell.onclick=function() {
            pdmDiv.style.visibility = 'hidden';
            pdmButtonsDiv.style.visibility = 'hidden';
            pdmTableDiv.style.visibility = 'hidden';
            that._logo.hideMsgs();
        }

        // We use this cell as a handle for dragging.
        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - pdmDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - pdmDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
            dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function(e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                pdmDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                pdmDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        pdmDiv.ondragover = function(e) {
            e.preventDefault();
        };

        pdmDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                pdmDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                pdmDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        pdmDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        pdmDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The pdm table
        var pdmTableDiv = docById('pdmTableDiv');
        pdmTableDiv.style.display = 'inline';
        pdmTableDiv.style.visibility = 'visible';
        pdmTableDiv.style.border = '0px';
        pdmTableDiv.innerHTML = '';

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        pdmTableDiv.innerHTML = '<div id="pdmOuterDiv"><div id="pdmInnerDiv"><table cellpadding="0px" id="pdmTable"></table></div></div>';

        // Each row in the pdm table contains a note label in the
        // first column and a table of buttons in the second column.
        var pdmTable = docById('pdmTable');

        var j = 0;
        for (var i = 0; i < this.rowLabels.length; i++) {
            if (this.rowLabels[i].toLowerCase() === _('rest')) {
                // In case there are rest notes included.
                this._rests += 1;
                continue;
            }

            var drumName = getDrumName(this.rowLabels[i]);

            if (drumName != null) {
                // if it is a drum, we'll make it a column below.
                this.drums.push(drumName);
                continue;
            }

            var pdmTableRow = pdmTable.insertRow();

            // A cell for the row label
            var labelCell = pdmTableRow.insertCell();
            labelCell.style.backgroundColor = MATRIXLABELCOLOR;
            labelCell.style.fontSize = this._cellScale * 100 + '%';
            labelCell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + 'px';
            labelCell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            labelCell.style.minWidth = labelCell.style.minWidth;
            labelCell.style.maxWidth = labelCell.style.minWidth;
            labelCell.className = 'headcol';
            labelCell.innerHTML = this.rowLabels[j] + this.rowArgs[j].toString().sub();

            var pdmCell = pdmTableRow.insertCell();
            // Create tables to store individual notes.
            pdmCell.innerHTML = '<table cellpadding="0px" id="pdmCellTable' + j + '"><tr></tr></table>';
            var pdmCellTable = docById('pdmCellTable' + j);

            // We'll use this element to put the clickable notes for this row.
            var pdmRow = pdmCellTable.insertRow();
            pdmRow.setAttribute('id', 'pdm' + j);

            j += 1;
        }

        // An extra row for the note and tuplet values
        var pdmTableRow = pdmTable.insertRow();
        var labelCell = pdmTableRow.insertCell();
        labelCell.style.backgroundColor =  MATRIXRHYTHMCELLCOLOR;
        labelCell.style.fontSize = this._cellScale * 100 + '%';
        labelCell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
        labelCell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        labelCell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        labelCell.style.maxWidth = labelCell.style.minWidth;
        labelCell.className = 'headcol';
        labelCell.innerHTML = '';

        var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);
        var outerDiv = docById('pdmOuterDiv');
        if (pdmTable.rows.length + 2 > n) {
            outerDiv.style.height = window.innerHeight / 2 + 'px';
            var ow = Math.max(Math.min(window.innerWidth / 2, this._cellScale * (this.drums.length * (DRUMNAMEWIDTH + 2) + MATRIXSOLFEWIDTH + 24)), BUTTONDIVWIDTH);  // Add room for the vertical slider.
        } else {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (pdmTable.rows.length + 3) + 'px';
            var ow = Math.max(Math.min(window.innerWidth / 2, this._cellScale * (this.drums.length * (DRUMNAMEWIDTH + 2) + MATRIXSOLFEWIDTH)), BUTTONDIVWIDTH);
        }

        outerDiv.style.width = ow + 'px';

        var innerDiv = docById('pdmInnerDiv');
        var iw = Math.min(ow - 100, this._cellScale * this.drums.length * (DRUMNAMEWIDTH + 2));
        innerDiv.style.width = iw + 'px';
        innerDiv.style.marginLeft = (BUTTONSIZE * this._cellScale) + 'px';

        var pdmCell = pdmTableRow.insertCell();
        // Create table to store drum names.
        pdmCell.innerHTML = '<table cellpadding="0px" id="pdmDrumTable"><tr></tr></table>';

        // Add any drum blocks here.
        for (var i = 0; i < this.drums.length; i++) {
            this._addDrum(i);
        }

	this._logo.textMsg(_('Click in the grid to map notes to drums.'));
    };

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this._addDrum = function(drumIdx) {
        var drumname = this.drums[drumIdx];
        var pdmTable = docById('pdmTable');
        for (var i = 0; i < pdmTable.rows.length - 1; i++) {
            var table = docById('pdmCellTable' + i);
            var row = table.rows[0];
            var cell = row.insertCell();
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + 'px';
            cell.width = DRUMNAMEWIDTH;
            cell.style.width = cell.width;
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;

            cell.onmouseover=function() {
                if (this.style.backgroundColor !== 'black'){
                    this.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                }
            }
            cell.onmouseout=function() {
                if (this.style.backgroundColor !== 'black'){
                    this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                }
            }

            cell.setAttribute('id', i + ',' + drumIdx);  // row,column
        }

        var drumTable = docById('pdmDrumTable');
        var row = drumTable.rows[0];
        var cell = row.insertCell();
        cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 1 + 'px';
        cell.width = DRUMNAMEWIDTH;
        cell.style.width = cell.width;
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
        cell.style.fontSize = Math.floor(this._cellScale * 75) + '%';
        cell.style.lineHeight = 100 + '%';
        cell.setAttribute('id', drumIdx); // Column // row.cells.length - 1);

        // Work around i8n bug in Firefox.
        var name = getDrumName(drumname);
        if (name === '') {
            name = drumname;
        }

        cell.innerHTML = '&nbsp;&nbsp;<img src="' + getDrumIcon(name) + '" title="' + name + '" alt="' + name + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
    };

    this.makeClickable = function() {
        // Once the entire matrix is generated, this function makes it
        // clickable.
        var pdmTable = docById('pdmTable');
        var drumTable = docById('pdmDrumTable');

        for (var i = 0; i < pdmTable.rows.length - 1; i++) {
            var table = docById('pdmCellTable' + i);
            var cellRow = table.rows[0];
            var that = this;

            for (var j = 0; j < cellRow.cells.length; j++) {
                cell = cellRow.cells[j];

                var drumRow = drumTable.rows[0];
                var drumCell = drumRow.cells[j];

                cell.onclick = function() {
                    var rowcol = this.id.split(',');
                    if (this.style.backgroundColor === 'black') {
                        this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                        that._setCellPitchDrum(rowcol[1], rowcol[0], false);
                    } else {
                        this.style.backgroundColor = 'black';
                        that._setCellPitchDrum(rowcol[1], rowcol[0], true);
                    }
                }

            }
        }

        // Mark any cells found in the blockMap from previous
        // instances of the matrix.
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (obj[0] !== -1) {
                // Look for this note in the pitch and drum blocks.
                var row = this._rowBlocks.indexOf(obj[0]);
                var col = -1;
                for (var j = 0; j < this._colBlocks.length; j++) {
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
                var table = docById('pdmCellTable' + row);
                var cellRow = table.rows[0];

                var cell = cellRow.cells[col];

                if (cell != undefined) {
                    cell.style.backgroundColor = 'black';
                    this._setPairCell(row, col, cell, false);
                }
            }
        }
    };

    this._playAll = function() {
        // Play all of the pitch/drum combinations in the matrix.
        this._logo.synth.stop();

        var pairs = [];

        // For each row (pitch), look for a drum.
        var pdmTable = docById('pdmTable');
        for (var i = 0; i < pdmTable.rows.length - 1; i++) {
            var table = docById('pdmCellTable' + i);
            var row = table.rows[0];
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                if (cell.style.backgroundColor === 'black') {
                    pairs.push([i, j]);
                    break;
                }
            }

            if (j === row.cells.length) {
                pairs.push([i, -1]);
            }
        }

        var i = 0;
        if (i < pairs.length) {
            this._playPitchDrum(i, pairs);
        }
    };

    this._playPitchDrum = function(i, pairs) {
        // Find the drum cell
        var drumTable = docById('pdmDrumTable');
        var row = drumTable.rows[0];
        var drumCell = row.cells[i];

        var pdmTable = docById('pdmTable');
        var table = docById('pdmCellTable' + i);
        var row = table.rows[0];
        var cell = row.cells[i];

        var pdmTable = docById('pdmTable');
        var pdmTableRow = pdmTable.rows[i];
        var pitchCell = pdmTableRow.cells[0];
        pitchCell.style.backgroundColor = MATRIXBUTTONCOLOR;

        if (pairs[i][1] !== -1) {
            this._setPairCell(pairs[i][0], pairs[i][1], cell, true);
        }

        if (i < pairs.length - 1) {
            var that = this;
            setTimeout(function() {
                var ii = i + 1;
                that._playPitchDrum(ii, pairs);
            }, 1000);
        } else {
            setTimeout(function() {
                for (var i = 0; i < pdmTable.rows.length - 1; i++) {
                    var pdmTableRow = pdmTable.rows[i];
                    var pitchCell = pdmTableRow.cells[0];
                    pitchCell.style.backgroundColor = MATRIXLABELCOLOR;
                }
            }, 1000);
        }
    };

    this._setCellPitchDrum = function(colIndex, rowIndex, playNote) {
        // Sets corresponding pitch/drum when user clicks on any cell and
        // plays them.
        var coli = Number(colIndex);
        var rowi = Number(rowIndex);

        // Find the drum cell
        var drumTable = docById('pdmDrumTable');
        var row = drumTable.rows[0];
        var drumCell = row.cells[coli];

        var pdmTable = docById('pdmTable');
        var table = docById('pdmCellTable' + rowi);
        var row = table.rows[0];

        // For the moment, we can only have one drum per pitch, so
        // clear the row.
        if (playNote) {
            for (var i = 0; i < row.cells.length; i++) {
                if (i === coli) {
                    continue;
                }

                cell = row.cells[i];
                if (cell.style.backgroundColor === 'black') {
                    var pitchBlock = this._rowBlocks[rowi];
                    var drumBlock = this._colBlocks[i];
                    this.removeNode(pitchBlock, drumBlock);
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    var obj = cell.id.split(',');  // row,column
                    this._setCellPitchDrum(Number(obj[0]), Number(obj[1]), false);
                }
            }
        }

        var pitchBlock = this._rowBlocks[rowi];
        var drumBlock = this._colBlocks[coli];

        if (playNote) {
            this.addNode(pitchBlock, drumBlock);
        } else {
            this.removeNode(pitchBlock, drumBlock);
        }

        // if (table !== null) {
        var table = docById('pdmCellTable' + rowi);
        var row = table.rows[0];
        for (var i = 0; i < row.cells.length; i++) {
            cell = row.cells[i];
            if (cell.style.backgroundColor === 'black') {
                this._setPairCell(rowi, i, cell, playNote);
            }
        }
        // }
    };

    this._setPairCell = function(rowIndex, colIndex, cell, playNote) {
        var pdmTable = docById('pdmTable');
        var row = pdmTable.rows[rowIndex];
        var solfegeHTML = row.cells[0].innerHTML;

        var drumTable = docById('pdmDrumTable');
        var row = drumTable.rows[0];
        var drumHTML = row.cells[colIndex].innerHTML.split('"');
        var drumName = getDrumSynthName(drumHTML[3]);

        // Both solfege and octave are extracted from HTML by getNote.
        var noteObj = getNote(solfegeHTML, -1, 0, this._logo.keySignature[0], false, null, this._logo.errorMsg);
        var note = noteObj[0] + noteObj[1];

        if (playNote) {
            var waitTime = this._logo.defaultBPMFactor * 1000 * 0.25;
            this._logo.synth.trigger(0, note.replace(/♭/g, 'b').replace(/♯/g, '#'), 0.125, 'default', null, null);

            var that = this;
            setTimeout(function() {
                that._logo.synth.trigger(0, 'C2', 0.125, drumName, null, null);
            }, waitTime);
        }
    };

    this._clear = function() {
        // "Unclick" every entry in the matrix.
        var pdmTable = docById('pdmTable');

        for (var i = 0; i < pdmTable.rows.length - 1; i++) {
            var table = docById('pdmCellTable' + i);
            var row = table.rows[0];
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                if (cell.style.backgroundColor === 'black') {
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    this._setCellPitchDrum(j, i, false);
                }
            }
        }
    };

    this._save = function() {
        // Saves the current matrix as an action stack consisting of a
        // set drum and pitch blocks.

        // First, hide the palettes as they will need updating.
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }
        this._logo.refreshCanvas();

        var pairs = [];

        var pdmTable = docById('pdmTable');
        var drumTable = docById('pdmDrumTable');

        // For each row (pitch), look for a drum.
        for (var i = 0; i < pdmTable.rows.length - 1; i++) {
            var table = docById('pdmCellTable' + i);
            var row = table.rows[0];
            for (var j = 0; j < row.cells.length; j++) {
                var cell = row.cells[j];
                if (cell.style.backgroundColor === 'black') {
                    pairs.push([i, j]);
                    continue;
                }
            }
        }

        if (pairs.length === 0) {
            return;
        }

        var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, 2, null]], [1, ['text', {'value': 'drums'}], 0, 0, [0]]];
        var endOfStackIdx = 0;
        var previousBlock = 0;

        for (var i = 0; i < pairs.length; i++)
        {
            var row = pairs[i][0];
            var col = pairs[i][1];

            var cellRow = pdmTable.rows[row];
            var solfegeHTML = cellRow.cells[0].innerHTML;

            var drumRow = drumTable.rows[0];
            var drumHTML = drumRow.cells[col].innerHTML.split('"');
            var drumName = getDrumSynthName(drumHTML[3]);
            // Both solfege and octave are extracted from HTML by getNote.
            var noteObj = getNote(solfegeHTML, -1, 0, this._logo.keySignature[0], false, null, this._logo.errorMsg);
            var pitch = noteObj[0];
            var octave = noteObj[1];

            // Add the set drum block and its value
            var setdrumidx = newStack.length;
            var drumnameidx = setdrumidx + 1;
            var pitchidx = setdrumidx + 2;
            var notenameidx = setdrumidx + 3;
            var octaveidx = setdrumidx + 4;
            var hiddenidx = setdrumidx + 5;

            newStack.push([setdrumidx, 'setdrum', 0, 0, [previousBlock, drumnameidx, pitchidx, hiddenidx]]);
            newStack.push([drumnameidx, ['drumname', {'value': drumName}], 0, 0, [setdrumidx]]);
            newStack.push([pitchidx, 'pitch', 0, 0, [setdrumidx, notenameidx, octaveidx, null]]);
            newStack.push([notenameidx, ['solfege', {'value': SOLFEGECONVERSIONTABLE[pitch]}], 0, 0, [pitchidx]]);
            newStack.push([octaveidx, ['number', {'value': octave}], 0, 0, [pitchidx]]);

            if (i === pairs.length - 1) {
                newStack.push([hiddenidx, 'hidden', 0, 0, [setdrumidx, null]]);
            } else {
                newStack.push([hiddenidx, 'hidden', 0, 0, [setdrumidx, hiddenidx + 1]]);
            }

            var previousBlock = hiddenidx;
        }

        // Create a new stack for the chunk.
        console.log(newStack);
        this._logo.blocks.loadNewBlocks(newStack);
    };
};
