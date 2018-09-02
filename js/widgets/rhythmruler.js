// Copyright (c) 2016-18 Walter Bender
// Copyright (c) 2016 Hemant Kasat
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget enable us to create a rhythms which can be imported
// into the pitch-time matrix and hence used to create chunks of
// notes.


// rulerButtonsDiv is for the widget buttons
// rulerTableDiv is for the drum buttons (fixed first col) and the ruler cells

function RhythmRuler () {
    const BUTTONDIVWIDTH = 476;  // 8 buttons 476 = (55 + 4) * 8
    const OUTERWINDOWWIDTH = 675;
    const INNERWINDOWWIDTH = 600;
    const RULERHEIGHT = 70;
    const BUTTONSIZE = 51;
    const ICONSIZE = 32;
    const DEL = 46;

    // There is one ruler per drum.
    this.Drums = [];
    // Rulers, one per drum, contain the subdivisions defined by rhythm blocks.
    this.Rulers = [];
    // Save the history of divisions so as to be able to restore them.
    this._dissectHistory = [];
    this._undoList = [];

    this._playing = false;
    this._playingOne = false;
    this._playingAll = false;
    this._cellCounter = 0;

    // Keep a elapsed time for each ruler to maintain sync.
    this._elapsedTimes = [];
    // Starting time from which we measure for sync.
    this._startingTime = null;

    this._offsets = [];
    this._rulerSelected = 0;
    this._rulerPlaying = -1;

    this._tapMode = false;
    this._tapTimes = [];
    this._tapCell = null;
    this._tapEndTime = null;

    this._longPressStartTime = null;
    this._inLongPress = false;

    this._mouseDownCell = null;
    this._mouseUpCell = null;

    this._wheel = null;

    this._noteWidth = function (noteValue) {
        return Math.floor(EIGHTHNOTEWIDTH * (8 / Math.abs(noteValue)) * 3);
    };

    this._calculateZebraStripes = function(rulerno) {
        var ruler = docById('ruler' + rulerno);
        if (this._rulerSelected % 2 === 0) {
            var evenColor = MATRIXNOTECELLCOLOR;
        } else {
            var evenColor = MATRIXNOTECELLCOLORHOVER;
        }

        for (var i = 0; i < ruler.cells.length; i++) {
            var newCell = ruler.cells[i];
            if (evenColor === MATRIXNOTECELLCOLOR) {
                if (i % 2 === 0) {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                } else {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                }
            }

            if (evenColor === MATRIXNOTECELLCOLORHOVER) {
                if (i % 2 === 0) {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                } else {
                    newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                }
            }
        }
    };

    this._dissectRuler = function (event) {
        var cell = event.target;
        if (cell == null) {
            return;
        }

        if (this._tapMode && this._tapTimes.length > 0) {
            var d = new Date();
            this._tapTimes.push(d.getTime());
            return;
        }

        var cellParent = cell.parentNode;
        if (cellParent == null) {
            return;
        }

        this._rulerSelected = cellParent.id[5];
        if (this._rulerSelected == undefined) {
            return;
        }

        if (this._playing) {
            console.log('You cannot dissect while widget is playing.');
            return;
        } else if (this._tapMode) {
            // Tap a rhythm by clicking in a cell.
            if (this._tapCell === null) {
                var noteValues = this.Rulers[this._rulerSelected][0];
                this._tapCell = event.target;
                if (noteValues[this._tapCell.cellIndex] < 0) {
                    // Don't allow tapping in rests.
                    this._tapCell = null;
                    this._tapMode = false;
                    this._tapTimes = [];
                    this._tapEndTime = null;
                    var iconSize = ICONSIZE;
                    this._tapButton.innerHTML = '&nbsp;&nbsp;<img src="header-icons/tap-button.svg" title="' + _('tap a rhythm') + '" alt="' + _('tap a rhythm') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                    return;
                }

                this._tapTimes = [];

                // Play a count off before starting tapping.
                var interval = this._bpmFactor / Math.abs(noteValues[this._tapCell.cellIndex]);

                if (this.Drums[this._rulerSelected] === null) {
                    var drum = 'snare drum';
                } else {
                    var drumBlockNo = this._logo.blocks.blockList[this.Drums[this._rulerSelected]].connections[1];
                    var drum = this._logo.blocks.blockList[drumBlockNo].value;
                }

                var that = this;
                // FIXME: Should be based on meter
                for (var i = 0; i < 4; i++) {
                    setTimeout(function () {
                        that._logo.synth.trigger(0, 'C4', that._logo.defaultBPMFactor / 16, drum, null, null);
                    }, interval * i / 4);
                }

                setTimeout(function () {
                    that.__startTapping(noteValues, interval);
                }, interval);
            }
        } else {
            var noteValues = this.Rulers[this._rulerSelected][0];
            var inputNum = docById('dissectNumber').value;
            if (inputNum === '' || isNaN(inputNum)) {
                inputNum = 2;
            } else {
                inputNum = Math.abs(Math.floor(inputNum));
            }

            docById('dissectNumber').value = inputNum;

            // Does this work if there are more than 10 rulers?
            this._rulerSelected = cell.parentNode.id[5];
            this.__dissectByNumber(cell, inputNum, true);
        }

        this._piemenuRuler(this._rulerSelected);
    };

    this.__startTapping = function (noteValues, interval) {
        var d = new Date();
        this._tapTimes = [d.getTime()];
        this._tapEndTime = this._tapTimes[0] + interval;

        // Set a timeout to end tapping
        var that = this;
        setTimeout(function () {
            that.__endTapping();
        }, interval);

        // Display a progress bar.
        function __move(tick, stepSize) {
            var elem = docById("progressBar");
            var width = 1;
            var id = setInterval(frame, tick);

            function frame() {
                if (width >= 100) {
                    clearInterval(id);
                } else {
                    width += stepSize;
                    elem.style.width = width + '%';
                }
            };
        };

        this._tapCell.innerHTML = '<div id="progressBar"></div>';
        // Progress once per 8th note.
        __move(interval / 8, 100 / 8);
    };

    this.__endTapping = function () {
        this._rulerSelected = this._tapCell.parentNode.id[5];
        this._tapCell.innerHTML = '';
        var d = new Date();
        this._tapTimes.push(d.getTime());

        this._tapMode = false;
        if (typeof(this._rulerSelected) === 'string' || typeof(this._rulerSelected) === 'number') {
            var noteValues = this.Rulers[this._rulerSelected][0];

            if (last(this._tapTimes) > this._tapEndTime) {
                this._tapTimes[this._tapTimes.length - 1] = this._tapEndTime;
            }

            // convert times into cells here.
            var inputNum = docById('dissectNumber').value;
            if (inputNum === '' || isNaN(inputNum)) {
                inputNum = 2;
            } else {
                inputNum = Math.abs(Math.floor(inputNum));
            }

            // Minimum beat is tied to the input number
            switch(inputNum) {
            case 2:
                var minimumBeat = 16;
                break;
            case 3:
                var minimumBeat = 27;
                break;
            case 4:
                var minimumBeat = 32;
                break;
            case 5:
                var minimumBeat = 25;
                break;
            case 6:
                var minimumBeat = 36;
                break;
            case 7:
                var minimumBeat = 14;
                break;
            case 8:
                var minimumBeat = 64;
                break;
            default:
                var minimumBeat = 16;
                break;
            }

            var newNoteValues = [];
            var sum = 0;
            var interval = this._bpmFactor / Math.abs(noteValues[this._tapCell.cellIndex]);
            for (var i = 1; i < this._tapTimes.length; i++) {
                var dtime = this._tapTimes[i] - this._tapTimes[i - 1];
                if (i < this._tapTimes.length - 1) {
                    var obj = nearestBeat(100 * dtime / this._bpmFactor, minimumBeat);
                    if (obj[0] === 0) {
                        obj[0] = 1;
                        obj[1] = obj[1] / 2;
                    }

                    if ((sum + (obj[0] / obj[1])) < 1) {
                        sum += obj[0] / obj[1];
                        newNoteValues.push(obj[1] / obj[0]);
                    }
                } else {
                    // Since the fractional value is noisy,
                    // ensure that the final beat make the
                    // total add up to the proper note value.
                    var obj = rationalToFraction(1 / noteValues[this._tapCell.cellIndex] - sum);
                    newNoteValues.push(obj[1] / obj[0]);
                }
            }

            this.__divideFromList(this._tapCell, newNoteValues, true);
        }

        this._tapTimes = [];
        this._tapCell = null;
        this._tapEndTime = null;
        var iconSize = ICONSIZE;
        this._tapButton.innerHTML = '&nbsp;&nbsp;<img src="header-icons/tap-button.svg" title="' + _('tap a rhythm') + '" alt="' + _('tap a rhythm') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
    };

    this.__addCellEventHandlers = function (cell, cellWidth, noteValue) {
        var that = this;

        __mouseOverHandler = function (event) {
            var cell = event.target;
            if (cell == null) {
                return;
            }

            that._rulerSelected = cell.parentNode.id[5];
            var noteValues = that.Rulers[that._rulerSelected][0];
            var noteValue = noteValues[cell.cellIndex];
            if (noteValue < 0) {
                var obj = rationalToFraction(Math.abs(Math.abs(-1 / noteValue)));
                cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0], that._cellScale) + ' ' + _('silence');
            } else {
                var obj = rationalToFraction(Math.abs(Math.abs(1 / noteValue)));
                cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0], that._cellScale);
            }
        };

        __mouseOutHandler = function (event) {
            var cell = event.target;
            cell.innerHTML = '';
        };

        __mouseDownHandler = function (event) {
            var cell = event.target;
            that._mouseDownCell = cell;

            var d = new Date();
            that._longPressStartTime = d.getTime();
            that._inLongPress = false;

            that._longPressBeep = setTimeout(function () {
                that._logo.synth.trigger(0, 'C4', 1 / 32, 'chime', null, null);

                var cell = that._mouseDownCell;
                if (cell != null) {
                      that._rulerSelected = cell.parentNode.id[5];
                    var noteValues = that.Rulers[that._rulerSelected][0];
                    var noteValue = noteValues[cell.cellIndex];
                    cell.style.backgroundColor = MATRIXBUTTONCOLOR;
                }
            }, 1500);
        };

        __mouseUpHandler = function (event) {
            clearTimeout(that._longPressBeep);
            var cell = event.target;
            that._mouseUpCell = cell;
            if (that._mouseDownCell !== that._mouseUpCell) {
                that._tieRuler(event);
            } else if (that._longPressStartTime != null && !that._tapMode) {
                var d = new Date();
                var elapseTime = d.getTime() - that._longPressStartTime;
                if (elapseTime > 1500) {
                    that._inLongPress = true;
                    that.__toggleRestState(this, true);
                }
            }

            that._mouseDownCell = null;
            that._mouseUpCell = null;
            that._longPressStartTime = null;
        };

        __clickHandler = function (event) {
            if (event == undefined) return;
            if (!that.__getLongPressStatus()) {
                var cell = event.target;
                if (cell != null) {
                    that._dissectRuler(event);
                } else {
                    console.log('Rhythm Ruler: null cell found on click');
                }
            }

            that._inLongPress = false;
        };

        if (cellWidth > 12 && noteValue > 0) {
            var obj = rationalToFraction(Math.abs(1 / noteValue));
            cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0], that._cellScale);
        } else {
            cell.innerHTML = '';

            cell.removeEventListener('mouseover', __mouseOverHandler);
            cell.addEventListener('mouseover', __mouseOverHandler);

            cell.removeEventListener('mouseout', __mouseOutHandler);
            cell.addEventListener('mouseout', __mouseOutHandler);
        }

        cell.removeEventListener('mousedown', __mouseDownHandler);
        cell.addEventListener('mousedown', __mouseDownHandler);

        cell.removeEventListener('mouseup', __mouseUpHandler);
        cell.addEventListener('mouseup', __mouseUpHandler);

        cell.removeEventListener('click', __clickHandler);
        cell.addEventListener('click', __clickHandler);
    };

    this.__getLongPressStatus = function () {
        return this._inLongPress;
    };

    this.__toggleRestState = function (cell, addToUndoList) {
        var that = this;

        if (cell != null) {
            this._rulerSelected = cell.parentNode.id[5];
            var noteValues = this.Rulers[this._rulerSelected][0];
            var noteValue = noteValues[cell.cellIndex];

            __mouseOverHandler = function (event) {
                var cell = event.target;
                if (cell == null) {
                    return;
                }

                that._rulerSelected = cell.parentNode.id[5];
                var noteValues = that.Rulers[that._rulerSelected][0];
                var noteValue = noteValues[cell.cellIndex];
                if (noteValue < 0) {
                    var obj = rationalToFraction(Math.abs(Math.abs(-1 / noteValue)));
                    cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0], that._cellScale) + ' ' + _('silence');
                } else {
                    var obj = rationalToFraction(Math.abs(Math.abs(1 / noteValue)));
                    cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0], that._cellScale);
                }
            };

            __mouseOutHandler = function (event) {
                var cell = event.target;
                cell.innerHTML = '';
            };

            if (noteValue < 0) {
                var obj = rationalToFraction(Math.abs(1 / noteValue));
                cell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0], that._cellScale);
                cell.removeEventListener('mouseover', __mouseOverHandler);
                cell.removeEventListener('mouseout', __mouseOutHandler);
            } else {
                cell.innerHTML = '';

                cell.removeEventListener('mouseover', __mouseOverHandler);
                cell.addEventListener('mouseover', __mouseOverHandler);

                cell.removeEventListener('mouseout', __mouseOutHandler);
                cell.addEventListener('mouseout', __mouseOutHandler);
            }

            noteValues[cell.cellIndex] = -noteValue;

            this._calculateZebraStripes(this._rulerSelected);

            var divisionHistory = this.Rulers[this._rulerSelected][1];
            if (addToUndoList) {
                this._undoList.push(['rest', this._rulerSelected]);
            }

            divisionHistory.push(cell.cellIndex);
        }

        this._piemenuRuler(this._rulerSelected);
    };

    this.__divideFromList = function (cell, newNoteValues, addToUndoList) {
        if (typeof(cell) !== 'object') {
            return;
        }

        if (typeof(newNoteValues) !== 'object') {
            return;
        }

        var ruler = docById('ruler' + this._rulerSelected);
        var newCellIndex = cell.cellIndex;

        if (typeof(this._rulerSelected) === 'string' || typeof(this._rulerSelected) === 'number') {
            var noteValues = this.Rulers[this._rulerSelected][0];

            var divisionHistory = this.Rulers[this._rulerSelected][1];
            if (addToUndoList) {
                this._undoList.push(['tap', this._rulerSelected]);
            }

            divisionHistory.push([newCellIndex, newNoteValues]);

            ruler.deleteCell(newCellIndex);

            var noteValue = noteValues[newCellIndex];
            var tempwidth = this._noteWidth(newNoteValue);
            noteValues.splice(newCellIndex, 1);

            for (var i = 0; i < newNoteValues.length; i++) {
                var newCell = ruler.insertCell(newCellIndex + i);
                var newNoteValue = newNoteValues[i];
                var newCellWidth = parseFloat(this._noteWidth(newNoteValue));
                noteValues.splice(newCellIndex + i, 0, newNoteValue);

                newCell.style.width = newCellWidth + 'px';
                newCell.style.minWidth = newCell.style.width;
                newCell.style.maxWidth = newCell.style.width;
                newCell.style.height = RULERHEIGHT + 'px';
                newCell.style.minHeight = newCell.style.height;
                newCell.style.maxHeight = newCell.style.height;

                this.__addCellEventHandlers(newCell, newCellWidth, newNoteValue);
            }

            this._calculateZebraStripes(this._rulerSelected);
        }

        this._piemenuRuler(this._rulerSelected);
    };

    this.__dissectByNumber = function (cell, inputNum, addToUndoList) {
        if (typeof(cell) !== 'object') {
            return;
        }

        if (typeof(inputNum) !== 'number') {
            return;
        }

        var ruler = docById('ruler' + this._rulerSelected);
        var newCellIndex = cell.cellIndex;

        if (typeof(this._rulerSelected) === 'string' || typeof(this._rulerSelected) === 'number') {
            var noteValues = this.Rulers[this._rulerSelected][0];

            var divisionHistory = this.Rulers[this._rulerSelected][1];
            if (addToUndoList) {
                this._undoList.push(['dissect', this._rulerSelected]);
            }

            divisionHistory.push([newCellIndex, inputNum]);

            ruler.deleteCell(newCellIndex);

            var noteValue = noteValues[newCellIndex];
            var newNoteValue = inputNum * noteValue;
            var tempwidth = this._noteWidth(newNoteValue);
            var tempwidthPixels = parseFloat(inputNum) * parseFloat(tempwidth) + 'px';
            var difference = parseFloat(this._noteWidth(noteValue)) - parseFloat(inputNum) * parseFloat(tempwidth);
            var newCellWidth = parseFloat(this._noteWidth(newNoteValue)) + parseFloat(difference) / inputNum;
            noteValues.splice(newCellIndex, 1);

            for (var i = 0; i < inputNum; i++) {
                var newCell = ruler.insertCell(newCellIndex + i);
                noteValues.splice(newCellIndex + i, 0, newNoteValue);

                newCell.style.width = newCellWidth + 'px';
                newCell.style.minWidth = newCell.style.width;
                newCell.style.maxWidth = newCell.style.width;
                newCell.style.height = RULERHEIGHT + 'px';
                newCell.style.minHeight = newCell.style.height;
                newCell.style.maxHeight = newCell.style.height;

                this.__addCellEventHandlers(newCell, newCellWidth, newNoteValue);
            }

            this._calculateZebraStripes(this._rulerSelected);
        }

        this._piemenuRuler(this._rulerSelected);
    };

    this._tieRuler = function (event) {
        if (this._playing) {
            console.log('You cannot tie while widget is playing.');
            return;
        } else if (this._tapMode) {
            // If we are tapping, then treat a tie as a tap.
            this._dissectRuler(event);
            return;
        }

        // Does this work if there are more than 10 rulers?
        var cell = event.target;
        if (cell != null) {
            this._rulerSelected = cell.parentNode.id[5];
            this.__tie(true);
        }

        this._piemenuRuler(this._rulerSelected);
    };

    this.__tie = function (addToUndoList) {
        var ruler = docById('ruler' + this._rulerSelected);

        if (this._mouseDownCell === null || this._mouseUpCell === null) {
            return;
        }

        if (this._mouseDownCell === this._mouseUpCell) {
            return;
        }

        if (typeof(this._rulerSelected) === 'string' || typeof(this._rulerSelected) === 'number') {
            var noteValues = this.Rulers[this._rulerSelected][0];

            var downCellIndex = this._mouseDownCell.cellIndex;
            var upCellIndex = this._mouseUpCell.cellIndex;

            if (downCellIndex === -1 || upCellIndex === -1) {
                return;
            }

            if (downCellIndex > upCellIndex) {
                var tmp = downCellIndex;
                downCellIndex = upCellIndex;
                upCellIndex = tmp;
                var tmp = this._mouseDdownCell;
                this._mouseDownCell = this._mouseUpCell;
                this._mouseUpCell = tmp;
            }

            var noteValues = this.Rulers[this._rulerSelected][0];

            var divisionHistory = this.Rulers[this._rulerSelected][1];
            if (addToUndoList) {
                this._undoList.push(['tie', this._rulerSelected]);
            }

            var history = [];
            for (var i = downCellIndex; i < upCellIndex + 1; i++) {
                history.push([i, noteValues[i]]);
            }

            divisionHistory.push(history);

            var oldNoteValue = noteValues[downCellIndex];
            var noteValue = Math.abs(1 / oldNoteValue);

            // Delete all the cells between down and up except the down
            // cell, which we will expand.
            for (var i = upCellIndex; i > downCellIndex; i--) {
                noteValue += Math.abs(1 / noteValues[i]);
                ruler.deleteCell(i);
                this.Rulers[this._rulerSelected][0].splice(i, 1);
            }

            var newCellWidth = this._noteWidth(1 / noteValue);
            // Use noteValue of downCell for REST status.
            if (oldNoteValue < 0) {
                noteValues[downCellIndex] = -1 / noteValue;
            } else {
                noteValues[downCellIndex] = 1 / noteValue;
            }

            this._mouseDownCell.style.width = newCellWidth + 'px';
            this._mouseDownCell.style.minWidth = this._mouseDownCell.style.width;
            this._mouseDownCell.style.maxWidth = this._mouseDownCell.style.width;
            this._mouseDownCell.style.height = RULERHEIGHT + 'px';
            this._mouseDownCell.style.minHeight = this._mouseDownCell.style.height;
            this._mouseDownCell.style.maxHeight = this._mouseDownCell.style.height;

            this.__addCellEventHandlers(this._mouseDownCell, newCellWidth, noteValues[downCellIndex]);

            this._calculateZebraStripes(this._rulerSelected);
        }
    };

    this._undo = function () {
        // FIXME: Add undo for REST
        this._logo.synth.stop();
        this._startingTime = null;

        if (this._undoList.length === 0) {
            return;
        }

        var obj = this._undoList.pop();
        var lastRuler = obj[1];
        var divisionHistory = this.Rulers[lastRuler][1];
        if (divisionHistory.length === 0) {
            return;
        }

        var ruler = docById('ruler' + lastRuler);
        var noteValues = this.Rulers[lastRuler][0];

        if (obj[0] === 'dissect') {
            var inputNum = divisionHistory[divisionHistory.length - 1][1];
            var newCellIndex = divisionHistory[divisionHistory.length - 1][0];
            var cellWidth = ruler.cells[newCellIndex].style.width;
            var newCellWidth = parseFloat(cellWidth) * inputNum;
            var oldCellNoteValue = noteValues[newCellIndex];
            var newNoteValue = oldCellNoteValue/inputNum;

            var newCell = ruler.insertCell(newCellIndex);
            newCell.style.width = this._noteWidth(newNoteValue) + 'px';
            newCell.style.minWidth = newCell.style.width;
            newCell.style.maxWidth = newCell.style.width;
            newCell.style.height = RULERHEIGHT + 'px';
            newCell.style.minHeight = newCell.style.height;
            newCell.style.maxHeight = newCell.style.height;

            newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            newCell.innerHTML = calcNoteValueToDisplay(oldCellNoteValue / inputNum, 1, this._cellScale);

            noteValues[newCellIndex] = oldCellNoteValue / inputNum;
            noteValues.splice(newCellIndex + 1, inputNum - 1);

             this.__addCellEventHandlers(newCell, newCellWidth, newNoteValue);

            for (var i = 0; i < inputNum; i++) {
                ruler.deleteCell(newCellIndex + 1);
            }
        } else if (obj[0] === 'tap') {
            var newCellIndex = last(divisionHistory)[0];
            var oldNoteValues = last(divisionHistory)[1];

            // Calculate the new note value based on the sum of the
            // oldnoteValues.
            var oldCellNoteValue = noteValues[newCellIndex];
            var sum = 0;
            for (var i = 0; i < oldNoteValues.length; i++) {
                sum += 1 / oldNoteValues[i];
            }

            var newNoteValue = 1 / sum;
            var newCellWidth = this._noteWidth(newNoteValue);

            var newCell = ruler.insertCell(newCellIndex);
            newCell.style.width =  newCellWidth + 'px';
            newCell.style.minWidth = newCell.style.width;
            newCell.style.maxWidth = newCell.style.width;
            newCell.style.height = RULERHEIGHT + 'px';
            newCell.style.minHeight = newCell.style.height;
            newCell.style.maxHeight = newCell.style.height;

            newCell.style.backgroundColor = MATRIXNOTECELLCOLOR;

            var obj = rationalToFraction(newNoteValue);
            newCell.innerHTML = calcNoteValueToDisplay(obj[1], obj[0], this._cellScale);

            noteValues[newCellIndex] = newNoteValue;
            noteValues.splice(newCellIndex + 1, oldNoteValues.length - 1);

            this.__addCellEventHandlers(newCell, newCellWidth, newNoteValue);

            for (var i = 0; i < oldNoteValues.length; i++) {
                ruler.deleteCell(newCellIndex + 1);
            }
        } else if (obj[0] === 'tie') {
            var history = last(divisionHistory);
            // The old cell is the same as the first entry in the
            // history. Dissect the old cell into history.length
            // parts and restore their size and note values.
            if (history.length > 0) {
                var oldCell = ruler.cells[history[0][0]];
                var oldCellWidth = this._noteWidth(history[0][1]);
                oldCell.style.width = oldCellWidth + 'px';
                oldCell.style.minWidth = oldCell.style.width;
                oldCell.style.maxWidth = oldCell.style.width;
                oldCell.style.height = RULERHEIGHT + 'px';
                oldCell.style.minHeight = oldCell.style.height;
                oldCell.style.maxHeight = oldCell.style.height;

                noteValues[history[0][0]] = history[0][1];
                this.__addCellEventHandlers(oldCell, oldCellWidth, history[0][1]);

                for (var i = 1; i < history.length; i++) {
                    var newCell = ruler.insertCell(history[0][0] + i);
                    var newCellWidth = this._noteWidth(history[i][1]);
                    newCell.style.width = newCellWidth + 'px';
                    newCell.style.minWidth = newCell.style.width;
                    newCell.style.maxWidth = newCell.style.width;
                    newCell.style.height = RULERHEIGHT + 'px';
                    newCell.style.minHeight = newCell.style.height;
                    newCell.style.maxHeight = newCell.style.height;

                    noteValues.splice(history[0][0] + i, 0, history[i][1]);
                    newCell.innerHTML = calcNoteValueToDisplay(history[i][1], 1, this._cellScale);

                    this.__addCellEventHandlers(newCell, newCellWidth, history[i][1]);
                }

                this.Rulers[lastRuler][0] = noteValues;
            } else {
                console.log('empty history encountered... skipping undo');
            }
        } else if (obj[0] === 'rest') {
            var newCellIndex = last(divisionHistory);
            var cell = ruler.cells[newCellIndex];
            this.__toggleRestState(cell, false);
            divisionHistory.pop();
        }

        divisionHistory.pop();
        this._calculateZebraStripes(lastRuler);

        this._piemenuRuler(this._rulerSelected);
    };

    this._tap = function () {
        this._tapMode = true;
        var iconSize = ICONSIZE;
        this._tapButton.innerHTML = '&nbsp;&nbsp;<img src="header-icons/tap-active-button.svg" title="' + _('tap a rhythm') + '" alt="' + _('tap a rhythm') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
    };

    this._clear = function () {
        for (r = 0; r < this.Rulers.length; r++) {
            this._rulerSelected = r;
            while(this.Rulers[r][1].length > 0) {
                this._undo();
            }
        }

        this._piemenuRuler(this._rulerSelected);
    };

    this.__pause = function () {
        var iconSize = ICONSIZE;
        this._playAllCell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play all') + '" alt="' + _('play all') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        this._playing = false;
        this._playingAll = false;
        this._playingOne = false;
        this._rulerPlaying = -1;
        this._startingTime = null;
        for (var i = 0; i < this.Rulers.length; i++) {
            this._calculateZebraStripes(i);
        }
    };

    this.playAll = function () {
        // External call from run button.
        if (this._playing) {
            if (this._playingAll) {
                this.__pause();
                // Wait for pause to complete before restarting.
                this._playingAll = true;
                var that = this;
                setTimeout(function () {
                    that.__resume();
                }, 1000);
            }
        } else if (!this._playingAll) {
            this.__resume();
        }
    };

    this.__resume = function () {
        var iconSize = ICONSIZE;
        this._playAllCell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        this._logo.setTurtleDelay(0);
        this._playingAll = true;
        this._playing = true;
        this._playingOne = false;
        this._cellCounter = 0;
        this._rulerPlaying = -1;
        for (var i = 0; i < this.Rulers.length; i++) {
            this._elapsedTimes[i] = 0;
            this._offsets[i] = 0;
        }

        this._playAll();
    };

    this._playAll = function () {
        this._logo.synth.stop();
        this._logo.resetSynth(0);
        if (this._startingTime == null) {
            var d = new Date();
            this._startingTime = d.getTime();
            for (var i = 0; i < this.Rulers.length; i++) {
                this._offsets[i] = 0;
                this._elapsedTimes[i] = 0;
            }
        }

        for (var i = 0; i < this.Rulers.length; i++) {
            this.__loop(0, i, 0);
        }
    };

    this._playOne = function () {
        this._logo.synth.stop();
        this._logo.resetSynth(0);
        if (this._startingTime == null) {
            var d = new Date();
            this._startingTime = d.getTime();
            this._elapsedTimes[this._rulerSelected] = 0;
            this._offsets[this._rulerSelected] = 0;
        }

        this.__loop(0, this._rulerSelected, 0);
    };

    this.__loop = function(noteTime, rulerNo, colIndex) {
        if (docById('rulerDiv').style.visibility === 'hidden' || docById('rulerButtonsDiv').style.visibility === 'hidden' || docById('rulerTableDiv').style.visibility === 'hidden') {
            return;
        }

        var ruler = docById('ruler' + rulerNo);
        if (ruler == null) {
            console.log('Cannot find ruler ' + rulerNo + '. Widget closed?');
            return;
        }

        // Refresh the divisions each time we cycle.
        if (colIndex === 0) {
            this._calculateZebraStripes(rulerNo);
        }

        var cell = ruler.cells[colIndex];
        var noteValues = this.Rulers[rulerNo][0];
        var noteValue = noteValues[colIndex];

        noteTime = Math.abs(1 / noteValue);
        if (this.Drums[rulerNo] === null) {
            var drum = 'snare drum';
        } else {
            var drumblockno = this._logo.blocks.blockList[this.Drums[rulerNo]].connections[1];
            var drum = this._logo.blocks.blockList[drumblockno].value;
        }

        var foundDrum = false;
        // Convert i18n drum name to English.
        for (var d = 0; d < DRUMNAMES.length; d++) {
            if (DRUMNAMES[d][0].replace('-', ' ') === drum) {
                drum = DRUMNAMES[d][1];
                foundDrum = true;
                break;
            }
        }

        var foundVoice = false;
        if (!foundDrum) {
            for (var d = 0; d < VOICENAMES.length; d++) {
                if (VOICENAMES[d][0] === drum) {
                    drum = VOICENAMES[d][1];
                    foundVoice = true;
                    break;
                }
            }
        }

        var that = this;

        if (that._playing) {
            // Play the current note.
            if (noteValue > 0) {
                if (foundDrum) {
                    that._logo.synth.trigger(0, ['C4'], that._logo.defaultBPMFactor / noteValue, drum, null, null);
                } else if (foundVoice) {
                    that._logo.synth.trigger(0, 'C4', that._logo.defaultBPMFactor / noteValue, drum, null, null, false);
                }                
            }

            // And highlight its cell.
            cell.style.backgroundColor = MATRIXBUTTONCOLOR;

            // Calculate any offset in playback.
            var d = new Date();
            that._offsets[rulerNo] = d.getTime() - that._startingTime - that._elapsedTimes[rulerNo];
        }

        setTimeout(function () {
            colIndex += 1;
            if (colIndex === noteValues.length) {
                colIndex = 0;
            }

            if (that._playing) {
                that.__loop(noteTime, rulerNo, colIndex);
            }
        }, this._logo.defaultBPMFactor * 1000 * noteTime - this._offsets[rulerNo]);

        this._elapsedTimes[rulerNo] += this._logo.defaultBPMFactor * 1000 * noteTime;
    };

    this._save = function(selectedRuler) {
        // Deprecated -- replaced by save tuplets code
        var that = this;
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        setTimeout(function () {
            var ruler = docById('ruler' + selectedRuler);
            var noteValues = that.Rulers[selectedRuler][0];
            // Get the first word of drum's name (ignore the word 'drum' itself)
            // and add 'rhythm'.
            if (that.Drums[selectedRuler] === null) {
                var stack_value = _('snare drum') + ' ' + _('rhythm');
            } else {
                var stack_value = (that._logo.blocks.blockList[that._logo.blocks.blockList[that.Drums[selectedRuler]].connections[1]].value).split(' ')[0] + ' ' + _('rhythm');
            }
            var delta = selectedRuler * 42;
            var newStack = [[0, ['action', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, 2, null]], [1, ['text', {'value': stack_value}], 0, 0, [0]]];
            var previousBlock = 0;
            var sameNoteValue = 1;
            for (var i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    var idx = newStack.length;
                    var noteValue = noteValues[i];

                    var obj = rationalToFraction(1 / Math.abs(noteValue));

                    newStack.push([idx, 'rhythm2', 0, 0, [previousBlock, idx + 1, idx + 2, idx + 5]]);
                    newStack.push([idx + 1, ['number', {'value': sameNoteValue}], 0, 0, [idx]]);
                    newStack.push([idx + 2, 'divide', 0, 0, [idx, idx + 3, idx + 4]]);
                    newStack.push([idx + 3, ['number', {'value': obj[0]}], 0, 0, [idx + 2]]);
                    newStack.push([idx + 4, ['number', {'value': obj[1]}], 0, 0, [idx + 2]]);
                    newStack.push([idx + 5, 'vspace', 0, 0, [idx, idx + 6]]);
                    if (i == ruler.cells.length - 1) {
                        newStack.push([idx + 6, 'hidden', 0, 0, [idx + 5, null]]);
                    } else {
                        newStack.push([idx + 6, 'hidden', 0, 0, [idx + 5, idx + 7]]);
                    }

                    previousBlock = idx + 6;
                    sameNoteValue = 1;
                }
            }

            that._logo.blocks.loadNewBlocks(newStack);
            if (selectedRuler > that.Rulers.length - 2) {
                return;
            } else {
                that._save(selectedRuler + 1);
            }
        }, 500);
    };

    this._saveTuplets = function(selectedRuler) {
        var that = this;
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        setTimeout( function() {
            var ruler = docById('ruler' + selectedRuler);
            var noteValues = that.Rulers[selectedRuler][0];
            if (that.Drums[selectedRuler] === null) {
                var stack_value = _('snare drum') + ' ' + _('rhythm');
            } else {
                var stack_value = (that._logo.blocks.blockList[that._logo.blocks.blockList[that.Drums[selectedRuler]].connections[1]].value).split(' ')[0] + ' ' + _('rhythm');
            }
            var delta = selectedRuler * 42;
            var newStack = [[0, ['action', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, 2, null]], [1, ['text', {'value': stack_value}], 0, 0, [0]]];
            var previousBlock = 0;
            var sameNoteValue = 1;
            for (var i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    var idx = newStack.length;
                    var noteValue = noteValues[i];
                    var obj = rationalToFraction(1 / Math.abs(noteValue));
                    var n = obj[1]/sameNoteValue ;
                    if (Number.isInteger(n)) {
                        newStack.push([idx, 'stuplet', 0, 0, [previousBlock, idx + 1, idx + 2, idx + 5]]);
                        newStack.push([idx + 1, ['number', {'value': sameNoteValue}], 0, 0, [idx]]);
                        newStack.push([idx + 2, 'divide', 0, 0, [idx, idx + 3, idx + 4]]);
                        newStack.push([idx + 3, ['number', {'value': obj[0]}], 0, 0, [idx + 2]]);
                        newStack.push([idx + 4, ['number', {'value': n}], 0, 0, [idx + 2]]);
                        newStack.push([idx + 5, 'vspace', 0, 0, [idx, idx + 6]]);
                    } else {
                        newStack.push([idx, 'rhythm2', 0, 0, [previousBlock, idx + 1, idx + 2, idx + 5]]);
                        newStack.push([idx + 1, ['number', {'value': sameNoteValue}], 0, 0, [idx]]);
                        newStack.push([idx + 2, 'divide', 0, 0, [idx, idx + 3, idx + 4]]);
                        newStack.push([idx + 3, ['number', {'value': obj[0]}], 0, 0, [idx + 2]]);
                        newStack.push([idx + 4, ['number', {'value': obj[1]}], 0, 0, [idx + 2]]);
                        newStack.push([idx + 5, 'vspace', 0, 0, [idx, idx + 6]]);
                    }
                    
                    if (i == ruler.cells.length - 1) {
                        newStack.push([idx + 6, 'hidden', 0, 0, [idx + 5, null]]);
                    } else {
                        newStack.push([idx + 6, 'hidden', 0, 0, [idx + 5, idx + 7]]);
                    }
                    previousBlock = idx + 6;
                    sameNoteValue = 1;
                }
            }

            that._logo.blocks.loadNewBlocks(newStack);
            if (selectedRuler > that.Rulers.length - 2) {
                return;
            } else {
                that._saveTuplets(selectedRuler + 1);
            }
        }, 500);
    };

    this._saveMachine = function(selectedRuler) {
        // We are either saving a drum machine or a voice machine.
        if (this.Drums[selectedRuler] === null) {
            var drum = 'snare drum';
        } else {
            var drumBlockNo = this._logo.blocks.blockList[this.Drums[selectedRuler]].connections[1];
            var drum = this._logo.blocks.blockList[drumBlockNo].value;
        }

        for (var d = 0; d < DRUMNAMES.length; d++) {
            if (DRUMNAMES[d][1] === drum) {
                this._saveDrumMachine(selectedRuler, drum);
                return;
            }
        }

        for (var d = 0; d < VOICENAMES.length; d++) {
            if (VOICENAMES[d][1] === drum) {
                this._saveVoiceMachine(selectedRuler, drum);
                return;
            }
        }
    };

    this._saveDrumMachine = function(selectedRuler, drum) {
        var that = this;
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        setTimeout(function () {
            var ruler = docById('ruler' + selectedRuler);
            var noteValues = that.Rulers[selectedRuler][0];
            var delta = selectedRuler * 42;

            // Just save the action, not the drum machine itself.
            // var newStack = [[0, ['start', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, null]]];
            // newStack.push([1, 'forever', 0, 0, [0, 2, null]]);
            if (that.Drums[selectedRuler] === null) {
                var action_name = _('snare drum') + ' ' + _('action');
            } else {
                var action_name = (that._logo.blocks.blockList[that._logo.blocks.blockList[that.Drums[selectedRuler]].connections[1]].value).split(' ')[0] + ' ' + _('action');
            }

            var newStack = [[0, ['action', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, 2, null]], [1, ['text', {'value': action_name}], 0, 0, [0]]];
            var previousBlock = 0; // 1
            var sameNoteValue = 1;
            for (var i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    var idx = newStack.length;
                    var noteValue = noteValues[i];

                    var obj = rationalToFraction(1 / Math.abs(noteValue));

                    if (sameNoteValue === 1) {
                        // Add a note block.
                        newStack.push([idx, 'newnote', 0, 0, [previousBlock, idx + 1, idx + 4, idx + 7]]);
                        newStack.push([idx + 1, 'divide', 0, 0, [idx, idx + 2, idx + 3]]);
                        newStack.push([idx + 2, ['number', {'value': obj[0]}], 0, 0, [idx + 1]]);
                        if (noteValue < 0) {
                            newStack.push([idx + 3, ['number', {'value': obj[1]}], 0, 0, [idx + 1]]);
                            newStack.push([idx + 4, 'vspace', 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, 'rest2', 0, 0, [idx + 4, idx + 6]]);
                            newStack.push([idx + 6, 'hidden', 0, 0, [idx + 5, null]]);
                        } else {
                            newStack.push([idx + 3, ['number', {'value': obj[1]}], 0, 0, [idx + 1]]);
                            newStack.push([idx + 4, 'vspace', 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, 'playdrum', 0, 0, [idx + 4, idx + 6, null]]);
                            newStack.push([idx + 6, ['drumname', {'value': drum}], 0, 0, [idx + 5]]);
                        }
                        if (i == ruler.cells.length - 1) {
                            newStack.push([idx + 7, 'hidden', 0, 0, [idx, null]]);
                        } else {
                            newStack.push([idx + 7, 'hidden', 0, 0, [idx, idx + 8]]);
                            previousBlock = idx + 7;
                        }
                    } else {
                        // Add a note block inside a repeat block.
                        if (i == ruler.cells.length - 1) {
                            newStack.push([idx, 'repeat', 0, 0, [previousBlock, idx + 1, idx + 2, null]]);
                        } else {
                            newStack.push([idx, 'repeat', 0, 0, [previousBlock, idx + 1, idx + 2, idx + 10]]);
                            previousBlock = idx;
                        }
                        newStack.push([idx + 1, ['number', {'value': sameNoteValue}], 0, 0, [idx]]);
                        newStack.push([idx + 2, 'newnote', 0, 0, [idx, idx + 3, idx + 6, idx + 9]]);
                        newStack.push([idx + 3, 'divide', 0, 0, [idx + 2, idx + 4, idx + 5]]);
                        newStack.push([idx + 4, ['number', {'value': 1}], 0, 0, [idx + 3]]);
                        if (noteValue < 0) {
                            newStack.push([idx + 5, ['number', {'value': -noteValue}], 0, 0, [idx + 3]]);
                            newStack.push([idx + 6, 'vspace', 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, 'rest2', 0, 0, [idx + 6, idx + 8]]);
                            newStack.push([idx + 8, 'hidden', 0, 0, [idx + 7, null]]);
                        } else {
                            newStack.push([idx + 5, ['number', {'value': noteValue}], 0, 0, [idx + 3]]);
                            newStack.push([idx + 6, 'vspace', 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, 'playdrum', 0, 0, [idx + 6, idx + 8, null]]);
                            newStack.push([idx + 8, ['drumname', {'value': drum}], 0, 0, [idx + 7]]);
                        }
                        newStack.push([idx + 9, 'hidden', 0, 0, [idx + 2, null]]);
                    }

                    sameNoteValue = 1;
                }
            }

            that._logo.blocks.loadNewBlocks(newStack);
            if (selectedRuler > that.Rulers.length - 2) {
                return;
            } else {
                that._saveMachine(selectedRuler + 1);
            }
        }, 500);
    };

    this._saveVoiceMachine = function(selectedRuler, voice) {
        var that = this;
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        setTimeout(function () {
            var ruler = docById('ruler' + selectedRuler);
            var noteValues = that.Rulers[selectedRuler][0];
            var delta = selectedRuler * 42;

            // Just save the action, not the drum machine itself.
            // var newStack = [[0, ['start', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, null]]];
            // newStack.push([1, 'settimbre', 0, 0, [0, 2, 4, 3]]);
            // newStack.push([2, ['voicename', {'value': voice}], 0, 0, [1]]);
            // newStack.push([3, 'hidden', 0, 0, [1, null]]);
            // newStack.push([4, 'forever', 0, 0, [1, 6, 5]]);
            // newStack.push([5, 'hidden', 0, 0, [4, null]]);

            // This should never happen.
            if (that.Drums[selectedRuler] === null) {
                var action_name = _('guitar') + ' ' + _('action');
            } else {
                var action_name = (that._logo.blocks.blockList[that._logo.blocks.blockList[that.Drums[selectedRuler]].connections[1]].value).split(' ')[0] + '_' + _('action');
            }

            var newStack = [[0, ['action', {'collapsed': false}], 100 + delta, 100 + delta, [null, 1, 2, null]], [1, ['text', {'value': action_name}], 0, 0, [0]]];
            newStack.push([2, 'settimbre', 0, 0, [0, 3, 5, 4]]);
            newStack.push([3, ['voicename', {'value': voice}], 0, 0, [2]]);
            newStack.push([4, 'hidden', 0, 0, [2, null]]);
            var previousBlock = 2;
            var sameNoteValue = 1;
            for (var i = 0; i < ruler.cells.length; i++) {
                if (noteValues[i] === noteValues[i + 1] && i < ruler.cells.length - 1) {
                    sameNoteValue += 1;
                    continue;
                } else {
                    var idx = newStack.length;
                    var noteValue = noteValues[i];

                    var obj = rationalToFraction(1 / Math.abs(noteValue));

                    if (sameNoteValue === 1) {
                        // Add a note block.
                        if (noteValue < 0) {
                            newStack.push([idx, 'newnote', 0, 0, [previousBlock, idx + 1, idx + 4, idx + 7]]);
                            newStack.push([idx + 1, 'divide', 0, 0, [idx, idx + 2, idx + 3]]);
                            newStack.push([idx + 2, ['number', {'value': obj[0]}], 0, 0, [idx + 1]]);
                            newStack.push([idx + 3, ['number', {'value': obj[1]}], 0, 0, [idx + 1]]);
                            newStack.push([idx + 4, 'vspace', 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, 'rest2', 0, 0, [idx + 4, idx + 6]]);
                            newStack.push([idx + 6, 'hidden', 0, 0, [idx + 5, null]]);
                            if (i == ruler.cells.length - 1) {
                                newStack.push([idx + 7, 'hidden', 0, 0, [idx, null]]);
                            } else {
                                newStack.push([idx + 7, 'hidden', 0, 0, [idx, idx + 8]]);
                                previousBlock = idx + 7;
                            }
                        } else {
                            newStack.push([idx, 'newnote', 0, 0, [previousBlock, idx + 1, idx + 4, idx + 8]]);
                            newStack.push([idx + 1, 'divide', 0, 0, [idx, idx + 2, idx + 3]]);
                            newStack.push([idx + 2, ['number', {'value': obj[0]}], 0, 0, [idx + 1]]);
                            newStack.push([idx + 3, ['number', {'value': obj[1]}], 0, 0, [idx + 1]]);
                            newStack.push([idx + 4, 'vspace', 0, 0, [idx, idx + 5]]);
                            newStack.push([idx + 5, 'pitch', 0, 0, [idx + 4, idx + 6, idx + 7, null]]);
                            newStack.push([idx + 6, ['notename', {'value': 'C'}], 0, 0, [idx + 5]]);
                            newStack.push([idx + 7, ['number', {'value': 4}], 0, 0, [idx + 5]]);
                            if (i == ruler.cells.length - 1) {
                                newStack.push([idx + 8, 'hidden', 0, 0, [idx, null]]);
                            } else {
                                newStack.push([idx + 8, 'hidden', 0, 0, [idx, idx + 9]]);
                                previousBlock = idx + 8;
                            }
                        }
                    } else {
                        // Add a note block inside a repeat block.
                        if (i == ruler.cells.length - 1) {
                            newStack.push([idx, 'repeat', 0, 0, [previousBlock, idx + 1, idx + 2, null]]);
                        } else {
                            newStack.push([idx, 'repeat', 0, 0, [previousBlock, idx + 1, idx + 2, idx + 11]]);
                            previousBlock = idx;
                        }
                        newStack.push([idx + 1, ['number', {'value': sameNoteValue}], 0, 0, [idx]]);
                        if (noteValue < 0) {
                            newStack.push([idx + 2, 'newnote', 0, 0, [idx, idx + 3, idx + 6, idx + 9]]);
                            newStack.push([idx + 3, 'divide', 0, 0, [idx + 2, idx + 4, idx + 5]]);
                            newStack.push([idx + 4, ['number', {'value': 1}], 0, 0, [idx + 3]]);
                            newStack.push([idx + 5, ['number', {'value': -noteValue}], 0, 0, [idx + 3]]);
                            newStack.push([idx + 6, 'vspace', 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, 'rest2', 0, 0, [idx + 6, idx + 8]]);
                            newStack.push([idx + 8, 'hidden', 0, 0, [idx + 7, null]]);
                            newStack.push([idx + 9, 'hidden', 0, 0, [idx + 2, null]]);
                        } else {
                            newStack.push([idx + 2, 'newnote', 0, 0, [idx, idx + 3, idx + 6, idx + 10]]);
                            newStack.push([idx + 3, 'divide', 0, 0, [idx + 2, idx + 4, idx + 5]]);
                            newStack.push([idx + 4, ['number', {'value': 1}], 0, 0, [idx + 3]]);
                            newStack.push([idx + 5, ['number', {'value': noteValue}], 0, 0, [idx + 3]]);
                            newStack.push([idx + 6, 'vspace', 0, 0, [idx + 2, idx + 7]]);
                            newStack.push([idx + 7, 'pitch', 0, 0, [idx + 6, idx + 8, idx + 9, null]]);
                            newStack.push([idx + 8, ['notename', {'value': 'C'}], 0, 0, [idx + 7]]);
                            newStack.push([idx + 9, ['number', {'value': 4}], 0, 0, [idx + 7]]);
                            newStack.push([idx + 10, 'hidden', 0, 0, [idx + 2, null]]);
                        }
                    }

                    sameNoteValue = 1;
                }
            }

            that._logo.blocks.loadNewBlocks(newStack);
            if (selectedRuler > that.Rulers.length - 2) {
                return;
            } else {
                that._saveMachine(selectedRuler + 1);
            }
        }, 500);
    };

    this.init = function (logo) {
        console.log('init RhythmRuler');
        this._logo = logo;

        this._bpmFactor = 1000 * TONEBPM / this._logo._masterBPM;

        this._playing = false;
        this._playingOne = false;
        this._playingAll = false;
        this._rulerPlaying = -1;
        this._startingTime = null;

        // If there are no drums, add one.
        if (this.Drums.length === 0) {
            this.Drums.push(null);
            this.Rulers.push([[1], []]);
        }

        this._elapsedTimes = [];
        this._offsets = [];
        for (var i = 0; i < this.Rulers.length; i++) {
            this._elapsedTimes.push(0);
            this._offsets.push(0);
        }

        var w = window.innerWidth;
        this._cellScale = 1.0;
        var iconSize = ICONSIZE;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var rulerDiv = docById('rulerDiv');
        rulerDiv.style.visibility = 'visible';
        rulerDiv.setAttribute('draggable', 'true');
        this._left = 200;
        this._top = 150;
        rulerDiv.style.left = this._left + 'px';
        rulerDiv.style.top = this._top + 'px';

        // The widget buttons
        var widgetButtonsDiv = docById('rulerButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table id="widgetButtonTable"></table>';

        var buttonTable = docById('widgetButtonTable');
        // buttonTable.style.
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        this._playAllCell = this._addButton(row, 'play-button.svg', iconSize, _('play all'), '');

        this._playAllCell.onclick = function () {
            if (that._playing) {
                that.__pause();
            }
            else if (!that._playingAll) {
                that.__resume();
            }
        };

        var cell = this._addButton(row, 'export-chunk.svg', iconSize, _('save rhythms'), '');
        cell.onclick = function () {
            // that._save(0);
            that._saveTuplets(0);
        };

        var cell = this._addButton(row, 'export-drums.svg', iconSize, _('save drum machine'), '');
        cell.onclick = function () {
            that._saveMachine(0);
        };

        // An input for setting the dissect number
        var cell = row.insertCell();
        cell.innerHTML = '<input id="dissectNumber" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="dissectNumber" type="dissectNumber" value="' + 2 + '" />';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        var numberInput = docById('dissectNumber');

        numberInput.onfocus = function (event) {
            that._piemenuNumber(['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'], numberInput.value);
        };

        numberInput.onkeydown = function (event) {
            if (event.keyCode === DEL) {
                numberInput.value = numberInput.value.substring(0, numberInput.value.length - 1);
            }   
        };

        numberInput.oninput = function (event) {
            // Put a limit on the size (2 <--> 128).
            numberInput.onmouseout = function(){
                if (numberInput.value < 2) {
                    numberInput.value = 2;
                } 
            };

            if (numberInput.value > 128) {
                numberInput.value = 128;
            }
        };

        var cell = this._addButton(row, 'restore-button.svg', iconSize, _('undo'), '');
        cell.onclick = function () {
            that._undo();
        };

        //.TRANS: user can tap out a rhythm by clicking on a ruler.
        this._tapButton = this._addButton(row, 'tap-button.svg', iconSize, _('tap a rhythm'), '');
        this._tapButton.onclick = function () {
            that._tap();
        };

        //.TRANS: clear all subdivisions from the ruler.
        var cell = this._addButton(row, 'erase-button.svg', iconSize, _('clear'), '');
        cell.onclick = function () {
            that._clear();
        };

        var cell = this._addButton(row, 'close-button.svg', iconSize, _('close'), '');

        cell.onclick = function () {
            // If the piemenu was open, close it.
            docById('wheelDiv').style.display = 'none';
            docById('contextWheelDiv').style.display = 'none';

            // Save the new dissect history.
            var dissectHistory = [];
            var drums = [];
            for (var i = 0; i < that.Rulers.length; i++) {
                if (that.Drums[i] === null) {
                    continue;
                }

                var history = [];
                for (var j = 0; j < that.Rulers[i][1].length; j++) {
                    history.push(that.Rulers[i][1][j]);
                }

                docById('dissectNumber').classList.add('hasKeyboard');
                dissectHistory.push([history, that.Drums[i]]);
                drums.push(that.Drums[i]);
            }

            // Look for any old entries that we may have missed.
            for (var i = 0; i < that._dissectHistory.length; i++) {
                var drum = that._dissectHistory[i][1];
                if (drums.indexOf(drum) === -1) {
                    var history = JSON.parse(JSON.stringify(that._dissectHistory[i][0]));
                    dissectHistory.push([history, drum]);
                }
            }

            that._dissectHistory = JSON.parse(JSON.stringify(dissectHistory));

            rulerTableDiv.style.visibility = 'hidden';
            widgetButtonsDiv.style.visibility = 'hidden';
            rulerDiv.style.visibility = 'hidden';

            that._playing = false;
            that._playingOne = false;
            that._playingAll = false;
            that._logo.hideMsgs();
        };

        // We use this cell as a handle for dragging.
        var dragCell = this._addButton(row, 'grab.svg', iconSize, _('drag'), '');

        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - rulerDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - rulerDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function (e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
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
                that._left = e.clientX - that._dx;
                that._top = e.clientY - that._dy;
                rulerDiv.style.left = that._left + 'px';
                rulerDiv.style.top = that._top + 'px';
                dragCell.innerHTML = that._dragCellHTML;

                that._positionWheel();
            }
        };

        rulerDiv.ondragover = function (e) {
            e.preventDefault();
        };

        rulerDiv.ondrop = function (e) {
            if (that._dragging) {
                that._dragging = false;
                that._left = e.clientX - that._dx;
                that._top = e.clientY - that._dy;
                rulerDiv.style.left = that._left + 'px';
                rulerDiv.style.top = that._top + 'px';
                dragCell.innerHTML = that._dragCellHTML;

                that._positionWheel();
            }
        };

        rulerDiv.onmousedown = function (e) {
            that._dragging = true;
            that._target = e.target;
        };

        rulerDiv.ondragstart = function (e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The ruler table
        var rulerTableDiv = docById('rulerTableDiv');
        rulerTableDiv.style.display = 'inline';
        rulerTableDiv.style.visibility = 'visible';
        rulerTableDiv.style.border = '2px';
        rulerTableDiv.innerHTML = '';

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        rulerTableDiv.innerHTML = '<div id="rulerOuterDiv"><div id="rulerInnerDiv"><table id="rhythmRulerTable"></table></div></div>';

        var n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 2);
        var outerDiv = docById('rulerOuterDiv');
        if (this.Rulers.length > n) {
            outerDiv.style.height = 85 * n + 'px';
            var w = Math.max(Math.min(window.innerWidth, OUTERWINDOWWIDTH), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 25 + 'px';  // Add a bit of extra space for the horizontal slider.
        } else {
            outerDiv.style.height = 85 * this.Rulers.length + 'px';
            var w = Math.max(Math.min(window.innerWidth, OUTERWINDOWWIDTH - 20), BUTTONDIVWIDTH);
            outerDiv.style.width = w + 25 + 'px';  // Add a bit of extra space for the horizontal slider.
        }

        var w = Math.max(Math.min(window.innerWidth, INNERWINDOWWIDTH), BUTTONDIVWIDTH - BUTTONSIZE);
        docById('rulerInnerDiv').style.width = w + 'px';

        // Each row in the ruler table contains a play button in the
        // first column and a ruler table in the second column.
        var rhythmRulerTable = docById('rhythmRulerTable');
        for (var i = 0; i < this.Rulers.length; i++) {
            var rhythmRulerTableRow = rhythmRulerTable.insertRow();
            var drumcell = this._addButton(rhythmRulerTableRow, 'play-button.svg', iconSize, _('play'), '<br>');
            drumcell.setAttribute('id', i);
            drumcell.className = 'headcol';  // Position fixed when scrolling horizontally

            drumcell.onclick = function () {
                var id = Number(this.getAttribute('id'));
                if (that._playing) {
                    if (that._rulerPlaying === id) {
                        this.innerHTML = '<br>&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('play') + '" alt="' + _('play') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                        that._playing = false;
                        that._playingOne = false;
                        that._playingAll = false;
                        that._rulerPlaying = -1;
                        that._startingTime = null;
                        that._elapsedTimes[id] = 0;
                        that._offsets[id] = 0;
                        setTimeout(that._calculateZebraStripes(id), 1000);
                    }
                }
                else {
                    if (that._playingOne === false) {
                        that._rulerSelected = id;
                        that._logo.setTurtleDelay(0);
                        that._playing = true;
                        that._playingOne = true;
                        that._playingAll = false;
                        that._cellCounter = 0;
                        that._startingTime = null;
                        that._rulerPlaying = id;
                        this.innerHTML = '<br>&nbsp;&nbsp;<img src="header-icons/pause-button.svg" title="' + _('pause') + '" alt="' + _('pause') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
                        that._elapsedTimes[id] = 0;
                        that._offsets[id] = 0;
                        that._playOne();
                    }
                }
            };

            var rulerCell = rhythmRulerTableRow.insertCell();
            // Create individual rulers as tables.
            rulerCell.innerHTML = '<table id="rulerCellTable' + i + '"></table>';

            var rulerCellTable = docById('rulerCellTable' + i);
            rulerCellTable.style.textAlign = 'center';
            rulerCellTable.style.border = '0px';
            rulerCellTable.style.borderCollapse = 'collapse';
            rulerCellTable.cellSpacing = '0px';
            rulerCellTable.cellPadding = '0px';
            var rulerRow = rulerCellTable.insertRow();
            rulerRow.setAttribute('id', 'ruler' + i);
            for (var j = 0; j < this.Rulers[i][0].length; j++) {
                var noteValue = this.Rulers[i][0][j];
                var rulerSubCell = rulerRow.insertCell(-1);
                rulerSubCell.innerHTML = calcNoteValueToDisplay(noteValue, 1, this._cellScale);
                rulerSubCell.style.height = RULERHEIGHT + 'px';
                rulerSubCell.style.minHeight = rulerSubCell.style.height;
                rulerSubCell.style.maxHeight = rulerSubCell.style.height;
                rulerSubCell.style.width = this._noteWidth(noteValue) + 'px';
                rulerSubCell.style.minWidth = rulerSubCell.style.width;
                rulerSubCell.style.maxWidth = rulerSubCell.style.width;
                rulerSubCell.style.border = '0px';
                rulerSubCell.border = '0px';
                rulerSubCell.padding = '0px';
                rulerSubCell.style.padding = '0px';
                rulerSubCell.style.lineHeight = 60 + ' % ';
                if (i % 2 === 0) {
                    if (j % 2 === 0) {
                        rulerSubCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    } else {
                        rulerSubCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    }
                } else {
                    if (j % 2 === 0) {
                        rulerSubCell.style.backgroundColor = MATRIXNOTECELLCOLORHOVER;
                    } else {
                        rulerSubCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
                    }
                }

                this.__addCellEventHandlers(rulerSubCell, this._noteWidth(noteValue), noteValue);
            }

            // Match the play button height to the ruler height.
            rhythmRulerTableRow.cells[0].style.width = BUTTONSIZE + 'px';
            rhythmRulerTableRow.cells[0].style.minWidth = BUTTONSIZE + 'px';
            rhythmRulerTableRow.cells[0].style.maxWidth = BUTTONSIZE + 'px';
            rhythmRulerTableRow.cells[0].style.height = rulerRow.offsetHeight + 'px';
            rhythmRulerTableRow.cells[0].style.minHeight = rulerRow.offsetHeight + 'px';
            rhythmRulerTableRow.cells[0].style.maxHeight = rulerRow.offsetHeight + 'px';
            rhythmRulerTableRow.cells[0].style.verticalAlign = 'middle';
        }

        // Restore dissect history.
        for (var drum = 0; drum < this.Drums.length; drum++) {
            if (this.Drums[i] === null) {
                continue;
            }

            for (var i = 0; i < this._dissectHistory.length; i++) {
                if (this._dissectHistory[i][1] !== this.Drums[drum]) {
                    continue;
                }

                var rhythmRulerTableRow = docById('ruler' + drum);
                for (var j = 0; j < this._dissectHistory[i][0].length; j++) {
                    if (this._dissectHistory[i][0][j] == undefined) {
                        continue;
                    }

                    this._rulerSelected = drum;

                    if (typeof(this._dissectHistory[i][0][j]) === 'number') {
                        var cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j]];
                        this.__toggleRestState(cell, false);
                    } else if (typeof(this._dissectHistory[i][0][j][0]) === 'number') {
                        if (typeof(this._dissectHistory[i][0][j][1]) === 'number') {
                            // dissect is [cell, num]
                            var cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j][0]];
                            if (cell != undefined) {
                                this.__dissectByNumber(cell, this._dissectHistory[i][0][j][1], false);
                            } else {
                                console.log('Could not find cell to divide. Did the order of the rhythm blocks change?');
                            }
                        } else {
                            // divide is [cell, [values]]
                            var cell = rhythmRulerTableRow.cells[this._dissectHistory[i][0][j][0]];
                            if (cell != undefined) {
                                this.__divideFromList(cell, this._dissectHistory[i][0][j][1], false);
                            }
                        }
                    } else {
                        // tie is [[cell, value], [cell, value]...]
                        var history = this._dissectHistory[i][0][j];
                        this._mouseDownCell = rhythmRulerTableRow.cells[history[0][0]];
                        this._mouseUpCell = rhythmRulerTableRow.cells[last(history)[0]];
                        if (this._mouseUpCell != undefined) {
                            this.__tie(false);
                        }

                        this._mouseDownCell = null;
                        this._mouseUpCell = null;
                    }
                }
            }
        }

        this._logo.textMsg(_('Click on the ruler to divide it.'));
        this._piemenuRuler(this._rulerSelected);
    };

    this._addButton = function(row, icon, iconSize, label, extras) {
        var cell = row.insertCell(-1);
        cell.innerHTML = extras + '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover = function () {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout = function () {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this._piemenuRuler = function (selectedRuler) {
	return;  // In progress
        // piemenu version of ruler
        docById('wheelDiv2').style.display = '';
        docById('wheelDiv2').style.position = 'absolute';
        docById('wheelDiv2').style.left = '600px';
        docById('wheelDiv2').style.top = '300px';

        if (selectedRuler === undefined) {
	    selectedRuler = 0;
	}

        if (this._wheel !== null) {
            this._wheel.removeWheel();
	}

        console.log(this.Rulers[selectedRuler]);
        this._wheel = new wheelnav('wheelDiv2', null, 600, 600);
	this._wheel.wheelRadius = 200;
	this._wheel.maxPercent = 1.6;
        this._wheel.colors = [MATRIXNOTECELLCOLOR, MATRIXNOTECELLCOLORHOVER];
	this._wheel.navItemsContinuous = true;
	this._wheel.markerPathFunction = markerPath().PieLineMarker;
	this._wheel.clickModeRotate = false;
	this._wheel.markerEnable = true;
	this._wheel.slicePathFunction = slicePath().DonutSlice;
	this._wheel.slicePathCustom = slicePath().DonutSliceCustomization();

        var labels = [];
        for (var i = 0; i < this.Rulers[selectedRuler][0].length; i++) {
            if (this.Rulers[selectedRuler][0][i] < 17 && this.Rulers[selectedRuler][0][i] > 0) {
		labels.push('1/' + this.Rulers[selectedRuler][0][i]);
	    } else {
		labels.push(' ');
	    }
	}

        console.log(labels);
	this._wheel.initWheel(labels);

        for (var i = 0; i < this.Rulers[selectedRuler][0].length; i++) {
	    this._wheel.navItems[i].sliceAngle = 360 / Math.abs(this.Rulers[selectedRuler][0][i]);
	}

	this._wheel.createWheel();
    };

    this._piemenuNumber = function (wheelValues, selectedValue) {
        // input form and  wheelNav pie menu for number selection
        docById('wheelDiv').style.display = '';

        // the number selector
        this._numberWheel = new wheelnav('wheelDiv', null, 600, 600);
        // exit button
        this._exitWheel = new wheelnav('_exitWheel', this._numberWheel.raphael);

        var wheelLabels = [];
        for (var i = 0; i < wheelValues.length; i++) {
            wheelLabels.push(wheelValues[i].toString());
        }

        // spacer
        wheelLabels.push(null);

        wheelnav.cssMode = true;

        this._numberWheel.keynavigateEnabled = true;

        this._numberWheel.colors = ['#ffb2bc', '#ffccd6'];
        this._numberWheel.slicePathFunction = slicePath().DonutSlice;
        this._numberWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._numberWheel.slicePathCustom.minRadiusPercent = 0.2;
        if (wheelValues.length > 16) {
            this._numberWheel.slicePathCustom.maxRadiusPercent = 1.0;
        } else {
            this._numberWheel.slicePathCustom.maxRadiusPercent = 0.6;
        }

        this._numberWheel.sliceSelectedPathCustom = this._numberWheel.slicePathCustom;
        this._numberWheel.sliceInitPathCustom = this._numberWheel.slicePathCustom;
        // this._numberWheel.titleRotateAngle = 0;
        this._numberWheel.animatetime = 300;
        this._numberWheel.createWheel(wheelLabels);

        this._exitWheel.colors = ['#808080', '#c0c0c0'];
        this._exitWheel.slicePathFunction = slicePath().DonutSlice;
        this._exitWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._exitWheel.slicePathCustom.minRadiusPercent = 0.0;
        this._exitWheel.slicePathCustom.maxRadiusPercent = 0.2;
        this._exitWheel.sliceSelectedPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.sliceInitPathCustom = this._exitWheel.slicePathCustom;
        this._exitWheel.clickModeRotate = false;
        this._exitWheel.createWheel(['x', ' ']);

        var that = this;

        var __selectionChanged = function () {
            var numberInput = docById('dissectNumber');
            numberInput.value = wheelValues[that._numberWheel.selectedNavItemIndex];
        };

        var __exitMenu = function () {
            var d = new Date();
            that._piemenuExitTime = d.getTime();
            docById('wheelDiv').style.display = 'none';
            that._numberWheel.removeWheel();
            that._exitWheel.removeWheel();
        };

        var numberInput = docById('dissectNumber');

        this._positionWheel();

        // Navigate to a the current number value.
        var i = wheelValues.indexOf(selectedValue);
        if (i === -1) {
            i = 0;
        }

        this._numberWheel.navigateWheel(i);

        // Hide the widget when the selection is made.
        for (var i = 0; i < wheelLabels.length; i++) {
            this._numberWheel.navItems[i].navigateFunction = function () {
                __selectionChanged();
                __exitMenu();
            };
        }

        // Or use the exit wheel...
        this._exitWheel.navItems[0].navigateFunction = function () {
            __exitMenu();
        };
    };

    this._positionWheel = function() {
        if (docById('wheelDiv').style.display == 'none') {
            return;
        }

        docById('wheelDiv').style.position = 'absolute';
        docById('wheelDiv').style.height = '300px';
        docById('wheelDiv').style.width = '300px';

        // Position the widget over the note block.
        var x = this._left + 100;
        var y = this._top;
        var selectorWidth = 150;

        docById('wheelDiv').style.left = Math.min(Math.max((x - (300 - selectorWidth) / 2), 0), this._logo.blocks.turtles._canvas.width - 300)  + 'px';        
        if (y - 300 < 0) {
            docById('wheelDiv').style.top = (y + 60) + 'px';
        } else {
            docById('wheelDiv').style.top = (y - 300) + 'px';
        }
    };


};
