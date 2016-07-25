// Copyright (c) 2015 Yash Khandelwal
// Copyright (c) 2015,16 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA


function Matrix() {
    // Note: solfegeNotes can contain either a pitch or a drum
    this.solfegeNotes = [];
    this.solfegeOctaves = [];
    this.playDirection = 1;

    this._notesToPlay = [];
    this._notesToPlayDirected = [];
    this._matrixHasTuplets = false;
    this._noteValue = 4;
    this._notesCounter = 0;

    // The pitch-block number associated with a row; a rhythm block is
    // associated with a column. We need to keep track of which
    // intersections in the grid are populated.  The blockMap is a
    // list of selected nodes in the matrix that map pitch blocks to
    // rhythm blocks (note that rhythm blocks can span multiple
    // columns).

    // These arrays get created each time the matrix is built.
    this._rowBlocks = [];  // pitch-block number
    this._colBlocks = [];  // [rhythm-block number, note number]

    // This array is preserved between sessions.
    // We populate the blockMap whenever a note is selected and
    // restore any notes that might be present.

    this._blockMap = [];

    this.clearBlocks = function() {
        this._rowBlocks = [];
        this._colBlocks = [];
    };

    this.addRowBlock = function(pitchBlock) {
        this._rowBlocks.push(pitchBlock);
    };

    this.addColBlock = function(rhythmBlock, n) {
        // Search for previous instance of the same block (from a repeat)
        var startIdx = 0;
        for (var i = 0; i < this._colBlocks.length; i++) {
            var obj = this._colBlocks[i];
            if (obj[0] === rhythmBlock) {
                startIdx += 1;
            }
        }

        for (var i = startIdx; i < n + startIdx; i++) {
            this._colBlocks.push([rhythmBlock, i]);
        }
    };

    this.addNode = function(pitchBlock, rhythmBlock, n) {
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                return;  // node is already in the list
            }
        }
        this._blockMap.push([pitchBlock, [rhythmBlock, n]]);
    };

    this.removeNode = function(pitchBlock, rhythmBlock, n) {
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (obj[0] === pitchBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                this._blockMap[i] = [-1, [-1, 1, 0]];  // Mark as removed
            }
        }
    };

    this.init = function(logo) {
        // Initializes the matrix. First removes the previous matrix
        // and them make another one in DOM (document object model)
        this._rests = 0;
        this._logo = logo;

        docById('pitchtimematrix').style.display = 'inline';
        docById('pitchtimematrix').style.visibility = 'visible';
        docById('pitchtimematrix').style.border = 2;

        // FIXME: make this number based on canvas size.
        var w = window.innerWidth;
        this._cellScale = w / 1200;
        docById('pitchtimematrix').style.width = Math.floor(w / 2) + 'px';
        docById('pitchtimematrix').style.overflowX = 'auto';

        console.log('notes ' + this.solfegeNotes + ' octave ' + this.solfegeOctaves);

        this._notesToPlay = [];
        this._notesToPlayDirected = [];
        this._matrixHasTuplets = false;

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

        var table = docById('pitchTimeTable');

        if (table !== null) {
            table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'pitchTimeTable');
        x.style.textAlign = 'center';

        var matrixDiv = docById('pitchtimematrix');
        matrixDiv.style.paddingTop = 0 + 'px';
        matrixDiv.style.paddingLeft = 0 + 'px';
        matrixDiv.appendChild(x);
        var matrixDivPosition = matrixDiv.getBoundingClientRect();

        var table = docById('pitchTimeTable');
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
        var that = this;
        var iconSize = Math.floor(this._cellScale * 24);

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

        var cell = this._addButton(row, 4, 'export-button.svg', iconSize, _('export'));
        cell.onclick=function() {
            that._export();
        }

        var cell = this._addButton(row, 5, 'close-button.svg', iconSize, _('close'));
        cell.onclick=function() {
            docById('pitchtimematrix').style.visibility = 'hidden';
            docById('pitchtimematrix').style.border = 0;
        }

        var j = 0;
        var marginFromTop = Math.floor(matrixDivPosition.top + this._cellScale * 2 + parseInt(matrixDiv.style.paddingTop.replace('px', '')));
        for (var i = 0; i < this.solfegeNotes.length; i++) {
            if (this.solfegeNotes[i].toLowerCase() === 'rest') {
                this._rests += 1;
                continue;
            }

            var row = header.insertRow(i + 1);
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale + i * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            var cell = row.insertCell(0);
            cell.style.backgroundColor = MATRIXLABELCOLOR;
            cell.style.fontSize = this._cellScale * 100 + '%';

            var drumName = getDrumName(this.solfegeNotes[i]);
            if (drumName != null) {
                console.log('drumName is: ' + drumName + ' (' + this.solfegeNotes[i] + ')');
		cell.innerHTML = '&nbsp;&nbsp;<img src="' + getDrumIcon(drumName) + '" title="' + drumName + '" alt="' + drumName + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            } else if (this.solfegeNotes[i].slice(0, 4) === 'http') {
		cell.innerHTML = '&nbsp;&nbsp;<img src="' + getDrumIcon(this.solfegeNotes[i]) + '" title="' + this.solfegeNotes[i] + '" alt="' + this.solfegeNotes[i] + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            } else {
                cell.innerHTML = this.solfegeNotes[i] + this.solfegeOctaves[i].toString().sub();
            }

            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.maxWidth = cell.style.minWidth;
            cell.style.position = 'fixed';
            cell.style.left = Math.floor(matrixDivPosition.left + 2) + 'px';
            // cell.style.top = Math.floor(marginFromTop + (i * this._cellScale * 2)) + 'px';
            marginFromTop += parseInt(cell.style.height.replace('px', ''));
            j += 1;
        }

        var row = header.insertRow(this.solfegeNotes.length - this._rests + 1);
        row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale + i * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
        var cell = row.insertCell(0);
        cell.style.fontSize = this._cellScale * 75 + '%';
        cell.innerHTML = _('note value');
        cell.style.position = 'fixed';
        cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
        cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        cell.style.maxWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        cell.style.left = Math.floor(matrixDivPosition.left + 2) + 'px';
        // cell.style.top = Math.floor(marginFromTop + (i * this._cellScale * 2)) + 'px';
        cell.style.backgroundColor = MATRIXLABELCOLOR;
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

    this._generateDataURI = function(file) {
        // Deprecated since we now use SVG for note artwork.
        /*
        file=file.replace(/𝅝/g,"&#x1D15D;");
        file=file.replace(/𝅗𝅥/g,"&#x1D15E;");
        file=file.replace(/𝅘𝅥/g,"&#x1D15F;");
        file=file.replace(/𝅘𝅥𝅮/g,"&#x1D160;");
        file=file.replace(/𝅘𝅥𝅯/g,"&#x1D161;");
        file=file.replace(/𝅘𝅥𝅰/g,"&#x1D162;");
        file=file.replace(/𝅘𝅥𝅱/g,"&#x1D163;");
        */
        var data = "data:text/html;charset=utf-8," + encodeURIComponent(file);
        return data;
    };

    this._export = function() {
        var table = docById('pitchTimeTable');

        var exportWindow = window.open('');
        var exportDocument = exportWindow.document;
        var title = exportDocument.createElement('title');
        title.innerHTML = 'Music Matrix';
        exportDocument.head.appendChild(title);

        var w = exportDocument.createElement('H3');
        w.innerHTML = 'Music Matrix';

        exportDocument.body.appendChild(w);

        var x = exportDocument.createElement('TABLE');
        x.setAttribute('id', 'exportTable');
        x.style.textAlign = 'center';

        exportDocument.body.appendChild(x);

        var exportTable = exportDocument.getElementById('exportTable');

        var header = exportTable.createTHead();

        for (var i = 1, row; row = table.rows[i]; i++) {
            var exportRow = header.insertRow(i - 1);
            for (var j = 0, col; col=row.cells[j]; j++) {
                var exportCell = exportRow.insertCell(j);
                exportCell.style.backgroundColor = col.style.backgroundColor;
                exportCell.innerHTML = col.innerHTML;
                exportCell.width = col.width;
                if(exportCell.width == ""){
                    exportCell.width = col.style.width;
                }
                exportCell.colSpan = col.colSpan;
                exportCell.style.minWidth = col.style.width;
                exportCell.style.maxWidth = col.style.width;
                exportCell.height = 30 + 'px';
                exportCell.style.fontSize = 14 + 'px';
                exportCell.style.padding = 1 + 'px';
            }
        }

        var saveDocument = exportDocument;
        var uriData = saveDocument.documentElement.outerHTML;
        exportDocument.body.innerHTML+='<br><a id="downloadb1" style="background:#C374E9;' + 'border-radius:5%;' + 'padding:0.3em;' + 'text-decoration:none;' + 'margin:0.5em;' + 'color:white;" ' + 'download>Download Matrix</a>';
        exportDocument.getElementById("downloadb1").download = "MusicMatrix";
        exportDocument.getElementById("downloadb1").href = this._generateDataURI(uriData);
        exportDocument.close();
    };

    // Deprecated
    this.note2Solfege = function(note, index) {
        if (['♭', '♯'].indexOf(note[1]) === -1) {
            var octave = note[1];
            var newNote = SOLFEGECONVERSIONTABLE[note[0]];
        } else {
            var octave = note[2];
            var newNote = SOLFEGECONVERSIONTABLE[note.substr(0,2)];
        }
        this.solfegeNotes[index] = newNote;
        this.solfegeOctaves[index] = octave;
    };

    this.addTuplet = function(param) {
        // The first two parameters are the interval for the tuplet,
        // e.g., 1/4; the rest of the parameters are the list of notes
        // to be added to the tuplet, e.g., 1/8, 1/8, 1/8.

        var table = docById('pitchTimeTable');
        var tupletTimeFactor = param[0][0] / param[0][1];
        var numberOfNotes = param[1].length;
        var totalNoteInterval = 0;
        for (var i = 0; i < numberOfNotes; i++) {
            totalNoteInterval += 32 / param[1][i];
        }

        // Add the cells for each tuplet note
        if (this._matrixHasTuplets) {
            // Extra rows for tuplets have already been added.
            var rowCount = table.rows.length - 3;
        } else {
            var rowCount = table.rows.length - 1;
        }

        for (var i = 1; i < rowCount; i++) {
            row = table.rows[i];
            for (var j = 0; j < numberOfNotes; j++) {
                cell = row.insertCell(-1);
                cell.setAttribute('id', table.rows[i].cells.length - 1);
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
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
        }

        // Set the cells to "rest"
        for (var j = 0; j < numberOfNotes; j++) {
            // The tuplet time factor * percentage of the tuplet that
            // is dedicated to this note
            this._notesToPlay.push([['R'], (totalNoteInterval * param[0][1]) / (32 / param[1][j])]);
        }

        if (this._matrixHasTuplets) {
            var row = table.rows[table.rows.length - 2];
        } else {
            var row = table.insertRow(table.rows.length - 1);
            var cell = row.insertCell(-1);
            cell.style.fontSize = this._cellScale * 75 + '%';
            cell.style.position = 'fixed';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.minWidth;
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            cell.style.left = Math.floor(matrixDivPosition.left + 2) + 'px';
            // cell.style.top = matrixDivPosition.top + (table.rows.length - 1) * cell.style.height + 'px';
            cell.innerHTML = _('tuplet value');
            cell.style.backgroundColor = MATRIXLABELCOLOR;
        }

        var w = window.innerWidth;
        w = (2 * w) / 5;

        cell = table.rows[table.rows.length - 1].insertCell(-1);
        cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';

        var noteValue = param[0][1] / param[0][0];
        var noteValueToDisplay = calcNoteValueToDisplay(param[0][1], param[0][0]);

        cell.colSpan = numberOfNotes;
        cell.style.fontSize = Math.floor(this._cellScale * 75) + '%';
        cell.style.lineHeight = 60 + '%';
        cell.style.width = this._noteWidth(noteValue);
        cell.style.minWidth = this._noteWidth(noteValue);
        cell.style.maxWidth = this._noteWidth(noteValue);
        cell.innerHTML = noteValueToDisplay;
        cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;

        var tupletCol = table.rows[table.rows.length - 1].cells.length - 2;
        for (var i = 0; i < table.rows[table.rows.length - 1].cells.length - 1; i++) {
            // Add an entry for the tuplet value in any rhythm
            // columns. If we already have tuplets, just add a cell to
            // the new tuplet column.
            if (!this._matrixHasTuplets || i === tupletCol) {
                cell = row.insertCell(i + 1);
                cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                if (i === tupletCol) {
                    cell.style.fontSize = Math.floor(this._cellScale * 75) + '%';
                    cell.innerHTML = numberOfNotes.toString();
                    cell.colSpan = numberOfNotes;
                }
            }
        }

        if (this._matrixHasTuplets) {
            var row = table.rows[table.rows.length - 3];
        } else {
            // Add row for tuplet note values
            var row = table.insertRow(table.rows.length - 2);
            var cell = row.insertCell(-1);
            cell.style.position = 'fixed';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            cell.style.left = matrixDivPosition.left + 2 + 'px';
            // cell.style.top = matrixDivPosition.top + (table.rows.length - 2) * cell.style.height + 'px';
            cell.style.fontSize = this._cellScale * 75 + '%';
            cell.innerHTML = _('note value');
            cell.style.backgroundColor = MATRIXLABELCOLOR;
        }

        if (this._matrixHasTuplets) {
            // Just add the new tuplet note values
            var tupletCol = 0;
            var cellCount = param[1].length;
            var firstCell = 0;
        } else {
            // Add cells across all of tuplet note values row.
            var tupletCol = table.rows[table.rows.length - 1].cells.length - 2;
            var cellCount = table.rows[table.rows.length - 4].cells.length - 1;
            var firstCell = 0;
        }

        for (var i = firstCell; i < cellCount; i++) {
            // Add cell for tuplet note values
            cell = row.insertCell(-1);
            cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            // Add tuplet note values
            if (i >= tupletCol) {
                var j = i - tupletCol;
                var numerator = 32 / param[1][j];
                cell.style.lineHeight = 60 + '%';
                cell.style.fontSize = this._cellScale * 75 + '%';
                var obj = toFraction(numerator / (totalNoteInterval / tupletTimeFactor));
                if (NOTESYMBOLS != undefined && obj[1] in NOTESYMBOLS) {
                       cell.innerHTML = obj[0] + '<br>&mdash;<br>' + obj[1] + '<br>' + '<img src="' + NOTESYMBOLS[obj[1]] + '" height=' + (MATRIXSOLFEHEIGHT / 2) * this._cellScale + '>';
                } else {
                       cell.innerHTML = obj[0] + '<br>&mdash;<br>' + obj[1] + '<br><br>';
                }
            }
        }

        this._matrixHasTuplets = true;
    };

    this._noteWidth = function (noteValue) {
        return Math.floor(EIGHTHNOTEWIDTH * (8 / noteValue) * this._cellScale) + 'px';
    };

    this.addNotes = function(numBeats, noteValue) {
        var table = docById('pitchTimeTable');
        var noteValueToDisplay = calcNoteValueToDisplay(noteValue, 1);

        if (this._noteValue > noteValue) {
            this._noteValue = noteValue;
        }

        for (var i = 0; i < numBeats; i++) {
            this._notesToPlay.push([['R'], noteValue]);
        }

        if (this._matrixHasTuplets) {
            var rowCount = this.solfegeNotes.length + 3 - this._rests;
        } else {
            var rowCount = this.solfegeNotes.length + 1 - this._rests;
        }

        for (var j = 0; j < numBeats; j++) {
            for (var i = 1; i <= rowCount; i++) {
                var row = table.rows[i];
                var cell = row.insertCell(-1);
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                cell.width = this._noteWidth(noteValue);
                cell.style.width = cell.width;
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                if (i === rowCount) {
                    cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                    cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                    cell.style.fontSize = Math.floor(this._cellScale * 75) + '%';
                    cell.style.lineHeight = 60 + '%';
                    cell.innerHTML = noteValueToDisplay;
                    cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                } else if (this._matrixHasTuplets && i > this.solfegeNotes.length - this._rests) {
                    // We may need to insert some blank cells in the extra rows
                    // added by tuplets.
                    cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
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
        }
    };

    this.makeClickable = function() {
        // Once the entire matrix is generated, this function makes it
        // clickable.
        var table = docById('pitchTimeTable');
        if (this._matrixHasTuplets) {
            var leaveRowsFromBottom = 3;
        } else {
            var leaveRowsFromBottom = 1;
        }

        for (var i = 1; i < table.rows[1].cells.length; i++) {
            for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++) {
                cell = table.rows[j].cells[i];
                if (cell.style.backgroundColor === 'black') {
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    cell.style.backgroundColor = 'black';
                    this._setNotes(i, cell.parentNode.rowIndex, false);
                }
            }
        }

        for (var i = 1; i < table.rows[1].cells.length; i++) {
            for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++) {
                var cell = table.rows[j].cells[i];
                var that = this;
                cell.onclick = function() {
                    if (this.style.backgroundColor === 'black') {
                        this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                        that._notesToPlay[this.id - 1][0] = ['R'];
                        that._setNotes(this.id, this.parentNode.rowIndex, false);
                    } else {
                        this.style.backgroundColor = 'black';
                        that._setNotes(this.id, this.parentNode.rowIndex, true);
                    }
                }
            }
        }

        // Mark any cells found in the blockMap from previous
        // instances of the matrix.
        for (var i = 0; i < this._blockMap.length; i++) {
            var obj = this._blockMap[i];
            if (obj[0] !== -1) {
                // Look for this note in the pitch and rhythm blocks.
                var row = this._rowBlocks.indexOf(obj[0]);
                var col = -1;
                for (var j = 0; j < this._colBlocks.length; j++) {
                    if (this._colBlocks[j][0] === obj[1][0] && this._colBlocks[j][1] === obj[1][1]) {
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
                    if (this._notesToPlay[col][0][0] === 'R') {
                        this._notesToPlay[col][0] = [];
                    }
                    this._setNoteCell(row + 1, col + 1, cell, false, null);
                }
            }
        }
    };

    this._playAll = function() {
        // Play all of the notes in the matrix.
        this._logo.synth.stop();

        var notes = [];

        console.log(this._notesToPlay);
        for (var i in this._notesToPlay) {
            notes.push(this._notesToPlay[i]);
        }

        if (this.playDirection > 0) {
            this._notesToPlayDirected = notes;
        } else {
            this._notesToPlayDirected = notes.reverse();
        }

        this.playDirection = 1;
        this._notesCounter = 0;
        var table = docById('pitchTimeTable');

        // We have an array of pitches and note values.
        var note = this._notesToPlayDirected[this._notesCounter][0];
        var pitchNotes = [];
        var drumNotes = [];
        // Note can be a chord, hence it is an array.
        for (var i = 0; i < note.length; i++) {
            var drumName = getDrumName(note[i]);
            if (drumName != null) {
                console.log('drumName is ' + drumName);
                drumNotes.push(drumName);
            } else if (note[i].slice(0, 4) === 'http') {
                drumNotes.push(note[i]);
            } else {
                pitchNotes.push(note[i].replace(/♭/g, 'b').replace(/♯/g, '#'));
            }
        }
        var noteValue = this._notesToPlayDirected[this._notesCounter][1];

        this._notesCounter += 1;

        // Notes begin in Column 1.
        this._colIndex = 1;
        // We highlight the note-value cells (bottom row).
        this._rowIndex = table.rows.length - 1;
        // Highlight first note.
        var cell = table.rows[this._rowIndex].cells[this._colIndex];
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        // If we are in a tuplet, we don't update the column until
        // we've played all of the notes in the column span.
        if (cell.colSpan > 1) {
            this._spanCounter = 1;
            var tupletCell = table.rows[this._rowIndex - 2].cells[this._colIndex];
            tupletCell.style.backgroundColor = MATRIXBUTTONCOLOR;
        } else {
            this._spanCounter = 0;
            this._colIndex += 1;
        }

        if (note[0] !== 'R' && pitchNotes.length > 0) {
            console.log(pitchNotes);
            this._logo.synth.trigger(pitchNotes, this._logo.defaultBPMFactor / noteValue, 'poly');
        }

        for (var i = 0; i < drumNotes.length; i++) {
            console.log(drumNotes[i]);
            this._logo.synth.trigger('C2', this._logo.defaultBPMFactor / noteValue, drumNotes[i]);
        }

        console.log('calling playNote');
        this.__playNote(0, 0);
    };

    this.__playNote = function(time, noteCounter) {
        noteValue = this._notesToPlayDirected[noteCounter][1];
        time = 1 / noteValue;
        var that = this;

        // FIXME: Highlight does not work properly with tuplets: each
        // note in the tuplet is counted once, but since the bottom
        // cell of the tuplet spams multiple columns, the highlight
        // gets ahead of itself.
        setTimeout(function() {
            var table = docById('pitchTimeTable');
            // Did we just play the last note?
            if (noteCounter === that._notesToPlayDirected.length - 1) {
                for (var j = 1; j < table.rows[that._rowIndex].cells.length; j++) {
                    var cell = table.rows[that._rowIndex].cells[j];
                    cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                }
                if (that._matrixHasTuplets) {
                    for (var j = 1; j < table.rows[that._rowIndex - 2].cells.length; j++) {
                    var cell = table.rows[that._rowIndex - 2].cells[j];
                    cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
                    }
                }
            } else {
                var cell = table.rows[that._rowIndex].cells[that._colIndex];

                if (cell != undefined) {
                    cell.style.backgroundColor = MATRIXBUTTONCOLOR;
                    if (cell.colSpan > 1) {
                        var tupletCell = table.rows[that._rowIndex - 2].cells[that._notesCounter + 1];
                        tupletCell.style.backgroundColor = MATRIXBUTTONCOLOR;
                    }
                }

                if (that._notesCounter >= that._notesToPlayDirected.length) {
                    that._notesCounter = 1;
                    that._logo.synth.stop()
                }

                note = that._notesToPlayDirected[that._notesCounter][0];
                noteValue = that._notesToPlayDirected[that._notesCounter][1];
                that._notesCounter += 1;

                // Note can be a chord, hence it is an array.
                var pitchNotes = [];
                var drumNotes = [];
                // Note can be a chord, hence it is an array.
                for (var j = 0; j < note.length; j++) {
                    var drumName = getDrumName(note[j]);
                    if (drumName != null) {
                        console.log('drumName is ' + drumName);
                        drumNotes.push(drumName);
                    } else if (note[j].slice(0, 4) === 'http') {
                        drumNotes.push(note[j]);
                    } else {
                        pitchNotes.push(note[j].replace(/♭/g, 'b').replace(/♯/g, '#'));
                    }
                }

                if (note[0] !== 'R' && pitchNotes.length > 0) {
                    that._logo.synth.trigger(pitchNotes, that._logo.defaultBPMFactor / noteValue, 'poly');
                }

                for (var j = 0; j < drumNotes.length; j++) {
                    that._logo.synth.trigger(['C2'], that._logo.defaultBPMFactor / noteValue, drumNotes[j]);
                }

            }

            var cell = table.rows[that._rowIndex].cells[that._colIndex];
            if (cell != undefined) {
		if (cell.colSpan > 1) {
                    that._spanCounter += 1;
                    if (that._spanCounter === cell.colSpan) {
			that._spanCounter = 0;
			that._colIndex += 1;
                    }
		} else {
                    that._spanCounter = 0;
                    that._colIndex += 1;
		}

		noteCounter += 1;
		if (noteCounter < that._notesToPlayDirected.length) {
                    that.__playNote(time, noteCounter);
		}
            }
        }, that._logo.defaultBPMFactor * 1000 * time + that._logo.turtleDelay);
    };

    this._setNotes = function(colIndex, rowIndex, playNote) {
        // Sets corresponding note when user clicks on any cell and
        // plays that note
        var pitchBlock = this._rowBlocks[rowIndex - 1];
        var rhythmBlockObj = this._colBlocks[colIndex - 1];

        if (playNote) {
            this.addNode(pitchBlock, rhythmBlockObj[0], rhythmBlockObj[1], rhythmBlockObj[2]);
        } else {
            this.removeNode(pitchBlock, rhythmBlockObj[0], rhythmBlockObj[1]);
        }

        if (this._matrixHasTuplets) {
            var leaveRowsFromBottom = 3;
        } else {
            var leaveRowsFromBottom = 1;
        }

        var table = docById('pitchTimeTable');
        this._notesToPlay[colIndex - 1][0] = [];
        if (table !== null) {
            for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++) {
                var table = docById('pitchTimeTable');
                cell = table.rows[j].cells[colIndex];
                if (cell.style.backgroundColor === 'black') {
                    this._setNoteCell(j, colIndex, cell, playNote);
                }
            }
        }
    };

    this._setNoteCell = function(j, colIndex, cell, playNote) {
        var table = docById('pitchTimeTable');
        var solfegeHTML = table.rows[j].cells[0].innerHTML;
        var drumHTML = solfegeHTML.split('"');
        if (drumHTML.length > 3) {
            var drumName = getDrumSynthName(drumHTML[3]);
            if (drumName != null) {
		// If it is a drum, just save the name.
                console.log('drumName is ' + drumName);
		var note = drumName;
            } else {
                console.log('something is wrong (drumSynthName is ' + drumName + ')');
		var note = DEFAULTDRUM;
            }
        } else {
            // Both solfege and octave are extracted from HTML by getNote.
            var noteObj = this._logo.getNote(solfegeHTML, -1, 0, this._logo.keySignature[0]);
            var note = noteObj[0] + noteObj[1];
        }
        var noteValue = table.rows[table.rows.length - 1].cells[1].innerHTML;

        // innerHTML looks something like: 1<br>&mdash;<br>4<br>&#x1D15F;
        noteParts = noteValue.split('<br>');
        noteValue = Number(noteParts[0])/Number(noteParts[2]);
        noteValue = noteValue.toString();

        this._notesToPlay[parseInt(colIndex) - 1][0].push(note);

        if (playNote) {
            if (drumName != null) {
                console.log('drumName is ' + drumName);
                this._logo.synth.trigger('C2', noteValue, drumName);
            } else {
                this._logo.synth.trigger(note.replace(/♭/g, 'b').replace(/♯/g, '#'), noteValue, 'poly');
            }
        }
    };

    this._clear = function() {
        // "Unclick" every entry in the matrix.
        var table = docById('pitchTimeTable');

        if (this._matrixHasTuplets) {
            var leaveRowsFromBottom = 3;
        } else {
            var leaveRowsFromBottom = 1;
        }

        if (table !== null) {
            for (var i = 1; i < table.rows[1].cells.length; i++) {
                for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++) {
                    var cell = table.rows[j].cells[i];
                    if (cell.style.backgroundColor === 'black') {
                        cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                        this._notesToPlay[cell.id - 1][0] = ['R'];
                        this._setNotes(cell.id, cell.parentNode.rowIndex, false);
                    }
                }
            }
        }
    };

    this._save = function() {
        /* Saves the current matrix as an action stack consisting of
         * note and pitch blocks (saving as chunks is deprecated). */

        // First, hide the palettes as they will need updating.
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }
        this._logo.refreshCanvas();


        var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, null, null]], [1, ['text', {'value': 'chunk'}], 0, 0, [0]]];
        var endOfStackIdx = 0;

        for (var i = 0; i < this._notesToPlay.length; i++)
        {
            // We want all of the notes in a column.
            var note = this._notesToPlay[i].slice(0);
            if (note[0] === '') {
                note[0] = 'R';
            }

            // Add the Note block and its value
            var idx = newStack.length;
            newStack.push([idx, 'note', 0, 0, [endOfStackIdx, idx + 1, idx + 2, null]]);
            var n = newStack[idx][4].length;
            if (i === 0) {  // the action block
                newStack[endOfStackIdx][4][n - 2] = idx;
            } else { // the previous note block
                newStack[endOfStackIdx][4][n - 1] = idx;
            }
            var endOfStackIdx = idx;

            // If it is a dotted note, use a divide block.
            if (parseInt(note[1]) < note[1]) {
                var obj = toFraction(note[1]);

                console.log('converting ' + note[1] + ' to ' + obj[0] + '/' + obj[1]);

                // Add a vspace to prevent divide block from obscuring the pitch block.
                newStack.push([idx + 1, 'vspace', 0, 0, [idx, idx + 5]]);

                // Display the dotted note as a fraction.
                newStack.push([idx + 2, 'divide', 0, 0, [idx, idx + 3, idx + 4]]);
                newStack.push([idx + 3, ['number', {'value': obj[0]}], 0, 0, [idx + 2]]);
                newStack.push([idx + 4, ['number', {'value': obj[1]}], 0, 0, [idx + 2]]);

                // Connect the Note block flow to the divide and vspace blocks.
                newStack[idx][4][1] = idx + 2;
                newStack[idx][4][2] = idx + 1;

                var delta = 5;
            } else {
                newStack.push([idx + 1, ['number', {'value': note[1]}], 0, 0, [idx]]);
                var delta = 2;
            }

            // FIXME: Does the undefined case ever occur?
            if (note[0][0] === 'R' || note[0][0] == undefined) {
                // The last connection in last pitch block is null.
                var lastConnection = null;
                if (delta === 5) {
                    var previousBlock = idx + 1;  // Vspace block
                } else {
                    var previousBlock = idx;  // Note block
                }
                delta -= 2;
                var thisBlock = idx + delta;
                previousBlock += delta;
                newStack.push([thisBlock + 1, 'rest2', 0, 0, [previousBlock, lastConnection]]);
            } else {
                // Add the pitch and/or playdrum blocks to the Note block
                var thisBlock = idx + delta;
                for (var j = 0; j < note[0].length; j++) {

                    // We need to point to the previous note or pitch block.
                    if (j === 0) {
                        if (delta === 5) {
                            var previousBlock = idx + 1;  // Vspace block
                        } else {
                            var previousBlock = idx;  // Note block
                        }
                    }

                    var drumName = getDrumName(note[0][j]);
                    if (drumName != null) {
                        // add a playdrum block
                        console.log('drumName is ' + drumName);
			// The last connection in last pitch block is null.
			if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
			} else {
                            var lastConnection = thisBlock + 2;
			}

			newStack.push([thisBlock, 'playdrum', 0, 0, [previousBlock, thisBlock + 1, lastConnection]]);
                        newStack.push([thisBlock + 1, ['drumname', {'value': drumName}], 0, 0, [thisBlock]]);
                        thisBlock += 2;
                        previousBlock = thisBlock - 2;
                    } else if (note[0][j].slice(0, 4) === 'http') {
                        // add a playdrum block with URL
                        console.log('drumName is ' + note[0][j]);
			// The last connection in last pitch block is null.
			if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
			} else {
                            var lastConnection = thisBlock + 2;
			}

			newStack.push([thisBlock, 'playdrum', 0, 0, [previousBlock, thisBlock + 1, lastConnection]]);
                        newStack.push([thisBlock + 1, ['text', {'value': note[0][j]}], 0, 0, [thisBlock]]);
                        thisBlock += 2;
                        previousBlock = thisBlock - 2;
		    } else {
                        // add a pitch block

			// The last connection in last pitch block is null.
			if (note[0].length === 1 || j === note[0].length - 1) {
                            var lastConnection = null;
			} else {
                            var lastConnection = thisBlock + 3;
			}

			newStack.push([thisBlock, 'pitch', 0, 0, [previousBlock, thisBlock + 1, thisBlock + 2, lastConnection]]);
			if(['♯', '♭'].indexOf(note[0][j][1]) !== -1) {
                            newStack.push([thisBlock + 1, ['solfege', {'value': SOLFEGECONVERSIONTABLE[note[0][j][0]] + note[0][j][1]}], 0, 0, [thisBlock]]);
                            newStack.push([thisBlock + 2, ['number', {'value': note[0][j][2]}], 0, 0, [thisBlock]]);
			} else {
                            newStack.push([thisBlock + 1, ['solfege', {'value': SOLFEGECONVERSIONTABLE[note[0][j][0]]}], 0, 0, [thisBlock]]);
                            newStack.push([thisBlock + 2, ['number', {'value': note[0][j][1]}], 0, 0, [thisBlock]]);
			}
                        thisBlock += 3;
                        previousBlock = thisBlock - 3;
		    }
                }
            }
        }

        // Create a new stack for the chunk.
        console.log(newStack);
        this._logo.blocks.loadNewBlocks(newStack);
    };
};

