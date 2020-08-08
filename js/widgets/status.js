// Copyright (c) 2016-20 Walter Bender
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

// This widget makes displays the status of selected parameters and
// notes as they are being played.

function StatusMatrix() {
    const BUTTONDIVWIDTH = 128;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;
    const OUTERWINDOWWIDTH = 620;
    const INNERWINDOWWIDTH = OUTERWINDOWWIDTH - BUTTONSIZE * 1.5;
    const FONTSCALEFACTOR = 75;
    var x, y; //Drop coordinates of statusDiv

    this.init = function(logo) {
        // Initializes the status matrix. First removes the
        // previous matrix and them make another one in DOM (document
        // object model)
        this._logo = logo;
        this.isOpen = true;

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var widgetWindow = window.widgetWindows.windowFor(
            this,
            "status",
            "status"
        );
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	widgetWindow.show();

        // For the button callbacks
        var that = this;

        // The status table
        this._statusTable = document.createElement("table");
        widgetWindow.getWidgetBody().append(this._statusTable);
        widgetWindow.onclose = function() {
            that.isOpen = false;

            this.destroy();
        };

        // Each row in the status table contains a field label in the
        // first column and a table of values (one per mouse) in the
        // remaining columns.
        // The first row contains the mice icons.
        var header = this._statusTable.createTHead();
        var row = header.insertRow();

        var iconSize = Math.floor(this._cellScale * 24);

        var cell = row.insertCell();
        cell.style.backgroundColor = platformColor.selectorBackground;
        cell.className = "headcol";
        cell.style.height =
            Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
        cell.style.width = BUTTONSIZE * this._cellScale + "px";
        cell.innerHTML = "&nbsp;";

        // One column per mouse/turtle
        var activeTurtles = 0;
        for (
            var turtle = 0;
            turtle < this._logo.turtles.turtleList.length;
            turtle++
        ) {
            if (this._logo.turtles.turtleList[turtle].inTrash) {
                continue;
            }

            var cell = row.insertCell();
            cell.style.backgroundColor = platformColor.labelColor;

            if (_THIS_IS_MUSIC_BLOCKS_) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="images/mouse.svg" title="' +
                    this._logo.turtles.turtleList[turtle].name +
                    '" alt="' +
                    this._logo.turtles.turtleList[turtle].name +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '">&nbsp;&nbsp;';
            } else {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/turtle-button.svg" title="' +
                    this._logo.turtles.turtleList[turtle].name +
                    '" alt="' +
                    this._logo.turtles.turtleList[turtle].name +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '">&nbsp;&nbsp;';
            }

            cell.style.width = BUTTONSIZE * this._cellScale + "px";
            cell.style.height =
                Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            cell.className = "headcol";

            activeTurtles += 1;
        }

        console.debug("active turtles: " + activeTurtles);

        // One row per field, one column per mouse (plus the labels)
        for (var i = 0; i < this._logo.statusFields.length; i++) {
            var row = header.insertRow();

            var cell = row.insertCell(); // i + 1);
            cell.style.fontSize =
                Math.floor(this._cellScale * FONTSCALEFACTOR) + "%";

            console.debug(this._logo.statusFields[i][1]);

            switch (this._logo.statusFields[i][1]) {
                case "plus":
                case "minus":
                case "neg":
                case "divide":
                case "power":
                case "multiply":
                case "sqrt":
                case "int":
                case "mod":
                    var label = "";
                    break;
                case "namedbox":
                    var label = this._logo.blocks.blockList[
                        this._logo.statusFields[i][0]
                    ].privateData;
                    break;
                case "bpm":
                case "bpmfactor":
                    var language = localStorage.languagePreference;
                    if (language === "ja") {
                        var label = _("beats per minute2");
                    } else {
                        var label = this._logo.blocks.blockList[
                            this._logo.statusFields[i][0]
                        ].protoblock.staticLabels[0];
                    }
                    console.debug(label);
                    break;
                case "outputtools":
                    var label = this._logo.blocks.blockList[
                            this._logo.statusFields[i][0]
                        ].privateData;
                    break;
                default:
                    var label = this._logo.blocks.blockList[
                        this._logo.statusFields[i][0]
                    ].protoblock.staticLabels[0];
                    break;
            }

            cell.innerHTML = "&nbsp;<b>" + label + "</b>";
            cell.style.height =
                Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
            cell.style.backgroundColor = platformColor.selectorBackground;

            for (var j = 0; j < activeTurtles; j++) {
                var cell = row.insertCell();
                cell.style.backgroundColor = platformColor.selectorBackground;
                cell.style.fontSize =
                    Math.floor(this._cellScale * FONTSCALEFACTOR) + "%";
                cell.innerHTML = "";
                cell.style.height =
                    Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.textAlign = "center";
            }
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            var row = header.insertRow();
            var cell = row.insertCell();
            cell.style.fontSize =
                Math.floor(this._cellScale * FONTSCALEFACTOR) + "%";
            cell.innerHTML = "&nbsp;<b>" + _("note") + "</b>";
            cell.style.height =
                Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
            cell.style.backgroundColor = platformColor.selectorBackground;

            for (var i = 0; i < activeTurtles; i++) {
                var cell = row.insertCell();
                cell.style.backgroundColor = platformColor.selectorBackground;
                cell.style.fontSize =
                    Math.floor(this._cellScale * FONTSCALEFACTOR) + "%";
                cell.innerHTML = "";
                cell.style.height =
                    Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.textAlign = "center";
            }
        }

        widgetWindow.sendToCenter();
    };

    this.updateAll = function() {
        // Update status of all of the voices in the matrix.
        this._logo.updatingStatusMatrix = true;

        var activeTurtles = 0;
        for (
            var turtle = 0;
            turtle < this._logo.turtles.turtleList.length;
            turtle++
        ) {
            let tur = this._logo.turtles.ithTurtle(turtle);

            if (this._logo.turtles.turtleList[turtle].inTrash) {
                continue;
            }

            for (var i = 0; i < this._logo.statusFields.length; i++) {
                var saveStatus = this._logo.inStatusMatrix;
                this._logo.inStatusMatrix = false;

                this._logo.parseArg(
                    this._logo,
                    turtle,
                    this._logo.statusFields[i][0]
                );
                switch (
                    this._logo.blocks.blockList[this._logo.statusFields[i][0]]
                        .name
                ) {
                    case "x":
                    case "y":
                    case "heading":
                        var value = this._logo.blocks.blockList[
                            this._logo.statusFields[i][0]
                        ].value.toFixed(0);
                        break;
                    case "mynotevalue":
                        var value = mixedNumber(
                            this._logo.blocks.blockList[
                                this._logo.statusFields[i][0]
                            ].value
                        );
                        break;
                    case "elapsednotes2":
                        var blk = this._logo.statusFields[i][0];
                        var cblk = this._logo.blocks.blockList[blk]
                            .connections[1];
                        var notevalue = this._logo.parseArg(
                            this._logo,
                            turtle,
                            cblk,
                            blk,
                            null
                        );
                        var value =
                            mixedNumber(
                                this._logo.blocks.blockList[
                                    this._logo.statusFields[i][0]
                                ].value
                            ) +
                            " × " +
                            mixedNumber(notevalue);
                        break;
                    case "elapsednotes":
                        var value = mixedNumber(
                            this._logo.blocks.blockList[
                                this._logo.statusFields[i][0]
                            ].value
                        );
                        break;
                    case "namedbox":
                        var name = this._logo.blocks.blockList[
                            this._logo.statusFields[i][0]
                        ].privateData;
                        if (name in this._logo.boxes) {
                            var value = this._logo.boxes[name];
                        } else {
                            var value = "";
                        }
                        break;
                    case "beatvalue":
                        var value = mixedNumber(tur.singer.currentBeat);
                        break;
                    case "measurevalue":
                        var value = tur.singer.currentMeasure;
                        break;
                    case "pitchinhertz":
                        var value = "";
                        if (tur.singer.noteStatus != null) {
                            var notes = tur.singer.noteStatus[0];
                            for (var j = 0; j < notes.length; j++) {
                                if (j > 0) {
                                    value += " ";
                                }

                                var freq = this._logo.synth.getFrequency(
                                    notes[j],
                                    this._logo.synth.changeInTemperament
                                );
                                if (typeof freq === "number") {
                                    value += freq.toFixed(2);
                                }
                            }
                        } else {
                            value = "";
                        }
                        break;
                    default:
                        var value = this._logo.blocks.blockList[
                            this._logo.statusFields[i][0]
                        ].value;
                        break;
                }

                var innerHTML = value;

                this._logo.inStatusMatrix = saveStatus;

                var cell = this._statusTable.rows[i + 1].cells[
                    activeTurtles + 1
                ];
                if (cell != null) {
                    cell.innerHTML = innerHTML;
                }
            }

            if (_THIS_IS_MUSIC_BLOCKS_) {
                var note = "";
                var value = "";
                if (tur.singer.noteStatus != null) {
                    var notes = tur.singer.noteStatus[0];
                    for (var j = 0; j < notes.length; j++) {
                        if (typeof notes[j] === "number") {
                            note += toFixed2(notes[j]);
                            note += "Hz ";
                        } else {
                            note += notes[j];
                            note += " ";
                        }
                    }
                    var value = tur.singer.noteStatus[1];

                    var obj = rationalToFraction(value);
                    note += obj[1] + "/" + obj[0];
                }

                var cell = this._statusTable.rows[i + 1].cells[
                    activeTurtles + 1
                ];
                if (cell != null) {
                    cell.innerHTML = note.replace(/#/g, "♯").replace(/b/g, "♭");
                }
            }

            activeTurtles += 1;
        }

        this._logo.updatingStatusMatrix = false;
    };
}
