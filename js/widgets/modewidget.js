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

class ModeWidget {
    static ICONSIZE = 32;
    static BUTTONSIZE = 53;
    static ROTATESPEED = 125;
    static BUTTONDIVWIDTH = 535;

    constructor() {
        this._modeBlock = logo.modeBlock;
        this._locked = false;
        this._pitch = turtles.ithTurtle(0).singer.keySignature[0];
        this._noteValue = 0.333;
        this._undoStack = [];
        this._playing = false;
        this._selectedNotes = [];
        this._newPattern = [];

        const w = window.innerWidth;
        this._cellScale = w / 1200;
        const iconSize = ModeWidget.ICONSIZE * this._cellScale;

        this.widgetWindow = window.widgetWindows.windowFor(this, "custom mode");
        this.widgetWindow.clear();
        this.widgetWindow.show();

        // The mode table (holds a pie menu and a label)
        this.modeTableDiv = document.createElement("div");
        this.modeTableDiv.style.display = "inline";
        this.modeTableDiv.style.visibility = "visible";
        this.modeTableDiv.style.border = "0px";
        this.modeTableDiv.innerHTML = '<div id="meterWheelDiv"></div>';
        this.modeTableDiv.innerHTML += '<div id="modePianoDiv" class=""></div>';
        this.modeTableDiv.innerHTML += '<table id="modeTable"></table>';

        this.widgetWindow.getWidgetBody().append(this.modeTableDiv);

        this.widgetWindow.onclose = () => {
            logo.hideMsgs();
            this.widgetWindow.destroy();
        };

        this._playButton = this.widgetWindow.addButton(
            "play-button.svg",
            ModeWidget.ICONSIZE,
            _("Play")
        );
        this._playButton.onclick = () => {
            logo.resetSynth(0);
            if (this._playingStatus()) {
                this._playing = false;

                this._playButton.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                    _("Play all") +
                    '" alt="' +
                    _("Play all") +
                    '" height="' +
                    ModeWidget.ICONSIZE +
                    '" width="' +
                    ModeWidget.ICONSIZE +
                    '" vertical-align="middle">&nbsp;&nbsp;';
            } else {
                this._playing = true;

                this._playButton.innerHTML =
                    '&nbsp;&nbsp;<img src="header-icons/stop-button.svg" title="' +
                    _("Stop") +
                    '" alt="' +
                    _("Stop") +
                    '" height="' +
                    ModeWidget.ICONSIZE +
                    '" width="' +
                    ModeWidget.ICONSIZE +
                    '" vertical-align="middle">&nbsp;&nbsp;';

                this._playAll();
            }
        };

        this.widgetWindow.addButton(
            "export-chunk.svg",
            ModeWidget.ICONSIZE,
            _("Save")
        ).onclick = this._save.bind(this);

        this.widgetWindow.addButton(
            "erase-button.svg",
            ModeWidget.ICONSIZE,
            _("Clear")
        ).onclick = this._clear.bind(this);

        this.widgetWindow.addButton(
            "rotate-left.svg",
            ModeWidget.ICONSIZE,
            _("Rotate counter clockwise")
        ).onclick = this._rotateLeft.bind(this);

        this.widgetWindow.addButton(
            "rotate-right.svg",
            ModeWidget.ICONSIZE,
            _("Rotate clockwise")
        ).onclick = this._rotateRight.bind(this);

        this.widgetWindow.addButton(
            "invert.svg",
            ModeWidget.ICONSIZE,
            _("Invert")
        ).onclick = this._invert.bind(this);

        this.widgetWindow.addButton(
            "restore-button.svg",
            ModeWidget.ICONSIZE,
            _("Undo")
        ).onclick = this._undo.bind(this);

        this._piemenuMode();

        const table = docById("modeTable");

        // A row for the current mode label
        const row = table.insertRow();
        const cell = row.insertCell();
        // cell.colSpan = 18;
        cell.innerHTML = "&nbsp;";
        cell.style.backgroundColor = platformColor.selectorBackground;

        // Set current mode in pie menu.
        this._setMode();

        //.TRANS: A circle of notes represents the musical mode.
        logo.textMsg(_("Click in the circle to select notes for the mode."));
        this.widgetWindow.sendToCenter();
    }

