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

/* global _, _THIS_IS_MUSIC_BLOCKS_ */

/* exported StatusMatrix */
class StatusMatrix {
    static BUTTONDIVWIDTH = 128;
    static BUTTONSIZE = 53;
    static ICONSIZE = 32;
    static OUTERWINDOWWIDTH = 620;
    static INNERWINDOWWIDTH = this.OUTERWINDOWWIDTH - this.BUTTONSIZE * 1.5;
    static FONTSCALEFACTOR = 75;

    /**
     * Initializes the status matrix. First removes the
     * previous matrix and them make another one in DOM (document
     * object model)
     */
    init(activity) {
        this.activity = activity;
        this.isOpen = true;
        this.isMaximized = false;
        this._cellScale = window.innerWidth / 1200;
        let iconSize = StatusMatrix.ICONSIZE * this._cellScale;
        
        // Cache DOM elements and frequently used values
        this._cachedTurtleList = this.activity.turtles.turtleList;
        this._cachedFontSize = Math.floor(this._cellScale * StatusMatrix.FONTSCALEFACTOR) * 0.9 + "%";
        this._cachedButtonHeight = Math.floor(MATRIXBUTTONHEIGHT * this._cellScale) + "px";
        this._cachedRowHeight = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + "px";
        
        // Store row references for faster access during updates
        this._cellMap = [];

        this.widgetWindow = window.widgetWindows.windowFor(this, "status", "status");
        this.widgetWindow.clear();
        this.widgetWindow.show();

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
        let cell;

        iconSize = Math.floor(this._cellScale * 24);

        cell = row.insertCell();
        cell.style.backgroundColor = "#FFFFFF";
        cell.className = "headcol";
        cell.style.height = this._cachedButtonHeight;
        cell.style.width = "212.5px";
        cell.innerHTML = "&nbsp;";
        
        // Create an array to store header cells for better reference
        const headerCells = [];
        
        // One column per mouse/turtle
        for (const turtle of this._cachedTurtleList) {
            if (turtle.inTrash) {
                continue;
            }

            cell = row.insertCell();
            cell.style.backgroundColor = "#FFFFFF";

            if (_THIS_IS_MUSIC_BLOCKS_) {
                cell.innerHTML =
                    `&nbsp;&nbsp;<img 
                        src="images/mouse.svg" 
                        title="${turtle.name}" 
                        alt="${turtle.name}" 
                        height="${iconSize}" 
                        width="${iconSize}"
                    >&nbsp;&nbsp;`;
            } else {
                cell.innerHTML =
                    `&nbsp;&nbsp;<img 
                        src="header-icons/turtle-button.svg" 
                        title="${turtle.name}" 
                        alt="${turtle.name}" 
                        height="${iconSize}"
                        width="${iconSize}"
                    >&nbsp;&nbsp;`;
            }
            cell.style.width = "212.5px";
            headerCells.push(cell);
            
            cell.style.height = this._cachedRowHeight;
            cell.className = "headcol";
        }
        
        // Define onmaximize once instead of for each turtle
        this.widgetWindow.onmaximize = () => {
            this.isMaximized = !this.isMaximized;
            const newWidth = this.isMaximized ? "100vw" : "212.5px";
            
            // Update all header cells at once
            headerCells.forEach(cell => {
                cell.style.width = newWidth;
                if (this.isMaximized) {
                    cell.style.paddingLeft = "30px";
                    cell.style.fontSize = this._cachedFontSize;
                }
            });
        };

        // One row per field, one column per mouse (plus the labels)
        let label;
        let rowIndex = 1; // Track row index for cell mapping
        
        for (const statusField of this.activity.logo.statusFields) {
            const row = header.insertRow();
            this._cellMap[rowIndex] = []; // Initialize row in cell map

            cell = row.insertCell();
            cell.style.fontSize = this._cachedFontSize;

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
                    label = this.activity.blocks.blockList[statusField[0]].privateData;
                    break;
                case "heap":
                    label = _("heap");
                    break;
                case "bpm":
                case "bpmfactor":
                    if (localStorage.languagePreference === "ja") {
                        label = _("beats per minute2");
                    } else {
                        label = this.activity.blocks.blockList[statusField[0]].protoblock
                            .staticLabels[0];
                    }
                    break;
                case "outputtools":
                    label = this.activity.blocks.blockList[statusField[0]].privateData;
                    break;
                default:
                    label = this.activity.blocks.blockList[statusField[0]].protoblock
                        .staticLabels[0];
                    break;
            }
            let str = label;
            str = label.charAt(0).toUpperCase() + label.slice(1);
            cell.innerHTML = `&nbsp;<b>${str}</b>`;
            cell.style.height = this._cachedButtonHeight;
            cell.style.backgroundColor = platformColor.selectorBackground;
            cell.style.paddingLeft = "10px";
            
            let cellIndex = 1; // Track cell index within row for mapping
            this._cachedTurtleList.forEach(() => {
                cell = row.insertCell();
                cell.style.backgroundColor = platformColor.selectorBackground;
                cell.style.fontSize = this._cachedFontSize;
                cell.innerHTML = "";
                cell.style.height = this._cachedRowHeight;
                cell.style.textAlign = "center";
                
                // Store cell reference in the map for faster access during updates
                this._cellMap[rowIndex][cellIndex] = cell;
                cellIndex++;
            });
            
            rowIndex++;
        }

