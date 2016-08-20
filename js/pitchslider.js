function PitchSlider () {

    this.Sliders = [];
    this._initialTop;

	this._addButton = function(row, colIndex, icon, iconSize, label) {
        var cell = row.insertCell();
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
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

    this._play = function (cell) {
        var cellIndex = cell.cellIndex;
        var frequency = this.Sliders[cellIndex][0] +  this.Sliders[cellIndex][1] * parseFloat(this.Sliders[cellIndex][0])/12 + this.Sliders[cellIndex][2];
        var obj = frequencyToPitch(frequency);
        var pitchnotes = [];
        var note = obj[0] + obj[1];
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        var slider = docById('slider');
        this._logo.synth.trigger(pitchnotes, 1, 'poly');
    };

    this._moveslider = function (cell, upordown) {
        var cellIndex = cell.cellIndex;
        var sliderrow = docById('slider');
        var cellDiv = sliderrow.cells[cellIndex].childNodes[0];
        var frequencyDiv = cellDiv.childNodes[0];
        var sliderDiv = docById('pitchSliderDiv');
        var w = window.innerWidth;
        var moveValue = parseFloat(Math.floor(SLIDERWIDTH * this._cellScale))/3;
        var nextoctavefrequency = 2 * this.Sliders[cellIndex][0];
        var divMoved =  jQuery(sliderDiv).position().top - this._initialTop;

        this.Sliders[cellIndex][2] = 0;
        this.Sliders[cellIndex][1] += 1;    
        console.log(this.Sliders[cellIndex][1]);
        console.log(this.Sliders[cellIndex][2]);
        jQuery(cellDiv).css('top',jQuery(sliderDiv).position().top + w / 9 - divMoved - this.Sliders[cellIndex][1] * moveValue);
        var frequency = this.Sliders[cellIndex][0] +  this.Sliders[cellIndex][1] * parseFloat(this.Sliders[cellIndex][0])/12; 
        if (frequency > nextoctavefrequency || frequency < this.Sliders[cellIndex][0]) {
            this.Sliders[cellIndex][1] = 0;
            var frequency = this.Sliders[cellIndex][0];
            jQuery(cellDiv).css('top',jQuery(sliderDiv).position().top + w / 9 - divMoved);
        }
        console.log(frequency);
        frequencyDiv.innerHTML = frequency.toFixed(2);
        this._logo.synth.stop();
        this._play(sliderrow.cells[cellIndex]);
    };

    this._mousemove = function (e,cell) {
        var w = window.innerWidth;
        var sliderDiv = docById('pitchSliderDiv');
        var cellIndex = cell.cellIndex;
        var cellDiv = cell.childNodes[0];
        var frequencyDiv = cellDiv.childNodes[0];
        var cellDivPosition = cellDiv.getBoundingClientRect();
        var moveValue = parseFloat(Math.floor(SLIDERWIDTH * this._cellScale))/36;
        var offset = parseFloat(this.Sliders[cellIndex][0]) / 144;
        if(e.wheelDelta > 0) {
            this.Sliders[cellIndex][2] += offset;
            jQuery(cellDiv).css('top',jQuery(cellDiv).position().top - moveValue);
        } else {
            this.Sliders[cellIndex][2] -= offset;
            jQuery(cellDiv).css('top',jQuery(cellDiv).position().top + moveValue);
        }
        if (this.Sliders[cellIndex][2] > parseFloat(this.Sliders[cellIndex][0]) / 12) {
            this.Sliders[cellIndex][1] += 1;
            this.Sliders[cellIndex][2] = 0;
        }
        var frequency = this.Sliders[cellIndex][0] + this.Sliders[cellIndex][1] * parseFloat(this.Sliders[cellIndex][0]/12) + this.Sliders[cellIndex][2];
        var nextoctavefrequency = 2 * this.Sliders[cellIndex][0];   
        if (frequency > nextoctavefrequency || frequency < this.Sliders[cellIndex][0]) {
            this.Sliders[cellIndex][1] = 0;
            this.Sliders[cellIndex][2] = 0;
            var frequency = this.Sliders[cellIndex][0];
            jQuery(cellDiv).css('top',jQuery(sliderDiv).position().top + w / 9);
        }
        frequencyDiv.innerHTML =  frequency.toFixed(2);
        this._logo.synth.stop();
        this._play(cell);

    };

    this._save = function (cell) {
        var that = this;
        var cellIndex = cell.cellIndex;
        var frequency = this.Sliders[cellIndex][0] + this.Sliders[cellIndex][1] * parseFloat(this.Sliders[cellIndex][0]/12) + this.Sliders[cellIndex][2];
        console.log(frequency.toFixed(2));

        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, 2, null]], [1, ['text', {'value': 'slider'}], 0, 0, [0]]];
        var endOfStackIdx = 0;
        var previousBlock = 0;

        var noteObj = frequencyToPitch(frequency);
        var note = noteObj[0];
        var octave = noteObj[1];

        if(noteObj[2] === 0) {
            var pitchblockidx = newStack.length;
            var noteidx = pitchblockidx + 1;
            var octaveidx = pitchblockidx + 2;
            var hiddenidx = pitchblockidx + 3;
            newStack.push([pitchblockidx, 'pitch', 0, 0, [previousBlock, noteidx, octaveidx, hiddenidx]]);
            newStack.push([noteidx, ['text', {'value': note}], 0, 0, [pitchblockidx]]);
            newStack.push([octaveidx, ['number', {'value': octave}], 0, 0, [pitchblockidx]]);
            newStack.push([hiddenidx, 'hidden', 0, 0, [pitchblockidx, null]]);
        } else {
            var sineblockidx = newStack.length;
            var frequencyidx = sineblockidx + 1;
            var hiddenidx = sineblockidx + 2;
            newStack.push([sineblockidx, 'sine', 0, 0, [previousBlock, frequencyidx, hiddenidx]]);
            newStack.push([frequencyidx, ['number', {'value': frequency.toFixed(2)}], 0, 0, [sineblockidx]]);
            newStack.push([hiddenidx, 'hidden', 0, 0, [sineblockidx, null]]);

        } 

        that._logo.blocks.loadNewBlocks(newStack);
    }

	this.init = function (logo) {
		console.log('init PitchSlider');
		this._logo = logo;
		var that = this;

		docById('pitchSliderDiv').style.display = 'inline';
        console.log('setting PitchSlider visible');
        docById('pitchSliderDiv').style.visibility = 'visible';
        docById('pitchSliderDiv').style.border = 2;
		
        docById('moveSliderDiv').style.display = 'inline';
        docById('moveSliderDiv').style.visibility = 'visible';
        docById('moveSliderDiv').style.border = 2;

		var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = Math.floor(this._cellScale * 24);
        this._initialTop = jQuery('#pitchSliderDiv').position().top;
        
        docById('pitchSliderDiv').style.width = Math.floor(w / 2) + 'px';
        docById('pitchSliderDiv').style.overflowX = 'auto';
        docById('pitchSliderDiv').style.height = Math.floor(w / 4) + 'px';
        docById('pitchSliderDiv').style.overflowY = 'auto';
	
		var tables = document.getElementsByTagName('TABLE');
        var noofTables = tables.length

        for (var i = 0; i < noofTables; i++) {
            tables[0].parentNode.removeChild(tables[0]);
        } 

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'buttonTable');
        x.style.textAlign = 'center';
        x.cellSpacing = this._cellScale * 5 + 'px';
        x.cellPadding = 0;

        var sliderDiv = docById('pitchSliderDiv');
        sliderDiv.style.paddingTop = 0 + 'px';
        sliderDiv.style.paddingLeft = 0 + 'px';
        sliderDiv.appendChild(x);
        sliderDivPosition = sliderDiv.getBoundingClientRect();

        var movesliderDiv = docById('moveSliderDiv');
        movesliderDiv.style.paddingTop = 0 + 'px';
        movesliderDiv.style.paddingLeft = 0 + 'px';
        movesliderDivPosition = movesliderDiv.getBoundingClientRect();        

        var table = docById('buttonTable');
        var row = table.insertRow(0);
        row.style.left = Math.floor(sliderDivPosition.left) + 'px';
        row.style.top = Math.floor(sliderDivPosition.top) + 'px';

        var cell = this._addButton(row, -1, 'close-button.svg', iconSize, _('close'));

        cell.onclick=function() {
            docById('pitchSliderDiv').style.visibility = 'hidden';
            docById('moveSliderDiv').style.visibility = 'hidden';
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'pitchslider');
        x.style.textAlign = 'center';
        x.cellSpacing = this._cellScale * 5 + 'px';
        x.cellPadding = 0;
        sliderDiv.appendChild(x);

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'movepitch');
        x.style.textAlign = 'center';
        x.cellSpacing = this._cellScale * 5 + 'px';
        x.cellPadding = 0;
        movesliderDiv.appendChild(x);

        var table = docById('pitchslider');
        var row = table.insertRow(0);
        row.style.left = Math.floor(sliderDivPosition.left) + 'px';
        row.style.top = Math.floor(sliderDivPosition.top) + 'px';
        row.setAttribute('id', 'slider');

        var table = docById('movepitch');
        var moverow = table.insertRow(0);
        moverow.style.left = Math.floor(movesliderDivPosition.left) + 'px';
        moverow.style.top = Math.floor(movesliderDivPosition.top) + 'px';
        moverow.setAttribute('id', 'moveslider');

        for (var i = 0; i < this.Sliders.length; i++) {
            var cell = row.insertCell(i);
            cell.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(SLIDERHEIGHT * this._cellScale) + 'px';
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            cell.setAttribute('tabIndex', 1);

            var cellDiv = document.createElement("div");
            cellDiv.setAttribute('id', 'sliderInCell');
            cellDiv.setAttribute('position', 'absolute');
            cellDiv.style.height = Math.floor(w / 200) + 'px';
            cellDiv.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
            console.log(cellDiv.style.top);
            jQuery(cellDiv).css('top',jQuery(sliderDiv).position().top + w / 9);
            console.log(cellDiv.style.top);
            cellDiv.style.backgroundColor = MATRIXBUTTONCOLOR;
            cell.appendChild(cellDiv);
            var slider = document.createElement("P");
            slider.innerHTML = this.Sliders[i][0];
            cellDiv.appendChild(slider);

            cell.onmouseover=function() {
                this.focus();
                this.addEventListener("keydown", function(event) {
                    if (event.keyCode === 38) {
                        that._moveslider(this, 1);
                    }

                    if (event.keyCode === 40) {
                        that._moveslider(this, -1);
                    }
                });
            };

            cell.onmouseout=function() {
                this.blur();
            }

            cell.onmousemove=function() {
                var cellDiv = this.childNodes[0];
                var moveValue = parseFloat(Math.floor(SLIDERWIDTH * that._cellScale))/3;
                var divMoved = jQuery(sliderDiv).position().top - that._initialTop;

                if (event.pageY - w / 10 - divMoved <= jQuery(sliderDiv).position().top + w / 9 - divMoved && event.pageY - w / 10 - divMoved >= jQuery(sliderDiv).position().top + w / 9 - divMoved - 12 * moveValue) {
                    jQuery(cellDiv).css('top', event.pageY - w / 10 - divMoved);
                } else {
                    if (event.pageY - w / 10 - divMoved > jQuery(sliderDiv).position().top + w / 9 - divMoved) {
                        jQuery(cellDiv).css('top', jQuery(sliderDiv).position().top + w / 9 - divMoved);
                    } else {
                        jQuery(cellDiv).css('top', jQuery(sliderDiv).position().top + w / 9 - divMoved - 12 * moveValue);   
                    }
                }
                var cellIndex = this.cellIndex;
                var slidingAreaHeight = jQuery(sliderDiv).position().top + w / 9 - jQuery(sliderDiv).position().top - w / 9 + 12 * moveValue;
                var distanceFromBottom =  jQuery(sliderDiv).position().top + w / 9 - divMoved - jQuery(cellDiv).position().top;
                var frequencyOffSet = parseFloat(that.Sliders[cellIndex][0]) / slidingAreaHeight * distanceFromBottom;

                that.Sliders[cellIndex][1] = parseInt(frequencyOffSet / that.Sliders[cellIndex][0] * 12);
                that.Sliders[cellIndex][2] = frequencyOffSet - that.Sliders[cellIndex][1] * parseFloat(that.Sliders[cellIndex][0]) / 12;

                var frequencyDiv = cellDiv.childNodes[0];
                var frequency = that.Sliders[cellIndex][0] + that.Sliders[cellIndex][1] * parseFloat(that.Sliders[cellIndex][0]/12) + that.Sliders[cellIndex][2];
                frequencyDiv.innerHTML = frequency.toFixed(2);
                that._play(this);

            }

            cell.onclick=function() {
                that._save(this);           
            }

            cell.addEventListener("wheel", function(e) {
                that._mousemove(e, this);
            });

            var movecell = moverow.insertCell(i);
            movecell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/up.svg" title="' + _('move') + '" alt="' + _('move') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            movecell.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
            movecell.style.minWidth = movecell.style.width;
            movecell.style.maxWidth = movecell.style.width;
            movecell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            movecell.style.backgroundColor = MATRIXBUTTONCOLOR; 
            movecell.onclick=function() {
                that._moveslider(this);
            }
            movecell.onmouseover=function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            }   

            movecell.onmouseout=function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            }
           
        }        
	};
};