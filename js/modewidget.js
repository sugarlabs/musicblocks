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


function ModeWidget() {
    this.cellWidth = 0;

    this.init = function(logo) {
        // Initializes the mode widget. First removes the previous widget
        // and them make another one in DOM (document object model)
        this.logo = logo;
        this.playing = false;

        docById('modewidget').style.display = 'inline';
        docById('modewidget').style.visibility = 'visible';
        docById('modewidget').style.border = 2;

        // FIXME: make this number based on canvas size.
        var w = window.innerWidth;
        this.cellScale = w / 1200;
        docById('modewidget').style.width = 17.5 * Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        docById('modewidget').style.overflowX = 'auto';

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

        var table = docById('modeTable');

        if (table !== null) {
            table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'modeTable');
        x.style.textAlign = 'center';

        var matrixDiv = docById('modewidget');
        matrixDiv.style.paddingTop = 0 + 'px';
        matrixDiv.style.paddingLeft = 0 + 'px';
        matrixDiv.appendChild(x);
        matrixDivPosition = matrixDiv.getBoundingClientRect();

        var table = docById('modeTable');

        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(matrixDivPosition.left) + 'px';
        row.style.top = Math.floor(matrixDivPosition.top) + 'px';

        var labelCell = row.insertCell(-1);
        labelCell.style.fontSize = this.cellScale * 100 + '%';
        labelCell.innerHTML = '<b>' + _('mode') + '</b>';
        labelCell.style.width = Math.floor(MATRIXSOLFEWIDTH * this.cellScale) + 'px';
        labelCell.style.minWidth = labelCell.style.width;
        labelCell.style.maxWidth = labelCell.style.width;
        labelCell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        labelCell.style.backgroundColor = MATRIXLABELCOLOR;

        var iconSize = Math.floor(this.cellScale * 24);

        var that = this;

        // Add the buttons to the top row.
        var cell = row.insertCell(1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onclick=function() {
            that.logo.setTurtleDelay(0);
            that.playAll();
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
            that.save();
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
            that.clear();
        }

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(4);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/rotate-left.svg" title="' + _('rotate left') + ' HTML" alt="' + _('rotate left') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onclick=function() {
            that.rotateLeft();
        }

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(5);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/rotate-right.svg" title="' + _('rotate right') + ' HTML" alt="' + _('rotate right') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onclick=function() {
            that.rotateRight();
        }

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(6);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onclick=function() {
            docById('modewidget').style.visibility = 'hidden';
            docById('modewidget').style.border = 0;
        }

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var marginFromTop = Math.floor(matrixDivPosition.top + this.cellScale * 2 + parseInt(matrixDiv.style.paddingTop.replace('px', '')));
        var row = header.insertRow(1);
        row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale + MATRIXSOLFEHEIGHT * this.cellScale) + 'px';

        var cell = row.insertCell(0);
        cell.innerHTML = '&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;

        this.addNotes();

        var row = header.insertRow(2);
        row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale + MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
        var cell = row.insertCell(0);
        cell.colSpan = 14;
        cell.innerHTML = '&nbsp;';
        cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;

        this.makeClickable();

        // Recalculate widget width (including intercell padding)
        var w = 13 * Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + parseInt(labelCell.style.width.replace('px', '')) + 15 * 4;
        docById('modewidget').style.width = w + 'px';
    };

    this.addNotes = function() {
        var table = docById('modeTable');

        // 13 because we include the first note of the next octave
        for (var i = 0; i < 13; i++) {
            var row = table.rows[1];
            var cell = row.insertCell(i + 1);
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this.cellScale) + 'px';
            cell.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
            cell.style.width = cell.width;
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;

            cell.style.fontSize = this.cellScale * 100 + '%';
            var halfStep = i % 12;
            cell.innerHTML = '<font color="white">' + halfStep + '</font>';

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
            cell.setAttribute('id', i);
        }
    };

    this.makeClickable = function() {
        // Once the entire matrix is generated, this function makes it
        // clickable.
        var table = docById('modeTable');

        // Read in the current mode to start.
        var currentModeName = keySignatureToMode(this.logo.keySignature[0]);
        var currentMode = MUSICALMODES[currentModeName[1]];

        var table = docById('modeTable');
        table.rows[2].cells[0].innerHTML = getModeName(currentModeName[1]);

        k = 0;
        j = 1;
        for (var i = 1; i < 13; i++) {
            cell = table.rows[1].cells[i];
            if (i === j) {
                cell.style.backgroundColor = 'black';
                j += currentMode[k];
                k += 1;
            } else {
                cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            }
        }
        // The first note of the next octave.
        cell = table.rows[1].cells[13];
        cell.style.backgroundColor = 'black';

        var that = this;

        // The first note of the octave is always selected.
        var cell = table.rows[1].cells[1];
        cell.onclick = function() {
            that._playNote(this.id, true);
        }

        var cell = table.rows[1].cells[13];
        cell.onclick = function() {
            that._playNote(this.id, true);
        }

        // All the other notes are optional.
        for (var i = 2; i < 13; i++) {
            var cell = table.rows[1].cells[i];

            cell.onclick = function() {
                if (this.style.backgroundColor === 'black') {
                    this.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    that._playNote(this.id, false);
                    that._setModeName()
                } else {
                    this.style.backgroundColor = 'black';
                    that._playNote(this.id, true);
                    that._setModeName()
                }
            }
        }
    };

    this.rotateLeft = function() {
        var table = docById('modeTable');
        var firstCell = table.rows[1].cells[1].style.backgroundColor;

        for (var i = 2; i < 13; i++) {
            var prev = table.rows[1].cells[i - 1];
            var cell = table.rows[1].cells[i];
            prev.style.backgroundColor = cell.style.backgroundColor;
        }

        var cell = table.rows[1].cells[12];
        cell.style.backgroundColor = firstCell;

        // Keep rotating until first cell is set.
        var cell = table.rows[1].cells[1];
        if (cell.style.backgroundColor !== 'black') {
            this.rotateLeft();
        }
        this._setModeName()
    };

    this.rotateRight = function() {
        var table = docById('modeTable');

        var lastCell = table.rows[1].cells[12].style.backgroundColor;

        for (var i = 12; i > 1; i--) {
            var prev = table.rows[1].cells[i];
            var cell = table.rows[1].cells[i - 1];
            prev.style.backgroundColor = cell.style.backgroundColor;
        }

        var cell = table.rows[1].cells[1];
        cell.style.backgroundColor = lastCell;

        // Keep rotating until first cell is set.
        var cell = table.rows[1].cells[1];
        if (cell.style.backgroundColor !== 'black') {
            this.rotateRight();
        }
        this._setModeName()
    };

    this.playAll = function() {
        // Play all of the notes in the matrix.
        if (this.playing) {
            return;
        }

        this.logo.synth.stop();
        this.playing = true;

        this.notes = [];
        this.cells = [];
        var firstNote = '';

        var table = docById('modeTable');
        if (table !== null) {
            for (var i = 1; i < 13; i++) {
                cell = table.rows[1].cells[i];
                if (cell.style.backgroundColor === 'black') {
                    this.notes.push([NOTESSHARP[i - 1].replace(/♯/g, '#') + '4']);
                    this.cells.push(i);
                    if (this.notes.length === 1) {
                        firstNote = [NOTESSHARP[i - 1].replace(/♯/g, '#') + '5'];
                    }
                }
            }

            if (firstNote !== '') {
                this.notes.push(firstNote);
                this.cells.push(13);
            }
        }

        this.notesCounter = 1;
        this.playNote(0, 0);
    };

    this.playNote = function(time, noteCounter) {
        // Did we just play the last note?
        if (noteCounter === 2 * this.notes.length) {
            this.playing = false;
            return;
        }

        var noteValue = 0.333;
        time = noteValue + 0.125;
        var that = this;

        setTimeout(function() {
            var table = docById('modeTable');
            if (noteCounter > that.notes.length - 1) {
                var d = noteCounter - that.notes.length;
                var i = that.notes.length - d - 1;
            } else {
                var i = noteCounter;
            }

            if (i < that.notes.length) {// - 1) {
                var cell = table.rows[1].cells[that.cells[i]];
                if (i === noteCounter) {
                    cell.style.backgroundColor = MATRIXBUTTONCOLOR;
                } else {
                    cell.style.backgroundColor = 'black';
                }
            }
            that.logo.synth.trigger(that.notes[i], noteValue, 'poly');
            that.playNote(time, noteCounter + 1);
        }, 1000 * time);
    };

    this._playNote = function(colIndex, playNote) {
        var table = docById('modeTable');
        if (table !== null) {
            cell = table.rows[1].cells[colIndex];
            if (colIndex == 13) {
                // Next octave
                this.logo.synth.trigger([NOTESSHARP[0].replace(/♯/g, '#') + '5'], 0.33, 'poly');
            } else if (cell.style.backgroundColor === 'black') {
                this.logo.synth.trigger([NOTESSHARP[colIndex - 1].replace(/♯/g, '#') + '4'], 0.33, 'poly');
            }
        }
    };

    this.clear = function() {
        // "Unclick" every entry in the matrix.
        var table = docById('modeTable');

        if (table !== null) {
            // Always set the first cell
            var cell = table.rows[1].cells[1];
            cell.style.backgroundColor = 'black';

            var cell = table.rows[1].cells[13];
            cell.style.backgroundColor = 'black';

            for (var i = 2; i < 13; i++) {
                var cell = table.rows[1].cells[i];
                if (cell.style.backgroundColor === 'black') {
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                }
            }
        }
    };

    this._calculateMode = function() {
        var currentMode = [];
        var table = docById('modeTable');
        var j = 1;
        for (var i = 2; i < 13; i++) {
            var cell = table.rows[1].cells[i];
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
                table.rows[2].cells[0].innerHTML = getModeName(mode);
		return;
            }
        }
        var table = docById('modeTable');
        table.rows[2].cells[0].innerHTML = '';
    };

    this.save = function() {
        customMode = this._calculateMode();
        console.log('custom mode: ' + customMode);
        storage.custommode = JSON.stringify(customMode);
    };
};
