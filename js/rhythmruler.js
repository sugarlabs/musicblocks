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

// This widget enable us to create a certain rhythm which plays with the drum we decide.


function RhythmRuler () {

    this.Rulers = [];
    this.Drums = [];
    this.RulerSelected = 0;
    this.Completed = 0;
    this.Playing = 0;
    this.PlayingOne = 0;
    this.PlayingAll = 0;
    this.RulernoPlaying = -1;


    this.noteWidth = function (noteValue) {
        return Math.floor(EIGHTHNOTEWIDTH * (8 / noteValue) * this.cellScale * 3) + 'px';
    };  

    this.calculateZebraStripes = function(rulerno) {
        var ruler = docById('ruler' + rulerno);
        if(this.RulerSelected%2 === 0) {
            var evenColor = MATRIXNOTECELLCOLOR;
        } else {
            var evenColor = MATRIXNOTECELLCOLORHOVER;
        }
        for(var i = 0; i < ruler.cells.length; i++) {
            var newCell = ruler.cells[i];
            if(evenColor === MATRIXNOTECELLCOLOR) {
                if((i)%2 === 0) {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                } else {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                }
            } 
            if(evenColor === MATRIXNOTECELLCOLORHOVER) {
                if((i)%2 === 0) {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                } else {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                }
            }              
        }
    };

    this.dissectRuler = function (event) {

        var that = this;
        var inputNum = prompt("Divide By:", 2);
        
        if(!isInt(inputNum)) {
            alert("Please Input a Integer");
            inputNum = prompt("Divide By:", 2);
        }
        if(inputNum === null) {
            return ;
        }
        var cell = event.target;
        this.RulerSelected = cell.parentNode.id[5];
        var ruler = docById('ruler' + this.RulerSelected);
        var newCellIndex = cell.cellIndex;
        var noteValues = this.Rulers[this.RulerSelected][0];
        var divisionHistory = this.Rulers[this.RulerSelected][1];
    
        divisionHistory.push([newCellIndex,inputNum]);
        ruler.deleteCell(newCellIndex);
    
        var noteValue = noteValues[newCellIndex];
        var newNoteValue = inputNum * noteValue;
        var newCellWidth = parseFloat(this.noteWidth(newNoteValue)) + parseFloat(difference)/inputNum + 'px';
        var newCellHeight = cell.style.height;
        noteValues.splice(newCellIndex, 1);

        for ( var i = 0; i < inputNum; i++) {
            var newCell = ruler.insertCell(newCellIndex+i);
            noteValues.splice(newCellIndex+i, 0, newNoteValue);
            newCell.innerHTML = calcNoteValueToDisplay(newNoteValue, 1);
            newCell.style.width = newCellWidth;
            newCell.style.lineHeight = 60 + '%';
            newCell.style.height = newCellHeight;
            newCell.style.minWidth = newCell.style.width;
            newCell.style.maxWidth = newCell.style.width;   
            newCell.addEventListener("click", function(event) {
              that.dissectRuler(event);
            });
        }
        this.calculateZebraStripes(that.RulerSelected);        
    };

    this.undo = function() {

        var that = this;
        var divisionHistory = this.Rulers[this.RulerSelected][1];
        if(divisionHistory.length === 0) {
            return ;
        }
        var ruler = docById('ruler' + this.RulerSelected);
        var noteValues = this.Rulers[this.RulerSelected][0];
        var inputNum = divisionHistory[divisionHistory.length-1][1];
        var newCellIndex = divisionHistory[divisionHistory.length-1][0];
        var cellWidth = ruler.cells[newCellIndex].style.width;
        var newCellHeight = ruler.cells[newCellIndex].style.height;
        var newCellWidth = parseFloat(cellWidth)*inputNum;
        var oldCellNoteValue = noteValues[newCellIndex];
        var newNoteValue = oldCellNoteValue/inputNum;
                
        var newCell = ruler.insertCell(newCellIndex);
        newCell.style.width = this.noteWidth(newNoteValue);
        newCell.style.height = newCellHeight;
        newCell.style.lineHeight = 60 + '%';
        newCell.style.minWidth = newCell.style.width;
        newCell.style.maxWidth = newCell.style.width;
        newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
        newCell.innerHTML = calcNoteValueToDisplay(oldCellNoteValue/inputNum, 1);
       
        noteValues[newCellIndex] = oldCellNoteValue/inputNum; 
        noteValues.splice(newCellIndex+1,inputNum-1);

        newCell.addEventListener("click", function(event) {
              that.dissectRuler(event);
        });
        for ( var i = 0; i < inputNum; i++) {
                ruler.deleteCell(newCellIndex+1);
        }
        divisionHistory.pop();
        this.calculateZebraStripes(this.RulerSelected);
    };

    this.playAll = function() {
        this.logo.synth.stop();

        for(var i = 0; i < this.Rulers.length; i++) {
            var noteValues = this.Rulers[i][0];
            var noteValue = noteValues[0];
            var drumblockno = blocks.blockList[this.Drums[i]].connections[1];
            var drum = blocks.blockList[drumblockno].value;
            var ruler = docById('ruler' + i);
            var cell = ruler.cells[0];
            cell.style.backgroundColor = MATRIXBUTTONCOLOR;
            this.logo.synth.trigger('C2', this.logo.defaultBPMFactor / noteValue, drum);
            if(this.PlayingAll) {
                this.playNote(0, 0, i, 1);
            }
        }   
    };

    this.playOne = function() {
        this.logo.synth.stop();
        var noteValues = this.Rulers[this.RulerSelected][0];
        var noteValue = noteValues[0];
        var ruler = docById('ruler' + this.RulerSelected);
        var cell = ruler.cells[0];
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        var drumblockno = blocks.blockList[this.Drums[this.RulerSelected]].connections[1];
        var drum = blocks.blockList[drumblockno].value;
        this.logo.synth.trigger('C2', this.logo.defaultBPMFactor / noteValue, drum);
        if(this.PlayingOne) {
            this.playNote(0, 0, this.RulerSelected, 1)
        }
    };
    
    this.playNote = function(time, notesCounter, rulerno, colIndex) {
        var that = this;
        var noteValues = that.Rulers[rulerno][0];
        var noteValue = noteValues[notesCounter];
        time = 1/noteValue;
        var drumblockno = blocks.blockList[this.Drums[rulerno]].connections[1];
        var drum = blocks.blockList[drumblockno].value;
        setTimeout(function() {

            var ruler = docById('ruler' + rulerno);

            if (notesCounter === noteValues.length-1) {
                for (var i = 0; i < ruler.cells.length; i++) {
                    var cell = ruler.cells[i];
                    cell.style.backgroundColor =  MATRIXNOTECELLCOLOR;
                }
            } else {
                var cell = ruler.cells[colIndex];
                if(that.Playing) {
                    cell.style.backgroundColor = MATRIXBUTTONCOLOR;
                }
            }

            if (notesCounter >= noteValues.length) {
                notesCounter = 1;
                that.logo.synth.stop()
            }                
            notesCounter += 1;
            colIndex += 1;
            if(that.Playing) {
                that.logo.synth.trigger(['C2'], that.logo.defaultBPMFactor / noteValue, drum);
            }
            if(notesCounter < noteValues.length) {
                if(that.Playing) {
                    that.playNote(time, notesCounter, rulerno, colIndex);
                }
            } else {
                that.Completed += 1;
            }
            if(that.PlayingAll) {
                if(that.Completed === that.Rulers.length) {
                    console.log("playing again all rulers");
                    that.Completed = 0;
                    var cell = ruler.cells[0];
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    that.logo.setTurtleDelay(0);
                    for(var i = 0; i < that.Rulers.length; i++) {
                        that.calculateZebraStripes(i);
                    }
                    that.playAll();
                }    
            }
            if(that.PlayingOne) {
                if(that.Completed === 1) {
                    console.log("playing again ruler" + that.RulernoPlaying);
                    that.Completed = 0;
                    var cell = ruler.cells[0];
                    cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    that.logo.setTurtleDelay(0);
                    that.calculateZebraStripes(that.RulernoPlaying);
                    that.playOne();
                }
            }            
        }, that.logo.defaultBPMFactor * 1000 * time + that.logo.turtleDelay);   
    };
   
    this.save = function(selectedruler) {

        var that = this;
        for (var name in this.logo.blocks.palettes.dict) {
            this.logo.blocks.palettes.dict[name].hideMenu(true);
        }
        this.logo.refreshCanvas();
        setTimeout(function() {
            var ruler = docById('ruler' + selectedruler);
            var noteValues = that.Rulers[selectedruler][0];
    
            var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, 2, null]], [1, ['text', {'value': 'rhythm'}], 0, 0, [0]]];
            var endOfStackIdx = 0;
            var previousBlock = 0;
            var samenotevalue = 1;
            for (var i = 0; i < ruler.cells.length; i++) {

                if(noteValues[i] === noteValues[i+1] && i < ruler.cells.length-1) {
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

                    if(i == ruler.cells.length-1) {
                        newStack.push([hiddenidx, 'hidden', 0, 0, [rhythmblockidx, null]]);
                    }
                    else {
                        newStack.push([hiddenidx, 'hidden', 0, 0, [rhythmblockidx, hiddenidx + 1]]);
                    }

                    var previousBlock = hiddenidx;
                    samenotevalue = 1;
                }
            }

            that.logo.blocks.loadNewBlocks(newStack);
            if(selectedruler > that.Rulers.length-2) {
                return ;
            } else {
                that.save(selectedruler+1);
            }
        }, 500);
    };

	this.init = function(logo) {
		console.log("init RhythmRuler");
		this.logo = logo;

        
        docById('rulerbody').style.display = 'inline';
        console.log('setting RhythmRuler visible');
        docById('rulerbody').style.visibility = 'visible';
        docById('rulerbody').style.border = 2;

        docById('drumDiv').style.display = 'inline';
        docById('drumDiv').style.visibility = 'visible';
        docById('drumDiv').style.border = 2;


        var w = window.innerWidth;
        this.cellScale = w / 1200;
        docById('rulerbody').style.width = Math.floor(w / 2) + 'px';
        docById('rulerbody').style.overflowX = 'auto';

        docById('drumDiv').style.width = Math.floor(w/24) + 'px';
        docById('drumDiv').style.overflowX = 'auto';

        var thisRuler = this;
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
            if (rulertable !== null) {
                rulertable.remove();
            }
            if (rulerdrum !== null) {
                rulerdrum.remove();
            }
        }

        var iconSize = Math.floor(this.cellScale * 24);


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
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(drumDivPosition.left) + 'px';
        row.style.top = Math.floor(drumDivPosition.top) + 'px';

        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            if(thisRuler.Playing === 0) {
                if(thisRuler.PlayingAll === 0) {
                    console.log("playing all rulers");
                    this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                    thisRuler.logo.setTurtleDelay(0);
                    thisRuler.Completed =0;
                    thisRuler.PlayingAll = 1;
                    thisRuler.Playing = 1;
                    thisRuler.PlayingOne = 0;
                    thisRuler.RulernoPlaying = -1;
                    thisRuler.playAll();
                }
            }
            else {
                if(thisRuler.PlayingAll) {
                    console.log("stopping playing all rulers");
                    this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';                
                    thisRuler.Playing = 0;
                    thisRuler.PlayingAll = 0;
                    thisRuler.PlayingOne = 0;
                    thisRuler.Completed = 0;
                    thisRuler.RulernoPlaying = -1;
                    for (var i = 0; i < thisRuler.Rulers.length; i++) {
                        thisRuler.calculateZebraStripes(i);
                    }
                }
            }
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

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
        row.style.left = Math.floor(rulerbodyDivPosition.left) + 'px';
        row.style.top = Math.floor(rulerbodyDivPosition.top) + 'px';

        
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/export-chunk.svg" title="' + _('save') + '" alt="' + _('save') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
                thisRuler.save(0);                      
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/restore-trash-button.svg" title="' + _('undo') + '" alt="' + _('undo') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onclick=function() {
            thisRuler.undo();
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(2);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onclick=function() {
            docById('rulerbody').style.visibility = 'hidden';
            docById('drumDiv').style.visibility = 'hidden';
            docById('rulerbody').style.border = 0;
            docById('drumDiv').style.border = 0;
            thisRuler.Playing = 0;
            thisRuler.PlayingOne = 0;
            thisRuler.PlayingAll = 0;
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

       
        
        
        for (var i = 0;i < this.Rulers.length; i++) {

            var rulerdrumTable = document.createElement('TABLE');
            rulerdrumTable.setAttribute('id', 'rulerdrum' + i);
            rulerdrumTable.style.textAlign = 'center';
            rulerdrumTable.style.borderCollapse = 'collapse';
            rulerdrumTable.cellSpacing = 0;
            rulerdrumTable.cellPadding = 0;
            drumDiv.appendChild(rulerdrumTable);
            var header = rulerdrumTable.createTHead();
            var row = header.insertRow(-1);
            row.style.left = Math.floor(drumDivPosition.left) + 'px';
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
            row.setAttribute('id', 'drum' + i);

            var drumcell = row.insertCell(-1);
            drumcell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            drumcell.style.width = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
            drumcell.style.minWidth = cell.style.width;
            drumcell.style.maxWidth = cell.style.width;
            drumcell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
            drumcell.style.backgroundColor = MATRIXBUTTONCOLOR;

            drumcell.onclick=function() {

                if(thisRuler.Playing === 0) {
                    if(thisRuler.PlayingOne ===0) {
                        console.log("playing ruler" + this.parentNode.id[4]);
                        thisRuler.RulerSelected = this.parentNode.id[4];
                        thisRuler.logo.setTurtleDelay(0);
                        thisRuler.Playing = 1;
                        thisRuler.PlayingOne = 1;
                        thisRuler.PlayingAll = 0;
                        thisRuler.Completed = 0;
                        thisRuler.RulernoPlaying = this.parentNode.id[4];
                        this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                        thisRuler.playOne();
                    }
                }
                else {
                    if(this.parentNode.id[4] === thisRuler.RulernoPlaying) {
                        console.log("stopping ruler" + this.parentNode.id[4]);
                        this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                        thisRuler.Playing = 0;
                        thisRuler.PlayingOne = 0;
                        thisRuler.PlayingAll = 0;
                        thisRuler.Completed = 0;
                        thisRuler.RulernoPlaying = -1;
                        setTimeout(thisRuler.calculateZebraStripes(this.parentNode.id[4]),1000);
                    }
                }
            }
            drumcell.onmouseover=function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            }
            drumcell.onmouseout=function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            }
            

            var RulerTable = document.createElement('TABLE');
            RulerTable.setAttribute('id', 'rulerTable' + i);
            RulerTable.style.textAlign = 'center';
            RulerTable.style.borderCollapse = 'collapse';
            RulerTable.cellSpacing = 0;
            RulerTable.cellPadding = 0;
            rulerbodyDiv.appendChild(RulerTable);
            var header = RulerTable.createTHead();
            var row = header.insertRow(-1);
            row.style.left = Math.floor(rulerbodyDivPosition.left) + 'px';
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
            row.setAttribute('id', 'ruler' + i);
            for (var j = 0; j < thisRuler.Rulers[i][0].length; j++) {
                var noteValue = thisRuler.Rulers[i][0][j];
                var rulercell = row.insertCell(j);
                rulercell.innerHTML = calcNoteValueToDisplay(noteValue, 1);
                rulercell.style.width = thisRuler.noteWidth(noteValue);
                rulercell.minWidth = rulercell.style.width;
                rulercell.maxWidth = rulercell.style.width;
                rulercell.style.lineHeight = 60 + '%';
                rulercell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
                if(i%2 === 0) {
                    if(j%2 === 0) {
                        rulercell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    } else {
                        rulercell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    }
                } else {
                    if(j%2 === 0) {
                        rulercell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    } else {
                        rulercell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    }
                }
                rulercell.addEventListener("click", function(event) {
                  thisRuler.dissectRuler(event);
                });
            }
        }

	}
};