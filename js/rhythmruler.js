const RHYTHMRULERHEIGHT = 100;

function RhythmRuler () {

    var divisionHistory = new Array();
    function isInt(value) {
         return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
    }

    function dissectRuler (event) {
        var inputNum = prompt("Divide By:", 2);
        
        if(!isInt(inputNum)) {
            alert("Please Input a Integer");
            inputNum = prompt("Divide By:", 2);
        }
        if(inputNum === null) {
            return ;
        }

        var cell = event.target;
        var newCellIndex = cell.cellIndex;
        divisionHistory.push([newCellIndex,inputNum]);
        var newCellWidth = Math.floor(parseFloat(cell.style.width)/inputNum) + 'px';
        var ruler = document.getElementById('ruler');
        ruler.deleteCell(newCellIndex);
        var newCellHeight = cell.style.height;
        for ( var i = 0; i < inputNum; i++) {
            var newCell = ruler.insertCell(newCellIndex+i);
            newCell.style.width = newCellWidth;
            newCell.style.height = newCellHeight;
            newCell.style.minWidth = newCell.style.width;
            newCell.style.maxWidth = newCell.style.width;
            newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;            
            
            newCell.addEventListener("click", function(event) {
              dissectRuler(event);
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
        if(divisionHistory.length === 0) {
            return ;
        }
        var ruler = docById('ruler');
        var inputNum = divisionHistory[divisionHistory.length-1][1];
        var newCellIndex = divisionHistory[divisionHistory.length-1][0];
        var cellWidth = ruler.cells[newCellIndex].style.width;
        var newCellHeight = ruler.cells[newCellIndex].style.height;
        var newCellWidth = Math.floor(parseFloat(cellWidth)*inputNum) + 'px';
                
        var newCell = ruler.insertCell(newCellIndex);
        newCell.style.width = newCellWidth;
        newCell.style.height = newCellHeight;
        newCell.style.minWidth = newCell.style.width;
        newCell.style.maxWidth = newCell.style.width;
        newCell.style.backgroundColor = MATRIXNOTECELLCOLOR; 

        newCell.addEventListener("click", function(event) {
              dissectRuler(event);
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
        console.log(divisionHistory); 
    }
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

        var thisMatrix = this;
        var table = docById('buttonTable');

        var rulertable = docById('rulerTable');

        if (table !== null) {
        	table.remove();
        }

        if(rulertable !== null) {
            rulertable.remove();
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
        console.log(divisionHistory);

        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick=function() {
            thisMatrix.logo.setTurtleDelay(0);
            thisMatrix.playAll();
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
            thisMatrix.undo();
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

        var RulerTable = document.createElement('TABLE');
        RulerTable.setAttribute('id', 'rulerTable');
        RulerTable.style.textAlign = 'center';
        rulerbodyDiv.appendChild(RulerTable);

        var header = RulerTable.createTHead();
        var row = header.insertRow(-1);
        row.style.left = Math.floor(rulerbodyDivPosition.left) + 'px';
        row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        row.setAttribute('id', 'ruler');


        var rulercell = row.insertCell(-1);
        rulercell.style.width = Math.floor(rulerbodyDivPosition.width) + 'px';
        rulercell.minWidth = rulercell.style.width;
        rulercell.maxWidth = rulercell.style.width;
        rulercell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
        rulercell.style.backgroundColor = MATRIXNOTECELLCOLOR;

        rulercell.addEventListener("click", function(event) {
          dissectRuler(event);
        });
        rulercell.onmouseover=function() {
          this.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
        }    
        rulercell.onmouseout=function() {
          this.style.backgroundColor = MATRIXNOTECELLCOLOR;
        }

	}

}