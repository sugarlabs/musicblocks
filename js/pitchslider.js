function PitchSlider () {

    this.Sliders = [];

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
        var obj = frequencyToPitch(this.Sliders[cellIndex][1]);
        var pitchnotes = [];
        var note = obj[0] + obj[1];
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        var slider = docById('slider');
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        this._logo.synth.trigger(pitchnotes, 1, 'poly');
        setTimeout(function() {
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
        }, 1000);
    };

    this._moveslider = function (cell) {
        cellIndex = cell.cellIndex;
        console.log(cell.cellIndex);
        var sliderrow = docById('slider');
        var nextoctavefrequency = 2 * this.Sliders[cellIndex][0];
        var frequency = this.Sliders[cellIndex][1] + parseFloat(this.Sliders[cellIndex][0])/12;
        console.log(frequency);
        console.log(nextoctavefrequency);
        if (frequency > nextoctavefrequency) {
            console.log("hello");
            this.Sliders[cellIndex][1] = this.Sliders[cellIndex][0];
        } else {
            this.Sliders[cellIndex][1] = frequency;
        }
        sliderrow.cells[cellIndex].innerHTML = this.Sliders[cellIndex][1].toFixed(2);
    };

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
        
        docById('pitchSliderDiv').style.width = Math.floor(w / 2) + 'px';
        docById('pitchSliderDiv').style.overflowX = 'auto';
        docById('pitchSliderDiv').style.height = Math.floor((SLIDERHEIGHT + MATRIXBUTTONHEIGHT) * this._cellScale) + 'px';
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
            cell.innerHTML = this.Sliders[i][0];
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(SLIDERHEIGHT * this._cellScale) + 'px';
            cell.style.lineHeight = 60 + '%';
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;

            cell.onclick=function() {
                that._play(this);
            }

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