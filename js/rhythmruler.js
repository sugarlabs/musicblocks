const RHYTHMRULERHEIGHT = 100;

function RhythmRuler () {

    this.Rulers = [];
    this.Drums = [];
    this.RulerSelected = 0;
    this.notesCounter = 0;

    function isInt(value) {
         return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
    }

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
        var newCellIndex = cell.cellIndex;
        var noteValues = this.Rulers[this.RulerSelected][0];
        var divisionHistory = this.Rulers[this.RulerSelected][1];
       // this.divisionHistory.push([newCellIndex,inputNum]);
        divisionHistory.push([newCellIndex,inputNum]);
        var newCellWidth = Math.floor(parseFloat(cell.style.width)/inputNum) + 'px';
       // var rulertable = document.getElementById('rulerTable');
        var ruler = docById('ruler' + this.RulerSelected);
        ruler.deleteCell(newCellIndex);
      //  var noteValue = this.noteValues[newCellIndex];
        var noteValue = noteValues[newCellIndex];
        var newNoteValue = inputNum * noteValue;
       // this.noteValues.splice(newCellIndex, 1);
        noteValues.splice(newCellIndex, 1);
        var newCellHeight = cell.style.height;
        for ( var i = 0; i < inputNum; i++) {
            var newCell = ruler.insertCell(newCellIndex+i);
            noteValues.splice(newCellIndex+i, 0, newNoteValue);
            newCell.style.width = newCellWidth;
            newCell.style.height = newCellHeight;
            newCell.style.minWidth = newCell.style.width;
            newCell.style.maxWidth = newCell.style.width;
            newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;            
            
            newCell.addEventListener("click", function(event) {
              that.dissectRuler(event);
            });
            
            newCell.onmouseover=function() {
              this.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
            }    
            
            newCell.onmouseout=function() {
              this.style.backgroundColor = MATRIXNOTECELLCOLOR;
            }  
        }
    }

    this.undo = function() {

        var that = this;
        var divisionHistory = this.Rulers[this.RulerSelected][1];
        if(divisionHistory.length === 0) {
            return ;
        }
        var ruler = docById('ruler' + this.RulerSelected);
        //var inputNum = this.divisionHistory[this.divisionHistory.length-1][1];
        var noteValues = this.Rulers[this.RulerSelected][0];
        var inputNum = divisionHistory[divisionHistory.length-1][1];
       // var newCellIndex = this.divisionHistory[this.divisionHistory.length-1][0];
        var newCellIndex = divisionHistory[divisionHistory.length-1][0];
        var cellWidth = ruler.cells[newCellIndex].style.width;
        var newCellHeight = ruler.cells[newCellIndex].style.height;
        var newCellWidth = Math.floor(parseFloat(cellWidth)*inputNum) + 'px';
        var oldCellNoteValue = noteValues[newCellIndex];
                
        var newCell = ruler.insertCell(newCellIndex);
        newCell.style.width = newCellWidth;
        newCell.style.height = newCellHeight;
        newCell.style.minWidth = newCell.style.width;
        newCell.style.maxWidth = newCell.style.width;
        newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
       
        noteValues[newCellIndex] = oldCellNoteValue/inputNum; 
        noteValues.splice(newCellIndex+1,inputNum-1);

        newCell.addEventListener("click", function(event) {
              that.dissectRuler(event);
        });
            
        newCell.onmouseover=function() {
          this.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
        }    
            
        newCell.onmouseout=function() {
          this.style.backgroundColor = MATRIXNOTECELLCOLOR;
        }  

        for ( var i = 0; i < inputNum; i++) {
                ruler.deleteCell(newCellIndex+1);
        }
        divisionHistory.pop();
    }

    this.playAll = function() {
        this.logo.synth.stop();
        this.notesCounter = 0;
        var noteValues = this.Rulers[this.RulerSelected][0];
        var noteValue = noteValues[this.notesCounter];
        var ruler = docById('ruler' + this.RulerSelected);
        this.logo.synth.trigger('C2', this.logo.defaultBPMFactor / noteValue, 'kick');
        this.playNote(0, 0);       
    }
    
    this.playNote = function(time, notesCounter) {
        var that = this;
        var noteValues = this.Rulers[this.RulerSelected][0];
        noteValue = noteValues[that.notesCounter];
        time = 1/noteValue;
        setTimeout(function() {
            var ruler = docById('ruler' + this.RulerSelected);

            if (that.notesCounter >= noteValues.length) {
                    that.notesCounter = 1;
                    that.logo.synth.stop()
            }
            noteValue = noteValues[that.notesCounter];
            that.notesCounter += 1;

            that.logo.synth.trigger(['C2'], that.logo.defaultBPMFactor / noteValue, 'kick');

            if(that.notesCounter < noteValues.length) {
                that.playNote(time, that.notesCounter);
            }

        }, that.logo.defaultBPMFactor * 1000 * time + that.logo.turtleDelay);
    }
   
    this.save = function() {

        for (var name in this.logo.blocks.palettes.dict) {
            this.logo.blocks.palettes.dict[name].hideMenu(true);
        }
        this.logo.refreshCanvas();
        for (var j = 0; j < this.Rulers.length; j++) {
            var ruler = docById('ruler' + j);
            var noteValues = this.Rulers[j][0];

            
            var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, 2, null]], [1, ['text', {'value': 'ruler'}], 0, 0, [0]]];
            var endOfStackIdx = 0;
            var previousBlock = 0;


            for (var i = 0; i < ruler.cells.length; i++) {
                var rhythmblockidx = newStack.length;
                var noofnotes = rhythmblockidx + 1;
                var notevalueidx = rhythmblockidx + 2;
                var hiddenidx = rhythmblockidx + 3;
                var noteValue = noteValues[i];

                newStack.push([rhythmblockidx, 'rhythm', 0, 0, [previousBlock, noofnotes, notevalueidx, hiddenidx]]);
                newStack.push([noofnotes, ['number', {'value': 1}], 0, 0, [rhythmblockidx]]);
                newStack.push([notevalueidx, ['number', {'value': noteValue}], 0, 0, [rhythmblockidx]]);

                if(i == ruler.cells.length-1) {
                    newStack.push([hiddenidx, 'hidden', 0, 0, [rhythmblockidx, null]]);
                }
                else {
                    newStack.push([hiddenidx, 'hidden', 0, 0, [rhythmblockidx, hiddenidx + 1]]);
                }

                var previousBlock = hiddenidx;

            }
            this.logo.blocks.loadNewBlocks(newStack);
        }
    };

	this.init = function(logo) {
		console.log("init RhythmRuler");
		this.logo = logo;

        
        docById('rulerbody').style.display = 'inline';
        console.log('setting RhythmRuler visible');
        docById('rulerbody').style.visibility = 'visible';
        docById('rulerbody').style.border = 2;

        var w = window.innerWidth;
        this.cellScale = w / 1200;
        docById('rulerbody').style.width = Math.floor(w / 2) + 'px';
        docById('rulerbody').style.overflowX = 'auto';

        var thisRuler = this;
        var table = docById('buttonTable');


        if (table !== null) {
        	table.remove();
        }

        for (var i = 0; i < this.Rulers.length; i++) {
            var rulertable = docById('rulerTable' + i);
            this.Rulers[i][0] = [];
            this.Rulers[i][1] = [];
            if(rulertable !== null) {
                rulertable.remove();
            }
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'buttonTable');
        x.style.textAlign = 'center';

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

        var iconSize = Math.floor(this.cellScale * 24);

        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisRuler.logo.setTurtleDelay(0);
            thisRuler.playAll();
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/export-chunk.svg" title="' + _('save') + '" alt="' + _('save') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisRuler.save();            
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(2);
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

        var cell = row.insertCell(3);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onclick=function() {
            docById('rulerbody').style.visibility = 'hidden';
            docById('rulerbody').style.border = 0;
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

       
        
        
        for (var i = 0;i < this.Rulers.length; i++) {
            var RulerTable = document.createElement('TABLE');
            RulerTable.setAttribute('id', 'rulerTable' + i);
            RulerTable.style.textAlign = 'center';
            rulerbodyDiv.appendChild(RulerTable);
            var header = RulerTable.createTHead();
            var row = header.insertRow(-1);
            row.style.left = Math.floor(rulerbodyDivPosition.left) + 'px';
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
            row.setAttribute('id', 'ruler' + i);


            var rulercell = row.insertCell(-1);
            rulercell.style.width = Math.floor(rulerbodyDivPosition.width) + 'px';
            rulercell.minWidth = rulercell.style.width;
            rulercell.maxWidth = rulercell.style.width;
            rulercell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
            rulercell.style.backgroundColor = MATRIXNOTECELLCOLOR;

          //  this.noteValues.push(1);
            this.Rulers[i][0].push(1);
            rulercell.addEventListener("click", function(event) {
              thisRuler.dissectRuler(event);
            });
            rulercell.onmouseover=function() {
              this.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
            }    
            rulercell.onmouseout=function() {
              this.style.backgroundColor = MATRIXNOTECELLCOLOR;
            }

        }

	}

}