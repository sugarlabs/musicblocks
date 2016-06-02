const RHYTHMRULERHEIGHT = 100;

function RhythmRuler () {



  function dissectRuler (event) {
        var inputNum = prompt("Divide By:" , 2  );
        var cell = event.target;
        var newCellIndex = cell.cellIndex;
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
            newCell.style.backgroundColor = MATRIXLABELCOLOR;
            
            newCell.addEventListener("click", function(event) {
              dissectRuler(event);
            });
            
            newCell.onmouseover=function() {
              this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            }    
            
            newCell.onmouseout=function() {
              this.style.backgroundColor = MATRIXLABELCOLOR;
            }  
        }
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

        var table = docById('myTable');

        if (table !== null) {
        	table.remove();
        }

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'myTable');
      //  x.setAttribute('table-layout', 'fixed');
        x.style.textAlign = 'center';

        var rulerbodyDiv = docById('rulerbody');
        rulerbodyDiv.style.paddingTop = 0 + 'px';
        rulerbodyDiv.style.paddingLeft = 0 + 'px';
        rulerbodyDiv.appendChild(x);
        rulerbodyDivPosition = rulerbodyDiv.getBoundingClientRect();

        var table = docById('myTable');
      //  table.style.display = 'block';
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(rulerbodyDivPosition.left) + 'px';
        row.style.top = Math.floor(rulerbodyDivPosition.top) + 'px';

        var iconSize = Math.floor(this.cellScale * 24);

        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/export-chunk.svg" title="' + _('save') + '" alt="' + _('save') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
       // cell.style.display = 'inline-block';
        cell.onclick=function() {
            
        }
        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }
        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        var cell = row.insertCell(1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
     //   cell.style.display = 'inline-block';
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

        var row = header.insertRow(1);
        row.style.left = Math.floor(rulerbodyDivPosition.left) + 'px';
        row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        row.setAttribute('id', 'ruler');

        var cell = row.insertCell(-1);
        cell.style.width = Math.floor(rulerbodyDivPosition.width) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';          
        cell.style.backgroundColor = MATRIXLABELCOLOR;

        

        cell.addEventListener("click", function(event) {
          dissectRuler(event);
        });

        cell.onmouseover=function() {
          this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }    
        cell.onmouseout=function() {
          this.style.backgroundColor = MATRIXLABELCOLOR;
        }

	}

}