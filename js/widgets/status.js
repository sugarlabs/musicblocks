/* eslint-disable no-undef */
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

/* exported StatusMatrix */
class StatusMatrix {
    static BUTTONDIVWIDTH = 128;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static OUTERWINDOWWIDTH = 620;
    static INNERWINDOWWIDTH = StatusMatrix.OUTERWINDOWWIDTH - StatusMatrix.BUTTONSIZE * 1.5;
    static FONTSCALEFACTOR = 75;

    /**
     * Initializes the status matrix. First removes the
     * previous matrix and them make another one in DOM (document
     * object model)
     */
    init() {
        this.isOpen = true;
        this.isMaximized = false;
        this._cellScale = window.innerWidth / 1200;
        let iconSize = StatusMatrix.ICONSIZE * this._cellScale;

        this.widgetWindow = window.widgetWindows.windowFor(this, "status", "status");
        this.widgetWindow.clear();
        this.widgetWindow.show();
        // For the button callbacks
        let cell;

        // The status table
        this._statusTable = document.createElement("table");
        this.widgetWindow.getWidgetBody().append(this._statusTable);
        this.widgetWindow.onclose = () => {
            this.isOpen = false;
            this.widgetWindow.destroy();
        };

        // Each row in the status table contains a field label in the
        // first column and a table of values (one per mouse) in the
        // remaining columns.
        // The first row contains the mice icons.
        const header = this._statusTable.createTHead();
        const row = header.insertRow();

        iconSize = Math.floor(this._cellScale * 24);

        cell = row.insertCell();
        cell.style.backgroundColor = "#FFFFFF";
        cell.className = "headcol";
        cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
        // cell.style.width = StatusMatrix.BUTTONSIZE * this._cellScale*2 + "px";
        cell.style.width = "212.5px";

        cell.innerHTML = "&nbsp;";
        // One column per mouse/turtle
        for (const turtle of turtles.turtleList) {
            if (turtle.inTrash) {
                continue;
            }

            cell = row.insertCell();
            cell.style.backgroundColor = "#FFFFFF";

            if (_THIS_IS_MUSIC_BLOCKS_) {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="images/mouse.svg" title="' +
                    turtle.name +
                    '" alt="' +
                    turtle.name +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '">&nbsp;&nbsp;';
            } else {
                cell.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/turtle-button.svg" title="' +
                    turtle.name +
                    '" alt="' +
                    turtle.name +
                    '" height="' +
                    iconSize +
                    '" width="' +
                    iconSize +
                    '">&nbsp;&nbsp;';
            }
            cell.style.width = "212.5px";
            this.widgetWindow.onmaximize = () => {
                this.isMaximized = !(this.isMaximized);
                console.debug("Maximized " + this.isMaximized);
                cell.style.width = "100vw";
                cell.style.paddingLeft = "30px";
                cell.style.fontSize = Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR)*0.90 + "%";
                if(!(this.isMaximized)){
                    cell.style.width = "212.5px";
                }
            };
            // cell.style.width = StatusMatrix.BUTTONSIZE * this._cellScale*2 + "px";
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
            cell.className = "headcol";
        }

        // console.debug("active turtles: " + turtles.turtleList.length);

        // One row per field, one column per mouse (plus the labels)
        let label;
        for (const statusField of logo.statusFields) {
            const row = header.insertRow();

            cell = row.insertCell(); // i + 1);
            cell.style.fontSize = Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR)*0.90 + "%";

            // console.debug(statusField[1]);

