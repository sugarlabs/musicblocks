// Copyright (c) 2026 Music Blocks contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   global

   _, docById, platformColor, SHARP, FLAT, i18nSolfege, toFraction, PITCHES3,
   SOLFEGENAMES, EIGHTHNOTEWIDTH, MATRIXSOLFEHEIGHT, MATRIXSOLFEWIDTH
*/
/*
   Global locations
    - js/utils/utils.js
        _, docById
    - js/utils/musicutils.js
        SHARP, FLAT, i18nSolfege, toFraction, PITCHES3, SOLFEGENAMES,
        EIGHTHNOTEWIDTH, MATRIXSOLFEHEIGHT, MATRIXSOLFEWIDTH
    - js/utils/platformstyle.js
        platformColor
*/

/* exported MusicKeyboardRendering */

/**
 * @file MusicKeyboardRendering.js
 * @description Drawing for the Music Keyboard widget: the piano keys and the note
 * table under them, the clickable cells that set notes, and sizing the widget window.
 */

const MusicKeyboardRendering = {
    /**
     * Adds the drawing methods to a MusicKeyboard instance.
     *
     * Call it with the instance as `this`:
     * `MusicKeyboardRendering.install.call(keyboard, deps)`. The methods keep the same
     * `this` binding they had inside the MusicKeyboard constructor.
     *
     * @param {Object} deps - Values from the MusicKeyboard constructor's scope.
     * @param {number} deps.FAKEBLOCKNUMBER - Block numbers at or above this are padding keys.
     * @param {number[]} deps.BLACKKEYS - Key codes for the black keys.
     * @param {number[]} deps.WHITEKEYS - Key codes for the white keys.
     * @param {number[]} deps.HERTZKEYS - Key codes for the hertz keys.
     * @param {Function} deps.resolveSynthNoteName - Maps a note name and octave to a synth note.
     * @param {number} deps.w - window.innerWidth when the widget was made.
     * @param {Function} deps.getSelectedNotes - Returns the current selectedNotes list,
     *     which the constructor replaces rather than mutates.
     * @returns {void}
     */
    install(deps) {
        const {
            FAKEBLOCKNUMBER,
            BLACKKEYS,
            WHITEKEYS,
            HERTZKEYS,
            resolveSynthNoteName,
            w,
            getSelectedNotes
        } = deps;

        // Black-key column indices that are gaps in the piano layout (no black
        // key between E-F and B-C) and are rendered as invisible spacers.
        const BLACKKEY_SPACER_INDICES = [
            2, 6, 9, 13, 16, 20, 23, 27, 30, 34, 37, 41, 44, 48, 51, 55, 58, 62
        ];

        const setKeyboardCellLabel = (cell, label, octave, prefix = null) => {
            cell.replaceChildren();
            if (prefix !== null) {
                const small = document.createElement("small");
                small.textContent = `(${prefix})`;
                cell.append(small, document.createElement("br"));
            }
            cell.append(document.createTextNode(`${label}${octave}`));
        };

        // Appends an already-created (id already set) <td> to a black-key row as
        // an invisible spacer occupying a gap position in the piano layout.
        const appendSpacerKey = (parentEl, keyElement) => {
            parentEl.appendChild(keyElement);
            keyElement.style.background = "transparent";
            keyElement.style.border = "none";
            keyElement.style.zIndex = "10";
            keyElement.style.position = "relative";
        };

        /**
         * Sets notes in a specified column based on cell color markings.
         * Removes existing notes starting at the specified start time.
         *
         * @param {number} colIndex - The index of the column to set notes in.
         * @param {boolean} playNote - Indicates whether to trigger note playback.
         */
        this._setNotes = function (colIndex, playNote) {
            const start = docById("cells-" + colIndex).getAttribute("start");

            this._notesPlayed = this._notesPlayed.filter(function (ele) {
                return ele.startTime !== parseInt(start, 10);
            });

            // Look for each cell that is marked in this column.
            let silence = true;
            let row, cell, ele, dur;
            for (let j = 0; j < this.layout.length; j++) {
                row = docById("mkb" + j);
                cell = row.cells[colIndex];
                if (cell.style.backgroundColor === "black") {
                    this._setNoteCell(j, colIndex, start, playNote);
                    silence = false;
                }
            }

            if (silence) {
                ele = docById("cells-" + colIndex);
                dur = ele.getAttribute("dur");
                this._notesPlayed.push({
                    startTime: parseInt(start, 10),
                    noteOctave: "R",
                    objId: null,
                    duration: parseFloat(dur)
                });
                this._notesPlayed.sort(function (a, b) {
                    return a.startTime - b.startTime;
                });
            }
        };

        /**
         * Sets a note cell based on the provided parameters.
         *
         * @param {number} j - The row index of the note cell.
         * @param {number} colIndex - The column index of the note cell.
         * @param {string} start - The start time of the note.
         * @param {boolean} playNote - Indicates whether to trigger note playback.
         */
        this._setNoteCell = function (j, colIndex, start, playNote) {
            const n = this.layout.length;
            const temp1 = this.layout[n - j - 1].noteName;
            let temp2;
            if (temp1 === "hertz") {
                temp2 = this.layout[n - j - 1].noteOctave;
            } else if (temp1 === "drum") {
                temp2 = "c2";
            } else {
                temp2 = resolveSynthNoteName(temp1, this.layout[n - j - 1].noteOctave);
            }

            const ele = docById(j + ":" + colIndex);
            this._notesPlayed.push({
                startTime: parseInt(start, 10),
                noteOctave: temp2,
                blockNumber: this.layout[n - j - 1].blockNumber,
                duration: parseFloat(ele.getAttribute("alt")),
                objId: this.displayLayout[n - j - 1].objId,
                voice: this.displayLayout[n - j - 1].voice
            });

            this._notesPlayed.sort(function (a, b) {
                return a.startTime - b.startTime;
            });

            if (playNote) {
                this.activity.logo.synth.trigger(
                    0,
                    temp2,
                    ele.getAttribute("alt"),
                    this.instruments[0],
                    null,
                    null
                );
            }
        };

        /**
         * Makes the music keyboard cells clickable for interaction.
         * Handles mouse events such as click, mouseover, and mouseup on the keyboard cells.
         * Triggers the creation of pie submenu based on the clicked cell attributes.
         */
        this.makeClickable = function () {
            const selectedNotes = getSelectedNotes();
            const rowNote = docById("mkbNoteDurationRow");
            let cell;

            for (let i = 0; i < selectedNotes.length; i++) {
                cell = rowNote.cells[i];

                cell.onclick = event => {
                    cell = event.target;
                    this._createpiesubmenu(
                        cell.getAttribute("id"),
                        cell.getAttribute("start"),
                        cell.getAttribute("dur")
                    );
                };
            }

            let row, isMouseDown;
            for (let i = 0; i < this.layout.length; i++) {
                // The buttons get added to the embedded table.
                row = docById("mkb" + i);
                for (let j = 0; j < row.cells.length; j++) {
                    cell = row.cells[j];
                    // Give each clickable cell a unique id
                    cell.setAttribute("id", i + ":" + j);

                    isMouseDown = false;

                    cell.onmousedown = e => {
                        cell = e.target;
                        isMouseDown = true;
                        const obj = cell.id.split(":");
                        const j = Number(obj[1]);
                        if (cell.style.backgroundColor === "black") {
                            cell.style.backgroundColor = cell.getAttribute("cellColor");
                            this._setNotes(j, false);
                        } else {
                            cell.style.backgroundColor = "black";
                            this._setNotes(j, true);
                        }
                    };

                    cell.onmouseover = () => {
                        if (isMouseDown) {
                            if (cell.style.backgroundColor === "black") {
                                cell.style.backgroundColor = cell.getAttribute("cellColor");
                                this._setNotes(j, false);
                            } else {
                                cell.style.backgroundColor = "black";
                                this._setNotes(j, true);
                            }
                        }
                    };

                    cell.onmouseup = function () {
                        isMouseDown = false;
                    };
                }
            }
        };

        /**
         * Update the widget window size based on whether it is maximized or not.
         */
        this._updateWidgetWindowSize = function () {
            const outerDiv = docById("mkbOuterDiv");
            if (!outerDiv) return;

            if (this.widgetWindow._maximized) {
                this.widgetWindow.getWidgetBody().style.position = "absolute";
                this.widgetWindow.getWidgetBody().style.height = "calc(100vh - 64px)";
                this.widgetWindow.getWidgetBody().style.width = "200vh";
                outerDiv.style.maxHeight = "725px";
                outerDiv.style.height = "calc(100vh - 64px)";
                outerDiv.style.width = "calc(200vh - 64px)";

                const keyboardHolder = docById("keyboardHolder2");
                if (keyboardHolder) {
                    keyboardHolder.style.width = "calc(200vh - 64px)";
                }

                const innerDiv = docById("mkbInnerDiv");
                if (innerDiv) {
                    innerDiv.style.width = "95.5vw";
                    innerDiv.style.height = "auto";
                    innerDiv.scrollLeft = innerDiv.scrollWidth;
                }

                this.widgetWindow.getWidgetBody().style.left = "60px";
            } else {
                outerDiv.style.maxHeight = "400px";
                this.widgetWindow.getWidgetBody().style.position = "relative";
                this.widgetWindow.getWidgetBody().style.left = "0px";
                this.widgetWindow.getWidgetBody().style.height = "550px";
                this.widgetWindow.getWidgetBody().style.width = "1000px";
                outerDiv.style.width = w + "px";

                const innerDiv = docById("mkbInnerDiv");
                if (innerDiv) {
                    innerDiv.style.height = "auto";
                }
            }
        };

        /**
         * Calculates the width of a note based on its value.
         * @param {number} noteValue - The value of the note.
         * @returns {number} The width of the note.
         */
        this._noteWidth = function (noteValue) {
            return Math.max(Math.floor(EIGHTHNOTEWIDTH * (8 * noteValue) * this._cellScale), 15);
        };

        /**
         * Creates the table structure for the music keyboard interface based on the selected notes.
         * Updates the display of the keyboard layout with appropriate styles and dimensions.
         */
        this._createTable = function () {
            this.processSelected();
            // processSelected() replaces selectedNotes, so read it afterwards.
            const selectedNotes = getSelectedNotes();
            const mkbTableDiv = this.keyTable;
            mkbTableDiv.style.display = "inline";
            mkbTableDiv.style.visibility = "visible";
            mkbTableDiv.style.border = "0px";
            mkbTableDiv.style.width = "700px";

            mkbTableDiv.replaceChildren();
            const outerDiv = document.createElement("div");
            outerDiv.id = "mkbOuterDiv";
            const innerDiv = document.createElement("div");
            innerDiv.id = "mkbInnerDiv";
            const mkbTable = document.createElement("table");
            mkbTable.id = "mkbTable";
            mkbTable.setAttribute("cellpadding", "0px");
            innerDiv.append(mkbTable);
            outerDiv.append(innerDiv);
            mkbTableDiv.append(outerDiv);

            let n = Math.max(Math.floor((window.innerHeight * 0.5) / 100), 8);

            outerDiv.style.overflowY = "auto";
            outerDiv.style.overflowX = "auto";
            if (this.displayLayout.length > n) {
                outerDiv.style.height = this._cellScale * MATRIXSOLFEHEIGHT * (n + 5) + "px";
            } else {
                outerDiv.style.height =
                    this._cellScale * MATRIXSOLFEHEIGHT * (this.displayLayout.length + 4) + "px";
            }

            outerDiv.style.backgroundColor = "white";
            outerDiv.style.marginTop = "15px";

            docById("mkbInnerDiv").style.marginLeft = 0;

            if (selectedNotes.length < 1) {
                outerDiv.replaceChildren();
                return;
            }

            let j = 0;
            n = this.displayLayout.length;
            let mkbTableRow, cell, mkbCell, mkbCellTable;
            for (let i = this.displayLayout.length - 1; i >= 0; i--) {
                mkbTableRow = mkbTable.insertRow();
                cell = mkbTableRow.insertCell();
                cell.style.backgroundColor = platformColor.graphicsLabelBackground;
                cell.style.fontSize = this._cellScale * 100 + "%";
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
                cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
                cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
                cell.style.maxWidth = cell.style.minWidth;
                cell.style.position = "sticky";
                cell.style.left = "0px";
                cell.className = "headcol"; // This cell is fixed horizontally.
                if (this.displayLayout[i].noteName === "drum") {
                    cell.textContent = this.displayLayout[i].voice;
                } else if (this.displayLayout[i].noteName === "hertz") {
                    cell.textContent = this.displayLayout[i].noteOctave.toString() + "HZ";
                } else {
                    cell.textContent = `${i18nSolfege(
                        this.displayLayout[i].noteName
                    )}${this.displayLayout[i].noteOctave.toString()}`;
                }

                cell.setAttribute("id", "labelcol" + (n - i - 1));
                if (this.displayLayout[i].noteName === "hertz") {
                    cell.setAttribute("alt", n - i - 1 + "__" + "synthsblocks");
                } else {
                    cell.setAttribute("alt", n - i - 1 + "__" + "pitchblocks");
                }

                cell.onclick = event => {
                    cell = event.target;
                    if (cell.getAttribute("alt") === null) {
                        cell = cell.parentNode;
                    }

                    const index = cell.getAttribute("alt").split("__")[0];
                    const condition = cell.getAttribute("alt").split("__")[1];
                    this._createColumnPieSubmenu(index, condition);
                };

                mkbCell = mkbTableRow.insertCell();
                // Create tables to store individual notes.
                const cellTable = document.createElement("table");
                cellTable.setAttribute("cellpadding", "0px");
                cellTable.id = `mkbCellTable${j}`;
                mkbCell.append(cellTable);
                mkbCellTable = docById("mkbCellTable" + j);
                mkbCellTable.style.marginTop = "-1px";

                // We'll use this element to put the clickable notes for this row.
                const mkbRow = mkbCellTable.insertRow();
                mkbRow.setAttribute("id", "mkb" + j);
                j += 1;
            }

            mkbTableRow = mkbTable.insertRow();
            mkbTableRow.style.position = "sticky";
            mkbTableRow.style.bottom = "0px";
            cell = mkbTableRow.insertCell();
            cell.style.backgroundColor = platformColor.graphicsLabelBackground;
            cell.style.fontSize = this._cellScale * 100 + "%";
            cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
            cell.style.width = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
            cell.style.minWidth = Math.floor(MATRIXSOLFEWIDTH * this._cellScale) * 1.5 + "px";
            cell.style.maxWidth = cell.style.minWidth;
            cell.className = "headcol"; // This cell is fixed horizontally.
            cell.textContent = _("Note value");
            cell.style.position = "sticky";
            cell.style.left = "0px";
            cell.style.zIndex = "1";

            const newCell = mkbTableRow.insertCell();
            const noteDurationTable = document.createElement("table");
            noteDurationTable.className = "mkbTable";
            noteDurationTable.setAttribute("cellpadding", "0px");
            const noteDurationRow = document.createElement("tr");
            noteDurationRow.id = "mkbNoteDurationRow";
            noteDurationTable.append(noteDurationRow);
            newCell.append(noteDurationTable);
            const cellColor = "lightgrey";
            let maxWidth, noteMaxWidth, row, ind, dur;
            for (let j = 0; j < selectedNotes.length; j++) {
                maxWidth = Math.max.apply(Math, selectedNotes[j].duration);
                noteMaxWidth =
                    this._noteWidth(Math.max.apply(Math, selectedNotes[j].duration)) * 2 + "px";
                n = this.displayLayout.length;
                for (let i = 0; i < this.displayLayout.length; i++) {
                    row = docById("mkb" + i);
                    cell = row.insertCell();
                    cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
                    cell.style.width = noteMaxWidth;
                    cell.style.minWidth = cell.style.width;
                    cell.style.maxWidth = cell.style.width;

                    if (
                        selectedNotes[j].blockNumber.includes(
                            this.displayLayout[n - i - 1].blockNumber
                        )
                    ) {
                        ind = selectedNotes[j].blockNumber.indexOf(
                            this.displayLayout[n - i - 1].blockNumber
                        );
                        cell.setAttribute("alt", selectedNotes[j].duration[ind]);
                        cell.style.backgroundColor = "black";
                        cell.style.border = "2px solid white";
                        cell.style.borderRadius = "10px";
                    } else {
                        cell.setAttribute("alt", maxWidth);
                        cell.style.backgroundColor = cellColor;
                        cell.style.border = "2px solid white";
                        cell.style.borderRadius = "10px";
                    }

                    cell.setAttribute("cellColor", cellColor);
                }

                dur = toFraction(Math.max.apply(Math, selectedNotes[j].duration));
                row = docById("mkbNoteDurationRow");
                cell = row.insertCell();
                cell.style.height = Math.floor(MATRIXSOLFEHEIGHT * this._cellScale) + 1 + "px";
                cell.style.width = noteMaxWidth;
                cell.style.minWidth = cell.style.width;
                cell.style.maxWidth = cell.style.width;
                cell.style.lineHeight = 60 + "%";
                cell.style.textAlign = "center";
                cell.textContent = `${dur[0].toString()}/${dur[1].toString()}`;
                cell.setAttribute("id", "cells-" + j);
                cell.setAttribute("start", selectedNotes[j].startTime);
                cell.setAttribute("dur", maxWidth);
                cell.style.backgroundColor = platformColor.rhythmcellcolor;
                cell.style.color = platformColor.textColor;
            }

            innerDiv.scrollLeft = innerDiv.scrollWidth; // Force to the right.
            this.makeClickable();
            this._updateWidgetWindowSize();
        };

        /**
         * Creates a virtual musical keyboard interface.
         * This function generates and displays a keyboard layout with keys represented as HTML elements.
         * It sets up event handling for key presses on the keyboard.
         */
        this._createKeyboard = function () {
            this._cacheDocumentKeyHandlers();
            document.onkeydown = null;
            const mkbKeyboardDiv = this.keyboardDiv;
            mkbKeyboardDiv.style.display = "flex";
            mkbKeyboardDiv.style.visibility = "visible";
            mkbKeyboardDiv.style.border = "0px";
            mkbKeyboardDiv.style.width = "100%";
            mkbKeyboardDiv.style.top = "0px";
            mkbKeyboardDiv.style.overflow = "auto";
            mkbKeyboardDiv.style.userSelect = "none";
            mkbKeyboardDiv.style.webkitUserSelect = "none"; // Safari/Chrome
            mkbKeyboardDiv.style.msUserSelect = "none"; // Edge
            mkbKeyboardDiv.replaceChildren();
            const keyboardHolder2 = document.createElement("div");
            keyboardHolder2.id = "keyboardHolder2";
            const whiteTable = document.createElement("table");
            whiteTable.className = "white";
            const whiteRow = document.createElement("tr");
            whiteRow.id = "myrow";
            whiteTable.createTBody().append(whiteRow);
            const blackTable = document.createElement("table");
            blackTable.className = "black";
            const blackRowElement = document.createElement("tr");
            blackRowElement.id = "myrow2";
            blackTable.createTBody().append(blackRowElement);
            keyboardHolder2.append(whiteTable, blackTable);
            mkbKeyboardDiv.append(keyboardHolder2);

            keyboardHolder2.style.bottom = "10px";
            keyboardHolder2.style.left = "0px";
            keyboardHolder2.style.height = "145px";
            keyboardHolder2.style.backgroundColor = "white";
            const blackTables = document.getElementsByClassName("black");
            blackTables[0].style.top = "1px";
            blackTables[0].style.borderSpacing = "0px 0px 20px";
            blackTables[0].style.borderCollapse = "separate";

            whiteRow.replaceChildren();
            blackRowElement.replaceChildren();

            // For the button callbacks

            if (this.noteNames.length === 0) {
                for (let i = 0; i < PITCHES3.length; i++) {
                    this.noteNames.push(PITCHES3[i]);
                    this.octaves.push(4);
                    if (i === 4) {
                        this.noteNames.push(null); // missing black key
                        this.octaves.push(4);
                    }
                }

                this.noteNames.push(PITCHES3[0]);
                this.octaves.push(5);
            }
            this.idContainer = [];
            let myrowId = 0;
            let myrow2Id = 0;
            let myrow3Id = 0;

            let parenttbl = document.getElementById("myrow");
            let parenttbl2 = document.getElementById("myrow2");
            let newel, newel2, nname;

            for (let p = 0; p < this.displayLayout.length; p++) {
                // If the blockNumber is null, don't add a label.
                if (this.displayLayout[p].noteName > FAKEBLOCKNUMBER) {
                    newel2 = document.createElement("td");
                    newel2.setAttribute("id", "blackRow" + myrow2Id.toString());
                    if (BLACKKEY_SPACER_INDICES.includes(myrow2Id)) {
                        appendSpacerKey(parenttbl2, newel2);
                        p--;
                        myrow2Id++;
                        continue;
                    }

                    newel2.setAttribute(
                        "alt",
                        this.displayLayout[p].noteName +
                            "__" +
                            this.displayLayout[p].noteOctave +
                            "__" +
                            this.displayLayout[p].blockNumber
                    );
                    this.idContainer.push([
                        "blackRow" + myrow2Id.toString(),
                        this.displayLayout[p].blockNumber
                    ]);

                    this.displayLayout[p].objId = "blackRow" + myrow2Id.toString();
                    if (this.layout[p]) {
                        this.layout[p].objId = "blackRow" + myrow2Id.toString();
                    }

                    myrow2Id++;
                    newel2.textContent = "";
                    newel2.style.visibility = "hidden";
                    parenttbl2.appendChild(newel2);
                } else if (this.displayLayout[p].noteName === "drum") {
                    newel = document.createElement("td");
                    newel.style.textAlign = "center";
                    newel.setAttribute("id", "whiteRow" + myrowId.toString());
                    newel.setAttribute(
                        "alt",
                        this.displayLayout[p].noteName +
                            "__" +
                            this.displayLayout[p].voice +
                            "__" +
                            this.displayLayout[p].blockNumber
                    );
                    this.idContainer.push([
                        "whiteRow" + myrowId.toString(),
                        this.displayLayout[p].blockNumber
                    ]);
                    setKeyboardCellLabel(
                        newel,
                        this.displayLayout[p].voice,
                        "",
                        myrowId < WHITEKEYS.length ? String.fromCharCode(WHITEKEYS[myrowId]) : null
                    );

                    this.displayLayout[p].objId = "whiteRow" + myrowId.toString();

                    myrowId++;
                    newel.style.position = "relative";
                    newel.style.zIndex = "100";
                    parenttbl.appendChild(newel);
                } else if (this.displayLayout[p].noteName === "hertz") {
                    newel = document.createElement("td");
                    newel.style.textAlign = "center";
                    newel.setAttribute("id", "hertzRow" + myrow3Id.toString());
                    newel.setAttribute(
                        "alt",
                        this.displayLayout[p].noteName +
                            "__" +
                            this.displayLayout[p].noteOctave +
                            "__" +
                            this.displayLayout[p].blockNumber
                    );
                    this.idContainer.push([
                        "hertzRow" + myrow3Id.toString(),
                        this.displayLayout[p].blockNumber
                    ]);
                    setKeyboardCellLabel(
                        newel,
                        "",
                        this.displayLayout[p].noteOctave,
                        myrow3Id < HERTZKEYS.length
                            ? String.fromCharCode(HERTZKEYS[myrow3Id])
                            : null
                    );

                    this.displayLayout[p].objId = "hertzRow" + myrow3Id.toString();

                    myrow3Id++;
                    newel.style.position = "relative";
                    newel.style.zIndex = "100";
                    parenttbl.appendChild(newel);
                } else if (
                    this.displayLayout[p].noteName.includes(SHARP) ||
                    this.displayLayout[p].noteName.includes("#")
                ) {
                    newel2 = document.createElement("td");
                    newel2.setAttribute("id", "blackRow" + myrow2Id.toString());
                    newel2.style.textAlign = "center";
                    if (BLACKKEY_SPACER_INDICES.includes(myrow2Id)) {
                        appendSpacerKey(parenttbl2, newel2);
                        p--;
                        myrow2Id++;
                        continue;
                    }

                    newel2.setAttribute(
                        "alt",
                        this.displayLayout[p].noteName +
                            "__" +
                            this.displayLayout[p].noteOctave +
                            "__" +
                            this.displayLayout[p].blockNumber
                    );
                    this.idContainer.push([
                        "blackRow" + myrow2Id.toString(),
                        this.displayLayout[p].blockNumber
                    ]);

                    nname = this.displayLayout[p].noteName.replace(SHARP, "").replace("#", "");
                    if (this.displayLayout[p].blockNumber >= FAKEBLOCKNUMBER) {
                        setKeyboardCellLabel(
                            newel2,
                            "",
                            "",
                            myrow2Id < BLACKKEYS.length
                                ? String.fromCharCode(BLACKKEYS[myrow2Id])
                                : null
                        );
                    } else if (SOLFEGENAMES.includes(nname)) {
                        setKeyboardCellLabel(
                            newel2,
                            `${i18nSolfege(nname)}${SHARP}`,
                            this.displayLayout[p].noteOctave,
                            myrow2Id < BLACKKEYS.length
                                ? String.fromCharCode(BLACKKEYS[myrow2Id])
                                : null
                        );
                    } else {
                        setKeyboardCellLabel(
                            newel2,
                            this.displayLayout[p].noteName,
                            this.displayLayout[p].noteOctave,
                            myrow2Id < BLACKKEYS.length
                                ? String.fromCharCode(BLACKKEYS[myrow2Id])
                                : null
                        );
                    }
                    this.displayLayout[p].objId = "blackRow" + myrow2Id.toString();
                    if (this.layout[p]) {
                        this.layout[p].objId = "blackRow" + myrow2Id.toString();
                    }

                    myrow2Id++;
                    newel2.style.position = "relative";
                    newel2.style.zIndex = "200";
                    parenttbl2.appendChild(newel2);
                } else if (
                    this.displayLayout[p].noteName.includes(FLAT) ||
                    this.displayLayout[p].noteName.includes("b")
                ) {
                    newel2 = document.createElement("td");
                    newel2.setAttribute("id", "blackRow" + myrow2Id.toString());
                    newel2.style.textAlign = "center";
                    if (BLACKKEY_SPACER_INDICES.includes(myrow2Id)) {
                        appendSpacerKey(parenttbl2, newel2);
                        p--;
                        myrow2Id++;
                        continue;
                    }

                    /**
                     * Sets up the HTML elements for the virtual musical keyboard layout.
                     * This function creates HTML elements to represent the keys of a musical keyboard based on the specified display layout.
                     * Each key element is configured with appropriate attributes and content based on note information.
                     */
                    newel2.setAttribute(
                        "alt",
                        this.displayLayout[p].noteName +
                            "__" +
                            this.displayLayout[p].noteOctave +
                            "__" +
                            this.displayLayout[p].blockNumber
                    );
                    this.idContainer.push([
                        "blackRow" + myrow2Id.toString(),
                        this.displayLayout[p].blockNumber
                    ]);
                    nname = this.displayLayout[p].noteName.replace(FLAT, "").replace("b", "");
                    if (this.displayLayout[p].blockNumber <= FAKEBLOCKNUMBER) {
                        if (SOLFEGENAMES.includes(nname)) {
                            setKeyboardCellLabel(
                                newel2,
                                `${i18nSolfege(nname)}${FLAT}`,
                                this.displayLayout[p].noteOctave,
                                String.fromCharCode(BLACKKEYS[myrow2Id])
                            );
                        } else {
                            setKeyboardCellLabel(
                                newel2,
                                this.displayLayout[p].noteName,
                                this.displayLayout[p].noteOctave,
                                String.fromCharCode(BLACKKEYS[myrow2Id])
                            );
                        }
                    }
                    this.displayLayout[p].objId = "blackRow" + myrow2Id.toString();
                    if (this.layout[p]) {
                        this.layout[p].objId = "blackRow" + myrow2Id.toString();
                    }

                    myrow2Id++;
                    newel2.style.position = "relative";
                    newel2.style.zIndex = "200";
                    parenttbl2.appendChild(newel2);
                } else {
                    newel = document.createElement("td");
                    newel.setAttribute("id", "whiteRow" + myrowId.toString());
                    newel.style.textAlign = "center";
                    newel.setAttribute(
                        "alt",
                        this.displayLayout[p].noteName +
                            "__" +
                            this.displayLayout[p].noteOctave +
                            "__" +
                            this.displayLayout[p].blockNumber
                    );
                    this.idContainer.push([
                        "whiteRow" + myrowId.toString(),
                        this.displayLayout[p].blockNumber
                    ]);

                    if (this.displayLayout[p].blockNumber <= FAKEBLOCKNUMBER) {
                        if (SOLFEGENAMES.includes(this.displayLayout[p].noteName)) {
                            setKeyboardCellLabel(
                                newel,
                                i18nSolfege(this.displayLayout[p].noteName),
                                this.displayLayout[p].noteOctave,
                                myrowId < WHITEKEYS.length
                                    ? String.fromCharCode(WHITEKEYS[myrowId])
                                    : null
                            );
                        } else {
                            setKeyboardCellLabel(
                                newel,
                                this.displayLayout[p].noteName,
                                this.displayLayout[p].noteOctave,
                                myrowId < WHITEKEYS.length
                                    ? String.fromCharCode(WHITEKEYS[myrowId])
                                    : null
                            );
                        }
                    }
                    this.displayLayout[p].objId = "whiteRow" + myrowId.toString();
                    if (this.layout[p]) {
                        this.layout[p].objId = "whiteRow" + myrowId.toString();
                    }

                    myrowId++;
                    newel.style.position = "relative";
                    newel.style.zIndex = "100";
                    parenttbl.appendChild(newel);
                }
            }
            newel = document.createElement("td");
            parenttbl.appendChild(newel);
            newel.style.textAlign = "center";
            newel.setAttribute("id", "rest");
            newel.setAttribute("alt", "R__");
            setKeyboardCellLabel(newel, "", "", _("rest"));
            newel.style.position = "relative";
            newel.style.zIndex = "100";

            for (let i = 0; i < this.idContainer.length; i++) {
                // If the blockNumber is null, don't make the key clickable.
                if (this.displayLayout[i].blockNumber === null) {
                    continue;
                }
                this.loadHandler(
                    document.getElementById(this.idContainer[i][0]),
                    i,
                    this.idContainer[i][1],
                    this.displayLayout
                );
            }

            this.addKeyboardShortcuts();
        };
    }
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = MusicKeyboardRendering;
}
