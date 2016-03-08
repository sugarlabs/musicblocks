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

//All about Matrix

/*
initMatrix() : Initializes the matrix. Makes the pitches according to
solfegeNotes (contains what is to be displayed in first row)
solfegeOctaves (contains the octave for each pitch )

addNotes() : Makes the matrix according to each rhythm block.

addTuplet() : Called when tuplet block is attached to the matrix
clamp. Adds the rows and columns required for adding tuplet
functionality to matrix. "Code is little messy" *<==How so? How should
it be improved in the future?*

makeClickable() : Makes the matrix clickable.

setNotes() : Set notes in this.notesToPlay when user clicks onto any
clickable cell.

playMatrix() : Plays the matrix by calling playAll();

savematrix() : Saves the Matrix notes in an array. Part of that array
(between 2 'end') constitutes notes for any chunk.
*/

var MATRIXBUTTONCOLOR = '#c374e9';
var MATRIXLABELCOLOR = '#90c100';
var MATRIXNOTECELLCOLOR = '#b1db00';
var MATRIXTUPLETCELLCOLOR = '#57e751';
var MATRIXRHYTHMCELLCOLOR = '#c8c8c8';

var MATRIXBUTTONCOLORHOVER = '#c894e0';
var MATRIXNOTECELLCOLORHOVER = '#c2e820';

var MATRIXSOLFEWIDTH = 52;
var EIGHTHNOTEWIDTH = 24;
var MATRIXBUTTONHEIGHT = 40;
var MATRIXBUTTONHEIGHT2 = 66;
var MATRIXSOLFEHEIGHT = 30;


