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

function ModeWidget() {
    const ROTATESPEED = 125;
    const BUTTONDIVWIDTH = 535;
    const BUTTONSIZE = 53;
    const ICONSIZE = 32;

    this.init = function(logo, modeBlock) {
        this._logo = logo;
        this._modeBlock = modeBlock;
        this._locked = false;
        this._pitch = this._logo.turtles.ithTurtle(0).singer.keySignature[0];
        this._noteValue = 0.333;
        this._undoStack = [];
        this._playing = false;
        this._selectedNotes = [];
        this._newPattern = [];

        let w = window.innerWidth;
        this._cellScale = w / 1200;
        let iconSize = ICONSIZE * this._cellScale;

        let widgetWindow = window.widgetWindows.windowFor(this, "custom mode");
        this.widgetWindow = widgetWindow;
        widgetWindow.clear();
	widgetWindow.show();

        // For the button callbacks
        let that = this;

        this.modeTableDiv = document.createElement("div");
        widgetWindow.getWidgetBody().append(this.modeTableDiv);

        widgetWindow.onclose = function() {
            that._logo.hideMsgs();
            this.destroy();
        };

        this._playButton = widgetWindow.addButton(
            "play-button.svg",
            ICONSIZE,
            _("Play")
        );
        this._playButton.onclick = function() {
            that._logo.resetSynth(0);
            if (that._playingStatus()) {
                that._playing = false;

                this.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                    _("Play all") +
                    '" alt="' +
                    _("Play all") +
                    '" height="' +
                    ICONSIZE +
                    '" width="' +
                    ICONSIZE +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else {
                that._playing = true;

                this.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/stop-button.svg" title="' +
                    _("Stop") +
                    '" alt="' +
                    _("Stop") +
                    '" height="' +
                    ICONSIZE +
                    '" width="' +
                    ICONSIZE +
                    '" vertical-align="middle">&nbsp;&nbsp;';

                that._playAll();
            }
        };

        widgetWindow.addButton(
            "export-chunk.svg",
            ICONSIZE,
            _("Save")
        ).onclick = function() {
            that._save();
        };

        widgetWindow.addButton(
            "erase-button.svg",
            ICONSIZE,
            _("Clear")
        ).onclick = function() {
            that._clear();
        };

        widgetWindow.addButton(
            "rotate-left.svg",
            ICONSIZE,
            _("Rotate counter clockwise")
        ).onclick = function() {
            that._rotateLeft();
        };

        widgetWindow.addButton(
            "rotate-right.svg",
            ICONSIZE,
            _("Rotate clockwise")
        ).onclick = function() {
            that._rotateRight();
        };

        widgetWindow.addButton(
            "invert.svg",
            ICONSIZE,
            _("Invert")
        ).onclick = function() {
            that._invert();
        };

        widgetWindow.addButton(
            "restore-button.svg",
            ICONSIZE,
            _("Undo")
        ).onclick = function() {
            that._undo();
        };

        // The mode table (holds a pie menu and a label)
        let modeTableDiv = this.modeTableDiv;
        modeTableDiv.style.display = "inline";
        modeTableDiv.style.visibility = "visible";
        modeTableDiv.style.border = "0px";
        // modeTableDiv.innerHTML = '<table id="modeTable"></table>';
        modeTableDiv.innerHTML = '<div id="meterWheelDiv"></div>';
        modeTableDiv.innerHTML += '<div id="modePianoDiv" class=""></div>';
        modeTableDiv.innerHTML += '<table id="modeTable"></table>';

        this._piemenuMode();

        let table = docById("modeTable");

        /*
        // Set up the pie menu
        let row = table.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = '<div id="meterWheelDiv"></div>';
        */
        // A row for the current mode label
        let row = table.insertRow();
        let cell = row.insertCell();
        // cell.colSpan = 18;
        cell.innerHTML = "&nbsp;";
        cell.style.backgroundColor = platformColor.selectorBackground;

        // Set current mode in pie menu.
        this._setMode();

        //.TRANS: A circle of notes represents the musical mode.
        this._logo.textMsg(
            _("Click in the circle to select notes for the mode.")
        );
        widgetWindow.sendToCenter();
    };

    this._playingStatus = function() {
        return this._playing;
    };

    this._addButton = function(row, icon, iconSize, label) {
        let cell = row.insertCell(-1);
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

    this._setMode = function() {
        // Read in the current mode to start
        let currentModeName =
            keySignatureToMode(this._logo.turtles.ithTurtle(0).singer.keySignature);
        let currentMode = MUSICALMODES[currentModeName[1]];

        // Add the mode name in the bottom row of the table.
        let table = docById("modeTable");
        let n = table.rows.length - 1;

        console.debug(_(currentModeName[1]));
        let name = currentModeName[0] + " " + _(currentModeName[1]);
        table.rows[n].cells[0].innerHTML = name;
        this.widgetWindow.updateTitle(name);

        // Set the notes for this mode.
        let that = this;
        let k = 0;
        let j = 0;
        for (let i = 0; i < 12; i++) {
            if (i === j) {
                this._noteWheel.navItems[i].navItem.show();
                this._selectedNotes[i] = true;
                j += currentMode[k];
                k += 1;
            } else {
                this._noteWheel.navItems[i].navItem.hide();
            }
        }

        if (currentModeName[0] === "C") {
            this._showPiano();
        }
    };

    this._showPiano = function() {
        let modePianoDiv = docById("modePianoDiv");
        modePianoDiv.style.display = "inline";
        modePianoDiv.style.visibility = "visible";
        modePianoDiv.style.border = "0px";
        modePianoDiv.style.top = "0px";
        modePianoDiv.style.left = "0px";
        modePianoDiv.innerHTML =
            '<img src="images/piano_keys.png"  id="modeKeyboard" style="top:0px; left:0px; position:relative;">';
        let highlightImgs = [
            "images/highlights/sel_c.png",
            "images/highlights/sel_c_sharp.png",
            "images/highlights/sel_d.png",
            "images/highlights/sel_d_sharp.png",
            "images/highlights/sel_e.png",
            "images/highlights/sel_f.png",
            "images/highlights/sel_f_sharp.png",
            "images/highlights/sel_g.png",
            "images/highlights/sel_g_sharp.png",
            "images/highlights/sel_a.png",
            "images/highlights/sel_a_sharp.png",
            "images/highlights/sel_b.png"
        ];
        let currentModeName =
            keySignatureToMode(this._logo.turtles.ithTurtle(0).singer.keySignature);
        let letterName = currentModeName[0];
        let modeName = currentModeName[1];

        let startDict = {
            "C♭": 11,
            C: 0,
            "C♯": 1,
            "D♭": 1,
            D: 2,
            "D♯": 3,
            "E♭": 3,
            E: 4,
            "E♯": 5,
            "F♭": 4,
            F: 5,
            "F♯": 6,
            "G♭": 6,
            G: 7,
            "G♯": 8,
            "A♭": 8,
            A: 9,
            "A♯": 10,
            "A♭": 10,
            B: 11,
            "B♯": 0
        };
        let startingPosition;
        if (letterName in startDict) {
            startingPosition = startDict[letterName];
        } else {
            startingPosition = 0;
        }

        modePianoDiv.innerHTML +=
            '<img id="pkey_0" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_1" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_2" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_3" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_4" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_5" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_6" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_7" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_8" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_9" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_10" style="top:404px; left:0px; position:absolute;">';
        modePianoDiv.innerHTML +=
            '<img id="pkey_11" style="top:404px; left:0px; position:absolute;">';

        for (let i = 0; i < 12; ++i) {
            if (this._selectedNotes[i])
                document.getElementById("pkey_" + i).src =
                    highlightImgs[(i + startingPosition) % 12];
        }
    };

    this._invert = function() {
        if (this._locked) {
            return;
        }

        this._locked = true;

        this._saveState();
        this.__invertOnePair(1);
        let currentModeName =
            keySignatureToMode(this._logo.turtles.ithTurtle(0).singer.keySignature);
        if (currentModeName[0] === "C") {
            this._showPiano();
        }
    };

    this.__invertOnePair = function(i) {
        let tmp = this._selectedNotes[i];
        this._selectedNotes[i] = this._selectedNotes[12 - i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show();
        } else {
            this._noteWheel.navItems[i].navItem.hide();
        }

        this._selectedNotes[12 - i] = tmp;
        if (this._selectedNotes[12 - i]) {
            this._noteWheel.navItems[12 - i].navItem.show();
        } else {
            this._noteWheel.navItems[12 - i].navItem.hide();
        }

        if (i === 5) {
            this._saveState();
            this._setModeName();
            let currentModeName = keySignatureToMode(
                this._logo.turtles.ithTurtle(0).singer.keySignature
            );
            if (currentModeName[0] === "C") {
                this._showPiano();
            }
            this._locked = false;
        } else {
            let that = this;

            setTimeout(function() {
                that.__invertOnePair(i + 1);
            }, ROTATESPEED);
        }
    };

    this._resetNotes = function() {
        for (let i = 0; i < this._selectedNotes.length; i++) {
            if (this._selectedNotes[i]) {
                this._noteWheel.navItems[i].navItem.show();
            } else {
                this._noteWheel.navItems[i].navItem.hide();
            }

            this._playWheel.navItems[i].navItem.hide();
        }
    };

    this._rotateRight = function() {
        if (this._locked) {
            return;
        }

        this._locked = true;

        this._saveState();
        this._newPattern = [];
        this._newPattern.push(this._selectedNotes[11]);
        for (let i = 0; i < 11; i++) {
            this._newPattern.push(this._selectedNotes[i]);
        }

        this.__rotateRightOneCell(1);
    };

    this.__rotateRightOneCell = function(i, cellColors) {
        this._selectedNotes[i] = this._newPattern[i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show();
        } else {
            this._noteWheel.navItems[i].navItem.hide();
        }

        let that = this;

        if (i === 0) {
            setTimeout(function() {
                if (that._selectedNotes[0]) {
                    // We are done.
                    that._saveState();
                    that._setModeName();
                    let currentModeName = keySignatureToMode(
                        that._logo.turtles.ithTurtle(0).singer.keySignature
                    );
                    if (currentModeName[0] === "C") {
                        that._showPiano();
                    }
                    that._locked = false;
                } else {
                    // Keep going until first note is selected.
                    that._locked = false;
                    that._rotateRight();
                }
            }, ROTATESPEED);
        } else {
            setTimeout(function() {
                that.__rotateRightOneCell((i + 1) % 12);
            }, ROTATESPEED);
        }
    };

    this._rotateLeft = function() {
        if (this._locked) {
            return;
        }

        this._locked = true;

        this._saveState();
        this._newPattern = [];
        for (let i = 1; i < 12; i++) {
            this._newPattern.push(this._selectedNotes[i]);
        }

        this._newPattern.push(this._selectedNotes[0]);

        this.__rotateLeftOneCell(11);
    };

    this.__rotateLeftOneCell = function(i) {
        this._selectedNotes[i] = this._newPattern[i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show();
        } else {
            this._noteWheel.navItems[i].navItem.hide();
        }

        let that = this;

        if (i === 0) {
            setTimeout(function() {
                if (that._selectedNotes[0]) {
                    // We are done.
                    that._saveState();
                    that._setModeName();
                    let currentModeName = keySignatureToMode(
                        that._logo.turtles.ithTurtle(0).singer.keySignature
                    );
                    if (currentModeName[0] === "C") {
                        that._showPiano();
                    }
                    that._locked = false;
                } else {
                    // Keep going until first note is selected.
                    that._locked = false;
                    that._rotateLeft();
                }
            }, ROTATESPEED);
        } else {
            setTimeout(function() {
                that.__rotateLeftOneCell(i - 1);
            }, ROTATESPEED);
        }
    };

    this._playAll = function() {
        // Play all of the notes in the widget.
        if (this._locked) {
            return;
        }

        this._logo.synth.stop();
        this._locked = true;

        // Make a list of notes to play
        this._notesToPlay = [];
        // Play the mode ascending.
        for (let i = 0; i < 12; i++) {
            if (this._selectedNotes[i]) {
                this._notesToPlay.push(i);
            }
        }

        // Include the octave above the starting note.
        this._notesToPlay.push(12);

        // And then play the mode descending.
        this._notesToPlay.push(12);
        for (let i = 11; i > -1; i--) {
            if (this._selectedNotes[i]) {
                this._notesToPlay.push(i);
            }
        }
        console.debug(this._notesToPlay);
        this._lastNotePlayed = null;
        if (this._playing) {
            this.__playNextNote(0);
        }
    };

    this.__playNextNote = function(i) {
        let highlightImgs = [
            "images/highlights/sel_c.png",
            "images/highlights/sel_c_sharp.png",
            "images/highlights/sel_d.png",
            "images/highlights/sel_d_sharp.png",
            "images/highlights/sel_e.png",
            "images/highlights/sel_f.png",
            "images/highlights/sel_f_sharp.png",
            "images/highlights/sel_g.png",
            "images/highlights/sel_g_sharp.png",
            "images/highlights/sel_a.png",
            "images/highlights/sel_a_sharp.png",
            "images/highlights/sel_b.png"
        ];

        let animationImgs = [
            "images/animations/sel_c1.png",
            "images/animations/sel_c_sharp1.png",
            "images/animations/sel_d1.png",
            "images/animations/sel_d_sharp1.png",
            "images/animations/sel_e1.png",
            "images/animations/sel_f1.png",
            "images/animations/sel_f_sharp1.png",
            "images/animations/sel_g1.png",
            "images/animations/sel_g_sharp1.png",
            "images/animations/sel_a1.png",
            "images/animations/sel_a_sharp1.png",
            "images/animations/sel_b1.png"
        ];

        let startingposition = 0;
        time = this._noteValue + 0.125;
        let that = this;

        let currentKey =
            keySignatureToMode(this._logo.turtles.ithTurtle(0).singer.keySignature)[0];
        if (currentKey === "C") {
            if (i > this._notesToPlay.length - 1) {
                setTimeout(function() {
                    // Did we just play the last note?
                    that._playing = false;
                    let note_key = document.getElementById("pkey_" + 0);
                    if (note_key !== null) {
                        note_key.src = highlightImgs[0];
                    }
                    that._playButton.innerHTML =
                        '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                        _("Play all") +
                        '" alt="' +
                        _("Play all") +
                        '" height="' +
                        ICONSIZE +
                        '" width="' +
                        ICONSIZE +
                        '" vertical-align="middle">&nbsp;&nbsp;';
                    that._resetNotes();
                    that._locked = false;
                }, 1000 * time);

                return;
            }

            setTimeout(function() {
                if (that._lastNotePlayed !== null) {
                    that._playWheel.navItems[
                        that._lastNotePlayed % 12
                    ].navItem.hide();
                    let note_key = document.getElementById(
                        "pkey_" + (that._lastNotePlayed % 12)
                    );
                    if (note_key !== null) {
                        note_key.src =
                            highlightImgs[
                                (that._lastNotePlayed + startingposition) % 12
                            ];
                    }
                }

                note = that._notesToPlay[i];
                that._playWheel.navItems[note % 12].navItem.show();

                if (note !== 12) {
                    let note_key = document.getElementById(
                        "pkey_" + (note % 12)
                    );
                    if (note_key !== null) {
                        note_key.src =
                            animationImgs[(note + startingposition) % 12];
                    }
                }

                that._lastNotePlayed = note;
                let ks = that._logo.turtles.ithTurtle(0).singer.keySignature;
                let noteToPlay = getNote(
                    that._pitch,
                    4,
                    note,
                    ks,
                    false,
                    null,
                    that._logo.errorMsg
                );
                that._logo.synth.trigger(
                    0,
                    noteToPlay[0].replace(/♯/g, "#").replace(/♭/g, "b") +
                        noteToPlay[1],
                    that._noteValue,
                    DEFAULTVOICE,
                    null,
                    null
                );

                if (that._playing) {
                    that.__playNextNote(i + 1);
                } else {
                    that._locked = false;
                    setTimeout(that._resetNotes(), 500);
                    return;
                }
            }, 1000 * time);
        } else {
            if (i > this._notesToPlay.length - 1) {
                setTimeout(function() {
                    // Did we just play the last note?
                    that._playing = false;
                    that._playButton.innerHTML =
                        '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                        _("Play all") +
                        '" alt="' +
                        _("Play all") +
                        '" height="' +
                        ICONSIZE +
                        '" width="' +
                        ICONSIZE +
                        '" vertical-align="middle">&nbsp;&nbsp;';
                    that._resetNotes();
                    that._locked = false;
                }, 1000 * time);

                return;
            }

            setTimeout(function() {
                if (that._lastNotePlayed !== null) {
                    that._playWheel.navItems[
                        that._lastNotePlayed % 12
                    ].navItem.hide();
                }

                note = that._notesToPlay[i];
                that._playWheel.navItems[note % 12].navItem.show();
                that._lastNotePlayed = note;

                let ks = that._logo.turtles.ithTurtle(0).singer.keySignature;
                let noteToPlay = getNote(
                    that._pitch,
                    4,
                    note,
                    ks,
                    false,
                    null,
                    that._logo.errorMsg
                );
                that._logo.synth.trigger(
                    0,
                    noteToPlay[0].replace(/♯/g, "#").replace(/♭/g, "b") +
                        noteToPlay[1],
                    that._noteValue,
                    DEFAULTVOICE,
                    null,
                    null
                );
                if (that._playing) {
                    that.__playNextNote(i + 1);
                } else {
                    that._locked = false;
                    setTimeout(that._resetNotes(), 500);
                    return;
                }
            }, 1000 * time);
        }
    };

    this._playNote = function(i) {
        let ks = this._logo.turtles.ithTurtle(0).singer.keySignature;

        let noteToPlay = getNote(
            this._pitch,
            4,
            i,
            ks,
            false,
            null,
            this._logo.errorMsg
        );
        this._logo.synth.trigger(
            0,
            noteToPlay[0].replace(/♯/g, "#").replace(/♭/g, "b") + noteToPlay[1],
            this._noteValue,
            DEFAULTVOICE,
            null,
            null
        );
    };

    this._saveState = function() {
        state = JSON.stringify(this._selectedNotes);
        if (state !== last(this._undoStack)) {
            this._undoStack.push(JSON.stringify(this._selectedNotes));
        }
    };

    this._undo = function() {
        if (this._undoStack.length > 0) {
            let prevState = JSON.parse(this._undoStack.pop());
            for (let i = 0; i < 12; i++) {
                this._selectedNotes[i] = prevState[i];
            }

            this._resetNotes();
            this._setModeName();
            let currentModeName =
                keySignatureToMode(this._logo.turtles.ithTurtle(0).singer.keySignature);
            if (currentModeName[0] === "C") {
                this._showPiano();
            }
        }
    };

    this._clear = function() {
        // "Unclick" every entry in the widget.

        this._saveState();

        for (let i = 1; i < 12; i++) {
            this._selectedNotes[i] = false;
        }

        this._resetNotes();
        this._setModeName();
        let currentModeName =
            keySignatureToMode(this._logo.turtles.ithTurtle(0).singer.keySignature);
        if (currentModeName[0] === "C") {
            this._showPiano();
        }
    };

    this._calculateMode = function() {
        let currentMode = [];
        let table = docById("modeTable");
        let j = 1;
        for (let i = 1; i < 12; i++) {
            if (this._selectedNotes[i]) {
                currentMode.push(j);
                j = 1;
            } else {
                j += 1;
            }
        }

        currentMode.push(j);
        return currentMode;
    };

    this._setModeName = function() {
        let table = docById("modeTable");
        let n = table.rows.length - 1;
        let currentMode = JSON.stringify(this._calculateMode());
        let currentKey =
            keySignatureToMode(this._logo.turtles.ithTurtle(0).singer.keySignature)[0];

        for (let mode in MUSICALMODES) {
            if (JSON.stringify(MUSICALMODES[mode]) === currentMode) {
                // Update the value of the modename block inside of
                // the mode widget block.
                if (this._modeBlock != null) {
                    for (let i in this._logo.blocks.blockList) {
                        if (this._logo.blocks.blockList[i].name == "modename") {
                            this._logo.blocks.blockList[i].value = mode;
                            this._logo.blocks.blockList[i].text.text = _(mode);
                            this._logo.blocks.blockList[i].updateCache();
                        } else if (
                            this._logo.blocks.blockList[i].name == "notename"
                        ) {
                            this._logo.blocks.blockList[i].value = currentKey;
                            this._logo.blocks.blockList[i].text.text = _(
                                currentKey
                            );
                        }
                    }
                    this._logo.refreshCanvas();
                }

                let name = currentKey + " " + _(mode);
                table.rows[n].cells[0].innerHTML = name;
                this.widgetWindow.updateTitle(name);
                return;
            }
        }

        // console.debug('setModeName:' + 'not found');
        table.rows[n].cells[0].innerHTML = "";
        this.widgetWindow.updateTitle("");
    };

    this._save = function() {
        let table = docById("modeTable");
        let n = table.rows.length - 1;

        // If the mode is not in the list, save it as the new custom mode.
        if (table.rows[n].cells[0].innerHTML === "") {
            customMode = this._calculateMode();
            console.debug("custom mode: " + customMode);
            storage.custommode = JSON.stringify(customMode);
        }

        let modeName = table.rows[n].cells[0].innerHTML;
        if (modeName === "") {
            modeName = _("custom");
        }

        // Save a stack of pitches to be used with the matrix.
        let newStack = [
            [0, ["action", { collapsed: true }], 100, 100, [null, 1, 2, null]],
            [1, ["text", { value: modeName }], 0, 0, [0]]
        ];
        let endOfStackIdx = 0;
        let previousBlock = 0;

        let modeLength = this._calculateMode().length;
        let p = 0;

        for (let i = 0; i < 12; i++) {
            // Reverse the order so that Do is last.
            let j = 11 - i;
            if (!this._selectedNotes[j]) {
                continue;
            }

            p += 1;
            let pitch = NOTESTABLE[(j + 1) % 12];
            let octave = 4;
            console.debug(pitch + " " + octave);

            let pitchidx = newStack.length;
            let notenameidx = pitchidx + 1;
            let octaveidx = pitchidx + 2;

            if (p === modeLength) {
                newStack.push([
                    pitchidx,
                    "pitch",
                    0,
                    0,
                    [previousBlock, notenameidx, octaveidx, null]
                ]);
            } else {
                newStack.push([
                    pitchidx,
                    "pitch",
                    0,
                    0,
                    [previousBlock, notenameidx, octaveidx, pitchidx + 3]
                ]);
            }
            newStack.push([
                notenameidx,
                ["solfege", { value: pitch }],
                0,
                0,
                [pitchidx]
            ]);
            newStack.push([
                octaveidx,
                ["number", { value: octave }],
                0,
                0,
                [pitchidx]
            ]);
            previousBlock = pitchidx;
        }

        // Create a new stack for the chunk.
        console.debug(newStack);
        this._logo.blocks.loadNewBlocks(newStack);
        this._logo.textMsg(_("New action block generated!"));

        // And save a stack of pitchnumbers to be used with the define mode
        newStack = [
            [0, "definemode", 150, 120, [null, 1, 3, 2]],
            [1, ["modename", { value: modeName }], 0, 0, [0]],
            [2, "hidden", 0, 0, [0, null]]
        ];
        endOfStackIdx = 0;
        previousBlock = 0;

        modeLength = this._calculateMode().length;
        p = 0;

        for (let i = 0; i < 12; i++) {
            if (!this._selectedNotes[i]) {
                continue;
            }

            p += 1;
            let idx = newStack.length;

            if (p === modeLength) {
                newStack.push([
                    idx,
                    "pitchnumber",
                    0,
                    0,
                    [previousBlock, idx + 1, null]
                ]);
            } else {
                newStack.push([
                    idx,
                    "pitchnumber",
                    0,
                    0,
                    [previousBlock, idx + 1, idx + 2]
                ]);
            }

            newStack.push([idx + 1, ["number", { value: i }], 0, 0, [idx]]);
            previousBlock = idx;
        }

        // Create a new stack for the chunk.
        console.debug(newStack);
        let that = this;
        setTimeout(function() {
            // that._logo.blocks.palettes.hide();
            that._logo.blocks.loadNewBlocks(newStack);
        }, 2000);
    };

    this._piemenuMode = function() {
        // pie menu for mode definition

        docById("meterWheelDiv").style.display = "";

        // Use advanced constructor for multiple wheelnavs in the same div.
        // The meterWheel is used to hold the half steps.
        this._modeWheel = new wheelnav("meterWheelDiv", null, 400, 400);
        // The selected notes are shown on this wheel
        this._noteWheel = new wheelnav("_noteWheel", this._modeWheel.raphael);
        // Play wheel is to show which note is playing at any one time.
        this._playWheel = new wheelnav("_playWheel", this._modeWheel.raphael);

        wheelnav.cssMeter = true;

        // Use the mode wheel color scheme
        this._modeWheel.colors = platformColor.modeWheelcolors;

        this._modeWheel.slicePathFunction = slicePath().DonutSlice;
        this._modeWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._modeWheel.slicePathCustom.minRadiusPercent = 0.4;
        this._modeWheel.slicePathCustom.maxRadiusPercent = 0.75;
        this._modeWheel.sliceSelectedPathCustom = this._modeWheel.slicePathCustom;
        this._modeWheel.sliceInitPathCustom = this._modeWheel.slicePathCustom;

        // Disable rotation, set navAngle and create the menus
        this._modeWheel.clickModeRotate = false;
        this._modeWheel.navAngle = -90;
        // this._modeWheel.selectedNavItemIndex = 2;
        this._modeWheel.animatetime = 0; // 300;

        let labels = [
            "0",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11"
        ];
        let noteList = [];
        for (let i = 0; i < 12; i++) {
            noteList.push(labels[i]);
        }

        this._modeWheel.createWheel(noteList);

        this._noteWheel.colors = platformColor.noteValueWheelcolors; // modeWheelcolors;
        this._noteWheel.slicePathFunction = slicePath().DonutSlice;
        this._noteWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._noteWheel.slicePathCustom.minRadiusPercent = 0.75;
        this._noteWheel.slicePathCustom.maxRadiusPercent = 0.9;
        this._noteWheel.sliceSelectedPathCustom = this._noteWheel.slicePathCustom;
        this._noteWheel.sliceInitPathCustom = this._noteWheel.slicePathCustom;
        this._noteWheel.clickModeRotate = false;
        this._noteWheel.navAngle = -90;
        this._noteWheel.titleRotateAngle = 90;

        noteList = [" "]; // No X on first note, since we don't want to unselect it.
        this._selectedNotes = [true]; // The first note is always selected.
        for (let i = 1; i < 12; i++) {
            noteList.push("x");
            this._selectedNotes.push(false);
        }

        this._noteWheel.createWheel(noteList);

        this._playWheel.colors = [platformColor.orange];
        this._playWheel.slicePathFunction = slicePath().DonutSlice;
        this._playWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._playWheel.slicePathCustom.minRadiusPercent = 0.3;
        this._playWheel.slicePathCustom.maxRadiusPercent = 0.4;
        this._playWheel.sliceSelectedPathCustom = this._playWheel.slicePathCustom;
        this._playWheel.sliceInitPathCustom = this._playWheel.slicePathCustom;
        this._playWheel.clickModeRotate = false;
        this._playWheel.navAngle = -90;
        this._playWheel.titleRotateAngle = 90;

        noteList = [];
        for (let i = 0; i < 12; i++) {
            noteList.push(" ");
        }

        this._playWheel.createWheel(noteList);

        for (let i = 0; i < 12; i++) {
            this._playWheel.navItems[i].navItem.hide();
        }

        let that = this;

        // If a modeWheel sector is selected, show the corresponding
        // note wheel sector.
        let __setNote = function() {
            let i = that._modeWheel.selectedNavItemIndex;
            that._saveState();
            that._selectedNotes[i] = true;
            that._noteWheel.navItems[i].navItem.show();
            that._playNote(i);
            that._setModeName();
            let currentModeName =
                keySignatureToMode(that._logo.turtles.ithTurtle(0).singer.keySignature);
            if (currentModeName[0] === "C") {
                that._showPiano();
            }
        };

        // If a noteWheel sector is selected, hide it.
        let __clearNote = function() {
            let i = that._noteWheel.selectedNavItemIndex;
            if (i == 0) {
                return; // Never hide the first note.
            }

            that._noteWheel.navItems[i].navItem.hide();
            that._saveState();
            that._selectedNotes[i] = false;
            that._setModeName();
            let currentModeName =
                keySignatureToMode(that._logo.turtles.ithTurtle(0).singer.keySignature);
            if (currentModeName[0] === "C") {
                that._showPiano();
            }
        };

        for (let i = 0; i < 12; i++) {
            that._modeWheel.navItems[i].navigateFunction = __setNote;
            that._noteWheel.navItems[i].navigateFunction = __clearNote;
            // Start with all notes hidden.
            that._noteWheel.navItems[i].navItem.hide();
        }
    };
}
