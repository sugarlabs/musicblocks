function TimbreWidget () {
	const BUTTONDIVWIDTH = 476;  // 8 buttons 476 = (55 + 4) * 8
    const OUTERWINDOWWIDTH = 685;
    const INNERWINDOWWIDTH = 600;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    var timbreTableDiv = docById('timbreTableDiv');
    console.log('timbre initialised');
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

    this.init = function(logo) {
    	this._logo = logo;

    	var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;
        var timbreDiv = docById("timbreDiv");
        timbreDiv.style.visibility = "visible";
        timbreDiv.setAttribute('draggable', 'true');
        timbreDiv.style.left = '200px';
        timbreDiv.style.top = '150px';
        
        var widgetButtonsDiv = docById('timbreButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table cellpadding="0px" id="timbreButtonTable"></table>';

        var canvas = docById('myCanvas');

        var buttonTable = docById('timbreButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        var that = this;

        var cell = this._addButton(row, 'play-button.svg', ICONSIZE, _('play all'));
        var cell = this._addButton(row, 'export-chunk.svg', ICONSIZE, _('save'));
        var cell = this._addButton(row, 'synth.svg', ICONSIZE, _('synthesizer'));
        var cell = this._addButton(row, 'oscillator.svg', ICONSIZE, _('oscillator'));
        cell.onclick=function(){
        	that._oscillator();
        }
        var cell1 = this._addButton(row, 'envelope.svg', ICONSIZE, _('envelope'));
        cell1.onclick=function(){
        	
        	cell1.setAttribute("id","cell1");
        	that._envelope();
        }
        var cell = this._addButton(row, 'filter.svg', ICONSIZE, _('filter'));
        var cell = this._addButton(row, 'effects.svg', ICONSIZE, _('effects'));
        cell.onclick=function(){
        	that._effects();
        }
        var cell = this._addButton(row, 'restore-button.svg', ICONSIZE, _('undo'));
        /*cell.onclick=function() {
            that._undo();
        }*/

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));
        cell.onclick=function() {
            docById('timbreDiv').style.visibility = 'hidden';
            docById('timbreButtonsDiv').style.visibility = 'hidden';
            docById('timbreTableDiv').style.visibility = 'hidden';
        };

        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - timbreDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - timbreDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
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
                var x = e.clientX - that._dx;
                timbreDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
               	timbreDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        timbreDiv.ondragover = function(e) {
            e.preventDefault();
        };

        timbreDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                timbreDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                timbreDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        timbreDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        timbreDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

    };

    this._envelope = function() {
    	var slider = [];
    	var val = [];
    	timbreTableDiv.style.display = 'inline';
        timbreTableDiv.style.visibility = 'visible';
        timbreTableDiv.style.border = '0px';
        timbreTableDiv.style.overflow = 'auto';
        timbreTableDiv.style.backgroundColor = 'white';
        timbreTableDiv.style.height = '300px';
        timbreTableDiv.innerHTML = '<div id="timbreTable"></div>';

        var env = docById('timbreTable');
      	var htmlElements = "";
		for (var i = 0; i < 4; i++) {
   			htmlElements += '<div id="wrapper"><div class="circle">'+("ADSR").charAt(i)+'</div><div id="insideDiv"><input type="range" id="myRange'+i+'"style="margin-top:20px" value="50"> <span id="myspan'+i+'"class="rangeslidervalue">50</span></div></div>';
			slider.push("myRange"+i);
			val.push("myspan"+i);
		};

		env.innerHTML = htmlElements;
		var envAppend = document.createElement("div");
		envAppend.id = "envAppend";
		envAppend.style.backgroundColor = MATRIXBUTTONCOLOR;
		envAppend.style.height = "30px";
		envAppend.style.marginTop = "40px";
		envAppend.style.overflow = "auto";
    	env.append(envAppend);

    	callOnchange = function(i) {
    		docById(slider[i]).onchange = function(){
    			docById(val[i]).textContent = docById(slider[i]).value;
			}
		};

		for(i=0;i<slider.length;i++){
			callOnchange(i);
		};
    	
    	docById("envAppend").innerHTML = '<button id="green"><b>DONE</b></button>';

        var btn = docById("green");
        btn.style.backgroundColor = MATRIXLABELCOLOR;
        btn.style.marginLeft = '240px';
        btn.style.marginTop = '6px';
        btn.style.height ='24px';
        btn.style.width = '60px';
        btn.style.borderColor = MATRIXLABELCOLOR;
        btn.onclick = function() {
        	docById("cell1").style.backgroundColor = "#C8C8C8";
        	docById("cell1").onmouseout = function() {};
        	docById("cell1").onmouseover = function() {};

        }
        
	};

    this._effects = function(){
    	//document.getElementById("timbreTable").style.backgroundColor = 'blue' ;

    };

    this._oscillator = function(){
    	//document.getElementById("timbreTable").style.backgroundColor = 'yellow' ;
    };
};