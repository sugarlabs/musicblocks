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

// This widget enable us to create pitches of different frequency varying
// from given frequency to nextoctave frequency(two times the given frequency)
// in continuous manner.

function PitchSlider() {
    const BUTTONDIVWIDTH = 118;  // 2 buttons (55 + 4) * 2
    const BUTTONSIZE = 51;
    const ICONSIZE = 32;
    const SEMITONE = Math.pow(2, 1 / 12);

    this.Sliders = [];
    this._focusedCellIndex = 0;
    this._isKeyPressed = 0;
    this._delta = 0;

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

    this._play = function (cell) {
        var cellIndex = cell.cellIndex;
        var frequency = this.Sliders[cellIndex][0] * Math.pow(SEMITONE, this.Sliders[cellIndex][1]);
        var obj = frequencyToPitch(frequency);
        var pitchnotes = [];
        var note = obj[0] + obj[1];
        pitchnotes.push(note.replace(/♭/g, 'b').replace(/♯/g, '#'));
        var slider = docById('slider');
        this._logo.synth.trigger(0, pitchnotes, 1, 'default', null, null);
    };

    this._moveSlider = function (cell, upDown) {
        var cellIndex = cell.cellIndex;
        var sliderrow = docById('slider');
        var cellDiv = sliderrow.cells[cellIndex].childNodes[0];
        var frequencyDiv = cellDiv.childNodes[0];
        var moveValue = parseFloat(Math.floor(SLIDERWIDTH * this._cellScale)) / 3;
        var nextOctave = 2 * this.Sliders[cellIndex][0];

        var idx = this.Sliders[cellIndex][1] + (1 * upDown);
        var frequency = this.Sliders[cellIndex][0] * Math.pow(SEMITONE, idx);

        if (frequency > nextOctave) {
            return;
        } else if (frequency < this.Sliders[cellIndex][0]) {
            return;
        }

        this.Sliders[cellIndex][2] = 0;
        this.Sliders[cellIndex][1] = idx; // += 1 * upDown;

        var top = Number(cellDiv.style.top.replace('px', ''));
        cellDiv.style.top = (top - (upDown * SLIDERHEIGHT / 12)) + 'px';

        frequencyDiv.innerHTML = frequency.toFixed(2);
        this._logo.synth.stop();
        this._play(sliderrow.cells[cellIndex]);
    };

    this._save = function (cell) {
        console.log(cell);
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
        const KEYCODE_LEFT = 37;
        const KEYCODE_RIGHT = 39;
        const KEYCODE_UP = 38;
        const KEYCODE_DOWN = 40;
        const RETURN = 13;

        var that = this;
        cell.focus();

        cell.addEventListener('keydown', function(event) {
            that._isKeyPressed = 0;
            if (event.keyCode >= KEYCODE_LEFT && event.keyCode <= KEYCODE_DOWN) {
                that._isKeyPressed = 1;
            } else if (event.keyCode === RETURN) {
                that._isKeyPressed = 1;
            }
        });

        cell.addEventListener('keyup', function(event) {
            if (that._isKeyPressed === 1) {
                that._isKeyPressed = 0;

                if (event.keyCode === KEYCODE_UP) {
                    that._moveSlider(cell, 1);
                }

                if (event.keyCode === KEYCODE_DOWN) {
                    that._moveSlider(cell, -1);
                }

                if (event.keyCode === KEYCODE_LEFT) {
                    that._focusCell(cell, -1);
                }

                if (event.keyCode === KEYCODE_RIGHT) {
                    that._focusCell(cell, 1);
                }

                if (event.keyCode === RETURN) {
                    console.log('RETURN');
                    that._save(cell);
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

        var w = window.innerWidth;
        this._cellScale = 1.0;
        var iconSize = ICONSIZE;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var sliderDiv = docById('sliderDiv');

        sliderDiv.style.visibility = 'visible';
        sliderDiv.setAttribute('draggable', 'true');
        sliderDiv.style.left = '200px';
        sliderDiv.style.top = '150px';

        // The widget buttons
        var widgetButtonsDiv = docById('sliderButtonsDiv');
        widgetButtonsDiv.style.display = 'inline';
        widgetButtonsDiv.style.visibility = 'visible';
        widgetButtonsDiv.style.width = BUTTONDIVWIDTH;
        widgetButtonsDiv.innerHTML = '<table id="sliderButtonTable"></table>';

        var buttonTable = docById('sliderButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        var cell = this._addButton(row, 'close-button.svg', iconSize, _('close'));

        cell.onclick = function() {
            sliderDiv.style.visibility = 'hidden';
            widgetButtonsDiv.style.visibility = 'hidden';
            sliderTableDiv.style.visibility = 'hidden';
            that._logo.hideMsgs();
        };

        cell.onmouseover = function() {
            this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
        };

        cell.onmouseout = function() {
            this.style.backgroundColor = MATRIXBUTTONCOLOR;
        };

        // We use this cell as a handle for dragging.
        var cell = this._addButton(row, 'grab.svg', iconSize, _('drag'));

        cell.style.cursor = 'move';

        this._dx = cell.getBoundingClientRect().left - sliderDiv.getBoundingClientRect().left;
        this._dy = cell.getBoundingClientRect().top - sliderDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = cell.innerHTML;

        cell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
            cell.innerHTML = '';
        };

        cell.onmouseout = function(e) {
            if (!that._dragging) {
                cell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                sliderDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                sliderDiv.style.top = y + 'px';
                cell.innerHTML = that._dragCellHTML;
            }
        };

        sliderDiv.ondragover = function(e) {
            e.preventDefault();
        };

        sliderDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                sliderDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                sliderDiv.style.top = y + 'px';
                cell.innerHTML = that._dragCellHTML;
            }
        };

        sliderDiv.onmousedown = function(e) {
            that._dragging = true;
            that._target = e.target;
        };

        sliderDiv.ondragstart = function(e) {
            if (cell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The slider table
        var sliderTableDiv = docById('sliderTableDiv');
        sliderTableDiv.style.display = 'inline';
        sliderTableDiv.style.visibility = 'visible';
        sliderTableDiv.style.border = '2px';
        sliderTableDiv.innerHTML = '';

        // We use an outer div to scroll vertically and an inner div to
        // scroll horizontally.
        sliderTableDiv.innerHTML = '<div id="sliderOuterDiv"><div id="sliderInnerDiv"><table id="sliderSliderTable"></table></div></div>';

        var sliderOuterDiv = docById('sliderOuterDiv');
        sliderOuterDiv.style.width = Math.min((11 + this.Sliders.length * SLIDERWIDTH), w / 2) + 'px';
        sliderOuterDiv.style.height = (11 + SLIDERHEIGHT + 3 * BUTTONSIZE) + 'px';

        var sliderInnerDiv = docById('sliderInnerDiv');
        sliderInnerDiv.style.width = (10 + this.Sliders.length * SLIDERWIDTH)+ 'px';
        sliderInnerDiv.style.height = (10 + SLIDERHEIGHT + 3 * BUTTONSIZE) + 'px';

        // Each column in the table has a slider row, and up row, and a down row.
        var sliderTable = docById('sliderSliderTable');
        var sliderRow = sliderTable.insertRow();
        sliderRow.setAttribute('id', 'slider');
        var upRow = sliderTable.insertRow();
        var downRow = sliderTable.insertRow();

        for (var i = 0; i < this.Sliders.length; i++) {
            var sliderCell = sliderRow.insertCell();

            sliderCell.style.width = SLIDERWIDTH * this._cellScale + 'px';
            sliderCell.style.minWidth = sliderCell.style.width;
            sliderCell.style.maxWidth = sliderCell.style.width;
            sliderCell.style.height = (BUTTONSIZE + SLIDERHEIGHT) * this._cellScale + 'px';
            sliderCell.style.backgroundColor = MATRIXNOTECELLCOLOR;
            sliderCell.setAttribute('tabIndex', 1);

            // Add a div to hold the slider.
            var cellDiv = document.createElement('div');
            cellDiv.setAttribute('id', 'sliderInCell');
            cellDiv.setAttribute('position', 'absolute');
            cellDiv.style.height = Math.floor(w / SLIDERHEIGHT) + 'px';
            cellDiv.style.width = Math.floor(SLIDERWIDTH * this._cellScale) + 'px';
            cellDiv.style.top = SLIDERHEIGHT + 'px';
            cellDiv.style.backgroundColor = MATRIXBUTTONCOLOR;
            sliderCell.appendChild(cellDiv);

            // Add a paragraph element for the slider value.
            var slider = document.createElement('P');
            slider.innerHTML = this.Sliders[i][0].toFixed(2);
            cellDiv.appendChild(slider);

            sliderCell.onmouseover = function(event) {
                that._addKeyboardInput(this);
            };

            sliderCell.onmouseout = function() {
                this.blur();
            };

            sliderCell.onmousemove = function(event) {
                var cellDiv = this.childNodes[0];

                // Using event.offsetY was too noisy. This is more robust.
                var offset = event.pageY - this.getBoundingClientRect().top;
                if (offset > SLIDERHEIGHT) {
                    var offset = SLIDERHEIGHT;
                } else if (offset < 0) {
                    var offset = 0;
                }

                var cellIndex = this.cellIndex;
                var sliderrow = docById('slider');
                var cellDiv = sliderrow.cells[cellIndex].childNodes[0];
                cellDiv.style.top = offset + 'px';

                var distanceFromBottom = Math.max(SLIDERHEIGHT - offset, 0);
                var frequencyOffset = parseFloat(that.Sliders[cellIndex][0]) / SLIDERHEIGHT * distanceFromBottom;

                that.Sliders[cellIndex][1] = parseInt(Math.log2(parseFloat(that.Sliders[cellIndex][0] + frequencyOffset) / that.Sliders[cellIndex][0]) * 12);
                that.Sliders[cellIndex][2] = frequencyOffset - that.Sliders[cellIndex][0] * Math.pow(SEMITONE, that.Sliders[cellIndex][1]);

                var frequencyDiv = cellDiv.childNodes[0];
                var frequency = that.Sliders[cellIndex][0] * Math.pow(SEMITONE, that.Sliders[cellIndex][1]);
                frequencyDiv.innerHTML = frequency.toFixed(2);
                that._play(this);
            };

            sliderCell.onclick = function() {
                that._save(this);
            };

            var upCell = this._addButton(upRow, 'up.svg', iconSize, _('move up'));

            upCell.onclick = function() {
                that._moveSlider(this, 1);
            };

            upCell.onmouseover = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            };

            upCell.onmouseout = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            };

            var downCell = this._addButton(downRow, 'down.svg', iconSize, _('move down'));

            downCell.onclick = function() {
                that._moveSlider(this, -1);
            };

            downCell.onmouseover = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLORHOVER;
            };

            downCell.onmouseout = function() {
                this.style.backgroundColor = MATRIXBUTTONCOLOR;
            };
        }

        this._logo.textMsg(_('Use the slider to change the pitch.'));
    };
};
