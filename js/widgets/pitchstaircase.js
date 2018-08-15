// Copyright (c) 2016-2018 Walter Bender
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

function PitchStaircase () {
    const BUTTONDIVWIDTH = 476;  // 8 buttons 476 = (55 + 4) * 8
    const OUTERWINDOWWIDTH = 685;
    const INNERWINDOWWIDTH = 600;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const DEFAULTFREQUENCY = 220.0;

    // A list of stair steps.
    this.Stairs = [];
    this.stairPitchBlocks = [];

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

    this._makeStairs = function (start, isStepDeleted) {
        var w = window.innerWidth;
        var iconSize = ICONSIZE * this._cellScale;

        // Each row in the psc table contains separate table; each
        // table contains a note label in the first column and a table
        // of buttons in the second column.
        var pscTable = docById('pscTable');
        pscTable.innerHTML = '';
        pscTable.style.textAlign = 'center';

        if (!isStepDeleted) {
            var stairsLength = this.Stairs.length;
        } else {
            var stairsLength = this.Stairs.length - 1;
        }

        var that = this;

        for (var i = 0; i < this.Stairs.length; i++) {
            var pscTableRow = pscTable.insertRow();
            var pscTableCell = pscTableRow.insertCell();
            pscTableCell.innerHTML = '<table cellpadding="0px" id="stepTable' + i + '"></table>';

            var stepTable = docById('stepTable' + i);
            var stepTableRow = stepTable.insertRow();

            // The stairstep for this row.
            // var solfege = this.Stairs[i][0];
            // var octave = this.Stairs[i][1];
            // var solfegetonote = getNote(solfege, octave, 0, this._logo.keySignature[this.logoturtle], false, null, this._logo.errorMsg)[0];
            var frequency = this.Stairs[i][2];

            // The play button for this row.
            // var cell = stepTableRow.insertCell();
            var playCell = this._addButton(stepTableRow, 'play-button.svg', ICONSIZE, _('play'));
            playCell.className = 'headcol';  // This cell is fixed horizontally.
            playCell.setAttribute('id', i);

            var stepCell = stepTableRow.insertCell();
            stepCell.setAttribute('id', frequency);
            stepCell.style.width = INNERWINDOWWIDTH * parseFloat(DEFAULTFREQUENCY/frequency) * this._cellScale / 3 + 'px';
            stepCell.innerHTML = frequency.toFixed(2) + '<br>' + this.Stairs[i][0] + this.Stairs[i][1];
            stepCell.style.minWidth = stepCell.style.width;
            stepCell.style.maxWidth = stepCell.style.width;
            stepCell.style.height = BUTTONSIZE + 'px';
            stepCell.style.backgroundColor = MATRIXNOTECELLCOLOR;

            var cellWidth = Number(stepCell.style.width.replace(/px/, ''));
            var svgWidth = cellWidth.toString();
            var svgScale = (cellWidth / 55).toString();
            var svgStrokeWidth = (3 * 55 / cellWidth).toString();
            var svgData = 'data:image/svg+xml;base64,' + window.btoa(unescape(encodeURIComponent(SYNTHSVG.replace(/SVGWIDTH/g, svgWidth).replace(/XSCALE/g, svgScale).replace(/STOKEWIDTH/g, svgStrokeWidth))));
            stepCell.style.backgroundImage = 'url(' + svgData + ')';
            stepCell.style.backgroundRepeat = 'no-repeat';
            stepCell.style.backgroundPosition = 'center center';

            stepCell.addEventListener('click', function (event) {
                that._dissectStair(event);
            });

            playCell.onclick=function() {
                var i = this.getAttribute('id');
                var pscTableCell = docById('stepTable' + i);
                var stepCell = pscTableCell.rows[0].cells[1];
                that._playOne(stepCell);
            };
        }
    };

    this._undo = function () {
        if (this._history.length === 0) {
            console.log('nothing for undo to undo');
            return false;
        }

        // Remove the last entry...
        var i = this._history.pop();
        this.Stairs.splice(i, 1);

        // Remove the last block added to the tempo widget
        var blk = this.stairPitchBlocks.pop();
        console.log('removing block ' + blk);
        // Find the block above
        var c0 = this._logo.blocks.blockList[blk].connections[0];
        // And the block below, if any
        var c1 = last(this._logo.blocks.blockList[blk].connections);

        // Check for vspaces below the hertz block
        if (c1 !== null) {
            if (this._logo.blocks.blockList[c1].name === 'vspace') {
		var c2 = last(this._logo.blocks.blockList[c1].connections);
		if (this._logo.blocks.blockList[c2].name === 'vspace') {
		    var c = last(this._logo.blocks.blockList[c2].connections);
		    this._logo.blocks.blockList[c2].connections[1] = null;
		} else {
		    var c = last(this._logo.blocks.blockList[c1].connections);
		    this._logo.blocks.blockList[c1].connections[1] = null;
		}
	    }
	} else {
	    var c = c1;
	}

        // Disconnect from the block above
        var i = this._logo.blocks.blockList[c0].connections.indexOf(blk);
        this._logo.blocks.blockList[c0].connections[i] = c;
        this._logo.blocks.blockList[blk].connections[0] = null;

        // And send the blocks to the trash
        this._logo.blocks.sendStackToTrash(this._logo.blocks.blockList[blk]);

        // Force the clamp to adjust.
        this._logo.blocks.blockMoved(c0);
        this._logo.blocks.adjustDocks(this._logo.blocks.findTopBlock(c0));
        this._logo.blocks.clampThisToCheck = [[this._logo.blocks.findTopBlock(c0), 0]];
        this._logo.blocks.adjustExpandableClampBlock();

        // And rebuild the stairs.
        this._refresh();

	return true;
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
        var frequency = Number(oldcell.getAttribute('id'));

        // Look for the Stair with this frequency.
        for (var n = 0; n < this.Stairs.length; n++) {
            if (this.Stairs[n][2] === frequency) {
                break;
            }
        }

        if (n === this.Stairs.length) {
            console.log('DID NOT FIND A MATCH ' + frequency);
            return;
        }

        // TODO: look to see if the same frequency is already in the list.

        var obj = frequencyToPitch(parseFloat(frequency) / inputNum);
        var foundStep = false;
        var isStepDeleted = true;

        for (var i = 0; i < this.Stairs.length; i++) {
            if (this.Stairs[i][2] < parseFloat(frequency) / inputNum) {
                this.Stairs.splice(i, 0, [obj[0], obj[1], parseFloat(frequency) / inputNum, this.Stairs[n][3] * parseFloat(inputNum2), this.Stairs[n][4] * parseFloat(inputNum1), this.Stairs[n][2]]);
                foundStep = true;
                break;
            }

            if (this.Stairs[i][2] === parseFloat(frequency) / inputNum) {
                this.Stairs.splice(i, 1, [obj[0], obj[1], parseFloat(frequency) / inputNum, this.Stairs[n][3] * parseFloat(inputNum2), this.Stairs[n][4] * parseFloat(inputNum1), this.Stairs[n][2]]);
                foundStep = true;
                isStepDeleted = false;
                break;
            }
        }

        if (!foundStep) {
            this.Stairs.push([obj[0], obj[1], parseFloat(frequency) / inputNum, this.Stairs[n][3] * parseFloat(inputNum2), this.Stairs[n][4] * parseFloat(inputNum1), this.Stairs[n][2]]);
            this._history.push(this.Stairs.length - 1);
        } else {
            this._history.push(i);
        }

        // Add a new block to the tempo widget
        var note  = this.Stairs[i][0];
        var octave = this.Stairs[i][1];
        var frequency = this.Stairs[i][2];
        var pitch = frequencyToPitch(frequency);

        var bb = last(this.stairPitchBlocks);
        var b = this._logo.blocks.findBottomBlock(bb);
        var c = last(this._logo.blocks.blockList[b].connections);

        if (pitch[2] === 0) {  // 0 cents means we have an exact match to a named pitch
            var newStack = [[0, 'pitch', 0, 0, [null, 1, 2, c]], [1, ['notename', {'value': pitch[1]}], 0, 0, [0]], [2, ['number', {'value': pitch[1]}], 0, 0, [0]]];
        } else {
            // var newStack = [[0, 'hertz', 0, 0, [null, 1, c]], [1, ['number', {'value': frequency.toFixed(2)}], 0, 0, [0]]];
            var newStack = [[0, 'hertz', 0, 0, [null, 1, 6]], [1, 'multiply', 0, 0, [0, 2, 3]], [2, ['number', {'value': this.Stairs[n][5].toFixed(2)}], 0, 0, [1]], [3, 'divide', 0, 0, [1, 4, 5]], [4, ['number', {'value': this.Stairs[n][4]}], 0, 0, [3]], [5, ['number', {'value': this.Stairs[n][3]}], 0, 0, [3]], [6, 'vspace', 0, 0, [0, 7]], [7, 'vspace', 0, 0, [6, c]]];
        }

        var blk = this._logo.blocks.blockList.length;
        console.log(newStack);
        this._logo.blocks.loadNewBlocks(newStack);

        // Make the connections
        var i = this._logo.blocks.blockList[b].connections.length - 1;
        this._logo.blocks.blockList[b].connections[i] = blk;
        this._logo.blocks.blockList[blk].connections[0] = b;
        this._logo.blocks.adjustDocks(b, true);

        this.stairPitchBlocks.push(blk);

        this._makeStairs(i, isStepDeleted);
        this._resizeWidget();
    };

    this._playOne = function (stepCell) {
        // The frequency is stored in the stepCell.
        stepCell.style.backgroundColor = MATRIXBUTTONCOLOR;
        var frequency = Number(stepCell.getAttribute('id'));
        this._logo.synth.trigger(0, frequency, 1, 'default', null, null);

        setTimeout(function () {
            stepCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
        }, 1000)
    };

    this._playAll = function () {
        var that = this;
        var pitchnotes = [];

        for (var i = 0; i < this.Stairs.length; i++) {
            var note = this.Stairs[i][0] + this.Stairs[i][1];
            pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
            var pscTableCell = docById('stepTable' + i);
            var stepCell = pscTableCell.rows[0].cells[1];
            stepCell.style.backgroundColor = MATRIXBUTTONCOLOR;
            this._logo.synth.trigger(0, pitchnotes, 1, 'default', null,null);
        }

        setTimeout(function () {
            for (var i = 0; i < that.Stairs.length; i++) {
                var pscTableCell = docById('stepTable' + i);
                var stepCell = pscTableCell.rows[0].cells[1];
                stepCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            }
        }, 1000);
    };

    this.playUpAndDown = function () {
        var that = this;
        var pitchnotes = [];
        var note = this.Stairs[this.Stairs.length-1][0] + this.Stairs[this.Stairs.length-1][1];
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        var last = this.Stairs.length - 1;
        var pscTableCell = docById('stepTable' + last);
        var stepCell = pscTableCell.rows[0].cells[1];
        stepCell.style.backgroundColor = MATRIXBUTTONCOLOR;
        this._logo.synth.trigger(0, pitchnotes, 1, 'default', null, null);
        this._playNext(this.Stairs.length - 2, -1);
    };

    this._playNext = function (index, next) {
        if (docById('pscDiv').style.visibility === 'hidden') {
            return;
        }

        var that = this;
        if (index === this.Stairs.length) {
            setTimeout(function () {
                for (var i = 0; i < that.Stairs.length; i++) {
                    var pscTableCell = docById('stepTable' + i);
                    var stepCell = pscTableCell.rows[0].cells[1];
                    stepCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                }
            }, 1000);
            return;
        }

        if (index === -1) {
            setTimeout(function () {
                for (var i = 0; i < that.Stairs.length; i++) {
                    var pscTableCell = docById('stepTable' + i);
                    var stepCell = pscTableCell.rows[0].cells[1];
                    stepCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                }
            }, 1000);

            setTimeout(function () {
                that._playNext(0, 1);
            }, 200);

            return;
        }

        var pitchnotes = [];
        var note = this.Stairs[index][0] + this.Stairs[index][1];
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        var previousRowNumber = index - next;
        var pscTableCell = docById('stepTable' + previousRowNumber);

        setTimeout(function () {
            if (pscTableCell != null) {
                var stepCell = pscTableCell.rows[0].cells[1];
                stepCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            }

            var pscTableCell = docById('stepTable' + index);
            var stepCell = pscTableCell.rows[0].cells[1];
            stepCell.style.backgroundColor = MATRIXBUTTONCOLOR;
            that._logo.synth.trigger(0, pitchnotes, 1, 'default', null, null);
            if (index < that.Stairs.length || index > -1) {
                that._playNext(index + next, next);
            }
        }, 1000);
    };

    this._save = function (stairno) {
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();
        var newStack = [[0, ['action', {'collapsed': false}], 100, 100, [null, 1, 2, null]], [1, ['text', {'value': 'stair'}], 0, 0, [0]]];
        var endOfStackIdx = 0;
        var previousBlock = 0;

        for (var i = 0; i < this.Stairs.length; i++) {
            // console.log(this._initialFrequency + 'x' + this.Stairs[i][4] + '/' + this.Stairs[i][3]);
            console.log(this.Stairs[i][5] + 'x' + this.Stairs[i][4] + '/' + this.Stairs[i][3]);
            var noteobj = frequencyToPitch(this.Stairs[i][2]);
            var note  = this.Stairs[i][0];
            var octave = this.Stairs[i][1];
            var frequency = this.Stairs[i][2];
            var pitch = frequencyToPitch(frequency);

            // If cents === 0, then output a pitch block; otherwise,
            // output a hertz block <-- initial frequency x numerator
            // / denominator, followed by two vspace blocks.
            if (pitch[2] === 0) {
                var pitchBlockIdx = newStack.length;
                var hertzBlockIdx = pitchBlockIdx;
                var noteIdx = pitchBlockIdx + 1;
                var octaveIdx = pitchBlockIdx + 2;
                var hiddenIdx = pitchBlockIdx + 3;
                var hiddenBlockName = 'hidden';

                newStack.push([hertzBlockIdx, 'pitch', 0, 0, [previousBlock, noteIdx, octaveIdx, hiddenIdx]]);
                newStack.push([noteIdx, ['notename', {'value': pitch[0]}], 0, 0, [pitchBlockIdx]]);
                newStack.push([octaveIdx, ['number', {'value': pitch[1]}], 0, 0, [pitchBlockIdx]])
            } else {
                var hertzBlockIdx = newStack.length;
                var multiplyIdx = hertzBlockIdx + 1;
                var frequencyIdx = hertzBlockIdx + 2;
                var divideIdx = hertzBlockIdx + 3;
                var numeratorIdx = hertzBlockIdx + 4;
                var denominatorIdx = hertzBlockIdx + 5;
                var vspaceIdx = hertzBlockIdx + 6;
                var hiddenIdx = hertzBlockIdx + 7;
                var hiddenBlockName = 'vspace';
                newStack.push([hertzBlockIdx, 'hertz', 0, 0, [previousBlock, multiplyIdx, vspaceIdx]]);
                newStack.push([multiplyIdx, 'multiply', 0, 0, [hertzBlockIdx, frequencyIdx, divideIdx]]);
                // newStack.push([frequencyIdx, ['number', {'value': this._initialFrequency.toFixed(2)}], 0, 0, [multiplyIdx]]);
                newStack.push([frequencyIdx, ['number', {'value': this.Stairs[i][5].toFixed(2)}], 0, 0, [multiplyIdx]]);
                newStack.push([divideIdx, 'divide', 0, 0, [multiplyIdx, numeratorIdx, denominatorIdx]]);
                newStack.push([numeratorIdx, ['number', {'value': this.Stairs[i][4]}], 0, 0, [divideIdx]]);
                newStack.push([denominatorIdx, ['number', {'value': this.Stairs[i][3]}], 0, 0, [divideIdx]]);
                newStack.push([vspaceIdx, 'vspace', 0, 0, [hertzBlockIdx, hiddenIdx]]);
                hertzBlockIdx = vspaceIdx;  // The hidden block will connect here.
            }

            if (i === this.Stairs.length - 1) {
                newStack.push([hiddenIdx, hiddenBlockName, 0, 0, [hertzBlockIdx, null]]);
            } else {
                newStack.push([hiddenIdx, hiddenBlockName, 0, 0, [hertzBlockIdx, hiddenIdx + 1]]);
            }

            previousBlock = hiddenIdx;
        }

        this._logo.blocks.loadNewBlocks(newStack);
    };

    this.init = function (logo) {
        this._logo = logo;
        for (var i = 0; i < this.Stairs.length; i++) {
            this.Stairs[i].push(1);  // denominator
            this.Stairs[i].push(1);  // numerator
            this.Stairs[i].push(this.Stairs[i][2]);  // initial frequency
        }

        // this._initialFrequency = this.Stairs[0][2];
        this._history = [];

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        // Position the widget and make it visible.
        var pscDiv = docById('pscDiv');
        pscDiv.style.visibility = 'visible';
        pscDiv.setAttribute('draggable', 'true');
        pscDiv.style.left = '200px';
        pscDiv.style.top = '150px';

        // The widget buttons
        var widgetButtonsDiv = docById('pscButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table cellpadding="0px" id="pscButtonTable"></table>';

        var canvas = docById('myCanvas');

        var buttonTable = docById('pscButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        var that = this;

        var cell = this._addButton(row, 'play-chord.svg', ICONSIZE, _('play chord'));
        cell.onclick=function() {
            that._playAll();
        }

        var cell = this._addButton(row, 'play-scale.svg', ICONSIZE, _('play scale'));
        cell.onclick=function() {
            that.playUpAndDown();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = this._addButton(row, 'export-chunk.svg', ICONSIZE, _('save'));
        cell.onclick=function() {
            that._save(0);
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var cell = row.insertCell();
        cell.innerHTML = '<input id="musicratio1" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="musicratio1" type="musicratio1" value="' + 3 + '" />';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        docById('musicratio1').classList.add('hasKeyboard');

        var cell = row.insertCell();
        cell.innerHTML = '<h2>:</h2>';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        var cell = row.insertCell();
        cell.innerHTML = '<input id="musicratio2" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="musicratio2" type="musicratio2" value="' + 2 + '" />';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;
        docById('musicratio2').classList.add('hasKeyboard');

        var cell = this._addButton(row, 'restore-button.svg', ICONSIZE, _('undo'));
        cell.onclick=function() {
            that._undo();
        };

        var cell = this._addButton(row, 'erase-button.svg', ICONSIZE, _('clear'));
        cell.onclick=function() {
	    while (that._undo()) {
	    }
        };

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('close'));
        cell.onclick=function() {
            docById('pscDiv').style.visibility = 'hidden';
            docById('pscButtonsDiv').style.visibility = 'hidden';
            docById('pscTableDiv').style.visibility = 'hidden';
            docById('musicratio1').classList.remove('hasKeyboard');
            docById('musicratio2').classList.remove('hasKeyboard');
            that._logo.hideMsgs();
        };

        cell.onmouseover=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout=function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        // We use this cell as a handle for dragging.
        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - pscDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - pscDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
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
                pscDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                pscDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        pscDiv.ondragover = function(e) {
            e.preventDefault();
        };

        pscDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                pscDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                pscDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        pscDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        pscDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The pitch-staircase (psc) table
        var pscTableDiv = docById('pscTableDiv');
        pscTableDiv.style.display = 'inline';
        pscTableDiv.style.visibility = 'visible';
        pscTableDiv.style.border = '0px';
        pscTableDiv.innerHTML = '';

        pscTableDiv.innerHTML = '<div id="pscOuterDiv"><div id="pscInnerDiv"><table cellpadding="0px" id="pscTable"></table></div></div>';
        this._refresh();

        this._logo.textMsg(_('Click on a note to create a new step.'));
    };

    this._resizeWidget = function() {
        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.

        var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);
        var outerDiv = docById('pscOuterDiv');
        if (this.Stairs.length > n) {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (n + 6) + 'px';
            var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        } else {
            outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (this.Stairs.length + 3) + 'px';
            var w = Math.max(Math.min(window.innerWidth, this._cellScale * OUTERWINDOWWIDTH - 20), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 'px';
        }

        var w = Math.max(Math.min(window.innerWidth, this._cellScale * INNERWINDOWWIDTH), BUTTONDIVWIDTH - BUTTONSIZE);
        var innerDiv = docById('pscInnerDiv');
        innerDiv.style.width = w + 'px';
        innerDiv.style.marginLeft = (BUTTONSIZE * this._cellScale) + 'px';
    };

    this._refresh = function() {
        this._makeStairs(-1, true);
        this._resizeWidget();
    };
};
