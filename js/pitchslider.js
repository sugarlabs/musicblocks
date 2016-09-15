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

// This widget enable us to create pitches of different frequency varying
// from given frequency to nextoctave frequency(two times the given frequency)
// in continuous manner.

const SEMITONE = Math.pow(2, 1 / 12);

function PitchSlider () {
    this.Sliders = [];
    this._initialTop;
    this._focusedCellIndex = 0;
    this._isKeyPressed = 0;
    this._delta = 0;

    this._addButton = function(row, colIndex, icon, iconSize, label) {
        var cell = row.insertCell();
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
        cell.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.backgroundColor = MATRIXBUTTONCOLOR;

        cell.onmouseover = function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        }

        cell.onmouseout = function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        }

        return cell;
    };

    this._play = function (cell) {
        var cellIndex = cell.cellIndex;
        var frequency = this.Sliders[cellIndex][0] * Math.pow(SEMITONE, this.Sliders[cellIndex][1]);
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
        this.Sliders[cellIndex][1] += 1 * upordown;
        jQuery(cellDiv).css('top',jQuery(sliderDiv).position().top + w / 9 - divMoved - this.Sliders[cellIndex][1] * moveValue);
        var frequency = this.Sliders[cellIndex][0] * Math.pow(SEMITONE, this.Sliders[cellIndex][1]);

        if (frequency > nextoctavefrequency) {
            this.Sliders[cellIndex][1] = 0;
            var frequency = this.Sliders[cellIndex][0];
            jQuery(cellDiv).css('top',jQuery(sliderDiv).position().top + w / 9 - divMoved);
        }

        if (frequency < this.Sliders[cellIndex][0]) {
            this.Sliders[cellIndex][1] = 11;
            var frequency = nextoctavefrequency;
            jQuery(cellDiv).css('top',jQuery(sliderDiv).position().top + w / 9 - divMoved - 12 * moveValue);
        }

        frequencyDiv.innerHTML = frequency.toFixed(2);
        this._logo.synth.stop();
        this._play(sliderrow.cells[cellIndex]);
    };

    this._save = function (cell) {
        var that = this;
        var cellIndex = cell.cellIndex;
        var frequency = this.Sliders[cellIndex][0] * Math.pow(SEMITONE, this.Sliders[cellIndex][1]);

        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        var newStack = [[0, 'note', 100 + this._delta, 100 + this._delta, [null, 1, 2, null]], [1, ['number', {'value': 8}], 0, 0, [0]]];
        this._delta += 21;

        var endOfStackIdx = 0;
        var previousBlock = 0;

        var hertzIdx = newStack.length;
        var frequencyIdx = hertzIdx + 1;
        var hiddenIdx = hertzIdx + 2;
        newStack.push([hertzIdx, 'hertz', 0, 0, [previousBlock, frequencyIdx, hiddenIdx]]);
        newStack.push([frequencyIdx, ['number', {'value': frequency.toFixed(2)}], 0, 0, [hertzIdx]]);
        newStack.push([hiddenIdx, 'hidden', 0, 0, [hertzIdx, null]]);

        that._logo.blocks.loadNewBlocks(newStack);
    }

    this._addKeyboardInput = function (cell) {
        var that = this;
        cell.focus();

        cell.addEventListener('keydown', function(event) {
            that._isKeyPressed = 1;
            if (event.keyCode >= 37 && event.keyCode <= 40) {
                that._isKeyPressed = 1;
            }
        });

        cell.addEventListener('keyup', function(event) {
            if (that._isKeyPressed === 1) {
                that._isKeyPressed = 0;

                if (event.keyCode === 38) {
                    that._moveslider(cell, 1);
                }

                if (event.keyCode === 40) {
                    that._moveslider(cell, -1);
                }

                if (event.keyCode === 37) {
                    that._focusCell(cell, -1);
                }

                if (event.keyCode === 39) {
                    that._focusCell(cell, 1);
                }
            }
        });
    }

    this._focusCell = function (cell, RightOrLeft) {
        var that = this;
        var cellIndex = cell.cellIndex;
        var toBeFocused = cellIndex + RightOrLeft;

        if (toBeFocused < 0) {
            toBeFocused = this.Sliders.length - 1;
        }

        if (toBeFocused > this.Sliders.length - 1) {
            toBeFocused = 0;
        }

        cell.blur();
        var sliderrow = docById('slider');
        var newCell = sliderrow.cells[toBeFocused];
        this._addKeyboardInput(newCell);
    }

    this.init = function (logo) {
        this._logo = logo;
        var that = this;

        docById('pitchSliderDiv').style.display = 'inline';
        console.log('setting PitchSlider visible');
        docById('pitchSliderDiv').style.visibility = 'visible';
        docById('pitchSliderDiv').style.border = 2;

        docById('moveUpSliderDiv').style.display = 'inline';
        docById('moveUpSliderDiv').style.visibility = 'visible';
        docById('moveUpSliderDiv').style.border = 2;

        docById('moveDownSliderDiv').style.display = 'inline';
        docById('moveDownSliderDiv').style.visibility = 'visible';
        docById('moveDownSliderDiv').style.border = 2;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = Math.floor(this._cellScale * 24);

        jQuery('#pitchSliderDiv').css('top', '20%');
        jQuery('#moveUpSliderDiv').css('top', '66%');
        jQuery('#moveDownSliderDiv').css('top', '74%');
        this._initialTop = jQuery('#pitchSliderDiv').position().top;

        docById('pitchSliderDiv').style.width = Math.floor(SLIDERWIDTH * this._cellScale) * (this.Sliders.length + 1) + 'px';
        docById('pitchSliderDiv').style.overflowX = 'auto';
        docById('pitchSliderDiv').style.height = Math.floor(parseFloat(w) / 3.2) + 'px';
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

        var moveUpsliderDiv = docById('moveUpSliderDiv');
        moveUpsliderDiv.style.paddingTop = 0 + 'px';
        moveUpsliderDiv.style.paddingLeft = 0 + 'px';
        moveUpsliderDivPosition = moveUpsliderDiv.getBoundingClientRect();

        var moveDownsliderDiv = docById('moveDownSliderDiv');
        moveDownsliderDiv.style.paddingTop = 0 + 'px';
        moveDownsliderDiv.style.paddingLeft = 0 + 'px';
        moveDownsliderDivPosition = moveDownsliderDiv.getBoundingClientRect();

        var table = docById('buttonTable');
        var row = table.insertRow(0);
        row.style.left = Math.floor(sliderDivPosition.left) + 'px';
        row.style.top = Math.floor(sliderDivPosition.top) + 'px';

        var cell = this._addButton(row, -1, 'close-button.svg', iconSize, _('close'));

        cell.onclick = function() {
            docById('pitchSliderDiv').style.visibility = 'hidden';
            docById('moveUpSliderDiv').style.visibility = 'hidden';
            docById('moveDownSliderDiv').style.visibility = 'hidden';
        };

        cell.onmouseover = function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout = function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'pitchslider');
        x.style.textAlign = 'center';
        x.cellSpacing = this._cellScale * 5 + 'px';
        x.cellPadding = 0;
        sliderDiv.appendChild(x);

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'moveUppitch');
        x.style.textAlign = 'center';
        x.cellSpacing = this._cellScale * 5 + 'px';
        x.cellPadding = 0;
        moveUpsliderDiv.appendChild(x);

        var x = document.createElement('TABLE');
        x.setAttribute('id', 'moveDownpitch');
        x.style.textAlign = 'center';
        x.cellSpacing = this._cellScale * 5 + 'px';
        x.cellPadding = 0;
        moveDownsliderDiv.appendChild(x);

        var table = docById('pitchslider');
        var row = table.insertRow(0);
        row.style.left = Math.floor(sliderDivPosition.left) + 'px';
        row.style.top = Math.floor(sliderDivPosition.top) + 'px';
        row.setAttribute('id', 'slider');

        var table = docById('moveUppitch');
        var moveuprow = table.insertRow(0);
        moveuprow.style.left = Math.floor(moveUpsliderDivPosition.left) + 'px';
        moveuprow.style.top = Math.floor(moveUpsliderDivPosition.top) + 'px';
        moveuprow.setAttribute('id', 'moveUpslider');

        var table = docById('moveDownpitch');
        var movedownrow = table.insertRow(0);
        movedownrow.style.left = Math.floor(moveDownsliderDivPosition.left) + 'px';
        movedownrow.style.top = Math.floor(moveDownsliderDivPosition.top) + 'px';
        movedownrow.setAttribute('id', 'moveDownslider');

        for (var i = 0; i < this.Sliders.length; i++) {
            console.log(this.Sliders[i]);
            var cell = row.insertCell(i);
            cell.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
            cell.style.minWidth = cell.style.width;
            cell.style.maxWidth = cell.style.width;
            cell.style.height = Math.floor(SLIDERHEIGHT * this._cellScale) + 'px';
            cell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            cell.setAttribute('tabIndex', 1);

            var cellDiv = document.createElement('div');
            cellDiv.setAttribute('id', 'sliderInCell');
            cellDiv.setAttribute('position', 'absolute');
            cellDiv.style.height = Math.floor(w / 200) + 'px';
            cellDiv.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
            jQuery(cellDiv).css('top',jQuery(sliderDiv).position().top + w / 9);
            cellDiv.style.backgroundColor = MATRIXBUTTONCOLOR;
            cell.appendChild(cellDiv);
            var slider = document.createElement('P');
            slider.innerHTML = this.Sliders[i][0];
            cellDiv.appendChild(slider);

            cell.onmouseover = function() {
                that._addKeyboardInput(this);
            };

            cell.onmouseout = function() {
                this.blur();
            };

            cell.onmousemove = function() {
                var cellDiv = this.childNodes[0];
                var moveValue = parseFloat(Math.floor(SLIDERWIDTH * that._cellScale)) / 3;
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

                that.Sliders[cellIndex][1] = parseInt(Math.log2(parseFloat(that.Sliders[cellIndex][0] + frequencyOffSet) / that.Sliders[cellIndex][0]) * 12);
                that.Sliders[cellIndex][2] = frequencyOffSet - that.Sliders[cellIndex][0] * Math.pow(SEMITONE, that.Sliders[cellIndex][1]);

                var frequencyDiv = cellDiv.childNodes[0];
                var frequency = that.Sliders[cellIndex][0] * Math.pow(SEMITONE, that.Sliders[cellIndex][1]);
                frequencyDiv.innerHTML = frequency.toFixed(2);
                that._play(this);
            };

            cell.onclick = function() {
                that._save(this);
            };

            var moveupcell = moveuprow.insertCell(i);
            moveupcell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/up.svg" title="' + _('move up') + '" alt="' + _('move up') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            moveupcell.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
            moveupcell.style.minWidth = moveupcell.style.width;
            moveupcell.style.maxWidth = moveupcell.style.width;
            moveupcell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            moveupcell.style.backgroundColor = MATRIXBUTTONCOLOR;

            moveupcell.onclick = function() {
                that._moveslider(this, 1);
            };

            moveupcell.onmouseover = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            };

            moveupcell.onmouseout = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            };

            var movedowncell = movedownrow.insertCell(i);
            movedowncell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/down.svg" title="' + _('move down') + '" alt="' + _('move down') + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle">&nbsp;&nbsp;';
            movedowncell.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
            movedowncell.style.minWidth = movedowncell.style.width;
            movedowncell.style.maxWidth = movedowncell.style.width;
            movedowncell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
            movedowncell.style.backgroundColor = MATRIXBUTTONCOLOR;

            movedowncell.onclick = function() {
                that._moveslider(this, -1);
            };

            movedowncell.onmouseover = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            };

            movedowncell.onmouseout = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            };
        }
    };
};