        if (_THIS_IS_MUSIC_BLOCKS_) {
            const row = header.insertRow();
            this._cellMap[rowIndex] = []; // Initialize row in cell map for notes
            
            cell = row.insertCell();
            cell.style.fontSize = this._cachedFontSize;
            const str = _("note");
            const label = str.charAt(0).toUpperCase() + str.slice(1);
            cell.innerHTML = `&nbsp;<b>${label}</b>`;
            cell.style.height = this._cachedButtonHeight;
            cell.style.backgroundColor = platformColor.selectorBackground;
            cell.style.paddingLeft = "10px";
            
            let cellIndex = 1;
            this._cachedTurtleList.forEach(() => {
                cell = row.insertCell();
                cell.style.backgroundColor = platformColor.selectorBackground;
                cell.style.fontSize = this._cachedFontSize;
                cell.innerHTML = "";
                cell.style.height = this._cachedRowHeight;
                cell.style.textAlign = "center";
                
                // Store cell reference in the map for note row
                this._cellMap[rowIndex][cellIndex] = cell;
                cellIndex++;
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
        this.activity.logo.updatingStatusMatrix = true;

        let activeTurtles = 0;
        let t = 0;
        const blockList = this.activity.blocks.blockList;
        
        for (const turtle of this._cachedTurtleList) {
            const tur = this.activity.turtles.ithTurtle(t);

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
            
            for (const statusField of this.activity.logo.statusFields) {
                saveStatus = this.activity.logo.inStatusMatrix;
                this.activity.logo.inStatusMatrix = false;

                this.activity.logo.parseArg(this.activity.logo, t, statusField[0]);
                switch (blockList[statusField[0]].name) {
                    case "x":
                    case "y":
                    case "heading":
                        value = blockList[statusField[0]].value.toFixed(0);
                        break;
                    case "mynotevalue":
                        value = mixedNumber(blockList[statusField[0]].value);
                        break;
                    case "elapsednotes2":
                        blk = statusField[0];
                        cblk = blockList[blk].connections[1];
                        noteValue = this.activity.logo.parseArg(
                            this.activity.logo,
                            t,
                            cblk,
                            blk,
                            null
                        );
                        value =
                            mixedNumber(blockList[statusField[0]].value) +
                            " × " +
                            mixedNumber(noteValue);
                        break;
                    case "elapsednotes":
                        value = mixedNumber(blockList[statusField[0]].value);
                        break;
                    case "namedbox":
                        name = blockList[statusField[0]].privateData;
                        if (name in this.activity.logo.boxes) {
                            value = this.activity.logo.boxes[name];
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
                                freq = this.activity.logo.synth.getFrequency(
                                    notes[j],
                                    this.activity.logo.synth.changeInTemperament
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
                        value = blockList[statusField[0]].value;
                        break;
                    default:
                        value = blockList[statusField[0]].value;
                        break;
                }

                this.activity.logo.inStatusMatrix = saveStatus;

                // Use the cell map for faster access
                const cell = this._cellMap[i + 1][activeTurtles + 1];
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

                // Use the cell map for faster access to note row
                const cell = this._cellMap[i + 1][activeTurtles + 1];
                if (cell != null) {
                    cell.innerHTML = note.replace(/#/g, "♯").replace(/b/g, "♭");
                }
            }

            activeTurtles += 1;
            t++;
        }

        this.activity.logo.updatingStatusMatrix = false;
    }
}
