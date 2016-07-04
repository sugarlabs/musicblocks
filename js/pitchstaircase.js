function PitchStairCase() {

    this.Stairs = [];

    this.dissectStair = function(event, logo) {
        var that = this;

        var inputNum = prompt(_('Divide By:'), 2);

        if(!isInt(inputNum)) {
            alert(_('Please Input a Integer'));
            inputNum = prompt(_('Divide By:'), 2);
        }

        if(inputNum === null) {
            return ;
        }
        var cell = event.target;
        var StairDiv = docById('pitchstaircase');
        var StairDivPosition = StairDiv.getBoundingClientRect();

        var StairTable = document.createElement('TABLE');
        StairTable.setAttribute('id',"stairTable" + this.Stairs.length);
        StairTable.style.textAlign = 'center';
        StairTable.style.borderCollapse = 'collapse';
        StairTable.cellSpacing = 0;
        StairTable.cellPadding = 0;
        StairDiv.appendChild(StairTable);

        var header = StairTable.createTHead();
        var newRow = header.insertRow(-1);
        newRow.style.left = Math.floor(StairDivPosition.left) + 'px';
        newRow.style.top = Math.floor(StairDivPosition.top) + 'px';
        newRow.setAttribute('id','stair' + this.Stairs.length);

        var newCell = newRow.insertCell(-1);
        newCell.style.width = parseFloat(cell.style.width)/inputNum + 'px';
        console.log(cell.style.width);
        console.log(newCell.style.width);
        newCell.style.minWidth = newCell.style.width;
        newCell.style.maxWidth = newCell.style.width;
        newCell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
        newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;

        newCell.addEventListener('click', function(event) {
            that.dissectStair(event);
        });
        var frequency = that.Stairs[that.Stairs.length-1][2];
        var obj = frequencyToPitch(parseFloat(frequency)/inputNum);

        newCell.innerHTML = obj[0] + obj[1] + " " + Math.floor(parseFloat(frequency)/inputNum);

        that.Stairs.push([obj[0], obj[1], parseFloat(frequency)/inputNum]);



    };

	this.init = function(logo) {

        console.log(this.Stairs);

		console.log("init PitchStairCase");
		this.logo = logo;

		docById('pitchstaircase').style.display = 'inline';
        console.log('setting PitchStairCase visible');
        docById('pitchstaircase').style.visibility = 'visible';
        docById('pitchstaircase').style.border = 2;

        var w = window.innerWidth;
        this.cellScale = w / 1200;
        docById('pitchstaircase').style.width = Math.floor(w / 2) + 'px';
        docById('pitchstaircase').style.overflowX = 'auto';
		
		var thisStair = this;

		var table = docById('buttonTable');

		if (table !== null) {
            table.remove();
        }

        
        for (var i = 0; i < this.Stairs.length; i++) {
            var table = docById('stairTable' + i);
            if (table !== null) {
                table.remove();
            }
        }
        var iconSize = Math.floor(this.cellScale * 24);

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'buttonTable');
        x.style.textAlign = 'center';
        x.style.borderCollapse = 'collapse';
        x.cellSpacing = 0;
        x.cellPadding = 0;

        var StairDiv = docById('pitchstaircase');
        StairDiv.style.paddingTop = 0 + 'px';
        StairDiv.style.paddingLeft = 0 + 'px';
        StairDiv.appendChild(x);
        StairDivPosition = StairDiv.getBoundingClientRect();

        var table = docById('buttonTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(StairDivPosition.left) + 'px';
        row.style.top = Math.floor(StairDivPosition.top) + 'px';

        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;


        cell.onclick=function() {
            docById('pitchstaircase').style.visibility = 'hidden';
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };


        for (var i = 0; i < thisStair.Stairs.length; i++) {

            var StairTable = document.createElement('TABLE');
            StairTable.setAttribute('id', 'stairTable' + i);
            StairTable.style.textAlign = 'center';
            StairTable.style.borderCollapse = 'collapse';
            StairTable.cellSpacing = 0;
            StairTable.cellPadding = 0;
            StairDiv.appendChild(StairTable);

            var header = StairTable.createTHead();          
            var row = header.insertRow(-1);
            row.style.left = Math.floor(StairDivPosition.left) + 'px';
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
            row.setAttribute('id','stair' + i)
            


            var solfege = this.Stairs[i][0];
            var octave = this.Stairs[i][1];
            console.log(solfege);
            console.log(octave);

            var solfegetonote = this.logo.getNote(solfege, octave, 0, this.logo.keySignature[this.logoturtle])[0];
            console.log(solfegetonote);

            var cell = row.insertCell(-1);
            cell.style.width = StairDivPosition.width + 'px';
            cell.innerHTML = thisStair.Stairs[i][0] + thisStair.Stairs[i][1] + " "  + Math.floor(thisStair.Stairs[i][2]);
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;

            cell.addEventListener('click', function(event) {
                thisStair.dissectStair(event, logo);
            });
            
        }
	};

};