// Copyright (c) 2016-19 Walter Bender
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
        this._pitch = this._logo.keySignature[0][0];
        this._noteValue = 0.333;
        this._undoStack = [];
        this._playing = false;
        this._selectedNotes = [];
        this._newPattern = [];

        var w = window.innerWidth;
        this._cellScale = w / 1200;
        var iconSize = ICONSIZE * this._cellScale;

        var canvas = docById('myCanvas');

        // Position the widget and make it visible.
        var modeDiv = docById('modeDiv');
        modeDiv.style.visibility = 'visible';
        modeDiv.setAttribute('draggable', 'true');
        modeDiv.style.left = '200px';
        modeDiv.style.top = '150px';

        // The mode buttons
        var modeButtonsDiv = docById('modeButtonsDiv');
        modeButtonsDiv.style.display = 'inline';
        modeButtonsDiv.style.visibility = 'visible';
        modeButtonsDiv.style.width = BUTTONDIVWIDTH;
        modeButtonsDiv.innerHTML = '<table cellpadding="0px" id="modeButtonTable"></table>';

        var buttonTable = docById('modeButtonTable');
        var header = buttonTable.createTHead();
        var row = header.insertRow(0);

        // For the button callbacks
        var that = this;

        var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('Close'));

        cell.onclick=function() {
            docById('modeDiv').style.visibility = 'hidden';
            docById('modeButtonsDiv').style.visibility = 'hidden';
            docById('modeTableDiv').style.visibility = 'hidden';
            that._logo.hideMsgs();
        }


        var cell = this._addButton(row, 'play-button.svg', ICONSIZE, _('Play all'));
        this._playButton = cell;

        cell.onclick=function() {
            that._logo.resetSynth(0);
            if (that._playingStatus()) {
                that._playing = false;

                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('Play all') + '" alt="' + _('Play all') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle">&nbsp;&nbsp;';
            } else {
                that._playing = true;

                this.innerHTML = '&nbsp;&nbsp;<img src="header-icons/stop-button.svg" title="' + _('Stop') + '" alt="' + _('Stop') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle">&nbsp;&nbsp;';

                that._playAll();
            }
        }

        var cell = this._addButton(row, 'export-chunk.svg', ICONSIZE, _('Save'));

        cell.onclick=function() {
            that._save();
        }

        var cell = this._addButton(row, 'erase-button.svg', ICONSIZE, _('Clear'));

        cell.onclick=function() {
            that._clear();
        }

        var cell = this._addButton(row, 'rotate-left.svg', ICONSIZE, _('Rotate counter clockwise'));

        cell.onclick=function() {
            that._rotateLeft();
        }

        var cell = this._addButton(row, 'rotate-right.svg', ICONSIZE, _('Rotate clockwise'));

        cell.onclick=function() {
            that._rotateRight();
        }

        var cell = this._addButton(row, 'invert.svg', ICONSIZE, _('Invert'));

        cell.onclick=function() {
            that._invert();
        }

        var cell = this._addButton(row, 'restore-button.svg', ICONSIZE, _('Undo'));

        cell.onclick=function() {
            that._undo();
        }

        // var cell = this._addButton(row, 'close-button.svg', ICONSIZE, _('Close'));

        // cell.onclick=function() {
        //     docById('modeDiv').style.visibility = 'hidden';
        //     docById('modeButtonsDiv').style.visibility = 'hidden';
        //     docById('modeTableDiv').style.visibility = 'hidden';
        //     that._logo.hideMsgs();
        // }

        // We use this cell as a handle for dragging.
        var dragCell = this._addButton(row, 'grab.svg', ICONSIZE, _('Drag'));
        dragCell.style.cursor = 'move';

        this._dx = dragCell.getBoundingClientRect().left - modeDiv.getBoundingClientRect().left;
        this._dy = dragCell.getBoundingClientRect().top - modeDiv.getBoundingClientRect().top;
        this._dragging = false;
        this._target = false;
        this._dragCellHTML = dragCell.innerHTML;

        dragCell.onmouseover = function(e) {
            // In order to prevent the dragged item from triggering a
            // browser reload in Firefox, we empty the cell contents
            // before dragging.
            dragCell.innerHTML = '';
        };

        dragCell.onmouseout = function(e) {
            if (!that._dragging) {
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        canvas.ondragover = function(e) {
            that._dragging = true;
            e.preventDefault();
        };

        canvas.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                modeDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                modeDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        modeDiv.ondragover = function(e) {
            that._dragging = true;
            e.preventDefault();
        };

        modeDiv.ondrop = function(e) {
            if (that._dragging) {
                that._dragging = false;
                var x = e.clientX - that._dx;
                modeDiv.style.left = x + 'px';
                var y = e.clientY - that._dy;
                modeDiv.style.top = y + 'px';
                dragCell.innerHTML = that._dragCellHTML;
            }
        };

        modeDiv.onmousedown = function(e) {
            that._target = e.target;
        };

        modeDiv.ondragstart = function(e) {
            if (dragCell.contains(that._target)) {
                e.dataTransfer.setData('text/plain', '');
            } else {
                e.preventDefault();
            }
        };

        // The mode table (holds a pie menu and a label)
        var modeTableDiv = docById('modeTableDiv');
        modeTableDiv.style.display = 'inline';
        modeTableDiv.style.visibility = 'visible';
        modeTableDiv.style.border = '0px';
        // modeTableDiv.innerHTML = '<table id="modeTable"></table>';
		
		// PIANOKEY INSERTION
		//image is above scale identifier
		//modeTableDiv.innerHTML = '<div id="meterWheelDiv"></div><table id="modeTable"><img src="../../images/piano_keys.png" style="width:400px;height:265px;"></table>';
		
		//image is below scale identifier
        //modeTableDiv.innerHTML = '<div id="meterWheelDiv"></div><table id="modeTable"></table>';
		//modeTableDiv.innerHTML += '<table><tr><td><img src="../../images/piano_keys.png" style="width:400px;height:265px;"></td></tr></table>';
		
		// this is probably better, we can insert our own div easier
		modeTableDiv.innerHTML = '<div id="meterWheelDiv"></div>';
		modeTableDiv.innerHTML += '<img src="../../images/piano_keys.png" style="width:400px;height:265px;">';
		modeTableDiv.innerHTML += '<table id="modeTable"></table>';



        this._piemenuMode();

        var table = docById('modeTable');

        /*
        // Set up the pie menu
        var row = table.insertRow();
        var cell = row.insertCell();
        cell.innerHTML = '<div id="meterWheelDiv"></div>';
        */
        // A row for the current mode label
        var row = table.insertRow();
        var cell = row.insertCell();
        // cell.colSpan = 18;
        cell.innerHTML = '&nbsp;';
        cell.style.backgroundColor = platformColor.selectorBackground;

        // Set current mode in pie menu.
        this._setMode();

        //.TRANS: A circle of notes represents the musical mode.
        this._logo.textMsg(_('Click in the circle to select notes for the mode.'));
		
    };

    this._playingStatus = function() {
        return this._playing;
    };

    this._addButton = function(row, icon, iconSize, label) {
        var cell = row.insertCell(-1);
        cell.innerHTML = '&nbsp;&nbsp;<img src="header-icons/' + icon + '" title="' + label + '" alt="' + label + '" height="' + iconSize + '" width="' + iconSize + '" vertical-align="middle" align-content="center">&nbsp;&nbsp;';
        cell.style.width = BUTTONSIZE + 'px';
        cell.style.minWidth = cell.style.width;
        cell.style.maxWidth = cell.style.width;
        cell.style.height = cell.style.width;
        cell.style.minHeight = cell.style.height;
        cell.style.maxHeight = cell.style.height;
        cell.style.backgroundColor = platformColor.selectorBackground;

        cell.onmouseover=function() {
            this.style.backgroundColor = platformColor.selectorBackgroundHOVER;
        }

        cell.onmouseout=function() {
            this.style.backgroundColor = platformColor.selectorBackground;
        }

        return cell;
    };

    this._setMode = function() {
        // Read in the current mode to start.
        var currentModeName = keySignatureToMode(this._logo.keySignature[0]);
        var currentMode = MUSICALMODES[currentModeName[1]];

        // Add the mode name in the bottom row of the table.
        var table = docById('modeTable');
        var n = table.rows.length - 1;

        console.log(_(currentModeName[1]));
        table.rows[n].cells[0].innerHTML = currentModeName[0] + ' ' + _(currentModeName[1]);

        // Set the notes for this mode.
        var that = this;
        var k = 0;
        var j = 0;
        for (var i = 0; i < 12; i++) {
            if (i === j) {
                this._noteWheel.navItems[i].navItem.show();
                this._selectedNotes[i] = true;
                j += currentMode[k];
                k += 1;
            } else {
                this._noteWheel.navItems[i].navItem.hide();
            }
        }
    };

    this._invert = function() {
        if (this._locked) {
            return;
        }

        this._locked = true;

        this._saveState();
        this.__invertOnePair(1);
    };

    this.__invertOnePair = function(i) {
        var tmp = this._selectedNotes[i];
        this._selectedNotes[i] = this._selectedNotes[12 - i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show()
        } else {
            this._noteWheel.navItems[i].navItem.hide()
        }

        this._selectedNotes[12 - i] = tmp;
        if (this._selectedNotes[12 - i]) {
            this._noteWheel.navItems[12 - i].navItem.show()
        } else {
            this._noteWheel.navItems[12 - i].navItem.hide()
        }

        var that = this;

        if (i === 5) {
            that._saveState();
            that._setModeName()
            that._locked = false;
        } else {
            setTimeout(function() {
                that.__invertOnePair(i + 1);
            }, ROTATESPEED);
        }

    };

    this._resetNotes = function() {
        for (var i = 0; i < this._selectedNotes.length; i++) {
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
        this._newPattern = []
        this._newPattern.push(this._selectedNotes[11]);
        for (var i = 0; i < 11; i++) {
            this._newPattern.push(this._selectedNotes[i]);
        }

        this.__rotateRightOneCell(1);

    };

    this.__rotateRightOneCell = function(i, cellColors) {
        this._selectedNotes[i] = this._newPattern[i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show()
        } else {
            this._noteWheel.navItems[i].navItem.hide()
        }

        var that = this;

        if (i === 0) {
            setTimeout(function() {
                if (that._selectedNotes[0]) {
                    // We are done.
                    that._saveState();
                    that._setModeName();
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
        this._newPattern = []
        for (var i = 1; i < 12; i++) {
            this._newPattern.push(this._selectedNotes[i]);
        }

        this._newPattern.push(this._selectedNotes[0]);

        this.__rotateLeftOneCell(11);
    };

    this.__rotateLeftOneCell = function(i) {
        this._selectedNotes[i] = this._newPattern[i];
        if (this._selectedNotes[i]) {
            this._noteWheel.navItems[i].navItem.show()
        } else {
            this._noteWheel.navItems[i].navItem.hide()
        }

        var that = this;

        if (i === 0) {
            setTimeout(function() {
                if (that._selectedNotes[0]) {
                    // We are done.
                    that._saveState();
                    that._setModeName();
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
        for (var i = 0; i < 12; i++) {
            if (this._selectedNotes[i]) {
                this._notesToPlay.push(i);
            }
        }

        // Include the octave above the starting note.
        this._notesToPlay.push(12);

        // And then play the mode descending. 
        this._notesToPlay.push(12);
        for (var i = 11; i > -1; i--) {
            if (this._selectedNotes[i]) {
                this._notesToPlay.push(i);
            }
        }

        this._lastNotePlayed = null;
        if (this._playing) {
            this.__playNextNote(0);
        }
    };

    this.__playNextNote = function(i) {
        time = this._noteValue + 0.125;
        var that = this;

        if (i > this._notesToPlay.length - 1) {
            setTimeout(function() {
                // Did we just play the last note?
                that._playing = false;

                that._playButton.innerHTML = '&nbsp;&nbsp;<img src="header-icons/play-button.svg" title="' + _('Play all') + '" alt="' + _('Play all') + '" height="' + ICONSIZE + '" width="' + ICONSIZE + '" vertical-align="middle">&nbsp;&nbsp;';
                that._resetNotes();
                that._locked = false;
            }, 1000 * time);

            return;
        }

        setTimeout(function() {
            if (that._lastNotePlayed !== null) {
                that._playWheel.navItems[that._lastNotePlayed % 12].navItem.hide();
            }

            note = that._notesToPlay[i];
            that._playWheel.navItems[note % 12].navItem.show();
            that._lastNotePlayed = note;

            var ks = that._logo.keySignature[0];
            var noteToPlay = getNote(that._pitch, 4, note, ks, false, null, that._logo.errorMsg);
            that._logo.synth.trigger(0, noteToPlay[0].replace(/♯/g, '#').replace(/♭/g, 'b') + noteToPlay[1], that._noteValue, DEFAULTVOICE, null, null);
            if (that._playing) {
                that.__playNextNote(i + 1);
            } else {
                that._locked = false;
                setTimeout(that._resetNotes(), 500);
                return;
            }
        }, 1000 * time);
    };

    this._playNote = function(i) {
        var ks = this._logo.keySignature[0];

        var noteToPlay = getNote(this._pitch, 4, i, ks, false, null, this._logo.errorMsg);
        this._logo.synth.trigger(0, noteToPlay[0].replace(/♯/g, '#').replace(/♭/g, 'b') + noteToPlay[1], this._noteValue, DEFAULTVOICE, null, null);
    };

    this._saveState = function() {
        state = JSON.stringify(this._selectedNotes);
        if (state !== last(this._undoStack)) {
            this._undoStack.push(JSON.stringify(this._selectedNotes));
        }
    };

    this._undo = function() {
        if (this._undoStack.length > 0) {
            var prevState = JSON.parse(this._undoStack.pop());
            for (var i = 0; i < 12; i++) {
                this._selectedNotes[i] = prevState[i];
            }

            this._resetNotes();
            this._setModeName()
        }
    };

    this._clear = function() {
        // "Unclick" every entry in the widget.

        this._saveState();

        for (var i = 1; i < 12; i++) {
            this._selectedNotes[i] = false;
        }

        this._resetNotes();
        this._setModeName()
    };

    this._calculateMode = function() {
        var currentMode = [];
        var table = docById('modeTable');
        var j = 1;
        for (var i = 1; i < 12; i++) {
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
        var table = docById('modeTable');
        var n = table.rows.length - 1;
        var currentMode = JSON.stringify(this._calculateMode());
        var currentKey = keySignatureToMode(this._logo.keySignature[0])[0];

        for (var mode in MUSICALMODES) {
            if (JSON.stringify(MUSICALMODES[mode]) === currentMode) {
                // Update the value of the modename block inside of
                // the mode widget block.
                if (this._modeBlock != null) {
                    console.log('setModeName:' + mode);
                    this._logo.blocks.blockList[this._modeBlock].value = mode;

                    this._logo.blocks.blockList[this._modeBlock].text.text = _(mode);
                    this._logo.blocks.blockList[this._modeBlock].updateCache();

                    this._logo.refreshCanvas();
                }

                table.rows[n].cells[0].innerHTML = currentKey + ' ' + _(mode);
                return;
            }
        }

        // console.log('setModeName:' + 'not found');
        table.rows[n].cells[0].innerHTML = '';
    };

    this._save = function() {
        var table = docById('modeTable');
        var n = table.rows.length - 1;

        // If the mode is not in the list, save it as the new custom mode.
        if (table.rows[n].cells[0].innerHTML === '') {
            customMode = this._calculateMode();
            console.log('custom mode: ' + customMode);
            storage.custommode = JSON.stringify(customMode);
        }

        var modeName = table.rows[n].cells[0].innerHTML;
        if (modeName === '') {
            modeName = _('custom');
        }

        // Save a stack of pitches to be used with the matrix.
        var newStack = [[0, ['action', {'collapsed': true}], 100, 100, [null, 1, 2, null]], [1, ['text', {'value': modeName}], 0, 0, [0]]];
        var endOfStackIdx = 0;
        var previousBlock = 0;

        var modeLength = this._calculateMode().length;
        var p = 0;

        for (var i = 0; i < 12; i++) {
            // Reverse the order so that Do is last.
            var j = 11 - i;
            if (!this._selectedNotes[j]) {
                continue;
            }

            p += 1;
            var pitch = NOTESTABLE[(j + 1) % 12];
            var octave = 4;
            console.log(pitch + ' ' + octave);

            var pitchidx = newStack.length;
            var notenameidx = pitchidx + 1;
            var octaveidx = pitchidx + 2;

            if (p === modeLength) {
                newStack.push([pitchidx, 'pitch', 0, 0, [previousBlock, notenameidx, octaveidx, null]]);
            } else {
                newStack.push([pitchidx, 'pitch', 0, 0, [previousBlock, notenameidx, octaveidx, pitchidx + 3]]);
            }
            newStack.push([notenameidx, ['solfege', {'value': pitch}], 0, 0, [pitchidx]]);
            newStack.push([octaveidx, ['number', {'value': octave}], 0, 0, [pitchidx]]);
            var previousBlock = pitchidx;
        }

        // Create a new stack for the chunk.
        console.log(newStack);
        this._logo.blocks.loadNewBlocks(newStack);
        this._logo.textMsg(_('New action block generated!'))

        // And save a stack of pitchnumbers to be used with the define mode
        var newStack = [[0, 'definemode', 150, 120, [null, 1, 3, 2]], [1, ['modename', {'value': modeName}], 0, 0, [0]], [2, 'hidden', 0, 0, [0, null]]];
        var endOfStackIdx = 0;
        var previousBlock = 0;

        var modeLength = this._calculateMode().length;
        var p = 0;

        for (var i = 0; i < 12; i++) {
            if (!this._selectedNotes[i]) {
                continue;
            }

            p += 1;
            var idx = newStack.length;

            if (p === modeLength) {
                newStack.push([idx, 'pitchnumber', 0, 0, [previousBlock, idx + 1, null]]);
            } else {
                newStack.push([idx, 'pitchnumber', 0, 0, [previousBlock, idx + 1, idx + 2]]);
            }

            newStack.push([idx + 1, ['number', {'value': i}], 0, 0, [idx]]);
            var previousBlock = idx;
        }

        // Create a new stack for the chunk.
        console.log(newStack);
        var that = this;
        setTimeout(function() {
            // that._logo.blocks.palettes.hide();
            that._logo.blocks.loadNewBlocks(newStack);
        }, 2000);
    };

    this._piemenuMode = function () {
        // pie menu for mode definition

        docById('meterWheelDiv').style.display = '';

        // Use advanced constructor for multiple wheelnavs in the same div.
        // The meterWheel is used to hold the half steps.
        this._modeWheel = new wheelnav('meterWheelDiv', null, 400, 400);
        // The selected notes are shown on this wheel
        this._noteWheel = new wheelnav('_noteWheel', this._modeWheel.raphael);
        // Play wheel is to show which note is playing at any one time.
        this._playWheel = new wheelnav('_playWheel', this._modeWheel.raphael);

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

        var labels = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
        var noteList = [];
        for (var i = 0; i < 12; i++) {
            noteList.push(labels[i]);
        }

        this._modeWheel.createWheel(noteList);

        this._noteWheel.colors = platformColor.noteValueWheelcolors; // modeWheelcolors;
        this._noteWheel.slicePathFunction = slicePath().DonutSlice;
        this._noteWheel.slicePathCustom = slicePath().DonutSliceCustomization();
        this._noteWheel.slicePathCustom.minRadiusPercent = 0.75;
        this._noteWheel.slicePathCustom.maxRadiusPercent = 0.90;
        this._noteWheel.sliceSelectedPathCustom = this._noteWheel.slicePathCustom;
        this._noteWheel.sliceInitPathCustom = this._noteWheel.slicePathCustom;
        this._noteWheel.clickModeRotate = false;
        this._noteWheel.navAngle = -90;
        this._noteWheel.titleRotateAngle = 90;

        var noteList = [' '];  // No X on first note, since we don't want to unselect it.
        this._selectedNotes = [true];  // The first note is always selected.
        for (var i = 1; i < 12; i++) {
            noteList.push('x');
            this._selectedNotes.push(false);
        }

        this._noteWheel.createWheel(noteList)

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

        var noteList = [];
        for (var i = 0; i < 12; i++) {
            noteList.push(' ');
        }

        this._playWheel.createWheel(noteList)

        for (var i = 0; i < 12; i++) {
            this._playWheel.navItems[i].navItem.hide();
        }

        var that = this;

        // If a modeWheel sector is selected, show the corresponding
        // note wheel sector.
        var __setNote = function () {
            var i = that._modeWheel.selectedNavItemIndex;
            that._saveState();
            that._selectedNotes[i] = true;
            that._noteWheel.navItems[i].navItem.show();
            that._playNote(i);
            that._setModeName();
        };

        // If a noteWheel sector is selected, hide it.
        var __clearNote = function () {
            var i = that._noteWheel.selectedNavItemIndex;
            if (i == 0) {
                return;  // Never hide the first note.
            }

            that._noteWheel.navItems[i].navItem.hide();
            that._saveState();
            that._selectedNotes[i] = false;
            that._setModeName();
        };

        for (var i = 0; i < 12; i++) {
            that._modeWheel.navItems[i].navigateFunction = __setNote;
            that._noteWheel.navItems[i].navigateFunction = __clearNote;
            // Start with all notes hidden.
            that._noteWheel.navItems[i].navItem.hide();
        }
    };
};
