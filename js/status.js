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


function StatusMatrix() {
    docById('statusmatrix').style.visibility = 'hidden';

    this.init = function(logo) {
        // Initializes the status matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        this._logo = logo;

        docById('statusmatrix').style.display = 'inline';
        docById('statusmatrix').style.visibility = 'visible';
        docById('statusmatrix').style.border = 2;

        // FIXME: make this number based on canvas size.
        var w = window.innerWidth;
        this._cellScale = w / 1200;
        // docById('statusmatrix').style.width = Math.floor(w / 2) + 'px';
        // docById('statusmatrix').style.height = '300px';
        docById('statusmatrix').style.overflowX = 'auto';

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

        var table = docById('statusTable');

        if (table !== null) {
            table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'statusTable');
        x.style.textAlign = 'center';

        var statusDiv = docById('statusmatrix');
        statusDiv.style.paddingTop = 0 + 'px';
        statusDiv.style.paddingLeft = 0 + 'px';
        statusDiv.appendChild(x);
        var statusDivPosition = statusDiv.getBoundingClientRect();

        var table = docById('statusTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(statusDivPosition.left) + 'px';
        row.style.top = Math.floor(statusDivPosition.top) + 'px';

        var iconSize = Math.floor(this._cellScale * 24);

        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            docById('statusmatrix').style.visibility = 'hidden';
            docById('statusmatrix').style.border = 0;
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        // One row per voice (turtle)
        // One column per field
        for (var i = 0; i < this._logo.statusFields.length; i++) {
            var cell = row.insertCell(i + 1);
            cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';
            cell.innerHTML = '&nbsp;<b>' + _(this._logo.statusFields[i]) + '</b>&nbsp;'
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(i + 1);
        cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';
        cell.innerHTML = '&nbsp;<b>' + _('note') + '</b>&nbsp;'
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        var t = 0;
        for (var i = 0; i < this._logo.turtles.turtleList.length; i++) {
            if (this._logo.turtles.turtleList[i].trash) {
                continue;
            }

            var row = header.insertRow(t + 1);
            var cell = row.insertCell(0);
            cell.style.backgroundColor = MATRIXLABELCOLOR;

            cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/turtle-button.svg" title="' + this._logo.turtles.turtleList[i].name + '" alt="' + this._logo.turtles.turtleList[i].name + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';

            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';

            // + 1 is for the note column
            for (var j = 0; j < this._logo.statusFields.length + 1; j++) {
                var cell = row.insertCell(-1);
                cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';
                cell.innerHTML = '';
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            }

            t += 1;
        }
    };

    this.updateAll = function() {
        // Update status of all of the voices in the matrix.
        var table = docById('statusTable');
        var t = 0;
        for (var i = 0; i < this._logo.turtles.turtleList.length; i++) {
            if (this._logo.turtles.turtleList[i].trash) {
                continue;
            }

            for (var j = 0; j < this._logo.statusFields.length; j++) {
                var innerHTML = '';
                switch(this._logo.statusFields[j]) {
                case 'bpm':
                    if (this._logo.bpm[i].length > 0) {
                        var bpm = last(this._logo.bpm[i]);
                    } else {
                        var bpm = TARGETBPM;
                    }
                    innerHTML = bpm;
                    break;
                case 'volume':
                    innerHTML = last(this._logo.polyVolume[i]);
                    break;
                case 'key':
                    var obj = this._logo.keySignature[i].split(' ');
                    innerHTML = obj[0] + '&nbsp;' + getModeName(obj[1]);
                    break;
                case 'duplicate':
                    innerHTML = this._logo.duplicateFactor[i];
                    break;
                case 'transposition':
                    innerHTML = this._logo.transposition[i];
                    break;
                case 'skip':
                    innerHTML = this._logo.skipFactor[i];
                    break;
                case 'staccato':
                    if (this._logo.staccato[i].length > 0) {
                        innerHTML =  last(this._logo.staccato[i]);
                    } else {
                        innerHTML = 0;
                    }
                    break;
                case 'slur':
                    if (this._logo.staccato[i].length > 0) {
                        innerHTML =  -last(this._logo.staccato[i]);
                    } else {
                        innerHTML = 0;
                    }
                    break;
                case 'x':
                    innerHTML = Math.floor(this._logo.turtles.turtleList[i].x);
                    break;
                case 'y':
                    innerHTML = Math.floor(this._logo.turtles.turtleList[i].y);
                    break;
                case 'heading':
                    innerHTML = Math.floor(this._logo.turtles.turtleList[i].orientation);
                    break;
                case 'color':
                    innerHTML = this._logo.turtles.turtleList[i].color;
                    break;
                case 'shade':
                    innerHTML = this._logo.turtles.turtleList[i].value;
                    break;
                case 'grey':
                    innerHTML = this._logo.turtles.turtleList[i].chroma;
                    break;
                case 'pensize':
                    innerHTML = this._logo.turtles.turtleList[i].stroke;
                    break;
                default:
                    console.log('??? ' + this._logo.statusFields[j]);
                    break;
                }
                var cell = table.rows[t + 1].cells[j + 1];
                if (cell != null) {
                    cell.innerHTML = innerHTML;
                }
            }

            var note = '';
            var value = '';
            if (this._logo.noteStatus[i] != null) {
                var notes = this._logo.noteStatus[i][0];
                for (var n = 0; n < notes.length; n++) {
                    note += notes[n];
		    note += ' ';
		}
                var value = this._logo.noteStatus[i][1];
                note += value;
            }

            var cell = table.rows[t + 1].cells[j + 1];
            if (cell != null) {
		cell.innerHTML = note.replace(/#/g, '♯').replace(/b/, '♭');
            }

            t += 1;
        }
    };
};