            switch (statusField[1]) {
                case "plus":
                case "minus":
                case "neg":
                case "divide":
                case "power":
                case "multiply":
                case "sqrt":
                case "int":
                case "mod":
                    label = "";
                    break;
                case "namedbox":
                    label = logo.blocks.blockList[statusField[0]].privateData;
                    break;
                case "heap":
                    label = _("heap");
                    break;
                case "bpm":
                case "bpmfactor":
                    if (localStorage.languagePreference === "ja") {
                        label = _("beats per minute2");
                    } else {
                        label = logo.blocks.blockList[statusField[0]].protoblock.staticLabels[0];
                    }
                    // console.debug(label);
                    break;
                case "outputtools":
                    label = logo.blocks.blockList[statusField[0]].privateData;
                    break;
                default:
                    label = logo.blocks.blockList[statusField[0]].protoblock.staticLabels[0];
                    break;
            }
            let str = label;
            str = label.charAt(0).toUpperCase() + label.slice(1);
            // console.log(str);
            cell.innerHTML = "&nbsp;<b>" + str + "</b>";
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
            cell.style.backgroundColor = platformColor.selectorBackground;
            cell.style.paddingLeft = "10px";
            turtles.turtleList.forEach(() => {
                cell = row.insertCell();
                cell.style.backgroundColor = platformColor.selectorBackground;
                cell.style.fontSize =
                    Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR)*0.90 + "%";
                cell.innerHTML = "";
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.textAlign = "center";
            });
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            const row = header.insertRow();
            cell = row.insertCell();
            cell.style.fontSize = Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR)*0.90 + "%";
            const str = _("note");
            const label = str.charAt(0).toUpperCase() + str.slice(1);
            cell.innerHTML = "&nbsp;<b>" + label + "</b>";
            cell.style.height = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
            cell.style.backgroundColor = platformColor.selectorBackground;
            cell.style.paddingLeft = "10px";
            turtles.turtleList.forEach(() => {
                cell = row.insertCell();
                cell.style.backgroundColor = platformColor.selectorBackground;
                cell.style.fontSize =
                    Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR)*0.90 + "%";
                cell.innerHTML = "";
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
                cell.style.textAlign = "center";
            });
        }
        this.widgetWindow.sendToCenter();
    }

    /**
     * @public
     * @returns {void}
     */
    updateAll() {
        // Update status of all of the voices in the matrix.
        logo.updatingStatusMatrix = true;

        let activeTurtles = 0;
        let cell;
        let t = 0;
        for (const turtle of turtles.turtleList) {
            const tur = turtles.ithTurtle(t);

            if (turtle.inTrash) {
                continue;
            }

            let saveStatus;
            let blk, cblk;
            let name;
            let value;
            let notes;
            let noteValue;
            let freq;
            let i = 0;
            for (const statusField of logo.statusFields) {
                saveStatus = logo.inStatusMatrix;
                logo.inStatusMatrix = false;

                logo.parseArg(logo, t, statusField[0]);
                switch (logo.blocks.blockList[statusField[0]].name) {
                    case "x":
                    case "y":
                    case "heading":
                        value = logo.blocks.blockList[statusField[0]].value.toFixed(0);
                        break;
                    case "mynotevalue":
                        value = mixedNumber(logo.blocks.blockList[statusField[0]].value);
                        break;
                    case "elapsednotes2":
                        blk = statusField[0];
                        cblk = logo.blocks.blockList[blk].connections[1];
                        noteValue = logo.parseArg(logo, t, cblk, blk, null);
                        value =
                            mixedNumber(logo.blocks.blockList[statusField[0]].value) +
                            " × " +
                            mixedNumber(noteValue);
                        break;
                    case "elapsednotes":
                        value = mixedNumber(logo.blocks.blockList[statusField[0]].value);
                        break;
                    case "namedbox":
                        name = logo.blocks.blockList[statusField[0]].privateData;
                        if (name in logo.boxes) {
                            value = logo.boxes[name];
                        } else {
                            value = "";
                        }
                        break;
                    case "beatvalue":
                        value = mixedNumber(tur.singer.currentBeat);
                        break;
                    case "measurevalue":
                        value = tur.singer.currentMeasure;
                        break;
                    case "pitchinhertz":
                        value = "";
                        if (tur.singer.noteStatus != null) {
                            notes = tur.singer.noteStatus[0];
                            for (let j = 0; j < notes.length; j++) {
                                if (j > 0) {
                                    value += " ";
                                }
                                freq = logo.synth.getFrequency(
                                    notes[j],
                                    logo.synth.changeInTemperament
                                );
                                if (typeof freq === "number") {
                                    value += freq.toFixed(2);
                                }
                            }
                        } else {
                            value = "";
                        }
                        break;
                    case "heap":
                        value = logo.blocks.blockList[statusField[0]].value;
                        break;
                    default:
                        value = logo.blocks.blockList[statusField[0]].value;
                        break;
                }

                logo.inStatusMatrix = saveStatus;

                cell = this._statusTable.rows[i + 1].cells[activeTurtles + 1];
                if (cell != null) {
                    cell.innerHTML = value;
                }
                i++;
            }

            let obj;
            let note;
            if (_THIS_IS_MUSIC_BLOCKS_) {
                note = "";
                value = "";
                if (tur.singer.noteStatus != null) {
                    notes = tur.singer.noteStatus[0];
                    for (let j = 0; j < notes.length; j++) {
                        if (typeof notes[j] === "number") {
                            note += toFixed2(notes[j]);
                            note += "Hz ";
                        } else {
                            note += notes[j];
                            note += " ";
                        }
                    }

                    value = tur.singer.noteStatus[1];
                    obj = rationalToFraction(value);
                    note += obj[1] + "/" + obj[0];
                }

                cell = this._statusTable.rows[i + 1].cells[activeTurtles + 1];
                if (cell != null) {
                    cell.innerHTML = note.replace(/#/g, "♯").replace(/b/g, "♭");
                }
            }

            activeTurtles += 1;
            t++;
        }

        logo.updatingStatusMatrix = false;
    }
}
