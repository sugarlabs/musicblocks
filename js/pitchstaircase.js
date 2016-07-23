

function PitchStairCase() {

    this.Stairs = [];

    this._makeStairs = function (start) {

        if(start === -1) {
            start = 0;
        } else {
            for (var j = start; j < this.Stairs.length-1; j++) {
                docById("playStairTable" + j).remove();
                docById("stairTable"+ j).remove();
            }
        }
        var thisStair = this;
        var iconSize = Math.floor(this._cellScale * 24);
        
        var StairDiv = docById('pitchstaircase');
        var StairDivPosition = StairDiv.getBoundingClientRect();

        var playPitchDiv = docById('playPitch');
        var playPitchDivPosition = playPitchDiv.getBoundingClientRect();

        for (var i = start; i < thisStair.Stairs.length; i++) {

            var playTable = document.createElement('TABLE');
            playTable.setAttribute('id', 'playStairTable' + i);
            playTable.style.textAlign = 'center';
            playTable.style.borderCollapse = 'collapse';
            playTable.cellSpacing = 0;
            playTable.cellPadding = 0;
            playPitchDiv.appendChild(playTable);

            var header = playTable.createTHead();
            var playrow = header.insertRow(-1);
            playrow.style.left = Math.floor(playPitchDivPosition.left) + 'px';
            playrow.style.top = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            playrow.setAttribute('id', "playStair" + i);

            var playcell = playrow.insertCell(-1);
            playcell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            playcell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            playcell.style.minWidth = playcell.style.width;
            playcell.style.maxWidth = playcell.style.width;
            playcell.style.height = Math.floor(RHYTHMRULERHEIGHT * this._cellScale) + 'px';
            playcell.style.backgroundColor = MATRIXBUTTONCOLOR;

            playcell.onclick = function() {
                console.log(playcell.parentNode.id);
                thisStair._PlayOne(event);
            };


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
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            row.setAttribute('id','stair' + i)
            


            var solfege = this.Stairs[i][0];
            var octave = this.Stairs[i][1];

            var solfegetonote = this.logo.getNote(solfege, octave, 0, this.logo.keySignature[this.logoturtle])[0];
            var frequency = this.Stairs[i][2];
            
            var cell = row.insertCell(-1);
            cell.style.width = (StairDivPosition.width)* parseFloat(this.Stairs[0][2]/this.Stairs[i][2]) * this._cellScale/2 + 'px';
            cell.innerHTML = thisStair.Stairs[i][0] + thisStair.Stairs[i][1] + " "  + frequency.toFixed(2);
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(RHYTHMRULERHEIGHT * this._cellScale) + 'px';
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;

            cell.addEventListener('click', function(event) {
                thisStair._dissectStair(event);
            });
        }
    };

    this._dissectStair = function(event) {
        var that = this;

        var inputNum1 = docById('musicratio1').value;
        if (isNaN(inputNum1)) {
            inputNum1 = 3;
        } else {
            inputNum1 = Math.abs(Math.floor(inputNum1));
        }

        docById('musicratio1').value = inputNum1;

        var inputNum2 = docById('musicratio2').value;
        if (isNaN(inputNum2)) {
            inputNum2 = 2;
        } else {
            inputNum2 = Math.abs(Math.floor(inputNum2));
        }
       
        docById('musicratio2').value = inputNum2;


        inputNum = parseFloat(inputNum2/inputNum1);


        if(inputNum === null) {
            return ;
        }
        var oldcell = event.target;
        var frequency = that.Stairs[oldcell.parentNode.id[5]][2];
        var obj = frequencyToPitch(parseFloat(frequency)/inputNum);

        var flag = 0;

        for (var i=0 ; i < this.Stairs.length; i++) {

            if (this.Stairs[i][2] < parseFloat(frequency)/inputNum) {
                this.Stairs.splice(i, 0, [obj[0], obj[1], parseFloat(frequency)/inputNum]);
                flag = 1;
                break;
            }
        }
        if(flag === 0) {
            this.Stairs.push([obj[0], obj[1], parseFloat(frequency)/inputNum]);
        }
        this._makeStairs(i);
    };

    this._PlayOne = function(event) {
        var that = this;
        var cell = event.target;
        var stairno = cell.parentNode.id[9];
        var pitchnotes = [];
        var note = this.Stairs[stairno][0] + this.Stairs[stairno][1];
        
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        
        var stair = docById('stair' + stairno);
        stair.cells[0].style.backgroundColor = MATRIXBUTTONCOLOR;
        
        this.logo.synth.trigger(pitchnotes, 1, 'poly');
        setTimeout(function () {
                stair.cells[0].style.backgroundColor = MATRIXNOTECELLCOLOR;
        }, 1000)
    };

    this._playAll = function() {
        var that = this;
        var pitchnotes = [];
        
        for (var i=0; i < this.Stairs.length; i++) {
            var note = this.Stairs[i][0] + this.Stairs[i][1];
            pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));

            var row = docById('stair' + i);
            row.cells[0].style.backgroundColor = MATRIXBUTTONCOLOR;
        
            this.logo.synth.trigger(pitchnotes, 1, 'poly');
        }
        setTimeout(function () {
            for (var i = 0; i < that.Stairs.length; i++) {
                var stair = docById('stair' + i);
                stair.cells[0].style.backgroundColor = MATRIXNOTECELLCOLOR;
            }
        }, 1000)

    };

    this._save = function (stairno) {
        var that = this;
        for (var name in this.logo.blocks.palettes.dict) {
            this.logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this.logo.refreshCanvas();

            

            var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, 2, null]], [1, ['text', {'value': 'stair'}], 0, 0, [0]]];
            var endOfStackIdx = 0;
            var previousBlock = 0;

            for (var i = 0; i < that.Stairs.length; i++) {
                var noteobj = frequencyToPitch(that.Stairs[i][2]);
                var note  = that.Stairs[i][0];
                var octave = that.Stairs[i][1];
                var frequency = that.Stairs[i][2];
                var pitch = frequencyToPitch(frequency);
                var sineblockidx = newStack.length;
                var frequencyidx = sineblockidx + 1;
                var hiddenidx = sineblockidx + 2;
                if(pitch[2] === 0) {

                    var pitchblockidx = newStack.length;
                    var noteidx = pitchblockidx + 1;
                    var octaveidx = pitchblockidx + 2;
                    var hiddenidx = pitchblockidx + 3;

                    newStack.push([sineblockidx, 'pitch', 0, 0, [previousBlock, noteidx, octaveidx, hiddenidx]]);
                    newStack.push([noteidx, ['text', {'value': pitch[0]}], 0, 0, [pitchblockidx]]);
                    newStack.push([octaveidx, ['number', {'value': pitch[1]}], 0, 0, [pitchblockidx]])
                } else {
                    newStack.push([sineblockidx, 'sine', 0, 0, [previousBlock, frequencyidx, hiddenidx]]);
                    newStack.push([frequencyidx, ['number', {'value': frequency.toFixed(2)}], 0, 0, [sineblockidx]]);
                } 

                if (i === that.Stairs.length - 1) {
                    newStack.push([hiddenidx, 'hidden', 0, 0, [sineblockidx, null]]);
                }
                else {
                    newStack.push([hiddenidx, 'hidden', 0, 0, [sineblockidx, hiddenidx + 1]]);
                }

                previousBlock = hiddenidx;

            }
            that.logo.blocks.loadNewBlocks(newStack);
    };

	this.init = function(logo) {


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
        this._cellScale = w / 1200;
        docById('pitchstaircase').style.width = Math.floor(w / 2) + 'px';
        docById('pitchstaircase').style.height = Math.floor(w/4) + 'px';
        docById('pitchstaircase').style.overflowY = 'auto';
        docById('playPitch').style.height = Math.floor(w/4) + 'px';
        docById('playPitch').style.overflowY = 'hidden';
	
        var thisStair = this;

        var tables = document.getElementsByTagName('TABLE');
        var noofTables = tables.length
        for (var i = 0; i < noofTables; i++) {
                tables[0].parentNode.removeChild(tables[0]);
        }

        var iconSize = Math.floor(this._cellScale * 24);

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
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        cell.onclick = function() {
            thisStair._playAll();
        }


        var table = docById('buttonTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(StairDivPosition.left) + 'px';
        row.style.top = Math.floor(StairDivPosition.top) + 'px';

        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/export-chunk.svg" title="' + _('save') + '" alt="' + _('save') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onclick=function() {
            thisStair._save(0);
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = row.insertCell(1);
        cell.innerHTML = '<input id="musicratio1" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="musicratio1" type="musicratio1" value="' + 3 + '" />';
        cell.style.top = 0;
        cell.style.left = 0;
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        docById('musicratio1').classList.add('hasKeyboard');

        var cell = row.insertCell(2);
        cell.innerHTML = '<input id="musicratio2" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="musicratio2" type="musicratio2" value="' + 2 + '" />';
        cell.style.top = 0;
        cell.style.left = 0;
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        docById('musicratio2').classList.add('hasKeyboard');
        
        var cell = row.insertCell(3);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/close-button.svg" title="' + _('close') + '" alt="' + _('close') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;


        cell.onclick=function() {
            docById('pitchstaircase').style.visibility = 'hidden';
            docById('playPitch').style.visibility = 'hidden';
            docById('musicratio1').classList.remove('hasKeyboard');
            docById('musicratio2').classList.remove('hasKeyboard');
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        this._makeStairs(-1);
	};

};