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

const DRUMNAMEWIDTH = 50;


function PitchDrumMatrix() {
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
        console.log('init pitchdrummatrix');
        // Initializes the pitch/drum matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        this._logo = logo;

        docById('pitchdrummatrix').style.display = 'inline';
        console.log('setting pitchdrummatrix visible');
        docById('pitchdrummatrix').style.visibility = 'visible';
        docById('pitchdrummatrix').style.border = 2;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        docById('pitchdrummatrix').style.width = Math.floor(w / 2) + 'px';
        docById('pitchdrummatrix').style.overflowX = 'auto';

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

        var table = docById('drumTable');

        if (table !== null) {
            table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'drumTable');
        x.style.textAlign = 'center';

        var matrixDiv = docById('pitchdrummatrix');
        matrixDiv.style.paddingTop = 0 + 'px';
        matrixDiv.style.paddingLeft = 0 + 'px';
        matrixDiv.appendChild(x);
        var matrixDivPosition = matrixDiv.getBoundingClientRect();

        var table = docById('drumTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(matrixDivPosition.left) + 'px';
        row.style.top = Math.floor(matrixDivPosition.top) + 'px';

        var solfaCell = row.insertCell(-1);
        solfaCell.style.fontSize = this._cellScale * 100 + '%';
        solfaCell.innerHTML = '<b>' + _('Solfa') + '</b>';
        solfaCell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        solfaCell.style.minWidth = solfaCell.style.width;
        solfaCell.style.maxWidth = solfaCell.style.width;
        solfaCell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        solfaCell.style.backgroundColor = MATRIXLABELCOLOR;

        // Add the buttons to the top row.
        var iconSize = Math.floor(this._cellScale * 24);
        var that = this;

        var cell = this._addButton(row, 1, 'play-button.svg', iconSize, _('play'));
        cell.onclick=function() {
            that._logo.setTurtleDelay(0);
            that._playAll();
        }

        var cell = this._addButton(row, 2, 'export-chunk.svg', iconSize, _('save'));
        cell.onclick=function() {
            that._save();
        }

        var cell = this._addButton(row, 3, 'erase-button.svg', iconSize, _('clear'));
        cell.onclick=function() {
            that._clear();
        }

        var cell = this._addButton(row, 4, 'close-button.svg', iconSize, _('close'));
        cell.onclick=function() {
            docById('pitchdrummatrix').style.visibility = 'hidden';
            docById('pitchdrummatrix').style.border = 0;
        }

        var j = 0;
        console.log('notes ' + this.rowLabels + ' octave ' + this.rowArgs + ' drums ' + this.drums);
        var marginFromTop = Math.floor(matrixDivPosition.top + this._cellScale * 2 + parseInt(matrixDiv.style.paddingTop.replace('px', '')));
        for (var i = 0; i < this.rowLabels.length; i++) {
            if (this.rowLabels[i].toLowerCase() === _('rest')) {
                // In case there are rest notes included.
                this._rests += 1;
                continue;
            }

            var row = header.insertRow(i + 1);
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale + i * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            var cell = row.insertCell(0);
            cell.style.backgroundColor = MATRIXLABELCOLOR;
            cell.style.fontSize = this._cellScale * 100 + '%';

            var drumName = getDrumName(this.rowLabels[i]);
            if (drumName != null) {
                // if it is a drum, we'll make it a column below.
                this.drums.push(drumName);
                continue;
            } else {
                cell.innerHTML = this.rowLabels[i] + this.rowArgs[i].toString().sub();
            }

            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.maxWidth = cell.style.minWidth;
            cell.style.position = 'static';
            cell.style.left = Math.floor(matrixDivPosition.left + 2) + 'px';
            marginFromTop += parseInt(cell.style.height.replace('px', ''));
            j += 1;
        }

        var row = header.insertRow(this.rowLabels.length - this._rests + 1);
        row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale + i * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
        var cell = row.insertCell(0);
        cell.style.fontSize = this._cellScale * 75 + '%';
        cell.innerHTML = ''; // '<b>' + _('drum') + '</b>';
        cell.style.position = 'static';
        cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
        cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        cell.style.maxWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        cell.style.left = Math.floor(matrixDivPosition.left + 2) + 'px';
        cell.style.backgroundColor = MATRIXLABELCOLOR;
        cell.style.verticalAlign = "middle";

        // Add any drum blocks here.
        for (var i = 0; i < this.drums.length; i++) {
            this._addDrum(this.drums[i]);
        }

    };

    this._addButton = function(row, colIndex, icon, iconSize, label) {
        var table = docById('drumTable');
        var cell = row.insertCell();
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this._addDrum = function(drumname) {
        var table = docById('drumTable');

        var rowCount = this.rowLabels.length + 1 - this._rests;
        var iconSize = Math.floor(this._cellScale * 24);

        for (var i = 1; i <= rowCount; i++) {
            var row = table.rows[i];
            var cell = row.insertCell(-1);
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            cell.width = DRUMNAMEWIDTH;
            cell.style.width = cell.width;
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            if (i === rowCount) {
                cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                cell.style.fontSize = Math.floor(this._cellScale * 75) + '%';
                cell.style.lineHeight = 100 + '%';

                // Work around i8n bug in Firefox.
                var name = getDrumName(drumname);
                if (name === '') {
                    name = drumname;
                }
                cell.innerHTML = '&nbsp;&nbsp;<img src="' + getDrumIcon(name) + '" title="' + name + '" alt="' + name + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                // cell.innerHTML = name;
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
        var table = docById('drumTable');

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
        this._logo.synth.stop();

        var pairs = [];
        var table = docById('drumTable');

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
        var table = docById('drumTable');
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
    };

    this._setCellPitchDrum = function(colIndex, rowIndex, playNote) {
        // Sets corresponding pitch/drum when user clicks on any cell and
        // plays them.
        var table = docById('drumTable');

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
                     var pitchBlock = this._rowBlocks[rowIndex - 1];
                    var drumBlock = this._colBlocks[i - 1];
                    this.removeNode(pitchBlock, drumBlock);
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    this._setCellPitchDrum(cell.id, cell.parentNode.rowIndex, false);
                }
            }
        }

        var pitchBlock = this._rowBlocks[rowIndex - 1];
        var drumBlock = this._colBlocks[colIndex - 1];

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
        var table = docById('drumTable');
        var solfegeHTML = table.rows[j].cells[0].innerHTML;
        var drumHTML = table.rows[table.rows.length - 1].cells[colIndex].innerHTML.split('"');
        var drumName = getDrumSynthName(drumHTML[3]);
        // Both solfege and octave are extracted from HTML by getNote.
        var noteObj = this._logo.getNote(solfegeHTML, -1, 0, this._logo.keySignature[0]);
        var note = noteObj[0] + noteObj[1];

        if (playNote) {
            var waitTime = this._logo.defaultBPMFactor * 1000 * 0.25;
            this._logo.synth.trigger(note.replace(/♭/g, 'b').replace(/♯/g, '#'), 0.125, 'poly');

            var that = this;
            setTimeout(function() {
                that._logo.synth.trigger('C2', 0.125, drumName);
            }, waitTime);
        }
    };

    this._clear = function() {
        // "Unclick" every entry in the matrix.
        var table = docById('drumTable');

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
        // Saves the current matrix as an action stack consisting of a
        // set drum and pitch blocks.

        // First, hide the palettes as they will need updating.
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }
        this._logo.refreshCanvas();

        var pairs = [];
        var table = docById('drumTable');

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
            var drumHTML = table.rows[table.rows.length - 1].cells[col].innerHTML.split('"');
            var drumName = getDrumSynthName(drumHTML[3]);
            // Both solfege and octave are extracted from HTML by getNote.
            var noteObj = this._logo.getNote(solfegeHTML, -1, 0, this._logo.keySignature[0]);
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