function Matrix() {
    this.arr = [];
    this.secondsPerBeat = 1;
    this.notesToPlay = [];
    this.notesToPlayDirected = [];
    this.numberOfNotesToPlay = 0;
    this.octave = 0;
    this.matrixContainer = null;
    // this.notes = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];

    this.matrixHasTuplets = false;

    this.cellWidth = 0;
    this.solfegeNotes = [];
    this.solfegeOctaves = [];
    this.noteValue = 4;
    this.notesCounter = 0;
    this.playDirection = 1;

    // The pitch-block number associated with a row; a rhythm block is
    // associated with a column. We need to keep track of which
    // intersections in the grid are populated.  The blockMap is a
    // list of selected nodes in the matrix that map pitch blocks to
    // rhythm blocks (note that rhythm blocks can span multiple
    // columns).

    // These arrays get created each time the matrix is built.
    this.rowBlocks = [];  // pitch-block number
    this.colBlocks = [];  // [rhythm-block number, note number]

    // This array is preserved between sessions.
    // We populate the blockMap whenever a note is selected and
    // restore any notes that might be present.

    // FIXME: Doesn't properly account for Tuplets
    this.blockMap = [];

    this.clearBlocks = function() {
        this.rowBlocks = [];
        this.colBlocks = [];
    }

    this.addRowBlock = function(pitchBlock) {
        this.rowBlocks.push(pitchBlock);
    }

    this.addColBlock = function(rhythmBlock, n) {
        // Search for previous instance of the same block (from a repeat)
        var startIdx = 0;
        for (var i = 0; i < this.colBlocks.length; i++) {
            var obj = this.colBlocks[i];
            if (obj[0] === rhythmBlock) {
                startIdx += 1;
            }
        }

        for (var i = startIdx; i < n + startIdx; i++) {
            this.colBlocks.push([rhythmBlock, i]);
        }
    }

    this.addNode = function(pitchBlock, rhythmBlock, n) {
        for (var i = 0; i < this.blockMap.length; i++) {
            var obj = this.blockMap[i];
            if (obj[0] === pitchBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                return;  // node is already in the list
            }
        }
        this.blockMap.push([pitchBlock, [rhythmBlock, n]]);
    }

    this.removeNode = function(pitchBlock, rhythmBlock, n) {
        for (var i = 0; i < this.blockMap.length; i++) {
            var obj = this.blockMap[i];
            if (obj[0] === pitchBlock && obj[1][0] === rhythmBlock && obj[1][1] === n) {
                this.blockMap[i] = [-1, [-1, 1, 0]];  // Mark as removed
            }
        }
    }

    this.initMatrix = function(logo) {
        // Initializes the matrix. First removes the previous matrix
        // and them make another one in DOM (document object model)
        this.rests = 0;
        this.logo = logo;
        docById('matrix').style.display = 'inline';
        docById('matrix').style.visibility = 'visible';
        docById('matrix').style.border = 2;

        // FIXME: make this number based on canvas size.
        var w = window.innerWidth;
        this.cellScale = w / 1200;
        docById('matrix').style.width = Math.floor(w / 2) + 'px';
        docById('matrix').style.overflowX = 'auto';

        console.log('notes ' + this.solfegeNotes + ' octave ' + this.solfegeOctaves);

        this.notesToPlay = [];
        this.notesToPlayDirected = [];
        this.matrixHasTuplets = false;

        // Used to remove the matrix table
        Element.prototype.remove = function() {
            this.parentElement.removeChild(this);
        }

        NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
            for (var i = 0, len = this.length; i < len; i++)
            {
                if (this[i] && this[i].parentElement) {
                    this[i].parentElement.removeChild(this[i]);
                }
            }
        }
        var table = docById('myTable');

        if (table !== null) {
            table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'myTable');
        x.style.textAlign = 'center';

        var matrixDiv = docById('matrix');
        matrixDiv.style.paddingTop = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale + 4) + 'px';
        matrixDiv.style.paddingLeft = Math.floor(MATRIXSOLFEWIDTH * this.cellScale + 2) + 'px';
        matrixDiv.appendChild(x);
        matrixDivPosition = matrixDiv.getBoundingClientRect();

        var table = docById('myTable');
        // FIXME: Why is not 'fixed' honored?
        // table.style.tableLayout = 'fixed';
        // table.style.maxWidth = 'none';
        // table.style.width = 'auto';
        // table.style.minWidth = 100 + '%';

        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.position = 'fixed';
        row.style.left = matrixDivPosition.left + 'px';
        row.style.top = matrixDivPosition.top + 'px';

        var cell = row.insertCell(-1);
        cell.style.fontSize = this.cellScale * 100 + '%';
        cell.innerHTML = '<b>' + _('Solfa') + '</b>';
        cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        cell.style.maxWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXLABELCOLOR;

        var iconSize = Math.floor(this.cellScale * 24);

        // Add the buttons to the top row.
        var thisMatrix = this;

        var cell = row.insertCell(1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';
        cell.style.height = MATRIXBUTTONHEIGHT * this.cellScale + 'px';
        cell.style.maxWidth=iconSize;
        cell.style.minWidth=iconSize;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisMatrix.logo.setTurtleDelay(0);
            thisMatrix.playAll();
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(2);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/export-chunk.svg" title="' + _('save') + '" alt="' + _('save') + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';
        cell.style.height = MATRIXBUTTONHEIGHT * this.cellScale + 'px';
        cell.style.maxWidth=iconSize;
        cell.style.minWidth=iconSize;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisMatrix.saveMatrix();
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(3);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/erase-button.svg" title="' + _('clear') + '" alt="' + _('clear') + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';
        cell.style.height = MATRIXBUTTONHEIGHT * this.cellScale + 'px';
        cell.style.maxWidth=iconSize;
        cell.style.minWidth=iconSize;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisMatrix.clearMatrix();
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(4);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/export-button.svg" title="' + _('export') + ' HTML" alt="' + _('export') + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';
        cell.style.height = MATRIXBUTTONHEIGHT * this.cellScale + 'px';
        cell.style.maxWidth=iconSize;
        cell.style.minWidth=iconSize;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisMatrix.exportMatrix();
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(5);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';
        cell.style.height = MATRIXBUTTONHEIGHT * this.cellScale + 'px';
        cell.style.maxWidth=iconSize;
        cell.style.minWidth=iconSize;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            docById('matrix').style.visibility = 'hidden';
            docById('matrix').style.border = 0;
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var j = 0;
        var marginFromTop = matrixDivPosition.top + parseInt(matrixDiv.style.paddingTop);
        for (var i = 0; i < this.solfegeNotes.length; i++) {
            if (this.solfegeNotes[i].toLowerCase() === _('rest')) {
                this.rests += 1;
                continue;
            }
            var row = header.insertRow(i + 1);
            var cell = row.insertCell(0);
            cell.style.backgroundColor = MATRIXLABELCOLOR;
            cell.style.fontSize = this.cellScale * 100 + '%';
            cell.innerHTML = this.solfegeNotes[i] + this.solfegeOctaves[i].toString().sub();
            cell.style.height = MATRIXSOLFEHEIGHT * this.cellScale + 'px';
            cell.style.position = 'fixed';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.maxWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.left = matrixDivPosition.left + 2 + 'px';
            cell.style.top = marginFromTop + 'px';
            marginFromTop += parseInt(cell.style.height);
            j += 1;
        }

        var row = header.insertRow(this.solfegeNotes.length - this.rests + 1);
        var cell = row.insertCell(0);
        cell.style.fontSize = this.cellScale * 75 + '%';
        cell.innerHTML = _('note value');
        cell.style.position = 'fixed';
        cell.style.height = 1.5 * MATRIXSOLFEHEIGHT * this.cellScale + 'px';
        cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        cell.style.maxWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        cell.style.left = matrixDivPosition.left + 2 + 'px';
        cell.style.top = marginFromTop + 'px';
        cell.style.backgroundColor = MATRIXLABELCOLOR;
    }

    this.generateDataURI = function(file) {
        file=file.replace(/𝅝/g,"&#x1D15D;");
        file=file.replace(/𝅗𝅥/g,"&#x1D15E;");
        file=file.replace(/𝅘𝅥/g,"&#x1D15F;");
        file=file.replace(/𝅘𝅥𝅮/g,"&#x1D160;");
        file=file.replace(/𝅘𝅥𝅯/g,"&#x1D161;");
        file=file.replace(/𝅘𝅥𝅰/g,"&#x1D162;");
        file=file.replace(/𝅘𝅥𝅱/g,"&#x1D163;");
        var data = "data:text/html;charset=utf-8," + encodeURIComponent(file);
        return data;
    }

    this.exportMatrix = function() {
        var table = docById('myTable');

        var exportWindow = window.open("");
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
        console.log(saveDocument.documentElement.outerHTML);
        exportDocument.getElementById("downloadb1").href = this.generateDataURI(uriData);
        exportDocument.close();
    }

    this.note2Solfege = function(note, index) {
        if (['♭', '♯'].indexOf(note[1]) === -1) {
            var octave = note[1];
            var newNote = SOLFEGECONVERSIONTABLE[note[0]];
        } else {
            var octave = note[2];
            var newNote = SOLFEGECONVERSIONTABLE[note.substr(0,2)];
        }
        console.log(index + ': ' + newNote + '/' + octave);
        this.solfegeNotes[index] = newNote;
        this.solfegeOctaves[index] = octave;
    }

    this.addTuplet = function(param) {
        // The first two parameters are the interval for the tuplet,
        // e.g., 1/4; the rest of the parameters are the list of notes
        // to be added to the tuplet, e.g., 1/8, 1/8, 1/8.
        console.log('addTuplet ' + JSON.stringify(param));

        var table = docById('myTable');
        var tupletTimeFactor = param[0][0] / param[0][1];
        var numberOfNotes = param[1].length;
        var totalNoteInterval = 0;
        for (var i = 0; i < numberOfNotes; i++) {
            totalNoteInterval += 32 / param[1][i];
        }

        // Add the cells for each tuplet note
        if (this.matrixHasTuplets) {
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
                cell.style.height=30+'px';
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
            this.notesToPlay.push([['R'], (totalNoteInterval * param[0][1]) / (32 / param[1][j])]);
        }

        if (this.matrixHasTuplets) {
            var row = table.rows[table.rows.length - 2];
        } else {
            var row = table.insertRow(table.rows.length - 1);
            var cell = row.insertCell(-1);
            cell.style.fontSize = this.cellScale * 75 + '%';
            cell.style.position = 'fixed';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.maxWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.height = MATRIXSOLFEHEIGHT * this.cellScale + 'px';
            cell.style.left = matrixDivPosition.left + 2 + 'px';
            cell.style.top = matrixDivPosition.top + (table.rows.length - 1) * cell.style.height + 'px';
            cell.innerHTML = _('tuplet value');
            cell.style.backgroundColor = MATRIXLABELCOLOR;
        }

        var w = window.innerWidth;
        w = (2 * w) / 5;

        cell = table.rows[table.rows.length - 1].insertCell(-1);
        cell.style.height = MATRIXSOLFEHEIGHT * this.cellScale + 'px';

        var noteValue = param[0][1] / param[0][0];
        var noteValueToDisplay = this.calcNoteValueToDisplay(param[0][1], param[0][0]);

        cell.colSpan = numberOfNotes;
        cell.style.fontSize = Math.floor(this.cellScale * 75) + '%';
        cell.style.lineHeight = 60 + '%';
        cell.style.width = this.noteWidth(noteValue);
        cell.style.minWidth = this.noteWidth(noteValue);
        cell.style.maxWidth = this.noteWidth(noteValue);
        cell.innerHTML = noteValueToDisplay;
        cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;

        var tupletCol = table.rows[table.rows.length - 1].cells.length - 2;
        for (var i = 0; i < table.rows[table.rows.length - 1].cells.length - 1; i++) {
            // Add an entry for the tuplet value in any rhythm
            // columns. If we already have tuplets, just add a cell to
            // the new tuplet column.
            if (!this.matrixHasTuplets || i === tupletCol) {
                cell = row.insertCell(i + 1);
                cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
                if (i === tupletCol) {
                    cell.style.fontSize = Math.floor(this.cellScale * 75) + '%';
                    cell.innerHTML = numberOfNotes.toString();
                    cell.colSpan = numberOfNotes;
                }
            }
        }

        if (this.matrixHasTuplets) {
            var row = table.rows[table.rows.length - 3];
        } else {
            // Add row for tuplet note values
            var row = table.insertRow(table.rows.length - 2);
            var cell = row.insertCell(-1);
            cell.style.position = 'fixed';
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.maxWidth = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
            cell.style.height = 1.5 * MATRIXSOLFEHEIGHT * this.cellScale + 'px';
            cell.style.left = matrixDivPosition.left + 2 + 'px';
            cell.style.top = matrixDivPosition.top + (table.rows.length - 2) * cell.style.height + 'px';
            cell.style.fontSize = this.cellScale * 75 + '%';
            cell.innerHTML = _('note value');
            cell.style.backgroundColor = MATRIXLABELCOLOR;
        }

        if (this.matrixHasTuplets) {
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
            cell.style.height = MATRIXSOLFEHEIGHT * this.cellScale + 'px';
            // Add tuplet note values
            if (i >= tupletCol) {
                var j = i - tupletCol;
                var numerator = 32 / param[1][j];
                cell.style.lineHeight = 60 + '%';
                cell.style.fontSize = this.cellScale * 75 + '%';
                var obj = toFraction(numerator / (totalNoteInterval / tupletTimeFactor));
                if (obj[1] in NOTESYMBOLS) {
                       cell.innerHTML = obj[0] + '<br>&mdash;<br>' + obj[1] + '<br><br>' + NOTESYMBOLS[obj[1]];
                } else {
                       cell.innerHTML = obj[0] + '<br>&mdash;<br>' + obj[1] + '<br><br>';
                }
            }
        }

        this.matrixHasTuplets = true;
    }

    this.noteWidth = function (noteValue) {
        return Math.floor(EIGHTHNOTEWIDTH * (8 / noteValue) * this.cellScale) + 'px';
    }

    this.calcNoteValueToDisplay = function (a, b) {
        var noteValue = a / b;
        var noteValueToDisplay = null;
        if (noteValue in NOTESYMBOLS) {
            noteValueToDisplay = '1<br>&mdash;<br>' + noteValue.toString() + '<br><br>' + NOTESYMBOLS[noteValue];
        } else {
            noteValueToDisplay = reducedFraction(b, a);
        }

        if (parseInt(noteValue) < noteValue) {
            noteValueToDisplay = parseInt((noteValue * 1.5))
            if (noteValueToDisplay in DOTTEDNOTESYMBOLS) {
                noteValueToDisplay = '1.5<br>&mdash;<br>' + noteValueToDisplay.toString() + '<br><br>' + DOTTEDNOTESYMBOLS[noteValueToDisplay];
            } else {
                noteValueToDisplay = parseInt((noteValue * 1.75))
                if (noteValueToDisplay in DOTTEDNOTESYMBOLS) {
                    noteValueToDisplay = '1.75<br>&mdash;<br>' + noteValueToDisplay.toString() + '<br><br>' + DOUBLEDOTTEDNOTESYMBOLS[noteValueToDisplay];
                } else {
                    noteValueToDisplay = reducedFraction(b, a);
                }
            }
        }

        return noteValueToDisplay;
    }

    this.addNotes = function(numBeats, noteValue) {
        console.log('addNotes ' + numBeats + ' ' + noteValue);
        var table = docById('myTable');

        var noteValueToDisplay = this.calcNoteValueToDisplay(noteValue, 1);

        if (this.noteValue > noteValue) {
            this.noteValue = noteValue;
        }

        for (var i = 0; i < numBeats; i++) {
            this.notesToPlay.push([['R'], noteValue]);
        }

        if (this.matrixHasTuplets) {
            var rowCount = this.solfegeNotes.length + 3 - this.rests;
        } else {
            var rowCount = this.solfegeNotes.length + 1 - this.rests;
        }

        for (var j = 0; j < numBeats; j++) {
            for (var i = 1; i <= rowCount; i++) {
                var row = table.rows[i];
                var cell = row.insertCell(-1);
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
                cell.width = this.noteWidth(noteValue);
                cell.style.width = this.noteWidth(noteValue);
                cell.style.maxWidth = this.noteWidth(noteValue);
                cell.style.minWidth = this.noteWidth(noteValue);
                if (i === rowCount) {
                    cell.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
                    cell.style.height = Math.floor(1.5 * MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
                    cell.style.fontSize = Math.floor(this.cellScale * 75) + '%';
                    cell.style.lineHeight = 60 + '%';
                    cell.innerHTML = noteValueToDisplay;
                    cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                } else if (this.matrixHasTuplets && i > this.solfegeNotes.length - this.rests) {
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
    }

    this.makeClickable = function() {
        // Once the entire matrix is generated, this function makes it
        // clickable.
        var table = docById('myTable');
        if (this.matrixHasTuplets) {
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
                    this.setNotes(i, cell.parentNode.rowIndex, false);
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
                        console.log(this.id + ': ' + that.notesToPlay[this.id - 1][0]);
                        that.notesToPlay[this.id - 1][0] = ['R'];
                        console.log(this.id + ': ' + that.notesToPlay[this.id - 1][0]);
                        that.setNotes(this.id, this.parentNode.rowIndex, false);
                    } else {
                        this.style.backgroundColor = 'black';
                        that.setNotes(this.id, this.parentNode.rowIndex, true);
                    }
                }
            }
        }

        // Mark any cells found in the blockMap from previous
        // instances of the matrix.
        for (var i = 0; i < this.blockMap.length; i++) {
            var obj = this.blockMap[i];
            if (obj[0] !== -1) {
                // Look for this note in the pitch and rhythm blocks.
                var row = this.rowBlocks.indexOf(obj[0]);
                var col = -1;
                for (var j = 0; j < this.colBlocks.length; j++) {
                    if (this.colBlocks[j][0] === obj[1][0] && this.colBlocks[j][1] === obj[1][1]) {
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
                    if (this.notesToPlay[col][0][0] === 'R') {
                        this.notesToPlay[col][0] = [];
                    }
                    this.setNoteCell(row + 1, col + 1, cell, false, null);
                }
            }
        }
    }

    this.playAll = function() {
        // Play all of the notes in the matrix.
        this.logo.synth.stop();

        var notes = [];

        for (var i in this.notesToPlay) {
            notes.push(this.notesToPlay[i]);
        }

        if (this.playDirection > 0) {
            this.notesToPlayDirected = notes;
        } else {
            this.notesToPlayDirected = notes.reverse();
        }

        this.playDirection = 1;
        this.notesCounter = 0;
        var table = docById('myTable');

        // We have an array of pitches and note values.
        var note = this.notesToPlayDirected[this.notesCounter][0];
        // Note can be a chord, hence it is an array.
        for (var i = 0; i < note.length; i++) {
            note[i] = note[i].replace(/♭/g, 'b').replace(/♯/g, '#');
        }
        var noteValue = this.notesToPlayDirected[this.notesCounter][1];

        this.notesCounter += 1;

        // Notes begin in Column 1.
        this.colIndex = 1;
        // We highlight the note-value cells (bottom row).
        this.rowIndex = table.rows.length - 1;
        // Highlight first note.
        var cell = table.rows[this.rowIndex].cells[this.colIndex];
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        // If we are in a tuplet, we don't update the column until
        // we've played all of the notes in the column span.
        if (cell.colSpan > 1) {
            this.spanCounter = 1;
            var tupletCell = table.rows[this.rowIndex - 2].cells[this.colIndex];
            tupletCell.style.backgroundColor = MATRIXBUTTONCOLOR;
        } else {
            this.spanCounter = 0;
            this.colIndex += 1;
        }

        if (note[0] !== 'R') {
            this.logo.synth.trigger(note, this.logo.defaultBPMFactor / noteValue, 'default');
        }

        this.playNote(0, 0);
    }

    this.playNote = function(time, noteCounter) {
        noteValue = this.notesToPlayDirected[noteCounter][1];
        time = 1 / noteValue;
        var that = this;

        // FIXME: Highlight does not work properly with tuplets: each
        // note in the tuplet is counted once, but since the bottom
        // cell of the tuplet spams multiple columns, the highlight
        // gets ahead of itself.
        setTimeout(function() {
            var table = docById('myTable');
            // Did we just play the last note?
            if (noteCounter === that.notesToPlayDirected.length - 1) {
                for (var j = 1; j < table.rows[that.rowIndex].cells.length; j++) {
                    var cell = table.rows[that.rowIndex].cells[j];
                    cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                }
                if (that.matrixHasTuplets) {
                    for (var j = 1; j < table.rows[that.rowIndex - 2].cells.length; j++) {
                    var cell = table.rows[that.rowIndex - 2].cells[j];
                    cell.style.backgroundColor = MATRIXTUPLETCELLCOLOR;
                    }
                }
            } else {
                var cell = table.rows[that.rowIndex].cells[that.colIndex];

                if (cell != undefined) {
                    cell.style.backgroundColor = MATRIXBUTTONCOLOR;
                    if (cell.colSpan > 1) {
                        var tupletCell = table.rows[that.rowIndex - 2].cells[that.notesCounter + 1];
                        tupletCell.style.backgroundColor = MATRIXBUTTONCOLOR;
                    }
                }

                if (that.notesCounter >= that.notesToPlayDirected.length) {
                    that.notesCounter = 1;
                    that.logo.synth.stop()
                }
                note = that.notesToPlayDirected[that.notesCounter][0];
                noteValue = that.notesToPlayDirected[that.notesCounter][1];
                that.notesCounter += 1;
                // Note can be a chord, hence it is an array.
                for (var j = 0; j < note.length; j++) {
                    note[j] = note[j].replace(/♭/g, 'b').replace(/♯/g, '#');
                }
                if(note[0] !== 'R') {
                    that.logo.synth.trigger(note, that.logo.defaultBPMFactor / noteValue, 'default');
                }
            }
            var cell = table.rows[that.rowIndex].cells[that.colIndex];
            if (cell != undefined) {
            if (cell.colSpan > 1) {
                that.spanCounter += 1;
                if (that.spanCounter === cell.colSpan) {
                    that.spanCounter = 0;
                    that.colIndex += 1;
                }
            } else {
                that.spanCounter = 0;
                that.colIndex += 1;
            }
            noteCounter += 1;
            if (noteCounter < that.notesToPlayDirected.length) {
                that.playNote(time, noteCounter);
            }
            }
        }, that.logo.defaultBPMFactor * 1000 * time + that.logo.turtleDelay);
    }

    this.setNotes = function(colIndex, rowIndex, playNote) {
        // Sets corresponding note when user clicks on any cell and
        // plays that note

        // console.log('setNotes rhythm block: ' + colIndex + ' ' + this.colBlocks[colIndex - 1]);
        var pitchBlock = this.rowBlocks[rowIndex - 1];
        var rhythmBlockObj = this.colBlocks[colIndex - 1];

        if (playNote) {
            this.addNode(pitchBlock, rhythmBlockObj[0], rhythmBlockObj[1], rhythmBlockObj[2]);
        } else {
            this.removeNode(pitchBlock, rhythmBlockObj[0], rhythmBlockObj[1]);
        }

        if (this.matrixHasTuplets) {
            var leaveRowsFromBottom = 3;
        } else {
            var leaveRowsFromBottom = 1;
        }

        var table = docById('myTable');
        this.notesToPlay[colIndex - 1][0] = [];
        if (table !== null) {
            for (var j = 1; j < table.rows.length - leaveRowsFromBottom; j++) {
                var table = docById('myTable');
                cell = table.rows[j].cells[colIndex];
                if (cell.style.backgroundColor === 'black') {
                    this.setNoteCell(j, colIndex, cell, playNote);
                }
            }
        }
    }

    this.setNoteCell = function(j, colIndex, cell, playNote) {
        var table = docById('myTable');
        var solfegeHTML = table.rows[j].cells[0].innerHTML;
        // Both solfege and octave are extracted from HTML by getNote.
        var noteObj = this.logo.getNote(solfegeHTML, -1, 0, this.logo.keySignature[0]);
        var note = noteObj[0] + noteObj[1];
        var noteValue = table.rows[table.rows.length - 1].cells[1].innerHTML;

        // innerHTML looks something like: 1<br>&mdash;<br>4<br>&#x1D15F;
        noteParts = noteValue.split('<br>');
        noteValue = Number(noteParts[0])/Number(noteParts[2]);
        noteValue = noteValue.toString();

        this.notesToPlay[parseInt(colIndex) - 1][0].push(note);

        if (playNote) {
            this.logo.synth.trigger(note.replace(/♭/g, 'b').replace(/♯/g, '#'), noteValue, 'default');
        }
    }

    this.clearMatrix = function() {
        // "Unclick" every entry in the matrix.
        var table = docById('myTable');

        if (this.matrixHasTuplets) {
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
                        this.notesToPlay[cell.id - 1][0] = ['R'];
                        this.setNotes(cell.id, cell.parentNode.rowIndex, false);
                    }
                }
            }
        }
    }

    this.saveMatrix = function() {
        /* Saves the current matrix as an action stack consisting of
         * note and pitch blocks (saving as chunks is deprecated). */

	// First, hide the palettes as they will need updating.
        for (var name in this.logo.blocks.palettes.dict) {
            this.logo.blocks.palettes.dict[name].hideMenu(true);
        }
        this.logo.refreshCanvas();


        var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, null, null]], [1, ['text', {'value': 'chunk'}], 0, 0, [0]]];
        var endOfStackIdx = 0;

        for (var i = 0; i < this.notesToPlay.length; i++)
        {
            // We want all of the notes in a column.
            var note = this.notesToPlay[i].slice(0);
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
		// Add the pitch blocks to the Note block
		for (var j = 0; j < note[0].length; j++) {

                    var thisBlock = idx + delta + (j * 3);

                    // We need to point to the previous note or pitch block.
                    if (j === 0) {
			if (delta === 5) {
                            var previousBlock = idx + 1;  // Vspace block
			} else {
                            var previousBlock = idx;  // Note block
			}
                    } else {
			var previousBlock = thisBlock - 3;  // Pitch block
                    }

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
                }
            }
        }

        // Create a new stack for the chunk.
        console.log(newStack);
        this.logo.blocks.loadNewBlocks(newStack);
    }
}
