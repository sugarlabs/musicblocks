// Copyright (c) 2016-19 Walter Bender
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
    const BUTTONDIVWIDTH = 118; // 2 buttons (55 + 4) * 2
    const BUTTONSIZE = 51;
    const ICONSIZE = 32;
    const SEMITONE = Math.pow(2, 1 / 12);

    this.Sliders = [];
    this._focusedCellIndex = 0;
    this._isKeyPressed = 0;
    this._delta = 0;
    this._slider = null;

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML =
            '&nbsp;&nbsp;<img src="header-icons/' +
            icon +
            '" title="' +
            label +
            '" alt="' +
            label +
            '" height="' +
            iconSize +
            '" width="' +
            iconSize +
            '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover = function() {
            this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        };

        cell.onmouseout = function() {
            this.style.backgroundColor = platformColor.selectorBackground;
        };

        return cell;
    };

    this._play = function(cell) {
        var cellIndex = cell.cellIndex;
        var frequency =
            this.Sliders[cellIndex][0] *
            Math.pow(SEMITONE, this.Sliders[cellIndex][1]);
        this._logo.synth.trigger(0, frequency, 1, DEFAULTVOICE, null, null);
        return;
    };

    this._moveSlider = function(cell, upDown) {
        var cellIndex = cell.cellIndex;
        var cellDiv = this._slider.cells[cellIndex].childNodes[0];
        var frequencyDiv = cellDiv.childNodes[0];
        var moveValue =
            parseFloat(Math.floor(SLIDERWIDTH * this._cellScale)) / 3;
        var nextOctave = 2 * this.Sliders[cellIndex][0];

        var idx = this.Sliders[cellIndex][1] + 1 * upDown;
        var frequency = this.Sliders[cellIndex][0] * Math.pow(SEMITONE, idx);

        if (frequency > nextOctave) {
            return;
        } else if (frequency < this.Sliders[cellIndex][0]) {
            return;
        }

        this.Sliders[cellIndex][2] = 0;
        this.Sliders[cellIndex][1] = idx; // += 1 * upDown;

        var top = Number(cellDiv.style.top.replace("px", ""));
        cellDiv.style.top = top - (upDown * SLIDERHEIGHT) / 12 + "px";

        frequencyDiv.innerHTML = frequency.toFixed(this.places);
        this._logo.synth.stop();
        this._play(sliderrow.cells[cellIndex]);
    };

    this._save = function(cell) {
        var that = this;
        var cellIndex = cell.cellIndex;
        var frequency =
            this.Sliders[cellIndex][0] *
            Math.pow(SEMITONE, this.Sliders[cellIndex][1]);

        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();

        var newStack = [
            [
                0,
                "note",
                100 + this._delta,
                100 + this._delta,
                [null, 1, 2, null]
            ],
            [1, ["number", { value: 8 }], 0, 0, [0]]
        ];
        this._delta += 21;

        var endOfStackIdx = 0;
        var previousBlock = 0;

        var hertzIdx = newStack.length;
        var frequencyIdx = hertzIdx + 1;
        var hiddenIdx = hertzIdx + 2;
        newStack.push([
            hertzIdx,
            "hertz",
            0,
            0,
            [previousBlock, frequencyIdx, hiddenIdx]
        ]);
        newStack.push([
            frequencyIdx,
            ["number", { value: frequency.toFixed(this.places) }],
            0,
            0,
            [hertzIdx]
        ]);
        newStack.push([hiddenIdx, "hidden", 0, 0, [hertzIdx, null]]);

        that._logo.blocks.loadNewBlocks(newStack);
    };

    this._addKeyboardInput = function(cell) {
        const KEYCODE_LEFT = 37;
        const KEYCODE_RIGHT = 39;
        const KEYCODE_UP = 38;
        const KEYCODE_DOWN = 40;
        const RETURN = 13;

        var that = this;
        cell.focus();

        cell.addEventListener("keydown", function(event) {
            that._isKeyPressed = 0;
            if (
                event.keyCode >= KEYCODE_LEFT &&
                event.keyCode <= KEYCODE_DOWN
            ) {
                that._isKeyPressed = 1;
            } else if (event.keyCode === RETURN) {
                that._isKeyPressed = 1;
            }
        });

        cell.addEventListener("keyup", function(event) {
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
                    that._save(cell);
                }
            }
        });
    };

    this._focusCell = function(cell, RightOrLeft) {
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
        var newCell = this._slider.cells[toBeFocused];
        this._addKeyboardInput(newCell);
    };

    this.init = function(logo) {
        this._logo = logo;

        if (beginnerMode) {
            this.places = 0;
        } else {
            this.places = 2;
        }

        var w = window.innerWidth;
        this._cellScale = 1.0;
        var iconSize = ICONSIZE;

        var widgetWindow = window.widgetWindows.windowFor(
            this,
            "pitch slider",
            "slider"
        );
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	widgetWindow.show();

        // For the button callbacks
        var that = this;

        var sliderTable = document.createElement("table");
        widgetWindow.getWidgetBody().append(sliderTable);

        // Each column in the table has a slider row, and up row, and a down row.
        this._slider = sliderTable.insertRow();

        var upRow = sliderTable.insertRow();
        var downRow = sliderTable.insertRow();

        for (var i = 0; i < this.Sliders.length; i++) {
            var sliderCell = this._slider.insertCell();

            sliderCell.style.width = SLIDERWIDTH * this._cellScale + "px";
            sliderCell.style.minWidth = sliderCell.style.width;
            sliderCell.style.maxWidth = sliderCell.style.width;
            sliderCell.style.height =
                (BUTTONSIZE + SLIDERHEIGHT) * this._cellScale + "px";
            sliderCell.style.backgroundColor = platformColor.selectorBackground;
            sliderCell.setAttribute("tabIndex", 1);

            // Add a div to hold the slider.
            var cellDiv = document.createElement("div");
            cellDiv.style.position = "absolute";
            cellDiv.style.height = Math.floor(w / SLIDERHEIGHT) + "px";
            cellDiv.style.width =
                Math.floor(SLIDERWIDTH * this._cellScale) + "px";
            cellDiv.style.top = SLIDERHEIGHT + "px";
            cellDiv.style.backgroundColor = platformColor.selectorBackground;
            sliderCell.appendChild(cellDiv);

            // Add a paragraph element for the slider value.
            var slider = document.createElement("P");
            slider.innerHTML = this.Sliders[i][0].toFixed(this.places);
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
                var cellDiv = that._slider.cells[cellIndex].childNodes[0];
                cellDiv.style.top = offset + "px";

                var distanceFromBottom = Math.max(SLIDERHEIGHT - offset, 0);
                var frequencyOffset =
                    (parseFloat(that.Sliders[cellIndex][0]) / SLIDERHEIGHT) *
                    distanceFromBottom;

                that.Sliders[cellIndex][1] =
                    Math.log2(
                        parseFloat(
                            that.Sliders[cellIndex][0] + frequencyOffset
                        ) / that.Sliders[cellIndex][0]
                    ) * 12;
                that.Sliders[cellIndex][2] =
                    frequencyOffset -
                    that.Sliders[cellIndex][0] *
                        Math.pow(SEMITONE, that.Sliders[cellIndex][1]);

                var frequencyDiv = cellDiv.childNodes[0];
                var frequency =
                    that.Sliders[cellIndex][0] *
                    Math.pow(SEMITONE, that.Sliders[cellIndex][1]);
                frequencyDiv.innerHTML = frequency.toFixed(that.places);
                that._play(this);
            };

            sliderCell.onclick = function() {
                that._save(this);
            };

            var upCell = this._addButton(
                upRow,
                "up.svg",
                iconSize,
                _("Move up")
            );

            upCell.onclick = function() {
                that._moveSlider(this, 1);
            };

            var downCell = this._addButton(
                downRow,
                "down.svg",
                iconSize,
                _("Move down")
            );

            downCell.onclick = function() {
                that._moveSlider(this, -1);
            };
        }

        this._logo.textMsg(_("Click on the slider to create a note block."));
    };
}
