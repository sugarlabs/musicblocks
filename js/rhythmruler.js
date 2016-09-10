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
    this._completed = 0;

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
            ruler.deleteCell(newCellIndex+1);
        }
        
        divisionHistory.pop();
        this._calculateZebraStripes(this._rulerSelected);
    };
    
    this._playAll = function() {
        this._logo.synth.stop();
        
        for (var i = 0; i < this.Rulers.length; i++) {
            var noteValues = this.Rulers[i][0];
            var noteValue = noteValues[0];
            var drumblockno = blocks.blockList[this.Drums[i]].connections[1];
            var drum = blocks.blockList[drumblockno].value;
            var ruler = docById('ruler' + i);
            var cell = ruler.cells[0];
            cell.style.backgroundColor = MATRIXBUTTONCOLOR;
	    this._logo.synth.trigger(0, this._logo.defaultBPMFactor / noteValue, drum);
            
            if (this._playingAll) {
                this._playNote(0, 0, i, 1);
            }
        }
    };
    
    this._playOne = function() {
        this._logo.synth.stop();
        var noteValues = this.Rulers[this._rulerSelected][0];
        var noteValue = noteValues[0];
        var ruler = docById('ruler' + this._rulerSelected);
        var cell = ruler.cells[0];
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        var drumblockno = blocks.blockList[this.Drums[this._rulerSelected]].connections[1];
        var drum = blocks.blockList[drumblockno].value;
        this._logo.synth.trigger(0, this._logo.defaultBPMFactor / noteValue, drum);        
        if (this._playingOne) {
            this._playNote(0, 0, this._rulerSelected, 1)
        }
    };
    
    this._playNote = function(time, notesCounter, rulerno, colIndex) {
        var that = this;
        var noteValues = that.Rulers[rulerno][0];
        var noteValue = noteValues[notesCounter];
        time = 1 / noteValue;
        var drumblockno = blocks.blockList[this.Drums[rulerno]].connections[1];
        var drum = blocks.blockList[drumblockno].value;
        setTimeout(function() {
            var ruler = docById('ruler' + rulerno);
            
            if (notesCounter === noteValues.length - 1) {
                for (var i = 0; i < ruler.cells.length; i++) {
                    var cell = ruler.cells[i];
                    cell.style.backgroundColor =  MATRIXNOTECELLCOLOR;
                }
            } else {
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
		that._logo.synth.trigger([0], that._logo.defaultBPMFactor / noteValue, drum);
            }
            
            if (notesCounter < noteValues.length) {
                if (that._playing) {
                    that._playNote(time, notesCounter, rulerno, colIndex);
                }
            } else {
                that._completed += 1;
            }
            if (that._playingAll) {
                if (that._completed === that.Rulers.length) {
                    console.log('playing again all rulers');
                    that._completed = 0;
                    var cell = ruler.cells[0];
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    that._logo.setTurtleDelay(0);
                    
                    for (var i = 0; i < that.Rulers.length; i++) {
                        that._calculateZebraStripes(i);
                    }
                    
                    that._playAll();
                }
            }
            if (that._playingOne) {
                if (that._completed === 1) {
                    console.log('playing again ruler' + that._rulerPlaying);
                    that._completed = 0;
                    var cell = ruler.cells[0];
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    that._logo.setTurtleDelay(0);
                    that._calculateZebraStripes(that._rulerPlaying);
                    that._playOne();
                }
            }
        }, that._logo.defaultBPMFactor * 1000 * time + that._logo.turtleDelay);
    };
    
    this._save = function(selectedruler) {
        var that = this;
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }
        
        this._logo.refreshCanvas();
        
        setTimeout(function() {
            var ruler = docById('ruler' + selectedruler);
            var noteValues = that.Rulers[selectedruler][0];
            
            var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, 2, null]], [1, ['text', {'value': 'rhythm'}], 0, 0, [0]]];
            var endOfStackIdx = 0;
            var previousBlock = 0;
            var samenotevalue = 1;
            for (var i = 0; i < ruler.cells.length; i++) {
                
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    samenotevalue += 1;
                    continue;
                } else {
                    var rhythmblockidx = newStack.length;
                    var noofnotes = rhythmblockidx + 1;
                    var notevalueidx = rhythmblockidx + 2;
                    var hiddenidx = rhythmblockidx + 3;
                    var noteValue = noteValues[i];
                    
                    newStack.push([rhythmblockidx, 'rhythm', 0, 0, [previousBlock, noofnotes, notevalueidx, hiddenidx]]);
                    newStack.push([noofnotes, ['number', {'value': samenotevalue}], 0, 0, [rhythmblockidx]]);
                    newStack.push([notevalueidx, ['number', {'value': noteValue}], 0, 0, [rhythmblockidx]]);
                    
                    if (i == ruler.cells.length - 1) {
                        newStack.push([hiddenidx, 'hidden', 0, 0, [rhythmblockidx, null]]);
                    }
                    else {
                        newStack.push([hiddenidx, 'hidden', 0, 0, [rhythmblockidx, hiddenidx + 1]]);
                    }
                    
                    var previousBlock = hiddenidx;
                    samenotevalue = 1;
                }
            }
            
            that._logo.blocks.loadNewBlocks(newStack);
            if (selectedruler > that.Rulers.length - 2) {
                return;
            } else {
                that._save(selectedruler+1);
            }
        }, 500);
    };

    this.init = function(logo) {
        console.log('init RhythmRuler');
        this._logo = logo;
        
        docById('rulerbody').style.display = 'inline';
        console.log('setting RhythmRuler visible');
        docById('rulerbody').style.visibility = 'visible';
        docById('rulerbody').style.border = 2;
        
        docById('drumDiv').style.display = 'inline';
        docById('drumDiv').style.visibility = 'visible';
        docById('drumDiv').style.border = 2;
        
        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = Math.floor(this._cellScale * 24);
        
        docById('rulerbody').style.width = Math.floor(w / 2) + 'px';
        docById('rulerbody').style.overflowX = 'auto';
        
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
        
        for (var i = 0; i < this.Rulers.length; i++) {
            var rulertable = docById('rulerTable' + i);
            var rulerdrum = docById('rulerdrum' + i);
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
                    console.log('stopping all rulers');
                    this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play all') + '" alt="' + _('play all') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                    that._playing = false;
                    that._playingAll = false;
                    that._playingOne = false;
                    that._completed = 0;
                    that._rulerPlaying = -1;
                    for (var i = 0; i < that.Rulers.length; i++) {
                        that._calculateZebraStripes(i);
                    }
                }
            }
            else {
                if (!that._playingAll) {
                    console.log("playing all rulers");
                    this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                    that._logo.setTurtleDelay(0);
                    that._playingAll = true;
                    that._playing = true;
                    that._playingOne = false;
                    that._completed = 0;
                    that._rulerPlaying = -1;
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
        
        var rulerbodyDiv = docById('rulerbody');
        rulerbodyDiv.style.paddingTop = 0 + 'px';
        rulerbodyDiv.style.paddingLeft = 0 + 'px';
        rulerbodyDiv.appendChild(x);
        rulerbodyDivPosition = rulerbodyDiv.getBoundingClientRect();
        
        var table = docById('buttonTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        
        var cell = this._addButton(row, -1, 'export-chunk.svg', iconSize, _('save'));
        cell.onclick=function() {
            that._save(0);
        };
        
        var cell = this._addButton(row, 1, 'restore-button.svg', iconSize, _('undo'));
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
        
        var cell = this._addButton(row, 3, 'close-button.svg', iconSize, _('close'));
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

            docById('rulerbody').style.visibility = 'hidden';
            docById('drumDiv').style.visibility = 'hidden';
            docById('rulerbody').style.border = 0;
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
                        console.log("stopping ruler" + this.parentNode.id[4]);
                        this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                        that._playing = false;
                        that._playingOne = false;
                        that._playingAll = false;
                        that._completed = 0;
                        that._rulerPlaying = -1;
                        setTimeout(that._calculateZebraStripes(this.parentNode.id[4]),1000);
                    }
                }
                else {
                    if (that._playingOne === false) {
                        console.log("playing ruler" + this.parentNode.id[4]);
                        that._rulerSelected = this.parentNode.id[4];
                        that._logo.setTurtleDelay(0);
                        that._playing = true;
                        that._playingOne = true;
                        that._playingAll = false;
                        that._completed = 0;
                        that._rulerPlaying = this.parentNode.id[4];
                        this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
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
            rulerbodyDiv.appendChild(rulerTable);

            var row = rulerTable.insertRow(-1);
            row.style.left = Math.floor(rulerbodyDivPosition.left) + 'px';
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
