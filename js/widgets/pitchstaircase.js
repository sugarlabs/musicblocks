// Copyright (c) 2016-2019 Walter Bender
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

function PitchStaircase() {
    const BUTTONDIVWIDTH = 476; // 8 buttons 476 = (55 + 4) * 8
    const OUTERWINDOWWIDTH = 685;
    const INNERWINDOWWIDTH = 600;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const DEFAULTFREQUENCY = 220.0;

    // A list of stair steps.
    this.Stairs = [];
    this.stairPitchBlocks = [];

    this._stepTables = [];
    this._musicRatio1 = null;
    this._musicRatio2 = null;

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

    this._makeStairs = function(start, isStepDeleted) {
        // Each row in the psc table contains separate table; each
        // table contains a note label in the first column and a table
        // of buttons in the second column.
        var pscTable = this._pscTable;
        pscTable.innerHTML = "";
        pscTable.style.textAlign = "center";

        if (!isStepDeleted) {
            var stairsLength = this.Stairs.length;
        } else {
            var stairsLength = this.Stairs.length - 1;
        }

        var that = this;

        for (var i = 0; i < this.Stairs.length; i++) {
            var pscTableRow = pscTable.insertRow();
            var pscTableCell = pscTableRow.insertCell();
            var stepTable = document.createElement("table");
            this._stepTables[i] = stepTable;
            pscTableCell.append(stepTable);

            var stepTableRow = stepTable.insertRow();

            // The stairstep for this row.
            // var solfege = this.Stairs[i][0];
            // var octave = this.Stairs[i][1];
            // var solfegetonote = getNote(solfege, octave, 0, this._logo.keySignature[this.logoturtle], false, null, this._logo.errorMsg)[0];
            var frequency = this.Stairs[i][2];

            // The play button for this row.
            // var cell = stepTableRow.insertCell();
            var playCell = this._addButton(
                stepTableRow,
                "play-button.svg",
                ICONSIZE,
                _("Play")
            );
            playCell.className = "headcol"; // This cell is fixed horizontally.
            playCell.setAttribute("id", i);

            var stepCell = stepTableRow.insertCell();
            stepCell.setAttribute("id", frequency);
            stepCell.style.width =
                (INNERWINDOWWIDTH *
                    parseFloat(DEFAULTFREQUENCY / frequency) *
                    this._cellScale) /
                    3 +
                "px";
            stepCell.innerHTML =
                frequency.toFixed(2) +
                "<br>" +
                this.Stairs[i][0] +
                this.Stairs[i][1];
            stepCell.style.minWidth = stepCell.style.width;
            stepCell.style.maxWidth = stepCell.style.width;
            stepCell.style.height = BUTTONSIZE + "px";
            stepCell.style.backgroundColor = platformColor.selectorBackground;

            var cellWidth = Number(stepCell.style.width.replace(/px/, ""));
            var svgWidth = cellWidth.toString();
            var svgScale = (cellWidth / 55).toString();
            var svgStrokeWidth = ((3 * 55) / cellWidth).toString();
            var svgData =
                "data:image/svg+xml;base64," +
                window.btoa(
                    unescape(
                        encodeURIComponent(
                            SYNTHSVG.replace(/SVGWIDTH/g, svgWidth)
                                .replace(/XSCALE/g, svgScale)
                                .replace(/STOKEWIDTH/g, svgStrokeWidth)
                        )
                    )
                );
            stepCell.style.backgroundImage = "url(" + svgData + ")";
            stepCell.style.backgroundRepeat = "no-repeat";
            stepCell.style.backgroundPosition = "center center";

            stepCell.addEventListener("click", function(event) {
                that._dissectStair(event);
            });

            playCell.onclick = function() {
                var i = this.getAttribute("id");
                var stepCell = that._stepTables[i].rows[0].cells[1];
                that._playOne(stepCell);
            };
        }
    };

    this._undo = function() {
        if (this._history.length === 0) {
            console.debug("nothing for undo to undo");
            return false;
        }

        // Remove the last entry...
        var i = this._history.pop();
        this.Stairs.splice(i, 1);

        // And rebuild the stairs.
        this._refresh();

        return true;
    };

    this._dissectStair = function(event) {
        var that = this;
        var inputNum1 = this._musicRatio1.value;

        if (isNaN(inputNum1)) {
            inputNum1 = 3;
        } else {
            inputNum1 = Math.abs(Math.floor(inputNum1));
        }

        this._musicRatio1.value = inputNum1;
        var inputNum2 = this._musicRatio2.value;

        if (isNaN(inputNum2)) {
            inputNum2 = 2;
        } else {
            inputNum2 = Math.abs(Math.floor(inputNum2));
        }

        this._musicRatio2.value = inputNum2;
        inputNum = parseFloat(inputNum2 / inputNum1);

        var oldcell = event.target;
        var frequency = Number(oldcell.getAttribute("id"));

        // Look for the Stair with this frequency.
        for (var n = 0; n < this.Stairs.length; n++) {
            if (this.Stairs[n][2] === frequency) {
                break;
            }
        }

        if (n === this.Stairs.length) {
            console.debug("DID NOT FIND A MATCH " + frequency);
            return;
        }

        // TODO: look to see if the same frequency is already in the list.

        var obj = frequencyToPitch(parseFloat(frequency) / inputNum);
        var foundStep = false;
        var isStepDeleted = true;

        for (var i = 0; i < this.Stairs.length; i++) {
            if (this.Stairs[i][2] < parseFloat(frequency) / inputNum) {
                this.Stairs.splice(i, 0, [
                    obj[0],
                    obj[1],
                    parseFloat(frequency) / inputNum,
                    this.Stairs[n][3] * parseFloat(inputNum2),
                    this.Stairs[n][4] * parseFloat(inputNum1),
                    this.Stairs[n][2],
                    this.Stairs[n][6]
                ]);
                foundStep = true;
                break;
            }

            if (this.Stairs[i][2] === parseFloat(frequency) / inputNum) {
                this.Stairs.splice(i, 1, [
                    obj[0],
                    obj[1],
                    parseFloat(frequency) / inputNum,
                    this.Stairs[n][3] * parseFloat(inputNum2),
                    this.Stairs[n][4] * parseFloat(inputNum1),
                    this.Stairs[n][2],
                    this.Stairs[n][6]
                ]);
                foundStep = true;
                isStepDeleted = false;
                break;
            }
        }

        if (!foundStep) {
            this.Stairs.push([
                obj[0],
                obj[1],
                parseFloat(frequency) / inputNum,
                this.Stairs[n][3] * parseFloat(inputNum2),
                this.Stairs[n][4] * parseFloat(inputNum1),
                this.Stairs[n][2],
                this.Stairs[n][6]
            ]);
            this._history.push(this.Stairs.length - 1);
        } else {
            this._history.push(i);
        }

        this._makeStairs(i, isStepDeleted);
    };

    this._playOne = function(stepCell) {
        // The frequency is stored in the stepCell.
        stepCell.style.backgroundColor = platformColor.selectorBackground;
        var frequency = Number(stepCell.getAttribute("id"));
        this._logo.synth.trigger(0, frequency, 1, DEFAULTVOICE, null, null);

        setTimeout(function() {
            stepCell.style.backgroundColor = platformColor.selectorBackground;
        }, 1000);
    };

    this._playAll = function() {
        var that = this;
        var pitchnotes = [];

        for (var i = 0; i < this.Stairs.length; i++) {
            var note = this.Stairs[i][0] + this.Stairs[i][1];
            pitchnotes.push(note.replace(/♭/g, "b").replace(/♯/g, "#"));
            var stepCell = this._stepTables[i].rows[0].cells[1];
            stepCell.style.backgroundColor = platformColor.selectorBackground;
            this._logo.synth.trigger(
                0,
                pitchnotes,
                1,
                DEFAULTVOICE,
                null,
                null
            );
        }

        setTimeout(function() {
            for (var i = 0; i < that.Stairs.length; i++) {
                var stepCell = that._stepTables[i].rows[0].cells[1];
                stepCell.style.backgroundColor =
                    platformColor.selectorBackground;
            }
        }, 1000);
    };

    this.playUpAndDown = function() {
        var that = this;
        var pitchnotes = [];
        var note =
            this.Stairs[this.Stairs.length - 1][0] +
            this.Stairs[this.Stairs.length - 1][1];
        pitchnotes.push(note.replace(/♭/g, "b").replace(/♯/g, "#"));
        var last = this.Stairs.length - 1;
        var stepCell = this._stepTables[last].rows[0].cells[1];
        stepCell.style.backgroundColor = platformColor.selectorBackground;
        this._logo.synth.trigger(0, pitchnotes, 1, DEFAULTVOICE, null, null);
        this._playNext(this.Stairs.length - 2, -1);
    };

    this._playNext = function(index, next) {
        var that = this;
        if (index === this.Stairs.length) {
            setTimeout(function() {
                for (var i = 0; i < that.Stairs.length; i++) {
                    var stepCell = that._stepTables[i].rows[0].cells[1];
                    stepCell.style.backgroundColor =
                        platformColor.selectorBackground;
                }
            }, 1000);
            return;
        }

        if (index === -1) {
            setTimeout(function() {
                for (var i = 0; i < that.Stairs.length; i++) {
                    var stepCell = that._stepTables[i].rows[0].cells[1];
                    stepCell.style.backgroundColor =
                        platformColor.selectorBackground;
                }
            }, 1000);

            setTimeout(function() {
                that._playNext(0, 1);
            }, 200);

            return;
        }

        var pitchnotes = [];
        var note = this.Stairs[index][0] + this.Stairs[index][1];
        pitchnotes.push(note.replace(/♭/g, "b").replace(/♯/g, "#"));
        var previousRowNumber = index - next;
        var pscTableCell = this._stepTables[previousRowNumber];

        setTimeout(function() {
            if (pscTableCell != null) {
                var stepCell = pscTableCell.rows[0].cells[1];
                stepCell.style.backgroundColor =
                    platformColor.selectorBackground;
            }

            var stepCell = that._stepTables[index].rows[0].cells[1];
            stepCell.style.backgroundColor = platformColor.selectorBackground;
            that._logo.synth.trigger(
                0,
                pitchnotes,
                1,
                DEFAULTVOICE,
                null,
                null
            );
            if (index < that.Stairs.length || index > -1) {
                that._playNext(index + next, next);
            }
        }, 1000);
    };

    this._save = function(stairno) {
        for (var name in this._logo.blocks.palettes.dict) {
            this._logo.blocks.palettes.dict[name].hideMenu(true);
        }

        this._logo.refreshCanvas();
        var newStack = [
            [0, ["action", { collapsed: true }], 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: "stair" }], 0, 0, [0]]
        ];
        var endOfStackIdx = 0;
        var previousBlock = 0;

        for (var i = 0; i < this.Stairs.length; i++) {
            // console.debug(this._initialFrequency + 'x' + this.Stairs[i][4] + '/' + this.Stairs[i][3]);
            console.debug(
                this.Stairs[i][5] +
                    "x" +
                    this.Stairs[i][4] +
                    "/" +
                    this.Stairs[i][3]
            );
            var noteobj = frequencyToPitch(this.Stairs[i][2]);
            var note = this.Stairs[i][0];
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
                var hiddenBlockName = "hidden";

                newStack.push([
                    hertzBlockIdx,
                    "pitch",
                    0,
                    0,
                    [previousBlock, noteIdx, octaveIdx, hiddenIdx]
                ]);
                newStack.push([
                    noteIdx,
                    ["notename", { value: pitch[0] }],
                    0,
                    0,
                    [pitchBlockIdx]
                ]);
                newStack.push([
                    octaveIdx,
                    ["number", { value: pitch[1] }],
                    0,
                    0,
                    [pitchBlockIdx]
                ]);
            } else {
                var hertzBlockIdx = newStack.length;
                var multiplyIdx = hertzBlockIdx + 1;
                var frequencyIdx = hertzBlockIdx + 2;
                var divideIdx = hertzBlockIdx + 3;
                var numeratorIdx = hertzBlockIdx + 4;
                var denominatorIdx = hertzBlockIdx + 5;
                var vspaceIdx = hertzBlockIdx + 6;
                var hiddenIdx = hertzBlockIdx + 7;
                var hiddenBlockName = "vspace";
                newStack.push([
                    hertzBlockIdx,
                    "hertz",
                    0,
                    0,
                    [previousBlock, multiplyIdx, vspaceIdx]
                ]);
                newStack.push([
                    multiplyIdx,
                    "multiply",
                    0,
                    0,
                    [hertzBlockIdx, frequencyIdx, divideIdx]
                ]);
                // newStack.push([frequencyIdx, ['number', {'value': this._initialFrequency.toFixed(2)}], 0, 0, [multiplyIdx]]);
                // newStack.push([frequencyIdx, ['number', {'value': this.Stairs[i][5].toFixed(2)}], 0, 0, [multiplyIdx]]);
                newStack.push([
                    frequencyIdx,
                    ["number", { value: this.Stairs[i][6].toFixed(2) }],
                    0,
                    0,
                    [multiplyIdx]
                ]);
                newStack.push([
                    divideIdx,
                    "divide",
                    0,
                    0,
                    [multiplyIdx, numeratorIdx, denominatorIdx]
                ]);
                newStack.push([
                    numeratorIdx,
                    ["number", { value: this.Stairs[i][4] }],
                    0,
                    0,
                    [divideIdx]
                ]);
                newStack.push([
                    denominatorIdx,
                    ["number", { value: this.Stairs[i][3] }],
                    0,
                    0,
                    [divideIdx]
                ]);
                newStack.push([
                    vspaceIdx,
                    "vspace",
                    0,
                    0,
                    [hertzBlockIdx, hiddenIdx]
                ]);
                hertzBlockIdx = vspaceIdx; // The hidden block will connect here.
            }

            if (i === this.Stairs.length - 1) {
                newStack.push([
                    hiddenIdx,
                    hiddenBlockName,
                    0,
                    0,
                    [hertzBlockIdx, null]
                ]);
            } else {
                newStack.push([
                    hiddenIdx,
                    hiddenBlockName,
                    0,
                    0,
                    [hertzBlockIdx, hiddenIdx + 1]
                ]);
            }

            previousBlock = hiddenIdx;
        }

        this._logo.blocks.loadNewBlocks(newStack);
        this._logo.textMsg(_("New action block generated!"));
    };

    this._get_save_lock = function() {
        return this._save_lock;
    };

    this.init = function(logo) {
        this._logo = logo;
        for (var i = 0; i < this.Stairs.length; i++) {
            this.Stairs[i].push(this.Stairs[i][2]); // initial frequency
            this.Stairs[i].push(this.Stairs[i][2]); // parent frequency
        }

        // this._initialFrequency = this.Stairs[0][2];
        this._history = [];

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var widgetWindow = window.widgetWindows.windowFor(
            this,
            "pitch staircase"
        );
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	widgetWindow.show();

        var that = this;

        widgetWindow.addButton(
            "play-chord.svg",
            ICONSIZE,
            _("Play chord")
        ).onclick = function() {
            that._playAll();
        };

        widgetWindow.addButton(
            "play-scale.svg",
            ICONSIZE,
            _("Play scale")
        ).onclick = function() {
            that.playUpAndDown();
        };

        this._save_lock = false;
        widgetWindow.addButton(
            "export-chunk.svg",
            ICONSIZE,
            _("Save")
        ).onclick = function() {
            // Debounce button
            if (!that._get_save_lock()) {
                that._save_lock = true;
                that._save(0);
                setTimeout(function() {
                    that._save_lock = false;
                }, 1000);
            }
        };

        this._musicRatio1 = widgetWindow.addInputButton("3");
        widgetWindow.addDivider();
        this._musicRatio2 = widgetWindow.addInputButton("2");

        // TODO: THIS
        // DO NOT COMMIT WITH THIS COMMENTED
        /*
        var cell = row.insertCell();
        cell.innerHTML = '<h2>:</h2>';
        cell.style.backgroundColor = platformColor.selectorBackground;

        var cell = row.insertCell();
        cell.innerHTML = '<input id="musicratio2" style="-webkit-user-select: text;-moz-user-select: text;-ms-user-select: text;" class="musicratio2" type="musicratio2" value="' + 2 + '" />';
        cell.style.width = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.backgroundColor = platformColor.selectorBackground;
        docById('musicratio2').classList.add('hasKeyboard');
        */

        widgetWindow.addButton(
            "restore-button.svg",
            ICONSIZE,
            _("Undo")
        ).onclick = function() {
            that._undo();
        };

        widgetWindow.addButton(
            "erase-button.svg",
            ICONSIZE,
            _("Clear")
        ).onclick = function() {
            while (that._undo());
        };

        // The pitch-staircase (psc) table
        this._pscTable = document.createElement("table");
        widgetWindow.getWidgetBody().append(this._pscTable);
        this._refresh();

        this._logo.textMsg(_("Click on a note to create a new step."));
    };

    this._refresh = function() {
        this._makeStairs(-1, true);
    };
}
