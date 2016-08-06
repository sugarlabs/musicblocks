// Copyright (c) 2016 Walter Bender
// Copyright (c) 2016 Hemant Kasat
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to create new pitches with help of a initial
// pitch value by applying music ratios.

var DEFUALTFREQUENCY = 220.0;


function PitchStairCase () {

    this.Stairs = [];

    this._addButton = function (row, colIndex, icon, iconSize, label) {
        var cell = row.insertCell();
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover=function () {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout=function () {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this._makeStairs = function (start, isStairDeleted) {
        var that = this;
        var iconSize = Math.floor(this._cellScale * 24);
        var stairDiv = docById('pitchstaircase');
        var stairDivPosition = stairDiv.getBoundingClientRect();
        var playPitchDiv = docById('playPitch');
        var playPitchDivPosition = playPitchDiv.getBoundingClientRect();

        if (!isStairDeleted) {
            var stairsLength = this.Stairs.length;
        } else {
            var stairsLength = this.Stairs.length-1;
        }

        if (start === -1) {
            start = 0;
            var playTable = document.createElement('TABLE');
            playTable.setAttribute('id', 'playStairTable');
            playTable.style.textAlign = 'center';
            playTable.style.borderCollapse = 'collapse';
            playTable.cellSpacing = 0;
            playTable.cellPadding = 0;
            playPitchDiv.appendChild(playTable);
        } else {
            for (var j = start; j < stairsLength; j++) {
                docById('playStair' + j).remove();
                docById('stairTable' + j).remove();
            }
        }

        var playTable = docById('playStairTable');

        for (var i = start; i < that.Stairs.length; i++) {
            var header = playTable.createTHead();
            var playrow = header.insertRow(i);
            playrow.style.left = Math.floor(playPitchDivPosition.left) + 'px';
            playrow.style.top = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            playrow.setAttribute('id', 'playStair' + i);

            var playcell = this._addButton(playrow, -1, 'play-button.svg', iconSize, _('play'));

            playcell.onclick=function() {
                that._playOne(this);
            };

            var StairTable = document.createElement('TABLE');
            StairTable.setAttribute('id', 'stairTable' + i);
            StairTable.style.textAlign = 'center';
            StairTable.style.borderCollapse = 'collapse';
            StairTable.cellSpacing = 0;
            StairTable.cellPadding = 0;
            stairDiv.appendChild(StairTable);

            var header = StairTable.createTHead();
            var row = header.insertRow(-1);
            row.style.left = Math.floor(stairDivPosition.left) + 'px';
            row.style.top = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            row.setAttribute('id','stair' + i)

            var solfege = this.Stairs[i][0];
            var octave = this.Stairs[i][1];
            var solfegetonote = this._logo.getNote(solfege, octave, 0, this._logo.keySignature[this.logoturtle])[0];
            var frequency = this.Stairs[i][2];

            var cell = row.insertCell(-1);
            cell.style.width = (stairDivPosition.width) * parseFloat(DEFUALTFREQUENCY/frequency) * this._cellScale / 3 + 'px';
            cell.innerHTML = that.Stairs[i][0] + that.Stairs[i][1] + ' ' + frequency.toFixed(2);
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = playrow.offsetHeight + 'px';
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;

            cell.addEventListener('click', function (event) {
                that._dissectStair(event);
            });
        }
    };

    this._dissectStair = function (event) {
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
        inputNum = parseFloat(inputNum2 / inputNum1);
        var oldcell = event.target;
        var frequency = that.Stairs[oldcell.parentNode.id[5]][2];
        var obj = frequencyToPitch(parseFloat(frequency) / inputNum);
        var flag = 0;
        var isStairDeleted = 1;

        for (var i = 0; i < this.Stairs.length; i++) {
            if (this.Stairs[i][2] < parseFloat(frequency) / inputNum) {
                this.Stairs.splice(i, 0, [obj[0], obj[1], parseFloat(frequency) / inputNum]);
                flag = 1;
                break;
            }
            if (this.Stairs[i][2] === parseFloat(frequency) / inputNum) {
                this.Stairs.splice(i, 1, [obj[0], obj[1], parseFloat(frequency) / inputNum]);
                flag = 1;
                isStairDeleted = 0;
                break;
            }
        }
        if (flag === 0) {
            this.Stairs.push([obj[0], obj[1], parseFloat(frequency)/inputNum]);
        }

        this._makeStairs(i, isStairDeleted);
    };

    this._playOne = function (cell) {
        var that = this;
        var stairno = cell.parentNode.id[9];
        var pitchnotes = [];
        var note = this.Stairs[stairno][0] + this.Stairs[stairno][1];
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        var stair = docById('stair' + stairno);
        stair.cells[0].style.backgroundColor = MATRIXBUTTONCOLOR;
        this._logo.synth.trigger(pitchnotes, 1, 'poly');

        setTimeout(function () {
            stair.cells[0].style.backgroundColor = MATRIXNOTECELLCOLOR;
        }, 1000)
    };

    this._playAll = function () {
        var that = this;
        var pitchnotes = [];

        for (var i = 0; i < this.Stairs.length; i++) {
            var note = this.Stairs[i][0] + this.Stairs[i][1];
            pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
            var row = docById('stair' + i);
            row.cells[0].style.backgroundColor = MATRIXBUTTONCOLOR;
            this._logo.synth.trigger(pitchnotes, 1, 'poly');
        }

        setTimeout(function () {
            for (var i = 0; i < that.Stairs.length; i++) {
                var stair = docById('stair' + i);
                stair.cells[0].style.backgroundColor = MATRIXNOTECELLCOLOR;
            }
        }, 1000);
    };

    this._PlayUpandDown = function () {
        var that = this;
        var pitchnotes = [];
        var note = this.Stairs[this.Stairs.length-1][0] + this.Stairs[this.Stairs.length-1][1];
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        var last = this.Stairs.length-1;
        var row = docById('stair' + last);
        row.cells[0].style.backgroundColor = MATRIXBUTTONCOLOR;
        this._logo.synth.trigger(pitchnotes, 1, 'poly');
        this._Playnext(this.Stairs.length-2, -1);
    };

    this._Playnext = function (index, next) {
        var that = this;
        if (index === this.Stairs.length) {
            setTimeout(function () {
                for (var i = 0; i < that.Stairs.length; i++) {
                    var stair = docById('stair' + i);
                    stair.cells[0].style.backgroundColor = MATRIXNOTECELLCOLOR;
                }
            }, 1000);
            return;
        }

        if(index === -1) {
            setTimeout(function () {
                for (var i = 0; i < that.Stairs.length; i++) {
                    var stair = docById('stair' + i);
                    stair.cells[0].style.backgroundColor = MATRIXNOTECELLCOLOR;
                }
            }, 1000);

            setTimeout(function () {
                that._Playnext(0,1);
            }, 200);
            return;
        }

        var pitchnotes = [];
        var note = this.Stairs[index][0] + this.Stairs[index][1];
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        var row = docById('stair' + index);
        var previousrownumber = index-next;
        var previousrow = docById('stair' + previousrownumber);
        setTimeout(function () {
            if(previousrow != null) {
                previousrow.cells[0].style.backgroundColor = MATRIXNOTECELLCOLOR;
            }

            row.cells[0].style.backgroundColor = MATRIXBUTTONCOLOR;
            that._logo.synth.trigger(pitchnotes, 1, 'poly');
            if(index < that.Stairs.length || index > -1) {
                that._Playnext(index+next,next);
            }
        }, 1000);
    };

    this._save = function (stairno) {
        var that = this;
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();
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
            if (pitch[2] === 0) {
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
        that._logo.blocks.loadNewBlocks(newStack);
    };

    this.init = function (logo) {
        this._logo = logo;
        var that = this;
        console.log('init PitchStairCase');
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
        docById('pitchstaircase').style.height = Math.floor(w / 4) + 'px';
        docById('pitchstaircase').style.overflowY = 'auto';
        docById('playPitch').style.height = Math.floor(w / 4) + 'px';
        docById('playPitch').style.overflowY = 'hidden';

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

        var stairDiv = docById('pitchstaircase');
        stairDiv.style.paddingTop = 0 + 'px';
        stairDiv.style.paddingLeft = 0 + 'px';
        stairDiv.appendChild(x);
        stairDivPosition = stairDiv.getBoundingClientRect();

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

        var cell = this._addButton(row, -1, 'play-button.svg', iconSize, _('play chord'));
        cell.onclick=function() {
            that._playAll();
        }

        var table = docById('buttonTable');
        var header = table.createTHead();
        var row = header.insertRow(0);
        row.style.left = Math.floor(stairDivPosition.left) + 'px';
        row.style.top = Math.floor(stairDivPosition.top) + 'px';

        var cell = this._addButton(row, -1, 'export-chunk.svg', iconSize, _('save'));
        cell.onclick=function() {
            that._save(0);
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = this._addButton(row, 1, 'play-button.svg', iconSize, _('play UpDown'));
        cell.onclick=function() {
            that._PlayUpandDown();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = row.insertCell(2);
        cell.innerHTML = '<input id="musicratio1" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="musicratio1" type="musicratio1" value="' + 3 + '" />';
        cell.style.top = 0;
        cell.style.left = 0;
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        docById('musicratio1').classList.add('hasKeyboard');

        var cell = row.insertCell(3);
        cell.innerHTML = ':';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        var cell = row.insertCell(4);
        cell.innerHTML = '<input id="musicratio2" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="musicratio2" type="musicratio2" value="' + 2 + '" />';
        cell.style.top = 0;
        cell.style.left = 0;
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        docById('musicratio2').classList.add('hasKeyboard');

        var cell = this._addButton(row, 5, 'close-button.svg', iconSize, _('close'));
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

        this._makeStairs(-1, 1);
        };
};
