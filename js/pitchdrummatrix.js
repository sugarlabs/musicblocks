// Copyright (c) 2016 Walter Bender
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

const DRUMNAMEWIDTH = 24;


function PitchDrumMatrix() {
    this.cellWidth = 0;
    this.solfegeNotes = [];
    this.solfegeOctaves = [];
    this.rests = 0;
    this.drums = [];
    this.noteValue = 4;

    // The pitch-block number associated with a row; a drum block is
    // associated with a column. We need to keep track of which
    // intersections in the grid are populated.  The blockMap is a
    // list of selected nodes in the matrix that map pitch blocks to
    // drum blocks.

    // These arrays get created each time the matrix is built.
    this.rowBlocks = [];  // pitch-block number
    this.colBlocks = [];  // drum-block number

    // This array is preserved between sessions.
    // We populate the blockMap whenever a node is selected and
    // restore any nodes that might be present.
    this.blockMap = [];

    this.clearBlocks = function() {
        this.rowBlocks = [];
        this.colBlocks = [];
    };

    this.addRowBlock = function(pitchBlock) {
        this.rowBlocks.push(pitchBlock);
    };

    this.addColBlock = function(drumBlock) {
        this.colBlocks.push(drumBlock);
    };

    this.addNode = function(pitchBlock, drumBlock) {
        for (var i = 0; i < this.blockMap.length; i++) {
            var obj = this.blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === drumBlock) {
                return;  // node is already in the list
            }
        }
        this.blockMap.push([pitchBlock, drumBlock]);
    };

    this.removeNode = function(pitchBlock, drumBlock) {
        for (var i = 0; i < this.blockMap.length; i++) {
            var obj = this.blockMap[i];
            if (obj[0] === pitchBlock && obj[1] === drumBlock) {
                this.blockMap[i] = [-1, -1];  // Mark as removed
            }
        }
    };

    this.init = function(logo) {
        console.log('init pitchdrummatrix');
        // Initializes the pitch/drum matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        this.logo = logo;

        docById('pitchdrummatrix').style.display = 'inline';
        console.log('setting pitchdrummatrix visible');
        docById('pitchdrummatrix').style.visibility = 'visible';
        docById('pitchdrummatrix').style.border = 2;

        // FIXME: make this number based on canvas size.
        var w = window.innerWidth;
        this.cellScale = w / 1200;
        docById('pitchdrummatrix').style.width = Math.floor(w / 2) + 'px';
        docById('pitchdrummatrix').style.overflowX = 'auto';

        console.log('notes ' + this.solfegeNotes + ' octave ' + this.solfegeOctaves + ' dum ' + this.drums);

        // Used to remove the matrix table
        Element.prototype.remove = function() {
            this.parentElement.removeChild(this);
        }

        NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
            for (var i = 0, len = this.length; i < len; i++) {
                if (this[i] && this[i].parentElement) {
                    this[i].parentElement.removeChild(this[i]);
                }
            }
        };

        var table = docById('myTable');

        if (table !== null) {
            table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'myTable');
        x.style.textAlign = 'center';

        var matrixDiv = docById('pitchdrummatrix');
        matrixDiv.style.paddingTop = 0 + 'px';
        matrixDiv.style.paddingLeft = 0 + 'px';
        matrixDiv.appendChild(x);
        matrixDivPosition = matrixDiv.getBoundingClientRect();

        var table = docById('myTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(matrixDivPosition.left) + 'px';
        row.style.top = Math.floor(matrixDivPosition.top) + 'px';

        var solfaCell = row.insertCell(-1);
        solfaCell.style.fontSize = this.cellScale * 100 + '%';
        solfaCell.innerHTML = '<b>' + _('Solfa') + '</b>';
        solfaCell.style.width = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        solfaCell.style.minWidth = solfaCell.style.width;
        solfaCell.style.maxWidth = solfaCell.style.width;
        solfaCell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        solfaCell.style.backgroundColor = MATRIXLABELCOLOR;

        var iconSize = Math.floor(this.cellScale * 24);

        // Add the buttons to the top row.
        var thisMatrix = this;

        var cell = row.insertCell(1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisMatrix.logo.setTurtleDelay(0);
            thisMatrix._playAll();
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(2);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/export-chunk.svg" title="' + _('save') + '" alt="' + _('save') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisMatrix._save();
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(3);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/erase-button.svg" title="' + _('clear') + '" alt="' + _('clear') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisMatrix._clear();
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(4);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            docById('pitchdrummatrix').style.visibility = 'hidden';
            docById('pitchdrummatrix').style.border = 0;
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var j = 0;
        var marginFromTop = Math.floor(matrixDivPosition.top + this.cellScale * 2 + parseInt(matrixDiv.style.paddingTop.replace('px', '')));
        for (var i = 0; i < this.solfegeNotes.length; i++) {
            if (this.solfegeNotes[i].toLowerCase() === _('rest')) {
                // In case there are rest notes included.
                this.rests += 1;
                continue;
            }

            var row = header.insertRow(i + 1);
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale + i * MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
            var cell = row.insertCell(0);
            cell.style.backgroundColor = MATRIXLABELCOLOR;
            cell.style.fontSize = this.cellScale * 100 + '%';

            var drumName = getDrumName(this.solfegeNotes[i]);
            if (drumName != null) {
                // if it is a drum, we'll make it a column below.
                this.drums.push(drumName);
                continue;
            } else {
                cell.innerHTML = this.solfegeNotes[i] + this.solfegeOctaves[i].toString().sub();
            }

            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.maxWidth = cell.style.minWidth;
            cell.style.position = 'fixed';
            cell.style.left = Math.floor(matrixDivPosition.left + 2) + 'px';
            marginFromTop += parseInt(cell.style.height.replace('px', ''));
            j += 1;
        }

        var row = header.insertRow(this.solfegeNotes.length - this.rests + 1);
        row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale + i * MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
        var cell = row.insertCell(0);
        cell.style.fontSize = this.cellScale * 75 + '%';
        cell.innerHTML = ''; // '<b>' + _('drum') + '</b>';
        cell.style.position = 'fixed';
        cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
        cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        cell.style.maxWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        cell.style.left = Math.floor(matrixDivPosition.left + 2) + 'px';
        cell.style.backgroundColor = MATRIXLABELCOLOR;
        cell.style.verticalAlign = "middle";

        // Add any drum blocks here.
        for (var i = 0; i < this.drums.length; i++) {
            this._addDrum(this.drums[i]);
        }

    };

    this._addDrum = function(drumname) {
        var table = docById('myTable');

        var rowCount = this.solfegeNotes.length + 1 - this.rests;

        for (var i = 1; i <= rowCount; i++) {
            var row = table.rows[i];
            var cell = row.insertCell(-1);
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
            cell.width = DRUMNAMEWIDTH;
            cell.style.width = cell.width;
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            if (i === rowCount) {
                cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
                cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
                cell.style.fontSize = Math.floor(this.cellScale * 75) + '%';
                cell.style.lineHeight = 100 + '%';
                cell.innerHTML = getDrumName(drumname);
                cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
            } else {
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
            }

            cell.setAttribute('id', table.rows[1].cells.length - 1);
        }
    };

    this.makeClickable = function() {
        // Once the entire matrix is generated, this function makes it
        // clickable.
        var table = docById('myTable');

        for (var i = 1; i < table.rows[1].cells.length; i++) {
            for (var j = 1; j < table.rows.length - 1; j++) {
                cell = table.rows[j].cells[i];
                if (cell.style.backgroundColor === 'black') {
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    cell.style.backgroundColor = 'black';
                    this._setCellPitchDrum(i, cell.parentNode.rowIndex, false);
                }
            }
        }

        for (var i = 1; i < table.rows[1].cells.length; i++) {
            for (var j = 1; j < table.rows.length - 1; j++) {
                var cell = table.rows[j].cells[i];
                var that = this;
                cell.onclick = function() {
                    if (this.style.backgroundColor === 'black') {
                        this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                        that._setCellPitchDrum(this.id, this.parentNode.rowIndex, false);
                    } else {
                        this.style.backgroundColor = 'black';
                        that._setCellPitchDrum(this.id, this.parentNode.rowIndex, true);
                    }
                }
            }
        }

        // Mark any cells found in the blockMap from previous
        // instances of the matrix.
        for (var i = 0; i < this.blockMap.length; i++) {
            var obj = this.blockMap[i];
            if (obj[0] !== -1) {
                // Look for this note in the pitch and drum blocks.
                var row = this.rowBlocks.indexOf(obj[0]);
                var col = -1;
                for (var j = 0; j < this.colBlocks.length; j++) {
                    if (this.colBlocks[j] === obj[1]) {
                        col = j;
                        break;
                    }
                }
                if (col == -1) {
                    continue;
                }

                // If we found a match, mark this cell and add this
                // note to the play list.
                var cell = table.rows[row + 1].cells[col + 1];
                if (cell != undefined) {
                    cell.style.backgroundColor = 'black';
                    this._setPairCell(row + 1, col + 1, cell, false, null);
                }
            }
        }
    };

    this._playAll = function() {
        // Play all of the pitch/drum combinations in the matrix.
        this.logo.synth.stop();

        var pairs = [];
        var table = docById('myTable');

        // For each row (pitch), look for a drum.
        for (var i = 1; i < table.rows.length - 1; i++) {
            for (var j = 1; j < table.rows[i].cells.length; j++) {
                var cell = table.rows[i].cells[j];
                if (cell.style.backgroundColor === 'black') {
		    pairs.push([i, j]);
                    break;
                }
            }
            if (j === table.rows[i].cells.length) {
		pairs.push([i, -1]);
            }
        }

        var i = 0;
        if (i < pairs.length) {
            this._playPitchDrum(i, pairs);
        }
    };

    this._playPitchDrum = function(i, pairs) {
        var table = docById('myTable');
        var cell = table.rows[i + 1].cells[i];
        var pitchCell = table.rows[i + 1].cells[0];
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
                for (var i = 1; i < table.rows.length - 1; i++) {
                    var pitchCell = table.rows[i].cells[0];
                    pitchCell.style.backgroundColor = MATRIXLABELCOLOR;
                }
	    }, 1000);
	}
    }

    this._setCellPitchDrum = function(colIndex, rowIndex, playNote) {
        // Sets corresponding pitch/drum when user clicks on any cell and
        // plays them.
        var table = docById('myTable');

        var coli = Number(colIndex);
        // For the moment, we can only have one drum per pitch, so
        // clear the row.
        if (playNote) {
            for (var i = 1; i < table.rows[1].cells.length; i++) {
                if (i === coli) {
                    continue;
                }
                cell = table.rows[rowIndex].cells[i];
                if (cell.style.backgroundColor === 'black') {
                     var pitchBlock = this.rowBlocks[rowIndex - 1];
                    var drumBlock = this.colBlocks[i - 1];
                    this.removeNode(pitchBlock, drumBlock);
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    this._setCellPitchDrum(cell.id, cell.parentNode.rowIndex, false);
                }
            }
        }

        var pitchBlock = this.rowBlocks[rowIndex - 1];
        var drumBlock = this.colBlocks[colIndex - 1];

        if (playNote) {
            this.addNode(pitchBlock, drumBlock);
        } else {
            this.removeNode(pitchBlock, drumBlock);
        }

        if (table !== null) {
            for (var i = 1; i < table.rows[1].cells.length; i++) {
                cell = table.rows[rowIndex].cells[i];
                if (cell.style.backgroundColor === 'black') {
                    this._setPairCell(rowIndex, i, cell, playNote);
                }
            }
        }
    };

    this._setPairCell = function(j, colIndex, cell, playNote) {
        var table = docById('myTable');
        var solfegeHTML = table.rows[j].cells[0].innerHTML;
        var drumHTML = table.rows[table.rows.length - 1].cells[colIndex].innerHTML;

        var drumName = getDrumSynthName(drumHTML);
        // Both solfege and octave are extracted from HTML by getNote.
        var noteObj = this.logo.getNote(solfegeHTML, -1, 0, this.logo.keySignature[0]);
        var note = noteObj[0] + noteObj[1];

        if (playNote) {
            var waitTime = this.logo.defaultBPMFactor * 1000 * 0.25;
            this.logo.synth.trigger(note.replace(/♭/g, 'b').replace(/♯/g, '#'), 0.125, 'poly');
            var that = this;
            setTimeout(function() {
                that.logo.synth.trigger('C2', 0.125, drumName);
            }, waitTime);
        }
    };

    this._clear = function() {
        // "Unclick" every entry in the matrix.
        var table = docById('myTable');

        var leaveRowsFromBottom = 1;

        if (table !== null) {
            for (var i = 1; i < table.rows[1].cells.length; i++) {
                for (var j = 1; j < table.rows.length - 1; j++) {
                    var cell = table.rows[j].cells[i];
                    if (cell.style.backgroundColor === 'black') {
                        cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                        this.pitchDrumToPlay[cell.id - 1][0] = ['R'];
                        this._setCellPitchDrum(cell.id, cell.parentNode.rowIndex, false);
                    }
                }
            }
        }
    };

    this._save = function() {
        /* Saves the current matrix as an action stack consisting of
         * set drum and pitch blocks. */

        // FIXME: Consolidate pitches into drum blocks.

        // First, hide the palettes as they will need updating.
        for (var name in this.logo.blocks.palettes.dict) {
            this.logo.blocks.palettes.dict[name].hideMenu(true);
        }
        this.logo.refreshCanvas();

        var pairs = [];
        var table = docById('myTable');

        // For each row (pitch), look for a drum.
        for (var i = 1; i < table.rows.length - 1; i++) {
            for (var j = 1; j < table.rows[i].cells.length; j++) {
                var cell = table.rows[i].cells[j];
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
            var solfegeHTML = table.rows[row].cells[0].innerHTML;
            var drumHTML = table.rows[table.rows.length - 1].cells[col].innerHTML;

            var drumName = getDrumSynthName(drumHTML);
            // Both solfege and octave are extracted from HTML by getNote.
            var noteObj = this.logo.getNote(solfegeHTML, -1, 0, this.logo.keySignature[0]);
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
        this.logo.blocks.loadNewBlocks(newStack);
    };
};
