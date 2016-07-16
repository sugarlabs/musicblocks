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

// Row and column of each halfstep: Note that span cells are counted
// only once.
const MODEMAP = [[2, 7], [3, 6], [5, 10], [7, 11], [9, 10], [11, 8], [12, 5], [11, 5], [9, 3], [7, 2], [5, 3], [3, 5]];

function ModeWidget() {

    this.init = function(logo) {
        // Initializes the mode widget. First removes the previous widget
        // and them make another one in DOM (document object model)
        this._logo = logo;
        this._playing = false;
        this._pitch = this._logo.keySignature[0][0];
        this._noteValue = 0.333;

        this._undoStack = [];

        docById('modewidget').style.display = 'inline';
        docById('modewidget').style.visibility = 'visible';
        docById('modewidget').style.border = 2;

        // FIXME: make this number based on canvas size.
        this._cellScale = window.innerWidth / 1200;
        docById('modewidget').style.overflowX = 'auto';

        // Used to remove the mode widget table
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

        var table = docById('modeTable');

        if (table !== null) {
            table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'modeTable');
        x.style.textAlign = 'center';

        var modeDiv = docById('modewidget');
        modeDiv.style.paddingTop = 0 + 'px';
        modeDiv.style.paddingLeft = 0 + 'px';
        modeDiv.appendChild(x);
        var modeDivPosition = modeDiv.getBoundingClientRect();

        var table = docById('modeTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(modeDivPosition.left) + 'px';
        row.style.top = Math.floor(modeDivPosition.top) + 'px';

        // Create blank rows.
        for (var i = 0; i < 15; i++) {
            table.insertRow(i);
        }
        
        // Add a label to the widget in the upper-left cell.
        var labelCell = table.rows[0].insertCell();
        labelCell.rowSpan = 2;
        labelCell.colSpan = 2;
        labelCell.style.fontSize = this._cellScale * 100 + '%';
        labelCell.innerHTML = '<b>' + _('mode') + '</b>';
        labelCell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) + 'px';
        labelCell.style.minWidth = labelCell.style.width;
        labelCell.style.maxWidth = labelCell.style.width;
        labelCell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        labelCell.style.backgroundColor = MATRIXLABELCOLOR;

        // Add the buttons to the top row for play all, save, clear,
        // rotate (left and right, invert, and close.
        var iconSize = Math.floor(this._cellScale * 24);
        var that = this;

        var cell = this._addButton(row, 1, 'play-button.svg', iconSize, _('play all'));
        cell.onclick=function() {
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

        var cell = this._addButton(row, 4, 'rotate-left.svg', iconSize, _('rotate left'));
        cell.onclick=function() {
            that._rotateLeft();
        }

        var cell = this._addButton(row, 5, 'rotate-right.svg', iconSize, _('rotate right'));
        cell.onclick=function() {
            that._rotateRight();
        }

        var cell = this._addButton(row, 6, 'invert.svg', iconSize, _('invert'));
        cell.onclick=function() {
            that._invert();
        }

        var cell = this._addButton(row, 7, 'restore-button.svg', iconSize, _('undo'));
        cell.onclick=function() {
            that._undo();
        }

        var cell = this._addButton(row, 8, 'close-button.svg', iconSize, _('close'));
        cell.onclick=function() {
            docById('modewidget').style.visibility = 'hidden';
            docById('modewidget').style.border = 0;
        }

        this._addNotes();

        // A row for the current mode label
        var row = table.insertRow(14);
        var cell = row.insertCell(0);
        cell.colSpan = 18;
        cell.innerHTML = '&nbsp;';
        cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;

        this._makeClickable();
    };

    this._addButton = function(row, colIndex, icon, iconSize, label) {
        var table = docById('modeTable');
        var cell = table.rows[0].insertCell();
        cell.rowSpan = 2;
        cell.colSpan = 2;
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

    this._addNotes = function() {
        // This is a brute-force way of adding notes in a circular
        // pattern within an HTML table.
        // Fix me: Some of this could be done with CSS.

        var table = docById('modeTable');

        for (var i = 0; i < 7; i++) {
            table.rows[2].insertCell();
            last(table.rows[2].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[2].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 2, 0);

        for (var i = 0; i < 7; i++) {
            table.rows[2].insertCell();
            last(table.rows[2].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[2].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        for (var i = 0; i < 5; i++) {
            table.rows[3].insertCell();
            last(table.rows[3].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[3].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[4].insertCell();
            last(table.rows[4].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[4].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 3, 11);

        for (var i = 0; i < 2; i++) {
            table.rows[4].insertCell();
            last(table.rows[4].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[4].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 3, 1);

        for (var i = 0; i < 5; i++) {
            table.rows[3].insertCell();
            last(table.rows[3].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[3].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[4].insertCell();
            last(table.rows[4].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[4].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        for (var i = 0; i < 3; i++) {
            table.rows[5].insertCell();
            last(table.rows[5].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[5].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[6].insertCell();
            last(table.rows[6].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[6].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 5, 10);

        for (var i = 0; i < 6; i++) {
            table.rows[5].insertCell();
            last(table.rows[5].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[5].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[6].insertCell();
            last(table.rows[6].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[6].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 5, 2);

        for (var i = 0; i < 3; i++) {
            table.rows[5].insertCell();
            last(table.rows[5].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[5].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[6].insertCell();
            last(table.rows[6].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[6].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        for (var i = 0; i < 2; i++) {
            table.rows[7].insertCell();
            last(table.rows[7].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[7].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[8].insertCell();
            last(table.rows[8].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[8].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 7, 9);

        for (var i = 0; i < 8; i++) {
            table.rows[7].insertCell();
            last(table.rows[7].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[7].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[8].insertCell();
            last(table.rows[8].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[8].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 7, 3);

        for (var i = 0; i < 2; i++) {
            table.rows[7].insertCell();
            last(table.rows[7].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[7].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[8].insertCell();
            last(table.rows[8].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[8].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        for (var i = 0; i < 3; i++) {
            table.rows[9].insertCell();
            last(table.rows[9].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[9].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[10].insertCell();
            last(table.rows[10].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[10].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 9, 8);

        for (var i = 0; i < 6; i++) {
            table.rows[9].insertCell();
            last(table.rows[9].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[9].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[10].insertCell();
            last(table.rows[10].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[10].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 9, 4);

        for (var i = 0; i < 3; i++) {
            table.rows[9].insertCell();
            last(table.rows[9].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[9].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[10].insertCell();
            last(table.rows[10].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[10].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        for (var i = 0; i < 5; i++) {
            table.rows[11].insertCell();
            last(table.rows[11].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[11].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[12].insertCell();
            last(table.rows[12].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[12].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        for (var i = 0; i < 7; i++) {
            table.rows[13].insertCell();
            last(table.rows[13].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[13].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 11, 7);

        for (var i = 0; i < 2; i++) {
            table.rows[11].insertCell();
            last(table.rows[11].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[11].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        this.__addNoteCell(table, 12, 6);

        this.__addNoteCell(table, 11, 5);

        for (var i = 0; i < 5; i++) {
            table.rows[11].insertCell();
            last(table.rows[11].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[11].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            table.rows[12].insertCell();
            last(table.rows[12].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[12].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }

        for (var i = 0; i < 7; i++) {
            table.rows[13].insertCell();
            last(table.rows[13].cells).width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
            last(table.rows[13].cells).height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale / 2) + 'px';
        }
    };

    this.__addNoteCell = function(table, row, halfstep) {
        var cell = table.rows[row].insertCell();
        cell.rowSpan = 2;
        cell.colSpan = 2;
        cell.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.height = cell.height;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.width = cell.width;
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
        cell.style.fontSize = this._cellScale * 100 + '%';
        cell.innerHTML = '<font color="white">' + halfstep + '</font>';
        cell.setAttribute('id', halfstep);
    };

    this._makeClickable = function() {
        var table = docById('modeTable');

        // Read in the current mode to start.
        var currentModeName = keySignatureToMode(this._logo.keySignature[0]);
        var currentMode = MUSICALMODES[currentModeName[1]];

        var table = docById('modeTable');
        table.rows[14].cells[0].innerHTML = getModeName(currentModeName[1]);

        var that = this;
        var k = 0;
        var j = 0;
        for (var i = 0; i < 12; i++) {
            var cell = table.rows[MODEMAP[i][0]].cells[MODEMAP[i][1]];

            if (i === j) {
                cell.style.backgroundColor = 'black';
                j += currentMode[k];
                k += 1;
            } else {
                cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            }

            if (i === 0) {
                // The first note of the octave is always selected.
                cell.onclick = function() {
                    that._playNote(this.id);
                }
            } else {
                cell.onclick = function() {
                    that._saveState();

                    if (this.style.backgroundColor === 'black') {
                        this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                        that._setModeName()
                    } else {
                        this.style.backgroundColor = 'black';
                        that._playNote(this.id);
                        that._setModeName()
                    }
                }
            }
        }
    };

    this._invert = function() {
        var table = docById('modeTable');
        if (table == null) {
            return;
        }

        this._saveState();

        for (var i = 1; i < 6; i++) {
            var thisCell = table.rows[MODEMAP[i][0]].cells[MODEMAP[i][1]];
            var thatCell = table.rows[MODEMAP[12 - i][0]].cells[MODEMAP[12 - i][1]];
            var tmp = thisCell.style.backgroundColor;
            thisCell.style.backgroundColor = thatCell.style.backgroundColor;
            thatCell.style.backgroundColor = tmp;
        }

        this._setModeName()
    };

    this._rotateLeft = function() {
        var table = docById('modeTable');
        if (table == null) {
            return;
        }

        this._saveState();

        var firstCell = table.rows[MODEMAP[0][0]].cells[MODEMAP[0][1]].style.backgroundColor;

        for (var i = 1; i < 12; i++) {
            var prev = table.rows[MODEMAP[i - 1][0]].cells[MODEMAP[i - 1][1]];
            var cell = table.rows[MODEMAP[i][0]].cells[MODEMAP[i][1]];
            prev.style.backgroundColor = cell.style.backgroundColor;
        }

        var cell = table.rows[MODEMAP[11][0]].cells[MODEMAP[11][1]];
        cell.style.backgroundColor = firstCell;

        // Keep rotating until first cell is set.
        var cell = table.rows[MODEMAP[0][0]].cells[MODEMAP[0][1]];
        if (cell.style.backgroundColor !== 'black') {
            this._rotateLeft();
        }

        this._setModeName()
    };

    this._rotateRight = function() {
        var table = docById('modeTable');
        if (table == null) {
            return;
        }

        this._saveState();

        var lastCell = table.rows[MODEMAP[11][0]].cells[MODEMAP[11][1]].style.backgroundColor;

        for (var i = 11; i > 0; i--) {
            var prev = table.rows[MODEMAP[i][0]].cells[MODEMAP[i][1]];
            var cell = table.rows[MODEMAP[i - 1][0]].cells[MODEMAP[i - 1][1]];
            prev.style.backgroundColor = cell.style.backgroundColor;
        }

        var cell = table.rows[MODEMAP[0][0]].cells[MODEMAP[0][1]];
        cell.style.backgroundColor = lastCell;

        // Keep rotating until first cell is set.
        if (cell.style.backgroundColor !== 'black') {
            this._rotateRight();
        }

        this._setModeName()
    };

    this._playAll = function() {
        // Play all of the notes in the widget.
        var table = docById('modeTable');
        if (table == null) {
            return;
        }

        if (this._playing) {
            return;
        }

        this._logo.synth.stop();
        this._playing = true;

        // this.notes = [];
        this.cells = [];
        var firstNote = '';

        for (var i = 0; i < 12; i++) {
            var cell = table.rows[MODEMAP[i][0]].cells[MODEMAP[i][1]];
            if (cell.style.backgroundColor === 'black') {
                this.cells.push(i);
                if (this.cells.length === 1) {
                    firstNote = true;
                }
            }
        }

        if (firstNote !== '') {
            this.cells.push(12);
        }

        this.notesCounter = 1;
        this.__playNote(0, 0);
    };

    this.__playNote = function(time, noteCounter) {
        // Did we just play the last note?
        if (noteCounter === 2 * this.cells.length) {
            this._playing = false;
            return;
        }

        time = this._noteValue + 0.125;
        var that = this;

        setTimeout(function() {
            var table = docById('modeTable');
            if (noteCounter > that.cells.length - 1) {
                var d = noteCounter - that.cells.length;
                var i = that.cells.length - d - 1;
            } else {
                var i = noteCounter;
            }

            if (i < that.cells.length) {
                var cell = table.rows[MODEMAP[that.cells[i] % 12][0]].cells[MODEMAP[that.cells[i] % 12][1]];
                if (i < that.cells.length - 1) {
                    if (i === noteCounter) {
                        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
                    } else {
                        cell.style.backgroundColor = 'black';
                    }
                }
            }

            var noteToPlay = that._logo.getNote(that._pitch, 4, that.cells[i]);
            that._logo.synth.trigger(noteToPlay[0].replace(/♯/g, '#').replace(/♭/g, 'b') + noteToPlay[1], that._noteValue, 'poly');
            that.__playNote(time, noteCounter + 1);
        }, 1000 * time);
    };

    this._playNote = function(idx) {
        var table = docById('modeTable');
        if (table == null) {
            return;
        }

        var cell = table.rows[MODEMAP[idx][0]].cells[MODEMAP[idx][1]];
        if (cell.style.backgroundColor === 'black') {
            var noteToPlay = this._logo.getNote(this._pitch, 4, idx);
            this._logo.synth.trigger(noteToPlay[0].replace(/♯/g, '#').replace(/♭/g, 'b') + noteToPlay[1], this._noteValue, 'poly');
        }
    };

    this._saveState = function() {
        var table = docById('modeTable');
        if (table == null) {
            return;
        }

        var thisState = [];
        for (var i = 0; i < 12; i++) {
            var cell = table.rows[MODEMAP[i][0]].cells[MODEMAP[i][1]];
            thisState.push(cell.style.backgroundColor);
        }

        this._undoStack.push(thisState);
    };

    this._undo = function() {
        var table = docById('modeTable');

        if (this._undoStack.length > 0) {
            var prevState = this._undoStack.pop();
            for (var i = 0; i < 12; i++) {
                var cell = table.rows[MODEMAP[i][0]].cells[MODEMAP[i][1]];
                cell.style.backgroundColor = prevState[i];
            }

            this._setModeName()
        }
    };

    this._clear = function() {
        // "Unclick" every entry in the widget.
        var table = docById('modeTable');
        if (table == null) {
            return;
        }

        this._saveState();

        // Always set the first cell
        var cell = table.rows[MODEMAP[0][0]].cells[MODEMAP[0][1]];
        cell.style.backgroundColor = 'black';

        for (var i = 1; i < 12; i++) {
            var cell = table.rows[MODEMAP[i][0]].cells[MODEMAP[i][1]];
            if (cell.style.backgroundColor === 'black') {
                cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            }
        }
    };

    this._calculateMode = function() {
        var currentMode = [];
        var table = docById('modeTable');
        var j = 1;
        for (var i = 1; i < 12; i++) {
            var cell = table.rows[MODEMAP[i][0]].cells[MODEMAP[i][1]];
            if (cell.style.backgroundColor === 'black') {
                currentMode.push(j);
                j = 1;
            } else {
                j += 1;
            }
        }

        currentMode.push(j);
        return currentMode;
    };

    this._setModeName = function() {
        var currentMode = JSON.stringify(this._calculateMode());
        for (var mode in MUSICALMODES) {
            if (JSON.stringify(MUSICALMODES[mode]) === currentMode) {
                var table = docById('modeTable');
                table.rows[14].cells[0].innerHTML = getModeName(mode);
                return;
            }
        }
        var table = docById('modeTable');
        table.rows[14].cells[0].innerHTML = '';
    };

    this._save = function() {
        customMode = this._calculateMode();
        console.log('custom mode: ' + customMode);
        storage.custommode = JSON.stringify(customMode);
    };
};
