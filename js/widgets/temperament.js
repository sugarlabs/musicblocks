function TemperamentWidget () {
	
	const BUTTONDIVWIDTH = 430;
    const OUTERWINDOWWIDTH = 685;
    const INNERWINDOWWIDTH = 600;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    var temperamentTableDiv = docById('temperamentTableDiv');
    this.inTemperament = null;
    this.lastTriggered = null;
    this.notes = [];
    this.frequencies = [];
    this.intervals = [];
    this.ratios = [];
    this.pitchNumber = 0;
    this.circleIsVisible = true;

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

    this._circleOfNotes = function() {
        this.circleIsVisible = false;
        this.toggleNotesButton();
        temperamentTableDiv.style.display = 'inline';
        temperamentTableDiv.style.visibility = 'visible';
        temperamentTableDiv.style.border = '0px';
        temperamentTableDiv.style.overflow = 'auto';
        temperamentTableDiv.style.backgroundColor = 'white';
        temperamentTableDiv.style.height = '300px';
        temperamentTableDiv.innerHTML = '<div id="temperamentTable"></div>';
        var temperamentTable = docById('temperamentTable');
        temperamentTable.style.position = 'relative';

        var radius = 150;
        var height = (2*radius) + 60;

        var html = '<canvas id="circ" width = ' + BUTTONDIVWIDTH + 'px height = ' + height + 'px></canvas>';
        html += '<div id="wheelDiv2" class="wheelNav"></div>';

        temperamentTable.innerHTML = html;
        temperamentTable.style.width = temperamentDiv.width;

        var canvas = docById('circ');
        canvas.style.position = 'absolute';
        canvas.style.background = 'rgba(255, 255, 255, 0.85)';
        var ctx = canvas.getContext("2d");
        var centerX = canvas.width / 2;
        var centerY = canvas.height / 2;
            
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(204, 0, 102, 0)";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#003300';
        ctx.stroke();

        docById('wheelDiv2').style.display = '';
        docById('wheelDiv2').style.background = 'none';

        var t = TEMPERAMENT[this.inTemperament];
        this.pitchNumber = t.pitchNumber;
        var startingPitch = this._logo.synth.startingPitch;
        var len = startingPitch.length;
        var number = pitchToNumber(startingPitch.substring(0, len - 1), startingPitch.slice(-1), 'C major');
        var str = [];

        for(var i=0; i < this.pitchNumber; i++) {
            str[i] = numberToPitch(number + i).toString();
            this.notes[i] = str[i];
            str[i] = str[i].replace(',', '');
            if (str[i].substring(1, str[i].length-1) === FLAT || str[i].substring(1, str[i].length-1) === 'b' ) {
                str[i] = str[i].replace(FLAT, 'b');
            } else if (str[i].substring(1, str[i].length-1) === SHARP || str[i].substring(1, str[i].length-1) === '#' ) {
                str[i] = str[i].replace(SHARP, '#'); 
            }
            this.frequencies[i] = this._logo.synth._getFrequency(str[i], true, this.inTemperament).toFixed(2);    
        }

        var labels = [];
        for (var j = 0; j < this.pitchNumber; j++) {
            var label = j.toString();
            labels.push(label);
        } 

        this.notesCircle = new wheelnav('wheelDiv2');
        this.notesCircle.wheelRadius = 230;
        this.notesCircle.navItemsEnabled = false;
        this.notesCircle.navAngle = 270;
        this.notesCircle.slicePathFunction = slicePath().MenuSliceWithoutLine;
        this.notesCircle.slicePathCustom = slicePath().MenuSliceCustomization();
        this.notesCircle.sliceSelectedPathCustom = this.notesCircle.slicePathCustom;
        this.notesCircle.sliceInitPathCustom = this.notesCircle.slicePathCustom;
        var menuRadius = (2 * Math.PI * radius / this.pitchNumber) / 3; 
        this.notesCircle.slicePathCustom.menuRadius = menuRadius;
        this.notesCircle.initWheel(labels);

        for (var i = 0; i < this.notesCircle.navItemCount; i++) {
            this.notesCircle.navItems[i].fillAttr = "#c8C8C8";
            this.notesCircle.navItems[i].titleAttr.font = "20 20px Impact, Charcoal, sans-serif";
            this.notesCircle.navItems[i].titleSelectedAttr.font = "20 20px Impact, Charcoal, sans-serif";
        }

        this.notesCircle.createWheel();
        var that = this;
        docById('wheelDiv2').style.position = 'absolute';
        docById('wheelDiv2').style.height = height + 'px';
        docById('wheelDiv2').style.width = BUTTONDIVWIDTH + 'px';
        docById('wheelDiv2').style.left = canvas.style.x + 'px';
        docById('wheelDiv2').style.top = canvas.style.y + 'px';

        docById('wheelDiv2').addEventListener('mouseover', function(e) {
            that.showNoteInfo(e);
        });

        docById('wheelDiv2').onmouseout = function(event) {
            if (docById('noteInfo') === null) {
                that.lastTriggered = null;
            }
        }; 
    };

    this.showNoteInfo = function(event) {
        for(var i=0; i< this.notesCircle.navItemCount; i++) {
            if(event.target.id == 'wheelnav-wheelDiv2-slice-' + i){
                if (this.lastTriggered === i) {
                    event.preventDefault();
                } else {
                    var x = event.clientX - docById('wheelDiv2').getBoundingClientRect().left;
                    var y = event.clientY - docById('wheelDiv2').getBoundingClientRect().top;
                    var frequency = this.frequencies[i];
                    var that = this;
                    if (docById('noteInfo') !== null) {
                        docById('noteInfo').remove();
                    }
                    //this._logo.synth.inTemperament = this.inTemperament;
                    docById('wheelDiv2').innerHTML += '<div class="popup" id="noteInfo" style=" left: ' + x + 'px; top: ' + y + 'px;"><span class="popuptext" id="myPopup"></span></div>' 
                    docById('noteInfo').innerHTML += '<img src="header-icons/edit.svg" id="edit" title="edit" alt="edit" height=20px width=20px data-message="' + i + '">';
                    docById('noteInfo').innerHTML += '<img src="header-icons/close-button.svg" id="close" title="close" alt="close" height=20px width=20px align="right"><br>';
                    docById('noteInfo').innerHTML += '&nbsp Note : ' + this.notes[i] + '<br>';
                    docById('noteInfo').innerHTML += '<div id="frequency">&nbsp Frequency : ' + frequency + '</div>';

                    docById('close').onclick = function() {
                        docById('noteInfo').remove();
                    }

                    docById('edit').onclick = function(event) {
                        var index = event.target.dataset.message;
                        docById('frequency').innerHTML = '&nbsp Frequency : &nbsp<input type = "text" id="changedFrequency" value=' + frequency + ' style="position:absolute; width:52px;" data-message= ' + index + '></input>'
                        docById('changedFrequency').addEventListener ("mouseout", changeFrequency, false);
                    }

                    function changeFrequency(event) {
                        var j = event.target.dataset.message;
                        frequency = docById('changedFrequency').value;
                        docById('changedFrequency').remove();
                        docById('frequency').innerHTML = '<div id="frequency">&nbsp Frequency : ' + frequency + '</div>';   
                        that.frequencies[j] = frequency;
                    }

                    this.lastTriggered = i;
                }   
            }
        }
    };

    this._graphOfNotes = function (){  //TODO : Improve UI.
        this.circleIsVisible = true;
        this.toggleNotesButton();
        temperamentTable.remove();
        if (docById('wheelDiv2') != null) {
            docById('wheelDiv2').style.display = 'none';
            this.notesCircle.removeWheel();
        }

        temperamentTableDiv.innerHTML = '<table id="notesGraph" width=' + BUTTONDIVWIDTH + '></table>'
        var notesGraph = docById('notesGraph');
        var headerNotes = notesGraph.createTHead();
        var rowNotes = headerNotes.insertRow(0);
        var menuLabels = ['Pitch Number', 'Note', 'Frequency', 'Ratio', 'Interval'] //TODO: Add mode
        notesGraph.innerHTML = '<tbody id="tablebody"><tr id="menu"></tr></tbody>'
        docById('menu').innerHTML = '';
        
        for(var i = 0; i < menuLabels.length; i++) {
            docById('menu').innerHTML += '<td id="menuLabels">'+ menuLabels[i] + '</td>';
        }
        
        var menuItems =  document.querySelectorAll("#menuLabels");
        for(var i = 0; i < menuLabels.length; i++) {
            menuItems[i].style.background = MATRIXLABELCOLOR; 
            menuItems[i].style.height = 30 + 'px';
            menuItems[i].style.textAlign = 'center';
            menuItems[i].style.fontWeight = 'bold';
        }
        var pitchNumberColumn = '';
        for(var i = 0; i < this.pitchNumber; i++) {
            pitchNumberColumn += '<tr id="notes_' + i + '"></tr>';
        }
        docById('tablebody').innerHTML += pitchNumberColumn;

        var startingPitch = this._logo.synth.startingPitch;
        var t = TEMPERAMENT[this.inTemperament];
        var notesRow = [];
        var notesCell = [];
        var noteObj = [];
        for(var i = 0; i < this.pitchNumber; i++) {
            noteObj[i] = this.notes[i].split(',');
            this.intervals[i] = getIntervalName(startingPitch, noteObj[i][0], noteObj[i][1]);
            this.ratios[i] = t[this.intervals[i]];
            this.ratios[i] = this.ratios[i].toFixed(2);
            notesRow[i] = docById('notes_' + i);

            //Pitch Number
            notesCell[i,0] = notesRow[i].insertCell(-1);
            notesCell[i,0].innerHTML = i;
            notesCell[i,0].style.backgroundColor = MATRIXNOTECELLCOLOR;
            notesCell[i,0].style.textAlign = 'center';

            //Notes
            notesCell[i,1] = notesRow[i].insertCell(-1);
            notesCell[i,1].innerHTML = this.notes[i];
            notesCell[i,1].style.backgroundColor = MATRIXNOTECELLCOLOR;
            notesCell[i,1].style.textAlign = 'center';

            //Frequency
            notesCell[i,2] = notesRow[i].insertCell(-1);
            notesCell[i,2].innerHTML = this.frequencies[i];
            notesCell[i,2].style.backgroundColor = MATRIXNOTECELLCOLOR;
            notesCell[i,2].style.textAlign = 'center';

            //Ratio
            notesCell[i,3] = notesRow[i].insertCell(-1);
            notesCell[i,3].innerHTML = this.ratios[i];
            notesCell[i,3].style.backgroundColor = MATRIXNOTECELLCOLOR;
            notesCell[i,3].style.textAlign = 'center';

            //Interval
            notesCell[i,4] = notesRow[i].insertCell(-1);
            notesCell[i,4].innerHTML = this.intervals[i];
            notesCell[i,4].style.backgroundColor = MATRIXNOTECELLCOLOR;
            notesCell[i,4].style.textAlign = 'center';
        }
    };

    this.init = function(logo) {
    	this._logo = logo;

    	var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;
        var temperamentDiv = docById("temperamentDiv");
        temperamentDiv.style.visibility = "visible";
        temperamentDiv.setAttribute('draggable', 'true');
        temperamentDiv.style.left = '200px';
        temperamentDiv.style.top = '150px';

        var widgetButtonsDiv = docById('temperamentButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table cellpadding="0px" id="temperamentButtonTable"></table>';

        var canvas = docById('myCanvas');

        var buttonTable = docById('temperamentButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        var that = this;

        var cell = row.insertCell();
        cell.innerHTML = this.inTemperament;
        cell.style.width = (2*BUTTONSIZE) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = BUTTONSIZE + 'px';
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.textAlign = 'center';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        var cell = this._addButton(row, 'play-button.svg', ICONSIZE, _('play all'));
        var cell = this._addButton(row, 'export-chunk.svg', ICONSIZE, _('save'));
        var noteCell = this._addButton(row, 'play-button.svg', ICONSIZE, _('table'));
        
        this.toggleNotesButton = function () {
            if (this.circleIsVisible) {
                noteCell.getElementsByTagName("img")[0].src = 'header-icons/circle.svg';
                noteCell.getElementsByTagName("img")[0].title = 'circle';
                noteCell.getElementsByTagName("img")[0].alt = 'circle';
            } else {
                noteCell.getElementsByTagName("img")[0].src = 'header-icons/table.svg';
                noteCell.getElementsByTagName("img")[0].title = 'table';
                noteCell.getElementsByTagName("img")[0].alt = 'table';

            }
        }

        this._circleOfNotes();

        noteCell.onclick = function(event) {
            if (that.circleIsVisible) {
                that._circleOfNotes();
            } else {
                that._graphOfNotes();
            }
        }

        var addButtonCell = this._addButton(row, 'add2.svg', ICONSIZE, _('add pitches'));

        /*var modeselector = '<select name="mode" id="modeLabel" style="background-color: ' + MATRIXBUTTONCOLOR + '; width: 130px; height: ' + BUTTONSIZE +'px; ">';
        for (var i = 0; i < MODENAMES.length; i++) {
            if (MODENAMES[i][0].length === 0) {
                modeselector += '<option value="' + MODENAMES[i][1] + '">' + MODENAMES[i][1] + '</option>';
            } else {
                modeselector += '<option value="' + MODENAMES[i][0] + '">' + MODENAMES[i][0] + '</option>';
            }
        }
        modeselector += '</select>';

        var cell = row.insertCell();
        cell.innerHTML = modeselector;
        cell.style.width = (2*BUTTONSIZE) + 'px';
        cell.style.minWidth = 130 + 'px';
        cell.style.maxWidth = 130 + 'px';
        cell.style.height = BUTTONSIZE + 'px';
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;*/

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));
        cell.onclick = function () {
            docById('temperamentDiv').style.visibility = 'hidden';
            docById('temperamentButtonsDiv').style.visibility = 'hidden';
            docById('temperamentTableDiv').style.visibility = 'hidden';
            if (docById('wheelDiv2') != null) {
                docById('wheelDiv2').style.display = 'none';
                that.notesCircle.removeWheel(); 
            }   
        };

        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - temperamentDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - temperamentDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function (e) {
            dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function (e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function (e) {
            e.preventDefault();
        };

        canvas.ondrop = function (e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                temperamentDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                temperamentDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        temperamentDiv.ondragover = function (e) {
            e.preventDefault();
        };

        temperamentDiv.ondrop = function (e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                temperamentDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                temperamentDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        temperamentDiv.onmousedown = function (e) {
            that._dragging = true;
            that._target = e.target;
        };

        temperamentDiv.ondragstart = function (e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };	
	};
};