    /**
     * @private
     * @returns {boolean}
     */
    _playingStatus() {
        return this._playing;
    }

    /**
     * @private
     * @param {*} row 
     * @param {string} icon 
     * @param {number} iconSize 
     * @param {*} label
     * @returns {void} 
     */
    _addButton(row, icon, iconSize, label) {
        const cell = row.insertCell(-1);
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
        cell.style.width = ModeWidget.BUTTONSIZE + "px";
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover = function () {
            this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        };

        cell.onmouseout = function () {
            this.style.backgroundColor = platformColor.selectorBackground;
        };

        return cell;
    }

    /**
     * @private
     * @returns {void}
     */
    _setMode() {
        // Read in the current mode to start
        const currentModeName = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature);
        const currentMode = MUSICALMODES[currentModeName[1]];

        // Add the mode name in the bottom row of the table.
        const table = docById("modeTable");
        const n = table.rows.length - 1;

        console.debug(_(currentModeName[1]));
        const name = currentModeName[0] + " " + _(currentModeName[1]);
        table.rows[n].cells[0].innerHTML = name;
        this.widgetWindow.updateTitle(name);

        // Set the notes for this mode.
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
    }

    /**
     * @private
     * @returns {void}
     */
    _showPiano() {
        const modePianoDiv = docById("modePianoDiv");
        modePianoDiv.style.display = "inline";
        modePianoDiv.style.visibility = "visible";
        modePianoDiv.style.border = "0px";
        modePianoDiv.style.top = "0px";
        modePianoDiv.style.left = "0px";
        modePianoDiv.innerHTML =
            '<img src="images/piano_keys.png"  id="modeKeyboard" style="top:0px; left:0px; position:relative;">';
        const highlightImgs = [
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
        const currentModeName = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature);
        const letterName = currentModeName[0];

        const startDict = {
            "C♭": 11,
            "C": 0,
            "C♯": 1,
            "D♭": 1,
            "D": 2,
            "D♯": 3,
            "E♭": 3,
            "E": 4,
            "E♯": 5,
            "F♭": 4,
            "F": 5,
            "F♯": 6,
            "G♭": 6,
            "G": 7,
            "G♯": 8,
            "A♭": 8,
            "A": 9,
            "A♯": 10,
            "A♭": 10,
            "B": 11,
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
    }
    /**
     * @private
     * @returns {void}
     */
    _invert() {
        if (this._locked) {
            return;
        }

        this._locked = true;

        this._saveState();
        this.__invertOnePair(1);
        const currentModeName = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature);
        if (currentModeName[0] === "C") {
            this._showPiano();
        }
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    __invertOnePair(i) {
        const tmp = this._selectedNotes[i];
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
            const currentModeName = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature);
            if (currentModeName[0] === "C") {
                this._showPiano();
            }
            this._locked = false;
        } else {
            setTimeout(() => {
                this.__invertOnePair(i + 1);
            }, ModeWidget.ROTATESPEED);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _resetNotes() {
        for (let i = 0; i < this._selectedNotes.length; i++) {
            if (this._selectedNotes[i]) {
                this._noteWheel.navItems[i].navItem.show();
            } else {
                this._noteWheel.navItems[i].navItem.hide();
            }
            this._playWheel.navItems[i].navItem.hide();
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _rotateRight() {
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
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    __rotateRightOneCell(i) {
        this._selectedNotes[i] = this._newPattern[i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show();
        } else {
            this._noteWheel.navItems[i].navItem.hide();
        }

        if (i === 0) {
            setTimeout(() => {
                if (this._selectedNotes[0]) {
                    // We are done.
                    this._saveState();
                    this._setModeName();
                    const currentModeName = keySignatureToMode(
                        turtles.ithTurtle(0).singer.keySignature
                    );
                    if (currentModeName[0] === "C") {
                        this._showPiano();
                    }
                    this._locked = false;
                } else {
                    // Keep going until first note is selected.
                    this._locked = false;
                    this._rotateRight();
                }
            }, ModeWidget.ROTATESPEED);
        } else {
            setTimeout(() => {
                this.__rotateRightOneCell((i + 1) % 12);
            }, ModeWidget.ROTATESPEED);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _rotateLeft() {
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
    }

    /**
     * @private
     * @param {number} i
     * @returns {void}
     */
    __rotateLeftOneCell(i) {
        this._selectedNotes[i] = this._newPattern[i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show();
        } else {
            this._noteWheel.navItems[i].navItem.hide();
        }

        if (i === 0) {
            setTimeout(() => {
                if (this._selectedNotes[0]) {
                    // We are done.
                    this._saveState();
                    this._setModeName();
                    const currentModeName = keySignatureToMode(
                        turtles.ithTurtle(0).singer.keySignature
                    );
                    if (currentModeName[0] === "C") {
                        this._showPiano();
                    }
                    this._locked = false;
                } else {
                    // Keep going until first note is selected.
                    this._locked = false;
                    this._rotateLeft();
                }
            }, ModeWidget.ROTATESPEED);
        } else {
            setTimeout(() => {
                this.__rotateLeftOneCell(i - 1);
            }, ModeWidget.ROTATESPEED);
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _playAll() {
        // Play all of the notes in the widget.
        if (this._locked) {
            return;
        }

        logo.synth.stop();
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
    }

    /**
     * @private
     * @param {number} i - note to play
     * @returns {void}
     */
    __playNextNote(i) {
        const highlightImgs = [
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

        const animationImgs = [
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

        const startingposition = 0;
        const time = this._noteValue + 0.125;

        const currentKey = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature)[0];
        if (currentKey === "C") {
            if (i > this._notesToPlay.length - 1) {
                setTimeout(() => {
                    // Did we just play the last note?
                    this._playing = false;
                    const note_key = document.getElementById("pkey_" + 0);
                    if (note_key !== null) {
                        note_key.src = highlightImgs[0];
                    }
                    this._playButton.innerHTML =
                        '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                        _("Play all") +
                        '" alt="' +
                        _("Play all") +
                        '" height="' +
                        ModeWidget.ICONSIZE +
                        '" width="' +
                        ModeWidget.ICONSIZE +
                        '" vertical-align="middle">&nbsp;&nbsp;';
                    this._resetNotes();
                    this._locked = false;
                }, 1000 * time);

                return;
            }

            setTimeout(() => {
                if (this._lastNotePlayed !== null) {
                    this._playWheel.navItems[this._lastNotePlayed % 12].navItem.hide();
                    const note_key = document.getElementById("pkey_" + (this._lastNotePlayed % 12));
                    if (note_key !== null) {
                        note_key.src =
                            highlightImgs[(this._lastNotePlayed + startingposition) % 12];
                    }
                }

                const note = this._notesToPlay[i];
                this._playWheel.navItems[note % 12].navItem.show();

                if (note !== 12) {
                    const note_key = document.getElementById("pkey_" + (note % 12));
                    if (note_key !== null) {
                        note_key.src = animationImgs[(note + startingposition) % 12];
                    }
                }

                this._lastNotePlayed = note;
                const ks = turtles.ithTurtle(0).singer.keySignature;
                const noteToPlay = getNote(this._pitch, 4, note, ks, false, null, logo.errorMsg);
                logo.synth.trigger(
                    0,
                    noteToPlay[0].replace(/♯/g, "#").replace(/♭/g, "b") + noteToPlay[1],
                    this._noteValue,
                    DEFAULTVOICE,
                    null,
                    null
                );

                if (this._playing) {
                    this.__playNextNote(i + 1);
                } else {
                    this._locked = false;
                    setTimeout(this._resetNotes(), 500);
                    return;
                }
            }, 1000 * time);
        } else {
            if (i > this._notesToPlay.length - 1) {
                setTimeout(() => {
                    // Did we just play the last note?
                    this._playing = false;
                    this._playButton.innerHTML =
                        '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' +
                        _("Play all") +
                        '" alt="' +
                        _("Play all") +
                        '" height="' +
                        ModeWidget.ICONSIZE +
                        '" width="' +
                        ModeWidget.ICONSIZE +
                        '" vertical-align="middle">&nbsp;&nbsp;';
                    this._resetNotes();
                    this._locked = false;
                }, 1000 * time);

                return;
            }

            setTimeout(() => {
                if (this._lastNotePlayed !== null) {
                    this._playWheel.navItems[this._lastNotePlayed % 12].navItem.hide();
                }

                const note = this._notesToPlay[i];
                this._playWheel.navItems[note % 12].navItem.show();
                this._lastNotePlayed = note;

                const ks = turtles.ithTurtle(0).singer.keySignature;
                const noteToPlay = getNote(this._pitch, 4, note, ks, false, null, logo.errorMsg);
                logo.synth.trigger(
                    0,
                    noteToPlay[0].replace(/♯/g, "#").replace(/♭/g, "b") + noteToPlay[1],
                    this._noteValue,
                    DEFAULTVOICE,
                    null,
                    null
                );
                if (this._playing) {
                    this.__playNextNote(i + 1);
                } else {
                    this._locked = false;
                    setTimeout(this._resetNotes(), 500);
                    return;
                }
            }, 1000 * time);
        }
    }

    /**
     * @private
     * @param {number} i - note to play
     * @returns {void}
     */
    _playNote(i) {
        const ks = turtles.ithTurtle(0).singer.keySignature;

        const noteToPlay = getNote(this._pitch, 4, i, ks, false, null, logo.errorMsg);
        logo.synth.trigger(
            0,
            noteToPlay[0].replace(/♯/g, "#").replace(/♭/g, "b") + noteToPlay[1],
            this._noteValue,
            DEFAULTVOICE,
            null,
            null
        );
    }

    /**
     * @private
     * @returns {void}
     */
    _saveState() {
        const state = JSON.stringify(this._selectedNotes);
        if (state !== last(this._undoStack)) {
            this._undoStack.push(JSON.stringify(this._selectedNotes));
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _undo() {
        if (this._undoStack.length > 0) {
            const prevState = JSON.parse(this._undoStack.pop());
            for (let i = 0; i < 12; i++) {
                this._selectedNotes[i] = prevState[i];
            }

            this._resetNotes();
            this._setModeName();
            const currentModeName = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature);
            if (currentModeName[0] === "C") {
                this._showPiano();
            }
        }
    }

    /**
     * @private
     * @returns {void}
     */
    _clear() {
        // "Unclick" every entry in the widget.

        this._saveState();

        for (let i = 1; i < 12; i++) {
            this._selectedNotes[i] = false;
        }

        this._resetNotes();
        this._setModeName();
        const currentModeName = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature);
        if (currentModeName[0] === "C") {
            this._showPiano();
        }
    }

    /**
     * @private
     * @returns {Array<number>}
     */
    _calculateMode() {
        const currentMode = [];
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
    }

    /**
     * @private
     * @returns {void}
     */
    _setModeName() {
        const table = docById("modeTable");
        const n = table.rows.length - 1;
        const currentMode = JSON.stringify(this._calculateMode());
        const currentKey = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature)[0];

        for (let mode in MUSICALMODES) {
            if (JSON.stringify(MUSICALMODES[mode]) === currentMode) {
                // Update the value of the modename block inside of
                // the mode widget block.
                if (this._modeBlock != null) {
                    for (let i in logo.blocks.blockList) {
                        if (logo.blocks.blockList[i].name == "modename") {
                            logo.blocks.blockList[i].value = mode;
                            logo.blocks.blockList[i].text.text = _(mode);
                            logo.blocks.blockList[i].updateCache();
                        } else if (logo.blocks.blockList[i].name == "notename") {
                            logo.blocks.blockList[i].value = currentKey;
                            logo.blocks.blockList[i].text.text = _(currentKey);
                        }
                    }
                    logo.refreshCanvas();
                }

                const name = currentKey + " " + _(mode);
                table.rows[n].cells[0].innerHTML = name;
                this.widgetWindow.updateTitle(name);
                return;
            }
        }

        // console.debug('setModeName:' + 'not found');
        table.rows[n].cells[0].innerHTML = "";
        this.widgetWindow.updateTitle("");
    }

    /**
     * @private
     * @returns {void}
     */
    _save() {
        const table = docById("modeTable");
        const n = table.rows.length - 1;

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
            const j = 11 - i;
            if (!this._selectedNotes[j]) {
                continue;
            }

            p += 1;
            const pitch = NOTESTABLE[(j + 1) % 12];
            const octave = 4;
            console.debug(pitch + " " + octave);

            const pitchidx = newStack.length;
            const notenameidx = pitchidx + 1;
            const octaveidx = pitchidx + 2;

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
            newStack.push([notenameidx, ["solfege", { value: pitch }], 0, 0, [pitchidx]]);
            newStack.push([octaveidx, ["number", { value: octave }], 0, 0, [pitchidx]]);
            previousBlock = pitchidx;
        }

        // Create a new stack for the chunk.
        console.debug(newStack);
        logo.blocks.loadNewBlocks(newStack);
        logo.textMsg(_("New action block generated!"));

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
            const idx = newStack.length;

            if (p === modeLength) {
                newStack.push([idx, "pitchnumber", 0, 0, [previousBlock, idx + 1, null]]);
            } else {
                newStack.push([idx, "pitchnumber", 0, 0, [previousBlock, idx + 1, idx + 2]]);
            }

            newStack.push([idx + 1, ["number", { value: i }], 0, 0, [idx]]);
            previousBlock = idx;
        }

        // Create a new stack for the chunk.
        console.debug(newStack);
        setTimeout(() => {
            logo.blocks.loadNewBlocks(newStack);
        }, 2000);
    }

    /**
     * @private
     * @returns {void}
     */
    _piemenuMode() {
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

        const labels = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
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

        // If a modeWheel sector is selected, show the corresponding
        // note wheel sector.
        const __setNote = () => {
            const i = this._modeWheel.selectedNavItemIndex;
            this._saveState();
            this._selectedNotes[i] = true;
            this._noteWheel.navItems[i].navItem.show();
            this._playNote(i);
            this._setModeName();
            const currentModeName = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature);
            if (currentModeName[0] === "C") {
                this._showPiano();
            }
        };

        // If a noteWheel sector is selected, hide it.
        const __clearNote = () => {
            const i = this._noteWheel.selectedNavItemIndex;
            if (i == 0) {
                return; // Never hide the first note.
            }

            this._noteWheel.navItems[i].navItem.hide();
            this._saveState();
            this._selectedNotes[i] = false;
            this._setModeName();
            const currentModeName = keySignatureToMode(turtles.ithTurtle(0).singer.keySignature);
            if (currentModeName[0] === "C") {
                this._showPiano();
            }
        };

        for (let i = 0; i < 12; i++) {
            this._modeWheel.navItems[i].navigateFunction = __setNote;
            this._noteWheel.navItems[i].navigateFunction = __clearNote;
            // Start with all notes hidden.
            this._noteWheel.navItems[i].navItem.hide();
        }
    }
}
