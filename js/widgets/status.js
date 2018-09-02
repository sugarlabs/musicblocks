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

// This widget makes displays the status of selected parameters and
// notes as they are being played.


function StatusMatrix() {
    const BUTTONDIVWIDTH = 128;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const OUTERWINDOWWIDTH = 620;
    const INNERWINDOWWIDTH = OUTERWINDOWWIDTH - BUTTONSIZE * 1.5;
    var x, y;  //Drop coordinates of statusDiv

    docById('statusDiv').style.visibility = 'hidden';

    this.init = function(logo) {
        // Initializes the status matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        this._logo = logo;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var statusDiv = docById('statusDiv');
        statusDiv.style.visibility = 'visible';
        statusDiv.setAttribute('draggable', 'true');

        // The status buttons
        var statusButtonsDiv = docById('statusButtonsDiv');
        statusButtonsDiv.style.display = 'inline';
        statusButtonsDiv.style.visibility = 'visible';
        statusButtonsDiv.style.width = BUTTONDIVWIDTH;
        statusButtonsDiv.innerHTML = '<table cellpadding="0px" id="statusButtonTable"></table>';

        var buttonTable = docById('statusButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));

        cell.onclick=function() {
            statusTableDiv.style.visibility = 'hidden';
            statusButtonsDiv.style.visibility = 'hidden';
            statusDiv.style.visibility = 'hidden';
        }

        // We use this cell as a handle for dragging.
        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - statusDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - statusDiv.getBoundingClientRect().top;
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
                x = e.clientX - that._dx;
                statusDiv.style.left = x + 'px';
                y = e.clientY - that._dy;
                statusDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        statusDiv.ondragover = function(e) {
            e.preventDefault();
        };

        statusDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                x = e.clientX - that._dx;
                statusDiv.style.left = x + 'px';
                y = e.clientY - that._dy;
                statusDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        statusDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        statusDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The status table
        var statusTableDiv = docById('statusTableDiv');
        statusTableDiv.style.display = 'inline';
        statusTableDiv.style.visibility = 'visible';
        statusTableDiv.style.border = '0px';

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        statusTableDiv.innerHTML = '<div id="statusOuterDiv"><div id="statusInnerDiv"><table cellpadding="0px" id="statusTable"></table></div></div>';

        var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);
        var outerDiv = docById('statusOuterDiv');
        if (this._logo.turtles.turtleList.length > n) {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (n + 2) + 'px';
            var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        } else {
            if (this._logo.statusFields.length > 4) { // Assume we need a horizontal slider
                outerDiv.style.height = this._cellScale * (MATRIXBUTTONHEIGHT2 + (2 + MATRIXSOLFEHEIGHT) * this._logo.turtles.turtleList.length) + 30 + 'px';
            } else {
                outerDiv.style.height = this._cellScale * (MATRIXBUTTONHEIGHT2 + (2 + MATRIXSOLFEHEIGHT) * this._logo.turtles.turtleList.length) + 'px';
            }
            var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH - 20), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        }

        var w = Math.max(Math.min(window.innerWidth, this._cellScale * INNERWINDOWWIDTH), BUTTONDIVWIDTH - BUTTONSIZE);
        var innerDiv = docById('statusInnerDiv');
        innerDiv.style.width = w + 'px';
        innerDiv.style.marginLeft = (BUTTONSIZE * this._cellScale) + 'px';

        // Each row in the status table contains a note label in the
        // first column and a table of buttons in the second column.
        var statusTable = docById('statusTable');

        var header = statusTable.createTHead();
        var row = header.insertRow();

        var iconSize = Math.floor(this._cellScale * 24);

        var cell = row.insertCell();
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.className = 'headcol';
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.width = (BUTTONSIZE * this._cellScale) + 'px';
        cell.innerHTML = '&nbsp;';

        // One column per field
        for (var i = 0; i < this._logo.statusFields.length; i++) {
            var cell = row.insertCell(i + 1);
            cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';

            switch (this._logo.statusFields[i][1]) {
            case 'plus':
            case 'minus':
            case 'neg':
            case 'divide':
            case 'power':
            case 'multiply':
            case 'sqrt':
            case 'int':
            case 'mod':
                var label = '';
                break;
            case 'namedbox':
                var label = this._logo.blocks.blockList[this._logo.statusFields[i][0]].privateData;
                break;
            default:
                var label = this._logo.blocks.blockList[this._logo.statusFields[i][0]].protoblock.staticLabels[0];
                break;
            }

            cell.innerHTML = '&nbsp;<b>' + label + '</b>&nbsp;'
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            var cell = row.insertCell();
            cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';
            cell.innerHTML = '&nbsp;<b>' + _('note') + '</b>&nbsp;'
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        // One row per voice (turtle)
        var activeTurtles = 0;
        for (var turtle = 0; turtle < this._logo.turtles.turtleList.length; turtle++) {
            if (this._logo.turtles.turtleList[turtle].trash) {
                continue;
            }

            var row = header.insertRow();
            var cell = row.insertCell();
            cell.style.backgroundColor = MATRIXLABELCOLOR;

            if (_THIS_IS_MUSIC_BLOCKS_) {
                cell.innerHTML = '&nbsp;&nbsp;<img src="images/mouse.svg" title="' + this._logo.turtles.turtleList[turtle].name + '" alt="' + this._logo.turtles.turtleList[turtle].name + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';
            } else {
                cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/turtle-button.svg" title="' + this._logo.turtles.turtleList[turtle].name + '" alt="' + this._logo.turtles.turtleList[turtle].name + '" height="' + iconSize + '" width="' + iconSize + '">&nbsp;&nbsp;';
            }

            cell.style.width = (BUTTONSIZE * this._cellScale) + 'px';
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
            cell.className = 'headcol';

            if (_THIS_IS_MUSIC_BLOCKS_) {
                // + 1 is for the note column
                for (var i = 0; i < this._logo.statusFields.length + 1; i++) {
                    var cell = row.insertCell();
                    cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                    cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';
                    cell.innerHTML = '';
                    cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                }
            } else {
                for (var i = 0; i < this._logo.statusFields.length; i++) {
                    var cell = row.insertCell();
                    cell.style.backgroundColor = MATRIXRHYTHMCELLCOLOR;
                    cell.style.fontSize = Math.floor(this._cellScale * 100) + '%';
                    cell.innerHTML = '';
                    cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 'px';
                }
            }

            activeTurtles += 1;
        }
    };

    this.updateAll = function() {
        // Update status of all of the voices in the matrix.
        var table = docById('statusTable');
        statusDiv.style.top = y + 'px';
        statusDiv.style.left = x + 'px';

	this._logo.updatingStatusMatrix = true;

        var activeTurtles = 0;
        for (var turtle = 0; turtle < this._logo.turtles.turtleList.length; turtle++) {
            if (this._logo.turtles.turtleList[turtle].trash) {
                continue;
            }

            for (var i = 0; i < this._logo.statusFields.length; i++) {
                var saveStatus = this._logo.inStatusMatrix;
                this._logo.inStatusMatrix = false;

                this._logo.parseArg(this._logo, turtle, this._logo.statusFields[i][0]);
                switch (this._logo.blocks.blockList[this._logo.statusFields[i][0]].name) {
                case 'x':
                case 'y':
                case 'heading':
                    var value = this._logo.blocks.blockList[this._logo.statusFields[i][0]].value.toFixed(2);
                    break;
                case 'mynotevalue':
                    var value = mixedNumber(this._logo.blocks.blockList[this._logo.statusFields[i][0]].value);
		    break;
                case 'elapsednotes2':
                    var blk = this._logo.statusFields[i][0];
                    var cblk = this._logo.blocks.blockList[blk].connections[1];
                    var notevalue = this._logo.parseArg(this._logo, turtle, cblk, blk, null);
                    var value = mixedNumber(this._logo.blocks.blockList[this._logo.statusFields[i][0]].value) + ' × ' + mixedNumber(notevalue);
                    break;
                case 'elapsednotes':
                    var value = mixedNumber(this._logo.blocks.blockList[this._logo.statusFields[i][0]].value);
                    break;
                case 'namedbox':
                    var name = this._logo.blocks.blockList[this._logo.statusFields[i][0]].privateData;
                    if (name in this._logo.boxes) {
                        var value = this._logo.boxes[name];
                    } else {
                        var value = '';
                    }
                    break;
                case 'beatvalue':
                    var value = mixedNumber(this._logo.currentBeat[turtle]);
                    break;
                case 'measurevalue':
                    var value = this._logo.currentMeasure[turtle];
                    break;
                case 'pitchinhertz':
                    var value = '';
                    if (this._logo.noteStatus[turtle] != null) {
                        var notes = this._logo.noteStatus[turtle][0];
                        for (var j = 0; j < notes.length; j++) {
                            if (j > 0) {
                                value += ' ';
                            }

                            value += this._logo.synth.getFrequency(notes[j], this._logo.synth.changeInTemperament).toFixed(2);
                        }
                    }
                    break;
                default:
                    var value = this._logo.blocks.blockList[this._logo.statusFields[i][0]].value;
                    break;
                }

                var innerHTML = value;

                this._logo.inStatusMatrix = saveStatus;

                var cell = table.rows[activeTurtles + 1].cells[i + 1];
                if (cell != null) {
                    cell.innerHTML = innerHTML;
                }
            }

            if (_THIS_IS_MUSIC_BLOCKS_) {
                var note = '';
                var value = '';
                if (this._logo.noteStatus[turtle] != null) {
                    var notes = this._logo.noteStatus[turtle][0];
                    for (var j = 0; j < notes.length; j++) {
                        if (typeof(notes[j]) === 'number') {
                            note += toFixed2(notes[j]);
                            note += 'Hz ';
                        } else {
                            note += notes[j];
                            note += ' ';
                        }
                    }
                    var value = this._logo.noteStatus[turtle][1];

                    var obj = rationalToFraction(value);
                    note += obj[1] + '/' + obj[0];
                }

                var cell = table.rows[activeTurtles + 1].cells[i + 1];
                if (cell != null) {
                    cell.innerHTML = note.replace(/#/g, '♯').replace(/b/g, '♭');
                }
            }

            activeTurtles += 1;
        }

        this._logo.updatingStatusMatrix = false;
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
};
