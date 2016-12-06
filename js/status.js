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

// This widget makes displays the status of selected parameters and
// notes as they are being played.


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

        // One column per field
        for (var i = 0; i < this._logo.statusFields.length; i++) {
            var cell = row.insertCell(i + 1);
            cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';

	    switch (this._logo.statusFields[i][1]) {
            case 'plus':
            case 'minus':
            case 'neg':
            case 'divide':
            case 'multiply':
            case 'sqrt':
            case 'int':
            case 'mod':
		var label = '';
		break;
	    default:
                var label = this._logo.blocks.blockList[this._logo.statusFields[i][0]].protoblock.staticLabels[0];
		break;
	    }

            cell.innerHTML = '&nbsp;<b>' + label + '</b>&nbsp;'
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(i + 1);
        cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';
        cell.innerHTML = '&nbsp;<b>' + _('note') + '</b>&nbsp;'
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        // One row per voice (turtle)
        var activeTurtles = 0;
        for (var turtle = 0; turtle < this._logo.turtles.turtleList.length; turtle++) {
            if (this._logo.turtles.turtleList[turtle].trash) {
                continue;
            }

            var row = header.insertRow(activeTurtles + 1);
            var cell = row.insertCell(0);
            cell.style.backgroundColor = MATRIXLABELCOLOR;

            cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/turtle-button.svg" title="' + this._logo.turtles.turtleList[turtle].name + '" alt="' + this._logo.turtles.turtleList[turtle].name + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';

            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';

            // + 1 is for the note column
            for (var i = 0; i < this._logo.statusFields.length + 1; i++) {
                var cell = row.insertCell(-1);
                cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';
                cell.innerHTML = '';
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            }

            activeTurtles += 1;
        }
    };

    this.updateAll = function() {
        // Update status of all of the voices in the matrix.
        var table = docById('statusTable');

        var activeTurtles = 0;
        for (var turtle = 0; turtle < this._logo.turtles.turtleList.length; turtle++) {
            if (this._logo.turtles.turtleList[turtle].trash) {
                continue;
            }

            for (var i = 0; i < this._logo.statusFields.length; i++) {
                var saveStatus = this._logo.inStatusMatrix;
                this._logo.inStatusMatrix = false;

                this._logo.parseArg(this._logo, turtle, this._logo.statusFields[i][0]);
                var innerHTML = this._logo.blocks.blockList[this._logo.statusFields[i][0]].value;
                this._logo.inStatusMatrix = saveStatus;

                var cell = table.rows[activeTurtles + 1].cells[i + 1];
                if (cell != null) {
                    cell.innerHTML = innerHTML;
                }
            }

            var note = '';
            var value = '';
            if (this._logo.noteStatus[turtle] != null) {
                var notes = this._logo.noteStatus[turtle][0];
                for (var j = 0; j < notes.length; j++) {
                    note += notes[j];
                    note += ' ';
                }
                var value = this._logo.noteStatus[turtle][1];
                note += value;
            }

            var cell = table.rows[activeTurtles + 1].cells[i + 1];
            if (cell != null) {
                cell.innerHTML = note.replace(/#/g, '♯').replace(/b/, '♭');
            }

            activeTurtles += 1;
        }
    };
};
