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

        var iconSize = Math.floor(this.cellScale * 24);

        var oldcell = event.target;
        var StairDiv = docById('pitchstaircase');
        var StairDivPosition = StairDiv.getBoundingClientRect();

        var playPitchDiv = docById('playPitch');
        var playPitchDivPosition = playPitchDiv.getBoundingClientRect();

        var playTable = document.createElement('TABLE');
        playTable.setAttribute('id', 'playStairTable' + this.Stairs.length);
        playTable.style.textAlign = 'center';
        playTable.style.borderCollapse = 'collapse';
        playTable.cellSpacing = 0;
        playTable.cellPadding = 0;
        playPitchDiv.appendChild(playTable);

        var header = playTable.createTHead();
        var row = header.insertRow(-1);
        row.style.left = Math.floor(playPitchDivPosition.left) + 'px';
        row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        row.setAttribute('id', "playStair" + this.Stairs.length);

        var cell = row.insertCell(-1);
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

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
        newCell.style.width = parseFloat(oldcell.style.width)/inputNum + 'px';
        console.log(cell.style.width);
        console.log(newCell.style.width);
        newCell.style.minWidth = newCell.style.width;
        newCell.style.maxWidth = newCell.style.width;
        newCell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
        newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;

        newCell.addEventListener('click', function(event) {
            that.dissectStair(event);
        });
        var frequency = that.Stairs[oldcell.parentNode.id[5]][2];
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

        docById('playPitch').style.display = 'inline';
        docById('playPitch').style.visibility = 'visible';
        docById('playPitch').style.border = 2;

        var w = window.innerWidth;
        this.cellScale = w / 1200;
        docById('pitchstaircase').style.width = Math.floor(w / 2) + 'px';
        docById('pitchstaircase').style.overflowX = 'auto';
		
		var thisStair = this;

		var table = docById('buttonTable');

		if (table !== null) {
            table.remove();
        }

        var table = docById('playAllStairTable');

        if (table !== null) {
            table.remove();
        }
        
        for (var i = 0; i < this.Stairs.length; i++) {
            var table = docById('stairTable' + i);
            var table1 = docById('playStairTable' + i);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             
            if (table !== null) {
                table.remove();
            }

            if (table1 !== null) {
                table1.remove();
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

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'playAllStairTable');
        x.style.textAlign = 'center';
        x.style.borderCollapse = 'collapse';
        x.cellSpacing = 0;
        x.cellPadding = 0;

        var playPitchDiv = docById('playPitch');
        playPitchDiv.style.paddingTop = 0 + 'px';
        playPitchDiv.style.paddingLeft = 0 + 'px';
        playPitchDiv.appendChild(x);
        playPitchDivPosition = playPitchDiv.getBoundingClientRect();

        var table = docById('playAllStairTable');
        var header = table.createTHead();
        var row = header.insertRow(-1);
        row.style.left = Math.floor(playPitchDivPosition.left) + 'px';
        row.style.top = Math.floor(playPitchDivPosition.top) + 'px';
        row.setAttribute('id', 'playAllStair');

        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;


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
            docById('playPitch').style.visibility = 'hidden';
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };


        for (var i = 0; i < thisStair.Stairs.length; i++) {

            var playTable = document.createElement('TABLE');
            playTable.setAttribute('id', 'playStairTable' + i);
            playTable.style.textAlign = 'center';
            playTable.style.borderCollapse = 'collapse';
            playTable.cellSpacing = 0;
            playTable.cellPadding = 0;
            playPitchDiv.appendChild(playTable);

            var header = playTable.createTHead();
            var row = header.insertRow(-1);
            row.style.left = Math.floor(playPitchDivPosition.left) + 'px';
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
            row.setAttribute('id', "playStair" + i);

            var cell = row.insertCell(-1);
            cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this.cellScale) + 'px';
            cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(RHYTHMRULERHEIGHT * this.cellScale) + 'px';
            cell.style.backgroundColor = MATRIXBUTTONCOLOR;


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
            cell.style.lineHeight = 60 + '%';
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            var pitchnotes = [];
            pitchnotes.push(thisStair.Stairs[i][0] + thisStair.Stairs[i][1]);
            console.log(pitchnotes);
            thisStair.logo.synth.trigger(pitchnotes, 0.125, 'poly');

            cell.addEventListener('click', function(event) {
                thisStair.dissectStair(event, logo);
            });
            
        }
	};

};