// Copyright (c) 2016-17 Walter Bender
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


// rulerButtonsDiv is for the widget buttons
// rulerTableDiv is for the drum buttons (fixed first col) and the ruler cells

function RhythmRuler () {
    const BUTTONDIVWIDTH = 476;  // 8 buttons 476 = (55 + 4) * 8
    const OUTERWINDOWWIDTH = 675;
    const INNERWINDOWWIDTH = 600;
    const RULERHEIGHT = 82;  // A little extra than we need for FF.
    const BUTTONSIZE = 51;
    const ICONSIZE = 32;
    const BACKSPACE = 8;

    // There is one ruler per drum.
    this.Drums = [];
    // Rulers, one per drum, contain the subdivisions defined by rhythm blocks.
    this.Rulers = [];
    // Save the history of divisions so as to be able to restore them.
    this._dissectHistory = [];
    this._undoList = [];

    this._playing = false;
    this._playingOne = false;
    this._playingAll = false;
    this._cellCounter = 0;

    // Keep a elapsed time for each ruler to maintain sync.
    this._elapsedTimes = [];
    // Starting time from which we measure for sync.
    this._startingTime = null;

    this._offsets = [];
    this._rulerSelected = 0;
    this._rulerPlaying = -1;

    this._noteWidth = function (noteValue) {
        return Math.floor(EIGHTHNOTEWIDTH * (8 / noteValue) * 3);
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
        if (this._playing) {
            console.log('You cannot dissect while widget is playing.');
            return;
        }

        var inputNum = docById('dissectNumber').value;
        if (inputNum === '' || isNaN(inputNum)) {
            inputNum = 2;
        } else {
            inputNum = Math.abs(Math.floor(inputNum));
        }

        docById('dissectNumber').value = inputNum;

        var cell = event.target;
        // Does this work if there are more than 10 rulers?
        this._rulerSelected = cell.parentNode.id[5];
        this.__dissect(cell, inputNum, true);
    };

    this.__dissect = function (cell, inputNum, addToUndoList) {
        var that = this;

        var ruler = docById('ruler' + this._rulerSelected);
        var newCellIndex = cell.cellIndex;
        try {
            var noteValues = this.Rulers[this._rulerSelected][0];
        } catch(e) {
            console.log(e);
            console.log(this._rulerSelected);
            return;
        }
        var divisionHistory = this.Rulers[this._rulerSelected][1];
        if (addToUndoList) {
            this._undoList.push(this._rulerSelected);
        }

        divisionHistory.push([newCellIndex, inputNum]);
        ruler.deleteCell(newCellIndex);

        var noteValue = noteValues[newCellIndex];
        var newNoteValue = inputNum * noteValue;
        var tempwidth = this._noteWidth(newNoteValue);
        var tempwidthPixels = parseFloat(inputNum) * parseFloat(tempwidth) + 'px';
        var difference = parseFloat(this._noteWidth(noteValue)) - parseFloat(inputNum) * parseFloat(tempwidth);
        var newCellWidth = parseFloat(this._noteWidth(newNoteValue)) + parseFloat(difference) / inputNum;
        noteValues.splice(newCellIndex, 1);

        for (var i = 0; i < inputNum; i++) {
            var newCell = ruler.insertCell(newCellIndex + i);
            noteValues.splice(newCellIndex + i, 0, newNoteValue);
            if (newCellWidth > 12) {
                newCell.innerHTML = calcNoteValueToDisplay(newNoteValue, 1);
            } else {
                newCell.innerHTML = '';

                newCell.addEventListener('mouseover', function() {
                    newCell.innerHTML = calcNoteValueToDisplay(newNoteValue, 1);
                });

                newCell.addEventListener('mouseout', function() {
                    newCell.innerHTML = '';
                });
            }

            newCell.style.width = newCellWidth + 'px';
            newCell.style.minWidth = newCell.style.width;
            newCell.style.maxWidth = newCell.style.width;
            newCell.addEventListener('click', function(event) {
                that._dissectRuler(event);
            });
        }
        this._calculateZebraStripes(that._rulerSelected);
    };

    this._undo = function() {
        this._logo.synth.stop();
        this._startingTime = null;

        if (this._undoList.length === 0) {
            return;
        }

        var lastRuler = this._undoList.pop();

        var divisionHistory = this.Rulers[lastRuler][1];
        if (divisionHistory.length === 0) {
            return;
        }
        var ruler = docById('ruler' + lastRuler);
        var noteValues = this.Rulers[lastRuler][0];
        var inputNum = divisionHistory[divisionHistory.length - 1][1];
        var newCellIndex = divisionHistory[divisionHistory.length - 1][0];
        var cellWidth = ruler.cells[newCellIndex].style.width;
        var newCellWidth = parseFloat(cellWidth)*inputNum;
        var oldCellNoteValue = noteValues[newCellIndex];
        var newNoteValue = oldCellNoteValue/inputNum;

        var newCell = ruler.insertCell(newCellIndex);
        newCell.style.width = this._noteWidth(newNoteValue) + 'px';
        newCell.style.minWidth = newCell.style.width;
        newCell.style.maxWidth = newCell.style.width;
        newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
        newCell.innerHTML = calcNoteValueToDisplay(oldCellNoteValue / inputNum, 1);

        noteValues[newCellIndex] = oldCellNoteValue / inputNum;
        noteValues.splice(newCellIndex + 1, inputNum - 1);

        var that = this;
        newCell.addEventListener('click', function(event) {
            that._dissectRuler(event);
        });

        for (var i = 0; i < inputNum; i++) {
            ruler.deleteCell(newCellIndex + 1);
        }

        divisionHistory.pop();
        this._calculateZebraStripes(lastRuler);
    };

    this._clear = function() {
        for (r = 0; r < this.Rulers.length; r++) {
            this._rulerSelected = r;
            while(this.Rulers[r][1].length > 0) {
                this._undo();
            }
        }
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
    }

    this.playAll = function() {
        this._logo.synth.stop();
        if (this._startingTime == null) {
            var d = new Date();
            this._startingTime = d.getTime();
            for (var i = 0; i < this.Rulers.length; i++) {
                this._offsets[i] = 0;
                this._elapsedTimes[i] = 0;
            }
        }

        for (var i = 0; i < this.Rulers.length; i++) {
            this.__playNote(i);
            this.__loop(0, 0, i, 1);
        }
    };

    this._playOne = function() {
        this._logo.synth.stop();
        if (this._startingTime == null) {
            var d = new Date();
            this._startingTime = d.getTime();
            this._elapsedTimes[this._rulerSelected] = 0;
            this._offsets[this._rulerSelected] = 0;
        }

        this.__playNote(this._rulerSelected);
        this.__loop(0, 0, this._rulerSelected, 1);
    };

    this.__loop = function(noteTime, notesCounter, rulerNo, colIndex) {
        if (docById('rulerDiv').style.visibility === 'hidden' || docById('rulerButtonsDiv').style.visibility === 'hidden' || docById('rulerTableDiv').style.visibility === 'hidden') {
            return;
        }

        var noteValues = this.Rulers[rulerNo][0];
        var noteValue = noteValues[notesCounter];
        noteTime = 1 / noteValue;
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
                // When we get to the end of the rulers, reset the
                // background color.
                for (var i = 0; i < ruler.cells.length; i++) {
                    var cell = ruler.cells[i];
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
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
                that._offsets[rulerNo] = d.getTime() - that._startingTime - that._elapsedTimes[rulerNo];
                that._logo.synth.trigger([0], that._logo.defaultBPMFactor / noteValue, drum);
            }

            if (notesCounter < noteValues.length) {
                if (that._playing) {
                    that.__loop(noteTime, notesCounter, rulerNo, colIndex);
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

                    that.playAll();
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
        }, this._logo.defaultBPMFactor * 1000 * noteTime - this._offsets[rulerNo]);

        this._elapsedTimes[rulerNo] += this._logo.defaultBPMFactor * 1000 * noteTime;
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
            // Get the first word of drum's name (ignore the word 'drum' itself)
            // and add 'rhythm'.
            var stack_value = (that._logo.blocks.blockList[that._logo.blocks.blockList[that.Drums[selectedRuler]].connections[1]].value).split(' ')[0] + '_' + _('rhythm');
            var delta = selectedRuler * 42;
            var newStack = [[0, ['action', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, 2, null]], [1, ['text', {'value': stack_value}], 0, 0, [0]]];
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
                        // Add a note block.
                        newStack.push([idx, 'newnote', 0, 0, [previousBlock, idx + 1, idx + 4, idx + 7]]);
                        newStack.push([idx + 1, 'divide', 0, 0, [idx, idx + 2, idx + 3]]);
                        newStack.push([idx + 2, ['number', {'value': 1}], 0, 0, [idx + 1]]);
                        newStack.push([idx + 3, ['number', {'value': noteValue}], 0, 0, [idx + 1]]);
                        newStack.push([idx + 4, 'vspace', 0, 0, [idx, idx + 5]]);
                        newStack.push([idx + 5, 'playdrum', 0, 0, [idx + 4, idx + 6, null]]);
                        newStack.push([idx + 6, ['drumname', {'value': drum}], 0, 0, [idx + 5]]);
                        if (i == ruler.cells.length - 1) {
                            newStack.push([idx + 7, 'hidden', 0, 0, [idx, null]]);
                        } else {
                            newStack.push([idx + 7, 'hidden', 0, 0, [idx, idx + 8]]);
                            previousBlock = idx + 7;
                        }
                    } else {
                        // Add a note block inside a repeat block.
                        if (i == ruler.cells.length - 1) {
                            newStack.push([idx, 'repeat', 0, 0, [previousBlock, idx + 1, idx + 2, null]]);
                        } else {
                            newStack.push([idx, 'repeat', 0, 0, [previousBlock, idx + 1, idx + 2, idx + 10]]);
                            previousBlock = idx;
                        }
                        newStack.push([idx + 1, ['number', {'value': sameNoteValue}], 0, 0, [idx]]);
                        newStack.push([idx + 2, 'newnote', 0, 0, [idx, idx + 3, idx + 6, idx + 9]]);
                        newStack.push([idx + 3, 'divide', 0, 0, [idx + 2, idx + 4, idx + 5]]);
                        newStack.push([idx + 4, ['number', {'value': 1}], 0, 0, [idx + 3]]);
                        newStack.push([idx + 5, ['number', {'value': noteValue}], 0, 0, [idx + 3]]);
                        newStack.push([idx + 6, 'vspace', 0, 0, [idx + 2, idx + 7]]);
                        newStack.push([idx + 7, 'playdrum', 0, 0, [idx + 6, idx + 8, null]]);
                        newStack.push([idx + 8, ['drumname', {'value': drum}], 0, 0, [idx + 7]]);
                        newStack.push([idx + 9, 'hidden', 0, 0, [idx + 2, null]]);
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

        this._playing = false;
        this._playingOne = false;
        this._playingAll = false;
        this._rulerPlaying = -1;
        this._startingTime = null;
        this._elapsedTimes = [];
        this._offsets = [];
        for (var i = 0; i < this.Rulers.length; i++) {
            this._elapsedTimes.push(0);
            this._offsets.push(0);
        }

        var w = window.innerWidth;
        this._cellScale = 1.0;
        var iconSize = ICONSIZE;

        var canvas = document.getElementById('myCanvas');

        // Position the widget and make it visible.
        var rulerDiv = docById('rulerDiv');
        rulerDiv.style.visibility = 'visible';
        rulerDiv.setAttribute('draggable', 'true');
        rulerDiv.style.left = '200px';
        rulerDiv.style.top = '150px';

        // The widget buttons
        var widgetButtonsDiv = docById('rulerButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table id="widgetButtonTable"></table>';

        var buttonTable = docById('widgetButtonTable');
        // buttonTable.style.
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        var cell = this._addButton(row, 'play-button.svg', iconSize, _('play all'), '');

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
                        that._elapsedTimes[i] = 0;
                        that._offsets[i] = 0;
                    }

                    that._playAll();
                }
            }
        };

        var cell = this._addButton(row, 'export-chunk.svg', iconSize, _('save rhythms'), '');
        cell.onclick=function() {
            that._save(0);
        };

        var cell = this._addButton(row, 'export-drums.svg', iconSize, _('save drum machine'), '');
        cell.onclick=function() {
            that._saveDrumMachine(0);
        };

        // An input for setting the dissect number
        var cell = row.insertCell();
        cell.innerHTML = '<input id="dissectNumber" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="dissectNumber" type="dussectNumber" value="' + 2 + '" />';
        cell.style.top = 0;
        cell.style.left = 0;
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        // FIXME: rough workaround for #508, investigate reasons why
        // the backspace press doesn't work by default
        var numberInput = docById('dissectNumber');
        numberInput.addEventListener('keydown', function(event) {
           if (event.keyCode === BACKSPACE)
               numberInput.value = numberInput.value.substring(0, numberInput.value.length-1);
        });

        var cell = this._addButton(row, 'restore-button.svg', iconSize, _('undo'), '');
        cell.onclick=function() {
            that._undo();
        };

        var cell = this._addButton(row, 'erase-button.svg', iconSize, _('clear'), '');
        cell.onclick=function() {
            that._clear();
        };

        var cell = this._addButton(row, 'close-button.svg', iconSize, _('close'), '');

        cell.onclick=function() {
            // Save the new dissect history.
            var dissectHistory = [];
            var drums = [];
            for (var i = 0; i < that.Rulers.length; i++) {
                var history = [];
                for (var j = 0; j < that.Rulers[i][1].length; j++) {
                    history.push(that.Rulers[i][1][j]);
                }

                docById('dissectNumber').classList.add('hasKeyboard');
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

            rulerTableDiv.style.visibility = 'hidden';
            widgetButtonsDiv.style.visibility = 'hidden';
            rulerDiv.style.visibility = 'hidden';

            that._playing = false;
            that._playingOne = false;
            that._playingAll = false;
        };

        // We use this cell as a handle for dragging.
        var cell = this._addButton(row, 'grab.svg', iconSize, _('drag'), '');

        cell.style.cursor = 'move';

        this._dx = cell.getBoundingClientRect().left - rulerDiv.getBoundingClientRect().left;
        this._dy = cell.getBoundingClientRect().top - rulerDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = cell.innerHTML;

        cell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
            cell.innerHTML = '';
        };

        cell.onmouseout = function(e) {
            if (!that._dragging) {
                cell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                rulerDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                rulerDiv.style.top = y + 'px';
                cell.innerHTML = that._dragCellHTML;
            }
        };

        rulerDiv.ondragover = function(e) {
            e.preventDefault();
        };

        rulerDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                rulerDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                rulerDiv.style.top = y + 'px';
                cell.innerHTML = that._dragCellHTML;
            }
        };

        rulerDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        rulerDiv.ondragstart = function(e) {
            if (cell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The ruler table
        var rulerTableDiv = docById('rulerTableDiv');
        rulerTableDiv.style.display = 'inline';
        rulerTableDiv.style.visibility = 'visible';
        rulerTableDiv.style.border = '2px';
        rulerTableDiv.innerHTML = '';

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        rulerTableDiv.innerHTML = '<div id="rulerOuterDiv"><div id="rulerInnerDiv"><table id="rhythmRulerTable"></table></div></div>';

        var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 2);
        var outerDiv = docById('rulerOuterDiv');
        if (this.Rulers.length > n) {
            outerDiv.style.height = 82 * n + 'px';
            var w = Math.max(Math.min(window.innerWidth, OUTERWINDOWWIDTH), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        } else {
            outerDiv.style.height = 82 * this.Rulers.length + 'px';
            var w = Math.max(Math.min(window.innerWidth, OUTERWINDOWWIDTH - 20), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        }

        var w = Math.max(Math.min(window.innerWidth, INNERWINDOWWIDTH), BUTTONDIVWIDTH - BUTTONSIZE);
        docById('rulerInnerDiv').style.width = w + 'px';

        // Each row in the ruler table contains a play button in the
        // first column and a ruler table in the second column.
        var rhythmRulerTable = docById('rhythmRulerTable');
        for (var i = 0; i < this.Rulers.length; i++) {
            var rhythmRulerTableRow = rhythmRulerTable.insertRow();
            var drumcell = this._addButton(rhythmRulerTableRow, 'play-button.svg', iconSize, _('play'), '<br>');
            drumcell.setAttribute('id', i);
            drumcell.className = 'headcol';  // Position fixed when scrolling horizontally

            drumcell.onclick=function() {
                var id = Number(this.getAttribute('id'));
                if (that._playing) {
                    if (that._rulerPlaying === id) {
                        this.innerHTML = '<br>&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                        that._playing = false;
                        that._playingOne = false;
                        that._playingAll = false;
                        that._rulerPlaying = -1;
                        that._startingTime = null;
                        that._elapsedTimes[id] = 0;
                        that._offsets[id] = 0;
                        setTimeout(that._calculateZebraStripes(id), 1000);
                    }
                }
                else {
                    if (that._playingOne === false) {
                        that._rulerSelected = id;
                        that._logo.setTurtleDelay(0);
                        that._playing = true;
                        that._playingOne = true;
                        that._playingAll = false;
                        that._cellCounter = 0;
                        that._startingTime = null;
                        that._rulerPlaying = id;
                        this.innerHTML = '<br>&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                        that._elapsedTimes[id] = 0;
                        that._offsets[id] = 0;
                        that._playOne();
                    }
                }
            };

            var rulerCell = rhythmRulerTableRow.insertCell();
            // Create individual rulers as tables.
            rulerCell.innerHTML = '<table id="rulerCellTable' + i + '"></table>';

            var rulerCellTable = docById('rulerCellTable' + i);
            rulerCellTable.style.textAlign = 'center';
            rulerCellTable.style.border = '0px';
            rulerCellTable.style.borderCollapse = 'collapse';
            rulerCellTable.cellSpacing = '0px';
            rulerCellTable.cellPadding = '0px';
            var rulerRow = rulerCellTable.insertRow();
            rulerRow.setAttribute('id', 'ruler' + i);
            for (var j = 0; j < this.Rulers[i][0].length; j++) {
                var noteValue = this.Rulers[i][0][j];
                var rulerSubCell = rulerRow.insertCell(-1);
                rulerSubCell.innerHTML = calcNoteValueToDisplay(noteValue, 1);
                rulerSubCell.style.width = this._noteWidth(noteValue) + 'px';
                rulerSubCell.minWidth = rulerSubCell.style.width;
                rulerSubCell.maxWidth = rulerSubCell.style.width;
                rulerSubCell.style.border = '0px';
                rulerSubCell.border = '0px';
                rulerSubCell.padding = '0px';
                rulerSubCell.style.padding = '0px';
                rulerSubCell.style.lineHeight = 60 + ' % ';
                if (i % 2 === 0) {
                    if (j % 2 === 0) {
                        rulerSubCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    } else {
                        rulerSubCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    }
                } else {
                    if (j % 2 === 0) {
                        rulerSubCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    } else {
                        rulerSubCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    }
                }

                rulerSubCell.addEventListener('click', function(event) {
                    that._dissectRuler(event);
                });
            }

            // Match the play button height to the ruler height.
            rhythmRulerTableRow.cells[0].style.width = BUTTONSIZE + 'px';
            rhythmRulerTableRow.cells[0].style.minWidth = BUTTONSIZE + 'px';
            rhythmRulerTableRow.cells[0].style.maxWidth = BUTTONSIZE + 'px';
            rhythmRulerTableRow.cells[0].style.height = rulerRow.offsetHeight + 'px';
            rhythmRulerTableRow.cells[0].style.minHeight = rulerRow.offsetHeight + 'px';
            rhythmRulerTableRow.cells[0].style.maxHeight = rulerRow.offsetHeight + 'px';
            rhythmRulerTableRow.cells[0].style.verticalAlign = 'middle';
        }

        // Restore dissect history.
        for (var drum = 0; drum < this.Drums.length; drum++) {
            for (var i = 0; i < this._dissectHistory.length; i++) {
                if (this._dissectHistory[i][1] !== this.Drums[drum]) {
                    continue;
                }

                var rhythmRulerTableRow = docById('ruler' + drum);
                for (var j = 0; j < this._dissectHistory[i][0].length; j++) {
                    if (this._dissectHistory[i][0][j] == undefined) {
                        continue;
                    }

                    this._rulerSelected = drum;

                    var cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j][0]];
                    if (cell != undefined) {
                        this.__dissect(cell, this._dissectHistory[i][0][j][1], false);
                    } else {
                        console.log('Could not find cell to divide. Did the order of the rhythm blocks change?');
                    }
                }
            }
        }
    };

    this._addButton = function(row, icon, iconSize, label, extras) {
        var cell = row.insertCell(-1);
        cell.innerHTML = extras + '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
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
