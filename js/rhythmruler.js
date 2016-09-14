// Copyright (c) 2016 Walter Bender
// Copyright (c) 2016 Hemant Kasat
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to create a rhythms which can be imported
// into the pitch-time matrix and hence used to create chunks of
// notes.


function RhythmRuler () {
    // There is one ruler per drum.
    this.Drums = [];
    // Rulers, one per drum, contain the subdivisions defined by rhythm blocks.
    this.Rulers = [];
    // Save the history of divisions so as to be able to restore them.
    this._dissectHistory = [];

    this._playing = false;
    this._playingOne = false;
    this._playingAll = false;
    this._cellCounter = 0;

    // Keep a running time for each ruler to maintain sync.
    this._runningTimes = [];
    // Starting time from which we measure for sync.
    this._startingTime = null;
    this._offset = 0;
    this._rulerSelected = 0;
    this._rulerPlaying = -1;

    this._noteWidth = function (noteValue) {
        return Math.floor(EIGHTHNOTEWIDTH * (8 / noteValue) * this._cellScale * 3) + 'px';
    };

    this._calculateZebraStripes = function(rulerno) {
        var ruler = docById('ruler' + rulerno);
        if (this._rulerSelected % 2 === 0) {
            var evenColor = MATRIXNOTECELLCOLOR;
        } else {
            var evenColor = MATRIXNOTECELLCOLORHOVER;
        }

        for (var i = 0; i < ruler.cells.length; i++) {
            var newCell = ruler.cells[i];
            if (evenColor === MATRIXNOTECELLCOLOR) {
                if (i % 2 === 0) {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                } else {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                }
            }

            if (evenColor === MATRIXNOTECELLCOLORHOVER) {
                if (i % 2 === 0) {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                } else {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                }
            }
        }
    };

    this._dissectRuler = function (event) {
        var inputNum = docById('dissectNumber').value;
        if (isNaN(inputNum)) {
            inputNum = 2;
        } else {
            inputNum = Math.abs(Math.floor(inputNum));
        }

        docById('dissectNumber').value = inputNum;

        var cell = event.target;
        this._rulerSelected = cell.parentNode.id[5];
        this.__dissect(cell, inputNum);
    };

    this.__dissect = function (cell, inputNum) {
        var that = this;

        var ruler = docById('ruler' + this._rulerSelected);
        var newCellIndex = cell.cellIndex;
        var noteValues = this.Rulers[this._rulerSelected][0];
        var divisionHistory = this.Rulers[this._rulerSelected][1];

        divisionHistory.push([newCellIndex, inputNum]);
        ruler.deleteCell(newCellIndex);

        var noteValue = noteValues[newCellIndex];
        var newNoteValue = inputNum * noteValue;
        var tempwidth = this._noteWidth(newNoteValue);
        var tempwidthPixels = parseFloat(inputNum) * parseFloat(tempwidth) + 'px';
        var difference = parseFloat(this._noteWidth(noteValue)) - parseFloat(inputNum) * parseFloat(tempwidth);
        var newCellWidth = parseFloat(this._noteWidth(newNoteValue)) + parseFloat(difference) / inputNum + 'px';
        noteValues.splice(newCellIndex, 1);

        for (var i = 0; i < inputNum; i++) {
            var newCell = ruler.insertCell(newCellIndex+i);
            noteValues.splice(newCellIndex + i, 0, newNoteValue);
            newCell.innerHTML = calcNoteValueToDisplay(newNoteValue, 1);
            newCell.style.width = newCellWidth;
            newCell.style.minWidth = newCell.style.width;
            newCell.style.maxWidth = newCell.style.width;
            newCell.addEventListener('click', function(event) {
                that._dissectRuler(event);
            });
        }
        this._calculateZebraStripes(that._rulerSelected);
    };

    this._undo = function() {
        var divisionHistory = this.Rulers[this._rulerSelected][1];
        if (divisionHistory.length === 0) {
            // FIXME: Cycle through other rulers if necessary.
            return;
        }
        var ruler = docById('ruler' + this._rulerSelected);
        var noteValues = this.Rulers[this._rulerSelected][0];
        var inputNum = divisionHistory[divisionHistory.length - 1][1];
        var newCellIndex = divisionHistory[divisionHistory.length - 1][0];
        var cellWidth = ruler.cells[newCellIndex].style.width;
        var newCellWidth = parseFloat(cellWidth)*inputNum;
        var oldCellNoteValue = noteValues[newCellIndex];
        var newNoteValue = oldCellNoteValue/inputNum;

        var newCell = ruler.insertCell(newCellIndex);
        newCell.style.width = this._noteWidth(newNoteValue);
        newCell.style.minWidth = newCell.style.width;
        newCell.style.maxWidth = newCell.style.width;
        newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
        newCell.innerHTML = calcNoteValueToDisplay(oldCellNoteValue/inputNum, 1);

        noteValues[newCellIndex] = oldCellNoteValue/inputNum;
        noteValues.splice(newCellIndex + 1, inputNum - 1);

        var that = this;
        newCell.addEventListener('click', function(event) {
            console.log('adding DISSECT event too');
            that._dissectRuler(event);
        });

        for (var i = 0; i < inputNum; i++) {
            ruler.deleteCell(newCellIndex + 1);
        }

        divisionHistory.pop();
        this._calculateZebraStripes(this._rulerSelected);
    };

    this.__playNote = function(i) {
        var noteValues = this.Rulers[i][0];
        var noteValue = noteValues[0];
        var drumBlockNo = this._logo.blocks.blockList[this.Drums[i]].connections[1];
        var drum = this._logo.blocks.blockList[drumBlockNo].value;
        var ruler = docById('ruler' + i);
        var cell = ruler.cells[0];
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        this._logo.synth.trigger(0, this._logo.defaultBPMFactor / noteValue, drum);
        if (this._playingAll || this._playingOne) {
            this.__loop(0, 0, i, 1);
        }
    }

    this._playAll = function() {
        this._logo.synth.stop();
        if (this._startingTime == null) {
            var d = new Date();
            this._startingTime = d.getTime();
            this._offset = 0;
        }

        for (var i = 0; i < this.Rulers.length; i++) {
            this.__playNote(i);
        }
    };

    this._playOne = function() {
        this._logo.synth.stop();
        if (this._startingTime == null) {
            var d = new Date();
            this._startingTime = d.getTime();
            this._offset = 0;
        }

        this.__playNote(this._rulerSelected);
    };

    this.__loop = function(time, notesCounter, rulerNo, colIndex) {
        if (docById('rulerBody').style.visibility === 'hidden') {
            return;
        }

        if (docById('drumDiv').style.visibility === 'hidden') {
            return;
        }

        var noteValues = this.Rulers[rulerNo][0];
        var noteValue = noteValues[notesCounter];
        time = 1 / noteValue;
        var drumblockno = this._logo.blocks.blockList[this.Drums[rulerNo]].connections[1];
        var drum = this._logo.blocks.blockList[drumblockno].value;

        var that = this;
        setTimeout(function() {
            var ruler = docById('ruler' + rulerNo);
            if (ruler == null) {
                console.log('Cannot find ruler ' + rulerNo + '. Widget closed?');
		return;
            }

            if (notesCounter === noteValues.length - 1) {
                // When we get to the end of the rulers, reset the background color.
                for (var i = 0; i < ruler.cells.length; i++) {
                    var cell = ruler.cells[i];
                    cell.style.backgroundColor =  MATRIXNOTECELLCOLOR;
                }
            } else {
                // Mark the current cell.
                var cell = ruler.cells[colIndex];
                if (that._playing) {
                    cell.style.backgroundColor = MATRIXBUTTONCOLOR;
                }
            }

            if (notesCounter >= noteValues.length) {
                notesCounter = 1;
                that._logo.synth.stop()
            }

            notesCounter += 1;
            colIndex += 1;
            if (that._playing) {
                var d = new Date();
                that._offset = d.getTime() - that._startingTime - that._runningTimes[rulerNo];
                that._logo.synth.trigger([0], that._logo.defaultBPMFactor / noteValue, drum);
            }

            if (notesCounter < noteValues.length) {
                if (that._playing) {
                    that.__loop(time, notesCounter, rulerNo, colIndex);
                }
            } else {
                that._cellCounter += 1;
            }

            if (that._playingAll) {
                if (that._cellCounter === that.Rulers.length) {
                    that._cellCounter = 0;
                    var cell = ruler.cells[0];
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;

                    for (var i = 0; i < that.Rulers.length; i++) {
                        that._calculateZebraStripes(i);
                    }

                    that._playAll();
                }
            } else if (that._playingOne) {
                if (that._cellCounter === 1) {
                    that._cellCounter = 0;
                    var cell = ruler.cells[0];
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;

                    that._calculateZebraStripes(that._rulerPlaying);

                    that._playOne();
                }
            }
        }, this._logo.defaultBPMFactor * 1000 * time - this._offset);

        that._runningTimes[rulerNo] += that._logo.defaultBPMFactor * 1000 * time;
    };

    this._save = function(selectedRuler) {
        var that = this;
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        setTimeout(function() {
            var ruler = docById('ruler' + selectedRuler);
            var noteValues = that.Rulers[selectedRuler][0];

            var delta = selectedRuler * 42;
            var newStack = [[0, ['action', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, 2, null]], [1, ['text', {'value': 'rhythm'}], 0, 0, [0]]];
            var previousBlock = 0;
            var sameNoteValue = 1;
            for (var i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    var idx = newStack.length;
                    var noteValue = noteValues[i];

                    newStack.push([idx, 'rhythm', 0, 0, [previousBlock, idx + 1, idx + 2, idx + 3]]);
                    newStack.push([idx + 1, ['number', {'value': sameNoteValue}], 0, 0, [idx]]);
                    newStack.push([idx + 2, ['number', {'value': noteValue}], 0, 0, [idx]]);
                    if (i == ruler.cells.length - 1) {
                        newStack.push([idx + 3, 'hidden', 0, 0, [idx, null]]);
                    }
                    else {
                        newStack.push([idx + 3, 'hidden', 0, 0, [idx, idx + 4]]);
                    }

                    previousBlock = idx + 3;
                    sameNoteValue = 1;
                }
            }

            that._logo.blocks.loadNewBlocks(newStack);
            if (selectedRuler > that.Rulers.length - 2) {
                return;
            } else {
                that._save(selectedRuler + 1);
            }
        }, 500);
    };

    this._saveDrumMachine = function(selectedRuler) {
        var that = this;
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        setTimeout(function() {
            var ruler = docById('ruler' + selectedRuler);
            var noteValues = that.Rulers[selectedRuler][0];

            var delta = selectedRuler * 42;
            var newStack = [[0, ['start', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, null]]];
            newStack.push([1, 'forever', 0, 0, [0, 2, null]]);
            var previousBlock = 1;
            var sameNoteValue = 1;
            for (var i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    var idx = newStack.length;
                    var noteValue = noteValues[i];

                    var drumBlockNo = that._logo.blocks.blockList[that.Drums[selectedRuler]].connections[1];
                    var drum = that._logo.blocks.blockList[drumBlockNo].value;

                    if (sameNoteValue === 1) {
                        // Add a note block
                        newStack.push([idx, 'note', 0, 0, [previousBlock, idx + 1, idx + 2, idx + 4]]);
                        newStack.push([idx + 1, ['number', {'value': noteValue}], 0, 0, [idx]]);
                        newStack.push([idx + 2, 'playdrum', 0, 0, [idx, idx + 3, null]]);
                        newStack.push([idx + 3, ['drumname', {'value': drum}], 0, 0, [idx + 2]]);
                        if (i == ruler.cells.length - 1) {
                            newStack.push([idx + 4, 'hidden', 0, 0, [idx, null]]);
                        } else {
                            newStack.push([idx + 4, 'hidden', 0, 0, [idx, idx + 5]]);
                            previousBlock = idx + 4;
                        }
                    } else {
                        // Add a note block inside a repeat block
                        if (i == ruler.cells.length - 1) {
                            newStack.push([idx, 'repeat', 0, 0, [previousBlock, idx + 1, idx + 2, null]]);
                        } else {
                            newStack.push([idx, 'repeat', 0, 0, [previousBlock, idx + 1, idx + 2, idx + 7]]);
                            previousBlock = idx;
                        }
                        newStack.push([idx + 1, ['number', {'value': sameNoteValue}], 0, 0, [idx]]);
                        newStack.push([idx + 2, 'note', 0, 0, [idx, idx + 3, idx + 4, idx + 6]]);
                        newStack.push([idx + 3, ['number', {'value': noteValue}], 0, 0, [idx + 2]]);
                        newStack.push([idx + 4, 'playdrum', 0, 0, [idx + 2, idx + 5, null]]);
                        newStack.push([idx + 5, ['drumname', {'value': drum}], 0, 0, [idx + 4]]);
                        newStack.push([idx + 6, 'hidden', 0, 0, [idx + 2, null]]);
                    }

                    sameNoteValue = 1;
                }
            }

            that._logo.blocks.loadNewBlocks(newStack);
            if (selectedRuler > that.Rulers.length - 2) {
                return;
            } else {
                that._saveDrumMachine(selectedRuler + 1);
            }
        }, 500);
    };

    this.init = function(logo) {
        console.log('init RhythmRuler');
        this._logo = logo;

        docById('rulerBody').style.display = 'inline';
        console.log('setting RhythmRuler visible');
        docById('rulerBody').style.visibility = 'visible';
        docById('rulerBody').style.border = 2;

        docById('drumDiv').style.display = 'inline';
        docById('drumDiv').style.visibility = 'visible';
        docById('drumDiv').style.border = 2;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = Math.floor(this._cellScale * 24);

        docById('rulerBody').style.width = Math.floor(w / 2) + 'px';
        docById('rulerBody').style.overflowX = 'auto';

        docById('drumDiv').style.width = Math.max(iconSize, Math.floor(w / 24)) + 'px';
        docById('drumDiv').style.overflowX = 'auto';

        var that = this;
        var table = docById('buttonTable');

        if (table !== null) {
            table.remove();
        }

        var table = docById('drum');

        if (table !== null) {
            table.remove();
        }

        this._runningTimes = [];
        for (var i = 0; i < this.Rulers.length; i++) {
            var rulertable = docById('rulerTable' + i);
            var rulerdrum = docById('rulerdrum' + i);
            this._runningTimes.push(0);
        }

        // The play all button
        var x = document.createElement('TABLE');
        x.setAttribute('id', 'drum');
        x.style.textAlign = 'center';
        x.style.borderCollapse = 'collapse';
        x.cellSpacing = 0;
        x.cellPadding = 0;

        var drumDiv = docById('drumDiv');
        drumDiv.style.paddingTop = 0 + 'px';
        drumDiv.style.paddingLeft = 0 + 'px';
        drumDiv.appendChild(x);
        drumDivPosition = drumDiv.getBoundingClientRect();

        var table = docById('drum');
        var row = table.insertRow(0);
        row.setAttribute('id', 'playalldrums');
        row.style.left = Math.floor(drumDivPosition.left) + 'px';
        row.style.top = Math.floor(drumDivPosition.top) + 'px';

        var cell = this._addButton(row, -1, 'play-button.svg', iconSize, _('play all'));

        cell.onclick=function() {
            if (that._playing) {
                if (that._playingAll) {
                    this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play all') + '" alt="' + _('play all') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                    that._playing = false;
                    that._playingAll = false;
                    that._playingOne = false;
                    that._rulerPlaying = -1;
                    that._startingTime = null;
                    for (var i = 0; i < that.Rulers.length; i++) {
                        that._calculateZebraStripes(i);
                    }
                }
            }
            else {
                if (!that._playingAll) {
                    this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                    that._logo.setTurtleDelay(0);
                    that._playingAll = true;
                    that._playing = true;
                    that._playingOne = false;
                    that._cellCounter = 0;
                    that._rulerPlaying = -1;
                    for (var i = 0; i < that.Rulers.length; i++) {
                        that._runningTimes[i] = 0;
                    }

                    that._playAll();
                }
            }
        };

        // Add rows for drum play buttons.
        for (var i = 0; i < this.Rulers.length; i++) {
            var row = table.insertRow(i + 1);
            row.setAttribute('id', 'drum' + i);
        }

        // Add tool buttons to top row
        var x = document.createElement('TABLE');
        x.setAttribute('id', 'buttonTable');
        x.style.textAlign = 'center';
        x.style.borderCollapse = 'collapse';
        x.cellSpacing = 0;
        x.cellPadding = 0;

        var rulerBodyDiv = docById('rulerBody');
        rulerBodyDiv.style.paddingTop = 0 + 'px';
        rulerBodyDiv.style.paddingLeft = 0 + 'px';
        rulerBodyDiv.appendChild(x);
        rulerBodyDivPosition = rulerBodyDiv.getBoundingClientRect();

        var table = docById('buttonTable');
        var header = table.createTHead();
        var row = header.insertRow(0);

        var cell = this._addButton(row, -1, 'export-chunk.svg', iconSize, _('save rhythms'));
        cell.onclick=function() {
            that._save(0);
        };

        var cell = this._addButton(row, 1, 'export-drums.svg', iconSize, _('save drum machine'));
        cell.onclick=function() {
            that._saveDrumMachine(0);
        };

        var cell = this._addButton(row, 2, 'restore-button.svg', iconSize, _('undo'));
        cell.onclick=function() {
            that._undo();
        };

        // An input for setting the dissect number
        var cell = row.insertCell(2);
        cell.innerHTML = '<input id="dissectNumber" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="dissectNumber" type="dussectNumber" value="' + 2 + '" />';
        cell.style.top = 0;
        cell.style.left = 0;
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        // FIXME: should be contained in click event
        docById('dissectNumber').classList.add('hasKeyboard');

        var cell = this._addButton(row, 4, 'close-button.svg', iconSize, _('close'));
        cell.onclick=function() {
            // Save the new dissect history
            var dissectHistory = [];
            var drums = [];
            for (var i = 0; i < that.Rulers.length; i++) {
                var history = [];
                for (var j = 0; j < that.Rulers[i][1].length; j++) {
                    history.push(that.Rulers[i][1][j]);
                }

                dissectHistory.push([history, that.Drums[i]]);
                drums.push(that.Drums[i]);
            }

            // Look for any old entries that we may have missed.
            for (var i = 0; i < that._dissectHistory.length; i++) {
                var drum = that._dissectHistory[i][1];
                if (drums.indexOf(drum) === -1) {
                    var history = JSON.parse(JSON.stringify(that._dissectHistory[i][0]));
                    dissectHistory.push([history, drum]);
                }
            }

            that._dissectHistory = JSON.parse(JSON.stringify(dissectHistory));

            for (var i = 0; i < that.Rulers.length; i++) {
                var rulertable = docById('rulerTable' + i);
                var rulerdrum = docById('rulerdrum' + i);
                if (rulertable !== null) {
                    rulertable.remove();
                }
                if (rulerdrum !== null) {
                    rulerdrum.remove();
                }
            }

            docById('rulerBody').style.visibility = 'hidden';
            docById('drumDiv').style.visibility = 'hidden';
            docById('rulerBody').style.border = 0;
            docById('drumDiv').style.border = 0;
            that._playing = false;
            that._playingOne = false;
            that._playingAll = false;
            // FIXME: should be contained in click event
            docById('dissectNumber').classList.remove('hasKeyboard');
        };

        // Create a play button for each ruler
        var table = docById('drum');
        for (var i = 0; i < this.Rulers.length; i++) {
            var row = table.rows[i + 1];
            var drumcell = this._addButton(row, -1, 'play-button.svg', iconSize, _('play'));
            drumcell.onclick=function() {
                if (that._playing) {
                    if (this.parentNode.id[4] === that._rulerPlaying) {
                        this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                        that._playing = false;
                        that._playingOne = false;
                        that._playingAll = false;
                        that._rulerPlaying = -1;
                        that._startingTime = null;
                        setTimeout(that._calculateZebraStripes(this.parentNode.id[4]),1000);
                    }
                }
                else {
                    if (that._playingOne === false) {
                        that._rulerSelected = this.parentNode.id[4];
                        that._logo.setTurtleDelay(0);
                        that._playing = true;
                        that._playingOne = true;
                        that._playingAll = false;
                        that._cellCounter = 0;
                        that._rulerPlaying = this.parentNode.id[4];
                        this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                        that._runningTimes[i] = 0;
                        that._playOne();
                    }
                }
            };

            // Create individual rulers as tables.
            var rulerTable = document.createElement('TABLE');
            rulerTable.setAttribute('id', 'rulerTable' + i);
            rulerTable.style.textAlign = 'center';
            rulerTable.style.borderCollapse = 'collapse';
            rulerTable.cellSpacing = 0;
            rulerTable.cellPadding = 0;
            rulerBodyDiv.appendChild(rulerTable);

            var row = rulerTable.insertRow(-1);
            row.style.left = Math.floor(rulerBodyDivPosition.left) + 'px';
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            row.setAttribute('id', 'ruler' + i);
            for (var j = 0; j < that.Rulers[i][0].length; j++) {
                var noteValue = that.Rulers[i][0][j];
                var rulercell = row.insertCell(j);
                rulercell.innerHTML = calcNoteValueToDisplay(noteValue, 1);
                rulercell.style.width = that._noteWidth(noteValue);
                rulercell.minWidth = rulercell.style.width;
                rulercell.maxWidth = rulercell.style.width;
                rulercell.style.lineHeight = 60 + ' % ';
                if (i % 2 === 0) {
                    if (j % 2 === 0) {
                        rulercell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    } else {
                        rulercell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    }
                } else {
                    if (j % 2 === 0) {
                        rulercell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    } else {
                        rulercell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    }
                }

                rulercell.addEventListener('click', function(event) {
                    that._dissectRuler(event);
                });
            }

            // Match the play button height to the ruler height.
            table.rows[i + 1].cells[0].style.height = row.offsetHeight + 'px';
        }

        // Restore dissect history.
        for (var drum = 0; drum < this.Drums.length; drum++) {
            for (var i = 0; i < this._dissectHistory.length; i++) {
                if (this._dissectHistory[i][1] !== this.Drums[drum]) {
                    continue;
                }

                var rulerTable = docById('rulerTable' + drum);
                for (var j = 0; j < this._dissectHistory[i].length; j++) {
                    this._rulerSelected = drum;
                    if (this._dissectHistory[i][0][j] == undefined) {
                        continue;
                    }

                    var cell = rulerTable.rows[0].cells[this._dissectHistory[i][0][j][0]];
                    if (cell != undefined) {
                        this.__dissect(cell, this._dissectHistory[i][0][j][1]);
                    } else {
                        console.log('Could not find cell to divide. Did the order of the rhythm blocks change?');
                    }
                }
            }
        }
    };

    this._addButton = function(row, colIndex, icon, iconSize, label) {
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
};
